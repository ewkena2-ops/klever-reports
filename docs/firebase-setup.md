# Setting up the chat

> **This is already done.** Project `klever-26ad1`, database in `eur3`, rules
> published, Email/Password on, 18 accounts made, 23 channels seeded — all on
> 18 September 2026. Steps 1 to 6 below are kept as the record of what was done
> and as the recipe if it ever has to be rebuilt. **Do not run them again.**
> What you may still need is the last section, the ledger's Script Properties.
>
> Passwords are in `Klever-Access-Codes.txt`, in `all in final`, never here.

Forty minutes, once. Everything here is done in a browser by the Chairman —
nothing needs a developer, and nothing here costs money at Klever's size.

The chat runs on **Firebase**, which is Google, like the sheet and the Apps
Script. Same account.

---

## 1. Make the project

1. Go to <https://console.firebase.google.com> and sign in with the account
   that owns the Klever Reports sheet.
2. **Create a project.** Call it `klever`. Turn Google Analytics **off** — it
   is not wanted here and it asks questions you do not need to answer.
3. Wait for it to finish, then **Continue**.

## 2. Add the web app

1. On the project home page, press the **`</>`** (web) icon.
2. Nickname: `klever-reports`. Do **not** tick Firebase Hosting — the site is
   already hosted on GitHub Pages.
3. **Register app.** Firebase shows you a block of code with a
   `firebaseConfig = { ... }` object in it.
4. Copy the six values out of it into `js/firebase-config.js` in this repo,
   then commit and push.

These values are **not secret.** They name the project; they do not open it.
What keeps people out is step 4 and step 5. This is why the file is allowed to
sit in a public repo, and why the passwords are not.

## 3. Turn on the database

1. Left menu → **Build → Firestore Database → Create database**.
2. Location: **`eur3`** or **`nam5`** — either is fine; pick one and never
   change it. (Ethiopia has no Firebase region; `eur3` is the closer of the
   two.)
3. Start in **production mode**. It will refuse everything until step 4, which
   is correct.

## 4. Publish the rules

1. Firestore Database → **Rules** tab.
2. Delete everything in the box.
3. Paste the entire contents of **`firestore.rules`** from this repo.
4. **Publish.**

Do not skip this and do not "fix" a permission error by loosening it. Those
rules are the only thing standing between the chat and anyone on the internet
who finds the project id. If something is refused, the rule is usually right
and the membership in `js/channels.js` is usually wrong.

## 5. Turn on sign-in and make the accounts

1. Left menu → **Build → Authentication → Get started**.
2. **Sign-in method** tab → **Email/Password** → enable the first toggle
   (leave "Email link" off) → **Save**.
3. **Users** tab → **Add user**, once per person.

The email is always `<id>@klever.local`. It is never used as an email — nothing
is ever sent to it. It exists because Firebase wants an email shape.

The ids are the same ones the report site uses, in `js/forms.js`:

| Person | Email to enter |
|---|---|
| The Chairman | `chairman@klever.local` |
| Ephrata Assfa | `ephrata@klever.local` |
| Mahelet Teshome | `liu@klever.local` |
| Betelhem Aklog | `betty@klever.local` |
| Seble Mulugeta | `seble@klever.local` |
| Getachew Negash | `getachew@klever.local` |
| Yordanos Fikadu | `yordanos@klever.local` |
| Amaha Temechew | `amaha@klever.local` |
| Wude Birhanu | `wude@klever.local` |
| Elyas Mullatu | `elyas@klever.local` |
| Ashenafi Germa | `ashenafi@klever.local` |
| Tsega Girma | `tsega@klever.local` |
| Biruktayet Kassahun | `biruktayet@klever.local` |
| Yohannis Amare Badreg | `yohannis@klever.local` |
| Yonas Abate Nemera | `yonas@klever.local` |
| Abrham Gosaye | `abrham-g@klever.local` |
| Teklweld Birhanu | `teklweld@klever.local` |
| Abrham Webeshat | `abrham-w@klever.local` |

And the 22 production workers, if they are to have chat:
`bisrat`, `natenael`, `webalem`, `yosef`, `birutukan`, `semayat`, `yeshareg`,
`bezawit`, `addisu`, `cheru-moshe`, `tsegaye`, `etaferaw`, `fasika`, `yared`,
`kiflom`, `meseret`, `haben`, `gebeyaw`, `cheru-melaku`, `tsegenet`, `hiwot`,
`bereke` — each `@klever.local`.

**Passwords.** Firebase requires six characters; use **ten or more**. The
six-digit report codes were always "a lock, not a safe" — six digits can be
ground through offline. Chat is a running conversation, so it deserves better.
Three ordinary words with a number is both strong and sayable over a phone:
`tekle-bench-44-door`.

Write them in `Klever-Access-Codes.txt` next to the report codes, in the
`all in final` folder. **Never in this repo** — it is public.

## 6. Create the channels

1. Open <https://ewkena2-ops.github.io/klever-reports/chat.html>
2. Sign in as **chairman**.
3. Press **Set up channels**. It writes one document per channel and says how
   many.

Only the Chairman sees that button, and only he can use it — the rules say so,
not just the page.

Press it again any time `js/channels.js` changes. It overwrites the membership
and leaves every message alone.

---

## What people do

Open the site, press **Chat** in the top bar, sign in once. The phone stays
signed in. Messages arrive instantly; a message written with no signal sits on
the phone and goes out when the signal returns.

## What it costs

Nothing, at Klever's size. The free allowance is 50,000 reads and 20,000
writes a day. Thirty-nine people sending a couple of hundred messages uses
around 2,000 reads. If the day ever comes that this is exceeded, the chat stops
until midnight rather than charging anyone — there is no card attached unless
you attach one.

## Things worth knowing before they surprise you

**Nothing can be deleted.** Not by the person who wrote it, not by the
Chairman. The rules refuse edits and deletions outright. This is deliberate:
the penalty ledger reads this log, and a record that can be quietly revised
afterwards proves nothing. To correct a message, write another message.

**Chat has its own password.** It is not the six-digit report code. One person,
two passwords — worth saying plainly when you hand them out, because it will
otherwise be the first question.

**The Chairman sees everything.** He is a member of every channel by
construction, and each person has a private line to him. Nobody has a private
line to anybody else. If two people need to talk without him, they will use
WhatsApp, and that is fine — this is the company's record, not a replacement
for people's phones.

**Membership lives in `js/channels.js`.** Change a channel there, push, and
press **Set up channels** again. The page and the rules must agree; the button
is what makes them agree.

---

## The penalty ledger's Script Properties

`apps-script/Agent.js` reads filed reports from Firestore, not from the Sheet.
Two reasons, both of which matter: the Sheet is fed by an endpoint anyone can
POST to, so a fine calculated from it rests on a row anybody could have
written; and the Sheet version read every row of every tab each evening, which
would have quietly started timing out in about its second year.

In the Apps Script, **Project Settings → Script Properties**:

| Property | Value |
|---|---|
| `GEMINI_KEY` | your key from aistudio.google.com |
| `FIREBASE_WEB_KEY` | the `apiKey` from `js/firebase-config.js` |
| `LEDGER_PASSWORD` | the `ledger` password in `Klever-Access-Codes.txt` |
| `GEMINI_MODEL` | optional — defaults to `gemini-3.8-flash` |
| `FIREBASE_PROJECT` | optional — defaults to `klever-26ad1` |

Then run **`authorizeAgent()`** once from the editor. It now checks the archive
is reachable as well as granting permissions, so a wrong password fails in
front of you rather than silently at six in the evening.

`previewLedger()` writes nothing and sends nothing. Run that before the trigger.

**The ledger account is not a person.** It reads filed reports and nothing
else — it cannot file one, cannot open chat, cannot alter anything. That is
enforced in `firestore.rules`, not by convention, so if its password ever
leaks what leaks is a reader.
