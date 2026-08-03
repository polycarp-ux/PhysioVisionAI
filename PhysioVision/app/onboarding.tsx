import { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Dimensions, Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Camera } from 'expo-camera'; // Make sure to install: npx expo install expo-camera

const { width } = Dimensions.get('window');

const ROLES = [
  {
    id: 'patient',
    title: 'Patient',
    subtitle: 'I want to recover from injury or do guided rehab exercises',
    icon: 'person',
    color: '#00d4aa',
  },
  {
    id: 'elderly',
    title: 'Elderly User',
    subtitle: 'I want fall prevention and balance exercises with simple guidance',
    icon: 'heart',
    color: '#ff6b35',
  },
  {
    id: 'disabled',
    title: 'Disabled User',
    subtitle: 'I need adapted exercises and accessibility features',
    icon: 'accessibility',
    color: '#a855f7',
  },
  {
    id: 'fitness',
    title: 'Fitness User',
    subtitle: 'I want to improve my exercise form and prevent injury',
    icon: 'fitness',
    color: '#ffd700',
  },
  {
    id: 'therapist',
    title: 'Physiotherapist',
    subtitle: 'I want to monitor and manage my patients remotely',
    icon: 'medical',
    color: '#00bfff',
  },
];

const DISABILITY_TYPES = [
  { id: 'wheelchair', label: 'Wheelchair User', icon: 'accessibility' },
  { id: 'amputee', label: 'Amputee', icon: 'body' },
  { id: 'visual', label: 'Visual Impairment', icon: 'eye-off' },
  { id: 'hearing', label: 'Hearing Impairment', icon: 'volume-mute' },
  { id: 'neurological', label: 'Neurological Condition', icon: 'pulse' },
  { id: 'other', label: 'Other', icon: 'ellipsis-horizontal' },
];

export default function OnboardingScreen() {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedDisabilities, setSelectedDisabilities] = useState<string[]>([]);
  const [voiceGuidance, setVoiceGuidance] = useState(false);
  const [largeText, setLargeText] = useState(false);
  const [highContrast, setHighContrast] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  
  const router = useRouter();

  // ─── Dynamic Slide Flow System ─────────────────────────────────────────────
  // This builds the active slide sequence on-the-fly depending on user choices
  const getActiveSlides = () => {
    const slides = ['welcome', 'role'];
    if (selectedRole === 'disabled') {
      slides.push('disability');
    }
    slides.push('camera', 'calibration', 'accessibility', 'done');
    return slides;
  };

  const activeSlides = getActiveSlides();
  const currentSlideKey = activeSlides[currentSlideIndex];

  const toggleDisability = (id: string) => {
    setSelectedDisabilities((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]
    );
  };

  const requestCameraPermission = async () => {
    const { status } = await Camera.requestCameraPermissionsAsync();
    setHasCameraPermission(status === 'granted');
  };

  const handleNext = async () => {
    // If transitioning past the Camera slide, auto-request permission if not prompted yet
    if (currentSlideKey === 'camera' && hasCameraPermission === null) {
      await requestCameraPermission();
    }

    if (currentSlideIndex < activeSlides.length - 1) {
      setCurrentSlideIndex(currentSlideIndex + 1);
    }
  };

  const handleBack = () => {
    if (currentSlideIndex > 0) {
      setCurrentSlideIndex(currentSlideIndex - 1);
    }
  };

  const handleFinish = async () => {
    try {
      await AsyncStorage.setItem('userRole', selectedRole);
      await AsyncStorage.setItem('disabilities', JSON.stringify(selectedDisabilities));
      await AsyncStorage.setItem('voiceGuidance', JSON.stringify(voiceGuidance));
      await AsyncStorage.setItem('largeText', JSON.stringify(largeText));
      await AsyncStorage.setItem('highContrast', JSON.stringify(highContrast));
      await AsyncStorage.setItem('onboardingComplete', 'true');
      router.replace('/');
    } catch (e) {
      console.error('Failed to save onboarding data', e);
    }
  };

  // ─── Slide 0: Welcome ───────────────────────────────────────────────────────
  const WelcomeSlide = () => (
    <View style={styles.slideContainer}>
      <View style={styles.welcomeIconBox}>
        <Ionicons name="body" size={80} color="#00d4aa" />
      </View>
      <Text style={styles.welcomeTitle}>Welcome to{'\n'}PhysioVision AI</Text>
      <Text style={styles.welcomeSubtitle}>
        Your personal AI-powered physiotherapy and movement analysis companion
      </Text>
      <View style={styles.featureList}>
        {[
          { icon: 'camera', text: 'Real-time movement analysis' },
          { icon: 'fitness', text: 'Exercise form correction' },
          { icon: 'heart', text: 'Rehabilitation programs' },
          { icon: 'accessibility', text: 'Fully accessible for all users' },
          { icon: 'document-text', text: 'Clinical progress reports' },
        ].map((item) => (
          <View key={item.text} style={styles.featureRow}>
            <Ionicons name={item.icon as any} size={20} color="#00d4aa" />
            <Text style={styles.featureText}>{item.text}</Text>
          </View>
        ))}
      </View>
    </View>
  );

  // ─── Slide 1: Role Selection ────────────────────────────────────────────────
  const RoleSlide = () => (
    <View style={styles.slideContainer}>
      <Text style={styles.slideTitle}>Who are you?</Text>
      <Text style={styles.slideSubtitle}>
        Select your role so we can personalise your experience
      </Text>
      <ScrollView showsVerticalScrollIndicator={false} style={styles.roleScroll}>
        {ROLES.map((role) => (
          <TouchableOpacity
            key={role.id}
            style={[
              styles.roleCard,
              selectedRole === role.id && { borderColor: role.color, borderWidth: 2 },
            ]}
            onPress={() => setSelectedRole(role.id)}
          >
            <View style={[styles.roleIconBox, { backgroundColor: role.color + '22' }]}>
              <Ionicons name={role.icon as any} size={28} color={role.color} />
            </View>
            <View style={styles.roleInfo}>
              <Text style={styles.roleTitle}>{role.title}</Text>
              <Text style={styles.roleSubtitle}>{role.subtitle}</Text>
            </View>
            {selectedRole === role.id && (
              <Ionicons name="checkmark-circle" size={24} color={role.color} />
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  // ─── Slide 2: Disability Profile ────────────────────────────────────────────
  const DisabilitySlide = () => (
    <View style={styles.slideContainer}>
      <Text style={styles.slideTitle}>Your Disability Profile</Text>
      <Text style={styles.slideSubtitle}>
        Select all that apply — the app will adapt to your needs
      </Text>
      <View style={styles.disabilityGrid}>
        {DISABILITY_TYPES.map((type) => {
          const isSelected = selectedDisabilities.includes(type.id);
          return (
            <TouchableOpacity
              key={type.id}
              style={[
                styles.disabilityChip,
                isSelected && styles.disabilityChipActive,
              ]}
              onPress={() => toggleDisability(type.id)}
            >
              <Ionicons
                name={type.icon as any}
                size={24}
                color={isSelected ? '#0a0a0a' : '#00d4aa'}
              />
              <Text style={[
                styles.disabilityLabel,
                isSelected && styles.disabilityLabelActive,
              ]}>
                {type.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      <View style={styles.infoBox}>
        <Ionicons name="information-circle" size={20} color="#00bfff" />
        <Text style={styles.infoText}>
          The app will automatically adjust exercises, camera angles and feedback based on your profile
        </Text>
      </View>
    </View>
  );

  // ─── Slide 3: Camera Setup (NEW!) ───────────────────────────────────────────
  const CameraSlide = () => (
    <View style={styles.slideContainer}>
      <Text style={styles.slideTitle}>Enable Camera Access</Text>
      <Text style={styles.slideSubtitle}>
        PhysioVision AI tracks and analyzes your skeletal movements locally on your device to guide your form.
      </Text>
      <View style={styles.permissionVisualCard}>
        <View style={styles.scanLine} />
        <Ionicons name="videocam" size={60} color="#00d4aa" />
        <Text style={styles.privacyHighlight}>
          🔒 Private & Secure: Video frames are processed locally and never uploaded to any servers.
        </Text>
      </View>

      <TouchableOpacity 
        style={[
          styles.permissionButton, 
          hasCameraPermission === true && styles.permissionButtonActive
        ]} 
        onPress={requestCameraPermission}
      >
        <Ionicons 
          name={hasCameraPermission === true ? "checkmark-circle" : "camera"} 
          size={22} 
          color="#0a0a0a" 
        />
        <Text style={styles.permissionButtonText}>
          {hasCameraPermission === true ? "Camera Access Granted" : "Allow Camera Permission"}
        </Text>
      </TouchableOpacity>
    </View>
  );

  // ─── Slide 4: Space Prep & Calibration (NEW!) ──────────────────────────────
  const CalibrationSlide = () => (
    <View style={styles.slideContainer}>
      <Text style={styles.slideTitle}>Setting Up Your Space</Text>
      <Text style={styles.slideSubtitle}>
        For the AI computer vision system to work flawlessly, ensure your physical setup matches these guidelines:
      </Text>

      <View style={styles.calibList}>
        {[
          { icon: 'phone-portrait-outline', title: 'Device Placement', desc: 'Prop your iPhone up vertically at hip height on a stable surface.' },
          { icon: 'resize-outline', title: 'Step Back', desc: 'Stand 6 to 8 feet away so your entire body is visible from head to toe.' },
          { icon: 'sunny-outline', title: 'Bright Lighting', desc: 'Avoid standing directly in front of bright windows (backlighting) so the AI can see you.' },
        ].map((item, idx) => (
          <View key={idx} style={styles.calibRow}>
            <View style={styles.calibIconWrapper}>
              <Ionicons name={item.icon as any} size={24} color="#00d4aa" />
            </View>
            <View style={styles.calibTextWrapper}>
              <Text style={styles.calibItemTitle}>{item.title}</Text>
              <Text style={styles.calibItemDesc}>{item.desc}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );

  // ─── Slide 5: Accessibility Settings ────────────────────────────────────────
  const AccessibilitySlide = () => (
    <View style={styles.slideContainer}>
      <Text style={styles.slideTitle}>Accessibility Settings</Text>
      <Text style={styles.slideSubtitle}>
        Customise how the app communicates with you
      </Text>
      {[
        {
          id: 'voice',
          icon: 'volume-high',
          title: 'Voice Guidance',
          desc: 'Speak all instructions and feedback out loud',
          value: voiceGuidance,
          toggle: () => setVoiceGuidance(!voiceGuidance),
          color: '#00d4aa',
        },
        {
          id: 'text',
          icon: 'text',
          title: 'Large Text Mode',
          desc: 'Increase all text size for better readability',
          value: largeText,
          toggle: () => setLargeText(!largeText),
          color: '#ffd700',
        },
        {
          id: 'contrast',
          icon: 'contrast',
          title: 'High Contrast Mode',
          desc: 'Stronger colour contrast for visual impairment',
          value: highContrast,
          toggle: () => setHighContrast(!highContrast),
          color: '#a855f7',
        },
      ].map((setting) => (
        <TouchableOpacity
          key={setting.id}
          style={[styles.settingCard, setting.value && { borderColor: setting.color, borderWidth: 1 }]}
          onPress={setting.toggle}
        >
          <View style={[styles.settingIconBox, { backgroundColor: setting.color + '22' }]}>
            <Ionicons name={setting.icon as any} size={28} color={setting.color} />
          </View>
          <View style={styles.settingInfo}>
            <Text style={styles.settingTitle}>{setting.title}</Text>
            <Text style={styles.settingDesc}>{setting.desc}</Text>
          </View>
          <View style={[styles.toggle, setting.value && { backgroundColor: setting.color }]}>
            <View style={[styles.toggleDot, setting.value && styles.toggleDotOn]} />
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );

  // ─── Slide 6: Done ──────────────────────────────────────────────────────────
  const DoneSlide = () => (
    <View style={styles.slideContainer}>
      <View style={styles.doneIconBox}>
        <Ionicons name="checkmark-circle" size={100} color="#00d4aa" />
      </View>
      <Text style={styles.welcomeTitle}>You are all set!</Text>
      <Text style={styles.welcomeSubtitle}>
        PhysioVision AI has been personalised for you. Let us begin your journey to better movement and health.
      </Text>
      <View style={styles.summaryBox}>
        <Text style={styles.summaryTitle}>Your Profile Summary</Text>
        <View style={styles.summaryRow}>
          <Ionicons name="person" size={18} color="#00d4aa" />
          <Text style={styles.summaryText}>
            Role: {ROLES.find((r) => r.id === selectedRole)?.title || 'Not selected'}
          </Text>
        </View>
        {selectedDisabilities.length > 0 && (
          <View style={styles.summaryRow}>
            <Ionicons name="accessibility" size={18} color="#a855f7" />
            <Text style={styles.summaryText}>
              Accessibility: {selectedDisabilities.length} profile(s) selected
            </Text>
          </View>
        )}
        <View style={styles.summaryRow}>
          <Ionicons name="volume-high" size={18} color="#ffd700" />
          <Text style={styles.summaryText}>
            Voice Guidance: {voiceGuidance ? 'On' : 'Off'}
          </Text>
        </View>
      </View>
    </View>
  );

  // Mapping string screen keys to components
  const renderSlideContent = () => {
    switch (currentSlideKey) {
      case 'welcome': return <WelcomeSlide />;
      case 'role': return <RoleSlide />;
      case 'disability': return <DisabilitySlide />;
      case 'camera': return <CameraSlide />;
      case 'calibration': return <CalibrationSlide />;
      case 'accessibility': return <AccessibilitySlide />;
      case 'done': return <DoneSlide />;
      default: return <WelcomeSlide />;
    }
  };

  return (
    <View style={styles.container}>
      {/* Dynamic Progress Dots */}
      <View style={styles.progressDots}>
        {activeSlides.map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot, 
              currentSlideIndex === i && styles.dotActive,
              currentSlideIndex > i && styles.dotPassed
            ]}
          />
        ))}
      </View>

      {/* Dynamic Slide Content Render */}
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {renderSlideContent()}
      </ScrollView>

      {/* Navigation Footer */}
      <View style={styles.navButtons}>
        {currentSlideIndex > 0 && (
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Ionicons name="arrow-back" size={20} color="#888" />
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
        )}
        
        <View style={{ flex: 1 }} />
        
        {currentSlideIndex < activeSlides.length - 1 ? (
          <TouchableOpacity
            style={[
              styles.nextButton,
              currentSlideKey === 'role' && !selectedRole && styles.nextButtonDisabled,
              currentSlideKey === 'camera' && !hasCameraPermission && styles.nextButtonDisabled,
            ]}
            onPress={handleNext}
            disabled={
              (currentSlideKey === 'role' && !selectedRole) ||
              (currentSlideKey === 'camera' && !hasCameraPermission)
            }
          >
            <Text style={styles.nextButtonText}>
              {currentSlideIndex === 0 ? 'Get Started' : 'Next'}
            </Text>
            <Ionicons name="arrow-forward" size={20} color="#0a0a0a" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.finishButton} onPress={handleFinish}>
            <Ionicons name="checkmark" size={20} color="#0a0a0a" />
            <Text style={styles.nextButtonText}>Start Using App</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  progressDots: { 
    flexDirection: 'row', 
    justifyContent: 'center', 
    gap: 6, 
    paddingTop: Platform.OS === 'ios' ? 60 : 40, 
    paddingBottom: 10 
  },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#333' },
  dotActive: { backgroundColor: '#00d4aa', width: 24 },
  dotPassed: { backgroundColor: '#00d4aa88' },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 20 },
  slideContainer: { flex: 1, paddingTop: 20 },
  welcomeIconBox: { alignItems: 'center', marginBottom: 24 },
  welcomeTitle: { color: '#fff', fontSize: 32, fontWeight: 'bold', textAlign: 'center', marginBottom: 16, lineHeight: 40 },
  welcomeSubtitle: { color: '#888', fontSize: 16, textAlign: 'center', lineHeight: 24, marginBottom: 32 },
  featureList: { gap: 16 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: '#1a1a1a', borderRadius: 12, padding: 16 },
  featureText: { color: '#fff', fontSize: 15 },
  slideTitle: { color: '#fff', fontSize: 28, fontWeight: 'bold', marginBottom: 8 },
  slideSubtitle: { color: '#888', fontSize: 15, marginBottom: 24, lineHeight: 22 },
  roleScroll: { maxHeight: 500 },
  roleCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a1a1a', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#2a2a2a', gap: 14 },
  roleIconBox: { width: 52, height: 52, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  roleInfo: { flex: 1 },
  roleTitle: { color: '#fff', fontSize: 17, fontWeight: 'bold' },
  roleSubtitle: { color: '#888', fontSize: 13, marginTop: 4, lineHeight: 18 },
  disabilityGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
  disabilityChip: { width: (width - 60) / 2, backgroundColor: '#1a1a1a', borderRadius: 16, padding: 16, alignItems: 'center', gap: 8, borderWidth: 1, borderColor: '#2a2a2a' },
  disabilityChipActive: { backgroundColor: '#00d4aa', borderColor: '#00d4aa' },
  disabilityLabel: { color: '#fff', fontSize: 13, textAlign: 'center' },
  disabilityLabelActive: { color: '#0a0a0a', fontWeight: 'bold' },
  infoBox: { flexDirection: 'row', backgroundColor: '#00bfff11', borderRadius: 12, padding: 14, gap: 10, borderWidth: 1, borderColor: '#00bfff33' },
  infoText: { color: '#aaa', fontSize: 13, flex: 1, lineHeight: 20 },
  settingCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a1a1a', borderRadius: 16, padding: 16, marginBottom: 14, gap: 14, borderWidth: 1, borderColor: '#2a2a2a' },
  settingIconBox: { width: 52, height: 52, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  settingInfo: { flex: 1 },
  settingTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  settingDesc: { color: '#888', fontSize: 13, marginTop: 4 },
  toggle: { width: 48, height: 28, borderRadius: 14, backgroundColor: '#333', justifyContent: 'center', padding: 3 },
  toggleDot: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#fff' },
  toggleDotOn: { alignSelf: 'flex-end' },
  doneIconBox: { alignItems: 'center', marginBottom: 24, marginTop: 20 },
  summaryBox: { backgroundColor: '#1a1a1a', borderRadius: 16, padding: 20, marginTop: 24, gap: 14 },
  summaryTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  summaryRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  summaryText: { color: '#aaa', fontSize: 14 },
  navButtons: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 24, 
    paddingVertical: 20, 
    paddingBottom: Platform.OS === 'ios' ? 40 : 20 
  },
  backButton: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  backButtonText: { color: '#888', fontSize: 16 },
  nextButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#00d4aa', borderRadius: 14, paddingHorizontal: 24, paddingVertical: 14, gap: 8 },
  nextButtonDisabled: { backgroundColor: '#222', opacity: 0.5 },
  nextButtonText: { color: '#0a0a0a', fontSize: 16, fontWeight: 'bold' },
  finishButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#00d4aa', borderRadius: 14, paddingHorizontal: 24, paddingVertical: 14, gap: 8 },
  
  // Custom slide elements:
  permissionVisualCard: { 
    height: 180, 
    backgroundColor: '#111', 
    borderRadius: 16, 
    borderColor: '#222', 
    borderWidth: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginVertical: 20, 
    padding: 20, 
    overflow: 'hidden' 
  },
  scanLine: { 
    position: 'absolute', 
    top: '50%', 
    left: 0, 
    right: 0, 
    height: 2, 
    backgroundColor: '#00d4aa', 
    shadowColor: '#00d4aa', 
    shadowOpacity: 0.5, 
    shadowRadius: 5 
  },
  privacyHighlight: { color: '#888', fontSize: 12, textAlign: 'center', marginTop: 15 },
  permissionButton: { 
    flexDirection: 'row', 
    backgroundColor: '#00d4aa', 
    padding: 16, 
    borderRadius: 14, 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: 8, 
    marginTop: 10 
  },
  permissionButtonActive: { backgroundColor: '#a855f7' }, // Distinct visual reward
  permissionButtonText: { color: '#0a0a0a', fontWeight: 'bold', fontSize: 16 },
  calibList: { gap: 20, marginTop: 10 },
  calibRow: { flexDirection: 'row', gap: 16, backgroundColor: '#1a1a1a', borderRadius: 16, padding: 16, borderLeftWidth: 3, borderLeftColor: '#00d4aa' },
  calibIconWrapper: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#00d4aa15', alignItems: 'center', justifyContent: 'center' },
  calibTextWrapper: { flex: 1 },
  calibItemTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  calibItemDesc: { color: '#888', fontSize: 13, lineHeight: 18 },
});