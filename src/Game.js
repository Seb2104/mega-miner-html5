// Add this to the bottom of your Game.js file, replacing the existing window.onload

window.onload = function() {
    console.log("Window loaded, initializing game...");
    
    try {
        const pkg = require("../package.json");
        let rev = "dev";
        
        try {
            const fs = require("fs");
            rev = fs.readFileSync(".git/refs/heads/master").toString().substring(0, 7).trim();
        } catch (e) {
            console.log("No git info available, using 'dev'");
        }
        
        document.getElementById("version").innerHTML = `Version ${pkg.version}.${rev}`;
        
        // Create and initiate the game
        console.log("Creating game instance...");
        window.game = new Game();
        window.game.fpsElement = document.getElementById("fps");
        
        console.log("Game instance created successfully!");
        
        // Add error handling for the game
        window.addEventListener('error', function(e) {
            console.error('Game error:', e.error);
            
            // Try to show a user-friendly error message
            const errorDiv = document.createElement('div');
            errorDiv.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: rgba(255, 0, 0, 0.9);
                color: white;
                padding: 20px;
                border-radius: 10px;
                font-family: Arial, sans-serif;
                z-index: 1000;
                max-width: 400px;
                text-align: center;
            `;
            errorDiv.innerHTML = `
                <h3>Game Error</h3>
                <p>Something went wrong. Check the console for details.</p>
                <p><strong>Error:</strong> ${e.error.message}</p>
                <button onclick="location.reload()" style="
                    background: white;
                    color: red;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 5px;
                    cursor: pointer;
                    margin-top: 10px;
                ">Reload Game</button>
            `;
            document.body.appendChild(errorDiv);
        });
        
    } catch (error) {
        console.error("Failed to initialize game:", error);
        
        // Show error message to user
        document.body.innerHTML = `
            <div style="
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: rgba(255, 0, 0, 0.9);
                color: white;
                padding: 20px;
                border-radius: 10px;
                font-family: Arial, sans-serif;
                text-align: center;
            ">
                <h2>Game Failed to Load</h2>
                <p>Error: ${error.message}</p>
                <p>Check the console for more details.</p>
                <button onclick="location.reload()" style="
                    background: white;
                    color: red;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 5px;
                    cursor: pointer;
                    margin-top: 10px;
                ">Try Again</button>
            </div>
        `;
    }
};