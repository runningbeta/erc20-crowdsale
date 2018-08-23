const expectEvent = require('../helpers/expectEvent');
const { EVMRevert } = require('../helpers/EVMRevert');
const { EVMThrow } = require('../helpers/EVMThrow');

const BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-bignumber')(BigNumber))
  .use(require('chai-as-promised'))
  .should();

function shouldBehaveLikeIssuerWithEther(owner, benefactor, customer, [customer2, ...otherAccounts]) {
  const amount = web3.toWei(500.0, 'ether');
  const weiAmount = web3.toWei(50.0, 'ether')

  describe('as an owner', function () {
    beforeEach(async function() {
      await this.token.approve(this.issuer.address, amount * 4, { from: benefactor });
    });

    it('issue some tokens', async function () {
      await this.issuer.issueWithEther(customer, amount, weiAmount, { from: owner });

      (await this.issuer.issuedCount()).should.be.bignumber.equal(amount);
      (await this.issuer.weiRaised()).should.be.bignumber.equal(weiAmount);
      (await this.token.balanceOf(customer)).should.be.bignumber.equal(amount);
    });

    it('issue tokens multiple times', async function () {
      await this.issuer.issueWithEther(customer, amount, weiAmount, { from: owner });
      await this.issuer.issueWithEther(customer2, amount * 2, weiAmount * 2, { from: owner });

      (await this.issuer.issuedCount()).should.be.bignumber.equal(amount * 3);
      (await this.issuer.weiRaised()).should.be.bignumber.equal(weiAmount * 3);

      (await this.token.balanceOf(customer)).should.be.bignumber.equal(amount);
      (await this.token.balanceOf(customer2)).should.be.bignumber.equal(amount * 2);
    });

    it('only issuer can issue', async function () {
      await this.issuer
        .issueWithEther(customer, amount * 3, weiAmount * 3, { from: customer })
        .should.be.rejectedWith(EVMRevert);
    });

    it('fails to issue over allowance', async function () {
      await this.issuer
        .issueWithEther(customer, amount * 10, weiAmount * 10, { from: owner })
        .should.be.rejectedWith(EVMRevert);
    });

    it('fails to issue twice to same address', async function () {
      await this.issuer.issueWithEther(customer, amount, weiAmount, { from: owner });

      await this.issuer
        .issueWithEther(customer, amount, weiAmount, { from: owner })
        .should.be.rejectedWith(EVMRevert);
    });
  });
}

module.exports = {
  shouldBehaveLikeIssuerWithEther,
};
