let utils = require("./utils/utils.js");

const BigNumber = web3.BigNumber;
const Token = artifacts.require('Token');
const PublicCrowdsale = artifacts.require('PublicCrowdsale');

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

const INITTIAL_SUPPLY = 0;
const TOTAL_SUPPLY = 1000000000;

contract('PublicCrowdsale', function (accounts) {
  let prefix = 'Before Crowdsale -- ';
  
  beforeEach(async function () {
    const openingTime = (await utils.latestTime()) + utils.duration.weeks(1);
    const closingTime = openingTime + utils.duration.weeks(1);

    this.token = await Token.new();
    this.publicCrowdsale = await PublicCrowdsale.new(
      new BigNumber(1.45055 * (10 ** 14)),
      accounts[1],
      this.token.address,
      utils.ether(45000),
      openingTime,
      closingTime
    );
  });

  it(prefix + 'disallows buying of tokens', async function () {
    await this.publicCrowdsale.buyTokens(
      accounts[1], { from: accounts[1], value: web3.toWei(1, 'ether') }
    ).should.be.rejectedWith('revert');

  });

})
