import asyncio
from sqlalchemy.ext.asyncio import create_async_engine

async def test_conn():
    url = "postgresql+asyncpg://neondb_owner:npg_TV6Ika3RiGUf@ep-withered-meadow-avg6srqm-pooler.c-11.us-east-1.aws.neon.tech/neondb"
    engine = create_async_engine(url, connect_args={"ssl": "require"})
    try:
        async with engine.begin() as conn:
            print("Connected successfully with ssl=require in connect_args")
    except Exception as e:
        print("Failed:", type(e), e)

asyncio.run(test_conn())
