import os
import re
import shutil

# Paths relative to git repo root
env_path = os.path.join("backend", ".env.example")

# 1. Clean backend/.env.example
if os.path.exists(env_path):
    try:
        with open(env_path, "r", encoding="utf-8", errors="ignore") as f:
            content = f.read()
        
        # Replace the target pattern
        new_content = re.sub(
            r"github_pat_[a-zA-Z0-9_]+",
            "your_github_token_here",
            content
        )
        
        if new_content != content:
            with open(env_path, "w", encoding="utf-8", newline="\n") as f:
                f.write(new_content)
            print(f"[REWRITE] Cleaned {env_path}")
    except Exception as e:
        print(f"[REWRITE] Error cleaning {env_path}: {e}")

# 2. Recursively find and sanitize Slack webhooks in all text files
slack_regex1 = re.compile(r"https://hooks\.slack\.com/services/T[A-Z0-9]{8}/B[A-Z0-9]{8}/[A-Za-z0-9]+")
slack_regex2 = re.compile(r"https://hooks\.slack\.com/services/T[a-zA-Z0-9_]+/B[a-zA-Z0-9_]+/[a-zA-Z0-9_]+")

for root, dirs, files in os.walk("."):
    # Skip git internal files
    if ".git" in root.split(os.sep):
        continue
    for file in files:
        file_path = os.path.join(root, file)
        # Skip binary files by extension
        if file.endswith((".png", ".jpg", ".jpeg", ".pdf", ".zip", ".mp4", ".exe", ".pyc", ".db", ".sqlite")):
            continue
        try:
            with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                content = f.read()
            
            # Check for slack webhooks
            if slack_regex1.search(content) or slack_regex2.search(content):
                new_content = slack_regex1.sub("https://hooks.slack.com/services/your/slack/webhook/url", content)
                new_content = slack_regex2.sub("https://hooks.slack.com/services/your/slack/webhook/url", new_content)
                with open(file_path, "w", encoding="utf-8", newline="\n") as f:
                    f.write(new_content)
                print(f"[REWRITE] Sanitized webhooks in {file_path}")
        except Exception as e:
            pass

# 3. Purge accidental large binary/legacy reference files from history
large_files_to_delete = ["HA Frontend.zip", "dribbble_shot.mp4"]
for f_name in large_files_to_delete:
    if os.path.exists(f_name):
        try:
            os.remove(f_name)
            print(f"[REWRITE] Deleted {f_name}")
        except Exception as e:
            print(f"[REWRITE] Error deleting {f_name}: {e}")

# 4. Purge legacy reference directory from history
dirs_to_delete = ["ha_frontend_ref", ".venv"]
for d_name in dirs_to_delete:
    if os.path.exists(d_name):
        try:
            shutil.rmtree(d_name)
            print(f"[REWRITE] Purged directory {d_name}")
        except Exception as e:
            print(f"[REWRITE] Error purging directory {d_name}: {e}")
