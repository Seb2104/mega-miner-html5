const MapTile = require("../MapTile.js");

class FuelStation extends MapTile {
    constructor(...args) {
        super(...args);

        this.properties = {
            name: "Fuel Station",
            color: "#F44336",
            type: MapTile.Type.FUEL_STATION,
            thickness: 0,
            value: 0,
            interactable: true
        };
    }
}
