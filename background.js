chrome.runtime.onInstalled.addListener(function(details) {
  if (details.reason === 'install') {
    const defaultRules = [
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

    chrome.storage.sync.set({ rules: defaultRules }, function() {
      console.log('Default rules installed');
    });
  }
});
