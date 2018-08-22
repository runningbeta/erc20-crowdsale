pragma solidity ^0.4.24;

import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";
import "zeppelin/contracts/ownership/Ownable.sol";

/**
 * Issuer manages token distribution after the crowdsale.
 *
 * This contract is fed a CSV file with Ethereum addresses and their
 * issued token balances.
 *
 * Issuer act as a gate keeper to ensure there is no double issuance
 * per address, in the case we need to do several issuance batches,
 * there is a race condition or there is a fat finger error.
 *
 * Issuer contract gets allowance from the team multisig to distribute tokens.
 *
 */
contract Issuer is Ownable {

  /** Map addresses whose tokens we have already issued. */
  mapping(address => bool) public issued;

  /** Centrally issued token we are distributing to our contributors */
  ERC20 public token;

  /** Party (team multisig) who is in the control of the token pool. Note that this will be different from the owner address (scripted) that calls this contract. */
  address public allower;

  /** How many addresses have received their tokens. */
  uint256 public issuedCount;

  constructor(address _owner, address _allower, ERC20 _token) {
    owner = _owner;
    allower = _allower;
    token = _token;
  }

  function issue(address benefactor, uint256 amount) public onlyOwner {
    require(!issued[benefactor], "Benefactor already issued");
    token.transferFrom(allower, benefactor, amount);
    issued[benefactor] = true;
    issuedCount += amount;
  }

}
