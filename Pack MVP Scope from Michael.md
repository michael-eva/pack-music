Draft 1 · 20 September 2026 · For agreement

# The Pack MVP scope, wireframes and roadmap

A shared draft for Extensa Studio and MetaGen, so both can agree with The Pack who builds what and in what order.

**MVP**Living Labs pilot**Pilot money**Ledger only, payouts simulated**Size**115 requirements, 26 wireframes, 29 decisions

Sections

[Read this first](#start)[Principles](#rules)[Who does what](#who)[The package](#package)[Functional spec](#spec)[Wireframes and journeys](#wireframes)[Data model](#data)[Payments](#pay)[Roadmap](#roadmap)[Partnership](#partner)[Decisions](#decisions)[Risks](#risks)[Gaps](#sources)

Section 1

## Read this first

This is the working draft of a partnership proposal for The Pack and MetaGen, to determine which features and functionality sit best with each entity, and how we best integrate systems for mutual benefit.

#### The Pack - Project Manager

Read the six decisions below. They unblock the most work. Every recommended default is a suggestion, not a ruling.

#### Extensa Studio Manager

Read sections 3 to 8. Estimate requirements in section 5 as S, M or L, and challenge anything you would split. Section 10 lists questions for you.

#### MetaGen - Project Manager

Read sections 3 and 4, then section 10. Orange boxes mark where this draft relies on conversations between The Pack & MetaGen. Please correct any of them.

What this draft assumes

The MVP will culminate in the **Living Labs pilot**: a small invited cohort of artists and a handful of businesses run the whole model with a person checking each step. At pilot, all transactions are **ledger only**: entries are written and statements shown, but payouts are simulated. Anything the pilot does not need sits in a later phase (section 9).

### How to read the tags

| Tag | Meaning |
| --- | --- |
| Pack builds | Extensa Studio builds it in collaboration with The Pack. |
| MetaGen | MetaGen has either built, or will build it. The Pack does not build it. |
| Both | Each side has a piece. The split is written in the requirement. |
| Owner open | Nobody has agreed who owns it yet. A decision is needed. |
| Must | Needed for the Living Labs pilot to run. |
| Should | Desired in the pilot. Drop it first if time is short. |
| Later | Not in the pilot. Sits in a numbered phase in section 9. |
| Open Decided | State of a decision in the register (section 11). |

### What changed from earlier scopes (Pack)

| Earlier assumption | This draft | Why |
| --- | --- | --- |
| The Pack builds and hosts the full music catalogue / database. | The Pack still builds and hosts the full catalogue and database, but it is populated via the MetaGen metadata portal. Music upload is included as part of the process (on the MetaGen side), but once the artist uploads, MetaGen does not store the tracks. | This is how Merida describes MetaGen. It also keeps the artist’s data theirs. |
| The Pack builds metadata forms, ID look-ups, splits agreements, the AI declaration, artist verification, loudness measurement, genre and diversity data, and tagging screens. | MetaGen does all seven. The Pack validates lightly, enforces the AI answer, and levels loudness at playback. Diversity data is a later phase, unless it is already built into MetaGen’s metadata collection (ask A12). | Developer brief of 20 September 2026. |
| Real payouts from the first pilot. | Ledger only. Payouts are simulated. Real payouts through Stripe Connect are Phase 2. | Free-trial businesses bring in no revenue to share (section 8). The maths still gets proven (D-11). |
| Requirements written as broad feature lists. | 115 numbered requirements, each with a test, an owner and a Must or Should. | So a developer can estimate and a tester can sign off. |
| Whoever builds it holds the code and accounts. | The co-op owns repository, hosting, domain, storage and keys from day one (NFR-8). | So a change of developer never again costs the co-op its work. |

### Six key decisions

Each is a recommendation with an owner. The full register of 29 is in section 11.

| ID | Decision | Recommended default | Owner | Needed by |
| --- | --- | --- | --- | --- |
| [D-01](#D-01) | Where the package lands | The Pack portal. It keeps sign-in and access with us and matches Merida’s flow description. | Pack PM / MetaGen PM | Phase 0 |
| [D-02](#D-02) | Which DDEX message and version | Confirm with Merida and build the parser accordingly. In general streaming would support ERN 3.8 and 4.x. Spreadsheet first regardless. | MetaGen PM | Phase 0 |
| [D-03](#D-03) | Pack target schema | Extensa (Michael) finalises sections 4 and 7 of this draft as schema v1. Test it with both Michael and Merida before it is frozen, then send it to Merida with the wireframes. | Pack PM / Extensa | Phase 0 |
| [D-07](#D-07) | AI declaration policy | Build the gate as a configurable list of accepted answers. Pilot default: accept only No. Decide at board level whether any uses of AI are acceptable (i.e. non-generative tools), and what happens after a false declaration (hold earnings, remove from playlists, review). | Pack Board / MetaGen PM | Before pilot |
| [D-08](#D-08) | Payment structure: per stream or per song, and the publishing side | Keep user-centric by share of streams at each site (the public 70/30 commitment). Treat “per song” as the track-level split. Treat per stream (at 30 secs minimum listen time) as trigger for payment. Confirm with Merida. | Pack PM / MetaGen PM | Phase 0 |
| [D-16](#D-16) | Hosting | Ask Serversaurus and Rackmill for a CapRover test. Prefer Australian jurisdiction to match the data sovereignty commitment. Keep Cloudflare only for audio delivery if needed, documented publicly. | Pack PM / Extensa | Phase 0 |

Section 2

## Principles and rules

These come from the co-op’s own non-negotiables. Each one is tied to requirement IDs a tester can check, so they hold when the developer changes.

| Principle | What it means in the build | Checked by |
| --- | --- | --- |
| **Human curation, listener-controlled recommendations** | Humans pick what plays in businesses and on curated playlists. Over time, business playlists may be influenced by listener recommendations, and new music may be suggested algorithmically, so playlists evolve as new music enters the catalogue. Any recommendation to a listener is based on preferences that listener sets, and they can change or switch it off. Nothing is ranked by paid placement. | [CUR-1](#CUR-1), [CUR-6](#CUR-6), [D-24](#D-24) |
| **No Facebook or Google login** | Email and password or a magic link. No third-party identity SDKs. No ‘big tech’ influence or tracking. | [ACC-1](#ACC-1), [LIS-3](#LIS-3) |
| **Honest to businesses about licensing** | Businesses are told plainly that The Pack does not replace their OneMusic licence. | [VEN-7](#VEN-7), [D-25](#D-25) |
| **Artists own their data** | Export, withdraw and erase their music and metadata. Original packages are kept untouched for audit. | [DAT-1](#DAT-1), [DAT-2](#DAT-2), [DAT-3](#DAT-3), [ING-8](#ING-8) |
| **Local first, by geofencing and tagging** | Every artist, release and site carries a region tag. Local music is brought forward by matching a business’s location (geofencing) to those tags, not by local curators picking by hand. | [CAT-5](#CAT-5), [CUR-1](#CUR-1), [CUR-5](#CUR-5) |
| **Fair, checkable reconciliation** | Whole cents, largest-remainder rounding, an append-only ledger, and statements that reconcile to it. | [PAY-3](#PAY-3), [PAY-4](#PAY-4), [PAY-5](#PAY-5), [PAY-9](#PAY-9), [PAY-10](#PAY-10) |
| **AI use is declared, and enforced** | The artist makes the declaration at metadata collection in MetaGen, and it is underwritten by Pack policy. The Pack enforces it: a declaration must be present and answered No, or a person reads it. A disputed answer pulls a track and holds its money. | [ING-5](#ING-5), [RTS-6](#RTS-6), [D-07](#D-07) |
| **Listener privacy** | Saves and visits belong to the listener. By default, businesses and artists see counts only. A listener can choose to interact publicly with the ecosystem, so they visibly support artists and businesses. Minimum data at sign-up. | [LIS-6](#LIS-6), [LIS-7](#LIS-7), [DAT-5](#DAT-5), [NFR-6](#NFR-6) |

### Roles

Six roles for the pilot. Each sees only its own scope. “Own” means their own records only.

| Capability | Artist | Business owner | Business staff | Listener | Curator | Admin |
| --- | --- | --- | --- | --- | --- | --- |
| Upload packages, see own releases | Own | · | · | · | · | All |
| Confirm splits, sign agreements | Own | · | · | · | · | View |
| See own earnings statements | Own | · | · | · | · | All |
| Export data, withdraw a release | Own | · | · | · | · | On request |
| Manage business and site profile | · | Own | View | · | · | All |
| Add or remove business staff | · | Own | · | · | · | All |
| Operate the business player (play, skip, remove etc) | · | Own | Own | · | Preview | View |
| See player health and uptime | · | Own | · | · | View | All |
| View Now playing, save to “Heard somewhere real” | · | · | · | Own | · | · |
| Tag tracks with business-fit descriptors | · | · | · | · | Yes | Yes |
| Set business-level genre and content preferences (genres, explicit lyrics) | · | Own | View | · | View | All |
| Build and assign playlists | · | · | · | · | Yes | Yes |
| Review, approve, hold or reject releases | · | · | · | · | View | Yes |
| Take down content, flag a declaration | · | · | · | · | · | Yes |
| Change policy settings, run month-end | · | · | · | · | · | Yes |

Section 3

## Who does what

The artist completes the metadata and music upload process in MetaGen, which produces one package that includes the licensing splits. The package is checked and ingested into The Pack catalogue through The Pack upload portal. A QR code in a business, at the point of sale or on a table, is the physical way in for listener engagement.

Figure 1. One package crosses from MetaGen to The Pack. There is no shared database. MetaGen keeps the metadata, but does not store the music package once it reaches The Pack, and never touches playback, listeners or money.

### The artist’s journey

| # | Step | What happens | Who | Requirements |
| --- | --- | --- | --- | --- |
| 1 | **Invited by The Pack** | Admin sends an invite link tied to a cohort. The artist creates an account and accepts the terms, then joins as a Full member by reading and accepting the Co-op Rules. The upload portal stays closed until they have. | Pack builds | [ACC-3](#ACC-3), [ACC-7](#ACC-7), [ACC-8](#ACC-8), [ACC-9](#ACC-9) |
| 2 | **Set up in MetaGen** | The artist installs the free MetaGen Lite app. Merida’s team can pre-load released-track data so the catalogue starts filled in. | MetaGen |  |
| 3 | **Prepare the release** | Songs, people, splits, AI declaration, discovery tags, release grouping. Splits go to contributors by email. | MetaGen |  |
| 4 | **Convert to The Pack** | The Converter runs its checks and produces one package: audio, artwork and metadata. | MetaGen |  |
| 5 | **Upload the package** | The artist clicks ‘Convert to The Pack’ to upload it into the portal. Large files resume if the connection drops. | Pack builds | [ING-1](#ING-1) |
| 6 | **Automatic checks** | The Pack reads and checks the package, then reports errors in plain language with the next step. | Pack builds | [ING-2](#ING-2) to [ING-7](#ING-7) |
| 7 | **Fix and re-upload if needed** | Data problems are fixed in MetaGen and converted again. Portal problems go to a Pack admin. | Both | [ING-6](#ING-6), [ING-7](#ING-7) |
| 8 | **Agree and confirm who gets paid** | The artist accepts the Artist Agreement, declares their rights position and confirms the payout split. | Pack builds | [ART-3](#ART-3) to [ART-5](#ART-5) |
| 9 | **Human review** | A Pack reviewer checks rights, AI declaration, loudness and genre, and listens through. | Pack builds | [RTS-1](#RTS-1), [RTS-2](#RTS-2), [ADM-2](#ADM-2) |
| 10 | **Live** | The release is tagged, curators can use it, and business plays start earning on the ledger. | Pack builds | [CUR-1](#CUR-1), [PAY-1](#PAY-1) |
| 11 | **Monthly statement** | The artist sees earnings by business and month, marked simulated in the pilot. They also see listener information, de-identified. | Pack builds | [PAY-9](#PAY-9) |

### Responsibility matrix

Twenty-five capabilities, with MetaGen’s position as we understand it, and what The Pack still has to do about each.

| Capability | MetaGen position | Status | The Pack action | Owner |
| --- | --- | --- | --- | --- |
| **Song and contributor metadata capture** | Guided sections: Start, People, Composition, Recording, Discovery. Adapts to the answers given. | Built | Nothing. No credit, writer or performer forms for artists. | MetaGen |
| **Identifier look-ups** | IPI, IPN, ISNI, ISRC and ISWC handled, with look-ups against Spotify, Apple Music and MusicBrainz. | Built | Nothing. No ID validation or look-up service. | MetaGen |
| **Pre-setting-up artists from released-track data** | Merida plans to pull released-track data from 10+ public and private databases so artists start with their catalogue filled in. | Planned | Send Merida the cohort list (artist names and links) so she can pre-load them. | Both |
| **Release grouping** | Group songs into a single, EP or album, with track order and existing codes. | Built | Nothing. | MetaGen |
| **Splits agreements** | Emails writing splits to contributors and keeps dated records of requests and confirmations. | Built | Store the resulting splits only. No agreement workflow. | MetaGen |
| **Package validation (Converter)** | Checks a song against DDEX standards, reports what is missing, and delivers a package only when checks pass. Public listings call the Converter beta. | Built | Light validation on receipt. Data arrives clean, so we do not repair it. | MetaGen |
| **AI Use declaration and Verified Human Creator ID** | Each song carries an AI declaration answered by the artist. Each artist gets a public Verified Human Creator ID page. A declaration, not detection. | Built | Enforce the answer at ingestion (configurable policy). Show the ID link on artist pages. Own the policy for a false declaration. | Both |
| **Loudness measurement** | Measures each track to EBU R128 at delivery. Not a mastering service. | Built | Normalise at playback to our target. No mastering or loudness API to source. | Both |
| **Genre and discovery tagging** | Discovery fields, free text for story and cultural reference points, and a bespoke Pack list once we supply it. | Offered | Supply the taxonomy (section 4). Curators add the business-fit layer. | Both |
| **Mapping MetaGen output to The Pack format** | Merida offered to do the mapping once she knows our format. | Offered | Deliver our target schema first (D-03). Order matters: our schema, then her mapping. | Both |
| **Spreadsheet package format** | Starts on MetaGen’s spreadsheet format so the first artists can move immediately. | Built | Spreadsheet parser first. | Both |
| **DDEX ERN delivery** | Planned as the durable path, co-designed with us. Public listings mention RIN and RDR-N instead of ERN. | To confirm | ERN parser in Phase 2 once the message and version are confirmed (D-02). | Both |
| **Audio and artwork bundled with metadata** | One package per release: song files, art and metadata together, all checks passed. | Built | Accept, store and process it. | Both |
| **Where the package lands** | How music and the package get from MetaGen to The Pack, and whether the transfer is automated, is to be confirmed with Merida. | To confirm | Portal recommended (D-01). Decides exactly what The Pack completes for catalogue hosting. | Both |
| **ISRC issuing** | Planned for MetaGen. | Planned | Nothing until we accept new (not previously released) music. Phase 2. | MetaGen |
| **Sample package and spreadsheet template** | Merida to provide, so Extensa sees real fields, layout and loudness values. | To confirm | Parser reads the sample before the schema is frozen. | MetaGen |
| **Accounts, sign-in and access control** | MetaGen never touches listeners, subscriptions or access. | Pack | Build (module ACC). | Pack |
| **Storage of catalogue, files, identifiers and splits** | The metadata stays with MetaGen. MetaGen does not store the music package once it has been uploaded to The Pack. The artist’s data stays with the artist. | Pack | Build (modules CAT, ING). The biggest single piece. | Pack |
| **Ingestion and error reporting after upload** | MetaGen reports gaps before delivery, inside the app. | Pack | Build (module ING). Plain-language errors after upload. | Pack |
| **Playback, playlists, business player, listener page** | In current development completion scope for The Pack. | Pack | Build (modules PLY, CUR, VEN, LIS). | Pack |
| **Payments and payouts from stored splits** | In current development completion scope for The Pack. | Pack | Build (module PAY). Ledger only in the pilot. | Pack |
| **Label-permission gateway and rights checks** | A policy-level decision for The Pack on independent label permissions: all Pack payouts go direct to artists, not via third-party rights holders. | To confirm | Manual process in the pilot, tooling in Phase 2 if necessary (D-15). | Pack |
| **Artist data controls** | Data remains with the artist. Export and erasure of the metadata MetaGen keeps is to be confirmed with Merida (A14). | To confirm | Build (module DAT): see, export and remove what The Pack holds. | Both |
| **Onboarding journey and UX** | Merida expects the UX to become clearer once she sees our wireframes and user stories next to her roadmap. | To confirm | The Pack to slightly rework journeys around the MetaGen portal processes. MetaGen supplies content for its own app. | Both |
| **Diversity data, legal and licence-back fields** | Possible MetaGen features. | To confirm | Not in the pilot. Raise for Phase 3 (D-23). | Both |

Section 4

## MetaGen meets Pack package

Ingestion is where the two projects join. This section is the proposed process, so both sides can mark it up.

Order matters

Merida has offered to do the mapping once she knows our format. So the sequence is: The Pack’s schema (D-03), then the sample package (A1), then the mapping. The field table below is a starting proposal, not a final schema.

### Proposed package layout

```
kestrel-road-ep.pack.zip              (proposed. To confirm with Merida, ask A1)
├─ manifest.json                     release ID, version, file list, SHA-256 checksum for each file
├─ metadata.xlsx                     MetaGen spreadsheet in Phase 1. A DDEX ERN file (release.xml) later
├─ audio/
│   ├─ 01-long-way-down.wav
│   └─ 02-tide-tables.wav
└─ artwork/
    └─ cover.jpg
```

One package per release. A corrected re-delivery is a new version of the same release, never an overwrite (ING-7). The original package is stored untouched (ING-8).

### Field contract

What The Pack is likely to receive. **Reject** means it does not go live until fixed. **Hold** means a person decides.

| Field | From | Required | Rule | If it fails | Note |
| --- | --- | --- | --- | --- | --- |
| `release.title, release.type` | MetaGen | Required | Single, EP or album. Track order present. | Reject |  |
| `release.upc` | MetaGen | Required | Twelve or thirteen digits with a valid check digit. Unique in catalogue. | Hold if duplicate. Reject if malformed. | Re-releases already have one. |
| `release.original_release_date` | MetaGen | Required for re-releases | A real date. For a new release it may be in the future. | Warn | MetaGen lets an artist start when a song is first conceived, so packages can arrive well before release (to confirm with Merida). |
| `release.pack_release_date` | MetaGen or artist (to confirm) | Optional | The date the release goes live on The Pack. It may be in the future, so an artist can upload early and release later. Blank means live as soon as it is approved. A date already passed also means live once approved. | Warn | Whether the package carries it, or the artist sets it in The Pack, is to confirm with Merida. See CAT-8. |
| `release.label, p_line, c_line` | MetaGen | Required if label-signed | Text present when the rights declaration says label-signed. | Hold | Feeds the label gateway (D-15). |
| `release.artwork` | MetaGen | Required | Square RGB JPEG or PNG. Proposed minimum 1400 px, recommended 3000 px. | Reject | Proposed sizes; confirm with Merida. |
| `artist.name, artist.creator_id_url` | MetaGen | Name required, ID link optional | Name matches the invited account or goes to Hold. | Hold | Verified Human Creator ID link shown on artist page. |
| `track.isrc` | MetaGen | Required (re-releases) | Twelve characters in ISRC format. Unique. | Reject if malformed. Hold if duplicate. |  |
| `track.iswc` | MetaGen | Optional | ISWC format when present. | Warn if missing on an original composition |  |
| `track.title, track.version_title` | MetaGen | Required | Text present. | Reject |  |
| `track.audio` | MetaGen | Required | Lossless (WAV or FLAC) matching the manifest checksum. Duration within one second of metadata. | Reject | Accepted formats to confirm with Merida. |
| `track.loudness (integrated LUFS, true peak, LRA)` | MetaGen | Integrated required | Numeric, plausible range (−40 to 0 LUFS). | Hold if missing. Warn if the cross-check differs by more than 0.5 LU | ING-10, PLY-1. |
| `track.ai_declaration` | MetaGen | Required | Present, with answer, who answered and when. Answer must be on the accepted list. | Reject or Hold (per policy setting) | Default accepted answer: No. Decision D-07. |
| `track.contributors` | MetaGen | Required | At least one writer and one performer, each with a name and role. IPI, ISNI and IPN optional. | Reject |  |
| `track.splits` | MetaGen | Required | Each split type totals exactly 100%. | Reject | Pack payout split is built from these and confirmed by the artist (ART-5). |
| `track.genre_parent, track.subgenre` | MetaGen & Pack | Required | Both values on the current Pack list version - to cross-check. | Hold | Section 4 taxonomy. |
| `track.descriptors` | Pack & MetaGen | Optional | Values on the business-fit list. | Ignore unknown values | Curators add most of these. |
| `track.story, track.cultural_refs` | MetaGen | Optional | Text. Cultural reference points follow the WIPO-standard field Merida described. | None | Shown, never used to rank. |
| `track.language, track.explicit` | MetaGen | Required | Language code. Explicit flag true or false. | Reject if explicit missing | CUR-7. |
| `package.manifest` | MetaGen | Required | Package ID, release ID, version, created time, generator version and SHA-256 for every file. | Reject | Proposed layout below; Merida to replace with the real one. |

### Errors, in words an artist can act on

Every error has a code, a plain message, and a named person who fixes it (ING-6). These are the first eight. The full list is written with the parser.

| Code | Outcome | What the artist sees | Fixed by |
| --- | --- | --- | --- |
| E101 | Reject | We couldn’t open this package. It may have been cut off while uploading. Try uploading it again. If it fails a second time, message the co-op. | Artist |
| E204 | Reject | Track 3, “Long Way Down”, is missing its audio file. Open the release in MetaGen, check the song has its audio attached, then press Convert to The Pack again. | Artist in MetaGen |
| E310 | Reject | The AI question for “Night Bus” hasn’t been answered. Open the song in MetaGen, answer the AI question, convert again, and upload the new package. | Artist in MetaGen |
| E311 | Hold | You answered Yes to the AI question for “Night Bus”. A person at The Pack will read your answer and get back to you. You don’t need to do anything yet. | Pack admin |
| E402 | Reject | The writing splits for “Ocean Teeth” add up to 98%. They need to total 100%. Fix the splits in MetaGen and convert again. | Artist in MetaGen |
| E520 | Hold | The ISRC for track 2 is already in The Pack catalogue on another release. A person will check whether this is a re-release or a mix-up, usually within two working days. | Pack admin |
| E601 | Hold | The genre “Dubstep Deluxe” isn’t on The Pack list yet. Choose the closest genre in MetaGen’s Discovery section, or tell us what’s missing so we can consider adding it. | Artist or Pack admin |
| E730 | Warn | This track’s loudness reading differs slightly from our own check. It will still go to review. No action needed. | Pack admin |

### What happens to a package

Figure 2. Release lifecycle. The same state words appear for artists, admins and the database (CAT-4). A fixed package restarts at Received as a new version. An approved release with a future date waits as Scheduled (CAT-8).

### Genre, and where business tagging fits

The MetaGen genre list was reviewed for this draft. A few potential proposals follow.

| Finding | Examples | Proposal / query |
| --- | --- | --- |
| **Duplicated across parents** | Electropop (Pop and Dance), Bossa Nova (Latin and Jazz), Vocal Jazz (Jazz and Easy Listening), Mellow Gold (Rock and Folk), Blues Rock (Rock and Blues), Soft Rock (Pop and Rock). | A track then has two parents. Pick one parent per sub-genre. Query - is it better to choose one parent per sub-genre, or is the redundancy useful? |
| **Streaming-service artefacts** | Entries such as Classify, Escape Room, Talent Show, Social Media Pop, Viral Pop and Post-Teen Pop read like automatically generated micro-genres, not how a business owner or artist describes music. | Query - remove? Keep terms people actually say, checked against what individual listeners and businesses look for. Artists may also want tracks tagged for other uses, such as social media, which could be a further layer. The Pack’s own genre list can be added to MetaGen’s list and aligned with it. |
| **Local relevance** | Australian Country is the only Australian sub-genre. “Native American” sits under World. There is no First Nations category. | Consult first (TAX-4). Add local terms artists use. The genre taxonomy is likely to shift for each country The Pack works in, so plan for it to be localised. Ideally Aboriginal and TSI music could eventually be surfaced by language group or nation. |
| **Business tools** | A café owner might be likely to ask for “mellow morning music”, not “Indie Cafe Pop”. | Add the business-fit layer below. The Pack can provide an initial list of business genres and “playlist vibes” for the MVP, to be expanded on the site later. |

#### Three layers, three owners

| Layer | Who sets it | What it holds |
| --- | --- | --- |
| **1. Genre** | Artist, in MetaGen Discovery fields | 15 parent genres and a short curated set of sub-genres per parent. One parent per sub-genre. Versioned list with stable IDs. |
| **2. Business fit** | Curator, in Pack Admin (artist suggestion optional) | Setting (café, bar, restaurant, retail, salon, gym, waiting room, market, visitor centre). Energy (low, medium, high). Time of day (morning, afternoon, evening, late). Vocals (instrumental, sparse, vocal-led). Tempo band (slow, mid, fast). Values proposed; curators refine. |
| **3. Place and story** | Artist, in MetaGen | Home region from the 12 WA regions. Language. Free-text story or inspiration. Cultural reference points (Merida describes a WIPO-standard field). Artists describe their own community; nobody else assigns it. |

Section 5

## MVP functional specification

115 numbered requirements across 14 modules, for the Living Labs pilot. Each has a test in plain words, an owner, and a Must or Should. Ask Extensa Studio to estimate each ID as S, M or L.

| Module | Reqs | Must | Should | Pack | MetaGen or both | Owner open |
| --- | --- | --- | --- | --- | --- | --- |
| [ACC](#mod-ACC) Accounts, roles and access | 10 | 8 | 2 | 10 | 0 | 0 |
| [ART](#mod-ART) Artist onboarding and agreements | 5 | 5 | 0 | 4 | 1 | 0 |
| [ING](#mod-ING) Package upload and ingestion | 10 | 9 | 1 | 10 | 0 | 0 |
| [RTS](#mod-RTS) Rights review and the label gateway | 6 | 4 | 2 | 5 | 0 | 1 |
| [CAT](#mod-CAT) Catalogue, storage and search | 8 | 6 | 2 | 8 | 0 | 0 |
| [PLY](#mod-PLY) Playback and loudness | 7 | 5 | 2 | 6 | 1 | 0 |
| [TAX](#mod-TAX) Genre and business tagging | 5 | 2 | 3 | 2 | 2 | 1 |
| [CUR](#mod-CUR) Curation and playlists | 8 | 6 | 2 | 8 | 0 | 0 |
| [VEN](#mod-VEN) Businesses and the business player | 10 | 9 | 1 | 10 | 0 | 0 |
| [LIS](#mod-LIS) Listener: what’s playing here | 11 | 6 | 5 | 11 | 0 | 0 |
| [PAY](#mod-PAY) Payments engine (ledger only in the pilot) | 13 | 11 | 2 | 13 | 0 | 0 |
| [ADM](#mod-ADM) Admin console | 8 | 6 | 2 | 8 | 0 | 0 |
| [DAT](#mod-DAT) Artist data ownership | 5 | 5 | 0 | 4 | 1 | 0 |
| [NFR](#mod-NFR) Platform, security and delivery | 9 | 8 | 1 | 9 | 0 | 0 |
| **Total** | **115** | **90** | **25** | **108** | **5** | **2** |

### Accounts, roles and access

ACC, 10 requirements

The pilot is invite-only, so The Pack controls who gets in. Sign-in is email and password or a magic link. No third-party login appears anywhere.

ACC-1

Sign in with email and password or a magic link. No Facebook, Google or other third-party login, and no third-party auth SDKs in the build.**Test.** Every auth screen shows only email, password and magic link. A dependency scan finds no third-party identity SDK.

Must Pack builds

ACC-2

Roles for the pilot: Artist, Business owner, Business staff, Listener, Curator, Admin. Each role sees only its own screens and data (permission matrix in section 5).**Test.** Automated tests confirm a Listener cannot reach any Artist, Business or Admin route, and each role cannot read another account’s data.

Must Pack builds

ACC-3

Artist sign-up is invite-only. An Admin issues single-use invite links tied to a cohort label (for example “Living Labs 1”). Only invited artists can reach the upload portal.**Test.** An uninvited email address cannot create an Artist account. An invite link works once and expires after a configurable period.

Must Pack builds

ACC-4

A business is any business that plays recorded music, such as a café, bar, shop, salon or gym, and has one or more sites. Each site has its own player, playlist assignment, QR code and monthly pot. Admin creates businesses for the pilot; the owner adds staff by link. Businesses move to self-serve sign-up alongside artists from Phase 2.**Test.** A staff member can operate the player for their site and cannot see other sites or any billing settings.

Must Pack builds

ACC-5

Email verification, password reset, session expiry, sign-in rate limiting, and an audit log of every Admin action (who, what, when, before and after).**Test.** Five failed sign-ins in ten minutes locks the attempt path for that account. Every Admin write appears in the audit log.

Must Pack builds

ACC-6

Admin can act as another user for support. A visible banner shows throughout, a reason is required, and the session is logged.**Test.** No impersonation session can start without a reason. The banner cannot be dismissed while impersonating.

Should Pack builds

ACC-7

First sign-in records acceptance of the Terms, Privacy Policy and, for artists, the Artist Agreement (document version, user, timestamp). Joining the co-operative is a separate step (ACC-8).**Test.** A new version of any document forces re-acceptance at next sign-in. Acceptance history is exportable.

Must Pack builds

ACC-8

Co-op membership. A membership has a class: Full member (artists, with co-operative voting rights) or Associate member (businesses, listeners and government, without voting rights). It starts only when the person reads and accepts the current Co-op Rules, and every class must accept them. Each acceptance records the Rules version, class, member and timestamp. A new version of the Rules asks for re-acceptance. Admin can see and export the member register. Voting tools come in Phase 5, but the class is recorded from the start.**Test.** An artist cannot become a Full member without accepting the current Co-op Rules. Every membership record shows the Rules version and time it was accepted.

Must Pack builds

ACC-9

Membership gates. Membership is its own step straight after account creation, separate from the Terms (ACC-7) and the Artist Agreement (ART-3). An artist cannot open the upload portal, and no release enters review, until their Full membership is active. A business cannot activate a site player until its Associate membership is active. Listener accounts follow decision D-27.**Test.** An invited artist who has not accepted the Rules sees the Rules and nothing else. After accepting, the upload portal opens. A business site cannot go on air until its owner has accepted.

Must Pack builds

ACC-10

A separate, voluntary "Open data project" consent, offered to every member type — listeners, artists and businesses — never bundled with the Terms (ACC-7) or the Co-op Rules (ACC-8). Artists and businesses see it as its own unticked checkbox alongside sign-up (C1, B1); listeners see it at subscription (D-27), alongside the genre and vibe picker (LIS-10). The screen explains the project in plain English, including its value to the music industry, research and government decision-making. Data shared is aggregated to SA2 level, never below, and never identifies a member. A member can opt out at any time from Me/settings; opting out stops future data being included but does not withdraw already-published aggregates.**Test.** Declining this consent never blocks sign-up, membership or subscription. The consent is logged separately from the Terms and Co-op Rules acceptances, with its own version and timestamp. No exported or published aggregate contains a cell built from fewer than the agreed SA2 minimum.

Should Pack builds

### Artist onboarding and agreements

ART, 5 requirements

MetaGen does the data work. The Pack owns the invitation, the guided handover to MetaGen, the agreements, and the confirmation of who gets paid.

ART-1

Artist profile with public display name, private legal name, home region (the 12 Western Australian regions used in the data collection spec), short bio and links. Photo is optional.**Test.** Legal name is never shown publicly. Region is a controlled list.

Must Pack builds

ART-2

In-portal guide for the four-step journey: get MetaGen, prepare a release, press Convert to The Pack, upload. Includes a checklist of what must be ready first (mastered files, artwork, ISRCs, AI question answered, genre chosen from The Pack list). The Pack builds the screens. MetaGen supplies the wording and screenshots for its own app.**Test.** A first-time artist completes their first upload without contacting anyone (measured in the pilot).

Must Both

ART-3

Artist Agreement shown before the first upload: permission to stream, licence-back grant, payment terms and data-ownership commitments, in plain English. A signed copy is stored and downloadable.**Test.** No release can enter review without an accepted current agreement. The exact wording is Pack legal text; the build makes it configurable.

Must Pack builds

ART-4

Rights declaration per release: the artist confirms they are free to distribute the recordings and states any existing recording, label or distribution contract.**Test.** Release cannot be submitted for review without the declaration. Contract details go to the Rights review (RTS-1).

Must Pack builds

ART-5

“Who gets paid” confirmation: the artist reviews the payout split built from MetaGen’s contributor splits and confirms it before review. The confirmed split is stored with a timestamp and used by the payments ledger.**Test.** Shares on every track total exactly 100%. A later change creates a new dated split and never rewrites past ledger entries.

Must Pack builds

### Package upload and ingestion

ING, 10 requirements

This is where the two projects join. MetaGen delivers one package per release. The Pack receives it, checks it lightly, maps it to the Pack schema (section 4) and reports problems back in plain language.

ING-1

Artists upload one package per release through the portal. Uploads are chunked and resumable, with progress shown. Size limit is configurable and sized for a 60-minute 24-bit 48 kHz album (about 1 GB); default limit 2 GB (proposed).**Test.** A 1 GB package uploads over a throttled connection and resumes after the connection drops.

Must Pack builds

ING-2

Ingestion runs in the background, never in the web request. The artist sees the state at all times: Received, Checking, Needs attention, In review, Live.**Test.** Killing a worker mid-job leaves the job resumable. No state is shown that the job has not reached.

Must Pack builds

ING-3

Parsers sit behind one internal schema. The spreadsheet parser ships first. A DDEX ERN parser is added in Phase 2 without touching the rest of the pipeline. Which ERN version MetaGen writes is confirmed by Merida (decision D-02).**Test.** The same fixture package produces identical catalogue records through either parser.

Must Pack builds

ING-4

Light validation only: files match the manifest and checksums, every track has audio, required fields are present, splits total 100%, identifiers are well formed, and ISRC and UPC values are not already in the catalogue.**Test.** Fixture packages with each fault produce the matching error code from the error table (section 4).

Must Pack builds

ING-5

Policy gates decide Reject, Hold or Accept with warning. Gates: AI declaration present and accepted, loudness present, audio and artwork meet spec, genre on The Pack list, rights status present. The accepted AI answers are a configurable setting, not hard-coded (decision D-07).**Test.** Changing the accepted-answers setting changes the outcome for the next package with no code change.

Must Pack builds

ING-6

Every error has a code, a plain-language message, who fixes it (artist in MetaGen, or Pack admin) and the exact next step. Messages follow The Pack voice: warm, specific, solution first.**Test.** Content review: no message uses jargon such as “schema”, “manifest” or “parse”.

Must Pack builds

ING-7

Re-delivery creates a new package version of the same release. Admin sees a field-by-field diff. Changes to splits, contributors, identifiers or the AI declaration always force human review. Audio replacement is flagged. Play history and ledger entries are never deleted or rewritten.**Test.** Re-delivering a package with one changed split lands in review with that split highlighted.

Must Pack builds

ING-8

The original package is stored untouched and immutable alongside the parsed record, for audit, disputes and the artist’s data export.**Test.** The stored package hash equals the hash at upload.

Must Pack builds

ING-9

Audio pipeline: keep the lossless master, create streaming renditions, and generate artwork sizes. Rendition format is chosen after the device tests in PLY-6. Start with one rendition; a bitrate ladder comes in Phase 2.**Test.** Every live track has a master, at least one rendition and artwork at four sizes, all checksummed.

Must Pack builds

ING-10

Cross-check loudness on ingest: measure the delivered master once and warn the reviewer if it differs from MetaGen’s value by more than 0.5 LU (proposed). This is one library call, not a measurement service (decision D-05).**Test.** A fixture with a tampered loudness value raises a warning, not a rejection.

Should Pack builds

### Rights review and the label gateway

RTS, 6 requirements

A person reviews every release before it goes live. Any label or distributor negotiation is between the artist and that label, not something The Pack administers. The Pack pays artists directly, so labels and publishers agree to that before their artists appear.

RTS-1

Per-release rights checklist in Admin: unsigned, independent-label-signed, distributor-signed or unknown, taken from the artist’s own declaration (ART-4). Only unsigned and independent-label artists are eligible, so a release by a major-label-signed artist cannot be approved. Stores the declared status, reviewer, decision and date.**Test.** A release marked major-label-signed cannot be approved. A release marked independent-label-signed or distributor-signed can be approved on the artist’s declaration alone, with no permission document required.

Must Pack builds

RTS-2

A release goes live only when rights status is cleared, the AI declaration is accepted, the artist has confirmed the split and a reviewer has listened through it. The approver and time are recorded.**Test.** The Approve button stays disabled while any gate is open, and says which one.

Must Pack builds

RTS-3

The Pack does not seek or chase label or distributor permission on the artist’s behalf: no permission letter, no recorded reply. That negotiation is the artist’s and the label’s own matter. The rights checklist relies on the artist’s declaration alone (decision D-15).**Test.** No release is held or rejected for a missing permission letter. Nothing in Admin can request or record one.

Must Pack builds

RTS-4

Admin can take down any release or track at once, with a reason. It leaves all playlists and players within five minutes (proposed) and the artist is told.**Test.** A taken-down track stops appearing in the next-track choice on every active player.

Must Pack builds

RTS-5

Capture publisher name and whether writers are APRA AMCOS members, from the package where present. How writers signed to a publisher are paid is an open policy decision (D-14).**Test.** Fields are stored and visible in review. No payout rule depends on them until D-14 is settled.

Should Owner open

RTS-6

Disputed AI declaration: Admin can flag a track. It leaves playlists, its ledger accruals are held, and the artist is notified. The outcome process is a board decision (D-07).**Test.** Flagging removes the track from every playlist and freezes its accruals until cleared.

Should Pack builds

### Catalogue, storage and search

CAT, 8 requirements

The Pack holds the catalogue, the audio files and the identifiers. MetaGen keeps the artist’s metadata but does not store the music package once it reaches The Pack. This is the biggest new piece of The Pack build.

CAT-1

Catalogue model: artist, release, track, contributor, identifiers, splits, AI declaration, loudness, discovery fields and assets, as set out in section 7.**Test.** Sample package from MetaGen loads with no field dropped or invented.

Must Pack builds

CAT-2

S3-compatible object storage for masters, renditions, artwork and original packages, with checksums, versioning and encrypted backups. Files stay in The Pack’s own accounts.**Test.** A restore drill recovers a deleted master from backup.

Must Pack builds

CAT-3

Search for Admin and Curators by title, artist, ISRC, genre, descriptor, region, loudness and status. Postgres full-text first. A search engine is added only when this hurts.**Test.** Search returns within one second on a 5,000-track test catalogue.

Must Pack builds

CAT-4

Release lifecycle: Received, Checking, Needs attention, Held, Rejected, In review, Approved, Scheduled, Live, Withdrawn, Taken down (figure 2, CAT-8). Every transition is logged with actor and reason.**Test.** Illegal transitions, such as Rejected to Live, are refused by the service, not just hidden in the UI.

Must Pack builds

CAT-5

Local first: every artist, release and site carries a region so Curators and, later, discovery can surface local music to local listeners.**Test.** Curator search can filter to one region and to the artist’s home region.

Must Pack builds

CAT-6

Identifier store with uniqueness rules: ISRC per track, UPC per release. A duplicate goes to Hold for a person to decide, not to an automatic overwrite.**Test.** Two releases cannot share an ISRC without an Admin override that is logged.

Must Pack builds

CAT-7

Contributors are people, not free text. The same person on two releases is matched by IPI, ISNI or IPN when present, never by name alone.**Test.** Two different people called Sam Lee stay separate unless an identifier links them.

Should Pack builds

CAT-8

Release date on The Pack: an approved release with a future date stays Scheduled until that date, then goes Live with no admin action. With no date, or a date that has passed, it goes Live as soon as it is approved. A Scheduled release does not appear in playlists, on business players or on statements, and earns nothing on the ledger until it is Live. The artist can change the date until the day before it (proposed).**Test.** A release approved with a date next week cannot be picked by a curator or played by any player until that date. It then goes Live on its own.

Should Pack builds

### Playback and loudness

PLY, 7 requirements

MetaGen measures loudness at delivery to the EBU R128 broadcast standard. The Pack evens out levels at playback to a target it chooses. Artists’ masters are never altered.

PLY-1

Read the per-track loudness measurement from the package. Ask MetaGen to deliver integrated loudness (LUFS), true peak and loudness range, and to name the tool and version used.**Test.** Ingest stores all three values and the measurement tool. A missing integrated value is a Hold.

Must Both

PLY-2

One loudness target set in Admin. Common streaming references are −14 LUFS and −16 LUFS; businesses get a per-site trim of ±6 dB (proposed) for quiet cafés and loud bars. The choice is D-05.**Test.** Changing the target changes playback level on the next track with no re-ingest.

Must Pack builds

PLY-3

Apply gain per track: target minus measured. Boost is capped by the track’s true-peak headroom so it never clips. Dev may apply gain in the player or bake it into the streaming rendition, whichever tests better on iPad and Android tablet. The master is never touched.**Test.** Twenty mixed tracks played back-to-back stay within 2 LU of each other at the output (proposed pass mark).

Must Pack builds

PLY-4

Gapless playback and a short crossfade option for business playlists.**Test.** No audible gap between two gapless album tracks.

Should Pack builds

PLY-5

The player reports play events to the API (see PAY-1), and queues them locally when the network drops.**Test.** A five-minute offline period loses no play events.

Must Pack builds

PLY-6

Device test before build sign-off: business player on an Android tablet, an iPad and a desktop browser, with the screen awake and asleep. Extensa reported that iOS stops PWA audio when backgrounded (WebKit bug 198277). Re-test on current iOS before committing to a native wrapper.**Test.** Written test result per device, attached to the repo.

Must Pack builds

PLY-7

Lock-screen and media-key metadata (title, artist, artwork) through the Media Session API.**Test.** Now-playing details appear on an Android lock screen.

Should Pack builds

### Genre and business tagging

TAX, 5 requirements

MetaGen offers Discovery fields and will set up a bespoke Pack list. The Pack supplies the taxonomy and the curators add the business-fit layer that playlists are built from.

TAX-1

Pack genre list v1 delivered to Merida as a controlled list with version and stable IDs. Package carries parent genre and sub-genre. Unknown values go to Hold. Section 4 recommends how to prune the current list.**Test.** A package with an off-list genre is held with the message in error E601.

Must Both

TAX-2

Business-fit descriptors as a second controlled list (setting, energy, time of day, vocals or instrumental, tempo band). Curators add and edit them in Admin. Artists can suggest via MetaGen Discovery fields where offered.**Test.** A Curator can tag 20 tracks in under five minutes using bulk edit.

Must Pack builds

TAX-3

Free-text story or inspiration and cultural reference points (which Merida notes follow a WIPO standard) are stored and shown on the artist and track pages. They are never used to rank or promote.**Test.** Text renders exactly as delivered, with no truncation in storage.

Should Both

TAX-4

First Nations and other community music: the current list has no such category and files “Native American” under World. Consult with First Nations artists and advisers on how artists describe their own music before the list is locked. Self-description first; a curator never assigns it.**Test.** Written agreement with named advisers is on file before Phase 1 sign-off.

Should Owner open

TAX-5

Taxonomy versioning: entries are retired, never deleted, and every release records the list version it was tagged against.**Test.** Retiring a tag keeps old releases intact and removes it from new choices.

Should Pack builds

### Curation and playlists

CUR, 8 requirements

Human curation is a public commitment. Every playlist names the person who made it, and no screen says “recommended for you”.

CUR-1

Curators build playlists by filtering (genre, descriptors, region, energy, loudness range) and then picking by hand. Each playlist shows “Curated by \[name\]” wherever it appears.**Test.** No playlist can be published without a named curator.

Must Pack builds

CUR-2

Playlist rules checked as the curator works: no artist twice in a row, no track repeated within a set window, minimum duration (defaults are settings).**Test.** The builder flags a rule break and names the two tracks involved.

Must Pack builds

CUR-3

Assign a playlist to one or more sites. Assignment is versioned, so a change is a new version with a start time.**Test.** Reassigning a playlist changes what the site plays at the next track boundary.

Must Pack builds

CUR-4

Preview playback in Admin with loudness normalisation applied, so the curator hears what the business will.**Test.** Preview level matches the business player level for the same track.

Must Pack builds

CUR-5

Exposure view: how many playlist slots and plays each artist has had in the past 30 days, so a curator can spread opportunity. This informs a person; it never picks anything.**Test.** The view lists every live artist, including those with zero plays.

Should Pack builds

CUR-6

Copy rule for every screen: “Curated by \[name\]” is an accountable, rule-checked editorial pick — a Pack curator (D3) or a named business-staff member (B5) — filtered and checked against the playlist rules before it goes live. “Chosen by \[name\]” is a person’s own, informal picks with no filtering or rule-checking behind it, such as a listener’s personal playlist. Both name a real person; neither is ranked, and no screen ever says “Recommended for you”, “Trending” or uses engagement ranking or paid placement.**Test.** A copy audit at sign-off finds none of those phrases, and every “Curated by” credit traces to a playlist built through the rule-checked builder (D3 or B5).

Must Pack builds

CUR-7

Explicit-lyrics flag from the package. Business playlists exclude explicit tracks by default, and a curator can include them deliberately for a named site.**Test.** An explicit track cannot enter a default playlist without a warning.

Must Pack builds

CUR-8

A Suggested panel on the playlist builder (D3) surfaces two kinds of candidate: new uploads tagged with descriptors that match a site, shown to the curator only; and songs listeners have suggested for that site (LIS-9), shown to both the curator here and the business’s own staff on their playlist screen (VEN-10). This is matching, not ranking — nothing is ordered by predicted engagement, and nothing is added to a playlist until a named curator or a named staff member picks it.**Test.** No auto-surfaced (non-listener) suggestion reaches a business player without a curator adding it, and the panel never orders candidates by play or save counts.

Should Pack builds

### Businesses and the business player

VEN, 10 requirements

The whole loop depends on businesses actually playing through The Pack. Extensa named a silent player as the single biggest risk, so the player is built to be hard to ignore and easy to leave running.

VEN-1

Site profile: name, address, region, business type, opening hours, agreed pilot hours (a couple of hours a day), short vibe description. Photos are a Should.**Test.** Address geocodes and region is set automatically, with manual override.

Must Pack builds

VEN-2

Business player runs in a browser on a tablet or computer, with the potential to enable phone play as well (not required for the pilot). One tap to start, resumes after a reload or power cut, keeps the screen awake, and shows a persistent ON AIR indicator.**Test.** Reloading the tab mid-track resumes within ten seconds without staff touching it.

Must Pack builds

VEN-3

Staff controls: skip with a one-tap reason (“doesn’t fit tonight”, “wrong energy”, “too loud”) and a volume trim. No queue building. Reasons go to Curators as feedback.**Test.** Skip reasons appear against the track in the curator’s view within a minute.

Must Pack builds

VEN-4

Resilience: buffer the next two tracks, keep playing through short network drops, and sync play events afterwards.**Test.** Unplugging wifi for five minutes does not stop playback and loses no events.

Must Pack builds

VEN-5

Uptime watch: the player sends a heartbeat every 30 to 60 seconds. Admin sees each site as On air, Quiet or Offline, and is notified (email or equivalent) when a site goes silent during its player hours, so a person can check in before the business notices. An email goes to the business after 15 minutes without playback during its pilot hours (proposed).**Test.** A player switched off during pilot hours appears as Offline in Admin within two minutes, and Admin receives a notification within the same window.

Must Pack builds

VEN-6

Now-playing feed: the server holds the current track per site and serves it to the listener page within five seconds of a track change.**Test.** Track change to listener page update is under five seconds on 4G.

Must Pack builds

VEN-7

Honest licensing notice in business onboarding and player settings. It states plainly what The Pack has confirmed and what it has not, and tells businesses to keep their OneMusic licence until The Pack confirms otherwise in writing. Wording is approved by Pack legal advice.**Test.** No screen or email claims a business is fully licensed through The Pack.

Must Pack builds

VEN-8

Each site gets a unique QR code and short link, with in-space collateral provided by The Pack (for example an A5 sign, a window sticker, or a point-of-sale or table QR).**Test.** Scanning the code on a phone with no account lands on that site’s Now playing page.

Must Pack builds

VEN-9

Pilot businesses have free access with no billing for the trial period. The site’s notional monthly fee ($49.99 per individual business site for the MVP) is recorded as a setting so the ledger can run the real model on notional money (see PAY-2).**Test.** Changing the notional fee changes the next pot and nothing before it.

Must Pack builds

VEN-10

Named business staff can build their own “house picks” playlist for their site, from the same catalogue and rule checks (CUR-2) a Pack curator uses, and switch their player between it and the Pack-assigned playlist. It is credited “Curated by \[name\] for \[business\]”, the same naming rule as CUR-1. Staff can share the playlist, with its credit, to other Pack businesses and to The Pack; sharing never posts to an outside social network on the business’s behalf. Songs listeners have suggested for the site (LIS-9) also appear here, so staff can add one straight into their own playlist — the same suggestion is flagged to a Pack curator too (CUR-8), and either can act on it.**Test.** A staff-built playlist cannot be assigned to a player without a named staff curator, switching playlists takes effect at the next track boundary, and a listener suggestion reaching a business player is traceable to either a curator or a staff member adding it.

Should Pack builds

### Listener: what’s playing here

LIS, 11 requirements

A listener in the business can see what is playing and save it. There is no audio streaming to listeners in this phase, and no free tier will ever exist. At-home listening arrives with the beta (Phase 3).

LIS-1

The QR link opens “Now playing at \[business\]” in the phone browser with no login: artwork, title, artist, and who curated it. When nothing is playing it says so and shows recent plays.**Test.** The page loads in under three seconds on 4G with no account.

Must Pack builds

LIS-2

Tapping the artist opens a short public artist page: name, region, bio, story, track list and Verified Human Creator ID link when the package carries one. Track lists show details only; no audio plays.**Test.** The page shows no play buttons in this phase.

Must Pack builds

LIS-3

Saving needs an account. A guest who taps Save sees a sign-in sheet (email link or password). The save is kept and attached when they finish, tagged “Heard at \[business\] · \[date\]”.**Test.** A saved track survives sign-up and appears in the list with its business and date.

Must Pack builds

LIS-4

Saved list titled “Heard somewhere real”, with the business and date on every track and an option to remove one.**Test.** Removing a save removes it everywhere for that listener.

Must Pack builds

LIS-5

Simple business page: business type, vibe, recent artists, opening hours.**Test.** The page lists the last ten distinct artists played at the site.

Should Pack builds

LIS-6

Listener account collects the minimum: email, optional display name and optional postcode. The news opt-in is unticked by default. Diversity questions are not asked in this phase.**Test.** Sign-up needs only an email address.

Must Pack builds

LIS-7

Privacy: a listener’s saves, visits and follows belong to them. Businesses and artists see counts only, never identities — except a follow a listener has deliberately made public (LIS-11), which is the one identity a listener has chosen to share.**Test.** No API response to a business or artist token contains a listener identifier, other than listeners who follow that artist or business publicly.

Must Pack builds

LIS-8

A short, plain message from The Pack tells listeners how their saves help build The Pack, what saves are used for (counts only, by default), and when they can sign up for at-home listening. It shows once after sign-up and stays on the saved list, so they can find it again. The news opt-in (LIS-6) is how they hear when sign-up opens. Wording and dates are set by The Pack (proposed).**Test.** A new listener sees the message after sign-up and can reopen it from the saved list. It gives a sign-up date only once The Pack has confirmed one.

Should Pack builds

LIS-9

A signed-in listener can suggest a song for a business, from the business page. Suggesting needs an account, the same as saving. A suggestion is flagged to that business’s Suggested panel on the playlist builder (CUR-8) for a Pack curator to review, and also shown to the business’s own staff on their playlist screen (VEN-10); it is never added to a playlist automatically, whoever sees it.**Test.** A suggested song cannot reach a business player without a curator or a named staff member adding it from one of those two panels.

Should Pack builds

LIS-10

At subscription, and editable later from Me, a listener states genres and vibes they like and ones they would rather skip. This is stated preference only, never inferred from listening. Home uses it only to prioritise which curated sections show first; it never adds, reorders within, or substitutes for a curator’s own picks, and sections keep their “Curated by” or “Chosen by” credit.**Test.** Turning off or clearing a listener’s stated preferences returns Home to the same, unfiltered order every other listener sees. No section on Home is ever labelled “recommended for you”.

Should Pack builds

LIS-11

Following defaults to private, the same as a save. At the point of following, a listener can instead choose to follow publicly. A public follow adds the listener (display name only, from LIS-6) to a visible supporters list on that artist’s or business’s page; a private follow never appears there. A listener can switch a follow between public and private at any time, and switching to private removes them from that list immediately.**Test.** An artist or business page never lists a listener who followed privately, and a listener switched to private disappears from the public list within the same request.

Should Pack builds

### Payments engine (ledger only in the pilot)

PAY, 13 requirements

The pilot runs the full user-centric model on notional money and produces statements, but moves no real money (decision D-11). The engine is built to the cent so Stripe Connect payouts switch on in Phase 2 without rework.

PAY-1

Play event: site, track, start time and seconds played, with a unique event ID so a retry never double-counts. A play qualifies at 30 seconds of continuous play (setting).**Test.** Sending the same event twice records one play. A 20-second play does not qualify.

Must Pack builds

PAY-2

Each site is a business subscriber, and its monthly subscription is its own pot. It pays only the artists played at that site that month and is never mixed into a platform-wide pool, as in the user-centric model. Individual listeners will work the same way from Phase 3: each listener’s subscription is their own pot, shared among the artists they played. Notional site fee defaults to $49.99 per individual business site, as the MVP test value (setting). It is stored per site, so tiers by business size and franchise packages can be added later without rework. Artist share is 70% and Pack share 30% (settings). Artist share is rounded down to whole cents and the remainder goes to Pack, so $49.99 gives $34.99 and $15.00.**Test.** Pot arithmetic reproduces the worked example in section 8 exactly. No artist who was not played at a site that month is paid from its pot.

Must Pack builds

PAY-3

Allocation: a track’s share of the artist pool equals its share of qualified plays at that site in that month. The track amount then splits across contributors by the confirmed split (ART-5).**Test.** Worked example in section 8 matches to the cent.

Must Pack builds

PAY-4

Money is stored as integer cents. Rounding uses the largest-remainder method so allocations always sum to the pot.**Test.** A property test over random plays and splits shows total allocated equals the artist pool every time.

Must Pack builds

PAY-5

Append-only ledger. Entry types: accrual, adjustment, hold, release, payout. Corrections are reversing entries, never edits. Every amount can show its working back to plays and split.**Test.** Any ledger line opens a “show working” view listing the plays and split behind it.

Must Pack builds

PAY-6

Month-end is a human step for posting each site’s pot to the ledger: Admin runs a dry-run, reviews totals and exceptions, then approves to post. Approved runs are locked.**Test.** Re-running an approved month is refused.

Must Pack builds

PAY-7

The payout threshold is a setting, currently $10 (decision D-10). An artist is paid as soon as their balance reaches it, not on a monthly cycle. A balance below the threshold keeps building across months until it gets there. In the pilot the ledger marks it “would be paid” and no money moves.**Test.** Changing the threshold changes which balances become payable, with no code change. A balance that crosses the threshold is marked payable at that posting, in any month, and one that stays below it keeps building.

Must Pack builds

PAY-8

Contributors without a Pack account accrue to an unclaimed balance keyed to the person record. Admin can see it. The claim flow and any expiry policy come in Phase 2 (D-13).**Test.** Inviting a contributor later attaches their existing unclaimed balance to their new account.

Must Pack builds

PAY-9

Artist earnings statement by month and business, with a plain-English explanation of how it was worked out and a CSV download. Clearly marked “simulated: no money moves during the pilot”.**Test.** Statement totals equal the ledger for that artist and month.

Must Pack builds

PAY-10

Reconciliation report for Admin: total artist pool posted equals the sum of site pots at the artist share, with zero cents difference, plus exceptions (unclaimed, held, flagged).**Test.** The report shows a difference of $0.00 on the pilot data.

Must Pack builds

PAY-11

Design for Stripe Connect Express: payout account is a nullable field on the artist and the ledger already has a payout entry type. No Stripe code ships in the pilot.**Test.** Schema review confirms Phase 2 needs no migration of ledger entries.

Must Pack builds

PAY-12

Anomaly flags: a track played far more than the repeat window allows at one site, or a site playing while offline, is flagged to Admin.**Test.** Seeded test data raises both flags.

Should Pack builds

PAY-13

Play-log export by track, site and month (CSV), for reporting to rights bodies as per agreed licensing requirements.**Test.** Export matches the ledger plays for the month.

Should Pack builds

### Admin console

ADM, 8 requirements

A separate web tool for the small Pack team. “Human powered” is the pilot’s design principle, so Admin is where most decisions happen.

ADM-1

Dashboard: releases waiting for review, releases needing attention, sites on air now, plays in the last 24 hours, and the state of the current month’s ledger.**Test.** The dashboard loads in under two seconds with the pilot dataset.

Must Pack builds

ADM-2

Review queue. Each release shows package summary, check results, AI declaration, loudness, genre, rights checklist and an audio player. Actions: Approve, Hold (reason) and Reject (reason and message to the artist).**Test.** Reject requires a reason and sends the artist a message using error templates.

Must Pack builds

ADM-3

User admin: invite artists and businesses, list users across groups, deactivate accounts.**Test.** Deactivated users cannot sign in and their sessions end at once.

Must Pack builds

ADM-4

Policy settings screen: accepted AI answers, loudness target, play threshold, site fee, revenue split, payout threshold, playlist rules and feature flags. Every change is logged.**Test.** A settings change appears in the audit log with old and new value.

Must Pack builds

ADM-5

Business and site admin: assigned playlists, player health, and a QR kit generator. The Pack generates each site’s QR code and gives the business its in-space collateral at pilot launch (VEN-8).**Test.** Generating the QR code and collateral kit for a new site takes under a minute. Every pilot site has its kit before launch.

Must Pack builds

ADM-6

Takedown and content flags (RTS-4, RTS-6) from one place.**Test.** Takedown is two clicks from a track’s admin page.

Must Pack builds

ADM-7

Audit log viewer with filters by user, action and date.**Test.** Filtering by actor returns only that actor’s actions.

Should Pack builds

ADM-8

Cohort labels on artists, so an Admin can list every artist in a cohort.**Test.** Admin can list every artist in a cohort.

Should Pack builds

### Artist data ownership

DAT, 5 requirements

Permanent data ownership is a stated commitment. Merida’s model already keeps the artist’s data theirs. The Pack becomes the custodian of the copy it receives, so the controls sit on the artist dashboard, not in settings.

DAT-1

One-tap “Export my data” on the artist dashboard: profile, releases, metadata, agreements, splits, statements and a link to the original packages, as JSON and CSV.**Test.** The export opens and contains every field held about the artist.

Must Pack builds

DAT-2

Artist can withdraw a release themselves. It leaves playlists and players within five minutes. Ledger records stay, because they are financial history.**Test.** Withdrawn releases keep their earnings history and show as withdrawn.

Must Pack builds

DAT-3

Full account and data erasure is handled by Admin on request in the pilot, with a written record of what was removed and what the law requires The Pack to keep. Self-serve erasure is Phase 2. Metadata held by MetaGen is outside this. Who handles it is to be confirmed with Merida (A14).**Test.** An erasure request is completed and confirmed to the artist within a stated period.

Must Pack builds

DAT-4

Data flow register: what arrives from MetaGen (the package) and what The Pack sends back. In the pilot The Pack sends nothing back. Merida confirms what MetaGen holds (the artist’s metadata) and that it does not store the music package once it reaches The Pack.**Test.** Both parties sign the one-page register.

Must Both

DAT-5

No diversity or other sensitive personal information is collected in the pilot. When it is added it is voluntary, separately consented and reported only in aggregate (Phase 3, decision D-23).**Test.** The pilot database has no columns for ancestry, Indigenous status, gender or sexual orientation.

Must Pack builds

### Platform, security and delivery

NFR, 9 requirements

These apply to everything above. Given the history of developer failures, several are about ownership and continuity, not features.

NFR-1

Hosting in Australian jurisdiction where technically possible, in containers, with infrastructure written as code, plus separate staging and production. Provider is decision D-16.**Test.** A new environment can be built from the repo in a working day by someone who did not write it.

Must Pack builds

NFR-2

Security baseline: TLS everywhere, Argon2id password hashing, least-privilege access, secrets kept out of the repo, and an OWASP Top 10 review before the pilot opens.**Test.** Review checklist signed off by someone other than the author.

Must Pack builds

NFR-3

Backups: daily database backups and versioned object storage, monthly restore drill. Recovery targets 24 hours of data loss and four hours of downtime for the pilot (proposed).**Test.** A restore drill is completed and written up before the pilot opens.

Must Pack builds

NFR-4

Proposed performance targets: business player starts a track in under two seconds; Now playing updates within five seconds; a 1 GB package finishes ingest within 15 minutes. The dev team should challenge these.**Test.** Measured on staging with the sample package.

Should Pack builds

NFR-5

Accessibility: WCAG 2.2 AA on every public and artist screen, keyboard operable, readable at 200% zoom.**Test.** Automated checks plus a manual keyboard pass on the listener and artist flows.

Must Pack builds

NFR-6

Privacy-respecting analytics only (self-hosted Matomo or similar). No Google, Meta or other cross-site trackers, and no Firebase.**Test.** Network capture of every page shows no third-party tracker calls.

Must Pack builds

NFR-7

Observability: structured logs, uptime monitoring, error tracking and an ingestion job dashboard the Pack team can read.**Test.** A forced failure appears in error tracking within a minute.

Must Pack builds

NFR-8

Ownership and continuity: the code repository, hosting, domain, storage, keys and third-party accounts sit in The Pack’s own organisation accounts from day one. The repo has a README and a runbook, and nothing depends on one person’s laptop.**Test.** Two named Pack people hold owner rights on every account before the first commit.

Must Pack builds

NFR-9

Everything from Phase 2 onwards is built behind feature flags, so unfinished work never reaches the pilot.**Test.** Flags default off and are visible in Admin.

Must Pack builds

Section 6

## Wireframes and user journeys

26 screens in five journeys, drawn as one working app. They show structure, wording and behaviour, not final visual design. The look comes from The Pack Style Guide V3.

How to read these

These screens describe the MVP as one working app, so each one is drawn as it will really look. Numbered pins match the numbered notes beside each screen, and each note names the requirement IDs it satisfies. Two markers sit on top of the screens and are not part of what people see. An **orange band** labelled MetaGen side marks a part that is prepared on the MetaGen side. A **dashed amber box** marks wording that appears only while Test mode is on, and screen D5 is where an Admin switches it. The roadmap (section 9) says which phase builds each part.

[A**Listener: in a business**3 screens](#j-a)[B**Business: set up and play**5 screens](#j-b)[C**Artist: join, add music, get paid**8 screens](#j-c)[D**Curator and admin: invite, review, curate**5 screens](#j-d)[E**Listener: on the go and planning**5 screens](#j-e)

A

### Listener: in a business

Listener. No account needed to look.

Someone walks into a business that plays The Pack, scans the code, sees what is playing and saves it. They feel the magic before anyone asks them to sign up.

1. [**A1**Scan the QR code](#wf-a1)
2. [**A1**See what’s playing](#wf-a1)
3. [**A2**Meet the artist](#wf-a2)
4. [**A1**Save the song](#wf-a1)
5. [**A1**Sign in with an email link](#wf-a1)
6. [**A1**Find it later](#wf-a1)
7. [**A3**Look at the business](#wf-a3)
8. [**A3**Suggest a song for the space](#wf-a3)

No login to lookLogin only to saveNo Facebook or GoogleCounts only, never identities

A1

#### Scan, see what’s playing, save it

Phone browser. No login to look. Login only to save.

The Pack

Now playing at

Example Café*6*

*1*

Long Way Down

The Southerlies · Fremantle*2*

Save this song*3*

Curated by Alex & The Pack

The Pack

Long Way Down

Save this song*4*

Sign in with an email link or a password. That’s all we ask for.

Email

Email me a link

or use a password

The Pack

Heard somewhere real*5*

**Long Way Down**Example Café · Sat 19 Sep

**Slow Water**Corner Books · Thu 17 Sep

**Paper Boats**Example Café · Tue 15 Sep

SavedBusinessesMe

1. 1

   Opens from the QR code with no login: artwork, title, artist, and who curated it. With nothing playing, it says so and shows recent plays.LIS-1, VEN-6, CUR-6
2. 2

   Tap the artist for a short public page (A2).LIS-2
3. 3

   Save is the only action that asks for an account.LIS-3
4. 4

   Sign-in is an email link or a password. No Facebook or Google, anywhere. The save is kept and attached when sign-in finishes.LIS-3, ACC-1, LIS-6
5. 5

   The saved list always shows where and when the listener heard it. Businesses and artists never see whose list it is.LIS-4, LIS-7
6. 6

   Tap the business name for its page (A3).LIS-5

A2

#### Public artist page

Phone browser. No login.

The Pack

The Southerlies

Fremantle

Four friends, one van, and a shared love of slow songs about the tide.*1*

Songs

*2*Long Way Down3:38

Tide Tables3:15

Kestrel Road4:02

‹ Back to Example Café*3*

1. 1

   Name, region, bio and story, all written by the artist. Nobody else assigns their community or story.LIS-2, ART-1, TAX-3
2. 2

   Track list only: title and length. Songs play in a business or in the listener’s own player, not from this page. No follower counts.LIS-2, D-24
3. 3

   A way back to what’s playing, so the listener never loses the moment.LIS-1

A3

#### Business page

Phone browser. No login to look. Login only to suggest.

The Pack

Example Café

CaféFremantleOpen today 7 am to 3 pm*1*

A corner café with big windows, strong coffee and the local songs turned low.

*2*

ON AIR**Slow Water**Marlo Finch

Recent artists*3*

The SoutherliesFremantle

Marlo FinchMargaret River

Dune SeasonPerth

*4*Suggest a song for this space

The Pack

Example Café

Suggest a song for Example Café*5*

Pick a song and say why it fits. It goes to the curator’s suggestions — they choose whether to add it.

Search a song or artist

Why it fits here (optional)

Send suggestion

1. 1

   Business type, suburb, opening hours and a short description of the vibe, all set by the business.LIS-5, VEN-1
2. 2

   Shows what’s playing right now when the site is on air. When it isn’t, it says so and lists recent plays.LIS-1, VEN-6
3. 3

   Recent artists by name only. The page never shows who visited or who saved what.LIS-5, LIS-7
4. 4

   A signed-in listener can suggest a song for this business. Suggesting needs an account, the same as saving.LIS-9
5. 5

   The suggestion is flagged to a Pack curator’s Suggested queue for this business (D3), and shown to the business’s own staff too (B5), so either can add it. It is never added automatically — a person still chooses.LIS-9, CUR-8, VEN-10

B

### Business: set up and play

Business owner and business staff.

A café owner reads the honest licensing notice, sets up their site, puts the player on, and sees what the plan costs. Staff can skip a track without building a queue.

1. [**B1**Read the licensing notice](#wf-b1)
2. [**B2**Set up the site](#wf-b2)
3. [**B2**Get the QR kit](#wf-b2)
4. [**B2**Add staff](#wf-b2)
5. [**B3**Switch the player on](#wf-b3)
6. [**B3**Skip with a reason](#wf-b3)
7. [**B4**Check the plan](#wf-b4)
8. [**B5**Curate a house playlist](#wf-b5)

Honest about OneMusicFree trial while Test mode is onNo queue buildingNo listener names

B1

#### Business licensing notice

Business onboarding and player settings. Acceptance is recorded.

The PackBusinessExample Café

Before you switch on The Pack

*1*

What The Pack is

A music service that plays music by local, original artists who have given their permission.

What it does not do yet

It does not replace your OneMusic licence.

What that means for you

The Pack costs $49.99 per site, per month. Your plan page shows the details.

Test mode onlyFree trial. You are not billed. We will tell you before that changes.*2*

*3*I have read this and understand it.

*5*Include my site’s aggregate data in the Open data project (optional).

Continue*4*

1. 1

   Honest, plain words. The wording is reviewed by a person with licensing knowledge before launch.VEN-7, D-25
2. 2

   Test mode only. While money is notional, this free-trial line is added. With Test mode off, the block above is all the business sees.VEN-9
3. 3

   An explicit acknowledgement, not a pre-ticked box.VEN-7, ACC-7
4. 4

   Who accepted, which version of the text and when are logged. The same text stays in player settings.ACC-7, VEN-7
5. 5

   A separate, unticked, optional consent to include the site’s aggregate data in an Open data project supporting the health of the music industry, research and government decision-making — never bundled with the licensing acknowledgement, and declining it never blocks sign-up. Data is aggregated to SA2 level, and the business can opt out at any time.ACC-10, D-29

B2

#### Set up your site

Desktop and tablet. Business owner.

The PackBusinessExample Café

PlayerMy sitePlaylistsMy planStaff

Your site

*1*

Site name: Example Café

Address: 12 High Street, Fremantle

Region: Fremantle

Type: Café

Opening hours: Mon to Fri 7 am to 3 pm, Sat and Sun 8 am to 2 pm

Player hours: 7 am to 9 am, every day*2*

Vibe: A corner café with big windows, strong coffee and the local songs turned low.*3*

Add photosSave site

*4*

Your QR code and short link

thepack.example/c/exa\
Scan to see what’s playing here

Download sign kit

A5 sign, window sticker, table card.

*5*

Staff

Jess MorganCan run the player

Add staff

*6*

Followers

19

12 chose to follow publicly:

Priya T.Alex M.+ 10 more

1. 1

   Name, address, region, business type and opening hours. The region is what lets local artists reach local listeners.VEN-1, CAT-5
2. 2

   The hours the player is expected to be on air. The uptime watch checks these hours only.VEN-1, VEN-5
3. 3

   A short, public description of the vibe. It appears on the business page (A3).VEN-1, LIS-5
4. 4

   Each site gets its own QR code and short link. The Pack provides the sign kit.VEN-8, ADM-5
5. 5

   Staff can run the player. They cannot change the site profile or the plan.ACC-2, ACC-4
6. 6

   The same followers feature as the artist dashboard: a count, plus the display names of listeners who chose to follow publicly. The rest follow quietly and only add to the count.LIS-11

B3

#### Business player, tablet

Tablet in landscape or a desktop browser. Business owner and staff.

The PackExample Café · FremantleON AIR*1*Weekday morning, café · v3

Long Way Down

The Southerlies · Fremantle

Curated by Alex & The Pack

*2*

*3*SkipDoesn’t fit tonightWrong energyToo loud

*4*Volume trim

*5*

Up next (ready to play)

Slow Water · Marlo Finch\
Tide Tables · The Southerlies

*6*

Scan to see what’s playing here

thepack.example/c/exa

*7*

Keep your OneMusic licence.

1. 1

   ON AIR shows the player is heartbeating. Admin sees the same state per site.VEN-5
2. 2

   One tap starts it, and it resumes after a reload without staff signing in again.VEN-2
3. 3

   Staff can skip, with a one-tap reason. There is no way to build a queue. Reasons reach curators.VEN-3
4. 4

   Volume trim per site. Loudness levelling stays on underneath.VEN-3, PLY-3
5. 5

   The next two tracks are buffered, so short network drops don’t stop the music.VEN-4
6. 6

   The site’s own QR code and short link, always visible.VEN-8, VEN-6
7. 7

   Licensing notice is always in reach, in plain words.VEN-7, D-25

B4

#### Your plan

Desktop and tablet. Business owner.

The PackBusinessExample Café

PlayerMy sitePlaylistsMy planStaff

Your plan

Test mode onlyFree trial. You are not billed. We will tell you before that changes.*1*

*2*

Your plan

$49.99 per site, per month

The same price however busy your site gets. 1 site: Example Café.

*3*

Where your fee goes

**$34.99** to the artists played at your site**$15.00** to The Pack

1. 1

   Test mode only. While money is notional, a plain free-trial note is added. With Test mode off, the screen shows the real plan.VEN-9
2. 2

   One flat price per site for now. Tiers by business size come later. In Test mode the fee is recorded but never billed.VEN-9, PAY-2
3. 3

   A plain picture of where the fee goes. The 70/30 is stated, not hidden.PAY-2, PAY-3

B5

#### Playlists for your site

Desktop and tablet. Business staff.

The PackBusinessExample Café

PlayerMy sitePlaylistsMy planStaff

Playlists for Example Café

*1*

Curated by Alex & The Pack

The Pack's own playlist for your site.

1\. Slow Water3:42

2\. Tide Tables3:15

Playing now

*2*

Curated by Priya for Example Café

1\. Harbour Light3:20

2\. Paper Boats4:01

*3*Search the catalogue to add a songAdd

No artist twice in a rowNo repeat in 3 hours

Play this playlist instead

*5*

Suggested by listeners (2)

Quiet RoomsSuggested by a listenerAdd

Back RoadsSuggested by a listenerAdd

*4*Share this playlist

1. 1

   The Pack-curated playlist for the site still appears here as the default. Staff can switch to their own picks whenever they like, and switch back.VEN-10
2. 2

   A named staff member builds their own house-picks playlist for their site — the same "a person chooses every song" rule as a Pack curator, labelled “Curated by \[name\] for \[business\]”.VEN-10, CUR-1
3. 3

   Songs come from the same catalogue and rule checks (no artist twice, no repeat within three hours) a Pack curator uses.VEN-10, CUR-2
4. 4

   Sharing sends the playlist, with its “Curated by” credit, to other Pack businesses and to The Pack. It never posts on the business’s behalf to an outside social network.VEN-10
5. 5

   A song a listener suggested for this business (A3) shows here too, so staff can add it straight to their own playlist — the same suggestion is also flagged to a Pack curator on the playlist builder (D3). Either can add it, neither has to, and it never adds itself.VEN-10, LIS-9, CUR-8

C

### Artist: join, add music, get paid

Invited artist (a Full member of the co-op).

An invited musician joins the co-op, sets up a profile, agrees to the terms, adds a release, confirms who gets paid and sees what they earn. Their data stays theirs.

1. [**C1**Accept the invite](#wf-c1)
2. [**C1**Join the co-op](#wf-c1)
3. [**C2**Set up a profile](#wf-c2)
4. [**C3**Agree the terms](#wf-c3)
5. [**C4**Add a release](#wf-c4)
6. [**C5**Fix anything flagged](#wf-c5)
7. [**C6**Confirm who gets paid](#wf-c6)
8. [**C7**See the dashboard](#wf-c7)
9. [**C8**Read the statement](#wf-c8)

Invite onlyPlain-English agreementTest mode labels moneyMetaGen side marked in orangeExport my data, in one tap

C1

#### Join The Pack

Phone or desktop browser. Invited artist, first sign-in.

The Pack

Fremantle 1

You’re invited*1*

Make an account to join The Pack. It takes a couple of minutes.

*2*

Email

Password

Create account

or email me a link

I accept the Terms and the Privacy Policy.

The Pack

Step 2 of 2

Join the co-op*3*

Artists join as Full members. That means a vote in how The Pack is run.

The Co-op Rules

I accept the Co-op Rules and join as a Full member.

*5*Include my aggregate data in the Open data project (optional).

Join The Pack

The Pack

Welcome, Sam

Three things before your music can go in.

*4*

DoneYour profile

NextArtist Agreement

LockedAdd your music

1. 1

   Sign-up is by invite only. An Admin sends a single-use link tied to a cohort label, such as Fremantle 1.ACC-3, ADM-8
2. 2

   Email and password, or an email link. No Facebook or Google. Acceptance of the Terms and Privacy Policy is recorded.ACC-1, ACC-7
3. 3

   Joining the co-op is its own step, separate from the Terms. Artists join as Full members, with voting rights.ACC-8, ACC-9
4. 4

   The music step stays locked until the profile, the co-op step and the Artist Agreement are done.ACC-9, ART-3
5. 5

   A separate, unticked, optional consent to include aggregate data in an Open data project supporting the health of the music industry, research and government decision-making — never bundled with the Co-op Rules or Terms, and declining it never blocks sign-up. Data is aggregated to SA2 level, and a member can opt out at any time from Me/settings.ACC-10, D-29

C2

#### Your profile

Desktop and mobile web. Artist.

The PackArtistThe Southerlies

ReleasesAdd musicEarningsMy dataProfile

Your profile

Public name: The Southerlies*1*

Legal name: Samuel Reilly · only The Pack sees this*2*

Home region: Fremantle*3*

Bio and story: Four friends, one van, and a shared love of slow songs about the tide.

Links: instagram.com/thesoutherlies

Add a photo (optional)Save profile

*4*

What listeners see

The Southerlies

Fremantle

Four friends, one van, and a shared love of slow songs about the tide.

1. 1

   Public display name, and a private legal name that only The Pack sees. Both are needed for rights and payment.ART-1
2. 2

   The legal name is never shown on the public page. The label says so beside the field.ART-1, LIS-7
3. 3

   Home region from the 12 Western Australian regions. It lets local listeners find local artists.ART-1, CAT-5
4. 4

   A live preview of the public artist page (A2). A photo is optional.ART-1, LIS-2

C3

#### Artist Agreement

Desktop and mobile web. Artist, before the first release.

The PackArtistThe Southerlies

ReleasesAdd musicEarningsMy dataProfile

The Artist Agreement, in plain English

*1*

Permission to stream

You let The Pack stream your songs to businesses that play local music.

Licence-back

The Pack streams under your own APRA AMCOS membership, and pays you directly.

How you’re paid

70% of each business fee goes to the artists played there. Statements show the working.

Your data stays yours

Export it or withdraw a release whenever you like.

*2*I have read the agreement and I agree.

Agree and continueDownload a copy*3*Read the full agreement

1. 1

   Four plain headings before the legal text: permission to stream, licence-back, payment and data ownership.ART-3, RTS-2
2. 2

   An explicit, unticked checkbox. The acceptance is stored with the document version, the artist and the time.ART-3, ACC-7
3. 3

   A signed copy is stored and can be downloaded at any time.ART-3

C4

#### Add your music

Desktop and mobile web. Artist.

The PackArtistThe Southerlies

ReleasesAdd musicEarningsMy dataProfile

Add a release

**MetaGen side**Songs, contributors, splits and the release package are prepared in MetaGen. Use Transfer to The Pack in MetaGen to send it here.*1*

*2*

**kestrel-road-package.zip** Arriving from MetaGen · 412 MB of 1.1 GBReceiving

Sent from MetaGen. If the transfer drops, it picks up again on its own.

*3*

Your rights position for this release

Independent, no labelSigned to an independent labelSigned to a distributorI’m not sure

*4*I confirm I’m free to distribute these recordings on The Pack.

Submit release*5*

Recent releases

*6*

**Kestrel Road** (EP)Needs attention

**Salt and Static** (album)Live

1. 1

   MetaGen band. This is not part of what the artist sees on The Pack. It tells the developer which part is prepared, and pushed, on the MetaGen side, and it can be hidden. Exactly how the package lands here is still to be confirmed with Merida.ING-1, ING-3, D-01
2. 2

   One package per release, sent from MetaGen once the artist starts the transfer there. Progress is shown, and it resumes on its own if the transfer drops. The size limit is a setting, sized for a 60-minute 24-bit album (about 1 GB).ING-1, NFR-4
3. 3

   A rights declaration for each release, including any existing recording, label or distribution contract.ART-4, RTS-1
4. 4

   The artist confirms they are free to distribute the recordings.ART-4
5. 5

   Submit stays off until the package has arrived and the declaration is ticked.ART-4, ING-1
6. 6

   Every release shows its state in the same words everywhere: Received, Checking, Needs attention, In review, Live.CAT-4, ING-2

C5

#### Release status and fixes

Desktop and mobile web. Shown after a release is added.

The PackArtistThe Southerlies

ReleasesAdd musicEarningsMy dataProfile

Kestrel Road (EP) version 1

Needs attention

**Done**Received

**Done**Checking

**Now**Needs attention

**Next**In review

**Then**Live

*1*

*2*

Can’t continueE204 · fixed by you

Track 3, “Long Way Down”, is missing its audio file. Add the file to the release and send it again.

*3*

On holdE520 · a person at The Pack will check

The ISRC for track 2 is already in The Pack catalogue on another release. A person will check whether this is a re-release or a mix-up, usually within two working days.

*4*

NoteE730

We measured this track’s loudness ourselves and levelled it to match the rest of the catalogue. It will still go to review. No action needed.

Send the corrected releaseNeed a hand?*5*

Sending again creates version 2. Nothing you sent before is deleted.

**MetaGen side**Song-detail, split and audio problems are fixed in MetaGen, then the release is sent again. Problems on The Pack’s side are fixed by a Pack admin.*6*

1. 1

   Status timeline shows only states the release has actually reached.ING-2, CAT-4
2. 2

   Every error has a code, a plain-language message and who fixes it. Reject means nothing goes live until it is fixed.ING-5, ING-6
3. 3

   Hold means a person decides. The artist is told what is happening and does not need to act.ING-5, CAT-6
4. 4

   Warnings never block. They are shown so nothing is hidden from the artist.ING-5
5. 5

   A corrected release goes in as a new version of the same release. Admin sees what changed.ING-7
6. 6

   MetaGen band. Who fixes what, so the artist is never sent to the wrong place.ING-5, ING-6

C6

#### Confirm who gets paid

Desktop and mobile web. Artist, before a release can go live.

The PackArtistThe Southerlies

ReleasesAdd musicEarningsMy dataProfile

Who gets paid for “Night Bus”

These are the splits recorded for this release. If anything looks wrong, tell us and we’ll pause the release while it’s fixed.

*1*

| Person | Role | Share | Pack account |
| --- | --- | --- | --- |
| Sam Reilly | Writer, performer | 60% | Has account |
| Jo Tan | Writer | 40% | Not on The Pack yet*3* |
| **Total** | **100%***2* |  |  |

Jo’s share is held for Jo. We’ll invite Jo to claim it. Nobody’s share is lost.

Confirm who gets paid*4*Something’s wrong*5*

**MetaGen side**Splits come from the contributor details entered in MetaGen. To change them, fix them in MetaGen and send the release again.*6*

1. 1

   Read-only table of the splits recorded for this release. People are matched by ID, not typed names.ART-5, CAT-7
2. 2

   Splits must total exactly 100%. Otherwise the release stops with a plain message (E402).ING-4, ING-6
3. 3

   A contributor without an account accrues to an unclaimed balance tied to the person.PAY-8, D-13
4. 4

   Confirming records who, when and which version. It is required before go-live.ART-5, RTS-2
5. 5

   Something’s wrong pauses the release and messages the co-op.ART-5, ING-7
6. 6

   MetaGen band. The table is read-only here because MetaGen holds the source details.ART-5, ING-3

C7

#### Artist dashboard with Export my data

Desktop and mobile web. Artist home.

The PackArtistThe Southerlies

ReleasesAdd musicEarningsMy dataProfile

Welcome back

Test mode onlyMoney is notional. Money figures carry a “simulated” label and no payout is made.*1*

*2*

Your releases

**Salt and Static** (album)Live

**Kestrel Road** (EP)Needs attention

**Harbour Lights** (single)In review

*5*

Played this month

142 plays

across 3 businesses.

Earned this month

$9.32

See statement

*6*

Followers

34

21 chose to follow publicly and are shown below. The other 13 follow quietly, counted here and never named.

Priya T.Jordan K.Ravi S.+ 18 more

Your data is yours

Export my data*3*Withdraw a release*4*

1. 1

   Shown only while Test mode is on (D5). It adds a “simulated” label to money, in the same words as the statement. With Test mode off, this screen shows real balances.VEN-9, PAY-9
2. 2

   Releases with the same state words used in C4, C5 and Admin.CAT-4, ING-2
3. 3

   One-tap export: profile, releases, metadata, agreements, splits and statements, in open formats.DAT-1
4. 4

   Withdraw removes a release from every playlist and player within five minutes. Artist-initiated, no request form.DAT-2, RTS-4
5. 5

   Artists see counts by business and month. Never who listened or what a listener saved.LIS-7, D-22
6. 6

   A public follow is the one listener identity an artist sees, because the listener chose to share it. Quiet followers add only to the count.LIS-11

C8

#### Earnings statement

Desktop and mobile web. Artist. Figures match section 8’s worked example.

The PackArtistThe Southerlies

ReleasesAdd musicEarningsMy dataProfile

Statement, August 2026

Download CSV

Test mode onlyAdds a SIMULATED badge and a “no money moves” line to this statement and its CSV.*1*

*2*

| Business | Song | Plays | Song total | Your split | You earned |
| --- | --- | --- | --- | --- | --- |
| Example Café | Night Bus | 90 of 200 | $15.74 | 60% | **$9.44** |
| **Total for August** | **$9.44***4* |  |  |  |  |

*3*

How this was worked out

Example Café’s $49.99 site fee left $34.99 for artists. Night Bus had 90 of the 200 plays that lasted 30 seconds or more, so it earned $15.74. Sam Reilly’s writing share is 60%, which is $9.44.

*5*Balance $9.44. Paid out as soon as it reaches $10

1. 1

   Test mode only. While money is notional, every statement and export carries a “simulated” label. With Test mode off, the label goes and the figures are real.PAY-9, VEN-9
2. 2

   By month and business, with plays and the exact cents.PAY-9
3. 3

   A plain-English explanation of the working, so an artist can check it themselves.PAY-9
4. 4

   The statement total must equal the ledger for that artist and month.PAY-10
5. 5

   A running balance, with a CSV export at the top of the page. It is paid out as soon as it reaches the payout threshold (a setting).PAY-7, PAY-9, D-10

D

### Curator and admin: invite, review, curate

Admin, and Curator (a Curator can preview and build but cannot approve).

An admin invites people, a reviewer approves a release only after listening to it, a curator builds a playlist by hand, and the admin monitors which sites are on air and can turn Test mode on or off.

1. [**D1**Invite an artist or business](#wf-d1)
2. [**D2**Review a release](#wf-d2)
3. [**D2**Approve, hold or reject](#wf-d2)
4. [**D3**Build a playlist](#wf-d3)
5. [**D3**Assign it to sites](#wf-d3)
6. [**D4**Watch sites on air](#wf-d4)
7. [**D5**Turn Test mode on or off](#wf-d5)

A person chooses every songNothing approved unheardEvery action loggedExposure shown, never ranked

D1

#### Invite artists and businesses

Desktop. Admin.

The PackAdminAdmin

DashboardReview queuePlaylistsSitesUsersPolicyAudit log

Users

*1*

Invite an artist

Email

Cohort label: Fremantle 1

Send invite

*3*

Invite a business

Email

Business name

Send invite

*2*

| Person | Role | Cohort | Status |  |
| --- | --- | --- | --- | --- |
| Sam Reilly | Artist | Fremantle 1 | Joined | Deactivate |
| Marlo Finch | Artist | Fremantle 1 | Membership pending | Remind*4* |
| Dune Season | Artist | Fremantle 1 | Invited | Resend |
| Example Café | Business owner | None | Joined | Deactivate |

1. 1

   Pilot only. Artist invites are single-use links tied to a cohort label. Only invited artists can reach the artist screens. Open sign-up with review starts from Phase 2 (ACC-4).ACC-3, ADM-8
2. 2

   One list across roles, with a clear status for each person: Invited, Membership pending, Joined.ADM-3, ACC-9
3. 3

   Businesses are invited the same way, for the pilot only. A business can have one or more sites and staff, and also moves to self-serve sign-up from Phase 2.ADM-3, ACC-4
4. 4

   Remind, resend and deactivate from the list. Every Admin action is logged with who, what and when.ADM-3, ACC-5

D2

#### Admin reviews a release

Desktop. Admin and Curator (Curator sees but cannot approve).

The PackAdminAdmin

DashboardReview queue*2*PlaylistsSitesUsersPolicyAudit log

Kestrel Road (EP), version 2

In review

*1*Files intactAudio presentAI: No, all tracks1 hold clearedDiff vs version 1*5*

*3*

|  | Track | AI | LUFS | Genre | Explicit |
| --- | --- | --- | --- | --- | --- |
| ▶ | Long Way Down | No | −9.4 | Rock, Indie | No |
| ▶ | Kestrel Road | No | −11.8 | Rock, Indie | No |
| ▶ | Tide Tables | No | −14.1 | Folk, Acoustic | No |

*4*

Rights

Independent · Label-signed · Distributor · **Unknown**

From the artist’s own declaration. Any label negotiation is theirs, not The Pack’s.

Business-fit tags (Curator)

CaféLow energyVocal-led

*6*ApproveHoldRejectReason (required for Hold and Reject)

1. 1

   Check results in one strip. The reviewer sees what passed and what needed a person.ADM-2, ING-4, ING-5
2. 2

   Queue is on the left. The dashboard counts what is waiting.ADM-1, ADM-2
3. 3

   Each track: play it, read the AI answer, loudness and genre. Nothing is approved unheard.ADM-2, ING-10, RTS-2
4. 4

   Rights checklist, taken from the artist’s own declaration. The Pack does not chase a label for permission — that negotiation is the artist’s.RTS-1, RTS-3
5. 5

   Version diff, field by field, when an artist has sent a corrected release.ING-7
6. 6

   Approve, Hold or Reject. Hold and Reject need a reason, which the artist sees in plain language. All logged.RTS-2, ACC-5

D3

#### Curator builds a playlist

Desktop. Curator and Admin. Human choice only.

The PackCuratorCurator

Weekday morning, café draft v3

*1*

Filters

Genre: Folk, Indie

Setting: Café

Energy: Low to medium

Region: Any

Loudness: any

*2*

Matches (38)

Tide TablesThe SoutherliesFremantleAdd

Slow WaterMarlo FinchMargaret RiverAdd

Paper BoatsDune SeasonPerthAdd

*5*

Curated by Alex & The Pack

1\. Slow Water3:42

2\. Tide Tables3:15

3\. Paper Boats4:01

*3*No artist twice in a rowNo repeat in 3 hours

*4*▶ Preview, levelled

*6*

Suggested for this business (3)

Harbour LightNew upload, tagged Café · FremantleAuto-surfacedAdd

Quiet RoomsSuggested by a listenerListenerAdd

Back RoadsNew upload, tagged Café · Margaret RiverAuto-surfacedAdd

*7*Assign to: Example Café (Fremantle), Corner BooksPublish new version

*8*Exposure, last 30 days: Marlo Finch 12 slots, The Southerlies 4 slots. Shown so no artist is favoured by accident.

1. 1

   Filter by genre, business-fit descriptors, region, energy and loudness. Filtering narrows the list. A person still picks.CUR-1, TAX-2
2. 2

   Every result shows the artist’s region so local-first is easy to honour.CAT-5
3. 3

   Rules are checked as the curator works, not after.CUR-2
4. 4

   Preview plays with the same loudness levelling the business will hear.CUR-4, PLY-3
5. 5

   “Curated by” a named person. No playlist publishes without one, and no “recommended for you” wording anywhere.CUR-1, CUR-6
6. 6

   New uploads tagged as fitting this business surface here for the curator only — the algorithm only shortens the curator’s list, and nothing reaches a business until the curator adds it. Listener suggestions surface here too, and are also flagged to the business’s own staff on their playlist screen (B5), so either a Pack curator or the business can add one.CUR-8, LIS-9, VEN-10
7. 7

   Assignment is versioned. A change is a new version, and a business can be rolled back.CUR-3
8. 8

   Exposure view helps curators spread the slots fairly. Information only, not a ranking.CUR-5

D4

#### Admin: sites on air

Desktop. Admin.

The PackAdminAdmin

DashboardReview queuePlaylistsSitesUsersPolicyAudit log

Sites

2 of 3 on air*1*

*2*

| Site | State | Last heartbeat | Playlist | Skips today |  |
| --- | --- | --- | --- | --- | --- |
| Example Café | ON AIR | 20 s ago | Weekday morning v3 | 4 | QR kit |
| Corner Books | On air | 34 s ago | Quiet afternoon v1 | 0 | QR kit |
| Harbour Salon | Silent, open now | 52 min ago | Busy Saturday v2 | 9 | Contact*3* |

*4*Skip reasons this week: Wrong energy 6, Too loud 3, Doesn’t fit tonight 4. Sent to the playlist’s curator.

1. 1

   Sites on air right now, from the player heartbeat every 30 to 60 seconds.ADM-1, VEN-5
2. 2

   Per-site state, playlist version and QR kit generator in one place.ADM-5, VEN-8
3. 3

   A site silent during its player hours notifies Admin, so someone checks in before the business notices.VEN-5, NFR-7
4. 4

   Skip reasons feed curators. They are feedback, not a ranking of artists.VEN-3, CUR-5

D5

#### Admin: policy settings

Desktop. Admin.

The PackAdminAdmin

DashboardReview queuePlaylistsSitesUsersPolicyAudit log

Policy settings

*1*

Test mode

While on, money is notional. Statements and the artist dashboard carry a “simulated” label, businesses see a free-trial note, and no payouts are made. A temporary, pilot-only state — it disappears at commercial launch, when the switch and this whole box are removed, and commercial transactions flow across the ecosystem.

OnOff

*2*

| Setting | Value | Last changed |
| --- | --- | --- |
| Site fee | $49.99 per site, per month | Alex · 3 Sep |
| Revenue split | 70% artists · 30% The Pack | Alex · 3 Sep |
| Play threshold | 30 seconds | Alex · 3 Sep |
| Payout threshold | $10 | Alex · 3 Sep |
| Loudness target | −14 LUFS | Alex · 3 Sep |
| Accepted AI answers | No | Alex · 3 Sep |
| Playlist rules | No artist twice in a row · No repeat in 3 hours | Alex · 3 Sep |

*3*

Feature flags

Business player: onListener home: onMap and gigs: on

*4*Test mode switched on by Alex, 3 Sep. Every change is kept in the audit log.

1. 1

   Test mode is one switch. While money is notional it adds the “simulated” and free-trial wording on C7, C8, B1 and B4. Turning it off shows the real figures. It is a pilot-only state: at commercial launch Test mode, and this switch, are retired for good.VEN-9, PAY-9, ADM-4
2. 2

   The numbers that drive the ledger, the checks and the playlists live here, not in the code. The values shown are examples, and the loudness target is still to be settled.ADM-4, PAY-2, D-10
3. 3

   Feature flags let a part of the app be switched on for everyone when it is ready.ADM-4
4. 4

   Every change is logged with who, when, the old value and the new value.ADM-4, ADM-7

E

### Listener: on the go and planning

Signed-in listener.

A listener can add the songs they found in real places, listens on the go — at home, on headphones, wherever they are — to playlists chosen by people or personally curated, can see where their money goes, and can plan a night out. It is part of the same app as the other journeys.

1. [**E1**Open a curated home](#wf-e1)
2. [**E1**Follow artists and businesses](#wf-e1)
3. [**E2**Play with a queue](#wf-e2)
4. [**E3**Keep a library](#wf-e3)
5. [**E4**See where the money goes](#wf-e4)
6. [**E4**Become a Patron](#wf-e4)
7. [**E5**Find somewhere on the map / giglist](#wf-e5)

Curated by a named personNo “recommended for you”Your library is privateThe 70/30 is shown, not hidden

E1

#### Home, curated by people

Phone. Signed-in listener.

The PackMe

*4*

Good evening

Tuned to: Folk, Indie

Curated by Alex & The Pack*1*

Slow songs from Fremantle

Chosen by Sam

Fresh from Margaret River

**Slow Water**Marlo Finch

Following*2*

*5*The Southerlies ✓Example Café ✓ 🌐 PublicFollow Marlo Finch

HomeLibraryMapMe

*3*

1. 1

   Every section names the person who chose it. “Curated by” is a Pack or business curator’s rule-checked playlist (D3, B5); “Chosen by” is a person’s own informal picks, such as a listener’s personal playlist. There is no “recommended for you”, “trending” or “because you listened” anywhere.CUR-6, D-24
2. 2

   Follow artists and businesses. What they do shows up here over time.Roadmap, LIS-7
3. 3

   Four tabs: Home, Library, Map and Me.Roadmap
4. 4

   At subscription, and any time after from Me, a listener picks genres and vibes they like or would rather skip. Home leans toward curated sections that match. Every song is still there because a named curator chose it — nothing is picked from listening behaviour, and sections keep their “Curated by” or “Chosen by” credit, never “recommended for you”.LIS-10
5. 5

   Following a person or business asks Follow privately (default) or Follow publicly. Private follows stay LIS-7: businesses and artists see counts only. A public follow adds the listener to a visible supporters list on that artist or business page, so they can be thanked and see who is backing them — the listener chooses this, and can switch back to private at any time.LIS-11

E2

#### Full-screen player and queue

Phone. Signed-in listener.

The Pack

*1*

Slow Water

Marlo Finch · Margaret River · Curated by Alex & The Pack

Heard at Example Café · 19 Sep*4*

⏮▶⏭

*3*♡ Save+ Add to playlist

*2*

Up next

*5*In order⤨ Shuffle

≡Tide TablesThe Southerlies

≡Paper BoatsDune Season

1. 1

   A player for listening wherever the listener is — at home, on headphones, out and about: big artwork, progress, previous and next. The Media Session lets the lock screen show the song.Roadmap, PLY-7
2. 2

   A queue the listener can reorder. Nothing is queued by an algorithm.Roadmap, D-24
3. 3

   Save, and add to a playlist.Roadmap
4. 4

   A song first saved in a business keeps its “Heard at” tag wherever it appears.LIS-4, Roadmap
5. 5

   The listener chooses In order or Shuffle for their own queue. It is their own playback choice, not an algorithm picking what plays.Roadmap

E3

#### My library

Phone. Signed-in listener.

The Pack

Library

Heard somewhere realPlaylistsFollowing*1*

**Long Way Down**Example Café · Sat 19 Sep

**Slow Water**Corner Books · Thu 17 Sep

Your playlists*2*

**Sunday mornings**6 songs

\+ New playlist

Only you can see your library.*3*

HomeLibraryMapMe

1. 1

   Three views: songs saved from businesses, the listener’s own playlists, and who they follow.LIS-4, Roadmap
2. 2

   Playlists are the listener’s own. Songs keep their “Heard at \[business\] · \[date\]” tag inside them.LIS-4, Roadmap
3. 3

   A library belongs to the listener. Businesses and artists see counts only, never whose list it is.LIS-7

E4

#### Where my money goes, and Patron

Phone. Signed-in listener.

The Pack

Where your $9.99 goes

*1*

**$6.99** to the artists you listened to**$3.00** The Pack

*2*

The Southerlies**$2.10**

Marlo Finch**$1.50**

Dune Season**$1.05**

Other artists**$2.34**

*3*

Become a Patron

Give a little extra. It goes to the Foundation, to support artists who need it most.

$5$10$20a month

Become a Patron

See the Foundation report*4*

1. 1

   The 70/30 shown as a picture and as cents. Your subscription goes to the artists you played, not into a shared pool.PAY-2, Roadmap
2. 2

   Every artist line is a real amount that adds up to the total. Rounding never loses a cent.PAY-4, Roadmap
3. 3

   Patron is an optional extra that goes to the Foundation. It is separate from the artist pool.Roadmap
4. 4

   The Foundation report shows where Patron money went. The Foundation’s governance is set out first.Roadmap

E5

#### Map of participating businesses

Phone. Listener.

The Pack

*2*Open nowVibeLocal artistsGig calendar

*1*

*3*

Example Café

ON AIR

Café · Fremantle · open until 3 pm

Upcoming gigs*4*

The SoutherliesFri 25 Sep · 7 pmDetails

Dune SeasonSat 3 Oct · 6 pmDetails

HomeLibraryMapMe

1. 1

   A map of participating businesses, so a listener can decide where to go tonight.Roadmap
2. 2

   Filter by vibe, local artists or open now to match the mood. Gig calendar opens a separate gig guide — not every business has live music, so gigs are not one of the map’s own filters.CAT-5, Roadmap
3. 3

   Tap a pin for the business profile and whether it is on air right now.LIS-5, Roadmap
4. 4

   Gigs are fed by a partner API (Giglist or ENTX), not built in The Pack. An artist self-selects which of their own gigs to publish to it — nothing is admin-curated or ranked by popularity.D-24, Roadmap

Section 7

## Data model

A draft list of what the database holds. It is the starting point for D-03, the target schema to be tested with both Michael (Extensa) and Merida before it is frozen and sent for MetaGen’s mapping.

| Entity | Key fields | Notes |
| --- | --- | --- |
| **User** | id, email, roles, status, terms accepted (document, version, time) | Roles per [ACC-2](#ACC-2). No third-party identity. |
| **Artist profile** | user, public name, private legal name, region, bio, story, cohort label, creator ID link | [ART-1](#ART-1), [ADM-8](#ADM-8). |
| **Business and site** | business, site name, address, region, business type, hours, vibe, notional fee, QR short code | One business, many sites. [ACC-4](#ACC-4), [VEN-1](#VEN-1), [VEN-9](#VEN-9). |
| **Release** | id, artist, title, type, UPC, label, rights status, current version, state | [CAT-1](#CAT-1), [CAT-4](#CAT-4), [RTS-1](#RTS-1). |
| **Package version** | release, version number, checksum, original file location, parsed record, check results, submitted by and at | The original is immutable. [ING-7](#ING-7), [ING-8](#ING-8). |
| **Track** | release, position, title, ISRC, ISWC, master, renditions, loudness (integrated, true peak, range), AI declaration, language, explicit, genre, descriptors, story | [CAT-1](#CAT-1), [PLY-1](#PLY-1), [TAX-1](#TAX-1). |
| **Person** | name, IPI, ISNI, linked user (may be empty), unclaimed balance key | A person, not free text. [CAT-7](#CAT-7), [PAY-8](#PAY-8). |
| **Contribution** | track, person, role, writing share, recording share if supplied | Which shares MetaGen sends is ask A6. |
| **Identifier** | type, value, scope | ISRC unique per track, UPC per release. [CAT-6](#CAT-6). |
| **Taxonomy term** | list, term ID, label, parent, list version, retired at | Retired, never deleted. [TAX-5](#TAX-5). |
| **Rights check** | release, status (from the artist’s declaration), notes, checked by and at | [RTS-1](#RTS-1), [RTS-3](#RTS-3). |
| **Agreement acceptance** | user, document, version, time | [ACC-7](#ACC-7), [ART-3](#ART-3). |
| **Playlist and version** | playlist, version, curator, ordered tracks, rule results, published at | [CUR-1](#CUR-1), [CUR-3](#CUR-3). |
| **Site assignment** | site, playlist version, from, to | Roll-back is a new assignment. [CUR-3](#CUR-3). |
| **Play event** | event ID, site, track, start time, seconds played, playlist version | The event ID makes a retry safe. [PAY-1](#PAY-1). |
| **Skip feedback** | site, track, reason, time | [VEN-3](#VEN-3). |
| **Site pot** | site, month, fee in cents, artist pool, Pack share, state | [PAY-2](#PAY-2), [PAY-6](#PAY-6). |
| **Ledger entry** | id, type, person, track, site, month, cents, reverses (entry ID), created at | Append-only. Types: accrual, adjustment, hold, release, payout. [PAY-5](#PAY-5). |
| **Statement** | artist, month, totals, generated from the ledger | [PAY-9](#PAY-9), [PAY-10](#PAY-10). |
| **Listener save** | listener, track, site, time | Belongs to the listener. [LIS-4](#LIS-4), [LIS-7](#LIS-7). |
| **Setting** | key, value, changed by, changed at | Fee, shares, threshold, loudness target, accepted AI answers. [ADM-4](#ADM-4). |
| **Audit log** | actor, action, target, reason, time | [ACC-5](#ACC-5), [ADM-7](#ADM-7). |

#### Rules that apply everywhere

- Money is stored as whole cents and never as a decimal.
- People, releases and tracks are matched by identifier, never by typed name.
- Nothing that affects money is edited or deleted. A correction is a new entry that points at the old one.
- Every list that changes, such as genres and playlists, is versioned, and each record says which version it used.
- Every record that a person can see or export carries a region, an owner and a created time.

Section 8

## Payments engine

The model is user-centric: each site’s monthly fee is shared only among the tracks played at that site, never pooled with other sites’ fees, and only plays that reached 30 seconds count. This section, and the worked example below, is the business subscription only ($49.99 per site, per month). The individual listener subscription (Phase 3, shown as $9.99 in the listener’s “Where your money goes” screen, E4) is a different figure and works the same way in its own right, split among the artists that listener played. In the pilot, the ledger runs the real rules on notional money. Statements are shown. No payouts are made.

Figure 3. From a site’s monthly fee to ledger entries. Every step uses whole cents, and rounding never creates or loses a cent.

### A worked example, computed from the rules

Fee $49.99 per individual business site, the MVP test value. Artist share 70% rounded down to $34.99, so The Pack keeps $15.00. Three tracks were played 200 times in total at one site in one month.

| Track | Qualified plays | Exact share | Rounded down | Remainder cent | Final |
| --- | --- | --- | --- | --- | --- |
| A. Night Bus | 90 | $15.7455 | $15.74 | 0 | **$15.74** |
| B. Tide Tables | 70 | $12.2465 | $12.24 | +1 | **$12.25** |
| C. Slow Water | 40 | $6.9980 | $6.99 | +1 | **$7.00** |
| **Total** | 200 |  | $34.97 |  | **$34.99** |

Track A is written 60% by Sam and 40% by Jo, so its $15.74 splits into $9.44 and $6.30. The extra cent goes to whichever share has the larger fraction left over. The same rule applies at every step, so the ledger always adds up to the fee.

The rounding rule, confirmed

The MVP fee is $49.99 per individual business site. Tiers by business size and franchise packages come later. Confirmed: the artist share rounds down and the leftover goes to The Pack, so $49.99 gives $34.99 and $15.00 (PAY-2). PAY-4 requires largest-remainder rounding and a test that totals match, so the ledger never loses or creates a cent. What the 70% is a share of — before or after GST and card fees — is still open, pending sign-off with the accountant (D-09).

### The pilot money problem

Free-trial businesses pay nothing, so there is no real revenue to share. The ledger proves the maths, but the pilot cannot prove income. The defaults below reflect the current pilot plan: 5 sites and 50 artists, with roughly 150 tracks between them. Try the numbers below — every input can be changed.

Pilot sites Fee per business site, $ a month Artist share, % Artists in the pilot Sites paying a real fee Payout threshold, $

Notional artist pool, a month**$0.00**

Notional average per artist**$0.00**

Real artist pool, a month**$0.00**

Real average per artist**$0.00**

Paying sites needed to reach the threshold in a month**0**

The calculator uses the same rounding as the ledger for the artist pool. It is a planning aid, not a forecast: broader economic gains for the ecosystem can be extrapolated from it, but the "average per artist" figure spreads the pool evenly, which is not how it will actually play out. In practice, listener choice decides who gets played and how much each artist earns, so real earnings will vary artist to artist rather than land on the average shown here.

### Engine rules at a glance

| Area | Rule | IDs |
| --- | --- | --- |
| Play events | Unique event ID so a retry never double-counts. Players queue events offline and sync later. | [PAY-1](#PAY-1), [PLY-5](#PLY-5), [VEN-4](#VEN-4) |
| Pot and shares | Fee, 70/30 split and the 30-second threshold are settings. Artist share is rounded down. | [PAY-2](#PAY-2), [PAY-3](#PAY-3), [ADM-4](#ADM-4) |
| Rounding | Integer cents. Largest-remainder method at every division. | [PAY-4](#PAY-4) |
| Ledger | Append-only. Corrections reverse and re-post. Nothing is edited. | [PAY-5](#PAY-5) |
| Month-end | A person runs a dry-run, reviews exceptions, then approves. | [PAY-6](#PAY-6), [PAY-10](#PAY-10) |
| Unclaimed money | Contributors with no account accrue to an unclaimed balance tied to the person. | [PAY-8](#PAY-8), [D-13](#D-13) |
| Later payouts | Payout account is an empty field for now. Stripe Connect Express is Phase 2. An artist is paid as soon as their balance reaches the threshold, not monthly. | [PAY-11](#PAY-11), [D-10](#D-10) |

Section 9

## Phased roadmap

Six phases. Phase 1 is the MVP. Phases 0 to 2 line up with our shared three (Prepare, Pilot, Harden). Nothing after Phase 1 is promised a date until Phase 1 is proven.

**Phase 0**Prepare

**Phase 1**MVP: Living Labs pilot

**Phase 2**Harden: money, rights and ERN

**Phase 3**On the go: listening and Patron

**Phase 4**Planning and reach

**Phase 5**Community, commerce and support

Phase 0

Prepare

##### Goal

Both sides have what they need to complete build and integrate processes: our schema, a sample package, agreed terms, and a working development setup.

##### Includes

- Share wireframes and user journeys with all partners (section 6)
- Finish schema v1 and send it (sections 4 and 7)
- Source sample package and spreadsheet template from Merida, or identify what we need to complete build
- Share Pack genre list v1 and the loudness and AI-declaration rules
- Agree pilot terms and the data flow register (section 10), with an NDA if necessary, or an MoU or partnership/licensing agreement if preferred
- Complete hosting, stack and code audit ([D-16](#D-16) to [D-18](#D-18)); open and share Pack-owned accounts and repo
- Device test of the business player ([PLY-6](#PLY-6))
- APRA AMCOS conversation and business licensing wording ([D-25](#D-25))

##### Done when

Merida has our schema and a draft roadmap. Our parser reads her sample package. The accounts, repo and staging environment exist, and system is ready for testing.

Phase 1

MVP: Living Labs pilot

The MVP

##### Goal

A small invited cohort of artists and businesses run the model on a simulated transaction loop, with a person checking each step. Each business plays for a couple of hours a day, like a mini local-only recorded gig, and people are invited to the business to listen and take part. The pilot could run for up to 10 weeks.

##### Includes

- Invite-only artist portal, MetaGen package upload and spreadsheet ingestion (ACC, ART, ING)
- Rights and AI checks with human review (RTS)
- Catalogue, storage, loudness-normalised playback (CAT, PLY)
- Genre and business-fit tagging, curated playlists (TAX, CUR)
- Business accounts, business player, QR now-playing and saves (VEN, LIS)
- Ledger-only payments engine and simulated statements (PAY)
- Admin console and artist data export (ADM, DAT)

##### Who takes part

Order from Merida’s brief: Mel’s band’s two albums first (a real first test case), then invited artists with back catalogue. The volume of music ready for ingestion and the number of businesses taking part are to be confirmed.

##### Done when

The proposed pass marks below hold across the whole pilot (potentially 10 weeks): releases ingest cleanly, playlists play within 2 LU of each other, sites are On air for at least 98% of their agreed pilot hours, the ledger reconciles to $0.00, every artist has a statement, and businesses and artists provide pilot feedback.

Phase 2

Harden: money, rights and ERN

##### Goal

The pilot becomes something that can safely open beyond the invited cohort, and real money moves.

##### Includes

- Stripe Connect Express payouts and artist onboarding, with the payout run approved by Admin
- Contributor claim flow for unclaimed shares ([D-13](#D-13), [D-14](#D-14))
- Business site subscriptions ($49.99 per site a month) billed through Stripe
- DDEX ERN ingestion ([D-02](#D-02)); more automation of review
- New releases and ISRC issuing through MetaGen
- Label gateway tooling and self-serve label permission
- Self-serve data erasure; artist data controls complete
- All music, including the pre-digital music digitisation project, comes through MetaGen with appropriate attribution — no manual ingest that bypasses MetaGen
- Play-log exports for rights reporting; all licensing issues managed with APRA AMCOS (licence-back, DSP licence, OneMusic and reporting: [D-25](#D-25)); bitrate ladder for audio; business channels and dayparts

##### Done when

At least one real payout has reached an artist bank account. A legal read has confirmed unclaimed-balance and publisher handling. Open artist and business sign-up runs with review.

Phase 3

On the go: listening and Patron

##### Goal

Listeners can stream the catalogue on their own, wherever they are, and subscriptions fund the artist pool.

##### Includes

- Listener accounts with $9.99 subscription and no free tier
- Full-screen player, queue, playlists, follow artists and businesses
- Human-curated home feed labelled “Curated by”
- Rich artist and business profiles
- Patron tier and Foundation reporting
- Earnings transparency screen for listeners (“where my money goes”)
- iOS background audio decision ([D-19](#D-19)); Media Session controls
- Basic artist and business analytics (counts only)
- Voluntary diversity survey, if consent and privacy advice allow ([D-23](#D-23))

##### Done when

A listener can subscribe, listen and see where their money went. Artists’ statements combine business and listener income under one ledger.

Phase 4

Planning and reach

##### Goal

Listeners plan where to go, and The Pack works beyond one precinct.

##### Includes

- Map of participating businesses (OpenStreetMap and MapLibre)
- Vibe, local-artist and gig-calendar filters
- Local government and agency accounts for public spaces and venues, and region-assigned playlists
- Regional discovery across the Living Labs areas (Bunbury, Busselton, Margaret River, Vincent, Subiaco, Fremantle)
- Geo-fenced local-first discovery

##### Done when

A council or other government agency supports a regional playlist through their own account.

Phase 5

Community, commerce and support

##### Goal

Shipped by member demand, in any order, once the base is stable.

##### Includes

- Social hub (see the feature catalogue below)
- Interactive jukebox and paid requests
- Merch and ticket sales; band pages and press kits
- Musician support programs and skill-share
- Member voting and governance tools
- Kamunity Hub as a governance and skill-share space
- Public API, offline listening, native Android, multi-language, analytics export

##### Done when

Each item has its own success test before it starts.

### Value-add feature catalogue

Ideas from earlier system scoping, each placed in a phase.

| Feature | Phase | Dependencies |
| --- | --- | --- |
| Interactive jukebox: listeners request songs for a small fee, split artist, business and Foundation | Phase 5 | Needs live payments and mobile app first. |
| Business loyalty rewards and approvals of requested songs | Phase 5 | Depends on jukebox. |
| Business promo materials (window stickers, flyers) | Phase 1 basic, Phase 5 extras | QR sign kit is in the MVP (VEN-8). |
| Business pricing tiers by business size, and franchise packages | Not yet scheduled | Follows testing at the MVP fee of $49.99 per site. The fee is stored per site (PAY-2). |
| Free personal listener membership included with a business subscription | Phase 3 | Needs listener subscriptions. |
| Patron tier and Foundation reporting | Phase 3 | Needs the Foundation’s governance set out first. |
| Artist analytics: plays, businesses, earnings | Phase 3 | Counts only (D-22). |
| Business analytics: top tracks, check-in counts | Phase 3 | Weekly check-in tallies were marked unknown in the earlier build. |
| Band pages and press kit ($10 a month is proposed) | Phase 5 | Free basic artist profile landing page is in the MVP. About $10 a month is needed to host individual band pages. |
| Artist storefront: merch, downloads, tickets | Phase 5 | Consider linking to Humanitix or a partnership with ENTX first. |
| Gig calendar and notifications about local gigs | Phase 4 | A separate feature, not tied to the business map — not every business has live music. Fed by a partner API (Giglist or ENTX); artists self-select which of their own gigs to publish to it. |
| Local government and agency accounts for public spaces and venues | Phase 4 | Manual relationships until then. City of Fremantle interest noted. |
| Region-assigned playlists | Phase 4 | Curator tool extends CUR-3. |
| Social hub: feed, events, community, patron hub, messaging, music sharing, ticketing and merch sales, etc. | Phase 5 | Integrate an open, federated tool (potentially Mastodon or Bluesky), or build a bespoke members social hub. |
| Live gig streaming | Phase 5 | Potential to integrate PeerTube or similar. Potential partnership with ENTX. Not scoped yet. |
| Crowdfunding and tipping inside artist pages | Phase 5 | Link out to StartSomeGood or Open Collective first. Potential partnership with Notes-for-Notes / CTV. |
| Member voting and governance tools | Phase 5 | Follows co-op maturity. Partnership with Kamunity. |
| APRA AMCOS reporting | Phase 2 export, later automation | Depends on the licence outcome (D-25). |
| Digitising pre-digital local music | Phase 2 | Comes through MetaGen with appropriate attribution, like every other release, not a manual-ingest exception. Major research project with Pro-copy, 2 universities, State Library, community radio, and others. |
| Offline listening, multi-language, pronoun switch function, custom artist domains, public API, native Android | Phase 5 | Explicitly out until the core is proven. |
| Algorithmic recommendations | Not planned | Conflicts with the human-curation commitment (D-24). The policy approach needs careful thought and must be transparent. |
| Synthetic music generation, AI chatbot support, Facebook or Google login, advertising | Not planned | Ruled out on values grounds. |

### Delivery guardrails

Seven rules for how the work is run.

#### Ownership from day one

Repository, hosting, domain, storage, keys and third-party accounts are created in The Pack’s own organisation accounts.

#### Working Build Sprints

A demo at the end of each sprint. The build involves several partners (The Pack, MetaGen and Extensa Studio), so how it is managed across them is to be worked out ([D-28](#D-28)).

#### Every requirement has a test

The “Test” line under each requirement in section 5 is the acceptance check. Done means the test passes on staging.

#### Second pair of eyes

Every change is reviewed by someone who did not write it, or by an automated review plus a weekly human read if the team is one person.

#### Written handover as we go

README, runbook, architecture note and a decision log kept in the repo, not in anyone’s head.

#### Change control

Major scope changes or spend require consultation across partners. Keep a change log.

#### A stop-or-go review

A joint review halfway through the pilot to decide whether to continue, change course or start next phase early.

Section 10

## Agreeing the partnership

What partners need to agree before the pilot starts. Costs, contributions and the NDA are not yet agreed, so nothing in this document is a commitment.

### MetaGen

| ID | Ask | By | Why it matters |
| --- | --- | --- | --- |
| A1 | Sample package and spreadsheet template with real field names, file layout and a real loudness value. | Phase 0 | Lets the dev team see the real thing before freezing the schema. |
| A2 | Which DDEX message and version the Converter writes (ERN, or RIN and RDR-N), and the package layout: file naming, manifest, checksums, audio formats and bit depths, artwork spec. | Phase 0 | Sets the parser and the accepted formats (D-02). |
| A3 | How the AI declaration works: question wording, answer options, who answered, timestamp, and whether delivery can be blocked unless the answer is on our accepted list. | Phase 0 | ING-5 and D-07. |
| A4 | Loudness fields: integrated loudness, true peak and loudness range, measurement tool and version, and whether measured at conversion or on the final file. | Phase 0 | PLY-1 to PLY-3. |
| A5 | Whether the package carries the Verified Human Creator ID link and status. | Phase 0 | LIS-2. |
| A6 | Which splits travel in the package (writing only, or recording and performer too), and whether dated confirmations are included. | Phase 0 | Payout split (ART-5). |
| A7 | How a corrected re-delivery is signalled: same release ID with a version, or a new package. | Phase 0 | ING-7. |
| A8 | Set up the Pack genre list in Discovery fields once we send v1, and say how free text and cultural reference points are represented. | Phase 1 | TAX-1, TAX-3. |
| A9 | Pre-load released-track data for the pilot cohort and pull Mel’s band’s two albums (mastered WAVs by Dropbox link). | Phase 1 | Real first test case. |
| A10 | Label name, P line and a contract flag in the package, so The Pack can route label permission. | Phase 1 | D-15. |
| A11 | Support model: who helps artists with MetaGen problems and who with Pack portal problems, with response times. | Phase 1 | Avoids artists bouncing between us. |
| A12 | Timeline for ISRC issuing, DDEX ERN design, and any support for diversity and licence-back fields. | Phase 2 | D-23, Phase 2 plan. |
| A13 | Agree a draft roadmap with Merida once she has the wireframes and schema. | Phase 0 | Allows for cross-system co-design. |
| A14 | What MetaGen stores after the package reaches The Pack (the artist’s metadata, splits records), for how long, and who handles an artist’s export or erasure request for it. | Phase 0 | Sets the data flow register (DAT-4) and how far DAT-1 to DAT-3 reach. |

### The Pack

| ID | Offer | By |
| --- | --- | --- |
| P1 | Wireframes and user journeys (section 6) shared with Merida. | Phase 0 |
| P2 | Target schema v1, field rules, error table and proposed package layout (sections 4 and 7). | Phase 0 |
| P3 | Pack genre and business-fit lists v1, and policy, governance and process rules. | Phase 0 to 1 |
| P4 | A staging portal with a test upload endpoint, before any real artist uploads. | Before pilot |
| P5 | The pilot cohort list and invite plan, with Mel’s band as the first case. | Phase 1 |
| P6 | A monthly summary of ingestion failures by error code (no artist data), so MetaGen and The Pack can review what confuses people. | Phase 1 |
| P7 | Artist feedback on the Converter experience. | Phase 1 |

### Points to agree or resolve

| Point | Where we are |
| --- | --- |
| **Pilot scope, stages, price and what counts as done for each stage** | Costs and contributions are not agreed yet. Worth considering whether a “free pilot” might be more likely to attract (business) participants than a paid pilot at this early stage? |
| **NDA, MoU or Partnership Agreement / Licensing Agreement** | Both sides have offered to develop. A co-design opportunity, to agree a mutually beneficial process. |
| **Who owns what** | The portal and ingestion code (The Pack). The MetaGen app (MetaGen). The mapping work and the Pack genre and business-fit lists, and permission for MetaGen to reuse the lists for future integrations. |
| **Data roles** | MetaGen keeps the artist’s metadata but does not store the music package once it reaches The Pack, which then becomes the custodian of that package. Sign the one-page data flow register (DAT-4). Take privacy advice, including who answers an export or erasure request for metadata held by MetaGen (to confirm with Merida, A14). |
| **Format changes** | A named contract version for the package, and notice before it changes. |
| **Support and response times** | Artist support split (A11) and how issues are managed between the two teams. |
| **Naming** | Use of partners’ branding. |
| **Exit** | What happens if either side decides to exit the agreement: artists’ data stays theirs; packages already delivered remain readable. |

### Questions for Extensa Studio

1. Estimate each requirement ID in section 5 as S, M or L, and flag any you would split or challenge. Time estimates to be provided after the schema is agreed.
2. Confirm or replace the proposed targets (upload size, ingest time, uptime, loudness spread) in [NFR-4](#NFR-4), [PLY-3](#PLY-3) and the Phase 1 exit test.
3. Propose the ingestion architecture: queue, workers, storage, idempotency, and how a parser plugs in behind the common schema.
4. Run audit of the old repo ([D-18](#D-18)) and note what, if anything, is reusable.
5. Run the device test for the business player ([PLY-6](#PLY-6)) and report the result before committing to a rendition and gain approach.
6. Test hosting options with Serversaurus and Rackmill (or other ethical / Australia-based hosting option) ([D-16](#D-16)) and report CapRover fit and audio delivery performance.
7. Draft the ledger schema and prove the rounding rule ([PAY-4](#PAY-4)) with a property test.
8. Work through points of dependency with MetaGen, and agree approach.

Section 11

## Decision register

29 decisions, each with a recommended default. The default is a starting point for the owner, not a decision made for them.

| ID | Decision | Background | Recommended default | Owner | By | State | Affects |
| --- | --- | --- | --- | --- | --- | --- | --- |
| D-01 | **Where the package lands** | Merida’s description of the flow says the artist uploads through The Pack’s portal - Pack controls accounts and access. | The Pack portal. It keeps sign-in and access with us and matches Merida’s flow description. | Pack PM / MetaGen PM | Phase 0 | Open | [ING-1](#ING-1), [ACC-3](#ACC-3) |
| D-02 | **Which DDEX message and version** | Public MetaGen listings say the Converter writes RIN and RDR-N (beta). | Confirm with Merida and build the parser accordingly. In general streaming would support ERN 3.8 and 4.x. Spreadsheet first regardless. | MetaGen PM | Phase 0 | Open | [ING-3](#ING-3) |
| D-03 | **Pack target schema** | Merida can only map MetaGen’s output once she understands The Pack’s stack and format, so our schema comes first. | Extensa (Michael) finalises sections 4 and 7 of this draft as schema v1. Test it with both Michael and Merida before it is frozen, then send it to Merida with the wireframes. | Pack PM / Extensa | Phase 0 | Open | [CAT-1](#CAT-1), [ING-4](#ING-4) |
| D-04 | **Catalogue and distribution APIs** | The Pack had been evaluating existing ingestion APIs. The streaming architecture note also describes an ISRC and Spotify look-up engine. | Now not necessary for The Pack to develop. MetaGen delivers a clean package and does the look-ups. | Pack PM / Extensa | Phase 0 | Open | [ING-4](#ING-4) |
| D-05 | **Loudness target and verification** | MetaGen measures to EBU R128. The Pack chooses the playback target. | Pick one target (common references are −14 and −16 LUFS) with a per-site trim for businesses. Verify MetaGen’s value once on ingest and warn on a difference. | Pack PM / Extensa | Before pilot | Open | [PLY-1](#PLY-1) to [PLY-3](#PLY-3), [ING-10](#ING-10) |
| D-06 | **Genre and business-fit lists** | The Pack developed a list of 15 parent genres and more than 400 sub-genres. To cross check with MetaGen’s lists and add to if required. | Develop an agreed list of parent and sub-genres for the pilot, with potential to expand as necessary, plus a separate business-fit layer (section 4). Send v1 to Merida. | Pack PM / MetaGen | Phase 0 | Open | [TAX-1](#TAX-1), [TAX-2](#TAX-2) |
| D-07 | **AI declaration policy** | Merida’s question is “did you use AI at any stage?” and delivery can require the answer No. The Pack needs to agree its final policy commitment around acceptable conditions. | Build the gate as a configurable list of accepted answers. Pilot default: accept only No. Decide at board level whether any uses of AI are acceptable (i.e. non-generative tools), and what happens after a false declaration (hold earnings, remove from playlists, review). | Pack Board / MetaGen PM | Before pilot | Open | [ING-5](#ING-5), [RTS-6](#RTS-6) |
| D-08 | **Payment structure: per stream or per song, and the publishing side** | The Pack’s payment model is user-centric by share of plays. | Keep user-centric by share of streams at each site (the public 70/30 commitment). Treat “per song” as the track-level split. Treat per stream (at 30 secs minimum listen time) as trigger for payment. Confirm with Merida. | Pack PM / MetaGen PM | Phase 0 | Open | [PAY-2](#PAY-2), [PAY-3](#PAY-3) |
| D-09 | **What the 70/30 is a share of** | The split is 70% to artists and 30% to The Pack. It is not yet set whether that is a share of the fee before or after GST or card fees. | Use 70/30, with the engine taking a “distributable revenue” input per site-month. Finance sets that input. A sensible default is fee excluding GST, with card fees paid from The Pack’s 30% so the artists’ 70% is untouched. To confirm with Pack Board. | Pack PM, accountant | Before beta | Open | [PAY-2](#PAY-2) |
| D-10 | **Payout threshold** | $10 minimum threshold for payment, paid out monthly on a set date. | No payouts happen in the pilot. Earnings post at month-end (PAY-6), so “as soon as” means the next posting. | Pack PM | Decided | Decided | [PAY-7](#PAY-7) |
| D-11 | **Pilot transactions** | Looking at a non-transactional pilot. | Ledger only, payouts simulated. Real Stripe Connect payouts move to Phase 2. | Pack PM | Decided | Decided | [PAY-11](#PAY-11), [VEN-9](#VEN-9) |
| D-12 | **MVP boundary** | Initial MVP to conclude at first test (little living labs), with at-home listening to be developed for the larger Living Labs test (6 LGAs). | Living Labs pilot MVP. At-home streaming and listener subscriptions are Phase 3. | Pack PM | Decided | Decided | Section 9 |
| D-13 | **Unclaimed contributor shares** | Splits might name people who have no Pack account. Paying artists directly needs each of them to have one. | Accrue to an unclaimed balance, invite the person, pay when they join. Set an expiry rule and take advice on holding funds for others before Phase 2. | The Pack to seek legal advice | Before beta | Open | [PAY-8](#PAY-8) |
| D-14 | **Publisher and label shares** | Merida flagged “how the publishing side works”. The Pack commits to paying artists directly, not labels or publishers. | Capture the data now (RTS-5). Take advice on how writers signed to a publisher are paid before any payout rule depends on it. | The Pack to seek legal advice | Before beta | Open | [RTS-5](#RTS-5) |
| D-15 | **Who owns the label-permission gateway** | Owner not decided; likely The Pack (MetaGen brief). Need to confirm artists are free to distribute and existing recording contracts are known. | Not The Pack. Label and distributor negotiations are between the artist and that label. The Pack relies on the artist’s own declaration (ART-4) and does not send permission letters or chase replies. MetaGen still puts label name, P line and a contract flag in the package, for context. | Pack PM / MetaGen | Decided | Decided | [RTS-1](#RTS-1) to [RTS-3](#RTS-3) |
| D-16 | **Hosting** | Extensa: Hetzner and CapRover with Cloudflare as a documented compromise. The 2025 scope: DigitalOcean, Linode or green hosts. The MVP comparison paper adds Serversaurus (already hosts packmusic.au, unconfirmed for Docker) and Rackmill (Perth, confirmed Docker). The old build ran on AWS. | Ask Serversaurus and Rackmill for a CapRover test. Prefer Australian jurisdiction to match the data sovereignty commitment. Keep Cloudflare only for audio delivery if needed, documented publicly. | Pack PM / Extensa | Phase 0 | Open | [NFR-1](#NFR-1) |
| D-17 | **Technology stack** | Old repo: Go, Postgres, Flutter. Extensa: React and Vite, Node with TypeScript, Postgres, MinIO, Redis. New scope - TBD. The streaming architecture note uses S3, SQS and Celery. | The dev team chooses, within these rules: open source, containerised, no lock-in, everything in Pack-owned accounts. Treat the streaming architecture note as a pattern (queue, workers, object store), not a shopping list. | Pack PM / Extensa Studio | Phase 0 | Open | [NFR-1](#NFR-1), [NFR-8](#NFR-8) |
| D-18 | **Existing code** | The wireframe scope treats most Ninja / Origin development as void. Extensa recommended a clean rebuild that salvages the data model, OneMusic and APRA fields, royalty logic and deployment config. | Treat as void. Audit and determine what is genuinely reusable, and record it in the repo. | Pack PM / Extensa Studio | Phase 0 | Open | [NFR-8](#NFR-8) |
| D-19 | **iOS wrapper** | Extensa reports iOS stops PWA audio when backgrounded and recommends a Capacitor wrapper. | The pilot has no listener audio, and the business player keeps its screen awake, so the wrapper decision moves to Phase 3. Re-test on current iOS then. | Extensa Studio | Before beta | Open | [PLY-6](#PLY-6) |
| D-20 | **Business check-in method** | QR, GPS or manual is noted as a discovery question. Location based data collection will be imperative to the intent - but we need to be able to ensure no data harvesting or sharing for commercial gain. | QR only in the pilot. No location permission asked. | Pack PM / Extensa Studio | Phase 0 | Open | [VEN-8](#VEN-8), [LIS-1](#LIS-1) |
| D-21 | **Cyanite audio tagging** | Extensa scoped Cyanite tagging for genre, BPM, mood and AI detection. The Pack would like to consider ethical partnerships if possible, but notes the value add that this might provide. | To consider further post-pilot. MetaGen discovery fields can cover genre and curators add business-fit tags. Revisit in future phases if curators cannot keep up. | Pack PM / Pack Board / Extensa Studio | Phase 0 | Open | [TAX-2](#TAX-2) |
| D-22 | **What artists see about listeners** | Ideally, artists see which listeners contributed. However, listeners should be able to opt out of visibility for privacy reasons. | Revert to deidentified data - counts only: businesses, plays and listener numbers, never identities. Opt-in named fans can come later. | Pack PM / Pack Board / Extensa Studio | Before pilot | Open | [LIS-7](#LIS-7), [PAY-9](#PAY-9) |
| D-23 | **Diversity data** | Voluntary and after sign-up. Potentially now a MetaGen feature. | Not in the pilot. Seek privacy advice, because ancestry, Indigenous status and sexual orientation are sensitive information under Australian privacy law. Ask Merida about MetaGen support. | Pack / MetaGen - for discussion | Phase 3 | Open | [DAT-5](#DAT-5) |
| D-24 | **Recommendations** | Develop an ethical recommendation engine based on a set of key criteria around multi-stakeholder fairness, user agency and customisation, and algorithmic transparency. | Not in the pilot. To develop specific development guardrails and policy around. | Pack PM / Pack Board / Extensa Studio | Phase 2-3 | Open | [CUR-6](#CUR-6) |
| D-25 | **Licence-back and OneMusic messaging** | Extensa: a business playing only licence-back tracks may not need OneMusic, to be confirmed with APRA AMCOS. | Until APRA AMCOS confirms in writing, businesses retain their OneMusic licence (VEN-7). Record the outcome of the APRA AMCOS conversation here. | Pack PM | Before pilot | Open | [VEN-7](#VEN-7), [ART-3](#ART-3) |
| D-26 | **Commercial terms with MetaGen** | Costs, contributions and an NDA / other agreement have been discussed but not fully resolved. Grants being sought in partnership. | Agree scope, stages, price, ownership of the mapping and taxonomy work, data roles and support before Phase 1 begins (section 10). Develop grants, partnership / licensing agreements etc. | Pack / MetaGen - for discussion | Phase 0 | Open | Section 10 |
| D-27 | **Membership and the Co-op Rules** | Agreeing the T&Cs and Co-op Rules is mandatory for all members. Full members are musicians, with voting rights; Associate members are businesses and individuals, without. | Artists and businesses join as a step of their own straight after account creation, before the upload portal or site player opens (ACC-8, ACC-9). Pilot listener accounts are not memberships, because LIS-6 asks only for an email address. Listeners join as Associate members, accepting the Rules, when they subscribe in Phase 3. Government and patron members join on invitation, the same way. | Pack PM / Board | Phase 0 | Open | [ACC-8](#ACC-8), [ACC-9](#ACC-9), [LIS-6](#LIS-6) |
| D-28 | **Managing the build across partners** | The build spans The Pack, MetaGen and Extensa Studio, and may bring in other partners and contributors. The package hand-off from MetaGen to The Pack is where the parts meet. | One shared backlog and a true and transparent partnership model to be supported. Each partner owns the parts named in the responsibilities matrix, and both sides test the package hand-off before each demo. Write this into the pilot terms (D-26). | Pack PM | Phase 0 | Open | Sections 3 and 10 |
| D-29 | **Open data project consent** | A separate, voluntary consent to use a member’s data to support the health of the music ecosystem — an open data project. | Decided: data for all member types (listeners, artists and businesses), aggregated to SA2 level. Consent is asked at sign-up for artists and businesses and at subscription for listeners, always as its own optional step, never bundled with the Terms or Co-op Rules. An opt-out is available at any time. The consent screen carries an overview of the project noting its value to the music industry, research and government decision-making. Built as ACC-10. | Pack Board | Phase 3 | Decided | [ACC-10](#ACC-10), [LIS-7](#LIS-7), [D-23](#D-23) |

Section 12

## Risks, assumptions and scope limits

### Risks

| ID | Risk | What we do about it |
| --- | --- | --- |
| R1 | ERN versus RIN and RDR-N is unresolved. | Spreadsheet first. Do not start the ERN parser until [D-02](#D-02) is answered. |
| R2 | Licensing is unresolved: licence-back, OneMusic, and publisher shares. | Honest business copy ([VEN-7](#VEN-7)). Record the APRA AMCOS outcome. Take advice before Phase 2 payouts ([D-14](#D-14)). |
| R3 | An AI declaration is an answer on record, not detection. | Say so plainly to artists and businesses. Have a board-approved process for a disputed declaration ([D-07](#D-07), [RTS-6](#RTS-6)). Potential to include AI detection at a later phase. |
| R4 | Paying people who have no account, and holding money for them. | Ledger only in the pilot. Legal advice and an expiry rule before real money ([D-13](#D-13)). |
| R5 | Developer continuity, given past failures. | The guardrails above, and Pack-owned accounts. |
| R6 | A business player left switched off kills the loop. | ON AIR indicator, resume after reload, heartbeat, and an alert after an agreed period of silence ([VEN-2](#VEN-2), [VEN-5](#VEN-5)). |
| R7 | A thin catalogue makes playlists repetitive. | Check the repeat window against the size of the catalogue before opening businesses. Start with businesses whose taste fits the cohort. Scale fast post pilot. |
| R8 | iOS background audio. | Pilot has no listener audio; re-test for Phase 3 ([D-19](#D-19)). |
| R9 | The taxonomy is wrong for businesses, or leaves communities out. | Adjust the list against pilot feedback, add the business-fit layer, and consult First Nations advisers ([TAX-4](#TAX-4)). |
| R10 | Loudness values do not match the delivered file. | One verification pass on ingest ([ING-10](#ING-10)). |
| R11 | The build grows beyond the pilot. | Feature flags, the out-of-scope list, and an approval process for changes. |

### Assumptions

- MetaGen shares no database with The Pack, supports and stores the artist’s metadata, does not store the music package once it reaches The Pack, but will be provided data by The Pack if it is of interest / relevance.
- The first cohort is re-releases, so every ISRC, ISWC and UPC already exists.
- The pilot cohort is a few hand-picked artists, and businesses in one precinct on free trials.
- The development teams are small. Estimates come from them, not from this draft.
- All proposed approaches are for discussion and can be challenged and innovated / evolved.

### Not in the pilot

- Listener audio streaming on the go, listener subscriptions and the Patron tier (Phase 3)
- Real payouts, Stripe Connect and business billing (Phase 2)
- DDEX ERN ingestion, ISRC issuing and new releases (Phase 2)
- Label permission tooling and self-serve erasure (Phase 2)
- Map, gig calendar and regional discovery (Phase 4)
- Local government and agency accounts for public spaces and venues (Phase 4; manual relationships until then)
- Social feed and messaging; jukebox; merch and tickets; and band page store (Phase 5)
- Diversity survey and any other sensitive personal data (Phase 3 at the earliest)
- Native Android, native iOS wrapper, offline listening, multi-language, public API, custom domains
- Algorithmic recommendations, Cyanite tagging, GPS check-in, third-party login (excluded or deferred by decision)

Section 13

## What could not be verified

Points in this draft that could not be checked, and need confirming.

- MetaGen: how “Convert to The Pack” actually behaves. Pack catalogue container and hosting still to be completed for Phase 1.
- The state of the existing repository. Previous audits disagree about what was completed, so this draft treats it as void until re-audited (D-18).
- The outcome of the APRA AMCOS conversation about licence-back and OneMusic.
- The text of the Artist Agreement. This draft assumes it will carry the licence-back grant; check the drafted agreement does.
- The current engagement with Extensa Studio. Scope, price and change control are still to be agreed with Michael.
- Style Guide V3 prints two colour codes wrongly (orange as #eff623, magenta as #ffcdf). The RGB values give #EF4623 and #FF2CDF, which the wireframes use. Cyan appears as #00FFFF and as #74F0EE in different versions; #74F0EE is used on dark grounds. To be confirmed with Monkey London - designer.

Draft 1 for review, 20 September 2026. Prepared for The Pack Music Co-operative. Not a contract. Costs and terms with partners are not yet agreed.