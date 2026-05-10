"""
pytest 配置: 共享 session 级用户以减少 API 请求数。

注意: API 有 100 请求/分钟 的速率限制。三个测试文件总计约 200+ 请求，
建议分开运行:
    pytest tests/unit_test.py
    pytest tests/smoke_test.py
    pytest tests/integration_test.py

或使用 run_all.sh 脚本（包含文件间延迟）。
"""
import time
import pytest

from helpers import TestUser, BASE_URL, API_PREFIX


def pytest_collection_modifyitems(items):
    """按文件排序: unit → smoke → integration"""
    order = {"unit_test.py": 0, "smoke_test.py": 1, "integration_test.py": 2}
    items.sort(key=lambda item: order.get(item.fspath.basename, 99))


@pytest.fixture(scope="session")
def base_user():
    """session 级共享用户 — 所有非 Auth 测试复用此用户以节省请求"""
    user = TestUser()
    user.register()
    return user


@pytest.fixture(scope="session")
def auth_header(base_user):
    """共享的 Authorization header"""
    return base_user.auth_header


@pytest.fixture(scope="session")
def base_url():
    return BASE_URL


@pytest.fixture(scope="session")
def api_prefix():
    return API_PREFIX
