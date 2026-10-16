function showStatus(message) {
  const statusEl = document.getElementById('status-message');
  statusEl.textContent = message;
  statusEl.classList.add('show');
  setTimeout(() => {
    statusEl.classList.remove('show');
  }, 2000);
}

function loadRules() {
  chrome.storage.sync.get(['rules'], function(data) {
    const rules = data.rules || [];
    const container = document.getElementById('rules-container');

    if (rules.length === 0) {
      container.innerHTML = '<p style="color: #666; text-align: center; padding: 20px;">No rules yet. Add one above!</p>';
      return;
    }

    container.innerHTML = rules.map((rule, index) => `
      <div class="rule-item" data-index="${index}">
        <label class="rule-toggle">
          <input type="checkbox" ${rule.enabled ? 'checked' : ''} class="rule-enabled" data-index="${index}">
          <span class="slider"></span>
        </label>
        <div class="rule-pattern">${escapeHtml(rule.pattern)}</div>
        <div class="rule-color" style="background-color: ${rule.color}"></div>
        <button class="btn btn-small btn-secondary edit-rule" data-index="${index}">Edit</button>
        <button class="btn btn-small btn-danger delete-rule" data-index="${index}">Delete</button>
      </div>
    `).join('');

    document.querySelectorAll('.rule-enabled').forEach(checkbox => {
      checkbox.addEventListener('change', function() {
        const index = parseInt(this.getAttribute('data-index'));
        toggleRule(index, this.checked);
      });
    });

    document.querySelectorAll('.delete-rule').forEach(btn => {
      btn.addEventListener('click', function() {
        const index = parseInt(this.getAttribute('data-index'));
        if (confirm('Delete this rule?')) {
          deleteRule(index);
        }
      });
    });

    document.querySelectorAll('.edit-rule').forEach(btn => {
      btn.addEventListener('click', function() {
        const index = parseInt(this.getAttribute('data-index'));
        editRule(index);
      });
    });
  });
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function addRule() {
  const pattern = document.getElementById('new-pattern').value.trim();
  const color = document.getElementById('new-color').value;

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
      document.getElementById('new-pattern').value = '';
      loadRules();
      showStatus('Rule added successfully');
    });
  });
}

function deleteRule(index) {
  chrome.storage.sync.get(['rules'], function(data) {
    const rules = data.rules || [];
    rules.splice(index, 1);
    chrome.storage.sync.set({ rules }, function() {
      loadRules();
      showStatus('Rule deleted');
    });
  });
}

function toggleRule(index, enabled) {
  chrome.storage.sync.get(['rules'], function(data) {
    const rules = data.rules || [];
    if (rules[index]) {
      rules[index].enabled = enabled;
      chrome.storage.sync.set({ rules }, function() {
        showStatus(enabled ? 'Rule enabled' : 'Rule disabled');
      });
    }
  });
}

function editRule(index) {
  chrome.storage.sync.get(['rules'], function(data) {
    const rules = data.rules || [];
    if (rules[index]) {
      const newPattern = prompt('Enter new pattern:', rules[index].pattern);
      if (newPattern !== null && newPattern.trim()) {
        rules[index].pattern = newPattern.trim();
        chrome.storage.sync.set({ rules }, function() {
          loadRules();
          showStatus('Rule updated');
        });
      }
    }
  });
}

function exportRules() {
  chrome.storage.sync.get(['rules'], function(data) {
    const rules = data.rules || [];
    const blob = new Blob([JSON.stringify(rules, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'favicon-tint-rules.json';
    a.click();
    URL.revokeObjectURL(url);
    showStatus('Rules exported');
  });
}

function importRules() {
  const input = document.getElementById('import-file');
  const file = input.files[0];

  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const rules = JSON.parse(e.target.result);
      if (!Array.isArray(rules)) {
        throw new Error('Invalid format');
      }

      chrome.storage.sync.set({ rules }, function() {
        loadRules();
        showStatus('Rules imported successfully');
        input.value = '';
      });
    } catch (error) {
      alert('Failed to import rules: ' + error.message);
    }
  };
  reader.readAsText(file);
}

document.getElementById('add-rule').addEventListener('click', addRule);
document.getElementById('new-pattern').addEventListener('keypress', function(e) {
  if (e.key === 'Enter') {
    addRule();
  }
});

document.getElementById('export').addEventListener('click', exportRules);
document.getElementById('import').addEventListener('click', function() {
  document.getElementById('import-file').click();
});
document.getElementById('import-file').addEventListener('change', importRules);

loadRules();
