# 🦄 Unicorn Climb App - Development Rules & Guidelines

## 📋 **CRITICAL: App Naming Convention**

### **Display Name vs Technical Name**
- **Display Name**: "Unicorn Climb App" (what users see)
- **Technical Name**: "treniren" (kept for all technical infrastructure)

### **What to Change:**
- ✅ Translation files (`messages/en.json`, `messages/pl.json`)
- ✅ User-facing labels and titles
- ✅ Page titles and meta descriptions
- ✅ Any hardcoded "Treniren" references in components

### **What to NEVER Change:**
- ❌ Directory names (`treniren_app`)
- ❌ Package name (`treniren-app`)
- ❌ Import paths (`@/` aliases)
- ❌ Database tables/fields
- ❌ API routes
- ❌ Technical configuration

### **Why This Approach:**
- **Safe**: No breaking changes to technical infrastructure
- **Quick**: Only affects user-facing text
- **Reversible**: Easy to revert if needed
- **Stable**: Maintains all existing functionality

---

## 🏗️ **Development Guidelines**

### **Code Organization**
- Keep components in `/src/components/`
- Keep API routes in `/src/app/api/`
- Keep types in `/src/types/`
- Keep utilities in `/src/lib/`
- Keep contexts in `/src/contexts/`

### **Database & Prisma**
- Always run `npx prisma generate` after schema changes
- Use `npx prisma db push` for local development
- Never change existing database field names
- Add new fields as optional initially

### **State Management**
- Use React hooks (`useState`, `useEffect`) for local state
- Use Context API for global state (Language, Cycle, Notifications)
- Keep state as close to where it's used as possible

### **Styling**
- Use Tailwind with the Unicorn Climb tokens (`--uc-*`, see Color Palette section below); no raw Tailwind colours
  (`slate-*`, `pink-*`, …), hex values or `dark:` variants in components
- **Dark first, light supported**: tokens switch with `data-theme` on `<html>`, so one class works in both themes
- Build screens from the primitives in `src/components/ui` (Button, Card, Input, BottomSheet, …)
- Radii via `rounded-uc-chip | input | card | sheet | pill`; font is Manrope (`--uc-font`)

### **Internationalization**
- Always use `useLanguage()` hook for text
- Provide fallbacks: `{t('key') || 'Fallback Text'}`
- Update both `en.json` and `pl.json` files
- Use descriptive translation keys

---

## 🎯 **Feature-Specific Rules**

### **Workout Types**
- **GYM**: Traditional gym workouts
- **BOULDERING**: Indoor/outdoor bouldering
- **CIRCUITS**: Circuit training
- **LEAD_ROCK**: Outdoor lead climbing (Strong Mind fields when tracking is on)
- **LEAD_ARTIFICIAL**: Indoor lead climbing (Strong Mind fields when tracking is on)
- **MENTAL_PRACTICE**: Meditation, visualization

### **Event Types**
- **INJURY**: Injury tracking (body part, description, cycle correlation)
- **PHYSIO**: Physical therapy visits
- **COMPETITION**: Climbing competitions
- **TRIP**: Climbing trips (with countdown feature)
- **OTHER**: Miscellaneous events

### **Training Volume**
- **TR1-TR5**: Intensity levels (TR = Training)
- Always display as "TR1", "TR2", etc. (with space)

### **Mental Practice**
- **Time of Day**: Morning 🌅, Midday ☀️, Evening 🌙
- **Practice Types**: Meditation, visualization, breathing
- **Special Fields**: No gratitude/improvements fields

### **Strong Mind Section (Lead Climbing Only)**
- **Climbs section** (`ClimbsSection`): lead and bouldering always list climbs (grade, style, tries, notes)
- **Profile setting** `strongMindTrackingEnabled` turns the Strong Mind fields on for lead only (never bouldering);
  lead workouts ask once ("Track your headspace on lead?"), recorded in `strongMindPromptAnswered`
- **Mental State Tracking**: Before/during climbing feelings (1-5 scale)
- **Focus States**: Choke, Distraction, Present, Focused, Clutch, Flow
- **Comfort Zones**: Comfort, Stretch 1, Stretch 2, Panic
- **Climb Sections**: Multiple sections with individual tracking
- **Falls Tracking**: Yes/No with notes for each section
- **Reflections**: Gratitude and improvements sections

### **Goal System**
- **Process Goals**: Long-term (≥3 months) and short-term (<3 months)
- **Project Goals**: Specific routes/boulders with grade systems
- **Timeframe Selection**: Duration + unit (days/weeks/months/quarters/years) + start date
- **Grade Systems**: French, Polish, American (routes/boulders)
- **Goal Progress**: Process goals use 1-3 bubble scale, project goals use trophy completion

### **Workout Form Integration**
- **Process Goals Section**: Toggle to enable/disable with 1-3 progress bubbles
- **Project Goals Section**: Toggle to enable/disable with trophy completion buttons
- **Positioning**: Goals section appears before gratitude section
- **Data Persistence**: Goal progress saved in mentalState field

### **Statistics & Analytics**
- **Injury vs Cycle**: Shows injury patterns by cycle phase
- **Process Goals Progress**: Historical progress tracking
- **Project Goals Achievements**: Achievement dates with trophy indicators
- **Cycle Correlation**: Performance patterns by menstrual cycle phase

### **Data Storage**
- **Local Storage**: Temporary storage for goals (until backend integration)
- **Database Fields**: mentalState (Json) stores all goal progress data
- **API Integration**: Create/update workouts includes mentalState field
- **Progress History**: Fetched from workout data for goal display

---

## 🔧 **Technical Standards**

### **Error Handling**
- Always wrap API calls in try-catch
- Provide user-friendly error messages
- Log errors to console for debugging
- Graceful fallbacks for missing data

### **Performance**
- Use `useMemo` for expensive calculations
- Use `useCallback` for event handlers passed to children
- Lazy load heavy components with `dynamic()`
- Optimize images and assets

### **Accessibility**
- Use semantic HTML elements
- Provide alt text for images
- Ensure keyboard navigation works
- Use proper ARIA labels

### **PWA Features**
- Support offline functionality
- Use service worker for caching
- Provide install prompts
- Handle sync when back online

---

## 📱 **UI/UX Guidelines**

### **Navigation**
- Main nav: Workouts, Calendar, Statistics
- Mobile nav: Same items in hamburger menu
- Consistent header across all pages
- Breadcrumbs for deep navigation

### **Forms**
- Clear validation messages
- Loading states during submission
- Success feedback after actions
- Cancel/back options always available

### **Cards & Lists**
- Consistent spacing and shadows
- Hover effects for interactive elements
- Clear visual hierarchy
- Responsive grid layouts

### **Colors & Themes**
Source of truth: `design/DESIGN.md` and `src/app/tokens.css` (copy of `design/tokens.css`), mapped to Tailwind in
`src/app/globals.css` (`@theme inline`).
- **Backgrounds**: `bg-uc-bg` (page), `bg-uc-surface` (cards), `bg-uc-elevated` (sheets, menus, dialogs)
- **Text**: `text-uc-text`, `text-uc-text-muted`; borders `border-uc-border`
- **Brand**: `bg-uc-primary` / `text-uc-on-primary`, `bg-uc-primary-container` / `text-uc-on-primary-container`
- **Accent** (main CTA only, one per screen): `bg-uc-accent` / `text-uc-on-accent`; as text `text-uc-accent-text`
- **Semantic**: `uc-success`, `uc-warning`, `uc-error` + banner backgrounds `bg-uc-*-bg`
- **Domain colours**: cycle phases `bg-uc-phase-*` (solid) / `bg-uc-band-*` (calendar band), workout types
  `bg-uc-workout-*`, Strong Mind `uc-focus-*` / `uc-zone-*`, tag swatches `uc-tag-1…10`; text on solid chips
  `text-uc-chip-ink`
- **Numbers**: add `uc-num` (tabular figures) to counts, dates and stats

### **CTA Button Guidelines**
Use `Button` / `buttonClasses(variant, size)` from `@/components/ui`:
- `accent` — the main CTA (Save, Log, Get started); `primary` — secondary filled; `tonal` — inline actions;
  `ghost` — Cancel and outline actions; `destructive` — delete confirmations
- Sizes: `md` (44px), `lg` (56px), `icon` (44×44). Minimum tap target is 44×44px.
- Links: `text-uc-primary` (underlined in running text)

---

## 🎨 **Color Palette Configuration**

Tokens live in `src/app/tokens.css` (dark under `:root` / `[data-theme="dark"]`, light under `[data-theme="light"]`)
and are exposed to Tailwind in `globals.css`:

```css
@theme inline {
  --color-uc-bg: var(--uc-bg);
  --color-uc-surface: var(--uc-surface);
  --color-uc-primary: var(--uc-primary);
  --color-uc-accent: var(--uc-accent);
  /* … phases, bands, workouts, radii, shadow */
}
```

To add a colour: add the token to `design/tokens.css` and `src/app/tokens.css` (both themes), then map it in
`@theme inline`. Charts (Recharts) take `var(--uc-*)` strings directly.

### **Component Styling Examples**
```tsx
import { Button, Card, Overline, buttonClasses } from '@/components/ui'

<Button variant="accent" size="lg">Save</Button>
<Button variant="ghost">Cancel</Button>
<Link href="/workouts" className={buttonClasses('tonal')}>Workouts</Link>

<Card>
  <Overline>Training volume</Overline>
  <h3 className="text-[17px] font-extrabold text-uc-text">Card title</h3>
  <p className="text-sm text-uc-text-muted">Card content</p>
</Card>
```

---

## 🚨 **Common Pitfalls to Avoid**

### **Database Issues**
- Don't change existing enum values
- Always test schema changes locally first
- Backup data before major migrations
- Use transactions for complex operations

### **State Management**
- Don't mutate state directly
- Use functional updates for state
- Avoid unnecessary re-renders
- Clean up subscriptions in useEffect

### **API Routes**
- Always validate input data
- Use proper HTTP status codes
- Handle edge cases gracefully
- Return consistent response formats

### **Component Design**
- Keep components focused and single-purpose
- Use composition over inheritance
- Avoid prop drilling
- Make components reusable

---

## 📝 **Testing Checklist**

### **Before Committing**
- [ ] App displays "Unicorn Climb App" (not "Treniren")
- [ ] All CTA buttons use `bg-uc-mustard` with `text-uc-black`
- [ ] All secondary buttons use `bg-uc-dark-bg/50` or `border-uc-purple/20`
- [ ] All links use `text-uc-purple hover:text-uc-mustard`
- [ ] All features work in dark mode (primary mode)
- [ ] Forms validate correctly
- [ ] API routes return expected data
- [ ] No console errors
- [ ] Responsive design works on mobile
- [ ] Offline functionality works

### **After Major Changes**
- [ ] Test all workout types
- [ ] Test all event types
- [ ] Test calendar functionality
- [ ] Test statistics calculations
- [ ] Test PWA installation
- [ ] Test offline sync
- [ ] Test Strong Mind section (lead climbing only)
- [ ] Test goal system (process and project goals)
- [ ] Test goal progress tracking and saving
- [ ] Test goal achievements in Strong Mind page
- [ ] Test hydration error prevention
- [ ] Test translation keys for new features

---

## 🔄 **Deployment Guidelines**

### **Environment Setup**
- Use `.env.local` for local development
- Use `.env.production` for production
- Never commit sensitive data
- Use environment variables for API keys

### **Build Process**
- Run `npm run build` before deployment
- Check for TypeScript errors
- Verify all routes work
- Test PWA functionality

### **Version Control**
- Use descriptive commit messages
- Create feature branches for major changes
- Test thoroughly before merging
- Keep main branch stable

---

## 📞 **Emergency Procedures**

### **If App Breaks**
1. Check browser console for errors
2. Verify all imports are correct
3. Check if database is accessible
4. Restart development server
5. Clear browser cache
6. Check if all dependencies are installed

### **If Database Issues**
1. Run `npx prisma generate`
2. Check schema.prisma syntax
3. Verify database connection
4. Run `npx prisma db push`
5. Check if migrations are needed

### **If Build Fails**
1. Check TypeScript errors
2. Verify all imports exist
3. Check for syntax errors
4. Clear `.next` folder
5. Reinstall dependencies if needed

---

## 🎨 **Brand Guidelines**

### **App Identity**
- **Name**: Unicorn Climb App
- **Tagline**: "Train with your unicorn flow" (EN) / "Znajdź swój jednorożcowy flow" (PL)
- **Colors**: Custom UC palette with mustard yellow CTAs and purple accents
- **Tone**: Professional, encouraging, supportive, feminine aesthetic

### **User Experience**
- Focus on functionality over flashy design
- Make actions clear and immediate
- Provide helpful feedback
- Support both beginners and advanced climbers

---

*Last Updated: December 2024*
*Version: 2.0*
*Maintainer: Development Team*
