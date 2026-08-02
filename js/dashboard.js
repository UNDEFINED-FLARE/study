// ============================================================================
// StudyHub — Student dashboard aggregation
// ============================================================================

import { db } from "./firebase-config.js";
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

export async function fetchStudentResults(userId) {
  const q = query(collection(db, "results"), where("user_id", "==", userId), orderBy("completed_at", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function fetchStudentActivity(userId, max = 30) {
  const q = query(
    collection(db, "activity_logs"),
    where("user_id", "==", userId),
    orderBy("created_at", "desc"),
    limit(max)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export function computeStudentStats(results) {
  const totalQuizzes = results.length;
  const avgScore = totalQuizzes
    ? Math.round(results.reduce((sum, r) => sum + (r.percentage || 0), 0) / totalQuizzes)
    : 0;
  return { totalQuizzes, avgScore };
}

/** Buckets results + activity into the last 7 days for a "weekly activity" bar chart. */
export function weeklyActivity(results, activity) {
  const days = [];
  const counts = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const label = d.toLocaleDateString(undefined, { weekday: "short" });
    const dayStart = new Date(d.setHours(0, 0, 0, 0)).getTime();
    const dayEnd = dayStart + 24 * 60 * 60 * 1000;

    const count =
      results.filter((r) => inRange(r.completed_at, dayStart, dayEnd)).length +
      activity.filter((a) => inRange(a.created_at, dayStart, dayEnd)).length;

    days.push(label);
    counts.push(count);
  }
  return { labels: days, data: counts };
}

function inRange(timestamp, start, end) {
  if (!timestamp?.toDate) return false;
  const t = timestamp.toDate().getTime();
  return t >= start && t < end;
}

/** Last N quiz percentages, oldest to newest, for a line chart. */
export function quizPerformanceSeries(results, n = 8) {
  const recent = [...results].reverse().slice(-n);
  return {
    labels: recent.map((r, i) => `#${i + 1}`),
    data: recent.map((r) => r.percentage || 0),
  };
}
