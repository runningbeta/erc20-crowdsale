pragma solidity ^0.4.24;


import "../payment/TokenPullPayment.sol";


// mock class using TokenPullPayment
contract TokenPullPaymentMock is TokenPullPayment {

  constructor(ERC20 _token) public TokenPullPayment(_token) {
    // constructor
  }

  // test helper function to call asyncTransfer
  function callTransfer(address _dest, uint256 _amount) public {
    asyncTransfer(_dest, _amount);
  }

}
