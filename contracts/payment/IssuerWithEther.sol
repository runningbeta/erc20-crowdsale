pragma solidity ^0.4.24;

import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "./Issuer.sol";


/**
 * Issuer manages token distribution.
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
contract IssuerWithEther is Issuer {

  // Amount of wei raised
  uint256 public weiRaised;

  // Issue event
  event IssueWithEther(address benefactor, uint256 amount, uint256 weiAmount);

  constructor(address _owner, address _allower, ERC20 _token) public Issuer(_owner, _allower, _token) {
    // constructor
  }

  function issue(address _benefactor, uint256 _amount, uint256 _weiAmount) public onlyOwner {
    super.issue(_benefactor, _amount);
    weiRaised = weiRaised.add(_weiAmount);
    emit IssueWithEther(_benefactor, _amount, _weiAmount);
  }

}
