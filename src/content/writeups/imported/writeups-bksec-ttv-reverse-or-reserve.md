---
title: "(BKSEC TTV) Reverse Or Reserve — Writeup"
description: "Bài này cho ta một file chương trình khá obfuscated disassemble bằng IDA, sau đó dùng tính năng generate pseudocode, thu được những thông tin sau: sub14000185C là hàm check win. int64 sub14000185C() { FILE v…"
published: "2025-08-29"
updated: "2025-08-29"
event: "BKSEC TTV"
category: "Reverse Engineering"
kind: "writeup"
status: "solved"
tags: ["Reverse Engineering", "BKSEC TTV", "Writeup"]
readingTime: 1
wordCount: 64
featured: false
sourcePath: "~/ctf/writeups/(BKSEC-TTV) Reverse or reserve.md"
---

Bài này cho ta một file chương trình khá obfuscated 
disassemble bằng IDA, sau đó dùng tính năng generate pseudocode, thu được những thông tin sau:
sub_14000185C là hàm check win. 
```
__int64 sub_14000185C()
{
  FILE *v0; // rax
  char Buffer[42]; // [rsp+20h] [rbp-30h] BYREF
  unsigned __int8 v3; // [rsp+4Ah] [rbp-6h]
  unsigned __int8 v4; // [rsp+4Bh] [rbp-5h]
  int i; // [rsp+4Ch] [rbp-4h]

  sub_140001A80();
  v0 = __acrt_iob_func(0);
  fgets(Buffer, 31, v0);
  Buffer[strcspn(Buffer, "\n")] = 0;
  v4 = sub_140001483((unsigned __int8)byte_140004000[0]);
  v4 += sub_140001545(v4, 2LL);

  sub_140001593(v4);
  if ( strlen(Buffer) != 29 )
    return 1LL;
  for ( i = 0; i < strlen(Buffer); ++i )
  {
    v3 = byte_140004000[i];
    v3 = sub_140001450(v3, 3);
    v3 = sub_1400014E1(v3);
    v3 ^= byte_140005030[i];
    Buffer[41] = sub_1400014A7(v3);
    Buffer[40] = sub_1400017C8(v3);
    sub_140001803(v3, i);
    if ( Buffer[i] != v3 )
      return 1LL;
  }
  sub_140002A90(100);
  return 0LL;
}
```
lần lượt giải mã hàm check win: 
tìm byte_140004000 và byte_140005030. 
sử dụng gdb: 
```
gdb ./reverse_or_reserve.exe

Reading symbols from ./reverse_or_reserve.exe...
(No debugging symbols found in ./reverse_or_reserve.exe)
(gdb) x/32xb 0x140004000
0x140004000:	0xca	0x0c	0x03	0x9c	0xfb	0x5a	0x56	0x71
0x140004008:	0x87	0xe2	0x2e	0x69	0x28	0xbc	0xd3	0x5c
0x140004010:	0xb2	0x77	0x79	0x7d	0x50	0xde	0x90	0x9a
0x140004018:	0x3f	0x10	0x55	0x05	0x22	0x00	0x00	0x00
(gdb) x/32xb 0x140005020
0x140005020:	0x05	0x02	0x07	0x03	0x00	0x06	0x04	0x01
0x140005028:	0x00	0x00	0x00	0x00	0x00	0x00	0x00	0x00
0x140005030:	0x3a	0x5f	0x72	0x91	0xb8	0xc3	0xde	0xee
0x140005038:	0x13	0x2f	0x44	0x68	0x77	0x89	0x9a	0xac
(gdb)
```
hàm sub_140001450 thực hiện shift bit
```
__int64 __fastcall sub_140001450(unsigned __int8 a1, char a2)
{
  return ((int)a1 >> a2) | (a1 << (8 - a2));
}
```
hàm sub_1400014E1:
```
__int64 __fastcall sub_1400014E1(unsigned __int8 a1)
{
  int i; // [rsp+8h] [rbp-8h]
  unsigned __int8 v3; // [rsp+Fh] [rbp-1h]

  v3 = 0;
  for ( i = 0; i <= 7; ++i )
    v3 |= (((int)a1 >> byte_140005020[i]) & 1) << i;
  return v3;
}
```
hàm sub_1400014A7 
```
__int64 __fastcall sub_1400014A7(unsigned __int8 a1)
{
  return (unsigned int)((66 * a1 + 19) % 255);
}
```
thực hiện dịch ngược các hàm để tìm flag...
