import { SmileEvent } from "@/types";

// Landmark indices for smile detection using MediaPipe FaceMesh
// AU6 (orbicularis oculi - cheek raiser): landmarks around eye corners
// AU12 (zygomaticus major - lip corner puller): lip corners
const LANDMARKS = {
  leftEyeOuter: 33,
  rightEyeOuter: 263,
  leftEyeInner: 133,
  rightEyeInner: 362,
  leftEyeTop: 159,
  leftEyeBottom: 145,
  rightEyeTop: 386,
  rightEyeBottom: 374,
  leftMouthCorner: 61,
  rightMouthCorner: 291,
  mouthTop: 13,
  mouthBottom: 14,
  leftCheek: 116,
  rightCheek: 345,
  noseTip: 1,
};

export interface SmileState {
  isSmiling: boolean;
  smileIntensity: number; // 0-1
  au6Active: boolean; // eye involvement
  symmetry: number; // 0-1, 1 = perfect symmetry
  phase: "none" | "onset" | "apex" | "offset";
  startTime: number | null;
}

let smileHistory: number[] = []; // rolling window of smile intensities
let smilePhase: "none" | "onset" | "apex" | "offset" = "none";
let smileStartTime: number | null = null;
let apexStartTime: number | null = null;
let onsetDuration = 0;
let currentSmileEvents: SmileEvent[] = [];

// Calculate distance between two landmarks
function dist(
  landmarks: { x: number; y: number; z: number }[],
  i: number,
  j: number
): number {
  const dx = landmarks[i].x - landmarks[j].x;
  const dy = landmarks[i].y - landmarks[j].y;
  return Math.sqrt(dx * dx + dy * dy);
}

// Analyze smile from face landmarks
export function analyzeSmile(
  landmarks: { x: number; y: number; z: number }[]
): SmileState {
  if (!landmarks || landmarks.length < 400) {
    return {
      isSmiling: false,
      smileIntensity: 0,
      au6Active: false,
      symmetry: 0,
      phase: "none",
      startTime: null,
    };
  }

  // Mouth width (AU12 proxy)
  const mouthWidth = dist(landmarks, LANDMARKS.leftMouthCorner, LANDMARKS.rightMouthCorner);
  const faceWidth = dist(landmarks, LANDMARKS.leftEyeOuter, LANDMARKS.rightEyeOuter);
  const mouthRatio = mouthWidth / faceWidth;

  // Eye openness (AU6 proxy - eyes narrow when genuinely smiling)
  const leftEyeHeight = dist(landmarks, LANDMARKS.leftEyeTop, LANDMARKS.leftEyeBottom);
  const rightEyeHeight = dist(landmarks, LANDMARKS.rightEyeTop, LANDMARKS.rightEyeBottom);
  const eyeHeight = dist(landmarks, LANDMARKS.leftEyeOuter, LANDMARKS.rightEyeOuter);
  const leftEyeRatio = leftEyeHeight / eyeHeight;
  const rightEyeRatio = rightEyeHeight / eyeHeight;
  const avgEyeRatio = (leftEyeRatio + rightEyeRatio) / 2;

  // AU6 active when eyes narrow (ratio decreases)
  const au6Active = avgEyeRatio < 0.12;

  // Smile intensity based on mouth width ratio
  const smileIntensity = Math.min(1, Math.max(0, (mouthRatio - 0.38) / 0.15));
  const isSmiling = smileIntensity > 0.3;

  // Symmetry: compare left vs right mouth corner elevation
  const leftCornerY = landmarks[LANDMARKS.leftMouthCorner].y;
  const rightCornerY = landmarks[LANDMARKS.rightMouthCorner].y;
  const mouthTopY = landmarks[LANDMARKS.mouthTop].y;
  const leftElevation = mouthTopY - leftCornerY;
  const rightElevation = mouthTopY - rightCornerY;
  const maxElev = Math.max(Math.abs(leftElevation), Math.abs(rightElevation));
  const symmetry = maxElev === 0 ? 1 : 1 - Math.abs(leftElevation - rightElevation) / maxElev;

  return {
    isSmiling,
    smileIntensity,
    au6Active,
    symmetry: Math.max(0, Math.min(1, symmetry)),
    phase: smilePhase,
    startTime: smileStartTime,
  };
}

// Track smile over time and detect genuine vs fake
export function trackSmile(
  smileState: SmileState,
  completedSmiles: SmileEvent[]
): SmileEvent[] {
  const now = Date.now();
  const WINDOW_SIZE = 10;

  smileHistory.push(smileState.smileIntensity);
  if (smileHistory.length > WINDOW_SIZE) smileHistory.shift();

  const avgIntensity =
    smileHistory.reduce((a, b) => a + b, 0) / smileHistory.length;

  if (smilePhase === "none") {
    if (avgIntensity > 0.3) {
      smilePhase = "onset";
      smileStartTime = now;
    }
  } else if (smilePhase === "onset") {
    onsetDuration = smileStartTime ? now - smileStartTime : 0;
    if (avgIntensity > 0.6) {
      smilePhase = "apex";
      apexStartTime = now;
    } else if (avgIntensity < 0.15) {
      // Smile disappeared before apex — likely fake
      const event: SmileEvent = {
        type: "fake",
        onsetDuration,
        apexDuration: 0,
        offsetDuration: 0,
        timestamp: now,
      };
      completedSmiles.push(event);
      resetSmileTracking();
    }
  } else if (smilePhase === "apex") {
    if (avgIntensity < 0.35) {
      smilePhase = "offset";
    }
  } else if (smilePhase === "offset") {
    const apexDuration = apexStartTime ? now - apexStartTime : 0;
    const offsetStart = now;
    const offsetDuration = 300; // estimate

    // Determine genuine vs fake
    const genuine =
      onsetDuration > 300 &&      // gradual onset
      smileState.au6Active &&      // eyes involved
      smileState.symmetry > 0.7;  // symmetric

    const event: SmileEvent = {
      type: genuine ? "genuine" : "fake",
      onsetDuration,
      apexDuration,
      offsetDuration,
      timestamp: now,
    };
    completedSmiles.push(event);
    resetSmileTracking();
  }

  return completedSmiles;
}

function resetSmileTracking() {
  smilePhase = "none";
  smileStartTime = null;
  apexStartTime = null;
  onsetDuration = 0;
  smileHistory = [];
}

export function resetSmileSession() {
  resetSmileTracking();
  currentSmileEvents = [];
}
