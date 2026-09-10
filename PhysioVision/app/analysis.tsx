import { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Dimensions, TextStyle } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Speech from 'expo-speech';
import Svg, { Line, Circle } from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getExerciseTarget, isAngleInTargetRange, RepCounter } from '../utils/repCounter';
import { analyzeFrame, getBackendExerciseName, checkBackendOnline, saveExerciseSession, getStoredUser } from '../utils/api';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const EXERCISE_CATEGORIES: Record<string, Array<{ id: string; name: string; icon: string; color: string }>> = {
  general: [
    { id: 'squats', name: 'Squats', icon: 'body', color: '#00d4aa' },
    { id: 'lunges', name: 'Lunges', icon: 'walk', color: '#ff6b35' },
    { id: 'pushups', name: 'Push-ups', icon: 'fitness', color: '#a855f7' },
    { id: 'bicep_curls', name: 'Bicep Curls', icon: 'barbell', color: '#ffd700' },
    { id: 'shoulder_press', name: 'Shoulder Press', icon: 'arrow-up', color: '#00bfff' },
    { id: 'deadlift', name: 'Deadlift', icon: 'barbell', color: '#ff4757' },
    { id: 'plank', name: 'Plank', icon: 'remove', color: '#2ed573' },
    { id: 'glute_bridge', name: 'Glute Bridge', icon: 'trending-up', color: '#ff6b81' },
  ]
};

const SKELETON_CONNECTIONS = [
  // Face
  [0, 1], [1, 2], [2, 3], [3, 7],
  [0, 4], [4, 5], [5, 6], [6, 8],
  // Shoulders
  [11, 12],
  // Left arm
  [11, 13], [13, 15],
  // Right arm
  [12, 14], [14, 16],
  // Torso
  [11, 23], [12, 24], [23, 24],
  // Left leg
  [23, 25], [25, 27], [27, 29], [27, 31], [29, 31],
  // Right leg
  [24, 26], [26, 28], [28, 30], [28, 32], [30, 32],
];

const JOINT_NODES = [
  0, 1, 2, 3, 4, 5, 6, 7, 8,
  11, 12, 13, 14, 15, 16,
  23, 24, 25, 26, 27, 28, 29, 30, 31, 32
];

const DISABILITY_GUIDANCE: Record<string, string> = {
  wheelchair: 'Seated mode: keep your upper body visible and exercise at a comfortable pace.',
  amputee: 'Adapted mode: use your comfortable range of motion and stop if you feel pain.',
  visual: 'Visual support mode: voice guidance and clear feedback are enabled for your profile.',
  hearing: 'Visual feedback mode: follow the on-screen status, form score, and warnings.',
  neurological: 'Steady movement mode: use slow, controlled repetitions and take breaks as needed.',
  other: 'Personalised support mode: use a comfortable range of motion and stop if you feel pain.',
};

const DISABILITY_LABELS: Record<string, string> = {
  wheelchair: 'Wheelchair',
  amputee: 'Amputee',
  visual: 'Visual support',
  hearing: 'Hearing support',
  neurological: 'Neurological support',
  other: 'Adapted support',
};

const EXERCISE_INSTRUCTIONS: Record<string, string> = {
  squats: 'Stand tall, lower your hips until your knees reach the target angle, then stand.',
  lunges: 'Step forward, lower with control to the target knee angle, then push back.',
  pushups: 'Keep your body straight, lower your chest to the target elbow angle, then press up.',
  bicep_curls: 'Keep your elbows close, curl to the target angle, then lower slowly.',
  shoulder_press: 'Lower your arms to the target angle, then press overhead with control.',
  deadlift: 'Hinge at your hips with a straight back, then return to a tall position.',
  plank: 'Keep your shoulders, hips, and knees aligned while holding the target body angle.',
  glute_bridge: 'Lie on your back, bend your knees, lift your hips, then lower with control.',
};

export default function AnalysisScreen() {
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [userExercises, setUserExercises] = useState<any[]>([]);
  const [userRole, setUserRole] = useState('patient');
  const [voiceGuidance, setVoiceGuidance] = useState(false);
  const [largeText, setLargeText] = useState(false);
  const [highContrast, setHighContrast] = useState(false);
  const [disabilities, setDisabilities] = useState<string[]>([]);
  const [selectedExercise, setSelectedExercise] = useState<any>(null);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [reps, setReps] = useState(0);
  const [formScore, setFormScore] = useState(100);
  const [feedback, setFeedback] = useState('Select exercise & press Start');
  const [isGoodForm, setIsGoodForm] = useState(true);
  const [currentAngle, setCurrentAngle] = useState<number | null>(null);
  const [sessionTime, setSessionTime] = useState(0);
  const [backendOnline, setBackendOnline] = useState(false);
  const [checkingBackend, setCheckingBackend] = useState(false);

  const [bodyVisible, setBodyVisible] = useState(true);
  const [landmarks, setLandmarks] = useState<any[]>([]);

  const cameraRef = useRef<any>(null);
  const repCounterRef = useRef<any>(null);
  const timerRef = useRef<any>(null);
  const analysisRef = useRef<any>(null);
  const lastFeedbackRef = useRef('');
  const lastSpeechAtRef = useRef(0);
  const isProcessingRef = useRef(false);
  const router = useRouter();

  useEffect(() => {
    const initializeProfile = async () => {
      try {
        const [role, category, savedVoice, savedLargeText, savedHighContrast, savedDisabilities] =
          await Promise.all([
            AsyncStorage.getItem('userRole'),
            AsyncStorage.getItem('userCategory'),
            AsyncStorage.getItem('voiceGuidance'),
            AsyncStorage.getItem('largeText'),
            AsyncStorage.getItem('highContrast'),
            AsyncStorage.getItem('disabilities'),
          ]);
        const activeRole = role || category || 'patient';
        const activeCategory = activeRole === 'elderly' || activeRole === 'disabled'
          ? 'general'
          : category && EXERCISE_CATEGORIES[category]
            ? category
            : 'general';
        setUserRole(activeRole);
        setVoiceGuidance(savedVoice === 'true');
        setLargeText(savedLargeText === 'true');
        setHighContrast(savedHighContrast === 'true');
        setDisabilities(savedDisabilities ? JSON.parse(savedDisabilities) : []);
        setUserExercises(EXERCISE_CATEGORIES[activeCategory]);
        setSelectedExercise(EXERCISE_CATEGORIES[activeCategory][0]);
        repCounterRef.current = new RepCounter(EXERCISE_CATEGORIES[activeCategory][0].id);
      } catch {
        setUserExercises(EXERCISE_CATEGORIES.general);
        setSelectedExercise(EXERCISE_CATEGORIES.general[0]);
        repCounterRef.current = new RepCounter(EXERCISE_CATEGORIES.general[0].id);
      } finally {
        setLoadingProfile(false);
      }
    };
    initializeProfile();
    checkBackendConnection();
  }, []);

  async function checkBackendConnection() {
  setCheckingBackend(true);

  const online = await checkBackendOnline();

  setBackendOnline(online);
  setCheckingBackend(false);

  if (!online) {
    setFeedback('AI Engine Offline. Check Connection.');
  } else {
    setFeedback('AI Connected. Tap Start!');
  }
}


  useEffect(() => {
    if (isAnalyzing) {
      timerRef.current = setInterval(() => setSessionTime((prev) => prev + 1), 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isAnalyzing]);

  useEffect(() => {
    if (isAnalyzing && backendOnline && selectedExercise) {
      analysisRef.current = setInterval(async () => {
        if (!isProcessingRef.current) {
          await captureAndAnalyze();
        }
      }, 700);
    } else {
      clearInterval(analysisRef.current);
    }
    return () => clearInterval(analysisRef.current);
  }, [isAnalyzing, selectedExercise, backendOnline]);

  useEffect(() => {
    return () => {
    };
  }, []);

  const captureAndAnalyze = async () => {
    if (!cameraRef.current || isProcessingRef.current || !selectedExercise) return;
    try {
      isProcessingRef.current = true;
      const photo = await cameraRef.current.takePictureAsync({
        base64: true,
        quality: 0.1,
        skipProcessing: true,
        mute: true,
        shutterSound: false,
      });

      if (!photo?.base64) {
        isProcessingRef.current = false;
        return;
      }

      const exerciseName = getBackendExerciseName(selectedExercise.id);
      const result = await analyzeFrame(photo.base64, exerciseName);

      if (result) {
        if (result.landmarks && result.landmarks.length > 0) {
          setLandmarks(result.landmarks);
          const essentialJoints = [11, 12, 23, 24];
          const isMissingJoints = essentialJoints.some(idx => {
            const point = result.landmarks![idx];
            return !point || (point.visibility !== undefined && point.visibility < 0.4);
          });
          setBodyVisible(!isMissingJoints);
        } else {
          setLandmarks([]);
          setBodyVisible(false);
        }

        if (result.angle !== null && result.angle !== undefined) {
          setCurrentAngle(result.angle);
          const feedbackText = result.feedback?.toLowerCase() || '';
          const angleIsSafe = isAngleInTargetRange(selectedExercise.id, result.angle);
          const isGood =
            angleIsSafe &&
            !feedbackText.includes('alert') &&
            !feedbackText.includes('too deep') &&
            !feedbackText.includes('too sharp');
          setIsGoodForm(isGood);
          setFormScore(isGood ? 95 : 60);
          if (!angleIsSafe && !feedbackText.includes('alert')) {
            setFeedback(`Reach the target angle: ${targetAngle}`);
          }

          const angleKey =
            selectedExercise.id === 'deadlift' || selectedExercise.id === 'plank'
              ? 'Hip'
              : selectedExercise.id.includes('curl') ||
                  selectedExercise.id.includes('press') ||
                  selectedExercise.id === 'pushups'
                ? 'Elbow'
                : 'Knee';
          const angles: Record<string, number> = {
            [`left${angleKey}`]: result.angle,
            [`right${angleKey}`]: result.angle,
          };

          if (repCounterRef.current) {
            setReps(repCounterRef.current.update(angles));
          }
        }

        if (result.feedback && result.feedback !== lastFeedbackRef.current) {
          setFeedback(result.feedback);
          lastFeedbackRef.current = result.feedback;
          if (voiceGuidance && Date.now() - lastSpeechAtRef.current > 1800) {
            Speech.speak(result.feedback, { rate: 0.9 });
            lastSpeechAtRef.current = Date.now();
          }
        }
      }
    } catch (err) {
      console.log('Analysis error:', err);
    } finally {
      isProcessingRef.current = false;
    }
  };

 const toggleAnalysis = async () => {
  if (!selectedExercise) {
    return;
  }

  if (!isAnalyzing) {
    setReps(0);
    setSessionTime(0);
    setLandmarks([]);
    setBodyVisible(true);
    if (repCounterRef.current) repCounterRef.current.reset();
    setIsAnalyzing(true);
    return;
  }

  setIsAnalyzing(false);
  setLandmarks([]);

  setFeedback(`Done! ${reps} reps completed.`);
  if (voiceGuidance) {
    Speech.speak(`Session complete. You did ${reps} reps!`, { rate: 0.9 });
  }

  await saveSessionData();
};

const saveSessionData = async () => {
  if (!selectedExercise) {
    console.warn('Session was not saved because no exercise was selected.');
    return;
  }

  try {
    const existingData = await AsyncStorage.getItem('physio_sessions');
    const sessions = existingData ? JSON.parse(existingData) : [];

    const newSession = {
      id: Date.now().toString(),
      exerciseId: selectedExercise.id,
      exerciseName: selectedExercise.name,
      reps,
      duration: sessionTime,
      formScore,
      date: new Date().toLocaleDateString('en-GB'),
    };

    sessions.unshift(newSession);
    await AsyncStorage.setItem(
      'physio_sessions',
      JSON.stringify(sessions)
    );

    const backendExercise = getBackendExerciseName(selectedExercise.id);

    const signedInUser = await getStoredUser();
    const firestoreResult = await saveExerciseSession({
      user_id: signedInUser?.uid || 'unknown-user',
      user_email: signedInUser?.email || null,
      user_name: signedInUser?.display_name || null,
      exercise_id: selectedExercise.id,
      exercise_name: backendExercise,
      reps,
      duration: sessionTime,
      accuracy_score: formScore,
    });

    if (firestoreResult.status === 'success') {
      console.log(
        'Session uploaded successfully:',
        firestoreResult.path || firestoreResult.id
      );
    } else {
      console.warn(
        'Session was saved locally, but Firestore failed:',
        firestoreResult.message
      );
    }
  } catch (error) {
    console.error('Error saving exercise session:', error);
  }
};

  const handleSelectExercise = (exercise: any) => {
    setSelectedExercise(exercise);
    setReps(0);
    setLandmarks([]);
    setCurrentAngle(null);
    setFeedback(`Ready for ${exercise.name}!`);
    setIsAnalyzing(false);
    repCounterRef.current = new RepCounter(exercise.id);
    lastFeedbackRef.current = '';
  };

  const scaleX = (x: number) => (1 - Math.min(Math.max(x, 0), 1)) * SCREEN_WIDTH;
  const scaleY = (y: number) => Math.min(Math.max(y, 0), 1) * SCREEN_HEIGHT;

  const isValidPoint = (point: any) =>
    point &&
    typeof point.x === 'number' &&
    typeof point.y === 'number' &&
    (point.visibility === undefined || point.visibility > 0.3);

  const skeletonColor = isGoodForm ? '#00d4aa' : '#ff4757';
  const primaryDisability = disabilities[0];
  const disabilityGuidance = primaryDisability
    ? DISABILITY_GUIDANCE[primaryDisability]
    : '';
  const targetAngle = selectedExercise
    ? getExerciseTarget(selectedExercise.id)
    : '';

  if (loadingProfile) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#00d4aa" />
      </View>
    );
  }

  if (!permission?.granted) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', padding: 32 }]}>
        <Ionicons name="camera-outline" size={64} color="#00d4aa" />
        <Text style={{ color: '#fff', fontSize: 20, fontWeight: 'bold', marginTop: 20, textAlign: 'center' }}>
          Camera Access Needed
        </Text>
        <TouchableOpacity
          style={{ backgroundColor: '#00d4aa', borderRadius: 14, padding: 16, marginTop: 24 }}
          onPress={requestPermission}
        >
          <Text style={{ color: '#0a0a0a', fontWeight: 'bold', fontSize: 16 }}>Grant Camera Access</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, highContrast && styles.highContrastContainer]}>
      <CameraView style={StyleSheet.absoluteFill} facing="front" ref={cameraRef} />

      <Svg
        width={SCREEN_WIDTH}
        height={SCREEN_HEIGHT}
        style={[StyleSheet.absoluteFill, { zIndex: 5, elevation: 5 }]}
        pointerEvents="none"
      >
        {isAnalyzing && landmarks.length > 0 && (
          <>
            {SKELETON_CONNECTIONS.map(([p1, p2], index) => {
              const start = landmarks[p1];
              const end = landmarks[p2];
              if (!isValidPoint(start) || !isValidPoint(end)) return null;
              return (
                <Line
                  key={`line-${index}`}
                  x1={scaleX(start.x)}
                  y1={scaleY(start.y)}
                  x2={scaleX(end.x)}
                  y2={scaleY(end.y)}
                  stroke={skeletonColor}
                  strokeWidth={4}
                  strokeLinecap="round"
                  opacity={0.9}
                />
              );
            })}

            {JOINT_NODES.map((nodeIdx) => {
              const point = landmarks[nodeIdx];
              if (!isValidPoint(point)) return null;
              return (
                <Circle
                  key={`node-${nodeIdx}`}
                  cx={scaleX(point.x)}
                  cy={scaleY(point.y)}
                  r={6}
                  fill={skeletonColor}
                  stroke="#ffffff"
                  strokeWidth={2}
                  opacity={0.95}
                />
              );
            })}
          </>
        )}
      </Svg>

      {isAnalyzing && !bodyVisible && (
        <View style={styles.warningOverlay}>
          <Ionicons name="scan-outline" size={32} color="#ff4757" />
          <Text style={styles.warningText}>Step Back: Full Body Not Visible</Text>
        </View>
      )}

      <View style={styles.overlay}>
        <View style={[styles.header, { paddingTop: Math.max(insets.top + 10, 50) }]}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={20} color="#fff" />
          </TouchableOpacity>
          <View>
            <Text style={[styles.headerTitle, largeText && styles.largeText]}>
              {selectedExercise?.name}
            </Text>
            <Text style={[styles.roleLabel, largeText && styles.largeText]}>
              {userRole === 'therapist' ? 'Physiotherapist mode' : `${userRole} mode`}
            </Text>
            {primaryDisability && (
              <Text style={[styles.disabilityLabel, largeText && styles.largeText]}>
                {DISABILITY_LABELS[primaryDisability] || 'Adapted mode'}
              </Text>
            )}
          </View>
          {backendOnline ? (
            <View style={[styles.scoreBox, { borderColor: isGoodForm ? '#00d4aa' : '#ff4757' }]}>
              <Text style={[styles.scoreText, { color: isGoodForm ? '#00d4aa' : '#ff4757' }]}>
                {formScore}%
              </Text>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.retryConnectionBtn}
              onPress={checkBackendConnection}
              disabled={checkingBackend}
            >
              {checkingBackend
                ? <ActivityIndicator size="small" color="#ff4757" />
                : <Text style={styles.retryConnectionText}>Reconnect</Text>
              }
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.backendStatus}>
          <View style={[styles.statusDot, { backgroundColor: backendOnline ? '#00d4aa' : '#ff4757' }]} />
          <Text style={[styles.statusText, largeText && styles.largeText]}>
            {backendOnline ? 'AI Engine Online' : 'AI Engine Offline'}
          </Text>
        </View>

        {!!disabilityGuidance && (
          <View style={styles.disabilityBanner}>
            <Ionicons
              name="accessibility"
              size={18}
              color="#a855f7"
            />
            <Text style={[styles.disabilityBannerText, largeText && styles.largeText]}>
              {disabilityGuidance}
            </Text>
          </View>
        )}

        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{reps}</Text>
            <Text style={styles.statLabel}>REPS</Text>
          </View>

          <View style={styles.statBox}>
            <Text style={styles.statValue}>
              {Math.floor(sessionTime / 60).toString().padStart(2, '0')}:
              {(sessionTime % 60).toString().padStart(2, '0')}
            </Text>
            <Text style={styles.statLabel}>TIME</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statValue, { color: isGoodForm ? '#00d4aa' : '#ff4757' }]}>
              {isGoodForm ? 'GOOD' : 'FIX'}
            </Text>
            <Text style={styles.statLabel}>FORM</Text>
          </View>
        </View>

        <View style={styles.targetAngleCard}>
          <Ionicons name="speedometer-outline" size={18} color="#ffd700" />
          <Text style={[styles.targetAngleText, largeText && styles.largeText]}>
            Rep target: {targetAngle}
          </Text>
        </View>

        {currentAngle !== null && isAnalyzing && (
          <View style={styles.anglesBox}>
            <Text style={styles.angleBig}>{currentAngle}°</Text>
            <Text style={styles.angleLabel}>Joint Angle</Text>
          </View>
        )}

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.exerciseScroll}
          contentContainerStyle={styles.exerciseScrollContent}
        >
          {userExercises.map((exercise) => (
            <TouchableOpacity
              key={exercise.id}
              style={[
                styles.exerciseChip,
                selectedExercise?.id === exercise.id && { backgroundColor: exercise.color },
              ]}
              onPress={() => handleSelectExercise(exercise)}
            >
              <Ionicons
                name={exercise.icon as any}
                size={14}
                color={selectedExercise?.id === exercise.id ? '#0a0a0a' : '#fff'}
              />
              <Text style={[
                styles.exerciseChipText,
                selectedExercise?.id === exercise.id && { color: '#0a0a0a', fontWeight: 'bold' },
              ]}>
                {exercise.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={[styles.feedbackBar, { borderColor: isGoodForm ? '#00d4aa' : '#ff4757' }]}>
          <Ionicons
            name={isGoodForm ? 'checkmark-circle' : 'warning'}
            size={16}
            color={isGoodForm ? '#00d4aa' : '#ff4757'}
          />
          <Text
            style={[styles.feedbackText, largeText && styles.largeText]}
            numberOfLines={2}
          >
            {feedback}
          </Text>
        </View>

        <View style={styles.bottomControls}>
          <TouchableOpacity
            style={[
              styles.analyzeBtn,
              { backgroundColor: isAnalyzing ? '#ff4757' : '#00d4aa' },
            ]}
            onPress={toggleAnalysis}
          >
            <Ionicons
              name={isAnalyzing ? 'stop' : 'play'}
              size={22}
              color="#0a0a0a"
            />
            <Text style={styles.analyzeBtnText}>
              {isAnalyzing ? 'Stop Session' : 'Start Session'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  highContrastContainer: {
    backgroundColor: '#000',
  },
  overlay: {
    flex: 1,
    zIndex: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 6,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  } as TextStyle,
  roleLabel: {
    color: '#00d4aa',
    fontSize: 10,
    textTransform: 'capitalize',
    marginTop: 2,
  } as TextStyle,
  disabilityLabel: {
    color: '#a855f7',
    fontSize: 10,
    marginTop: 2,
  } as TextStyle,
  largeText: {
    fontSize: 20,
  } as TextStyle,
  scoreBox: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderWidth: 1,
  },
  scoreText: {
    fontWeight: '700',
    fontSize: 15,
  } as TextStyle,
  retryConnectionBtn: {
    backgroundColor: 'rgba(255,71,87,0.15)',
    borderWidth: 1,
    borderColor: '#ff4757',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  retryConnectionText: {
    color: '#ff4757',
    fontSize: 12,
    fontWeight: '700',
  } as TextStyle,
  backendStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 6,
  },
  disabilityBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: 'rgba(168, 85, 247, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.55)',
  },
  disabilityBannerText: {
    flex: 1,
    color: '#eee',
    fontSize: 11,
    lineHeight: 16,
  } as TextStyle,
  targetAngleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 215, 0, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.4)',
  },
  targetAngleText: {
    flex: 1,
    color: '#fff',
    fontSize: 11,
    lineHeight: 16,
  } as TextStyle,
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    color: '#fff',
    fontSize: 11,
  } as TextStyle,
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    paddingHorizontal: 16,
    marginTop: 4,
  },
  statBox: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 6,
    alignItems: 'center',
    minWidth: 0,
  },
  statValue: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  } as TextStyle,
  statLabel: {
    color: '#bbb',
    fontSize: 9,
    marginTop: 2,
    textAlign: 'center',
  } as TextStyle,
  anglesBox: {
    position: 'absolute',
    top: 160,
    right: 16,
    backgroundColor: 'rgba(0,0,0,0.65)',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#00d4aa',
  },
  angleBig: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  } as TextStyle,
  angleLabel: {
    color: '#00d4aa',
    fontSize: 9,
    marginTop: 2,
  } as TextStyle,
  warningOverlay: {
    position: 'absolute',
    top: '35%',
    left: 24,
    right: 24,
    backgroundColor: 'rgba(255,71,87,0.15)',
    borderWidth: 1,
    borderColor: '#ff4757',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    zIndex: 15,
  },
  warningText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    marginTop: 8,
    textAlign: 'center',
  } as TextStyle,
  exerciseScroll: {
    position: 'absolute',
    bottom: 140,
    left: 0,
    right: 0,
  },
  exerciseScrollContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  exerciseChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 5,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  exerciseChipText: {
    color: '#fff',
    fontSize: 12,
  } as TextStyle,
  feedbackBar: {
    position: 'absolute',
    bottom: 94,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
  },
  feedbackText: {
    color: '#fff',
    fontSize: 13,
    flex: 1,
  } as TextStyle,
  bottomControls: {
    position: 'absolute',
    bottom: 28,
    left: 16,
    right: 16,
  },
  analyzeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    padding: 16,
    gap: 10,
  },
  analyzeBtnText: {
    color: '#0a0a0a',
    fontSize: 15,
    fontWeight: '700',
  } as TextStyle,
});