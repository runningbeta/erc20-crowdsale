const { expectThrowWithArgs } = require('../helpers/expectThrow');

const BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-bignumber')(BigNumber))
  .use(require('chai-as-promised'))
  .should();

function shouldBehaveLikeIssuerWithEther(benefactor, owner, customer, [customer2, ...otherAccounts]) {
  const amount = web3.toWei(500.0, 'ether');
  const weiAmount = web3.toWei(50.0, 'ether');

  describe('as an owner', function () {
    beforeEach(async function() {
      await this.token.approve(this.issuer.address, amount * 4, { from: benefactor });
    });

    it('issue some tokens', async function () {
      await this.issuer.contract.issue['address,uint256,uint256'](customer, amount, weiAmount, { from: owner, gas: 500000 });

      (await this.issuer.issuedCount()).should.be.bignumber.equal(amount);
      (await this.issuer.weiRaised()).should.be.bignumber.equal(weiAmount);
      (await this.token.balanceOf(customer)).should.be.bignumber.equal(amount);
    });

    it('issue tokens multiple times', async function () {
      await this.issuer.contract.issue['address,uint256,uint256'](customer, amount, weiAmount, { from: owner, gas: 500000 });
      await this.issuer.contract.issue['address,uint256,uint256'](customer2, amount * 2, weiAmount * 2, { from: owner, gas: 500000 });

      (await this.issuer.issuedCount()).should.be.bignumber.equal(amount * 3);
      (await this.issuer.weiRaised()).should.be.bignumber.equal(weiAmount * 3);

      (await this.token.balanceOf(customer)).should.be.bignumber.equal(amount);
      (await this.token.balanceOf(customer2)).should.be.bignumber.equal(amount * 2);
    });

    it('only benefactor can issue', async function () {
      expectThrowWithArgs(this.issuer.contract.issue['address,uint256,uint256'], customer, amount * 3, weiAmount * 3, { from: customer, gas: 500000 });
    });

    it('fails to issue over allowance', async function () {
      expectThrowWithArgs(this.issuer.contract.issue['address,uint256,uint256'], customer, amount * 10, weiAmount * 10, { from: owner, gas: 500000 });
    });

    it('fails to issue twice to same address', async function () {
      this.issuer.contract.issue['address,uint256,uint256'](customer, amount, weiAmount, { from: owner, gas: 500000 });

      expectThrowWithArgs(this.issuer.contract.issue['address,uint256,uint256'], customer, amount, weiAmount, { from: owner, gas: 500000 });
    });
  });
}

module.exports = {
  shouldBehaveLikeIssuerWithEther,
};
