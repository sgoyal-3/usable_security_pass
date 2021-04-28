import security.session as session
import base64
import datetime
import pymongo


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
        self.mongo_uri = "mongodb+srv://user-2:L9B9VUyWb62vgxlS@learning-cluster.tpidq.mongodb.net/?retryWrites=true&w=majority"
        self.client = pymongo.MongoClient(self.mongo_uri).mashypass
    
    def add_user(self, post_body):
        '''
        Add a new email and password to the database
        '''
        try:
            user_email = post_body["email"]
            user_password = post_body["password"]
        except KeyError:
            raise BadRequest(message=" Required attribute is missing.")
        
        if not self.client.users.find_one({'email' : user_email}) == None:
            raise BadRequest(message=" User with email: {} is already present".format(user_email))

        self.client.users.insert_one({
            "email" : user_email,
            "password" : user_password,
            "registered" : True,
            "logged_in" : False,
            "session_id" : None,
            "session_id_expires" : None,
            "vault" : []
        })

    
    def fetch_user_password(self, email):
        '''
        Check if user credentials given in post_body matches records in self.users
        '''
        user = self.client.users.find_one({'email' : email})
        if user == None:
            raise KeyNotFound(message=" User with email: {} is not present".format(email))
    
        return user["password"]
    

    def login_user(self, email, token):
        '''
        Login the user whose email is equal to email and generate
        a session-id for the user
        ''' 
        if not token == "oPB6jRIlzTSqO9J4MgY3":
            raise BadRequest(message=" Invalid token")

        user = self.client.users.find_one({'email' : email})
        if user == None:
            raise KeyNotFound(message=" User with email: {} is not present".format(email))

        session_id = session.generate_session_id(user["password"].encode('utf-8'))
        self.client.users.update_one({'_id' : user.get('_id')}, 
        {'$set' : {'logged_in' : True, 'session_id' : session_id}})
        return session_id
    

    def add_vault_entry(self, email, session_id, post_body):
        '''
        Add a new entry to a user's vault
        ''' 
        try:
            url = post_body['url']
            username = post_body['username']
            password = post_body['password']
        except KeyError:
            raise BadRequest(message="Required attributes are missing")
        
        user = self.client.users.find_one({'email' : email})
        if user == None:
            raise KeyNotFound(message=" User with email: {} is not present".format(email))

        if not user.get('session_id') == session_id.encode('utf-8'):
            raise BadRequest(message="Invalid session_id")
        
        user_vault = user.get('vault')
        user_vault.append({'url' : url, 'username' : username, 'password' : password})    
        self.client.users.update_one({'_id' : user.get('_id')}, 
        {'$set' : {'vault' : user_vault}})
    

    def fetch_vault_entry(self, email, url, session_id):
        '''
        Fetch a vault entry from the user's vault
        '''
        user = self.client.users.find_one({'email':email})
        if user == None:
            raise KeyNotFound(message=" User with email: {} is not present".format(email))

        if not session_id.encode('utf-8') == user.get('session_id'):
            raise BadRequest(message=" Invalid session_id") 

        user_vault = user.get('vault')
        for vault_entry in user_vault:
            if vault_entry.get('url') == url:
                return vault_entry

        raise KeyNotFound(message=" Vault with url: {} is not present".format(url))  

        








