pragma solidity ^0.4.24;

import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";
import "openzeppelin-solidity/contracts/ownership/HasNoTokens.sol";
import "openzeppelin-solidity/contracts/ownership/HasNoContracts.sol";
import "openzeppelin-solidity/contracts/crowdsale/validation/IndividuallyCappedCrowdsale.sol";
import "openzeppelin-solidity/contracts/crowdsale/validation/CappedCrowdsale.sol";
import "openzeppelin-solidity/contracts/crowdsale/validation/TimedCrowdsale.sol";
import "openzeppelin-solidity/contracts/crowdsale/emission/AllowanceCrowdsale.sol";
import "openzeppelin-solidity/contracts/crowdsale/distribution/PostDeliveryCrowdsale.sol";


/**
 * @title SampleAllowanceCrowdsale
 * @dev This is a ERC20 token crowdsale that will sell tokens util
 * the cap is reached, time expired or the allowance is spent.
 */
// solium-disable-next-line
contract SampleAllowanceCrowdsale
  is
    HasNoTokens,
    HasNoContracts,
    AllowanceCrowdsale,
    CappedCrowdsale,
    TimedCrowdsale,
    IndividuallyCappedCrowdsale,
    PostDeliveryCrowdsale
{

  event WalletChange(address wallet);

  // When withdrawals open
  uint256 public withdrawTime;

  // Amount of tokens sold
  uint256 public tokensSold;

  constructor(
    uint256 _rate,
    address _wallet,
    ERC20 _token,
    address _tokenWallet,
    uint256 _cap,
    uint256 _openingTime,
    uint256 _closingTime,
    uint256 _withdrawTime
  )
    public
    Crowdsale(_rate, _wallet, _token)
    AllowanceCrowdsale(_tokenWallet)
    CappedCrowdsale(_cap)
    TimedCrowdsale(_openingTime, _closingTime)
  {
    require(_withdrawTime >= _closingTime, "Withdrawals should open after crowdsale closes.");
    withdrawTime = _withdrawTime;
  }

  /**
   * @dev Checks whether the period in which the crowdsale is open
   * has already elapsed or cap was reached.
   * @return Whether crowdsale has ended
   */
  function hasEnded() public view returns (bool) {
    return hasClosed() || capReached();
  }

  /**
   * @dev Withdraw tokens only after configured withdraw time.
   */
  function withdrawTokens() public {
    // solium-disable-next-line security/no-block-members
    require(block.timestamp > withdrawTime, "Withdrawals not open.");
    super.withdrawTokens();
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

  /**
   * @dev We use this function to store the total amount sold
   * @param _beneficiary Token purchaser
   * @param _tokenAmount Amount of tokens purchased
   */
  function _processPurchase(
    address _beneficiary,
    uint256 _tokenAmount
  )
    internal
  {
    super._processPurchase(_beneficiary, _tokenAmount);
    tokensSold = tokensSold.add(_tokenAmount);
  }

}
