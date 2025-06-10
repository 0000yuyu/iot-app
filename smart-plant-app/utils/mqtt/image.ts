import mqtt, { MqttClient, IClientOptions } from 'mqtt';

type ImageMessageCallback = (base64Image: string) => void;

export class SocketService {
  private client: MqttClient | null = null;
  private brokerUrl: string;
  private topic: string;
  private onImageMessage: ImageMessageCallback | null = null;

  constructor(brokerUrl: string, topic: string) {
    this.brokerUrl = brokerUrl;
    this.topic = topic;
  }

  connect() {
    if (this.client && this.client.connected) {
      console.log('Already connected');
      return;
    }

    const clientId = `react_native_client_${Math.floor(Math.random() * 10000)}`;

    const options: IClientOptions = {
      clientId,
      clean: true,
      reconnectPeriod: 1000,
      connectTimeout: 30 * 1000,
      keepalive: 30,
    };

    this.client = mqtt.connect(this.brokerUrl, options);

    this.client.on('connect', () => {
      console.log('✅ MQTT Connected');
      this.client?.subscribe(this.topic, (err) => {
        if (err) console.error('❌ Subscribe error:', err);
        else console.log(`📡 Subscribed to topic: ${this.topic}`);
      });
    });

    this.client.on('message', (topic, message) => {
      if (topic === this.topic && this.onImageMessage) {
        try {
          const base64Image = message.toString('base64');
          this.onImageMessage(`data:image/jpeg;base64,${base64Image}`);
        } catch (e) {
          console.error('⚠️ Failed to process image message:', e);
        }
      }
    });

    this.client.on('error', (err) => {
      console.error('⚠️ MQTT error:', err);
    });
  }

  disconnect() {
    if (this.client && this.client.connected) {
      this.client.end(() => {
        console.log('🔌 MQTT Disconnected');
        this.client = null;
      });
    }
  }

  setOnImageMessage(callback: ImageMessageCallback) {
    this.onImageMessage = callback;
  }
}
