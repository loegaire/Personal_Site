---
title: "Ostrich Algorithm"
description: "Sử dụng IDA pro mở file thì ở hàm start mình nhìn thấy được đoạn mã giả như sau:"
published: "2025-08-29"
updated: "2025-08-29"
event: "UTCTF"
category: "Forensics"
kind: "writeup"
status: "solved"
tags: ["Forensics", "UTCTF", "Writeup"]
readingTime: 3
wordCount: 649
featured: false
sourcePath: "~/ctf/writeups/(UTCTF) Ostrich Algorithm.md"
---

# Ostrich Algorithm


> Posted by Cr0nical

## 1. Analysis

Sử dụng IDA pro mở file thì ở hàm start mình nhìn thấy được đoạn mã giả như sau:

![](http://note.bksec.vn/pad/uploads/c642225f-6fae-4137-9a1e-2b3440dbf478.png)

Do chương trình này Statically linked, cộng với các tham số truyền vào hàm sub_404000 nên mình đoán có vẻ đây là 1 hàm giống _libc_start_main. Đọc kỹ hơn bên trong thì mình gần như chắc chắn điều đó, do vậy có vẻ hàm Sub_401775 sẽ là hàm main.


![](http://note.bksec.vn/pad/uploads/b334259f-79c8-408f-beb0-83acaa5fbc15.png)

Bên trong hàm sub_401775 mình thấy chương trình so sánh chuỗi "welcome to UTCTF!" và chuỗi "oiiaoiiaoiiaoiia", nếu không giống nhau sẽ gọi sub_40c90. Kiểm tra bên trong hàm này cùng với thử đặt breakpoint tại đây khi debug, mình nhận ra hàm sub_401775 sẽ thoát chương trình. Như vậy chương trình sẽ luôn dừng ở đây. Do đó ý tưởng ban đầu là mình thử patch byte xem sao.

## 2. Patch byte

Mình patch toàn bộ lệnh gọi hàm sub_401775 bằng nop.

![](http://note.bksec.vn/pad/uploads/e12dd13b-43d2-4d9a-aa14-29df208406fb.png)

Thay toàn bộ byte ở đây thành 0x90.

![](http://note.bksec.vn/pad/uploads/abc11f3d-9765-4762-b292-bdf35bc19ed2.png)

Mình cho chạy thử chương trình ở đây và nhận được flag.

![](http://note.bksec.vn/pad/uploads/d92eaae1-ee59-42ff-9281-ddeba29ba05f.png)

----



----
# another writeup by howdoitype

We are given a file 'chal'.

Check basic info about it: 
`file chal`
`chal: ELF 64-bit LSB executable, x86-64, version 1 (GNU/Linux), statically linked, BuildID[sha1]=18fa30ea49c70e1d21022b168a9b85a72772f778, for GNU/Linux 3.2.0, stripped`

Seems like it's a normal ELF executable.
Let's try running IDA pro on it:
![](http://note.bksec.vn/pad/uploads/74fc0f7e-541e-4d6a-908f-8fa377316ed8.png)

at the starting point, we can see a few varibles initialized with registers. More importantly, the **start** function calls **sub_404000** and that function has **sub_401775** as one of its inputs, so the next thing to do is investigate those functions
```
// write access to const memory has been detected, the output may be wrong!
void __fastcall __noreturn sub_404000(
        __int64 a1,
        unsigned int a2,
        __int64 a3,
        __int64 a4,
        __int64 a5,
        __int64 a6,
        __int64 a7)
{
  __int64 v9; // rdi
  __int64 v15; // rdx
  __int64 v16; // rcx
  unsigned int v17; // ecx
  unsigned int v18; // eax
  int v19; // r10d
  unsigned int v20; // r11d
  __int64 v21; // r8
  __int64 v22; // r15
  unsigned __int64 v23; // r15
  __m128 v24; // xmm0
  int v25; // eax
  unsigned int v26; // ebx
  int v27; // r9d
  __int64 v28; // rdx
  __int64 v29; // r8
  __m128i v30; // xmm2
  __m128i v31; // xmm4
  __m128i v32; // xmm0
  unsigned int v33; // eax
  ...
 ```
there's ~800 lines of code, most of which are jumbled up operations on numbers. Reading further:
![](http://note.bksec.vn/pad/uploads/46bdea6d-a4ab-4a86-82a9-11a2e83562f5.png)
The strings *"FATAL: kernel too old\n"* or *"FATAL: cannot determine kernel version\n"* gives us a hint that this might be a setup function.

Looking at **sub_401775**:
```
__int64 sub_401775()
{
  int v0; // edx
  int v1; // ecx
  int v2; // r8d
  int v3; // r9d
  int v4; // edx
  int v5; // ecx
  int v6; // r8d
  int v7; // r9d
  __int64 result; // rax
  int i; // [rsp+8h] [rbp-98h]
  int j; // [rsp+Ch] [rbp-94h]
  _BYTE v11[96]; // [rsp+10h] [rbp-90h] BYREF
  _BYTE v12[16]; // [rsp+70h] [rbp-30h] BYREF
  char v13[24]; // [rsp+80h] [rbp-20h] BYREF
  unsigned __int64 v14; // [rsp+98h] [rbp-8h]

  v14 = __readfsqword(0x28u);
  strcpy(v13, "welcome to UTCTF!");
  for ( i = 0; i <= 16; ++i )
  {
    if ( v13[i] != aOiiaoiiaoiiaoi[i] )
      sub_40C090(0LL);
  }
  sub_401C20(v11);
  sub_4018C0(v11, sub_401775, 32LL);
  sub_401AC0(v12, v11);
  sub_40CBC0((unsigned int)"utflag{", (unsigned int)v11, v0, v1, v2, v3);
  for ( j = 0; j <= 15; ++j )
    sub_40CBC0((unsigned int)"%02x", (unsigned __int8)v12[j], v4, v5, v6, v7);
  sub_413790(125LL);
  result = 0LL;
  if ( v14 != __readfsqword(0x28u) )
    sub_4534C0();
  return result;
}
```
executing the file makes it exits immediately.
butsince sub_401775 is called first, it's worth examining further

we can see that it copies *"welcome to UTCTF!"* to v13
then compares it with *'oiiaoiiaoiiaoiia'*
after that, it calls **sub_40C090(0LL)**. After running the program through a debugger, we can also see that this is the point the program exits.

We need to somehow ignore this check, since it will always return true and we will never see what the functions after it does.
In IDA, use the patch feature. 
![](http://note.bksec.vn/pad/uploads/aafefae4-2258-46ed-9a86-54ebe8c49cfb.png)
we will patch the call to sub_40C090 with NOPs
in IDA pro, choose Edit -> Patch program -> change byte
![](http://note.bksec.vn/pad/uploads/3e8571b6-dba2-43bf-b197-33a8ab2080a2.png)
apply to the output program, then run it and we get the flag.

```utflag{d686e9b8f13bef2a3078c324ceafd25d}```


<h1>
    from vqt with love
</h1>

Bài cho 1 file chal là một file thực thi 64-bit

Thử thực hiện chạy xem xem nó có gì

![](http://note.bksec.vn/pad/uploads/deaa30ae-7c06-481d-b307-7f25d64093b6.png)

Chạy chay file này không đưa gì ra ngoài đầu ra cả

Thực hiện decompile bằng IDA Pro

![](http://note.bksec.vn/pad/uploads/324383e8-bf9c-42c5-9408-ef4d10ca63c3.png)

Ở `sub_401775`, thấy có vẻ như nó sẽ thực hiện in flag ở đây, ta sẽ đi sâu vào hàm này

Đầu tiên nó gán `v13` với ``"welcome to UTCTF!"``, rồi sau đó đem so sánh với 1 mảng `aOiiaoiiaoiiaoi`, nhưng khi kiểm tra thì thấy data mà mảng đó mang là `'oiiaoiiaoiiaoiia'`, và chắc chắn không match với nhau. Mà các hàm `sub_401C20`, `sub_4018C0`, `sub_401AC0` đều trả về `true`, và khi qua hết các hàm trên chương trình sẽ in ra `utflag{`. Ở đây mình có thê đoán được do không đi qua được vòng for mà khi chạy chương trình không in ra gì.

Thử patch chương trình tại vòng for đó, ở đây do các bạn ở trên đã thử `nop` để skip qua vòng for nên mình sẽ thử hướng khác.

Ở đây mình nhận thấy 2 strings trên do chỉ chứa ký tự trong bảng ASCII nên không thể gây ra tràn số, nên mình sẽ patch từ jz thành jno (Jump if No Overflow)

![](http://note.bksec.vn/pad/uploads/c3b2cc8f-6929-466b-b6e5-7c6e0e601373.png)

![](http://note.bksec.vn/pad/uploads/5a05db24-0373-4482-9116-259ea0dcb8ce.png)

Sau đó apply patches rồi chạy lại chương trình

![](http://note.bksec.vn/pad/uploads/4a42e7e9-289b-4765-adf3-80a2abedca00.png)
