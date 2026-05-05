# Figma UI Spec

Figma file: https://www.figma.com/design/cRWlZHnnOpBWJ609rg3zvI

The Figma MCP connection is active. The current team is on Figma Starter, so the design file should stay within the 3-page limit and larger updates may need to be split across sessions because Starter also enforces MCP tool-call limits.

## File structure

- File name: `Social Media Clone`
- Pages:
  - `00 Foundations`
  - `01 Core Screens`
  - `02 Roadmap`

Original screen grouping:

- `01 Core Screens` includes auth, feed, post detail, and friends.
- `02 Roadmap` reserves chat design space for the later WebSocket phase.

## Foundations

### Tokens

- Color roles:
  - `bg.canvas`
  - `bg.surface`
  - `bg.surfaceAlt`
  - `text.primary`
  - `text.secondary`
  - `accent.primary`
  - `accent.success`
  - `border.default`
- Spacing scale:
  - `4`, `8`, `12`, `16`, `24`, `32`, `40`
- Radius scale:
  - `8`, `12`, `16`, `24`

### Type ramp

- Display: landing and hero headings
- H1: page heading
- H2: section heading
- Body: post content
- Caption: metadata and counts

## First screens

### Auth

- Login screen
- Registration screen
- Shared auth card layout with strong call-to-action area

### Feed

- Left rail: profile summary and navigation
- Center column: composer + feed list
- Right rail: suggested friends and active friends

### Post detail

- Post card expanded state
- Comments list
- Comment composer

### Friends

- Pending requests tab
- Friends list tab
- Suggested users tab

## Core components to design first

- App shell
- Top navigation
- User avatar
- Primary and secondary buttons
- Post composer
- Post card
- Comment item
- Friend request row
- Empty state

## Interaction notes

- Likes and comments need clear count affordances
- Friend actions need explicit state labels: `Add`, `Pending`, `Friends`
- Chat is out of scope for the first design pass, but reserve a nav item for it

## Responsive targets

- Desktop: `1440px`
- Tablet: `1024px`
- Mobile: `390px`
