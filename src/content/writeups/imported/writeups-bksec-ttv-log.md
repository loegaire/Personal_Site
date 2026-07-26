---
title: "(BKSEC TTV) Log — Writeup"
description: "đề bài cho ta 2 file: SQLLog.log và access.log tiến hành trả lời từng câu hỏi. công cụ sử dụng là pwntools để trả lời. from pwn import"
published: "2025-08-29"
updated: "2025-08-29"
event: "BKSEC TTV"
category: "Binary Exploitation"
kind: "writeup"
status: "solved"
tags: ["Binary Exploitation", "BKSEC TTV", "Writeup"]
readingTime: 1
wordCount: 143
featured: false
sourcePath: "~/ctf/writeups/(BKSEC-TTV) Log.md"
---

đề bài cho ta 2 file: SQLLog.log và access.log 
tiến hành trả lời từng câu hỏi. 
công cụ sử dụng là pwntools để trả lời.
```
from pwn import *


  p = remote('10.8.0.1',10002)
```
câu đầu tìm số dòng trong file access.log:
print(p.recv().decode())
p.sendline(b'')
print(p.recv().decode())
p.sendline(b'18397627')
các câu tiếp theo đều đơn giản sử dụng grep và tìm đúng từ khoa để cho ta manh mối...
Script đến hiện tại: 
```
from pwn import *


p = remote('10.8.0.1',10002)
print(p.recv().decode())
p.sendline(b'')
print(p.recv().decode())
p.sendline(b'18397627')
print(p.recv().decode())
p.sendline(b'21/02/2023')
print(p.recv().decode())
p.sendline(b'10.0.9.4')
print(p.recv().decode())
p.sendline(b'WIN-BSDM40BT0A0')
print(p.recv().decode())
p.sendline(b'sql_injection')
print(p.recv().decode())
p.sendline(b'/GetBookName.aspx')
print(p.recv().decode())
p.sendline(b'sqlmap/1.7.2.16#dev+(https://sqlmap.org)')
p.interactive()
```

tuy nhiên, khi tiến hành gửi đáp án cho mitre attack id, không thể gửi bằng pwntools 
em đã thử bruteforce tất cả các id và đều sai hết.
cho đến khi nhập tay *"T1505.001"* mới ra đến câu tiếp. Lúc biết được thì đã mất quá nhiều thời gian.

câu tiếp theo hỏi về biện pháp giấu IP của C2, và lại dùng `grep "xp_cmdshell"`, em tìm thấy "ngrok" là đáp án. Đến đây thì không kịp để hoàn thiện bài.
