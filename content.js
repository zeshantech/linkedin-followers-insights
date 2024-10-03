// content.js

console.log("[Content] Content script loaded.");

// Listener for messages from popup or background
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log(`[Content] Received message: ${JSON.stringify(request)}`);

  if (request.type === 'START_FETCH') {
    console.log("[Content] Starting follower count fetch process.");
    processProfileCards();
    sendResponse({ status: 'Fetch initiated.' });
  }
});

// Utility function to debounce rapid function calls
function debounce(func, wait) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

// Function to extract profile URLs from profile cards
function getProfileCards() {
  // Updated selector based on inspection
  const selector = 'a[href*="/in/"]'; // Replace with the accurate selector after inspection
  const cards = document.querySelectorAll(selector);
  console.log(`[Content] Found ${cards.length} profile cards using selector: '${selector}'`);
  return cards;
}


// Function to add follower count to a profile card
async function addFollowerCountToCard(card) {
  if (card.dataset.followerAdded) {
    console.log("[Content] Follower count already added to this card. Skipping...");
    return; // Prevent duplicate processing
  }
  card.dataset.followerAdded = true;

  const profileUrl = card.href.split('?')[0].replace(/\/$/, ''); // Standardize URL
  console.log(`[Content] Processing profile URL: ${profileUrl}`);

  // Send a message to background.js to fetch follower count
  chrome.runtime.sendMessage(
    { type: 'FETCH_FOLLOWER_COUNT', profileUrl },
    (response) => {
      if (chrome.runtime.lastError) {
        console.error(`[Content] Error in sendMessage: ${chrome.runtime.lastError.message}`);
        return;
      }

      const count = response.count;
      if (count) {
        console.log(`[Content] Received follower count for ${profileUrl}: ${count}`);
        // Create a new element to display follower count
        const followerDiv = document.createElement('div');
        followerDiv.className = 'follower-count';
        followerDiv.innerText = `Followers: ${count}`;

        // Adjust the insertion point as needed based on LinkedIn's DOM
        card.parentElement.appendChild(followerDiv);
        console.log(`[Content] Added follower count to the DOM for ${profileUrl}`);
      } else {
        console.warn(`[Content] No follower count found for ${profileUrl}`);
      }
    }
  );
}

// Function to process all profile cards on the page
const processProfileCards = debounce(() => {
  console.log("[Content] Processing profile cards...");
  const cards = getProfileCards();
  cards.forEach(card => {
    addFollowerCountToCard(card);
  });
}, 1000); // Debounce time in ms

// Initialize the script
function init() {
  console.log("[Content] Initializing content script...");

  // Optionally, automatically start processing on page load
  // processProfileCards();

  // Observe changes in the DOM to handle dynamically loaded content
  const observer = new MutationObserver((mutationsList) => {
    console.log("[Content] DOM mutations detected. Reprocessing profile cards...");
    processProfileCards();
  });

  observer.observe(document.body, { childList: true, subtree: true });
  console.log("[Content] MutationObserver set up.");
}

// Run the initialization after the DOM is fully loaded
if (document.readyState === 'loading') {
  console.log("[Content] Document is loading. Waiting for DOMContentLoaded...");
  document.addEventListener('DOMContentLoaded', init);
} else {
  console.log("[Content] Document already loaded. Initializing...");
  init();
}
