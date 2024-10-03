// content.js

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'START_FETCH') {
    processProfileCards();
    sendResponse({ status: 'Fetch initiated.' });
  }
});

function debounce(func, wait) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

function getProfileCards() {
  // Improved selector to target profile cards more accurately
  const selector = 'a[href*="/in/"]:not([href*="detail/"])';
  const cards = document.querySelectorAll(selector);
  return Array.from(cards);
}

async function addFollowerCountToCard(card) {
  if (card.dataset.followerAdded) {
    return;
  }
  card.dataset.followerAdded = true;

  const profileUrl = card.href.split('?')[0].replace(/\/$/, '');
  const memberId = getLinkedInMemberId(card);

  if (!memberId) {
    console.warn(`[Content] Unable to extract Member ID for ${profileUrl}`);
    return;
  }

  chrome.runtime.sendMessage(
    { type: 'FETCH_FOLLOWER_COUNT', memberId },
    (response) => {
      if (chrome.runtime.lastError) {
        console.error(`[Content] Error in sendMessage: ${chrome.runtime.lastError.message}`);
        return;
      }

      const count = response.count;
      if (count) {
        const followerDiv = document.createElement('div');
        followerDiv.className = 'follower-count';
        followerDiv.innerText = `Followers: ${count}`;
        followerDiv.style.marginTop = '5px'; // Optional: Add some styling

        card.parentElement.appendChild(followerDiv);
      } else {
        console.warn(`[Content] No follower count found for ${profileUrl}`);
      }
    }
  );
}

const processProfileCards = debounce(() => {
  const cards = getProfileCards();
  cards.forEach(card => {
    addFollowerCountToCard(card);
  });
}, 1000);

function init() {
  const observer = new MutationObserver((mutationsList) => {
    processProfileCards();
  });

  observer.observe(document.body, { childList: true, subtree: true });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

function getLinkedInMemberId(card) {
  // Use closest to find the nearest ancestor div with the specified attributes
  const memberDiv = card.closest('div[role="listitem"][componentkey^="urn:li:member:"]');

  if (memberDiv) {
    const componentKey = memberDiv.getAttribute('componentkey');
    const memberIdMatch = componentKey.match(/urn:li:member:(\d+)/);

    if (memberIdMatch && memberIdMatch[1]) {
      return memberIdMatch[1];
    }
  }

  return null;
}
