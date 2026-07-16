# Premium Redesign Brief — CheckInn

## Product Identity
Rebrand everything from "The Haven" to **CheckInn** (capital I, capital N). This is a generic SaaS product for any hotel — not hotel-specific branding.

Tagline: "Digital check-in, reimagined."

---

## Design Philosophy
This must look like a $50/month SaaS product, not a CRUD admin template. Think Linear, Vercel Dashboard, Resend — dark sidebar, surgical spacing, deliberate hierarchy, tasteful motion.

AVOID: Bootstrap columns, flat status tables, generic cards with grey icons, default shadcn styling.

---

## Tech Constraints
- React + Vite + Tailwind CSS v4 (no tailwind.config — CSS custom properties only in index.css)
- Components in src/components/ui/ — can override classes but NOT component APIs
- All existing API hooks stay exactly as-is — same names, same signatures
- No new packages (everything available: lucide-react, tw-animate-css, @tanstack/react-query, wouter)
- TypeScript strict — use optional chaining everywhere on API data

---

## 1. index.css — Full Replacement

Load fonts via Google Fonts:
```
https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Outfit:wght@400;500;600;700;800&display=swap
```
- Outfit = display headings, logo
- Inter = all UI body text

Color palette (light mode):
```
--background: 220 14% 96%         /* cool grey page bg */
--foreground: 224 71% 4%          /* near-black */
--border: 220 13% 91%
--input: 220 13% 91%
--ring: 239 84% 67%               /* indigo focus ring */

--card: 0 0% 100%
--card-foreground: 224 71% 4%
--card-border: 220 13% 91%

--popover: 0 0% 100%
--popover-foreground: 224 71% 4%
--popover-border: 220 13% 91%

--primary: 239 84% 67%            /* indigo-500 #6366F1 */
--primary-foreground: 0 0% 100%
--primary-border: hsl(239 84% 67% / 0.3)

--secondary: 262 83% 58%          /* violet-500 */
--secondary-foreground: 0 0% 100%
--secondary-border: hsl(262 83% 58% / 0.3)

--muted: 220 14% 94%
--muted-foreground: 215 16% 47%
--muted-border: hsl(220 13% 88%)

--accent: 240 5% 96%
--accent-foreground: 224 71% 4%
--accent-border: hsl(220 13% 91%)

--destructive: 0 84% 60%
--destructive-foreground: 0 0% 100%
--destructive-border: hsl(0 84% 60% / 0.3)

--sidebar: 224 71% 4%             /* obsidian #0D0F14 */
--sidebar-foreground: 220 14% 92%
--sidebar-border: 220 13% 12%
--sidebar-primary: 239 84% 67%
--sidebar-primary-foreground: 0 0% 100%
--sidebar-accent: 220 13% 10%
--sidebar-accent-foreground: 220 14% 92%
--sidebar-ring: 239 84% 67%
--sidebar-muted-foreground: 215 16% 55%

--radius: 0.75rem
--app-font-sans: 'Inter', sans-serif
--app-font-serif: 'Outfit', sans-serif
--app-font-mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace
```

Also add these utility CSS classes in @layer utilities:
```css
.stat-glow-indigo { background: linear-gradient(135deg, hsl(239 84% 67% / 0.1), hsl(239 84% 67% / 0.03)); }
.stat-glow-violet { background: linear-gradient(135deg, hsl(262 83% 58% / 0.1), hsl(262 83% 58% / 0.03)); }
.stat-glow-emerald { background: linear-gradient(135deg, hsl(142 71% 45% / 0.1), hsl(142 71% 45% / 0.03)); }
.stat-glow-amber { background: linear-gradient(135deg, hsl(38 92% 50% / 0.1), hsl(38 92% 50% / 0.03)); }
```

---

## 2. AdminLayout.tsx — Full Rewrite

**Desktop**: Fixed 260px dark sidebar (bg: var(--sidebar)), scrollable main area.

**Sidebar contents top-to-bottom**:
1. Logo block (p-6): "CI" monogram in a rounded-lg indigo square (bg indigo-500) + "CheckInn" in Outfit font, white, bold, text-xl. + small "Beta" badge in muted grey
2. Nav section (flex-col, gap-1):
   - Dashboard → "/" (LayoutDashboard icon)
   - Bookings → "/bookings" (BookOpen icon)  
   - Guests → "/guests/search" (Users icon)
   - Active: bg indigo-600/20, left border-l-2 border-indigo-500, text white, icon indigo-400
   - Inactive: text sidebar-muted-foreground, hover bg sidebar-accent
3. Divider then "New Booking" quick action link at bottom of nav (small, muted)
4. Footer (bottom of sidebar, p-4): "CheckInn · v1.0" in tiny muted text

**Mobile** (md:hidden): A top bar (h-14, white, shadow-sm) with hamburger button on left + "CheckInn" logo center + nothing on right. Clicking hamburger opens a Sheet (from @/components/ui/sheet) that contains the same sidebar content. Import Sheet, SheetContent from "@/components/ui/sheet". Use useState for open/closed. Import Menu from lucide-react.

**Main content area**: flex-1, overflow-y-auto, p-6 md:p-8, bg-background. max-w-7xl mx-auto for inner content.

Do NOT import or use the existing sidebar.tsx component — write everything inline in AdminLayout.tsx.

---

## 3. dashboard.tsx — Full Rewrite

Imports needed: AdminLayout, Card/CardContent, useGetBookingStats, useListRecentBookings, Link (wouter), Button, Skeleton (from @/components/ui/skeleton), lucide icons (Users, Clock, CheckCircle2, Globe, TrendingUp, Plus, ArrowRight, Calendar).

**Header**:
- Left: greeting based on hour: "Good morning" (before 12), "Good afternoon" (12-17), "Good evening" (17+). Get hour from `new Date().getHours()`. Display as "Good morning, Staff" in Outfit font (font-serif in the CSS system maps to Outfit now), text-2xl font-semibold. Below: today's date formatted as "Wednesday, July 16" using `new Date().toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric' })`.
- Right: Link to /bookings/new — `<Button>` with Plus icon + "New Booking"

**Loading state**: Show Skeleton components matching the layout (4 stat card skeletons, then a list of 5 row skeletons).

**Stats grid** (4 equal columns on md+, 2 on sm, 1 on mobile):

Each stat card is a div (not Card component) with:
- Rounded-xl, bg-card, border border-card-border, p-6, shadow-sm, hover:shadow-md transition-shadow
- Bottom colored border (border-b-2 in the accent color): `border-indigo-400` for arrivals, `border-amber-400` for pending, `border-emerald-400` for completed, `border-violet-400` for foreign
- Applied stat-glow-* class for gradient tint
- Top row: stat label (text-sm text-muted-foreground font-medium) + icon in a colored rounded-lg (p-2, bg with opacity, colored icon w-5 h-5)
- Middle: big number (text-4xl font-bold font-serif — Outfit now) with text color matching accent
- Bottom: small text like "+ 2 since yesterday" with TrendingUp icon — just hardcode cosmetically

Stat cards:
- "Today's Arrivals" → stats?.todayCheckins ?? 0, indigo color, Users icon
- "Pending Check-ins" → stats?.pendingBookings ?? 0, amber color, Clock icon
- "Completed" → stats?.completedBookings ?? 0, emerald color, CheckCircle2 icon
- "Foreign Nationals" → stats?.foreignNationals ?? 0, violet color, Globe icon

**Recent Bookings** section:
- Section header: "Recent Bookings" (text-lg font-semibold) on left, Link to /bookings with "View all →" text on right (text-primary text-sm)
- NOT a table — use a vertical list of rows
- Each row: `flex items-center gap-4 p-4 rounded-xl hover:bg-muted/50 cursor-pointer transition-colors group`
  - Left: initials avatar (see avatar helper below)
  - Middle-left: guest name (font-medium) + booking ref below (text-xs text-muted-foreground font-mono)
  - Middle-right: check-in date (text-sm text-muted-foreground) + room badge (text-xs bg-muted px-2 py-0.5 rounded-full)
  - Right: status pill
  - Entire row wrapped in Link to /bookings/:booking.id
- Empty state if no bookings: centered text "No recent bookings" with Calendar icon

**Local helpers** in dashboard.tsx:
```tsx
function getInitials(name: string) {
  return name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase();
}
function getAvatarBg(name: string) {
  const colors = [
    'bg-indigo-500', 'bg-violet-500', 'bg-emerald-500', 
    'bg-amber-500', 'bg-rose-500', 'bg-teal-500', 'bg-sky-500', 'bg-orange-500'
  ];
  const idx = name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % colors.length;
  return colors[idx];
}
function StatusPill({ status }: { status: string }) {
  if (status === 'completed') return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />Completed
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 ring-1 ring-amber-200">
      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />Pending
    </span>
  );
}
```

Copy these exact helpers into every page file that needs them.

---

## 4. bookings/list.tsx — Full Rewrite

Imports: AdminLayout, Input, Button, useListBookings, Link (wouter), useState, Search, Plus, BookOpen, lucide icons, Skeleton.

**Header**: "Bookings" (Outfit font-serif text-2xl font-semibold) + subtitle "Manage all guest reservations" + "New Booking" button.

**Filter bar** (card-like, bg-card, rounded-xl, border, p-4, mb-6):
- Row 1: Search input (rounded-full, h-11, shadow-sm, pl-10 for search icon, full width)
- Row 2 (mt-3): Status pill tabs — three buttons: "All", "Pending", "Completed". Active tab: bg-primary text-white rounded-full px-4 py-1.5. Inactive: text-muted-foreground hover:text-foreground. Inline `useState` for activeStatus.
- Wire: `status: activeStatus === 'all' ? undefined : activeStatus`

**Table** (inside a bg-card rounded-xl border overflow-hidden):
- Header row: bg-muted/50, text-xs uppercase tracking-wider text-muted-foreground
- Columns: Guest (with avatar + name + phone stacked) | Room | Check-in | Check-out | Status | Action
- Each data row:
  - Initials avatar (w-8 h-8, text-xs)
  - Name font-medium + phone text-xs text-muted-foreground below
  - Room: small badge `bg-muted rounded-md px-2 py-0.5 text-xs font-mono`
  - Dates: text-sm
  - Status: StatusPill
  - Action: "View →" text-primary text-sm hover:underline (Link)
- Row hover: bg-muted/30, smooth transition
- Loading: 6 skeleton rows
- Empty: centered empty state with BookOpen icon

---

## 5. bookings/new.tsx — Full Rewrite

Imports: AdminLayout, Card/CardContent, Input, Button, Label, Textarea, useCreateBooking, getListBookingsQueryKey, getListRecentBookingsQueryKey, useLocation, useState, ArrowLeft, Loader2, Link (wouter), useQueryClient, useToast from @/hooks/use-toast, CalendarDays, User, Phone, Home, BedDouble, Users icon from lucide.

**Two-column layout** on lg+ (form left 60%, preview right 40%):

Left — form card (bg-card, rounded-xl, border, p-6):
- "New Booking" heading (Outfit font-serif) + subtitle
- Form fields with left icons (wrapped in a relative div with absolute icon):
  - `relative` div, icon absolutely positioned `left-3 top-3 text-muted-foreground w-4 h-4`, input with `pl-10`
  - Fields: Primary Guest Name (User icon), Phone (Phone icon), Room Number (BedDouble icon), Number of Guests (Users icon, type=number min=1), Check-in Date (CalendarDays), Check-out Date (CalendarDays), Notes (Textarea, no icon, full-width)
- Two-column grid for: name+phone, room+guests, checkin+checkout
- Notes textarea full-width below grid
- Submit row: "Cancel" outline button + "Create Booking" filled indigo button with spinner when pending

Right — "Preview" card (sticky top-8, bg-gradient-to-br from-indigo-50 to-violet-50, rounded-xl, border border-indigo-100, p-6):
- "Booking Preview" header with small hotel icon
- Shows filled-in values or dashes for empty fields:
  - Guest: formData.guestName || "—"
  - Room: formData.roomNumber || "—"
  - Guests: formData.numberOfGuests
  - Check-in: formData.checkInDate (formatted) || "—"
  - Check-out: formData.checkOutDate (formatted) || "—"
- Below: small muted text "A check-in link will be generated when this booking is saved."
- Preview card only shows on lg+ (hidden on mobile)

---

## 6. bookings/detail.tsx — Full Rewrite

Imports: AdminLayout, Card/CardContent/CardHeader/CardTitle, Badge, Button, useGetBooking, useGetCheckinLink, useDeleteBooking, getListBookingsQueryKey, getGetBookingStatsQueryKey, useLocation, useParams, Link (wouter), ArrowLeft, Copy, MessageCircle, MessageSquare, Download, Trash2, Calendar, Users, DoorOpen, Phone, Globe, ChevronDown, ExternalLink, useToast from @/hooks/use-toast, useQueryClient, Input, Skeleton.

**Loading state**: Skeleton layout matching real content shape.

**Hero section** (mb-8):
- Back link: "← Bookings" (ArrowLeft, text-muted-foreground)
- Below: eyebrow "Booking Ref" label (text-xs uppercase tracking-wider text-muted-foreground) + booking.bookingRef in mono
- Large heading: booking.guestName (Outfit font-serif text-3xl)
- Row: StatusPill + stay summary "Jul 18 → Jul 20" + "X/Y guests" pill
- Right side (ml-auto): button group — "Export CSV" (Download icon, outline), trash icon button (destructive outline), with Trash2

**Two-column grid** (lg:grid-cols-3):

Left col (col-span-1), stacked cards:

Card 1 — "Reservation Details":
- Room number displayed large (text-2xl font-bold) + "Room" label above
- Thin divider
- Stay dates: Check-in row + Check-out row, each with Calendar icon, date formatted as "Mon, Jul 18, 2026"
- Guest progress: "X of Y guests checked in" with a thin progress bar (bg-indigo-500 fill, rounded-full)
- Phone (if present) with Phone icon
- Notes (if present) in italic

Card 2 — "Share Check-in Link" (if checkinLink exists):
- Background: bg-gradient-to-br from-indigo-50 to-violet-50, border-indigo-100
- "Share with Guest" heading in indigo
- URL display: truncated in a code-style div (bg-white border rounded-lg p-3 font-mono text-xs text-muted-foreground overflow-hidden text-ellipsis whitespace-nowrap)
- Three action buttons stacked vertically (full width):
  - "Copy Link" (outline, Copy icon, onClick copies checkinLink.url)
  - "Send via WhatsApp" (bg-[#25D366] text-white, MessageCircle icon, opens checkinLink.whatsappUrl)
  - "Send via SMS" (bg-blue-500 text-white, MessageSquare icon, opens checkinLink.smsUrl)

Right col (col-span-2):

Card — "Guest Records":
- Header: "Guest Records" + guests submitted count badge on right
- Empty state (if no guests): centered, Users icon (w-16 h-16, text-muted-foreground/20), "No guests yet", subtitle "Share the check-in link to get started"
- Each guest (divide-y):
  - Header row: initials avatar (w-10 h-10) + name (font-semibold) + nationality + FRRO badge (violet bg-violet-100 text-violet-700) if isForeignNational
  - Personal data grid (2 cols, bg-muted/30 rounded-lg p-4 mt-3):
    - Phone, Email, ID Type, ID Number
  - FRRO section (if isForeignNational): bg-violet-50 border border-violet-100 rounded-lg p-4 mt-2 grid 4 cols:
    - Passport No., Passport Expiry, Visa No., Visa Type, Visa Expiry, Port of Entry
  - Document links at bottom (if idImageUrl or signatureUrl): pill link buttons with Download icon

---

## 7. checkin.tsx — Full Rewrite (Most Important)

This is the public mobile-first guest form. World-class phone UX.

**No AdminLayout** — standalone page.

**Page wrapper**: min-h-screen, bg `hsl(45 30% 97%)` (warm cream) — set via inline style or add a class.

**Top bar** (sticky top-0 z-10, bg-white/90 backdrop-blur-md, border-b, px-4 py-3):
- Centered "CheckInn" in Outfit font, text-xl font-bold text-foreground
- Left: nothing (or "← Back" on steps >1, but optional)

**Progress dots** (below header, max-w-sm mx-auto, mt-6 mb-4):
- 4 dots (or 5 if FRRO step): each is a rounded-full pill
- Completed: indigo bg (bg-indigo-500 w-6 h-2.5 rounded-full)
- Active: indigo bg w-8 h-2.5 rounded-full (wider = active)
- Inactive: bg-muted w-6 h-2.5 rounded-full
- All animated with transition-all duration-300

**Main card** (max-w-sm mx-auto, bg-white rounded-2xl shadow-xl overflow-hidden):
- Step counter eyebrow inside card header: "Step X of 4" text-xs font-medium text-primary uppercase tracking-wider
- Heading: text-xl font-semibold (not serif in guest form — use Inter)
- Subtitle: text-sm text-muted-foreground

**Inputs in guest form**: standard height (h-11), rounded-lg, focus:ring-2 focus:ring-primary/30. Labels above (text-sm font-medium text-foreground mb-1).

**Step 1 — Personal Info** (p-6 space-y-4):
- fullName, phone, email, address (all with icons on left: User, Phone, Mail, MapPin)
- nationality: `<select>` (styled select, h-11, rounded-lg, border, px-3) with options:
  India | United Kingdom | United States | Australia | Canada | Germany | France | UAE | Singapore | Japan | China | Other
  (value matches the displayed name, default = "India")
- "Continue →" button (w-full, bg-primary, h-12, rounded-xl, text-white font-semibold, mt-6)

**Step 2 — Identity** (p-6):
- ID Type as visual card picker: a 2x3 grid (or 3x2) of small pill buttons
  Options: Aadhaar | Passport | Driving Licence | Voter ID | Other
  Each is a button: border rounded-xl p-3 text-sm text-center, active = bg-primary text-white border-primary, inactive = border-border
  `onClick` sets formData.idType
- ID Number input below
- Upload zone: large dashed area h-36, rounded-xl, border-2 border-dashed border-input, centered content:
  - Camera icon (w-8 h-8 text-muted-foreground) + "Tap to photograph your ID" text-sm text-muted-foreground
  - When uploaded (idDataUrl set): show thumbnail image + green check badge overlay
  - input type="file" hidden, accept="image/*" capture="environment"
- Back + Continue buttons (flex gap-3, Back = outline flex-1, Continue = primary flex-1)

**Step 3 — FRRO** (only if isForeign, p-6):
- Purple-tinted header area: bg-violet-50 -mx-6 -mt-6 px-6 pt-6 pb-4 mb-4 (hack negative margin to bleed to card edge)
- "FRRO / C-Form Details" heading + "Required for all foreign nationals" subtitle
- Fields (2-col grid where possible): Passport Number, Passport Expiry (date), Visa Number, Visa Type (text), Visa Expiry (date), Arrival Date (date)
- Port of Entry: full-width with plane icon (Plane from lucide)
- Back + Continue buttons

**Step 4 — Signature** (p-6):
- Heading "Your Signature"
- Subtitle "Sign in the box below to confirm your details."
- Canvas wrapper: bg-white rounded-xl border-2 border-dashed border-border overflow-hidden shadow-inner relative
  - Canvas itself: w-full h-[180px] cursor-crosshair touch-none
  - Watermark text beneath canvas (outside wrapper): text-xs text-muted-foreground text-center mt-1 "Sign above"
- Clear button: top-right corner of wrapper, absolute positioned, "Clear" text-xs text-muted-foreground hover:text-foreground
- "Complete Check-in" button: w-full, h-12, bg-primary, rounded-xl, font-semibold, mt-6, with Loader2 spinner when pending

**Step 5 — Success** (p-8 text-center):
- Animated circle: div w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto, with CheckCircle2 (w-10 h-10 text-emerald-600), add `animate-bounce` briefly (or just animate-in zoom-in)
- "You're all checked in!" heading (text-2xl font-bold)  
- "Welcome, [firstName]!" subtitle
- Booking summary card (bg-muted rounded-xl p-4 text-left text-sm mt-6):
  - Ref: session.bookingRef
  - Room: session.roomNumber
  - Arrival: session.checkInDate formatted
- Warm closing text: "We look forward to welcoming you." text-muted-foreground text-sm mt-4

**Error/invalid page** (if sessionError or !session):
- Full page centered (min-h-screen flex items-center justify-center bg warm cream)
- Card max-w-sm w-full mx-4: AlertTriangle icon (w-12 h-12 text-amber-500 mx-auto mb-4), "Invalid Link" heading, "This check-in link has expired or is invalid. Please contact the hotel." subtitle
- "CheckInn" branding small at bottom

**Loading state** (if sessionLoading):
- Centered Loader2 animate-spin text-primary

**Prefill**: `useEffect(() => { if (session?.guestName && !formData.fullName) setFormData(p => ({...p, fullName: session.guestName})); }, [session?.guestName])` — move out of render body.

**Add this CSS in index.css** for the signature canvas touch behavior:
```css
canvas { touch-action: none; }
```

---

## 8. guests/search.tsx — Full Rewrite

Imports: AdminLayout, Input, useSearchGuests, useState, useEffect, Search, Loader2, User, Globe, Link (wouter), Badge, Skeleton.

**Hero section** (py-10, text-center):
- "Find a Guest" heading (Outfit text-3xl font-bold)
- Subtitle "Search by name, phone, email, or passport number"
- Large search input (max-w-xl mx-auto, mt-6, h-14 rounded-full shadow-md, pl-14, text-lg, border-2 focus:border-primary)
- Search icon on left (w-6 h-6, left-4)
- Loading spinner replaces search icon when isLoading

**Results area** (max-w-5xl mx-auto):
- When debouncedQuery.length <= 2: Empty state (centered, large Search icon faded, "Start typing to find guests" text)
- When loading: Show 6 skeleton cards (matching card shape below)
- When results: **Card grid** — grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4
  Each guest card:
  - Rounded-xl bg-card border shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer
  - p-5
  - Top row: initials avatar (w-12 h-12 rounded-full, colored, text-lg font-bold text-white) + name (text-lg font-semibold) + FRRO badge (violet) if isForeignNational
  - Nationality row: Globe icon w-3.5 h-3.5 + nationality text-sm text-muted-foreground
  - Contact row: phone + email (text-sm text-muted-foreground, truncated)
  - Divider
  - Bottom row: ID type badge (font-mono text-xs bg-muted px-2 py-0.5 rounded) on left + "View Booking →" link to /bookings/:guest.bookingId (text-primary text-sm font-medium) on right
  - Card wrapped in Link href="/bookings/{guest.bookingId}" OR just use a div with onClick (prefer Link wrapping the whole card)
- Stagger animation: each card gets style={{ animationDelay: `${index * 50}ms` }} className="animate-in fade-in-0 slide-in-from-bottom-4"
- No results: centered "No guests match '{query}'" + "Try a different search term" text

---

## Helper Patterns (copy to every file that needs them)

```tsx
function getInitials(name: string): string {
  return name.split(' ').map((p: string) => p[0] ?? '').join('').slice(0, 2).toUpperCase();
}

function getAvatarBg(name: string): string {
  const colors = [
    'bg-indigo-500', 'bg-violet-500', 'bg-emerald-500', 
    'bg-amber-500', 'bg-rose-500', 'bg-teal-500', 'bg-sky-500', 'bg-orange-500'
  ];
  const idx = name.split('').reduce((acc: number, c: string) => acc + c.charCodeAt(0), 0) % colors.length;
  return colors[idx];
}

function StatusPill({ status }: { status: string }) {
  if (status === 'completed') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        Completed
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 ring-1 ring-amber-200">
      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
      Pending
    </span>
  );
}
```

---

## Files to Write

Write ALL 8 files completely (no shortcuts, no "// rest unchanged"):
1. `artifacts/guest-checkin/src/index.css`
2. `artifacts/guest-checkin/src/components/layout/AdminLayout.tsx`
3. `artifacts/guest-checkin/src/pages/dashboard.tsx`
4. `artifacts/guest-checkin/src/pages/bookings/list.tsx`
5. `artifacts/guest-checkin/src/pages/bookings/new.tsx`
6. `artifacts/guest-checkin/src/pages/bookings/detail.tsx`
7. `artifacts/guest-checkin/src/pages/checkin.tsx`
8. `artifacts/guest-checkin/src/pages/guests/search.tsx`

After writing all 8 files, say "REDESIGN COMPLETE".
