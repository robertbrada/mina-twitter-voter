import { useState } from "react";
import {
  TextInput,
  Button,
  Group,
  Text,
  useMantineTheme,
  Stack,
  Grid,
  Anchor,
  Center,
} from "@mantine/core";
import { RateLimit } from "../components/RateLimit/RateLimit";
import { TwitterAccountInfo } from "../components/TwitterAccountInfo/TwitterAccountInfo";
import { VotingForm } from "../components/VotingForm/VotingForm";
import { PublicKey } from "snarkyjs";
// import type { Votes } from "./zkappWorkerClient";
import type { Votes } from "../workers/zkappWorkerClient";

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
  refreshingState: boolean;
  votes: Votes;
  onVote: any;
  onRefreshCurrentVotes: () => void;
}

export default function Home({
  loadingSnarky,
  onVote,
  creatingTransaction,
  votes,
  refreshingState,
  onRefreshCurrentVotes,
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

  const cannotVote = !data?.data.userFollowsTarget || !data.data.userTwitterKey;

  return (
    <Grid columns={2} gutter={100}>
      <Grid.Col span={1}>
        <Text weight={500} mb={10}>
          Hello, Voter!
        </Text>
        <Text size="sm">
          {"This app lets users who follow"}{" "}
          <Anchor
            href="https://twitter.com/MinaProtocol"
            rel="noreferrer"
            target="_blank"
          >
            {"Mina's Twitter account"}
          </Anchor>{" "}
          vote for their favorite Mina logo.{" "}
          {"We'are using Mina's smart contracts and oracles to do that."} Follow
          instructions below so we can verify your account:
        </Text>
        <ol style={{ paddingLeft: 20, marginTop: 30, marginBottom: 10 }}>
          <li>
            <Text weight={500} size="sm">
              Type your Mina address in your Twitter bio in the following
              format:
            </Text>
            <Text
              mt={10}
              size="sm"
              style={{
                padding: "8px 10px",
                borderRadius: theme.radius.sm,
                backgroundColor: theme.colors.gray[8],
                color: theme.colors.gray[0],
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
                Type your Twitter handle
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
                  gradient={{ from: "violet", to: "blue" }}
                  loading={loading}
                  disabled={!username.trim() || loadingSnarky}
                >
                  Check my profile
                </Button>
                <Text size="xs" color="dimmed">
                  {loadingSnarky && "Wait for SnarkyJS..."}
                </Text>
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
      <Grid.Col span={1} style={{ marginTop: 34 }}>
        {data ? (
          <>
            <TwitterAccountInfo data={data} error={error} />
            <Text weight={500} mt={40}>
              {cannotVote ? "You can't vote :(" : "Vote Here!"}
            </Text>
            <VotingForm
              error={cannotVote}
              loadingSnarky={loadingSnarky}
              creatingTransaction={creatingTransaction}
              votes={votes}
              refreshingState={refreshingState}
              onVote={(voteId: number) => handleOnVote(voteId)}
              onRefreshCurrentVotes={onRefreshCurrentVotes}
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
              Finish Twitter setup first
            </Text>
          </Center>
        )}
      </Grid.Col>
    </Grid>
  );
}
