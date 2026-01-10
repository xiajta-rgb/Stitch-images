# 项目配置文件

# API配置
API_CONFIG = {
    "GLM_API_URL": "https://open.bigmodel.cn/api/messages",
    "DEFAULT_API_KEY": "6bb4ba583aa140b58d4206c0c17a7c7d.lczAd2j0sPl0rHBD",
    "MAX_RETRIES": 3,
    "RETRY_DELAY": 1  # 初始重试延迟（秒）
}

# 并发控制配置
CONCURRENCY_CONFIG = {
    "MAX_CONCURRENT_REQUESTS": 3,
    "BATCH_INTERVAL": 0.5  # 批次间隔（秒）
}

# Redis配置（用于Celery和缓存）
REDIS_CONFIG = {
    "HOST": "localhost",
    "PORT": 6379,
    "DB": 0
}

# 缓存配置
CACHE_CONFIG = {
    "EXPIRE_TIME": 3600  # 缓存过期时间（秒）
}

# CORS配置
CORS_CONFIG = {
    "ALLOW_ORIGINS": ["*"],
    "ALLOW_CREDENTIALS": True,
    "ALLOW_METHODS": ["*"],
    "ALLOW_HEADERS": ["*"]
}