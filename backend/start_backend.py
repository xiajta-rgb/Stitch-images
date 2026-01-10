# 后端服务启动脚本

import subprocess
import sys
import os

# 检查Python版本
if sys.version_info < (3, 8):
    print("Error: Python 3.8 or higher is required")
    sys.exit(1)

# 安装依赖
print("Installing dependencies...")
subprocess.run(["pip", "install", "-r", "requirements.txt"], check=True)

# 启动Redis（如果未运行）
print("Starting Redis server...")
# 注意：在实际生产环境中，Redis应该作为服务运行
# 这里仅作为示例，实际使用时需要确保Redis已安装并运行

# 启动Celery worker
print("Starting Celery worker...")
celery_process = subprocess.Popen([
    "celery", "-A", "celery_app", "worker", "--loglevel=info", "--queue=ai_tasks"
], cwd=os.path.dirname(os.path.abspath(__file__)))

# 启动FastAPI应用
print("Starting FastAPI application...")
uvicorn_process = subprocess.Popen([
    "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"
], cwd=os.path.dirname(os.path.abspath(__file__)))

# 等待进程结束
try:
    celery_process.wait()
    uvicorn_process.wait()
except KeyboardInterrupt:
    print("Shutting down...")
    celery_process.terminate()
    uvicorn_process.terminate()
    celery_process.wait()
    uvicorn_process.wait()
    print("Shutdown complete")