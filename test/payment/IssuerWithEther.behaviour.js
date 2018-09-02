const { expectThrow } = require('../helpers/expectThrow');
const { EVMRevert } = require('../helpers/EVMRevert');
const { ether } = require('../helpers/ether');

const BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-bignumber')(BigNumber))
  .use(require('chai-as-promised'))
  .should();

const shouldBehaveLikeIssuerWithEther = (benefactor, owner, alice, [bob, ...other]) => {
  const amount = ether(420.0);
  const weiAmount = ether(42.0);

  describe('as an IssuerWithEther', function () {
    beforeEach(async function () {
      await this.token.approve(this.issuer.address, amount.mul(4), { from: benefactor });
    });

    it('issue some tokens', async function () {
      await this.issuer.contract
        .issue['address,uint256,uint256'](alice, amount, weiAmount, { from: owner, gas: 500000 });

      (await this.issuer.issuedCount())
        .should.be.bignumber.equal(amount);
      (await this.issuer.weiRaised())
        .should.be.bignumber.equal(weiAmount);
      (await this.token.balanceOf(alice))
        .should.be.bignumber.equal(amount);
    });

    it('issue tokens multiple times', async function () {
      await this.issuer.contract
        .issue['address,uint256,uint256'](alice, amount, weiAmount, { from: owner, gas: 500000 });
      await this.issuer.contract
        .issue['address,uint256,uint256'](bob, amount.mul(2), weiAmount.mul(2), { from: owner, gas: 500000 });

      (await this.issuer.issuedCount())
        .should.be.bignumber.equal(amount.mul(3));
      (await this.issuer.weiRaised())
        .should.be.bignumber.equal(weiAmount.mul(3));

      (await this.token.balanceOf(alice))
        .should.be.bignumber.equal(amount);
      (await this.token.balanceOf(bob))
        .should.be.bignumber.equal(amount.mul(2));
    });

    it('only benefactor can issue', async function () {
      const options = { from: alice, gas: 500000 };
      await expectThrow(() => this.issuer.contract
        .issue['address,uint256,uint256'](alice, amount.mul(3), weiAmount.mul(3), options), EVMRevert);

      (await this.issuer.issuedCount())
        .should.be.bignumber.equal(0);
      (await this.issuer.weiRaised())
        .should.be.bignumber.equal(0);
      (await this.token.balanceOf(alice))
        .should.be.bignumber.equal(0);
    });

    it('fails to issue over allowance', async function () {
      const options = { from: owner, gas: 500000 };
      await expectThrow(() => this.issuer.contract
        .issue['address,uint256,uint256'](alice, amount.mul(5), weiAmount.mul(5), options), EVMRevert);

      (await this.issuer.issuedCount())
        .should.be.bignumber.equal(0);
      (await this.issuer.weiRaised())
        .should.be.bignumber.equal(0);
      (await this.token.balanceOf(alice))
        .should.be.bignumber.equal(0);
    });

    it('fails to issue twice to same address', async function () {
      const options = { from: owner, gas: 500000 };
      await this.issuer.contract
        .issue['address,uint256,uint256'](alice, amount, weiAmount, options);

      await expectThrow(() => this.issuer.contract
        .issue['address,uint256,uint256'](alice, amount, weiAmount, options), EVMRevert);

      (await this.issuer.issuedCount())
        .should.be.bignumber.equal(amount);
      (await this.issuer.weiRaised())
        .should.be.bignumber.equal(weiAmount);
      (await this.token.balanceOf(alice))
        .should.be.bignumber.equal(amount);
    });
  });
};

module.exports = {
  shouldBehaveLikeIssuerWithEther,
};
