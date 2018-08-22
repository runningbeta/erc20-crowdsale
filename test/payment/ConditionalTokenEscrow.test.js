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
const VestedBonusTokenEscrow = artifacts.require('VestedBonusTokenEscrow');

contract('VestedBonusTokenEscrow', function (accounts) {
  const owner = accounts[0];
  let vestingTime;

  beforeEach(async function () {
    vestingTime = (await latestTime()) + duration.days(10);
    this.token = await Token.new({ from: owner });
    this.escrow = await VestedBonusTokenEscrow.new(
      this.token.address,
      vestingTime,
      { from: owner }
    );
  });

  context('before vesting is finished', function () {
    const amount = web3.toWei(23.0, 'ether');
    const payee = accounts[1];

    it('reverts on withdrawals', async function () {
      await this.token.transfer(this.escrow.address, amount, { from: owner });
      await this.escrow.deposit(payee, amount, { from: owner });

      await expectThrow(this.escrow.withdraw(payee, { from: owner }), EVMRevert);
    });
  });

  context('after vesting is finished', function () {
    beforeEach(async function () {
      await increaseTimeTo(vestingTime + 1);
    });

    shouldBehaveLikeTokenEscrow(owner, accounts.slice(1));
  });
});
