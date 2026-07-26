---
title: "Voiceover Challenge — Writeup"
description: "python3 solve.py /home/thinh/ctf/sejong/voiceoverchallenge/ttsenv/lib/python3.11/site-packages/jieba/compat.py:18: UserWarning: pkgresources is deprecated as an API. See https://setuptools.pypa.io/en/latest/…"
published: "2026-04-25"
updated: "2026-04-25"
event: "sejong"
category: "Miscellaneous"
kind: "writeup"
status: "solved"
tags: ["Miscellaneous", "sejong", "Writeup"]
readingTime: 1
wordCount: 112
featured: false
sourcePath: "~/ctf/sejong/voiceover_challenge/writeup.md"
---

python3 solve.py 
/home/thinh/ctf/sejong/voiceover_challenge/tts_env/lib/python3.11/site-packages/jieba/_compat.py:18: UserWarning: pkg_resources is deprecated as an API. See https://setuptools.pypa.io/en/latest/pkg_resources.html. The pkg_resources package is slated for removal as early as 2025-11-30. Refrain from using this package or pin to Setuptools<81.
  import pkg_resources
[+] Initializing XTTSv2 (this will use the cached model)...
 > tts_models/multilingual/multi-dataset/xtts_v2 is already downloaded.
 > Using model: xtts
[+] Generating payload using reference: sample_001.wav
[+] Target text: 'Why do we want intelligent terminals when there are so many stupid users?'
 > Text splitted to sentences.
['Why do we want intelligent terminals when there are so many stupid users?']
 > Processing time: 1.747211217880249
 > Real-time factor: 0.28126100451363373

[+] Success! Cloned audio saved to 'submission.wav'.
[+] Upload this file to the verification dashboard.
[ble: EOF]                                                                                     [ble: elapsed 24.214s (CPU 143.6%)] python3 solve.py
