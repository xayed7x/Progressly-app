from fastapi.testclient import TestClient
from sqlmodel import Session, SQLModel, create_engine
from sqlmodel.pool import StaticPool
import sys
import os

# Add current directory to sys.path to ensure imports work
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from main import app
from dependencies import get_db_session, get_current_user

# Setup in-memory SQLite
engine = create_engine(
    "sqlite://", 
    connect_args={"check_same_thread": False}, 
    poolclass=StaticPool
)
SQLModel.metadata.create_all(engine)

def get_session_override():
    with Session(engine) as session:
        yield session

def get_current_user_override():
    return "test-user-id"

app.dependency_overrides[get_db_session] = get_session_override
app.dependency_overrides[get_current_user] = get_current_user_override

client = TestClient(app)

def test_upsert_target():
    print("Testing Create Target...")
    # 1. Create a new target
    response = client.post("/api/targets", json={
        "category_name": "Coding",
        "target_hours": 2.5
    })
    if response.status_code != 200:
        print(f"Failed to create target: {response.text}")
    assert response.status_code == 200
    data = response.json()
    assert data["category_name"] == "Coding"
    assert data["target_hours"] == 2.5
    assert data["user_id"] == "test-user-id"
    print("Create Target: SUCCESS")
    
    print("Testing Upsert Target...")
    # 2. Update the same target (Upsert)
    response = client.post("/api/targets", json={
        "category_name": "Coding",
        "target_hours": 5.0
    })
    if response.status_code != 200:
        print(f"Failed to update target: {response.text}")
    assert response.status_code == 200
    data = response.json()
    assert data["category_name"] == "Coding"
    assert data["target_hours"] == 5.0 # Should be updated
    print("Upsert Target: SUCCESS")
    
    print("Testing Get Targets...")
    # 3. Verify count (should be 1)
    response = client.get("/api/targets")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["target_hours"] == 5.0
    print("Get Targets: SUCCESS")

    print("All tests passed!")

if __name__ == "__main__":
    test_upsert_target()
