import {
  Mina,
  isReady,
  PublicKey,
  PrivateKey,
  Field,
  fetchAccount,
  Signature,
  State,
  DeployArgs,
  SmartContract,
} from "snarkyjs";

type Transaction = Awaited<ReturnType<typeof Mina.transaction>>;

// import type { TwitterVoter } from "../../contracts/src/TwitterVoter";
import type { VoteParams } from "./zkappWorkerClient";

// ---------------------------------------------------------------------------------------
declare class TwitterVoter extends SmartContract {
  oraclePublicKey: State<PublicKey>;
  votesFor0: State<Field>;
  votesFor1: State<Field>;
  votesFor2: State<Field>;
  events: {
    verified: typeof Field;
    voted: typeof Field;
  };
  deploy(args: DeployArgs): void;
  verify(
    userId: Field,
    targetId: Field,
    userFollowsTarget: Field,
    twitterPublicKey: PublicKey,
    senderPublicKey: PublicKey,
    signature: Signature,
    voteOptionId: Field
  ): void;
}

const state = {
  TwitterVoter: null as null | typeof TwitterVoter,
  zkapp: null as null | TwitterVoter,
  transaction: null as null | Transaction,
};

// ---------------------------------------------------------------------------------------

const functions = {
  loadSnarkyJS: async (args: {}) => {
    await isReady;
  },
  setActiveInstanceToBerkeley: async (args: {}) => {
    const Berkeley = Mina.BerkeleyQANet(
      "https://proxy.berkeley.minaexplorer.com/graphql"
    );
    Mina.setActiveInstance(Berkeley);
  },
  loadContract: async (args: {}) => {
    // const { Add } = await import("../../contracts/build/src/Add.js");
    const { TwitterVoter } = await import("./TwitterVoter.js");
    state.TwitterVoter = TwitterVoter;
  },
  compileContract: async (args: {}) => {
    await state.TwitterVoter!.compile();
  },
  fetchAccount: async (args: { publicKey58: string }) => {
    const publicKey = PublicKey.fromBase58(args.publicKey58);
    return await fetchAccount({ publicKey });
  },
  initZkappInstance: async (args: { publicKey58: string }) => {
    const publicKey = PublicKey.fromBase58(args.publicKey58);
    state.zkapp = new state.TwitterVoter!(publicKey);
  },

  getVotes: async (args: {}) => {
    const votesFor0 = await state.zkapp!.votesFor0.get();
    const votesFor1 = await state.zkapp!.votesFor1.get();
    const votesFor2 = await state.zkapp!.votesFor2.get();

    return JSON.stringify({
      votesFor0: votesFor0.toJSON(),
      votesFor1: votesFor1.toJSON(),
      votesFor2: votesFor2.toJSON(),
    });
  },
  createVoteTransaction: async (args: VoteParams) => {
    console.log("zkappWorker createVoteTransaction()");

    // Make the conversion to SnarkyJS types here otherwise weird error might occur (e.g. "PublicKey.toFields() is not a function")
    const transaction = await Mina.transaction(() => {
      state.zkapp!.verify(
        Field(args.userId),
        Field(args.targetId),
        Field(args.userFollowsTarget),
        PublicKey.fromBase58(args.twitterPublicKey),
        PublicKey.fromBase58(args.senderPublicKey),
        Signature.fromJSON(args.signature),
        Field(args.voteOptionId)
      );
    });
    state.transaction = transaction;
  },
  proveUpdateTransaction: async (args: {}) => {
    await state.transaction!.prove();
  },
  getTransactionJSON: async (args: {}) => {
    return state.transaction!.toJSON();
  },
};

// ---------------------------------------------------------------------------------------

export type WorkerFunctions = keyof typeof functions;

export type ZkappWorkerRequest = {
  id: number;
  fn: WorkerFunctions;
  args: any;
};

export type ZkappWorkerReponse = {
  id: number;
  data: any;
};
if (process.browser) {
  addEventListener(
    "message",
    async (event: MessageEvent<ZkappWorkerRequest>) => {
      const returnData = await functions[event.data.fn](event.data.args);

      const message: ZkappWorkerReponse = {
        id: event.data.id,
        data: returnData,
      };
      postMessage(message);
    }
  );
}
