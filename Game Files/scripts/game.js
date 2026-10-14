// ======================================================
// GAME STATE / FLAGS
// ======================================================

// Prevents the Chance It button from being handled twice.
let declineHandled = false;


// ======================================================
// BRIEFCASE CLICK
// ======================================================

function briefcaseClicked(box) {

  // ------------------------------------------------------
  // FIRST CLICK: Choose the player's personal pick
  // ------------------------------------------------------
  if (!chosenBox) {

    chosenBox = box;

    const casesToOpen = rounds[currentRound];

    // Update the board so the selected personal pick
    // is highlighted immediately.
    renderBriefcases();
    updateSidePanels();

    // Prevent any other photos from being clicked
    // while the personal-pick reveal is showing.
    offerActive = true;

    const briefcase =
      document.getElementById("briefcase-" + box);

    // Make a large clone of the chosen personal pick.
    const clone = briefcase.cloneNode(true);

    clone.innerHTML = `
      <img
        class="center-img"
        src="${boxImages[box]}"
        alt="Personal Pick ${box}"
      >

      <div class="personal-box-message">
        THIS IS YOUR PICK!
      </div>

      <div class="center-amount">
        Pick #${box}
      </div>
    `;

    clone.classList.add("center-open");
    clone.classList.add("personal-box-reveal");

    // Prevent the large reveal from reacting to mouse hover.
    clone.style.pointerEvents = "none";

    document.body.appendChild(clone);


    // ------------------------------------------------------
    // Show personal pick reveal for 5 seconds
    // ------------------------------------------------------
    setTimeout(() => {

      clone.remove();

      // After the reveal, show the instruction popup.
      document.getElementById("offerDetails").innerHTML = `
        <p class="message">
          Your personal pick is
          <strong>#${box}</strong>
        </p>

        <p class="cases-to-open">
          Now choose
          <strong>${casesToOpen}</strong>
          photo${casesToOpen === 1 ? "" : "s"} to reveal.
        </p>
      `;

      document.getElementById("offerModal").style.display =
        "flex";


      // Keep this instruction visible for 6 seconds.
      setTimeout(() => {

        document.getElementById("offerModal").style.display =
          "none";

        document.getElementById("gameMessage").textContent =
          `Choose ${casesToOpen} photo${casesToOpen === 1 ? "" : "s"} to reveal.`;

        offerActive = false;

      }, 6000);

    }, 5000);

    return;
  }


  // ------------------------------------------------------
  // NORMAL GAME PLAY
  // ------------------------------------------------------

  // Don't allow the player's personal pick to be revealed.
  if (box === chosenBox) return;

  // Don't allow an already-revealed photo to be selected again.
  if (openedStatus[box]) return;

  openBriefcase(box);

  updateSidePanels();
}


// ======================================================
// REVEAL A PHOTO
// ======================================================

function openBriefcase(box) {

  openedStatus[box] = true;

  const briefcase =
    document.getElementById("briefcase-" + box);

  const clone = briefcase.cloneNode(true);

  clone.innerHTML = `
    <img
      class="center-img"
      src="${boxImages[box]}"
      alt="Image ${box}"
    >

    <div class="center-amount">
      $${boxValues[box].toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })}
    </div>
  `;

  clone.classList.add("center-open");

  // Prevent hover from moving/glitching the large image.
  clone.style.pointerEvents = "none";

  document.body.appendChild(clone);


  // ------------------------------------------------------
  // Remove prize value from remaining values
  // ------------------------------------------------------

  const idx =
    valuesRemaining.indexOf(boxValues[box]);

  if (idx > -1) {
    valuesRemaining.splice(idx, 1);
  }


  // Count revealed photo.
  openedCount++;

  renderBriefcases();
  updateSidePanels();


  // ------------------------------------------------------
  // Find unrevealed picks besides personal pick
  // ------------------------------------------------------

  const unopened = boxes.filter(
    b => !openedStatus[b] && b !== chosenBox
  );


  // ------------------------------------------------------
  // Update instructions after each revealed photo
  // ------------------------------------------------------

  if (currentRound < rounds.length) {

    const casesNeeded =
      rounds[currentRound];

    const casesLeftThisRound =
      Math.max(
        casesNeeded - openedCount,
        0
      );

    if (casesLeftThisRound > 0) {

      document.getElementById("gameMessage").textContent =
        `Choose ${casesLeftThisRound} more photo${casesLeftThisRound === 1 ? "" : "s"} to reveal.`;
    }
  }


  // ------------------------------------------------------
  // FINAL TWO PICKS
  // ------------------------------------------------------

  if (
    unopened.length === 1 &&
    !finalSwapActive
  ) {

    setTimeout(() => {
      finalSwap();
    }, 500);

    setTimeout(() => {
      clone.remove();
    }, 6000);

    return;
  }


  // ------------------------------------------------------
  // OFFER
  // ------------------------------------------------------

  if (
    currentRound < rounds.length &&
    openedCount >= rounds[currentRound]
  ) {

    offerActive = true;

    document.getElementById("gameMessage").textContent =
      "Waiting for your offer...";

    // Wait until the enlarged picture disappears.
    setTimeout(() => {

      playSound("offerSound");

      offerDeal();

      // Reset revealed photo count for next round.
      openedCount = 0;

    }, 5500);
  }


  // Remove large revealed-photo image after 5 seconds.
  setTimeout(() => {
    clone.remove();
  }, 5000);
}


// ======================================================
// FINAL SWAP
// ======================================================

function finalSwap() {

  if (finalSwapActive) return;

  finalSwapActive = true;
  offerActive = true;

  stopSound("suspenseMusic");

  const finalHTML = `
    <p class="message">
      Final Decision
    </p>

    <p class="message">
      Do you want to keep your personal pick
      or swap it with the last remaining pick?
    </p>

    <button
      class="deal"
      onclick="keepBox()"
    >
      Keep My Pick
    </button>

    <button
      class="decline"
      onclick="swapBox()"
    >
      Swap My Pick
    </button>
  `;

  document.getElementById("offerDetails").innerHTML =
    finalHTML;

  document.getElementById("offerModal").style.display =
    "flex";

  playSound("finalSwapMusic");
}


// ======================================================
// KEEP PERSONAL PICK
// ======================================================

function keepBox() {

  stopSound("suspenseMusic");
  stopSound("finalSwapMusic");

  const resultHTML = `
    <p class="message">
      You kept your personal pick
      (#${chosenBox}).
    </p>

    <p class="message">
      It contains:
      $${boxValues[chosenBox].toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })}
    </p>

    <button onclick="playAgain()">
      Play Again
    </button>
  `;

  document.getElementById("offerDetails").innerHTML =
    resultHTML;

  document
    .querySelector(".modal-content")
    .classList.add("result-modal");

  playSound("applause");

  launchFireworks();
}


// ======================================================
// SWAP PERSONAL PICK
// ======================================================

function swapBox() {

  stopSound("suspenseMusic");
  stopSound("finalSwapMusic");

  const unopened = boxes.filter(
    b => !openedStatus[b] && b !== chosenBox
  );

  const newBox = unopened[0];

  chosenBox = newBox;

  const resultHTML = `
    <p class="message">
      You swapped your pick.
    </p>

    <p class="message">
      Your new pick (#${chosenBox}) contains:
      $${boxValues[chosenBox].toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })}
    </p>

    <button onclick="playAgain()">
      Play Again
    </button>
  `;

  document.getElementById("offerDetails").innerHTML =
    resultHTML;

  document
    .querySelector(".modal-content")
    .classList.add("result-modal");

  playSound("applause");

  launchFireworks();
}


// ======================================================
// OFFER CALCULATION
// ======================================================

function getBankersOffer(values) {

  // Average value of all prizes still on the board.
  const sum = values.reduce(
    (acc, curr) => acc + curr,
    0
  );

  const average = sum / values.length;


  // Offers become more generous as the game progresses.
  const offerPercentages = [
    0.35, // Round 1
    0.45, // Round 2
    0.55, // Round 3
    0.65, // Round 4
    0.75, // Round 5
    0.85, // Round 6
    0.90, // Round 7
    0.95, // Round 8
    1.00  // Final rounds
  ];


  const percentage =
    offerPercentages[currentRound] ?? 1;


  // Base the offer on what is actually left on the board.
  let offer = average * percentage;


  // Keep early offers reasonable. The caps scale with the top
  // prize chosen in config.js (4% and 6% of it, which is
  // $20 and $30 when the top prize is $500).
  if (currentRound === 0) {
    offer = Math.min(offer, maxPrize * 0.04);
  }

  if (currentRound === 1) {
    offer = Math.min(offer, maxPrize * 0.06);
  }


  // Add a small amount of variation so offers feel less mechanical.
  // This changes the calculated offer by roughly -4% to +4%.
  const variation =
    0.96 + (Math.random() * 0.08);

  offer *= variation;


  // Round to cents instead of the nearest $5.
  offer = Math.round(offer * 100) / 100;


  // Never allow an offer to exceed the highest
  // prize still available on the board.
  const highestRemaining =
    Math.max(...values);

  offer = Math.min(
    offer,
    highestRemaining
  );


  // Make sure the offer is never exactly the same
  // as any previous offer.
  let attempts = 0;

  while (
    offersHistory.includes(offer) &&
    attempts < 100
  ) {

    // Adjust by a random number of cents.
    const adjustment =
      (Math.floor(Math.random() * 99) + 1) / 100;

    if (attempts % 2 === 0) {
      offer += adjustment;
    } else {
      offer -= adjustment;
    }

    // Keep it within sensible limits.
    offer = Math.max(0.01, offer);
    offer = Math.min(
      offer,
      highestRemaining
    );

    offer =
      Math.round(offer * 100) / 100;

    attempts++;
  }


  return offer;
}

// ======================================================
// SHOW OFFER
// ======================================================

function offerDeal() {

  const offer =
    getBankersOffer(valuesRemaining);

  offersHistory.push(offer);

  updateOffersHistory();

  const offerHTML = `
    <p class="message">
      Your offer is:
    </p>

    <p class="bank-offer">
      $${offer.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })}
    </p>

    <p class="message">
      Cash It or Chance It?
    </p>

    <button
      class="deal"
      onclick="acceptDeal(${offer})"
    >
      Cash It
    </button>

    <button
      class="decline"
      onclick="declineDealModal()"
    >
      Chance It
    </button>
  `;

  document.getElementById("offerDetails").innerHTML =
    offerHTML;

  document.getElementById("offerModal").style.display =
    "flex";

  playSound("suspenseMusic");
}


// ======================================================
// CASH IT
// ======================================================

function acceptDeal(offer) {

  stopSound("suspenseMusic");

  const resultHTML = `
    <p class="message">
      You cashed it for
      $${offer.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })}!
    </p>

    <p class="message">
      Your personal pick (#${chosenBox}) contained:
      $${boxValues[chosenBox].toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })}
    </p>

    <button onclick="playAgain()">
      Play Again
    </button>
  `;

  document.getElementById("offerDetails").innerHTML =
    resultHTML;

  document
    .querySelector(".modal-content")
    .classList.add("result-modal");

  playSound("applause");

  launchFireworks();
}


// ======================================================
// CHANCE IT
// ======================================================

function declineDealModal() {

  if (declineHandled) return;

  declineHandled = true;

  stopSound("suspenseMusic");

  playSound("declineSound");


  // ------------------------------------------------------
  // Move to next round
  // ------------------------------------------------------

  currentRound++;

  let casesToOpen;

  if (currentRound < rounds.length) {
    casesToOpen =
      rounds[currentRound];
  } else {
    casesToOpen = 1;
  }


  const roundName =
    currentRound < rounds.length
      ? `Round ${currentRound + 1}`
      : "Final Round";


  // ------------------------------------------------------
  // Tell player how many photos to reveal
  // ------------------------------------------------------

  document.getElementById("offerDetails").innerHTML = `
    <p class="message">
      CHANCE IT!
    </p>

    <p class="round-number">
      ${roundName}
    </p>

    <p class="cases-to-open">
      Choose
      <strong>${casesToOpen}</strong>
      more photo${casesToOpen === 1 ? "" : "s"} to reveal.
    </p>
  `;

  document.getElementById("offerModal").style.display =
    "flex";


  // Keep Chance It / next-round instruction visible
  // for 6 seconds.
  setTimeout(() => {

    document.getElementById("offerModal").style.display =
      "none";

    renderBriefcases();

    updateSidePanels();

    document.getElementById("gameMessage").textContent =
      `Choose ${casesToOpen} photo${casesToOpen === 1 ? "" : "s"} to reveal.`;

    offerActive = false;

    declineHandled = false;

  }, 6000);
}


// ======================================================
// PLAY AGAIN
// ======================================================

function playAgain() {
  window.location.reload();
}


// ======================================================
// ROUND / STARTING INSTRUCTION MODAL
// ======================================================

function showRoundModal(roundDisplay) {

  let roundHTML;


  // ------------------------------------------------------
  // START OF GAME
  // ------------------------------------------------------

  // At the very beginning,
  // ONLY ask the player to choose a personal pick.
  if (
    roundDisplay === 1 &&
    !chosenBox
  ) {

    roundHTML = `
      <p class="message">
        Welcome to Cash It or Chance It!
      </p>

      <p class="cases-to-open">
        Choose your personal pick.
      </p>
    `;

  } else {

    // ----------------------------------------------------
    // NORMAL ROUND ANNOUNCEMENT
    // ----------------------------------------------------

    const roundIndex =
      roundDisplay - 1;

    const casesToOpen =
      rounds[roundIndex] ?? 1;

    roundHTML = `
      <p class="message">
        Round ${roundDisplay}
      </p>

      <p class="cases-to-open">
        Choose
        <strong>${casesToOpen}</strong>
        photo${casesToOpen === 1 ? "" : "s"} to reveal.
      </p>
    `;
  }


  document.getElementById("offerDetails").innerHTML =
    roundHTML;

  document.getElementById("offerModal").style.display =
    "flex";


  // Initial "Choose your personal pick"
  // message stays up for 5 seconds.
  setTimeout(() => {

    document.getElementById("offerModal").style.display =
      "none";

    document
      .querySelector(".modal-content")
      .classList.remove("result-modal");

    if (!chosenBox) {

      document.getElementById("gameMessage").textContent =
        "Choose your personal pick.";
    }

  }, 5000);
}