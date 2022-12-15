# Mina Twitter Voter

This app allows users who follow Mina's Twitter account to vote for one of three logos.

This app is deployed to: https://mina-twitter-voter.vercel.app/

## DISCLAIMER

This is by no means a complete app that can't be tricked. This is just a demo whose goal is to use SnarkyJS in an app that includes smart contracts, user interface and an oracle.

## Run locally

1. Sign-up for [Twitter API](https://developer.twitter.com/en/docs/twitter-api) and get your TWITTER_BEARER_TOKEN
2. Create new pair of keys by running [this piece of code](https://github.com/jackryanservia/mina-credit-score-signer/blob/main/scripts/keygen.js). The private key generated will be your oracle private key.
3. Go to ui folder: `cd ui`
4. Create .env file: `cp .env.example .env`
5. Put your TWITTER_BEARER_TOKEN and ORACLE_PRIVATE_KEY in just created .env file
6. Install dependencies: `yarn`
7. Run development server: `yarn dev`
8. UI opens at: http://localhost:3000
