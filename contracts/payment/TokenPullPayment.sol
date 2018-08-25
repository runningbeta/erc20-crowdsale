pragma solidity ^0.4.24;

import "./TokenEscrow.sol";


/**
 * @title TokenPullPayment
 * @dev Base contract supporting async send or ERC20 tokens for pull payments.
 * Inherit from this contract and use asyncTransfer instead of send or transfer.
 */
contract TokenPullPayment {
  TokenEscrow private escrow;

  constructor(ERC20 _token) public {
    escrow = new TokenEscrow(_token);
  }

  /// @dev Withdraw accumulated balance, called by payee.
  function withdrawPayments() public {
    address payee = msg.sender;
    escrow.withdraw(payee);
  }

  /**
   * @dev Returns the credit owed to an address.
   * @param _dest The creditor's address.
   */
  function payments(address _dest) public view returns (uint256) {
    return escrow.depositsOf(_dest);
  }

  /**
   * @dev Called by the payer to store the sent amount as credit to be pulled.
   * @param _dest The destination address of the funds.
   * @param _amount The amount to transfer.
   */
  function asyncTransfer(address _dest, uint256 _amount) internal {
    assert(escrow.token().balanceOf(this) >= _amount);
    escrow.token().approve(escrow, _amount);
    escrow.deposit(_dest, _amount);
  }
}
