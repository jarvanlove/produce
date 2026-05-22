from pydantic_settings import BaseSettings
from pydantic import model_validator
from pathlib import Path


class Settings(BaseSettings):
    PROJECT_NAME: str = "学情智能分析与预警系统"
    VERSION: str = "0.1.0"

    # Database
    DATABASE_URL: str = f"sqlite+aiosqlite:///{Path(__file__).parent.parent / 'data' / 'school_analytics.db'}"

    # Security
    SECRET_KEY: str = ""
    ACCESS_TOKEN_EXPIRE_DAYS: int = 7
    ALGORITHM: str = "HS256"

    # AI
    DEEPSEEK_API_KEY: str = ""
    DEEPSEEK_BASE_URL: str = "https://api.deepseek.com/v1"
    DEEPSEEK_MODEL: str = "deepseek-chat"

    @model_validator(mode='after')
    def check_secret_key(self):
        if not self.SECRET_KEY:
            raise ValueError("SECRET_KEY 必须配置，请在 .env 文件中设置")
        return self

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
