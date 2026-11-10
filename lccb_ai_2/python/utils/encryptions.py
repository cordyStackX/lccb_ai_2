import base64
import hashlib
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

def decrypt_text(payload: str, password: str) -> str:
    data = base64.b64decode(payload)

    salt = data[0:16]
    iv = data[16:28]
    auth_tag = data[28:44]
    ciphertext = data[44:]

    # Node's crypto.scryptSync defaults: N=16384, r=8, p=1, keylen=32
    key = hashlib.scrypt(
        password.encode("utf-8"),
        salt=salt,
        n=16384,
        r=8,
        p=1,
        dklen=32,
    )

    aesgcm = AESGCM(key)
    # Python's AESGCM expects ciphertext + tag concatenated
    plaintext = aesgcm.decrypt(iv, ciphertext + auth_tag, None)
    return plaintext.decode("utf-8")