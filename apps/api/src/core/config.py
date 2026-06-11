from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    APP_NAME: str = "Engineering Knowledge Platform"
    
    #Database connection
    POSTGRES_HOST: str
    POSTGRES_PORT: str
    POSTGRES_DB: str
    POSTGRES_USER: str
    POSTGRES_PASSWORD: str
    
    #Groq API key
    GROQ_API_KEY: str
    GROQ_ANALYSIS_MODEL: str = "llama-3.3-70b-versatile"

    #Authentication
    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str

    ACCESS_TOKEN_EXPIRE_MINITES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore"
    )
    

settings = Settings()
    


