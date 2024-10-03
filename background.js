// background.js

console.log("[Background] Service Worker Loaded.");

chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  if (request.type === 'FETCH_FOLLOWER_COUNT') {
    const memberId = request.memberId;
    console.log(`Fetching follower count for Member ID: ${memberId}`);

    try {
      const apiUrl = `https://api.linkedin.com/v2/members/${memberId}/followers/count`;
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer YOUR_ACCESS_TOKEN`, // Replace with your actual access token
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const data = await response.json();
      const followerCount = data.count; // Adjust based on actual API response structure

      sendResponse({ count: followerCount });
    } catch (error) {
      console.error('Error fetching follower count:', error);
      sendResponse({ count: null, error: error.message });
    }

    // Indicate that the response will be sent asynchronously
    return true;
  }
});
