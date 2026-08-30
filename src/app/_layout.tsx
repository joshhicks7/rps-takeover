import { Cinzel_700Bold, Cinzel_900Black, useFonts } from '@expo-google-fonts/cinzel';
import { UnifrakturCook_700Bold } from '@expo-google-fonts/unifrakturcook';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, type ReactNode } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider, useAuth } from '@/context/AuthContext';
import { colors } from '@/theme';

SplashScreen.preventAutoHideAsync();

function Gate({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const authRoute = segments[0] === 'login' || segments[0] === 'register';

  useEffect(() => {
    if (loading) return;
    if (!user && !authRoute) router.replace('/login');
    if (user && authRoute) router.replace('/');
  }, [user, loading, authRoute, router]);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.green} />
      </View>
    );
  }

  return <>{children}</>;
}

function Root() {
  const [fontsLoaded] = useFonts({
    Cinzel_700Bold,
    Cinzel_900Black,
    UnifrakturCook_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <AuthProvider>
      <Gate>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.bg },
            animation: 'fade',
          }}
        />
      </Gate>
    </AuthProvider>
  );
}

export default function Layout() {
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.bg }}>
      <SafeAreaProvider>
        <Root />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
