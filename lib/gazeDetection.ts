// Gaze detection using MediaPipe FaceMesh iris landmarks
// Detects whether user is looking at the camera (center of screen)

const IRIS_LEFT_CENTER = 468;
const IRIS_RIGHT_CENTER = 473;
const LEFT_EYE_LEFT = 33;
const LEFT_EYE_RIGHT = 133;
const RIGHT_EYE_LEFT = 362;
const RIGHT_EYE_RIGHT = 263;
const NOSE_TIP = 1;
const CHIN = 152;
const LEFT_EAR = 234;
const RIGHT_EAR = 454;

export interface GazeResult {
  isLookingAtCamera: boolean;
  gazeX: number; // -1 (left) to 1 (right)
  gazeY: number; // -1 (up) to 1 (down)
  headYaw: number; // degrees, negative = left
  headPitch: number; // degrees, negative = up
}

// Calculate normalized iris position within eye
function getIrisPosition(
  landmarks: { x: number; y: number; z: number }[],
  irisIdx: number,
  eyeLeftIdx: number,
  eyeRightIdx: number
): number {
  const iris = landmarks[irisIdx];
  const eyeLeft = landmarks[eyeLeftIdx];
  const eyeRight = landmarks[eyeRightIdx];
  const eyeWidth = eyeRight.x - eyeLeft.x;
  if (eyeWidth === 0) return 0.5;
  return (iris.x - eyeLeft.x) / eyeWidth; // 0 = far left, 1 = far right
}

// Estimate head pose from face landmarks
function estimateHeadPose(
  landmarks: { x: number; y: number; z: number }[]
): { yaw: number; pitch: number } {
  const noseTip = landmarks[NOSE_TIP];
  const leftEar = landmarks[LEFT_EAR];
  const rightEar = landmarks[RIGHT_EAR];
  const chin = landmarks[CHIN];

  // Yaw: asymmetry between ears and nose
  const faceCenter = (leftEar.x + rightEar.x) / 2;
  const yaw = (noseTip.x - faceCenter) / (rightEar.x - leftEar.x) * 90;

  // Pitch: nose vs chin relative vertical position (simplified)
  const pitch = (noseTip.y - chin.y) * 180;

  return { yaw, pitch: Math.max(-45, Math.min(45, pitch)) };
}

// Main gaze detection function
export function detectGaze(
  landmarks: { x: number; y: number; z: number }[],
  hasIrisLandmarks = true
): GazeResult {
  if (!landmarks || landmarks.length < 400) {
    return { isLookingAtCamera: false, gazeX: 0, gazeY: 0, headYaw: 0, headPitch: 0 };
  }

  // Head pose
  const { yaw, pitch } = estimateHeadPose(landmarks);

  // If head is turned too much, definitely not looking at camera
  if (Math.abs(yaw) > 25 || Math.abs(pitch) > 20) {
    return {
      isLookingAtCamera: false,
      gazeX: yaw / 45,
      gazeY: pitch / 45,
      headYaw: yaw,
      headPitch: pitch,
    };
  }

  // Iris-based gaze (if available — requires MediaPipe with iris)
  let gazeX = 0;
  let gazeY = 0;

  if (hasIrisLandmarks && landmarks.length >= 477) {
    const leftIrisPos = getIrisPosition(
      landmarks, IRIS_LEFT_CENTER, LEFT_EYE_LEFT, LEFT_EYE_RIGHT
    );
    const rightIrisPos = getIrisPosition(
      landmarks, IRIS_RIGHT_CENTER, RIGHT_EYE_LEFT, RIGHT_EYE_RIGHT
    );
    const avgIrisPos = (leftIrisPos + rightIrisPos) / 2;

    // Center position is ~0.5, normalize to -1...1
    gazeX = (avgIrisPos - 0.5) * 2;
  } else {
    gazeX = yaw / 25;
  }

  // Looking at camera: iris centered + head roughly forward
  const isLookingAtCamera =
    Math.abs(gazeX) < 0.4 &&
    Math.abs(yaw) < 20 &&
    Math.abs(pitch) < 15;

  return {
    isLookingAtCamera,
    gazeX,
    gazeY,
    headYaw: yaw,
    headPitch: pitch,
  };
}

// Track eye contact percentage over a session
export class EyeContactTracker {
  private totalFrames = 0;
  private contactFrames = 0;

  update(gazeResult: GazeResult): void {
    this.totalFrames++;
    if (gazeResult.isLookingAtCamera) this.contactFrames++;
  }

  getPercentage(): number {
    if (this.totalFrames === 0) return 0;
    return Math.round((this.contactFrames / this.totalFrames) * 100);
  }

  reset(): void {
    this.totalFrames = 0;
    this.contactFrames = 0;
  }
}

// Head stability tracker
export class HeadStabilityTracker {
  private totalFrames = 0;
  private stableFrames = 0;

  update(yaw: number, pitch: number): void {
    this.totalFrames++;
    if (Math.abs(yaw) < 15 && Math.abs(pitch) < 10) this.stableFrames++;
  }

  getPercentage(): number {
    if (this.totalFrames === 0) return 0;
    return Math.round((this.stableFrames / this.totalFrames) * 100);
  }

  reset(): void {
    this.totalFrames = 0;
    this.stableFrames = 0;
  }
}
