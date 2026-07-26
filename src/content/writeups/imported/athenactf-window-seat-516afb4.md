---
title: "Window Seat — AthenaCTF OSINT Writeup"
description: "We are given an aircraft-window photograph uploaded by a traveler named rampi. The original image retains its metadata, and the required flag format is:"
published: "2026-07-18"
updated: "2026-07-18"
event: "athenactf"
category: "OSINT"
kind: "writeup"
status: "solved"
tags: ["OSINT", "athenactf", "Writeup"]
readingTime: 3
wordCount: 487
featured: false
sourcePath: "~/ctf/athenactf/window_seat/writeup.md"
---

# Window Seat — AthenaCTF OSINT Writeup

## Challenge

We are given an aircraft-window photograph uploaded by a traveler named `rampi`.
The original image retains its metadata, and the required flag format is:

```text
athena{FLIGHT_AIRLINE_SEAT}
```

The goal is to recover the flight number, airline code, and seat number.

## 1. Extracting the image metadata

First, preserve and identify the supplied image:

```bash
$ file rampiflight.jpg
rampiflight.jpg: JPEG image data, Exif standard, 824x759

$ sha256sum rampiflight.jpg
7607ff1fa48c666fc0b9c5be9fcdfd705f196a14c44c0d3a737740edce25339a  rampiflight.jpg
```

Running ExifTool exposes the two fields mentioned in the hint:

```bash
$ exiftool -GPSLatitude -GPSLongitude -DateTimeOriginal rampiflight.jpg
Date/Time Original              : 2022-03-06 15:04.67
GPS Latitude                    : 50 deg 8' 12.23" N
GPS Longitude                   : 11 deg 50' 18.11" E
```

Converting the coordinates to decimal gives approximately:

```text
50.1367314, 11.8383636
```

This is near Muenchberg in Bavaria, Germany. The timestamp is malformed—the
separator and seconds are not standard EXIF—but the date `2022-03-06` and the
minute `15:04` are clear.

The photograph itself shows an under-wing engine and wing consistent with the
Airbus A319/A320 family. It was taken from a right-side window, so the eventual
seat should end in `F` on the usual six-abreast layout.

## 2. Pivoting on the traveler name

Searching only historical aircraft tracks leaves several flights in the area and
does not reveal a seat number. The challenge deliberately supplies the traveler
name, so it is also an OSINT pivot.

Username enumeration with Sherlock finds an aviation-specific profile:

```bash
$ sherlock rampi --print-found --no-color
[+] Flightradar24: https://my.flightradar24.com/rampi
```

The important result is [rampi's public myFlightradar24 profile](https://my.flightradar24.com/rampi),
which contains the traveler's flight log, including aircraft and seat information.

## 3. Reading the historical flight log

myFlightradar24 loads public flight records from this endpoint pattern:

```text
https://my.flightradar24.com/public-scripts/flight-list/USER/OFFSET
```

The profile has more than a thousand records, so the endpoints can be paginated in
steps of 50 until the dates reach 2022. If Cloudflare blocks a direct command-line
request, Jina's text proxy can retrieve the public response:

```bash
curl -sS \
  'https://r.jina.ai/https://my.flightradar24.com/public-scripts/flight-list/rampi/700'
```

Searching that page for the EXIF date reveals public record 730:

```text
Date:         2022-03-06
Flight:       LH1944
From:         MUC
To:           BER
Departure:    14:15
Arrival:      15:25
Airline:      DLH
Aircraft:     A320
Registration: D-AIWD
Seat:         22F (Window)
```

The [public flight-list response](https://my.flightradar24.com/public-scripts/flight-list/rampi/700)
therefore provides all three missing flag fields. It also corroborates the image:

- The flight occurred on the exact EXIF date.
- `15:04` falls inside the logged `14:15–15:25` flight window.
- Munich to Berlin passes through the region represented by the GPS coordinates.
- The logged A320 matches the visible under-wing aircraft geometry.
- `22F` is a right-side window seat, matching the photograph.

## 4. Avoiding the ADS-B false lead

A historical ADS-B replay search at exactly `15:04 UTC` produces a closer aircraft,
`AHO235C`. That aircraft is an Embraer Phenom 300 business jet with rear-mounted
engines. It cannot be the aircraft visible in the image and does not fit the
challenge's commercial-flight premise.

This is an important OSINT lesson: the EXIF timestamp has no timezone tag and is
not perfectly formatted, so the geometrically nearest replay track is not enough.
The exact-date record in the named traveler's public log is the stronger join, and
it is the only source that independently supplies the requested seat number.

## 5. Building the flag

The passenger flight number uses Lufthansa's IATA prefix, while the airline field
in the public log uses the three-letter ICAO code:

```text
Flight number: LH1944
Airline code:  DLH
Seat:          22F
```

Substituting those fields into the requested format gives:

```text
athena{LH1944_DLH_22F}
```

## Flag

`athena{LH1944_DLH_22F}`

The accompanying [`solve.py`](/Personal_Site/media/writeups/athenactf-window-seat-516afb4/solve.py) verifies the original image hash, parses
the EXIF timestamp and GPS coordinates, loads the preserved public-log evidence,
and prints the flag.
