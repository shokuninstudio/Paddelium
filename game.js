const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Update canvas size and add border
canvas.width = 800;  // Reduced from 1200
canvas.height = 400;
canvas.style.border = '1px solid black';

// Game objects
const ball = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    size: 15,  // now represents both width and height of square
    speed: 5,
    dx: 5,
    dy: 0,
    attached: true  // Start attached
};

const paddleHeight = 80;
const paddleWidth = 15;
const playerPaddle = {
    x: 50,            // Reduced from 80
    y: canvas.height / 2 - paddleHeight / 2,
    width: paddleWidth,
    height: paddleHeight,
    speed: 8,
    dy: 0,
    isStunned: false,
    stunEndTime: 0,  // Replace stunTimer with stunEndTime
    isStretched: false,
    stretchEndTime: 0,  // Add new property for stretch timeout
    currentHeight: paddleHeight,  // Add this line
    targetHeight: paddleHeight,   // Add this line
    isExploding: false,  // Add this line
    explosionStartTime: 0  // Add this line
};

const computerPaddle = {
    x: canvas.width - 50 - paddleWidth,  // Adjusted for new width (was canvas.width - 80 - paddleWidth)
    y: canvas.height / 2 - paddleHeight / 2,
    width: paddleWidth,
    height: paddleHeight,
    speed: 5,
    dy: 0,
    isStunned: false,
    stunEndTime: 0,  // Replace stunTimer with stunEndTime
    isStretched: false,
    stretchEndTime: 0,  // Add new property for stretch timeout
    currentHeight: paddleHeight,  // Add this line
    targetHeight: paddleHeight   // Add this line
};

let playerScore = 0;
let computerScore = 0;

// Update brick type definitions to include YELLOW again
const BrickTypes = {
    MAGENTA: { color: '#ff00ff', health: 1 },
    BLUE: { color: '#0099ff', health: 1 },
    RED: { color: '#ff3333', health: 1 },
    GREEN: { color: '#33ff33', health: 1 },
    GREY: { color: '#999999', health: 3 },
    YELLOW: { color: '#ffff00', health: 1 },
    ORANGE: { color: '#ff8c00', health: 1 }  // Add orange brick type
};

// Update brick configuration
const brickConfig = {
    columns: 5,
    rows: 9,
    width: 20,
    height: 40,
    padding: 2,
    offsetTop: canvas.height / 2 - 190,
    offsetLeft: canvas.width / 2 - 55  // This should still work with new width
};

// Add serving state variables
let isServing = true;
let serverPaddle = playerPaddle;  // Start with player serving

// Update bullet object with new dimensions, color property, and trail properties
const bullet = {
    x1: 0,
    y1: 0,
    x2: 0,
    y2: 0,
    width: 12,    // Increased from 8
    height: 6,    // Increased from 4
    speed: 15,
    active: false,
    trail: [],
    color: '#ff0000',  // Default to red
    isBeam: false,     // New property to identify blue laser beam
    beamTrail: []      // Add new property for blue beam trail
};

// Update player/computer shot variables
let playerShotsAvailable = 0;
let computerShotsAvailable = 0;
const MAX_SHOTS = 3;

// Update audio context setup
let audioContext;

// Add paddle trail arrays at the top with other game objects
const playerTrail = [];
const computerTrail = [];
const TRAIL_LENGTH = 50; // Length of trail in pixels

// Add ball trail array at the top with other game objects
const ballTrail = [];

// Add at the top with other constants
const backgrounds = [];
const backgroundImages = ['backgrounds/background1.jpg', 'backgrounds/background2.jpg', 'backgrounds/background3.jpg', 'backgrounds/background4.jpg', 'backgrounds/background5.jpg', 'backgrounds/background6.jpg'];
let currentBackground;

// Add at the top with other game variables
const MAX_LIVES = 5;
let playerLives = 3;

// Add at the top with other game objects
const player1Image = new Image();
player1Image.src = 'sprites/player1.png';
const player2Image = new Image();
player2Image.src = 'sprites/player2.png';

// Add at the top with other game objects (near player1Image and player2Image)
const ballImage = new Image();
ballImage.src = 'sprites/ball.png';

// Add near the other image declarations at the top
const explosionImage = new Image();
explosionImage.src = 'sprites/explosion1.png';
const explosion2Image = new Image();
explosion2Image.src = 'sprites/explosion2.png';

// Add at the top with other game variables
let isPaused = false;
let winMessage = '';
let overlayTimer = 0;
const OVERLAY_DURATION = 120; // 2 seconds at 60fps

// Add at the top with other game variables
const pixelFont = new FontFace('PressStart2P', 'url(https://fonts.gstatic.com/s/pressstart2p/v15/e3t4euO8T-267oIAQAu6jDQyK3nVivM.woff2)');

// Add at the top with other game variables
let isGameOver = false;

// Add at the top with other game variables
let waitingForNewGame = false;

// Add at the top with other game variables
let gameLoopRunning = false;

// Add at the top with other game variables
let showStartPrompt = true;

// Add at the top with other game variables
const ballSound = new Audio('sounds/ball.wav');

// Add at the top with other game variables
const brickSound = new Audio('sounds/brick.wav');

// Add at the top with other game variables
const soundtrack = new Audio('sounds/soundtrack.mp3');
soundtrack.loop = true;
soundtrack.volume = 0.1;  // Set volume to 10%

// Add at the top with other game variables
const LAST_HIT = {
    PLAYER: 'player',
    COMPUTER: 'computer'
};
let lastHitBy = LAST_HIT.PLAYER;  // Start with player since they serve first

// Add at the top with other game variables
const STUN_ANIMATION = {
    points: 8,  // Number of zigzag points
    amplitude: 3,  // Size of zigzag
    frequency: 0.2,  // Speed of animation
    offset: 0  // Current animation offset
};

// Add near other sound-related variables at the top
let stunSoundNodes = {
    player: null,
    computer: null
};

// Add at the top with other game variables
let gameRules = [
    "RULES:",
    "Clear the bricks or shoot your opponent with the red laser to win the game. The blue laser will stun your opponent for three seconds.",
    "",
    "Try not to shoot red or blue bricks. Those have valuable power-ups that will help you win the game.",
    "",
    "Win a round and you gain a life (maximum 5 lives).",
    "Lose a round and you lose a life. Lose all your lives and it's game over."
];

// Add at the top with other game variables
let isMouseControlActive = false;
let mouseY = 0;

// Add function to preload backgrounds
function loadBackgrounds() {
    backgroundImages.forEach(imgSrc => {
        const img = new Image();
        img.src = imgSrc;
        backgrounds.push(img);
    });
}

// Add function to select random background
function selectRandomBackground() {
    const randomIndex = Math.floor(Math.random() * backgrounds.length);
    currentBackground = backgrounds[randomIndex];
}

// Update the audio initialization function
function initAudio() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    
    // Set initial volume for all audio elements
    const volume = 0.3;
    ballSound.volume = volume;
    brickSound.volume = volume;
    soundtrack.volume = 0.1;  // Keep soundtrack quieter
    
    if (audioContext.state === 'suspended') {
        audioContext.resume();
    }
}

// Update the keydown event listener to handle all space bar actions
document.addEventListener('keydown', (e) => {
    if (e.key === ' ') {
        if (showStartPrompt) {
            // First game start
            showStartPrompt = false;
            initAudio();
            startGame();
            return;
        }
        
        if (waitingForNewGame) {
            // Start new game after game over
            waitingForNewGame = false;
            isGameOver = false;
            isPaused = false;
            playerLives = 3;
            playerScore = 0;
            computerScore = 0;
            document.getElementById('gameOverMessage').style.display = 'none';
            serverPaddle = playerPaddle;
            updateLives();
            updateScore();
            resetBall();
            createBricks();
            manageSoundtrack();  // Add this to start the soundtrack in new game
            return;
        }
        
        // Handle shooting first, before serving
        if (playerShotsAvailable > 0 && !bullet.active) {
            console.log('Attempting to shoot');
            console.log('Shots available:', playerShotsAvailable);
            console.log('Bullet active:', bullet.active);
            const isBlueBeam = bullet.color === '#0099ff';
            createLaserSound(isBlueBeam);
            bullet.isBeam = isBlueBeam;
            if (bullet.isBeam) {
                // Create brick-height blue laser beam
                bullet.x1 = playerPaddle.x + playerPaddle.width;
                bullet.y1 = playerPaddle.y + (paddleHeight/2) - (brickConfig.height/2);
                bullet.x2 = playerPaddle.x + playerPaddle.width;
                bullet.y2 = playerPaddle.y + (paddleHeight/2) + (brickConfig.height/2);
            } else {
                // Regular red laser shots
                bullet.x1 = playerPaddle.x + playerPaddle.width;
                bullet.y1 = playerPaddle.y + paddleHeight/3;
                bullet.x2 = playerPaddle.x + playerPaddle.width;
                bullet.y2 = playerPaddle.y + (paddleHeight * 2/3);
            }
            bullet.active = true;
            bullet.speed = Math.abs(bullet.speed);
            bullet.trail = [];
            playerShotsAvailable--;
            return;  // Return here to prevent serving
        }
        
        // Handle serving only if not shooting
        if (isServing && serverPaddle === playerPaddle) {
            // Serve the ball
            isServing = false;
            ball.attached = false;
            ball.dx = 5;
            ball.dy = (Math.random() * 6 - 3);
        }
    } else if (e.key === 'ArrowUp') {
        playerPaddle.dy = -playerPaddle.speed;
    } else if (e.key === 'ArrowDown') {
        playerPaddle.dy = playerPaddle.speed;
    } else if (e.key === 'Escape') {
        // Toggle pause state, but only if not in other special states
        if (!isGameOver && !waitingForNewGame && !showStartPrompt) {
            isPaused = !isPaused;
            manageSoundtrack(); // Pause/resume soundtrack
        }
    }
});

// Add keyup event listener back to stop paddle movement
document.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        playerPaddle.dy = 0;
    }
});

// Draw functions
function drawBall() {
    // Draw motion trail only if ball is in play (not attached/serving)
    if (!ball.attached && (Math.abs(ball.dx) > 0 || Math.abs(ball.dy) > 0)) {
        // Add current position to trail
        ballTrail.unshift({ x: ball.x, y: ball.y });
        
        // Limit trail length
        while (ballTrail.length > TRAIL_LENGTH) {
            ballTrail.pop();
        }
        
        // Draw trail with extremely faint opacity
        for (let i = 0; i < ballTrail.length; i++) {
            const opacity = (1 - i / TRAIL_LENGTH) * 0.02;
            ctx.globalAlpha = opacity;
            ctx.drawImage(
                ballImage,
                ballTrail[i].x - ball.size/2,
                ballTrail[i].y - ball.size/2,
                ball.size,
                ball.size
            );
        }
        ctx.globalAlpha = 1.0;
    } else {
        // Clear trail when ball stops or is attached
        ballTrail.length = 0;
    }
    
    // Draw actual ball
    ctx.drawImage(
        ballImage,
        ball.x - ball.size/2,
        ball.y - ball.size/2,
        ball.size,
        ball.size
    );
}

// Add these constants at the top with other constants
const STRETCH_ANIMATION_DURATION = 500; // milliseconds
const STRETCH_MULTIPLIER = 1.25;

// Update drawPaddle function
function drawPaddle(paddle, trail, image) {
    // If exploding, draw explosion centered on paddle position
    if (paddle.isExploding) {
        const explosionWidth = 50; // Width of explosion gifs
        const explosionHeight = 80; // Height of explosion gifs
        // Center the explosion on the paddle
        const explosionX = paddle.x - (explosionWidth - paddleWidth) / 2;
        const explosionY = paddle.y - (explosionHeight - paddleHeight) / 2;
        
        // Use different explosion image for each paddle
        const explosionImg = (paddle === playerPaddle) ? explosionImage : explosion2Image;
        ctx.drawImage(explosionImg, explosionX, explosionY, explosionWidth, explosionHeight);
        return;
    }

    // Animate paddle height
    const delta = (paddle.targetHeight - paddle.currentHeight) * 0.1;
    if (Math.abs(delta) > 0.1) {
        paddle.currentHeight += delta;
    }

    // Draw motion trail with current height
    if (Math.abs(paddle.dy) > 0) {
        // Add current position to trail
        trail.unshift({ y: paddle.y });
        
        // Limit trail length
        while (trail.length > TRAIL_LENGTH) {
            trail.pop();
        }
        
        // Draw trail with extremely faint opacity
        for (let i = 0; i < trail.length; i++) {
            const opacity = (1 - i / TRAIL_LENGTH) * 0.02;
            ctx.globalAlpha = opacity;
            ctx.drawImage(image, paddle.x, trail[i].y, paddle.width, paddle.currentHeight);
        }
        ctx.globalAlpha = 1.0;
    } else {
        // Clear trail when paddle stops
        trail.length = 0;
    }
    
    // Draw actual paddle with current height
    ctx.drawImage(image, paddle.x, paddle.y, paddle.width, paddle.currentHeight);

    // Draw stun effect if paddle is stunned
    if (paddle.isStunned) {
        ctx.strokeStyle = '#0099ff';
        ctx.lineWidth = 2;
        ctx.shadowColor = '#0099ff';
        ctx.shadowBlur = 15;
        
        // Draw electric outline
        ctx.beginPath();
        drawElectricBorder(
            paddle.x - 2, 
            paddle.y - 2, 
            paddle.width + 4, 
            paddle.currentHeight + 4
        );
        ctx.stroke();
        ctx.shadowBlur = 0;
    }
}

// Add new function for drawing electric border
function drawElectricBorder(x, y, width, height) {
    // Update animation offset
    STUN_ANIMATION.offset += STUN_ANIMATION.frequency;
    
    // Draw top edge
    let progress = 0;
    while (progress < width) {
        const xOffset = progress;
        const yOffset = Math.sin(progress * 0.9 + STUN_ANIMATION.offset) * STUN_ANIMATION.amplitude;
        if (progress === 0) {
            ctx.moveTo(x + xOffset, y + yOffset);
        } else {
            ctx.lineTo(x + xOffset, y + yOffset);
        }
        progress += width / STUN_ANIMATION.points;
    }

    // Draw right edge
    progress = 0;
    while (progress < height) {
        const xOffset = Math.sin(progress * 0.9 + STUN_ANIMATION.offset) * STUN_ANIMATION.amplitude;
        const yOffset = progress;
        ctx.lineTo(x + width + xOffset, y + yOffset);
        progress += height / STUN_ANIMATION.points;
    }

    // Draw bottom edge
    progress = width;
    while (progress > 0) {
        const xOffset = progress;
        const yOffset = Math.sin(progress * 0.9 + STUN_ANIMATION.offset) * STUN_ANIMATION.amplitude;
        ctx.lineTo(x + xOffset, y + height + yOffset);
        progress -= width / STUN_ANIMATION.points;
    }

    // Draw left edge
    progress = height;
    while (progress > 0) {
        const xOffset = Math.sin(progress * 0.9 + STUN_ANIMATION.offset) * STUN_ANIMATION.amplitude;
        const yOffset = progress;
        ctx.lineTo(x + xOffset, y + yOffset);
        progress -= height / STUN_ANIMATION.points;
    }

    ctx.closePath();
}

function updateScore() {
    document.getElementById('playerScore').textContent = playerScore;
    document.getElementById('computerScore').textContent = computerScore;
}

// Call updateScore initially to ensure 0-0 display
updateScore();

// Game logic
function moveComputerPaddle() {
    if (computerPaddle.isStunned) {
        if (Date.now() >= computerPaddle.stunEndTime) {
            computerPaddle.isStunned = false;
        }
        return;  // Don't move while stunned
    }

    // Check for stretch timeout
    if (computerPaddle.isStretched && Date.now() >= computerPaddle.stretchEndTime) {
        setPaddleStretch(computerPaddle, false);
    }

    const paddleCenter = computerPaddle.y + computerPaddle.height / 2;
    const ballCenter = ball.y;
    let targetY = paddleCenter;
    
    // Store previous position to calculate dy
    const previousY = computerPaddle.y;

    // Check for incoming bullets
    if (bullet.active && bullet.speed > 0) {  // Bullet moving towards computer
        const bulletY1 = bullet.y1;
        const bulletY2 = bullet.y2;
        const bulletX = bullet.x1;  // Both bullets have same x
        const timeToImpact = (computerPaddle.x - bulletX) / bullet.speed;
        
        // If bullet will arrive soon, try to dodge
        if (timeToImpact > 0 && timeToImpact < 30) {
            // Find safe spot (middle between bullets or above/below them)
            const middleGap = Math.abs(bulletY2 - bulletY1);
            if (middleGap > paddleHeight * 1.2) {
                // Try to move to the gap between bullets
                targetY = (bulletY1 + bulletY2) / 2;
            } else if (bulletY1 < canvas.height/2) {
                // Both bullets in upper half, move down
                targetY = Math.min(canvas.height - paddleHeight, bulletY2 + paddleHeight);
            } else {
                // Both bullets in lower half, move up
                targetY = Math.max(0, bulletY1 - paddleHeight);
            }
        }
    } else {
        // Normal ball tracking
        targetY = ballCenter;
    }

    // Move towards target
    if (paddleCenter < targetY - 10) {
        computerPaddle.y += computerPaddle.speed;
    } else if (paddleCenter > targetY + 10) {
        computerPaddle.y -= computerPaddle.speed;
    }

    // Calculate and set dy based on actual movement
    computerPaddle.dy = computerPaddle.y - previousY;

    // Keep paddle within bounds, accounting for stretched state
    const actualHeight = computerPaddle.isStretched ? paddleHeight * 1.25 : paddleHeight;
    if (computerPaddle.y < 0) {
        computerPaddle.y = 0;
        computerPaddle.dy = 0;
    } else if (computerPaddle.y + actualHeight > canvas.height) {
        computerPaddle.y = canvas.height - actualHeight;
        computerPaddle.dy = 0;
    }

    // Computer shooting logic
    if (computerShotsAvailable > 0 && !bullet.active && Math.random() < 0.02) {
        const isBlueBeam = bullet.color === '#0099ff';
        createLaserSound(isBlueBeam);
        bullet.isBeam = isBlueBeam;
        if (bullet.isBeam) {
            // Create brick-height blue laser beam
            bullet.x1 = computerPaddle.x;
            bullet.y1 = computerPaddle.y + (paddleHeight/2) - (brickConfig.height/2);
            bullet.x2 = computerPaddle.x;
            bullet.y2 = computerPaddle.y + (paddleHeight/2) + (brickConfig.height/2);
        } else {
            // Regular red laser shots
            bullet.x1 = computerPaddle.x;
            bullet.y1 = computerPaddle.y + paddleHeight/3;
            bullet.x2 = computerPaddle.x;
            bullet.y2 = computerPaddle.y + (paddleHeight * 2/3);
        }
        bullet.active = true;
        bullet.speed = -Math.abs(bullet.speed);
        bullet.trail = [];
        computerShotsAvailable--;
    }
}

function moveBall() {
    if (isPaused) return;
    
    if (isServing) {
        // Keep ball attached to serving paddle
        if (serverPaddle === playerPaddle) {
            ball.x = playerPaddle.x + playerPaddle.width + ball.size/2;
            ball.y = playerPaddle.y + paddleHeight/2;
            
            // Only allow player to serve when they are the server
            if (isServing && ball.attached) {
                document.addEventListener('keydown', handleServe);
            }
        } else {
            // Computer serve
            ball.x = computerPaddle.x - ball.size/2;
            ball.y = computerPaddle.y + paddleHeight/2;
            
            // Auto-serve after a short delay for computer
            setTimeout(() => {
                if (isServing && ball.attached) {
                    isServing = false;
                    ball.attached = false;
                    ball.dx = -5;  // Serve towards player
                    ball.dy = (Math.random() * 6 - 3);
                }
            }, 1000);
        }
        return;
    }

    // Regular ball movement
    ball.x += ball.dx;
    ball.y += ball.dy;

    // Improved collision with top and bottom walls
    if (ball.y + ball.size/2 > canvas.height) {
        // Bottom wall collision
        ball.y = canvas.height - ball.size/2;  // Force ball back in bounds
        ball.dy *= -1;
        // Ensure ball doesn't get stuck at extreme angles
        if (Math.abs(ball.dy) > 10) {
            ball.dy = (ball.dy > 0) ? 10 : -10;
        }
    } else if (ball.y - ball.size/2 < 0) {
        // Top wall collision
        ball.y = ball.size/2;  // Force ball back in bounds
        ball.dy *= -1;
        // Ensure ball doesn't get stuck at extreme angles
        if (Math.abs(ball.dy) > 10) {
            ball.dy = (ball.dy > 0) ? 10 : -10;
        }
    }

    // Wall collisions
    if (ball.y + ball.size/2 > canvas.height || ball.y - ball.size/2 < 0) {
        // Play ball sound for wall hit
        ballSound.currentTime = 0;
        ballSound.play().catch(error => {
            console.error('Audio playback failed:', error);
        });
    }

    // Update brick collision logic
    let brickHit = false;
    const movingRight = ball.dx > 0;  // Store direction BEFORE collision
    
    for (let c = 0; c < brickConfig.columns && !brickHit; c++) {
        for (let r = 0; r < brickConfig.rows && !brickHit; r++) {
            let b = bricks[c][r];
            if (b.status === 1 && !brickHit) {
                if (ball.x + ball.size/2 > b.x &&
                    ball.x - ball.size/2 < b.x + b.width &&
                    ball.y + ball.size/2 > b.y &&
                    ball.y - ball.size/2 < b.y + b.height) {
                    
                    // Store who hit the ball before destroying brick
                    const hitByPlayer = lastHitBy === LAST_HIT.PLAYER;
                    
                    b.health--;
                    brickHit = true;
                    
                    // Play brick sound
                    brickSound.currentTime = 0;
                    brickSound.play().catch(error => {
                        console.error('Audio playback failed:', error);
                    });
                    
                    if (b.health <= 0) {
                        b.status = 0;
                        
                        // Handle orange brick power-up
                        if (b.type === BrickTypes.ORANGE) {
                            if (lastHitBy === LAST_HIT.PLAYER) {
                                // Reset laser power-ups if player gets stretch power-up
                                playerShotsAvailable = 0;
                                setPaddleStretch(playerPaddle, true);
                            } else {
                                // Reset laser power-ups if computer gets stretch power-up
                                computerShotsAvailable = 0;
                                setPaddleStretch(computerPaddle, true);
                            }
                        }
                        
                        // Grant shots based on brick type - FIXED LOGIC
                        if (b.type === BrickTypes.RED || b.type === BrickTypes.BLUE) {
                            if (hitByPlayer) {
                                // Reset stretch state if player gets laser power-up
                                if (playerPaddle.isStretched) {
                                    setPaddleStretch(playerPaddle, false);
                                }
                                
                                if (b.type === BrickTypes.RED) {
                                    playerShotsAvailable = 3;
                                    bullet.color = '#ff0000';
                                } else { // BLUE
                                    playerShotsAvailable = 1;
                                    bullet.color = '#0099ff';
                                }
                            } else {
                                // Reset stretch state if computer gets laser power-up
                                if (computerPaddle.isStretched) {
                                    setPaddleStretch(computerPaddle, false);
                                }
                                
                                if (b.type === BrickTypes.RED) {
                                    computerShotsAvailable = 3;
                                    bullet.color = '#ff0000';
                                } else { // BLUE
                                    computerShotsAvailable = 1;
                                    bullet.color = '#0099ff';
                                }
                            }
                        }
                        
                        // Check if this was the last brick
                        if (!checkRemainingBricks()) {
                            // Award point to the player who hit the ball last
                            if (hitByPlayer) {  // Player hit it last
                                playerScore += 1;
                                playerLives = Math.min(playerLives + 1, MAX_LIVES);
                                serverPaddle = playerPaddle;
                                showWinOverlay('PLAYER WINS');
                            } else {  // Computer hit it last
                                computerScore += 1;
                                playerLives--;
                                if (playerLives <= 0) {
                                    showGameOver();
                                    return;
                                }
                                serverPaddle = computerPaddle;
                                showWinOverlay('COMPUTER WINS');
                            }
                            resetBall();
                            createBricks();
                            updateLives();
                            updateScore();
                            return;
                        }
                    }
                    
                    // Change ball direction after determining winner
                    ball.dx *= -1;
                }
            }
        }
    }

    // Update paddle collision logic
    if (ball.dx < 0) {
        // Player paddle collision
        const playerActualHeight = playerPaddle.isStretched ? paddleHeight * 1.25 : paddleHeight;
        if (ball.x - ball.size/2 < playerPaddle.x + playerPaddle.width &&
            ball.x + ball.size/2 > playerPaddle.x &&
            ball.y + ball.size/2 > playerPaddle.y &&
            ball.y - ball.size/2 < playerPaddle.y + playerActualHeight) {
            
            ball.x = playerPaddle.x + playerPaddle.width + ball.size/2;
            ball.dx *= -1;
            lastHitBy = LAST_HIT.PLAYER;  // Update last hit
            
            // Play ball sound for paddle hit
            ballSound.currentTime = 0;
            ballSound.play().catch(error => {
                console.error('Audio playback failed:', error);
            });
            
            // Limit the angle of reflection
            const collisionPoint = (ball.y - (playerPaddle.y + playerActualHeight/2)) / (playerActualHeight/2);
            ball.dy = collisionPoint * 5;
        }
    } else {
        // Computer paddle collision
        const computerActualHeight = computerPaddle.isStretched ? paddleHeight * 1.25 : paddleHeight;
        if (ball.x + ball.size/2 > computerPaddle.x &&
            ball.x - ball.size/2 < computerPaddle.x + computerPaddle.width &&
            ball.y + ball.size/2 > computerPaddle.y &&
            ball.y - ball.size/2 < computerPaddle.y + computerActualHeight) {
            
            ball.x = computerPaddle.x - ball.size/2;
            ball.dx *= -1;
            lastHitBy = LAST_HIT.COMPUTER;  // Update last hit
            
            // Play ball sound for paddle hit
            ballSound.currentTime = 0;
            ballSound.play().catch(error => {
                console.error('Audio playback failed:', error);
            });
            
            // Limit the angle of reflection
            const collisionPoint = (ball.y - (computerPaddle.y + computerActualHeight/2)) / (computerActualHeight/2);
            ball.dy = collisionPoint * 5;
        }
    }

    // Update scoring to handle serves and lives
    if (ball.x + ball.size > canvas.width) {
        playerScore += 1;
        playerLives = Math.min(playerLives + 1, MAX_LIVES);
        serverPaddle = playerPaddle;
        showWinOverlay('PLAYER WINS');
        resetBall();
        createBricks();
        updateLives();
        updateScore();
    } else if (ball.x - ball.size < 0) {
        computerScore += 1;
        playerLives--;
        if (playerLives <= 0) {
            showGameOver();
            return;
        }
        serverPaddle = computerPaddle;
        showWinOverlay('COMPUTER WINS');
        resetBall();
        createBricks();
        updateLives();
        updateScore();
    }
}

function resetBall() {
    isServing = true;
    ball.attached = true;
    ball.dy = 0;
    
    // Set initial ball position and direction based on server
    if (serverPaddle === playerPaddle) {
        ball.x = playerPaddle.x + playerPaddle.width + ball.size/2;
        ball.y = playerPaddle.y + paddleHeight/2;
        ball.dx = 5;  // Will serve towards computer
    } else {
        ball.x = computerPaddle.x - ball.size/2;
        ball.y = computerPaddle.y + paddleHeight/2;
        ball.dx = -5;  // Will serve towards player
    }
    
    bullet.active = false;
    
    // Reset all player states for new round
    playerPaddle.isStretched = false;
    playerPaddle.stretchEndTime = 0;
    playerPaddle.isStunned = false;
    playerPaddle.stunEndTime = 0;
    playerPaddle.currentHeight = paddleHeight;  // Add this line
    playerPaddle.targetHeight = paddleHeight;   // Add this line
    
    computerPaddle.isStretched = false;
    computerPaddle.stretchEndTime = 0;
    computerPaddle.isStunned = false;
    computerPaddle.stunEndTime = 0;
    computerPaddle.currentHeight = paddleHeight;  // Add this line
    computerPaddle.targetHeight = paddleHeight;   // Add this line
    
    // Stop any active stun sounds
    if (stunSoundNodes.player) {
        stunSoundNodes.player.stop();
        stunSoundNodes.player = null;
    }
    if (stunSoundNodes.computer) {
        stunSoundNodes.computer.stop();
        stunSoundNodes.computer = null;
    }
    
    // Reset all power-ups for new round
    playerShotsAvailable = 0;
    computerShotsAvailable = 0;
    
    // Select new background for new round
    selectRandomBackground();
    // Only update score during regular play, not during game over
    if (!waitingForNewGame) {
        updateScore();
    }
    lastHitBy = serverPaddle === playerPaddle ? LAST_HIT.PLAYER : LAST_HIT.COMPUTER;
}

// Update movePlayerPaddle function to handle mouse control
function movePlayerPaddle() {
    if (playerPaddle.isStunned || playerPaddle.isExploding) {
        if (Date.now() >= playerPaddle.stunEndTime) {
            playerPaddle.isStunned = false;
        }
        return;  // Don't move while stunned or exploding
    }

    // Check for stretch timeout
    if (playerPaddle.isStretched && Date.now() >= playerPaddle.stretchEndTime) {
        setPaddleStretch(playerPaddle, false);
    }

    // Keyboard control (existing code)
    playerPaddle.y += playerPaddle.dy;

    // Keep paddle within canvas bounds, accounting for stretched state
    const actualHeight = playerPaddle.isStretched ? paddleHeight * 1.25 : paddleHeight;
    if (playerPaddle.y < 0) {
        playerPaddle.y = 0;
    } else if (playerPaddle.y + actualHeight > canvas.height) {
        playerPaddle.y = canvas.height - actualHeight;
    }
}

// Update brick drawing to show health of grey brick with 2px highlight
function drawBricks() {
    for (let c = 0; c < brickConfig.columns; c++) {
        for (let r = 0; r < brickConfig.rows; r++) {
            if (bricks[c][r].status === 1) {
                const brick = bricks[c][r];
                
                // Draw main brick color
                if (brick.type === BrickTypes.GREY) {
                    const shade = Math.floor(153 + (brick.health - 1) * 34);
                    ctx.fillStyle = `rgb(${shade},${shade},${shade})`;
                } else {
                    ctx.fillStyle = brick.type.color;
                }
                ctx.fillRect(
                    brick.x,
                    brick.y,
                    brick.width,
                    brick.height
                );

                // Add 2px highlight on top and left edges
                ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
                ctx.fillRect(brick.x, brick.y, brick.width, 1);  // top edge - now 2px
                ctx.fillRect(brick.x, brick.y, 1, brick.height); // left edge - now 2px
            }
        }
    }
}

// Update brick creation to use MAGENTA instead of YELLOW
function createBricks() {
    bricks = [];
    // Initialize empty grid
    for (let c = 0; c < brickConfig.columns; c++) {
        bricks[c] = [];
        for (let r = 0; r < brickConfig.rows; r++) {
            bricks[c][r] = {
                x: brickConfig.offsetLeft + c * (brickConfig.width + brickConfig.padding),
                y: brickConfig.offsetTop + r * (brickConfig.height + brickConfig.padding),
                width: brickConfig.width,
                height: brickConfig.height,
                status: 1,
                type: null,
                health: 0
            };
        }
    }

    // Add exactly 2 blue bricks in random positions (changed from 3)
    let blueBricksPlaced = 0;
    while (blueBricksPlaced < 2) {  // Changed from 3 to 2
        const c = Math.floor(Math.random() * brickConfig.columns);
        const r = Math.floor(Math.random() * brickConfig.rows);
        if (bricks[c][r].type === null) {
            bricks[c][r].type = BrickTypes.BLUE;
            bricks[c][r].health = BrickTypes.BLUE.health;
            blueBricksPlaced++;
        }
    }

    // Add exactly 3 red bricks in random positions
    let redBricksPlaced = 0;
    while (redBricksPlaced < 3) {
        const c = Math.floor(Math.random() * brickConfig.columns);
        const r = Math.floor(Math.random() * brickConfig.rows);
        if (bricks[c][r].type === null) {
            bricks[c][r].type = BrickTypes.RED;
            bricks[c][r].health = BrickTypes.RED.health;
            redBricksPlaced++;
        }
    }

    // Add exactly 7 grey bricks in random positions
    let greyBricksPlaced = 0;
    while (greyBricksPlaced < 7) {
        const c = Math.floor(Math.random() * brickConfig.columns);
        const r = Math.floor(Math.random() * brickConfig.rows);
        if (bricks[c][r].type === null) {
            bricks[c][r].type = BrickTypes.GREY;
            bricks[c][r].health = BrickTypes.GREY.health;
            greyBricksPlaced++;
        }
    }

    // Add exactly two orange bricks in random positions
    let orangeBricksPlaced = 0;
    while (orangeBricksPlaced < 2) {
        const c = Math.floor(Math.random() * brickConfig.columns);
        const r = Math.floor(Math.random() * brickConfig.rows);
        if (bricks[c][r].type === null) {
            bricks[c][r].type = BrickTypes.ORANGE;
            bricks[c][r].health = BrickTypes.ORANGE.health;
            orangeBricksPlaced++;
        }
    }

    // Fill remaining spaces with other non-grey brick types
    const otherTypes = [
        BrickTypes.MAGENTA,
        BrickTypes.YELLOW,
        BrickTypes.GREEN
    ];

    for (let c = 0; c < brickConfig.columns; c++) {
        for (let r = 0; r < brickConfig.rows; r++) {
            if (bricks[c][r].type === null) {
                const randomType = otherTypes[Math.floor(Math.random() * otherTypes.length)];
                bricks[c][r].type = randomType;
                bricks[c][r].health = randomType.health;
            }
        }
    }
}

// Update bullet drawing for longer, more visible trail
function drawBullet() {
    if (bullet.active) {
        if (bullet.isBeam) {
            // Draw blue laser beam trail first (behind the current beam)
            bullet.beamTrail.forEach((pos, i) => {
                const alpha = (1 - i / bullet.beamTrail.length) * 0.3;  // Fade out trail
                ctx.fillStyle = `rgba(0, 153, 255, ${alpha})`;  // Semi-transparent blue
                ctx.fillRect(
                    pos.x, 
                    pos.y1, 
                    bullet.width, 
                    pos.y2 - pos.y1  // Full height
                );
            });
            
            // Draw current blue laser beam with 50% transparency
            ctx.fillStyle = 'rgba(0, 153, 255, 0.5)';  // Semi-transparent blue
            ctx.fillRect(
                bullet.x1, 
                bullet.y1, 
                bullet.width, 
                bullet.y2 - bullet.y1  // Full height
            );
            
            // Add some glow effect
            ctx.strokeStyle = '#0099ff';
            ctx.lineWidth = 2;
            ctx.strokeRect(
                bullet.x1, 
                bullet.y1, 
                bullet.width, 
                bullet.y2 - bullet.y1
            );
        } else {
            // Regular red laser with trail
            bullet.trail.forEach((pos, i) => {
                const alpha = (1 - i / bullet.trail.length) * 0.5;
                ctx.fillStyle = `rgba(255, 0, 0, ${alpha})`;
                ctx.fillRect(pos.x1, pos.y1, bullet.width, bullet.height);
                ctx.fillRect(pos.x2, pos.y2, bullet.width, bullet.height);
            });

            // Draw current bullet
            ctx.fillStyle = bullet.color;
            ctx.fillRect(bullet.x1, bullet.y1, bullet.width, bullet.height);
            ctx.fillRect(bullet.x2, bullet.y2, bullet.width, bullet.height);
        }
    }
}

// Update bullet movement and collision
function moveBullet() {
    if (bullet.active) {
        // Store previous position for trail
        if (bullet.isBeam) {
            // Store beam position for trail
            bullet.beamTrail.unshift({
                x: bullet.x1, 
                y1: bullet.y1, 
                y2: bullet.y2
            });
            
            // Limit beam trail length - longer trail for blue beam
            if (bullet.beamTrail.length > 15) bullet.beamTrail.pop();
        } else {
            // Store regular bullet position for trail
            bullet.trail.unshift({x1: bullet.x1, y1: bullet.y1, x2: bullet.x2, y2: bullet.y2});
            if (bullet.trail.length > 5) bullet.trail.pop();
        }

        // Update bullet position
        bullet.x1 += bullet.speed;
        bullet.x2 += bullet.speed;

        const isBlueBeam = bullet.color === '#0099ff';
        const movingRight = bullet.speed > 0;

        // Check for paddle hits with stretched heights
        if (movingRight) {  // Moving right (towards computer)
            const computerActualHeight = computerPaddle.isStretched ? paddleHeight * 1.25 : paddleHeight;
            if (bullet.x1 > computerPaddle.x &&
                bullet.x1 < computerPaddle.x + computerPaddle.width &&
                ((bullet.y1 > computerPaddle.y && bullet.y1 < computerPaddle.y + computerActualHeight) ||
                 (bullet.y2 > computerPaddle.y && bullet.y2 < computerPaddle.y + computerActualHeight))) {
                
                if (isBlueBeam) {
                    // Stun computer paddle for 3 seconds
                    computerPaddle.isStunned = true;
                    computerPaddle.stunEndTime = Date.now() + 3000; // 3 seconds from now
                    createStunSound(computerPaddle);  // Add this line
                    bullet.active = false;
                } else {
                    // Regular red laser hit behavior
                    handlePaddleHit(computerPaddle, false);
                }
            }
        } else {  // Moving left (towards player)
            const playerActualHeight = playerPaddle.isStretched ? paddleHeight * 1.25 : paddleHeight;
            if (bullet.x1 < playerPaddle.x + playerPaddle.width &&
                bullet.x1 > playerPaddle.x &&
                ((bullet.y1 > playerPaddle.y && bullet.y1 < playerPaddle.y + playerActualHeight) ||
                 (bullet.y2 > playerPaddle.y && bullet.y2 < playerPaddle.y + playerActualHeight))) {
                
                if (isBlueBeam) {
                    // Stun player paddle for 3 seconds
                    playerPaddle.isStunned = true;
                    playerPaddle.stunEndTime = Date.now() + 3000; // 3 seconds from now
                    createStunSound(playerPaddle);  // Add this line
                    bullet.active = false;
                } else {
                    // Regular red laser hit behavior
                    handlePaddleHit(playerPaddle, true);
                }
            }
        }

        // Handle brick collisions
        for (let c = 0; c < brickConfig.columns; c++) {
            for (let r = 0; r < brickConfig.rows; r++) {
                let b = bricks[c][r];
                if (b.status === 1) {
                    if ((bullet.x1 < b.x + b.width &&
                         bullet.x1 + bullet.width > b.x &&
                         bullet.y1 < b.y + b.height &&
                         bullet.y1 + bullet.height > b.y) ||
                        (bullet.x2 < b.x + b.width &&
                         bullet.x2 + bullet.width > b.x &&
                         bullet.y2 < b.y + b.height &&
                         bullet.y2 + bullet.height > b.y)) {
                        
                        if (isBlueBeam) {
                            // Blue beam destroys brick but continues
                            b.status = 0;
                        } else {
                            // Red laser destroys brick and stops
                            b.status = 0;
                            bullet.active = false;
                        }

                        // Check if this was the last brick
                        if (!checkRemainingBricks()) {
                            if (movingRight) {  // Player's bullet
                                playerScore += 1;
                                playerLives = Math.min(playerLives + 1, MAX_LIVES);
                                serverPaddle = playerPaddle;
                                showWinOverlay('PLAYER WINS');
                            } else {  // Computer's bullet
                                computerScore += 1;
                                playerLives--;
                                if (playerLives <= 0) {
                                    showGameOver();
                                    return;
                                }
                                serverPaddle = computerPaddle;
                                showWinOverlay('COMPUTER WINS');
                            }
                            resetBall();
                            createBricks();
                            updateLives();
                            updateScore();
                            return;
                        }

                        if (!isBlueBeam) {
                            break;  // Only exit loop for red laser
                        }
                    }
                }
            }
        }

        // Deactivate bullet if it reaches canvas edge
        if (bullet.x1 < 0 || bullet.x1 > canvas.width) {
            bullet.active = false;
            bullet.trail = [];
        }
    }
}

// Add shot indicator drawing
function drawShotIndicators() {
    // Player shots (moved to bottom of paddle)
    for (let i = 0; i < playerShotsAvailable; i++) {
        ctx.fillStyle = '#ffff00';
        ctx.fillRect(
            playerPaddle.x + 20,
            playerPaddle.y + paddleHeight + 10 + (i * 8),
            10,
            5
        );
    }
    
    // Computer shots (moved to bottom of paddle)
    for (let i = 0; i < computerShotsAvailable; i++) {
        ctx.fillStyle = '#ffff00';
        ctx.fillRect(
            computerPaddle.x - 30,
            computerPaddle.y + paddleHeight + 10 + (i * 8),
            10,
            5
        );
    }
}

// Game loop
function gameLoop() {
    if (!gameLoopRunning) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw background
    if (currentBackground) {
        ctx.globalAlpha = 1.0;
        ctx.drawImage(currentBackground, 0, 0, canvas.width, canvas.height);
        ctx.globalAlpha = 1.0;
    }

    // Draw game elements
    drawBricks();
    drawBall();
    drawPaddle(playerPaddle, playerTrail, player1Image);
    drawPaddle(computerPaddle, computerTrail, player2Image);
    drawBullet();
    drawShotIndicators();
    
    // Draw appropriate overlay
    if (showStartPrompt) {
        drawStartPrompt();
    } else if (isPaused) {
        drawGameRules();
    } else if (overlayTimer > 0) {
        drawOverlay();
    }

    // Only update game if not paused, not waiting for new game, not showing start prompt,
    // and not showing a win overlay
    if (!isPaused && !waitingForNewGame && !showStartPrompt && overlayTimer <= 0) {
        movePlayerPaddle();
        moveComputerPaddle();
        moveBall();
        moveBullet();
    }

    requestAnimationFrame(gameLoop);
}

// Initialize backgrounds before starting the game
loadBackgrounds();

// Initialize bricks before starting the game
createBricks();

// Initialize first serve
resetBall();

// Initialize lives display
updateLives();

// Start the game loop immediately, but show start prompt
gameLoopRunning = true;
gameLoop();

// Update function to only check for remaining bricks
function checkRemainingBricks() {
    for (let c = 0; c < brickConfig.columns; c++) {
        for (let r = 0; r < brickConfig.rows; r++) {
            if (bricks[c][r].status === 1) {
                return true;  // Found at least one brick
            }
        }
    }
    return false;  // No bricks remain
}

// Update the lives display function
function updateLives() {
    document.getElementById('playerLives').textContent = playerLives;
}

// Add near other sound-related functions
function createExplosionSound() {
    if (!audioContext) {
        initAudio();
    }

    const now = audioContext.currentTime;
    
    // Initial explosion boom - reduced gain by 50%
    const boomOsc = audioContext.createOscillator();
    const boomGain = audioContext.createGain();
    boomOsc.type = 'sine';
    boomOsc.frequency.setValueAtTime(150, now);
    boomOsc.frequency.exponentialRampToValueAtTime(40, now + 0.5);
    boomGain.gain.setValueAtTime(0.5, now);  // Reduced from 1.0 to 0.5
    boomGain.gain.exponentialRampToValueAtTime(0.005, now + 1);  // Reduced from 0.01 to 0.005
    
    // Debris sounds - reduced gain by 50%
    const debrisOsc = audioContext.createOscillator();
    const debrisGain = audioContext.createGain();
    debrisOsc.type = 'sawtooth';
    debrisOsc.frequency.setValueAtTime(2000, now);
    debrisOsc.frequency.exponentialRampToValueAtTime(200, now + 2);
    debrisGain.gain.setValueAtTime(0.15, now + 0.1);  // Reduced from 0.3 to 0.15
    debrisGain.gain.exponentialRampToValueAtTime(0.005, now + 2);  // Reduced from 0.01 to 0.005
    
    // Rumble effect - reduced gain by 50%
    const rumbleOsc = audioContext.createOscillator();
    const rumbleGain = audioContext.createGain();
    rumbleOsc.type = 'triangle';
    rumbleOsc.frequency.setValueAtTime(80, now);
    rumbleOsc.frequency.exponentialRampToValueAtTime(20, now + 2);
    rumbleGain.gain.setValueAtTime(0.25, now);  // Reduced from 0.5 to 0.25
    rumbleGain.gain.exponentialRampToValueAtTime(0.005, now + 2);  // Reduced from 0.01 to 0.005
    
    // Distortion for more grittiness
    const distortion = audioContext.createWaveShaper();
    function makeDistortionCurve(amount) {
        const samples = 44100;
        const curve = new Float32Array(samples);
        for (let i = 0; i < samples; ++i) {
            const x = (i * 2) / samples - 1;
            curve[i] = Math.tanh(x * amount);
        }
        return curve;
    }
    distortion.curve = makeDistortionCurve(50);
    
    // Connect all nodes
    boomOsc.connect(boomGain);
    debrisOsc.connect(debrisGain);
    rumbleOsc.connect(rumbleGain);
    boomGain.connect(distortion);
    debrisGain.connect(distortion);
    rumbleGain.connect(distortion);
    distortion.connect(audioContext.destination);
    
    // Start and stop all oscillators
    boomOsc.start(now);
    debrisOsc.start(now);
    rumbleOsc.start(now);
    boomOsc.stop(now + 2);
    debrisOsc.stop(now + 2);
    rumbleOsc.stop(now + 2);
}

// Update handlePaddleHit function to include explosion sound
function handlePaddleHit(paddle, isPlayer) {
    bullet.active = false;
    if (isPlayer) {
        computerScore += 1;
        playerLives--;
        
        paddle.isExploding = true;
        paddle.explosionStartTime = Date.now();
        
        // Add explosion sound
        createExplosionSound();
        
        setTimeout(() => {
            paddle.isExploding = false;
            if (playerLives <= 0) {
                showGameOver();
                return;
            }
            serverPaddle = computerPaddle;
            showWinOverlay('COMPUTER WINS');
            resetBall();
            createBricks();
            updateLives();
            updateScore();
        }, 2000);
    } else {
        paddle.isExploding = true;
        paddle.explosionStartTime = Date.now();
        
        // Add explosion sound
        createExplosionSound();
        
        setTimeout(() => {
            paddle.isExploding = false;
            playerScore += 1;
            playerLives = Math.min(playerLives + 1, MAX_LIVES);
            serverPaddle = playerPaddle;
            showWinOverlay('PLAYER WINS');
            resetBall();
            createBricks();
            updateLives();
            updateScore();
        }, 2000);
    }
}

// Update function to show win overlay
function showWinOverlay(message) {
    // Don't set isPaused = true, just show the overlay
    winMessage = message;
    overlayTimer = OVERLAY_DURATION;
}

// Add function to load the font
function loadPixelFont() {
    pixelFont.load().then(function(font) {
        document.fonts.add(font);
    }).catch(function(error) {
        console.error('Font loading failed:', error);
    });
}

// Update drawOverlay function to handle game state properly
function drawOverlay() {
    if (overlayTimer > 0) {
        // Semi-transparent background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw text with pixel font
        ctx.fillStyle = '#fff';
        ctx.font = '32px PressStart2P';  // Adjusted size for better readability
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(winMessage, canvas.width / 2, canvas.height / 2);
        
        overlayTimer--;
        // Don't set isPaused = false here, as we never set it to true
    }
}

// Add font loading to initialization
loadPixelFont();

// Update showGameOver function to not set isPaused
function showGameOver() {
    const gameOverElement = document.getElementById('gameOverMessage');
    gameOverElement.textContent = 'GAME OVER - PRESS FIRE TO PLAY AGAIN';
    gameOverElement.style.display = 'block';
    gameOverElement.style.position = 'absolute';
    gameOverElement.style.top = '50%';
    gameOverElement.style.left = '50%';
    gameOverElement.style.transform = 'translate(-50%, -50%)';
    gameOverElement.style.zIndex = '1000';
    isGameOver = true;
    waitingForNewGame = true;
    manageSoundtrack();  // Stop the music
}

// Update startGame function to start the soundtrack
function startGame() {
    // Initialize game state
    playerLives = 3;
    playerScore = 0;
    computerScore = 0;
    isGameOver = false;
    isPaused = false;
    waitingForNewGame = false;
    showStartPrompt = false;
    serverPaddle = playerPaddle;  // Player always serves first game
    
    // Initialize game objects
    loadBackgrounds();
    createBricks();
    resetBall();
    updateLives();
    updateScore();
    
    // Start background music
    manageSoundtrack();
    
    // Start game loop if not already running
    if (!gameLoopRunning) {
        gameLoopRunning = true;
        gameLoop();
    }
}

// Add function to draw start prompt
function drawStartPrompt() {
    // Semi-transparent background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw text with pixel font
    ctx.fillStyle = '#fff';
    ctx.font = '32px PressStart2P';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('PRESS FIRE TO START', canvas.width / 2, canvas.height / 2);
}

// Update the createLaserSound function for a more aggressive laser effect
function createLaserSound(isBlueBeam = false) {
    try {
        if (!audioContext) {
            initAudio();
        }
        
        const now = audioContext.currentTime;
        
        if (isBlueBeam) {
            // Create deep rumbling sound for blue laser with echo
            const oscillator1 = audioContext.createOscillator();
            const oscillator2 = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            // Add convolver for echo/reverb effect
            const convolver = audioContext.createConvolver();
            const reverbLength = 2; // 2 seconds of reverb
            const sampleRate = audioContext.sampleRate;
            const impulseBuffer = audioContext.createBuffer(2, reverbLength * sampleRate, sampleRate);
            
            // Create impulse response for echo
            for (let channel = 0; channel < 2; channel++) {
                const impulseData = impulseBuffer.getChannelData(channel);
                for (let i = 0; i < impulseBuffer.length; i++) {
                    // Exponential decay with some randomization
                    impulseData[i] = (Math.random() * 2 - 1) * 
                                   Math.exp(-i / (sampleRate * 0.2)) * 0.5;
                }
            }
            convolver.buffer = impulseBuffer;
            
            // Low rumble tone
            oscillator1.type = 'sine';
            oscillator1.frequency.setValueAtTime(40, now);
            oscillator1.frequency.linearRampToValueAtTime(80, now + 0.4);
            
            // Sub-bass sweep
            oscillator2.type = 'triangle';
            oscillator2.frequency.setValueAtTime(30, now);
            oscillator2.frequency.linearRampToValueAtTime(20, now + 0.4);
            
            // Volume envelope for longer sustain
            gainNode.gain.setValueAtTime(0, now);
            gainNode.gain.linearRampToValueAtTime(0.7, now + 0.1);
            gainNode.gain.linearRampToValueAtTime(0.5, now + 0.3);
            gainNode.gain.exponentialRampToValueAtTime(0.01, now + 1.0); // Extended fade-out
            
            // Add heavy distortion
            const distortion = audioContext.createWaveShaper();
            function makeDistortionCurve(amount) {
                const k = amount;
                const n_samples = 44100;
                const curve = new Float32Array(n_samples);
                for (let i = 0; i < n_samples; ++i) {
                    const x = (i * 2) / n_samples - 1;
                    curve[i] = Math.tanh(x * amount);
                }
                return curve;
            }
            distortion.curve = makeDistortionCurve(50);
            
            // Create echo delay effect
            const delay = audioContext.createDelay();
            delay.delayTime.value = 0.15; // 150ms delay
            
            const delayGain = audioContext.createGain();
            delayGain.gain.value = 0.3; // Echo volume
            
            // Connect everything with echo/reverb
            oscillator1.connect(distortion);
            oscillator2.connect(distortion);
            distortion.connect(gainNode);
            
            // Main signal path
            gainNode.connect(audioContext.destination);
            
            // Echo path
            gainNode.connect(delay);
            delay.connect(delayGain);
            delayGain.connect(delay); // Feedback loop
            delayGain.connect(convolver);
            convolver.connect(audioContext.destination);
            
            // Play the sound
            oscillator1.start(now);
            oscillator2.start(now);
            oscillator1.stop(now + 0.4);
            oscillator2.stop(now + 0.4);
            
            // Clear any existing trails when creating a new beam
            bullet.beamTrail = [];
            
        } else {
            // Original high-pitched laser sound for red laser
            const oscillator1 = audioContext.createOscillator();
            const oscillator2 = audioContext.createOscillator();
            const oscillator3 = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            // Main laser tone
            oscillator1.type = 'sawtooth';
            oscillator1.frequency.setValueAtTime(3000, now);
            oscillator1.frequency.exponentialRampToValueAtTime(100, now + 0.15);
            
            // Higher frequency component
            oscillator2.type = 'square';
            oscillator2.frequency.setValueAtTime(4000, now);
            oscillator2.frequency.exponentialRampToValueAtTime(200, now + 0.1);
            
            // Sub-bass component
            oscillator3.type = 'sine';
            oscillator3.frequency.setValueAtTime(100, now);
            oscillator3.frequency.exponentialRampToValueAtTime(40, now + 0.15);
            
            // Volume envelope
            gainNode.gain.setValueAtTime(1, now);
            gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
            
            // Add heavy distortion
            const distortion = audioContext.createWaveShaper();
            function makeDistortionCurve(amount) {
                const k = amount;
                const n_samples = 44100;
                const curve = new Float32Array(n_samples);
                for (let i = 0; i < n_samples; ++i) {
                    const x = (i * 2) / n_samples - 1;
                    curve[i] = Math.sign(x) * Math.pow(Math.abs(x), 0.5) * 3;
                }
                return curve;
            }
            distortion.curve = makeDistortionCurve(100);
            
            // Add a compressor for more punch
            const compressor = audioContext.createDynamicsCompressor();
            compressor.threshold.setValueAtTime(-50, now);
            compressor.knee.setValueAtTime(40, now);
            compressor.ratio.setValueAtTime(12, now);
            compressor.attack.setValueAtTime(0, now);
            compressor.release.setValueAtTime(0.25, now);
            
            // Connect everything
            oscillator1.connect(distortion);
            oscillator2.connect(distortion);
            oscillator3.connect(gainNode);
            distortion.connect(compressor);
            compressor.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            // Play the sound
            oscillator1.start(now);
            oscillator2.start(now);
            oscillator3.start(now);
            oscillator1.stop(now + 0.15);
            oscillator2.stop(now + 0.15);
            oscillator3.stop(now + 0.15);
            
            // Clear any existing trails when creating a new laser
            bullet.trail = [];
            
        }
        
    } catch (error) {
        console.error('Error creating laser sound:', error);
    }
}

// Update manageSoundtrack function to handle pause state
function manageSoundtrack() {
    if (waitingForNewGame || isGameOver || isPaused) {
        soundtrack.pause();
    } else if (soundtrack.paused) {
        soundtrack.play().catch(error => {
            console.error('Audio playback failed:', error);
        });
    }
}

// Add separate function for handling serve
function handleServe(e) {
    if (e.key === ' ' && isServing && ball.attached && serverPaddle === playerPaddle) {
        isServing = false;
        ball.attached = false;
        ball.dx = 5;  // Serve towards computer
        ball.dy = (Math.random() * 6 - 3);
        // Remove the event listener after serving
        document.removeEventListener('keydown', handleServe);
    }
}

// Update function to handle stretch power-up
function setPaddleStretch(paddle, stretched) {
    paddle.isStretched = stretched;
    paddle.targetHeight = stretched ? paddleHeight * STRETCH_MULTIPLIER : paddleHeight;
    
    if (stretched) {
        paddle.stretchEndTime = Date.now() + 30000;
    } else {
        paddle.stretchEndTime = 0;
    }
}

// Add the new function to create electrical sizzle sound
function createStunSound(paddle) {
    if (!audioContext) {
        initAudio();
    }

    // Clean up any existing stun sound for this paddle
    if (stunSoundNodes[paddle === playerPaddle ? 'player' : 'computer']) {
        stunSoundNodes[paddle === playerPaddle ? 'player' : 'computer'].stop();
    }

    const noiseNode = audioContext.createBufferSource();
    const gainNode = audioContext.createGain();
    const filterNode = audioContext.createBiquadFilter();
    const now = audioContext.currentTime;

    // Create noise buffer
    const bufferSize = audioContext.sampleRate * 3; // 3 seconds
    const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
    const data = buffer.getChannelData(0);

    // Generate electrical noise
    for (let i = 0; i < bufferSize; i++) {
        // Combine different frequencies of noise
        data[i] = (
            (Math.random() * 2 - 1) * 0.5 + // White noise
            (Math.sin(i * 0.1) * 0.25) + // Low frequency modulation
            (Math.sin(i * 0.01) * 0.25) // Very low frequency modulation
        );
    }

    noiseNode.buffer = buffer;
    
    // Configure filter for crackling effect
    filterNode.type = 'bandpass';
    filterNode.frequency.setValueAtTime(1000, now);
    filterNode.Q.setValueAtTime(1, now);
    // Modulate filter frequency for sizzling effect
    filterNode.frequency.setValueCurveAtTime(
        new Float32Array([1000, 2000, 500, 3000, 1000, 4000, 2000]),
        now,
        3
    );

    // Configure gain envelope
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.3, now + 0.1);
    gainNode.gain.setValueCurveAtTime(
        new Float32Array([0.3, 0.2, 0.3, 0.1, 0.2, 0.1, 0]),
        now + 0.1,
        2.9
    );

    // Connect nodes
    noiseNode.connect(filterNode);
    filterNode.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Start and store the nodes
    noiseNode.start(now);
    noiseNode.stop(now + 3);

    // Store reference to stop sound if needed
    stunSoundNodes[paddle === playerPaddle ? 'player' : 'computer'] = noiseNode;
}

// Add function to draw game rules
function drawGameRules() {
    // Don't show rules if game is over
    if (isGameOver || waitingForNewGame) {
        return;
    }
    
    // Semi-transparent background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw "PAUSED" text at the top
    ctx.fillStyle = '#fff';
    ctx.font = '32px PressStart2P';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('PAUSED', canvas.width / 2, 30);
    
    // Draw game rules with smaller font and center-justified
    ctx.font = '14px PressStart2P';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    
    const lineHeight = 16;  // Increased from 12 to 18 for better spacing
    let startY = 90;
    const maxWidth = canvas.width - 100; // Add 50px padding on each side
    
    // Function to wrap text
    function wrapText(text, maxWidth) {
        const words = text.split(' ');
        let lines = [];
        let currentLine = words[0];
        
        for (let i = 1; i < words.length; i++) {
            const testLine = currentLine + ' ' + words[i];
            const metrics = ctx.measureText(testLine);
            const testWidth = metrics.width;
            
            if (testWidth > maxWidth) {
                lines.push(currentLine);
                currentLine = words[i];
            } else {
                currentLine = testLine;
            }
        }
        
        lines.push(currentLine);
        return lines;
    }
    
    // Process and draw each rule
    gameRules.forEach(rule => {
        if (rule === "") {
            // Just add space for empty lines
            startY += lineHeight;
        } else {
            // Wrap text for non-empty lines
            const wrappedLines = wrapText(rule, maxWidth);
            
            wrappedLines.forEach(line => {
                ctx.fillText(line, canvas.width / 2, startY);
                startY += lineHeight;
            });
        }
    });
    
    // Draw "Press ESC to resume" at the bottom
    ctx.font = '16px PressStart2P';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText('Press ESC to resume', canvas.width / 2, canvas.height - 30);
}

// Replace mousedown event with keyboard-only functionality
canvas.addEventListener('mousedown', (e) => {
    // Only handle left mouse button (button code 0)
    if (e.button === 0) {
        // Only handle start game and new game scenarios
        if (showStartPrompt) {
            // Start game with mouse click
            showStartPrompt = false;
            initAudio();
            startGame();
        } else if (waitingForNewGame) {
            // Start new game after game over with mouse click
            waitingForNewGame = false;
            isGameOver = false;
            isPaused = false;
            playerLives = 3;
            playerScore = 0;
            computerScore = 0;
            document.getElementById('gameOverMessage').style.display = 'none';
            serverPaddle = playerPaddle;
            updateLives();
            updateScore();
            resetBall();
            createBricks();
            manageSoundtrack();
        }
    }
});