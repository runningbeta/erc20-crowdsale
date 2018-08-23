pragma solidity ^0.4.24;

import "../payment/TokenTimelockIndividualEscrow.sol";


/**
 * @title TokenTimelockIndividualEscrowMock
 */
contract TokenTimelockIndividualEscrowMock is TokenTimelockIndividualEscrow {

  // timestamp when token release is enabled
  uint256 public releaseTime;

  constructor(ERC20 _token) public TokenEscrow(_token) {
    // constructor
  }
}
