import React, { useEffect, useState } from "react";
import { PublicKey, PrivateKey, Field, Signature } from "snarkyjs";
import {
  Container,
  Title,
  Group,
  Anchor,
  Box,
  useMantineTheme,
} from "@mantine/core";
import { Logo } from "../components/Logo/Logo";
import "../styles/globals.css";
import type { AppProps } from "next/app";
import type { VoteParams, Votes } from "./zkappWorkerClient";

import ZkappWorkerClient from "./zkappWorkerClient";

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
  });

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
    setState({ ...state, creatingTransaction: true });
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

    setState({ ...state, creatingTransaction: false });
  };

  // -------------------------------------------------------
  // Refresh the current state

  const onRefreshCurrentVotes = async () => {
    console.log("getting zkApp state...");
    await state.zkappWorkerClient!.fetchAccount({
      publicKey: state.zkappPublicKey!,
    });
    const currentVotes = await state.zkappWorkerClient!.getVotes();

    setState({ ...state, currentVotes });
  };

  // -------------------------------------------------------
  // Create UI elements

  let hasWallet;
  if (state.hasWallet != null && !state.hasWallet) {
    hasWallet = (
      <div>
        {" "}
        Could not find a wallet.{" "}
        <Anchor
          href="https://www.aurowallet.com/"
          target="_blank"
          rel="noreferrer"
        >
          Install Auro wallet here
        </Anchor>
      </div>
    );
  }

  let setupText = state.hasBeenSetup
    ? "SnarkyJS Ready"
    : "Setting up SnarkyJS...";
  let setup = (
    <div>
      {" "}
      {setupText} {hasWallet}
    </div>
  );

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

  // let mainContent;
  // if (state.hasBeenSetup && state.accountExists) {
  //   mainContent = (
  //     <div>
  //       <div> Current Number in zkApp: {state.currentNum!.toString()} </div>
  //       <button onClick={onRefreshCurrentVotes}> Get Latest State </button>
  //     </div>
  //   );
  // }

  return (
    <Container size="xl" pt={40}>
      <Group mb={20}>
        <Logo size={60} />
        <Title size="h2">Mina Twitter Voter</Title>
      </Group>
      {setup}
      {accountDoesNotExist}
      {/* {mainContent} */}
      <Box
        sx={(theme) => ({
          borderTop: `1px solid ${theme.colors.gray[3]}`,
          paddingTop: 20,
          marginTop: 16,
        })}
      >
        <Component
          {...pageProps}
          senderPublicKey={state.publicKey}
          loadingSnarky={!state.hasBeenSetup}
          creatingTransaction={state.creatingTransaction}
          onVote={onVote}
          votes={state.currentVotes}
        />
      </Box>
    </Container>
  );
}
