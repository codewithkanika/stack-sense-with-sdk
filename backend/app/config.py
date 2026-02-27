from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    AWS_REGION: str = "us-east-1"
    BEDROCK_MODEL_ID: str = "us.amazon.nova-premier-v1:0"
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    ALLOWED_ORIGINS: list[str] = ["http://localhost:3000"]

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()
