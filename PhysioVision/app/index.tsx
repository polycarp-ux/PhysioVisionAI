import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, ActivityIndicator } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React from 'react';

const { width } = Dimensions.get('window');

interface Session {
  id: string;
  exerciseName: string;
  date: string;
  formScore: number;
  duration: string;
}

export default function HomeScreen() {
  const router = useRouter();

  // State Management
  const [loading, setLoading] = useState(true);
  const [largeText, setLargeText] = useState(false);
  const [highContrast, setHighContrast] = useState(false);
  const [userRole, setUserRole] = useState('patient');
  const [disabilities, setDisabilities] = useState<string[]>([]);

  // Dynamic Dashboard Stats
  const [streak, setStreak] = useState(0);
  const [totalSessions, setTotalSessions] = useState(0);
  const [avgScore, setAvgScore] = useState(0);
  const [recentSession, setRecentSession] = useState<Session | null>(null);

  // 1. Core Onboarding & Settings Check
  useEffect(() => {
    const checkOnboarding = async () => {
      try {
        const onboardingComplete = await AsyncStorage.getItem('onboardingComplete');
        if (onboardingComplete !== 'true') {
          // If onboarding isn't complete, force redirect to onboarding immediately
          router.replace('/onboarding');
        }
      } catch (error) {
        console.error('Error checking onboarding status:', error);
      }
    };
    checkOnboarding();
  }, []);

  // 2. Load Dashboard Stats & Accessibility Preferences
  useFocusEffect(
    React.useCallback(() => {
      const loadDashboardData = async () => {
        try {
          const savedLargeText = await AsyncStorage.getItem('largeText');
          const savedHighContrast = await AsyncStorage.getItem('highContrast');
          const savedRole = await AsyncStorage.getItem('userRole');
          const savedDisabilities = await AsyncStorage.getItem('disabilities');

          setLargeText(savedLargeText ? JSON.parse(savedLargeText) : false);
          setHighContrast(savedHighContrast ? JSON.parse(savedHighContrast) : false);
          setUserRole(savedRole || 'patient');
          setDisabilities(savedDisabilities ? JSON.parse(savedDisabilities) : []);

          const rawSessions = await AsyncStorage.getItem('physio_sessions');
          if (rawSessions) {
            const sessions: Session[] = JSON.parse(rawSessions);
            setTotalSessions(sessions.length);

            if (sessions.length > 0) {
              const sumScores = sessions.reduce((acc, curr) => acc + (curr.formScore || 0), 0);
              setAvgScore(Math.round(sumScores / sessions.length));
              setRecentSession(sessions[sessions.length - 1]);
              setStreak(calculateStreak(sessions));
            } else {
              setAvgScore(0);
              setStreak(0);
              setRecentSession(null);
            }
          } else {
            setTotalSessions(0);
            setAvgScore(0);
            setStreak(0);
            setRecentSession(null);
          }
        } catch (error) {
          console.error('Error loading dashboard stats:', error);
        } finally {
          setLoading(false);
        }
      };

      loadDashboardData();
    }, [])
  );

  const calculateStreak = (sessions: Session[]): number => {
    if (!sessions || sessions.length === 0) return 0;

    const uniqueDates = Array.from(
      new Set(
        sessions.map((s) => {
          const parts = s.date.split('/');
          if (parts.length === 3) {
            return `${parts[2]}-${parts[1]}-${parts[0]}`;
          }
          return new Date(s.date).toISOString().split('T')[0];
        })
      )
    ).map((dateStr) => new Date(dateStr))
     .sort((a: any, b: any) => b - a);

    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const latestSessionDate = uniqueDates[0];
    latestSessionDate.setHours(0, 0, 0, 0);

    if (latestSessionDate.getTime() !== today.getTime() && latestSessionDate.getTime() !== yesterday.getTime()) {
      return 0;
    }

    let currentCheckDate = latestSessionDate;
    streak = 1;

    for (let i = 1; i < uniqueDates.length; i++) {
      const nextDate = uniqueDates[i];
      nextDate.setHours(0, 0, 0, 0);

      const expectedPrevDate = new Date(currentCheckDate);
      expectedPrevDate.setDate(expectedPrevDate.getDate() - 1);

      if (nextDate.getTime() === expectedPrevDate.getTime()) {
        streak++;
        currentCheckDate = nextDate;
      } else if (nextDate.getTime() < expectedPrevDate.getTime()) {
        break;
      }
    }

    return streak;
  };

  const theme = {
    background: '#0a0a0a',
    cardBackground: '#1a1a1a',
    cardBorder: highContrast ? '#ffffff' : '#2a2a2a',
    accentColor: '#00d4aa', // Emerald teal
    textColor: '#ffffff',
    subTextColor: '#888888',
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={theme.accentColor} />
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]} showsVerticalScrollIndicator={false}>
      
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.greeting, { color: theme.subTextColor }, largeText && { fontSize: 16 }]}>Welcome </Text>
          <Text style={[styles.appName, largeText && { fontSize: 32 }]}>PhysioVision AI</Text>
        </View>
        <TouchableOpacity onPress={() => router.push('/profile')}>
          <View style={[styles.avatar, { borderColor: theme.accentColor, backgroundColor: theme.cardBackground }]}>
            <Ionicons name="person" size={largeText ? 28 : 24} color={theme.accentColor} />
          </View>
        </TouchableOpacity>
      </View>

      {/* Start Session Card */}
      <TouchableOpacity 
        style={[styles.startCard, { backgroundColor: theme.accentColor }, largeText && { padding: 28 }]} 
        onPress={() => router.push('/analysis')}
      >
        <View style={styles.startCardContent}>
          <Ionicons name="body" size={largeText ? 48 : 40} color="#0a0a0a" />
          <View style={styles.startCardText}>
            <Text style={[styles.startCardTitle, largeText && { fontSize: 26 }]}>Start Session</Text>
            <Text style={[styles.startCardSub, largeText && { fontSize: 16 }]}>Real-time motion analysis</Text>
          </View>
          <Ionicons name="arrow-forward-circle" size={largeText ? 38 : 32} color="#0a0a0a" />
        </View>
      </TouchableOpacity>

      {/* Quick Stats Grid */}
      <View style={styles.statsRow}>
        
        {/* Day Streak */}
        <View style={[styles.statCard, { backgroundColor: theme.cardBackground, borderWidth: highContrast ? 1 : 0, borderColor: theme.cardBorder }]}>
          <Ionicons name="flame" size={largeText ? 28 : 24} color="#ff6b35" />
          <Text style={[styles.statNumber, largeText && { fontSize: 28 }]}>{streak}</Text>
          <Text style={[styles.statLabel, { color: theme.subTextColor }, largeText && { fontSize: 14 }]}>Day Streak</Text>
        </View>

        {/* Total Sessions */}
        <View style={[styles.statCard, { backgroundColor: theme.cardBackground, borderWidth: highContrast ? 1 : 0, borderColor: theme.cardBorder }]}>
          <Ionicons name="checkmark-circle" size={largeText ? 28 : 24} color={theme.accentColor} />
          <Text style={[styles.statNumber, largeText && { fontSize: 28 }]}>{totalSessions}</Text>
          <Text style={[styles.statLabel, { color: theme.subTextColor }, largeText && { fontSize: 14 }]}>Sessions</Text>
        </View>

        {/* Avg Score */}
        <View style={[styles.statCard, { backgroundColor: theme.cardBackground, borderWidth: highContrast ? 1 : 0, borderColor: theme.cardBorder }]}>
          <Ionicons name="star" size={largeText ? 28 : 24} color="#ffd700" />
          <Text style={[styles.statNumber, largeText && { fontSize: 28 }]}>{avgScore}%</Text>
          <Text style={[styles.statLabel, { color: theme.subTextColor }, largeText && { fontSize: 14 }]}>Avg Score</Text>
        </View>

      </View>

      {/* Quick Actions */}
      <Text style={[styles.sectionTitle, largeText && { fontSize: 22 }]}>Quick Actions</Text>
      <View style={styles.quickActions}>
        <TouchableOpacity style={[styles.actionCard, { backgroundColor: theme.cardBackground }]} onPress={() => router.push('/library')}>
          <Ionicons name="library" size={largeText ? 32 : 28} color={theme.accentColor} />
          <Text style={[styles.actionLabel, { color: theme.subTextColor }, largeText && { fontSize: 13 }]}>Exercise Library</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.actionCard, { backgroundColor: theme.cardBackground }]} onPress={() => router.push('/history')}>
          <Ionicons name="time" size={largeText ? 32 : 28} color={theme.accentColor} />
          <Text style={[styles.actionLabel, { color: theme.subTextColor }, largeText && { fontSize: 13 }]}>Session History</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.actionCard, { backgroundColor: theme.cardBackground }]} onPress={() => router.push('/profile')}>
          <Ionicons name="settings" size={largeText ? 32 : 28} color={theme.accentColor} />
          <Text style={[styles.actionLabel, { color: theme.subTextColor }, largeText && { fontSize: 13 }]}>Profile & Settings</Text>
        </TouchableOpacity>
      </View>

      {/* Clinical Tools */}
      <Text style={[styles.sectionTitle, largeText && { fontSize: 22 }]}>Clinical Tools</Text>
      <View style={styles.quickActions}>
        <TouchableOpacity style={[styles.actionCard, { backgroundColor: theme.cardBackground }]} onPress={() => router.push('/rehab')}>
          <Ionicons name="medical" size={largeText ? 32 : 28} color="#ff6b35" />
          <Text style={[styles.actionLabel, { color: theme.subTextColor }, largeText && { fontSize: 13 }]}>Rehab Programs</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.actionCard, { backgroundColor: theme.cardBackground }]} onPress={() => router.push('/romtracker')}>
          <Ionicons name="trending-up" size={largeText ? 32 : 28} color="#a855f7" />
          <Text style={[styles.actionLabel, { color: theme.subTextColor }, largeText && { fontSize: 13 }]}>ROM Tracker</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.actionCard, { backgroundColor: theme.cardBackground }]} onPress={() => router.push('/report')}>
          <Ionicons name="document-text" size={largeText ? 32 : 28} color="#ffd700" />
          <Text style={[styles.actionLabel, { color: theme.subTextColor }, largeText && { fontSize: 13 }]}>Progress Report</Text>
        </TouchableOpacity>
      </View>

      {/* Therapist Tools */}
      {userRole === 'therapist' && (
        <>
          <Text style={[styles.sectionTitle, largeText && { fontSize: 22 }]}>Therapist Tools</Text>
          <View style={styles.quickActions}>
            <TouchableOpacity style={[styles.actionCard, { backgroundColor: theme.cardBackground }]} onPress={() => router.push('/therapist')}>
              <Ionicons name="people" size={largeText ? 32 : 28} color="#00bfff" />
              <Text style={[styles.actionLabel, { color: theme.subTextColor }, largeText && { fontSize: 13 }]}>Patient Dashboard</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={[styles.actionCard, { backgroundColor: theme.cardBackground }]} onPress={() => router.push('/report')}>
              <Ionicons name="share" size={largeText ? 32 : 28} color="#2ed573" />
              <Text style={[styles.actionLabel, { color: theme.subTextColor }, largeText && { fontSize: 13 }]}>Share Report</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={[styles.actionCard, { backgroundColor: theme.cardBackground }]} onPress={() => router.push('/romtracker')}>
              <Ionicons name="analytics" size={largeText ? 32 : 28} color="#ff6b35" />
              <Text style={[styles.actionLabel, { color: theme.subTextColor }, largeText && { fontSize: 13 }]}>ROM Analysis</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      {/* Dynamic Recent Activity Card */}
      <Text style={[styles.sectionTitle, largeText && { fontSize: 22 }]}>Recent Activity</Text>
      {recentSession ? (
        <TouchableOpacity 
          style={[styles.recentSessionCard, { backgroundColor: theme.cardBackground, borderLeftColor: theme.accentColor }]}
          onPress={() => router.push('/history')}
        >
          <View style={styles.recentSessionInfo}>
            <Ionicons name="analytics-outline" size={24} color={theme.accentColor} />
            <View>
              <Text style={[styles.recentSessionTitle, largeText && { fontSize: 18 }]}>{recentSession.exerciseName}</Text>
              <Text style={[styles.recentSessionSub, { color: theme.subTextColor }, largeText && { fontSize: 14 }]}>
                {recentSession.date} • {recentSession.duration}
              </Text>
            </View>
          </View>
          <View style={[styles.scoreBadge, { backgroundColor: theme.accentColor + '20' }]}>
            <Text style={[styles.scoreBadgeText, { color: theme.accentColor }]}>{recentSession.formScore}%</Text>
          </View>
        </TouchableOpacity>
      ) : (
        <View style={[styles.emptyCard, { backgroundColor: theme.cardBackground }]}>
          <Ionicons name="analytics-outline" size={48} color="#333" />
          <Text style={[styles.emptyText, largeText && { fontSize: 18 }]}>No sessions yet</Text>
          <Text style={[styles.emptySubText, { color: theme.subTextColor }, largeText && { fontSize: 15 }]}>
            Start your first session to see activity here
          </Text>
        </View>
      )}

      {/* Care Modes Helper Panel */}
      <Text style={[styles.sectionTitle, largeText && { fontSize: 22 }]}>Care Modes</Text>
      <View style={styles.quickActions}>
        <TouchableOpacity style={[styles.actionCard, { backgroundColor: theme.cardBackground }]} onPress={() => router.push(userRole === 'elderly' ? '/elderly' : '/rehab')}>
          <Ionicons name="heart" size={largeText ? 32 : 28} color="#ff6b35" />
          <Text style={[styles.actionLabel, { color: theme.subTextColor }, largeText && { fontSize: 13 }]}>Elderly Mode</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.actionCard, { backgroundColor: theme.cardBackground }]} onPress={() => router.push('/rehab')}>
          <Ionicons name="accessibility" size={largeText ? 32 : 28} color="#a855f7" />
          <Text style={[styles.actionLabel, { color: theme.subTextColor }, largeText && { fontSize: 13 }]}>Disability Mode</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.actionCard, { backgroundColor: theme.cardBackground }]} onPress={() => router.push('/onboarding')}>
          <Ionicons name="refresh" size={largeText ? 32 : 28} color="#00bfff" />
          <Text style={[styles.actionLabel, { color: theme.subTextColor }, largeText && { fontSize: 13 }]}>Reset Profile</Text>
        </TouchableOpacity>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 60, paddingBottom: 20 },
  greeting: { fontSize: 14 },
  appName: { color: '#ffffff', fontSize: 24, fontWeight: 'bold' },
  avatar: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
  startCard: { borderRadius: 20, padding: 24, marginBottom: 20 },
  startCardContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  startCardText: { flex: 1, marginLeft: 16 },
  startCardTitle: { color: '#0a0a0a', fontSize: 22, fontWeight: 'bold' },
  startCardSub: { color: '#0a0a0a', fontSize: 14, marginTop: 4 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 28 },
  statCard: { flex: 1, borderRadius: 16, padding: 16, alignItems: 'center', marginHorizontal: 4 },
  statNumber: { color: '#ffffff', fontSize: 22, fontWeight: 'bold', marginTop: 8 },
  statLabel: { fontSize: 12, marginTop: 4 },
  sectionTitle: { color: '#ffffff', fontSize: 18, fontWeight: 'bold', marginBottom: 16 },
  quickActions: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 28 },
  actionCard: { flex: 1, borderRadius: 16, padding: 16, alignItems: 'center', marginHorizontal: 4 },
  actionLabel: { fontSize: 11, marginTop: 8, textAlign: 'center' },
  emptyCard: { borderRadius: 16, padding: 32, alignItems: 'center' },
  emptyText: { color: '#ffffff', fontSize: 16, fontWeight: 'bold', marginTop: 16 },
  emptySubText: { fontSize: 13, marginTop: 8, textAlign: 'center' },
  recentSessionCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: 16, padding: 16, borderLeftWidth: 4, marginBottom: 28 },
  recentSessionInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  recentSessionTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  recentSessionSub: { fontSize: 12, marginTop: 2 },
  scoreBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  scoreBadgeText: { fontWeight: 'bold', fontSize: 14 },
});