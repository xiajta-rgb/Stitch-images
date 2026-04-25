from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import json
import os
from datetime import datetime

app = Flask(__name__)
CORS(app)

# 配置 - 使用绝对路径
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, 'data')
DATA_FILE = os.path.join(DATA_DIR, 'gallery.json')

# 确保数据目录存在
os.makedirs(DATA_DIR, exist_ok=True)

# 初始化数据文件
def init_data():
    if not os.path.exists(DATA_FILE):
        with open(DATA_FILE, 'w', encoding='utf-8') as f:
            json.dump([], f)

# 读取数据
def read_data():
    try:
        with open(DATA_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return []

# 写入数据
def write_data(data):
    with open(DATA_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

# 获取所有图片记录
@app.route('/api/gallery', methods=['GET'])
def get_gallery():
    data = read_data()
    # 按时间倒序排列
    data.sort(key=lambda x: x['timestamp'], reverse=True)
    return jsonify(data)

# 添加新图片记录
@app.route('/api/gallery', methods=['POST'])
def add_gallery():
    data = read_data()
    new_record = request.get_json()
    new_record['id'] = f'img_{int(datetime.now().timestamp() * 1000)}'
    new_record['timestamp'] = datetime.now().isoformat()
    data.insert(0, new_record)
    write_data(data)
    return jsonify(new_record)

# 更新图片记录
@app.route('/api/gallery/<id>', methods=['PUT'])
def update_gallery(id):
    data = read_data()
    update_data = request.get_json()
    for i, record in enumerate(data):
        if record['id'] == id:
            data[i] = {**record, **update_data}
            write_data(data)
            return jsonify(data[i])
    return jsonify({'error': 'Record not found'}), 404

# 删除图片记录
@app.route('/api/gallery/<id>', methods=['DELETE'])
def delete_gallery(id):
    data = read_data()
    original_length = len(data)
    data = [r for r in data if r['id'] != id]
    if len(data) < original_length:
        write_data(data)
        return jsonify({'success': True})
    return jsonify({'error': 'Record not found'}), 404

# 批量删除
@app.route('/api/gallery/batch-delete', methods=['POST'])
def batch_delete():
    data = read_data()
    delete_ids = request.get_json().get('ids', [])
    original_length = len(data)
    data = [r for r in data if r['id'] not in delete_ids]
    if len(data) < original_length:
        write_data(data)
        return jsonify({'success': True, 'deleted': original_length - len(data)})
    return jsonify({'error': 'No records found to delete'}), 404

# 健康检查
@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'ok'})

# 初始化
init_data()

if __name__ == '__main__':
    app.run(debug=True, port=5000)
