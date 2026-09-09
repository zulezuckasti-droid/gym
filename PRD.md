# PRD - Gym Workout PWA

Verzija: 1.9
Datum: 8. septembar 2026.
Poslednji update: 9. septembar 2026.
Status: u razvoju — faza 10 kod spreman, čeka iPhone E2E i Vercel

---

## 0. Status implementacije

**Pravilo:** ovaj PRD se ažurira posle svake završene stavke iz sekcije 12 (Redosled izgradnje). Svaka stavka se označava tek kada acceptance kriterijum prođe.

### Trenutni fokus

| | |
|---|---|
| **Aktivna faza** | 10 — Završnica |
| **Sledeći korak** | iPhone E2E, zatim Connect GitHub i Connect Vercel |
| **Blokirano od vlasnika** | Connect GitHub (push još nije urađen); Connect Vercel |

### Napredak po fazama

| # | Faza | Status | Datum | Napomena |
|---|------|--------|-------|----------|
| 1 | Osnova | ✅ Završeno | 2026-09-08 | Dark tema, shadcn, tab bar, PWA manifest, build prolazi |
| 2 | Baza | ✅ Završeno | 2026-09-08 | Supabase `gym` (`gabxxzxniarebovrhsjy`), 6 tabela, RLS, RPC, view, seed funkcije |
| 3 | Auth | ✅ Završeno | 2026-09-08 | Magic link, session, zaštićene rute, logout — E2E test prošao |
| 4 | MVP workout | ✅ Završeno | 2026-09-08 | E2E na iPhoneu prošao — start, draft recovery, finish, sync, istorija |
| 5 | Core UX | ✅ Završeno | 2026-09-09 | Previous, numpad, collapse, set opcije, PR — E2E na iPhoneu prošao |
| 6 | Offline | ✅ Završeno | 2026-09-09 | iPhone E2E prošao — offline finish, reconnect, jedan workout bez duplikata |
| 7 | Sadržaj | ✅ Završeno | 2026-09-09 | iPhone E2E prošao; ispravljeno čuvanje neizmenjenog imena templatea |
| 8 | Istorija | ✅ Završeno | 2026-09-09 | iPhone E2E prošao — edit setova/datuma, add/delete set, brisanje treninga |
| 9 | Progres | ✅ Završeno | 2026-09-09 | PR view, Recharts, stranica vežbe — iPhone E2E prošao |
| 10 | Završnica | 🔄 Kod spreman | 2026-09-09 | Čeka iPhone E2E i Vercel |

### Detalji završenih faza

**Faza 1 — Osnova**
- [x] Next.js shell, Tailwind 4, dark tema (zelena akcent boja)
- [x] shadcn/ui inicijalizovan (`base-nova`, button komponenta)
- [x] Bottom tab bar: Home, History, Progress, Settings
- [x] Placeholder stranice za sve tabove
- [x] Minimalni PWA: `manifest.webmanifest`, `icon.tsx`, `apple-icon.tsx`
- [x] `viewport-fit=cover`, safe-area, font 16px na inputima
- [x] Test na stvarnom iPhoneu (pre prelaska na fazu 4)

**Faza 2 — Baza**
- [x] Supabase projekat `gym` u org `Zuti`, region `eu-central-1` ($0/mesec)
- [x] Tabele: `exercises`, `templates`, `template_exercises`, `workouts`, `workout_exercises`, `sets`
- [x] RLS na svim tabelama (`auth.uid() = user_id`)
- [x] RPC `finish_workout` (idempotentan, `private` šema + public wrapper)
- [x] View `exercise_last_performance` (`security_invoker = true`)
- [x] Seed funkcije: `seed_default_exercises()` (15 vežbi), `seed_default_push_template()`
- [x] Lokalne migracije u `supabase/migrations/`
- [x] TypeScript tipovi u `lib/database.types.ts`
- [x] `.env.local` sa Supabase URL i publishable key
- [x] Security advisor: `anon` revoke na RPC funkcijama
- [ ] GitHub push (repo još nije kreiran)

**Faza 3 — Auth**
- [x] `@supabase/supabase-js` + `@supabase/ssr` instalirani
- [x] Supabase klijenti: `lib/supabase/client.ts`, `server.ts`, `proxy.ts`
- [x] `proxy.ts` — session refresh (`getClaims`) + zaštita ruta
- [x] `/login` — magic link forma (shadcn input, card, button)
- [x] `/auth/callback` — PKCE `exchangeCodeForSession`
- [x] `/auth/confirm` — fallback `verifyOtp` (token_hash)
- [x] Settings — prikaz emaila + logout
- [x] Build prolazi
- [x] Supabase redirect URL podešen
- [x] E2E test: login → Home → logout → redirect na login (`mihailozz92@gmail.com`)

**Faza 4 — MVP workout**
- [x] Zustand + `idb-keyval` (lokalni draft u IndexedDB)
- [x] Home: kartice templatea (samo ime), seed Push templatea pri prvom ulazu
- [x] Banner `Continue {template}` za nezavršen draft
- [x] Dijalog ako se pokrene novi trening dok je stari nezavršen
- [x] `/workout/[id]` — unos KG/REPS, potvrda seta, bez tab bar-a
- [x] Finish summary: trajanje, volumen, napomena, Done
- [x] Atomičan `finish_workout` RPC, client-generated UUID
- [x] Offline queue + retry na launch/focus/online/Settings
- [x] Read-only `/history` i `/history/[id]`
- [x] Build prolazi
- [x] E2E na iPhoneu: start → log set → zatvori app → nastavi → finish → sync → istorija

**Faza 5 — Core UX**
- [x] `Previous` prikaz i prepopulacija polja (`exercise_last_performance`)
- [x] Potvrda seta jednim tapom kada su vrednosti iste
- [x] Custom numpad (readOnly polja, bottom sheet); posle potvrde jednog seta numpad se zatvara
- [x] Collapse završene vežbe u rezime
- [x] Warmup / to failure / delete set
- [x] `+ Add set`, `+ Add exercise`
- [x] PR značka pored seta (bez modala)
- [x] Build prolazi
- [x] E2E na iPhoneu: 1 tap za isti set; 0 mrežnih poziva tokom treninga

**Faza 6 — Offline**
- [x] Queue se trajno upisuje u IndexedDB pre prvog pokušaja slanja
- [x] Offline `Done` odmah ostavlja trening u `pending` stanju bez mrežnog zahteva
- [x] Retry na launch, povratak u foreground, `online` event i ručno iz Settings
- [x] Paralelni retry pozivi se spajaju; uspešno poslate stavke se uklanjaju pojedinačno bez gubitka novih stavki
- [x] Pending/syncing/failed status i ručni retry u UI-u
- [x] Remote RPC idempotency test: isti payload dvaput → jedan workout (`synced`, zatim `already_synced`)
- [x] Build prolazi
- [x] E2E na iPhoneu: finish offline → reconnect → jedan trening u bazi, bez duplikata

**Faza 7 — Sadržaj**
- [x] Seed proširen na ~50 vežbi (`seed_default_exercises`, backfill po imenu)
- [x] `/exercises` — pretraga, grupisanje po mišićnoj grupi, dodavanje custom vežbi
- [x] `/exercises/[id]` — preimenovanje i arhiviranje vežbe
- [x] `/templates` — lista, kreiranje novog templatea
- [x] `/templates/[id]` — preimenovanje, dodavanje/uklanjanje vežbi, target sets, arhiviranje
- [x] `Empty Workout` dugme na Home
- [x] Ad-hoc dodavanje vežbe tokom treninga + dijalog `Add to {template} permanently?`
- [x] `is_adhoc` u finish payload-u
- [x] Linkovi Templates / Exercises na Home i Settings
- [x] Build prolazi
- [x] E2E na iPhoneu: korisnik kreira sopstveni template i vežbe bez hardkodovanih podataka
- [x] Ispravljen `Save` za novo ime templatea bez potrebe za dodatnom izmenom
- [x] Pretraga pri dodavanju vežbe u template
- [x] Ispravljeno čuvanje imena nove vežbe (npr. `zgib`) bez dodatnog slova — uncontrolled polje + čitanje iz DOM-a

**Faza 8 — Istorija**
- [x] Editovanje kilaže i ponavljanja postojećih setova
- [x] Dodavanje i brisanje setova uz automatsko ponovno numerisanje
- [x] Promena datuma završenog treninga
- [x] Brisanje celog treninga uz potvrdni dijalog
- [x] Atomičan `update_workout_history` RPC pod RLS-om (`security_invoker`)
- [x] RPC test u rollback transakciji kao `authenticated`
- [x] TypeScript tipovi regenerisani
- [x] Lint i production build prolaze
- [x] iPhone E2E prošao — izmene odmah osvežavaju History i Previous podatke

**Faza 9 — Progres**
- [x] View `exercise_prs` (`security_invoker = true`), warmup izuzet
- [x] TypeScript tipovi regenerisani
- [x] Recharts + shadcn `chart`
- [x] `/progress` — PR lista, max kilaža po vežbi, volumen po treningu, treninzi po nedelji
- [x] `/exercises/[id]` — trenutni PR, grafikon, istorija setova
- [x] Tap na ime vežbe u History, Progress i Templates vodi na stranicu vežbe
- [x] Finish summary prikazuje nove PR-ove
- [x] Lint i production build prolaze
- [x] iPhone E2E — grafikoni odražavaju stvarne podatke

**Faza 10 — Završnica**
- [x] Superset grupe u template editoru i na aktivnom treningu (A1/A2, naizmenični redovi)
- [x] Bodyweight tip vežbe (samo reps + opciona dodatna kilaža); seed backfill
- [x] Drag-and-drop redosled templatea i vežbi (`dnd-kit`); RPC `reorder_templates` / `reorder_template_exercises`
- [x] PIN lock ekran (4 cifre, hash u `localStorage`) i `Remember PIN for 7 days`
- [x] Screen Wake Lock tokom aktivnog treninga; vibracija na potvrdu seta gde je podržana
- [x] `Export JSON` u Settings
- [x] Serwist service worker (`@serwist/turbopack`), app shell cache, `/offline`
- [x] Ikonice 192/512 i `apple-touch-icon`; `overscroll-behavior: none`
- [x] Lint i production build prolaze
- [ ] iPhone E2E — puna specifikacija
- [ ] Vercel deploy (Connect Vercel od vlasnika)
- [ ] GitHub push (Connect GitHub od vlasnika)

### Infrastruktura

| Stavka | Status |
|--------|--------|
| Supabase projekat | ✅ `gabxxzxniarebovrhsjy` |
| Lokalne migracije | ✅ 9 fajlova |
| Env varijable | ✅ `.env.local` |
| GitHub repo `gym` | ⏳ Nije kreiran |
| Vercel deploy | ⏳ Čeka Connect Vercel |

---

## 1. Pregled

Lična workout aplikacija za jednog korisnika, koja se instalira na Home Screen iPhonea i koristi kao nativna aplikacija. Treninzi se unaprijed definišu kao templatei (Push, Pull, Legs, Upper, Lower) sa vežbama i brojem radnih setova. U teretani se trening pokreće jednim tapom, a tokom treninga se unose samo kilaža i ponavljanja.

**Problem koji rešava.** Postojeće workout aplikacije su prenatrpane funkcijama. Između setova treba mi 3 sekunde da zapišem set i da vidim šta sam radio prošli put, bez navigacije kroz menije.

**Rešenje.** Polja za unos su unapred popunjena vrednostima iz prošlog treninga. Ako radim isto, potvrda seta je jedan tap.

**Strategija isporuke.** Proizvod se gradi u malim vertikalnim fazama. Svaka faza mora raditi end-to-end i proći test na stvarnom iPhoneu pre nego što krene sledeća. Cilj je izbegnuti preopterećen sistem i nekonzistentan kod.

---

## 2. Korisnik i kontekst upotrebe

- Jedan korisnik (vlasnik aplikacije). Nema deljenja, socijalnih funkcija, timova ni onboardinga.
- Uređaj: iPhone, Safari, aplikacija instalirana na Home Screen (standalone PWA).
- Kontekst: teretana, jedna ruka, često slab ili nikakav signal, ekran se gleda 3-5 sekundi između setova.

---

## 3. Prioriteti proizvoda

1. Brzina unosa tokom treninga
2. Pregled prethodnog treninga
3. Jednostavan unos
4. Kvalitetna istorija podataka
5. Mobile-first dizajn

**Metrika uspeha.** Logovanje jednog seta je 1 tap kada su vrednosti iste kao prošli put, i najviše 4 tapa kada se unosi nova kilaža i nova ponavljanja. Tokom treninga nema ni jednog blokirajućeg mrežnog poziva.

---

## 4. Opseg

### 4.1 MVP — prva upotrebljiva verzija

Minimalni tok koji mora raditi pre bilo koje napredne funkcije:

- Magic-link prijava i zaštićene rute
- Jedan seedovan template sa običnim `weight_reps` vežbama
- Home sa karticama templatea
- Aktivni trening: unos kilaže i ponavljanja, potvrda setova, lokalni draft u IndexedDB
- Recovery drafta posle zatvaranja aplikacije
- Finish summary i atomičan upis u Supabase
- Offline queue sa idempotentnim retry-jem
- Read-only istorija završenih treninga
- Minimalni PWA shell (manifest, dark tema, mobile layout)

**Acceptance kriterijum MVP-a:** login → start template → log set → zatvori aplikaciju → vrati se i nastavi draft → finish → sync → vidi trening u istoriji. Test na stvarnom iPhoneu.

### 4.2 Faza 2 — core workout iskustvo

- `Previous` prikaz i prepopulacija polja
- Potvrda seta jednim tapom kada su vrednosti iste
- Custom numpad (readOnly polja, bottom sheet)
- Collapse završene vežbe u rezime
- Warmup / to failure / delete set
- `+ Add set`, `+ Add exercise`
- PR značka pored seta (bez modala)

**Acceptance kriterijum:** logovanje seta 1 tap kad je isto kao prošli put; najviše 4 tapa za novu kilažu i ponavljanja; nema mrežnih poziva tokom treninga.

### 4.3 Faza 3 — upravljanje sadržajem

- Biblioteka vežbi (seed ~50, dodavanje, preimenovanje, arhiviranje)
- Kreiranje, preimenovanje i arhiviranje templatea
- `Empty Workout`
- Banner za nastavak nezavršenog treninga
- Ad-hoc dodavanje vežbe uz pitanje da li da se trajno doda u template

**Acceptance kriterijum:** korisnik može sam da kreira template i vežbe bez hardkodovanih podataka.

### 4.4 Faza 4 — istorija i progres

- Editovanje prošlih treninga (kilaža, ponavljanja, setovi, datum, brisanje)
- Personal records
- Stranica vežbe (PR, grafikon, istorija setova)
- Progress: max kilaža kroz vreme, volumen po treningu, treninzi po nedelji

**Acceptance kriterijum:** izmena istorije ne kvari PR i grafikone; editovanje dolazi posle stabilne read-only istorije.

### 4.5 Faza 5 — napredne opcije i završna obrada

- Superset grupe (A1/A2 kartica)
- Bodyweight tip vežbe (samo reps + opciona dodatna težina)
- Drag-and-drop redosled templatea i vežbi (dnd-kit)
- PIN lock ekran i `Remember PIN for 7 days`
- Screen Wake Lock + vibracija na potvrdu
- Export JSON
- Puna PWA offline podrška (Serwist, app shell cache)
- Ikonice, Vercel deploy, finalni test na iPhoneu

### 4.6 Van opsega (uvek)

- Rest timer između setova
- RPE i tempo
- Kardio i vežbe na vreme (plank)
- Ciljni rep range u templateu
- Plate calculator
- Automatski predlozi progresije i deload
- Jedinica lbs (samo kilogrami)
- Više korisnika, deljenje, socijalne funkcije

---

## 5. Funkcionalni zahtevi

Funkcionalni zahtevi opisuju pun proizvod. Implementacija ide fazama iz sekcije 4; stavke koje nisu u trenutnoj fazi ne grade se unapred.

### 5.1 Auth i privatnost

**Faza MVP:** magic link, trajna sesija, zaštićene rute, logout.

**Faza 5:** PIN od 4 cifre pri otvaranju aplikacije. Čuva se kao hash u `localStorage` i služi kao lokalni lock ekran, ne kao zaštita baze. Prekidač `Remember PIN for 7 days`, podrazumevano isključen.

- Podatke stvarno štiti Supabase RLS. Svaki red u svim tabelama nosi `user_id`; politika je `auth.uid() = user_id`.

### 5.2 Navigacija

- Bottom tab bar: Home, History, Progress, Settings.
- Tab bar se sakriva dok je trening aktivan, da ekran treninga dobije maksimalnu površinu.
- U MVP-u Progress tab može prikazivati placeholder dok grafikoni nisu spremni.

### 5.3 Home

- Velike kartice templatea. Na kartici piše samo ime templatea, bez dodatnih podataka.
- Jedan tap na karticu pokreće trening (bez potvrde).
- Dugme `Empty Workout` za improvizovani trening bez templatea; vežbe se dodaju u hodu (Faza 3).
- Ako postoji nezavršen lokalni draft, na vrhu ekrana je banner `Continue Push` sa vremenom početka. Bez push notifikacija.
- Pokretanje novog treninga dok je stari nezavršen otvara dijalog sa dve opcije: nastavi stari trening, ili završi stari i počni novi.
- Dva treninga u istom danu su dozvoljena i vode se kao dva odvojena unosa.

### 5.4 Templatei

- Kreiranje, preimenovanje i arhiviranje templatea (Faza 3).
- Redosled templatea i redosled vežbi unutar templatea se menja prevlačenjem (Faza 5).
- Za svaku vežbu se definiše broj radnih setova (`target_sets`). Ciljni rep range se ne definiše.
- Superset grupa od dve vežbe (Faza 5). Prikazuje se kao jedna kartica sa oznakama `A1` i `A2` i naizmeničnim redovima setova.
- Brisanje templatea ga arhivira. Istorija treninga ostaje netaknuta.

Primer Push templatea:

- Bench Press - 3 seta
- Incline Dumbbell Press - 3 seta
- Shoulder Press - 3 seta
- Lateral Raise - 4 seta
- Triceps Pushdown - 3 seta

### 5.5 Biblioteka vežbi

- Seed od oko 50 najčešćih vežbi (Faza 3; MVP koristi mali seed od ~15 vežbi), grupisanih po mišićnoj grupi: Chest, Back, Shoulders, Biceps, Triceps, Quads, Hamstrings, Glutes, Calves, Core.
- Mišićna grupa služi isključivo za grupisanje i pretragu u biblioteci, ne za statistiku.
- Dodavanje svojih vežbi.
- Preimenovanje vežbe menja ime svuda; istorija ostaje povezana jer se referiše `exercise_id`, ne ime.
- Brisanje vežbe je arhiviranje: nestaje iz pretrage, ali istorija i grafikoni ostaju.
- Tip vežbe: `weight_reps` ili `bodyweight` (Faza 5). Bodyweight vežba traži samo ponavljanja, sa opcionim poljem za dodatnu težinu.

### 5.6 Aktivni trening

Ovo je najvažniji ekran u aplikaciji i na njemu se odlučuje da li je proizvod uspešan.

**Struktura ekrana**

- Jedna vertikalna scroll lista svih vežbi iz templatea.
- Kada su svi setovi jedne vežbe potvrđeni, kartica se skuplja u jedan red sa kratkim rezimeom (Faza 2).

**Red seta**

S leva na desno: broj seta, sivi tekst prethodnog rezultata (`80 kg x 8`), polje KG, polje REPS, dugme za potvrdu.

- Polja su unapred popunjena vrednostima iz prošlog treninga (Faza 2). Ako je isto, jedan tap na potvrdu završava set i red postaje zelen.
- Novi ili prazan set nasleđuje vrednosti prethodnog seta iste vežbe.
- Tap na broj seta otvara mini meni: `Warmup`, `To failure`, `Delete set` (Faza 2).

**Custom numpad (Faza 2)**

Za prvi unos, kada nema istorije, otvara se bottom sheet numpad:

- Cifre 0-9, decimalna točka, backspace
- Brzi dugmići `-2.5` i `+2.5`
- `Next` i potvrda
- Tok unosa: KG, `Next`, REPS, potvrda. Potvrda čuva set i automatski fokusira sledeći.
- Polja za unos su `readOnly`, da iOS sistemska tastatura nikada ne prekrije ekran.

**Ostalo na ekranu treninga**

- `+ Add set` na dnu svake vežbe, `+ Add exercise` na dnu treninga (Faza 2/3).
- Posle ad-hoc dodavanja vežbe aplikacija pita: `Add to Push template permanently?` (Faza 3).
- Kada set premaši trenutni personal record, pored njega se pojavljuje mala `PR` značka. Bez modala, bez prekidanja unosa (Faza 2).
- Ekran ostaje uključen dok je trening aktivan — Screen Wake Lock API, Safari 16.4+ (Faza 5).
- Vibracija na potvrdu seta, gde je podržana (Faza 5).
- Vreme početka treninga se beleži, ali tajmer nije vidljiv tokom treninga.

**MVP varijanta:** obične `weight_reps` vežbe, ručni unos kilaže i ponavljanja, potvrda seta, lokalni draft. Bez numpada, Previous, warmup, PR i ad-hoc vežbi.

### 5.7 Semantika prethodnog rezultata (Faza 2+)

- `Previous` je poslednji put kada je ta vežba rađena, u bilo kom treningu, ne samo u istom templateu.
- Warmup setovi se izuzimaju iz `Previous`, iz personal recorda i iz volumena.
- Setovi označeni kao `to failure` se u `Previous` prikazuju malom ikonicom, informativno.

Primer prikaza:

```
Bench Press

Set 1   80 kg x 8    [ 80 ] [ 8 ]  (potvrda)
Set 2   80 kg x 8    [ 80 ] [ 8 ]  (potvrda)
Set 3   80 kg x 7    [ 80 ] [ 7 ]  (potvrda)
```

Sivi deo je prošli trening, polja su već popunjena tim vrednostima.

### 5.8 Finish Workout

- Klik na `Finish Workout` otvara summary ekran: trajanje treninga, ukupan volumen, lista novih personal recorda (Faza 4 za PR listu), polje za jednu napomenu o treningu, dugme `Done`.
- Volumen se računa kao suma `kilaža x ponavljanja` po radnim setovima; warmup se ne računa.
- Tek na `Done` se ceo trening upisuje u Supabase, u jednoj atomičnoj operaciji.
- Workout `id` se generiše na klijentu (UUID v4) pre prvog pokušaja slanja; isti ID se koristi pri svakom retry-ju.
- Ako nema mreže, payload ide u pending queue. Korisnik vidi indikator stanja sinhronizacije (vidi sekciju 10).

### 5.9 Istorija

- Lista treninga po datumu, najnoviji prvi, sa imenom templatea i kratkim rezimeom.
- Tap otvara detalje treninga.
- **MVP:** samo read-only prikaz.
- **Faza 4:** editovanje — kilaža, ponavljanja, dodavanje i brisanje setova, brisanje celog treninga, promena datuma.

### 5.10 Progres i personal records (Faza 4)

- Personal record po vežbi je najveća kilaža sa najmanje jednim ponavljanjem, uz zapamćen broj ponavljanja tog seta. Warmup setovi se ignorišu.
- Stranica `Progress` prikazuje: maksimalnu kilažu po vežbi kroz vreme, volumen po treningu, broj treninga po nedelji.
- Tap na ime vežbe bilo gde u aplikaciji vodi na stranicu te vežbe: trenutni PR, grafikon i cela istorija setova.

### 5.11 Settings

- Promena PIN-a i prekidač `Remember PIN for 7 days` (Faza 5)
- `Export JSON` — kompletan dump podataka (Faza 5)
- Status sinhronizacije i ručni retry (vidi sekciju 10)
- Odjava

### 5.12 PWA i iOS

**MVP:** `manifest.json` sa `display: standalone`, tamna tema, osnovne ikonice, `viewport-fit=cover`, font 16px na inputima.

**Faza 5:** pune ikonice 192/512, `apple-touch-icon`, onemogućen pull-to-refresh, Serwist service worker za app shell i statiku.

---

## 6. Dizajn

- Dark tema, jedna akcent boja.
- Veliki tap targeti, minimum 44 piksela visine, računajući na unos jednom rukom i znojave prste.
- Interfejs na engleskom jeziku (Start Workout, Finish Workout, Previous, Add set).
- Bez animacija koje odlažu interakciju.

---

## 7. Model podataka

Sve tabele u `public` šemi nose `user_id` i RLS politiku `auth.uid() = user_id`. Child tabele (`template_exercises`, `workout_exercises`, `sets`) takođe imaju `user_id` radi direktnog RLS-a bez join-a kroz parent.

### 7.1 Tabele

**exercises**
`id` (uuid, PK), `user_id` (uuid, FK → auth.users), `name`, `muscle_group`, `type` (`weight_reps` | `bodyweight`), `is_custom`, `is_archived`, `created_at`

**templates**
`id` (uuid, PK), `user_id`, `name`, `position`, `is_archived`, `created_at`

**template_exercises**
`id` (uuid, PK), `user_id`, `template_id` (FK → templates), `exercise_id` (FK → exercises), `position`, `target_sets`, `superset_group` (nullable, smallint)

**workouts**
`id` (uuid, PK, client-generated), `user_id`, `template_id` (nullable), `name`, `performed_on` (date), `started_at`, `finished_at`, `status` (`completed` — samo završeni treningi na serveru), `notes`, `created_at`

Napomena: aktivni trening (`in_progress`) postoji isključivo u lokalnom Zustand/IndexedDB draftu. Server ne čuva `in_progress` workout-e.

**workout_exercises**
`id` (uuid, PK), `user_id`, `workout_id` (FK → workouts), `exercise_id` (FK → exercises), `position`, `superset_group` (nullable), `is_adhoc`

**sets**
`id` (uuid, PK), `user_id`, `workout_exercise_id` (FK → workout_exercises), `set_index`, `weight` (numeric, nullable za bodyweight), `reps`, `is_warmup`, `to_failure`

### 7.2 Ograničenja i indeksi

- FK sa `ON DELETE CASCADE` gde ima smisla (workout → workout_exercises → sets).
- Unique: `(template_id, position)` na `template_exercises`; `(workout_exercise_id, set_index)` na `sets`.
- Check: `target_sets >= 1`; `reps >= 0`; `weight >= 0` gde nije null.
- Indeksi: `sets(workout_exercise_id)`, `workout_exercises(workout_id)`, `workouts(user_id, performed_on DESC)`, `exercises(user_id, is_archived)`.

### 7.3 Pomoćni objekti u bazi

**View `exercise_last_performance`** (Faza 2)
Za svaku vežbu poslednji završeni trening i njegovi radni setovi. Koristi se za `Previous`, jednim upitom za ceo trening.

```sql
CREATE VIEW public.exercise_last_performance
WITH (security_invoker = true) AS ...
```

**View `exercise_prs`** (Faza 4)
Maksimalna kilaža po vežbi uz broj ponavljanja tog seta, warmup izuzet.

```sql
CREATE VIEW public.exercise_prs
WITH (security_invoker = true) AS ...
```

**RPC `private.finish_workout(payload jsonb)`** (MVP)
Atomičan upis treninga, vežbi i setova u jednom pozivu. Funkcija živi u `private` šemi (nije exposed kroz Data API). Wrapper u `public` šemi delegira poziv.

Pravila:
- `user_id` se uzima isključivo iz `auth.uid()`, nikada iz payload-a.
- Ako workout sa istim `id` već postoji za tog korisnika, operacija je no-op (idempotentnost za offline retry).
- Payload sadrži kompletan završeni trening sa unapred generisanim UUID-ovima.

### 7.4 Odnosi

```
templates 1---N template_exercises N---1 exercises
templates 1---N workouts 1---N workout_exercises 1---N sets
exercises 1---N workout_exercises
```

---

## 8. Tehnički stack

Već instalirano u projektu:

- Next.js 16.3.4 (App Router)
- React 19.2.8
- TypeScript 5
- Tailwind CSS 4
- ESLint 9

Dodaje se po fazama (ne unapred):

| Faza | Paketi |
|------|--------|
| MVP | shadcn/ui (button, card, dialog, input, tabs), `@supabase/ssr`, `@supabase/supabase-js`, Zustand + `idb-keyval` |
| Faza 2 | shadcn/ui (drawer, sheet), custom numpad komponenta |
| Faza 4 | Recharts |
| Faza 5 | dnd-kit, Serwist |

Napomena za razvoj: Next.js 16 uvodi promene u odnosu na starije verzije, pa se pre pisanja koda konsultuje dokumentacija u `node_modules/next/dist/docs/`, kako nalaže `AGENTS.md` u projektu.

**Supabase:** organizacija `Zuti`. Novi projekat `gym` u regionu `eu-central-1`. Šema, RLS, view-ovi, RPC i seed se apliciraju kao migracije preko Supabase MCP-a.

**Git:** privatan GitHub repo `gym`. Agent kreira repo, povezuje `origin`, prebacuje glavnu granu na `main` i pushuje samo proverene kontrolne tačke.

**Deployment:** Vercel, povezivanje na kraju Faze 5.

---

## 9. Rute

Rute se dodaju kada faza koja ih koristi stigne na red; ne generisati prazne stranice unapred.

- `/login` — magic link prijava (MVP)
- `/` — Home, kartice templatea (MVP)
- `/workout/[id]` — aktivni trening (MVP)
- `/history` i `/history/[id]` — istorija i detalji (MVP read-only; Faza 4 edit)
- `/templates` i `/templates/[id]` — lista i editor (Faza 3)
- `/exercises` i `/exercises/[id]` — biblioteka i stranica vežbe (Faza 3 / Faza 4)
- `/progress` — grafikoni (Faza 4)
- `/settings` — podešavanja (MVP osnovno; Faza 5 PIN/export)

---

## 10. Tok podataka i offline strategija

### 10.1 Tok aktivnog treninga

1. Tap na template karticu pokreće upit ka `exercise_last_performance` (Faza 2; MVP može preskočiti Previous).
2. Kreira se lokalni draft treninga u Zustand storeu sa client-generated `workout.id`, persistiran u IndexedDB.
3. Svaka potvrda seta menja samo lokalni draft. Tokom treninga nema mrežnih poziva.
4. `Finish Workout` priprema summary iz lokalnog drafta.
5. `Done` poziva RPC `finish_workout` i upisuje sve odjednom.

### 10.2 Offline queue i idempotentnost

- Ako nema mreže na `Done`, payload ide u pending queue u IndexedDB.
- Retry se pokreće na: pokretanje aplikacije, povratak u foreground (`visibilitychange`), `online` event, ručni pritisak u Settings.
- Svaki payload nosi isti client-generated workout UUID; RPC je idempotentan — ponovni upload istog ID-a ne pravi duplikat.
- Pokretanje novog treninga offline radi samo ako su template podaci i keširani `Previous` već lokalno dostupni.

### 10.3 Stanja sinhronizacije

| Stanje | Značenje | UI |
|--------|----------|-----|
| `local` | Draft aktivan, nije poslat | Nema indikatora |
| `pending` | Finish završen, čeka mrežu | `Pending sync` badge |
| `syncing` | Upload u toku | Spinner |
| `synced` | Uspešno u bazi | Nema indikatora |
| `failed` | Upload neuspeo posle retry-ja | `Sync failed — tap to retry` |

Posle `failed`, korisnik može ručno pokrenuti retry iz Settings ili sa summary ekrana.

### 10.4 Posledica strategije

Aplikacija radi bez signala u podrumskoj teretani. Unos seta je trenutan jer ne čeka mrežu. Podaci se ne gube pri zatvaranju aplikacije jer se draft čuva posle svake potvrde seta.

---

## 11. Ne-funkcionalni zahtevi

- Otvaranje aplikacije do prikaza Home ekrana: ispod 1 sekunde na već instaliranoj PWA.
- Potvrda seta: bez ikakvog vidljivog čekanja.
- Aplikacija mora biti upotrebljiva bez mreže, uključujući pokretanje treninga ako su template i `Previous` keširani.
- Podaci se ne smeju izgubiti ako se aplikacija zatvori tokom treninga; draft se čuva lokalno posle svake potvrde seta.
- Svaka faza mora proći test na stvarnom iPhoneu pre prelaska na sledeću.

---

## 12. Redosled izgradnje

Svaka tačka je završena tek kada acceptance kriterijum prođe. **Posle svake završene tačke ažurirati sekciju 0 (Status implementacije).** GitHub push ide na kraju faze, osim ako vlasnik ne traži ranije.

| # | Faza | Status | Sadržaj | Acceptance kriterijum |
|---|------|--------|---------|-------------------------|
| 1 | Osnova | ✅ | Next.js shell, Tailwind, shadcn, dark tema, tab bar, minimalni PWA manifest | Aplikacija se otvara na iPhoneu, prikazuje shell |
| 2 | Baza | ✅ | Supabase projekat, tabele, RLS, mali seed (~15 vežbi), `finish_workout` RPC | Auth korisnik vidi samo svoje redove; RPC upisuje trening |
| 3 | Auth | ✅ | Magic link, session, zaštićene rute, logout | Login → Home → logout → redirect na login |
| 4 | MVP workout | ✅ | Template kartica, aktivni trening, lokalni draft, finish, sync, read-only istorija | End-to-end tok iz sekcije 4.1 na iPhoneu |
| 5 | Core UX | ✅ | Previous, prepopulacija, numpad, collapse, warmup/to failure | 1 tap za isti set; 0 mrežnih poziva tokom treninga |
| 6 | Offline | ✅ | Idempotentni queue, retry na launch/focus/online/manual | Finish offline → reconnect → jedan trening u bazi, bez duplikata |
| 7 | Sadržaj | ✅ | Biblioteka, template CRUD, Empty Workout, ad-hoc vežbe | Korisnik kreira sopstveni template — iPhone E2E prošao |
| 8 | Istorija | ✅ | Read-only već postoji; dodati editovanje, promenu datuma, brisanje | Edit ne kvari PR podatke — iPhone E2E prošao |
| 9 | Progres | ✅ | PR, stranica vežbe, grafikoni (Recharts) | Grafikoni odražavaju stvarne podatke — iPhone E2E prošao |
| 10 | Završnica | 🔄 Kod spreman | Superseti, bodyweight, dnd-kit, PIN, wake lock, export, Serwist, Vercel | Puna specifikacija funkcionalna na iPhoneu |

**Pravila protiv preopterećenja:**
- Jedna vertikalna celina po iteraciji.
- Biblioteka se dodaje tek kada je potrebna trenutnoj fazi.
- Apstrakcija tek posle drugog stvarnog mesta upotrebe.
- UI komponenta postoji zbog interakcije iz PRD-a, ne zbog „kompletnog“ izgleda.

---

## 13. Infrastruktura i odgovornosti

### 13.1 Git (agent)

- ⏳ Kreira privatan GitHub repo `gym`
- ⏳ Povezuje `origin`, prebacuje glavnu granu sa `master` na `main`
- ⏳ Pushuje proverene kontrolne tačke (posle svake faze iz tabele u sekciji 12)
- Za GitHub povezivanje može biti potreban jednokratni Connect GitHub korak od vlasnika

### 13.2 Supabase (agent, preko MCP-a)

Agent izvršava kompletan Supabase posao:
- ✅ Projekat `gym` kreiran u org `Zuti`, region `eu-central-1` (ref: `gabxxzxniarebovrhsjy`)
- ✅ Migracije, RLS politike, view, RPC, seed funkcije
- ✅ Security advisor proveren; `anon` revoke na RPC
- ✅ Env varijable u `.env.local`
- ⏳ Regeneracija TypeScript tipova posle svake šema promene

SQL, migracije i ručne Supabase korake ne ostavljati vlasniku.

### 13.3 Šta je potrebno od vlasnika

- ✅ Email adresa za test magic linka (Faza 3) — `mihailozz92@gmail.com`
- ✅ Potvrda Supabase cene ($0/mesec, free tier)
- ⏳ Jednokratno Connect GitHub (za push) i Connect Vercel (Faza 10)

---

## 14. Dnevnik odluka

Sve odluke donesene kroz 60 pitanja, radi kasnijeg podsećanja zašto je nešto ovako:

**Unos**
- Polja prepopulirana prošlim vrednostima, potvrda jednim tapom
- Custom numpad za prvi unos, sa decimalnom točkom i dugmićima -2.5 i +2.5
- Novi set nasleđuje vrednosti prethodnog seta
- Slobodan unos kilaže sa decimalama, samo kilogrami

**Setovi i vežbe**
- Broj radnih setova se definiše u templateu, ali se set može dodati ili obrisati tokom treninga
- Warmup setovi se označavaju i izuzimaju iz PR-a, `Previous` i volumena
- Oznaka `to failure` je samo informativna
- Ad-hoc dodavanje vežbe uz pitanje da li da se trajno doda u template
- Superset grupe od dve vežbe, prikazane kao jedna kartica sa `A1` i `A2`
- Bodyweight vežbe kao poseban tip, samo ponavljanja uz opcionu dodatnu težinu

**Trening**
- Jedna scroll lista, završene vežbe se skupljaju
- Bez rest timera
- Wake lock i vibracija na potvrdu
- PR značka pored seta, bez prekidanja
- Trajanje se beleži, ali se tajmer ne prikazuje
- Aktivni trening je isključivo lokalni draft; server čuva samo završene treninge

**Podaci**
- `Previous` je poslednji put kad je vežba rađena u bilo kom treningu
- PR je najveća kilaža sa najmanje jednim ponavljanjem, uz zapamćena ponavljanja
- Lokalni draft posle svake potvrde, upis u Supabase na Finish
- Client-generated workout UUID i idempotentni RPC za offline retry
- Offline queue sa retry na launch, focus, online i ručno
- Istorija je editabilna (Faza 4), datum promenljiv, dva treninga u istom danu dozvoljena
- Brisanje templatea i vežbe je arhiviranje, istorija se ne dira
- Preimenovanje vežbe čuva vezu sa istorijom
- `user_id` na svim tabelama uključujući child tabele
- View-ovi sa `security_invoker = true`; RPC u `private` šemi
- `Export JSON` u Settings (Faza 5)

**Interfejs**
- Dark tema, jedna akcent boja, veliki tap targeti
- Engleski jezik
- Bottom tab bar koji se sakriva tokom treninga
- Na kartici templatea samo ime
- Mišićne grupe samo za grupisanje i pretragu
- Grafikoni: max kilaža po vežbi, volumen po treningu, broj treninga po nedelji
- Stranica vežbe dostupna tapom na ime vežbe bilo gde u aplikaciji

**Pristup i infrastruktura**
- Magic link jednom, trajna sesija, PIN pri otvaranju uz prekidač za 7 dana (PIN u Fazi 5)
- Novi Supabase projekat, šema kroz migracije, agent izvršava preko MCP-a
- Privatan GitHub repo `gym`, agent pushuje kontrolne tačke
- Iterativna isporuka u vertikalnim fazama sa testom na iPhoneu posle svake rizične faze
- Vercel deploy na kraju
