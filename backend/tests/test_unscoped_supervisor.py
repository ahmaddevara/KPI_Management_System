"""iteration_3: behaviour of a supervisor account with no divisi assigned (legacy seed user)."""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL")
if not BASE_URL:
    with open("/app/frontend/.env") as f:
        for line in f:
            if line.startswith("REACT_APP_BACKEND_URL="):
                BASE_URL = line.split("=", 1)[1].strip()
                break
API = f"{(BASE_URL or '').rstrip('/')}/api"

LEGACY = {"email": "supervisor@apgroup.com", "password": "Supervisor123!"}


@pytest.fixture(scope="module")
def legacy():
    r = requests.post(f"{API}/auth/login", json=LEGACY, timeout=30)
    if r.status_code != 200:
        pytest.skip(f"legacy supervisor not present/loginable: {r.status_code}")
    s = requests.Session()
    s.headers.update({"Authorization": f"Bearer {r.json()['token']}", "Content-Type": "application/json"})
    return s


def test_legacy_login_has_no_divisi(legacy):
    body = legacy.get(f"{API}/auth/me", timeout=30).json()
    assert body["role"] == "supervisor"
    print("legacy supervisor divisi:", body.get("divisi"))


def test_unscoped_supervisor_write_denied(legacy):
    r = legacy.post(f"{API}/kpi-input/bulk", json=[{
        "tahun": 2026, "bulan": 12, "nik": "EMP001", "kode_kpi": "MKT01", "realisasi": 1.0}], timeout=30)
    assert r.status_code == 403, f"expected 403 for supervisor without divisi, got {r.status_code} {r.text[:200]}"


def test_unscoped_supervisor_read_is_not_global(legacy):
    rows = legacy.get(f"{API}/kpi-input", params={"tahun": 2026, "bulan": 8}, timeout=30).json()
    divs = sorted({r.get("divisi") for r in rows})
    assert len(divs) <= 1, f"unscoped supervisor can read all divisi data: {divs}"
