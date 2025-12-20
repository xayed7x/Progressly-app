# Progressly UI Redesign - Master Plan

## Document Purpose
This is a comprehensive redesign plan to transform Progressly from functional (6.5/10) to visually polished (9/10). Each section contains specific implementation details for AI code editor to execute.

**Inspiration Source**: Quran app design principles - soft gradients, generous spacing, bold typography, emotional design.

---

## Current Issues Summary

### Critical Problems (Must Fix)
1. **Visual Hierarchy Broken** - Everything same weight, can't identify important elements
2. **Color System Chaotic** - Bright yellow (#FFEB3B), random colors, no sophistication
3. **Cards Too Flat** - No depth, shadows, or gradients
4. **Typography Weak** - Sizes too similar, no weight variation
5. **Spacing Cramped** - Components too close, no breathing room
6. **Low Emotional Impact** - Functional but not delightful

### What's Working
1. ✅ Bottom navigation structure
2. ✅ Overall layout logic
3. ✅ Feature completeness
4. ✅ Dark mode foundation

---

## Redesign Architecture (7 Sections)

### Section 1: Design System Foundation
**What**: Create core design tokens (colors, typography, spacing, shadows)
**Why**: Consistent foundation for all components
**Files**: `tailwind.config.ts`, `src/styles/design-tokens.ts`
**Impact**: 8/10 - Affects entire app

### Section 2: Typography System
**What**: Implement proper type scale with hierarchy
**Why**: Makes important elements stand out, improves readability
**Components**: All text elements across app
**Impact**: 9/10 - Biggest visual improvement

### Section 3: Card Component Redesign
**What**: Add gradients, shadows, better spacing, rounded corners
**Why**: Creates depth and visual interest
**Components**: Activity cards, commitment cards, stats cards
**Impact**: 8/10 - Most visible improvement

### Section 4: Dashboard Layout Optimization
**What**: Restructure hierarchy - hero progress, commitments, logging
**Why**: Action-first design for better productivity UX
**Files**: `ChallengeDashboard.tsx`, `DashboardClientPage.tsx`
**Impact**: 9/10 - Core user experience

### Section 5: Quick Tap Logging Enhancement
**What**: Larger icons, better grid layout, gradient backgrounds
**Why**: Most-used feature needs premium feel
**Files**: `QuickTapLogging.tsx`
**Impact**: 7/10 - Frequently used

### Section 6: Progress Visualization Polish
**What**: Animated rings, better charts, trend indicators
**Why**: Make progress feel rewarding
**Components**: `DualRingProgress.tsx`, `DailySummaryChart.tsx`, `HeatmapCalendar.tsx`
**Impact**: 8/10 - Motivational impact

### Section 7: Micro-interactions & Animations
**What**: Hover states, transitions, success animations
**Why**: Delight factor, premium feel
**Files**: All interactive components
**Impact**: 6/10 - Nice-to-have polish

---

## Section 1: Design System Foundation

### 1.1 Color Palette (Replace Existing)

**Primary Colors** (Mint Green - Success/Growth)
```
primary-50: #F0FDF4    (backgrounds)
primary-100: #DCFCE7   (hover states)
primary-500: #A8E6CF   (main brand color)
primary-600: #86D4B1   (active states)
primary-900: #064E3B   (dark accents)
```

**Secondary Colors** (Purple - Premium/Spiritual)
```
secondary-50: #FAF5FF   (backgrounds)
secondary-500: #8B7AB8  (accents, interactive)
secondary-600: #7C6BA6  (hover)
secondary-900: #3B1E6B  (dark)
```

**Accent Colors**
```
accent1: #FFD93D  (Warm yellow - highlights, NOT bright yellow)
accent2: #FF6B6B  (Soft red - danger/delete)
accent3: #4ECDC4  (Cyan - info)
```

**Neutral Colors** (Dark Mode Optimized)
```
dark-bg: #0A0A0B      (main background)
dark-card: #1A1A1C    (card backgrounds)
dark-text: rgba(255,255,255,0.9)   (primary text)
dark-text-muted: rgba(255,255,255,0.6)  (secondary text)
```

**Implementation**:
- Update `tailwind.config.ts` with complete color system
- Create utility class for gradients (mint-to-purple, blue-to-cyan)
- Remove all instances of bright yellow (#FFEB3B)
- Replace with warm yellow (#FFD93D)

### 1.2 Typography Scale

**Font Sizes & Weights**
```
hero: 56px/1.2/700      (Main dashboard percentage: 87%)
display: 40px/1.2/700   (Section headings)
h1: 32px/1.3/600        (Page titles)
h2: 24px/1.3/600        (Card titles)
h3: 20px/1.4/600        (Subsection headings)
body-lg: 18px/1.5/400   (Important body text)
body: 16px/1.5/400      (Default body)
body-sm: 14px/1.5/400   (Secondary text)
caption: 12px/1.4/400   (Timestamps, labels)
```

**Font Weights**
```
light: 300   (captions in dark mode)
regular: 400 (body text)
medium: 500  (emphasized body)
semibold: 600 (subheadings)
bold: 700    (headings, numbers)
```

**Implementation**:
- Update global CSS with font-size variables
- Create Typography component with variants
- Replace all text elements with proper sizes
- Ensure number displays use bold weight

### 1.3 Spacing System

**Scale** (Tailwind-compatible)
```
xs: 4px    (tight spacing, icon gaps)
sm: 8px    (related items)
md: 16px   (card padding, list gaps)
lg: 24px   (section spacing)
xl: 32px   (major sections)
2xl: 48px  (page-level spacing)
3xl: 64px  (hero sections)
```

**Usage Rules**:
- Card internal padding: `md` (16px)
- Gap between cards in list: `md` (16px)
- Section spacing: `lg` (24px)
- Page padding: `xl` (32px)
- Hero element margin: `2xl` (48px)

### 1.4 Shadow System

**Elevation Levels**
```
shadow-xs: 0 1px 2px rgba(0,0,0,0.05)        (subtle elements)
shadow-sm: 0 2px 4px rgba(0,0,0,0.1)         (buttons)
shadow-md: 0 4px 12px rgba(0,0,0,0.15)       (cards)
shadow-lg: 0 8px 20px rgba(0,0,0,0.2)        (modals, hover states)
shadow-xl: 0 12px 32px rgba(0,0,0,0.25)      (popups)
```

**Colored Shadows** (for premium feel)
```
shadow-primary: 0 4px 12px rgba(168,230,207,0.3)  (mint glow)
shadow-secondary: 0 4px 12px rgba(139,122,184,0.3) (purple glow)
```

### 1.5 Border Radius

```
sm: 8px     (small buttons, pills)
md: 12px    (buttons, inputs)
lg: 16px    (cards)
xl: 20px    (large cards, modals)
2xl: 24px   (hero cards)
full: 9999px (pills, avatars)
```

### 1.6 Gradient Definitions

**Background Gradients**
```
gradient-mint: linear-gradient(135deg, #A8E6CF 0%, #DCFCE7 100%)
gradient-purple: linear-gradient(135deg, #8B7AB8 0%, #C4B5E8 100%)
gradient-warm: linear-gradient(135deg, #FFD93D 0%, #FFA500 100%)
gradient-cool: linear-gradient(135deg, #4ECDC4 0%, #44A08D 100%)
gradient-pink: linear-gradient(135deg, #FFB3D9 0%, #FFC8DD 100%)
```

**Glass Effect**
```
backdrop-blur-md + bg-white/10 (dark mode)
backdrop-blur-md + bg-black/5 (light mode)
```

---

## Section 2: Typography System Implementation

### 2.1 Create Typography Component

**Purpose**: Centralized text rendering with consistent styling

**File**: `src/components/ui/Typography.tsx`

**Variants**:
```typescript
type TypographyVariant = 
  | 'hero'      // 56px/700 - Dashboard main number
  | 'display'   // 40px/700 - Section headings
  | 'h1'        // 32px/600 - Page titles
  | 'h2'        // 24px/600 - Card titles
  | 'h3'        // 20px/600 - Subsection
  | 'body-lg'   // 18px/400 - Important body
  | 'body'      // 16px/400 - Default
  | 'body-sm'   // 14px/400 - Secondary
  | 'caption'   // 12px/400 - Labels
```

**Props**:
```typescript
{
  variant: TypographyVariant
  weight?: 'light' | 'regular' | 'medium' | 'semibold' | 'bold'
  color?: 'primary' | 'secondary' | 'muted' | 'accent'
  className?: string
  children: ReactNode
}
```

**Implementation**:
- Use Tailwind classes mapped to variants
- Support custom weight override
- Default colors based on dark mode
- Allow className for one-off customization

### 2.2 Typography Audit & Replacement

**Dashboard (Screen 1)**:
```
Current: "Welcome back, Zayed!" - 24px
Fix: Typography variant="h3" weight="semibold" (20px) + reduce emphasis

Current: "Coach Insight" - 16px
Fix: Typography variant="h3" weight="semibold" (20px)

Current: "0% Today" - 32px
Fix: Typography variant="hero" weight="bold" (56px) + color="accent1"

Current: "Day 1 of 100" - 14px
Fix: Typography variant="body" (16px)

Current: "100 days consistency test" - 18px thin
Fix: Typography variant="h2" weight="semibold" (24px)
```

**Activity Cards (Screen 2-3)**:
```
Current: Activity name - 16px regular
Fix: Typography variant="h3" weight="semibold" (20px)

Current: Timestamp - 14px regular
Fix: Typography variant="body-sm" color="muted" (14px)

Current: Duration - not shown separately
Fix: Add Typography variant="caption" (12px) in muted color
```

**Commitment Cards**:
```
Current: "Study" - 16px
Fix: Typography variant="h3" weight="semibold" (20px)

Current: "0 / 10 hours" - 14px
Fix: Typography variant="body-lg" (18px) with bold numbers
  Example: <span className="font-bold">0</span> / 10 hours

Current: "0%" - 24px
Fix: Typography variant="display" weight="bold" (40px)
```

### 2.3 Number Formatting

**Rule**: All numbers (stats, percentages, hours) must be bold

**Implementation**:
```typescript
// Create utility component
function BoldNumber({ value, unit }: { value: number; unit?: string }) {
  return (
    <span>
      <span className="font-bold text-primary-500">{value}</span>
      {unit && <span className="text-muted">{unit}</span>}
    </span>
  );
}

// Usage
<BoldNumber value={87} unit="%" />  // 87%
<BoldNumber value={8} unit=" hours" /> // 8 hours
```

---

## Section 3: Card Component Redesign

### 3.1 Base Card Component

**File**: `src/components/ui/Card.tsx`

**Variants**:
```typescript
type CardVariant = 
  | 'default'    // Glass effect + shadow
  | 'gradient'   // With background gradient
  | 'elevated'   // Extra shadow for emphasis
  | 'flat'       // No shadow, just border
```

**Props**:
```typescript
{
  variant?: CardVariant
  gradient?: 'mint' | 'purple' | 'warm' | 'cool' | 'pink'
  padding?: 'sm' | 'md' | 'lg'
  className?: string
  children: ReactNode
  onClick?: () => void
}
```

**Base Styles**:
```
- Border radius: 16px
- Padding: 16px (md), 20px (lg)
- Shadow: shadow-md (0 4px 12px rgba(0,0,0,0.15))
- Background: dark-card (#1A1A1C) with glass effect
- Border: 1px solid rgba(255,255,255,0.1)
- Transition: all 0.2s ease
```

**Hover State**:
```
- Shadow: shadow-lg
- Transform: translateY(-2px)
- Border: 1px solid rgba(255,255,255,0.2)
```

### 3.2 Activity Card Redesign

**File**: `src/components/ActivitiesWrapper.tsx` (modify existing cards)

**New Structure**:
```
┌─────────────────────────────────────────┐
│  Fazr                          [⋮]      │  ← Name (h3, 20px bold)
│  5:50 AM - 6:29 AM                      │  ← Time (body-sm, muted)
│  39 minutes                              │  ← Duration (caption, muted)
│                                          │
│  ┌─────────────────────────────┐        │
│  │  ☪️ Spiritual & Faith       │        │  ← Category pill (larger)
│  └─────────────────────────────┘        │
│                                          │
└─────────────────────────────────────────┘
```

**Styling Changes**:
```
1. Increase border-radius: 12px → 16px
2. Add subtle gradient background based on category
3. Increase padding: 12px → 16px
4. Make activity name bold (20px)
5. Show duration explicitly
6. Category pill:
   - Larger: 32px height
   - Add category icon (24px)
   - Use category color as background
   - White text
7. Menu button (⋮):
   - Increase touch target: 32x32px
   - Move to top-right corner
   - Gray color when not hovered
```

**Gradient by Category**:
```
Work: gradient-cool (cyan to teal)
Study: gradient-mint (mint green)
Spiritual: gradient-purple
Exercise: gradient-warm (orange)
Personal: gradient-pink
Sleep: gradient-blue (light blue)
Food: gradient-warm
Social: gradient-purple (lighter)
```

### 3.3 Commitment Card Redesign

**File**: `src/components/challenges/DailyCommitments.tsx`

**Current Issues**:
- Progress bar too thin
- Text too small
- No visual excitement

**New Structure**:
```
┌─────────────────────────────────────────┐
│  📚 Study                        [▶]    │  ← Icon + name (h3)
│                                          │
│  ████████████░░░░░░░░░░░░              │  ← Thicker progress bar
│  8 / 10 hours                    80%    │  ← Bold numbers
│                                          │
│  [Quick Log]  [Start Timer]            │  ← Action buttons
└─────────────────────────────────────────┘
```

**Styling**:
```
1. Add commitment type icon (32px, colored)
2. Increase title to h3 (20px bold)
3. Progress bar:
   - Height: 8px → 12px
   - Rounded corners: 6px
   - Gradient fill based on category
   - Animated width change
4. Numbers:
   - Bold style: <strong>8</strong> / 10 hours
   - Percentage: 40px bold
5. Buttons:
   - Pill shaped (full radius)
   - Primary color background
   - White text
   - Icon + text
```

### 3.4 Stats Card (Overall Progress)

**File**: `src/components/challenges/ChallengeDashboard.tsx`

**Split into Separate Cards**:
```
Instead of single card with 4 stats:

┌──────────────────┐ ┌──────────────────┐
│  Consistency     │ │  Diligence       │
│      87%         │ │      82%         │
│  ↑ +5% vs prev   │ │  ↑ +3% vs prev   │
└──────────────────┘ └──────────────────┘

┌──────────────────┐ ┌──────────────────┐
│  Current Streak  │ │  Days Completed  │
│    12 days       │ │      47/100      │
│  🔥 Keep going!  │ │  ⭐ 47% done     │
└──────────────────┘ └──────────────────┘
```

**Styling**:
```
1. 2x2 grid layout
2. Each card:
   - Gradient background (different per stat)
   - Large number (display variant, 40px)
   - Trend indicator (↑/↓ with color)
   - Motivational text (caption)
3. Card colors:
   - Consistency: gradient-mint
   - Diligence: gradient-cool
   - Streak: gradient-warm
   - Days: gradient-purple
```

---

## Section 4: Dashboard Layout Optimization

### 4.1 New Information Hierarchy

**Priority Order** (Trigger-Action-Reward model):
```
1. Hero Progress (0% Today) - Immediate status
2. Today's Commitments - What to do
3. Log Center (Quick/Manual) - How to take action
4. Recent Activities - What's been done
5. Daily Summary Chart - Visual feedback
6. Overall Progress - Long-term view
7. Heatmap Calendar - Historical view
8. Action Buttons (End Day, Coach) - Next steps
```

**Current Problem**: Coach Insight at top, buries actual progress

**Solution**: Move Coach Insight after Log Center

### 4.2 Hero Section Redesign

**File**: `src/components/challenges/ChallengeDashboard.tsx`

**Current**:
```jsx
<div>Welcome back, Zayed!</div>
<Card>Coach Insight...</Card>
<Card>100 days... 0% Today</Card>
```

**New Structure**:
```jsx
<div className="mb-8">
  {/* Tiny greeting */}
  <Typography variant="body-sm" color="muted">
    Welcome back, Zayed
  </Typography>
  
  {/* HERO: Current progress */}
  <Card variant="elevated" gradient="warm" className="mt-4">
    <Typography variant="hero" weight="bold" className="text-accent1">
      0%
    </Typography>
    <Typography variant="body" color="muted">
      Today, Day 1 of 100
    </Typography>
    <Typography variant="h2" className="mt-2">
      100 days consistency test
    </Typography>
  </Card>
</div>
```

**Styling Details**:
```
- Hero number (0%): 56px, gold color (#FFD93D)
- Card: Extra large (2xl border-radius)
- Gradient background: warm (yellow-orange)
- Subtle glow shadow
- Minimal padding around number for emphasis
```

### 4.3 Log Center (Quick/Manual Tabs)

**Current**: Separate buttons, disconnected feel

**New**: Unified tab interface

**Structure**:
```jsx
<div className="bg-dark-card rounded-xl p-4">
  {/* Tab Headers */}
  <div className="flex gap-2 mb-4">
    <button className={activeTab === 'quick' ? 'active' : ''}>
      ⚡ Quick Log
    </button>
    <button className={activeTab === 'manual' ? 'active' : ''}>
      📝 Manual Entry
    </button>
  </div>
  
  {/* Tab Content */}
  {activeTab === 'quick' && <QuickTapLogging />}
  {activeTab === 'manual' && <ActivityLogger />}
</div>
```

**Tab Styling**:
```
Inactive tab:
- Background: transparent
- Text: muted color
- Border: none

Active tab:
- Background: primary-500 (mint green)
- Text: white
- Border-radius: 8px
- Shadow: shadow-sm

Transition: all 0.2s ease
```

### 4.4 Commitments Section Placement

**Move to**: Between Hero and Log Center

**Reasoning**: User needs to see what to log BEFORE logging tools

**New Order**:
```
1. Hero Progress
2. Today's Commitments ← Move here
3. Log Center
4. Coach Insight ← Move down
5. Activities List
...
```

### 4.5 Collapsible Sections

**Add Expandable Headers** for:
- Overall Progress
- Heatmap Calendar
- Daily Summary Chart (keep expanded by default)

**Implementation**:
```jsx
<CollapsibleSection 
  title="Overall Progress" 
  icon="📊"
  defaultExpanded={false}
>
  <DualRingProgress ... />
  <QuickStats ... />
</CollapsibleSection>
```

**Benefit**: Reduce scroll length, focus on action items

---

## Section 5: Quick Tap Logging Enhancement

### 5.1 Grid Layout Optimization

**Current**: 4 columns, small icons, truncated text

**New**: 3 columns on mobile, 4 on tablet, icons 2x larger

**File**: `src/components/logging/QuickTapLogging.tsx`

**Responsive Grid**:
```
Mobile (<640px): 3 columns
Tablet (640-1024px): 4 columns
Desktop (>1024px): 5 columns

Gap: 12px
Card size: Square aspect ratio
```

### 5.2 Category Card Redesign

**Current**:
```
Small icon + truncated label ("Spir...")
```

**New Structure**:
```
┌─────────────────┐
│                 │
│      📚         │  ← Large icon (40px)
│                 │
│     Study       │  ← Full label (14px)
│                 │
└─────────────────┘
```

**Styling**:
```
1. Card:
   - Aspect ratio: 1:1 (square)
   - Border-radius: 16px
   - Gradient background matching category
   - Shadow: shadow-sm
   - Hover: shadow-md + scale(1.05)

2. Icon:
   - Size: 40px (up from 24px)
   - Center aligned
   - White color

3. Label:
   - Size: 14px
   - Weight: 600 (semibold)
   - White color
   - Full text (no truncation)
   - Center aligned

4. Active state (timer running):
   - Pulsing animation
   - Brighter glow shadow
   - Timer display inside card
```

### 5.3 Running Timer Display

**When timer active**:
```
┌─────────────────┐
│                 │
│      📚         │
│                 │
│     Study       │
│    01:23:45     │  ← Timer (bold, accent color)
│                 │
│   [STOP]        │  ← Stop button
└─────────────────┘
```

**Timer Styling**:
```
- Font: Monospace
- Size: 16px bold
- Color: accent1 (#FFD93D)
- Update every second
- Pulsing dot animation (•) next to timer
```

### 5.4 Category Gradients

**Map each category to gradient**:
```typescript
const categoryGradients = {
  'Work': 'linear-gradient(135deg, #4ECDC4 0%, #44A08D 100%)',
  'Study': 'linear-gradient(135deg, #A8E6CF 0%, #86D4B1 100%)',
  'Spiritual & Faith': 'linear-gradient(135deg, #8B7AB8 0%, #C4B5E8 100%)',
  'Eating & Food': 'linear-gradient(135deg, #FFD93D 0%, #FFA500 100%)',
  'Skill Development': 'linear-gradient(135deg, #FF6B6B 0%, #FF8E8E 100%)',
  'Social Media': 'linear-gradient(135deg, #C471ED 0%, #F64F59 100%)',
  'Family & Friends': 'linear-gradient(135deg, #FFB3D9 0%, #FFC8DD 100%)',
  'Health & Exercise': 'linear-gradient(135deg, #56CCF2 0%, #2F80ED 100%)',
}
```

---

## Section 6: Progress Visualization Polish

### 6.1 Dual Ring Progress Enhancement

**File**: `src/components/challenges/DualRingProgress.tsx`

**Current Issues**:
- Empty rings at 0% look dead
- Colors too vibrant (pure blue/green)
- No animation

**Improvements**:

**1. Ghost Rings** (show full circle even at 0%):
```
- Background ring: rgba(255,255,255,0.1)
- Progress ring: gradient overlay
- Gives visual preview of full progress
```

**2. Softer Colors**:
```
Inner ring (Consistency): 
  - Start: #60A5FA (soft blue)
  - End: #3B82F6
  
Outer ring (Diligence):
  - Start: #86EFAC (soft green)
  - End: #22C55E
```

**3. Animation on Load**:
```css
@keyframes ringFill {
  from {
    stroke-dashoffset: circumference;
  }
  to {
    stroke-dashoffset: calculated_offset;
  }
}

/* Apply with 1s duration, ease-out */
```

**4. Center Number Styling**:
```
- Size: 48px (up from 32px)
- Weight: 700 (bold)
- Color: accent1 (#FFD93D)
- Show average of both rings
```

**5. Legend Below Rings**:
```
┌─────────────────────────────────┐
│        [Ring SVG]               │
│                                  │
│  🔵 Consistency: 87%            │
│  🟢 Diligence: 82%              │
└─────────────────────────────────┘
```

### 6.2 Daily Summary Chart Polish

**File**: `src/components/dashboard/DailySummaryChart.tsx`

**Current Issues**:
- Black background harsh
- No legend
- No hover interactions

**Improvements**:

**1. Background**:
```
Replace: bg-black
With: bg-dark-card (subtle dark gray)
Add: backdrop-blur-sm (glass effect)
```

**2. Legend** (below chart):
```
Display as pills:
┌──────────────┬──────────────┬──────────────┐
│ 🔵 Work 3.2h │ 📚 Study 2h  │ 😴 Sleep 8h  │
└──────────────┴──────────────┴──────────────┘

Style:
- Inline pills with category color
- Show icon + name + hours
- Wrap to multiple rows if needed
```

**3. Hover Tooltips**:
```
On hover over pie slice or bar:
┌─────────────────────┐
│  Work               │
│  3h 12m (34.2%)     │
└─────────────────────┘
```

**4. Empty State**:
```
When no activities:
- Show dashed circle outline
- Text: "No activities logged yet"
- CTA: "Start logging" button
```

### 6.3 Heatmap Calendar Enhancement

**File**: `src/components/challenges/HeatmapCalendar.tsx`

**Current**: Basic grid, unclear what colors mean

**Improvements**:

**1. Add Legend**:
```
Below calendar:
┌─────────────────────────────────────┐
│ ▢ 0%   ▢ 1-25%  ▢ 26-50%           │
│ ▢ 51-75%   ▢ 76-99%   ▪ 100%       │
└─────────────────────────────────────┘
```

**2. Tooltip on Hover**:
```
Day 23/100
Saturday, Dec 20

Commitments:
✓ Study: 9/10 hours (90%)
✓ Running: Complete
✗ Workout: Not scheduled

Overall: 95%
Note: Felt great today!
```

**3. Click to Navigate**:
```
- Clicking a cell changes selectedDate
- Scrolls to that day's activities
- Highlights selected cell with border
```

**4. Month Labels**:
```
Add month markers at start of each month:
┌─────────────────────────────────────┐
│ December                            │
│ [grid of days]                      │
│                                      │
│ January                             │
│ [grid of days]                      │
└─────────────────────────────────────┘
```

---

## Section 7: Micro-interactions & Animations

### 7.1 Button Hover States

**All Buttons** should have:
```css
Default:
- Shadow: shadow-sm
- Transform: scale(1)

Hover:
- Shadow: shadow-md
- Transform: scale(1.02)
- Brightness: 110%

Active (pressed):
- Transform: scale(0.98)
- Shadow: shadow-xs

Transition: all 0.2s ease
```

**Primary Buttons** (Quick Log, Manual Entry, End Day):
```
- Background gradient
- White text
- Icon + text
- Hover: Gradient shift + glow shadow
```

**Secondary Buttons** (Edit, Delete):
```
- Transparent background
- Border: 1px solid
- Icon-only or icon + text
- Hover: Filled background with opacity
```

### 7.2 Card Animations

**On Mount** (when card appears):
```css
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Stagger: Each card delays by 50ms */
.card:nth-child(1) { animation-delay: 0ms; }
.card:nth-child(2) { animation-delay: 50ms; }
.card:nth-child(3) { animation-delay:

# Progressly UI Redesign - Master Plan (Concise)

## Purpose
Transform Progressly from 6.5/10 to 9/10 by fixing visual hierarchy, colors, spacing, and adding polish. Inspired by Quran app's design quality.

---

## Critical Issues
1. Visual hierarchy broken - everything same importance
2. Bright yellow (#FFEB3B) too harsh - needs warm yellow (#FFD93D)
3. Cards flat with no depth
4. Typography weak - sizes too similar
5. Spacing cramped
6. No emotional delight

---

## 7 Implementation Sections

### Section 1: Design System Foundation (2-3 hours)
Create unified design tokens for consistency.

**Colors**: Replace current with mint green primary (#A8E6CF), purple secondary (#8B7AB8), warm yellow accent (#FFD93D). Add proper dark mode neutrals. Define 5 gradient styles for cards.

**Typography**: Define 9 size levels from 12px caption to 56px hero. Set font weights: 300 light, 400 regular, 500 medium, 600 semibold, 700 bold. All numbers must be bold.

**Spacing**: Use 6-level scale: 4px, 8px, 16px, 24px, 32px, 48px for consistent gaps.

**Shadows**: Define 5 elevation levels from subtle (2px blur) to dramatic (32px blur). Add colored glows for premium cards.

**Border Radius**: Use 8px small, 12px medium, 16px large, 20px extra-large, 24px hero cards.

**Update**: tail