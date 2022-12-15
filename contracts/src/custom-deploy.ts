/**
 * This is an example for interacting with the Berkeley QANet, directly from snarkyjs.
 *
 * At a high level, it does the following:
 * -) try fetching the account corresponding to the `zkappAddress` from chain
 * -) if the account doesn't exist or is not a zkapp account yet, deploy a zkapp to it and initialize on-chain state
 */

import {
  PrivateKey,
  Mina,
  AccountUpdate,
  isReady,
  shutdown,
  fetchAccount,
} from 'snarkyjs';

import { TwitterVoter } from './index.js';
import { privateKeys } from '../keys/deploy.js';

await isReady;

const keys = privateKeys['version-2'];
// you can use this with any spec-compliant graphql endpoint
let Berkeley = Mina.Network('https://proxy.berkeley.minaexplorer.com/graphql');
Mina.setActiveInstance(Berkeley);

// to use this test, change this private key to an account which has enough MINA to pay fees
let feePayerKey = PrivateKey.fromBase58(keys.feePayer);
let response = await fetchAccount({ publicKey: feePayerKey.toPublicKey() });
if (response.error) throw Error(response.error.statusText);
let { nonce, balance } = response.account;
console.log(`Using fee payer account with nonce ${nonce}, balance ${balance}`);

let zkappKey = PrivateKey.fromBase58(keys.zkApp);
let zkappAddress = zkappKey.toPublicKey();
console.log('zkappAddress', zkappAddress.toBase58());

let transactionFee = 1_000_000_000; // 1 MINA

// compile the SmartContract to get the verification key (if deploying) or cache the provers (if updating)
// this can take a while...
console.log('Compiling smart contract...');
let { verificationKey } = await TwitterVoter.compile();

// check if the zkapp is already deployed, based on whether the account exists and its first zkapp state is != 0
let zkapp = new TwitterVoter(zkappAddress);
let votesFor0 = await zkapp.votesFor0.fetch();
let votesFor1 = await zkapp.votesFor1.fetch();
let votesFor2 = await zkapp.votesFor2.fetch();

// This should probably check for any number not just 0
let isDeployed =
  (votesFor0?.equals(0).toBoolean() &&
    votesFor1?.equals(0).toBoolean() &&
    votesFor2?.equals(0).toBoolean()) ??
  false;

console.log('votesFor0', votesFor0?.toString());
console.log('votesFor1', votesFor1?.toString());
console.log('votesFor2', votesFor2?.toString());

// if the zkapp is not deployed yet, create a deploy transaction
if (!isDeployed) {
  console.log(`Deploying zkapp for public key ${zkappAddress.toBase58()}.`);
  // the `transaction()` interface is the same as when testing with a local blockchain
  let transaction = await Mina.transaction(
    { feePayerKey, fee: transactionFee },
    () => {
      AccountUpdate.fundNewAccount(feePayerKey);
      zkapp.deploy({ zkappKey, verificationKey });
    }
  );
  // if you want to inspect the transaction, you can print it out:
  console.log(transaction.toGraphqlQuery());

  // send the transaction to the graphql endpoint
  console.log('Sending the transaction...');
  await transaction.send();
}

// if the zkapp is not deployed yet, create an update transaction
if (isDeployed) {
  console.log('Is Deployed');
}

shutdown();
