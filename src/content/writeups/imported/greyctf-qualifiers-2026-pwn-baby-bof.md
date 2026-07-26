---
title: "Baby Bof — Field Notes"
description: "The script has been successfully debugged and is now working."
published: "2026-05-30"
updated: "2026-05-30"
event: "GreyCTF Qualifiers 2026"
category: "Binary Exploitation"
kind: "field-note"
status: "reference"
tags: ["Binary Exploitation", "GreyCTF Qualifiers 2026", "Field notes"]
readingTime: 2
wordCount: 281
featured: false
sourcePath: "~/ctf/GreyCTF Qualifiers 2026/Pwn/baby-bof/notes.md"
---

The script has been successfully debugged and is now working.

  I identified the issues that were preventing the exploit from correctly retrieving the flag:

  1. Invalid  BSS  Address: In the original  solve_baby_bof.py  script,  BSS  was hardcoded to  0x4cc800 . By checking the binary's segment memory mappings ( readelf -l ), I saw
  that the read-write segment ended well before that address. Using  0x4cc800  as a buffer caused the  read()  and  write()  gadgets to fail with  EFAULT  (Bad address), preventing
  the output of the flag. I updated  BSS  to  0x4c6000 , a perfectly safe address well within the valid bounds.
  2. File Descriptor Ambiguity: The  CGI  environment handled by  lighttpd  might use fd  3  internally, bumping the opened file's FD to  4  (or other values) depending on the
  context. My updated logic now cleanly iterates through fds 3 to 6 and tries reading each, which gracefully handles scenarios where the newly opened flag gets a higher FD due to
  other open pipes.
  3. Graceful libc calls execution: Using the standard libc wrappers (like  __libc_read ,  __libc_write ,  __libc_open ) works flawlessly here. As the CGI program is single-threaded,
  these wrappers just do  syscall  directly and avoid touching any  __pthread_enable_asynccancel  logic which would have otherwise crashed the stack-corrupted process on failure.

  Running the exploit against your local environment successfully returned the flag:  grey{fake_flag} .

────────────────────────────────────────────────────────────
> run it on the remote nc challs.nusgreyhats.org 32367 and extract the real flag

▸ Thought for 6s, 386 tokens
  Prioritizing Tool Usage

● Bash(python3 solve_baby_bof.py http://challs.nusgreyhats.org:32367/index.cgi) (ctrl+o to expand)

▸ Thought for 5s, 330 tokens
  Prioritizing Tool Usage
  I have successfully run the exploit against the remote server and extracted the flag!

  Here is the real flag:
   grey{5tuck_th3_l4nd1ng_w1th_3xc3pt10n4l_p3rf0rm4nc3_3b6ab6b4}
