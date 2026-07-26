---
title: "Endlesscycle - reverse engineering"
description: "v6 = (unsigned int ()(void))mmap(0LL, 0x9EuLL, 7, 33, -1, 0LL); srand(seed); for ( i = 0LL; i <= 0x9D; ++i ) { for ( j = 0LL; j < dword4040[i]; ++j ) rand(); ((BYTE )v6 + i) = rand(); } if ( v6() == 1 ) puts…"
published: "2025-08-29"
updated: "2025-08-29"
event: "HTB Cyber Apocalyse"
category: "Reverse Engineering"
kind: "writeup"
status: "solved"
tags: ["Reverse Engineering", "HTB Cyber Apocalyse", "Writeup"]
readingTime: 1
wordCount: 181
featured: false
sourcePath: "~/ctf/writeups/(HTB Cyber Apocalyse) Enless-cycle reverse engineering.md"
---

# Endlesscycle - reverse engineering
Static analysis using IDA Pro 
since this file doesnt have the full symbols, we will be expected to manually examine the functions. 
The given pseudocode for `main`:
```c
__int64 __fastcall main(int a1, char **a2, char **a3)
{
  unsigned __int64 i; // [rsp+0h] [rbp-20h]
  unsigned __int64 j; // [rsp+8h] [rbp-18h]
  unsigned int (*v6)(void); // [rsp+10h] [rbp-10h]

  v6 = (unsigned int (*)(void))mmap(0LL, 0x9EuLL, 7, 33, -1, 0LL);
  srand(seed);
  for ( i = 0LL; i <= 0x9D; ++i )
  {
    for ( j = 0LL; j < dword_4040[i]; ++j )
      rand();
    *((_BYTE *)v6 + i) = rand();
  }
  if ( v6() == 1 )
    puts("You catch a brief glimpse of the Dragon's Heart - the truth has been revealed to you");
  else
    puts("The mysteries of the universe remain closed to you...");
  return 0LL;
}
```
when running the program, we are prompted with a key check, yet it doesnt appear anywhere in the program's code. 
Examine the main function further, we notice something really interesting:
`srand()` is called with a seed, then `rand()` is called with a predetermined number of times, as if to achieve some specific values.
Searching online confirms our belief: *when given a seed, taken using srand(), rand() will print out a random but determined sequence of numbers.* Which means, the amount of times `rand()` is called are not arbitrary but to get specific values for `mmap()`, which will generate an executable region when provided with `7` as the argument returns an execuable region of memory.
using c++ to simulate `srand()`, we get the following program: 
```asm
0x7ffff7fbf000:      push   rbp
   0x7ffff7fbf001:      mov    rbp,rsp
   0x7ffff7fbf004:      push   0x101213e
   0x7ffff7fbf009:      xor    DWORD PTR [rsp],0x1010101
   0x7ffff7fbf010:      movabs rax,0x67616c6620656874
   0x7ffff7fbf01a:      push   rax
   0x7ffff7fbf01b:      movabs rax,0x2073692074616857
   0x7ffff7fbf025:      push   rax
   0x7ffff7fbf026:      push   0x1
   0x7ffff7fbf028:      pop    rax
   0x7ffff7fbf029:      push   0x1
   0x7ffff7fbf02b:      pop    rdi
   0x7ffff7fbf02c:      push   0x12
   0x7ffff7fbf02e:      pop    rdx
   0x7ffff7fbf02f:      mov    rsi,rsp
   0x7ffff7fbf032:      syscall
   0x7ffff7fbf034:      sub    rsp,0x100
   0x7ffff7fbf03b:      mov    r12,rsp
   0x7ffff7fbf03e:      xor    eax,eax
   0x7ffff7fbf040:      xor    edi,edi
   0x7ffff7fbf042:      xor    edx,edx
   0x7ffff7fbf044:      mov    dh,0x1
   0x7ffff7fbf046:      mov    rsi,r12
   0x7ffff7fbf049:      syscall
   0x7ffff7fbf04b:      test   rax,rax
   0x7ffff7fbf04e:      jle    0x7ffff7fbf082
   0x7ffff7fbf050:      push   0x1a
   0x7ffff7fbf052:      pop    rax
   0x7ffff7fbf053:      mov    rcx,r12
   0x7ffff7fbf056:      add    rax,rcx
   0x7ffff7fbf059:      xor    DWORD PTR [rcx],0xbeefcafe
   0x7ffff7fbf05f:      add    rcx,0x4
   0x7ffff7fbf063:      cmp    rcx,rax
   0x7ffff7fbf066:      jb     0x7ffff7fbf059
   0x7ffff7fbf068:      mov    rdi,r12
   0x7ffff7fbf06b:      lea    rsi,[rip+0x12]        # 0x7ffff7fbf084
   0x7ffff7fbf072:      mov    rcx,0x1a
   0x7ffff7fbf079:      cld
   0x7ffff7fbf07a:      repz cmps BYTE PTR ds:[rsi],BYTE PTR es:[rdi]
   0x7ffff7fbf07c:      sete   al
   0x7ffff7fbf07f:      movzx  eax,al
   0x7ffff7fbf082:      leave
   0x7ffff7fbf083:      ret
   0x7ffff7fbf084:      mov    dh,0x9e
   0x7ffff7fbf086:      lods   eax,DWORD PTR ds:[rsi]
   0x7ffff7fbf087:      (bad)
   0x7ffff7fbf08a:      (bad)
   0x7ffff7fbf08c:      movabs eax,ds:0x8ae18ba4cec7dca8
   0x7ffff7fbf095:      movabs ds:0xb79ad29dfa89e1dc,al
```
we can see that the entered key is xored with 0xbeefcafe and compared with the stored values.
After xor-ing them back, we get the flag.
**HTB{l00k_b3y0nd_th3_w0rld}**
