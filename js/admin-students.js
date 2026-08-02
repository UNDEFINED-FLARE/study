// ============================================================================
// StudyHub — Admin: student management
// ============================================================================

import { db } from "./firebase-config.js";
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  deleteDoc,
  doc,
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

/** All accounts with role "student", newest first. */
export async function fetchAllStudents() {
  const q = query(collection(db, "users"), where("role", "==", "student"), orderBy("created_at", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function fetchAllResultsGrouped() {
  const snap = await getDocs(collection(db, "results"));
  const byUser = {};
  snap.docs.forEach((d) => {
    const r = d.data();
    byUser[r.user_id] = byUser[r.user_id] || { attempts: 0, totalPct: 0 };
    byUser[r.user_id].attempts += 1;
    byUser[r.user_id].totalPct += r.percentage || 0;
  });
  return byUser;
}

/**
 * Removes a student's Firestore profile so they no longer appear as an
 * active account. Note: this does NOT delete their Firebase Auth login —
 * that requires the Admin SDK on a server (see README "Deleting auth users").
 */
export async function removeStudentProfile(userId) {
  await deleteDoc(doc(db, "users", userId));
}
