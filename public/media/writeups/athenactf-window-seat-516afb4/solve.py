#!/usr/bin/env python3
"""Verify the image metadata and emit the OSINT-derived Window Seat flag."""

import hashlib
import json
from pathlib import Path

from PIL import Image


BASE = Path(__file__).resolve().parent
PHOTO = BASE / "rampiflight.jpg"
ENTRY = BASE / "artifacts" / "rampi-2022-03-06-entry.json"
EXPECTED_SHA256 = "7607ff1fa48c666fc0b9c5be9fcdfd705f196a14c44c0d3a737740edce25339a"


def dms_to_decimal(parts, ref):
    degrees, minutes, seconds = (float(value) for value in parts)
    decimal = degrees + minutes / 60 + seconds / 3600
    return -decimal if ref in {"S", "W"} else decimal


def main():
    digest = hashlib.sha256(PHOTO.read_bytes()).hexdigest()
    assert digest == EXPECTED_SHA256, "challenge image has changed"

    exif = Image.open(PHOTO).getexif()
    captured = exif.get_ifd(0x8769)[0x9003]
    gps = exif.get_ifd(0x8825)
    latitude = dms_to_decimal(gps[2], gps[1])
    longitude = dms_to_decimal(gps[4], gps[3])

    trip = json.loads(ENTRY.read_text())
    assert captured.startswith(trip["date"])
    assert abs(latitude - 50.1367314) < 1e-7
    assert abs(longitude - 11.8383636) < 1e-7

    flag = f"athena{{{trip['flight']}_{trip['airline_code']}_{trip['seat']}}}"
    print(f"EXIF: {captured} @ {latitude:.7f}, {longitude:.7f}")
    print(
        f"Public log: {trip['date']} {trip['flight']} "
        f"{trip['origin']}->{trip['destination']} {trip['airline_code']} seat {trip['seat']}"
    )
    print(flag)


if __name__ == "__main__":
    main()
