// src/Handler/BuildingHandler.js
const MapTile = require("../Map/MapTile.js");

/**
 * Handles interactions with surface buildings
 */
class BuildingHandler {
    /**
     * @param {import("../Game.js")} game The game
     */
    constructor(game) {
        this.game = game;
        this.player = null; // Will be set when player is created
        
        /**
         * Currently open building UI
         * @type {string|null}
         */
        this.currentUI = null;

        /**
         * Teleporter waypoints
         * @type {Array<{name: string, x: number, y: number}>}
         */
        this.waypoints = [];
    }

    /**
     * Sets the player reference
     * @param {import("../Player/Player.js")} player 
     */
    setPlayer(player) {
        this.player = player;
        // Listen for player tile movements
        this.player.addEventListener("tilemove", this.onPlayerMove.bind(this));
    }

    /**
     * Called when player moves to a new tile
     * @param {CustomEvent} event 
     */
    onPlayerMove(event) {
        const tile = event.detail;
        const map = this.game.displayHandler.map;
        const maptile = map.fg_tiles[tile.toString()];

        if (maptile && maptile.properties.interactable) {
            this.handleBuildingInteraction(maptile.properties.type);
        }
    }

    /**
     * Handles interaction with different building types
     * @param {number} buildingType 
     */
    handleBuildingInteraction(buildingType) {
        switch (buildingType) {
            case MapTile.Type.SHOP:
                this.openShop();
                break;
            case MapTile.Type.SAVE_STATION:
                this.saveGame();
                break;
            case MapTile.Type.SELLING_POST:
                this.openSellingPost();
                break;
            case MapTile.Type.FUEL_STATION:
                this.openFuelStation();
                break;
            case MapTile.Type.TELEPORTER:
                this.openTeleporter();
                break;
        }
    }

    /**
     * Opens the shop UI
     */
    openShop() {
        if (this.currentUI) return;
        this.currentUI = "shop";
        
        this.createUI("Shop", [
            { name: "Fuel Tank Upgrade", price: 500, id: "fuel_upgrade" },
            { name: "Cargo Hold Upgrade", price: 750, id: "cargo_upgrade" },
            { name: "Drill Speed Upgrade", price: 1000, id: "speed_upgrade" },
            { name: "Better Drill", price: 2000, id: "drill_upgrade" }
        ]);
    }

    /**
     * Saves the game
     */
    saveGame() {
        const saveData = {
            money: this.player.money,
            fuel: this.player.fuel,
            maxFuel: this.player.maxFuel,
            tank: this.player.tank,
            position: { x: this.player.x, y: this.player.y },
            cargo: this.player.hold.mapTiles,
            waypoints: this.waypoints,
            timestamp: Date.now()
        };

        localStorage.setItem('megaminer_save', JSON.stringify(saveData));
        this.showMessage("Game Saved Successfully!", "#4CAF50");
    }

    /**
     * Opens the selling post
     */
    openSellingPost() {
        if (this.currentUI) return;
        if (this.player.hold.mapTiles.length === 0) {
            this.showMessage("No items to sell!", "#FF9800");
            return;
        }

        this.currentUI = "selling";
        
        // Calculate total value
        let totalValue = 0;
        const itemCounts = {};
        
        this.player.hold.mapTiles.forEach(item => {
            if (!itemCounts[item.name]) {
                itemCounts[item.name] = { count: 0, value: item.value };
            }
            itemCounts[item.name].count++;
            totalValue += item.value;
        });

        const items = Object.keys(itemCounts).map(name => ({
            name: `${itemCounts[name].count}x ${name}`,
            price: itemCounts[name].count * itemCounts[name].value,
            id: "sell_all"
        }));

        items.push({ name: "SELL ALL", price: totalValue, id: "sell_all", highlight: true });

        this.createUI("Selling Post", items);
    }

    /**
     * Opens the fuel station
     */
    openFuelStation() {
        if (this.currentUI) return;
        this.currentUI = "fuel";

        const fuelNeeded = this.player.maxFuel - this.player.fuel;
        const refuelCost = Math.ceil(fuelNeeded * 2); // 2 coins per fuel unit

        if (fuelNeeded <= 0) {
            this.showMessage("Fuel tank is already full!", "#4CAF50");
            return;
        }

        this.createUI("Fuel Station", [
            { name: `Refuel (${fuelNeeded.toFixed(1)} units)`, price: refuelCost, id: "refuel" }
        ]);
    }

    /**
     * Opens the teleporter
     */
    openTeleporter() {
        if (this.currentUI) return;
        this.currentUI = "teleporter";

        const items = [
            { name: "Add Current Location", price: 100, id: "add_waypoint" }
        ];

        this.waypoints.forEach((waypoint, index) => {
            items.push({
                name: `Teleport to ${waypoint.name}`,
                price: 50,
                id: `teleport_${index}`
            });
        });

        this.createUI("Teleporter", items);
    }

    /**
     * Creates a generic UI for buildings
     * @param {string} title 
     * @param {Array} items 
     */
    createUI(title, items) {
        // Create overlay
        const overlay = document.createElement('div');
        overlay.id = 'building-ui-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
            z-index: 100;
            display: flex;
            justify-content: center;
            align-items: center;
        `;

        // Create UI container
        const container = document.createElement('div');
        container.style.cssText = `
            background: #2c3e50;
            border: 3px solid #34495e;
            border-radius: 10px;
            padding: 20px;
            min-width: 300px;
            max-width: 500px;
            color: white;
            font-family: Arial, sans-serif;
        `;

        // Title
        const titleEl = document.createElement('h2');
        titleEl.textContent = title;
        titleEl.style.cssText = `
            margin: 0 0 20px 0;
            text-align: center;
            color: #ecf0f1;
        `;
        container.appendChild(titleEl);

        // Money display
        const moneyEl = document.createElement('div');
        moneyEl.textContent = `Money: $${this.player.money}`;
        moneyEl.style.cssText = `
            text-align: center;
            margin-bottom: 20px;
            font-size: 18px;
            color: #f39c12;
        `;
        container.appendChild(moneyEl);

        // Items
        items.forEach(item => {
            const itemEl = document.createElement('div');
            itemEl.style.cssText = `
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 10px;
                margin: 5px 0;
                background: ${item.highlight ? '#27ae60' : '#34495e'};
                border-radius: 5px;
                cursor: pointer;
                transition: background 0.2s;
            `;

            itemEl.innerHTML = `
                <span>${item.name}</span>
                <span style="color: #f39c12;">$${item.price}</span>
            `;

            itemEl.addEventListener('mouseenter', () => {
                itemEl.style.background = item.highlight ? '#2ecc71' : '#4a5f7a';
            });

            itemEl.addEventListener('mouseleave', () => {
                itemEl.style.background = item.highlight ? '#27ae60' : '#34495e';
            });

            itemEl.addEventListener('click', () => {
                this.handlePurchase(item, moneyEl);
            });

            container.appendChild(itemEl);
        });

        // Close button
        const closeBtn = document.createElement('button');
        closeBtn.textContent = 'Close';
        closeBtn.style.cssText = `
            width: 100%;
            padding: 10px;
            margin-top: 20px;
            background: #e74c3c;
            border: none;
            border-radius: 5px;
            color: white;
            font-size: 16px;
            cursor: pointer;
        `;

        closeBtn.addEventListener('click', () => {
            this.closeUI();
        });

        container.appendChild(closeBtn);
        overlay.appendChild(container);
        document.body.appendChild(overlay);

        // Close on overlay click
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                this.closeUI();
            }
        });
    }

    /**
     * Handles purchase/action from UI
     * @param {Object} item 
     * @param {HTMLElement} moneyEl 
     */
    handlePurchase(item, moneyEl) {
        if (item.price > this.player.money) {
            this.showMessage("Not enough money!", "#e74c3c");
            return;
        }

        let success = false;
        let message = "";

        switch (item.id) {
            case "fuel_upgrade":
                this.player.maxFuel += 5;
                this.player.money -= item.price;
                success = true;
                message = "Fuel tank upgraded!";
                break;

            case "cargo_upgrade":
                this.player.hold.capacity += 5;
                this.player.money -= item.price;
                success = true;
                message = "Cargo hold upgraded!";
                break;

            case "speed_upgrade":
                this.player.speedMultiplier += 0.2;
                this.player.money -= item.price;
                success = true;
                message = "Drill speed increased!";
                break;

            case "sell_all":
                const totalValue = this.player.hold.mapTiles.reduce((sum, item) => sum + item.value, 0);
                this.player.money += totalValue;
                this.player.hold.mapTiles = [];
                this.player.hold.updateHold();
                success = true;
                message = `Sold all items for $${totalValue}!`;
                this.closeUI();
                break;

            case "refuel":
                this.player.fuel = this.player.maxFuel;
                this.player.updateFuel(0);
                this.player.money -= item.price;
                success = true;
                message = "Fuel tank refilled!";
                break;

            case "add_waypoint":
                const name = prompt("Enter waypoint name:") || `Waypoint ${this.waypoints.length + 1}`;
                this.waypoints.push({
                    name: name,
                    x: this.player.x,
                    y: this.player.y
                });
                this.player.money -= item.price;
                success = true;
                message = `Waypoint "${name}" added!`;
                this.closeUI();
                break;

            default:
                if (item.id.startsWith("teleport_")) {
                    const index = parseInt(item.id.split("_")[1]);
                    const waypoint = this.waypoints[index];
                    if (waypoint) {
                        this.player.x = waypoint.x;
                        this.player.y = waypoint.y;
                        this.player.targetPos = { x: waypoint.x, y: waypoint.y };
                        this.player.money -= item.price;
                        success = true;
                        message = `Teleported to ${waypoint.name}!`;
                        this.closeUI();
                    }
                }
                break;
        }

        if (success) {
            // Update money display
            moneyEl.textContent = `Money: $${this.player.money}`;
            document.getElementById("money").innerHTML = `Money: $${this.player.money}`;
            this.showMessage(message, "#27ae60");
        }
    }

    /**
     * Shows a temporary message
     * @param {string} text 
     * @param {string} color 
     */
    showMessage(text, color) {
        const messageEl = document.createElement('div');
        messageEl.textContent = text;
        messageEl.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: ${color};
            color: white;
            padding: 15px 25px;
            border-radius: 5px;
            font-size: 18px;
            z-index: 200;
            font-family: Arial, sans-serif;
        `;

        document.body.appendChild(messageEl);

        setTimeout(() => {
            document.body.removeChild(messageEl);
        }, 2000);
    }

    /**
     * Closes the current UI
     */
    closeUI() {
        const overlay = document.getElementById('building-ui-overlay');
        if (overlay) {
            document.body.removeChild(overlay);
        }
        this.currentUI = null;
    }
}

module.exports = BuildingHandler;