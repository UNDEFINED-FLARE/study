// ============================================================================
// StudyHub — Admin dashboard aggregation
// Note: these client-side aggregations are fine for small-to-medium datasets.
// At scale, move rollups (daily/weekly/monthly actives, quiz stats) into a
// scheduled Cloud Function that writes precomputed summary docs.
// ============================================================================

import { db } from "./firebase-config.js";
import {
  collection,
  getDocs,
  getCountFromServer,
  query,
  orderBy,
  limit,
  where,
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

export async function fetchOverviewCounts() {
  const [users, quizzes, notes] = await Promise.all([
    getCountFromServer(collection(db, "users")),
    getCountFromServer(collection(db, "quizzes")),
    getCountFromServer(collection(db, "notes")),
  ]);
  return {
    totalUsers: users.data().count,
    totalQuizzes: quizzes.data().count,
    totalNotes: notes.data().count,
  };
}

export async function fetchAllResultsAdmin() {
  const snap = await getDocs(collection(db, "results"));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function fetchAllLoginLogs() {
  const snap = await getDocs(query(collection(db, "login_logs"), orderBy("login_time", "desc"), limit(500)));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export function computeActiveUsers(loginLogs) {
  const now = Date.now();
  const dayAgo = now - 24 * 60 * 60 * 1000;
  const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
  const monthAgo = now - 30 * 24 * 60 * 60 * 1000;

  const daily = new Set();
  const weekly = new Set();
  const monthly = new Set();

  loginLogs.forEach((log) => {
    if (!log.login_time?.toDate) return;
    const t = log.login_time.toDate().getTime();
    if (t >= dayAgo) daily.add(log.user_id);
    if (t >= weekAgo) weekly.add(log.user_id);
    if (t >= monthAgo) monthly.add(log.user_id);
  });

  return { daily: daily.size, weekly: weekly.size, monthly: monthly.size };
}

export function computeQuizStats(results) {
  const totalAttempts = results.length;
  const avgScore = totalAttempts ? Math.round(results.reduce((s, r) => s + (r.percentage || 0), 0) / totalAttempts) : 0;

  const byQuiz = {};
  results.forEach((r) => {
    byQuiz[r.quiz_id] = byQuiz[r.quiz_id] || { attempts: 0, totalPct: 0 };
    byQuiz[r.quiz_id].attempts += 1;
    byQuiz[r.quiz_id].totalPct += r.percentage || 0;
  });

  return { totalAttempts, avgScore, byQuiz };
}

/** Signups per day for the last 7 days, for a bar chart. */
export async function fetchWeeklySignups() {
  const snap = await getDocs(collection(db, "users"));
  const users = snap.docs.map((d) => d.data());
  const days = [];
  const counts = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const label = d.toLocaleDateString(undefined, { weekday: "short" });
    const dayStart = new Date(d.setHours(0, 0, 0, 0)).getTime();
    const dayEnd = dayStart + 24 * 60 * 60 * 1000;
    const count = users.filter((u) => {
      if (!u.created_at?.toDate) return false;
      const t = u.created_at.toDate().getTime();
      return t >= dayStart && t < dayEnd;
    }).length;
    days.push(label);
    counts.push(count);
  }
  return { labels: days, data: counts };
}
