const { shouldBehaveLikeIssuerWithEther } = require('./IssuerWithEther.behaviour');

const Token = artifacts.require('FixedSupplyBurnableToken');
const IssuerWithEther = artifacts.require('IssuerWithEtherMock');

contract('IssuerWithEther', function ([_, benefactor, owner, customer, ...otherAccounts]) {
  beforeEach(async function () {
    this.token = await Token.new({ from: benefactor });
    this.issuer = await IssuerWithEther.new(benefactor, this.token.address, { from: owner });
  });

  shouldBehaveLikeIssuerWithEther(benefactor, owner, customer, otherAccounts);
});
