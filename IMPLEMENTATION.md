# Gift Tracker — Implementation Summary

This document describes how [SPEC.md](./SPEC.md) was implemented, the decisions made where the spec was silent, and what is still unverified.

## Status

| Check | Result |
| --- | --- |
| Unit tests (`npm run test:unit`) | 65 passing |
| Type-check (`npm run type-check`) | Clean |
| Lint (`npm run lint`) | Clean |
| Production build (`npm run build`) | Succeeds |
| Manual / browser testing | **Not done.** The UI has not been run in a browser. |

## Architecture

```
src/
  domain/          Pure TypeScript, no Vue. All business rules live here.
    types.ts         The spec's data model, plus AppData and helpers
    operations.ts    State transitions (add/update/delete, cascades, idea → gift, duplicate)
    grouping.ts      Recipient grouping on the occasion page
    totals.ts        Totals, CAD formatting, price parsing, To Buy grouping
    dates.ts         Local-time date parsing/formatting, next birthday
    occasions.ts     Home-page upcoming/past split, birthday occasion name
    importExport.ts  Export file shape and import validation
    links.ts         Safe href handling for user-supplied links
    __tests__/       Vitest specs for all of the above
  stores/
    gifts.ts         Pinia store: thin wrapper over domain/operations
    storage.ts       localStorage load/save
    __tests__/       Storage tests
  components/      Reusable UI (modal, forms, gift/idea rows, status control, recipient card)
  views/           One component per route
  router/          Routes, page titles
```

### Domain layer: pure functions over `AppData`

All state is one object:

```ts
interface AppData { people: Person[]; occasions: Occasion[]; ideas: Idea[]; gifts: Gift[] }
```

Every operation in `operations.ts` takes the current `AppData` and returns a **new** `AppData`. It never mutates its input. Operations that create something return a tuple `[AppData, created]` so the UI can navigate to the new item.

**Why:** each rule (cascading deletes, idea → gift, duplicating) becomes a plain input → output function. Tests need no Vue, Pinia or DOM setup, and a test can check that the input was left unchanged.

**Alternative considered:** putting the logic directly in Pinia actions. This is the more common pattern and has less indirection. It was rejected because every test would need a Pinia instance, and the rules would be coupled to the framework.

### Store

`useGiftStore` (a Pinia setup store) holds `data` in a `ref`. Each action calls a domain operation and replaces `data` with the result. A deep `watch` saves to `localStorage` on every change. The store also exposes derived lookups (`peopleById`, `occasionsById`) and "impact" helpers that confirm dialogs use to say what will be lost.

### Persistence

- Stored under the key `gift-tracker:data`, in the **same versioned shape as an export** (`{ version: 1, people, occasions, ideas, gifts }`). So the import validator (and any future version migration) applies to both.
- On load, saved data runs through the import validator. If it's invalid, the app starts empty and keeps the bad copy under `gift-tracker:data:corrupt:<timestamp>`, so nothing is silently lost.
- `loadData`/`saveData` take the `Storage` as a parameter (defaulting to `localStorage`), so tests use an in-memory fake.

### Import validation

The validator is hand-written in `importExport.ts`, with no schema library. It checks:

- `version === 1`
- Field types: non-empty names, ISO dates (rejecting impossible ones like `2026-02-30`), valid birthdays, non-negative numeric prices, valid gift statuses
- Unique ids within each collection
- **References:** recipients, idea owners, and gift person/occasion all exist, and every gift's person is a recipient of that gift's occasion

Unknown properties are dropped. On any failure, import shows the error and leaves existing data untouched. On success, a confirm dialog shows counts of what will be lost and what will be imported, then replaces everything.

**Alternative considered:** [Zod](https://zod.dev/), which derives the TypeScript type and the runtime check from one schema. It wasn't worth a dependency for four small entities, but it's worth switching to if the model grows.

## Spec coverage

| Spec item | Where |
| --- | --- |
| People CRUD, optional birthday (year optional) | `PeopleView`, `PersonView`, `PersonForm` |
| Person page: ideas, gift history, **Create birthday occasion** | `PersonView` |
| Occasions CRUD, add/remove recipients, create a person on the spot | `HomeView`, `OccasionView`, `AddRecipientForm`, `RecipientCard` |
| **Duplicate occasion** (recipients copied, gifts not) | `operations.duplicateOccasion`, `OccasionView` |
| Idea → gift (moves the idea) | `operations.convertIdeaToGift`, `IdeaItem` |
| Add a gift directly; several gifts per person per occasion | `operations.addGift`, `RecipientCard` |
| Three-way status control, either direction | `StatusControl` |
| Recipient grouping by least-advanced state; ideas shown only in Needs shopping / Planned | `grouping.ts`, `OccasionView` |
| Occasion total and To Buy total (no price = 0) | `totals.ts` |
| Cascading deletes with confirm messages that say what's lost | `operations.ts` (`*Impact` + delete functions), views |
| Home: upcoming soonest first, past collapsed | `occasions.splitOccasions`, `HomeView` |
| To Buy: planned gifts grouped by occasion, ordered by date | `totals.toBuyGroups`, `ToBuyView` |
| Export / import (replace, confirm, error on invalid) | `DataView`, `importExport.ts` |
| Tailwind v4 via the Vite plugin | `vite.config.ts`, `src/assets/main.css` |
| Netlify SPA fallback | `public/_redirects`, `netlify.toml` |
| Scaffold demo content removed | — |

## Decisions where the spec was silent or ambiguous

- **To Buy ordering.** Gifts within an occasion are sorted by effective date (`giveDate`, else the occasion date). Occasions are sorted by their *earliest* gift's effective date, so an occasion with an early `giveDate` gift can come before one with an earlier occasion date. Ordering by occasion date only would be a simpler reading of the spec.
- **To Buy is interactive.** Each gift has the status control, so it can be marked Bought in the store. It then disappears from the list immediately, which may feel abrupt.
- **Feb 29 birthdays** use Feb 28 in non-leap years for the birthday-occasion date.
- **Duplicate pre-fill** bumps the year in both the name and the date ("Christmas 2026" on 2026-12-25 → "Christmas 2027" on 2027-12-25). Both stay editable.
- **Birthday occasion date** is the next occurrence, *including today*.
- **Past vs upcoming:** an occasion dated today counts as upcoming.
- **Idea → gift** throws if the idea's person isn't a recipient of the occasion. The UI only offers the action for recipients, so the guard protects the domain function.
- **Prices** accept `$24.99`, `1,200`, `.5` and similar, and are rounded to cents. Negative values are rejected.
- **Link safety.** Only `http(s)` links become clickable, and bare domains get `https://`. [Vue doesn't sanitize URLs](https://vuejs.org/guide/best-practices/security#potential-dangers), so a `javascript:` link from an imported file would otherwise run on click.
- **Dates** are parsed as *local* dates. `new Date('2026-12-25')` parses as UTC midnight and shows as Dec 24 west of UTC, so `dates.parseISODate` builds the date from its parts.
- **Confirm dialogs** use `window.confirm`. It's simple and works on mobile, but it can't be styled.

## UI notes

- Mobile-first layout, with a max width of `48rem` on larger screens. The nav shows a count of planned gifts on the **To Buy** link.
- Inputs are 16px on phones so iOS Safari doesn't zoom on focus.
- Modals use the native `<dialog>` element (`showModal()`), which provides focus trapping, Escape-to-close and a backdrop.
- The status control is a real radio group visually styled as segmented buttons, so keyboard and screen-reader support come built in.
- Status colours: planned = amber, bought = sky, given = emerald.
- Shared Tailwind classes (`.btn`, `.input`, `.card`, …) are defined with `@apply` in `src/assets/main.css`.

## Tests

| File | Covers |
| --- | --- |
| `domain/__tests__/grouping.spec.ts` | Each group rule, one-group-per-recipient, order preserved |
| `domain/__tests__/totals.spec.ts` | Occasion total, planned total, missing prices, CAD formatting, To Buy ordering, price parsing |
| `domain/__tests__/operations.spec.ts` | Idea → gift (incl. no mutation), multiple gifts, status both ways, duplicate, all three cascades, add recipient |
| `domain/__tests__/importExport.spec.ts` | Round trip, invalid JSON, 15 kinds of invalid file, Feb 29 without a year, unknown fields dropped |
| `domain/__tests__/dates.spec.ts` | Next birthday (incl. Feb 29), local parsing, date validation, upcoming/past split |
| `stores/__tests__/storage.spec.ts` | Empty start, round trip, corrupt data fallback with backup |

## Known gaps and risks

- **No browser testing.** Nothing in the UI has been clicked through, including the phone layout the spec cares most about for To Buy.
- **No component tests.** Coverage is domain logic and storage only.
- **Sticky To Buy header** uses a hardcoded `top-[49px]` offset to sit under the app header. If the header height changes, it will overlap or leave a gap.
- **`localStorage` in tests.** Under Node 26, `localStorage` was `undefined` in the Vitest jsdom environment, likely because of Node's own built-in Web Storage (not confirmed). Storage tests use an injected in-memory fake instead.
- **`localStorage` quota/errors** aren't handled. A failed save (e.g. in private mode or when storage is full) would throw in the watcher without telling the user.
