---
name: "start-servers"
description: "Starts both backend (Flask on port 5000) and frontend (Vite on port 5173) development servers. Invoke when user asks to start servers or restart development environment."
---

# Start Development Servers

This skill starts both the backend and frontend development servers for the Stitch-images project.

## 启动命令

### 后端服务器（端口 5000）
```bash
cd backend
python app.py
```

### 前端服务器（端口 5173）
```bash
npm run dev
```

## 验证服务
- 后端 API：http://localhost:5000/api/health
- 前端：http://localhost:5173/

## 故障排除

### 端口被占用
```bash
# Windows 查找占用端口的进程
netstat -ano | findstr :5000
netstat -ano | findstr :5173

# 结束进程（替换 PID）
taskkill /PID <PID> /F
```

### 重新安装依赖
```bash
npm install
cd backend
pip install -r requirements.txt
```