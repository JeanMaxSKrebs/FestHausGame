import { ActivityIndicator, View } from 'react-native';

/**
 * Root Index Route
 * Shows loading spinner while auth state is being checked
 * The actual navigation happens in _layout.tsx useEffect
 */
export default function RootIndex() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
      <ActivityIndicator size="large" color="#0000ff" />
    </View>
  );
}
