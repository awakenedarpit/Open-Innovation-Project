"""Integration tests for the FastAPI app (Phase 2)."""
from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.store import store


@pytest.fixture(autouse=True)
def _clean_store():
    store.reset_activity()
    yield
    store.reset_activity()


@pytest.fixture
def client():
    return TestClient(app)


def _post_attempt(client, learner, qid, outcome):
    r = client.post("/attempts", json={
        "learner_id": learner, "question_id": qid,
        "answer": "x", "outcome": outcome,
    })
    assert r.status_code == 201, r.text
    return r.json()


# --- /attempts ------------------------------------------------------------- #
def test_record_attempt(client):
    r = client.post("/attempts", json={
        "learner_id": "L1",
        "question_id": "q.alg.factoring.01",
        "answer": "a",
        "outcome": "incorrect",
    })
    assert r.status_code == 201
    body = r.json()
    assert body["learner_id"] == "L1"
    assert body["outcome"] == "incorrect"


def test_record_attempt_unknown_question(client):
    r = client.post("/attempts", json={
        "learner_id": "L1", "question_id": "nope",
        "answer": "a", "outcome": "correct",
    })
    assert r.status_code == 404


# --- /trace ---------------------------------------------------------------- #
def test_trace_with_failure_on_direct_prereq(client):
    _post_attempt(client, "L2", "q.alg.poly_mul.01", "incorrect")
    r = client.get("/trace/L2/q.alg.factoring.01")
    assert r.status_code == 200
    body = r.json()
    assert body["target_concept_id"] == "alg.factoring"
    assert body["recommended_action"] in ("review_candidate", "diagnostic_check")
    ids = [c["concept_id"] for c in body["candidates"]]
    assert "alg.poly_mul" in ids


def test_trace_no_evidence_returns_diagnostic_question(client):
    r = client.get("/trace/L3/q.alg.quadratic_formula.01")
    assert r.status_code == 200
    body = r.json()
    assert body["recommended_action"] == "diagnostic_check"
    assert body["diagnostic_question"] is not None
    assert body["diagnostic_question"]["target_concept_id"] in (
        "alg.quadratic_eq", "num.roots", "alg.factoring",
    )


def test_trace_unknown_question_404(client):
    assert client.get("/trace/L1/nope").status_code == 404


# --- /lesson --------------------------------------------------------------- #
def test_lesson_falls_back_to_static(client):
    r = client.get("/lesson/alg.factoring")
    assert r.status_code == 200
    body = r.json()
    assert body["concept_id"] == "alg.factoring"
    assert body["source"] == "static_fallback"
    assert "factor" in body["explanation"].lower()


def test_lesson_unknown_concept_404(client):
    assert client.get("/lesson/not.a.concept").status_code == 404


def test_every_seeded_concept_has_a_fallback_lesson(client):
    for cid in store.concepts:
        r = client.get(f"/lesson/{cid}")
        assert r.status_code == 200, f"missing fallback lesson for {cid}"
        assert r.json()["source"] == "static_fallback"


# --- /repair-check --------------------------------------------------------- #
def test_repair_check_success(client):
    r = client.post("/repair-check", json={
        "learner_id": "L4",
        "original_question_id": "q.alg.factoring.01",
        "root_cause_concept_id": "alg.poly_mul",
    })
    assert r.status_code == 201, r.text
    body = r.json()
    sid = body["session_id"]
    assert body["probe_question"]["target_concept_id"] == "alg.poly_mul"
    assert body["parallel_question"]["target_concept_id"] == "alg.factoring"
    assert body["parallel_question"]["id"] != "q.alg.factoring.01"

    r2 = client.post(f"/repair-check/{sid}/submit", json={
        "probe_answer": "a", "probe_outcome": "correct",
        "parallel_answer": "a", "parallel_outcome": "correct",
    })
    assert r2.status_code == 200
    out = r2.json()
    assert out["repair_succeeded"] is True
    assert out["probe_correct"] and out["parallel_correct"]


def test_repair_check_partial_failure(client):
    r = client.post("/repair-check", json={
        "learner_id": "L5",
        "original_question_id": "q.alg.factoring.01",
        "root_cause_concept_id": "alg.poly_mul",
    })
    sid = r.json()["session_id"]
    r2 = client.post(f"/repair-check/{sid}/submit", json={
        "probe_answer": "a", "probe_outcome": "correct",
        "parallel_answer": "b", "parallel_outcome": "incorrect",
    })
    out = r2.json()
    assert out["repair_succeeded"] is False
    assert out["probe_correct"] is True
    assert out["parallel_correct"] is False


def test_repair_check_unknown_session_404(client):
    r = client.post("/repair-check/rc_nope/submit", json={
        "probe_answer": "a", "probe_outcome": "correct",
        "parallel_answer": "a", "parallel_outcome": "correct",
    })
    assert r.status_code == 404


def test_repair_check_records_attempts_for_future_traces(client):
    r = client.post("/repair-check", json={
        "learner_id": "L6",
        "original_question_id": "q.alg.factoring.01",
        "root_cause_concept_id": "alg.poly_mul",
    })
    sid = r.json()["session_id"]
    client.post(f"/repair-check/{sid}/submit", json={
        "probe_answer": "a", "probe_outcome": "correct",
        "parallel_answer": "a", "parallel_outcome": "correct",
    })
    r2 = client.get("/trace/L6/q.alg.quadratic_formula.01")
    body = r2.json()
    by_id = {c["concept_id"]: c for c in body["candidates"]}
    assert "alg.poly_mul" in by_id
    assert by_id["alg.poly_mul"]["evidence"]


# --- /health --------------------------------------------------------------- #
def test_health(client):
    r = client.get("/health")
    assert r.status_code == 200
    body = r.json()
    assert body["status"] == "ok"
    assert body["concepts"] >= 30
    assert body["questions"] >= 31


# --- Phase 3 endpoints ----------------------------------------------------- #
def test_get_graph(client):
    r = client.get("/graph")
    assert r.status_code == 200
    body = r.json()
    assert "concepts" in body
    assert "edges" in body
    assert len(body["concepts"]) >= 30
    assert len(body["edges"]) >= 39


def test_list_questions(client):
    r = client.get("/questions")
    assert r.status_code == 200
    qs = r.json()
    assert len(qs) >= 20
    assert all(q["reviewed"] is True for q in qs)


def test_list_attempts_for_learner(client):
    _post_attempt(client, "L_P3", "q.num.integers.01", "correct")
    _post_attempt(client, "L_P3", "q.num.operations.01", "incorrect")
    r = client.get("/attempts/L_P3")
    assert r.status_code == 200
    attempts = r.json()
    assert len(attempts) == 2
    assert attempts[0]["question_id"] == "q.num.operations.01"


def test_get_repair_check_session(client):
    r_start = client.post("/repair-check", json={
        "learner_id": "L_P3",
        "original_question_id": "q.alg.factoring.01",
        "root_cause_concept_id": "alg.poly_mul",
    })
    sid = r_start.json()["session_id"]
    r_get = client.get(f"/repair-check/{sid}")
    assert r_get.status_code == 200
    sess = r_get.json()
    assert sess["session_id"] == sid
    assert sess["probe_question"]["target_concept_id"] == "alg.poly_mul"

    r_404 = client.get("/repair-check/rc_unknown_999")
    assert r_404.status_code == 404


def test_cors_preflight(client):
    headers = {
        "Origin": "http://localhost:3000",
        "Access-Control-Request-Method": "POST",
    }
    r = client.options("/attempts", headers=headers)
    assert r.status_code == 200
    assert r.headers.get("access-control-allow-origin") == "http://localhost:3000"

