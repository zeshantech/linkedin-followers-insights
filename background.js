// background.js

console.log("[Background] Service Worker Loaded.");

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'FETCH_FOLLOWER_COUNT') {
    console.log(request.profileUrl); // i want to get followers count for linkedin profile link
    sendResponse({ count: 1000 })
    return true;
  }
});