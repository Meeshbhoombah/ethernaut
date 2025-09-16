// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract ForceSender {
    // Accept ETH on deployment
    constructor() payable {}

    // Selfdestruct and send ETH to target
    function destroy(address payable _target) public {
        selfdestruct(_target);
    }
}

