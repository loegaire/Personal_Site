---
title: "Switcharoo - reverse"
description: "cat Switcharoo\\ -\\ reverse.md Switcharoo - reverse"
published: "2025-08-29"
updated: "2025-08-29"
event: "pascalCTF"
category: "Hardware / RF"
kind: "writeup"
status: "solved"
tags: ["Hardware / RF", "pascalCTF", "Writeup"]
readingTime: 1
wordCount: 94
featured: false
sourcePath: "~/ctf/writeups/(pascalCTF) Switcharoo - reverse.md"
---

cat Switcharoo\ -\ reverse.md 
# Switcharoo - reverse

the challenge file is suprisingly small
disassemble with IDA Pro:
```c
int __fastcall main(int argc, const char **argv, const char **envp)
{
  __int64 v3; // rax
  __int64 v4; // rdx
  int result; // eax
  int i; // [rsp+Ch] [rbp-44h]
  _BYTE v7[40]; // [rsp+10h] [rbp-40h] BYREF
  unsigned __int64 v8; // [rsp+38h] [rbp-18h]

  v8 = __readfsqword(0x28u);
  v3 = std::operator<<<std::char_traits<char>>(&_bss_start, "Welcome to switcharoo! Can you guess my flag?", envp);
  std::ostream::operator<<(v3, &std::endl<char,std::char_traits<char>>);
  std::string::basic_string(v7);
  std::operator>><char>(&std::cin, v7);
  if ( std::string::size(v7) != 32 )
    lose();
  for ( i = 0; i < (unsigned __int64)std::string::size(v7); ++i )
  {
    switch ( *(_BYTE *)std::string::operator[](v7, i) )
    {
      case '0':
        if ( i != 12 && i != 29 && i != 22 )
          lose();
        return result;
      case '3':
        if ( i != 25 )
          lose();
        return result;
      case '4':
        if ( i != 17 )
          lose();
        return result;
      case 'C':
        if ( i != 6 )
          lose();
        return result;
      case 'D':
        if ( i != 21 )
          lose();
        return result;
      case 'F':
        if ( i != 8 )
          lose();
        return result;
      case 'L':
        if ( i != 13 && i != 30 )
          lose();
        return result;
      case 'T':
        if ( i != 7 && i != 19 )
          lose();
        return result;
      case 'V':
        if ( i != 26 )
          lose();
        return result;
      case '_':
        if ( i != 15 && i != 20 && i != 23 && i != 27 )
          lose();
        return result;
      case 'a':
        if ( i != 1 && i != 4 && i != 11 )
          lose();
        return result;
      case 'c':
        if ( i != 3 && i != 16 )
          lose();
        return result;
      case 'l':
        if ( i != 5 && i != 28 )
          lose();
        return result;
      case 'n':
        if ( i != 18 )
          lose();
        return result;
      case 'o':
        if ( i != 14 )
          lose();
        return result;
      case 'p':
        if ( i && i != 10 )
          lose();
        return result;
      case 'r':
        if ( i != 24 )
          lose();
        return result;
      case 's':
        if ( i != 2 )
          lose();
        return result;
      case '{':
        if ( i != 9 )
          lose();
        return result;
      case '}':
        if ( i != 31 )
          lose();
        return result;
      default:
        lose();
    }
  }
  std::operator<<<std::char_traits<char>>(&_bss_start, "Good job, now submit that flag!", v4);
  std::string::~string(v7);
  return 0;
}
```
We can immediately infer the flag from this check, which is a string that satisfies all the checks:
for example, the 12th, 22th, and 29th char of the string must be '0' 
![](http://note.bksec.vn/pad/uploads/803c12a4-7fa0-420f-9586-b10d0dc0b129.png)

----
> writeup written by howdoitype
----


# Automatic Approach in finding flag
> Posted by Cr0nical

Thuật toán kiểm tra flag của chương trình khá là clean như bên trên đã chia sẻ, mình chỉ khác là thay vì viết tay mình muốn tự động bằng script.

```
flag = [''] * 32
map_c = {
    'p': [0, 10],
    'a': [1, 4, 11],
    's': [2],
    'c': [3, 16],
    'l': [5, 28],
    'C': [6],
    'T': [7, 19],
    'F': [8],
    '{': [9],
    '0': [12, 22, 29],
    'L': [13, 30],
    'o': [14],
    '_': [15, 20, 23, 27],
    '4': [17],
    'n': [18],
    'D': [21],
    'r': [24],
    '3': [25],
    'V': [26],
    '}': [31]
}
for char, positions in map_c.items():
    for pos in positions:
        flag[pos] = char

print(''.join(flag))
```
