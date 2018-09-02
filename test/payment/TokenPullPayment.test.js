const { ether } = require('../helpers/ether');

const BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-bignumber')(BigNumber))
  .use(require('chai-as-promised'))
  .should();

const Token = artifacts.require('FixedSupplyBurnableToken');
const TokenPullPayment = artifacts.require('TokenPullPaymentMock');

const { shouldBehaveLikeTokenPullPayment } = require('./TokenPullPayment.behaviour');

contract('TokenPullPayment', function ([_, owner, payer, alice, bob]) {
  const amount = ether(17.0);

  beforeEach(async function () {
    this.token = await Token.new({ from: owner });
    this.contract = await TokenPullPayment.new(this.token.address, { from: owner });
    await this.token.transfer(this.contract.address, amount, { from: owner });
  });

  shouldBehaveLikeTokenPullPayment(owner, payer, alice, bob);
});
