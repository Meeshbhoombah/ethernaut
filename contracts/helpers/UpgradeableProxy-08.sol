// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract UpgradeableProxy {
    bytes32 private constant IMPLEMENTATION_SLOT =
        bytes32(uint256(keccak256("eip1967.proxy.implementation")) - 1);

    constructor(address _implementation, bytes memory _data) payable {
        _upgradeTo(_implementation);

        if (_data.length > 0) {
            (bool success, ) = _implementation.delegatecall(_data);
            require(success, "Initialization failed");
        }
    }

    function _upgradeTo(address newImplementation) internal {
        bytes32 slot = IMPLEMENTATION_SLOT;

        assembly {
            sstore(slot, newImplementation)
        }
    }

    function _implementation() internal view returns (address impl) {
        bytes32 slot = IMPLEMENTATION_SLOT;

        assembly {
            impl := sload(slot)
        }
    }

    function _delegate() internal {
        address impl = _implementation();

        assembly {
            calldatacopy(0, 0, calldatasize())

            let result := delegatecall(
                gas(),
                impl,
                0,
                calldatasize(),
                0,
                0
            )

            returndatacopy(0, 0, returndatasize())

            switch result
            case 0 {
                revert(0, returndatasize())
            }
            default {
                return(0, returndatasize())
            }
        }
    }

    fallback() external payable {
        _delegate();
    }

    receive() external payable {
        _delegate();
    }
}
