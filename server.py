#!/usr/bin/env python3

import eventlet
eventlet.monkey_patch()

import time
import threading
import json
import os
import atexit
from datetime import datetime
from flask import Flask, jsonify
from flask_cors import CORS
from flask_socketio import SocketIO
import spidev
import RPi.GPIO as GPIO  # GPIO 라이브러리 추가
from ai.learning import test_image, save_reference_vector

# 애플리케이션 설정
app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})
app.config['SECRET_KEY'] = 'secret!'
socketio = SocketIO(app, cors_allowed_origins='*')

# SPI 설정
spi = spidev.SpiDev()
spi.open(0, 0)
spi.max_speed_hz = 1000000  # 1MHz

# 상태 파일 설정
state_file = 'state.json'
is_running = True

# 펌프 설정
PUMP_PIN = 17  # GPIO 17 핀 사용
watering_interval = 0  # 초기 워터링 간격 (초)
last_watering_time = 0  # 마지막 워터링 시간

# GPIO 설정
GPIO.setmode(GPIO.BCM)
GPIO.setup(PUMP_PIN, GPIO.OUT)
GPIO.output(PUMP_PIN, GPIO.LOW)  # 초기에는 펌프 꺼짐

# MCP3008에서 채널 값 읽기 함수
def read_adc(channel):
    try:
        if channel > 7 or channel < 0:
            return -1
            
        r = spi.xfer2([1, (8 + channel) << 4, 0])
        # 10비트 ADC 값 추출
        adc_val = ((r[1] & 3) << 8) + r[2]
        return adc_val
    except Exception as e:
        print(f"ADC 읽기 오류: {e}")
        return -1

# TMP36GT9Z 온도 센서 값을 섭씨로 변환
def convert_temp(adc_value):
    try:
        # 아날로그 값을 전압으로 변환 (0-1023 -> 0-3.3V)
        voltage = adc_value * 3.3 / 1023
        # 전압을 온도로 변환 (TMP36GT9Z: 10mV/°C 비율, 0.5V 오프셋)
        temperature = (voltage - 0.5) * 100
        return temperature
    except:
        return 0  # 오류 시 0 반환

# 토양 습도 센서 값을 퍼센트로 변환
def convert_humidity(adc_value):
    try:
        # 센서 값의 범위 설정 (이 값은 실제 센서에 맞게 조정)
        max_value = 1023  # 완전 건조 상태
        min_value = 0     # 완전 젖은 상태
        
        # 측정된 센서 값을 0-100% 범위로 변환
        if adc_value > max_value:
            adc_value = max_value
        if adc_value < min_value:
            adc_value = min_value
            
        moisture_percent = ((max_value - adc_value) / (max_value - min_value)) * 100
        return moisture_percent
    except:
        return 0  # 오류 시 0 반환

# 상태 파일 읽기
def read_state():
    default_state = {
        'temperature': 50,
        'humidity': 30,
        'aiMessage': '지금은 상태가 좋아요!'
    }
    
    try:
        if os.path.exists(state_file):
            with open(state_file, 'r') as f:
                state = json.load(f)
                
            # 필수 키가 모두 있는지 확인하고 없으면 기본값 사용
            for key in default_state:
                if key not in state:
                    state[key] = default_state[key]
            
            return state
        else:
            # 파일이 없으면 기본값으로 새로 생성
            save_state(default_state)
            return default_state
    except Exception as e:
        print(f"상태 파일 읽기 오류: {e}")
        save_state(default_state)
        return default_state

# 상태 파일 저장
def save_state(data):
    try:
        with open(state_file, 'w') as f:
            json.dump(data, f)
    except Exception as e:
        print(f"상태 파일 저장 오류: {e}")

# 펌프 제어 함수
def pump_on():
    GPIO.output(PUMP_PIN, GPIO.HIGH)
    print("펌프 켜짐")

def pump_off():
    GPIO.output(PUMP_PIN, GPIO.LOW)
    print("펌프 꺼짐")

# 워터링 수행 함수
def do_watering():
    print("워터링 시작")
    pump_on()
    time.sleep(10)  # 10초 동안 펌프 가동
    pump_off()
    print("워터링 완료")

# 워터링 체크 스레드
def watering_thread():
    global is_running, watering_interval, last_watering_time
    
    while is_running:
        try:
            # 워터링 간격이 설정되어 있고, 마지막 워터링 이후 충분한 시간이 지났는지 확인
            if watering_interval > 0 and time.time() - last_watering_time >= watering_interval:
                do_watering()
                last_watering_time = time.time()  # 마지막 워터링 시간 업데이트
            
            time.sleep(1)  # 1초마다 확인
        except Exception as e:
            print(f"워터링 스레드 오류: {e}")
            pump_off()  # 오류 발생 시 안전하게 펌프 끄기
            time.sleep(5)

# 센서 데이터 수집 스레드
def sensor_thread():
    global is_running
    last_data_time = 0
    
    while is_running:
        try:
            current_time = time.time()
            
            # 1초마다 센서 데이터 읽기 및 소켓으로 전송
            if current_time - last_data_time >= 1:
                # 토양 습도 센서 읽기 (MCP3008 채널 0)
                humidity_adc = read_adc(0)
                humidity = convert_humidity(humidity_adc) if humidity_adc >= 0 else 0
                
                # 온도 센서 읽기 (MCP3008 채널 1)
                temp_adc = read_adc(1)
                temperature = convert_temp(temp_adc) if temp_adc >= 0 else 0
                
                # 상태 데이터 읽기
                state_data = read_state()
                ai_message = state_data.get('aiMessage', '데이터를 분석 중입니다...')
                
                # 스트림 URL 추가 (MJPEG 스트리머 주소)
                stream_url = f"http://{get_ip_address()}:8090/?action=stream"
                
                # 이미지 캡처 및 AI 테스트
                script_dir = os.path.dirname(os.path.abspath(__file__))
                img_path = os.path.join(script_dir, 'img.jpg')
                capture_image(img_path)
                ai_message = test_model(img_path)

                
                # 소켓으로 데이터 전송
                socketio.emit('plant_data', {
                    'temperature': temperature,
                    'humidity': humidity,
                    'aiMessage': ai_message,
                    'streamUrl': stream_url  # MJPEG 스트림 URL
                })
                
                # 센서 값 로깅
                print(f"센서 데이터 - 온도: {temperature:.2f}°C, 습도: {humidity:.2f}%")
                
                last_data_time = current_time
                
            time.sleep(0.1)  # CPU 사용량 감소
            
        except Exception as e:
            print(f"센서 스레드 오류: {e}")
            time.sleep(0.5)  # 오류 발생 시 잠시 대기

# IP 주소 확인 함수
def get_ip_address():
    import socket
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        # 구글 DNS에 연결하여 자신의 IP 확인
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
    except Exception:
        ip = "127.0.0.1"
    finally:
        s.close()
    return ip

# 이미지 캡처 함수
def capture_image(img_path):
    # OpenCV 또는 다른 라이브러리를 사용하여 이미지 캡처
    import cv2
    cap = cv2.VideoCapture(0)
    ret, frame = cap.read()
    if ret:
        cv2.imwrite(img_path, frame)
    cap.release()

# 리소스 정리 함수
def cleanup():
    global is_running
    print("프로그램 종료 중... 리소스 정리")
    is_running = False
    time.sleep(0.5)
    try:
        pump_off()  # 펌프 끄기
        GPIO.cleanup()  # GPIO 정리
        print("GPIO 정리 완료")
        
        spi.close()
        print("SPI 연결 종료")
    except:
        pass

# 종료 시 cleanup 함수 실행 등록
atexit.register(cleanup)

# Flask 라우트
@app.route('/')
def index():
    return "Plant Monitoring Server is running. Connect to /socket.io for real-time data."

# 핑 테스트용 엔드포인트
@app.route('/ping')
def ping():
    return jsonify({
        "status": "ok", 
        "timestamp": time.time(),
        "server_ip": get_ip_address(),
        "stream_url": f"http://{get_ip_address()}:8090/?action=stream"
    })

# 데이터 수신 엔드포인트 - 여기에 펌프 제어 로직 추가
@app.route('/data', methods=['POST', 'OPTIONS'])
def receive_data():
    from flask import request, make_response
    
    global watering_interval, last_watering_time
    
    if request.method == 'OPTIONS':
        response = make_response()
        response.headers.add("Access-Control-Allow-Origin", "*")
        response.headers.add("Access-Control-Allow-Methods", "POST, OPTIONS")
        response.headers.add("Access-Control-Allow-Headers", "Content-Type")
        return response
    try:
        data = request.get_json()
        print('데이터 수신:', data)
        
        # value 값이 있으면 워터링 간격으로 설정
        if 'value' in data:
            try:
                watering_interval = int(data['value'])
                last_watering_time = time.time()  # 현재 시간으로 마지막 워터링 시간 초기화
                print(f"워터링 간격이 {watering_interval}초로 설정됨")
            except:
                print("잘못된 value 값")
        
        save_state(data)  # 데이터를 파일에 저장
        return jsonify({'status': 'ok'})
    except Exception as e:
        print(f"데이터 처리 오류: {e}")
        return jsonify({'status': 'error', 'message': str(e)})

@socketio.on('connect')
def handle_connect():
    from flask import request
    print('클라이언트 연결됨:', request.sid)
    
    # 연결 즉시 현재 상태 전송
    humidity_adc = read_adc(0)
    humidity = convert_humidity(humidity_adc) if humidity_adc >= 0 else 0
    
    temp_adc = read_adc(1)
    temperature = convert_temp(temp_adc) if temp_adc >= 0 else 0
    
    state_data = read_state()
    
    stream_url = f"http://{get_ip_address()}:8090/?action=stream"
    
    socketio.emit('plant_data', {
        'temperature': temperature,
        'humidity': humidity,
        'aiMessage': state_data.get('aiMessage', '데이터를 분석 중입니다...'),
        'streamUrl': stream_url
    })

@socketio.on('disconnect')
def handle_disconnect():
    from flask import request
    print('클라이언트 연결 해제됨:', request.sid)

def main():
    try:
        # 센서 스레드 시작
        sensor_thread_obj = threading.Thread(target=sensor_thread)
        sensor_thread_obj.daemon = True
        sensor_thread_obj.start()
        
        # 워터링 스레드 시작
        water_thread_obj = threading.Thread(target=watering_thread)
        water_thread_obj.daemon = True
        water_thread_obj.start()
        
        # 서버 IP 출력
        ip = get_ip_address()
        print(f"서버 시작 - http://{ip}:5000")
        print(f"MJPEG 스트림 - http://{ip}:8090/?action=stream")
        
        # Flask 서버 시작
        socketio.run(app, host='0.0.0.0', port=5000, debug=False)
        
    except KeyboardInterrupt:
        print("사용자에 의해 프로그램 종료")
    except Exception as e:
        print(f"예상치 못한 오류 발생: {e}")

if __name__ == '__main__':
    main()