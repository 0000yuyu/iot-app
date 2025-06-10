import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { savePlant } from '../utils/storage';

export default function AddPlantScreen() {
  const [name, setName] = useState('');
  const [portNumber, setPortNumber] = useState('');
  const [flaskServerIp, setFlaskServerIp] = useState('');
  const [initialMoisture, setInitialMoisture] = useState('');
  const [initialLight, setInitialLight] = useState('');

  const handleSubmit = async () => {
    // 유효성 검사
    if (
      !name ||
      !portNumber ||
      !flaskServerIp ||
      !initialMoisture ||
      !initialLight
    ) {
      Alert.alert('모든 항목을 입력해주세요.');
      return;
    }

    if (!/^\d+$/.test(portNumber)) {
      Alert.alert('포트 번호는 숫자만 입력해주세요.');
      return;
    }

    if (
      !/^((?:(?:25[0-5]|2[0-4]\d|1?\d{1,2})\.){3}(?:25[0-5]|2[0-4]\d|1?\d{1,2})|localhost)(?::\d{1,5})?$/.test(
        flaskServerIp
      )
    ) {
      Alert.alert('유효한 IP 주소나 localhost를 입력해주세요.');
      return;
    }

    const plantData = {
      name,
      portNumber,
      flaskServerIp,
      initialMoisture: Number(initialMoisture),
      initialLight: Number(initialLight),
    };

    try {
      await savePlant(plantData);
      Alert.alert('성공', '새 식물이 추가되었습니다.');
      router.back();
    } catch (error: any) {
      console.error('식물 추가 실패:', error);
      Alert.alert('오류', error.message || '식물 추가에 실패했습니다.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.form}>
          <Text style={styles.label}>식물 이름</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder='예: 스네이크 플랜트'
          />

          <Text style={styles.label}>식물 아이디 (포트 번호)</Text>
          <TextInput
            style={styles.input}
            value={portNumber}
            onChangeText={setPortNumber}
            placeholder='예: 123'
            keyboardType='numeric'
          />

          <Text style={styles.label}>Flask 서버 주소</Text>
          <TextInput
            style={styles.input}
            value={flaskServerIp}
            onChangeText={setFlaskServerIp}
            placeholder='예: 192.168.0.1:5000 또는 localhost:5000'
            autoCapitalize='none'
          />

          <Text style={styles.label}>초기 물 세기 (°C)</Text>
          <TextInput
            style={styles.input}
            value={initialMoisture}
            onChangeText={setInitialMoisture}
            placeholder='예: 25'
            keyboardType='numeric'
          />

          <Text style={styles.label}>초기 광량 (%)</Text>
          <TextInput
            style={styles.input}
            value={initialLight}
            onChangeText={setInitialLight}
            placeholder='예: 50'
            keyboardType='numeric'
          />

          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
            <Text style={styles.submitButtonText}>식물 추가하기</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f2f5',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  form: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
    marginTop: 10,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 10,
    fontSize: 16,
    marginBottom: 5,
  },
  submitButton: {
    backgroundColor: '#4CAF50',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
