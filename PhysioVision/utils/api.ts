import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

const manifestHost = Constants.expoConfig?.hostUri?.split(':')[0];
const configuredBackendUrl = process.env.EXPO_PUBLIC_API_URL?.trim();

export const BACKEND_URL =
  configuredBackendUrl ||
  (manifestHost ? `http://${manifestHost}:8000` : 'http://localhost:8000');

// Keep this false when Firebase users and exercise records must be persisted.
export const DEMO_AUTH_ENABLED = process.env.EXPO_PUBLIC_DEMO_AUTH === 'true';

const AUTH_TOKEN_KEY = 'firebase_id_token';
const DEMO_USER_KEY = 'demo_auth_user';
const USER_KEY = 'signed_in_user';

async function fetchWithTimeout(
  input: RequestInfo | URL,
  init: RequestInit = {},
  timeoutMs = 10000,
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(
        `Backend request timed out at ${BACKEND_URL}. Check that the backend is running and reachable.`,
      );
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);

  return token
    ? { Authorization: `Bearer ${token}` }
    : {};
}

export async function checkBackendOnline(): Promise<boolean> {
  try {
    const response = await fetchWithTimeout(`${BACKEND_URL}/`, {}, 5000);
    const data = await response.json();

    return response.ok && data.status === 'online';
  } catch {
    return false;
  }
}

export interface AuthUser {
  uid: string;
  email: string | null;
  display_name?: string | null;
}

export async function register(
  email: string,
  password: string,
  displayName: string
): Promise<AuthUser> {
  if (DEMO_AUTH_ENABLED) {
    const user: AuthUser = {
      uid: `demo-${email.trim().toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
      email: email.trim(),
      display_name: displayName.trim() || email.trim(),
    };
    await AsyncStorage.setItem(AUTH_TOKEN_KEY, `demo-token-${user.uid}`);
    await AsyncStorage.setItem(DEMO_USER_KEY, JSON.stringify(user));
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
    return user;
  }

  const response = await fetchWithTimeout(`${BACKEND_URL}/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      password,
      display_name: displayName,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || 'Registration failed');
  }

  await AsyncStorage.setItem(AUTH_TOKEN_KEY, data.id_token);
  await AsyncStorage.setItem(USER_KEY, JSON.stringify(data.user));

  return data.user;
}

export async function login(
  email: string,
  password: string
): Promise<AuthUser> {
  if (DEMO_AUTH_ENABLED) {
    const normalizedEmail = email.trim().toLowerCase();
    const user: AuthUser = {
      uid: `demo-${normalizedEmail.replace(/[^a-z0-9]/g, '-')}`,
      email: normalizedEmail,
      display_name: normalizedEmail.split('@')[0],
    };
    await AsyncStorage.setItem(AUTH_TOKEN_KEY, `demo-token-${user.uid}`);
    await AsyncStorage.setItem(DEMO_USER_KEY, JSON.stringify(user));
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
    return user;
  }

  const response = await fetchWithTimeout(`${BACKEND_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      password,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || 'Login failed');
  }

  await AsyncStorage.setItem(AUTH_TOKEN_KEY, data.id_token);
  await AsyncStorage.setItem(USER_KEY, JSON.stringify(data.user));

  return data.user;
}

export async function logout(): Promise<void> {
  await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
  await AsyncStorage.removeItem(DEMO_USER_KEY);
  await AsyncStorage.removeItem(USER_KEY);
}

export async function getStoredToken(): Promise<string | null> {
  return AsyncStorage.getItem(AUTH_TOKEN_KEY);
}

export async function getStoredUser(): Promise<AuthUser | null> {
  const value = await AsyncStorage.getItem(USER_KEY);
  if (!value) return null;
  try {
    return JSON.parse(value) as AuthUser;
  } catch {
    await AsyncStorage.removeItem(USER_KEY);
    return null;
  }
}

export interface Landmark {
  x: number;
  y: number;
  z: number;
  x_px?: number;
  y_px?: number;
  visibility?: number;
}

export interface AnalyzeFrameResult {
  feedback: string;
  angle: number | null;
  reps?: number;
  angles?: Record<string, number>;
  landmarks?: Landmark[];
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
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image: base64Image,
        exercise_type: exerciseType,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || 'Frame analysis failed');
    }

    return {
      feedback: data.feedback,
      angle: data.angle ?? null,
      reps: data.reps,
      angles: data.angles || {},
      landmarks: data.landmarks || [],
      symmetry: data.symmetry || {},
    };
  } catch (error) {
    console.error('Frame analysis error:', error);

    return {
      feedback: 'Cannot reach backend. Check your connection.',
      angle: null,
      landmarks: [],
      angles: {},
    };
  }
}

export interface SessionPayload {
  user_id: string;
  user_email?: string | null;
  user_name?: string | null;
  exercise_id: string;
  exercise_name: string;
  reps: number;
  duration: number;
  accuracy_score: number;
}

export interface SaveSessionResponse {
  status: 'success' | 'error';
  id?: string;
  path?: string;
  message?: string;
}

export async function saveExerciseSession(
  payload: SessionPayload
): Promise<SaveSessionResponse> {
  try {
    const authHeaders = await getAuthHeaders();

    const response = await fetch(`${BACKEND_URL}/api/save-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        status: 'error',
        message: data.detail || 'Failed to save exercise session',
      };
    }

    return data;
  } catch (error) {
    console.error('Failed to save session:', error);

    return {
      status: 'error',
      message: 'Failed to connect to backend.',
    };
  }
}

export async function getExerciseSessions(userId: string): Promise<Array<{
  id: string;
  exercise_id: string;
  exercise_name: string;
  reps: number;
  duration_seconds: number;
  accuracy_score: number;
  created_at?: string;
}>> {
  const response = await fetchWithTimeout(
    `${BACKEND_URL}/api/sessions/${encodeURIComponent(userId)}`,
    { headers: await getAuthHeaders() },
    10000,
  );
  const data = await response.json();
  if (!response.ok) throw new Error(data.detail || 'Failed to load sessions');
  return Array.isArray(data.sessions) ? data.sessions : [];
}

export function getBackendExerciseName(exerciseId: string): string {
  const map: Record<string, string> = {
    squats: 'squat',
    squat: 'squat',
    lunges: 'lunge',
    lunge: 'lunge',
    glute_bridge: 'glute_bridge',
    sit_to_stand: 'sit_to_stand',
    bicep_curls: 'bicep_curl',
    bicep_curl: 'bicep_curl',
    shoulder_press: 'shoulder_press',
    pushups: 'pushups',
    push_ups: 'pushups',
    deadlift: 'deadlift',
    plank: 'plank',
  };

  return map[exerciseId] || exerciseId;
}