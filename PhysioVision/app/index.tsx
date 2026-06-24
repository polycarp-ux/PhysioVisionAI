import { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function HomeScreen() {
  const router = useRouter();

  // Temporary: clear onboarding so we can test it
  useEffect(() => {
    AsyncStorage.removeItem('onboardingComplete');
  }, []);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome back 👋</Text>
          <Text style={styles.appName}>PhysioVision AI</Text>
        </View>
        <TouchableOpacity onPress={() => router.push('/profile')}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={24} color="#00d4aa" />
          </View>
        </TouchableOpacity>
      </View>

      {/* Start Session Card */}
      <TouchableOpacity style={styles.startCard} onPress={() => router.push('/analysis')}>
        <View style={styles.startCardContent}>
          <Ionicons name="body" size={40} color="#0a0a0a" />
          <View style={styles.startCardText}>
            <Text style={styles.startCardTitle}>Start Session</Text>
            <Text style={styles.startCardSub}>Real-time motion analysis</Text>
          </View>
          <Ionicons name="arrow-forward-circle" size={32} color="#0a0a0a" />
        </View>
      </TouchableOpacity>

      {/* Quick Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Ionicons name="flame" size={24} color="#ff6b35" />
          <Text style={styles.statNumber}>0</Text>
          <Text style={styles.statLabel}>Day Streak</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="checkmark-circle" size={24} color="#00d4aa" />
          <Text style={styles.statNumber}>0</Text>
          <Text style={styles.statLabel}>Sessions</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="star" size={24} color="#ffd700" />
          <Text style={styles.statNumber}>0%</Text>
          <Text style={styles.statLabel}>Avg Score</Text>
        </View>
      </View>

      {/* Quick Actions */}
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.quickActions}>
        <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/library')}>
          <Ionicons name="library" size={28} color="#00d4aa" />
          <Text style={styles.actionLabel}>Exercise Library</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/history')}>
          <Ionicons name="time" size={28} color="#00d4aa" />
          <Text style={styles.actionLabel}>Session History</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/profile')}>
          <Ionicons name="settings" size={28} color="#00d4aa" />
          <Text style={styles.actionLabel}>Profile & Settings</Text>
        </TouchableOpacity>
      </View>

      {/* Clinical Tools */}
      <Text style={styles.sectionTitle}>Clinical Tools</Text>
      <View style={styles.quickActions}>
        <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/rehab')}>
          <Ionicons name="medical" size={28} color="#ff6b35" />
          <Text style={styles.actionLabel}>Rehab Programs</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/romtracker')}>
          <Ionicons name="trending-up" size={28} color="#a855f7" />
          <Text style={styles.actionLabel}>ROM Tracker</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/report')}>
          <Ionicons name="document-text" size={28} color="#ffd700" />
          <Text style={styles.actionLabel}>Progress Report</Text>
        </TouchableOpacity>
      </View>
      {/* Therapist Tools */}
<Text style={styles.sectionTitle}>Therapist Tools</Text>
<View style={styles.quickActions}>
  <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/therapist')}>
    <Ionicons name="people" size={28} color="#00bfff" />
    <Text style={styles.actionLabel}>Patient Dashboard</Text>
  </TouchableOpacity>
  <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/report')}>
    <Ionicons name="share" size={28} color="#2ed573" />
    <Text style={styles.actionLabel}>Share Report</Text>
  </TouchableOpacity>
  <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/romtracker')}>
    <Ionicons name="analytics" size={28} color="#ff6b35" />
    <Text style={styles.actionLabel}>ROM Analysis</Text>
  </TouchableOpacity>
</View>

      {/* Recent Activity */}
      <Text style={styles.sectionTitle}>Recent Activity</Text>
      <View style={styles.emptyCard}>
        <Ionicons name="analytics-outline" size={48} color="#333" />
        <Text style={styles.emptyText}>No sessions yet</Text>
        <Text style={styles.emptySubText}>Start your first session to see activity here</Text>
      </View>
      {/* Care Modes */}
<Text style={styles.sectionTitle}>Care Modes</Text>
<View style={styles.quickActions}>
  <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/elderly')}>
    <Ionicons name="heart" size={28} color="#ff6b35" />
    <Text style={styles.actionLabel}>Elderly Mode</Text>
  </TouchableOpacity>
  <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/rehab')}>
    <Ionicons name="accessibility" size={28} color="#a855f7" />
    <Text style={styles.actionLabel}>Disability Mode</Text>
  </TouchableOpacity>
  <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/onboarding')}>
    <Ionicons name="refresh" size={28} color="#00bfff" />
    <Text style={styles.actionLabel}>Reset Profile</Text>
  </TouchableOpacity>
</View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a', paddingHorizontal: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 60, paddingBottom: 20 },
  greeting: { color: '#888', fontSize: 14 },
  appName: { color: '#ffffff', fontSize: 24, fontWeight: 'bold' },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#1a1a1a', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#00d4aa' },
  startCard: { backgroundColor: '#00d4aa', borderRadius: 20, padding: 24, marginBottom: 20 },
  startCardContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  startCardText: { flex: 1, marginLeft: 16 },
  startCardTitle: { color: '#0a0a0a', fontSize: 22, fontWeight: 'bold' },
  startCardSub: { color: '#0a0a0a', fontSize: 14, marginTop: 4 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 28 },
  statCard: { flex: 1, backgroundColor: '#1a1a1a', borderRadius: 16, padding: 16, alignItems: 'center', marginHorizontal: 4 },
  statNumber: { color: '#ffffff', fontSize: 22, fontWeight: 'bold', marginTop: 8 },
  statLabel: { color: '#888', fontSize: 12, marginTop: 4 },
  sectionTitle: { color: '#ffffff', fontSize: 18, fontWeight: 'bold', marginBottom: 16 },
  quickActions: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 28 },
  actionCard: { flex: 1, backgroundColor: '#1a1a1a', borderRadius: 16, padding: 16, alignItems: 'center', marginHorizontal: 4 },
  actionLabel: { color: '#888', fontSize: 11, marginTop: 8, textAlign: 'center' },
  emptyCard: { backgroundColor: '#1a1a1a', borderRadius: 16, padding: 32, alignItems: 'center' },
  emptyText: { color: '#ffffff', fontSize: 16, fontWeight: 'bold', marginTop: 16 },
  emptySubText: { color: '#888', fontSize: 13, marginTop: 8, textAlign: 'center' },
});