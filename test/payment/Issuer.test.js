const { EVMRevert } = require('../helpers/EVMRevert');
const { shouldBehaveLikeIssuer } = require('./Issuer.behaviour');

const Token = artifacts.require('FixedSupplyBurnableToken');
const Issuer = artifacts.require('Issuer');

contract('Issuer', function ([_, benefactor, owner, alice, ...other]) {
  beforeEach(async function () {
    this.token = await Token.new({ from: benefactor });
    this.issuer = await Issuer.new(benefactor, this.token.address, { from: owner });
  });

  it('fails if benefactor is zero address', async function () {
    await (Issuer.new(0x0, this.token.address, { from: owner }))
      .should.be.rejectedWith(EVMRevert);
  });

  it('fails if token is zero address', async function () {
    await (Issuer.new(benefactor, 0x0, { from: owner }))
      .should.be.rejectedWith(EVMRevert);
  });

  shouldBehaveLikeIssuer(benefactor, owner, alice, other);
});
