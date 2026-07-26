---
title: "Retro cookie clicker - reverse engineering"
description: "Install retroarch to get started payling the game:D on Arch Linux:"
published: "2025-08-29"
updated: "2025-08-29"
event: "UTCTF"
category: "Reverse Engineering"
kind: "writeup"
status: "solved"
tags: ["Reverse Engineering", "UTCTF", "Writeup"]
readingTime: 1
wordCount: 73
featured: false
sourcePath: "~/ctf/writeups/(UTCTF) Retro cookie clicker - reverse engineering.md"
---

# Retro cookie clicker - reverse engineering

We are given a .gb file

Install retroarch to get started payling the game:D
 on Arch Linux:
```sudo pacman -S retroarch```

Running the game, we can see that it counts our clicks 
![](http://note.bksec.vn/pad/uploads/322ea6ff-8b2b-480e-b44a-1b440ce9d36d.png)
Each 12 clicks registers as a dozen
It seems like we need to reach the maximum number of dozens to win

Realize that retroarch has really little support for  debugging, so i installed 'Mesen' :disappointed: 
which has built-in debugging
