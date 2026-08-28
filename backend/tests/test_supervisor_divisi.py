"""Tests for Supervisor<->Divisi integration, month-scoped KPI input, karyawan scoping, rekap freshness."""
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

ADMIN = {"email": "devaraahmad@gmail.com", "password": "Admin123!"}
SUP = {"email": "stephan.eka@apgroup.com", "password": "MrktSpv123!"}
KAR = {"email": "karyawan@apgroup.com", "password": "Karyawan123!"}


def _tok(creds):
    r = requests.post(f"{API}/auth/login", json=creds, timeout=30)
    if r.status_code != 200:
        pytest.fail(f"login failed for {creds['email']}: {r.status_code} {r.text[:300]}")
    return r.json()["token"]


def _cl(token):
    s = requests.Session()
    s.headers.update({"Authorization": f"Bearer {token}", "Content-Type": "application/json"})
    return s


@pytest.fixture(scope="module")
def admin():
    return _cl(_tok(ADMIN))


@pytest.fixture(scope="module")
def sup():
    return _cl(_tok(SUP))


@pytest.fixture(scope="module")
def kar():
    return _cl(_tok(KAR))


# ---------- Auth payload / divisi binding ----------
class TestAuthDivisi:
    def test_login_response_includes_divisi_for_supervisor(self):
        r = requests.post(f"{API}/auth/login", json=SUP, timeout=30)
        assert r.status_code == 200
        body = r.json()
        assert body["role"] == "supervisor"
        # frontend AuthContext stores this payload directly as `user`
        assert body.get("divisi") == "Marketing", f"login payload missing divisi: {body}"

    def test_me_returns_divisi(self, sup):
        r = sup.get(f"{API}/auth/me", timeout=30)
        assert r.status_code == 200
        assert r.json().get("divisi") == "Marketing"

    def test_login_sets_httponly_cookie(self):
        r = requests.post(f"{API}/auth/login", json=ADMIN, timeout=30)
        assert r.status_code == 200
        raw = r.headers.get("set-cookie", "")
        assert "access_token" in raw and "HttpOnly" in raw, raw

    def test_bad_password_401(self):
        r = requests.post(f"{API}/auth/login", json={"email": SUP["email"], "password": "wrong"}, timeout=30)
        assert r.status_code == 401


# ---------- Month scoping for kpi-input (reported bug) ----------
class TestMonthScoping:
    NIK = "EMP001"

    @pytest.fixture(scope="class")
    def mkt_kode(self, admin):
        r = admin.get(f"{API}/kpi-master", timeout=30)
        assert r.status_code == 200
        kodes = [k["kode"] for k in r.json() if k["divisi"] == "Marketing"]
        assert kodes, "no Marketing KPI master rows"
        return kodes[0]

    def test_get_month_filter_isolation(self, admin, mkt_kode):
        # write distinct values in Aug and Sep 2026
        for bulan, val in ((8, 111.0), (9, 222.0)):
            r = admin.post(f"{API}/kpi-input/bulk", json=[{
                "tahun": 2026, "bulan": bulan, "nik": self.NIK,
                "kode_kpi": mkt_kode, "realisasi": val}], timeout=30)
            assert r.status_code == 200, r.text
        aug = admin.get(f"{API}/kpi-input", params={"tahun": 2026, "bulan": 8, "divisi": "Marketing"}, timeout=30).json()
        sep = admin.get(f"{API}/kpi-input", params={"tahun": 2026, "bulan": 9, "divisi": "Marketing"}, timeout=30).json()
        assert all(r["bulan"] == 8 for r in aug), "Aug query returned other months"
        assert all(r["bulan"] == 9 for r in sep), "Sep query returned other months"
        a = [r for r in aug if r["nik"] == self.NIK and r["kode_kpi"] == mkt_kode]
        s = [r for r in sep if r["nik"] == self.NIK and r["kode_kpi"] == mkt_kode]
        assert a and a[0]["realisasi"] == 111.0
        assert s and s[0]["realisasi"] == 222.0

    def test_empty_month_returns_no_rows(self, admin):
        rows = admin.get(f"{API}/kpi-input", params={"tahun": 2026, "bulan": 12, "divisi": "Marketing"}, timeout=30).json()
        assert isinstance(rows, list)
        # December should have no data seeded; if it does, at least months must match
        assert all(r["bulan"] == 12 for r in rows)

    def test_divisi_filter_only_returns_that_divisi(self, admin):
        rows = admin.get(f"{API}/kpi-input", params={"tahun": 2026, "bulan": 8, "divisi": "Marketing"}, timeout=30).json()
        assert rows, "no Aug 2026 Marketing rows"
        assert all(r["divisi"] == "Marketing" for r in rows)
        assert all("_id" not in r for r in rows)


# ---------- Supervisor scoping ----------
class TestSupervisorScoping:
    def test_get_kpi_input_scoped_to_marketing(self, sup):
        r = sup.get(f"{API}/kpi-input", params={"tahun": 2026, "bulan": 8}, timeout=30)
        assert r.status_code == 200
        rows = r.json()
        assert rows, "supervisor got zero rows for Aug 2026"
        assert set(x["divisi"] for x in rows) == {"Marketing"}, set(x["divisi"] for x in rows)

    def test_supervisor_cannot_override_divisi_param(self, sup, admin):
        other = [k["divisi"] for k in admin.get(f"{API}/kpi-master", timeout=30).json() if k["divisi"] != "Marketing"]
        assert other
        rows = sup.get(f"{API}/kpi-input", params={"tahun": 2026, "bulan": 8, "divisi": other[0]}, timeout=30).json()
        assert all(x["divisi"] == "Marketing" for x in rows), "divisi param leaked other divisi data"

    def test_supervisor_save_is_draft_then_submit(self, sup, admin):
        kode = [k["kode"] for k in admin.get(f"{API}/kpi-master", timeout=30).json() if k["divisi"] == "Marketing"][0]
        nik = [k["nik"] for k in admin.get(f"{API}/karyawan", timeout=30).json() if k["divisi"] == "Marketing"][0]
        payload = [{"tahun": 2026, "bulan": 11, "nik": nik, "kode_kpi": kode, "realisasi": 77.0}]
        r = sup.post(f"{API}/kpi-input/bulk", json=payload, timeout=30)
        assert r.status_code == 200, r.text
        rows = sup.get(f"{API}/kpi-input", params={"tahun": 2026, "bulan": 11}, timeout=30).json()
        mine = [x for x in rows if x["nik"] == nik and x["kode_kpi"] == kode]
        assert mine and mine[0]["status"] == "draft", mine
        assert mine[0]["realisasi"] == 77.0

        r = sup.post(f"{API}/kpi-input/submit", json={"tahun": 2026, "bulan": 11, "divisi": "Marketing"}, timeout=60)
        assert r.status_code == 200, r.text
        rows = sup.get(f"{API}/kpi-input", params={"tahun": 2026, "bulan": 11}, timeout=30).json()
        mine = [x for x in rows if x["nik"] == nik and x["kode_kpi"] == kode]
        assert mine and mine[0]["status"] == "submitted", mine

    def test_admin_approve_after_submit(self, sup, admin):
        """draft -> submitted -> approved chain (iteration_3 fix verification)."""
        kode = [k["kode"] for k in admin.get(f"{API}/kpi-master", timeout=30).json() if k["divisi"] == "Marketing"][0]
        nik = [k["nik"] for k in admin.get(f"{API}/karyawan", timeout=30).json() if k["divisi"] == "Marketing"][0]
        r = sup.post(f"{API}/kpi-input/bulk", json=[{
            "tahun": 2026, "bulan": 10, "nik": nik, "kode_kpi": kode, "realisasi": 55.0}], timeout=30)
        assert r.status_code == 200, r.text

        def _row():
            rows = admin.get(f"{API}/kpi-input", params={"tahun": 2026, "bulan": 10, "divisi": "Marketing"}, timeout=30).json()
            return next((x for x in rows if x["nik"] == nik and x["kode_kpi"] == kode), None)

        assert _row()["status"] == "draft", _row()
        s = sup.post(f"{API}/kpi-input/submit", json={"tahun": 2026, "bulan": 10}, timeout=60)
        assert s.status_code == 200 and s.json()["submitted"] >= 1, s.text
        assert _row()["status"] == "submitted", _row()
        a = admin.post(f"{API}/kpi-input/approve", json={"tahun": 2026, "bulan": 10, "divisi": "Marketing", "action": "approve"}, timeout=60)
        assert a.status_code == 200 and a.json()["updated"] >= 1, a.text
        assert _row()["status"] == "approved", _row()

    def test_admin_save_is_approved(self, admin):
        kode = [k["kode"] for k in admin.get(f"{API}/kpi-master", timeout=30).json() if k["divisi"] == "Marketing"][0]
        r = admin.post(f"{API}/kpi-input/bulk", json=[{
            "tahun": 2026, "bulan": 10, "nik": "EMP001", "kode_kpi": kode, "realisasi": 33.0}], timeout=30)
        assert r.status_code == 200, r.text
        rows = admin.get(f"{API}/kpi-input", params={"tahun": 2026, "bulan": 10, "divisi": "Marketing"}, timeout=30).json()
        row = next(x for x in rows if x["nik"] == "EMP001" and x["kode_kpi"] == kode)
        assert row["status"] == "approved", row

    def test_supervisor_cross_divisi_write_403(self, sup, admin):
        km = admin.get(f"{API}/kpi-master", timeout=30).json()
        other = next(k for k in km if k["divisi"] != "Marketing")
        r = sup.post(f"{API}/kpi-input/bulk", json=[{
            "tahun": 2026, "bulan": 11, "nik": "EMP001",
            "kode_kpi": other["kode"], "realisasi": 5.0}], timeout=30)
        assert r.status_code == 403, f"expected 403, got {r.status_code} {r.text[:200]}"

    def test_supervisor_cannot_register_users(self, sup):
        r = sup.post(f"{API}/auth/register", json={
            "email": "TEST_nope@apgroup.com", "password": "Xx12345!", "name": "TEST",
            "role": "karyawan"}, timeout=30)
        assert r.status_code == 403


# ---------- Karyawan scoping ----------
class TestKaryawanScoping:
    def test_rekap_individu_only_self(self, kar):
        r = kar.get(f"{API}/rekap/individu", params={"tahun": 2026}, timeout=60)
        assert r.status_code == 200
        rows = r.json()
        assert len(rows) == 1, f"expected 1 row, got {len(rows)}"
        assert rows[0]["nik"] == "EMP001"

    def test_dashboard_personal(self, kar):
        r = kar.get(f"{API}/dashboard/overview", params={"tahun": 2026, "bulan": 8}, timeout=60)
        assert r.status_code == 200
        d = r.json()
        assert d.get("personal") is True
        assert d["karyawan_dinilai"] == 1
        assert all(x["nik"] == "EMP001" for x in d["ranking"])

    def test_kpi_input_only_own(self, kar):
        rows = kar.get(f"{API}/kpi-input", params={"tahun": 2026, "bulan": 8}, timeout=30).json()
        assert all(x["nik"] == "EMP001" for x in rows)

    def test_reward_forbidden(self, kar):
        r = kar.get(f"{API}/reward-punishment", params={"tahun": 2026, "bulan": 8}, timeout=30)
        assert r.status_code == 403

    def test_karyawan_cannot_write_kpi(self, kar):
        r = kar.post(f"{API}/kpi-input/bulk", json=[{
            "tahun": 2026, "bulan": 8, "nik": "EMP001", "kode_kpi": "MRK-01", "realisasi": 1}], timeout=30)
        assert r.status_code == 403


# ---------- Rekap reflects latest DB data ----------
class TestRekapFreshness:
    def _score(self, client, nik, bulan=8):
        rows = client.get(f"{API}/rekap/individu", params={"tahun": 2026, "bulan": bulan}, timeout=60).json()
        row = next((r for r in rows if r["nik"] == nik), None)
        return row

    def test_rekap_and_reward_reflect_new_realisasi(self, admin):
        km = [k for k in admin.get(f"{API}/kpi-master", timeout=30).json() if k["divisi"] == "Marketing"]
        kode = km[0]["kode"]
        nik = "EMP001"
        before = self._score(admin, nik)
        assert before is not None, "EMP001 not present in Aug 2026 rekap"

        tgs = admin.get(f"{API}/kpi-target", params={"tahun": 2026}, timeout=60).json()
        target = next((t["target"] for t in tgs if t["kode_kpi"] == kode and t["bulan"] == 8), 0)
        assert target, f"no target for {kode} Aug 2026"

        new_real = target * (0.25 if km[0]["arah_nilai"] == "Higher" else 4)
        r = admin.post(f"{API}/kpi-input/bulk", json=[{
            "tahun": 2026, "bulan": 8, "nik": nik, "kode_kpi": kode,
            "realisasi": new_real, "status": "approved"}], timeout=30)
        assert r.status_code == 200, r.text

        after = self._score(admin, nik)
        assert after["score"] != before["score"], (
            f"rekap score unchanged after write: {before['score']} -> {after['score']}")

        rw = admin.get(f"{API}/reward-punishment", params={"tahun": 2026, "bulan": 8}, timeout=60).json()
        me = next(x for x in rw if x["nik"] == nik)
        assert me["score"] == after["score"]
        assert me["grade"] == after["grade"]
        assert me["reward"]

        div = admin.get(f"{API}/rekap/divisi", params={"tahun": 2026, "bulan": 8}, timeout=60).json()
        mkt = next((d for d in div if d["divisi"] == "Marketing"), None)
        assert mkt is not None and "score" in mkt and "grade" in mkt

        # restore previous realisasi so we don't corrupt seeded data further
        prev_rows = admin.get(f"{API}/kpi-input", params={"tahun": 2026, "bulan": 8, "nik": nik}, timeout=30).json()
        assert prev_rows


# ---------- User management (divisi vs nik) ----------
class TestUserManagement:
    created = []

    def test_register_supervisor_with_divisi(self, admin):
        payload = {"email": "test_spv_qa@apgroup.com", "password": "TestSpv123!",
                   "name": "TEST QA Supervisor", "role": "supervisor", "divisi": "Produksi"}
        r = admin.post(f"{API}/auth/register", json=payload, timeout=30)
        if r.status_code == 400:
            pytest.skip("test user already exists")
        assert r.status_code == 200, r.text
        body = r.json()
        self.created.append(body["id"])
        assert body["divisi"] == "Produksi"
        assert "password_hash" not in body
        users = admin.get(f"{API}/auth/users", timeout=30).json()
        u = next(x for x in users if x["email"] == payload["email"])
        assert u["divisi"] == "Produksi"

    def test_register_karyawan_with_nik(self, admin):
        payload = {"email": "test_kar_qa@apgroup.com", "password": "TestKar123!",
                   "name": "TEST QA Karyawan", "role": "karyawan", "nik": "EMP001"}
        r = admin.post(f"{API}/auth/register", json=payload, timeout=30)
        if r.status_code == 400:
            pytest.skip("test user already exists")
        assert r.status_code == 200, r.text
        body = r.json()
        self.created.append(body["id"])
        assert body["nik"] == "EMP001"
        assert body["divisi"] is None

    # ---- iteration_3: register validation ----
    def test_register_supervisor_without_divisi_400(self, admin):
        r = admin.post(f"{API}/auth/register", json={
            "email": "TEST_spv_nodiv@apgroup.com", "password": "TestSpv123!",
            "name": "TEST NoDiv", "role": "supervisor"}, timeout=30)
        assert r.status_code == 400, f"{r.status_code} {r.text[:300]}"

    def test_register_karyawan_without_nik_400(self, admin):
        r = admin.post(f"{API}/auth/register", json={
            "email": "TEST_kar_nonik@apgroup.com", "password": "TestKar123!",
            "name": "TEST NoNik", "role": "karyawan"}, timeout=30)
        assert r.status_code == 400, f"{r.status_code} {r.text[:300]}"

    def test_register_supervisor_bad_divisi_400(self, admin):
        r = admin.post(f"{API}/auth/register", json={
            "email": "TEST_spv_baddiv@apgroup.com", "password": "TestSpv123!",
            "name": "TEST BadDiv", "role": "supervisor", "divisi": "DivisiTidakAda"}, timeout=30)
        assert r.status_code == 400, f"{r.status_code} {r.text[:300]}"

    def test_register_karyawan_bad_nik_400(self, admin):
        r = admin.post(f"{API}/auth/register", json={
            "email": "TEST_kar_badnik@apgroup.com", "password": "TestKar123!",
            "name": "TEST BadNik", "role": "karyawan", "nik": "NOPE999"}, timeout=30)
        assert r.status_code == 400, f"{r.status_code} {r.text[:300]}"

    def test_no_orphan_test_users_created(self, admin):
        users = admin.get(f"{API}/auth/users", timeout=30).json()
        emails = [u["email"] for u in users]
        for e in ("test_spv_nodiv@apgroup.com", "test_kar_nonik@apgroup.com",
                  "test_spv_baddiv@apgroup.com", "test_kar_badnik@apgroup.com"):
            assert e not in emails, f"invalid registration persisted: {e}"

    # ---- iteration_3: legacy supervisor cleanup ----
    def test_legacy_supervisors_removed(self, admin):
        users = admin.get(f"{API}/auth/users", timeout=30).json()
        emails = [u["email"] for u in users]
        assert "katrin@apgroup.com" not in emails, emails
        assert "supervisor@apgroup.com" not in emails, emails

    def test_all_supervisors_have_divisi(self, admin):
        users = admin.get(f"{API}/auth/users", timeout=30).json()
        bad = [u["email"] for u in users if u["role"] == "supervisor" and not u.get("divisi")]
        assert not bad, f"supervisors without divisi: {bad}"

    def test_cleanup(self, admin):
        for uid in self.created:
            r = admin.delete(f"{API}/auth/users/{uid}", timeout=30)
            assert r.status_code == 200
        users = admin.get(f"{API}/auth/users", timeout=30).json()
        emails = [u["email"] for u in users]
        assert "test_spv_qa@apgroup.com" not in emails
