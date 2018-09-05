const minimist = require('minimist');
const { promisify } = require('util');

const TokenDistributor = artifacts.require('TokenDistributor');
const TokenTimelockFactory = artifacts.require('TokenTimelockFactoryImpl');

const config = require('./config');

module.exports = async function (callback) {
  try {
    console.log('Deploy script');
    console.log('-------------');

    const accounts = await promisify(web3.eth.getAccounts)();
    const owner = accounts[0];
    console.log(`Using owner: ${owner}`);

    const args = minimist(process.argv.slice(2), { string: 'wallet' });
    console.log(`Using wallet: ${args.wallet}`);
    if (!args.wallet) {
      console.error('Error: unknown wallet');
      return;
    }

    const BigNumber = web3.BigNumber;

    const Token = artifacts.require(config.token);
    if (Token) {
      // Deploy token contract
      console.log(`Deploying ${config.token}...`);
      const token = await Token.new();
      console.log(`Deployed: ${token.address}\n`);

      console.log('Deploying TokenTimelockFactory...');
      const timelockFactory = await TokenTimelockFactory.new();
      console.log(`Deployed: ${timelockFactory.address}\n`);

      console.log('Deploying TokenDistributor with params:');
      console.log(` - _benefactor: ${owner}`);
      console.log(` - _rate: ${config.rate}`);
      console.log(` - _wallet: ${args.wallet}`);
      console.log(` - _token: ${token.address}`);
      console.log(` - _cap: ${config.cap}`);
      console.log(` - _openingTime: ${config.openingTime}`);
      console.log(` - _closingTime: ${config.closingTime}`);
      console.log(` - _withdrawTime: ${config.withdrawTime}`);
      console.log(` - _bonusTime: ${config.bonusTime}`);
      const distributor = await TokenDistributor.new(
        owner, // benefactor
        new BigNumber(config.rate),
        args.wallet,
        token.address,
        new BigNumber(config.cap),
        config.openingTime,
        config.closingTime,
        config.withdrawTime,
        config.bonusTime,
      );
      console.log(`Deployed: ${distributor.address}\n`);

      console.log('Setting TokenDistributor-TokenTimelockFactory...');
      await distributor.setTokenTimelockFactory(timelockFactory.address);
      console.log('Timelock factory set.\n');

      console.log('Approving distributor for 100% funds...');
      const balanceOfBenefactor = await token.balanceOf(owner);
      await token.approve(distributor.address, balanceOfBenefactor);
      console.log(`Distributor approved for ${balanceOfBenefactor} TOL.\n`);
    }

    callback();
  } catch (e) {
    callback(e);
  }
};
