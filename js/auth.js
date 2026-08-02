// ============================================================================
// StudyHub — Authentication
// Handles registration, login (with remember-me persistence), logout,
// password reset, and the auth-state guard used across every page.
// ============================================================================

import { auth, db } from "./firebase-config.js";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
  collection,
  addDoc,
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";
import { friendlyAuthError } from "./utils.js";

/** Register a new student account and create their Firestore user profile. */
export async function registerStudent({ fullName, email, password }) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(cred.user, { displayName: fullName });

  await setDoc(doc(db, "users", cred.user.uid), {
    id: cred.user.uid,
    name: fullName,
    email,
    role: "student",
    profile_image: "",
    bookmarks: [],
    created_at: serverTimestamp(),
  });

  return cred.user;
}

/** Log in an existing user. rememberMe controls whether the session persists after the browser closes. */
export async function login({ email, password, rememberMe }) {
  await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);
  const cred = await signInWithEmailAndPassword(auth, email, password);

  // Best-effort login log — failures here should never block sign-in.
  try {
    await addDoc(collection(db, "login_logs"), {
      user_id: cred.user.uid,
      login_time: serverTimestamp(),
      device: navigator.userAgent,
    });
  } catch (e) {
    console.warn("Could not write login log:", e);
  }

  return cred.user;
}

export async function logout() {
  await signOut(auth);
  window.location.href = "/login.html";
}

export async function resetPassword(email) {
  await sendPasswordResetEmail(auth, email);
}

/** Fetch the Firestore profile doc (name, role, etc.) for a signed-in user. */
export async function getUserProfile(uid) {
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? snap.data() : null;
}

/**
 * Route guard. Call at the top of every protected page.
 * requiredRole: null (any signed-in user), "student", or "admin".
 * Redirects to /login.html if signed out, or /dashboard.html if the role doesn't match.
 * Resolves with { user, profile } once auth state is confirmed.
 */
export function requireAuth(requiredRole = null) {
  return new Promise((resolve) => {
    onAuthStateChanged(auth, async (user) => {
      if (!user) {
        window.location.href = "/login.html";
        return;
      }
      const profile = await getUserProfile(user.uid);
      if (requiredRole && profile?.role !== requiredRole) {
        window.location.href = profile?.role === "admin" ? "/admin/dashboard.html" : "/dashboard.html";
        return;
      }
      resolve({ user, profile });
    });
  });
}

/**
 * For public pages (like the homepage) that adapt their nav/content based on
 * whether someone is signed in, without forcing a redirect either way.
 * Resolves with { user, profile } or { user: null, profile: null }.
 */
export function onAuthReady() {
  return new Promise((resolve) => {
    onAuthStateChanged(auth, async (user) => {
      if (!user) {
        resolve({ user: null, profile: null });
        return;
      }
      const profile = await getUserProfile(user.uid);
      resolve({ user, profile });
    });
  });
}

/** Wrap a form-submit handler: prevents default, shows a spinner on the button, surfaces friendly errors. */
export function bindAuthForm(formEl, alertEl, handler) {
  formEl.addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = formEl.querySelector('button[type="submit"]');
    const originalLabel = btn.innerHTML;
    alertEl.classList.remove("show");
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span>';
    try {
      await handler();
    } catch (err) {
      alertEl.textContent = friendlyAuthError(err);
      alertEl.className = "alert alert-error show";
      console.error(err);
    } finally {
      btn.disabled = false;
      btn.innerHTML = originalLabel;
    }
  });
}
