import {
  Text,
  Stack,
  Group,
  Grid,
  useMantineTheme,
  ThemeIcon,
  Alert,
  Tooltip,
} from "@mantine/core";
import { IconCheck, IconLetterX } from "@tabler/icons";
import useStyles from "./TwitterAccountInfo.styles";
import type { ResponseString } from "../../pages/index";

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
    <Stack
      style={{
        backgroundColor: theme.colors.gray[1],
        padding: theme.spacing.sm,
        borderRadius: theme.radius.sm,
        fontSize: theme.fontSizes.sm,
        wordBreak: "break-all",
        // color: theme.colors.gray[7],
      }}
    >
      <Text
        weight={500}
        style={{
          borderBottom: `1px solid ${theme.colors.gray[3]}`,
          paddingBottom: 10,
        }}
      >
        Twitter Account Info
      </Text>
      <Grid
        columns={3}
        gutter={8}
        style={{
          color: theme.colors.gray[9],
          fontSize: theme.fontSizes.sm,
          paddingTop: 0,
        }}
      >
        <Grid.Col span={1}>
          <Text>Mina address in bio: </Text>
        </Grid.Col>
        <Grid.Col span={2}>
          <Tooltip label={data.data.userTwitterKey}>
            <Text
              weight={500}
              style={{
                textOverflow: "ellipsis",
                overflow: "hidden",
                whiteSpace: "nowrap",
                cursor: "default",
              }}
            >
              {data.data.userTwitterKey ? (
                // truncate(data.data.userTwitterKey, 16, 16)
                data.data.userTwitterKey
              ) : (
                <Group spacing={6}>
                  <span>No address found</span>
                  <ThemeIcon color="red" radius="xl" size="xs">
                    <IconLetterX strokeWidth={2.5} />
                  </ThemeIcon>
                </Group>
              )}
            </Text>
          </Tooltip>
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
          borderTop: `1px solid ${theme.colors.gray[3]}`,
          paddingTop: 10,
          color: theme.colors.gray[6],
        }}
      >
        <Text size="xs">
          <Text span weight={500}>
            Oracle public key:
          </Text>{" "}
          {data.publicKey}
        </Text>
        {/* <Text size="xs" weight={500}>
          Oracle signature
        </Text>
        <Text size="xs">
          <b>r:</b> {data.signature.r}
        </Text>
        <Text size="xs">
          <b>s:</b> {data.signature.s}
        </Text> */}
      </Stack>
    </Stack>
  );
}
