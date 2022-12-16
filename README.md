# Mina Twitter Voter

This app allows users who follow Mina's Twitter account to vote for one of three logos.

This app is running on Berkeley testnet and is deployed to: https://mina-twitter-voter.vercel.app/

Demo video: https://www.youtube.com/watch?v=ctwuZzxzLNE

## DISCLAIMER

This is by no means am app that can't be tricked. This is just a demo whose goal is to use SnarkyJS in an app that includes smart contracts, user interface and an oracle.

This app was developed in a fast pace during [Mina Cohort0](https://minaprotocol.com/zkignite-cohort0-signup) event. There might see some TODOs or messy code across the app.

## Run user interface and oracle locally

1. Sign-up for [Twitter API](https://developer.twitter.com/en/docs/twitter-api) and get your TWITTER_BEARER_TOKEN
2. Create new pair of keys by running [this piece of code](https://github.com/jackryanservia/mina-credit-score-signer/blob/main/scripts/keygen.js). The private key generated will be your oracle private key.
3. Go to ui folder: `cd ui`
4. Create .env file: `cp .env.example .env`
5. Put your TWITTER_BEARER_TOKEN and ORACLE_PRIVATE_KEY in just created .env file
6. Install dependencies: `yarn`
7. Run development server: `yarn dev`
8. UI opens at: http://localhost:3000

## Deploy smart contract

1. Go to contracts folder: `cd contracts`
2. Create folder called keys and put your feePayer and zkApp private keys there (check keys-example/deploy.ts for the format)
3. **BE CAREFUL! Don't expose those keys to public repository!**
4. Install dependencies: `yarn`
5. Build the project: `yarn build`
6. Run deploy script: `node ./build/src/custom-deploy.js`

To perform tests, run `yarn test`

## Possible hacks/improvements

- Right now users can vote as many times as he wants. This should be restricted to one vote per address only
- Even if we implement restriction "1 vote per address", one Twitter account can create many Mina addresses (but he would have to pay 1 MINA for each account creation).
- One user can create multiple Twitter accounts
- The logos could be loaded from a decentralized storage
- Implement "anonymous voting logic" (user votes, but it's hard to guess for what option he voted for)
