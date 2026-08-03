import { useEffect, useState } from 'react';
import { Tabs, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View } from 'react-native';

export default function RootLayout() {
  const [onboardingComplete, setOnboardingComplete] = useState<boolean | null>(null);
  const router = useRouter();

  useEffect(() => {
    const check = async () => {
      try {
        const done = await AsyncStorage.getItem('onboardingComplete');
        setOnboardingComplete(done === 'true');
      } catch {
        setOnboardingComplete(false);
      }
    };
    check();
  }, []);

  useEffect(() => {
    if (onboardingComplete === null) return;
    
    if (!onboardingComplete) {
      // Force direct redirection to onboarding
      router.replace('/onboarding');
    }
  }, [onboardingComplete]);

  if (onboardingComplete === null) {
    return <View style={{ flex: 1, backgroundColor: '#0a0a0a' }} />;
  }

  return (
    <>
      <StatusBar style="light" />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: '#111111',
            borderTopColor: '#222222',
            borderTopWidth: 1,
            height: 70,
            paddingBottom: 10,
            paddingTop: 8,
          },
          tabBarActiveTintColor: '#00d4aa',
          tabBarInactiveTintColor: '#555555',
          tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} />,
          }}
        />
        <Tabs.Screen name="report" options={{ href: null }} />
        <Tabs.Screen
          name="library"
          options={{
            title: 'Exercises',
            tabBarIcon: ({ color, size }) => <Ionicons name="library" size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="analysis"
          options={{
            title: 'Analyse',
            tabBarIcon: ({ color, size }) => <Ionicons name="videocam" size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="history"
          options={{
            title: 'History',
            tabBarIcon: ({ color, size }) => <Ionicons name="time" size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color, size }) => <Ionicons name="person" size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="rehab"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="romtracker"
          options={{
            href: null,
          }}
        />
        
        <Tabs.Screen name="therapist" options={{ href: null }} />
        <Tabs.Screen name="elderly" options={{ href: null }} />
        
        {/* CRITICAL FIX: Explicitly hide the tab bar when on the onboarding screen.
          This ensures a completely clean, full-screen onboarding experience.
        */}
        <Tabs.Screen
          name="onboarding"
          options={{
            href: null,
            tabBarStyle: { display: 'none' }, // Hides bottom bar entirely
          }}
        />
      </Tabs>
    </>
  );
}