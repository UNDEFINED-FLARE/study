// ============================================================================
// StudyHub — Admin: notes management (upload / edit / delete)
// ============================================================================

import { db, storage, auth } from "./firebase-config.js";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-storage.js";

export async function fetchAllNotesAdmin() {
  const q = query(collection(db, "notes"), orderBy("created_at", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/** Accepts PDF, DOCX and image files per the spec. Storage rules should also enforce this. */
export async function createNote({ title, description, subject, file }) {
  let fileUrl = "";
  let filePath = "";
  if (file) {
    filePath = `notes/${Date.now()}_${file.name}`;
    const fileRef = ref(storage, filePath);
    await uploadBytes(fileRef, file);
    fileUrl = await getDownloadURL(fileRef);
  }

  await addDoc(collection(db, "notes"), {
    title,
    description,
    subject,
    file_url: fileUrl,
    file_path: filePath,
    uploaded_by: auth.currentUser?.uid || "",
    created_at: serverTimestamp(),
  });
}

export async function updateNote(noteId, { title, description, subject, file, oldFilePath }) {
  const updates = { title, description, subject };

  if (file) {
    if (oldFilePath) {
      try {
        await deleteObject(ref(storage, oldFilePath));
      } catch (e) {
        console.warn("Could not delete old file (may not exist):", e);
      }
    }
    const filePath = `notes/${Date.now()}_${file.name}`;
    const fileRef = ref(storage, filePath);
    await uploadBytes(fileRef, file);
    updates.file_url = await getDownloadURL(fileRef);
    updates.file_path = filePath;
  }

  await updateDoc(doc(db, "notes", noteId), updates);
}

export async function deleteNote(noteId, filePath) {
  if (filePath) {
    try {
      await deleteObject(ref(storage, filePath));
    } catch (e) {
      console.warn("Could not delete file from storage (may not exist):", e);
    }
  }
  await deleteDoc(doc(db, "notes", noteId));
}
