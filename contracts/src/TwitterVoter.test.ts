import { TwitterVoter } from './TwitterVoter';
import {
  isReady,
  shutdown,
  Field,
  Mina,
  PrivateKey,
  PublicKey,
  AccountUpdate,
  Signature,
} from 'snarkyjs';

function fail(reason = 'fail was called in a test.') {
  throw new Error(reason);
}

// The public key of our trusted data provider
const ORACLE_PUBLIC_KEY =
  'B62qp8ksPHoTnse3Uj2fjXttFT1ELQrwNNHv2VvVL6gZi9eHNyDX5Vb';

let proofsEnabled = false;
function createLocalBlockchain() {
  const Local = Mina.LocalBlockchain({ proofsEnabled });
  Mina.setActiveInstance(Local);
  return Local.testAccounts[0].privateKey;
}

async function localDeploy(
  zkAppInstance: TwitterVoter,
  zkAppPrivatekey: PrivateKey,
  deployerAccount: PrivateKey
) {
  const txn = await Mina.transaction(deployerAccount, () => {
    AccountUpdate.fundNewAccount(deployerAccount);
    zkAppInstance.deploy({ zkappKey: zkAppPrivatekey });
    zkAppInstance.init(zkAppPrivatekey);
  });
  await txn.prove();
  txn.sign([zkAppPrivatekey]);
  await txn.send();
}

describe('TwitterVoter', () => {
  let deployerAccount: PrivateKey,
    zkAppAddress: PublicKey,
    zkAppPrivateKey: PrivateKey;

  beforeAll(async () => {
    await isReady;
    if (proofsEnabled) TwitterVoter.compile();
  });

  beforeEach(async () => {
    deployerAccount = createLocalBlockchain();
    zkAppPrivateKey = PrivateKey.random();
    zkAppAddress = zkAppPrivateKey.toPublicKey();
  });

  afterAll(async () => {
    // `shutdown()` internally calls `process.exit()` which will exit the running Jest process early.
    // Specifying a timeout of 0 is a workaround to defer `shutdown()` until Jest is done running all tests.
    // This should be fixed with https://github.com/MinaProtocol/mina/issues/10943
    setTimeout(shutdown, 0);
  });

  it('generates and deploys the `TwitterVoter` smart contract', async () => {
    const zkAppInstance = new TwitterVoter(zkAppAddress);
    await localDeploy(zkAppInstance, zkAppPrivateKey, deployerAccount);
    const oraclePublicKey = zkAppInstance.oraclePublicKey.get();
    console.log('oraclePublicKey', oraclePublicKey.toBase58());
    console.log('ORACLE_PUBLIC_KEY', ORACLE_PUBLIC_KEY);
    expect(oraclePublicKey).toEqual(PublicKey.fromBase58(ORACLE_PUBLIC_KEY));
  });

  describe('hardcoded values', () => {
    it('emits an `id` event containing the users id if they follow target on Twitter and the provided signature is valid', async () => {
      const zkAppInstance = new TwitterVoter(zkAppAddress);
      await localDeploy(zkAppInstance, zkAppPrivateKey, deployerAccount);

      const userId = Field('1491914803673280514');
      const targetId = Field('991439317053591552');
      const userFollowsTarget = Field('1');
      const twitterPublicKey = PublicKey.fromBase58(
        'B62qiYfU916vWRHyfeNHMd36i9KfHVtdskZhNRwqupkp29UXiBTpwkx'
      );
      const senderPublicKey = PublicKey.fromBase58(
        'B62qiYfU916vWRHyfeNHMd36i9KfHVtdskZhNRwqupkp29UXiBTpwkx'
      );
      // const userTwitterKeyFields = userTwitterKey.toFields(); // returns two fields
      const signature = Signature.fromJSON({
        r: '3544579994968088233722868457788048448256662568571042649880934162268337908579',
        s: '3058690412518303358561297679821075198650982917450249224066488020262592243224',
      });
      const voteOptionId = Field(2);

      const txn = await Mina.transaction(deployerAccount, () => {
        zkAppInstance.verify(
          userId,
          targetId,
          userFollowsTarget,
          twitterPublicKey,
          senderPublicKey,
          signature ?? fail('something is wrong with the signature'),
          voteOptionId
        );
      });
      await txn.prove();
      await txn.send();

      // check events are fired accordingly
      const events = await zkAppInstance.fetchEvents();
      const verifiedEventValue = events[1].event.toFields(null)[0];
      const votedEventValue = events[0].event.toFields(null)[0];
      expect(verifiedEventValue).toEqual(userId);
      expect(votedEventValue).toEqual(userId);

      // check votes changed accordingly
      expect(zkAppInstance.votesFor0.get()).toEqual(Field(0));
      expect(zkAppInstance.votesFor1.get()).toEqual(Field(0));
      expect(zkAppInstance.votesFor2.get()).toEqual(Field(1));
    });

    it('throws an error if the senders public key and public key on twitter do not match, even if the provided signature is valid and requirement are mt', async () => {
      const zkAppInstance = new TwitterVoter(zkAppAddress);
      await localDeploy(zkAppInstance, zkAppPrivateKey, deployerAccount);

      const userId = Field('1491914803673280514');
      const targetId = Field('991439317053591552');
      const userFollowsTarget = Field('1');
      const twitterPublicKey = PublicKey.fromBase58(
        'B62qiYfU916vWRHyfeNHMd36i9KfHVtdskZhNRwqupkp29UXiBTpwkx'
      );
      const senderPublicKey = PublicKey.fromBase58(
        'B62qoWGeTCVUjmtwmDQLbqvQ2XzyaoPjTaieHfkvMt5U5UPU6z83qwe'
        // 'B62qiYfU916vWRHyfeNHMd36i9KfHVtdskZhNRwqupkp29UXiBTpwkx'
      );
      // const userTwitterKeyFields = userTwitterKey.toFields(); // returns two fields
      const signature = Signature.fromJSON({
        r: '3544579994968088233722868457788048448256662568571042649880934162268337908579',
        s: '3058690412518303358561297679821075198650982917450249224066488020262592243224',
      });
      const voteOptionId = Field(0);

      expect(async () => {
        await Mina.transaction(deployerAccount, () => {
          zkAppInstance.verify(
            userId,
            targetId,
            userFollowsTarget,
            twitterPublicKey,
            senderPublicKey,
            signature,
            voteOptionId
          );
        });
      }).rejects;
    });

    it('throws an error if the the user does not follow target on Twitter even if the provided signature is valid', async () => {
      const zkAppInstance = new TwitterVoter(zkAppAddress);
      await localDeploy(zkAppInstance, zkAppPrivateKey, deployerAccount);

      const userId = Field('1491914803673280514');
      const targetId = Field('991439317053591552');
      const userFollowsTarget = Field('0');
      const twitterPublicKey = PublicKey.fromBase58(
        'B62qiYfU916vWRHyfeNHMd36i9KfHVtdskZhNRwqupkp29UXiBTpwkx'
      );
      const senderPublicKey = PublicKey.fromBase58(
        'B62qiYfU916vWRHyfeNHMd36i9KfHVtdskZhNRwqupkp29UXiBTpwkx'
      );
      const signature = Signature.fromJSON({
        r: '10669834998825131610586526112343717492791324149053155994878500670311504353848',
        s: '13040374462520057319544290758451949126917564601530410072165190612194583754301',
      });
      const voteOptionId = Field(0);

      expect(async () => {
        await Mina.transaction(deployerAccount, () => {
          zkAppInstance.verify(
            userId,
            targetId,
            userFollowsTarget,
            twitterPublicKey,
            senderPublicKey,
            signature ?? fail('something is wrong with the signature'),
            voteOptionId
          );
        });
      }).rejects;
    });
  });
});
