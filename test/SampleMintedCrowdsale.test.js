const { duration, increaseTimeTo } = require('./helpers/increaseTime');
const { latestTime } = require('./helpers/latestTime');
const { EVMRevert } = require('./helpers/EVMRevert');
const { ether } = require('./helpers/ether');

const BigNumber = web3.BigNumber;
const Token = artifacts.require('Token');
const SampleMintedCrowdsale = artifacts.require('SampleMintedCrowdsale');

require('chai')
  .use(require('chai-bignumber')(BigNumber))
  .use(require('chai-as-promised'))
  .should();

const INITIAL_SUPPLY = 0;
const TOTAL_SUPPLY = 1000000000 * (10 ** 18);

contract('Token', function ([
  owner,
  wallet,
  whitelisted,
  alsoWhitelistedOne,
  alsoWhitelistedTwo,
  investsTooSmall,
  investsTooBig,
  notWhitelisted,
  whitelistRevert,
  ...other
]) {
  before(async function () {
    this.token = await Token.new({ from: owner });
  });

  it(`total suply is ${INITIAL_SUPPLY}`, async function () {
    (await this.token.totalSupply())
      .should.be.bignumber.equal(INITIAL_SUPPLY);
  });

  it('refuses ether', async function () {
    await (this.token.send(ether(1), { from: owner }))
      .should.be.rejectedWith(EVMRevert);
  });

  describe('SampleMintedCrowdsale', function () {
    let openingTime;
    let closingTime;

    before(async function () {
      openingTime = (await latestTime()) + duration.weeks(1);
      closingTime = openingTime + duration.weeks(1);
      this.crowdsale = await SampleMintedCrowdsale.new(
        new BigNumber(6894),
        wallet,
        this.token.address,
        ether(45000),
        openingTime,
        closingTime,
        { from: owner }
      );
      await this.token.transferOwnership(this.crowdsale.address, { from: owner });
    });

    it('can change wallet', async function () {
      (await this.crowdsale.wallet())
        .should.be.equal(wallet);
      await this.crowdsale.setWallet(other[0]);
      (await this.crowdsale.wallet())
        .should.be.equal(other[0]);
    });

    it('fails to unset wallet', async function () {
      await (this.crowdsale.setWallet(0x0))
        .should.be.rejectedWith(EVMRevert);
    });

    it('non-owner should not be able to change wallet', async function () {
      await (this.crowdsale.setWallet(other[0], { from: other[0] }))
        .should.be.rejectedWith(EVMRevert);
    });

    describe('Before Crowdsale', function () {
      it('Crowdsale refuses directly sent ether', async function () {
        await (this.crowdsale.send(ether(1), { from: owner }))
          .should.be.rejectedWith(EVMRevert);
      });

      it('Crowdsale is owned by the creator', async function () {
        (await this.crowdsale.owner())
          .should.be.equal(owner);
      });

      it('Token is owned by crowdsale', async function () {
        (await this.token.owner())
          .should.be.equal(this.crowdsale.address);
      });

      it('allows whitelisting of addresses', async function () {
        await this.crowdsale.setUserCap(whitelisted, ether(10));
        (await this.crowdsale.getUserCap(whitelisted))
          .should.be.bignumber.equal(ether(10));
      });

      it('allows whitelisting of multiple addresses', async function () {
        const beneficiaries = [
          alsoWhitelistedOne,
          alsoWhitelistedTwo,
          whitelistRevert,
          investsTooSmall,
          investsTooBig,
        ];
        await this.crowdsale.setGroupCap(beneficiaries, ether(10));

        (await this.crowdsale.getUserCap(alsoWhitelistedOne))
          .should.be.bignumber.equal(ether(10));
        (await this.crowdsale.getUserCap(alsoWhitelistedTwo))
          .should.be.bignumber.equal(ether(10));
        (await this.crowdsale.getUserCap(whitelistRevert))
          .should.be.bignumber.equal(ether(10));
      });

      it('allows the owner to revert whitelisted status', async function () {
        await this.crowdsale.setUserCap(whitelistRevert, ether(0));
        (await this.crowdsale.getUserCap(whitelistRevert))
          .should.be.bignumber.equal(ether(0));
      });

      describe('disallows purchase of tokens', function () {
        it('whitelisted for himself', async function () {
          const beneficiary = whitelisted;
          const payee = whitelisted;
          const options = { from: payee, value: ether(1) };
          await (this.crowdsale.buyTokens(beneficiary, options))
            .should.be.rejectedWith(EVMRevert);
        });

        it('whitelisted for non whitelisted', async function () {
          const beneficiary = notWhitelisted;
          const payee = whitelisted;
          const options = { from: payee, value: ether(1) };
          await (this.crowdsale.buyTokens(beneficiary, options))
            .should.be.rejectedWith(EVMRevert);
        });

        it('non whitelisted for himself', async function () {
          const beneficiary = notWhitelisted;
          const payee = notWhitelisted;
          const options = { from: payee, value: ether(1) };
          await (this.crowdsale.buyTokens(beneficiary, options))
            .should.be.rejectedWith(EVMRevert);
        });

        it('non whitelisted for whitelisted', async function () {
          const beneficiary = whitelisted;
          const payee = notWhitelisted;
          const options = { from: payee, value: ether(1) };
          await (this.crowdsale.buyTokens(beneficiary, options))
            .should.be.rejectedWith(EVMRevert);
        });
      });
    });

    describe('During Crowdsale', function () {
      before(async function () {
        await increaseTimeTo(openingTime + 1);
      });

      describe('Disallows purchase of tokens', function () {
        it('non whitelisted for himself', async function () {
          const beneficiary = notWhitelisted;
          const payee = notWhitelisted;
          const options = { from: payee, value: ether(1) };
          await (this.crowdsale.buyTokens(beneficiary, options))
            .should.be.rejectedWith(EVMRevert);
        });

        it('whitelisted for non whitelisted', async function () {
          const beneficiary = whitelistRevert;
          const payee = alsoWhitelistedOne;
          const options = { from: payee, value: ether(1) };
          await (this.crowdsale.buyTokens(beneficiary, options))
            .should.be.rejectedWith(EVMRevert);
        });

        it('if investment is too big', async function () {
          const beneficiary = investsTooBig;
          const payee = investsTooBig;
          const options = { from: payee, value: ether(10.1) };
          await (this.crowdsale.buyTokens(beneficiary, options))
            .should.be.rejectedWith(EVMRevert);
        });
      });

      describe('Allows purchase of tokens', function () {
        it('whitelisted for himself', async function () {
          const beneficiary = whitelisted;
          const payee = whitelisted;

          await this.crowdsale.buyTokens(beneficiary, { from: payee, value: ether(1) });
          (await this.token.balanceOf(beneficiary))
            .should.be.bignumber.not.equal(0);
        });

        it('non whitelisted for whitelisted', async function () {
          const beneficiary = alsoWhitelistedOne;
          const payee = notWhitelisted;

          await this.crowdsale.buyTokens(beneficiary, { from: payee, value: ether(1) });
          (await this.token.balanceOf(beneficiary))
            .should.be.bignumber.not.equal(0);
        });
      });
    });

    describe('After Crowdsale', function () {
      it(`returns total balance less than max cap (${TOTAL_SUPPLY})`, async function () {
        (await this.token.totalSupply())
          .should.be.bignumber.at.most(TOTAL_SUPPLY);
      });
    });
  });
});
