# FutureLab

**Explore the possibilities. Understand the trade-offs.**

A local-first college financial decision simulator built for students. Compare up to four college paths, edit the assumptions, and inspect how debt, cash, and simplified net worth develop after graduation. All example colleges and numbers are fictional.

Current version: **V2 · 2.0.0**. See [CHANGELOG.md](CHANGELOG.md) for version notes.

## Run locally

Requires Node.js 22+ and npm. From this directory:

```sh
npm ci
npm run dev
```

Open the local URL printed by Vite (normally http://127.0.0.1:5173). Installation requires internet access; running the app requires no API, account, or paid service. After installation it makes no external data or font requests.

```sh
npm test           # financial engine and storage-schema tests
npm run test:watch # watch mode
npm run build      # strict TypeScript check and production build
npm run preview    # serve the built app locally
npm run format:check # verify source formatting
```

## First version

Quick Estimate, beside Main Workspace, offers a separate five-input comparison: graduation debt and starting salary for two colleges, plus shared monthly living expenses. It shows a ten-year net-worth chart and estimated monthly loan payments. College names are editable inline and persist separately under `futurelab.quick-estimate.names.v1`; charts and results use those names. Zero amounts clears all five amounts while retaining names, with an in-session Undo until the next amount edit. Its fixed assumptions are disclosed in the view; inputs persist separately under `futurelab.quick-estimate.v1` and do not alter the full workspace. Missing or invalid amounts withhold results; zero amounts are supported.

- Landing page with a live preview of the current comparison.
- Two to four editable college paths; fictional example data and explicit input validation.
- Shared loan, salary, expense, tax, and horizon assumptions.
- Education cost, borrowing, monthly payment, and end-of-horizon net worth comparisons.
- Recharts views for loan balance, accumulated cash, and net worth; monthly ledger for exact underlying results.
- Versioned LocalStorage persistence, validated restoration, and a confirmed reset to example inputs. If browser storage is unavailable, the workspace continues in memory and shows a status message.
- Desktop light/dark interface, keyboard-accessible controls, reduced-motion support, and descriptive chart alternatives.

## Structure

```text
src/
  engine/
    types.ts            # shared typed model contracts
    collegeCost.ts      # annual cost and borrowing requirements
    loanCalculator.ts   # cent-rounded amortization schedule
    cashflow.ts         # effective annual growth applied monthly
    simulation.ts       # deterministic monthly projection
    engine.test.ts      # independently testable financial behavior
  state/
    defaults.ts         # illustrative inputs, bounds, storage validation
    useWorkspace.ts     # persistence and reset
  components/
    ui/button.tsx       # shadcn/ui Button pattern with Radix Slot
    Landing.tsx
    Workspace.tsx
    CollegeEditor.tsx
    NumberField.tsx
    ProjectionChart.tsx
  lib/utils.ts          # styling composition and currency display
  App.tsx               # navigation and derived simulation results
  index.css             # Tailwind entry and FutureLab design system
```

React + TypeScript + Vite, Tailwind CSS v4, a customized shadcn/ui Button, Lucide React, Recharts, and Vitest. No backend, authentication, database, or state management library. The engine imports no React or presentation code. Each input update recomputes every college path; chart tabs change only the displayed metric.

## Model and conventions

Inputs are nominal US dollars. Percentage controls display percentages, stored as decimals. Attendance, repayment, and horizon inputs use whole years. Charts sample each year from the actual monthly results; the ledger includes every month, with dollar amounts rounded only for display.

**College costs**

```text
yearCost[y] = max(0, (tuition + livingCost) × (1 + collegeCostGrowth)^y - scholarships)
totalCost = sum(yearCost[y])
borrowedPrincipal = max(0, totalCost - totalFamilyContribution)
loanPrincipal = borrowedPrincipal + inSchoolInterest
```

Year index starts at zero. Tuition and living costs grow annually; aid stays fixed. Family funds cover the earliest costs before borrowing. Unused contributions do not become post-graduation cash. With zero growth, total cost preserves the original formula exactly.

**Loans**

Borrowing is disbursed at the start of each academic year. An optional in-school annual rate accrues simple interest on each disbursement until graduation, without interest on accrued interest. Accrued interest rounds to cents and capitalizes once at graduation. Repayment begins the next month at the regular loan rate. The quoted annual loan rate is divided by 12 to obtain the monthly rate (a nominal annual rate convention). For monthly rate `r` and `n` payments, the standard payment is `P × r / (1 - (1 + r)^(-n))`; zero-rate loans use `P / n`. The implementation uses `log1p` and `expm1` for stability at very small rates. Monthly payments, interest, and principal balances round to cents. The final scheduled payment clears any rounding remainder and may differ from the quoted regular payment. No negative balances or payments after payoff. These are configurable modeling assumptions, not the rules of a particular loan program.

**Cash flow**

The original graduation view starts at zero accumulated cash with graduation debt outstanding. Each college has an optional job-search delay of 0–60 full months with no salary. Living costs and loan payments continue throughout. For delay `d`, the first working month is `d + 1`. At working-month index `m` (starting at zero), salary is `startingSalary / 12 × (1 + annualGrowth)^(m/12)`. Living expenses grow from graduation, independently of employment. Take-home income is gross income times one minus the effective tax rate. The original advanced numeric assumptions default to zero; missing timeline settings mean the original graduation view and no career events, preserving legacy results.

**Common enrollment timeline**

Enrollment view aligns both paths at enrollment month 0 and uses the same elapsed horizon, including study years. At each academic year's start, net annual education costs are paid directly with family funds and borrowing; these offset in cash. In-school debt includes simple accrued interest. There is no salary while studying. Graduation is at month `attendanceYears × 12`, and the first post-graduation month follows it. Longer attendance therefore leaves fewer working months within a shared horizon. The monthly ledger labels the origin and stages and includes college funding and costs. Charts plot actual monthly results with graduation markers. The first monthly budget always shows each path's first post-graduation month, even when that lies beyond the selected chart horizon.

**Career events**

Each college supports up to 20 events, scheduled by whole months after graduation in either timeline view. Promotion/pay-change events permanently multiply the current salary path. A career change sets an explicit annual salary and resets its salary-growth clock. Unemployment lasts the specified number of months, pausing income and salary growth while living expenses and repayment continue. Overlapping unemployment periods merge. Salary changes scheduled before employment or during unemployment apply when work begins or resumes. Only one salary event is allowed per month to avoid ambiguous ordering. Career-change salary overrides are shared across scenario presets; preset growth assumptions still apply. Events are manually entered scenarios, not employment forecasts.

```text
cash += takeHomeIncome - livingExpenses - loanPayment
netWorth = cash - remainingLoanBalance
```

Negative cash and net worth remain visible. A negative cash balance indicates an unfunded gap; the model does not assume a credit product or charge additional interest on that gap.

## Limits

This is an educational decision-support model, not a forecast or a college ranking. It uses fixed tax and growth assumptions, supplemented by the entered career events. It excludes investment returns, inflation adjustment, fees, loan forgiveness, income-based repayment, unemployment benefits, retirement accounts, other debt and assets, and nonfinancial outcomes. The enrollment view assumes both paths begin together; the original graduation view retains separate graduation origins. College costs are paid in annual lump sums, not semester-level disbursements. Initial example figures are illustrative. Career reference data is separately labeled and does not automatically become a starting salary.

LocalStorage is browser- and origin-specific, unencrypted, and may be cleared by browser settings. Only input data is stored; there is no cloud sync. Invalid saved schemas fall back to the examples.

## Deliberately deferred

Break-even and sensitivity analysis, financial insight rules, CSV/JSON export, probability models, and optional AI explanations. The typed engine can support these later without coupling them to the UI.

## Glass and motion

`src/motion/` contains the visual interaction layer, separate from financial calculations. It uses CSS transitions/keyframes, the Web Animations API for click feedback, and opacity-only page reveals. No additional dependencies or network services are required.

- Translucent surfaces use standard `backdrop-filter` and Safari's prefixed equivalent, with opaque fallbacks. This is a browser approximation of Apple-style glass, not the macOS native material API.
- Navigation, staged entrances, sliding segmented controls, chart drawing, hover/press feedback, numeric updates, and expanding details provide feedback for different actions.
- Motion is enabled by default, with no in-app toggle or stored motion setting. The OS reduced-motion preference always takes priority. Reduced transparency is respected where the browser supports the media query.
- Click feedback does not intercept input; animation frames and event listeners clean up on unmount. Numeric animations expose final values to assistive technology, and animation never changes the calculation engine's results.
- Scroll-driven entrances and smooth detail sizing progressively enhance supported browsers; other browsers retain ordinary navigation, visible content, and basic entrance transitions.

Navigation uses React Activity boundaries to preserve each view's state and DOM. Scroll resets run after the destination layout commits and before paint. No full-page position/scale animation or browser snapshot transition is used. The layout follows the restrained hierarchy of [Linear's interface refresh](https://linear.app/now/behind-the-latest-design-refresh) and the aligned dashboard structure of [shadcn-admin](https://github.com/satnaing/shadcn-admin); FutureLab's existing palette is retained.

## Themes

The bottom-left Light / Dark switch selects Warm Sand (light: `#F6F2EC`, `#A64B2A`) or Obsidian Blue (dark: `#0B1220`, `#74C7FF`). Shared semantic tokens in `src/theme/themes.css` cover text, glass, borders, form controls, chart axes and series, and interaction feedback. Theme selection is saved under `futurelab.theme.v1`, independently of financial inputs and reset actions. The initial theme is dark; saved preferences apply before first paint. If storage is unavailable, switching still works for the session. The switch supports keyboard activation, screen readers, and reduced-motion preferences.

## Scenarios and quick what-if

The explorer now provides Baseline, Optimistic, and Conservative scenarios, plus temporary what-if adjustments. Original college inputs and assumptions remain editable and are never overwritten by presets. The original baseline is the reference for the cost, borrowing, payment, and net-worth deltas. Charts and the monthly ledger use the currently selected scenario with the current quick adjustments.

- Baseline uses original assumptions exactly.
- Optimistic: starting salaries +10%, annual salary growth +1 percentage point, post-graduation living expenses −10%, annual expense growth −1 percentage point.
- Conservative: starting salaries −10%, annual salary growth −1 percentage point, post-graduation living expenses +10%, annual expense growth +1 percentage point.
- Quick what-if: extra annual aid of $0–$20,000 for each college; starting-salary changes of −20% to +20% for each college; and monthly post-graduation living-expense changes of −$1,000 to +$1,000 shared by both paths.

Scenario salary changes multiply the original salary first; quick salary changes multiply that result. Scenario expense changes multiply the original annual living expenses first; the quick monthly expense adjustment ×12 is then added. Aid is added to the original annual scholarship amount. Salary/aid/expense amounts and growth rates remain within the input editor's supported bounds; affected fields are explicitly reported when limited. All three outlook columns include current quick adjustments. None of the presets represents an estimated probability, forecast, or best/worst-case bound.

`src/engine/experiments.ts` handles deterministic, immutable scenario derivation and validation. `src/state/useExploration.ts` derives all scenario results and saves only selected scenario and slider adjustments under `futurelab.exploration.v1`. Malformed saved experiment data falls back to Baseline. Back to original clears both preset and quick changes; Clear adjustments resets only sliders; confirmed Reset example clears experiments and restores example inputs. Theme preferences remain independent.

## Desktop layout and ambient background

FutureLab now targets desktop browsers with a 1,100px minimum document width. Phone/tablet breakpoints, duplicate mobile input tabs, and mobile safe-area positioning have been removed. Compact desktop spacing and large-screen sizing remain. Narrow windows display the desktop layout with horizontal scrolling.

`src/motion/AmbientBackground.tsx` and `ambient.css` provide a restrained flowing mesh background. Both layers derive their colors from the existing Warm Sand / Obsidian Blue theme tokens; no new palette or color cycling is introduced. Two prepainted gradient layers move with CSS transforms over 28- and 38-second alternating cycles, independent of charts and page navigation. The background ignores pointer events, does not enter document layout, pauses when the tab is hidden, stops with reduced-motion preferences, and is hidden with reduced-transparency preferences. No animation library, image asset, or per-frame React updates are required.

The ambient background also has a visible, theme-colored cursor halo. `usePointerHalo.ts` smooths its position with a frame-rate-independent follow and updates only two decorative transforms, without React state updates per pointer event. A 640px rear halo lights the background; a faint 420px reflection keeps it perceptible over glass panels without intercepting interactions. The frame loop stops once the halo reaches its target, and pointer leave, window blur/resize, hidden tabs, unmount, and reduced-motion preferences clear it. The native cursor remains visible.

The ambient backdrop is portaled to `document.body` behind the transparent application root, so its coverage is independent of the selected view, content height, and app stacking contexts. Footer clearance lives inside each view rather than in a separate outer bottom spacer; the sidebar tint fades into the same background near the page end. Vertical overscroll bounce is disabled to avoid exposing a differently painted browser canvas beyond the document. The background portal carries its own reduced-motion attribute, preserving accessibility behavior outside the application shell.

## First-use guidance and personal drafts

New visitors see clearly marked Example College A / B, a choice to Explore example or Use my own inputs, and a dismissible hint explaining that names and amounts are editable. Name inputs include a pencil cue; field descriptions explain annual versus total amounts, first-year gross salary, and shared estimates.

Use my own inputs opens a separate blank draft, focuses the first name, and shows completion progress. Every college name and numeric field must be supplied explicitly, including zero where applicable. Missing or invalid college numbers stay `null` and never enter the simulation engine. Shared assumptions start with the existing estimates, clearly labeled for review; invalid edits block submission. Compare my colleges becomes available only when both colleges are complete and valid. It commits the draft and clears previous experiments so trial adjustments do not silently carry over to the new comparison.

Drafts persist under `futurelab.personal-draft.v1`, separately from the completed comparison; Back to comparison preserves the draft and exposes Continue my draft. Refresh resumes an unfinished draft. Guidance dismissal persists under `futurelab.input-guide.v1`. Existing customized workspaces are retained. Only untouched legacy examples whose names and every financial input match the original examples are renamed automatically to Example College A / B. Reset example clears drafts and restores the first-use guidance.

The Your colleges section includes Zero amounts, which sets both colleges' tuition, housing/living costs, scholarships, total family contribution, and starting salary to zero. Names, attendance years, shared assumptions, and trial settings are preserved. An in-session Undo restores the previous amounts; the button is disabled when every college amount is already zero, protecting the undo snapshot from repeated clicks. Resetting or undoing also clears transient numeric input drafts so the visible fields match the saved values.

## Optional additional colleges

Main Workspace starts with two colleges. The compact Add college button extends the existing two-column editor up to four entries, with zero monetary amounts for a newly added comparison card (blank values in personal setup). A/B/C/D appear throughout charts, budgets, scenarios and ledgers. Optional colleges have their own job-search and career settings. Removing the last optional college clears its settings and quick adjustments. Two-college saved plans remain compatible; new plans save all current colleges. The original theme colors remain, with mixed tones and distinct line patterns for C/D.
