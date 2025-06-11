import os
import numpy as np
from tensorflow.keras.applications import MobileNetV2
from tensorflow.keras.preprocessing import image
from tensorflow.keras.applications.mobilenet_v2 import preprocess_input
from numpy.linalg import norm

# 모델 로딩 (feature extractor)
model = MobileNetV2(weights='imagenet', include_top=False, pooling='avg')

# 이미지 임베딩 벡터 생성
def get_embedding(img_path):
    img = image.load_img(img_path, target_size=(224, 224))
    x = image.img_to_array(img)
    x = np.expand_dims(x, axis=0)
    x = preprocess_input(x)
    return model.predict(x)[0]

# 코사인 유사도 계산
def cosine_similarity(vec1, vec2):
    return np.dot(vec1, vec2) / (norm(vec1) * norm(vec2))

# 참조 벡터 생성 및 저장
def save_reference_vector(fresh_dir, save_path):
    embeddings = []
    for fname in os.listdir(fresh_dir):
        if fname.lower().endswith(('.jpg', '.jpeg', '.png')):
            emb = get_embedding(os.path.join(fresh_dir, fname))
            embeddings.append(emb)
    if not embeddings:
        raise ValueError("No images found in the fresh_dir.")
    reference_vector = np.mean(embeddings, axis=0)
    np.save(save_path, reference_vector)
    print(f"✅ Reference vector saved to {save_path}")

# 테스트 함수
def test_image(test_img_path, reference_vector_path):
    if not os.path.exists(reference_vector_path):
        raise FileNotFoundError(f"❌ Reference vector not found: {reference_vector_path}")
    
    reference_vector = np.load(reference_vector_path)
    test_vector = get_embedding(test_img_path)
    similarity = cosine_similarity(test_vector, reference_vector)

    return  str(int(similarity * 100)) + "% 신선한 콩나물" if similarity >= 0.3 else "썩은 콩나물"

# 외부에서 호출할 함수
def test_model():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    fresh_dir = os.path.join(script_dir, 'vectordataset')
    reference_vector_path = os.path.join(script_dir, 'reference_vector.npy')
    test_img_path = os.path.join(script_dir, 'sprout.jpg')  # 혹은 test.jpg 등

    if not os.path.exists(reference_vector_path):
        print("📁 reference_vector.npy 파일이 없어 새로 생성합니다.")
        save_reference_vector(fresh_dir, reference_vector_path)

    result = test_image(test_img_path, reference_vector_path)
    print(f"🤖 AI 메시지: {result}")
    return result

# 단독 실행 시 테스트
if __name__ == "__main__":
    test_model()
