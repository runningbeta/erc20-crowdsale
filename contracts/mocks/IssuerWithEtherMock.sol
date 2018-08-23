pragma solidity ^0.4.24;

import "../payment/IssuerWithEther.sol";

/**
 * @title TokenTimelockEscrowMock
 */
contract TokenTimelockEscrowMock is IssuerWithEther {

  // timestamp when token release is enabled
  uint256 public releaseTime;

  constructor(address _owner, address _allower, ERC20 _token)
    public
    Issuer(_owner, _allower, _token)
  {
  }
}
