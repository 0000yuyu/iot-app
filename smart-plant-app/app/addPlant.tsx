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

export default function AddPlantScreen({ setAddPlant }) {
  const [name, setName] = useState('');
  const [id, setId] = useState('');
  const [flaskServerIp, setFlaskServerIp] = useState('');
  const [initialMoisture, setInitialMoisture] = useState('');
  const [initialLight, setInitialLight] = useState('');

  const handleSubmit = async () => {
    if (!name || !id || !flaskServerIp) {
      Alert.alert('모든 항목을 입력해주세요.');
      return;
    }

    if (!/^\d+$/.test(id)) {
      Alert.alert('아이디는 숫자만 입력해주세요.');
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
      id,
      flaskServerIp,
      initialMoisture: Number(initialMoisture),
      initialLight: Number(initialLight),
    };

    try {
      await savePlant(plantData);
      Alert.alert('성공', '새 식물이 추가되었습니다.');
    } catch (error: any) {
      console.error('식물 추가 실패:', error);
      Alert.alert('오류', error.message || '식물 추가에 실패했습니다.');
    }

    setAddPlant(false);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.form}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setAddPlant(false)}
          >
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>

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
            value={id}
            onChangeText={setId}
            placeholder='고유한 id를 지정해주세요!'
            keyboardType='numeric'
          />

          <Text style={styles.label}>Flask 서버 주소</Text>
          <TextInput
            style={styles.input}
            value={flaskServerIp}
            onChangeText={setFlaskServerIp}
            placeholder='예: 192.168.0.1:5000 또는 localhost:5000'
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
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  form: {
    width: '100%',
    display: 'flex',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  label: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    width: '100%',
    marginTop: 16,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 30,
    fontSize: 17,
    marginBottom: 8,
    width: 600,
  },
  submitButton: {
    backgroundColor: '#66895D',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 30,
    width: '100%',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 10,
    padding: 8,
  },
  closeButtonText: {
    fontSize: 22,
    color: '#666',
  },
});
