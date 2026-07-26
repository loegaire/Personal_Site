---
title: "Triplet Tweak — Field Notes"
description: "Confirmed: pub.txt has three independent RSA tuples (ni,ei,ci), each about 1024 bits. Hint says same short d and suggests ki/d ≈ ei/ni. No source/service present. Initial lattice model: vectors (de1-k1n1, de…"
published: "2026-07-18"
updated: "2026-07-18"
event: "athenactf"
category: "Cryptography"
kind: "field-note"
status: "reference"
tags: ["Cryptography", "athenactf", "Field notes"]
readingTime: 1
wordCount: 51
featured: false
sourcePath: "~/ctf/athenactf/triplet_tweak/notes.md"
---

Confirmed: pub.txt has three independent RSA tuples (n_i,e_i,c_i), each about 1024 bits. Hint says same short d and suggests k_i/d ≈ e_i/n_i. No source/service present. Initial lattice model: vectors (d*e1-k1*n1, d*e2-k2*n2, d*e3-k3*n3, X*d), with errors from phi_i=n_i-(p_i+q_i)+1; basis rows [e1,e2,e3,X], [-n1,0,0,0], [0,-n2,0,0], [0,0,-n3,0]. Need tune X/LLL and validate d by gcd/inversion/decryption.
