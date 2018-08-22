const { ether } = require('./helpers/ether');

const BigNumber = web3.BigNumber;
const Token = artifacts.require('FixedSupplyBurnableToken');

require('chai')
  .use(require('chai-bignumber')(BigNumber))
  .use(require('chai-as-promised'))
  .should();

const TOTAL_SUPPLY = 1000000000 * (10 ** 18);
const INITIAL_SUPPLY = TOTAL_SUPPLY;

contract('FixedSupplyBurnableToken', function ([owner, ...other]) {
  before(async function () {
    this.token = await Token.new({ from: owner });
  });

  it(`total suply is ${INITIAL_SUPPLY}`, async function () {
    (await this.token.totalSupply()).should.be.bignumber.equal(INITIAL_SUPPLY);
  });

  it('owner owns all the tokens', async function () {
    (await this.token.balanceOf(owner)).should.be.bignumber.equal(TOTAL_SUPPLY);
  });

  it('refuses ether', async function () {
    await this.token.send(ether(1), { from: owner }).should.be.rejectedWith('revert');
  });
});
