# bramlabs-website

Static site for BramLabs (bramlabs.io). Plain HTML and CSS, no build step.

- `index.html`, `philosophy.html`, `about.html`, `contact.html`
- `css/styles.css` holds the design tokens. The system follows the DocZoid brand guide (doczoid.io/brand) with an indigo accent instead of DocZoid's green.
- `js/site.js` handles the mobile menu and the email link.

## Develop

```
npm install
npm run dev
```

Starts a Vite dev server with live reload and opens the site in the browser. There is no build step; the HTML, CSS and JS in this folder are what gets deployed.
