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
} from "@mantine/core";
import { IconCheck, IconLetterX } from "@tabler/icons";
import dayjs from "dayjs";
import useStyles from "./TwitterAccountInfo.styles";
import { truncate } from "../../utils/format";
import type { Response } from "../../pages/api/twitter/[username]";
import type { ResponseString } from "../../pages/index";

const exampleData = {
  data: {
    userId: "1491914803673280514",
    targetId: "991439317053591552",
    userFollowsTarget: "1",
    userTwitterKey: "B62qiYfU916vWRHyfeNHMd36i9KfHVtdskZhNRwqupkp29UXiBTpwkx",
  },
  signature: {
    r: "5904500768010812647750286499160847181799594659452062290323359817465168623559",
    s: "2360943628851461363281283404464175034926975344607958234175925313850384805333",
  },
  publicKey: "B62qp8ksPHoTnse3Uj2fjXttFT1ELQrwNNHv2VvVL6gZi9eHNyDX5Vb",
  error: false,
  rateLimit: {
    limit: 15,
    remaining: 13,
    reset: 1670664563,
  },
};

interface TwitterAccountInfoProps {
  data: ResponseString | undefined;
  error: boolean;
}
export function TwitterAccountInfo({
  data,
  error = false,
  ...others
}: TwitterAccountInfoProps) {
  const { classes } = useStyles();
  const theme = useMantineTheme();

  if ((data && data.error) || error) {
    return (
      <Alert>
        There was an issue while fetching data about your Twitter account
      </Alert>
    );
  }

  if (!data) {
    return <Text color="dimmed">Your Twitter data will appear here</Text>;
  }

  return (
    <Stack>
      <Text weight={500}>
        Okay, this is what oracle says about your Twitter profile:
      </Text>
      <Grid
        columns={3}
        gutter={4}
        style={{
          color: theme.colors.gray[9],
          fontSize: theme.fontSizes.sm,
          paddingTop: 0,
        }}
      >
        <Grid.Col span={1}>
          <Text>Your Mina address: </Text>
        </Grid.Col>
        <Grid.Col span={2}>
          <Text weight={500}>
            {data.data.userTwitterKey ? (
              truncate(data.data.userTwitterKey, 16, 16)
            ) : (
              <Group spacing={6}>
                <span>No address found</span>
                <ThemeIcon color="red" radius="xl" size="xs">
                  <IconLetterX strokeWidth={2.5} />
                </ThemeIcon>
              </Group>
            )}
          </Text>
        </Grid.Col>
        <Grid.Col span={1}>
          <Text>Following Mina: </Text>
        </Grid.Col>
        <Grid.Col span={2}>
          <Text weight={500}>
            {data.data.userFollowsTarget === "1" ? (
              <Group spacing={6}>
                <span>Yes!</span>
                <ThemeIcon color="teal" radius="xl" size="xs">
                  <IconCheck strokeWidth={2.5} />
                </ThemeIcon>
              </Group>
            ) : (
              <Group spacing={6}>
                <span>No</span>
                <ThemeIcon color="red" radius="xl" size="xs">
                  <IconLetterX strokeWidth={2.5} />
                </ThemeIcon>
              </Group>
            )}
          </Text>
        </Grid.Col>
      </Grid>
      <Stack
        spacing={4}
        style={{
          backgroundColor: theme.colors.gray[1],
          padding: theme.spacing.sm,
          borderRadius: theme.radius.sm,
          fontSize: theme.fontSizes.sm,
          wordBreak: "break-all",
          color: theme.colors.gray[7],
        }}
      >
        <Text size="xs" weight={500}>
          Oracle signature
        </Text>
        <Text size="xs">
          <b>r:</b> {data.signature.r}
        </Text>
        <Text size="xs">
          <b>s:</b> {data.signature.s}
        </Text>
      </Stack>
    </Stack>
  );
}
