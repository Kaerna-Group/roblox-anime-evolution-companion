# Contributing

## Goal

Keep the site fast, readable, and easy to update as a static project.

## General Rules

- Keep the project static-first
- Prefer simple HTML, CSS, and vanilla JavaScript
- Reuse shared styles and helpers before adding new patterns
- Store content-style data in `data/*.json` when it makes sense
- Keep page-specific behavior inside the matching file in `js/`

## Style Guidelines

- Preserve the existing visual direction in `styles/site.css`
- Prefer extending shared classes instead of creating one-off styles
- Keep spacing and card rhythm consistent across pages
- Avoid adding external runtime dependencies unless truly necessary

## Data Updates

- Boss data belongs in `data/boss-timers.json`
- Raid data belongs in `data/raids.json`
- Progression and reference data belong in the matching JSON files in `data/`
- Validate time strings carefully when editing schedules

## JavaScript Guidelines

- Keep logic small and page-focused
- Use the shared `Site` helpers from `js/common.js` where possible
- Preserve local storage keys when editing saved behavior unless migration is intentional
- Avoid breaking static hosting compatibility

## Before Finishing Changes

- Open the affected page and verify layout
- Make sure JSON-backed pages still load correctly
- Check for console errors
- Verify drag-and-drop and saved settings if you touched those features

## Suggested Commit Style

Use short, descriptive commit messages.

Examples:
- `feat: build initial anime evolution helper site`
- `feat: add overview page and customizable raid board`
- `style: refine dashboard cards and saved progression inputs`
