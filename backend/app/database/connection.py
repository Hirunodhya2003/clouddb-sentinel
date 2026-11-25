import os
from pathlib import Path

from dotenv import load_dotenv
from sqlalchemy import URL, create_engine

env_path = Path(__file__).resolve().parents[3] / ".env"
load_dotenv(env_path)

database_url = os.getenv("DATABASE_URL") or URL.create(
    drivername="mysql+pymysql",
    username=os.environ["MYSQL_USER"],
    password=os.environ["MYSQL_PASSWORD"],
    host=os.getenv("MYSQL_HOST", "127.0.0.1"),
    port=int(os.getenv("MYSQL_PORT", "3306")),
    database=os.environ["MYSQL_DATABASE"],
)

engine = create_engine(database_url, pool_pre_ping=True)