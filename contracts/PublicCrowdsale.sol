pragma solidity ^0.4.24;

import "openzeppelin-solidity/contracts/crowdsale/validation/WhitelistedCrowdsale.sol";
import "openzeppelin-solidity/contracts/crowdsale/validation/TimedCrowdsale.sol";
import "openzeppelin-solidity/contracts/crowdsale/validation/CappedCrowdsale.sol";
import "openzeppelin-solidity/contracts/crowdsale/emission/MintedCrowdsale.sol";
import "openzeppelin-solidity/contracts/crowdsale/distribution/RefundableCrowdsale.sol";


/**
 * @title Crowdsale
 * @dev Crowdsale in which only whitelisted users can contribute.
 */
contract PublicCrowdsale is WhitelistedCrowdsale, CappedCrowdsale, MintedCrowdsale, RefundableCrowdsale {

  /**
   * @dev Constructor, takes crowdsale opening and closing times,
   *   maximum amount of wei accepted in the crowdsale.
   * @param _openingTime Crowdsale opening time
   * @param _closingTime Crowdsale closing time
   * @param _cap Max amount of wei to be contributed
   * @param _goal Funding goal
   */
  constructor(uint256 _openingTime, uint256 _closingTime, uint256 _cap, uint256 _goal)
    TimedCrowdsale(_openingTime, _closingTime)
    CappedCrowdsale(_cap)
    RefundableCrowdsale(_goal)
    public
    {}

}
