# Fundraise Up

## Description

This is a test task for Fundraise Up.

## Local Setup

To use this project locally, you need to follow these steps:

1. Install `run-rs` globally:

```bash
yarn global add run-rs
```

2. Install all the dependencies:

```bash
yarn install
```

3. Run the following commands:

```bash
yarn run run-rs # If you don't have a local replicated MongoDB
yarn run app
yarn run sync
yarn run sync:reindex
```

## Code Formatting

All the code in this project is formatted using Prettier. You can format the code by running:

```bash
yarn run format
```

## Contact

If you have any questions, please feel free to contact me at svyatglukhov@gmail.com

## PS
I created CI/CD for testing in Kubernetes, as it's much faster than local testing.