from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Dict, Any
import httpx

from app.database import get_db
from app.models import SystemSetting

router = APIRouter(prefix="/api/settings", tags=["settings"])

DEFAULT_SETTINGS = {
    "ai_provider": "deepseek",
    "ai_api_key": "",
    "ai_base_url": "https://api.deepseek.com/v1",
    "ai_model": "deepseek-chat",
}

ALLOWED_KEYS = set(DEFAULT_SETTINGS.keys())


def _mask_api_key(key: str) -> str:
    if not key or len(key) <= 8:
        return ""
    return key[:4] + "****" + key[-4:]


@router.get("")
async def get_settings(db: AsyncSession = Depends(get_db)) -> Dict[str, str]:
    """获取所有系统设置（API Key 脱敏）。"""
    result = await db.execute(select(SystemSetting))
    rows = result.scalars().all()
    settings = {row.key: row.value for row in rows}

    # 合并默认值
    merged = dict(DEFAULT_SETTINGS)
    merged.update(settings)
    # 脱敏 API Key
    if merged.get("ai_api_key"):
        merged["ai_api_key"] = _mask_api_key(merged["ai_api_key"])
    return merged


@router.put("")
async def update_settings(
    body: Dict[str, Any],
    db: AsyncSession = Depends(get_db),
) -> Dict[str, str]:
    """更新系统设置。"""
    for key, value in body.items():
        if key not in ALLOWED_KEYS:
            raise HTTPException(status_code=400, detail=f"不允许的设置项: {key}")
        result = await db.execute(select(SystemSetting).where(SystemSetting.key == key))
        setting = result.scalar_one_or_none()
        if setting:
            setting.value = str(value)
        else:
            db.add(SystemSetting(key=key, value=str(value)))
    await db.commit()
    return {"message": "设置已保存"}


@router.post("/test")
async def test_ai_connection(body: Dict[str, Any]) -> Dict[str, Any]:
    """测试 AI API 连接是否可用。"""
    api_key = body.get("ai_api_key", "")
    base_url = body.get("ai_base_url", "")
    model = body.get("ai_model", "")

    if not api_key or not base_url or not model:
        raise HTTPException(status_code=400, detail="缺少 API Key、Base URL 或模型名称")

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{base_url}/chat/completions",
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": model,
                    "messages": [
                        {"role": "user", "content": "你好"}
                    ],
                    "max_tokens": 10,
                },
            )
            response.raise_for_status()
            data = response.json()
            content = data["choices"][0]["message"]["content"]
            return {
                "success": True,
                "message": f"连接成功！模型返回：{content[:50]}",
            }
    except httpx.HTTPStatusError as e:
        return {
            "success": False,
            "message": f"API 返回错误：{e.response.status_code} - {e.response.text[:200]}",
        }
    except Exception as e:
        return {
            "success": False,
            "message": f"连接失败：{str(e)[:200]}",
        }
