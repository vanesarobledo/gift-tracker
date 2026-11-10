# Gift Tracker — Product Brief

## Problem

I track gifts for friends and family in a Notion table: one row per gift, with columns for cost, the person it's for, occasion, date due, and date to give. It breaks down in a few ways:

- To remember that someone *needs* a gift, I have to create a placeholder row ("Christmas Gift for Matthew") before I have any gift in mind.
- Occasions are free text on each row, so there's no reliable way to see everyone involved in one event.
- There's no quick view of who I still need to shop for, which gifts are planned but not bought, and which are bought.
- Gift ideas for a person are scattered across rows or crammed into a single row.

Gift Tracker is a small personal app that replaces that table. Its main job is to make "who do I still need to shop for?" a question the app answers, so I never have to type a placeholder.

## User

One user (me), on one device, with no account. Data lives in the browser.

## Core concepts

- **Person**: someone I give gifts to.
- **Occasion**: an event such as "Christmas 2026" or "Nikki's wedding". It has a name, a date, and a list of recipients. Adding someone as a recipient replaces the old placeholder row.
- **Idea**: a possible gift for a person. Ideas belong to a person and have no occasion.
- **Gift**: a gift I've committed to for a specific person at a specific occasion. It moves through the statuses `planned → bought → given`. `given` is separate from `bought` because I often buy well ahead of time.

## Data model

Use this data model as written. Don't replace it with a different shape.

```ts
interface Person {
  id: string
  name: string
  birthday?: { month: number; day: number; year?: number } // year is often unknown
}

interface Occasion {
  id: string
  name: string        // free text, e.g. "Christmas 2026"
  date: string        // ISO date (YYYY-MM-DD)
  recipientIds: string[]
}

interface Idea {
  id: string
  personId: string
  name: string
  link?: string
  price?: number      // estimate
}

type GiftStatus = 'planned' | 'bought' | 'given'

interface Gift {
  id: string
  personId: string
  occasionId: string
  name: string
  link?: string
  price?: number
  giveDate?: string   // ISO date; for when I hand it over on a different day than the occasion (e.g. seeing people at different times over Christmas)
  status: GiftStatus
}
```

Prices are a single currency, CAD, formatted with `Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' })`.

## Behaviour

### People
- Add, edit and delete people. A person has a name and an optional birthday (month and day, year optional).
- A person's page shows their ideas (add, edit, delete) and their gift history across occasions.
- When a person has a birthday, their page offers a **Create birthday occasion** action. It creates an occasion pre-filled with a name like "Finn's birthday", the next upcoming date of that birthday, and the person as the only recipient. I can edit these before saving.

### Occasions
- Add, edit and delete occasions. Add and remove recipients. When adding a recipient, I can either pick an existing person or create a new person on the spot.
- **Duplicate occasion**: copy an occasion under a new name and date I provide. The recipients are copied; the gifts are not. This is for starting "Christmas 2027" from "Christmas 2026".

### Ideas → Gifts
- On an occasion page, I can turn one of a recipient's ideas into a gift for that occasion. This *moves* the idea: it creates a `planned` gift with the idea's name, link and price, then deletes the idea.
- I can also add a gift directly without starting from an idea.
- A person can have several gifts for the same occasion.

### Gift status
- Each gift shows a three-option segmented control (Planned / Bought / Given). I can set any status in either direction, in case I misclick.

### Recipient grouping on the occasion page
Each recipient appears in exactly one group, according to their *least-advanced* state for that occasion, with all their gifts listed under them:

1. **Needs shopping**: no gifts for this occasion.
2. **Planned**: at least one gift is `planned`.
3. **Bought**: no `planned` gifts, and at least one `bought`.
4. **Given**: all gifts are `given`.

Recipients in **Needs shopping** and **Planned** also show their ideas, each with a "→ Gift" action. Recipients in Bought and Given don't show ideas.

### Totals
- The occasion page shows the total price of all its gifts (planned + bought + given). Gifts with no price count as zero.
- The To Buy page shows the total price of all planned gifts.

### Deleting
Deletes cascade. Each confirm dialog says what will be lost.
- Deleting a person removes their ideas and gifts and removes them from every occasion's recipients.
- Deleting an occasion removes its gifts.
- Removing a recipient from an occasion removes their gifts for that occasion.

## Views

- **Home**: the list of occasions, with upcoming ones first (soonest first). Past occasions are in a collapsed section.
- **Occasion**: the recipient groups described above, plus the occasion's total and actions to edit, duplicate and delete it.
- **Person**: the person's details, their ideas, their gift history, and the birthday-occasion action.
- **People**: the list of all people.
- **To Buy**: every `planned` gift across all occasions, grouped by occasion and ordered by date (use `giveDate` when set, otherwise the occasion date). Includes the total. I'll use this page on my phone while I'm in a store.
- **Settings / Data**: export and import.

## Persistence

- All data is stored in `localStorage` and saved automatically on every change.
- **Export** downloads a JSON file containing `{ version: 1, people, occasions, ideas, gifts }`.
- **Import** reads such a file and **replaces** all existing data, after a confirm dialog. If the file isn't valid, show an error and leave the existing data untouched.
- The `version` field is there so a future change to the data model can migrate older exports.

## Tech & platform

- Vue 3 SPA, scaffolded with `create-vue`: TypeScript, Vue Router (web history), Pinia, Vitest, ESLint + Prettier. Delete the scaffold's demo content (HelloWorld, TheWelcome, the counter store, the About view, and so on).
- **Tailwind CSS** for styling. It isn't installed yet: install it with the official Vite plugin (Tailwind v4).
- Responsive layout that works well on a phone. This matters most for the To Buy page.
- Unit tests (Vitest) for the domain logic at minimum: recipient grouping, totals, idea → gift conversion, duplicating an occasion, cascading deletes, and import validation.
- Deployed to **Netlify**. Add the SPA fallback so deep links work, for example `public/_redirects` containing `/* /index.html 200`. Builds use `npm run build` and output to `dist`.

## Out of scope

Don't build these:

- Syncing across devices, accounts, auth, or any backend.
- Interests or tags on people, and notes fields.
- Recurring or auto-generated occasions. The birthday button and Duplicate occasion are the only shortcuts.
- Budgets per occasion or per person.
- Linking ideas to occasions. Ideas belong only to a person.
- Merging on import. Import always replaces.
- Multiple currencies.
- Soft-delete, archiving, or undo. Export serves as the backup.
