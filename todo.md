# Link-in-Bio Platform Todo List

## Current Issues to Fix 🚨

- [ ] Fix step detection logic - user saves on step 2 but edit resumes at step 3
- [ ] Fix image persistence issue - image disappears on subsequent saves

## Plan for Bug Fixes

### Issue 1: Wrong Step Detection
**Problem**: When user saves draft on step 2, editing resumes at step 3
**Root Cause**: `detectStartStep()` function determines step based on data presence, not where user actually saved
**Solution**: Add `currentStep` field to database to track where user saved from

### Issue 2: Image Disappears
**Problem**: Image disappears on subsequent saves while other data persists
**Root Cause**: `handleSaveDraft()` only uploads new image if `imageFile` exists, doesn't preserve existing `imageUrl`
**Solution**: Preserve existing `imageUrl` when no new image is selected

### Implementation Steps:
1. Update database schema to add `currentStep` field to Product model
2. Modify save draft functions to store current step
3. Update step detection to use stored step instead of data analysis
4. Fix image persistence by preserving existing imageUrl
5. Test both scenarios thoroughly

## Completed ✅

- [x] Set up database schema with Prisma (Users, Products, Links, Orders, Analytics)
- [x] Connect to Supabase PostgreSQL database
- [x] Implement Supabase authentication (email + Google OAuth)
- [x] Create user synchronization between Supabase Auth and database
- [x] Build basic dashboard with authentication protection
- [x] Fix build errors and configuration issues

## In Progress 🚧

- [x] Fix dashboard server action error (signOut function)
- [x] Test dashboard functionality end-to-end

## Phase 1: Core Dashboard Features

- [x] Create sidebar layout with navigation (Home, My Store, Income, Analytics, Customer)
- [x] Add basic profile editing (username, bio, avatar) in My Store section
- [x] Redesign My Store with split layout (editing left, mobile preview right)
- [x] Add profile picture upload functionality (UI ready, upload logic pending)
- [x] Add social links management with save functionality
- [x] Create mobile preview component with dynamic social links display
- [x] Fix profile form to show existing user data on load
- [x] Implement social links database operations
- [x] Redesign My Store with correct layout: profile overview (clickable to /dashboard/profile), add product section, and mobile preview on right
- [x] Move profile editing to /dashboard/profile (not /dashboard/store/profile)
- [x] Create add product page (/dashboard/store/add-product)
- [x] Create product management functionality
- [x] Redesign product section as simple "Add Product" button
- [x] Add product list with drag handles for reordering
- [x] Create product type chooser page with two-column layout and descriptions
- [x] Create lead magnet creator with 4-step flow (Image → Text → Fields → Delivery)
- [x] Add save draft functionality for lead magnet creator
- [x] Implement draft badge system in product list
- [x] Add database support for draft products and lead magnet fields
- [x] Create draft editing functionality - load saved data and resume from correct step
- [x] Add step detection logic to determine where user left off
- [x] Update Edit button in ProductList to link to draft editing
- [ ] Create simple link management (add/edit/delete links)
- [ ] Add link ordering/positioning functionality
- [ ] Implement actual file upload for profile pictures

## Phase 2: Product Management

- [ ] Add product creation form (title, description, price)
- [ ] Implement file upload for digital products
- [ ] Add product listing in dashboard
- [ ] Create product editing functionality

## Phase 3: Public Bio Pages

- [ ] Create public bio page route ([username])
- [ ] Display user links and products
- [ ] Add basic styling and themes
- [ ] Implement click tracking

## Phase 4: Payment Integration

- [ ] Set up Stripe integration
- [ ] Add product purchase flow
- [ ] Create order management

## Review Section

### Changes Made So Far:

1. **Database Setup**: Created comprehensive Prisma schema with all necessary models
2. **Authentication**: Integrated Supabase Auth with automatic user creation in database
3. **Dashboard**: Basic protected dashboard showing user info with sign out functionality
4. **Infrastructure**: Fixed build configuration and environment setup
5. **Server Actions Fix**: Fixed dashboard sign out by creating separate server actions file
6. **Sidebar Layout**: Created responsive sidebar with navigation (Home, My Store, Income, Analytics, Customer)
7. **Profile Editing**: Implemented profile editing form in My Store section with username, bio, and avatar fields
8. **My Store Redesign**: Complete split-layout redesign with profile editing on left and mobile preview on right
9. **Social Links UI**: Added social links management UI for Instagram, Twitter, TikTok, and YouTube
10. **Mobile Preview**: Real-time mobile preview component showing how the bio page will look
11. **Profile Form Fix**: Fixed forms to display existing user data (display name, username, bio) on page load
12. **Social Links Functionality**: Implemented full social links save/load functionality with database operations
13. **Dynamic Preview**: Mobile preview now shows only filled social links with proper icons and colors
14. **Store Overview Redesign**: Completely redesigned My Store as overview page showing profile summary, stats, and products
15. **Separate Edit Pages**: Created dedicated pages for profile editing (/dashboard/store/profile) and adding products (/dashboard/store/add-product)
16. **Product Management**: Added product creation functionality with form validation and database operations
17. **Correct Layout Implementation**: Fixed My Store layout with clickable profile overview, products section below, and mobile preview on right
18. **Profile Route Fix**: Moved profile editing to /dashboard/profile (not /dashboard/store/profile) as requested
19. **Product Section Redesign**: Changed to simple "Add Product" button, with separate product list showing drag handles for reordering
20. **Product Type Chooser**: Created beautiful two-column selection page with emojis, descriptions, and hover effects
21. **Product Management Flow**: Complete workflow from type selection to creation with pre-filled product type

### Current Architecture:

- Next.js 15 with App Router
- Supabase for authentication and database
- Prisma ORM for database operations
- Tailwind CSS for styling
- TypeScript for type safety