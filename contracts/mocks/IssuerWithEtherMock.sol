pragma solidity ^0.4.24;

import "../payment/IssuerWithEther.sol";


/**
 * @title IssuerWithEtherMock
 */
contract IssuerWithEtherMock is IssuerWithEther {

  // timestamp when token release is enabled
  uint256 public releaseTime;

  constructor(address _issuer, ERC20 _token)
    public
    Issuer(_issuer, _token)
  {
  }
}
