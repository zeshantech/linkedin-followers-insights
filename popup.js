// popup.js

document.addEventListener('DOMContentLoaded', () => {
    const fetchButton = document.getElementById('fetchButton');
    const logDiv = document.getElementById('log');
  
    // Function to append logs to the log div
    function appendLog(message) {
      const p = document.createElement('p');
      p.textContent = message;
      logDiv.appendChild(p);
      // Auto-scroll to the bottom
      logDiv.scrollTop = logDiv.scrollHeight;
    }
  
    fetchButton.addEventListener('click', () => {
      appendLog('Initiating follower count fetch...');
      
      // Query the active tab to ensure we're on LinkedIn My Network page
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const activeTab = tabs[0];
        if (activeTab && activeTab.url.includes('linkedin.com/mynetwork')) {
          // Send a message to content.js to start processing
          chrome.tabs.sendMessage(activeTab.id, { type: 'START_FETCH' }, (response) => {
            if (chrome.runtime.lastError) {
              appendLog(`Error: ${chrome.runtime.lastError.message}`);
              return;
            }
            appendLog('Follower count fetch initiated.');
          });
        } else {
          appendLog('Please navigate to the LinkedIn My Network page and try again.');
        }
      });
    });
  });
  