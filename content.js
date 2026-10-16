const TINT_ATTRIBUTE = 'data-tinted';

function applyTint(favicon, color) {
  if (!favicon || !color || favicon.getAttribute(TINT_ATTRIBUTE) === 'true') {
    return;
  }

  const href = favicon.href;
  if (!href || href.startsWith('data:')) {
    return;
  }

  const img = new Image();
  img.crossOrigin = 'anonymous';

  img.onload = function() {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = img.width || 32;
      canvas.height = img.height || 32;

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      const tintColor = hexToRgb(color);
      if (!tintColor) return;

      for (let i = 0; i < data.length; i += 4) {
        const alpha = data[i + 3] / 255;
        if (alpha > 0) {
          data[i] = data[i] * 0.3 + tintColor.r * 0.7;
          data[i + 1] = data[i + 1] * 0.3 + tintColor.g * 0.7;
          data[i + 2] = data[i + 2] * 0.3 + tintColor.b * 0.7;
        }
      }

      ctx.putImageData(imageData, 0, 0);

      const newHref = canvas.toDataURL('image/png');
      favicon.href = newHref;
      favicon.setAttribute(TINT_ATTRIBUTE, 'true');
    } catch (e) {
      console.error('Failed to tint favicon:', e);
    }
  };

  img.onerror = function() {
    console.error('Failed to load favicon image');
  };

  img.src = href;
}

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

function findMatchingRule(url, rules) {
  for (const rule of rules) {
    if (!rule.enabled) continue;

    try {
      if (rule.pattern.startsWith('/') && rule.pattern.endsWith('/')) {
        const regex = new RegExp(rule.pattern.slice(1, -1));
        if (regex.test(url)) {
          return rule;
        }
      } else if (url.includes(rule.pattern)) {
        return rule;
      }
    } catch (e) {
      console.error('Invalid pattern:', rule.pattern, e);
    }
  }
  return null;
}

function processPage() {
  const url = window.location.href;

  chrome.storage.sync.get(['rules'], function(data) {
    const rules = data.rules || [];
    const matchedRule = findMatchingRule(url, rules);

    if (matchedRule) {
      const favicons = document.querySelectorAll('link[rel*="icon"]');
      favicons.forEach(favicon => applyTint(favicon, matchedRule.color));
    }
  });
}

const observer = new MutationObserver(function(mutations) {
  for (const mutation of mutations) {
    for (const node of mutation.addedNodes) {
      if (node.nodeName === 'LINK' && node.rel && node.rel.includes('icon')) {
        processPage();
        break;
      }
    }
  }
});

observer.observe(document.head || document.documentElement, {
  childList: true,
  subtree: true
});

processPage();
