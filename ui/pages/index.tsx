import { useState } from "react";
import {
  TextInput,
  Button,
  Group,
  Title,
  Text,
  useMantineTheme,
  Space,
  Stack,
  Grid,
  Anchor,
  Box,
  Alert,
  Center,
} from "@mantine/core";
import { RateLimit } from "../components/RateLimit/RateLimit";
import { TwitterAccountInfo } from "../components/TwitterAccountInfo/TwitterAccountInfo";
import { VotingForm } from "../components/VotingForm/VotingForm";
import type { Response } from "./api/twitter/[username]";
import { PublicKey, PrivateKey, Field, Signature } from "snarkyjs";
import type { VoteParams, Votes } from "./zkappWorkerClient";

export interface ResponseString {
  data: {
    userId: string;
    targetId: string;
    userFollowsTarget: string;
    userTwitterKey: string | null;
  };
  signature: {
    r: string;
    s: string;
  };
  publicKey: string;
  error: boolean;
  rateLimit: { limit: number; remaining: number; reset: number };
}

function formatUsername(username: string) {
  // check if the user starts with "@". If yes, remove it
  if (username.charAt(0) === "@") return username.substring(1);
  return username;
}

interface PageProps {
  senderPublicKey: PublicKey;
  loadingSnarky: boolean;
  creatingTransaction: boolean;
  votes: Votes;
  onVote: any;
}

export default function Home({
  loadingSnarky,
  onVote,
  creatingTransaction,
  votes,
}: PageProps) {
  const theme = useMantineTheme();

  const [username, setUsername] = useState("");
  const [data, setData] = useState<ResponseString>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  function handleTwitterChange(event: React.ChangeEvent<HTMLInputElement>) {
    setUsername(event.target.value);
  }

  async function getTwitterData(username: string) {
    console.log("username", username);
    setError(false);
    setLoading(true);
    try {
      fetch(`/api/twitter/${formatUsername(username)}`)
        .then((res) => res.json())
        .then((data) => {
          setData(data);
          setLoading(false);
          console.log("data", data);
        });
    } catch (e) {
      console.log("Error getting data", e);
      setError(true);
    }
  }

  async function handleOnVote(voteId: number) {
    console.log("index.tsx handleOnVote(), voteId: ", voteId);
    if (!data || !data.data.userTwitterKey) return;

    onVote(
      data.data.userId,
      data.data.targetId,
      data.data.userFollowsTarget,
      data.data.userTwitterKey,
      data.signature,
      voteId
    );
  }

  return (
    <Grid columns={2} gutter={80}>
      <Grid.Col span={1}>
        <Text weight={500} mb={10}>
          Hello Stranger,
        </Text>
        <Text size="sm">
          In this app you can vote for your favorite Mina logo using
          Zero-Knowledge profs. But there is one caveat. Only users following{" "}
          <Anchor
            href="https://twitter.com/MinaProtocol"
            rel="noreferrer"
            target="_blank"
          >
            Mina
          </Anchor>{" "}
          on Twitter can do that. I need a favor from you in order to verify
          your profile:
        </Text>
        <ol style={{ paddingLeft: 20, marginTop: 30 }}>
          <li>
            <Text weight={500} size="sm">
              Type your Mina address in your Twitter bio in the following
              format:
            </Text>
            <Text
              mt={10}
              size="sm"
              style={{
                padding: "10px 16px",
                borderRadius: theme.radius.sm,
                backgroundColor: theme.colors.gray[1],
                color: theme.colors.gray[7],
                wordBreak: "break-all",
                width: "fit-content",
              }}
            >
              MINA-B62qiYfU916vWRHyfeNHMd36i9KfHVtdskZhNRwqupkp29UXiBTpwkx-MINA
            </Text>
          </li>
          <li>
            <Stack mt={30} spacing="xs">
              <Text weight={500} size="sm">
                Input your Twitter handle and check
              </Text>
              <Group mb={20}>
                <TextInput
                  type="text"
                  value={username}
                  onChange={handleTwitterChange}
                  style={{ width: 240 }}
                  placeholder="Twitter handle"
                  sx={(theme) => ({
                    input: {
                      backgroundColor: theme.colors.gray[0],
                    },
                  })}
                />
                <Button
                  onClick={() => getTwitterData(username)}
                  variant="gradient"
                  gradient={{ from: "grape", to: "blue" }}
                  loading={loading}
                  disabled={!username.trim()}
                >
                  Check my profile
                </Button>
              </Group>
            </Stack>
          </li>
        </ol>
        <RateLimit
          max={data?.rateLimit.limit}
          timeWindowSeconds={15 * 60}
          remaining={data?.rateLimit.remaining}
          resetTimestamp={data ? data.rateLimit.reset * 1000 : undefined}
        />
      </Grid.Col>
      <Grid.Col span={1}>
        {data ? (
          <>
            <TwitterAccountInfo data={data} error={error} />
            <Text weight={500} mt={40}>
              Voting Form
            </Text>
            <VotingForm
              error={!data?.data.userFollowsTarget || !data.data.userTwitterKey}
              loadingSnarky={loadingSnarky}
              creatingTransaction={creatingTransaction}
              onVote={(voteId: number) => handleOnVote(voteId)}
              votes={votes}
            />
          </>
        ) : (
          <Center
            style={{
              backgroundColor: theme.colors.gray[0],
              height: "100%",
              borderRadius: theme.radius.sm,
            }}
          >
            <Text color="dimmed" size="sm">
              Finish your Twitter setup first
            </Text>
          </Center>
        )}
      </Grid.Col>
    </Grid>
  );
}
