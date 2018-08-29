pragma solidity ^0.4.24;

import "../lifecycle/Finalizable.sol";

// mock class using TokenPullPayment
contract FinalizableMock is Finalizable {

  function finalized() public onlyFinalized {
  }

  function notFinalized() public onlyNotFinalized {
  }

}
