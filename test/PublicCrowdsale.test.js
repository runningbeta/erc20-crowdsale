const { ether } = require('./helpers/ether');
const { duration, increaseTimeTo } = require('./helpers/increaseTime');
const { latestTime } = require('./helpers/latestTime');

const BigNumber = web3.BigNumber;
const Token = artifacts.require('Token');
const PublicCrowdsale = artifacts.require('PublicCrowdsale');

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
  also_whitelisted_one,
  also_whitelisted_two,
  invests_too_small,
  invests_too_big,
  not_whitelisted,
  whitelist_revert,
  ...other
]) {
  before(async function () {
    this.token = await Token.new({ from: owner });
  });

  it(`total suply is ${INITIAL_SUPPLY}`, async function () {
    (await this.token.totalSupply()).should.be.bignumber.equal(INITIAL_SUPPLY);
  });

  it('refuses ether', async function () {
    await this.token.send(ether(1), { from: owner }).should.be.rejectedWith('revert');
  });

  describe('PublicCrowdsale', function () {
    let openingTime;
    let closingTime;

    before(async function () {
      openingTime = (await latestTime()) + duration.weeks(1);
      closingTime = openingTime + duration.weeks(1);
      this.crowdsale = await PublicCrowdsale.new(
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

    describe('Before Crowdsale', function() {
      it('Crowdsale refuses directly sent ether', async function () {
        await this.crowdsale.send(ether(1), { from: owner }).should.be.rejectedWith('revert');
      });

      it('Crowdsale is owned by the creator', async function () {
        await this.crowdsale.owner().should.eventually.equal(owner);
      });

      it('Token is owned by crowdsale', async function () {
        await this.token.owner().should.eventually.equal(this.crowdsale.address);
      });

      it('allows whitelisting of addresses', async function () {
        await this.crowdsale.setUserCap(whitelisted, ether(10));
        (await this.crowdsale.getUserCap(whitelisted)).should.be.bignumber.equal(ether(10));
      });

      it('allows whitelisting of multiple addresses', async function () {
        const beneficiaries = [
          also_whitelisted_one,
          also_whitelisted_two,
          whitelist_revert,
          invests_too_small,
          invests_too_big
        ];
        await this.crowdsale.setGroupCap(beneficiaries, ether(10));

        (await this.crowdsale.getUserCap(also_whitelisted_one)).should.be.bignumber.equal(ether(10));
        (await this.crowdsale.getUserCap(also_whitelisted_two)).should.be.bignumber.equal(ether(10));
        (await this.crowdsale.getUserCap(whitelist_revert)).should.be.bignumber.equal(ether(10));
      });

      it('allows the owner to revert whitelisted status', async function () {
        await this.crowdsale.setUserCap(whitelist_revert, ether(0));
        (await this.crowdsale.getUserCap(whitelist_revert)).should.be.bignumber.equal(ether(0));
      });

      describe('disallows purchase of tokens', function () {
        it('whitelisted for himself', async function () {
          const beneficiary = whitelisted;
          const payee = whitelisted;
          const options = { from: payee, value: ether(1) };
          await this.crowdsale.buyTokens(beneficiary, options).should.be.rejectedWith('revert');
        });

        it('whitelisted for non whitelisted', async function () {
          const beneficiary = not_whitelisted;
          const payee = whitelisted;
          const options = { from: payee, value: ether(1) };
          await this.crowdsale.buyTokens(beneficiary, options).should.be.rejectedWith('revert');
        });

        it('non whitelisted for himself', async function () {
          const beneficiary = not_whitelisted;
          const payee = not_whitelisted;
          const options = { from: payee, value: ether(1) };
          await this.crowdsale.buyTokens(beneficiary, options).should.be.rejectedWith('revert');
        });

        it('non whitelisted for whitelisted', async function () {
          const beneficiary = whitelisted;
          const payee = not_whitelisted;
          const options = { from: payee, value: ether(1) };
          await this.crowdsale.buyTokens(beneficiary, options).should.be.rejectedWith('revert');
        });
      })
    });

    describe('During Crowdsale', function() {
      before(async function () {
        await increaseTimeTo(openingTime + 1);
      });

      describe('Disallows purchase of tokens', function () {
        it('non whitelisted for himself', async function () {
          const beneficiary = not_whitelisted;
          const payee = not_whitelisted;
          const options = { from: payee, value: ether(1) };
          await this.crowdsale.buyTokens(beneficiary, options).should.be.rejectedWith('revert');
        });

        it('whitelisted for non whitelisted', async function () {
          const beneficiary = whitelist_revert;
          const payee = also_whitelisted_one;
          const options = { from: payee, value: ether(1) };
          await this.crowdsale.buyTokens(beneficiary, options).should.be.rejectedWith('revert');
        });

        it('if investment is too big', async function () {
          const beneficiary = invests_too_big;
          const payee = invests_too_big;
          const options = { from: payee, value: ether(10.1) };
          await this.crowdsale.buyTokens(beneficiary, options).should.be.rejectedWith('revert');
        });
      })

      describe('Allows purchase of tokens', function () {
        it('whitelisted for himself', async function () {
          const beneficiary = whitelisted;
          const payee = whitelisted;

          await this.crowdsale.buyTokens(beneficiary, { from: payee, value: ether(1) });
          (await this.token.balanceOf(beneficiary)).should.be.bignumber.not.equal(0);
        });

        it('non whitelisted for whitelisted', async function () {
          const beneficiary = also_whitelisted_one;
          const payee = not_whitelisted;

          await this.crowdsale.buyTokens(beneficiary, { from: payee, value: ether(1) });
          (await this.token.balanceOf(beneficiary)).should.be.bignumber.not.equal(0);
        });
      });
    });

    describe('After Crowdsale', function () {
      it(`returns total balance less than max cap (${TOTAL_SUPPLY})`, async function () {
        (await this.token.totalSupply()).should.be.bignumber.at.most(TOTAL_SUPPLY);
      });
    });
  });
});
