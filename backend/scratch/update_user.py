import sqlite3
import os

def update_db(db_path):
    if not os.path.exists(db_path):
        print(f"Database not found: {db_path}")
        return
    print(f"Connecting to database: {db_path}")
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Check if 'users' table exists
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='users'")
    if not cursor.fetchone():
        print(f"No 'users' table found in {db_path}")
        conn.close()
        return

    # Target email
    email = 'ansh988820@gmail.com'
    
    # Hash for 'Yowon@2026'
    new_hash = '$2b$12$jC2/xJGstzpu6YG27EfTxeb645p7.9cJDw5pQGrSB4cLJEewpQQ6e'
    
    # Execute update
    cursor.execute(
        "UPDATE users SET password_hash = ?, failed_login_attempts = 0, account_locked = 0, status = 'active' WHERE email = ?",
        (new_hash, email)
    )
    conn.commit()
    print(f"Update completed for {db_path}. Rows changed: {conn.total_changes}")
    
    # Verify the updated status
    cursor.execute("SELECT email, status, failed_login_attempts, account_locked FROM users WHERE email = ?", (email,))
    row = cursor.fetchone()
    print("Verification:", row)
    
    conn.close()

def main():
    update_db('yowon.db')
    update_db('sentinel.db')

if __name__ == '__main__':
    main()
