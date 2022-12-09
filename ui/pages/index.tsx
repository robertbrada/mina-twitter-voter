import { useState } from "react";
import dayjs from "dayjs";
import type { Response } from "./api/twitter/[username]";

export default function Home() {
  const [username, setUsername] = useState("");
  const [data, setData] = useState<Response>();
  const [loading, setLoading] = useState(false);

  function handleTwitterChange(event: React.ChangeEvent<HTMLInputElement>) {
    setUsername(event.target.value);
  }

  async function getTwitterData(username: string) {
    console.log("username", username);
    setLoading(true);
    fetch(`/api/twitter/${username}`)
      .then((res) => res.json())
      .then((data) => {
        console.log("data", data);
        setData(data);
        setLoading(false);
      });
  }

  console.log("data", data);
  return (
    <div>
      <h1>Mina Twitter Voter</h1>
      <input
        type="text"
        value={username}
        onChange={handleTwitterChange}
        style={{ width: 200 }}
        placeholder="@minavoter"
      />
      <button onClick={() => getTwitterData(username)}>Get Twitter Data</button>
      <div className="requests-limit">
        Requests rate limit:
        <ul>
          <li>Max allowed (per 15 minutes): {data?.rateLimit.limit ?? "-"}</li>
          <li>Remaining: {data?.rateLimit.remaining ?? "-"}</li>
          <li>
            Resets at:{" "}
            {data?.rateLimit.reset
              ? dayjs(data?.rateLimit.reset * 1000).format("h:mm:ss A")
              : "-"}
          </li>
        </ul>
      </div>
    </div>
  );
}
