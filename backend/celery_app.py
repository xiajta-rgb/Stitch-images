# Celery配置文件

from celery import Celery
from config import REDIS_CONFIG

# 创建Celery实例
celery_app = Celery(
    'ai_tasks',
    broker=f'redis://{REDIS_CONFIG["HOST"]}:{REDIS_CONFIG["PORT"]}/{REDIS_CONFIG["DB"]}',
    backend=f'redis://{REDIS_CONFIG["HOST"]}:{REDIS_CONFIG["PORT"]}/{REDIS_CONFIG["DB"]}',
    include=['tasks']
)

# 配置Celery
celery_app.conf.update(
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='Asia/Shanghai',
    enable_utc=True,
    # 并发配置
    worker_concurrency=3,
    # 任务超时设置
    task_soft_time_limit=30,
    task_time_limit=60,
    # 任务重试设置
    task_acks_late=True,
    task_reject_on_worker_lost=True,
    # 任务路由
    task_routes={
        'tasks.analyze_image_task': {'queue': 'ai_tasks'}
    }
)

if __name__ == '__main__':
    celery_app.start()