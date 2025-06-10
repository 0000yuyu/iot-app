import cv2
import base64
import threading
import time
import os
from datetime import datetime, timedelta
from flask import Flask, request, render_template
from flask_cors import CORS
from flask_socketio import SocketIO, emit

app = Flask(__name__)
CORS(app)
app.config['SECRET_KEY'] = 'secret!'
socketio = SocketIO(app, cors_allowed_origins='*')

# 웹캠 설정
camera = cv2.VideoCapture(0)
camera.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
camera.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)

# 사진 저장 폴더 설정
save_dir = '/home/pi/photos/'
if not os.path.exists(save_dir):
    os.makedirs(save_dir)

# 실시간 영상 전송
def capture_frames():
    while True:
        success, frame = camera.read()
        if not success:
            continue
        ret, buffer = cv2.imencode('.jpg', frame)
        jpg_as_text = base64.b64encode(buffer).decode('utf-8')
        socketio.emit('video_frame', {'image': f'data:image/jpeg;base64,{jpg_as_text}'})
        socketio.sleep(0.1)  # 약 10fps

# 30초마다 사진 저장 + 오래된 사진 삭제
def save_frame_task():
    while True:
        success, frame = camera.read()
        if success:
            now = datetime.now()
            filename = now.strftime("sprouts.jpg")
            filepath = os.path.join(save_dir, filename)
            cv2.imwrite(filepath, frame)
            print(f"[✓] {filepath} 저장 완료.")

            # 오래된 사진 삭제 (10분 초과 파일)
            threshold = now - timedelta(minutes=0.1)
            for f in os.listdir(save_dir):
                full_path = os.path.join(save_dir, f)
                if os.path.isfile(full_path):
                    modified_time = datetime.fromtimestamp(os.path.getmtime(full_path))
                    if modified_time < threshold:
                        os.remove(full_path)
                        print(f"[🗑️] {f} 삭제됨 (10초 경과)")
        time.sleep(20)

# Flask 라우팅
@app.route('/')
def index():
    return render_template('cctv.html')

@app.route('/data', methods=['POST'])
def receive_data():
    data = request.get_json()
    print(data)
    return data

@socketio.on('connect')
def handle_connect():
    print('[+] Client connected')

@socketio.on('disconnect')
def handle_disconnect():
    print('[-] Client disconnected')

# 실행부
if __name__ == '__main__':
    socketio.start_background_task(capture_frames)
    socketio.start_background_task(save_frame_task)
    socketio.run(app, host='0.0.0.0', port=8080, allow_unsafe_werkzeug=True)
