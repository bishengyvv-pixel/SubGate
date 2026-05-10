"""
SubGate API 测试共享配置、fixtures 和辅助函数
"""

import os
import sys
import time
import json
import uuid
from dataclasses import dataclass, field

import requests

# 默认 API 地址
BASE_URL = os.environ.get("SUBGATE_BASE_URL", "http://localhost:3001")
API_PREFIX = "/api"

# 全局存储（跨测试复用）
GLOBAL_STORE: dict = {}


def api_url(path: str) -> str:
    """构建完整 API URL"""
    return f"{BASE_URL}{API_PREFIX}{path}"


@dataclass
class TestUser:
    __test__ = False  # 防止 pytest 将其收集为测试类
    username: str = field(default_factory=lambda: f"auto_test_{uuid.uuid4().hex[:12]}")
    password: str = "test123456"
    access_token: str | None = None

    def register(self) -> dict:
        """注册用户并保存 token"""
        r = requests.post(
            api_url("/auth/register"),
            json={"username": self.username, "password": self.password},
            timeout=10,
        )
        if r.status_code == 201:
            body = r.json()
            self.access_token = body["data"]["accessToken"]
        return {"status": r.status_code, "body": r.json() if r.text else None}

    def login(self) -> dict:
        """登录并保存 token"""
        r = requests.post(
            api_url("/auth/login"),
            json={"username": self.username, "password": self.password},
            timeout=10,
        )
        if r.status_code == 200:
            body = r.json()
            self.access_token = body["data"]["accessToken"]
        return {"status": r.status_code, "body": r.json() if r.text else None}

    @property
    def auth_header(self) -> dict:
        return {"Authorization": f"Bearer {self.access_token}"}


def assert_status(r: requests.Response, expected: int, label: str = ""):
    """断言状态码，失败时打印 body"""
    ctx = f" [{label}]" if label else ""
    assert r.status_code == expected, (
        f"Expected {expected}, got {r.status_code}{ctx}\n" f"Body: {r.text[:500]}"
    )


def assert_json_ok(r: requests.Response, label: str = ""):
    """断言返回 2xx 且有 JSON body"""
    assert 200 <= r.status_code < 300, (
        f"Expected 2xx, got {r.status_code} [{label}]\n" f"Body: {r.text[:500]}"
    )
    body = r.json()
    assert body is not None, f"No JSON body [{label}]"
    return body


def assert_error(r: requests.Response, expected_status: int, label: str = ""):
    """断言返回指定的错误状态码"""
    assert r.status_code == expected_status, (
        f"Expected {expected_status}, got {r.status_code} [{label}]\n"
        f"Body: {r.text[:500]}"
    )
