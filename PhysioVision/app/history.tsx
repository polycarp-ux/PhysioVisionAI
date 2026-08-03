import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useIsFocused } from '@react-navigation/native';

interface WorkoutSession {
  id: string;
  exerciseId: string;
  exerciseName: string;
  reps: number;
  duration: number;
  formScore: number;
  date: string;
}

export default function HistoryScreen() {
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [loading, setLoading] = useState(true);
  const isFocused = useIsFocused(); // Automatically refreshes data when clicking onto this tab

  // Aggregate Metrics State
  const [totalReps, setTotalReps] = useState(0);
  const [totalMinutes, setTotalMinutes] = useState(0);
  const [avgForm, setAvgForm] = useState(100);

  useEffect(() => {
    if (isFocused) {
      loadSessions();
    }
  }, [isFocused]);

  const loadSessions = async () => {
    try {
      setLoading(true);
      const data = await AsyncStorage.getItem('physio_sessions');
      if (data) {
        const parsedSessions: WorkoutSession[] = JSON.parse(data);
        setSessions(parsedSessions);
        calculateStats(parsedSessions);
      } else {
        setSessions([]);
        calculateStats([]);
      }
    } catch (error) {
      console.error('Failed to parse history data logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (allSessions: WorkoutSession[]) => {
    if (allSessions.length === 0) {
      setTotalReps(0);
      setTotalMinutes(0);
      setAvgForm(100);
      return;
    }

    let repsAccumulator = 0;
    let secondsAccumulator = 0;
    let formScoreAccumulator = 0;

    allSessions.forEach(s => {
      repsAccumulator += s.reps;
      secondsAccumulator += s.duration;
      formScoreAccumulator += s.formScore;
    });

    setTotalReps(repsAccumulator);
    setTotalMinutes(Math.round(secondsAccumulator / 60));
    setAvgForm(Math.round(formScoreAccumulator / allSessions.length));
  };

  const clearHistoryLog = async () => {
    try {
      await AsyncStorage.removeItem('physio_sessions');
      setSessions([]);
      calculateStats([]);
    } catch (error) {
      console.error('Error clearing data logs:', error);
    }
  };

  const formatDuration = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color="#00d4aa" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header section with wipe action button */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Therapy History</Text>
        {sessions.length > 0 && (
          <TouchableOpacity onPress={clearHistoryLog} style={styles.clearBtn}>
            <Ionicons name="trash-outline" size={16} color="#ff4757" />
            <Text style={styles.clearBtnText}>Clear</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Aggregate Performance Cards Layout Panel */}
      <View style={styles.metricsPanel}>
        <View style={styles.metricCard}>
          <Text style={styles.metricVal}>{totalReps}</Text>
          <Text style={styles.metricLbl}>TOTAL REPS</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricVal}>{totalMinutes}m</Text>
          <Text style={styles.metricLbl}>ACTIVE TIME</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={[styles.metricVal, { color: avgForm >= 80 ? '#00d4aa' : '#ff6b35' }]}>{avgForm}%</Text>
          <Text style={styles.metricLbl}>AVG FORM</Text>
        </View>
      </View>

      {/* Sessions Rendering List */}
      {sessions.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="calendar-outline" size={48} color="#444" />
          <Text style={styles.emptyText}>No tracking profiles logged yet.</Text>
          <Text style={styles.emptySubText}>Completed exercises from your Analysis panel show up here.</Text>
        </View>
      ) : (
        <FlatList
          data={sessions}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => {
            const isExcellentForm = item.formScore >= 80;
            return (
              <View style={styles.sessionCard}>
                <View style={styles.cardHeader}>
                  <View style={styles.exerciseTitleRow}>
                    <Ionicons 
                      name={item.exerciseId.includes('curl') || item.exerciseId.includes('press') ? "barbell-outline" : "body-outline"} 
                      size={16} 
                      color="#00d4aa" 
                    />
                    <Text style={styles.exerciseNameText}>{item.exerciseName}</Text>
                  </View>
                  <Text style={styles.dateText}>{item.date}</Text>
                </View>

                <View style={styles.cardStatsRow}>
                  <View style={styles.subStat}>
                    <Text style={styles.subStatVal}>{item.reps}</Text>
                    <Text style={styles.subStatLbl}>Reps Completed</Text>
                  </View>
                  <View style={styles.subStat}>
                    <Text style={styles.subStatVal}>{formatDuration(item.duration)}</Text>
                    <Text style={styles.subStatLbl}>Duration</Text>
                  </View>
                  <View style={[styles.subStat, styles.borderLeft]}>
                    <Text style={[styles.subStatVal, { color: isExcellentForm ? '#00d4aa' : '#ff4757' }]}>
                      {item.formScore}%
                    </Text>
                    <Text style={styles.subStatLbl}>Accuracy</Text>
                  </View>
                </View>
              </View>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a', paddingTop: 60 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 16 },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  clearBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 4, paddingHorizontal: 8, borderRadius: 8, backgroundColor: 'rgba(255, 71, 87, 0.1)' },
  clearBtnText: { color: '#ff4757', fontSize: 12, fontWeight: '600' },
  metricsPanel: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, gap: 10, marginBottom: 20 },
  metricCard: { flex: 1, backgroundColor: '#141414', borderRadius: 12, paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: '#222' },
  metricVal: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  metricLbl: { color: '#888', fontSize: 9, fontWeight: '600', marginTop: 4, letterSpacing: 0.5 },
  listContent: { paddingHorizontal: 20, paddingBottom: 40, gap: 12 },
  sessionCard: { backgroundColor: '#141414', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#222' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderColor: '#222', paddingBottom: 10, marginBottom: 12 },
  exerciseTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  exerciseNameText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  dateText: { color: '#666', fontSize: 11 },
  cardStatsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  subStat: { flex: 1, alignItems: 'flex-start' },
  borderLeft: { borderLeftWidth: 1, borderColor: '#222', paddingLeft: 12, flex: 0.8 },
  subStatVal: { color: '#fff', fontSize: 15, fontWeight: 'bold' },
  subStatLbl: { color: '#666', fontSize: 10, marginTop: 2 },
  emptyContainer: { flex: 0.7, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
  emptyText: { color: '#fff', fontSize: 15, fontWeight: 'bold', marginTop: 12 },
  emptySubText: { color: '#666', fontSize: 12, textAlign: 'center', marginTop: 6, lineHeight: 16 }
});