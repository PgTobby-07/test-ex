from pydantic_settings import BaseSettings
#
from dotenv import load_dotenv
load_dotenv()

class Settings(BaseSettings):
    APP_ENV: str
    SECRET_KEY: str
    DATABASE_URL: str
    REDIS_URL: str
    STRIPE_SECRET_KEY: str
    STRIPE_WEBHOOK_SECRET: str

    class Config:
        env_file = ".env"


settings = Settings()