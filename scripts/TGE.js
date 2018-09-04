const moment = require('moment');

const TokenDistributor = artifacts.require('TokenDistributor');
const TokenTimelockFactory = artifacts.require('TokenTimelockFactoryImpl');

const config = require('./TGEconfig');

module.exports = async function (callback) {
  try {
    const [owner, wallet] = web3.eth.accounts;
    const BigNumber = web3.BigNumber;

    console.log('TGE script');
    console.log('-----------------');

    const Token = artifacts.require(config.token);
    if (Token) {
      // Deploy token contract
      console.log(`Deploying ${config.token}...`);
      const token = await Token.new({ from: owner });
      console.log(`Deployed: ${token.address}\n`);

      console.log('Deploying TokenTimelockFactory...');
      const timelockFactory = await TokenTimelockFactory.new({ from: owner });
      console.log(`Deployed: ${timelockFactory.address}\n`);

      console.log('Deploying TokenDistributor...');
      const distributor = await TokenDistributor.new(
        owner, // benefactor
        new BigNumber(config.rate),
        wallet,
        token.address,
        new BigNumber(config.cap),
        config.openingTime,
        config.closingTime,
        config.withdrawTime,
        config.bonusTime,
        { from: owner }
      );
      console.log(`Deployed: ${distributor.address}\n`);

      console.log('Setting TokenDistributor-TokenTimelockFactory...');
      await distributor.setTokenTimelockFactory(timelockFactory.address, { from: owner });
      console.log('Timelock factory set.\n');

      console.log('Approving distributor for 100% funds...');
      const balanceOfBenefactor = await token.balanceOf(owner);
      await token.approve(distributor.address, balanceOfBenefactor, { from: owner });
      console.log(`Disributor approved for ${balanceOfBenefactor}TOL.\n`);

      console.log('Locking tokens into escrow...\n');
      const totalSupply = await token.totalSupply();
      for (let i = 0; i < config.escrow.length; i++) {
        const escrow = config.escrow[i];
        const escrowAmount = totalSupply.mul(escrow.amount);
        console.log(`Deposit ${escrow.amount}% for ${escrow.id} and lock until ${moment.unix(escrow.duration)
          .format('dddd, MMMM Do YYYY, h:mm:ss a')}`);
        const receipt = await distributor.depositAndLock(
          escrow.address,
          escrowAmount,
          escrow.duration,
          { from: owner }
        );
        console.log(`Locked ${escrowAmount.div(1e+18).toFormat()}TOL tokens at address ${receipt
          .logs[0].args.instantiation}\n`);
      }
    }
  } catch (e) {
    console.error(e);
  }
};
