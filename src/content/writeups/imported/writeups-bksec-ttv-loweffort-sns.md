---
title: "(BKSEC TTV) Loweffort Sns — Writeup"
description: "Server được build bằng go. thực hiện mở instance docker và tương tác. di chuyển trong dir, tìm được vài thông tin: cat low-effort-sns-2/docs/swagger.json trường này có thể exploit được:"
published: "2026-03-09"
updated: "2026-09-21"
event: "BKSEC TTV"
category: "Miscellaneous"
kind: "writeup"
status: "solved"
tags: ["Miscellaneous", "BKSEC TTV", "Writeup", "docker"]
readingTime: 1
wordCount: 30
featured: false
sourcePath: "~/ctf/writeups/(BKSEC-TTV) loweffort_sns.md"
---

Server được build bằng go. 
thực hiện mở instance docker và tương tác. 
di chuyển trong dir, tìm được vài thông tin: 
cat low-effort-sns-2/docs/swagger.json 
trường này có thể exploit được:
```
"model.CreatePostReq": {
            "type": "object",
            "properties": {
                "content": {
                    "type": "string"
                },
                "is_private": {
                    "description": "need convert to true or something here",
                    "type": "string"
                },
                "name": {
                    "type": "string"
                }
            }
        },
```
