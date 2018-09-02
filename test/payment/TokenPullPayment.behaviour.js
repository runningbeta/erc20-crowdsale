const { EVMThrow } = require('../helpers/EVMThrow');
const { ether } = require('../helpers/ether');

const BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-bignumber')(BigNumber))
  .use(require('chai-as-promised'))
  .should();

function shouldBehaveLikeTokenPullPayment (owner, payer, alice, bob) {
  const amount = ether(3.0);

  describe('as a TokenPullPayment', function () {
    it('can record an async payment correctly', async function () {
      await this.contract.callTransfer(alice, amount, { from: payer });

      (await this.contract.payments(alice)).should.be.bignumber.equal(amount);
    });

    it('can add multiple balances on one account', async function () {
      await this.contract.callTransfer(alice, amount.div(3), { from: payer });
      await this.contract.callTransfer(alice, amount.div(3).mul(2), { from: payer });

      (await this.contract.payments(alice)).should.be.bignumber.equal(amount);
    });

    it('can add balances on multiple accounts', async function () {
      await this.contract.callTransfer(alice, amount.div(3), { from: payer });
      await this.contract.callTransfer(bob, amount.div(3).mul(2), { from: payer });

      (await this.contract.payments(alice)).should.be.bignumber.equal(amount.div(3));
      (await this.contract.payments(bob)).should.be.bignumber.equal(amount.div(3).mul(2));
    });

    it('can withdraw payment', async function () {
      const initialBalance = await this.token.balanceOf(alice);

      await this.contract.callTransfer(alice, amount, { from: payer });
      (await this.contract.payments(alice)).should.be.bignumber.equal(amount);
      await this.contract.withdrawPayments({ from: alice });

      (await this.contract.payments(alice)).should.be.bignumber.equal(0);
      const balance = await this.token.balanceOf(alice);
      Math.abs(balance - initialBalance).should.be.bignumber.equal(amount);
    });

    it('can withdraw multiple payments', async function () {
      const initialBalance = await this.token.balanceOf(alice);

      await this.contract.callTransfer(alice, amount.div(3), { from: payer });
      await this.contract.callTransfer(alice, amount.div(3).mul(2), { from: payer });
      (await this.contract.payments(alice)).should.be.bignumber.equal(amount);
      await this.contract.withdrawPayments({ from: alice });

      (await this.contract.payments(alice)).should.be.bignumber.equal(0);
      const balance = await this.token.balanceOf(alice);
      Math.abs(balance - initialBalance).should.be.bignumber.equal(amount);
    });

    it('fails to escrow more than balance', async function () {
      const contractBalance = await this.token.balanceOf(this.contract.address);
      await (this.contract.callTransfer(alice, contractBalance.add(1), { from: payer }))
        .should.be.rejectedWith(EVMThrow);
    });
  });
};

module.exports = {
  shouldBehaveLikeTokenPullPayment,
};
