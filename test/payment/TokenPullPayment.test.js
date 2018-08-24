const { ether } = require('../helpers/ether');

const BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-bignumber')(BigNumber))
  .should();

const Token = artifacts.require('FixedSupplyBurnableToken');
const TokenPullPayment = artifacts.require('TokenPullPaymentMock');

contract('TokenPullPayment', function ([_, owner, payer, payee1, payee2]) {
  // 18 decimal token just like ether
  const amount = ether(17.0);

  beforeEach(async function () {
    this.token = await Token.new({ from: owner });
    this.contract = await TokenPullPayment.new(this.token.address, { from: owner });
    await this.token.transfer(this.contract.address, amount, { from: owner });
  });

  it('can record an async payment correctly', async function () {
    await this.contract.callTransfer(payee1, 100, { from: payer });
    (await this.contract.payments(payee1)).should.be.bignumber.equal(100);
  });

  it('can add multiple balances on one account', async function () {
    await this.contract.callTransfer(payee1, 200, { from: payer });
    await this.contract.callTransfer(payee1, 300, { from: payer });
    (await this.contract.payments(payee1)).should.be.bignumber.equal(500);
  });

  it('can add balances on multiple accounts', async function () {
    await this.contract.callTransfer(payee1, 200, { from: payer });
    await this.contract.callTransfer(payee2, 300, { from: payer });

    (await this.contract.payments(payee1)).should.be.bignumber.equal(200);
    (await this.contract.payments(payee2)).should.be.bignumber.equal(300);
  });

  it('can withdraw payment', async function () {
    const initialBalance = await this.token.balanceOf(payee1);

    await this.contract.callTransfer(payee1, amount, { from: payer });

    (await this.contract.payments(payee1)).should.be.bignumber.equal(amount);

    await this.contract.withdrawPayments({ from: payee1 });
    (await this.contract.payments(payee1)).should.be.bignumber.equal(0);

    const balance = await this.token.balanceOf(payee1);
    Math.abs(balance - initialBalance - amount).should.be.lt(1e16);
  });
});
