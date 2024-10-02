// content.js

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
  // **IMPORTANT:** Update the selector below based on LinkedIn's current DOM structure for profile cards in the My Network tab.
  // Example selector; you must inspect LinkedIn's DOM to find the accurate one.
  return document.querySelectorAll('a[data-control-name="connection_profile"]'); // TODO: Update selector
}

// Function to add follower count to a profile card
async function addFollowerCountToCard(card) {
  if (card.dataset.followerAdded) return; // Prevent duplicate processing
  card.dataset.followerAdded = true;

  const profileUrl = card.href;

  // Send a message to background.js to fetch follower count
  chrome.runtime.sendMessage(
    { type: 'FETCH_FOLLOWER_COUNT', profileUrl },
    (response) => {
      const count = response.count;
      if (count) {
        // Create a new element to display follower count
        const followerDiv = document.createElement('div');
        followerDiv.className = 'follower-count';
        followerDiv.innerText = `Followers: ${count}`;

        // **IMPORTANT:** Adjust the insertion point based on LinkedIn's DOM structure.
        // Example: Append after the profile name or other relevant element.
        // Here, we're appending it as a child of the card's parent element.
        card.parentElement.appendChild(followerDiv);
      }
    }
  );
}

// Function to process all profile cards on the page
const processProfileCards = debounce(() => {
  const cards = getProfileCards();
  cards.forEach(card => {
    addFollowerCountToCard(card);
  });
}, 1000); // Debounce time in ms

// Initialize the script
function init() {
  processProfileCards();

  // Observe changes in the DOM to handle dynamically loaded content
  const observer = new MutationObserver(() => {
    processProfileCards();
  });

  observer.observe(document.body, { childList: true, subtree: true });
}

// Run the initialization after the DOM is fully loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
