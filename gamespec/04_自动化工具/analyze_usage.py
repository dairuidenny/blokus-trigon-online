import os
import json
import re

# 目标根目录
ROOT_DIR = "."  # 假设在项目根目录运行

def analyze_usage():
    stats = {
        "summary": {"files": 0, "magic_numbers": 0},
        "structure": {},
        "references": []
    }
    
    print("[*] Starting Workspace Analysis...")
    
    for root, dirs, files in os.walk(ROOT_DIR):
        # 忽略隐藏目录和工具目录本身
        if ".git" in root or ".mypy_cache" in root or "04_自动化工具" in root:
            continue
            
        for file in files:
            if file.endswith(".md"):
                file_path = os.path.join(root, file)
                rel_path = os.path.relpath(file_path, ROOT_DIR)
                
                stats["summary"]["files"] += 1
                
                # 简单的分类统计
                category = rel_path.split(os.sep)[0]
                stats["structure"][category] = stats["structure"].get(category, 0) + 1
                
                # 内容扫描
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                        
                    # 检查魔法数字 (简化版正则)
                    # 查找类似 "造成 100 点" 的结构
                    magic_matches = re.findall(r"造成\s*(\d+)\s*点", content)
                    if magic_matches:
                        stats["summary"]["magic_numbers"] += len(magic_matches)
                        
                    # 检查引用关系
                    links = re.findall(r"\]\((.*?)\)", content)
                    for link in links:
                        if not link.startswith("http"):
                            stats["references"].append({
                                "source": rel_path,
                                "target": link
                            })
                            
                except Exception as e:
                    print(f"Error reading {file_path}: {e}")

    # 输出结果
    output_path = os.path.join(ROOT_DIR, "bin/gamespec/04_自动化工具/analysis_report.json")
    try:
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(stats, f, indent=2, ensure_ascii=False)
        print(f"[Success] Report generated: {output_path}")
        print(f"Summary: {json.dumps(stats['summary'], indent=2)}")
    except Exception as e:
        print(f"[Error] Failed to write report: {e}")

if __name__ == "__main__":
    analyze_usage()
