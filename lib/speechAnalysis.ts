import { FILLER_WORDS_EN, FILLER_WORDS_ID, SpeechMetrics } from "@/types";

// Calculate WPM from transcript and duration in seconds
export function calculateWPM(transcript: string, durationSeconds: number): number {
  if (durationSeconds === 0) return 0;
  const words = transcript.trim().split(/\s+/).filter(Boolean);
  return Math.round((words.length / durationSeconds) * 60);
}

// Detect filler words in transcript
export function detectFillerWords(
  transcript: string,
  language: "id" | "en"
): Record<string, number> {
  const fillers = language === "id" ? FILLER_WORDS_ID : FILLER_WORDS_EN;
  const lower = transcript.toLowerCase();
  const result: Record<string, number> = {};

  for (const filler of fillers) {
    const regex = new RegExp(`\\b${filler}\\b`, "gi");
    const matches = lower.match(regex);
    if (matches && matches.length > 0) {
      result[filler] = matches.length;
    }
  }

  return result;
}

// Calculate fluency score (0-100)
// Based on: pause patterns, filler density, word rate consistency
export function calculateFluencyScore(
  transcript: string,
  wpm: number,
  fillerWords: Record<string, number>
): number {
  if (!transcript.trim()) return 0;

  const wordCount = transcript.trim().split(/\s+/).filter(Boolean).length;
  if (wordCount === 0) return 0;

  const totalFillers = Object.values(fillerWords).reduce((a, b) => a + b, 0);
  const fillerRatio = totalFillers / wordCount;

  // WPM score (ideal 120-160)
  let wpmScore = 100;
  if (wpm < 80) wpmScore = 30;
  else if (wpm < 100) wpmScore = 55;
  else if (wpm < 120) wpmScore = 75;
  else if (wpm <= 160) wpmScore = 100;
  else if (wpm <= 180) wpmScore = 75;
  else wpmScore = 40;

  // Filler penalty
  let fillerPenalty = 0;
  if (fillerRatio > 0.15) fillerPenalty = 40;
  else if (fillerRatio > 0.10) fillerPenalty = 25;
  else if (fillerRatio > 0.05) fillerPenalty = 15;
  else if (fillerRatio > 0.02) fillerPenalty = 5;

  // Word count bonus (longer = more confident)
  let lengthBonus = 0;
  if (wordCount >= 50) lengthBonus = 10;
  else if (wordCount >= 30) lengthBonus = 5;

  const score = Math.min(100, Math.max(0, wpmScore - fillerPenalty + lengthBonus));
  return Math.round(score);
}

// Calculate points earned for a session
export function calculatePoints(
  overallScore: number,
  avgWPM: number,
  avgEyeContact: number,
  genuineSmileCount: number,
  avgFluency: number,
  difficulty: "easy" | "medium" | "hard",
  completed: boolean
): number {
  let points = 0;

  // Overall score (max 50)
  points += Math.round(overallScore / 2);

  // WPM ideal (max 15)
  if (avgWPM >= 120 && avgWPM <= 160) points += 15;
  else if (avgWPM >= 100 && avgWPM < 120) points += 8;
  else if (avgWPM > 160 && avgWPM <= 180) points += 8;

  // Eye contact ideal 70-80% (max 15)
  if (avgEyeContact >= 70 && avgEyeContact <= 80) points += 15;
  else if (avgEyeContact >= 60 && avgEyeContact < 70) points += 8;
  else if (avgEyeContact > 80 && avgEyeContact <= 90) points += 8;

  // Genuine smile (max 10)
  points += Math.min(10, genuineSmileCount * 2);

  // Fluency (max 10)
  points += Math.round(avgFluency / 10);

  // Completion bonus
  if (completed) points += 10;

  // High score bonus
  if (overallScore >= 90) points += 15;

  // Difficulty multiplier
  if (difficulty === "hard") points = Math.round(points * 1.5);
  else if (difficulty === "medium") points = Math.round(points * 1.2);

  return points;
}

// Calculate overall session score (0-100)
export function calculateOverallScore(
  avgWPM: number,
  avgEyeContact: number,
  avgFluency: number,
  genuineSmileCount: number,
  fakeSmileCount: number
): number {
  // WPM score
  let wpmScore = 100;
  if (avgWPM < 100) wpmScore = 40;
  else if (avgWPM < 120) wpmScore = 70;
  else if (avgWPM <= 160) wpmScore = 100;
  else if (avgWPM <= 180) wpmScore = 70;
  else wpmScore = 40;

  // Eye contact score
  let eyeScore = 100;
  if (avgEyeContact < 50) eyeScore = 30;
  else if (avgEyeContact < 70) eyeScore = 65;
  else if (avgEyeContact <= 80) eyeScore = 100;
  else if (avgEyeContact <= 90) eyeScore = 75;
  else eyeScore = 50;

  // Smile score
  const totalSmiles = genuineSmileCount + fakeSmileCount;
  const smileScore = totalSmiles === 0
    ? 70
    : Math.min(100, (genuineSmileCount / totalSmiles) * 100);

  // Weighted average
  const overall =
    wpmScore * 0.25 +
    avgFluency * 0.35 +
    eyeScore * 0.25 +
    smileScore * 0.15;

  return Math.round(overall);
}

// Get WPM feedback label
export function getWPMLabel(wpm: number): { label: string; color: string } {
  if (wpm < 100) return { label: "Terlalu Lambat", color: "#D4730A" };
  if (wpm < 120) return { label: "Agak Lambat", color: "#D4730A" };
  if (wpm <= 160) return { label: "Ideal ✓", color: "#2D6A4F" };
  if (wpm <= 180) return { label: "Agak Cepat", color: "#D4730A" };
  return { label: "Terlalu Cepat", color: "#C0392B" };
}

// Get eye contact feedback label
export function getEyeContactLabel(percent: number): { label: string; color: string } {
  if (percent < 50) return { label: "Sangat Kurang", color: "#C0392B" };
  if (percent < 70) return { label: "Gugup", color: "#D4730A" };
  if (percent <= 80) return { label: "Ideal ✓", color: "#2D6A4F" };
  if (percent <= 90) return { label: "Cukup Intens", color: "#D4730A" };
  return { label: "Terlalu Intens", color: "#C0392B" };
}
