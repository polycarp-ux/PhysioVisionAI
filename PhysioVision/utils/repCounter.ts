type Phase = 'extended' | 'contracted' | 'neutral';

type ExerciseConfig = {
  primaryAngle: 'knee' | 'elbow' | 'hip';
  contractedAt: number;
  extendedAt: number;
  movement: 'flexion' | 'extension';
  targetText: string;
};

const CONFIGS: Record<string, ExerciseConfig> = {
  squat: {
    primaryAngle: 'knee',
    contractedAt: 110,
    extendedAt: 160,
    movement: 'flexion',
    targetText: 'Reach 110° knee angle or lower, then return above 160°.',
  },
  lunge: {
    primaryAngle: 'knee',
    contractedAt: 110,
    extendedAt: 160,
    movement: 'flexion',
    targetText: 'Reach about 90–110° knee angle, then stand above 160°.',
  },
  push_up: {
    primaryAngle: 'elbow',
    contractedAt: 95,
    extendedAt: 160,
    movement: 'flexion',
    targetText: 'Lower until the elbow reaches about 90°, then extend above 160°.',
  },
  bicep_curl: {
    primaryAngle: 'elbow',
    contractedAt: 65,
    extendedAt: 145,
    movement: 'flexion',
    targetText: 'Curl to 65° or less, then extend the elbow above 145°.',
  },
  shoulder_press: {
    primaryAngle: 'elbow',
    contractedAt: 95,
    extendedAt: 160,
    movement: 'flexion',
    targetText: 'Lower to about 95°, then press until the elbow is above 160°.',
  },
  deadlift: {
    primaryAngle: 'hip',
    contractedAt: 100,
    extendedAt: 160,
    movement: 'extension',
    targetText: 'Hinge to about 100° hip angle, then return above 160°.',
  },
  glute_bridge: {
    primaryAngle: 'knee',
    contractedAt: 110,
    extendedAt: 160,
    movement: 'flexion',
    targetText: 'Bend the knees to about 110°, then return above 160°.',
  },
  sit_to_stand: {
    primaryAngle: 'knee',
    contractedAt: 115,
    extendedAt: 160,
    movement: 'flexion',
    targetText: 'Reach about 115° knee angle while seated, then stand above 160°.',
  },
  plank: {
    primaryAngle: 'hip',
    contractedAt: 145,
    extendedAt: 170,
    movement: 'extension',
    targetText: 'Hold a straight body line between 145° and 195°.',
  },
};

function normalizeExerciseId(exerciseId: string): string {
  const normalized = exerciseId.toLowerCase().replace(/-/g, '_');
  const aliases: Record<string, string> = {
    squats: 'squat',
    lunges: 'lunge',
    pushups: 'push_up',
    push_ups: 'push_up',
    bicep_curls: 'bicep_curl',
  };
  return aliases[normalized] || normalized;
}

export function getExerciseTarget(exerciseId: string): string {
  return (
    CONFIGS[normalizeExerciseId(exerciseId)]?.targetText ||
    'Complete a controlled range of motion before the repetition counts.'
  );
}

export function isAngleInTargetRange(exerciseId: string, angle: number): boolean {
  const config = CONFIGS[normalizeExerciseId(exerciseId)];
  if (!config) return true;
  if (normalizeExerciseId(exerciseId) === 'plank') {
    return angle >= config.contractedAt && angle <= 195;
  }
  return angle <= config.contractedAt || angle >= config.extendedAt;
}

export class RepCounter {
  private phase: Phase = 'neutral';
  private repCount = 0;
  private readonly config: ExerciseConfig;

  constructor(exerciseId: string) {
    const normalizedId = normalizeExerciseId(exerciseId);
    this.config = CONFIGS[normalizedId] || CONFIGS.squat;
  }

  update(angles: Record<string, number>): number {
    const angle = angles[`${this.config.primaryAngle === 'knee' ? 'leftKnee' : this.config.primaryAngle === 'elbow' ? 'leftElbow' : 'leftHip'}`]
      ?? angles[`${this.config.primaryAngle === 'knee' ? 'rightKnee' : this.config.primaryAngle === 'elbow' ? 'rightElbow' : 'rightHip'}`];

    if (typeof angle !== 'number' || !Number.isFinite(angle)) {
      return this.repCount;
    }

    if (this.config.movement === 'flexion') {
      if (angle >= this.config.extendedAt) {
        this.phase = 'extended';
      } else if (angle <= this.config.contractedAt && this.phase === 'extended') {
        this.phase = 'contracted';
        this.repCount += 1;
      }
    } else if (angle <= this.config.contractedAt) {
      this.phase = 'contracted';
    } else if (angle >= this.config.extendedAt && this.phase === 'contracted') {
      this.phase = 'extended';
      this.repCount += 1;
    }

    return this.repCount;
  }

  reset() {
    this.phase = 'neutral';
    this.repCount = 0;
  }

  getCount(): number {
    return this.repCount;
  }
}
