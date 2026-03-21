# Indic World — Technical Report

**For: New developer onboarding**
**Last updated: March 19, 2026**

---

## 1. What is Indic?

Indic is a storytelling platform where users create, publish, and discover stories across three categories:

- **Indic Word** — Written narratives, op-eds, reportage
- **Indic Lens** — Photo essays, visual journalism
- **Indic Motion** — Documentaries, short films, video essays

Users write stories using a block-based editor (Magnum Photos-style layout), submit them for review, and admins approve/reject before publishing.

---

## 2. Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19.1.1 |
| Routing | React Router 7.9.3 |
| Build Tool | Vite 7.1.7 |
| Auth | Firebase Authentication (Email + Google OAuth) |
| Database | Cloud Firestore |
| File Storage | Firebase Cloud Storage |
| Analytics | Firebase Analytics |
| Deployment | Vercel |
| Styling | Component-scoped CSS (no Tailwind, no CSS-in-JS) |
| State | React Context API (no Redux) |
| Typography | Google Fonts — Crimson Text (serif) |

---

## 3. Project Structure

```
indic-world/
├── index.html                  # Entry point, SEO meta, Google Fonts
├── package.json                # Dependencies & scripts
├── vite.config.js              # Build config, code splitting
├── vercel.json                 # Vercel SPA rewrite + security headers
├── .env                        # Firebase keys (NOT committed)
├── .env.example                # Template for env vars
├── CLAUDE.md                   # AI assistant instructions
│
├── public/
│   ├── Indic.png               # Logo
│   ├── Indic 2.png             # Alt logo
│   └── favicon_new.png         # Favicon
│
└── src/
    ├── main.jsx                # React DOM entry
    ├── App.jsx                 # Router + all routes
    ├── App.css                 # Global app styles
    ├── index.css               # Base/reset styles
    │
    ├── firebase/
    │   ├── config.js           # Firebase init (reads from .env)
    │   └── services.js         # All Firebase CRUD operations
    │
    ├── contexts/
    │   └── AuthContext.jsx      # Auth state (currentUser, isAdmin)
    │
    ├── components/
    │   ├── StoryEditor.jsx     # Block-based story editor (12-col grid)
    │   ├── StoryEditor.css
    │   ├── VisualStoryEditor.jsx  # Legacy editor (unused, kept for reference)
    │   ├── VisualStoryEditor.css
    │   ├── RichTextEditor.jsx  # Markdown text editor with toolbar
    │   ├── RichTextEditor.css
    │   └── common/
    │       ├── Navbar.jsx      # Top navigation + user menu
    │       ├── Footer.jsx      # Footer
    │       ├── ProtectedRoute.jsx  # Auth guard for routes
    │       ├── NotificationSystem.jsx  # Toast + confirmation dialogs
    │       └── Loading.jsx     # Loading spinner
    │
    ├── pages/
    │   ├── Home.jsx            # Landing page (hero, top picks, categories)
    │   ├── About.jsx           # About Indic
    │   ├── Contact.jsx         # Contact form
    │   ├── Auth.jsx            # Login / Signup
    │   ├── Profile.jsx         # User's story dashboard
    │   ├── Settings.jsx        # Account settings
    │   ├── Admin.jsx           # Review, approve, reject articles
    │   ├── CreateStory.jsx     # Create story (editor for Word/Lens, upload for Motion)
    │   ├── EditArticle.jsx     # Edit existing story
    │   ├── Article.jsx         # Read published article
    │   ├── PhotoEssay.jsx      # View historical/authentic stories
    │   ├── CategoryPage.jsx    # Category listing (/word, /lens, /motion)
    │   ├── Privacy.jsx         # Privacy policy
    │   └── Terms.jsx           # Terms of service
    │
    ├── data/
    │   ├── historicalStories.js   # Pre-loaded public domain stories
    │   └── authenticStories.js    # Pre-loaded CC-licensed photo essays
    │
    └── utils/
        ├── formatters.js       # Date formatting, markdown-to-HTML
        └── fixUserData.js      # Auto-create missing user documents
```

---

## 4. Environment Variables

Create a `.env` file in the root with these values (get from Firebase Console):

```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_MEASUREMENT_ID=
VITE_ADMIN_EMAIL=workvishalthakur@gmail.com
```

`VITE_ADMIN_EMAIL` determines who has admin access. If the logged-in user's email matches this, they get admin privileges.

---

## 5. Scripts

```bash
npm run dev       # Start dev server (localhost:3000)
npm run build     # Production build -> dist/
npm run preview   # Preview production build locally
npm run lint      # Run ESLint
```

---

## 6. Routing

### Public Routes
| Path | Page | Description |
|---|---|---|
| `/` | Home | Landing page with featured stories |
| `/about` | About | About Indic |
| `/contact` | Contact | Contact form |
| `/auth` | Auth | Login / Signup |
| `/article/:id` | Article | View a published article |
| `/photo-essay/:storyId` | PhotoEssay | View historical stories |
| `/word` | CategoryPage | Indic Word listing |
| `/lens` | CategoryPage | Indic Lens listing |
| `/motion` | CategoryPage | Indic Motion listing |

### Protected Routes (login required)
| Path | Page | Description |
|---|---|---|
| `/profile` | Profile | User's story dashboard |
| `/settings` | Settings | Account settings |
| `/create-story` | CreateStory | Create new story |
| `/edit-article/:id` | EditArticle | Edit existing story |

### Admin Only
| Path | Page | Description |
|---|---|---|
| `/admin` | Admin | Review, approve, reject articles |

All pages are **lazy-loaded** with `React.lazy()` for code splitting.

---

## 7. Firestore Database Schema

### `users` collection
```
{
  uid: string,              // Firebase Auth UID
  email: string,
  displayName: string,
  photoURL: string,
  role: "author" | "admin",
  createdAt: Timestamp,
  articlesCount: number
}
```

### `articles` collection
```
{
  title: string,
  excerpt: string,
  content: string,            // Markdown (Word) or JSON string (Lens visual stories)
  category: "word" | "lens" | "motion",
  featuredImage: string,      // Firebase Storage URL
  tags: string[],
  authorId: string,           // UID of author
  authorName: string,
  status: "draft" | "pending" | "published" | "needs-revision" | "rejected" | "archived" | "deleted",
  views: number,
  createdAt: Timestamp,
  updatedAt: Timestamp,
  publishedAt: Timestamp,     // Set when approved
  isVisualStory: boolean,     // true for Lens stories (content is JSON)
  isMotion: boolean,          // true for video uploads
  revisionNote: string,       // Admin feedback when requesting changes
  rejectionReason: string
}
```

---

## 8. Article Lifecycle

```
DRAFT  ->  PENDING  ->  PUBLISHED
                    ->  NEEDS-REVISION  ->  PENDING  ->  PUBLISHED
                    ->  REJECTED

Any status  ->  ARCHIVED  ->  (restored to previous status)
Any status  ->  DELETED   ->  (soft delete, can be restored)
```

1. Author creates story -> status = `draft`
2. Author submits for review -> status = `pending`
3. Admin reviews:
   - **Approve** -> `published` (sets publishedAt)
   - **Request Changes** -> `needs-revision` (adds revisionNote)
   - **Reject** -> `rejected` (adds rejectionReason)
4. If needs-revision, author edits and resubmits -> `pending`

---

## 9. Authentication Flow

1. Firebase Auth handles email/password and Google OAuth
2. On auth state change, `AuthContext` fetches user doc from Firestore
3. If no user doc exists, `ensureUserDocument()` creates one
4. Admin check: `user.email === VITE_ADMIN_EMAIL` or `user.role === "admin"`
5. `ProtectedRoute` checks `currentUser` before rendering protected pages
6. `adminOnly` flag on routes blocks non-admins

---

## 10. The Story Editor

### Architecture
The editor (`StoryEditor.jsx`) uses a **block-based** system with a **12-column CSS grid** (max-width: 1100px, gap: 24px).

### Block Types
| Type | Grid Layout | Description |
|---|---|---|
| `title` | 680px centered | Story title |
| `subtitle` | 680px centered | Subtitle/tagline |
| `text` | 680px centered | Body paragraph |
| `image-full` | 12 columns | Full-width hero image |
| `image-pair` | 6 + 6 columns | Two images side by side |
| `image-big-small` | 8 + 4 columns | Large image + small image |
| `image-centered` | 8 columns centered | Single centered image |
| `quote` | 680px centered | Blockquote with author |
| `divider` | 680px centered | Horizontal rule |

### How it works
- Editor opens with a **default template** pre-filled (users edit existing blocks, not a blank page)
- Users add blocks via a `+` button between blocks -> dropdown menu
- Image blocks support **caption** and **credit** fields per image
- Pair and big-small blocks have **two image slots** (left + right)
- Images are **auto-resized** on upload (keeping aspect ratio, max width depends on layout context)
- Blocks can be **reordered** with up/down arrows or **deleted**
- Data saves as JSON (stringified) in Firestore's `content` field
- Layout is inspired by **Magnum Photos** (symmetrical, editorial grid)

### Category-specific behavior
- **Indic Word** and **Indic Lens** -> use the block-based StoryEditor
- **Indic Motion** -> simple upload form (title, description, video file, thumbnail)

---

## 11. Firebase Services (src/firebase/services.js)

### authService
- `signUp(email, password, displayName)` — Register + create Firestore user doc
- `signIn(email, password)` — Email login
- `signInWithGoogle()` — Google OAuth, creates doc if new
- `signOut()` — Logout
- `resetPassword(email)` — Password reset email

### userService
- `getUserData(uid)` — Fetch user by UID
- `updateUserProfile(userId, data)` — Update profile
- `isAdmin(uid)` — Check admin status
- `updateUserRole(userId, newRole)` — Change role

### articleService
- `createArticle(data)` — Create new article
- `updateArticle(id, data)` — Update article
- `deleteArticle(id)` — Soft delete
- `permanentlyDeleteArticle(id)` — Hard delete
- `getArticle(id)` — Get single article
- `getArticlesByAuthor(authorId)` — Get author's articles
- `getPublishedArticles(limit)` — Get published (default limit 20)
- `getPendingArticles()` — Get pending review
- `submitForReview(id)` — Change to pending
- `approveArticle(id)` — Publish
- `requestChanges(id, feedback)` — Send back for revision
- `rejectArticle(id, reason)` — Reject
- `incrementViews(id)` — Increment view counter

### storageService
- `uploadImage(file, path)` — Upload to Firebase Storage, returns URL
- `deleteImage(imageUrl)` — Delete from Storage
- `uploadArticleImage(file, authorId)` — Upload to `articles/{authorId}/`
- `uploadAvatar(file, userId)` — Upload to `avatars/{userId}/`

---

## 12. File Storage Paths

```
articles/{timestamp}_{filename}     # Article images
videos/{timestamp}_{filename}       # Video uploads
avatars/{userId}/{filename}         # Profile photos
profile-photos/{userId}/{filename}  # Settings photo uploads
```

---

## 13. Code Splitting (Vite Config)

Production build creates separate chunks:
- `firebase-[hash].js` — Firebase SDK
- `react-vendor-[hash].js` — React + React Router
- `[page]-[hash].js` — Lazy-loaded page chunks (one per route)
- Source maps disabled in production

---

## 14. Deployment

**Platform:** Vercel (auto-deploys from `main` branch on GitHub)

**vercel.json** handles:
- SPA rewrite: all routes -> `index.html`
- Security headers: `X-Content-Type-Options`, `X-Frame-Options`, `X-XSS-Protection`

**Deploy process:**
1. Push to `main` branch
2. Vercel auto-runs `npm run build`
3. Deploys `dist/` to CDN
4. Live at `indic.world`

**Important:** Environment variables must also be set in Vercel dashboard (Settings -> Environment Variables).

---

## 15. Dependencies

| Package | Version | Purpose |
|---|---|---|
| `react` | 19.1.1 | UI framework |
| `react-dom` | 19.1.1 | DOM rendering |
| `react-router-dom` | 7.9.3 | Client-side routing |
| `firebase` | 12.3.0 | Auth, Firestore, Storage, Analytics |
| `react-hook-form` | 7.63.0 | Form handling (contact page) |
| `@hello-pangea/dnd` | 18.0.1 | Drag-and-drop (legacy editor, may remove) |

Dev dependencies: Vite, ESLint, React types.

---

## 16. Admin Panel Features

- **Pending Review tab** — See all submitted articles, approve/reject/request changes
- **Published tab** — All live articles
- **Rejected / Archived / Deleted tabs** — Manage rejected or removed content
- **Users tab** — View all users, change roles
- **Real-time updates** — Uses Firestore `onSnapshot` listeners
- **Search** — Filter articles by title or author

---

## 17. Notification System

`NotificationSystem.jsx` provides a context with:
- `success(message)` — Green toast
- `error(message)` — Red toast
- `warning(message)` — Yellow toast
- `info(message)` — Blue toast
- `showConfirmation({ title, message, confirmText })` — Promise-based modal

Auto-dismisses after 3 seconds. Used across all pages for user feedback.

---

## 18. Design System

| Element | Value |
|---|---|
| Primary font | Crimson Text (serif) |
| System font | -apple-system, BlinkMacSystemFont, Segoe UI, Roboto |
| Text color | #1a1a1a (heading), #333 (body), #666 (secondary), #999 (muted) |
| Background | #fafafa (light), #fff (white), #1a1a1a (dark/topbar) |
| Border | #e0e0e0 |
| Breakpoints | 1200px, 768px, 480px |
| Max content width | 1100px (editor grid), 680px (text blocks) |
| Grid | 12 columns, 24px gap |
| Aesthetic | Minimal, editorial, Magnum Photos-inspired |

---

## 19. How to Run Locally

```bash
# Clone
git clone https://github.com/captainlabu-work/Indic-World.git
cd Indic-World

# Install
npm install

# Set up environment
cp .env.example .env
# Edit .env with Firebase credentials from console.firebase.google.com

# Run
npm run dev
# Opens at http://localhost:3000
```

---

## 20. Known TODOs

- [ ] Fetch user-created articles from Firestore on category pages (currently shows pre-loaded data only)
- [ ] Build a published story viewer that renders the JSON block data from the new editor
- [ ] Upload images to Firebase Storage from StoryEditor (currently uses base64 data URLs)
- [ ] Delete legacy `VisualStoryEditor.jsx` once new editor is stable
- [ ] Implement account deletion in Settings
- [ ] Add email verification flow
- [ ] Video player component for Indic Motion articles
- [ ] Search functionality across stories
- [ ] Pagination for story listings
- [ ] Image optimization pipeline (WebP conversion, responsive srcset)
