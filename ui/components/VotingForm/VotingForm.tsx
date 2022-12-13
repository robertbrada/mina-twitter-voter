import {
  Select,
  Text,
  Stack,
  Group,
  Grid,
  useMantineTheme,
  Title,
  ThemeIcon,
  Alert,
  Button,
  Box,
} from "@mantine/core";
import { IconCheck, IconLetterX } from "@tabler/icons";
import useStyles from "./VotingForm.styles";
import { MinaLogo } from "../MinaLogo/MinaLogo";
import type { Response } from "../../pages/api/twitter/[username]";
import type { ResponseString } from "../../pages/index";
import type { VoteParams, Votes } from "../../pages/zkappWorkerClient";

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
      <Box>{currentVotes || "..."}</Box>
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
  onVote: (vodeId: number) => void;
}
export function VotingForm({
  error = false,
  loadingSnarky,
  creatingTransaction,
  votes,
  onVote,
  ...others
}: VotingFormProps) {
  const { classes } = useStyles();
  const theme = useMantineTheme();

  return (
    <Stack pt={10}>
      {!error && (
        <Stack spacing={8}>
          <Text size="sm" color="dimmed">
            Everything looks great!
          </Text>
          <Text size="sm" color="dimmed" mb={20}>
            If you click on <Text span weight={500}>{`"Vote"`}</Text>, the
            Voting Contract will check again that your Twitter data is coming
            from a trusted oracle and that you are the owner of provided Twitter
            account.
          </Text>
        </Stack>
      )}
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
            disabled={error || loadingSnarky}
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
            disabled={error || loadingSnarky}
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
            disabled={error || loadingSnarky}
            loading={creatingTransaction}
            voteId={1}
            onVote={onVote}
          />
        </Grid.Col>
      </Grid>
      {error && !loadingSnarky && (
        <Alert color="pink">
          <Text color="pink" align="center">
            {
              "You can't vote. Some of the required conditions is not met. Check again the requirements."
            }
          </Text>
        </Alert>
      )}
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
