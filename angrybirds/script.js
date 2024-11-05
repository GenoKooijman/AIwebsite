// Import Matter.js components
const {
  Engine,
  Render,
  World,
  Bodies,
  Mouse,
  MouseConstraint,
  Constraint,
  Vector,
  Events,
} = Matter;

// Set up canvas and Matter.js engine
const canvas = document.getElementById("gameCanvas");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const engine = Engine.create();
const world = engine.world;

// Set up renderer to display the game
const render = Render.create({
  canvas: canvas,
  engine: engine,
  options: {
    width: canvas.width,
    height: canvas.height,
    wireframes: false,
    background: "#87CEEB",
  },
});
Render.run(render);
Engine.run(engine);

// Create ground
const ground = Bodies.rectangle(
  canvas.width / 2,
  canvas.height - 20,
  canvas.width,
  40,
  { isStatic: true }
);
World.add(world, ground);

// Position for slingshot anchor point, closer to center
const slingshotAnchorX = canvas.width / 3;
const slingshotAnchorY = canvas.height - 150;

// Create the bird (projectile)
let bird = Bodies.circle(slingshotAnchorX, slingshotAnchorY, 20, {
  density: 0.005,
});
World.add(world, bird);

// Create the slingshot constraint
const sling = Constraint.create({
  pointA: { x: slingshotAnchorX, y: slingshotAnchorY },
  bodyB: bird,
  stiffness: 0.1, // Increased stiffness for added tension
  length: 20, // Short length to simulate a taut slingshot
});
World.add(world, sling);

// Flag to control the visibility of the slingshot line
let slingVisible = true;

// Mouse control for dragging and releasing the bird
const mouse = Mouse.create(render.canvas);
const mouseConstraint = MouseConstraint.create(engine, {
  mouse: mouse,
  constraint: {
    stiffness: 0.1,
    render: { visible: false },
  },
});
World.add(world, mouseConstraint);
render.mouse = mouse;

// Apply force on release and hide the slingshot
Events.on(mouseConstraint, "enddrag", function (event) {
  if (event.body === bird) {
    // Calculate direction and magnitude of the pullback
    const pullbackVector = Vector.sub(sling.pointA, bird.position);
    const pullbackMagnitude = Vector.magnitude(pullbackVector);

    // Detach bird from slingshot and hide slingshot line
    sling.bodyB = null;
    slingVisible = false; // Hide the slingshot line

    // Apply force to bird for launch
    const forceMagnitude = pullbackMagnitude * 0.005; // Adjust force if needed
    const forceVector = Vector.mult(
      Vector.normalise(pullbackVector),
      forceMagnitude
    );
    Matter.Body.applyForce(bird, bird.position, forceVector);
  }
});

// Custom rendering to control slingshot visibility
Events.on(render, "beforeRender", function () {
  if (!slingVisible) {
    render.context.clearRect(0, 0, render.canvas.width, render.canvas.height); // Clear previous frames
  }
});

// Function to reset the bird and make the slingshot line visible again
function resetBird() {
  bird = Bodies.circle(slingshotAnchorX, slingshotAnchorY, 20, {
    density: 0.005,
  });
  World.add(world, bird);
  sling.bodyB = bird; // Reattach to the slingshot
  slingVisible = true; // Show slingshot line again
}

// Listen for space key to reset the bird
document.addEventListener("keydown", function (event) {
  if (event.code === "Space") {
    resetBird(); // Reset the bird position on space key press
  }
});

// --- Add Blocks and Targets ---

// Function to create a block
function createBlock(x, y, width, height) {
  return Bodies.rectangle(x, y, width, height, {
    restitution: 0.4,
    friction: 0.5,
  });
}

// Array to hold target bodies
let targets = [];

// Function to generate multiple structures and targets
function generateStructuresWithTargets() {
  const structureCount = 3; // Number of structures to create
  const blockWidth = 60; // Width of the blocks
  const blockHeight = 30; // Height of the blocks
  const baseY = canvas.height - 100; // Base Y position for the structures

  for (let i = 0; i < structureCount; i++) {
    const blockX = canvas.width * (0.5 + i * 0.2); // Different X positions for each structure
    const levels = Math.floor(2 + Math.random() * 3); // Random number of levels (2-4)

    // Create a stack of blocks
    for (let j = 0; j < levels; j++) {
      const y = baseY - j * (blockHeight + 5); // Space between levels
      const block = createBlock(blockX, y, blockWidth, blockHeight);
      World.add(world, block);
      if (j === levels - 1) {
        // If this is the last level, create a target on top of it
        const target = Bodies.circle(blockX, y - blockHeight / 2 - 20, 20, {
          // Position above the block
          isStatic: false,
          restitution: 0.8,
          friction: 0.5,
          render: { fillStyle: "red" },
        });
        World.add(world, target);
        targets.push(target); // Add target to the targets array
      }
    }
  }
}

// Function to reset the level by generating new structures and targets
function resetLevel() {
  targets.forEach((target) => {
    if (target) {
      World.remove(world, target); // Remove target from the world
    }
  });
  targets = []; // Clear the targets array

  World.remove(world, bird); // Remove the bird from the world
  resetBird(); // Reset the bird
  generateStructuresWithTargets(); // Generate new structures and targets
}

// Event listener to check for collisions
Events.on(engine, "collisionStart", function (event) {
  event.pairs.forEach((collision) => {
    const { bodyA, bodyB } = collision;

    // Check if the bird collides with a target
    if (bodyA === bird || bodyB === bird) {
      const target = bodyA === bird ? bodyB : bodyA; // Identify the target hit
      if (targets.includes(target)) {
        World.remove(world, target); // Remove the target from the world
        targets = targets.filter((t) => t !== target); // Remove it from the targets array

        // Check if there are no more targets
        if (targets.length === 0) {
          resetLevel(); // Reset the level if all targets are eliminated
        }
      }
    }
  });
});

// Additional listener to check if targets hit the ground
Events.on(engine, "afterUpdate", function () {
  targets.forEach((target) => {
    // Check if target is below the ground level
    if (target.position.y > canvas.height - 20) {
      World.remove(world, target); // Remove the target from the world
      targets = targets.filter((t) => t !== target); // Remove it from the targets array
    }
  });

  // Check if bird is below the ground level
  if (bird.position.y > canvas.height - 20) {
    World.remove(world, bird); // Remove the bird from the world
    resetBird(); // Reset the bird if it hits the ground
  }

  // If no targets remain, reset the level
  if (targets.length === 0) {
    resetLevel(); // Reset the level if all targets are eliminated
  }
});

// Generate the structures and their targets
generateStructuresWithTargets();
