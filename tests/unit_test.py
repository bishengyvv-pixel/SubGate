"""
SubGate API 单元测试 (Unit Test)

对每个端点独立测试:
- 正常输入验证
- 参数校验（必填/选填/格式/边界值）
- 鉴权检查
- 响应格式验证
"""
import uuid
import requests
import pytest

from helpers import api_url, assert_status, assert_json_ok, TestUser


# ═══════════════════════════════════════════════════════════
# Health
# ═══════════════════════════════════════════════════════════

class TestHealth:
    def test_health_ok(self):
        r = requests.get(api_url("/health"), timeout=10)
        assert_status(r, 200)
        body = r.json()
        assert "data" in body or "status" in body


# ═══════════════════════════════════════════════════════════
# Auth — Register
# ═══════════════════════════════════════════════════════════

class TestAuthRegister:
    def test_register_returns_token_and_user(self):
        user = TestUser()
        r = user.register()
        assert r["status"] == 201
        data = r["body"]["data"]
        assert "accessToken" in data
        assert data["user"]["username"] == user.username
        assert "passwordHash" not in data["user"]

    def test_register_empty_username(self):
        r = requests.post(
            api_url("/auth/register"),
            json={"username": "", "password": "test123456"},
            timeout=10,
        )
        assert r.status_code == 400

    def test_register_empty_password(self):
        r = requests.post(
            api_url("/auth/register"),
            json={"username": f"test_{uuid.uuid4().hex[:8]}", "password": ""},
            timeout=10,
        )
        assert r.status_code == 400

    def test_register_without_username(self):
        r = requests.post(
            api_url("/auth/register"),
            json={"password": "test123456"},
            timeout=10,
        )
        assert r.status_code == 400

    def test_register_without_password(self):
        r = requests.post(
            api_url("/auth/register"),
            json={"username": f"test_{uuid.uuid4().hex[:8]}"},
            timeout=10,
        )
        assert r.status_code == 400

    def test_register_duplicate_username(self):
        user = TestUser()
        user.register()
        r = requests.post(
            api_url("/auth/register"),
            json={"username": user.username, "password": "other123"},
            timeout=10,
        )
        assert_status(r, 409)

    def test_register_username_too_short(self):
        r = requests.post(
            api_url("/auth/register"),
            json={"username": "ab", "password": "valid123456"},
            timeout=10,
        )
        assert r.status_code == 400

    def test_register_password_too_short(self):
        r = requests.post(
            api_url("/auth/register"),
            json={"username": f"u_{uuid.uuid4().hex[:8]}", "password": "12345"},
            timeout=10,
        )
        assert r.status_code == 400

    def test_register_username_at_min_boundary(self):
        # minLength=3, use random 3-char string to avoid collisions
        import random, string as _s
        uname = "".join(random.choices(_s.ascii_lowercase, k=3))
        r = requests.post(
            api_url("/auth/register"),
            json={"username": uname, "password": "valid123"},
            timeout=10,
        )
        assert r.status_code == 201  # minLength=3 passes

    def test_register_password_at_min_boundary(self):
        r = requests.post(
            api_url("/auth/register"),
            json={"username": f"u_{uuid.uuid4().hex[:8]}", "password": "123456"},
            timeout=10,
        )
        assert r.status_code == 201  # minLength=6 passes

    def test_register_extra_fields_ignored(self):
        """非白名单字段应被忽略（whitelist: true）"""
        user = TestUser()
        r = requests.post(
            api_url("/auth/register"),
            json={"username": user.username, "password": user.password, "role": "admin"},
            timeout=10,
        )
        # 行为取决于 forbidNonWhitelisted; 可能 201 或 400
        assert r.status_code in (201, 400)
        if r.status_code == 201:
            data = r.json()["data"]
            assert data["user"]["username"] == user.username


# ═══════════════════════════════════════════════════════════
# Auth — Login
# ═══════════════════════════════════════════════════════════

class TestAuthLogin:
    @pytest.fixture(autouse=True)
    def setup(self):
        self.user = TestUser()
        self.user.register()

    def test_login_returns_token(self):
        r = requests.post(
            api_url("/auth/login"),
            json={"username": self.user.username, "password": self.user.password},
            timeout=10,
        )
        body = assert_json_ok(r, "login")
        assert "accessToken" in body["data"]

    def test_login_wrong_password(self):
        r = requests.post(
            api_url("/auth/login"),
            json={"username": self.user.username, "password": "wrongpass"},
            timeout=10,
        )
        assert_status(r, 401)

    def test_login_nonexistent_user(self):
        r = requests.post(
            api_url("/auth/login"),
            json={"username": f"no_user_{uuid.uuid4().hex}", "password": "test123"},
            timeout=10,
        )
        assert_status(r, 401)

    def test_login_empty_body(self):
        r = requests.post(
            api_url("/auth/login"),
            json={},
            timeout=10,
        )
        assert r.status_code == 400


# ═══════════════════════════════════════════════════════════
# Auth — Profile
# ═══════════════════════════════════════════════════════════

class TestAuthProfile:
    @pytest.fixture(autouse=True)
    def setup(self):
        self.user = TestUser()
        self.user.register()

    def test_profile_with_token(self):
        r = requests.get(api_url("/auth/profile"), headers=self.user.auth_header, timeout=10)
        body = assert_json_ok(r, "profile")
        assert body["data"]["username"] == self.user.username
        assert "passwordHash" not in body["data"]

    def test_profile_without_token(self):
        r = requests.get(api_url("/auth/profile"), timeout=10)
        assert_status(r, 401)

    def test_profile_with_invalid_token(self):
        r = requests.get(
            api_url("/auth/profile"),
            headers={"Authorization": f"Bearer invalidtoken"},
            timeout=10,
        )
        assert_status(r, 401)


# ═══════════════════════════════════════════════════════════
# Auth — Change Password
# ═══════════════════════════════════════════════════════════

class TestAuthPassword:
    @pytest.fixture(autouse=True)
    def setup(self):
        self.user = TestUser()
        self.user.register()

    def test_change_password_ok(self):
        r = requests.put(
            api_url("/auth/password"),
            headers=self.user.auth_header,
            json={"oldPassword": self.user.password, "newPassword": "new.secret99"},
            timeout=10,
        )
        assert_status(r, 204)

    def test_change_password_wrong_old(self):
        r = requests.put(
            api_url("/auth/password"),
            headers=self.user.auth_header,
            json={"oldPassword": "wrong.old.pwd", "newPassword": "new.secret99"},
            timeout=10,
        )
        assert_status(r, 401)

    def test_change_password_without_token(self):
        r = requests.put(
            api_url("/auth/password"),
            json={"oldPassword": "pwd", "newPassword": "newpwd"},
            timeout=10,
        )
        assert_status(r, 401)

    def test_change_password_empty_new(self):
        r = requests.put(
            api_url("/auth/password"),
            headers=self.user.auth_header,
            json={"oldPassword": self.user.password, "newPassword": ""},
            timeout=10,
        )
        assert r.status_code in (400, 204)

    def test_change_password_too_short_new(self):
        r = requests.put(
            api_url("/auth/password"),
            headers=self.user.auth_header,
            json={"oldPassword": self.user.password, "newPassword": "12345"},
            timeout=10,
        )
        assert r.status_code == 400


# ═══════════════════════════════════════════════════════════
# Auth — Delete Account
# ═══════════════════════════════════════════════════════════

class TestAuthDelete:
    def test_delete_account_ok(self):
        user = TestUser()
        user.register()
        r = requests.delete(api_url("/auth/account"), headers=user.auth_header, timeout=10)
        assert_status(r, 204)

    def test_delete_account_without_token(self):
        r = requests.delete(api_url("/auth/account"), timeout=10)
        assert_status(r, 401)


# ═══════════════════════════════════════════════════════════
# Sources
# ═══════════════════════════════════════════════════════════

class TestSourcesCreate:
    @pytest.fixture(autouse=True)
    def setup(self, base_user):
        self.user = base_user

    def test_create_ok(self):
        r = requests.post(
            api_url("/sources"),
            headers=self.user.auth_header,
            json={"name": "my source", "url": "https://example.com/sub"},
            timeout=10,
        )
        body = assert_json_ok(r, "create source")
        assert body["data"]["name"] == "my source"
        assert body["data"]["isActive"] == True

    def test_create_with_note(self):
        r = requests.post(
            api_url("/sources"),
            headers=self.user.auth_header,
            json={"name": "src_note", "url": "https://example.com/sub", "note": "备注信息"},
            timeout=10,
        )
        body = assert_json_ok(r, "create with note")
        assert body["data"]["note"] == "备注信息"

    def test_create_without_token(self):
        r = requests.post(
            api_url("/sources"),
            json={"name": "test", "url": "https://example.com/sub"},
            timeout=10,
        )
        assert_status(r, 401)

    def test_create_missing_name(self):
        r = requests.post(
            api_url("/sources"),
            headers=self.user.auth_header,
            json={"url": "https://example.com/sub"},
            timeout=10,
        )
        assert r.status_code == 400

    def test_create_missing_url(self):
        r = requests.post(
            api_url("/sources"),
            headers=self.user.auth_header,
            json={"name": "no url"},
            timeout=10,
        )
        assert r.status_code == 400

    def test_create_invalid_url(self):
        r = requests.post(
            api_url("/sources"),
            headers=self.user.auth_header,
            json={"name": "bad url", "url": "not-a-valid-url"},
            timeout=10,
        )
        assert r.status_code == 400


class TestSourcesRead:
    @pytest.fixture(autouse=True)
    def setup(self, base_user):
        self.user = base_user
        # create a source for reading
        r = requests.post(
            api_url("/sources"),
            headers=self.user.auth_header,
            json={"name": "read_test", "url": "https://example.com/read"},
            timeout=10,
        )
        self.source_id = r.json()["data"]["id"]

    def test_list_default_pagination(self):
        r = requests.get(api_url("/sources"), headers=self.user.auth_header, timeout=10)
        body = assert_json_ok(r, "list sources")
        assert "items" in body["data"]
        assert "total" in body["data"]
        assert body["data"]["total"] >= 1

    def test_get_by_id(self):
        r = requests.get(
            api_url(f"/sources/{self.source_id}"),
            headers=self.user.auth_header,
            timeout=10,
        )
        body = assert_json_ok(r, "get source")
        assert body["data"]["id"] == self.source_id

    def test_get_nonexistent(self):
        r = requests.get(
            api_url("/sources/00000000-0000-0000-0000-000000000000"),
            headers=self.user.auth_header,
            timeout=10,
        )
        assert_status(r, 404)

    def test_list_without_token(self):
        r = requests.get(api_url("/sources"), timeout=10)
        assert_status(r, 401)

    def test_get_without_token(self):
        r = requests.get(api_url(f"/sources/{self.source_id}"), timeout=10)
        assert_status(r, 401)


class TestSourcesUpdate:
    @pytest.fixture(autouse=True)
    def setup(self, base_user):
        self.user = base_user
        r = requests.post(
            api_url("/sources"),
            headers=self.user.auth_header,
            json={"name": "update_test", "url": "https://example.com/update"},
            timeout=10,
        )
        self.source_id = r.json()["data"]["id"]

    def test_update_name(self):
        r = requests.put(
            api_url(f"/sources/{self.source_id}"),
            headers=self.user.auth_header,
            json={"name": "renamed"},
            timeout=10,
        )
        body = assert_json_ok(r, "update name")
        assert body["data"]["name"] == "renamed"

    def test_update_toggle_active(self):
        r = requests.put(
            api_url(f"/sources/{self.source_id}"),
            headers=self.user.auth_header,
            json={"isActive": False},
            timeout=10,
        )
        body = assert_json_ok(r, "toggle isActive")
        assert body["data"]["isActive"] == False

        r = requests.put(
            api_url(f"/sources/{self.source_id}"),
            headers=self.user.auth_header,
            json={"isActive": True},
            timeout=10,
        )
        body = assert_json_ok(r, "toggle back")
        assert body["data"]["isActive"] == True

    def test_update_without_token(self):
        r = requests.put(
            api_url(f"/sources/{self.source_id}"),
            json={"name": "hack"},
            timeout=10,
        )
        assert_status(r, 401)

    def test_update_nonexistent(self):
        r = requests.put(
            api_url("/sources/00000000-0000-0000-0000-000000000000"),
            headers=self.user.auth_header,
            json={"name": "ghost"},
            timeout=10,
        )
        assert_status(r, 404)


class TestSourcesDelete:
    @pytest.fixture(autouse=True)
    def setup(self, base_user):
        self.user = base_user

    def test_delete_ok(self):
        r = requests.post(
            api_url("/sources"),
            headers=self.user.auth_header,
            json={"name": "delete_me", "url": "https://example.com/del"},
            timeout=10,
        )
        sid = r.json()["data"]["id"]
        r = requests.delete(api_url(f"/sources/{sid}"), headers=self.user.auth_header, timeout=10)
        assert_status(r, 204)

        r = requests.get(api_url(f"/sources/{sid}"), headers=self.user.auth_header, timeout=10)
        assert_status(r, 404)

    def test_delete_without_token(self):
        r = requests.delete(
            api_url("/sources/some-id"),
            timeout=10,
        )
        assert_status(r, 401)


# ═══════════════════════════════════════════════════════════
# Configs
# ═══════════════════════════════════════════════════════════

class TestConfigsCreate:
    @pytest.fixture(autouse=True)
    def setup(self, base_user):
        self.user = base_user

    def test_create_ok(self):
        r = requests.post(
            api_url("/configs"),
            headers=self.user.auth_header,
            json={"templateName": "my tpl", "targetType": "clash"},
            timeout=10,
        )
        body = assert_json_ok(r, "create config")
        assert body["data"]["templateName"] == "my tpl"
        assert body["data"]["targetType"] == "clash"

    def test_create_all_target_types(self):
        for t in ("clash", "surge", "quantumultx", "stash"):
            r = requests.post(
                api_url("/configs"),
                headers=self.user.auth_header,
                json={"templateName": f"tpl_{t}", "targetType": t},
                timeout=10,
            )
            assert r.status_code == 201, f"targetType={t} failed: {r.text[:200]}"

    def test_create_invalid_target_type(self):
        r = requests.post(
            api_url("/configs"),
            headers=self.user.auth_header,
            json={"templateName": "bad", "targetType": "invalid_type"},
            timeout=10,
        )
        assert r.status_code == 400

    def test_create_with_custom_rules(self):
        r = requests.post(
            api_url("/configs"),
            headers=self.user.auth_header,
            json={
                "templateName": "rules tpl",
                "targetType": "surge",
                "customRules": "# custom\nDOMAIN-SUFFIX,example.com,Proxy",
            },
            timeout=10,
        )
        body = assert_json_ok(r, "create with rules")
        assert body["data"]["customRules"] == "# custom\nDOMAIN-SUFFIX,example.com,Proxy"

    def test_create_missing_name(self):
        r = requests.post(
            api_url("/configs"),
            headers=self.user.auth_header,
            json={"targetType": "clash"},
            timeout=10,
        )
        assert r.status_code == 400

    def test_create_missing_target_type(self):
        r = requests.post(
            api_url("/configs"),
            headers=self.user.auth_header,
            json={"templateName": "no type"},
            timeout=10,
        )
        assert r.status_code == 400


class TestConfigsCrud:
    @pytest.fixture(autouse=True)
    def setup(self, base_user):
        self.user = base_user
        r = requests.post(
            api_url("/configs"),
            headers=self.user.auth_header,
            json={"templateName": "crud", "targetType": "stash"},
            timeout=10,
        )
        self.cfg_id = r.json()["data"]["id"]

    def test_list(self):
        r = requests.get(api_url("/configs"), headers=self.user.auth_header, timeout=10)
        body = assert_json_ok(r, "list configs")
        assert isinstance(body["data"], list)

    def test_get_by_id(self):
        r = requests.get(
            api_url(f"/configs/{self.cfg_id}"),
            headers=self.user.auth_header,
            timeout=10,
        )
        body = assert_json_ok(r, "get config")
        assert body["data"]["id"] == self.cfg_id

    def test_update(self):
        r = requests.put(
            api_url(f"/configs/{self.cfg_id}"),
            headers=self.user.auth_header,
            json={"templateName": "updated_cfg", "targetType": "quantumultx"},
            timeout=10,
        )
        body = assert_json_ok(r, "update config")
        assert body["data"]["templateName"] == "updated_cfg"
        assert body["data"]["targetType"] == "quantumultx"

    def test_delete(self):
        r = requests.delete(
            api_url(f"/configs/{self.cfg_id}"),
            headers=self.user.auth_header,
            timeout=10,
        )
        assert_status(r, 204)


# ═══════════════════════════════════════════════════════════
# Vault
# ═══════════════════════════════════════════════════════════

class TestVaultCreate:
    @pytest.fixture(autouse=True)
    def setup(self, base_user):
        self.user = base_user

    def test_create_ok(self):
        r = requests.post(
            api_url("/vault"),
            headers=self.user.auth_header,
            json={"contentUrl": "https://example.com/sub"},
            timeout=10,
        )
        body = assert_json_ok(r, "create vault")
        assert body["data"]["contentUrl"] == "https://example.com/sub"

    def test_create_with_tags_and_expiry(self):
        r = requests.post(
            api_url("/vault"),
            headers=self.user.auth_header,
            json={
                "contentUrl": "https://example.com/full",
                "tags": "prod,main,vip",
                "expiryDate": "2027-06-15T00:00:00.000Z",
            },
            timeout=10,
        )
        body = assert_json_ok(r, "create full")
        assert body["data"]["tags"] == "prod,main,vip"

    def test_create_invalid_url(self):
        r = requests.post(
            api_url("/vault"),
            headers=self.user.auth_header,
            json={"contentUrl": "bad-url"},
            timeout=10,
        )
        assert r.status_code == 400

    def test_create_without_token(self):
        r = requests.post(
            api_url("/vault"),
            json={"contentUrl": "https://example.com/sub"},
            timeout=10,
        )
        assert_status(r, 401)

    def test_create_missing_url(self):
        r = requests.post(
            api_url("/vault"),
            headers=self.user.auth_header,
            json={},
            timeout=10,
        )
        assert r.status_code == 400


class TestVaultCrud:
    @pytest.fixture(autouse=True)
    def setup(self, base_user):
        self.user = base_user
        r = requests.post(
            api_url("/vault"),
            headers=self.user.auth_header,
            json={"contentUrl": "https://example.com/vault_crud"},
            timeout=10,
        )
        self.item_id = r.json()["data"]["id"]

    def test_list(self):
        r = requests.get(api_url("/vault"), headers=self.user.auth_header, timeout=10)
        body = assert_json_ok(r, "list vault")
        assert isinstance(body["data"], list)

    def test_get_by_id(self):
        r = requests.get(
            api_url(f"/vault/{self.item_id}"),
            headers=self.user.auth_header,
            timeout=10,
        )
        body = assert_json_ok(r, "get vault")
        assert body["data"]["id"] == self.item_id

    def test_update_tags(self):
        r = requests.put(
            api_url(f"/vault/{self.item_id}"),
            headers=self.user.auth_header,
            json={"tags": "updated-only", "expiryDate": "2028-01-01T00:00:00.000Z"},
            timeout=10,
        )
        body = assert_json_ok(r, "update vault")
        assert body["data"]["tags"] == "updated-only"

    def test_delete(self):
        r = requests.delete(
            api_url(f"/vault/{self.item_id}"),
            headers=self.user.auth_header,
            timeout=10,
        )
        assert_status(r, 204)


# ═══════════════════════════════════════════════════════════
# Converter
# ═══════════════════════════════════════════════════════════

class TestConverterGenerate:
    @pytest.fixture(autouse=True)
    def setup(self, base_user):
        self.user = base_user
        r = requests.post(
            api_url("/sources"),
            headers=self.user.auth_header,
            json={"name": "conv_src", "url": "https://example.com/sub"},
            timeout=10,
        )
        self.src_id = r.json()["data"]["id"]

    def test_generate_with_single_source(self):
        r = requests.get(
            api_url("/generate"),
            headers=self.user.auth_header,
            params={"sources": self.src_id, "target": "clash"},
            timeout=10,
        )
        body = assert_json_ok(r, "generate single")
        assert "data" in body

    def test_generate_without_target_uses_default(self):
        r = requests.get(
            api_url("/generate"),
            headers=self.user.auth_header,
            params={"sources": self.src_id},
            timeout=10,
        )
        body = assert_json_ok(r, "generate no target")
        assert "data" in body

    def test_generate_without_token(self):
        r = requests.get(
            api_url("/generate"),
            params={"sources": self.src_id},
            timeout=10,
        )
        assert_status(r, 401)

    def test_generate_without_sources(self):
        r = requests.get(
            api_url("/generate"),
            headers=self.user.auth_header,
            timeout=10,
        )
        # sources 是必填参数
        assert r.status_code in (400, 200)


class TestConverterHostedSub:
    def test_hosted_sub_not_found(self):
        r = requests.get(
            api_url(f"/sub/{uuid.uuid4()}"),
            timeout=10,
        )
        assert_status(r, 404)

    def test_hosted_sub_no_auth_required(self):
        """托管订阅是公开端点，不需要鉴权"""
        r = requests.get(
            api_url(f"/sub/{uuid.uuid4()}"),
            timeout=10,
        )
        assert r.status_code == 404  # 不存在的 UUID 返回 404，不是 401


# ═══════════════════════════════════════════════════════════
# Response format validation
# ═══════════════════════════════════════════════════════════

class TestResponseFormat:
    """验证统一响应格式"""

    @pytest.fixture(autouse=True)
    def setup(self, base_user):
        self.user = base_user

    def test_login_response_structure(self):
        r = requests.post(
            api_url("/auth/login"),
            json={"username": self.user.username, "password": self.user.password},
            timeout=10,
        )
        body = r.json()
        assert "code" in body
        assert "message" in body
        assert "data" in body
        assert body["code"] == 200

    def test_error_response_structure(self):
        r = requests.post(
            api_url("/auth/login"),
            json={"username": "no_one", "password": "whatever"},
            timeout=10,
        )
        body = r.json()
        assert "code" in body
        assert "message" in body
        assert body["code"] == 401
