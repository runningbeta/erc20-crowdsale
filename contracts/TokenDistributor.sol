pragma solidity ^0.4.24;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "./lifecycle/Finalizable.sol";
import "./payment/IssuerWithEther.sol";
import "./payment/TokenTimelockIndividualEscrow.sol";
import "./mocks/TokenTimelockIndividualEscrowMock.sol";
import "./SimpleAllowanceCrowdsale.sol";


/**
 * @title TokenDistributor
 * @dev This is a token distribution contract.
 */
contract TokenDistributor is Finalizable, IssuerWithEther {
  using SafeMath for uint256;
  using SafeERC20 for ERC20;

  event CrowdsaleInstantiated(address sender, address instantiation, uint256 allowance);

  // The token being sold
  ERC20 public token;

  // Address where funds are collected
  address public wallet;

  // How many token units a buyer gets per wei.
  // The rate is the conversion between wei and the smallest and indivisible token unit.
  // So, if you are using a rate of 1 with a DetailedERC20 token with 3 decimals called TOK
  // 1 wei will give you 1 unit, or 0.001 TOK.
  uint256 public rate;

  uint256 public cap;

  uint256 public openingTime;
  uint256 public closingTime;

  // Escrow contract used to lock team and bonus tokens
  TokenTimelockIndividualEscrow public escrow;

  // Crowdsale that is created after the presale distribution is finalized
  SimpleAllowanceCrowdsale public crowdsale;

  constructor(
    address _benefactor,
    uint256 _rate,
    address _wallet,
    ERC20 _token,
    uint256 _cap,
    uint256 _openingTime,
    uint256 _closingTime
  )
    public
    Issuer(_benefactor, _token)
  {
    rate = _rate;
    wallet = _wallet;
    token = _token;
    cap = _cap;
    openingTime = _openingTime;
    closingTime = _closingTime;
    escrow = new TokenTimelockIndividualEscrowMock(_token);
  }

  /**
   * @dev Sets a specific user's maximum contribution.
   * @param _beneficiary Address to be capped
   * @param _cap Wei limit for individual contribution
   */
  function setUserCap(address _beneficiary, uint256 _cap) external onlyOwner onlyFinalized {
    crowdsale.setUserCap(_beneficiary, _cap);
  }

  /**
   * @dev Sets a group of users' maximum contribution.
   * @param _beneficiaries List of addresses to be capped
   * @param _cap Wei limit for individual contribution
   */
  function setGroupCap(address[] _beneficiaries, uint256 _cap) external onlyOwner onlyFinalized {
    crowdsale.setGroupCap(_beneficiaries, _cap);
  }

  /**
   * @dev Issue the tokens to the beneficiary
   * @param _beneficiary The destination address of the tokens.
   * @param _amount The amount of tokens that are issued.
   */
  function issue(address _beneficiary, uint256 _amount) public onlyNotFinalized {
    super.issue(_beneficiary, _amount);
  }

  /**
   * @dev Issue the tokens to the beneficiary
   * @param _beneficiary The destination address of the tokens.
   * @param _amount The amount of tokens that are issued.
   * @param _weiAmount The amount of wei exchanged for the tokens.
   */
  function issue(address _beneficiary, uint256 _amount, uint256 _weiAmount) public onlyNotFinalized {
    require(cap > weiRaised.add(_weiAmount), "Cap reached");
    super.issue(_beneficiary, _amount, _weiAmount);
  }

  /**
   * @dev Called by the payer to store the sent amount as credit to be pulled.
   * @param _dest The destination address of the funds.
   * @param _amount The amount to transfer.
   * @param _releaseTime The release times after which the tokens can be withdrawn.
   */
  function depositAndLock(address _dest, uint256 _amount, uint256 _releaseTime) public onlyOwner onlyNotFinalized {
    assert(token.allowance(benefactor, this) >= _amount);
    token.transferFrom(benefactor, this, _amount);
    token.approve(escrow, _amount);
    escrow.depositAndLock(_dest, _amount, _releaseTime);
  }

  /// @dev Withdraw accumulated balance, called by payee.
  function withdrawPayments() public {
    address payee = msg.sender;
    escrow.withdraw(payee);
  }

  // In case there are any unsold tokens, they are returned to the benefactor
  function claimUnsold() public onlyFinalized {
    require(crowdsale.hasEnded(), "Crowdsale still running");
    uint256 unsold = token.balanceOf(this);

    if (unsold > 0) {
      token.safeTransfer(benefactor, unsold);
    }
  }

  /**
   * @dev Finalization logic that will create a Crowdsale with provided parameters
   * and calculated cap depending on the amount raised in presale.
   */
  function finalization() internal {
    super.finalization();
    address tokenWallet = this;
    crowdsale = new SimpleAllowanceCrowdsale(
      rate,
      wallet,
      token,
      tokenWallet,
      cap.sub(weiRaised),
      openingTime,
      closingTime
    );
    uint256 allowance = token.allowance(benefactor, this);
    token.transferFrom(benefactor, this, allowance);
    token.approve(crowdsale, allowance);
    emit CrowdsaleInstantiated(msg.sender, crowdsale, allowance);
  }

}
