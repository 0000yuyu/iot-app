import cv2
import base64
import threading
import time
from flask import Flask,request, render_template
from flask_cors import CORS
from flask_socketio import SocketIO, emit

app = Flask(__name__)
CORS(app)
app.config['SECRET_KEY'] = 'secret!'
socketio = SocketIO(app, cors_allowed_origins='*')

camera = cv2.VideoCapture(0)
camera.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
camera.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)

def capture_frames():
    while True:
        success, frame = camera.read()
        if not success:
            continue
        ret, buffer = cv2.imencode('.jpg', frame)
        jpg_as_text = base64.b64encode(buffer).decode('utf-8')
        # 클라이언트에 base64 이미지 데이터 emit
        socketio.emit('video_frame', {'image': f'data:image/jpeg;base64,{jpg_as_text}'})
        socketio.sleep(0.1)  # 10fps 정도

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
    print('Client connected')

@socketio.on('disconnect')
def handle_disconnect():
    print('Client disconnected')

if __name__ == '__main__':
    # 백그라운드에서 프레임 캡처 시작
    socketio.start_background_task(capture_frames)
    socketio.run(app, host='0.0.0.0', port=8080)
