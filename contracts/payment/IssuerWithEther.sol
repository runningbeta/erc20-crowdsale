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
  event IssueWithEther(address beneficiary, uint256 amount, uint256 weiAmount);

  /**
  * @dev Issue the tokens to the beneficiary
  * @param _beneficiary The destination address of the tokens.
  * @param _amount The amount of tokens that are issued.
  * @param _weiAmount The amount of wei exchanged for the tokens.
  */
  function issue(address _beneficiary, uint256 _amount, uint256 _weiAmount) public onlyOwner {
    super.issue(_beneficiary, _amount);
    weiRaised = weiRaised.add(_weiAmount);
    emit IssueWithEther(_beneficiary, _amount, _weiAmount);
  }

}
