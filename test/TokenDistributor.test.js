const { shouldBehaveLikeIssuerWithEther } = require('./payment/IssuerWithEther.behaviour');

const Token = artifacts.require('FixedSupplyBurnableToken');
const TokenDistributor = artifacts.require('TokenDistributor');

contract('TokenDistributor', function ([_, benefactor, owner, customer, wallet, ...otherAccounts]) {
  beforeEach(async function () {
    this.token = await Token.new({ from: benefactor });
    const rate = 1000;
    const cap = web3.toWei(50.0, 'ether');
    const openingTime = 1000;
    const closingTime = 1000;
    this.distributor = await TokenDistributor.new(rate, wallet, this.token.address, cap, openingTime, closingTime, { from: owner });
    this.issuer = this.distributor;

    const amount = web3.toWei(500.0, 'ether');
    await this.token.transfer(this.distributor.address, amount, { from: benefactor });
  });

  shouldBehaveLikeIssuerWithEther(benefactor, owner, customer, otherAccounts);
});
