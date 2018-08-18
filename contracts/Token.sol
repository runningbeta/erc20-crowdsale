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
contract Token is NoOwner, DetailedERC20, MintableToken, BurnableToken {

  string constant NAME = "Token";
  string constant SYMBOL = "TKN";
  uint8 constant DECIMALS = 18;

  /**
   * @dev Constructor that gives msg.sender all of existing tokens.
   */
  constructor() DetailedERC20(NAME, SYMBOL, DECIMALS) public {
  }

}
