import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Vibration
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Speech from 'expo-speech';

const ELDERLY_EXERCISES = [
  {
    id: 'sit_to_stand',
    name: 'Sit to Stand',
    icon: 'accessibility',
    color: '#00d4aa',
    duration: '5 mins',
    difficulty: 'Easy',
    description: 'Strengthen your legs and improve balance by standing up from a chair.',
    steps: [
      'Sit at the edge of your chair',
      'Place feet flat on the floor',
      'Lean slightly forward',
      'Push up slowly to stand',
      'Hold for 2 seconds then sit back down',
    ],
    benefit: 'Improves leg strength and reduces fall risk',
    backendId: 'sit_to_stand',
    mode: 'elderly',
  },
  {
    id: 'heel_toe',
    name: 'Heel to Toe Walk',
    icon: 'walk',
    color: '#ff6b35',
    duration: '5 mins',
    difficulty: 'Easy',
    description: 'Improve your balance and coordination with this simple walking exercise.',
    steps: [
      'Stand near a wall for support',
      'Place your right heel in front of left toe',
      'Look straight ahead',
      'Take 10 steps forward',
      'Turn around slowly and repeat',
    ],
    benefit: 'Improves balance and prevents falls',
    backendId: 'heel_toe',
    mode: 'elderly',
  },
  {
    id: 'ankle_circles',
    name: 'Ankle Circles',
    icon: 'refresh',
    color: '#a855f7',
    duration: '3 mins',
    difficulty: 'Easy',
    description: 'Keep your ankles flexible and strong with gentle circular movements.',
    steps: [
      'Sit comfortably in a chair',
      'Lift your right foot slightly',
      'Rotate your ankle clockwise 10 times',
      'Rotate anticlockwise 10 times',
      'Repeat with the left foot',
    ],
    benefit: 'Reduces ankle stiffness and improves circulation',
    backendId: 'ankle_circles',
    mode: 'elderly',
  },
  {
    id: 'wall_pushup',
    name: 'Wall Push-ups',
    icon: 'fitness',
    color: '#ffd700',
    duration: '5 mins',
    difficulty: 'Easy',
    description: 'Build upper body strength safely using a wall for support.',
    steps: [
      'Stand arm length from a wall',
      'Place hands flat on the wall',
      'Slowly bend elbows toward wall',
      'Push back to starting position',
      'Repeat 10 times',
    ],
    benefit: 'Strengthens arms and chest safely',
    backendId: 'wall_pushup',
    mode: 'elderly',
  },
  {
    id: 'seated_march',
    name: 'Seated Marching',
    icon: 'body',
    color: '#00bfff',
    duration: '5 mins',
    difficulty: 'Easy',
    description: 'Improve leg strength and circulation while seated safely.',
    steps: [
      'Sit upright in a sturdy chair',
      'Lift your right knee up slowly',
      'Lower it back down gently',
      'Lift your left knee up slowly',
      'Alternate for 20 repetitions',
    ],
    benefit: 'Improves circulation and leg strength',
    backendId: 'seated_march',
    mode: 'elderly',
  },
  {
    id: 'shoulder_rolls',
    name: 'Shoulder Rolls',
    icon: 'sync',
    color: '#2ed573',
    duration: '3 mins',
    difficulty: 'Easy',
    description: 'Relieve tension and improve shoulder mobility with gentle rolls.',
    steps: [
      'Sit or stand comfortably',
      'Roll both shoulders forward 5 times',
      'Roll both shoulders backward 5 times',
      'Breathe deeply throughout',
      'Repeat 3 times',
    ],
    benefit: 'Reduces shoulder tension and improves posture',
    backendId: 'shoulder_rolls',
    mode: 'elderly',
  },
];

const TIPS = [
  '💧 Stay hydrated — drink water before and after exercise',
  '🛑 Stop immediately if you feel pain or dizziness',
  '🤝 Exercise with a family member or caregiver when possible',
  '📞 Keep your phone nearby during exercise',
  '🪑 Always have a sturdy chair nearby for support',
];

export default function ElderlyScreen() {
  const [selectedExercise, setSelectedExercise] = useState<typeof ELDERLY_EXERCISES[0] | null>(null);
  const [currentTip, setCurrentTip] = useState(0);
  const router = useRouter();

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTip((prev) => (prev + 1) % TIPS.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const speakExercise = (exercise: typeof ELDERLY_EXERCISES[0]) => {
    Speech.speak(
      `${exercise.name}. ${exercise.description}. ${exercise.benefit}.`,
      { rate: 0.8, pitch: 1.0 }
    );
  };

  const handleSelectExercise = (exercise: typeof ELDERLY_EXERCISES[0]) => {
    setSelectedExercise(exercise);
    speakExercise(exercise);
    Vibration.vibrate(100);
  };

  // ── Fixed: now passes the correct exercise and mode to analysis ──
  const handleStartExercise = () => {
    if (selectedExercise) {
      Speech.speak(
        `Starting ${selectedExercise.name}. ${selectedExercise.steps[0]}`,
        { rate: 0.8 }
      );
      router.push({
        pathname: '/analysis',
        params: {
          exerciseId: selectedExercise.id,
          exerciseName: selectedExercise.name,
          mode: 'elderly',
        },
      });
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={28} color="#00d4aa" />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>Elderly Care Mode</Text>
          <Text style={styles.headerSubtitle}>Safe & gentle exercises</Text>
        </View>
        <TouchableOpacity
          style={styles.voiceBtn}
          onPress={() => Speech.speak('Welcome to Elderly Care Mode. Choose an exercise to begin.', { rate: 0.8 })}
        >
          <Ionicons name="volume-high" size={28} color="#00d4aa" />
        </TouchableOpacity>
      </View>

      {/* Safety Tip Banner */}
      <View style={styles.tipBanner}>
        <Ionicons name="information-circle" size={24} color="#ffd700" />
        <Text style={styles.tipText}>{TIPS[currentTip]}</Text>
      </View>

      {/* Emergency Button */}
      <TouchableOpacity
        style={styles.emergencyBtn}
        onPress={() => {
          Vibration.vibrate([100, 200, 100]);
          Speech.speak('Emergency alert. Please call for help immediately.', { rate: 0.8 });
        }}
      >
        <Ionicons name="call" size={28} color="#fff" />
        <Text style={styles.emergencyBtnText}>Emergency — Call for Help</Text>
      </TouchableOpacity>

      {/* Exercise Grid */}
      <Text style={styles.sectionTitle}>Choose Your Exercise</Text>
      <Text style={styles.sectionSubtitle}>Tap an exercise to hear instructions</Text>

      <View style={styles.exerciseGrid}>
        {ELDERLY_EXERCISES.map((exercise) => (
          <TouchableOpacity
            key={exercise.id}
            style={[
              styles.exerciseCard,
              selectedExercise?.id === exercise.id && {
                borderColor: exercise.color,
                borderWidth: 3,
              },
            ]}
            onPress={() => handleSelectExercise(exercise)}
          >
            <View style={[styles.exerciseIcon, { backgroundColor: exercise.color + '22' }]}>
              <Ionicons name={exercise.icon as any} size={36} color={exercise.color} />
            </View>
            <Text style={styles.exerciseName}>{exercise.name}</Text>
            <Text style={styles.exerciseDuration}>{exercise.duration}</Text>
            <View style={styles.easyBadge}>
              <Text style={styles.easyBadgeText}>{exercise.difficulty}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Selected Exercise Detail */}
      {selectedExercise && (
        <View style={[styles.detailCard, { borderColor: selectedExercise.color }]}>
          <View style={styles.detailHeader}>
            <Ionicons name={selectedExercise.icon as any} size={32} color={selectedExercise.color} />
            <View style={styles.detailHeaderText}>
              <Text style={styles.detailTitle}>{selectedExercise.name}</Text>
              <Text style={styles.detailDuration}>{selectedExercise.duration}</Text>
            </View>
            <TouchableOpacity onPress={() => speakExercise(selectedExercise)}>
              <Ionicons name="volume-high" size={28} color={selectedExercise.color} />
            </TouchableOpacity>
          </View>

          <Text style={styles.detailDescription}>{selectedExercise.description}</Text>

          <View style={styles.benefitBox}>
            <Ionicons name="checkmark-circle" size={20} color="#2ed573" />
            <Text style={styles.benefitText}>{selectedExercise.benefit}</Text>
          </View>

          {/* AI Analysis Info Box */}
          <View style={styles.aiInfoBox}>
            <Ionicons name="scan" size={18} color="#00d4aa" />
            <Text style={styles.aiInfoText}>
              AI will analyse your <Text style={{ color: '#00d4aa', fontWeight: 'bold' }}>{selectedExercise.name}</Text> specifically — not general exercises
            </Text>
          </View>

          <Text style={styles.stepsTitle}>Step by Step Instructions:</Text>
          {selectedExercise.steps.map((step, i) => (
            <TouchableOpacity
              key={i}
              style={styles.stepRow}
              onPress={() => Speech.speak(`Step ${i + 1}. ${step}`, { rate: 0.8 })}
            >
              <View style={[styles.stepNumber, { backgroundColor: selectedExercise.color }]}>
                <Text style={styles.stepNumberText}>{i + 1}</Text>
              </View>
              <Text style={styles.stepText}>{step}</Text>
              <Ionicons name="volume-medium" size={16} color="#555" />
            </TouchableOpacity>
          ))}

          <TouchableOpacity
            style={[styles.startBtn, { backgroundColor: selectedExercise.color }]}
            onPress={handleStartExercise}
          >
            <Ionicons name="videocam" size={24} color="#0a0a0a" />
            <Text style={styles.startBtnText}>Start AI Analysis for {selectedExercise.name}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Safety Guidelines */}
      <View style={styles.safetyCard}>
        <Text style={styles.safetyTitle}>⚠️ Safety Guidelines</Text>
        {[
          'Always warm up before exercising',
          'Exercise at your own pace — never rush',
          'Stop if you feel pain, dizziness or shortness of breath',
          'Keep a chair or wall nearby for balance support',
          'Inform your doctor before starting any new exercise',
        ].map((guideline, i) => (
          <View key={i} style={styles.guidelineRow}>
            <Ionicons name="shield-checkmark" size={16} color="#ffd700" />
            <Text style={styles.guidelineText}>{guideline}</Text>
          </View>
        ))}
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a', paddingHorizontal: 16 },
  header: { flexDirection: 'row', alignItems: 'center', paddingTop: 60, paddingBottom: 20, gap: 12 },
  backBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#1a1a1a', justifyContent: 'center', alignItems: 'center' },
  headerText: { flex: 1 },
  headerTitle: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  headerSubtitle: { color: '#888', fontSize: 14, marginTop: 2 },
  voiceBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#1a1a1a', justifyContent: 'center', alignItems: 'center' },
  tipBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffd70011', borderRadius: 14, padding: 16, marginBottom: 16, gap: 12, borderWidth: 1, borderColor: '#ffd70033' },
  tipText: { color: '#ffd700', fontSize: 14, flex: 1, lineHeight: 22 },
  emergencyBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#ff4757', borderRadius: 16, padding: 18, marginBottom: 24, gap: 12 },
  emergencyBtnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  sectionTitle: { color: '#fff', fontSize: 22, fontWeight: 'bold', marginBottom: 6 },
  sectionSubtitle: { color: '#888', fontSize: 15, marginBottom: 16 },
  exerciseGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
  exerciseCard: { width: '47%', backgroundColor: '#1a1a1a', borderRadius: 16, padding: 16, alignItems: 'center', gap: 10, borderWidth: 2, borderColor: '#2a2a2a' },
  exerciseIcon: { width: 64, height: 64, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  exerciseName: { color: '#fff', fontSize: 16, fontWeight: 'bold', textAlign: 'center' },
  exerciseDuration: { color: '#888', fontSize: 14 },
  easyBadge: { backgroundColor: '#2ed57322', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  easyBadgeText: { color: '#2ed573', fontSize: 12, fontWeight: 'bold' },
  detailCard: { backgroundColor: '#1a1a1a', borderRadius: 20, padding: 20, marginBottom: 24, borderWidth: 2 },
  detailHeader: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 16 },
  detailHeaderText: { flex: 1 },
  detailTitle: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
  detailDuration: { color: '#888', fontSize: 14, marginTop: 2 },
  detailDescription: { color: '#aaa', fontSize: 16, lineHeight: 26, marginBottom: 16 },
  benefitBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#2ed57311', borderRadius: 12, padding: 14, gap: 10, marginBottom: 12, borderWidth: 1, borderColor: '#2ed57333' },
  benefitText: { color: '#2ed573', fontSize: 15, flex: 1 },
  aiInfoBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#00d4aa11', borderRadius: 12, padding: 14, gap: 10, marginBottom: 20, borderWidth: 1, borderColor: '#00d4aa33' },
  aiInfoText: { color: '#aaa', fontSize: 13, flex: 1, lineHeight: 20 },
  stepsTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 14 },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 14 },
  stepNumber: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  stepNumberText: { color: '#0a0a0a', fontSize: 16, fontWeight: 'bold' },
  stepText: { flex: 1, color: '#ddd', fontSize: 16, lineHeight: 24 },
  startBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: 16, padding: 18, marginTop: 20, gap: 10 },
  startBtnText: { color: '#0a0a0a', fontSize: 16, fontWeight: 'bold' },
  safetyCard: { backgroundColor: '#1a1a1a', borderRadius: 16, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: '#ffd70033' },
  safetyTitle: { color: '#ffd700', fontSize: 18, fontWeight: 'bold', marginBottom: 16 },
  guidelineRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 12 },
  guidelineText: { color: '#aaa', fontSize: 15, flex: 1, lineHeight: 22 },
});