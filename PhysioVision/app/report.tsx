import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

const REPORT_DATA = {
  patient: {
    name: 'Polycarp Gerrard',
    age: 22,
    role: 'Patient',
    condition: 'Knee Recovery',
    therapist: 'Dr. Mensah',
    startDate: 'May 1, 2026',
    reportDate: 'June 16, 2026',
  },
  summary: {
    totalSessions: 7,
    avgFormScore: 84,
    totalReps: 245,
    improvement: '+83°',
    streak: 7,
  },
  sessions: [
    { date: 'May 1', exercise: 'Squats', reps: 10, formScore: 60, angle: 45, feedback: 'Initial assessment. Limited range of motion detected.' },
    { date: 'May 5', exercise: 'Knee Flexion', reps: 12, formScore: 68, angle: 62, feedback: 'Slight improvement in flexion. Continue gentle exercises.' },
    { date: 'May 9', exercise: 'Glute Bridge', reps: 15, formScore: 74, angle: 78, feedback: 'Good progress. Knee stability improving.' },
    { date: 'May 13', exercise: 'Lunges', reps: 12, formScore: 80, angle: 91, feedback: 'Reached 90 degrees. Significant milestone achieved.' },
    { date: 'May 17', exercise: 'Squats', reps: 15, formScore: 86, angle: 105, feedback: 'Excellent form. Muscle strength returning well.' },
    { date: 'May 21', exercise: 'Knee Flexion', reps: 18, formScore: 91, angle: 118, feedback: 'Near full range of motion. Patient progressing excellently.' },
    { date: 'May 25', exercise: 'Squats', reps: 20, formScore: 95, angle: 128, feedback: 'Outstanding recovery. Approaching normal range of motion.' },
  ],
  recommendations: [
    'Continue current exercise program for 2 more weeks',
    'Gradually increase resistance training',
    'Focus on single leg exercises for balance',
    'Schedule follow-up assessment in 14 days',
  ],
};

export default function ReportScreen() {
  const [generating, setGenerating] = useState(false);
  const router = useRouter();

  const getScoreColor = (score: number) => {
    if (score >= 90) return '#2ed573';
    if (score >= 75) return '#ffd700';
    return '#ff4757';
  };

  const generateHTML = () => {
    const { patient, summary, sessions, recommendations } = REPORT_DATA;
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; color: #333; }
          .header { background: #00d4aa; padding: 24px; border-radius: 12px; margin-bottom: 24px; }
          .header h1 { color: #fff; margin: 0; font-size: 24px; }
          .header p { color: #fff; margin: 4px 0 0; opacity: 0.85; }
          .section { margin-bottom: 24px; }
          .section h2 { color: #00d4aa; border-bottom: 2px solid #00d4aa; padding-bottom: 8px; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
          .info-item { background: #f5f5f5; padding: 12px; border-radius: 8px; }
          .info-label { font-size: 12px; color: #888; }
          .info-value { font-size: 16px; font-weight: bold; color: #333; margin-top: 4px; }
          .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
          .stat-card { background: #f5f5f5; padding: 16px; border-radius: 8px; text-align: center; }
          .stat-value { font-size: 24px; font-weight: bold; color: #00d4aa; }
          .stat-label { font-size: 12px; color: #888; margin-top: 4px; }
          table { width: 100%; border-collapse: collapse; }
          th { background: #00d4aa; color: #fff; padding: 10px; text-align: left; }
          td { padding: 10px; border-bottom: 1px solid #eee; font-size: 13px; }
          tr:nth-child(even) { background: #f9f9f9; }
          .score-good { color: #2ed573; font-weight: bold; }
          .score-mid { color: #ffd700; font-weight: bold; }
          .score-low { color: #ff4757; font-weight: bold; }
          .recommendation { background: #f0fff8; border-left: 4px solid #00d4aa; padding: 12px; margin-bottom: 8px; border-radius: 4px; }
          .footer { text-align: center; color: #888; font-size: 12px; margin-top: 40px; border-top: 1px solid #eee; padding-top: 20px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>PhysioVision AI — Clinical Progress Report</h1>
          <p>Generated on ${patient.reportDate} • Powered by AI Motion Analysis</p>
        </div>

        <div class="section">
          <h2>Patient Information</h2>
          <div class="info-grid">
            <div class="info-item">
              <div class="info-label">Patient Name</div>
              <div class="info-value">${patient.name}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Age</div>
              <div class="info-value">${patient.age} years</div>
            </div>
            <div class="info-item">
              <div class="info-label">Condition</div>
              <div class="info-value">${patient.condition}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Therapist</div>
              <div class="info-value">${patient.therapist}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Program Start</div>
              <div class="info-value">${patient.startDate}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Report Date</div>
              <div class="info-value">${patient.reportDate}</div>
            </div>
          </div>
        </div>

        <div class="section">
          <h2>Progress Summary</h2>
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-value">${summary.totalSessions}</div>
              <div class="stat-label">Total Sessions</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">${summary.avgFormScore}%</div>
              <div class="stat-label">Avg Form Score</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">${summary.totalReps}</div>
              <div class="stat-label">Total Reps</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">${summary.improvement}</div>
              <div class="stat-label">ROM Improvement</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">${summary.streak}</div>
              <div class="stat-label">Day Streak</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">91%</div>
              <div class="stat-label">Latest ROM</div>
            </div>
          </div>
        </div>

        <div class="section">
          <h2>Session History</h2>
          <table>
            <tr>
              <th>Date</th>
              <th>Exercise</th>
              <th>Reps</th>
              <th>Form Score</th>
              <th>Joint Angle</th>
              <th>AI Feedback</th>
            </tr>
            ${sessions.map(s => `
              <tr>
                <td>${s.date}</td>
                <td>${s.exercise}</td>
                <td>${s.reps}</td>
                <td class="${s.formScore >= 90 ? 'score-good' : s.formScore >= 75 ? 'score-mid' : 'score-low'}">${s.formScore}%</td>
                <td>${s.angle}°</td>
                <td>${s.feedback}</td>
              </tr>
            `).join('')}
          </table>
        </div>

        <div class="section">
          <h2>Clinical Recommendations</h2>
          ${recommendations.map(r => `<div class="recommendation">✓ ${r}</div>`).join('')}
        </div>

        <div class="footer">
          <p>This report was generated by PhysioVision AI — AI-Powered Physiotherapy & Motion Analysis System</p>
          <p>Report ID: PV-${Date.now()} • Confidential Medical Document</p>
        </div>
      </body>
      </html>
    `;
  };

  const handleGenerateReport = async () => {
    try {
      setGenerating(true);
      const { uri } = await Print.printToFileAsync({ html: generateHTML() });
      setGenerating(false);
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Share PhysioVision Report',
        });
      } else {
        Alert.alert('PDF Generated!', `Saved to: ${uri}`);
      }
    } catch (error) {
      setGenerating(false);
      Alert.alert('Error', 'Could not generate report. Please try again.');
    }
  };

  const handlePrint = async () => {
    try {
      await Print.printAsync({ html: generateHTML() });
    } catch (error) {
      Alert.alert('Error', 'Could not print report.');
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#00d4aa" />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>Progress Report</Text>
          <Text style={styles.headerSubtitle}>Clinical PDF Report Generator</Text>
        </View>
        <Ionicons name="document-text" size={24} color="#00d4aa" />
      </View>

      {/* Patient Card */}
      <View style={styles.patientCard}>
        <View style={styles.patientAvatar}>
          <Ionicons name="person" size={32} color="#00d4aa" />
        </View>
        <View style={styles.patientInfo}>
          <Text style={styles.patientName}>{REPORT_DATA.patient.name}</Text>
          <Text style={styles.patientDetail}>{REPORT_DATA.patient.condition}</Text>
          <Text style={styles.patientDetail}>Therapist: {REPORT_DATA.patient.therapist}</Text>
        </View>
        <View style={styles.reportDate}>
          <Text style={styles.reportDateText}>{REPORT_DATA.patient.reportDate}</Text>
        </View>
      </View>

      {/* Summary Stats */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{REPORT_DATA.summary.totalSessions}</Text>
          <Text style={styles.statLabel}>Sessions</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: '#00d4aa' }]}>{REPORT_DATA.summary.avgFormScore}%</Text>
          <Text style={styles.statLabel}>Avg Score</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: '#a855f7' }]}>{REPORT_DATA.summary.improvement}</Text>
          <Text style={styles.statLabel}>ROM Gain</Text>
        </View>
      </View>

      {/* Session Preview */}
      <Text style={styles.sectionTitle}>Session Summary</Text>
      <View style={styles.sessionList}>
        {REPORT_DATA.sessions.map((session, i) => (
          <View key={i} style={styles.sessionRow}>
            <View style={styles.sessionLeft}>
              <Text style={styles.sessionDate}>{session.date}</Text>
              <Text style={styles.sessionExercise}>{session.exercise}</Text>
            </View>
            <View style={styles.sessionMiddle}>
              <Text style={styles.sessionReps}>{session.reps} reps</Text>
              <Text style={styles.sessionAngle}>{session.angle}°</Text>
            </View>
            <View style={[styles.scoreBadge, { backgroundColor: getScoreColor(session.formScore) + '22' }]}>
              <Text style={[styles.scoreText, { color: getScoreColor(session.formScore) }]}>
                {session.formScore}%
              </Text>
            </View>
          </View>
        ))}
      </View>

      {/* Recommendations */}
      <Text style={styles.sectionTitle}>Recommendations</Text>
      <View style={styles.recommendationsList}>
        {REPORT_DATA.recommendations.map((rec, i) => (
          <View key={i} style={styles.recommendationRow}>
            <Ionicons name="checkmark-circle" size={18} color="#00d4aa" />
            <Text style={styles.recommendationText}>{rec}</Text>
          </View>
        ))}
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.generateBtn, generating && { opacity: 0.7 }]}
          onPress={handleGenerateReport}
          disabled={generating}
        >
          <Ionicons name="share" size={22} color="#0a0a0a" />
          <Text style={styles.generateBtnText}>
            {generating ? 'Generating...' : 'Generate & Share PDF'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.printBtn} onPress={handlePrint}>
          <Ionicons name="print" size={22} color="#00d4aa" />
          <Text style={styles.printBtnText}>Print Report</Text>
        </TouchableOpacity>
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
  patientCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a1a1a', borderRadius: 16, padding: 16, marginBottom: 16, gap: 12 },
  patientAvatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#00d4aa22', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#00d4aa' },
  patientInfo: { flex: 1 },
  patientName: { color: '#fff', fontSize: 17, fontWeight: 'bold' },
  patientDetail: { color: '#888', fontSize: 13, marginTop: 2 },
  reportDate: { alignItems: 'flex-end' },
  reportDateText: { color: '#00d4aa', fontSize: 12 },
  statsGrid: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  statCard: { flex: 1, backgroundColor: '#1a1a1a', borderRadius: 16, padding: 16, alignItems: 'center', gap: 6 },
  statValue: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
  statLabel: { color: '#888', fontSize: 11 },
  sectionTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  sessionList: { gap: 8, marginBottom: 24 },
  sessionRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a1a1a', borderRadius: 12, padding: 14, gap: 12 },
  sessionLeft: { flex: 1 },
  sessionDate: { color: '#888', fontSize: 12 },
  sessionExercise: { color: '#fff', fontSize: 14, fontWeight: '600', marginTop: 2 },
  sessionMiddle: { alignItems: 'center' },
  sessionReps: { color: '#888', fontSize: 12 },
  sessionAngle: { color: '#00d4aa', fontSize: 14, fontWeight: 'bold' },
  scoreBadge: { borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6 },
  scoreText: { fontSize: 14, fontWeight: 'bold' },
  recommendationsList: { gap: 10, marginBottom: 24 },
  recommendationRow: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#1a1a1a', borderRadius: 12, padding: 14, gap: 10 },
  recommendationText: { color: '#aaa', fontSize: 14, flex: 1, lineHeight: 20 },
  actionButtons: { gap: 12 },
  generateBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#00d4aa', borderRadius: 16, padding: 18, gap: 10 },
  generateBtnText: { color: '#0a0a0a', fontSize: 16, fontWeight: 'bold' },
  printBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#1a1a1a', borderRadius: 16, padding: 18, gap: 10, borderWidth: 1, borderColor: '#00d4aa' },
  printBtnText: { color: '#00d4aa', fontSize: 16, fontWeight: 'bold' },
});