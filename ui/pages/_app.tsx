import "../styles/globals.css";
import type { AppProps } from "next/app";

export async function getServerSideProps() {
  console.log("getServerSideProps APP");
  return {
    props: {}, // will be passed to the page component as props
  };
}
export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <div>_APP PAGE</div>
      <Component {...pageProps} />
    </>
  );
}
