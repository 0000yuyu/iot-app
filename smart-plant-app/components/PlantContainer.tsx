import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { PlantData } from '../utils/types'; // PlantData 타입 임포트
import { MaterialCommunityIcons } from '@expo/vector-icons'; // 아이콘 사용 (npm install @expo/vector-icons)

interface PlantContainerProps {
  plant: PlantData;
  onPress: () => void;
  onDelete: () => void;
}

const PlantContainer: React.FC<PlantContainerProps> = ({
  plant,
  onPress,
  onDelete,
}) => {
  const lastModifiedDate = new Date().toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const lastModifiedTime = new Date().toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.header}>
        <View style={styles.statusDot} />
        <Text style={styles.plantName}>{plant.name}</Text>
        <Text>{plant.flaskServerIp}</Text>
      </View>
      <Text style={styles.lastModified}>
        {lastModifiedDate} {lastModifiedTime}에 수정됨
      </Text>
      <View style={styles.buttonsContainer}>
        <TouchableOpacity style={styles.button} onPress={onPress}>
          <MaterialCommunityIcons name='redo' size={18} color='#007AFF' />
          <Text style={styles.buttonText}>동면해제</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconButton} onPress={onDelete}>
          <MaterialCommunityIcons
            name='delete-outline'
            size={18}
            color='#666'
          />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconButton}>
          <MaterialCommunityIcons name='link-variant' size={18} color='#666' />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconButton}>
          <MaterialCommunityIcons
            name='dots-horizontal'
            size={18}
            color='#666'
          />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    margin: 8,
    width: '45%', // 두 열을 위해 폭 조절
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4CAF50', // 초록색 (활성화 상태)
    marginRight: 5,
  },
  plantName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  lastModified: {
    fontSize: 12,
    color: '#888',
    marginBottom: 10,
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E0F2FF', // 연한 파란색
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  buttonText: {
    color: '#007AFF',
    fontSize: 13,
    fontWeight: 'bold',
    marginLeft: 5,
  },
  iconButton: {
    padding: 5,
  },
});

export default PlantContainer;
