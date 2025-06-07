const MapTile = require("../MapTile.js");

class SaveStation extends MapTile {
    constructor(...args) {
        super(...args);

        this.properties = {
            name: "Save Station",
            color: "#2196F3",
            type: MapTile.Type.SAVE_STATION,
            thickness: 0,
            value: 0,
            interactable: true
        };
    }
}

module.exports = SaveStation;