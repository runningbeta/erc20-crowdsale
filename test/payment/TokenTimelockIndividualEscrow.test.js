const BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-bignumber')(BigNumber))
  .use(require('chai-as-promised'))
  .should();

const Token = artifacts.require('FixedSupplyBurnableToken');
const TokenTimelockIndividualEscrow = artifacts.require('TokenTimelockIndividualEscrowMock');

const { shouldBehaveLikeTokenEscrow } = require('./TokenEscrow.behaviour');
const { shouldBehaveLikeTokenTimelockIndividualEscrow } = require('./TokenTimelockIndividualEscrow.behaviour');

contract('TokenTimelockIndividualEscrow', function ([owner, ...other]) {
  beforeEach(async function () {
    this.token = await Token.new({ from: owner });
    this.escrow = await TokenTimelockIndividualEscrow.new(this.token.address, { from: owner });
  });

  shouldBehaveLikeTokenEscrow(owner, other);
  shouldBehaveLikeTokenTimelockIndividualEscrow(owner, other);
});
