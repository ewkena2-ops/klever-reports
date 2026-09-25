/* Who talks where.

   Channels mirror the company, not one room with 39 people in it. A production
   worker should not have to scroll past the designers' colour discussion to
   find out the truck is late.

   Membership is computed from the `grp` field on each person in forms.js, so
   adding someone to the company adds them to their channel — there is no
   second list here to forget to update. The Chairman is in everything.

   The same lists are written into Firestore by the Chairman's one-time Seed
   button, and firestore.rules reads them from there. This file is what the
   phone shows; the rules are what actually stops anyone. Keep them in step:
   change a channel here, press Seed again.                                  */

const CHAIRMAN = 'chairman';

/* Who actually has a chat account.

   This mirrors Firebase Authentication, which is the real source of truth —
   a name here with no account behind it produces a channel nobody can open,
   and the Chairman ends up scrolling past private lines to people who cannot
   sign in. The 22 production workers were left out on 17 September 2026: they
   are factory floor, and whether a web chat reaches them at all is worth
   finding out before handing out twenty-two more passwords.

   To add someone: create their account (see docs/firebase-setup.md), add their
   id here, push, and press Set up channels again. */
const CHAT_ACCOUNTS = [
  'ephrata', 'liu', 'betty', 'seble', 'getachew', 'yordanos',
  'amaha', 'wude', 'elyas', 'ashenafi',
  'tsega', 'biruktayet',
  'yohannis', 'yonas', 'abrham-g', 'teklweld', 'abrham-w'
];

function hasChat(id) { return id === CHAIRMAN || CHAT_ACCOUNTS.indexOf(id) !== -1; }

/* the standing channels, in the order they appear on the phone */
const CHANNEL_DEFS = [
  { id:'all',        kind:'team', en:'All staff',    am:'ሁሉም ሠራተኛ',
    descEn:'Everyone. Use it for things the whole company needs.',
    descAm:'ሁሉም ሰው። መላው ድርጅት ማወቅ ላለበት ጉዳይ ይጠቀሙ።',
    grp:'*' },

  { id:'leads',      kind:'team', en:'Leads',        am:'ኃላፊዎች',
    descEn:'Ephrata, Mahelet, Finance, Amaha, Wude, Elyas.',
    descAm:'ኤፍራታ፣ ማህሌት፣ ፋይናንስ፣ አማሃ፣ ውዱ፣ ኤልያስ።',
    ids:['ephrata','liu','betty','amaha','wude','elyas'] },

  { id:'production', kind:'team', en:'Production',   am:'ምርት',
    descEn:'The factory floor — Amaha, Wude and the production workers.',
    descAm:'የፋብሪካው ክፍል — አማሃ፣ ውዱ እና የምርት ሠራተኞች።',
    grp:'production' },

  { id:'site',       kind:'team', en:'Site',         am:'የተከላ ቦታ',
    descEn:'Installation — Elyas, Ashenafi and the assemblers.',
    descAm:'ተከላ — ኤልያስ፣ አሸናፊ እና ገጣጣሚዎች።',
    grp:'site' },

  { id:'commercial', kind:'team', en:'Commercial',   am:'ንግድ',
    descEn:'Sales and design — Ephrata, the salespeople, the designers.',
    descAm:'ሽያጭና ዲዛይን — ኤፍራታ፣ የሽያጭ ባለሙያዎች፣ ዲዛይነሮች።',
    grp:'commercial' },

  { id:'finance',    kind:'team', en:'Finance',      am:'ፋይናንስ',
    descEn:'Finance, Seble, Getachew, Yordanos — and Mahelet, who is copied on their reports.',
    descAm:'ፋይናንስ፣ ሰብለ፣ ጌታቸው፣ ዮርዳኖስ — እና ሪፖርቶቻቸው የሚደርሳት ማህሌት።',
    grp:'finance',
    /* Mahelet is Operations, not Finance, but Getachew's and Yordanos's
       letters both address their reports to "Chairman, copied to Mahelet and
       Betelhem". Without her here there is no room holding all three
       recipients that either man belongs to, and their reports would be
       delivered somewhere two of the three people named could not read them. */
    ids:['liu'] }
];

var CHANNELS = {
  /* every id that belongs in a channel, the Chairman always included */
  membersOf: function (def) {
    var ids = [CHAIRMAN];
    if (def.ids) ids = ids.concat(def.ids);
    if (def.grp === '*') {
      ids = ids.concat(PEOPLE.map(function (p) { return p.id; }));
    } else if (def.grp) {
      ids = ids.concat(PEOPLE.filter(function (p) { return p.grp === def.grp; })
                             .map(function (p) { return p.id; }));
    }
    /* a name can only appear once, however many rules put it there, and a
       name with no account behind it is not a member of anything */
    return ids.filter(function (v, i, a) { return a.indexOf(v) === i && hasChat(v); });
  },

  /* the channels this person can open, standing channels then their own
     private line to the Chairman */
  forPerson: function (id) {
    var out = CHANNEL_DEFS.filter(function (d) {
      return CHANNELS.membersOf(d).indexOf(id) !== -1;
    }).map(function (d) {
      return { id:d.id, kind:d.kind, en:d.en, am:d.am,
               descEn:d.descEn, descAm:d.descAm, members:CHANNELS.membersOf(d) };
    });

    if (id === CHAIRMAN) {
      /* the Chairman sees one private line per person */
      PEOPLE.forEach(function (p) {
        if (hasChat(p.id)) out.push(CHANNELS.direct(p.id));
      });
    } else {
      out.push(CHANNELS.direct(id));
    }
    return out;
  },

  /* a person's private line to the Chairman. Nobody else is ever in it. */
  direct: function (id) {
    var p = null;
    for (var i = 0; i < PEOPLE.length; i++) if (PEOPLE[i].id === id) p = PEOPLE[i];
    return {
      id: 'direct-' + id,
      kind: 'direct',
      en: p ? p.en + ' · Chairman' : 'Chairman',
      am: p ? p.am + ' · ሊቀመንበር' : 'ሊቀመንበር',
      descEn: 'Private. Only you and the Chairman.',
      descAm: 'የግል። እርስዎና ሊቀመንበሩ ብቻ።',
      members: [CHAIRMAN, id]
    };
  },

  /* a job's own channel, the one Finance opens at Gate 1. Job code comes from
     the Job File, so the conversation about a job sits with that job. */
  job: function (code, memberIds) {
    return {
      id: 'job-' + String(code).toLowerCase().replace(/[^a-z0-9-]/g, ''),
      kind: 'job',
      en: 'Job ' + code,
      am: 'ሥራ ' + code,
      descEn: 'Everything about this job.',
      descAm: 'ስለዚህ ሥራ ሁሉም ነገር።',
      members: [CHAIRMAN].concat(memberIds || [])
    };
  },

  /* every standing channel, for the Chairman's one-time seed */
  all: function () {
    var out = CHANNEL_DEFS.map(function (d) {
      return { id:d.id, kind:d.kind, en:d.en, am:d.am,
               descEn:d.descEn, descAm:d.descAm, members:CHANNELS.membersOf(d) };
    });
    PEOPLE.forEach(function (p) { if (hasChat(p.id)) out.push(CHANNELS.direct(p.id)); });
    return out;
  }
};
