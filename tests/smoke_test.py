"""
SubGate API 冒烟测试 (Smoke Test)

快速验证所有核心端点可访问，确保服务没有崩溃。
- 每个端点只检查状态码和响应格式
- 不深入测试业务逻辑
- 适合在每次部署后跑
"""

import uuid
import requests
import pytest

from helpers import api_url, assert_status, assert_json_ok, TestUser


class TestSmokeHealth:
    def test_health_returns_200(self):
        r = requests.get(api_url("/health"), timeout=10)
        assert_status(r, 200, "GET /api/health")
        body = r.json()
        assert "status" in body or "data" in body


class TestSmokeAuth:
    @pytest.fixture(autouse=True)
    def setup(self):
        self.user = TestUser()

    def test_register(self):
        r = self.user.register()
        assert r["status"] == 201
        assert "accessToken" in r["body"]["data"]

    def test_login(self):
        self.user.register()
        self.user.access_token = None
        r = self.user.login()
        assert r["status"] == 200
        assert "accessToken" in r["body"]["data"]

    def test_get_profile(self):
        self.user.register()
        r = requests.get(
            api_url("/auth/profile"),
            headers=self.user.auth_header,
            timeout=10,
        )
        body = assert_json_ok(r, "GET /api/auth/profile")
        assert body["data"]["username"] == self.user.username


class TestSmokeSources:
    @pytest.fixture(autouse=True)
    def setup(self, base_user):
        self.user = base_user

    def test_create_and_list(self):
        r = requests.post(
            api_url("/sources"),
            headers=self.user.auth_header,
            json={"name": "smoke_src", "url": "https://example.com/sub"},
            timeout=10,
        )
        assert_status(r, 201, "POST /api/sources")
        r = requests.get(api_url("/sources"), headers=self.user.auth_header, timeout=10)
        body = assert_json_ok(r, "GET /api/sources")
        assert "items" in body["data"]


class TestSmokeConfigs:
    @pytest.fixture(autouse=True)
    def setup(self, base_user):
        self.user = base_user

    def test_create_and_list(self):
        r = requests.post(
            api_url("/configs"),
            headers=self.user.auth_header,
            json={"templateName": "smoke_cfg", "targetType": "clash"},
            timeout=10,
        )
        assert_status(r, 201, "POST /api/configs")
        r = requests.get(api_url("/configs"), headers=self.user.auth_header, timeout=10)
        body = assert_json_ok(r, "GET /api/configs")
        assert isinstance(body["data"], list)


class TestSmokeVault:
    @pytest.fixture(autouse=True)
    def setup(self, base_user):
        self.user = base_user

    def test_create_and_list(self):
        r = requests.post(
            api_url("/vault"),
            headers=self.user.auth_header,
            json={"contentUrl": "https://example.com/sub"},
            timeout=10,
        )
        assert_status(r, 201, "POST /api/vault")
        r = requests.get(api_url("/vault"), headers=self.user.auth_header, timeout=10)
        body = assert_json_ok(r, "GET /api/vault")
        assert isinstance(body["data"], list)


class TestSmokeConverter:
    @pytest.fixture(autouse=True)
    def setup(self, base_user):
        self.user = base_user

    def test_generate(self):
        r = requests.post(
            api_url("/sources"),
            headers=self.user.auth_header,
            json={"name": "smoke_gen", "url": "https://example.com/sub"},
            timeout=10,
        )
        source_id = r.json()["data"]["id"]
        r = requests.get(
            api_url("/generate"),
            headers=self.user.auth_header,
            params={"sources": source_id, "target": "clash"},
            timeout=10,
        )
        assert_status(r, 200, "GET /api/generate")
        body = r.json()
        assert "uuid" in body["data"] or "data" in body

    def test_hosted_sub_public(self):
        r = requests.get(api_url(f"/sub/{uuid.uuid4()}"), timeout=10)
        assert r.status_code in (200, 404), f"Unexpected status {r.status_code}"
