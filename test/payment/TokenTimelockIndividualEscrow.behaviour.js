const { EVMRevert } = require('../helpers/EVMRevert');
const { latestTime } = require('../helpers/latestTime');
const { increaseTimeTo, duration } = require('../helpers/increaseTime');
const { ether } = require('../helpers/ether');

const BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-bignumber')(BigNumber))
  .use(require('chai-as-promised'))
  .should();

function shouldBehaveLikeTokenTimelockIndividualEscrow (owner, accounts) {
  let now;
  let vestingTime;

  describe('as an Individual Timelock Escrow', function () {
    const amount = ether(2.3);
    const payee = accounts[0];
    const payee2 = accounts[1];
    const payee3 = accounts[2];

    beforeEach(async function () {
      now = await latestTime();
      vestingTime = now + duration.days(2);
      await this.token.approve(this.escrow.address, amount * 2, { from: owner });
    });

    it('can depositAndLock', async function () {
      await this.escrow.depositAndLock(payee, amount, vestingTime, { from: owner });

      (await this.token.balanceOf(this.escrow.address)).should.bignumber.equal(amount);
      (await this.escrow.depositsOf(payee)).should.bignumber.equal(amount);
    });

    it('fails to depositAndLock twice to same address', async function () {
      await this.escrow.depositAndLock(payee, amount, vestingTime, { from: owner });

      (await this.token.balanceOf(this.escrow.address)).should.bignumber.equal(amount);
      (await this.escrow.depositsOf(payee)).should.bignumber.equal(amount);

      await (this.escrow.depositAndLock(payee, amount, vestingTime + duration.days(2), { from: owner }))
        .should.be.rejectedWith(EVMRevert);
    });

    describe('Deposit then Lock', function () {
      beforeEach(async function () {
        await this.escrow.deposit(payee, amount, { from: owner });
        await this.escrow.lock(payee, vestingTime, { from: owner });

        await this.escrow.deposit(payee2, amount, { from: owner });
      });

      it('beneficiary must be a real address', async function () {
        await (this.escrow.lock(0x0, vestingTime, { from: owner }))
          .should.be.rejectedWith(EVMRevert);
      });

      it('vesting time must be in the future', async function () {
        await (this.escrow.lock(payee2, now, { from: owner })).should.be.rejectedWith(EVMRevert);
      });

      it('fails to lock a locked address', async function () {
        await (this.escrow.lock(payee, vestingTime, { from: owner }))
          .should.be.rejectedWith(EVMRevert);
      });

      it('fails to lock an address with zero deposit', async function () {
        await (this.escrow.lock(payee3, vestingTime, { from: owner }))
          .should.be.rejectedWith(EVMRevert);
      });
    });

    describe('Before vesting', function () {
      beforeEach(async function () {
        await this.escrow.depositAndLock(payee, amount, vestingTime, { from: owner });
      });

      it('fails to withdraw', async function () {
        await (this.escrow.withdraw(payee, { from: owner }))
          .should.be.rejectedWith(EVMRevert);
      });
    });

    describe('After vesting', function () {
      beforeEach(async function () {
        await this.escrow.depositAndLock(payee, amount, vestingTime, { from: owner });
        await increaseTimeTo(vestingTime + 1);
      });

      it('can withdraw', async function () {
        await this.escrow.withdraw(payee, { from: owner });
        (await this.token.balanceOf(payee)).should.be.bignumber.equal(amount);
      });
    });
  });
};

module.exports = {
  shouldBehaveLikeTokenTimelockIndividualEscrow,
};