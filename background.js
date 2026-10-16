chrome.runtime.onInstalled.addListener(function(details) {
  if (details.reason === 'install') {
    const defaultRules = [
      {
        pattern: 'calendar.google.com',
        color: '#ff0000',
        enabled: true
      },
      {
        pattern: 'docs.google.com',
        color: '#9370db',
        enabled: true
      }
    ];

    chrome.storage.sync.set({ rules: defaultRules }, function() {
      console.log('Default rules installed');
    });
  }
});
