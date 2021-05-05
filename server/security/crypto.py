from Crypto.Cipher import AES
import base64

BLOCK_SIZE = 16
key = b"1234567890123456"


def unpad(data):
    return data[:data[-1]].decode("utf-8")

def decrypt(encrypted, key):
    encrypted = base64.b64decode(encrypted)
    IV = encrypted[:BLOCK_SIZE]
    aes = AES.new(key, AES.MODE_CBC, IV)
    decrypted = aes.decrypt(encrypted[BLOCK_SIZE:])
    return unpad(decrypted)