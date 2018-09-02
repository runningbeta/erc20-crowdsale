pragma solidity ^0.4.24;

import "../payment/IssuerWithEther.sol";


/// @title IssuerWithEtherMock
contract IssuerWithEtherMock is IssuerWithEther {

  constructor(address _issuer, ERC20 _token) public Issuer(_issuer, _token) {
    // constructor
  }
}
