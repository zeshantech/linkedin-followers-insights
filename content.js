
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

  const selector = 'a[href*="/in/"]';
  const cards = document.querySelectorAll(selector);
  return cards;
}



async function addFollowerCountToCard(card) {
  if (card.dataset.followerAdded) {
    return;
  }
  card.dataset.followerAdded = true;

  const profileUrl = card.href.split('?')[0].replace(/\/$/, '');


  chrome.runtime.sendMessage(
    { type: 'FETCH_FOLLOWER_COUNT', profileUrl },
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



function getLinkedInMemberId() {

  const memberDiv = document.querySelector('div[role="listitem"][componentkey^="urn:li:member:"]');

  if (memberDiv) {
    const componentKey = memberDiv.getAttribute('componentkey');
    const memberIdMatch = componentKey.match(/urn:li:member:(\d+)/);

    if (memberIdMatch && memberIdMatch[1]) {
      return memberIdMatch[1];
    }
  }

  return null;
}
