import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const EXERCISES = [
  { id: '1', name: 'Squats', category: 'Lower Body', muscles: 'Quads, Glutes, Hamstrings', difficulty: 'Beginner', icon: 'body', color: '#00d4aa', description: 'A fundamental lower body exercise that strengthens the quads, glutes and hamstrings. Keep chest up, feet shoulder-width apart.', tips: ['Keep knees behind toes', 'Chest up, back straight', 'Go to parallel or below', 'Drive through your heels'] },
  { id: '2', name: 'Lunges', category: 'Lower Body', muscles: 'Quads, Glutes, Calves', difficulty: 'Beginner', icon: 'walk', color: '#ff6b35', description: 'A unilateral lower body exercise that improves balance and leg strength.', tips: ['Front knee at 90 degrees', 'Back knee hovers above floor', 'Keep torso upright', 'Step far enough forward'] },
  { id: '3', name: 'Push-ups', category: 'Upper Body', muscles: 'Chest, Triceps, Shoulders', difficulty: 'Beginner', icon: 'fitness', color: '#a855f7', description: 'A classic upper body exercise targeting the chest, triceps and front deltoids.', tips: ['Body in straight line', 'Hands shoulder-width apart', 'Lower chest to floor', 'Keep core tight'] },
  { id: '4', name: 'Bicep Curls', category: 'Upper Body', muscles: 'Biceps, Forearms', difficulty: 'Beginner', icon: 'barbell', color: '#ffd700', description: 'An isolation exercise targeting the biceps brachii muscle.', tips: ['Elbows close to body', 'Full range of motion', 'Control the descent', 'No swinging'] },
  { id: '5', name: 'Shoulder Press', category: 'Upper Body', muscles: 'Shoulders, Triceps', difficulty: 'Intermediate', icon: 'arrow-up', color: '#00bfff', description: 'An overhead pressing movement that builds shoulder strength and stability.', tips: ['Core tight throughout', 'Press directly overhead', 'Do not arch lower back', 'Control the weight down'] },
  { id: '6', name: 'Deadlift', category: 'Full Body', muscles: 'Back, Glutes, Hamstrings', difficulty: 'Intermediate', icon: 'barbell', color: '#ff4757', description: 'A compound movement that targets the entire posterior chain.', tips: ['Back flat throughout', 'Bar close to body', 'Drive hips forward', 'Brace your core'] },
  { id: '7', name: 'Plank', category: 'Core', muscles: 'Core, Shoulders, Glutes', difficulty: 'Beginner', icon: 'remove', color: '#2ed573', description: 'An isometric core exercise that builds endurance and stability.', tips: ['Hips level with body', 'Breathe steadily', 'Squeeze glutes', 'Look at the floor'] },
  { id: '8', name: 'Glute Bridge', category: 'Lower Body', muscles: 'Glutes, Hamstrings', difficulty: 'Beginner', icon: 'trending-up', color: '#ff6b81', description: 'A rehab-friendly exercise that activates and strengthens the glutes.', tips: ['Feet flat on floor', 'Squeeze glutes at top', 'Hold for 2 seconds', 'Lower with control'] },
  { id: '9', name: 'Mountain Climbers', category: 'Full Body', muscles: 'Core, Shoulders, Legs', difficulty: 'Intermediate', icon: 'trending-up', color: '#ff9f43', description: 'A dynamic full body exercise that builds cardio and core strength.', tips: ['Keep hips low', 'Fast alternating knees', 'Shoulders over wrists', 'Breathe rhythmically'] },
  { id: '10', name: 'Knee Flexion', category: 'Rehab', muscles: 'Hamstrings, Knee Joint', difficulty: 'Beginner', icon: 'accessibility', color: '#54a0ff', description: 'A physiotherapy exercise for knee rehabilitation and recovery.', tips: ['Slow controlled movement', 'Full range if pain free', 'Stop if pain occurs', 'Consult your physio'] },
  { id: '11', name: 'Hip Abduction', category: 'Rehab', muscles: 'Glutes, Hip Abductors', difficulty: 'Beginner', icon: 'accessibility', color: '#5f27cd', description: 'A rehabilitation exercise targeting the hip abductor muscles.', tips: ['Lie on your side', 'Keep leg straight', 'Slow controlled lift', 'Do not rotate hip'] },
  { id: '12', name: 'Bird Dog', category: 'Core', muscles: 'Core, Back, Glutes', difficulty: 'Beginner', icon: 'body', color: '#00d2d3', description: 'A core stability exercise commonly used in physiotherapy.', tips: ['On hands and knees', 'Extend opposite arm and leg', 'Keep back flat', 'Hold for 3 seconds'] },
];

const CATEGORIES = ['All', 'Lower Body', 'Upper Body', 'Core', 'Full Body', 'Rehab'];
const DIFFICULTIES = ['All', 'Beginner', 'Intermediate'];

export default function LibraryScreen() {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedDifficulty, setSelectedDifficulty] = useState('All');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const router = useRouter();

  const filtered = EXERCISES.filter((ex) => {
    const matchSearch = ex.name.toLowerCase().includes(search.toLowerCase());
    const matchCategory = selectedCategory === 'All' || ex.category === selectedCategory;
    const matchDifficulty = selectedDifficulty === 'All' || ex.difficulty === selectedDifficulty;
    return matchSearch && matchCategory && matchDifficulty;
  });

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#00d4aa" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Exercise Library</Text>
        <Text style={styles.headerCount}>{filtered.length}</Text>
      </View>

      {/* Search */}
      <View style={styles.searchBox}>
        <Ionicons name="search" size={18} color="#888" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search exercises..."
          placeholderTextColor="#888"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Category Filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[styles.filterChip, selectedCategory === cat && styles.filterChipActive]}
            onPress={() => setSelectedCategory(cat)}
          >
            <Text style={[styles.filterChipText, selectedCategory === cat && styles.filterChipTextActive]}>
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Difficulty Filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
        {DIFFICULTIES.map((diff) => (
          <TouchableOpacity
            key={diff}
            style={[styles.filterChip, selectedDifficulty === diff && styles.filterChipActive]}
            onPress={() => setSelectedDifficulty(diff)}
          >
            <Text style={[styles.filterChipText, selectedDifficulty === diff && styles.filterChipTextActive]}>
              {diff}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Exercise List */}
      <View style={styles.list}>
        {filtered.map((exercise) => (
          <TouchableOpacity
            key={exercise.id}
            style={styles.exerciseCard}
            onPress={() => setExpandedId(expandedId === exercise.id ? null : exercise.id)}
          >
            {/* Card Header */}
            <View style={styles.cardHeader}>
              <View style={[styles.iconBox, { backgroundColor: exercise.color + '22' }]}>
                <Ionicons name={exercise.icon as any} size={24} color={exercise.color} />
              </View>
              <View style={styles.cardInfo}>
                <Text style={styles.cardName}>{exercise.name}</Text>
                <Text style={styles.cardMeta}>{exercise.category} • {exercise.muscles}</Text>
              </View>
              <View style={styles.cardRight}>
                <View style={[styles.diffBadge, { backgroundColor: exercise.difficulty === 'Beginner' ? '#2ed57322' : '#ff475722' }]}>
                  <Text style={[styles.diffText, { color: exercise.difficulty === 'Beginner' ? '#2ed573' : '#ff4757' }]}>
                    {exercise.difficulty}
                  </Text>
                </View>
                <Ionicons
                  name={expandedId === exercise.id ? 'chevron-up' : 'chevron-down'}
                  size={18}
                  color="#888"
                  style={{ marginTop: 8 }}
                />
              </View>
            </View>

            {/* Expanded Content */}
            {expandedId === exercise.id && (
              <View style={styles.expandedContent}>
                <Text style={styles.description}>{exercise.description}</Text>
                <Text style={styles.tipsTitle}>Form Tips:</Text>
                {exercise.tips.map((tip, i) => (
                  <View key={i} style={styles.tipRow}>
                    <Ionicons name="checkmark-circle" size={16} color="#00d4aa" />
                    <Text style={styles.tipText}>{tip}</Text>
                  </View>
                ))}
                <TouchableOpacity
                  style={[styles.analyzeBtn, { backgroundColor: exercise.color }]}
                  onPress={() => router.push('/analysis')}
                >
                  <Ionicons name="videocam" size={18} color="#0a0a0a" />
                  <Text style={styles.analyzeBtnText}>Analyze This Exercise</Text>
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
  headerTitle: { flex: 1, color: '#fff', fontSize: 22, fontWeight: 'bold' },
  headerCount: { color: '#00d4aa', fontSize: 16, fontWeight: 'bold' },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a1a1a', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, gap: 10, marginBottom: 16 },
  searchInput: { flex: 1, color: '#fff', fontSize: 15 },
  filterScroll: { marginBottom: 12 },
  filterChip: { backgroundColor: '#1a1a1a', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8, marginRight: 8, borderWidth: 1, borderColor: '#333' },
  filterChipActive: { backgroundColor: '#00d4aa', borderColor: '#00d4aa' },
  filterChipText: { color: '#888', fontSize: 13 },
  filterChipTextActive: { color: '#0a0a0a', fontWeight: 'bold' },
  list: { gap: 12, marginTop: 8 },
  exerciseCard: { backgroundColor: '#1a1a1a', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#2a2a2a' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBox: { width: 48, height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  cardInfo: { flex: 1 },
  cardName: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  cardMeta: { color: '#888', fontSize: 12, marginTop: 2 },
  cardRight: { alignItems: 'flex-end' },
  diffBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  diffText: { fontSize: 11, fontWeight: 'bold' },
  expandedContent: { marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#2a2a2a' },
  description: { color: '#aaa', fontSize: 14, lineHeight: 22, marginBottom: 16 },
  tipsTitle: { color: '#fff', fontSize: 15, fontWeight: 'bold', marginBottom: 10 },
  tipRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  tipText: { color: '#aaa', fontSize: 14 },
  analyzeBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: 12, padding: 14, marginTop: 16, gap: 8 },
  analyzeBtnText: { color: '#0a0a0a', fontSize: 15, fontWeight: 'bold' },
});