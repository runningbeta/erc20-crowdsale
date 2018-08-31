pragma solidity ^0.4.24;

import "./lifecycle/Finalizable.sol";
import "./token/ERC20/ValidTransferStandardToken.sol";
import "openzeppelin-solidity/contracts/ownership/NoOwner.sol";
import "openzeppelin-solidity/contracts/token/ERC20/DetailedERC20.sol";
import "openzeppelin-solidity/contracts/token/ERC20/StandardBurnableToken.sol";


/**
 * @title SimpleToken
 * @dev ERC20 Example Token (TOK)
 *
 * TOK Tokens are divisible by 1e18 (1 000 000 000 000 000 000) base.
 *
 * TOK are displayed using 18 decimal places of precision.
 *
 * 1 TOK is equivalent to:
 *   1 000 000 000 000 000 000 == 1 * 10**18 == 1e18
 *
 * 1 Billion TOK (total supply) is equivalent to:
 *   1000000000 * 10**18 == 1e27
 *
 * @notice All tokens are pre-assigned to the creator. Note they can later distribute these
 * tokens as they wish using `transfer` and other `StandardToken` functions.
 * This is a BurnableToken where users can burn tokens when the burning functionality is
 * enabled (contract is finalized) by the owner.
 */
contract FixedSupplyBurnableToken is NoOwner, Finalizable, DetailedERC20, StandardBurnableToken, ValidTransferStandardToken {

  string public constant NAME = "Example Token";
  string public constant SYMBOL = "TOK";
  uint8 public constant DECIMALS = 18;

  uint256 public constant INITIAL_SUPPLY = 1000000000 * (10 ** uint256(DECIMALS));

  /// @dev Throws if called before the contract is finalized.
  modifier onlyFinalizedOrOwner() {
    require(isFinalized || msg.sender == owner, "Contract not finalized or sender not owner.");
    _;
  }

  /// @dev Constructor that gives msg.sender all of existing tokens.
  constructor() public DetailedERC20(NAME, SYMBOL, DECIMALS) {
    totalSupply_ = INITIAL_SUPPLY;
    balances[msg.sender] = INITIAL_SUPPLY;
    emit Transfer(address(0), msg.sender, INITIAL_SUPPLY);
  }

  /**
   * @dev Overrides StandardToken._burn in order for burn and burnFrom to be disabled
   * when the contract is paused.
   */
  function _burn(address _who, uint256 _value) internal onlyFinalizedOrOwner {
    super._burn(_who, _value);
  }

}
