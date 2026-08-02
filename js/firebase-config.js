// ============================================================================
// StudyHub — Firebase configuration
//
// 1. Go to https://console.firebase.google.com → create a project.
// 2. Add a Web App to the project (</> icon) to get your config values.
// 3. Paste those values below, replacing the placeholders.
// 4. Enable these in the Firebase console:
//      - Authentication → Sign-in method → Email/Password
//      - Firestore Database → Create database (start in production mode)
//      - Storage → Get started
// 5. See README.md in this project for the Firestore/Storage security rules
//    and the seed data structure this app expects.
// ============================================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyBSMvHpZ0_VkqWjJ94UMa6vqEhFiqrsIWM",
authDomain: "rare-5f47e.firebaseapp.com",
databaseURL: "https://rare-5f47e-default-rtdb.firebaseio.com",
projectId: "rare-5f47e",
storageBucket: "rare-5f47e.appspot.com",
messagingSenderId: "811727087812",
appId: "1:811727087812:web:d362e68abf6c26acf24191"

};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
