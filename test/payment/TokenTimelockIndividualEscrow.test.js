const { shouldBehaveLikeTokenEscrow } = require('./TokenEscrow.behaviour');
const { EVMRevert } = require('../helpers/EVMRevert');
const { latestTime } = require('../helpers/latestTime');
const { duration } = require('../helpers/increaseTime');
const { ether } = require('../helpers/ether');

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
    this.escrow = await TokenTimelockIndividualEscrow.new(this.token.address, { from: owner });
  });

  context('timelocked tokens', function () {
    const amount = ether(23.0);
    const payee = accounts[1];

    it('reverts on withdrawals', async function () {
      vestingTime = (await latestTime()) + duration.days(10);
      await this.token.approve(this.escrow.address, amount, { from: owner });
      await this.escrow.depositAndLock(payee, amount, vestingTime, { from: owner });
      await this.escrow.withdraw(payee, { from: owner }).should.be.rejectedWith(EVMRevert);
    });
  });

  context('never-locked deposits', function () {
    shouldBehaveLikeTokenEscrow(owner, accounts.slice(1));
  });
});
