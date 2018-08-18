const BigNumber = web3.BigNumber;

const assertRevert = async promise => {
  try {
    await promise;
    assert.fail('Expected revert not received');
  } catch (error) {
    assert.include(e.message, 'revert', `Expected "revert", got ${e} instead`);
  }
};

const toEther = function (n) {
  return web3.fromWei(n, 'ether');
}

const ether = function (n) {
  return new BigNumber(web3.toWei(n, 'ether'));
};

const assertThrows = function(promise, err) {
  return promise.then(function() {
    assert.isNotOk(true, err);
  }).catch(function(e) {
    assert.include(e.message, 'invalid opcode', "Invalid opcode error didn't occur");
  });
};

const duration = {
  seconds: function (val) { return val; },
  minutes: function (val) { return val * this.seconds(60); },
  hours: function (val) { return val * this.minutes(60); },
  days: function (val) { return val * this.hours(24); },
  weeks: function (val) { return val * this.days(7); },
  years: function (val) { return val * this.days(365); },
};

const latestTime = async function() {
  const block = await web3.eth.getBlock('latest')
  return block.timestamp;
};

const increaseTime = function(bySeconds) {
  web3.currentProvider.send({
    jsonrpc: "2.0",
    method: "evm_increaseTime",
    params: [bySeconds],
    id: new Date().getTime(),
  });
};

const increaseTimeTo = async function(target) {
  const now = (await latestTime());

  if (target < now) throw Error(`Cannot increase current time(${now}) to a moment in the past(${target})`);
  const diff = target - now;
  return increaseTime(diff);
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
  ether,
  toEther,
  assertThrows,
  duration,
  latestTime,
  increaseTime,
  increaseTimeTo,
  mineOneBlock,
  mineToBlock,
};