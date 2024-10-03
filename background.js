// // background.js

// console.log("[Background] Service Worker Loaded.");

// // Listener for messages from content scripts and popup
// chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
//   console.log(`[Background] Received message: ${JSON.stringify(request)}`);

//   if (request.type === 'FETCH_FOLLOWER_COUNT') {
//     console.log(`[Background] Fetching follower count for URL: ${request.profileUrl}`);

//     fetchFollowerCount(request.profileUrl)
//       .then(count => {
//         console.log(`[Background] Follower count for ${request.profileUrl}: ${count}`);
//         sendResponse({ count });
//       })
//       .catch(error => {
//         console.error(`[Background] Error fetching follower count for ${request.profileUrl}:`, error);
//         sendResponse({ count: null });
//       });

//     // Indicate that the response is asynchronous
//     return true;
//   }
// });

// // Function to fetch follower count from a LinkedIn profile using RegEx
// async function fetchFollowerCount(profileUrl) {
//   return new Promise((resolve) => {
//     chrome.storage.local.get([profileUrl], async (result) => {
//       if (result[profileUrl]) {
//         console.log(`[Background] Retrieved cached count for ${profileUrl}: ${result[profileUrl]}`);
//         resolve(result[profileUrl]);
//       } else {
//         console.log(`[Background] No cached count for ${profileUrl}. Fetching from network...`);
//         try {
//           const response = await fetch(profileUrl, {
//             credentials: 'include',
//             headers: {
//               'Accept': 'text/html'
//             }
//           });

//           console.log(`[Background] Fetch response status for ${profileUrl}: ${response.status}`);

//           if (!response.ok) {
//             console.error(`[Background] Failed to fetch profile: ${response.status} for URL: ${profileUrl}`);
//             resolve(null);
//             return;
//           }

//           const htmlText = await response.text();
//           console.log('------------------------------------',htmlText, "------------------------------------");


//           // **IMPORTANT:** Update the RegEx pattern below based on LinkedIn's actual HTML structure.
//           // Example: Assuming follower count is within a span like <span class="follower-count">1,234 Followers</span>
//           const regex = /<span[^>]*class="[^"]*follower-count[^"]*"[^>]*>([\d,]+)\s*Followers<\/span>/i;
//           const match = htmlText.match(regex);

//           if (match && match[1]) {
//             const count = match[1].replace(/,/g, ''); // Remove commas for numerical consistency
//             console.log(`[Background] Extracted follower count for ${profileUrl}: ${count}`);
//             // Cache the result
//             const data = {};
//             data[profileUrl] = count;
//             chrome.storage.local.set(data, () => {
//               console.log(`[Background] Cached follower count for ${profileUrl}: ${count}`);
//               resolve(count);
//             });
//           } else {
//             console.warn(`[Background] Follower count element not found for URL: ${profileUrl}`);
//             resolve(null);
//           }
//         } catch (error) {
//           console.error(`[Background] Error fetching follower count for ${profileUrl}:`, error);
//           resolve(null);
//         }
//       }
//     });
//   });
// }


// background.js

console.log("[Background] Service Worker Loaded.");

// Listener for messages from content scripts and popup
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
          console.log(`[Background] Fetched HTML for ${profileUrl}:\n${htmlText}`); // Temporary log

          // Use regex to extract follower count
          // Adjust the regex based on the actual HTML structure
          const regex = /<span[^>]*aria-hidden\s*=\s*["']true["'][^>]*>\s*Followers:\s*([\d,]+)\s*<\/span>/i;
          const match = regex.exec(htmlText);
          
          if (match && match[1]) {
            const countText = match[1].trim();
            console.log(`[Background] Extracted follower count text for ${profileUrl}: ${countText}`);
            
            // Clean the count number by removing commas
            const count = countText.replace(/,/g, '');
            console.log(`[Background] Parsed follower count for ${profileUrl}: ${count}`);
            
            // Cache the result
            const data = {};
            data[profileUrl] = count;
            chrome.storage.local.set(data, () => {
              console.log(`[Background] Cached follower count for ${profileUrl}: ${count}`);
              resolve(count);
            });
          } else {
            console.warn(`[Background] Follower count element not found or regex did not match for URL: ${profileUrl}`);
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
