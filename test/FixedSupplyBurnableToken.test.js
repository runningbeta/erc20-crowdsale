const { expectThrowWithArgs } = require('./helpers/expectThrow');
const { ether } = require('./helpers/ether');

const BigNumber = web3.BigNumber;
const Token = artifacts.require('FixedSupplyBurnableToken');

require('chai')
  .use(require('chai-bignumber')(BigNumber))
  .use(require('chai-as-promised'))
  .should();

const TOTAL_SUPPLY = 1000000000 * (10 ** 18);
const INITIAL_SUPPLY = TOTAL_SUPPLY;

contract('FixedSupplyBurnableToken', function ([owner, customer, ...other]) {
  const amount = ether(1000.0);

  beforeEach(async function () {
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

  describe('as Pausable Burnable Token', function () {
    beforeEach(async function () {
      await this.token.transfer(customer, amount, { from: owner });
      await this.token.pause({ from: owner });
    });

    describe('when paused', function () {
      it('should return paused', async function () {
        await this.token.paused().should.eventually.equal(true);
      });

      it('fails to burn tokens', async function () {
        const amount = ether(1000.0);
        await this.token.approve(customer, amount, { from: owner });
        await expectThrowWithArgs(this.token.burnFrom, customer, amount, { from: owner });
      });
    });

    describe('when unpaused', function () {
      beforeEach(async function () {
        await this.token.unpause({ from: owner });
      });

      it('should return unpaused', async function () {
        await this.token.paused().should.eventually.equal(false);
      });

      it('fails to burn tokens if not approved', async function () {
        await expectThrowWithArgs(this.token.burnFrom, customer, amount, { from: owner });
      });

      it('can burn tokens if approved', async function () {
        await this.token.approve(owner, amount, { from: customer });
        await this.token.burnFrom(customer, amount, { from: owner });
      });
    });
  });
});
