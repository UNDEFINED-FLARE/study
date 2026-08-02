// ============================================================================
// StudyHub — Quiz module
// Data model:
//   quizzes/{id}      { title, subject, passing_mark, timer(min), random_order, max_attempts, created_at }
//   questions/{id}    { quiz_id, type: 'mc'|'tf'|'short', question,
//                       option_a, option_b, option_c, option_d, correct_answer }
//   results/{id}      { user_id, quiz_id, score, total, percentage, answers, completed_at }
// ============================================================================

import { db } from "./firebase-config.js";
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  addDoc,
  serverTimestamp,
  doc,
  getDoc,
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

export async function fetchAllQuizzes() {
  const q = query(collection(db, "quizzes"), orderBy("created_at", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function fetchQuiz(quizId) {
  const snap = await getDoc(doc(db, "quizzes", quizId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function fetchQuestionsForQuiz(quizId, randomOrder = false) {
  const q = query(collection(db, "questions"), where("quiz_id", "==", quizId));
  const snap = await getDocs(q);
  let questions = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  if (randomOrder) questions = shuffle(questions);
  return questions;
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Grades a completed attempt.
 * answers: { [questionId]: userAnswerString }
 * Short-answer questions are graded with a case-insensitive, trimmed exact match —
 * flag them for manual review in a real deployment if you need fuzzier grading.
 */
export function gradeQuiz(questions, answers) {
  let score = 0;
  const perQuestion = questions.map((q) => {
    const userAnswer = (answers[q.id] || "").toString().trim();
    const correct = (q.correct_answer || "").toString().trim();
    const isCorrect =
      q.type === "short"
        ? userAnswer.toLowerCase() === correct.toLowerCase()
        : userAnswer === correct;
    if (isCorrect) score += 1;
    return { questionId: q.id, userAnswer, correct, isCorrect };
  });
  const total = questions.length;
  const percentage = total > 0 ? Math.round((score / total) * 100) : 0;
  return { score, total, percentage, perQuestion };
}

export async function saveResult({ userId, quizId, score, total, percentage, perQuestion }) {
  const ref = await addDoc(collection(db, "results"), {
    user_id: userId,
    quiz_id: quizId,
    score,
    total,
    percentage,
    answers: perQuestion,
    completed_at: serverTimestamp(),
  });
  return ref.id;
}

export async function fetchResultsForUser(userId) {
  const q = query(collection(db, "results"), where("user_id", "==", userId), orderBy("completed_at", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function fetchResult(resultId) {
  const snap = await getDoc(doc(db, "results", resultId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}
