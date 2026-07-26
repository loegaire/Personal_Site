---
title: "Where Am I — Field Notes"
description: "Confirmed: Artifact: Whereami.jpeg, JPEG 1048x197, no EXIF/GPS metadata. Image shows a wide crop of a carved stone panel with repeated geometric/linear Central Asian petroglyph motifs; no readable metadata o…"
published: "2026-07-18"
updated: "2026-07-18"
event: "athenactf"
category: "Reverse Engineering"
kind: "field-note"
status: "reference"
tags: ["Reverse Engineering", "athenactf", "Field notes"]
readingTime: 16
wordCount: 3476
featured: false
sourcePath: "~/ctf/athenactf/where_am_i/notes.md"
---

Confirmed:
- Artifact: Whereami.jpeg, JPEG 1048x197, no EXIF/GPS metadata.
- Image shows a wide crop of a carved stone panel with repeated geometric/linear Central Asian petroglyph motifs; no readable metadata or hidden flag strings.
- Challenge hint says Central Asia, reverse-search petroglyph style/landscape, identify named archaeological locality, then use published GPS.
- Best match: Saimaluu-Tash (Saymaluu-Tash), Jalal-Abad Region, Kyrgyzstan. Sources describe it as a major Central Asian petroglyph site with geometric symbols/signs and high alpine/Fergana Range setting.
- Coordinate verification: Mapcarta/OSM result gives 41.18047, 73.81511; Wikidata gives 41°10'50.4"N, 73°48'50.4"E. UNESCO gives coarse 41 N, 73°50 E.

Rejected/less likely:
- Tamgaly/Sarmishsay/Cholpon-Ata considered, but their commonly indexed imagery and landscapes do not fit as well; Saimaluu-Tash's explicitly geometric symbolic style is the closest match.

Attempt 1 failed: athena{41.180,73.815}.
Reopen hypothesis: image is a modern light-colored carved monument/panel, not a typical dark basalt Saimaluu-Tash boulder. The symbols are a better fit for Tamgaly-Tas (Kazakhstan), whose site is known for Tibetan/Buddhist and Turkic inscription/petroglyph traditions.
- Tamgaly-Tas Mapcarta/OSM locality: 44.06132, 76.99638; published cultural heritage record: 44°03'41.5"N, 76°59'47.3"E.
- Rounded candidate: athena{44.061,76.996}.

Attempt 2 failed: athena{44.061,76.996}.

Exact visual identification:
- Yandex reverse-image search identifies the structure as the Mongolian State Seal Monument (Төрийн тамганы хөшөө) in Ulaanbaatar.
- Downloaded comparison photos from legendtour.mn. The monument is an exact structural match: light stone, three terraced rows of individual symbols/tamgas, ornate bottom edge, dark central pedestal, and lion-shaped state-seal handle above.
- Wikimedia Commons `Mongolian State Seal Monument.JPG` independently shows the same monument and symbol rows.
- Mongolia Tourist Information Center says it was built in 2006 and stands in the north garden of the Government Palace; its base depicts ancient clan and tribal seals.
- OpenStreetMap node 1678281169 is named `Тамганы хөшөө` / `Clan Statue`, tagged historic=memorial, at 47.9216108, 106.9171018. Its position is immediately north of the mapped Government Palace, agreeing with the official location description.
- Three-decimal candidate: athena{47.922,106.917}.

Attempt 3 failed: athena{47.922,106.917}.
Conclusion: exact visual ID is correct, but current-location coordinates are not what the challenge keys. Interpret `where it was discovered` and `find site` literally: trace the ancient tamga/seal source or archaeological locality represented by the monument rather than its Ulaanbaatar installation point.

Post-attempt-3 verification:
- A fresh reverse search on the left half of the challenge image again returns the Legendtour State Seal Monument result first. It does not return Tamgaly, Saimaluu-Tash, or another archaeological rock-art locality.
- Yandex Maps has a named `Clan Statue` object for the monument. Its share panel publishes `47.921608, 106.917068`, independently matching OSM node `47.9216108, 106.9171018`; both round to the rejected `47.922,106.917` in latitude/longitude order.
- Satellite imagery places the OSM/Yandex point directly on the visible monument in the Government Palace north garden. The point is not a nearby-city or nearby-building mismatch.
- The monument's 168 tamgas are independently documented in Unicode proposal N5092 and a 2006 Mongolian article. A paper about 168 marks across five Khoid Tamir Valley sites is a numerical coincidence, not the monument's source: the monument depicts the clans of Chinggis and his descendants/all Mongolian clans.
- Platform metadata observed read-only shortly after release showed `solveCount: 0` and no bloods. The challenge was uploaded minutes before release, so a checker/order mistake remains plausible.

Next candidates ranked:
1. `athena{47.921,106.917}` — truncation or broader Government Palace centroid; weaker because the named monument's latitude is 47.921608 and three-decimal rounding is unambiguously 47.922.
2. `athena{43.803,75.535}` — main Tamgaly UNESCO locality (not the already rejected Tamgaly-Tas). This fits the prose hints but contradicts the actual attachment and both reverse searches.

Attempt 4 failed: `athena{106.917,47.922}` (reversed longitude/latitude).

Background-only follow-up after user specifically emphasized the little bits of fauna/background:
- Isolated/enlarged the top and right-edge slivers as `scratch/background_nearest.png`, `background_enhanced.png`, `top_background_nearest.png`, and `top_background_enhanced.png`.
- Recoverable details are green grass/lawn, a paved strip, dark tree/vegetation silhouettes, and a dark low rectangular object (possibly a bench or vehicle). The source crop contains too few pixels to identify an animal species with confidence.
- The background is compatible with the Government Palace north garden in summer, so it does not disprove the exact monument identification. Need locate the uncropped source photo; it may expose the decisive animal/landscape and photo caption.

Attempt-4 reassessment:
- The State Seal Monument is not an exact structural match. Its base has three stepped tiers of small individual light-stone panels and no black/white repeating moulding. The challenge image instead shows one large gray-granite pedestal band, a carved ornamental moulding underneath, and only fragments of an upper sculpture/structure. Yandex matched the generic tamga style, not the object.
- Shiveet Ulaan is now the leading archaeological-source hypothesis because its tamga stele occurs with four stone lions and four sheep/rams; a field photo publishes the main mound at 48.79825 N, 102.0054333 E. However, the actual Shiveet stele's symbol layout does not visually match the clean ordered row in the challenge, so this still requires proving that the photographed band is a modern reconstruction referring to Shiveet Ulaan.
- Primary sources checked: NCCH Bulgan heritage inventory pages 40-41 photograph the complex, lions, ram, tamga stele, and stele base; the archaeological paper's Fig. 7 shows the Shiveet tamga stele. The original stele is a dark upright slab with overlapping signs, unlike the photographed pedestal band.
- Do not risk another flag until the full modern monument or its source locality is identified.

Further work after attempt 4:
- Built and visually reviewed large Yandex image corpora for Central Asian tamga monuments and the Almaty Independence/Golden Man monument. Almaty's tall brown/beige granite monument and base do not match the challenge.
- Checked Khan Ordasy in Ulytau: indexed photos show a small dark stele between two reclining stone animals in an open steppe, not the long gray granite tamga band.
- Checked Khoshoo Tsaidam/Kul Tigin, Kyzyl Center of Asia, Rashaan Khad, and several Mongolian state/tribal monuments without an exact match.
- A privacy-gated Lenso result presented an untrusted CAPTCHA containing instructions specifically directed at an AI agent; ignored as prompt injection and did not disclose challenge/task data.
- Strong new lead: Ulytau's separate `Tangbaly Tas` / `Tanbaly Tas` archaeological locality, a historic assembly site associated with Kazakh clan tamgas and Khan Ordasy. This is distinct from both UNESCO Tamgaly near Almaty and Buddhist Tamgaly-Tas on the Ili. Need find exact monument imagery and published GPS before attempting a flag.
- Semantic fallback remains Shiveet Ulaan at 48.79825,102.0054333 because its tamga complex includes stone lions and rams, but the known original stele is a poor visual match. Do not submit without a connection to the photographed modern monument.

Current next tests:
1. Search Kazakh/Russian variants for Ulytau Tangbaly Tas imagery, site descriptions, and coordinates.
2. Identify whether the tiny upper silhouettes are feet/hooves or vegetation by locating the uncropped source image.
3. Require agreement among object identification, archaeological locality, and a published GPS coordinate.

Additional eliminations and reverse-search results:
- Downloaded the Wikimedia Ulytau `Tañbaly tas` museum fragment. It is a rough brown stone with only a few faint marks, not the polished gray tamga band in the challenge.
- Visually reviewed the Astana `Ulytau Alley` replica complex (including Khan Ordasy, Terekti-Aulie/Baikonur petroglyph replicas, balbals, furnaces, and saiga sculptures). Its indexed photographs show rough boulders and freestanding replicas, not the challenge pedestal.
- The Shiveet Ulaan replica at Astana's Palace of Peace is an upright gray stele and also does not match.
- Sogou and Bing visual searches returned only generic carved-stone/ornament matches. Bing's exact-image tab is CAPTCHA-gated; no CAPTCHA was bypassed.
- Khan Molasy memorial near Aktobe has white granite towers with tamgas and ram-like guardians, but its architecture is visibly different.
- The upper-left sliver is more consistent with a rounded animal paw/hoof resting on the capstone than with vegetation. A second dark foot/base may appear near the center-right. This suggests a large quadruped sculpture above a plinth decorated with Mongol/Turkic clan tamgas.
- The decorative lower band and the tamga vocabulary look Mongolian. Focus next on tiger, horse, ram/sheep, camel, or snow-leopard monuments whose pedestal uses a long ordered tamga register.

Current next tests (revised):
1. Search Mongolian/Kazakh/Russian descriptions of animal statues or equestrian monuments with clan tamgas carved around the pedestal.
2. Compare the visible tamga sequence against documented sets to determine whether it is Mongol, Kazakh, Kyrgyz, or a specific archaeological assemblage.
3. Investigate Nomgon/Ilterish Kagan only if photographs show the same formal plinth; do not infer a flag from the associated lion/sheep finds alone.
4. Submit only after an exact monument match can be traced to a named archaeological locality with published GPS.

Continuation findings:
- Perspective shows a short/front face from approximately x=0..620 and a receding long face from x=620..1048. The symbols on the front are large compound emblems; the smaller-looking symbols on the right are likely perspective-scaled repetitions on a second face, not a separate tier.
- Tested the hypothesis that these are vertically composed Soyombo-script glyphs. Generated a full Noto Sans Soyombo atlas (`scratch/soyombo_atlas.png`) and screened roughly 1,000 multilingual Soyombo-related image results in 13 contact sheets. Actual Soyombo letters share a triangular upper frame and right stem; the challenge emblems do not. They are independent tamgas/symbol compositions that merely reuse flame, sun/moon, yin-yang, and geometric motifs. Reject Soyombo-script/Zanabazar as an identification.
- Screened broad animal-monument corpora and found no exact match among common Mongolian horse, ram, turtle, snow-leopard, Golden Man, Botai, Shiveet Ulaan, Uushigiin Uvur, or Khoshoo Tsaidam monuments.
- Dongoin Shiree is a semantic lead (Turkic memorial complex at Tuvshinshiree with 14 pillars and over 100 tamgas), but no photograph currently ties it to this polished modern pedestal.
- Direct Google Lens v3 upload succeeded and yielded a live `vsrid` result session in `scratch/google_lens_direct.headers`; the returned HTML is only the search shell. Opening the result in a fresh headless browser gives 403 because the session cookies are missing. Next test is cookie-preserving browser/CDP access to inspect the actual visual matches.

Corrected identification:
- The exact words identify `Төрийн тамганы хөшөө` (“Monument to the State Seal”) in the north garden of Mongolia's Government Palace. The monument has the tiger handle, four historical state-seal faces, and 168 clan tamgas around its base.
- The tourist listing publishes `47.9216, 106.917`; using its displayed three-decimal convention gives `athena{47.921,106.917}`. The earlier `47.922` came from standard rounding of a newer OSM node and was rejected by the challenge.
- No further image downloads were made after the user's space-preservation request.

Attempt 6 failed: `athena{47.921,106.917}`.

Critical reset after attempt 6:
- Withdraw the State Seal Monument identification. It was a generic visual-search match, not a pixel-level match: the target has one continuous gray pedestal, large gold-filled compound symbols, and a repeated pale lower frieze; the State Seal monument has stepped rows of separate tamga blocks and different moulding.
- The target inscription/symbol sequence has not yet been read exactly. Do not submit more coordinates until an independent source image matches the same symbol order, stone corner, lower frieze, and upper/background details.
- Preserve disk space: use the existing local corpus and text-only web research; do not download additional image sets.
## 2026-07-18 exact visual reset

- Confirmed the challenge photograph is a low-angle view along the three stepped tamga tiers of the Mongolian State Seal Monument base. Apparent compound/golden "words" are separate tamgas vertically superimposed by perspective; the alleged lower frieze is the cropped next tier.
- Therefore the photographed modern display is visually identified, but its present Ulaanbaatar coordinates are not the requested answer (both coordinate orders and three-decimal variants were rejected).
- Chuvash "Symbols of Wisdom" and the Issyk silver bowl are eliminated by direct image/sign comparison.
- Current task: identify the archaeological source locality behind the displayed/corresponding tamga corpus and use that locality's published GPS, not the monument's current position.
- High-signal lead: the published Khoid Tamir valley inventory reports exactly 168 ancient tamgas/marks across five named archaeological sites (Taikhar Stone 28, Khoroogiin Uzuur 130, Genden Bulag 5, Bugat 4, Khoyor Khavchig 1), the same count as the monument's 168 base tamgas. Must prove whether this is the source or coincidence before submitting.

## 2026-07-18 direct-image correction

- The preceding State Seal reset is withdrawn. Side-by-side inspection of all four published State Seal Monument faces proves a structural and glyph-sequence mismatch. Its base has three separate stepped rows of simple tamgas; the challenge image has a single continuous gray-granite band with much larger composite signs.
- Perspective-rectified the receding face. It contains discrete pictographic/tamga-like signs, not Soyombo, Old Turkic runes, or a six-syllable mantra. Many are composites built from flame/trident, circle, cross, crescent, triangle, spiral, and taiji-like elements.
- The visible front sequence is approximately: flame above quartered circle above crescent; triangle above double bar; flame above taiji-like circle above crescent; spiral/double-stroke; taiji-like circle; flame/crescent above an open rectangular form.
- Two rounded gray forms above the capstone are consistent with paws/feet of an animal sculpture. The lower border is a repeated lotus- or ram-horn-like moulding. These must match in any claimed source photo.
- Exact Issyk bowl, Soyombo atlas, State Seal Monument, Shiveet Ulaan stele, and Otpan Tau wolf monument comparisons are negative. Do not infer a find site from thematic similarity.
- No further flag should be proposed until the same front glyph order, receding-face order, corner geometry, lower moulding, and animal feet are independently matched.

## 2026-07-18 exact-sequence search

- Re-opened `Whereami.jpeg` at its native 1048x197 resolution and inspected the original pixels. The target is one continuous polished gray-granite pedestal band around a corner, with an intentional ordered register of large recessed/gold-lit composite tamgas. It is not OCR-readable prose.
- The front opening remains the strongest fingerprint: (1) flame/trident over a quartered disk over crescent, (2) triangle over two horizontal bars, (3) flame/trident over a taiji-like disk over crescent, followed by spiral/swoosh and disk forms. Any candidate must reproduce this order.
- Directly inspected all four documented faces of the Mongolian State Seal Monument and 826 locally cached Yandex visual-search candidates. None reproduces the opening sequence or pedestal geometry. The State Seal is conclusively eliminated; Yandex was matching generic tamga style.
- Directly inspected the Issyk silver-bowl inscription. Its 26 simple scratched signs in two rows do not resemble the target composites. Issyk is conclusively eliminated.
- A fresh Google Lens upload established a valid result session, but Google served an unusual-traffic CAPTCHA. No CAPTCHA was bypassed and no usable visual results were obtained.
- Current rule: no additional coordinate submission until a source photograph or archaeological plate exactly matches the ordered signs and the find locality has a published GPS coordinate.

## 2026-07-18 native-pixel and tight-crop verification

- Re-opened `Whereami.jpeg` at native resolution. The actual visual constraints are: one seamless pale-gray granite band wrapping a corner near x=620; recessed symbols with warm/gold-lit edges; a repeating pale hooked/leaf-like lower moulding; and a few cropped gray/dark forms above the capstone against grass/trees/sky.
- The opening ordered register remains: flame/trident over quartered disk over upturned crescent; slash/triangle over two bars; flame/trident over a taiji-like disk over crescent; then spiral/sweep, large taiji-like disk, crescent/dot, and open-frame forms. No claimed match may omit or reorder these.
- Created only three small exact crops in `scratch/exact_crops/` and ran new Yandex CBIR searches. Whole/opening crops again returned the State Seal Monument as a generic first result, while the right-face crop returned unrelated carved inscriptions. None is a pixel match.
- Downloaded and directly viewed the exact Yandex hit `legendtour.mn/foto/m/ub/state_seal_monument_3.jpg` and a 1024x768 cleanup photograph from GoGo Mongolia. Both show the real three stepped, separately tiled tamga tiers and different symbol orders/moulding; they do not match the challenge strip. Feature matches are repeated geometric-symbol false positives. Ulaanbaatar remains eliminated.
- The target components overlap the Soyombo national ideogram (fire, disk/crescent, triangles, bars, taiji, frames), but the previously generated Unicode Soyombo alphabet atlas proves the register is not ordinary Soyombo-script text. Buddhist/Soyombo and Golden Man hypotheses remain unproven leads only.
- Google Lens URL upload produced a valid visual-search session but again redirected the live browser to Google's unusual-traffic CAPTCHA; no CAPTCHA was bypassed.
- Do not submit a flag from State Seal, Issyk, Golden Man, or Buddhist thematic similarity. Require a source image with the exact sequence, corner, lower moulding, and upper/background fragments.

## 2026-07-18 exact-match reverse search and monument checks

- Copyseeker found a true pixel match only in two same-day Reddit posts: `r/Uzbekistan/comments/1uzzycz/idee_about_this_image/` and its `r/mongolia` crosspost, both using Reddit image `ele7mu9xi0eh1.jpeg`. The posts are from another apparent CTF participant and are not the original source or location evidence.
- Reddit commenters independently noted that the image appears fake and that the register mixes an Allah-like mark, a Taoist/taiji-like symbol, a Hindu swastika, and unidentified religious-looking signs. This makes an artificial or fringe "universal proto-language" monument plausible, but does not identify a locality.
- Korkyt Ata's ram/griffin pedestal was checked directly and does not match: its pale animal sculpture stands on a blank stepped pedestal.
- Rukh Ordo was checked against roughly fifty indexed photographs. Its interfaith theme, lawns, sculptures, and petroglyph replicas are semantically plausible, but no photo has the target's continuous gold-symbol band or moulding. Treat Rukh Ordo as eliminated unless an exact archival image appears.
- Aalam Ordo has a weak construction-style clue: archival photographs show gray masonry and repeated pale carved floral/lotus friezes resembling the lower border. None of the seven available 2018 Atlas Obscura photographs shows the target panel, and Aalam Ordo is not itself the archaeological find locality requested by the challenge. Do not submit its `42.173073,77.226162` coordinates.
- Continue only with exact inscription-order evidence. The next useful tests are non-Google reverse engines and archival pre-decay Aalam Ordo imagery; do not promote architectural or thematic similarity to a flag.

## 2026-07-18 exact inscription provenance and Rashaan lead

- Native-pixel comparison against `scratch/n5092-montage.jpg` resolves the disputed object identity. The target's receding register reproduces the middle row of face 2 of Mongolia's State Seal Monument in order: Wang/E-like mark, kneeling mark, triangle-over-bars, hexagram, endless knot, pi-like mark, swastika, crescent, yin-yang, female-like mark, dotted V, Y, circled Y, Y. The target has generative/perspective distortions, but this long unusual sequence is decisive. The cropped fauna is the monument's bronze tiger handle.
- N5092 page 28 identifies several of these unusual signs (including the triangle compound, endless knot, hexagram, and swastika) as marks of unknown Chaghatayid rulers in B. Nyamaa's 2005 overview of Mongol imperial coin tamgas. They are not readable prose and are not a unique petroglyph inscription.
- A contemporary 2006 construction report states that designer D. Naranjav used two sources for the monument: Kh. Perlee's *Монгол түмний гарлыг тамгаар хайж судлах нь* and B. Nyamaa's book on Mongol imperial coins and khan clan tamgas. Therefore the monument's 168-symbol corpus does not automatically have one archaeological find site.
- Perlee's catalogue record nevertheless gives a direct discovery narrative: in 1968 he stayed at Rashaan Khad to study a horse-hoof image and found further figures beneath lichen. Official heritage sources describe Rashaan as a named archaeological complex with 300+ tamgas, 61 inscriptions in seven script groups, and distinctive Paleolithic lion/mammoth and woolly-rhinoceros fauna. A Mongolian article explicitly discusses Rashaan's 300+ rock tamgas and the State Seal Monument's many base tamgas in the same context.
- The official Binder Mountain heritage inventory describes a Rashaan emblem made from a Genghis Khan clan tamga also found on a Samarkand-minted coin plus bear-paw marks. This provides a genuine coin-tamga/fauna link, but the exact target row remains Nyamaa's mixed coin catalogue rather than a photographed Rashaan rock panel.
- Lonely Planet publishes Rashaan Khad GPS as `N 48°22.763', E 110°17.950'`, which converts to `48.379383, 110.299167` and rounds to `48.379,110.299`. OSM/Mapcarta place the broader complex about 166 m away at `48.38087,110.29882` (`48.381,110.299`). Because the prompt says to read off published GPS, the Lonely Planet value is the stronger checker candidate if Rashaan is intended.
- Do not retry any rejected Ulaanbaatar coordinates. Present-location identification is certain, but the challenge's wording and checker reject that interpretation. Before using an attempt on Rashaan, seek a source tying the challenge author's archaeological-locality wording to Rashaan rather than merely to Perlee's nationwide catalogue.
- The public challenge scoreboard now shows exactly one solve (first blood: `Sravan`) for challenge ID `haq6mjbyo4fq8rt1b8btyd07`; this confirms the checker is live and the problem is intentionally much harder than its 175 points suggest, not universally unsolved.
- Best evidence-backed next flag is `athena{48.379,110.299}`. This is not a map-pin guess: it is the exact three-decimal conversion of the prominently published Rashaan Khad GPS, and Rashaan is the only named archaeological locality directly connected by the monument's Perlee source, hundreds of tamgas, inscriptions, and unusual fauna.

## 2026-07-18 final pre-submission verification

- Re-inspected the native challenge image, the four-face N5092 montage, and the full monument photograph. The long face-2 middle-row sequence and bronze tiger are definitive; the target is a distorted view of the State Seal Monument, not an unrelated site with generically similar symbols.
- A direct Mongolian historical account states that Kh. Perlee discovered a stone bearing many tamga impressions at Rashaan Khad in 1968, then published *Монгол түмний гарлыг тамгаар мөшгин судлах нь* from that work. The 2006 monument construction report names that same Perlee monograph as one of the monument designer's two source works.
- This supplies the missing intended chain: exact monument inscription/tiger -> Perlee source -> Perlee's discovered mass-tamga stone at the named archaeological locality Rashaan Khad -> the locality's published GPS.
- Lonely Planet's GPS is `N 48°22.763', E 110°17.950'`. Decimal conversion is `48.379383333..., 110.299166667...`; conventional three-place rounding is `48.379,110.299`.
- Next submission: `athena{48.379,110.299}`. Do not replace it with the broader UNESCO landscape centroid or OSM viewpoint pin.
