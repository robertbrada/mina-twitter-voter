import {
  Field,
  SmartContract,
  state,
  State,
  method,
  DeployArgs,
  PublicKey,
  Signature,
  Bool,
  Circuit,
} from 'snarkyjs';

// The public key of our trusted data provider
const ORACLE_PUBLIC_KEY =
  'B62qp8ksPHoTnse3Uj2fjXttFT1ELQrwNNHv2VvVL6gZi9eHNyDX5Vb';

export class TwitterVoter extends SmartContract {
  // Define contract state
  @state(PublicKey) oraclePublicKey = State<PublicKey>();
  @state(Field) votesFor0 = State<Field>();
  @state(Field) votesFor1 = State<Field>();
  @state(Field) votesFor2 = State<Field>();

  // Define contract events
  events = {
    verified: Field,
    voted: Field,
  };

  deploy(args: DeployArgs) {
    super.deploy(args);
    this.oraclePublicKey.set(PublicKey.fromBase58(ORACLE_PUBLIC_KEY));
    this.votesFor0.set(Field(0));
    this.votesFor1.set(Field(0));
    this.votesFor2.set(Field(0));
    // this.setPermissions({
    //   ...Permissions.default(),
    //   editState: Permissions.proofOrSignature(),
    // });
  }

  // There were issues with deploying a script that includes @init method. Moved the logic to deploy function instead
  // @method init(zkappKey: PrivateKey) {
  // super.init(zkappKey);
  // Initialize contract state
  // this.oraclePublicKey.set(PublicKey.fromBase58(ORACLE_PUBLIC_KEY));
  // Set initial number of votes for eac
  // this.votesFor0.set(Field(0));
  // this.votesFor1.set(Field(0));
  // this.votesFor2.set(Field(0));
  // Specify that caller should include signature with tx instead of proof
  // this.requireSignature();
  // }

  @method verify(
    userId: Field,
    targetId: Field,
    userFollowsTarget: Field,
    twitterPublicKey: PublicKey,
    senderPublicKey: PublicKey,
    signature: Signature,
    voteOptionId: Field // 0 || 1 || 2
  ) {
    // Get the oracle public key from the contract state
    const oraclePublicKey = this.oraclePublicKey.get();
    this.oraclePublicKey.assertEquals(oraclePublicKey);
    // Evaluate whether the signature is valid for the provided data
    const userTwitterKeyFields = twitterPublicKey.toFields(); // returns two fields
    const validSignature = signature.verify(oraclePublicKey, [
      userId,
      targetId,
      userFollowsTarget,
      userTwitterKeyFields[0],
      userTwitterKeyFields[1],
    ]);

    // Check that the signature is valid
    validSignature.assertTrue();
    // Check that user is following target on Twitter
    userFollowsTarget.assertEquals(1);
    // Check that address received from Twitter Bio and sender's address are the same
    // TODO the address of sender should be received by something like msg.sender equivalent in Solidity, rather than passing it as an argument
    twitterPublicKey.assertEquals(senderPublicKey);
    // Emit an event containing the verified users id
    this.emitEvent('verified', userId);

    // check for which option is user voting
    const votingFor0 = Bool(voteOptionId.equals(Field(0)));
    const votingFor1 = Bool(voteOptionId.equals(Field(1)));
    const votingFor2 = Bool(voteOptionId.equals(Field(2)));

    // make sure the values are in sync with on-chain values
    this.votesFor0.assertEquals(this.votesFor0.get());
    this.votesFor1.assertEquals(this.votesFor1.get());
    this.votesFor2.assertEquals(this.votesFor2.get());

    // current votes
    const currentVotesFor0 = this.votesFor0.get();
    const currentVotesFor1 = this.votesFor1.get();
    const currentVotesFor2 = this.votesFor2.get();

    // get updates values based on user vote
    const updatedVotesFor0 = Circuit.if(
      votingFor0,
      currentVotesFor0.add(1),
      currentVotesFor0
    );

    const updatedVotesFor1 = Circuit.if(
      votingFor1,
      currentVotesFor1.add(1),
      currentVotesFor1
    );

    const updatedVotesFor2 = Circuit.if(
      votingFor2,
      currentVotesFor2.add(1),
      currentVotesFor2
    );

    // set new voting states
    this.votesFor0.set(updatedVotesFor0);
    this.votesFor1.set(updatedVotesFor1);
    this.votesFor2.set(updatedVotesFor2);
    this.emitEvent('voted', userId.mul(2)); // multiplying by 2 only to improve testing (I don't want to have two events with the same ID assigned)
  }
}
