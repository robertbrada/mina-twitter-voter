import { useState } from "react";
import {
  Text,
  Stack,
  Grid,
  useMantineTheme,
  Alert,
  Button,
  Checkbox,
  UnstyledButton,
  Loader,
} from "@mantine/core";
import useStyles from "./VotingForm.styles";
import { MinaLogo } from "../MinaLogo/MinaLogo";
// import type { Votes } from "../../pages/zkappWorkerClient";
import type { Votes } from "../../workers/zkappWorkerClient";

interface VotingOptionProps {
  currentVotes: string;
  logoColor: string;
  buttonColor: string;
  loading: boolean;
  disabled: boolean;
  voteId: number;
  onVote: (vodeId: number) => void;
}

function VotingOption({
  currentVotes,
  logoColor,
  buttonColor,
  loading,
  disabled,
  voteId,
  onVote,
}: VotingOptionProps) {
  return (
    <Stack spacing="xs" align="center">
      <Text>{currentVotes || "..."}</Text>
      <MinaLogo size={60} backgroundFill={logoColor} />
      <Button
        size="xs"
        style={{ width: 60 }}
        color={buttonColor}
        variant="light"
        disabled={disabled}
        loading={loading}
        onClick={() => onVote(voteId)}
      >
        {!loading && "Vote"}
      </Button>
    </Stack>
  );
}
interface VotingFormProps {
  error?: boolean;
  loadingSnarky: boolean;
  creatingTransaction: boolean;
  votes: Votes | null;
  refreshingState: boolean;
  onVote: (vodeId: number) => void;
  onRefreshCurrentVotes: () => void;
}
export function VotingForm({
  error = false,
  loadingSnarky,
  creatingTransaction,
  votes,
  refreshingState,
  onVote,
  onRefreshCurrentVotes,
  ...others
}: VotingFormProps) {
  const { classes } = useStyles();
  const theme = useMantineTheme();
  const [ignoreError, setIgnoreError] = useState(false);

  return (
    <Stack pt={10}>
      {!error && (
        <Stack spacing={8}>
          <Text span size="sm" color="dimmed" mb={10}>
            Looks great! Clicking on <Text span weight={500}>{`"Vote"`}</Text>{" "}
            calls the Voting Contract. It will check that information about your
            Twitter account comes from a trusted oracle and that you are the
            owner of the public key shared in your bio.
          </Text>
        </Stack>
      )}
      {error && !loadingSnarky && (
        <Stack spacing={8}>
          <Text span size="sm" color="dimmed" mb={20}>
            {
              "Some of the required conditions is not met. Check again that you follow Mina on Twitter and that your Mina address is in your Bio."
            }
            <Checkbox
              size="xs"
              mt={20}
              label={
                <Text color="dimmed">
                  Ignore UI warnings and try to send transaction anyways
                </Text>
              }
              checked={ignoreError}
              onChange={(event) => setIgnoreError(event.currentTarget.checked)}
            />
          </Text>
        </Stack>

        // <Alert color="pink">
        //   <Text color="pink" align="center">
        //     {
        //       "You can't vote. Some of the required conditions is not met. Check again the requirements."
        //     }
        //   </Text>
        // </Alert>
      )}
      <Text align="center" size={13} color="dimmed" weight={400} mb={10}>
        Current Votes{" "}
        <UnstyledButton
          color="gray"
          onClick={onRefreshCurrentVotes}
          disabled={refreshingState}
        >
          <Text color="indigo" size="xs">
            ({refreshingState ? <Loader size={10} color="indigo" /> : "Refresh"}
            )
          </Text>
        </UnstyledButton>
        :
      </Text>
      <Grid
        columns={3}
        gutter={4}
        style={{
          color: theme.colors.gray[9],
          fontSize: theme.fontSizes.sm,
          paddingTop: 0,
          width: 360,
          margin: "0 auto",
        }}
      >
        <Grid.Col span={1}>
          <VotingOption
            logoColor={theme.colors.pink[6]}
            buttonColor="pink"
            currentVotes={votes?.votesFor0 ?? ""}
            disabled={(error || loadingSnarky) && !ignoreError}
            loading={creatingTransaction}
            voteId={0}
            onVote={onVote}
          />
        </Grid.Col>
        <Grid.Col span={1}>
          <VotingOption
            logoColor={theme.colors.violet[6]}
            buttonColor="violet"
            currentVotes={votes?.votesFor1 ?? ""}
            disabled={(error || loadingSnarky) && !ignoreError}
            loading={creatingTransaction}
            voteId={1}
            onVote={onVote}
          />
        </Grid.Col>
        <Grid.Col span={1}>
          <VotingOption
            logoColor={theme.colors.teal[6]}
            buttonColor="teal"
            currentVotes={votes?.votesFor2 ?? ""}
            disabled={(error || loadingSnarky) && !ignoreError}
            loading={creatingTransaction}
            voteId={1}
            onVote={onVote}
          />
        </Grid.Col>
      </Grid>
      {loadingSnarky && (
        <Alert color="indigo">
          <Text color="indigo" align="center">
            Wait please, loading SnarkyJS...
          </Text>
        </Alert>
      )}
    </Stack>
  );
}
