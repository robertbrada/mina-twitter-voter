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
} from "@mantine/core";
import { IconCheck, IconLetterX } from "@tabler/icons";
import useStyles from "./VotingForm.styles";
import { MinaLogo } from "../MinaLogo/MinaLogo";
import type { Response } from "../../pages/api/twitter/[username]";
import type { ResponseString } from "../../pages/index";

interface VotingFormProps {
  error?: boolean;
}
export function VotingForm({ error = false, ...others }: VotingFormProps) {
  const { classes } = useStyles();
  const theme = useMantineTheme();

  return (
    <Stack pt={10}>
      {!error && (
        <Text size="sm" color="dimmed" mb={20}>
          Everything looks great! Vote for your favorite logo. The Voting
          Contract will check again if the data is coming from a trusted source.
        </Text>
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
          <Stack spacing="xs">
            <MinaLogo size={70} backgroundFill={theme.colors.pink[6]} />
            <Button
              size="xs"
              style={{ width: 70 }}
              color="pink"
              variant="light"
              disabled={error}
            >
              Vote
            </Button>
          </Stack>
        </Grid.Col>
        <Grid.Col span={1}>
          <Stack spacing="xs">
            <MinaLogo size={70} backgroundFill={theme.colors.violet[6]} />
            <Button
              size="xs"
              style={{ width: 70 }}
              color="violet"
              variant="light"
              disabled={error}
            >
              Vote
            </Button>
          </Stack>{" "}
        </Grid.Col>
        <Grid.Col span={1}>
          <Stack spacing="xs">
            <MinaLogo size={70} backgroundFill={theme.colors.teal[6]} />
            <Button
              size="xs"
              style={{ width: 70 }}
              color="teal"
              variant="light"
              disabled={error}
            >
              Vote
            </Button>
          </Stack>{" "}
        </Grid.Col>
      </Grid>
      {error && (
        <Alert color="pink">
          <Text color="pink" align="center">
            {
              "You can't vote. Some of the required conditions is not met. Check again the requirements."
            }
          </Text>
        </Alert>
      )}
    </Stack>
  );
}
