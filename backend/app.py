import os
import base64
import jwt
from datetime import datetime, timezone, timedelta
from dotenv import load_dotenv
from flask import Flask, request, jsonify
from flask_cors import CORS
import bcrypt

# Try importing psycopg2, set fallback flag if not installed
try:
    import psycopg2
    HAS_PSYCOPG2 = True
except ImportError:
    print("[WARNING] psycopg2 is not installed. PostgreSQL integration disabled. Running in fallback memory mode.")
    HAS_PSYCOPG2 = False

# Load env variables from .env
load_dotenv()

app = Flask(__name__)
# Enable CORS to allow requests from frontend (usually http://localhost:5173)
CORS(app)

ENCRYPTION_KEY = 'SDLC-AUTH-KEY-2026-SECURE-V1'
JWT_SECRET = os.getenv('JWT_SECRET_KEY', 'sdlc_jwt_key')

# Decrypt incoming password that has been XORed and base64-encoded on client side
def decrypt_data(encrypted_data):
    try:
        decoded = base64.b64decode(encrypted_data).decode('latin-1')
        decrypted = ''.join(
            chr(ord(char) ^ ord(ENCRYPTION_KEY[i % len(ENCRYPTION_KEY)]))
            for i, char in enumerate(decoded)
        )
        return decrypted
    except Exception as e:
        print(f"[DECRYPTION ERROR] Failed to decrypt data: {e}")
        # Return raw value as fallback if it's already decrypted
        return encrypted_data

# DB Connection helper
def get_db_connection():
    if not HAS_PSYCOPG2:
        raise RuntimeError("psycopg2 is not installed")
    return psycopg2.connect(
        dbname=os.getenv('DB_NAME', 'att_db'),
        user=os.getenv('DB_USER_NAME', 'postgres'),
        password=os.getenv('DOC_DB_PASSWORD', 'postgres'),
        host=os.getenv('DB_HOSTNAME', 'localhost'),
        port=os.getenv('DB_PORT', '5432')
    )

def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))
    except Exception:
        return False

# Fallback memory database for smooth out-of-the-box local testing
FALLBACK_USERS = [
    {
        'uid': 'super-admin',
        'email': 'superadmin@att.com',
        'pw': 'admin123',
        'password': hash_password('admin123'),
        'role': 'super_admin',
        'name': 'Super Admin',
        'created': '2026-01-01',
        'first_name': 'Super',
        'last_name': 'Admin'
    },
    {
        'uid': 'admin-001',
        'email': 'admin@att.com',
        'pw': 'admin123',
        'password': hash_password('admin123'),
        'role': 'tenant_admin',
        'name': 'Tenant Administrator',
        'created': '2026-01-04',
        'first_name': 'Tenant',
        'last_name': 'Administrator'
    },
    {
        'uid': 'vg-0210',
        'email': 'varsha.g@att.com',
        'pw': 'manager123',
        'password': hash_password('manager123'),
        'role': 'manager',
        'name': 'Varsha Gaikwad',
        'created': '2026-02-11',
        'first_name': 'Varsha',
        'last_name': 'Gaikwad'
    },
    {
        'uid': 'cs-1187',
        'email': 'chetan.s@att.com',
        'pw': 'manager123',
        'password': hash_password('manager123'),
        'role': 'manager',
        'name': 'Chetan Sethi',
        'created': '2026-02-11',
        'first_name': 'Chetan',
        'last_name': 'Sethi'
    },
    {
        'uid': 'aps-0142',
        'email': 'aayushman@att.com',
        'pw': 'demo123',
        'password': hash_password('demo123'),
        'role': 'user',
        'name': 'Aayushman Pratap Singh',
        'created': '2026-03-02',
        'first_name': 'Aayushman',
        'last_name': 'Pratap Singh'
    }
]

def query_user_from_db(username):
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        # Exact PostgreSQL query from New Project (mgmt-twb) specification
        query = """
        SELECT um.user_name, um.email, um.password, tm.id, tm.tenant_url,
        array_agg(rm.role_name), um.first_name, um.last_name
        FROM user_master_2 um
        JOIN relations r ON um.id = r.user_id
        JOIN tenant_master tm ON r.tenant_id = tm.id
        JOIN role_master_2 rm ON r.role_id = rm.id
        WHERE um.user_name = %s
        GROUP BY um.id, tm.id, um.user_name, um.email, um.password, um.first_name, 
        um.last_name
        """
        cur.execute(query, (username,))
        row = cur.fetchone()
        
        cur.close()
        conn.close()
        
        if row:
            return {
                'user_name': row[0],
                'email': row[1],
                'password': row[2],
                'tenant_id': row[3],
                'tenant_url': row[4],
                'roles': row[5],
                'first_name': row[6],
                'last_name': row[7]
            }
        return None
    except Exception as e:
        print(f"[DB LOG] PostgreSQL Connection/Query failed: {e}")
        print("[DB LOG] Falling back to memory database simulation.")
        # If DB connection failed, check fallback local list
        match = next((u for u in FALLBACK_USERS if u['uid'] == username), None)
        if match:
            return {
                'user_name': match['uid'],
                'email': match['email'],
                'password': match['password'],
                'tenant_id': 1,
                'tenant_url': 'att-tenant-alpha.att.com',
                'roles': [match['role']],
                'first_name': match['first_name'],
                'last_name': match['last_name']
            }
        return None

# Login API Endpoint handling login requests
@app.route('/api/v1/login', methods=['POST'])
@app.route('/twb_ml/auth/login', methods=['POST'])
def login():
    print("[LOGIN] Endpoint called")
    
    data = request.get_json() or {}
    username = data.get('username')
    encrypted_password = data.get('password')
    
    if not username or not encrypted_password:
        return jsonify({"message": "Invalid username or password"}), 401

    # 1. Decrypt credentials if encrypted
    password = decrypt_data(encrypted_password)

    # 2. Query Database
    user_record = query_user_from_db(username)
    if not user_record:
        print(f"[LOGIN ERROR] User '{username}' not found")
        return jsonify({"message": "Invalid username or password"}), 401

    print("[LOGIN] User found")

    # 3. Verify Password Hash using verify_password
    hashed_password = user_record['password']
    if not verify_password(password, hashed_password):
        print("[LOGIN ERROR] Password verification failed")
        return jsonify({"message": "Invalid username or password"}), 401

    print("[LOGIN] Password verified")

    # 4. Generate JWT Token
    # Matching exact token_data dictionary payload structure from mgmt-twb specs
    token_data = {
        'iat': datetime.now(timezone.utc),
        'exp': datetime.now(timezone.utc) + timedelta(minutes=30),
        'username': user_record['user_name'],
        'email': user_record['email'],
        'tenant_id': user_record['tenant_id'],
        'tenant_url': user_record['tenant_url'],
        'roles': user_record['roles'],
        'first_name': user_record['first_name'],
        'last_name': user_record['last_name']
    }

    # Encode JWT using PyJWT
    encoded_jwt = jwt.encode(
        token_data,
        JWT_SECRET,
        algorithm='HS256'
    )
    
    print("[LOGIN] JWT created")
    print("[LOGIN] Login successful")

    # Response format: Access token + metadata
    return jsonify({
        "access_token": encoded_jwt,
        "metadata": {
            "uid": user_record['user_name'],
            "name": f"{user_record['first_name']} {user_record['last_name']}",
            "role": user_record['roles'][0] if user_record['roles'] else 'user',
            "email": user_record['email'],
            "tenant_url": user_record['tenant_url']
        }
    }), 200

# User Management APIs (GET /api/v1/users, POST /api/v1/users, DELETE /api/v1/users/<uid>)
@app.route('/api/v1/users', methods=['GET'])
def get_users():
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        query = """
        SELECT um.user_name, um.first_name, um.last_name, rm.role_name, um.email, um.created
        FROM user_master_2 um
        JOIN relations r ON um.id = r.user_id
        JOIN role_master_2 rm ON r.role_id = rm.id
        ORDER BY um.id ASC
        """
        cur.execute(query)
        rows = cur.fetchall()
        cur.close()
        conn.close()
        
        users_list = []
        for row in rows:
            users_list.append({
                'uid': row[0],
                'name': f"{row[1]} {row[2]}" if row[2] else row[1],
                'role': row[3],
                'email': row[4],
                'created': str(row[5]) if row[5] else ''
            })
        return jsonify(users_list), 200
    except Exception as e:
        print(f"[API WARNING] Database fetch users failed: {e}. Returning fallback users.")
        # Return fallback users list clean of sensitive variables (like hashed password)
        clean_fallback = [{
            'uid': u['uid'],
            'name': u['name'],
            'role': u['role'],
            'email': u['email'],
            'created': u['created']
        } for u in FALLBACK_USERS]
        return jsonify(clean_fallback), 200

@app.route('/api/v1/users', methods=['POST'])
def create_user():
    data = request.get_json() or {}
    uid = data.get('uid')
    name = data.get('name', '')
    role = data.get('role', 'user')
    pw = data.get('pw', 'demo123')
    
    if not uid or not name:
        return jsonify({"message": "User ID and Name are required"}), 400
        
    # Split name into first and last name
    name_parts = name.split(' ', 1)
    first_name = name_parts[0]
    last_name = name_parts[1] if len(name_parts) > 1 else ''
    email = f"{uid}@att.com"
    hashed_pw = hash_password(pw)
    
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        # Check if username exists
        cur.execute("SELECT 1 FROM user_master_2 WHERE user_name = %s", (uid,))
        if cur.fetchone():
            cur.close()
            conn.close()
            return jsonify({"message": "User ID already exists"}), 409
            
        # Get default tenant id
        cur.execute("SELECT id FROM tenant_master LIMIT 1")
        tenant_row = cur.fetchone()
        tenant_id = tenant_row[0] if tenant_row else 1
        
        # Get role id
        cur.execute("SELECT id FROM role_master_2 WHERE role_name = %s", (role,))
        role_row = cur.fetchone()
        role_id = role_row[0] if role_row else 4 # user role default id
        
        # Insert user
        cur.execute("""
            INSERT INTO user_master_2 (user_name, email, password, first_name, last_name)
            VALUES (%s, %s, %s, %s, %s) RETURNING id
        """, (uid, email, hashed_pw, first_name, last_name))
        user_id = cur.fetchone()[0]
        
        # Insert relation
        cur.execute("""
            INSERT INTO relations (user_id, tenant_id, role_id)
            VALUES (%s, %s, %s)
        """, (user_id, tenant_id, role_id))
        
        conn.commit()
        cur.close()
        conn.close()
        
        return jsonify({"message": "User created successfully"}), 201
    except Exception as e:
        print(f"[API WARNING] Database create user failed: {e}. Saving to fallback list.")
        # Check fallback user duplication
        if any(u['uid'] == uid for u in FALLBACK_USERS):
            return jsonify({"message": "User ID already exists"}), 409
            
        new_fallback_user = {
            'uid': uid,
            'email': email,
            'pw': pw,
            'password': hashed_pw,
            'role': role,
            'name': name,
            'created': datetime.now().strftime('%Y-%m-%d'),
            'first_name': first_name,
            'last_name': last_name
        }
        FALLBACK_USERS.append(new_fallback_user)
        return jsonify({"message": "User created successfully (In-Memory Fallback)"}), 201

@app.route('/api/v1/users/<uid>', methods=['DELETE'])
def delete_user(uid):
    # Guard: Block deleting Super Admin username 'super-admin'
    if uid == 'super-admin':
        return jsonify({"message": "Access denied — Cannot revoke Super Admin"}), 403

    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        # Guard: Check target user's role in DB
        cur.execute("""
            SELECT rm.role_name FROM user_master_2 um
            JOIN relations r ON um.id = r.user_id
            JOIN role_master_2 rm ON r.role_id = rm.id
            WHERE um.user_name = %s
        """, (uid,))
        role_row = cur.fetchone()
        if role_row and role_row[0] == 'super_admin':
            cur.close()
            conn.close()
            return jsonify({"message": "Access denied — Cannot revoke Super Admin"}), 403
            
        # Delete user (will cascade delete relations)
        cur.execute("DELETE FROM user_master_2 WHERE user_name = %s RETURNING id", (uid,))
        deleted = cur.fetchone()
        conn.commit()
        cur.close()
        conn.close()
        
        if not deleted:
            return jsonify({"message": "User not found"}), 404
            
        return jsonify({"message": "User revoked successfully"}), 200
    except Exception as e:
        print(f"[API WARNING] Database delete user failed: {e}. Removing from fallback list.")
        global FALLBACK_USERS
        
        # Guard: check fallback role
        target = next((u for u in FALLBACK_USERS if u['uid'] == uid), None)
        if target and target['role'] == 'super_admin':
            return jsonify({"message": "Access denied — Cannot revoke Super Admin"}), 403

        initial_len = len(FALLBACK_USERS)
        FALLBACK_USERS = [u for u in FALLBACK_USERS if u['uid'] != uid]
        if len(FALLBACK_USERS) == initial_len:
            return jsonify({"message": "User not found"}), 404
        return jsonify({"message": "User revoked successfully (In-Memory Fallback)"}), 200

if __name__ == '__main__':
    # Start on port 5001 as specified in verification instructions
    print("Starting Flask Auth Server on port 5001...")
    app.run(host='0.0.0.0', port=5001, debug=True)
