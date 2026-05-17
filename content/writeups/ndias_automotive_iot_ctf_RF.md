# D's Signpost progress

## Inputs
- Challenge archive: `dist-ds_signpost.7z`
- Extracted files:
  - `extracted/capture.sigmf-data` - 120,000,000 bytes
  - `extracted/capture.sigmf-meta` - SigMF JSON metadata
- SigMF metadata:
  - datatype: `cf32_le`
  - sample rate: 500,000 samples/sec
  - center frequency: 915,000,000 Hz
  - sample count: 15,000,000 complex samples
  - duration: 30.0 seconds

## Recon so far
- Generated initial plots:
  - `artifacts/power_timeline.png`
  - `artifacts/full_psd.png`
  - `artifacts/spectrogram_full.png`
- Full-capture spectrogram shows multiple transmissions/channels:
  - strong narrow carrier around -70 kHz
  - strong narrow carrier around +45 kHz
  - dotted OOK-like energy around -180 kHz
  - short bursty signal around +115 kHz
  - wider burst around +170 kHz
- Top PSD peaks from first pass:
  - +44.98 kHz
  - -70.01 kHz
  - +169.98 kHz
  - -179.99 kHz

## Decoded content
- Wave/channel around -180 kHz is OOK Morse.
  - Detection method: coherent carrier power in 1 ms blocks around -180 kHz.
  - Morse timing: dot about 71 ms, dash about 221 ms, letter gap about 229 ms, word gap about 529 ms.
  - Decoded text: `THIS FILE HAS 5 WAVES`

## Other channel observations
- +45 kHz channel:
  - Narrow FM/audio-like carrier active from about 10 s onward.
  - Extracted chunked FM-demod audio to `dumps/p45_fm.wav`.
  - Low-frequency waterfall crops:
    - `artifacts/audio_zoom/p45_10_15_hi.png`
    - `artifacts/audio_zoom/p45_18_23_hi.png`
  - The two useful groups are repeated speech. Local STT transcript:
    - `You know APRS? APRS has a super secret password`
- -70 kHz channel:
  - Strong narrow carrier for most of the capture.
  - Extracted chunked FM-demod audio to `dumps/m70_fm.wav`.
  - FM was not useful; AM/DSB extraction to `dumps/m70_am.wav` contains speech.
  - Local STT transcript for the useful phrase:
    - `to restore data in phase changes, decode each symbol by comparing it with the previous`
- +115 kHz channel:
  - Short compact multi-tone/FSK-looking packets around 13-14 s, 18-19 s, and 24-25 s.
  - Zoom plot: `artifacts/rf_zoom/p115_12_15.png`
  - FM demod shows Bell 202 AFSK tones around 1200/2200 Hz.
  - Decoded as AX.25/APRS at 1200 baud. All repeated packets decode to:
    - From/to: `N0CALL-1` -> `APCTF`
    - Info text: `>The password is dWt4Wxm6Xfn1ot02`
- +170 kHz channel:
  - Strong packet-like activity around 21.5-25.0 s.
  - Zoom plot: `artifacts/rf_zoom/p170_21_25.png`
  - Current hypothesis from -70 kHz voice: differential phase/DBPSK-like data. Symbol changes align to a 4 ms grid (about 250 baud).
  - Differential phase decoding now produces ZIP-like candidates under `dumps/p170_dqpsk/`.
  - `dumps/p170_dqpsk/cand_0.bin` contains `flag.txt`, central directory records, and data-descriptor ZIP markers, but its first byte is missing: it begins `4b 03 04` instead of `50 4b 03 04`.
  - Correct repair: prepend byte `0x50`, keep the stored central-directory offset `0x7b`, and trim 3 trailing demodulation bytes after the EOCD. The result is `dumps/p170_dqpsk/fixed_clean.zip`.
  - Extracted with APRS password `dWt4Wxm6Xfn1ot02` to `dumps/p170_dqpsk/extracted/flag.txt`.
  - Final flag: `FLAG{R4D10_FR3Q_L1TTL3_M4Z3}`

## Safety / resource constraints
- Do not build large full-capture spectrogram arrays in RAM.
- Use `np.memmap` or chunked reads for the 120 MB IQ file.
- Keep analysis windows small, usually one channel or one burst at a time.
- Save summaries/plots incrementally under `artifacts/` and update this file after each meaningful step.
