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
  TokenTimelockIndividualEscrow private escrow;

  // Crowdsale that is created after the presale distribution is finalized
  SimpleAllowanceCrowdsale public crowdsale;

  constructor(
    uint256 _rate,
    address _wallet,
    ERC20 _token,
    uint256 _cap,
    uint256 _openingTime,
    uint256 _closingTime
  )
    public
    Issuer(this, _token)
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
  * @dev Withdraw accumulated balance, called by payee.
  */
  function withdrawPayments() public {
    address payee = msg.sender;
    escrow.withdraw(payee);
  }

  /**
  * @dev Called by the payer to store the sent amount as credit to be pulled.
  * @param _dest The destination address of the funds.
  * @param _amount The amount to transfer.
  * @param _releaseTime The release times after which the tokens can be withdrawn.
  */
  function depositAndLock(address _dest, uint256 _amount, uint256 _releaseTime) public onlyOwner {
    assert(token.balanceOf(this) >= _amount);
    token.approve(escrow, _amount);
    escrow.depositAndLock(_dest, _amount, _releaseTime);
  }

  function finalization() internal {
    super.finalization();
    crowdsale = new SimpleAllowanceCrowdsale(
      rate,
      wallet,
      token,
      this,
      cap.sub(weiRaised),
      openingTime,
      closingTime
    );
    token.approve(crowdsale, token.balanceOf(this));
  }

}
