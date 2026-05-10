#!/usr/bin/env bash
# 运行所有测试（文件间有延迟，避免触发 API 速率限制 100/分钟）
set -euo pipefail

echo "=== 1/3 单元测试 ==="
python3 -m pytest tests/unit_test.py -v --tb=short "$@"
echo ""

echo "--- 等待 5 秒（频率限制冷却）---"
sleep 5

echo "=== 2/3 冒烟测试 ==="
python3 -m pytest tests/smoke_test.py -v --tb=short "$@"
echo ""

echo "--- 等待 5 秒（频率限制冷却）---"
sleep 5

echo "=== 3/3 集成测试 ==="
python3 -m pytest tests/integration_test.py -v --tb=short "$@"

echo ""
echo "全部测试完成"
