pragma solidity ^0.4.24;

import "openzeppelin-solidity/contracts/crowdsale/validation/IndividuallyCappedCrowdsale.sol";
import "openzeppelin-solidity/contracts/crowdsale/validation/CappedCrowdsale.sol";
import "openzeppelin-solidity/contracts/crowdsale/validation/TimedCrowdsale.sol";
import "openzeppelin-solidity/contracts/crowdsale/emission/MintedCrowdsale.sol";


/**
 * @title PublicCrowdsale
 * @dev This is a crowdsale.
 */
contract PublicCrowdsale is IndividuallyCappedCrowdsale, CappedCrowdsale, TimedCrowdsale, MintedCrowdsale {

  constructor(
    uint256 _rate,
    address _wallet,
    MintableToken _token,
    uint256 _cap,
    uint256 _openingTime,
    uint256 _closingTime
  )
    public
    Crowdsale(_rate, _wallet, _token)
    CappedCrowdsale(_cap)
    TimedCrowdsale(_openingTime, _closingTime)
  {
    // constructor
  }

}
