import security.session as session
import base64
import datetime


# helper function that converts query result to json, after cursor has executed query
def to_json(cursor):
    results = cursor.fetchall()
    headers = [d[0] for d in cursor.description]
    return [dict(zip(headers, row)) for row in results]


# Error class for when a key is not found
class KeyNotFound(Exception):
    def __init__(self, message=None):
        Exception.__init__(self)
        if message:
            self.message = message
        else:
            self.message = "Key/Id not found"

    def to_dict(self):
        rv = dict()
        rv['message'] = self.message
        return rv


# Error class for when request data is bad
class BadRequest(Exception):
    def __init__(self, message=None, error_code=400):
        Exception.__init__(self)
        if message:
            self.message = message
        else:
            self.message = "Bad Request"
        self.error_code = error_code

    def to_dict(self):
        rv = dict()
        rv['message'] = self.message
        return rv


class VaultEntry:

    def __init__(self, url, username, password):
        self.url = url
        self.username = username
        self.password = password
    
    def update(self, new_url=None, new_username=None, new_password=None):
        if new_url is not None:
            self.url = new_url
        if new_username is not None:
            self.username = new_username
        if new_password is not None:
            self.password = new_password
    
    def to_dict(self):
        return {"url" : self.url, "username" : self.username, "password" : self.password}


# Defines a user entity
class User:

    def __init__(self, email, password):
        self.email = email
        self.password = password
        self.vault = {}
        self.registered = True
        self.logged_in = False
        self.session_id = None
        self.session_expires = None
    
    def log_in(self):
        self.logged_in = True
    
    def set_session_id(self, session_id):
        self.session_id = session_id
        self.session_expires = datetime.datetime.now() + datetime.timedelta(minutes = 30)


# Stand-in local database that we will use until we integrate MySQL
class DB:
    def __init__(self):
        self.users = {} # Holds all user data, indexed by user's email
        self.user_vaults = {} # Holds all user vault data, indexed by user's email
    
    def add_user(self, post_body):
        '''
        Add a new email and password to the database
        '''
        try:
            user_email = post_body["email"]
            user_password = post_body["password"]
        except KeyError:
            raise BadRequest(message=" Required attribute is missing.")
        
        if user_email in self.users:
            already_present_msg = " User with email: {} is already present".format(user_email)
            raise BadRequest(message=already_present_msg)

        self.users[user_email] = User(user_email, user_password)

    
    def fetch_user_password(self, email):
        '''
        Check if user credentials given in post_body matches records in self.users
        '''
        if not email in self.users:
            raise KeyNotFound(message=" User with email: {} is not present".format(email))
        
        password = self.users[email].password
        return password
    

    def login_user(self, email, token):
        '''
        Login the user whose email is equal to email and generate
        a session-id for the user
        '''
        if not email in self.users:
            raise KeyNotFound(message=" User with email: {} is not present".format(email))
        
        if not token == "oPB6jRIlzTSqO9J4MgY3":
            raise BadRequest(message=" Invalid token")

        self.users[email].log_in()
        session_id = session.generate_session_id(self.users[email].password.encode('utf-8'))
        self.users[email].set_session_id(session_id)
        return session_id
    

    def add_vault_entry(self, email, session_id, post_body):
        '''
        Add a new entry to a user's vault
        '''
        if not email in self.users:
            raise KeyNotFound(message=" User with email: {} is not present".format(email))
        
        try:
            url = post_body['url']
            username = post_body['username']
            password = post_body['password']
        except KeyError:
            raise BadRequest(message="Required attributes are missing")
        
        user = self.users[email]
        encoded = session_id.encode('utf-8')
        if not user.session_id == encoded:
            raise BadRequest(message="Invalid session_id: received {}, expected {}".format(encoded, user.session_id))
        
        
        self.users[email].vault[url] = VaultEntry(url, username, password)
    

    def fetch_vault_entry(self, email, url, session_id):
        '''
        Fetch a vault entry from the user's vault
        '''
        if not email in self.users:
            raise KeyNotFound(message=" User with email: {} is not present".format(email))
        user = self.users[email]

        if not url in self.users[email].vault:
            raise KeyNotFound(message=" Vault with url: {} is not present".format(url))
        
        if not session_id.encode('utf-8') == user.session_id:
            raise BadRequest(message=" Invalid session_id") 


        return self.users[email].vault[url].to_dict()
        








