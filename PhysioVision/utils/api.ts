// ─── Backend API Connection ───────────────────────────────────────────────────
// Updated dynamically to match your active local IP address
const BACKEND_URL = 'http://10.133.167.45:8000';

export async function checkBackendOnline(): Promise<boolean> {
  try {
    const response = await fetch(`${BACKEND_URL}/`, { method: 'GET' });
    const data = await response.json();
    return data.status === 'online';
  } catch {
    return false;
  }
}

// Explicit interface for the data structures returned by the backend
export interface AnalyzeFrameResult {
  feedback: string;
  angle: number | null;
  angles?: Record<string, number>;
  landmarks?: Array<{
    x: number;
    y: number;
    z: number;
    visibility?: number;
  }>;
  symmetry?: {
    shoulder: number;
    hip: number;
  };
}

export async function analyzeFrame(
  base64Image: string,
  exerciseType: string
): Promise<AnalyzeFrameResult> {
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
    
    // Explicitly return landmarks alongside your text metrics
    return { 
      feedback: data.feedback, 
      angle: data.angle,
      angles: data.angles || {},
      landmarks: data.landmarks || [],
      symmetry: data.symmetry || {}
    };
  } catch (error) {
    return { 
      feedback: 'Cannot reach backend. Check your connection.', 
      angle: null,
      landmarks: []
    };
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