# Gift Tracker — Implementation Notes

How `SPEC.md` was implemented. The spec describes *what* the app does; this describes *how* the code is organised and the decisions made along the way.

## Stack

- Vue 3 SPA (`create-vue` scaffold): TypeScript, Vue Router (web history), Pinia, Vitest, ESLint + oxlint + Prettier.
- Tailwind CSS v4 via `@tailwindcss/vite`. Small shared classes (`.btn`, `.btn-primary`, `.btn-danger`, `.card`) live in `src/assets/main.css`.
- Netlify: `public/_redirects` contains `/* /index.html 200`. Build is `npm run build`, output `dist`.

## Layout

```
src/
  domain/
    types.ts        Data model, exactly as in the spec (+ AppData, ExportFile)
    logic.ts        Pure functions over AppData (no Vue, no storage)
    format.ts       CAD price + date helpers
    __tests__/      Unit tests for logic.ts
  stores/
    data.ts         Pinia store: state, mutations, localStorage persistence
    __tests__/
  components/       StatusControl, ItemForm, PersonForm, OccasionForm, GiftItem, IdeaItem
  views/            Home, Occasion, Person, People, ToBuy, Settings
    __tests__/
  router/index.ts   Lazy-loaded routes
```

## Architecture

**Pure domain layer, thin store.** All business rules are pure functions in `domain/logic.ts` that take an `AppData` and return a new one (or a derived value). The Pinia store holds a single `data` ref and calls those functions for anything with cross-entity effects (cascading deletes, idea → gift, duplicate, import). Simple single-entity edits (rename a person, toggle a field) mutate the reactive state directly. This keeps the rules unit-testable without Vue or a DOM.

**Views derive, don't store.** Recipient groups, totals and the To Buy list are `computed` values built from `store.data`, so there is no second copy of state to keep in sync.

### Domain functions (`logic.ts`)

| Function | Purpose |
| --- | --- |
| `groupFor`, `groupRecipients` | Each recipient lands in exactly one group by least-advanced state: needs shopping → planned → bought → given. Ideas are attached only for needs-shopping and planned. |
| `totalPrice`, `occasionTotal`, `plannedTotal` | Sums; missing prices count as 0. |
| `toBuyGroups` | Planned gifts grouped by occasion. Each gift's date is `giveDate ?? occasion.date`; gifts are sorted by it, and groups by their earliest gift date. |
| `splitOccasions` | Upcoming (soonest first) and past (most recent first), split on today's ISO date. |
| `convertIdeaToGift` | Creates a `planned` gift with the idea's name/link/price and deletes the idea. Optional fields are omitted when absent. |
| `duplicateOccasion` | Copies recipients (a new array) under a new name/date; gifts are not copied. |
| `deletePerson`, `deleteOccasion`, `removeRecipient` | Cascading deletes as in the spec. `personDeleteImpact` supplies counts for the confirm text. |
| `nextBirthdayDate` | Next occurrence of a month/day, today or later. Feb 29 falls back to Feb 28 in non-leap years. |
| `buildExport`, `validateImport`, `parseImportText` | Export shape `{ version: 1, people, occasions, ideas, gifts }` and import validation. |

## Persistence

- The store loads from `localStorage` key `gift-tracker:v1` on creation and runs the stored text through the same validator as imports. Missing, corrupt or inaccessible storage yields empty data.
- A deep `watch` on `data` writes the export-shaped JSON after every change. Write failures (quota, private mode) are swallowed so the app keeps working in memory.
- **Export** downloads the JSON as `gift-tracker-YYYY-MM-DD.json`.
- **Import** validates first. An invalid file shows an error and never reaches the confirm dialog or touches existing data. A valid file asks for confirmation, then replaces everything.
- Validation checks: object shape, `version === 1`, the four arrays, per-entry field types, ISO dates, birthday ranges, valid statuses, and referential integrity (every gift/idea/recipient refers to an existing person/occasion).

## Views and behaviour

- **Home**: new-occasion form, upcoming list, past occasions in a collapsed `<details>`.
- **Occasion**: header with total and edit / duplicate / delete; add recipient (pick an existing person *or* type a name to create one); grouped recipients each with their gifts, ideas (with **→ Gift**, only in needs-shopping and planned), an add-gift form (with optional give date) and remove.
- **Person**: edit/delete, **Create birthday occasion** (opens a pre-filled, editable occasion form: "Name's birthday", next birthday date, that person as the only recipient), ideas CRUD, gift history grouped by occasion.
- **People**: alphabetical list plus add.
- **To Buy**: planned gifts grouped by occasion, with the planned total. Large type, full-width cards and a status control on each card for use in a store on a phone.
- **Data**: export and import.
- **Gift status**: a three-button segmented control (`role="radiogroup"`). Any status can be set from any other.
- **Confirm dialogs**: native `confirm()`, with text stating what will be lost (e.g. counts of ideas, gifts and occasions affected).

## Formatting

- Prices: `Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' })`.
- ISO dates are parsed as *local* dates (`parseIsoDate`) to avoid the off-by-one-day shift from `new Date('YYYY-MM-DD')` being read as UTC.
- IDs come from `crypto.randomUUID()`.

## Tests

30 tests across three files, run with `npx vitest run`:

- `domain/__tests__/logic.spec.ts`: grouping, totals, To Buy ordering, occasion ordering, idea → gift, duplicate, cascading deletes, birthdays, import validation.
- `stores/__tests__/data.spec.ts`: persistence round trip, invalid import leaves data untouched, valid import replaces.
- `views/__tests__/OccasionView.spec.ts`: grouping renders and **→ Gift** moves an idea into a planned gift and updates the total.

Node 26 ships an experimental global `localStorage` that can shadow jsdom's, so the store and view tests stub `localStorage` with an in-memory object.

## Decisions worth knowing

- **Stricter import validation than the spec requires** (referential integrity). A file with dangling references is rejected rather than loaded into a broken state.
- **To Buy group order** uses the earliest give date among a group's planned gifts, so a gift with an early `giveDate` can pull its occasion above others.
- **Native `confirm()`** over a custom modal: simplest thing that satisfies "confirm dialog", at the cost of look and feel.
- **No `version` migration code yet.** The field is written and checked (`=== 1`); a future model change would add a migration step in `validateImport`.
- **Out-of-scope items** from the spec (sync, tags, notes, recurring occasions, budgets, merge-on-import, multi-currency, undo) are not built.
