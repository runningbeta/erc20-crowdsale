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
  not_whitelisted,
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
      })

      it('allows whitelisting of addresses', async function () {
        await this.publicCrowdsale.addAddressToWhitelist(whitelisted);
        await this.publicCrowdsale.whitelist(whitelisted).should.eventually.equal(true);
      });

      it('disallows purchase of tokens', async function () {
        await this.publicCrowdsale.buyTokens(
          whitelisted,
          {
            from: whitelisted,
            value: utils.ether(1)
          }
        ).should.be.rejectedWith('revert');
      });
    });

    describe('During Crowdsale', function() {
      before(async function () {
        await utils.increaseTimeTo(openingTime + 1);
      });

      it('disallows purchase of tokens to nonwhitelisted accounts', async function () {
        await this.publicCrowdsale.buyTokens(
          not_whitelisted,
          {
            from: not_whitelisted,
            value: utils.ether(0.000145055),
          }
        ).should.be.rejectedWith('revert');
      })

      it('allows purchase of tokens to whitelisted accounts', async function () {
        await this.publicCrowdsale.buyTokens(
          whitelisted,
          {
            from: whitelisted,
            value: utils.ether(0.000145054),
          }
        );
        await this.token.balanceOf(whitelisted)
        .should.eventually.bignumber.equal(1.000002276 * (10 ** 18));
      });
    });
  });
});
