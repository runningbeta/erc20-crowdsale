const { duration } = require('./helpers/increaseTime');
const { latestTime } = require('./helpers/latestTime');
const { EVMRevert } = require('./helpers/EVMRevert');
const { ether } = require('./helpers/ether');

const BigNumber = web3.BigNumber;
const Token = artifacts.require('Token');
const SimpleAllowanceCrowdsale = artifacts.require('SimpleAllowanceCrowdsale');

require('chai')
  .use(require('chai-bignumber')(BigNumber))
  .use(require('chai-as-promised'))
  .should();

contract('SimpleAllowanceCrowdsale', function ([
  owner,
  wallet,
  purchaser,
  ...other
]) {
  before(async function () {
    this.token = await Token.new({ from: owner });
  });

  beforeEach(async function () {
    this.openingTime = (await latestTime()) + duration.weeks(1);
    this.closingTime = this.openingTime + duration.weeks(1);

    this.crowdsale = await SimpleAllowanceCrowdsale.new(
      new BigNumber(6894),
      wallet,
      this.token.address,
      owner,
      ether(45000),
      this.openingTime,
      this.closingTime,
      { from: owner }
    );
  });

  it('can change wallet', async function () {
    (await this.crowdsale.wallet()).should.be.equal(wallet);
    await this.crowdsale.setWallet(other[0]);
    (await this.crowdsale.wallet()).should.be.equal(other[0]);
  });

  it('fails to unset wallet', async function () {
    await (this.crowdsale.setWallet(0x0)).should.be.rejectedWith(EVMRevert);
  });

  it('non-owner should not be able to change wallet', async function () {
    await (this.crowdsale.setWallet(other[0], { from: purchaser }))
      .should.be.rejectedWith(EVMRevert);
  });
});
