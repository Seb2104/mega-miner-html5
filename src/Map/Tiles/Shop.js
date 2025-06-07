const MapTile = require("../MapTile.js");

class Shop extends MapTile {
    constructor(...args) {
        super(...args);

        this.properties = {
            name: "Shop",
            color: "#4CAF50",
            type: MapTile.Type.SHOP,
            thickness: 0, // Can't be mined
            value: 0,
            interactable: true
        };
    }
}

module.exports = Shop;