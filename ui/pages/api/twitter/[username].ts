// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import { TwitterApi } from "twitter-api-v2";
import { isReady, PrivateKey, Field, Signature, PublicKey } from "snarkyjs";
import type { NextApiRequest, NextApiResponse } from "next";

import type {
  Signature as SignatureType,
  PublicKey as PublicKeyType,
} from "snarkyjs";
import type {
  TwitterApiReadOnly as TwitterApiType,
  UserV2,
  UserFollowingV2Paginator,
  TwitterRateLimit,
} from "twitter-api-v2";

// Mina Twitter account ID
const MINA_TWITTER_ID = "991439317053591552";

export type Response = {
  data:
    | {
        userId: Field;
        targetId: Field;
        userFollowsTarget: Field;
        userTwitterKey: PublicKey | null;
      }
    | undefined;
  signature: SignatureType | undefined;
  publicKey: PublicKeyType | undefined;
  rateLimit: { limit: number; remaining: number; reset: number } | undefined;
  error: boolean;
  tooManyFollowers: boolean;
};

function getMinaAddressFromBio(bio: string) {
  // searching for this pattern: MINA-B62qiYfU916vWRHyfeNHMd36i9KfHVtdskZhNRwqupkp29UXiBTpwkx-MINA
  const pattern = /(?<=MINA-)[1-9A-HJ-NP-Za-km-z]{55}(?=-MINA)/i;
  const result = bio.match(pattern);

  return result ? result[0] : "";
}

async function getAllFollowings(client: TwitterApiType, userId: string) {
  // only max 100 followers returned per one request
  let nextPageToken: string | undefined = undefined;
  let followings: UserV2[] = [];
  let rateLimit: TwitterRateLimit | undefined;

  do {
    const resp: UserFollowingV2Paginator = await client.v2.following(userId, {
      asPaginator: true,
      pagination_token: nextPageToken,
    });

    nextPageToken = resp.meta.next_token;
    followings = followings.concat(resp["_realData"].data);
    rateLimit = resp["_rateLimit"];
  } while (nextPageToken);

  return { followings, rateLimit };
}

async function getSignedData(
  username: string,
  targetAccountId: string
): Promise<Response> {
  // We need to wait for SnarkyJS to finish loading before we can do anything
  await isReady;

  // The private key of our account
  const privateKey = PrivateKey.fromBase58(
    process.env.ORACLE_PRIVATE_KEY ?? ""
  );

  // Twitter bearer token
  const twitterBearerToken = process.env.TWITTER_BEARER_TOKEN ?? "";

  // We compute the public key associated with our private key
  const publicKey = privateKey.toPublicKey();

  // create twitter API client
  const twitterClient = new TwitterApi(twitterBearerToken);
  const readOnlyClient = twitterClient.readOnly;

  // get user twitter ID
  // Note: API request rate limit for user info can be ignored for now (900 per 15 minutes)
  const { data: user } = await readOnlyClient.v2.userByUsername(username, {
    "user.fields": ["description", "public_metrics"],
  });

  console.log("user", user);

  const followingCount = user.public_metrics?.following_count;

  let followings;
  let rateLimit;

  if (followingCount && followingCount > 1000) {
    return {
      data: undefined,
      signature: undefined,
      publicKey: undefined,
      rateLimit: undefined,
      tooManyFollowers: true,
      error: true,
    };
  }
  const resp = await getAllFollowings(readOnlyClient, user.id);

  followings = resp.followings;
  rateLimit = resp.rateLimit;

  if (!followings || !rateLimit) {
    return {
      data: undefined,
      signature: undefined,
      publicKey: undefined,
      rateLimit: undefined,
      tooManyFollowers: false,
      error: true,
    };
  }

  // search for target account in users' followings
  const targetAccount = followings.find((f) =>
    f !== undefined ? f.id === targetAccountId : false
  );

  // convert to snarky data types
  const userFollowsTarget = Field(targetAccount ? 1 : 0);
  const targetId = Field(targetAccountId);
  const userId = Field(user.id);
  const userBioMinaAddress = user.description
    ? getMinaAddressFromBio(user.description)
    : "";

  if (!userBioMinaAddress) {
    return {
      data: {
        userId: userId,
        targetId,
        userFollowsTarget,
        userTwitterKey: null,
      },
      signature: Signature.create(privateKey, [
        userId,
        targetId,
        userFollowsTarget,
        Field(0),
        Field(0),
      ]),
      publicKey: publicKey,
      rateLimit,
      error: false,
      tooManyFollowers: false,
    };
  }

  const userTwitterKey = PublicKey.fromBase58(userBioMinaAddress);
  const userTwitterKeyFields = userTwitterKey.toFields(); // returns two fields

  // sign data
  const signature = Signature.create(privateKey, [
    userId,
    targetId,
    userFollowsTarget,
    userTwitterKeyFields[0],
    userTwitterKeyFields[1],
  ]);

  return {
    data: {
      userId: userId,
      targetId,
      userFollowsTarget,
      userTwitterKey,
    },
    signature: signature,
    publicKey: publicKey,
    rateLimit,
    error: false,
    tooManyFollowers: false,
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Response | string>
) {
  // get username from url
  const { username } = req.query;

  if (typeof username === "string" && username.length > 0) {
    const response = await getSignedData(username, MINA_TWITTER_ID);
    res.status(200).json(response);
  } else {
    res.status(400).json("Invalid username");
  }
}
