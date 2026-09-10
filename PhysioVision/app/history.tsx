import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';
import { getExerciseSessions, getStoredUser } from '../utils/api';
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
  const [totalReps, setTotalReps] = useState(0);
  const [totalMinutes, setTotalMinutes] = useState(0);
  const [avgForm, setAvgForm] = useState(0);

  const calculateStats = (items: WorkoutSession[]) => {
    if (items.length === 0) {
      setTotalReps(0);
      setTotalMinutes(0);
      setAvgForm(0);
      return;
    }

    const reps = items.reduce((total, item) => total + item.reps, 0);
    const seconds = items.reduce((total, item) => total + item.duration, 0);
    const form = items.reduce((total, item) => total + item.formScore, 0);

    setTotalReps(reps);
    setTotalMinutes(Math.round(seconds / 60));
    setAvgForm(Math.round(form / items.length));
  };

  const loadSessions = useCallback(async () => {
    try {
      setLoading(true);

      const user = await getStoredUser();
      if (user?.uid) {
        try {
          const cloudSessions = await getExerciseSessions(user.uid);
          const normalized = cloudSessions.map((session) => ({
            id: session.id || `${session.exercise_id || 'session'}-${Date.now()}`,
            exerciseId: session.exercise_id || 'exercise',
            exerciseName: session.exercise_name || 'Exercise session',
            reps: Number.isFinite(session.reps) ? session.reps : 0,
            duration: Number.isFinite(session.duration_seconds) ? session.duration_seconds : 0,
            formScore: Number.isFinite(session.accuracy_score) ? session.accuracy_score : 0,
            date: session.created_at
              ? new Date(session.created_at).toLocaleDateString('en-GB')
              : 'Recently',
          }));
          setSessions(normalized);
          calculateStats(normalized);
          return;
        } catch (cloudError) {
          console.warn('Cloud history unavailable; showing local history.', cloudError);
        }
      }

      const storedData = await AsyncStorage.getItem('physio_sessions');

      if (!storedData) {
        setSessions([]);
        calculateStats([]);
        return;
      }

      const parsedSessions: WorkoutSession[] = JSON.parse(storedData);

      setSessions(parsedSessions);
      calculateStats(parsedSessions);
    } catch (error) {
      console.error('Failed to load session history:', error);
      setSessions([]);
      calculateStats([]);
    } finally {
      setLoading(false);
    }
  }, []);

  async function clearHistory() {
    try {
      await AsyncStorage.removeItem('physio_sessions');
      setSessions([]);
      calculateStats([]);
    } catch (error) {
      console.error('Failed to clear session history:', error);
    }
  }

  function confirmClear() {
    clearHistory();
  }

  function formatDuration(seconds: number) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    }

    return `${remainingSeconds}s`;
  }

  useFocusEffect(
    useCallback(() => {
      void loadSessions();
    }, [loadSessions])
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00d4aa" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Session History</Text>

        {sessions.length > 0 && (
          <TouchableOpacity
            onPress={confirmClear}
            style={styles.clearButton}
          >
            <Ionicons name="trash-outline" size={16} color="#ff4757" />
            <Text style={styles.clearButtonText}>Clear</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.metricsRow}>
        <View style={styles.metricCard}>
          <Text style={styles.metricValue}>{totalReps}</Text>
          <Text style={styles.metricLabel}>TOTAL REPS</Text>
        </View>

        <View style={styles.metricCard}>
          <Text style={styles.metricValue}>{totalMinutes}m</Text>
          <Text style={styles.metricLabel}>ACTIVE TIME</Text>
        </View>

        <View style={styles.metricCard}>
          <Text
            style={[
              styles.metricValue,
              { color: avgForm >= 80 ? '#00d4aa' : '#ff6b35' },
            ]}
          >
            {avgForm}%
          </Text>
          <Text style={styles.metricLabel}>AVG FORM</Text>
        </View>
      </View>

      {sessions.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="calendar-outline" size={52} color="#444" />
          <Text style={styles.emptyTitle}>No sessions yet</Text>
          <Text style={styles.emptyText}>
            Completed exercises will appear here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={sessions}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => {
            const goodForm = item.formScore >= 80;

            return (
              <View style={styles.sessionCard}>
                <View style={styles.cardHeader}>
                  <View style={styles.exerciseRow}>
                    <Ionicons
                      name={
                        item.exerciseId.includes('curl') ||
                        item.exerciseId.includes('press')
                          ? 'barbell-outline'
                          : 'body-outline'
                      }
                      size={18}
                      color="#00d4aa"
                    />

                    <Text style={styles.exerciseName}>
                      {item.exerciseName}
                    </Text>
                  </View>

                  <Text style={styles.date}>{item.date}</Text>
                </View>

                <View style={styles.statsRow}>
                  <View style={styles.stat}>
                    <Text style={styles.statValue}>{item.reps}</Text>
                    <Text style={styles.statLabel}>REPS</Text>
                  </View>

                  <View style={styles.stat}>
                    <Text style={styles.statValue}>
                      {formatDuration(item.duration)}
                    </Text>
                    <Text style={styles.statLabel}>DURATION</Text>
                  </View>

                  <View style={[styles.stat, styles.divider]}>
                    <Text
                      style={[
                        styles.statValue,
                        { color: goodForm ? '#00d4aa' : '#ff4757' },
                      ]}
                    >
                      {item.formScore}%
                    </Text>
                    <Text style={styles.statLabel}>ACCURACY</Text>
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
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    paddingTop: 60,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0a0a0a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 18,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 71, 87, 0.12)',
  },
  clearButtonText: {
    color: '#ff4757',
    fontSize: 12,
    fontWeight: 'bold',
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  metricCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 15,
    borderRadius: 12,
    backgroundColor: '#141414',
    borderWidth: 1,
    borderColor: '#252525',
  },
  metricValue: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  metricLabel: {
    color: '#888',
    fontSize: 9,
    fontWeight: '600',
    marginTop: 5,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 12,
  },
  sessionCard: {
    padding: 15,
    borderRadius: 12,
    backgroundColor: '#141414',
    borderWidth: 1,
    borderColor: '#252525',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#252525',
  },
  exerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  exerciseName: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  date: {
    color: '#777',
    fontSize: 11,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stat: {
    flex: 1,
  },
  divider: {
    paddingLeft: 14,
    borderLeftWidth: 1,
    borderLeftColor: '#252525',
  },
  statValue: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  statLabel: {
    color: '#777',
    fontSize: 10,
    marginTop: 3,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 35,
  },
  emptyTitle: {
    color: '#fff',
    fontSize: 17,
    fontWeight: 'bold',
    marginTop: 14,
  },
  emptyText: {
    color: '#777',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 7,
  },
});