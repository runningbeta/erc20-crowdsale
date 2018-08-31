pragma solidity ^0.4.24;

import "openzeppelin-solidity/contracts/token/ERC20/StandardToken.sol";


contract ValidTransferStandardToken is StandardToken {

  modifier validDestination(address _to) {
    require(_to != address(0), "Transfering tokens to 0x0 address is not allowed.");
    require(_to != address(this), "Transfering tokens to token contract address is not allowed.");
    _;
  }

  /**
  * @dev Transfer token for a specified address
  * @param _to The address to transfer to.
  * @param _value The amount to be transferred.
  */
  function transfer(address _to, uint256 _value)
    public
    validDestination(_to)
    returns (bool)
  {
    return super.transfer(_to, _value);
  }

  /**
   * @dev Transfer tokens from one address to another
   * @param _from address The address which you want to send tokens from
   * @param _to address The address which you want to transfer to
   * @param _value uint256 the amount of tokens to be transferred
   */
  function transferFrom(address _from, address _to, uint256 _value)
    public
    validDestination(_to)
    returns (bool)
  {
    return super.transferFrom(_from, _to, _value);
  }


}