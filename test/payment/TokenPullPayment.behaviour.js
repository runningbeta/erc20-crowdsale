const { EVMThrow } = require('../helpers/EVMThrow');
const { ether } = require('../helpers/ether');

const BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-bignumber')(BigNumber))
  .use(require('chai-as-promised'))
  .should();

function shouldBehaveLikeTokenPullPayment (owner, payer, payee1, payee2) {
  const amount = ether(3.0);

  describe('as a TokenPullPayment', function () {
    it('can record an async payment correctly', async function () {
      await this.contract.callTransfer(payee1, amount, { from: payer });

      (await this.contract.payments(payee1)).should.be.bignumber.equal(amount);
    });

    it('can add multiple balances on one account', async function () {
      await this.contract.callTransfer(payee1, amount.div(3), { from: payer });
      await this.contract.callTransfer(payee1, amount.div(3).mul(2), { from: payer });

      (await this.contract.payments(payee1)).should.be.bignumber.equal(amount);
    });

    it('can add balances on multiple accounts', async function () {
      await this.contract.callTransfer(payee1, amount.div(3), { from: payer });
      await this.contract.callTransfer(payee2, amount.div(3).mul(2), { from: payer });

      (await this.contract.payments(payee1)).should.be.bignumber.equal(amount.div(3));
      (await this.contract.payments(payee2)).should.be.bignumber.equal(amount.div(3).mul(2));
    });

    it('can withdraw payment', async function () {
      const initialBalance = await this.token.balanceOf(payee1);

      await this.contract.callTransfer(payee1, amount, { from: payer });
      (await this.contract.payments(payee1)).should.be.bignumber.equal(amount);
      await this.contract.withdrawPayments({ from: payee1 });

      (await this.contract.payments(payee1)).should.be.bignumber.equal(0);
      const balance = await this.token.balanceOf(payee1);
      Math.abs(balance - initialBalance).should.be.bignumber.equal(amount);
    });

    it('can withdraw multiple payments', async function () {
      const initialBalance = await this.token.balanceOf(payee1);

      await this.contract.callTransfer(payee1, amount.div(3), { from: payer });
      await this.contract.callTransfer(payee1, amount.div(3).mul(2), { from: payer });
      (await this.contract.payments(payee1)).should.be.bignumber.equal(amount);
      await this.contract.withdrawPayments({ from: payee1 });

      (await this.contract.payments(payee1)).should.be.bignumber.equal(0);
      const balance = await this.token.balanceOf(payee1);
      Math.abs(balance - initialBalance).should.be.bignumber.equal(amount);
    });

    it('fails to escrow more than balance', async function () {
      const contractBalance = await this.token.balanceOf(this.contract.address);
      await (this.contract.callTransfer(payee1, contractBalance.add(1), { from: payer }))
        .should.be.rejectedWith(EVMThrow);
    });
  });
};

module.exports = {
  shouldBehaveLikeTokenPullPayment,
};
