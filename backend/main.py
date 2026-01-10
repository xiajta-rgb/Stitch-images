# FastAPI应用入口文件

from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import time
import hashlib

from config import API_CONFIG, CONCURRENCY_CONFIG, CORS_CONFIG
from ai_service import analyze_image

# 创建FastAPI应用
app = FastAPI(
    title="AIpic Backend API",
    description="自媒体图片笔记工具后端API服务",
    version="1.0.0"
)

# 配置CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_CONFIG["ALLOW_ORIGINS"],
    allow_credentials=CORS_CONFIG["ALLOW_CREDENTIALS"],
    allow_methods=CORS_CONFIG["ALLOW_METHODS"],
    allow_headers=CORS_CONFIG["ALLOW_HEADERS"]
)

# 并发控制
active_requests = 0

# 缓存字典（实际项目中应使用Redis）
result_cache = {}

# 请求签名校验
async def verify_signature(request: Request):
    # 这里可以实现请求签名校验逻辑
    # 示例：检查请求头中的签名
    # signature = request.headers.get("X-Signature")
    # if not signature:
    #     raise HTTPException(status_code=401, detail="Missing signature")
    # 验证签名...
    pass

# AI分析接口
@app.post("/api/ai/analyze")
async def api_analyze_image(request: Request):
    global active_requests
    
    try:
        # 验证请求签名
        await verify_signature(request)
        
        # 读取请求体
        data = await request.json()
        
        # 检查必要参数
        if not all(key in data for key in ["imageData", "prompt", "provider"]):
            raise HTTPException(status_code=400, detail="Missing required parameters")
        
        # 并发控制
        if active_requests >= CONCURRENCY_CONFIG["MAX_CONCURRENT_REQUESTS"]:
            raise HTTPException(status_code=429, detail="Too many concurrent requests")
        
        # 生成缓存键
        cache_key = hashlib.md5(
            f"{data['imageData']}:{data['prompt']}:{data['provider']}".encode()
        ).hexdigest()
        
        # 检查缓存
        if cache_key in result_cache:
            return JSONResponse(content=result_cache[cache_key])
        
        # 增加活跃请求计数
        active_requests += 1
        
        try:
            # 调用AI服务
            result = await analyze_image(
                image_data=data["imageData"],
                prompt=data["prompt"],
                provider=data["provider"],
                api_key=data.get("apiKey", API_CONFIG["DEFAULT_API_KEY"])
            )
            
            # 缓存结果
            result_cache[cache_key] = result
            
            # 模拟批次间隔
            time.sleep(CONCURRENCY_CONFIG["BATCH_INTERVAL"])
            
            return JSONResponse(content=result)
        finally:
            # 减少活跃请求计数
            active_requests -= 1
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# 健康检查接口
@app.get("/api/health")
async def health_check():
    return {"status": "healthy"}

# 根路径
@app.get("/")
async def root():
    return {"message": "AIpic Backend API"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)