# Don’t Get Hooked — Browser Phishing Story Game

A web-based interactive story game that runs entirely in the browser (HTML/CSS/vanilla JS).  
Single page, no backend, no login, no analytics/tracking.

## Files

- `index.html`: app shell
- `styles.css`: cyber / retro UI styling + glitch/safe effects
- `script.js`: scene engine + structured dialogue + UI rendering
- `support.png` / `hacker.png`: pixel/retro character visuals (optional; the game has a CSS fallback)

## Run locally (no installation)

### Option A: Just open it

Double-click `index.html` to open it in your browser.

### Option B (recommended): Use a tiny local web server

This avoids some browser restrictions and matches how it’ll run on GitHub Pages/Netlify.

- If you have Python:

```bash
python -m http.server 5173
```

Then open `http://localhost:5173/` in your browser.

## Deploy (static hosting)

### GitHub Pages

1. Put these files in a GitHub repo root.
2. In GitHub: **Settings → Pages**
3. **Build and deployment**
   - Source: **Deploy from a branch**
   - Branch: `main` / `/ (root)`

GitHub Pages will serve `index.html` automatically.

### Netlify

1. Drag-and-drop this folder into Netlify, or connect a Git repo.
2. Build command: *(none)*
3. Publish directory: *(root)*

## Extending the story

All story content is in `script.js` inside the `STORY` object:

- Add a new scene: append to `STORY.scenes`
- Add steps: append to `scene.steps`
- Add choices: add `choices` to a step
- Add a new center-panel screen: add a new `view` handler in `renderCenter()`

## Privacy

- No network calls required for gameplay
- No tracking / analytics
- Any typed “Username/Password” stays only in your browser memory for the simulation

