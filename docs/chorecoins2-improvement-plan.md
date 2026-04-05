# ChoreCoins2 Improvement Plan for Cursor

## Goal

Refactor ChoreCoins2 from a polished prototype into a production-ready family app with:
- cleaner architecture
- stronger typing
- real multi-user data
- parent/child roles
- approval workflows
- test coverage
- a clear migration path from localStorage to Supabase

This plan is based on the current repo structure and code patterns in:
- `src/App.tsx`
- `src/pages/Chores.tsx`
- `src/pages/Invest.tsx`
- `src/pages/ParentDashboard.tsx`
- `src/hooks/useGamification.ts`
- `src/hooks/usePortfolio.ts`
- `src/contexts/AuthContext.tsx`
- `src/integrations/supabase/client.ts`
- `src/lib/safeLocalStorage.ts`
- `eslint.config.js`

---

## Executive Summary

The app already has strong UI and product direction, but the main issue is architecture.

Right now the app behaves like a real product while much of the actual state is still local-only:
- chores
- achievements
- streaks
- portfolio
- savings goals
- spending
- onboarding state

The biggest risks are:
1. too much business logic inside page components and large hooks
2. too much reliance on `localStorage`
3. incomplete multi-user / household model
4. weak type safety in a few critical spots
5. no test layer protecting chore logic, streak logic, and achievement logic

The right approach is to stop adding surface-level features for a bit and harden the app foundation.

---

# Priority Roadmap

## Phase 1 - Stabilize and clean architecture
Do this first before adding major new features.

### Objectives
- fix obvious bugs
- reduce risk
- break up oversized files
- make logic testable
- improve type safety

### Tasks
1. Fix `ParentDashboard` achievement count bug
   - It references `userStats.achievements?.length`
   - `achievements` is not part of `UserStats`
   - Pull achievement count from the actual achievements source instead

2. Refactor `src/App.tsx`
   - Move provider setup into `AppProviders`
   - Move route definitions into `AppRouter`
   - Move auth hash redirect / media mute / scroll lock logic into `GlobalEffects`

3. Refactor `src/pages/Chores.tsx`
   - Split UI from business logic
   - Create:
     - `src/features/chores/components/ChorePage.tsx`
     - `src/features/chores/components/ChoreDialogs.tsx`
     - `src/features/chores/lib/recurrence.ts`
     - `src/features/chores/lib/allowance.ts`
     - `src/features/chores/lib/choreTemplates.ts`
     - `src/features/chores/types.ts`

4. Refactor `src/hooks/useGamification.ts`
   - Break into:
     - `src/features/gamification/useGamificationStore.ts`
     - `src/features/gamification/lib/xp.ts`
     - `src/features/gamification/lib/achievements.ts`
     - `src/features/gamification/lib/streaks.ts`
     - `src/features/gamification/lib/notifications.ts`
     - `src/features/gamification/types.ts`

5. Refactor `src/hooks/usePortfolio.ts`
   - Split into:
     - `src/features/portfolio/usePortfolioStore.ts`
     - `src/features/portfolio/lib/calculations.ts`
     - `src/features/portfolio/types.ts`

6. Improve Supabase client safety
   - Remove `null as any`
   - Use a typed client factory or explicit guard
   - Make missing envs fail clearly in dev

7. Improve linting gradually
   - Re-enable:
     - `react-hooks/exhaustive-deps`
   - Start reducing:
     - `@typescript-eslint/no-explicit-any`
   - Keep changes incremental to avoid slowing the project down too much

8. Add test setup
   - Add Vitest
   - Add React Testing Library
   - Add first unit tests for:
     - recurring chore matching
     - allowance calculation
     - streak calculation
     - achievement unlock logic
     - portfolio contribution logic

---

## Phase 2 - Move from localStorage to Supabase
This is the most important product upgrade.

### Objectives
- persist real user data
- support multiple devices
- support parent/child accounts
- stop treating the browser as the database

### Data to migrate first
- profiles
- households
- household_members
- chores
- chore_completions
- achievements
- user_stats
- savings_goals
- spending_transactions
- portfolio_items

### Proposed schema

#### profiles
- id UUID PK references auth.users
- email text
- display_name text
- avatar_url text nullable
- role text check in ('parent', 'child')
- created_at timestamptz default now()

#### households
- id UUID PK
- name text
- created_by UUID references profiles.id
- created_at timestamptz default now()

#### household_members
- id UUID PK
- household_id UUID references households.id
- profile_id UUID references profiles.id
- role text check in ('parent', 'child')
- created_at timestamptz default now()

#### chores
- id UUID PK
- household_id UUID references households.id
- assigned_to UUID references profiles.id
- created_by UUID references profiles.id
- title text
- description text
- category text
- difficulty text
- emoji text
- due_date date
- recurring_type text nullable
- recurring_days int[] nullable
- status text check in ('pending', 'submitted', 'approved', 'rejected')
- reward_amount numeric default 0
- created_at timestamptz default now()

#### chore_completions
- id UUID PK
- chore_id UUID references chores.id
- completed_by UUID references profiles.id
- completed_at timestamptz
- approved_by UUID nullable references profiles.id
- approved_at timestamptz nullable
- rejection_reason text nullable
- proof_image_url text nullable

#### user_stats
- profile_id UUID PK references profiles.id
- level int default 1
- xp int default 0
- total_xp int default 0
- chore_streak int default 0
- learning_streak int default 0
- total_chores_completed int default 0
- total_lessons_completed int default 0
- total_money_earned numeric default 0
- updated_at timestamptz default now()

#### achievements
- id text PK
- title text
- description text
- icon text
- category text
- requirement int
- rarity text

#### user_achievements
- id UUID PK
- profile_id UUID references profiles.id
- achievement_id text references achievements.id
- unlocked_at timestamptz
- progress int default 0

#### savings_goals
- id UUID PK
- profile_id UUID references profiles.id
- title text
- target_amount numeric
- saved_amount numeric default 0
- deadline date nullable
- created_at timestamptz default now()

#### spending_transactions
- id UUID PK
- profile_id UUID references profiles.id
- title text
- amount numeric
- category text
- created_at timestamptz default now()

#### portfolio_items
- id UUID PK
- profile_id UUID references profiles.id
- name text
- value numeric
- allocation numeric
- change_percent numeric
- shares numeric nullable
- avg_price numeric nullable
- created_at timestamptz default now()

---

## Phase 3 - Add true household roles and flows

### Objectives
- support real parent/child usage
- separate permissions correctly
- allow shared household oversight

### Required behavior
1. Parent can create household
2. Parent can invite child accounts
3. Child can see only their own chores, stats, savings, and learning
4. Parent can see overview of all children in household
5. Parent can assign chores
6. Child can submit chores complete
7. Parent approves or rejects
8. XP / money / streak updates happen after approval in parent-managed mode

### Route protection plan
Create:
- `ParentRoute`
- `ChildRoute`
- `ProtectedRoute`

Rules:
- `/parent` only for parent role
- child pages can be restricted by auth
- guest mode can still exist, but must be clearly separate from signed-in mode

---

## Phase 4 - Approval workflow

### Objectives
Make the parent dashboard actually useful.

### New states for chores
- pending
- submitted
- approved
- rejected

### Flow
1. Parent assigns chore
2. Child completes chore and taps submit
3. Optional: child uploads photo proof
4. Parent reviews in dashboard
5. Parent approves or rejects
6. On approval:
   - update completion
   - award XP
   - update streak
   - award money / allowance progress
   - check achievements

### Parent dashboard additions
Add:
- submitted chores queue
- approve button
- reject button
- rejection reason
- filter by child
- weekly completion view by child
- allowance summary by child

---

## Phase 5 - Product truth and simulator clarity

### Investing section
Decide what this feature is:
- educational simulator only
- partially real
- real connected external account

Right now it reads like a mix of playful simulation and real financial tooling.

### Recommendation
For now:
- label simulator features clearly
- keep fake portfolio separate from any real linked account
- do not blur “learning mode” with “real account mode”

### Suggested tabs
- Learning Portfolio
- Goals
- Spending
- Real Account (optional and clearly marked)

---

# File-by-File Refactor Recommendations

## 1. `src/App.tsx`
### Current issue
Contains too many global concerns:
- providers
- routing
- auth hash handling
- media muting
- scroll-lock repair

### Refactor target
Create:
- `src/app/AppProviders.tsx`
- `src/app/AppRouter.tsx`
- `src/app/GlobalEffects.tsx`

### Desired structure
```tsx
const App = () => (
  <AppProviders>
    <BrowserRouter>
      <GlobalEffects />
      <AppRouter />
    </BrowserRouter>
  </AppProviders>
);
```

---

## 2. `src/pages/Chores.tsx`
### Current issue
Very large page with:
- recurrence logic
- allowance logic
- template logic
- local storage persistence
- dialog state
- completion logic
- rendering logic

### Refactor target
Split into:
- `src/features/chores/pages/ChoresPage.tsx`
- `src/features/chores/components/ChoreList.tsx`
- `src/features/chores/components/ChoreStats.tsx`
- `src/features/chores/components/AddChoreDialog.tsx`
- `src/features/chores/components/EditChoreDialog.tsx`
- `src/features/chores/lib/recurrence.ts`
- `src/features/chores/lib/allowance.ts`
- `src/features/chores/lib/storage.ts`
- `src/features/chores/types.ts`

### Important note
All pure logic should move out of React components where possible.

---

## 3. `src/hooks/useGamification.ts`
### Current issue
Too much in one hook:
- state
- achievements
- XP logic
- streak logic
- notifications
- persistence

### Refactor target
Move pure logic into small utility modules.
Keep the hook as a coordinator, not the whole system.

### Suggested structure
- `types.ts`
- `achievementDefinitions.ts`
- `calculateStreak.ts`
- `awardXp.ts`
- `checkAchievementUnlocks.ts`
- `createNotification.ts`

---

## 4. `src/pages/ParentDashboard.tsx`
### Current issue
Reads data directly from `localStorage` and assumes single-child local state.

### Refactor target
Use queried household data from Supabase:
- parent summary cards
- child-by-child breakdown
- submitted chores needing approval
- household weekly overview

### Must-fix bug
Do not read `userStats.achievements?.length`

---

## 5. `src/contexts/AuthContext.tsx`
### Current issue
Works, but needs better alignment with profile + household role data.

### Improvement
Extend auth initialization to fetch:
- profile
- role
- household memberships

### Suggested output
```ts
interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  activeHousehold: Household | null;
  role: "parent" | "child" | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  ...
}
```

---

## 6. `src/integrations/supabase/client.ts`
### Current issue
Unsafe fallback:
```ts
: null as any
```

### Improvement
Use one of these patterns:
1. throw explicit error in development
2. export nullable client with strict guards
3. create helper `getSupabaseOrThrow()`

### Recommendation
Use explicit runtime guard and preserve real typing.

---

## 7. `src/hooks/usePortfolio.ts`
### Current issue
Still local-first and mixed storage/business logic.

### Improvement
Split:
- calculations
- state access
- persistence adapter

This also makes it easier to switch from local mode to Supabase-backed mode later.

---

## 8. `eslint.config.js`
### Current issue
A few important protections are disabled.

### Recommended approach
Do not turn all strict rules on at once.
Instead:
1. re-enable `react-hooks/exhaustive-deps`
2. stop introducing new `any`
3. gradually replace old `any` usage in refactored files
4. add CI lint enforcement later

---

# Testing Plan

## Add tooling
Install:
```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom
```

Update `package.json`:
```json
{
  "scripts": {
    "test": "vitest",
    "test:run": "vitest run"
  }
}
```

## First tests to write
1. `recurrence.test.ts`
   - daily chores match every day
   - weekly chores match every 7 days
   - monthly chores match same day of month
   - custom recurring days work correctly

2. `allowance.test.ts`
   - weekly allowance only earned when all chores are complete
   - Saturday logic works
   - partial completion does not pay allowance

3. `streaks.test.ts`
   - consecutive date streaks calculate correctly
   - missing a day breaks streak
   - empty input returns 0

4. `achievements.test.ts`
   - first chore unlocks properly
   - streak achievements unlock properly
   - XP reward is applied once

5. `portfolio.test.ts`
   - contributions reduce cash
   - cannot over-contribute
   - total value and change math are correct

---

# Migration Strategy

## Step 1 - Dual-mode persistence
Introduce a data layer abstraction:
- guest mode uses local storage
- signed-in mode uses Supabase

Example:
```ts
interface ChoreRepository {
  list(): Promise<Chore[]>;
  create(input: CreateChoreInput): Promise<Chore>;
  update(id: string, updates: Partial<Chore>): Promise<Chore>;
  remove(id: string): Promise<void>;
}
```

Create:
- `LocalChoreRepository`
- `SupabaseChoreRepository`

This avoids a huge all-at-once rewrite.

## Step 2 - Migrate one feature at a time
Migration order:
1. profiles + households
2. chores
3. chore completions
4. user stats / achievements
5. savings goals
6. spending transactions
7. portfolio items

## Step 3 - Keep guest mode
Guest mode is still useful for demos and onboarding.
But keep it clearly separated from authenticated family mode.

---

# Suggested Directory Structure

```txt
src/
  app/
    AppProviders.tsx
    AppRouter.tsx
    GlobalEffects.tsx

  features/
    auth/
      types.ts
      useAuthProfile.ts

    chores/
      components/
        AddChoreDialog.tsx
        EditChoreDialog.tsx
        ChoreList.tsx
        ChoreStats.tsx
      lib/
        recurrence.ts
        allowance.ts
        storage.ts
      pages/
        ChoresPage.tsx
      types.ts

    gamification/
      lib/
        xp.ts
        streaks.ts
        achievements.ts
        notifications.ts
      hooks/
        useGamificationStore.ts
      types.ts

    portfolio/
      lib/
        calculations.ts
      hooks/
        usePortfolioStore.ts
      types.ts

    parent/
      pages/
        ParentDashboardPage.tsx
      components/
        SubmittedChoresQueue.tsx
        ChildProgressCards.tsx

  integrations/
    supabase/
      client.ts
      repositories/
        chores.ts
        households.ts
        achievements.ts

  test/
    setup.ts
```

---

# Concrete Implementation Order for Cursor

Ask Cursor to perform the work in this order:

## Task 1
Fix immediate bugs and reduce risk
- fix `ParentDashboard` achievement count issue
- improve Supabase client typing
- add test setup
- do not change behavior yet unless required for bug fix

## Task 2
Refactor `App.tsx`
- create `AppProviders`
- create `AppRouter`
- create `GlobalEffects`
- keep behavior identical

## Task 3
Refactor chore domain
- move recurrence logic to pure utility files
- move allowance logic to pure utility files
- split add/edit chore dialogs
- keep current UI working

## Task 4
Refactor gamification domain
- move streak calculation, XP logic, and achievement logic into pure modules
- keep same public behavior

## Task 5
Create Supabase schema and repositories
- add SQL migration files
- create TypeScript repository wrappers
- no UI rewrite yet

## Task 6
Wire authenticated users to profiles + households
- extend auth context
- fetch profile and active household
- protect parent route

## Task 7
Move chores from localStorage to Supabase for signed-in users
- keep guest mode fallback
- preserve current screens

## Task 8
Add parent approval workflow
- submitted / approved / rejected states
- parent queue
- approval actions

## Task 9
Migrate stats, achievements, and financial features
- make them real per-user data
- keep simulator labeling clear

---

# Definition of Done

This project is meaningfully improved when:
- no core page has massive mixed logic like current `Chores.tsx`
- `useGamification.ts` is no longer a giant all-in-one hook
- parent and child roles are real
- signed-in users persist to Supabase
- guest mode still works
- chores can be submitted and approved
- XP, streaks, and rewards are based on real data flow
- tests exist for core business rules
- linting is stronger and type safety is improved

---

# Final Guidance for Cursor

Do not rewrite the whole app at once.

Use incremental refactors with behavior preservation:
1. stabilize
2. extract pure logic
3. add tests
4. add data layer
5. migrate storage
6. add approvals
7. polish roles and dashboards

Prefer small, reviewable commits over giant sweeping rewrites.

When uncertain, preserve current UX and improve architecture underneath it first.
