// utils/types.ts
export interface PlantData {
  name: string;
  portNumber: string; // 식별자로 사용될 포트 번호
  flaskServerIp: string; // ✨ 추가: 해당 식물의 Flask 서버 IP 주소
  initialMoisture: number;
  initialLight: number;
}
