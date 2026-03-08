---
title: BKSEC-TTV 2025
summary: Android reverse engineering notes from decompilation through XOR recovery.
tags:
  - android
  - reverse-engineering
  - ida
order: 3
---

- sử dụng jadx decompile:
  `jadx -d output_app app.apk`
  sau một hồi dò xét các file, biết được điểm đặc biệt nằm ở file [libnative-lib.so](http://libnative-lib.so)
  `cd /output_app/resources/lib/arm64v8a/`
- decompile bằng IDA, dịch sang pseudocode
  tìm thấy hàm chính:

```
__int64 __fastcall Java_com_example_myapplication_MainActivity_stringFromJNI(__int64 a1)
{
  __int64 v2; // [xsp+10h] [xbp-60h]
  _BYTE *ptr; // [xsp+18h] [xbp-58h]
  _OWORD v5[2]; // [xsp+40h] [xbp-30h] BYREF
  __int64 v6; // [xsp+68h] [xbp-8h]

  v6 = *(_QWORD *)(_ReadStatusReg(ARM64_SYSREG(3, 3, 13, 0, 2)) + 40);
  *(_OWORD *)((char *)v5 + 10) = *(__int128 *)((char *)&xmmword_5F0 + 10);
  v5[0] = xmmword_5F0;
  ptr = doSomethings((__int64)v5, "BKSEC{gh3_gh3_v1p_pr0_zay}", 0x1AuLL);
  v2 = (*(__int64 (__fastcall **)(__int64, _BYTE *))(*(_QWORD *)a1 + 1336LL))(a1, ptr);
  free(ptr);
  return v2;
}
```

hàm này dùng hàm doSomethings() vào "BKSEC{gh3\_gh3\_v1p\_pr0\_zay}"

- tìm và dịch doSomethings()

```
_BYTE *__fastcall doSomethings(__int64 a1, const char *a2, unsigned __int64 a3)
{
  unsigned __int64 i; // [xsp+8h] [xbp-48h]
  _BYTE *v5; // [xsp+10h] [xbp-40h]
  size_t v6; // [xsp+18h] [xbp-38h]

  v6 = __strlen_chk(a2, 0xFFFFFFFFFFFFFFFFLL);
  v5 = malloc(a3 + 1);
  if ( !v5 )
    return 0LL;
  for ( i = 0LL; i < a3; ++i )
    v5[i] = *(_BYTE *)(a1 + i) ^ a2[i % v6];
  v5[a3] = 0;
  return v5;
}
```

ta vẫn cần giá trị đầu xmmword\_5F0
đọc từ IDA:

```
.rodata:00000000000005F0 ; ===========================================================================
.rodata:00000000000005F0
.rodata:00000000000005F0 ; Segment type: Pure data
.rodata:00000000000005F0                 AREA .rodata, DATA, READONLY, ALIGN=0
.rodata:00000000000005F0                 ; ORG 0x5F0
.rodata:00000000000005F0 xmmword_5F0     DCB 0, 0, 0, 0, 0, 0, 0x29, 0, 0x52, 0x2F, 0x38, 5, 0x5C
.rodata:00000000000005F0                                         ; DATA XREF: Java_com_example_myapplication_MainActivity_stringFromJNI+28↓o
.rodata:00000000000005F0                                         ; Java_com_example_myapplication_MainActivity_stringFromJNI+2C↓r
.rodata:00000000000005FD                 DCB 0x31, 0x29, 0x5C
.rodata:0000000000000600                 DCB 0x1F
.rodata:0000000000000601                 DCB 0x3D ; =
.rodata:0000000000000602                 DCB 0x19
.rodata:0000000000000603                 DCB 0x1E
.rodata:0000000000000604                 DCB 0x55 ; U
.rodata:0000000000000605                 DCB    0
.rodata:0000000000000606                 DCB    2
.rodata:0000000000000607                 DCB    8
.rodata:0000000000000608                 DCB  0xC
.rodata:0000000000000609                 DCB    0
```

từ đó, ta có code python:

```
def reverse_doSomethings(encrypted, key):
    decrypted = bytearray()
    key_len = len(key)

    for i in range(len(encrypted)):
        decrypted.append(encrypted[i] ^ ord(key[i % key_len]))

    return decrypted.decode()

key = "BKSEC{gh3_gh3_v1p_pr0_zay}"

encrypted_data = bytes([
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x29, 0x00,
    0x52, 0x2F, 0x38, 0x05, 0x5C, 0x31, 0x29, 0x5C,
    0x1F, 0x3D, 0x19, 0x1E, 0x55, 0x00, 0x02, 0x08,
    0x0C, 0x00
])

original_data = reverse_doSomethings(encrypted_data, key)
print("flag:", original_data)
```

**chạy và cho ra output: BKSEC{Nhap\_mon\_mobile\_xiu}**
