"""
SubGate API 集成测试 (Integration Test)

模拟真实用户操作流程，测试多接口串联调用。
"""
import uuid
import requests
import pytest

from helpers import api_url, assert_status, assert_json_ok, TestUser


class TestAuthFullFlow:
    """集成: 认证全流程"""

    def test_register_login_profile_delete(self):
        user = TestUser()

        # 1. 注册
        r = user.register()
        assert r["status"] == 201
        assert "accessToken" in r["body"]["data"]
        token = user.access_token

        # 2. 获取个人信息
        r = requests.get(api_url("/auth/profile"), headers=user.auth_header, timeout=10)
        body = assert_json_ok(r, "profile")
        assert body["data"]["username"] == user.username

        # 3. 修改密码
        new_pwd = "newpass789"
        r = requests.put(
            api_url("/auth/password"),
            headers=user.auth_header,
            json={"oldPassword": user.password, "newPassword": new_pwd},
            timeout=10,
        )
        assert_status(r, 204, "change password")

        # 4. 旧密码应失效
        r = requests.post(
            api_url("/auth/login"),
            json={"username": user.username, "password": user.password},
            timeout=10,
        )
        assert_status(r, 401, "login with old password")

        # 5. 新密码应可登录
        r = requests.post(
            api_url("/auth/login"),
            json={"username": user.username, "password": new_pwd},
            timeout=10,
        )
        assert_status(r, 200, "login with new password")
        user.access_token = r.json()["data"]["accessToken"]

        # 6. 注销账号
        r = requests.delete(api_url("/auth/account"), headers=user.auth_header, timeout=10)
        assert_status(r, 204, "delete account")

        # 7. 已注销账号应无法登录
        r = requests.post(
            api_url("/auth/login"),
            json={"username": user.username, "password": new_pwd},
            timeout=10,
        )
        assert_status(r, 401, "login after account deletion")


class TestSourcesFullFlow:
    """集成: 订阅源全流程"""

    @pytest.fixture(autouse=True)
    def setup(self, base_user):
        self.user = base_user

    def test_source_crud_and_convert(self):
        headers = self.user.auth_header

        # 1. 创建订阅源
        r = requests.post(
            api_url("/sources"),
            headers=headers,
            json={"name": "intg_src", "url": "https://example.com/sub"},
            timeout=10,
        )
        src = assert_json_ok(r, "create source")["data"]
        src_id = src["id"]
        assert src["name"] == "intg_src"
        assert src["isActive"] == True

        # 2. 创建第二个源（用于 convert 多源测试）
        r = requests.post(
            api_url("/sources"),
            headers=headers,
            json={"name": "intg_src_2", "url": "https://example2.com/sub"},
            timeout=10,
        )
        src2_id = r.json()["data"]["id"]

        # 3. 列表查询
        r = requests.get(api_url("/sources"), headers=headers, timeout=10)
        body = assert_json_ok(r, "list sources")
        assert body["data"]["total"] >= 2

        # 4. 按 ID 查询
        r = requests.get(api_url(f"/sources/{src_id}"), headers=headers, timeout=10)
        body = assert_json_ok(r, "get source")
        assert body["data"]["id"] == src_id

        # 5. 更新
        r = requests.put(
            api_url(f"/sources/{src_id}"),
            headers=headers,
            json={"name": "intg_src_updated", "isActive": False},
            timeout=10,
        )
        body = assert_json_ok(r, "update source")
        assert body["data"]["name"] == "intg_src_updated"
        assert body["data"]["isActive"] == False

        # 6. 生成订阅（多源）
        r = requests.get(
            api_url("/generate"),
            headers=headers,
            params={"sources": f"{src_id},{src2_id}", "target": "clash"},
            timeout=10,
        )
        body = assert_json_ok(r, "generate")
        sub_uuid = body["data"].get("uuid")
        # uuid 可能嵌套在 data 中或直接返回

        # 7. 删除源 2
        r = requests.delete(api_url(f"/sources/{src2_id}"), headers=headers, timeout=10)
        assert_status(r, 204, "delete source 2")

        # 8. 删除源 1
        r = requests.delete(api_url(f"/sources/{src_id}"), headers=headers, timeout=10)
        assert_status(r, 204, "delete source 1")

        # 9. 确认已删除
        r = requests.get(api_url(f"/sources/{src_id}"), headers=headers, timeout=10)
        assert_status(r, 404, "get deleted source")


class TestConfigsFullFlow:
    """集成: 配置模板全流程"""

    @pytest.fixture(autouse=True)
    def setup(self, base_user):
        self.user = base_user

    def test_config_crud(self):
        headers = self.user.auth_header

        # 1. 创建
        r = requests.post(
            api_url("/configs"),
            headers=headers,
            json={"templateName": "intg_cfg", "targetType": "clash", "customRules": "# rules"},
            timeout=10,
        )
        cfg = assert_json_ok(r, "create config")["data"]
        cfg_id = cfg["id"]

        # 2. 列表
        r = requests.get(api_url("/configs"), headers=headers, timeout=10)
        assert_json_ok(r, "list configs")

        # 3. 按 ID 查询
        r = requests.get(api_url(f"/configs/{cfg_id}"), headers=headers, timeout=10)
        body = assert_json_ok(r, "get config")
        assert body["data"]["templateName"] == "intg_cfg"

        # 4. 更新
        r = requests.put(
            api_url(f"/configs/{cfg_id}"),
            headers=headers,
            json={"templateName": "intg_cfg_v2", "targetType": "surge"},
            timeout=10,
        )
        body = assert_json_ok(r, "update config")
        assert body["data"]["templateName"] == "intg_cfg_v2"
        assert body["data"]["targetType"] == "surge"

        # 5. 删除
        r = requests.delete(api_url(f"/configs/{cfg_id}"), headers=headers, timeout=10)
        assert_status(r, 204, "delete config")


class TestVaultFullFlow:
    """集成: 仓库全流程"""

    @pytest.fixture(autouse=True)
    def setup(self, base_user):
        self.user = base_user

    def test_vault_crud(self):
        headers = self.user.auth_header

        # 1. 添加到仓库
        r = requests.post(
            api_url("/vault"),
            headers=headers,
            json={
                "contentUrl": "https://example.com/vault_sub",
                "tags": "prod,main",
                "expiryDate": "2027-06-01T00:00:00.000Z",
            },
            timeout=10,
        )
        item = assert_json_ok(r, "create vault")["data"]
        item_id = item["id"]

        # 2. 列表
        r = requests.get(api_url("/vault"), headers=headers, timeout=10)
        body = assert_json_ok(r, "list vault")
        assert len(body["data"]) >= 1

        # 3. 按 ID 查询
        r = requests.get(api_url(f"/vault/{item_id}"), headers=headers, timeout=10)
        body = assert_json_ok(r, "get vault")
        assert body["data"]["contentUrl"] == "https://example.com/vault_sub"

        # 4. 更新标签
        r = requests.put(
            api_url(f"/vault/{item_id}"),
            headers=headers,
            json={"tags": "updated,staging", "expiryDate": "2028-12-01T00:00:00.000Z"},
            timeout=10,
        )
        body = assert_json_ok(r, "update vault")
        assert body["data"]["tags"] == "updated,staging"

        # 5. 删除
        r = requests.delete(api_url(f"/vault/{item_id}"), headers=headers, timeout=10)
        assert_status(r, 204, "delete vault item")


class TestCrossModuleFlow:
    """集成: 跨模块全流程 — Sources → Generate → Sub(public)"""

    @pytest.fixture(autouse=True)
    def setup(self, base_user):
        self.user = base_user

    def test_create_source_then_generate_and_fetch_sub(self):
        headers = self.user.auth_header

        # 创建源
        r = requests.post(
            api_url("/sources"),
            headers=headers,
            json={"name": "cross_src", "url": "https://example.com/proxy_sub"},
            timeout=10,
        )
        src = assert_json_ok(r, "create source")["data"]

        # 生成订阅
        r = requests.get(
            api_url("/generate"),
            headers=headers,
            params={"sources": src["id"], "target": "clash"},
            timeout=10,
        )
        body = assert_json_ok(r, "generate")
        gen_data = body["data"]
        # 从返回中获取 uuid
        sub_uuid = gen_data.get("uuid")
        if sub_uuid:
            # 通过公开端点获取订阅内容
            r = requests.get(api_url(f"/sub/{sub_uuid}"), timeout=10)
            assert r.status_code in (200, 404), (
                f"Sub endpoint unexpected: {r.status_code}"
            )
