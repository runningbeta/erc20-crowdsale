const { shouldBehaveLikeIssuerWithEther } = require('./IssuerWithEther.behaviour');

const Token = artifacts.require('FixedSupplyBurnableToken');
const IssuerWithEther = artifacts.require('IssuerWithEtherMock');

contract('IssuerWithEther', function ([_, owner, issuer, customer, ...otherAccounts]) {
  beforeEach(async function () {
    this.token = await Token.new({ from: owner });
    this.issuer = await IssuerWithEther.new(issuer, owner, this.token.address, { from: issuer });
  });

  shouldBehaveLikeIssuerWithEther(owner, issuer, customer, otherAccounts);
});
