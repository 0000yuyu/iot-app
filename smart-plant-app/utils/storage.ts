import AsyncStorage from '@react-native-async-storage/async-storage';
import { PlantData } from './types'; // PlantData 타입을 utils/types.ts에서 임포트

const STORAGE_KEY = '@SmartPlantApp:plants';

export const savePlant = async (newPlant: PlantData) => {
  try {
    const existingPlants = await loadPlants();
    // 중복 포트 번호 체크 (선택 사항)
    if (existingPlants.some((p) => p.portNumber === newPlant.portNumber)) {
      throw new Error('이미 존재하는 포트 번호입니다.');
    }
    const updatedPlants = [...existingPlants, newPlant];
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedPlants));
  } catch (error) {
    console.error('식물 저장 오류:', error);
    throw error;
  }
};

export const loadPlants = async (): Promise<PlantData[]> => {
  try {
    const jsonValue = await AsyncStorage.getItem(STORAGE_KEY);
    return jsonValue != null ? JSON.parse(jsonValue) : [];
  } catch (error) {
    console.error('식물 로드 오류:', error);
    return [];
  }
};

export const deletePlant = async (portNumber: string) => {
  try {
    const existingPlants = await loadPlants();
    const updatedPlants = existingPlants.filter(
      (plant) => plant.portNumber !== portNumber
    );
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedPlants));
  } catch (error) {
    console.error('식물 삭제 오류:', error);
    throw error;
  }
};
