# Symmetric Cipher Model
* plaintext
* Encrypt algorithm
* Secret key
* Ciphertext
* Decryption algorithm
$\Rightarrow$ make an algorithm that, knowing many ciphertexts and many plaintexts and the algorithm used, still cant decrypt
#### Cryptography
what makes cryptographic systems different:
* Operations used: Substituting, Rearranging
* Number of keys used
* block or stream

#### Cryptanalysis and brute-force
* no algorithm is *unconditionally* secure(meaning cant attack even if all ciphertexts are avaiable) except one-time pad
* computationally secure meaning it takes too much effort to worth decrypting
* one-pad cipher: the most secure cipher - each message has its own key of equal length, computationally expensive