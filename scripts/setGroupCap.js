module.exports = async function (contract, addresses, cap) {
  console.log(`Using contract: ${contract.address}`);
  console.log(`Setting cap of ${cap} wei for group:`);
  console.log(addresses);

  const estimatedGas = await contract.contract.setGroupCap['address[],uint256'].estimateGas(addresses, cap);
  const resp = await contract.setGroupCap(addresses, cap, { gas: Math.floor(estimatedGas * 1.5) });

  console.log('Set group cap success!');
  console.log(resp);

  return resp;
};
