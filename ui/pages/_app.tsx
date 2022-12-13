import React, { useEffect, useState } from "react";
import { PublicKey } from "snarkyjs";
import {
  Container,
  Title,
  Group,
  Anchor,
  Box,
  Text,
  Loader,
  ThemeIcon,
  Modal,
  Button,
  Alert,
} from "@mantine/core";
import { IconCheck, IconExternalLink } from "@tabler/icons";
import { Logo } from "../components/Logo/Logo";
import "../styles/globals.css";
import type { AppProps } from "next/app";
// import type { Votes } from "./zkappWorkerClient";
// import ZkappWorkerClient from "./zkappWorkerClient";
import ZkappWorkerClient from "../workers/zkappWorkerClient";
import type { Votes } from "../workers/zkappWorkerClient";

let transactionFee = 0.2;

export async function getServerSideProps() {
  console.log("getServerSideProps APP");
  return {
    props: {}, // will be passed to the page component as props
  };
}

export default function App({ Component, pageProps }: AppProps) {
  let [state, setState] = useState({
    zkappWorkerClient: null as null | ZkappWorkerClient,
    hasWallet: null as null | boolean,
    hasBeenSetup: false,
    accountExists: false,
    currentVotes: null as null | Votes,
    publicKey: null as null | PublicKey,
    zkappPublicKey: null as null | PublicKey,
    creatingTransaction: false,
    refreshingState: false,
    txHash: "",
  });
  const [txModalOpened, setTxModalOpened] = useState(false);

  useEffect(() => {
    (async () => {
      if (!state.hasBeenSetup) {
        const zkappWorkerClient = new ZkappWorkerClient();
        console.log("Loading SnarkyJS...");
        await zkappWorkerClient.loadSnarkyJS();
        console.log("done");
        await zkappWorkerClient.setActiveInstanceToBerkeley();
        const mina = (window as any).mina;
        if (mina == null) {
          setState({ ...state, hasWallet: false });
          return;
        }
        const publicKeyBase58: string = (await mina.requestAccounts())[0];
        const publicKey = PublicKey.fromBase58(publicKeyBase58);
        console.log("using key", publicKey.toBase58());
        console.log("checking if account exists...");
        const res = await zkappWorkerClient.fetchAccount({
          publicKey: publicKey!,
        });
        console.log("publicKeyBase58", publicKeyBase58);
        const accountExists = res.error == null;
        await zkappWorkerClient.loadContract();
        console.log("compiling zkApp");
        await zkappWorkerClient.compileContract();
        console.log("zkApp compiled");
        const zkappPublicKey = PublicKey.fromBase58(
          "B62qk1ZDZT37Lf292rnrRvn6przMaZ37tzeMrQy2519Bmn9bLVMdcwy"
        );
        await zkappWorkerClient.initZkappInstance(zkappPublicKey);
        console.log("getting zkApp state...");
        await zkappWorkerClient.fetchAccount({ publicKey: zkappPublicKey });
        const currentVotes = await zkappWorkerClient.getVotes();
        console.log("current votes:", currentVotes.toString());
        setState({
          ...state,
          zkappWorkerClient,
          hasWallet: true,
          hasBeenSetup: true,
          publicKey,
          zkappPublicKey,
          accountExists,
          currentVotes,
        });
      }
    })();
  }, []);
  // -------------------------------------------------------
  // Send a transaction

  const onVote = async (
    userId: string,
    targetId: string,
    userFollowsTarget: string,
    twitterPublicKey: string,
    signature: {
      r: string;
      s: string;
    },
    voteOptionId: number
  ) => {
    console.log("_app.tsx onVote()");
    setState({ ...state, creatingTransaction: true, txHash: "" });
    console.log("sending a transaction...");

    if (!state.publicKey) return;
    await state.zkappWorkerClient!.fetchAccount({
      publicKey: state.publicKey!,
    });

    console.log("Sender's public key OK");

    await state.zkappWorkerClient!.createVoteTransaction({
      userId,
      targetId,
      userFollowsTarget,
      twitterPublicKey,
      senderPublicKey: state.publicKey.toBase58(),
      signature,
      voteOptionId,
    });

    console.log("creating proof...");
    await state.zkappWorkerClient!.proveUpdateTransaction();

    console.log("getting Transaction JSON...");
    const transactionJSON = await state.zkappWorkerClient!.getTransactionJSON();

    console.log("requesting send transaction...");
    const { hash } = await (window as any).mina.sendTransaction({
      transaction: transactionJSON,
      feePayer: {
        fee: transactionFee,
        memo: "",
      },
    });

    console.log(
      "See transaction at https://berkeley.minaexplorer.com/transaction/" + hash
    );

    setState({ ...state, creatingTransaction: false, txHash: hash });
    setTxModalOpened(true);
  };

  // -------------------------------------------------------
  // Refresh the current state

  const onRefreshCurrentVotes = async () => {
    console.log("getting zkApp state...");
    setState({ ...state, refreshingState: true });
    await state.zkappWorkerClient!.fetchAccount({
      publicKey: state.zkappPublicKey!,
    });
    const currentVotes = await state.zkappWorkerClient!.getVotes();

    setState({ ...state, currentVotes, refreshingState: false });
  };

  // -------------------------------------------------------
  // Create UI elements

  let hasWallet;
  if (state.hasWallet != null && !state.hasWallet) {
    hasWallet = (
      <Alert color="indigo" mb={30}>
        <Text span color="indigo" weight={300}>
          Could not find a wallet.
        </Text>{" "}
        <Anchor
          color="indigo"
          href="https://www.aurowallet.com/"
          target="_blank"
          rel="noreferrer"
        >
          <Text span weight={600}>
            Install Auro wallet here
          </Text>
          .
        </Anchor>
      </Alert>
    );
  }

  let accountDoesNotExist;
  if (state.hasBeenSetup && !state.accountExists) {
    const faucetLink =
      "https://faucet.minaprotocol.com/?address=" + state.publicKey!.toBase58();
    accountDoesNotExist = (
      <div>
        Account does not exist. Please visit the faucet to fund this account
        <a href={faucetLink} target="_blank" rel="noreferrer">
          {" "}
          [Link]{" "}
        </a>
      </div>
    );
  }

  return (
    <Container size="xl" pt={40}>
      <Group mb={40} position="apart">
        <Logo size={180} />
        <>
          {state.hasBeenSetup ? (
            <Group spacing={6}>
              <ThemeIcon color="teal" radius="xl" size="xs">
                <IconCheck strokeWidth={2.5} />
              </ThemeIcon>
              <Text span size="sm" color="dimmed">
                SnarkyJS Ready!
              </Text>
            </Group>
          ) : (
            <Group spacing={6}>
              <Loader color="gray" size="xs" />
              <Text span size="sm" color="dimmed">
                Loading SnarkyJS
              </Text>
            </Group>
          )}
        </>
      </Group>
      {hasWallet}
      <Box>
        <Component
          {...pageProps}
          senderPublicKey={state.publicKey}
          loadingSnarky={!state.hasBeenSetup}
          creatingTransaction={state.creatingTransaction}
          votes={state.currentVotes}
          refreshingState={state.refreshingState}
          onVote={onVote}
          onRefreshCurrentVotes={onRefreshCurrentVotes}
        />
      </Box>
      <Modal
        size="sm"
        opened={txModalOpened}
        onClose={() => setTxModalOpened(false)}
        title={
          <Title order={2} size="h4">
            Transaction is on the way!
          </Title>
        }
      >
        <Button
          component="a"
          href={"https://berkeley.minaexplorer.com/transaction/" + state.txHash}
          target="_blank"
          rel="noreferrer"
          color="indigo"
        >
          <Group spacing={6}>
            <Text span>View at Mina Explorer</Text>
            <IconExternalLink size={18} />
          </Group>
        </Button>
      </Modal>
    </Container>
  );
}
