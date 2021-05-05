import security.session as session
import security.crypto as crypto
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


# Represents a connection to MongoDB database
class DB:
    def __init__(self):
        self.mongo_uri = "mongodb+srv://user-2:L9B9VUyWb62vgxlS@learning-cluster.tpidq.mongodb.net/?retryWrites=true&w=majority"
        self.client = pymongo.MongoClient(self.mongo_uri).mashypass
    

    def validate_user_session(self, email, session_id):
        '''
        Checks that user is in the database, session_id is valid
        and has not expired
        '''
        user = self.client.users.find_one({'email' : email})
        if user == None:
            raise KeyNotFound(message=" User with email: {} is not present".format(email))

        if not user.get('session_id') == session_id.encode('utf-8'):
            raise BadRequest(message="Invalid session_id")
        
        if datetime.datetime.now() > user.get('session_id_expires'):
            raise BadRequest(message=" session_id has expired")
        
        return user


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
        {'$set' : {'logged_in' : True, 'session_id' : session_id, 
        'session_id_expires' : datetime.datetime.now() + datetime.timedelta(minutes=30)}})
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
        
        user = self.validate_user_session(email, session_id)
        
        user_vault = user.get('vault')
        user_vault.append({'url' : url, 'username' : username, 'password' : password})    
        self.client.users.update_one({'_id' : user.get('_id')}, 
        {'$set' : {'vault' : user_vault}})
    

    def fetch_vault_entry(self, email, url, session_id):
        '''
        Fetch a vault entry from the user's vault
        '''
        user = self.validate_user_session(email, session_id)

        user_vault = user.get('vault')
        for vault_entry in user_vault:
            if vault_entry.get('url') == url:
                return vault_entry

        raise KeyNotFound(message=" Vault with url: {} is not present".format(url))


    def update_vault_entry(self, email, session_id, put_body):
        '''
        Update an existing entry in the user's vault
        '''
        try:
            url = put_body['url']
            username = put_body['username']
            password = put_body['password']
        except KeyError:
            raise BadRequest(message="Required attributes are missing")

        user = self.validate_user_session(email, session_id)

        user_vault = user.get('vault')
        for vault_entry in user_vault:
            if vault_entry.get('url') == url:
                vault_entry['username'] = username
                vault_entry['password'] = password
                self.client.users.update_one({'_id' : user.get('_id')}, 
                {'$set' : {'vault' : user_vault}})
                return

        raise KeyNotFound(message=" Vault with url: {} is not present".format(url))
        

    def delete_vault_entry(self, email, url, session_id):
        '''
        Deletes an existing entry from the user's vault
        '''
        user = self.validate_user_session(email, session_id)
        
        user_vault = user.get('vault')
        for vault_entry in user_vault:
            if vault_entry.get('url') == url:
                user_vault.remove(vault_entry)
                self.client.users.update_one({'_id' : user.get('_id')}, 
                {'$set' : {'vault' : user_vault}})
                return
        
        raise KeyNotFound(message=" Vault with url: {} is not present".format(url))
    

    def get_resuse_statistics(self, email, session_id):
        '''
        Find the number of passwords user is reusing, the number of websites on 
        which they are used, and the names of all websites on which they are used
        '''
        user = self.validate_user_session(email, session_id)

        user_vault = user.get('vault')
        password_frequencies = {}
        for vault_entry in user_vault:
            pswd = crypto.unpad(crypto.decrypt(vault_entry.get('password'), b"1234567890123456"))
            if pswd not in password_frequencies:
                password_frequencies[pswd] = (1, [vault_entry.get('url')])
            else:
                print(password_frequencies[pswd])
                (times_used, hostnames) = password_frequencies[pswd]
                hostnames.append(vault_entry.get('url'))
                password_frequencies[pswd] = (times_used + 1, hostnames)

        num_reused = 0
        hostname_list = []
        for key in password_frequencies:
            (times_used, hostnames) = password_frequencies[key]
            if times_used > 1:
                num_reused += 1
                hostname_list += hostnames

        return {'num_reused' : num_reused, 'num_sites' : len(hostname_list), 
                'websites' : hostname_list}    









        
        



        








