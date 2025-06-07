/**
 * Used for handling everything that needs to be loaded.
 * Also contains direct pathes to many needed objects like sprites.
 */
class LoadingHandler {
    /**
     * @param {import("../Game.js")} game The game.
     */
    constructor(game) {
        this.game = game;

        /**
         * Contains a list of all the sprites used in the game indexed by their asset id.
         * @type {Object.<string, HTMLImageElement|createjs.SpriteSheet>}
         */
        this.sprites = {
            // ...
        };

        /**
         * Track loading progress
         */
        this.loadedAssets = 0;
        this.totalAssets = 0;
    }

    load(callback) {
        console.log("Starting asset loading...");
        
        this.loader = new createjs.LoadQueue();

        this.loader.on("fileload", event => {
            console.log("Loaded:", event.item.id, event.item.type);
            
            if (event.item.type == "image" || event.item.type == "spritesheet") {
                this.sprites[event.item.id] = event.result;
                this.loadedAssets++;
                console.log(`Progress: ${this.loadedAssets}/${this.totalAssets}`);
            }
        });

        this.loader.on("error", err => {
            console.error("Failed to load " + err.data.id + "!");
            console.error("Error details:", err);
            
            // Create placeholder assets if loading fails
            this.createPlaceholderAssets();
        });

        this.loader.on("complete", () => {
            console.log("Asset loading complete!");
            console.log("Loaded sprites:", Object.keys(this.sprites));
            
            // Ensure we have all required sprites
            this.ensureRequiredAssets();
            
            callback();
        });

        this.loader.on("progress", (event) => {
            console.log("Loading progress:", Math.round(event.progress * 100) + "%");
        });

        // Try to load manifest, but handle failure gracefully
        try {
            this.loader.loadManifest({ src: "assets/manifest.json", type: "manifest" });
        } catch (error) {
            console.error("Failed to load manifest, creating placeholder assets");
            this.createPlaceholderAssets();
            setTimeout(callback, 100); // Call callback after placeholders are ready
        }
    }

    /**
     * Creates placeholder assets if real assets can't be loaded
     */
    createPlaceholderAssets() {
        console.log("Creating placeholder assets...");

        // Create placeholder sprites
        this.sprites.bgdirt = this.createPlaceholderImage(50, 50, "#8B4513");
        this.sprites.tiles = this.createPlaceholderSpriteSheet();
        this.sprites.player = this.createPlaceholderPlayerSpriteSheet();
        this.sprites.player_drills = this.createPlaceholderDrillSpriteSheet();
        this.sprites.player_boost = this.createPlaceholderBoostSpriteSheet();
    }

    /**
     * Creates a placeholder image
     */
    createPlaceholderImage(width, height, color) {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = color;
        ctx.fillRect(0, 0, width, height);
        return canvas;
    }

    /**
     * Creates placeholder tile spritesheet
     */
    createPlaceholderSpriteSheet() {
        const canvas = document.createElement('canvas');
        canvas.width = 1200; // 24 tiles * 50px
        canvas.height = 50;
        const ctx = canvas.getContext('2d');
        
        // Create different colored tiles
        const colors = ["#90EE90", "#8B4513", "#228B22", "#32CD32", "#000000", "#333333", "#4CAF50", "#2196F3", "#FF9800", "#F44336", "#9C27B0"];
        
        for (let i = 0; i < 24; i++) {
            ctx.fillStyle = colors[i % colors.length] || "#666666";
            ctx.fillRect(i * 50, 0, 50, 50);
            
            // Add border
            ctx.strokeStyle = "#000000";
            ctx.lineWidth = 1;
            ctx.strokeRect(i * 50, 0, 50, 50);
        }

        return new createjs.SpriteSheet({
            images: [canvas],
            frames: { width: 50, height: 50, count: 24 }
        });
    }

    /**
     * Creates placeholder player spritesheet
     */
    createPlaceholderPlayerSpriteSheet() {
        const canvas = document.createElement('canvas');
        canvas.width = 53 * 16; // 16 frames
        canvas.height = 53;
        const ctx = canvas.getContext('2d');
        
        for (let i = 0; i < 16; i++) {
            // Draw simple player rectangle
            ctx.fillStyle = "#FFD700";
            ctx.fillRect(i * 53, 0, 53, 53);
            
            // Add simple face
            ctx.fillStyle = "#000000";
            ctx.fillRect(i * 53 + 15, 15, 5, 5); // left eye
            ctx.fillRect(i * 53 + 33, 15, 5, 5); // right eye
            ctx.fillRect(i * 53 + 20, 30, 13, 3); // mouth
            
            // Add border
            ctx.strokeStyle = "#000000";
            ctx.lineWidth = 2;
            ctx.strokeRect(i * 53, 0, 53, 53);
        }

        return new createjs.SpriteSheet({
            images: [canvas],
            frames: { width: 53, height: 53, count: 16 },
            animations: {
                "down": [0, 3],
                "up": [4, 7],
                "right": [8, 11],
                "left": [12, 15]
            }
        });
    }

    /**
     * Creates placeholder drill spritesheet
     */
    createPlaceholderDrillSpriteSheet() {
        const canvas = document.createElement('canvas');
        canvas.width = 53 * 80; // 80 frames
        canvas.height = 53;
        const ctx = canvas.getContext('2d');
        
        for (let i = 0; i < 80; i++) {
            // Draw simple drill
            ctx.fillStyle = "#C0C0C0";
            ctx.fillRect(i * 53 + 20, 20, 13, 13);
            
            // Add rotation effect
            const rotation = (i % 4) * 45;
            ctx.save();
            ctx.translate(i * 53 + 26.5, 26.5);
            ctx.rotate(rotation * Math.PI / 180);
            ctx.fillStyle = "#808080";
            ctx.fillRect(-3, -8, 6, 16);
            ctx.fillRect(-8, -3, 16, 6);
            ctx.restore();
        }

        return new createjs.SpriteSheet({
            images: [canvas],
            frames: { width: 53, height: 53, count: 80 },
            animations: {
                "basic_down": [0, 2],
                "basic_up": [20, 22],
                "basic_right": [40, 42],
                "basic_left": [60, 62],
                "saphire_down": [4, 6],
                "saphire_up": [24, 26],
                "saphire_right": [44, 46],
                "saphire_left": [64, 66],
                "emerald_down": [8, 10],
                "emerald_up": [28, 30],
                "emerald_right": [48, 50],
                "emerald_left": [68, 70],
                "ruby_down": [12, 14],
                "ruby_up": [32, 34],
                "ruby_right": [52, 54],
                "ruby_left": [72, 74],
                "diamond_down": [16, 18],
                "diamond_up": [36, 38],
                "diamond_right": [56, 58],
                "diamond_left": [76, 78]
            }
        });
    }

    /**
     * Creates placeholder boost spritesheet
     */
    createPlaceholderBoostSpriteSheet() {
        const canvas = document.createElement('canvas');
        canvas.width = 20 * 16; // 16 frames
        canvas.height = 20;
        const ctx = canvas.getContext('2d');
        
        for (let i = 0; i < 16; i++) {
            // Draw flame effect
            const intensity = (i % 4) / 4;
            ctx.fillStyle = `rgba(255, ${Math.floor(165 * intensity)}, 0, 0.8)`;
            ctx.fillRect(i * 20 + 5, 5, 10, 10);
            
            ctx.fillStyle = `rgba(255, 255, 0, ${intensity})`;
            ctx.fillRect(i * 20 + 7, 7, 6, 6);
        }

        return new createjs.SpriteSheet({
            images: [canvas],
            frames: { width: 20, height: 20, count: 16 },
            animations: {
                "down": [0, 3],
                "up": [4, 7],
                "right": [8, 11],
                "left": [12, 15]
            }
        });
    }

    /**
     * Ensures all required assets exist
     */
    ensureRequiredAssets() {
        const required = ['bgdirt', 'tiles', 'player', 'player_drills', 'player_boost'];
        
        for (const assetId of required) {
            if (!this.sprites[assetId]) {
                console.warn(`Missing asset: ${assetId}, creating placeholder`);
                
                switch (assetId) {
                    case 'bgdirt':
                        this.sprites[assetId] = this.createPlaceholderImage(50, 50, "#8B4513");
                        break;
                    case 'tiles':
                        this.sprites[assetId] = this.createPlaceholderSpriteSheet();
                        break;
                    case 'player':
                        this.sprites[assetId] = this.createPlaceholderPlayerSpriteSheet();
                        break;
                    case 'player_drills':
                        this.sprites[assetId] = this.createPlaceholderDrillSpriteSheet();
                        break;
                    case 'player_boost':
                        this.sprites[assetId] = this.createPlaceholderBoostSpriteSheet();
                        break;
                }
            }
        }
    }
}

module.exports = LoadingHandler;