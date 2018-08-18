let utils = require("./utils/utils.js");

const BigNumber = web3.BigNumber;
const Token = artifacts.require('Token');

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

const INITTIAL_SUPPLY = 0;
const TOTAL_SUPPLY = 1000000000;

contract('Token', function (accounts) {
  let prefix = 'Before Crowdsale -- ';

  beforeEach(async function () {
    this.token = await Token.new({ from: accounts[0] });
  });

  it(prefix + 'total suply is 0', async function () {
    const totalSupply = await this.token.totalSupply();
    totalSupply.should.be.bignumber.equal(INITTIAL_SUPPLY);
  })

})
