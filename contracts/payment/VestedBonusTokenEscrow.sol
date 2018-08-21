pragma solidity ^0.4.23;

import "./TokenConditionalEscrow.sol";


/**
 * @title ConditionalEscrow
 * @dev Escrow to only allow withdrawal only if the vesting period
 * has expired. As only the owner can make deposits and withdrawals
 * this contract should be owned by the crowdsale, which can then
 * perform deposits and withdrawals for individual users.
 */
contract VestedBonusTokenEscrow is TokenConditionalEscrow {

  // timestamp when token release is enabled
  uint256 public releaseTime;

  constructor(ERC20Basic _token, uint256 _releaseTime) public TokenConditionalEscrow(_token) {
    require(_releaseTime > block.timestamp);
    releaseTime = _releaseTime;
  }

  /**
  * @dev Returns whether an address is allowed to withdraw their tokens.
  * @param _payee The destination address of the tokens.
  */
  function withdrawalAllowed(address _payee) public view returns (bool) {
    // solium-disable-next-line security/no-block-members
    require(block.timestamp >= releaseTime, "Vesting period not finished.");
    return true;
  }
}
