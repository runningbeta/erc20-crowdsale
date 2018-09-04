const fs = require('fs');
const csv = require('csvtojson');
const minimist = require('minimist');
const setGroupCap = require('./setGroupCap');
const { utils } = require('web3');

const TokenDistributor = artifacts.require('TokenDistributor');

/**
 * Run this script by passing additional arguments
 * truffle exec ./scripts/whitelist.js --distributor 0xbd2e0bd56dea31e24082bf88fd0ad88ff27ef95c --data ./scripts/presale-sample.csv
 * @param callback required callback
 */
module.exports = async function (callback) {
  try {
    console.log(web3.eth.accounts);
    const args = minimist(process.argv.slice(2), { string: 'distributor' });
    const distAddress = args.distributor; // address of the distributor contract
    const fileName = args.data; // path to the CSV file
    console.log(`Using distributor: ${distAddress}`);
    console.log(`Reading presale data from: ${fileName}`);

    const csvFs = await fs.createReadStream(fileName);
    const presale = await csv({ eol: '\n' }).fromStream(csvFs);

    console.log('Whitelist script');
    console.log('-----------------');

    const distributor = await TokenDistributor.at(distAddress);

    if (distributor) {
      console.log(`Whitelist accounts... [${presale.length}]\n`);

      const cap = utils.toWei('10', 'ether');
      const addresses = [];
      for (let j = 0; j < presale.length; j++) {
        addresses.push(presale[j].address);
      }

      const [owner] = web3.eth.accounts;
      await setGroupCap(distributor, owner, addresses, cap);
    }
  } catch (e) {
    console.error(e);
  }
};
