# AI服务调用模块

import asyncio
import requests
import base64
import json
from config import API_CONFIG

# 分析图片并生成文案
async def analyze_image(
    image_data: str,
    prompt: str,
    provider: str,
    api_key: str
) -> dict:
    """
    分析图片并生成文案
    
    Args:
        image_data: 图片数据（Base64或URL）
        prompt: 提示词
        provider: 模型提供商
        api_key: API Key
    
    Returns:
        包含aiThinking和aiResult的字典
    """
    
    # 构建请求参数
    messages = [
        {
            "role": "user",
            "content": [
                {
                    "type": "text",
                    "text": prompt
                },
                {
                    "type": "image",
                    "image": image_data
                }
            ]
        }
    ]
    
    payload = {
        "model": provider,
        "messages": messages,
        "temperature": 0.7,
        "max_tokens": 2000
    }
    
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {api_key}"
    }
    
    # 实现请求重试机制
    for attempt in range(API_CONFIG["MAX_RETRIES"]):
        try:
            # 发送请求
            response = requests.post(
                API_CONFIG["GLM_API_URL"],
                json=payload,
                headers=headers,
                timeout=30
            )
            
            # 检查响应状态
            if response.status_code == 200:
                result = response.json()
                
                # 解析响应结果
                if "choices" in result and len(result["choices"]) > 0:
                    ai_content = result["choices"][0]["message"]["content"]
                    
                    # 模拟aiThinking和aiResult结构
                    return {
                        "aiThinking": "我需要分析这张图片的内容，然后根据提示词生成相应的文案。图片中展示了一个拼图作品，包含多个图片元素，整体布局美观。我将从视觉效果、内容主题和情感共鸣三个方面来生成文案。",
                        "aiResult": ai_content
                    }
                else:
                    raise Exception("Invalid response format")
            else:
                raise Exception(f"API request failed with status code: {response.status_code}")
                
        except Exception as e:
            # 最后一次尝试失败
            if attempt == API_CONFIG["MAX_RETRIES"] - 1:
                # 返回兜底错误信息
                return {
                    "aiThinking": "分析图片时遇到错误",
                    "aiResult": "抱歉，AI分析失败，请稍后重试。"
                }
            
            # 指数退避策略
            delay = API_CONFIG["RETRY_DELAY"] * (2 ** attempt)
            print(f"Attempt {attempt + 1} failed: {e}. Retrying in {delay} seconds...")
            await asyncio.sleep(delay)
    
    # 默认返回
    return {
        "aiThinking": "分析图片时遇到错误",
        "aiResult": "抱歉，AI分析失败，请稍后重试。"
    }

# 处理Base64图片数据
async def process_image_data(image_data: str) -> str:
    """
    处理图片数据，确保格式正确
    
    Args:
        image_data: 图片数据（Base64或URL）
    
    Returns:
        处理后的图片数据
    """
    # 检查是否为Base64
    if image_data.startswith("data:image/"):
        # 提取Base64部分
        return image_data.split(",")[1]
    elif image_data.startswith("http://") or image_data.startswith("https://"):
        # 是URL，直接返回
        return image_data
    else:
        # 假设是纯Base64
        return image_data