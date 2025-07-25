/** @typedef {import("../Map/MapTile.js")} MapTile */
const Tile = require("../Grid/Tile.js");
const PlayerAnim = require("./PlayerAnim.js");
const PlayerDrill = require("./PlayerDrill.js");
const PlayerBoost = require("./PlayerBoost.js");
const PlayerHold = require("./PlayerHold.js");

/**
 * The player -- the object that the player controls.
 */
class Player extends createjs.Sprite {
    /**
     * @param {import("../Game.js")} game The game.
     */
    constructor(game) {
        super();
        this.game = game;

        /**
         * A reference to the sprite grid for utility purposes.
         * @type {import("../Grid/Grid.js")}
         */
        this.grid = this.game.displayHandler.grid;

        /**
         * A reference to the map for utility purposes.
         * @type {import("../Map/Map.js")}
         */
        this.map = this.game.displayHandler.map;

        /**
         * The speed at which the player will move at by default.
         * Calculated by pixels per millisecond.
         *
         * Timed off of original game. It takes approx. 900 ms
         * per 4 tiles. That's 225 ms per tile. At 50 pixels
         * per tile, we do 50 pixels / 225 ms to give us
         * 0.222 pixels per millisecond.
         *
         * Mining tiles is fairly consistent, but thickness
         * is provided as a method of changing the speed
         * going through. It takes 3400 ms to mine 4 tiles.
         * That's 850 ms per tile. At 50 pixels per tile,
         * we do 50 pixels / 850 ms to give us ~0.0588
         * pixels per millisecond.
         *
         * We can get this value by doing ~26.5% of 0.222
         * which gives us ~0.0588. Most tiles will use 26.5
         * as their set thickness.
         *
         * @type {number}
         */
        this.defaultSpeed = 0.222;

        /**
         * The speed at which this player will move at.
         * Calculated by pixels per millisecond.
         * @type {number}
         */
        this.speed = this.defaultSpeed;

        /**
         * How much to muliply the player's speed.
         * Can be used for upgrades. Does not affect non-digging speed.
         * @type {number}
         */
        this.speedMultiplier = 1;

        /**
         * Whether or not to run the tick event.
         * @type {boolean}
         */
        this.tickEnabled = true;

        /**
         * Whether or not the player has the ability to move.
         */
        this.canMove = true;

        /**
         * Whether or not the player is currently moving from one tile to the next.
         * @type {boolean}
         */
        this.moving = false;

        /**
         * A one-tick delay of {@link moving} to
         * prevent a flickering of sprites on a
         * continuous movement rollover.
         */
        this.wasMoving = false;

        /**
         * A boolean that is set to true for one tick
         * to prevent a flickering of sprites on a
         * continuous movement rollover.
         */
        this.isStopping = false;

        /**
         * The pixel position of the player before actual movement.
         * Determines where the player is about to actually move to.
         * @type {Object.<number, number>}
         */
        this.targetPos = { x: this.x, y: this.y };

        /**
         * The grid position of the player after actual movement.
         * @type {Tile}
         */
        this.tile = this.grid.getTilePositionFromPixelPosition(this.x, this.y);

        /**
         * The grid position of the next block the player is about to mine.
         * Only updated while mining.
         * @type {Tile}
         */
        this.minetile = null;

        /**
         * How much money the player has.
         * @type {number}
         */
        this.money = 300;

        /**
         * The amount of ticks required before the player can enter a maptile.
         * Creates a sort of "push force" feeling.
         * @type {number}
         */
        this.chargeReq = 20;

        /**
         * How many more ticks we're waiting for before it mines.
         * @type {number}
         */
        this.charge = 0;

        /**
         * How many litres this tank holds.
         * @type {number}
         */
        this.maxFuel = 10;

        /**
         * Which upgrade level the fuel tank is at.
         */
        this.tank = 0;

        /**
         * How much fuel the player has left.
         * @type {number}
         */
        this.fuel = this.maxFuel * (this.tank / 2 + 1);

        /**
         * Used to prevent multiple calls when out of fuel.
         * @type {boolean}
         */
        this.fuelDebounce = false;

        /**
         * Initiate sprite sheet.
         * @type {createjs.SpriteSheet}
         */
        this.spriteSheet = this.game.loadingHandler.sprites.player;

        /**
         * A map of direction values to direction strings.
         * Index: 0, 1, 2, 3 matches {@link Direction}
         */
        this.dirstrs = ["up", "down", "left", "right"];

        /**
         * The current direction the player is facing. Notably,
         * the player may not be fully seated in the next tile
         * they are moving to when this is updated. This is
         * updated when a movement is initiated, but may not
         * contain the direction a player is moving.
         * @type {Player.Direction}
         */
        this.facingDirection = Player.Direction.RIGHT;

        /**
         * Drill! :)
         * @type {import("./PlayerDrill.js")}
         */
        this.drill = new PlayerDrill(game, this);

        /**
         * Boost! :)
         * @type {import("./PlayerBoost.js")}
         */
        this.boost = new PlayerBoost(game, this);

        /**
         * Cargo Hold! :)
         * @type {import("./PlayerHold.js")}
         */
        this.hold = new PlayerHold(game, this);

        /**
         * Animation Handler
         * @type {import("./PlayerAnim.js")}
         */
        this.anim = new PlayerAnim(game, this);

        /**
         * Set the initial position for the player.
         */
        this.resetPos();

        // Add player to game and bind tick event
        this.game.addChild(this);
        this.game.update();
        createjs.Ticker.addEventListener("tick", this.tick.bind(this));
    }

    tick(event) {
        if (!this.tickEnabled) return;

        // Check for out of fuel
        if (this.fuel <= 0) {
            return this.outOfFuel();
        }

        // If we're not currently moving, check if we can move
        // Otherwise, perform the movement
        if (!this.moving && this.canMove) {
            const direction = this.checkDirection();
            if (direction != null) {
                // Get maptile
                let tileGx = this.tile.gX;
                let tileGy = this.tile.gY;
                if (direction == Player.Direction.UP) {
                    tileGy -= 1;
                } else if (direction == Player.Direction.DOWN) {
                    tileGy += 1;
                } else if (direction == Player.Direction.LEFT) {
                    tileGx -= 1;
                } else if (direction == Player.Direction.RIGHT) {
                    tileGx += 1;
                }
                const maptile = this.map.fg_tiles[new Tile(tileGx, tileGy).toString()];

                // Update direction
                this.facingDirection = direction;
                this.gotoAndPlay(this.dirstrs[direction]);
                this.drill.updateDirection(this.dirstrs[direction]);
                this.boost.updateDirection(this.dirstrs[direction]);

                // Charge up and prepare movement
                this.kpCharge(maptile, () => {
                    // Get target position
                    const tileSize = this.grid.tileSize;
                    if (direction == Player.Direction.UP) {
                        let targetY = this.targetPos.y - tileSize;
                        if (targetY < this.map.horizonLine - tileSize) {
                            targetY = this.map.horizonLine - tileSize;
                        }
                        this.targetPos.y = targetY;
                    } else if (direction == Player.Direction.DOWN) {
                        let targetY = this.targetPos.y + tileSize;
                        const limit = this.grid.borders.bottom - tileSize;
                        if (targetY > limit) {
                            targetY = limit;
                        }
                        this.targetPos.y = targetY;
                    } else if (direction == Player.Direction.LEFT) {
                        let targetX = this.targetPos.x - tileSize;
                        const limit = this.grid.borders.left;
                        if (targetX < limit) {
                            targetX = limit;
                        }
                        this.targetPos.x = targetX;
                    } else if (direction == Player.Direction.RIGHT) {
                        let targetX = this.targetPos.x + tileSize;
                        const limit = this.grid.borders.right - tileSize;
                        if (targetX > limit) {
                            targetX = limit;
                        }
                        this.targetPos.x = targetX;
                    }

                    // Check if our trget position is the same as our current position
                    if (this.targetPos.x == this.x && this.targetPos.y == this.y) {
                        return;
                    }

                    // Set us moving to true
                    this.moving = true;
                    this.isStopping = false;

                    // Calculate movement speed and update minetile
                    if (maptile != null) {
                        this.speed = (maptile.properties.thickness / 100) * (this.defaultSpeed * this.speedMultiplier);
                        this.minetile = maptile;
                    } else if (this.speed != this.defaultSpeed) {
                        this.speed = this.defaultSpeed;
                        this.minetile = maptile;
                    }
                });
            } else {
                // Reset charge if no buttons being pressed
                if (this.charge > 0) {
                    this.charge = 0;
                }

                // Perform an extra update on stops
                if (this.isStopping) {
                    this.isStopping = false;
                    this.drill.updatePos();
                    this.boost.updatePos();
                }
            }
        }

        // This is not an else-if because we want the player to continue moving if they
        // continue holding the button, and to prevent a "click" into place.
        if (this.moving) {
            // Perform animation
            this.anim.onAnimate(this.minetile);

            // Reduce fuel level
            if (this.fuel <= 0) {
                return this.outOfFuel();
            } else if (this.y > this.map.horizonLine - this.map.grid.tileSize + 5) {
                /**
                 * To calculate the fuel loss, the original game
                 * used the arbitrary values of "0.1" when mining
                 * a tile and "0.07" for movement underground
                 * without mining. These values, I assume, are
                 * tied to the framerate (or tickrate) of the
                 * original game.
                 *
                 * To calculate the fuel loss, the original game
                 * used arbitrary values. I measured that you can
                 * go 60 tiles with your base-game tank. I am going
                 * to assign the base-game tank as "10" litres.
                 * It takes 51000 ms to mine 60 tiles. So, it takes
                 * 1/5100 liters per millisecond.
                 *
                 * It takes approximately 70000 ms to use 10 litres
                 * without mining, which would be 1/7000 litres per
                 * millisecond.
                 */
                if (this.minetile) {
                    this.updateFuel(-(1 / 5100) * event.delta);
                } else {
                    this.updateFuel(-(1 / 7000) * event.delta);
                }
            }

            // Perform the movement
            if (this.targetPos.x != this.x || this.targetPos.y != this.y) {
                const diff = this.speed * event.delta;
                if (this.facingDirection == Player.Direction.UP) {
                    let moveY = this.y - diff;
                    if (moveY < this.targetPos.y) {
                        moveY = this.targetPos.y;
                    }
                    this.y = moveY;
                } else if (this.facingDirection == Player.Direction.DOWN) {
                    let moveY = this.y + diff;
                    if (moveY > this.targetPos.y) {
                        moveY = this.targetPos.y;
                    }
                    this.y = moveY;
                } else if (this.facingDirection == Player.Direction.LEFT) {
                    let moveX = this.x - diff;
                    if (moveX < this.targetPos.x) {
                        moveX = this.targetPos.x;
                    }
                    this.x = moveX;
                } else if (this.facingDirection == Player.Direction.RIGHT) {
                    let moveX = this.x + diff;
                    if (moveX > this.targetPos.x) {
                        moveX = this.targetPos.x;
                    }
                    this.x = moveX;
                }
            }

            // TEMPORARY HTML UPDATING //
            const depth = Math.round(((this.y / this.grid.tileSize) - 7) * 5);
            document.getElementById("depth").innerHTML = "Depth: " + depth + " meters";
            // END TEMPORARY HTML UPDATING

            // Check for movement completion
if (
    (this.facingDirection == Player.Direction.UP && this.y <= this.targetPos.y) ||
    (this.facingDirection == Player.Direction.DOWN && this.y >= this.targetPos.y) ||
    (this.facingDirection == Player.Direction.LEFT && this.x <= this.targetPos.x) ||
    (this.facingDirection == Player.Direction.RIGHT && this.x >= this.targetPos.x)
) {
    // Snap to position, just in case the previous code didn't for some weird obscure reason
    this.x = this.targetPos.x;
    this.y = this.targetPos.y;

    // Potentially stop moving since we arrived at our position
    this.moving = false;
    this.isStopping = true;

    // Fetch tile and maptile from the position we moved to
    this.tile = this.grid.getTilePositionFromPixelPosition(this.x, this.y);
    const maptile = this.map.fg_tiles[this.tile.toString()];
    
    // Check if this is a building (interactable tile)
    if (maptile && maptile.properties.interactable) {
        // Don't mine buildings, just dispatch the move event for interaction
        this.dispatchEvent(new CustomEvent("tilemove", { detail: this.tile }));
    } else if (maptile && !maptile.properties.interactable) {
        // Regular mining behavior for non-building tiles
        this.hold.addMapTile(maptile);
        this.map.tiles.removeChild(maptile);
        delete this.map.fg_tiles[this.tile.toString()];
        this.map.tiles.updateCache();
        this.dispatchEvent(new CustomEvent("tiledestroy", { detail: this.tile }));
        this.minetile = null;
        
        // Dispatch tilemove for regular tiles too
        this.dispatchEvent(new CustomEvent("tilemove", { detail: this.tile }));
    } else {
        // No tile at this position, just dispatch move event
        this.dispatchEvent(new CustomEvent("tilemove", { detail: this.tile }));
    }
}

            // Perform UI updates on player modules
            this.drill.updatePos();
            this.boost.updatePos();
        }

        // Update this.isMoving
        if (this.wasMoving != this.moving) {
            this.wasMoving = this.moving;
        }
    }

    /**
     * Checks if a movement key is being pressed.
     * @returns {Player.Direction} `null` if no key is pressed, otherwise returns the direction accordingly.
     */
    checkDirection() {
        const pressedKeys = this.game.inputHandler.pressedKeys;
        if (pressedKeys.indexOf("ArrowUp") != -1 || pressedKeys.indexOf("w") != -1) {
            return Player.Direction.UP;
        } else if (pressedKeys.indexOf("ArrowDown") != -1 || pressedKeys.indexOf("s") != -1) {
            return Player.Direction.DOWN;
        } else if (pressedKeys.indexOf("ArrowLeft") != -1 || pressedKeys.indexOf("a") != -1) {
            return Player.Direction.LEFT;
        } else if (pressedKeys.indexOf("ArrowRight") != -1 || pressedKeys.indexOf("d") != -1) {
            return Player.Direction.RIGHT;
        } else {
            return null;
        }
    }

    /**
     * Handles "charging" the player up to mine a tile on every keypress.
     *
     * @param {MapTile} maptile The maptile.
     * @param {CallableFunction} logic The logic for this keypress.
     */
    kpCharge(maptile, logic) {
        if (!maptile || this.charge > this.chargeReq) {
            logic();
        }
        if (this.charge <= this.chargeReq) this.charge++;
    }

    /**
     * Updates the amount of fuel the player has.
     */
    updateFuel(amount) {
        this.fuel += amount;
        document.getElementById("fuel").innerHTML = `Fuel Left: ${Math.max(Math.ceil((this.fuel / this.maxFuel) * 10000) / 100, 0).toFixed(2)}%`;
    }

    /**
     * Event for when the player has run out of fuel.
     */
    outOfFuel() {
        if (this.fuelDebounce) return;
        this.fuelDebounce = true;
        this.canMove = false;
        this.moving = false;
        console.warn("PLAYER OUT OF FUEL, RECHARGING!");

        // Fade out
        this.game.displayHandler.fade(true, () => {
            // Move player and reset statistics
            const depth = Math.round(((this.y / this.grid.tileSize) - 7) * 5);
            this.fuel = this.maxFuel;
            this.updateFuel(0);
            this.money -= depth + this.maxFuel;
            // TEMPORARY HTML UPDATING //
            document.getElementById("depth").innerHTML = "Depth: " + depth + " meters";
            document.getElementById("money").innerHTML = "Money: $" + this.money;
            // END TEMPORARY HTML UPDATING
            this.resetPos();

            // Delay for dramatic effect
            setTimeout(() => {
                // Fade in
                this.game.displayHandler.fade(false, () => {
                    console.log("FUEL RECHARGE COMPLETE");
                    this.fuelDebounce = false;
                    this.canMove = true;
                });
            }, 1000);
        });
    }

    /**
     * Resets the player to the initial position.
     */
    resetPos() {
        this.x = Math.round((this.grid.widthGU * this.grid.tileSize) / 2);
        this.y = this.map.horizonLine - this.grid.tileSize;
        this.tile = this.grid.getTilePositionFromPixelPosition(this.x, this.y);
        this.targetPos = { x: this.x, y: this.y };
        const direction = Player.Direction.RIGHT;
        this.facingDirection = direction;
        this.gotoAndPlay(this.dirstrs[direction]);
        this.wasMoving = false;
        this.isStopping = false;
        if (this.drill) {
            this.drill.updateDirection(this.dirstrs[direction]);
            this.drill.updatePos();
        }
        if (this.boost) {
            this.boost.updateDirection(this.dirstrs[direction]);
            this.boost.updatePos();
        }
    }

    /**
     * Gets the MapTile that is below the player by 1 GU.
     * @returns {MapTile}
     */
    getTileBelow() {
        this.map.fg_tiles.get();
    }

    /**
     * Brings this player to the front of the screen. Used for relayering.
     */
    bringToFront() {
        this.game.setChildIndex(this, this.game.children.length - 1);
    }

    get xCenter() {
        return this.x + (this.grid.tileSize / 2);
    }

    get yCenter() {
        return this.y + (this.grid.tileSize / 2);
    }
}

/**
 * Determines the current direction.
 * @readonly
 * @enum {number}
 */
Player.Direction = {
    UP: 0,
    DOWN: 1,
    LEFT: 2,
    RIGHT: 3
};

module.exports = Player;