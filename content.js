const TINT_ATTRIBUTE = 'data-tinted';

// Fallback blend strength for greyscale icons, applied to the darkest pixels.
// Light pixels get proportionally less, so white stays white.
const TINT_STRENGTH = 0.7;

// Mean saturation below which an icon counts as greyscale and gets the
// blend above instead of a hue replacement.
const GREYSCALE_SATURATION = 0.15;

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

      const tintHsl = rgbToHsl(tintColor.r, tintColor.g, tintColor.b);
      const greyscale = meanSaturation(data) < GREYSCALE_SATURATION;

      for (let i = 0; i < data.length; i += 4) {
        const alpha = data[i + 3] / 255;
        if (alpha === 0) continue;

        if (greyscale) {
          // Nothing to recolour, so blend instead. Rec. 601 luminance is 0 for
          // black and 1 for white, so scaling by its inverse leaves white
          // untouched with no hard threshold to alias antialiased edges.
          const luminance =
            (0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]) / 255;
          const amount = TINT_STRENGTH * (1 - luminance);

          data[i] = data[i] * (1 - amount) + tintColor.r * amount;
          data[i + 1] = data[i + 1] * (1 - amount) + tintColor.g * amount;
          data[i + 2] = data[i + 2] * (1 - amount) + tintColor.b * amount;
        } else {
          // Keep the pixel's own lightness but take the tint's hue, so colours
          // shift to the tint rather than averaging with it into mud. White and
          // black survive untouched, since no hue shows at either extreme of
          // lightness; mid greys pick up a wash of the tint.
          const lightness = rgbToHsl(data[i], data[i + 1], data[i + 2]).l;
          const tinted = hslToRgb(tintHsl.h, tintHsl.s, lightness);

          data[i] = tinted.r;
          data[i + 1] = tinted.g;
          data[i + 2] = tinted.b;
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

function rgbToHsl(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;

  if (max === min) {
    return { h: 0, s: 0, l: l };
  }

  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

  let h;
  if (max === r) {
    h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  } else if (max === g) {
    h = ((b - r) / d + 2) / 6;
  } else {
    h = ((r - g) / d + 4) / 6;
  }

  return { h: h, s: s, l: l };
}

function hueToChannel(p, q, t) {
  if (t < 0) t += 1;
  if (t > 1) t -= 1;
  if (t < 1 / 6) return p + (q - p) * 6 * t;
  if (t < 1 / 2) return q;
  if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
  return p;
}

function hslToRgb(h, s, l) {
  if (s === 0) {
    return { r: l * 255, g: l * 255, b: l * 255 };
  }

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;

  return {
    r: hueToChannel(p, q, h + 1 / 3) * 255,
    g: hueToChannel(p, q, h) * 255,
    b: hueToChannel(p, q, h - 1 / 3) * 255
  };
}

function meanSaturation(data) {
  let total = 0;
  let count = 0;

  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] === 0) continue;
    total += rgbToHsl(data[i], data[i + 1], data[i + 2]).s;
    count++;
  }

  return count ? total / count : 0;
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
