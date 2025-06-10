import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  Dimensions,
  Image,
  Platform,
} from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { loadPlants } from '../../utils/storage';
import { PlantData } from '../../utils/types';
import { io } from 'socket.io-client';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';

const { width } = Dimensions.get('window');

// Slider 컴포넌트 (웹 대응)
function SliderComponent({
  value,
  onValueChange,
  onSlidingComplete,
  minimumValue,
  maximumValue,
  step,
  minimumTrackTintColor,
  maximumTrackTintColor,
  thumbTintColor,
}: {
  value: number;
  onValueChange: (val: number) => void;
  onSlidingComplete: (val: number) => void;
  minimumValue: number;
  maximumValue: number;
  step: number;
  minimumTrackTintColor: string;
  maximumTrackTintColor: string;
  thumbTintColor: string;
}) {
  if (Platform.OS === 'web') {
    return (
      <input
        type='range'
        min={minimumValue}
        max={maximumValue}
        step={step}
        value={value}
        onChange={(e) => onValueChange(Number(e.target.value))}
        onMouseUp={(e) =>
          onSlidingComplete(Number((e.target as HTMLInputElement).value))
        }
        style={{
          width: '100%',
          marginTop: 10,
          marginBottom: 20,
          accentColor: thumbTintColor,
        }}
      />
    );
  }

  return (
    <Slider
      value={value}
      onValueChange={onValueChange}
      onSlidingComplete={onSlidingComplete}
      minimumValue={minimumValue}
      maximumValue={maximumValue}
      step={step}
      minimumTrackTintColor={minimumTrackTintColor}
      maximumTrackTintColor={maximumTrackTintColor}
      thumbTintColor={thumbTintColor}
      style={{ width: '100%', height: 40 }}
    />
  );
}

export default function PlantDetailScreen() {
  const { id } = useLocalSearchParams();
  const plantId = typeof id === 'string' ? id : '';
  const [plant, setPlant] = useState<PlantData | null>(null);
  const [currentLight, setCurrentLight] = useState(5);
  const [currentMoisture, setCurrentMoisture] = useState(5);
  const [imageUri, setImageUri] = useState<string | null>(null);

  useEffect(() => {
    const fetchPlant = async () => {
      const allPlants = await loadPlants();
      const foundPlant = allPlants.find((p) => p.portNumber === plantId);
      if (foundPlant) {
        setPlant(foundPlant);
        setCurrentLight(foundPlant.initialLight ?? 5);
        setCurrentMoisture(foundPlant.initialMoisture ?? 5);
      } else {
        Alert.alert('오류', '해당 식물을 찾을 수 없습니다.');
      }
    };
    fetchPlant();
  }, [plantId]);
  const socketRef = useRef<ReturnType<typeof io> | null>(null);

  useEffect(() => {
    if (!plant?.flaskServerIp) return;

    if (socketRef.current) {
      socketRef.current.disconnect();
    }

    socketRef.current = io(`${plant.flaskServerIp}`);

    socketRef.current.on('video_frame', (data) => {
      setImageUri(data.image);
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, [plant?.flaskServerIp]);

  const sendControlCommand = async (
    type: 'light' | 'moisture',
    value: number
  ) => {
    try {
      const response = await fetch('http://' + plant.flaskServerIp + '/data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plant_id: plantId,
          type,
          value,
        }),
      });

      if (!response.ok) throw new Error('요청 실패');
      Alert.alert('성공', `${type} 값이 ${value}로 설정되었습니다.`);
    } catch (err) {
      Alert.alert(
        '오류',
        `값을 전송하는 중 오류 발생: ${(err as Error).message}`
      );
    }
  };

  if (!plant) {
    return (
      <View style={styles.loadingContainer}>
        <Text>식물 정보를 불러오는 중...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerTitle: plant.name || '식물 상세' }} />
      <View style={styles.card}>
        {imageUri ? (
          <Image
            alt='식물 이미지'
            source={{ uri: imageUri }}
            style={styles.cameraFeed}
            resizeMode='cover'
          />
        ) : (
          <View style={styles.cameraPlaceholder}>
            <MaterialCommunityIcons name='camera-off' size={60} color='#999' />
            <Text style={styles.loadingText}>카메라 피드를 불러오는 중...</Text>
          </View>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.gaugeLabel}>💡 불 밝기 (Light)</Text>
        <Text style={styles.currentValue}>{currentLight} / 10</Text>
        <SliderComponent
          value={currentLight}
          onValueChange={setCurrentLight}
          onSlidingComplete={(val) => sendControlCommand('light', val)}
          minimumValue={0}
          maximumValue={10}
          step={1}
          minimumTrackTintColor='#FFD700'
          maximumTrackTintColor='#ccc'
          thumbTintColor='#FFD700'
        />

        <Text style={styles.gaugeLabel}>💧 물 주기 정도 (Moisture)</Text>
        <Text style={styles.currentValue}>{currentMoisture} / 10</Text>
        <SliderComponent
          value={currentMoisture}
          onValueChange={setCurrentMoisture}
          onSlidingComplete={(val) => sendControlCommand('moisture', val)}
          minimumValue={0}
          maximumValue={10}
          step={1}
          minimumTrackTintColor='#007AFF'
          maximumTrackTintColor='#ccc'
          thumbTintColor='#007AFF'
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f0f2f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cameraFeed: {
    width: '100%',
    height: width * 0.5,
    backgroundColor: '#eee',
    borderRadius: 10,
    marginBottom: 15,
  },
  cameraPlaceholder: {
    width: '100%',
    height: width * 0.5,
    backgroundColor: '#eee',
    borderRadius: 10,
    marginBottom: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gaugeLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#333',
  },
  currentValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
});
