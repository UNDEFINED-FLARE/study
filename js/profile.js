// ============================================================================
// StudyHub — Profile management
// Email and password changes require a recent login; we reauthenticate with
// the user's current password first since Firebase requires it for security.
// ============================================================================

import { auth, db, storage } from "./firebase-config.js";
import {
  updateProfile,
  updateEmail,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import { doc, updateDoc } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";
import { ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-storage.js";

export async function reauthenticate(user, currentPassword) {
  const credential = EmailAuthProvider.credential(user.email, currentPassword);
  await reauthenticateWithCredential(user, credential);
}

export async function updateName(user, name) {
  await updateProfile(user, { displayName: name });
  await updateDoc(doc(db, "users", user.uid), { name });
}

export async function changeEmail(user, newEmail, currentPassword) {
  await reauthenticate(user, currentPassword);
  await updateEmail(user, newEmail);
  await updateDoc(doc(db, "users", user.uid), { email: newEmail });
}

export async function changePassword(user, newPassword, currentPassword) {
  await reauthenticate(user, currentPassword);
  await updatePassword(user, newPassword);
}

export async function uploadProfilePicture(user, file) {
  const fileRef = ref(storage, `profile_pictures/${user.uid}`);
  await uploadBytes(fileRef, file);
  const url = await getDownloadURL(fileRef);
  await updateProfile(user, { photoURL: url });
  await updateDoc(doc(db, "users", user.uid), { profile_image: url });
  return url;
}
