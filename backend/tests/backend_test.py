"""AP GROUP KPI backend regression tests.

Runs against public REACT_APP_BACKEND_URL / /api prefix.
"""
import os
import io
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL")
if not BASE_URL:
    # Fallback to reading from frontend .env for pytest CLI
    try:
        with open("/app/frontend/.env") as f:
            for line in f:
                if line.startswith("REACT_APP_BACKEND_URL="):
                    BASE_URL = line.split("=", 1)[1].strip()
                    break
    except FileNotFoundError:
        pass
BASE_URL = (BASE_URL or "").rstrip("/")
API = f"{BASE_URL}/api"

ADMIN = {"email": "devaraahmad@gmail.com", "password": "Admin123!"}
SUP = {"email": "supervisor@apgroup.com", "password": "Supervisor123!"}
KAR = {"email": "karyawan@apgroup.com", "password": "Karyawan123!"}

TAHUN = 2026  # template default year
BULAN = 1


@pytest.fixture(scope="session")
def admin_token():
    r = requests.post(f"{API}/auth/login", json=ADMIN, timeout=20)
    assert r.status_code == 200, f"admin login failed: {r.status_code} {r.text}"
    return r.json()["token"]


@pytest.fixture(scope="session")
def sup_token():
    r = requests.post(f"{API}/auth/login", json=SUP, timeout=20)
    assert r.status_code == 200, f"supervisor login failed: {r.status_code} {r.text}"
    return r.json()["token"]


@pytest.fixture(scope="session")
def kar_token():
    r = requests.post(f"{API}/auth/login", json=KAR, timeout=20)
    assert r.status_code == 200, f"karyawan login failed: {r.status_code} {r.text}"
    return r.json()["token"]


def H(tok):
    return {"Authorization": f"Bearer {tok}"}


# ---------- Auth ----------
class TestAuth:
    def test_root(self):
        r = requests.get(f"{API}/", timeout=15)
        assert r.status_code == 200
        assert r.json().get("status") == "ok"

    def test_login_wrong(self):
        r = requests.post(f"{API}/auth/login", json={"email": "devaraahmad@gmail.com", "password": "wrong"}, timeout=15)
        assert r.status_code == 401

    def test_me_no_auth(self):
        r = requests.get(f"{API}/auth/me", timeout=15)
        assert r.status_code == 401

    def test_me_admin(self, admin_token):
        r = requests.get(f"{API}/auth/me", headers=H(admin_token), timeout=15)
        assert r.status_code == 200
        assert r.json()["role"] == "admin"

    def test_admin_can_list_users(self, admin_token):
        r = requests.get(f"{API}/auth/users", headers=H(admin_token), timeout=15)
        assert r.status_code == 200
        users = r.json()
        assert isinstance(users, list) and len(users) >= 3

    def test_karyawan_cannot_list_users(self, kar_token):
        r = requests.get(f"{API}/auth/users", headers=H(kar_token), timeout=15)
        assert r.status_code == 403


# ---------- Master data (template auto-imported) ----------
class TestMaster:
    def test_divisi_list(self, admin_token):
        r = requests.get(f"{API}/divisi", headers=H(admin_token), timeout=15)
        assert r.status_code == 200
        assert len(r.json()) >= 1

    def test_jabatan_list(self, admin_token):
        r = requests.get(f"{API}/jabatan", headers=H(admin_token), timeout=15)
        assert r.status_code == 200 and len(r.json()) >= 1

    def test_karyawan_list(self, admin_token):
        r = requests.get(f"{API}/karyawan", headers=H(admin_token), timeout=15)
        assert r.status_code == 200 and len(r.json()) >= 1

    def test_kpi_master_list(self, admin_token):
        r = requests.get(f"{API}/kpi-master", headers=H(admin_token), timeout=15)
        assert r.status_code == 200 and len(r.json()) >= 1

    def test_karyawan_cannot_create_divisi(self, kar_token):
        r = requests.post(f"{API}/divisi", headers=H(kar_token),
                          json={"kode": "TEST_D", "nama": "Test"}, timeout=15)
        assert r.status_code == 403

    def test_divisi_crud(self, admin_token):
        payload = {"kode": "TEST_DIV1", "nama": "TEST Divisi 1"}
        c = requests.post(f"{API}/divisi", headers=H(admin_token), json=payload, timeout=15)
        assert c.status_code == 200
        did = c.json()["id"]
        # verify persisted
        lst = requests.get(f"{API}/divisi", headers=H(admin_token), timeout=15).json()
        assert any(d["id"] == did and d["nama"] == "TEST Divisi 1" for d in lst)
        # update
        u = requests.put(f"{API}/divisi/{did}", headers=H(admin_token),
                        json={"kode": "TEST_DIV1", "nama": "TEST Updated"}, timeout=15)
        assert u.status_code == 200
        assert u.json()["nama"] == "TEST Updated"
        # delete
        d = requests.delete(f"{API}/divisi/{did}", headers=H(admin_token), timeout=15)
        assert d.status_code == 200
        lst2 = requests.get(f"{API}/divisi", headers=H(admin_token), timeout=15).json()
        assert not any(x["id"] == did for x in lst2)


# ---------- Target & Input ----------
class TestKPI:
    def test_target_list(self, admin_token):
        r = requests.get(f"{API}/kpi-target?tahun={TAHUN}", headers=H(admin_token), timeout=20)
        assert r.status_code == 200
        assert len(r.json()) >= 1

    def test_target_bulk(self, admin_token):
        # fetch a real kode_kpi
        km = requests.get(f"{API}/kpi-master", headers=H(admin_token), timeout=15).json()
        assert km
        kode = km[0]["kode"]
        payload = [{"kode_kpi": kode, "tahun": TAHUN, "bulan": 1, "target": 100.0}]
        r = requests.post(f"{API}/kpi-target/bulk", headers=H(admin_token), json=payload, timeout=15)
        assert r.status_code == 200 and r.json()["ok"] is True

    def test_input_list(self, admin_token):
        r = requests.get(f"{API}/kpi-input?tahun={TAHUN}&bulan={BULAN}", headers=H(admin_token), timeout=30)
        assert r.status_code == 200
        rows = r.json()
        # enrichment fields present
        if rows:
            first = rows[0]
            for k in ("achievement", "nilai", "status", "target"):
                assert k in first

    def test_input_bulk(self, admin_token):
        km = requests.get(f"{API}/kpi-master", headers=H(admin_token), timeout=15).json()
        kar = requests.get(f"{API}/karyawan", headers=H(admin_token), timeout=15).json()
        if not km or not kar:
            pytest.skip("no master data")
        payload = [{"nik": kar[0]["nik"], "kode_kpi": km[0]["kode"], "tahun": TAHUN, "bulan": BULAN, "realisasi": 90.0}]
        r = requests.post(f"{API}/kpi-input/bulk", headers=H(admin_token), json=payload, timeout=20)
        assert r.status_code == 200


# ---------- Rekap & Dashboard ----------
class TestRekap:
    def test_rekap_individu(self, admin_token):
        r = requests.get(f"{API}/rekap/individu?tahun={TAHUN}&bulan={BULAN}", headers=H(admin_token), timeout=30)
        assert r.status_code == 200
        rows = r.json()
        assert isinstance(rows, list)
        if rows:
            assert "grade" in rows[0] and "score" in rows[0]

    def test_rekap_divisi(self, admin_token):
        r = requests.get(f"{API}/rekap/divisi?tahun={TAHUN}&bulan={BULAN}", headers=H(admin_token), timeout=30)
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_rekap_perusahaan(self, admin_token):
        r = requests.get(f"{API}/rekap/perusahaan?tahun={TAHUN}", headers=H(admin_token), timeout=45)
        assert r.status_code == 200
        d = r.json()
        assert "trend" in d and len(d["trend"]) == 12

    def test_dashboard_overview(self, admin_token):
        r = requests.get(f"{API}/dashboard/overview?tahun={TAHUN}&bulan={BULAN}", headers=H(admin_token), timeout=45)
        assert r.status_code == 200
        d = r.json()
        for k in ("overall_score", "gap", "karyawan_dinilai", "on_track", "divisi", "trend", "grade_distribusi", "ranking"):
            assert k in d

    def test_reward(self, admin_token):
        r = requests.get(f"{API}/reward-punishment?tahun={TAHUN}&bulan={BULAN}", headers=H(admin_token), timeout=30)
        assert r.status_code == 200
        rows = r.json()
        if rows:
            assert "reward" in rows[0] and "grade" in rows[0]


# ---------- Setting ----------
class TestSetting:
    def test_get_setting(self, admin_token):
        r = requests.get(f"{API}/setting", headers=H(admin_token), timeout=15)
        assert r.status_code == 200
        d = r.json()
        for k in ("threshold_a","threshold_b","threshold_c","threshold_d","on_track_min"):
            assert k in d

    def test_update_setting(self, admin_token):
        r = requests.put(f"{API}/setting", headers=H(admin_token),
                         json={"threshold_a":95,"threshold_b":85,"threshold_c":75,"threshold_d":65,"on_track_min":85},
                         timeout=15)
        assert r.status_code == 200
        assert r.json()["threshold_a"] == 95

    def test_supervisor_cannot_update_setting(self, sup_token):
        r = requests.put(f"{API}/setting", headers=H(sup_token),
                         json={"threshold_a":95,"threshold_b":85,"threshold_c":75,"threshold_d":65,"on_track_min":85},
                         timeout=15)
        assert r.status_code == 403


# ---------- Export ----------
class TestExport:
    @pytest.mark.parametrize("jenis", ["individu","divisi","perusahaan","reward"])
    def test_export_excel(self, admin_token, jenis):
        r = requests.get(f"{API}/export/excel?tahun={TAHUN}&bulan={BULAN}&jenis={jenis}", headers=H(admin_token), timeout=60)
        assert r.status_code == 200
        assert r.headers.get("content-type","").startswith("application/vnd.openxmlformats")
        assert len(r.content) > 100

    @pytest.mark.parametrize("jenis", ["individu","divisi","perusahaan","reward"])
    def test_export_pdf(self, admin_token, jenis):
        r = requests.get(f"{API}/export/pdf?tahun={TAHUN}&bulan={BULAN}&jenis={jenis}", headers=H(admin_token), timeout=60)
        assert r.status_code == 200
        assert r.headers.get("content-type","").startswith("application/pdf")
        assert r.content[:4] == b"%PDF"


# ---------- Import template ----------
class TestImport:
    def test_reimport_template(self, admin_token):
        r = requests.post(f"{API}/import/template", headers=H(admin_token), timeout=120)
        assert r.status_code == 200
        stats = r.json()["stats"]
        assert stats.get("divisi", 0) >= 1
        assert stats.get("karyawan", 0) >= 1
        assert stats.get("kpi_master", 0) >= 1

    def test_supervisor_cannot_import(self, sup_token):
        r = requests.post(f"{API}/import/template", headers=H(sup_token), timeout=30)
        assert r.status_code == 403
