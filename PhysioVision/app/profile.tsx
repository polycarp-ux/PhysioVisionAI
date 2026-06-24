import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function ProfileScreen() {
  const [name, setName] = useState('Polycarp Gerrard');
  const [age, setAge] = useState('22');
  const [goal, setGoal] = useState('General Fitness');
  const [voiceAlerts, setVoiceAlerts] = useState(true);
  const [colorOverlay, setColorOverlay] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const router = useRouter();

  const GOALS = ['General Fitness', 'Physiotherapy', 'Athletic Performance', 'Weight Loss', 'Muscle Building'];

  const INJURY_FLAGS = [
    { id: 'knee', label: 'Bad Knee', icon: 'accessibility' },
    { id: 'back', label: 'Back Pain', icon: 'body' },
    { id: 'shoulder', label: 'Shoulder Injury', icon: 'fitness' },
    { id: 'ankle', label: 'Ankle Issue', icon: 'walk' },
  ];

  const [injuries, setInjuries] = useState<string[]>([]);

  const toggleInjury = (id: string) => {
    setInjuries((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#00d4aa" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile & Settings</Text>
        <TouchableOpacity onPress={() => setEditMode(!editMode)}>
          <Ionicons name={editMode ? 'checkmark' : 'pencil'} size={24} color="#00d4aa" />
        </TouchableOpacity>
      </View>

      {/* Avatar */}
      <View style={styles.avatarSection}>
        <View style={styles.avatarCircle}>
          <Ionicons name="person" size={48} color="#00d4aa" />
        </View>
        <Text style={styles.avatarName}>{name}</Text>
        <Text style={styles.avatarGoal}>{goal}</Text>
      </View>

      {/* Personal Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Personal Info</Text>
        <View style={styles.inputCard}>
          <View style={styles.inputRow}>
            <Ionicons name="person-outline" size={20} color="#00d4aa" />
            <Text style={styles.inputLabel}>Full Name</Text>
          </View>
          <TextInput
            style={[styles.input, !editMode && styles.inputDisabled]}
            value={name}
            onChangeText={setName}
            editable={editMode}
            placeholderTextColor="#888"
          />
        </View>
        <View style={styles.inputCard}>
          <View style={styles.inputRow}>
            <Ionicons name="calendar-outline" size={20} color="#00d4aa" />
            <Text style={styles.inputLabel}>Age</Text>
          </View>
          <TextInput
            style={[styles.input, !editMode && styles.inputDisabled]}
            value={age}
            onChangeText={setAge}
            editable={editMode}
            keyboardType="numeric"
            placeholderTextColor="#888"
          />
        </View>
      </View>

      {/* Fitness Goal */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Fitness Goal</Text>
        <View style={styles.goalsGrid}>
          {GOALS.map((g) => (
            <TouchableOpacity
              key={g}
              style={[styles.goalChip, goal === g && styles.goalChipActive]}
              onPress={() => editMode && setGoal(g)}
            >
              <Text style={[styles.goalChipText, goal === g && styles.goalChipTextActive]}>
                {g}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Injury Flags */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Injury Flags</Text>
        <Text style={styles.sectionSub}>App will adjust form thresholds based on your injuries</Text>
        <View style={styles.injuryGrid}>
          {INJURY_FLAGS.map((injury) => (
            <TouchableOpacity
              key={injury.id}
              style={[styles.injuryChip, injuries.includes(injury.id) && styles.injuryChipActive]}
              onPress={() => toggleInjury(injury.id)}
            >
              <Ionicons
                name={injury.icon as any}
                size={20}
                color={injuries.includes(injury.id) ? '#0a0a0a' : '#888'}
              />
              <Text style={[styles.injuryText, injuries.includes(injury.id) && styles.injuryTextActive]}>
                {injury.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* App Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>App Settings</Text>
        <View style={styles.settingCard}>
          <View style={styles.settingRow}>
            <Ionicons name="volume-high" size={22} color="#00d4aa" />
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Voice Alerts</Text>
              <Text style={styles.settingDesc}>Speak feedback during exercise</Text>
            </View>
            <Switch
              value={voiceAlerts}
              onValueChange={setVoiceAlerts}
              trackColor={{ false: '#333', true: '#00d4aa' }}
              thumbColor="#fff"
            />
          </View>
          <View style={styles.divider} />
          <View style={styles.settingRow}>
            <Ionicons name="color-palette" size={22} color="#00d4aa" />
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Color Overlay</Text>
              <Text style={styles.settingDesc}>Show green/red skeleton overlay</Text>
            </View>
            <Switch
              value={colorOverlay}
              onValueChange={setColorOverlay}
              trackColor={{ false: '#333', true: '#00d4aa' }}
              thumbColor="#fff"
            />
          </View>
        </View>
      </View>

      {/* App Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <View style={styles.aboutCard}>
          <Ionicons name="body" size={32} color="#00d4aa" />
          <Text style={styles.aboutName}>PhysioVision AI</Text>
          <Text style={styles.aboutVersion}>Version 1.0.0</Text>
          <Text style={styles.aboutDesc}>
            Real-time AI motion analysis for physical therapy and exercise correction.
            Built with React Native & Expo.
          </Text>
        </View>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a', paddingHorizontal: 16 },
  header: { flexDirection: 'row', alignItems: 'center', paddingTop: 60, paddingBottom: 20, gap: 12 },
  headerTitle: { flex: 1, color: '#fff', fontSize: 22, fontWeight: 'bold' },
  avatarSection: { alignItems: 'center', paddingVertical: 24 },
  avatarCircle: { width: 90, height: 90, borderRadius: 45, backgroundColor: '#1a1a1a', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#00d4aa', marginBottom: 12 },
  avatarName: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
  avatarGoal: { color: '#00d4aa', fontSize: 14, marginTop: 4 },
  section: { marginBottom: 24 },
  sectionTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  sectionSub: { color: '#888', fontSize: 13, marginBottom: 12, marginTop: -8 },
  inputCard: { backgroundColor: '#1a1a1a', borderRadius: 16, padding: 16, marginBottom: 10 },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  inputLabel: { color: '#888', fontSize: 13 },
  input: { color: '#fff', fontSize: 16, borderBottomWidth: 1, borderBottomColor: '#00d4aa', paddingVertical: 6 },
  inputDisabled: { borderBottomColor: '#333', color: '#aaa' },
  goalsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  goalChip: { backgroundColor: '#1a1a1a', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, borderWidth: 1, borderColor: '#333' },
  goalChipActive: { backgroundColor: '#00d4aa', borderColor: '#00d4aa' },
  goalChipText: { color: '#888', fontSize: 13 },
  goalChipTextActive: { color: '#0a0a0a', fontWeight: 'bold' },
  injuryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  injuryChip: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#1a1a1a', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, borderWidth: 1, borderColor: '#333' },
  injuryChipActive: { backgroundColor: '#ff4757', borderColor: '#ff4757' },
  injuryText: { color: '#888', fontSize: 13 },
  injuryTextActive: { color: '#0a0a0a', fontWeight: 'bold' },
  settingCard: { backgroundColor: '#1a1a1a', borderRadius: 16, padding: 16 },
  settingRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  settingInfo: { flex: 1 },
  settingLabel: { color: '#fff', fontSize: 15, fontWeight: '600' },
  settingDesc: { color: '#888', fontSize: 12, marginTop: 2 },
  divider: { height: 1, backgroundColor: '#2a2a2a', marginVertical: 16 },
  aboutCard: { backgroundColor: '#1a1a1a', borderRadius: 16, padding: 24, alignItems: 'center', gap: 8 },
  aboutName: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  aboutVersion: { color: '#00d4aa', fontSize: 13 },
  aboutDesc: { color: '#888', fontSize: 13, textAlign: 'center', lineHeight: 20, marginTop: 8 },
});