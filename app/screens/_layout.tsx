import { Stack } from 'expo-router';

export default function ScreensLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="SignIn/index" />
      <Stack.Screen name="SignUp/index" />
      <Stack.Screen name="Home/index" />
      <Stack.Screen name="Game/index" />
    </Stack>
  );
}