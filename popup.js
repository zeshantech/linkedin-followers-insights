//pop.js
document.addEventListener('DOMContentLoaded', () => {
  const fetchButton = document.getElementById('fetchButton');
  const logDiv = document.getElementById('log');

  function appendLog(message) {
    const p = document.createElement('p');
    p.textContent = message;
    logDiv.appendChild(p);
    logDiv.scrollTop = logDiv.scrollHeight;
  }

  fetchButton.addEventListener('click', () => {
    appendLog('Initiating follower count fetch...');

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeTab = tabs[0];
      if (activeTab && activeTab.url.includes('linkedin.com/mynetwork')) {
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
