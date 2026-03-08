# Cybersecurity**: Keeping data *intergral* *avaiable*, *authentic*, *accountable*, *confidential*
# OSI: 
**Security attacks**: 
*   Passive: listening for stuff, not altering anything 
*   Active: breaking stuff

#### Security services:
*   Authentication: knowing who is who, who the author is, who the peer is
* Access control: self-explainatory
* Data confidentiality: protect from passive attack
* Data integrity: avoid data manipulation, restoring data
* Nonrepudiation: acknowledge eachother for future reference
* Availablity: self-explainatory

#### **Security mechanism**:
* Cryptography: decryiptible(sha) and non-decryptible(hash) 
* Data integrity: algorithms to recover data
* Digital signature: self-explanatory
* Authentication exchange: ensuring identity 
* Notarization: use something else as a judge

# Cryptography
* key-less: $f(data) \rightarrow hash$
* single-key: $f(data,key) \rightarrow EncryptedData$
	* refered to as "symetric encryption" 
	* Message Authentication Code: a block of data used for identifying messages
* two-key: 
	1. 
		* $f(data,PrivateKey)\rightarrow Encrypted$
		* $f'(Encrypted,PublicKey)\rightarrow data$
		=> only those who have PrivateKey can encrypt, everyone can decrypt
	2. 
		* $f(data, PublicKey) \rightarrow Encrypted$
		* $f(Encrypted, PrivateKey) \rightarrow data$
		=> anyone can ecrypt, only who has PrivateKey can decrypt
# Network Security

#### Communications 		
*	mostly done through protocols 

#### Device Security
*	dont let bad people touch hardware