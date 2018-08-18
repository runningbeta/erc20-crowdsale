let utils = require("./utils/utils.js");

const BigNumber = web3.BigNumber;
const Token = artifacts.require('Token');
const PublicCrowdsale = artifacts.require('PublicCrowdsale');

require('chai')
  .use(require('chai-bignumber')(BigNumber))
  .use(require('chai-as-promised'))
  .should();

const INITTIAL_SUPPLY = 0;
const TOTAL_SUPPLY = 1000000000;

contract('Token', function ([
  owner,
  wallet,
  whitelisted,
  also_whitelisted_one,
  also_whitelisted_two,
  not_whitelisted,
  whitelist_revert,
  ...other
]) {
  before(async function () {
    this.token = await Token.new({ from: owner });
  });

  it('total suply is 0', async function () {
    await this.token.totalSupply().should.eventually.bignumber.equal(INITTIAL_SUPPLY);
  });

  describe('PublicCrowdsale', function () {
    let openingTime;
    let closingTime;

    before(async function () {
      openingTime = (await utils.latestTime()) + utils.duration.weeks(1);
      closingTime = openingTime + utils.duration.weeks(1);
      this.publicCrowdsale = await PublicCrowdsale.new(
        new BigNumber(6894),
        wallet,
        this.token.address,
        utils.ether(45000),
        openingTime,
        closingTime,
        { from: owner }
      );
      await this.token.transferOwnership(this.publicCrowdsale.address, { from: owner });
    });

    describe('Before Crowdsale', function() {
      it('Crowdsale is owned by the creator', async function () {
        await this.publicCrowdsale.owner().should.eventually.equal(owner);
      });

      it('Token is owned by crowdsale', async function () {
        await this.token.owner().should.eventually.equal(this.publicCrowdsale.address);
      });

      it('allows whitelisting of addresses', async function () {
        await this.publicCrowdsale.addAddressToWhitelist(whitelisted);
        await this.publicCrowdsale.whitelist(whitelisted).should.eventually.equal(true);
      });

      it('allows whitelisting of multiple addresses', async function () {
        await this.publicCrowdsale.addAddressesToWhitelist([also_whitelisted_one, also_whitelisted_two, whitelist_revert]);
        await this.publicCrowdsale.whitelist(also_whitelisted_one).should.eventually.equal(true);
        await this.publicCrowdsale.whitelist(also_whitelisted_two).should.eventually.equal(true);
        await this.publicCrowdsale.whitelist(whitelist_revert).should.eventually.equal(true);
      });

      it('allows the owner to revert whitelisted status', async function () {
        await this.publicCrowdsale.removeAddressFromWhitelist(whitelist_revert);
        await this.publicCrowdsale.whitelist(whitelist_revert).should.eventually.equal(false);

      })

      describe('disallows purchase of tokens', function () {
        it('whitelisted for himself', async function () {
          const beneficiary = whitelisted;
          const payee = whitelisted;
          await this.publicCrowdsale.buyTokens(
            beneficiary,
            {
              from: payee,
              value: utils.ether(1)
            }
          ).should.be.rejectedWith('revert');
        });

        it('whitelisted for non whitelisted', async function () {
          const beneficiary = not_whitelisted;
          const payee = whitelisted;
          await this.publicCrowdsale.buyTokens(
            beneficiary,
            {
              from: payee,
              value: utils.ether(1)
            }
          ).should.be.rejectedWith('revert');
        });
        
        it('non whitelisted for himself', async function () {
          const beneficiary = not_whitelisted;
          const payee = not_whitelisted;
          await this.publicCrowdsale.buyTokens(
            beneficiary,
            {
              from: payee,
              value: utils.ether(1)
            }
          ).should.be.rejectedWith('revert');
        });
        
        it('non whitelisted for whitelisted', async function () {
          const beneficiary = whitelisted;
          const payee = not_whitelisted;
          await this.publicCrowdsale.buyTokens(
            beneficiary,
            {
              from: payee,
              value: utils.ether(1)
            }
          ).should.be.rejectedWith('revert');
        });
      })
    });

    describe('During Crowdsale', function() {
      before(async function () {
        await utils.increaseTimeTo(openingTime + 1);
      });

      describe('disallows purchase of tokens', function () {
        it('non whitelisted for himself', async function () {
          const beneficiary = not_whitelisted;
          const payee = not_whitelisted;
          await this.publicCrowdsale.buyTokens(
            beneficiary,
            {
              from: payee,
              value: utils.ether(1),
            }
          ).should.be.rejectedWith('revert');
        });

        it('whitelisted for non whitelisted', async function () {
          const beneficiary = whitelist_revert;
          const payee = also_whitelisted_one;
          await this.publicCrowdsale.buyTokens(
            beneficiary,
            {
              from: payee,
              value: utils.ether(1),
            }
          ).should.be.rejectedWith('revert');
        });
      })

      describe('allows purchase of tokens', function () {
        it('whitelisted for himself', async function () {
          const beneficiary = whitelisted;
          const payee = whitelisted;
          await this.publicCrowdsale.buyTokens(
            beneficiary,
            {
              from: payee,
              value: utils.ether(0.000145054),
            }
          );
          await this.token.balanceOf(beneficiary)
          .should.eventually.bignumber.equal(1.000002276 * (10 ** 18));
        });

        it('non whitelisted for whitelisted', async function () {
          const beneficiary = also_whitelisted_one;
          const payee = not_whitelisted;
          await this.publicCrowdsale.buyTokens(
            beneficiary,
            {
              from: payee,
              value: utils.ether(0.000145054),
            }
          );
          await this.token.balanceOf(beneficiary)
          .should.eventually.bignumber.equal(1.000002276 * (10 ** 18));
        });
      });
    });
  });
});
