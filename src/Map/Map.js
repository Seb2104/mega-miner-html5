// src/Map/Map.js (Updated with buildings)
/** @typedef {import("./MapTile.js")} MapTile */
const Tile = require("../Grid/Tile.js");
const MapTile = require("./MapTile.js"); // eslint-disable-line
const seedrandom = require("seedrandom");

// Tiles
const Grass = require("./Tiles/Grass.js");
const Dirt = require("./Tiles/Dirt.js");
const Coal = require("./Tiles/Coal.js");

// Buildings
const Shop = require("./Tiles/Shop.js");
const SaveStation = require("./Tiles/SaveStation.js");
const SellingPost = require("./Tiles/SellingPost.js");
const FuelStation = require("./Tiles/FuelStation.js");
const Teleporter = require("./Tiles/Teleporter.js");

/**
 * Handles and creates all tiles relating to the map itself. Also handles map generation among various other map-related things.
 */
class GameMap {
    /**
     * @param {import("../Game.js")} game The game.
     */
    constructor(game) {
        this.game = game;

        /**
         * A reference to the sprite grid for utility purposes.
         * @type {import("../Grid/Grid.js")}
         */
        this.grid = this.game.displayHandler.grid;

        /**
         * Determines the maximum position vertically that the tiles will be generated (in grid units).
         * @type {number}
         */
        this.horizonLineGU = 8;

        /**
         * Determines the maximum position vertically that tiles will be generated (in pixels).
         * @type {number}
         */
        this.horizonLine = this.horizonLineGU * this.grid.tileSize;

        /**
         * An array of "tiles" used in the background.
         * @type {Array<createjs.Container|createjs.Shape|createjs.Bitmap}>}
         */
        this.bg_tiles = [];

        /**
         * A list of tiles used in the foreground (supposedly the same layer as the player).
         * @type {Object.<string, MapTile>}
         */
        this.fg_tiles = {};

        /**
         * A container used to decrease rendering for each tile.
         * @type {createjs.Container}
         */
        this.tiles = new createjs.Container();

        /**
         * A randomly generated number depending on the EPOCH timestamp to determine the randomness of this map.
         * @type {number}
         */
        this.seed = 0;

        /**
         * Building positions on the surface
         * @type {Array<{type: Function, x: number}>}
         */
        this.surfaceBuildings = [
            { type: Shop, x: 5 },
            { type: SaveStation, x: 10 },
            { type: SellingPost, x: 15 },
            { type: FuelStation, x: 25 },
            { type: Teleporter, x: 30 }
        ];
    }

    /**
     * Generates a new map.
     */
    generate(seed) {
        // Set & Create a Seed
        this.seed = seed || Date.now();
        seedrandom(this.seed, { global: true });

        // Generate Background
        const bgdirt = new createjs.Shape();
        bgdirt.graphics.beginBitmapFill(this.game.loadingHandler.sprites.bgdirt).drawRect(0, this.horizonLine, this.grid.widthGU * this.grid.tileSize, (this.grid.heightGU * this.grid.tileSize) - this.horizonLine);
        this.bg_tiles.push(bgdirt);
        this.game.addChild(bgdirt);

        // Generate Background Grass Layer
        const bggrass = new createjs.Container();
        for (let i = 0; i < this.grid.widthGU; i++) {
            const t = new Tile(i, this.horizonLineGU);
            // Background Grass Tile
            const bggt = new MapTile(this, t, { type: MapTile.Type.BG_GRASS });
            bggt.make();
            bggrass.addChild(bggt);
        }
        this.bg_tiles.push(bggrass);
        this.game.addChild(bggrass);

        // Generate Surface (Grass + Buildings)
        for (let i = 0; i < this.grid.widthGU; i++) {
            const t = new Tile(i, this.horizonLineGU);
            
            // Check if this position should have a building
            const building = this.surfaceBuildings.find(b => b.x === i);
            
            if (building && i < this.grid.widthGU) {
                // Place building instead of grass
                const buildingTile = new building.type(this, t);
                buildingTile.make();
                this.tiles.addChild(buildingTile);
                this.fg_tiles[t.toString()] = buildingTile;
                
                // Add a visual indicator (colored rectangle) since we don't have building sprites
                const indicator = new createjs.Shape();
                const color = buildingTile.properties.color;
                indicator.graphics.beginFill(color).drawRect(
                    i * this.grid.tileSize + 5,
                    this.horizonLineGU * this.grid.tileSize + 5,
                    this.grid.tileSize - 10,
                    this.grid.tileSize - 10
                );
                indicator.graphics.beginStroke("#ffffff").setStrokeStyle(2).drawRect(
                    i * this.grid.tileSize + 5,
                    this.horizonLineGU * this.grid.tileSize + 5,
                    this.grid.tileSize - 10,
                    this.grid.tileSize - 10
                );
                this.game.addChild(indicator);
                
                // Add building label
                const label = new createjs.Text(buildingTile.properties.name, "10px Arial", "#ffffff");
                label.textAlign = "center";
                label.x = i * this.grid.tileSize + this.grid.tileSize / 2;
                label.y = this.horizonLineGU * this.grid.tileSize - 15;
                label.outline = 2;
                this.game.addChild(label);
                
            } else {
                // Place regular grass
                const mt = new Grass(this, t);
                mt.make();
                this.tiles.addChild(mt);
                this.fg_tiles[t.toString()] = mt;
            }
        }

        // Generate Dirt
        for (let gY = this.horizonLineGU + 1; gY < this.grid.heightGU; gY++) {
            for (let gX = 0; gX < this.grid.widthGU; gX++) {
                const t = new Tile(gX, gY);
                const mt = new Dirt(this, t);
                mt.make();
                this.tiles.addChild(mt);
                this.fg_tiles[t.toString()] = mt;
            }
        }
        this.game.addChild(this.tiles);

        // Temporary variable to determine which layer we're on.
        let layer = 0;

        // Generate Coal Layer (Layer Only Contains Coal)
        layer = 1;
        for (let gX = 0; gX < this.grid.widthGU; gX++) {
            for (let gY = this.horizonLineGU + 1; gY < this.horizonLineGU + 21; gY++) {
                const t = new Tile(gX, gY);
                if (this.shouldGenType("coal", layer, t)) this.genType(Coal, t);
            }
        }

        // Relayer and update
        this.game.displayHandler.relayer();
        this.game.update();

        // Cache the map
        this.tiles.cache(0, 0, this.grid.width, this.grid.height);
    }

    /**
     * Determines whether or not the item should be generated or not
     * Includes chance values, so < 7.5 is the same as 7.5%
     * @param {string} type
     * @param {number} layer
     * @param {Tile} tile
     */
    // eslint-disable-next-line no-unused-vars
    shouldGenType(type, layer, tile) {
        switch (type) {
            case "coal": {
                if (layer == 1) {
                    if (Math.random() * 100 <= 7.5) return true;
                    else return false;
                }
                break;
            }
            default: {
                return false;
            }
        }
    }

    /**
     * Actually generates the tile.
     * @param {Type} Type
     * @param {Tile} tile
     */
    genType(Type, tile) {
        const mt = new Type(this, tile);
        mt.make();
        const ts = tile.toString();
        if (this.fg_tiles[ts]) this.tiles.removeChild(this.fg_tiles[ts]);
        this.fg_tiles[ts] = mt;
        this.tiles.addChild(mt);
    }

    /**
     * Un-generates the map.
     */
    ungenerate() {
        this.seed = 0;

        this.bg_tiles.forEach(i => {
            // eslint-disable-next-line no-prototype-builtins
            if (i.hasOwnProperty("removeAllChildren")) i.removeAllChildren();
            this.game.removeChild(i);
        });
        this.fg_tiles = [];
        this.tiles.removeAllChildren();
        this.game.displayHandler.relayer();
    }

    /**
     * Re-positions the elements within the map to ensure they're in the right order. Used for relayering.
     */
    bringToFront() {
        for (let i = 0; i < this.bg_tiles.length; i++) {
            this.game.setChildIndex(this.bg_tiles[i], this.game.children.length - 1);
        }
        this.game.setChildIndex(this.tiles, this.game.children.length - 1);
    }
}

module.exports = GameMap;