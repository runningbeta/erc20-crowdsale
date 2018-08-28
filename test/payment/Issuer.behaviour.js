const { expectThrow } = require('../helpers/expectThrow');
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
      await this.issuer.contract.issue['address,uint256'](customer, amount, { from: owner, gas: 500000 });

      (await this.issuer.issuedCount()).should.be.bignumber.equal(amount);
      (await this.token.balanceOf(customer)).should.be.bignumber.equal(amount);
    });

    it('issue tokens multiple times', async function () {
      await this.issuer.contract.issue['address,uint256'](customer, amount, { from: owner, gas: 500000 });
      await this.issuer.contract.issue['address,uint256'](customer2, amount * 2, { from: owner, gas: 500000 });

      (await this.issuer.issuedCount()).should.be.bignumber.equal(amount * 3);

      (await this.token.balanceOf(customer)).should.be.bignumber.equal(amount);
      (await this.token.balanceOf(customer2)).should.be.bignumber.equal(amount * 2);
    });

    it('only benefactor can issue', async function () {
      await expectThrow(() => this.issuer.contract
        .issue['address,uint256'](customer, amount * 3, { from: customer, gas: 500000 }),
      EVMRevert);
    });

    it('fails to issue over allowance', async function () {
      await expectThrow(() => this.issuer.contract
        .issue['address,uint256'](customer, amount * 5, { from: owner, gas: 500000 }),
      EVMRevert);
    });

    it('fails to issue twice to same address', async function () {
      await this.issuer.contract.issue['address,uint256'](customer, amount, { from: owner, gas: 500000 });
      await expectThrow(() => this.issuer.contract
        .issue['address,uint256'](customer, amount, { from: owner, gas: 500000 }), EVMRevert);
    });
  });
}

module.exports = {
  shouldBehaveLikeIssuer,
};
