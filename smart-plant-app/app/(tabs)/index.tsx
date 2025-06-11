import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { loadPlants, deletePlant } from '../../utils/storage';
import { PlantData } from '../../utils/types';

import PlantContainer from '../../components/PlantContainer'; // PlantContainer 컴포넌트 임포트
import AddPlantScreen from '../addPlant';

export default function HomeScreen() {
  const [plants, setPlants] = useState<PlantData[]>([]);
  const [addPlant, setAddPlant] = useState<Boolean>(false);

  const fetchPlants = async () => {
    const loadedPlants = await loadPlants();
    setPlants(loadedPlants);

    console.log(loadPlants);
  };

  // 화면 포커스될 때마다 식물 목록 새로고침
  useFocusEffect(
    useCallback(() => {
      fetchPlants();
    }, [])
  );

  const handlePressPlant = (plantId: string) => {
    router.push(`/plant/${plantId}`);
  };

  const handleDeletePlant = async (plantId: string) => {
    Alert.alert(
      '식물 삭제',
      '정말로 이 식물을 삭제하시겠습니까?',
      [
        {
          text: '취소',
          style: 'cancel',
        },
        {
          text: '삭제',
          onPress: async () => {
            await deletePlant(plantId);
            fetchPlants(); // 삭제 후 목록 새로고침
          },
          style: 'destructive',
        },
      ],
      { cancelable: true }
    );
  };

  const renderItem = ({ item }: { item: PlantData }) => (
    <PlantContainer
      plant={item}
      onPress={() => handlePressPlant(item.id)}
      onDelete={() => handleDeletePlant(item.id)}
    />
  );

  return (
    <View style={styles.container}>
      {addPlant && (
        <View style={styles.modalOverlay}>
          <AddPlantScreen setAddPlant={setAddPlant} />
        </View>
      )}
      <Text style={styles.header}>최근 실행한 컨테이너</Text>
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => setAddPlant(true)}
      >
        <Text style={styles.addButtonText}>+</Text>
      </TouchableOpacity>
      <FlatList
        data={plants}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        numColumns={2} // 두 개의 열로 표시
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            추가된 식물이 없습니다. 식물을 추가해주세요!
          </Text>
        }
      />
      <TouchableOpacity style={styles.allContainersButton}>
        <Text style={styles.allContainersButtonText}>모든 컨테이너 &gt;</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f0f2f5', // 배경색
  },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
    marginTop: 20,
    color: '#333',
  },
  addButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: '#66895D', // 파란색 버튼
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  addButtonText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  listContainer: {
    justifyContent: 'flex-start', // 왼쪽 정렬
    paddingVertical: 10,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
    color: '#666',
  },
  allContainersButton: {
    alignSelf: 'flex-end',
    marginTop: 10,
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  allContainersButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});
