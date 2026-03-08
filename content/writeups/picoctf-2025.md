---
title: picoCTF 2025
summary: Writeup for the Tap into Hash 1 challenge and the XOR-based decryption path.
tags:
    - ctf
    - crypto
    - python
order: 2
---

# picoCTF 2025 writeup

## Tap into Hash 1

[https://play.picoctf.org/events/74/challenges/466?page=2](https://)

> Description
> Can you make sense of this source code file and write a function that will decode the given encrypted file content? Find the encrypted file [here](https://). It might be good to analyze source file to get the flag.

we are then given 2 files:
Image Not Showing
Possible Reasons

- The image file may be corrupted
- The server hosting the image is unavailable
- The image path is incorrect
- The image format is not supported

[Learn More →](https://hackmd.io/@docs/insert-image-in-team-note?utm_source=note&utm_medium=error-msg)

Let's start analyzing the source:

```
def main(token):
    key = bytes.fromhex(random_string)

    print("Key:", key)

    genesis_block = Block(0, "0", int(time.time()), "EncodedGenesisBlock", 0)
    blockchain = [genesis_block]

    for i in range(1, 5):
        encoded_transactions = base64.b64encode(
            f"Transaction_{i}".encode()).decode('utf-8')
        new_block = proof_of_work(blockchain[-1], encoded_transactions)
        blockchain.append(new_block)

    all_blocks = get_all_blocks(blockchain)

    blockchain_string = blockchain_to_string(all_blocks)
    encrypted_blockchain = encrypt(blockchain_string, token, key)

    print("Encrypted Blockchain:", encrypted_blockchain)
```

we can see it prints out a key, then generate 5 blocks, append them all together in a string, then calls `encrypt()` on it.
also notice that we input `token` into `encrypt()`, which is user input

```
if __name__ == "__main__":
    text = sys.argv[1]
    main(text)
```

Looking at `encrypt()`:

```
def encrypt(plaintext, inner_txt, key):
    midpoint = len(plaintext) // 2

    first_part = plaintext[:midpoint]
    second_part = plaintext[midpoint:]
    modified_plaintext = first_part + inner_txt + second_part
    block_size = 16
    plaintext = pad(modified_plaintext, block_size)
    key_hash = hashlib.sha256(key).digest()

    ciphertext = b''

    for i in range(0, len(plaintext), block_size):
        block = plaintext[i:i + block_size]
        cipher_block = xor_bytes(block, key_hash)
        ciphertext += cipher_block

    return ciphertext
```

It calculates the midpoint of the string, then splits the string into two halves, after that it appends them to the head and tail of `inner_txt`, which is user input.
Now we can see that `inner_txt` is probably the flag that we needed to find.
Next, it uses a block cipher, which XORs the 16 bytes blocks with `key_hash`, which is the printed key encrypted in sha256. The encrypted blocks is then printed out in main.
So now, in order to look at the decrypted contents of the blocks, we just need to reverse the XOR
First, since the program gave us the Key before it was encrypted in sha256, we need to encrypt the key:

```
hashlib.sha256(Key).digest()
```

Then, use the block cipher again on the key and output to get the decrypted block string
Final script in python:

```
import time
import base64
import hashlib
import sys
import secrets

Key = b'Z\xa3\xf6\xd4\xdb\x8a\x9c\x10\x84\xf8\xb6\xb0:\x1c\xce\xca\xbfX\x96\x9d\x87\tm\xd6\xbe4a\xc5\xd5\x91^\x98'
EncryptedBlockchain = b'o\xd3\xefR\xf9@\x01(\xebg\xf0\xed\xc5K\xcc\x87>\x83\xe8\x05\xaeB\x02)\xbe2\xa7\xe2\xc6\x19\x97\xd2h\xd9\xeaW\xfcF\x05+\xb20\xf4\xb7\x97N\x9f\xd5e\xd2\xeb\x02\xf9FVx\xeb`\xa2\xe4\xc7M\x9c\x85p\xd1\xe8P\xffOR.\xee5\xa6\xb6\x94\x18\x9e\x84i\xd6\xbaQ\xf9\x14\x00.\xee3\xa2\xe4\x93\x1c\x9a\x83h\x87\xea\x01\xf8FV"\xbbe\xa2\xb6\x93N\x9b\xd5l\xd4\xbaU\xa8\x17Z.\xbdb\xa6\xe5\xc7H\xcc\x8fk\xcc\xe8P\xa9C\x07(\xbd<\xf4\xe7\xc6\x18\x99\xd0;\x82\xe0\x01\xa8GQz\xeb6\xaf\xe5\xc7H\xca\x829\xd2\xa8\t\xa9\x19 O\xcc\x7f\xf4\xb9\x99\x1e\xc5\xe9n\xb2\x8a\x08\x9c\x1f1y\xde5\xe7\xb6\xae"\xf6\xe37\xac\xe8\x12\xfeO\x00S\xd5u\xd5\xaf\x9b7\xf4\xcc\x1f\xaa\x87T\xff\x15\x07)\xeb1\xa4\xa8\x92D\x9b\xd5k\x87\xebQ\xac\x17U,\xb93\xf2\xe4\x92I\x96\xd3l\x87\xbcQ\xa8DV*\xb3f\xf4\xb6\xdbM\x9e\x82e\xd6\xbcY\xfdNQ"\xbc4\xf3\xe4\xc4I\x97\x858\xd8\xbcQ\xabDZ+\xe83\xa7\xb7\xc2I\x9f\xd7d\x80\xee\x01\xafG\x07,\xbf7\xa3\xe6\x95\x1c\x99\xd7m\xd0\xb9Y\xacCU}\xece\xaf\xb3\x90P\x9e\x86n\x82\xbaQ\xae\x14W/\xec`\xf0\xe7\xc0N\x9a\x81m\xd6\xe8Y\xa8BU(\xbd6\xa1\xe1\xc1J\x97\x81j\x87\xbbV\xfeBW~\xbf3\xa6\xb6\xc2\x18\x97\xd0>\xd4\xeaU\xf8\x13\x01-\xeb2\xf2\xe5\xc5\x19\xac\xb4'

cipher_text = b''

def xor_bytes(a, b):
    return bytes(x ^ y for x, y in zip(a, b))
def rev_xor(cipher_text):
    for i in range(0, len(EncryptedBlockchain), 16):
        block = EncryptedBlockchain[i:i+16]
        cipher_blocks = xor_bytes(block, hashlib.sha256(Key).digest())
        cipher_text += cipher_blocks
    print(cipher_text)
rev_xor(cipher_text)
```

run `python3 rev.py`, we get the following output:

```
python3 rev.py
b'227236b3acf836b1cb0ed4a246170d9d582760f084bba31c833b305cad411023-0005915d10cbe0247b13bc5d741ea455f2a20591a4ce35c15b5ba957f0015b96-00c5d378b20e7ffc8ab12aa29015d4d3picoCTF{block_3SRhViRbT1qcX_XUjM0r49cH_qCzmJZzBK_45cd2a52}d95c6f31fa6737d1d48e1fd1b2519bbc-00487d9782960e12493e9d1a290b71b441a9a6ae1d75353ca7a01a9f56ffa9ff-003cb1db44fdf263470709b463727477977fc6444e570c4e9fc5252eb6a6d03d\x02\x02'
```

Theres our flag :D
**picoCTF{block\_3SRhViRbT1qcX\_XUjM0r49cH\_qCzmJZzBK\_45cd2a52}**
