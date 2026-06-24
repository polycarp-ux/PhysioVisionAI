// ─── Joint Angle Calculator ───────────────────────────────────────────────────
export function calculateAngle(
  pointA: { x: number; y: number },
  pointB: { x: number; y: number },
  pointC: { x: number; y: number }
): number {
  const radians =
    Math.atan2(pointC.y - pointB.y, pointC.x - pointB.x) -
    Math.atan2(pointA.y - pointB.y, pointA.x - pointB.x);
  let angle = Math.abs((radians * 180.0) / Math.PI);
  if (angle > 180) angle = 360 - angle;
  return Math.round(angle);
}

// ─── Keypoint Names (MoveNet 17 points) ──────────────────────────────────────
export const KEYPOINTS = {
  NOSE: 0,
  LEFT_EYE: 1,
  RIGHT_EYE: 2,
  LEFT_EAR: 3,
  RIGHT_EAR: 4,
  LEFT_SHOULDER: 5,
  RIGHT_SHOULDER: 6,
  LEFT_ELBOW: 7,
  RIGHT_ELBOW: 8,
  LEFT_WRIST: 9,
  RIGHT_WRIST: 10,
  LEFT_HIP: 11,
  RIGHT_HIP: 12,
  LEFT_KNEE: 13,
  RIGHT_KNEE: 14,
  LEFT_ANKLE: 15,
  RIGHT_ANKLE: 16,
};

// ─── Exercise Form Rules ──────────────────────────────────────────────────────
export const EXERCISE_RULES: Record<string, {
  checkForm: (angles: Record<string, number>) => { isCorrect: boolean; feedback: string; score: number };
}> = {
  squats: {
    checkForm: (angles) => {
      const kneeAngle = angles.leftKnee || angles.rightKnee || 180;
      if (kneeAngle > 160) return { isCorrect: false, feedback: 'Go lower! Bend your knees more.', score: 60 };
      if (kneeAngle < 70) return { isCorrect: false, feedback: 'Too deep! Come up slightly.', score: 65 };
      if (kneeAngle >= 80 && kneeAngle <= 110) return { isCorrect: true, feedback: 'Perfect squat depth! Great form!', score: 100 };
      return { isCorrect: true, feedback: 'Good squat! Keep going.', score: 85 };
    },
  },
  lunges: {
    checkForm: (angles) => {
      const kneeAngle = angles.leftKnee || angles.rightKnee || 180;
      if (kneeAngle > 150) return { isCorrect: false, feedback: 'Bend your front knee more!', score: 60 };
      if (kneeAngle >= 80 && kneeAngle <= 100) return { isCorrect: true, feedback: 'Perfect lunge angle!', score: 100 };
      return { isCorrect: true, feedback: 'Good lunge! Keep your torso upright.', score: 85 };
    },
  },
  pushups: {
    checkForm: (angles) => {
      const elbowAngle = angles.leftElbow || angles.rightElbow || 180;
      if (elbowAngle > 160) return { isCorrect: false, feedback: 'Lower your chest to the floor!', score: 60 };
      if (elbowAngle >= 80 && elbowAngle <= 100) return { isCorrect: true, feedback: 'Perfect push-up depth!', score: 100 };
      return { isCorrect: true, feedback: 'Good push-up! Keep your body straight.', score: 85 };
    },
  },
  bicep_curls: {
    checkForm: (angles) => {
      const elbowAngle = angles.leftElbow || angles.rightElbow || 180;
      if (elbowAngle > 150) return { isCorrect: false, feedback: 'Curl the weight higher!', score: 65 };
      if (elbowAngle < 30) return { isCorrect: false, feedback: 'Lower the weight for full range!', score: 65 };
      if (elbowAngle >= 40 && elbowAngle <= 70) return { isCorrect: true, feedback: 'Perfect curl! Great bicep activation!', score: 100 };
      return { isCorrect: true, feedback: 'Good curl! Keep elbows close to body.', score: 85 };
    },
  },
  shoulder_press: {
    checkForm: (angles) => {
      const elbowAngle = angles.leftElbow || angles.rightElbow || 180;
      if (elbowAngle < 70) return { isCorrect: false, feedback: 'Press the weight fully overhead!', score: 65 };
      if (elbowAngle >= 160) return { isCorrect: true, feedback: 'Perfect overhead press!', score: 100 };
      return { isCorrect: true, feedback: 'Good press! Keep your core tight.', score: 85 };
    },
  },
  deadlift: {
    checkForm: (angles) => {
      const hipAngle = angles.leftHip || angles.rightHip || 180;
      if (hipAngle < 70) return { isCorrect: false, feedback: 'Keep your back flatter!', score: 55 };
      if (hipAngle >= 160) return { isCorrect: true, feedback: 'Perfect lockout position!', score: 100 };
      return { isCorrect: true, feedback: 'Good deadlift! Drive your hips forward.', score: 85 };
    },
  },
  plank: {
    checkForm: (angles) => {
      const hipAngle = angles.leftHip || angles.rightHip || 180;
      if (hipAngle < 150) return { isCorrect: false, feedback: 'Raise your hips! Keep body straight.', score: 60 };
      if (hipAngle > 200) return { isCorrect: false, feedback: 'Lower your hips! Do not pike up.', score: 60 };
      if (hipAngle >= 165 && hipAngle <= 185) return { isCorrect: true, feedback: 'Perfect plank position!', score: 100 };
      return { isCorrect: true, feedback: 'Good plank! Squeeze your core.', score: 85 };
    },
  },
  glute_bridge: {
    checkForm: (angles) => {
      const kneeAngle = angles.leftKnee || angles.rightKnee || 180;
      if (kneeAngle > 120) return { isCorrect: false, feedback: 'Drive your hips higher!', score: 65 };
      if (kneeAngle >= 80 && kneeAngle <= 100) return { isCorrect: true, feedback: 'Perfect bridge! Squeeze those glutes!', score: 100 };
      return { isCorrect: true, feedback: 'Good bridge! Hold at the top.', score: 85 };
    },
  },
};

// ─── Calculate All Joint Angles from Keypoints ────────────────────────────────
export function calculateAllAngles(
  keypoints: Array<{ x: number; y: number; score?: number }>
): Record<string, number> {
  const kp = keypoints;
  const angles: Record<string, number> = {};
  const isValid = (idx: number) => kp[idx] && (kp[idx].score || 0) > 0.3;

  if (isValid(KEYPOINTS.LEFT_HIP) && isValid(KEYPOINTS.LEFT_KNEE) && isValid(KEYPOINTS.LEFT_ANKLE))
    angles.leftKnee = calculateAngle(kp[KEYPOINTS.LEFT_HIP], kp[KEYPOINTS.LEFT_KNEE], kp[KEYPOINTS.LEFT_ANKLE]);

  if (isValid(KEYPOINTS.RIGHT_HIP) && isValid(KEYPOINTS.RIGHT_KNEE) && isValid(KEYPOINTS.RIGHT_ANKLE))
    angles.rightKnee = calculateAngle(kp[KEYPOINTS.RIGHT_HIP], kp[KEYPOINTS.RIGHT_KNEE], kp[KEYPOINTS.RIGHT_ANKLE]);

  if (isValid(KEYPOINTS.LEFT_SHOULDER) && isValid(KEYPOINTS.LEFT_ELBOW) && isValid(KEYPOINTS.LEFT_WRIST))
    angles.leftElbow = calculateAngle(kp[KEYPOINTS.LEFT_SHOULDER], kp[KEYPOINTS.LEFT_ELBOW], kp[KEYPOINTS.LEFT_WRIST]);

  if (isValid(KEYPOINTS.RIGHT_SHOULDER) && isValid(KEYPOINTS.RIGHT_ELBOW) && isValid(KEYPOINTS.RIGHT_WRIST))
    angles.rightElbow = calculateAngle(kp[KEYPOINTS.RIGHT_SHOULDER], kp[KEYPOINTS.RIGHT_ELBOW], kp[KEYPOINTS.RIGHT_WRIST]);

  if (isValid(KEYPOINTS.LEFT_SHOULDER) && isValid(KEYPOINTS.LEFT_HIP) && isValid(KEYPOINTS.LEFT_KNEE))
    angles.leftHip = calculateAngle(kp[KEYPOINTS.LEFT_SHOULDER], kp[KEYPOINTS.LEFT_HIP], kp[KEYPOINTS.LEFT_KNEE]);

  if (isValid(KEYPOINTS.RIGHT_SHOULDER) && isValid(KEYPOINTS.RIGHT_HIP) && isValid(KEYPOINTS.RIGHT_KNEE))
    angles.rightHip = calculateAngle(kp[KEYPOINTS.RIGHT_SHOULDER], kp[KEYPOINTS.RIGHT_HIP], kp[KEYPOINTS.RIGHT_KNEE]);

  return angles;
}