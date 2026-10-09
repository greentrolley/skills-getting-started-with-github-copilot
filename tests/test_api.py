import pytest
from fastapi.testclient import TestClient

from src import app as app_module


ACTIVITY_NAME = "Test Club"


@pytest.fixture
def client(monkeypatch):
    monkeypatch.setattr(
        app_module,
        "activities",
        {
            ACTIVITY_NAME: {
                "description": "A test activity",
                "schedule": "Mondays",
                "max_participants": 3,
                "participants": [],
            }
        },
    )
    return TestClient(app_module.app)


def test_signup_adds_participant(client):
    # Arrange
    email = "student@example.com"

    # Act
    response = client.post(
        f"/activities/{ACTIVITY_NAME}/signup",
        params={"email": email},
    )

    # Assert
    assert response.status_code == 200
    assert response.json() == {"message": f"Signed up {email} for {ACTIVITY_NAME}"}
    assert app_module.activities[ACTIVITY_NAME]["participants"] == [email]


def test_signup_rejects_duplicate_participant(client):
    # Arrange
    email = "student@example.com"
    app_module.activities[ACTIVITY_NAME]["participants"].append(email)

    # Act
    response = client.post(
        f"/activities/{ACTIVITY_NAME}/signup",
        params={"email": email},
    )

    # Assert
    assert response.status_code == 400
    assert response.json() == {"detail": "Student already signed up for this activity"}
    assert app_module.activities[ACTIVITY_NAME]["participants"] == [email]


def test_signup_rejects_unknown_activity(client):
    # Arrange
    email = "student@example.com"

    # Act
    response = client.post(
        "/activities/Unknown Club/signup",
        params={"email": email},
    )

    # Assert
    assert response.status_code == 404
    assert response.json() == {"detail": "Activity not found"}


def test_unregister_removes_participant(client):
    # Arrange
    email = "student@example.com"
    app_module.activities[ACTIVITY_NAME]["participants"].append(email)

    # Act
    response = client.delete(
        f"/activities/{ACTIVITY_NAME}/participants",
        params={"email": email},
    )

    # Assert
    assert response.status_code == 200
    assert response.json() == {"message": f"Unregistered {email} from {ACTIVITY_NAME}"}
    assert app_module.activities[ACTIVITY_NAME]["participants"] == []


def test_unregister_removes_all_matching_entries(client):
    # Arrange
    email = "student@example.com"
    app_module.activities[ACTIVITY_NAME]["participants"] = [email, email]

    # Act
    response = client.delete(
        f"/activities/{ACTIVITY_NAME}/participants",
        params={"email": email},
    )

    # Assert
    assert response.status_code == 200
    assert app_module.activities[ACTIVITY_NAME]["participants"] == []


def test_unregister_rejects_unregistered_participant(client):
    # Arrange
    email = "student@example.com"

    # Act
    response = client.delete(
        f"/activities/{ACTIVITY_NAME}/participants",
        params={"email": email},
    )

    # Assert
    assert response.status_code == 404
    assert response.json() == {
        "detail": "Student is not signed up for this activity"
    }


def test_unregister_rejects_unknown_activity(client):
    # Arrange
    email = "student@example.com"

    # Act
    response = client.delete(
        "/activities/Unknown Club/participants",
        params={"email": email},
    )

    # Assert
    assert response.status_code == 404
    assert response.json() == {"detail": "Activity not found"}