
# Traditional block cipher structure

#### Electronic Codebook(ECB)
each block is encrypted by the same key

#### Cipher Block Chaining(CBC)
each block is encrypted by XOR-ing its previous and next blocks
> <span style="color:3bba1c">Question: Is XOR the only operation for CBC? what are the other options?</span>
#### Main types of block cipher

| Stream Cipher          | Block Cipher          |
| ---------------------- | --------------------- |
| One bit/byte at a time | A block of bits/bytes |
> <span style="color:3bba1c;">**Question:** in the textbook, it is mentioned that:</span>
> > *"for practical reasons, the bit-stream generator must be 
­    implemented as an algorithmic procedure, so that the cryptographic  
> >bit stream 
> >can be produced by both users. In this approach (Figure 4.1a), the bit-stream 
> >generator is a key-controlled algorithm and must produce a bit stream that 
> >is cryptographically strong. That is, it must be computationally impractical to 
> >predict future portions of the bit stream based on previous portions of the bit 
> >stream. The two users need only share the generating key, and each can produce 
> > the keystream."*
> 
> ![[Pasted image 20250923044134.png]]
<span style="color:3bba1c"> why must there be an "algorithm" for putting out the keystream? Why cant we directly output the keystream but have to take an intermediate step of putting the key in a keystream generator? </span>
>
#### Feistel Cipher Structure

* For an n-block ciphers, there are $2^n$ possible blocks of data
* To make the cipher *reversible*, each block has to have its corresponding block -> the ideal cipher -> key length will be $n \cdot 2^n$
* The minimal length of n to thwart statistical attacks is 10, which will make the key $10 \cdot 2^{10}$ -> too big
* <span style= "color:3583f0"> Diffusion and Confusion: A close alternative to ideal ciphers. While ideal ciphers are truly random -> no statistical attacks, diffusion nullify statistical attacks by dispersing the statistics, "making the cipher text digit be affected by multiple digits from the plaintext"
	 *Example: a message $M: m_1m_2m_3..$* where $m_i = 1 | 0$
	-> a formula for coputing the average value of each $m_i$ based on $k$ surrounding digits: $y_k = \left( \sum_{i=1}^k m_{n+i} \right) \mod 26$  
</span>
> <span style="color:3bba1c">**Question**: I came up with my own formula: $y_k = {m_{k-1} \oplus m_k \oplus m_{k+1}}$, does this algorithm also have the effect of distributing the probability more evenly?</span>
* <span style="color:red">The Feistel Cipher Structure:</span>
	* Encryption: The block is split in half, one half goes through a round function with key $K$ and xor-ed with the remaining half:
	$$Data = LD_0 + RD_0$$
	$$RD_1 = F(K_1,RD_0) \oplus LD_0$$
	* then the other half takes the previous value of the initial half
	$$LD_1 = RD_0$$
	* we now have our encrypted data after 1 round of encryption:
		$$EncryptedData_0 = LD_1 + RD_1$$
> <span style="color:#3bba1c">I think this is a form of Cipher Block Chaining </span>

There are more variables to adjust, such as <u>block size</u>,<u>* length of K *</u>, <u>*number of rounds*</u>,<u>Key Gen algorithm</u>, <u>Round function</u>,...
* Decryption: since xor is reversible, we can use the Ciphertext and the keys in reverse order
> <span style="color:#3bba1c">Question: Why is this algorithm important? We can generate almost infinite styles of encryption that follows diffusion and confusion, so why these specific steps? </span> 
