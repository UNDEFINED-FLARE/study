// ============================================================================
// StudyHub — Admin: quiz + question management
// ============================================================================

import { db } from "./firebase-config.js";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  writeBatch,
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

export async function fetchAllQuizzesAdmin() {
  const q = query(collection(db, "quizzes"), orderBy("created_at", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function fetchQuizAdmin(quizId) {
  const snap = await getDoc(doc(db, "quizzes", quizId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function createQuiz({ title, subject, passing_mark, timer, random_order, max_attempts }) {
  const ref = await addDoc(collection(db, "quizzes"), {
    title,
    subject,
    passing_mark: Number(passing_mark) || 50,
    timer: timer ? Number(timer) : null,
    random_order: !!random_order,
    max_attempts: max_attempts ? Number(max_attempts) : null,
    created_at: serverTimestamp(),
  });
  return ref.id;
}

export async function updateQuiz(quizId, { title, subject, passing_mark, timer, random_order, max_attempts }) {
  await updateDoc(doc(db, "quizzes", quizId), {
    title,
    subject,
    passing_mark: Number(passing_mark) || 50,
    timer: timer ? Number(timer) : null,
    random_order: !!random_order,
    max_attempts: max_attempts ? Number(max_attempts) : null,
  });
}

/** Deletes a quiz and all of its questions. Past results are left intact for historical records. */
export async function deleteQuiz(quizId) {
  const questions = await fetchQuestionsAdmin(quizId);
  const batch = writeBatch(db);
  questions.forEach((q) => batch.delete(doc(db, "questions", q.id)));
  batch.delete(doc(db, "quizzes", quizId));
  await batch.commit();
}

export async function fetchQuestionsAdmin(quizId) {
  const q = query(collection(db, "questions"), where("quiz_id", "==", quizId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function addQuestion(quizId, data) {
  await addDoc(collection(db, "questions"), { quiz_id: quizId, ...cleanQuestion(data) });
}

export async function updateQuestion(questionId, data) {
  await updateDoc(doc(db, "questions", questionId), cleanQuestion(data));
}

export async function deleteQuestion(questionId) {
  await deleteDoc(doc(db, "questions", questionId));
}

function cleanQuestion(data) {
  const base = {
    type: data.type,
    question: data.question,
    correct_answer: data.correct_answer,
    explanation: data.explanation || "",
  };
  if (data.type === "mc") {
    base.option_a = data.option_a || "";
    base.option_b = data.option_b || "";
    base.option_c = data.option_c || "";
    base.option_d = data.option_d || "";
  }
  return base;
}
