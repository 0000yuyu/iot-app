import React, { useEffect, useRef, useState } from 'react';
import WebView from 'react-native-webview';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Image,
  TouchableOpacity,
  Dimensions,
  Alert,
  Button,
} from 'react-native';

import { useLocalSearchParams } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { loadPlants } from '@/utils/storage';
import { io, Socket } from 'socket.io-client';

const { width } = Dimensions.get('window');

const PlantDetailScreen = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [isLoading, setIsLoading] = useState(true);
  const [plantData, setPlantData] = useState<any>(null);
  const [plantState, setPlantState] = useState<any>({
    temperature: 0,
    humidity: 0,
    aiMessage: '',
    streamUrl: '',
  });
  const [wateringInterval, setWateringInterval] = useState(0);
  const socketRef = useRef<Socket | null>(null);
  const [streamError, setStreamError] = useState(false);

  const sendControlCommand = async (value: number) => {
    try {
      const response = await fetch(
        'http://' + plantData.flaskServerIp + '/data',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            plant_id: id,
            value,
          }),
        }
      );

      if (!response.ok) throw new Error('요청 실패');
      Alert.alert('성공', `값이 ${value}로 설정되었습니다.`);
    } catch (err) {
      Alert.alert(
        '오류',
        `값을 전송하는 중 오류 발생: ${(err as Error).message}`
      );
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      const allPlants = await loadPlants();
      const foundPlant = allPlants.find((p) => p.id === id);
      if (foundPlant) {
        setPlantData(foundPlant);
        setIsLoading(false);
      }
    };
    fetchData();
  }, [id]);

  useEffect(() => {
    if (!plantData?.flaskServerIp) return;

    if (socketRef.current) {
      socketRef.current.disconnect();
    }

    socketRef.current = io(`${plantData.flaskServerIp}`, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current.on('plant_data', (data) => {
      setPlantState((prevState) => ({
        ...prevState,
        temperature:
          typeof data.temperature === 'number'
            ? data.temperature
            : prevState.temperature,
        humidity:
          typeof data.humidity === 'number'
            ? data.humidity
            : prevState.humidity,
        aiMessage: data.aiMessage || prevState.aiMessage,
        streamUrl: data.streamUrl || prevState.streamUrl,
      }));
    });

    const timer = setInterval(() => {
      if (plantState.streamUrl) {
        fetch(`${plantState.streamUrl}?${Date.now()}`)
          .then((response) => response.blob())
          .then((blob) => {
            const imageUrl = URL.createObjectURL(blob);
            setPlantState((prev) => ({ ...prev, imageUrl }));
          })
          .catch((err) => {
            console.error('이미지 로드 오류:', err);
          });
      }
    }, 2000);

    return () => {
      socketRef.current?.disconnect();
      clearInterval(timer);
    };
  }, [plantData?.flaskServerIp]);

  useEffect(() => {
    sendControlCommand(wateringInterval);
  }, [wateringInterval]);

  const adjustInterval = (amount: number) => {
    setWateringInterval((prev) => Math.max(1, Math.min(14, prev + amount)));
  };

  const testConnection = async () => {
    if (!plantData?.flaskServerIp) {
      Alert.alert('오류', '식물 데이터가 없습니다.');
      return;
    }

    try {
      const response = await fetch(
        `http://${plantData.flaskServerIp}:5000/ping`
      );
      const data = await response.json();

      Alert.alert(
        '서버 연결 성공',
        `서버 IP: ${data.server_ip}\n스트림 URL: ${data.stream_url}`
      );

      setPlantState((prev) => ({ ...prev, streamUrl: data.stream_url }));
    } catch (error) {
      Alert.alert('서버 연결 실패', `오류: ${(error as Error).message}`);
    }
  };

  if (isLoading || !plantData || !plantData.flaskServerIp) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size='large' color='#66895D' />
        <Text style={styles.loadingText}>식물 정보를 불러오는 중...</Text>
      </View>
    );
  }

  const mjpegHtml = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
      body, html { margin: 0; padding: 0; height: 100%; width: 100%; overflow: hidden; }
      img { width: 100%; height: 100%; object-fit: cover; }
    </style>
  </head>
  <body>
    <img src="${plantState.streamUrl || ''}" />
  </body>
  </html>
`;

  return (
    <View style={styles.container}>
      {/* 카메라 박스 */}
      {plantState.streamUrl ? (
        <View style={styles.cameraFeed}>
          <WebView
            source={{ html: mjpegHtml }}
            style={{ flex: 1 }}
            onError={() => setStreamError(true)}
            originWhitelist={['*']}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            startInLoadingState={true}
          />
        </View>
      ) : (
        <View style={styles.cameraPlaceholder}>
          <Text>스트림 연결 중...</Text>
        </View>
      )}

      <Text style={styles.aiMessage}>
        {plantState.aiMessage ?? 'AI 메시지입니다.'}
      </Text>

      {/* 환경 정보 박스들 */}
      <View style={styles.envRow}>
        <View style={styles.envBox}>
          <FontAwesome name='thermometer-half' size={30} color='red' />
          <Text style={styles.envLabel}>온도</Text>
          <Text style={styles.envValue}>
            {plantState.temperature.toFixed(2) ?? '0'}℃
          </Text>
        </View>

        <View style={styles.envBox}>
          <FontAwesome name='tint' size={30} color='#007AFF' />
          <Text style={styles.envLabel}>습도</Text>
          <Text style={styles.envValue}>
            {plantState.temperature.toFixed(2) ?? '0'}%
          </Text>
        </View>
      </View>

      {/* 물 주기 조절 박스 */}
      <View style={styles.circleCard}>
        <Text style={styles.sectionTitle}>물 주는 주기 (초)</Text>

        <View style={styles.sliderContainer}>
          <TouchableOpacity
            onPress={() => adjustInterval(-1)}
            style={styles.controlButton}
          >
            <Text style={styles.controlButtonText}>-</Text>
          </TouchableOpacity>

          <View style={styles.circle}>
            <Text style={styles.intervalText}>{wateringInterval}초</Text>
          </View>

          <TouchableOpacity
            onPress={() => adjustInterval(1)}
            style={styles.controlButton}
          >
            <Text style={styles.controlButtonText}>+</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.subText}>
          매 {wateringInterval}초 마다 물을 줄게요
        </Text>
      </View>
    </View>
  );
};

export default PlantDetailScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#F9F6F1',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#999',
  },
  cameraFeed: {
    width: '100%',
    height: width * 0.5,
    borderRadius: 16,
    marginBottom: 15,
    backgroundColor: '#EEE',
  },
  cameraPlaceholder: {
    width: '100%',
    height: width * 0.5,
    borderRadius: 16,
    backgroundColor: '#EEE',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  aiMessage: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 16,
  },
  envRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  envBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    flex: 1,
    marginHorizontal: 6,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  envLabel: {
    marginTop: 8,
    fontSize: 14,
    color: '#666',
  },
  envValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 4,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  circleCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  controlButton: {
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: 'white',
    borderRadius: 30,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 20,
  },
  controlButtonText: {
    fontSize: 50,
    fontWeight: 'bold',
    color: '#66895D',
  },
  circle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#66895D',
  },
  intervalText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  subText: {
    marginTop: 16,
    fontSize: 14,
    color: '#777',
  },
});
