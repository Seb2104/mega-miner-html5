const MapTile = require("../MapTile.js");

class SellingPost extends MapTile {
    constructor(...args) {
        super(...args);

        this.properties = {
            name: "Selling Post",
            color: "#FF9800",
            type: MapTile.Type.SELLING_POST,
            thickness: 0,
            value: 0,
            interactable: true
        };
    }
}

module.exports = SellingPost;