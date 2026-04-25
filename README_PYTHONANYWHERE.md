# 部署到 PythonAnywhere

## 本地运行

### 1. 安装 Python 依赖
```bash
cd backend
pip install -r requirements.txt
```

### 2. 运行后端
```bash
python app.py
```
后端会在 http://localhost:5000 运行

### 3. 运行前端
在项目根目录：
```bash
npm run dev
```

## PythonAnywhere 部署步骤

### 1. 上传代码
1. 在 PythonAnywhere 上创建一个新的账户
2. 进入 "Web" 页面，点击 "Add a new web app"
3. 选择 "Manual configuration"
4. 选择 Python 版本（建议 3.9+）

### 2. 上传文件
使用 "Files" 页面或 git 上传以下文件：
- `backend/app.py`
- `backend/requirements.txt`

### 3. 配置虚拟环境
在 PythonAnywhere 的 Bash 控制台：
```bash
cd ~/myproject
mkvirtualenv venv --python=python3.9
source venv/bin/activate
pip install -r requirements.txt
```

### 4. 配置 Web App
在 Web 页面设置：
- **Source code**: `/home/yourusername/myproject/backend`
- **Working directory**: `/home/yourusername/myproject`
- **Virtualenv**: `/home/yourusername/.virtualenvs/venv`
- **WSGI configuration file**: 编辑并设置：

```python
import sys
import os

path = '/home/yourusername/myproject/backend'
if path not in sys.path:
    sys.path.append(path)

from app import app as application
```

### 5. 创建数据目录
在 PythonAnywhere 的 Files 页面或 Bash 控制台：
```bash
mkdir -p ~/myproject/backend/data
```

### 6. 重启 Web App
在 Web 页面点击 "Reload" 按钮

### 7. 更新前端配置
根据你的 PythonAnywhere 域名更新前端 API 地址
