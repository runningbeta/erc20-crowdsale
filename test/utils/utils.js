const assertRevert = async promise => {
  try {
    await promise;
    assert.fail('Expected revert not received');
  } catch (error) {
    assert.include(e.message, 'revert', `Expected "revert", got ${e} instead`);
  }
};

const assertThrows = function(promise, err) {
  return promise.then(function() {
    assert.isNotOk(true, err);
  }).catch(function(e) {
    assert.include(e.message, 'invalid opcode', "Invalid opcode error didn't occur");
  });
};

const mineOneBlock = function() {
  web3.currentProvider.send({
    jsonrpc: "2.0",
    method: "evm_mine",
    id: new Date().getTime(),
  });
};

const mineToBlock = function(targetBlock) {
  while (web3.eth.blockNumber < targetBlock) {
    this.mineOneBlock();
  }
};

module.exports = {
  assertRevert,
  assertThrows,
  mineOneBlock,
  mineToBlock,
};
