import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

// 1. Core Structure with your exact configurations and colors
const STATIC_ROM_DATA = {
  knee: {
    label: 'Knee Flexion',
    color: '#00d4aa',
    unit: '°',
    normalRange: { min: 0, max: 140 },
    sessions: [
      { date: 'May 1', angle: 45, score: 60 },
      { date: 'May 5', angle: 62, score: 68 },
      { date: 'May 9', angle: 78, score: 74 },
      { date: 'May 13', angle: 91, score: 80 },
      { date: 'May 17', angle: 105, score: 86 },
      { date: 'May 21', angle: 118, score: 91 },
      { date: 'May 25', angle: 128, score: 95 },
    ],
  },
  elbow: {
    label: 'Elbow Flexion',
    color: '#a855f7',
    unit: '°',
    normalRange: { min: 0, max: 145 },
    sessions: [
      { date: 'May 1', angle: 60, score: 65 },
      { date: 'May 5', angle: 75, score: 70 },
      { date: 'May 9', angle: 88, score: 76 },
      { date: 'May 13', angle: 100, score: 82 },
      { date: 'May 17', angle: 115, score: 88 },
      { date: 'May 21', angle: 128, score: 92 },
      { date: 'May 25', angle: 138, score: 97 },
    ],
  },
  shoulder: {
    label: 'Shoulder Abduction',
    color: '#ff6b35',
    unit: '°',
    normalRange: { min: 0, max: 180 },
    sessions: [
      { date: 'May 1', angle: 40, score: 55 },
      { date: 'May 5', angle: 58, score: 62 },
      { date: 'May 9', angle: 74, score: 69 },
      { date: 'May 13', angle: 92, score: 75 },
      { date: 'May 17', angle: 110, score: 82 },
      { date: 'May 21', angle: 130, score: 88 },
      { date: 'May 25', angle: 148, score: 93 },
    ],
  },
  hip: {
    label: 'Hip Flexion',
    color: '#ffd700',
    unit: '°',
    normalRange: { min: 0, max: 120 },
    sessions: [
      { date: 'May 1', angle: 30, score: 58 },
      { date: 'May 5', angle: 45, score: 65 },
      { date: 'May 9', angle: 58, score: 71 },
      { date: 'May 13', angle: 70, score: 77 },
      { date: 'May 17', angle: 82, score: 83 },
      { date: 'May 21', angle: 95, score: 89 },
      { date: 'May 25', angle: 108, score: 94 },
    ],
  },
};

type JointKey = keyof typeof STATIC_ROM_DATA;

export default function ROMTrackerScreen() {
  const [selectedJoint, setSelectedJoint] = useState<JointKey>('knee');
  const [romData, setRomData] = useState(STATIC_ROM_DATA);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchLiveSessions();
  }, []);

  const fetchLiveSessions = async () => {
    try {
      setLoading(true);
      const stored = await AsyncStorage.getItem('physio_sessions');
      if (stored) {
        const rawSessions = JSON.parse(stored);
        
        if (rawSessions && rawSessions.length > 0) {
          // Clone the default dataset structure to avoid mutating original states
          const baseData = JSON.parse(JSON.stringify(STATIC_ROM_DATA));

          // Clear mock data if there are active user logs to prevent cluttering
          baseData.knee.sessions = [];
          baseData.elbow.sessions = [];
          baseData.shoulder.sessions = [];
          baseData.hip.sessions = [];

          rawSessions.forEach((session: any) => {
            const dateObj = new Date(session.timestamp || session.date || Date.now());
            const formattedDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

            // Calculate degrees: Use captured range limit or fall back to score scaling
            const score = session.formScore || session.accuracy || 75;
            let angle = session.maxAngle || session.angle;

            const exerciseKey = (session.exerciseName || '').toLowerCase();

            // 2. Classify your PhysioVision AI movement routines into their target joints
            if (exerciseKey.includes('squat') || exerciseKey.includes('lunge')) {
              if (!angle) angle = Math.round((score / 100) * baseData.knee.normalRange.max);
              baseData.knee.sessions.push({ date: formattedDate, angle, score });
            } else if (exerciseKey.includes('curl') || exerciseKey.includes('elbow')) {
              if (!angle) angle = Math.round((score / 100) * baseData.elbow.normalRange.max);
              baseData.elbow.sessions.push({ date: formattedDate, angle, score });
            } else if (exerciseKey.includes('shoulder') || exerciseKey.includes('press') || exerciseKey.includes('raising')) {
              if (!angle) angle = Math.round((score / 100) * baseData.shoulder.normalRange.max);
              baseData.shoulder.sessions.push({ date: formattedDate, angle, score });
            } else if (exerciseKey.includes('hip') || exerciseKey.includes('leg')) {
              if (!angle) angle = Math.round((score / 100) * baseData.hip.normalRange.max);
              baseData.hip.sessions.push({ date: formattedDate, angle, score });
            }
          });

          // Fill back missing datasets with defaults if a specific joint has zero tracking entries yet
          (Object.keys(baseData) as JointKey[]).forEach((key) => {
            if (baseData[key].sessions.length === 0) {
              baseData[key].sessions = STATIC_ROM_DATA[key].sessions;
            } else {
              // Ensure our sessions chronological order matches historical flows (Oldest -> Newest)
              baseData[key].sessions.sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
              // Cap at latest 7 sessions to fit comfortably inside your layout charts
              if (baseData[key].sessions.length > 7) {
                baseData[key].sessions = baseData[key].sessions.slice(-7);
              }
            }
          });

          setRomData(baseData);
        }
      }
    } catch (e) {
      console.warn("Could not retrieve real-time ROM data from AsyncStorage, using mock records.", e);
    } finally {
      setLoading(false);
    }
  };

  const data = romData[selectedJoint];
  
  // Guard values in case of empty states
  const latest = data.sessions[data.sessions.length - 1] || { angle: 0, score: 0, date: 'N/A' };
  const first = data.sessions[0] || { angle: 0, score: 0, date: 'N/A' };
  const improvement = Math.max(0, latest.angle - first.angle);
  const maxAngle = data.normalRange.max;

  const getBarHeight = (angle: number) => {
    return maxAngle > 0 ? (angle / maxAngle) * 120 : 0;
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return '#2ed573';
    if (score >= 75) return '#ffd700';
    return '#ff4757';
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#00d4aa" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#00d4aa" />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>ROM Tracker</Text>
          <Text style={styles.headerSubtitle}>Range of Motion Progress</Text>
        </View>
        <TouchableOpacity onPress={fetchLiveSessions}>
          <Ionicons name="refresh" size={24} color="#00d4aa" />
        </TouchableOpacity>
      </View>

      {/* Joint Selector */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.jointScroll}
        contentContainerStyle={styles.jointScrollContent}
      >
        {(Object.keys(romData) as JointKey[]).map((joint) => (
          <TouchableOpacity
            key={joint}
            style={[
              styles.jointChip,
              selectedJoint === joint && { backgroundColor: romData[joint].color },
            ]}
            onPress={() => setSelectedJoint(joint)}
          >
            <Text style={[
              styles.jointChipText,
              selectedJoint === joint && { color: '#0a0a0a', fontWeight: 'bold' },
            ]}>
              {romData[joint].label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Summary Cards */}
      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Ionicons name="trending-up" size={24} color="#00d4aa" />
          <Text style={styles.summaryValue}>+{improvement}°</Text>
          <Text style={styles.summaryLabel}>Improvement</Text>
        </View>
        <View style={styles.summaryCard}>
          <Ionicons name="body" size={24} color={data.color} />
          <Text style={styles.summaryValue}>{latest.angle}°</Text>
          <Text style={styles.summaryLabel}>Latest ROM</Text>
        </View>
        <View style={styles.summaryCard}>
          <Ionicons name="star" size={24} color="#ffd700" />
          <Text style={styles.summaryValue}>{latest.score}%</Text>
          <Text style={styles.summaryLabel}>Form Score</Text>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressCard}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressTitle}>Progress to Normal Range</Text>
          <Text style={styles.progressPercent}>
            {maxAngle > 0 ? Math.round((latest.angle / maxAngle) * 100) : 0}%
          </Text>
        </View>
        <View style={styles.progressBarBg}>
          <View
            style={[
              styles.progressBarFill,
              {
                width: `${Math.min((maxAngle > 0 ? (latest.angle / maxAngle) * 100 : 0), 100)}%`,
                backgroundColor: data.color,
              },
            ]}
          />
        </View>
        <View style={styles.progressLabels}>
          <Text style={styles.progressLabel}>0°</Text>
          <Text style={styles.progressLabel}>Normal: {maxAngle}°</Text>
        </View>
      </View>

      {/* Bar Chart */}
      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>Session History — {data.label}</Text>
        <View style={styles.chartArea}>
          {data.sessions.map((session, i) => (
            <View key={i} style={styles.barGroup}>
              <Text style={styles.barValue}>{session.angle}°</Text>
              <View style={styles.barBg}>
                <View
                  style={[
                    styles.barFill,
                    { height: getBarHeight(session.angle), backgroundColor: data.color },
                  ]}
                />
              </View>
              {/* Handles date formatting cleanly */}
              <Text style={styles.barDate}>{session.date.includes(' ') ? session.date.split(' ')[1] : session.date}</Text>
            </View>
          ))}
        </View>
        <View style={styles.chartLegend}>
          <View style={[styles.legendDot, { backgroundColor: data.color }]} />
          <Text style={styles.legendText}>{data.label} (degrees)</Text>
        </View>
      </View>

      {/* Form Score Trend */}
      <View style={styles.scoreCard}>
        <Text style={styles.chartTitle}>Form Score Trend</Text>
        <View style={styles.scoreBars}>
          {data.sessions.map((session, i) => (
            <View key={i} style={styles.scoreBarGroup}>
              <Text style={[styles.scoreValue, { color: getScoreColor(session.score) }]}>
                {session.score}
              </Text>
              <View style={styles.scoreBarBg}>
                <View
                  style={[
                    styles.scoreBarFill,
                    {
                      height: (session.score / 100) * 80,
                      backgroundColor: getScoreColor(session.score),
                    },
                  ]}
                />
              </View>
              <Text style={styles.barDate}>{session.date.includes(' ') ? session.date.split(' ')[1] : session.date}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Session Details */}
      <Text style={styles.sectionTitle}>Session Details</Text>
      <View style={styles.sessionList}>
        {data.sessions.slice().reverse().map((session, i) => (
          <View key={i} style={styles.sessionRow}>
            <View style={styles.sessionDate}>
              <Text style={styles.sessionDateText}>{session.date}</Text>
            </View>
            <View style={styles.sessionAngle}>
              <Text style={[styles.sessionAngleText, { color: data.color }]}>
                {session.angle}°
              </Text>
            </View>
            <View style={styles.sessionScoreBox}>
              <Text style={[styles.sessionScoreText, { color: getScoreColor(session.score) }]}>
                {session.score}%
              </Text>
            </View>
            <View style={styles.sessionBarBg}>
              <View
                style={[
                  styles.sessionBarFill,
                  {
                    width: `${maxAngle > 0 ? (session.angle / maxAngle) * 100 : 0}%`,
                    backgroundColor: data.color + '66',
                  },
                ]}
              />
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
  headerText: { flex: 1 },
  headerTitle: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
  headerSubtitle: { color: '#888', fontSize: 13, marginTop: 2 },
  jointScroll: { marginBottom: 16 },
  jointScrollContent: { gap: 8, paddingRight: 16 },
  jointChip: { backgroundColor: '#1a1a1a', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, borderWidth: 1, borderColor: '#333' },
  jointChipText: { color: '#888', fontSize: 13 },
  summaryRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  summaryCard: { flex: 1, backgroundColor: '#1a1a1a', borderRadius: 16, padding: 14, alignItems: 'center', gap: 6 },
  summaryValue: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  summaryLabel: { color: '#888', fontSize: 11, textAlign: 'center' },
  progressCard: { backgroundColor: '#1a1a1a', borderRadius: 16, padding: 16, marginBottom: 16 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  progressTitle: { color: '#fff', fontSize: 15, fontWeight: 'bold' },
  progressPercent: { color: '#00d4aa', fontSize: 15, fontWeight: 'bold' },
  progressBarBg: { height: 12, backgroundColor: '#2a2a2a', borderRadius: 6, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 6 },
  progressLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  progressLabel: { color: '#888', fontSize: 11 },
  chartCard: { backgroundColor: '#1a1a1a', borderRadius: 16, padding: 16, marginBottom: 16 },
  chartTitle: { color: '#fff', fontSize: 15, fontWeight: 'bold', marginBottom: 16 },
  chartArea: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-around', height: 160 },
  barGroup: { alignItems: 'center', gap: 4, flex: 1 },
  barValue: { color: '#888', fontSize: 9 },
  barBg: { width: 24, height: 120, backgroundColor: '#2a2a2a', borderRadius: 6, justifyContent: 'flex-end', overflow: 'hidden' },
  barFill: { width: '100%', borderRadius: 6 },
  barDate: { color: '#888', fontSize: 9 },
  chartLegend: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { color: '#888', fontSize: 12 },
  scoreCard: { backgroundColor: '#1a1a1a', borderRadius: 16, padding: 16, marginBottom: 16 },
  scoreBars: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-around', height: 120 },
  scoreBarGroup: { alignItems: 'center', gap: 4, flex: 1 },
  scoreValue: { fontSize: 9, fontWeight: 'bold' },
  scoreBarBg: { width: 24, height: 80, backgroundColor: '#2a2a2a', borderRadius: 6, justifyContent: 'flex-end', overflow: 'hidden' },
  scoreBarFill: { width: '100%', borderRadius: 6 },
  sectionTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  sessionList: { gap: 10 },
  sessionRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a1a1a', borderRadius: 12, padding: 14, gap: 12, overflow: 'hidden' },
  sessionDate: { width: 60 },
  sessionDateText: { color: '#888', fontSize: 13 },
  sessionAngle: { width: 48 },
  sessionAngleText: { fontSize: 15, fontWeight: 'bold' },
  sessionScoreBox: { width: 40 },
  sessionScoreText: { fontSize: 13, fontWeight: 'bold' },
  sessionBarBg: { flex: 1, height: 6, backgroundColor: '#2a2a2a', borderRadius: 3, overflow: 'hidden' },
  sessionBarFill: { height: '100%', borderRadius: 3 },
});