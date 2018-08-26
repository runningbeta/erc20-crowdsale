pragma solidity ^0.4.24;

import "./TokenConditionalEscrow.sol";


/**
 * @title TokenTimelockIndividualEscrow
 * @dev Escrow to only allow withdrawal only if the lock period
 * has expired. As only the owner can make deposits and withdrawals
 * this contract should be owned by the crowdsale, which can then
 * perform deposits and withdrawals for individual users.
 */
contract TokenTimelockIndividualEscrow is TokenConditionalEscrow {

  event Locked(address indexed payee, uint256 _releaseTime);

  // release times of the beneficiaries of tokens
  mapping(address => uint256) private releaseTimes;

  /**
   * @dev Stores the token amount as credit to be withdrawn.
   * @param _payee The destination address of the tokens.
   * @param _amount The amount of tokens that can be pulled.
   * @param _releaseTime The release times after which the tokens can be withdrawn.
   */
  function depositAndLock(address _payee, uint256 _amount, uint256 _releaseTime) public onlyOwner {
    deposit(_payee, _amount);
    lock(_payee, _releaseTime);
  }

  /**
   * @dev Locks the tokens for the beneficiary until some later time in the future.
   * @param _payee The destination address of the tokens.
   * @param _releaseTime The release times after which the tokens can be withdrawn.
   */
  function lock(address _payee, uint256 _releaseTime) public onlyOwner {
    require(_payee != address(0), "The destination address of the tokens should not be 0x0.");
    // solium-disable-next-line security/no-block-members
    require(_releaseTime > block.timestamp, "Vesting period should expire in future.");
    require(releaseTimes[_payee] == 0, "The destination address is already locked.");
    require(depositsOf(_payee) > 0, "There is no need to lock zero balances.");
    releaseTimes[_payee] = _releaseTime;
    emit Locked(_payee, _releaseTime);
  }

  /**
   * @dev Returns whether an address is allowed to withdraw their tokens.
   * @param _payee The destination address of the tokens.
   */
  function withdrawalAllowed(address _payee) public view returns (bool) {
    // solium-disable-next-line security/no-block-members
    return block.timestamp >= releaseTimes[_payee];
  }

  /**
   * @dev Withdraw accumulated balance for a payee.
   * @param _payee The address whose tokens will be withdrawn and transferred to.
   */
  function withdraw(address _payee) public {
    super.withdraw(_payee);
    releaseTimes[_payee] = 0;
  }
}
