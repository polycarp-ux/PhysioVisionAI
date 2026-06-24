import { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Speech from 'expo-speech';
import { RepCounter } from '../utils/repCounter';
import { analyzeFrame, getBackendExerciseName, checkBackendOnline } from '../utils/api';

const EXERCISES = [
  { id: 'squats', name: 'Squats', icon: 'body', color: '#00d4aa' },
  { id: 'lunges', name: 'Lunges', icon: 'walk', color: '#ff6b35' },
  { id: 'pushups', name: 'Push-ups', icon: 'fitness', color: '#a855f7' },
  { id: 'bicep_curls', name: 'Bicep Curls', icon: 'barbell', color: '#ffd700' },
  { id: 'shoulder_press', name: 'Shoulder Press', icon: 'arrow-up', color: '#00bfff' },
  { id: 'deadlift', name: 'Deadlift', icon: 'barbell', color: '#ff4757' },
  { id: 'plank', name: 'Plank', icon: 'remove', color: '#2ed573' },
  { id: 'glute_bridge', name: 'Glute Bridge', icon: 'trending-up', color: '#ff6b81' },
];

export default function AnalysisScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [selectedExercise, setSelectedExercise] = useState(EXERCISES[0]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [reps, setReps] = useState(0);
  const [formScore, setFormScore] = useState(100);
  const [feedback, setFeedback] = useState('Select an exercise and press Start!');
  const [isGoodForm, setIsGoodForm] = useState(true);
  const [currentAngle, setCurrentAngle] = useState<number | null>(null);
  const [sessionTime, setSessionTime] = useState(0);
  const [backendOnline, setBackendOnline] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const cameraRef = useRef<any>(null);
  const repCounterRef = useRef(new RepCounter(EXERCISES[0].id));
  const timerRef = useRef<any>(null);
  const analysisRef = useRef<any>(null);
  const lastFeedbackRef = useRef('');
  const router = useRouter();

  // ─── Check backend on mount ─────────────────────────────────────────────────
  useEffect(() => {
    const checkBackend = async () => {
      const online = await checkBackendOnline();
      setBackendOnline(online);
      if (!online) {
        setFeedback('Backend offline. Make sure Python server is running.');
      } else {
        setFeedback('Backend connected! Select an exercise and press Start.');
      }
    };
    checkBackend();
  }, []);

  // ─── Session Timer ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (isAnalyzing) {
      timerRef.current = setInterval(() => setSessionTime((prev) => prev + 1), 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isAnalyzing]);

  // ─── Real Camera Analysis Loop ──────────────────────────────────────────────
  useEffect(() => {
    if (isAnalyzing && backendOnline) {
      analysisRef.current = setInterval(async () => {
        await captureAndAnalyze();
      }, 1500);
    } else {
      clearInterval(analysisRef.current);
    }
    return () => clearInterval(analysisRef.current);
  }, [isAnalyzing, selectedExercise, backendOnline]);

  // ─── Capture frame and send to backend ─────────────────────────────────────
  const captureAndAnalyze = async () => {
    if (!cameraRef.current || isProcessing) return;
    try {
      setIsProcessing(true);
     const photo = await cameraRef.current.takePictureAsync({
  base64: true,
  quality: 0.2,
  skipProcessing: true,
  mute: true,
  shutterSound: false,
});
      if (!photo?.base64) return;

      const exerciseName = getBackendExerciseName(selectedExercise.id);
      const result = await analyzeFrame(photo.base64, exerciseName);

      if (result.angle !== null) {
        setCurrentAngle(result.angle);

        // Determine form score from angle
        const isGood = !result.feedback.toLowerCase().includes('alert') &&
                       !result.feedback.toLowerCase().includes('too');
        setIsGoodForm(isGood);
        setFormScore(isGood ? 95 : 60);

        // Update rep counter
        const angles: Record<string, number> = selectedExercise.id.includes('curl') ||
               selectedExercise.id.includes('press') ||
               selectedExercise.id === 'pushups'
  ? { leftElbow: result.angle ?? 0, rightElbow: result.angle ?? 0 }
  : { leftKnee: result.angle ?? 0, rightKnee: result.angle ?? 0 };
        const newReps = repCounterRef.current.update(angles);
        setReps(newReps);
      }

      // Speak feedback only when it changes
      if (result.feedback !== lastFeedbackRef.current) {
        setFeedback(result.feedback);
        lastFeedbackRef.current = result.feedback;
        Speech.speak(result.feedback, { rate: 0.9 });
      }
    } catch (error) {
      setFeedback('Frame analysis error. Retrying...');
    } finally {
      setIsProcessing(false);
    }
  };

  // ─── Handle exercise selection ──────────────────────────────────────────────
  const handleSelectExercise = (exercise: typeof EXERCISES[0]) => {
    setSelectedExercise(exercise);
    setReps(0);
    setFormScore(100);
    setCurrentAngle(null);
    setFeedback(`Ready for ${exercise.name}!`);
    setIsAnalyzing(false);
    repCounterRef.current = new RepCounter(exercise.id);
    lastFeedbackRef.current = '';
    Speech.speak(`Selected ${exercise.name}`, { rate: 0.9 });
  };

  // ─── Toggle Analysis ────────────────────────────────────────────────────────
  const toggleAnalysis = () => {
    if (!isAnalyzing) {
      setIsAnalyzing(true);
      setSessionTime(0);
      repCounterRef.current.reset();
      setReps(0);
      setFeedback(`Analyzing your ${selectedExercise.name}...`);
      Speech.speak(`Starting ${selectedExercise.name} analysis`, { rate: 0.9 });
    } else {
      setIsAnalyzing(false);
      setFeedback(`Session complete! You did ${reps} reps!`);
      Speech.speak(`Great work! You completed ${reps} reps!`, { rate: 0.9 });
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  if (!permission) return <View style={styles.container} />;

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Ionicons name="camera-outline" size={64} color="#00d4aa" />
        <Text style={styles.permissionTitle}>Camera Access Needed</Text>
        <Text style={styles.permissionText}>PhysioVision needs your camera to analyze movements</Text>
        <TouchableOpacity style={styles.permissionBtn} onPress={requestPermission}>
          <Text style={styles.permissionBtnText}>Grant Camera Access</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Camera */}
      <CameraView style={StyleSheet.absoluteFill} facing="front" ref={cameraRef} />

      {/* UI Overlay */}
      <View style={styles.overlay}>

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{selectedExercise.name}</Text>
          <View style={[styles.scoreBox, { borderColor: isGoodForm ? '#00d4aa' : '#ff4757' }]}>
            <Text style={[styles.scoreText, { color: isGoodForm ? '#00d4aa' : '#ff4757' }]}>
              {formScore}%
            </Text>
          </View>
        </View>

        {/* Backend Status */}
        <View style={styles.backendStatus}>
          <View style={[styles.statusDotSmall, { backgroundColor: backendOnline ? '#00d4aa' : '#ff4757' }]} />
          <Text style={styles.backendStatusText}>
            {backendOnline ? 'AI Engine Online' : 'AI Engine Offline'}
          </Text>
          {isProcessing && <Text style={styles.processingText}> • Processing...</Text>}
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{reps}</Text>
            <Text style={styles.statLabel}>REPS</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{formatTime(sessionTime)}</Text>
            <Text style={styles.statLabel}>TIME</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statValue, { color: isGoodForm ? '#00d4aa' : '#ff4757' }]}>
              {isGoodForm ? 'GOOD' : 'FIX'}
            </Text>
            <Text style={styles.statLabel}>FORM</Text>
          </View>
        </View>

        {/* Live Angle Display */}
        {currentAngle !== null && isAnalyzing && (
          <View style={styles.anglesBox}>
            <Text style={styles.anglesTitle}>Live Joint Angle</Text>
            <Text style={styles.angleBig}>{currentAngle}°</Text>
          </View>
        )}

        {/* Exercise Selector */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.exerciseScroll}
          contentContainerStyle={styles.exerciseScrollContent}
        >
          {EXERCISES.map((exercise) => (
            <TouchableOpacity
              key={exercise.id}
              style={[
                styles.exerciseChip,
                selectedExercise.id === exercise.id && { backgroundColor: exercise.color },
              ]}
              onPress={() => handleSelectExercise(exercise)}
            >
              <Ionicons
                name={exercise.icon as any}
                size={16}
                color={selectedExercise.id === exercise.id ? '#0a0a0a' : '#fff'}
              />
              <Text style={[
                styles.exerciseChipText,
                selectedExercise.id === exercise.id && { color: '#0a0a0a', fontWeight: 'bold' },
              ]}>
                {exercise.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Feedback Bar */}
        <View style={[styles.feedbackBar, { borderColor: isGoodForm ? '#00d4aa' : '#ff4757' }]}>
          <Ionicons
            name={isGoodForm ? 'checkmark-circle' : 'warning'}
            size={18}
            color={isGoodForm ? '#00d4aa' : '#ff4757'}
          />
          <Text style={styles.feedbackText} numberOfLines={2}>{feedback}</Text>
        </View>

        {/* Bottom Controls */}
        <View style={styles.bottomControls}>
          <TouchableOpacity
            style={[styles.analyzeBtn, { backgroundColor: isAnalyzing ? '#ff4757' : '#00d4aa' }]}
            onPress={toggleAnalysis}
          >
            <Ionicons name={isAnalyzing ? 'stop' : 'play'} size={24} color="#0a0a0a" />
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
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  overlay: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 60, paddingHorizontal: 20, paddingBottom: 10 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  scoreBox: { backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1 },
  scoreText: { fontWeight: 'bold', fontSize: 16 },
  backendStatus: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 8 },
  statusDotSmall: { width: 8, height: 8, borderRadius: 4 },
  backendStatusText: { color: '#fff', fontSize: 12 },
  processingText: { color: '#ffd700', fontSize: 12 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', paddingHorizontal: 20, marginTop: 4 },
  statBox: { backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 12, padding: 12, alignItems: 'center', minWidth: 80 },
  statValue: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
  statLabel: { color: '#888', fontSize: 11, marginTop: 2 },
  anglesBox: { backgroundColor: 'rgba(0,0,0,0.7)', marginHorizontal: 60, marginTop: 12, borderRadius: 12, padding: 12, alignItems: 'center' },
  anglesTitle: { color: '#00d4aa', fontSize: 12, fontWeight: 'bold' },
  angleBig: { color: '#fff', fontSize: 40, fontWeight: 'bold' },
  exerciseScroll: { position: 'absolute', bottom: 180, left: 0, right: 0 },
  exerciseScrollContent: { paddingHorizontal: 16, gap: 8 },
  exerciseChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, gap: 6, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  exerciseChipText: { color: '#fff', fontSize: 13 },
  feedbackBar: { position: 'absolute', bottom: 240, left: 16, right: 16, backgroundColor: 'rgba(0,0,0,0.75)', borderRadius: 16, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1 },
  feedbackText: { color: '#fff', fontSize: 13, flex: 1 },
  bottomControls: { position: 'absolute', bottom: 40, left: 16, right: 16 },
  analyzeBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: 16, padding: 16, gap: 10 },
  analyzeBtnText: { color: '#0a0a0a', fontSize: 16, fontWeight: 'bold' },
  permissionContainer: { flex: 1, backgroundColor: '#0a0a0a', justifyContent: 'center', alignItems: 'center', padding: 32 },
  permissionTitle: { color: '#fff', fontSize: 22, fontWeight: 'bold', marginTop: 20 },
  permissionText: { color: '#888', fontSize: 15, textAlign: 'center', marginTop: 12, marginBottom: 32 },
  permissionBtn: { backgroundColor: '#00d4aa', borderRadius: 16, paddingHorizontal: 32, paddingVertical: 16 },
  permissionBtnText: { color: '#0a0a0a', fontSize: 16, fontWeight: 'bold' },
});