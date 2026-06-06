import os
import subprocess
import re
import shutil

def run_git(args, env=None):
    result = subprocess.run(["git"] + args, capture_output=True, text=True, env=env)
    if result.returncode != 0:
        raise Exception(f"Git command failed: git {' '.join(args)}\nError: {result.stderr}")
    return result.stdout.strip()

def clean_working_tree():
    # Sanitize backend/.env.example
    env_path = os.path.join("backend", ".env.example")
    if os.path.exists(env_path):
        with open(env_path, "r", encoding="utf-8", errors="ignore") as f:
            content = f.read()
        new_content = re.sub(r"github_pat_[a-zA-Z0-9_]+", "your_github_token_here", content)
        if new_content != content:
            with open(env_path, "w", encoding="utf-8", newline="\n") as f:
                f.write(new_content)

    # Sanitize Slack webhooks in all text files
    slack_regex1 = re.compile(r"https://hooks\.slack\.com/services/T[A-Z0-9]{8}/B[A-Z0-9]{8}/[A-Za-z0-9]+")
    slack_regex2 = re.compile(r"https://hooks\.slack\.com/services/T[a-zA-Z0-9_]+/B[a-zA-Z0-9_]+/[a-zA-Z0-9_]+")
    
    for root, dirs, files in os.walk("."):
        if ".git" in root.split(os.sep):
            continue
        for file in files:
            file_path = os.path.join(root, file)
            if file.endswith((".png", ".jpg", ".jpeg", ".pdf", ".zip", ".mp4", ".exe", ".pyc", ".db", ".sqlite")):
                continue
            try:
                with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                    content = f.read()
                if slack_regex1.search(content) or slack_regex2.search(content):
                    new_content = slack_regex1.sub("https://hooks.slack.com/services/your/slack/webhook/url", content)
                    new_content = slack_regex2.sub("https://hooks.slack.com/services/your/slack/webhook/url", new_content)
                    with open(file_path, "w", encoding="utf-8", newline="\n") as f:
                        f.write(new_content)
            except:
                pass

    # Purge accidental files
    for f_name in ["HA Frontend.zip", "dribbble_shot.mp4"]:
        if os.path.exists(f_name):
            os.remove(f_name)

    # Purge legacy directories
    for d_name in ["ha_frontend_ref", ".venv"]:
        if os.path.exists(d_name):
            shutil.rmtree(d_name, ignore_errors=True)

def main():
    print("[START] Git History Rewrite using plumbing commit-tree...")
    
    # 1. Get all commits in reverse order (oldest to newest)
    commits = run_git(["rev-list", "--reverse", "HEAD"]).splitlines()
    if not commits:
        print("No commits found.")
        return

    # Map of old commit hash -> new commit hash
    commit_map = {}
    
    # Track the original branch tip so we can rollback if needed
    original_tip = run_git(["rev-parse", "HEAD"])
    
    # Backup refs
    run_git(["update-ref", "refs/original/heads/main", original_tip])
    
    parent_map = {}

    for idx, commit in enumerate(commits):
        print(f"Processing commit {idx+1}/{len(commits)}: {commit[:8]}")
        
        # Checkout the commit contents
        run_git(["checkout", "--detach", commit])
        
        # Apply cleaning script on this checkout tree
        clean_working_tree()
        
        # Add all modifications to git index
        run_git(["add", "-A"])
        
        # Write current index as tree object and get the hash
        tree_hash = run_git(["write-tree"])
        
        # Get metadata from the original commit
        author_name = run_git(["log", "-1", "--format=%an", commit])
        author_email = run_git(["log", "-1", "--format=%ae", commit])
        author_date = run_git(["log", "-1", "--format=%ad", commit])
        committer_name = run_git(["log", "-1", "--format=%cn", commit])
        committer_email = run_git(["log", "-1", "--format=%ce", commit])
        committer_date = run_git(["log", "-1", "--format=%cd", commit])
        commit_msg = run_git(["log", "-1", "--format=%B", commit])
        
        # Find new parent commit hashes
        orig_parents = run_git(["log", "-1", "--format=%P", commit]).split()
        new_parents = []
        for p in orig_parents:
            if p in commit_map:
                new_parents.append(commit_map[p])
        
        # Construct commit-tree command
        args = ["commit-tree", tree_hash]
        for np in new_parents:
            args += ["-p", np]
        
        # Set environment variables for dates and authors
        env = os.environ.copy()
        env["GIT_AUTHOR_NAME"] = author_name
        env["GIT_AUTHOR_EMAIL"] = author_email
        env["GIT_AUTHOR_DATE"] = author_date
        env["GIT_COMMITTER_NAME"] = committer_name
        env["GIT_COMMITTER_EMAIL"] = committer_email
        env["GIT_COMMITTER_DATE"] = committer_date
        
        # Create commit object using plumbing command
        result = subprocess.run(
            ["git"] + args,
            input=commit_msg,
            capture_output=True,
            text=True,
            env=env
        )
        if result.returncode != 0:
            raise Exception(f"commit-tree failed: {result.stderr}")
        
        new_commit_sha = result.stdout.strip()
        commit_map[commit] = new_commit_sha

    # 4. Point the main branch to the rewritten head commit
    new_tip = commit_map[commits[-1]]
    run_git(["checkout", "main"])
    run_git(["reset", "--hard", new_tip])
    print(f"[SUCCESS] Git history rewritten successfully. New tip: {new_tip[:8]}")

if __name__ == "__main__":
    main()
