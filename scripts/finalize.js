const minimist = require('minimist');
const inquirer = require('inquirer');

const Finalizable = artifacts.require('Finalizable');

/**
 * Script that can be used to finalize Finalizable contracts
 *
 * Run this script by passing additional arguments:
 *   truffle exec ./scripts/finalize.js --contract 0xbd2e0bd...
 * @param callback required callback
 */
module.exports = async function (callback) {
  try {
    console.log('Finalization script');
    console.log('-------------------');

    const args = minimist(process.argv.slice(2), { string: 'contract' });
    const address = args.contract;
    console.log(`Using contract: ${address}`);

    const contract = await Finalizable.at(address);
    const isFinalized = await contract.isFinalized();
    if (isFinalized) {
      console.error('Finalization error!');
      console.error('Contract already finalized. Exiting...');
      return;
    }

    const message = `Please confirm that you want to finalize ${address} contract. This action is irrevocable!`;
    const answers = await inquirer.prompt([{ type: 'confirm', name: 'confirmed', message }]);

    if (answers.confirmed) {
      console.log('Finalizing contract...');
      const { logs } = await contract.finalize();
      console.log('Finalization success!');
      console.log('Logs emmited:');
      console.log(logs);
    }

    callback();
  } catch (e) {
    console.error('Finalization error!');
    callback(e);
  }
};