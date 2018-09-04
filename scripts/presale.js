const fs = require('fs');
const csv = require('csvtojson');

const TokenDistributor = artifacts.require('TokenDistributor');

/**
 * Run this script by passing additional arguments
 * truffle exec .\scripts\presale.js 0xbd2e0bd56dea31e24082bf88fd0ad88ff27ef95c .\scripts\presale-sample.csv
 * @param callback required callback
 */
module.exports = async function (callback) {
  const distAddress = process.argv[4]; // address of the distributor contract
  const fileName = process.argv[5]; // path to the CSV file

  try {
    const [owner] = web3.eth.accounts;
    const BigNumber = web3.BigNumber;

    const csvFs = await fs.createReadStream(fileName);
    const presale = await csv({ eol: '\n' }).fromStream(csvFs);

    console.log('Presale script');
    console.log('-----------------');

    const distributor = await TokenDistributor.at(distAddress);

    if (distributor) {

      console.log(`Issue presale tokens... [${presale.length}]\n`);

      for (let j = 0; j < presale.length; j++) {
        const sale = presale[j];
        const ethValue = new BigNumber(sale.wei).div(10 ** 18);
        const tolValue = new BigNumber(sale.tokens).div(10 ** 18);
        const bonus = new BigNumber(sale.bonus).div(10 ** 18);

        console.log(`Presale #${j} | ${sale.address}`);
        console.log(`  ${ethValue.toString(10)} ETH | ${tolValue.toString(10)} TOL | Bonus: ${bonus
          .toString(10)} TOL\n`);

        const estimatedGas = await distributor.contract.depositPresale['address,uint256,uint256']
          .estimateGas(sale.address, sale.tokens, sale.wei, { from: owner });
        // this transactions seems to need 50% more gas than estimated
        await distributor.contract.depositPresale['address,uint256,uint256'](
          sale.address, sale.tokens, sale.wei,
          { from: owner, gas: Math.floor(estimatedGas * 1.5) }
        );
        await distributor.depositBonus(sale.address, sale.bonus, { from: owner });
      }
    }
  } catch (e) {
    console.log(e);
  }
};
