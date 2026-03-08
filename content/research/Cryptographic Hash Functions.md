# Cryptographic Hash Functions

* Hash function:$$f(data) = hash$$ where $hash$ is constant size, and should look random.
* A Cryptographic Hash function is a function that is hard to find collisions and to trace back the data that gave the known hash 
#### Applications
* **Message authentication**: 
	* Ensuring that messages werent altered (if altered, the hash will be different)
	* Send message + hash at the same time
	* Send message then send hash
	* Message + hash is encrypted for confidentiality 
	* MAC: the most used message authentication:
		* $$MAC(key,data) = hash$$
		Because of the need for a key, an attacker cant just alter the message and the key to trick the receiver, since they would also need to know the key in order to calculate the hash for the altered message
* **Digital signatures:** 
	This is touched on by the public key cryptography chapter. A sender can encrypt data and hash with their private key, and any receivers can only use his public key to decrypt, ensuring both the data's  
* **One-way password:** The hash of the password is stored rather than the contents. When user type in password, its hash is calculated and compared to the pre-defined password hash. Thus, an attacker cant retrieve the actual password from his target.
* **Virus detection:** A program's hash is calculated and compared to a database of known virus hashes
* **Intrusion detection:** Every program's hash is calculated and compared to avoid tampering
* **Pseudorandom:** Hash functions can be used to generate random numbers
#### Simple analysis 
* Define a simple hash function: $$C_i = b_{i1} \oplus b_{i2} \oplus ... \oplus b_{im}$$ where:
			$C_i$ - i-th bit of the hash
			$m$ - number of blocks 
			$i$ - i-th bit of each blocks 
* This hash works well for random data because each hash will be equally likely
* The chance for hash collision is $\frac{1}{2^n}$ on random data, more for regular language
* We can improve by perform a left shift on to the hash, then xor the hash with the current data block
> <span style="color:3bba1c"> Question: Does this require that the hash lenght be equal to the block length?
</span>
* The second procedure makes for a more random hash, but its security is worse. Because it's trivial to produce the desired hash: prepare a new message, calculate its hash normally, then append a final block that xors with the new messages's hash to form the original message's hash. 
* given a message $$M = X_1 X_2... X_n$$ where $X_i$ is a $n$-length block of data we define the hash code as the xor of all blocks $$h=H(M)=X_1 \oplus x_2 \oplus x_3 \oplus...\oplus x_n.$$ 
	define $h = x_{n+1}$, then encrypt the entire message by CBC mode:$$X_1 = IV \oplus D(K,Y_1)$$ $$X_i = Y_{i-1} \oplus D(K,Y_i)$$ $$X_{n+1} = Y_{n} \oplus D(K,Y_{n+1})=h$$ but since $$h=x_1 \oplus X_2 \oplus X_3 \oplus...\oplus X_n$$ and the xor operation is commutative, we can permute $X_i$ - which means also permuting the cipher block $Y_{i-1} \oplus D(K,Y_i)$ and still getting the same hash
#### Requirements and Security
* A collision: $H(x) = H(y)$ for $x \neq  y$
* Preimage:  $x$, for $h=H(x)$
* Requirements:
	* Variable input size
	* Constant  output  size
	* Efficient
	* For a given $h=H(x)$, $H(y)=H(x)$ is hard to find
	* For a given $h$, $H(y)=h$ is hard to find
	* A pair $(x,y)$ such that $H(x)=H(y)$ is hard to find
	* $H(x)$ is pseudorandom
* Brute-force attacks:
	* Preimage attacks:
		* For a given hash $h$, the attacker wants to find $y$ such that $H(y)=h$. This is done by trying random values of $y$ until collision occurs. For an $n$-bit hash, the average number of attempts is $2^{n-1}$
	* Collision attacks:
		* The attacker wants to find a pair of $(x,y)$ such that $H(x)=H(y)$. This process is easier because of the birthday paradox: if a random value in the range $0$ to $N-1$ is chosen, the chance of choosing the same value is $>0.5$ after $\sqrt{N}$ choices.
		* Example attack:
			1. The sender is prepared to append the hash $h=H(x)$ and encrypt it with their private key
			2. The attacker generates $2^{m/2}$ variations of $x'$, stores $x'$ and $h_x = H(x')$
			3. The attacker writes a message $y$ that needs to be signed by the sender
			4. Makes variations $y'$ of $y$, calculate $h_y = H(y')$, checks for $H(x')=H(y')$ until it's true. 
			5. The opponent sends a valid $x'$ for the sender to sign. He can then use it to sign $y'$
			$\rightarrow$ If the hash is 64-bit, it only takes $2^{32}$ attempts
           The genration of $x'$ is easy. Backspaces and spaces, or rewording can generate it
		* Cryptanalysis attacks:
			* Most hash functions use **compression functions**, which is repeatedly applied, and takes a n-bit chaining value and b-bit block as input:$$\begin{aligned}
				CV_0 = IV \\
				 CV_i= f(CV_{i-1},Y{i-1}) \\
				 H(M)=CV_L
				\end{aligned}
				$$
			where $Y_i$ is the blocks forming the original message 
		* Cryptanalysis targets the internal structure of $f$ to find efficient single-execution collisions, then adapts the attack to the fixed IV.