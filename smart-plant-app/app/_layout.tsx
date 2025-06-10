import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name='(tabs)' options={{ headerShown: false }} />
      <Stack.Screen
        name='plant/[id]'
        options={{ headerTitle: '식물 상세 정보' }}
      />
      <Stack.Screen
        name='addPlant'
        options={{ presentation: 'modal', headerTitle: '새 식물 추가' }}
      />
    </Stack>
  );
}
