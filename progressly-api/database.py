import os
from dotenv import load_dotenv
from sqlmodel import create_engine, Session

# Load environment variables from the .env file
load_dotenv()

# 1. Get the Database URL from the Environment
# This is the connection string for our PostgreSQL database.
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise ValueError("DATABASE_URL environment variable is not set")

# 2. Create the Database Engine
# The engine is the central point of communication with the database.
# echo=True is helpful for debugging as it logs all the SQL it executes.
engine = create_engine(DATABASE_URL, echo=True)

# 3. Define a Function to Get a Database Session
# Each request to our API will get its own database session. This function
# will be used as a dependency in our API routes to provide a session.
def get_session():
    with Session(engine) as session:
        yield session