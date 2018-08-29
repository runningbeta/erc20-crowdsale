# erc20-crowdsale 🔗

Smart contracts and tools for running an ERC20 token crowdsale

[![CircleCI](https://circleci.com/gh/runningbeta/erc20-crowdsale/tree/master.svg?style=svg)](https://circleci.com/gh/runningbeta/erc20-crowdsale/tree/master)
[![codecov](https://codecov.io/gh/runningbeta/erc20-crowdsale/branch/master/graph/badge.svg)](https://codecov.io/gh/runningbeta/erc20-crowdsale)


## Requirements

LTS Node 8.9.4 is required for running tests.

You will alse need [Truffle framework](http://truffleframework.com):
```bash
# Make sure we have the latest truffle version
npm uninstall -g truffle
npm install -g truffle@latest
```

## Getting started

To test this project locally:

```bash
# clone the repo
git clone https://github.com/runningbeta/erc20-crowdsale.git
cd erc20-crowdsale

# install dependencies
npm install

# run tests on development network
truffle test

# run tests on truffle test network
truffle test --network test
# or
npm run test
```

To check the coverage report:

```bash
# run tests with coverage
npm run coverage
```

To run JavaScript and Solidity linter:

```bash
# run eslint and solium
npm run lint:all
```

## License

This project is open source and distributed under the [Apache License Version 2.0](./LICENSE) license.
