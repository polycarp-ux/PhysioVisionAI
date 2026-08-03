import { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Dimensions } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Speech from 'expo-speech';
import Svg, { Line, Circle } from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RepCounter } from '../utils/repCounter';
import { analyzeFrame, getBackendExerciseName, checkBackendOnline } from '../utils/api';

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
  [11, 12], [11, 13], [13, 15], [12, 14], [14, 16],
  [11, 23], [12, 24], [23, 24], [23, 25], [25, 27], [24, 26], [26, 28]
];

export default function AnalysisScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [userExercises, setUserExercises] = useState<any[]>([]);
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
  
  // Real-world Edge States
  const [countdown, setCountdown] = useState<number | null>(null);
  const [bodyVisible, setBodyVisible] = useState(true);
  const [landmarks, setLandmarks] = useState<any[]>([]);
  
  const cameraRef = useRef<any>(null);
  const repCounterRef = useRef<any>(null);
  const timerRef = useRef<any>(null);
  const analysisRef = useRef<any>(null);
  const lastFeedbackRef = useRef('');
  const isProcessingRef = useRef(false);
  const router = useRouter();

  useEffect(() => {
    const initializeProfile = async () => {
      try {
        const category = await AsyncStorage.getItem('userCategory');
        const activeCategory = category && EXERCISE_CATEGORIES[category] ? category : 'general';
        setUserExercises(EXERCISE_CATEGORIES[activeCategory]);
        setSelectedExercise(EXERCISE_CATEGORIES[activeCategory][0]);
        repCounterRef.current = new RepCounter(EXERCISE_CATEGORIES[activeCategory][0].id);
      } catch (error) {
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

  const checkBackendConnection = async () => {
    setCheckingBackend(true);
    const online = await checkBackendOnline();
    setBackendOnline(online);
    setCheckingBackend(false);
    if (!online) {
      setFeedback('AI Engine Offline. Check Connection.');
    } else {
      setFeedback('AI Connected. Tap Start!');
    }
  };

  useEffect(() => {
    if (isAnalyzing && countdown === null) {
      timerRef.current = setInterval(() => setSessionTime((prev) => prev + 1), 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isAnalyzing, countdown]);

  useEffect(() => {
    if (isAnalyzing && backendOnline && selectedExercise && countdown === null) {
      analysisRef.current = setInterval(async () => {
        if (!isProcessingRef.current) {
          await captureAndAnalyze();
        }
      }, 1500);
    } else {
      clearInterval(analysisRef.current);
      if (!isAnalyzing) setLandmarks([]);
    }
    return () => clearInterval(analysisRef.current);
  }, [isAnalyzing, selectedExercise, backendOnline, countdown]);

  const captureAndAnalyze = async () => {
    if (!cameraRef.current || isProcessingRef.current || !selectedExercise) return;
    try {
      isProcessingRef.current = true;
      const photo = await cameraRef.current.takePictureAsync({
        base64: true,
        quality: 0.15,
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
        // Safe check using a local reference variable to completely satisfy the compiler layout rules
        if (result.landmarks && result.landmarks.length > 0) {
          const currentPoints = result.landmarks;
          setLandmarks(currentPoints);
          
          // Verify if essential tracking joints are out-of-frame
          const essentialJoints = [11, 12, 23, 24]; // Shoulders and Hips
          const isMissingJoints = essentialJoints.some(idx => {
            const point = currentPoints[idx];
            return !point || (point.visibility !== undefined && point.visibility < 0.5);
          });
          setBodyVisible(!isMissingJoints);
        } else {
          setLandmarks([]);
          setBodyVisible(false);
        }

        if (result.angle !== null && result.angle !== undefined) {
          setCurrentAngle(result.angle);
          const isGood = !result.feedback.toLowerCase().includes('alert') && !result.feedback.toLowerCase().includes('too');
          setIsGoodForm(isGood);
          setFormScore(isGood ? 95 : 60);

          const angles = selectedExercise.id.includes('curl') || selectedExercise.id.includes('press') || selectedExercise.id === 'pushups'
            ? { leftElbow: result.angle, rightElbow: result.angle }
            : { leftKnee: result.angle, rightKnee: result.angle };
          
          if (repCounterRef.current) {
            setReps(repCounterRef.current.update(angles));
          }
        }

        if (result.feedback && result.feedback !== lastFeedbackRef.current) {
          setFeedback(result.feedback);
          lastFeedbackRef.current = result.feedback;
          Speech.speak(result.feedback, { rate: 0.9 });
        }
      }
    } catch (error) {
      console.log("Stream check skipped: Connection dropped temporarily.");
    } finally {
      isProcessingRef.current = false;
    }
  };

  const toggleAnalysis = () => {
    if (!selectedExercise) return;
    
    if (!isAnalyzing) {
      setCountdown(3);
      setReps(0);
      setSessionTime(0);
      if (repCounterRef.current) repCounterRef.current.reset();
      Speech.speak("Starting in 3, 2, 1, step back", { rate: 0.9 });

      const counterInterval = setInterval(() => {
        setCountdown((prev) => {
          if (prev === 1) {
            clearInterval(counterInterval);
            setIsAnalyzing(true);
            return null;
          }
          return prev ? prev - 1 : null;
        });
      }, 1000);

    } else {
      setIsAnalyzing(false);
      setCountdown(null);
      setFeedback(`Done! ${reps} reps completed.`);
      Speech.speak(`Session complete.`, { rate: 0.9 });
      saveSessionData();
    }
  };

  const saveSessionData = async () => {
    try {
      const existingData = await AsyncStorage.getItem('physio_sessions');
      const sessions = existingData ? JSON.parse(existingData) : [];
      sessions.unshift({
        id: Date.now().toString(),
        exerciseId: selectedExercise.id,
        exerciseName: selectedExercise.name,
        reps: reps,
        duration: sessionTime,
        formScore: formScore,
        date: new Date().toLocaleDateString('en-GB'),
      });
      await AsyncStorage.setItem('physio_sessions', JSON.stringify(sessions));
    } catch (e) {
      console.error(e);
    }
  };

  const handleSelectExercise = (exercise: any) => {
    setSelectedExercise(exercise);
    setReps(0);
    setLandmarks([]);
    setCurrentAngle(null);
    setFeedback(`Ready for ${exercise.name}!`);
    setIsAnalyzing(false);
    setCountdown(null);
  };

  if (loadingProfile || !permission) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#00d4aa" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView style={StyleSheet.absoluteFill} facing="front" ref={cameraRef} />

      {/* Real-time Neon Skeleton Layer */}
      <Svg style={[StyleSheet.absoluteFillObject, { zIndex: 1, pointerEvents: 'none' }]}>
        {isAnalyzing && countdown === null && landmarks.length > 0 && SKELETON_CONNECTIONS.map(([p1, p2], index) => {
          const jointStart = landmarks[p1];
          const jointEnd = landmarks[p2];
          if (!jointStart || !jointEnd) return null;
          return (
            <Line
              key={`bone-${index}`}
              x1={jointStart.x * SCREEN_WIDTH} y1={jointStart.y * SCREEN_HEIGHT}
              x2={jointEnd.x * SCREEN_WIDTH} y2={jointEnd.y * SCREEN_HEIGHT}
              stroke={isGoodForm ? '#00d4aa' : '#ff4757'} strokeWidth="4" strokeLinecap="round"
            />
          );
        })}
      </Svg>

      {/* Visual Step-Back Alert Overlay */}
      {isAnalyzing && !bodyVisible && countdown === null && (
        <View style={styles.warningOverlay}>
          <Ionicons name="scan-outline" size={32} color="#ff4757" />
          <Text style={styles.warningText}>Step Back: Full Body Not Visible</Text>
        </View>
      )}

      {/* Countdown Visual Indicator */}
      {countdown !== null && (
        <View style={styles.countdownOverlay}>
          <Text style={styles.countdownNum}>{countdown}</Text>
          <Text style={styles.countdownLabel}>Get into position...</Text>
        </View>
      )}

      {/* Control UI Overlays */}
      <View style={styles.overlay}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={20} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{selectedExercise?.name}</Text>
          
          {backendOnline ? (
            <View style={[styles.scoreBox, { borderColor: isGoodForm ? '#00d4aa' : '#ff4757' }]}>
              <Text style={[styles.scoreText, { color: isGoodForm ? '#00d4aa' : '#ff4757' }]}>{formScore}%</Text>
            </View>
          ) : (
            <TouchableOpacity style={styles.retryConnectionBtn} onPress={checkBackendConnection} disabled={checkingBackend}>
              {checkingBackend ? <ActivityIndicator size="small" color="#ff4757" /> : <Text style={styles.retryConnectionText}>Reconnect</Text>}
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statBox}><Text style={styles.statValue}>{reps}</Text><Text style={styles.statLabel}>REPS</Text></View>
          <View style={styles.statBox}><Text style={styles.statValue}>{Math.floor(sessionTime / 60).toString().padStart(2, '0')}:{(sessionTime % 60).toString().padStart(2, '0')}</Text><Text style={styles.statLabel}>TIME</Text></View>
          <View style={styles.statBox}><Text style={[styles.statValue, { color: isGoodForm ? '#00d4aa' : '#ff4757' }]}>{isGoodForm ? 'GOOD' : 'FIX'}</Text><Text style={styles.statLabel}>FORM</Text></View>
        </View>

        {currentAngle !== null && isAnalyzing && countdown === null && (
          <View style={styles.anglesBox}><Text style={styles.angleBig}>{currentAngle}°</Text></View>
        )}

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.exerciseScroll} contentContainerStyle={styles.exerciseScrollContent}>
          {userExercises.map((exercise) => (
            <TouchableOpacity key={exercise.id} style={[styles.exerciseChip, selectedExercise?.id === exercise.id && { backgroundColor: exercise.color }]} onPress={() => handleSelectExercise(exercise)}>
              <Ionicons name={exercise.icon as any} size={14} color={selectedExercise?.id === exercise.id ? '#0a0a0a' : '#fff'} />
              <Text style={[styles.exerciseChipText, selectedExercise?.id === exercise.id && { color: '#0a0a0a', fontWeight: 'bold' }]}>{exercise.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={[styles.feedbackBar, { borderColor: isGoodForm ? '#00d4aa' : '#ff4757' }]}>
          <Ionicons name={isGoodForm ? 'checkmark-circle' : 'warning'} size={16} color={isGoodForm ? '#00d4aa' : '#ff4757'} />
          <Text style={styles.feedbackText} numberOfLines={1}>{feedback}</Text>
        </View>

        <View style={styles.bottomControls}>
          <TouchableOpacity style={[styles.analyzeBtn, { backgroundColor: isAnalyzing || countdown !== null ? '#ff4757' : '#00d4aa' }]} onPress={toggleAnalysis}>
            <Ionicons name={isAnalyzing || countdown !== null ? 'stop' : 'play'} size={20} color="#0a0a0a" />
            <Text style={styles.analyzeBtnText}>{isAnalyzing || countdown !== null ? 'Stop Session' : 'Start Session'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  overlay: { flex: 1, zIndex: 10 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 50, paddingHorizontal: 16, paddingBottom: 6 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  scoreBox: { backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1 },
  scoreText: { fontWeight: 'bold', fontSize: 14 },
  retryConnectionBtn: { backgroundColor: 'rgba(255,71,87,0.15)', borderWidth: 1, borderColor: '#ff4757', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6 },
  retryConnectionText: { color: '#ff4757', fontSize: 12, fontWeight: 'bold' },
  statsRow: { flexDirection: 'row', justifyContent: 'center', gap: 12, marginTop: 10 },
  statBox: { backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 10, paddingVertical: 6, paddingHorizontal: 12, alignItems: 'center', minWidth: 70 },
  statValue: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  statLabel: { color: '#bbb', fontSize: 9, marginTop: 1 },
  anglesBox: { position: 'absolute', top: 120, right: 16, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 24, width: 48, height: 48, justifyContent: 'center', alignItems: 'center' },
  angleBig: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  countdownOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(10,10,10,0.85)', zIndex: 5, justifyContent: 'center', alignItems: 'center' },
  countdownNum: { color: '#00d4aa', fontSize: 80, fontWeight: 'bold' },
  countdownLabel: { color: '#fff', fontSize: 16, marginTop: 10 },
  warningOverlay: { position: 'absolute', top: '35%', left: 24, right: 24, backgroundColor: 'rgba(255,71,87,0.15)', borderWidth: 1, borderColor: '#ff4757', borderRadius: 16, padding: 20, alignItems: 'center', zIndex: 4 },
  warningText: { color: '#fff', fontSize: 14, fontWeight: 'bold', marginTop: 8, textAlign: 'center' },
  exerciseScroll: { position: 'absolute', bottom: 130, left: 0, right: 0 },
  exerciseScrollContent: { paddingHorizontal: 16, gap: 6 },
  exerciseChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 16, paddingHorizontal: 12, paddingVertical: 6, gap: 4, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  exerciseChipText: { color: '#fff', fontSize: 11 },
  feedbackBar: { position: 'absolute', bottom: 84, left: 16, right: 16, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 12, paddingVertical: 10, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1 },
  feedbackText: { color: '#fff', fontSize: 12, flex: 1 },
  bottomControls: { position: 'absolute', bottom: 24, left: 16, right: 16 },
  analyzeBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: 12, padding: 14, gap: 8 },
  analyzeBtnText: { color: '#0a0a0a', fontSize: 14, fontWeight: 'bold' }
});