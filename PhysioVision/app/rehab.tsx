import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const REHAB_PROGRAMS = [
  {
    id: 'knee_recovery',
    title: 'Knee Recovery',
    subtitle: 'Post-surgery or injury rehabilitation',
    icon: 'accessibility',
    color: '#00d4aa',
    duration: '6 weeks',
    sessions: 18,
    difficulty: 'Gentle',
    target: 'Knee Joint',
    description: 'A structured recovery program for knee injuries, ACL tears, and post-surgery rehabilitation. Focuses on restoring range of motion and strength.',
    exercises: [
      { name: 'Knee Flexion', sets: 3, reps: 10, rest: '60s' },
      { name: 'Straight Leg Raise', sets: 3, reps: 12, rest: '45s' },
      { name: 'Glute Bridge', sets: 3, reps: 10, rest: '60s' },
      { name: 'Calf Raises', sets: 2, reps: 15, rest: '45s' },
    ],
  },
  {
    id: 'back_pain',
    title: 'Back Pain Relief',
    subtitle: 'Lower back pain and posture correction',
    icon: 'body',
    color: '#ff6b35',
    duration: '4 weeks',
    sessions: 12,
    difficulty: 'Gentle',
    target: 'Spine & Core',
    description: 'Targeted exercises to relieve lower back pain, improve posture and strengthen the core muscles that support the spine.',
    exercises: [
      { name: 'Bird Dog', sets: 3, reps: 10, rest: '45s' },
      { name: 'Dead Bug', sets: 3, reps: 8, rest: '45s' },
      { name: 'Plank', sets: 3, reps: 1, rest: '60s' },
      { name: 'Hip Hinge', sets: 3, reps: 12, rest: '45s' },
    ],
  },
  {
    id: 'shoulder_rehab',
    title: 'Shoulder Rehabilitation',
    subtitle: 'Rotator cuff and shoulder mobility',
    icon: 'fitness',
    color: '#a855f7',
    duration: '5 weeks',
    sessions: 15,
    difficulty: 'Moderate',
    target: 'Shoulder Joint',
    description: 'Comprehensive shoulder rehabilitation targeting rotator cuff injuries, frozen shoulder and post-surgery recovery.',
    exercises: [
      { name: 'Shoulder Circles', sets: 2, reps: 15, rest: '30s' },
      { name: 'Lateral Raises', sets: 3, reps: 10, rest: '45s' },
      { name: 'External Rotation', sets: 3, reps: 12, rest: '45s' },
      { name: 'Shoulder Press', sets: 2, reps: 10, rest: '60s' },
    ],
  },
  {
    id: 'stroke_recovery',
    title: 'Stroke Recovery',
    subtitle: 'Neurological movement rehabilitation',
    icon: 'pulse',
    color: '#ff4757',
    duration: '8 weeks',
    sessions: 24,
    difficulty: 'Gentle',
    target: 'Full Body',
    description: 'Gentle guided movements to help stroke survivors regain motor control, balance and coordination through repetitive movement therapy.',
    exercises: [
      { name: 'Arm Raises', sets: 2, reps: 8, rest: '60s' },
      { name: 'Standing Balance', sets: 3, reps: 1, rest: '60s' },
      { name: 'Seated Marching', sets: 2, reps: 10, rest: '45s' },
      { name: 'Hip Abduction', sets: 2, reps: 10, rest: '60s' },
    ],
  },
  {
    id: 'fall_prevention',
    title: 'Fall Prevention',
    subtitle: 'Balance and stability for elderly users',
    icon: 'walk',
    color: '#ffd700',
    duration: '6 weeks',
    sessions: 18,
    difficulty: 'Gentle',
    target: 'Balance & Legs',
    description: 'Specially designed for elderly users to improve balance, coordination and leg strength to reduce the risk of falls.',
    exercises: [
      { name: 'Single Leg Stand', sets: 3, reps: 1, rest: '30s' },
      { name: 'Heel to Toe Walk', sets: 2, reps: 10, rest: '45s' },
      { name: 'Sit to Stand', sets: 3, reps: 8, rest: '60s' },
      { name: 'Calf Raises', sets: 3, reps: 12, rest: '45s' },
    ],
  },
  {
    id: 'wheelchair_upper',
    title: 'Wheelchair Upper Body',
    subtitle: 'Adapted exercises for wheelchair users',
    icon: 'accessibility',
    color: '#00bfff',
    duration: '4 weeks',
    sessions: 12,
    difficulty: 'Moderate',
    target: 'Arms & Shoulders',
    description: 'Specially adapted upper body strengthening and rehabilitation program for wheelchair users focusing on arms, shoulders and core.',
    exercises: [
      { name: 'Seated Shoulder Press', sets: 3, reps: 10, rest: '60s' },
      { name: 'Bicep Curls', sets: 3, reps: 12, rest: '45s' },
      { name: 'Seated Row', sets: 3, reps: 10, rest: '60s' },
      { name: 'Chest Stretch', sets: 2, reps: 8, rest: '30s' },
    ],
  },
];

export default function RehabScreen() {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const router = useRouter();

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#00d4aa" />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>Rehab Programs</Text>
          <Text style={styles.headerSubtitle}>Clinical recovery programs</Text>
        </View>
        <Ionicons name="medical" size={24} color="#00d4aa" />
      </View>

      {/* Info Banner */}
      <View style={styles.infoBanner}>
        <Ionicons name="information-circle" size={20} color="#00bfff" />
        <Text style={styles.infoText}>
          These programs are designed with physiotherapy guidelines. Always consult your doctor before starting.
        </Text>
      </View>

      {/* Programs List */}
      <View style={styles.programList}>
        {REHAB_PROGRAMS.map((program) => (
          <TouchableOpacity
            key={program.id}
            style={styles.programCard}
            onPress={() => setExpandedId(expandedId === program.id ? null : program.id)}
          >
            {/* Card Header */}
            <View style={styles.cardHeader}>
              <View style={[styles.iconBox, { backgroundColor: program.color + '22' }]}>
                <Ionicons name={program.icon as any} size={28} color={program.color} />
              </View>
              <View style={styles.cardInfo}>
                <Text style={styles.cardTitle}>{program.title}</Text>
                <Text style={styles.cardSubtitle}>{program.subtitle}</Text>
                <View style={styles.cardTags}>
                  <View style={styles.tag}>
                    <Ionicons name="time" size={12} color="#888" />
                    <Text style={styles.tagText}>{program.duration}</Text>
                  </View>
                  <View style={styles.tag}>
                    <Ionicons name="calendar" size={12} color="#888" />
                    <Text style={styles.tagText}>{program.sessions} sessions</Text>
                  </View>
                  <View style={[styles.tag, { backgroundColor: program.color + '22' }]}>
                    <Text style={[styles.tagText, { color: program.color }]}>{program.difficulty}</Text>
                  </View>
                </View>
              </View>
              <Ionicons
                name={expandedId === program.id ? 'chevron-up' : 'chevron-down'}
                size={20}
                color="#888"
              />
            </View>

            {/* Expanded Content */}
            {expandedId === program.id && (
              <View style={styles.expandedContent}>
                <Text style={styles.description}>{program.description}</Text>

                {/* Target */}
                <View style={styles.targetRow}>
                  <Ionicons name="body" size={16} color={program.color} />
                  <Text style={styles.targetText}>Target: {program.target}</Text>
                </View>

                {/* Exercise List */}
                <Text style={styles.exerciseListTitle}>Program Exercises:</Text>
                {program.exercises.map((ex, i) => (
                  <View key={i} style={styles.exerciseRow}>
                    <View style={styles.exerciseNumber}>
                      <Text style={styles.exerciseNumberText}>{i + 1}</Text>
                    </View>
                    <Text style={styles.exerciseName}>{ex.name}</Text>
                    <Text style={styles.exerciseDetails}>
                      {ex.sets} x {ex.reps} • Rest {ex.rest}
                    </Text>
                  </View>
                ))}

                {/* Start Button */}
                <TouchableOpacity
                  style={[styles.startBtn, { backgroundColor: program.color }]}
                  onPress={() => router.push('/analysis')}
                >
                  <Ionicons name="videocam" size={18} color="#0a0a0a" />
                  <Text style={styles.startBtnText}>Start Program with AI Analysis</Text>
                </TouchableOpacity>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a', paddingHorizontal: 16 },
  header: { flexDirection: 'row', alignItems: 'center', paddingTop: 60, paddingBottom: 20, gap: 12 },
  headerText: { flex: 1 },
  headerTitle: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
  headerSubtitle: { color: '#888', fontSize: 13, marginTop: 2 },
  infoBanner: { flexDirection: 'row', backgroundColor: '#00bfff11', borderRadius: 12, padding: 14, gap: 10, marginBottom: 20, borderWidth: 1, borderColor: '#00bfff33' },
  infoText: { color: '#aaa', fontSize: 13, flex: 1, lineHeight: 20 },
  programList: { gap: 12 },
  programCard: { backgroundColor: '#1a1a1a', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#2a2a2a' },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  iconBox: { width: 52, height: 52, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  cardInfo: { flex: 1 },
  cardTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  cardSubtitle: { color: '#888', fontSize: 13, marginTop: 2 },
  cardTags: { flexDirection: 'row', gap: 8, marginTop: 8, flexWrap: 'wrap' },
  tag: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#2a2a2a', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, gap: 4 },
  tagText: { color: '#888', fontSize: 11 },
  expandedContent: { marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#2a2a2a' },
  description: { color: '#aaa', fontSize: 14, lineHeight: 22, marginBottom: 12 },
  targetRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  targetText: { color: '#aaa', fontSize: 14 },
  exerciseListTitle: { color: '#fff', fontSize: 15, fontWeight: 'bold', marginBottom: 10 },
  exerciseRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  exerciseNumber: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#2a2a2a', justifyContent: 'center', alignItems: 'center' },
  exerciseNumberText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  exerciseName: { flex: 1, color: '#fff', fontSize: 14 },
  exerciseDetails: { color: '#888', fontSize: 12 },
  startBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: 12, padding: 14, marginTop: 16, gap: 8 },
  startBtnText: { color: '#0a0a0a', fontSize: 15, fontWeight: 'bold' },
});