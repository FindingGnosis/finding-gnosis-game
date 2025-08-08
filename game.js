/*
  Game logic for Finding Gnosis (vanilla JavaScript implementation).

  This script creates a simple 2D platformer using an HTML5 canvas
  without any external libraries. The player moves left and right
  with the arrow keys and jumps with the up arrow. The objective is
  to reach the green portal (goal) while avoiding the red hazard. Upon
  reaching the goal, the game stops and an email signup form is
  displayed. If the player touches the hazard, they are reset to
  the starting position.

  To run this game locally or on a static host, simply include
  index.html, styles.css, and this script in the same directory.
*/

// Game state objects and constants
const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;
const GRAVITY = 0.5;
const MOVE_SPEED = 4;
const JUMP_SPEED = 12;

// Background image variables. Once the image is loaded the
// `backgroundLoaded` flag becomes true and the image will be drawn
// behind all gameplay elements. The image file is located in the
// same directory as this script.
let backgroundImg;
let backgroundLoaded = false;

// Control when the game loop actively updates and moves the
// player. The game starts paused until the user clicks the begin
// button.
let gameRunning = false;

// Player object holds position, size, velocity and state flags.
const player = {
  x: 50,
  y: 500,
  width: 40,
  height: 60,
  vx: 0,
  vy: 0,
  onGround: false,
  color: '#FFD700',
  complete: false,
};

// Ground and goal definitions. Adjust positions and sizes here to
// tweak the level layout. Multiple hazards are stored in the
// `hazards` array below.
const ground = { x: 0, y: 560, width: GAME_WIDTH, height: 40, color: '#444444' };
const goal = { x: 740, y: 480, width: 40, height: 80, color: '#4CAF50' };

// Hazards array contains both static and moving hazards. Each
// hazard can optionally have a `dy` property indicating vertical
// speed and `rangeTop`/`rangeBottom` properties to constrain its
// movement. Static hazards omit these properties. Feel free to add
// more objects to this array to increase difficulty.
const hazards = [
  // Static hazard representing the primary soul trap
  { x: 400, y: 520, width: 50, height: 50, color: '#FF4C4C' },
  // Moving hazard that oscillates up and down within the specified range
  { x: 550, y: 510, width: 50, height: 50, color: '#8A2BE2', dy: 1.2, rangeTop: 480, rangeBottom: 540 },
];

// Input state
const keys = {};

// Canvas and rendering context
let canvas;
let ctx;

// Initialize the game once the window has loaded.
window.addEventListener('load', () => {
  initGame();
});

function initGame() {
  // Create and configure the canvas
  canvas = document.createElement('canvas');
  canvas.width = GAME_WIDTH;
  canvas.height = GAME_HEIGHT;
  ctx = canvas.getContext('2d');
  const container = document.getElementById('game-container');
  if (container) {
    container.appendChild(canvas);
  }

  // Load the background image. When it finishes loading we set
  // backgroundLoaded to true so draw() knows to render it.
  backgroundImg = new Image();
  backgroundImg.src = 'soul_background.png';
  backgroundImg.onload = () => {
    backgroundLoaded = true;
  };

  // Listen for keyboard input
  document.addEventListener('keydown', (e) => {
    keys[e.code] = true;
  });
  document.addEventListener('keyup', (e) => {
    keys[e.code] = false;
  });

  // Always start the game loop. Actual movement and updates only
  // occur when gameRunning is true, which happens after the user
  // clicks the Begin button.
  requestAnimationFrame(gameLoop);
}

// Main game loop: updates state and draws the frame.
function gameLoop() {
  // Update and draw regardless of game state, but only move
  // entities when gameRunning is true.
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

// Update the game state (physics and collision detection).
function update() {
  // Only update physics and collisions when the game is running
  // and the player hasn't reached the goal.
  if (!gameRunning || player.complete) return;

  // Horizontal movement
  if (keys['ArrowLeft']) {
    player.vx = -MOVE_SPEED;
  } else if (keys['ArrowRight']) {
    player.vx = MOVE_SPEED;
  } else {
    player.vx = 0;
  }

  // Jumping
  if (keys['ArrowUp'] && player.onGround) {
    player.vy = -JUMP_SPEED;
    player.onGround = false;
  }

  // Apply gravity
  player.vy += GRAVITY;

  // Update position
  player.x += player.vx;
  player.y += player.vy;

  // Keep player within horizontal bounds
  if (player.x < 0) player.x = 0;
  if (player.x + player.width > GAME_WIDTH) player.x = GAME_WIDTH - player.width;

  // Check collision with ground
  if (player.y + player.height > ground.y) {
    player.y = ground.y - player.height;
    player.vy = 0;
    player.onGround = true;
  }

  // Update moving hazards and check collisions
  hazards.forEach((hz) => {
    // If the hazard has vertical movement, update its position
    if (hz.dy) {
      hz.y += hz.dy;
      if (hz.y <= hz.rangeTop || hz.y + hz.height >= hz.rangeBottom) {
        hz.dy *= -1;
      }
    }
    // Collision detection with the player
    if (rectIntersect(player, hz)) {
      resetPlayer();
    }
  });

  // Check collision with goal
  if (rectIntersect(player, goal)) {
    completeLevel();
  }
}

// Draw everything on the canvas
function draw() {
  // Draw the background image if it has loaded; otherwise fill with
  // a dark colour. Drawing the background first ensures it sits
  // behind all other elements.
  if (backgroundLoaded) {
    ctx.drawImage(backgroundImg, 0, 0, GAME_WIDTH, GAME_HEIGHT);
  } else {
    ctx.fillStyle = '#0d0d0d';
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
  }

  // Draw instruction text only when the game is running. Before
  // starting, the introductory overlay contains narrative and
  // instructions.
  if (gameRunning) {
    ctx.fillStyle = '#ffffff';
    ctx.font = '20px Arial';
    ctx.fillText('Use arrow keys to move and jump', 10, 30);
    ctx.fillText('Avoid the soul traps', 10, 55);
    ctx.fillText('Seek the portal to Gnosis', 10, 80);
  }

  // Draw ground, hazards, goal and player
  drawRect(ground);
  hazards.forEach((hz) => drawRect(hz));
  drawRect(goal);
  drawRect(player);
}

// Helper to draw a filled rectangle
function drawRect(obj) {
  ctx.fillStyle = obj.color;
  ctx.fillRect(obj.x, obj.y, obj.width, obj.height);
}

// Axis-aligned bounding box collision detection
function rectIntersect(a, b) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

// Reset the player to the starting position and flash them briefly
function resetPlayer() {
  player.x = 50;
  player.y = 500;
  player.vx = 0;
  player.vy = 0;
  player.onGround = false;

  // Simple flash effect: toggle the player's visibility
  let flashes = 6;
  const flashInterval = setInterval(() => {
    player.color = player.color === '#FFD700' ? '#333333' : '#FFD700';
    flashes--;
    if (flashes <= 0) {
      clearInterval(flashInterval);
      player.color = '#FFD700';
    }
  }, 100);
}

// Called when the player reaches the goal
function completeLevel() {
  player.complete = true;
  // Wait a brief moment before showing the form to let the player
  // see they reached the portal.
  setTimeout(() => {
    showEmailForm();
  }, 300);
}

// Shows the email signup form and hides the game container
function showEmailForm() {
  const gameContainer = document.getElementById('game-container');
  const emailContainer = document.getElementById('email-container');
  if (gameContainer) gameContainer.style.display = 'none';
  if (emailContainer) emailContainer.style.display = 'block';
}

// Handles submission of the email form. Simply displays a thank-you
// message in this demo. Replace this with integration to your
// mailing list provider if desired.
function handleEmailSubmit(event) {
  event.preventDefault();
  const input = document.getElementById('email-input');
  const messageEl = document.getElementById('email-message');
  if (input && messageEl) {
    const email = input.value.trim();
    if (email) {
      messageEl.textContent = "Thank you! We'll be in touch.";
      input.value = '';
    } else {
      messageEl.textContent = 'Please enter a valid email address.';
    }
  }
}

// Called when the Begin button is clicked. Hides the intro overlay
// and starts updating the game state. Without calling this, the
// player remains static and the soul trap narrative overlay
// obscures the game.
function startGame() {
  // Hide the introduction overlay
  const intro = document.getElementById('intro-container');
  if (intro) intro.style.display = 'none';
  // Start the game updates
  gameRunning = true;
  // Focus the window so keyboard input is captured
  if (typeof window.focus === 'function') {
    window.focus();
  }
}