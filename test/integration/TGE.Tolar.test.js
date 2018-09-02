const { latestTime } = require('../helpers/latestTime');
const { duration } = require('../helpers/increaseTime');
const { advanceBlock } = require('../helpers/advanceToBlock');
const { ether } = require('../helpers/ether');

const BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-bignumber')(BigNumber))
  .use(require('chai-as-promised'))
  .should();

const Token = artifacts.require('FixedSupplyBurnableToken');
const TokenDistributor = artifacts.require('TokenDistributor');
const TokenTimelockFactory = artifacts.require('TokenTimelockFactoryImpl');

contract('TokenDistributor', function ([
  benefactor,
  owner,
  founder1,
  founder2,
  devFund,

  nodeFund,
  developers,
  advisors,
  wallet,
  last,
]) {
  const rate = new BigNumber(6894);
  const cap = ether(45000.0);

  before(async function () {
    (await advanceBlock()); // get blocks in sync with now

    this.now = (await latestTime());
    this.openingTime = this.now + duration.days(10);
    this.closingTime = this.openingTime + duration.days(5);
    this.withdrawTime = this.closingTime + duration.days(5);

    this.bonusTime = this.closingTime + duration.days(30);

    this.sixMonthsTime = this.closingTime + duration.days(6 * 30);
    this.oneYearTime = this.closingTime + duration.years(1);
    this.twoYearTime = this.closingTime + duration.years(2);
    this.threeYearTime = this.closingTime + duration.years(3);
  });

  it('create Tolar token', async function () {
    this.token = await Token.new({ from: benefactor });
    this.totalSupply = await this.token.totalSupply();
  });

  it('create token distributor', async function () {
    this.distributor = await TokenDistributor.new(
      benefactor,
      rate,
      wallet,
      this.token.address,
      cap,
      this.openingTime,
      this.closingTime,
      this.withdrawTime,
      this.bonusTime,
      { from: owner }
    );
    await this.token.approve(this.distributor.address, this.totalSupply, { from: benefactor });
  });

  it('set Token Timelock Factory', async function () {
    this.timelockFactory = await TokenTimelockFactory.new({ from: owner });
    await this.distributor.setTokenTimelockFactory(this.timelockFactory.address, { from: owner });
  });

  it('distribute dev fund tokens (32%)', async function () {
    await this.distributor
      .depositAndLock(devFund, this.totalSupply.div(100).mul(5), this.oneYearTime, { from: owner });
    await this.distributor
      .depositAndLock(devFund, this.totalSupply.div(100).mul(5), this.twoYearTime, { from: owner });
    await this.distributor
      .depositAndLock(devFund, this.totalSupply.div(100).mul(22), this.threeYearTime, { from: owner });
    console.log('Dev fund - 1yr 5% Timelock: ', await this.timelockFactory.beneficiaryInstantiations(devFund, 0));
    console.log('Dev fund - 2yr 5% Timelock: ', await this.timelockFactory.beneficiaryInstantiations(devFund, 1));
    console.log('Dev fund - 3yr 22% Timelock: ', await this.timelockFactory.beneficiaryInstantiations(devFund, 2));

    (await this.token.allowance(benefactor, this.distributor.address))
      .should.be.bignumber.equal(this.totalSupply.div(100).mul(68));
  });

  it('distribute founder tokens (2 * 10%)', async function () {
    await this.distributor.depositAndLock(founder1, this.totalSupply.div(10), this.twoYearTime, { from: owner });
    await this.distributor.depositAndLock(founder2, this.totalSupply.div(10), this.twoYearTime, { from: owner });
    console.log('Founder 1 - 2yr 10% Timelock: ', await this.timelockFactory.beneficiaryInstantiations(founder1, 0));
    console.log('Founder 2 - 2yr 10% Timelock: ', await this.timelockFactory.beneficiaryInstantiations(founder2, 0));

    (await this.token.allowance(benefactor, this.distributor.address))
      .should.be.bignumber.equal(this.totalSupply.div(100).mul(48));
  });

  it('distribute start node tokens (8%)', async function () {
    await this.distributor
      .depositAndLock(nodeFund, this.totalSupply.div(100).mul(8), this.sixMonthsTime, { from: owner });
    console.log('Nodes - 6m 8% Timelock: ', await this.timelockFactory.beneficiaryInstantiations(nodeFund, 0));

    (await this.token.allowance(benefactor, this.distributor.address))
      .should.be.bignumber.equal(this.totalSupply.div(100).mul(40));
  });

  it('distribute developer tokens (2.5%)', async function () {
    await this.distributor
      .depositAndLock(developers, this.totalSupply.div(1000).mul(25), this.twoYearTime, { from: owner });
    console.log('Developers - 2yr 2.5% Timelock: ',
      await this.timelockFactory.beneficiaryInstantiations(developers, 0));

    (await this.token.allowance(benefactor, this.distributor.address))
      .should.be.bignumber.equal(this.totalSupply.div(1000).mul(375));
  });

  it('distribute advisor tokens (2.5%)', async function () {
    await this.distributor
      .depositAndLock(advisors, this.totalSupply.div(1000).mul(25), this.twoYearTime, { from: owner });
    console.log('Advisors - 2yr 2.5% Timelock: ',
      await this.timelockFactory.beneficiaryInstantiations(advisors, 0));

    (await this.token.allowance(benefactor, this.distributor.address))
      .should.be.bignumber.equal(this.totalSupply.div(1000).mul(350));
  });
});
