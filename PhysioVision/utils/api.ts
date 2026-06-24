// ─── Backend API Connection ───────────────────────────────────────────────────
const BACKEND_URL = 'http://10.132.169.62:8000';

export async function checkBackendOnline(): Promise<boolean> {
  try {
    const response = await fetch(`${BACKEND_URL}/`, { method: 'GET' });
    const data = await response.json();
    return data.status === 'online';
  } catch {
    return false;
  }
}

export async function analyzeFrame(
  base64Image: string,
  exerciseType: string
): Promise<{ feedback: string; angle: number | null }> {
  try {
    const response = await fetch(`${BACKEND_URL}/analyze-frame`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image: base64Image,
        exercise_type: exerciseType,
      }),
    });
    const data = await response.json();
    return { feedback: data.feedback, angle: data.angle };
  } catch (error) {
    return { feedback: 'Cannot reach backend. Check your connection.', angle: null };
  }
}

// ─── Map exercise IDs to backend exercise names ───────────────────────────────
export function getBackendExerciseName(exerciseId: string): string {
  const map: Record<string, string> = {
    squats: 'squat',
    lunges: 'squat',
    glute_bridge: 'squat',
    bicep_curls: 'bicep_curl',
    shoulder_press: 'bicep_curl',
    pushups: 'bicep_curl',
    deadlift: 'squat',
    plank: 'squat',
  };
  return map[exerciseId] || 'squat';
}