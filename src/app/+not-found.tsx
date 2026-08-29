import { Link } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Display, Screen } from '@/components/ui';

export default function NotFound() {
  return (
    <Screen>
      <View style={styles.center}>
        <Display>NOT FOUND</Display>
        <Link href="/" style={{ color: '#fff', textAlign: 'center', marginTop: 16 }}>
          HOME
        </Link>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center' },
});
