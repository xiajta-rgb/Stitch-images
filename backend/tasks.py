# Celery任务定义

from celery_app import celery_app
from ai_service import analyze_image

# 分析图片任务
@celery_app.task
async def analyze_image_task(
    image_data: str,
    prompt: str,
    provider: str,
    api_key: str
) -> dict:
    """
    分析图片的异步任务
    
    Args:
        image_data: 图片数据（Base64或URL）
        prompt: 提示词
        provider: 模型提供商
        api_key: API Key
    
    Returns:
        包含aiThinking和aiResult的字典
    """
    return await analyze_image(
        image_data=image_data,
        prompt=prompt,
        provider=provider,
        api_key=api_key
    )

# 批量分析图片任务
@celery_app.task
async def batch_analyze_image_task(
    tasks: list
) -> list:
    """
    批量分析图片的异步任务
    
    Args:
        tasks: 任务列表，每个任务包含image_data、prompt、provider、api_key
    
    Returns:
        结果列表
    """
    results = []
    for task in tasks:
        result = await analyze_image(
            image_data=task["image_data"],
            prompt=task["prompt"],
            provider=task["provider"],
            api_key=task["api_key"]
        )
        results.append(result)
    return results