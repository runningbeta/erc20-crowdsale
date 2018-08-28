const { inLogs, notInLogs } = require('./helpers/expectEvent');
const { expectThrow } = require('./helpers/expectThrow');
const { duration, increaseTimeTo } = require('./helpers/increaseTime');
const { advanceBlock } = require('./helpers/advanceToBlock');
const { latestTime } = require('./helpers/latestTime');
const { EVMRevert } = require('./helpers/EVMRevert');
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
const TokenTimelock = artifacts.require('TokenTimelock');

contract('TokenDistributor', function ([_, benefactor, owner, customer, wallet, ...otherAccounts]) {
  const amount = ether(500.0);
  const weiAmount = ether(42.0);
  const rate = new BigNumber(1000);
  const cap = ether(42.0 * 6);

  before(async function () {
    (await advanceBlock()); // get blocks in sync with now
  });

  beforeEach(async function () {
    this.now = (await latestTime());
    this.openingTime = this.now + duration.days(1);
    this.closingTime = this.openingTime + duration.days(2);
    this.releaseTime = this.closingTime + duration.days(5);
    this.bonusTime = this.closingTime + duration.days(10);

    this.token = await Token.new({ from: benefactor });
    this.distributor = await TokenDistributor.new(
      benefactor,
      rate,
      wallet,
      this.token.address,
      cap,
      this.openingTime,
      this.closingTime,
      this.bonusTime,
      { from: owner }
    );
    this.issuer = this.distributor;
  });

  describe('when creating', function () {
    it('fails if benefactor address is 0x0', async function () {
      await (TokenDistributor.new(
        0x0,
        rate,
        wallet,
        this.token.address,
        cap,
        this.openingTime,
        this.closingTime,
        this.bonusTime,
        { from: owner }
      )).should.be.rejectedWith(EVMRevert);
    });

    it('fails if rate is zero', async function () {
      await (TokenDistributor.new(
        benefactor,
        0,
        wallet,
        this.token.address,
        cap,
        this.openingTime,
        this.closingTime,
        this.bonusTime,
        { from: owner }
      )).should.be.rejectedWith(EVMRevert);
    });

    it('fails if wallet address is 0x0', async function () {
      await (TokenDistributor.new(
        benefactor,
        rate,
        0x0,
        this.token.address,
        cap,
        this.openingTime,
        this.closingTime,
        this.bonusTime,
        { from: owner }
      )).should.be.rejectedWith(EVMRevert);
    });

    it('fails if token contract address is 0x0', async function () {
      await (TokenDistributor.new(
        benefactor,
        rate,
        wallet,
        0x0,
        cap,
        this.openingTime,
        this.closingTime,
        this.bonusTime,
        { from: owner }
      )).should.be.rejectedWith(EVMRevert);
    });

    it('fails if cap is 0', async function () {
      await (TokenDistributor.new(
        benefactor,
        rate,
        wallet,
        this.token.address,
        0,
        this.openingTime,
        this.closingTime,
        this.bonusTime,
        { from: owner }
      )).should.be.rejectedWith(EVMRevert);
    });

    it('fails if opening time has passed', async function () {
      await (TokenDistributor.new(
        benefactor,
        rate,
        wallet,
        this.token.address,
        cap,
        this.now,
        this.closingTime,
        this.bonusTime,
        { from: owner }
      )).should.be.rejectedWith(EVMRevert);
    });

    it('fails if opening time if after closing time', async function () {
      await (TokenDistributor.new(
        benefactor,
        rate,
        wallet,
        this.token.address,
        cap,
        this.openingTime,
        this.now,
        this.bonusTime,
        { from: owner }
      )).should.be.rejectedWith(EVMRevert);
    });

    it('fails if bonus time if before closing time', async function () {
      await (TokenDistributor.new(
        benefactor,
        rate,
        wallet,
        this.token.address,
        cap,
        this.openingTime,
        this.closingTime,
        this.now,
        { from: owner }
      )).should.be.rejectedWith(EVMRevert);
    });
  });

  describe('as a Capped Issuer', function () {
    it('can issue tokens LoE to cap', async function () {
      await this.token.approve(this.distributor.address, amount, { from: benefactor });
      await this.distributor.contract
        .issue['address,uint256,uint256'](customer, amount, weiAmount, { from: owner, gas: 500000 });
    });

    it('fail to issue above cap', async function () {
      await this.token.approve(this.distributor.address, amount.mul(10), { from: benefactor });
      await expectThrow(() => this.distributor.contract
        .issue['address,uint256,uint256'](customer, amount.mul(7), weiAmount.mul(7), { from: owner, gas: 500000 }),
      EVMRevert);
    });

    shouldBehaveLikeIssuer(benefactor, owner, customer, otherAccounts);
    shouldBehaveLikeIssuerWithEther(benefactor, owner, customer, otherAccounts);

    describe('after Finalization', function () {
      beforeEach(async function () {
        await this.distributor.finalize({ from: owner });
      });

      describe('as an Issuer', function () {
        it('fails to issue tokens', async function () {
          expectThrow(() => this.distributor.contract
            .issue['address,uint256,uint256'](customer, amount * 3, weiAmount * 3, { from: owner, gas: 500000 }),
          EVMRevert);
        });
      });
    });
  });

  describe('as a IndividuallyCappedCrowdsale proxy', function () {
    it('fails to whitelist a user', async function () {
      await expectThrow(() => this.distributor.setUserCap(customer, weiAmount, { from: owner }), EVMRevert);
    });

    it('fails to whitelist a group', async function () {
      await expectThrow(() => this.distributor.setGroupCap(otherAccounts, weiAmount, { from: owner }), EVMRevert);
    });

    describe('after Finalization', function () {
      beforeEach(async function () {
        await this.token.approve(this.distributor.address, amount * 4, { from: benefactor });
        await this.distributor.finalize({ from: owner });
      });

      it('can whitelist users', async function () {
        await this.distributor.setUserCap(customer, weiAmount, { from: owner });
        (await this.distributor.getUserCap(customer)).should.bignumber.equal(weiAmount);
      });

      it('can whitelist groups', async function () {
        await this.distributor.setGroupCap(otherAccounts, weiAmount, { from: owner });
        (await this.distributor.getUserCap(otherAccounts[0])).should.bignumber.equal(weiAmount);
      });

      describe('before Crowdsale', function () {
        it('fails to claim leftover tokens', async function () {
          await expectThrow(() => this.distributor.claimUnsold({ from: owner }), EVMRevert);
        });
      });

      describe('during Crowdsale', function () {
        beforeEach(async function () {
          await increaseTimeTo(this.openingTime + 1);
        });

        it('fails to claim leftover tokens', async function () {
          await expectThrow(() => this.distributor.claimUnsold({ from: owner }), EVMRevert);
        });
      });

      describe('after Crowdsale', function () {
        beforeEach(async function () {
          await increaseTimeTo(this.closingTime + 1);
        });

        it('can claim leftover tokens', async function () {
          const initialBalance = await this.token.balanceOf(benefactor);
          await this.distributor.claimUnsold({ from: owner });

          const finalBalance = await this.token.balanceOf(benefactor);
          // we had only no issuances after giving allowance (amount * 4)
          await (finalBalance.should.be.bignumber.equal(amount.mul(4).plus(initialBalance)));
        });

        it('can claim leftover tokens twice', async function () {
          await this.distributor.claimUnsold({ from: owner });
          // token balance is zero, can be called again
          await this.distributor.claimUnsold({ from: owner });
        });
      });
    });
  });

  describe('as an TokenTimelockFactory proxy', function () {
    beforeEach(async function () {
      await this.token.approve(this.distributor.address, amount.div(10), { from: benefactor });
    });

    it('can deposit and lock tokens', async function () {
      const { logs } = await this.distributor
        .depositAndLock(customer, amount.div(10), this.releaseTime, { from: owner });
      const event = inLogs(logs, 'ContractInstantiation', { sender: this.distributor.address });
      const walletAddr = event.args.instantiation;

      (await this.token.balanceOf(walletAddr)).should.bignumber.equal(amount.div(10));
      (await TokenTimelock.at(walletAddr).beneficiary()).should.be.equal(customer);
    });

    it('fails to deposit more than approved', async function () {
      await (this.distributor.depositAndLock(customer, amount.div(5), this.releaseTime, { from: owner }))
        .should.be.rejectedWith(EVMRevert);
    });

    it('can deposit twice to same user', async function () {
      // First deposit
      const resp1 = await this.distributor
        .depositAndLock(customer, amount.div(100), this.releaseTime, { from: owner });
      let event = inLogs(resp1.logs, 'ContractInstantiation', { sender: this.distributor.address });
      let walletAddr = event.args.instantiation;

      (await this.token.balanceOf(walletAddr)).should.bignumber.equal(amount.div(100));
      (await TokenTimelock.at(walletAddr).beneficiary()).should.be.equal(customer);

      // Second deposit
      const resp2 = await this.distributor
        .depositAndLock(customer, amount.div(200), this.releaseTime + duration.days(10), { from: owner });
      event = inLogs(resp2.logs, 'ContractInstantiation', { sender: this.distributor.address });
      walletAddr = event.args.instantiation;

      (await this.token.balanceOf(walletAddr)).should.bignumber.equal(amount.div(200));
      (await TokenTimelock.at(walletAddr).beneficiary()).should.be.equal(customer);
    });

    it('fails to withdraw', async function () {
      const { logs } = await this.distributor
        .depositAndLock(customer, amount.div(10), this.releaseTime, { from: owner });
      const event = inLogs(logs, 'ContractInstantiation', { sender: this.distributor.address });
      const walletAddr = event.args.instantiation;

      (await this.token.balanceOf(walletAddr)).should.bignumber.equal(amount.div(10));
      (await TokenTimelock.at(walletAddr).beneficiary()).should.be.equal(customer);
      await (TokenTimelock.at(walletAddr).release({ from: customer })).should.be.rejectedWith(EVMRevert);
    });

    describe('after release time', async function () {
      beforeEach(async function () {
        const { logs } = await this.distributor
          .depositAndLock(customer, amount.div(20), this.releaseTime, { from: owner });
        const event = inLogs(logs, 'ContractInstantiation', { sender: this.distributor.address });
        this.walletAddr = event.args.instantiation;

        (await increaseTimeTo(this.releaseTime + 1));
      });

      it('can withdraw', async function () {
        (await TokenTimelock.at(this.walletAddr).beneficiary()).should.be.equal(customer);

        await TokenTimelock.at(this.walletAddr).release({ from: customer });

        (await this.token.balanceOf(this.walletAddr)).should.bignumber.equal(0);
        (await this.token.balanceOf(customer)).should.bignumber.equal(amount.div(20));
      });
    });

    describe('after Finalization', function () {
      beforeEach(async function () {
        await this.distributor.finalize({ from: owner });
        await this.token.approve(this.distributor.address, amount.div(10), { from: benefactor });
      });

      it('fails to deposit and lock tokens', async function () {
        await (this.distributor.depositAndLock(customer, amount.div(10), this.releaseTime, { from: owner }))
          .should.be.rejectedWith(EVMRevert);
      });
    });
  });

  describe('as a Crowdsale Instatiator', function () {
    describe('after finalization', function () {
      beforeEach(async function () {
        await this.token.approve(this.distributor.address, amount * 4, { from: benefactor });
        await this.distributor.contract
          .issue['address,uint256,uint256'](customer, amount, weiAmount, { from: owner, gas: 500000 });
      });

      describe('if cap reached', function () {
        beforeEach(async function () {
          await this.distributor.contract
            .issue['address,uint256,uint256'](
              otherAccounts[0],
              amount.mul(3),
              weiAmount.mul(5),
              { from: owner, gas: 500000 }
            );
          this.finalizationReceipt = await this.distributor.finalize({ from: owner });
        });

        it('there is no CrowdsaleInstantiated event', async function () {
          notInLogs(this.finalizationReceipt.logs, 'CrowdsaleInstantiated');
        });

        it('crowdsale address is 0x0', async function () {
          (await this.distributor.crowdsale()).should.equal('0x0000000000000000000000000000000000000000');
        });

        it('fails to whitelist a user', async function () {
          await expectThrow(() => this.distributor.setUserCap(customer, weiAmount, { from: owner }), EVMRevert);
        });
      });

      describe('if cap not reached', function () {
        beforeEach(async function () {
          this.finalizationReceipt = await this.distributor.finalize({ from: owner });
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
});
