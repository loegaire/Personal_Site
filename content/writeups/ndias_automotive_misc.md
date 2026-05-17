# Misc solves

This notes file covers the two non-warmup misc challenges:

- `Weird config updater`
- `Map data`

## Weird config updater

Service:

```text
nc 20.89.164.200 13337
serial: ae489873-895046f0-dac760e5
```

### Recon

- `HELP` shows:
  - `UPLOAD <size>`: send `2*size` hex chars, then a trailing newline
  - `FLAG`: only works if `mode == debug`
- Uploading small test ZIPs shows the validator requires a single `config.json`.
- The accepted content is exactly:

```json
{"mode":"release"}
```

- Any other `config.json` gives a SHA-256 mismatch.

### Bug

The validator and extractor disagree on concatenated ZIPs.

- Archive order `release || debug` fails validation, so validation reads the last ZIP.
- Archive order `debug || release` passes validation, but `FLAG` returns the flag, so the extraction/application path uses the first ZIP.

That gives a clean parser split:

1. First ZIP: `config.json = {"mode":"debug"}`
2. Second ZIP: `config.json = {"mode":"release"}`
3. Concatenate them and upload the combined bytes as one payload

### Flag

```text
FLAG{4n_1mp3r50n470r_h45_b33n_d3t3ct3d!}
```

## Map data

Attachment:

```text
Map data/dist-map_data.7z
```

### Recon

- The archive contains `1,000,000` PNG tiles.
- Using `7z l -slt` and grouping by CRC shows one outlier CRC with count `1`:

```text
C56150A3 -> maps/85/37/76.png
```

- The corresponding background tile CRC appears `999` times:

```text
BB9F2E0C
```

### Method

1. Extract the singleton tile `maps/85/37/76.png`.
2. Extract one normal `BB9F2E0C` tile as reference.
3. Diff the two images.
4. Only the bottom strip differs (`y = 233..251`).
5. Crop that strip and read the text.

Relevant artifacts created during solving:

- `scratch/map_outlier/maps/85/37/76.png`
- `scratch/map_outlier/maps/00/12/78.png`
- `scratch/map_outlier/outlier_crop.png`

### Flag

```text
FLAG{m1ll10n_f1l35_0n3_s1gn4l_XD}
```
