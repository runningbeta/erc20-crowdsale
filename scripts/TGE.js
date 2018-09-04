const minimist = require('minimist');
const moment = require('moment');
const promisify = require('./promisify');

const TokenDistributor = artifacts.require('TokenDistributor');
const TokenTimelockFactory = artifacts.require('TokenTimelockFactoryImpl');

const config = require('./TGEconfig');

module.exports = async function (callback) {
  try {
    console.log('TGE script');
    console.log('----------');

    const owner = await promisify(cb => web3.eth.getAccounts(cb));
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
      console.log(`Disributor approved for ${balanceOfBenefactor}TOL.\n`);

      console.log('Locking tokens into escrow...\n');
      const totalSupply = await token.totalSupply();
      for (let i = 0; i < config.escrow.length; i++) {
        const escrow = config.escrow[i];
        const escrowAmount = totalSupply.mul(escrow.amount);
        console.log(`Deposit ${escrow.amount}% for ${escrow.id} and lock until ${moment.unix(escrow.duration)
          .format('dddd, MMMM Do YYYY, h:mm:ss a')}`);
        const receipt = await distributor.depositAndLock(escrow.address, escrowAmount, escrow.duration);
        console.log(`Locked ${escrowAmount.div(1e+18).toFormat()}TOL tokens at address ${receipt
          .logs[0].args.instantiation}\n`);
      }
    }
  } catch (e) {
    console.error(e);
  }
};
