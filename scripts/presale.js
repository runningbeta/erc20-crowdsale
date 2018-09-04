const fs = require('fs');
const csv = require('csvtojson');
const minimist = require('minimist');
const promisify = require('./promisify');
const { utils } = require('web3');

const TokenDistributor = artifacts.require('TokenDistributor');

/**
 * Run this script by passing additional arguments
 * truffle exec ./scripts/presale.js --distributor 0xbd2e0bd... --data ./scripts/presale-sample.csv
 * @param callback required callback
 */
module.exports = async function (callback) {
  try {
    console.log('Presale script');
    console.log('--------------');

    const args = minimist(process.argv.slice(2), { string: 'distributor' });
    const distAddress = args.distributor; // address of the distributor contract
    const fileName = args.data; // path to the CSV file
    console.log(`Using distributor contract: ${distAddress}`);
    console.log(`Reading presale data from: ${fileName}`);

    const csvFs = await fs.createReadStream(fileName);
    const presale = await csv({ eol: '\n' }).fromStream(csvFs);

    const distributor = await TokenDistributor.at(distAddress);

    if (distributor) {
      console.log(`Issue presale tokens... [${presale.length}]\n`);

      for (let j = 0; j < presale.length; j++) {
        const sale = presale[j];

        // TODO: not working!
        // const estimatedGas = await promisify(cb => distributor.contract.depositPresale['address,uint256,uint256']
        //   .estimateGas(sale.address, sale.tokens, sale.wei, cb));

        // this transactions seems to need 50% more gas than estimated
        // const options = { gas: Math.floor(estimatedGas * 1.5) };
        const options = {};
        await distributor.contract.depositPresale['address,uint256,uint256'](sale.address, sale.tokens, sale.wei, options);
        await distributor.depositBonus(sale.address, sale.bonus);

        // Log Presale invesment
        console.log(`Presale #${j} | ${sale.address}`);
        const totalETH = `${utils.fromWei(sale.wei)} ETH`;
        const totalTOL = `${utils.fromWei(sale.tokens)} TOL`;
        const totalBonus = `${utils.fromWei(sale.bonus)} TOL`;
        console.log(`  - Invested: ${totalETH} | Bought: ${totalTOL} | Bonus: ${totalBonus}\n`);
      }
    }
    callback();
  } catch (e) {
    callback(e);
  }
};
