const { latestTime } = require('./helpers/latestTime');
const { duration } = require('./helpers/increaseTime');
const { ether } = require('./helpers/ether');

const { shouldBehaveLikeIssuerWithEther } = require('./payment/IssuerWithEther.behaviour');

const Token = artifacts.require('FixedSupplyBurnableToken');
const TokenDistributor = artifacts.require('TokenDistributor');

contract('TokenDistributor', function ([_, benefactor, owner, customer, wallet, ...otherAccounts]) {
  const amount = ether(500.0);
  const weiAmount = ether(42.0);
  const rate = 1000;
  const cap = ether(420.0);

  beforeEach(async function () {
    const openingTime = await latestTime() + duration.days(1);
    const closingTime = openingTime + duration.days(5);

    this.token = await Token.new({ from: benefactor });
    this.distributor = await TokenDistributor.new(
      benefactor,
      rate,
      wallet,
      this.token.address,
      cap,
      openingTime,
      closingTime,
      { from: owner }
    );
    this.issuer = this.distributor;
  });

  shouldBehaveLikeIssuerWithEther(benefactor, owner, customer, otherAccounts);

  it('should respect the cap', async function () {
    await this.token.approve(this.issuer.address, amount * 4, { from: benefactor });
    await this.issuer.contract.issue['address,uint256,uint256'](customer, amount, weiAmount, { from: owner, gas: 500000 });
    (await this.issuer.weiRaised()).should.be.bignumber.most(cap, "WeiRaised exceedes set cap.");
  });
});
