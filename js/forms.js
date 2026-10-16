/* Klever report definitions.
   To change a form, edit the data here — nothing else needs touching.

   field keys:  id  en  am  t(type)  i(indent)  tgt(target check)  opt(not required)
                must(cannot be sent empty — on a question, or on a list's column: every row)
                carry(a list whose rows are the job codes of this person's earlier
                      reports still open — {from:['list.col'|'question'|{f, col, when:{col, is|in}}],
                      shut:[same — a later mention that closes the job], close:{col, in:[…]}, days};
                      or the jobs the script asks this person about — {ask:'<kind>', close:{col}})
   types:       num money pct text area ratio yesno choice
   target:      {op:'gte'|'lte', v:<number>, en:'', am:''}            */

/* `scan`: office staff who check in at the office door by QR code, on
   Klever's WiFi (apps-script/Attend.js, 14 Oct 2026).
   `gate`: everyone at the factory, who checks in by face at the gate's
   tablet (gate.html, apps-script/Gate.js, 14 Oct 2026: "they don't have
   phones"). `worker`: no account and no phone — Amaha says why for them. */
/* the first day a missing scan is asked about (Attend.js AT_FROM_ is the same) */
const ATTEND_FROM = '2026-10-15';
const PEOPLE = [
  { id:'ephrata',  en:'Ephrata Assfa',   am:'ኤፍራታ አስፋ',   roleEn:'Commercial Lead',   roleAm:'የንግድ ኃላፊ', grp:'commercial', scan:1 },
  { id:'liu',      en:'Mahelet Teshome', am:'ማህሌት ተሾመ',   roleEn:'Operations Lead',   roleAm:'የኦፕሬሽን ኃላፊ', grp:'lead', scan:1 },
  { id:'betty',    en:'Selam',  am:'ሰላም', roleEn:'Finance Officer',   roleAm:'የፋይናንስ ኃላፊ', grp:'finance', scan:1 },
  { id:'getachew', en:'Getachew Negash', am:'ጌታቸው ነጋሽ',   roleEn:'Purchasing Officer', roleAm:'የግዥ ኃላፊ', grp:'finance', scan:1 },
  /* The storekeeper. Yordanos Fikadu left the factory (the user, 15 Oct
     2026; her last report Tue 13 Oct) and Alemaya took the store from Fri
     16 Oct. Her reports, fines and pay stay under her id 'yordanos' (the
     Sheet's staff tab keeps her row for the payroll); the store reports are
     Alemaya's. No surname and no terms letter yet, so `noLetter`: no fines
     until the letter is signed — then take `noLetter` out. */
  { id:'alemaya', en:'Alemaya', am:'አለማያ',  roleEn:'Storekeeper',       roleAm:'የመጋዘን ኃላፊ', grp:'finance', gate:1, from:'2026-10-16', noLetter:1 },
  { id:'amaha',      en:'Amaha Temechew',       am:'አማሃ ተመቸው',      roleEn:'Production Supervisor', roleAm:'የምርት ተቆጣጣሪ', grp:'production', gate:1 },
  { id:'wude',       en:'Wude Birhanu',         am:'ውዱ ብርሃኑ',       roleEn:'Quality Control Officer', roleAm:'የጥራት ቁጥጥር ኃላፊ', grp:'production', gate:1 },
  { id:'elyas',      en:'Elyas Mullatu',        am:'ኤልያስ ሙላቱ',      roleEn:'Site Supervisor',   roleAm:'የተከላ ቦታ ተቆጣጣሪ', grp:'site' },
  { id:'ashenafi',   en:'Ashenafi Germa',       am:'አሸናፊ ገርማ',      roleEn:'Site Helper',       roleAm:'የተከላ ቦታ ረዳት', grp:'site' },
  { id:'tsega',      en:'Tsega Girma',          am:'ፀጋ ግርማ',        roleEn:'Salesperson',       roleAm:'የሽያጭ ባለሙያ', grp:'commercial', scan:1 },
  { id:'biruktayet', en:'Biruktayet Kassahun',  am:'ብሩክታይት ካሳሁን',   roleEn:'Salesperson',       roleAm:'የሽያጭ ባለሙያ', grp:'commercial', scan:1 },
  { id:'yohannis',   en:'Yohannis Amare Badreg',am:'ዮሐንስ አማረ ባድረግ', roleEn:'Designer',          roleAm:'ዲዛይነር', grp:'commercial', scan:1 },
  { id:'yonas',      en:'Yonas Abate Nemera',   am:'ዮናስ አባተ ነመራ',   roleEn:'Designer',          roleAm:'ዲዛይነር', grp:'commercial', scan:1 },
  { id:'abrham-g',   en:'Abrham Gosaye',        am:'አብርሃም ጎሳዬ',     roleEn:'Designer',          roleAm:'ዲዛይነር', grp:'commercial', scan:1 },
  { id:'teklweld',   en:'Teklweld Birhanu',     am:'ተክለወልድ ብርሃኑ',   roleEn:'Designer',          roleAm:'ዲዛይነር', grp:'commercial', scan:1 },
  { id:'abrham-w',   en:'Abrham Webeshat',      am:'አብርሃም ወበሻት',    roleEn:'Designer',          roleAm:'ዲዛይነር', grp:'commercial', scan:1 },
  /* The sixth designer, added by the Chairman on 6 Oct 2026; reports from
     the 7th. No terms letter yet and no surname on file, so `noLetter`: his
     reports carry no fines and the rulebook tracks his lines at nothing
     until his letter is signed — then take `noLetter` out. */
  { id:'ermiyas',    en:'Ermiyas',              am:'ኤርሚያስ',          roleEn:'Designer',          roleAm:'ዲዛይነር', grp:'commercial', from:'2026-10-07', noLetter:1, scan:1 },

  /* Betelhem's assistant. She has no terms letter of her own — everything
     about her is written inside Betelhem's. She is here because she does the
     work and needs to be reachable, not because the paperwork caught up. */
  { id:'seble', en:'Seble Mulugeta', am:'ሰብለ ሙሉጌታ', roleEn:'Finance Assistant', roleAm:'የፋይናንስ ረዳት', grp:'finance', scan:1 },

  /* Rovestone, the sister company under the same Chairman (4 Oct 2026: one
     person reports for it, for now). Not Klever staff: `company` keeps her
     out of Klever's own channels, and her reports carry no fines — she has no
     terms letter (noFine on each report). */
  /* Group Finance, the holding over Klever and Rovestone (6 Oct 2026: "the
     finance from Rovestone, called Kidan"). Eight Klever reports are
     addressed "… + Kidan" and payments over 50,000 Birr go to Kidan for
     approval; until now Kidan had no account, so none of it arrived. Kidan
     files nothing here and has no terms letter. `company` keeps Kidan out of
     Klever's "All staff"; the Group Finance room (js/channels.js) is where
     the reports land. */
  { id:'kidan', en:'Kidan', am:'ኪዳን', roleEn:'Group Finance Controller', roleAm:'የቡድኑ ፋይናንስ ተቆጣጣሪ', grp:'groupfinance', company:'rovestone', noLetter:1 },
  /* The other two companies of the group (6 Oct 2026: "add one person mari
     and one lemi kura"). One account each, reporting the way Frewoyni does
     for Rovestone — daily and weekly, no fines (not Klever staff, no
     letter). The Chairman has not given their names yet: each account is
     called for its company until he does (rename `en`/`am`; the id stays). */
  { id:'meri', en:'Meri Block Board', am:'መሪ ብሎክ ቦርድ', roleEn:'Reports for Meri Block Board', roleAm:'ለመሪ ብሎክ ቦርድ ሪፖርት የሚያቀርቡ', grp:'meri', company:'meri', from:'2026-10-07', noLetter:1 },
  { id:'lemikura', en:'Lemi Kura', am:'ለሚ ኩራ', roleEn:'Reports for Real Estate & Construction (Lemi Kura)', roleAm:'ለሪል እስቴትና ግንባታ (ለሚ ኩራ) ሪፖርት የሚያቀርቡ', grp:'realestate', company:'realestate', from:'2026-10-07', noLetter:1 },
  { id:'frewoyni', en:'Frewoyni', am:'ፍሬወይኒ', roleEn:'Rovestone Operations Lead', roleAm:'የሮቭስቶን ኦፕሬሽን ኃላፊ', grp:'rovestone', company:'rovestone', from:'2026-10-05' },

  /* The 22 production workers, from the September payroll sheet. Ashenafi
     Girma on that sheet is Ashenafi Germa the Site Helper, listed above — he
     is not a production worker and must not appear twice.
     THE AMHARIC BELOW IS TRANSLITERATED AND UNCHECKED. Several of these
     names take more than one valid spelling, and Hiwot and Bereke reached us
     with no surname at all. Verify against each ID before use. */
  { id:'bisrat', en:'Bisrat Gashaw', am:'ብስራት ጋሻው', roleEn:'Production Worker', roleAm:'የምርት ሠራተኛ', grp:'production', gate:1, worker:1 },
  { id:'natenael', en:'Natenael Samson', am:'ናትናኤል ሳምሶን', roleEn:'Production Worker', roleAm:'የምርት ሠራተኛ', grp:'production', gate:1, worker:1 },
  { id:'webalem', en:'Webalem Tesfay', am:'ወባለም ተስፋይ', roleEn:'Production Worker', roleAm:'የምርት ሠራተኛ', grp:'production', gate:1, worker:1 },
  { id:'yosef', en:'Yosef Fikadu', am:'ዮሴፍ ፍቃዱ', roleEn:'Production Worker', roleAm:'የምርት ሠራተኛ', grp:'production', gate:1, worker:1 },
  { id:'birutukan', en:'Birutukan Adugna', am:'ብርቱካን አዱኛ', roleEn:'Production Worker', roleAm:'የምርት ሠራተኛ', grp:'production', gate:1, worker:1 },
  { id:'semayat', en:'Semayat Woticho', am:'ሰማያት ወቲቾ', roleEn:'Production Worker', roleAm:'የምርት ሠራተኛ', grp:'production', gate:1, worker:1 },
  { id:'yeshareg', en:'Yeshareg Mengestu', am:'የሻረግ መንግስቱ', roleEn:'Production Worker', roleAm:'የምርት ሠራተኛ', grp:'production', gate:1, worker:1 },
  { id:'bezawit', en:'Bezawit Arba', am:'ቤዛዊት አርባ', roleEn:'Production Worker', roleAm:'የምርት ሠራተኛ', grp:'production', gate:1, worker:1 },
  { id:'addisu', en:'Addisu Fafa', am:'አዲሱ ፋፋ', roleEn:'Production Worker', roleAm:'የምርት ሠራተኛ', grp:'production', gate:1, worker:1 },
  { id:'cheru-moshe', en:'Cheru Moshe', am:'ጨሩ ሞሼ', roleEn:'Production Worker', roleAm:'የምርት ሠራተኛ', grp:'production', gate:1, worker:1 },
  { id:'tsegaye', en:'Tsegaye Ataklti', am:'ፀጋዬ አታክልቲ', roleEn:'Production Worker', roleAm:'የምርት ሠራተኛ', grp:'production', gate:1, worker:1 },
  { id:'etaferaw', en:'Etaferaw Marye', am:'እጣፈራው ማርዬ', roleEn:'Production Worker', roleAm:'የምርት ሠራተኛ', grp:'production', gate:1, worker:1 },
  { id:'fasika', en:'Fasika Abebe', am:'ፋሲካ አበበ', roleEn:'Production Worker', roleAm:'የምርት ሠራተኛ', grp:'production', gate:1, worker:1 },
  { id:'yared', en:'Yared Belayhneh', am:'ያሬድ በላይነህ', roleEn:'Production Worker', roleAm:'የምርት ሠራተኛ', grp:'production', gate:1, worker:1 },
  { id:'kiflom', en:'Kiflom Hadish', am:'ክፍሎም ሃዲሽ', roleEn:'Production Worker', roleAm:'የምርት ሠራተኛ', grp:'production', gate:1, worker:1 },
  { id:'meseret', en:'Meseret Dejene', am:'መሰረት ደጀኔ', roleEn:'Production Worker', roleAm:'የምርት ሠራተኛ', grp:'production', gate:1, worker:1 },
  { id:'haben', en:'Haben Mekonen', am:'ሃበን መኮነን', roleEn:'Production Worker', roleAm:'የምርት ሠራተኛ', grp:'production', gate:1, worker:1 },
  { id:'gebeyaw', en:'Gebeyaw Wale', am:'ገበያው ዋሌ', roleEn:'Production Worker', roleAm:'የምርት ሠራተኛ', grp:'production', gate:1, worker:1 },
  { id:'cheru-melaku', en:'Cheru Melaku', am:'ጨሩ መላኩ', roleEn:'Production Worker', roleAm:'የምርት ሠራተኛ', grp:'production', gate:1, worker:1 },
  { id:'tsegenet', en:'Tsegenet Getachew', am:'ፅገነት ጌታቸው', roleEn:'Production Worker', roleAm:'የምርት ሠራተኛ', grp:'production', gate:1, worker:1 },
  { id:'hiwot', en:'Hiwot', am:'ህይወት', roleEn:'Production Worker', roleAm:'የምርት ሠራተኛ', grp:'production', gate:1, worker:1 },
  { id:'bereke', en:'Bereke', am:'በረከ', roleEn:'Production Worker', roleAm:'የምርት ሠራተኛ', grp:'production', gate:1, worker:1 }
];

/* PUBLIC HOLIDAYS — the days Klever is closed besides Sundays (the user, 15
   Oct 2026: "fix in holiday"). On them, as on a Sunday, nothing is owed: no
   daily report, no check-in at the door or the gate. A weekly report whose
   day falls on one is on time until its week closes (Sunday 9 PM); a monthly
   one is due on the next working day. Ethiopia's federal holidays; the Muslim
   ones go by the moon (moon:1) — the Chairman puts a date right on his page
   (Firestore /holidays/klever: days added, days taken off), and that wins.
   Copied into js/people.js by stamp.py for the pages without this file. */
const HOLIDAYS = [
  { d:'2027-01-07', en:'Ethiopian Christmas (Genna)',        am:'ገና' },
  { d:'2027-01-19', en:'Epiphany (Timket)',                  am:'ጥምቀት' },
  { d:'2027-03-02', en:'Adwa Victory Day',                   am:'የዓድዋ ድል በዓል' },
  { d:'2027-03-10', en:'Eid al-Fitr',                        am:'ኢድ አልፈጥር', moon:1 },
  { d:'2027-04-30', en:'Good Friday (Siklet)',               am:'ስቅለት' },
  { d:'2027-05-01', en:'International Labour Day',           am:'የዓለም የሠራተኞች ቀን' },
  { d:'2027-05-02', en:'Easter (Fasika)',                    am:'ፋሲካ' },
  { d:'2027-05-05', en:'Patriots’ Victory Day',              am:'የአርበኞች ድል ቀን' },
  { d:'2027-05-17', en:'Eid al-Adha (Arafa)',                am:'ኢድ አልአድሐ (አረፋ)', moon:1 },
  { d:'2027-05-28', en:'Downfall of the Derg (Ginbot 20)',   am:'ግንቦት 20' },
  { d:'2027-08-15', en:'The Prophet’s Birthday (Mawlid)',    am:'መውሊድ', moon:1 },
  { d:'2027-09-12', en:'Ethiopian New Year (Enkutatash)',    am:'እንቁጣጣሽ' },
  { d:'2027-09-28', en:'Finding of the True Cross (Meskel)', am:'መስቀል' }
];
/* the Chairman's changes, {add:[{d,en,am}], remove:[d]} — js/fb.js watchHolidays fills it */
var HOLIDAY_EDITS = { add: [], remove: [] };
/* the holiday on a yyyy-mm-dd ({d, en, am}), or null */
function holidayOn(ymd) {
  var E = HOLIDAY_EDITS || { add: [], remove: [] };
  if ((E.remove || []).indexOf(ymd) >= 0) return null;
  var own = (E.add || []).filter(function (h) { return h && h.d === ymd; })[0];
  if (own) return own;
  return HOLIDAYS.filter(function (h) { return h.d === ymd; })[0] || null;
}
/* a day nobody works: Sunday, or a holiday */
function closedDay(ymd) { return new Date(ymd + 'T12:00:00Z').getUTCDay() === 0 || !!holidayOn(ymd); }
/* END HOLIDAYS */

/* ------------------------------------------------------------------ *
 *  The twelve materials                                               *
 * ------------------------------------------------------------------ *

   One material, one name, everywhere: the store counts these, the 15-day
   plan asks for these, purchasing buys these and production uses these. The
   list used to be typed out again in each of those places, which is how the
   same board ended up as "MDF 18mm" in one form and "mdf 18" in another, and
   why nothing could be added up across them (the Chairman, 9 Oct 2026:
   "went out what?"). Adding a material here adds it to all of them.          */
const MATERIALS = [
  { v:'MDF 18mm',            en:'MDF 18mm',            am:'ኤምዲኤፍ 18ሚሜ' },
  { v:'MDF 16mm',            en:'MDF 16mm',            am:'ኤምዲኤፍ 16ሚሜ' },
  { v:'Melamine 18mm',       en:'Melamine 18mm',       am:'ሜላሚን 18ሚሜ' },
  { v:'Melamine 16mm',       en:'Melamine 16mm',       am:'ሜላሚን 16ሚሜ' },
  { v:'Plywood',             en:'Plywood',             am:'ፕላይውድ' },
  { v:'Back panel 3mm',      en:'Back panel 3mm',      am:'የኋላ ሰሌዳ 3ሚሜ' },
  /* the backs are 3 or 6 mm (the plugin nails "a thin 3/6 mm back"); 13 Oct 2026 */
  { v:'Back panel 6mm',      en:'Back panel 6mm',      am:'የኋላ ሰሌዳ 6ሚሜ' },
  { v:'Edge banding (m)',    en:'Edge banding (m)',    am:'ጠርዝ ማሰሪያ (ሜትር)' },
  { v:'Hinges',              en:'Hinges',              am:'ማጠፊያዎች' },
  { v:'Drawer slides',       en:'Drawer slides',       am:'የመሳቢያ ተንሸራታቾች' },
  { v:'Handles',             en:'Handles',             am:'መያዣዎች' },
  { v:'Legs and shelf pins', en:'Legs and shelf pins', am:'እግሮችና የመደርደሪያ ችንካሮች' },
  { v:'Glue and screws',     en:'Glue and screws',     am:'ሙጫና ብሎኖች' }
];
/* a delivery or an issue can also be something off that list */
const MATERIAL_OPTS = MATERIALS.concat([
  { v:'Consumables', en:'Consumables (blades, sandpaper, bits)', am:'ፍጆታ ዕቃዎች (ቢላ፣ ሳንድፔፐር፣ ቁፋሮ)' },
  { v:'Tools',       en:'Tools',                                 am:'መሣሪያዎች' },
  { v:'Other',       en:'Other',                                 am:'ሌላ' }
]);
/* REWORK (the Chairman, 13 Oct 2026: "so it's easy to say, when there is
   rework, which material"): each defect says what must be cut again — or
   that nothing new is needed — with its colour by picture and how many
   pieces, so Amaha cuts it and Getachew and Alemaya know what it takes. */
const REDO_OPTS = [{ v:'none', en:'Nothing new — fixed as it is', am:'አዲስ ዕቃ አያስፈልግም — እንዳለ ተስተካክሏል' }].concat(MATERIALS, [
  { v:'Other', en:'Other', am:'ሌላ' }
]);
/* the same twelve as the fixed rows of a grid */
const MATERIAL_ROWS = MATERIALS.map(function (m) { return { en:m.en, am:m.am }; });
/* THE COLOURS (the Chairman, 13 Oct 2026: "pick colour by picture"). Klever's
   board colour codes, as the SketchUp plugin and the cut lists write them
   ("18mm KKUV-18"), in their five ranges; each has its picture in
   assets/mat/<code>.webp, cut from the photo the plugin keeps. A colour column
   (t:'colour') opens these as pictures to tap; it stores the code. `of` names
   the row's material column: the colour is asked only for the materials in
   COLOUR_ITEMS — a hinge has no colour code. The supplier codes and prices
   stay in the plugin: this code is public. */
const COLOURS = [
  { v:'KKUV-01', g:'UV' }, { v:'KKUV-02', g:'UV' }, { v:'KKUV-03', g:'UV' }, { v:'KKUV-04', g:'UV' },
  { v:'KKUV-05', g:'UV' }, { v:'KKUV-06', g:'UV' }, { v:'KKUV-07', g:'UV' }, { v:'KKUV-08', g:'UV' },
  { v:'KKUV-09', g:'UV' }, { v:'KKUV-10', g:'UV' }, { v:'KKUV-11', g:'UV' }, { v:'KKUV-12', g:'UV' },
  { v:'KKUV-13', g:'UV' }, { v:'KKUV-14', g:'UV' }, { v:'KKUV-15', g:'UV' }, { v:'KKUV-16', g:'UV' },
  { v:'KKUV-17', g:'UV' }, { v:'KKUV-18', g:'UV' }, { v:'KKUV-19', g:'UV' }, { v:'KKUV-20', g:'UV' },
  { v:'KKUV-21', g:'UV' }, { v:'KKUV-22', g:'UV' },
  { v:'KKSW-01', g:'SW' }, { v:'KKSW-02', g:'SW' }, { v:'KKSW-03', g:'SW' }, { v:'KKSW-04', g:'SW' },
  { v:'KKSW-05', g:'SW' }, { v:'KKSW-06', g:'SW' }, { v:'KKSW-07', g:'SW' }, { v:'KKSW-08', g:'SW' },
  { v:'KKSW-09', g:'SW' }, { v:'KKSW-10', g:'SW' }, { v:'KKSW-11', g:'SW' }, { v:'KKSW-12', g:'SW' },
  { v:'KKSW-13', g:'SW' }, { v:'KKSW-14', g:'SW' }, { v:'KKSW-15', g:'SW' }, { v:'KKSW-16', g:'SW' },
  { v:'KKSM-01', g:'SM' }, { v:'KKSM-02', g:'SM' }, { v:'KKSM-03', g:'SM' }, { v:'KKSM-04', g:'SM' },
  { v:'KKSM-05', g:'SM' }, { v:'KKSM-06', g:'SM' }, { v:'KKSM-07', g:'SM' }, { v:'KKSM-08', g:'SM' },
  { v:'KKSM-09', g:'SM' }, { v:'KKSM-10', g:'SM' }, { v:'KKSM-11', g:'SM' }, { v:'KKSM-12', g:'SM' },
  { v:'KKSUV-01', g:'SUV' }, { v:'KKSUV-02', g:'SUV' }, { v:'KKSUV-03', g:'SUV', noimg:1 }, { v:'KKSUV-04', g:'SUV' },
  { v:'KKMDF-000', g:'MDF' }, { v:'KKMDF-01', g:'MDF' }, { v:'KKMDF-02', g:'MDF' }, { v:'KKMDF-03', g:'MDF' },
  { v:'KKMDF-04', g:'MDF' }, { v:'KKMDF-05', g:'MDF' }, { v:'KKMDF-06', g:'MDF' }, { v:'KKMDF-07', g:'MDF' }
];
const COLOUR_GROUPS = ['UV', 'SW', 'SM', 'SUV', 'MDF'];
const COLOUR_ITEMS = ['MDF 18mm', 'MDF 16mm', 'Melamine 18mm', 'Melamine 16mm', 'Back panel 3mm', 'Back panel 6mm', 'Edge banding (m)'];
/* The Job Tracking Board's 15 columns (the Implementation Document; the
   register's regB_ names), for Ephrata's daily board check */
const BOARD_COLS = [
  { v:'c1',  en:'Col 1: Lead / quotation sent',        am:'ዓምድ 1፦ ደንበኛ / ዋጋ ተልኳል' },
  { v:'c2',  en:'Col 2: Advance paid, job created',    am:'ዓምድ 2፦ ቅድሚያ ተከፍሏል፣ ሥራ ተከፍቷል' },
  { v:'c3',  en:'Col 3: Final measurement pending',    am:'ዓምድ 3፦ የመጨረሻ ልኬት ይጠበቃል' },
  { v:'c4',  en:'Col 4: Material selection signed',    am:'ዓምድ 4፦ የቁሳቁስ ምርጫ ተፈርሟል' },
  { v:'c5',  en:'Col 5: Materials ordered',            am:'ዓምድ 5፦ ቁሳቁስ ታዝዟል' },
  { v:'c6',  en:'Col 6: Materials received in store',  am:'ዓምድ 6፦ ቁሳቁስ መጋዘን ገብቷል' },
  { v:'c7',  en:'Col 7: Final payment requested',      am:'ዓምድ 7፦ የመጨረሻ ክፍያ ተጠይቋል' },
  { v:'c8',  en:'Col 8: Final payment received',       am:'ዓምድ 8፦ የመጨረሻ ክፍያ ገብቷል' },
  { v:'c9',  en:'Col 9: Production approved',          am:'ዓምድ 9፦ ምርት ጸድቋል' },
  { v:'c10', en:'Col 10: Production completed',        am:'ዓምድ 10፦ ምርት ተጠናቋል' },
  { v:'c11', en:'Col 11: QC released',                 am:'ዓምድ 11፦ የጥራት ፍተሻ አልፏል' },
  { v:'c12', en:'Col 12: Ready for delivery',          am:'ዓምድ 12፦ ለማድረስ ዝግጁ' },
  { v:'c13', en:'Col 13: Delivered / installed',       am:'ዓምድ 13፦ ደርሷል / ተገጥሟል' },
  { v:'c14', en:'Col 14: Customer acceptance signed',  am:'ዓምድ 14፦ ደንበኛው ተቀብሎ ፈርሟል' },
  { v:'c15', en:'Col 15: After-sales follow-up done',  am:'ዓምድ 15፦ የድህረ-ሽያጭ ክትትል ተደርጓል' }
];
/* who moves a card, or owns one that is stuck */
const BOARD_WHO = [
  { v:'ephrata',  en:'Ephrata — commercial',  am:'ኤፍራታ — ንግድ' },
  { v:'sales',    en:'A salesperson',         am:'ሻጭ' },
  { v:'designer', en:'A designer',            am:'ዲዛይነር' },
  { v:'betty',    en:'Selam — finance',       am:'ሰላም — ፋይናንስ' },
  { v:'getachew', en:'Getachew — purchasing', am:'ጌታቸው — ግዥ' },
  { v:'alemaya', en:'Alemaya — store',      am:'አለማያ — መጋዘን' },
  { v:'liu',      en:'Mahelet — operations',  am:'ማህሌት — ኦፕሬሽን' },
  { v:'amaha',    en:'Amaha — production',    am:'አማሃ — ምርት' },
  { v:'wude',     en:'Wude — quality',        am:'ውዱ — ጥራት' },
  { v:'elyas',    en:'Elyas — site',          am:'ኤልያስ — ተከላ' },
  { v:'Other',    en:'Other',                 am:'ሌላ' }
];
/* Selam's one list of every transaction (16 Oct 2026): which way the money
   went, what it was, and which of Klever's accounts it went through. A move
   between Klever's own accounts (cash taken to the bank, money sent to
   ZamZam) is neither in nor out. */
const TX_DIR = [
  { v:'in',   en:'Money in',                   am:'ገቢ' },
  { v:'out',  en:'Money out',                  am:'ወጪ' },
  { v:'move', en:'Moved between our accounts', am:'በራሳችን ሂሳቦች መካከል የተዛወረ' }
];
const TX_IN = [
  { v:'advance',  en:'Customer advance',        am:'የደንበኛ ቅድመ ክፍያ' },
  { v:'final',    en:'Customer final payment',  am:'የደንበኛ የመጨረሻ ክፍያ' },
  { v:'customer', en:'Other customer payment',  am:'ሌላ የደንበኛ ክፍያ' },
  { v:'group',    en:'From the group (Kidan)',  am:'ከቡድኑ (ከኪዳን)' },
  { v:'loan',     en:'A loan received',         am:'የተገኘ ብድር' },
  { v:'other',    en:'Other',                   am:'ሌላ' }
];
const TX_OUT = [
  { v:'supplier',  en:'Supplier or materials', am:'አቅራቢ ወይም ዕቃ' },
  { v:'salary',    en:'Salaries',              am:'ደመወዝ' },
  { v:'assembler', en:'Assemblers',            am:'ገጣጣሚዎች' },
  { v:'transport', en:'Transport',             am:'ትራንስፖርት' },
  { v:'rent',      en:'Rent',                  am:'ኪራይ' },
  { v:'tax',       en:'Tax',                   am:'ግብር' },
  { v:'loan',      en:'Loan repayment',        am:'የብድር ክፍያ' },
  { v:'charges',   en:'Bank charges',          am:'የባንክ ክፍያ' },
  { v:'group',     en:'To the group (Kidan)',  am:'ለቡድኑ (ለኪዳን)' },
  { v:'other',     en:'Other',                 am:'ሌላ' }
];
const TX_ACCOUNTS = [
  { v:'cbe',   en:'CBE',        am:'ንግድ ባንክ' },
  { v:'awash', en:'Awash',      am:'አዋሽ' },
  { v:'aby',   en:'Abyssinia',  am:'አቢሲኒያ' },
  { v:'zz',    en:'ZamZam',     am:'ዘምዘም' },
  { v:'cash',  en:'Cash',       am:'ጥሬ ገንዘብ' }
];
/* the ones that come as sheets, and the ones that come as pieces — a sheet
   count and a hinge count cannot be added to each other */
const BOARDS = ['MDF 18mm', 'MDF 16mm', 'Melamine 18mm', 'Melamine 16mm', 'Plywood', 'Back panel 3mm', 'Back panel 6mm'];
const ACCESSORIES = ['Hinges', 'Drawer slides', 'Handles', 'Legs and shelf pins'];

/* ======================== TAP THE REASON (11 Oct 2026) ====================

   The usual answers to a "why" or "what was done", as buttons (`picks` on an
   area or text question — js/app.js pickField). The first 36 reports filed
   showed the factory, the store and purchasing leaving every "why" box empty:
   a reason that has to be typed on a phone, in Amharic, at 5:30 PM is a
   reason that is not given. A tap is. The box under the buttons still takes
   a few words — the job code, a name — and what is filed is one line of
   words under the same key as before, so every reader is unchanged.

   Plain words, the ones said on the floor. Whole phrases, never a stem: an
   Amharic stem swapped on its own breaks the word (see klever-plain-amharic). */
const WHY_FLOOR = [
  { en:'Material was not in the store',  am:'ዕቃው መጋዘን ውስጥ አልነበረም' },
  { en:'A machine broke down',            am:'ማሽን ተበላሸ' },
  { en:'Power cut',                       am:'መብራት ጠፋ' },
  { en:'Workers were absent',             am:'ሠራተኞች ቀሩ' },
  { en:'Design or cutting list came late', am:'ዲዛይን ወይም የመቁረጫ ዝርዝር ዘገየ' },
  { en:'Rework took the time',            am:'የተመለሰ ሥራ ጊዜ ወሰደ' },
  { en:'Waiting for QC',                  am:'የጥራት ፍተሻ ጠበቅን' },
  { en:'Only small jobs today',           am:'ዛሬ ትናንሽ ሥራዎች ብቻ ነበሩ' }
];
/* how a short day is made up */
const CATCH_UP = [
  { en:'Overtime to catch up',            am:'በትርፍ ሰዓት ይካካሳል' },
  { en:'Will be made up tomorrow',        am:'ነገ ይካካሳል' }
];
/* what was done about it */
const DONE_ABOUT = [
  { en:'Fixed today',                     am:'ዛሬ ተስተካክሏል' },
  { en:'Will be fixed tomorrow',          am:'ነገ ይስተካከላል' },
  { en:'Sent back to be redone',          am:'እንደገና እንዲሠራ ተመለሰ' },
  { en:'Mahelet was told',                am:'ለማህሌት ተነግሯል' },
  { en:'Waiting for a part or material',  am:'መለዋወጫ ወይም ዕቃ እየጠበቅን ነው' },
  { en:'Nothing done yet',                am:'ገና ምንም አልተደረገም' }
];
/* why something that should have been done was not */
const WHY_MISSED = [
  { en:'No time',                         am:'ጊዜ አልነበረም' },
  { en:'The person in charge was absent', am:'ኃላፊው ሰው አልነበረም' },
  { en:'Forgot',                          am:'ተረስቷል' },
  { en:'Waiting for someone else',        am:'ሌላ ሰው እየጠበቅን ነው' },
  { en:'Will be done tomorrow',           am:'ነገ ይሠራል' }
];
/* what someone needs to get on */
const NEED_HELP = [
  { en:'Nothing needed',                  am:'ምንም አያስፈልግም', nil:1 },
  { en:'Material from the store',         am:'ከመጋዘን ዕቃ' },
  { en:'A purchase (Getachew)',           am:'ግዢ (ጌታቸው)' },
  { en:'Money or a payment (Selam)',      am:'ገንዘብ ወይም ክፍያ (ሰላም)' },
  { en:'More workers',                    am:'ተጨማሪ ሠራተኛ' },
  { en:'A machine repaired',              am:'ማሽን መጠገን' },
  { en:'Design or measurements',          am:'ዲዛይን ወይም ልኬት' },
  { en:'A decision from Mahelet',         am:'የማህሌት ውሳኔ' }
];
/* how today's work went, in one tap: the "biggest problem" box */
const DAY_PROBLEM = [
  { en:'No big problem today',            am:'ዛሬ ትልቅ ችግር አልነበረም' }
].concat(WHY_FLOOR);

/* ===================== WORDS TO TAP IN A LIST (11 Oct 2026) ===============

   The Chairman: "make most questions choice". A word box inside a list row
   ("Reason", "Cause", "Complaint", "Next step") shows its usual answers as
   buttons while it is empty; a tap fills it and it can still be typed over
   (picks on a list column — js/app.js repeater). One answer a box, the
   words of the language on the screen. */
const COL_ABSENT = [
  { en:'Sick',                      am:'ታሟል' },
  { en:'Family matter',             am:'የቤተሰብ ጉዳይ' },
  { en:'On leave',                  am:'በፈቃድ ላይ' },
  { en:'Funeral',                   am:'ለቅሶ' },
  { en:'No word given',             am:'ሳያሳውቅ ቀረ' }
];
const COL_LATE = [
  { en:'Transport',                 am:'ትራንስፖርት' },
  { en:'Sick',                      am:'ታሞ ነበር' },
  { en:'Family matter',             am:'የቤተሰብ ጉዳይ' },
  { en:'No reason given',           am:'ምክንያት አልሰጠም' }
];
const COL_OVERTIME = [
  { en:'Urgent job',                am:'አስቸኳይ ሥራ' },
  { en:'Catching up on a late job', am:'የዘገየ ሥራ ለማካካስ' },
  { en:'Delivery tomorrow',         am:'ነገ የሚደርስ ሥራ' },
  { en:'A machine was down earlier', am:'ቀድሞ ማሽን ቆሞ ነበር' }
];
const COL_MACHINE = [
  { en:'Belt or blade',             am:'ቀበቶ ወይም ቢላ' },
  { en:'Electrical fault',          am:'የኤሌክትሪክ ችግር' },
  { en:'Power cut',                 am:'መብራት ጠፋ' },
  { en:'Needs a spare part',        am:'መለዋወጫ ያስፈልጋል' },
  { en:'Operator mistake',          am:'የኦፕሬተር ስህተት' },
  { en:'Cleaning or service',       am:'ጽዳት ወይም ጥገና' }
];
const COL_DEFECT = [
  { en:'Scratch',                   am:'ጭረት' },
  { en:'Edge lifting',              am:'ጠርዝ መነሳት' },
  { en:'Wrong size',                am:'የተሳሳተ ልክ' },
  { en:'Chipped or broken',         am:'የተሰበረ' },
  { en:'Stain or wrong colour',     am:'እድፍ ወይም የተሳሳተ ቀለም' },
  { en:'Hardware loose or missing', am:'ሃርድዌር የላላ ወይም የጎደለ' },
  { en:'Badly assembled',           am:'በትክክል ያልተገጣጠመ' }
];
const COL_STAGE = [
  { en:'Cutting',                   am:'ቁረጣ' },
  { en:'Edge banding',              am:'ጠርዝ ማሰር' },
  { en:'Drilling',                  am:'ቀዳዳ መብሳት' },
  { en:'Assembly',                  am:'መገጣጠም' },
  { en:'Packing or transport',      am:'ማሸግ ወይም ጭነት' },
  { en:'The supplier\'s board',     am:'የአቅራቢው ሰሌዳ' }
];
const COL_COMPLAINT = [
  { en:'Late',                      am:'መዘግየት' },
  { en:'Quality',                   am:'ጥራት' },
  { en:'Wrong size or design',      am:'የተሳሳተ ልክ ወይም ዲዛይን' },
  { en:'Installation',              am:'ተከላ' },
  { en:'Damage',                    am:'ጉዳት' },
  { en:'Staff behaviour',           am:'የሠራተኛ ባህርይ' },
  { en:'Price or payment',          am:'ዋጋ ወይም ክፍያ' }
];
const COL_DEPT = [
  { en:'Sales',                     am:'ሽያጭ' },
  { en:'Design',                    am:'ዲዛይን' },
  { en:'Production',                am:'ምርት' },
  { en:'Store',                     am:'መጋዘን' },
  { en:'Purchasing',                am:'ግዥ' },
  { en:'Installation',              am:'ተከላ' },
  { en:'Finance',                   am:'ፋይናንስ' },
  { en:'Supplier',                  am:'አቅራቢ' }
];
/* THE SISTER COMPANIES' WORD BOXES AS BUTTONS (11 Oct 2026, the Chairman:
   "fix all") — Rovestone, Meri Block Board, Real Estate & Construction. The
   day, the plan and what is waiting are still a line of words under the same
   key; the usual answers are taps, with the box for the job or site. */
const SIS_DONE = [
  { en:'Work went on as planned',          am:'ሥራው በዕቅዱ መሠረት ቀጥሏል' },
  { en:'A job was finished',               am:'ሥራ ተጠናቋል' },
  { en:'A delivery went out',              am:'ጭነት ወጥቷል' },
  { en:'Materials came in',                am:'ዕቃ ገብቷል' },
  { en:'Met a customer or supplier',       am:'ከደንበኛ ወይም ከአቅራቢ ጋር ተገናኘን' },
  { en:'Money was collected',              am:'ገንዘብ ተሰብስቧል' },
  { en:'Work stopped today',               am:'ዛሬ ሥራ ቆሟል' }
];
const SIS_PLAN = [
  { en:'Carry on with today’s work',       am:'የዛሬውን ሥራ መቀጠል' },
  { en:'Finish a job',                     am:'ሥራ ማጠናቀቅ' },
  { en:'Deliver',                          am:'ማስረከብ' },
  { en:'Buy or collect materials',         am:'ዕቃ መግዛት ወይም መረከብ' },
  { en:'Collect money',                    am:'ገንዘብ መሰብሰብ' },
  { en:'Meet a customer or supplier',      am:'ከደንበኛ ወይም ከአቅራቢ ጋር መገናኘት' }
];
const SIS_STAGE = [
  { en:'Not started',                      am:'አልተጀመረም' },
  { en:'In progress',                      am:'በሂደት ላይ' },
  { en:'Waiting for material',             am:'ዕቃ እየጠበቀ' },
  { en:'Waiting for payment',              am:'ክፍያ እየጠበቀ' },
  { en:'Almost done',                      am:'ሊያልቅ ነው' },
  { en:'Finished',                         am:'ተጠናቋል' }
];
const SIS_WAIT = [
  { en:'Nothing',                          am:'ምንም', nil:1 },
  { en:'An order',                         am:'ትዕዛዝ' },
  { en:'A delivery',                       am:'ጭነት' },
  { en:'Materials',                        am:'ዕቃ' },
  { en:'A payment',                        am:'ክፍያ' },
  { en:'An answer or a drawing',           am:'መልስ ወይም ንድፍ' }
];
const SIS_PROBLEM = [
  { en:'Nothing went wrong',               am:'ምንም ችግር አልነበረም', nil:1 },
  { en:'Material short or late',           am:'ዕቃ ጎድሏል ወይም ዘግይቷል' },
  { en:'Machine or vehicle broke down',    am:'ማሽን ወይም መኪና ተበላሸ' },
  { en:'Payment late',                     am:'ክፍያ ዘግይቷል' },
  { en:'Workers absent',                   am:'ሠራተኞች ቀርተዋል' },
  { en:'Power or water cut',               am:'መብራት ወይም ውሃ ተቋረጠ' },
  { en:'A customer problem',               am:'የደንበኛ ችግር' }
];
const SIS_PASSED = [
  { en:'Order',                            am:'ትዕዛዝ' },
  { en:'Delivery',                         am:'ጭነት' },
  { en:'Materials',                        am:'ዕቃ' },
  { en:'Payment',                          am:'ክፍያ' }
];
const COL_NEXT = [
  { en:'Send the quotation',        am:'ፕሮፎርማ መላክ' },
  { en:'Book the measurement',      am:'ልኬት መያዝ' },
  { en:'Call back',                 am:'መልሶ መደወል' },
  { en:'Wait for their answer',     am:'መልሳቸውን መጠበቅ' },
  { en:'Collect the advance',       am:'ቅድመ ክፍያ መቀበል' },
  { en:'Sign the contract',         am:'ውል መፈረም' }
];
const COL_BEHIND = [
  { en:'Material missing',          am:'ዕቃ ጎድሏል' },
  { en:'Machine down',              am:'ማሽን ቆሟል' },
  { en:'Payment not cleared',       am:'ክፍያ አልተረጋገጠም' },
  { en:'Design not final',          am:'ዲዛይን አልተጠናቀቀም' },
  { en:'Customer not ready',        am:'ደንበኛው ዝግጁ አይደለም' },
  { en:'Rework',                    am:'ዳግም ሥራ' }
];
const COL_STOCK_DIFF = [
  { en:'Went out without a record', am:'ሳይመዘገብ ወጥቷል' },
  { en:'Came in without a record',  am:'ሳይመዘገብ ገብቷል' },
  { en:'Counting mistake',          am:'የቆጠራ ስህተት' },
  { en:'Damaged and thrown away',   am:'ተጎድቶ ተጥሏል' },
  { en:'Missing — not known why',   am:'ጠፍቷል — ምክንያቱ አይታወቅም' }
];
const COL_REJECTED = [
  { en:'Damaged',                   am:'ተጎድቷል' },
  { en:'Wrong size or colour',      am:'የተሳሳተ ልክ ወይም ቀለም' },
  { en:'Short quantity',            am:'ብዛቱ ያነሰ' },
  { en:'Poor quality',              am:'ደካማ ጥራት' },
  { en:'Not what was ordered',      am:'ያልታዘዘ ዕቃ' }
];
const COL_NOT_PAID = [
  { en:'Waiting for ZamZam funds',  am:'የዘምዘም ገንዘብ እየጠበቅን ነው' },
  { en:'Waiting for approval',      am:'ፈቃድ እየጠበቅን ነው' },
  { en:'Invoice not received',      am:'ደረሰኝ አልደረሰም' },
  { en:'Dispute over the goods',    am:'በዕቃው ላይ ክርክር አለ' }
];
const COL_CHANGED = [
  { en:'Size',                      am:'ልክ' },
  { en:'Colour',                    am:'ቀለም' },
  { en:'Layout',                    am:'አቀማመጥ' },
  { en:'Handles or hardware',       am:'መያዣ ወይም ሃርድዌር' },
  { en:'Units added',               am:'ካቢኔት ተጨመረ' },
  { en:'Units removed',             am:'ካቢኔት ተቀነሰ' }
];
const COL_JOBFILE = [
  { en:'Signed contract',           am:'የተፈረመ ውል' },
  { en:'Final drawing',             am:'የመጨረሻ ሥዕል' },
  { en:'Material selection form',   am:'የዕቃ ምርጫ ፎርም' },
  { en:'Measurement sheet',         am:'የልኬት ወረቀት' },
  { en:'Payment proof',             am:'የክፍያ ደረሰኝ' }
];
const COL_WHEN = [
  { en:'Already done',              am:'ተሠርቷል' },
  { en:'Tomorrow',                  am:'ነገ' },
  { en:'This week',                 am:'በዚህ ሳምንት' },
  { en:'Not known yet',             am:'ገና አይታወቅም' }
];
const COL_CABINET = [
  { en:'Upper cabinet',             am:'የላይ ካቢኔት' },
  { en:'Lower cabinet',             am:'የታች ካቢኔት' },
  { en:'Tall unit',                 am:'ረጅም ካቢኔት' },
  { en:'Doors',                     am:'በሮች' },
  { en:'Drawers',                   am:'መሳቢያዎች' },
  { en:'Worktop',                   am:'የሥራ ጠረጴዛ' }
];
const COL_SITE_ACTION = [
  { en:'Warned',                    am:'ማስጠንቀቂያ ተሰጠ' },
  { en:'Fined',                     am:'ተቀጣ' },
  { en:'Sent home',                 am:'ወደ ቤት ተላከ' },
  { en:'Mahelet was told',          am:'ለማህሌት ተነግሯል' }
];
const COL_STAGE_MISSED = [
  { en:'The customer delayed',      am:'ደንበኛው አዘገየ' },
  { en:'Payment came late',         am:'ክፍያ ዘገየ' },
  { en:'Design not ready',          am:'ዲዛይን አልደረሰም' },
  { en:'Production late',           am:'ምርት ዘገየ' }
];
/* the factory's workers, as they stand in PEOPLE: a name picked, not typed,
   is a name the rulebook can match to the worker (Rules.js ctx.match) */
const WORKERS = PEOPLE.filter(function (p) { return p.grp === 'production' && p.roleEn === 'Production Worker'; })
  .map(function (p) { return { v:p.en, en:p.en, am:p.am }; })
  .concat([{ v:'Someone else', en:'Someone else (write in the reason)', am:'ሌላ ሰው (በምክንያቱ ይጻፉ)' }]);

const REPORTS = [

/* ============================ EPHRATA — DAILY ============================ */
{
  /* Amendment 1, 17 September 2026 removed the Friday exception: this report
     is now due every working day, Friday included. */
  id:'ephrata-daily', person:'ephrata', cadence:'daily', dueTime:'17:30',
  en:'Daily Commercial Report', am:'ዕለታዊ የንግድ ሪፖርት',
  toEn:'Chairman', toAm:'ሊቀመንበር',
  dueEn:'5:30 PM, Monday to Saturday', dueAm:'ከሰኞ እስከ ቅዳሜ ከቀኑ 11፡30 (5:30 PM)',
  penEn:'Late –500 Birr · Missing –1,000 Birr', penAm:'ዘግይቶ –500 ብር · ካልተላከ –1,000 ብር',
  sections:[
    /* REBUILT 11 Oct 2026 (the Chairman: "they are struggling so much with
       the questions"). Ephrata's first two reports (8 and 9 Oct) left 11 of
       31 and 17 of 30 questions empty. Empty every time: the yes/no gates in
       front of her own lists — a visit booked for tomorrow, a quotation out
       today, money collected — and with a gate unanswered, its list never
       opened and every count worked out from it (visits done, quotations,
       collected today, which the charts and the Sales Director read) went
       out blank. "Was all of it banked?" was asked on days no advance came
       in. 28 questions stood on a day with nothing to report, 24 required.
       Now the gates are one list at the top: tap what happened — visits,
       quotations, a contract, money, a post — and only those lists open; a
       lead or a quotation over 48 hours, a slow answer, a complaint or a
       broken WhatsApp rule are taps on the same list, and only then are
       their counts asked. Every answer key is the one it always was: the
       yes/no gates are worked out from the list ({picked:…}, quiet:1), and
       the counts the rulebook reads every day (wa_unanswered,
       wa_complaints) and the morning agents read (visits_late, quotes_late,
       visits_booked, inq) file 0 on a day they were not tapped (zero:1).
       wa_stage is still asked: it carries the 300 Birr fine. */
    /* THE MONEY ON EACH JOB (the Chairman, 14 Oct 2026): a job on Mahelet's
       15-day plan, or made this week, whose contract total no report has
       given is asked of her here, once — six at a time, soonest first. The
       list is the script's (apps-script/JobMoney.js, /jobask/ephrata); a
       job leaves it when she has given its total. The Chairman's page sets
       it against the material and the installers: the net on the job. */
    { en:'Contract totals for jobs on the plan', am:'በዕቅዱ ላይ ያሉ ሥራዎች የውል ዋጋ', fields:[
      {id:'ct_jobs', en:'What is the contract total of each of these jobs?', am:'የእያንዳንዱ ሥራ የውል ጠቅላላ ዋጋ ስንት ነው?', t:'table',
        carry:{ask:'contract', close:{col:'value'}},
        cols:[
          {id:'code', en:'Job code', am:'የሥራ ኮድ', t:'text'},
          {id:'value', en:'Contract total, in Birr (all of it, as signed)', am:'የውሉ ጠቅላላ ዋጋ በብር (እንደተፈረመው፣ ሙሉው)', t:'money', must:1}
        ]}
    ]},
    { en:'Today', am:'ዛሬ', fields:[
      {id:'e_events', en:'What happened today?', am:'ዛሬ ምን ምን ሆነ?', t:'multi',
        none:{ en:'None of these today', am:'ዛሬ ከነዚህ ምንም የለም' },
        groups:[
          { v:'visit', en:'Pre-measurement',      am:'ቅድመ ልኬት' },
          { v:'quote', en:'Quotations',           am:'ፕሮፎርማ' },
          { v:'deal',  en:'Contracts and money',  am:'ውልና ገንዘብ' },
          { v:'mkt',   en:'Marketing',            am:'ማርኬቲንግ' },
          { v:'wa',    en:'WhatsApp',             am:'ዋትስአፕ' }
        ],
        opts:[
          { v:'v_done',   g:'visit', en:'Visits were done today',                    am:'ዛሬ ጉብኝት ተደርጓል' },
          { v:'v_booked', g:'visit', en:'Appointments were made today',              am:'ዛሬ ቀጠሮ ተይዟል' },
          { v:'v_tm',     g:'visit', en:'Visits are booked for tomorrow',            am:'ለነገ ጉብኝት ተይዟል' },
          { v:'v_late',   g:'visit', en:'A lead has waited over 48 hours for a visit', am:'ቀጠሮ ሳይያዝለት ከ48 ሰዓት በላይ የቆየ ደንበኛ አለ' },
          { v:'q_out',    g:'quote', en:'Quotations went out',                       am:'ፕሮፎርማ ተሰጠ' },
          { v:'q_late',   g:'quote', en:'A quotation has waited over 48 hours',      am:'ከ48 ሰዓት በላይ የቆየ ፕሮፎርማ አለ' },
          { v:'c_signed', g:'deal',  en:'A contract was signed',                     am:'ውል ተፈረመ' },
          { v:'c_change', g:'deal',  en:'A customer changed their order after signing', am:'ደንበኛ ከፈረሙ በኋላ ትዕዛዛቸውን ቀየሩ' },
          { v:'money',    g:'deal',  en:'Money came in from a customer',             am:'ከደንበኛ ገንዘብ ገባ' },
          { v:'post',     g:'mkt',   en:'A post went up',                            am:'ፖስት ተለጠፈ' },
          { v:'inq',      g:'mkt',   en:'Inquiries came in on the pages',            am:'በገጾቹ ጥያቄዎች መጡ' },
          { v:'wa_slow',  g:'wa',    en:'A message waited over 2 hours for an answer', am:'መልዕክት ከ2 ሰዓት በላይ ምላሽ ሳያገኝ ቆየ' },
          { v:'wa_comp',  g:'wa',    en:'A customer complained about WhatsApp',      am:'ደንበኛ በዋትስአፕ አያያዝ ቅሬታ አቀረቡ' },
          { v:'wa_rule',  g:'wa',    en:'Someone in the team broke the WhatsApp rules', am:'የቡድን አባል የዋትስአፕ ደንብ ጣሰ' }
        ]}
    ]},
    { en:'Leads today', am:'ዛሬ የመጡ አዲስ ደንበኞች', fields:[
      /* the counts are the salespeople's to report — they log every lead by
         name (the Chairman, 8 Oct 2026). Hers is the judgement over them. */
      {id:'leads_best', en:'Which of today\'s leads is the most likely to buy, and what is the next step? (Write the customer in the box.)', am:'ከዛሬዎቹ ደንበኞች ውስጥ ለመግዛት በጣም የተዘጋጀው የትኛው ነው? ቀጣዩ እርምጃስ? (ደንበኛውን በሳጥኑ ይጻፉ።)', t:'area', opt:1,
        picks:[
          { en:'Book a pre-measurement visit',     am:'የቅድመ ልኬት ቀጠሮ መያዝ' },
          { en:'Send the quotation',               am:'ፕሮፎርማ መላክ' },
          { en:'Call back',                        am:'መልሶ መደወል' },
          { en:'Showroom visit',                   am:'የሾውሩም ጉብኝት' },
          { en:'Ready to sign',                    am:'ለመፈረም ዝግጁ ናቸው' }
        ]}
    ]},
    { en:'Pre-measurement', am:'ቅድመ ልኬት', fields:[
      {id:'visits_booked', en:'How many pre-measurement appointments did you make today?', am:'ዛሬ ስንት የቅድመ ልኬት ቀጠሮ ያዙ?', t:'num', zero:1,
        show:{f:'e_events', when:'has', v:'v_booked'}},
      {id:'visits_any', en:'Was any pre-measurement visit done today?', am:'ዛሬ የተደረገ የቅድመ ልኬት ጉብኝት አለ?', t:'yesno', quiet:1, auto:{picked:'e_events', v:'v_done'}},
      {id:'visits_list', en:'Each pre-measurement visit done today', am:'ዛሬ የተደረገ እያንዳንዱ የቅድመ ልኬት ጉብኝት', t:'table', addEn:'Add a visit', addAm:'ጉብኝት ጨምር',
        show:{f:'visits_any', when:'yes'},
        cols:[
          {id:'cust', en:'Customer', am:'ደንበኛ', t:'text'},
          {id:'lc', en:'Customer code: 4-digit lead no., or KK code once paid', am:'የደንበኛ ኮድ፦ ባለ 4 አሃዝ ቁጥር፣ ከከፈሉ በኋላ KK ኮድ', t:'text'},
          {id:'where', en:'Area', am:'አካባቢ', t:'text'},
          {id:'who', en:'Visited by', am:'የጎበኘው', t:'text'},
          {id:'next', en:'Next step', am:'ቀጣይ እርምጃ', t:'text', picks:COL_NEXT}
        ]},
      {id:'visits_done', en:'How many pre-measurement visits were done today?', am:'ዛሬ ስንት የቅድመ ልኬት ጉብኝት ተካሄደ?', t:'num',
        auto:{rows:'visits_list'}, sumEn:'visits done', sumAm:'ጉብኝቶች ተደርገዋል'},
      /* tomorrow's visits, with the area, for the route (apps-script/Route.js, 8 Oct 2026) */
      {id:'tm_any', en:'Is any pre-measurement visit booked for tomorrow?', am:'ለነገ የተያዘ የቅድመ ልኬት ጉብኝት አለ?', t:'yesno', quiet:1, auto:{picked:'e_events', v:'v_tm'}},
      {id:'tm_visits', en:'Each visit booked for tomorrow — the area is what the AI plans the route from', am:'ለነገ የተያዘ እያንዳንዱ ጉብኝት — መንገዱ የሚታቀደው በአካባቢው ስም ነው', t:'table', addEn:'Add a visit', addAm:'ጉብኝት ጨምር',
        show:{f:'tm_any', when:'yes'},
        cols:[
          {id:'cust', en:'Customer', am:'ደንበኛ', t:'text'},
          {id:'lc', en:'Customer code: 4-digit lead no., or KK code once paid', am:'የደንበኛ ኮድ፦ ባለ 4 አሃዝ ቁጥር፣ ከከፈሉ በኋላ KK ኮድ', t:'text'},
          {id:'where', en:'Area (e.g. Ayat, CMC, Lebu)', am:'አካባቢ (ለምሳሌ አያት፣ ሲኤምሲ፣ ለቡ)', t:'text'},
          {id:'time', en:'Time (e.g. 10:00 AM)', am:'ሰዓት (ለምሳሌ 10:00 AM)', t:'text', time:1},
          {id:'who', en:'Who goes', am:'የሚሄደው', t:'text'}
        ]},
      {id:'tm_visits_n', en:'How many pre-measurement visits are booked for tomorrow?', am:'ለነገ ስንት የቅድመ ልኬት ጉብኝት ተይዟል?', t:'num',
        auto:{rows:'tm_visits'}, sumEn:'booked for tomorrow', sumAm:'ለነገ ተይዘዋል'},
      /* the Owners alert fires on it (apps-script/Owners.js, 48 hours) */
      {id:'visits_late', en:'How many new leads have waited more than 48 hours for a pre-measurement appointment?', am:'ከ48 ሰዓት በላይ የቅድመ ልኬት ቀጠሮ ሳይያዝላቸው የቆዩ አዲስ ደንበኞች ስንት ናቸው?', t:'num', zero:1,
        show:{f:'e_events', when:'has', v:'v_late'},
        tgt:{op:'lte', v:0, en:'Should be 0', am:'0 መሆን አለበት'}},
      {id:'visits_late_why', en:'Why are they waiting, and when will each be visited? (Write the customers in the box.)', am:'ለምን ይጠብቃሉ? እያንዳንዳቸው መቼ ይጎበኛሉ? (ደንበኞቹን በሳጥኑ ይጻፉ።)', t:'area',
        picks:[
          { en:'No designer free',                 am:'ነፃ ዲዛይነር የለም' },
          { en:'The customer is not ready',        am:'ደንበኛው ገና ዝግጁ አይደሉም' },
          { en:'Could not reach the customer',     am:'ደንበኛውን ማግኘት አልተቻለም' },
          { en:'The area is far — going with others', am:'አካባቢው ሩቅ ነው — ከሌሎች ጋር ይሄዳል' },
          { en:'Booked for tomorrow',              am:'ለነገ ተይዟል' },
          { en:'Booked for later this week',       am:'በዚህ ሳምንት ተይዟል' }
        ], show:{f:'visits_late', when:'pos'}}
    ]},
    { en:'Quotations', am:'ፕሮፎርማ', fields:[
      {id:'quotes_any', en:'Did any quotation go out today?', am:'ዛሬ የተሰጠ ፕሮፎርማ አለ?', t:'yesno', quiet:1, auto:{picked:'e_events', v:'q_out'}},
      {id:'quotes_list', en:'Each quotation sent today', am:'ዛሬ የተሰጠ እያንዳንዱ ፕሮፎርማ', t:'table', addEn:'Add a quotation', addAm:'ፕሮፎርማ ጨምር',
        show:{f:'quotes_any', when:'yes'},
        cols:[
          {id:'cust', en:'Customer', am:'ደንበኛ', t:'text'},
          {id:'lc', en:'Customer code: 4-digit lead no., or KK code once paid', am:'የደንበኛ ኮድ፦ ባለ 4 አሃዝ ቁጥር፣ ከከፈሉ በኋላ KK ኮድ', t:'text'},
          {id:'value', en:'Value', am:'ዋጋ', t:'money'},
          {id:'who', en:'Prepared by', am:'ያዘጋጀው', t:'text'}
        ]},
      {id:'quotes_issued', en:'How many quotations went out today?', am:'ዛሬ ስንት ፕሮፎርማ ተሰጠ?', t:'num',
        auto:{rows:'quotes_list'}, sumEn:'quotations', sumAm:'ፕሮፎርማዎች'},
      {id:'quotes_value', en:'What is the total value of today\'s quotations?', am:'የዛሬዎቹ ፕሮፎርማዎች ጠቅላላ ዋጋ ስንት ነው?', t:'money',
        auto:{sum:'quotes_list.value'}, sumEn:'quoted', sumAm:'የቀረበ ዋጋ'},
      {id:'quotes_late', en:'How many quotations are waiting more than 48 hours?', am:'ከ48 ሰዓት በላይ የዘገዩ ፕሮፎርማዎች ስንት ናቸው?', t:'num', zero:1,
        show:{f:'e_events', when:'has', v:'q_late'},
        tgt:{op:'lte', v:0, en:'Should be 0', am:'0 መሆን አለበት'}},
      {id:'quotes_late_why', en:'What is holding them up, and when will they go out? (Write the customers in the box.)', am:'ምን ያዛቸዋል? መቼ ይላካሉ? (ደንበኞቹን በሳጥኑ ይጻፉ።)', t:'area',
        picks:[
          { en:'Waiting for the designer\'s drawing', am:'የዲዛይነሩን ሥዕል እየጠበቅን ነው' },
          { en:'Waiting for material prices',      am:'የዕቃ ዋጋ እየጠበቅን ነው' },
          { en:'The customer changed the design',  am:'ደንበኛው ዲዛይኑን ቀየሩ' },
          { en:'Waiting for the price to be approved', am:'ዋጋው እንዲጸድቅ እየጠበቅን ነው' },
          { en:'Goes out tomorrow',                am:'ነገ ይላካል' }
        ], show:{f:'quotes_late', when:'pos'}}
    ]},
    { en:'Contracts', am:'ውሎች', fields:[
      {id:'contracts_any', en:'Was any contract signed today?', am:'ዛሬ የተፈረመ ውል አለ?', t:'yesno', quiet:1, auto:{picked:'e_events', v:'c_signed'}},
      {id:'contracts_list', en:'Each contract signed today', am:'ዛሬ የተፈረመ እያንዳንዱ ውል', t:'table', addEn:'Add a contract', addAm:'ውል ጨምር',
        show:{f:'contracts_any', when:'yes'},
        cols:[
          {id:'cust', en:'Customer', am:'ደንበኛ', t:'text'},
          {id:'lc', en:'Lead no. (4 digits)', am:'የደንበኛ ቁጥር (4 አሃዝ)', t:'text'},
          {id:'code', en:'Job code', am:'የሥራ ኮድ', t:'text'},
          {id:'value', en:'Contract value', am:'የውል ዋጋ', t:'money'},
          {id:'adv', en:'Advance paid', am:'የተከፈለ ቅድመ ክፍያ', t:'money'},
          {id:'margin', en:'Margin per m²', am:'ህዳግ በካሬ ሜትር', t:'money'},
          /* read by ephrata-below-margin through the weekly (bug hunt, 15 Oct 2026: never asked, so never judged) */
          {id:'ok', en:'Below 6,000 Birr/m²: did the Chairman approve the price?', am:'ከ6,000 ብር በካሬ ሜትር በታች ከሆነ፦ ሊቀመንበሩ ዋጋውን አጽድቀዋል?', t:'yesno', yes:{en:'Approved', am:'ፈቅደዋል'}, no:{en:'Not approved', am:'አልፈቀዱም'}},
          {id:'sp', en:'Salesperson', am:'ሻጭ', t:'text', picks:[{ en:'Tsega', am:'ፀጋ' }, { en:'Biruktayet', am:'ብሩክታይት' }, { en:'Ephrata', am:'ኤፍራታ' }]}
        ]},
      {id:'contracts', en:'How many contracts were signed today?', am:'ዛሬ ስንት ውል ተፈረመ?', t:'num',
        auto:{rows:'contracts_list'}, sumEn:'contracts', sumAm:'ውሎች'},
      {id:'contract_value', en:'What is the total value of today\'s contracts?', am:'የዛሬዎቹ ውሎች ጠቅላላ ዋጋ ስንት ነው?', t:'money',
        auto:{sum:'contracts_list.value'}, sumEn:'signed', sumAm:'የተፈረመ'},
      {id:'advance', en:'How much advance was collected today?', am:'ዛሬ ስንት ቅድመ ክፍያ ተሰበሰበ?', t:'money',
        auto:{sum:'contracts_list.adv'}, sumEn:'advance collected', sumAm:'የተሰበሰበ ቅድመ ክፍያ'},
      /* asked every day until 11 Oct 2026, advance or none; now only when an
         advance is on today's contracts */
      {id:'advance_banked', en:'Was all of the advance banked today?', am:'ቅድመ ክፍያው በሙሉ ዛሬ ባንክ ገብቷል?', t:'yesno', yes:{en:'All banked', am:'በሙሉ ባንክ ገብቷል'}, no:{en:'Not all banked', am:'በሙሉ አልገባም'}, show:{f:'advance', when:'pos'}},
      {id:'advance_banked_why', en:'Why not, and where is the money now? (Write the customer and when it will be banked in the box.)', am:'ለምን አልገባም? ገንዘቡ አሁን የት ነው? (ደንበኛውንና መቼ ባንክ እንደሚገባ በሳጥኑ ይጻፉ።)', t:'area',
        picks:[
          { en:'The bank was closed — banked tomorrow', am:'ባንክ ተዘግቶ ነበር — ነገ ይገባል' },
          { en:'Cash is in the office safe',       am:'ጥሬ ገንዘቡ በቢሮ ካዝና ውስጥ ነው' },
          { en:'Cash is with the salesperson',     am:'ጥሬ ገንዘቡ ሻጩ ጋ ነው' },
          { en:'A cheque — not cleared yet',       am:'ቼክ ነው — ገና አልተመነዘረም' },
          { en:'Handed to Selam',                  am:'ለሰላም ተሰጥቷል' }
        ], show:{f:'advance_banked', when:'no'}},
      /* change orders (8 Oct 2026), for the project control reader */
      {id:'vo_any', en:'Did any customer change their order after signing, today?', am:'ዛሬ ውል ከፈረመ በኋላ ትዕዛዙን የቀየረ ደንበኛ አለ?', t:'yesno', quiet:1, auto:{picked:'e_events', v:'c_change'}},
      {id:'vo_list', en:'Which jobs, what changed, and what did it do to the price?', am:'የትኞቹ ሥራዎች? ምን ተቀየረ? ዋጋውን እንዴት ቀየረው?', t:'table', addEn:'Add a change', addAm:'ለውጥ ጨምር',
        show:{f:'vo_any', when:'yes'},
        cols:[
          {id:'code', en:'Job code', am:'የሥራ ኮድ', t:'text'},
          {id:'cust', en:'Customer', am:'ደንበኛ', t:'text'},
          {id:'what', en:'What changed', am:'የተቀየረው', t:'text', picks:COL_CHANGED},
          {id:'value', en:'Added to the price (Birr)', am:'በዋጋው ላይ የተጨመረ (ብር)', t:'money'},
          {id:'less', en:'Taken off the price (Birr)', am:'ከዋጋው የተቀነሰ (ብር)', t:'money'},
          {id:'ok', en:'Signed by the customer', am:'ደንበኛው ፈርመዋል', t:'yesno', yes:{en:'Signed', am:'ፈርመዋል'}, no:{en:'Not signed', am:'አልፈረሙም'}}
        ]}
    ]},
    { en:'Cash collection', am:'የገንዘብ ስብሰባ', fields:[
      {id:'collected_any', en:'Was money collected from any customer today?', am:'ዛሬ ከደንበኛ ገንዘብ ተሰብስቧል?', t:'yesno', quiet:1, auto:{picked:'e_events', v:'money'}},
      {id:'collected_list', en:'From whom?', am:'ከማን ከማን?', t:'table', addEn:'Add a payment', addAm:'ክፍያ ጨምር',
        show:{f:'collected_any', when:'yes'},
        cols:[
          {id:'cust', en:'Customer', am:'ደንበኛ', t:'text'},
          {id:'lc', en:'Customer code: 4-digit lead no., or KK code once paid', am:'የደንበኛ ኮድ፦ ባለ 4 አሃዝ ቁጥር፣ ከከፈሉ በኋላ KK ኮድ', t:'text'},
          {id:'amount', en:'Amount', am:'መጠን', t:'money'},
          {id:'kind', en:'For', am:'የምን', t:'choice', opts:[
            {v:'advance', en:'Advance', am:'ቅድመ ክፍያ'},
            {v:'final', en:'Final payment', am:'የመጨረሻ ክፍያ'},
            {v:'other', en:'Other', am:'ሌላ'}]}
        ]},
      {id:'collected_today', en:'How much was collected from customers today?', am:'ዛሬ ከደንበኞች ስንት ብር ተሰበሰበ?', t:'money',
        auto:{sum:'collected_list.amount'}, sumEn:'collected', sumAm:'ተሰብስቧል'},
      /* Worked out, not typed (the Chairman, 13 Oct 2026): her own daily
         reports since Monday, with today's — her corrected figure for a day
         she fixed (Money.js) — fresh each Monday. Before Thursday it is not
         judged: the hint says what is still to go, and nothing turns red on
         a Monday; from Thursday, below the line asks who closes the gap. */
      {id:'week_total', en:'How much has come in this week so far?', am:'በዚህ ሳምንት እስካሁን ስንት ብር ገባ?', t:'money',
        auto:{soFar:'collected_today', fixes:1},
        tgt:{op:'gte', v:3000000, from:4, en:'Commission starts at 3,000,000 Birr/week', am:'ኮሚሽን የሚጀምረው በሳምንት ከ3,000,000 ብር ነው'}},
      {id:'week_gap', en:'Below 3,000,000 Birr. Who will close the gap by Saturday? (Write the customers and amounts in the box.)', am:'ከ3,000,000 ብር በታች ነው። እስከ ቅዳሜ ክፍተቱን የሚሞሉት እነማን ናቸው? (ደንበኞቹንና መጠኑን በሳጥኑ ይጻፉ።)', t:'area',
        picks:[
          { en:'Final payments due this week',     am:'በዚህ ሳምንት የሚጠበቁ የመጨረሻ ክፍያዎች' },
          { en:'Advances from contracts about to be signed', am:'ሊፈረሙ ካሉ ውሎች የሚመጣ ቅድመ ክፍያ' },
          { en:'It will not be reached this week', am:'በዚህ ሳምንት አይደረስበትም' }
        ], show:{f:'week_total', when:'miss'}},
      {id:'expected_list', en:'Expected collections: which clients will pay, what for, how much and when?', am:'የሚጠበቁ ክፍያዎች፦ የትኞቹ ደንበኞች፣ ለምን፣ ስንት እና መቼ ይከፍላሉ?', t:'table',
        addEn:'Add an expected payment', addAm:'የሚጠበቅ ክፍያ ጨምር',
        total:'amount', totalEn:'Total expected', totalAm:'ጠቅላላ የሚጠበቅ',
        cols:[
          {id:'cust', en:'Client', am:'ደንበኛ', t:'text'},
          {id:'lc', en:'Customer code: 4-digit lead no., or KK code once paid', am:'የደንበኛ ኮድ፦ ባለ 4 አሃዝ ቁጥር፣ ከከፈሉ በኋላ KK ኮድ', t:'text'},
          {id:'kind', en:'Payment', am:'የክፍያ ዓይነት', t:'choice', opts:[
            {v:'advance', en:'Advance', am:'ቅድመ ክፍያ'},
            {v:'final', en:'Final payment', am:'የመጨረሻ ክፍያ'},
            {v:'settlement', en:'Settlement', am:'የቀሪ ሂሳብ ማወራረጃ'}]},
          {id:'amount', en:'Amount', am:'መጠን', t:'money'},
          {id:'when', en:'When', am:'መቼ', t:'choice', opts:[
            {v:'today', en:'Today', am:'ዛሬ'},
            {v:'tomorrow', en:'Tomorrow', am:'ነገ'},
            {v:'week', en:'This week', am:'በዚህ ሳምንት'},
            {v:'next', en:'Next week', am:'በሚቀጥለው ሳምንት'},
            {v:'later', en:'Later', am:'ከዚያ በኋላ'}]}
        ]}
    ]},
    { en:'WhatsApp', am:'ዋትስአፕ', fields:[
      /* read by nothing; it is the count the stage messages below are out of */
      {id:'wa_groups', en:'How many customer groups are active? (If you counted.)', am:'ስንት የደንበኛ ግሩፖች ንቁ ናቸው? (ከቆጠሩ።)', t:'num', opt:1},
      /* –300 Birr for each one missing (js/rules.js ephrata-wa-stage-missing
         reads both boxes every day): still asked */
      {id:'wa_stage', en:'Stage messages due today in the customer groups: how many were posted? (posted / required)', am:'ዛሬ በደንበኛ ግሩፖች መላክ የነበረባቸው የደረጃ መልዕክቶች፦ ስንቱ ተላከ? (የተላከ / የሚገባው)', t:'ratio', ask:{b:{en:"How many stage messages were due today in the customer groups?", am:"ዛሬ በደንበኛ ግሩፖች ስንት የደረጃ መልዕክት መላክ ነበረበት?"}, a:{en:"How many of them were posted?", am:"ከእነሱ ስንቱ ተላከ?"}}},
      {id:'wa_stage_why', en:'Which groups missed their stage message, and why? (Write the groups in the box.)', am:'የደረጃ መልዕክት ያልደረሳቸው የትኞቹ ግሩፖች ናቸው? ለምን? (ግሩፖቹን በሳጥኑ ይጻፉ።)', t:'area',
        picks:[
          { en:'The designer forgot',              am:'ዲዛይነሩ ረሳ' },
          { en:'The salesperson forgot',           am:'ሻጩ ረሳ' },
          { en:'Posted late',                      am:'ዘግይቶ ተለጠፈ' },
          { en:'Waiting for a date from the factory', am:'ከፋብሪካው ቀን እየጠበቅን ነው' },
          { en:'Posted now',                       am:'አሁን ተለጥፏል' }
        ], show:{f:'wa_stage', when:'short'}},
      /* –200 Birr each (js/rules.js ephrata-wa-no-response) */
      {id:'wa_unanswered', en:'How many messages waited more than 2 hours for an answer?', am:'ከ2 ሰዓት በላይ ምላሽ ሳያገኙ የቆዩ መልዕክቶች ስንት ናቸው?', t:'num', zero:1,
        show:{f:'e_events', when:'has', v:'wa_slow'},
        tgt:{op:'lte', v:0, en:'–200 Birr each', am:'እያንዳንዱ –200 ብር'}},
      {id:'wa_unanswered_why', en:'Who should have answered, and have they been answered now? (Write the customers in the box.)', am:'መመለስ የነበረበት ማን ነበር? አሁን ምላሽ አግኝተዋል? (ደንበኞቹን በሳጥኑ ይጻፉ።)', t:'area',
        picks:[
          { en:'Answered now',                     am:'አሁን ምላሽ አግኝተዋል' },
          { en:'Still not answered',               am:'ገና ምላሽ አላገኙም' },
          { en:'The salesperson should have answered', am:'ሻጩ መመለስ ነበረበት' },
          { en:'The designer should have answered', am:'ዲዛይነሩ መመለስ ነበረበት' },
          { en:'It came after work hours',         am:'ከሥራ ሰዓት በኋላ መጣ' }
        ], show:{f:'wa_unanswered', when:'pos'}},
      /* –1,000 Birr each (js/rules.js ephrata-wa-complaint) */
      {id:'wa_complaints', en:'How many customers complained about WhatsApp handling?', am:'ስንት ደንበኞች በዋትስአፕ አያያዝ ላይ ቅሬታ አቀረቡ?', t:'num', zero:1,
        show:{f:'e_events', when:'has', v:'wa_comp'},
        tgt:{op:'lte', v:0, en:'–1,000 Birr each', am:'እያንዳንዱ –1,000 ብር'}},
      {id:'wa_complaints_what', en:'What was the complaint, and what was done? (Write the customer in the box.)', am:'ቅሬታው ምን ነበር? ምን እርምጃ ተወሰደ? (ደንበኛውን በሳጥኑ ይጻፉ።)', t:'area',
        picks:[
          { en:'Slow answers',                     am:'የዘገየ ምላሽ' },
          { en:'No news about their job',          am:'ስለ ሥራቸው ዜና አልደረሳቸውም' },
          { en:'A rude message',                   am:'ጨዋነት የጎደለው መልዕክት' },
          { en:'Called them and apologised',       am:'ደውለን ይቅርታ ጠየቅን' },
          { en:'Sorted out',                       am:'ተፈቷል' },
          { en:'Not sorted yet',                   am:'ገና አልተፈታም' }
        ], show:{f:'wa_complaints', when:'pos'}},
      {id:'wa_violations', en:'How many team members broke the WhatsApp rules today?', am:'ዛሬ ስንት የቡድን አባላት የዋትስአፕ ደንብ ጣሱ?', t:'num', zero:1,
        show:{f:'e_events', when:'has', v:'wa_rule'}},
      {id:'wa_violations_who', en:'What did they do, and what was the consequence? (Write who in the box.)', am:'ምን አደረጉ? ምን ቅጣት ተሰጠ? (ማን እንደሆነ በሳጥኑ ይጻፉ።)', t:'area',
        picks:[
          { en:'Answered late',                    am:'ዘግይቶ መለሰ' },
          { en:'A rude or unprofessional message', am:'ጨዋነት የጎደለው ወይም ሙያዊ ያልሆነ መልዕክት' },
          { en:'A stage message not posted',       am:'የደረጃ መልዕክት አልተለጠፈም' },
          { en:'Warned',                           am:'ማስጠንቀቂያ ተሰጠ' },
          { en:'Fined',                            am:'ቅጣት ተጣለ' },
          { en:'The Chairman was told',            am:'ለሊቀመንበሩ ተነግሯል' }
        ], show:{f:'wa_violations', when:'pos'}}
    ]},
    { en:'Marketing and social media', am:'ማርኬቲንግ እና ሶሻል ሚዲያ', fields:[
      /* a row a post, so the week's split by page comes out of it and the
         page is never written as a note nobody can add up */
      {id:'posts_any', en:'Did any post go up today?', am:'ዛሬ የተለጠፈ ፖስት አለ?', t:'yesno', quiet:1, auto:{picked:'e_events', v:'post'}},
      {id:'posts_list', en:'Each post that went up today', am:'ዛሬ የተለጠፈ እያንዳንዱ ፖስት', t:'table', addEn:'Add a post', addAm:'ፖስት ጨምር',
        show:{f:'posts_any', when:'yes'},
        cols:[
          {id:'page', en:'Page', am:'ገጽ', t:'choice', opts:[
            {v:'fb', en:'Facebook',  am:'ፌስቡክ'},
            {v:'ig', en:'Instagram', am:'ኢንስታግራም'},
            {v:'tt', en:'TikTok',    am:'ቲክቶክ'},
            {v:'other', en:'Somewhere else', am:'ሌላ ቦታ'}
          ]},
          {id:'what', en:'What it was about', am:'ስለምን ነበር', t:'text', picks:[{ en:'A finished kitchen', am:'የተጠናቀቀ ኩሽና' }, { en:'Work in progress', am:'በሂደት ላይ ያለ ሥራ' }, { en:'A customer\'s words', am:'የደንበኛ አስተያየት' }, { en:'An offer or price', am:'ቅናሽ ወይም ዋጋ' }, { en:'The showroom', am:'ማሳያ ክፍሉ' }]},
          {id:'leads', en:'Leads it brought', am:'ያመጣው ደንበኛ', t:'num'}
        ]},
      {id:'posts', en:'How many posts went up today?', am:'ዛሬ ስንት ፖስት ተለጠፈ?', t:'num',
        auto:{rows:'posts_list'}, sumEn:'posts', sumAm:'ፖስቶች'},
      {id:'posts_fb', en:'On Facebook', am:'በፌስቡክ', t:'num', i:1,
        auto:{rows:'posts_list', when:{col:'page', is:'fb'}}, sumEn:'on Facebook', sumAm:'በፌስቡክ'},
      {id:'posts_ig', en:'On Instagram', am:'በኢንስታግራም', t:'num', i:1,
        auto:{rows:'posts_list', when:{col:'page', is:'ig'}}, sumEn:'on Instagram', sumAm:'በኢንስታግራም'},
      {id:'posts_tt', en:'On TikTok', am:'በቲክቶክ', t:'num', i:1,
        auto:{rows:'posts_list', when:{col:'page', is:'tt'}}, sumEn:'on TikTok', sumAm:'በቲክቶክ'},
      {id:'platform', en:'On which pages?', am:'በየትኛው ገጽ?', t:'text',
        auto:{list:'posts_list.page'}},
      /* the Sales Director and the week add these up (Sales.js) */
      {id:'inq', en:'How many inquiries came in?', am:'ስንት ጥያቄዎች ደረሱ?', t:'num', zero:1,
        show:{f:'e_events', when:'has', v:'inq'}},
      {id:'inq_1hr', en:'How many were answered within 1 hour? (answered / all inquiries)', am:'ስንቱ በ1 ሰዓት ውስጥ ምላሽ አገኙ? (ምላሽ ያገኙ / ሁሉም)', t:'ratio', ask:{b:{en:"How many inquiries came in?", am:"ስንት ጥያቄዎች ደረሱ?"}, a:{en:"How many of them were answered within 1 hour?", am:"ከእነሱ ስንቱ በ1 ሰዓት ውስጥ ምላሽ አገኙ?"}}, auto:{b:{of:'inq'}}, whole:'inq',
        show:{f:'e_events', when:'has', v:'inq'}},
      {id:'mkt_leads', en:'How many real leads came from marketing today?', am:'ዛሬ ከማርኬቲንግ ስንት እውነተኛ ደንበኞች መጡ?', t:'num',
        auto:{sum:'posts_list.leads'}, sumEn:'leads from the posts', sumAm:'ከፖስቶቹ የመጡ ደንበኞች'},
      {id:'mkt_best', en:'Which post or page brought the most, and why did it work?', am:'በጣም ውጤታማ የነበረው የትኛው ፖስት ወይም ገጽ ነው? ለምን ሠራ?', t:'area', opt:1,
        picks:[
          { en:'Facebook',                         am:'ፌስቡክ' },
          { en:'Instagram',                        am:'ኢንስታግራም' },
          { en:'TikTok',                           am:'ቲክቶክ' },
          { en:'A video',                          am:'ቪዲዮ' },
          { en:'Photos of a finished kitchen',     am:'የተጠናቀቀ ኪችን ፎቶ' },
          { en:'A price offer',                    am:'የዋጋ ቅናሽ' }
        ], show:{f:'e_events', when:'has', v:['post', 'inq']}}
    ]},
    { en:'Problems and help', am:'ችግርና እርዳታ', fields:[
      {id:'problem', en:'What was the biggest problem today? (Write what is being done, and by whom, in the box.)', am:'የዛሬው ትልቁ ችግር ምን ነበር? (ምን እየተደረገ እንደሆነና በማን በሳጥኑ ይጻፉ።)', t:'area', opt:1,
        picks:[
          { en:'No big problem today',             am:'ዛሬ ትልቅ ችግር አልነበረም' },
          { en:'Few new leads',                    am:'አዲስ ደንበኞች ጥቂት ናቸው' },
          { en:'Customers say the price is high',  am:'ደንበኞች ዋጋው ውድ ነው ይላሉ' },
          { en:'Drawings are slow from the designers', am:'ከዲዛይነሮች ሥዕል ዘገየ' },
          { en:'Customers are slow to pay',        am:'ደንበኞች ለመክፈል ዘገዩ' },
          { en:'The factory date is late',         am:'የፋብሪካው ቀን ዘግይቷል' },
          { en:'A customer complaint',             am:'የደንበኛ ቅሬታ' },
          { en:'The team did not report',          am:'ቡድኑ ሪፖርት አላቀረበም' }
        ]},
      {id:'need_help', en:'What do you need, and from whom?', am:'ምን ያስፈልግዎታል? ከማን?', t:'area', opt:1,
        picks:[
          { en:'Nothing needed',                   am:'ምንም አያስፈልግም', nil:1 },
          { en:'Drawings from the designers',      am:'ከዲዛይነሮች ሥዕል' },
          { en:'A production date (Mahelet)',      am:'የምርት ቀን (ማህሌት)' },
          { en:'A payment confirmed (Selam)',      am:'የክፍያ ማረጋገጫ (ሰላም)' },
          { en:'An installation date (Elyas)',     am:'የተከላ ቀን (ኤልያስ)' },
          { en:'A price approved',                 am:'ዋጋ እንዲጸድቅ' },
          { en:'Money for marketing',              am:'ለማርኬቲንግ ገንዘብ' }
        ]},
      {id:'need_chair', en:'Do you need a decision from the Chairman?', am:'የሊቀመንበሩ ውሳኔ ያስፈልግዎታል?', t:'yesno', yes:{en:'I need a decision', am:'ውሳኔ ያስፈልገኛል'}, no:{en:'No decision needed', am:'ውሳኔ አያስፈልገኝም'}},
      {id:'need_chair_what', en:'What should the Chairman decide, what are the choices, and by when?', am:'ሊቀመንበሩ ምን መወሰን አለባቸው? አማራጮቹ ምንድን ናቸው? እስከ መቼ?', t:'area', picks:[{ en:'A discount above my limit', am:'ከገደቤ በላይ ቅናሽ' }, { en:'A price change', am:'የዋጋ ለውጥ' }, { en:'A customer complaint', am:'የደንበኛ ቅሬታ' }, { en:'A delivery date', am:'የማድረሻ ቀን' }, { en:'A payment plan', am:'የክፍያ ዕቅድ' }], show:{f:'need_chair', when:'yes'}}
    ]},
    { en:'Tomorrow', am:'ነገ', fields:[
      {id:'p1', en:'What comes first tomorrow?', am:'ነገ መጀመሪያ የሚሠራው ምንድን ነው?', t:'text', from:['visits_list.cust', 'contracts_list.cust', 'tm_visits.cust'], recent:1},
      {id:'p2', en:'And second?', am:'ሁለተኛው?', t:'text', from:['visits_list.cust', 'contracts_list.cust', 'tm_visits.cust'], recent:1, opt:1},
      {id:'p3', en:'And third?', am:'ሦስተኛው?', t:'text', from:['visits_list.cust', 'contracts_list.cust', 'tm_visits.cust'], recent:1, opt:1}
    ]}
  ]
},

/* ============================ MAHELET — DAILY ============================ */
{
  id:'liu-daily', person:'liu', cadence:'daily', dueTime:'17:30',
  en:'Daily Operations Report', am:'ዕለታዊ የኦፕሬሽን ሪፖርት',
  toEn:'Chairman', toAm:'ሊቀመንበር',
  dueEn:'5:30 PM every working day', dueAm:'በየሥራ ቀኑ ከቀኑ 11፡30 (5:30 PM)',
  penEn:'Late –200 Birr · Missing –500 Birr', penAm:'ዘግይቶ –200 ብር · ካልተላከ –500 ብር',
  sections:[
    /* REBUILT 11 Oct 2026 (the Chairman: "they are struggling so much with
       the questions"). Mahelet's first two reports (8 and 9 Oct) left 13 of
       23 and 6 of 21 questions empty, and four were empty every time: why
       the waste was over 20%, which material was short, the operations
       messages count and whether the assemblers posted. 20 questions stood
       on a day when nothing went wrong, 17 of them required, and every "why"
       wanted typing. Now a normal day is the waste, what went out of the
       store, the operations messages, one tap on the list in section 2, the
       problems and tomorrow. A machine down, an absence, a shortage, a job
       out of the gate, a Job File in, a group the assemblers missed, a rule
       worked around: one tap each on the list, and only then are their
       questions asked. Every answer key is the one it always was — the
       yes/no answers the rulebook and the agents read (resist,
       wa_assembler, shortage, delivered_any, downtime_any) are worked out
       from the list ({picked:…}, quiet:1); the counts it opens file 0 on a
       normal day (zero:1). mat_out_signed is still asked as a yes/no — it
       carries the 3,000 Birr fine. */
    { en:'The factory today', am:'ፋብሪካው ዛሬ', fields:[
      /* Amaha reports the waste too; the two are set side by side every
         morning (Agents.js cmp 'waste % — Amaha against Mahelet') — the
         Chairman put hers back on 8 Oct 2026 */
      {id:'waste', en:'About how much of today\'s material went to waste, in %? Your best guess is fine.', am:'ዛሬ ከዋለው ዕቃ በግምት ስንት % ባከነ? ግምትዎ በቂ ነው።', t:'pct',
        tgt:{op:'lte', v:20, en:'Must not exceed 20%', am:'ከ20% መብለጥ የለበትም'}},
      {id:'waste_why', en:'Waste is over 20%. Why, and what was done? (Write the job or machine in the box.)', am:'ብክነቱ ከ20% በላይ ነው። ለምን? ምን ተደረገ? (ሥራውን ወይም ማሽኑን በሳጥኑ ይጻፉ።)', t:'area',
        picks:[
          { en:'Cutting mistakes',                 am:'የመቁረጥ ስህተት' },
          { en:'A poor cutting plan',              am:'ጥሩ ያልሆነ የመቁረጫ ዕቅድ' },
          { en:'Damaged board',                    am:'የተበላሸ ሰሌዳ' },
          { en:'A machine problem',                am:'የማሽን ችግር' },
          { en:'Pieces too small to use',          am:'ለመጠቀም በጣም ትናንሽ ቁርጥራጮች' },
          { en:'The design changed',               am:'ዲዛይኑ ተቀየረ' },
          { en:'Amaha was told to fix it',         am:'አማሃ እንዲያስተካክል ተነግሮታል' }
        ], show:{f:'waste', when:'miss'}}
    ]},
    /* THE ONE LIST. Six yes/no questions and three counts used to stand in
       sections of their own, asked every day whether or not anything
       happened. */
    { en:'Anything else today?', am:'ዛሬ ሌላ የሆነ ነገር አለ?', fields:[
      {id:'o_events', en:'What else happened today?', am:'ዛሬ ሌላ ምን ሆነ?', t:'multi',
        none:{ en:'Nothing — a normal day', am:'ምንም — የተለመደ ቀን' },
        groups:[
          { v:'fac',   en:'Factory',          am:'ፋብሪካ' },
          { v:'store', en:'Store',            am:'መጋዘን' },
          { v:'out',   en:'Jobs and files',   am:'ሥራዎችና ፋይሎች' },
          { v:'wa',    en:'Customer groups',  am:'የደንበኛ ግሩፖች' },
          { v:'rule',  en:'Rules',            am:'ደንብ' }
        ],
        opts:[
          { v:'m_stop', g:'fac',   en:'A machine stopped',                          am:'ማሽን ቆመ' },
          { v:'absent', g:'fac',   en:'Workers were absent',                        am:'የቀሩ ሠራተኞች ነበሩ' },
          { v:'mat_in', g:'store', en:'Material came into the store',               am:'ዕቃ ወደ መጋዘን ገባ' },
          { v:'short',  g:'store', en:'A material is short in the store',           am:'በመጋዘን ያጠረ ዕቃ አለ' },
          { v:'out',    g:'out',   en:'A job left the factory',                     am:'ሥራ ከፋብሪካ ወጣ' },
          { v:'taxi',   g:'out',   en:'An outside taxi was hired',                  am:'የውጭ ታክሲ ተከራየ' },
          { v:'jf',     g:'out',   en:'Job Files came from Ephrata',                am:'ከኤፍራታ ጆብ ፋይል መጣ' },
          { v:'asm',    g:'wa',    en:'The assemblers did not post their progress in a group', am:'ገጣጣሚዎች በግሩፕ ሂደታቸውን አልለጠፉም' },
          { v:'slow',   g:'wa',    en:'A customer waited over 2 hours for an answer', am:'ደንበኛ ምላሽ ለማግኘት ከ2 ሰዓት በላይ ጠበቀ' },
          { v:'resist', g:'rule',  en:'Someone refused or worked around an operations rule', am:'የኦፕሬሽን ደንብን የተቃወመ ወይም ያለፈ ሰው ነበር' }
        ]}
    ]},
    { en:'Machines', am:'ማሽኖች', fields:[
      {id:'downtime_any', en:'Did any machine stop today?', am:'ዛሬ የቆመ ማሽን አለ?', t:'yesno', quiet:1, auto:{picked:'o_events', v:'m_stop'}},
      {id:'downtime_list', en:'Which machines stopped, and why?', am:'የቆሙት የትኞቹ ማሽኖች ናቸው? ለምን?', t:'table', addEn:'Add a machine', addAm:'ማሽን ጨምር',
        show:{f:'downtime_any', when:'yes'},
        cols:[
          {id:'machine', en:'Machine', am:'ማሽን', t:'choice', opts:[
            {v:'Width cutter',  en:'Width cutter',  am:'የወርድ መቁረጫ'},
            {v:'Length cutter', en:'Length cutter', am:'የርዝመት መቁረጫ'},
            {v:'Edge bander',   en:'Edge bander',   am:'ጠርዝ ማሰሪያ'},
            {v:'Hinge driller', en:'Hinge driller', am:'የማጠፊያ መብሻ'},
            {v:'Compressor',    en:'Compressor',    am:'ኮምፕረሰር'},
            {v:'Other',         en:'Other',         am:'ሌላ'}
          ]},
          {id:'hours', en:'Hours stopped', am:'የቆመበት ሰዓት', t:'num'},
          {id:'cause', en:'Cause', am:'ምክንያት', t:'text', picks:COL_MACHINE},
          {id:'told', en:'Chairman told at once', am:'ለሊቀመንበሩ ወዲያው ተነግሯል', t:'yesno', yes:{en:'Told at once', am:'ወዲያው ተነግሯቸዋል'}, no:{en:'Not told', am:'አልተነገራቸውም'}},
          {id:'back', en:'Back in service', am:'ወደ ሥራ የሚመለስበት', t:'text', picks:COL_WHEN}
        ]},
      {id:'downtime', en:'How many hours of machine downtime were there today?', am:'ዛሬ ማሽኖች በድምሩ ስንት ሰዓት ቆሙ?', t:'num',
        auto:{sum:'downtime_list.hours'}, sumEn:'hours stopped', sumAm:'ሰዓት ቆመዋል'},
      /* read by nothing, and the list above says it; kept for the days a
         machine did not run at all */
      {id:'machines', en:'How many machines ran today? (running / all machines)', am:'ዛሬ ስንት ማሽኖች ሠሩ? (የሠሩ / ሁሉም ማሽኖች)', t:'ratio', ask:{b:{en:"How many machines are there in all?", am:"በአጠቃላይ ስንት ማሽኖች አሉ?"}, a:{en:"How many of them ran today?", am:"ከእነሱ ስንቱ ዛሬ ሠሩ?"}}, opt:1,
        show:{f:'o_events', when:'has', v:'m_stop'}},
      {id:'machines_why', en:'Which machines did not run, and why? (Write the machine and when it is back in the box.)', am:'ያልሠሩት የትኞቹ ማሽኖች ናቸው? ለምን? (ማሽኑንና መቼ እንደሚመለስ በሳጥኑ ይጻፉ።)', t:'area',
        picks:[
          { en:'Broke down — being repaired',      am:'ተበላሽቶ እየተጠገነ ነው' },
          { en:'Waiting for a spare part',         am:'መለዋወጫ እየጠበቀ ነው' },
          { en:'Power cut',                        am:'መብራት ጠፋ' },
          { en:'No operator today',                am:'ዛሬ ኦፕሬተር አልነበረም' },
          { en:'No work for it today',             am:'ዛሬ ለሱ ሥራ አልነበረም' },
          { en:'Back tomorrow',                    am:'ነገ ይመለሳል' }
        ], show:{f:'machines', when:'short'}}
    ]},
    { en:'Workers', am:'ሠራተኞች', fields:[
      /* Amaha files the head count every day (mp_assigned, mp_present);
         hers is asked on the day someone was missing */
      {id:'workers', en:'How many workers came to work today? (present / assigned)', am:'ዛሬ ስንት ሠራተኞች ተገኙ? (የተገኙ / የተመደቡ)', t:'ratio', ask:{b:{en:"How many workers were assigned today?", am:"ዛሬ ስንት ሠራተኞች ተመድበው ነበር?"}, a:{en:"How many of them came to work?", am:"ከእነሱ ስንቱ ተገኙ?"}},
        show:{f:'o_events', when:'has', v:'absent'}},
      {id:'workers_why', en:'Who was absent, and was it with permission? (Write the names in the box.)', am:'የቀሩት እነማን ናቸው? በፈቃድ ነው? (ስማቸውን በሳጥኑ ይጻፉ።)', t:'area',
        picks:[
          { en:'With permission',                  am:'በፈቃድ' },
          { en:'Without permission',               am:'ያለ ፈቃድ' },
          { en:'Sick',                             am:'በህመም' },
          { en:'A family matter',                  am:'የቤተሰብ ጉዳይ' },
          { en:'Reason not known yet',             am:'ምክንያቱ ገና አልታወቀም' }
        ], show:{f:'workers', when:'short'}}
    ]},
    { en:'Store', am:'መጋዘን', fields:[
      {id:'mat_out', en:'How many material items went out of the store today?', am:'ዛሬ ከመጋዘን ስንት ዕቃዎች ወጡ?', t:'num'},
      /* –3,000 Birr when no (js/rules.js liu-material-no-approval), and the
         Chairman's brief names it (Agents.js BROKEN_): still a yes/no */
      {id:'mat_out_signed', en:'Did every item that went out carry your signed approval?', am:'እያንዳንዱ የወጣ ዕቃ በእርስዎ የተፈረመ ፈቃድ ነበረው?', t:'yesno', yes:{en:'All signed by me', am:'ሁሉም በእኔ ፊርማ ወጥተዋል'}, no:{en:'Something went out unsigned', am:'ያለ ፊርማ የወጣ አለ'}, show:{f:'mat_out', when:'pos'}},
      {id:'mat_out_unsigned', en:'What went out without approval, and why? (Write what and to whom in the box.)', am:'ያለ ፈቃድ የወጣው ምንድን ነው? ለምን? (ምን እና ለማን እንደሆነ በሳጥኑ ይጻፉ።)', t:'area',
        picks:[
          { en:'An urgent job could not wait',     am:'አስቸኳይ ሥራ መጠበቅ አልቻለም' },
          { en:'I was not there to sign',          am:'ለመፈረም እኔ አልነበርኩም' },
          { en:'Signed after it went out',         am:'ከወጣ በኋላ ተፈረመ' },
          { en:'The store gave it out without asking', am:'መጋዘኑ ሳይጠይቅ ሰጠ' },
          { en:'The Chairman was told',            am:'ለሊቀመንበሩ ተነግሯል' }
        ], show:{f:'mat_out_signed', when:'no'}},
      {id:'mat_in', en:'How many material items came into the store today?', am:'ዛሬ ወደ መጋዘን ስንት ዕቃዎች ገቡ?', t:'num', zero:1,
        show:{f:'o_events', when:'has', v:'mat_in'}},
      /* the plant manager and the operations reader both read this yes/no
         and name the material from shortage_what (Plant.js, Ops.js) */
      {id:'shortage', en:'Is any material short in the store today?', am:'ዛሬ በመጋዘን ያጠረ ዕቃ አለ?', t:'yesno', quiet:1, auto:{picked:'o_events', v:'short'}},
      {id:'shortage_what', en:'Which material is short?', am:'ያጠረው የትኛው ዕቃ ነው?', t:'text',
        picks:MATERIAL_OPTS, show:{f:'shortage', when:'yes'}},
      {id:'shortage_hit', en:'What does it hold up, and when does it arrive? (Write the jobs in the box.)', am:'ምን ያቆማል? መቼ ይደርሳል? (ሥራዎቹን በሳጥኑ ይጻፉ።)', t:'area',
        picks:[
          { en:'No job held up yet',               am:'ገና የቆመ ሥራ የለም' },
          { en:'Holds up cutting',                 am:'መቁረጡን አቁሟል' },
          { en:'Holds up assembly',                am:'መገጣጠሙን አቁሟል' },
          { en:'It arrives tomorrow',              am:'ነገ ይደርሳል' },
          { en:'No date yet — Getachew was told',  am:'ቀን የለም — ለጌታቸው ተነግሯል' }
        ], show:{f:'shortage', when:'yes'}}
    ]},
    { en:'Out of the factory', am:'ከፋብሪካ መውጣት', fields:[
      /* what is installed at the site, whether it was on time, the
         acceptance signed and the complaints are Elyas's — he is there
         (the Chairman, 8 Oct 2026). Hers is the gate out of the factory:
         nothing leaves without Selam's clearance. */
      {id:'delivered_any', en:'Did any job leave the factory today?', am:'ዛሬ ከፋብሪካ የወጣ ሥራ አለ?', t:'yesno', quiet:1, auto:{picked:'o_events', v:'out'}},
      {id:'delivered_list', en:'Which jobs left the factory today?', am:'ዛሬ ከፋብሪካ የወጡት የትኞቹ ሥራዎች ናቸው?', t:'table', addEn:'Add a job', addAm:'ሥራ ጨምር',
        show:{f:'delivered_any', when:'yes'},
        cols:[
          {id:'code', en:'Job code', am:'የሥራ ኮድ', t:'text'},
          {id:'cust', en:'Customer', am:'ደንበኛ', t:'text'},
          {id:'fin',  en:'Selam cleared', am:'ሰላም አጽድቃለች', t:'yesno', yes:{en:'Selam cleared it', am:'ሰላም ፈቅዳለች'}, no:{en:'Not cleared', am:'ሰላም አልፈቀደችም'}}
        ]},
      {id:'delivered', en:'How many jobs were delivered to customers today?', am:'ዛሬ ስንት ሥራዎች ለደንበኞች ደረሱ?', t:'num',
        auto:{rows:'delivered_list'}, sumEn:'jobs out', sumAm:'ሥራዎች ወጥተዋል'},
      {id:'delivered_cleared', en:'How many of them had Selam\'s clearance?', am:'ከነሱ ስንቱ የሰላም ማጽደቅ ነበረው?', t:'num',
        auto:{rows:'delivered_list', when:{col:'fin', is:'yes'}}, sumEn:'cleared by Selam', sumAm:'በሰላም ተጽድቀዋል'},
      /* An outside taxi is money the company truck should have saved (the
         Chairman, 12 Oct 2026): for each one, the job, what the driver asked
         and who caused it. "Who caused it" files the person's id (amaha,
         getachew…) so a reader can add up each person's taxis. */
      {id:'taxi_any', en:'Was an outside taxi hired today?', am:'ዛሬ የውጭ ታክሲ ተከራይቶ ነበር?', t:'yesno', quiet:1, auto:{picked:'o_events', v:'taxi'}},
      {id:'taxi_list', en:'Each outside taxi: which job, how much the driver asked, and who caused it', am:'እያንዳንዱ የውጭ ታክሲ፦ ለየትኛው ሥራ፣ ሹፌሩ ስንት ብር ጠየቀ፣ ምክንያቱ ማን ነው?', t:'table', addEn:'Add a taxi', addAm:'ታክሲ ጨምር',
        show:{f:'taxi_any', when:'yes'}, total:'cost', totalEn:'Outside taxis today', totalAm:'የዛሬ የውጭ ታክሲ',
        cols:[
          {id:'code', en:'Job code', am:'የሥራ ኮድ', t:'text'},
          {id:'cost', en:'How much the driver asked', am:'ሹፌሩ የጠየቀው ብር', t:'money'},
          {id:'who',  en:'Who caused it', am:'ምክንያቱ ማን ነው', t:'choice', opts:[
            {v:'amaha',    en:'Amaha — production late',      am:'አማሃ — ምርቱ ዘገየ'},
            {v:'getachew', en:'Getachew — material late',     am:'ጌታቸው — ዕቃው ዘገየ'},
            {v:'alemaya', en:'Alemaya — the store',         am:'አለማያ — መጋዘኑ'},
            {v:'wude',     en:'Wude — the quality check',     am:'ውዱ — የጥራት ፍተሻው'},
            {v:'elyas',    en:'Elyas — installation',         am:'ኤልያስ — ተከላው'},
            {v:'ephrata',  en:'Ephrata — sales',              am:'ኤፍራታ — ሽያጩ'},
            {v:'liu',      en:'Me',                           am:'እኔ'},
            {v:'truck',    en:'Our truck was busy or broken', am:'የኛ መኪና ሥራ ላይ ነበር ወይም ተበላሽቷል'},
            {v:'customer', en:'The customer',                 am:'ደንበኛው'},
            {v:'Other',    en:'Other',                        am:'ሌላ'}
          ]}
        ]},
      {id:'taxi_cost', en:'How much was spent on outside taxis today?', am:'ዛሬ ለውጭ ታክሲ ስንት ብር ወጣ?', t:'money',
        auto:{sum:'taxi_list.cost'}, sumEn:'on outside taxis', sumAm:'ለውጭ ታክሲ'}
    ]},
    /* the three counts were a chain — received, accepted, returned — where
       the third is the first less the second, and the list of what was
       returned says it better than any of them */
    { en:'Job Files from Ephrata', am:'ከኤፍራታ የመጡ ጆብ ፋይሎች', fields:[
      {id:'jf_recv', en:'How many Job Files did you receive from Ephrata today?', am:'ዛሬ ከኤፍራታ ስንት ጆብ ፋይሎች ደረሱዎት?', t:'num', zero:1,
        show:{f:'o_events', when:'has', v:'jf'}},
      {id:'jf_rej_any', en:'Did you return any of them to Ephrata as incomplete?', am:'ያልተሟሉ ስለሆኑ ለኤፍራታ የመለሱት አለ?', t:'yesno', yes:{en:'I returned some', am:'የመለስኩት አለ'}, no:{en:'I returned none', am:'ምንም አልመለስኩም'}, show:{f:'jf_recv', when:'pos'}},
      {id:'jf_rej_list', en:'Which files were returned, and what was missing from each?', am:'የተመለሱት የትኞቹ ፋይሎች ናቸው? በእያንዳንዱ ምን ጎደለ?', t:'table', addEn:'Add a file', addAm:'ፋይል ጨምር',
        show:{f:'jf_rej_any', when:'yes'},
        cols:[
          {id:'cust', en:'Customer', am:'ደንበኛ', t:'text'},
          {id:'code', en:'Job code', am:'የሥራ ኮድ', t:'text'},
          {id:'what', en:'What was missing', am:'የጎደለው', t:'text', picks:COL_JOBFILE}
        ]},
      {id:'jf_rej', en:'How many did you return to Ephrata as incomplete?', am:'ስንቱን ያልተሟሉ ስለሆኑ ለኤፍራታ መለሱ?', t:'num',
        auto:{rows:'jf_rej_list'}, sumEn:'returned', sumAm:'ተመልሰዋል'},
      {id:'jf_acc', en:'How many did you accept and sign for in the handover log?', am:'ስንቱን ተቀብለው በመረከቢያ መዝገቡ ፈረሙ?', t:'num',
        auto:{minus:['jf_recv', 'jf_rej']}, sumEn:'accepted and signed for', sumAm:'ተቀብለው ተፈርመዋል'}
    ]},
    { en:'Customer groups', am:'የደንበኛ ግሩፖች', fields:[
      /* –200 Birr for each one not on time (js/rules.js
         liu-wa-ops-message-late reads both boxes every day): still asked */
      {id:'wa_ops', en:'Operations messages due today in the customer groups: how many went out on time? (on time / due today)', am:'ዛሬ በደንበኛ ግሩፖች መላክ የነበረባቸው የኦፕሬሽን መልዕክቶች፦ ስንቱ በሰዓቱ ተላከ? (በሰዓቱ የተላከ / ዛሬ መላክ የነበረበት)', t:'ratio', ask:{b:{en:"How many operations messages were due today in the customer groups?", am:"ዛሬ በደንበኛ ግሩፖች ስንት የኦፕሬሽን መልዕክት መላክ ነበረበት?"}, a:{en:"How many of them went out on time?", am:"ከእነሱ ስንቱ በሰዓቱ ተላከ?"}}},
      {id:'wa_missed', en:'Which groups missed theirs, and why? (Write the groups in the box.)', am:'ያልተላከባቸው የትኞቹ ግሩፖች ናቸው? ለምን? (ግሩፖቹን በሳጥኑ ይጻፉ።)', t:'area',
        picks:[
          { en:'No news to give yet',              am:'ገና የሚነገር ዜና አልነበረም' },
          { en:'Waiting for a date from the factory', am:'ከፋብሪካው ቀን እየጠበቅን ነው' },
          { en:'Posted late',                      am:'ዘግይቶ ተለጠፈ' },
          { en:'Forgot',                           am:'ተረስቷል' },
          { en:'No time',                          am:'ጊዜ አልነበረም' }
        ], show:{f:'wa_ops', when:'short'}},
      /* –300 Birr when no (js/rules.js liu-wa-assembler-progress) */
      {id:'wa_assembler', en:'Did the assemblers post their daily progress in every customer group?', am:'ገጣጣሚዎች በሁሉም የደንበኛ ግሩፖች ዕለታዊ ሂደታቸውን ለጠፉ?', t:'yesno', quiet:1, auto:{picked:'o_events', v:'asm', flip:1}},
      {id:'wa_assembler_why', en:'Which groups were missed, and why? (Write the group and the assembler in the box. –300 Birr each)', am:'በየትኞቹ ግሩፖች አልተለጠፈም? ለምን? (ግሩፑንና ገጣጣሚውን በሳጥኑ ይጻፉ። በእያንዳንዱ –300 ብር)', t:'area',
        picks:[
          { en:'No network at the site',           am:'በሳይቱ ኔትወርክ አልነበረም' },
          { en:'The assembler forgot',             am:'ገጣጣሚው ረሳ' },
          { en:'The assembler has no smartphone',  am:'ገጣጣሚው ስማርት ስልክ የለውም' },
          { en:'Posted late',                      am:'ዘግይቶ ተለጠፈ' },
          { en:'Elyas was told',                   am:'ለኤልያስ ተነግሯል' }
        ], show:{f:'wa_assembler', when:'no'}},
      {id:'wa_unanswered', en:'How many customer messages waited more than 2 hours for an operations answer?', am:'ስንት የደንበኛ መልዕክቶች ከ2 ሰዓት በላይ የኦፕሬሽን ምላሽ ሳያገኙ ቆዩ?', t:'num', zero:1,
        show:{f:'o_events', when:'has', v:'slow'}},
      {id:'wa_unanswered_why', en:'Who should have answered, and have they been answered now? (Write the customer in the box.)', am:'መመለስ የነበረበት ማን ነበር? አሁን ምላሽ አግኝተዋል? (ደንበኛውን በሳጥኑ ይጻፉ።)', t:'area',
        picks:[
          { en:'Answered now',                     am:'አሁን ምላሽ አግኝተዋል' },
          { en:'Still not answered',               am:'ገና ምላሽ አላገኙም' },
          { en:'Waiting for a date from the factory', am:'ከፋብሪካው ቀን እየጠበቅን ነው' },
          { en:'The site team should have answered', am:'የሳይት ቡድኑ መመለስ ነበረበት' },
          { en:'I did not see it in time',         am:'በጊዜ አላየሁትም' }
        ], show:{f:'wa_unanswered', when:'pos'}}
    ]},
    { en:'A rule worked around', am:'የታለፈ ደንብ', fields:[
      /* the Chairman's brief names it (Agents.js BROKEN_): still a yes/no */
      {id:'resist', en:'Did anyone refuse or work around an operations rule today?', am:'ዛሬ የኦፕሬሽን ደንብን የተቃወመ ወይም ያለፈ ሰው ነበር?', t:'yesno', quiet:1, auto:{picked:'o_events', v:'resist'}},
      {id:'resist_what', en:'What happened, and what did you do? (Write who and which rule in the box.)', am:'ምን ሆነ? ምን እርምጃ ወሰዱ? (ማን እንደሆነና የትኛውን ደንብ በሳጥኑ ይጻፉ።)', t:'area',
        picks:[
          { en:'Material taken without approval',  am:'ያለ ፈቃድ ዕቃ ተወሰደ' },
          { en:'Work started without the Job File', am:'ያለ ጆብ ፋይል ሥራ ተጀመረ' },
          { en:'A QC check was skipped',           am:'የጥራት ፍተሻ ታለፈ' },
          { en:'A job went out without clearance', am:'ሥራ ያለ ማጽደቅ ወጣ' },
          { en:'An instruction was refused',       am:'የተሰጠ ትዕዛዝ አልተቀበሉም' },
          { en:'I warned them',                    am:'አስጠነቀቅኳቸው' },
          { en:'The Chairman was told',            am:'ለሊቀመንበሩ ተነግሯል' }
        ], show:{f:'resist', when:'yes'}}
    ]},
    { en:'Problems and help', am:'ችግርና እርዳታ', fields:[
      {id:'problem', en:'What was the biggest problem today? (Write what is being done, and by whom, in the box.)', am:'የዛሬው ትልቁ ችግር ምን ነበር? (ምን እየተደረገ እንደሆነና በማን በሳጥኑ ይጻፉ።)', t:'area', opt:1,
        picks:DAY_PROBLEM.concat([
          { en:'Waiting for a customer payment',   am:'የደንበኛ ክፍያ እየጠበቅን ነው' },
          { en:'A site was not ready',             am:'ሳይቱ ዝግጁ አልነበረም' }
        ])},
      {id:'need_help', en:'What do you need, and from whom?', am:'ምን ያስፈልግዎታል? ከማን?', t:'area', opt:1,
        picks:[
          { en:'Nothing needed',                   am:'ምንም አያስፈልግም', nil:1 },
          { en:'A payment confirmed (Selam)',      am:'የክፍያ ማረጋገጫ (ሰላም)' },
          { en:'A purchase (Getachew)',            am:'ግዢ (ጌታቸው)' },
          { en:'Job Files or designs (Ephrata)',   am:'ጆብ ፋይል ወይም ዲዛይን (ኤፍራታ)' },
          { en:'A site made ready (Elyas)',        am:'ሳይት ዝግጁ እንዲሆን (ኤልያስ)' },
          { en:'More workers',                     am:'ተጨማሪ ሠራተኛ' },
          { en:'A machine repaired',               am:'ማሽን መጠገን' }
        ]},
      {id:'need_chair', en:'Do you need a decision from the Chairman?', am:'የሊቀመንበሩ ውሳኔ ያስፈልግዎታል?', t:'yesno', yes:{en:'I need a decision', am:'ውሳኔ ያስፈልገኛል'}, no:{en:'No decision needed', am:'ውሳኔ አያስፈልገኝም'}},
      {id:'need_chair_what', en:'What should the Chairman decide, what are the choices, and by when?', am:'ሊቀመንበሩ ምን መወሰን አለባቸው? አማራጮቹ ምንድን ናቸው? እስከ መቼ?', t:'area', picks:[{ en:'Approve a purchase', am:'ግዢ መፍቀድ' }, { en:'Approve overtime', am:'የትርፍ ሰዓት መፍቀድ' }, { en:'Change a delivery date', am:'የማድረሻ ቀን መቀየር' }, { en:'A worker problem', am:'የሠራተኛ ጉዳይ' }, { en:'A machine repair or part', am:'የማሽን ጥገና ወይም መለዋወጫ' }], show:{f:'need_chair', when:'yes'}}
    ]},
    { en:'Tomorrow', am:'ነገ', fields:[
      {id:'p1', en:'What comes first tomorrow?', am:'ነገ መጀመሪያ የሚሠራው ምንድን ነው?', t:'text', from:['delivered_list.code'], recent:1},
      {id:'p2', en:'And second?', am:'ሁለተኛው?', t:'text', from:['delivered_list.code'], recent:1, opt:1},
      {id:'p3', en:'And third?', am:'ሦስተኛው?', t:'text', from:['delivered_list.code'], recent:1, opt:1}
    ]}
  ]
},

/* ============================= BETTY — DAILY ============================= */
{
  id:'betty-daily', person:'betty', cadence:'daily', dueTime:'17:30',
  en:'Daily Finance Report', am:'ዕለታዊ የፋይናንስ ሪፖርት',
  toEn:'Chairman + Kidan', toAm:'ሊቀመንበር + ኪዳን',
  dueEn:'5:30 PM every working day', dueAm:'በየሥራ ቀኑ ከቀኑ 11፡30 (5:30 PM)',
  penEn:'Late –200 Birr · Missing –500 Birr', penAm:'ዘግይቶ –200 ብር · ካልተላከ –500 ብር',
  derived:1,
  sections:[
    /* REBUILT 11 Oct 2026 (the Chairman: "they are struggling so much with
       the questions"). Selam had not filed this report once. It stood at 33
       questions before any follow-up opened, with 27 follow-ups behind them:
       nine "did any … today?" gates, ten yes/no checks on things that go
       wrong once a month (cash not banked, the cashbook behind, a cheque
       written before its funds, the board off the files, a document
       missing), and a typed "why" under every one. Now a normal day is the
       cash, the bank lines, the money that came in and went out, one tap on
       "nothing else happened", and tomorrow. The checks that go wrong, and
       the money that comes with a job (a final payment request sent, an
       assembler's money set aside or paid), are one list in "Anything else
       today?" — only what is tapped is asked. Every answer key is the one it
       always was: the yes/no answers the rulebook, the Group CFO, the
       reconciliation and the alerts read (cash_banked, discrepancy,
       zz_confirmed, board_match, asm_unreserved) are worked out from the
       list ({picked:…}, quiet:1); the counts behind it file a real 0 on a
       normal day (zero:1); the lists behind it read 0 when it was answered
       without them. 16 Oct 2026: the bank lines are gone — the owner gives the
       balance on WhatsApp — and the money lists are one list (below). */
    { en:'Cash on hand', am:'በእጅ ያለ ጥሬ ገንዘብ', fields:[
      /* asked every day: the rulebook fines more than 5,000 overnight
         (betty-cash-overnight) and the Group CFO reads it each morning */
      {id:'cash_hand', en:'How much cash is on hand at close?', am:'በመዝጊያ ሰዓት በእጅ ስንት ጥሬ ገንዘብ አለ?', t:'money',
        tgt:{op:'lte', v:5000, en:'Over 5,000 Birr overnight is –300 Birr', am:'ከ5,000 ብር በላይ ካደረ –300 ብር'}},
      {id:'cash_hand_why', en:'Over 5,000 Birr is staying overnight. Why, and where is it kept?', am:'ከ5,000 ብር በላይ ያድራል። ለምን? የት ነው የሚቀመጠው?', t:'area',
        picks:[
          { en:'It came in after the bank closed',      am:'ባንክ ከተዘጋ በኋላ ነው የገባው' },
          { en:'The bank was closed today',             am:'ዛሬ ባንክ ዝግ ነበር' },
          { en:'Nobody could go to the bank',           am:'ወደ ባንክ የሚሄድ ሰው አልነበረም' },
          { en:'Kept for a payment due tomorrow',       am:'ነገ ለሚከፈል ክፍያ ተቀምጧል' },
          { en:'Locked in the office safe',             am:'በቢሮው ካዝና ተቆልፎበታል' },
          { en:'Goes to the bank first thing tomorrow', am:'ነገ ጠዋት መጀመሪያ ባንክ ይገባል' }
        ], show:{f:'cash_hand', when:'miss'}}
    ]},
    /* EVERY TRANSACTION, ONE LIST (the user, 16 Oct 2026: "start today — I
       report the bank balance, not Finance; Finance reports all transactions
       in and out"). The bank balance is the owner's, sent on WhatsApp
       (apps-script/Bank.js), and is no longer asked here. The five lists that
       stood here — cash receipts, advances, final payments, payments
       approved, transfers to ZamZam — are this one list: each row money in,
       money out, or a move between Klever's own accounts. Every key the
       rulebook, the register, the Group CFO and the checks read is still
       filed under its old name, worked out from the rows: the old lists are
       folded out of it (quiet), the totals are its rows added up. Each
       evening the owner's balance is checked against the one before it plus
       the bank's money in and less its money out (Bank.js bankCheck_). */
    { en:'Money in and out today', am:'ዛሬ የገባና የወጣ ገንዘብ', fields:[
      {id:'tx_any', en:'Did any money come in or go out today — bank or cash?', am:'ዛሬ የገባ ወይም የወጣ ገንዘብ አለ? (ባንክ ወይም ጥሬ ገንዘብ)', t:'yesno', yes:{en:'Money moved', am:'ገንዘብ ተንቀሳቅሷል'}, no:{en:'Nothing moved today', am:'ዛሬ ምንም አልተንቀሳቀሰም'}},
      {id:'tx_list', en:'Every transaction today, one row each — in, out, and between our accounts', am:'የዛሬ እያንዳንዱ ገቢ፣ ወጪና ዝውውር — በየረድፉ', t:'table', addEn:'Add a transaction', addAm:'ገቢ ወይም ወጪ ጨምር',
        show:{f:'tx_any', when:'yes'},
        cols:[
          {id:'dir', en:'In, out or moved', am:'ገቢ፣ ወጪ ወይስ ዝውውር', t:'choice', opts:TX_DIR},
          {id:'kin', en:'What came in', am:'የገባው ምንድን ነው', t:'choice', opts:TX_IN, ifCol:'dir', ifIn:['in']},
          {id:'kout', en:'What it was paid for', am:'የተከፈለው ለምንድን ነው', t:'choice', opts:TX_OUT, ifCol:'dir', ifIn:['out']},
          {id:'via', en:'Which account (a move: taken from)', am:'የትኛው ሂሳብ (ዝውውር ከሆነ፦ ከየት)', t:'choice', opts:TX_ACCOUNTS},
          {id:'via2', en:'Moved into', am:'የገባበት ሂሳብ', t:'choice', opts:TX_ACCOUNTS, ifCol:'dir', ifIn:['move']},
          {id:'amount', en:'Amount', am:'መጠን', t:'money'},
          {id:'who', en:'From whom / paid to', am:'ከማን / ለማን', t:'text', ifCol:'dir', ifIn:['in', 'out']},
          {id:'code', en:'Job code', am:'የሥራ ኮድ', t:'text', ifCol:'kin', ifIn:['advance', 'final', 'customer']},
          {id:'ref', en:'Receipt or reference no.', am:'የደረሰኝ ወይም የማጣቀሻ ቁጥር', t:'text'},
          {id:'file', en:'Job File opened', am:'ጆብ ፋይል ተከፍቷል', t:'yesno', yes:{en:'Opened', am:'ተከፍቷል'}, no:{en:'Not yet', am:'ገና አልተከፈተም'}, ifCol:'kin', ifIn:['advance']},
          {id:'group', en:'WhatsApp group created', am:'ዋትስአፕ ግሩፕ ተከፍቷል', t:'yesno', yes:{en:'Created', am:'ተከፍቷል'}, no:{en:'Not yet', am:'ገና አልተከፈተም'}, ifCol:'kin', ifIn:['advance']},
          {id:'prod', en:'Mahelet told production may start', am:'ምርት እንዲጀመር ለማህሌት ተነግሯል', t:'yesno', yes:{en:'Mahelet told', am:'ለማህሌት ተነግሯታል'}, no:{en:'Not told yet', am:'ገና አልተነገራትም'}, ifCol:'kin', ifIn:['final']},
          {id:'kidan', en:'Kidan\'s approval (needed over 50,000)', am:'የኪዳን ፈቃድ (ከ50,000 በላይ ያስፈልጋል)', t:'yesno', yes:{en:'Kidan approved', am:'ኪዳን ፈቅደዋል'}, no:{en:'Without Kidan', am:'ያለ ኪዳን ፈቃድ'}, ifCol:'dir', ifIn:['out']},
          {id:'req', en:'Purchase request it covers', am:'የሚሸፍነው የግዥ ጥያቄ', t:'text', ifCol:'via2', ifIn:['zz']},
          {id:'sup', en:'For which supplier', am:'ለየትኛው አቅራቢ', t:'text', ifCol:'via2', ifIn:['zz']},
          {id:'match', en:'Same as the approved amount', am:'ከጸደቀው መጠን ጋር እኩል ነው', t:'yesno', yes:{en:'Same amount', am:'መጠኑ እኩል ነው'}, no:{en:'Different amount', am:'መጠኑ ይለያል'}, ifCol:'via2', ifIn:['zz']}
        ]},
      {id:'money_in', en:'How much came in today?', am:'ዛሬ ስንት ብር ገባ?', t:'money',
        auto:{sum:'tx_list.amount', when:{col:'dir', is:'in'}, orZero:1}, sumEn:'in', sumAm:'ገብቷል'},
      {id:'money_out', en:'How much went out today?', am:'ዛሬ ስንት ብር ወጣ?', t:'money',
        auto:{sum:'tx_list.amount', when:{col:'dir', is:'out'}, orZero:1}, sumEn:'out', sumAm:'ወጥቷል'},
      /* the keys read before 16 Oct, each the rows that are that kind of money */
      {id:'cash_in', en:'How much cash came in today?', am:'ዛሬ ስንት ብር ጥሬ ገንዘብ ገባ?', t:'money', quiet:1,
        auto:{sum:'tx_list.amount', when:[{col:'dir', is:'in'}, {col:'via', is:'cash'}], orZero:1}},
      {id:'adv_in', en:'How much came in as advance payments today?', am:'ዛሬ ስንት ብር ቅድመ ክፍያ ገባ?', t:'money', quiet:1,
        auto:{sum:'tx_list.amount', when:[{col:'dir', is:'in'}, {col:'kin', is:'advance'}], orZero:1}},
      {id:'jf_created', en:'How many Job Files were opened today?', am:'ዛሬ ስንት ጆብ ፋይሎች ተከፈቱ?', t:'num', quiet:1,
        auto:{rows:'tx_list', when:[{col:'dir', is:'in'}, {col:'kin', is:'advance'}, {col:'file', is:'yes'}]}},
      {id:'wa_created', en:'How many customer WhatsApp groups were created today?', am:'ዛሬ ስንት የደንበኛ ዋትስአፕ ግሩፖች ተከፈቱ?', t:'num', quiet:1,
        auto:{rows:'tx_list', when:[{col:'dir', is:'in'}, {col:'kin', is:'advance'}, {col:'group', is:'yes'}]}},
      {id:'final_in', en:'How much came in as final payments today?', am:'ዛሬ ስንት ብር የመጨረሻ ክፍያ ገባ?', t:'money', quiet:1,
        auto:{sum:'tx_list.amount', when:[{col:'dir', is:'in'}, {col:'kin', is:'final'}], orZero:1}},
      {id:'prod_confirmed', en:'How many production go-aheads did you give Mahelet today?', am:'ዛሬ ለማህሌት ስንት የምርት ፈቃድ ሰጡ?', t:'num', quiet:1,
        auto:{rows:'tx_list', when:[{col:'dir', is:'in'}, {col:'kin', is:'final'}, {col:'prod', is:'yes'}]}},
      /* the job codes are already in the rows above; what is left to say is
         whether the money behind each go-ahead was seen in the bank */
      {id:'prod_list', en:'You told Mahelet production may start. Was each final payment seen in the bank?', am:'ምርት እንዲጀመር ለማህሌት ተነግሯል። የእያንዳንዱ የመጨረሻ ክፍያ ባንክ ውስጥ ታይቷል?', t:'area', one:1,
        picks:[
          { en:'Yes — every one is in the bank',                  am:'አዎ — ሁሉም ባንክ ገብቷል' },
          { en:'Not all — one is on a receipt only (job code in the box)', am:'ሁሉም አይደለም — አንዱ በደረሰኝ ብቻ ነው (የሥራ ኮዱን በሳጥኑ ይጻፉ)' }
        ], show:{f:'prod_confirmed', when:'pos'}},
      {id:'pay_approved', en:'How many payments went out today?', am:'ዛሬ ስንት ክፍያዎች ወጡ?', t:'num', quiet:1,
        auto:{rows:'tx_list', when:{col:'dir', is:'out'}}},
      {id:'pay_value', en:'What is the total of the payments that went out today?', am:'ዛሬ የወጡት ክፍያዎች ጠቅላላ ስንት ነው?', t:'money', quiet:1,
        auto:{sum:'tx_list.amount', when:{col:'dir', is:'out'}, orZero:1}},
      {id:'pay_kidan', en:'How many payments over 50,000 Birr went to Kidan for approval?', am:'ከ50,000 ብር በላይ የሆኑ ስንት ክፍያዎች ለኪዳን ፈቃድ ተላኩ?', t:'num', quiet:1,
        auto:{rows:'tx_list', when:[{col:'dir', is:'out'}, {col:'kidan', is:'yes'}]}},
      {id:'pay_big_unapproved', en:'How many payments over 50,000 Birr went out without Kidan?', am:'ከ50,000 ብር በላይ ያለኪዳን ፈቃድ የወጡ ክፍያዎች ስንት ናቸው?', t:'num', quiet:1,
        auto:{rows:'tx_list', when:[{col:'dir', is:'out'}, {col:'amount', gte:50001}, {col:'kidan', is:'no'}]},
        tgt:{op:'lte', v:0, en:'Over 50,000 Birr needs Kidan first', am:'ከ50,000 ብር በላይ የኪዳን ፈቃድ ይጠይቃል'}},
      {id:'pay_big_why', en:'A payment over 50,000 Birr went out without Kidan. Why? (Write which one in the box.)', am:'ከ50,000 ብር በላይ የሆነ ክፍያ ያለ ኪዳን ፈቃድ ወጣ። ለምን? (የትኛው እንደሆነ በሳጥኑ ይጻፉ።)', t:'area',
        picks:[
          { en:'Kidan could not be reached',              am:'ኪዳንን ማግኘት አልተቻለም' },
          { en:'Urgent — the supplier would not wait',    am:'አስቸኳይ ነበር — አቅራቢው አልጠበቀም' },
          { en:'The Chairman approved it',                am:'ሊቀመንበሩ ፈቅደዋል' },
          { en:'Kidan agreed by phone — not yet in writing', am:'የኪዳን ፈቃድ በስልክ ተገኝቷል — በጽሑፍ ገና አልመጣም' },
          { en:'Did not know it needed Kidan',            am:'የኪዳን ፈቃድ እንደሚያስፈልገው አልታወቀም' }
        ], show:{f:'pay_big_unapproved', when:'pos'}},
      {id:'pay_kidan_state', en:'Payments sent to Kidan: has each been approved? (Write which ones in the box.)', am:'ለኪዳን የተላኩ ክፍያዎች፦ እያንዳንዱ ጸድቋል? (የትኞቹ እንደሆኑ በሳጥኑ ይጻፉ።)', t:'area',
        picks:[
          { en:'All approved by Kidan',             am:'ሁሉም በኪዳን ጸድቀዋል' },
          { en:'Some are still waiting for Kidan',  am:'አንዳንዶቹ የኪዳንን ፈቃድ እየጠበቁ ነው' },
          { en:'One was not approved',              am:'አንዱ አልተፈቀደም' }
        ], show:{f:'pay_kidan', when:'pos'}},
      {id:'zz_transfer', en:'How much was transferred to ZamZam Bank today?', am:'ዛሬ ወደ ዘምዘም ባንክ ስንት ብር ተላለፈ?', t:'money', quiet:1,
        auto:{sum:'tx_list.amount', when:[{col:'dir', is:'move'}, {col:'via2', is:'zz'}], orZero:1}},
      {id:'zz_count', en:'How many transfers to ZamZam was that?', am:'ወደ ዘምዘም ስንት ዝውውሮች ነበሩ?', t:'num', quiet:1,
        auto:{rows:'tx_list', when:[{col:'dir', is:'move'}, {col:'via2', is:'zz'}]}},
      {id:'zz_off', en:'How many transfers to ZamZam were not the approved amount?', am:'ወደ ዘምዘም ከጸደቀው መጠን የተለዩ ዝውውሮች ስንት ናቸው?', t:'num', quiet:1,
        auto:{rows:'tx_list', when:[{col:'dir', is:'move'}, {col:'via2', is:'zz'}, {col:'match', is:'no'}]}},
      /* the lists the register, the rulebook and the readers read, folded out
         of the rows under their old names and columns */
      {id:'cash_in_list', en:'Each cash receipt today', am:'የዛሬ እያንዳንዱ የጥሬ ገንዘብ ደረሰኝ', t:'table', quiet:1,
        auto:{fold:'tx_list', when:[{col:'dir', is:'in'}, {col:'via', is:'cash'}], keep:{from:'who', kind:'kin', amount:'amount', receipt:'ref'}},
        cols:[
          {id:'from', en:'From', am:'ከማን', t:'text'},
          {id:'kind', en:'For', am:'የምን', t:'text'},
          {id:'amount', en:'Amount', am:'መጠን', t:'money'},
          {id:'receipt', en:'Receipt no.', am:'የደረሰኝ ቁጥር', t:'text'}
        ]},
      {id:'adv_in_list', en:'Each advance received today', am:'ዛሬ የገባ እያንዳንዱ ቅድመ ክፍያ', t:'table', quiet:1,
        auto:{fold:'tx_list', when:[{col:'dir', is:'in'}, {col:'kin', is:'advance'}], keep:{cust:'who', code:'code', amount:'amount', file:'file', group:'group'}},
        cols:[
          {id:'cust', en:'Customer', am:'ደንበኛ', t:'text'},
          {id:'code', en:'Job code', am:'የሥራ ኮድ', t:'text'},
          {id:'amount', en:'Amount', am:'መጠን', t:'money'},
          {id:'file', en:'Job File opened', am:'ጆብ ፋይል ተከፍቷል', t:'text'},
          {id:'group', en:'WhatsApp group created', am:'ዋትስአፕ ግሩፕ ተከፍቷል', t:'text'}
        ]},
      {id:'final_in_list', en:'Each final payment received today', am:'ዛሬ የገባ እያንዳንዱ የመጨረሻ ክፍያ', t:'table', quiet:1,
        auto:{fold:'tx_list', when:[{col:'dir', is:'in'}, {col:'kin', is:'final'}], keep:{cust:'who', code:'code', amount:'amount', prod:'prod'}},
        cols:[
          {id:'cust', en:'Customer', am:'ደንበኛ', t:'text'},
          {id:'code', en:'Job code', am:'የሥራ ኮድ', t:'text'},
          {id:'amount', en:'Amount', am:'መጠን', t:'money'},
          {id:'prod', en:'Mahelet told production may start', am:'ምርት እንዲጀመር ለማህሌት ተነግሯል', t:'text'}
        ]},
      {id:'pay_list', en:'Each payment that went out today', am:'ዛሬ የወጣ እያንዳንዱ ክፍያ', t:'table', quiet:1,
        auto:{fold:'tx_list', when:{col:'dir', is:'out'}, keep:{to:'who', amount:'amount', kidan:'kidan'}, join:{'for':['kout', 'ref']}},
        cols:[
          {id:'to', en:'Paid to', am:'ተከፋይ', t:'text'},
          {id:'for', en:'For', am:'ለምን', t:'text'},
          {id:'amount', en:'Amount', am:'መጠን', t:'money'},
          {id:'kidan', en:'Kidan\'s approval (over 50,000)', am:'የኪዳን ፈቃድ (ከ50,000 በላይ)', t:'text'}
        ]},
      {id:'zz_list', en:'Each transfer to ZamZam Bank today', am:'ዛሬ ወደ ዘምዘም ባንክ የተላለፈ እያንዳንዱ', t:'table', quiet:1,
        auto:{fold:'tx_list', when:[{col:'dir', is:'move'}, {col:'via2', is:'zz'}], keep:{req:'req', sup:'sup', amount:'amount', match:'match'}},
        cols:[
          {id:'req', en:'Purchase request', am:'የግዥ ጥያቄ', t:'text'},
          {id:'sup', en:'Supplier', am:'አቅራቢ', t:'text'},
          {id:'amount', en:'Amount', am:'መጠን', t:'money'},
          {id:'match', en:'Same as the approved amount', am:'ከጸደቀው መጠን ጋር እኩል ነው', t:'text'}
        ]}
    ]},
    /* THE ONE LIST. Ten yes/no checks and two counts stood in sections of
       their own, each asked every day, and three more gates for money that
       only moves when a job reaches a stage. On a day when none of it
       happened that was fifteen taps before the first "why". */
    { en:'Anything else today?', am:'ዛሬ ሌላ የሆነ ነገር አለ?', fields:[
      {id:'fin_events', en:'What else happened with money, jobs or records today?', am:'ዛሬ በገንዘብ፣ በሥራዎች ወይም በመዝገቦች ሌላ ምን ሆነ?', t:'multi',
        none:{ en:'Nothing — a normal day', am:'ምንም — የተለመደ ቀን' },
        groups:[
          { v:'jobs', en:'Money for jobs',      am:'የሥራዎች ገንዘብ' },
          { v:'cash', en:'Cash',                am:'ጥሬ ገንዘብ' },
          { v:'bank', en:'Bank and ZamZam',     am:'ባንክና ዘምዘም' },
          { v:'asm',  en:'Assemblers',          am:'ገጣጣሚዎች' },
          { v:'rec',  en:'Board and documents', am:'ቦርድና ሰነዶች' }
        ],
        opts:[
          { v:'final_req',  g:'jobs', en:'A final payment request went to a customer',  am:'ለደንበኛ የመጨረሻ ክፍያ ጥያቄ ተላከ' },
          { v:'asm_res',    g:'jobs', en:'Money was set aside for an installation',     am:'ለተከላ ገንዘብ ተያዘ' },
          { v:'asm_paid',   g:'jobs', en:'An assembler was paid',                       am:'ለገጣጣሚ ተከፈለ' },
          { v:'not_banked', g:'cash', en:'Some of today\'s cash was not banked',         am:'ከዛሬው ጥሬ ገንዘብ ባንክ ያልገባ አለ' },
          { v:'cashbook',   g:'cash', en:'Something is not in the cashbook yet',        am:'በገንዘብ መዝገቡ ገና ያልገባ ነገር አለ' },
          { v:'disc',       g:'cash', en:'A cash discrepancy was found',                am:'የገንዘብ ልዩነት ተገኘ' },
          { v:'not_checked',g:'bank', en:'The bank was not checked against the cashbook this morning', am:'ዛሬ ጠዋት ባንኩ ከገንዘብ መዝገቡ ጋር አልተረጋገጠም' },
          { v:'chq_early',  g:'bank', en:'A cheque was written before its funds were confirmed to Getachew', am:'ገንዘቡ ለጌታቸው ሳይረጋገጥ ቼክ ተጻፈ' },
          { v:'zz_unreg',   g:'bank', en:'A ZamZam transfer is not in the register yet', am:'በዘምዘም መዝገብ ገና ያልገባ ዝውውር አለ' },
          { v:'zz_disc',    g:'bank', en:'A ZamZam payment did not match',              am:'የዘምዘም ክፍያ ልዩነት ተገኘ' },
          { v:'asm_unres',  g:'asm',  en:'A job is being installed without its assembler money set aside', am:'የገጣጣሚ ገንዘብ ሳይያዝለት እየተተከለ ያለ ሥራ አለ' },
          { v:'dispute',    g:'asm',  en:'An assembler payment dispute is open',        am:'ያልተፈታ የገጣጣሚ ክፍያ ክርክር አለ' },
          { v:'board_off',  g:'rec',  en:'The job board does not match the Job Files',  am:'የሥራ መከታተያ ቦርዱ ከጆብ ፋይሎቹ ጋር አይመሳሰልም' },
          { v:'doc_missing',g:'rec',  en:'A supplier invoice or delivery note is still missing', am:'የአቅራቢ ደረሰኝ ወይም የዕቃ መረከቢያ ወረቀት ገና ጎድሏል' }
        ]}
    ]},
    { en:'Cash checks', am:'የጥሬ ገንዘብ ፍተሻ', fields:[
      /* the rulebook fines a "no" every day (betty-cash-not-banked) and the
         Group CFO names it — worked out from the list, never left blank */
      {id:'cash_banked', en:'Was all of today\'s cash banked today?', am:'የዛሬው ጥሬ ገንዘብ ሁሉ ዛሬ ባንክ ገብቷል?', t:'yesno', quiet:1, auto:{picked:'fin_events', v:'not_banked', flip:1}},
      {id:'cash_banked_why', en:'Not all of today\'s cash was banked. Why, and where is it tonight? (Write how much and who holds it in the box.)', am:'ከዛሬው ጥሬ ገንዘብ ሁሉም ባንክ አልገባም። ለምን? ዛሬ ማታ የት ነው ያለው? (ምን ያህል እንደሆነና ማን እንደያዘው በሳጥኑ ይጻፉ።)', t:'area',
        picks:[
          { en:'It came in after the bank closed',      am:'ባንክ ከተዘጋ በኋላ ነው የገባው' },
          { en:'The bank was closed today',             am:'ዛሬ ባንክ ዝግ ነበር' },
          { en:'Nobody could go to the bank',           am:'ወደ ባንክ የሚሄድ ሰው አልነበረም' },
          { en:'Kept for a payment due tomorrow',       am:'ነገ ለሚከፈል ክፍያ ተቀምጧል' },
          { en:'Locked in the office safe',             am:'በቢሮው ካዝና ተቆልፎበታል' },
          { en:'Goes to the bank first thing tomorrow', am:'ነገ ጠዋት መጀመሪያ ባንክ ይገባል' }
        ], show:{f:'cash_banked', when:'no'}},
      {id:'cashbook', en:'Was every cash movement written in the cashbook today?', am:'ዛሬ የገንዘብ እንቅስቃሴ ሁሉ በገንዘብ መዝገቡ ተጽፏል?', t:'yesno', quiet:1, auto:{picked:'fin_events', v:'cashbook', flip:1}},
      {id:'cashbook_why', en:'Something is not in the cashbook yet. Why, and when will it be? (Write what in the box.)', am:'በገንዘብ መዝገቡ ገና ያልገባ ነገር አለ። ለምን? መቼ ይገባል? (ምን እንደሆነ በሳጥኑ ይጻፉ።)', t:'area',
        picks:[
          { en:'A receipt has not come yet',            am:'ደረሰኝ ገና አልመጣም' },
          { en:'Waiting for the bank statement',        am:'የባንክ መግለጫ እየተጠበቀ ነው' },
          { en:'No time today',                         am:'ዛሬ ጊዜ አልነበረም' },
          { en:'Seble is writing it in',                am:'ሰብለ እየመዘገበችው ነው' },
          { en:'Will be written in tomorrow morning',   am:'ነገ ጠዋት ይመዘገባል' }
        ], show:{f:'cashbook', when:'no'}},
      {id:'bank_verified', en:'Was the bank balance checked against the cashbook this morning?', am:'የባንክ ቀሪ ዛሬ ጠዋት ከገንዘብ መዝገቡ ጋር ተረጋግጧል?', t:'yesno', quiet:1, auto:{picked:'fin_events', v:'not_checked', flip:1}},
      {id:'bank_verified_why', en:'The bank was not checked against the cashbook this morning. Why, and when will it be?', am:'ዛሬ ጠዋት ባንኩ ከገንዘብ መዝገቡ ጋር አልተረጋገጠም። ለምን? መቼ ይረጋገጣል?', t:'area',
        picks:[
          { en:'No bank statement yet',                 am:'የባንክ መግለጫ ገና አልመጣም' },
          { en:'The bank system was down',              am:'የባንኩ ሲስተም አይሠራም ነበር' },
          { en:'No time this morning',                  am:'ዛሬ ጠዋት ጊዜ አልነበረም' },
          { en:'Checked later in the day',              am:'ቀን ላይ ተረጋግጧል' },
          { en:'Will be checked tomorrow morning',      am:'ነገ ጠዋት ይረጋገጣል' }
        ], show:{f:'bank_verified', when:'no'}},
      /* the monthly 10,000 Birr bonus needs this "no" every day, the morning
         alert and the Chairman's brief fire on a "yes" */
      {id:'discrepancy', en:'Was any cash discrepancy found today?', am:'ዛሬ የገንዘብ ልዩነት ተገኝቷል?', t:'yesno', quiet:1, auto:{picked:'fin_events', v:'disc'}},
      {id:'discrepancy_what', en:'What was the discrepancy, and what was done? (Write how much, where, and who held the money in the box.)', am:'ልዩነቱ ምንድን ነው? ምን ተደረገ? (ምን ያህል፣ የትና ገንዘቡን ማን እንደያዘው በሳጥኑ ይጻፉ።)', t:'area',
        picks:[
          { en:'Cash in the safe was short',            am:'በካዝናው ያለው ገንዘብ ጎደለ' },
          { en:'Cash in the safe was over',             am:'በካዝናው ያለው ገንዘብ ተረፈ' },
          { en:'The bank and the cashbook do not agree', am:'ባንኩና የገንዘብ መዝገቡ አይስማሙም' },
          { en:'A receipt is missing',                  am:'ደረሰኝ ጠፍቷል' },
          { en:'A counting mistake — found and put right', am:'የቆጠራ ስህተት ነበር — ተገኝቶ ተስተካክሏል' },
          { en:'Not explained yet',                     am:'ምክንያቱ ገና አልታወቀም' }
        ], show:{f:'discrepancy', when:'yes'}},
      {id:'discrepancy_told', en:'Were the Chairman and Kidan told the same day?', am:'በዕለቱ ለሊቀመንበሩና ለኪዳን ተነግሯል?', t:'yesno', yes:{en:'Both told today', am:'ሁለቱም ዛሬ ተነግሯቸዋል'}, no:{en:'Not told yet', am:'ገና አልተነገራቸውም'}, show:{f:'discrepancy', when:'yes'}}
    ]},
    { en:'ZamZam checks', am:'የዘምዘም ፍተሻ', fields:[
      /* fined –1,000 on a "no" (betty-zz-no-confirm), and in the Chairman's
         brief as a rule broken */
      {id:'zz_confirmed', en:'Was every cheque written today covered by funds confirmed to Getachew first?', am:'ዛሬ የተጻፈ እያንዳንዱ ቼክ ገንዘቡ ለጌታቸው ቀድሞ ተረጋግጦለት ነበር?', t:'yesno', quiet:1, auto:{picked:'fin_events', v:'chq_early', flip:1}},
      {id:'zz_confirmed_why', en:'A cheque went out before its funds were confirmed. Why? (Write which cheque and how much in the box.)', am:'ገንዘቡ ሳይረጋገጥ ቼክ ወጣ። ለምን? (የትኛው ቼክ እንደሆነና ስንት ብር በሳጥኑ ይጻፉ።)', t:'area',
        picks:[
          { en:'Getachew wrote it before asking',       am:'ጌታቸው ሳይጠይቅ ጻፈው' },
          { en:'Urgent — the supplier would not wait',  am:'አስቸኳይ ነበር — አቅራቢው አልጠበቀም' },
          { en:'Confirmed by phone, not in writing',    am:'በስልክ ተረጋግጧል እንጂ በጽሑፍ አይደለም' },
          { en:'The money reached ZamZam late',         am:'ገንዘቡ ዘምዘም የደረሰው ዘግይቶ ነው' },
          { en:'A mistake',                             am:'ስህተት ነበር' }
        ], show:{f:'zz_confirmed', when:'no'}},
      {id:'zz_register', en:'Is every transfer recorded in the ZamZam Payment Register?', am:'እያንዳንዱ ዝውውር በዘምዘም የክፍያ መዝገብ ተመዝግቧል?', t:'yesno', quiet:1, auto:{picked:'fin_events', v:'zz_unreg', flip:1}},
      {id:'zz_register_why', en:'A transfer is not in the ZamZam register yet. Why, and when will it go in? (Write which in the box.)', am:'በዘምዘም መዝገብ ገና ያልገባ ዝውውር አለ። ለምን? መቼ ይገባል? (የትኛው እንደሆነ በሳጥኑ ይጻፉ።)', t:'area',
        picks:[
          { en:'Waiting for the bank slip',             am:'የባንክ ደረሰኙ እየተጠበቀ ነው' },
          { en:'No time today',                         am:'ዛሬ ጊዜ አልነበረም' },
          { en:'Seble is entering it',                  am:'ሰብለ እያስገባችው ነው' },
          { en:'Will go in tomorrow',                   am:'ነገ ይገባል' }
        ], show:{f:'zz_register', when:'no'}},
      {id:'zz_disc', en:'How many ZamZam discrepancies were found today?', am:'ዛሬ በዘምዘም ስንት ልዩነቶች ተገኙ?', t:'num', zero:1,
        show:{f:'fin_events', when:'has', v:'zz_disc'},
        tgt:{op:'lte', v:0, en:'Report to Kidan same day', am:'በዕለቱ ለኪዳን ማሳወቅ'}},
      {id:'zz_disc_what', en:'What did not match, and was Kidan told today? (Write how much and who handled it in the box.)', am:'ምኑ ነው ያልተገናኘው? ዛሬ ለኪዳን ተነግሯል? (ምን ያህል እንደሆነና ማን እንደያዘው በሳጥኑ ይጻፉ።)', t:'area',
        picks:[
          { en:'A cheque for more than the approved amount', am:'ከጸደቀው መጠን በላይ የተጻፈ ቼክ' },
          { en:'A cheque for less than the approved amount', am:'ከጸደቀው መጠን በታች የተጻፈ ቼክ' },
          { en:'The wrong supplier on a cheque',        am:'በቼኩ ላይ የተሳሳተ አቅራቢ' },
          { en:'A bank charge not recorded',            am:'ያልተመዘገበ የባንክ ክፍያ' },
          { en:'Kidan was told today',                  am:'ዛሬ ለኪዳን ተነግሯል' },
          { en:'Kidan not told yet',                    am:'ለኪዳን ገና አልተነገረም' }
        ], show:{f:'zz_disc', when:'pos'}}
    ]},
    /* The Job Files opened, the groups created and the production go-aheads
       were counted here and ticked again in the payment rows of "Money from
       customers", which is where they actually happen (the Chairman, 9 Oct
       2026). They are counted from those rows now, and this section keeps
       what is its own: the final payment requests that went out — opened
       from the list since 11 Oct, as a request only goes out when a job's
       materials arrive. */
    { en:'Final payment requests', am:'የመጨረሻ ክፍያ ጥያቄዎች', fields:[
      {id:'final_req_any', en:'Did any final payment request go to a customer today?', am:'ዛሬ ለደንበኛ የተላከ የመጨረሻ ክፍያ ጥያቄ አለ?', t:'yesno', quiet:1, auto:{picked:'fin_events', v:'final_req'}},
      {id:'final_req_list', en:'Which customers, and for how much?', am:'ለየትኞቹ ደንበኞች? ስንት ብር?', t:'table', addEn:'Add a request', addAm:'ጥያቄ ጨምር',
        show:{f:'final_req_any', when:'yes'}, cols:[
          {id:'cust', en:'Customer', am:'ደንበኛ', t:'text'},
          {id:'code', en:'Job code', am:'የሥራ ኮድ', t:'text'},
          {id:'amount', en:'Amount asked', am:'የተጠየቀው መጠን', t:'money'}
        ]},
      {id:'final_req', en:'How many final payment requests went to customers today?', am:'ዛሬ ለደንበኞች ስንት የመጨረሻ ክፍያ ጥያቄዎች ተላኩ?', t:'num',
        auto:{rows:'final_req_list'}, sumEn:'requests out', sumAm:'ጥያቄዎች ተልከዋል'},
      {id:'final_req_value', en:'For how much in total?', am:'በጠቅላላው ስንት ብር?', t:'money',
        auto:{sum:'final_req_list.amount'}, sumEn:'asked for', sumAm:'ተጠይቋል'}
    ]},
    { en:'Assembler payments', am:'የገጣጣሚዎች ክፍያ', fields:[
      {id:'asm_res_any', en:'Was money reserved for any assembler payment today?', am:'ዛሬ ለገጣጣሚ ክፍያ የተያዘ ገንዘብ አለ?', t:'yesno', quiet:1, auto:{picked:'fin_events', v:'asm_res'}},
      {id:'asm_reserved_list', en:'For which jobs?', am:'ለየትኞቹ ሥራዎች?', t:'table', addEn:'Add job', addAm:'ሥራ ጨምር',
        show:{f:'asm_res_any', when:'yes'},
        cols:[
          {id:'code', en:'Job code', am:'የሥራ ኮድ', t:'text'},
          {id:'amount', en:'Reserved', am:'የተያዘ', t:'money'},
          {id:'slip', en:'Slip given to Elyas', am:'ወረቀቱ ለኤልያስ ተሰጥቷል', t:'yesno', yes:{en:'Given to him', am:'ተሰጥቶታል'}, no:{en:'Not given yet', am:'ገና አልተሰጠውም'}}
        ]},
      {id:'asm_reserved', en:'How much was reserved today for assembler payments?', am:'ዛሬ ለተከላ ሠራተኞች ክፍያ ስንት ብር ተያዘ?', t:'money',
        auto:{sum:'asm_reserved_list.amount'}, sumEn:'reserved', sumAm:'ተይዟል'},
      {id:'asm_slips', en:'How many Payment Confirmation Slips were given out?', am:'ስንት የክፍያ ማረጋገጫ ወረቀቶች ተሰጡ?', t:'num',
        auto:{rows:'asm_reserved_list', when:{col:'slip', is:'yes'}}, sumEn:'slips to Elyas', sumAm:'ወረቀቶች ለኤልያስ'},
      {id:'asm_unreserved', en:'Is any job being installed without its assembler payment reserved?', am:'የገጣጣሚዎች ክፍያ ሳይያዝለት እየተተከለ ያለ ሥራ አለ?', t:'yesno', quiet:1, auto:{picked:'fin_events', v:'asm_unres'}},
      {id:'asm_unreserved_what', en:'A job is being installed without its assembler money set aside. Why, and when will it be? (Write the job code in the box.)', am:'የገጣጣሚ ገንዘብ ሳይያዝለት እየተተከለ ያለ ሥራ አለ። ለምን? መቼ ይያዛል? (የሥራ ኮዱን በሳጥኑ ይጻፉ።)', t:'area',
        picks:[
          { en:'The installation date was not passed on', am:'የተከላው ቀን አልተነገረም' },
          { en:'Not enough money in the bank',          am:'ባንክ ውስጥ በቂ ገንዘብ የለም' },
          { en:'Waiting for the final payment',         am:'የመጨረሻ ክፍያ እየተጠበቀ ነው' },
          { en:'Forgot',                                am:'ተረስቷል' },
          { en:'Will be set aside tomorrow',            am:'ነገ ይያዛል' }
        ], show:{f:'asm_unreserved', when:'yes'}},
      {id:'asm_rel_any', en:'Was any assembler payment released today?', am:'ዛሬ የተለቀቀ የገጣጣሚ ክፍያ አለ?', t:'yesno', quiet:1, auto:{picked:'fin_events', v:'asm_paid'}},
      {id:'asm_released_list', en:'Each payment released today', am:'ዛሬ የተለቀቀ እያንዳንዱ ክፍያ', t:'table', addEn:'Add a payment', addAm:'ክፍያ ጨምር',
        show:{f:'asm_rel_any', when:'yes'},
        cols:[
          {id:'who', en:'Assembler', am:'ገጣጣሚ', t:'text'},
          {id:'code', en:'Job code', am:'የሥራ ኮድ', t:'text'},
          {id:'amount', en:'Amount', am:'መጠን', t:'money'},
          {id:'days', en:'Working days after acceptance', am:'ደንበኛው ከተቀበለ በኋላ የሥራ ቀናት', t:'num'}
        ]},
      {id:'asm_released', en:'How many assembler payments were released today?', am:'ዛሬ ስንት የገጣጣሚዎች ክፍያዎች ተለቀቁ?', t:'num',
        auto:{rows:'asm_released_list'}, sumEn:'payments released', sumAm:'ክፍያዎች ተለቀዋል'},
      {id:'asm_rel_value', en:'How much was released?', am:'ስንት ብር ተለቀቀ?', t:'money',
        auto:{sum:'asm_released_list.amount'}, sumEn:'released', sumAm:'ተለቋል'},
      {id:'asm_rel_late', en:'How many were released more than 3 working days after acceptance?', am:'ደንበኛው ከተቀበለ ከ3 የሥራ ቀናት በኋላ የተለቀቁ ስንት ናቸው?', t:'num',
        auto:{rows:'asm_released_list', when:{col:'days', gte:4}}, sumEn:'later than 3 days', sumAm:'ከ3 ቀን በኋላ'},
      {id:'asm_disputes', en:'How many assembler payment disputes are open?', am:'ስንት የገጣጣሚ ክፍያ ክርክሮች አልተፈቱም?', t:'num', zero:1,
        show:{f:'fin_events', when:'has', v:'dispute'},
        tgt:{op:'lte', v:0, en:'Resolve within 48 hours', am:'በ48 ሰዓት ውስጥ መፍታት'}},
      {id:'asm_disputes_what', en:'What is each dispute about, and when will it be settled? (Write who, and since when, in the box.)', am:'እያንዳንዱ ክርክር ስለምን ነው? መቼ ይፈታል? (የማን እንደሆነና ከመቼ ጀምሮ በሳጥኑ ይጻፉ።)', t:'area',
        picks:[
          { en:'The amount — m² or rate',               am:'መጠኑ — ካሬ ሜትር ወይም ዋጋ' },
          { en:'Paid late',                             am:'ዘግይቶ ተከፈለ' },
          { en:'The customer has not accepted the work', am:'ደንበኛው ሥራውን ገና አልተቀበለም' },
          { en:'Rework or damage taken off',            am:'ለተመለሰ ሥራ ወይም ለጉዳት ተቀንሷል' },
          { en:'Will be settled within 48 hours',       am:'በ48 ሰዓት ውስጥ ይፈታል' },
          { en:'Needs Elyas',                           am:'ኤልያስ ያስፈልጋል' },
          { en:'Needs the Chairman',                    am:'ሊቀመንበሩ ያስፈልጋሉ' }
        ], show:{f:'asm_disputes', when:'pos'}}
    ]},
    { en:'Job Tracking Board', am:'የሥራ መከታተያ ቦርድ', fields:[
      /* nothing reads the count; it stays for the days the board is in doubt */
      {id:'board_moved', en:'How many job cards did you move today? (If you counted.)', am:'ዛሬ ስንት የሥራ ካርዶች አንቀሳቀሱ? (ከቆጠሩ።)', t:'num', opt:1},
      /* the 2,000 Birr board bonus needs this "yes" on every day of the month */
      {id:'board_match', en:'Does the board match the physical Job Files tonight?', am:'ዛሬ ማታ ቦርዱ ከጆብ ፋይሎቹ ጋር ይመሳሰላል?', t:'yesno', quiet:1, auto:{picked:'fin_events', v:'board_off', flip:1}},
      /* only asked when the board does not match — it was asked every day,
         and on a day it matched the answer was always nought */
      {id:'board_mismatch', en:'How many cards did not match today?', am:'ዛሬ ስንት ካርዶች አልተመሳሰሉም?', t:'num',
        show:{f:'board_match', when:'no'}},
      {id:'board_mismatch_what', en:'What did not match, who moved the cards, and was the Chairman told today? (Write the job codes in the box.)', am:'ምኑ አልተመሳሰለም? ካርዶቹን ማን አንቀሳቀሳቸው? ዛሬ ለሊቀመንበሩ ተነግሯል? (የሥራ ኮዶቹን በሳጥኑ ይጻፉ።)', t:'area',
        picks:[
          { en:'Card ahead of the Job File',            am:'ካርዱ ከጆብ ፋይሉ ቀድሟል' },
          { en:'Card behind the Job File',              am:'ካርዱ ከጆብ ፋይሉ ወደኋላ ቀርቷል' },
          { en:'A card or a file is missing',           am:'ካርድ ወይም ፋይል ጠፍቷል' },
          { en:'Moved by Seble',                        am:'ሰብለ አንቀሳቅሳዋለች' },
          { en:'Moved by someone else',                 am:'ሌላ ሰው አንቀሳቅሶታል' },
          { en:'The Chairman was told today',           am:'ዛሬ ለሊቀመንበሩ ተነግሯል' },
          { en:'Not told yet',                          am:'ገና አልተነገረም' }
        ], show:{f:'board_mismatch', when:'pos'}}
    ]},
    { en:'Documents', am:'ሰነዶች', fields:[
      /* nothing reads these two counts; the missing ones below are what the
         fines are about (betty-missing-invoice-dn) */
      {id:'doc_inv', en:'How many supplier invoices did you collect today? (If you counted.)', am:'ዛሬ ስንት የአቅራቢ ደረሰኞች ሰበሰቡ? (ከቆጠሩ።)', t:'num', opt:1},
      {id:'doc_dn', en:'How many delivery notes did you collect today? (If you counted.)', am:'ዛሬ ስንት የዕቃ መረከቢያ ወረቀቶች ሰበሰቡ? (ከቆጠሩ።)', t:'num', opt:1},
      {id:'doc_any', en:'Is any document still missing?', am:'ገና የጎደለ ሰነድ አለ?', t:'yesno', quiet:1, auto:{picked:'fin_events', v:'doc_missing'}},
      {id:'doc_missing_list', en:'Which ones?', am:'የትኞቹ?', t:'table', addEn:'Add a document', addAm:'ሰነድ ጨምር',
        show:{f:'doc_any', when:'yes'},
        cols:[
          {id:'doc', en:'Document', am:'ሰነድ', t:'text'},
          {id:'from', en:'From (supplier or staff)', am:'ከማን (አቅራቢ ወይም ሠራተኛ)', t:'text'},
          {id:'since', en:'Missing since', am:'ከመቼ ጀምሮ', t:'text'},
          {id:'chase', en:'Who is chasing it', am:'የሚከታተለው', t:'text', picks:[{ en:'Getachew', am:'ጌታቸው' }, { en:'Selam', am:'ሰላም' }, { en:'Alemaya', am:'አለማያ' }]}
        ]},
      {id:'doc_missing', en:'How many documents are still missing?', am:'እስካሁን ስንት ሰነዶች ጎድለዋል?', t:'num',
        auto:{rows:'doc_missing_list'}, sumEn:'still missing', sumAm:'ገና ጎድለዋል'}
    ]},
    { en:'Problems and help', am:'ችግርና እርዳታ', fields:[
      {id:'problem', en:'What was the biggest problem today?', am:'የዛሬው ትልቁ ችግር ምን ነበር?', t:'area', opt:1,
        picks:[
          { en:'No big problem today',                  am:'ዛሬ ትልቅ ችግር አልነበረም' },
          { en:'A customer has not paid on time',       am:'ደንበኛ በጊዜው አልከፈለም' },
          { en:'The bank is close to 6 million',        am:'የባንክ ቀሪው ወደ 6 ሚሊዮን ተጠግቷል' },
          { en:'A supplier wants paying before the money is in', am:'ገንዘቡ ሳይገባ አቅራቢ ክፍያ ይፈልጋል' },
          { en:'Invoices or delivery notes came late',  am:'ደረሰኞች ወይም የመረከቢያ ወረቀቶች ዘገዩ' },
          { en:'Cash came after the bank closed',       am:'ጥሬ ገንዘብ ባንክ ከተዘጋ በኋላ መጣ' },
          { en:'The bank system was down',              am:'የባንኩ ሲስተም አይሠራም ነበር' },
          { en:'Waiting for Kidan\'s approval',         am:'የኪዳን ፈቃድ እየተጠበቀ ነው' }
        ]},
      {id:'need_help', en:'What do you need, and from whom?', am:'ምን ያስፈልግዎታል? ከማን?', t:'area', opt:1,
        picks:[
          { en:'Nothing needed',                        am:'ምንም አያስፈልግም', nil:1 },
          { en:'Sales to chase a customer payment',     am:'ሽያጭ የደንበኛ ክፍያ እንዲከታተል' },
          { en:'Invoices and delivery notes from Getachew', am:'ከጌታቸው ደረሰኞችና የመረከቢያ ወረቀቶች' },
          { en:'Kidan\'s approval for a payment',       am:'ለክፍያ የኪዳን ፈቃድ' },
          { en:'Mahelet to confirm where a job stands', am:'ማህሌት የሥራው ደረጃ የት እንደደረሰ እንድታረጋግጥ' },
          { en:'Elyas to confirm a customer accepted the work', am:'ኤልያስ ደንበኛው ሥራውን መቀበሉን እንዲያረጋግጥ' },
          { en:'Alemaya to confirm a delivery',        am:'አለማያ ዕቃ መድረሱን ማረጋገጥ' },
          { en:'A decision from the Chairman',          am:'የሊቀመንበሩ ውሳኔ' }
        ]},
      {id:'need_chair', en:'Do you need a decision from the Chairman?', am:'የሊቀመንበሩ ውሳኔ ያስፈልግዎታል?', t:'yesno', yes:{en:'I need a decision', am:'ውሳኔ ያስፈልገኛል'}, no:{en:'No decision needed', am:'ውሳኔ አያስፈልገኝም'}},
      {id:'need_chair_what', en:'What should the Chairman decide, and by when? (Write the options in the box.)', am:'ሊቀመንበሩ ምን መወሰን አለባቸው? እስከ መቼ? (አማራጮቹን በሳጥኑ ይጻፉ።)', t:'area',
        picks:[
          { en:'Approve a payment',                     am:'ክፍያ ማጽደቅ' },
          { en:'Which bills to pay first',              am:'የትኞቹ ሂሳቦች ቀድመው እንደሚከፈሉ' },
          { en:'Hold payments until the bank recovers', am:'ባንኩ እስኪመለስ ክፍያዎችን ማቆም' },
          { en:'A customer who has not paid',           am:'ያልከፈለ ደንበኛ' },
          { en:'A supplier asking to be paid early',    am:'ቀድሞ እንዲከፈለው የሚጠይቅ አቅራቢ' },
          { en:'Needed today',                          am:'ዛሬ ያስፈልጋል' },
          { en:'Needed this week',                      am:'በዚህ ሳምንት ያስፈልጋል' }
        ], show:{f:'need_chair', when:'yes'}}
    ]},
    { en:'Tomorrow', am:'ነገ', fields:[
      {id:'tomorrow', en:'What are your top 3 things for tomorrow?', am:'ነገ የሚሠሩ ዋና ሦስት ሥራዎች ምንድን ናቸው?', t:'area',
        picks:[
          { en:'Bank the cash first thing',             am:'ጠዋት መጀመሪያ ጥሬ ገንዘቡን ባንክ ማስገባት' },
          { en:'Chase final payments',                  am:'የመጨረሻ ክፍያዎችን መከታተል' },
          { en:'Send final payment requests',           am:'የመጨረሻ ክፍያ ጥያቄዎችን መላክ' },
          { en:'Pay suppliers falling due',             am:'ጊዜያቸው የደረሰ አቅራቢዎችን መክፈል' },
          { en:'Move money to ZamZam for approved requests', am:'ለጸደቁ ጥያቄዎች ገንዘብ ወደ ዘምዘም ማስተላለፍ' },
          { en:'Set aside or release assembler money',  am:'የገጣጣሚ ገንዘብ መያዝ ወይም መልቀቅ' },
          { en:'Check the bank against the cashbook',   am:'ባንኩን ከገንዘብ መዝገቡ ጋር ማረጋገጥ' },
          { en:'Update the job board',                  am:'የሥራ መከታተያ ቦርዱን ማስተካከል' },
          { en:'Collect missing documents',             am:'የጎደሉ ሰነዶችን መሰብሰብ' }
        ]}
    ]}
  ]
},

/* =========================== GETACHEW — DAILY =========================== */
{
  id:'getachew-daily', person:'getachew', cadence:'daily', dueTime:'17:30',
  en:'Daily Purchasing Report', am:'ዕለታዊ የግዥ ሪፖርት',
  toEn:'Chairman, copied to Mahelet and Selam', toAm:'ሊቀመንበር፣ ግልባጭ ለማህሌትና ለሰላም',
  dueEn:'5:30 PM every working day', dueAm:'በየሥራ ቀኑ ከቀኑ 11፡30 (5:30 PM)',
  penEn:'Late –200 Birr · Missing –500 Birr', penAm:'ዘግይቶ –200 ብር · ካልተላከ –500 ብር',
  derived:1,
  sections:[
    /* REBUILT 11 Oct 2026 (the Chairman: "they are struggling so much with
       the questions"). Getachew's first three reports left 22 of 23, 12 of
       28 and 15 of 29 questions empty. He filled the purchase requests and
       the late deliveries and tapped the yes/no gates; every "why" box, the
       price list and the supplier questions stayed empty. Worse, on 9 and 10
       Oct he answered "no" to "did Selam confirm the funds before every
       cheque?" on days he wrote no cheque at all — the rulebook reads that
       "no" as a 5,000 Birr fine. 23 questions stood before any follow-up
       opened. Now a normal day is the requests, the orders, the cheques,
       what we owe, the documents to Selam, one tap on the list, and
       tomorrow. Everything that goes wrong — a late supplier, a rejection, a
       price that moved, a cheque written before the money was confirmed — is
       one tap on the list in "Anything else today?", and only then are its
       questions asked, right under the list. Every answer key is the one it
       always was; the yes/no answers the rulebook reads are worked out from
       the list ({picked:…}, quiet:1). */
    /* THE JOBS HE NAMED BEFORE (the Chairman, 14 Oct 2026: "ask him, did he
       finish purchasing the previous jobs he mentioned?"). Every job code in
       his earlier reports — a request, an order, a late delivery, a
       rejection, what he said he would buy tomorrow — comes back here as a
       row of its own, already written, and he taps where its buying stands.
       A job leaves the list once he says everything is bought (or that the
       job is on hold); written again in a later report, it comes back. The
       section is not on the screen when nothing is waiting. */
    { en:'Jobs from your earlier reports', am:'ባለፉት ሪፖርቶችዎ የጠቀሷቸው ሥራዎች', fields:[
      /* `askFrom`: not asked at all on Thu 15 Oct 2026 (the user: "for today
         don't ask Getachew — he still cannot send"); back from the 16th */
      {id:'fu_jobs', en:'Have you finished buying for each job you named before?', am:'ከዚህ በፊት ለጠቀሷቸው ሥራዎች ግዥውን ጨርሰዋል?', t:'table', askFrom:'2026-10-16',
        carry:{from:['pr_list.code', 'ord_list.code', 'sup_delay_list.code', 'del_rej_list.code', 'tomorrow', 'mat_plan.code'],
               close:{col:'buy', in:['done', 'hold']}, days:30},
        cols:[
          {id:'code', en:'Job code', am:'የሥራ ኮድ', t:'text'},
          {id:'buy', en:'Finished buying?', am:'ግዥው ተጠናቋል?', t:'choice', must:1, opts:[
            {v:'done',  en:'Yes — everything is bought',            am:'አዎ — ሁሉም ተገዝቷል'},
            {v:'part',  en:'Part bought — the rest still to buy',    am:'ከፊሉ ተገዝቷል — ቀሪው ገና አልተገዛም'},
            {v:'selam', en:'Waiting for Selam — approval or money', am:'ሰላምን እየጠበቅሁ ነው — ማጽደቅ ወይም ገንዘብ'},
            {v:'sup',   en:'Ordered — waiting for the supplier',     am:'ታዝዟል — አቅራቢውን እየጠበቅሁ ነው'},
            {v:'hold',  en:'Nothing to buy now — the job is on hold', am:'አሁን የሚገዛ የለም — ሥራው ቆሟል'}
          ]},
          {id:'left', en:'What is still to buy?', am:'ገና ያልተገዛው ምንድነው?', t:'choice', opts:MATERIAL_OPTS,
            ifCol:'buy', ifNot:['done', 'hold']},
          {id:'when', en:'When will it all be bought?', am:'ሁሉም መቼ ይገዛል?', t:'date',
            ifCol:'buy', ifNot:['done', 'hold']},
          /* what the job's material came to, once it is all bought: the
             Chairman's net on the job (apps-script/JobMoney.js) */
          /* `mustFrom`: not required on Thu 15 Oct 2026 (the user: "for today
             don't ask Getachew the amount — that is why he can't send") */
          {id:'cost', en:'What did all its material cost, in Birr?', am:'የሥራው ዕቃ በሙሉ ስንት ብር ወጣ?', t:'money', must:1, mustFrom:'2026-10-16',
            ifCol:'buy', ifIn:['done']}
        ]}
    ]},
    /* THE MONEY ON EACH JOB (the Chairman, 14 Oct 2026: "we have to know how
       much Getachew is going to buy for that job, all of it"). A job on
       Mahelet's 15-day plan, or made this week, with no material figure yet
       is asked here, once — six at a time, soonest first, from the script's
       list (apps-script/JobMoney.js, /jobask/getachew). From the next day it
       is on his "Jobs from your earlier reports" list, until everything is
       bought and he says what it all cost. */
    { en:'Material cost for jobs on the plan', am:'በዕቅዱ ላይ ላሉ ሥራዎች የዕቃ ወጪ', fields:[
      {id:'mat_plan', en:'How much will all the material for each of these jobs cost?', am:'የእያንዳንዱ ሥራ ዕቃ በሙሉ ስንት ብር ያወጣል?', t:'table', askFrom:'2026-10-16',
        carry:{ask:'material', close:{col:'amount'}},
        cols:[
          {id:'code', en:'Job code', am:'የሥራ ኮድ', t:'text'},
          {id:'amount', en:'All its material, in Birr (your best figure)', am:'የሥራው ዕቃ በሙሉ በብር (የሚጠብቁት ዋጋ)', t:'money', must:1, mustFrom:'2026-10-16'}
        ]}
    ]},
    { en:'Purchase requests', am:'የግዥ ጥያቄዎች', fields:[
      /* Four counts and a two-box question stood around this list —
         prepared, sent to Selam, approved, returned, and how many carried
         three quotes. Every one of them is a column of the row now (the
         Chairman, 9 Oct 2026), and the row says which job and which
         material, which none of the counts could. */
      {id:'pr_any', en:'Did you prepare any purchase request today?', am:'ዛሬ ያዘጋጁት የግዥ ጥያቄ አለ?', t:'yesno', yes:{en:'I prepared requests', am:'የግዥ ጥያቄ አዘጋጅቻለሁ'}, no:{en:'None today', am:'ዛሬ አላዘጋጀሁም'}},
      {id:'pr_list', en:'Each request prepared today', am:'ዛሬ የተዘጋጀ እያንዳንዱ ጥያቄ', t:'table', addEn:'Add a request', addAm:'ጥያቄ ጨምር',
        show:{f:'pr_any', when:'yes'},
        cols:[
          /* what it is for: only a request for a customer's job has a job
             code to give, and only that one is fined without it (the user,
             15 Oct 2026: "he may buy office accessories and other things") */
          {id:'for', en:'What is it for?', am:'ለምንድነው?', t:'choice', must:1, opts:[
            {v:'job',     en:'A customer’s job',                         am:'የደንበኛ ሥራ'},
            {v:'stock',   en:'Store stock — no job yet',                 am:'የመጋዘን ክምችት — ገና ለሥራ ያልተመደበ'},
            {v:'factory', en:'The factory — tools, parts, consumables',  am:'ፋብሪካ — መሣሪያ፣ መለዋወጫ፣ ፍጆታ'},
            {v:'office',  en:'The office — stationery and supplies',     am:'ቢሮ — የጽሕፈት መሣሪያና ዕቃ'},
            {v:'other',   en:'Other',                                    am:'ሌላ'}
          ]},
          {id:'code', en:'Job code', am:'የሥራ ኮድ', t:'text', ifCol:'for', ifIn:['job']},
          {id:'item', en:'Materials', am:'ዕቃዎች', t:'choice', opts:MATERIAL_OPTS},
          {id:'colour', en:'Colour code', am:'የቀለም ኮድ', t:'colour', of:'item'},
          /* "Amount" was read two ways: 104,403.48 one day, 20 (sheets) the
             next (12–13 Oct 2026). How many, then the Birr. */
          {id:'qty', en:'How many (sheets, pieces)', am:'ብዛት (ሉህ፣ ቁራጭ)', t:'num'},
          {id:'amount', en:'Cost in Birr', am:'ዋጋ በብር', t:'money'},
          {id:'quotes', en:'Quotes attached', am:'የተያዙ ፕሮፎርማዎች', t:'num'},
          {id:'state', en:'Where it stands', am:'የደረሰበት', t:'choice', opts:[
            {v:'app',  en:'Selam approved it',    am:'ሰላም አጽድቃዋለች'},
            {v:'sent', en:'With Selam, waiting',  am:'በሰላም እጅ፣ በመጠበቅ ላይ'},
            {v:'ret',  en:'Returned or rejected', am:'ተመልሷል ወይም ውድቅ ሆኗል'},
            {v:'held', en:'Not sent to her yet',  am:'ገና አልቀረበም'}
          ]}
        ]},
      {id:'pr_prep', en:'How many purchase requests did you prepare today?', am:'ዛሬ ስንት የግዥ ጥያቄ አዘጋጁ?', t:'num',
        auto:{rows:'pr_list'}, sumEn:'requests', sumAm:'ጥያቄዎች'},
      {id:'pr_sub', en:'How many went to Selam for approval?', am:'ስንቱ ለሰላም ለማጽደቅ ቀረቡ?', t:'num',
        auto:{rows:'pr_list', when:{col:'state', in:['app','sent','ret']}}, sumEn:'went to Selam', sumAm:'ለሰላም ቀርበዋል'},
      {id:'pr_app', en:'How many did Selam approve?', am:'ሰላም ስንቱን አጸደቀች?', t:'num',
        auto:{rows:'pr_list', when:{col:'state', is:'app'}}, sumEn:'approved', sumAm:'ተጽድቀዋል'},
      {id:'pr_ret', en:'How many were returned or rejected?', am:'ስንቱ ተመለሱ ወይም ውድቅ ሆኑ?', t:'num',
        auto:{rows:'pr_list', when:{col:'state', is:'ret'}}, sumEn:'returned', sumAm:'ተመልሰዋል'},
      {id:'pr_ret_why', en:'Selam sent some back. What was wrong, and when do they go back to her? (Write which request in the box.)', am:'ሰላም የመለሰቻቸው አሉ። ምን ስህተት ነበር? መቼ ተስተካክለው ይመለሳሉ? (የትኛው ጥያቄ እንደሆነ በሳጥኑ ይጻፉ።)', t:'area',
        picks:[
          { en:'Fewer than 3 quotes',              am:'ከ3 ያነሰ ፕሮፎርማ' },
          { en:'The price or the amount was wrong', am:'ዋጋው ወይም መጠኑ ስህተት ነበር' },
          { en:'No job code',                      am:'የሥራ ኮድ አልነበረውም' },
          { en:'Not in the plan or the budget',    am:'በዕቅዱ ወይም በበጀቱ ውስጥ የለም' },
          { en:'Goes back to her today',           am:'ዛሬ ተስተካክሎ ይመለሳል' },
          { en:'Goes back to her tomorrow',        am:'ነገ ተስተካክሎ ይመለሳል' }
        ], show:{f:'pr_ret', when:'pos'}},
      {id:'pr_quotes', en:'How many requests carried 3 or more supplier quotes? (with 3 quotes / all requests)', am:'ስንቱ ጥያቄ 3 እና ከዚያ በላይ የአቅራቢ ፕሮፎርማ ነበረው? (3 ፕሮፎርማ ያላቸው / ሁሉም ጥያቄዎች)', t:'ratio',
        auto:{a:{rows:'pr_list', when:{col:'quotes', gte:3}}, b:{rows:'pr_list'}}},
      /* the rulebook charges 200 Birr a request with fewer than 3 quotes on
         a day this is left empty (js/rules.js getachew-fewer-3-quotes), so a
         reason is one tap now */
      {id:'pr_quotes_why', en:'Fewer than 3 quotes. Why could a third not be found? (Write which request in the box.)', am:'ከ3 ያነሰ ፕሮፎርማ ነው። ሦስተኛው ለምን አልተገኘም? (የትኛው ጥያቄ እንደሆነ በሳጥኑ ይጻፉ።)', t:'area',
        picks:[
          { en:'Only one or two suppliers sell it',        am:'የሚሸጡት አንድ ወይም ሁለት አቅራቢዎች ብቻ ናቸው' },
          { en:'Suppliers would not give a written quote', am:'አቅራቢዎች የጽሑፍ ፕሮፎርማ አልሰጡም' },
          { en:'Urgent — no time for three',               am:'አስቸኳይ ነበር — ለሦስት ጊዜ አልነበረም' },
          { en:'An imported or special item',              am:'ከውጭ የሚመጣ ወይም ልዩ ዕቃ ነው' },
          { en:'The third quote comes tomorrow',           am:'ሦስተኛው ፕሮፎርማ ነገ ይመጣል' }
        ], show:{f:'pr_quotes', when:'short'}}
    ]},
    { en:'Orders placed', am:'የተሰጡ ትዕዛዞች', fields:[
      {id:'ord_any', en:'Did you place any order today?', am:'ዛሬ የሰጡት ትዕዛዝ አለ?', t:'yesno', yes:{en:'I placed orders', am:'ትዕዛዝ ሰጥቻለሁ'}, no:{en:'No orders today', am:'ዛሬ ትዕዛዝ አልሰጠሁም'}},
      {id:'ord_list', en:'Each order, and the delivery date the supplier promised', am:'እያንዳንዱ ትዕዛዝና አቅራቢው ቃል የገባው የመድረሻ ቀን', t:'table', addEn:'Add an order', addAm:'ትዕዛዝ ጨምር',
        show:{f:'ord_any', when:'yes'},
        cols:[
          {id:'sup', en:'Supplier', am:'አቅራቢ', t:'text'},
          {id:'code', en:'Job code', am:'የሥራ ኮድ', t:'text'},
          {id:'item', en:'Material', am:'ዕቃ', t:'choice', opts:MATERIAL_OPTS},
          {id:'colour', en:'Colour code', am:'የቀለም ኮድ', t:'colour', of:'item'},
          {id:'qty', en:'How many (sheets, pieces)', am:'ብዛት (ሉህ፣ ቁራጭ)', t:'num'},
          {id:'amount', en:'Cost in Birr', am:'ዋጋ በብር', t:'money'},
          {id:'paid', en:'Cheque given, or on credit?', am:'ቼክ ተሰጥቷል ወይስ በዱቤ?', t:'choice', opts:[
            {v:'cheque', en:'Cheque given', am:'ቼክ ተሰጥቷል'},
            {v:'credit', en:'On credit — no cheque yet', am:'በዱቤ — ቼክ ገና አልተሰጠም'}]},
          {id:'chq', en:'Cheque no., if given', am:'የቼክ ቁጥር (ከተሰጠ)', t:'text'},
          {id:'due', en:'If on credit: pay by', am:'በዱቤ ከሆነ፦ የሚከፈልበት ቀን', t:'date'},
          {id:'date', en:'Promised delivery', am:'ቃል የተገባው የመድረሻ ቀን', t:'text'}
        ]},
      {id:'ord_placed', en:'How many orders did you place today?', am:'ዛሬ ስንት ትዕዛዝ ሰጡ?', t:'num',
        auto:{rows:'ord_list'}, sumEn:'orders', sumAm:'ትዕዛዞች'},
      {id:'ord_value', en:'What were today\'s orders worth?', am:'የዛሬዎቹ ትዕዛዞች ዋጋ ስንት ነው?', t:'money',
        auto:{sum:'ord_list.amount'}, sumEn:'ordered', sumAm:'ታዟል'},
      {id:'ord_dates', en:'For how many of today\'s orders is the delivery date confirmed?', am:'ከዛሬዎቹ ትዕዛዞች ስንቱ የመድረሻ ቀን ተረጋግጧል?', t:'num',
        auto:{rows:'ord_list', when:{col:'date'}}, sumEn:'with a promised date', sumAm:'ቀን የተገባላቸው'},
      /* shown only with the orders: on a day with none it read "—" */
      {id:'ord_suppliers', en:'With which suppliers?', am:'ከየትኞቹ አቅራቢዎች?', t:'text',
        auto:{list:'ord_list.sup'}, show:{f:'ord_any', when:'yes'}}
    ]},
    { en:'ZamZam Bank cheques', am:'የዘምዘም ባንክ ቼኮች', fields:[
      {id:'chq_any', en:'Did you issue any ZamZam cheque today?', am:'ዛሬ የሰጡት የዘምዘም ቼክ አለ?', t:'yesno', yes:{en:'I wrote cheques', am:'ቼክ ሰጥቻለሁ'}, no:{en:'No cheques today', am:'ዛሬ ቼክ አልሰጠሁም'}},
      {id:'chq_list', en:'Each cheque issued today', am:'ዛሬ የተሰጠ እያንዳንዱ ቼክ', t:'table', addEn:'Add a cheque', addAm:'ቼክ ጨምር',
        show:{f:'chq_any', when:'yes'},
        cols:[
          {id:'no', en:'Cheque no.', am:'የቼክ ቁጥር', t:'text'},
          {id:'sup', en:'Supplier', am:'አቅራቢ', t:'text'},
          {id:'code', en:'Job code', am:'የሥራ ኮድ', t:'text'},
          {id:'amount', en:'Amount', am:'መጠን', t:'money'}
        ]},
      {id:'chq_issued', en:'How many ZamZam cheques did you issue today?', am:'ዛሬ ስንት የዘምዘም ቼክ ሰጡ?', t:'num',
        auto:{rows:'chq_list'}, sumEn:'cheques', sumAm:'ቼኮች'},
      {id:'chq_value', en:'What is the total value of today\'s cheques?', am:'የዛሬዎቹ ቼኮች ጠቅላላ ዋጋ ስንት ነው?', t:'money',
        auto:{sum:'chq_list.amount'}, sumEn:'in cheques', sumAm:'በቼክ'}
    ]},
    { en:'What we owe, and the papers to Selam', am:'ያለብን ዕዳና ለሰላም የሚደርሱ ሰነዶች', fields:[
      {id:'cr_owed', en:'How much does Klever owe suppliers on credit right now, in total?', am:'ክሌቨር አሁን ለአቅራቢዎች በዱቤ በጠቅላላ ስንት ብር አለበት?', t:'money', parts:{of:['cr_overdue']}},
      /* the rulebook reads this every day: 200 Birr for each document that
         was due and did not reach Selam in 24 hours, and the month's ZamZam
         bonus needs all of them on time (js/rules.js getachew-docs-24h,
         getachew-bonus-zamzam) — so it stays asked, in plain words */
      {id:'doc_24', en:'Documents due to Selam today, invoices and delivery notes: how many reached her within 24 hours? If none were due, write 0 and 0. (in time / due today)', am:'ለሰላም የሚሄዱ ደረሰኞችና መረከቢያ ወረቀቶች፦ ስንቱ በ24 ሰዓት ውስጥ ደረሱ? ከሌለ 0 እና 0 ይጻፉ። (በሰዓቱ የደረሱ / ዛሬ መድረስ የነበረባቸው)', t:'ratio', ask:{b:{en:"How many documents (invoices, delivery notes) were due to Selam today?", am:"ዛሬ ለሰላም ስንት ደረሰኝና መረከቢያ ወረቀት መድረስ ነበረበት?"}, a:{en:"How many of them reached her within 24 hours?", am:"ከእነሱ ስንቱ በ24 ሰዓት ውስጥ ደረሱ?"}}},
      /* counted from the list of papers not yet with her (a tap on the list
         below opens it); 0 when the list was answered without that tap */
      {id:'doc_missing', en:'How many documents are still outstanding?', am:'እስካሁን ያልቀረቡ ሰነዶች ስንት ናቸው?', t:'num',
        auto:{rows:'doc_missing_list'},
        tgt:{op:'lte', v:0, en:'–200 Birr per document', am:'በሰነድ –200 ብር'}}
    ]},
    /* THE ONE LIST. Eleven yes/no questions and two typed counts used to
       stand in sections of their own — a late delivery, a rejection, a
       supplier's poor quality, a price that moved, a cheaper material, a
       payment, a debt past its date, a missing paper, a cheque written
       wrong, the cheque book left out. On a day when none of it happened
       that was a page of taps, and "did Selam confirm the funds before every
       cheque?" was answered "no" on days with no cheque. Each question that
       follows opens on its own tap, right under the list. */
    { en:'Anything else today?', am:'ዛሬ ሌላ የሆነ ነገር አለ?', fields:[
      {id:'g_events', en:'What else happened in purchasing today?', am:'ዛሬ በግዥ ሥራው ሌላ ምን ሆነ?', t:'multi',
        none:{ en:'Nothing — a normal day', am:'ምንም — የተለመደ ቀን' },
        groups:[
          { v:'sup',   en:'Suppliers',          am:'አቅራቢዎች' },
          { v:'price', en:'Prices and material', am:'ዋጋና ዕቃ' },
          { v:'money', en:'Credit',             am:'ዱቤ' },
          { v:'doc',   en:'Papers to Selam',    am:'ለሰላም የሚደርሱ ሰነዶች' },
          { v:'chq',   en:'Cheques',            am:'ቼኮች' }
        ],
        opts:[
          { v:'late',      g:'sup',   en:'A supplier delivery is late',                  am:'የአቅራቢ ጭነት ዘግይቷል' },
          { v:'rejected',  g:'sup',   en:'The store rejected something I ordered',       am:'ካዘዝኩት ዕቃ መጋዘኑ ያልተቀበለው አለ' },
          { v:'quality',   g:'sup',   en:'A supplier sent poor quality',                 am:'ከአቅራቢ ጥራት የጎደለው ዕቃ መጣ' },
          { v:'not_told',  g:'sup',   en:'A supplier problem was not told to Mahelet and Selam the same day', am:'የአቅራቢ ችግር በዚያው ቀን ለማህሌትና ለሰላም አልተነገረም' },
          { v:'price',     g:'price', en:'A price went up or down from last time',       am:'ዋጋ ካለፈው ጊዜ ጨመረ ወይም ቀነሰ' },
          { v:'swap',      g:'price', en:'A material was swapped for a cheaper one',     am:'ዕቃ በርካሽ ዕቃ ተተካ' },
          { v:'paid_back', g:'money', en:'I paid back credit to a supplier',             am:'ለአቅራቢ የዱቤ ዕዳ ከፈልኩ' },
          { v:'overdue',   g:'money', en:'A supplier is owed past the date we promised', am:'ለመክፈል ቃል የገባንበት ቀን ያለፈበት ዕዳ አለ' },
          { v:'doc_out',   g:'doc',   en:'A purchase document has not reached Selam yet', am:'ለሰላም ገና ያልደረሰ የግዥ ሰነድ አለ' },
          { v:'no_conf',   g:'chq',   en:'A cheque went out before Selam confirmed the money', am:'ሰላም ገንዘቡን ሳታረጋግጥ ቼክ ተሰጠ' },
          { v:'no_match',  g:'chq',   en:'A cheque was not for the approved amount or supplier', am:'ቼክ በጸደቀው መጠን ወይም ለጸደቀው አቅራቢ አልተሰጠም' },
          { v:'book_open', g:'chq',   en:'The cheque book was not locked away at close', am:'የቼክ ደብተሩ በመዝጊያ ሰዓት አልተቆለፈበትም' }
        ]},

      /* — a supplier late. The plant manager and the register read the rows. */
      {id:'sup_delay_any', en:'Is any supplier delivery late?', am:'የዘገየ የአቅራቢ ጭነት አለ?', t:'yesno', quiet:1, auto:{picked:'g_events', v:'late'}},
      {id:'sup_delay_list', en:'Which deliveries are late?', am:'የዘገዩት የትኞቹ ጭነቶች ናቸው?', t:'table', addEn:'Add a delay', addAm:'መዘግየት ጨምር',
        show:{f:'sup_delay_any', when:'yes'},
        cols:[
          {id:'sup', en:'Supplier', am:'አቅራቢ', t:'text'},
          {id:'code', en:'Job code', am:'የሥራ ኮድ', t:'text'},
          {id:'item', en:'Material', am:'ዕቃ', t:'choice', opts:MATERIAL_OPTS},
          {id:'colour', en:'Colour code', am:'የቀለም ኮድ', t:'colour', of:'item'},
          {id:'was', en:'Promised date', am:'ቃል የተገባው ቀን', t:'text'},
          {id:'now', en:'New date', am:'አዲሱ ቀን', t:'text'},
          {id:'stops', en:'Holds up production?', am:'ምርት ያቆማል?', t:'yesno', yes:{en:'Holds up production', am:'ምርት ያቆማል'}, no:{en:'Does not hold it up', am:'ምርት አያቆምም'}}
        ]},
      {id:'sup_delay', en:'How many supplier delays were there today?', am:'ዛሬ ስንት የአቅራቢ መዘግየት ነበር?', t:'num',
        auto:{rows:'sup_delay_list'}, sumEn:'late deliveries', sumAm:'የዘገዩ ርክክቦች'},
      {id:'sup_delay_stop', en:'How many of them hold up production?', am:'ከነሱ ስንቱ ምርት ያቆማል?', t:'num',
        auto:{rows:'sup_delay_list', when:{col:'stops', is:'yes'}}, sumEn:'holding up production', sumAm:'ምርት የሚያቆሙ'},

      /* — a rejection at the store. How many deliveries reached the store is
         Alemaya's count — the storekeeper signs for them (the Chairman, 9 Oct 2026).
         What is Getachew's is the chase afterwards: a rejection is his to put
         right with the supplier. */
      {id:'del_rej_any', en:'Did the store reject anything you ordered today?', am:'ዛሬ ካዘዙት ዕቃ መጋዘኑ ያልተቀበለው አለ?', t:'yesno', quiet:1, auto:{picked:'g_events', v:'rejected'}},
      {id:'del_rej_list', en:'What was rejected, and what happens next?', am:'ምን ውድቅ ተደረገ? ቀጥሎ ምን ይሆናል?', t:'table', addEn:'Add a rejected item', addAm:'ዕቃ ጨምር',
        show:{f:'del_rej_any', when:'yes'},
        cols:[
          {id:'item', en:'Material', am:'ዕቃ', t:'choice', opts:MATERIAL_OPTS},
          {id:'colour', en:'Colour code', am:'የቀለም ኮድ', t:'colour', of:'item'},
          {id:'sup', en:'Supplier', am:'አቅራቢ', t:'text'},
          {id:'code', en:'Job code', am:'የሥራ ኮድ', t:'text'},
          {id:'why', en:'Reason', am:'ምክንያት', t:'text', picks:COL_REJECTED},
          {id:'asked', en:'Supplier asked for a replacement or refund?', am:'አቅራቢው ምትክ ወይም ተመላሽ ተጠይቋል?', t:'yesno', yes:{en:'Asked', am:'ተጠይቋል'}, no:{en:'Not yet', am:'ገና አልተጠየቀም'}},
          {id:'fix', en:'Replacement or refund, and when', am:'ምትክ ወይም ተመላሽ፣ መቼ', t:'text', picks:[{ en:'Replacement this week', am:'በዚህ ሳምንት ምትክ' }, { en:'Refund', am:'ተመላሽ ገንዘብ' }, { en:'Not agreed yet', am:'ገና አልተስማማንም' }]}
        ]},
      {id:'del_rej', en:'How many materials did the store reject?', am:'መጋዘኑ ስንት ዕቃ አልተቀበለም?', t:'num',
        auto:{rows:'del_rej_list'}, sumEn:'rejected', sumAm:'ውድቅ ተደርገዋል'},
      /* shown only with the rejections: on a day with none it read "—" */
      {id:'del_repl', en:'Has the supplier been asked for a replacement or refund?', am:'አቅራቢው ምትክ ወይም ተመላሽ እንዲሰጥ ተጠይቋል?', t:'yesno', yes:{en:'All asked', am:'ሁሉም ተጠይቀዋል'}, no:{en:'Not all asked', am:'ያልተጠየቀ አለ'},
        auto:{all:'del_rej_list.asked'}, show:{f:'del_rej_any', when:'yes'}},

      /* — poor quality from a supplier. A real 0 on a normal day: the week
         adds it up (getachew-weekly g_quality). */
      {id:'sup_quality', en:'How many quality problems came from suppliers today?', am:'ዛሬ ከአቅራቢዎች ስንት የጥራት ችግር መጣ?', t:'num', zero:1,
        show:{f:'g_events', when:'has', v:'quality'}},
      {id:'sup_quality_what', en:'What was wrong, and what did the supplier agree to do? (Write the supplier in the box.)', am:'ምን ችግር ነበር? አቅራቢው ምን ለማድረግ ተስማማ? (አቅራቢውን በሳጥኑ ይጻፉ።)', t:'area',
        picks:[
          { en:'Board damaged or bent',             am:'ሰሌዳው ተጎድቷል ወይም ጎብጧል' },
          { en:'Wrong size or thickness',           am:'የተሳሳተ ልኬት ወይም ውፍረት' },
          { en:'Wrong colour or finish',            am:'የተሳሳተ ቀለም ወይም ገጽታ' },
          { en:'Faulty hinges, slides or handles',  am:'የተበላሹ ማጠፊያዎች፣ ተንሸራታቾች ወይም መያዣዎች' },
          { en:'They will replace it',              am:'ይቀይሩታል' },
          { en:'They will refund it',               am:'ገንዘቡን ይመልሳሉ' },
          { en:'Nothing agreed yet',                am:'ገና ስምምነት የለም' }
        ], show:{f:'sup_quality', when:'pos'}},
      {id:'sup_reported', en:'Were Mahelet and Selam told of every issue the same day?', am:'እያንዳንዱ ችግር ለማህሌትና ለሰላም በዚያው ቀን ተነግሯል?', t:'yesno', quiet:1, auto:{picked:'g_events', v:'not_told', flip:1}},
      {id:'sup_reported_why', en:'Not told the same day. Why? (Write which problem in the box.)', am:'በዚያው ቀን አልተነገረም። ለምን? (የትኛው ችግር እንደሆነ በሳጥኑ ይጻፉ።)', t:'area',
        picks:[
          { en:'Forgot',                            am:'ረሳሁ' },
          { en:'Could not reach them',              am:'ላገኛቸው አልቻልኩም' },
          { en:'Told only one of them',             am:'ለአንዳቸው ብቻ ነገርኩ' },
          { en:'Will tell them tomorrow',           am:'ነገ እነግራቸዋለሁ' }
        ], show:{f:'sup_reported', when:'no'}},

      /* — a price that moved. The rows were asked of every purchase and were
         empty in every report; now they are asked when a price changed,
         which is what the 6,000 Birr/m² floor needs to know. The price-up
         counts come out of the rows (and read 0 when the list was answered
         without the tap). */
      {id:'p_rows', en:'Which prices changed? One row a material — the price now and last time.', am:'የተቀየሩት ዋጋዎች የትኞቹ ናቸው? ለአንድ ዕቃ አንድ ረድፍ — የአሁኑና ያለፈው ዋጋ።',
       t:'table', addEn:'Add material', addAm:'ዕቃ ጨምር', show:{f:'g_events', when:'has', v:'price'}, cols:[
        {id:'pitem', en:'Material', am:'ዕቃ', t:'choice', opts:MATERIAL_OPTS},
        {id:'colour', en:'Colour code', am:'የቀለም ኮድ', t:'colour', of:'pitem'},
        {id:'psup',  en:'Supplier', am:'አቅራቢ', t:'text'},
        {id:'punit', en:'Unit', am:'መለኪያ', t:'text'},
        {id:'pnow',  en:'Price now', am:'የአሁን ዋጋ', t:'money'},
        {id:'plast', en:'Price last time', am:'ያለፈው ዋጋ', t:'money'},
        {id:'pchg',  en:'Change %', am:'ለውጥ %', t:'pct'},
        {id:'pquot', en:'Quotes compared', am:'የተነጻጸሩ ዋጋዎች', t:'num'}
      ]},
      {id:'sup_price', en:'How many suppliers put a price up today?', am:'ዛሬ ስንት አቅራቢዎች ዋጋ ጨመሩ?', t:'num',
        auto:{rows:'p_rows', when:{col:'pchg', pos:1}}, sumEn:'put a price up', sumAm:'ዋጋ ጨምረዋል'},
      {id:'p_up', en:'How many materials went up more than 10%?', am:'ስንት ዕቃዎች ከ10% በላይ ጨመሩ?', t:'num',
        auto:{rows:'p_rows', when:{col:'pchg', gte:10}}, sumEn:'up more than 10%', sumAm:'ከ10% በላይ ጨምረዋል',
        tgt:{op:'lte', v:0, en:'The margin floor is 6,000 Birr/m² — a 10% rise must reach Ephrata before the next quote',
             am:'የትርፍ ወለሉ 6,000 ብር/ካሬ ሜትር ነው — የ10% ጭማሪ ከቀጣዩ ዋጋ በፊት ኤፍራታ ጋር መድረስ አለበት'}},
      /* which supplier, which material, from what to what: the rows above
         say it, so what is left to ask is why */
      {id:'sup_price_what', en:'A supplier put a price up. Why?', am:'አቅራቢ ዋጋ ጨምሯል። ለምን?', t:'area',
        picks:[
          { en:'The market price went up',          am:'የገበያው ዋጋ ጨመረ' },
          { en:'The dollar rate',                   am:'የዶላር ምንዛሬ' },
          { en:'The supplier\'s own increase',      am:'አቅራቢው ራሱ ጨመረ' },
          { en:'Transport cost',                    am:'የትራንስፖርት ወጪ' },
          { en:'A small order — no discount',       am:'ትንሽ ትዕዛዝ — ቅናሽ የለም' }
        ], show:{f:'sup_price', when:'pos'}},
      {id:'p_up_what', en:'Up more than 10%. Does it touch any open quotation? (Write which in the box.)', am:'ከ10% በላይ ጨምሯል። ክፍት ፕሮፎርማ ይነካል? (የትኛው እንደሆነ በሳጥኑ ይጻፉ።)', t:'area',
        picks:[
          { en:'Open quotations are touched',       am:'ክፍት ፕሮፎርማዎችን ይነካል' },
          { en:'No open quotation is touched',      am:'ምንም ክፍት ፕሮፎርማ አይነካም' },
          { en:'Looking for a cheaper supplier',    am:'ርካሽ አቅራቢ እየፈለግሁ ነው' },
          { en:'Not sure yet',                      am:'ገና እርግጠኛ አይደለሁም' }
        ], show:{f:'p_up', when:'pos'}},
      {id:'p_told', en:'Were Ephrata and Selam told today?', am:'ለኤፍራታና ለሰላም ዛሬ ተነግሯል?', t:'yesno', yes:{en:'Both told today', am:'ሁለቱም ዛሬ ተነግሯቸዋል'}, no:{en:'Not told yet', am:'ገና አልተነገራቸውም'}, opt:1, i:1,
        show:{f:'p_up', when:'pos'}},
      {id:'p_sub', en:'Was any material swapped for a cheaper one?', am:'ማንኛውም ዕቃ በርካሽ ተተክቷል?', t:'yesno', quiet:1, auto:{picked:'g_events', v:'swap'}},
      {id:'p_sub_what', en:'Why was it swapped? (Write what for what, and the job, in the box.)', am:'ለምን ተተካ? (ምን በምን እንደተተካና ሥራውን በሳጥኑ ይጻፉ።)', t:'area',
        picks:[
          { en:'The usual one was out of stock',    am:'የተለመደው ዕቃ አልነበረም' },
          { en:'The price went up',                 am:'ዋጋው ጨመረ' },
          { en:'Same quality, lower price',         am:'ያው ጥራት፣ ያነሰ ዋጋ' },
          { en:'The customer agreed',               am:'ደንበኛው ተስማምቷል' },
          { en:'Mahelet asked for it',              am:'ማህሌት ጠይቃለች' }
        ], show:{f:'p_sub', when:'yes'}},
      {id:'p_subok', en:'Did Wude approve it before it was bought?', am:'ከመገዛቱ በፊት ውዱ አጽድቃለች?', t:'yesno', yes:{en:'Wude approved it first', am:'ውዱ ቀድማ ፈቅዳለች'}, no:{en:'Bought without her OK', am:'ያለ ውዱ ፈቃድ ተገዛ'}, opt:1, i:1,
        show:{f:'p_sub', when:'yes'}},

      /* — credit paid back, and credit past its date */
      {id:'cr_paid_any', en:'Did you pay back any earlier credit today?', am:'ዛሬ ቀድሞ የተወሰደ ዱቤ ከፍለዋል?', t:'yesno', quiet:1, auto:{picked:'g_events', v:'paid_back'}},
      {id:'cr_paid_list', en:'Which suppliers were paid, and with which cheque?', am:'የትኞቹ አቅራቢዎች ተከፈላቸው? በየትኛው ቼክ?', t:'table', addEn:'Add a payment', addAm:'ክፍያ ጨምር',
        show:{f:'cr_paid_any', when:'yes'}, cols:[
          {id:'sup', en:'Supplier', am:'አቅራቢ', t:'text'},
          {id:'amount', en:'Amount', am:'መጠን', t:'money'},
          {id:'chq', en:'Cheque no.', am:'የቼክ ቁጥር', t:'text'}
        ]},
      {id:'cr_paid', en:'How much earlier credit did you pay back today, by cheque?', am:'ዛሬ ቀድሞ የተወሰደ ዱቤ ስንት ብር በቼክ ተከፈለ?', t:'money',
        auto:{sum:'cr_paid_list.amount'}, sumEn:'paid back', sumAm:'ተመልሷል'},
      /* a real 0 on a normal day: the week reads the last one (g_cr_overdue)
         and the morning agents read it every day */
      {id:'cr_overdue', en:'How much is owed past the date we promised to pay, in Birr?', am:'ቃል የገባንበት ቀን ያለፈበት ዕዳ ስንት ብር ነው?', t:'money', zero:1,
        show:{f:'g_events', when:'has', v:'overdue'},
        tgt:{op:'lte', v:0, en:'Should be 0 — a supplier owed past the date can stop delivering',
             am:'ዜሮ መሆን አለበት — ቀኑ ያለፈበት አቅራቢ ዕቃ ማቅረብ ሊያቆም ይችላል'}},
      {id:'cr_overdue_list', en:'Which suppliers are owed past the date, how much, and why not paid?', am:'ቀኑ ያለፈባቸው አቅራቢዎች እነማን ናቸው? ስንት ብር? ለምን አልተከፈለም?', t:'table', addEn:'Add a supplier', addAm:'አቅራቢ ጨምር',
        show:{f:'cr_overdue', when:'miss'}, cols:[
          {id:'sup', en:'Supplier', am:'አቅራቢ', t:'text'},
          {id:'amount', en:'Amount', am:'መጠን', t:'money'},
          {id:'due', en:'Was due', am:'የሚከፈልበት ቀን', t:'text'},
          {id:'why', en:'Why not paid', am:'ለምን አልተከፈለም', t:'text', picks:COL_NOT_PAID}
        ]},

      /* — a paper not yet with Selam (the count is above, beside doc_24) */
      {id:'doc_any', en:'Is any purchase document still outstanding?', am:'ገና ያልቀረበ የግዥ ሰነድ አለ?', t:'yesno', quiet:1, auto:{picked:'g_events', v:'doc_out'}},
      {id:'doc_missing_list', en:'Which documents, for which jobs, and when will each reach Selam?', am:'የትኞቹ ሰነዶች? ለየትኞቹ ሥራዎች? እያንዳንዱ መቼ ለሰላም ይደርሳል?', t:'table', addEn:'Add a document', addAm:'ሰነድ ጨምር',
        show:{f:'doc_any', when:'yes'},
        cols:[
          {id:'code', en:'Job code', am:'የሥራ ኮድ', t:'text'},
          {id:'doc', en:'Document', am:'ሰነድ', t:'choice', opts:[
            {v:'invoice', en:'Supplier invoice', am:'የአቅራቢ ደረሰኝ (ኢንቮይስ)'},
            {v:'dnote', en:'Delivery note', am:'የዕቃ መረከቢያ ወረቀት'},
            {v:'jobcard', en:'Job card reference', am:'የጆብ ካርድ ማጣቀሻ'},
            {v:'store', en:'Store confirmation', am:'የመጋዘን ማረጋገጫ'},
            {v:'warranty', en:'Warranty', am:'የዋስትና ሰነድ'}]},
          {id:'sup', en:'Supplier', am:'አቅራቢ', t:'text'},
          {id:'when', en:'Expected by', am:'የሚደርስበት ቀን', t:'text'}
        ]},

      /* — the cheques. Each of these three is a fine in the rulebook when it
         reads "no" (js/rules.js getachew-cheque-no-confirm –5,000,
         getachew-chequebook-unsecured –2,000; chq_match is the lead for the
         –2,000 and –3,000 recorded by hand) and a broken rule in the
         Chairman's brief (apps-script/Agents.js BROKEN_). They are filed
         exactly as before, "yes" or "no", worked out from the list — and
         "no" now only when he says so, not because no cheque was written. */
      {id:'chq_confirmed', en:'Did Selam confirm the funds in ZamZam before every cheque?', am:'ከእያንዳንዱ ቼክ በፊት ሰላም ገንዘቡ ዘምዘም መግባቱን አረጋግጣለች?', t:'yesno', quiet:1, auto:{picked:'g_events', v:'no_conf', flip:1}},
      {id:'chq_confirmed_why', en:'Why did it go out first? (Write the cheque number, the amount and the supplier in the box.)', am:'ለምን ቀድሞ ተሰጠ? (የቼኩን ቁጥር፣ መጠኑንና አቅራቢውን በሳጥኑ ይጻፉ።)', t:'area',
        picks:[
          { en:'Selam could not be reached',        am:'ሰላም አልተገኘችም' },
          { en:'The supplier could not wait',       am:'አቅራቢው መጠበቅ አልቻለም' },
          { en:'Selam agreed by phone only',        am:'ሰላም በስልክ ብቻ ፈቅዳለች' },
          { en:'I thought the money was already in', am:'ገንዘቡ የገባ መስሎኝ ነበር' }
        ], show:{f:'chq_confirmed', when:'no'}},
      {id:'chq_match', en:'Was every cheque for the approved amount, to the approved supplier?', am:'እያንዳንዱ ቼክ በጸደቀው መጠንና ለጸደቀው አቅራቢ ነበር?', t:'yesno', quiet:1, auto:{picked:'g_events', v:'no_match', flip:1}},
      {id:'chq_match_why', en:'How was it different, and who allowed it? (Write the cheque number in the box.)', am:'በምን ተለየ? ማን ፈቀደ? (የቼኩን ቁጥር በሳጥኑ ይጻፉ።)', t:'area',
        picks:[
          { en:'A different amount',                am:'የተለየ መጠን' },
          { en:'A different supplier',              am:'የተለየ አቅራቢ' },
          { en:'The supplier changed the price',    am:'አቅራቢው ዋጋውን ቀየረ' },
          { en:'Selam allowed it',                  am:'ሰላም ፈቅዳለች' },
          { en:'The Chairman allowed it',           am:'ሊቀመንበሩ ፈቅደዋል' },
          { en:'Nobody allowed it',                 am:'ማንም አልፈቀደም' }
        ], show:{f:'chq_match', when:'no'}},
      {id:'chq_secure', en:'Was the cheque book locked away at close?', am:'የቼክ ደብተሩ በመዝጊያ ሰዓት ተቆልፎበታል?', t:'yesno', quiet:1, auto:{picked:'g_events', v:'book_open', flip:1}},
      {id:'chq_secure_why', en:'Where was it, and is it locked away now? (Write who could reach it in the box.)', am:'የት ነበር? አሁን ተቆልፎበታል? (ማን ሊደርስበት ይችል እንደነበር በሳጥኑ ይጻፉ።)', t:'area',
        picks:[
          { en:'In an open drawer in the office',   am:'ቢሮ ውስጥ ባልተቆለፈ መሳቢያ' },
          { en:'I took it with me',                 am:'ይዤው ሄድኩ' },
          { en:'The key is lost',                   am:'ቁልፉ ጠፍቷል' },
          { en:'Locked away now',                   am:'አሁን ተቆልፎበታል' },
          { en:'Not locked away yet',               am:'ገና አልተቆለፈበትም' }
        ], show:{f:'chq_secure', when:'no'}}
    ]},
    { en:'Problems and help', am:'ችግርና እርዳታ', fields:[
      {id:'problem', en:'What was the biggest problem today?', am:'የዛሬው ትልቁ ችግር ምን ነበር?', t:'area', opt:1,
        picks:[
          { en:'No big problem today',              am:'ዛሬ ትልቅ ችግር አልነበረም' },
          { en:'The supplier had none in stock',    am:'አቅራቢው ዕቃው አልነበረውም' },
          { en:'A supplier delivered late',         am:'አቅራቢ ዘግይቶ አደረሰ' },
          { en:'A price went up',                   am:'ዋጋ ጨመረ' },
          { en:'Waiting for Selam\'s approval',     am:'የሰላምን ማጽደቅ እየጠበቅሁ ነው' },
          { en:'No money in ZamZam yet',            am:'ዘምዘም ውስጥ ገና ገንዘብ የለም' },
          { en:'No job code or material list yet',  am:'የሥራ ኮድ ወይም የዕቃ ዝርዝር ገና የለም' },
          { en:'Transport',                         am:'ትራንስፖርት' }
        ]},
      {id:'need_help', en:'What do you need, and from whom?', am:'ምን ያስፈልግዎታል? ከማን?', t:'area', opt:1,
        picks:[
          { en:'Nothing needed',                    am:'ምንም አያስፈልግም', nil:1 },
          { en:'Approval from Selam',               am:'የሰላም ማጽደቅ' },
          { en:'Money moved to ZamZam (Selam)',     am:'ገንዘብ ወደ ዘምዘም እንዲገባ (ሰላም)' },
          { en:'The material list or job code (Mahelet)', am:'የዕቃ ዝርዝር ወይም የሥራ ኮድ (ማህሌት)' },
          { en:'A decision from Mahelet',           am:'የማህሌት ውሳኔ' },
          { en:'A stock count (Alemaya)',          am:'የዕቃ ቆጠራ (አለማያ)' },
          { en:'Transport',                         am:'ትራንስፖርት' }
        ]},
      {id:'need_chair', en:'Do you need a decision from the Chairman?', am:'የሊቀመንበሩ ውሳኔ ያስፈልግዎታል?', t:'yesno', yes:{en:'I need a decision', am:'ውሳኔ ያስፈልገኛል'}, no:{en:'No decision needed', am:'ውሳኔ አያስፈልገኝም'}},
      {id:'need_chair_what', en:'What should the Chairman decide, and by when? (Write the options in the box.)', am:'ሊቀመንበሩ ምን መወሰን አለባቸው? እስከ መቼ? (አማራጮቹን በሳጥኑ ይጻፉ።)', t:'area',
        picks:[
          { en:'Approve a payment',                 am:'ክፍያ ማጽደቅ' },
          { en:'Choose between suppliers',          am:'ከአቅራቢዎች መምረጥ' },
          { en:'Accept a price rise',               am:'የዋጋ ጭማሪ መቀበል' },
          { en:'Approve a cheaper material',        am:'ርካሽ ዕቃ ማጽደቅ' },
          { en:'Needed today',                      am:'ዛሬ ያስፈልጋል' },
          { en:'Needed this week',                  am:'በዚህ ሳምንት ያስፈልጋል' }
        ], show:{f:'need_chair', when:'yes'}}
    ]},
    { en:'Tomorrow', am:'ነገ', fields:[
      {id:'tomorrow', en:'What must be bought or chased tomorrow? (Write the job codes in the box.)', am:'ነገ ምን መገዛት ወይም መከታተል አለበት? (የሥራ ኮዶቹን በሳጥኑ ይጻፉ።)', t:'area',
        picks:[
          { en:'Buy material for a job',            am:'ለሥራ ዕቃ መግዛት' },
          { en:'Chase a late supplier',             am:'የዘገየ አቅራቢን መከታተል' },
          { en:'Get Selam\'s approval',             am:'የሰላምን ማጽደቅ ማግኘት' },
          { en:'Pay a supplier',                    am:'አቅራቢ መክፈል' },
          { en:'Take documents to Selam',           am:'ሰነዶችን ለሰላም ማድረስ' },
          { en:'Collect a replacement',             am:'ምትክ ዕቃ መቀበል' }
        ]}
    ]}
  ]
},

/* =========================== YORDANOS — DAILY =========================== */
{
  id:'alemaya-daily', person:'alemaya', cadence:'daily', dueTime:'17:30',
  en:'Daily Store Report', am:'ዕለታዊ የመጋዘን ሪፖርት',
  toEn:'Chairman, copied to Mahelet and Selam', toAm:'ሊቀመንበር፣ ግልባጭ ለማህሌትና ለሰላም',
  dueEn:'5:30 PM every working day', dueAm:'በየሥራ ቀኑ ከቀኑ 11፡30 (5:30 PM)',
  penEn:'Reports are mandatory daily', penAm:'ሪፖርት በየቀኑ ግዴታ ነው',
  derived:1,
  sections:[
    /* REBUILT 11 Oct 2026 (the Chairman: "they are struggling so much with
       the questions"). Yordanos's first reports left 13 of 20 and 12 of 19
       questions empty. She filled the deliveries and a few rows of the shelf
       grid, tapped the store's yes/no answers, and stopped; every "why" box,
       the problems and tomorrow stayed empty. 18 questions stood before any
       follow-up opened, eight of them yes/no about things that go wrong once
       a month, and a twelve-row grid counted as "not answered" until every
       row was full. Now a normal day is what came in, what went out, the
       materials she counted, one tap on "nothing else happened", and
       tomorrow. A mismatch, a shortage, a stop, offcuts, the lock and a
       theft are one tap on the list in "Anything else today?", and only then
       are their questions asked, right under the list. Every answer key is
       the one it always was; the yes/no answers the agents, the alerts and
       the Chairman's brief read (sec_theft, sh_stopped, k_low, sec_locked)
       are worked out from the list ({picked:…}, quiet:1). */

    /* The list is the answer. Six figures used to stand around it — how many
       came in, how many were checked, how many taken in, how many rejected,
       how many notes signed — and every one of them was in the rows already
       (the Chairman, 9 Oct 2026: the questions repeat themselves). They are
       counted from the rows now, under the table, and the row carries what
       the figures could not: which supplier, which job, what it was. */
    { en:'Receiving', am:'ዕቃ መረከብ', fields:[
      {id:'rec_any', en:'Did any delivery reach the store today?', am:'ዛሬ ወደ መጋዘን የደረሰ ጭነት አለ?', t:'yesno', yes:{en:'Deliveries came', am:'ጭነት ደርሷል'}, no:{en:'No delivery today', am:'ዛሬ ጭነት አልደረሰም'}},
      {id:'rec_list', en:'Each delivery that came in today — one row each',
       am:'ዛሬ የደረሰ እያንዳንዱ ጭነት — በረድፍ አንድ', t:'table', addEn:'Add a delivery', addAm:'ጭነት ጨምር',
        show:{f:'rec_any', when:'yes'},
        cols:[
          {id:'sup', en:'Supplier', am:'አቅራቢ', t:'text'},
          {id:'code', en:'Job code', am:'የሥራ ኮድ', t:'text'},
          {id:'item', en:'Material', am:'ዕቃ', t:'choice', opts:MATERIAL_OPTS},
          {id:'colour', en:'Colour code', am:'የቀለም ኮድ', t:'colour', of:'item'},
          {id:'qty', en:'Quantity', am:'ብዛት', t:'num'},
          /* one tap where there used to be two questions and a ratio: whether
             it was checked at all, and whether it matched */
          {id:'ok', en:'Against the Job File / BOM', am:'ከጆብ ፋይሉ ወይም ከዕቃ ዝርዝሩ አንጻር', t:'choice', opts:[
            {v:'yes',  en:'Checked — matches the BOM',      am:'ተረጋግጧል — ከዕቃ ዝርዝሩ ጋር ይስማማል'},
            {v:'diff', en:'Checked — does not match',       am:'ተረጋግጧል — አይስማማም'},
            {v:'no',   en:'Not checked',                    am:'አልተረጋገጠም'}
          ]},
          {id:'take', en:'Taken in, or rejected?', am:'ገባ ወይስ ውድቅ ተደረገ?', t:'choice', opts:[
            {v:'in',   en:'Taken into the store', am:'ወደ መጋዘን ገባ'},
            {v:'part', en:'Part taken in',        am:'በከፊል ገባ'},
            {v:'out',  en:'Rejected',             am:'ውድቅ ተደረገ'}
          ]},
          {id:'why', en:'If rejected or short: why', am:'ውድቅ ከሆነ ወይም ከጎደለ፦ ለምን', t:'text', picks:COL_REJECTED},
          {id:'grn', en:'Goods received note signed?', am:'የዕቃ መረከቢያ ወረቀት ተፈርሟል?', t:'yesno', yes:{en:'Signed', am:'ተፈርሟል'}, no:{en:'Not signed', am:'አልተፈረመም'}}
        ]},
      {id:'rec_deliv', en:'How many deliveries came into the store today?', am:'ዛሬ ስንት ጭነት ወደ መጋዘን ገባ?', t:'num',
        auto:{rows:'rec_list'}, sumEn:'deliveries', sumAm:'ርክክቦች'},
      {id:'rec_accepted', en:'How many of them were accepted into the store?', am:'ከነሱ ስንቱ ጭነቶች ወደ መጋዘን ገቡ?', t:'num',
        auto:{rows:'rec_list', when:{col:'take', not:'out'}}, sumEn:'taken in', sumAm:'ገብተዋል'},
      {id:'rec_rejected', en:'How many of them did you reject?', am:'ከነሱ ስንቱን ጭነቶች ውድቅ አደረጉ?', t:'num',
        auto:{rows:'rec_list', when:{col:'take', is:'out'}}, sumEn:'rejected', sumAm:'ውድቅ ተደርገዋል'},
      {id:'rec_grn', en:'How many goods received notes did you sign?', am:'ስንት የዕቃ መረከቢያ ወረቀት ፈረሙ?', t:'num',
        auto:{rows:'rec_list', when:{col:'grn', is:'yes'}}, sumEn:'notes signed', sumAm:'ወረቀቶች ተፈርመዋል'},
      /* "how many" of what? They are deliveries (the Chairman, 9 Oct 2026) */
      {id:'rec_checked', en:'How many of those deliveries were checked against the Job File / BOM? (checked / delivered)', am:'ከነዚህ ጭነቶች ስንቱ ከጆብ ፋይሉ ወይም ከዕቃ ዝርዝሩ ጋር ተረጋገጡ? (የተረጋገጡ / የደረሱ)', t:'ratio',
        /* only rows whose box was answered count (the bug hunt, 15 Oct 2026 — as
           for Elyas's ac_called on 11 Oct: a box left untapped was fined as a "no") */
        auto:{a:{rows:'rec_list', when:{col:'ok', in:['yes', 'diff']}}, b:{rows:'rec_list', when:{col:'ok', in:['yes', 'diff', 'no']}}},
        sumEn:'checked against the BOM', sumAm:'ከዕቃ ዝርዝሩ ጋር ተረጋግጠዋል'},
      {id:'rec_bom_off', en:'How many did not match the BOM?', am:'ከዕቃ ዝርዝሩ ጋር ያልተስማሙ ስንት ናቸው?', t:'num',
        auto:{rows:'rec_list', when:{col:'ok', is:'diff'}}, sumEn:'did not match', sumAm:'አልተስማሙም'},
      {id:'rec_checked_why', en:'Some went in unchecked. Why? (Write which delivery in the box.)', am:'ሳይረጋገጡ የገቡ ጭነቶች አሉ። ለምን? (የትኛው ጭነት እንደሆነ በሳጥኑ ይጻፉ።)', t:'area',
        picks:[
          { en:'The Job File or BOM was not with me', am:'ጆብ ፋይሉ ወይም የዕቃ ዝርዝሩ አልነበረኝም' },
          { en:'The supplier could not wait',       am:'አቅራቢው መጠበቅ አልቻለም' },
          { en:'Too many deliveries at once',       am:'ብዙ ጭነት በአንድ ጊዜ መጣ' },
          { en:'Mahelet said to take it in',        am:'ማህሌት እንዲገባ ብላለች' },
          { en:'Will be checked tomorrow',          am:'ነገ ይረጋገጣል' }
        ], show:{f:'rec_checked', when:'short'}}
    ]},
    /* only asked when a row says something was rejected; the what, the
       supplier and the why are in that row already */
    { en:'Anything rejected today', am:'ዛሬ ውድቅ የተደረጉ ዕቃዎች', fields:[
      {id:'rej_photo', en:'Was each rejection photographed?', am:'ውድቅ የተደረገው እያንዳንዱ ዕቃ ፎቶ ተነስቷል?', t:'yesno', yes:{en:'All photographed', am:'ሁሉም ፎቶ ተነስቷል'}, no:{en:'Some have no photo', am:'ፎቶ ያልተነሳ አለ'}, show:{f:'rec_rejected', when:'pos'}},
      {id:'rej_reported', en:'Were Getachew and Selam told the same day?', am:'ለጌታቸውና ለሰላም በዚያው ቀን ተነግሯል?', t:'yesno', yes:{en:'Both told today', am:'ሁለቱም ዛሬ ተነግሯቸዋል'}, no:{en:'Not told yet', am:'ገና አልተነገራቸውም'}, show:{f:'rec_rejected', when:'pos'}}
    ]},
    /* What went out used to be one number and two yes/nos covering the whole
       day, so "something went out without approval" never said what, to whom
       or for which job. A row an issue answers all three, and the three
       figures below come out of the rows. */
    { en:'Issuing materials', am:'ዕቃ ማውጣት', fields:[
      {id:'iss_any', en:'Did anything go out of the store today?', am:'ዛሬ ከመጋዘን የወጣ ዕቃ አለ?', t:'yesno', yes:{en:'Items went out', am:'ዕቃ ወጥቷል'}, no:{en:'Nothing went out', am:'ምንም ዕቃ አልወጣም'}},
      {id:'iss_list', en:'Each issue out of the store today — one row each',
       am:'ዛሬ ከመጋዘን የወጣ እያንዳንዱ ዕቃ — በረድፍ አንድ', t:'table', addEn:'Add an issue', addAm:'የወጣ ዕቃ ጨምር',
        show:{f:'iss_any', when:'yes'},
        cols:[
          {id:'item', en:'Material', am:'ዕቃ', t:'choice', opts:MATERIAL_OPTS},
          {id:'colour', en:'Colour code', am:'የቀለም ኮድ', t:'colour', of:'item'},
          {id:'qty', en:'Quantity', am:'ብዛት', t:'num'},
          {id:'code', en:'For which job', am:'ለየትኛው ሥራ', t:'text'},
          {id:'who', en:'Taken by', am:'የወሰደው', t:'text'},
          {id:'appr', en:'Mahelet\'s signed approval?', am:'የማህሌት ፊርማ ፈቃድ አለው?', t:'yesno', yes:{en:'Signed by Mahelet', am:'ማህሌት ፈርማለች'}, no:{en:'No signature', am:'ፊርማ የለውም'}},
          {id:'right', en:'Went to the job it was meant for?', am:'ለታሰበለት ሥራ ሄዷል?', t:'yesno', yes:{en:'The right job', am:'ለትክክለኛው ሥራ'}, no:{en:'Another job', am:'ለሌላ ሥራ'}}
        ]},
      {id:'iss_count', en:'How many times were materials issued today?', am:'ዛሬ ስንት ጊዜ ዕቃ ከመጋዘን ወጣ?', t:'num',
        auto:{rows:'iss_list'}, sumEn:'issues', sumAm:'የወጡ'},
      /* both read over the rows; shown only with them (on a day with nothing
         out they read "—"). The Chairman's brief reads iss_approved "no" as
         a broken rule (apps-script/Agents.js BROKEN_). */
      {id:'iss_approved', en:'Did every issue carry Mahelet\'s signed approval?', am:'እያንዳንዱ ዕቃ በማህሌት ፊርማ ፈቃድ ወጥቷል?', t:'yesno', yes:{en:'All signed by Mahelet', am:'ሁሉም በማህሌት ፊርማ ወጥተዋል'}, no:{en:'Something went out unsigned', am:'ያለ ፊርማ የወጣ አለ'},
        auto:{all:'iss_list.appr'}, show:{f:'iss_any', when:'yes'}},
      {id:'iss_approved_why', en:'Something went out without her signature. Who allowed it? (Write what, to whom and for which job in the box.)', am:'ያለ ማህሌት ፊርማ የወጣ ዕቃ አለ። ማን ፈቀደ? (ምን፣ ለማንና ለየትኛው ሥራ እንደሆነ በሳጥኑ ይጻፉ።)', t:'area',
        picks:[
          { en:'Mahelet agreed by phone',           am:'ማህሌት በስልክ ፈቅዳለች' },
          { en:'Amaha asked — it was urgent',       am:'አማሃ ጠየቀ — አስቸኳይ ነበር' },
          { en:'The signed paper comes later',      am:'የተፈረመው ወረቀት በኋላ ይመጣል' },
          { en:'Taken without asking',              am:'ሳይጠየቅ ተወሰደ' },
          { en:'Nobody allowed it',                 am:'ማንም አልፈቀደም' }
        ], show:{f:'iss_approved', when:'no'}},
      {id:'iss_correct', en:'Did everything go to the correct job?', am:'ሁሉም ለትክክለኛው ሥራ ወጥቷል?', t:'yesno', yes:{en:'All to the right job', am:'ሁሉም ለትክክለኛው ሥራ'}, no:{en:'Something went to another job', am:'ለሌላ ሥራ የወጣ አለ'},
        auto:{all:'iss_list.right'}, show:{f:'iss_any', when:'yes'}},
      {id:'iss_correct_why', en:'Something went to the wrong job. Has it been put right? (Write what and which job in the box.)', am:'ወደ ተሳሳተ ሥራ የሄደ ዕቃ አለ። ተስተካክሏል? (ምንና የትኛው ሥራ እንደሆነ በሳጥኑ ይጻፉ።)', t:'area',
        picks:[
          { en:'Brought back to the store',         am:'ወደ መጋዘን ተመልሷል' },
          { en:'Moved to the right job',            am:'ወደ ትክክለኛው ሥራ ተዛውሯል' },
          { en:'Mahelet was told',                  am:'ለማህሌት ተነግሯል' },
          { en:'Not put right yet',                 am:'ገና አልተስተካከለም' }
        ], show:{f:'iss_correct', when:'no'}},
      {id:'con_today', en:'How many consumable items were issued today?', am:'ዛሬ ስንት የፍጆታ ዕቃ ወጣ?', t:'num',
        auto:{sum:'iss_list.qty', when:{col:'item', is:'Consumables'}}, sumEn:'of them consumables', sumAm:'ከነሱ ፍጆታ ዕቃዎች'}
    ]},
    /* the four totals that used to stand here added sheets, hinges and
       metres of edge banding into one number (the Chairman, 9 Oct 2026:
       "went out what?"). What goes in and out is counted material by
       material on the shelf grid, where it can be added up. Twelve rows of
       three boxes counted as one unanswered question until every row was
       full, so she filled two rows and the report said "not answered": the
       rows she counts are the answer, and the rest are left empty. */
    { en:'What is on the shelf', am:'በመደርደሪያው ላይ ያለው', fields:[
      /* 11 Oct 2026 ("fix all"): twelve materials of three boxes each stood on
         screen every day. Tap the ones counted; only their boxes open. The
         grid keeps its twelve rows in their places (Plant.js, Ops.js and
         Owners.js read row 1 as MDF 18mm), the rows not tapped file empty. */
      {id:'k_counted', en:'Which materials did you count today?', am:'ዛሬ የትኞቹን ዕቃዎች ቆጠሩ?', t:'multi', opt:1,
        none:{ en:'I did not count today', am:'ዛሬ አልቆጠርኩም' },
        opts:[
          { v:'r0', en:'MDF 18mm', am:'ኤምዲኤፍ 18ሚሜ' },
          { v:'r1', en:'MDF 16mm', am:'ኤምዲኤፍ 16ሚሜ' },
          { v:'r2', en:'Melamine 18mm', am:'ሜላሚን 18ሚሜ' },
          { v:'r3', en:'Melamine 16mm', am:'ሜላሚን 16ሚሜ' },
          { v:'r4', en:'Plywood', am:'ፕላይውድ' },
          { v:'r5', en:'Back panel 3mm', am:'የኋላ ሰሌዳ 3ሚሜ' },
          /* added 13 Oct 2026 as the grid's last row, so no row moves */
          { v:'r12', en:'Back panel 6mm', am:'የኋላ ሰሌዳ 6ሚሜ' },
          { v:'r6', en:'Edge banding (m)', am:'ጠርዝ ማሰሪያ (ሜትር)' },
          { v:'r7', en:'Hinges', am:'ማጠፊያዎች' },
          { v:'r8', en:'Drawer slides', am:'የመሳቢያ ተንሸራታቾች' },
          { v:'r9', en:'Handles', am:'መያዣዎች' },
          { v:'r10', en:'Legs and shelf pins', am:'እግሮችና የመደርደሪያ ችንካሮች' },
          { v:'r11', en:'Glue and screws', am:'ሙጫና ብሎኖች' }
        ]},
      {id:'k_stock', en:'Fill in the materials you counted today. Your best guess is fine.',
       am:'ዛሬ የቆጠሩትን ዕቃ ይሙሉ። ግምትዎ በቂ ነው።',
       show:{f:'k_counted', when:'has', v:['r0', 'r1', 'r2', 'r3', 'r4', 'r5', 'r6', 'r7', 'r8', 'r9', 'r10', 'r11', 'r12']},
       rowsOn:'k_counted',
       t:'grid', opt:1, rows:[
        {en:'MDF 18mm', am:'ኤምዲኤፍ 18ሚሜ'},
        {en:'MDF 16mm', am:'ኤምዲኤፍ 16ሚሜ'},
        {en:'Melamine 18mm', am:'ሜላሚን 18ሚሜ'},
        {en:'Melamine 16mm', am:'ሜላሚን 16ሚሜ'},
        {en:'Plywood', am:'ፕላይውድ'},
        {en:'Back panel 3mm', am:'የኋላ ሰሌዳ 3ሚሜ'},
        {en:'Edge banding (m)', am:'ጠርዝ ማሰሪያ (ሜትር)'},
        {en:'Hinges', am:'ማጠፊያዎች'},
        {en:'Drawer slides', am:'የመሳቢያ ተንሸራታቾች'},
        {en:'Handles', am:'መያዣዎች'},
        {en:'Legs and shelf pins', am:'እግሮችና የመደርደሪያ ችንካሮች'},
        {en:'Glue and screws', am:'ሙጫና ብሎኖች'},
        {en:'Back panel 6mm', am:'የኋላ ሰሌዳ 6ሚሜ'}
      ], cols:[
        {id:'qty',  en:'On hand at close', am:'በመዝጊያ ሰዓት ያለ', t:'num'},
        {id:'out', en:'Out today', am:'ዛሬ የወጣ', t:'num'},
        {id:'days', en:'Days it will last', am:'የሚበቃበት ቀን', t:'num'}
      ]},
      /* counted from the list of mismatches (a tap on the list below opens
         it); 0 when the list was answered without that tap. The fine is
         charged from the Friday count, not from this (js/rules.js
         alemaya-stock-discrepancy). */
      {id:'st_disc', en:'How many differences did you find between the record and the shelf?', am:'በመዝገቡና በመደርደሪያው መካከል ስንት ልዩነት ተገኘ?', t:'num',
        auto:{rows:'st_disc_list'},
        tgt:{op:'lte', v:0, en:'–500 Birr each · report same day', am:'እያንዳንዱ –500 ብር · በዕለቱ ማሳወቅ'}},
      /* a running Birr total the store does not keep — no rule reads it, the
         store agent does when it is there */
      {id:'con_mtd', en:'How much has been spent on consumables this month so far? (If you know it.)', am:'በዚህ ወር እስካሁን ለፍጆታ ዕቃ ስንት ብር ወጣ? (ካወቁ።)', t:'money', opt:1,
        tgt:{op:'lte', v:30000, en:'Budget 30,000 Birr/month', am:'የወር በጀት 30,000 ብር'}},
      {id:'con_mtd_why', en:'The month is over 30,000 Birr. What drove it, and has the Chairman approved the extra?', am:'የወሩ ወጪ ከ30,000 ብር አልፏል። ምን አሳደገው? ተጨማሪውን ሊቀመንበሩ ፈቅደዋል?', t:'area',
        picks:[
          { en:'Many blades and bits this month',   am:'በዚህ ወር ብዙ ቢላና ቁፋሮ ወጣ' },
          { en:'Sandpaper and glue',                am:'ሳንድፔፐርና ሙጫ' },
          { en:'A big job',                         am:'ትልቅ ሥራ ነበር' },
          { en:'Prices went up',                    am:'ዋጋ ጨመረ' },
          { en:'The Chairman approved it',          am:'ሊቀመንበሩ ፈቅደዋል' },
          { en:'Not approved yet',                  am:'ገና አልተፈቀደም' }
        ], show:{f:'con_mtd', when:'miss'}}
    ]},
    /* THE ONE LIST. Eight yes/no questions and two counts used to stand in
       sections of their own — the record against the shelf, a shortage, a
       stop, something about to run out, offcuts in and out, the lock, a
       theft, materials kept apart. On a day when none of it happened that
       was ten answers to give, and they were not given. Each question that
       follows opens on its own tap, right under the list. */
    { en:'Anything else today?', am:'ዛሬ ሌላ የሆነ ነገር አለ?', fields:[
      {id:'y_events', en:'What else happened in the store today?', am:'ዛሬ መጋዘኑ ውስጥ ሌላ ምን ሆነ?', t:'multi',
        none:{ en:'Nothing — a normal day', am:'ምንም — የተለመደ ቀን' },
        groups:[
          { v:'short', en:'Running short',      am:'እጥረት' },
          { v:'shelf', en:'The record',         am:'መዝገቡ' },
          { v:'off',   en:'Offcuts',            am:'ቁርጥራጮች' },
          { v:'store', en:'The store',          am:'መጋዘኑ' }
        ],
        opts:[
          { v:'low',        g:'short', en:'Something will run out within 5 days',            am:'በ5 ቀን ውስጥ የሚያልቅ ዕቃ አለ' },
          { v:'short',      g:'short', en:'I had to flag a shortage',                        am:'እጥረት ማሳወቅ አስፈለገኝ' },
          { v:'stopped',    g:'short', en:'Production stopped because something ran out',    am:'ዕቃ በማለቁ ምርት ቆመ' },
          { v:'mismatch',   g:'shelf', en:'Something on the shelf did not match the record', am:'በመደርደሪያው ያለው ከመዝገቡ ጋር ያልተስማማ ዕቃ አለ' },
          { v:'off_in',     g:'off',   en:'Offcuts came back from the factory',              am:'ከፋብሪካ ቁርጥራጭ ተመለሰ' },
          { v:'off_out',    g:'off',   en:'Offcuts went out again for a job',                am:'ቁርጥራጭ ለሥራ ተመልሶ ወጣ' },
          { v:'not_locked', g:'store', en:'The store was not locked at close',               am:'መጋዘኑ በመዝጊያ ሰዓት አልተቆለፈም' },
          { v:'theft',      g:'store', en:'Something was stolen or taken without permission', am:'የተሰረቀ ወይም ያለፈቃድ የወጣ ዕቃ አለ' },
          { v:'mixed',      g:'store', en:'Job materials were mixed with consumables',       am:'የሥራ ዕቃዎች ከፍጆታ ዕቃዎች ጋር ተቀላቅለዋል' }
        ]},

      /* — about to run out. The store agent and the plant manager read the
         yes/no; anything this low has to reach Getachew the same day. */
      {id:'k_low', en:'Will anything run out in 5 days or less?', am:'በ5 ቀን ወይም ከዚያ በፊት የሚያልቅ ዕቃ አለ?', t:'yesno', quiet:1, auto:{picked:'y_events', v:'low'},
        tgt:{op:'lte', v:0, en:'Anything this low has to reach Getachew today, not tomorrow',
             am:'ይህን ያህል ያነሰ ዛሬ ለጌታቸው መድረስ አለበት'}},
      {id:'k_which', en:'What will run out, and was Getachew told today? (Write the material in the box.)', am:'የሚያልቀው ምንድን ነው? ለጌታቸው ዛሬ ተነግሯል? (ዕቃውን በሳጥኑ ይጻፉ።)', t:'area',
        picks:[
          { en:'MDF or melamine board',             am:'ኤምዲኤፍ ወይም ሜላሚን ሰሌዳ' },
          { en:'Edge banding',                      am:'ጠርዝ ማሰሪያ' },
          { en:'Hinges, slides or handles',         am:'ማጠፊያ፣ ተንሸራታች ወይም መያዣ' },
          { en:'Glue and screws',                   am:'ሙጫና ብሎኖች' },
          { en:'Consumables',                       am:'ፍጆታ ዕቃዎች' },
          { en:'Getachew was told today',           am:'ለጌታቸው ዛሬ ተነግሯል' },
          { en:'Not told yet',                      am:'ገና አልተነገረም' }
        ], show:{f:'y_events', when:'has', v:'low'}},

      /* — a shortage flagged */
      {id:'sh_any', en:'Did you have to flag a shortage today?', am:'ዛሬ እጥረት ማሳወቅ አስፈልጓል?', t:'yesno', quiet:1, auto:{picked:'y_events', v:'short'}},
      {id:'sh_list', en:'Each material that is short, and who is waiting on it', am:'ያጠረ እያንዳንዱ ዕቃና የሚጠብቀው ሥራ', t:'table', addEn:'Add a shortage', addAm:'እጥረት ጨምር',
        show:{f:'sh_any', when:'yes'},
        cols:[
          {id:'item', en:'Material', am:'ዕቃ', t:'choice', opts:MATERIAL_OPTS},
          {id:'colour', en:'Colour code', am:'የቀለም ኮድ', t:'colour', of:'item'},
          {id:'code', en:'Jobs waiting on it', am:'የሚጠብቁት ሥራዎች', t:'text'},
          {id:'told', en:'Told to', am:'የተነገረው ለ', t:'text', picks:[{ en:'Getachew', am:'ጌታቸው' }, { en:'Mahelet', am:'ማህሌት' }, { en:'Amaha', am:'አማሃ' }]},
          {id:'due', en:'Expected in', am:'የሚጠበቅበት ቀን', t:'date'}
        ]},
      {id:'sh_flagged', en:'How many shortages did you flag today?', am:'ዛሬ ስንት እጥረት ጠቆሙ?', t:'num',
        auto:{rows:'sh_list'}, sumEn:'shortages flagged', sumAm:'የታወቁ እጥረቶች'},
      /* named, not counted: the morning agents and the Chairman's line read
         which materials are short and who is waiting on whom, and the rows
         already say both (apps-script/Agents.js WAIT_FIELDS_). Shown only
         with the rows: on a day with no shortage they read "—". */
      {id:'sh_what', en:'Which materials are short?', am:'የትኞቹ ዕቃዎች አጥረዋል?', t:'text',
        auto:{list:'sh_list.item'}, show:{f:'sh_any', when:'yes'}},
      {id:'sh_flagged_who', en:'Who was told, and when is each expected in?', am:'ለማን ተነገረ? እያንዳንዱ መቼ ይደርሳል?', t:'text',
        auto:{list:'sh_list.told'}, show:{f:'sh_any', when:'yes'}},

      /* — production stopped. An alert goes to Mahelet and Getachew on "yes"
         (apps-script/Code.js, Owners.js). */
      {id:'sh_stopped', en:'Did production stop today because something ran out?', am:'ዛሬ አንድ ዕቃ በማለቁ ምርት ቆሟል?', t:'yesno', quiet:1, auto:{picked:'y_events', v:'stopped'}},
      {id:'sh_stopped_what', en:'How long did it stop, and had the shortage been flagged before? (Write the job and the material in the box.)', am:'ለምን ያህል ጊዜ ቆመ? እጥረቱ ቀድሞ ተነግሮ ነበር? (ሥራውንና ዕቃውን በሳጥኑ ይጻፉ።)', t:'area',
        picks:[
          { en:'Stopped less than an hour',         am:'ከአንድ ሰዓት ያነሰ ቆመ' },
          { en:'Stopped half a day',                am:'ግማሽ ቀን ቆመ' },
          { en:'Stopped all day',                   am:'ሙሉ ቀን ቆመ' },
          { en:'It had been flagged before',        am:'ቀድሞ ተነግሮ ነበር' },
          { en:'It had not been flagged',           am:'ቀድሞ አልተነገረም ነበር' }
        ], show:{f:'sh_stopped', when:'yes'}},

      /* — the record against the shelf (the count stands above, under the
         shelf grid) */
      {id:'st_any', en:'Did anything on the shelf not match the record today?', am:'ዛሬ በመደርደሪያው ላይ ከመዝገቡ ጋር ያልተስማማ ነገር አለ?', t:'yesno', quiet:1, auto:{picked:'y_events', v:'mismatch'}},
      {id:'st_disc_list', en:'What does not match?', am:'የማይስማማው ምንድን ነው?', t:'table', addEn:'Add an item', addAm:'ዕቃ ጨምር',
        show:{f:'st_any', when:'yes'},
        cols:[
          {id:'item', en:'Material', am:'ዕቃ', t:'choice', opts:MATERIAL_OPTS},
          {id:'colour', en:'Colour code', am:'የቀለም ኮድ', t:'colour', of:'item'},
          {id:'book', en:'On record', am:'በመዝገብ', t:'num'},
          {id:'shelf', en:'On the shelf', am:'በመደርደሪያ', t:'num'},
          {id:'why', en:'Likely reason', am:'ሊሆን የሚችል ምክንያት', t:'text', picks:COL_STOCK_DIFF},
          {id:'told', en:'Mahelet and Selam told today?', am:'ለማህሌትና ለሰላም ዛሬ ተነግሯል?', t:'yesno', yes:{en:'Both told today', am:'ሁለቱም ዛሬ ተነግሯቸዋል'}, no:{en:'Not told yet', am:'ገና አልተነገራቸውም'}}
        ]},

      /* — offcuts. A real 0 on a normal day: the reader that puts the store
         beside the factory compares what came back with the offcuts Amaha
         sent (apps-script/Agents.js contradictions). */
      {id:'k_offin', en:'How many m² of offcuts came back from the factory today?', am:'ዛሬ ከፋብሪካ ስንት ካሬ ሜትር ቁርጥራጭ ተመለሰ?', t:'num', zero:1,
        show:{f:'y_events', when:'has', v:'off_in'}},
      {id:'k_offout', en:'How many m² of offcuts went back out for a job?', am:'ስንት ካሬ ሜትር ቁርጥራጭ ለሥራ ተመልሶ ወጣ?', t:'num', zero:1,
        show:{f:'y_events', when:'has', v:'off_out'}},

      /* — the store itself. A theft is a broken rule in the Chairman's brief
         and an alert (apps-script/Agents.js BROKEN_, Code.js); a store left
         open is in the month's audit (Readers.js). */
      {id:'sec_locked', en:'Was the store locked and secure at close?', am:'መጋዘኑ በመዝጊያ ሰዓት ተቆልፎ ደህንነቱ ተጠብቆ ነበር?', t:'yesno', quiet:1, auto:{picked:'y_events', v:'not_locked', flip:1}},
      {id:'sec_locked_why', en:'Why not? (Write who holds the key tonight in the box.)', am:'ለምን? (ዛሬ ማታ ቁልፉ ማን ጋር እንዳለ በሳጥኑ ይጻፉ።)', t:'area',
        picks:[
          { en:'The lock is broken',                am:'ቁልፉ ተበላሽቷል' },
          { en:'The key holder left early',         am:'ቁልፍ የያዘው ሰው ቀድሞ ወጣ' },
          { en:'Work went on late',                 am:'ሥራው እስከ ማታ ቀጠለ' },
          { en:'Forgot',                            am:'ረሳሁ' },
          { en:'Locked now',                        am:'አሁን ተቆልፏል' }
        ], show:{f:'sec_locked', when:'no'}},
      {id:'sec_theft', en:'Was anything stolen or taken out without permission?', am:'የተሰረቀ ወይም ያለፈቃድ የወጣ ዕቃ አለ?', t:'yesno', quiet:1, auto:{picked:'y_events', v:'theft'}},
      {id:'sec_theft_what', en:'What was taken, and were Mahelet and Selam told? (Write how much, what it is worth and who is involved in the box.)', am:'ምን ተወሰደ? ለማህሌትና ለሰላም ተነግሯል? (ምን ያህል፣ ዋጋውንና ማን እንደተሳተፈ በሳጥኑ ይጻፉ።)', t:'area',
        picks:[
          { en:'Board',                             am:'ሰሌዳ' },
          { en:'Hardware',                          am:'ሃርድዌር' },
          { en:'Tools',                             am:'መሣሪያዎች' },
          { en:'Consumables',                       am:'ፍጆታ ዕቃዎች' },
          { en:'Mahelet and Selam were told',       am:'ለማህሌትና ለሰላም ተነግሯል' },
          { en:'Not told yet',                      am:'ገና አልተነገረም' }
        ], show:{f:'sec_theft', when:'yes'}},
      {id:'sec_sep', en:'Are job materials kept apart from consumables?', am:'የሥራ ዕቃዎች ከፍጆታ ዕቃዎች ተለይተው ተቀምጠዋል?', t:'yesno', quiet:1, auto:{picked:'y_events', v:'mixed', flip:1}}
    ]},
    { en:'Problems and help', am:'ችግርና እርዳታ', fields:[
      {id:'problem', en:'What was the biggest problem in the store today?', am:'በመጋዘኑ የዛሬው ትልቁ ችግር ምን ነበር?', t:'area', opt:1,
        picks:[
          { en:'No big problem today',              am:'ዛሬ ትልቅ ችግር አልነበረም' },
          { en:'A delivery came late or short',     am:'ጭነት ዘግይቶ ወይም ጎድሎ መጣ' },
          { en:'Material taken without a signature', am:'ያለ ፊርማ ዕቃ ተወሰደ' },
          { en:'The record and the shelf differ',   am:'መዝገቡና መደርደሪያው አይስማሙም' },
          { en:'No space on the shelves',           am:'በመደርደሪያው ላይ ቦታ የለም' },
          { en:'Something is running out',          am:'የሚያልቅ ዕቃ አለ' }
        ]},
      {id:'need_help', en:'What do you need, and from whom?', am:'ምን ያስፈልግዎታል? ከማን?', t:'area', opt:1,
        picks:[
          { en:'Nothing needed',                    am:'ምንም አያስፈልግም', nil:1 },
          { en:'A purchase (Getachew)',             am:'ግዢ (ጌታቸው)' },
          { en:'Signed approvals (Mahelet)',        am:'የተፈረመ ፈቃድ (ማህሌት)' },
          { en:'Prices for the consumables (Selam)', am:'ለፍጆታ ዕቃ ገንዘብ (ሰላም)' },
          { en:'Shelves or space',                  am:'መደርደሪያ ወይም ቦታ' },
          { en:'A lock or a key',                   am:'ቁልፍ' }
        ]},
      {id:'need_chair', en:'Do you need a decision from the Chairman?', am:'የሊቀመንበሩ ውሳኔ ያስፈልግዎታል?', t:'yesno', yes:{en:'I need a decision', am:'ውሳኔ ያስፈልገኛል'}, no:{en:'No decision needed', am:'ውሳኔ አያስፈልገኝም'}},
      {id:'need_chair_what', en:'What should the Chairman decide, and by when? (Write the options in the box.)', am:'ሊቀመንበሩ ምን መወሰን አለባቸው? እስከ መቼ? (አማራጮቹን በሳጥኑ ይጻፉ።)', t:'area',
        picks:[
          { en:'Approve extra consumables',         am:'ተጨማሪ ፍጆታ ዕቃ ማጽደቅ' },
          { en:'What to do about missing stock',    am:'በጎደለ ዕቃ ላይ ምን እንደሚደረግ' },
          { en:'More store space or shelves',       am:'ተጨማሪ የመጋዘን ቦታ ወይም መደርደሪያ' },
          { en:'Needed today',                      am:'ዛሬ ያስፈልጋል' },
          { en:'Needed this week',                  am:'በዚህ ሳምንት ያስፈልጋል' }
        ], show:{f:'need_chair', when:'yes'}}
    ]},
    { en:'Tomorrow', am:'ነገ', fields:[
      {id:'tomorrow', en:'What must be received, counted or chased tomorrow? (Write the job codes or materials in the box.)', am:'ነገ ምን መረከብ፣ መቆጠር ወይም መከታተል አለበት? (የሥራ ኮዶቹን ወይም ዕቃዎቹን በሳጥኑ ይጻፉ።)', t:'area',
        picks:[
          { en:'Receive a delivery',                am:'ጭነት መረከብ' },
          { en:'Count the stock',                   am:'ዕቃ መቁጠር' },
          { en:'Chase a late supplier with Getachew', am:'የዘገየ አቅራቢን ከጌታቸው ጋር መከታተል' },
          { en:'Issue material for a job',          am:'ለሥራ ዕቃ ማውጣት' },
          { en:'Get missing signatures',            am:'የጎደሉ ፊርማዎችን ማሟላት' }
        ]}
    ]}
  ]
},

/* ========================= EPHRATA — WEEKLY ========================= */
{
  id:'ephrata-weekly', person:'ephrata', cadence:'weekly', built:1, dueTime:'16:00', dueDay:6,
  en:'Weekly Commercial Report', am:'ሳምንታዊ የንግድ ሪፖርት',
  toEn:'Chairman', toAm:'ሊቀመንበር',
  dueEn:'Saturday 4:00 PM', dueAm:'ቅዳሜ ከቀኑ 10፡00 (4:00 PM)',
  penEn:'Late or not sent –500 Birr', penAm:'ዘግይቶ ወይም ካልቀረበ –500 ብር',
  sections:[
    /* REBUILT 11 Oct 2026 (the Chairman: "they are struggling so much with
       the questions"). Ephrata's first weekly (10 Oct) left 12 of 31
       questions empty: the quotations within 48 hours, every "why" box, the
       WhatsApp violations, the Chairman's decision, all of next week and
       the 4-week consequence. 25 questions stood before any follow-up
       opened. Now a normal week is the money collected, the leads, the
       marketing contracts, one tap on "nothing else happened", next week
       and the 4-week total. The groups and the WhatsApp violations come
       from her own daily reports; the Job Files, internal money, late
       leads and late quotations are asked only when the list says they
       happened. Every answer key is the one it always was. Every "why" is
       buttons now, with a box for the customer's name. */
    { en:'Sales this week', am:'የዚህ ሳምንት ሽያጭ', fields:[
      /* The week's contracts were typed out here a second time, each one
         already a row in the daily report that signed it (the Chairman,
         9 Oct 2026). They gather themselves, and the two figures follow. */
      {id:'w_contracts_list', en:'Each contract signed this week', am:'በዚህ ሳምንት የተፈረመ እያንዳንዱ ውል', t:'table',
        auto:{weekRows:'contracts_list', dayCol:'day'},
        cols:[
          {id:'day', en:'Signed on', am:'የተፈረመበት', t:'text'},
          {id:'cust', en:'Customer', am:'ደንበኛ', t:'text'},
          {id:'lc', en:'Lead no. (4 digits)', am:'የደንበኛ ቁጥር (4 አሃዝ)', t:'text'},
          {id:'code', en:'Job code', am:'የሥራ ኮድ', t:'text'},
          {id:'value', en:'Contract value', am:'የውል ዋጋ', t:'money'},
          {id:'adv', en:'Advance paid', am:'የተከፈለ ቅድመ ክፍያ', t:'money'},
          {id:'margin', en:'Margin per m²', am:'ህዳግ በካሬ ሜትር', t:'money'},
          {id:'sp', en:'Salesperson', am:'ሻጭ', t:'text'}
        ]},
      {id:'w_contracts', en:'How many contracts were signed this week?', am:'በዚህ ሳምንት ስንት ውል ተፈረመ?', t:'num',
        auto:{rows:'w_contracts_list'}, sumEn:'contracts', sumAm:'ውሎች'},
      {id:'w_value', en:'What is the total value of this week\'s contracts?', am:'የዚህ ሳምንት ውሎች ጠቅላላ ዋጋ ስንት ነው?', t:'money',
        auto:{sum:'w_contracts_list.value'}, sumEn:'signed', sumAm:'የተፈረመ'},
      {id:'w_adv', en:'How much advance came with them?', am:'ከነሱ ጋር ስንት ቅድመ ክፍያ ገባ?', t:'money',
        auto:{sum:'w_contracts_list.adv'}, sumEn:'in advances', sumAm:'በቅድመ ክፍያ'},
      /* her commission is paid on this figure (rulebook), so it stays asked */
      {id:'w_external', en:'How much was collected from external customers this week?', am:'በዚህ ሳምንት ከውጭ ደንበኞች ስንት ብር ተሰበሰበ?', t:'money', auto:{week:'collected_today', from:'ephrata-daily'},
        tgt:{op:'gte', v:3000000, en:'Below 3,000,000 Birr is a failed week — no commission',
             am:'ከ3,000,000 ብር በታች ከሆነ ሳምንቱ ወድቋል — ኮሚሽን የለም'}},
      {id:'w_external_why', en:'Under 3,000,000 Birr this week. Why? Was it beyond your control?', am:'ሳምንቱ ከ3,000,000 ብር በታች ነው። ለምን? ከቁጥጥርዎ ውጭ ነበር?', t:'area', auto:{weekText:'week_gap', from:'ephrata-daily'},
        picks:[
          { en:'A holiday',                              am:'በዓል' },
          { en:'Supplier shutdown',                      am:'የአቅራቢ መዘጋት' },
          { en:'A customer refused or delayed paying',   am:'ደንበኛ ለመክፈል እምቢ አለ ወይም አዘገየ' },
          { en:'Payments moved to next week',            am:'ክፍያዎች ወደ ሚቀጥለው ሳምንት ተዛወሩ' },
          { en:'Few contracts signed',                   am:'የተፈረሙ ውሎች ጥቂት ናቸው' },
          { en:'Final payments waiting on installation', am:'የመጨረሻ ክፍያዎች ተከላን እየጠበቁ ነው' }
        ], show:{f:'w_external', when:'miss'}},
      {id:'w_internal', en:'How much came in from internal (sister-company) work this week?', am:'በዚህ ሳምንት ከውስጥ (ከእህት ኩባንያ) ሥራ ስንት ብር ገባ?', t:'money',
        show:{f:'w_events', when:'has', v:'internal'}},
      {id:'w_target_met', en:'Did the week reach 6,000,000 Birr?', am:'ሳምንቱ 6,000,000 ብር ደረሰ?', t:'yesno', yes:{en:'Reached it', am:'ደርሷል'}, no:{en:'Fell short', am:'አልደረሰም'}},
      {id:'w_jobfiles', en:'How many Job Files sent to Mahelet this week were complete? (complete / sent)', am:'በዚህ ሳምንት ወደ ማህሌት ከተላኩ የሥራ ፋይሎች ስንቱ የተሟሉ ነበሩ? (የተሟሉ / የተላኩ)', t:'ratio', auto:{a:{week:'jf_acc', from:'liu-daily'}, b:{plus:[{week:'jf_acc', from:'liu-daily'}, {week:'jf_rej', from:'liu-daily'}]}},
},
      {id:'w_jobfiles_why', en:'What was missing, and has it been sent now? (Write the jobs in the box.)', am:'ምን ጎደለ? አሁን ተልኳል? (ሥራዎቹን በሳጥኑ ይጻፉ።)', t:'area',
        picks:[
          { en:'Measurements',                           am:'ልኬት' },
          { en:'The signed design',                      am:'የተፈረመው ዲዛይን' },
          { en:'Material and colour choices',            am:'የዕቃና የቀለም ምርጫ' },
          { en:'Appliance details',                      am:'የኤሌክትሪክ ዕቃዎች መረጃ' },
          { en:'Payment proof',                          am:'የክፍያ ደረሰኝ' },
          { en:'Sent complete now',                      am:'አሁን ተሟልቶ ተልኳል' },
          { en:'Not sent yet',                           am:'ገና አልተላከም' }
        ], show:{f:'w_jobfiles', when:'short'}}
    ]},
    /* THE ONE LIST: what happens only some weeks. */
    { en:'Anything else this week?', am:'በዚህ ሳምንት ሌላ የሆነ ነገር አለ?', fields:[
      {id:'w_events', en:'What else happened this week?', am:'በዚህ ሳምንት ሌላ ምን ሆነ?', t:'multi',
        none:{ en:'Nothing — a normal week', am:'ምንም — የተለመደ ሳምንት' },
        groups:[
          { v:'sales', en:'Sales',                  am:'ሽያጭ' },
          { v:'leads', en:'Leads and quotations',   am:'ደንበኞችና ፕሮፎርማ' },
          { v:'cust',  en:'Customers',              am:'ደንበኞች' }
        ],
        opts:[
          { v:'internal',   g:'sales', en:'Money came in from sister-company work',        am:'ከእህት ኩባንያ ሥራ ገንዘብ ገባ' },
          { v:'jf',         g:'sales', en:'A Job File went to Mahelet incomplete',          am:'ያልተሟላ የጆብ ፋይል ወደ ማህሌት ሄደ' },
          { v:'lead_late',  g:'leads', en:'A new lead waited more than 24 hours for a call', am:'ከ24 ሰዓት በላይ ሳይደወልለት የቆየ አዲስ ደንበኛ ነበር' },
          { v:'quote_late', g:'leads', en:'A quotation went out more than 48 hours after measuring', am:'ልኬት ከተወሰደ ከ48 ሰዓት በኋላ የተሰጠ ፕሮፎርማ ነበር' },
          { v:'complaint',  g:'cust',  en:'A customer complained',                          am:'ደንበኛ ቅሬታ አቀረበ' }
        ]}
    ]},
    { en:'Leads and quotations', am:'ደንበኞችና ፕሮፎርማ', fields:[
      {id:'w_leads', en:'How many new leads came in this week?', am:'በዚህ ሳምንት ስንት አዲስ ደንበኞች መጡ?', t:'num', auto:{plus:[{week:'l_total', from:'tsega-sales-daily'}, {week:'l_total', from:'biruktayet-sales-daily'}]},},
      {id:'w_leads_1hr', en:'New leads this week: how many were called within 24 hours? (called within 24 hours / all new leads this week)', am:'በዚህ ሳምንት አዲስ የመጡ ደንበኞች፦ ስንቱ በ24 ሰዓት ውስጥ ተደወለላቸው? (በ24 ሰዓት ውስጥ የተደወለላቸው / በዚህ ሳምንት የመጡ አዲስ ደንበኞች በሙሉ)', t:'ratio', auto:{a:{plus:[{week:'r_1hr__a', from:'tsega-sales-daily'}, {week:'r_1hr__a', from:'biruktayet-sales-daily'}]}, b:{plus:[{week:'r_1hr__b', from:'tsega-sales-daily'}, {week:'r_1hr__b', from:'biruktayet-sales-daily'}]}}, show:{f:'w_leads', when:'pos'}, whole:'w_leads',
},
      {id:'w_leads_1hr_why', en:'Why were they missed? (Write the leads and whose they were in the box.)', am:'ለምን አመለጡ? (ደንበኞቹንና የማን እንደነበሩ በሳጥኑ ይጻፉ።)', t:'area',
        picks:[
          { en:'Came in at night or on Sunday',          am:'ማታ ወይም እሁድ ነው የመጡት' },
          { en:'The salesperson was busy',               am:'ሻጩ ሥራ በዝቶበት ነበር' },
          { en:'The salesperson was absent',             am:'ሻጩ አልነበረም' },
          { en:'Wrong phone number',                     am:'የተሳሳተ ስልክ ቁጥር' },
          { en:'The customer did not answer',            am:'ደንበኛው ስልኩን አላነሳም' },
          { en:'Forgot',                                 am:'ተረስቷል' }
        ], show:{f:'w_leads_1hr', when:'short'}},
      {id:'w_visits', en:'How many pre-measurement visits were done this week?', am:'በዚህ ሳምንት ስንት የቅድመ ልኬት ጉብኝት ተካሄደ?', t:'num', auto:{week:'visits_done'}},
      {id:'w_quotes', en:'How many quotations went out this week?', am:'በዚህ ሳምንት ስንት ፕሮፎርማ ተሰጠ?', t:'num', auto:{week:'quotes_issued'}},
      {id:'w_quotes_48h', en:'How many went out within 48 hours of measuring? (on time / all quotations)', am:'ስንቱ ልኬት በተወሰደ በ48 ሰዓት ውስጥ ተሰጠ? (በሰዓቱ / ሁሉም)', t:'ratio',
        show:{f:'w_events', when:'has', v:'quote_late'}},
      {id:'w_quotes_48h_why', en:'What held them up? (Write the customers in the box.)', am:'ምን ያዛቸው? (ደንበኞቹን በሳጥኑ ይጻፉ።)', t:'area', auto:{weekText:'quotes_late_why', from:'ephrata-daily'},
        picks:[
          { en:'Design not ready',                       am:'ዲዛይኑ አልተዘጋጀም' },
          { en:'Waiting for material prices',            am:'የዕቃ ዋጋ ጠበቅን' },
          { en:'The customer changed the design',        am:'ደንበኛው ዲዛይኑን ቀየረ' },
          { en:'Measurement to be taken again',          am:'ልኬቱ እንደገና መወሰድ አለበት' },
          { en:'Too much work this week',                am:'በዚህ ሳምንት ሥራ በዛ' }
        ],},
      {id:'w_conv', en:'What share of this week\'s leads became contracts?', am:'በዚህ ሳምንት ከመጡት ደንበኞች ስንት በመቶው ውል ፈረሙ?', t:'pct',
        auto:{pct:['w_contracts', 'w_leads']}}
    ]},
    { en:'Margin', am:'ትርፍ እንዴት ሄደ', fields:[
      {id:'w_margin', en:'What was the average margin per m² on this week\'s external contracts?', am:'የዚህ ሳምንት የውጭ ውሎች አማካይ ህዳግ በካሬ ሜትር ስንት ነው?', t:'num',
        auto:{div:[{sum:'w_contracts_list.margin'}, {rows:'w_contracts_list', when:{col:'margin'}}]},
        tgt:{op:'gte', v:6000, en:'Margin floor 6,000 Birr/m²', am:'ዝቅተኛው ህዳግ 6,000 ብር በካሬ'}},
      {id:'w_below_margin', en:'How many contracts were signed below the margin floor?', am:'ከህዳጉ በታች ስንት ውል ተፈረመ?', t:'num',
        auto:{rows:'w_contracts_list', when:{col:'margin', lt:6000}},
        tgt:{op:'lte', v:0, en:'–5,000 Birr each without Chairman approval',
             am:'ያለ ሊቀመንበር ፈቃድ እያንዳንዱ –5,000 ብር'}},
      {id:'w_below_margin_list', en:'Which of them, and who approved it', am:'የትኞቹ ናቸው? ማን አጸደቀው?', t:'table', auto:{weekRows:'contracts_list', from:'ephrata-daily', when:{col:'margin', lt:6000}}, addEn:'Add a contract', addAm:'ውል ጨምር',
        show:{f:'w_below_margin', when:'pos'},
        cols:[
          {id:'cust', en:'Customer', am:'ደንበኛ', t:'text'},
          {id:'code', en:'Job code', am:'የሥራ ኮድ', t:'text'},
          {id:'margin', en:'Margin per m²', am:'ህዳግ በካሬ ሜትር', t:'money'},
          {id:'ok', en:'Chairman approved', am:'ሊቀመንበሩ አጽድቀዋል', t:'yesno', yes:{en:'Approved', am:'ፈቅደዋል'}, no:{en:'Not approved', am:'አልፈቀዱም'}}
        ]}
    ]},
    { en:'WhatsApp', am:'ዋትስአፕ', fields:[
      /* her daily report counts the active groups every day */
      {id:'w_wa_groups', en:'How many customer groups were active this week?', am:'በዚህ ሳምንት ስንት የደንበኛ ግሩፖች ንቁ ነበሩ?', t:'num', auto:{week:'wa_groups', how:'max'}},
      {id:'w_wa_msgs', en:'How many required stage messages were posted? (posted / required)', am:'ከሚገባው የደረጃ መልዕክት ስንቱ ተላከ? (የተላከ / የሚገባው)', t:'ratio', auto:{a:{week:'wa_stage__a'}, b:{week:'wa_stage__b'}}},
      {id:'w_wa_msgs_why', en:'Which groups missed a stage message, and why? (Write the groups and whose they are in the box.)', am:'የደረጃ መልዕክት ያልደረሳቸው የትኞቹ ግሩፖች ናቸው? ለምን? (ግሩፖቹንና የማን እንደሆኑ በሳጥኑ ይጻፉ።)', t:'area', auto:{weekText:'wa_stage_why', from:'ephrata-daily'},
        picks:[
          { en:'Forgot',                                 am:'ተረስቷል' },
          { en:'The salesperson was absent',             am:'ሻጩ አልነበረም' },
          { en:'The designer did not post',              am:'ዲዛይነሩ አልለጠፈም' },
          { en:'Posted late, not missed',                am:'ዘግይቶ ተላከ እንጂ አልቀረም' },
          { en:'The group was not set up yet',           am:'ግሩፑ ገና አልተከፈተም' }
        ], show:{f:'w_wa_msgs', when:'short'}},
      {id:'w_wa_rate', en:'What was the compliance rate this week?', am:'ከሚገባው መልዕክት ስንት በመቶውን ላኩ?', t:'pct',
        auto:{pct:['w_wa_msgs__a', 'w_wa_msgs__b']},
        tgt:{op:'gte', v:100, en:'100% required for the team bonus', am:'ለቡድን ቦነስ 100% መሆን አለበት'}},
      {id:'w_wa_unans', en:'How many messages waited more than 2 hours for an answer?', am:'ከ2 ሰዓት በላይ ምላሽ ሳያገኙ የቆዩ መልዕክቶች ስንት ናቸው?', t:'num', auto:{week:'wa_unanswered'}},
      {id:'w_wa_unans_why', en:'Who should have answered, and what was done? (Write the customers in the box.)', am:'መመለስ የነበረበት ማን ነበር? ምን እርምጃ ተወሰደ? (ደንበኞቹን በሳጥኑ ይጻፉ።)', t:'area', auto:{weekText:'wa_unanswered_why', from:'ephrata-daily'},
        picks:[
          { en:'A salesperson',                          am:'ሻጭ' },
          { en:'A designer',                             am:'ዲዛይነር' },
          { en:'Operations (Mahelet)',                   am:'ኦፕሬሽን (ማህሌት)' },
          { en:'Answered now',                           am:'አሁን ምላሽ ተሰጥቷል' },
          { en:'Warned',                                 am:'ማስጠንቀቂያ ተሰጠ' },
          { en:'Fined –200 Birr',                        am:'–200 ብር ተቀጥቷል' }
        ], show:{f:'w_wa_unans', when:'pos'}},
      {id:'w_wa_complaints', en:'How many customers complained about WhatsApp handling?', am:'ስንት ደንበኞች በዋትስአፕ አያያዝ ላይ ቅሬታ አቀረቡ?', t:'num', auto:{week:'wa_complaints'}},
      {id:'w_wa_complaints_what', en:'What was the complaint, and how was it resolved? (Write the customer in the box.)', am:'ቅሬታው ምን ነበር? እንዴት ተፈታ? (ደንበኛውን በሳጥኑ ይጻፉ።)', t:'area', auto:{weekText:'wa_complaints_what', from:'ephrata-daily'},
        picks:[
          { en:'No answer for hours',                    am:'ለሰዓታት መልስ አልተሰጠም' },
          { en:'Wrong or missing information',           am:'የተሳሳተ ወይም የጎደለ መረጃ' },
          { en:'Rude message',                           am:'ጨዋነት የጎደለው መልዕክት' },
          { en:'Called and apologised',                  am:'ተደውሎ ይቅርታ ተጠየቀ' },
          { en:'Resolved',                               am:'ተፈቷል' },
          { en:'Still open',                             am:'ገና አልተፈታም' }
        ], show:{f:'w_wa_complaints', when:'pos'}},
      /* Left empty on the first weekly. Her daily report already counts the
         team members who broke the WhatsApp rules each day (wa_violations);
         the week adds them up, and 3 or more cancels the month's team bonus
         (rulebook). */
      {id:'w_wa_viol', en:'How many times did the team break the WhatsApp rules this week?', am:'ቡድኑ በዚህ ሳምንት ስንት ጊዜ የዋትስአፕ ደንብ ጣሰ?', t:'num', auto:{week:'wa_violations'}},
      {id:'w_wa_viol_who', en:'What happened, and what penalty was given? (Write who in the box.)', am:'ምን ሆነ? ምን ቅጣት ተሰጠ? (ማን እንደሆነ በሳጥኑ ይጻፉ።)', t:'area', auto:{weekText:'wa_violations_who', from:'ephrata-daily'},
        picks:[
          { en:'Late answer',                            am:'የዘገየ መልስ' },
          { en:'Stage message missed',                   am:'የደረጃ መልዕክት ቀረ' },
          { en:'Unprofessional message',                 am:'ሙያዊ ያልሆነ መልዕክት' },
          { en:'Warned',                                 am:'ማስጠንቀቂያ ተሰጠ' },
          { en:'Fined',                                  am:'ተቀጣ' },
          { en:'Not dealt with yet',                     am:'ገና አልተያዘም' }
        ], show:{f:'w_wa_viol', when:'pos'}}
    ]},
    { en:'Marketing', am:'ማርኬቲንግ', fields:[
      {id:'w_posts', en:'How many posts went up this week?', am:'በዚህ ሳምንት ስንት ፖስት ተለጠፈ?', t:'num', auto:{week:'posts'},
        tgt:{op:'gte', v:3, en:'At least 3 per week — –300 Birr per missed post',
             am:'በሳምንት ቢያንስ 3 — ላልተለጠፈ እያንዳንዱ –300 ብር'}},
      {id:'w_posts_why', en:'Fewer than 3 posts. Why, and on which days will next week\'s go up?', am:'ከ3 ያነሰ ፖስት ነው። ለምን? የሚቀጥለው ሳምንት ፖስቶች በየትኞቹ ቀናት ይለጠፋሉ?', t:'area',
        picks:[
          { en:'No photos of finished work',             am:'የተጠናቀቀ ሥራ ፎቶ አልነበረም' },
          { en:'No time',                                am:'ጊዜ አልነበረም' },
          { en:'Waiting for the designer',               am:'ዲዛይነሩን ጠበቅን' },
          { en:'No internet',                            am:'ኢንተርኔት አልነበረም' },
          { en:'Monday, Wednesday and Friday next week', am:'በሚቀጥለው ሳምንት ሰኞ፣ ረቡዕና ዓርብ' }
        ], show:{f:'w_posts', when:'miss'}},
      {id:'w_fb', en:'On Facebook', am:'በፌስቡክ', t:'num', i:1, auto:{week:'posts_fb'}},
      {id:'w_ig', en:'On Instagram', am:'በኢንስታግራም', t:'num', i:1, auto:{week:'posts_ig'}},
      {id:'w_tt', en:'On TikTok', am:'በቲክቶክ', t:'num', i:1, auto:{week:'posts_tt'}},
      {id:'w_inq', en:'How many social media inquiries came in?', am:'ከሶሻል ሚዲያ ስንት ጥያቄዎች ደረሱ?', t:'num',
        auto:{week:'inq'}},
      {id:'w_inq_1hr', en:'How many of them were answered within 1 hour?', am:'ከእነርሱ ስንቱ በ1 ሰዓት ውስጥ ምላሽ አገኙ?', t:'num',
        auto:{week:'inq_1hr__a'}},
      {id:'w_mkt_leads', en:'How many qualified leads came from marketing this week?', am:'በዚህ ሳምንት ከማርኬቲንግ ስንት ብቁ ደንበኞች መጡ?', t:'num',
        auto:{week:'mkt_leads'},
        tgt:{op:'gte', v:15, en:'15 or more earns 1,000 Birr', am:'15 እና ከዚያ በላይ 1,000 ብር ያስገኛል'}},
      {id:'w_mkt_leads_plan', en:'What will change next week to bring in more leads?', am:'ተጨማሪ ደንበኞች እንዲመጡ በሚቀጥለው ሳምንት ምን ይቀየራል?', t:'area', opt:1,
        picks:[
          { en:'More posts',                             am:'ተጨማሪ ፖስቶች' },
          { en:'Videos of finished kitchens',            am:'የተጠናቀቁ ኪችኖች ቪዲዮ' },
          { en:'Boost a post (paid)',                    am:'ፖስት በክፍያ ማስተዋወቅ' },
          { en:'Answer inquiries faster',                am:'ጥያቄዎችን በፍጥነት መመለስ' },
          { en:'Ask happy customers to send friends',    am:'የረኩ ደንበኞች ወዳጆቻቸውን እንዲልኩ መጠየቅ' }
        ], show:{f:'w_mkt_leads', when:'miss'}},
      /* a monthly bonus adds these up (rulebook), so it stays asked */
      {id:'w_mkt_contracts', en:'How many contracts this week came from marketing leads? (0 if none.)', am:'በዚህ ሳምንት ከማርኬቲንግ ደንበኞች ስንት ውል ተገኘ? (ከሌለ 0።)', t:'num'}
    ]},
    { en:'Customer satisfaction', am:'የደንበኛ እርካታ', fields:[
      {id:'w_comp_any', en:'Did any complaint come in this week?', am:'በዚህ ሳምንት የደረሰ ቅሬታ አለ?', t:'yesno', quiet:1, auto:{picked:'w_events', v:'complaint'}},
      {id:'w_comp_list', en:'List each complaint', am:'እያንዳንዱን ቅሬታ ይዘርዝሩ', t:'table', addEn:'Add a complaint', addAm:'ቅሬታ ጨምር',
        show:{f:'w_comp_any', when:'yes'},
        cols:[
          {id:'cust', en:'Customer', am:'ደንበኛ', t:'text'},
          {id:'lc', en:'Customer code: 4-digit lead no., or KK code once paid', am:'የደንበኛ ኮድ፦ ባለ 4 አሃዝ ቁጥር፣ ከከፈሉ በኋላ KK ኮድ', t:'text'},
          {id:'what', en:'Complaint', am:'ቅሬታው', t:'text', picks:COL_COMPLAINT},
          {id:'owner', en:'Being fixed by', am:'የሚያስተካክለው', t:'text', picks:COL_DEPT},
          {id:'state', en:'Status', am:'ሁኔታ', t:'choice', opts:[
            {v:'resolved', en:'Resolved', am:'ተፈቷል'},
            {v:'open', en:'Still open', am:'ገና አልተፈታም'}]}
        ]},
      {id:'w_comp_in', en:'How many complaints came in this week?', am:'በዚህ ሳምንት ስንት ቅሬታዎች ደረሱ?', t:'num',
        auto:{rows:'w_comp_list'}, sumEn:'complaints', sumAm:'ቅሬታዎች'},
      {id:'w_comp_done', en:'How many were resolved?', am:'ስንቱ ተፈቱ?', t:'num',
        auto:{rows:'w_comp_list', when:{col:'state', is:'resolved'}}, sumEn:'resolved', sumAm:'ተፈተዋል'},
      {id:'w_comp_open', en:'How many are still open?', am:'ስንቱ ገና አልተፈቱም?', t:'num',
        auto:{rows:'w_comp_list', when:{col:'state', is:'open'}}, sumEn:'still open', sumAm:'አልተፈቱም',
        tgt:{op:'lte', v:0, en:'Zero valid complaints required for the team bonus',
             am:'ለቡድን ቦነስ ዜሮ ቅሬታ ያስፈልጋል'}},
      {id:'w_comp_open_plan', en:'What is still needed on the open ones, and by when? (Write the customer in the box.)', am:'ላልተፈቱት ምን ይቀራል? እስከ መቼ? (ደንበኛውን በሳጥኑ ይጻፉ።)', t:'area',
        picks:[
          { en:'A part from the factory',                am:'ከፋብሪካ የሚመጣ ዕቃ' },
          { en:'Rework booked',                          am:'እንደገና ለመሥራት ቀን ተይዟል' },
          { en:'Waiting for the customer',               am:'ደንበኛውን እየጠበቅን ነው' },
          { en:"Needs the Chairman's decision",          am:'የሊቀመንበሩ ውሳኔ ያስፈልጋል' },
          { en:'Closes this week',                       am:'በዚህ ሳምንት ይዘጋል' }
        ], show:{f:'w_comp_open', when:'pos'}},
      /* nobody keeps this score and nothing reads it */
      {id:'w_sat', en:'What was the average satisfaction score this week, out of 5? (If customers were asked.)', am:'የዚህ ሳምንት አማካይ የእርካታ ነጥብ ከ5 ስንት ነው? (ደንበኞች ከተጠየቁ።)', t:'num', opt:1}
    ]},
    { en:'Problems and help', am:'ችግርና እርዳታ', fields:[
      {id:'w_problem', en:'What was the biggest problem this week, and what is being done? (Skip it if there was none; write who and by when in the box.)', am:'የዚህ ሳምንት ትልቁ ችግር ምን ነበር? ምን እየተደረገ ነው? (ከሌለ ይዝለሉት፤ በማንና እስከ መቼ በሳጥኑ ይጻፉ።)', t:'area', auto:{weekText:'problem', from:'ephrata-daily'}, opt:1,
        picks:[
          { en:'Few new leads',                          am:'አዲስ ደንበኞች ጥቂት ነበሩ' },
          { en:'Customers slow to pay',                  am:'ደንበኞች ለመክፈል ዘገዩ' },
          { en:'Designs or quotations slow',             am:'ዲዛይን ወይም ፕሮፎርማ ዘገየ' },
          { en:'Factory delivery dates slipping',        am:'የፋብሪካ ማድረሻ ቀኖች እየተገፉ ነው' },
          { en:'A salesperson or designer absent',       am:'ሻጭ ወይም ዲዛይነር አልነበረም' },
          { en:'Customer complaints',                    am:'የደንበኛ ቅሬታዎች' },
          { en:'Being handled this week',                am:'በዚህ ሳምንት እየተያዘ ነው' },
          { en:'Needs the Chairman',                     am:'ሊቀመንበሩን ይፈልጋል' }
        ]},
      {id:'w_open', en:'What carries into next week unresolved?', am:'ሳይፈታ ወደ ሚቀጥለው ሳምንት የሚሻገረው ምንድን ነው?', t:'area', opt:1,
        picks:[
          { en:'Nothing carries over',                   am:'የሚሻገር ነገር የለም' },
          { en:'A payment to collect',                   am:'የሚሰበሰብ ክፍያ' },
          { en:'A complaint',                            am:'ቅሬታ' },
          { en:'A quotation to send',                    am:'የሚላክ ፕሮፎርማ' },
          { en:'A contract to sign',                     am:'የሚፈረም ውል' }
        ], show:{f:'w_problem', when:'any'}},
      {id:'w_need_chair', en:'Do you need a decision from the Chairman?', am:'የሊቀመንበሩ ውሳኔ ያስፈልግዎታል?', t:'yesno', auto:{week:'need_chair', how:'anyyes', from:'ephrata-daily'}, yes:{en:'I need a decision', am:'ውሳኔ ያስፈልገኛል'}, no:{en:'No decision needed', am:'ውሳኔ አያስፈልገኝም'}},
      {id:'w_need_chair_what', en:'What should the Chairman decide? (Write the options and by when in the box.)', am:'ሊቀመንበሩ ምን እንዲወስኑ ይፈልጋሉ? (አማራጮቹንና እስከ መቼ በሳጥኑ ይጻፉ።)', t:'area', auto:{weekText:'need_chair_what', from:'ephrata-daily'},
        picks:[
          { en:'A price below the margin floor',         am:'ከዝቅተኛው ህዳግ በታች ዋጋ' },
          { en:'A discount',                             am:'ቅናሽ' },
          { en:'A payment plan for a customer',          am:'ለደንበኛ የክፍያ ዕቅድ' },
          { en:'A complaint',                            am:'ቅሬታ' },
          { en:'Marketing spend',                        am:'የማርኬቲንግ ወጪ' },
          { en:'Staff',                                  am:'ሠራተኞች' }
        ], show:{f:'w_need_chair', when:'yes'}}
    ]},
    /* All four were empty on the first weekly, and the 4-week projection
       she files the same Saturday names the same customers with their
       values, dates and next steps. Here they are her best guess, not a
       second projection. */
    { en:"Next week", am:'የሚቀጥለው ሳምንት', fields:[
      {id:'w_next_contracts', en:'How many contracts do you expect to sign next week? (Your best guess.)', am:'በሚቀጥለው ሳምንት ስንት ውል ይፈረማል ብለው ይጠብቃሉ? (ግምትዎ።)', t:'num', opt:1},
      {id:'w_next_value', en:'About how much will they bring, in Birr?', am:'በግምት ስንት ብር ያመጣሉ?', t:'money', opt:1, i:1,
        show:{f:'w_next_contracts', when:'pos'}},
      {id:'w_next_customers', en:'Which key customers are in negotiation, and what is the next step? (Write the names in the box.)', am:'በድርድር ላይ ያሉ ዋና ደንበኞች እነማን ናቸው? ቀጣዩ እርምጃ ምንድን ነው? (ስማቸውን በሳጥኑ ይጻፉ።)', t:'area', opt:1,
        picks:[
          { en:'Send the quotation',                     am:'ፕሮፎርማ መላክ' },
          { en:'Revise the design',                      am:'ዲዛይኑን ማስተካከል' },
          { en:'Visit the site',                         am:'ቦታውን መጎብኘት' },
          { en:'Agree the price',                        am:'በዋጋ መስማማት' },
          { en:'Sign the contract',                      am:'ውል መፈረም' },
          { en:'Collect the advance',                    am:'ቅድመ ክፍያ መሰብሰብ' }
        ]},
      {id:'w_next_support', en:'What support do you need from the Chairman next week?', am:'በሚቀጥለው ሳምንት ከሊቀመንበሩ ምን ድጋፍ ያስፈልግዎታል?', t:'area', opt:1,
        picks:[
          { en:'Nothing needed',                         am:'ምንም አያስፈልግም', nil:1 },
          { en:'Approve prices or discounts',            am:'ዋጋ ወይም ቅናሽ ማጽደቅ' },
          { en:'Call a big customer',                    am:'ለትልቅ ደንበኛ መደወል' },
          { en:'Marketing budget',                       am:'የማርኬቲንግ በጀት' },
          { en:'Faster factory dates',                   am:'ፈጣን የፋብሪካ ቀኖች' },
          { en:'More staff',                             am:'ተጨማሪ ሠራተኛ' }
        ]}
    ]},
    /* the 4-week total is what the 25,000 and 5,000 Birr penalties and the
       review read (rulebook, every fourth Saturday), so it stays typed */
    { en:'4-week total', am:'የ4 ሳምንት ድምር', fields:[
      {id:'r_w1', en:'Collected in week 1 (the oldest)', am:'በሳምንት 1 የተሰበሰበ (የመጀመሪያው)', t:'money'},
      {id:'r_w2', en:'Collected in week 2', am:'በሳምንት 2 የተሰበሰበ', t:'money'},
      {id:'r_w3', en:'Collected in week 3', am:'በሳምንት 3 የተሰበሰበ', t:'money'},
      {id:'r_w4', en:'Collected in week 4 (this week)', am:'በሳምንት 4 የተሰበሰበ (ይህ ሳምንት)', t:'money', auto:{of:'w_external'},},
      {id:'r_total', en:'What do the 4 weeks add up to?', am:'የ4ቱ ሳምንታት ድምር ስንት ነው?', t:'money', auto:{minus:[{minus:[{minus:['r_w4', {minus:[0, 'r_w3']}]}, {minus:[0, 'r_w2']}]}, {minus:[0, 'r_w1']}]},
        tgt:{op:'gte', v:12000000, en:'Below 12,000,000 Birr is –5,000 Birr',
             am:'ከ12,000,000 ብር በታች ከሆነ –5,000 ብር'}},
      {id:'r_total_why', en:'The 4 weeks are under 12,000,000 Birr. Why, and which customers will lift the next 4 weeks? (Write the customers in the box.)', am:'የ4 ሳምንቱ ድምር ከ12,000,000 ብር በታች ነው። ለምን? የሚቀጥሉትን 4 ሳምንታት ከፍ የሚያደርጉት የትኞቹ ደንበኞች ናቸው? (ደንበኞቹን በሳጥኑ ይጻፉ።)', t:'area',
        picks:[
          { en:'Few contracts signed',                   am:'የተፈረሙ ውሎች ጥቂት ናቸው' },
          { en:'Customers slow to pay',                  am:'ደንበኞች ለመክፈል ዘገዩ' },
          { en:'Final payments waiting on installation', am:'የመጨረሻ ክፍያዎች ተከላን እየጠበቁ ነው' },
          { en:'Holidays',                               am:'በዓላት' },
          { en:'Big contracts expected soon',            am:'ትላልቅ ውሎች በቅርቡ ይጠበቃሉ' }
        ], show:{f:'r_total', when:'miss'}},
      {id:'r_conseq', en:'Which consequence was applied, if any?', am:'የተወሰደ ቅጣት ወይም እርምጃ ካለ ምንድን ነው?', t:'text', opt:1, one:1,
        picks:[
          { en:'None yet',                               am:'እስካሁን የለም' },
          { en:'A warning',                              am:'ማስጠንቀቂያ' },
          { en:'The fine',                               am:'ቅጣቱ' },
          { en:'A review with the Chairman',             am:'ከሊቀመንበሩ ጋር ግምገማ' }
        ], show:{f:'r_total', when:'miss'}}
    ]}
  ]
},

/* ========================= MAHELET — WEEKLY ========================= */
{
  id:'liu-weekly', person:'liu', cadence:'weekly', built:1, dueTime:'15:00', dueDay:6,
  en:'Weekly Production & Delivery Summary', am:'ሳምንታዊ የምርትና የማድረስ ሪፖርት',
  toEn:'Chairman', toAm:'ሊቀመንበር',
  dueEn:'Saturday 3:00 PM', dueAm:'ቅዳሜ ከቀኑ 9፡00 (3:00 PM)',
  penEn:'Late or not sent –500 Birr', penAm:'ዘግይቶ ወይም ካልቀረበ –500 ብር',
  sections:[
    /* REBUILT 11 Oct 2026 (the Chairman: "they are struggling so much with
       the questions"). Mahelet's first weekly (10 Oct) left 14 of 43
       questions empty: every "why" box, the machine table, the QC pass
       count, the stock-count %, the WhatsApp figures and the 15-day plan
       questions. 33 questions stood before any follow-up opened, ten of them
       about things that only go wrong some weeks. Now a normal week is the
       factory's m², the figures her pay is judged on (uptime, QC, the stock
       count, purchasing, delivery, installation, WhatsApp, the plan kept),
       one tap on "nothing else happened", the problems and next week.
       Everything that goes wrong some weeks is one tap on the list in
       section 2, and only then are its questions asked. Every answer key is
       the one it always was: the yes/no answers behind the list are worked
       out from it ({picked:…}, quiet:1), and the counts a rule fines on file
       a real 0 when the list was answered without them (zero:1). Every "why"
       is buttons now, with a box for the job code. */
    { en:'The factory this week', am:'ፋብሪካው በዚህ ሳምንት', fields:[
      /* the m² is Amaha's alone in the dailies (the Chairman, 8 Oct 2026), so
         her own week cannot add it up — she gives his week's total */
      {id:'p_total', en:"How many m² did the factory make this week? (Amaha's daily m², added up.)", am:'ፋብሪካው በዚህ ሳምንት ስንት ካሬ ሜትር አመረተ? (የአማሃ የየቀኑ ካሬ ሜትር ሲደመር።)', t:'num', auto:{week:'p_total', from:'amaha-daily'},
        tgt:{op:'gte', v:240, en:'Weekly target 240 m²', am:'የሳምንቱ ዒላማ 240 ካሬ ሜትር'}},
      {id:'p_total_why', en:'Under 240 m² this week. What held it back, and what changes next week? (Write the days in the box.)', am:'ሳምንቱ ከ240 ካሬ ሜትር በታች ነው። ምን አዘገየው? በሚቀጥለው ሳምንት ምን ይቀየራል? (ቀኖቹን በሳጥኑ ይጻፉ።)', t:'area', auto:{weekText:'p_total_why', from:'amaha-daily'},
        picks:[
          { en:'Material was not in the store',          am:'ዕቃው መጋዘን ውስጥ አልነበረም' },
          { en:'A machine broke down',                   am:'ማሽን ተበላሸ' },
          { en:'Power cuts',                             am:'መብራት ጠፋ' },
          { en:'Workers were absent',                    am:'ሠራተኞች ቀሩ' },
          { en:'Design or cutting list came late',       am:'ዲዛይን ወይም የመቁረጫ ዝርዝር ዘገየ' },
          { en:'Rework took the time',                   am:'የተመለሰ ሥራ ጊዜ ወሰደ' },
          { en:'Not enough paid jobs to make',           am:'የሚሠሩ የተከፈለባቸው ሥራዎች በቂ አልነበሩም' },
          { en:'Overtime next week to catch up',         am:'በሚቀጥለው ሳምንት በትርፍ ሰዓት ይካካሳል' },
          { en:'Material ordered for next week',         am:'ለሚቀጥለው ሳምንት ዕቃ ታዝዟል' }
        ], show:{f:'p_total', when:'miss'}},
      {id:'p_avg', en:'What was the average production per working day, in m²?', am:'በአንድ የሥራ ቀን አማካይ ምርቱ ስንት ካሬ ሜትር ነበር?', t:'num',
        auto:{div:['p_total', 6]},
        tgt:{op:'gte', v:40, en:'Daily target 40 m²', am:'የቀን ዒላማ 40 ካሬ ሜትር'}},
      {id:'p_waste', en:'What was this week\'s waste, as a % of material used?', am:'የዚህ ሳምንት ብክነት ከዋለው ዕቃ ስንት % ነው?', t:'pct', auto:{week:'waste', how:'avg'},
        tgt:{op:'lte', v:20, en:'Must not exceed 20%', am:'ከ20% መብለጥ የለበትም'}},
      {id:'p_waste_why', en:'Waste is over 20%. Where did it come from, and what is being changed?', am:'ብክነቱ ከ20% በላይ ነው። ከየት መጣ? ምን እየተቀየረ ነው?', t:'area', auto:{weekText:'waste_why', from:'liu-daily'},
        picks:[
          { en:'Cutting mistakes',                       am:'የመቁረጥ ስህተት' },
          { en:'A poor cutting plan',                    am:'ጥሩ ያልሆነ የመቁረጫ ዕቅድ' },
          { en:'Damaged board',                          am:'የተበላሸ ሰሌዳ' },
          { en:'A machine problem',                      am:'የማሽን ችግር' },
          { en:'The design changed',                     am:'ዲዛይኑ ተቀየረ' },
          { en:'Cutting plan checked before cutting',    am:'ከመቆረጡ በፊት የመቁረጫ ዕቅዱ ይፈተሻል' },
          { en:'Operator trained again',                 am:'ኦፕሬተሩ እንደገና ሠለጠነ' }
        ], show:{f:'p_waste', when:'miss'}},
      /* her pay reads this every month (95%+ earns, under 90% fines), so it
         stays asked; the week's machine stops below are there to guess from */
      {id:'p_uptime', en:'About what % of working hours did the machines run this week? Your best guess is fine.', am:'በዚህ ሳምንት ማሽኖች ከሥራ ሰዓቱ በግምት ስንት % ሠሩ? ግምትዎ በቂ ነው።', t:'pct',
        tgt:{op:'gte', v:95, en:'95%+ earns 400 Birr, below 90% is –300 Birr',
             am:'ከ95% በላይ 400 ብር፣ ከ90% በታች –300 ብር'}},
      /* This table was typed out again only when uptime fell short, and was
         empty the one week it opened: every stop is already a row in her
         daily report (downtime_list). The week's rows gather themselves now;
         "back in service" lands in the last column. */
      {id:'p_uptime_list', en:'Machine stops this week, from your daily reports', am:'በዚህ ሳምንት የቆሙ ማሽኖች — ከዕለታዊ ሪፖርቶችዎ', t:'table', addEn:'Add a machine', addAm:'ማሽን ጨምር',
        auto:{weekRows:'downtime_list', map:{back:'plan'}},
        cols:[
          {id:'machine', en:'Machine', am:'ማሽን', t:'choice', opts:[
            {v:'Width cutter',  en:'Width cutter',  am:'የወርድ መቁረጫ'},
            {v:'Length cutter', en:'Length cutter', am:'የርዝመት መቁረጫ'},
            {v:'Edge bander',   en:'Edge bander',   am:'ጠርዝ ማሰሪያ'},
            {v:'Hinge driller', en:'Hinge driller', am:'የማጠፊያ መብሻ'},
            {v:'Compressor',    en:'Compressor',    am:'ኮምፕረሰር'},
            {v:'Other',         en:'Other',         am:'ሌላ'}
          ]},
          {id:'hours', en:'Hours stopped', am:'የቆመበት ሰዓት', t:'num'},
          {id:'cause', en:'Cause', am:'ምክንያት', t:'text'},
          {id:'plan', en:'Back in service, or repair planned', am:'ወደ ሥራ የሚመለስበት ወይም የታቀደ ጥገና', t:'text'}
        ]}
    ]},
    /* THE ONE LIST. Ten questions used to stand on their own every week —
       any QC failure, any count difference, shortages, late suppliers,
       complaints, complaints about our messages, assemblers' posts, jobs
       behind the plan, jobs without payment, the plan late — and on a week
       when none of it happened each one still wanted an answer. */
    { en:'Anything else this week?', am:'በዚህ ሳምንት ሌላ የሆነ ነገር አለ?', fields:[
      {id:'w_events', en:'What else happened this week?', am:'በዚህ ሳምንት ሌላ ምን ሆነ?', t:'multi',
        none:{ en:'Nothing — a normal week', am:'ምንም — የተለመደ ሳምንት' },
        groups:[
          { v:'qual',  en:'Quality',                am:'ጥራት' },
          { v:'store', en:'Store and purchasing',   am:'መጋዘንና ግዥ' },
          { v:'cust',  en:'Delivery and customers', am:'ማድረስና ደንበኞች' },
          { v:'wa',    en:'WhatsApp',               am:'ዋትስአፕ' },
          { v:'plan',  en:'The 15-day plan',        am:'የ15 ቀን ዕቅዱ' }
        ],
        opts:[
          { v:'qc_fail',   g:'qual',  en:'A job failed QC',                                  am:'የጥራት ፍተሻ ያላለፈ ሥራ ነበር' },
          { v:'disc',      g:'store', en:'The stock count did not match the record',         am:'የዕቃ ቆጠራው ከመዝገቡ ጋር አልተመሳሰለም' },
          { v:'short',     g:'store', en:'Material ran short',                               am:'ዕቃ አጠረ' },
          { v:'sup_late',  g:'store', en:'A supplier delivered late',                        am:'አቅራቢ ዘግይቶ አደረሰ' },
          { v:'complaint', g:'cust',  en:'A customer complained',                            am:'ደንበኛ ቅሬታ አቀረበ' },
          { v:'asm_post',  g:'wa',    en:'Assemblers missed posting their progress',         am:'ገጣጣሚዎች ሂደታቸውን ያልለጠፉበት ቀን ነበር' },
          { v:'wa_comp',   g:'wa',    en:'A customer complained about our messages',         am:'ደንበኛ ስለ መልዕክቶቻችን ቅሬታ አቀረበ' },
          { v:'behind',    g:'plan',  en:'A job is behind the plan',                         am:'ከዕቅዱ ወደኋላ የቀረ ሥራ አለ' },
          { v:'unpaid',    g:'plan',  en:"A job went into the plan without Selam's written payment confirmation", am:'ያለ ሰላም የጽሑፍ የክፍያ ማረጋገጫ ወደ ዕቅዱ የገባ ሥራ አለ' },
          { v:'plan_late', g:'plan',  en:'The 15-day plan reached the Chairman after Saturday 3:00 PM', am:'የ15 ቀን ዕቅዱ ከቅዳሜ 9፡00 በኋላ ለሊቀመንበሩ ደረሰ' }
        ]}
    ]},
    /* Her QC figures stay hers to give: the rulebook pays her on them, and
       the morning "reports that disagree" reader sets them against Wude's
       and Amaha's. What simply follows from them does not stay.
       "How many passed?" was left empty: it is the jobs checked less the
       jobs she lists as failed, so it is worked out from those two now. */
    { en:'Quality control', am:'የጥራት ቁጥጥር', fields:[
      {id:'q_checked', en:'How many jobs went through QC this week?', am:'በዚህ ሳምንት ስንት ሥራዎች የጥራት ፍተሻ ተደረገላቸው?', t:'num', auto:{week:'i_total', from:'wude-daily'},},
      {id:'q_fail_any', en:'Did any job fail QC this week?', am:'በዚህ ሳምንት የጥራት ፍተሻ ያላለፈ ሥራ አለ?', t:'yesno', quiet:1, auto:{picked:'w_events', v:'qc_fail'}},
      {id:'q_fail_list', en:'Which jobs failed QC, and why?', am:'የጥራት ፍተሻ ያላለፉት የትኞቹ ሥራዎች ናቸው? ለምን?', t:'table', auto:{weekRows:'i_jobs', from:'wude-daily', when:{col:'pass', is:'no'}, map:{code:'code', why:'why'}}, addEn:'Add a job', addAm:'ሥራ ጨምር',

        cols:[
          {id:'code', en:'Job code', am:'የሥራ ኮድ', t:'text'},
          {id:'why', en:'Why it failed', am:'ያላለፈበት ምክንያት', t:'text', picks:COL_DEFECT},
          {id:'fixed', en:'Fixed and passed', am:'ተስተካክሎ አልፏል', t:'yesno', yes:{en:'Fixed and passed', am:'ተስተካክሎ አልፏል'}, no:{en:'Not passed yet', am:'ገና አላለፈም'}}
        ]},
      {id:'q_pass', en:'How many passed?', am:'ስንቱ አለፉ?', t:'num', auto:{week:'i_pass', from:'wude-daily'},
},
      {id:'q_fail', en:'How many failed?', am:'ስንቱ አላለፉም?', t:'num', auto:{week:'i_fail', from:'wude-daily'},
 sumEn:'failed', sumAm:'አላለፉም'},
      {id:'q_rate', en:'What was the QC pass rate this week?', am:'በዚህ ሳምንት ስንት በመቶው የጥራት ፍተሻ አለፈ?', t:'pct',
        auto:{pct:['q_pass', 'q_checked']},
        tgt:{op:'gte', v:98, en:'Target ≥98% — below is –500 Birr/month',
             am:'ዒላማ ≥98% — በታች ከሆነ በወር –500 ብር'}},
      {id:'q_rate_why', en:'Under 98% passed. What is the main cause, and what will change on the floor?', am:'ያለፈው ከ98% በታች ነው። ዋናው ምክንያት ምንድን ነው? በምርት ክፍሉ ምን ይቀየራል?', t:'area', auto:{weekText:'r_rate_why', from:'wude-daily'},
        picks:[
          { en:'Cutting mistakes',                       am:'የመቁረጥ ስህተት' },
          { en:'Edges lifting',                          am:'ጠርዝ መነሳት' },
          { en:'Drilling or hinge holes wrong',          am:'የቀዳዳ ወይም የማጠፊያ ስህተት' },
          { en:'Assembly mistakes',                      am:'የመገጣጠም ስህተት' },
          { en:'Damaged board',                          am:'የተበላሸ ሰሌዳ' },
          { en:'Wrong measurements from design',         am:'ከዲዛይን የመጣ የተሳሳተ ልኬት' },
          { en:'Each stage checks before passing on',    am:'እያንዳንዱ ደረጃ ከማስተላለፉ በፊት ይፈትሻል' },
          { en:'Operator trained again',                 am:'ኦፕሬተሩ እንደገና ሠለጠነ' }
        ], show:{f:'q_rate', when:'miss'}}
    ]},
    { en:'Store', am:'መጋዘን', fields:[
      /* her pay reads it (≥99%), so it stays asked */
      {id:'s_accuracy', en:'What % of the items counted in the store this week matched the record? (100% if every item matched.)', am:'በዚህ ሳምንት በመጋዘን ከተቆጠሩት ዕቃዎች ስንት % ከመዝገቡ ጋር ተመሳሰሉ? (ሁሉም ከተመሳሰሉ 100%።)', t:'pct',
        tgt:{op:'gte', v:99, en:'Target ≥99%', am:'ዒላማ ≥99%'}},
      {id:'s_disc_any', en:'Did the count find any difference this week?', am:'በዚህ ሳምንት ቆጠራው ልዩነት አገኘ?', t:'yesno', auto:{week:'st_any', from:'alemaya-daily', how:'anyyes'}, quiet:1,},
      {id:'s_disc_list', en:'Which items did not match?', am:'ከመዝገቡ ጋር ያልተመሳሰሉት የትኞቹ ዕቃዎች ናቸው?', t:'table', auto:{weekRows:'st_disc_list', from:'alemaya-daily', map:{book:'rec', shelf:'cnt'}}, addEn:'Add an item', addAm:'ዕቃ ጨምር',
        show:{f:'s_disc_any', when:'yes'},
        cols:[
          {id:'item', en:'Item', am:'ዕቃ', t:'text'},
          {id:'rec', en:'Recorded', am:'በመዝገብ', t:'num'},
          {id:'cnt', en:'Counted', am:'የተቆጠረ', t:'num'},
          {id:'why', en:'Explanation', am:'ማብራሪያ', t:'text', picks:COL_STOCK_DIFF}
        ]},
      {id:'s_disc', en:'How many stock discrepancies were found?', am:'ስንት የዕቃ ልዩነቶች ተገኙ?', t:'num',
        auto:{rows:'s_disc_list'}, sumEn:'differences', sumAm:'ልዩነቶች'},
      {id:'s_short', en:'How many material shortages were there this week?', am:'በዚህ ሳምንት ስንት የዕቃ እጥረቶች ነበሩ?', t:'num', auto:{week:'sh_flagged', from:'alemaya-daily'}, zero:1,
},
      {id:'s_short_what', en:'Which material ran short, and what did it hold up? (Write the jobs in the box.)', am:'ያጠረው የትኛው ዕቃ ነው? ምን አቆመ? (ሥራዎቹን በሳጥኑ ይጻፉ።)', t:'area', auto:{weekText:'shortage_hit', from:'liu-daily'},
        picks:[
          { en:'MDF or melamine',                        am:'ኤምዲኤፍ ወይም ሜላሚን' },
          { en:'Edge banding',                           am:'የጠርዝ ማሰሪያ' },
          { en:'Hinges, slides or handles',              am:'ማጠፊያ፣ ተንሸራታች ወይም መያዣ' },
          { en:'Glue and screws',                        am:'ሙጫና ብሎኖች' },
          { en:'Held up less than a day',                am:'ከአንድ ቀን ያነሰ አቆመ' },
          { en:'Held up a day or more',                  am:'አንድ ቀን ወይም ከዚያ በላይ አቆመ' },
          { en:'Nothing was held up',                    am:'ምንም አላቆመም' }
        ], show:{f:'s_short', when:'pos'}}
    ]},
    { en:'Purchasing', am:'ግዥ', fields:[
      /* her pay reads it (≥95%), so it stays asked */
      {id:'pu_acc', en:'What % of this week\'s purchases came right the first time — item, quantity and price? (100% if none was wrong.)', am:'የዚህ ሳምንት ግዥዎች ስንት % በመጀመሪያው ትክክል ነበሩ — ዕቃ፣ መጠንና ዋጋ? (አንዱም ካልተሳሳተ 100%።)', t:'pct',
        tgt:{op:'gte', v:95, en:'Target ≥95%', am:'ዒላማ ≥95%'}},
      /* the count is Getachew's now; it is asked when it explains a miss */
      {id:'pu_total', en:'How many purchase requests were made this week?', am:'በዚህ ሳምንት ስንት የግዥ ጥያቄዎች ቀረቡ?', t:'num', auto:{week:'pr_prep', from:'getachew-daily'}, i:1,
},
      {id:'pu_acc_why', en:'Under 95%. What was wrong with the purchases? (Write which ones in the box.)', am:'ከ95% በታች ነው። በግዥዎቹ ምን ተሳሳተ? (የትኞቹ እንደሆኑ በሳጥኑ ይጻፉ።)', t:'area',
        picks:[
          { en:'Wrong item',                             am:'የተሳሳተ ዕቃ' },
          { en:'Wrong quantity',                         am:'የተሳሳተ መጠን' },
          { en:'Price higher than agreed',               am:'ዋጋው ከተስማማነው በላይ ነው' },
          { en:'Poor quality',                           am:'ጥራቱ ዝቅተኛ ነው' },
          { en:'The request was unclear',                am:'ጥያቄው ግልጽ አልነበረም' },
          { en:'The supplier sent the wrong thing',      am:'አቅራቢው የተሳሳተ ዕቃ ላከ' }
        ], show:{f:'pu_acc', when:'miss'}},
      {id:'pu_ontime', en:'How many supplier deliveries arrived on time? (on time / all deliveries)', am:'ስንት የአቅራቢ ርክክቦች በሰዓቱ ደረሱ? (በሰዓቱ / ሁሉም)', t:'ratio',
        show:{f:'w_events', when:'has', v:'sup_late'}},
      {id:'pu_ontime_why', en:'What came late, and what did it hold up? (Write the supplier and the days late in the box.)', am:'የዘገየው ምንድን ነው? ምን አቆመ? (አቅራቢውንና የዘገየበትን ቀን በሳጥኑ ይጻፉ።)', t:'area',
        picks:[
          { en:'Board (MDF or melamine)',                am:'ሰሌዳ (ኤምዲኤፍ ወይም ሜላሚን)' },
          { en:'Edge banding',                           am:'የጠርዝ ማሰሪያ' },
          { en:'Hardware',                               am:'ሃርድዌር' },
          { en:'It held up production',                  am:'ምርት አቆመ' },
          { en:'Nothing was held up',                    am:'ምንም አላቆመም' }
        ], show:{f:'pu_ontime', when:'short'}}
    ]},
    { en:'Delivery and installation', am:'ማድረስና ተከላ', fields:[
      /* every job out of the factory is already a row in her daily report */
      {id:'d_delivered', en:'How many jobs were delivered this week?', am:'በዚህ ሳምንት ስንት ሥራዎች ደረሱ?', t:'num', auto:{week:'delivered'}},
      {id:'d_installed', en:'How many jobs were installed this week?', am:'በዚህ ሳምንት ስንት ሥራዎች ተተከሉ?', t:'num', auto:{week:'j_done', from:'elyas-daily'},},
      /* both on-time figures are read by her pay every month, so they stay */
      {id:'d_ontime', en:'What % of this week\'s deliveries reached the customer on the agreed day? (100% if none was late.)', am:'የዚህ ሳምንት ርክክቦች ስንት % በተስማማንበት ቀን ደንበኛው ጋ ደረሱ? (አንዱም ካልዘገየ 100%።)', t:'pct',
        tgt:{op:'gte', v:95, en:'Target ≥95%', am:'ዒላማ ≥95%'}},
      {id:'d_ontime_why', en:'Which deliveries were late, and why? (Write the job and how late in the box.)', am:'የዘገዩት የትኞቹ ርክክቦች ናቸው? ለምን? (ሥራውንና ምን ያህል እንደዘገየ በሳጥኑ ይጻፉ።)', t:'area',
        picks:[
          { en:'Not finished in the factory on time',    am:'በፋብሪካ በሰዓቱ አላለቀም' },
          { en:'Waiting for QC',                         am:'የጥራት ፍተሻ ጠበቅን' },
          { en:'Waiting for the final payment',          am:'የመጨረሻውን ክፍያ ጠበቅን' },
          { en:'No truck',                               am:'መኪና አልነበረም' },
          { en:'The customer asked to wait',             am:'ደንበኛው እንድንጠብቅ ጠየቀ' },
          { en:'The site was not ready',                 am:'ቦታው ዝግጁ አልነበረም' }
        ], show:{f:'d_ontime', when:'miss'}},
      {id:'d_inst_ontime', en:'What % of this week\'s installations finished on the agreed day? (100% if none was late.)', am:'የዚህ ሳምንት ተከላዎች ስንት % በተስማማንበት ቀን ተጠናቀቁ? (አንዱም ካልዘገየ 100%።)', t:'pct', auto:{pct:[{week:'j_rows', count:1, from:'elyas-daily', when:[{col:'state', is:'done'}, {col:'ontime', is:'yes'}]}, {week:'j_rows', count:1, from:'elyas-daily', when:[{col:'state', is:'done'}, {col:'ontime', in:['yes', 'no']}]}]},
        tgt:{op:'gte', v:95, en:'Target ≥95%', am:'ዒላማ ≥95%'}},
      {id:'d_inst_ontime_why', en:'Which installations were late, and why? (Write the job and how late in the box.)', am:'የዘገዩት የትኞቹ ተከላዎች ናቸው? ለምን? (ሥራውንና ምን ያህል እንደዘገየ በሳጥኑ ይጻፉ።)', t:'area',
        picks:[
          { en:'The site was not ready',                 am:'ቦታው ዝግጁ አልነበረም' },
          { en:'Parts missing or damaged',               am:'የጎደለ ወይም የተጎዳ ዕቃ' },
          { en:'Not enough assemblers',                  am:'ገጣጣሚዎች በቂ አልነበሩም' },
          { en:'Measurement did not match',              am:'ልኬቱ አልተመሳሰለም' },
          { en:'The customer asked to wait',             am:'ደንበኛው እንድንጠብቅ ጠየቀ' },
          { en:'Rework on site',                         am:'በቦታው እንደገና የተሠራ ሥራ' }
        ], show:{f:'d_inst_ontime', when:'miss'}},
      {id:'d_comp_any', en:'Did any customer complaint come in this week?', am:'በዚህ ሳምንት የደረሰ የደንበኛ ቅሬታ አለ?', t:'yesno', quiet:1, auto:{picked:'w_events', v:'complaint'}},
      {id:'d_complaints_list', en:'List each complaint', am:'ቅሬታዎቹን አንድ በአንድ ይዘርዝሩ', t:'table', addEn:'Add a complaint', addAm:'ቅሬታ ጨምር',
        show:{f:'d_comp_any', when:'yes'},
        cols:[
          {id:'cust', en:'Customer', am:'ደንበኛ', t:'text'},
          {id:'lc', en:'Customer code: 4-digit lead no., or KK code once paid', am:'የደንበኛ ኮድ፦ ባለ 4 አሃዝ ቁጥር፣ ከከፈሉ በኋላ KK ኮድ', t:'text'},
          {id:'what', en:'Complaint', am:'ቅሬታው', t:'text', picks:COL_COMPLAINT},
          {id:'dept', en:'Caused by (department)', am:'ያስከተለው ክፍል', t:'text', picks:COL_DEPT},
          {id:'done', en:'Resolved', am:'ተፈቷል', t:'yesno', yes:{en:'Resolved', am:'ተፈቷል'}, no:{en:'Still open', am:'ገና አልተፈታም'}}
        ]},
      {id:'d_complaints', en:'How many customer complaints came in this week?', am:'በዚህ ሳምንት ስንት የደንበኛ ቅሬታዎች ደረሱ?', t:'num', auto:{week:'ac_complaints', from:'elyas-daily'},
 sumEn:'complaints', sumAm:'ቅሬታዎች'},
      {id:'d_resolved', en:'How many of them are resolved?', am:'ከነዚህ ስንቱ ተፈቱ?', t:'num',
        auto:{rows:'d_complaints_list', when:{col:'done', is:'yes'}}, sumEn:'resolved', sumAm:'ተፈተዋል'}
    ]},
    { en:'Job Files from Ephrata', am:'ከኤፍራታ የመጡ የጆብ ፋይሎች', fields:[
      {id:'j_recv', en:'How many Job Files did you receive from Ephrata this week?', am:'በዚህ ሳምንት ከኤፍራታ ስንት ጆብ ፋይሎች ደረሱዎት?', t:'num', auto:{week:'jf_recv'}},
      {id:'j_rej', en:'How many did you return as incomplete?', am:'ስንቱን ያልተሟሉ ስለሆኑ መለሱ?', t:'num', auto:{week:'jf_rej'}},
      {id:'j_acc', en:'How many did you accept?', am:'ስንቱን ተቀበሉ?', t:'num',
        auto:{minus:['j_recv', 'j_rej']}, sumEn:'accepted', sumAm:'ተቀብለዋል'},
      {id:'j_reason', en:'What was missing from the returned files? Is it the same thing again?', am:'በተመለሱት ፋይሎች ምን ጎደለ? ያው ነገር እንደገና ነው?', t:'area', opt:1,
        picks:[
          { en:'Measurements',                           am:'ልኬት' },
          { en:'The signed design',                      am:'የተፈረመው ዲዛይን' },
          { en:'Material and colour choices',            am:'የዕቃና የቀለም ምርጫ' },
          { en:'Appliance details',                      am:'የኤሌክትሪክ ዕቃዎች መረጃ' },
          { en:'Customer details',                       am:'የደንበኛ መረጃ' },
          { en:'The same thing as before',               am:'ከዚህ በፊት የጎደለው ያው ነገር' }
        ], show:{f:'j_rej', when:'pos'}}
    ]},
    { en:'WhatsApp', am:'ዋትስአፕ', fields:[
      /* her KPI bonus reads it (100% every week), so it stays asked */
      {id:'wa_rate', en:'What % of the operations messages due in customer groups this week went out on time? (100% if none was missed.)', am:'በዚህ ሳምንት በደንበኛ ግሩፖች መላክ ከነበረባቸው የኦፕሬሽን መልዕክቶች ስንት % በሰዓቱ ተላኩ? (አንዱም ካልቀረ 100%።)', t:'pct', auto:{pct:[{week:'wa_ops__a', from:'liu-daily'}, {week:'wa_ops__b', from:'liu-daily'}]},
        tgt:{op:'gte', v:100, en:'100% required for the KPI bonus', am:'ለKPI ቦነስ 100% ያስፈልጋል'}},
      {id:'wa_rate_why', en:'Which messages were missed, and why? (Write the groups and who was responsible in the box.)', am:'ያልተላኩት የትኞቹ መልዕክቶች ናቸው? ለምን? (ግሩፖቹንና ኃላፊውን በሳጥኑ ይጻፉ።)', t:'area', auto:{weekText:'wa_missed', from:'liu-daily'},
        picks:[
          { en:'Forgot',                                 am:'ተረስቷል' },
          { en:'No time',                                am:'ጊዜ አልነበረም' },
          { en:'The group was not set up yet',           am:'ግሩፑ ገና አልተከፈተም' },
          { en:'Posted late, not missed',                am:'ዘግይቶ ተላከ እንጂ አልቀረም' },
          { en:"Elyas's site team",                      am:'የኤልያስ የተከላ ቡድን' },
          { en:'An assembler',                           am:'ገጣጣሚ' }
        ], show:{f:'wa_rate', when:'miss'}},
      {id:'wa_asm', en:'On how many days did the assemblers post their progress? (days posted / working days)', am:'ገጣጣሚዎች በስንት ቀን ሂደታቸውን ለጠፉ? (የለጠፉበት ቀን / የሥራ ቀናት)', t:'ratio', auto:{a:{week:'wa_assembler', how:'yesdays', from:'liu-daily'}, b:{plus:[{week:'wa_assembler', how:'yesdays', from:'liu-daily'}, {week:'wa_assembler', how:'nodays', from:'liu-daily'}]}},
},
      {id:'wa_asm_why', en:'Why was it missed? (Write the days and the assembler in the box.)', am:'ለምን ቀረ? (ቀኖቹንና ገጣጣሚውን በሳጥኑ ይጻፉ።)', t:'area', auto:{weekText:'wa_assembler_why', from:'liu-daily'},
        picks:[
          { en:'Forgot',                                 am:'ተረስቷል' },
          { en:'No phone or no data',                    am:'ስልክ ወይም ኢንተርኔት አልነበረም' },
          { en:'Elyas was told',                         am:'ለኤልያስ ተነግሯል' },
          { en:'Fined',                                  am:'ተቀጥቷል' }
        ], show:{f:'wa_asm', when:'short'}},
      /* a fine counts these (rulebook), so a week without one files 0 */
      {id:'wa_comp', en:'How many customers complained about our operations messages?', am:'ስንት ደንበኞች ስለ ኦፕሬሽን መልዕክቶቻችን ቅሬታ አቀረቡ?', t:'num', zero:1,
        show:{f:'w_events', when:'has', v:'wa_comp'}},
      {id:'wa_comp_what', en:'What was the complaint, and what was done? (Write the customer in the box.)', am:'ቅሬታው ምን ነበር? ምን ተደረገ? (ደንበኛውን በሳጥኑ ይጻፉ።)', t:'area',
        picks:[
          { en:'No answer for hours',                    am:'ለሰዓታት መልስ አልተሰጠም' },
          { en:'Not told the delivery date',             am:'የማድረሻ ቀን አልተነገራቸውም' },
          { en:'Date changed without telling them',      am:'ሳይነገራቸው ቀኑ ተቀየረ' },
          { en:'Rude message',                           am:'ጨዋነት የጎደለው መልዕክት' },
          { en:'Called and apologised',                  am:'ተደውሎ ይቅርታ ተጠየቀ' },
          { en:'Resolved',                               am:'ተፈቷል' }
        ], show:{f:'wa_comp', when:'pos'}}
    ]},
    { en:'The 15-day plan', am:'የ15 ቀን ዕቅዱ', fields:[
      /* a fine reads it every month (under 90%), so it stays asked */
      {id:'pl_onsched', en:'Of the jobs the plan said would finish this week, how many finished on their day? (finished on the day / due this week)', am:'ዕቅዱ በዚህ ሳምንት ያልቃሉ ካላቸው ሥራዎች ስንቱ በቀናቸው አለቁ? (በቀኑ ያለቁ / በዚህ ሳምንት የሚያልቁ)', t:'ratio'},
      {id:'pl_sent', en:'Did the 15-day plan reach the Chairman by Saturday 3:00 PM?', am:'የ15 ቀን ዕቅዱ እስከ ቅዳሜ 9፡00 ለሊቀመንበሩ ደርሷል?', t:'yesno', quiet:1, auto:{picked:'w_events', v:'plan_late', flip:1}},
      {id:'pl_sent_why', en:'Why was the plan late? (Write when it reached him in the box.)', am:'ዕቅዱ ለምን ዘገየ? (መቼ እንደደረሳቸው በሳጥኑ ይጻፉ።)', t:'area',
        picks:[
          { en:"Selam's list of paid jobs came late",    am:'የሰላም የተከፈሉ ሥራዎች ዝርዝር ዘገየ' },
          { en:'Waiting for the material list',          am:'የዕቃ ዝርዝሩን ጠበቅን' },
          { en:'Waiting for designs',                    am:'ዲዛይኖችን ጠበቅን' },
          { en:'No time',                                am:'ጊዜ አልነበረም' }
        ], show:{f:'pl_sent', when:'no'}},
      {id:'pl_delayed_any', en:'Is any job behind the plan?', am:'ከዕቅዱ ወደኋላ የቀረ ሥራ አለ?', t:'yesno', quiet:1, auto:{picked:'w_events', v:'behind'}},
      {id:'pl_delayed_list', en:'Which jobs are behind?', am:'ወደኋላ የቀሩት የትኞቹ ሥራዎች ናቸው?', t:'table', addEn:'Add a job', addAm:'ሥራ ጨምር',
        show:{f:'pl_delayed_any', when:'yes'},
        cols:[
          {id:'code', en:'Job code', am:'የሥራ ኮድ', t:'text'},
          {id:'days', en:'Days behind', am:'የዘገየበት ቀን', t:'num'},
          {id:'why', en:'Reason', am:'ምክንያት', t:'text', picks:COL_BEHIND},
          {id:'new', en:'New date', am:'አዲሱ ቀን', t:'text'}
        ]},
      {id:'pl_delayed', en:'How many jobs are behind the plan?', am:'ስንት ሥራዎች ከዕቅዱ ወደኋላ ቀርተዋል?', t:'num',
        auto:{rows:'pl_delayed_list'}, sumEn:'behind the plan', sumAm:'ከዕቅዱ ወደኋላ'},
      {id:'pl_reason', en:'What is the main reason for the delays?', am:'የመዘግየቱ ዋና ምክንያት ምንድን ነው?', t:'area', opt:1,
        picks:[
          { en:'Material was not in the store',          am:'ዕቃው መጋዘን ውስጥ አልነበረም' },
          { en:'A machine broke down',                   am:'ማሽን ተበላሸ' },
          { en:'Workers were absent',                    am:'ሠራተኞች ቀሩ' },
          { en:'Design or cutting list came late',       am:'ዲዛይን ወይም የመቁረጫ ዝርዝር ዘገየ' },
          { en:'Rework took the time',                   am:'የተመለሰ ሥራ ጊዜ ወሰደ' },
          { en:'Payment not confirmed yet',              am:'ክፍያው ገና አልተረጋገጠም' },
          { en:'The customer changed the order',         am:'ደንበኛው ትዕዛዙን ቀየረ' }
        ], show:{f:'pl_delayed_any', when:'yes'}},
      /* –5,000 Birr a job (rulebook): a week without one files 0 */
      {id:'pl_unpaid', en:"How many jobs went into the plan without Selam's written payment confirmation?",
        am:'ያለ ሰላም የጽሑፍ የክፍያ ማረጋገጫ ስንት ሥራዎች ወደ ዕቅዱ ገቡ?', t:'num', zero:1,
        show:{f:'w_events', when:'has', v:'unpaid'},
        tgt:{op:'lte', v:0, en:'–5,000 Birr per job', am:'በሥራ –5,000 ብር'}},
      {id:'pl_unpaid_what', en:'Have they been stopped? (Write the jobs and who put them in, in the box.)', am:'ቆመዋል? (ሥራዎቹንና ያስገባቸውን በሳጥኑ ይጻፉ።)', t:'area', one:1,
        picks:[
          { en:'Stopped until Selam confirms',           am:'ሰላም እስክታረጋግጥ ቆሟል' },
          { en:'Selam has confirmed since',              am:'ሰላም ከዚያ በኋላ አረጋግጣለች' },
          { en:'Not stopped — the Chairman allowed it',  am:'አልቆመም — ሊቀመንበሩ ፈቅደዋል' },
          { en:'Not stopped yet',                        am:'ገና አልቆመም' }
        ], show:{f:'pl_unpaid', when:'pos'}}
    ]},
    { en:'Problems and help', am:'ችግርና እርዳታ', fields:[
      {id:'w_problem', en:'What was the biggest problem this week? (Skip it if there was none.)', am:'የዚህ ሳምንት ትልቁ ችግር ምን ነበር? (ከሌለ ይዝለሉት።)', t:'area', auto:{weekText:'problem', from:'liu-daily'}, opt:1,
        picks:[
          { en:'Material not in the store',              am:'ዕቃው መጋዘን ውስጥ አልነበረም' },
          { en:'Machine breakdowns',                     am:'የማሽን ብልሽት' },
          { en:'Workers absent',                         am:'ሠራተኞች ቀሩ' },
          { en:'Designs or cutting lists late',          am:'ዲዛይን ወይም የመቁረጫ ዝርዝር ዘገየ' },
          { en:'Rework',                                 am:'የተመለሰ ሥራ' },
          { en:'Payments not confirmed',                 am:'ክፍያዎች አልተረጋገጡም' },
          { en:'Sites not ready',                        am:'ቦታዎች ዝግጁ አልነበሩም' }
        ]},
      {id:'w_action', en:'What was done about it? (Write who and by when in the box.)', am:'ምን ተደረገ? (በማንና እስከ መቼ በሳጥኑ ይጻፉ።)', t:'area', opt:1,
        picks:[
          { en:'Fixed this week',                        am:'በዚህ ሳምንት ተስተካክሏል' },
          { en:'Will be fixed next week',                am:'በሚቀጥለው ሳምንት ይስተካከላል' },
          { en:'Getachew is buying it',                  am:'ጌታቸው እየገዛ ነው' },
          { en:'The machine is being repaired',          am:'ማሽኑ እየተጠገነ ነው' },
          { en:'The Chairman was told',                  am:'ለሊቀመንበሩ ተነግሯል' },
          { en:'Nothing done yet',                       am:'ገና ምንም አልተደረገም' }
        ], show:{f:'w_problem', when:'any'}},
      {id:'w_open', en:'What is still open? (Write who owns it and by when in the box.)', am:'ያላለቀው ምንድን ነው? (ኃላፊውንና እስከ መቼ በሳጥኑ ይጻፉ።)', t:'area', opt:1,
        picks:[
          { en:'Nothing is open',                        am:'ያላለቀ ነገር የለም' },
          { en:'A purchase',                             am:'ግዥ' },
          { en:'A machine repair',                       am:'የማሽን ጥገና' },
          { en:'A customer complaint',                   am:'የደንበኛ ቅሬታ' },
          { en:'A late job',                             am:'የዘገየ ሥራ' },
          { en:'A payment confirmation',                 am:'የክፍያ ማረጋገጫ' }
        ], show:{f:'w_action', when:'any'}},
      {id:'w_well', en:'What went well this week that should be repeated?', am:'በዚህ ሳምንት በደንብ የሠራና ሊደገም የሚገባው ምንድን ነው?', t:'area', opt:1,
        picks:[
          { en:'Reached 240 m²',                         am:'240 ካሬ ሜትር ደረስን' },
          { en:'No machine stops',                       am:'ማሽን አልቆመም' },
          { en:'No QC failures',                         am:'የጥራት ፍተሻ ያላለፈ ሥራ የለም' },
          { en:'Every delivery on time',                 am:'ሁሉም ርክክቦች በሰዓቱ ነበሩ' },
          { en:'The plan was kept',                      am:'ዕቅዱ ተጠብቋል' },
          { en:'Material arrived on time',               am:'ዕቃ በሰዓቱ ደረሰ' }
        ]},
      {id:'need_chair', en:'Do you need a decision from the Chairman?', am:'የሊቀመንበሩ ውሳኔ ያስፈልግዎታል?', t:'yesno', auto:{week:'need_chair', how:'anyyes', from:'liu-daily'}, yes:{en:'I need a decision', am:'ውሳኔ ያስፈልገኛል'}, no:{en:'No decision needed', am:'ውሳኔ አያስፈልገኝም'}},
      {id:'need_chair_what', en:'What should the Chairman decide? (Write the options and by when in the box.)', am:'ሊቀመንበሩ ምን እንዲወስኑ ይፈልጋሉ? (አማራጮቹንና እስከ መቼ በሳጥኑ ይጻፉ።)', t:'area', auto:{weekText:'need_chair_what', from:'liu-daily'},
        picks:[
          { en:'Approve a purchase',                     am:'ግዥ ማጽደቅ' },
          { en:'Approve overtime',                       am:'የትርፍ ሰዓት ሥራ መፍቀድ' },
          { en:'Approve internal (Rovestone) work',      am:'የውስጥ (የሮቭስቶን) ሥራ ማጽደቅ' },
          { en:"Move a job's date",                      am:'የሥራ ቀን ማዛወር' },
          { en:'More workers or assemblers',             am:'ተጨማሪ ሠራተኛ ወይም ገጣጣሚ' },
          { en:'A machine repair or part',               am:'የማሽን ጥገና ወይም መለዋወጫ' }
        ], show:{f:'need_chair', when:'yes'}}
    ]},
    { en:'Next week', am:'የሚቀጥለው ሳምንት', fields:[
      {id:'n_target', en:'What is next week\'s production target, in m²? (A full week is 240.)', am:'የሚቀጥለው ሳምንት የምርት ዒላማ ስንት ካሬ ሜትር ነው? (ሙሉ ሳምንት 240 ነው።)', t:'num'},
      {id:'n_jobs', en:'Which jobs must be finished next week? (Job codes are enough.)', am:'በሚቀጥለው ሳምንት መጠናቀቅ ያለባቸው የትኞቹ ሥራዎች ናቸው? (የሥራ ኮዶች በቂ ናቸው።)', t:'area'},
      {id:'n_support', en:'What do you need from other departments or the Chairman to hit it?', am:'ዒላማውን ለመምታት ከሌሎች ክፍሎች ወይም ከሊቀመንበሩ ምን ያስፈልግዎታል?', t:'area', auto:{weekText:'need_help', from:'liu-daily'}, opt:1,
        picks:[
          { en:'Nothing needed',                         am:'ምንም አያስፈልግም', nil:1 },
          { en:'Material bought (Getachew)',             am:'ዕቃ እንዲገዛ (ጌታቸው)' },
          { en:'Payment confirmations (Selam)',          am:'የክፍያ ማረጋገጫ (ሰላም)' },
          { en:'Complete Job Files (Ephrata)',           am:'የተሟሉ የጆብ ፋይሎች (ኤፍራታ)' },
          { en:'More workers',                           am:'ተጨማሪ ሠራተኛ' },
          { en:'A machine repaired',                     am:'ማሽን መጠገን' },
          { en:'A decision from the Chairman',           am:'የሊቀመንበሩ ውሳኔ' }
        ]}
    ]}
  ]
},

/* ==================== BETELHEM — WEEKLY FINANCE ==================== */
{
  id:'betty-weekly', person:'betty', cadence:'weekly', built:1, dueTime:'17:00', dueDay:6,
  en:'Weekly Finance Report', am:'ሳምንታዊ የፋይናንስ ሪፖርት',
  toEn:'Chairman + Kidan', toAm:'ሊቀመንበር + ኪዳን',
  dueEn:'Saturday 5:00 PM', dueAm:'ቅዳሜ ከቀኑ 11፡00 (5:00 PM)',
  penEn:'Late or not sent –500 Birr · Wrong information –500 to –1,000 Birr',
  penAm:'ዘግይቶ ወይም ካልቀረበ –500 ብር · የተሳሳተ መረጃ –500 እስከ –1,000 ብር',
  derived:1,
  sections:[
    /* REBUILT 11 Oct 2026 (the Chairman: "they are struggling so much with
       the questions"). Never filed yet. 29 questions stood on screen on
       Saturday afternoon: eleven yes/no checks on things that go wrong now
       and then (cash not banked, a reconciliation not done, a register
       behind, the board off the files, Seble's work redone), two two-box
       counts that only matter when something did not match, and a typed
       "why" under each. Now a normal week is the bank at the end of the
       week, the money spent line by line (the Sunday CFO reads every one),
       one tap on "nothing else", and next week. The checks are one list;
       the answers the rulebook reads — z_recon (–500), f_shortfall
       (–2,000), r_board (the board bonus), a_unauth and f_disc (the
       10,000 Birr control bonus), z_errors (the ZamZam bonus) — keep their
       keys and are worked out from it ({picked:…}, quiet:1), or counted
       from lists that read 0 on a week answered without them (zero:1). */
    { en:'Money in this week', am:'በዚህ ሳምንት የገባ ገንዘብ', fields:[
      {id:'f_adv', en:'How much came in as advance payments this week?', am:'በዚህ ሳምንት ስንት ብር ቅድመ ክፍያ ገባ?', t:'money', auto:{week:'adv_in'}},
      {id:'f_final', en:'How much came in as final payments this week?', am:'በዚህ ሳምንት ስንት ብር የመጨረሻ ክፍያ ገባ?', t:'money', auto:{week:'final_in'}},
      {id:'f_total', en:'How much was collected in total this week?', am:'በዚህ ሳምንት በጠቅላላ ስንት ብር ተሰበሰበ?', t:'money',
        auto:{plus:['f_adv', 'f_final']}}
    ]},
    /* "Cash position" — the bank at the end of the week, and why below the
       reserve — went on 16 Oct 2026: the bank balance is the owner's, sent on
       WhatsApp (apps-script/Bank.js), and the CFO reads it from there. */
    /* Every line here is read by the Sunday CFO (apps-script/Cfo.js) and
       by the 30/60/90-day forecast; they stay asked, one figure each. The
       title is the one the CFO's messages name. */
    { en:'Money spent this week', am:'በዚህ ሳምንት የወጣ ገንዘብ', fields:[
      {id:'sp_sup', en:'How much was paid to suppliers this week — board and materials?', am:'በዚህ ሳምንት ለአቅራቢዎች — ለቦርድና ለዕቃዎች — ስንት ብር ተከፈለ?', t:'money'},
      {id:'sp_sal', en:'How much was paid in salaries and wages this week?', am:'በዚህ ሳምንት ለደመወዝ ስንት ብር ተከፈለ?', t:'money'},
      {id:'sp_asm', en:'How much was paid to assemblers this week?', am:'በዚህ ሳምንት ለገጣጣሚዎች ስንት ብር ተከፈለ?', t:'money', auto:{week:'asm_released_list.amount', from:'betty-daily'},},
      {id:'sp_food', en:'How much was spent on staff food this week?', am:'በዚህ ሳምንት ለሠራተኞች ምግብ ስንት ብር ወጣ?', t:'money'},
      {id:'sp_meals', en:'How many meals did that pay for?', am:'ይህ ገንዘብ ለስንት ምግብ ተከፈለ?', t:'num', show:{f:'sp_food', when:'pos'}},
      {id:'sp_trans', en:'How much was spent on transport and fuel this week?', am:'በዚህ ሳምንት ለትራንስፖርትና ለነዳጅ ስንት ብር ወጣ?', t:'money'},
      {id:'sp_rent', en:'How much rent was paid this week? (0 if none.)', am:'በዚህ ሳምንት ስንት ብር ኪራይ ተከፈለ? (ከሌለ 0።)', t:'money'},
      {id:'sp_util', en:'How much was paid for power and water this week? (0 if none.)', am:'በዚህ ሳምንት ለመብራትና ለውሃ ስንት ብር ተከፈለ? (ከሌለ 0።)', t:'money'},
      {id:'sp_other', en:'How much else went out this week? (0 if none.)', am:'በዚህ ሳምንት ሌላ ስንት ብር ወጣ? (ከሌለ 0።)', t:'money'},
      {id:'sp_other_what', en:'What was it spent on?', am:'ምን ላይ ወጣ?', t:'area',
        picks:[
          { en:'Office supplies',                     am:'የቢሮ ዕቃዎች' },
          { en:'Repairs',                             am:'ጥገና' },
          { en:'Bank charges',                        am:'የባንክ አገልግሎት ክፍያ' },
          { en:'Tax or government fees',              am:'ግብር ወይም የመንግሥት ክፍያ' },
          { en:'Tools or machine parts',              am:'መሣሪያዎች ወይም የማሽን መለዋወጫ' },
          { en:'Telephone and internet',              am:'ስልክና ኢንተርኔት' }
        ], show:{f:'sp_other', when:'pos'}}
    ]},
    /* THE ONE LIST. Eleven yes/no checks and four counts stood in sections
       of their own and were asked every Saturday. */
    { en:'Anything else this week?', am:'በዚህ ሳምንት ሌላ የሆነ ነገር አለ?', fields:[
      {id:'wk_events', en:'What else happened this week?', am:'በዚህ ሳምንት ሌላ ምን ሆነ?', t:'multi', auto:{weekPicks:'fin_events', from:'betty-daily', map:{not_banked:'not_banked', disc:'disc', board_off:'board_off', dispute:'dispute', zz_disc:'zz_err', zz_unreg:'reg_behind'}},
        none:{ en:'Nothing — a normal week', am:'ምንም — የተለመደ ሳምንት' },
        groups:[
          { v:'cash', en:'Cash and bank', am:'ጥሬ ገንዘብና ባንክ' },
          { v:'zz',   en:'ZamZam',        am:'ዘምዘም' },
          { v:'pay',  en:'Payments',      am:'ክፍያዎች' },
          { v:'asm',  en:'Assemblers',    am:'ገጣጣሚዎች' },
          { v:'rec',  en:'Records',       am:'መዝገቦች' }
        ],
        opts:[
          { v:'not_banked',  g:'cash', en:'On some day, cash was not banked the same day', am:'በአንዳንድ ቀን ጥሬ ገንዘብ በዕለቱ ባንክ አልገባም' },
          { v:'no_recon',    g:'cash', en:'The full bank reconciliation was not done on Monday', am:'ሙሉ የባንክ ማስታረቅ ሰኞ አልተሠራም' },
          { v:'disc',        g:'cash', en:'A cash discrepancy was found',               am:'የገንዘብ ልዩነት ተገኘ' },
          { v:'short_late',  g:'cash', en:'A cash shortfall was not flagged in advance', am:'የገንዘብ እጥረት ቀድሞ አልተነገረም' },
          { v:'zz_no_recon', g:'zz',   en:'ZamZam was not reconciled on Monday',        am:'ዘምዘም ሰኞ አልታረቀም' },
          { v:'zz_nomatch',  g:'zz',   en:'A transfer had no approved purchase request', am:'የጸደቀ የግዥ ጥያቄ የሌለው ዝውውር ነበር' },
          { v:'chq_noinv',   g:'zz',   en:'A cheque has no supplier invoice yet',       am:'የአቅራቢ ደረሰኝ ገና ያልመጣለት ቼክ አለ' },
          { v:'zz_err',      g:'zz',   en:'A reconciliation error was found',           am:'የማስታረቅ ስህተት ተገኘ' },
          { v:'unauth',      g:'pay',  en:'A payment went out without proper approval', am:'ያለ ተገቢ ፈቃድ የወጣ ክፍያ ነበር' },
          { v:'asm_late',    g:'asm',  en:'An assembler was paid more than 3 working days after acceptance', am:'ደንበኛው ከተቀበለ ከ3 የሥራ ቀናት በኋላ የተከፈለ ገጣጣሚ ነበር' },
          { v:'dispute',     g:'asm',  en:'An assembler payment dispute is still open', am:'ያልተፈታ የገጣጣሚ ክፍያ ክርክር አለ' },
          { v:'reg_behind',  g:'rec',  en:'A register is behind',                       am:'ወደኋላ የቀረ መዝገብ አለ' },
          { v:'board_off',   g:'rec',  en:'On some day the board did not match the files', am:'በአንዳንድ ቀን ቦርዱ ከፋይሎቹ ጋር አልተመሳሰለም' },
          { v:'joblist_late',g:'rec',  en:'The paid-jobs list did not reach Mahelet by Saturday 1:00 PM', am:'የክፍያ ማረጋገጫ ዝርዝሩ ቅዳሜ ከቀኑ 7፡00 በፊት ለማህሌት አልደረሰም' },
          { v:'seble',       g:'rec',  en:'Work given to Seble needed correcting',      am:'ለሰብለ የተሰጠ ሥራ መስተካከል አስፈለገው' }
        ]}
    ]},
    { en:'Cash checks', am:'የጥሬ ገንዘብ ፍተሻ', fields:[
      {id:'f_banked', en:'Was all cash banked the same day, every day this week?', am:'በዚህ ሳምንት በየዕለቱ ገንዘቡ ሁሉ በዕለቱ ባንክ ገብቷል?', t:'yesno', quiet:1, auto:{picked:'wk_events', v:'not_banked', flip:1}},
      {id:'f_banked_why', en:'Cash stayed out of the bank overnight. Why? (Write the days and how much in the box.)', am:'ጥሬ ገንዘብ ከባንክ ውጭ አደረ። ለምን? (ቀኖቹንና ምን ያህል እንደሆነ በሳጥኑ ይጻፉ።)', t:'area', auto:{weekText:'cash_banked_why', from:'betty-daily'},
        picks:[
          { en:'It came in after the bank closed',    am:'ባንክ ከተዘጋ በኋላ ነው የገባው' },
          { en:'The bank was closed',                 am:'ባንክ ዝግ ነበር' },
          { en:'Nobody could go to the bank',         am:'ወደ ባንክ የሚሄድ ሰው አልነበረም' },
          { en:'Kept for a payment the next day',     am:'በማግሥቱ ለሚከፈል ክፍያ ተቀምጧል' }
        ], show:{f:'f_banked', when:'no'}},
      {id:'f_recon', en:'Was the full bank reconciliation done on Monday?', am:'ሙሉ የባንክ ማስታረቅ ሰኞ ተሠርቷል?', t:'yesno', auto:{picked:'wk_events', v:'no_recon', flip:1}, show:{f:'wk_events', when:'has', v:'no_recon'}, quiet:1,},
      {id:'f_recon_why', en:'The bank reconciliation was not done on Monday. Why, and when will it be?', am:'የባንክ ማስታረቅ ሰኞ አልተሠራም። ለምን? መቼ ይሠራል?', t:'area',
        picks:[
          { en:'No bank statement yet',               am:'የባንክ መግለጫ ገና አልመጣም' },
          { en:'The bank system was down',            am:'የባንኩ ሲስተም አይሠራም ነበር' },
          { en:'No time on Monday',                   am:'ሰኞ ጊዜ አልነበረም' },
          { en:'Done later in the week',              am:'በሳምንቱ ውስጥ ዘግይቶ ተሠርቷል' },
          { en:'Will be done next Monday',            am:'በሚቀጥለው ሰኞ ይሠራል' }
        ], show:{f:'f_recon', when:'no'}},
      {id:'f_disc_any', en:'Was any cash discrepancy found this week?', am:'በዚህ ሳምንት የተገኘ የገንዘብ ልዩነት አለ?', t:'yesno', quiet:1, auto:{picked:'wk_events', v:'disc'}},
      {id:'f_disc_list', en:'List each discrepancy', am:'እያንዳንዱን ልዩነት ይዘርዝሩ', t:'table', addEn:'Add a discrepancy', addAm:'ልዩነት ጨምር',
        show:{f:'f_disc_any', when:'yes'},
        cols:[
          {id:'day', en:'Day', am:'ቀን', t:'text'},
          {id:'amount', en:'Amount', am:'መጠን', t:'money'},
          {id:'where', en:'Where found', am:'የተገኘበት', t:'text', picks:[{ en:'Cash box', am:'የገንዘብ ሳጥን' }, { en:'Bank', am:'ባንክ' }, { en:'ZamZam', am:'ዘምዘም' }, { en:'Cashbook', am:'የሂሳብ መዝገብ' }]},
          {id:'who', en:'Who handled the money', am:'ገንዘቡን የያዘው', t:'text'},
          {id:'done', en:'What was done', am:'የተወሰደ እርምጃ', t:'text', picks:[{ en:'Corrected', am:'ተስተካክሏል' }, { en:'Being checked', am:'እየተጣራ ነው' }, { en:'Chairman told', am:'ለሊቀመንበሩ ተነግሯል' }]}
        ]},
      {id:'f_disc', en:'How many cash discrepancies were found this week?', am:'በዚህ ሳምንት ስንት የገንዘብ ልዩነቶች ተገኙ?', t:'num', auto:{week:'discrepancy', from:'betty-daily', how:'yesdays'},
 sumEn:'discrepancies', sumAm:'ልዩነቶች',
        tgt:{op:'lte', v:0, en:'–500 Birr each', am:'እያንዳንዱ –500 ብር'}},
      {id:'f_disc_value', en:'How much did they come to?', am:'በጠቅላላ ስንት ብር ነበሩ?', t:'money',
        auto:{sum:'f_disc_list.amount'}, sumEn:'in all', sumAm:'በጠቅላላ'},
      /* fined –2,000 on a "no" (betty-shortfall-not-flagged); it stood
         optional and empty on every week with no shortfall */
      {id:'f_shortfall', en:'Was every expected cash shortfall flagged in advance?', am:'የሚጠበቅ የገንዘብ እጥረት ሁሉ ቀድሞ ተነግሯል?', t:'yesno', auto:{picked:'wk_events', v:'short_late', flip:1}, show:{f:'wk_events', when:'has', v:'short_late'}, quiet:1,},
      {id:'f_shortfall_why', en:'A shortfall was not flagged in time. Why? (Write which in the box.)', am:'የገንዘብ እጥረት በጊዜው አልተነገረም። ለምን? (የትኛው እንደሆነ በሳጥኑ ይጻፉ።)', t:'area',
        picks:[
          { en:'A customer did not pay as promised',  am:'ደንበኛ ቃል በገባው መሠረት አልከፈለም' },
          { en:'A bill came that was not planned',    am:'ያልታቀደ ሂሳብ መጣ' },
          { en:'The forecast missed it',              am:'ትንበያው አላየውም' },
          { en:'Found out too late',                  am:'የታወቀው ዘግይቶ ነው' }
        ], show:{f:'f_shortfall', when:'no'}}
    ]},
    { en:'ZamZam Bank', am:'ዘምዘም ባንክ', fields:[
      {id:'z_transfers', en:'How many transfers were made to ZamZam this week?', am:'በዚህ ሳምንት ወደ ዘምዘም ስንት ዝውውሮች ተደረጉ?', t:'num',
        auto:{week:'zz_count'}},
      {id:'z_value', en:'What was the total transferred?', am:'በጠቅላላ ስንት ብር ተላለፈ?', t:'money',
        auto:{week:'zz_transfer'}},
      /* fined –500 on a "no" (betty-zz-no-recon) */
      {id:'z_recon', en:'Was ZamZam Bank reconciled this Monday?', am:'የዘምዘም ባንክ በዚህ ሰኞ ታርቋል?', t:'yesno', auto:{picked:'wk_events', v:'zz_no_recon', flip:1}, show:{f:'wk_events', when:'has', v:'zz_no_recon'}, quiet:1,},
      {id:'z_recon_why', en:'ZamZam was not reconciled on Monday. Why, and when will it be?', am:'ዘምዘም ሰኞ አልታረቀም። ለምን? መቼ ይታረቃል?', t:'area',
        picks:[
          { en:'No bank statement yet',               am:'የባንክ መግለጫ ገና አልመጣም' },
          { en:'Waiting for Getachew\'s cheque list', am:'የጌታቸው የቼክ ዝርዝር እየተጠበቀ ነው' },
          { en:'No time on Monday',                   am:'ሰኞ ጊዜ አልነበረም' },
          { en:'Done later in the week',              am:'በሳምንቱ ውስጥ ዘግይቶ ተሠርቷል' },
          { en:'Will be done next Monday',            am:'በሚቀጥለው ሰኞ ይሠራል' }
        ], show:{f:'z_recon', when:'no'}},
      /* the two counts below were typed every week; on a week when every
         transfer and every cheque matched they only repeated the week's own
         totals, so they open when something did not match */
      {id:'z_matched', en:'How many transfers match an approved purchase request? (matched / all transfers)', am:'ስንቱ ዝውውር ከጸደቀ የግዥ ጥያቄ ጋር ይመሳሰላል? (የተመሳሰለ / ሁሉም ዝውውሮች)', t:'ratio', auto:{a:{week:'zz_list', count:1, from:'betty-daily', when:[{col:'req'}, {col:'match', is:'yes'}]}, b:{week:'zz_list', count:1, from:'betty-daily'}}, show:{f:'z_transfers', when:'pos'},
},
      {id:'z_matched_why', en:'Why did a transfer go without an approved request? (Write which and how much in the box.)', am:'የጸደቀ ጥያቄ ሳይኖር ዝውውር ለምን ተደረገ? (የትኛውና ስንት ብር እንደሆነ በሳጥኑ ይጻፉ።)', t:'area',
        picks:[
          { en:'Urgent — the request came after',     am:'አስቸኳይ ነበር — ጥያቄው በኋላ መጣ' },
          { en:'The request is not signed yet',       am:'ጥያቄው ገና አልተፈረመም' },
          { en:'Paid for a job, not a purchase',      am:'ለሥራ እንጂ ለግዥ አልተከፈለም' },
          { en:'A mistake',                           am:'ስህተት ነበር' }
        ], show:{f:'z_matched', when:'short'}},
      {id:'z_cheques', en:'How many cheques match a supplier invoice? (matched / all cheques)', am:'ስንቱ ቼክ ከአቅራቢ ደረሰኝ ጋር ይመሳሰላል? (የተመሳሰለ / ሁሉም ቼኮች)', t:'ratio',
        show:{f:'wk_events', when:'has', v:'chq_noinv'}},
      {id:'z_cheques_why', en:'Why is there no invoice yet, and when will it come? (Write which cheques and suppliers in the box.)', am:'ደረሰኙ ለምን ገና አልመጣም? መቼ ይመጣል? (የትኞቹ ቼኮችና አቅራቢዎች እንደሆኑ በሳጥኑ ይጻፉ።)', t:'area',
        picks:[
          { en:'The supplier has not sent it',        am:'አቅራቢው ገና አልላከውም' },
          { en:'Getachew has not brought it',         am:'ጌታቸው ገና አላመጣውም' },
          { en:'It comes with the delivery',          am:'ከዕቃው ጋር ይመጣል' },
          { en:'Will come this week',                 am:'በዚህ ሳምንት ይመጣል' }
        ], show:{f:'z_cheques', when:'short'}},
      /* the 1,000 Birr ZamZam bonus needs these to add up to 0 for the month */
      {id:'z_errors', en:'How many reconciliation errors were found?', am:'ስንት የማስታረቅ ስህተቶች ተገኙ?', t:'num', zero:1,
        show:{f:'wk_events', when:'has', v:'zz_err'},
        tgt:{op:'lte', v:0, en:'Zero errors earns the 1,000 Birr bonus',
             am:'ዜሮ ስህተት 1,000 ብር ቦነስ ያስገኛል'}},
      {id:'z_errors_what', en:'What were they, and was Kidan told the same day? (Write how much in the box.)', am:'ምን ምን ነበሩ? በዕለቱ ለኪዳን ተነግሯል? (ምን ያህል እንደሆነ በሳጥኑ ይጻፉ።)', t:'area',
        picks:[
          { en:'An amount entered wrong',             am:'መጠን በስህተት ገብቷል' },
          { en:'A transfer entered twice',            am:'ዝውውር ሁለት ጊዜ ገብቷል' },
          { en:'A transfer missing from the register', am:'ከመዝገቡ የጎደለ ዝውውር' },
          { en:'A bank charge not recorded',          am:'ያልተመዘገበ የባንክ ክፍያ' },
          { en:'Kidan was told the same day',         am:'በዕለቱ ለኪዳን ተነግሯል' },
          { en:'Kidan not told yet',                  am:'ለኪዳን ገና አልተነገረም' }
        ], show:{f:'z_errors', when:'pos'}}
    ]},
    { en:'Payments approved', am:'የጸደቁ ክፍያዎች', fields:[
      {id:'a_count', en:'How many payments were approved this week?', am:'በዚህ ሳምንት ስንት ክፍያዎች ጸደቁ?', t:'num',
        auto:{week:'pay_approved'}},
      {id:'a_value', en:'What was their total value?', am:'ጠቅላላ ዋጋቸው ስንት ነው?', t:'money',
        auto:{week:'pay_value'}},
      {id:'a_kidan', en:'How many payments over 50,000 Birr went to Kidan?', am:'ከ50,000 ብር በላይ ስንት ክፍያዎች ለኪዳን ተላኩ?', t:'num',
        auto:{week:'pay_kidan'}},
      {id:'a_unauth_any', en:'Did any payment go out without proper approval this week?', am:'በዚህ ሳምንት ያለ ተገቢ ፈቃድ የተከፈለ ክፍያ አለ?', t:'yesno', auto:{picked:'wk_events', v:'unauth'}, show:{f:'wk_events', when:'has', v:'unauth'}, quiet:1,},
      {id:'a_unauth_list', en:'List each one', am:'እያንዳንዱን ይዘርዝሩ', t:'table', auto:{weekRows:'pay_list', from:'betty-daily', when:[{col:'amount', gte:50001}, {col:'kidan', is:'no'}], map:{to:'to', amount:'amount'}}, show:{f:'a_unauth', when:'pos'}, addEn:'Add a payment', addAm:'ክፍያ ጨምር',

        cols:[
          {id:'to', en:'Paid to', am:'ተከፋይ', t:'text'},
          {id:'amount', en:'Amount', am:'መጠን', t:'money'},
          {id:'by', en:'Who authorised it', am:'ያዘዘው', t:'text'},
          {id:'why', en:'Why', am:'ለምን', t:'text', picks:[{ en:'Urgent payment', am:'አስቸኳይ ክፍያ' }, { en:'The approver was away', am:'የሚፈቅደው ሰው አልነበረም' }, { en:'Forgot', am:'ተረስቷል' }]}
        ]},
      {id:'a_unauth', en:'How many payments went out without proper approval?', am:'ስንት ክፍያዎች ያለ ተገቢ ፈቃድ ተከፈሉ?', t:'num', auto:{week:'pay_list', count:1, from:'betty-daily', when:[{col:'amount', gte:50001}, {col:'kidan', is:'no'}]},
 sumEn:'without approval', sumAm:'ያለ ፈቃድ',
        tgt:{op:'lte', v:0, en:'–5,000 Birr each', am:'እያንዳንዱ –5,000 ብር'}}
    ]},
    { en:'Assembler payments', am:'የገጣጣሚዎች ክፍያ', fields:[
      {id:'as_reserved', en:'How much was reserved for assemblers this week?', am:'በዚህ ሳምንት ለተከላ ሠራተኞች ስንት ብር ተያዘ?', t:'money',
        auto:{week:'asm_reserved'}},
      {id:'as_released', en:'How many assembler payments were released?', am:'ስንት የገጣጣሚዎች ክፍያዎች ተለቀቁ?', t:'num', auto:{week:'asm_released'}},
      {id:'as_rel_value', en:'How much did that come to?', am:'በጠቅላላ ስንት ብር ሆነ?', t:'money',
        auto:{week:'asm_rel_value'}},
      {id:'as_late', en:'How many were released more than 3 working days after customer acceptance?', am:'ስንቱ ደንበኛው ከተቀበለ ከ3 የሥራ ቀናት በኋላ ተለቀቁ?', t:'num',
        auto:{week:'asm_rel_late'},
        tgt:{op:'lte', v:0, en:'–300 Birr per day late', am:'በዘገየ ቀን –300 ብር'}},
      {id:'as_late_any', en:'Was any released later than that?', am:'ከዚያ ዘግይቶ የተለቀቀ አለ?', t:'yesno', auto:{picked:'wk_events', v:'asm_late'}, show:{f:'wk_events', when:'has', v:'asm_late'}, quiet:1,},
      {id:'as_late_list', en:'Which ones?', am:'የትኞቹ?', t:'table', auto:{weekRows:'asm_released_list', from:'betty-daily', when:{col:'days', gte:4}, map:{who:'who', code:'code', days:null}}, show:{f:'as_late', when:'pos'}, addEn:'Add a payment', addAm:'ክፍያ ጨምር',

        cols:[
          {id:'who', en:'Assembler', am:'ገጣጣሚ', t:'text'},
          {id:'code', en:'Job code', am:'የሥራ ኮድ', t:'text'},
          {id:'days', en:'Days late', am:'የዘገየበት ቀን', t:'num'},
          {id:'why', en:'Why', am:'ለምን', t:'text', picks:[{ en:'Funds not ready', am:'ገንዘቡ ዝግጁ አልነበረም' }, { en:'Slip not received', am:'ወረቀቱ አልደረሰም' }, { en:'Job not accepted yet', am:'ሥራው ገና አልተረከበም' }]}
        ]},
      {id:'as_disputes', en:'How many payment disputes are still open?', am:'ስንት የክፍያ ክርክሮች ገና አልተፈቱም?', t:'num', auto:{week:'asm_disputes', from:'betty-daily', how:'last'}, zero:1,
        show:{f:'wk_events', when:'has', v:'dispute'}},
      {id:'as_disputes_what', en:'What is each dispute about, and when will it be settled? (Write who, and how long it has been open, in the box.)', am:'እያንዳንዱ ክርክር ስለምን ነው? መቼ ይፈታል? (የማን እንደሆነና ስንት ጊዜ እንደቆየ በሳጥኑ ይጻፉ።)', t:'area', auto:{weekText:'asm_disputes_what', from:'betty-daily'},
        picks:[
          { en:'The amount — m² or rate',             am:'መጠኑ — ካሬ ሜትር ወይም ዋጋ' },
          { en:'Paid late',                           am:'ዘግይቶ ተከፈለ' },
          { en:'The customer has not accepted the work', am:'ደንበኛው ሥራውን ገና አልተቀበለም' },
          { en:'Rework or damage taken off',          am:'ለተመለሰ ሥራ ወይም ለጉዳት ተቀንሷል' },
          { en:'Settled next week',                   am:'በሚቀጥለው ሳምንት ይፈታል' },
          { en:'Needs the Chairman',                  am:'ሊቀመንበሩ ያስፈልጋሉ' }
        ], show:{f:'as_disputes', when:'pos'}}
    ]},
    { en:'Registers, board and documents', am:'መዝገቦች፣ ቦርድና ሰነዶች', fields:[
      {id:'r_registers', en:'Are all registers up to date — supplier, advance, assembler and ZamZam?', am:'ሁሉም መዝገቦች — የአቅራቢ፣ የቅድመ ክፍያ፣ የገጣጣሚዎችና የዘምዘም — ተሞልተዋል?', t:'yesno', quiet:1, auto:{picked:'wk_events', v:'reg_behind', flip:1}},
      {id:'r_registers_why', en:'Which register is behind, and when will it be up to date? (Write by how much in the box.)', am:'የትኛው መዝገብ ወደኋላ ቀርቷል? መቼ ይሟላል? (በምን ያህል እንደቀረ በሳጥኑ ይጻፉ።)', t:'area', auto:{weekText:'zz_register_why', from:'betty-daily'},
        picks:[
          { en:'The supplier register',               am:'የአቅራቢ መዝገብ' },
          { en:'The advance register',                am:'የቅድመ ክፍያ መዝገብ' },
          { en:'The assembler register',              am:'የገጣጣሚዎች መዝገብ' },
          { en:'The ZamZam register',                 am:'የዘምዘም መዝገብ' },
          { en:'Up to date by Monday',                am:'እስከ ሰኞ ይሟላል' },
          { en:'Up to date this week',                am:'በዚህ ሳምንት ይሟላል' }
        ], show:{f:'r_registers', when:'no'}},
      /* the 2,000 Birr board bonus needs no "no" here in the month */
      {id:'r_board', en:'Did the board match the physical files all week?', am:'ቦርዱ ሳምንቱን ሙሉ ከፋይሎቹ ጋር ተመሳስሏል?', t:'yesno', quiet:1, auto:{picked:'wk_events', v:'board_off', flip:1}},
      {id:'r_board_why', en:'What did not match, and was it put right? (Write which job cards in the box.)', am:'ምኑ አልተመሳሰለም? ተስተካክሏል? (የትኞቹ ካርዶች እንደሆኑ በሳጥኑ ይጻፉ።)', t:'area', auto:{weekText:'board_mismatch_what', from:'betty-daily'},
        picks:[
          { en:'Card ahead of the file',              am:'ካርዱ ከፋይሉ ቀድሟል' },
          { en:'Card behind the file',                am:'ካርዱ ከፋይሉ ወደኋላ ቀርቷል' },
          { en:'A card or a file missing',            am:'ካርድ ወይም ፋይል ጠፍቷል' },
          { en:'Put right this week',                 am:'በዚህ ሳምንት ተስተካክሏል' },
          { en:'Not put right yet',                   am:'ገና አልተስተካከለም' }
        ], show:{f:'r_board', when:'no'}},
      {id:'r_docs_missing', en:'How many documents are still missing?', am:'እስካሁን ስንት ሰነዶች ጎድለዋል?', t:'num', auto:{week:'doc_missing', how:'last'}},
      {id:'r_docs_list', en:'Which documents, and from whom? (Write since when in the box.)', am:'የትኞቹ ሰነዶች? ከማን? (ከመቼ ጀምሮ እንደሆነ በሳጥኑ ይጻፉ።)', t:'area',
        picks:[
          { en:'Supplier invoices',                   am:'የአቅራቢ ደረሰኞች' },
          { en:'Delivery notes',                      am:'የዕቃ መረከቢያ ወረቀቶች' },
          { en:'Receipts',                            am:'ደረሰኞች' },
          { en:'From Getachew',                       am:'ከጌታቸው' },
          { en:'From a supplier',                     am:'ከአቅራቢ' },
          { en:'From the store',                      am:'ከመጋዘን' }
        ], show:{f:'r_docs_missing', when:'pos'}},
      {id:'r_joblist', en:'Did the payment-confirmed job list reach Mahelet by Saturday 1:00 PM?',
        am:'የክፍያ ማረጋገጫ ዝርዝሩ ቅዳሜ ከቀኑ 7፡00 በፊት ለማህሌት ደርሷል?', t:'yesno', auto:{picked:'wk_events', v:'joblist_late', flip:1}, show:{f:'wk_events', when:'has', v:'joblist_late'}, quiet:1,},
      {id:'r_joblist_why', en:'The list was late. Why? (Write when it went in the box.)', am:'ዝርዝሩ ዘገየ። ለምን? (መቼ እንደተላከ በሳጥኑ ይጻፉ።)', t:'area',
        picks:[
          { en:'Payments were not confirmed in time', am:'ክፍያዎች በጊዜው አልተረጋገጡም' },
          { en:'Waiting for the bank',                am:'ባንኩ እየተጠበቀ ነበር' },
          { en:'No time on Saturday morning',         am:'ቅዳሜ ጠዋት ጊዜ አልነበረም' },
          { en:'Sent later on Saturday',              am:'ቅዳሜ ዘግይቶ ተልኳል' }
        ], show:{f:'r_joblist', when:'no'}},
      {id:'seble_err', en:'Did any work delegated to Seble need correcting this week?', am:'በዚህ ሳምንት ለሰብለ የተሰጠ ሥራ መስተካከል አስፈልጎታል?', t:'yesno', auto:{picked:'wk_events', v:'seble'}, show:{f:'wk_events', when:'has', v:'seble'}, quiet:1,},
      {id:'seble_err_what', en:'What was wrong, and what was done so it does not happen again? (Write how often in the box.)', am:'ምን ተሳስቶ ነበር? እንዳይደገም ምን ተደረገ? (ስንት ጊዜ እንደሆነ በሳጥኑ ይጻፉ።)', t:'area',
        picks:[
          { en:'Wrong figures',                       am:'የተሳሳቱ አኃዞች' },
          { en:'A card moved wrongly',                am:'ካርድ በስህተት ተንቀሳቅሷል' },
          { en:'Documents not collected',             am:'ሰነዶች አልተሰበሰቡም' },
          { en:'A report late',                       am:'ሪፖርት ዘገየ' },
          { en:'Shown again how to do it',            am:'እንዴት እንደምትሠራው እንደገና ተነግሯታል' },
          { en:'Checked before it goes, from now on', am:'ከአሁን በኋላ ከመላኩ በፊት ይረጋገጣል' }
        ], show:{f:'seble_err', when:'yes'}}
    ]},
    { en:'Problems and help', am:'ችግርና እርዳታ', fields:[
      {id:'w_problem', en:'What was the biggest problem this week?', am:'የዚህ ሳምንት ትልቁ ችግር ምን ነበር?', t:'area', auto:{weekText:'problem', from:'betty-daily'}, opt:1,
        picks:[
          { en:'Customers paid late',                 am:'ደንበኞች ዘግይተው ከፈሉ' },
          { en:'The bank came close to 6 million',    am:'የባንክ ቀሪው ወደ 6 ሚሊዮን ተጠጋ' },
          { en:'Big supplier bills',                  am:'ትላልቅ የአቅራቢ ሂሳቦች' },
          { en:'Documents came late',                 am:'ሰነዶች ዘገዩ' },
          { en:'Waiting for approvals',               am:'ፈቃድ መጠበቅ' },
          { en:'The bank system was down',            am:'የባንኩ ሲስተም አይሠራም ነበር' }
        ]},
      /* opens once a problem is named — on a week with none it was a second
         empty box */
      {id:'w_action', en:'What was done about it? (Write who, and by when, in the box.)', am:'ምን እርምጃ ተወሰደ? (በማንና እስከ መቼ በሳጥኑ ይጻፉ።)', t:'area', opt:1,
        picks:[
          { en:'Chased the customers',                am:'ደንበኞቹ ተከታትለዋል' },
          { en:'Held non-essential payments',         am:'አስፈላጊ ያልሆኑ ክፍያዎች ቆመዋል' },
          { en:'The Chairman was told',               am:'ለሊቀመንበሩ ተነግሯል' },
          { en:'Kidan was told',                      am:'ለኪዳን ተነግሯል' },
          { en:'Fixed this week',                     am:'በዚህ ሳምንት ተስተካክሏል' },
          { en:'Not fixed yet',                       am:'ገና አልተስተካከለም' }
        ], show:{f:'w_problem', when:'any'}},
      {id:'w_support', en:'What do you need, and from whom?', am:'ምን ያስፈልግዎታል? ከማን?', t:'area', auto:{weekText:'need_help', from:'betty-daily'}, opt:1,
        picks:[
          { en:'Nothing needed',                      am:'ምንም አያስፈልግም', nil:1 },
          { en:'Sales to chase customer payments',    am:'ሽያጭ የደንበኛ ክፍያዎችን እንዲከታተል' },
          { en:'Documents from Getachew on time',     am:'ከጌታቸው ሰነዶች በጊዜው' },
          { en:'Kidan\'s approvals sooner',           am:'የኪዳን ፈቃድ ቶሎ እንዲደርስ' },
          { en:'Mahelet to confirm job stages',       am:'ማህሌት የሥራ ደረጃዎችን እንድታረጋግጥ' },
          { en:'A decision from the Chairman',        am:'የሊቀመንበሩ ውሳኔ' }
        ]},
      {id:'need_chair', en:'Do you need a decision from the Chairman?', am:'የሊቀመንበሩ ውሳኔ ያስፈልግዎታል?', t:'yesno', auto:{week:'need_chair', from:'betty-daily', how:'anyyes'}, yes:{en:'I need a decision', am:'ውሳኔ ያስፈልገኛል'}, no:{en:'No decision needed', am:'ውሳኔ አያስፈልገኝም'}},
      {id:'need_chair_what', en:'What should the Chairman decide, and by when? (Write the options in the box.)', am:'ሊቀመንበሩ ምን መወሰን አለባቸው? እስከ መቼ? (አማራጮቹን በሳጥኑ ይጻፉ።)', t:'area', auto:{weekText:'need_chair_what', from:'betty-daily'},
        picks:[
          { en:'Approve a payment',                   am:'ክፍያ ማጽደቅ' },
          { en:'Which bills to pay first',            am:'የትኞቹ ሂሳቦች ቀድመው እንደሚከፈሉ' },
          { en:'Hold payments until the bank recovers', am:'ባንኩ እስኪመለስ ክፍያዎችን ማቆም' },
          { en:'A customer who has not paid',         am:'ያልከፈለ ደንበኛ' },
          { en:'A supplier asking to be paid early',  am:'ቀድሞ እንዲከፈለው የሚጠይቅ አቅራቢ' },
          { en:'Needed this week',                    am:'በዚህ ሳምንት ያስፈልጋል' },
          { en:'Needed next week',                    am:'በሚቀጥለው ሳምንት ያስፈልጋል' }
        ], show:{f:'need_chair', when:'yes'}}
    ]},
    { en:'Next week', am:'የሚቀጥለው ሳምንት', fields:[
      {id:'next_week', en:'What are your top 3 things next week — including any tax or statutory payment falling due?', am:'በሚቀጥለው ሳምንት ዋና ሦስት ሥራዎች ምንድን ናቸው? — የሚደርስ የግብር ወይም የሕግ ክፍያ ካለ ጨምሮ', t:'area',
        picks:[
          { en:'A tax or statutory payment falls due', am:'የግብር ወይም የሕግ ክፍያ ይደርሳል' },
          { en:'Salaries',                            am:'ደመወዝ' },
          { en:'Chase final payments',                am:'የመጨረሻ ክፍያዎችን መከታተል' },
          { en:'Pay suppliers falling due',           am:'ጊዜያቸው የደረሰ አቅራቢዎችን መክፈል' },
          { en:'Reconcile the bank and ZamZam on Monday', am:'ሰኞ ባንኩንና ዘምዘምን ማስታረቅ' },
          { en:'Bring the registers up to date',      am:'መዝገቦቹን ማሟላት' },
          { en:'Collect missing documents',           am:'የጎደሉ ሰነዶችን መሰብሰብ' },
          { en:'Keep the bank above 6 million',       am:'የባንክ ቀሪውን ከ6 ሚሊዮን በላይ ማቆየት' }
        ]}
    ]}
  ]
},

/* ============== BETELHEM — WEEKLY CUSTOMER EXPERIENCE ============== */
{
  id:'betty-weekly-cx', person:'betty', cadence:'weekly', built:1, dueTime:'11:00', dueDay:1,
  en:'Weekly Customer Experience Summary', am:'ሳምንታዊ የደንበኛ አገልግሎት ሪፖርት',
  toEn:'Chairman + Ephrata + Kidan', toAm:'ሊቀመንበር + ኤፍራታ + ኪዳን',
  dueEn:'Monday 11:00 AM', dueAm:'ሰኞ ከጠዋቱ 5፡00 (11:00 AM)',
  penEn:'Late or not sent –500 Birr', penAm:'ዘግይቶ ወይም ካልቀረበ –500 ብር',
  derived:1,
  sections:[
    /* REBUILT 11 Oct 2026 (the Chairman: "they are struggling so much with
       the questions"). Never filed yet. 15 questions stood on screen on a
       Monday morning; three were counts the list of last week's complaints
       already holds (how many resolved, how many still open) or the daily
       pulses already said (how many groups), two were checks that only
       matter when something went wrong, and a score was asked even when
       no customer gave one. Now a normal week is the complaints, what
       customers said, how many scored, one tap on "nothing else", and this
       week's fix. cx_repeat, cx_score and cx_rated — read by the customer
       reader — keep their keys; cx_repeat files a real 0 (zero:1). */
    { en:'Customer pulse last week', am:'ያለፈው ሳምንት የደንበኛ ስሜት', fields:[
      /* the most groups any day's pulse said were active */
      {id:'cx_groups', en:'How many customer groups were active last week?', am:'ባለፈው ሳምንት ስንት የደንበኛ ግሩፖች ንቁ ነበሩ?', t:'num', auto:{week:'pl_groups', how:'max'}},
      {id:'cx_contacted', en:'How many customers did you speak to directly?', am:'ስንት ደንበኞችን በቀጥታ አነጋገሩ?', t:'num', auto:{week:'pl_called'}}
    ]},
    { en:'Complaints', am:'ቅሬታዎች', fields:[
      {id:'cx_new_any', en:'Did any new complaint come in last week?', am:'ባለፈው ሳምንት የደረሰ አዲስ ቅሬታ አለ?', t:'yesno', yes:{en:'New complaints came in', am:'አዲስ ቅሬታ መጥቷል'}, no:{en:'No new complaint', am:'አዲስ ቅሬታ የለም'}},
      {id:'cx_new_list', en:'List each new complaint', am:'እያንዳንዱን አዲስ ቅሬታ ይዘርዝሩ', t:'table', auto:{weekRows:'pl_list', from:'betty-pulse', map:{cust:'cust', job:'job', issue:'issue', state:'state'}}, show:{f:'cx_new', when:'pos'}, addEn:'Add complaint', addAm:'ቅሬታ ጨምር',

        cols:[
          {id:'cust', en:'Customer', am:'ደንበኛ', t:'text'},
          {id:'job', en:'Job code', am:'የሥራ ኮድ', t:'text'},
          {id:'issue', en:'About', am:'ስለ ምን', t:'text', picks:COL_COMPLAINT},
          {id:'dept', en:'Department at fault', am:'ተጠያቂ ክፍል', t:'text', picks:COL_DEPT},
          {id:'state', en:'Status', am:'ሁኔታ', t:'choice', opts:[
            {v:'open',   en:'Open', am:'ክፍት'},
            {v:'working',en:'Being worked on', am:'በሥራ ላይ'},
            {v:'closed', en:'Resolved', am:'ተፈቷል'}]}
        ]},
      {id:'cx_new', en:'How many new complaints came in last week?', am:'ባለፈው ሳምንት ስንት አዲስ ቅሬታዎች መጡ?', t:'num', auto:{week:'pl_list', count:1, from:'betty-pulse'},
 sumEn:'complaints', sumAm:'ቅሬታዎች'},
      /* both were typed under the list that already says each one's status */
      {id:'cx_resolved', en:'How many were resolved?', am:'ስንቱ ተፈቱ?', t:'num',
        auto:{rows:'cx_new_list', when:{col:'state', is:'closed'}}, sumEn:'resolved', sumAm:'ተፈተዋል'},
      {id:'cx_open', en:'How many are still open?', am:'ስንቱ ገና አልተፈቱም?', t:'num',
        auto:{rows:'cx_new_list', when:{col:'state', not:'closed'}}, sumEn:'still open', sumAm:'ገና ያልተፈቱ'},
      {id:'cx_open_why', en:'What are the open ones waiting for, and when will they close? (Write which, and who owns each, in the box.)', am:'ያልተፈቱት ምን እየጠበቁ ነው? መቼ ይዘጋሉ? (የትኞቹ እንደሆኑና እያንዳንዱን ማን እንደያዘው በሳጥኑ ይጻፉ።)', t:'area', auto:{weekText:'pl_open_why', from:'betty-pulse'},
        picks:[
          { en:'Waiting for the factory',             am:'ፋብሪካውን እየጠበቀ ነው' },
          { en:'Waiting for the site team',           am:'የተከላ ቡድኑን እየጠበቀ ነው' },
          { en:'Waiting for a part or material',      am:'መለዋወጫ ወይም ዕቃ እየጠበቀ ነው' },
          { en:'Waiting for the customer',            am:'ደንበኛውን እየጠበቀ ነው' },
          { en:'Waiting for a decision',              am:'ውሳኔ እየጠበቀ ነው' },
          { en:'Closes this week',                    am:'በዚህ ሳምንት ይዘጋል' }
        ], show:{f:'cx_open', when:'pos'}}
    ]},
    { en:'What customers said', am:'ደንበኞች ያሉት', fields:[
      {id:'cx_good', en:'What did customers praise last week?', am:'ባለፈው ሳምንት ደንበኞች ምን አደነቁ?', t:'area', auto:{weekText:'pl_good', from:'betty-pulse'}, opt:1,
        picks:[
          { en:'The quality',                         am:'ጥራቱን' },
          { en:'On-time installation',                am:'በሰዓቱ የተደረገውን ተከላ' },
          { en:'The site team',                       am:'የተከላ ቡድኑን' },
          { en:'The design',                          am:'ዲዛይኑን' },
          { en:'Quick answers',                       am:'ፈጣን ምላሽን' },
          { en:'The price',                           am:'ዋጋውን' }
        ]},
      {id:'cx_bad', en:'What did customers complain about most?', am:'ደንበኞች በብዛት ያማረሩት በምን ላይ ነው?', t:'area', auto:{weekText:'pl_bad', from:'betty-pulse'}, opt:1,
        picks:[
          { en:'Delays',                              am:'መዘግየት' },
          { en:'Installation problems',               am:'የተከላ ችግሮች' },
          { en:'Quality or damage',                   am:'ጥራት ወይም ጉዳት' },
          { en:'Slow answers',                        am:'የዘገየ ምላሽ' },
          { en:'Measurement mistakes',                am:'የልኬት ስህተት' },
          { en:'Price or payment',                    am:'ዋጋ ወይም ክፍያ' }
        ]},
      {id:'cx_pattern', en:'Is there a pattern the Chairman should see?', am:'ሊቀመንበሩ ሊያዩት የሚገባ ተደጋጋሚ ጉዳይ አለ?', t:'area', opt:1,
        picks:[
          { en:'No pattern this week',                am:'በዚህ ሳምንት ተደጋጋሚ ጉዳይ የለም' },
          { en:'The same problem again and again',    am:'ያው ችግር ደጋግሞ' },
          { en:'The same stage again and again',      am:'ያው ደረጃ ደጋግሞ' },
          { en:'The same team again and again',       am:'ያው ቡድን ደጋግሞ' },
          { en:'The same kind of defect',             am:'ያው ዓይነት ጉድለት' }
        ]}
    ]},
    { en:'Satisfaction', am:'እርካታ', fields:[
      /* the count first: the average was asked even on a week nobody scored */
      {id:'cx_rated', en:'How many customers gave a satisfaction score?', am:'ስንት ደንበኞች የእርካታ ነጥብ ሰጡ?', t:'num'},
      {id:'cx_score', en:'What was their average score, out of 5?', am:'አማካይ ነጥባቸው ከ5 ስንት ነው?', t:'num',
        show:{f:'cx_rated', when:'pos'}}
    ]},
    { en:'Anything else last week?', am:'ባለፈው ሳምንት ሌላ የሆነ ነገር አለ?', fields:[
      {id:'cx_events', en:'What else happened with customers last week?', am:'ባለፈው ሳምንት ከደንበኞች ጋር ሌላ ምን ሆነ?', t:'multi', auto:{weekPicks:'pl_events', from:'betty-pulse', map:{not_told:'late_told'}},
        none:{ en:'Nothing — a normal week', am:'ምንም — የተለመደ ሳምንት' },
        opts:[
          { v:'late_pulse', en:'A daily pulse report was late or missed',    am:'የዕለቱ የደንበኛ ስሜት ሪፖርት ዘገየ ወይም ቀረ' },
          { v:'late_told',  en:'A complaint was not reported the same day',  am:'በዕለቱ ያልተነገረ ቅሬታ ነበር' },
          { v:'repeat',     en:'A customer complained more than once',       am:'ከአንድ ጊዜ በላይ ያማረረ ደንበኛ ነበር' }
        ]}
    ]},
    { en:'Late reports and repeat complaints', am:'የዘገዩ ሪፖርቶችና ተደጋጋሚ ቅሬታዎች', fields:[
      /* the pulse bonus is judged from the ledger, not from this count */
      {id:'cx_reports', en:'How many daily pulse reports went out on time? (on time / due)', am:'ስንቱ ዕለታዊ የደንበኛ ስሜት ሪፖርት በሰዓቱ ተላከ? (በሰዓቱ / የሚገባው)', t:'ratio',
        show:{f:'cx_events', when:'has', v:'late_pulse'},
        tgt:{op:'gte', v:5, en:'All 5 on time earns the 3,000 Birr bonus',
             am:'አምስቱም በሰዓቱ ከተላኩ 3,000 ብር ቦነስ'}},
      {id:'cx_reports_why', en:'Why was it late or missed? (Write which days in the box.)', am:'ለምን ዘገየ ወይም ቀረ? (የትኞቹ ቀናት እንደሆኑ በሳጥኑ ይጻፉ።)', t:'area',
        picks:[
          { en:'Too much work that day',              am:'በዚያ ቀን ሥራ በዛ' },
          { en:'Seble was absent',                    am:'ሰብለ አልነበረችም' },
          { en:'No network or power',                 am:'ኔትወርክ ወይም መብራት አልነበረም' },
          { en:'Groups not read in time',             am:'ግሩፖቹ በጊዜው አልተነበቡም' },
          { en:'Forgot',                              am:'ተረስቷል' }
        ], show:{f:'cx_reports', when:'short'}},
      {id:'cx_sameday', en:'Was every complaint reported the same day?', am:'እያንዳንዱ ቅሬታ በዕለቱ ተነግሯል?', t:'yesno', quiet:1, auto:{picked:'cx_events', v:'late_told', flip:1}},
      {id:'cx_sameday_why', en:'A complaint was reported late. Why? (Write which complaint in the box.)', am:'ቅሬታ ዘግይቶ ተነገረ። ለምን? (የትኛው ቅሬታ እንደሆነ በሳጥኑ ይጻፉ።)', t:'area', auto:{weekText:'pl_sameday_why', from:'betty-pulse'},
        picks:[
          { en:'Heard about it late',                 am:'ዘግይቶ ነው የታወቀው' },
          { en:'Too much work that day',              am:'በዚያ ቀን ሥራ በዛ' },
          { en:'Seble did not pass it on',            am:'ሰብለ አላስተላለፈችም' },
          { en:'Forgot',                              am:'ተረስቷል' }
        ], show:{f:'cx_sameday', when:'no'}},
      /* no daily report says this, so the built weekly leaves it blank —
         it was filed as 0 every week (the bug hunt, 15 Oct 2026) */
      {id:'cx_repeat', en:'How many customers complained more than once?', am:'ስንት ደንበኞች ከአንድ ጊዜ በላይ አማረሩ?', t:'num'},
      {id:'cx_repeat_who', en:'Why did the first fix not hold? (Write who, and about what each time, in the box.)', am:'የመጀመሪያው መፍትሔ ለምን አልጸናም? (እነማን እንደሆኑና በየጊዜው ስለምን እንደሆነ በሳጥኑ ይጻፉ።)', t:'area',
        picks:[
          { en:'The same problem came back',          am:'ያው ችግር ተመልሶ መጣ' },
          { en:'A new problem on the same job',       am:'በዚያው ሥራ ላይ አዲስ ችግር' },
          { en:'The fix was not finished',            am:'ማስተካከያው አላለቀም' },
          { en:'Nobody called them back',             am:'ማንም መልሶ አልደወለላቸውም' }
        ], show:{f:'cx_repeat', when:'pos'}}
    ]},
    { en:'What happens next', am:'ቀጣዩ እርምጃ', fields:[
      {id:'cx_fix', en:'What one change would stop the most complaints this week, and who must make it?', am:'በዚህ ሳምንት ብዙ ቅሬታዎችን የሚያስቀር አንድ ለውጥ ምንድን ነው? ማን ሊያደርገው ይገባል?', t:'area',
        picks:[
          { en:'Call customers before we arrive (Elyas)', am:'ከመድረሳችን በፊት ደንበኞችን መደወል (ኤልያስ)' },
          { en:'Check every job before it leaves (Wude)', am:'ከመውጣቱ በፊት እያንዳንዱን ሥራ መፈተሽ (ውዱ)' },
          { en:'Answer WhatsApp faster (sales)',      am:'ዋትስአፕን ፈጥኖ መመለስ (ሽያጭ)' },
          { en:'Keep the promised dates (Mahelet)',   am:'የተገቡትን ቀኖች መጠበቅ (ማህሌት)' },
          { en:'Measure again before production (design)', am:'ከምርት በፊት እንደገና መለካት (ዲዛይን)' },
          { en:'Finish rework faster (factory)',      am:'የተመለሰ ሥራን ፈጥኖ መጨረስ (ፋብሪካ)' }
        ]},
      {id:'need_chair', en:'Do you need a decision from the Chairman?', am:'የሊቀመንበሩ ውሳኔ ያስፈልግዎታል?', t:'yesno', auto:{week:'pl_chair', from:'betty-pulse', how:'anyyes'}, yes:{en:'I need a decision', am:'ውሳኔ ያስፈልገኛል'}, no:{en:'No decision needed', am:'ውሳኔ አያስፈልገኝም'}},
      {id:'need_chair_what', en:'What should the Chairman decide, and by when? (Write the options in the box.)', am:'ሊቀመንበሩ ምን መወሰን አለባቸው? እስከ መቼ? (አማራጮቹን በሳጥኑ ይጻፉ።)', t:'area', auto:{weekText:'pl_what', from:'betty-pulse'},
        picks:[
          { en:'A refund or a discount',              am:'ገንዘብ መመለስ ወይም ቅናሽ' },
          { en:'A new date for a customer',           am:'ለደንበኛ አዲስ ቀን' },
          { en:'Who pays for a fix',                  am:'ማስተካከያውን ማን እንደሚከፍል' },
          { en:'A customer who may cancel',           am:'ውል ሊያቋርጥ የሚችል ደንበኛ' },
          { en:'Needed this week',                    am:'በዚህ ሳምንት ያስፈልጋል' }
        ], show:{f:'need_chair', when:'yes'}},
      {id:'next_week', en:'Which 3 customers need the most attention this week, and why? (Write the names in the box.)', am:'በዚህ ሳምንት በጣም ትኩረት የሚያስፈልጋቸው ሦስት ደንበኞች እነማን ናቸው? ለምን? (ስማቸውን በሳጥኑ ይጻፉ።)', t:'area',
        picks:[
          { en:'An open complaint',                   am:'ያልተፈታ ቅሬታ' },
          { en:'Gone quiet',                          am:'ዝም ብለዋል' },
          { en:'May cancel',                          am:'ውል ሊያቋርጡ ይችላሉ' },
          { en:'Installation this week',              am:'በዚህ ሳምንት ተከላ አላቸው' },
          { en:'Final payment due',                   am:'የመጨረሻ ክፍያ ደርሷል' }
        ]}
    ]}
  ]
},

/* ==================== GETACHEW — WEEKLY PURCHASING ==================== */
{
  id:'getachew-weekly', person:'getachew', cadence:'weekly', built:1, dueTime:'17:00', dueDay:6,
  en:'Weekly Purchasing Summary', am:'ሳምንታዊ የግዥ ሪፖርት',
  toEn:'Chairman, copied to Mahelet and Selam', toAm:'ሊቀመንበር፣ ግልባጭ ለማህሌትና ለሰላም',
  dueEn:'Saturday 5:00 PM', dueAm:'ቅዳሜ ከቀኑ 11፡00 (5:00 PM)',
  penEn:'Late or not sent –500 Birr', penAm:'ዘግይቶ ወይም ካልቀረበ –500 ብር',
  derived:1,
  sections:[
    /* REBUILT 11 Oct 2026 (the Chairman: "they are struggling so much with
       the questions"). Getachew's dailies were the emptiest in the company —
       96% blank on the first — and every "why" was empty. This weekly asked
       16 questions before any follow-up, four of them yes/no answers about
       things that go wrong now and then (a cheque error, the cheque book
       left out, a late supplier, an import). Now those are one tap on the
       list in "Anything else this week?": the yes/no answers are worked out
       from it ({picked:…}, quiet:1) and the cheque-error count files a real
       0 on a normal week (zero:1 — the ZamZam bonus needs that 0); the
       credit list opens only when something is owed; every "why" is
       buttons. What his dailies hold is still worked out from them. Every
       answer key is the one it always was. */
    { en:'Purchase requests', am:'የግዥ ጥያቄዎች', fields:[
      {id:'g_prep', en:'How many purchase requests did you prepare this week?', am:'በዚህ ሳምንት ስንት የግዥ ጥያቄ አዘጋጁ?', t:'num', auto:{week:'pr_prep'}},
      {id:'g_app', en:'How many did Selam approve?', am:'ሰላም ስንቱን አጸደቀች?', t:'num', auto:{week:'pr_app'}},
      {id:'g_ret', en:'How many were returned or rejected?', am:'ስንቱ ተመለሱ ወይም ውድቅ ሆኑ?', t:'num', auto:{week:'pr_ret'}},
      {id:'g_ret_why', en:'Why were they returned? (Write what will change in the box.)', am:'ለምን ተመለሱ? (ምን እንደሚቀየር በሳጥኑ ይጻፉ።)', t:'area', auto:{weekText:'pr_ret_why', from:'getachew-daily'},
        picks:[
          { en:'No job code',                      am:'የሥራ ኮድ አልነበረም' },
          { en:'Fewer than 3 quotes',              am:'ከ3 ያነሰ ፕሮፎርማ' },
          { en:'Price too high',                   am:'ዋጋው ከፍ ያለ ነበር' },
          { en:'Wrong material or amount',         am:'የተሳሳተ ዕቃ ወይም መጠን' },
          { en:'Not in the plan',                  am:'በዕቅዱ ውስጥ አልነበረም' },
          { en:'Money not ready yet',              am:'ገንዘቡ ገና አልተዘጋጀም' }
        ], show:{f:'g_ret', when:'pos'}},
      {id:'g_quotes', en:'How many requests carried 3 or more quotes? (with 3 quotes / all requests)', am:'ስንቱ ጥያቄ 3 እና ከዚያ በላይ ፕሮፎርማ ነበረው? (3 ፕሮፎርማ ያላቸው / ሁሉም ጥያቄዎች)', t:'ratio',
        auto:{a:{week:'pr_quotes__a'}, b:{week:'pr_quotes__b'}}},
      {id:'g_quotes_why', en:'Why did some requests have fewer than 3 quotes? (Write which in the box.)', am:'አንዳንድ ጥያቄዎች ለምን ከ3 ያነሰ ፕሮፎርማ ነበራቸው? (የትኞቹ እንደሆኑ በሳጥኑ ይጻፉ።)', t:'area', auto:{weekText:'pr_quotes_why', from:'getachew-daily'},
        picks:[
          { en:'Only one or two suppliers sell it', am:'የሚሸጡት አንድ ወይም ሁለት አቅራቢዎች ብቻ ናቸው' },
          { en:'Urgent — no time',                 am:'አስቸኳይ ነበር — ጊዜ አልነበረም' },
          { en:'Suppliers did not reply',          am:'አቅራቢዎች መልስ አልሰጡም' },
          { en:'The supplier agreed with us before', am:'ቀድሞ የተስማማነው አቅራቢ' }
        ], show:{f:'g_quotes', when:'short'}},
      /* the KPI bonus and the –500 a month read the month's average of this;
         nothing counts it for him, so it stays asked, as a plain estimate */
      {id:'g_acc', en:'What % of this week\'s purchases were right the first time — nothing wrong, nothing sent back? (100 if all were. Your best guess is fine.)', am:'ከዚህ ሳምንት ግዥዎች ስንት % በመጀመሪያው ትክክል ነበሩ — ምንም ስህተት የሌለባቸው፣ ያልተመለሱ? (ሁሉም ከሆኑ 100። ግምትዎ በቂ ነው።)', t:'pct',
        tgt:{op:'gte', v:95, en:'Target ≥95% — below is –500 Birr/month',
             am:'ዒላማ ≥95% — በታች ከሆነ በወር –500 ብር'}},
      {id:'g_acc_why', en:'What went wrong? (Write which purchases, and what you will do differently, in the box.)', am:'ምን ተሳሳተ? (የትኞቹ ግዥዎች እንደሆኑና ከዚህ በኋላ ምን እንደሚለውጡ በሳጥኑ ይጻፉ።)', t:'area',
        picks:[
          { en:'Wrong material',                   am:'የተሳሳተ ዕቃ' },
          { en:'Wrong amount',                     am:'የተሳሳተ መጠን' },
          { en:'Wrong size or thickness',          am:'የተሳሳተ ልኬት ወይም ውፍረት' },
          { en:'Poor quality — sent back',         am:'ጥራቱ ደካማ — ተመለሰ' },
          { en:'Price above what was approved',    am:'ከጸደቀው በላይ ዋጋ' },
          { en:'The request itself was wrong',     am:'ጥያቄው ራሱ ስህተት ነበረው' }
        ], show:{f:'g_acc', when:'miss'}}
    ]},
    /* THE ONE LIST */
    { en:'Anything else this week?', am:'በዚህ ሳምንት ሌላ የሆነ ነገር አለ?', fields:[
      {id:'wk_events', en:'What else happened this week?', am:'በዚህ ሳምንት ሌላ ምን ሆነ?', t:'multi', auto:{weekPicks:'g_events', from:'getachew-daily', map:{late:'sup_late', book_open:'chq_open', no_match:'chq_err'}},
        none:{ en:'Nothing — a normal week', am:'ምንም — የተለመደ ሳምንት' },
        groups:[
          { v:'chq', en:'Cheques',   am:'ቼኮች' },
          { v:'sup', en:'Suppliers', am:'አቅራቢዎች' }
        ],
        opts:[
          { v:'chq_err',  g:'chq', en:'A cheque had a mistake',                             am:'ስህተት ያለበት ቼክ ነበር' },
          { v:'chq_open', g:'chq', en:'The cheque book was not locked away one night',      am:'የቼክ ደብተሩ አንድ ምሽት አልተቆለፈበትም' },
          { v:'sup_late', g:'sup', en:'A supplier delivered late',                          am:'የዘገየ አቅራቢ ነበር' },
          { v:'import',   g:'sup', en:'Something is on its way from abroad for Klever',     am:'ለክሌቨር ከውጭ እየመጣ ያለ ዕቃ አለ' }
        ]}
    ]},
    { en:'ZamZam Bank cheques', am:'የዘምዘም ባንክ ቼኮች', fields:[
      {id:'g_chq', en:'How many cheques did you issue this week?', am:'በዚህ ሳምንት ስንት ቼክ ሰጡ?', t:'num',
        auto:{week:'chq_issued'}},
      {id:'g_chq_val', en:'What is the total value of this week\'s cheques?', am:'የዚህ ሳምንት ቼኮች ጠቅላላ ዋጋ ስንት ነው?', t:'money', auto:{week:'chq_value'}},
      /* the ZamZam bonus needs the month's sum at 0: asked after a tap, and
         a normal week files that 0 */
      {id:'g_chq_err', en:'How many cheques had a mistake?', am:'ስንት ቼኮች ስህተት ነበራቸው?', t:'num', auto:{week:'chq_match', from:'getachew-daily', how:'nodays'}, zero:1,
        show:{f:'wk_events', when:'has', v:'chq_err'},
        tgt:{op:'lte', v:0, en:'Zero errors earns the 1,000 Birr bonus',
             am:'ዜሮ ስህተት 1,000 ብር ቦነስ ያስገኛል'}},
      {id:'g_chq_err_what', en:'What was wrong, and how was it put right? (Write which cheques in the box.)', am:'ምን ስህተት ነበር? እንዴት ተስተካከለ? (የትኞቹ ቼኮች እንደሆኑ በሳጥኑ ይጻፉ።)', t:'area', auto:{weekText:'chq_match_why', from:'getachew-daily'},
        picks:[
          { en:'Wrong amount',                     am:'የተሳሳተ መጠን' },
          { en:'Wrong name',                       am:'የተሳሳተ ስም' },
          { en:'Wrong date',                       am:'የተሳሳተ ቀን' },
          { en:'Signature missing',                am:'ፊርማ ጎድሏል' },
          { en:'Cancelled and written again',      am:'ተሰርዞ እንደገና ተጻፈ' },
          { en:'Selam was told',                   am:'ለሰላም ተነግሯል' }
        ], show:{f:'g_chq_err', when:'pos'}},
      {id:'g_chq_secure', en:'Was the cheque book locked away every night?', am:'የቼክ ደብተሩ በየምሽቱ ተቆልፎበታል?', t:'yesno', quiet:1, auto:{picked:'wk_events', v:'chq_open', flip:1}},
      {id:'g_chq_secure_why', en:'Why was it not locked away? (Write which nights in the box.)', am:'ለምን አልተቆለፈበትም? (የትኞቹ ምሽቶች እንደሆኑ በሳጥኑ ይጻፉ።)', t:'area', auto:{weekText:'chq_secure_why', from:'getachew-daily'},
        picks:[
          { en:'The key was not there',            am:'ቁልፉ አልነበረም' },
          { en:'Left in a hurry',                  am:'በችኮላ ተወጣ' },
          { en:'Forgot',                           am:'ተረስቷል' },
          { en:'It was with Selam',                am:'ሰላም ጋር ነበር' }
        ], show:{f:'g_chq_secure', when:'no'}}
    ]},
    { en:'Suppliers and savings', am:'አቅራቢዎችና ቁጠባ', fields:[
      {id:'g_sup', en:'How many suppliers did you buy from this week?', am:'በዚህ ሳምንት ከስንት አቅራቢዎች ገዙ?', t:'num',
        auto:{week:'ord_placed'}},
      {id:'g_delays_any', en:'Was any supplier delivery late this week?', am:'በዚህ ሳምንት የዘገየ የአቅራቢ ጭነት አለ?', t:'yesno', quiet:1, auto:{picked:'wk_events', v:'sup_late'}},
      {id:'g_delays_list', en:'Which suppliers were late, and what did it cost us?', am:'የዘገዩት የትኞቹ አቅራቢዎች ናቸው? ምን አሳጣን?', t:'table', auto:{weekRows:'sup_delay_list', from:'getachew-daily', map:{stops:'effect'}}, addEn:'Add a supplier', addAm:'አቅራቢ ጨምር',
        show:{f:'g_delays_any', when:'yes'},
        cols:[
          {id:'sup', en:'Supplier', am:'አቅራቢ', t:'text'},
          {id:'times', en:'Times late', am:'የዘገየበት ብዛት', t:'num'},
          {id:'days', en:'Days late', am:'የዘገየበት ቀን', t:'num'},
          {id:'effect', en:'Effect on production', am:'በምርት ላይ ያደረሰው', t:'text', picks:[{ en:'Production stopped', am:'ምርት ቆመ' }, { en:'A job was late', am:'ሥራ ዘገየ' }, { en:'No effect', am:'ምንም ችግር አላመጣም' }]}
        ]},
      {id:'g_delays', en:'How many supplier deliveries were late?', am:'ስንት የአቅራቢ ርክክቦች ዘገዩ?', t:'num',
        auto:{rows:'g_delays_list'}, sumEn:'late deliveries', sumAm:'የዘገዩ ርክክቦች'},
      {id:'g_quality', en:'How many quality problems came from suppliers?', am:'ከአቅራቢዎች ስንት የጥራት ችግር መጣ?', t:'num', auto:{week:'sup_quality'}},
      {id:'g_quality_what', en:'What went wrong, and should we keep buying from them? (Write the supplier in the box.)', am:'ምን ችግር ነበር? ከእነሱ መግዛታችንን እንቀጥል? (አቅራቢውን በሳጥኑ ይጻፉ።)', t:'area', auto:{weekText:'sup_quality_what', from:'getachew-daily'},
        picks:[
          { en:'Damaged board',                    am:'የተበላሸ ሰሌዳ' },
          { en:'Wrong thickness or size',          am:'የተሳሳተ ውፍረት ወይም ልኬት' },
          { en:'Faulty hinges or slides',          am:'የተበላሹ ማጠፊያዎች ወይም ተንሸራታቾች' },
          { en:'Short count',                      am:'ቁጥሩ ጎድሏል' },
          { en:'Keep buying from them',            am:'ከእነሱ መግዛት እንቀጥል' },
          { en:'Stop buying from them',            am:'ከእነሱ መግዛት እናቁም' }
        ], show:{f:'g_quality', when:'pos'}},
      /* his cost-saving bonus is 5% of this, summed over the month */
      {id:'g_saving', en:'How much below the last price paid did you buy this week, in Birr? (5% of it is your bonus.)', am:'በዚህ ሳምንት ከመጨረሻው የተከፈለ ዋጋ በታች በስንት ብር ገዙ? (ከዚህ 5% ጉርሻዎ ነው።)', t:'money', opt:1},
      {id:'g_saving_how', en:'How was the saving made? (Write which purchases in the box.)', am:'ቁጠባው እንዴት ተገኘ? (የትኞቹ ግዥዎች እንደሆኑ በሳጥኑ ይጻፉ።)', t:'area',
        picks:[
          { en:'More quotes compared',             am:'ብዙ ዋጋዎች ተነጻጽረዋል' },
          { en:'Bargained the price down',         am:'ዋጋው በድርድር ቀነሰ' },
          { en:'Bought in bulk',                   am:'በብዛት ተገዛ' },
          { en:'A new, cheaper supplier',          am:'አዲስ ርካሽ አቅራቢ' },
          { en:'Paid at once for a discount',      am:'ለቅናሽ ወዲያው ተከፈለ' }
        ], show:{f:'g_saving', when:'pos'}},
      {id:'g_best', en:'Which supplier served us best this week, and why? (Write the supplier in the box.)', am:'በዚህ ሳምንት በጣም ጥሩ ያገለገለን የትኛው አቅራቢ ነው? ለምን? (አቅራቢውን በሳጥኑ ይጻፉ።)', t:'area', opt:1,
        picks:[
          { en:'On time',                          am:'በሰዓቱ አደረሰ' },
          { en:'Best price',                       am:'ጥሩ ዋጋ' },
          { en:'Good quality',                     am:'ጥሩ ጥራት' },
          { en:'Gave us credit',                   am:'ዱቤ ሰጠን' },
          { en:'Delivered to the factory',         am:'ፋብሪካ ድረስ አደረሰ' }
        ]}
    ]},
    { en:'Supplier credit', am:'የአቅራቢ ዱቤ', fields:[
      /* the CFO reads this; his daily keeps no credit total of its own, so
         it stays asked */
      {id:'g_cr_new', en:'How much did you buy on credit this week — no cheque given yet? (0 if none.)', am:'በዚህ ሳምንት በዱቤ — ቼክ ሳይሰጥ — ስንት ብር ገዙ? (ከሌለ 0።)', t:'money', auto:{week:'ord_list.amount', from:'getachew-daily', when:{col:'paid', is:'credit'}},},
      {id:'g_cr_paid', en:'How much earlier credit did you pay this week, by cheque?', am:'በዚህ ሳምንት ቀድሞ የተወሰደ ዱቤ ስንት ብር በቼክ ተከፈለ?', t:'money',
        auto:{week:'cr_paid'}},
      {id:'g_cr_owed', en:'How much does Klever owe suppliers in total now?', am:'ክሌቨር አሁን ለአቅራቢዎች በጠቅላላ ስንት ብር አለበት?', t:'money',
        auto:{week:'cr_owed', how:'last'}, parts:{of:['g_cr_overdue', 'g_cr_next']}},
      /* who is owed, what falls due next week and whether a supplier is
         holding back, only when something is owed — the CFO reads the
         first two when they are there */
      {id:'g_cr_list', en:'Who is owed, how much, and by when?', am:'ለማን ዕዳ አለ? ስንት? እስከ መቼ?', t:'table', addEn:'Add a supplier', addAm:'አቅራቢ ጨምር', opt:1,
        show:{f:'g_cr_owed', when:'pos'}, cols:[
          {id:'sup', en:'Supplier', am:'አቅራቢ', t:'text'},
          {id:'amount', en:'Owed', am:'ዕዳ', t:'money'},
          {id:'due', en:'Pay by', am:'የሚከፈልበት ቀን', t:'date'}
        ]},
      {id:'g_cr_next', en:'How much of it falls due next week?', am:'ከዚህ ውስጥ በሚቀጥለው ሳምንት የሚደርሰው ስንት ነው?', t:'money', opt:1,
        show:{f:'g_cr_owed', when:'pos'}},
      {id:'g_cr_overdue', en:'How much is already past the date we promised?', am:'ቃል የገባንበት ቀን ያለፈው ስንት ነው?', t:'money',
        auto:{week:'cr_overdue', how:'last'},
        tgt:{op:'lte', v:0, en:'Should be 0 — a supplier owed past the date can stop delivering',
             am:'ዜሮ መሆን አለበት — ቀኑ ያለፈበት አቅራቢ ዕቃ ማቅረብ ሊያቆም ይችላል'}},
      {id:'g_cr_overdue_why', en:'Why are they not paid? (Write the suppliers in the box.)', am:'ለምን አልተከፈላቸውም? (አቅራቢዎቹን በሳጥኑ ይጻፉ።)', t:'area',
        picks:[
          { en:'Money not in ZamZam yet',          am:'ገንዘቡ ገና ዘምዘም አልገባም' },
          { en:'Waiting for Selam\'s approval',    am:'የሰላምን ማጽደቅ እየጠበቅን ነው' },
          { en:'Over 50,000 — waiting for Kidan',  am:'ከ50,000 በላይ ነው — ኪዳንን እየጠበቅን ነው' },
          { en:'The invoice is missing',           am:'ደረሰኙ ጠፍቷል' },
          { en:'A new date was agreed with them',  am:'ከእነሱ ጋር አዲስ ቀን ተስማምተናል' }
        ], show:{f:'g_cr_overdue', when:'miss'}},
      {id:'g_cr_risk', en:'Is any supplier refusing to deliver until paid, or stopping our credit? (Write the supplier in the box.)', am:'እስኪከፈለው ዕቃ ላለማቅረብ የሚል ወይም ዱቤ ያቆመ አቅራቢ አለ? (አቅራቢውን በሳጥኑ ይጻፉ።)', t:'area', opt:1,
        picks:[
          { en:'No — all still deliver',           am:'የለም — ሁሉም ያቀርባሉ' },
          { en:'One wants payment first',          am:'አንዱ መጀመሪያ ክፍያ ይፈልጋል' },
          { en:'One stopped our credit',           am:'አንዱ ዱቤ አቆመ' }
        ], show:{f:'g_cr_owed', when:'pos'}}
    ]},
    { en:'Documents to Selam', am:'ለሰላም የተላኩ ሰነዶች', fields:[
      {id:'g_doc24', en:'How many documents reached Selam within 24 hours? (on time / all due)', am:'ስንት ሰነዶች በ24 ሰዓት ውስጥ ለሰላም ደረሱ? (በሰዓቱ / መድረስ የነበረባቸው)', t:'ratio',
        auto:{a:{week:'doc_24__a'}, b:{week:'doc_24__b'}}},
      {id:'g_doc_missing', en:'How many documents are still outstanding?', am:'እስካሁን ያልቀረቡ ሰነዶች ስንት ናቸው?', t:'num', auto:{week:'doc_missing', how:'last'},
        tgt:{op:'lte', v:0, en:'–200 Birr per document', am:'በሰነድ –200 ብር'}},
      {id:'g_doc_missing_list', en:'Which documents, for which jobs, and when will each reach Selam?', am:'የትኞቹ ሰነዶች? ለየትኞቹ ሥራዎች? እያንዳንዱ መቼ ለሰላም ይደርሳል?', t:'table', auto:{weekLast:'doc_missing_list', from:'getachew-daily'}, addEn:'Add a document', addAm:'ሰነድ ጨምር',
        show:{f:'g_doc_missing', when:'pos'},
        cols:[
          {id:'code', en:'Job code', am:'የሥራ ኮድ', t:'text'},
          {id:'doc', en:'Document', am:'ሰነድ', t:'choice', opts:[
            {v:'invoice', en:'Supplier invoice', am:'የአቅራቢ ደረሰኝ (ኢንቮይስ)'},
            {v:'dnote', en:'Delivery note', am:'የዕቃ መረከቢያ ወረቀት'},
            {v:'jobcard', en:'Job card reference', am:'የጆብ ካርድ ማጣቀሻ'},
            {v:'store', en:'Store confirmation', am:'የመጋዘን ማረጋገጫ'},
            {v:'warranty', en:'Warranty', am:'የዋስትና ሰነድ'}]},
          {id:'sup', en:'Supplier', am:'አቅራቢ', t:'text'},
          {id:'when', en:'Expected by', am:'የሚደርስበት ቀን', t:'text'}
        ]}
    ]},
    /* imports (8 Oct 2026), for the procurement reader — "is anything on
       its way" is a tap on the list now; an answered list with no tap says
       no, which the reader shows as no shipments */
    { en:'Imports', am:'ከውጭ የሚገቡ ዕቃዎች', fields:[
      {id:'imp_any', en:'Is anything being imported for Klever right now?', am:'አሁን ለክሌቨር ከውጭ የሚገባ ዕቃ አለ?', t:'yesno', auto:{picked:'wk_events', v:'import'}, show:{f:'wk_events', when:'has', v:'import'}, quiet:1,},
      {id:'imp_list', en:'List each import shipment and where it is now', am:'እያንዳንዱን ከውጭ የሚገባ ጭነትና አሁን ያለበትን ይዘርዝሩ', t:'table', addEn:'Add a shipment', addAm:'ጭነት ጨምር',
        show:{f:'imp_any', when:'yes'},
        cols:[
          {id:'item', en:'Item', am:'ዕቃ', t:'text'},
          {id:'sup', en:'Supplier', am:'አቅራቢ', t:'text'},
          {id:'ref', en:'Order or shipment no.', am:'የትዕዛዝ ወይም የጭነት ቁጥር', t:'text'},
          {id:'value', en:'Value (Birr)', am:'ዋጋ (ብር)', t:'money'},
          {id:'stage', en:'Where it is', am:'ያለበት ደረጃ', t:'choice', opts:[
            {v:'ordered', en:'Ordered', am:'ታዝዟል'},
            {v:'shipped', en:'Shipped', am:'ተልኳል'},
            {v:'port', en:'At port (Djibouti)', am:'ወደብ ላይ (ጅቡቲ)'},
            {v:'customs', en:'In customs', am:'ጉምሩክ ላይ'},
            {v:'cleared', en:'Cleared', am:'ተለቋል'},
            {v:'delivered', en:'Delivered to us', am:'ደርሶናል'}]},
          {id:'eta', en:'Expected at the factory', am:'ፋብሪካ የሚደርስበት ቀን', t:'date'}
        ]}
    ]},
    { en:'Problems and help', am:'ችግርና እርዳታ', fields:[
      {id:'w_problem', en:'What was the biggest problem this week, and what caused it?', am:'የዚህ ሳምንት ትልቁ ችግር ምን ነበር? ምክንያቱስ?', t:'area', auto:{weekText:'problem', from:'getachew-daily'}, opt:1,
        picks:[
          { en:'No big problem this week',         am:'በዚህ ሳምንት ትልቅ ችግር አልነበረም' },
          { en:'Suppliers delivered late',         am:'አቅራቢዎች አዘገዩ' },
          { en:'Prices went up',                   am:'ዋጋ ጨመረ' },
          { en:'Money was not ready',              am:'ገንዘብ አልተዘጋጀም' },
          { en:'Approvals were slow',              am:'ማጽደቅ ዘገየ' },
          { en:'Material not found in the market', am:'ዕቃው ገበያ ላይ አልተገኘም' },
          { en:'Wrong material came',              am:'የተሳሳተ ዕቃ መጣ' }
        ]},
      {id:'w_action', en:'What was done about it? (Write who and by when in the box.)', am:'ምን እርምጃ ተወሰደ? (በማንና እስከ መቼ እንደሆነ በሳጥኑ ይጻፉ።)', t:'area', opt:1,
        picks:[
          { en:'Found another supplier',           am:'ሌላ አቅራቢ ተገኘ' },
          { en:'Called the supplier',              am:'አቅራቢው ተደወለለት' },
          { en:'Selam was told',                   am:'ለሰላም ተነግሯል' },
          { en:'Mahelet was told',                 am:'ለማህሌት ተነግሯል' },
          { en:'Nothing done yet',                 am:'ገና ምንም አልተደረገም' }
        ]},
      {id:'w_need', en:'What do you need next week, and from whom?', am:'በሚቀጥለው ሳምንት ምን ያስፈልግዎታል? ከማን?', t:'area', auto:{weekText:'need_help', from:'getachew-daily'}, opt:1,
        picks:[
          { en:'Nothing needed',                   am:'ምንም አያስፈልግም', nil:1 },
          { en:'Money or approval from Selam',     am:'ገንዘብ ወይም ማጽደቅ ከሰላም' },
          { en:'The plan from Mahelet',            am:'ዕቅዱ ከማህሌት' },
          { en:'Stock counts from the store',      am:'የዕቃ ቆጠራ ከመጋዘን' },
          { en:'A decision from the Chairman',     am:'የሊቀመንበሩ ውሳኔ' }
        ]},
      {id:'w_chair', en:'Do you need a decision from the Chairman?', am:'የሊቀመንበሩ ውሳኔ ያስፈልግዎታል?', t:'yesno', auto:{week:'need_chair', from:'getachew-daily', how:'anyyes'}, yes:{en:'I need a decision', am:'ውሳኔ ያስፈልገኛል'}, no:{en:'No decision needed', am:'ውሳኔ አያስፈልገኝም'}},
      {id:'w_chair_what', en:'What should he decide, and by when?', am:'ሊቀመንበሩ ምን እንዲወስኑ ይፈልጋሉ? እስከ መቼ?', t:'area', auto:{weekText:'need_chair_what', from:'getachew-daily'},
        picks:[
          { en:'A new supplier',                   am:'አዲስ አቅራቢ' },
          { en:'A payment over 50,000 Birr',       am:'ከ50,000 ብር በላይ ክፍያ' },
          { en:'An import',                        am:'ከውጭ ማስገባት' },
          { en:'A price rise',                     am:'የዋጋ ጭማሪ' },
          { en:'Credit terms',                     am:'የዱቤ ሁኔታ' }
        ], show:{f:'w_chair', when:'yes'}}
    ]},
    { en:'Next week', am:'የሚቀጥለው ሳምንት', fields:[
      {id:'w_next', en:'What must be bought next week? (Write the jobs, and anything at risk of coming late, in the box.)', am:'በሚቀጥለው ሳምንት ምን መገዛት አለበት? (ለየትኞቹ ሥራዎችና የመዘግየት ስጋት ያለበትን በሳጥኑ ይጻፉ።)', t:'area', opt:1,
        picks:MATERIALS}
    ]}
  ]
},

/* ===================== YORDANOS — WEEKLY STORE ===================== */
{
  id:'alemaya-weekly', person:'alemaya', cadence:'weekly', built:1, dueTime:'17:00', dueDay:6,
  en:'Weekly Store Summary', am:'ሳምንታዊ የመጋዘን ሪፖርት',
  toEn:'Chairman, copied to Mahelet and Selam', toAm:'ሊቀመንበር፣ ግልባጭ ለማህሌትና ለሰላም',
  dueEn:'Saturday 5:00 PM', dueAm:'ቅዳሜ ከቀኑ 11፡00 (5:00 PM)',
  penEn:'Reports are mandatory weekly', penAm:'ሳምንታዊ ሪፖርት ግዴታ ነው',
  derived:1,
  sections:[
    /* REBUILT 11 Oct 2026 (the Chairman: "they are struggling so much with
       the questions"). Yordanos's dailies left 63–65% of their questions
       empty and every "why" with them. This weekly asked 15 questions
       before any follow-up, seven of them yes/no answers or counts about
       things that go wrong now and then — missing stock, a stop for an
       unreported shortage, an unchecked delivery, an issue without
       approval, the wrong job, the store left open, theft. Now the
       Saturday count comes first and asks its figures only when the count
       was done; the rest is one tap on the list in "Anything else this
       week?", whose yes/no answers are worked out from it ({picked:…},
       quiet:1) and whose counts file a real 0 on a normal week (zero:1 —
       the zero-loss and no-shortage bonuses need that 0); every "why" is
       buttons. What her dailies hold is still worked out from them. Every
       answer key is the one it always was. */
    { en:'The Saturday stock count', am:'የቅዳሜ ቆጠራ', fields:[
      {id:'y_count', en:'Was the Saturday stock count done?', am:'የቅዳሜ የዕቃ ቆጠራ ተደርጓል?', t:'yesno', yes:{en:'Counted', am:'ተቆጥሯል'}, no:{en:'Not counted', am:'አልተቆጠረም'}},
      {id:'y_count_why', en:'Why not, and when will it be done?', am:'ለምን? መቼ ይደረጋል?', t:'area',
        picks:[
          { en:'No time — too many deliveries',    am:'ጊዜ አልነበረም — ብዙ ጭነት ነበር' },
          { en:'I was absent',                     am:'አልነበርኩም' },
          { en:'No one to help count',             am:'የሚረዳኝ ሰው አልነበረም' },
          { en:'It will be done Monday',           am:'ሰኞ ይደረጋል' },
          { en:'It will be done next Saturday',    am:'በሚቀጥለው ቅዳሜ ይደረጋል' }
        ], show:{f:'y_count', when:'no'}},
      /* the KPI bonus and the –500 a month read the month's average of this;
         a week with no count has no accuracy to give, so it is asked when
         the count was done */
      {id:'y_accuracy', en:'What % of the stock matched the record at the count? (100 if nothing differed. Your best guess is fine.)', am:'በቆጠራው ስንት % ዕቃ ከመዝገቡ ጋር ተስማማ? (ምንም ልዩነት ከሌለ 100። ግምትዎ በቂ ነው።)', t:'pct',
        show:{f:'y_count', when:'yes'},
        tgt:{op:'gte', v:99, en:'Target ≥99% — 2,000 Birr KPI bonus',
             am:'ዒላማ ≥99% — 2,000 ብር ቦነስ'}},
      {id:'y_accuracy_why', en:'Below 99%: what caused the gaps? (Write what will change in the box.)', am:'ከ99% በታች ነው፦ ልዩነቱን ምን አመጣው? (ምን እንደሚቀየር በሳጥኑ ይጻፉ።)', t:'area',
        picks:[
          { en:'Issues not written down',          am:'የወጣ ዕቃ አልተመዘገበም' },
          { en:'Deliveries not written down',      am:'የገባ ዕቃ አልተመዘገበም' },
          { en:'Counted wrong last time',          am:'ባለፈው በስህተት ተቆጥሯል' },
          { en:'Taken without permission',         am:'ያለ ፈቃድ ተወስዷል' },
          { en:'Damaged and thrown away',          am:'ተበላሽቶ ተጣለ' },
          { en:'Offcuts not written down',         am:'ቁርጥራጮች አልተመዘገቡም' }
        ], show:{f:'y_accuracy', when:'miss'}},
      {id:'y_disc_any', en:'Did the count find any difference from the record?', am:'ቆጠራው ከመዝገቡ ጋር ልዩነት አገኘ?', t:'yesno', auto:{week:'st_any', from:'alemaya-daily', how:'anyyes'}, yes:{en:'Differences found', am:'ልዩነት ተገኝቷል'}, no:{en:'Everything matched', am:'ሁሉም ይመሳሰላል'},
},
      /* the rulebook fines each difference counted here (–500) and pays the
         month with none (1,000) */
      {id:'y_disc_list', en:'List each difference', am:'እያንዳንዱን ልዩነት ይዘርዝሩ', t:'table', auto:{weekRows:'st_disc_list', from:'alemaya-daily', map:{shelf:'count'}}, addEn:'Add an item', addAm:'ዕቃ ጨምር',
        show:{f:'y_disc_any', when:'yes'},
        cols:[
          {id:'item', en:'Material', am:'ዕቃ', t:'text'},
          {id:'book', en:'On record', am:'በመዝገብ', t:'num'},
          {id:'count', en:'Counted', am:'የተቆጠረ', t:'num'},
          {id:'why', en:'Reason', am:'ምክንያት', t:'text', picks:COL_STOCK_DIFF},
          {id:'told', en:'Reported the same day?', am:'በዚያው ቀን ተነግሯል?', t:'yesno', yes:{en:'Told the same day', am:'በዚያው ቀን ተነግሯል'}, no:{en:'Not that day', am:'በዚያው ቀን አልተነገረም'}}
        ]},
      {id:'y_disc', en:'How many differences did the count find?', am:'ቆጠራው ስንት ልዩነት አገኘ?', t:'num',
        auto:{rows:'y_disc_list'}, sumEn:'differences', sumAm:'ልዩነቶች',
        tgt:{op:'lte', v:0, en:'Zero earns the 1,000 Birr accuracy bonus',
             am:'ዜሮ ከሆነ 1,000 ብር ቦነስ'}}
    ]},
    /* THE ONE LIST */
    { en:'Anything else this week?', am:'በዚህ ሳምንት ሌላ የሆነ ነገር አለ?', fields:[
      {id:'wk_events', en:'What else happened in the store this week?', am:'በዚህ ሳምንት መጋዘኑ ውስጥ ሌላ ምን ሆነ?', t:'multi',
        none:{ en:'Nothing — a normal week', am:'ምንም — የተለመደ ሳምንት' },
        groups:[
          { v:'stock', en:'Stock',        am:'ዕቃ' },
          { v:'move',  en:'In and out',   am:'መግቢያና መውጫ' },
          { v:'safe',  en:'Security',     am:'ጥበቃ' }
        ],
        opts:[
          { v:'missing',   g:'stock', en:'Material is missing from the store',   am:'ከመጋዘኑ የጠፋ ዕቃ አለ' },
          { v:'stopped',   g:'stock', en:'Production stopped because a shortage was not reported in time', am:'እጥረት በጊዜ ስላልተነገረ ምርት ቆመ' },
          { v:'unchecked', g:'move',  en:'Something came in without being checked against the Job File / BOM', am:'ከጆብ ፋይሉ ወይም ከዕቃ ዝርዝሩ ጋር ሳይረጋገጥ የገባ ዕቃ ነበር' },
          { v:'no_appr',   g:'move',  en:'Something went out without Mahelet\'s signed approval', am:'ያለ ማህሌት ፊርማ ፈቃድ የወጣ ዕቃ ነበር' },
          { v:'wrong_job', g:'move',  en:'Something went to the wrong job',     am:'ወደ ተሳሳተ ሥራ የሄደ ዕቃ ነበር' },
          { v:'unlocked',  g:'safe',  en:'The store was left unlocked a night', am:'መጋዘኑ አንድ ምሽት አልተቆለፈም' },
          { v:'theft',     g:'safe',  en:'Something was stolen or taken without permission', am:'የተሰረቀ ወይም ያለ ፈቃድ የተወሰደ ዕቃ ነበር' }
        ]}
    ]},
    { en:'Missing and short', am:'የጠፋና ያጠረ ዕቃ', fields:[
      /* the zero-loss bonus needs the month at 0: asked after a tap, and a
         normal week files that 0 */
      {id:'y_missing', en:'How many materials are missing?', am:'ስንት ዕቃዎች ጠፍተዋል?', t:'num', zero:1,
        show:{f:'wk_events', when:'has', v:'missing'},
        tgt:{op:'lte', v:0, en:'–1,000 Birr each', am:'እያንዳንዱ –1,000 ብር'}},
      {id:'y_missing_what', en:'What is missing, and who was told? (Write what it is worth in the box.)', am:'ምን ጠፋ? ለማን ተነገረ? (ዋጋውን በሳጥኑ ይጻፉ።)', t:'area',
        picks:[
          { en:'Board',                            am:'ሰሌዳ' },
          { en:'Edge banding',                     am:'ጠርዝ ማሰሪያ' },
          { en:'Hinges, slides or handles',        am:'ማጠፊያ፣ ተንሸራታች ወይም መያዣ' },
          { en:'Glue and screws',                  am:'ሙጫና ብሎኖች' },
          { en:'Tools',                            am:'መሣሪያዎች' },
          { en:'Mahelet was told',                 am:'ለማህሌት ተነግሯል' },
          { en:'Selam was told',                   am:'ለሰላም ተነግሯል' }
        ], show:{f:'y_missing', when:'pos'}},
      {id:'y_short', en:'How many shortages did you flag this week?', am:'በዚህ ሳምንት ስንት እጥረት ጠቆሙ?', t:'num', auto:{week:'sh_flagged'}},
      {id:'y_short_what', en:'Which materials, and did each arrive before it was needed?', am:'የትኞቹ ዕቃዎች? እያንዳንዱ ከመፈለጉ በፊት ደረሰ?', t:'area', auto:{weekText:'sh_what', from:'alemaya-daily'},
        picks:[
          { en:'Board',                            am:'ሰሌዳ' },
          { en:'Edge banding',                     am:'ጠርዝ ማሰሪያ' },
          { en:'Hinges, slides or handles',        am:'ማጠፊያ፣ ተንሸራታች ወይም መያዣ' },
          { en:'Glue and screws',                  am:'ሙጫና ብሎኖች' },
          { en:'Consumables',                      am:'ፍጆታ ዕቃዎች' },
          { en:'All arrived in time',              am:'ሁሉም በጊዜ ደረሱ' },
          { en:'Some arrived late',                am:'አንዳንዱ ዘግይቶ ደረሰ' },
          { en:'Still waiting',                    am:'አሁንም እየጠበቅን ነው' }
        ], show:{f:'y_short', when:'pos'}},
      /* her daily says whether production stopped, not how many times, so
         the week's count is asked — after a tap; a normal week files 0 (the
         no-shortage bonus needs it, and each stop is –500) */
      {id:'y_stopped', en:'How many times did production stop because a shortage was not reported in time?',
        am:'እጥረት በጊዜ ስላልተነገረ ምርት ስንት ጊዜ ቆመ?', t:'num', zero:1,
        show:{f:'wk_events', when:'has', v:'stopped'},
        tgt:{op:'lte', v:0, en:'Zero earns the 500 Birr bonus', am:'ዜሮ ከሆነ 500 ብር ቦነስ'}},
      {id:'y_stopped_what', en:'Why was it not reported in time? (Write the jobs and for how long in the box.)', am:'ለምን በጊዜ አልተነገረም? (ሥራዎቹንና ለምን ያህል ጊዜ እንደቆመ በሳጥኑ ይጻፉ።)', t:'area', auto:{weekText:'sh_stopped_what', from:'alemaya-daily'},
        picks:[
          { en:'The record was wrong',             am:'መዝገቡ ስህተት ነበር' },
          { en:'Used up faster than expected',     am:'ከተጠበቀው በፍጥነት አለቀ' },
          { en:'It was told too late',             am:'ዘግይቶ ተነገረ' },
          { en:'It was not counted',               am:'አልተቆጠረም' },
          { en:'Getachew was told, but it did not come', am:'ለጌታቸው ተነግሮ ነበር፣ ግን አልመጣም' }
        ], show:{f:'y_stopped', when:'pos'}}
    ]},
    { en:'Receiving this week', am:'በዚህ ሳምንት የገባ ዕቃ', fields:[
      {id:'y_deliv', en:'How many deliveries came in this week?', am:'በዚህ ሳምንት ስንት ጭነት ገባ?', t:'num',
        auto:{week:'rec_deliv'}},
      {id:'y_accepted', en:'How many were accepted into the store?', am:'ስንቱ ወደ መጋዘን ገቡ?', t:'num',
        auto:{week:'rec_accepted'}},
      {id:'y_rejected', en:'How many did you reject?', am:'ስንቱን ውድቅ አደረጉ?', t:'num',
        auto:{week:'rec_rejected'}},
      {id:'y_rejected_what', en:'What was rejected, and has it been replaced? (Write the suppliers in the box.)', am:'ምን ውድቅ ተደረገ? ተተክቷል? (አቅራቢዎቹን በሳጥኑ ይጻፉ።)', t:'area',
        picks:[
          { en:'Damaged board',                    am:'የተበላሸ ሰሌዳ' },
          { en:'Wrong thickness or size',          am:'የተሳሳተ ውፍረት ወይም ልኬት' },
          { en:'Short count',                      am:'ቁጥሩ ጎድሏል' },
          { en:'Faulty hardware',                  am:'የተበላሸ ሃርድዌር' },
          { en:'Replaced',                         am:'ተተክቷል' },
          { en:'Not replaced yet',                 am:'ገና አልተተካም' }
        ], show:{f:'y_rejected', when:'pos'}},
      {id:'y_grn', en:'Was everything received against a Job File or BOM?', am:'ሁሉም ከጆብ ፋይሉ ወይም ከዕቃ ዝርዝሩ ጋር ተረጋግጦ ገብቷል?', t:'yesno', quiet:1, auto:{picked:'wk_events', v:'unchecked', flip:1}},
      {id:'y_grn_why', en:'Why was it not checked? (Write what came in the box.)', am:'ለምን አልተረጋገጠም? (ምን እንደገባ በሳጥኑ ይጻፉ።)', t:'area', auto:{weekText:'rec_checked_why', from:'alemaya-daily'},
        picks:[
          { en:'There was no Job File for it',     am:'የጆብ ፋይል አልነበረውም' },
          { en:'It came while I was away',         am:'እኔ በሌለሁበት መጣ' },
          { en:'Too many came at once',            am:'ብዙ በአንድ ጊዜ መጣ' },
          { en:'Urgent for production',            am:'ለምርት አስቸኳይ ነበር' }
        ],}
    ]},
    { en:'Issuing', am:'ዕቃ ማውጣት', fields:[
      {id:'y_issues', en:'How many times were materials issued this week?', am:'በዚህ ሳምንት ስንት ጊዜ ዕቃ ከመጋዘን ወጣ?', t:'num', auto:{week:'iss_count'}},
      {id:'y_approved', en:'Did every issue carry Mahelet\'s signed approval?', am:'እያንዳንዱ ዕቃ በማህሌት ፊርማ ፈቃድ ወጥቷል?', t:'yesno', auto:{week:'iss_approved', from:'alemaya-daily', how:'allyes'}, quiet:1,},
      {id:'y_approved_why', en:'Who allowed it? (Write what went out, and for which job, in the box.)', am:'ማን ፈቀደ? (ምን እንደወጣና ለየትኛው ሥራ በሳጥኑ ይጻፉ።)', t:'area', auto:{weekText:'iss_approved_why', from:'alemaya-daily'},
        picks:[
          { en:'Mahelet allowed it by phone',      am:'ማህሌት በስልክ ፈቀደች' },
          { en:'Amaha',                            am:'አማሃ' },
          { en:'Urgent — signed later',            am:'አስቸኳይ ነበር — ቆይቶ ተፈረመ' },
          { en:'No one',                           am:'ማንም' }
        ], show:{f:'y_approved', when:'no'}},
      {id:'y_correct', en:'Did everything go to the correct job?', am:'ሁሉም ለትክክለኛው ሥራ ወጥቷል?', t:'yesno', auto:{week:'iss_correct', from:'alemaya-daily', how:'allyes'}, quiet:1,},
      {id:'y_correct_why', en:'Has it been put right? (Write what went to the wrong job in the box.)', am:'ተስተካክሏል? (ወደ ተሳሳተ ሥራ የሄደውን በሳጥኑ ይጻፉ።)', t:'area', auto:{weekText:'iss_correct_why', from:'alemaya-daily'}, one:1,
        picks:[
          { en:'Put right',                        am:'ተስተካክሏል' },
          { en:'Not yet',                          am:'ገና አልተስተካከለም' },
          { en:'Used on the other job — written down', am:'በሌላው ሥራ ዋለ — ተመዝግቧል' }
        ], show:{f:'y_correct', when:'no'}}
    ]},
    { en:'Factory consumables', am:'የፋብሪካ ፍጆታ ዕቃዎች', fields:[
      {id:'y_con_week', en:'How many consumable items were issued this week?', am:'በዚህ ሳምንት ስንት የፍጆታ ዕቃ ወጣ?', t:'num', auto:{week:'con_today'}},
      {id:'y_con_mtd', en:'How much has been spent on consumables this month so far?', am:'በዚህ ወር እስካሁን ለፍጆታ ዕቃ ስንት ብር ወጣ?', t:'money', auto:{week:'con_mtd', how:'last'},
        tgt:{op:'lte', v:30000, en:'Budget 30,000 Birr/month — above needs Chairman approval',
             am:'የወር በጀት 30,000 ብር — በላይ ከሆነ የሊቀመንበር ፈቃድ'}},
      {id:'y_con_mtd_why', en:'The month is over 30,000 Birr. What drove it, and has the Chairman approved the extra?', am:'የወሩ ወጪ ከ30,000 ብር አልፏል። ምን አሳደገው? ተጨማሪውን ሊቀመንበሩ ፈቅደዋል?', t:'area', auto:{weekLast:'con_mtd_why', from:'alemaya-daily'},
        picks:[
          { en:'Blades',                           am:'ቢላዎች' },
          { en:'Sandpaper',                        am:'ሳንድፔፐር' },
          { en:'Drill bits',                       am:'ቁፋሮ' },
          { en:'Glue',                             am:'ሙጫ' },
          { en:'The Chairman approved it',         am:'ሊቀመንበሩ ፈቅደዋል' },
          { en:'Not approved yet',                 am:'ገና አልተፈቀደም' }
        ], show:{f:'y_con_mtd', when:'miss'}}
    ]},
    { en:'Security', am:'ጥበቃ', fields:[
      {id:'y_secure', en:'Was the store locked and secure every night?', am:'መጋዘኑ በየምሽቱ ተቆልፎ ደህንነቱ ተጠብቆ ነበር?', t:'yesno', auto:{week:'sec_locked', from:'alemaya-daily', how:'allyes'}, quiet:1,},
      {id:'y_secure_why', en:'Why was it not locked? (Write which nights in the box.)', am:'ለምን አልተቆለፈም? (የትኞቹ ምሽቶች እንደሆኑ በሳጥኑ ይጻፉ።)', t:'area', auto:{weekText:'sec_locked_why', from:'alemaya-daily'},
        picks:[
          { en:'The key was lost',                 am:'ቁልፉ ጠፋ' },
          { en:'The lock is broken',               am:'መቆለፊያው ተበላሽቷል' },
          { en:'Left in a hurry',                  am:'በችኮላ ተወጣ' },
          { en:'Someone else closed up',           am:'ሌላ ሰው ዘጋ' }
        ], show:{f:'y_secure', when:'no'}},
      /* the zero-loss bonus reads this "yes" */
      {id:'y_theft', en:'Was anything stolen or taken out without permission this week?', am:'በዚህ ሳምንት የተሰረቀ ወይም ያለፈቃድ የወጣ ዕቃ አለ?', t:'yesno', auto:{week:'sec_theft', from:'alemaya-daily', how:'anyyes'}, quiet:1,},
      {id:'y_theft_what', en:'What was taken, and were Mahelet and Selam told? (Write what it is worth and who is involved in the box.)', am:'ምን ተወሰደ? ለማህሌትና ለሰላም ተነግሯል? (ዋጋውንና ማን እንደተሳተፈ በሳጥኑ ይጻፉ።)', t:'area', auto:{weekText:'sec_theft_what', from:'alemaya-daily'},
        picks:[
          { en:'Board',                            am:'ሰሌዳ' },
          { en:'Hardware',                         am:'ሃርድዌር' },
          { en:'Tools',                            am:'መሣሪያዎች' },
          { en:'Consumables',                      am:'ፍጆታ ዕቃዎች' },
          { en:'Mahelet and Selam were told',      am:'ለማህሌትና ለሰላም ተነግሯል' },
          { en:'Not told yet',                     am:'ገና አልተነገረም' }
        ], show:{f:'y_theft', when:'yes'}}
    ]},
    { en:'Problems and help', am:'ችግርና እርዳታ', fields:[
      {id:'y_problem', en:'What was the biggest problem in the store this week, and what caused it?', am:'በመጋዘኑ የዚህ ሳምንት ትልቁ ችግር ምን ነበር? ምክንያቱስ?', t:'area', auto:{weekText:'problem', from:'alemaya-daily'}, opt:1,
        picks:[
          { en:'No big problem this week',         am:'በዚህ ሳምንት ትልቅ ችግር አልነበረም' },
          { en:'Deliveries came late',             am:'ጭነቶች ዘገዩ' },
          { en:'The record did not match',         am:'መዝገቡ አልተስማማም' },
          { en:'Material went out without approval', am:'ያለ ፈቃድ ዕቃ ወጣ' },
          { en:'Not enough space',                 am:'በቂ ቦታ የለም' },
          { en:'Shortages',                        am:'እጥረት' }
        ]},
      {id:'y_action', en:'What was done about it? (Write who and by when in the box.)', am:'ምን እርምጃ ተወሰደ? (በማንና እስከ መቼ እንደሆነ በሳጥኑ ይጻፉ።)', t:'area', opt:1,
        picks:[
          { en:'Mahelet was told',                 am:'ለማህሌት ተነግሯል' },
          { en:'Getachew was told',                am:'ለጌታቸው ተነግሯል' },
          { en:'Selam was told',                   am:'ለሰላም ተነግሯል' },
          { en:'The record was corrected',         am:'መዝገቡ ተስተካከለ' },
          { en:'Nothing done yet',                 am:'ገና ምንም አልተደረገም' }
        ]},
      {id:'y_need', en:'What do you need, and from whom?', am:'ምን ያስፈልግዎታል? ከማን?', t:'area', auto:{weekText:'need_help', from:'alemaya-daily'}, opt:1,
        picks:[
          { en:'Nothing needed',                   am:'ምንም አያስፈልግም', nil:1 },
          { en:'Approvals signed by Mahelet',      am:'በማህሌት የተፈረሙ ፈቃዶች' },
          { en:'Purchases from Getachew',          am:'ግዢ ከጌታቸው' },
          { en:'Money from Selam',                 am:'ገንዘብ ከሰላም' },
          { en:'More shelves or space',            am:'ተጨማሪ መደርደሪያ ወይም ቦታ' },
          { en:'A helper for the count',           am:'ለቆጠራ ረዳት' }
        ]},
      {id:'y_chair', en:'Do you need a decision from the Chairman?', am:'የሊቀመንበሩ ውሳኔ ያስፈልግዎታል?', t:'yesno', auto:{week:'need_chair', from:'alemaya-daily', how:'anyyes'}, yes:{en:'I need a decision', am:'ውሳኔ ያስፈልገኛል'}, no:{en:'No decision needed', am:'ውሳኔ አያስፈልገኝም'}},
      {id:'y_chair_what', en:'What should he decide, and by when?', am:'ሊቀመንበሩ ምን እንዲወስኑ ይፈልጋሉ? እስከ መቼ?', t:'area', auto:{weekText:'need_chair_what', from:'alemaya-daily'},
        picks:[
          { en:'More consumables budget',          am:'ተጨማሪ የፍጆታ በጀት' },
          { en:'A missing item',                   am:'የጠፋ ዕቃ' },
          { en:'A rule for issuing',               am:'የዕቃ ማውጫ ደንብ' },
          { en:'Store space',                      am:'የመጋዘን ቦታ' }
        ], show:{f:'y_chair', when:'yes'}}
    ]},
    { en:'Next week', am:'የሚቀጥለው ሳምንት', fields:[
      {id:'y_next', en:'What may run short next week? (Write what is coming in, in the box.)', am:'በሚቀጥለው ሳምንት ምን ሊያጥር ይችላል? (ምን እንደሚገባ በሳጥኑ ይጻፉ።)', t:'area',
        picks:[
          { en:'Nothing should run short',         am:'ምንም አያጥርም' },
          { en:'Board',                            am:'ሰሌዳ' },
          { en:'Edge banding',                     am:'ጠርዝ ማሰሪያ' },
          { en:'Hinges, slides or handles',        am:'ማጠፊያ፣ ተንሸራታች ወይም መያዣ' },
          { en:'Glue and screws',                  am:'ሙጫና ብሎኖች' },
          { en:'Consumables',                      am:'ፍጆታ ዕቃዎች' }
        ]}
    ]}
  ]
},

/* ---- shared row sets for the planning documents ---- */

/* ============= EPHRATA — 4-WEEK ROLLING SALES PROJECTION ============= */
{
  /* Amendment 1, 17 September 2026 moved this back from Monday 10:00 AM. */
  id:'ephrata-projection', person:'ephrata', cadence:'weekly', dueTime:'17:00', dueDay:6,
  en:'4-Week Rolling Sales Projection', am:'የ4 ሳምንት የሽያጭ ትንበያ',
  toEn:'Chairman + Kidan', toAm:'ሊቀመንበር + ኪዳን',
  dueEn:'Saturday 5:00 PM', dueAm:'ቅዳሜ ከቀኑ 11፡00 (5:00 PM)',
  penEn:'First miss –500 Birr · Second in a row –1,000 Birr',
  penAm:'መጀመሪያ ሲቀር –500 ብር · በተከታታይ ሁለተኛ –1,000 ብር',
  sections:[
    /* REWORDED 11 Oct 2026 (the Chairman: "they are struggling so much with
       the questions"). The customer list and the four weeks stay exactly as
       they were — the register (Register.js), the Sunday forecast check
       (Packs.js) and the group CFO's thirteen weeks (Readers.js) read them.
       What changed: the 4-week total is the four weeks' totals added up, not
       typed again; every "why" and "what could stop it" is buttons, with a
       box for the names; "which part is at risk" is asked only when she
       says the figures cannot be reached. */
    { en:'Expected contracts', am:'የሚጠበቁ ውሎች', fields:[
      {id:'proj_contracts', en:'Which customers do you expect to sign in the next 4 weeks? (One row a customer.)', am:'በሚቀጥሉት 4 ሳምንታት የትኞቹ ደንበኞች ውል ይፈርማሉ ብለው ይጠብቃሉ? (ለእያንዳንዱ ደንበኛ አንድ መስመር።)',
       t:'table', addEn:'Add customer', addAm:'ደንበኛ ጨምር', cols:[
        {id:'cust', en:'Customer name', am:'የደንበኛ ስም', t:'text'},
        {id:'lc', en:'Customer code: 4-digit lead no., or KK code once paid', am:'የደንበኛ ኮድ፦ ባለ 4 አሃዝ ቁጥር፣ ከከፈሉ በኋላ KK ኮድ', t:'text'},
        {id:'val', en:'Contract value', am:'የውል ዋጋ', t:'money'},
        {id:'sign', en:'Expected signing date', am:'የሚፈረምበት ቀን', t:'text'},
        {id:'adv', en:'Advance date', am:'የቅድመ ክፍያ ቀን', t:'text'},
        {id:'fin', en:'Final payment date', am:'የመጨረሻ ክፍያ ቀን', t:'text'},
        {id:'conf', en:'Confidence', am:'እርግጠኝነት', t:'choice', opts:[
          {v:'high', en:'High', am:'ከፍተኛ'},
          {v:'med',  en:'Medium', am:'መካከለኛ'},
          {v:'low',  en:'Low', am:'ዝቅተኛ'}]},
        {id:'next', en:'Next step', am:'ቀጣይ እርምጃ', t:'text', picks:COL_NEXT}
      ]},
      {id:'proj_last', en:'Who from last week\'s projection did not sign or pay as expected, and why? (Write the names in the box.)', am:'ባለፈው ሳምንት ትንበያ ከነበሩት እንደተጠበቀው ያልፈረሙ ወይም ያልከፈሉ እነማን ናቸው? ለምን? (ስማቸውን በሳጥኑ ይጻፉ።)', t:'area', opt:1,
        picks:[
          { en:'Everyone signed or paid as expected',    am:'ሁሉም እንደተጠበቀው ፈረሙ ወይም ከፈሉ' },
          { en:'Still deciding',                         am:'ገና እየወሰኑ ነው' },
          { en:'The price was too high for them',        am:'ዋጋው በዛባቸው' },
          { en:'Waiting for their own money',            am:'የራሳቸውን ገንዘብ እየጠበቁ ነው' },
          { en:'Site not ready',                         am:'ቦታው ዝግጁ አይደለም' },
          { en:'Went to another company',                am:'ወደ ሌላ ድርጅት ሄዱ' },
          { en:'Moved to a later week',                  am:'ወደ ኋላ ሳምንት ተዛወረ' }
        ]}
    ]},
    { en:'Expected collections by week', am:'በሳምንት የሚጠበቅ ገቢ', fields:[
      {id:'proj_weeks', en:'How much do you expect to collect in each of the next 4 weeks?', am:'በሚቀጥሉት 4 ሳምንታት በእያንዳንዱ ሳምንት ስንት ብር ይሰበሰባል ብለው ይጠብቃሉ?', t:'grid',
       rows:[{en:'Week 1', am:'ሳምንት 1'},{en:'Week 2', am:'ሳምንት 2'},
             {en:'Week 3', am:'ሳምንት 3'},{en:'Week 4', am:'ሳምንት 4'}],
       cols:[
        {id:'adv', en:'Expected advance', am:'የሚጠበቅ ቅድመ ክፍያ', t:'money'},
        {id:'fin', en:'Expected final', am:'የሚጠበቅ የመጨረሻ ክፍያ', t:'money'},
        {id:'tot', en:'Total expected', am:'ጠቅላላ የሚጠበቅ', t:'money'}
      ]},
      /* the four weeks' totals, added up — it was typed a second time */
      {id:'proj_total', en:'What is the total expected over the 4 weeks?', am:'የአራቱ ሳምንታት ጠቅላላ የሚጠበቅ ገቢ ስንት ነው?', t:'money',
        auto:{grid:'proj_weeks.tot'},
        tgt:{op:'gte', v:12000000, en:'Below 12,000,000 Birr triggers the rolling penalty',
             am:'ከ12,000,000 ብር በታች ከሆነ ቅጣት ያስከትላል'}},
      {id:'proj_gap', en:'Under 12,000,000 Birr. What would close the gap, and what do you need? (Write the customers in the box.)', am:'ትንበያው ከ12,000,000 ብር በታች ነው። ክፍተቱን ምን ይሞላዋል? ምን ያስፈልግዎታል? (ደንበኞቹን በሳጥኑ ይጻፉ።)', t:'area',
        picks:[
          { en:'Turn the big open quotations into contracts', am:'ያሉትን ትላልቅ ፕሮፎርማዎች ወደ ውል መቀየር' },
          { en:'Collect overdue final payments',         am:'ያለፈባቸውን የመጨረሻ ክፍያዎች መሰብሰብ' },
          { en:'More marketing',                         am:'ተጨማሪ ማርኬቲንግ' },
          { en:'Faster installation, so finals come in', am:'የመጨረሻ ክፍያ እንዲገባ ተከላን ማፋጠን' },
          { en:'The Chairman to call key customers',     am:'ሊቀመንበሩ ዋና ደንበኞችን እንዲደውሉ' }
        ], show:{f:'proj_total', when:'miss'}}
    ]},
    { en:'What could stop it', am:'ምን ሊያግደው ይችላል', fields:[
      {id:'proj_obstacles', en:'What could stop these contracts or payments?', am:'እነዚህን ውሎች ወይም ክፍያዎች ምን ሊያግዳቸው ይችላል?', t:'area',
        picks:[
          { en:'Nothing in the way',                     am:'የሚያግድ ነገር የለም' },
          { en:'Customers still deciding',               am:'ደንበኞች ገና እየወሰኑ ነው' },
          { en:'Price',                                  am:'ዋጋ' },
          { en:'Customers waiting on their own money',   am:'ደንበኞች የራሳቸውን ገንዘብ እየጠበቁ ነው' },
          { en:'Sites not ready',                        am:'ቦታዎች ዝግጁ አይደሉም' },
          { en:'Factory or installation dates',          am:'የፋብሪካ ወይም የተከላ ቀኖች' },
          { en:'Holidays',                               am:'በዓላት' }
        ]},
      {id:'proj_capacity', en:'Which of these jobs need the factory or installation in the next 4 weeks, and about how many m²? (If you know.)', am:'ከእነዚህ ሥራዎች በሚቀጥሉት 4 ሳምንታት ምርት ወይም ተከላ የሚያስፈልጋቸው የትኞቹ ናቸው? በግምት ስንት ካሬ ሜትር? (ካወቁ።)', t:'area', opt:1},
      {id:'proj_support', en:'What support do you need from the Chairman?', am:'ከሊቀመንበሩ ምን ድጋፍ ያስፈልግዎታል?', t:'area', opt:1,
        picks:[
          { en:'Nothing needed',                         am:'ምንም አያስፈልግም', nil:1 },
          { en:'Approve prices or discounts',            am:'ዋጋ ወይም ቅናሽ ማጽደቅ' },
          { en:'Call a big customer',                    am:'ለትልቅ ደንበኛ መደወል' },
          { en:'Marketing budget',                       am:'የማርኬቲንግ በጀት' },
          { en:'Faster factory dates',                   am:'ፈጣን የፋብሪካ ቀኖች' }
        ]}
    ]},
    { en:'Can it be reached?', am:'ሊሳካ ይችላል?', fields:[
      {id:'proj_achievable', en:'Do you believe these figures can be reached?',
       am:'እነዚህ አኃዞች ሊሳኩ ይችላሉ ብለው ያምናሉ?', t:'yesno', yes:{en:'They can be reached', am:'ይሳካሉ'}, no:{en:'They are at risk', am:'ላይሳኩ ይችላሉ'}},
      {id:'proj_why', en:'Which part is at risk, and why?', am:'የትኛው ክፍል አደጋ ላይ ነው? ለምን?', t:'area', opt:1,
        picks:[
          { en:'The contracts',                          am:'ውሎቹ' },
          { en:'The advances',                           am:'ቅድመ ክፍያዎቹ' },
          { en:'The final payments',                     am:'የመጨረሻ ክፍያዎቹ' },
          { en:'One big customer',                       am:'አንድ ትልቅ ደንበኛ' },
          { en:'Factory or installation delays',         am:'የፋብሪካ ወይም የተከላ መዘግየት' }
        ], show:{f:'proj_achievable', when:'no'}}
    ]}
  ]
},

/* ============== EPHRATA — DAILY BOARD CHECK ============== */
/* The Chairman, 12 Oct 2026: "give that to Ephrata" — the Kanban Board
   Verification. The 15-column Job Tracking Board of the Implementation
   Document, counted once a day, and every card moved today checked against
   its signed paper file. The Golden Rule: no signature, no board movement;
   a mismatch blocks the card and goes to the Chairman the same day — this
   report is that. The totals, the matches and mismatches, PASS or FAIL, the
   jobs at each gate and the oldest card are worked out from what she taps.
   Not in her terms letter, so no fine (noFine) until it is.
   Never sent on 13, 14 or 15 Oct; the user, 16 Oct: "make her send it" —
   her phones ring at 3:30 PM on a day it is not in yet, and her home page
   says in red the days it was not sent (remind: app.js nagCard, Push.js
   remindWatch_). */
{
  id:'ephrata-board', person:'ephrata', cadence:'daily', dueTime:'16:00', remind:'15:30', noFine:1, derived:1, from:'2026-10-13',
  en:'Daily Board Check', am:'ዕለታዊ የቦርድ ፍተሻ',
  toEn:'Chairman', toAm:'ሊቀመንበር',
  dueEn:'4:00 PM, Monday to Saturday', dueAm:'ከሰኞ እስከ ቅዳሜ ከቀኑ 10፡00 (4:00 PM)',
  penEn:'No fine — not in your letter yet', penAm:'ቅጣት የለም — በደብዳቤዎ ውስጥ ገና የለም',
  sections:[
    { en:'The board now', am:'ቦርዱ አሁን', fields:[
      {id:'b_cols', en:'How many cards are in each column now? (0 if none)', am:'አሁን በእያንዳንዱ ዓምድ ስንት ካርድ አለ? (ከሌለ 0)',
       t:'grid', rows:BOARD_COLS.map(function (c) { return { en:c.en, am:c.am }; }), cols:[
        {id:'n', en:'Cards', am:'ካርዶች', t:'num'}
      ]},
      {id:'b_total', en:'How many cards are on the board in all?', am:'በቦርዱ ላይ በአጠቃላይ ስንት ካርድ አለ?', t:'num',
        auto:{grid:'b_cols.n'}, sumEn:'cards on the board', sumAm:'ካርዶች በቦርዱ ላይ'},
      {id:'b_blocked', en:'How many cards are blocked — held until a file is signed or a payment comes? (0 if none)', am:'ስንት ካርዶች ታግደዋል — ፋይል እስኪፈረም ወይም ክፍያ እስኪመጣ የቆሙ? (ከሌለ 0)', t:'num'}
    ]},
    { en:'Cards moved today — board against the signed file', am:'ዛሬ የተንቀሳቀሱ ካርዶች — ቦርዱ ከተፈረመው ፋይል ጋር', fields:[
      {id:'b_moved_any', en:'Did any card move today?', am:'ዛሬ የተንቀሳቀሰ ካርድ አለ?', t:'yesno', yes:{en:'Cards moved today', am:'ዛሬ ካርድ ተንቀሳቅሷል'}, no:{en:'No card moved today', am:'ዛሬ ምንም ካርድ አልተንቀሳቀሰም'}},
      {id:'b_moved_list', en:'Each card moved today — and is its paper file signed?', am:'ዛሬ የተንቀሳቀሰ እያንዳንዱ ካርድ — የወረቀት ፋይሉ ተፈርሟል?', t:'table', addEn:'Add a card', addAm:'ካርድ ጨምር',
        show:{f:'b_moved_any', when:'yes'},
        cols:[
          {id:'code', en:'Job code', am:'የሥራ ኮድ', t:'text'},
          {id:'col',  en:'Moved to column', am:'የተዛወረበት ዓምድ', t:'choice', opts:BOARD_COLS},
          {id:'by',   en:'Moved by', am:'ያንቀሳቀሰው', t:'choice', opts:BOARD_WHO},
          {id:'signed', en:'Paper file signed', am:'የወረቀት ፋይሉ ተፈርሟል', t:'yesno', yes:{en:'File signed', am:'ፋይሉ ተፈርሟል'}, no:{en:'File NOT signed', am:'ፋይሉ አልተፈረመም'}}
        ]},
      {id:'b_moved', en:'How many cards moved today?', am:'ዛሬ ስንት ካርዶች ተንቀሳቀሱ?', t:'num',
        auto:{rows:'b_moved_list'}, sumEn:'cards moved today', sumAm:'ዛሬ የተንቀሳቀሱ ካርዶች'},
      {id:'b_match', en:'How many match their signed file?', am:'ስንቱ ከተፈረመው ፋይል ጋር ይስማማሉ?', t:'num',
        auto:{rows:'b_moved_list', when:{col:'signed', is:'yes'}}, sumEn:'match the file', sumAm:'ከፋይሉ ጋር ይስማማሉ'},
      {id:'b_mismatch', en:'How many moved without a signed file?', am:'ስንቱ ያለ ተፈረመ ፋይል ተንቀሳቀሱ?', t:'num',
        auto:{rows:'b_moved_list', when:{col:'signed', is:'no'}}, sumEn:'moved without a signed file', sumAm:'ያለ ተፈረመ ፋይል ተንቀሳቅሰዋል',
        tgt:{op:'lte', v:0, en:'The Golden Rule: no signature, no board movement', am:'ወርቃማው ሕግ፦ ፊርማ ከሌለ ካርድ አይንቀሳቀስም'}},
      {id:'b_golden', en:'The Golden Rule today', am:'ወርቃማው ሕግ ዛሬ', t:'yesno', yes:{en:'PASS — every card moved has its signed file', am:'አልፏል — የተንቀሳቀሰ ካርድ ሁሉ ፋይሉ ተፈርሟል'}, no:{en:'FAIL — a card moved without its signed file', am:'ወድቋል — ያለ ተፈረመ ፋይል የተንቀሳቀሰ ካርድ አለ'},
        auto:{all:'b_moved_list.signed'}, show:{f:'b_moved_any', when:'yes'}},
      {id:'b_mis_list', en:'Each card moved without its signed file: where the board and the file stand, and what was done', am:'ያለ ተፈረመ ፋይል የተንቀሳቀሰ እያንዳንዱ ካርድ፦ ቦርዱና ፋይሉ የት ናቸው፣ ምን ተደረገ', t:'table', addEn:'Add a card', addAm:'ካርድ ጨምር',
        show:{f:'b_mismatch', when:'pos'},
        cols:[
          {id:'code',  en:'Job code', am:'የሥራ ኮድ', t:'text'},
          {id:'board', en:'Board shows', am:'ቦርዱ የሚያሳየው', t:'choice', opts:BOARD_COLS},
          {id:'file',  en:'Paper file shows', am:'የወረቀት ፋይሉ የሚያሳየው', t:'choice', opts:BOARD_COLS},
          {id:'owner', en:'Who must sign', am:'መፈረም ያለበት', t:'choice', opts:BOARD_WHO},
          {id:'why',   en:'Why', am:'ለምን', t:'text', picks:[
            { en:'Paid in the bank, file not signed', am:'ባንክ ገብቷል፣ ፋይሉ አልተፈረመም' },
            { en:'Moved before the work was done',    am:'ሥራው ሳይሠራ ተንቀሳቀሰ' },
            { en:'Signed by the wrong person',        am:'የፈረመው ሌላ ሰው ነው' },
            { en:'The file is missing',               am:'ፋይሉ የለም' }
          ]},
          {id:'action', en:'What was done', am:'ምን ተደረገ', t:'choice', opts:[
            { v:'block',  en:'Card blocked until the file is signed', am:'ፋይሉ እስኪፈረም ካርዱ ታግዷል' },
            { v:'back',   en:'Card moved back to where the file is',  am:'ካርዱ ፋይሉ ወዳለበት ተመልሷል' },
            { v:'signed', en:'File signed now — they match',          am:'ፋይሉ አሁን ተፈርሟል — ይስማማሉ' }
          ]}
        ]}
    ]},
    { en:'Payment and release gates', am:'የክፍያና የመልቀቂያ በሮች', fields:[
      {id:'b_gate_any', en:'Is any job held at a gate?', am:'በአንድ በር ላይ የቆመ ሥራ አለ?', t:'yesno', yes:{en:'Jobs held at a gate', am:'በበር ላይ የቆሙ ሥራዎች አሉ'}, no:{en:'No job held at a gate', am:'በበር ላይ የቆመ ሥራ የለም'}},
      {id:'b_gate_list', en:'Each job held at a gate', am:'በበር ላይ የቆመ እያንዳንዱ ሥራ', t:'table', addEn:'Add a job', addAm:'ሥራ ጨምር',
        show:{f:'b_gate_any', when:'yes'},
        cols:[
          {id:'code', en:'Job code', am:'የሥራ ኮድ', t:'text'},
          {id:'gate', en:'Gate', am:'በር', t:'choice', opts:[
            { v:'g1', en:'G1 — 50% advance, over 3 days late',      am:'G1 — 50% ቅድሚያ፣ ከ3 ቀን በላይ ዘግይቷል' },
            { v:'g2', en:'G2 — 100% final payment, over 7 days late', am:'G2 — 100% የመጨረሻ ክፍያ፣ ከ7 ቀን በላይ ዘግይቷል' },
            { v:'g3', en:'G3 — store release waiting',               am:'G3 — ከመጋዘን መልቀቅ ይጠበቃል' },
            { v:'g4', en:'G4 — production approval waiting',         am:'G4 — የምርት ማጽደቅ ይጠበቃል' },
            { v:'g5', en:'G5 — delivery clearance waiting',          am:'G5 — የማድረስ ፈቃድ ይጠበቃል' }
          ]},
          {id:'days', en:'Days waiting', am:'የጠበቀበት ቀን', t:'num'}
        ]},
      {id:'b_g1', en:'G1 — 50% advance over 3 days late', am:'G1 — 50% ቅድሚያ ከ3 ቀን በላይ የዘገየ', t:'text', auto:{list:'b_gate_list.code', when:{col:'gate', is:'g1'}}},
      {id:'b_g2', en:'G2 — 100% final payment over 7 days late', am:'G2 — 100% የመጨረሻ ክፍያ ከ7 ቀን በላይ የዘገየ', t:'text', auto:{list:'b_gate_list.code', when:{col:'gate', is:'g2'}}},
      {id:'b_g3', en:'G3 — store release waiting', am:'G3 — ከመጋዘን መልቀቅ የሚጠብቅ', t:'text', auto:{list:'b_gate_list.code', when:{col:'gate', is:'g3'}}},
      {id:'b_g4', en:'G4 — production approval waiting', am:'G4 — የምርት ማጽደቅ የሚጠብቅ', t:'text', auto:{list:'b_gate_list.code', when:{col:'gate', is:'g4'}}},
      {id:'b_g5', en:'G5 — delivery clearance waiting', am:'G5 — የማድረስ ፈቃድ የሚጠብቅ', t:'text', auto:{list:'b_gate_list.code', when:{col:'gate', is:'g5'}}}
    ]},
    { en:'Stuck cards', am:'የቆሙ ካርዶች', fields:[
      {id:'b_stuck_any', en:'Is any card in the same column for more than 7 days?', am:'ከ7 ቀን በላይ በአንድ ዓምድ ላይ የቆመ ካርድ አለ?', t:'yesno', yes:{en:'Cards stuck over 7 days', am:'ከ7 ቀን በላይ የቆሙ ካርዶች አሉ'}, no:{en:'No card stuck', am:'የቆመ ካርድ የለም'}},
      {id:'b_stuck_list', en:'Each card stuck over 7 days', am:'ከ7 ቀን በላይ የቆመ እያንዳንዱ ካርድ', t:'table', addEn:'Add a card', addAm:'ካርድ ጨምር',
        show:{f:'b_stuck_any', when:'yes'},
        cols:[
          {id:'code',  en:'Job code', am:'የሥራ ኮድ', t:'text'},
          {id:'col',   en:'Column', am:'ዓምድ', t:'choice', opts:BOARD_COLS},
          {id:'days',  en:'Days in that column', am:'በዚያ ዓምድ የቆየበት ቀን', t:'num'},
          {id:'owner', en:'Whose move it is', am:'ማንቀሳቀስ ያለበት', t:'choice', opts:BOARD_WHO},
          {id:'why',   en:'Why', am:'ለምን', t:'text', picks:[
            { en:'The customer refuses to pay',  am:'ደንበኛው ለመክፈል አልፈቀደም' },
            { en:'Advance not paid yet',         am:'ቅድሚያ ገና አልተከፈለም' },
            { en:'Waiting for the customer',     am:'ደንበኛውን እየጠበቅን ነው' },
            { en:'Waiting for material',         am:'ዕቃ እየጠበቅን ነው' },
            { en:'The file is not signed',       am:'ፋይሉ አልተፈረመም' }
          ]}
        ]},
      {id:'b_stuck', en:'How many cards are stuck over 7 days?', am:'ስንት ካርዶች ከ7 ቀን በላይ ቆመዋል?', t:'num',
        auto:{rows:'b_stuck_list'}, sumEn:'stuck over 7 days', sumAm:'ከ7 ቀን በላይ ቆመዋል'},
      {id:'b_oldest', en:'The card longest in one column', am:'በአንድ ዓምድ ረጅም ጊዜ የቆየው ካርድ', t:'text',
        auto:{top:'b_stuck_list', by:'days', say:['code', 'col', 'days'], unit:{en:'days', am:'ቀን'}}}
    ]},
    { en:'Problems and how sure you are', am:'ችግሮችና ምን ያህል እርግጠኛ እንደሆኑ', fields:[
      {id:'b_issue_list', en:'The top problems on the board — up to three: what, whose, by when', am:'በቦርዱ ላይ ዋና ዋና ችግሮች — እስከ ሦስት፦ ምን፣ የማን፣ እስከ መቼ', t:'table', opt:1, addEn:'Add a problem', addAm:'ችግር ጨምር',
        cols:[
          {id:'what',  en:'Problem', am:'ችግሩ', t:'text', picks:[
            { en:'A card moved without its signed file', am:'ያለ ተፈረመ ፋይል የተንቀሳቀሰ ካርድ' },
            { en:'Final payment overdue',                am:'የመጨረሻ ክፍያ ዘግይቷል' },
            { en:'Advance overdue',                      am:'ቅድሚያ ዘግይቷል' },
            { en:'A card stuck over 7 days',             am:'ከ7 ቀን በላይ የቆመ ካርድ' },
            { en:'Production queue empty',               am:'የምርት ወረፋው ባዶ ነው' },
            { en:'Material not received',                am:'ዕቃ አልደረሰም' },
            { en:'Delivery not cleared',                 am:'ማድረስ አልተፈቀደም' }
          ]},
          {id:'owner', en:'Whose', am:'የማን', t:'choice', opts:BOARD_WHO},
          {id:'by',    en:'By', am:'እስከ', t:'date'}
        ]},
      {id:'b_sure', en:'How sure are you of today\'s check?', am:'በዛሬው ፍተሻ ምን ያህል እርግጠኛ ነዎት?', t:'choice', opts:[
        { v:'high', en:'Sure — I checked every card against its file', am:'እርግጠኛ ነኝ — እያንዳንዱን ካርድ ከፋይሉ ጋር አይቻለሁ' },
        { v:'mid',  en:'Mostly — some files I did not see',          am:'በአብዛኛው — ያላየኋቸው ፋይሎች አሉ' },
        { v:'low',  en:'Not sure — not checked properly today',      am:'እርግጠኛ አይደለሁም — ዛሬ በደንብ አልተፈተሸም' }
      ]}
    ]}
  ]
},

/* ============== MAHELET — 15-DAY PRODUCTION PLAN ============== */
{
  id:'liu-plan', person:'liu', cadence:'weekly', dueTime:'15:00', dueDay:6,
  en:'15-Day Production Plan', am:'የ15 ቀን የምርት ዕቅድ',
  toEn:'Chairman + Kidan', toAm:'ሊቀመንበር + ኪዳን',
  dueEn:'Saturday 3:00 PM', dueAm:'ቅዳሜ ከቀኑ 9፡00 (3:00 PM)',
  penEn:'Late or not sent –5,000 Birr · Incomplete –2,000 Birr · Two weeks without a plan –10,000 Birr',
  penAm:'ዘግይቶ ወይም ሳይላክ –5,000 ብር · ያልተሟላ –2,000 ብር · ሁለት ሳምንት ካልቀረበ –10,000 ብር',
  sections:[
    /* REWORDED 11 Oct 2026 (the Chairman: "they are struggling so much with
       the questions"). Mahelet's first plan (10 Oct) left the internal-jobs
       question, the materials list and the capacity check empty. The plan
       itself — the queue, the fifteen days, the materials — is what the
       register (apps-script/Register.js), the plant manager and the Sunday
       "what to buy" reader (Ops.js) are built on, so every table and column
       stays exactly as it was. What changed: every "why" and every note is
       buttons now, with a box for the job code; the questions are shorter. */
    { en:'Plan period', am:'የዕቅዱ ጊዜ', fields:[
      {id:'plan_start', en:'On what date does this plan start?', am:'ዕቅዱ በየትኛው ቀን ይጀምራል?', t:'date'},
      {id:'plan_prep', en:'Who prepared this plan?', am:'ዕቅዱን ያዘጋጀው ማን ነው?', t:'text',
        picks:[
          { en:'Mahelet',                                am:'ማህሌት' },
          { en:'Amaha',                                  am:'አማሃ' },
          { en:'Wude',                                   am:'ውዱ' },
          { en:'Getachew',                               am:'ጌታቸው' }
        ]},
      {id:'plan_changes', en:'What changed from last week\'s plan, and did the Chairman approve it? (Write the jobs in the box.)', am:'ካለፈው ሳምንት ዕቅድ ምን ተቀየረ? ሊቀመንበሩ አጽድቀውታል? (ሥራዎቹን በሳጥኑ ይጻፉ።)', t:'area', opt:1,
        picks:[
          { en:'No change from last week',               am:'ካለፈው ሳምንት ለውጥ የለም' },
          { en:'A job moved earlier',                    am:'ሥራ ወደ ፊት ተዛወረ' },
          { en:'A job moved later',                      am:'ሥራ ወደ ኋላ ተዛወረ' },
          { en:'A new job was added',                    am:'አዲስ ሥራ ተጨመረ' },
          { en:'A job was taken out',                    am:'ሥራ ከዕቅዱ ወጣ' },
          { en:'The Chairman approved the changes',      am:'ለውጦቹን ሊቀመንበሩ አጽድቀዋል' },
          { en:'Not approved yet',                       am:'ገና አልጸደቀም' }
        ]}
    ]},
    { en:'Payment-confirmed jobs from Selam', am:'ከሰላም የክፍያ ማረጋገጫ ያላቸው ሥራዎች', fields:[
      {id:'plan_paid', en:'Which jobs has Selam confirmed in writing as fully paid?', am:'ሰላም ሙሉ ክፍያቸውን በጽሑፍ ያረጋገጠችላቸው የትኞቹ ሥራዎች ናቸው?',
       t:'table', addEn:'Add job', addAm:'ሥራ ጨምር', cols:[
        {id:'code', en:'Job code', am:'የሥራ ኮድ', t:'text'},
        {id:'cust', en:'Customer', am:'ደንበኛ', t:'text'},
        {id:'m2',   en:'m²', am:'ካሬ ሜትር', t:'num'},
        {id:'ok',   en:'Final payment confirmed', am:'የመጨረሻ ክፍያ ተረጋግጧል', t:'yesno', yes:{en:'Confirmed', am:'ተረጋግጧል'}, no:{en:'Not yet', am:'ገና አልተረጋገጠም'}},
        {id:'date', en:"Selam's confirmation date", am:'ሰላም ያረጋገጠችበት ቀን', t:'text'}
      ]},
      {id:'plan_list_late', en:"Did Selam's list of paid jobs reach you by Saturday 1:00 PM?", am:'የሰላም የተከፈሉ ሥራዎች ዝርዝር እስከ ቅዳሜ 7፡00 ደርሶዎታል?', t:'yesno', yes:{en:'It came on time', am:'በሰዓቱ ደርሷል'}, no:{en:'It came late, or not at all', am:'ዘግይቷል ወይም አልደረሰም'}},
      {id:'plan_list_late_why', en:'When did it arrive, and what did the delay do to this plan?', am:'መቼ ደረሰ? መዘግየቱ በዚህ ዕቅድ ላይ ምን አመጣ?', t:'area',
        picks:[
          { en:'Arrived later on Saturday',              am:'ቅዳሜ ዘግይቶ ደረሰ' },
          { en:'Not arrived yet',                        am:'ገና አልደረሰም' },
          { en:"Plan made from last week's list",        am:'ዕቅዱ በባለፈው ሳምንት ዝርዝር ተሠራ' },
          { en:'Some jobs left out until confirmed',     am:'እስኪረጋገጡ አንዳንድ ሥራዎች ወጥተዋል' },
          { en:'No effect on the plan',                  am:'በዕቅዱ ላይ ምንም ለውጥ አላመጣም' }
        ], show:{f:'plan_list_late', when:'no'}}
    ]},
    { en:'Production queue', am:'የምርት ተራ', fields:[
      {id:'plan_queue', en:'In what order will the jobs be made? (One row a job.)', am:'ሥራዎቹ በምን ቅደም ተከተል ይሠራሉ? (ለእያንዳንዱ ሥራ አንድ መስመር።)',
       t:'table', addEn:'Add job to the queue', addAm:'ወደ ተራው ሥራ ጨምር', cols:[
        {id:'pri',  en:'Priority', am:'ቅድሚያ', t:'num'},
        {id:'code', en:'Job code', am:'የሥራ ኮድ', t:'text'},
        {id:'cust', en:'Customer', am:'ደንበኛ', t:'text'},
        {id:'m2',   en:'m²', am:'ካሬ ሜትር', t:'num'},
        {id:'start',en:'Planned start', am:'የሚጀመርበት', t:'date'},
        {id:'done', en:'Planned completion', am:'የሚጠናቀቅበት', t:'date'}
        /* "QC date" and "Delivery date" taken off (the Chairman, 14 Oct 2026:
           "we don't need this"); never filled. Register.js, Ops.js and
           Plant.js read qc/del only when there is one. */
      ]},
      {id:'plan_rove', en:'Are there any Rovestone or other internal jobs in this plan?', am:'በዚህ ዕቅድ ውስጥ የሮቭስቶን ወይም ሌላ የውስጥ ሥራ አለ?', t:'yesno', yes:{en:'Some jobs are internal', am:'የውስጥ ሥራ አለ'}, no:{en:'All are customer jobs', am:'ሁሉም የደንበኛ ሥራ ነው'}},
      {id:'plan_rove_what', en:'Has the Chairman approved each one? (Write the jobs and m² in the box. Internal work queues behind fully paid external jobs.)', am:'እያንዳንዳቸውን ሊቀመንበሩ አጽድቀዋል? (ሥራዎቹንና ካሬ ሜትሩን በሳጥኑ ይጻፉ። የውስጥ ሥራ ሙሉ ከተከፈለባቸው የውጭ ሥራዎች በኋላ ነው።)', t:'area',
        picks:[
          { en:'All approved by the Chairman',           am:'ሁሉም በሊቀመንበሩ ጸድቀዋል' },
          { en:'Not approved yet',                       am:'ገና አልጸደቁም' },
          { en:'Queued after the paid external jobs',    am:'ከተከፈለባቸው የውጭ ሥራዎች በኋላ ተይዘዋል' }
        ], show:{f:'plan_rove', when:'yes'}}
    ]},
    /* JOB BY JOB, DAY BY DAY (the Chairman, 11 Oct 2026: "for Mahelet's 15-day
       plan, give her a table, Monday to Saturday, job code, their m²"). The
       first plan filed (10 Oct) put three jobs in one box and one figure for
       the day — "kk 155 kk 160 kk165 · 40/60" — so nobody could tell how much
       of which job was meant to be made, and nothing could be checked against
       what the factory made. Now each working day has up to three jobs, each
       with its own m². The day's total and its job list (plan_days, which the
       Operations and Plant readers and the Chairman's "Said → done" read) are
       worked out from them, under the same keys as before. */
    { en:'Daily production target', am:'የዕለት የምርት ዒላማ', fields:[
      {id:'plan_week', en:'Each working day: which jobs, and how many m² of each?', am:'በየሥራ ቀኑ፦ የትኞቹ ሥራዎች? የእያንዳንዱ ስንት ካሬ ሜትር?',
       /* 15 working days: Klever works Monday to Saturday (Chairman, 2 Oct 2026) */
       t:'grid', dateFrom:'plan_start', workDays:true,
       rows: Array.from({length:15}, function (_, i) {
         return {en:'Day ' + (i+1), am:'ቀን ' + (i+1)};
       }),
       cols:[
        {id:'k1', en:'Job', am:'ሥራ', t:'text'},
        {id:'m1', en:'m²', am:'ካሬ ሜትር', t:'num', most:{v:120, en:'m² of one job in one day cannot be right (a full day is about 40 m²)', am:'ካሬ ሜትር የአንድ ሥራ በአንድ ቀን ሊሆን አይችልም (ሙሉ ቀን 40 ካሬ ሜትር ገደማ ነው)'}},
        {id:'k2', en:'2nd job', am:'2ኛ ሥራ', t:'text'},
        {id:'n2', en:'m²', am:'ካሬ ሜትር', t:'num', most:{v:120, en:'m² of one job in one day cannot be right (a full day is about 40 m²)', am:'ካሬ ሜትር የአንድ ሥራ በአንድ ቀን ሊሆን አይችልም (ሙሉ ቀን 40 ካሬ ሜትር ገደማ ነው)'}},
        {id:'k3', en:'3rd job', am:'3ኛ ሥራ', t:'text'},
        {id:'n3', en:'m²', am:'ካሬ ሜትር', t:'num', most:{v:120, en:'m² of one job in one day cannot be right (a full day is about 40 m²)', am:'ካሬ ሜትር የአንድ ሥራ በአንድ ቀን ሊሆን አይችልም (ሙሉ ቀን 40 ካሬ ሜትር ገደማ ነው)'}},
        {id:'notes', en:'Notes', am:'ማስታወሻ', t:'text'}
      ]},
      {id:'plan_days', en:'How many m² are planned for each day, and on which jobs?', am:'በየቀኑ ስንት ካሬ ሜትር ታቅዷል? በየትኞቹ ሥራዎች?',
       t:'grid', dateFrom:'plan_start', workDays:true, quiet:1,
       auto:{fold:'plan_week', sum:{m2:['m1', 'n2', 'n3']}, join:{jobs:['k1', 'k2', 'k3']}, keep:{notes:'notes'}},
       rows: Array.from({length:15}, function (_, i) {
         return {en:'Day ' + (i+1), am:'ቀን ' + (i+1)};
       }),
       cols:[
        {id:'m2',    en:'Planned m²', am:'የታቀደ ካሬ ሜትር', t:'num'},
        {id:'jobs',  en:'Jobs', am:'ሥራዎች', t:'text'},
        {id:'notes', en:'Notes', am:'ማስታወሻ', t:'text'}
      ]}
    ]},
    { en:'Materials and what could stop it', am:'ዕቃዎችና ሊያቆሙት የሚችሉ ነገሮች', fields:[
      /* the production date is set before the material is bought (the Chairman,
         8 Oct 2026), so the plan has to say what to buy. One row a material,
         not one a job — you buy the MDF once, and a job needing six materials
         would otherwise write its code six times. The same twelve materials
         the store counts, so the plan, the store and purchasing use one set
         of words. */
      {id:'plan_mat', en:'What material does this plan need from the store? (One row a material; write the job codes in the last box.)', am:'ይህ ዕቅድ ከመጋዘን ምን ዕቃ ይፈልጋል? (ለእያንዳንዱ ዕቃ አንድ መስመር፤ የሥራ ኮዶቹን በመጨረሻው ሳጥን ይጻፉ።)',
       t:'table', addEn:'Add a material', addAm:'ዕቃ ጨምር', cols:[
          {id:'mat',  en:'Material', am:'ዕቃ', t:'choice', opts:[
            {v:'MDF 18mm',            en:'MDF 18mm',            am:'ኤምዲኤፍ 18ሚሜ'},
            {v:'MDF 16mm',            en:'MDF 16mm',            am:'ኤምዲኤፍ 16ሚሜ'},
            {v:'Melamine 18mm',       en:'Melamine 18mm',       am:'ሜላሚን 18ሚሜ'},
            {v:'Melamine 16mm',       en:'Melamine 16mm',       am:'ሜላሚን 16ሚሜ'},
            {v:'Plywood',             en:'Plywood',             am:'ፕላይውድ'},
            {v:'Back panel 3mm',      en:'Back panel 3mm',      am:'የኋላ ሰሌዳ 3ሚሜ'},
            {v:'Back panel 6mm',      en:'Back panel 6mm',      am:'የኋላ ሰሌዳ 6ሚሜ'},
            {v:'Edge banding (m)',    en:'Edge banding (m)',    am:'ጠርዝ ማሰሪያ (ሜትር)'},
            {v:'Hinges',              en:'Hinges',              am:'ማጠፊያዎች'},
            {v:'Drawer slides',       en:'Drawer slides',       am:'የመሳቢያ ተንሸራታቾች'},
            {v:'Handles',             en:'Handles',             am:'መያዣዎች'},
            {v:'Legs and shelf pins', en:'Legs and shelf pins', am:'እግሮችና የመደርደሪያ ችንካሮች'},
            {v:'Glue and screws',     en:'Glue and screws',     am:'ሙጫና ብሎኖች'}
          ]},
          {id:'qty',  en:'Quantity', am:'ብዛት', t:'num'},
          {id:'jobs', en:'For which jobs', am:'ለየትኞቹ ሥራዎች', t:'text'}
        ]},
      {id:'plan_block', en:'What could stop this plan? (Write who must help in the box.)', am:'ይህን ዕቅድ ምን ሊያቆመው ይችላል? (ማን መርዳት እንዳለበት በሳጥኑ ይጻፉ።)', t:'area', opt:1,
        picks:[
          { en:'Nothing in the way',                     am:'የሚያግድ ነገር የለም' },
          { en:'Material not bought yet',                am:'ዕቃ ገና አልተገዛም' },
          { en:'Payments not confirmed',                 am:'ክፍያዎች አልተረጋገጡም' },
          { en:'A machine needs repair',                 am:'ማሽን ጥገና ይፈልጋል' },
          { en:'Not enough workers',                     am:'ሠራተኞች በቂ አይደሉም' },
          { en:'Designs or cutting lists late',          am:'ዲዛይን ወይም የመቁረጫ ዝርዝር ዘግይቷል' }
        ]}
    ]},
    { en:'Confirmation', am:'ማረጋገጫ', fields:[
      {id:'plan_rule', en:'Does every job in this plan have Selam’s written payment confirmation?',
       am:'በዚህ ዕቅድ ያለው እያንዳንዱ ሥራ የሰላም የጽሑፍ የክፍያ ማረጋገጫ አለው?', t:'yesno', yes:{en:'Every job is confirmed', am:'ሁሉም ተረጋግጠዋል'}, no:{en:'Some are not', am:'ያልተረጋገጠ አለ'}},
      {id:'plan_rule_why', en:'Why is a job without it in the plan? (Write the job in the box. –5,000 Birr per job)', am:'ማረጋገጫ የሌለው ሥራ ለምን በዕቅዱ ገባ? (ሥራውን በሳጥኑ ይጻፉ። በሥራ –5,000 ብር)', t:'area',
        picks:[
          { en:'The Chairman allowed it',                am:'ሊቀመንበሩ ፈቅደዋል' },
          { en:'Selam will confirm before it starts',    am:'ከመጀመሩ በፊት ሰላም ታረጋግጣለች' },
          { en:'Internal (Rovestone) work',              am:'የውስጥ (የሮቭስቶን) ሥራ' },
          { en:'Taken out of the plan now',              am:'አሁን ከዕቅዱ ወጥቷል' }
        ], show:{f:'plan_rule', when:'no'}},
      {id:'plan_capacity', en:'Do the machines and the material on hand fit this plan?',
       am:'ዕቅዱ ከማሽን አቅምና ካለው ዕቃ ጋር ይጣጣማል?', t:'yesno', yes:{en:'It fits', am:'ይበቃል'}, no:{en:'It does not fit', am:'አይበቃም'}},
      {id:'plan_capacity_why', en:'Where does it go over, and what will give? (Write the job in the box.)', am:'የት ላይ ይበልጣል? ምን ይለቀቃል? (ሥራውን በሳጥኑ ይጻፉ።)', t:'area',
        picks:[
          { en:'A machine cannot keep up',               am:'ማሽኑ አይደርስም' },
          { en:'Not enough material',                    am:'ዕቃ በቂ አይደለም' },
          { en:'Not enough workers',                     am:'ሠራተኞች በቂ አይደሉም' },
          { en:'A job moves to the next plan',           am:'ሥራ ወደ ቀጣዩ ዕቅድ ይዛወራል' },
          { en:'Overtime needed',                        am:'የትርፍ ሰዓት ሥራ ያስፈልጋል' },
          { en:'Material to be bought',                  am:'ዕቃ መገዛት አለበት' }
        ], show:{f:'plan_capacity', when:'no'}}
    ]}
  ]
},

/* ========== BETELHEM — WEEKLY 4-WEEK CASH FLOW PROJECTION ========== */
{
  id:'betty-cashflow', person:'betty', cadence:'weekly', dueTime:'17:00', dueDay:4,
  en:'4-Week Cash Flow Projection', am:'የ4 ሳምንት የገንዘብ ፍሰት ትንበያ',
  toEn:'Chairman + Kidan', toAm:'ሊቀመንበር + ኪዳን',
  dueEn:'Thursday 5:00 PM', dueAm:'ሐሙስ ከቀኑ 11፡00 (5:00 PM)',
  penEn:'Late –500 Birr · Missing –1,000 Birr · Shortfall not flagged in advance –2,000 Birr',
  penAm:'ዘግይቶ –500 ብር · ካልቀረበ –1,000 ብር · እጥረት አስቀድሞ ካልተነገረ –2,000 ብር',
  derived:1,
  sections:[
    /* REBUILT 11 Oct 2026 (the Chairman: "they are struggling so much with
       the questions"). Never filed yet. 13 questions stood on screen on
       Thursday: the two four-week grids, five money figures, two yes/no
       flags, and three boxes about a shortfall — when, how much, what to
       do — open on every week, short or not. The two grids stay exactly as
       they were: the Sunday pack reads week 1 of money in, the CFO reads
       week 1 of money out. The balance at the end of week 4 is now the
       grids added to today's balance, not typed a second time. The two
       flags are one list; cf_short (the alert on a shortfall) and
       cf_freeze keep their keys and are worked out from it ({picked:…},
       quiet:1); the shortfall's when, cause and action open with it. */
    { en:'Expected money in', am:'የሚጠበቅ ገቢ', fields:[
      {id:'cf_in', en:'How much money do you expect in each of the next 4 weeks? Your best guess is fine.', am:'በሚቀጥሉት 4 ሳምንታት በየሳምንቱ ስንት ብር ይገባል ብለው ይጠብቃሉ? ግምትዎ በቂ ነው።', t:'grid',
       rows:[{en:'Week 1', am:'ሳምንት 1'},{en:'Week 2', am:'ሳምንት 2'},
             {en:'Week 3', am:'ሳምንት 3'},{en:'Week 4', am:'ሳምንት 4'}],
       cols:[
        {id:'adv',   en:'Advances', am:'ቅድመ ክፍያዎች', t:'money'},
        {id:'final', en:'Final payments', am:'የመጨረሻ ክፍያዎች', t:'money'},
        {id:'other', en:'Other', am:'ሌላ', t:'money'}
      ]},
      /* nothing reads it; it is the reason behind the figures, for the
         weeks the big ones are worth naming */
      {id:'cf_in_big', en:'Which big customer payments are behind these figures? (The big ones only.)', am:'ከእነዚህ አኃዞች ጀርባ ያሉት ትላልቅ የደንበኛ ክፍያዎች የትኞቹ ናቸው? (ትላልቆቹን ብቻ።)', t:'table', opt:1, addEn:'Add a payment', addAm:'ክፍያ ጨምር',
        cols:[
          {id:'cust', en:'Customer', am:'ደንበኛ', t:'text'},
          {id:'code', en:'Job code', am:'የሥራ ኮድ', t:'text'},
          {id:'amount', en:'Amount', am:'መጠን', t:'money'},
          {id:'week', en:'Week', am:'ሳምንት', t:'text'},
          {id:'sure', en:'How sure', am:'እርግጠኝነት', t:'choice', opts:[
            {v:'confirmed', en:'Confirmed', am:'የተረጋገጠ'},
            {v:'likely', en:'Likely', am:'ሊሆን የሚችል'},
            {v:'uncertain', en:'Uncertain', am:'እርግጠኛ ያልሆነ'}]}
        ]}
    ]},
    { en:'Expected money out', am:'የሚጠበቅ ወጪ', fields:[
      {id:'cf_out', en:'How much money must go out in each of the next 4 weeks? Your best guess is fine.', am:'በሚቀጥሉት 4 ሳምንታት በየሳምንቱ ስንት ብር ይወጣል? ግምትዎ በቂ ነው።', t:'grid',
       rows:[{en:'Week 1', am:'ሳምንት 1'},{en:'Week 2', am:'ሳምንት 2'},
             {en:'Week 3', am:'ሳምንት 3'},{en:'Week 4', am:'ሳምንት 4'}],
       cols:[
        {id:'sup',  en:'Suppliers', am:'አቅራቢዎች', t:'money'},
        {id:'sal',  en:'Salaries', am:'ደመወዝ', t:'money'},
        {id:'asm',  en:'Assemblers', am:'ገጣጣሚዎች', t:'money'},
        {id:'other',en:'Utilities and other', am:'የመብራት/ውሃና ሌላ', t:'money'}
      ]}
    ]},
    { en:'Balance and the reserve rule', am:'ቀሪ ሂሳብና የመጠባበቂያ ደንብ', fields:[
      {id:'cf_open', en:'What is the bank balance today?', am:'ዛሬ የባንክ ቀሪ ስንት ነው?', t:'money'},
      {id:'cf_low', en:'What is the lowest balance expected in the next 4 weeks?', am:'በሚቀጥሉት 4 ሳምንታት ዝቅተኛው የሚጠበቅ ቀሪ ስንት ነው?', t:'money',
        tgt:{op:'gte', v:6000000, en:'6 Million Birr Cash Reserve Rule',
             am:'የ6 ሚሊዮን ብር መጠባበቂያ ደንብ'}},
      {id:'cf_lowweek', en:'In which week?', am:'በየትኛው ሳምንት?', t:'text', one:1,
        picks:[
          { en:'Week 1', am:'ሳምንት 1' },
          { en:'Week 2', am:'ሳምንት 2' },
          { en:'Week 3', am:'ሳምንት 3' },
          { en:'Week 4', am:'ሳምንት 4' }
        ]},
      {id:'cf_low_why', en:'It drops below the 6,000,000 Birr reserve. Why, and what will be done first? (Write which payments wait and which collections are chased in the box.)', am:'ከ6,000,000 ብር መጠባበቂያ በታች ይወርዳል። ለምን? መጀመሪያ ምን ይደረጋል? (የትኞቹ ክፍያዎች እንደሚቆዩና የትኞቹ ገቢዎች እንደሚከታተሉ በሳጥኑ ይጻፉ።)', t:'area',
        picks:[
          { en:'Customer payments come late',         am:'የደንበኞች ክፍያ ይዘገያል' },
          { en:'A big supplier bill',                 am:'ትልቅ የአቅራቢ ሂሳብ' },
          { en:'Salaries fall due',                   am:'ደመወዝ ይደርሳል' },
          { en:'Hold non-essential payments',         am:'አስፈላጊ ያልሆኑ ክፍያዎችን ማቆም' },
          { en:'Chase final payments',                am:'የመጨረሻ ክፍያዎችን መከታተል' },
          { en:'Move a supplier payment later',       am:'የአቅራቢ ክፍያን ወደ ኋላ ማዛወር' }
        ], show:{f:'cf_low', when:'miss'}},
      /* today's balance, plus the four weeks in, less the four weeks out —
         the grids above already hold every figure of it (11 Oct 2026). It
         reads blank until today's balance and both grids are filled. */
      {id:'cf_close', en:'What balance is expected at the end of week 4?', am:'በ4ኛው ሳምንት መጨረሻ ስንት ቀሪ ይጠበቃል?', t:'money',
        auto:{minus:[
          {minus:['cf_open', {plus:[{grid:'cf_out.sup'}, {grid:'cf_out.sal'}, {grid:'cf_out.asm'}, {grid:'cf_out.other'}]}]},
          {minus:[0, {plus:[{grid:'cf_in.adv'}, {grid:'cf_in.final'}, {grid:'cf_in.other'}]}]}
        ]}},
      {id:'cf_last', en:'How close was last week\'s projection to what really happened?', am:'ያለፈው ሳምንት ትንበያ ከሆነው ጋር ምን ያህል ተቀራረበ?', t:'area',
        picks:[
          { en:'Close — no big difference',           am:'ተቀራራቢ ነው — ትልቅ ልዩነት የለም' },
          { en:'Customers paid later than expected',  am:'ደንበኞች ከተጠበቀው ዘግይተው ከፈሉ' },
          { en:'Customers paid more than expected',   am:'ደንበኞች ከተጠበቀው በላይ ከፈሉ' },
          { en:'A bill came that was not planned',    am:'ያልታቀደ ሂሳብ መጣ' },
          { en:'A payment moved to a later week',     am:'ክፍያ ወደ ሌላ ሳምንት ተዛወረ' },
          { en:'The first projection — nothing to compare', am:'የመጀመሪያው ትንበያ ነው — የሚነጻጸር የለም' }
        ]}
    ]},
    { en:'Anything to flag?', am:'የሚያሳስብ ነገር አለ?', fields:[
      {id:'cfw_flags', en:'In these 4 weeks, is there anything to flag?', am:'በእነዚህ 4 ሳምንታት የሚያሳስብ ነገር አለ?', t:'multi',
        none:{ en:'No — the money covers what is due', am:'የለም — ገንዘቡ የሚከፈለውን ይሸፍናል' },
        opts:[
          { v:'short',  en:'A shortfall is expected',          am:'የገንዘብ እጥረት ይጠበቃል' },
          { v:'freeze', en:'Payments should be put on hold',   am:'ክፍያዎች መቆም አለባቸው' }
        ]}
    ]},
    { en:'Shortfall warning', am:'የእጥረት ማስጠንቀቂያ', fields:[
      /* the alert to the Chairman fires on a "yes" here */
      {id:'cf_short', en:'Is a shortfall expected in these 4 weeks?',
       am:'በእነዚህ 4 ሳምንታት የገንዘብ እጥረት ይጠበቃል?', t:'yesno', quiet:1, auto:{picked:'cfw_flags', v:'short'}},
      {id:'cf_short_cause', en:'What is causing it?', am:'ምን ያመጣዋል?', t:'area',
        picks:[
          { en:'Late customer payments',              am:'የዘገየ የደንበኛ ክፍያ' },
          { en:'A big supplier bill',                 am:'ትልቅ የአቅራቢ ሂሳብ' },
          { en:'Payroll',                             am:'ደመወዝ' },
          { en:'Assembler payments',                  am:'የገጣጣሚ ክፍያዎች' },
          { en:'Rent or tax due',                     am:'የሚደርስ ኪራይ ወይም ግብር' }
        ], show:{f:'cf_short', when:'yes'}},
      /* it stood open, and optional, on every week; it opens with the
         shortfall now and is answered then */
      {id:'cf_when', en:'When? (Write how much in the box.)', am:'መቼ? (ምን ያህል እንደሆነ በሳጥኑ ይጻፉ።)', t:'area',
        picks:[
          { en:'Week 1', am:'ሳምንት 1' },
          { en:'Week 2', am:'ሳምንት 2' },
          { en:'Week 3', am:'ሳምንት 3' },
          { en:'Week 4', am:'ሳምንት 4' }
        ], show:{f:'cf_short', when:'yes'}},
      {id:'cf_action', en:'What should be done about it, and by whom?', am:'ምን መደረግ አለበት? በማን?', t:'area', opt:1,
        picks:[
          { en:'Sales chase final payments',          am:'ሽያጭ የመጨረሻ ክፍያዎችን ይከታተል' },
          { en:'Hold non-essential payments',         am:'አስፈላጊ ያልሆኑ ክፍያዎች ይቁሙ' },
          { en:'Move a supplier payment later',       am:'የአቅራቢ ክፍያ ወደ ኋላ ይዛወር' },
          { en:'Ask the group (Kidan) for money',     am:'ከቡድኑ (ከኪዳን) ገንዘብ ይጠየቅ' },
          { en:'The Chairman decides',                am:'ሊቀመንበሩ ይወስናሉ' }
        ], show:{f:'cf_short', when:'yes'}},
      {id:'cf_freeze', en:'Should payments be frozen?', am:'ክፍያዎች መቆም አለባቸው?', t:'yesno', quiet:1, auto:{picked:'cfw_flags', v:'freeze'}},
      {id:'cf_freeze_what', en:'Which payments, from what date, and until what happens? (Write the date in the box.)', am:'የትኞቹ ክፍያዎች? ከየትኛው ቀን ጀምሮ? ምን እስኪሆን ድረስ? (ቀኑን በሳጥኑ ይጻፉ።)', t:'area',
        picks:[
          { en:'Office and other spending',           am:'የቢሮና ሌሎች ወጪዎች' },
          { en:'Supplier payments that can wait',     am:'ሊቆዩ የሚችሉ የአቅራቢ ክፍያዎች' },
          { en:'Until the bank is back above 6 million', am:'የባንክ ቀሪው ከ6 ሚሊዮን በላይ እስኪመለስ' },
          { en:'Until a final payment comes in',      am:'የመጨረሻ ክፍያ እስኪገባ' },
          { en:'Until the Chairman decides',          am:'ሊቀመንበሩ እስኪወስኑ' }
        ], show:{f:'cf_freeze', when:'yes'}},
      {id:'need_chair', en:'Do you need a decision from the Chairman?', am:'የሊቀመንበሩ ውሳኔ ያስፈልግዎታል?', t:'yesno', yes:{en:'I need a decision', am:'ውሳኔ ያስፈልገኛል'}, no:{en:'No decision needed', am:'ውሳኔ አያስፈልገኝም'}},
      {id:'need_chair_what', en:'What should the Chairman decide, and by when? (Write the options in the box.)', am:'ሊቀመንበሩ ምን መወሰን አለባቸው? እስከ መቼ? (አማራጮቹን በሳጥኑ ይጻፉ።)', t:'area',
        picks:[
          { en:'Which bills to pay first',            am:'የትኞቹ ሂሳቦች ቀድመው እንደሚከፈሉ' },
          { en:'Hold payments until the bank recovers', am:'ባንኩ እስኪመለስ ክፍያዎችን ማቆም' },
          { en:'Ask the group for money',             am:'ከቡድኑ ገንዘብ መጠየቅ' },
          { en:'A customer who has not paid',         am:'ያልከፈለ ደንበኛ' },
          { en:'Needed this week',                    am:'በዚህ ሳምንት ያስፈልጋል' },
          { en:'Needed next week',                    am:'በሚቀጥለው ሳምንት ያስፈልጋል' }
        ], show:{f:'need_chair', when:'yes'}}
    ]}
  ]
},

/* ============ BETELHEM — PAYMENT-CONFIRMED JOB LIST ============ */
{
  id:'betty-joblist', person:'betty', cadence:'weekly', dueTime:'13:00', dueDay:6,
  en:'Payment-Confirmed Job List', am:'ክፍያቸው የተረጋገጠ ሥራዎች ዝርዝር',
  toEn:'Mahelet', toAm:'ማህሌት',
  dueEn:'Saturday 1:00 PM', dueAm:'ቅዳሜ ከቀኑ 7፡00 (1:00 PM)',
  penEn:'Not sent by Saturday 1:00 PM –500 Birr',
  penAm:'ቅዳሜ ከቀኑ 7፡00 ካልተላከ –500 ብር',
  derived:1,
  sections:[
    /* REBUILT 11 Oct 2026 (the Chairman: "they are struggling so much with
       the questions"). Never filed yet. Under the list of paid jobs stood
       three questions the list already answers — how many jobs, what
       total, is every one paid in full (its own "Paid in full" column) —
       and two yes/no checks that only matter when something is wrong. Now
       Saturday's list is the jobs, one tap on "nothing else", and a note
       if there is one. The three are worked out from the rows under their
       own keys; the checks are one list ({picked:…}, quiet:1), and the
       held-back list the register reads opens from it. */
    { en:'Jobs cleared for production', am:'ወደ ምርት የሚገቡ ሥራዎች', fields:[
      {id:'jl_jobs', en:'Which jobs are paid in full and cleared for production?', am:'ሙሉ ክፍያ የተከፈለባቸውና ወደ ምርት የሚገቡ ሥራዎች የትኞቹ ናቸው?',
       t:'table', addEn:'Add job', addAm:'ሥራ ጨምር', cols:[
        {id:'code', en:'Job code', am:'የሥራ ኮድ', t:'text'},
        {id:'cust', en:'Customer', am:'ደንበኛ', t:'text'},
        {id:'m2',   en:'m²', am:'ካሬ ሜትር', t:'num'},
        {id:'amt',  en:'Amount received', am:'የገባው ገንዘብ', t:'money'},
        {id:'full', en:'Paid in full', am:'ሙሉ ክፍያ', t:'yesno', yes:{en:'Paid in full', am:'ሙሉ ተከፍሏል'}, no:{en:'Not fully paid', am:'ሙሉ አልተከፈለም'}},
        {id:'date', en:'Date confirmed', am:'የተረጋገጠበት ቀን', t:'text'}
      ]},
      {id:'jl_count', en:'How many jobs are on this list?', am:'በዝርዝሩ ስንት ሥራዎች አሉ?', t:'num',
        auto:{rows:'jl_jobs'}, sumEn:'jobs on the list', sumAm:'በዝርዝሩ ያሉ ሥራዎች'},
      {id:'jl_value', en:'What is the total value confirmed?', am:'ጠቅላላ የተረጋገጠው ዋጋ ስንት ነው?', t:'money',
        auto:{sum:'jl_jobs.amt'}, sumEn:'Birr confirmed', sumAm:'ብር ተረጋግጧል'},
      /* "no" as soon as one row says it is not paid in full */
      {id:'jl_rule', en:'Is every job on this list paid in full, with none partial?',
       am:'በዝርዝሩ ያለ እያንዳንዱ ሥራ ሙሉ ክፍያ ተከፍሎበታል? ከፊል የለም?', t:'yesno', yes:{en:'All paid in full', am:'ሁሉም ሙሉ ተከፍለዋል'}, no:{en:'Some are partly paid', am:'ከፊል የተከፈለ አለ'},
        auto:{all:'jl_jobs.full'}},
      {id:'jl_rule_why', en:'A job on the list is not paid in full. Why is it there? (Write which job in the box.)', am:'በዝርዝሩ ውስጥ ሙሉ ያልተከፈለበት ሥራ አለ። ለምን ገባ? (የትኛው ሥራ እንደሆነ በሳጥኑ ይጻፉ።)', t:'area',
        picks:[
          { en:'The customer promised the rest this week', am:'ደንበኛው ቀሪውን በዚህ ሳምንት ለመክፈል ቃል ገብቷል' },
          { en:'The Chairman allowed it',              am:'ሊቀመንበሩ ፈቅደዋል' },
          { en:'Ephrata asked for it',                 am:'ኤፍራታ ጠይቃለች' },
          { en:'A mistake — it comes off the list',    am:'ስህተት ነው — ከዝርዝሩ ይወጣል' }
        ], show:{f:'jl_rule', when:'no'}}
    ]},
    { en:'Anything else for Mahelet?', am:'ለማህሌት ሌላ የሚነገር ነገር አለ?', fields:[
      {id:'jl_events', en:'Is anything else true of this week\'s payments?', am:'ስለዚህ ሳምንት ክፍያዎች ሌላ የሚነገር ነገር አለ?', t:'multi',
        none:{ en:'No — every payment is in the bank and no job is held back', am:'የለም — ሁሉም ክፍያ ባንክ ገብቷል፤ የቆመ ሥራ የለም' },
        opts:[
          { v:'not_bank', en:'A payment on this list is not seen in the bank yet', am:'በዝርዝሩ ያለ ክፍያ ገና ባንክ ውስጥ አልታየም' },
          { v:'held',     en:'A job is held back because its payment is not complete', am:'ክፍያው ስላልተጠናቀቀ የቆመ ሥራ አለ' }
        ]}
    ]},
    { en:'Seen in the bank', am:'በባንክ የታየ', fields:[
      {id:'jl_bank', en:'Was every payment on this list checked in the bank, not only on a receipt?', am:'በዝርዝሩ ያለ እያንዳንዱ ክፍያ በደረሰኝ ብቻ ሳይሆን በባንክ ተረጋግጧል?', t:'yesno', quiet:1, auto:{picked:'jl_events', v:'not_bank', flip:1}},
      {id:'jl_bank_why', en:'A payment is not seen in the bank yet. When will it be checked? (Write which in the box.)', am:'ገና በባንክ ያልታየ ክፍያ አለ። መቼ ይረጋገጣል? (የትኛው እንደሆነ በሳጥኑ ይጻፉ።)', t:'area',
        picks:[
          { en:'Paid by cheque — not cleared yet',     am:'በቼክ ተከፍሏል — ገና አልተመነዘረም' },
          { en:'The transfer is not showing yet',      am:'ዝውውሩ ገና አይታይም' },
          { en:'A receipt only so far',                am:'እስካሁን ደረሰኝ ብቻ ነው ያለው' },
          { en:'Will be checked on Monday',            am:'ሰኞ ይረጋገጣል' }
        ], show:{f:'jl_bank', when:'no'}}
    ]},
    { en:'Jobs held back', am:'የቆሙ ሥራዎች', fields:[
      {id:'jl_held_any', en:'Is any job held back because payment is incomplete?', am:'ክፍያው ባልተጠናቀቀ ምክንያት የቆመ ሥራ አለ?', t:'yesno', quiet:1, auto:{picked:'jl_events', v:'held'}},
      /* the register and the Group CFO's "money due in" read these rows */
      {id:'jl_held_list', en:'Which jobs are held back?', am:'የቀሩት የትኞቹ ሥራዎች ናቸው?', t:'table', addEn:'Add job', addAm:'ሥራ ጨምር',
        show:{f:'jl_held_any', when:'yes'},
        cols:[
          {id:'code', en:'Job code', am:'የሥራ ኮድ', t:'text'},
          {id:'cust', en:'Customer', am:'ደንበኛ', t:'text'},
          {id:'owed', en:'Still owed', am:'ቀሪ ዕዳ', t:'money'},
          {id:'asked', en:'Final request sent on', am:'የመጨረሻ ክፍያ ጥያቄ የተላከበት ቀን', t:'text'},
          {id:'expect', en:'Payment expected on', am:'ክፍያው የሚጠበቅበት ቀን', t:'text'}
        ]},
      {id:'jl_held', en:'How many jobs are held back because payment is incomplete?',
       am:'ክፍያቸው ስላልተጠናቀቀ ስንት ሥራዎች ቀሩ?', t:'num',
        auto:{rows:'jl_held_list'}, sumEn:'held back', sumAm:'ቆመዋል'}
    ]},
    { en:'Note for Mahelet', am:'ለማህሌት ማስታወሻ', fields:[
      {id:'jl_note', en:'Anything Mahelet should know?', am:'ማህሌት ልታውቀው የሚገባ ነገር አለ?', t:'area', opt:1,
        picks:[
          { en:'A customer is pressing for a date',    am:'ቀን የሚጠይቅ ደንበኛ አለ' },
          { en:'A job was paid late in the week',      am:'በሳምንቱ መጨረሻ የተከፈለ ሥራ አለ' },
          { en:'A big job comes next week',            am:'በሚቀጥለው ሳምንት ትልቅ ሥራ ይመጣል' },
          { en:'A payment is promised for Monday',     am:'ሰኞ ለመክፈል ቃል የተገባ ክፍያ አለ' }
        ]}
    ]}
  ]
},

/* ========== BETELHEM — DAILY 7-DAY CASH FLOW FORECAST (9:00 AM) ========== */
{
  id:'betty-forecast', person:'betty', cadence:'daily', dueTime:'09:00',
  en:'Daily 7-Day Cash Flow Forecast', am:'ዕለታዊ የ7 ቀን የገንዘብ ፍሰት ትንበያ',
  toEn:'Chairman + Kidan', toAm:'ሊቀመንበር + ኪዳን',
  dueEn:'9:00 AM every working day', dueAm:'በየሥራ ቀኑ ከጠዋቱ 3፡00 (9:00 AM)',
  penEn:'Late –200 Birr · Missing –500 Birr · Shortfall not flagged in advance –2,000 Birr',
  penAm:'ዘግይቶ –200 ብር · ካልቀረበ –500 ብር · እጥረት አስቀድሞ ካልተነገረ –2,000 ብር',
  derived:1,
  sections:[
    /* REBUILT 11 Oct 2026 (the Chairman: "they are struggling so much with
       the questions"). Never filed yet. It asked 17 questions every morning
       before 9:00, among them four yes/no answers that are one thing seen
       four ways (is money short, does it cover what is due, should payments
       stop, has the Chairman been told) and two figures a list beside them
       already held (the total due today, how many need Kidan). Now a normal
       morning is the date, the bank, the seven days, what changed, what is
       due today and one tap on "nothing to flag". The flags are one list;
       cf7_short, cf7_cover and cf7_freeze — which the morning alert and the
       Group CFO read — are worked out from it under their own keys
       ({picked:…}, quiet:1). The seven-day grid stays on calendar days
       (dateFrom), as it was. */
    { en:'This morning', am:'የዛሬ ጠዋት ሁኔታ', fields:[
      {id:'cf7_date', en:'What day does this forecast start?', am:'ትንበያው ከየትኛው ቀን ይጀምራል?', t:'date'},
      /* The morning bank balance went on 16 Oct 2026, with "has the Chairman
         been told" and why, and the ZamZam line: the owner gives the balance
         on WhatsApp (apps-script/Bank.js) — the user: "I report the bank
         balance, not Finance". */
      /* nothing reads this; the evening report has the cash on hand */
      {id:'cf7_cash', en:'How much cash is on hand? (If you counted it.)', am:'በእጅ ስንት ጥሬ ገንዘብ አለ? (ከቆጠሩ።)', t:'money', opt:1}
    ]},
    { en:'The next 7 days', am:'የሚቀጥሉት 7 ቀናት', fields:[
      /* the Group CFO reads every row of this grid — the lowest close, the
         first day under 6,000,000, the money in and out */
      {id:'cf7_days', en:'For each of the next 7 days: how much comes in, how much goes out, and what is left? Your best guess is fine.', am:'ለሚቀጥሉት 7 ቀናት በየቀኑ፦ ስንት ይገባል? ስንት ይወጣል? ስንት ይቀራል? ግምትዎ በቂ ነው።',
       t:'grid', dateFrom:'cf7_date',
       rows:[{en:'Day 1', am:'ቀን 1'},{en:'Day 2', am:'ቀን 2'},{en:'Day 3', am:'ቀን 3'},
             {en:'Day 4', am:'ቀን 4'},{en:'Day 5', am:'ቀን 5'},{en:'Day 6', am:'ቀን 6'},
             {en:'Day 7', am:'ቀን 7'}],
       cols:[
        {id:'in',    en:'Expected in', am:'የሚጠበቅ ገቢ', t:'money'},
        {id:'out',   en:'Expected out', am:'የሚጠበቅ ወጪ', t:'money'},
        {id:'close', en:'Closing balance', am:'የቀኑ መጨረሻ ቀሪ', t:'money'}
      ]},
      {id:'cf7_low', en:'What is the lowest balance in the next 7 days?', am:'በሚቀጥሉት 7 ቀናት ዝቅተኛው ቀሪ ስንት ነው?', t:'money',
        tgt:{op:'gte', v:6000000, en:'Below the 6 Million Birr reserve',
             am:'ከ6 ሚሊዮን ብር መጠባበቂያ በታች'}},
      /* the day is in the grid above; it is asked again only when it matters */
      {id:'cf7_lowday', en:'On which day does it go below?', am:'በየትኛው ቀን ነው የሚወርደው?', t:'text', i:1,
        show:{f:'cf7_low', when:'miss'}},
      {id:'cf7_low_why', en:'Which payments push it below 6,000,000 Birr, and which of them can wait? (Write them in the box.)', am:'ከ6,000,000 ብር በታች የሚያወርዱት የትኞቹ ክፍያዎች ናቸው? ከእነሱ የትኞቹ ሊቆዩ ይችላሉ? (በሳጥኑ ይጻፉ።)', t:'area',
        picks:[
          { en:'Supplier payments',                      am:'የአቅራቢ ክፍያዎች' },
          { en:'Salaries',                               am:'ደመወዝ' },
          { en:'Assembler payments',                     am:'የገጣጣሚ ክፍያዎች' },
          { en:'Rent or tax',                            am:'ኪራይ ወይም ግብር' },
          { en:'Supplier payments can wait',             am:'የአቅራቢ ክፍያዎች ሊቆዩ ይችላሉ' },
          { en:'Nothing can wait',                       am:'ሊቆይ የሚችል የለም' }
        ], show:{f:'cf7_low', when:'miss'}},
      {id:'cf7_change', en:'What changed since yesterday\'s forecast?', am:'ከትናንቱ ትንበያ ምን ተለወጠ?', t:'area',
        picks:[
          { en:'Nothing changed',                        am:'ምንም አልተለወጠም' },
          { en:'A customer paid',                        am:'ደንበኛ ከፈለ' },
          { en:'A customer payment moved later',         am:'የደንበኛ ክፍያ ወደ ኋላ ተገፋ' },
          { en:'A new supplier bill came',               am:'አዲስ የአቅራቢ ሂሳብ መጣ' },
          { en:'A payment moved to another day',         am:'ክፍያ ወደ ሌላ ቀን ተዛወረ' },
          { en:'Salaries added',                         am:'ደመወዝ ተጨመረ' },
          { en:'The first forecast this week',           am:'የዚህ ሳምንት የመጀመሪያው ትንበያ ነው' }
        ]}
    ]},
    { en:'Due today', am:'ዛሬ የሚከፈሉ', fields:[
      {id:'cf7_due_any', en:'Is any payment due today?', am:'ዛሬ የሚከፈል ክፍያ አለ?', t:'yesno', yes:{en:'Payments are due today', am:'ዛሬ የሚከፈል አለ'}, no:{en:'Nothing due today', am:'ዛሬ የሚከፈል የለም'}},
      {id:'cf7_due_list', en:'Which payments are due today?', am:'ዛሬ የሚከፈሉት የትኞቹ ክፍያዎች ናቸው?', t:'table', addEn:'Add a payment', addAm:'ክፍያ ጨምር',
        show:{f:'cf7_due_any', when:'yes'},
        cols:[
          {id:'to', en:'Paid to', am:'ተከፋይ', t:'text'},
          {id:'for', en:'For', am:'ለምን', t:'text'},
          {id:'amount', en:'Amount', am:'መጠን', t:'money'},
          {id:'ready', en:'Funds ready', am:'ገንዘቡ ዝግጁ ነው', t:'yesno', yes:{en:'Ready', am:'ዝግጁ ነው'}, no:{en:'Not ready', am:'ዝግጁ አይደለም'}}
        ]},
      {id:'cf7_due', en:'How many payments are due today?', am:'ዛሬ ስንት ክፍያዎች ይከፈላሉ?', t:'num',
        auto:{rows:'cf7_due_list'}, sumEn:'due today', sumAm:'ዛሬ የሚከፈሉ'},
      /* both were typed beside the list that already holds them, and both
         were asked even on a morning with nothing due (11 Oct 2026) */
      {id:'cf7_due_val', en:'What is the total due today?', am:'የዛሬው ክፍያ በጠቅላላ ስንት ነው?', t:'money',
        auto:{sum:'cf7_due_list.amount'}, sumEn:'Birr due', sumAm:'ብር የሚከፈል'},
      {id:'cf7_kidan', en:'How many of them need Kidan\'s approval?', am:'ከነዚህ ስንቱ የኪዳን ፈቃድ ያስፈልጋቸዋል?', t:'num',
        auto:{rows:'cf7_due_list', when:{col:'amount', gte:50001}}, sumEn:'over 50,000 — need Kidan', sumAm:'ከ50,000 በላይ — የኪዳን ፈቃድ'},
      {id:'cf7_kidan_state', en:'Payments over 50,000 due today: has Kidan approved each? (Write which ones in the box.)', am:'ዛሬ የሚከፈሉ ከ50,000 በላይ ክፍያዎች፦ እያንዳንዱ በኪዳን ጸድቋል? (የትኞቹ እንደሆኑ በሳጥኑ ይጻፉ።)', t:'area',
        picks:[
          { en:'All approved by Kidan',                  am:'ሁሉም በኪዳን ጸድቀዋል' },
          { en:'Some are still waiting for Kidan',       am:'አንዳንዶቹ የኪዳንን ፈቃድ እየጠበቁ ነው' },
          { en:'One was not approved',                   am:'አንዱ አልተፈቀደም' }
        ], show:{f:'cf7_kidan', when:'pos'}}
    ]},
    { en:'Anything to flag?', am:'የሚያሳስብ ነገር አለ?', fields:[
      {id:'fc_flags', en:'In the next 7 days, is there anything to flag?', am:'በሚቀጥሉት 7 ቀናት የሚያሳስብ ነገር አለ?', t:'multi',
        none:{ en:'No — what comes in covers what goes out', am:'የለም — የሚገባው የሚወጣውን ይሸፍናል' },
        opts:[
          { v:'out_more', en:'More will go out than comes in',                     am:'ከሚገባው የሚወጣው ይበልጣል' },
          { v:'short',    en:'Money will run short — a payment due cannot be made', am:'ገንዘብ ይጎድላል — የሚደርስ ክፍያ መክፈል አይቻልም' },
          { v:'freeze',   en:'Non-essential payments should be put on hold',       am:'አስፈላጊ ያልሆኑ ክፍያዎች መቆም አለባቸው' }
        ]}
    ]},
    { en:'Shortfall warning', am:'የእጥረት ማስጠንቀቂያ', fields:[
      {id:'cf7_cover', en:'Does the money expected cover everything due?', am:'የሚጠበቀው ገንዘብ የሚከፈለውን ሁሉ ይሸፍናል?', t:'yesno', quiet:1, auto:{picked:'fc_flags', v:'out_more', flip:1}},
      {id:'cf7_cover_why', en:'More goes out than comes in. How will it be covered? (Write what and how much in the box.)', am:'ከሚገባው የሚወጣው ይበልጣል። እንዴት ይሸፈናል? (ምንና ምን ያህል እንደሆነ በሳጥኑ ይጻፉ።)', t:'area',
        picks:[
          { en:'From the bank balance',                  am:'ከባንክ ቀሪው' },
          { en:'By chasing final payments',              am:'የመጨረሻ ክፍያዎችን በመከታተል' },
          { en:'A supplier payment moves to next week',  am:'የአቅራቢ ክፍያ ወደ ሚቀጥለው ሳምንት ይዛወራል' },
          { en:'By asking the group (Kidan) for money',  am:'ከቡድኑ (ከኪዳን) ገንዘብ በመጠየቅ' }
        ], show:{f:'cf7_cover', when:'no'}},
      /* the 7:00 alert fires on a "yes" here, with the amount below; the
         letter fines a shortfall not flagged in advance (–2,000) */
      {id:'cf7_short', en:'Is a shortfall expected in these 7 days?', am:'በእነዚህ 7 ቀናት የገንዘብ እጥረት ይጠበቃል?', t:'yesno', quiet:1, auto:{picked:'fc_flags', v:'short'}},
      {id:'cf7_amount', en:'How much short?', am:'ምን ያህል ይጎድላል?', t:'money', show:{f:'cf7_short', when:'yes'}},
      {id:'cf7_action', en:'What should be done, and by whom?', am:'ምን መደረግ አለበት? በማን?', t:'area', opt:1,
        picks:[
          { en:'Sales chase final payments',             am:'ሽያጭ የመጨረሻ ክፍያዎችን ይከታተል' },
          { en:'Hold non-essential payments',            am:'አስፈላጊ ያልሆኑ ክፍያዎች ይቁሙ' },
          { en:'Move a supplier payment later',          am:'የአቅራቢ ክፍያ ወደ ኋላ ይዛወር' },
          { en:'Ask the group (Kidan) for money',        am:'ከቡድኑ (ከኪዳን) ገንዘብ ይጠየቅ' },
          { en:'The Chairman decides',                   am:'ሊቀመንበሩ ይወስናሉ' }
        ], show:{f:'cf7_short', when:'yes'}},
      {id:'cf7_freeze', en:'Should non-essential payments be frozen?', am:'አስፈላጊ ያልሆኑ ክፍያዎች መቆም አለባቸው?', t:'yesno', quiet:1, auto:{picked:'fc_flags', v:'freeze'}},
      {id:'cf7_freeze_what', en:'Which payments, and until when? (Write them in the box.)', am:'የትኞቹ ክፍያዎች? እስከ መቼ? (በሳጥኑ ይጻፉ።)', t:'area',
        picks:[
          { en:'Office and other spending',              am:'የቢሮና ሌሎች ወጪዎች' },
          { en:'Supplier payments that can wait',        am:'ሊቆዩ የሚችሉ የአቅራቢ ክፍያዎች' },
          { en:'Until the bank is back above 6 million', am:'የባንክ ቀሪው ከ6 ሚሊዮን በላይ እስኪመለስ' },
          { en:'Until a final payment comes in',         am:'የመጨረሻ ክፍያ እስኪገባ' },
          { en:'Until the Chairman decides',             am:'ሊቀመንበሩ እስኪወስኑ' }
        ], show:{f:'cf7_freeze', when:'yes'}}
    ]}
  ]
},

/* ============ BETELHEM — DAILY CUSTOMER PULSE REPORT (6:00 PM) ============ */
{
  id:'betty-pulse', person:'betty', cadence:'daily', dueTime:'18:00',
  en:'Daily Customer Pulse Report', am:'ዕለታዊ የደንበኛ ስሜት ሪፖርት',
  toEn:'Chairman + Ephrata + Kidan', toAm:'ሊቀመንበር + ኤፍራታ + ኪዳን',
  dueEn:'6:00 PM every working day', dueAm:'በየሥራ ቀኑ ከምሽቱ 12፡00 (6:00 PM)',
  penEn:'Late –200 Birr · Missing –500 Birr · Complaint not reported same day –500 Birr',
  penAm:'ዘግይቶ –200 ብር · ካልቀረበ –500 ብር · ቅሬታ በዕለቱ ካልተነገረ –500 ብር',
  derived:1,
  sections:[
    /* REBUILT 11 Oct 2026 (the Chairman: "they are struggling so much with
       the questions"). Never filed yet. 19 questions stood on screen at
       6:00 PM, the complaint list among them on a day with no complaint,
       a "who is at risk" box open on a day nobody was, and two counts of
       issues passed on that are nought most days. Now a normal day is who
       prepared it, the groups, the calls, how many sound happy, one tap on
       "nothing else", and tomorrow's customer. Everything that only happens
       some days — a customer unhappy, gone quiet, at risk, a complaint, an
       issue passed on — is one list, and only what is tapped is asked.
       pl_sameday, which the rulebook fines on a "no" (–500), and pl_risk,
       which the customer reader counts, are worked out from it under their
       own keys ({picked:…}, quiet:1); the counts file a real 0 (zero:1). */
    { en:'Who prepared it', am:'ያዘጋጀው', fields:[
      {id:'pl_by', en:'Who prepared today\'s pulse?', am:'የዛሬውን ሪፖርት ያዘጋጀው ማን ነው?', t:'choice', opts:[
        {v:'finance', en:'Selam', am:'ሰላም'},
        {v:'seble', en:'Seble', am:'ሰብለ'}]},
      {id:'pl_by_checked', en:'Did Selam check Seble\'s work before it was sent?', am:'የሰብለ ሥራ ከመላኩ በፊት በሰላም ተረጋግጧል?', t:'yesno', yes:{en:'Checked', am:'ተረጋግጧል'}, no:{en:'Not checked', am:'አልተረጋገጠም'}, show:{f:'pl_by', when:'is', v:'seble'}}
    ]},
    { en:'Groups read today', am:'ዛሬ የተነበቡ ግሩፖች', fields:[
      {id:'pl_groups', en:'How many customer groups are active?', am:'ስንት የደንበኛ ግሩፖች ንቁ ናቸው?', t:'num'},
      {id:'pl_checked', en:'How many groups were read today? (read / active)', am:'ዛሬ ስንት ግሩፖች ተነበቡ? (የተነበቡ / ንቁ)', t:'ratio', ask:{b:{en:"How many customer groups are active?", am:"ስንት የደንበኛ ግሩፖች ንቁ ናቸው?"}, a:{en:"How many of them were read today?", am:"ከእነሱ ስንቱ ዛሬ ተነበቡ?"}}, auto:{b:{of:'pl_groups'}}},
      {id:'pl_checked_why', en:'Not every group was read. Why, and when will they be? (Write which groups in the box.)', am:'ሁሉም ግሩፖች አልተነበቡም። ለምን? መቼ ይነበባሉ? (የትኞቹ ግሩፖች እንደሆኑ በሳጥኑ ይጻፉ።)', t:'area',
        picks:[
          { en:'No time today',                       am:'ዛሬ ጊዜ አልነበረም' },
          { en:'No network',                          am:'ኔትወርክ አልነበረም' },
          { en:'Seble was absent',                    am:'ሰብለ አልነበረችም' },
          { en:'Will read them tomorrow morning',     am:'ነገ ጠዋት ይነበባሉ' }
        ], show:{f:'pl_checked', when:'short'}},
      {id:'pl_called', en:'How many customers did you speak to directly today?', am:'ዛሬ ስንት ደንበኞችን በቀጥታ አነጋገሩ?', t:'num'}
    ]},
    { en:'How customers sound', am:'የደንበኞች ስሜት', fields:[
      {id:'pl_happy', en:'How many customers sound satisfied?', am:'ስንት ደንበኞች የረኩ ይመስላሉ?', t:'num'}
    ]},
    { en:'Anything else today?', am:'ዛሬ ሌላ የሆነ ነገር አለ?', fields:[
      {id:'pl_events', en:'What else happened with customers today?', am:'ዛሬ ከደንበኞች ጋር ሌላ ምን ሆነ?', t:'multi',
        none:{ en:'Nothing — a normal day', am:'ምንም — የተለመደ ቀን' },
        groups:[
          { v:'sound', en:'How customers sound', am:'የደንበኞች ስሜት' },
          { v:'comp',  en:'Complaints',          am:'ቅሬታዎች' },
          { v:'pass',  en:'Passed on',           am:'የተላለፉ ጉዳዮች' }
        ],
        opts:[
          { v:'unhappy',   g:'sound', en:'A customer sounded unhappy',                  am:'ያልረካ የሚመስል ደንበኛ ነበር' },
          { v:'silent',    g:'sound', en:'A customer has gone quiet for 3 days or more', am:'ከ3 ቀን በላይ ዝም ያለ ደንበኛ አለ' },
          { v:'risk',      g:'sound', en:'A customer may cancel',                       am:'ውል ሊያቋርጥ የሚችል ደንበኛ አለ' },
          { v:'complaint', g:'comp',  en:'A customer complained today',                 am:'ዛሬ ቅሬታ ያቀረበ ደንበኛ ነበር' },
          { v:'not_told',  g:'comp',  en:'A complaint was not passed on the same day',  am:'በዕለቱ ያልተነገረ ቅሬታ ነበር' },
          { v:'open_old',  g:'comp',  en:'Complaints from earlier days are still open', am:'ከቀደሙት ቀናት ያልተፈቱ ቅሬታዎች አሉ' },
          { v:'to_eph',    g:'pass',  en:'An issue was passed to Ephrata',              am:'ለኤፍራታ የተላለፈ ጉዳይ ነበር' },
          { v:'to_mah',    g:'pass',  en:'An issue was passed to Mahelet',              am:'ለማህሌት የተላለፈ ጉዳይ ነበር' }
        ]}
    ]},
    { en:'Unhappy, quiet or at risk', am:'ያልረኩ፣ ዝም ያሉ ወይም ሊያቋርጡ የሚችሉ', fields:[
      {id:'pl_unhappy_any', en:'Did any of them sound unhappy?', am:'ካልረኩት ውስጥ የሆነ አለ?', t:'yesno', quiet:1, auto:{picked:'pl_events', v:'unhappy'}},
      {id:'pl_unhappy_who', en:'Who sounded unhappy, and why?', am:'ያልረካው ማን ነው? ለምን?', t:'table', addEn:'Add customer', addAm:'ደንበኛ ጨምር',
        show:{f:'pl_unhappy_any', when:'yes'},
        cols:[
          {id:'cust', en:'Customer', am:'ደንበኛ', t:'text'},
          {id:'job', en:'Job code', am:'የሥራ ኮድ', t:'text'},
          {id:'why', en:'Why', am:'ለምን', t:'text', picks:COL_COMPLAINT},
          {id:'next', en:'Next step', am:'ቀጣይ እርምጃ', t:'text', picks:[{ en:'Call back today', am:'ዛሬ መልሶ መደወል' }, { en:'Passed to Ephrata', am:'ለኤፍራታ ተላልፏል' }, { en:'Passed to Mahelet', am:'ለማህሌት ተላልፏል' }, { en:'Visit the customer', am:'ደንበኛውን መጎብኘት' }]}
        ]},
      {id:'pl_unhappy', en:'How many sound unhappy?', am:'ስንቱ ያልረኩ ይመስላሉ?', t:'num',
        auto:{rows:'pl_unhappy_who'}, sumEn:'sound unhappy', sumAm:'ያልረኩ'},
      {id:'pl_silent', en:'How many customers have gone quiet for 3 days or more?',
       am:'ከ3 ቀናት በላይ ዝም ያሉ ደንበኞች ስንት ናቸው?', t:'num', zero:1,
        show:{f:'pl_events', when:'has', v:'silent'}},
      {id:'pl_silent_who', en:'Where are their jobs, and who calls them tomorrow? (Write who they are in the box.)', am:'ሥራቸው የት ደርሷል? ነገ ማን ይደውልላቸዋል? (እነማን እንደሆኑ በሳጥኑ ይጻፉ።)', t:'area',
        picks:[
          { en:'Job waiting for installation',        am:'ሥራው ተከላ እየጠበቀ ነው' },
          { en:'Job in production',                   am:'ሥራው በምርት ላይ ነው' },
          { en:'Waiting for the final payment',       am:'የመጨረሻ ክፍያ እየተጠበቀ ነው' },
          { en:'Sales will call tomorrow',            am:'ሽያጭ ነገ ይደውላል' },
          { en:'Ephrata will call tomorrow',          am:'ኤፍራታ ነገ ትደውላለች' },
          { en:'Selam will call tomorrow',            am:'ሰላም ነገ ትደውላለች' }
        ], show:{f:'pl_silent', when:'pos'}},
      {id:'pl_risk', en:'Is any customer at risk of cancelling?', am:'ውል ሊያቋርጥ የሚችል ደንበኛ አለ?', t:'yesno', quiet:1, auto:{picked:'pl_events', v:'risk'}},
      /* it stood open on every day, at risk or not; now it opens with the
         risk, and is answered then */
      {id:'pl_risk_who', en:'Why might they cancel? (Write the customer and how much of the contract is at stake in the box.)', am:'ለምን ሊያቋርጡ ይችላሉ? (ደንበኛውንና ስንት ብር የሚያወጣ ውል አደጋ ላይ እንዳለ በሳጥኑ ይጻፉ።)', t:'area',
        picks:[
          { en:'Delays',                              am:'መዘግየት' },
          { en:'A quality problem',                   am:'የጥራት ችግር' },
          { en:'Price or payment dispute',            am:'የዋጋ ወይም የክፍያ ክርክር' },
          { en:'A bad time with the site team',       am:'ከተከላ ቡድኑ ጋር የነበረ መጥፎ ገጠመኝ' },
          { en:'Found a cheaper offer',               am:'የቀነሰ ዋጋ አግኝተዋል' }
        ], show:{f:'pl_risk', when:'yes'}},
      {id:'pl_risk_save', en:'What is being done to keep them, and by when? (Write by whom in the box.)', am:'ደንበኛውን ለማቆየት ምን እየተደረገ ነው? እስከ መቼ? (በማን እንደሆነ በሳጥኑ ይጻፉ።)', t:'area',
        picks:[
          { en:'Ephrata will call them',              am:'ኤፍራታ ትደውልላቸዋለች' },
          { en:'The Chairman will call them',         am:'ሊቀመንበሩ ይደውሉላቸዋል' },
          { en:'A fix is planned',                    am:'ማስተካከያ ታቅዷል' },
          { en:'A new date was given',                am:'አዲስ ቀን ተሰጥቷል' },
          { en:'A discount offered — needs approval', am:'ቅናሽ ቀርቧል — ፈቃድ ያስፈልገዋል' },
          { en:'This week',                           am:'በዚህ ሳምንት' }
        ], show:{f:'pl_risk', when:'yes'}}
    ]},
    { en:'Complaints today', am:'የዛሬ ቅሬታዎች', fields:[
      /* the complaint router, the register and the customer reader all read
         these rows; it opens on the tap, as it is only filled on a day with
         a complaint */
      {id:'pl_list', en:'List every complaint raised today', am:'ዛሬ የቀረቡትን ቅሬታዎች በሙሉ ይዘርዝሩ',
       t:'table', addEn:'Add complaint', addAm:'ቅሬታ ጨምር', show:{f:'pl_events', when:'has', v:'complaint'}, cols:[
        {id:'cust',  en:'Customer', am:'ደንበኛ', t:'text'},
        {id:'job',   en:'Job code', am:'የሥራ ኮድ', t:'text'},
        {id:'issue', en:'What about', am:'ስለ ምን', t:'text', picks:COL_COMPLAINT},
        {id:'to',    en:'Passed to', am:'የተላለፈለት', t:'text'},
        {id:'state', en:'Status', am:'ሁኔታ', t:'choice', opts:[
          {v:'open',   en:'Open', am:'ክፍት'},
          {v:'working',en:'Being worked on', am:'በሥራ ላይ'},
          {v:'closed', en:'Resolved', am:'ተፈቷል'}]}
      ]},
      {id:'pl_sameday', en:'Was every complaint reported the same day?',
       am:'እያንዳንዱ ቅሬታ በዕለቱ ተነግሯል?', t:'yesno', quiet:1, auto:{picked:'pl_events', v:'not_told', flip:1}},
      {id:'pl_sameday_why', en:'A complaint was not passed on today. Why? (Write which complaint in the box.)', am:'ዛሬ ያልተነገረ ቅሬታ አለ። ለምን? (የትኛው ቅሬታ እንደሆነ በሳጥኑ ይጻፉ።)', t:'area',
        picks:[
          { en:'Heard about it late',                 am:'ዘግይቶ ነው የታወቀው' },
          { en:'Too much work today',                 am:'ዛሬ ሥራ በዛ' },
          { en:'Seble did not pass it on',            am:'ሰብለ አላስተላለፈችም' },
          { en:'Forgot',                              am:'ተረስቷል' }
        ], show:{f:'pl_sameday', when:'no'}},
      {id:'pl_open', en:'How many complaints from earlier days are still open?',
       am:'ከቀደሙት ቀናት ስንት ቅሬታዎች ገና አልተፈቱም?', t:'num', zero:1,
        show:{f:'pl_events', when:'has', v:'open_old'}},
      {id:'pl_open_why', en:'What are the oldest waiting for? (Write which, and who holds each, in the box.)', am:'በጣም የቆዩት ምን እየጠበቁ ነው? (የትኞቹ እንደሆኑና እያንዳንዱን ማን እንደያዘው በሳጥኑ ይጻፉ።)', t:'area',
        picks:[
          { en:'Waiting for the factory',             am:'ፋብሪካውን እየጠበቀ ነው' },
          { en:'Waiting for the site team',           am:'የተከላ ቡድኑን እየጠበቀ ነው' },
          { en:'Waiting for a part or material',      am:'መለዋወጫ ወይም ዕቃ እየጠበቀ ነው' },
          { en:'Waiting for the customer',            am:'ደንበኛውን እየጠበቀ ነው' },
          { en:'Waiting for a decision',              am:'ውሳኔ እየጠበቀ ነው' }
        ], show:{f:'pl_open', when:'pos'}}
    ]},
    { en:'What customers said', am:'ደንበኞች ያሉት', fields:[
      {id:'pl_good', en:'What did customers praise today?', am:'ዛሬ ደንበኞች ምን አደነቁ?', t:'area', opt:1,
        picks:[
          { en:'The quality',                         am:'ጥራቱን' },
          { en:'On-time installation',                am:'በሰዓቱ የተደረገውን ተከላ' },
          { en:'The site team',                       am:'የተከላ ቡድኑን' },
          { en:'The design',                          am:'ዲዛይኑን' },
          { en:'Quick answers',                       am:'ፈጣን ምላሽን' }
        ]},
      {id:'pl_bad', en:'What did customers complain about?', am:'ደንበኞች ምን ላይ አማረሩ?', t:'area', opt:1,
        picks:[
          { en:'Delays',                              am:'መዘግየት' },
          { en:'Installation problems',               am:'የተከላ ችግሮች' },
          { en:'Quality or damage',                   am:'ጥራት ወይም ጉዳት' },
          { en:'Slow answers',                        am:'የዘገየ ምላሽ' },
          { en:'Measurement mistakes',                am:'የልኬት ስህተት' },
          { en:'Price or payment',                    am:'ዋጋ ወይም ክፍያ' }
        ]}
    ]},
    { en:'Passed on, and tomorrow', am:'የተላለፉ ጉዳዮችና ነገ', fields:[
      {id:'pl_to_eph', en:'How many issues were passed to Ephrata today?', am:'ዛሬ ስንት ጉዳዮች ለኤፍራታ ተላለፉ?', t:'num', zero:1,
        show:{f:'pl_events', when:'has', v:'to_eph'}},
      {id:'pl_to_mah', en:'How many were passed to Mahelet today?', am:'ዛሬ ስንቱ ለማህሌት ተላለፉ?', t:'num', zero:1,
        show:{f:'pl_events', when:'has', v:'to_mah'}},
      {id:'pl_chair', en:'Do you need a decision from the Chairman?', am:'የሊቀመንበሩ ውሳኔ ያስፈልግዎታል?', t:'yesno', yes:{en:'I need a decision', am:'ውሳኔ ያስፈልገኛል'}, no:{en:'No decision needed', am:'ውሳኔ አያስፈልገኝም'}},
      {id:'pl_what', en:'What should the Chairman decide, and by when? (Write the options in the box.)', am:'ሊቀመንበሩ ምን መወሰን አለባቸው? እስከ መቼ? (አማራጮቹን በሳጥኑ ይጻፉ።)', t:'area',
        picks:[
          { en:'A refund or a discount',              am:'ገንዘብ መመለስ ወይም ቅናሽ' },
          { en:'A new date for a customer',           am:'ለደንበኛ አዲስ ቀን' },
          { en:'Who pays for a fix',                  am:'ማስተካከያውን ማን እንደሚከፍል' },
          { en:'A customer who may cancel',           am:'ውል ሊያቋርጥ የሚችል ደንበኛ' },
          { en:'Needed today',                        am:'ዛሬ ያስፈልጋል' },
          { en:'Needed this week',                    am:'በዚህ ሳምንት ያስፈልጋል' }
        ], show:{f:'pl_chair', when:'yes'}},
      {id:'pl_tomorrow', en:'Which customer needs the most attention tomorrow, and why? (Write the name in the box.)', am:'ነገ በጣም ትኩረት የሚያስፈልገው ደንበኛ ማን ነው? ለምን? (ስሙን በሳጥኑ ይጻፉ።)', t:'area',
        picks:[
          { en:'Complained today',                    am:'ዛሬ ቅሬታ አቅርቧል' },
          { en:'Has gone quiet',                      am:'ዝም ብሏል' },
          { en:'May cancel',                          am:'ውል ሊያቋርጥ ይችላል' },
          { en:'Installation tomorrow',               am:'ነገ ተከላ አለው' },
          { en:'Final payment due',                   am:'የመጨረሻ ክፍያው ደርሷል' },
          { en:'Waiting for a fix',                   am:'ማስተካከያ እየጠበቀ ነው' }
        ]}
    ]}
  ]
},


/* ======================= AMAHA — DAILY PRODUCTION ======================= */
{
  id:'amaha-daily', person:'amaha', cadence:'daily', dueTime:'17:30',
  en:'Daily Production Report', am:'ዕለታዊ የምርት ሪፖርት',
  toEn:'Mahelet + Ephrata', toAm:'ማህሌት + ኤፍራታ',
  dueEn:'5:30 PM every working day', dueAm:'በየሥራ ቀኑ ከቀኑ 11፡30 (5:30 PM)',
  penEn:'Late –200 Birr · Missing –500 Birr', penAm:'ዘግይቶ –200 ብር · ካልተላከ –500 ብር',
  sections:[
    /* REBUILT 11 Oct 2026 (the Chairman: "they are struggling so much with
       the questions"). Amaha's first two reports left 34 of 41 and 29 of 48
       questions empty: he filled the jobs, tapped a few yes/no answers, and
       stopped. 39 questions stood before any follow-up opened, twenty of
       them yes/no about things that go wrong once a month, and every "why"
       wanted typing. Now a normal day is the jobs, the material, one tap on
       "nothing else happened", the head count and tomorrow. Everything that
       goes wrong is one tap on the list in section 3, and only then are its
       questions asked. Every answer key is the one it always was — the
       yes/no answers the rulebook reads are worked out from the list
       ({picked:…}, quiet:1). */
    { en:"Today's jobs", am:'የዛሬ ሥራዎች', fields:[
      {id:'p_jobs', en:'Which jobs were worked on today?', am:'ዛሬ የተሠሩት የትኞቹ ሥራዎች ናቸው?',
       t:'table', addEn:'Add job', addAm:'ሥራ ጨምር', cols:[
        {id:'code', en:'Job code', am:'የሥራ ኮድ', t:'text'},
        {id:'tgt',  en:'m² target', am:'የታቀደ ካሬ ሜትር', t:'num'},
        /* must: no row goes without its m² (13 Oct 2026, the Chairman — Monday's
           report named three jobs and not one m²); 0 is an answer */
        {id:'done', en:'m² produced', am:'የተመረተ ካሬ ሜትር', t:'num', must:1},
        {id:'for',  en:'Whose job', am:'የማን ሥራ', t:'choice', opts:[
          {v:'ext',  en:'External customer',     am:'የውጭ ደንበኛ'},
          {v:'rove', en:'Rovestone / internal',  am:'ሮቭስቶን / የውስጥ'}
        ]},
        {id:'st',   en:'Status', am:'ሁኔታ', t:'choice', opts:[
          {v:'done', en:'Complete', am:'ተጠናቋል'},
          {v:'wip',  en:'In progress', am:'በሂደት ላይ'}
        ]}
      ]},
      {id:'p_total', en:'How many m² did the factory produce today?', am:'ፋብሪካው ዛሬ ስንት ካሬ ሜትር አመረተ?', t:'num',
        auto:{sum:'p_jobs.done'}, must:1,
        tgt:{op:'gte', v:40, en:'Daily target 40 m² — below is –300 Birr/day from commission',
             am:'የቀኑ ዒላማ 40 ካሬ ሜትር — ከዚህ በታች ከኮሚሽን –300 ብር'}},
      {id:'p_ext', en:'For external customers', am:'ለውጭ ደንበኞች', t:'num', i:1,
        auto:{sum:'p_jobs.done', when:{col:'for', is:'ext'}}, sumEn:'m² for external customers', sumAm:'ካሬ ሜትር ለውጭ ደንበኞች'},
      {id:'p_rove', en:'For Rovestone / internal', am:'ለሮቭስቶን / ለውስጥ', t:'num', i:1,
        auto:{sum:'p_jobs.done', when:{col:'for', is:'rove'}}, sumEn:'m² for Rovestone / internal', sumAm:'ካሬ ሜትር ለሮቭስቶን / ለውስጥ'},
      {id:'p_total_why', en:'Under 40 m² today. What held it back, and how will it be made up?', am:'ዛሬ ከ40 ካሬ ሜትር በታች ነው። ምን አዘገየው? እንዴት ይካካሳል?', t:'area',
        picks:WHY_FLOOR.concat(CATCH_UP), show:{f:'p_total', when:'miss'}},
      {id:'p_rove_ok', en:'Rovestone or internal work: was it in the approved plan?', am:'የሮቭስቶን ወይም የውስጥ ሥራ፦ በጸደቀው ዕቅድ ውስጥ ነበር?', t:'area', one:1,
        picks:[
          { en:'Yes — all in the approved plan',     am:'አዎ — ሁሉም በጸደቀው ዕቅድ ውስጥ ነበር' },
          { en:'Not in the plan — Mahelet knows',    am:'በዕቅዱ የለም — ማህሌት ታውቃለች' },
          { en:'Not in the plan — not approved',     am:'በዕቅዱ የለም — አልተፈቀደም' }
        ], show:{f:'p_rove', when:'pos'}}
    ]},
    /* What the day actually ate, material by material: the MDF and the
       melamine, the edge banding by the metre, the hinges, the slides, the
       handles (the Chairman, 9 Oct 2026 — "what happens on production, MDF,
       accessories"). The same twelve names the store issues against, so
       what the factory says it used and what the store says it gave out can
       be put side by side. The sheet count, the edge metres and the yield
       all come out of these rows, so none of them is typed twice. */
    { en:'What went into the work', am:'ለሥራው የዋለው ዕቃ', fields:[
      {id:'p_mat', en:'Which materials and accessories went into today\'s jobs?',
       am:'ለዛሬዎቹ ሥራዎች የዋሉት ዕቃዎችና መለዋወጫዎች የትኞቹ ናቸው?',
       t:'table', addEn:'Add a material', addAm:'ዕቃ ጨምር', cols:[
        {id:'item', en:'Material or accessory', am:'ዕቃ ወይም መለዋወጫ', t:'choice', opts:MATERIAL_OPTS},
        {id:'colour', en:'Colour code', am:'የቀለም ኮድ', t:'colour', of:'item'},
        {id:'qty',  en:'How much — sheets, metres or pieces', am:'ብዛት — ሉህ፣ ሜትር ወይም ቁጥር', t:'num'},
        {id:'code', en:'For which job', am:'ለየትኛው ሥራ', t:'text'},
        {id:'panels', en:'Panels cut (boards only)', am:'የተቆረጡ ፓኔሎች (ለሰሌዳ ብቻ)', t:'num'},
        {id:'off', en:'Offcut m² sent back to store', am:'ወደ መጋዘን የተመለሰ ቁራጭ (ካሬ ሜትር)', t:'num'}
      ]},
      {id:'b_sheets', en:'How many sheets were used in total today?', am:'ዛሬ በጠቅላላው ስንት ሉህ ዋለ?', t:'num',
        auto:{sum:'p_mat.qty', when:{col:'item', in:BOARDS}}, sumEn:'sheets of board', sumAm:'የሰሌዳ ሉሆች'},
      {id:'b_edge', en:'How many metres of edge banding were used?', am:'ስንት ሜትር የጠርዝ ማሰሪያ ዋለ?', t:'num',
        auto:{sum:'p_mat.qty', when:{col:'item', is:'Edge banding (m)'}}, sumEn:'metres of edge banding', sumAm:'ሜትር ጠርዝ ማሰሪያ'},
      {id:'p_acc', en:'How many pieces of hardware and accessories went on?', am:'ስንት ሃርድዌርና መለዋወጫ ተገጠመ?', t:'num',
        auto:{sum:'p_mat.qty', when:{col:'item', in:ACCESSORIES}}, sumEn:'pieces of hardware', sumAm:'ሃርድዌር ቁጥር'},
      {id:'p_off', en:'How many m² of offcuts went back to the store?', am:'ስንት ካሬ ሜትር ቁራጭ ወደ መጋዘን ተመለሰ?', t:'num',
        auto:{sum:'p_mat.off'}, sumEn:'m² of offcuts back to store', sumAm:'ካሬ ሜትር ቁራጭ ወደ መጋዘን'},
      {id:'b_yield', en:'How many m² came out of each sheet?', am:'ከእያንዳንዱ ሉህ ስንት ካሬ ሜትር ወጣ?', t:'num',
        auto:{div:['p_total', 'b_sheets']}, sumEn:'m² out of each sheet', sumAm:'ካሬ ሜትር በሉህ',
        tgt:{op:'gte', v:2.4, en:'A 2440 × 1220 sheet is 2.98 m² — under 2.4 is a cutting plan to look at',
             am:'የ2440 × 1220 ሉህ 2.98 ካሬ ሜትር ነው — ከ2.4 በታች የመቁረጥ ዕቅዱ መታየት አለበት'}},
      {id:'b_yield_why', en:'Little came out of each sheet. Why?', am:'ከእያንዳንዱ ሉህ ትንሽ ነው የወጣው። ለምን?', t:'area',
        picks:[
          { en:'The cutting plan was poor',        am:'የመቁረጫ ዕቅዱ ጥሩ አልነበረም' },
          { en:'Cut wrong and cut again',          am:'በስህተት ተቆርጦ እንደገና ተቆረጠ' },
          { en:'Damaged board',                    am:'የተበላሸ ሰሌዳ' },
          { en:'The machine cut badly',            am:'ማሽኑ በትክክል አልቆረጠም' },
          { en:'Small pieces — offcuts kept',      am:'ትናንሽ ቁርጥራጮች — ቁርጥራጩ ተቀምጧል' }
        ], show:{f:'b_yield', when:'miss'}}
    ]},
    /* THE ONE LIST. Twenty yes/no questions used to stand in sections of
       their own — absent, late, overtime, hurt, machines checked, breakdowns
       reported, scrap sorted, floor swept — and on a day when none of it
       happened that was twenty taps, which is why they were left empty. */
    { en:'Anything else today?', am:'ዛሬ ሌላ የሆነ ነገር አለ?', fields:[
      {id:'p_events', en:'What else happened in the factory today?', am:'ዛሬ ፋብሪካው ውስጥ ሌላ ምን ሆነ?', t:'multi',
        none:{ en:'Nothing — a normal day', am:'ምንም — የተለመደ ቀን' },
        groups:[
          { v:'people', en:'Workers',            am:'ሠራተኞች' },
          { v:'mach',   en:'Machines',           am:'ማሽኖች' },
          { v:'mat',    en:'Material and scrap', am:'ዕቃና ቁርጥራጭ' },
          { v:'qual',   en:'Quality',            am:'ጥራት' },
          { v:'clean',  en:'Cleaning',           am:'ጽዳት' },
          { v:'rule',   en:'Rules',              am:'ደንብ' }
        ],
        opts:[
          { v:'absent',   g:'people', en:'Someone was absent',                  am:'የቀረ ሰው ነበር' },
          { v:'late',     g:'people', en:'Someone came after 8:00 AM',          am:'ከ2፡00 በኋላ የገባ ሰው ነበር' },
          { v:'overtime', g:'people', en:'Someone worked overtime',             am:'የትርፍ ሰዓት የሠራ ሰው ነበር' },
          { v:'behave',   g:'people', en:'A behaviour problem',                 am:'የባህርይ ችግር ነበር' },
          { v:'hurt',     g:'people', en:'Someone was hurt, or worked without safety gear', am:'የተጎዳ ወይም ያለ መከላከያ የሠራ ሰው ነበር' },
          { v:'m_stop',   g:'mach',   en:'A machine stopped',                   am:'ማሽን ቆመ' },
          { v:'no_check', g:'mach',   en:'Machines were not checked before work', am:'ማሽኖች ከሥራ በፊት አልተፈተሹም' },
          { v:'late_tell',g:'mach',   en:'A breakdown was not told to Mahelet within 30 minutes', am:'ብልሽት በ30 ደቂቃ ውስጥ ለማህሌት አልተነገረም' },
          { v:'mat_stop', g:'mat',    en:'Work stopped — board or accessory missing', am:'ሰሌዳ ወይም መለዋወጫ ስለጠፋ ሥራ ቆመ' },
          { v:'edges',    g:'mat',    en:'Edges lifted and were run again',     am:'ጠርዝ ተነስቶ እንደገና ተሠራ' },
          { v:'saved',    g:'mat',    en:'A job used less material than the BOM', am:'ከዕቃ ዝርዝሩ ያነሰ ዕቃ የተጠቀመ ሥራ ነበር' },
          { v:'not_kept', g:'mat',    en:'Good offcuts were not kept apart',    am:'የሚጠቅሙ ቁርጥራጮች ተለይተው አልተቀመጡም' },
          { v:'not_rec',  g:'mat',    en:'Scrap was not written down',          am:'የተረፈው ቁሳቁስ አልተመዘገበም' },
          { v:'not_stack',g:'mat',    en:'Scrap was not stacked in its place',  am:'የተረፈው ቁሳቁስ በቦታው አልተከመረም' },
          { v:'thrown',   g:'mat',    en:'Usable material was thrown away',     am:'የሚጠቅም ዕቃ ተጣለ' },
          { v:'defects',  g:'qual',   en:'Defects were found',                  am:'ጉድለት ተገኘ' },
          { v:'floor',    g:'clean',  en:'Floor not swept at close',            am:'ወለሉ በመዝጊያ ሰዓት አልተጠረገም' },
          { v:'mach_dirty',g:'clean', en:'Machines not cleaned',                am:'ማሽኖች አልጸዱም' },
          { v:'tools',    g:'clean',  en:'Tools not put back',                  am:'መሣሪያዎች ቦታቸው አልተመለሱም' },
          { v:'bins',     g:'clean',  en:'Bins not emptied',                    am:'የቆሻሻ መጣያዎች አልተደፉም' },
          { v:'audit',    g:'clean',  en:'There was a 5S audit today',          am:'ዛሬ የንጽሕናና የሥርዓት ፍተሻ (5S) ነበር' },
          { v:'unauth',   g:'rule',   en:'Something was made or sent out without all four confirmations', am:'አራቱ ማረጋገጫዎች ሳይሟሉ የተሠራ ወይም የወጣ ነገር ነበር' }
        ]}
    ]},
    /* Four figures stood at the head of this section — assigned, present,
       absent, late — and three of them were in the two lists underneath, or
       were one taken from another. One row a person who was not where they
       should have been, and the arithmetic does itself. */
    { en:'Workers', am:'ሠራተኞች', fields:[
      {id:'mp_assigned', en:'How many workers were assigned today?', am:'ዛሬ ስንት ሠራተኞች ተመደቡ?', t:'num'},
      /* the absent and the late stay two lists: the rulebook pays a worker a
         bonus for appearing in neither, and fines on the late list alone
         (js/rules.js), so one list with a column would have to be taught to
         every rule that reads them */
      {id:'mp_any', en:'Was anyone absent today?', am:'ዛሬ የቀረ ሰው አለ?', t:'yesno', quiet:1, auto:{picked:'p_events', v:'absent'}},
      {id:'mp_absent_list', en:'Who was absent?', am:'የቀሩት እነማን ናቸው?', t:'table', addEn:'Add a worker', addAm:'ሰው ጨምር',
        show:{f:'mp_any', when:'yes'},
        cols:[
          {id:'name', en:'Worker', am:'ሠራተኛ', t:'choice', opts:WORKERS},
          {id:'why', en:'Reason', am:'ምክንያት', t:'text', picks:COL_ABSENT},
          {id:'ok', en:'With permission', am:'በፈቃድ', t:'yesno', yes:{en:'With permission', am:'በፈቃድ'}, no:{en:'No permission', am:'ያለ ፈቃድ'}}
        ]},
      {id:'mp_absent', en:'How many were absent?', am:'ስንቱ ቀሩ?', t:'num',
        auto:{rows:'mp_absent_list'}, sumEn:'absent', sumAm:'ቀርተዋል'},
      {id:'mp_late_any', en:'Did anyone arrive after 8:00 AM?', am:'ከጠዋቱ 2፡00 (8:00 AM) በኋላ የገባ ሰው አለ?', t:'yesno', quiet:1, auto:{picked:'p_events', v:'late'}},
      {id:'mp_late_list', en:'Who came after 8:00 AM?', am:'ከ2፡00 በኋላ የገቡት እነማን ናቸው?', t:'table', addEn:'Add a worker', addAm:'ሰው ጨምር',
        show:{f:'mp_late_any', when:'yes'},
        cols:[
          {id:'name', en:'Worker', am:'ሠራተኛ', t:'choice', opts:WORKERS},
          {id:'at', en:'Arrived at', am:'የገባበት ሰዓት', t:'text', time:1},
          {id:'why', en:'Reason', am:'ምክንያት', t:'text', picks:COL_LATE},
          {id:'valid', en:'Good reason', am:'በቂ ምክንያት', t:'yesno', yes:{en:'Good reason', am:'በቂ ምክንያት አለው'}, no:{en:'No good reason', am:'በቂ ምክንያት የለውም'}}
        ]},
      {id:'mp_late', en:'How many arrived after 8:00 AM?', am:'ስንቱ ከጠዋቱ 2፡00 (8:00 AM) በኋላ ገቡ?', t:'num',
        auto:{rows:'mp_late_list'}, sumEn:'late', sumAm:'ዘግይተዋል',
        tgt:{op:'lte', v:0, en:'–100 Birr per worker per incident', am:'በእያንዳንዱ ሠራተኛ –100 ብር'}},
      {id:'mp_present', en:'How many came to work?', am:'ስንቱ ሥራ ገቡ?', t:'num',
        auto:{minus:['mp_assigned', 'mp_absent']}, sumEn:'came to work', sumAm:'ሥራ ገብተዋል'},
      /* overtime (8 Oct 2026), for the workforce reader */
      {id:'ot_any', en:'Did anyone work overtime today?', am:'ዛሬ የትርፍ ሰዓት የሠራ ሰው አለ?', t:'yesno', quiet:1, auto:{picked:'p_events', v:'overtime'}},
      {id:'ot_list', en:'Who worked overtime, for how long, and was it approved?', am:'የትርፍ ሰዓት የሠራ ማን ነው? ለምን ያህል ሰዓት? ተፈቅዶ ነበር?', t:'table', addEn:'Add a worker', addAm:'ሰው ጨምር',
        show:{f:'ot_any', when:'yes'},
        cols:[
          {id:'name', en:'Worker', am:'ሠራተኛ', t:'choice', opts:WORKERS},
          {id:'hours', en:'Hours', am:'ሰዓት', t:'num'},
          {id:'why', en:'Why', am:'ምክንያት', t:'text', picks:COL_OVERTIME},
          {id:'ok', en:'Approved by Mahelet', am:'ማህሌት ፈቅዳለች', t:'yesno', yes:{en:'Approved', am:'ተፈቅዷል'}, no:{en:'Not approved', am:'አልተፈቀደም'}}
        ]},
      {id:'ot_hours', en:'How many overtime hours were worked today, in total?', am:'ዛሬ በጠቅላላ ስንት የትርፍ ሰዓት ተሠራ?', t:'num',
        auto:{sum:'ot_list.hours'}, sumEn:'overtime hours', sumAm:'የትርፍ ሰዓት'},
      {id:'mp_behave', en:'How many behaviour problems were there?', am:'ስንት የባህርይ ችግሮች ነበሩ?', t:'num', zero:1,
        show:{f:'p_events', when:'has', v:'behave'},
        tgt:{op:'lte', v:0, en:'Unreported issues carry double the penalty', am:'ያልተነገረ ጉዳይ ቅጣቱ በእጥፍ ነው'}},
      {id:'mp_behave_what', en:'What happened? (Write who in the box.)', am:'ምን ሆነ? (ማን እንደሆነ በሳጥኑ ይጻፉ።)', t:'area',
        picks:[
          { en:'Argument or fight',          am:'ጭቅጭቅ ወይም ጠብ' },
          { en:'Refused the work',           am:'ሥራውን አልሠራም አለ' },
          { en:'Phone or music at work',     am:'በሥራ ላይ ስልክ ወይም ሙዚቃ' },
          { en:'Left early',                 am:'ቀድሞ ወጣ' },
          { en:'Mahelet was told',           am:'ለማህሌት ተነግሯል' },
          { en:'Not told to Mahelet yet',    am:'ለማህሌት ገና አልተነገረም' }
        ], show:{f:'mp_behave', when:'pos'}},
      {id:'mp_safety', en:'Was anyone hurt, or anyone working without safety gear, today?', am:'ዛሬ የተጎዳ ሰው ወይም ያለ ደህንነት መጠበቂያ የሠራ ሰው ነበር?', t:'yesno', quiet:1, auto:{picked:'p_events', v:'hurt'}},
      {id:'mp_safety_what', en:'What happened? (Write who in the box.)', am:'ምን ሆነ? (ማን እንደሆነ በሳጥኑ ይጻፉ።)', t:'area',
        picks:[
          { en:'Small cut — first aid given',      am:'ትንሽ መቆረጥ — የመጀመሪያ ሕክምና ተሰጠ' },
          { en:'Went to the clinic',               am:'ወደ ክሊኒክ ሄደ' },
          { en:'Worked without gloves, glasses or mask', am:'ያለ ጓንት፣ መነጽር ወይም ማስክ ሠራ' },
          { en:'Mahelet was told',                 am:'ለማህሌት ተነግሯል' }
        ], show:{f:'mp_safety', when:'yes'}}
    ]},
    { en:'Machines', am:'ማሽኖች', fields:[
      {id:'m_inspect', en:'Were all machines inspected before work started?', am:'ሥራ ከመጀመሩ በፊት ሁሉም ማሽኖች ተፈትሸዋል?', t:'yesno', quiet:1, auto:{picked:'p_events', v:'no_check', flip:1}},
      {id:'m_inspect_why', en:'Machines were not checked before work. Why?', am:'ማሽኖች ከሥራ በፊት አልተፈተሹም። ለምን?', t:'area',
        picks:WHY_MISSED, show:{f:'m_inspect', when:'no'}},
      {id:'m_rows', en:'Which machine stopped, and for how long?', am:'የቆመው የትኛው ማሽን ነው? ለምን ያህል ሰዓት?',
       t:'table', addEn:'Add machine', addAm:'ማሽን ጨምር', show:{f:'p_events', when:'has', v:'m_stop'}, cols:[
        {id:'name', en:'Machine', am:'ማሽን', t:'choice', opts:[
          {v:'Width cutter',  en:'Width cutter',  am:'የወርድ መቁረጫ'},
          {v:'Length cutter', en:'Length cutter', am:'የርዝመት መቁረጫ'},
          {v:'Edge bander',   en:'Edge bander',   am:'ጠርዝ ማሰሪያ'},
          {v:'Hinge driller', en:'Hinge driller', am:'የማጠፊያ መብሻ'},
          {v:'Compressor',    en:'Compressor',    am:'ኮምፕረሰር'},
          {v:'Other',         en:'Other',         am:'ሌላ'}
        ]},
        {id:'run',  en:'Running again', am:'እንደገና እየሠራ ነው', t:'yesno', yes:{en:'Running again', am:'እንደገና እየሠራ ነው'}, no:{en:'Still stopped', am:'አሁንም ቆሟል'}},
        /* read by amaha-breakdown-unreported through the weekly (bug hunt, 15 Oct 2026: never asked, so never judged) */
        {id:'told', en:'Told Mahelet within 30 minutes?', am:'በ30 ደቂቃ ውስጥ ለማህሌት ተነግሯል?', t:'yesno', yes:{en:'Told in time', am:'በሰዓቱ ተነግሯል'}, no:{en:'Not within 30 minutes', am:'በ30 ደቂቃ ውስጥ አልተነገረም'}},
        {id:'down', en:'Hours stopped', am:'ለስንት ሰዓት ቆመ', t:'num'},
        {id:'cause',en:'Cause', am:'ምክንያት', t:'text', picks:COL_MACHINE}
      ]},
      {id:'m_breaks', en:'How many machines stopped today?', am:'ዛሬ ስንት ማሽኖች ቆሙ?', t:'num',
        auto:{rows:'m_rows', when:{col:'down', pos:1}}, sumEn:'machines stopped', sumAm:'ማሽኖች ቆመዋል'},
      {id:'m_downhrs', en:'How many hours were lost to downtime today?', am:'ዛሬ በማሽን መቆም ስንት ሰዓት ጠፋ?', t:'num',
        auto:{sum:'m_rows.down'}, sumEn:'hours down', sumAm:'ሰዓት ቆመዋል'},
      {id:'m_reported', en:'Was every breakdown reported to Mahelet within 30 minutes?', am:'እያንዳንዱ ብልሽት በ30 ደቂቃ ውስጥ ለማህሌት ተነግሯል?', t:'yesno', quiet:1, auto:{picked:'p_events', v:'late_tell', flip:1}},
      {id:'m_reported_why', en:'Why was Mahelet not told within 30 minutes? (–500 Birr)', am:'ለማህሌት በ30 ደቂቃ ውስጥ ለምን አልተነገረም? (–500 ብር)', t:'area',
        picks:[
          { en:'Could not reach Mahelet',          am:'ማህሌት አልተገኘችም' },
          { en:'Tried to fix it ourselves first',  am:'መጀመሪያ እኛው ለማስተካከል ሞከርን' },
          { en:'Forgot',                           am:'ተረስቷል' },
          { en:'Did not know the rule',            am:'ደንቡን አላወቅንም' }
        ], show:{f:'m_reported', when:'no'}}
    ]},
    { en:'Material and scrap', am:'ዕቃና ቁርጥራጭ', fields:[
      {id:'b_short', en:'Did any cut stop for want of the right board or accessory?', am:'ትክክለኛው ሰሌዳ ወይም መለዋወጫ ባለመኖሩ የቆመ ሥራ አለ?', t:'yesno', quiet:1, auto:{picked:'p_events', v:'mat_stop'}},
      /* one tap where it used to be typed; the plant manager and the morning
         brief both name this answer */
      {id:'b_shortw', en:'What was missing?', am:'የጎደለው ምንድን ነው?', t:'choice', opts:MATERIAL_OPTS, i:1, show:{f:'b_short', when:'yes'}},
      {id:'b_short_what', en:'How long did it stop, and when does it come? (Write the job in the box.)', am:'ለምን ያህል ጊዜ ቆመ? መቼ ይደርሳል? (ሥራውን በሳጥኑ ይጻፉ።)', t:'area',
        picks:[
          { en:'Stopped less than an hour',        am:'ከአንድ ሰዓት ያነሰ ቆመ' },
          { en:'Stopped half a day',               am:'ግማሽ ቀን ቆመ' },
          { en:'Stopped all day',                  am:'ሙሉ ቀን ቆመ' },
          { en:'It comes tomorrow',                am:'ነገ ይደርሳል' },
          { en:'No date yet — Getachew was told',  am:'ቀን የለም — ለጌታቸው ተነግሯል' }
        ], show:{f:'b_short', when:'yes'}},
      {id:'b_redo', en:'How many edges had to be run again because they lifted?', am:'ተነስተው እንደገና የተሠሩ ጠርዞች ስንት ናቸው?', t:'num', zero:1,
        show:{f:'p_events', when:'has', v:'edges'},
        tgt:{op:'lte', v:0, en:'An edge that lifts is a job that comes back', am:'የሚነሳ ጠርዝ ሥራው እንዲመለስ ያደርጋል'}},
      {id:'b_redo_why', en:'What is making them lift, and what was done?', am:'ጠርዞቹ ለምን ይነሳሉ? ምን ተደረገ?', t:'area',
        picks:[
          { en:'The edge bander',                  am:'ጠርዝ ማሰሪያ ማሽኑ' },
          { en:'The glue',                         am:'ሙጫው' },
          { en:'The board',                        am:'ሰሌዳው' },
          { en:'The operator',                     am:'ኦፕሬተሩ' },
          { en:'The machine was adjusted',         am:'ማሽኑ ተስተካከለ' },
          { en:'Run again and fine now',           am:'እንደገና ተሠርቶ አሁን ደህና ነው' }
        ], show:{f:'b_redo', when:'miss'}},
      {id:'w_pct', en:'About how much of today\'s material went to waste, in %? Your best guess is fine.', am:'ዛሬ ከዋለው ዕቃ በግምት ስንት % ባከነ? ግምትዎ በቂ ነው።', t:'pct',
        tgt:{op:'lte', v:20, en:'Must not exceed 20% — all bonuses depend on it',
             am:'ከ20% መብለጥ የለበትም — ሁሉም ጉርሻዎች በዚህ ላይ ይወሰናሉ'}},
      {id:'w_pct_why', en:'Over 20% waste. Why?', am:'ብክነቱ ከ20% በላይ ነው። ለምን?', t:'area',
        picks:[
          { en:'Cutting mistakes',                 am:'የመቁረጥ ስህተት' },
          { en:'A poor cutting plan',              am:'ጥሩ ያልሆነ የመቁረጫ ዕቅድ' },
          { en:'Damaged board',                    am:'የተበላሸ ሰሌዳ' },
          { en:'A machine problem',                am:'የማሽን ችግር' },
          { en:'Pieces too small to use',          am:'ለመጠቀም በጣም ትናንሽ ቁርጥራጮች' },
          { en:'The design changed',               am:'ዲዛይኑ ተቀየረ' }
        ], show:{f:'w_pct', when:'miss'}},
      {id:'w_var', en:'How far over the BOM was material use today, in %? (0 if you used what the BOM said.)', am:'ዛሬ የዋለው ዕቃ ከዕቃ ዝርዝሩ በስንት % በለጠ? (ዝርዝሩ ያለውን ብቻ ከተጠቀሙ 0።)', t:'pct',
        tgt:{op:'lte', v:5, en:'Above +5% cancels the bonuses; above +10% is –2,000 Birr',
             am:'ከ+5% በላይ ጉርሻዎችን ይሰርዛል፤ ከ+10% በላይ –2,000 ብር'}},
      {id:'w_var_why', en:'Over the BOM. Why, and did Mahelet approve the extra? (Write the job in the box.)', am:'ከዕቃ ዝርዝሩ በልጧል። ለምን? ተጨማሪውን ማህሌት ፈቅዳለች? (ሥራውን በሳጥኑ ይጻፉ።)', t:'area',
        picks:[
          { en:'The design changed',               am:'ዲዛይኑ ተቀየረ' },
          { en:'Cut wrong and cut again',          am:'በስህተት ተቆርጦ እንደገና ተቆረጠ' },
          { en:'The BOM was wrong',                am:'የዕቃ ዝርዝሩ ስህተት ነበረው' },
          { en:'Damaged board',                    am:'የተበላሸ ሰሌዳ' },
          { en:'Mahelet approved the extra',       am:'ተጨማሪውን ማህሌት ፈቅዳለች' },
          { en:'Not approved yet',                 am:'ገና አልተፈቀደም' }
        ], show:{f:'w_var', when:'miss'}},
      {id:'sav_any', en:'Did any job use less material than the BOM today?', am:'ዛሬ ከዕቃ ዝርዝሩ ያነሰ ዕቃ የተጠቀመ ሥራ አለ?', t:'yesno', quiet:1, auto:{picked:'p_events', v:'saved'}},
      {id:'sav_rows', en:'Where did you use less material than the BOM today?', am:'ዛሬ ከዕቃ ዝርዝሩ ያነሰ ዕቃ የተጠቀሙት በየትኛው ሥራ ነው?',
       t:'table', addEn:'Add material', addAm:'ቁሳቁስ ጨምር', show:{f:'sav_any', when:'yes'}, cols:[
        {id:'mat',  en:'Material', am:'ቁሳቁስ', t:'choice', opts:MATERIAL_OPTS},
        {id:'colour', en:'Colour code', am:'የቀለም ኮድ', t:'colour', of:'mat'},
        {id:'code', en:'Job', am:'ሥራ', t:'text'},
        {id:'bom',  en:'BOM qty', am:'በዝርዝሩ ያለው መጠን', t:'num'},
        {id:'used', en:'Actual used', am:'የዋለው መጠን', t:'num'},
        {id:'cost', en:'Unit cost', am:'የአንዱ ዋጋ', t:'money'},
        {id:'sav',  en:'Savings (Birr)', am:'ቁጠባ (ብር)', t:'money'}
      ]},
      {id:'sav_today', en:'How much was saved today, in Birr?', am:'ዛሬ ስንት ብር ተቆጠበ?', t:'money',
        auto:{sum:'sav_rows.sav'}},
      {id:'sav_how', en:'How was it saved, and was the quality checked?', am:'እንዴት ተቆጠበ? ጥራቱ ተፈትሿል?', t:'area',
        picks:[
          { en:'A better cutting plan',            am:'የተሻለ የመቁረጫ ዕቅድ' },
          { en:'Offcuts were used',                am:'ቁርጥራጮች ተጠቅመናል' },
          { en:'Fewer mistakes',                   am:'ስህተት ቀንሷል' },
          { en:'Quality checked — fine',           am:'ጥራቱ ተፈትሾ ደህና ነው' },
          { en:'Quality not checked yet',          am:'ጥራቱ ገና አልተፈተሸም' }
        ], show:{f:'sav_today', when:'pos'}},
      {id:'ws_reuse', en:'Were reusable offcuts stored separately today?', am:'ዛሬ እንደገና የሚያገለግሉ ቁርጥራጮች ተለይተው ተቀመጡ?', t:'yesno', quiet:1, auto:{picked:'p_events', v:'not_kept', flip:1}},
      {id:'ws_reuse_why', en:'Good offcuts were not kept apart. Why? (–300 Birr per incident)', am:'የሚጠቅሙ ቁርጥራጮች ተለይተው አልተቀመጡም። ለምን? (በእያንዳንዱ –300 ብር)', t:'area',
        picks:WHY_MISSED.concat([{ en:'No space to keep them', am:'የሚቀመጡበት ቦታ የለም' }]), show:{f:'ws_reuse', when:'no'}},
      {id:'ws_rec', en:'Was all scrap recorded today?', am:'ዛሬ የተረፈው ቁሳቁስ በሙሉ ተመዘገበ?', t:'yesno', quiet:1, auto:{picked:'p_events', v:'not_rec', flip:1}},
      {id:'ws_rec_why', en:'Scrap was not written down. Why?', am:'የተረፈው ቁሳቁስ አልተመዘገበም። ለምን?', t:'area',
        picks:WHY_MISSED.concat([{ en:'The record book was not there', am:'መመዝገቢያው አልነበረም' }]), show:{f:'ws_rec', when:'no'}},
      {id:'ws_stack', en:'Is the scrap stacked in the scrap area?', am:'የተረፈው ቁሳቁስ በተመደበው ቦታ ተከምሯል?', t:'yesno', quiet:1, auto:{picked:'p_events', v:'not_stack', flip:1}},
      {id:'ws_thrown', en:'Was any reusable material thrown away without being recorded?', am:'ሳይመዘገብ የተጣለ እንደገና የሚያገለግል ቁሳቁስ ነበር?', t:'yesno', quiet:1, auto:{picked:'p_events', v:'thrown'}},
      {id:'ws_thrown_what', en:'What was thrown away? (Write how much and by whom in the box. –500 Birr per incident)', am:'ምን ተጣለ? (ምን ያህልና በማን በሳጥኑ ይጻፉ። በእያንዳንዱ –500 ብር)', t:'area',
        picks:[
          { en:'Offcuts',                          am:'ቁርጥራጮች' },
          { en:'Whole boards',                     am:'ሙሉ ሰሌዳዎች' },
          { en:'Edge banding',                     am:'የጠርዝ ማሰሪያ' },
          { en:'Hardware',                         am:'ሃርድዌር' }
        ], show:{f:'ws_thrown', when:'yes'}}
    ]},
    { en:'Quality checks', am:'የጥራት ፍተሻ', fields:[
      {id:'qc', en:'How did each checkpoint go today? (If you counted.)', am:'ዛሬ እያንዳንዱ ፍተሻ እንዴት ሄደ? (ከቆጠሩ።)', t:'grid', opt:1,
       rows:[{en:'After cutting', am:'ከመቁረጥ በኋላ'},
             {en:'After assembly', am:'ከመገጣጠም በኋላ'},
             {en:'Before delivery', am:'ከማድረስ በፊት'}],
       cols:[
        {id:'pass', en:'Passed', am:'ያለፉ', t:'num'},
        {id:'fail', en:'Failed', am:'ያላለፉ', t:'num'},
        {id:'sign', en:'Signed in Job File', am:'በሥራ ፋይል ተፈርሟል', t:'yesno', yes:{en:'Signed', am:'ተፈርሟል'}, no:{en:'Not signed', am:'አልተፈረመም'}}
      ]},
      {id:'qc_any', en:'Were any defects found today?', am:'ዛሬ የተገኙ ጉድለቶች አሉ?', t:'yesno', quiet:1, auto:{picked:'p_events', v:'defects'}},
      {id:'qc_defects_list', en:'Each defect found today', am:'ዛሬ የተገኙት ጉድለቶች አንድ በአንድ', t:'table', addEn:'Add a defect', addAm:'ጉድለት ጨምር',
        show:{f:'qc_any', when:'yes'},
        cols:[
          {id:'code', en:'Job code', am:'የሥራ ኮድ', t:'text'},
          {id:'what', en:'Defect', am:'ጉድለቱ', t:'text', picks:COL_DEFECT},
          {id:'stage', en:'Started at (stage)', am:'የጀመረበት ደረጃ', t:'text', picks:COL_STAGE},
          {id:'rmat', en:'Material to cut again', am:'በድጋሚ የሚቆረጥ ዕቃ', t:'choice', opts:REDO_OPTS},
          {id:'rcol', en:'Colour code', am:'የቀለም ኮድ', t:'colour', of:'rmat'},
          {id:'rqty', en:'How many pieces?', am:'ስንት ቁራጭ?', t:'num', ifCol:'rmat', ifNot:['none']},
          {id:'told', en:'Mahelet told at once', am:'ለማህሌት ወዲያው ተነግሯል', t:'yesno', yes:{en:'Told at once', am:'ወዲያው ተነግሯታል'}, no:{en:'Not told', am:'አልተነገራትም'}},
          {id:'rel', en:'Reached finished goods', am:'ወደ ዝግጁ ዕቃ ገብቷል', t:'yesno', yes:{en:'Reached finished goods', am:'ወደ ዝግጁ ዕቃ ገብቷል'}, no:{en:'Caught before', am:'ሳይገባ ተይዟል'}}
        ]},
      {id:'qc_defects', en:'How many defects were found today?', am:'ዛሬ ስንት ጉድለቶች ተገኙ?', t:'num',
        auto:{rows:'qc_defects_list'},
        tgt:{op:'lte', v:0, en:'–500 Birr per defect released to finished goods',
             am:'ወደ ዝግጁ ዕቃ ማከማቻ ለገባ እያንዳንዱ ጉድለት –500 ብር'}},
      {id:'qc_released', en:'How many of them reached finished goods?', am:'ከነሱ ስንቱ ወደ ዝግጁ ዕቃ ገባ?', t:'num',
        auto:{rows:'qc_defects_list', when:{col:'rel', is:'yes'}},
        sumEn:'reached finished goods', sumAm:'ወደ ዝግጁ ዕቃ ገብተዋል'},
      {id:'qc_fails', en:'How many checkpoint failures were there today?', am:'ዛሬ ስንት ፍተሻዎች አልተሳኩም?', t:'num',
        auto:{grid:'qc.fail'}},
      /* the week's summary adds these up, so neither is typed twice */
      {id:'qc_pass', en:'How many checks passed today?', am:'ዛሬ ስንት ፍተሻዎች አለፉ?', t:'num',
        auto:{grid:'qc.pass'}},
      {id:'qc_checked', en:'How many checks were done today?', am:'ዛሬ ስንት ፍተሻዎች ተደረጉ?', t:'num',
        auto:{plus:['qc_pass', 'qc_fails']}},
      {id:'qc_action', en:'What was done about the defects?', am:'በጉድለቶቹ ላይ ምን ተደረገ?', t:'area', opt:1,
        picks:DONE_ABOUT, show:{f:'qc_any', when:'yes'}}
    ]},
    { en:'Cleaning', am:'ጽዳት', fields:[
      {id:'c_floor', en:'Was the factory floor swept and clean at close?', am:'በመዝጊያ ሰዓት የፋብሪካው ወለል ተጠርጎ ንጹህ ነበር?', t:'yesno', quiet:1, auto:{picked:'p_events', v:'floor', flip:1}},
      {id:'c_mach', en:'Were the machines cleaned after use?', am:'ማሽኖች ከሥራ በኋላ ጸድተዋል?', t:'yesno', quiet:1, auto:{picked:'p_events', v:'mach_dirty', flip:1}},
      {id:'c_tools', en:'Were all tools returned to their place?', am:'ሁሉም መሣሪያዎች በቦታቸው ተመልሰዋል?', t:'yesno', quiet:1, auto:{picked:'p_events', v:'tools', flip:1}},
      {id:'c_waste', en:'Were the waste bins emptied?', am:'የቆሻሻ መጣያዎች ተደፍተዋል?', t:'yesno', quiet:1, auto:{picked:'p_events', v:'bins', flip:1}},
      {id:'c_5s', en:'What was the 5S audit score?', am:'የንጽሕናና የሥርዓት ፍተሻው (5S) ውጤት ስንት ነበር?', t:'pct', opt:1,
        show:{f:'p_events', when:'has', v:'audit'},
        tgt:{op:'gte', v:80, en:'Below 80% is –500 Birr', am:'ከ80% በታች –500 ብር'}},
      {id:'c_5s_why', en:'Which areas failed the audit, and what is being fixed, by when?', am:'በኦዲቱ ያልተሳኩት የትኞቹ ቦታዎች ናቸው? ምን እየተስተካከለ ነው? እስከ መቼ?', t:'area', picks:[{ en:'Floor and walkways', am:'ወለልና መተላለፊያ' }, { en:'Machines', am:'ማሽኖች' }, { en:'Tools', am:'መሣሪያዎች' }, { en:'Board and offcut storage', am:'የሰሌዳና የቁርጥራጭ ማስቀመጫ' }, { en:'Fixed today', am:'ዛሬ ተስተካክሏል' }], show:{f:'c_5s', when:'miss'}}
    ]},
    { en:'Without the four confirmations', am:'አራቱ ማረጋገጫዎች ሳይሟሉ', fields:[
      {id:'u_any', en:'Was anything produced or sent out today without all four confirmations?', am:'ዛሬ አራቱም ማረጋገጫዎች ሳይሟሉ የተመረተ ወይም የወጣ ነገር ነበር?', t:'yesno', quiet:1, auto:{picked:'p_events', v:'unauth'}},
      {id:'u_what', en:'Which job, what was made or sent out, by whom, and what was done?', am:'የትኛው ሥራ? ምን ተመረተ ወይም ወጣ? በማን? ምን እርምጃ ተወሰደ?', t:'area', picks:[{ en:'Made before payment was confirmed', am:'ክፍያ ሳይረጋገጥ ተሠራ' }, { en:'Sent out before QC passed it', am:'የጥራት ፍተሻ ሳያልፍ ወጣ' }, { en:'Sent out without a delivery order', am:'ያለ መውጫ ትዕዛዝ ወጣ' }, { en:'Mahelet was told', am:'ለማህሌት ተነግሯል' }], show:{f:'u_any', when:'yes'}},
      {id:'u_reported', en:'Was it reported to Mahelet within 1 hour?', am:'በ1 ሰዓት ውስጥ ለማህሌት ተነግሯል?', t:'yesno', yes:{en:'Told within the hour', am:'በ1 ሰዓት ውስጥ ተነግሯታል'}, no:{en:'Later, or not at all', am:'ዘግይቶ ወይም አልተነገራትም'}, show:{f:'u_any', when:'yes'}}
    ]},
    /* "10 · Boards and yield" stood here and asked the day's material over
       again: the board rows, the sheet total, the yield, the edge metres.
       Section 2 is that section, with the accessories in it and the figures
       counted rather than typed (the Chairman, 9 Oct 2026). */
    { en:'Where the work stands', am:'ሥራው የት ደረሰ', fields:[
      {id:'w_block', en:'What held the factory up most today?', am:'ዛሬ ፋብሪካውን በጣም ያዘገየው ምንድን ነው?', t:'choice', opts:[
        {v:'none', en:'Nothing held it up', am:'ምንም አላዘገየም'},
        {v:'cut', en:'Cutting', am:'ቁረጣ'},
        {v:'edge', en:'Edge banding', am:'ጠርዝ ማሰር'},
        {v:'drill', en:'Drilling', am:'ቀዳዳ መብሳት'},
        {v:'asm', en:'Assembly', am:'መገጣጠም'},
        {v:'hw', en:'Hardware missing', am:'ሃርድዌር ጎድሏል'},
        {v:'board', en:'Board missing', am:'ሰሌዳ ጎድሏል'},
        {v:'qc', en:'Waiting for QC', am:'የጥራት ፍተሻ በመጠበቅ ላይ'},
        {v:'power', en:'Power cut', am:'መብራት ጠፋ'}
      ]},
      {id:'w_lost', en:'How many hours were lost to it?', am:'በዚህ ስንት ሰዓት ጠፋ?', t:'num', opt:1, i:1},
      /* seven stages by three boxes was 21 numbers at 5:30 PM, and it was
         empty both days; it stays for the days Mahelet asks for it */
      {id:'w_stage', en:'How many jobs sit at each stage at close? (If Mahelet asked.)', am:'በመዝጊያ ሰዓት በየደረጃው ስንት ሥራዎች አሉ? (ማህሌት ከጠየቀች።)',
       t:'grid', opt:1, rows:[
        {en:'Cutting', am:'ቁረጣ'},
        {en:'Edge banding', am:'ጠርዝ ማሰር'},
        {en:'Drilling', am:'ቀዳዳ መብሳት'},
        {en:'Assembly', am:'መገጣጠም'},
        {en:'Finishing and packing', am:'ማጠናቀቅና ማሸግ'},
        {en:'Waiting for hardware', am:'ሃርድዌር በመጠበቅ ላይ'},
        {en:'Waiting for QC', am:'የጥራት ፍተሻ በመጠበቅ ላይ'}
      ], cols:[
        {id:'jobs', en:'Jobs', am:'ሥራዎች', t:'num'},
        {id:'m2', en:'m²', am:'ካሬ ሜትር', t:'num'},
        {id:'held', en:'Longest waiting (days)', am:'ረጅሙ ቆይታ (ቀን)', t:'num'}
      ]}
    ]},
    { en:'Problems and help', am:'ችግርና እርዳታ', fields:[
      {id:'problem', en:'What was the biggest problem today?', am:'የዛሬው ትልቁ ችግር ምን ነበር?', t:'area', opt:1, picks:DAY_PROBLEM},
      {id:'need_help', en:'What do you need, and from whom?', am:'ምን ያስፈልግዎታል? ከማን?', t:'area', opt:1, picks:NEED_HELP},
      {id:'need_lead', en:'Do you need a decision from Mahelet?', am:'የማህሌት ውሳኔ ያስፈልግዎታል?', t:'yesno', yes:{en:'I need a decision', am:'ውሳኔ ያስፈልገኛል'}, no:{en:'No decision needed', am:'ውሳኔ አያስፈልገኝም'}},
      {id:'need_lead_what', en:'What should Mahelet decide, and by when?', am:'ማህሌት ምን መወሰን አለባት? እስከ መቼ?', t:'area', picks:[{ en:'Approve overtime', am:'የትርፍ ሰዓት መፍቀድ' }, { en:'Approve extra material', am:'ተጨማሪ ዕቃ መፍቀድ' }, { en:'Change the order of jobs', am:'የሥራዎችን ቅደም ተከተል መቀየር' }, { en:'A worker problem', am:'የሠራተኛ ጉዳይ' }, { en:'A machine repair', am:'የማሽን ጥገና' }], show:{f:'need_lead', when:'yes'}}
    ]},
    { en:'Tomorrow', am:'ነገ', fields:[
      {id:'p1', en:'What comes first tomorrow? (A job code is enough.)', am:'ነገ መጀመሪያ የሚሠራው ምንድን ነው? (የሥራ ኮድ በቂ ነው።)', t:'text', from:['p_jobs.code'], recent:1},
      {id:'p2', en:'And second?', am:'ሁለተኛው?', t:'text', from:['p_jobs.code'], recent:1, opt:1},
      {id:'p3', en:'And third?', am:'ሦስተኛው?', t:'text', from:['p_jobs.code'], recent:1, opt:1}
    ]}
  ]
},

/* ======================= AMAHA — WEEKLY PRODUCTION ====================== */
{
  id:'amaha-weekly', person:'amaha', cadence:'weekly', built:1, dueTime:'17:00', dueDay:6,
  en:'Weekly Production Summary', am:'ሳምንታዊ የምርት ማጠቃለያ',
  toEn:'Mahelet + Ephrata', toAm:'ማህሌት + ኤፍራታ',
  dueEn:'Saturday 5:00 PM', dueAm:'ቅዳሜ ከቀኑ 11፡00 (5:00 PM)',
  penEn:'Late or not sent –500 Birr', penAm:'ዘግይቶ ወይም ካልቀረበ –500 ብር',
  sections:[
    /* REBUILT 11 Oct 2026 (the Chairman: "they are struggling so much with
       the questions"). Amaha's first weekly summary (10 Oct) left 30 of its
       32 questions empty — the emptiest report in the company. It asked for
       figures nobody keeps (the week's BOM totals, % saved, what the waste
       cost, scrap recorded), for counts his own daily reports already hold
       (behaviour problems, rework-free jobs), and for ten yes/no answers
       about things that go wrong once a month; he typed a number into a
       "why" box. Now: every figure the week's dailies hold is worked out
       from them (auto:{week:…}); what goes wrong is one tap on the list in
       "Anything else this week?", and only then are its questions asked —
       the yes/no answers the rulebook reads are worked out from the list
       ({picked:…}, quiet:1) and its counts file a real 0 on a normal week
       (zero:1); the figures nobody keeps open from the same list, "if you
       know it"; every "why" is buttons. A normal week asks: did a job
       finish, the list, machine uptime, the 5S score, and whether Mahelet
       must decide something — the rest is optional. Every answer key is
       the one it always was. */
    { en:"The week's production", am:'የሳምንቱ ምርት', fields:[
      {id:'w_total', en:'How many m² did the factory produce this week?', am:'ፋብሪካው በዚህ ሳምንት ስንት ካሬ ሜትር አመረተ?', t:'num', auto:{week:'p_total'},
        parts:{of:['w_ext','w_rove']},
        tgt:{op:'gte', v:240, en:'Weekly target 240 m²', am:'የሳምንቱ ዒላማ 240 ካሬ ሜትር'}},
      {id:'w_total_why', en:'The week is under 240 m². Why, and what changes next week? (Write the short days in the box.)', am:'ሳምንቱ ከ240 ካሬ ሜትር በታች ነው። ለምን? በሚቀጥለው ሳምንት ምን ይቀየራል? (የጎደሉትን ቀናት በሳጥኑ ይጻፉ።)', t:'area', auto:{weekText:'p_total_why', from:'amaha-daily'},
        picks:[
          { en:'Material was not in the store',     am:'ዕቃው መጋዘን ውስጥ አልነበረም' },
          { en:'A machine broke down',              am:'ማሽን ተበላሸ' },
          { en:'Power cuts',                        am:'መብራት ጠፋ' },
          { en:'Workers were absent',               am:'ሠራተኞች ቀሩ' },
          { en:'Design or cutting lists came late', am:'ዲዛይን ወይም የመቁረጫ ዝርዝር ዘገየ' },
          { en:'Rework took the time',              am:'የተመለሰ ሥራ ጊዜ ወሰደ' },
          { en:'Not enough jobs in the plan',       am:'በዕቅዱ በቂ ሥራ አልነበረም' },
          { en:'Overtime next week to catch up',    am:'በሚቀጥለው ሳምንት በትርፍ ሰዓት ይካካሳል' }
        ], show:{f:'w_total', when:'miss'}},
      {id:'w_ext', en:'For external customers', am:'ለውጭ ደንበኞች', t:'num', auto:{week:'p_ext'}, i:1},
      {id:'w_rove', en:'For Rovestone', am:'ለሮቭስቶን', t:'num', auto:{week:'p_rove'}, i:1},
      {id:'w_rep_days', en:'On how many days did you report this week?', am:'በዚህ ሳምንት በስንት ቀን ሪፖርት አደረጉ?', t:'num', auto:{weekDays:1}, i:1},
      {id:'w_avg', en:'What was the average production per working day, in m²?', am:'በአንድ የሥራ ቀን አማካይ ምርቱ ስንት ካሬ ሜትር ነበር?', t:'num',
        auto:{div:['w_total', 'w_rep_days']},
        tgt:{op:'gte', v:40, en:'Daily target 40 m²', am:'የቀን ዒላማ 40 ካሬ ሜትር'}},
      {id:'w_best', en:'What was the best day\'s output, in m²?', am:'የተሻለው ቀን ምርት ስንት ካሬ ሜትር ነበር?', t:'num',
        auto:{week:'p_total', how:'max'}},
      {id:'w_worst', en:'What was the worst day\'s output, in m²?', am:'ዝቅተኛው ቀን ምርት ስንት ካሬ ሜትር ነበር?', t:'num',
        auto:{week:'p_total', how:'min'}}
    ]},
    /* the one thing asked of every week that pays him: each job finished
       with no rework and no QC failure is 1,000 Birr (js/rules.js
       amaha-job-completion reads the rows; the register reads them too) */
    { en:'Jobs finished', am:'የተጠናቀቁ ሥራዎች', fields:[
      {id:'j_done_any', en:'Did any job finish this week? (Each one with no rework and no QC failure can earn you 1,000 Birr.)', am:'በዚህ ሳምንት የተጠናቀቀ ሥራ አለ? (ያለ ዳግም ሥራና የጥራት ፍተሻ ሳይወድቅ ያለቀ እያንዳንዱ ሥራ 1,000 ብር ሊያስገኝልዎ ይችላል።)', t:'yesno', auto:{all:'j_done_list.code'}, yes:{en:'Jobs finished', am:'ያለቀ ሥራ አለ'}, no:{en:'None finished', am:'ያለቀ ሥራ የለም'}},
      {id:'j_done_list', en:'Which jobs finished?', am:'የተጠናቀቁት የትኞቹ ሥራዎች ናቸው?', t:'table', auto:{weekRows:'p_jobs', from:'amaha-daily', when:{col:'st', is:'done'}, map:{code:'code'}}, addEn:'Add a job', addAm:'ሥራ ጨምር',

        cols:[
          {id:'code', en:'Job code', am:'የሥራ ኮድ', t:'text'},
          {id:'m2', en:'m²', am:'ካሬ ሜትር', t:'num'},
          {id:'rework', en:'Any rework', am:'ዳግም ሥራ ነበረው', t:'yesno', yes:{en:'Had rework', am:'ዳግም ሥራ ነበረው'}, no:{en:'No rework', am:'ዳግም ሥራ አልነበረውም'}},
          {id:'qcfail', en:'Failed QC', am:'የጥራት ፍተሻ አላለፈም', t:'yesno', yes:{en:'Failed QC', am:'ፍተሻ አላለፈም'}, no:{en:'Passed QC', am:'ፍተሻ አልፏል'}}
        ]},
      {id:'j_done', en:'How many jobs were completed this week?', am:'በዚህ ሳምንት ስንት ሥራዎች ተጠናቀቁ?', t:'num',
        auto:{rows:'j_done_list'}, sumEn:'completed', sumAm:'ተጠናቀዋል'},
      /* the two counts and the bonus used to be typed beside the list that
         holds them; they are counted from its rows now */
      {id:'j_zero', en:'How many of them needed zero rework?', am:'ከነዚህ ስንቱ ምንም ዳግም ሥራ አልጠየቁም?', t:'num',
        auto:{rows:'j_done_list', when:{col:'rework', is:'no'}}, sumEn:'with no rework', sumAm:'ዳግም ሥራ ያልነበራቸው'},
      {id:'j_fail', en:'How many of them failed QC at any point?', am:'ከነዚህ ስንቱ በማንኛውም ደረጃ የጥራት ፍተሻ አላለፉም?', t:'num',
        auto:{rows:'j_done_list', when:{col:'qcfail', is:'yes'}}, sumEn:'failed QC', sumAm:'የጥራት ፍተሻ አላለፉም',
        tgt:{op:'lte', v:0, en:'Each one cancels that job’s 1,000 Birr bonus', am:'እያንዳንዱ የዚያን ሥራ 1,000 ብር ጉርሻ ይሰርዛል'}},
      /* rows with no rework and no QC failure × 1,000 Birr — the engine has
         no "times", so it divides by a thousandth. A later complaint about
         the job can still cancel its line (the rule's note). */
      {id:'j_bonus', en:'How much job completion bonus did this week\'s jobs earn, in Birr?', am:'የዚህ ሳምንት ሥራዎች ስንት ብር የሥራ ማጠናቀቂያ ጉርሻ አስገኙ?', t:'money',
        auto:{div:[{rows:'j_done_list', when:[{col:'rework', is:'no'}, {col:'qcfail', is:'no'}]}, 0.001]}}
    ]},
    /* THE ONE LIST. Ten questions used to stand in sections of their own —
       broke down, failed QC, late more than once, absent more than once,
       hurt, waste violations, cleaning issues, made or sent out without the
       four confirmations — and on a week when none of it happened that was
       ten answers, which is why they were left empty. */
    { en:'Anything else this week?', am:'በዚህ ሳምንት ሌላ የሆነ ነገር አለ?', fields:[
      {id:'wk_events', en:'What else happened in the factory this week?', am:'በዚህ ሳምንት ፋብሪካው ውስጥ ሌላ ምን ሆነ?', t:'multi', auto:{weekPicks:'p_events', from:'amaha-daily', map:{hurt:'hurt', m_stop:'m_stop', not_kept:'waste_rule', not_rec:'waste_rule', not_stack:'waste_rule', thrown:'waste_rule', floor:'clean', mach_dirty:'clean', tools:'clean', bins:'clean', unauth:['u_prod', 'u_disp']}},
        none:{ en:'Nothing — a normal week', am:'ምንም — የተለመደ ሳምንት' },
        groups:[
          { v:'people', en:'Workers',            am:'ሠራተኞች' },
          { v:'mach',   en:'Machines',           am:'ማሽኖች' },
          { v:'qual',   en:'Quality',            am:'ጥራት' },
          { v:'mat',    en:'Material and waste', am:'ዕቃና ብክነት' },
          { v:'clean',  en:'Cleaning',           am:'ጽዳት' },
          { v:'rule',   en:'Rules',              am:'ደንብ' }
        ],
        opts:[
          { v:'late_rep',   g:'people', en:'A worker came late more than once',   am:'ከአንድ ጊዜ በላይ የዘገየ ሠራተኛ ነበር' },
          { v:'absent_rep', g:'people', en:'A worker was absent more than once',  am:'ከአንድ ጊዜ በላይ የቀረ ሠራተኛ ነበር' },
          { v:'hurt',       g:'people', en:'Someone was hurt at work',            am:'በሥራ ላይ የተጎዳ ሰው ነበር' },
          { v:'m_stop',     g:'mach',   en:'A machine broke down',                am:'ማሽን ተበላሸ' },
          { v:'qc_fail',    g:'qual',   en:'A job failed QC',                     am:'የጥራት ፍተሻ ያላለፈ ሥራ ነበር' },
          { v:'waste_rule', g:'mat',    en:'Waste was not sorted, not written down, or thrown away', am:'የተረፈ ቁሳቁስ አልተለየም፣ አልተመዘገበም ወይም ተጣለ' },
          { v:'figures',    g:'mat',    en:'The week\'s BOM, scrap or waste cost was counted', am:'የሳምንቱ የዕቃ ዝርዝር፣ ቁርጥራጭ ወይም የብክነት ወጪ ተቆጥሯል' },
          { v:'clean',      g:'clean',  en:'Cleaning problems were found',        am:'የጽዳት ችግሮች ተገኙ' },
          { v:'u_prod',     g:'rule',   en:'Something was made without all four confirmations', am:'አራቱ ማረጋገጫዎች ሳይሟሉ የተሠራ ነገር ነበር' },
          { v:'u_disp',     g:'rule',   en:'Something left the factory without all four confirmations', am:'አራቱ ማረጋገጫዎች ሳይሟሉ ከፋብሪካ የወጣ ነገር ነበር' }
        ]}
    ]},
    { en:'Machines', am:'ማሽኖች', fields:[
      {id:'m_break', en:'How many breakdowns were there this week?', am:'በዚህ ሳምንት ስንት ብልሽቶች ተከሰቱ?', t:'num',
        auto:{week:'m_breaks'}},
      {id:'m_down', en:'How many hours were lost to downtime in total?', am:'በድምሩ ስንት ሰዓት በብልሽት ጠፋ?', t:'num',
        auto:{week:'m_downhrs'}},
      /* the uptime bonus (and the team's uptime tiers) read this every
         month, so it stays asked; nobody times the machines, so a plain
         estimate is what can honestly be given */
      {id:'m_uptime', en:'About what share of working hours did the machines run this week, in %? (100 if no machine stopped. Your best guess is fine.)', am:'በዚህ ሳምንት ማሽኖቹ ከሥራ ሰዓቱ በግምት ስንት % ሠሩ? (ምንም ማሽን ካልቆመ 100። ግምትዎ በቂ ነው።)', t:'pct',
        tgt:{op:'gte', v:95, en:'≥95% earns the 2,000 Birr uptime bonus', am:'≥95% የ2,000 ብር ጉርሻ ያስገኛል'}},
      {id:'m_break_any', en:'Did any machine break down this week?', am:'በዚህ ሳምንት የተበላሸ ማሽን አለ?', t:'yesno', quiet:1, auto:{picked:'wk_events', v:'m_stop'}},
      /* the 30-minute fine (amaha-breakdown-unreported) reads the "told"
         column of these rows, so the list stays */
      {id:'m_break_list', en:'Each breakdown this week', am:'የዚህ ሳምንት እያንዳንዱ ብልሽት', t:'table', auto:{weekRows:'m_rows', from:'amaha-daily', when:{col:'name'}, map:{name:'machine', down:'hours', cause:'cause'}}, addEn:'Add a breakdown', addAm:'ብልሽት ጨምር',
        show:{f:'m_break_any', when:'yes'},
        cols:[
          {id:'machine', en:'Machine', am:'ማሽን', t:'choice', opts:[
            {v:'Width cutter',  en:'Width cutter',  am:'የወርድ መቁረጫ'},
            {v:'Length cutter', en:'Length cutter', am:'የርዝመት መቁረጫ'},
            {v:'Edge bander',   en:'Edge bander',   am:'ጠርዝ ማሰሪያ'},
            {v:'Hinge driller', en:'Hinge driller', am:'የማጠፊያ መብሻ'},
            {v:'Compressor',    en:'Compressor',    am:'ኮምፕረሰር'},
            {v:'Other',         en:'Other',         am:'ሌላ'}
          ]},
          {id:'hours', en:'Hours down', am:'የቆመበት ሰዓት', t:'num'},
          {id:'cause', en:'Cause', am:'ምክንያት', t:'text', picks:COL_MACHINE},
          {id:'told', en:'Mahelet told within 30 min', am:'በ30 ደቂቃ ለማህሌት ተነግሯል', t:'yesno', yes:{en:'Told within 30 minutes', am:'በ30 ደቂቃ ተነግሯታል'}, no:{en:'Later, or not at all', am:'ዘግይቶ ወይም አልተነገራትም'}}
        ]}
    ]},
    { en:'Workers', am:'ሠራተኞች', fields:[
      {id:'a_rate', en:'What was the average attendance this week, in %?', am:'በዚህ ሳምንት አማካይ የተገኝነት መጠን ስንት % ነበር?', t:'pct',
        auto:{pct:[{week:'mp_present'}, {week:'mp_assigned'}]},
        tgt:{op:'gte', v:95, en:'≥95% earns 2,000 + 3,000 Birr in bonuses', am:'≥95% የ2,000 + 3,000 ብር ጉርሻ ያስገኛል'}},
      /* the daily files a real 0 on a normal day now (mp_behave, zero:1),
         so the week's count adds itself up */
      {id:'a_behave', en:'How many behaviour problems were there this week?', am:'በዚህ ሳምንት ስንት የባህርይ ችግሮች ነበሩ?', t:'num',
        auto:{week:'mp_behave'},
        tgt:{op:'lte', v:0, en:'Zero is required for the 3,000 Birr bonus', am:'ለ3,000 ብር ጉርሻ 0 መሆን አለበት'}},
      {id:'a_behave_what', en:'What happened, and what was done? (Write who in the box.)', am:'ምን ሆነ? ምን እርምጃ ተወሰደ? (ማን እንደሆነ በሳጥኑ ይጻፉ።)', t:'area', auto:{weekText:'mp_behave_what', from:'amaha-daily'},
        picks:[
          { en:'Argument or fight',          am:'ጭቅጭቅ ወይም ጠብ' },
          { en:'Refused the work',           am:'ሥራውን አልሠራም አለ' },
          { en:'Phone or music at work',     am:'በሥራ ላይ ስልክ ወይም ሙዚቃ' },
          { en:'Left early',                 am:'ቀድሞ ወጣ' },
          { en:'Warned',                     am:'ማስጠንቀቂያ ተሰጠ' },
          { en:'Mahelet was told',           am:'ለማህሌት ተነግሯል' }
        ], show:{f:'a_behave', when:'pos'}},
      /* who was late or away more than once is in no single daily answer —
         it takes the names across the week — so it is still asked, but only
         after a tap, and a normal week files 0 */
      /* no daily report says this, so the built weekly leaves it blank —
         it was filed as 0 every week (the bug hunt, 15 Oct 2026) */
      {id:'a_late', en:'How many workers came late more than once this week?', am:'በዚህ ሳምንት ከአንድ ጊዜ በላይ የዘገዩ ስንት ሠራተኞች ናቸው?', t:'num'},
      {id:'a_late_who', en:'What was done? (Write the names and how many times in the box.)', am:'ምን እርምጃ ተወሰደ? (ስማቸውንና ስንት ጊዜ እንደሆነ በሳጥኑ ይጻፉ።)', t:'area',
        picks:[
          { en:'Warned',                     am:'ማስጠንቀቂያ ተሰጠ' },
          { en:'Fined',                      am:'ቅጣት ተጣለ' },
          { en:'Mahelet was told',           am:'ለማህሌት ተነግሯል' },
          { en:'They had a good reason',     am:'በቂ ምክንያት ነበራቸው' },
          { en:'Nothing done yet',           am:'ገና ምንም አልተደረገም' }
        ], show:{f:'a_late', when:'pos'}},
      {id:'a_absent', en:'How many workers were absent more than once this week?', am:'በዚህ ሳምንት ከአንድ ጊዜ በላይ የቀሩ ስንት ሠራተኞች ናቸው?', t:'num'},
      {id:'a_absent_who', en:'Was Mahelet told? (Write the names and how many days in the box.)', am:'ለማህሌት ተነግሯል? (ስማቸውንና ስንት ቀን እንደሆነ በሳጥኑ ይጻፉ።)', t:'area',
        picks:[
          { en:'Mahelet was told',           am:'ለማህሌት ተነግሯል' },
          { en:'Not told to Mahelet yet',    am:'ለማህሌት ገና አልተነገረም' },
          { en:'With permission',            am:'በፈቃድ ነበር' },
          { en:'Sick',                       am:'ታመው ነበር' },
          { en:'Warned',                     am:'ማስጠንቀቂያ ተሰጠ' }
        ], show:{f:'a_absent', when:'pos'}},
      {id:'a_safety', en:'Was anyone hurt at work this week?', am:'በዚህ ሳምንት በሥራ ላይ የተጎዳ ሰው ነበር?', t:'yesno', quiet:1, auto:{picked:'wk_events', v:'hurt'}},
      {id:'a_safety_what', en:'What happened, and were working days lost? (Write who in the box.)', am:'ምን ሆነ? የሥራ ቀን ጠፍቷል? (ማን እንደሆነ በሳጥኑ ይጻፉ።)', t:'area', auto:{weekText:'mp_safety_what', from:'amaha-daily'},
        picks:[
          { en:'Small cut — first aid given',      am:'ትንሽ መቆረጥ — የመጀመሪያ ሕክምና ተሰጠ' },
          { en:'Went to the clinic',               am:'ወደ ክሊኒክ ሄደ' },
          { en:'No working day lost',              am:'የጠፋ የሥራ ቀን የለም' },
          { en:'Working days were lost',           am:'የሥራ ቀን ጠፍቷል' },
          { en:'Safety gear is worn now',          am:'አሁን መከላከያ ይለበሳል' },
          { en:'Mahelet was told',                 am:'ለማህሌት ተነግሯል' }
        ], show:{f:'a_safety', when:'yes'}}
    ]},
    { en:'Quality', am:'ጥራት', fields:[
      {id:'q_checked', en:'How many jobs went through QC this week?', am:'በዚህ ሳምንት ስንት ሥራዎች የጥራት ፍተሻ ተደረገላቸው?', t:'num',
        auto:{week:'qc_checked'}},
      {id:'q_pass', en:'How many passed?', am:'ስንቱ አለፉ?', t:'num', auto:{week:'qc_pass'}},
      {id:'q_fail', en:'How many failed?', am:'ስንቱ አላለፉም?', t:'num', auto:{week:'qc_fails'}},
      {id:'q_fail_any', en:'Did any job fail QC this week?', am:'በዚህ ሳምንት የጥራት ፍተሻ ያላለፈ ሥራ አለ?', t:'yesno', auto:{all:'q_fail_list.code'}, quiet:1,},
      {id:'q_fail_list', en:'Which jobs failed, and why?', am:'ያላለፉት የትኞቹ ሥራዎች ናቸው? ለምን?', t:'table', auto:{weekRows:'i_jobs', from:'wude-daily', when:{col:'pass', is:'no'}, map:{code:'code', why:'why'}}, addEn:'Add a job', addAm:'ሥራ ጨምር',

        cols:[
          {id:'code', en:'Job code', am:'የሥራ ኮድ', t:'text'},
          {id:'why', en:'Why it failed', am:'ያላለፈበት ምክንያት', t:'text', picks:COL_DEFECT},
          {id:'fixed', en:'Fixed and passed', am:'ተስተካክሎ አልፏል', t:'yesno', yes:{en:'Fixed and passed', am:'ተስተካክሎ አልፏል'}, no:{en:'Not passed yet', am:'ገና አላለፈም'}}
        ]},
      {id:'q_rate', en:'What was the QC pass rate this week?', am:'በዚህ ሳምንት ስንት በመቶው የጥራት ፍተሻ አለፈ?', t:'pct',
        auto:{pct:['q_pass', 'q_checked']},
        tgt:{op:'gte', v:98, en:'≥98% earns the 5,000 Birr quality bonus', am:'≥98% የ5,000 ብር የጥራት ጉርሻ ያስገኛል'}},
      {id:'q_defects', en:'How many defects were found this week?', am:'በዚህ ሳምንት ስንት ጉድለቶች ተገኙ?', t:'num', auto:{week:'qc_defects'}},
      {id:'q_defects_what', en:'Where did this week\'s defects start, and did any reach finished goods? (Write what they were in the box.)', am:'የዚህ ሳምንት ጉድለቶች ከየት ጀመሩ? ወደ ዝግጁ ዕቃ የገባ አለ? (ምን እንደነበሩ በሳጥኑ ይጻፉ።)', t:'area',
        picks:[
          { en:'Cutting',                          am:'ቁረጣ' },
          { en:'Edge banding',                     am:'ጠርዝ ማሰር' },
          { en:'Drilling',                         am:'ቀዳዳ መብሳት' },
          { en:'Assembly',                         am:'መገጣጠም' },
          { en:'Handling — scratches or knocks',   am:'አያያዝ — ጭረት ወይም መመታት' },
          { en:'The board came damaged',           am:'ሰሌዳው ተጎድቶ መጣ' },
          { en:'None reached finished goods',      am:'ወደ ዝግጁ ዕቃ የገባ የለም' },
          { en:'Some reached finished goods',      am:'ወደ ዝግጁ ዕቃ የገባ አለ' }
        ], show:{f:'q_defects', when:'pos'}}
    ]},
    { en:'Waste and material', am:'ብክነትና ዕቃ', fields:[
      {id:'w_avgpct', en:'What was the average waste this week, in %?', am:'በዚህ ሳምንት አማካይ ብክነቱ ስንት % ነበር?', t:'pct',
        auto:{week:'w_pct', how:'avg'},
        tgt:{op:'lte', v:20, en:'Must not exceed 20%', am:'ከ20% መብለጥ የለበትም'}},
      {id:'w_days', en:'On how many days was waste above 20%?', am:'ብክነቱ ከ20% በላይ የሆነው በስንት ቀናት ነው?', t:'num',
        auto:{week:'w_pct', how:'over', over:20},
        tgt:{op:'lte', v:0, en:'Should be 0', am:'0 መሆን አለበት'}},
      {id:'w_days_why', en:'Waste went over 20% on some days. Why? (Write the days and jobs in the box.)', am:'በአንዳንድ ቀናት ብክነቱ ከ20% በላይ ሆነ። ለምን? (ቀናቱንና ሥራዎቹን በሳጥኑ ይጻፉ።)', t:'area', auto:{weekText:'w_pct_why', from:'amaha-daily'},
        picks:[
          { en:'Cutting mistakes',                 am:'የመቁረጥ ስህተት' },
          { en:'A poor cutting plan',              am:'ጥሩ ያልሆነ የመቁረጫ ዕቅድ' },
          { en:'Damaged board',                    am:'የተበላሸ ሰሌዳ' },
          { en:'A machine problem',                am:'የማሽን ችግር' },
          { en:'Pieces too small to use',          am:'ለመጠቀም በጣም ትናንሽ ቁርጥራጮች' },
          { en:'The design changed',               am:'ዲዛይኑ ተቀየረ' }
        ], show:{f:'w_days', when:'pos'}},
      {id:'s_total', en:'How much was saved this week, in Birr?', am:'በዚህ ሳምንት ስንት ብር ተቆጠበ?', t:'money', auto:{week:'sav_today'}},
      {id:'s_how', en:'Where did the savings come from, and has QC confirmed no quality was lost?', am:'ቁጠባው ከየት መጣ? ጥራቱ እንዳልቀነሰ ውዱ አረጋግጣለች?', t:'area', auto:{weekText:'sav_how', from:'amaha-daily'},
        picks:[
          { en:'A better cutting plan',              am:'የተሻለ የመቁረጫ ዕቅድ' },
          { en:'Offcuts were used',                  am:'ቁርጥራጮች ተጠቅመናል' },
          { en:'Fewer mistakes',                     am:'ስህተት ቀንሷል' },
          { en:'Wude (QC) confirmed — quality is fine', am:'ውዱ አረጋግጣለች — ጥራቱ ደህና ነው' },
          { en:'Wude (QC) has not confirmed yet',    am:'ውዱ ገና አላረጋገጠችም' }
        ], show:{f:'s_total', when:'pos'}},
      {id:'ws_stored', en:'How many m² of reusable offcuts went to store this week?', am:'በዚህ ሳምንት ስንት ካሬ ሜትር እንደገና የሚያገለግሉ ቁርጥራጮች ወደ መጋዘን ገቡ?', t:'num',
        auto:{week:'p_off'}},
      /* figures nobody on the floor keeps and no rule reads (the quality
         reader takes the waste cost when it is there): asked only when he
         says they were counted */
      {id:'w_cost', en:'What did the week\'s waste cost, in Birr? (If you know it.)', am:'የሳምንቱ ብክነት ስንት ብር አስወጣ? (ካወቁ።)', t:'money', opt:1,
        show:{f:'wk_events', when:'has', v:'figures'}},
      {id:'s_bom', en:'What was the total BOM quantity for this week\'s jobs? (If you know it.)', am:'የዚህ ሳምንት ሥራዎች ጠቅላላ በዝርዝሩ ያለው መጠን ስንት ነበር? (ካወቁ።)', t:'num', opt:1,
        show:{f:'wk_events', when:'has', v:'figures'}},
      {id:'s_used', en:'And how much was actually used? (In the same unit.)', am:'በትክክል የዋለውስ ስንት ነው? (በዚያው መለኪያ።)', t:'num', opt:1,
        show:{f:'wk_events', when:'has', v:'figures'}},
      {id:'s_pct', en:'What % of the BOM was saved?', am:'ከዕቃ ዝርዝሩ ስንት % ተቆጠበ?', t:'pct',
        auto:{pct:[{minus:['s_bom', 's_used']}, 's_bom']},
        show:{f:'wk_events', when:'has', v:'figures'}},
      {id:'ws_scrap', en:'How much scrap was written down this week? (If you know it.)', am:'በዚህ ሳምንት ምን ያህል የተረፈ ቁሳቁስ ተመዘገበ? (ካወቁ።)', t:'num', opt:1,
        show:{f:'wk_events', when:'has', v:'figures'}},
      {id:'ws_viol', en:'How many times was waste not sorted, not written down, or thrown away?', am:'የተረፈ ቁሳቁስ ስንት ጊዜ አልተለየም፣ አልተመዘገበም ወይም ተጣለ?', t:'num', auto:{plus:[{week:'ws_reuse', how:'nodays', from:'amaha-daily'}, {week:'ws_rec', how:'nodays', from:'amaha-daily'}, {week:'ws_stack', how:'nodays', from:'amaha-daily'}, {week:'ws_thrown', how:'yesdays', from:'amaha-daily'}]}, zero:1,
        show:{f:'wk_events', when:'has', v:'waste_rule'},
        tgt:{op:'lte', v:0, en:'–300 to –500 Birr each', am:'እያንዳንዱ ከ–300 እስከ –500 ብር'}},
      {id:'ws_viol_what', en:'What happened? (Write who in the box.)', am:'ምን ሆነ? (ማን እንደሆነ በሳጥኑ ይጻፉ።)', t:'area',
        picks:[
          { en:'Good offcuts were not kept apart', am:'የሚጠቅሙ ቁርጥራጮች ተለይተው አልተቀመጡም' },
          { en:'Scrap was not written down',       am:'የተረፈው ቁሳቁስ አልተመዘገበም' },
          { en:'Scrap was not stacked in its place', am:'የተረፈው ቁሳቁስ በቦታው አልተከመረም' },
          { en:'Usable material was thrown away',  am:'የሚጠቅም ዕቃ ተጣለ' },
          { en:'The worker was warned',            am:'ሠራተኛው ማስጠንቀቂያ ተሰጠው' }
        ], show:{f:'ws_viol', when:'pos'}}
    ]},
    { en:'Cleaning', am:'ጽዳት', fields:[
      /* the 5S fine and the cleaning bonus read this every week, so it stays
         asked; no auditor is named in his letter, so the score is his own */
      {id:'c_5s', en:'What was this week\'s 5S audit score, in %? Your best guess is fine.', am:'የዚህ ሳምንት የንጽሕናና የሥርዓት ፍተሻ (5S) ውጤት ስንት % ነበር? ግምትዎ በቂ ነው።', t:'pct', auto:{week:'c_5s', how:'min', from:'amaha-daily'},
        tgt:{op:'gte', v:80, en:'≥80% earns the 2,000 Birr cleaning bonus', am:'≥80% የ2,000 ብር የጽዳት ጉርሻ ያስገኛል'}},
      {id:'c_5s_why', en:'Which areas failed, and by when will they be fixed? (Write what is being fixed in the box.)', am:'ያልተሳኩት የትኞቹ ቦታዎች ናቸው? እስከ መቼ ይስተካከላሉ? (ምን እየተስተካከለ እንደሆነ በሳጥኑ ይጻፉ።)', t:'area', auto:{weekText:'c_5s_why', from:'amaha-daily'},
        picks:[
          { en:'Cutting area',                     am:'የመቁረጫ ቦታ' },
          { en:'Edge banding area',                am:'የጠርዝ ማሰሪያ ቦታ' },
          { en:'Assembly area',                    am:'የመገጣጠሚያ ቦታ' },
          { en:'Scrap corner',                     am:'የቁርጥራጭ ቦታ' },
          { en:'Machines',                         am:'ማሽኖች' },
          { en:'Tools',                            am:'መሣሪያዎች' },
          { en:'Fixed by Monday',                  am:'እስከ ሰኞ ይስተካከላል' },
          { en:'Fixed next week',                  am:'በሚቀጥለው ሳምንት ይስተካከላል' }
        ], show:{f:'c_5s', when:'miss'}},
      /* the cleaning bonus needs this at 0 every week: asked after a tap,
         and a normal week files that 0 */
      {id:'c_issues', en:'How many cleaning problems were found this week?', am:'በዚህ ሳምንት ስንት የጽዳት ችግሮች ተገኙ?', t:'num', auto:{plus:[{week:'c_floor', how:'nodays', from:'amaha-daily'}, {week:'c_mach', how:'nodays', from:'amaha-daily'}, {week:'c_tools', how:'nodays', from:'amaha-daily'}, {week:'c_waste', how:'nodays', from:'amaha-daily'}]}, zero:1,
        show:{f:'wk_events', when:'has', v:'clean'}},
      {id:'c_issues_what', en:'What were they? (Write where in the box.)', am:'ችግሮቹ ምን ነበሩ? (የት እንደሆነ በሳጥኑ ይጻፉ።)', t:'area',
        picks:[
          { en:'Floor not swept',                  am:'ወለሉ አልተጠረገም' },
          { en:'Machines not cleaned',             am:'ማሽኖች አልጸዱም' },
          { en:'Tools not put back',               am:'መሣሪያዎች ቦታቸው አልተመለሱም' },
          { en:'Bins not emptied',                 am:'የቆሻሻ መጣያዎች አልተደፉም' },
          { en:'Scrap area untidy',                am:'የቁርጥራጭ ቦታው ዝርክርክ ነበር' }
        ], show:{f:'c_issues', when:'pos'}}
    ]},
    { en:'Without the four confirmations', am:'አራቱ ማረጋገጫዎች ሳይሟሉ', fields:[
      {id:'u_prod', en:'Was anything produced this week without all four confirmations?', am:'በዚህ ሳምንት አራቱም ማረጋገጫዎች ሳይሟሉ የተመረተ ነገር ነበር?', t:'yesno', quiet:1, auto:{picked:'wk_events', v:'u_prod'}},
      {id:'u_disp', en:'Did anything leave the factory this week without all four confirmations?', am:'በዚህ ሳምንት አራቱም ማረጋገጫዎች ሳይሟሉ ከፋብሪካ የወጣ ነገር ነበር?', t:'yesno', quiet:1, auto:{picked:'wk_events', v:'u_disp'}},
      {id:'u_det', en:'Was it reported to Mahelet within 1 hour? (Write the job, what it was, and by whom in the box.)', am:'በ1 ሰዓት ውስጥ ለማህሌት ተነግሯል? (ሥራውን፣ ምን እንደሆነና በማን በሳጥኑ ይጻፉ።)', t:'area', auto:{weekText:'u_what', from:'amaha-daily'}, one:1,
        picks:[
          { en:'Told to Mahelet within 1 hour',    am:'በ1 ሰዓት ውስጥ ለማህሌት ተነግሯል' },
          { en:'Told to Mahelet later',            am:'ቆይቶ ለማህሌት ተነግሯል' },
          { en:'Not told to Mahelet',              am:'ለማህሌት አልተነገረም' }
        ], show:{f:'wk_events', when:'has', v:['u_prod', 'u_disp']}}
    ]},
    { en:'Problems and help', am:'ችግርና እርዳታ', fields:[
      {id:'problem', en:'What was the biggest problem this week, and what caused it?', am:'የዚህ ሳምንት ትልቁ ችግር ምን ነበር? ምክንያቱስ?', t:'area', auto:{weekText:'problem', from:'amaha-daily'}, opt:1,
        picks:[
          { en:'No big problem this week',          am:'በዚህ ሳምንት ትልቅ ችግር አልነበረም' },
          { en:'Material was not in the store',     am:'ዕቃው መጋዘን ውስጥ አልነበረም' },
          { en:'A machine broke down',              am:'ማሽን ተበላሸ' },
          { en:'Power cuts',                        am:'መብራት ጠፋ' },
          { en:'Workers were absent',               am:'ሠራተኞች ቀሩ' },
          { en:'Design or cutting lists came late', am:'ዲዛይን ወይም የመቁረጫ ዝርዝር ዘገየ' },
          { en:'Rework took the time',              am:'የተመለሰ ሥራ ጊዜ ወሰደ' },
          { en:'Waiting for QC',                    am:'የጥራት ፍተሻ ጠበቅን' }
        ]},
      {id:'outstanding', en:'What is still open? (Write who owns it and by when in the box.)', am:'ያልተፈታው ምንድን ነው? (ኃላፊውንና እስከ መቼ እንደሆነ በሳጥኑ ይጻፉ።)', t:'area', opt:1,
        picks:[
          { en:'Nothing is open',                   am:'ያልተፈታ ነገር የለም' },
          { en:'A machine repair',                  am:'የማሽን ጥገና' },
          { en:'Material on order',                 am:'የታዘዘ ዕቃ' },
          { en:'Rework still to do',                am:'ያልተሠራ ዳግም ሥራ' },
          { en:'A worker matter',                   am:'የሠራተኛ ጉዳይ' },
          { en:'A job running late',                am:'የዘገየ ሥራ' }
        ]},
      {id:'w_well', en:'What went well this week that should be repeated?', am:'በዚህ ሳምንት በደንብ የሠራና ሊደገም የሚገባው ምንድን ነው?', t:'area', opt:1,
        picks:[
          { en:'The target was reached',            am:'ዒላማው ተሳካ' },
          { en:'No machine stopped',                am:'ምንም ማሽን አልቆመም' },
          { en:'Less waste',                        am:'ብክነት ቀነሰ' },
          { en:'Everyone came on time',             am:'ሁሉም በሰዓቱ ገባ' },
          { en:'Jobs finished with no rework',      am:'ሥራዎች ያለ ዳግም ሥራ ተጠናቀቁ' },
          { en:'The factory stayed clean',          am:'ፋብሪካው ንጹህ ነበር' }
        ]},
      {id:'need_lead', en:'Do you need a decision from Mahelet?', am:'የማህሌት ውሳኔ ያስፈልግዎታል?', t:'yesno', auto:{week:'need_lead', how:'anyyes', from:'amaha-daily'}, yes:{en:'I need a decision', am:'ውሳኔ ያስፈልገኛል'}, no:{en:'No decision needed', am:'ውሳኔ አያስፈልገኝም'}},
      {id:'need_lead_what', en:'What should Mahelet decide, and by when?', am:'ማህሌት ምን መወሰን አለባት? እስከ መቼ?', t:'area', auto:{weekText:'need_lead_what', from:'amaha-daily'},
        picks:[
          { en:'Which job goes first',              am:'የትኛው ሥራ ይቅደም' },
          { en:'Overtime',                          am:'የትርፍ ሰዓት' },
          { en:'An urgent purchase',                am:'አስቸኳይ ግዢ' },
          { en:'A worker matter',                   am:'የሠራተኛ ጉዳይ' },
          { en:'A machine repair',                  am:'የማሽን ጥገና' },
          { en:'A design question',                 am:'የዲዛይን ጥያቄ' }
        ], show:{f:'need_lead', when:'yes'}}
    ]},
    { en:'Next week', am:'የሚቀጥለው ሳምንት', fields:[
      {id:'n_target', en:'Next week\'s target in m², if it is not the usual 240', am:'የሚቀጥለው ሳምንት ዒላማ በካሬ ሜትር — የተለመደው 240 ካልሆነ', t:'num', opt:1},
      {id:'n_jobs', en:'Which jobs must finish next week? (Job codes are enough.)', am:'በሚቀጥለው ሳምንት መጠናቀቅ ያለባቸው የትኞቹ ሥራዎች ናቸው? (የሥራ ኮድ በቂ ነው።)', t:'area', opt:1},
      {id:'n_sav', en:'Next week\'s material savings target, in Birr (if Mahelet set one)', am:'የሚቀጥለው ሳምንት የቁሳቁስ ቁጠባ ዒላማ በብር (ማህሌት ካስቀመጠች)', t:'money', opt:1},
      {id:'n_support', en:'What do you need from Mahelet to hit it?', am:'ዒላማውን ለመምታት ከማህሌት ምን ያስፈልግዎታል?', t:'area', auto:{weekText:'need_help', from:'amaha-daily'}, opt:1, picks:NEED_HELP}
    ]}
  ]
},

/* =================== AMAHA — MONTHLY MATERIAL SAVINGS =================== */
{
  id:'amaha-monthly', person:'amaha', cadence:'monthly', dueTime:'17:00',
  en:'Monthly Material Savings Report', am:'ወርሃዊ የቁሳቁስ ቁጠባ ሪፖርት',
  toEn:'Mahelet + Selam', toAm:'ማህሌት + ሰላም',
  dueEn:'1st of the following month', dueAm:'በሚቀጥለው ወር 1ኛ ቀን',
  penEn:'Your savings share is 10% – 25% of the total', penAm:'ከጠቅላላው ቁጠባ ድርሻዎ ከ10% – 25% ነው',
  sections:[
    /* REBUILT 11 Oct 2026, the same way as his daily and weekly (the
       Chairman: "they are struggling so much with the questions"). Nine
       questions stood before any follow-up: a 5 × 4 grid of BOM figures
       nobody keeps, his share worked out by hand, and four yes/no answers
       about things that go wrong once a month. The month's savings are
       counted from his dailies; what went wrong is one tap on the list, and
       the yes/no answers the rulebook reads (m_over, compromise, m_scrap)
       are worked out from it ({picked:…}, quiet:1); the grid opens from the
       list when the month was counted against the BOM; every "why" is
       buttons. Wude's confirmation stays a question of its own — it is her
       word, not his, that the savings bonus waits on. Every answer key is
       the one it always was. */
    { en:'Savings this month', am:'የወሩ ቁጠባ', fields:[
      {id:'tot_sav', en:'What were the total material savings this month, in Birr?', am:'በዚህ ወር ጠቅላላ የቁሳቁስ ቁጠባው ስንት ብር ነበር?', t:'money',
        auto:{week:'sav_today'},
        tgt:{op:'gte', v:50000, en:'Your share starts at 50,000 Birr', am:'ድርሻዎ የሚጀምረው ከ50,000 ብር ነው'}},
      /* the rulebook works the share out itself (amaha-material-savings);
         nothing reads this one */
      {id:'my_share', en:'What is your share at the tier the savings reach (10% – 25%)? (The office works it out — fill it only if you know it.)', am:'ቁጠባው በደረሰበት ደረጃ ድርሻዎ ስንት ነው (10% – 25%)? (ቢሮው ያሰላዋል — ካወቁ ብቻ ይሙሉ።)', t:'money', opt:1},
      {id:'m_best', en:'Where did the biggest savings come from, and how? (Write the job in the box.)', am:'ትልቁ ቁጠባ ከየት መጣ? እንዴት? (ሥራውን በሳጥኑ ይጻፉ።)', t:'area', opt:1,
        picks:[
          { en:'A better cutting plan',            am:'የተሻለ የመቁረጫ ዕቅድ' },
          { en:'Offcuts were used',                am:'ቁርጥራጮች ተጠቅመናል' },
          { en:'Fewer mistakes',                   am:'ስህተት ቀንሷል' },
          { en:'Less edge banding wasted',         am:'የጠርዝ ማሰሪያ ብክነት ቀነሰ' },
          { en:'No big saving this month',         am:'በዚህ ወር ትልቅ ቁጠባ አልነበረም' }
        ]}
    ]},
    { en:'Anything else this month?', am:'በዚህ ወር ሌላ የሆነ ነገር አለ?', fields:[
      {id:'mo_events', en:'What else happened with material this month?', am:'በዚህ ወር በዕቃ ላይ ሌላ ምን ሆነ?', t:'multi',
        none:{ en:'Nothing — a normal month', am:'ምንም — የተለመደ ወር' },
        opts:[
          { v:'over',       en:'A job used more than 5% over its BOM',          am:'ከዕቃ ዝርዝሩ ከ5% በላይ የተጠቀመ ሥራ ነበር' },
          { v:'compromise', en:'A saving made the quality worse',               am:'ቁጠባ ጥራቱን አበላሸ' },
          { v:'not_kept',   en:'Good offcuts were not always kept apart',       am:'የሚጠቅሙ ቁርጥራጮች ሁልጊዜ ተለይተው አልተቀመጡም' },
          { v:'not_rec',    en:'Some scrap was not written down',               am:'ያልተመዘገበ የተረፈ ቁሳቁስ ነበር' },
          { v:'thrown',     en:'Usable material was thrown away',               am:'የሚጠቅም ዕቃ ተጣለ' },
          { v:'bom',        en:'The month\'s material was counted against the BOM', am:'የወሩ ዕቃ ከዕቃ ዝርዝሩ ጋር ተቆጥሯል' }
        ]}
    ]},
    { en:'Over the BOM', am:'ከዕቃ ዝርዝሩ በላይ', fields:[
      /* the savings share needs "no"; "yes" is a clause 5 failure, and each
         row of the list below is fined by how far over it went */
      {id:'m_over', en:'Did any job go more than 5% over its BOM this month?', am:'በዚህ ወር ከዕቃ ዝርዝሩ ከ5% በላይ ዕቃ የፈጀ ሥራ ነበር?', t:'yesno', quiet:1, auto:{picked:'mo_events', v:'over'}},
      {id:'m_over_list', en:'Which jobs went over?', am:'የበለጡት የትኞቹ ሥራዎች ናቸው?', t:'table', addEn:'Add a job', addAm:'ሥራ ጨምር',
        show:{f:'m_over', when:'yes'},
        cols:[
          {id:'code', en:'Job code', am:'የሥራ ኮድ', t:'text'},
          {id:'mat', en:'Material', am:'ቁሳቁስ', t:'text'},
          {id:'pct', en:'% over BOM', am:'ከዕቃ ዝርዝሩ የበለጠው %', t:'num'},
          {id:'why', en:'Why', am:'ምክንያት', t:'text', picks:[{ en:'The design changed', am:'ዲዛይኑ ተቀየረ' }, { en:'Cut wrong and cut again', am:'በስህተት ተቆርጦ እንደገና ተቆረጠ' }, { en:'The BOM was wrong', am:'የዕቃ ዝርዝሩ ስህተት ነበረው' }, { en:'Damaged board', am:'የተበላሸ ሰሌዳ' }]}
        ]},
      /* twenty boxes nobody on the floor keeps; asked when he says the month
         was counted against the BOM */
      {id:'mat', en:'How did each material compare with the BOM this month? (If you counted.)', am:'በዚህ ወር እያንዳንዱ ዕቃ ከዕቃ ዝርዝሩ አንጻር እንዴት ነበር? (ከቆጠሩ።)', t:'grid', opt:1,
       show:{f:'mo_events', when:'has', v:'bom'},
       rows:[{en:'MDF', am:'MDF'},{en:'PVC edge', am:'የPVC ጠርዝ'},
             {en:'Hardware', am:'ሃርድዌር'},{en:'Accessories', am:'መለዋወጫዎች'},
             {en:'Other', am:'ሌላ'}],
       cols:[
        {id:'bom',  en:'BOM qty', am:'በዝርዝሩ ያለው መጠን', t:'num'},
        {id:'used', en:'Actual used', am:'የዋለው መጠን', t:'num'},
        {id:'cost', en:'Unit cost', am:'የአንዱ ዋጋ', t:'money'},
        {id:'sav',  en:'Savings (Birr)', am:'ቁጠባ (ብር)', t:'money'}
      ]}
    ]},
    { en:'Quality', am:'ጥራት', fields:[
      {id:'qc_rate', en:'What was the QC pass rate for the month?', am:'በዚህ ወር ስንት በመቶው የጥራት ፍተሻ አለፈ?', t:'pct',
        auto:{pct:[{week:'qc_pass'}, {week:'qc_checked'}]},
        tgt:{op:'gte', v:98, en:'Below 98% and the savings bonus is cancelled', am:'ከ98% በታች ከሆነ የቁጠባ ጉርሻ ይሰረዛል'}},
      {id:'qc_rate_why', en:'Under 98% cancels the savings bonus. What caused the failures?', am:'ከ98% በታች መሆኑ የቁጠባ ጉርሻውን ይሰርዛል። ውድቀቶቹን ያመጣው ምንድን ነው?', t:'area',
        picks:[
          { en:'Cutting mistakes',                 am:'የመቁረጥ ስህተት' },
          { en:'Edge banding',                     am:'ጠርዝ ማሰር' },
          { en:'Drilling',                         am:'ቀዳዳ መብሳት' },
          { en:'Assembly',                         am:'መገጣጠም' },
          { en:'Damaged board',                    am:'የተበላሸ ሰሌዳ' },
          { en:'Faulty hardware',                  am:'የተበላሸ ሃርድዌር' }
        ], show:{f:'qc_rate', when:'miss'}},
      {id:'compromise', en:'Did any saving cause a drop in quality?', am:'በቁጠባ ምክንያት የጥራት መቀነስ ተፈጥሯል?', t:'yesno', quiet:1, auto:{picked:'mo_events', v:'compromise'}},
      {id:'compromise_what', en:'What went wrong, and what was done? (Write the job in the box. The whole savings bonus is cancelled, and –5,000 Birr.)', am:'ምን ተበላሸ? ምን እርምጃ ተወሰደ? (ሥራውን በሳጥኑ ይጻፉ። የቁጠባ ጉርሻው በሙሉ ይሰረዛል፣ –5,000 ብር።)', t:'area',
        picks:[
          { en:'Weaker material was used',         am:'ደካማ ዕቃ ተጠቅመናል' },
          { en:'Fewer hinges, screws or edge',     am:'ማጠፊያ፣ ብሎን ወይም ጠርዝ ቀንሷል' },
          { en:'Offcut joins show',                am:'የቁርጥራጭ ቅጥያ ይታያል' },
          { en:'It was redone',                    am:'እንደገና ተሠራ' },
          { en:'Mahelet was told',                 am:'ለማህሌት ተነግሯል' }
        ], show:{f:'compromise', when:'yes'}},
      /* the savings share waits on Wude's word, so this is asked, not
         worked out from his list */
      {id:'wude_ok', en:'Has Wude (QC) confirmed that no saving cost any quality?', am:'ቁጠባው ጥራቱን እንዳልቀነሰ ውዱ አረጋግጣለች?', t:'yesno', yes:{en:'Wude confirmed it', am:'ውዱ አረጋግጣለች'}, no:{en:'Not confirmed', am:'ገና አላረጋገጠችም'}},
      {id:'wude_ok_why', en:'What is Wude\'s concern? (Write the jobs in the box.)', am:'የውዱ ስጋት ምንድን ነው? (ሥራዎቹን በሳጥኑ ይጻፉ።)', t:'area',
        picks:[
          { en:'She has not checked yet',          am:'ገና አልፈተሸችም' },
          { en:'The material was too weak',        am:'ዕቃው ደካማ ነበር' },
          { en:'The finish was not good enough',   am:'አጨራረሱ በቂ አልነበረም' },
          { en:'Hardware was missing',             am:'ሃርድዌር ጎድሏል' }
        ], show:{f:'wude_ok', when:'no'}}
    ]},
    { en:'Waste sorting', am:'የተረፈ ቁሳቁስ አያያዝ', fields:[
      {id:'m_offcuts', en:'Were all reusable offcuts stored properly this month?', am:'በዚህ ወር እንደገና የሚያገለግሉ ቁርጥራጮች በሙሉ በአግባቡ ተቀምጠዋል?', t:'yesno', quiet:1, auto:{picked:'mo_events', v:'not_kept', flip:1}},
      {id:'m_scrap', en:'Was all scrap recorded this month?', am:'በዚህ ወር የተረፈው ቁሳቁስ በሙሉ ተመዝግቧል?', t:'yesno', quiet:1, auto:{picked:'mo_events', v:'not_rec', flip:1}},
      {id:'m_viol', en:'What happened, and who was responsible? (Write who in the box.)', am:'ምን ሆነ? ኃላፊው ማን ነበር? (ማን እንደሆነ በሳጥኑ ይጻፉ።)', t:'area', opt:1,
        picks:[
          { en:'Good offcuts were not kept apart', am:'የሚጠቅሙ ቁርጥራጮች ተለይተው አልተቀመጡም' },
          { en:'Scrap was not written down',       am:'የተረፈው ቁሳቁስ አልተመዘገበም' },
          { en:'Scrap was not stacked in its place', am:'የተረፈው ቁሳቁስ በቦታው አልተከመረም' },
          { en:'Usable material was thrown away',  am:'የሚጠቅም ዕቃ ተጣለ' }
        ], show:{f:'mo_events', when:'has', v:['not_kept', 'not_rec', 'thrown']}}
    ]}
  ]
},

/* ========================== WUDE — DAILY QC =========================== */
{
  id:'wude-daily', person:'wude', cadence:'daily', dueTime:'17:30',
  en:'Daily QC Report', am:'ዕለታዊ የጥራት ቁጥጥር ሪፖርት',
  toEn:'Mahelet + Ephrata', toAm:'ማህሌት + ኤፍራታ',
  dueEn:'5:30 PM every working day', dueAm:'በየሥራ ቀኑ ከቀኑ 11፡30 (5:30 PM)',
  penEn:'Late –200 Birr · Missing –500 Birr', penAm:'ዘግይቶ –200 ብር · ካልተላከ –500 ብር',
  sections:[
    /* REBUILT 11 Oct 2026 (the Chairman: "they are struggling so much with
       the questions"). Wude's first two reports left 17 of 24 and 20 of 24
       questions empty. She filled the jobs she inspected and the defects,
       answered "Did you inspect every job in full?", and stopped: the
       seven-stage grid, the stage that caused the most, the reworks
       finished, whether Amaha was told, the supplier's share, the problems
       and the second and third priority were empty in both. 22 questions
       stood before any follow-up opened. Now a normal day is the jobs, the
       defects (with the worst stage one tap), one tap on "nothing else
       happened", and tomorrow. A job released without her full inspection,
       the same stage two days running, Amaha not told, a supplier's defect,
       a rework finished, the register behind, and pressure to pass a defect
       are one tap on the list in "Anything else today?", and only then are
       their questions asked. Every answer key is the one it always was; the
       yes/no answers the rulebook and the Chairman's brief read (i_all,
       pr_any, r_register) are worked out from the list ({picked:…},
       quiet:1). */
    /* THE JOBS THAT DID NOT PASS (the Chairman, 14 Oct 2026: "if she reports
       a job not finished, ask her tomorrow about that job"). A job she failed
       at inspection, or sent for rework or rejected, comes back on her next
       report as a row of its own, and she taps where it stands now — until
       it has passed, or the job is stopped. A pass in "Each job inspected
       today" closes it too. "Passed" and "still not passing" reach the
       register as an inspection (Register.js), so its "failed QC, not
       passed since" clears. */
    { en:'Jobs that did not pass before', am:'ከዚህ በፊት ያላለፉ ሥራዎች', fields:[
      {id:'qc_back', en:'Where does each of these jobs stand now?', am:'እያንዳንዱ ሥራ አሁን የት ደርሷል?', t:'table',
        carry:{from:[{f:'i_jobs', col:'code', when:{col:'pass', is:'no'}},
                     {f:'d_rows', col:'code', when:{col:'act', in:['rework', 'reject']}}],
               shut:[{f:'i_jobs', col:'code', when:{col:'pass', is:'yes'}}],
               close:{col:'now', in:['pass', 'stop']}, days:30},
        cols:[
          {id:'code', en:'Job code', am:'የሥራ ኮድ', t:'text'},
          {id:'now', en:'Where is it now?', am:'አሁን የት ደርሷል?', t:'choice', must:1, opts:[
            {v:'pass',   en:'Inspected again — passed',             am:'እንደገና ተመርምሮ አልፏል'},
            {v:'fail',   en:'Inspected again — still not passing',  am:'እንደገና ተመርምሮ አሁንም አላለፈም'},
            {v:'rework', en:'Still in rework',                      am:'አሁንም በዳግም ሥራ ላይ ነው'},
            {v:'wait',   en:'Rework not started yet',               am:'ዳግም ሥራው ገና አልተጀመረም'},
            {v:'stop',   en:'The job is stopped or cancelled',      am:'ሥራው ቆሟል ወይም ተሰርዟል'}
          ]},
          {id:'why', en:'What is still wrong?', am:'አሁንም ምን ችግር አለበት?', t:'text', picks:COL_DEFECT,
            ifCol:'now', ifIn:['fail']},
          {id:'when', en:'When will it be ready to inspect again?', am:'እንደገና ለመመርመር መቼ ይደርሳል?', t:'date',
            ifCol:'now', ifIn:['rework', 'wait']}
        ]}
    ]},
    { en:'Jobs inspected today', am:'ዛሬ የተመረመሩ ሥራዎች', fields:[
      /* The four figures that stood above this list were the list: how many
         inspected, how many passed, how many failed, and the rate between
         them (the Chairman, 9 Oct 2026). The list is the answer now. */
      {id:'i_jobs', en:'Each job inspected today', am:'ዛሬ የተመረመረ እያንዳንዱ ሥራ',
       t:'table', addEn:'Add job', addAm:'ሥራ ጨምር', cols:[
        {id:'code', en:'Job code', am:'የሥራ ኮድ', t:'text'},
        {id:'cust', en:'Customer', am:'ደንበኛ', t:'text'},
        {id:'m2',   en:'m²', am:'ካሬ ሜትር', t:'num'},
        {id:'pass', en:'Passed', am:'አልፏል', t:'yesno', yes:{en:'Passed', am:'አልፏል'}, no:{en:'Did not pass', am:'አላለፈም'}},
        {id:'why',  en:'Reason for failure', am:'ያላለፈበት ምክንያት', t:'text', picks:COL_DEFECT}
      ]},
      {id:'i_total', en:'How many jobs did you inspect today?', am:'ዛሬ ስንት ሥራ መረመሩ?', t:'num',
        auto:{rows:'i_jobs'}, sumEn:'inspected', sumAm:'ተመርምረዋል'},
      {id:'i_pass', en:'How many passed?', am:'ስንቱ አለፉ?', t:'num',
        auto:{rows:'i_jobs', when:{col:'pass', is:'yes'}}, sumEn:'passed', sumAm:'አልፈዋል'},
      {id:'i_fail', en:'How many failed?', am:'ስንቱ አላለፉም?', t:'num',
        auto:{rows:'i_jobs', when:{col:'pass', is:'no'}}, sumEn:'failed', sumAm:'አላለፉም'},
      {id:'i_m2', en:'How many m² did you inspect today?', am:'ዛሬ ስንት ካሬ ሜትር መረመሩ?', t:'num',
        auto:{sum:'i_jobs.m2'}, sumEn:'m²', sumAm:'ካሬ ሜትር'},
      {id:'i_rate', en:'What is today\'s pass rate?', am:'የዛሬው የማለፊያ መጠን ስንት በመቶ ነው?', t:'pct',
        auto:{pct:['i_pass', 'i_total']},
        tgt:{op:'gte', v:98, en:'≥98% earns the 2,000 Birr KPI bonus', am:'≥98% የ2,000 ብር KPI ጉርሻ ያስገኛል'}}
    ]},
    { en:'Defects found', am:'የተገኙ ጉድለቶች', fields:[
      {id:'d_any', en:'Did you find any defect today?', am:'ዛሬ ያገኙት ጉድለት አለ?', t:'yesno', yes:{en:'I found defects', am:'ጉድለት አግኝቻለሁ'}, no:{en:'No defects', am:'ጉድለት አላገኘሁም'}},
      {id:'d_rows', en:'Each defect found today', am:'ዛሬ የተገኘ እያንዳንዱ ጉድለት',
       t:'table', addEn:'Add defect', addAm:'ጉድለት ጨምር', show:{f:'d_any', when:'yes'}, cols:[
        {id:'code', en:'Job code', am:'የሥራ ኮድ', t:'text'},
        {id:'type', en:'Type', am:'ዓይነት', t:'choice', opts:[
          {v:'scratch', en:'Scratch', am:'ጭረት'},
          {v:'stain', en:'Stain', am:'እድፍ'},
          {v:'dim', en:'Dimension', am:'የልኬት ስህተት'},
          {v:'edge', en:'Edge', am:'ጠርዝ'},
          {v:'hw', en:'Hardware', am:'ሃርድዌር'},
          {v:'asm', en:'Assembly', am:'መገጣጠም'}
        ]},
        {id:'sev', en:'Severity', am:'ክብደት', t:'choice', opts:[
          {v:'minor', en:'Minor', am:'ቀላል'},
          {v:'major', en:'Major', am:'ከባድ'},
          {v:'crit', en:'Critical', am:'በጣም ከባድ'}
        ]},
        {id:'act', en:'Action', am:'እርምጃ', t:'choice', opts:[
          {v:'rework', en:'Rework', am:'ዳግም ሥራ'},
          {v:'reject', en:'Reject', am:'ውድቅ'}
        ]},
        {id:'rmat', en:'Material to cut again', am:'በድጋሚ የሚቆረጥ ዕቃ', t:'choice', opts:REDO_OPTS},
        {id:'rcol', en:'Colour code', am:'የቀለም ኮድ', t:'colour', of:'rmat'},
        {id:'rqty', en:'How many pieces?', am:'ስንት ቁራጭ?', t:'num', ifCol:'rmat', ifNot:['none']},
        {id:'out', en:'Reached finished goods', am:'ወደ ዝግጁ ዕቃ ገብቷል', t:'yesno', yes:{en:'Reached finished goods', am:'ወደ ዝግጁ ዕቃ ገብቷል'}, no:{en:'Caught before', am:'ሳይገባ ተይዟል'}},
        {id:'doc', en:'Documented with photo', am:'በፎቶ ተመዝግቧል', t:'yesno', yes:{en:'Photo taken', am:'ፎቶ ተነስቷል'}, no:{en:'No photo', am:'ፎቶ አልተነሳም'}}
      ]},
      {id:'d_total', en:'How many defects did you find today?', am:'ዛሬ ስንት ጉድለት አገኙ?', t:'num',
        auto:{rows:'d_rows'}, sumEn:'defects', sumAm:'ጉድለቶች'},
      {id:'d_crit', en:'How many were critical?', am:'በጣም ከባድ የሆኑት ስንት ናቸው?', t:'num',
        auto:{rows:'d_rows', when:{col:'sev', is:'crit'}}, sumEn:'critical', sumAm:'በጣም ከባድ'},
      {id:'d_photo', en:'How many have a photo?', am:'ፎቶ ያላቸው ስንት ናቸው?', t:'num',
        auto:{rows:'d_rows', when:{col:'doc', is:'yes'}}, sumEn:'with a photo', sumAm:'ፎቶ ያላቸው'},
      {id:'d_released', en:'How many defective items got into finished goods anyway?', am:'ጉድለት እያለባቸው ወደ ዝግጁ ዕቃ ማከማቻ የገቡ ስንት ናቸው?', t:'num',
        auto:{rows:'d_rows', when:{col:'out', is:'yes'}}, sumEn:'reached finished goods', sumAm:'ወደ ዝግጁ ዕቃ ገብተዋል',
        tgt:{op:'lte', v:0, en:'–500 Birr each, and the 1,500 Birr bonus is lost',
             am:'እያንዳንዱ –500 ብር፣ የ1,500 ብር ጉርሻም ይጠፋል'}},
      /* moved here from "Rework", beside the list it is counted from, so it
         joins the line under the defects */
      {id:'r_required', en:'How many jobs needed rework today?', am:'ዛሬ ስንት ሥራዎች ዳግም ሥራ አስፈለጋቸው?', t:'num',
        auto:{rows:'d_rows', when:{col:'act', is:'rework'}}, sumEn:'need rework', sumAm:'ዳግም ሥራ ያስፈልጋቸዋል'},
      /* the Chairman's brief reads these words beside the count (BROKEN_) */
      {id:'d_released_what', en:'Defects reached finished goods. How did they get past QC, and are they pulled back? (Write the job and the defect in the box.)', am:'ጉድለቶች ወደ ዝግጁ ዕቃ ገብተዋል። ከጥራት ቁጥጥር እንዴት አለፉ? ተመልሰዋል? (ሥራውንና ጉድለቱን በሳጥኑ ይጻፉ።)', t:'area',
        picks:[
          { en:'Released before I inspected it',    am:'ሳልመረምረው ተለቀቀ' },
          { en:'I missed it in the inspection',     am:'በፍተሻው አላየሁትም' },
          { en:'Damaged after my inspection',       am:'ከፍተሻዬ በኋላ ተጎዳ' },
          { en:'Pulled back — being fixed',         am:'ተመልሷል — እየተስተካከለ ነው' },
          { en:'Not pulled back yet',               am:'ገና አልተመለሰም' }
        ], show:{f:'d_released', when:'pos'}},
      {id:'r_rate', en:'What is today\'s rework rate?', am:'የዛሬው የዳግም ሥራ መጠን ስንት በመቶ ነው?', t:'pct',
        auto:{pct:['r_required', 'i_total']},
        tgt:{op:'lte', v:2, en:'Below 2% earns 1,000 Birr; above 5% is –500 Birr',
             am:'ከ2% በታች 1,000 ብር፤ ከ5% በላይ –500 ብር'}},
      {id:'r_rate_why', en:'Rework is above 2%. What caused it, and what would stop it? (Write the job codes in the box.)', am:'ዳግም ሥራው ከ2% በላይ ነው። ምክንያቱ ምንድን ነው? እንዳይደገም ምን ይደረግ? (የሥራ ኮዶቹን በሳጥኑ ይጻፉ።)', t:'area',
        picks:[
          { en:'Cutting',                           am:'ቁረጣ' },
          { en:'Edge banding',                      am:'ጠርዝ ማሰር' },
          { en:'Drilling',                          am:'ቀዳዳ መብሳት' },
          { en:'Assembly',                          am:'መገጣጠም' },
          { en:'Handling — scratches or knocks',    am:'አያያዝ — ጭረት ወይም መጋጨት' },
          { en:'Bad board or hardware',             am:'መጥፎ ሰሌዳ ወይም ሃርድዌር' },
          { en:'Workers need showing the right way', am:'ለሠራተኞች ትክክለኛውን መንገድ ማሳየት ያስፈልጋል' },
          { en:'A machine needs setting',           am:'ማሽን መስተካከል አለበት' }
        ], show:{f:'r_rate', when:'miss'}},
      /* rework cost (8 Oct 2026), for the quality reader — asked on a day
         with rework, not on every day */
      {id:'r_cost', en:'What did today’s rework cost, in Birr (materials and hours)? (If you know it.)', am:'የዛሬው ዳግም ሥራ ምን ያህል አስወጣ? በብር (ዕቃና ሰዓት) (ካወቁ።)', t:'money', opt:1,
        show:{f:'r_required', when:'pos'}},
      /* "Where the defects came from" was its own section: a seven-row grid,
         the worst stage typed, and four more questions, empty in every
         report. The worst stage is one tap now; the grid is there for the
         days she counted; the rest is on the list below. */
      {id:'c_worst', en:'Which stage caused the most defects today?', am:'ዛሬ ብዙ ጉድለት ያስከተለው የትኛው ደረጃ ነው?', t:'text', one:1,
        picks:[
          { en:'Cutting',                           am:'ቁረጣ' },
          { en:'Edge banding',                      am:'ጠርዝ ማሰር' },
          { en:'Drilling',                          am:'ቀዳዳ መብሳት' },
          { en:'Assembly',                          am:'መገጣጠም' },
          { en:'Handling',                          am:'አያያዝ' },
          { en:'The board itself',                  am:'ሰሌዳው ራሱ' },
          { en:'Hardware',                          am:'ሃርድዌር' }
        ], show:{f:'d_any', when:'yes'}},
      {id:'c_stage', en:'If you counted: how many defects did each stage cause today, and how many m² did they touch?', am:'ከቆጠሩ፦ ዛሬ እያንዳንዱ ደረጃ ስንት ጉድለት አስከተለ? ስንት ካሬ ሜትር ተጎዳ?',
       t:'grid', opt:1, show:{f:'d_any', when:'yes'}, rows:[
        {en:'Cutting — wrong size or not square', am:'ቁረጣ — የተሳሳተ ልኬት'},
        {en:'Edge banding — lifting or chipped', am:'ጠርዝ — ተላቋል ወይም ተሰብሯል'},
        {en:'Drilling — hinge or shelf holes out', am:'ቀዳዳ — የማጠፊያ ወይም የመደርደሪያ ቀዳዳ ስህተት'},
        {en:'Assembly — not square, doors not flush', am:'መገጣጠም — በሽ አልሆነም'},
        {en:'Handling — scratched or knocked', am:'አያያዝ — ተቧጭሯል'},
        {en:'Board itself — warped or damaged on arrival', am:'ሰሌዳው ራሱ — ጎብጧል ወይም ተጎድቶ መጥቷል'},
        {en:'Hardware — faulty hinge, slide or handle', am:'ሃርድዌር — የተበላሸ ማጠፊያ ወይም መያዣ'}
      ], cols:[
        {id:'n', en:'Defects', am:'ጉድለቶች', t:'num'},
        {id:'m2', en:'m² affected', am:'የተጎዳ ካሬ ሜትር', t:'num'}
      ]}
    ]},
    /* THE ONE LIST. Seven yes/no questions and three counts used to stand
       in sections of their own, asked every day whether or not anything had
       happened, and they were empty in every report. Each question that
       follows opens on its own tap, right under the list. */
    { en:'Anything else today?', am:'ዛሬ ሌላ የሆነ ነገር አለ?', fields:[
      {id:'q_events', en:'What else happened in quality today?', am:'ዛሬ በጥራት ቁጥጥር ሌላ ምን ሆነ?', t:'multi',
        none:{ en:'Nothing — a normal day', am:'ምንም — የተለመደ ቀን' },
        groups:[
          { v:'insp',  en:'Inspection', am:'ፍተሻ' },
          { v:'def',   en:'Defects',    am:'ጉድለቶች' },
          { v:'rw',    en:'Rework',     am:'ዳግም ሥራ' },
          { v:'press', en:'Pressure to pass a defect — you are protected when you report it', am:'ጉድለት እንዲያሳልፉ የሚደረግ ጫና — ካሳወቁ ይጠበቃሉ' }
        ],
        opts:[
          { v:'not_all',    g:'insp',  en:'A job went out without my full inspection',       am:'ሙሉ ፍተሻዬ ሳይደረግ የወጣ ሥራ አለ' },
          { v:'same_stage', g:'def',   en:'Defects came from the same stage as yesterday',   am:'ጉድለቶቹ ከትናንቱ ተመሳሳይ ደረጃ መጡ' },
          { v:'not_told',   g:'def',   en:'Amaha was not told the cause of the defects',     am:'ለአማሃ የጉድለቶቹ ምክንያት አልተነገረውም' },
          { v:'sup_fault',  g:'def',   en:'A defect was the supplier\'s fault — bad board or hardware', am:'የአቅራቢው ጥፋት የሆነ ጉድለት አለ — መጥፎ ሰሌዳ ወይም ሃርድዌር' },
          { v:'rw_done',    g:'rw',    en:'A rework was finished today',                     am:'ዛሬ የተጠናቀቀ ዳግም ሥራ አለ' },
          { v:'reg_behind', g:'rw',    en:'The Rework Register is not up to date',           am:'የዳግም ሥራ መዝገቡ አልተሟላም' },
          { v:'pressure',   g:'press', en:'Someone pressed me to pass a defect',             am:'ጉድለት እንዳሳልፍ ጫና ተደረገብኝ' }
        ]},

      /* — a job released without her full inspection: –1,000 Birr on "no"
         (js/rules.js wude-release-without-inspection) and a broken rule in
         the Chairman's brief (apps-script/Agents.js BROKEN_), filed as
         before */
      {id:'i_all', en:'Did you personally inspect, in full, every job released today?', am:'ዛሬ የተለቀቀውን እያንዳንዱን ሥራ ራስዎ ሙሉ በሙሉ መረመሩ?', t:'yesno', quiet:1, auto:{picked:'q_events', v:'not_all', flip:1}},
      {id:'i_all_why', en:'Which jobs went out without your full inspection, and why? (Write the job codes and who released them in the box.)', am:'ሙሉ ፍተሻዎ ሳይደረግ የወጡት የትኞቹ ሥራዎች ናቸው? ለምን? (የሥራ ኮዶቹንና ማን እንደለቀቃቸው በሳጥኑ ይጻፉ።)', t:'area',
        picks:[
          { en:'Released before I could inspect',   am:'ሳልመረምር ተለቀቀ' },
          { en:'The customer or the site was waiting', am:'ደንበኛው ወይም የተከላ ቦታው ይጠብቅ ነበር' },
          { en:'Only part of it was inspected',     am:'በከፊል ብቻ ተመረመረ' },
          { en:'I was not at work',                 am:'ሥራ ላይ አልነበርኩም' },
          { en:'Mahelet released it',               am:'ማህሌት ለቀቀችው' },
          { en:'Amaha released it',                 am:'አማሃ ለቀቀው' }
        ], show:{f:'i_all', when:'no'}},

      /* — where the defects came from */
      {id:'c_repeat', en:'Is it the same stage as yesterday?', am:'ከትናንቱ ጋር ተመሳሳይ ደረጃ ነው?', t:'yesno', quiet:1, auto:{picked:'q_events', v:'same_stage'}},
      {id:'c_repeat_why', en:'The same stage two days running. What is going wrong there, and who must fix it?', am:'ሁለት ቀን ተከታታይ ተመሳሳይ ደረጃ ነው። እዚያ ምን እየተበላሸ ነው? ማን ማስተካከል አለበት?', t:'area',
        picks:[
          { en:'The machine needs setting',         am:'ማሽኑ መስተካከል አለበት' },
          { en:'The operator needs showing',        am:'ለኦፕሬተሩ ማሳየት ያስፈልጋል' },
          { en:'The board or edge band is poor',    am:'ሰሌዳው ወይም የጠርዝ ማሰሪያው ጥሩ አይደለም' },
          { en:'Rushing to finish',                 am:'ለመጨረስ መቸኮል' },
          { en:'Amaha must fix it',                 am:'አማሃ ማስተካከል አለበት' },
          { en:'Mahelet must decide',               am:'ማህሌት መወሰን አለባት' }
        ], show:{f:'c_repeat', when:'yes'}},
      {id:'c_told', en:'Was Amaha told, with the cause named?', am:'ለአማሃ ምክንያቱ ተጠቅሶ ተነግሮታል?', t:'yesno', quiet:1, auto:{picked:'q_events', v:'not_told', flip:1}},
      {id:'c_told_why', en:'Amaha was not told the cause. Why, and when will he be told?', am:'ለአማሃ ምክንያቱ አልተነገረውም። ለምን? መቼ ይነገረዋል?', t:'area',
        picks:[
          { en:'He was not at work',                am:'ሥራ ላይ አልነበረም' },
          { en:'No time today',                     am:'ዛሬ ጊዜ አልነበረም' },
          { en:'Forgot',                            am:'ረሳሁ' },
          { en:'He will be told tomorrow morning',  am:'ነገ ጠዋት ይነገረዋል' }
        ], show:{f:'c_told', when:'no'}},
      /* a real 0 on a normal day: the quality reader reads it every day */
      {id:'c_sup', en:'How many defects were the supplier\'s fault, not ours?', am:'ስንቱ ጉድለቶች የእኛ ሳይሆኑ የአቅራቢው ጥፋት ናቸው?', t:'num', zero:1,
        show:{f:'q_events', when:'has', v:'sup_fault'}},
      {id:'c_sup_what', en:'What was wrong with it? (Write the material and the supplier in the box.)', am:'ምን ችግር ነበረበት? (ዕቃውንና አቅራቢውን በሳጥኑ ይጻፉ።)', t:'area',
        picks:[
          { en:'Board bent or damaged on arrival',  am:'ሰሌዳው ጎብጦ ወይም ተጎድቶ መጣ' },
          { en:'Wrong size or thickness',           am:'የተሳሳተ ልኬት ወይም ውፍረት' },
          { en:'Colour does not match',             am:'ቀለሙ አይመሳሰልም' },
          { en:'Faulty hinge, slide or handle',     am:'የተበላሸ ማጠፊያ፣ ተንሸራታች ወይም መያዣ' },
          { en:'Edge band will not stick',          am:'የጠርዝ ማሰሪያው አይጣበቅም' }
        ], show:{f:'c_sup', when:'pos'}},
      {id:'c_suptold', en:'Were Getachew and Alemaya told the same day?', am:'ለጌታቸውና ለአለማያ በዚያው ቀን ተነግሯል?', t:'yesno', yes:{en:'Both told today', am:'ሁለቱም ዛሬ ተነግሯቸዋል'}, no:{en:'Not told yet', am:'ገና አልተነገራቸውም'}, opt:1, i:1,
        show:{f:'c_sup', when:'pos'}},

      /* — rework finished. A real 0 on a normal day: the week adds r_done up
         (wude-weekly rw_done) and the plant manager reads it. */
      {id:'r_done', en:'How many reworks were finished today?', am:'ዛሬ ስንት ዳግም ሥራዎች ተጠናቀቁ?', t:'num', zero:1,
        show:{f:'q_events', when:'has', v:'rw_done'}},
      {id:'r_reinspected', en:'How many of them did you re-inspect?', am:'ከነሱ ስንቱን እንደገና መረመሩ?', t:'num', zero:1,
        show:{f:'q_events', when:'has', v:'rw_done'}},
      /* –300 Birr in a month with a "no" (js/rules.js
         wude-register-not-maintained) */
      {id:'r_register', en:'Is the Rework Register up to date?', am:'የዳግም ሥራ መዝገቡ ተሟልቷል?', t:'yesno', quiet:1, auto:{picked:'q_events', v:'reg_behind', flip:1}},
      {id:'r_register_why', en:'What is missing from it, and when will it be complete?', am:'ምን ጎድሎታል? መቼ ይሟላል?', t:'area',
        picks:[
          { en:'Today\'s reworks are not written in yet', am:'የዛሬዎቹ ዳግም ሥራዎች ገና አልተጻፉም' },
          { en:'Waiting for details from Amaha',    am:'ከአማሃ ዝርዝር እየጠበቅሁ ነው' },
          { en:'No time today',                     am:'ዛሬ ጊዜ አልነበረም' },
          { en:'Complete tomorrow',                 am:'ነገ ይሟላል' }
        ], show:{f:'r_register', when:'no'}}
    ]},
    /* Only opens when she taps "Someone pressed me to pass a defect". Her
       letter protects her when she reports it; the rulebook fines her
       2,000 Birr only if she was pressed and did not tell Mahelet (js/rules.js
       wude-pressure-not-reported), and the Chairman's brief and an alert
       read pr_any "yes" (apps-script/Agents.js BROKEN_, Code.js). */
    { en:'Pressure to pass a defect — you are protected when you report it', am:'ጉድለት እንዲያሳልፉ የሚደረግ ጫና — ካሳወቁ ይጠበቃሉ', fields:[
      {id:'pr_any', en:'Did anyone pressure you today to pass a defective product?', am:'ዛሬ ጉድለት ያለበትን ምርት እንዲያሳልፉ ማንም ጫና አድርጎብዎታል?', t:'yesno', quiet:1, auto:{picked:'q_events', v:'pressure'}},
      {id:'pr_what', en:'What happened, and what did you do? (Write the job and what was wrong with it in the box.)', am:'ምን ሆነ? ምን አደረጉ? (ሥራውንና ጉድለቱን በሳጥኑ ይጻፉ።)', t:'area',
        picks:[
          { en:'Told to pass it to save time',      am:'ጊዜ ለመቆጠብ እንዳሳልፈው ተነገረኝ' },
          { en:'Told to pass it — the customer is waiting', am:'እንዳሳልፈው ተነገረኝ — ደንበኛው እየጠበቀ ነው' },
          { en:'Told it is good enough',            am:'በቂ ነው ተባልኩ' },
          { en:'I refused and failed it',           am:'እምቢ ብዬ አላሳለፍኩትም' },
          { en:'I passed it',                       am:'አሳለፍኩት' }
        ], show:{f:'pr_any', when:'yes'}},
      {id:'pr_who', en:'Who pressed you?', am:'ጫና ያደረገብዎት ማን ነው?', t:'text', opt:1,
        picks:[
          { en:'Amaha',                             am:'አማሃ' },
          { en:'Mahelet',                           am:'ማህሌት' },
          { en:'Elyas',                             am:'ኤልያስ' },
          { en:'A salesperson',                     am:'የሽያጭ ሠራተኛ' },
          { en:'The customer',                      am:'ደንበኛው' },
          { en:'Someone else — write the name',     am:'ሌላ ሰው — ስሙን ይጻፉ' }
        ], show:{f:'pr_any', when:'yes'}},
      {id:'pr_reported', en:'Did you report it to Mahelet?', am:'ለማህሌት አሳውቀዋል?', t:'yesno', yes:{en:'I told Mahelet', am:'ለማህሌት ነግሬያለሁ'}, no:{en:'Not yet', am:'ገና አልነገርኩም'}, opt:1,
        show:{f:'pr_any', when:'yes'}}
    ]},
    { en:'Problems and help', am:'ችግርና እርዳታ', fields:[
      {id:'problem', en:'What was the biggest quality problem today?', am:'የዛሬው ትልቁ የጥራት ችግር ምን ነበር?', t:'area', opt:1,
        picks:[
          { en:'No big problem today',              am:'ዛሬ ትልቅ ችግር አልነበረም' },
          { en:'Many defects from one stage',       am:'ከአንድ ደረጃ ብዙ ጉድለት' },
          { en:'Jobs went out before inspection',   am:'ሥራዎች ከፍተሻ በፊት ወጡ' },
          { en:'No time to inspect everything',     am:'ሁሉንም ለመመርመር ጊዜ አልነበረም' },
          { en:'Bad board or hardware from suppliers', am:'ከአቅራቢዎች መጥፎ ሰሌዳ ወይም ሃርድዌር' },
          { en:'Rework not done',                   am:'ዳግም ሥራው አልተሠራም' }
        ]},
      {id:'need_help', en:'What do you need, and from whom?', am:'ምን ያስፈልግዎታል? ከማን?', t:'area', opt:1,
        picks:[
          { en:'Nothing needed',                    am:'ምንም አያስፈልግም', nil:1 },
          { en:'Amaha to fix a stage',              am:'አማሃ አንድ ደረጃ እንዲያስተካክል' },
          { en:'Better board or hardware (Getachew)', am:'የተሻለ ሰሌዳ ወይም ሃርድዌር (ጌታቸው)' },
          { en:'Time to inspect before release',    am:'ከመለቀቁ በፊት ለመመርመር ጊዜ' },
          { en:'Good light or a measuring tool',    am:'ጥሩ መብራት ወይም መለኪያ' },
          { en:'A decision from Mahelet',           am:'የማህሌት ውሳኔ' }
        ]},
      {id:'need_lead', en:'Do you need a decision from Mahelet?', am:'የማህሌት ውሳኔ ያስፈልግዎታል?', t:'yesno', yes:{en:'I need a decision', am:'ውሳኔ ያስፈልገኛል'}, no:{en:'No decision needed', am:'ውሳኔ አያስፈልገኝም'}},
      {id:'need_lead_what', en:'What should Mahelet decide, and by when?', am:'ማህሌት ምን መወሰን አለባት? እስከ መቼ?', t:'area',
        picks:[
          { en:'Pass or fail a job',                am:'ሥራን ማሳለፍ ወይም አለማሳለፍ' },
          { en:'Rework or reject a job',            am:'ሥራ እንደገና መሥራት ወይም ውድቅ ማድረግ' },
          { en:'Stop a job until it is fixed',      am:'እስኪስተካከል ሥራ ማቆም' },
          { en:'Send board back to the supplier',   am:'ሰሌዳ ለአቅራቢው መመለስ' },
          { en:'Needed today',                      am:'ዛሬ ያስፈልጋል' },
          { en:'Needed tomorrow',                   am:'ነገ ያስፈልጋል' }
        ], show:{f:'need_lead', when:'yes'}}
    ]},
    { en:'Tomorrow', am:'ነገ', fields:[
      {id:'p1', en:'What comes first tomorrow? (A job code is enough.)', am:'ነገ መጀመሪያ የሚሠራው ምንድን ነው? (የሥራ ኮድ በቂ ነው።)', t:'text', from:['i_jobs.code', 'd_rows.code'], recent:1},
      {id:'p2', en:'And second?', am:'ሁለተኛው?', t:'text', from:['i_jobs.code', 'd_rows.code'], recent:1, opt:1},
      {id:'p3', en:'And third?', am:'ሦስተኛው?', t:'text', from:['i_jobs.code', 'd_rows.code'], recent:1, opt:1}
    ]}
  ]
},

/* ========================= WUDE — WEEKLY QC =========================== */
{
  id:'wude-weekly', person:'wude', cadence:'weekly', built:1, dueTime:'17:00', dueDay:6,
  en:'Weekly QC Summary', am:'ሳምንታዊ የጥራት ቁጥጥር ማጠቃለያ',
  toEn:'Mahelet + Ephrata', toAm:'ማህሌት + ኤፍራታ',
  dueEn:'Saturday 5:00 PM', dueAm:'ቅዳሜ ከቀኑ 11፡00 (5:00 PM)',
  penEn:'Late or not sent –500 Birr', penAm:'ዘግይቶ ወይም ካልቀረበ –500 ብር',
  sections:[
    /* REBUILT 11 Oct 2026 (the Chairman: "they are struggling so much with
       the questions"). Wude's dailies left 71–83% of their questions empty
       and every "why" box with them. This weekly asked 15 questions before
       any follow-up: a 7 × 2 grid of defect counts and percentages, the
       rework cost, two yes/no answers about things that rarely happen, and
       several typed "why"s. Now: what her dailies hold is worked out from
       them (the rework cost too, from r_cost); a complaint or pressure to
       pass a defect is one tap on the list, and the yes/no answers behind
       it are worked out from the list ({picked:…}, quiet:1); the grid opens
       from the list when she counted by type; the most common defect is a
       tap; every "why" is buttons. Every answer key is the one it always
       was — the complaint list the rulebook fines on stays as it was. */
    { en:'Inspections this week', am:'የዚህ ሳምንት ፍተሻ', fields:[
      {id:'w_inspected', en:'How many jobs did you inspect this week?', am:'በዚህ ሳምንት ስንት ሥራ መረመሩ?', t:'num', auto:{week:'i_total'}},
      {id:'w_pass', en:'How many passed?', am:'ስንቱ አለፉ?', t:'num', auto:{week:'i_pass'}},
      {id:'w_fail', en:'How many failed?', am:'ስንቱ አላለፉም?', t:'num', auto:{week:'i_fail'}},
      {id:'w_fail_list', en:'Which jobs failed, why, and where do they stand now?', am:'ያላለፉት የትኞቹ ሥራዎች ናቸው? ለምን? አሁን በምን ደረጃ ላይ ናቸው?', t:'table', auto:{weekRows:'i_jobs', from:'wude-daily', when:{col:'pass', is:'no'}, map:{code:'code', cust:'cust', why:'why'}}, addEn:'Add a job', addAm:'ሥራ ጨምር',
        show:{f:'w_fail', when:'pos'},
        cols:[
          {id:'code', en:'Job code', am:'የሥራ ኮድ', t:'text'},
          {id:'cust', en:'Customer', am:'ደንበኛ', t:'text'},
          {id:'why', en:'Reason', am:'ምክንያት', t:'text', picks:COL_DEFECT},
          {id:'now', en:'Now', am:'አሁን', t:'choice', opts:[
            {v:'passed', en:'Reworked and passed', am:'ተሠርቶ አልፏል'},
            {v:'rework', en:'Still in rework', am:'በዳግም ሥራ ላይ'},
            {v:'reject', en:'Rejected', am:'ውድቅ ሆኗል'}]}
        ]},
      {id:'w_rate', en:'What was the pass rate this week?', am:'የዚህ ሳምንት የማለፊያ መጠን ስንት በመቶ ነበር?', t:'pct',
        auto:{pct:['w_pass', 'w_inspected']},
        tgt:{op:'gte', v:98, en:'Below 98% is –500 Birr for the month', am:'ከ98% በታች ለወሩ –500 ብር'}},
      {id:'w_rate_why', en:'Below 98%: what pulled it down? (Write what must change next week in the box.)', am:'ከ98% በታች ነው፦ ምን አወረደው? (በሚቀጥለው ሳምንት ምን መቀየር እንዳለበት በሳጥኑ ይጻፉ።)', t:'area', auto:{list:'w_fail_list.why'},
        picks:[
          { en:'Edge banding lifting',             am:'ጠርዝ መነሳት' },
          { en:'Cutting size wrong',               am:'የቁረጣ ልኬት ስህተት' },
          { en:'Drilling out of place',            am:'ቀዳዳ ከቦታው ወጣ' },
          { en:'Assembly not square',              am:'መገጣጠሙ ቀጥ አልሆነም' },
          { en:'Scratches in handling',            am:'በአያያዝ ጭረት' },
          { en:'Board or hardware from the supplier', am:'ከአቅራቢው የመጣ ሰሌዳ ወይም ሃርድዌር' }
        ], show:{f:'w_rate', when:'miss'}}
    ]},
    /* THE ONE LIST: a complaint and pressure to pass a defect used to be two
       yes/no questions every week, and a count of resolved complaints was
       asked even when there was none to resolve */
    { en:'Anything else this week?', am:'በዚህ ሳምንት ሌላ የሆነ ነገር አለ?', fields:[
      {id:'wk_events', en:'What else happened this week?', am:'በዚህ ሳምንት ሌላ ምን ሆነ?', t:'multi', auto:{weekPicks:'q_events', from:'wude-daily', map:{pressure:'pressure'}},
        none:{ en:'Nothing — a normal week', am:'ምንም — የተለመደ ሳምንት' },
        opts:[
          { v:'complaint', en:'A customer complained about quality',  am:'ስለ ጥራት ቅሬታ ያቀረበ ደንበኛ ነበር' },
          { v:'pressure',  en:'Someone pressed you to pass a defect (you are protected when you report it)', am:'ጉድለት እንዲያሳልፉ ጫና ያደረገብዎ ሰው ነበር (ካሳወቁ ይጠበቃሉ)' },
          { v:'counted',   en:'The week\'s defects were counted by type', am:'የሳምንቱ ጉድለቶች በዓይነት ተቆጥረዋል' }
        ]}
    ]},
    { en:'Defects', am:'ጉድለቶች', fields:[
      {id:'top_defect', en:'Which defect was most common this week?', am:'በዚህ ሳምንት በብዛት የተከሰተው የትኛው ጉድለት ነው?', t:'text', one:1,
        picks:[
          { en:'Scratch',                          am:'ጭረት' },
          { en:'Stain',                            am:'እድፍ' },
          { en:'Dimension error',                  am:'የልኬት ስህተት' },
          { en:'Edge damage',                      am:'የጠርዝ ጉዳት' },
          { en:'Hardware issue',                   am:'የሃርድዌር ችግር' },
          { en:'Assembly issue',                   am:'የመገጣጠም ችግር' },
          { en:'No defects this week',             am:'በዚህ ሳምንት ጉድለት አልነበረም' }
        ]},
      {id:'top_why', en:'Why does it keep happening, and at which stage does it start?', am:'ለምን ይደጋገማል? በየትኛው ደረጃ ይጀምራል?', t:'area', auto:{weekText:'c_worst', from:'wude-daily'}, opt:1,
        picks:[
          { en:'Cutting',                          am:'ቁረጣ' },
          { en:'Edge banding',                     am:'ጠርዝ ማሰር' },
          { en:'Drilling',                         am:'ቀዳዳ መብሳት' },
          { en:'Assembly',                         am:'መገጣጠም' },
          { en:'Handling and moving',              am:'አያያዝና ማጓጓዝ' },
          { en:'The board as it came',             am:'ሰሌዳው እንደመጣ' },
          { en:'Hardware from the supplier',       am:'ከአቅራቢው የመጣ ሃርድዌር' },
          { en:'It is not repeating',              am:'እየተደጋገመ አይደለም' }
        ],},
      /* fourteen boxes; her daily rows already carry each defect's type */
      {id:'defects', en:'How many of each defect type, and what share of the total? (If you counted.)', am:'ከእያንዳንዱ የጉድለት ዓይነት ስንት? ከጠቅላላው ስንት በመቶ? (ከቆጠሩ።)', t:'grid', opt:1,
       show:{f:'wk_events', when:'has', v:'counted'},
       rows:[{en:'Scratch', am:'ጭረት'},{en:'Stain', am:'እድፍ'},
             {en:'Dimension error', am:'የልኬት ስህተት'},{en:'Edge damage', am:'የጠርዝ ጉዳት'},
             {en:'Hardware issue', am:'የሃርድዌር ችግር'},{en:'Assembly issue', am:'የመገጣጠም ችግር'},
             {en:'Other', am:'ሌላ'}],
       cols:[
        {id:'n', en:'Count', am:'ብዛት', t:'num'},
        {id:'pct', en:'% of total', am:'ከጠቅላላው %', t:'pct'}
      ]}
    ]},
    { en:'Rework', am:'ዳግም ሥራ', fields:[
      {id:'rw_req', en:'How many jobs needed rework this week?', am:'በዚህ ሳምንት ስንት ሥራዎች ዳግም ሥራ አስፈለጋቸው?', t:'num', auto:{week:'r_required'}},
      {id:'rw_done', en:'How many reworks were finished?', am:'ስንት ዳግም ሥራዎች ተጠናቀቁ?', t:'num', auto:{week:'r_done'}},
      {id:'rw_rate', en:'What was the rework rate this week?', am:'የዚህ ሳምንት የዳግም ሥራ መጠን ስንት በመቶ ነበር?', t:'pct',
        auto:{pct:['rw_req', 'w_inspected']},
        tgt:{op:'lte', v:2, en:'Below 2% earns 1,000 Birr; above 5% is –500 Birr',
             am:'ከ2% በታች 1,000 ብር፤ ከ5% በላይ –500 ብር'}},
      {id:'rw_rate_why', en:'Above 2%: what drove it? (Write the jobs and the plan to bring it down in the box.)', am:'ከ2% በላይ ነው፦ ምን አሳደገው? (ሥራዎቹንና ለመቀነስ ዕቅዱን በሳጥኑ ይጻፉ።)', t:'area', auto:{weekText:'r_rate_why', from:'wude-daily'},
        picks:[
          { en:'Edge banding lifting',             am:'ጠርዝ መነሳት' },
          { en:'Cutting size wrong',               am:'የቁረጣ ልኬት ስህተት' },
          { en:'Drilling out of place',            am:'ቀዳዳ ከቦታው ወጣ' },
          { en:'Assembly not square',              am:'መገጣጠሙ ቀጥ አልሆነም' },
          { en:'Scratches in handling',            am:'በአያያዝ ጭረት' },
          { en:'Board or hardware from the supplier', am:'ከአቅራቢው የመጣ ሰሌዳ ወይም ሃርድዌር' }
        ], show:{f:'rw_rate', when:'miss'}},
      /* her daily asks the day's rework cost (r_cost); the week adds them */
      {id:'rw_cost', en:'What did rework cost this week?', am:'በዚህ ሳምንት ዳግም ሥራ ስንት ብር አስወጣ?', t:'money', auto:{week:'r_cost'}}
    ]},
    { en:'Customer complaints', am:'የደንበኛ ቅሬታዎች', fields:[
      {id:'c_recv_any', en:'Did any customer complaint about quality come in this week?', am:'በዚህ ሳምንት ስለጥራት የደረሰ የደንበኛ ቅሬታ አለ?', t:'yesno', auto:{all:'c_recv_list.what'}, quiet:1,},
      /* the rulebook fines and pays on these rows, asking the jobs register
         whether each job had passed QC (wude-complaint-qc,
         wude-bonus-no-complaint; Rules.js rulesQcOf_); the register reads
         them too */
      {id:'c_recv_list', en:'List each complaint', am:'እያንዳንዱን ቅሬታ ይዘርዝሩ', t:'table', auto:{weekRows:'pl_list', from:'betty-pulse', when:{col:'issue', in:['Quality', 'ጥራት']}, map:{job:'code', issue:'what'}}, addEn:'Add a complaint', addAm:'ቅሬታ ጨምር',

        cols:[
          {id:'cust', en:'Customer', am:'ደንበኛ', t:'text'},
          {id:'code', en:'Job code', am:'የሥራ ኮድ', t:'text'},
          {id:'what', en:'Complaint', am:'ቅሬታ', t:'text', picks:COL_COMPLAINT}
        ]},
      {id:'c_recv', en:'How many customer complaints this week were about quality?', am:'በዚህ ሳምንት ስንት የደንበኛ ቅሬታዎች ከጥራት ጋር የተያያዙ ነበሩ?', t:'num',
        auto:{rows:'c_recv_list'}, sumEn:'complaints', sumAm:'ቅሬታዎች',
        tgt:{op:'lte', v:0, en:'–1,000 Birr each, and the 1,000 Birr bonus is lost',
             am:'እያንዳንዱ –1,000 ብር፣ የ1,000 ብር ጉርሻም ይጠፋል'}},
      {id:'c_res', en:'How many of them were resolved?', am:'ከነሱ ስንቱ ተፈቱ?', t:'num', auto:{week:'pl_list', count:1, from:'betty-pulse', when:[{col:'issue', in:['Quality', 'ጥራት']}, {col:'state', is:'closed'}]}, zero:1,
},
      {id:'c_out', en:'How many are still open?', am:'ስንቱ ገና አልተፈቱም?', t:'num',
        auto:{minus:['c_recv', 'c_res']}},
      {id:'c_out_what', en:'What is holding them up, and when will each be closed? (Write which in the box.)', am:'ምን ያዛቸው? እያንዳንዱ መቼ ይዘጋል? (የትኞቹ እንደሆኑ በሳጥኑ ይጻፉ።)', t:'area',
        picks:[
          { en:'Waiting for rework',               am:'ዳግም ሥራ እየጠበቀ ነው' },
          { en:'Waiting for a part',               am:'መለዋወጫ እየጠበቀ ነው' },
          { en:'Waiting for the customer',         am:'ደንበኛውን እየጠበቀ ነው' },
          { en:'Closes this week',                 am:'በዚህ ሳምንት ይዘጋል' },
          { en:'Closes next week',                 am:'በሚቀጥለው ሳምንት ይዘጋል' }
        ], show:{f:'c_out', when:'pos'}}
    ]},
    { en:'Pressure to pass a defect — you are protected when you report it', am:'ጉድለት እንዲያሳልፉ የሚደረግ ጫና — ካሳወቁ ይጠበቃሉ', fields:[
      {id:'pr_week', en:'Did anyone pressure you this week to pass a defective product?', am:'በዚህ ሳምንት ጉድለት ያለበትን ምርት እንዲያሳልፉ ማንም ጫና አድርጎብዎታል?', t:'yesno', quiet:1, auto:{picked:'wk_events', v:'pressure'}},
      {id:'pr_det', en:'Who pressed you? (Write the job and what happened in the box.)', am:'ጫና ያደረገብዎ ማን ነው? (ሥራውንና ምን እንደሆነ በሳጥኑ ይጻፉ።)', t:'area', auto:{weekText:'pr_who', from:'wude-daily'},
        picks:[
          { en:'Amaha',                            am:'አማሃ' },
          { en:'A production worker',              am:'የምርት ሠራተኛ' },
          { en:'Mahelet',                          am:'ማህሌት' },
          { en:'Someone from sales',               am:'ከሽያጭ ክፍል ሰው' },
          { en:'Someone else',                     am:'ሌላ ሰው' }
        ], show:{f:'wk_events', when:'has', v:'pressure'}},
      {id:'pr_rep', en:'Was it reported to Mahelet?', am:'ለማህሌት ተነግሯል?', t:'yesno', auto:{week:'pr_reported', how:'allyes', from:'wude-daily'}, yes:{en:'Mahelet was told', am:'ለማህሌት ተነግሯታል'}, no:{en:'Not told', am:'አልተነገራትም'},
        show:{f:'wk_events', when:'has', v:'pressure'}},
      {id:'pr_rep_why', en:'Why was it not reported? Reporting it is what protects you under your letter.', am:'ለምን አልተነገረም? ማሳወቅ በደብዳቤዎ መሠረት የሚጠብቅዎት ነው።', t:'area',
        picks:[
          { en:'I was afraid to report it',        am:'ማሳወቅ ፈራሁ' },
          { en:'Mahelet was not there',            am:'ማህሌት አልነበረችም' },
          { en:'I settled it myself',              am:'ራሴ ፈታሁት' },
          { en:'I will report it now',             am:'አሁን አሳውቃለሁ' }
        ], show:{f:'pr_rep', when:'no'}}
    ]},
    { en:'Problems and help', am:'ችግርና እርዳታ', fields:[
      {id:'problem', en:'What was the biggest quality problem this week, and what caused it?', am:'የዚህ ሳምንት ትልቁ የጥራት ችግር ምን ነበር? ምክንያቱስ?', t:'area', auto:{weekText:'problem', from:'wude-daily'}, opt:1,
        picks:[
          { en:'No big problem this week',         am:'በዚህ ሳምንት ትልቅ ችግር አልነበረም' },
          { en:'Edge banding lifting',             am:'ጠርዝ መነሳት' },
          { en:'Cutting size wrong',               am:'የቁረጣ ልኬት ስህተት' },
          { en:'Drilling out of place',            am:'ቀዳዳ ከቦታው ወጣ' },
          { en:'Assembly not square',              am:'መገጣጠሙ ቀጥ አልሆነም' },
          { en:'Scratches in handling',            am:'በአያያዝ ጭረት' },
          { en:'Board or hardware from the supplier', am:'ከአቅራቢው የመጣ ሰሌዳ ወይም ሃርድዌር' }
        ]},
      {id:'outstanding', en:'What is still unresolved? (Write which job in the box.)', am:'እስካሁን ያልተፈታው ምንድን ነው? (የትኛው ሥራ እንደሆነ በሳጥኑ ይጻፉ።)', t:'area', opt:1,
        picks:[
          { en:'Nothing is open',                  am:'ያልተፈታ ነገር የለም' },
          { en:'Rework still to do',               am:'ያልተሠራ ዳግም ሥራ' },
          { en:'A customer complaint',             am:'የደንበኛ ቅሬታ' },
          { en:'A supplier problem',               am:'የአቅራቢ ችግር' },
          { en:'A job waiting to be checked again', am:'እንደገና ፍተሻ የሚጠብቅ ሥራ' }
        ]},
      {id:'need_lead', en:'Do you need a decision from Mahelet?', am:'የማህሌት ውሳኔ ያስፈልግዎታል?', t:'yesno', auto:{week:'need_lead', how:'anyyes', from:'wude-daily'}, yes:{en:'I need a decision', am:'ውሳኔ ያስፈልገኛል'}, no:{en:'No decision needed', am:'ውሳኔ አያስፈልገኝም'}},
      {id:'need_lead_what', en:'What should Mahelet decide, and by when?', am:'ማህሌት ምን መወሰን አለባት? እስከ መቼ?', t:'area', auto:{weekText:'need_lead_what', from:'wude-daily'},
        picks:[
          { en:'Release or hold a job',            am:'ሥራ ይለቀቅ ወይስ ይቆይ' },
          { en:'Reject a supplier\'s material',    am:'የአቅራቢውን ዕቃ ውድቅ ማድረግ' },
          { en:'Who does the rework',              am:'ዳግም ሥራውን ማን ይሥራ' },
          { en:'A defect that keeps coming back',  am:'የሚደጋገም ጉድለት' }
        ], show:{f:'need_lead', when:'yes'}}
    ]},
    { en:'Next week', am:'የሚቀጥለው ሳምንት', fields:[
      {id:'n_exp', en:'About how many jobs will you inspect next week? (If you know.)', am:'በሚቀጥለው ሳምንት በግምት ስንት ሥራ ይመረምራሉ? (ካወቁ።)', t:'num', opt:1},
      {id:'n_risk', en:'Which jobs or materials are the biggest quality risk next week? (Write the job in the box.)', am:'በሚቀጥለው ሳምንት ትልቁ የጥራት ስጋት ያለባቸው የትኞቹ ሥራዎች ወይም ዕቃዎች ናቸው? (ሥራውን በሳጥኑ ይጻፉ።)', t:'area', opt:1,
        picks:[
          { en:'Edge banding',                     am:'ጠርዝ ማሰር' },
          { en:'Drilling',                         am:'ቀዳዳ መብሳት' },
          { en:'Assembly',                         am:'መገጣጠም' },
          { en:'Board from a new supplier',        am:'ከአዲስ አቅራቢ የመጣ ሰሌዳ' },
          { en:'Hardware',                         am:'ሃርድዌር' },
          { en:'A big job',                        am:'ትልቅ ሥራ' }
        ]},
      {id:'n_support', en:'What support do you need from Mahelet?', am:'ከማህሌት ምን ድጋፍ ያስፈልግዎታል?', t:'area', auto:{weekText:'need_help', from:'wude-daily'}, opt:1,
        picks:[
          { en:'Nothing needed',                   am:'ምንም አያስፈልግም', nil:1 },
          { en:'More time to inspect',             am:'ለፍተሻ ተጨማሪ ጊዜ' },
          { en:'Better light or tools',            am:'የተሻለ መብራት ወይም መሣሪያ' },
          { en:'Amaha to fix a stage',             am:'አማሃ አንድ ደረጃ እንዲያስተካክል' },
          { en:'Material from the store',          am:'ከመጋዘን ዕቃ' },
          { en:'A decision from Mahelet',          am:'የማህሌት ውሳኔ' }
        ]}
    ]}
  ]
},

/* ====================== WUDE — MONTHLY REWORK ========================= */
{
  id:'wude-monthly', person:'wude', cadence:'monthly', dueTime:'17:00',
  en:'Monthly Rework Report', am:'ወርሃዊ የዳግም ሥራ ሪፖርት',
  toEn:'Mahelet + Selam', toAm:'ማህሌት + ሰላም',
  dueEn:'1st of the following month', dueAm:'በሚቀጥለው ወር 1ኛ ቀን',
  penEn:'Failure to report rework cost –200 Birr', penAm:'የዳግም ሥራ ወጪ ካልተነገረ –200 ብር',
  sections:[
    /* REBUILT 11 Oct 2026 (the Chairman: "they are struggling so much with
       the questions"), kept light. The month's pass rate was typed by hand
       while her own dailies already counted every job inspected and passed:
       it is worked out from them now (v_rate, like Amaha's qc_rate). The
       list of who caused rework is asked only in a month that had rework,
       "if you know"; every "why" is buttons. The rework cost and the cause
       grid stay asked — reporting the cost is her letter's duty, and the
       rulebook reads the grid's cutting, assembly and edge-banding rows.
       Every answer key is the one it always was. */
    { en:'Rework this month', am:'የወሩ ዳግም ሥራ', fields:[
      {id:'m_inspected', en:'How many jobs did you inspect this month?', am:'በዚህ ወር ስንት ሥራ መረመሩ?', t:'num', auto:{week:'i_total'}},
      {id:'m_rework', en:'How many needed rework?', am:'ስንቱ ዳግም ሥራ አስፈለጋቸው?', t:'num',
        auto:{week:'r_required'}},
      {id:'m_rate', en:'What was the rework rate for the month?', am:'የወሩ የዳግም ሥራ መጠን ስንት በመቶ ነበር?', t:'pct',
        auto:{pct:['m_rework', 'm_inspected']},
        tgt:{op:'lte', v:2, en:'Below 2% earns the 1,000 Birr bonus', am:'ከ2% በታች የ1,000 ብር ጉርሻ ያስገኛል'}},
      {id:'m_rate_why', en:'Above 2%: what drove it? (Write the plan for next month in the box.)', am:'ከ2% በላይ ነው፦ ምን አሳደገው? (ለሚቀጥለው ወር ዕቅዱን በሳጥኑ ይጻፉ።)', t:'area',
        picks:[
          { en:'Edge banding lifting',             am:'ጠርዝ መነሳት' },
          { en:'Cutting size wrong',               am:'የቁረጣ ልኬት ስህተት' },
          { en:'Drilling out of place',            am:'ቀዳዳ ከቦታው ወጣ' },
          { en:'Assembly not square',              am:'መገጣጠሙ ቀጥ አልሆነም' },
          { en:'Scratches in handling',            am:'በአያያዝ ጭረት' },
          { en:'Board or hardware from the supplier', am:'ከአቅራቢው የመጣ ሰሌዳ ወይም ሃርድዌር' }
        ], show:{f:'m_rate', when:'miss'}},
      /* reporting the rework cost is the duty this report is fined on
         (–200 Birr), so it stays asked */
      {id:'m_cost', en:'What did rework cost in total this month, in Birr? (Materials and hours.)', am:'በዚህ ወር ዳግም ሥራ በጠቅላላ ስንት ብር አስወጣ? (ዕቃና የሥራ ሰዓት።)', t:'money'},
      {id:'m_cost_how', en:'How was the cost worked out?', am:'ወጪው እንዴት ተሰላ?', t:'area',
        picks:[
          { en:'From the Rework Register',         am:'ከዳግም ሥራ መዝገቡ' },
          { en:'Materials only',                   am:'ዕቃ ብቻ' },
          { en:'Materials and hours',              am:'ዕቃና የሥራ ሰዓት' },
          { en:'A best guess',                     am:'ግምት' }
        ], show:{f:'m_cost', when:'pos'}}
    ]},
    { en:'Rework by cause', am:'ዳግም ሥራ በምክንያት', fields:[
      /* the rulebook reads the Cutting, Assembly and Edge banding rows by
         their English names — the row names must not change */
      {id:'cause_grid', en:'How many reworks did each cause bring this month, and what did they cost? (0 where none.)', am:'በዚህ ወር እያንዳንዱ ምክንያት ስንት ዳግም ሥራ አመጣ? ስንት ብር አስወጣ? (ከሌለ 0።)', t:'grid',
       rows:[{en:'Cutting error', am:'የመቁረጥ ስህተት'},{en:'Assembly error', am:'የመገጣጠም ስህተት'},
             {en:'Edge banding error', am:'የጠርዝ ስህተት'},{en:'Hardware error', am:'የሃርድዌር ስህተት'},
             {en:'Material defect', am:'የቁሳቁስ ጉድለት'},{en:'Design error', am:'የዲዛይን ስህተት'},
             {en:'Other', am:'ሌላ'}],
       cols:[
        {id:'n', en:'Count', am:'ብዛት', t:'num'},
        {id:'cost', en:'Cost (Birr)', am:'ወጪ (ብር)', t:'money'}
      ]},
      {id:'cause_fix', en:'Which cause will you attack first next month? (Write how in the box.)', am:'በሚቀጥለው ወር በመጀመሪያ የትኛውን ምክንያት ይፈታሉ? (እንዴት እንደሆነ በሳጥኑ ይጻፉ።)', t:'area', one:1,
        picks:[
          { en:'Cutting error',                    am:'የመቁረጥ ስህተት' },
          { en:'Assembly error',                   am:'የመገጣጠም ስህተት' },
          { en:'Edge banding error',               am:'የጠርዝ ስህተት' },
          { en:'Hardware error',                   am:'የሃርድዌር ስህተት' },
          { en:'Material defect',                  am:'የቁሳቁስ ጉድለት' },
          { en:'Design error',                     am:'የዲዛይን ስህተት' }
        ]}
    ]},
    { en:'Who caused it', am:'ያስከተለው ማን ነው', fields:[
      /* nothing reads these rows; asked only in a month that had rework */
      {id:'who_rows', en:'Who caused the rework, how many times, and at what cost? (If you know.)', am:'ዳግም ሥራውን ያስከተለው ማን ነው? ስንት ጊዜ? በስንት ብር? (ካወቁ።)',
       t:'table', addEn:'Add person', addAm:'ሰው ጨምር', opt:1, show:{f:'m_rework', when:'pos'}, cols:[
        {id:'who',  en:'Person', am:'ሰው', t:'text'},
        {id:'n',    en:'Rework count', am:'የዳግም ሥራ ብዛት', t:'num'},
        {id:'cost', en:'Total cost', am:'ጠቅላላ ወጪ', t:'money'}
      ]},
      {id:'register_ok', en:'Did Mahelet and Selam check the Rework Register this month?', am:'ማህሌትና ሰላም በዚህ ወር የዳግም ሥራ መዝገቡን አረጋግጠዋል?', t:'yesno', yes:{en:'Both checked it', am:'ሁለቱም አረጋግጠዋል'}, no:{en:'Not checked', am:'አላረጋገጡም'}},
      {id:'register_ok_why', en:'Why not, and when will they?', am:'ለምን? መቼ ያረጋግጣሉ?', t:'area',
        picks:[
          { en:'They had no time',                 am:'ጊዜ አልነበራቸውም' },
          { en:'The register is not complete',     am:'መዝገቡ አልተሟላም' },
          { en:'They will check next week',        am:'በሚቀጥለው ሳምንት ያረጋግጣሉ' },
          { en:'Not asked yet',                    am:'ገና አልተጠየቁም' }
        ], show:{f:'register_ok', when:'no'}}
    ]},
    { en:'Quality check', am:'የጥራት ማረጋገጫ', fields:[
      /* worked out from her dailies (every job inspected and passed this
         month), the way Amaha's monthly qc_rate is — it used to be typed */
      {id:'v_rate', en:'What was the QC pass rate for the month?', am:'የወሩ የጥራት ቁጥጥር ማለፊያ መጠን ስንት በመቶ ነበር?', t:'pct',
        auto:{pct:[{week:'i_pass'}, {week:'i_total'}]},
        tgt:{op:'gte', v:98, en:'Below 98% is –500 Birr', am:'ከ98% በታች –500 ብር'}},
      {id:'v_rate_why', en:'Below 98%: what caused it?', am:'ከ98% በታች ነው፦ ምን አመጣው?', t:'area',
        picks:[
          { en:'Edge banding lifting',             am:'ጠርዝ መነሳት' },
          { en:'Cutting size wrong',               am:'የቁረጣ ልኬት ስህተት' },
          { en:'Drilling out of place',            am:'ቀዳዳ ከቦታው ወጣ' },
          { en:'Assembly not square',              am:'መገጣጠሙ ቀጥ አልሆነም' },
          { en:'Scratches in handling',            am:'በአያያዝ ጭረት' },
          { en:'Board or hardware from the supplier', am:'ከአቅራቢው የመጣ ሰሌዳ ወይም ሃርድዌር' }
        ], show:{f:'v_rate', when:'miss'}},
      {id:'v_released', en:'How many defects reached finished goods this month?', am:'በዚህ ወር ስንት ጉድለቶች ወደ ዝግጁ ዕቃ ማከማቻ ገቡ?', t:'num',
        auto:{week:'d_released'},
        tgt:{op:'lte', v:0, en:'–500 Birr each', am:'እያንዳንዱ –500 ብር'}},
      {id:'v_released_what', en:'How did each get past inspection? (Write the jobs in the box.)', am:'እያንዳንዱ ከፍተሻ እንዴት አመለጠ? (ሥራዎቹን በሳጥኑ ይጻፉ።)', t:'area',
        picks:[
          { en:'Not fully inspected',              am:'ሙሉ በሙሉ አልተፈተሸም' },
          { en:'Released without QC',              am:'ያለ ጥራት ፍተሻ ወጣ' },
          { en:'Missed in the check',              am:'በፍተሻው አልታየም' },
          { en:'Damaged after QC',                 am:'ከጥራት ፍተሻ በኋላ ተጎዳ' },
          { en:'Pulled back',                      am:'ተመልሷል' }
        ], show:{f:'v_released', when:'pos'}},
      /* Amaha's quality bonus needs this at 0, so it stays asked */
      {id:'v_complaints', en:'How many customer complaints this month were about quality? (0 if none.)', am:'በዚህ ወር ስንት የደንበኛ ቅሬታዎች ስለ ጥራት ነበሩ? (ከሌለ 0።)', t:'num',
        tgt:{op:'lte', v:0, en:'–1,000 Birr each', am:'እያንዳንዱ –1,000 ብር'}},
      {id:'v_complaints_what', en:'About what, and is each one closed? (Write the customers in the box.)', am:'ስለምን? እያንዳንዱ ተዘግቷል? (ደንበኞቹን በሳጥኑ ይጻፉ።)', t:'area',
        picks:[
          { en:'Scratches or marks',               am:'ጭረት ወይም ምልክት' },
          { en:'Doors or drawers not even',        am:'በሮች ወይም መሳቢያዎች እኩል አይደሉም' },
          { en:'Edge lifting',                     am:'ጠርዝ ተነስቷል' },
          { en:'Hardware',                         am:'ሃርድዌር' },
          { en:'All closed',                       am:'ሁሉም ተዘግተዋል' },
          { en:'Some still open',                  am:'አንዳንዱ ገና ክፍት ነው' }
        ], show:{f:'v_complaints', when:'pos'}}
    ]},
    { en:'Next month', am:'የሚቀጥለው ወር', fields:[
      {id:'m_need', en:'What do you need from Mahelet or Selam to bring rework down?', am:'ዳግም ሥራን ለመቀነስ ከማህሌት ወይም ከሰላም ምን ያስፈልግዎታል?', t:'area', opt:1,
        picks:[
          { en:'Nothing needed',                   am:'ምንም አያስፈልግም', nil:1 },
          { en:'More time to inspect',             am:'ለፍተሻ ተጨማሪ ጊዜ' },
          { en:'Amaha to fix a stage',             am:'አማሃ አንድ ደረጃ እንዲያስተካክል' },
          { en:'Better material from the supplier', am:'ከአቅራቢው የተሻለ ዕቃ' },
          { en:'Money for tools (Selam)',          am:'ለመሣሪያ ገንዘብ (ሰላም)' },
          { en:'A decision from Mahelet',          am:'የማህሌት ውሳኔ' }
        ]}
    ]}
  ]
},

/* ========================= ELYAS — DAILY SITE ========================== */
{
  id:'elyas-daily', person:'elyas', cadence:'daily', dueTime:'17:30',
  en:'Daily Site Report', am:'ዕለታዊ የተከላ ቦታ ሪፖርት',
  toEn:'Mahelet + Ephrata', toAm:'ማህሌት + ኤፍራታ',
  dueEn:'5:30 PM every working day', dueAm:'በየሥራ ቀኑ ከቀኑ 11፡30 (5:30 PM)',
  penEn:'Late –200 Birr · Missing –500 Birr', penAm:'ዘግይቶ –200 ብር · ካልተላከ –500 ብር',
  sections:[
    /* REBUILT 11 Oct 2026 (the Chairman: "they are struggling so much with
       the questions"). Elyas's first three reports left 49%, 78% and 30% of
       the questions empty: he filled the job list, tapped the yes/no answers
       near the top, and stopped. 35 questions stood before any follow-up
       opened, sixteen of them yes/no about things that go wrong now and then
       (a site left dirty, a floor not covered, a WhatsApp message not
       posted), and the "was the site ready" section, the assemblers'
       behaviour, the WhatsApp count and tomorrow's plan were empty every
       time. Now a normal day is the jobs, one tap on "nothing else
       happened", the assembler head count, the acceptance forms, whether a
       decision is needed and tomorrow's jobs. Everything that goes wrong is
       one tap on the list in section 2, and only then are its questions
       asked; every "why" is buttons with a box for the job code. Every
       answer key is the one it always was — the yes/no answers the rulebook
       reads (cl_clean, cl_damage, q_rework) are worked out from the list
       ({picked:…}, quiet:1), and the counts it reads (complaints, early
       leave, behaviour, sites not ready) file a real 0 on a normal day
       (zero:1). The job list, its two lists of job codes and the site photos
       (10 Oct 2026) are exactly as they were. */
    { en:"Today's jobs", am:'የዛሬ ሥራዎች', fields:[
      /* Three counts and the m² stood over this list, and the list could not
         say whether a job was finished — so it said one thing and they said
         another (the Chairman, 9 Oct 2026). The row says it all now: the m²,
         whether it finished, whether the slip was there, whether the customer
         was called before the van arrived.
         Which jobs are on installation and which are finished, by name (the
         Chairman, 10 Oct 2026). A job waiting on the site or on material is
         still on installation on a day nobody touched it, so it stays on the
         list as "no work today" instead of dropping out of sight. */
      {id:'j_rows', en:'Every job on installation, and every job finished today', am:'ተከላ ላይ ያለ እያንዳንዱ ሥራ፣ እና ዛሬ የተጠናቀቀ እያንዳንዱ ሥራ',
       t:'table', addEn:'Add job', addAm:'ሥራ ጨምር', cols:[
        {id:'code',  en:'Job code', am:'የሥራ ኮድ', t:'text'},
        {id:'cust',  en:'Customer', am:'ደንበኛ', t:'text'},
        {id:'state', en:'Where is it now?', am:'አሁን የት ደረሰ?', t:'choice', opts:[
          {v:'done', en:'Installation finished today',       am:'ተከላው ዛሬ ተጠናቋል'},
          {v:'wip',  en:'On installation — worked on today', am:'ተከላ ላይ ነው — ዛሬ ተሠርቷል'},
          {v:'idle', en:'On installation — no work today',   am:'ተከላ ላይ ነው — ዛሬ አልተሠራም'}
        ]},
        {id:'m2',    en:'m² installed', am:'የተገጠመ ካሬ ሜትር', t:'num'},
        {id:'start', en:'Start time', am:'የተጀመረበት ሰዓት', t:'text', time:1},
        {id:'fin',   en:'Finish time', am:'የተጠናቀቀበት ሰዓት', t:'text', time:1},
        {id:'ontime',en:'On time', am:'በሰዓቱ', t:'yesno', yes:{en:'On time', am:'በሰዓቱ'}, no:{en:'Late', am:'ዘግይቷል'}},
        {id:'slip',  en:'Payment slip in hand before work started', am:'ሥራ ከመጀመሩ በፊት የክፍያ ወረቀት ነበረ', t:'yesno', yes:{en:'Slip in hand', am:'ወረቀቱ ነበረ'}, no:{en:'No slip', am:'ወረቀት አልነበረም'}},
        {id:'called',en:'Customer called 30 min before arrival', am:'ከመድረስ 30 ደቂቃ በፊት ለደንበኛው ተደውሏል', t:'yesno', yes:{en:'Called', am:'ተደውሏል'}, no:{en:'Not called', am:'አልተደወለም'}},
        /* a photo button in the row itself (the Chairman, 12 Oct 2026): sent
           to Leads with this row's job code, counted in ph_site below */
        {id:'photos',en:'Photos of this job', am:'የዚህ ሥራ ፎቶዎች', t:'photo', tally:'ph_site'}
      ]},
      /* the two lists the Chairman reads first, named job by job */
      {id:'j_on_list', en:'Jobs on installation now', am:'አሁን ተከላ ላይ ያሉ ሥራዎች', t:'text',
        auto:{list:'j_rows.code', when:{col:'state', in:['wip', 'idle']}}},
      {id:'j_fin_list', en:'Jobs whose installation finished today', am:'ዛሬ ተከላቸው የተጠናቀቀ ሥራዎች', t:'text',
        auto:{list:'j_rows.code', when:{col:'state', is:'done'}}},
      /* a row with no answer in "Where is it now?" counts as worked on,
         as every row did before the "no work today" choice existed */
      {id:'j_total', en:'How many jobs did your team work on today?', am:'ዛሬ ቡድንዎ በስንት ሥራዎች ላይ ሠራ?', t:'num',
        auto:{rows:'j_rows', when:{col:'state', in:['done', 'wip', '']}}, sumEn:'worked on today', sumAm:'ዛሬ የተሠራባቸው'},
      {id:'j_done', en:'How many of them were finished today?', am:'ከእነዚህ ስንቱ ዛሬ ተጠናቀቁ?', t:'num',
        auto:{rows:'j_rows', when:{col:'state', is:'done'}}, sumEn:'finished', sumAm:'ተጠናቀዋል'},
      {id:'j_wip', en:'How many are still on installation?', am:'ስንቱ ገና ተከላ ላይ ናቸው?', t:'num',
        auto:{rows:'j_rows', when:{col:'state', in:['wip', 'idle']}}, sumEn:'still on installation', sumAm:'ገና ተከላ ላይ'},
      {id:'j_idle', en:'How many had no work today?', am:'ስንቱ ዛሬ አልተሠራባቸውም?', t:'num',
        auto:{rows:'j_rows', when:{col:'state', is:'idle'}}, sumEn:'no work today', sumAm:'ዛሬ ያልተሠራባቸው'},
      {id:'j_m2', en:'How many m² were installed today?', am:'ዛሬ ስንት ካሬ ሜትር ተገጠመ?', t:'num',
        auto:{sum:'j_rows.m2'}, sumEn:'m² installed', sumAm:'ካሬ ሜትር ተገጥሟል'},
      {id:'j_ontime', en:'How many were on time?', am:'በሰዓቱ የሆኑት ስንት ናቸው?', t:'num',
        auto:{rows:'j_rows', when:{col:'ontime', is:'yes'}}, sumEn:'on time', sumAm:'በሰዓቱ'},
      {id:'j_idle_why', en:'No work on some jobs today. Why? (Write the job in the box.)', am:'በአንዳንድ ሥራዎች ዛሬ አልተሠራም። ለምን? (ሥራውን በሳጥኑ ይጻፉ።)', t:'area',
        picks:[
          { en:'The customer was not home',        am:'ደንበኛው ቤት አልነበረም' },
          { en:'The site was not ready',           am:'ቦታው ዝግጁ አልነበረም' },
          { en:'Waiting for a part or material',   am:'መለዋወጫ ወይም ዕቃ እየጠበቅን ነው' },
          { en:'The truck came late',              am:'መኪናው ዘገየ' },
          { en:'Not enough assemblers',            am:'ገጣጣሚ አልበቃም' },
          { en:'The customer asked us to wait',    am:'ደንበኛው እንድንጠብቅ ጠየቀ' },
          { en:'Waiting for payment',              am:'ክፍያ እየጠበቅን ነው' }
        ], show:{f:'j_idle', when:'pos'}},
      {id:'j_wip_left', en:'What is left on the open jobs, and when will each finish? (Write the job code and the day in the box.)', am:'ባላለቁት ሥራዎች ላይ ምን ቀረ? እያንዳንዱ መቼ ያልቃል? (የሥራ ኮዱንና ቀኑን በሳጥኑ ይጻፉ።)', t:'area',
        picks:[
          { en:'Finishes tomorrow',                am:'ነገ ያልቃል' },
          { en:'Needs 2–3 more days',              am:'2–3 ተጨማሪ ቀን ያስፈልገዋል' },
          { en:'Only doors and handles left',      am:'በሮችና መያዣዎች ብቻ ቀርተዋል' },
          { en:'Waiting for a part from the factory', am:'ከፋብሪካ መለዋወጫ እየጠበቅን ነው' },
          { en:'Waiting for the customer or the site', am:'ደንበኛውን ወይም ቦታውን እየጠበቅን ነው' },
          { en:'Waiting for the appliances',       am:'የኤሌክትሪክ ዕቃዎቹን እየጠበቅን ነው' }
        ], show:{f:'j_wip', when:'pos'}},
      /* a job nobody worked on today had no slip to show, and is not a "no" */
      {id:'j_slips', en:'Did every job have its assembler Payment Confirmation Slip before work started?', am:'ሥራ ከመጀመሩ በፊት ለእያንዳንዱ ሥራ የገጣጣሚ ክፍያ ማረጋገጫ ወረቀት ነበረ?', t:'yesno', yes:{en:'Every job had its slip', am:'ሁሉም ወረቀት ነበራቸው'}, no:{en:'Some had no slip', am:'ወረቀት ያልነበረው አለ'},
        auto:{all:'j_rows.slip', when:{col:'state', in:['done', 'wip', '']}}},
      {id:'j_slips_why', en:'Which job had no slip, and did work start without it? (Write the job in the box.)', am:'ማረጋገጫ ወረቀት ያልነበረው የትኛው ሥራ ነው? ወረቀቱ ሳይኖር ሥራ ተጀመረ? (ሥራውን በሳጥኑ ይጻፉ።)', t:'area',
        picks:[
          { en:'Selam has not given it yet',       am:'ሰላም ገና አልሰጠችም' },
          { en:'Work started without the slip',    am:'ወረቀቱ ሳይኖር ሥራ ተጀመረ' },
          { en:'Work waited for the slip',         am:'ሥራው ወረቀቱን ጠበቀ' },
          { en:'The slip came later in the day',   am:'ወረቀቱ ቆይቶ ደረሰ' }
        ], show:{f:'j_slips', when:'no'}},
      /* counted from the "called" column of the job list above; the rulebook
         fines each site visited without the call (elyas-no-30min-call) */
      {id:'ac_called', en:'How many customers were called 30 minutes before arrival? (called / sites visited)', am:'ከመድረስዎ 30 ደቂቃ በፊት ስንት ደንበኞች ተደወለላቸው? (የተደወለላቸው / የተጎበኙ ቦታዎች)', t:'ratio',
        /* only the rows where "customer called" was answered count (11 Oct
           2026). Counting every worked row as visited and only the "yes"
           rows as called made a blank cell a fine: 10 Oct charged Elyas 600
           Birr for three cells he had left empty. Blank is not "no" anywhere
           else in this system, and it is not here. */
        /* both sides only the sites worked today: an idle row marked Called
           hid a visit that was not (the bug hunt, 15 Oct 2026) */
        auto:{a:{rows:'j_rows', when:[{col:'state', in:['done', 'wip', '']}, {col:'called', is:'yes'}]}, b:{rows:'j_rows', when:[{col:'state', in:['done', 'wip', '']}, {col:'called', in:['yes', 'no']}]}}},
      {id:'ac_called_why', en:'Which customers were not called before you arrived, and why? (Write the customer in the box.)', am:'ከመድረስዎ በፊት ያልተደወለላቸው የትኞቹ ደንበኞች ናቸው? ለምን? (ደንበኛውን በሳጥኑ ይጻፉ።)', t:'area',
        picks:[
          { en:"The customer's phone was off",     am:'የደንበኛው ስልክ ዝግ ነበር' },
          { en:'No network',                       am:'ኔትወርክ አልነበረም' },
          { en:'Forgot',                           am:'ተረስቷል' },
          { en:'The customer was already waiting', am:'ደንበኛው ቀድሞ እየጠበቀ ነበር' },
          { en:'Called, but less than 30 minutes before', am:'ተደውሏል፣ ግን ከ30 ደቂቃ ባነሰ ጊዜ በፊት' }
        ], show:{f:'ac_called', when:'short'}},
      /* Photos from the site (the Chairman, 10 Oct 2026). Each one goes into
         the room this report is delivered to the moment it is added, with
         its job code on it; what is kept here is only the tally, so the
         report says which jobs have photos. */
      {id:'ph_site', en:'Site photos', am:'የቦታ ፎቶዎች', t:'photos', jobsFrom:'j_rows.code', opt:1}
    ]},
    /* THE ONE LIST. Sixteen yes/no questions and five counts used to stand
       in sections of their own — assemblers late, early, rude; the site not
       ready; rework; a site left dirty; four WhatsApp messages — and on a day
       when none of it happened that was twenty answers, which is why they
       were left empty. */
    { en:'Anything else today?', am:'ዛሬ ሌላ የሆነ ነገር አለ?', fields:[
      {id:'site_events', en:'What else happened on the sites today?', am:'ዛሬ በሥራ ቦታዎቹ ሌላ ምን ሆነ?', t:'multi',
        none:{ en:'Nothing — a normal day', am:'ምንም — የተለመደ ቀን' },
        groups:[
          { v:'asm',   en:'Assemblers',          am:'ገጣጣሚዎች' },
          { v:'site',  en:'The site',            am:'የሥራ ቦታው' },
          { v:'mat',   en:'Material',            am:'ዕቃ' },
          { v:'qual',  en:'Quality',             am:'ጥራት' },
          { v:'cust',  en:'The customer',        am:'ደንበኛው' },
          { v:'clean', en:'Cleaning and tools',  am:'ጽዳትና መሣሪያ' },
          { v:'wa',    en:'WhatsApp',            am:'ዋትስአፕ' }
        ],
        opts:[
          { v:'asm_late',    g:'asm',   en:'An assembler came late',                       am:'ዘግይቶ የደረሰ ገጣጣሚ ነበር' },
          { v:'asm_early',   g:'asm',   en:'An assembler left before the job was done',    am:'ሥራው ሳያልቅ የወጣ ገጣጣሚ ነበር' },
          { v:'asm_behave',  g:'asm',   en:'An assembler broke the site rules (smoking, loud phone, rudeness, arguing)', am:'የቦታውን ደንብ የጣሰ ገጣጣሚ ነበር (ማጨስ፣ ጮክ ያለ ስልክ፣ ብልግና፣ ክርክር)' },
          { v:'asm_untold',  g:'asm',   en:'An assembler problem was not told to Mahelet', am:'ለማህሌት ያልተነገረ የገጣጣሚ ችግር አለ' },
          { v:'not_ready',   g:'site',  en:'A site was not ready (walls, power, water, floor, appliances)', am:'ዝግጁ ያልሆነ ቦታ ነበር (ግድግዳ፣ መብራት፣ ውሃ፣ ወለል፣ የኤሌክትሪክ ዕቃ)' },
          { v:'meas',        g:'site',  en:'A site did not match our measurement',         am:'ከልኬታችን ጋር ያልተመሳሰለ ቦታ ነበር' },
          { v:'mat',         g:'mat',   en:'Material, tools or accessories were missing, wrong or damaged', am:'የጎደለ፣ የተሳሳተ ወይም የተጎዳ ዕቃ፣ መሣሪያ ወይም መለዋወጫ ነበር' },
          { v:'rework',      g:'qual',  en:'A job needed rework at the site',              am:'በቦታው ዳግም ሥራ ያስፈለገው ሥራ ነበር' },
          { v:'no_walk',     g:'qual',  en:'Finished work was not walked through with the customer', am:'ከደንበኛው ጋር ቅኝት ያልተደረገበት የተጠናቀቀ ሥራ አለ' },
          { v:'no_doors',    g:'qual',  en:'Doors, drawers or alignment were not checked on a job', am:'በሮች፣ መሳቢያዎች ወይም አሰላለፍ ያልተፈተሹበት ሥራ አለ' },
          { v:'no_edges',    g:'qual',  en:'Edges or handles were not checked on a job',   am:'ጠርዞች ወይም እጀታዎች ያልተፈተሹበት ሥራ አለ' },
          { v:'complaint',   g:'cust',  en:'A customer complained',                        am:'ቅሬታ ያቀረበ ደንበኛ ነበር' },
          { v:'damage',      g:'cust',  en:"The customer's property was damaged",          am:'የደንበኛ ንብረት ተጎዳ' },
          { v:'unprotected', g:'cust',  en:"The customer's floor, walls or furniture were not covered", am:'የደንበኛው ወለል፣ ግድግዳ ወይም የቤት ዕቃ አልተሸፈነም' },
          { v:'dirty',       g:'clean', en:'A site was left dirty, or with packaging',     am:'ቆሻሻ ወይም ማሸጊያ ያለበት ቦታ ቀረ' },
          { v:'tools_out',   g:'clean', en:'Tools or unused material did not come back to the store', am:'ወደ መጋዘን ያልተመለሰ መሣሪያ ወይም ያልዋለ ዕቃ አለ' },
          { v:'no_welcome',  g:'wa',    en:'Welcome Message not posted in a new group',    am:'በአዲስ ግሩፕ የአቀባበል መልዕክት አልተላከም' },
          { v:'no_started',  g:'wa',    en:'"Installation Started" not posted for a job',  am:'ለአንድ ሥራ "ተከላ ተጀመረ" አልተላከም' },
          { v:'no_progress', g:'wa',    en:'An assembler did not post the Daily Progress Update', am:'የዕለት ሪፖርት ያልላከ ገጣጣሚ አለ' },
          { v:'no_accept',   g:'wa',    en:'Acceptance Request not posted after a finished job', am:'ከተጠናቀቀ ሥራ በኋላ የተቀባይነት ጥያቄ አልተላከም' },
          { v:'wa_other',    g:'wa',    en:'Another WhatsApp mistake by the site team',    am:'የቦታው ቡድን ሌላ የዋትስአፕ ስህተት ሠራ' }
        ]}
    ]},
    { en:'Assemblers', am:'ገጣጣሚዎች', fields:[
      {id:'a_present', en:'How many assemblers were on site today?', am:'ዛሬ ስንት ገጣጣሚዎች በቦታው ተገኙ?', t:'num'},
      {id:'a_late_any', en:'Did any assembler arrive late?', am:'ዘግይቶ የደረሰ ገጣጣሚ አለ?', t:'yesno', quiet:1, auto:{picked:'site_events', v:'asm_late'}},
      /* the rulebook fines each assembler on this list by name
         (assembler-late, rows with minutes above 0) */
      {id:'a_late_who', en:'Who was late?', am:'የዘገዩት እነማን ናቸው?', t:'table', addEn:'Add an assembler', addAm:'ገጣጣሚ ጨምር',
        show:{f:'a_late_any', when:'yes'},
        cols:[
          {id:'name', en:'Assembler', am:'ገጣጣሚ', t:'text'},
          {id:'mins', en:'Minutes late', am:'የዘገዩበት ደቂቃ', t:'num'},
          {id:'act', en:'Action taken', am:'የተወሰደ እርምጃ', t:'text', picks:COL_SITE_ACTION}
        ]},
      {id:'a_late', en:'How many assemblers arrived late?', am:'ስንት ገጣጣሚዎች ዘግይተው ደረሱ?', t:'num',
        auto:{rows:'a_late_who'}, sumEn:'late', sumAm:'ዘግይተዋል',
        tgt:{op:'lte', v:0, en:'Unreported lateness is –200 Birr', am:'ያልተነገረ መዘግየት –200 ብር'}},
      {id:'a_early', en:'How many assemblers left before the job was done?', am:'ሥራው ሳያልቅ ስንት ገጣጣሚዎች ቀድመው ወጡ?', t:'num', zero:1,
        show:{f:'site_events', when:'has', v:'asm_early'},
        tgt:{op:'lte', v:0, en:'Unreported early leave is –200 Birr', am:'ያልተነገረ ቀድሞ መውጣት –200 ብር'}},
      {id:'a_early_who', en:'Who left early, and did you allow it? (Write who, the time and what was left in the box.)', am:'ቀድሞ የወጣው ማን ነው? እርስዎ ፈቅደዋል? (ማን፣ በስንት ሰዓትና ምን እንደቀረ በሳጥኑ ይጻፉ።)', t:'area',
        picks:[
          { en:'I allowed it',                     am:'እኔ ፈቅጃለሁ' },
          { en:'Left without my permission',       am:'ያለ ፈቃዴ ወጣ' },
          { en:'Sick',                             am:'ታመመ' },
          { en:'Family matter',                    am:'የቤተሰብ ጉዳይ' },
          { en:'The rest of the work is for tomorrow', am:'የቀረው ሥራ ለነገ ተላለፈ' },
          { en:'Mahelet was told',                 am:'ለማህሌት ተነግሯል' }
        ], show:{f:'a_early', when:'pos'}},
      {id:'a_behave', en:'How many times did an assembler break the site rules today?', am:'ዛሬ ገጣጣሚዎች ስንት ጊዜ የቦታውን ደንብ ጣሱ?', t:'num', zero:1,
        show:{f:'site_events', when:'has', v:'asm_behave'},
        tgt:{op:'lte', v:0, en:'Unreported bad behaviour is –500 Birr', am:'ያልተነገረ የባህርይ ችግር –500 ብር'}},
      {id:'a_behave_what', en:'What happened, and what was done? (Write who, and at which customer, in the box.)', am:'ምን ሆነ? ምን እርምጃ ተወሰደ? (ማን እንደሆነና በየትኛው ደንበኛ ቤት በሳጥኑ ይጻፉ።)', t:'area',
        picks:[
          { en:'Smoking',                          am:'ማጨስ' },
          { en:'Loud phone or music',              am:'ጮክ ያለ ስልክ ወይም ሙዚቃ' },
          { en:'Rude to the customer',             am:'ደንበኛውን አላከበረም' },
          { en:'Arguing',                          am:'ክርክር' },
          { en:'Warned',                           am:'ማስጠንቀቂያ ተሰጠው' },
          { en:'Penalty applied',                  am:'ቅጣት ተጣለበት' },
          { en:'Mahelet was told',                 am:'ለማህሌት ተነግሯል' }
        ], show:{f:'a_behave', when:'pos'}},
      {id:'a_reported', en:'Were all of these reported to Mahelet today?', am:'እነዚህ ሁሉ ዛሬ ለማህሌት ተነግረዋል?', t:'yesno', quiet:1, auto:{picked:'site_events', v:'asm_untold', flip:1}},
      {id:'a_reported_why', en:'What was not told to Mahelet, and why?', am:'ለማህሌት ያልተነገረው ምንድን ነው? ለምን?', t:'area',
        picks:[
          { en:'Could not reach Mahelet',          am:'ማህሌት አልተገኘችም' },
          { en:'Forgot',                           am:'ተረስቷል' },
          { en:'Thought it was small',             am:'ትንሽ ነገር መስሎኝ ነበር' },
          { en:'Will tell her tomorrow',           am:'ነገ እነግራታለሁ' }
        ], show:{f:'a_reported', when:'no'}}
    ]},
    { en:'Customer acceptance', am:'የደንበኛ ተቀባይነት', fields:[
      {id:'ac_any', en:'Did any customer sign the acceptance form today?', am:'ዛሬ የተቀባይነት ፎርም የፈረመ ደንበኛ አለ?', t:'yesno', yes:{en:'A customer signed', am:'ደንበኛ ፈርመዋል'}, no:{en:'Nobody signed', am:'የፈረመ የለም'}},
      {id:'ac_list', en:'Which customers?', am:'የትኞቹ ደንበኞች?', t:'table', addEn:'Add a customer', addAm:'ደንበኛ ጨምር',
        show:{f:'ac_any', when:'yes'}, cols:[
          {id:'cust', en:'Customer', am:'ደንበኛ', t:'text'},
          {id:'code', en:'Job code', am:'የሥራ ኮድ', t:'text'}
        ]},
      {id:'ac_signed', en:'How many customers signed the acceptance form today?', am:'ዛሬ ስንት ደንበኞች የተቀባይነት ፎርም ፈረሙ?', t:'num',
        auto:{rows:'ac_list'}, sumEn:'signed', sumAm:'ፈርመዋል'},
      /* the rulebook charges each one (elyas-customer-complaint) and a month
         without any pays three bonuses, so a normal day files a real 0 */
      {id:'ac_complaints', en:'How many customer complaints came in today?', am:'ዛሬ ስንት የደንበኛ ቅሬታዎች ቀረቡ?', t:'num', zero:1,
        show:{f:'site_events', when:'has', v:'complaint'},
        tgt:{op:'lte', v:0, en:'A complaint costs the 3,000 + 2,000 Birr bonuses',
             am:'ቅሬታ የ3,000 + 2,000 ብር ጉርሻዎችን ያሳጣል'}},
      {id:'ac_complaints_what', en:'What was the complaint, what was done, and is it closed? (Write the customer or job in the box.)', am:'ቅሬታው ምን ነበር? ምን ተደረገ? ተዘግቷል? (ደንበኛውን ወይም ሥራውን በሳጥኑ ይጻፉ።)', t:'area',
        picks:[
          { en:'Late installation',                am:'ተከላው ዘገየ' },
          { en:'Scratch or damage',                am:'ጭረት ወይም ጉዳት' },
          { en:'Wrong size or design',             am:'የተሳሳተ ልክ ወይም ዲዛይን' },
          { en:'A part is missing',                am:'መለዋወጫ ጎድሏል' },
          { en:"An assembler's behaviour",         am:'የገጣጣሚ ባህርይ' },
          { en:'Fixed and closed',                 am:'ተስተካክሎ ተዘግቷል' },
          { en:'Still open',                       am:'ገና አልተዘጋም' }
        ], show:{f:'ac_complaints', when:'pos'}}
    ]},
    { en:'Material on arrival', am:'የደረሰው ዕቃ', fields:[
      {id:'mat_missing', en:'On arrival, was anything missing, wrong or damaged in the materials, tools or accessories?', am:'በደረሱበት ጊዜ ከቁሳቁሶች፣ ከመሣሪያዎች ወይም ከአክሰሰሪዎች የጎደለ፣ የተሳሳተ ወይም የተጎዳ ነገር ነበር?', t:'yesno', quiet:1, auto:{picked:'site_events', v:'mat'}},
      {id:'mat_missing_what', en:'What was missing, wrong or damaged, and whose error was it? (Write the job, and the hours it cost, in the box.)', am:'ምን ጎደለ፣ ተሳሳተ ወይም ተጎዳ? የማን ስህተት ነበር? (ሥራውንና ያስጠፋውን ሰዓት በሳጥኑ ይጻፉ።)', t:'area',
        picks:[
          { en:'A part was missing',               am:'መለዋወጫ ጎደለ' },
          { en:'Wrong size or colour',             am:'የተሳሳተ ልክ ወይም ቀለም' },
          { en:'Hardware short (hinges, handles, slides)', am:'ሃርድዌር አነሰ (ማጠፊያ፣ መያዣ፣ ተንሸራታች)' },
          { en:'Damaged on the truck',             am:'በመኪናው ላይ ተጎዳ' },
          { en:'Came from the factory damaged',    am:'ከፋብሪካው ተጎድቶ መጣ' },
          { en:'The store gave the wrong thing',   am:'መጋዘኑ የተሳሳተ ዕቃ ሰጠ' },
          { en:'Tools missing',                    am:'መሣሪያ ጎደለ' }
        ], show:{f:'mat_missing', when:'yes'}}
    ]},
    { en:'Was the site ready', am:'ቦታው ዝግጁ ነበር', fields:[
      /* job by job, read into the register (Register.js: each "no" names
         what was wrong at that job's site) */
      {id:'r_rows', en:'Which site, and what did you find there? (Choose No for what was not right.)', am:'የትኛው ቦታ ነው? እዚያ ምን አገኙ? (ትክክል ላልሆነው "አይደለም" ይምረጡ።)',
       t:'table', addEn:'Add job', addAm:'ሥራ ጨምር', show:{f:'site_events', when:'has', v:['not_ready', 'meas']}, cols:[
        {id:'rcode',  en:'Job code', am:'የሥራ ኮድ', t:'text'},
        {id:'rwalls', en:'Walls and floor finished', am:'ግድግዳና ወለል ተጠናቋል', t:'yesno', yes:{en:'Finished', am:'ተጠናቋል'}, no:{en:'Not finished', am:'አልተጠናቀቀም'}},
        {id:'rpower', en:'Power available', am:'መብራት አለ', t:'yesno', yes:{en:'Power on', am:'መብራት አለ'}, no:{en:'No power', am:'መብራት የለም'}},
        {id:'rwater', en:'Water and drain ready', am:'ውሃና ፍሳሽ ዝግጁ', t:'yesno', yes:{en:'Ready', am:'ዝግጁ ነው'}, no:{en:'Not ready', am:'ዝግጁ አይደለም'}},
        {id:'rlevel', en:'Floor level within tolerance', am:'ወለሉ ልክ ነው', t:'yesno', yes:{en:'Level', am:'ልክ ነው'}, no:{en:'Not level', am:'ልክ አይደለም'}},
        {id:'rmeas',  en:'Site matched our measurement', am:'ቦታው ከልኬታችን ጋር ተመሳስሏል', t:'yesno', yes:{en:'Matched', am:'ይመሳሰላል'}, no:{en:'Did not match', am:'አይመሳሰልም'}},
        {id:'rappl',  en:'Appliances on site and correct', am:'የኤሌክትሪክ ዕቃዎች ደርሰዋል', t:'yesno', yes:{en:'There and correct', am:'ደርሰዋል፣ ትክክል ናቸው'}, no:{en:'Missing or wrong', am:'የሉም ወይም ስሕተት ናቸው'}},
        {id:'rlost',  en:'Hours lost', am:'የጠፋ ሰዓት', t:'num'}
      ]},
      /* the hours were asked twice — in the rows and again here; the rows
         are where they are now typed, and this is their total */
      {id:'r_lost', en:'How many hours were lost today because a site was not ready?', am:'ቦታው ዝግጁ ባለመሆኑ ዛሬ ስንት ሰዓት ጠፋ?', t:'num',
        auto:{sum:'r_rows.rlost'}, sumEn:'hours lost', sumAm:'ሰዓት ጠፍቷል'},
      {id:'r_notready', en:'On how many jobs was the site not ready?', am:'በስንት ሥራዎች ቦታው ዝግጁ አልነበረም?', t:'num', zero:1,
        show:{f:'site_events', when:'has', v:'not_ready'}},
      {id:'r_notready_what', en:'Whose side is it, and when can work restart? (Write the job in the box.)', am:'የማን ኃላፊነት ነው? ሥራው መቼ እንደገና ይጀመራል? (ሥራውን በሳጥኑ ይጻፉ።)', t:'area',
        picks:[
          { en:"The customer's builder",           am:'የደንበኛው ግንበኛ' },
          { en:'The customer',                     am:'ደንበኛው' },
          { en:'Power or water not connected yet', am:'መብራት ወይም ውሃ ገና አልገባም' },
          { en:'Our side',                         am:'የእኛ ወገን' },
          { en:'Restarts tomorrow',                am:'ነገ እንደገና ይጀመራል' },
          { en:'Restarts this week',               am:'በዚህ ሳምንት እንደገና ይጀመራል' },
          { en:'No date yet',                      am:'ገና ቀን የለውም' }
        ], show:{f:'r_notready', when:'pos'}},
      {id:'r_meas', en:'On how many jobs did the site not match our measurement?', am:'በስንት ሥራዎች ቦታው ከልኬታችን ጋር አልተመሳሰለም?', t:'num', zero:1,
        show:{f:'site_events', when:'has', v:'meas'},
        tgt:{op:'lte', v:0, en:'A measurement that does not match is a design or survey failure — name the job',
             am:'ያልተመሳሰለ ልኬት የዲዛይን ወይም የዳሰሳ ስህተት ነው — ሥራውን ይጥቀሱ'}},
      /* the site reader names the person whose measurement it was */
      {id:'r_whose', en:'Whose measurement was it?', am:'የማን ልኬት ነበር?', t:'text', opt:1, i:1, one:1,
        picks:[
          { en:'Yohannis',                         am:'ዮሐንስ' },
          { en:'Yonas',                            am:'ዮናስ' },
          { en:'Abrham G.',                        am:'አብርሃም ጎ.' },
          { en:'Abrham W.',                        am:'አብርሃም ወ.' },
          { en:'Teklweld',                         am:'ተክለወልድ' },
          { en:'Ermiyas',                          am:'ኤርሚያስ' },
          { en:'Ephrata (pre-measurement)',        am:'ኤፍራታ (ቅድመ ልኬት)' },
          { en:"The customer's own measurement",   am:'የደንበኛው የራሱ ልኬት' }
        ], show:{f:'site_events', when:'has', v:'meas'}},
      {id:'r_meas_what', en:'What was different, and how will it be fixed? (Write the job, the wall and the cm in the box.)', am:'ምን ተለየ? እንዴት ይስተካከላል? (ሥራውን፣ ግድግዳውንና ስንት ሴ.ሜ. እንደሆነ በሳጥኑ ይጻፉ።)', t:'area',
        picks:[
          { en:'A wall length',                    am:'የግድግዳ ርዝመት' },
          { en:'Ceiling height',                   am:'የጣሪያ ቁመት' },
          { en:'Window or door position',          am:'የመስኮት ወይም የበር ቦታ' },
          { en:'Pipe or socket position',          am:'የቧንቧ ወይም የሶኬት ቦታ' },
          { en:'Cut and fitted at the site',       am:'በቦታው ተቆርጦ ተገጠመ' },
          { en:'The part goes back to the factory', am:'ዕቃው ወደ ፋብሪካ ይመለሳል' },
          { en:'The designer will measure again',  am:'ዲዛይነሩ እንደገና ይለካል' }
        ], show:{f:'r_meas', when:'pos'}},
      {id:'r_told', en:'Was the customer told the same day why we could not finish?', am:'ለምን መጨረስ እንዳልተቻለ ለደንበኛው በዚያኑ ቀን ተነግሯል?', t:'yesno', yes:{en:'Told today', am:'ዛሬ ተነግሯቸዋል'}, no:{en:'Not told', am:'አልተነገራቸውም'},
        show:{f:'site_events', when:'has', v:['not_ready', 'meas']}},
      {id:'r_told_why', en:'Which customer was not told, and why?', am:'ያልተነገረው የትኛው ደንበኛ ነው? ለምን?', t:'area',
        picks:[
          { en:'Could not reach the customer',     am:'ደንበኛውን ማግኘት አልተቻለም' },
          { en:'Forgot',                           am:'ተረስቷል' },
          { en:'Will call tomorrow',               am:'ነገ እደውላለሁ' },
          { en:'Ephrata or sales will tell them',  am:'ኤፍራታ ወይም ሽያጭ ይነግሯቸዋል' }
        ], show:{f:'r_told', when:'no'}},
      {id:'r_photo', en:'Did you photograph the site before anything was touched?', am:'ምንም ሳይነካ የቦታውን ፎቶ አነሱ?', t:'yesno', yes:{en:'I took photos', am:'ፎቶ አንስቻለሁ'}, no:{en:'No photo', am:'ፎቶ አላነሳሁም'},
        show:{f:'site_events', when:'has', v:['not_ready', 'meas']}},
      {id:'r_photo_why', en:'Which site has no photo, and why?', am:'ፎቶ ያልተነሳው የትኛው ቦታ ነው? ለምን?', t:'area',
        picks:[
          { en:'The phone battery was dead',       am:'የስልኩ ባትሪ አልቆ ነበር' },
          { en:'Forgot',                           am:'ተረስቷል' },
          { en:'The customer did not allow it',    am:'ደንበኛው አልፈቀደም' },
          { en:'Work had already started',         am:'ሥራው ቀድሞ ተጀምሮ ነበር' }
        ], show:{f:'r_photo', when:'no'}}
    ]},
    { en:'Quality check at site', am:'በቦታው የተደረገ የጥራት ፍተሻ', fields:[
      {id:'q_walk', en:'Did you walk through the finished work with every customer?', am:'የተጠናቀቀውን ሥራ ከእያንዳንዱ ደንበኛ ጋር ቅኝት አደረጉ?', t:'yesno', quiet:1, auto:{picked:'site_events', v:'no_walk', flip:1}},
      {id:'q_walk_why', en:'Which jobs had no walk-through, and why?', am:'ቅኝት ያልተደረገባቸው የትኞቹ ሥራዎች ናቸው? ለምን?', t:'area',
        picks:[
          { en:'The customer was not home',        am:'ደንበኛው ቤት አልነበረም' },
          { en:'No time — finished late',          am:'ጊዜ አልነበረም — ዘግይቶ ተጠናቀቀ' },
          { en:'Forgot',                           am:'ተረስቷል' },
          { en:'Will walk through tomorrow',       am:'ነገ ቅኝት ይደረጋል' }
        ], show:{f:'q_walk', when:'no'}},
      {id:'q_doors', en:'Were doors, drawers and alignment checked on every job?', am:'በእያንዳንዱ ሥራ በሮች፣ መሳቢያዎችና አሰላለፍ ተፈትሸዋል?', t:'yesno', quiet:1, auto:{picked:'site_events', v:'no_doors', flip:1}},
      {id:'q_doors_why', en:'Which jobs were not checked, and why?', am:'ያልተፈተሹት የትኞቹ ሥራዎች ናቸው? ለምን?', t:'area',
        picks:[
          { en:'No time',                          am:'ጊዜ አልነበረም' },
          { en:'Forgot',                           am:'ተረስቷል' },
          { en:'The job is not finished yet',      am:'ሥራው ገና አላለቀም' },
          { en:'Will check tomorrow',              am:'ነገ ይፈተሻል' }
        ], show:{f:'q_doors', when:'no'}},
      {id:'q_edges', en:'Were edges and handles checked on every job?', am:'በእያንዳንዱ ሥራ ጠርዞችና እጀታዎች ተፈትሸዋል?', t:'yesno', quiet:1, auto:{picked:'site_events', v:'no_edges', flip:1}},
      {id:'q_edges_why', en:'Which jobs were not checked, and why?', am:'ያልተፈተሹት የትኞቹ ሥራዎች ናቸው? ለምን?', t:'area',
        picks:[
          { en:'No time',                          am:'ጊዜ አልነበረም' },
          { en:'Forgot',                           am:'ተረስቷል' },
          { en:'The job is not finished yet',      am:'ሥራው ገና አላለቀም' },
          { en:'Will check tomorrow',              am:'ነገ ይፈተሻል' }
        ], show:{f:'q_edges', when:'no'}},
      /* a month with no "yes" here pays the 2,000 Birr site quality bonus
         (elyas-site-quality-bonus) */
      {id:'q_rework', en:'Did any job need rework at the site today?', am:'ዛሬ በቦታው ዳግም ሥራ ያስፈለገው ሥራ ነበር?', t:'yesno', quiet:1, auto:{picked:'site_events', v:'rework'}},
      {id:'q_rework_what', en:'What had to be redone, and what caused it? (Write the job and the hours it cost in the box.)', am:'ምን በድጋሚ ተሠራ? ምክንያቱ ምን ነበር? (ሥራውንና ያስጠፋውን ሰዓት በሳጥኑ ይጻፉ።)', t:'area',
        picks:[
          { en:'Factory: wrong size',              am:'ፋብሪካ፦ የተሳሳተ ልክ' },
          { en:'Factory: edge or finish',          am:'ፋብሪካ፦ ጠርዝ ወይም አጨራረስ' },
          { en:'Design: wrong drawing',            am:'ዲዛይን፦ የተሳሳተ ንድፍ' },
          { en:'Site: wall or floor',              am:'ቦታ፦ ግድግዳ ወይም ወለል' },
          { en:'Damaged in transport',             am:'በማጓጓዝ ተጎዳ' },
          { en:'Assembler mistake',                am:'የገጣጣሚ ስህተት' }
        ], show:{f:'q_rework', when:'yes'}},
      /* what each rework on site needs cut again (13 Oct 2026) */
      {id:'q_rw_list', en:'What must the factory cut again for it? One row a job.', am:'ለዚህ ፋብሪካው በድጋሚ ምን መቁረጥ አለበት? ለአንድ ሥራ አንድ መስመር።', t:'table', addEn:'Add a job', addAm:'ሥራ ጨምር',
        show:{f:'q_rework', when:'yes'}, cols:[
          {id:'code', en:'Job code', am:'የሥራ ኮድ', t:'text'},
          {id:'rmat', en:'Material to cut again', am:'በድጋሚ የሚቆረጥ ዕቃ', t:'choice', opts:REDO_OPTS},
          {id:'rcol', en:'Colour code', am:'የቀለም ኮድ', t:'colour', of:'rmat'},
          {id:'rqty', en:'How many pieces?', am:'ስንት ቁራጭ?', t:'num', ifCol:'rmat', ifNot:['none']}
        ]},
      {id:'q_reported', en:'Was the rework reported to Mahelet the same day?', am:'ዳግም ሥራው በዕለቱ ለማህሌት ተነግሯል?', t:'yesno', yes:{en:'Told today', am:'ዛሬ ተነግሯታል'}, no:{en:'Not told', am:'አልተነገራትም'},
        show:{f:'q_rework', when:'yes'}}
    ]},
    { en:'Site cleanliness and property', am:'የቦታ ጽዳትና የደንበኛ ንብረት', fields:[
      {id:'cl_clean', en:'Was every site left clean, with all packaging removed?', am:'እያንዳንዱ ቦታ ማሸጊያው ተነስቶ ንጹህ ሆኖ ቀረ?', t:'yesno', quiet:1, auto:{picked:'site_events', v:'dirty', flip:1}},
      {id:'cl_clean_why', en:'Which site was not left clean, and why? (Write the job in the box.)', am:'ንጹህ ያልሆነው የትኛው ቦታ ነው? ለምን? (ሥራውን በሳጥኑ ይጻፉ።)', t:'area',
        picks:[
          { en:'No time — the job ran late',       am:'ጊዜ አልነበረም — ሥራው ዘገየ' },
          { en:'No bags or broom at the site',     am:'በቦታው የቆሻሻ ከረጢት ወይም መጥረጊያ አልነበረም' },
          { en:'The assemblers left early',        am:'ገጣጣሚዎቹ ቀድመው ወጡ' },
          { en:'The work goes on tomorrow',        am:'ሥራው ነገ ይቀጥላል' },
          { en:'Will be cleaned tomorrow',         am:'ነገ ይጸዳል' }
        ], show:{f:'cl_clean', when:'no'}},
      {id:'cl_protect', en:'Were the customer\'s floors, walls and furniture protected on every job?', am:'በእያንዳንዱ ሥራ የደንበኛው ወለል፣ ግድግዳና የቤት ዕቃ ተጠብቋል?', t:'yesno', quiet:1, auto:{picked:'site_events', v:'unprotected', flip:1}},
      {id:'cl_protect_why', en:'Where was it not protected, and why?', am:'የት ነው ያልተጠበቀው? ለምን?', t:'area',
        picks:[
          { en:'No covers on the truck',           am:'በመኪናው ላይ መሸፈኛ አልነበረም' },
          { en:'Not enough covers',                am:'መሸፈኛው አልበቃም' },
          { en:'The assemblers did not lay them',  am:'ገጣጣሚዎቹ አላነጠፉም' },
          { en:'The customer said it was not needed', am:'ደንበኛው አያስፈልግም አለ' }
        ], show:{f:'cl_protect', when:'no'}},
      /* –500 Birr each day it is "yes" (elyas-property-damaged), and the
         morning brief names it */
      {id:'cl_damage', en:'Was any customer property damaged today?', am:'ዛሬ የደንበኛ ንብረት ተጎድቷል?', t:'yesno', quiet:1, auto:{picked:'site_events', v:'damage'}},
      {id:'cl_damage_what', en:'What was damaged, and was the customer told? (Write the job, who did it and the cost in the box.)', am:'ምን ተጎዳ? ለደንበኛው ተነግሯል? (ሥራውን፣ በማንና ዋጋውን በሳጥኑ ይጻፉ።)', t:'area',
        picks:[
          { en:'Floor scratched',                  am:'ወለሉ ተቧጨረ' },
          { en:'Wall marked or chipped',           am:'ግድግዳው ቆሸሸ ወይም ተሸረፈ' },
          { en:'Furniture damaged',                am:'የቤት ዕቃ ተጎዳ' },
          { en:'Tiles or worktop cracked',         am:'ሴራሚክ ወይም የጠረጴዛ ድንጋይ ተሰነጠቀ' },
          { en:'The customer was told',            am:'ለደንበኛው ተነግሯል' },
          { en:'The customer is not told yet',     am:'ለደንበኛው ገና አልተነገረም' }
        ], show:{f:'cl_damage', when:'yes'}},
      {id:'cl_tools', en:'Were all tools and unused materials returned to the store?', am:'ሁሉም መሣሪያዎችና ያልዋሉ ቁሳቁሶች ወደ መጋዘን ተመለሱ?', t:'yesno', quiet:1, auto:{picked:'site_events', v:'tools_out', flip:1}},
      {id:'cl_tools_what', en:'What is still out, where is it, and when will it come back? (Write what in the box.)', am:'ያልተመለሰው ምንድን ነው? የት ነው? መቼ ይመለሳል? (ምን እንደሆነ በሳጥኑ ይጻፉ።)', t:'area',
        picks:[
          { en:'At the site — back tomorrow',      am:'በቦታው ነው — ነገ ይመለሳል' },
          { en:'With an assembler',                am:'ገጣጣሚ ጋር ነው' },
          { en:"Leftover material at the customer's", am:'የተረፈ ዕቃ ደንበኛው ቤት ነው' },
          { en:'Lost',                             am:'ጠፍቷል' }
        ], show:{f:'cl_tools', when:'no'}}
    ]},
    { en:'WhatsApp', am:'ዋትስአፕ', fields:[
      {id:'wa_welcome', en:'Was the Assembler Welcome Message posted in every new group?', am:'በእያንዳንዱ አዲስ ግሩፕ የገጣጣሚ አቀባበል መልዕክት ተልኳል?', t:'yesno', quiet:1, auto:{picked:'site_events', v:'no_welcome', flip:1}},
      {id:'wa_welcome_why', en:'Which groups, and why? (Write the job in the box.)', am:'የትኞቹ ግሩፖች ናቸው? ለምን? (ሥራውን በሳጥኑ ይጻፉ።)', t:'area',
        picks:WHY_MISSED.concat([
          { en:'No network at the site',           am:'በቦታው ኔትወርክ አልነበረም' },
          { en:'The group is not made yet',        am:'ግሩፑ ገና አልተከፈተም' }
        ]), show:{f:'wa_welcome', when:'no'}},
      {id:'wa_started', en:'Was the Installation Started message posted for every job?', am:'ለእያንዳንዱ ሥራ "ተከላ ተጀመረ" መልዕክት ተልኳል?', t:'yesno', quiet:1, auto:{picked:'site_events', v:'no_started', flip:1}},
      {id:'wa_started_why', en:'Which jobs, and why? (Write the job in the box.)', am:'የትኞቹ ሥራዎች ናቸው? ለምን? (ሥራውን በሳጥኑ ይጻፉ።)', t:'area',
        picks:WHY_MISSED.concat([
          { en:'No network at the site',           am:'በቦታው ኔትወርክ አልነበረም' },
          { en:'The phone battery was dead',       am:'የስልኩ ባትሪ አልቆ ነበር' }
        ]), show:{f:'wa_started', when:'no'}},
      {id:'wa_progress', en:'Did every assembler post a Daily Progress Update?', am:'ሁሉም ገጣጣሚዎች የዕለት ሪፖርት ልከዋል?', t:'yesno', quiet:1, auto:{picked:'site_events', v:'no_progress', flip:1}},
      {id:'wa_progress_who', en:'What was done about the missing updates? (Write the assemblers\' names in the box.)', am:'ስላልተላኩት ሪፖርቶች ምን እርምጃ ተወሰደ? (የገጣጣሚዎቹን ስም በሳጥኑ ይጻፉ።)', t:'area',
        picks:[
          { en:'Reminded them',                    am:'አስታወስኳቸው' },
          { en:'Posted it for them',               am:'እኔ ላክሁላቸው' },
          { en:'No network at the site',           am:'በቦታው ኔትወርክ አልነበረም' },
          { en:'Penalty applied (–200)',           am:'ቅጣት ተጣለ (–200)' },
          { en:'Mahelet was told',                 am:'ለማህሌት ተነግሯል' }
        ], show:{f:'wa_progress', when:'no'}},
      {id:'wa_accept', en:'Was the Customer Acceptance Request posted after every finished job?', am:'ከእያንዳንዱ የተጠናቀቀ ሥራ በኋላ የደንበኛ ተቀባይነት ጥያቄ ተልኳል?', t:'yesno', quiet:1, auto:{picked:'site_events', v:'no_accept', flip:1}},
      {id:'wa_accept_why', en:'Which jobs, and why? (Write the job in the box.)', am:'የትኞቹ ሥራዎች ናቸው? ለምን? (ሥራውን በሳጥኑ ይጻፉ።)', t:'area',
        picks:WHY_MISSED.concat([
          { en:'No network at the site',           am:'በቦታው ኔትወርክ አልነበረም' }
        ]), show:{f:'wa_accept', when:'no'}},
      /* any WhatsApp slip tapped above opens the count; 3 or more in a week
         cancels the WhatsApp bonus (elyas-whatsapp-bonus-cancelled) */
      {id:'wa_viol', en:'How many WhatsApp mistakes did the site team make today, in all?', am:'ዛሬ የቦታው ቡድን በጠቅላላ ስንት የዋትስአፕ ስህተቶች ሠራ?', t:'num', zero:1,
        show:{f:'site_events', when:'has', v:['no_welcome', 'no_started', 'no_progress', 'no_accept', 'wa_other']},
        tgt:{op:'lte', v:0, en:'3 or more in a week cancels the 1,000 Birr bonus',
             am:'በሳምንት 3 እና ከዚያ በላይ የ1,000 ብር ጉርሻን ይሰርዛል'}},
      {id:'wa_viol_what', en:'What were they, and was Mahelet told? (Write who in the box.)', am:'ምን ነበሩ? ለማህሌት ተነግሯል? (ማን እንደሆነ በሳጥኑ ይጻፉ።)', t:'area',
        picks:[
          { en:'A message was missed',             am:'መልዕክት ቀረ' },
          { en:'A message went late',              am:'መልዕክት ዘግይቶ ተላከ' },
          { en:'A rude or wrong message',          am:'ክብር የጎደለው ወይም የተሳሳተ መልዕክት' },
          { en:'Posted in the wrong group',        am:'በተሳሳተ ግሩፕ ተላከ' },
          { en:'Mahelet was told',                 am:'ለማህሌት ተነግሯል' },
          { en:'Not told to Mahelet yet',          am:'ለማህሌት ገና አልተነገረም' }
        ], show:{f:'wa_viol', when:'pos'}}
    ]},
    { en:'Problems and decisions', am:'ችግሮችና ውሳኔዎች', fields:[
      {id:'problem', en:'What was the biggest problem today?', am:'የዛሬው ትልቁ ችግር ምን ነበር?', t:'area', opt:1,
        picks:[
          { en:'No big problem today',             am:'ዛሬ ትልቅ ችግር አልነበረም' },
          { en:'A site was not ready',             am:'ቦታ ዝግጁ አልነበረም' },
          { en:'The customer was not home',        am:'ደንበኛው ቤት አልነበረም' },
          { en:'A part was missing or wrong',      am:'መለዋወጫ ጎድሏል ወይም ተሳስቷል' },
          { en:'The truck came late',              am:'መኪናው ዘገየ' },
          { en:'Not enough assemblers',            am:'ገጣጣሚ አልበቃም' },
          { en:'The measurement did not match',    am:'ልኬቱ አልተመሳሰለም' },
          { en:'Rework from the factory',          am:'ከፋብሪካ የመጣ ዳግም ሥራ' }
        ]},
      {id:'need_lead', en:'Do you need a decision from Mahelet?', am:'የማህሌት ውሳኔ ያስፈልግዎታል?', t:'yesno', yes:{en:'I need a decision', am:'ውሳኔ ያስፈልገኛል'}, no:{en:'No decision needed', am:'ውሳኔ አያስፈልገኝም'}},
      {id:'need_lead_what', en:'What should Mahelet decide, and by when?', am:'ማህሌት ምን መወሰን አለባት? እስከ መቼ?', t:'area',
        picks:[
          { en:'Which job goes first',             am:'የትኛው ሥራ ይቅደም' },
          { en:'More assemblers',                  am:'ተጨማሪ ገጣጣሚ' },
          { en:'Truck time',                       am:'የመኪና ሰዓት' },
          { en:'A part from the factory',          am:'ከፋብሪካ መለዋወጫ' },
          { en:'Extra cost to approve',            am:'የሚፈቀድ ተጨማሪ ወጪ' },
          { en:'What to tell a customer',          am:'ለደንበኛ ምን እንደሚነገር' }
        ], show:{f:'need_lead', when:'yes'}}
    ]},
    /* the morning route reader plans Alex's truck from these rows, in this
       order, and says when a site is not confirmed (Route.js) */
    { en:"Tomorrow's plan", am:'የነገ ዕቅድ', fields:[
      {id:'t_rows', en:'Which jobs are planned for tomorrow? (The job code and the area are enough.)', am:'ለነገ የታቀዱት ሥራዎች የትኞቹ ናቸው? (የሥራ ኮድና አካባቢው በቂ ነው።)',
       t:'table', addEn:'Add job', addAm:'ሥራ ጨምር', cols:[
        {id:'code', en:'Job code', am:'የሥራ ኮድ', t:'text'},
        {id:'site', en:'Site and area (e.g. Ayat, near the roundabout)', am:'ቦታና አካባቢ (ለምሳሌ አያት፣ አደባባዩ አጠገብ)', t:'text'},
        {id:'crew', en:'Crew size', am:'የቡድን ብዛት', t:'num'},
        {id:'m2',   en:'Planned m²', am:'የታቀደ ካሬ ሜትር', t:'num'}
      ]},
      {id:'t_ready', en:'Is every site for tomorrow confirmed ready, with the delivery time agreed with Alex and the customer?', am:'ለነገ ያሉት ሁሉም ቦታዎች ዝግጁ መሆናቸው ተረጋግጧል? የማድረሻ ሰዓት ከአሌክስና ከደንበኛው ጋር ተስማምቷል?', t:'yesno', yes:{en:'All confirmed', am:'ሁሉም ተረጋግጠዋል'}, no:{en:'Not all confirmed', am:'ያልተረጋገጠ አለ'},
        show:{f:'t_rows', when:'any'}},
      {id:'t_ready_why', en:'Which sites are not confirmed, and what is being done? (Write the job in the box.)', am:'ያልተረጋገጡት የትኞቹ ቦታዎች ናቸው? ምን እየተደረገ ነው? (ሥራውን በሳጥኑ ይጻፉ።)', t:'area',
        picks:[
          { en:'The customer is not answering',    am:'ደንበኛው ስልክ አያነሳም' },
          { en:'The site is still being built',    am:'ቦታው ገና እየተሠራ ነው' },
          { en:'Truck time not agreed with Alex',  am:'የመኪናውን ሰዓት ከአሌክስ ጋር ገና አልተስማማንም' },
          { en:'The job is not ready at the factory', am:'ሥራው በፋብሪካ ገና አላለቀም' },
          { en:'Will confirm in the morning',      am:'ጠዋት ይረጋገጣል' }
        ], show:{f:'t_ready', when:'no'}}
    ]}
  ]
},

/* ======================== ELYAS — WEEKLY SITE ========================= */
{
  id:'elyas-weekly', person:'elyas', cadence:'weekly', built:1, dueTime:'17:00', dueDay:6,
  en:'Weekly Site Summary', am:'ሳምንታዊ የተከላ ማጠቃለያ',
  toEn:'Mahelet + Ephrata', toAm:'ማህሌት + ኤፍራታ',
  dueEn:'Saturday 5:00 PM', dueAm:'ቅዳሜ ከቀኑ 11፡00 (5:00 PM)',
  penEn:'Late or not sent –500 Birr', penAm:'ዘግይቶ ወይም ካልቀረበ –500 ብር',
  sections:[
    /* REBUILT 11 Oct 2026 (the Chairman: "they are struggling so much with
       the questions"). Elyas's first weekly (10 Oct) left the jobs planned,
       the reason for the delays, the assemblers to remove, the installed
       jobs that failed QC, the rework cost and the WhatsApp % empty. 26
       questions stood before any follow-up opened; seven of them were about
       things that go wrong only some weeks, and one was a percentage he was
       asked to work out from four answers above it. Now a normal week is the
       assemblers, the four WhatsApp counts his fines are judged on, one tap
       on "nothing else happened", and next week. The jobs, the m², the
       on-time count and the complaints come from his own daily reports.
       Every answer key is the one it always was: the yes/no answers behind
       the list are worked out from it ({picked:…}, quiet:1), and the counts
       a rule or the Sunday readers use file a real 0 when the list was
       answered without them (zero:1). Every "why" is buttons now. */
    { en:'Installations this week', am:'በዚህ ሳምንት ተከላ', fields:[
      /* nobody keeps this count and nothing reads it */
      {id:'w_sched', en:'How many jobs were planned for this week? (If you counted.)', am:'በዚህ ሳምንት ስንት ሥራዎች ታቅደው ነበር? (ከቆጠሩ።)', t:'num', opt:1},
      {id:'w_done', en:'How many were completed?', am:'ስንቱ ተጠናቀቁ?', t:'num', auto:{week:'j_done'}},
      {id:'w_ontime', en:'How many were completed on time?', am:'ስንቱ በሰዓቱ ተጠናቀቁ?', t:'num', auto:{week:'j_rows', count:1, from:'elyas-daily', when:[{col:'state', is:'done'}, {col:'ontime', is:'yes'}]},
        tgt:{op:'gte', v:3, en:'3 on time pays 400 Birr, 5 pays 600, 7+ pays 800',
             am:'3 በሰዓቱ 400 ብር፣ 5 ደግሞ 600፣ ከ7 በላይ 800 ብር'}},
      {id:'w_m2', en:'How many m² were installed this week?', am:'በዚህ ሳምንት ስንት ካሬ ሜትር ተገጠመ?', t:'num', auto:{week:'j_m2'}},
      {id:'w_rate', en:'What was the on-time rate this week? (%)', am:'የዚህ ሳምንት በሰዓቱ የመጠናቀቅ መጠን ስንት ነው? (%)', t:'pct',
        auto:{pct:['w_ontime', 'w_done']},
        tgt:{op:'gte', v:95, en:'≥95% earns the 3,000 Birr KPI bonus', am:'≥95% የ3,000 ብር KPI ጉርሻ ያስገኛል'}},
      {id:'w_delayed_any', en:'Was any job delayed this week?', am:'በዚህ ሳምንት የዘገየ ሥራ አለ?', t:'yesno', quiet:1, auto:{picked:'w_events', v:'delayed'}},
      {id:'w_delayed_list', en:'Which jobs were delayed?', am:'የዘገዩት የትኞቹ ሥራዎች ናቸው?', t:'table', auto:{weekRows:'j_rows', from:'elyas-daily', when:[{col:'state', is:'done'}, {col:'ontime', is:'no'}], map:{code:'code', cust:'cust'}}, addEn:'Add a job', addAm:'ሥራ ጨምር',

        cols:[
          {id:'code', en:'Job code', am:'የሥራ ኮድ', t:'text'},
          {id:'cust', en:'Customer', am:'ደንበኛ', t:'text'},
          {id:'days', en:'Days late', am:'የዘገየበት ቀን', t:'num'},
          {id:'cause', en:'Main cause', am:'ዋና ምክንያት', t:'choice', opts:[
            {v:'site', en:'Site not ready', am:'ቦታው ዝግጁ አልነበረም'},
            {v:'mat', en:'Materials or factory', am:'ቁሳቁስ ወይም ፋብሪካ'},
            {v:'asm', en:'Assemblers', am:'ገጣጣሚዎች'},
            {v:'design', en:'Design or measurement', am:'ዲዛይን ወይም ልኬት'},
            {v:'cust', en:'Customer', am:'ደንበኛ'},
            {v:'other', en:'Other', am:'ሌላ'}]}
        ]},
      {id:'w_delayed', en:'How many jobs were delayed?', am:'ስንት ሥራዎች ዘገዩ?', t:'num',
        auto:{rows:'w_delayed_list'}, sumEn:'delayed', sumAm:'ዘግይተዋል'},
      {id:'w_why', en:'What will stop it happening next week?', am:'በሚቀጥለው ሳምንት እንዳይደገም ምን ይደረጋል?', t:'area', opt:1,
        picks:[
          { en:'Confirm every site the day before',      am:'እያንዳንዱን ቦታ ከአንድ ቀን በፊት ማረጋገጥ' },
          { en:'Check the load before leaving',          am:'ከመነሳት በፊት ጭነቱን መፈተሽ' },
          { en:'More assemblers on big jobs',            am:'በትላልቅ ሥራዎች ተጨማሪ ገጣጣሚ' },
          { en:'Measure again before installing',        am:'ከመግጠም በፊት እንደገና መለካት' },
          { en:'Agree the day with the customer again',  am:'ቀኑን ከደንበኛው ጋር እንደገና መስማማት' },
          { en:'Ask the factory for the parts earlier',  am:'ዕቃዎቹን ከፋብሪካ ቀድሞ መጠየቅ' }
        ], show:{f:'w_delayed_any', when:'yes'}}
    ]},
    /* THE ONE LIST. Seven questions used to be asked every week — any job
       delayed, assemblers late, behaviour, removals, the discipline log,
       rework, failed QC — and on a week when none of it happened each one
       still wanted an answer. */
    { en:'Anything else this week?', am:'በዚህ ሳምንት ሌላ የሆነ ነገር አለ?', fields:[
      {id:'w_events', en:'What else happened on site this week?', am:'በዚህ ሳምንት በተከላ ቦታዎች ሌላ ምን ሆነ?', t:'multi',
        none:{ en:'Nothing — a normal week', am:'ምንም — የተለመደ ሳምንት' },
        groups:[
          { v:'jobs', en:'Jobs',       am:'ሥራዎች' },
          { v:'asm',  en:'Assemblers', am:'ገጣጣሚዎች' },
          { v:'qual', en:'Quality',    am:'ጥራት' }
        ],
        opts:[
          { v:'delayed', g:'jobs', en:'A job finished late',                         am:'ዘግይቶ ያለቀ ሥራ ነበር' },
          { v:'late',    g:'asm',  en:'An assembler was late more than once',        am:'ከአንድ ጊዜ በላይ የዘገየ ገጣጣሚ ነበር' },
          { v:'behave',  g:'asm',  en:'An assembler had a behaviour problem',        am:'የባህርይ ችግር ያለበት ገጣጣሚ ነበር' },
          { v:'remove',  g:'asm',  en:'An assembler should be removed',              am:'መነሳት ያለበት ገጣጣሚ አለ' },
          { v:'log',     g:'asm',  en:'The discipline log is not up to date, or Mahelet has not checked it', am:'የዲሲፕሊን መዝገቡ ወቅታዊ አይደለም ወይም ማህሌት አላረጋገጠችውም' },
          { v:'rework',  g:'qual', en:'A job needed rework on site',                 am:'በቦታው እንደገና መሠራት ያለበት ሥራ ነበር' },
          { v:'qc_fail', g:'qual', en:'An installed job failed QC',                  am:'የተገጠመ ሥራ የጥራት ፍተሻ አላለፈም' }
        ]}
    ]},
    /* the Sunday workforce and project readers (apps-script/Specialists.js)
       read every figure here, so the counts file a real 0 on a quiet week */
    { en:'Assemblers', am:'ገጣጣሚዎች', fields:[
      {id:'as_total', en:'How many assemblers worked with you this week?', am:'በዚህ ሳምንት ስንት ገጣጣሚዎች አብረውዎት ሠሩ?', t:'num'},
      {id:'as_att', en:'About what % of their working days did they turn up? Your best guess is fine.', am:'ከሥራ ቀናቸው በግምት ስንት % ተገኙ? ግምትዎ በቂ ነው።', t:'pct'},
      {id:'as_late', en:'How many assemblers were late more than once?', am:'ስንት ገጣጣሚዎች ከአንድ ጊዜ በላይ ዘገዩ?', t:'num', zero:1,
        show:{f:'w_events', when:'has', v:'late'}},
      {id:'as_late_who', en:'What was done? (Write who and how many times in the box.)', am:'ምን እርምጃ ተወሰደ? (ማንና ስንት ጊዜ እንደሆነ በሳጥኑ ይጻፉ።)', t:'area',
        picks:[
          { en:'Warned',                                 am:'ማስጠንቀቂያ ተሰጠ' },
          { en:'Fined',                                  am:'ተቀጣ' },
          { en:'Written in the discipline log',          am:'በዲሲፕሊን መዝገቡ ተመዘገበ' },
          { en:'Mahelet was told',                       am:'ለማህሌት ተነግሯል' },
          { en:'Nothing done yet',                       am:'ገና ምንም አልተደረገም' }
        ], show:{f:'as_late', when:'pos'}},
      {id:'as_behave', en:'How many assemblers had behaviour problems?', am:'ስንት ገጣጣሚዎች የባህርይ ችግር ነበረባቸው?', t:'num', auto:{week:'a_behave', from:'elyas-daily'}, zero:1,
},
      {id:'as_behave_what', en:'What happened, and what was done? (Write who and at which customer in the box.)', am:'ምን ሆነ? ምን እርምጃ ተወሰደ? (ማንና በየትኛው ደንበኛ ቤት እንደሆነ በሳጥኑ ይጻፉ።)', t:'area', auto:{weekText:'a_behave_what', from:'elyas-daily'},
        picks:[
          { en:'Smoking on site',                        am:'በቦታው ማጨስ' },
          { en:'Loud phone or music',                    am:'ጮክ ያለ ስልክ ወይም ሙዚቃ' },
          { en:'Rude to the customer',                   am:'ለደንበኛው ጨዋ አልነበረም' },
          { en:'Argument or fight',                      am:'ጭቅጭቅ ወይም ጠብ' },
          { en:'Warned',                                 am:'ማስጠንቀቂያ ተሰጠ' },
          { en:'Fined',                                  am:'ተቀጣ' },
          { en:'Mahelet was told',                       am:'ለማህሌት ተነግሯል' }
        ], show:{f:'as_behave', when:'pos'}},
      {id:'as_removal', en:'How many assemblers do you recommend removing?', am:'ስንት ገጣጣሚዎች እንዲነሱ ይጠቁማሉ?', t:'num', zero:1,
        show:{f:'w_events', when:'has', v:'remove'}},
      {id:'as_removal_who', en:'What is on their record? (Write who in the box.)', am:'በመዝገባቸው ላይ ምን አለ? (ማን እንደሆኑ በሳጥኑ ይጻፉ።)', t:'area',
        picks:[
          { en:'Late again and again',                   am:'በተደጋጋሚ መዘግየት' },
          { en:'Behaviour',                              am:'ባህርይ' },
          { en:'Poor work',                              am:'ደካማ ሥራ' },
          { en:'Missed progress posts',                  am:'ሂደት አለመለጠፍ' },
          { en:'Damaged customer property',              am:'የደንበኛ ንብረት ማበላሸት' },
          { en:'All of it is in the discipline log',     am:'ሁሉም በዲሲፕሊን መዝገቡ አለ' }
        ], show:{f:'as_removal', when:'pos'}},
      {id:'as_log', en:'Is the Assembler Discipline Log up to date and checked by Mahelet this week?', am:'የገጣጣሚ ዲሲፕሊን መዝገብ ወቅታዊ ነው? በዚህ ሳምንት በማህሌት ተረጋግጧል?', t:'yesno', quiet:1, auto:{picked:'w_events', v:'log', flip:1}},
      {id:'as_log_why', en:'What is missing from the log, and when will it be up to date?', am:'ከመዝገቡ ምን ጎደለ? መቼ ይሟላል?', t:'area',
        picks:[
          { en:'Not written this week',                  am:'በዚህ ሳምንት አልተጻፈም' },
          { en:'Mahelet has not checked it yet',         am:'ማህሌት ገና አላረጋገጠችውም' },
          { en:'The log book is at the factory',         am:'መዝገቡ ፋብሪካ ነው' },
          { en:'Will be done on Monday',                 am:'ሰኞ ይሠራል' }
        ], show:{f:'as_log', when:'no'}}
    ]},
    { en:'Customers', am:'ደንበኞች', fields:[
      {id:'cs_signed', en:'How many customers signed the acceptance form this week?', am:'በዚህ ሳምንት ስንት ደንበኞች የተቀባይነት ፎርም ፈረሙ?', t:'num', auto:{week:'ac_signed'}},
      /* every complaint is already counted in his daily report (ac_complaints,
         which the daily fine reads); the week adds them up */
      {id:'cs_comp', en:'How many customers complained this week?', am:'በዚህ ሳምንት ስንት ደንበኞች ቅሬታ አቀረቡ?', t:'num', auto:{week:'ac_complaints'},
        tgt:{op:'lte', v:0, en:'Zero is required for the 2,000 Birr satisfaction bonus',
             am:'ለ2,000 ብር የእርካታ ጉርሻ 0 መሆን አለበት'}},
      {id:'cs_comp_what', en:'What were the complaints about, and where does each stand? (Write the customer in the box.)', am:'ቅሬታዎቹ ስለምን ነበሩ? እያንዳንዱ አሁን የት ደረሰ? (ደንበኛውን በሳጥኑ ይጻፉ።)', t:'area', auto:{weekText:'ac_complaints_what', from:'elyas-daily'},
        picks:[
          { en:'Late installation',                      am:'የዘገየ ተከላ' },
          { en:'Damage in the house',                    am:'በቤቱ ላይ የደረሰ ጉዳት' },
          { en:'Doors or drawers not aligned',           am:'በሮች ወይም መሳቢያዎች አልተስተካከሉም' },
          { en:'Site left dirty',                        am:'ቦታው ቆሻሻ ሆኖ ቀረ' },
          { en:'Assembler behaviour',                    am:'የገጣጣሚ ባህርይ' },
          { en:'Resolved',                               am:'ተፈቷል' },
          { en:'Still open',                             am:'ገና አልተፈታም' }
        ], show:{f:'cs_comp', when:'pos'}},
      {id:'cs_res', en:'How many of them were resolved?', am:'ከነሱ ስንቱ ተፈቱ?', t:'num',
        show:{f:'cs_comp', when:'pos'}},
      {id:'cs_out', en:'How many complaints are still open?', am:'ስንት ቅሬታዎች ገና አልተፈቱም?', t:'num',
        auto:{minus:['cs_comp', 'cs_res']}, sumEn:'still open', sumAm:'አልተፈቱም'},
      {id:'cs_out_what', en:'What is holding the open ones up? (Write which one and the day it will close in the box.)', am:'ያልተፈቱትን ምን ያዛቸው? (የትኛው እንደሆነና የሚዘጋበትን ቀን በሳጥኑ ይጻፉ።)', t:'area',
        picks:[
          { en:'Waiting for a part from the factory',    am:'ከፋብሪካ ዕቃ እየጠበቅን ነው' },
          { en:'Waiting for the customer',               am:'ደንበኛውን እየጠበቅን ነው' },
          { en:'Rework booked',                          am:'እንደገና ለመሥራት ቀን ተይዟል' },
          { en:"Needs Mahelet's decision",               am:'የማህሌት ውሳኔ ያስፈልጋል' }
        ], show:{f:'cs_out', when:'pos'}}
    ]},
    { en:'Quality on site', am:'በቦታው ያለ ጥራት', fields:[
      {id:'qs_rework', en:'How many jobs needed rework on site this week?', am:'በዚህ ሳምንት ስንት ሥራዎች በቦታው እንደገና መሠራት ነበረባቸው?', t:'num', auto:{week:'q_rework', how:'yesdays', from:'elyas-daily'}, zero:1,

        tgt:{op:'lte', v:0, en:'Zero rework earns the 2,000 Birr site quality bonus',
             am:'ዳግም ሥራ ከሌለ የ2,000 ብር የጥራት ጉርሻ ያስገኛል'}},
      {id:'qs_rework_what', en:'What was redone, and what caused it? (Write the jobs in the box.)', am:'ምን እንደገና ተሠራ? ምክንያቱ ምን ነበር? (ሥራዎቹን በሳጥኑ ይጻፉ።)', t:'area', auto:{weekText:'q_rework_what', from:'elyas-daily'},
        picks:[
          { en:'Factory — a part made wrong',            am:'ፋብሪካ — በስህተት የተሠራ ዕቃ' },
          { en:'Factory — damaged on the way',           am:'ፋብሪካ — በመንገድ ተጎዳ' },
          { en:'Design or measurement',                  am:'ዲዛይን ወይም ልኬት' },
          { en:'Site — walls or floor',                  am:'ቦታ — ግድግዳ ወይም ወለል' },
          { en:'Our own assembly',                       am:'የኛው መገጣጠም' }
        ], show:{f:'qs_rework', when:'pos'}},
      /* the site quality bonus pays on this being 0 all month (rulebook) */
      {id:'qs_fail', en:'How many installed jobs failed QC?', am:'የተገጠሙ ስንት ሥራዎች የጥራት ፍተሻ አላለፉም?', t:'num', zero:1,
        show:{f:'w_events', when:'has', v:'qc_fail'}},
      {id:'qs_fail_what', en:'What was found? (Write the jobs in the box.)', am:'ምን ችግር ተገኘ? (ሥራዎቹን በሳጥኑ ይጻፉ።)', t:'area',
        picks:[
          { en:'Doors or drawers not aligned',           am:'በሮች ወይም መሳቢያዎች አልተስተካከሉም' },
          { en:'Edges or handles',                       am:'ጠርዝ ወይም እጀታ' },
          { en:'Gaps, or not level',                     am:'ክፍተት ወይም ቀጥ ያልሆነ' },
          { en:'Damaged surface',                        am:'የተጎዳ ገጽ' },
          { en:'Fixed on the spot',                      am:'በቦታው ተስተካክሏል' }
        ], show:{f:'qs_fail', when:'pos'}},
      {id:'qs_cost', en:'What did rework on site cost this week, in Birr? (If you know.)', am:'በዚህ ሳምንት በቦታው እንደገና መሥራት ስንት ብር አስወጣ? (ካወቁ።)', t:'money', opt:1,
        show:{f:'w_events', when:'has', v:['rework', 'qc_fail']}}
    ]},
    { en:'WhatsApp', am:'ዋትስአፕ', fields:[
      /* each of the four is fined message by message (rulebook: the second
         box less the first), so all four stay asked */
      {id:'wk_welcome', en:'How many Welcome Messages were posted? (posted / new groups)', am:'ስንት የአቀባበል መልዕክቶች ተላኩ? (የተላኩ / አዲስ ግሩፖች)', t:'ratio'},
      {id:'wk_started', en:'How many Installation Started messages were posted? (posted / jobs started)', am:'ስንት "ተከላ ተጀመረ" መልዕክቶች ተላኩ? (የተላኩ / የተጀመሩ ሥራዎች)', t:'ratio'},
      {id:'wk_progress', en:'How many Daily Progress Updates were posted? (posted / required)', am:'ስንት የዕለት ሪፖርቶች ተላኩ? (የተላኩ / የሚገባው)', t:'ratio'},
      {id:'wk_accept', en:'How many Customer Acceptance Requests were posted? (posted / jobs finished)', am:'ስንት የተቀባይነት ጥያቄዎች ተላኩ? (የተላኩ / የተጠናቀቁ ሥራዎች)', t:'ratio'},
      /* The rate was a percentage he was asked to work out from the four
         answers above, and was never given. It is those four added up:
         every message posted against every message due. */
      {id:'wk_rate', en:'What share of the WhatsApp messages due this week were posted? (%)', am:'ከሚገባው የዋትስአፕ መልዕክት ስንት በመቶው ተላከ? (%)', t:'pct',
        auto:{pct:[{plus:['wk_welcome__a', 'wk_started__a', 'wk_progress__a', 'wk_accept__a']},
                   {plus:['wk_welcome__b', 'wk_started__b', 'wk_progress__b', 'wk_accept__b']}]},
        tgt:{op:'gte', v:100, en:'100% earns the 1,000 Birr WhatsApp bonus', am:'100% የ1,000 ብር ጉርሻ ያስገኛል'}},
      {id:'wk_rate_why', en:'Under 100%. Which messages were missed, and why? (Write the jobs in the box.)', am:'ከ100% በታች ነው። የትኞቹ መልዕክቶች ቀሩ? ለምን? (ሥራዎቹን በሳጥኑ ይጻፉ።)', t:'area', auto:{weekText:'wa_viol_what', from:'elyas-daily'},
        picks:[
          { en:'Welcome Message',                        am:'የአቀባበል መልዕክት' },
          { en:'Installation Started',                   am:'"ተከላ ተጀመረ" መልዕክት' },
          { en:'Daily Progress Update',                  am:'የዕለት ሂደት ሪፖርት' },
          { en:'Acceptance Request',                     am:'የተቀባይነት ጥያቄ' },
          { en:'Forgot',                                 am:'ተረስቷል' },
          { en:'No phone or no data',                    am:'ስልክ ወይም ኢንተርኔት አልነበረም' },
          { en:'The assembler did not post',             am:'ገጣጣሚው አልለጠፈም' }
        ], show:{f:'wk_rate', when:'miss'}}
    ]},
    { en:'Problems and help', am:'ችግርና እርዳታ', fields:[
      {id:'problem', en:'What was the biggest problem this week? (Skip it if there was none.)', am:'የዚህ ሳምንት ትልቁ ችግር ምን ነበር? (ከሌለ ይዝለሉት።)', t:'area', auto:{weekText:'problem', from:'elyas-daily'}, opt:1,
        picks:[
          { en:'Sites not ready',                        am:'ቦታዎች ዝግጁ አልነበሩም' },
          { en:'Parts missing or damaged',               am:'የጎደለ ወይም የተጎዳ ዕቃ' },
          { en:'Not enough assemblers',                  am:'ገጣጣሚዎች በቂ አልነበሩም' },
          { en:'Late deliveries from the factory',       am:'ከፋብሪካ የዘገየ ጭነት' },
          { en:'Measurements did not match',             am:'ልኬቶች አልተመሳሰሉም' },
          { en:'No transport',                           am:'መጓጓዣ አልነበረም' },
          { en:'Customer complaints',                    am:'የደንበኛ ቅሬታዎች' }
        ]},
      {id:'outstanding', en:'What is still open? (Write who owns it in the box.)', am:'ገና ያልተፈታው ምንድን ነው? (ኃላፊውን በሳጥኑ ይጻፉ።)', t:'area', opt:1,
        picks:[
          { en:'Nothing is open',                        am:'ያልተፈታ ነገር የለም' },
          { en:'A job to finish',                        am:'የሚያልቅ ሥራ' },
          { en:'A part to come from the factory',        am:'ከፋብሪካ የሚመጣ ዕቃ' },
          { en:'A complaint',                            am:'ቅሬታ' },
          { en:'Rework to do',                           am:'እንደገና የሚሠራ ሥራ' }
        ], show:{f:'problem', when:'any'}},
      {id:'need_lead', en:'Do you need a decision from Mahelet?', am:'የማህሌት ውሳኔ ያስፈልግዎታል?', t:'yesno', auto:{week:'need_lead', how:'anyyes', from:'elyas-daily'}, yes:{en:'I need a decision', am:'ውሳኔ ያስፈልገኛል'}, no:{en:'No decision needed', am:'ውሳኔ አያስፈልገኝም'}},
      {id:'need_lead_what', en:'What should Mahelet decide? (Write the options and by when in the box.)', am:'ማህሌት ምን እንድትወስን ይፈልጋሉ? (አማራጮቹንና እስከ መቼ በሳጥኑ ይጻፉ።)', t:'area', auto:{weekText:'need_lead_what', from:'elyas-daily'},
        picks:[
          { en:"Move a job's date",                      am:'የሥራ ቀን ማዛወር' },
          { en:'More assemblers',                        am:'ተጨማሪ ገጣጣሚ' },
          { en:'Remove an assembler',                    am:'ገጣጣሚ ማንሳት' },
          { en:'Send a missing part',                    am:'የጎደለ ዕቃ መላክ' },
          { en:'Transport',                              am:'መጓጓዣ' },
          { en:'Rework at the factory',                  am:'በፋብሪካ እንደገና መሥራት' }
        ], show:{f:'need_lead', when:'yes'}}
    ]},
    { en:'Next week', am:'የሚቀጥለው ሳምንት', fields:[
      {id:'n_jobs', en:'How many jobs are planned for next week?', am:'ለሚቀጥለው ሳምንት ስንት ሥራዎች ታቅደዋል?', t:'num'},
      {id:'n_m2', en:'How many m² do you expect to install next week?', am:'በሚቀጥለው ሳምንት ስንት ካሬ ሜትር ለመግጠም ይጠበቃል?', t:'num'},
      {id:'n_support', en:'What do you need from Mahelet next week?', am:'በሚቀጥለው ሳምንት ከማህሌት ምን ያስፈልግዎታል?', t:'area', opt:1,
        picks:[
          { en:'Nothing needed',                         am:'ምንም አያስፈልግም', nil:1 },
          { en:'Jobs ready on time from the factory',    am:'ሥራዎች ከፋብሪካ በሰዓቱ እንዲደርሱ' },
          { en:'More assemblers',                        am:'ተጨማሪ ገጣጣሚ' },
          { en:'Transport',                              am:'መጓጓዣ' },
          { en:'Tools',                                  am:'መሣሪያዎች' },
          { en:'Sites confirmed ready',                  am:'ቦታዎች ዝግጁ መሆናቸው እንዲረጋገጥ' }
        ]},
      {id:'n_prio', en:'What comes first next week? (Job codes are enough; add the second and third if you want.)', am:'በሚቀጥለው ሳምንት መጀመሪያ የሚሠራው ምንድን ነው? (የሥራ ኮድ በቂ ነው፤ ከፈለጉ ሁለተኛና ሦስተኛውን ይጨምሩ።)', t:'area'}
    ]}
  ]
},

/* ===================== ASHENAFI — DAILY SITE SUPPORT ==================== */
{
  id:'ashenafi-daily', person:'ashenafi', cadence:'daily', dueTime:'17:00',
  en:'Daily Site Support Report', am:'ዕለታዊ የተከላ ድጋፍ ሪፖርት',
  toEn:'Elyas', toAm:'ኤልያስ',
  dueEn:'5:00 PM every working day — Elyas needs it for his 5:30 PM report',
  dueAm:'በየሥራ ቀኑ ከቀኑ 11፡00 (5:00 PM) — ኤልያስ ለ11፡30 ሪፖርቱ ይፈልገዋል',
  penEn:'Late –100 Birr · Missing –300 Birr', penAm:'ዘግይቶ –100 ብር · ካልተላከ –300 ብር',
  sections:[
    /* REBUILT 11 Oct 2026 (the Chairman: "they are struggling so much with
       the questions"). Ashenafi has never filed: 21 questions stood before
       any follow-up opened, fourteen of them yes/no about things that go
       wrong now and then (late to a site, a load that did not match, an
       unsafe site, a defect, a site left dirty, a tool not back), plus five
       rows of "done" to tap and a "why" to type for every one. Now a normal
       day is the sites, the times, one tap on "nothing else happened",
       whether he needs Elyas, and tomorrow. Everything that goes wrong is
       one tap on the list in section 2, and only then are its questions
       asked; every "why" is buttons with a box for the site or job. Every
       answer key is the one it always was — the yes/no answers the rulebook
       reads every day (s_late, c_clean, c_property, q_missed, w_helped) are
       worked out from the list ({picked:…}, quiet:1), so a month of normal
       days still pays the punctuality, cleanliness and quality bonuses. */
    { en:'Sites today', am:'የዛሬ ቦታዎች', fields:[
      {id:'s_rows', en:'Each site you supported today', am:'ዛሬ የደገፉት እያንዳንዱ ቦታ',
       t:'table', addEn:'Add site', addAm:'ቦታ ጨምር', cols:[
        {id:'code', en:'Job code', am:'የሥራ ኮድ', t:'text'},
        {id:'cust', en:'Customer', am:'ደንበኛ', t:'text'},
        {id:'site', en:'Site', am:'ቦታ', t:'text'},
        /* a photo button in each site row, as Elyas has (the Chairman, 13 Oct
           2026): sent to the Site room with this row's job code, counted in
           ph_site below */
        {id:'photos',en:'Photos of this site', am:'የዚህ ቦታ ፎቶዎች', t:'photo', tally:'ph_site'}
      ]},
      {id:'s_count', en:'How many sites did you support today?', am:'ዛሬ ስንት ቦታዎችን ደገፉ?', t:'num',
        auto:{rows:'s_rows'}, sumEn:'sites', sumAm:'ቦታዎች'},
      /* photos not tied to one site row; the tally says which jobs have photos */
      {id:'ph_site', en:'Site photos', am:'የቦታ ፎቶዎች', t:'photos', jobsFrom:'s_rows.code', opt:1},
      {id:'s_arrive', en:'What time did you arrive at the first site?', am:'መጀመሪያው ቦታ ስንት ሰዓት ደረሱ?', t:'text', time:1},
      {id:'s_depart', en:'What time did you leave the last site?', am:'ከመጨረሻው ቦታ ስንት ሰዓት ወጡ?', t:'text', time:1},
      /* five rows of "done" were five taps every day, and nothing reads them;
         what the rulebook needs from his day (clean, covered, tools back) is
         in the list below */
      {id:'sup', en:'Which of these did you do today? (If you want to say.)', am:'ዛሬ ከእነዚህ የትኞቹን ሠሩ? (መናገር ከፈለጉ።)', t:'grid', opt:1,
       rows:[{en:'Material carrying', am:'ቁሳቁስ ማመላለስ'},
             {en:'Protective covering', am:'መከላከያ ማንጠፍ'},
             {en:'Cleanup', am:'ጽዳት'},
             {en:'Tool collection', am:'መሣሪያ መሰብሰብ'},
             {en:'Photo taking', am:'ፎቶ ማንሳት'}],
       cols:[
        {id:'done', en:'Done', am:'ተሠርቷል', t:'yesno', yes:{en:'Done', am:'ተሠርቷል'}, no:{en:'Not done', am:'አልተሠራም'}},
        {id:'note', en:'Notes', am:'ማስታወሻ', t:'text'}
      ]}
    ]},
    /* THE ONE LIST. Fourteen yes/no questions used to stand in sections of
       their own, each asked every day whether or not anything happened. */
    { en:'Anything else today?', am:'ዛሬ ሌላ የሆነ ነገር አለ?', fields:[
      {id:'sup_events', en:'What else happened today?', am:'ዛሬ ሌላ ምን ሆነ?', t:'multi',
        none:{ en:'Nothing — a normal day', am:'ምንም — የተለመደ ቀን' },
        groups:[
          { v:'go',    en:'Getting to the site',    am:'ወደ ቦታው መድረስ' },
          { v:'qual',  en:'Defects',                am:'ጉድለቶች' },
          { v:'clean', en:'Cleaning and property',  am:'ጽዳትና ንብረት' },
          { v:'wa',    en:'WhatsApp',               am:'ዋትስአፕ' }
        ],
        opts:[
          { v:'late',        g:'go',    en:'I came late to a site',                    am:'ወደ አንድ ቦታ ዘግይቼ ደረስኩ' },
          { v:'load',        g:'go',    en:'The load did not match the delivery note (missing, wrong or damaged)', am:'ጭነቱ ከማድረሻ ሰነዱ ጋር አልተመሳሰለም (የጎደለ፣ የተሳሳተ ወይም የተጎዳ)' },
          { v:'unsafe',      g:'go',    en:'A site was unsafe to work on',             am:'ለሥራ አደገኛ የሆነ ቦታ ነበር' },
          { v:'defect',      g:'qual',  en:'I found a defect on finished work (scratch, stain, chip)', am:'በተጠናቀቀ ሥራ ላይ ጉድለት አገኘሁ (ጭረት፣ እድፍ፣ ስብራት)' },
          { v:'missed',      g:'qual',  en:'A defect I missed was found later by someone else', am:'ያመለጠኝ ጉድለት በኋላ በሌላ ሰው ተገኘ' },
          { v:'dirty',       g:'clean', en:'A site was not left clean',                am:'ንጹህ ያልሆነ ቦታ ቀረ' },
          { v:'pack',        g:'clean', en:'Packaging or rubbish was left behind',     am:'ማሸጊያ ወይም ቆሻሻ ቀረ' },
          { v:'tools',       g:'clean', en:'A tool did not come back to the store',    am:'ወደ መጋዘን ያልተመለሰ መሣሪያ አለ' },
          { v:'property',    g:'clean', en:"The customer's property was not covered",  am:'የደንበኛው ንብረት አልተሸፈነም' },
          { v:'damage',      g:'clean', en:'Material was damaged in carrying or on the truck', am:'ዕቃ በመሸከም ወይም በመኪና ላይ ተጎዳ' },
          { v:'no_help',     g:'wa',    en:'I did not help the assemblers post their daily update', am:'ገጣጣሚዎች የዕለት ሪፖርት እንዲልኩ አልረዳሁም' },
          { v:'upd_missing', g:'wa',    en:'An assembler did not post the daily update', am:'የዕለት ሪፖርት ያልላከ ገጣጣሚ ነበር' }
        ]}
    ]},
    { en:'Getting to the site', am:'ወደ ቦታው መድረስ', fields:[
      /* "no" every day of the month pays the 500 punctuality and the 1,500
         KPI bonuses; "yes" is –100 (ashenafi-late-arrival) */
      {id:'s_late', en:'Were you late to any site today?', am:'ዛሬ ወደ የትኛውም ቦታ ዘግይተው ደረሱ?', t:'yesno', quiet:1, auto:{picked:'sup_events', v:'late'}},
      {id:'s_late_why', en:'Why were you late, and was Elyas told? (Write the site and how late in the box.)', am:'ለምን ዘገዩ? ለኤልያስ ተነግሯል? (ቦታውንና ምን ያህል እንደዘገዩ በሳጥኑ ይጻፉ።)', t:'area',
        picks:[
          { en:'The taxi or bus was late',         am:'ታክሲ ወይም አውቶቡስ ዘገየ' },
          { en:'Waited for the truck',             am:'መኪናውን ጠበቅሁ' },
          { en:'Sick',                             am:'ታምሜ ነበር' },
          { en:'Family matter',                    am:'የቤተሰብ ጉዳይ' },
          { en:'Elyas was told',                   am:'ለኤልያስ ተነግሯል' },
          { en:'Elyas was not told',               am:'ለኤልያስ አልተነገረም' }
        ], show:{f:'s_late', when:'yes'}},
      {id:'pre_match', en:'Before leaving, did the load match the delivery note, with everything there and undamaged?', am:'ከመነሳትዎ በፊት ጭነቱ ከማድረሻ ሰነዱ ጋር ተመሳስሏል? ሁሉም ተሟልቶ ያልተጎዳ ነበር?', t:'yesno', quiet:1, auto:{picked:'sup_events', v:'load', flip:1}},
      {id:'pre_match_what', en:'What was missing, wrong or damaged, and was Elyas told? (Write the job in the box.)', am:'ምን ጎደለ፣ ተሳሳተ ወይም ተጎዳ? ለኤልያስ ተነግሯል? (ሥራውን በሳጥኑ ይጻፉ።)', t:'area',
        picks:[
          { en:'A part was missing',               am:'መለዋወጫ ጎደለ' },
          { en:'Wrong part or size',               am:'የተሳሳተ መለዋወጫ ወይም ልክ' },
          { en:'Something was damaged',            am:'የተጎዳ ነገር ነበር' },
          { en:'Hardware short (hinges, handles)', am:'ሃርድዌር አነሰ (ማጠፊያ፣ መያዣ)' },
          { en:'Elyas was told',                   am:'ለኤልያስ ተነግሯል' },
          { en:'Elyas was not told',               am:'ለኤልያስ አልተነገረም' }
        ], show:{f:'pre_match', when:'no'}},
      {id:'unsafe', en:'Was any site unsafe to work on today?', am:'ዛሬ ለሥራ አደገኛ የሆነ ቦታ ነበር?', t:'yesno', quiet:1, auto:{picked:'sup_events', v:'unsafe'}},
      {id:'unsafe_what', en:'What was unsafe, was work stopped, and was Elyas told? (Write the site in the box.)', am:'ምን አደገኛ ነበር? ሥራው ቆሟል? ለኤልያስ ተነግሯል? (ቦታውን በሳጥኑ ይጻፉ።)', t:'area',
        picks:[
          { en:'Loose wires or open sockets',      am:'የተላቀቁ ሽቦዎች ወይም ክፍት ሶኬት' },
          { en:'Building work going on around us', am:'በዙሪያችን የግንባታ ሥራ ነበር' },
          { en:'Working high without a proper ladder', am:'ያለ ተገቢ መሰላል ከፍ ብሎ መሥራት' },
          { en:'Water or gas leak',                am:'የውሃ ወይም የጋዝ መፍሰስ' },
          { en:'Work was stopped',                 am:'ሥራው ቆሟል' },
          { en:'Elyas was told',                   am:'ለኤልያስ ተነግሯል' }
        ], show:{f:'unsafe', when:'yes'}}
    ]},
    { en:'Defects', am:'ጉድለቶች', fields:[
      {id:'q_any', en:'Did you find any defect on finished work today (scratches, stains, chips)?', am:'ዛሬ በተጠናቀቀ ሥራ ላይ ያገኙት ጉድለት አለ? (ጭረት፣ እድፍ፣ ስብራት)', t:'yesno', quiet:1, auto:{picked:'sup_events', v:'defect'}},
      {id:'q_found_list', en:'Which defects?', am:'የትኞቹ ጉድለቶች?', t:'table', addEn:'Add a defect', addAm:'ጉድለት ጨምር',
        show:{f:'q_any', when:'yes'},
        cols:[
          {id:'code', en:'Job code', am:'የሥራ ኮድ', t:'text'},
          {id:'what', en:'Defect', am:'ጉድለት', t:'text', picks:COL_DEFECT},
          {id:'where', en:'Where exactly', am:'በትክክል የት', t:'text', picks:COL_CABINET},
          {id:'rmat', en:'Material to cut again', am:'በድጋሚ የሚቆረጥ ዕቃ', t:'choice', opts:REDO_OPTS},
          {id:'rcol', en:'Colour code', am:'የቀለም ኮድ', t:'colour', of:'rmat'},
          {id:'rqty', en:'How many pieces?', am:'ስንት ቁራጭ?', t:'num', ifCol:'rmat', ifNot:['none']},
          {id:'told', en:'Told to Elyas', am:'ለኤልያስ ተነግሯል', t:'yesno', yes:{en:'Elyas was told', am:'ለኤልያስ ተነግሮታል'}, no:{en:'Not told', am:'አልተነገረውም'}}
        ]},
      {id:'q_found', en:'How many defects did you find on finished work today?', am:'ዛሬ በተጠናቀቀ ሥራ ላይ ስንት ጉድለቶች አገኙ?', t:'num',
        auto:{rows:'q_found_list'}, sumEn:'defects found', sumAm:'ጉድለቶች ተገኝተዋል'},
      {id:'q_reported', en:'Did you report every defect to Elyas?', am:'ሁሉንም ጉድለቶች ለኤልያስ ነገሩ?', t:'yesno', yes:{en:'All told to Elyas', am:'ሁሉም ለኤልያስ ተነግረዋል'}, no:{en:'Not all told', am:'ያልተነገረ አለ'},
        auto:{all:'q_found_list.told'}},
      {id:'q_reported_why', en:'Which were not told to Elyas, and why?', am:'ለኤልያስ ያልተነገሩት የትኞቹ ናቸው? ለምን?', t:'area',
        picks:[
          { en:'Could not reach Elyas',            am:'ኤልያስን ማግኘት አልተቻለም' },
          { en:'Forgot',                           am:'ተረስቷል' },
          { en:'Thought it was small',             am:'ትንሽ ነገር መስሎኝ ነበር' },
          { en:'Will tell him tomorrow',           am:'ነገ እነግረዋለሁ' }
        ], show:{f:'q_reported', when:'no'}},
      /* "no" every day of the month pays the 1,000 quality support bonus;
         "yes" is –200 (ashenafi-defect-missed) */
      {id:'q_missed', en:'Was a defect you missed found later by someone else?', am:'ያመለጠዎት ጉድለት በኋላ በሌላ ሰው ተገኘ?', t:'yesno', quiet:1, auto:{picked:'sup_events', v:'missed'}},
      {id:'q_missed_what', en:'What was missed, and who found it? (Write the job in the box.)', am:'ምን አመለጠ? ማን አገኘው? (ሥራውን በሳጥኑ ይጻፉ።)', t:'area',
        picks:[
          { en:'A scratch',                        am:'ጭረት' },
          { en:'A stain',                          am:'እድፍ' },
          { en:'A chip',                           am:'ስብራት' },
          { en:'A door or drawer not aligned',     am:'በር ወይም መሳቢያ አልተስተካከለም' },
          { en:'Found by Elyas',                   am:'ኤልያስ አገኘው' },
          { en:'Found by the customer',            am:'ደንበኛው አገኘው' }
        ], show:{f:'q_missed', when:'yes'}}
    ]},
    { en:'Site cleanliness', am:'የቦታ ጽዳት', fields:[
      /* "yes" every day of the month pays the 1,000 cleanliness bonus; "no"
         is –150 (ashenafi-site-dirty) */
      {id:'c_clean', en:'Was every site left clean?', am:'ሁሉም ቦታዎች ንጹህ ሆነው ቀሩ?', t:'yesno', quiet:1, auto:{picked:'sup_events', v:'dirty', flip:1}},
      {id:'c_clean_why', en:'Which site was not left clean, and why? (Write the site in the box.)', am:'ንጹህ ያልሆነው የትኛው ቦታ ነው? ለምን? (ቦታውን በሳጥኑ ይጻፉ።)', t:'area',
        picks:[
          { en:'No time — the work ran late',      am:'ጊዜ አልነበረም — ሥራው ዘገየ' },
          { en:'No bags or broom',                 am:'የቆሻሻ ከረጢት ወይም መጥረጊያ አልነበረም' },
          { en:'The assemblers were still working', am:'ገጣጣሚዎቹ ገና እየሠሩ ነበር' },
          { en:'Will be cleaned tomorrow',         am:'ነገ ይጸዳል' }
        ], show:{f:'c_clean', when:'no'}},
      {id:'c_pack', en:'Was all packaging and rubbish removed?', am:'ሁሉም ማሸጊያዎችና ቆሻሻዎች ተነሱ?', t:'yesno', quiet:1, auto:{picked:'sup_events', v:'pack', flip:1}},
      {id:'c_tools', en:'Were all tools collected and returned to the store?', am:'ሁሉም መሣሪያዎች ተሰብስበው ወደ መጋዘን ተመለሱ?', t:'yesno', quiet:1, auto:{picked:'sup_events', v:'tools', flip:1}},
      {id:'c_tools_what', en:'Which tools are not back, and where are they? (Write the tool in the box.)', am:'ያልተመለሱት የትኞቹ መሣሪያዎች ናቸው? የት ናቸው? (መሣሪያውን በሳጥኑ ይጻፉ።)', t:'area',
        picks:[
          { en:'At the site — back tomorrow',      am:'በቦታው ነው — ነገ ይመለሳል' },
          { en:'With an assembler',                am:'ገጣጣሚ ጋር ነው' },
          { en:'Lost',                             am:'ጠፍቷል' }
        ], show:{f:'c_tools', when:'no'}},
      /* "no" is –200 (ashenafi-property-not-protected) */
      {id:'c_property', en:'Was the customer\'s property covered and protected?', am:'የደንበኛው ንብረት ተሸፍኖ ተጠብቋል?', t:'yesno', quiet:1, auto:{picked:'sup_events', v:'property', flip:1}},
      {id:'c_property_why', en:'Where was it not covered, and was anything damaged? (Write the site in the box.)', am:'የት ነው ያልተሸፈነው? የተጎዳ ነገር አለ? (ቦታውን በሳጥኑ ይጻፉ።)', t:'area',
        picks:[
          { en:'There were no covers',             am:'መሸፈኛ አልነበረም' },
          { en:'Not enough covers',                am:'መሸፈኛው አልበቃም' },
          { en:'Nothing was damaged',              am:'ምንም አልተጎዳም' },
          { en:'Something was damaged — Elyas was told', am:'የተጎዳ ነገር አለ — ለኤልያስ ተነግሯል' }
        ], show:{f:'c_property', when:'no'}},
      {id:'c_damage', en:'Was any material damaged in handling or transport today?', am:'ዛሬ በአያያዝ ወይም በማጓጓዝ የተጎዳ ቁሳቁስ አለ?', t:'yesno', quiet:1, auto:{picked:'sup_events', v:'damage'}},
      {id:'c_damage_what', en:'What was damaged, and how? Was Elyas told? (Write the job in the box.)', am:'ምን ተጎዳ? እንዴት? ለኤልያስ ተነግሯል? (ሥራውን በሳጥኑ ይጻፉ።)', t:'area',
        picks:[
          { en:'Dropped while carrying',           am:'ስንሸከም ወደቀ' },
          { en:'Damaged on the truck',             am:'በመኪናው ላይ ተጎዳ' },
          { en:'Hit a wall or a door',             am:'ግድግዳ ወይም በር መታ' },
          { en:'Elyas was told',                   am:'ለኤልያስ ተነግሯል' },
          { en:'Elyas is not told yet',            am:'ለኤልያስ ገና አልተነገረም' }
        ], show:{f:'c_damage', when:'yes'}}
    ]},
    { en:'WhatsApp support', am:'የዋትስአፕ ድጋፍ', fields:[
      /* "no" is –100 (ashenafi-dpu-support-failed) */
      {id:'w_helped', en:'Did you help the assemblers post their Daily Progress Update?', am:'ገጣጣሚዎች የዕለት ሪፖርት እንዲልኩ ረዱ?', t:'yesno', quiet:1, auto:{picked:'sup_events', v:'no_help', flip:1}},
      /* asked only on a day an update was missing; "no" is –100
         (ashenafi-missing-update-not-reported), and it stays optional as it
         always was, so a blank charges nothing */
      {id:'w_missing', en:'Did you tell Elyas about every missing update?', am:'ያልተላኩ ሪፖርቶችን ሁሉ ለኤልያስ ነገሩ?', t:'yesno', yes:{en:'I told him all', am:'ሁሉንም ነግሬዋለሁ'}, no:{en:'Not all', am:'ሁሉንም አልነገርኩትም'}, opt:1,
        show:{f:'sup_events', when:'has', v:'upd_missing'}}
    ]},
    { en:'Problems and help', am:'ችግርና እርዳታ', fields:[
      {id:'problem', en:'What was the biggest problem today? (If there was one.)', am:'የዛሬው ትልቁ ችግር ምን ነበር? (ካለ።)', t:'area', opt:1,
        picks:[
          { en:'The truck came late',              am:'መኪናው ዘገየ' },
          { en:'The customer was not home',        am:'ደንበኛው ቤት አልነበረም' },
          { en:'The site was not ready',           am:'ቦታው ዝግጁ አልነበረም' },
          { en:'A part was missing',               am:'መለዋወጫ ጎደለ' },
          { en:'Not enough hands',                 am:'የሰው ኃይል አልበቃም' },
          { en:'No covers, bags or tools',         am:'መሸፈኛ፣ ከረጢት ወይም መሣሪያ አልነበረም' }
        ]},
      /* asked once a problem is named — it used to be asked every day, with
         no problem to report */
      {id:'reported', en:'Did you tell Elyas about it?', am:'ለኤልያስ ነገሩት?', t:'yesno', yes:{en:'I told him', am:'ነግሬዋለሁ'}, no:{en:'Not yet', am:'ገና አልነገርኩትም'},
        show:{f:'problem', when:'any'}},
      {id:'reported_why', en:'Why not?', am:'ለምን አልተነገረም?', t:'area',
        picks:[
          { en:'Could not reach Elyas',            am:'ኤልያስን ማግኘት አልተቻለም' },
          { en:'Forgot',                           am:'ተረስቷል' },
          { en:'Elyas already knew',               am:'ኤልያስ ቀድሞ ያውቅ ነበር' },
          { en:'Will tell him tomorrow',           am:'ነገ እነግረዋለሁ' }
        ], show:{f:'reported', when:'no'}},
      {id:'need_elyas', en:'Do you need a decision or help from Elyas?', am:'የኤልያስ ውሳኔ ወይም እገዛ ያስፈልግዎታል?', t:'yesno', yes:{en:'I need his help', am:'እገዛው ያስፈልገኛል'}, no:{en:'Not needed', am:'አያስፈልገኝም'}},
      {id:'need_elyas_what', en:'What do you need from Elyas, and by when?', am:'ከኤልያስ ምን ያስፈልግዎታል? እስከ መቼ?', t:'area',
        picks:[
          { en:'Which site to go to',              am:'ወደ የትኛው ቦታ እንደምሄድ' },
          { en:'Transport',                        am:'ትራንስፖርት' },
          { en:'Covers, bags or tools',            am:'መሸፈኛ፣ ከረጢት ወይም መሣሪያ' },
          { en:'More hands at a site',             am:'በአንድ ቦታ ተጨማሪ ሰው' },
          { en:'A word with a customer',           am:'ከደንበኛ ጋር መነጋገር' }
        ], show:{f:'need_elyas', when:'yes'}}
    ]},
    { en:'Tomorrow', am:'ነገ', fields:[
      {id:'n_sites', en:'Which sites are you assigned to tomorrow?', am:'ነገ የተመደቡባቸው ቦታዎች የትኞቹ ናቸው?', t:'text', recent:1, opt:1},
      {id:'n_support', en:'What do you need for tomorrow, and from whom?', am:'ለነገ ምን ያስፈልግዎታል? ከማን?', t:'text', opt:1,
        picks:[
          { en:'Nothing needed',                   am:'ምንም አያስፈልግም', nil:1 },
          { en:'Transport (Alex)',                 am:'ትራንስፖርት (አሌክስ)' },
          { en:'Covers and bags',                  am:'መሸፈኛና ከረጢት' },
          { en:'Tools from the store',             am:'ከመጋዘን መሣሪያ' },
          { en:'Which site to go to (Elyas)',      am:'ወደ የትኛው ቦታ እንደምሄድ (ኤልያስ)' }
        ]}
    ]}
  ]
},

/* ---------------- Rovestone: one person reports, for now ----------------
   Frewoyni, Rovestone's Operations Lead (4 Oct 2026). Drafted from the
   Rovestone Internal Order Policy (what Rovestone sends Klever, what it pays)
   and the questions every lead here answers; no letter sets fines for her,
   so none are charged (noFine). */
{
  id:'frewoyni-daily', person:'frewoyni', cadence:'daily', dueTime:'17:30', noFine:1,
  en:'Rovestone Daily Report', am:'የሮቭስቶን ዕለታዊ ሪፖርት',
  toEn:'Chairman', toAm:'ሊቀመንበር',
  dueEn:'5:30 PM every working day', dueAm:'በየሥራ ቀኑ ከቀኑ 11፡30 (5:30 PM)',
  penEn:'No fines — reporting only', penAm:'ቅጣት የለም — ሪፖርት ብቻ',
  derived:1,
  sections:[
    /* LIGHT TOUCH, 11 Oct 2026 (the Chairman: "they are struggling so much
       with the questions"). Frewoyni has not filed yet, so there is nothing
       of hers to measure; the form was already short (seven answers on a
       quiet day). What changed is what the other forms taught: the "what is
       wrong / what are you waiting for / what should the Chairman decide"
       boxes have the usual answers as buttons, with a box under them for the
       job and the date. The morning brief reads every one of these as words,
       as it did; every answer key is as it was. */
    { en:'Today’s work', am:'የዛሬ ሥራ', fields:[
      {id:'w_done', en:'What did Rovestone get done today?', am:'ሮቭስቶን ዛሬ ምን ሠራ?', t:'area', picks:SIS_DONE},
      {id:'w_jobs', en:'Which jobs are open, and where does each stand?', am:'ክፍት የሆኑት ሥራዎች የትኞቹ ናቸው? እያንዳንዱ የት ደርሷል?', t:'table',
        addEn:'Add a job', addAm:'ሥራ ጨምር', opt:1, cols:[
          {id:'job', en:'Job or site', am:'ሥራ ወይም ቦታ', t:'text'},
          {id:'stage', en:'Where it stands', am:'ያለበት ደረጃ', t:'text', picks:SIS_STAGE},
          {id:'next', en:'Next step', am:'ቀጣይ እርምጃ', t:'text'},
          {id:'due', en:'Due', am:'የሚያልቅበት', t:'text'}
        ]},
      {id:'w_people', en:'How many people worked for Rovestone today?', am:'ዛሬ ለሮቭስቶን ስንት ሰው ሠራ?', t:'num', opt:1}
    ]},
    { en:'Orders with Klever', am:'ከክሌቨር ጋር ያሉ ትዕዛዞች', fields:[
      {id:'k_new', en:'Did Rovestone send Klever a new order request today?', am:'ሮቭስቶን ዛሬ ለክሌቨር አዲስ የትዕዛዝ ጥያቄ ልኳል?', t:'yesno', yes:{en:'A new order was sent', am:'አዲስ ትዕዛዝ ተልኳል'}, no:{en:'No new order', am:'አዲስ ትዕዛዝ የለም'}},
      {id:'k_new_list', en:'Which orders?', am:'የትኞቹ ትዕዛዞች?', t:'table', addEn:'Add an order', addAm:'ትዕዛዝ ጨምር',
        show:{f:'k_new', when:'yes'}, cols:[
          {id:'job', en:'Job', am:'ሥራ', t:'text'},
          {id:'m2', en:'m²', am:'ሜ²', t:'num'},
          {id:'need', en:'Needed by', am:'የሚፈለግበት ቀን', t:'text'},
          {id:'site', en:'Delivery site', am:'የማስረከቢያ ቦታ', t:'text'},
          {id:'drawings', en:'Drawings ready, or a Klever designer needed?', am:'ንድፍ ዝግጁ ነው ወይስ የክሌቨር ዲዛይነር ያስፈልጋል?', t:'text'}
        ]},
      /* read by the morning brief beside every other "waiting on" answer */
      {id:'k_waiting', en:'Is Rovestone waiting on anything from Klever? (Write what and since when in the box.)', am:'ሮቭስቶን ከክሌቨር የሚጠብቀው ነገር አለ? (ምን እንደሆነና ከመቼ ጀምሮ በሳጥኑ ይጻፉ።)', t:'area', opt:1,
        picks:[
          { en:'Nothing',                              am:'ምንም', nil:1 },
          { en:'Drawings or a design',                 am:'ንድፍ ወይም ዲዛይን' },
          { en:'A price or a proforma',                am:'ዋጋ ወይም ፕሮፎርማ' },
          { en:'A delivery',                           am:'ዕቃ እንዲደርስ' },
          { en:'An installation',                      am:'ተከላ' },
          { en:'A repair or a correction',             am:'ጥገና ወይም ማስተካከያ' }
        ]},
      {id:'k_quality', en:'Was there any problem with work Klever delivered?', am:'ክሌቨር ባስረከበው ሥራ ላይ ችግር ነበር?', t:'yesno', yes:{en:'There was a problem', am:'ችግር ነበር'}, no:{en:'No problem', am:'ችግር አልነበረም'}},
      {id:'k_quality_what', en:'What was wrong? Has Klever been told? (Write the job in the box.)', am:'ችግሩ ምን ነበር? ለክሌቨር ተነግሯል? (ሥራውን በሳጥኑ ይጻፉ።)', t:'area',
        picks:[
          { en:'It came late',                         am:'ዘግይቶ ደረሰ' },
          { en:'Wrong size',                           am:'የተሳሳተ መጠን' },
          { en:'Damaged',                              am:'ተጎድቷል' },
          { en:'Poor finish',                          am:'አጨራረሱ ደካማ ነው' },
          { en:'Parts missing',                        am:'ክፍሎች ጎድለዋል' },
          { en:'Klever has been told',                 am:'ለክሌቨር ተነግሯል' },
          { en:'Not told yet',                         am:'ገና አልተነገረም' }
        ], show:{f:'k_quality', when:'yes'}}
    ]},
    { en:'Money', am:'ገንዘብ', fields:[
      {id:'m_in', en:'How much money came in to Rovestone today?', am:'ዛሬ ወደ ሮቭስቶን ስንት ብር ገባ?', t:'money'},
      {id:'m_out', en:'How much did Rovestone pay out today?', am:'ሮቭስቶን ዛሬ ስንት ብር ከፈለ?', t:'money'},
      {id:'m_klever', en:'How much of it was paid to Klever?', am:'ከዚህ ውስጥ ለክሌቨር የተከፈለው ስንት ነው?', t:'money', opt:1}
    ]},
    { en:'Problems and decisions', am:'ችግርና ውሳኔ', fields:[
      {id:'p_problem', en:'What went wrong today? (Write what is being done in the box.)', am:'ዛሬ ምን ችግር ተፈጠረ? (ምን እየተደረገ እንደሆነ በሳጥኑ ይጻፉ።)', t:'area', opt:1,
        picks:[
          { en:'Nothing went wrong',                   am:'ምንም ችግር አልነበረም' },
          { en:'Waiting on Klever',                    am:'ክሌቨርን እየጠበቅን ነው' },
          { en:'Materials missing',                    am:'ዕቃ ጎድሏል' },
          { en:'Workers absent',                       am:'ሠራተኞች ቀሩ' },
          { en:'Money short',                          am:'ገንዘብ አጠረ' },
          { en:'A customer or site problem',           am:'የደንበኛ ወይም የቦታ ችግር' },
          { en:'Power cut',                            am:'መብራት ጠፋ' }
        ]},
      {id:'p_chair', en:'Do you need a decision from the Chairman?', am:'የሊቀመንበሩ ውሳኔ ያስፈልግዎታል?', t:'yesno', yes:{en:'I need a decision', am:'ውሳኔ ያስፈልገኛል'}, no:{en:'No decision needed', am:'ውሳኔ አያስፈልገኝም'}},
      {id:'p_chair_what', en:'What should the Chairman decide? (Write by when in the box.)', am:'ሊቀመንበሩ ምን እንዲወስኑ ይፈልጋሉ? (እስከ መቼ እንደሆነ በሳጥኑ ይጻፉ።)', t:'area',
        picks:[
          { en:'Approve an order to Klever',           am:'ለክሌቨር የሚሰጥ ትዕዛዝ ማጽደቅ' },
          { en:'Approve a payment',                    am:'ክፍያ ማጽደቅ' },
          { en:'A price',                              am:'ዋጋ' },
          { en:'Workers or hiring',                    am:'ሠራተኛ ወይም ቅጥር' },
          { en:'Which job comes first',                am:'የትኛው ሥራ እንደሚቀድም' }
        ], show:{f:'p_chair', when:'yes'}}
    ]},
    { en:'Tomorrow', am:'ነገ', fields:[
      {id:'t_plan', en:'What is the plan for tomorrow?', am:'የነገው ዕቅድ ምንድን ነው?', t:'area', picks:SIS_PLAN}
    ]}
  ]
},
{
  id:'frewoyni-weekly', person:'frewoyni', cadence:'weekly', built:1, dueTime:'17:00', dueDay:6, noFine:1,
  en:'Rovestone Weekly Summary', am:'የሮቭስቶን ሳምንታዊ ማጠቃለያ',
  toEn:'Chairman', toAm:'ሊቀመንበር',
  dueEn:'Saturday 5:00 PM', dueAm:'ቅዳሜ ከቀኑ 11፡00 (5:00 PM)',
  penEn:'No fines — reporting only', penAm:'ቅጣት የለም — ሪፖርት ብቻ',
  derived:1,
  sections:[
    /* LIGHT TOUCH, 11 Oct 2026. Not filed yet, so nothing to measure; the
       "why", "what problem" and "what do you need" boxes have the usual
       answers as buttons, with a box under them for the job and the date.
       Every figure and every answer key is as it was. */
    { en:'The week’s work', am:'የሳምንቱ ሥራ', fields:[
      {id:'w_summary', en:'What did Rovestone achieve this week?', am:'ሮቭስቶን በዚህ ሳምንት ምን አሳካ?', t:'area', auto:{weekText:'w_done'},},
      {id:'w_done', en:'How many jobs were finished this week?', am:'በዚህ ሳምንት ስንት ሥራ ተጠናቀቀ?', t:'num'},
      {id:'w_open', en:'How many jobs are still open?', am:'ስንት ሥራ አሁንም ክፍት ነው?', t:'num', auto:{week:'w_jobs', count:1, how:'last'},},
      {id:'w_behind', en:'How many of them are behind schedule?', am:'ከእነዚህ ስንቱ ከጊዜው ወደኋላ ቀርቷል?', t:'num'},
      {id:'w_behind_why', en:'Some jobs are behind. Why? (Write which, and by how much, in the box.)', am:'አንዳንድ ሥራዎች ወደኋላ ቀርተዋል። ለምን? (የትኞቹና በምን ያህል እንደሆነ በሳጥኑ ይጻፉ።)', t:'area',
        picks:[
          { en:'Waiting on Klever',                    am:'ክሌቨርን እየጠበቅን ነው' },
          { en:'Materials came late',                  am:'ዕቃ ዘግይቶ ደረሰ' },
          { en:'Not enough workers',                   am:'ሠራተኛ አልበቃም' },
          { en:'The customer changed the work',        am:'ደንበኛው ሥራውን ቀየረ' },
          { en:'Money short',                          am:'ገንዘብ አጠረ' },
          { en:'The site was not ready',               am:'ቦታው ዝግጁ አልነበረም' }
        ], show:{f:'w_behind', when:'pos'}}
    ]},
    { en:'Klever', am:'ክሌቨር', fields:[
      {id:'o_sent', en:'How many order requests did Rovestone send Klever this week?', am:'ሮቭስቶን በዚህ ሳምንት ለክሌቨር ስንት የትዕዛዝ ጥያቄ ላከ?', t:'num', auto:{week:'k_new_list', count:1},},
      {id:'o_got', en:'How many Klever deliveries did Rovestone receive this week?', am:'ሮቭስቶን በዚህ ሳምንት ከክሌቨር ስንት ጊዜ ዕቃ ተቀበለ?', t:'num'},
      {id:'o_issues', en:'Any delay or quality problem with Klever’s work? (Write the job in the box.)', am:'በክሌቨር ሥራ መዘግየት ወይም የጥራት ችግር ነበር? (ሥራውን በሳጥኑ ይጻፉ።)', t:'area', auto:{weekText:'k_quality_what'}, opt:1,
        picks:[
          { en:'None',                                 am:'ምንም' },
          { en:'It came late',                         am:'ዘግይቶ ደረሰ' },
          { en:'Wrong size',                           am:'የተሳሳተ መጠን' },
          { en:'Damaged',                              am:'ተጎድቷል' },
          { en:'Poor finish',                          am:'አጨራረሱ ደካማ ነው' },
          { en:'Parts missing',                        am:'ክፍሎች ጎድለዋል' }
        ]},
      {id:'o_owed', en:'How much does Rovestone owe Klever now?', am:'ሮቭስቶን አሁን ለክሌቨር ስንት ብር ዕዳ አለበት?', t:'money', opt:1}
    ]},
    { en:'Money', am:'ገንዘብ', fields:[
      {id:'f_in', en:'How much came in to Rovestone this week?', am:'በዚህ ሳምንት ወደ ሮቭስቶን ስንት ብር ገባ?', t:'money',
        auto:{week:'m_in'}},
      {id:'f_out', en:'How much did Rovestone pay out this week?', am:'ሮቭስቶን በዚህ ሳምንት ስንት ብር ከፈለ?', t:'money', auto:{week:'m_out'}},
      {id:'f_cash', en:'How much cash and bank does Rovestone hold at the end of the week?', am:'በሳምንቱ መጨረሻ ሮቭስቶን በጥሬ ገንዘብና በባንክ ስንት ብር አለው?', t:'money', opt:1}
    ]},
    { en:'Next week', am:'የሚቀጥለው ሳምንት', fields:[
      {id:'n_plan', en:'What is the plan for next week?', am:'የሚቀጥለው ሳምንት ዕቅድ ምንድን ነው?', t:'area'},
      {id:'n_need', en:'What do you need from Klever or the Chairman?', am:'ከክሌቨር ወይም ከሊቀመንበሩ ምን ያስፈልግዎታል?', t:'area', auto:{weekText:'k_waiting'}, opt:1,
        picks:[
          { en:'Nothing needed',                       am:'ምንም አያስፈልግም', nil:1 },
          { en:'Drawings or a design from Klever',     am:'ከክሌቨር ንድፍ ወይም ዲዛይን' },
          { en:'Klever deliveries on time',            am:'የክሌቨር ዕቃ በሰዓቱ እንዲደርስ' },
          { en:'A payment approved',                   am:'ክፍያ እንዲጸድቅ' },
          { en:'More workers',                         am:'ተጨማሪ ሠራተኛ' }
        ]},
      {id:'n_chair', en:'Do you need a decision from the Chairman?', am:'የሊቀመንበሩ ውሳኔ ያስፈልግዎታል?', t:'yesno', auto:{week:'p_chair', how:'anyyes'}, yes:{en:'I need a decision', am:'ውሳኔ ያስፈልገኛል'}, no:{en:'No decision needed', am:'ውሳኔ አያስፈልገኝም'}},
      {id:'n_chair_what', en:'What should the Chairman decide? (Write by when in the box.)', am:'ሊቀመንበሩ ምን እንዲወስኑ ይፈልጋሉ? (እስከ መቼ እንደሆነ በሳጥኑ ይጻፉ።)', t:'area', auto:{weekText:'p_chair_what'},
        picks:[
          { en:'Approve an order to Klever',           am:'ለክሌቨር የሚሰጥ ትዕዛዝ ማጽደቅ' },
          { en:'Approve a payment',                    am:'ክፍያ ማጽደቅ' },
          { en:'A price',                              am:'ዋጋ' },
          { en:'Workers or hiring',                    am:'ሠራተኛ ወይም ቅጥር' },
          { en:'Which job comes first',                am:'የትኛው ሥራ እንደሚቀድም' }
        ], show:{f:'n_chair', when:'yes'}}
    ]}
  ]
},

];

/* ---------------------------------------------------------------------------
   Two salespeople file the same two forms; five designers file the same two.
   Define each form once here and stamp a copy per person, so a fix to a field
   reaches all seven people instead of seven places.
   --------------------------------------------------------------------------- */

/* A company of the group that is not Klever reports here the way Rovestone
   does (Frewoyni's forms, above): its day, what passed between it and Klever
   either way, its money, its problems and what it needs decided. Written
   once for any such company; `co` is its name. No fines: not Klever staff. */
function sisterReports(pid, co, coAm) {
  var no = { penEn:'No fines — reporting only', penAm:'ቅጣት የለም — ሪፖርት ብቻ', noFine:1, derived:1,
             toEn:'Chairman', toAm:'ሊቀመንበር' };
  var daily = Object.assign({
    id: pid + '-daily', person: pid, cadence:'daily', dueTime:'17:30',
    en: co + ' Daily Report', am: 'የ' + coAm + ' ዕለታዊ ሪፖርት',
    dueEn:'5:30 PM every working day', dueAm:'በየሥራ ቀኑ ከቀኑ 11፡30 (5:30 PM)',
    sections:[
      { en:'1 · Today’s work', am:'1 · የዛሬ ሥራ', fields:[
        {id:'w_done', en:'What did ' + co + ' get done today?', am: coAm + ' ዛሬ ምን ሠራ?', t:'area', picks:SIS_DONE},
        {id:'w_jobs', en:'Which jobs are open, and where does each stand?', am:'ክፍት የሆኑት ሥራዎች የትኞቹ ናቸው? እያንዳንዱ የት ደርሷል?', t:'table',
          addEn:'Add a job', addAm:'ሥራ ጨምር', opt:1, cols:[
            {id:'job', en:'Job or site', am:'ሥራ ወይም ቦታ', t:'text'},
            {id:'stage', en:'Where it stands', am:'ያለበት ደረጃ', t:'text', picks:SIS_STAGE},
            {id:'next', en:'Next step', am:'ቀጣይ እርምጃ', t:'text'},
            {id:'due', en:'Due', am:'የሚያልቅበት', t:'text'}
          ]},
        {id:'w_people', en:'How many people worked for ' + co + ' today?', am:'ዛሬ ለ' + coAm + ' ስንት ሰው ሠራ?', t:'num', opt:1}
      ]},
      { en:'2 · With Klever', am:'2 · ከክሌቨር ጋር', fields:[
        {id:'k_new', en:'Did anything pass between ' + co + ' and Klever today — an order, a delivery, materials or a payment?',
         am:'ዛሬ በ' + coAm + ' እና በክሌቨር መካከል ትዕዛዝ፣ ጭነት፣ ዕቃ ወይም ክፍያ ነበር?', t:'yesno', yes:{en:'Yes, something passed', am:'አዎ፣ ነበር'}, no:{en:'Nothing today', am:'ዛሬ ምንም አልነበረም'}},
        {id:'k_new_list', en:'What passed?', am:'ምን ነበር?', t:'table', addEn:'Add one', addAm:'ጨምር',
          show:{f:'k_new', when:'yes'}, cols:[
            {id:'what', en:'Order, delivery, materials or payment', am:'ትዕዛዝ፣ ጭነት፣ ዕቃ ወይም ክፍያ', t:'text', picks:SIS_PASSED},
            {id:'job', en:'Job or item', am:'ሥራ ወይም ዕቃ', t:'text'},
            {id:'qty', en:'How much — m², pieces or Birr', am:'መጠን — ሜ²፣ ብዛት ወይም ብር', t:'text'},
            {id:'when', en:'Needed or due by', am:'የሚፈለግበት ቀን', t:'text'}
          ]},
        {id:'k_waiting', en:'Is ' + co + ' waiting on anything from Klever? What, and since when?',
         am: coAm + ' ከክሌቨር የሚጠብቀው ነገር አለ? ምን? ከመቼ ጀምሮ?', t:'area', opt:1, picks:SIS_WAIT},
        {id:'k_quality', en:'Was there any problem between ' + co + ' and Klever today — late, wrong, or poor quality?',
         am:'ዛሬ በ' + coAm + ' እና በክሌቨር መካከል ችግር ነበር — መዘግየት፣ ስሕተት ወይም የጥራት ችግር?', t:'yesno', yes:{en:'There was a problem', am:'ችግር ነበር'}, no:{en:'No problem', am:'ችግር አልነበረም'}},
        {id:'k_quality_what', en:'What, on which job, and has the other side been told?', am:'ምን? በየትኛው ሥራ? ለሌላው ወገን ተነግሯል?', t:'area', show:{f:'k_quality', when:'yes'}}
      ]},
      { en:'3 · Money', am:'3 · ገንዘብ', fields:[
        {id:'m_in', en:'How much money came in to ' + co + ' today?', am:'ዛሬ ወደ ' + coAm + ' ስንት ብር ገባ?', t:'money'},
        {id:'m_out', en:'How much did ' + co + ' pay out today?', am: coAm + ' ዛሬ ስንት ብር ከፈለ?', t:'money'},
        {id:'m_klever', en:'How much of it was paid to or received from Klever?', am:'ከዚህ ውስጥ ለክሌቨር የተከፈለው ወይም ከክሌቨር የተቀበለው ስንት ነው?', t:'money', opt:1}
      ]},
      { en:'4 · Problems and decisions', am:'4 · ችግሮችና ውሳኔዎች', fields:[
        {id:'p_problem', en:'What went wrong today, and what is being done about it?', am:'ዛሬ ምን ችግር ተፈጠረ? ምን እየተደረገ ነው?', t:'area', opt:1, picks:SIS_PROBLEM},
        {id:'p_chair', en:'Do you need a decision from the Chairman?', am:'የሊቀመንበሩ ውሳኔ ያስፈልግዎታል?', t:'yesno', yes:{en:'I need a decision', am:'ውሳኔ ያስፈልገኛል'}, no:{en:'No decision needed', am:'ውሳኔ አያስፈልገኝም'}},
        {id:'p_chair_what', en:'What exactly should he decide, and by when?', am:'በትክክል ምን እንዲወስኑ ይፈልጋሉ? እስከ መቼ?', t:'area', show:{f:'p_chair', when:'yes'}}
      ]},
      { en:'5 · Tomorrow', am:'5 · ነገ', fields:[
        {id:'t_plan', en:'What is the plan for tomorrow?', am:'የነገው ዕቅድ ምንድን ነው?', t:'area', picks:SIS_PLAN}
      ]}
    ]
  }, no);
  var weekly = Object.assign({
    id: pid + '-weekly', person: pid, cadence:'weekly', built:1, dueTime:'17:00', dueDay:6,
    en: co + ' Weekly Summary', am: 'የ' + coAm + ' ሳምንታዊ ማጠቃለያ',
    dueEn:'Saturday 5:00 PM', dueAm:'ቅዳሜ ከቀኑ 11፡00 (5:00 PM)',
    sections:[
      { en:'1 · The week’s work', am:'1 · የሳምንቱ ሥራ', fields:[
        {id:'w_summary', en:'What did ' + co + ' achieve this week?', am: coAm + ' በዚህ ሳምንት ምን አሳካ?', t:'area', auto:{weekText:'w_done'},},
        {id:'w_done', en:'How many jobs were finished this week?', am:'በዚህ ሳምንት ስንት ሥራ ተጠናቀቀ?', t:'num'},
        {id:'w_open', en:'How many jobs are still open?', am:'ስንት ሥራ አሁንም ክፍት ነው?', t:'num', auto:{week:'w_jobs', count:1, how:'last'},},
        {id:'w_behind', en:'How many of them are behind schedule?', am:'ከእነዚህ ስንቱ ከጊዜው ወደኋላ ቀርቷል?', t:'num'},
        {id:'w_behind_why', en:'Which, by how much, and why?', am:'የትኞቹ? በምን ያህል? ለምን?', t:'area', show:{f:'w_behind', when:'pos'}}
      ]},
      { en:'2 · Klever', am:'2 · ክሌቨር', fields:[
        {id:'o_sent', en:'How many orders or deliveries passed between ' + co + ' and Klever this week?',
         am:'በዚህ ሳምንት በ' + coAm + ' እና በክሌቨር መካከል ስንት ትዕዛዝ ወይም ፃነት ተካሄደ?', t:'num', auto:{week:'k_new_list', count:1},},
        {id:'o_issues', en:'Any delay or quality problem between ' + co + ' and Klever? Which job, and what?',
         am:'በ' + coAm + ' እና በክሌቨር መካከል መዘግየት ወይም የጥራት ችግር ነበር? የትኛው ሥራ? ምን?', t:'area', auto:{weekText:'k_quality_what'}, opt:1},
        {id:'o_owed', en:'What is owed between ' + co + ' and Klever now — how much, and who owes whom?',
         am:'አሁን በ' + coAm + ' እና በክሌቨር መካከል ያለው ዕዳ ስንት ነው? ማን ለማን?', t:'area', opt:1}
      ]},
      { en:'3 · Money', am:'3 · ገንዘብ', fields:[
        {id:'f_in', en:'How much came in to ' + co + ' this week?', am:'በዚህ ሳምንት ወደ ' + coAm + ' ስንት ብር ገባ?', t:'money', auto:{week:'m_in'},},
        {id:'f_out', en:'How much did ' + co + ' pay out this week?', am: coAm + ' በዚህ ሳምንት ስንት ብር ከፈለ?', t:'money', auto:{week:'m_out'},},
        {id:'f_cash', en:'How much cash and bank does ' + co + ' hold at the end of the week?', am:'በሳምንቱ መጨረሻ ' + coAm + ' በጥሬ ገንዘብና በባንክ ስንት ብር አለው?', t:'money', opt:1}
      ]},
      { en:'4 · Next week', am:'4 · የሚቀጥለው ሳምንት', fields:[
        {id:'n_plan', en:'What is the plan for next week?', am:'የሚቀጥለው ሳምንት ዕቅድ ምንድን ነው?', t:'area'},
        {id:'n_need', en:'What do you need from Klever or the Chairman?', am:'ከክሌቨር ወይም ከሊቀመንበሩ ምን ያስፈልግዎታል?', t:'area', auto:{weekText:'k_waiting'}, opt:1},
        {id:'n_chair', en:'Do you need a decision from the Chairman?', am:'የሊቀመንበሩ ውሳኔ ያስፈልግዎታል?', t:'yesno', auto:{week:'p_chair', how:'anyyes'}, yes:{en:'I need a decision', am:'ውሳኔ ያስፈልገኛል'}, no:{en:'No decision needed', am:'ውሳኔ አያስፈልገኝም'}},
        {id:'n_chair_what', en:'What exactly should he decide, and by when?', am:'በትክክል ምን እንዲወስኑ ይፈልጋሉ? እስከ መቼ?', t:'area', auto:{weekText:'p_chair_what'}, show:{f:'n_chair', when:'yes'}}
      ]}
    ]
  }, no);
  return [daily, weekly];
}

const SALES_DAILY = {
  id:'sales-daily', cadence:'daily', dueTime:'17:00',
  en:'Daily Sales Activity Report', am:'ዕለታዊ የሽያጭ እንቅስቃሴ ሪፖርት',
  toEn:'Ephrata', toAm:'ኤፍራታ',
  dueEn:'5:00 PM every working day — Ephrata needs it for her 5:30 PM report',
  dueAm:'በየሥራ ቀኑ ከቀኑ 11፡00 (5:00 PM)',
  penEn:'Late –200 Birr · Missing –500 Birr', penAm:'ዘግይቶ –200 ብር · ካልተላከ –500 ብር',
  sections:[
    /* LIGHT TOUCH, 11 Oct 2026 (the Chairman: "they are struggling so much
       with the questions"). The two salespeople cope: their first three daily
       reports left 85%, 7% and 4% of the questions blank (the very first was
       the old form). What they left empty was the "why" boxes — which quotations went under the
       margin floor, which stage message was missed — and the typed answers
       they did give were a handful of the same reasons ("proforma",
       "measurement", "discount", "delivery date"). Those reasons are buttons
       now, with a box under them for the customer's name. Nothing else moved:
       the lists, the gates and every answer key are as they were. Two
       questions that only mean something after a quotation or an advance —
       the 15-day expiry and "banked the same day" — open only then.
       Tomorrow's second and third are optional. */
    /* Six numbers stood above this list — the total and the five sources —
       and the list did not say where a lead came from, so the breakdown
       could not be checked against it. The source is a column now, the six
       numbers are counted from the rows, and whether the lead was called
       inside the day is in the row too (the Chairman, 9 Oct 2026). */
    { en:'Leads today', am:'የዛሬ አዲስ ደንበኞች', fields:[
      {id:'l_any', en:'Did any new lead come in today?', am:'ዛሬ አዲስ ደንበኛ መጥቷል?', t:'yesno', yes:{en:'New leads came', am:'አዲስ ደንበኛ መጥቷል'}, no:{en:'No new lead', am:'አዲስ ደንበኛ አልመጣም'}},
      {id:'l_list', en:'Each new lead today, as logged in the system', am:'ዛሬ የመጣ እያንዳንዱ አዲስ ደንበኛ፣ በሲስተሙ እንደተመዘገበው', t:'table', addEn:'Add a lead', addAm:'ደንበኛ ጨምር',
        show:{f:'l_any', when:'yes'},
        cols:[
          {id:'cust', en:'Customer', am:'ደንበኛ', t:'text'},
          {id:'lc', en:'Customer code: 4-digit lead no., or KK code once paid', am:'የደንበኛ ኮድ፦ ባለ 4 አሃዝ ቁጥር፣ ከከፈሉ በኋላ KK ኮድ', t:'text'},
          {id:'phone', en:'Phone', am:'ስልክ', t:'text'},
          {id:'src', en:'Where from', am:'ከየት', t:'choice', opts:[
            {v:'social', en:'Social media',             am:'ሶሻል ሚዲያ'},
            {v:'show',   en:'Walked into the showroom', am:'ሾውሩም የመጣ'},
            {v:'ref',    en:'Referred by someone',      am:'በሌላ ሰው ጥቆማ (ሪፈራል)'},
            {v:'agent',  en:'Through an agent',         am:'በኤጀንት'},
            {v:'other',  en:'Anywhere else',            am:'ከሌላ ቦታ'}
          ]},
          /* "not yet" is not "late" (the bug hunt, 15 Oct 2026): a lead that came in
             this afternoon still has its 24 hours. It is asked again in the next
             report (l_wait below), and judged there. */
          {id:'called', en:'Called within 24 hours?', am:'በ24 ሰዓት ውስጥ ተደውሏል?', t:'choice', opts:[
            {v:'yes',  en:'Called in time',                       am:'በሰዓቱ ተደውሏል'},
            {v:'wait', en:'Not yet — the 24 hours are not up',    am:'ገና — 24 ሰዓቱ ገና አላለፈም'},
            {v:'no',   en:'Not within 24 hours',                  am:'በ24 ሰዓት ውስጥ አልተደወለም'}
          ]},
          {id:'next', en:'Next step', am:'ቀጣይ እርምጃ', t:'text', picks:COL_NEXT}
        ]},
      /* the leads an earlier report said were not called yet, back until
         answered — a lead from Saturday afternoon is asked on Monday */
      {id:'l_wait', en:'Leads from your earlier reports not called yet: were they called within 24 hours?', am:'ቀደም ባሉ ሪፖርቶችዎ ገና ያልተደወለላቸው ደንበኞች፦ በ24 ሰዓት ውስጥ ተደወለላቸው?', t:'table',
        carry:{from:[{f:'l_list', col:'cust', when:{col:'called', is:'wait'}}], close:{col:'called', in:['yes', 'no']}, days:4, text:1, hideEmpty:1},
        cols:[
          {id:'cust', en:'Customer', am:'ደንበኛ', t:'text'},
          {id:'called', en:'Called within 24 hours?', am:'በ24 ሰዓት ውስጥ ተደውሏል?', t:'yesno', must:1, yes:{en:'Called in time', am:'በሰዓቱ ተደውሏል'}, no:{en:'Not within 24 hours', am:'በ24 ሰዓት ውስጥ አልተደወለም'}}
        ]},
      {id:'l_total', en:'How many new leads did you receive today?', am:'ዛሬ ስንት አዲስ ደንበኞች መጡ?', t:'num',
        auto:{rows:'l_list'}, sumEn:'new leads', sumAm:'አዲስ ደንበኞች'},
      {id:'l_social', en:'From social media', am:'ከሶሻል ሚዲያ', t:'num', i:1,
        auto:{rows:'l_list', when:{col:'src', is:'social'}}, sumEn:'from social media', sumAm:'ከሶሻል ሚዲያ'},
      {id:'l_show', en:'Walked into the showroom', am:'ሾውሩም የመጡ', t:'num', i:1,
        auto:{rows:'l_list', when:{col:'src', is:'show'}}, sumEn:'walked in', sumAm:'ሾውሩም የመጡ'},
      {id:'l_ref', en:'Referred by someone', am:'በሌላ ሰው ጥቆማ (ሪፈራል)', t:'num', i:1,
        auto:{rows:'l_list', when:{col:'src', is:'ref'}}, sumEn:'referred', sumAm:'በሌላ ሰው ጥቆማ'},
      {id:'l_agent', en:'Through an agent', am:'በኤጀንት', t:'num', i:1,
        auto:{rows:'l_list', when:{col:'src', is:'agent'}}, sumEn:'through an agent', sumAm:'በኤጀንት'},
      {id:'l_other', en:'Anywhere else', am:'ከሌላ ቦታ', t:'num', i:1,
        auto:{rows:'l_list', when:{col:'src', is:'other'}}, sumEn:'from elsewhere', sumAm:'ከሌላ ቦታ'}
    ]},
    { en:'Lead response', am:'የምላሽ ፍጥነት', fields:[
      {id:'r_1hr', en:'New leads today: how many did you call within 24 hours? (called within 24 hours / all new leads today)', am:'ዛሬ አዲስ የመጡ ደንበኞች፦ ስንቱን በ24 ሰዓት ውስጥ ደወሉላቸው? (በ24 ሰዓት ውስጥ የተደወለላቸው / ዛሬ የመጡ አዲስ ደንበኞች በሙሉ)', t:'ratio', whole:'l_total',
        /* today's leads answered yes or no, and the earlier ones answered today;
           a lead "not yet" inside its 24 hours is in neither (bug hunt, 15 Oct) */
        auto:{a:{plus:[{rows:'l_list', when:{col:'called', is:'yes'}}, {rows:'l_wait', when:{col:'called', is:'yes'}}]},
              b:{plus:[{rows:'l_list', when:{col:'called', in:['yes', 'no']}}, {rows:'l_wait', when:{col:'called', in:['yes', 'no']}}]}},
        tgt:{op:'gte', v:100, en:'Stage 1 of your commission — –200 Birr per missed lead',
             am:'የኮሚሽንዎ 1ኛ ደረጃ — ላመለጠ እያንዳንዱ –200 ብር'}},
      {id:'r_1hr_why', en:'Some leads were not called within 24 hours. Why? (Write who in the box.)', am:'አንዳንዶቹ በ24 ሰዓት ውስጥ አልተደወለላቸውም። ለምን? (ማን እንደሆነ በሳጥኑ ይጻፉ።)', t:'area',
        picks:[
          { en:'The customer did not answer',          am:'ደንበኛው ስልክ አላነሳም' },
          { en:'Wrong or switched-off number',         am:'ስልኩ የተሳሳተ ወይም ዝግ ነው' },
          { en:'Came in late — called the next morning', am:'ዘግይቶ መጣ — በማግስቱ ጠዋት ተደወለ' },
          { en:'I was out on a visit',                 am:'ለጉብኝት ወጥቼ ነበር' },
          { en:'Too many leads that day',              am:'በዕለቱ ብዙ ደንበኞች ነበሩ' },
          { en:'Forgot',                               am:'ተረስቷል' }
        ], show:{f:'r_1hr', when:'short'}}
    ]},
    { en:'Quotations', am:'ፕሮፎርማ', fields:[
      {id:'q_any', en:'Did you present any quotation today?', am:'ዛሬ ፕሮፎርማ አቀረቡ?', t:'yesno', yes:{en:'I gave quotations', am:'ፕሮፎርማ ሰጥቻለሁ'}, no:{en:'None today', am:'ዛሬ ፕሮፎርማ አልሰጠሁም'}},
      {id:'q_list', en:'Each quotation presented today', am:'ዛሬ የቀረበ እያንዳንዱ ፕሮፎርማ', t:'table', addEn:'Add a quotation', addAm:'ፕሮፎርማ ጨምር',
        show:{f:'q_any', when:'yes'},
        cols:[
          {id:'cust', en:'Customer', am:'ደንበኛ', t:'text'},
          {id:'lc', en:'Customer code: 4-digit lead no., or KK code once paid', am:'የደንበኛ ኮድ፦ ባለ 4 አሃዝ ቁጥር፣ ከከፈሉ በኋላ KK ኮድ', t:'text'},
          {id:'m2', en:'m²', am:'ካሬ ሜትር', t:'num'},
          {id:'value', en:'Value', am:'ዋጋ', t:'money'},
          {id:'margin', en:'Margin per m²', am:'ትርፍ በካሬ ሜትር', t:'money'},
          {id:'disc', en:'Discount given', am:'የተሰጠ ቅናሽ', t:'text'}
        ],
        /* the margin on the whole quotation cannot be more than its price
           (the Chairman, 8 Oct 2026: the m² was asked for nowhere) */
        rowOdd:{ per:'margin', times:'m2', max:'value',
                 en:'the margin per m² × the m² comes to {a}, more than the price {b}',
                 am:'ትርፍ በካሬ ሜትር × ካሬ ሜትሩ {a} ይሆናል — ከዋጋው {b} ይበልጣል' }},
      {id:'q_value', en:'What is the total value of today\'s quotations?', am:'የዛሬዎቹ ፕሮፎርማዎች ጠቅላላ ዋጋ ስንት ነው?', t:'money',
        auto:{sum:'q_list.value'}, sumEn:'quoted', sumAm:'የቀረበ ዋጋ'},
      {id:'q_issued', en:'How many quotations did you present today?', am:'ዛሬ ስንት ፕሮፎርማ ቀረበ?', t:'num',
        auto:{rows:'q_list'}, sumEn:'quotations', sumAm:'ፕሮፎርማዎች'},
      /* the mean of the margin each row names, not a figure worked out on the
         side: if a row is wrong the figure is wrong in the same place */
      {id:'q_margin', en:'What was the average margin per m² on today\'s quotations?', am:'የዛሬዎቹ ፕሮፎርማዎች አማካይ ትርፍ በካሬ ሜትር ስንት ነው?', t:'money',
        auto:{div:[{sum:'q_list.margin'}, {rows:'q_list', when:{col:'margin'}}]},
        tgt:{op:'gte', v:6000, en:'Margin floor 6,000 Birr/m² — below without approval is –1,000 Birr',
             am:'ዝቅተኛው ትርፍ በካሬ ሜትር 6,000 ብር — ያለፈቃድ ከዚህ በታች –1,000 ብር'}},
      /* the first real report read 0 here because the margin column was left
         empty — that is a button too, so the answer says so */
      {id:'q_margin_why', en:'Below 6,000 Birr/m². Who approved it? (Write the customer in the box.)', am:'ከ6,000 ብር በካሬ ሜትር በታች ነው። ማን አጸደቀው? (ደንበኛውን በሳጥኑ ይጻፉ።)', t:'area',
        picks:[
          { en:'Ephrata approved it',                  am:'ኤፍራታ አጽድቃዋለች' },
          { en:'The Chairman approved it',             am:'ሊቀመንበሩ አጽድቀውታል' },
          { en:'Not approved yet',                     am:'ገና አልጸደቀም' },
          { en:'The customer pushed for a lower price', am:'ደንበኛው ዋጋ እንዲቀንስ ገፋፋ' },
          { en:'The margin was left empty above',      am:'ከላይ ትርፉ ሳይሞላ ቀርቷል' }
        ], show:{f:'q_margin', when:'miss'}},
      /* 15 days, not 7 (the Chairman, 8 Oct 2026); the letters still say 7.
         Asked only on a day a quotation went out (11 Oct 2026). */
      {id:'q_expiry', en:'Did every quotation say it holds for 15 days?', am:'በሁሉም ፕሮፎርማ ላይ የ15 ቀን ገደብ ተጽፏል?', t:'yesno', yes:{en:'All say 15 days', am:'ሁሉም 15 ቀን ይላሉ'}, no:{en:'Some do not', am:'የማይል አለ'},
        show:{f:'q_any', when:'yes'}},
      {id:'q_expiry_why', en:'Not on every one. Is it corrected? (Write the customer in the box.)', am:'በሁሉም ላይ አልተጻፈም። ተስተካክሏል? (ደንበኛውን በሳጥኑ ይጻፉ።)', t:'area',
        picks:[
          { en:'Corrected and sent again',             am:'ተስተካክሎ እንደገና ተልኳል' },
          { en:'Will correct it tomorrow',             am:'ነገ ይስተካከላል' },
          { en:'The customer was told by phone',       am:'ለደንበኛው በስልክ ተነግሯል' },
          { en:'Forgot to write it',                   am:'መጻፍ ተረስቷል' }
        ], show:{f:'q_expiry', when:'no'}}
    ]},
    { en:'Contracts', am:'ውሎች', fields:[
      {id:'c_any', en:'Did you sign any contract today?', am:'ዛሬ ውል ተፈርሟል?', t:'yesno', yes:{en:'Contracts were signed', am:'ውል ተፈርሟል'}, no:{en:'No contract today', am:'ዛሬ ውል አልተፈረመም'}},
      {id:'c_list', en:'Each contract signed today', am:'ዛሬ የተፈረመ እያንዳንዱ ውል', t:'table', addEn:'Add a contract', addAm:'ውል ጨምር',
        show:{f:'c_any', when:'yes'},
        cols:[
          {id:'cust', en:'Customer', am:'ደንበኛ', t:'text'},
          {id:'lc', en:'Lead no. (4 digits)', am:'የደንበኛ ቁጥር (4 አሃዝ)', t:'text'},
          {id:'code', en:'Job code', am:'የሥራ ኮድ', t:'text'},
          {id:'value', en:'Contract value', am:'የውል ዋጋ', t:'money'},
          {id:'margin', en:'Margin per m²', am:'ትርፍ በካሬ ሜትር', t:'money'},
          {id:'adv', en:'Advance paid', am:'የተከፈለ ቅድመ ክፍያ', t:'money'}
        ]},
      {id:'c_signed', en:'How many contracts did you sign today?', am:'ዛሬ ስንት ውል ተፈረመ?', t:'num',
        auto:{rows:'c_list'}, sumEn:'contracts', sumAm:'ውሎች'},
      {id:'c_value', en:'What is the total value of today\'s contracts?', am:'የዛሬዎቹ ውሎች ጠቅላላ ዋጋ ስንት ነው?', t:'money',
        auto:{sum:'c_list.value'}, sumEn:'signed', sumAm:'የተፈረመ'},
      {id:'c_adv', en:'How much advance did you collect today?', am:'ዛሬ ስንት ቅድመ ክፍያ ተሰበሰበ?', t:'money',
        auto:{sum:'c_list.adv'}, sumEn:'advance collected', sumAm:'የተሰበሰበ ቅድመ ክፍያ'},
      {id:'c_told', en:'Was Selam told, so the deposit can be confirmed in the bank?', am:'ሰላም ገንዘቡን በባንክ እንድታረጋግጥ ተነግሯታል?', t:'yesno', yes:{en:'Selam was told', am:'ለሰላም ተነግሯታል'}, no:{en:'Not told yet', am:'ገና አልተነገራትም'}, show:{f:'c_adv', when:'pos'}},
      /* asked only when an advance came in (11 Oct 2026): with no advance
         there is nothing to bank, and nothing reads the answer then */
      {id:'c_banked', en:'Did all the advance go to the bank the same day?', am:'ቅድመ ክፍያው በሙሉ በዕለቱ ባንክ ገብቷል?', t:'yesno', yes:{en:'All banked', am:'በሙሉ ባንክ ገብቷል'}, no:{en:'Not all banked', am:'በሙሉ አልገባም'}, show:{f:'c_adv', when:'pos'}},
      {id:'c_banked_why', en:'Not banked the same day. Why, and when will it be? (Write where the money is now in the box.)', am:'በዕለቱ ባንክ አልገባም። ለምን? መቼ ይገባል? (ገንዘቡ አሁን የት እንዳለ በሳጥኑ ይጻፉ።)', t:'area',
        picks:[
          { en:'The bank was closed',                  am:'ባንኩ ተዘግቶ ነበር' },
          { en:'Paid late in the day',                 am:'ክፍያው ዘግይቶ ደረሰ' },
          { en:'A cheque — waiting to clear',          am:'ቼክ ነው — እስኪያልፍ እየጠበቅን ነው' },
          { en:'Handed to Selam',                      am:'ለሰላም ተሰጥቷል' },
          { en:'Will be banked tomorrow',              am:'ነገ ባንክ ይገባል' }
        ], show:{f:'c_banked', when:'no'}}
    ]},
    { en:'Money collected', am:'የተሰበሰበ ገንዘብ', fields:[
      {id:'k_any', en:'Did you collect money from any customer today?', am:'ዛሬ ከደንበኛ ገንዘብ ተቀብለዋል?', t:'yesno', yes:{en:'I collected money', am:'ገንዘብ ተቀብያለሁ'}, no:{en:'No money today', am:'ዛሬ ገንዘብ አልተቀበልኩም'}},
      {id:'k_list', en:'From whom?', am:'ከማን ከማን?', t:'table', addEn:'Add a payment', addAm:'ክፍያ ጨምር',
        show:{f:'k_any', when:'yes'},
        cols:[
          {id:'cust', en:'Customer', am:'ደንበኛ', t:'text'},
          {id:'lc', en:'Customer code: 4-digit lead no., or KK code once paid', am:'የደንበኛ ኮድ፦ ባለ 4 አሃዝ ቁጥር፣ ከከፈሉ በኋላ KK ኮድ', t:'text'},
          {id:'amount', en:'Amount', am:'መጠን', t:'money'},
          {id:'kind', en:'For', am:'የምን', t:'choice', opts:[
            {v:'advance', en:'Advance', am:'ቅድመ ክፍያ'},
            {v:'final', en:'Final payment', am:'የመጨረሻ ክፍያ'},
            {v:'other', en:'Other', am:'ሌላ'}]},
          /* the user, 15 Oct 2026: every payment with its receipt number, and
             Selam, who issues Klever's receipts, confirms each (apps-script/Receipts.js) */
          {id:'rcpt', en:'Receipt no.', am:'የደረሰኝ ቁጥር', t:'text', must:1},
          /* the user, 15 Oct 2026: a photo of the customer's slip (bank slip
             or transfer screenshot) in the row; Selam sees it beside the
             payment she confirms, and the Chairman too (/slips, app.js slipCell) */
          {id:'slip', en:'Photo of the payment slip', am:'የክፍያ ስሊፕ ፎቶ', t:'slip'}
        ]},
      {id:'k_today', en:'How much did you collect from customers today?', am:'ዛሬ ከደንበኞች ስንት ብር ተሰበሰበ?', t:'money',
        auto:{sum:'k_list.amount'}, sumEn:'collected', sumAm:'ተሰብስቧል'},
      /* this one stays typed on purpose: it is the figure the bank confirms,
         and checking it against the bank is the point of asking */
      {id:'k_week', en:'How much have you collected this week so far, bank-confirmed?', am:'በዚህ ሳምንት እስካሁን በባንክ የተረጋገጠ ስንት ብር ተሰበሰበ?', t:'money',
        tgt:{op:'gte', v:2000000, from:4, en:'Your weekly target is 2,000,000 Birr collected',
             am:'የሳምንቱ ዒላማዎ 2,000,000 ብር የተሰበሰበ ገንዘብ ነው'}},
      {id:'k_week_gap', en:'Who will close the gap to 2,000,000 Birr this week? (Write the customers and how much in the box.)', am:'በዚህ ሳምንት እስከ 2,000,000 ብር ያለውን ክፍተት ማን ይሞላል? (ደንበኞቹንና መጠኑን በሳጥኑ ይጻፉ።)', t:'area',
        picks:[
          { en:'A final payment is due',               am:'የመጨረሻ ክፍያ ይጠበቃል' },
          { en:'An advance from a new contract',       am:'ከአዲስ ውል ቅድመ ክፍያ' },
          { en:'A customer promised to pay',           am:'ደንበኛ ለመክፈል ቃል ገብቷል' },
          { en:'It will not close this week',          am:'በዚህ ሳምንት አይሞላም' }
        ], show:{f:'k_week', when:'miss'}}
    ]},
    { en:'Anything else today?', am:'ዛሬ ሌላ የሆነ ነገር አለ?', fields:[
      /* 11 Oct 2026 (the Chairman: "fix all"): a message kept waiting, a
         complaint and a referral are rare, and "0" was typed for each every
         day — or a word ("none") where the rulebook reads a number. Now they
         are taps; only what was tapped asks how many, and the rest file 0
         (zero:1), as on Ephrata's report. The stage messages stay asked:
         a missed one loses that stage's commission. */
      {id:'s_events', en:'Did any of this happen today?', am:'ዛሬ ከነዚህ የሆነ ነገር አለ?', t:'multi',
        none:{ en:'None of these today', am:'ዛሬ ከነዚህ ምንም የለም' },
        opts:[
          { v:'wa_slow',  en:'A customer message waited over 2 hours for my answer', am:'የደንበኛ መልዕክት ከ2 ሰዓት በላይ መልሴን ጠበቀ' },
          { v:'wa_comp',  en:'A customer complained about our communication',      am:'ደንበኛ ስለ ግንኙነታችን ቅሬታ አቀረበ' },
          { v:'referral', en:'I asked for a referral and logged it',                am:'ደንበኛው ሌላ ሰው እንዲጠቁመን ጠይቄ መዝግቤያለሁ (ሪፈራል)' }
        ]}
    ]},
    { en:'WhatsApp', am:'ዋትስአፕ', fields:[
      {id:'w_groups', en:'How many customer groups are you active in?', am:'በስንት የደንበኛ ግሩፖች ውስጥ ንቁ ነዎት?', t:'num'},
      {id:'w_stage', en:'How many required stage messages did you post today? (posted / required)', am:'ዛሬ ከሚገባው የደረጃ መልዕክት ስንቱ ተላከ? (የተላከ / የሚገባው)', t:'ratio', ask:{b:{en:"How many stage messages did you have to post today?", am:"ዛሬ ስንት የደረጃ መልዕክት መላክ ነበረብዎት?"}, a:{en:"How many of them did you post?", am:"ከእነሱ ስንቱን ላኩ?"}},
        tgt:{op:'gte', v:100, en:'A missed stage message loses that stage’s commission',
             am:'ያልተላከ የደረጃ መልዕክት የዚያን ደረጃ ኮሚሽን ያሳጣል'}},
      {id:'w_stage_why', en:'A stage message was missed. Why? (Write the customer and the stage in the box.)', am:'የደረጃ መልዕክት ቀርቷል። ለምን? (ደንበኛውንና ደረጃውን በሳጥኑ ይጻፉ።)', t:'area',
        picks:[
          { en:'Forgot to post',                       am:'መላክ ተረስቷል' },
          { en:'No news from production yet',          am:'ከምርት ክፍል መረጃ ገና አልደረሰም' },
          { en:'The customer group is not set up',     am:'የደንበኛው ግሩፕ ገና አልተከፈተም' },
          { en:'No signal or no data',                 am:'ኔትወርክ ወይም ዳታ አልነበረም' },
          { en:'Posted late',                          am:'ዘግይቶ ተልኳል' }
        ], show:{f:'w_stage', when:'short'}},
      {id:'w_unans', en:'How many messages waited more than 2 hours for your answer?', am:'ከ2 ሰዓት በላይ ምላሽ ሳያገኙ የቆዩ መልዕክቶች ስንት ናቸው?', t:'num', zero:1,
        show:{f:'s_events', when:'has', v:'wa_slow'},
        tgt:{op:'lte', v:0, en:'–200 Birr each', am:'እያንዳንዱ –200 ብር'}},
      {id:'w_unans_why', en:'Why did they wait? Are they answered now? (Write the customers in the box.)', am:'ለምን ቆዩ? አሁን ምላሽ አግኝተዋል? (ደንበኞቹን በሳጥኑ ይጻፉ።)', t:'area',
        picks:[
          { en:'I was on a visit or a call',           am:'በጉብኝት ወይም በስልክ ላይ ነበርኩ' },
          { en:'Phone off or no data',                 am:'ስልኩ ጠፍቶ ወይም ዳታ አልነበረም' },
          { en:'Did not see the message',              am:'መልዕክቱን አላየሁትም' },
          { en:'Needed an answer from someone else',   am:'ከሌላ ሰው መልስ እየጠበቅኩ ነበር' },
          { en:'Answered now',                         am:'አሁን ምላሽ ተሰጥቷል' }
        ], show:{f:'w_unans', when:'pos'}},
      {id:'w_comp', en:'How many customers complained about our communication?', am:'ስንት ደንበኞች ስለ ግንኙነታችን ቅሬታ አቀረቡ?', t:'num', zero:1,
        show:{f:'s_events', when:'has', v:'wa_comp'},
        tgt:{op:'lte', v:0, en:'–1,000 Birr each', am:'እያንዳንዱ –1,000 ብር'}},
      {id:'w_comp_what', en:'What was the complaint, and what was done? (Write who in the box.)', am:'ቅሬታው ምን ነበር? ምን ተደረገ? (ማን እንደሆነ በሳጥኑ ይጻፉ።)', t:'area',
        picks:[
          { en:'Delivery date missed',                 am:'የማስረከቢያ ቀን አለፈ' },
          { en:'Measurement or design late',           am:'ልኬት ወይም ዲዛይን ዘገየ' },
          { en:'No reply to messages',                 am:'ለመልዕክት ምላሽ አልተሰጠም' },
          { en:'Price or proforma',                    am:'ዋጋ ወይም ፕሮፎርማ' },
          { en:'Apologised and gave a new date',       am:'ይቅርታ ተጠይቆ አዲስ ቀን ተሰጠ' },
          { en:'Passed to Ephrata',                    am:'ለኤፍራታ ተላልፏል' }
        ], show:{f:'w_comp', when:'pos'}}
    ]},
    { en:'After-sales', am:'ከሽያጭ በኋላ', fields:[
      {id:'fu_any', en:'Was any follow-up call due today?', am:'ዛሬ መደረግ የነበረበት የክትትል ጥሪ አለ?', t:'yesno', yes:{en:'Calls were due', am:'መደወል የነበረብኝ ነበር'}, no:{en:'None due', am:'መደወል የነበረብኝ የለም'}},
      {id:'fu_list', en:'Which customers were called?', am:'የትኞቹ ደንበኞች ተደወለላቸው?', t:'table', addEn:'Add a customer', addAm:'ደንበኛ ጨምር',
        show:{f:'fu_any', when:'yes'}, cols:[
          {id:'cust', en:'Customer', am:'ደንበኛ', t:'text'},
          {id:'code', en:'Job code', am:'የሥራ ኮድ', t:'text'},
          {id:'happy', en:'Happy with the job', am:'በሥራው ረክተዋል', t:'yesno', yes:{en:'Happy', am:'ረክተዋል'}, no:{en:'Not happy', am:'አልረኩም'}},
          {id:'score', en:'Score 0–10: how likely are they to recommend us?', am:'ውጤት 0–10፦ እኛን ለሌሎች የመምከር ዕድላቸው?', t:'num'}
        ]},
      /* the rows are the calls made; how many were due is the only box left
         to fill, and the form counts the other from the list */
      {id:'fu_calls', en:'Of customers installed 48 hours ago, how many got their follow-up call? (called / due)', am:'ተከላቸው ከ48 ሰዓት በፊት ከተጠናቀቀ ደንበኞች ስንቱ የክትትል ጥሪ ተደረገላቸው? (የተደወለላቸው / መደወል የነበረባቸው)', t:'ratio', ask:{b:{en:"How many customers were due a follow-up call today (installed 48 hours ago)?", am:"ዛሬ ስንት ደንበኞች የክትትል ጥሪ ይገባቸው ነበር (ተከላቸው ከ48 ሰዓት በፊት ያለቀ)?"}, a:{en:"How many of them got their call? (Counted from your list.)", am:"ከእነሱ ስንቱ ተደወለላቸው? (ከዝርዝርዎ የተቆጠረ።)"}},
        show:{f:'fu_any', when:'yes'}, auto:{a:{rows:'fu_list'}}},
      {id:'fu_calls_why', en:'Who was not called, and when will they be? (Write the names in the box.)', am:'ያልተደወለላቸው እነማን ናቸው? መቼ ይደወልላቸዋል? (ስማቸውን በሳጥኑ ይጻፉ።)', t:'area',
        picks:[
          { en:'The customer did not answer',          am:'ደንበኛው ስልክ አላነሳም' },
          { en:'Wrong or switched-off number',         am:'ስልኩ የተሳሳተ ወይም ዝግ ነው' },
          { en:'Installation not finished yet',        am:'ተከላው ገና አላለቀም' },
          { en:'Will call tomorrow',                   am:'ነገ ይደወላል' }
        ], show:{f:'fu_calls', when:'short'}},
      {id:'ref_logged', en:'How many referrals did you ask for and log today?', am:'ዛሬ ስንት ጥቆማ (ሪፈራል) ጠይቀው መዘገቡ?', t:'num', zero:1,
        show:{f:'s_events', when:'has', v:'referral'}}
    ]},
    /* the reasons the salespeople typed in their first reports, as buttons:
       the design or proforma not ready, the measurement late, the price,
       the delivery date, a cancellation */
    { en:'Problems and help', am:'ችግርና እርዳታ', fields:[
      {id:'problem', en:'What was the biggest problem today?', am:'የዛሬው ትልቁ ችግር ምን ነበር?', t:'area', opt:1,
        picks:[
          { en:'No big problem today',                 am:'ዛሬ ትልቅ ችግር አልነበረም' },
          { en:'Design or proforma not ready',         am:'ዲዛይን ወይም ፕሮፎርማ አልደረሰም' },
          { en:'Measurement not done on time',         am:'ልኬት በሰዓቱ አልተወሰደም' },
          { en:'The customer says the price is too high', am:'ደንበኛው ዋጋው ውድ ነው አለ' },
          { en:'The customer is not answering or not deciding', am:'ደንበኛው ስልክ አያነሳም ወይም አልወሰነም' },
          { en:'Delivery date missed',                 am:'የማስረከቢያ ቀን አለፈ' },
          { en:'A customer cancelled',                 am:'ደንበኛ ሰረዘ' },
          { en:'Power or network cut',                 am:'መብራት ወይም ኔትወርክ ጠፋ' }
        ]},
      {id:'need_help', en:'What do you need, and from whom?', am:'ምን ያስፈልግዎታል? ከማን?', t:'area', opt:1,
        picks:[
          { en:'Nothing needed',                       am:'ምንም አያስፈልግም', nil:1 },
          { en:'A design or proforma (designer)',      am:'ዲዛይን ወይም ፕሮፎርማ (ዲዛይነር)' },
          { en:'A measurement booked (Ephrata)',       am:'የልኬት ቀጠሮ (ኤፍራታ)' },
          { en:'A delivery date (production)',         am:'የማስረከቢያ ቀን (ምርት)' },
          { en:'A payment confirmed (Selam)',          am:'የክፍያ ማረጋገጫ (ሰላም)' },
          { en:'A discount approved (Ephrata)',        am:'የቅናሽ ፈቃድ (ኤፍራታ)' }
        ]},
      {id:'need_lead', en:'Do you need a decision from Ephrata?', am:'የኤፍራታ ውሳኔ ያስፈልግዎታል?', t:'yesno', yes:{en:'I need a decision', am:'ውሳኔ ያስፈልገኛል'}, no:{en:'No decision needed', am:'ውሳኔ አያስፈልገኝም'}},
      {id:'need_lead_what', en:'What should Ephrata decide? (Write the customer and by when in the box.)', am:'ኤፍራታ ምን እንድትወስን ይፈልጋሉ? (ደንበኛውንና እስከ መቼ እንደሆነ በሳጥኑ ይጻፉ።)', t:'area',
        picks:[
          { en:'A discount above my limit',            am:'ከፈቃዴ በላይ የሆነ ቅናሽ' },
          { en:'A price change',                       am:'የዋጋ ለውጥ' },
          { en:'Get the design or proforma done',      am:'ዲዛይኑ ወይም ፕሮፎርማው እንዲደርስ' },
          { en:'Get the measurement booked',           am:'ልኬቱ እንዲያዝ' },
          { en:'Chase production for a date',          am:'ምርት ክፍሉ ቀን እንዲሰጥ' },
          { en:'Settle a customer complaint',          am:'የደንበኛ ቅሬታ እንዲፈታ' }
        ], show:{f:'need_lead', when:'yes'}}
    ]},
    { en:'Tomorrow', am:'ነገ', fields:[
      {id:'p1', en:'What comes first tomorrow? (A customer name or code is enough.)', am:'ነገ መጀመሪያ የሚሠራው ምንድን ነው? (የደንበኛ ስም ወይም ኮድ በቂ ነው።)', t:'text', from:['l_list.cust', 'q_list.cust'], recent:1},
      {id:'p2', en:'And second?', am:'ሁለተኛው?', t:'text', from:['l_list.cust', 'q_list.cust'], recent:1, opt:1},
      {id:'p3', en:'And third?', am:'ሦስተኛው?', t:'text', from:['l_list.cust', 'q_list.cust'], recent:1, opt:1}
    ]}
  ]
};

const SALES_WEEKLY = {
  id:'sales-weekly', cadence:'weekly', built:1, dueTime:'15:30', dueDay:6,
  en:'Weekly Sales Summary', am:'ሳምንታዊ የሽያጭ ማጠቃለያ',
  toEn:'Ephrata', toAm:'ኤፍራታ',
  dueEn:'Saturday 3:30 PM — Ephrata needs it for her 4:00 PM report',
  dueAm:'ቅዳሜ ከቀኑ 9፡30 (3:30 PM)',
  penEn:'Late or not sent –500 Birr', penAm:'ዘግይቶ ወይም ካልቀረበ –500 ብር',
  sections:[
    /* LIGHT TOUCH, 11 Oct 2026. The three weekly reports filed left 5% of
       the questions blank — the salespeople cope with this form. What they
       typed into the "why" boxes was the same few reasons in different words
       ("customer cancellation", "proforma not given at once", "discount",
       "follow up our work"); those are buttons now, with the box under them
       for the customers' names. One question read wrong: "contracts this
       month" got a Birr figure, so it says it wants a count. Every list,
       every figure and every answer key is as it was. */
    /* The week's contracts were typed out here a second time, every one of
       them already a row in the daily report that signed it (the Chairman,
       9 Oct 2026). The list gathers itself from those reports, and the
       figures come off the gathered rows. */
    { en:'Sales performance', am:'ሽያጭ እንዴት ሄደ', fields:[
      {id:'s_contracts_list', en:'Each contract signed this week', am:'በዚህ ሳምንት የተፈረመ እያንዳንዱ ውል', t:'table',
        auto:{weekRows:'c_list', dayCol:'day'},
        cols:[
          {id:'day', en:'Signed on', am:'የተፈረመበት', t:'text'},
          {id:'cust', en:'Customer', am:'ደንበኛ', t:'text'},
          {id:'lc', en:'Lead no. (4 digits)', am:'የደንበኛ ቁጥር (4 አሃዝ)', t:'text'},
          {id:'code', en:'Job code', am:'የሥራ ኮድ', t:'text'},
          {id:'value', en:'Contract value', am:'የውል ዋጋ', t:'money'},
          {id:'margin', en:'Margin per m²', am:'ትርፍ በካሬ ሜትር', t:'money'}
        ]},
      {id:'s_contracts', en:'How many contracts did you sign this week?', am:'በዚህ ሳምንት ስንት ውል ተፈረመ?', t:'num',
        auto:{rows:'s_contracts_list'}, sumEn:'contracts', sumAm:'ውሎች'},
      {id:'s_value', en:'What is the total value of this week\'s contracts?', am:'የዚህ ሳምንት ውሎች ጠቅላላ ዋጋ ስንት ነው?', t:'money',
        auto:{sum:'s_contracts_list.value'}, sumEn:'signed', sumAm:'የተፈረመ'},
      /* one weekly report put 447,622 here — a Birr figure in a count */
      {id:'s_month', en:'How many contracts with outside customers have you signed this month so far? (The number of contracts, not Birr.)', am:'በዚህ ወር እስካሁን ከውጭ ደንበኞች ስንት ውል ተፈረመ? (የውሉ ብዛት እንጂ ብር አይደለም።)', t:'num'},
      {id:'s_coll', en:'How much did you collect from external customers this week, bank-confirmed?', am:'በዚህ ሳምንት ከውጭ ደንበኞች በባንክ የተረጋገጠ ስንት ብር ተሰበሰበ?', t:'money', auto:{week:'k_week', from:'sales-daily', how:'last'},
        tgt:{op:'gte', v:2000000, en:'Target 2,000,000 Birr — below 1,000,000 is a failed week',
             am:'ዒላማ 2,000,000 ብር — ከ1,000,000 በታች የወደቀ ሳምንት ነው'}},
      /* the two reasons outside her control (a holiday, a cancellation) say
         so on the button: that is what the question used to ask in words */
      {id:'s_coll_why', en:'Under 2,000,000 Birr this week. Why? (Write the customers in the box.)', am:'በዚህ ሳምንት ከ2,000,000 ብር በታች ነው። ለምን? (ደንበኞቹን በሳጥኑ ይጻፉ።)', t:'area', auto:{weekText:'k_week_gap', from:'sales-daily'},
        picks:[
          { en:'A customer cancelled (outside my control)', am:'ደንበኛ ሰረዘ (ከቁጥጥሬ ውጭ)' },
          { en:'A holiday (outside my control)',       am:'በዓል ነበር (ከቁጥጥሬ ውጭ)' },
          { en:'Proforma or design came late',         am:'ፕሮፎርማ ወይም ዲዛይን ዘገየ' },
          { en:'Customers paid late',                  am:'ደንበኞች ዘግይተው ከፈሉ' },
          { en:'Few contracts signed',                 am:'የተፈረሙ ውሎች ጥቂት ናቸው' },
          { en:'Waiting for payments on delivery',     am:'በማስረከቢያ ጊዜ የሚከፈል ክፍያ እየጠበቅን ነው' }
        ], show:{f:'s_coll', when:'miss'}}
    ]},
    { en:'Collections day by day', am:'በየቀኑ የተሰበሰበ ገንዘብ', fields:[
      {id:'days', en:'How much was bank-confirmed on each day?', am:'በየቀኑ በባንክ የተረጋገጠ ስንት ብር ነው?', t:'grid', auto:{weekByDay:'k_today', col:'amt', from:'sales-daily'},
       rows:[{en:'Monday', am:'ሰኞ'},{en:'Tuesday', am:'ማክሰኞ'},{en:'Wednesday', am:'ረቡዕ'},
             {en:'Thursday', am:'ሐሙስ'},{en:'Friday', am:'ዓርብ'},{en:'Saturday', am:'ቅዳሜ'}],
       cols:[{id:'amt', en:'Collected', am:'የተሰበሰበ', t:'money'}]}
    ]},
    { en:'Lead performance', am:'ደንበኛ አያያዝ እንዴት ሄደ', fields:[
      {id:'lp_total', en:'How many new leads did you receive this week?', am:'በዚህ ሳምንት ስንት አዲስ ደንበኞች መጡ?', t:'num',
        auto:{week:'l_total'}},
      {id:'lp_1hr', en:'New leads this week: how many were called within 24 hours? (called within 24 hours / all new leads this week)', am:'በዚህ ሳምንት አዲስ የመጡ ደንበኞች፦ ስንቱ በ24 ሰዓት ውስጥ ተደወለላቸው? (በ24 ሰዓት ውስጥ የተደወለላቸው / በዚህ ሳምንት የመጡ አዲስ ደንበኞች በሙሉ)', t:'ratio', whole:'lp_total',
        auto:{a:{week:'r_1hr__a'}, b:{week:'r_1hr__b'}}},
      {id:'lp_1hr_why', en:'Some leads were missed. Why? (Write who in the box.)', am:'ያመለጡ ደንበኞች አሉ። ለምን? (ማን እንደሆነ በሳጥኑ ይጻፉ።)', t:'area', auto:{weekText:'r_1hr_why', from:'sales-daily'},
        picks:[
          { en:'The customer did not answer',          am:'ደንበኛው ስልክ አላነሳም' },
          { en:'Wrong or switched-off number',         am:'ስልኩ የተሳሳተ ወይም ዝግ ነው' },
          { en:'Came in late — called the next morning', am:'ዘግይቶ መጣ — በማግስቱ ጠዋት ተደወለ' },
          { en:'I was out on a visit',                 am:'ለጉብኝት ወጥቼ ነበር' },
          { en:'Too many leads that day',              am:'በዕለቱ ብዙ ደንበኞች ነበሩ' },
          { en:'Forgot',                               am:'ተረስቷል' }
        ], show:{f:'lp_1hr', when:'short'}},
      {id:'lp_quotes', en:'How many quotations did you present this week?', am:'በዚህ ሳምንት ስንት ፕሮፎርማ ቀረበ?', t:'num',
        auto:{week:'q_issued'}},
      {id:'lp_conv', en:'What share of your leads became contracts?', am:'ከደንበኞችዎ ስንት በመቶው ውል ፈረሙ?', t:'pct',
        auto:{pct:['s_contracts', 'lp_total']}},
      /* the rulebook averages this over the month (–300 Birr under 50%), so
         it stays asked; a fair guess is what it has always been */
      {id:'lp_follow', en:'About what share of your leads did you follow up this week?', am:'በዚህ ሳምንት ከደንበኞችዎ በግምት ስንት በመቶው ክትትል ተደረገላቸው?', t:'pct',
        tgt:{op:'gte', v:50, en:'Below 50% is –300 Birr', am:'ከ50% በታች –300 ብር'}},
      {id:'lp_follow_why', en:'Follow-up is under 50%. Why? (Write who you will call next week in the box.)', am:'ክትትሉ ከ50% በታች ነው። ለምን? (በሚቀጥለው ሳምንት የሚደውሉላቸውን በሳጥኑ ይጻፉ።)', t:'area',
        picks:[
          { en:'Customers did not answer',             am:'ደንበኞች ስልክ አላነሱም' },
          { en:'Too many new leads',                   am:'አዲስ ደንበኞች በዝተዋል' },
          { en:'Out on visits most of the week',       am:'አብዛኛውን ሳምንት በጉብኝት ላይ ነበርኩ' },
          { en:'Waiting for designs or proformas',     am:'ዲዛይን ወይም ፕሮፎርማ እየጠበቅኩ ነው' },
          { en:'Will call them next week',             am:'በሚቀጥለው ሳምንት ይደወልላቸዋል' }
        ], show:{f:'lp_follow', when:'miss'}}
    ]},
    { en:'Margin performance', am:'ትርፍ እንዴት ሄደ', fields:[
      {id:'mg_avg', en:'What was your average margin per m² this week?', am:'በዚህ ሳምንት አማካይ ትርፍዎ በካሬ ሜትር ስንት ነው?', t:'money',
        auto:{div:[{sum:'s_contracts_list.margin'}, {rows:'s_contracts_list', when:{col:'margin'}}]},
        tgt:{op:'gte', v:6000, en:'Margin floor 6,000 Birr/m²', am:'ዝቅተኛው ትርፍ በካሬ ሜትር 6,000 ብር'}},
      {id:'mg_below', en:'How many contracts did you sign below the margin floor?', am:'ከዝቅተኛው ትርፍ በታች ስንት ውል ተፈረመ?', t:'num',
        auto:{rows:'s_contracts_list', when:{col:'margin', lt:6000}},
        tgt:{op:'lte', v:0, en:'–1,000 Birr each without approval', am:'ያለፈቃድ እያንዳንዱ –1,000 ብር'}},
      {id:'mg_below_list', en:'Which of them, and who approved it', am:'የትኞቹ ናቸው? ማን አጸደቀው?', t:'table', auto:{weekRows:'c_list', from:'sales-daily', when:{col:'margin', lt:6000}}, addEn:'Add a contract', addAm:'ውል ጨምር',
        show:{f:'mg_below', when:'pos'},
        cols:[
          {id:'cust', en:'Customer', am:'ደንበኛ', t:'text'},
          {id:'lc', en:'Customer code: 4-digit lead no., or KK code once paid', am:'የደንበኛ ኮድ፦ ባለ 4 አሃዝ ቁጥር፣ ከከፈሉ በኋላ KK ኮድ', t:'text'},
          {id:'margin', en:'Margin per m²', am:'ትርፍ በካሬ ሜትር', t:'money'},
          {id:'by', en:'Approved by', am:'ያጸደቀው', t:'text'}
        ]}
    ]},
    { en:'Commission', am:'ኮሚሽን', fields:[
      {id:'cm_earned', en:'How much commission did you earn this week?', am:'በዚህ ሳምንት ስንት ብር ኮሚሽን አገኙ?', t:'money'},
      {id:'cm_missed_any', en:'Did you miss any commission stage this week?', am:'በዚህ ሳምንት ያመለጠዎት የኮሚሽን ደረጃ አለ?', t:'yesno', yes:{en:'I missed some', am:'ያመለጠኝ አለ'}, no:{en:'I missed none', am:'ያመለጠኝ የለም'}},
      {id:'cm_missed_list', en:'Which stages, on which jobs, and why?', am:'የትኞቹ ደረጃዎች? በየትኞቹ ሥራዎች? ለምን?', t:'table', addEn:'Add a missed stage', addAm:'ያመለጠ ደረጃ ጨምር',
        show:{f:'cm_missed_any', when:'yes'},
        cols:[
          {id:'cust', en:'Customer', am:'ደንበኛ', t:'text'},
          {id:'lc', en:'Customer code: 4-digit lead no., or KK code once paid', am:'የደንበኛ ኮድ፦ ባለ 4 አሃዝ ቁጥር፣ ከከፈሉ በኋላ KK ኮድ', t:'text'},
          {id:'stage', en:'Stage', am:'ደረጃ', t:'text'},
          {id:'lost', en:'Birr lost', am:'የጠፋ ብር', t:'money'},
          {id:'why', en:'Why', am:'ምክንያት', t:'text', picks:COL_STAGE_MISSED}
        ]},
      {id:'cm_missed', en:'How many commission stages did you miss?', am:'ስንት የኮሚሽን ደረጃዎች አመለጡ?', t:'num',
        auto:{rows:'cm_missed_list'}, sumEn:'stages missed', sumAm:'ያመለጡ ደረጃዎች',
        tgt:{op:'lte', v:0, en:'Each missed stage loses its share of the 2%',
             am:'እያንዳንዱ ያመለጠ ደረጃ ከ2% ድርሻውን ያሳጣል'}},
      {id:'cm_lost', en:'How much commission did that cost you?', am:'ይህ ስንት ብር ኮሚሽን አሳጣዎት?', t:'money',
        auto:{sum:'cm_missed_list.lost'}, sumEn:'lost', sumAm:'ጠፍቷል'}
    ]},
    { en:'WhatsApp', am:'ዋትስአፕ', fields:[
      {id:'ww_groups', en:'How many customer groups were you active in this week?', am:'በዚህ ሳምንት በስንት የደንበኛ ግሩፖች ውስጥ ንቁ ነበሩ?', t:'num', auto:{week:'w_groups', from:'sales-daily', how:'max'},},
      {id:'ww_posted', en:'How many required stage messages did you post? (posted / required)', am:'ከሚገባው የደረጃ መልዕክት ስንቱ ተላከ? (የተላከ / የሚገባው)', t:'ratio',
        auto:{a:{week:'w_stage__a'}, b:{week:'w_stage__b'}}},
      {id:'ww_posted_why', en:'Stage messages were missed. Why? (Write the customer and the stage in the box.)', am:'የደረጃ መልዕክቶች ቀርተዋል። ለምን? (ደንበኛውንና ደረጃውን በሳጥኑ ይጻፉ።)', t:'area', auto:{weekText:'w_stage_why', from:'sales-daily'},
        picks:[
          { en:'Forgot to post',                       am:'መላክ ተረስቷል' },
          { en:'No news from production yet',          am:'ከምርት ክፍል መረጃ ገና አልደረሰም' },
          { en:'The customer group is not set up',     am:'የደንበኛው ግሩፕ ገና አልተከፈተም' },
          { en:'No signal or no data',                 am:'ኔትወርክ ወይም ዳታ አልነበረም' },
          { en:'Posted late',                          am:'ዘግይቶ ተልኳል' }
        ], show:{f:'ww_posted', when:'short'}},
      {id:'ww_rate', en:'What is your compliance rate this week?', am:'ከሚገባው መልዕክት ስንት በመቶውን ላኩ?', t:'pct',
        auto:{pct:['ww_posted__a', 'ww_posted__b']},
        tgt:{op:'gte', v:100, en:'Every stage message must be posted', am:'እያንዳንዱ የደረጃ መልዕክት መላክ አለበት'}},
      {id:'ww_unans', en:'How many messages waited more than 2 hours for your answer?', am:'ከ2 ሰዓት በላይ ምላሽ ሳያገኙ የቆዩ መልዕክቶች ስንት ናቸው?', t:'num',
        auto:{week:'w_unans'},
        tgt:{op:'lte', v:0, en:'–200 Birr each', am:'እያንዳንዱ –200 ብር'}},
      {id:'ww_unans_why', en:'Why did they wait? (Write the customers in the box.)', am:'ለምን ቆዩ? (ደንበኞቹን በሳጥኑ ይጻፉ።)', t:'area', auto:{weekText:'w_unans_why', from:'sales-daily'},
        picks:[
          { en:'I was on a visit or a call',           am:'በጉብኝት ወይም በስልክ ላይ ነበርኩ' },
          { en:'Phone off or no data',                 am:'ስልኩ ጠፍቶ ወይም ዳታ አልነበረም' },
          { en:'Did not see the message',              am:'መልዕክቱን አላየሁትም' },
          { en:'Needed an answer from someone else',   am:'ከሌላ ሰው መልስ እየጠበቅኩ ነበር' }
        ], show:{f:'ww_unans', when:'pos'}}
    ]},
    { en:'Customer satisfaction', am:'የደንበኛ እርካታ', fields:[
      {id:'cu_any', en:'Did any customer of yours raise a complaint this week?', am:'በዚህ ሳምንት ቅሬታ ያቀረበ ደንበኛዎ አለ?', t:'yesno', yes:{en:'A complaint came in', am:'ቅሬታ ቀርቧል'}, no:{en:'No complaints', am:'ቅሬታ የለም'}},
      {id:'cu_list', en:'List each complaint', am:'እያንዳንዱን ቅሬታ ይዘርዝሩ', t:'table', addEn:'Add a complaint', addAm:'ቅሬታ ጨምር',
        show:{f:'cu_any', when:'yes'},
        cols:[
          {id:'cust', en:'Customer', am:'ደንበኛ', t:'text'},
          {id:'lc', en:'Customer code: 4-digit lead no., or KK code once paid', am:'የደንበኛ ኮድ፦ ባለ 4 አሃዝ ቁጥር፣ ከከፈሉ በኋላ KK ኮድ', t:'text'},
          {id:'what', en:'Complaint', am:'ቅሬታው', t:'text', picks:COL_COMPLAINT},
          {id:'state', en:'Status', am:'ሁኔታ', t:'choice', opts:[
            {v:'resolved', en:'Resolved', am:'ተፈቷል'},
            {v:'open', en:'Still open', am:'ገና አልተፈታም'}]}
        ]},
      {id:'cu_recv', en:'How many complaints did your customers raise this week?', am:'በዚህ ሳምንት ደንበኞችዎ ስንት ቅሬታ አቀረቡ?', t:'num',
        auto:{rows:'cu_list'}, sumEn:'complaints', sumAm:'ቅሬታዎች'},
      {id:'cu_res', en:'How many were resolved?', am:'ስንቱ ተፈቱ?', t:'num',
        auto:{rows:'cu_list', when:{col:'state', is:'resolved'}}, sumEn:'resolved', sumAm:'ተፈተዋል'},
      {id:'cu_out', en:'How many are still open?', am:'ስንቱ ገና አልተፈቱም?', t:'num',
        auto:{rows:'cu_list', when:{col:'state', is:'open'}}, sumEn:'still open', sumAm:'አልተፈቱም',
        tgt:{op:'lte', v:0, en:'Unresolved past 7 days loses the full commission on that job',
             am:'ከ7 ቀን በላይ ያልተፈታ የዚያን ሥራ ሙሉ ኮሚሽን ያሳጣል'}},
      {id:'cu_out_plan', en:'What is needed to close the open complaints? (Write the customer, who fixes it and by when in the box.)', am:'ያልተፈቱትን ቅሬታዎች ለመዝጋት ምን ያስፈልጋል? (ደንበኛውን፣ ማን እንደሚያስተካክለውና እስከ መቼ በሳጥኑ ይጻፉ።)', t:'area',
        picks:[
          { en:'Production must finish the job',       am:'ምርት ክፍሉ ሥራውን መጨረስ አለበት' },
          { en:'A delivery or installation date',      am:'የማስረከቢያ ወይም የተከላ ቀን' },
          { en:'Rework is being done',                 am:'ሥራው እንደገና እየተሠራ ነው' },
          { en:'The designer must fix it',             am:'ዲዛይነሩ ማስተካከል አለበት' },
          { en:'Passed to Ephrata',                    am:'ለኤፍራታ ተላልፏል' },
          { en:'The customer was given a date',        am:'ለደንበኛው ቀን ተሰጥቷል' }
        ], show:{f:'cu_out', when:'pos'}},
      {id:'fu_week', en:'Of customers installed this week, how many got the 48-hour follow-up call? (called / due)', am:'በዚህ ሳምንት ተከላቸው ከተጠናቀቀ ደንበኞች ስንቱ የ48 ሰዓት የክትትል ጥሪ ተደረገላቸው? (የተደወለላቸው / መደወል የነበረባቸው)', t:'ratio',
        auto:{a:{week:'fu_calls__a'}, b:{week:'fu_calls__b'}}},
      {id:'fu_week_why', en:'Who was not called, and why? (Write the names in the box.)', am:'ያልተደወለላቸው እነማን ናቸው? ለምን? (ስማቸውን በሳጥኑ ይጻፉ።)', t:'area', auto:{weekText:'fu_calls_why', from:'sales-daily'},
        picks:[
          { en:'The customer did not answer',          am:'ደንበኛው ስልክ አላነሳም' },
          { en:'Wrong or switched-off number',         am:'ስልኩ የተሳሳተ ወይም ዝግ ነው' },
          { en:'Installation not finished yet',        am:'ተከላው ገና አላለቀም' },
          { en:'Will call next week',                  am:'በሚቀጥለው ሳምንት ይደወላል' }
        ], show:{f:'fu_week', when:'short'}}
    ]},
    { en:'Problems and help', am:'ችግርና እርዳታ', fields:[
      {id:'problem', en:'What was the biggest problem this week?', am:'የዚህ ሳምንት ትልቁ ችግር ምን ነበር?', t:'area', auto:{weekText:'problem', from:'sales-daily'}, opt:1,
        picks:[
          { en:'No big problem this week',             am:'በዚህ ሳምንት ትልቅ ችግር አልነበረም' },
          { en:'Design or proforma not ready',         am:'ዲዛይን ወይም ፕሮፎርማ አልደረሰም' },
          { en:'Measurement not done on time',         am:'ልኬት በሰዓቱ አልተወሰደም' },
          { en:'Customers say the price is too high',  am:'ደንበኞች ዋጋው ውድ ነው አሉ' },
          { en:'Customers not answering or not deciding', am:'ደንበኞች ስልክ አያነሱም ወይም አልወሰኑም' },
          { en:'Delivery dates missed',                am:'የማስረከቢያ ቀኖች አለፉ' },
          { en:'A customer cancelled',                 am:'ደንበኛ ሰረዘ' }
        ]},
      {id:'outstanding', en:'What is still open and carries into next week?', am:'ገና ያልተፈታና ወደሚቀጥለው ሳምንት የሚሻገር ምንድን ነው?', t:'area', opt:1,
        picks:[
          { en:'Nothing',                              am:'ምንም', nil:1 },
          { en:'Late deliveries',                      am:'የዘገዩ ማስረከቢያዎች' },
          { en:'Designs or proformas still owed',      am:'ገና ያልደረሱ ዲዛይኖች ወይም ፕሮፎርማዎች' },
          { en:'Open complaints',                      am:'ያልተፈቱ ቅሬታዎች' },
          { en:'Discounts waiting for approval',       am:'ፈቃድ የሚጠብቁ ቅናሾች' },
          { en:'Payments not in yet',                  am:'ገና ያልገቡ ክፍያዎች' }
        ]},
      {id:'need_lead', en:'Do you need a decision from Ephrata?', am:'የኤፍራታ ውሳኔ ያስፈልግዎታል?', t:'yesno', auto:{week:'need_lead', how:'anyyes', from:'sales-daily'}, yes:{en:'I need a decision', am:'ውሳኔ ያስፈልገኛል'}, no:{en:'No decision needed', am:'ውሳኔ አያስፈልገኝም'}},
      {id:'need_lead_what', en:'What should Ephrata decide? (Write the customer and by when in the box.)', am:'ኤፍራታ ምን እንድትወስን ይፈልጋሉ? (ደንበኛውንና እስከ መቼ እንደሆነ በሳጥኑ ይጻፉ።)', t:'area', auto:{weekText:'need_lead_what', from:'sales-daily'},
        picks:[
          { en:'A discount above my limit',            am:'ከፈቃዴ በላይ የሆነ ቅናሽ' },
          { en:'A price change',                       am:'የዋጋ ለውጥ' },
          { en:'Get the design or proforma done',      am:'ዲዛይኑ ወይም ፕሮፎርማው እንዲደርስ' },
          { en:'Get the measurement booked',           am:'ልኬቱ እንዲያዝ' },
          { en:'Chase production for a date',          am:'ምርት ክፍሉ ቀን እንዲሰጥ' },
          { en:'Settle a customer complaint',          am:'የደንበኛ ቅሬታ እንዲፈታ' }
        ], show:{f:'need_lead', when:'yes'}}
    ]},
    { en:"Next week's plan", am:'የሚቀጥለው ሳምንት ዕቅድ', fields:[
      {id:'n_contracts', en:'How many contracts do you expect to sign next week?', am:'በሚቀጥለው ሳምንት ስንት ውል ይፈረማል ብለው ይጠብቃሉ?', t:'num'},
      {id:'n_value', en:'What value do you expect them to bring?', am:'ምን ያህል ዋጋ ያመጣሉ ብለው ይጠብቃሉ?', t:'money'},
      {id:'n_custs', en:'Which customers are you negotiating with, and what is the next step? (Write the customers in the box.)', am:'ከየትኞቹ ደንበኞች ጋር እየተደራደሩ ነው? ቀጣዩ እርምጃ ምንድን ነው? (ደንበኞቹን በሳጥኑ ይጻፉ።)', t:'area', opt:1,
        picks:[
          { en:'Send the proforma',                    am:'ፕሮፎርማ መላክ' },
          { en:'Book the measurement',                 am:'የልኬት ቀጠሮ መያዝ' },
          { en:'Offer a discount',                     am:'ቅናሽ ማቅረብ' },
          { en:'Wait for their decision',              am:'ውሳኔያቸውን መጠበቅ' },
          { en:'Sign the contract',                    am:'ውል መፈረም' }
        ]},
      {id:'n_support', en:'What support do you need from Ephrata next week?', am:'በሚቀጥለው ሳምንት ከኤፍራታ ምን ድጋፍ ያስፈልግዎታል?', t:'area', opt:1,
        picks:[
          { en:'Nothing needed',                       am:'ምንም አያስፈልግም', nil:1 },
          { en:'Approve discounts',                    am:'ቅናሾችን ማጽደቅ' },
          { en:'Designs and proformas on time',        am:'ዲዛይንና ፕሮፎርማ በሰዓቱ እንዲደርስ' },
          { en:'Follow up our jobs with production',   am:'ሥራዎቻችንን ከምርት ክፍል ጋር መከታተል' },
          { en:'Help to close a big customer',         am:'ትልቅ ደንበኛ ለመዝጋት እገዛ' }
        ]}
    ]}
  ]
};

const DESIGN_DAILY = {
  id:'design-daily', cadence:'daily', dueTime:'17:30',
  en:'Daily Design Progress Report', am:'ዕለታዊ የዲዛይን ሪፖርት',
  toEn:'Ephrata', toAm:'ኤፍራታ',
  dueEn:'5:30 PM every working day', dueAm:'በየሥራ ቀኑ ከቀኑ 11፡30 (5:30 PM)',
  penEn:'Late –200 Birr · Missing –500 Birr', penAm:'ዘግይቶ –200 ብር · ካልተላከ –500 ብር',
  sections:[
    /* LIGHT TOUCH, 11 Oct 2026 (the Chairman: "they are struggling so much
       with the questions"). The designers cope: their reports left 0–55% of
       the questions blank, and by the third day most left none. Three things
       went wrong in what they filed. The "what should Ephrata decide" box was
       left empty every time it opened. Count boxes got words — "none", "no",
       "There is no complaints" — where the rulebook reads a number. And the
       camera-consent question was asked on a day with no visit, so it was
       answered "no" and then had to be explained. Now: every "why" and "what
       is blocking it" is buttons with a box for the customer's name; the
       counts say "(0 if none)"; the consent question says what to tap when
       nobody was filmed; the drawing checklist is asked only on a day a
       drawing went to production; tomorrow's second and third are optional.
       The lists, the gates and every answer key are as they were. */
    /* One row a measurement, and the row carries what used to be asked about
       it in separate questions: whether it was on time, whether the video was
       recorded, whether it went up. Four counts and five two-box questions
       stood around these two lists; all of them are counted from the rows
       now (the Chairman, 9 Oct 2026). */
    /* ONE TAP FOR A NORMAL DAY (11 Oct 2026, the Chairman: "fix all").
       Thirteen "how many… (0 if none)" boxes stood every day, and on 9 Oct
       three designers typed "none" in them — read as one each and fined. The
       things that rarely happen are taps on this list now; only what was
       tapped asks how many, and the rest file 0 (zero:1), so the rulebook
       and the week read the same keys as before. The camera-consent answer
       is worked out from it. The stage messages stay asked: a missed one
       loses that stage's commission. */
    { en:'Today', am:'ዛሬ', fields:[
      {id:'dz_events', en:'Did any of this happen today?', am:'ዛሬ ከነዚህ የሆነ ነገር አለ?', t:'multi',
        none:{ en:'None of these today', am:'ዛሬ ከነዚህ ምንም የለም' },
        groups:[
          { v:'work', en:'Designs and drawings', am:'ዲዛይንና ሥዕሎች' },
          { v:'film', en:'Filming',              am:'ቀረጻ' },
          { v:'wa',   en:'WhatsApp',             am:'ዋትስአፕ' }
        ],
        opts:[
          { v:'held',     g:'work', en:'A design of mine is held up by someone else',      am:'ዲዛይኔ በሌላ ሰው ምክንያት ቆሟል' },
          { v:'drawings', g:'work', en:'I gave production drawings to Mahelet and Amaha',  am:'ለማህሌትና ለአማሃ የምርት ሥዕሎችን ሰጠሁ' },
          { v:'code_err', g:'work', en:'A drawing had a material code error',               am:'ሥዕል የቁሳቁስ ኮድ ስህተት ነበረበት' },
          { v:'profile',  g:'work', en:'A design went for approval (Designer Profile needed)', am:'ዲዛይን ለማጽደቅ ቀረበ (የዲዛይነር ፕሮፋይል ያስፈልጋል)' },
          { v:'disc',     g:'film', en:'I held a design discussion with a customer',        am:'ከደንበኛ ጋር የዲዛይን ውይይት አደረግሁ' },
          { v:'no_consent', g:'film', en:'I filmed someone without asking on camera first', am:'በካሜራ ሳልጠይቅ የቀረጽኩት አለ' },
          { v:'summary',  g:'wa',   en:'I posted a Design Discussion Summary',              am:'የውይይት ማጠቃለያ ላክሁ' },
          { v:'wa_slow',  g:'wa',   en:'A customer message waited over 2 hours for an answer', am:'የደንበኛ መልዕክት ከ2 ሰዓት በላይ ምላሽ ሳያገኝ ቆየ' },
          { v:'wa_comp',  g:'wa',   en:'A customer complained about design communication',  am:'ደንበኛ ስለ ዲዛይን ግንኙነታችን ቅሬታ አቀረበ' }
        ]}
    ]},
    { en:'Measurements today', am:'የዛሬ ልኬቶች', fields:[
      {id:'m_pre_any', en:'Did you do any pre-measurement today?', am:'ዛሬ ቅድመ ልኬት አደረጉ?', t:'yesno', yes:{en:'I did pre-measurements', am:'ቅድመ ልኬት ሠርቻለሁ'}, no:{en:'None today', am:'ዛሬ አልሠራሁም'}},
      {id:'m_pre_list', en:'Each pre-measurement today — one row each', am:'የዛሬ እያንዳንዱ ቅድመ ልኬት — በረድፍ አንድ', t:'table', addEn:'Add a customer', addAm:'ደንበኛ ጨምር',
        show:{f:'m_pre_any', when:'yes'},
        cols:[
          {id:'cust', en:'Customer', am:'ደንበኛ', t:'text'},
          {id:'lc', en:'Customer code: 4-digit lead no., or KK code once paid', am:'የደንበኛ ኮድ፦ ባለ 4 አሃዝ ቁጥር፣ ከከፈሉ በኋላ KK ኮድ', t:'text'},
          {id:'where', en:'Area', am:'አካባቢ', t:'text'},
          {id:'next', en:'Pre-design due', am:'ቅድመ ዲዛይን የሚደርስበት', t:'text'},
          {id:'ontime', en:'Within 48 hours of the lead?', am:'ደንበኛው ከመጣ በ48 ሰዓት ውስጥ?', t:'yesno', yes:{en:'Within 48 hours', am:'በ48 ሰዓት ውስጥ'}, no:{en:'Later', am:'ዘግይቷል'}},
          {id:'vid', en:'Video (3–5 min)', am:'ቪዲዮ (3–5 ደቂቃ)', t:'choice', opts:[
            {v:'up',  en:'Recorded and uploaded',      am:'ተቀርጾ ተጭኗል'},
            {v:'rec', en:'Recorded, not uploaded yet', am:'ተቀርጿል፣ ገና አልተጫነም'},
            {v:'no',  en:'No video',                   am:'ቪዲዮ የለም'}
          ]}
        ]},
      {id:'m_pre', en:'How many pre-measurements did you do today?', am:'ዛሬ ስንት ቅድመ ልኬቶችን አደረጉ?', t:'num',
        auto:{rows:'m_pre_list'}, sumEn:'pre-measurements', sumAm:'ቅድመ ልኬቶች'},
      {id:'m_pre_ontime', en:'How many were within 48 hours of the lead? (on time / done)', am:'ስንቱ ደንበኛው ከመጣ በ48 ሰዓት ውስጥ ተደረጉ? (በሰዓቱ / የተደረጉ)', t:'ratio',
        /* only rows whose box was answered count (the bug hunt, 15 Oct 2026 — as
           for Elyas's ac_called on 11 Oct: a box left untapped was fined as a "no") */
        auto:{a:{rows:'m_pre_list', when:{col:'ontime', is:'yes'}}, b:{rows:'m_pre_list', when:{col:'ontime', in:['yes', 'no']}}},
        tgt:{op:'gte', v:100, en:'Late is –300 Birr and loses stage 1', am:'ዘግይቶ –300 ብር እና 1ኛ ደረጃን ያሳጣል'}},
      {id:'m_pre_ontime_why', en:'Some were later than 48 hours. Why? (Write the customer and how late in the box.)', am:'አንዳንዶቹ ከ48 ሰዓት በላይ ዘገዩ። ለምን? (ደንበኛውንና በምን ያህል እንደዘገየ በሳጥኑ ይጻፉ።)', t:'area',
        picks:[
          { en:'The customer was not available',       am:'ደንበኛው አልተገኘም' },
          { en:'The customer changed the day',         am:'ደንበኛው ቀኑን ቀየረ' },
          { en:'The lead reached me late',             am:'ደንበኛው ዘግይቶ ደረሰኝ' },
          { en:'Too many visits that day',             am:'በዕለቱ ብዙ ጉብኝት ነበር' },
          { en:'No transport',                         am:'ትራንስፖርት አልነበረም' }
        ], show:{f:'m_pre_ontime', when:'short'}},
      {id:'m_fin_any', en:'Did you do any final measurement today?', am:'ዛሬ የመጨረሻ ልኬት አደረጉ?', t:'yesno', yes:{en:'I did final measurements', am:'የመጨረሻ ልኬት ሠርቻለሁ'}, no:{en:'None today', am:'ዛሬ አልሠራሁም'}},
      {id:'m_fin_list', en:'Each final measurement today — one row each', am:'የዛሬ እያንዳንዱ የመጨረሻ ልኬት — በረድፍ አንድ', t:'table', addEn:'Add a job', addAm:'ሥራ ጨምር',
        show:{f:'m_fin_any', when:'yes'},
        cols:[
          {id:'cust', en:'Customer', am:'ደንበኛ', t:'text'},
          {id:'code', en:'Job code', am:'የሥራ ኮድ', t:'text'},
          {id:'green', en:'Selam’s green light first', am:'የሰላም ፈቃድ ቀድሞ ነበር?', t:'yesno', yes:{en:'Green light came first', am:'የሰላም ፈቃድ ቀድሞ ነበር'}, no:{en:'Measured without it', am:'ፈቃድ ሳይኖር ተለካ'}},
          {id:'ontime', en:'Within 24 hours of the advance?', am:'ከቅድመ ክፍያ በ24 ሰዓት ውስጥ?', t:'yesno', yes:{en:'Within 24 hours', am:'በ24 ሰዓት ውስጥ'}, no:{en:'Later', am:'ዘግይቷል'}},
          {id:'amend', en:'Did it change the price?', am:'ዋጋውን ቀይሯል?', t:'yesno', yes:{en:'The price changed', am:'ዋጋው ተቀይሯል'}, no:{en:'Same price', am:'ዋጋው አልተቀየረም'}},
          {id:'vid', en:'Video (5–8 min)', am:'ቪዲዮ (5–8 ደቂቃ)', t:'choice', opts:[
            {v:'up',  en:'Recorded and uploaded',      am:'ተቀርጾ ተጭኗል'},
            {v:'rec', en:'Recorded, not uploaded yet', am:'ተቀርጿል፣ ገና አልተጫነም'},
            {v:'no',  en:'No video',                   am:'ቪዲዮ የለም'}
          ]}
        ]},
      {id:'m_fin', en:'How many final measurements did you do today?', am:'ዛሬ ስንት የመጨረሻ ልኬቶችን አደረጉ?', t:'num',
        auto:{rows:'m_fin_list'}, sumEn:'final measurements', sumAm:'የመጨረሻ ልኬቶች'},
      {id:'m_fin_ontime', en:'How many were within 24 hours of the advance? (on time / done)', am:'ስንቱ ከቅድመ ክፍያ በ24 ሰዓት ውስጥ ተደረጉ? (በሰዓቱ / የተደረጉ)', t:'ratio',
        /* only rows whose box was answered count (the bug hunt, 15 Oct 2026 — as
           for Elyas's ac_called on 11 Oct: a box left untapped was fined as a "no") */
        auto:{a:{rows:'m_fin_list', when:{col:'ontime', is:'yes'}}, b:{rows:'m_fin_list', when:{col:'ontime', in:['yes', 'no']}}},
        tgt:{op:'gte', v:100, en:'Late is –300 Birr and loses stage 4', am:'ዘግይቶ –300 ብር እና 4ኛ ደረጃን ያሳጣል'}},
      {id:'m_fin_ontime_why', en:'Some were later than 24 hours. Why? (Write the customer in the box.)', am:'አንዳንዶቹ ከ24 ሰዓት በላይ ዘገዩ። ለምን? (ደንበኛውን በሳጥኑ ይጻፉ።)', t:'area',
        picks:[
          { en:'The customer was not available',       am:'ደንበኛው አልተገኘም' },
          { en:'The site was not ready',               am:'ቦታው ዝግጁ አልነበረም' },
          { en:'Waiting for Selam’s green light',      am:'የሰላምን ፈቃድ እየጠበቅኩ ነበር' },
          { en:'Too many visits that day',             am:'በዕለቱ ብዙ ጉብኝት ነበር' },
          { en:'No transport',                         am:'ትራንስፖርት አልነበረም' }
        ], show:{f:'m_fin_ontime', when:'short'}},
      {id:'m_fin_amend', en:'Did any final measurement change the price?', am:'የመጨረሻ ልኬት ዋጋውን የቀየረበት ሥራ አለ?', t:'yesno',
        yes:{en:'A price changed', am:'ዋጋው የተቀየረበት አለ'}, no:{en:'No price changed', am:'የለም'},
        auto:{any:'m_fin_list.amend'}},
      {id:'m_fin_amend_what', en:'The price changed. Who was told? (Write the customer and how much in the box.)', am:'ዋጋው ተቀይሯል። ለማን ተነገረ? (ደንበኛውንና መጠኑን በሳጥኑ ይጻፉ።)', t:'area',
        picks:[
          { en:'The salesperson was told',             am:'ለሻጩ ተነግሯል' },
          { en:'Selam was told',                       am:'ለሰላም ተነግሯል' },
          { en:'Not told yet',                         am:'ገና አልተነገረም' },
          { en:'The price went up',                    am:'ዋጋው ጨመረ' },
          { en:'The price went down',                  am:'ዋጋው ቀነሰ' }
        ], show:{f:'m_fin_amend', when:'yes'}}
    ]},
    /* the videos are a column of the measurement rows now; what is left here
       is the consent, the design discussions, and the reasons */
    { en:'Videos', am:'ቪዲዮዎች', fields:[
      {id:'v_pre_rec', en:'How many pre-measurement videos (3–5 min) were recorded? (recorded / visits)', am:'ስንት የቅድመ ልኬት ቪዲዮዎች (3–5 ደቂቃ) ተቀረጹ? (የተቀረጹ / ጉብኝቶች)', t:'ratio',
        /* only rows whose box was answered count (the bug hunt, 15 Oct 2026 — as
           for Elyas's ac_called on 11 Oct: a box left untapped was fined as a "no") */
        auto:{a:{rows:'m_pre_list', when:{col:'vid', in:['up','rec']}}, b:{rows:'m_pre_list', when:{col:'vid', in:['up', 'rec', 'no']}}},
        tgt:{op:'gte', v:100, en:'A missing video is –500 Birr and loses 0.2%',
             am:'ያልተቀረጸ ቪዲዮ –500 ብር እና 0.2% ያሳጣል'}},
      {id:'v_pre_rec_why', en:'Some visits have no video. Why? (Write the customer in the box.)', am:'አንዳንድ ጉብኝቶች ቪዲዮ የላቸውም። ለምን? (ደንበኛውን በሳጥኑ ይጻፉ።)', t:'area',
        picks:[
          { en:'The customer did not agree to filming', am:'ደንበኛው መቀረጽ አልፈቀደም' },
          { en:'Phone battery or memory ran out',      am:'የስልኩ ባትሪ ወይም ሜሞሪ አለቀ' },
          { en:'Forgot to film',                       am:'መቅረጽ ተረስቷል' },
          { en:'Too dark, or no room to film',         am:'ጨለማ ነበር ወይም ለመቅረጽ ቦታ አልነበረም' },
          { en:'Someone else did the visit',           am:'ጉብኝቱን ሌላ ሰው አደረገው' }
        ], show:{f:'v_pre_rec', when:'short'}},
      {id:'v_fin_rec', en:'How many final measurement videos (5–8 min) were recorded? (recorded / measurements)', am:'ስንት የመጨረሻ ልኬት ቪዲዮዎች (5–8 ደቂቃ) ተቀረጹ? (የተቀረጹ / ልኬቶች)', t:'ratio',
        /* only rows whose box was answered count (the bug hunt, 15 Oct 2026 — as
           for Elyas's ac_called on 11 Oct: a box left untapped was fined as a "no") */
        auto:{a:{rows:'m_fin_list', when:{col:'vid', in:['up','rec']}}, b:{rows:'m_fin_list', when:{col:'vid', in:['up', 'rec', 'no']}}},
        tgt:{op:'gte', v:100, en:'A missing video is –500 Birr and loses 0.3%',
             am:'ያልተቀረጸ ቪዲዮ –500 ብር እና 0.3% ያሳጣል'}},
      {id:'v_fin_rec_why', en:'Some measurements have no video. Why? (Write the customer in the box.)', am:'አንዳንድ ልኬቶች ቪዲዮ የላቸውም። ለምን? (ደንበኛውን በሳጥኑ ይጻፉ።)', t:'area',
        picks:[
          { en:'The customer did not agree to filming', am:'ደንበኛው መቀረጽ አልፈቀደም' },
          { en:'Phone battery or memory ran out',      am:'የስልኩ ባትሪ ወይም ሜሞሪ አለቀ' },
          { en:'Forgot to film',                       am:'መቅረጽ ተረስቷል' },
          { en:'Too dark, or no room to film',         am:'ጨለማ ነበር ወይም ለመቅረጽ ቦታ አልነበረም' },
          { en:'Someone else did the visit',           am:'ጉብኝቱን ሌላ ሰው አደረገው' }
        ], show:{f:'v_fin_rec', when:'short'}},
      {id:'v_uploaded', en:'How many videos were uploaded within 24 hours? (uploaded / recorded)', am:'ስንት ቪዲዮዎች በ24 ሰዓት ውስጥ ተጫኑ? (የተጫኑ / የተቀረጹ)', t:'ratio',
        auto:{a:{plus:[{rows:'m_pre_list', when:{col:'vid', is:'up'}}, {rows:'m_fin_list', when:{col:'vid', is:'up'}}]},
              b:{plus:[{rows:'m_pre_list', when:{col:'vid', in:['up','rec']}}, {rows:'m_fin_list', when:{col:'vid', in:['up','rec']}}]}},
        tgt:{op:'gte', v:100, en:'Late upload is –200 Birr', am:'ዘግይቶ መጫን –200 ብር'}},
      {id:'v_uploaded_why', en:'Not uploaded yet. Why, and when will they be? (Write the customer in the box.)', am:'ገና አልተጫኑም። ለምን? መቼ ይጫናሉ? (ደንበኛውን በሳጥኑ ይጻፉ።)', t:'area',
        picks:[
          { en:'No internet',                          am:'ኢንተርኔት አልነበረም' },
          { en:'The file is too big',                  am:'ፋይሉ በጣም ትልቅ ነው' },
          { en:'No time today',                        am:'ዛሬ ጊዜ አልነበረም' },
          { en:'Will upload tomorrow',                 am:'ነገ ይጫናል' }
        ], show:{f:'v_uploaded', when:'short'}},
      /* asked every day, so on a day with no visit it was answered "no" and
         then explained ("I don't have any client visits scheduled today") —
         the question now says what a day without filming is */
      {id:'v_consent', en:'Did everyone you filmed today agree on camera first?', am:'ዛሬ የቀረጿቸው ሁሉ ከመቀረጻቸው በፊት በካሜራ ፈቅደዋል?', t:'yesno', yes:{en:'Everyone agreed, or I filmed nobody', am:'ሁሉም ፈቅደዋል ወይም ማንንም አልቀረጽኩም'}, no:{en:'I filmed someone without asking', am:'ሳይፈቅዱ የቀረጽኩት አለ'},
        quiet:1, auto:{picked:'dz_events', v:'no_consent', flip:1}},
      {id:'v_consent_why', en:'Which recording has no consent? What will be done? (Write the customer in the box.)', am:'ፈቃድ ያልተቀረጸለት የትኛው ቪዲዮ ነው? ምን ይደረጋል? (ደንበኛውን በሳጥኑ ይጻፉ።)', t:'area',
        picks:[
          { en:'Forgot to ask on camera',              am:'በካሜራ መጠየቅ ተረስቷል' },
          { en:'Agreed, but not on camera',            am:'ፈቅደዋል፤ ግን በካሜራ አይደለም' },
          { en:'Refused — the video was deleted',      am:'አልፈቀዱም — ቪዲዮው ተሰርዟል' },
          { en:'Will ask at the next visit',           am:'በሚቀጥለው ጉብኝት ይጠየቃል' }
        ], show:{f:'v_consent', when:'no'}},
      {id:'v_disc', en:'How many design discussions did you record today? (recorded / held)', am:'ዛሬ ስንት የዲዛይን ውይይቶችን ቀረጹ? (የተቀረጹ / የተካሄዱ)', t:'ratio', ask:{b:{en:"How many design discussions did you hold today?", am:"ዛሬ ስንት የዲዛይን ውይይት አካሄዱ?"}, a:{en:"How many of them did you record?", am:"ከእነሱ ስንቱን ቀረጹ?"}},
        show:{f:'dz_events', when:'has', v:'disc'}}
    ]},
    /* one row a design, where there were four counts and a two-box question */
    { en:'Designs delivered', am:'የቀረቡ ዲዛይኖች', fields:[
      {id:'d_any', en:'Did you deliver any design today?', am:'ዛሬ ዲዛይን አቀረቡ?', t:'yesno', yes:{en:'I delivered designs', am:'ዲዛይን አስረክቤያለሁ'}, no:{en:'None today', am:'ዛሬ አላስረከብኩም'}},
      {id:'d_list', en:'Each design delivered today — one row each', am:'ዛሬ የቀረበ እያንዳንዱ ዲዛይን — በረድፍ አንድ', t:'table', addEn:'Add a design', addAm:'ዲዛይን ጨምር',
        show:{f:'d_any', when:'yes'},
        cols:[
          {id:'cust', en:'Customer', am:'ደንበኛ', t:'text'},
          {id:'lc', en:'Customer code: 4-digit lead no., or KK code once paid', am:'የደንበኛ ኮድ፦ ባለ 4 አሃዝ ቁጥር፣ ከከፈሉ በኋላ KK ኮድ', t:'text'},
          {id:'kind', en:'Which design', am:'የትኛው ዲዛይን', t:'choice', opts:[
            {v:'pre', en:'Pre-design',      am:'ቅድመ ዲዛይን'},
            {v:'fin', en:'Final 3D design', am:'የመጨረሻ 3D ዲዛይን'}
          ]},
          {id:'ontime', en:'Within 24 hours of the measurement?', am:'ከልኬት በ24 ሰዓት ውስጥ?', t:'yesno', yes:{en:'Within 24 hours', am:'በ24 ሰዓት ውስጥ'}, no:{en:'Later', am:'ዘግይቷል'}},
          {id:'appr', en:'Written approval received today?', am:'ዛሬ የጽሑፍ ማጽደቅ ደርሷል?', t:'yesno', yes:{en:'Approval received', am:'ማረጋገጫ ደርሷል'}, no:{en:'Not yet', am:'ገና አልደረሰም'}}
        ]},
      {id:'d_pre', en:'How many pre-designs did you deliver today?', am:'ዛሬ ስንት ቅድመ ዲዛይኖችን አቀረቡ?', t:'num',
        auto:{rows:'d_list', when:{col:'kind', is:'pre'}}, sumEn:'pre-designs', sumAm:'ቅድመ ዲዛይኖች'},
      {id:'d_fin', en:'How many final 3D designs did you deliver today?', am:'ዛሬ ስንት የመጨረሻ 3D ዲዛይኖችን አቀረቡ?', t:'num',
        auto:{rows:'d_list', when:{col:'kind', is:'fin'}}, sumEn:'final 3D designs', sumAm:'የመጨረሻ 3D ዲዛይኖች'},
      {id:'d_approved', en:'How many written customer approvals did you receive today?', am:'ዛሬ ስንት የጽሑፍ የደንበኛ ማጽደቆች ደረሱዎት?', t:'num',
        auto:{rows:'d_list', when:{col:'appr', is:'yes'}}, sumEn:'approvals in writing', sumAm:'የጽሑፍ ማጽደቆች'},
      {id:'d_pre_ontime', en:'How many were within 24 hours of the measurement? (on time / delivered)', am:'ስንቱ ከልኬት በ24 ሰዓት ውስጥ ቀረቡ? (በሰዓቱ / የቀረቡ)', t:'ratio',
        /* only rows whose box was answered count (the bug hunt, 15 Oct 2026 — as
           for Elyas's ac_called on 11 Oct: a box left untapped was fined as a "no") */
        auto:{a:{rows:'d_list', when:[{col:'kind', is:'pre'}, {col:'ontime', is:'yes'}]},
              b:{rows:'d_list', when:[{col:'kind', is:'pre'}, {col:'ontime', in:['yes', 'no']}]}},
        tgt:{op:'gte', v:100, en:'Late is –300 Birr', am:'ዘግይቶ –300 ብር'}},
      {id:'d_pre_ontime_why', en:'Some were later than 24 hours. Why? (Write the customer in the box.)', am:'አንዳንዶቹ ከ24 ሰዓት በላይ ዘገዩ። ለምን? (ደንበኛውን በሳጥኑ ይጻፉ።)', t:'area',
        picks:[
          { en:'The customer changed what they want',  am:'ደንበኛው የሚፈልገውን ቀየረ' },
          { en:'Waiting for measurements',             am:'ልኬት እየጠበቅኩ ነበር' },
          { en:'Waiting for the material choice',      am:'የቁሳቁስ ምርጫ እየጠበቅኩ ነበር' },
          { en:'Too many designs at once',             am:'ብዙ ዲዛይኖች በአንድ ጊዜ ነበሩ' },
          { en:'Computer or software problem',         am:'የኮምፒውተር ወይም የሶፍትዌር ችግር' },
          { en:'Power cut',                            am:'መብራት ጠፋ' }
        ], show:{f:'d_pre_ontime', when:'short'}},
      {id:'d_rev_any', en:'Did any customer ask for a revision today?', am:'ዛሬ ለውጥ የጠየቀ ደንበኛ አለ?', t:'yesno', yes:{en:'Changes were asked', am:'ለውጥ ተጠይቋል'}, no:{en:'No changes asked', am:'ለውጥ አልተጠየቀም'}},
      {id:'d_rev_list', en:'Which customers, and what changed?', am:'የየትኞቹ ደንበኞች? ምን ተቀየረ?', t:'table', addEn:'Add a revision', addAm:'ለውጥ ጨምር',
        show:{f:'d_rev_any', when:'yes'},
        cols:[
          {id:'cust', en:'Customer', am:'ደንበኛ', t:'text'},
          {id:'lc', en:'Customer code: 4-digit lead no., or KK code once paid', am:'የደንበኛ ኮድ፦ ባለ 4 አሃዝ ቁጥር፣ ከከፈሉ በኋላ KK ኮድ', t:'text'},
          {id:'what', en:'What changed', am:'የተቀየረው', t:'text', picks:COL_CHANGED},
          {id:'times', en:'Revision no. for this customer', am:'ለዚህ ደንበኛ ስንተኛ ለውጥ', t:'num'}
        ]},
      {id:'d_rev', en:'How many revisions did customers ask for today?', am:'ዛሬ ደንበኞች ስንት ለውጦችን ጠየቁ?', t:'num',
        auto:{rows:'d_rev_list'}, sumEn:'revisions asked for', sumAm:'የተጠየቁ ለውጦች'},
      {id:'d_waiting', en:'How many of your designs are held up by someone else today?', am:'ከዲዛይኖችዎ ስንቱ ዛሬ በሌላ ሰው ምክንያት ቆመዋል?', t:'num', zero:1,
        show:{f:'dz_events', when:'has', v:'held'}},
      /* read by the morning brief beside every other "waiting on" answer */
      {id:'d_waiting_who', en:'Who are they waiting on? (Write the customers and since when in the box.)', am:'ማንን እየጠበቁ ነው? (ደንበኞቹንና ከመቼ ጀምሮ በሳጥኑ ይጻፉ።)', t:'area',
        picks:[
          { en:'The customer’s answer',                am:'የደንበኛው መልስ' },
          { en:'The customer’s colour or material choice', am:'የደንበኛው የቀለም ወይም የቁሳቁስ ምርጫ' },
          { en:'The salesperson',                      am:'ሻጩ' },
          { en:'Selam’s green light (payment)',        am:'የሰላም ፈቃድ (ክፍያ)' },
          { en:'Measurements',                         am:'ልኬት' },
          { en:'Production',                           am:'ምርት ክፍሉ' }
        ], show:{f:'d_waiting', when:'pos'}}
    ]},
    { en:'Material selection', am:'የቁሳቁስ ምርጫ', fields:[
      {id:'ms_any', en:'Was any Material Selection Form signed today?', am:'ዛሬ የተፈረመ የቁሳቁስ ምርጫ ፎርም አለ?', t:'yesno', yes:{en:'Forms were signed', am:'ፎርም ተፈርሟል'}, no:{en:'None today', am:'ዛሬ አልተፈረመም'}},
      {id:'ms_list', en:'Which jobs?', am:'የየትኞቹ ሥራዎች?', t:'table', addEn:'Add a job', addAm:'ሥራ ጨምር',
        show:{f:'ms_any', when:'yes'}, cols:[
          {id:'cust', en:'Customer', am:'ደንበኛ', t:'text'},
          {id:'code', en:'Job code', am:'የሥራ ኮድ', t:'text'},
          {id:'opt', en:'Option signed', am:'የተፈረመው አማራጭ', t:'choice', opts:[{v:'A', en:'Option A (stock)', am:'አማራጭ A (በመጋዘን ያለ)'}, {v:'B', en:'Option B (imported)', am:'አማራጭ B (ከውጭ የሚመጣ)'}]},
          /* the colours on the signed form, by picture (the Chairman, 13 Oct 2026): the register
             shows them on the job, and a colour bought or received for it that is neither is said */
          {id:'front', en:'Fronts colour (doors, drawers)', am:'የፊት ቀለም (በሮች፣ መሳቢያዎች)', t:'colour', must:1},
          {id:'body', en:'Cabinet body colour', am:'የካቢኔው አካል ቀለም', t:'colour', must:1},
          {id:'photo', en:'Photo posted in the WhatsApp group?', am:'ፎቶ በዋትስአፕ ግሩፕ ተልኳል?', t:'yesno', yes:{en:'Posted', am:'ተልኳል'}, no:{en:'Not posted', am:'አልተላከም'}},
          {id:'codes', en:'Board and PVC edge codes in the Job File?', am:'የቦርድና የPVC ጠርዝ ኮዶች በሥራ ፋይሉ አሉ?', t:'yesno', yes:{en:'The codes are in', am:'ኮዶቹ አሉ'}, no:{en:'Missing', am:'ኮዶቹ የሉም'}}
        ]},
      {id:'ms_signed', en:'How many Material Selection Forms were physically signed today?', am:'ዛሬ ስንት የቁሳቁስ ምርጫ ፎርሞች በእጅ ተፈረሙ?', t:'num',
        auto:{rows:'ms_list'}, sumEn:'forms signed', sumAm:'የተፈረሙ ፎርሞች'},
      {id:'ms_a', en:'How many customers chose Option A (stock)?', am:'ስንት ደንበኞች አማራጭ A (በመጋዘን ያለ) መረጡ?', t:'num',
        auto:{rows:'ms_list', when:{col:'opt', is:'A'}}, sumEn:'chose Option A', sumAm:'አማራጭ A መረጡ'},
      {id:'ms_b', en:'How many customers chose Option B (imported)?', am:'ስንት ደንበኞች አማራጭ B (ከውጭ የሚመጣ) መረጡ?', t:'num',
        auto:{rows:'ms_list', when:{col:'opt', is:'B'}}, sumEn:'chose Option B', sumAm:'አማራጭ B መረጡ'},
      {id:'ms_photo', en:'How many signed forms have a photo in the WhatsApp group? (posted / signed)', am:'ከተፈረሙት ስንቱ ፎቶ በዋትስአፕ ግሩፕ ተልኳል? (የተላኩ / የተፈረሙ)', t:'ratio',
        auto:{a:{rows:'ms_list', when:{col:'photo', is:'yes'}}, b:{rows:'ms_list'}},
        tgt:{op:'gte', v:100, en:'Missing photo is –200 Birr and loses 0.3%',
             am:'ፎቶ ካልተላከ –200 ብር እና 0.3% ያሳጣል'}},
      {id:'ms_photo_why', en:'Some signed forms have no photo yet. Why? (Write the customer in the box.)', am:'አንዳንድ የተፈረሙ ፎርሞች ፎቶ ገና አልተላከም። ለምን? (ደንበኛውን በሳጥኑ ይጻፉ።)', t:'area',
        picks:[
          { en:'Forgot',                               am:'ተረስቷል' },
          { en:'No signal or no data',                 am:'ኔትወርክ ወይም ዳታ አልነበረም' },
          { en:'The customer group is not set up',     am:'የደንበኛው ግሩፕ ገና አልተከፈተም' },
          { en:'Will post it tomorrow',                am:'ነገ ይላካል' }
        ], show:{f:'ms_photo', when:'short'}},
      {id:'ms_codes', en:'Are the board and PVC edge codes confirmed in every Job File?', am:'የቦርድና የPVC ጠርዝ ኮዶች በእያንዳንዱ የሥራ ፋይል ተረጋግጠዋል?', t:'yesno',
        yes:{en:'All confirmed', am:'ሁሉም ተረጋግጠዋል'}, no:{en:'Some are not', am:'ያልተረጋገጠ አለ'},
        auto:{all:'ms_list.codes'}},
      {id:'ms_codes_why', en:'Some Job Files are missing codes. When will they be confirmed? (Write the job in the box.)', am:'አንዳንድ የሥራ ፋይሎች ኮድ ጎድሏቸዋል። መቼ ይረጋገጣሉ? (ሥራውን በሳጥኑ ይጻፉ።)', t:'area',
        picks:[
          { en:'The customer has not chosen the colour', am:'ደንበኛው ቀለሙን ገና አልመረጠም' },
          { en:'The code is not known yet (store or supplier)', am:'ኮዱ ገና አልታወቀም (መጋዘን ወይም አቅራቢ)' },
          { en:'Waiting for the imported option',      am:'ከውጭ የሚመጣውን እየጠበቅን ነው' },
          { en:'Will add it tomorrow',                 am:'ነገ ይጨመራል' }
        ], show:{f:'ms_codes', when:'no'}}
    ]},
    { en:'Designer Profile and drawings', am:'የዲዛይነር ፕሮፋይልና ሥዕሎች', fields:[
      {id:'dp_done', en:'How many Designer Profiles are complete? (complete / needed before approval)', am:'ስንት የዲዛይነር ፕሮፋይሎች ተሞልተዋል? (የተሞሉ / ከማጽደቅ በፊት የሚያስፈልጉ)', t:'ratio', ask:{b:{en:"How many designs went for approval today?", am:"ዛሬ ስንት ዲዛይን ለማጽደቅ ቀረበ?"}, a:{en:"For how many of them is the Designer Profile complete?", am:"ከእነሱ የስንቱ የዲዛይነር ፕሮፋይል ተሞልቷል?"}},
        show:{f:'dz_events', when:'has', v:'profile'},
        tgt:{op:'gte', v:100, en:'Missing is –300 Birr and loses the final design commission',
             am:'ካልተሞላ –300 ብር እና የመጨረሻ ዲዛይን ኮሚሽንን ያሳጣል'}},
      {id:'dp_done_why', en:'Some profiles are not complete. When will they be? (Write the customers in the box.)', am:'አንዳንድ ፕሮፋይሎች አልተሟሉም። መቼ ይሟላሉ? (ደንበኞቹን በሳጥኑ ይጻፉ።)', t:'area',
        picks:[
          { en:'Could not reach the customer',         am:'ደንበኛው አልተገኘም' },
          { en:'The customer has not answered everything', am:'ደንበኛው ሁሉንም ገና አልመለሰም' },
          { en:'No time today',                        am:'ዛሬ ጊዜ አልነበረም' },
          { en:'Will finish it tomorrow',              am:'ነገ ይሟላል' }
        ], show:{f:'dp_done', when:'short'}},
      {id:'pd_sub', en:'How many production drawings did you give Mahelet and Amaha today?', am:'ዛሬ ለማህሌትና ለአማሃ ስንት የምርት ሥዕሎችን ሰጡ?', t:'num', zero:1,
        show:{f:'dz_events', when:'has', v:'drawings'}},
      /* asked on a day a drawing went over (11 Oct 2026): with none there is
         no checklist to ask about, and nothing reads the answer then */
      {id:'pd_check', en:'Was the Production Drawing Checklist completed for every drawing?', am:'ለእያንዳንዱ ሥዕል የምርት ሥዕል ማረጋገጫ ዝርዝር ተሞልቷል?', t:'yesno', yes:{en:'Done for all', am:'ለሁሉም ተሞልቷል'}, no:{en:'Not for all', am:'ለሁሉም አልተሞላም'},
        show:{f:'pd_sub', when:'pos'}},
      {id:'pd_check_why', en:'Some drawings went without it. Why? (Write the job in the box.)', am:'አንዳንድ ሥዕሎች ያለ ማረጋገጫ ዝርዝር ሄደዋል። ለምን? (ሥራውን በሳጥኑ ይጻፉ።)', t:'area',
        picks:[
          { en:'The drawing was urgent',               am:'ሥዕሉ አስቸኳይ ነበር' },
          { en:'The checklist was not at hand',        am:'ማረጋገጫ ዝርዝሩ በእጄ አልነበረም' },
          { en:'Forgot',                               am:'ተረስቷል' },
          { en:'Will complete it tomorrow',            am:'ነገ ይሞላል' }
        ], show:{f:'pd_check', when:'no'}},
      {id:'pd_err', en:'How many drawings had a material code error?', am:'ስንት ሥዕሎች የቁሳቁስ ኮድ ስህተት ነበራቸው?', t:'num', zero:1,
        show:{f:'dz_events', when:'has', v:'code_err'},
        tgt:{op:'lte', v:0, en:'–500 Birr each', am:'እያንዳንዱ –500 ብር'}},
      {id:'pd_err_what', en:'What was wrong, and is it corrected? (Write the job and who found it in the box.)', am:'ስህተቱ ምን ነበር? ተስተካክሏል? (ሥራውንና ማን እንዳገኘው በሳጥኑ ይጻፉ።)', t:'area',
        picks:[
          { en:'Wrong board code',                     am:'የተሳሳተ የሰሌዳ ኮድ' },
          { en:'Wrong edge (PVC) code',                am:'የተሳሳተ የጠርዝ (PVC) ኮድ' },
          { en:'Wrong size',                           am:'የተሳሳተ መጠን' },
          { en:'Corrected',                            am:'ተስተካክሏል' },
          { en:'Not corrected yet',                    am:'ገና አልተስተካከለም' }
        ], show:{f:'pd_err', when:'pos'}}
    ]},
    { en:'Complaints assigned to you', am:'ለእርስዎ የተመደቡ ቅሬታዎች', fields:[
      {id:'cp_any', en:'Is any design complaint assigned to you?', am:'ለእርስዎ የተመደበ የዲዛይን ቅሬታ አለ?', t:'yesno', yes:{en:'I have complaints', am:'ቅሬታ አለብኝ'}, no:{en:'None', am:'ቅሬታ የለብኝም'}},
      {id:'cp_list', en:'Which complaints?', am:'የትኞቹ ቅሬታዎች?', t:'table', addEn:'Add a complaint', addAm:'ቅሬታ ጨምር',
        show:{f:'cp_any', when:'yes'},
        cols:[
          {id:'cust', en:'Customer', am:'ደንበኛ', t:'text'},
          {id:'code', en:'Job code', am:'የሥራ ኮድ', t:'text'},
          {id:'what', en:'Complaint', am:'ቅሬታው', t:'text', picks:COL_COMPLAINT},
          {id:'days', en:'Days open', am:'የቆየበት ቀን', t:'num'}
        ]},
      {id:'cp_assigned', en:'How many design complaints are assigned to you?', am:'ስንት የዲዛይን ቅሬታዎች ለእርስዎ ተመድበዋል?', t:'num',
        auto:{rows:'cp_list'}, sumEn:'complaints', sumAm:'ቅሬታዎች'},
      /* asked only when a complaint is assigned (11 Oct 2026). The week
         reads the last of them: on a day with none, the two counts file 0
         (zero:1), so the week does not keep an older figure; the two-box
         ones are left unanswered, as a day with no complaint has none to
         contact. */
      {id:'cp_24', en:'How many of those customers were contacted within 24 hours? (contacted / assigned)', am:'ከእነዚህ ስንት ደንበኞች በ24 ሰዓት ውስጥ ተደወለላቸው? (የተደወለላቸው / የተመደቡ)', t:'ratio', ask:{b:{en:"How many complaints are assigned to you?", am:"ስንት ቅሬታዎች ለእርስዎ ተመድበዋል?"}, a:{en:"How many of those customers were contacted within 24 hours?", am:"ከእነሱ ስንቱ ደንበኛ በ24 ሰዓት ውስጥ ተደወለላቸው?"}}, auto:{b:{rows:'cp_list'}},
        show:{f:'cp_any', when:'yes'},
        tgt:{op:'gte', v:100, en:'Missing is –300 Birr', am:'ካልተደወለ –300 ብር'}},
      {id:'cp_24_why', en:'Some were not contacted in time. Why? (Write who in the box.)', am:'አንዳንዶቹ በሰዓቱ አልተደወለላቸውም። ለምን? (ማን እንደሆነ በሳጥኑ ይጻፉ።)', t:'area',
        picks:[
          { en:'The customer did not answer',          am:'ደንበኛው ስልክ አላነሳም' },
          { en:'The complaint reached me late',        am:'ቅሬታው ዘግይቶ ደረሰኝ' },
          { en:'Out on visits all day',                am:'ቀኑን ሙሉ በጉብኝት ላይ ነበርኩ' },
          { en:'Will call tomorrow',                   am:'ነገ ይደወላል' }
        ], show:{f:'cp_24', when:'short'}},
      {id:'cp_48', en:'How many got a proposed solution within 48 hours? (proposed / assigned)', am:'ስንቱ በ48 ሰዓት ውስጥ መፍትሔ ቀረበላቸው? (የቀረበላቸው / የተመደቡ)', t:'ratio', ask:{b:{en:"How many complaints are assigned to you?", am:"ስንት ቅሬታዎች ለእርስዎ ተመድበዋል?"}, a:{en:"How many of them got a proposed solution within 48 hours?", am:"ከእነሱ ስንቱ በ48 ሰዓት ውስጥ መፍትሔ ቀረበላቸው?"}}, auto:{b:{rows:'cp_list'}},
        show:{f:'cp_any', when:'yes'},
        tgt:{op:'gte', v:100, en:'Missing is –500 Birr', am:'ካልቀረበ –500 ብር'}},
      /* read by the morning brief beside every other "waiting on" answer */
      {id:'cp_48_why', en:'No solution yet. What is holding it up? (Write the job in the box.)', am:'መፍትሔ ገና አልቀረበም። ምን ያዘው? (ሥራውን በሳጥኑ ይጻፉ።)', t:'area',
        picks:[
          { en:'Waiting for production',               am:'ምርት ክፍሉን እየጠበቅን ነው' },
          { en:'Waiting for a material or accessory',  am:'ዕቃ ወይም መለዋወጫ እየጠበቅን ነው' },
          { en:'Waiting for the customer to decide',   am:'የደንበኛውን ውሳኔ እየጠበቅን ነው' },
          { en:'A site visit is needed',               am:'ቦታው ላይ መሄድ ያስፈልጋል' },
          { en:'Waiting for Ephrata',                  am:'ኤፍራታን እየጠበቅን ነው' }
        ], show:{f:'cp_48', when:'short'}},
      {id:'cp_res', en:'How many complaints did you resolve today? (0 if none.)', am:'ዛሬ ስንት ቅሬታዎችን ፈቱ? (ከሌለ 0።)', t:'num', zero:1,
        show:{f:'cp_any', when:'yes'}},
      {id:'cp_out', en:'How many are still open? (0 if none.)', am:'ስንቱ ገና አልተፈቱም? (ከሌለ 0።)', t:'num', zero:1,
        show:{f:'cp_any', when:'yes'},
        tgt:{op:'lte', v:0, en:'Past 7 days is –1,000 Birr and the rest of that commission',
             am:'ከ7 ቀን በላይ –1,000 ብር እና የቀረው ኮሚሽን'}},
      {id:'cp_out_what', en:'What is blocking them, and by what day will each be resolved? (Write the job and the day in the box.)', am:'ምን ያዛቸው? እያንዳንዱ በየትኛው ቀን ይፈታል? (ሥራውንና ቀኑን በሳጥኑ ይጻፉ።)', t:'area',
        picks:[
          { en:'Waiting for production',               am:'ምርት ክፍሉን እየጠበቅን ነው' },
          { en:'Waiting for a material or accessory',  am:'ዕቃ ወይም መለዋወጫ እየጠበቅን ነው' },
          { en:'Waiting for the customer to decide',   am:'የደንበኛውን ውሳኔ እየጠበቅን ነው' },
          { en:'A site visit is needed',               am:'ቦታው ላይ መሄድ ያስፈልጋል' },
          { en:'Waiting for Ephrata',                  am:'ኤፍራታን እየጠበቅን ነው' }
        ], show:{f:'cp_out', when:'pos'}}
    ]},
    { en:'WhatsApp', am:'ዋትስአፕ', fields:[
      {id:'wd_stage', en:'How many design stage messages were posted? (posted / due)', am:'ስንት የዲዛይን ደረጃ መልዕክቶች ተላኩ? (የተላኩ / የሚገባው)', t:'ratio', ask:{b:{en:"How many design stage messages were due today?", am:"ዛሬ ስንት የዲዛይን ደረጃ መልዕክት መላክ ነበረበት?"}, a:{en:"How many of them were posted?", am:"ከእነሱ ስንቱ ተላከ?"}},
        tgt:{op:'gte', v:100, en:'A missed message loses that stage’s commission',
             am:'ያልተላከ መልዕክት የዚያን ደረጃ ኮሚሽን ያሳጣል'}},
      {id:'wd_stage_why', en:'A stage message was missed. Why? (Write the customer and the stage in the box.)', am:'የደረጃ መልዕክት ቀርቷል። ለምን? (ደንበኛውንና ደረጃውን በሳጥኑ ይጻፉ።)', t:'area',
        picks:[
          { en:'Forgot to post',                       am:'መላክ ተረስቷል' },
          { en:'Waiting for the customer’s approval',  am:'የደንበኛውን ማጽደቅ እየጠበቅኩ ነው' },
          { en:'The customer group is not set up',     am:'የደንበኛው ግሩፕ ገና አልተከፈተም' },
          { en:'No signal or no data',                 am:'ኔትወርክ ወይም ዳታ አልነበረም' }
        ], show:{f:'wd_stage', when:'short'}},
      {id:'wd_sum', en:'How many Design Discussion Summaries did you post?', am:'ስንት የውይይት ማጠቃለያዎችን ላኩ?', t:'num', zero:1,
        show:{f:'dz_events', when:'has', v:'summary'}},
      {id:'wd_unans', en:'How many customer messages waited more than 2 hours for an answer?', am:'ስንት የደንበኛ መልዕክቶች ከ2 ሰዓት በላይ ምላሽ ሳያገኙ ቆዩ?', t:'num', zero:1,
        show:{f:'dz_events', when:'has', v:'wa_slow'},
        tgt:{op:'lte', v:0, en:'–200 Birr each', am:'እያንዳንዱ –200 ብር'}},
      {id:'wd_unans_why', en:'Why did they wait? Are they answered now? (Write the customers in the box.)', am:'ለምን ቆዩ? አሁን ምላሽ አግኝተዋል? (ደንበኞቹን በሳጥኑ ይጻፉ።)', t:'area',
        picks:[
          { en:'I was on a site visit',                am:'በልኬት ጉብኝት ላይ ነበርኩ' },
          { en:'Phone off or no data',                 am:'ስልኩ ጠፍቶ ወይም ዳታ አልነበረም' },
          { en:'Did not see the message',              am:'መልዕክቱን አላየሁትም' },
          { en:'Needed an answer from someone else',   am:'ከሌላ ሰው መልስ እየጠበቅኩ ነበር' },
          { en:'Answered now',                         am:'አሁን ምላሽ ተሰጥቷል' }
        ], show:{f:'wd_unans', when:'pos'}},
      {id:'wd_comp', en:'How many customers complained about design communication?', am:'ስንት ደንበኞች ስለ ዲዛይን ግንኙነታችን ቅሬታ አቀረቡ?', t:'num', zero:1,
        show:{f:'dz_events', when:'has', v:'wa_comp'},
        tgt:{op:'lte', v:0, en:'–1,000 Birr each', am:'እያንዳንዱ –1,000 ብር'}},
      {id:'wd_comp_what', en:'What was the complaint, and what was done? (Write who in the box.)', am:'ቅሬታው ምን ነበር? ምን ተደረገ? (ማን እንደሆነ በሳጥኑ ይጻፉ።)', t:'area',
        picks:[
          { en:'Design not ready on time',             am:'ዲዛይኑ በሰዓቱ አልደረሰም' },
          { en:'Design not as agreed',                 am:'ዲዛይኑ እንደተስማማነው አልሆነም' },
          { en:'Measurement late',                     am:'ልኬቱ ዘገየ' },
          { en:'No reply to messages',                 am:'ለመልዕክት ምላሽ አልተሰጠም' },
          { en:'Apologised and gave a new date',       am:'ይቅርታ ተጠይቆ አዲስ ቀን ተሰጠ' },
          { en:'Passed to Ephrata',                    am:'ለኤፍራታ ተላልፏል' }
        ], show:{f:'wd_comp', when:'pos'}}
    ]},
    /* what the designers typed in their first reports, as buttons: a
       delivery late, an accessory missing, the customer changing the
       material, production */
    { en:'Problems and help', am:'ችግርና እርዳታ', fields:[
      {id:'problem', en:'What was the biggest problem today?', am:'የዛሬው ትልቁ ችግር ምን ነበር?', t:'area', opt:1,
        picks:[
          { en:'No big problem today',                 am:'ዛሬ ትልቅ ችግር አልነበረም' },
          { en:'The customer keeps changing the design', am:'ደንበኛው ዲዛይኑን ደጋግሞ ይቀይራል' },
          { en:'Waiting for measurements',             am:'ልኬት እየጠበቅኩ ነው' },
          { en:'Waiting for the customer’s colour or material choice', am:'የደንበኛውን የቀለም ወይም የቁሳቁስ ምርጫ እየጠበቅኩ ነው' },
          { en:'Price or proforma not agreed',         am:'በዋጋ ወይም በፕሮፎርማ ላይ ስምምነት የለም' },
          { en:'Delivery or production is late',       am:'ማስረከቢያ ወይም ምርት ዘግይቷል' },
          { en:'A material or accessory is missing',   am:'ዕቃ ወይም መለዋወጫ ጎድሏል' },
          { en:'Computer or power problem',            am:'የኮምፒውተር ወይም የመብራት ችግር' }
        ]},
      {id:'need_help', en:'What do you need, and from whom?', am:'ምን ያስፈልግዎታል? ከማን?', t:'area', opt:1,
        picks:[
          { en:'Nothing needed',                       am:'ምንም አያስፈልግም', nil:1 },
          { en:'Measurements booked (Ephrata)',        am:'የልኬት ቀጠሮ (ኤፍራታ)' },
          { en:'An answer from the customer (salesperson)', am:'የደንበኛ መልስ (ሻጭ)' },
          { en:'Selam’s green light (payment)',        am:'የሰላም ፈቃድ (ክፍያ)' },
          { en:'Production dates (Mahelet)',           am:'የምርት ቀን (ማህሌት)' },
          { en:'Material or accessory codes (store)',  am:'የዕቃ ወይም የመለዋወጫ ኮድ (መጋዘን)' },
          { en:'A better computer or software',        am:'የተሻለ ኮምፒውተር ወይም ሶፍትዌር' }
        ]},
      {id:'need_lead', en:'Do you need a decision from Ephrata?', am:'የኤፍራታ ውሳኔ ያስፈልግዎታል?', t:'yesno', yes:{en:'I need a decision', am:'ውሳኔ ያስፈልገኛል'}, no:{en:'No decision needed', am:'ውሳኔ አያስፈልገኝም'}},
      /* empty every time it opened: it asked three things at once */
      {id:'need_lead_what', en:'What should Ephrata decide? (Write the customer and by when in the box.)', am:'ኤፍራታ ምን እንድትወስን ይፈልጋሉ? (ደንበኛውንና እስከ መቼ እንደሆነ በሳጥኑ ይጻፉ።)', t:'area',
        picks:[
          { en:'Approve a design change',              am:'የዲዛይን ለውጥ እንድታጸድቅ' },
          { en:'A price or discount',                  am:'ዋጋ ወይም ቅናሽ' },
          { en:'Who takes a job',                      am:'ሥራውን ማን እንደሚይዘው' },
          { en:'Chase the customer for an answer',     am:'ደንበኛው መልስ እንዲሰጥ እንድትከታተል' },
          { en:'Chase production for a date',          am:'ምርት ክፍሉ ቀን እንዲሰጥ እንድትከታተል' },
          { en:'Settle a complaint',                   am:'ቅሬታ እንድትፈታ' }
        ], show:{f:'need_lead', when:'yes'}}
    ]},
    { en:'Tomorrow', am:'ነገ', fields:[
      {id:'p1', en:'What comes first tomorrow? (A customer name or code is enough.)', am:'ነገ መጀመሪያ የሚሠራው ምንድን ነው? (የደንበኛ ስም ወይም ኮድ በቂ ነው።)', t:'text', from:['m_pre_list.cust', 'm_fin_list.cust', 'd_list.cust'], recent:1},
      {id:'p2', en:'And second?', am:'ሁለተኛው?', t:'text', from:['m_pre_list.cust', 'm_fin_list.cust', 'd_list.cust'], recent:1, opt:1},
      {id:'p3', en:'And third?', am:'ሦስተኛው?', t:'text', from:['m_pre_list.cust', 'm_fin_list.cust', 'd_list.cust'], recent:1, opt:1}
    ]}
  ]
};

const DESIGN_WEEKLY = {
  id:'design-weekly', cadence:'weekly', built:1, dueTime:'16:00', dueDay:6,
  en:'Weekly Design Summary', am:'ሳምንታዊ የዲዛይን ማጠቃለያ',
  toEn:'Ephrata', toAm:'ኤፍራታ',
  dueEn:'Saturday 4:00 PM', dueAm:'ቅዳሜ ከቀኑ 10፡00 (4:00 PM)',
  penEn:'Late or not sent –500 Birr', penAm:'ዘግይቶ ወይም ካልቀረበ –500 ብር',
  sections:[
    /* LIGHT TOUCH, 11 Oct 2026. The two weekly reports filed left 14–16% of
       the questions blank, and what was left was the "why" boxes and the two
       "what score do you expect this month" guesses (one answered "none").
       The reasons are buttons now, with a box for the customer's name; the
       two expected scores are optional — nothing reads them, and nobody
       keeps them during the week; next week's top three say a name is
       enough. Every figure and every answer key is as it was. */
    /* THE WEEK ADDS ITSELF UP. Every figure here was in the six daily
       reports this designer already filed, and asking for it again was
       asking the same question seven times (the Chairman, 9 Oct 2026).
       The form fetches those reports and adds them; what is left to answer
       is the judgement — what went wrong, what is planned, what is needed. */
    { en:'Measurements', am:'ልኬቶች', fields:[
      {id:'wm_pre', en:'How many pre-measurements did you do this week?', am:'በዚህ ሳምንት ስንት ቅድመ ልኬቶችን አደረጉ?', t:'num',
        auto:{week:'m_pre'}},
      {id:'wm_fin', en:'How many final measurements did you do this week?', am:'በዚህ ሳምንት ስንት የመጨረሻ ልኬቶችን አደረጉ?', t:'num',
        auto:{week:'m_fin'}},
      {id:'wm_ontime', en:'How many measurements were on time? (on time / done)', am:'ስንቱ ልኬቶች በሰዓቱ ተደረጉ? (በሰዓቱ / የተደረጉ)', t:'ratio',
        auto:{a:{plus:[{week:'m_pre_ontime__a'}, {week:'m_fin_ontime__a'}]},
              b:{plus:[{week:'m_pre_ontime__b'}, {week:'m_fin_ontime__b'}]}}},
      {id:'wm_ontime_why', en:'Some measurements were late. Why? (Write the customer in the box.)', am:'አንዳንድ ልኬቶች ዘገዩ። ለምን? (ደንበኛውን በሳጥኑ ይጻፉ።)', t:'area', auto:{weekText:'m_pre_ontime_why', from:'design-daily'},
        picks:[
          { en:'The customer was not available',       am:'ደንበኛው አልተገኘም' },
          { en:'The customer changed the day',         am:'ደንበኛው ቀኑን ቀየረ' },
          { en:'The site was not ready',               am:'ቦታው ዝግጁ አልነበረም' },
          { en:'Waiting for Selam’s green light',      am:'የሰላምን ፈቃድ እየጠበቅኩ ነበር' },
          { en:'Too many visits',                      am:'ብዙ ጉብኝቶች ነበሩ' },
          { en:'No transport',                         am:'ትራንስፖርት አልነበረም' }
        ], show:{f:'wm_ontime', when:'short'}},
      {id:'wm_lead', en:'On average, how many hours from a new lead to the pre-measurement? (Your best guess is fine.)', am:'ደንበኛው ከመጣ እስከ ቅድመ ልኬት በአማካይ ስንት ሰዓት ፈጀ? (ግምትዎ በቂ ነው።)', t:'num',
        tgt:{op:'lte', v:48, en:'Must be within 48 hours', am:'በ48 ሰዓት ውስጥ መሆን አለበት'}},
      {id:'wm_lead_why', en:'Over 48 hours. What is slowing the first visit down?', am:'ከ48 ሰዓት በላይ ነው። የመጀመሪያውን ጉብኝት ምን እያዘገየው ነው?', t:'area',
        picks:[
          { en:'Leads reach me late',                  am:'ደንበኞች ዘግይተው ይደርሱኛል' },
          { en:'Customers are not available',          am:'ደንበኞች አይገኙም' },
          { en:'Too many visits',                      am:'ብዙ ጉብኝቶች ነበሩ' },
          { en:'No transport',                         am:'ትራንስፖርት አልነበረም' },
          { en:'Sites are far away',                   am:'ቦታዎቹ ሩቅ ናቸው' }
        ], show:{f:'wm_lead', when:'miss'}}
    ]},
    { en:'Designs', am:'ዲዛይኖች', fields:[
      {id:'wd_pre', en:'How many pre-designs did you deliver this week?', am:'በዚህ ሳምንት ስንት ቅድመ ዲዛይኖችን አቀረቡ?', t:'num',
        auto:{week:'d_pre'}},
      {id:'wd_fin', en:'How many final 3D designs did you deliver this week?', am:'በዚህ ሳምንት ስንት የመጨረሻ 3D ዲዛይኖችን አቀረቡ?', t:'num',
        auto:{week:'d_fin'}},
      {id:'wd_ontime', en:'How many designs were on time? (on time / delivered)', am:'ስንቱ ዲዛይኖች በሰዓቱ ቀረቡ? (በሰዓቱ / የቀረቡ)', t:'ratio',
        auto:{a:{week:'d_pre_ontime__a'}, b:{week:'d_pre_ontime__b'}}},
      {id:'wd_ontime_why', en:'Some designs were late. Why? (Write the customer in the box.)', am:'አንዳንድ ዲዛይኖች ዘገዩ። ለምን? (ደንበኛውን በሳጥኑ ይጻፉ።)', t:'area', auto:{weekText:'d_pre_ontime_why', from:'design-daily'},
        picks:[
          { en:'The customer changed what they want',  am:'ደንበኛው የሚፈልገውን ቀየረ' },
          { en:'Waiting for measurements',             am:'ልኬት እየጠበቅኩ ነበር' },
          { en:'Waiting for the material choice',      am:'የቁሳቁስ ምርጫ እየጠበቅኩ ነበር' },
          { en:'Too many designs at once',             am:'ብዙ ዲዛይኖች በአንድ ጊዜ ነበሩ' },
          { en:'Computer or software problem',         am:'የኮምፒውተር ወይም የሶፍትዌር ችግር' },
          { en:'Power cut',                            am:'መብራት ጠፋ' }
        ], show:{f:'wd_ontime', when:'short'}},
      {id:'wd_rev', en:'How many revisions did customers ask for this week?', am:'በዚህ ሳምንት ደንበኞች ስንት ለውጦችን ጠየቁ?', t:'num',
        auto:{week:'d_rev'}},
      {id:'wd_rev_why', en:'Why did customers ask for changes? (Write who asked more than once in the box.)', am:'ደንበኞች ለምን ለውጥ ጠየቁ? (ከአንድ ጊዜ በላይ የጠየቁትን በሳጥኑ ይጻፉ።)', t:'area',
        picks:[
          { en:'Changed their mind on colour or material', am:'የቀለም ወይም የቁሳቁስ ሐሳባቸውን ቀየሩ' },
          { en:'Changed the layout or size',           am:'አቀማመጡን ወይም መጠኑን ቀየሩ' },
          { en:'The price was too high',               am:'ዋጋው ውድ ሆነባቸው' },
          { en:'The first design was not clear',       am:'የመጀመሪያው ዲዛይን ግልጽ አልነበረም' },
          { en:'The measurement was wrong',            am:'ልኬቱ ተሳስቶ ነበር' }
        ], show:{f:'wd_rev', when:'pos'}}
    ]},
    { en:'Videos', am:'ቪዲዮዎች', fields:[
      {id:'wv_pre', en:'How many pre-measurement videos were recorded? (recorded / visits)', am:'ስንት የቅድመ ልኬት ቪዲዮዎች ተቀረጹ? (የተቀረጹ / ጉብኝቶች)', t:'ratio',
        auto:{a:{week:'v_pre_rec__a'}, b:{week:'v_pre_rec__b'}}},
      {id:'wv_pre_why', en:'Some visits have no video. Why? (Write the customer in the box.)', am:'አንዳንድ ጉብኝቶች ቪዲዮ የላቸውም። ለምን? (ደንበኛውን በሳጥኑ ይጻፉ።)', t:'area', auto:{weekText:'v_pre_rec_why', from:'design-daily'},
        picks:[
          { en:'The customer did not agree to filming', am:'ደንበኛው መቀረጽ አልፈቀደም' },
          { en:'Phone battery or memory ran out',      am:'የስልኩ ባትሪ ወይም ሜሞሪ አለቀ' },
          { en:'Forgot to film',                       am:'መቅረጽ ተረስቷል' },
          { en:'Too dark, or no room to film',         am:'ጨለማ ነበር ወይም ለመቅረጽ ቦታ አልነበረም' },
          { en:'Someone else did the visit',           am:'ጉብኝቱን ሌላ ሰው አደረገው' }
        ], show:{f:'wv_pre', when:'short'}},
      {id:'wv_fin', en:'How many final measurement videos were recorded? (recorded / measurements)', am:'ስንት የመጨረሻ ልኬት ቪዲዮዎች ተቀረጹ? (የተቀረጹ / ልኬቶች)', t:'ratio',
        auto:{a:{week:'v_fin_rec__a'}, b:{week:'v_fin_rec__b'}}},
      {id:'wv_fin_why', en:'Some measurements have no video. Why? (Write the customer in the box.)', am:'አንዳንድ ልኬቶች ቪዲዮ የላቸውም። ለምን? (ደንበኛውን በሳጥኑ ይጻፉ።)', t:'area', auto:{weekText:'v_fin_rec_why', from:'design-daily'},
        picks:[
          { en:'The customer did not agree to filming', am:'ደንበኛው መቀረጽ አልፈቀደም' },
          { en:'Phone battery or memory ran out',      am:'የስልኩ ባትሪ ወይም ሜሞሪ አለቀ' },
          { en:'Forgot to film',                       am:'መቅረጽ ተረስቷል' },
          { en:'Too dark, or no room to film',         am:'ጨለማ ነበር ወይም ለመቅረጽ ቦታ አልነበረም' },
          { en:'Someone else did the visit',           am:'ጉብኝቱን ሌላ ሰው አደረገው' }
        ], show:{f:'wv_fin', when:'short'}},
      {id:'wv_up', en:'How many of the week’s videos went up within 24 hours? (uploaded / recorded)', am:'ከሳምንቱ ቪዲዮዎች ስንቱ በ24 ሰዓት ውስጥ ተጫኑ? (የተጫኑ / የተቀረጹ)', t:'ratio',
        auto:{a:{week:'v_uploaded__a'}, b:{week:'v_uploaded__b'}}},
      {id:'wv_disc', en:'How many design discussions were recorded? (recorded / held)', am:'ስንት የዲዛይን ውይይቶች ተቀረጹ? (የተቀረጹ / የተካሄዱ)', t:'ratio',
        auto:{a:{week:'v_disc__a'}, b:{week:'v_disc__b'}}},
      /* a guess at a score given out once a month; nothing reads the guess,
         and one report answered "none" (11 Oct 2026) */
      {id:'wv_audit', en:'What Video Quality Audit score do you expect this month? (%, if you know it)', am:'በዚህ ወር ስንት የቪዲዮ ጥራት ኦዲት ውጤት ይጠብቃሉ? (%፣ ካወቁ)', t:'pct', opt:1,
        tgt:{op:'gte', v:90, en:'≥90% earns 1,000 Birr; below 60% is –1,500 Birr',
             am:'≥90% 1,000 ብር፤ ከ60% በታች –1,500 ብር'}},
      {id:'wv_audit_why', en:'Below 90%. What will you fix to raise it?', am:'ከ90% በታች ነው። ከፍ ለማድረግ ምን ያስተካክላሉ?', t:'area',
        picks:[
          { en:'Film the full time (3–5 / 5–8 min)',   am:'ሙሉውን ጊዜ መቅረጽ (3–5 / 5–8 ደቂቃ)' },
          { en:'Better light and sound',               am:'የተሻለ ብርሃንና ድምፅ' },
          { en:'Show every wall and corner',           am:'እያንዳንዱን ግድግዳና ጥግ ማሳየት' },
          { en:'Ask consent on camera every time',     am:'ሁልጊዜ በካሜራ ፈቃድ መጠየቅ' },
          { en:'Upload within 24 hours',               am:'በ24 ሰዓት ውስጥ መጫን' }
        ], show:{f:'wv_audit', when:'miss'}}
    ]},
    { en:'Material selection', am:'የቁሳቁስ ምርጫ', fields:[
      {id:'wms_signed', en:'How many Material Selection Forms were signed this week?', am:'በዚህ ሳምንት ስንት የቁሳቁስ ምርጫ ፎርሞች ተፈረሙ?', t:'num',
        auto:{week:'ms_signed'}},
      {id:'wms_a', en:'How many customers chose Option A (stock)?', am:'ስንት ደንበኞች አማራጭ A (በመጋዘን ያለ) መረጡ?', t:'num',
        auto:{week:'ms_a'}},
      {id:'wms_b', en:'How many customers chose Option B (imported)?', am:'ስንት ደንበኞች አማራጭ B (ከውጭ የሚመጣ) መረጡ?', t:'num',
        auto:{week:'ms_b'}},
      {id:'wms_missing', en:'How many forms are still missing a signature? (0 if none.)', am:'ስንት ፎርሞች ገና ፊርማ ጎድሏቸዋል? (ከሌለ 0።)', t:'num',
        tgt:{op:'lte', v:0, en:'–500 Birr each and loses 0.3%', am:'እያንዳንዱ –500 ብር እና 0.3% ያሳጣል'}},
      {id:'wms_missing_who', en:'Who has not signed, and when will they? (Write the customers in the box.)', am:'ያልፈረሙት እነማን ናቸው? መቼ ይፈርማሉ? (ደንበኞቹን በሳጥኑ ይጻፉ።)', t:'area',
        picks:[
          { en:'The customer is not reached yet',      am:'ደንበኛው ገና አልተገኘም' },
          { en:'The customer is still choosing',       am:'ደንበኛው ገና እየመረጠ ነው' },
          { en:'Will sign at the next visit',          am:'በሚቀጥለው ጉብኝት ይፈርማል' },
          { en:'Will sign next week',                  am:'በሚቀጥለው ሳምንት ይፈርማል' }
        ], show:{f:'wms_missing', when:'pos'}},
      {id:'wms_photo', en:'How many signed forms have a photo posted? (posted / signed)', am:'ከተፈረሙት ስንቱ ፎቶ ተልኳል? (የተላኩ / የተፈረሙ)', t:'ratio',
        auto:{a:{week:'ms_photo__a'}, b:{week:'ms_photo__b'}}},
      {id:'wms_photo_why', en:'Some signed forms have no photo yet. Why? (Write the customer in the box.)', am:'አንዳንድ የተፈረሙ ፎርሞች ፎቶ ገና አልተላከም። ለምን? (ደንበኛውን በሳጥኑ ይጻፉ።)', t:'area', auto:{weekText:'ms_photo_why', from:'design-daily'},
        picks:[
          { en:'Forgot',                               am:'ተረስቷል' },
          { en:'No signal or no data',                 am:'ኔትወርክ ወይም ዳታ አልነበረም' },
          { en:'The customer group is not set up',     am:'የደንበኛው ግሩፕ ገና አልተከፈተም' },
          { en:'Will post it on Monday',               am:'ሰኞ ይላካል' }
        ], show:{f:'wms_photo', when:'short'}}
    ]},
    { en:'Job File documentation', am:'የሥራ ፋይል ሰነዶች', fields:[
      /* a standing figure, not a weekly total: the last daily report of the
         week is where it stands now, so adding six days of it would be
         counting the same profiles six times */
      {id:'jf_profiles', en:'How many Designer Profiles are complete? (complete / jobs)', am:'ስንት የዲዛይነር ፕሮፋይሎች ተሞልተዋል? (የተሞሉ / ሥራዎች)', t:'ratio',
        auto:{a:{week:'dp_done__a', how:'last'}, b:{week:'dp_done__b', how:'last'}}},
      {id:'jf_profiles_why', en:'Some profiles are not complete. When will they be? (Write the customers in the box.)', am:'አንዳንድ ፕሮፋይሎች አልተሟሉም። መቼ ይሟላሉ? (ደንበኞቹን በሳጥኑ ይጻፉ።)', t:'area', auto:{weekText:'dp_done_why', from:'design-daily'},
        picks:[
          { en:'Could not reach the customer',         am:'ደንበኛው አልተገኘም' },
          { en:'The customer has not answered everything', am:'ደንበኛው ሁሉንም ገና አልመለሰም' },
          { en:'No time this week',                    am:'በዚህ ሳምንት ጊዜ አልነበረም' },
          { en:'Will finish it next week',             am:'በሚቀጥለው ሳምንት ይሟላል' }
        ], show:{f:'jf_profiles', when:'short'}},
      {id:'jf_any', en:'Is any Job File of yours incomplete?', am:'ያልተሟላ የሥራ ፋይል አለብዎት?', t:'yesno', yes:{en:'Some are incomplete', am:'ያልተሟላ አለ'}, no:{en:'All complete', am:'ሁሉም ተሟልተዋል'}},
      {id:'jf_incomplete_list', en:'Which Job Files, and what is missing?', am:'የትኞቹ የሥራ ፋይሎች? ምን ጎደለ?', t:'table', addEn:'Add a Job File', addAm:'የሥራ ፋይል ጨምር',
        show:{f:'jf_any', when:'yes'},
        cols:[
          {id:'code', en:'Job code', am:'የሥራ ኮድ', t:'text'},
          {id:'cust', en:'Customer', am:'ደንበኛ', t:'text'},
          {id:'what', en:'Missing', am:'የጎደለው', t:'text', picks:COL_JOBFILE},
          {id:'by', en:'Complete by', am:'የሚሟላበት ቀን', t:'text'}
        ]},
      {id:'jf_incomplete', en:'How many of your Job Files are incomplete?', am:'ስንቱ የሥራ ፋይሎችዎ ያልተሟሉ ናቸው?', t:'num',
        auto:{rows:'jf_incomplete_list'},
        tgt:{op:'lte', v:0, en:'3 in a month cancels the month’s commission',
             am:'በወር 3 ከሆኑ የወሩን ኮሚሽን ይሰርዛል'}},
      /* the same kind of monthly guess as the video score above */
      {id:'jf_score', en:'What Documentation Quality Score do you expect this month? (%, if you know it)', am:'በዚህ ወር ስንት የሰነድ ጥራት ውጤት ይጠብቃሉ? (%፣ ካወቁ)', t:'pct', opt:1,
        tgt:{op:'gte', v:95, en:'≥95% earns 2,000 Birr; below 60% is –3,000 Birr',
             am:'≥95% 2,000 ብር፤ ከ60% በታች –3,000 ብር'}},
      {id:'jf_score_why', en:'Below 95%. What is pulling it down? (Write what you will fix in the box.)', am:'ከ95% በታች ነው። ምን እያወረደው ነው? (ምን እንደሚያስተካክሉ በሳጥኑ ይጻፉ።)', t:'area',
        picks:[
          { en:'Designer Profiles not complete',       am:'የዲዛይነር ፕሮፋይሎች አልተሟሉም' },
          { en:'Videos missing or late',               am:'ቪዲዮዎች ጎድለዋል ወይም ዘግይተዋል' },
          { en:'Material Selection Forms not signed',  am:'የቁሳቁስ ምርጫ ፎርሞች አልተፈረሙም' },
          { en:'Codes missing in Job Files',           am:'በሥራ ፋይሎች ውስጥ ኮዶች ጎድለዋል' },
          { en:'Approvals not in writing',             am:'ማጽደቆቹ በጽሑፍ አይደሉም' }
        ], show:{f:'jf_score', when:'miss'}}
    ]},
    { en:'Production drawings', am:'የምርት ሥዕሎች', fields:[
      {id:'wp_sub', en:'How many production drawings did you submit this week?', am:'በዚህ ሳምንት ስንት የምርት ሥዕሎችን አቀረቡ?', t:'num',
        auto:{week:'pd_sub'}},
      {id:'wp_err', en:'How many drawings had errors?', am:'ስንት ሥዕሎች ስህተት ነበራቸው?', t:'num', auto:{week:'pd_err'},
        tgt:{op:'lte', v:0, en:'–500 Birr each, and –500 per production delay caused',
             am:'እያንዳንዱ –500 ብር፣ ለሚያስከትለው መዘግየትም –500 ብር'}},
      {id:'wp_err_what', en:'What was wrong, and did it delay production? (Write the job in the box.)', am:'ስህተቱ ምን ነበር? ምርቱን አዘገየ? (ሥራውን በሳጥኑ ይጻፉ።)', t:'area', auto:{weekText:'pd_err_what', from:'design-daily'},
        picks:[
          { en:'Wrong board code',                     am:'የተሳሳተ የሰሌዳ ኮድ' },
          { en:'Wrong edge (PVC) code',                am:'የተሳሳተ የጠርዝ (PVC) ኮድ' },
          { en:'Wrong size',                           am:'የተሳሳተ መጠን' },
          { en:'Production was delayed',               am:'ምርቱ ዘገየ' },
          { en:'No delay',                             am:'ምርቱ አልዘገየም' }
        ], show:{f:'wp_err', when:'pos'}},
      /* the rulebook reads this one (–300 Birr each) */
      {id:'wp_late', en:'How many drawings were submitted late? (0 if none.)', am:'ስንት ሥዕሎች ዘግይተው ቀረቡ? (ከሌለ 0።)', t:'num',
        tgt:{op:'lte', v:0, en:'–300 Birr each', am:'እያንዳንዱ –300 ብር'}},
      {id:'wp_late_why', en:'Some drawings were late. Why? (Write the job in the box.)', am:'አንዳንድ ሥዕሎች ዘገዩ። ለምን? (ሥራውን በሳጥኑ ይጻፉ።)', t:'area',
        picks:[
          { en:'Waiting for the customer’s approval',  am:'የደንበኛውን ማጽደቅ እየጠበቅኩ ነበር' },
          { en:'Waiting for the material choice',      am:'የቁሳቁስ ምርጫ እየጠበቅኩ ነበር' },
          { en:'The design changed',                   am:'ዲዛይኑ ተቀየረ' },
          { en:'Too many drawings at once',            am:'ብዙ ሥዕሎች በአንድ ጊዜ ነበሩ' },
          { en:'Computer or power problem',            am:'የኮምፒውተር ወይም የመብራት ችግር' }
        ], show:{f:'wp_late', when:'pos'}}
    ]},
    { en:'Commission', am:'ኮሚሽን', fields:[
      {id:'wc_earned', en:'How much commission did you earn this week? (Birr)', am:'በዚህ ሳምንት ስንት ብር ኮሚሽን አገኙ?', t:'money'},
      {id:'wc_missed_any', en:'Did you miss any commission stage this week?', am:'በዚህ ሳምንት ያመለጠዎት የኮሚሽን ደረጃ አለ?', t:'yesno', yes:{en:'I missed some', am:'ያመለጠኝ አለ'}, no:{en:'I missed none', am:'ያመለጠኝ የለም'}},
      {id:'wc_missed_list', en:'Which stages?', am:'የትኞቹ ደረጃዎች?', t:'table', addEn:'Add a stage', addAm:'ደረጃ ጨምር',
        show:{f:'wc_missed_any', when:'yes'},
        cols:[
          {id:'cust', en:'Customer', am:'ደንበኛ', t:'text'},
          {id:'lc', en:'Customer code: 4-digit lead no., or KK code once paid', am:'የደንበኛ ኮድ፦ ባለ 4 አሃዝ ቁጥር፣ ከከፈሉ በኋላ KK ኮድ', t:'text'},
          {id:'stage', en:'Stage (1–10)', am:'ደረጃ (1–10)', t:'num'},
          {id:'lost', en:'Birr lost', am:'የጠፋ ብር', t:'money'},
          {id:'why', en:'Why', am:'ለምን', t:'text', picks:COL_STAGE_MISSED}
        ]},
      {id:'wc_missed', en:'How many commission stages did you miss?', am:'ስንት የኮሚሽን ደረጃዎች አመለጡዎት?', t:'num',
        auto:{rows:'wc_missed_list'}, sumEn:'stages missed', sumAm:'ያመለጡ ደረጃዎች'},
      {id:'wc_lost', en:'How much commission did that cost? (Birr)', am:'ይህ ስንት ብር ኮሚሽን አሳጣ?', t:'money',
        auto:{sum:'wc_missed_list.lost'}, sumEn:'lost', sumAm:'ጠፍቷል'}
    ]},
    { en:'Complaints', am:'ቅሬታዎች', fields:[
      {id:'wcp_assigned', en:'How many design complaints were assigned to you this week?', am:'በዚህ ሳምንት ስንት የዲዛይን ቅሬታዎች ለእርስዎ ተመደቡ?', t:'num',
        auto:{week:'cp_assigned', how:'max'}},
      {id:'wcp_24', en:'How many were contacted within 24 hours? (contacted / assigned)', am:'ስንቱ በ24 ሰዓት ውስጥ ተደወለላቸው? (የተደወለላቸው / የተመደቡ)', t:'ratio',
        auto:{a:{week:'cp_24__a', how:'last'}, b:{week:'cp_24__b', how:'last'}}},
      {id:'wcp_7', en:'How many were resolved within 7 days? (resolved / assigned)', am:'ስንቱ በ7 ቀን ውስጥ ተፈቱ? (የተፈቱ / የተመደቡ)', t:'ratio'},
      {id:'wcp_7_why', en:'Some were not resolved in 7 days. Why? (Write the job in the box.)', am:'አንዳንዶቹ በ7 ቀን ውስጥ አልተፈቱም። ለምን? (ሥራውን በሳጥኑ ይጻፉ።)', t:'area',
        picks:[
          { en:'Waiting for production',               am:'ምርት ክፍሉን እየጠበቅን ነው' },
          { en:'Waiting for a material or accessory',  am:'ዕቃ ወይም መለዋወጫ እየጠበቅን ነው' },
          { en:'Waiting for the customer to decide',   am:'የደንበኛውን ውሳኔ እየጠበቅን ነው' },
          { en:'A site visit is needed',               am:'ቦታው ላይ መሄድ ያስፈልጋል' },
          { en:'Waiting for Ephrata',                  am:'ኤፍራታን እየጠበቅን ነው' }
        ], show:{f:'wcp_7', when:'short'}},
      {id:'wcp_out', en:'How many complaints are still open?', am:'ስንት ቅሬታዎች ገና አልተፈቱም?', t:'num',
        auto:{week:'cp_out', how:'last'},
        tgt:{op:'lte', v:0, en:'Two past 7 days cancels the month’s commission',
             am:'ከ7 ቀን በላይ ሁለት ከሆኑ የወሩን ኮሚሽን ይሰርዛል'}},
      {id:'wcp_out_what', en:'What is the plan for each? (Write the job and how many days open in the box.)', am:'ለእያንዳንዱ ዕቅዱ ምንድን ነው? (ሥራውንና ስንት ቀን እንደቆየ በሳጥኑ ይጻፉ።)', t:'area', auto:{weekText:'cp_out_what', from:'design-daily'},
        picks:[
          { en:'Production will fix it',               am:'ምርት ክፍሉ ያስተካክለዋል' },
          { en:'Waiting for a material or accessory',  am:'ዕቃ ወይም መለዋወጫ እየጠበቅን ነው' },
          { en:'A new design is being made',           am:'አዲስ ዲዛይን እየተሠራ ነው' },
          { en:'A site visit is booked',               am:'የቦታ ጉብኝት ተይዟል' },
          { en:'Passed to Ephrata',                    am:'ለኤፍራታ ተላልፏል' }
        ], show:{f:'wcp_out', when:'pos'}},
      {id:'wcp_esc', en:'How many complaints went up to Ephrata or the Chairman? (0 if none.)', am:'ስንት ቅሬታዎች ወደ ኤፍራታ ወይም ወደ ሊቀመንበሩ ደረሱ? (ከሌለ 0።)', t:'num',
        tgt:{op:'lte', v:0, en:'–1,500 Birr to Ephrata, –3,000 Birr to the Chairman',
             am:'ወደ ኤፍራታ –1,500 ብር፣ ወደ ሊቀመንበር –3,000 ብር'}},
      {id:'wcp_esc_what', en:'Who did they go to, and why? (Write the job in the box.)', am:'ለማን ደረሱ? ለምን? (ሥራውን በሳጥኑ ይጻፉ።)', t:'area',
        picks:[
          { en:'To Ephrata',                           am:'ወደ ኤፍራታ' },
          { en:'To the Chairman',                      am:'ወደ ሊቀመንበሩ' },
          { en:'Not solved in time',                   am:'በሰዓቱ አልተፈታም' },
          { en:'The customer called them directly',    am:'ደንበኛው በቀጥታ ደወለ' }
        ], show:{f:'wcp_esc', when:'pos'}}
    ]},
    { en:'WhatsApp', am:'ዋትስአፕ', fields:[
      {id:'ws_rate', en:'What was your stage message compliance this week? (%)', am:'ከሚገባው የደረጃ መልዕክት ስንት በመቶውን ላኩ? (%)', t:'pct',
        auto:{pct:[{week:'wd_stage__a'}, {week:'wd_stage__b'}]},
        tgt:{op:'gte', v:100, en:'Every stage message must be posted', am:'እያንዳንዱ የደረጃ መልዕክት መላክ አለበት'}},
      {id:'ws_rate_why', en:'Below 100%. Why? (Write the customer and the stage in the box.)', am:'ከ100% በታች ነው። ለምን? (ደንበኛውንና ደረጃውን በሳጥኑ ይጻፉ።)', t:'area', auto:{weekText:'wd_stage_why', from:'design-daily'},
        picks:[
          { en:'Forgot to post',                       am:'መላክ ተረስቷል' },
          { en:'Waiting for the customer’s approval',  am:'የደንበኛውን ማጽደቅ እየጠበቅኩ ነው' },
          { en:'The customer group is not set up',     am:'የደንበኛው ግሩፕ ገና አልተከፈተም' },
          { en:'No signal or no data',                 am:'ኔትወርክ ወይም ዳታ አልነበረም' }
        ], show:{f:'ws_rate', when:'miss'}},
      {id:'ws_sum', en:'How many Design Discussion Summaries did you post this week?', am:'በዚህ ሳምንት ስንት የውይይት ማጠቃለያዎችን ላኩ?', t:'num',
        auto:{week:'wd_sum'}},
      {id:'ws_appr', en:'How many written customer approvals did you receive?', am:'ስንት የጽሑፍ የደንበኛ ማጽደቆች ደረሱዎት?', t:'num',
        auto:{week:'d_approved'}},
      {id:'ws_comp', en:'How many design-related complaints came in this week?', am:'በዚህ ሳምንት ከዲዛይን ጋር የተያያዙ ስንት ቅሬታዎች ቀረቡ?', t:'num',
        auto:{week:'wd_comp'},
        tgt:{op:'lte', v:0, en:'Zero earns the 2,000 Birr bonus', am:'0 ከሆነ የ2,000 ብር ጉርሻ ያስገኛል'}},
      {id:'ws_comp_what', en:'What were the complaints, and what was done? (Write who in the box.)', am:'ቅሬታዎቹ ምን ነበሩ? ምን ተደረገ? (ማን እንደሆነ በሳጥኑ ይጻፉ።)', t:'area', auto:{weekText:'wd_comp_what', from:'design-daily'},
        picks:[
          { en:'Design not ready on time',             am:'ዲዛይኑ በሰዓቱ አልደረሰም' },
          { en:'Design not as agreed',                 am:'ዲዛይኑ እንደተስማማነው አልሆነም' },
          { en:'Measurement late',                     am:'ልኬቱ ዘገየ' },
          { en:'No reply to messages',                 am:'ለመልዕክት ምላሽ አልተሰጠም' },
          { en:'Apologised and gave a new date',       am:'ይቅርታ ተጠይቆ አዲስ ቀን ተሰጠ' },
          { en:'Passed to Ephrata',                    am:'ለኤፍራታ ተላልፏል' }
        ], show:{f:'ws_comp', when:'pos'}}
    ]},
    { en:'Problems and help', am:'ችግርና እርዳታ', fields:[
      {id:'problem', en:'What was the biggest problem this week?', am:'የዚህ ሳምንት ትልቁ ችግር ምን ነበር?', t:'area', auto:{weekText:'problem', from:'design-daily'}, opt:1,
        picks:[
          { en:'No big problem this week',             am:'በዚህ ሳምንት ትልቅ ችግር አልነበረም' },
          { en:'Customers keep changing the design',   am:'ደንበኞች ዲዛይኑን ደጋግመው ይቀይራሉ' },
          { en:'Waiting for measurements',             am:'ልኬት እየጠበቅኩ ነው' },
          { en:'Waiting for customers’ colour or material choices', am:'የደንበኞችን የቀለም ወይም የቁሳቁስ ምርጫ እየጠበቅኩ ነው' },
          { en:'Price or proforma not agreed',         am:'በዋጋ ወይም በፕሮፎርማ ላይ ስምምነት የለም' },
          { en:'Delivery or production is late',       am:'ማስረከቢያ ወይም ምርት ዘግይቷል' },
          { en:'A material or accessory is missing',   am:'ዕቃ ወይም መለዋወጫ ጎድሏል' },
          { en:'Computer or power problem',            am:'የኮምፒውተር ወይም የመብራት ችግር' }
        ]},
      {id:'need_lead', en:'Do you need a decision from Ephrata?', am:'የኤፍራታ ውሳኔ ያስፈልግዎታል?', t:'yesno', auto:{week:'need_lead', how:'anyyes', from:'design-daily'}, yes:{en:'I need a decision', am:'ውሳኔ ያስፈልገኛል'}, no:{en:'No decision needed', am:'ውሳኔ አያስፈልገኝም'}},
      {id:'need_lead_what', en:'What should Ephrata decide? (Write the customer and by when in the box.)', am:'ኤፍራታ ምን እንድትወስን ይፈልጋሉ? (ደንበኛውንና እስከ መቼ እንደሆነ በሳጥኑ ይጻፉ።)', t:'area', auto:{weekText:'need_lead_what', from:'design-daily'},
        picks:[
          { en:'Approve a design change',              am:'የዲዛይን ለውጥ እንድታጸድቅ' },
          { en:'A price or discount',                  am:'ዋጋ ወይም ቅናሽ' },
          { en:'Who takes a job',                      am:'ሥራውን ማን እንደሚይዘው' },
          { en:'Chase the customer for an answer',     am:'ደንበኛው መልስ እንዲሰጥ እንድትከታተል' },
          { en:'Chase production for a date',          am:'ምርት ክፍሉ ቀን እንዲሰጥ እንድትከታተል' },
          { en:'Settle a complaint',                   am:'ቅሬታ እንድትፈታ' }
        ], show:{f:'need_lead', when:'yes'}}
    ]},
    { en:"Next week's plan", am:'የሚቀጥለው ሳምንት ዕቅድ', fields:[
      {id:'n_meas', en:'How many measurements are scheduled for next week?', am:'ለሚቀጥለው ሳምንት ስንት ልኬቶች ታቅደዋል?', t:'num'},
      {id:'n_designs', en:'How many designs must you deliver next week?', am:'በሚቀጥለው ሳምንት ስንት ዲዛይኖችን ማቅረብ አለብዎት?', t:'num'},
      {id:'n_support', en:'What support do you need from Ephrata?', am:'ከኤፍራታ ምን ድጋፍ ያስፈልግዎታል?', t:'area', auto:{weekText:'need_help', from:'design-daily'}, opt:1,
        picks:[
          { en:'Nothing needed',                       am:'ምንም አያስፈልግም', nil:1 },
          { en:'Measurements booked on time',          am:'ልኬቶች በሰዓቱ እንዲያዙ' },
          { en:'Customers to decide faster',           am:'ደንበኞች ቶሎ እንዲወስኑ' },
          { en:'Production dates',                     am:'የምርት ቀኖች' },
          { en:'A better computer or software',        am:'የተሻለ ኮምፒውተር ወይም ሶፍትዌር' }
        ]},
      {id:'n_prio', en:'What are your top 3 jobs for next week? (Customer names or codes are enough.)', am:'የሚቀጥለው ሳምንት ዋና ሦስት ሥራዎችዎ ምንድን ናቸው? (የደንበኛ ስም ወይም ኮድ በቂ ነው።)', t:'area'}
    ]}
  ]
};

/* ======================= ANSWERS THAT CANNOT BE RIGHT =======================
   One home for the check, read by the form (a warning under the answer, and a
   line in the sent report) and by the morning agents (told in code, so no model
   reasons from a figure that cannot be true). It asks nothing new; it compares
   answers the report already has:

   · every two-box answer is "part / whole", so the first box can never be the
     bigger one — 11 called within the hour out of 10 new leads;
   · whole:'<id>' on a two-box question: its second box counts the same thing
     as that question, so the two must agree (all new leads today = question 1);
   · parts:{of:[ids], all:1} on a total: the indented answers under it add up
     to it exactly (all:1 — "Anywhere else" catches the rest), or, without all,
     at least never pass it.

   A blank is never a mismatch: it is not answered, which is counted elsewhere.
   Each result is {f: the question it belongs under, en, am}. */
function oddFigures(report, v) {
  v = v || {};
  var out = [], byId = {};
  function num(x) {
    var s = String(x == null ? '' : x).replace(/[^0-9.\-]/g, '');
    return s === '' || isNaN(Number(s)) ? null : Number(s);
  }
  function show(x) { return Number(x).toLocaleString('en-US'); }
  function boxes(label, fallback) {
    var m = /\(([^()]*?)\s\/\s([^()]*?)\)\s*$/.exec(String(label || ''));
    return m ? [m[1].trim(), m[2].trim()] : fallback;
  }
  function bare(label) { return String(label || '').replace(/\s*\([^()]*\)\s*$/, '').replace(/[?？፧]\s*$/, ''); }
  (report.sections || []).forEach(function (s) {
    (s.fields || []).forEach(function (f) { byId[f.id] = f; });
  });
  (report.sections || []).forEach(function (s) {
    (s.fields || []).forEach(function (f) {
      if (f.t === 'ratio') {
        var a = num(v[f.id + '__a']), b = num(v[f.id + '__b']);
        var we = boxes(f.en, ['the first box', 'the second']), wa = boxes(f.am, ['የመጀመሪያው ሳጥን', 'ሁለተኛው']);
        if (a !== null && b !== null && a > b) {
          out.push({ f: f.id,
            en: we[0] + ' (' + show(a) + ') cannot be more than ' + we[1] + ' (' + show(b) + ')',
            am: '«' + wa[0] + '» (' + show(a) + ') ከ«' + wa[1] + '» (' + show(b) + ') ሊበልጥ አይችልም' });
        }
        var w = f.whole && byId[f.whole], t = w ? num(v[f.whole]) : null;
        if (b !== null && t !== null && b !== t) {
          out.push({ f: f.id,
            en: we[1] + ' (' + show(b) + ') should be the same as “' + bare(w.en) + '” (' + show(t) + ')',
            am: '«' + wa[1] + '» (' + show(b) + ') ከ«' + bare(w.am) + '» (' + show(t) + ') ጋር እኩል መሆን አለበት' });
        }
      }
      /* a row of a list that cannot be right: one figure times another,
         beyond a third in the same row */
      if (f.t === 'table' && f.rowOdd) {
        var rr = v[f.id];
        rr = Object.prototype.toString.call(rr) === '[object Array]' ? rr : [];
        rr.forEach(function (r, i) {
          var per = num((r || {})[f.rowOdd.per]), by = num((r || {})[f.rowOdd.times]), cap = num((r || {})[f.rowOdd.max]);
          if (per === null || by === null || cap === null || by <= 0 || per <= 0) return;
          var got = Math.round(per * by * 100) / 100;
          if (got <= cap) return;
          var fill = function (w) { return String(w).replace('{a}', show(got)).replace('{b}', show(cap)); };
          out.push({ f: f.id, en: 'row ' + (i + 1) + ': ' + fill(f.rowOdd.en), am: 'ረድፍ ' + (i + 1) + '፦ ' + fill(f.rowOdd.am) });
        });
      }
      /* in any list (11 Oct 2026, "fix all"): a phone number written where
         the customer's code goes — "0966012271" for the 4-digit lead no. —
         and a figure over a column's `most` (a day of the 15-day plan read
         4,060 m² for "40" and "60" run together) */
      if ((f.t === 'table' || f.t === 'grid') && f.cols) {
        var rows = v[f.id];
        rows = Object.prototype.toString.call(rows) === '[object Array]' ? rows : [];
        rows.forEach(function (r, i) {
          r = r || {};
          var where = f.t === 'grid' && f.rows && f.rows[i] ? f.rows[i] : null;
          var tagEn = where ? where.en + ': ' : 'row ' + (i + 1) + ': ';
          var tagAm = where ? where.am + '፦ ' : 'ረድፍ ' + (i + 1) + '፦ ';
          f.cols.forEach(function (c) {
            var raw = String(r[c.id] == null ? '' : r[c.id]).trim();
            if (!raw) return;
            if (c.id === 'lc' && raw.replace(/\D/g, '').length >= 7) {
              out.push({ f: f.id, en: tagEn + '“' + raw + '” looks like a phone number — write the 4-digit lead no. (or the KK code once paid)',
                         am: tagAm + '«' + raw + '» ስልክ ቁጥር ይመስላል — ባለ 4 አሃዝ የደንበኛ ቁጥሩን (ከከፈሉ በኋላ KK ኮዱን) ይጻፉ' });
            }
            if (c.most) {
              var x = num(raw);
              if (x !== null && x > c.most.v) {
                out.push({ f: f.id, en: tagEn + show(x) + ' ' + c.most.en, am: tagAm + show(x) + ' ' + c.most.am });
              }
            }
          });
        });
      }
      if (f.parts) {
        var tot = num(v[f.id]), sum = 0, got = 0;
        f.parts.of.forEach(function (id) { var x = num(v[id]); if (x !== null) { sum += x; got++; } });
        if (tot === null || !got) return;
        /* m² come with decimals, and 31.6 + 11.3 adds up to 42.900000000000006
           in a computer — more than a correct 42.9. Compare to the thousandth. */
        sum = Math.round(sum * 1000) / 1000;
        tot = Math.round(tot * 1000) / 1000;
        if (sum > tot) {
          out.push({ f: f.id,
            en: 'the answers under it add up to ' + show(sum) + ', more than ' + show(tot),
            am: 'ከሥሩ ያሉት መልሶች ሲደመሩ ' + show(sum) + ' ይሆናሉ — ከ' + show(tot) + ' ይበልጣሉ' });
        } else if (f.parts.all && got === f.parts.of.length && sum !== tot) {
          out.push({ f: f.id,
            en: 'the answers under it add up to ' + show(sum) + ', not ' + show(tot),
            am: 'ከሥሩ ያሉት መልሶች ሲደመሩ ' + show(sum) + ' ይሆናሉ እንጂ ' + show(tot) + ' አይደሉም' });
        }
      }
    });
  });
  return out;
}

(function stampShared() {
  function copyFor(tpl, pid) {
    var c = JSON.parse(JSON.stringify(tpl));
    c.id = pid + '-' + tpl.id;
    c.person = pid;
    return c;
  }
  ['tsega', 'biruktayet'].forEach(function (p) {
    REPORTS.push(copyFor(SALES_DAILY, p), copyFor(SALES_WEEKLY, p));
  });
  ['yohannis', 'yonas', 'abrham-g', 'teklweld', 'abrham-w', 'ermiyas'].forEach(function (p) {
    REPORTS.push(copyFor(DESIGN_DAILY, p), copyFor(DESIGN_WEEKLY, p));
  });
  /* Meri Block Board and Real Estate & Construction (6 Oct 2026) */
  [['meri', 'Meri Block Board', 'መሪ ብሎክ ቦርድ'],
   ['lemikura', 'Real Estate & Construction', 'ሪል እስቴትና ግንባታ']].forEach(function (c) {
    sisterReports(c[0], c[1], c[2]).forEach(function (r) { REPORTS.push(r); });
  });
  /* someone with no terms letter yet reports, and is fined for nothing */
  REPORTS.forEach(function (r) {
    var p = PEOPLE.filter(function (x) { return x.id === r.person; })[0];
    if (p && p.noLetter && !r.noFine) {
      r.noFine = 1;
      r.penEn = 'No fines — no terms letter yet';
      r.penAm = 'ቅጣት የለም — የውል ደብዳቤ ገና አልተሰጠም';
    }
  });
})();
