# Klever Reports

One link the team opens on a phone to file the daily reports their terms letters require.

**Live:** https://ewkena2-ops.github.io/klever-reports/

Pick your name → pick the report → fill it → **Send on WhatsApp**. WhatsApp opens with the whole
report written out; you choose the group and send. There is also a **Copy** button for desktop.

## What it does

- **Nothing can be skipped.** Send stays disabled until every required field has a value.
- **It knows the targets from the letters.** Below 40 m²/day, waste over 20%, stock accuracy under
  99%, weekly collections under 3,000,000 Birr — the field flags it as you type, and every miss is
  listed under **FLAGS** at the bottom of the sent message.
- **Deadline aware.** Each report shows its deadline, the penalty for being late, and whether this
  filing is on time by the phone's clock.
- **Draft autosave.** A half-filled report survives a closed browser. Drafts are per phone, per day.
- **English and አማርኛ.** Toggle at the top right, or link straight in with `?lang=am`.

## What it does not do

Nothing is stored on a server. No accounts, no database, no analytics. Each report goes from the
phone straight into WhatsApp. The only thing kept is the unfinished draft, in that phone's own
browser storage.

## Reports covered

**Daily — every working day, 5:30 PM**

| Person | Report |
|---|---|
| Ephrata Assfa | Daily Commercial Report |
| Mahelet Teshome | Daily Operations Report |
| Betelhem Aklog | Daily Finance Report |
| Getachew Negash | Daily Purchasing Report |
| Yordanos Fikadu | Daily Store Report |

**Weekly**

| Person | Report | Due |
|---|---|---|
| Mahelet Teshome | Weekly Production & Delivery Summary | Friday 3:00 PM |
| Ephrata Assfa | Weekly Commercial Report | Friday 4:00 PM |
| Betelhem Aklog | Weekly Finance Report (incl. ZamZam reconciliation) | Friday 5:00 PM |
| Betelhem Aklog | Weekly Customer Experience Summary | Friday 5:00 PM |
| Getachew Negash | Weekly Purchasing Summary | Friday 5:00 PM |
| Yordanos Fikadu | Weekly Store Summary | Friday 5:00 PM |

A weekly form counts as late only once its due day has passed, not merely
after its time of day.

Betty's, Getachew's and Yordanos's forms were drafted from the duties in their letters — they had
no report template — so they are marked as such on screen and should be corrected after real use.

Still to add: Betty's 9:00 AM daily cash flow forecast and 6:00 PM daily customer pulse, and the
four planning documents with repeating rows (Ephrata's 4-week projection, Mahelet's 15-day plan,
Betty's 4-week cash flow and payment-confirmed job list).

## Changing a form

Everything is in [`js/forms.js`](js/forms.js). A field is one line:

```js
{id:'m2', en:'m² produced today', am:'ዛሬ የተመረተ ካሬ ሜትር', t:'num',
  tgt:{op:'gte', v:40, en:'Daily target 40 m²', am:'የቀን ዒላማ 40 ካሬ ሜትር'}}
```

- `t` — `num` `money` `pct` `text` `area` `ratio` `yesno`
- `i:1` — indent it under the field above
- `opt:1` — not required, so it never blocks sending
- `tgt` — live check; `op` is `gte` (at least) or `lte` (at most)

Add a person in `PEOPLE`, a report in `REPORTS`. UI wording is in `js/i18n.js`.

## Redeploying

```
git add -A && git commit -m "update forms" && git push
```

GitHub Pages rebuilds in about a minute.
