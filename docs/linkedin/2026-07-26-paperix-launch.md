---
date: 2026-07-26
target: Paperix (iOS document scanner, doc-scan repo)
angle: personal-motivation lead, proof beat second
status: scheduled
scheduled_time: 2026-07-27 14:30 EST
---

I built Paperix because I didn't want my documents leaving my phone. It's an iOS document scanner, it's on the App Store, and it's free.

If an app is free, you're usually the product. Not here, for a boring reason: it was a tool for me first, so there was never anything to sell. No subscription, no ads, no account, no watermark, no servers.

Don't take my word for it. Turn on App Privacy Report in iOS Settings → Privacy & Security — it's Apple's log, not mine, and it records every domain an app contacts. Other apps will fill it. Paperix's network list stays empty. Or leave airplane mode on permanently; the app works exactly the same.

📄 Point the camera, capture pages, get a searchable PDF
🔍 Full-text search across everything you've scanned
✍️ Sign and mark up a page — it stays searchable after you save
🔒 Password-protect an export, or lock the app behind Face ID
🗣️ "Hey Siri, scan a document with Paperix", or the home-screen widget

This is early work and it shows in places. There's a Report a problem form in the app — it takes feature ideas too — or email paperix.wjgf9@simplelogin.com.

App Store: https://apps.apple.com/app/id6770402925
All features: https://abhijitbansal.github.io/paperix-site/features.html
Site: https://abhijitbansal.github.io/paperix-site/

## Alternates considered

- **Free-because-I-built-it-for-myself** — opened on the "if you're not paying, you're the product" rule and broke it with the personal-tool origin. Same beats, but spending the opener on the aphorism made the app itself arrive third; the chosen version gets the same work done with the motive up front.
- **Proof-lead** — opened on App Privacy Report and let verifiability carry the whole post. Strongest single idea, but leading with proof asks the reader to care about the claim before they know what the app is.

## Voice-guide deviations (author-directed, both rounds)

The approved post deliberately breaks parts of `voice-guide.md`. Recorded here so a future pass doesn't "fix" them back:

- **Category 4 (emoji/formatting) suspended for the bullet list only.** The author asked for emoji feature bullets after finding the fully plain draft flat. One emoji per bullet, 5 bullets, none decorative outside the block.
- **Categorical shade is sanctioned**, unnamed only. The "if an app is free, you're usually the product" line is commentary on the category; naming CamScanner or any competitor, or alleging that an identifiable company sells data, stays out.
- Categories 1 (hype), 2 (growth-hacker structure), 3 (overclaiming) and 5 (detail-as-flex outside the bullets) were enforced in full across three critic passes.

## Facts fixed during drafting

- **Siri phrase is "Scan a document with Paperix"** (`Paperix/AppIntents.swift:29`). The README's "scan a document in Paperix" matches no registered phrase — drafts that used it were wrong.
- **No in-app path named.** There is no Settings screen; "Report a problem" lives in the About sheet (`Paperix/AboutView.swift:307`), reached from an unlabeled on-device toolbar pill. Two drafts invented "Settings → Report a problem"; the post says "in the app" instead.
- **App Privacy Report must be turned on first** — it's off by default, so "check it, it's empty" is meaningless without that instruction. "Other apps will fill it" supplies the contrast.
- **"Network list", not "shows nothing"** — Paperix legitimately appears under Data & Sensor Access (camera, Photos). The narrower claim is the true one.
- **"No watermark" is supported** (`marketing/app-store-listing.md:45`, `:64`). One drafting pass claimed otherwise after a grep that missed the marketing directory.
- **No iOS version stated** — sources conflict (`marketing/app-store-listing.md` says iOS 26+, the repo README says iOS 16+). Worth reconciling separately.
- **Cut as detail-as-flex:** the optional Apple Intelligence layer (summaries, cross-document Q&A), framework names (Vision, PencilKit, SwiftUI), "no third-party dependencies", import-from-Files, Recently Deleted, AirPrint, the OCR backfill, and the v1.6.0 version number.

## Blocking follow-up before this posts

The `All features` link points at `site/features.html`, which at line 142 still tells readers to verify with **Little Snitch or Lulu** — both macOS-only firewalls that cannot be installed on an iPhone. Same stale advice at `site/index.html:179` and `marketing/app-store-listing.md:97` in the doc-scan repo. It directly contradicts this post's proof beat. Fix that copy to App Privacy Report / airplane mode, or drop the link.
