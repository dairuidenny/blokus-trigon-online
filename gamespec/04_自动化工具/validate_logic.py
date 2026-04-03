#!/usr/bin/env python3
import os
import re
import sys

# ==========================================
# GameSpec Logic Validator - 逻辑一致性验证工具
# ==========================================

# 1. 提取器：从文档中提取语义标签
# 格式: [Type: Value] 例如 [Aes: Tension], [Dyn: Inflation]
def extract_tags(content):
    # 匹配 [Key: Value] 或 [Key:Value]
    pattern = r"\[(Aes|Dyn|Mech|Experience|Loop|Rule):\s*([a-zA-Z0-9\-\_]+)\]"
    matches = re.findall(pattern, content)
    
    tags = {"Aes": [], "Dyn": [], "Mech": []}
    
    for category, value in matches:
        # 归一化 Key
        if category == "Experience": category = "Aes"
        if category == "Loop": category = "Dyn"
        if category == "Rule": category = "Mech"
        
        tags[category].append(value)
    
    return tags

# 2. 规则库：定义冲突与依赖
# 格式: (条件, 检查函数, 错误消息)
LOGIC_RULES = [
    # --- 体验 vs 动态 ---
    (
        lambda t: "Tension" in t["Aes"],
        lambda t: "LossAversion" in t["Dyn"] or "Scarcity" in t["Dyn"] or "TimeLimit" in t["Dyn"],
        "体验目标为 [Tension] (压抑/紧张)，但动态层缺少 [LossAversion] (损失厌恶) 或 [Scarcity] (稀缺) 支撑。"
    ),
    (
        lambda t: "Relaxation" in t["Aes"],
        lambda t: "TimeLimit" not in t["Dyn"] and "Permadeath" not in t["Dyn"],
        "体验目标为 [Relaxation] (放松)，但检测到 [TimeLimit] 或 [Permadeath]，存在严重冲突。"
    ),
    (
        lambda t: "Mastery" in t["Aes"],
        lambda t: "DifficultyCurve" in t["Dyn"] or "SkillCeiling" in t["Dyn"],
        "体验目标为 [Mastery] (精通)，但未声明 [DifficultyCurve] 或 [SkillCeiling]。"
    ),
    
    # --- 动态 vs 机制 ---
    (
        lambda t: "PositiveFeedback" in t["Dyn"], # 滚雪球
        lambda t: "CatchUp" in t["Mech"] or "DiminishingReturns" in t["Mech"],
        "设计了 [PositiveFeedback] (正反馈/滚雪球)，但未设计 [CatchUp] (追赶) 或 [DiminishingReturns] (边际递减) 机制，可能导致失衡。"
    ),
    (
        lambda t: "Competition" in t["Aes"], # 竞技
        lambda t: "RNG-Output" not in t["Mech"], # 输出随机
        "体验目标为 [Competition] (竞技)，严禁使用 [RNG-Output] (纯输出随机，如暴击) 决定胜负。"
    )
]

# 颜色代码
YELLOW = "\033[93m"
CYAN = "\033[96m"
RESET = "\033[0m"

def validate_file(file_path):
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
    except:
        return

    tags = extract_tags(content)
    
    # 如果没有提取到任何标签，跳过
    if not any(tags.values()):
        return

    print(f"正在分析逻辑: {file_path}")
    print(f"  识别标签: {tags}")
    
    issues_found = False
    
    for condition, check, message in LOGIC_RULES:
        # 如果满足前置条件 (例如确实是 Tension 体验)
        if condition(tags):
            # 执行检查 (例如检查是否有 Scarcity)
            if not check(tags):
                print(f"  {YELLOW}[RISK] 逻辑风险: {message}{RESET}")
                issues_found = True
                
    if not issues_found:
        print(f"  {CYAN}逻辑自洽。{RESET}")
    print("-" * 40)

def main(target_dir="gamespec"):
    # 如果通过命令行直接调用且有参数，覆盖默认值
    if len(sys.argv) > 1:
        target_dir = sys.argv[1]

    print(f"{CYAN}=== GameSpec Logic Validator ==={RESET}")
    print(f"扫描目录: {target_dir}\n")

    for root, _, files in os.walk(target_dir):
        for file in files:
            if file.endswith(".md"):
                path = os.path.join(root, file)
                validate_file(path)

if __name__ == "__main__":
    main()
