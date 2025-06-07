const MapTile = require("../MapTile.js");

class Teleporter extends MapTile {
    constructor(...args) {
        super(...args);

        this.properties = {
            name: "Teleporter",
            color: "#9C27B0",
            type: MapTile.Type.TELEPORTER,
            thickness: 0,
            value: 0,
            interactable: true
        };
    }
}

module.exports = Teleporter;