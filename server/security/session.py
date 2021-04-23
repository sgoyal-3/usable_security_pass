import secrets
import os
import base64
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC


def generate_session_id(password):
    '''
    Generates a unique sessionid for the user
    '''
    salt = os.urandom(16)
    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32,
        salt=salt,
        iterations=100000)
    session_id = base64.urlsafe_b64encode(kdf.derive(password))
    return session_id


def generate_secret_key(master_password):
    '''
    Generate a user's secret key that we will use to encrypt their vault 
    '''
    pass

