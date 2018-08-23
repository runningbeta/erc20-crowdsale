pragma solidity ^0.4.24;

import "openzeppelin-solidity/contracts/ownership/NoOwner.sol";
import "openzeppelin-solidity/contracts/token/ERC20/DetailedERC20.sol";
import "openzeppelin-solidity/contracts/token/ERC20/MintableToken.sol";
import "openzeppelin-solidity/contracts/token/ERC20/BurnableToken.sol";


/**
 * @title SimpleToken
 * @dev Very simple ERC20 Token example, where all tokens minted by the contract owner,
 * or burned by the token holder.
 */
contract Token is NoOwner, DetailedERC20, MintableToken, BurnableToken {

  string public constant NAME = "Token";
  string public constant SYMBOL = "TKN";
  uint8 public constant DECIMALS = 18;

  /**
   * @dev Constructor that initializes the contract details.
   */
  constructor() public DetailedERC20(NAME, SYMBOL, DECIMALS) {
    // constructor
  }

}
