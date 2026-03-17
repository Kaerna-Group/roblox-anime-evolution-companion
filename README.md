# Game Helper

Static multipage helper site for Anime Evolution players.

It includes:
- Boss timers for world and divine bosses
- Raid timers with drag-and-drop custom ordering
- Crit progression calculator with saved inputs
- Reference pages for progression data
- Weapons and ranks guide
- Overview page with nearest important events

## Project Structure

`index.html`
- Landing page

`pages/`
- Individual site pages

`js/`
- Shared and page-specific vanilla JavaScript

`data/`
- Local JSON data sources used by the pages

`styles/site.css`
- Shared visual system and layout styles

`assets/logo.png`
- Site logo and favicon

## Pages

- `pages/overview.html`
- `pages/boss-timers.html`
- `pages/raids.html`
- `pages/progression.html`
- `pages/reference.html`
- `pages/weapons.html`

## Tech

- HTML
- CSS
- Vanilla JavaScript
- Local JSON data

## Local Use

Because the site loads local JSON files with `fetch`, it is best to run it from a local static server instead of opening files directly in the browser.

Example options:
- VS Code Live Server
- any simple static server
- GitHub Pages deployment

## Notes

- Raid order is saved in local storage
- Progression inputs are saved in local storage
- The project is built as a simple static site with no framework requirement

## Main Files

- [index.html](E:/Anything/Projects/kaerna-group/react/roblox-anime-evolution/index.html)
- [styles/site.css](E:/Anything/Projects/kaerna-group/react/roblox-anime-evolution/styles/site.css)
- [js/common.js](E:/Anything/Projects/kaerna-group/react/roblox-anime-evolution/js/common.js)
- [data/boss-timers.json](E:/Anything/Projects/kaerna-group/react/roblox-anime-evolution/data/boss-timers.json)
- [data/raids.json](E:/Anything/Projects/kaerna-group/react/roblox-anime-evolution/data/raids.json)

## License

Add the license you want for the project here.
