// app/modal.tsx
import { Platform, StyleSheet } from 'react-native';
import { Text, View } from 'react-native'; // React Native의 기본 Text, View 컴포넌트 사용

export default function ModalScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>모달 화면</Text>
      <View style={styles.separator} />
      <Text style={styles.description}>
        이곳은 식물 앱의 추가 정보 또는 설정 등을 표시할 수 있는 모달
        화면입니다.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f2f5', // 배경색 추가
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  separator: {
    marginVertical: 30,
    height: 1,
    width: '80%',
    backgroundColor: '#ccc', // 구분선 색상 (이것만 사용)
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    color: '#555',
    lineHeight: 24,
  },
});
