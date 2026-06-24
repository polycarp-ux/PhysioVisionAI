// ─── Rep Counter Logic ────────────────────────────────────────────────────────

type Phase = 'up' | 'down' | 'neutral';

export class RepCounter {
  private phase: Phase = 'neutral';
  private repCount: number = 0;
  private exerciseId: string;

  constructor(exerciseId: string) {
    this.exerciseId = exerciseId;
  }

  // ─── Count reps based on joint angles ──────────────────────────────────────
  update(angles: Record<string, number>): number {
    const angle = this.getPrimaryAngle(angles);
    if (angle === null) return this.repCount;

    const { upThreshold, downThreshold } = this.getThresholds();

    // --- TRACK CONFIGURATION TYPE A: FLEXION IS THE EFFORT PHASE ---
    // (Squats, Lunges, Push-ups, Bicep Curls, Shoulder Press)
    // High Angle = Up/Extended. Low Angle = Down/Flexed.
    if (
      this.exerciseId === 'squat' || 
      this.exerciseId === 'lunge' || 
      this.exerciseId === 'push_up' || 
      this.exerciseId === 'bicep_curl' ||
      this.exerciseId === 'shoulder_press'
    ) {
      if (angle > upThreshold && this.phase !== 'up') {
        this.phase = 'up';
      } else if (angle < downThreshold && this.phase === 'up') {
        this.phase = 'down';
        this.repCount += 1; // Count rep as they hit deep contraction depth
      }
    } 
    
    // --- TRACK CONFIGURATION TYPE B: EXTENSION IS THE EFFORT PHASE ---
    // (Deadlift, Glute Bridge, Plank)
    // Low Angle = Hips bent/resting. High Angle = Lockout/Straight line.
    else {
      if (angle < downThreshold && this.phase !== 'down') {
        this.phase = 'down';
      } else if (angle > upThreshold && this.phase === 'down') {
        this.phase = 'up';
        this.repCount += 1; // Count rep upon full muscular lockout extension
      }
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

  // ─── Get the main angle to track per exercise (Matched to analysis.tsx IDs) ───
  private getPrimaryAngle(angles: Record<string, number>): number | null {
    switch (this.exerciseId) {
      case 'squat':
      case 'lunge':
      case 'glute_bridge':
        return angles.leftKnee || angles.rightKnee || null;
      case 'push_up':
      case 'bicep_curl':
      case 'shoulder_press':
        return angles.leftElbow || angles.rightElbow || null;
      case 'deadlift':
      case 'plank':
        return angles.leftHip || angles.rightHip || null;
      default:
        return angles.leftKnee || angles.leftElbow || null;
    }
  }

  // ─── Up/Down thresholds per exercise ───────────────────────────────────────
  private getThresholds(): { upThreshold: number; downThreshold: number } {
    switch (this.exerciseId) {
      case 'squat':
        return { upThreshold: 160, downThreshold: 110 };
      case 'lunge':
        return { upThreshold: 160, downThreshold: 110 };
      case 'push_up':
        return { upThreshold: 160, downThreshold: 90 };
      case 'bicep_curl':
        return { upThreshold: 140, downThreshold: 60 };
      case 'shoulder_press':
        return { upThreshold: 160, downThreshold: 90 };
      case 'deadlift':
        return { upThreshold: 160, downThreshold: 90 };
      case 'glute_bridge':
        return { upThreshold: 150, downThreshold: 100 };
      case 'plank':
        return { upThreshold: 170, downThreshold: 140 };
      default:
        return { upThreshold: 160, downThreshold: 90 };
    }
  }
}