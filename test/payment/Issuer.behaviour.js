const { EVMRevert } = require('../helpers/EVMRevert');
const { ether } = require('../helpers/ether');

const BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-bignumber')(BigNumber))
  .use(require('chai-as-promised'))
  .should();

function shouldBehaveLikeIssuer (benefactor, owner, customer, [customer2, ...otherAccounts]) {
  const amount = ether(420.0);

  describe('as an Issuer', function () {
    beforeEach(async function () {
      await this.token.approve(this.issuer.address, amount * 4, { from: benefactor });
    });

    it('issue some tokens', async function () {
      await this.issuer.issue(customer, amount, { from: owner });

      (await this.issuer.issuedCount()).should.be.bignumber.equal(amount);
      (await this.token.balanceOf(customer)).should.be.bignumber.equal(amount);
    });

    it('issue tokens multiple times', async function () {
      await this.issuer.issue(customer, amount, { from: owner });
      await this.issuer.issue(customer2, amount * 2, { from: owner });

      (await this.issuer.issuedCount()).should.be.bignumber.equal(amount * 3);

      (await this.token.balanceOf(customer)).should.be.bignumber.equal(amount);
      (await this.token.balanceOf(customer2)).should.be.bignumber.equal(amount * 2);
    });

    it('only benefactor can issue', async function () {
      await (this.issuer.issue(customer, amount * 3, { from: customer })).should.be.rejectedWith(EVMRevert);
    });

    it('fails to issue over allowance', async function () {
      await (this.issuer.issue(customer, amount * 5, { from: owner })).should.be.rejectedWith(EVMRevert);
    });

    it('fails to issue twice to same address', async function () {
      await this.issuer.issue(customer, amount, { from: owner });
      await (this.issuer.issue(customer, amount, { from: owner })).should.be.rejectedWith(EVMRevert);
    });
  });
}

module.exports = {
  shouldBehaveLikeIssuer,
};
