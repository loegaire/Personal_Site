# Public key cryptography
#### High level overview:
* Computation overhead, not replacing symetric encryption
* Method: 
	* Each user generates **two** keys
	* Each user makes one of the two keys available
	* A: $f(B's PublicKey,data) \rightarrow cipherForB$
	* B: $f(B'sPrivateKey,cipherForB) \rightarrow data$
	
$\rightarrow$ <span style="color:3583f0">Only B can decrypt the messages intended for him</span>
$\rightarrow$ <span style="color:3583f0">Secure communication</span>
* If we instead use user A's private key to encrypt a plaintext, other users can only use A's public key to decrypt the message

<span style="color:3583f0">$\rightarrow$ The message could only be sent by A
$\rightarrow$ Digital Signature</span>
* Applications:
	* Encrypt/Decrypt
	* Key exchange
	* Signatures
* Requirements to use:
	Computationally:
	* Easy for receiver to generate key pair
	* Easy for sender to encrypt data
	* Easy for receiver to decrypt data
	* Hard for attacker to find the private key
	* Hard for attacker to find the plaintext
	* Two keys can be applied in either order
$\Rightarrow$ To satisfy these requirements, we need a special <span style="color:3bba1c">* one way  trap door function f*</span>, satisfying 
$Y=f(k,X)$ has $O(n^\alpha)$ complexity, constant $\alpha$
$X=f^{-1}(k,Y)$ has $O(n^\alpha)$ complexity if $k$ and $Y$ is known, otherwise undetermined complexity

