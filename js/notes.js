// ============================================================================
// StudyHub — Notes module (student-facing read/search/bookmark)
// ============================================================================

import { db } from "./firebase-config.js";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  query,
  orderBy,
  addDoc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

/** Fetch all notes, newest first. For larger datasets, add pagination (startAfter). */
export async function fetchAllNotes() {
  const q = query(collection(db, "notes"), orderBy("created_at", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/** Client-side search/filter — fine for small-to-medium note libraries.
 *  For large libraries, move this to Algolia/Typesense or Firestore array-contains on keywords. */
export function filterNotes(notes, { search = "", subject = "" } = {}) {
  const s = search.trim().toLowerCase();
  return notes.filter((note) => {
    const matchesSearch =
      !s ||
      note.title?.toLowerCase().includes(s) ||
      note.description?.toLowerCase().includes(s) ||
      note.subject?.toLowerCase().includes(s);
    const matchesSubject = !subject || note.subject === subject;
    return matchesSearch && matchesSubject;
  });
}

export function uniqueSubjects(notes) {
  return [...new Set(notes.map((n) => n.subject).filter(Boolean))].sort();
}

/** Fire-and-forget activity log, used to power the "recent activity" and "notes viewed" dashboard stats. */
export async function logNoteView(userId, noteId, noteTitle) {
  try {
    await addDoc(collection(db, "activity_logs"), {
      user_id: userId,
      type: "note_view",
      ref_id: noteId,
      label: noteTitle,
      created_at: serverTimestamp(),
    });
  } catch (e) {
    console.warn("Could not log note view:", e);
  }
}

export async function toggleBookmark(userId, noteId, isBookmarked) {
  const ref = doc(db, "users", userId);
  await updateDoc(ref, {
    bookmarks: isBookmarked ? arrayRemove(noteId) : arrayUnion(noteId),
  });
  return !isBookmarked;
}
