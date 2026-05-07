from fastapi.testclient import TestClient
from main import app  # imports your FastAPI app

# Creates a fake client to call your API without running a server
client = TestClient(app)

def test_root():
    # Sends GET request to "/"
    response = client.get("/")

    # Check status is OK
    assert response.status_code == 200