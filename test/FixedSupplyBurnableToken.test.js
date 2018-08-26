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

  describe('as Finalizable Burnable Token', function () {
    beforeEach(async function () {
      await this.token.transfer(customer, amount, { from: owner });
    });

    describe('when not finalized', function () {
      it('fails to burn tokens', async function () {
        const amount = ether(1000.0);
        await this.token.approve(customer, amount, { from: owner });
        await expectThrowWithArgs(this.token.burnFrom, customer, amount, { from: owner });
      });
    });

    describe('when finalized', function () {
      beforeEach(async function () {
        await this.token.finalize({ from: owner });
      });

      it('should return unpaused', async function () {
        await this.token.isFinalized().should.eventually.equal(true);
      });

      it('fails to burn tokens if not approved', async function () {
        await expectThrowWithArgs(this.token.burnFrom, customer, amount, { from: owner });
      });

      it('can burn own tokens', async function () {
        const initialBalance = await this.token.balanceOf(owner);
        await this.token.approve(owner, amount, { from: owner });
        await this.token.burnFrom(owner, amount, { from: owner });

        (await this.token.balanceOf(owner)).should.be.bignumber.equal(initialBalance.sub(amount));
      });

      it('can burn all approved tokens', async function () {
        await this.token.approve(owner, amount, { from: customer });
        await this.token.burnFrom(customer, amount, { from: owner });

        (await this.token.balanceOf(customer)).should.be.bignumber.equal(0);
      });

      it('can burn some approved tokens', async function () {
        await this.token.approve(owner, amount, { from: customer });
        await this.token.burnFrom(customer, amount.div(2), { from: owner });

        (await this.token.allowance(customer, owner)).should.be.bignumber.equal(amount.div(2));
      });

      it('fails to burn more than approved amount', async function () {
        await this.token.approve(owner, amount, { from: customer });
        await expectThrowWithArgs(this.token.burnFrom, customer, amount.mul(2), { from: owner });
      });
    });
  });
});
