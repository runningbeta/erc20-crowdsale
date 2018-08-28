const { duration, increaseTimeTo } = require('./helpers/increaseTime');
const { advanceBlock } = require('./helpers/advanceToBlock');
const { latestTime } = require('./helpers/latestTime');
const { EVMRevert } = require('./helpers/EVMRevert');
const { ether } = require('./helpers/ether');

const BigNumber = web3.BigNumber;
const Token = artifacts.require('Token');
const SampleAllowanceCrowdsale = artifacts.require('SampleAllowanceCrowdsale');

require('chai')
  .use(require('chai-bignumber')(BigNumber))
  .use(require('chai-as-promised'))
  .should();

contract('SampleAllowanceCrowdsale', function ([
  owner,
  wallet,
  alice,
  ...other
]) {
  before(async function () {
    this.token = await Token.new({ from: owner });
  });

  beforeEach(async function () {
    await advanceBlock();
    this.openingTime = (await latestTime()) + duration.weeks(1);
    this.closingTime = this.openingTime + duration.weeks(1);
    this.withdrawTime = this.closingTime + duration.weeks(1);

    this.crowdsale = await SampleAllowanceCrowdsale.new(
      new BigNumber(6894),
      wallet,
      this.token.address,
      owner,
      ether(45000),
      this.openingTime,
      this.closingTime,
      this.withdrawTime,
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
    await (this.crowdsale.setWallet(other[0], { from: alice }))
      .should.be.rejectedWith(EVMRevert);
  });

  describe('before withdrawal opens', function () {
    before(async function () {
      await increaseTimeTo(this.openingTime + 1);
      await this.crowdsale.buyTokens(alice, { from: alice, value: ether(1) });
    });

    it('can not withdraw', async function () {
      await (this.crowdsale.withdrawTokens({ from: alice })).should.be.rejectedWith(EVMRevert);
    });
  });

  describe('after withdrawal opens', function () {
    before(async function () {
      await increaseTimeTo(this.openingTime + 1);
      await this.crowdsale.buyTokens(alice, { from: alice, value: ether(1) });
      await increaseTimeTo(this.withdrawTime + 1);
    });

    it('can withdraw', async function () {
      await this.crowdsale.withdrawTokens({ from: alice });
    });
  });
});
