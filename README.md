# StudyHub — Student Learning Platform (MVP)

A responsive student learning platform: notes, auto-graded quizzes, progress
dashboards and an admin panel. Built with plain HTML/CSS/JS (ES modules,
no build step) and Firebase (Auth, Firestore, Storage).

## 1. Project structure

```
studyhub/
├── index.html                 Public homepage
├── login.html / register.html / forgot-password.html
├── dashboard.html             Student dashboard
├── notes.html                 Browse / search / filter / bookmark notes
├── quizzes.html                Quiz list
├── quiz-take.html             Take a quiz (timer, auto-grading)
├── quiz-results.html          Results + correct answers
├── profile.html                Edit name / photo / password
├── admin/
│   ├── dashboard.html          Admin stats & charts
│   ├── notes.html               Upload / edit / delete notes
│   ├── quizzes.html             List quizzes, create/delete
│   ├── quiz-editor.html         Create/edit a quiz + its questions
│   └── students.html            Manage student accounts
├── css/style.css               Shared design system (blue/purple theme)
└── js/
    ├── firebase-config.js      ← put your Firebase keys here
    ├── auth.js                 register/login/logout/reset + route guards
    ├── nav.js                  Shared navbar (role-aware)
    ├── notes.js, quiz.js, dashboard.js, profile.js
    ├── admin-notes.js, admin-quizzes.js, admin-students.js, admin-dashboard.js
    └── utils.js                 Formatting + friendly error helpers
```

All pages use native ES module `<script type="module">` imports and load
the Firebase SDK straight from `gstatic.com` — no npm install or bundler
needed.

## 2. Create your Firebase project

1. Go to the [Firebase console](https://console.firebase.google.com) → **Add project**.
2. Inside the project, click the **`</>`** (web app) icon to register a web app and copy the `firebaseConfig` object it gives you.
3. Paste those values into `js/firebase-config.js`, replacing the `YOUR_...` placeholders.
4. Turn on the three services this app uses:
   - **Build → Authentication → Sign-in method → Email/Password → Enable**
   - **Build → Firestore Database → Create database** (start in *production* mode, pick a region)
   - **Build → Storage → Get started** (used for note file uploads and profile photos)

## 3. Run it locally

Because pages use `/css/...` and `/js/...` absolute paths and ES modules,
you need to serve the folder over HTTP — opening the HTML files directly
(`file://`) will not work. Any static server is fine, e.g.:

```bash
cd studyhub
python3 -m http.server 5500
# then open http://localhost:5500
```

Or use the Firebase CLI, which also makes deploying trivial:

```bash
npm install -g firebase-tools
firebase login
firebase init hosting   # point the public directory at this folder
firebase serve          # local preview
firebase deploy         # goes live on your *.web.app URL
```

## 4. Make your first admin account

Every account that registers through `register.html` is created as a
`student` in Firestore. To create an admin:

1. Register normally with the account you want to be an admin.
2. In the Firebase console, go to **Firestore Database → users → (your uid)**.
3. Change the `role` field from `student` to `admin`, save.
4. Log out and back in — you'll land on `/admin/dashboard.html`.

## 5. Firestore security rules

Paste this into **Firestore Database → Rules**. It enforces: students can
only edit their own profile/results, only admins can write notes/quizzes/
questions, and everyone signed in can read published content.

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function isSignedIn() { return request.auth != null; }
    function isAdmin() {
      return isSignedIn() &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    function isOwner(userId) { return isSignedIn() && request.auth.uid == userId; }

    match /users/{userId} {
      allow read: if isSignedIn();
      allow create: if isOwner(userId);
      allow update: if isOwner(userId) || isAdmin();
      allow delete: if isAdmin();
    }

    match /notes/{noteId} {
      allow read: if isSignedIn();
      allow write: if isAdmin();
    }

    match /quizzes/{quizId} {
      allow read: if isSignedIn();
      allow write: if isAdmin();
    }

    match /questions/{questionId} {
      allow read: if isSignedIn();
      allow write: if isAdmin();
    }

    match /results/{resultId} {
      allow read: if isSignedIn() && (resource.data.user_id == request.auth.uid || isAdmin());
      allow create: if isSignedIn() && request.resource.data.user_id == request.auth.uid;
      allow update, delete: if isAdmin();
    }

    match /login_logs/{logId} {
      allow read: if isAdmin();
      allow create: if isSignedIn();
    }
  }
}
```

## 6. Storage security rules

Paste this into **Storage → Rules** (covers note file uploads and profile photos):

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /notes/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null &&
        firestore.get(/databases/(default)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    match /profile_images/{userId}/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## 7. Firestore data model

| Collection    | Key fields |
|---|---|
| `users`       | `name, email, role ('student'\|'admin'), profile_image, bookmarks[], created_at` |
| `notes`       | `title, description, subject, file_url, uploaded_by, created_at` |
| `quizzes`     | `title, subject, passing_mark, timer, random_order, max_attempts, created_at` |
| `questions`   | `quiz_id, type ('mc'\|'tf'\|'short'), question, option_a..d, correct_answer` |
| `results`     | `user_id, quiz_id, score, total, percentage, answers[], completed_at` |
| `login_logs`  | `user_id, login_time, device` |

## 8. What's stubbed vs. fully wired

Everything above — auth, notes CRUD, quiz creation, timed quiz-taking with
auto-grading, dashboards, admin panel — is fully wired to Firebase, not
mocked. The only thing you need to do is drop in your real
`firebaseConfig` and turn on the three services in step 2. Charts on the
dashboards use Chart.js (loaded via CDN) reading straight from Firestore.

## 9. Suggested next steps

- Add a Cloud Function to compute analytics rollups (DAU/WAU/MAU) server-side
  instead of client-side aggregation, once your user base grows.
- Add email verification (`sendEmailVerification`) if you want to require
  verified emails before granting quiz access.
- Turn on Firebase App Check before going to production to stop API abuse.
