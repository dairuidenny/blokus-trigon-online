#!/usr/bin/env python3
import os
import re
import sys

# ==========================================
# GameSpec Linter v2.1 - 智能分级检查工具
# ==========================================

# 颜色代码
GREEN = "\033[92m"
RED = "\033[91m"
YELLOW = "\033[93m"
BLUE = "\033[94m"
RESET = "\033[0m"

# 魔法数字正则
MAGIC_NUMBER_PATTERN = re.compile(r'(?<![a-zA-Z0-9_])\d+(?:\.\d+)?(?![a-zA-Z0-9_\.\-])')
VAR_PATTERN = re.compile(r'\{\{[A-Z0-9_]+\}\}')

def check_content_rules(content, errors, warnings, strict_mode=False):
    lines = content.split('\n')
    
    # 1. 检查 YAML Frontmatter (元信息)
    if not content.startswith('---'):
        if strict_mode:
            errors.append("缺少 YAML Frontmatter (元信息)。规范文档必须包含 id/version/author。")
        else:
            # 宽容模式下，这只是个警告，甚至可以是忽略
            pass

    # 2. 检查魔法数字
    for i, line in enumerate(lines):
        if line.strip().startswith('#') or line.strip().startswith('```') or line.strip().startswith('|') or 'http' in line:
            continue
        
        nums = MAGIC_NUMBER_PATTERN.findall(line)
        if nums:
            valid_nums = [n for n in nums if not (line.strip().startswith(n + '.') or line.strip().startswith(n + '、'))]
            if valid_nums and not VAR_PATTERN.search(line):
                 warnings.append(f"Line {i+1}: 发现魔法数字 {valid_nums}。建议变量化。")

def check_file(file_path):
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
    except Exception as e:
        print(f"{RED}[ERROR] 无法读取文件: {file_path}{RESET}")
        return False

    filename = os.path.basename(file_path)
    
    # === 判定检查等级 ===
    # Level 1: Project Core (宪法级) - 必须完美
    if "00_Project_Core" in file_path or "00_项目核心" in file_path:
        check_level = "STRICT"
        strict_mode = True
    # Level 2: GameSpec Standard (法律级) - 必须合规
    elif "gamespec/01_规范标准" in file_path:
        check_level = "STRICT"
        strict_mode = True
    # Level 3: User Space (民用级) - 宽容模式
    else:
        check_level = "LENIENT"
        strict_mode = False

    print(f"[{check_level}] 检查: {filename} ...", end="")
    
    errors = []
    warnings = []
    
    check_content_rules(content, errors, warnings, strict_mode)

    # 输出结果
    if errors:
        print(f"\n{RED}  [FAIL] 严重错误:{RESET}")
        for err in errors:
            print(f"    - {err}")
        return False
    elif warnings:
        print(f"{YELLOW} [PASS with WARN]{RESET}")
        # 仅在严格模式下显示所有警告，宽容模式下减少噪音
        if strict_mode or len(warnings) < 3:
            for warn in warnings:
                print(f"    - {warn}")
        else:
            print(f"    - (发现 {len(warnings)} 个潜在优化点，已折叠)")
        return True
    else:
        print(f"{GREEN} [PASS]{RESET}")
        return True

def main():
    target_dir = "."
    if len(sys.argv) > 1:
        target_dir = sys.argv[1]

    print(f"{YELLOW}=== GameSpec Linter v2.1 (分级检查模式) ==={RESET}")
    print(f"扫描目录: {target_dir}\n")

    failed_count = 0
    total_count = 0

    for root, _, files in os.walk(target_dir):
        # 永远跳过模板目录和工具目录
        if "02_项目模板" in root or "04_自动化工具" in root:
            continue
            
        for file in files:
            if file.endswith(".md"):
                total_count += 1
                path = os.path.join(root, file)
                if not check_file(path):
                    failed_count += 1

    print(f"\n{YELLOW}检查完成。总计: {total_count}, 失败: {failed_count}{RESET}")
    
    if failed_count > 0:
        sys.exit(1)

if __name__ == "__main__":
    main()
