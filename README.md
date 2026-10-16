# Favicon Color Tint

A Chrome extension that applies color tints/overlays to favicons based on URL patterns. Great for visually organizing tabs by domain, environment (dev/staging/prod), or any custom categorization.

## Features

- Apply color tints to favicons based on URL patterns
- Support for simple text matching or regex patterns
- Quick add from popup or full configuration in options page
- Enable/disable rules individually
- Export/import rules for backup or sharing

## Installation

1. Clone or download this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked"
5. Select the extension directory

The extension comes with two default rules:
- **Google Calendar** → Red tint (#ff0000)
- **Google Docs** → Purple tint (#9370db)

You can modify or remove these in the options page.

## Usage

### Quick Add (Popup)

1. Click the extension icon in the toolbar
2. Enter a URL pattern (e.g., `github.com`)
3. Choose a color
4. Click "Add Rule"

### Full Configuration (Options)

1. Right-click the extension icon and select "Options"
2. Add rules with more detailed patterns
3. Toggle rules on/off
4. Edit or delete existing rules
5. Export/import your rule sets

### Pattern Examples

- **Simple text**: `github.com` - matches any URL containing "github.com"
- **Regex**: `/^https:\/\/github\.com/` - matches URLs starting with "https://github.com"
- **Local dev**: `localhost:3000` - matches local development on port 3000
- **Multiple domains**: `/\.(dev|test)\./` - matches .dev or .test domains

### Use Cases

- **Environment separation**: Tint production sites red, staging yellow, dev green
- **Project organization**: Different colors for different clients or projects
- **Security awareness**: Highlight internal vs external sites
- **Workflow optimization**: Color-code sites by purpose (work, personal, research)

## How It Works

The extension:
1. Monitors pages for favicon elements
2. Checks the current URL against your rules
3. Loads the favicon image and applies a color tint using canvas manipulation
4. Replaces the original favicon with the tinted version

## Privacy

This extension:
- Only runs on pages you visit
- Stores rules locally in Chrome's sync storage
- Does not collect or transmit any data
- Does not communicate with external servers

## Development

The extension is built with vanilla JavaScript and uses:
- Manifest V3
- Chrome Storage API for syncing rules
- Canvas API for image manipulation
- MutationObserver for dynamic favicon detection

## License

MIT
