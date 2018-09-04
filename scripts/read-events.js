const minimist = require('minimist');

/**
 * Script that can be used to read all events from a contract
 *
 * Run this script by passing additional arguments:
 *   truffle exec ./scripts/read-events.js --contract 0xbd2e0bd... --name
 * @param callback required callback
 */
module.exports = async function (callback) {
  try {
    console.log('Read Events script');
    console.log('----------------------------');

    const args = minimist(process.argv.slice(2), { string: 'contract' });
    console.log(`Using contract: ${args.contract}`);

    const Contract = artifacts.require(args.name);
    const contract = await Contract.at(args.contract);

    const events = contract.allEvents({
      fromBlock: 0,
      toBlock: 'latest',
    });

    events.get(function (error, events) {
      if (error) {
        console.error('Read error!');
        console.error(error);
        return;
      }

      console.log(events);
    });
  } catch (e) {
    console.error('Read error!');
    console.error(e);
  }
};
