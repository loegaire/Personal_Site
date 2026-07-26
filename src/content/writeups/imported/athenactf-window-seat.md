---
title: "Window Seat — working notes"
description: "Recover a commercial flight from the original aircraft-window photograph. Primary pivots: EXIF GPS coordinates and original creation timestamp. Flag format: athena{FLIGHTAIRLINESEAT}. Preserve rampiflight.jp…"
published: "2026-07-18"
updated: "2026-07-18"
event: "athenactf"
category: "Reverse Engineering"
kind: "field-note"
status: "solved"
tags: ["Reverse Engineering", "athenactf", "Field notes"]
readingTime: 3
wordCount: 556
featured: false
sourcePath: "~/ctf/athenactf/window_seat/notes.md"
---

# Window Seat — working notes

## Challenge requirements

- Recover a commercial flight from the original aircraft-window photograph.
- Primary pivots: EXIF GPS coordinates and original creation timestamp.
- Flag format: `athena{FLIGHT_AIRLINE_SEAT}`.
- Preserve `rampiflight.jpg` unchanged.

## Confirmed facts

- Artifact: `rampiflight.jpg`; SHA-256
  `7607ff1fa48c666fc0b9c5be9fcdfd705f196a14c44c0d3a737740edce25339a`.
- JPEG dimensions: 824x759. The visible aircraft is a conventional under-wing twinjet,
  most consistent with the Airbus A319/A320 family; the photo appears to be from the
  right-hand side.
- EXIF GPS: 50 deg 8 min 12.23 sec N, 11 deg 50 min 18.11 sec E =
  `50.1367314, 11.8383636`, near Muenchberg, Bavaria, Germany. (The raw
  latitude seconds are 12.233; ExifTool's compact display rounds them.)
- EXIF `DateTimeOriginal`: `2022-03-06 15:04.67`. There is no timezone-offset tag.
  The nonstandard punctuation/seconds make sub-minute interpretation unreliable,
  but the date and 15:04 minute are unambiguous.
- ADS-B Exchange's public Globe replay archive still exposes the historical half-hour
  binary captures for the date. A local decoder in `scratch/parse_adsbx_heatmap.py`
  successfully recovers callsigns, positions, altitudes, and speeds.
- At 15:04:40 UTC the closest track is AHO235C / hex 3CE212 (D-CMXM), about
  5.5 km from the EXIF point (closest sampled approach about 3.6 km). It is an
  Embraer Phenom 300 business jet with rear-mounted engines, so it cannot be the
  aircraft shown and does not fit the requested commercial-flight flag.
- Plausible scheduled Airbus tracks nearby at 15:04 UTC include:
  - EIN64W / EI-DVJ, Aer Lingus A320, 18.5 km at the timestamp (track closest
    approach about 5.8 km, but later at 15:05:50).
  - EWG4344 / OE-LYZ, Eurowings Europe A319, 20.1 km at its adjacent sample.
  - GWI7175 / D-AGWV, Eurowings A319, 27.7 km at the timestamp.
  - THY97B, Turkish A321neo, 34.0 km at the timestamp.
- Sherlock found an aviation-specific account for the named traveler at
  `https://my.flightradar24.com/rampi`. The profile currently exposes 1,363 logged
  flights through its public flight-list endpoint.
- Public record 730 is an exact date match:
  `2022-03-06 | LH1944 | MUC -> BER | 14:15-15:25 | DLH | A320 | D-AIWD | 22F`.
  The departure/arrival window contains the EXIF time, the route passes the GPS
  region, the aircraft family matches the photo, and seat 22F is a right window.
- The reproducible evidence extract is
  `artifacts/rampi-2022-03-06-entry.json`; its source endpoint is
  `https://my.flightradar24.com/public-scripts/flight-list/rampi/700`.

## Failed or weak hypotheses

- Exact-phrase web searches for the prompt and generic searches for uploader
  `rampi` did not reveal a challenge write-up or an attributable travel post.
- Yandex reverse image search found only visually similar wing-view videos/images,
  not an exact source. Google Lens was blocked by an automated-traffic challenge;
  Bing Visual Search failed to process the upload.
- The scenic landscape in the pixels does not match the flat/rolling terrain at the
  GPS point, so the image pixels alone may be illustrative, edited, or taken at a
  different moment than the embedded coordinate.
- Nearest-track-only selection would produce AHO235C, but aircraft geometry and
  the commercial-flight requirement conclusively reject it.
- Comparing only distance to replay tracks initially made 15:04 UTC look stronger
  than German local time. The exact public trip-log match overrides that heuristic:
  the intended 15:04 is inside LH1944's local 14:15-15:25 travel window, while the
  UTC-nearest aircraft is incompatible with both the photo and prompt.

## Current hypothesis

- Solved. The username's public flight log is the authoritative join between the
  EXIF date and the otherwise missing seat. Use passenger flight number `LH1944`,
  airline ICAO code `DLH`, and seat `22F`.

## Final flag

`athena{LH1944_DLH_22F}`

## Next tests

- None; `solve.py` verifies the original image hash, EXIF values, evidence extract,
  and final flag.
- A standalone solution narrative is available in `writeup.md`.
