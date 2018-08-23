const { shouldBehaveLikeTokenEscrow } = require('./TokenEscrow.behaviour');
const { expectThrow } = require('../helpers/expectThrow');
const { EVMRevert } = require('../helpers/EVMRevert');
const { latestTime } = require('../helpers/latestTime');
const { increaseTimeTo, duration } = require('../helpers/increaseTime');

const BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-bignumber')(BigNumber))
  .use(require('chai-as-promised'))
  .should();

const Token = artifacts.require('FixedSupplyBurnableToken');
const TokenTimelockIndividualEscrow = artifacts.require('TokenTimelockIndividualEscrowMock');

contract('TokenTimelockIndividualEscrow', function (accounts) {
  const owner = accounts[0];
  let vestingTime;

  beforeEach(async function () {
    this.token = await Token.new({ from: owner });
    this.escrow = await TokenTimelockIndividualEscrow.new(
      this.token.address,
      { from: owner }
    );
  });

  context('timelocked tokens', function () {
    const amount = web3.toWei(23.0, 'ether');
    const payee = accounts[1];

    it('reverts on withdrawals', async function () {
      vestingTime = (await latestTime()) + duration.days(10);
      await this.token.approve(this.escrow.address, amount, { from: owner });
      await this.escrow.depositAndLock(payee, amount, vestingTime, { from: owner });

      await expectThrow(this.escrow.withdraw(payee, { from: owner }), EVMRevert);
    });
  });

  context('never-locked deposits', function () {
    shouldBehaveLikeTokenEscrow(owner, accounts.slice(1));
  });
});
