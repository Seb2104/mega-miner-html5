/**
 * Handles saving and loading game state
 */
class SaveHandler {
    /**
     * @param {import("../Game.js")} game The game
     */
    constructor(game) {
        this.game = game;
        this.saveKey = 'megaminer_save';
    }

    /**
     * Saves the current game state
     * @returns {boolean} Success
     */
    saveGame() {
        try {
            const player = this.game.displayHandler.player;
            const buildingHandler = this.game.displayHandler.buildingHandler;
            
            const saveData = {
                version: "1.0.0",
                timestamp: Date.now(),
                player: {
                    money: player.money,
                    fuel: player.fuel,
                    maxFuel: player.maxFuel,
                    tank: player.tank,
                    position: { 
                        x: player.x, 
                        y: player.y 
                    },
                    speedMultiplier: player.speedMultiplier,
                    cargo: player.hold.mapTiles,
                    cargoCapacity: player.hold.capacity
                },
                world: {
                    seed: this.game.displayHandler.map.seed,
                    waypoints: buildingHandler.waypoints
                }
            };

            localStorage.setItem(this.saveKey, JSON.stringify(saveData));
            return true;
        } catch (error) {
            console.error("Failed to save game:", error);
            return false;
        }
    }

    /**
     * Loads the game state
     * @returns {Object|null} Save data or null if not found
     */
    loadGame() {
        try {
            const saveDataStr = localStorage.getItem(this.saveKey);
            if (!saveDataStr) return null;

            const saveData = JSON.parse(saveDataStr);
            
            // Validate save data
            if (!saveData.version || !saveData.player) {
                console.warn("Invalid save data format");
                return null;
            }

            return saveData;
        } catch (error) {
            console.error("Failed to load game:", error);
            return null;
        }
    }

    /**
     * Applies loaded save data to the game
     * @param {Object} saveData 
     */
    applySaveData(saveData) {
        try {
            const player = this.game.displayHandler.player;
            const buildingHandler = this.game.displayHandler.buildingHandler;
            
            // Apply player data
            player.money = saveData.player.money || 300;
            player.fuel = saveData.player.fuel || player.maxFuel;
            player.maxFuel = saveData.player.maxFuel || 10;
            player.tank = saveData.player.tank || 0;
            player.speedMultiplier = saveData.player.speedMultiplier || 1;
            
            // Apply position
            if (saveData.player.position) {
                player.x = saveData.player.position.x;
                player.y = saveData.player.position.y;
                player.targetPos = { 
                    x: saveData.player.position.x, 
                    y: saveData.player.position.y 
                };
                player.tile = player.grid.getTilePositionFromPixelPosition(player.x, player.y);
            }

            // Apply cargo
            if (saveData.player.cargo) {
                player.hold.mapTiles = saveData.player.cargo;
                player.hold.updateHold();
            }
            
            if (saveData.player.cargoCapacity) {
                player.hold.capacity = saveData.player.cargoCapacity;
            }

            // Apply world data
            if (saveData.world.waypoints) {
                buildingHandler.waypoints = saveData.world.waypoints;
            }

            // Update UI
            player.updateFuel(0);
            document.getElementById("money").innerHTML = `Money: $${player.money}`;
            
            return true;
        } catch (error) {
            console.error("Failed to apply save data:", error);
            return false;
        }
    }

    /**
     * Checks if a save file exists
     * @returns {boolean}
     */
    hasSaveFile() {
        return localStorage.getItem(this.saveKey) !== null;
    }

    /**
     * Deletes the save file
     */
    deleteSave() {
        localStorage.removeItem(this.saveKey);
    }

    /**
     * Auto-loads game if save exists
     */
    autoLoad() {
        if (this.hasSaveFile()) {
            const saveData = this.loadGame();
            if (saveData) {
                // Add a slight delay to ensure all systems are initialized
                setTimeout(() => {
                    this.applySaveData(saveData);
                    this.game.displayHandler.buildingHandler.showMessage("Game loaded successfully!", "#4CAF50");
                }, 100);
            }
        }
    }
}

module.exports = SaveHandler;

// Add to src/Handler/DisplayHandler.js init() method:
/*
// Initialize save handler
this.saveHandler = new SaveHandler(this.game);

// Auto-load if save exists (add this at the end of init())
this.saveHandler.autoLoad();
*/

// Update BuildingHandler.js saveGame() method:
/*
saveGame() {
    const saveHandler = this.game.displayHandler.saveHandler;
    if (saveHandler.saveGame()) {
        this.showMessage("Game Saved Successfully!", "#4CAF50");
    } else {
        this.showMessage("Failed to save game!", "#e74c3c");
    }
}
*/