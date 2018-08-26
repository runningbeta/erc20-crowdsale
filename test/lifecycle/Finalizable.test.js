const { expectThrow } = require('../helpers/expectThrow');
const { EVMRevert } = require('../helpers/EVMRevert');

const should = require('chai').should();

const Finalizable = artifacts.require('Finalizable');

contract('Finalizable', function ([_, owner, ...other]) {
  beforeEach(async function () {
    this.contract = await Finalizable.new({ from: owner });
  });

  it('can be finalized', async function () {
    await this.contract.finalize({ from: owner });
    (await this.contract.isFinalized()).should.be.equal(true);
  });

  it('cannot be finalized twice', async function () {
    await this.contract.finalize({ from: owner });
    await expectThrow(() => this.contract.finalize({ from: owner }), EVMRevert);
  });

  it('logs finalized', async function () {
    const { logs } = await this.contract.finalize({ from: owner });
    const event = logs.find(e => e.event === 'Finalized');
    should.exist(event);
  });
});
