const { EVMRevert } = require('../helpers/EVMRevert');
const { latestTime } = require('../helpers/latestTime');
const { increaseTimeTo, duration } = require('../helpers/increaseTime');
const { ether } = require('../helpers/ether');

const BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-bignumber')(BigNumber))
  .use(require('chai-as-promised'))
  .should();

const shouldBehaveLikeTokenTimelockIndividualEscrow = (owner, other) => {
  let now;
  let vestingTime;

  describe('as an Individual Timelock Escrow', function () {
    const amount = ether(2.3);
    const alice = other[0];
    const bob = other[1];
    const charlie = other[2];

    beforeEach(async function () {
      now = await latestTime();
      vestingTime = now + duration.days(2);
      await this.token.approve(this.escrow.address, amount * 2, { from: owner });
    });

    it('can depositAndLock', async function () {
      await this.escrow.depositAndLock(alice, amount, vestingTime, { from: owner });

      (await this.token.balanceOf(this.escrow.address))
        .should.bignumber.equal(amount);
      (await this.escrow.depositsOf(alice))
        .should.bignumber.equal(amount);
    });

    it('fails to depositAndLock twice to same address', async function () {
      await this.escrow.depositAndLock(alice, amount, vestingTime, { from: owner });

      (await this.token.balanceOf(this.escrow.address))
        .should.bignumber.equal(amount);
      (await this.escrow.depositsOf(alice))
        .should.bignumber.equal(amount);

      await (this.escrow.depositAndLock(alice, amount, vestingTime + duration.days(2), { from: owner }))
        .should.be.rejectedWith(EVMRevert);
      (await this.escrow.depositsOf(alice))
        .should.bignumber.equal(amount);
    });

    describe('Deposit then Lock', function () {
      beforeEach(async function () {
        await this.escrow.deposit(alice, amount, { from: owner });
        await this.escrow.lock(alice, vestingTime, { from: owner });

        await this.escrow.deposit(bob, amount, { from: owner });
      });

      it('beneficiary must be a real address', async function () {
        await (this.escrow.lock(0x0, vestingTime, { from: owner }))
          .should.be.rejectedWith(EVMRevert);
      });

      it('vesting time must be in the future', async function () {
        await (this.escrow.lock(bob, now, { from: owner }))
          .should.be.rejectedWith(EVMRevert);
      });

      it('fails to lock a locked address', async function () {
        await (this.escrow.lock(alice, vestingTime, { from: owner }))
          .should.be.rejectedWith(EVMRevert);
      });

      it('fails to lock an address with zero deposit', async function () {
        await (this.escrow.lock(charlie, vestingTime, { from: owner }))
          .should.be.rejectedWith(EVMRevert);
      });
    });

    describe('Before vesting', function () {
      beforeEach(async function () {
        await this.escrow.depositAndLock(alice, amount, vestingTime, { from: owner });
      });

      it('fails to withdraw', async function () {
        await (this.escrow.withdraw(alice, { from: owner }))
          .should.be.rejectedWith(EVMRevert);
        (await this.token.balanceOf(alice))
          .should.be.bignumber.equal(0);
      });
    });

    describe('After vesting', function () {
      beforeEach(async function () {
        await this.escrow.depositAndLock(alice, amount, vestingTime, { from: owner });
        await increaseTimeTo(vestingTime + 1);
      });

      it('can withdraw', async function () {
        await this.escrow.withdraw(alice, { from: owner });
        (await this.token.balanceOf(alice))
          .should.be.bignumber.equal(amount);
      });
    });
  });
};

module.exports = {
  shouldBehaveLikeTokenTimelockIndividualEscrow,
};
