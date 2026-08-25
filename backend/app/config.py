from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # Managed Postgres providers (e.g. Render) hand out plain postgres:// or
    # postgresql:// connection strings — SQLAlchemy needs the driver named
    # explicitly (+psycopg) or it defaults to psycopg2, which isn't installed
    # (only psycopg[binary] v3 is a dependency here).
    database_url_raw: str = Field(
        "postgresql+psycopg://biblioagent:biblioagent@localhost:5432/biblioagent",
        alias="DATABASE_URL",
    )
    openrouter_api_key: str = ""
    openrouter_base_url: str = "https://openrouter.ai/api/v1"
    openrouter_model: str = "openai/gpt-4o-mini"
    # Optional: OpenAlex's "polite pool" gives higher rate limits to requests
    # that identify a contact. Omitted from requests entirely when unset.
    openalex_mailto: str = ""
    # Plain comma-separated string, not list[str] — pydantic-settings requires
    # JSON to populate a list field from an env var, which is awkward to set
    # in a host's dashboard (e.g. Render). "http://a.com,http://b.com" is not.
    cors_allow_origins_raw: str = Field("http://localhost:3000", alias="CORS_ALLOW_ORIGINS")

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @property
    def cors_allow_origins(self) -> list[str]:
        origins = self.cors_allow_origins_raw.split(",")
        return [origin.strip() for origin in origins if origin.strip()]

    @property
    def database_url(self) -> str:
        url = self.database_url_raw
        for bare_scheme in ("postgresql://", "postgres://"):
            if url.startswith(bare_scheme):
                return "postgresql+psycopg://" + url[len(bare_scheme) :]
        return url


settings = Settings()
