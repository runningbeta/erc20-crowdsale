const { inLogs } = require('./helpers/expectEvent');
const { expectThrow, expectThrowWithArgs } = require('./helpers/expectThrow');
const { duration, increaseTimeTo } = require('./helpers/increaseTime');
const { latestTime } = require('./helpers/latestTime');
const { EVMRevert } = require('./helpers/EVMRevert');
const { EVMThrow } = require('./helpers/EVMThrow');
const { ether } = require('./helpers/ether');

const BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-bignumber')(BigNumber))
  .use(require('chai-as-promised'))
  .should();

const { shouldBehaveLikeIssuer } = require('./payment/Issuer.behaviour');
const { shouldBehaveLikeIssuerWithEther } = require('./payment/IssuerWithEther.behaviour');

const Token = artifacts.require('FixedSupplyBurnableToken');
const TokenDistributor = artifacts.require('TokenDistributor');

contract('TokenDistributor', function ([_, benefactor, owner, customer, wallet, ...otherAccounts]) {
  const amount = ether(500.0);
  const weiAmount = ether(42.0);
  const rate = new BigNumber(1000);
  const cap = ether(42.0 * 6);
  let openingTime;
  let closingTime;
  let vestingPeriod;

  beforeEach(async function () {
    openingTime = (await latestTime()) + duration.days(1);
    closingTime = openingTime + duration.days(2);
    vestingPeriod = closingTime + duration.days(5);

    this.token = await Token.new({ from: benefactor });
    this.distributor = await TokenDistributor.new(
      benefactor,
      rate,
      wallet,
      this.token.address,
      cap,
      openingTime,
      closingTime,
      { from: owner }
    );
    this.issuer = this.distributor;
  });

  describe('as a Capped Issuer', function () {
    it('can issue tokens LoE to cap', async function () {
      await this.token.approve(this.issuer.address, amount * 4, { from: benefactor });
      await expectThrowWithArgs(this.issuer.contract
        .issue['address,uint256,uint256'], customer, amount * 3, weiAmount * 3, { from: owner, gas: 500000 });
    });

    it('fail to issue above cap', async function () {
      await this.token.approve(this.issuer.address, amount * 10, { from: benefactor });
      await expectThrowWithArgs(this.issuer.contract
        .issue['address,uint256,uint256'], customer, amount * 7, weiAmount * 7, { from: owner, gas: 500000 });
    });

    shouldBehaveLikeIssuer(benefactor, owner, customer, otherAccounts);
    shouldBehaveLikeIssuerWithEther(benefactor, owner, customer, otherAccounts);

    describe('after Finalization', function () {
      beforeEach(async function () {
        await this.issuer.finalize({ from: owner });
      });

      describe('as an Issuer', function () {
        it('fails to issue tokens', async function () {
          expectThrowWithArgs(this.issuer.contract
            .issue['address,uint256,uint256'], customer, amount * 3, weiAmount * 3, { from: owner, gas: 500000 });
        });
      });
    });
  });

  describe('as a IndividuallyCappedCrowdsale proxy', function () {
    it('fails to whitelist a user', async function () {
      await expectThrow(this.issuer.setUserCap(customer, weiAmount, { from: owner }), EVMRevert);
    });

    it('fails to whitelist a group', async function () {
      await expectThrow(this.issuer.setGroupCap(otherAccounts, weiAmount, { from: owner }), EVMRevert);
    });

    describe('after Finalization', function () {
      beforeEach(async function () {
        await this.token.approve(this.issuer.address, amount * 4, { from: benefactor });
        await this.issuer.finalize({ from: owner });
      });

      it('can whitelist users', async function () {
        await this.issuer.setUserCap(customer, weiAmount, { from: owner });
        (await this.issuer.getUserCap(customer)).should.bignumber.equal(weiAmount);
      });

      it('can whitelist groups', async function () {
        await this.issuer.setGroupCap(otherAccounts, weiAmount, { from: owner });
        (await this.issuer.getUserCap(otherAccounts[0])).should.bignumber.equal(weiAmount);
      });

      describe('before Crowdsale', function () {
        it('fails to claim leftover tokens', async function () {
          await expectThrow(this.issuer.claimUnsold({ from: owner }), EVMRevert);
        });
      });

      describe('during Crowdsale', function () {
        beforeEach(async function () {
          await increaseTimeTo(openingTime + 1);
        });

        it('fails to claim leftover tokens', async function () {
          await expectThrow(this.issuer.claimUnsold({ from: owner }), EVMRevert);
        });
      });

      describe('after Crowdsale', function () {
        beforeEach(async function () {
          await increaseTimeTo(closingTime + 1);
        });

        it('can claim leftover tokens', async function () {
          const initialBalance = await this.token.balanceOf(benefactor);
          await this.issuer.claimUnsold({ from: owner });

          const finalBalance = await this.token.balanceOf(benefactor);
          // we had only one issuance (amount) to a customer after we allowed 4 * amount
          finalBalance.should.be.bignumber.equal(amount.mul(4).add(initialBalance));
        });

        it('can claim leftover tokens twice', async function () {
          await this.issuer.claimUnsold({ from: owner });
          // token balance is zero, can be called again
          await this.issuer.claimUnsold({ from: owner });
        });
      });
    });
  });

  describe('as an TokenTimelockEscrow proxy', function () {
    beforeEach(async function () {
      await this.token.approve(this.issuer.address, amount.div(10), { from: benefactor });
    });

    it('can deposit and lock tokens', async function () {
      await this.issuer.depositAndLock(customer, amount.div(10), vestingPeriod, { from: owner });
      (await this.issuer.depositsOf(customer)).should.bignumber.equal(amount.div(10));
    });

    it('fails to deposit more than approved', async function () {
      await this.issuer.depositAndLock(customer, amount.div(5), vestingPeriod, { from: owner })
        .should.be.rejectedWith(EVMThrow);
    });

    it('fails to deposit twice to same user', async function () {
      await this.issuer.depositAndLock(customer, amount.div(20), vestingPeriod, { from: owner });
      (await this.issuer.depositsOf(customer)).should.bignumber.equal(amount.div(20));

      await this.issuer.depositAndLock(customer, amount.div(20), vestingPeriod, { from: owner })
        .should.be.rejectedWith(EVMRevert);
    });

    it('fails to withdraw', async function () {
      await this.issuer.depositAndLock(customer, amount.div(20), vestingPeriod, { from: owner });
      await this.issuer.withdrawPayments({ from: customer }).should.be.rejectedWith(EVMRevert);
    });

    describe('after vesting', async function () {
      beforeEach(async function () {
        await this.issuer.depositAndLock(customer, amount.div(20), vestingPeriod, { from: owner });
        (await increaseTimeTo(vestingPeriod + 1));
      });

      it('can withdraw', async function () {
        await this.issuer.withdrawPayments({ from: customer });
        (await this.issuer.depositsOf(customer)).should.be.bignumber.equal(0);
        (await this.token.balanceOf(customer)).should.be.bignumber.equal(amount.div(20));
      });

      it('can depositAndLock again after withdrawal', async function () {
        await this.issuer.withdrawPayments({ from: customer });
        vestingPeriod = (await latestTime()) + duration.days(5);
        await this.issuer.depositAndLock(customer, amount.div(20), vestingPeriod, { from: owner });
        (await this.issuer.depositsOf(customer)).should.bignumber.equal(amount.div(20));
      });
    });

    describe('after Finalization', function () {
      beforeEach(async function () {
        await this.issuer.finalize({ from: owner });
        await this.token.approve(this.issuer.address, amount.div(10), { from: benefactor });
      });

      it('fails to deposit and lock tokens', async function () {
        await this.issuer.depositAndLock(customer, amount.div(10), vestingPeriod, { from: owner })
          .should.be.rejectedWith(EVMRevert);
      });
    });
  });

  describe('as a Crowdsale Instatiator', function () {
    describe('after finalization', function () {
      beforeEach(async function () {
        await this.token.approve(this.issuer.address, amount * 4, { from: benefactor });
        await this.issuer.contract
          .issue['address,uint256,uint256'](customer, amount, weiAmount, { from: owner, gas: 500000 });
        this.finalizationReceipt = await this.issuer.finalize({ from: owner });
      });

      it('emits a CrowdsaleInstantiated event', async function () {
        inLogs(this.finalizationReceipt.logs, 'CrowdsaleInstantiated', { sender: owner });
      });

      it('instantiates the Crowdsale with correct allowance', async function () {
        const event = inLogs(this.finalizationReceipt.logs, 'CrowdsaleInstantiated', { sender: owner });
        event.args.allowance.should.be.bignumber.equal(amount * 3);
      });
    });
  });
});
