import { Text, Grid, useMantineTheme } from "@mantine/core";
import dayjs from "dayjs";
import useStyles from "./RateLimit.styles";

interface RateLimitProps {
  max: number | undefined;
  timeWindowSeconds: number;
  remaining: number | undefined;
  resetTimestamp: number | undefined;
}
export function RateLimit({
  max,
  timeWindowSeconds,
  remaining,
  resetTimestamp,
  ...others
}: RateLimitProps) {
  const theme = useMantineTheme();

  return (
    <Grid
      columns={4}
      gutter={2}
      style={{
        color: theme.colors.gray[6],
        fontSize: theme.fontSizes.xs,
        borderTop: `1px solid ${theme.colors.gray[1]}`,
        paddingTop: 20,
        paddingLeft: 20,
        fontWeight: 300,
      }}
    >
      <Grid.Col span={1}>
        <Text>Requests limit: </Text>
      </Grid.Col>
      <Grid.Col span={3}>
        <Text>
          Max {max ?? "-"} requests per {timeWindowSeconds / 60} minutes
        </Text>
      </Grid.Col>
      <Grid.Col span={1}>
        <Text>Remaining: </Text>
      </Grid.Col>
      <Grid.Col span={3}>{remaining ?? "-"} (1 request per each 100 followings is made)</Grid.Col>
      <Grid.Col span={1}>
        <Text>Resets: </Text>
      </Grid.Col>
      <Grid.Col span={3}>
        {resetTimestamp ? dayjs(resetTimestamp).format("h:mm:ss A") : "-"}
      </Grid.Col>
    </Grid>
  );
}
