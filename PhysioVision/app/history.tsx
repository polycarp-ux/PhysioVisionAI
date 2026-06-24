import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const MOCK_HISTORY = [
  { id: '1', exercise: 'Squats', date: '2026-05-26', reps: 15, formScore: 92, duration: '5:30', feedback: 'Great depth! Keep knees behind toes.' },
  { id: '2', exercise: 'Push-ups', date: '2026-05-25', reps: 20, formScore: 78, duration: '4:15', feedback: 'Good reps! Keep your hips level next time.' },
  { id: '3', exercise: 'Bicep Curls', date: '2026-05-24', reps: 12, formScore: 95, duration: '3:45', feedback: 'Excellent form! No swinging detected.' },
  { id: '4', exercise: 'Plank', date: '2026-05-23', reps: 3, formScore: 88, duration: '6:00', feedback: 'Strong core! Hips slightly high on last hold.' },
  { id: '5', exercise: 'Lunges', date: '2026-05-22', reps: 18, formScore: 71, duration: '5:00', feedback: 'Watch your front knee alignment.' },
];

export default function HistoryScreen() {
  const [sessions] = useState(MOCK_HISTORY);
  const router = useRouter();

  const avgScore = Math.round(sessions.reduce((a, b) => a + b.formScore, 0) / sessions.length);
  const totalReps = sessions.reduce((a, b) => a + b.reps, 0);

  const getScoreColor = (score: number) => {
    if (score >= 90) return '#2ed573';
    if (score >= 75) return '#ffd700';
    return '#ff4757';
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#00d4aa" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Session History</Text>
        <Ionicons name="calendar" size={24} color="#00d4aa" />
      </View>

      {/* Summary Cards */}
      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Ionicons name="trophy" size={28} color="#ffd700" />
          <Text style={styles.summaryNumber}>{avgScore}%</Text>
          <Text style={styles.summaryLabel}>Avg Form Score</Text>
        </View>
        <View style={styles.summaryCard}>
          <Ionicons name="repeat" size={28} color="#00d4aa" />
          <Text style={styles.summaryNumber}>{totalReps}</Text>
          <Text style={styles.summaryLabel}>Total Reps</Text>
        </View>
        <View style={styles.summaryCard}>
          <Ionicons name="calendar" size={28} color="#a855f7" />
          <Text style={styles.summaryNumber}>{sessions.length}</Text>
          <Text style={styles.summaryLabel}>Sessions</Text>
        </View>
      </View>

      {/* Score Bar Chart */}
      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>Form Score Trend</Text>
        <View style={styles.chartBars}>
          {sessions.slice().reverse().map((session) => (
            <View key={session.id} style={styles.barWrapper}>
              <Text style={styles.barScore}>{session.formScore}</Text>
              <View style={styles.barBg}>
                <View
                  style={[
                    styles.barFill,
                    {
                      height: `${session.formScore}%`,
                      backgroundColor: getScoreColor(session.formScore),
                    },
                  ]}
                />
              </View>
              <Text style={styles.barLabel}>{session.exercise.substring(0, 4)}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Session List */}
      <Text style={styles.sectionTitle}>Recent Sessions</Text>
      <View style={styles.sessionList}>
        {sessions.map((session) => (
          <View key={session.id} style={styles.sessionCard}>
            <View style={styles.sessionHeader}>
              <View style={styles.sessionLeft}>
                <Text style={styles.sessionExercise}>{session.exercise}</Text>
                <Text style={styles.sessionDate}>{session.date} • {session.duration}</Text>
              </View>
              <View style={[styles.scoreBadge, { backgroundColor: getScoreColor(session.formScore) + '22' }]}>
                <Text style={[styles.scoreText, { color: getScoreColor(session.formScore) }]}>
                  {session.formScore}%
                </Text>
              </View>
            </View>
            <View style={styles.sessionStats}>
              <View style={styles.statItem}>
                <Ionicons name="repeat" size={14} color="#888" />
                <Text style={styles.statText}>{session.reps} reps</Text>
              </View>
              <View style={styles.statItem}>
                <Ionicons name="time" size={14} color="#888" />
                <Text style={styles.statText}>{session.duration}</Text>
              </View>
            </View>
            <View style={styles.feedbackRow}>
              <Ionicons name="chatbubble-ellipses" size={14} color="#00d4aa" />
              <Text style={styles.feedbackText}>{session.feedback}</Text>
            </View>
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
  headerTitle: { flex: 1, color: '#fff', fontSize: 22, fontWeight: 'bold' },
  summaryRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  summaryCard: { flex: 1, backgroundColor: '#1a1a1a', borderRadius: 16, padding: 16, alignItems: 'center', gap: 8 },
  summaryNumber: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
  summaryLabel: { color: '#888', fontSize: 11, textAlign: 'center' },
  chartCard: { backgroundColor: '#1a1a1a', borderRadius: 16, padding: 20, marginBottom: 24 },
  chartTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginBottom: 16 },
  chartBars: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-around', height: 120 },
  barWrapper: { alignItems: 'center', gap: 4, flex: 1 },
  barScore: { color: '#888', fontSize: 10 },
  barBg: { width: 28, height: 90, backgroundColor: '#2a2a2a', borderRadius: 6, justifyContent: 'flex-end', overflow: 'hidden' },
  barFill: { width: '100%', borderRadius: 6 },
  barLabel: { color: '#888', fontSize: 10 },
  sectionTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 16 },
  sessionList: { gap: 12 },
  sessionCard: { backgroundColor: '#1a1a1a', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#2a2a2a' },
  sessionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  sessionLeft: { flex: 1 },
  sessionExercise: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  sessionDate: { color: '#888', fontSize: 12, marginTop: 2 },
  scoreBadge: { borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4 },
  scoreText: { fontSize: 14, fontWeight: 'bold' },
  sessionStats: { flexDirection: 'row', gap: 16, marginBottom: 12 },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statText: { color: '#888', fontSize: 13 },
  feedbackRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#2a2a2a' },
  feedbackText: { color: '#aaa', fontSize: 13, flex: 1 },
});