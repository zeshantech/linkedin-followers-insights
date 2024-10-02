// background.js

// Listener for messages from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'FETCH_FOLLOWER_COUNT') {
      fetchFollowerCount(request.profileUrl).then(count => {
        sendResponse({ count });
      });
      // Indicate that the response is asynchronous
      return true;
    }
  });
  
  // Function to fetch follower count from a LinkedIn profile
  async function fetchFollowerCount(profileUrl) {
    // Check if the count is cached
    return new Promise((resolve) => {
      chrome.storage.local.get(profileUrl, async (result) => {
        if (result[profileUrl]) {
          resolve(result[profileUrl]);
        } else {
          try {
            const response = await fetch(profileUrl, {
              credentials: 'include',
              headers: {
                'Accept': 'text/html'
              }
            });
  
            if (!response.ok) {
              console.log(`Failed to fetch profile: ${response.status}`);
              resolve(null);
              return;
            }
  
            const htmlText = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(htmlText, 'text/html');
  
            // **IMPORTANT:** Replace the selector below with the actual selector that targets the follower count on LinkedIn profiles.
            const followerElement = doc.querySelector('.follower-count-selector'); // TODO: Update selector
  
            if (followerElement) {
              const count = followerElement.innerText.trim();
              // Cache the result
              const data = {};
              data[profileUrl] = count;
              chrome.storage.local.set(data, () => {
                resolve(count);
              });
            } else {
              resolve(null);
            }
          } catch (error) {
            console.log('Error fetching follower count:', error);
            resolve(null);
          }
        }
      });
    });
  }
  