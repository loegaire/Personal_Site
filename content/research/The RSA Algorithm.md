# The RSA Algorithm
#### Theory
* Two private primes $p, q$
* $n = p \cdot q$, public
* public $e$ such that $gcd(\phi (n),e) = 1$, $1<e<\phi(n)$
* calculate $d \equiv e^{-1}\ (mod\ \phi(n))$
* messages from sender can be encrypted with receiver's public key:
$$C \equiv M^d\ (mod\ n)$$
* only the intended receiver's private key can decrypt:
$$M \equiv M^{de}\ (mod\ n)$$
in order to achive this, we need to pick a pair of $d$ and $e$ such that 
$$d = e^{-1}$$
more accurately: $$d \equiv e^{-1}\ (mod\ \phi(n))$$
in the case for RSA, $\phi(n) = (p-1)(q-1)$. We need the modulus to be $\phi(n)$ and not $n$ because n is not a prime. <span style="color:#3583f0">A property of primes is that the multiplicative group $(1,2,...,p-1)$ is *cyclical*.</span>

An example of prime cyclic group, starting with $5$, we get:
$$5^1 = 5\ (mod\ 7)$$ 
$$5^2 = 25\ (mod\ 7)= 4$$ 
$$5^3 = 125\ (mod\ 7)=6$$
$$5^4 = 625\ (mod\ 7) = 2$$
$$5^5 = 3125\ (mod\ 7) = 3$$
$$5^6 = 15625\ (mod\ 7) = 1$$
So from 5 and multiplication, we get back all 7 elements (1,2,..,7).
<span style="color:red">This is not true for composite numbers.</span>
In a cyclic group, it is also guaranteed that , all numbers will have an inverse (Fermat's little theorem):
$$a^{p-1}\equiv 1\ (mod\ p)$$
For $a$ co-prime to $p$, which all $a$ is, since $p$ is prime.
Rewriting Fermat's little theorem:
$$\iff a \cdot a^{p-2} \equiv 1\ (mod\ p)$$
<span style="color:#3583f0"> 
So each number $a$ has an inverse, and it's $a^{p-2}$
</span>
The same thing applies to $n$ in RSA, but now, $n$ is not a prime, but a product of two primes $p$ and $q$, so only $(p-1)\cdot(q-1)$ or $\phi(p,q)$ elements of the set $(1,2,...,n)$ are co-primes to $n$ (property of Euler's totient function).
Therefore, we have the requirement of $e*d \equiv 1\ (mod\ \phi(n))$ as a number multiplying by itself co-primes number of times will hit back $1$, and the value of $e \cdot d$ being above $\phi(n)$ does nothing new as the modulo will just revert back to something below $\phi(n)$ 
#### Computational costs
 * Key generation
	 * Key $n$ needs to be large to prevent brute-forcing. Finding large primes is hard. There's no fast, guaranteed algorithms, only pick a number and check the probability of it being prime.
	 * The prime number theorem tells us that on average, we need to check $ln(n)$ integers before a prime is found.
 * Encryption/Decryption
	* If we do exponentiation then modulus, the intermediate values will be huge. We can leverage this property of modulus:
	  $$a \cdot b\ (mod\ n) = (a\ mod\ n)\cdot(b\ mod\ n)\ (mod\ n)$$
	* We can also optimize the exponentiation itself: instead of $$a^{8} = a\cdot a\cdot a\cdot a\cdot a\cdot a\cdot a\cdot a$$ which requires 8 multiplication operations, we can calculate $a \cdot a = a^2$, then $a^2 \cdot a^2 = a^4$, $a^4 \cdot a^4=a^8$, which requires only 3 multiplication operations.
	<span style="color:3583f0">
	This is *fast exponentiation* in competitive programming: 
	 ```C++
	 ll fast_ex(ll n, ll a){
		ll res=1;
		while(n){
			if (n & 1){
				res *= a; 
			}
			a *= a;
			b  >>= 1;
		}
		return res;
	 }
	 ```
	</span>
	
	* For a very small value of public key $e$, if a message$M$ is sent to n people with different $n_i$, where $n_i$ are relatively prime to eachother, the Chinese Remainder Theorem can be used to calculate $M$ exactly, not a congruent of $M$, since $M^i$ will be smaller than $n_1 \cdot n_2 \cdot ... \cdot n_{i-1} \cdot n_i$. <span style="color:3583f0"> $\rightarrow$ Make $e$ (and $d$) big $\rightarrow$ costly</span> 
	* There's a way to use CRT to make faster calculations. We have $n = p \cdot q$ for primes $p$, $q$. Instead of calculating $$C^d\ (mod\ n)$$ we can calculate $C_p = C^d\ (mod\ p)$ and $C_q = M^d\ (mod\ q)$. Then M can be calculated as follows:
		 * We have: $$M \equiv C^d \equiv C_p\ (mod\ p) \equiv C_q\ (mod\ q)$$
		 * <span style="color:3583f0"> We need to construct $M$ from $C_p$ and $C_q$ which satisfies $$M \equiv C_p\ (mod\ p)$$ and $$M \equiv C_q\ (mod\ q)$$</span>
		 * CRT guarantees the existence of an unique $M\ mod\ p \cdot q$
		 * First, we can write $M = C_p + p \cdot t$ for some integer $t$. Then:
		$$M \equiv C_p\ (mod\ p)$$
		 * Now we want to make $M$ also satisfy $M= C_p + p\cdot t\equiv C_q\ (mod\ q)$
		 * Since $gcd(p,q)=1$ or p and q are relatively prime, there exist $$p \cdot p^{-1} \equiv 1\ (mod\ q)$$
		 * Therefore $$M= C_p + p\cdot t\equiv C_q\ (mod\ q)$$ $$\iff p \cdot t \equiv C_q - C_p\ (mod\ q)$$ $$\iff t \equiv (C_q-C_p)\cdot p^{-1}$$
		 $\Rightarrow$ <span style="color:3563f0">We now have a formula for calculating M^n based on two smaller numbers mod $p$ and mod $q$:$$M = C_p + p\cdot[(C_q - C_p)\cdot p^{-1}\ (mod\ q)]$$</span>
	> <span style="color:3bba1c">Question: My description for the formula for $M$ calculated using CRT differs from the book, as i find this explanation more intuitive. Is this explanation correct?</span>
	* Further optimize using Fermat's Little Theorem: 
		$$C_p = C^d\ (mod\ p) \equiv C^{d\ mod\ (p-1)}\ (mod\ p)$$ $$C_q = C^d\ (mod\ q) \equiv C^{d\ mod\ (q-1)}\ (mod\ q)$$
	(since we can write $d=a + k(p-1)$ then $C^{a + k(p-1)}=C^a\cdot C^{k((p-1)} \equiv C^a\cdot 1^k\ (mod\ p)$ so $d$ never needs to go above $p-1$	 
#### Security
* **Possible attacks:** 
	* Brute force: Trying all possible keys $\rightarrow$ make the key big
	* Mathematical attacks:
		* Factor $n$ into $q$ and $p$. This enables us to calculate $\phi(n)$ then find $d \equiv e^{-1}\ (mod\ \phi(n))$
		* Find $phi(n)$ directly
		* Find  d directly
		* Due to the further increase in performance of factoring algorithms, and the cost added to make big rsa keys, some standards were developed: 2048-bit,3072-bit.
			* $p\approx q$
			* $p-1, q-1$ should have a large prime factor
			* $(p-1,q-1)$ should be small
	* Timing attacks
		* Guess the key based on how long it takes to perform the algorithm. An input can have parts that take extra time to process, observing them would give attackers clues about the input itself
		$\rightarrow$ Randomize delay, pre-offuscate the cipher, make calculations take the time
	* Hardware-based attack: abusing the hardware
	* Chosen cipher attack: abusing the properties of rsa
		* Chosen Ciphertext Attack:
			* This happens when the attacker can choose the ciphertexts to be used for decoding:
			  Example: Suppsose we want to  decrypt:$$C = M^e\ (mod\ n)$$
			* We can calculate $X = 2^e\cdot C\ (mod\ n)$
			* Submit $X$ and receive $X^d$, from which we can find $M = X/2$
			> <span style="color:3bba1c"> Question: Why doesnt the attacker just send $C$ and get the exact $M$ back?</span>
			* This can be prevented by adding padding to the plaintext.





