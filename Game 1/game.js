const bird = document.getElementById('bird');
const gameContainer = document.querySelector('.game-container');
const scoreElement = document.getElementById('score');
const highScoreElement = document.getElementById('high-score');
const gameOverElement = document.getElementById('game-over');
const background = document.querySelector('.background');

let birdY = 300;
let birdVelocity = 0;
let gravity = 0.07;
let jumpForce = -3.5;
let gameRunning = true;
let score = 0;
let highScore = localStorage.getItem('flappyBirdHighScore') || 0;
highScoreElement.textContent = `High Score: ${highScore}`;
let pipes = [];
let pipeInterval = 2000;
let lastPipeTime = 0;

// Game constants
const GAME_HEIGHT = 600;
const PIPE_WIDTH = 80;
const PIPE_GAP = 180;
const BIRD_HEIGHT = 30;
const BIRD_WIDTH = 30;

// Time period management
const timePeriods = ['morning', 'evening', 'night'];
let currentTimePeriod = 0;
let lastScoreThreshold = 0;

function updateTimePeriod() {
    const scoreThreshold = Math.floor(score / 2) * 2;
    
    // Only update if we've crossed a 10-point threshold
    if (scoreThreshold !== lastScoreThreshold) {
        lastScoreThreshold = scoreThreshold;
        const newTimePeriod = (scoreThreshold / 2) % timePeriods.length;
        
        if (newTimePeriod !== currentTimePeriod) {
            currentTimePeriod = newTimePeriod;
            
            // Update background elements
            const sky = document.querySelector('.sky');
            const clouds = document.querySelector('.clouds');
            const sun = document.querySelector('.sun');
            const stars = document.querySelector('.stars');
            const moon = document.querySelector('.moon');
            
            // Remove all time period classes
            sky.classList.remove(...timePeriods);
            clouds.classList.remove(...timePeriods);
            sun.classList.remove(...timePeriods);
            stars.classList.remove(...timePeriods);
            moon.classList.remove(...timePeriods);
            
            // Add current time period class
            const currentPeriod = timePeriods[currentTimePeriod];
            sky.classList.add(currentPeriod);
            clouds.classList.add(currentPeriod);
            sun.classList.add(currentPeriod);
            stars.classList.add(currentPeriod);
            moon.classList.add(currentPeriod);
        }
    }
}

function updateBirdRotation() {
    bird.classList.remove('jumping', 'falling');
    if (birdVelocity < 0) {
        bird.classList.add('jumping');
    } else if (birdVelocity > 0) {
        bird.classList.add('falling');
    }
}

// Handle space key press
document.addEventListener('keydown', (event) => {
    if (event.code === 'Space') {
        if (gameRunning) {
            birdVelocity = jumpForce;
        } else {
            resetGame();
        }
    }
});

function resetGame() {
    // Reset game state
    birdY = 300;
    birdVelocity = 1;
    gravity = 0.08;
    gameRunning = true;
    score = 0;
    scoreElement.textContent = `Score: ${score}`;
    
    // Reset time period to morning
    currentTimePeriod = 0;
    lastScoreThreshold = 0;
    
    // Force update to morning time period
    const sky = document.querySelector('.sky');
    const clouds = document.querySelector('.clouds');
    const sun = document.querySelector('.sun');
    const stars = document.querySelector('.stars');
    const moon = document.querySelector('.moon');
    
    // Remove all time period classes
    sky.classList.remove(...timePeriods);
    clouds.classList.remove(...timePeriods);
    sun.classList.remove(...timePeriods);
    stars.classList.remove(...timePeriods);
    moon.classList.remove(...timePeriods);
    
    // Add morning class
    sky.classList.add('morning');
    clouds.classList.add('morning');
    sun.classList.add('morning');
    stars.classList.add('morning');
    moon.classList.add('morning');
    
    // Reset bird appearance
    bird.classList.remove('dead');
    bird.style.top = `${birdY}px`;
    
    // Remove all pipes
    pipes.forEach(pipe => {
        pipe.top.remove();
        pipe.bottom.remove();
    });
    pipes = [];
    
    // Hide game over message and reset its opacity
    gameOverElement.classList.add('hidden');
    gameOverElement.style.opacity = '0';
    const restartMessage = document.querySelector('.restart-message');
    restartMessage.style.opacity = '0';
    restartMessage.style.animation = 'none';
    
    // Temporarily disable space bar control
    document.removeEventListener('keydown', handleSpacePress);
    
    // Make bird float for 1 second
    const floatInterval = setInterval(() => {
        // Small upward movement to simulate floating
        birdY -= 0.5;
        bird.style.top = `${birdY}px`;
    }, 16);
    
    // Enable space bar control after 1 second
    setTimeout(() => {
        clearInterval(floatInterval);
        document.addEventListener('keydown', handleSpacePress);
    }, 1000);
}

function createPipe() {
    const pipeHeight = Math.random() * (GAME_HEIGHT - PIPE_GAP - 200) + 100;
    
    // Create top pipe
    const topPipe = document.createElement('div');
    topPipe.className = 'pipe top';
    topPipe.style.height = `${pipeHeight}px`;
    topPipe.style.top = '0';
    gameContainer.appendChild(topPipe);
    
    // Create bottom pipe
    const bottomPipe = document.createElement('div');
    bottomPipe.className = 'pipe bottom';
    bottomPipe.style.height = `${GAME_HEIGHT - pipeHeight - PIPE_GAP}px`;
    bottomPipe.style.bottom = '0';
    gameContainer.appendChild(bottomPipe);
    
    pipes.push({
        top: topPipe,
        bottom: bottomPipe,
        x: 400,
        passed: false // Add flag to track if pipe has been passed
    });
}

function updatePipes() {
    pipes.forEach(pipe => {
        pipe.x -= 2;
        pipe.top.style.right = `${400 - pipe.x}px`;
        pipe.bottom.style.right = `${400 - pipe.x}px`;
        
        // Check if bird has passed the pipe
        if (pipe.x + PIPE_WIDTH < 50 && !pipe.passed) {
            pipe.passed = true;
            score++;
            scoreElement.textContent = `Score: ${score}`;
            
            // Update high score if current score is higher
            if (score > highScore) {
                highScore = score;
                localStorage.setItem('flappyBirdHighScore', highScore);
                highScoreElement.textContent = `High Score: ${highScore}`;
            }
            
            // Update time period based on score
            updateTimePeriod();
        }
        
        // Remove pipes that are off screen
        if (pipe.x < -PIPE_WIDTH) {
            pipe.top.remove();
            pipe.bottom.remove();
            pipes = pipes.filter(p => p !== pipe);
        }
    });
}

function checkCollision() {
    // Check if bird hits the ground or ceiling
    if (birdY <= 0 || birdY >= GAME_HEIGHT - BIRD_HEIGHT-1) {
        triggerDeath();
        return;
    }
    
    // Check collision with pipes
    for (const pipe of pipes) {
        // Get the bird's position and dimensions with a smaller hit area
        const birdLeft = 50 + 5; // Add 5px padding
        const birdRight = birdLeft + BIRD_WIDTH - 10; // Subtract 10px from width
        const birdTop = birdY + 5; // Add 5px padding
        const birdBottom = birdY + BIRD_HEIGHT - 10; // Subtract 10px from height
        
        // Get the pipe's position and dimensions
        const pipeLeft = pipe.x + 5; // Add 5px padding
        const pipeRight = pipe.x + PIPE_WIDTH - 5; // Subtract 5px from width
        const topPipeBottom = pipe.top.offsetHeight;
        const bottomPipeTop = GAME_HEIGHT - pipe.bottom.offsetHeight;
        
        // Check if bird is in the same x-range as the pipe
        if (birdRight > pipeLeft && birdLeft < pipeRight) {
            // Check if bird hits the top pipe
            if (birdTop < topPipeBottom) {
                triggerDeath();
                return;
            }
            
            // Check if bird hits the bottom pipe
            if (birdBottom > bottomPipeTop) {
                triggerDeath();
                return;
            }
        }
    }
}

function triggerDeath() {
    if (!gameRunning) return;
    gameRunning = false;
    bird.classList.add('dead');
    
    // Stop the bird's movement and make it fall immediately
    birdVelocity = 0;
    gravity = 0.3; // Increased gravity for faster fall
    birdY += birdVelocity;
    bird.style.top = `${birdY}px`;
    
    // Remove any existing space bar listeners
    document.removeEventListener('keydown', handleSpacePress);
    
    // Start death animation
    const deathAnimation = setInterval(() => {
        birdVelocity += gravity;
        birdY += birdVelocity;
        bird.style.top = `${birdY}px`;
        
        // Stop animation when bird hits the ground
        if (birdY >= GAME_HEIGHT - BIRD_HEIGHT) {
            clearInterval(deathAnimation);
            
            // Show game over message after bird hits ground
            setTimeout(() => {
                // Update final score and high score in game over message
                document.getElementById('final-score').textContent = score;
                document.getElementById('high-score-final').textContent = highScore;
                
                // Show game over message with animation
                gameOverElement.classList.remove('hidden');
                gameOverElement.style.opacity = '1';
                
                // Show restart message after a short delay
                const restartMessage = document.querySelector('.restart-message');
                restartMessage.style.opacity = '0';
                
                setTimeout(() => {
                    restartMessage.style.opacity = '1';
                    restartMessage.style.animation = 'blink 1.5s infinite';
                    
                    // Add space bar event listener for restart only after the message is shown
                    const restartListener = (event) => {
                        if (event.code === 'Space') {
                            resetGame();
                            document.removeEventListener('keydown', restartListener);
                        }
                    };
                    
                    document.addEventListener('keydown', restartListener);
                }, 500);
            }, 500);
        }
    }, 16); // ~60fps
}

// Handle space key press during game
function handleSpacePress(event) {
    if (event.code === 'Space' && gameRunning) {
        birdVelocity = jumpForce;
    }
}

// Add space bar event listener for game play
document.addEventListener('keydown', handleSpacePress);

function gameLoop(timestamp) {
    if (gameRunning) {
        // Update bird position
        birdVelocity += gravity;
        birdY += birdVelocity;
        bird.style.top = `${birdY}px`;
        
        // Update bird rotation
        updateBirdRotation();
        
        // Create new pipes
        if (timestamp - lastPipeTime > pipeInterval) {
            createPipe();
            lastPipeTime = timestamp;
        }
        
        // Update pipes
        updatePipes();
        
        // Check for collisions
        checkCollision();
    }
    
    requestAnimationFrame(gameLoop);
}

// Initialize time period
updateTimePeriod();

// Start the game
requestAnimationFrame(gameLoop);

// Add reset high score button functionality
document.getElementById('reset-high-score').addEventListener('click', () => {
    if (confirm('Are you sure you want to reset the high score?')) {
        highScore = 0;
        localStorage.setItem('flappyBirdHighScore', highScore);
        highScoreElement.textContent = `High Score: ${highScore}`;
    }
}); 