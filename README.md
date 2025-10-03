# Indic - Stories That Matter

A content publishing platform for storytellers, photographers, and writers to share their stories with the world. Built with vanilla JavaScript and Firebase, optimized for Netlify deployment.

🌟 **Live Demo**: [Your Netlify URL will be here]

## Features

- **User Authentication**: Secure login/signup system
- **Content Creation**: Rich text editor with image upload capabilities
- **Admin Approval System**: All submissions reviewed before publication
- **User Dashboard**: Authors can manage their articles and track status
- **Admin Panel**: Complete content management system for administrators
- **Responsive Design**: Works beautifully on all devices
- **Firebase Integration**: Real-time database, authentication, and file storage

## Tech Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Backend**: Firebase (Authentication, Firestore, Storage)
- **Hosting**: Firebase Hosting
- **Design**: Custom CSS with Crimson Text font

## Project Structure

```
indic-stories/
├── index.html              # Main application file
├── css/
│   └── styles.css          # All application styles
├── js/
│   ├── firebase-config.js  # Firebase configuration
│   ├── app.js             # Main application logic
│   ├── dashboard.js       # User dashboard functionality
│   ├── admin.js           # Admin panel functionality
│   └── create-article.js  # Article creation/editing
├── firebase.json          # Firebase hosting configuration
├── firestore.rules        # Firestore security rules
├── storage.rules          # Firebase Storage security rules
├── firestore.indexes.json # Firestore database indexes
└── package.json           # Project dependencies
```

## Setup Instructions

### Prerequisites

1. Node.js (for Firebase CLI)
2. Firebase account
3. Firebase project created

### Firebase Project Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or use existing project "INDIC" (indicteam1)
3. Enable the following services:
   - **Authentication** (Email/Password provider)
   - **Firestore Database**
   - **Storage**
   - **Hosting**

### Local Development

1. Clone or download the project files
2. Install Firebase CLI:
   ```bash
   npm install -g firebase-tools
   ```

3. Login to Firebase:
   ```bash
   firebase login
   ```

4. Initialize Firebase in the project directory:
   ```bash
   firebase init
   ```
   - Select: Firestore, Storage, Hosting
   - Use existing project: indicteam1
   - Accept default settings

5. Update Firebase configuration in `js/firebase-config.js` if needed

6. Deploy Firestore rules and indexes:
   ```bash
   firebase deploy --only firestore:rules,firestore:indexes,storage
   ```

7. Start local development server:
   ```bash
   firebase serve
   ```

### Deployment

Deploy to Firebase Hosting:
```bash
firebase deploy
```

Your app will be available at: `https://indicteam1.web.app`

## User Roles

### Admin
- **Email**: workvishalthakur@gmail.com
- **Permissions**: 
  - Review and approve/reject articles
  - Manage all content
  - Access admin panel
  - View analytics

### Authors (Regular Users)
- **Permissions**:
  - Create and edit articles
  - Upload images
  - View their dashboard
  - Submit articles for review

## Usage Guide

### For Authors

1. **Sign Up**: Create an account with email and password
2. **Create Article**: Click "Create Story" button
3. **Add Content**: 
   - Enter title and excerpt
   - Upload featured image
   - Write your story
   - Add relevant tags
4. **Submit**: Submit for admin review or save as draft
5. **Track Status**: Monitor approval status in dashboard

### For Admin

1. **Login**: Use admin email (workvishalthakur@gmail.com)
2. **Review Articles**: Access admin panel to see pending submissions
3. **Approve/Reject**: 
   - Preview full articles
   - Approve for publication
   - Request changes with feedback
   - Reject with reasons
4. **Manage Content**: View all articles and user statistics

## Article Workflow

1. **Draft** → Author creates and saves article
2. **Pending** → Author submits for review
3. **Published** → Admin approves article (visible to public)
4. **Rejected** → Admin requests changes (back to author)

## Security Features

- **Authentication**: Firebase Auth with email/password
- **Authorization**: Role-based access control
- **Data Security**: Firestore security rules
- **File Upload**: Secure image upload with size/type validation
- **Admin Protection**: Admin-only routes and functions

## Customization

### Styling
- Edit `css/styles.css` for design changes
- Maintains existing Indic brand aesthetic
- Fully responsive design

### Functionality
- Modify JavaScript files in `js/` directory
- Firebase configuration in `js/firebase-config.js`
- Add new features by extending existing classes

## Support

For technical support or questions:
- Email: workvishalthakur@gmail.com
- Review code documentation in source files

## License

This project is proprietary software for Indic platform.

---

**Indic - Where authentic stories find their voice**