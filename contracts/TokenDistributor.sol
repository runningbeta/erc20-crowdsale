pragma solidity ^0.4.24;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/ownership/HasNoEther.sol";
import "./lifecycle/Finalizable.sol";
import "./payment/IssuerWithEther.sol";
import "./payment/TokenTimelockEscrow.sol";
import "./payment/TokenTimelockFactory.sol";
import "./payment/TokenVestingFactory.sol";
import "./mocks/TokenTimelockEscrowMock.sol";
import "./SampleAllowanceCrowdsale.sol";


/**
 * @title TokenDistributor
 * @dev This is a token distribution contract.
 */
contract TokenDistributor is HasNoEther, Finalizable, IssuerWithEther {
  using SafeMath for uint256;
  using SafeERC20 for ERC20;

  // We also declare Factory.ContractInstantiation here to read it in truffle logs
  // https://github.com/trufflesuite/truffle/issues/555
  event ContractInstantiation(address sender, address instantiation);
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

  // Crowdsale that is created after the presale distribution is finalized
  SampleAllowanceCrowdsale public crowdsale;

  // Escrow contract used to lock team tokens until crowdsale ends
  TokenTimelockEscrow public presaleEscrow;

  // Escrow contract used to lock bonus tokens
  TokenTimelockEscrow public bonusEscrow;

  // Factory used to create individual time locked token contracts
  TokenTimelockFactory public timelockFactory;

  // Factory used to create individual vesting token contracts
  TokenVestingFactory public vestingFactory;

  /// @dev Throws if called before the crowdsale is created.
  modifier onlyIfCrowdsale() {
    require(isFinalized, "Contract not finalized.");
    require(crowdsale != address(0), "Crowdsale not started.");
    _;
  }

  constructor(
    address _benefactor,
    uint256 _rate,
    address _wallet,
    ERC20 _token,
    uint256 _cap,
    uint256 _openingTime,
    uint256 _closingTime,
    uint256 _bonusTime
  )
    public
    Issuer(_benefactor, _token)
  {
    require(_rate > 0, "Rate should not be > 0.");
    require(_wallet != address(0), "Wallet address should not be 0x0.");
    require(_cap > 0, "Cap should be > 0.");
    // solium-disable-next-line security/no-block-members
    require(_openingTime > block.timestamp, "Opening time should be in the future.");
    require(_closingTime > _openingTime, "Closing time should be after opening.");
    require(_bonusTime > _closingTime, "Bonus time should be after closing time.");

    rate = _rate;
    wallet = _wallet;
    token = _token;
    cap = _cap;
    openingTime = _openingTime;
    closingTime = _closingTime;

    presaleEscrow = new TokenTimelockEscrowMock(_token, _closingTime);
    bonusEscrow = new TokenTimelockEscrowMock(_token, _bonusTime);
    timelockFactory = new TokenTimelockFactory();
    vestingFactory = new TokenVestingFactory();
  }

  /**
   * @dev Sets a specific user's maximum contribution.
   * @param _beneficiary Address to be capped
   * @param _cap Wei limit for individual contribution
   */
  function setUserCap(address _beneficiary, uint256 _cap) external onlyOwner onlyIfCrowdsale {
    crowdsale.setUserCap(_beneficiary, _cap);
  }

  /**
   * @dev Sets a group of users' maximum contribution.
   * @param _beneficiaries List of addresses to be capped
   * @param _cap Wei limit for individual contribution
   */
  function setGroupCap(address[] _beneficiaries, uint256 _cap) external onlyOwner onlyIfCrowdsale {
    crowdsale.setGroupCap(_beneficiaries, _cap);
  }

  /**
   * @dev Returns the cap of a specific user.
   * @param _beneficiary Address whose cap is to be checked
   * @return Current cap for individual user
   */
  function getUserCap(address _beneficiary) public view onlyIfCrowdsale returns (uint256) {
    return crowdsale.getUserCap(_beneficiary);
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
  function issue(address _beneficiary, uint256 _amount, uint256 _weiAmount) public {
    require(cap >= weiRaised.add(_weiAmount), "Cap reached.");
    super.issue(_beneficiary, _amount, _weiAmount);
  }

  /**
   * @dev Called by the payer to store the sent amount as credit to be pulled when crowdsale ends.
   * @param _dest The destination address of the funds.
   * @param _amount The amount to transfer.
   */
  function depositPresaleTokens(address _dest, uint256 _amount) public onlyOwner onlyNotFinalized {
    require(token.allowance(benefactor, this) >= _amount, "Not enough allowance.");
    token.transferFrom(benefactor, this, _amount);
    token.approve(presaleEscrow, _amount);
    presaleEscrow.deposit(_dest, _amount);
  }

  /**
   * @dev Called by the payer to store the sent amount as credit to be pulled when crowdsale ends.
   * @param _dest The destination address of the funds.
   * @param _amount The amount to transfer.
   * @param _weiAmount The amount of wei exchanged for the tokens.
   */
  function depositPresaleTokens(address _dest, uint256 _amount, uint256 _weiAmount) public {
    require(cap >= weiRaised.add(_weiAmount), "Cap reached.");
    depositPresaleTokens(_dest, _amount);
    weiRaised = weiRaised.add(_weiAmount);
  }

  /// @dev Withdraw accumulated balance, called by payee.
  function withdrawPresale() public {
    presaleEscrow.withdraw(msg.sender);
  }

  /**
   * @dev Called by the payer to store the sent amount as credit to be pulled from token timelock contract.
   * @param _dest The destination address of the funds.
   * @param _amount The amount to transfer.
   */
  function depositBonus(address _dest, uint256 _amount) public onlyOwner onlyNotFinalized {
    require(token.allowance(benefactor, this) >= _amount, "Not enough allowance.");
    token.transferFrom(benefactor, this, _amount);
    token.approve(bonusEscrow, _amount);
    bonusEscrow.deposit(_dest, _amount);
  }

  /// @dev Withdraw accumulated balance, called by payee.
  function withdrawBonus() public {
    bonusEscrow.withdraw(msg.sender);
  }

  /**
   * @dev Called by the payer to store the sent amount as credit to be pulled
   * from token timelock contract.
   * @param _dest The destination address of the funds.
   * @param _amount The amount to transfer.
   * @param _releaseTime The release times after which the tokens can be withdrawn.
   * @return Returns wallet address.
   */
  function depositAndLock(
    address _dest,
    uint256 _amount,
    uint256 _releaseTime
  )
    public
    onlyOwner
    onlyNotFinalized
    returns (address tokenWallet)
  {
    require(token.allowance(benefactor, this) >= _amount, "Not enough allowance.");
    require(_dest != address(0), "Destination address should not be 0x0.");
    tokenWallet = timelockFactory.create(
      token,
      _dest,
      _releaseTime
    );
    token.transferFrom(benefactor, tokenWallet, _amount);
  }

  /**
   * @dev Called by the payer to store the sent amount as credit to be pulled
   * from token vesting contract.
   * @param _dest The destination address of the funds.
   * @param _amount The amount to transfer.
   * @param _cliff duration in seconds of the cliff in which tokens will begin to vest
   * @param _start the time (as Unix time) at which point vesting starts
   * @param _duration duration in seconds of the period in which the tokens will vest
   * @return Returns wallet address.
   */
  function depositAndVest(
    address _dest,
    uint256 _amount,
    uint256 _start,
    uint256 _cliff,
    uint256 _duration
  )
    public
    onlyOwner
    onlyNotFinalized
    returns (address tokenWallet)
  {
    require(token.allowance(benefactor, this) >= _amount, "Not enough allowance.");
    require(_dest != address(0), "Destination address should not be 0x0.");
    bool revocable = false;
    tokenWallet = vestingFactory.create(
      _dest,
      _start,
      _cliff,
      _duration,
      revocable
    );
    token.transferFrom(benefactor, tokenWallet, _amount);
  }

  /// @dev In case there are any unsold tokens, they are returned to the benefactor
  function claimUnsold() public onlyIfCrowdsale {
    require(crowdsale.hasEnded(), "Crowdsale still running.");
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
    uint256 crowdsaleCap = cap.sub(weiRaised);
    if (crowdsaleCap == 0) {
      // Cap reached in presale, no crowdsale necessary
      return;
    }

    address tokenWallet = this;
    crowdsale = new SampleAllowanceCrowdsale(
      rate,
      wallet,
      token,
      tokenWallet,
      crowdsaleCap,
      openingTime,
      closingTime
    );
    uint256 allowance = token.allowance(benefactor, this);
    token.transferFrom(benefactor, this, allowance);
    token.approve(crowdsale, allowance);
    emit CrowdsaleInstantiated(msg.sender, crowdsale, allowance);
  }

}
