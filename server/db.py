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
        except KeyError as e:
            raise BadRequest(message=" Required attribute is missing.")
        
        if user_email in self.users:
            already_present_msg = " User with email: {} is already present".format(user_email)
            raise BadRequest(message=already_present_msg)

        self.users[user_email] = user_password

    
    def fetch_user_password(self, email):
        '''
        Check if user credentials given in post_body matches records in self.users
        '''
        if not email in self.users:
            raise KeyNotFound(message=" User with email: {} is not present".format(email))
        return self.users[email]        


