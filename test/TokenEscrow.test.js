const { shouldBehaveLikeTokenEscrow } = require('./TokenEscrow.behavior');

const Token = artifacts.require('Token');
const TokenEscrow = artifacts.require('TokenEscrow');

contract('TokenEscrow', function ([_, owner, ...otherAccounts]) {
  beforeEach(async function () {
    this.token = await Token.new({ from: owner });
    this.escrow = await TokenEscrow.new(this.token.address, { from: owner });
  });

  shouldBehaveLikeTokenEscrow(owner, otherAccounts);
});