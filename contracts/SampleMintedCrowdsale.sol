pragma solidity ^0.4.24;

import "openzeppelin-solidity/contracts/ownership/HasNoTokens.sol";
import "openzeppelin-solidity/contracts/ownership/HasNoContracts.sol";
import "openzeppelin-solidity/contracts/crowdsale/validation/IndividuallyCappedCrowdsale.sol";
import "openzeppelin-solidity/contracts/crowdsale/validation/CappedCrowdsale.sol";
import "openzeppelin-solidity/contracts/crowdsale/validation/TimedCrowdsale.sol";
import "openzeppelin-solidity/contracts/crowdsale/emission/MintedCrowdsale.sol";


/**
 * @title SampleMintedCrowdsale
 * @dev This is a sample crowdsale.
 */
// solium-disable-next-line
contract SampleMintedCrowdsale
  is
    HasNoTokens,
    HasNoContracts,
    MintedCrowdsale,
    CappedCrowdsale,
    TimedCrowdsale,
    IndividuallyCappedCrowdsale
{

  event WalletChange(address wallet);

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

  /**
   * @dev Wallet can be changed by the owner during the crowdsale
   * @param _wallet address of the new wallet
   */
  function setWallet(address _wallet) public onlyOwner {
    require(_wallet != address(0), "Wallet address should not be 0x0.");
    wallet = _wallet;
    emit WalletChange(_wallet);
  }

}
