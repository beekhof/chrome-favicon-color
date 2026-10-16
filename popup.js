function loadRules() {
  chrome.storage.sync.get(['rules'], function(data) {
    const rules = data.rules || [];
    const rulesList = document.getElementById('rules-list');

    if (rules.length === 0) {
      rulesList.innerHTML = '<div class="empty-state">No rules yet. Add one above!</div>';
      return;
    }

    rulesList.innerHTML = rules.map((rule, index) => `
      <div class="rule-item">
        <div class="rule-color" style="background-color: ${rule.color}"></div>
        <div class="rule-info">
          <div class="rule-pattern">${escapeHtml(rule.pattern)}</div>
        </div>
        <button class="rule-delete" data-index="${index}">Delete</button>
      </div>
    `).join('');

    document.querySelectorAll('.rule-delete').forEach(btn => {
      btn.addEventListener('click', function() {
        const index = parseInt(this.getAttribute('data-index'));
        deleteRule(index);
      });
    });
  });
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function deleteRule(index) {
  chrome.storage.sync.get(['rules'], function(data) {
    const rules = data.rules || [];
    rules.splice(index, 1);
    chrome.storage.sync.set({ rules }, function() {
      loadRules();
      notifyContentScripts();
    });
  });
}

function notifyContentScripts() {
  chrome.tabs.query({}, function(tabs) {
    tabs.forEach(tab => {
      chrome.tabs.reload(tab.id).catch(() => {});
    });
  });
}

document.getElementById('add').addEventListener('click', function() {
  const pattern = document.getElementById('pattern').value.trim();
  const color = document.getElementById('color').value;

  if (!pattern) {
    alert('Please enter a URL pattern');
    return;
  }

  chrome.storage.sync.get(['rules'], function(data) {
    const rules = data.rules || [];
    rules.push({
      pattern: pattern,
      color: color,
      enabled: true
    });

    chrome.storage.sync.set({ rules }, function() {
      document.getElementById('pattern').value = '';
      loadRules();
      notifyContentScripts();
    });
  });
});

document.getElementById('open-options').addEventListener('click', function(e) {
  e.preventDefault();
  chrome.runtime.openOptionsPage();
});

loadRules();
