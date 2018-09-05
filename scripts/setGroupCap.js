const { utils } = require('web3');

module.exports = async function (contract, addresses, cap) {
  console.log(`Using contract: ${contract.address}`);
  console.log(`Setting cap of ${cap} wei or ${utils.fromWei(cap)} ETH for group:`);
  console.log(addresses);

  const resp = await contract.setGroupCap(addresses, cap);

  console.log('Set group cap success!');
  console.log(resp);

  return resp;
};
