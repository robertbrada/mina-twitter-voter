import {
  Select,
  Text,
  Stack,
  Group,
  Grid,
  useMantineTheme,
} from "@mantine/core";
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
  const { classes } = useStyles();
  const theme = useMantineTheme();

  return (
    <Grid
      columns={5}
      gutter={0}
      style={{
        color: theme.colors.gray[6],
        fontSize: theme.fontSizes.xs,
        // borderTop: `1px solid ${theme.colors.gray[3]}`,
        // paddingTop: 14,
        paddingLeft: 20,
        fontWeight: 300,
      }}
    >
      <Grid.Col span={1}>
        <Text>Requests limit: </Text>
      </Grid.Col>
      <Grid.Col span={4}>
        <Text>
          Max {max ?? "-"} requests per {timeWindowSeconds / 60} minutes
        </Text>
      </Grid.Col>
      <Grid.Col span={1}>
        <Text>Remaining: </Text>
      </Grid.Col>
      <Grid.Col span={4}>{remaining ?? "-"}</Grid.Col>
      <Grid.Col span={1}>
        <Text>Resets: </Text>
      </Grid.Col>
      <Grid.Col span={4}>
        {resetTimestamp ? dayjs(resetTimestamp).format("h:mm:ss A") : "-"}
      </Grid.Col>
    </Grid>
  );
}
