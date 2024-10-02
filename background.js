// background.js

console.log("[Background] Service Worker Loaded.");

// Listener for messages from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log(`[Background] Received message: ${JSON.stringify(request)}`);
  
  if (request.type === 'FETCH_FOLLOWER_COUNT') {
    console.log(`[Background] Fetching follower count for URL: ${request.profileUrl}`);
    
    fetchFollowerCount(request.profileUrl).then(count => {
      console.log(`[Background] Follower count for ${request.profileUrl}: ${count}`);
      sendResponse({ count });
    }).catch(error => {
      console.error(`[Background] Error fetching follower count for ${request.profileUrl}:`, error);
      sendResponse({ count: null });
    });
    
    // Indicate that the response is asynchronous
    return true;
  }
});

// Function to fetch follower count from a LinkedIn profile
async function fetchFollowerCount(profileUrl) {
  // Check if the count is cached
  return new Promise((resolve) => {
    chrome.storage.local.get([profileUrl], async (result) => {
      if (result[profileUrl]) {
        console.log(`[Background] Retrieved cached count for ${profileUrl}: ${result[profileUrl]}`);
        resolve(result[profileUrl]);
      } else {
        console.log(`[Background] No cached count for ${profileUrl}. Fetching from network...`);
        try {
          const response = await fetch(profileUrl, {
            credentials: 'include',
            headers: {
              'Accept': 'text/html'
            }
          });

          console.log(`[Background] Fetch response status for ${profileUrl}: ${response.status}`);

          if (!response.ok) {
            console.error(`[Background] Failed to fetch profile: ${response.status} for URL: ${profileUrl}`);
            resolve(null);
            return;
          }

          const htmlText = await response.text();
          const parser = new DOMParser();
          const doc = parser.parseFromString(htmlText, 'text/html');

          // **Enhanced Selector:** Find a <span> containing 'Followers' and extract the number
          const followerElement = Array.from(doc.querySelectorAll('span'))
            .find(span => span.textContent.includes('Followers'));

          if (followerElement) {
            // Extract the numerical part using regex
            const countText = followerElement.textContent.trim();
            const countMatch = countText.match(/(\d+,?\d*)\sFollowers/i);
            const count = countMatch ? countMatch[1].replace(/,/g, '') : null;

            if (count) {
              console.log(`[Background] Extracted follower count for ${profileUrl}: ${count}`);
              // Cache the result
              const data = {};
              data[profileUrl] = count;
              chrome.storage.local.set(data, () => {
                console.log(`[Background] Cached follower count for ${profileUrl}: ${count}`);
                resolve(count);
              });
            } else {
              console.warn(`[Background] Unable to parse follower count for URL: ${profileUrl}`);
              resolve(null);
            }
          } else {
            console.warn(`[Background] Follower count element not found for URL: ${profileUrl}`);
            resolve(null);
          }
        } catch (error) {
          console.error(`[Background] Error fetching follower count for ${profileUrl}:`, error);
          resolve(null);
        }
      }
    });
  });
}
