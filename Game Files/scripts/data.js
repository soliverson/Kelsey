// Data Setup and Utility Functions
// ------------------------------------------------------
// Reads photoCount and maxPrize from config.js, then builds
// the prizes, photos, and round schedule to match.

// ======================================================
// SETTINGS (from config.js, with safe limits)
// ======================================================

const MIN_PHOTOS = 14;
const MAX_PHOTOS = 21;
const MIN_MAX_PRIZE = 50;

const photoCount = Math.min(
  MAX_PHOTOS,
  Math.max(
    MIN_PHOTOS,
    Math.round(
      (typeof GAME_CONFIG !== "undefined" && GAME_CONFIG.photoCount) || 18
    )
  )
);

const maxPrize = Math.max(
  MIN_MAX_PRIZE,
  Math.round(
    (typeof GAME_CONFIG !== "undefined" && GAME_CONFIG.maxPrize) || 500
  )
);


// ======================================================
// PRIZE GENERATOR
// ======================================================

// Prizes are fractions of the top prize. These 18 fractions
// give $1, $5, $10, $25 ... $500 when the top prize is $500.
const BASE_FRACTIONS = [
  0.002, 0.01, 0.02, 0.05, 0.10, 0.15,
  0.20, 0.25, 0.30, 0.35, 0.40, 0.45,
  0.50, 0.60, 0.70, 0.80, 0.90, 1.00
];

// Added for 19, 20, 21 photos (in this order).
const EXTRA_FRACTIONS = [0.55, 0.65, 0.75];

// Removed for 17, 16, 15, 14 photos (in this order).
const REMOVED_FRACTIONS = [0.45, 0.25, 0.15, 0.35];

// How coarsely to round a prize so amounts look "nice".
function niceStep(value) {
  if (value < 10) return 1;
  if (value < 100) return 5;
  if (value < 500) return 25;
  if (value < 2000) return 50;
  if (value < 10000) return 100;
  return 500;
}

function buildPrizes(count, top) {

  let fractions = BASE_FRACTIONS.slice();

  if (count > 18) {
    fractions = fractions.concat(EXTRA_FRACTIONS.slice(0, count - 18));
  }

  if (count < 18) {
    const toRemove = REMOVED_FRACTIONS.slice(0, 18 - count);
    fractions = fractions.filter(f => !toRemove.includes(f));
  }

  fractions.sort((a, b) => a - b);

  const result = [];

  fractions.forEach((fraction, index) => {

    // The top prize is always exactly the amount the buyer chose.
    if (index === fractions.length - 1) {
      result.push(top);
      return;
    }

    const raw = fraction * top;
    const step = niceStep(raw);
    const previous = result.length ? result[result.length - 1] : 0;

    // Try the "nice" rounding first, then finer rounding,
    // so every prize is higher than the last and below the top.
    let value = null;

    for (const s of [step, Math.max(1, step / 5), 1]) {
      const candidate = Math.max(1, Math.round(raw / s) * s);
      if (candidate > previous && candidate < top) {
        value = candidate;
        break;
      }
    }

    if (value === null) value = previous + 1;

    result.push(value);
  });

  // Safety check: if anything went wrong, spread prizes evenly.
  const valid =
    result.length === count &&
    result.every((v, i) => i === 0 || v > result[i - 1]) &&
    result[result.length - 1] === top;

  if (!valid) {
    return Array.from({ length: count }, (_, i) =>
      i === count - 1 ? top : Math.max(1, Math.round(((i + 1) * top) / count))
    );
  }

  return result;
}

const prizes = buildPrizes(photoCount, maxPrize);


// ======================================================
// ROUND SCHEDULE
// ======================================================

// How many photos to reveal before each offer.
// Each list adds up to (photoCount - 2); the last photo
// leads straight into the final swap decision.
const ROUNDS_BY_COUNT = {
  14: [3, 2, 2, 2, 1, 1, 1],
  15: [3, 3, 2, 2, 1, 1, 1],
  16: [4, 3, 2, 2, 1, 1, 1],
  17: [4, 3, 3, 2, 1, 1, 1],
  18: [4, 3, 3, 2, 2, 1, 1],
  19: [5, 3, 3, 2, 2, 1, 1],
  20: [5, 4, 3, 2, 2, 1, 1],
  21: [5, 4, 3, 3, 2, 1, 1]
};

const rounds = ROUNDS_BY_COUNT[photoCount];


// ======================================================
// BOXES, PRIZES, AND PHOTOS
// ======================================================

const boxes = Array.from({ length: photoCount }, (_, i) => i + 1);
let boxValues = {};

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

shuffle(prizes);

boxes.forEach((box, index) => {
  boxValues[box] = prizes[index];
});

// Random Image Assignment
const images = Array.from({ length: photoCount }, (_, i) => `Game Files/images/${i + 1}.webp`);
shuffle(images);
const boxImages = {};
boxes.forEach((box, index) => {
  boxImages[box] = images[index];
});

// Game State Variables
let chosenBox = null;
let openedStatus = {};
let valuesRemaining = prizes.slice();
let currentRound = 0;
let openedCount = 0;
let offersHistory = [];
let offerActive = false;
let finalSwapActive = false;
