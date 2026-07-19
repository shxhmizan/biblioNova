from pathlib import Path

SAMPLE_BIB = Path(__file__).resolve().parents[2] / "data" / "samples" / "sample.bib"


def _upload(client, goal="Analyze publication trends in this corpus over time."):
    with open(SAMPLE_BIB, "rb") as f:
        response = client.post(
            "/sessions",
            files={"file": ("sample.bib", f, "text/plain")},
            data={"goal": goal},
        )
    assert response.status_code == 201, response.text
    return response.json()


def test_create_session_defaults_name_to_filename_stem(client):
    session = _upload(client)
    assert session["name"] == "sample"


def test_list_sessions_orders_newest_first(client):
    first = _upload(client, goal="First goal about publication trends here.")
    second = _upload(client, goal="Second goal about publication trends here.")

    response = client.get("/sessions")
    assert response.status_code == 200
    ids = [s["id"] for s in response.json()]
    assert ids.index(second["id"]) < ids.index(first["id"])


def test_rename_session(client):
    session = _upload(client)
    response = client.patch(f"/sessions/{session['id']}", json={"name": "My Renamed Session"})
    assert response.status_code == 200
    assert response.json()["name"] == "My Renamed Session"

    detail = client.get(f"/sessions/{session['id']}").json()
    assert detail["name"] == "My Renamed Session"


def test_delete_session_removes_it(client):
    session = _upload(client)
    response = client.delete(f"/sessions/{session['id']}")
    assert response.status_code == 204

    assert client.get(f"/sessions/{session['id']}").status_code == 404


def test_rename_and_delete_404_for_unknown_session(client):
    assert client.patch("/sessions/does-not-exist", json={"name": "x"}).status_code == 404
    assert client.delete("/sessions/does-not-exist").status_code == 404
