// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Token {
    mapping(address => uint256) private _balances;
    uint256 private _totalSupply;
    
    function balanceOf(address account) public view returns (uint256) {
        return _balances[account];
    }
    
    function transfer(address to, uint256 amount) public returns (bool) {
        require(_balances[msg.sender] >= amount);
        _balances[msg.sender] -= amount;
        _balances[to] += amount;
        return true;
    }
}
