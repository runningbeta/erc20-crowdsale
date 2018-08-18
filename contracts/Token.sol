pragma solidity ^0.4.24;

import "openzeppelin-solidity/contracts/ownership/NoOwner.sol";
import "openzeppelin-solidity/contracts/token/ERC20/DetailedERC20.sol";
import "openzeppelin-solidity/contracts/token/ERC20/MintableToken.sol";
import "openzeppelin-solidity/contracts/token/ERC20/BurnableToken.sol";


/**
 * @title SimpleToken
 * @dev Very simple ERC20 Token example, where all tokens are pre-assigned to the creator.
 * Note they can later distribute these tokens as they wish using `transfer` and other
 * `StandardToken` functions.
 */
contract ParticleToken is NoOwner, DetailedERC20, MintableToken, BurnableToken {

  string constant NAME = "Token";
  string constant SYMBOL = "TKN";
  uint8 constant DECIMALS = 18;

  uint256 public constant INITIAL_SUPPLY = 10000 * (10 ** uint256(DECIMALS));

  /**
   * @dev Constructor that gives msg.sender all of existing tokens.
   */
  constructor() DetailedERC20(NAME, SYMBOL, DECIMALS) public {
    totalSupply_ = INITIAL_SUPPLY;
    balances[msg.sender] = INITIAL_SUPPLY;
    emit Transfer(0x0, msg.sender, INITIAL_SUPPLY);
  }

}
