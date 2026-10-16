const DEFAULT_RULES = [
  {
    pattern: '/(issues\\.redhat\\.com|\\.atlassian\\.net)/',
    color: '#9370db',
    enabled: true
  },
  {
    pattern: 'calendar.google.com',
    color: '#ff8c00',
    enabled: true
  }
];

function seedDefaultRules() {
  chrome.storage.sync.get(['rules'], function(data) {
    if (Array.isArray(data.rules) && data.rules.length > 0) {
      return;
    }

    chrome.storage.sync.set({ rules: DEFAULT_RULES }, function() {
      console.log('Seeded default rules');
    });
  });
}

chrome.runtime.onInstalled.addListener(seedDefaultRules);

// Also runs whenever the service worker wakes, so reloading the unpacked
// extension re-seeds the defaults if the rule list has been emptied.
seedDefaultRules();
