pragma solidity ^0.4.24;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";


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
  using SafeMath for uint256;

  // Map addresses whose tokens we have already issued
  mapping(address => bool) public issued;

  // Centrally issued token we are distributing to our contributors
  ERC20 public token;

  /// Party (team multisig) who is in the control of the token pool.
  /// @notice this will be different from the owner address (scripted) that calls this contract.
  address public allower;

  // How many addresses have received their tokens.
  uint256 public issuedCount;

  constructor(address _owner, address _allower, ERC20 _token) public {
    require(address(_owner) != address(0), "Owner address should not be 0x0");
    require(address(_allower) != address(0), "Allower address should not be 0x0");
    require(address(_token) != address(0), "Token address should not be 0x0");
    owner = _owner;
    allower = _allower;
    token = _token;
  }

  function issue(address _benefactor, uint256 _amount) public onlyOwner {
    require(!issued[_benefactor], "Benefactor already issued");
    token.transferFrom(allower, _benefactor, _amount);
    issued[_benefactor] = true;
    issuedCount = issuedCount.add(_amount);
  }

}
