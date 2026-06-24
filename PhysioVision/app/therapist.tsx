import { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, TextInput
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const PATIENTS = [
  {
    id: '1',
    name: 'Kwame Asante',
    age: 45,
    condition: 'Knee Recovery',
    program: 'Knee Recovery',
    progress: 78,
    lastSession: 'Today',
    sessionsCompleted: 12,
    totalSessions: 18,
    formScore: 85,
    status: 'active',
    alert: false,
    romImprovement: '+83°',
    notes: 'Patient showing excellent progress. Knee flexion improving steadily.',
  },
  {
    id: '2',
    name: 'Abena Mensah',
    age: 62,
    condition: 'Hip Fracture Recovery',
    program: 'Fall Prevention',
    progress: 45,
    lastSession: 'Yesterday',
    sessionsCompleted: 5,
    totalSessions: 18,
    formScore: 72,
    status: 'active',
    alert: true,
    romImprovement: '+28°',
    notes: 'Patient needs more attention on balance exercises.',
  },
  {
    id: '3',
    name: 'Kofi Boateng',
    age: 28,
    condition: 'Shoulder Injury',
    program: 'Shoulder Rehabilitation',
    progress: 90,
    lastSession: '2 days ago',
    sessionsCompleted: 14,
    totalSessions: 15,
    formScore: 94,
    status: 'active',
    alert: false,
    romImprovement: '+108°',
    notes: 'Nearly complete recovery. Excellent adherence to program.',
  },
  {
    id: '4',
    name: 'Ama Owusu',
    age: 71,
    condition: 'Lower Back Pain',
    program: 'Back Pain Relief',
    progress: 60,
    lastSession: '3 days ago',
    sessionsCompleted: 7,
    totalSessions: 12,
    formScore: 79,
    status: 'inactive',
    alert: true,
    romImprovement: '+42°',
    notes: 'Patient missed last 2 sessions. Follow up required.',
  },
  {
    id: '5',
    name: 'Yaw Darko',
    age: 35,
    condition: 'Post Stroke Recovery',
    program: 'Stroke Recovery',
    progress: 30,
    lastSession: 'Today',
    sessionsCompleted: 7,
    totalSessions: 24,
    formScore: 65,
    status: 'active',
    alert: false,
    romImprovement: '+15°',
    notes: 'Early stages of recovery. Slow but consistent progress.',
  },
];

const STATS = [
  { label: 'Total Patients', value: '5', icon: 'people', color: '#00d4aa' },
  { label: 'Active Today', value: '3', icon: 'pulse', color: '#2ed573' },
  { label: 'Need Attention', value: '2', icon: 'warning', color: '#ff4757' },
  { label: 'Avg Progress', value: '61%', icon: 'trending-up', color: '#a855f7' },
];

export default function TherapistScreen() {
  const [search, setSearch] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const router = useRouter();

  const FILTERS = ['All', 'Active', 'Inactive', 'Alerts'];

  const filtered = PATIENTS.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
                        p.condition.toLowerCase().includes(search.toLowerCase());
    const matchFilter = selectedFilter === 'All' ||
                        (selectedFilter === 'Active' && p.status === 'active') ||
                        (selectedFilter === 'Inactive' && p.status === 'inactive') ||
                        (selectedFilter === 'Alerts' && p.alert);
    return matchSearch && matchFilter;
  });

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return '#2ed573';
    if (progress >= 50) return '#ffd700';
    return '#ff4757';
  };

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
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>Therapist Dashboard</Text>
          <Text style={styles.headerSubtitle}>Dr. Mensah • KNUST Hospital</Text>
        </View>
        <TouchableOpacity style={styles.notifBtn}>
          <Ionicons name="notifications" size={24} color="#00d4aa" />
          <View style={styles.notifBadge}>
            <Text style={styles.notifBadgeText}>2</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Stats Row */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.statsScroll}
        contentContainerStyle={styles.statsScrollContent}
      >
        {STATS.map((stat) => (
          <View key={stat.label} style={styles.statCard}>
            <Ionicons name={stat.icon as any} size={24} color={stat.color} />
            <Text style={[styles.statValue, { color: stat.color }]}>{stat.value}</Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
          </View>
        ))}
      </ScrollView>

      {/* Alerts Banner */}
      <View style={styles.alertBanner}>
        <Ionicons name="warning" size={20} color="#ff4757" />
        <View style={styles.alertText}>
          <Text style={styles.alertTitle}>2 Patients Need Attention</Text>
          <Text style={styles.alertSubtitle}>Abena Mensah & Ama Owusu require follow-up</Text>
        </View>
        <TouchableOpacity onPress={() => setSelectedFilter('Alerts')}>
          <Text style={styles.alertAction}>View</Text>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchBox}>
        <Ionicons name="search" size={18} color="#888" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search patients..."
          placeholderTextColor="#888"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Filter Chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filterScrollContent}
      >
        {FILTERS.map((filter) => (
          <TouchableOpacity
            key={filter}
            style={[styles.filterChip, selectedFilter === filter && styles.filterChipActive]}
            onPress={() => setSelectedFilter(filter)}
          >
            <Text style={[styles.filterChipText, selectedFilter === filter && styles.filterChipTextActive]}>
              {filter}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Patient Count */}
      <Text style={styles.patientCount}>{filtered.length} Patients</Text>

      {/* Patient List */}
      <View style={styles.patientList}>
        {filtered.map((patient) => (
          <TouchableOpacity
            key={patient.id}
            style={[
              styles.patientCard,
              patient.alert && { borderColor: '#ff475733', borderWidth: 1 },
            ]}
            onPress={() => setExpandedId(expandedId === patient.id ? null : patient.id)}
          >
            {/* Card Header */}
            <View style={styles.cardHeader}>
              <View style={styles.patientAvatar}>
                <Text style={styles.patientAvatarText}>
                  {patient.name.split(' ').map(n => n[0]).join('')}
                </Text>
              </View>
              <View style={styles.patientInfo}>
                <View style={styles.nameRow}>
                  <Text style={styles.patientName}>{patient.name}</Text>
                  {patient.alert && (
                    <Ionicons name="warning" size={16} color="#ff4757" />
                  )}
                </View>
                <Text style={styles.patientCondition}>{patient.condition} • Age {patient.age}</Text>
                <Text style={styles.patientLastSession}>Last session: {patient.lastSession}</Text>
              </View>
              <View style={styles.cardRight}>
                <View style={[
                  styles.statusBadge,
                  { backgroundColor: patient.status === 'active' ? '#2ed57322' : '#ff475722' }
                ]}>
                  <Text style={[
                    styles.statusText,
                    { color: patient.status === 'active' ? '#2ed573' : '#ff4757' }
                  ]}>
                    {patient.status}
                  </Text>
                </View>
                <Ionicons
                  name={expandedId === patient.id ? 'chevron-up' : 'chevron-down'}
                  size={18}
                  color="#888"
                  style={{ marginTop: 8 }}
                />
              </View>
            </View>

            {/* Progress Bar */}
            <View style={styles.progressSection}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressLabel}>
                  Program: {patient.program}
                </Text>
                <Text style={[styles.progressPercent, { color: getProgressColor(patient.progress) }]}>
                  {patient.progress}%
                </Text>
              </View>
              <View style={styles.progressBarBg}>
                <View
                  style={[
                    styles.progressBarFill,
                    {
                      width: `${patient.progress}%`,
                      backgroundColor: getProgressColor(patient.progress),
                    },
                  ]}
                />
              </View>
              <Text style={styles.progressSessions}>
                {patient.sessionsCompleted} of {patient.totalSessions} sessions completed
              </Text>
            </View>

            {/* Expanded Content */}
            {expandedId === patient.id && (
              <View style={styles.expandedContent}>

                {/* Quick Stats */}
                <View style={styles.quickStats}>
                  <View style={styles.quickStat}>
                    <Ionicons name="star" size={16} color="#ffd700" />
                    <Text style={[styles.quickStatValue, { color: getScoreColor(patient.formScore) }]}>
                      {patient.formScore}%
                    </Text>
                    <Text style={styles.quickStatLabel}>Form Score</Text>
                  </View>
                  <View style={styles.quickStat}>
                    <Ionicons name="trending-up" size={16} color="#00d4aa" />
                    <Text style={styles.quickStatValue}>{patient.romImprovement}</Text>
                    <Text style={styles.quickStatLabel}>ROM Gain</Text>
                  </View>
                  <View style={styles.quickStat}>
                    <Ionicons name="calendar" size={16} color="#a855f7" />
                    <Text style={styles.quickStatValue}>
                      {patient.totalSessions - patient.sessionsCompleted}
                    </Text>
                    <Text style={styles.quickStatLabel}>Sessions Left</Text>
                  </View>
                </View>

                {/* Notes */}
                <View style={styles.notesBox}>
                  <Text style={styles.notesTitle}>Clinical Notes</Text>
                  <Text style={styles.notesText}>{patient.notes}</Text>
                </View>

                {/* Action Buttons */}
                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={styles.viewReportBtn}
                    onPress={() => router.push('/report')}
                  >
                    <Ionicons name="document-text" size={16} color="#0a0a0a" />
                    <Text style={styles.viewReportBtnText}>View Report</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.startSessionBtn}
                    onPress={() => router.push('/analysis')}
                  >
                    <Ionicons name="videocam" size={16} color="#00d4aa" />
                    <Text style={styles.startSessionBtnText}>Start Session</Text>
                  </TouchableOpacity>
                </View>

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
  notifBtn: { position: 'relative' },
  notifBadge: { position: 'absolute', top: -4, right: -4, backgroundColor: '#ff4757', borderRadius: 8, width: 16, height: 16, justifyContent: 'center', alignItems: 'center' },
  notifBadgeText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  statsScroll: { marginBottom: 16 },
  statsScrollContent: { gap: 10, paddingRight: 16 },
  statCard: { backgroundColor: '#1a1a1a', borderRadius: 16, padding: 16, alignItems: 'center', gap: 6, minWidth: 100 },
  statValue: { fontSize: 22, fontWeight: 'bold' },
  statLabel: { color: '#888', fontSize: 11, textAlign: 'center' },
  alertBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ff475711', borderRadius: 12, padding: 14, marginBottom: 16, gap: 12, borderWidth: 1, borderColor: '#ff475733' },
  alertText: { flex: 1 },
  alertTitle: { color: '#ff4757', fontSize: 14, fontWeight: 'bold' },
  alertSubtitle: { color: '#888', fontSize: 12, marginTop: 2 },
  alertAction: { color: '#ff4757', fontSize: 14, fontWeight: 'bold' },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a1a1a', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, gap: 10, marginBottom: 12 },
  searchInput: { flex: 1, color: '#fff', fontSize: 15 },
  filterScroll: { marginBottom: 12 },
  filterScrollContent: { gap: 8, paddingRight: 16 },
  filterChip: { backgroundColor: '#1a1a1a', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8, borderWidth: 1, borderColor: '#333' },
  filterChipActive: { backgroundColor: '#00d4aa', borderColor: '#00d4aa' },
  filterChipText: { color: '#888', fontSize: 13 },
  filterChipTextActive: { color: '#0a0a0a', fontWeight: 'bold' },
  patientCount: { color: '#888', fontSize: 13, marginBottom: 12 },
  patientList: { gap: 12 },
  patientCard: { backgroundColor: '#1a1a1a', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#2a2a2a' },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 12 },
  patientAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#00d4aa22', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#00d4aa' },
  patientAvatarText: { color: '#00d4aa', fontSize: 14, fontWeight: 'bold' },
  patientInfo: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  patientName: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  patientCondition: { color: '#888', fontSize: 13, marginTop: 2 },
  patientLastSession: { color: '#555', fontSize: 12, marginTop: 2 },
  cardRight: { alignItems: 'flex-end' },
  statusBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  statusText: { fontSize: 11, fontWeight: 'bold' },
  progressSection: { marginTop: 4 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  progressLabel: { color: '#888', fontSize: 12 },
  progressPercent: { fontSize: 12, fontWeight: 'bold' },
  progressBarBg: { height: 8, backgroundColor: '#2a2a2a', borderRadius: 4, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 4 },
  progressSessions: { color: '#555', fontSize: 11, marginTop: 4 },
  expandedContent: { marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#2a2a2a' },
  quickStats: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 16 },
  quickStat: { alignItems: 'center', gap: 4 },
  quickStatValue: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  quickStatLabel: { color: '#888', fontSize: 11 },
  notesBox: { backgroundColor: '#0a0a0a', borderRadius: 12, padding: 14, marginBottom: 14 },
  notesTitle: { color: '#00d4aa', fontSize: 13, fontWeight: 'bold', marginBottom: 6 },
  notesText: { color: '#aaa', fontSize: 13, lineHeight: 20 },
  actionButtons: { flexDirection: 'row', gap: 10 },
  viewReportBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#00d4aa', borderRadius: 12, padding: 12, gap: 6 },
  viewReportBtnText: { color: '#0a0a0a', fontSize: 14, fontWeight: 'bold' },
  startSessionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#1a1a1a', borderRadius: 12, padding: 12, gap: 6, borderWidth: 1, borderColor: '#00d4aa' },
  startSessionBtnText: { color: '#00d4aa', fontSize: 14, fontWeight: 'bold' },
});