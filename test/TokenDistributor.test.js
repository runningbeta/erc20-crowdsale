const { inLogs } = require('./helpers/expectEvent');
const { expectThrow, expectThrowWithArgs } = require('./helpers/expectThrow');
const { latestTime } = require('./helpers/latestTime');
const { duration, increaseTimeTo } = require('./helpers/increaseTime');
const { EVMRevert } = require('./helpers/EVMRevert');
const { ether } = require('./helpers/ether');

const BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-bignumber')(BigNumber))
  .use(require('chai-as-promised'))
  .should();

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

  beforeEach(async function () {
    openingTime = (await latestTime()) + duration.days(1);
    closingTime = openingTime + duration.days(5);

    this.token = await Token.new({ from: benefactor });
    this.distributor = await TokenDistributor.new(
      benefactor,
      rate,
      wallet,
      this.token.address,
      cap,
      openingTime,
      closingTime,
      { from: owner, gas: 500000 }
    );
    this.issuer = this.distributor;
  });

  describe('as Finalizable Issuer', function () {
    describe('before finalization', function () {
      describe('as a Capped Issuer', function () {
        it('should respect the cap', async function () {
          await this.token.approve(this.issuer.address, amount * 10, { from: benefactor });
          await expectThrowWithArgs(this.issuer.contract
            .issue['address,uint256,uint256'], customer, amount * 7, weiAmount * 7, { from: owner, gas: 500000 });
        });
      });

      shouldBehaveLikeIssuerWithEther(benefactor, owner, customer, otherAccounts);

      describe('as a IndividuallyCappedCrowdsale proxy', function () {
        it('fails to whitelist a user', async function () {
          await expectThrow(this.issuer.setUserCap(customer, weiAmount, { from: owner }), EVMRevert);
        });

        it('fails to whitelist a group', async function () {
          await expectThrow(this.issuer.setGroupCap(otherAccounts, weiAmount, { from: owner }), EVMRevert);
        });
      });
    });

    describe('after finalization', function () {
      beforeEach(async function () {
        await this.token.approve(this.issuer.address, amount * 4, { from: benefactor });
        await this.issuer.contract
          .issue['address,uint256,uint256'](customer, amount, weiAmount, { from: owner, gas: 500000 });
        this.finalizationReceipt = await this.issuer.finalize({ from: owner });
      });

      describe('as a Crowdsale Instatiator', function () {
        it('emits a CrowdsaleInstantiated event', async function () {
          inLogs(this.finalizationReceipt.logs, 'CrowdsaleInstantiated', { sender: owner });
        });

        it('instantiates the Crowdsale with correct allowance', async function () {
          const event = inLogs(this.finalizationReceipt.logs, 'CrowdsaleInstantiated', { sender: owner });
          event.args.allowance.should.be.bignumber.equal(amount * 3);
        });
      });

      describe('as an Issuer', function () {
        it('should refuse to issue tokens', async function () {
          expectThrowWithArgs(this.issuer.contract
            .issue['address,uint256,uint256'], customer, amount * 3, weiAmount * 3, { from: owner, gas: 500000 });
        });
      });

      describe('as a IndividuallyCappedCrowdsale proxy', function () {
        it('whitelist a user', async function () {
          await this.issuer.setUserCap(customer, weiAmount, { from: owner });
        });

        it('whitelist a group', async function () {
          await this.issuer.setGroupCap(otherAccounts, weiAmount, { from: owner });
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

          it('claim leftover tokens', async function () {
            const initialBalance = await this.token.balanceOf(benefactor);
            await this.issuer.claimUnsold({ from: owner });

            const finalBalance = await this.token.balanceOf(benefactor);
            // we had only one issuance (amount) to a customer after we allowed 4 * amount
            finalBalance.should.be.bignumber.equal(amount.mul(3).add(initialBalance));
          });
        });
      });
    });
  });
});
