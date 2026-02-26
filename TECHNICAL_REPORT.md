# Indic - Technical Report & Project Documentation

**Version:** 3.2.x
**Last Updated:** December 2025
**Repository:** Indic-World

---

## Executive Summary

Indic is a modern storytelling platform that enables users to create, share, and discover stories across multiple formats. The platform supports written narratives (Word), photo essays (Lens), and video content (Motion). Built with React and Firebase, it offers a seamless experience for both content creators and readers.

### Key Highlights
- Full-stack React application with Firebase backend
- User authentication with email and Google OAuth
- Content management system with admin approval workflow
- Responsive, mobile-first design
- Real-time data synchronization

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Technology Stack](#2-technology-stack)
3. [Architecture](#3-architecture)
4. [Features](#4-features)
5. [Firebase Services](#5-firebase-services)
6. [File Structure](#6-file-structure)
7. [User Roles & Permissions](#7-user-roles--permissions)
8. [Content Workflow](#8-content-workflow)
9. [Design System](#9-design-system)
10. [Development Setup](#10-development-setup)
11. [Build & Deployment](#11-build--deployment)
12. [Project Status](#12-project-status)
13. [Future Roadmap](#13-future-roadmap)

---

## 1. Project Overview

### 1.1 What is Indic?

Indic is a digital storytelling platform designed to provide a space for authentic, meaningful narratives. The platform serves as a hub for:

- **Writers** - Publishing long-form articles and essays
- **Photographers** - Sharing photo essays and visual stories
- **Filmmakers** - Showcasing documentaries and video content

### 1.2 Mission Statement

*"Stories That Matter"* - Indic aims to amplify voices and stories that deserve to be heard, focusing on quality over quantity.

### 1.3 Target Audience

| Audience | Description |
|----------|-------------|
| Content Creators | Writers, photographers, videographers seeking a quality platform |
| Readers | Users interested in authentic, curated storytelling |
| Administrators | Content moderators and platform managers |

---

## 2. Technology Stack

### 2.1 Frontend Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 19.2.0 | UI component library |
| **React Router DOM** | 7.9.3 | Client-side routing & navigation |
| **React Hook Form** | 7.63.0 | Form handling & validation |
| **@hello-pangea/dnd** | 18.0.1 | Drag-and-drop functionality |
| **Vite** | 7.1.9 | Build tool & dev server |

### 2.2 Backend Services (Firebase)

| Service | Purpose |
|---------|---------|
| **Firebase Authentication** | User sign-up, login, OAuth |
| **Cloud Firestore** | NoSQL database for content storage |
| **Firebase Storage** | Image and media file storage |
| **Firebase Analytics** | User behavior tracking |

### 2.3 Development Tools

| Tool | Version | Purpose |
|------|---------|---------|
| **ESLint** | 9.36.0 | Code linting & quality |
| **Vite Plugin React** | 5.0.4 | React fast refresh & JSX support |

### 2.4 External Services

| Service | Purpose |
|---------|---------|
| **Google Fonts** | Typography (Crimson Text) |
| **Unsplash** | Stock images for placeholder content |

---

## 3. Architecture

### 3.1 Application Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      CLIENT (Browser)                        │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   React     │  │   Router    │  │   Context API       │  │
│  │   Components│  │   (SPA)     │  │   (Auth, State)     │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│                    Firebase SDK (v12.3.0)                    │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │   Auth   │  │ Firestore│  │ Storage  │  │Analytics │    │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    FIREBASE CLOUD                            │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Authentication  │  Firestore DB  │  Cloud Storage   │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 Component Architecture

```
App.jsx
├── AuthProvider (Context)
│   └── NotificationProvider (Context)
│       └── Router
│           ├── Navbar (Common)
│           ├── Routes
│           │   ├── Public Routes
│           │   │   ├── Home
│           │   │   ├── About
│           │   │   ├── Contact
│           │   │   ├── Auth (Login/Signup)
│           │   │   ├── Article/:id
│           │   │   ├── PhotoEssay/:storyId
│           │   │   ├── Privacy
│           │   │   └── Terms
│           │   │
│           │   └── Protected Routes
│           │       ├── Profile
│           │       ├── Settings
│           │       ├── CreateStory
│           │       ├── EditArticle/:id
│           │       └── Admin (adminOnly)
│           │
│           └── Footer (Common)
```

### 3.3 Data Flow

```
User Action → Component → Firebase Service → Firestore/Storage
                  ↑                              │
                  └──────── Real-time Update ────┘
```

---

## 4. Features

### 4.1 Core Features

| Feature | Description | Status |
|---------|-------------|--------|
| User Authentication | Email/password & Google OAuth | Complete |
| Story Creation | Rich text editor for articles | Complete |
| Photo Essays | Visual story format with images | Complete |
| Admin Dashboard | Content moderation & approval | Complete |
| User Profiles | Personal dashboard & settings | Complete |
| Responsive Design | Mobile-first approach | Complete |

### 4.2 Content Categories

| Category | Icon | Description |
|----------|------|-------------|
| **Indic Word** | ✍️ | Written narratives & reportage |
| **Indic Lens** | 📸 | Visual stories & photo essays |
| **Indic Motion** | 🎬 | Documentaries & films |

### 4.3 User Features

- **Create & Edit Stories** - Rich text editor with markdown support
- **Visual Story Editor** - Drag-and-drop image arrangement
- **Profile Management** - Update bio, avatar, social links
- **Story Dashboard** - Track article status and views

### 4.4 Admin Features

- **Content Moderation** - Review pending submissions
- **Approval Workflow** - Approve, request changes, or reject
- **User Management** - View and manage user accounts
- **Analytics Dashboard** - Track platform metrics

---

## 5. Firebase Services

### 5.1 Authentication

```javascript
// Supported Auth Methods
- Email/Password signup & login
- Google OAuth (popup)
- Password reset via email
```

**User Document Structure:**
```javascript
{
  uid: "firebase_auth_uid",
  email: "user@example.com",
  displayName: "User Name",
  photoURL: "https://...",
  role: "author" | "admin",
  createdAt: Timestamp,
  articlesCount: 0
}
```

### 5.2 Firestore Collections

| Collection | Purpose | Key Fields |
|------------|---------|------------|
| `users` | User profiles | uid, email, displayName, role |
| `articles` | Story content | title, content, authorId, status |

**Article Document Structure:**
```javascript
{
  id: "auto_generated",
  title: "Article Title",
  content: "Full article content...",
  excerpt: "Brief summary...",
  featuredImage: "https://storage.url/image.jpg",
  authorId: "user_uid",
  authorName: "Author Name",
  category: "word" | "lens" | "motion",
  status: "draft" | "pending" | "published" | "needs-revision" | "rejected" | "archived" | "deleted",
  tags: ["tag1", "tag2"],
  views: 0,
  createdAt: Timestamp,
  updatedAt: Timestamp,
  publishedAt: Timestamp | null
}
```

### 5.3 Storage Structure

```
Firebase Storage
├── articles/
│   └── {authorId}/
│       └── {timestamp}_{filename}
└── avatars/
    └── {userId}/
        └── avatar.{ext}
```

### 5.4 Security Rules (Recommended)

```javascript
// Firestore Rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own data
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == resource.data.uid;
    }

    // Published articles are public, drafts are private
    match /articles/{articleId} {
      allow read: if resource.data.status == 'published'
                  || request.auth.uid == resource.data.authorId;
      allow write: if request.auth.uid == resource.data.authorId;
    }
  }
}
```

---

## 6. File Structure

```
Indic-World/
├── public/
│   ├── favicon.ico
│   ├── Indic.png
│   ├── Indic 2.png
│   └── vite.svg
│
├── src/
│   ├── components/
│   │   ├── common/
│   │   │   ├── Footer.jsx/.css
│   │   │   ├── Loading.jsx/.css
│   │   │   ├── Navbar.jsx/.css
│   │   │   ├── NotificationSystem.jsx/.css
│   │   │   └── ProtectedRoute.jsx
│   │   ├── RichTextEditor.jsx/.css
│   │   └── VisualStoryEditor.jsx/.css
│   │
│   ├── contexts/
│   │   └── AuthContext.jsx
│   │
│   ├── data/
│   │   ├── authenticStories.js
│   │   └── historicalStories.js
│   │
│   ├── firebase/
│   │   ├── config.js
│   │   └── services.js
│   │
│   ├── pages/
│   │   ├── About.jsx/.css
│   │   ├── Admin.jsx/.css
│   │   ├── Article.jsx/.css
│   │   ├── Auth.jsx/.css
│   │   ├── Contact.jsx/.css
│   │   ├── CreateStory.jsx/.css
│   │   ├── EditArticle.jsx
│   │   ├── Home.jsx/.css
│   │   ├── PhotoEssay.jsx/.css
│   │   ├── Privacy.jsx
│   │   ├── Profile.jsx/.css
│   │   ├── Settings.jsx/.css
│   │   └── Terms.jsx
│   │
│   ├── utils/
│   │   ├── fixUserData.js
│   │   └── formatters.js
│   │
│   ├── App.jsx/.css
│   ├── index.css
│   └── main.jsx
│
├── .env
├── .env.example
├── .gitignore
├── CLAUDE.md
├── eslint.config.js
├── index.html
├── package.json
├── README.md
├── TECHNICAL_REPORT.md
└── vite.config.js
```

---

## 7. User Roles & Permissions

### 7.1 Role Definitions

| Role | Description | Access Level |
|------|-------------|--------------|
| **Guest** | Unauthenticated visitor | Read public content only |
| **Author** | Registered user | Create, edit own content |
| **Admin** | Platform administrator | Full access, content moderation |

### 7.2 Permission Matrix

| Action | Guest | Author | Admin |
|--------|-------|--------|-------|
| View published articles | ✅ | ✅ | ✅ |
| View photo essays | ✅ | ✅ | ✅ |
| Create articles | ❌ | ✅ | ✅ |
| Edit own articles | ❌ | ✅ | ✅ |
| Submit for review | ❌ | ✅ | ✅ |
| View admin dashboard | ❌ | ❌ | ✅ |
| Approve/Reject articles | ❌ | ❌ | ✅ |
| Manage users | ❌ | ❌ | ✅ |

### 7.3 Admin Assignment

Admin role is automatically assigned when user email matches:
```javascript
VITE_ADMIN_EMAIL=workvishalthakur@gmail.com
```

---

## 8. Content Workflow

### 8.1 Article Lifecycle

```
┌─────────┐     ┌─────────┐     ┌──────────┐     ┌───────────┐
│  Draft  │ ──▶ │ Pending │ ──▶ │ Published│ ──▶ │ Archived  │
└─────────┘     └─────────┘     └──────────┘     └───────────┘
     │               │                                  │
     │               ▼                                  │
     │         ┌───────────────┐                        │
     │         │Needs Revision │ ◀──────────────────────┘
     │         └───────────────┘
     │               │
     ▼               ▼
┌─────────┐    ┌──────────┐
│ Deleted │    │ Rejected │
└─────────┘    └──────────┘
```

### 8.2 Status Definitions

| Status | Description |
|--------|-------------|
| `draft` | Work in progress, not submitted |
| `pending` | Submitted for admin review |
| `published` | Approved and publicly visible |
| `needs-revision` | Returned to author with feedback |
| `rejected` | Permanently declined |
| `archived` | Hidden from public but preserved |
| `deleted` | Soft-deleted, can be restored |

---

## 9. Design System

### 9.1 Color Palette

| Color | Hex | Usage |
|-------|-----|-------|
| Primary Dark | `#262626` | Text, headings |
| Background | `#fafafa` | Page backgrounds |
| Border/Muted | `#e0e0e0` | Borders, dividers |
| Secondary Text | `#8e8e8e` | Captions, meta info |

### 9.2 Typography

- **Primary Font:** Crimson Text (Google Fonts)
- **Style:** Serif, elegant, readable
- **Weights:** 400 (regular), 600 (semi-bold), 700 (bold)

### 9.3 Responsive Breakpoints

| Breakpoint | Width | Target |
|------------|-------|--------|
| Desktop | > 768px | Full layout |
| Tablet | 481px - 768px | Adapted layout |
| Mobile | ≤ 480px | Single column |

### 9.4 Design Principles

- **Minimalist Aesthetic** - Clean, uncluttered interfaces
- **Content-First** - Stories take center stage
- **Indie Feel** - Authentic, non-corporate appearance
- **Accessibility** - WCAG compliant color contrast

---

## 10. Development Setup

### 10.1 Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Firebase project with enabled services
- Git

### 10.2 Installation Steps

```bash
# 1. Clone the repository
git clone https://github.com/[your-username]/Indic-World.git
cd Indic-World

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.example .env
# Edit .env with your Firebase credentials

# 4. Start development server
npm run dev
```

### 10.3 Environment Variables

```bash
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
VITE_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX

# Admin Configuration
VITE_ADMIN_EMAIL=admin@example.com
```

### 10.4 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server on port 3000 |
| `npm run build` | Create production build |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint checks |

---

## 11. Build & Deployment

### 11.1 Build Output

```bash
npm run build

# Output:
dist/
├── index.html           (1.39 kB)
├── assets/
│   ├── index-*.css      (82.89 kB)
│   ├── index-*.js       (423.58 kB)
│   ├── react-vendor-*.js (44.44 kB)
│   └── firebase-*.js    (540.88 kB)
```

### 11.2 Bundle Optimization

Vite is configured with manual chunks for optimal loading:
- `react-vendor` - React core libraries
- `firebase` - Firebase SDK modules

### 11.3 Deployment Options

| Platform | Configuration |
|----------|---------------|
| **Netlify** | Auto-detects Vite, add `_redirects` for SPA |
| **Vercel** | Zero-config deployment |
| **Firebase Hosting** | Use `firebase deploy` |

### 11.4 SPA Routing Configuration

For Netlify, create `public/_redirects`:
```
/*    /index.html   200
```

---

## 12. Project Status

### 12.1 Build Status

| Check | Status |
|-------|--------|
| Build | ✅ Passing |
| Bundle Size | ⚠️ Firebase chunk > 500kB |
| ESLint | ⚠️ 14 minor issues (unused vars) |

### 12.2 Current Issues

| Issue | Severity | File | Description |
|-------|----------|------|-------------|
| Unused variables | Low | Multiple | Declared but unused imports/vars |
| Large bundle | Low | firebase-*.js | Consider lazy loading |

### 12.3 Recent Changes (v3.2.x)

- Migrated to `historicalStories.js` data structure
- Enhanced PhotoEssay page with better formatting
- Updated Home page with curated content sections
- Removed deprecated `publicDomainStories.js`

---

## 13. Future Roadmap

### 13.1 Planned Features

| Feature | Priority | Description |
|---------|----------|-------------|
| Comments System | High | User discussions on articles |
| Search Functionality | High | Full-text article search |
| Social Sharing | Medium | Share buttons for platforms |
| Bookmarks | Medium | Save articles for later |
| Newsletter | Medium | Email subscription service |
| Dark Mode | Low | Theme toggle option |

### 13.2 Technical Improvements

| Improvement | Priority | Impact |
|-------------|----------|--------|
| Code Splitting | High | Reduce initial load time |
| PWA Support | Medium | Offline capability |
| Image Optimization | Medium | Faster page loads |
| Unit Tests | Medium | Code reliability |
| CI/CD Pipeline | Low | Automated deployments |

---

## Appendix A: API Reference

### Authentication Service

```javascript
authService.signUp(email, password, displayName)
authService.signIn(email, password)
authService.signInWithGoogle()
authService.signOut()
authService.resetPassword(email)
```

### User Service

```javascript
userService.getUserData(uid)
userService.updateUserProfile(userId, data)
userService.isAdmin(uid)
userService.updateUserRole(userId, newRole)
```

### Article Service

```javascript
articleService.createArticle(articleData)
articleService.updateArticle(articleId, data)
articleService.deleteArticle(articleId)
articleService.getArticle(articleId)
articleService.getPublishedArticles(limit)
articleService.submitForReview(articleId)
articleService.approveArticle(articleId)
articleService.requestChanges(articleId, feedback)
articleService.rejectArticle(articleId, reason)
```

### Storage Service

```javascript
storageService.uploadImage(file, path)
storageService.deleteImage(imageUrl)
storageService.uploadArticleImage(file, authorId)
storageService.uploadAvatar(file, userId)
```

---

## Appendix B: Contact & Support

- **Repository:** GitHub - Indic-World
- **Primary Developer:** Vishal Thakur
- **Admin Email:** workvishalthakur@gmail.com

---

*This document is auto-generated and should be updated with each major release.*
