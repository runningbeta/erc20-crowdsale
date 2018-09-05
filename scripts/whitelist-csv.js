const minimist = require('minimist');
const fs = require('fs');
const csv = require('csvtojson');
const { utils } = require('web3');
const setGroupCap = require('./setGroupCap');

const TokenDistributor = artifacts.require('TokenDistributor');

/**
 * Run this script by passing additional arguments
 * truffle exec ./scripts/whitelist-csv.js --distributor ... --data ./scripts/presale-sample.csv --column ...
 * @param callback required callback
 */
module.exports = async function (callback) {
  try {
    console.log('Whitelist script');
    console.log('-----------------');

    const args = minimist(process.argv.slice(2), { string: 'distributor' });
    const distAddress = args.distributor; // address of the distributor contract
    const fileName = args.data; // path to the CSV file
    const columnName = args.column || 'address'; // column name
    console.log(`Using distributor: ${distAddress}`);
    console.log(`Reading presale data from: ${fileName}`);

    const csvFs = await fs.createReadStream(fileName);
    const presale = await csv({ eol: '\n' }).fromStream(csvFs);

    const distributor = await TokenDistributor.at(distAddress);

    if (distributor) {
      console.log(`Whitelist accounts... [${presale.length}]\n`);

      const addresses = [];
      for (let j = 0; j < presale.length; j++) {
        addresses.push(presale[j][columnName]);
      }

      const cap = utils.toWei('10', 'ether');
      await setGroupCap(distributor, addresses, cap);
    }

    callback();
  } catch (e) {
    callback(e);
  }
};
