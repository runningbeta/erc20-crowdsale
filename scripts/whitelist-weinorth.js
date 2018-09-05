const minimist = require('minimist');
const axios = require('axios');
const { utils } = require('web3');
const setGroupCap = require('./setGroupCap');

const TokenDistributor = artifacts.require('TokenDistributor');

const cloudfunctions = projectId => `https://us-central1-${projectId}.cloudfunctions.net`;
const reports = env => `${cloudfunctions(env)}/reports`;

/**
 * Run this script by passing additional arguments
 * truffle exec ./scripts/whitelist-weinorth.js --distributor 0xbd2e0bd... --env weinorth-dev --appId m34...
 * @param callback required callback
 */
module.exports = async function (callback) {
  try {
    console.log('Whitelist script');
    console.log('-----------------');

    const args = minimist(process.argv.slice(2), { string: 'distributor' });
    const distAddress = args.distributor; // address of the distributor contract
    console.log(`Using distributor: ${distAddress}`);
    console.log(`Reading whitelist data from: ${args.env}`);

    const distributor = await TokenDistributor.at(distAddress);

    const response = await axios.get(`${reports(args.env)}/applicants/whitelist?appId=${args.appId}`);
    if (response.status !== 200) {
      throw new Error('Error while fetching whitelisted accounts.');
    }

    const whitelist = response.data;
    if (distributor) {
      console.log(`Whitelist accounts... [${whitelist.length}]\n`);

      const addresses = [];
      for (let j = 0; j < whitelist.length; j++) {
        if (whitelist[j].approved) addresses.push(whitelist[j].account);
      }

      const cap = utils.toWei('10', 'ether');
      await setGroupCap(distributor, addresses, cap);
    }

    callback();
  } catch (e) {
    callback(e);
  }
};
