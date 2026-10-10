/* Klever report definitions.
   To change a form, edit the data here — nothing else needs touching.

   field keys:  id  en  am  t(type)  i(indent)  tgt(target check)  opt(not required)
   types:       num money pct text area ratio yesno choice
   target:      {op:'gte'|'lte', v:<number>, en:'', am:''}            */

const PEOPLE = [
  { id:'ephrata',  en:'Ephrata Assfa',   am:'ኤፍራታ አስፋ',   roleEn:'Commercial Lead',   roleAm:'የንግድ ኃላፊ', grp:'commercial' },
  { id:'liu',      en:'Mahelet Teshome', am:'ማህሌት ተሾመ',   roleEn:'Operations Lead',   roleAm:'የኦፕሬሽን ኃላፊ', grp:'lead' },
  { id:'betty',    en:'Selam',  am:'ሰላም', roleEn:'Finance Officer',   roleAm:'የፋይናንስ ኃላፊ', grp:'finance' },
  { id:'getachew', en:'Getachew Negash', am:'ጌታቸው ነጋሽ',   roleEn:'Purchasing Officer', roleAm:'የግዥ ኃላፊ', grp:'finance' },
  { id:'yordanos', en:'Yordanos Fikadu', am:'ዮርዳኖስ ፍቃዱ',  roleEn:'Storekeeper',       roleAm:'የመጋዘን ኃላፊ', grp:'finance' },
  { id:'amaha',      en:'Amaha Temechew',       am:'አማሃ ተመቸው',      roleEn:'Production Supervisor', roleAm:'የምርት ተቆጣጣሪ', grp:'production' },
  { id:'wude',       en:'Wude Birhanu',         am:'ውዱ ብርሃኑ',       roleEn:'Quality Control Officer', roleAm:'የጥራት ቁጥጥር ኃላፊ', grp:'production' },
  { id:'elyas',      en:'Elyas Mullatu',        am:'ኤልያስ ሙላቱ',      roleEn:'Site Supervisor',   roleAm:'የተከላ ቦታ ተቆጣጣሪ', grp:'site' },
  { id:'ashenafi',   en:'Ashenafi Germa',       am:'አሸናፊ ገርማ',      roleEn:'Site Helper',       roleAm:'የተከላ ቦታ ረዳት', grp:'site' },
  { id:'tsega',      en:'Tsega Girma',          am:'ፀጋ ግርማ',        roleEn:'Salesperson',       roleAm:'የሽያጭ ባለሙያ', grp:'commercial' },
  { id:'biruktayet', en:'Biruktayet Kassahun',  am:'ብሩክታይት ካሳሁን',   roleEn:'Salesperson',       roleAm:'የሽያጭ ባለሙያ', grp:'commercial' },
  { id:'yohannis',   en:'Yohannis Amare Badreg',am:'ዮሐንስ አማረ ባድረግ', roleEn:'Designer',          roleAm:'ዲዛይነር', grp:'commercial' },
  { id:'yonas',      en:'Yonas Abate Nemera',   am:'ዮናስ አባተ ነመራ',   roleEn:'Designer',          roleAm:'ዲዛይነር', grp:'commercial' },
  { id:'abrham-g',   en:'Abrham Gosaye',        am:'አብርሃም ጎሳዬ',     roleEn:'Designer',          roleAm:'ዲዛይነር', grp:'commercial' },
  { id:'teklweld',   en:'Teklweld Birhanu',     am:'ተክለወልድ ብርሃኑ',   roleEn:'Designer',          roleAm:'ዲዛይነር', grp:'commercial' },
  { id:'abrham-w',   en:'Abrham Webeshat',      am:'አብርሃም ወበሻት',    roleEn:'Designer',          roleAm:'ዲዛይነር', grp:'commercial' },
  /* The sixth designer, added by the Chairman on 6 Oct 2026; reports from
     the 7th. No terms letter yet and no surname on file, so `noLetter`: his
     reports carry no fines and the rulebook tracks his lines at nothing
     until his letter is signed — then take `noLetter` out. */
  { id:'ermiyas',    en:'Ermiyas',              am:'ኤርሚያስ',          roleEn:'Designer',          roleAm:'ዲዛይነር', grp:'commercial', from:'2026-10-07', noLetter:1 },

  /* Betelhem's assistant. She has no terms letter of her own — everything
     about her is written inside Betelhem's. She is here because she does the
     work and needs to be reachable, not because the paperwork caught up. */
  { id:'seble', en:'Seble Mulugeta', am:'ሰብለ ሙሉጌታ', roleEn:'Finance Assistant', roleAm:'የፋይናንስ ረዳት', grp:'finance' },

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
  { id:'bisrat', en:'Bisrat Gashaw', am:'ብስራት ጋሻው', roleEn:'Production Worker', roleAm:'የምርት ሠራተኛ', grp:'production' },
  { id:'natenael', en:'Natenael Samson', am:'ናትናኤል ሳምሶን', roleEn:'Production Worker', roleAm:'የምርት ሠራተኛ', grp:'production' },
  { id:'webalem', en:'Webalem Tesfay', am:'ወባለም ተስፋይ', roleEn:'Production Worker', roleAm:'የምርት ሠራተኛ', grp:'production' },
  { id:'yosef', en:'Yosef Fikadu', am:'ዮሴፍ ፍቃዱ', roleEn:'Production Worker', roleAm:'የምርት ሠራተኛ', grp:'production' },
  { id:'birutukan', en:'Birutukan Adugna', am:'ብሩክታን አዱኛ', roleEn:'Production Worker', roleAm:'የምርት ሠራተኛ', grp:'production' },
  { id:'semayat', en:'Semayat Woticho', am:'ሰማያት ወቲቾ', roleEn:'Production Worker', roleAm:'የምርት ሠራተኛ', grp:'production' },
  { id:'yeshareg', en:'Yeshareg Mengestu', am:'የሻረግ መንግስቱ', roleEn:'Production Worker', roleAm:'የምርት ሠራተኛ', grp:'production' },
  { id:'bezawit', en:'Bezawit Arba', am:'ቤዛዊት አርባ', roleEn:'Production Worker', roleAm:'የምርት ሠራተኛ', grp:'production' },
  { id:'addisu', en:'Addisu Fafa', am:'አዲሱ ፋፋ', roleEn:'Production Worker', roleAm:'የምርት ሠራተኛ', grp:'production' },
  { id:'cheru-moshe', en:'Cheru Moshe', am:'ጨሩ ሞሼ', roleEn:'Production Worker', roleAm:'የምርት ሠራተኛ', grp:'production' },
  { id:'tsegaye', en:'Tsegaye Ataklti', am:'ፀጋዬ አታክልቲ', roleEn:'Production Worker', roleAm:'የምርት ሠራተኛ', grp:'production' },
  { id:'etaferaw', en:'Etaferaw Marye', am:'እጣፈራው ማርዬ', roleEn:'Production Worker', roleAm:'የምርት ሠራተኛ', grp:'production' },
  { id:'fasika', en:'Fasika Abebe', am:'ፋሲካ አበበ', roleEn:'Production Worker', roleAm:'የምርት ሠራተኛ', grp:'production' },
  { id:'yared', en:'Yared Belayhneh', am:'ያሬድ በላይነህ', roleEn:'Production Worker', roleAm:'የምርት ሠራተኛ', grp:'production' },
  { id:'kiflom', en:'Kiflom Hadish', am:'ክፍሎም ሃዲሽ', roleEn:'Production Worker', roleAm:'የምርት ሠራተኛ', grp:'production' },
  { id:'meseret', en:'Meseret Dejene', am:'መሰረት ደጀኔ', roleEn:'Production Worker', roleAm:'የምርት ሠራተኛ', grp:'production' },
  { id:'haben', en:'Haben Mekonen', am:'ሃበን መኮነን', roleEn:'Production Worker', roleAm:'የምርት ሠራተኛ', grp:'production' },
  { id:'gebeyaw', en:'Gebeyaw Wale', am:'ገበያው ዋሌ', roleEn:'Production Worker', roleAm:'የምርት ሠራተኛ', grp:'production' },
  { id:'cheru-melaku', en:'Cheru Melaku', am:'ጨሩ መላኩ', roleEn:'Production Worker', roleAm:'የምርት ሠራተኛ', grp:'production' },
  { id:'tsegenet', en:'Tsegenet Getachew', am:'ፅገነት ጌታቸው', roleEn:'Production Worker', roleAm:'የምርት ሠራተኛ', grp:'production' },
  { id:'hiwot', en:'Hiwot', am:'ህይወት', roleEn:'Production Worker', roleAm:'የምርት ሠራተኛ', grp:'production' },
  { id:'bereke', en:'Bereke', am:'በረከ', roleEn:'Production Worker', roleAm:'የምርት ሠራተኛ', grp:'production' }
];

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
/* the same twelve as the fixed rows of a grid */
const MATERIAL_ROWS = MATERIALS.map(function (m) { return { en:m.en, am:m.am }; });
/* the ones that come as sheets, and the ones that come as pieces — a sheet
   count and a hinge count cannot be added to each other */
const BOARDS = ['MDF 18mm', 'MDF 16mm', 'Melamine 18mm', 'Melamine 16mm', 'Plywood', 'Back panel 3mm'];
const ACCESSORIES = ['Hinges', 'Drawer slides', 'Handles', 'Legs and shelf pins'];

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
    { en:'1 · Leads today', am:'1 · ዛሬ የመጡ አዲስ ደንበኞች', fields:[
      /* the counts are the salespeople's to report — they log every lead by
         name (the Chairman, 8 Oct 2026). Hers is the judgement over them. */
      {id:'leads_best', en:'Which of today\'s leads is the most serious, and what is the next step with them?', am:'ከዛሬዎቹ ደንበኞች ውስጥ በጣም አሳሳቢው የትኛው ነው? ቀጣዩ እርምጃስ?', t:'area', opt:1}
    ]},
    { en:'2 · Pre-measurement', am:'2 · ቅድመ ልኬት', fields:[
      {id:'visits_booked', en:'How many pre-measurement appointments did you make today?', am:'ዛሬ ስንት የቅድመ ልኬት ቀጠሮ ያዙ?', t:'num'},
      {id:'visits_any', en:'Was any pre-measurement visit done today?', am:'ዛሬ የተደረገ የቅድመ ልኬት ጉብኝት አለ?', t:'yesno'},
      {id:'visits_list', en:'Each pre-measurement visit done today', am:'ዛሬ የተደረገ እያንዳንዱ የቅድመ ልኬት ጉብኝት', t:'table', addEn:'Add a visit', addAm:'ጉብኝት ጨምር',
        show:{f:'visits_any', when:'yes'},
        cols:[
          {id:'cust', en:'Customer', am:'ደንበኛ', t:'text'},
          {id:'lc', en:'Customer code: 4-digit lead no., or KK code once paid', am:'የደንበኛ ኮድ፦ ባለ 4 አሃዝ ቁጥር፣ ከከፈሉ በኋላ KK ኮድ', t:'text'},
          {id:'where', en:'Area', am:'አካባቢ', t:'text'},
          {id:'who', en:'Visited by', am:'የጎበኘው', t:'text'},
          {id:'next', en:'Next step', am:'ቀጣይ እርምጃ', t:'text'}
        ]},
      {id:'visits_done', en:'How many pre-measurement visits were done today?', am:'ዛሬ ስንት የቅድመ ልኬት ጉብኝት ተካሄደ?', t:'num',
        auto:{rows:'visits_list'}, sumEn:'visits done', sumAm:'ጉብኝቶች ተደርገዋል'},
      /* tomorrow's visits, with the area, for the route (apps-script/Route.js, 8 Oct 2026) */
      {id:'tm_any', en:'Is any pre-measurement visit booked for tomorrow?', am:'ለነገ የተያዘ የቅድመ ልኬት ጉብኝት አለ?', t:'yesno'},
      {id:'tm_visits', en:'Each visit booked for tomorrow — the area is what the AI plans the route from', am:'ለነገ የተያዘ እያንዳንዱ ጉብኝት — AI መስመሩን የሚያቅደው ከአካባቢው ነው', t:'table', addEn:'Add a visit', addAm:'ጉብኝት ጨምር',
        show:{f:'tm_any', when:'yes'},
        cols:[
          {id:'cust', en:'Customer', am:'ደንበኛ', t:'text'},
          {id:'lc', en:'Customer code: 4-digit lead no., or KK code once paid', am:'የደንበኛ ኮድ፦ ባለ 4 አሃዝ ቁጥር፣ ከከፈሉ በኋላ KK ኮድ', t:'text'},
          {id:'where', en:'Area (e.g. Ayat, CMC, Lebu)', am:'አካባቢ (ለምሳሌ አያት፣ ሲኤምሲ፣ ለቡ)', t:'text'},
          {id:'time', en:'Time (e.g. 10:00 AM)', am:'ሰዓት (ለምሳሌ 10:00 AM)', t:'text'},
          {id:'who', en:'Who goes', am:'የሚሄደው', t:'text'}
        ]},
      {id:'tm_visits_n', en:'How many pre-measurement visits are booked for tomorrow?', am:'ለነገ ስንት የቅድመ ልኬት ጉብኝት ተይዟል?', t:'num',
        auto:{rows:'tm_visits'}, sumEn:'booked for tomorrow', sumAm:'ለነገ ተይዘዋል'},
      {id:'visits_late', en:'How many new leads have waited more than 48 hours for a pre-measurement appointment?', am:'ከ48 ሰዓት በላይ የቅድመ ልኬት ቀጠሮ ሳይያዝላቸው የቆዩ አዲስ ደንበኞች ስንት ናቸው?', t:'num',
        tgt:{op:'lte', v:0, en:'Should be 0', am:'0 መሆን አለበት'}},
      {id:'visits_late_why', en:'Which customers are waiting, why, and on what day will each be visited?', am:'የሚጠብቁት ደንበኞች እነማን ናቸው? ለምን ዘገየ? እያንዳንዳቸው በየትኛው ቀን ይጎበኛሉ?', t:'area', show:{f:'visits_late', when:'pos'}}
    ]},
    { en:'3 · Quotations', am:'3 · ፕሮፎርማ', fields:[
      {id:'quotes_any', en:'Did any quotation go out today?', am:'ዛሬ የተሰጠ ፕሮፎርማ አለ?', t:'yesno'},
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
      {id:'quotes_late', en:'How many quotations are waiting more than 48 hours?', am:'ከ48 ሰዓት በላይ የዘገዩ ፕሮፎርማዎች ስንት ናቸው?', t:'num',
        tgt:{op:'lte', v:0, en:'Should be 0', am:'0 መሆን አለበት'}},
      {id:'quotes_late_why', en:'Which customers, what is holding each one up, and when will it go out?', am:'የየትኞቹ ደንበኞች ናቸው? እያንዳንዱን ምን ያዘው? መቼ ይላካል?', t:'area', show:{f:'quotes_late', when:'pos'}}
    ]},
    { en:'4 · Contracts', am:'4 · ውሎች', fields:[
      {id:'contracts_any', en:'Was any contract signed today?', am:'ዛሬ የተፈረመ ውል አለ?', t:'yesno'},
      {id:'contracts_list', en:'Each contract signed today', am:'ዛሬ የተፈረመ እያንዳንዱ ውል', t:'table', addEn:'Add a contract', addAm:'ውል ጨምር',
        show:{f:'contracts_any', when:'yes'},
        cols:[
          {id:'cust', en:'Customer', am:'ደንበኛ', t:'text'},
          {id:'lc', en:'Lead no. (4 digits)', am:'የደንበኛ ቁጥር (4 አሃዝ)', t:'text'},
          {id:'code', en:'Job code', am:'የሥራ ኮድ', t:'text'},
          {id:'value', en:'Contract value', am:'የውል ዋጋ', t:'money'},
          {id:'adv', en:'Advance paid', am:'የተከፈለ ቅድመ ክፍያ', t:'money'},
          {id:'margin', en:'Margin per m²', am:'ህዳግ በካሬ ሜትር', t:'money'},
          {id:'sp', en:'Salesperson', am:'ሻጭ', t:'text'}
        ]},
      {id:'contracts', en:'How many contracts were signed today?', am:'ዛሬ ስንት ውል ተፈረመ?', t:'num',
        auto:{rows:'contracts_list'}, sumEn:'contracts', sumAm:'ውሎች'},
      {id:'contract_value', en:'What is the total value of today\'s contracts?', am:'የዛሬዎቹ ውሎች ጠቅላላ ዋጋ ስንት ነው?', t:'money',
        auto:{sum:'contracts_list.value'}, sumEn:'signed', sumAm:'የተፈረመ'},
      {id:'advance', en:'How much advance was collected today?', am:'ዛሬ ስንት ቅድመ ክፍያ ተሰበሰበ?', t:'money',
        auto:{sum:'contracts_list.adv'}, sumEn:'advance collected', sumAm:'የተሰበሰበ ቅድመ ክፍያ'},
      {id:'advance_banked', en:'Was all of it banked today?', am:'ሁሉም ዛሬ ባንክ ገብቷል?', t:'yesno'},
      {id:'advance_banked_why', en:'Why not, where is the money now, and when will it be banked?', am:'ለምን አልገባም? ገንዘቡ አሁን የት ነው? መቼ ባንክ ይገባል?', t:'area', show:{f:'advance_banked', when:'no'}},
      /* change orders (8 Oct 2026), for the project control reader */
      {id:'vo_any', en:'Did any customer change their order after signing, today?', am:'ዛሬ ውል ከፈረመ በኋላ ትዕዛዙን የቀየረ ደንበኛ አለ?', t:'yesno'},
      {id:'vo_list', en:'Which jobs, what changed, and what did it do to the price?', am:'የትኞቹ ሥራዎች? ምን ተቀየረ? ዋጋውን እንዴት ቀየረው?', t:'table', addEn:'Add a change', addAm:'ለውጥ ጨምር',
        show:{f:'vo_any', when:'yes'},
        cols:[
          {id:'code', en:'Job code', am:'የሥራ ኮድ', t:'text'},
          {id:'cust', en:'Customer', am:'ደንበኛ', t:'text'},
          {id:'what', en:'What changed', am:'የተቀየረው', t:'text'},
          {id:'value', en:'Added to the price (Birr)', am:'በዋጋው ላይ የተጨመረ (ብር)', t:'money'},
          {id:'less', en:'Taken off the price (Birr)', am:'ከዋጋው የተቀነሰ (ብር)', t:'money'},
          {id:'ok', en:'Signed by the customer', am:'ደንበኛው ፈርመዋል', t:'yesno'}
        ]},
    ]},
    { en:'5 · Cash collection', am:'5 · የገንዘብ ስብሰባ', fields:[
      {id:'collected_any', en:'Was money collected from any customer today?', am:'ዛሬ ከደንበኛ ገንዘብ ተሰብስቧል?', t:'yesno'},
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
      {id:'week_total', en:'How much has come in this week so far?', am:'በዚህ ሳምንት እስካሁን ስንት ብር ገባ?', t:'money',
        tgt:{op:'gte', v:3000000, en:'Commission starts at 3,000,000 Birr/week', am:'ኮሚሽን የሚጀምረው በሳምንት ከ3,000,000 ብር ነው'}},
      {id:'week_gap', en:'The week is below 3,000,000 Birr. Which customers will close the gap by Saturday, and for how much?', am:'ሳምንቱ ከ3,000,000 ብር በታች ነው። እስከ ቅዳሜ ክፍተቱን የሚሞሉት የትኞቹ ደንበኞች ናቸው? በስንት ብር?', t:'area', show:{f:'week_total', when:'miss'}},
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
        ]},
    ]},
    { en:'6 · WhatsApp compliance', am:'6 · ዋትስአፕ አጠቃቀም', fields:[
      {id:'wa_groups', en:'How many customer groups are active?', am:'ስንት የደንበኛ ግሩፖች ንቁ ናቸው?', t:'num'},
      {id:'wa_stage', en:'How many required stage messages were posted? (posted / required)', am:'ከሚገባው የደረጃ መልዕክት ስንቱ ተላከ? (የተላከ / የሚገባው)', t:'ratio'},
      {id:'wa_stage_why', en:'Which groups missed their stage message, and why?', am:'የደረጃ መልዕክት ያልደረሳቸው የትኞቹ ግሩፖች ናቸው? ለምን?', t:'area', show:{f:'wa_stage', when:'short'}},
      {id:'wa_unanswered', en:'How many messages waited more than 2 hours for an answer?', am:'ከ2 ሰዓት በላይ ምላሽ ሳያገኙ የቆዩ መልዕክቶች ስንት ናቸው?', t:'num',
        tgt:{op:'lte', v:0, en:'–200 Birr each', am:'እያንዳንዱ –200 ብር'}},
      {id:'wa_unanswered_why', en:'Which customers, who should have answered, and have they been answered now?', am:'የየትኞቹ ደንበኞች ናቸው? መመለስ የነበረበት ማን ነበር? አሁን ምላሽ አግኝተዋል?', t:'area', show:{f:'wa_unanswered', when:'pos'}},
      {id:'wa_complaints', en:'How many customers complained about WhatsApp handling?', am:'ስንት ደንበኞች በዋትስአፕ አያያዝ ላይ ቅሬታ አቀረቡ?', t:'num',
        tgt:{op:'lte', v:0, en:'–1,000 Birr each', am:'እያንዳንዱ –1,000 ብር'}},
      {id:'wa_complaints_what', en:'Who complained, about what, and what was done about it?', am:'ቅሬታ ያቀረበው ማን ነው? ስለምን? ምን እርምጃ ተወሰደ?', t:'area', show:{f:'wa_complaints', when:'pos'}},
      {id:'wa_violations', en:'How many team members broke the WhatsApp rules today?', am:'ዛሬ ስንት የቡድን አባላት የዋትስአፕ ደንብ ጣሱ?', t:'num'},
      {id:'wa_violations_who', en:'Who, what did they do, and what was the consequence?', am:'እነማን ናቸው? ምን አደረጉ? ምን ቅጣት ተሰጠ?', t:'area', show:{f:'wa_violations', when:'pos'}}
    ]},
    { en:'7 · Marketing & social media', am:'7 · ማርኬቲንግ እና ሶሻል ሚዲያ', fields:[
      /* a row a post, so the week's split by page comes out of it and the
         page is never written as a note nobody can add up */
      {id:'posts_any', en:'Did any post go up today?', am:'ዛሬ የተለጠፈ ፖስት አለ?', t:'yesno'},
      {id:'posts_list', en:'Each post that went up today', am:'ዛሬ የተለጠፈ እያንዳንዱ ፖስት', t:'table', addEn:'Add a post', addAm:'ፖስት ጨምር',
        show:{f:'posts_any', when:'yes'},
        cols:[
          {id:'page', en:'Page', am:'ገጽ', t:'choice', opts:[
            {v:'fb', en:'Facebook',  am:'ፌስቡክ'},
            {v:'ig', en:'Instagram', am:'ኢንስታግራም'},
            {v:'tt', en:'TikTok',    am:'ቲክቶክ'},
            {v:'other', en:'Somewhere else', am:'ሌላ ቦታ'}
          ]},
          {id:'what', en:'What it was about', am:'ስለምን ነበር', t:'text'},
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
      {id:'inq', en:'How many inquiries came in?', am:'ስንት ጥያቄዎች ደረሱ?', t:'num'},
      {id:'inq_1hr', en:'How many were answered within 1 hour? (answered / all inquiries)', am:'ስንቱ በ1 ሰዓት ውስጥ ምላሽ አገኙ? (ምላሽ ያገኙ / ሁሉም)', t:'ratio', whole:'inq'},
      {id:'mkt_leads', en:'How many real leads came from marketing today?', am:'ዛሬ ከማርኬቲንግ ስንት እውነተኛ ደንበኞች መጡ?', t:'num',
        auto:{sum:'posts_list.leads'}, sumEn:'leads from the posts', sumAm:'ከፖስቶቹ የመጡ ደንበኞች'},
      {id:'mkt_best', en:'Which post or channel brought the most, and why do you think it worked?', am:'በጣም ውጤታማ የነበረው የትኛው ፖስት ወይም ገጽ ነው? ለምን የሠራ ይመስልዎታል?', t:'area', opt:1}
    ]},
    { en:'8 · Problems and solutions', am:'8 · ችግሮችና መፍትሔዎች', fields:[
      {id:'problem', en:'What was the biggest problem today — what caused it, and what is being done (who, by when)?', am:'የዛሬው ትልቁ ችግር ምን ነበር? ምክንያቱ ምንድን ነው? ምን እየተደረገ ነው (በማን፣ እስከ መቼ)?', t:'area', opt:1},
      {id:'need_help', en:'What do you need from another department, and from whom?', am:'ከሌላ ክፍል ምን ያስፈልግዎታል? ከማን?', t:'area', opt:1},
      {id:'need_chair', en:'Do you need a decision from the Chairman?', am:'የሊቀመንበሩ ውሳኔ ያስፈልግዎታል?', t:'yesno'},
      {id:'need_chair_what', en:'What exactly should he decide, what are the options, and by when?', am:'በትክክል ምን እንዲወስኑ ይፈልጋሉ? አማራጮቹ ምንድን ናቸው? እስከ መቼ?', t:'area', show:{f:'need_chair', when:'yes'}}
    ]},
    { en:"9 · Tomorrow's top 3 priorities", am:'9 · ነገ የሚሠሩ ዋና ሦስት ሥራዎች', fields:[
      {id:'p1', en:'Priority 1', am:'1ኛ ሥራ', t:'text'},
      {id:'p2', en:'Priority 2', am:'2ኛ ሥራ', t:'text'},
      {id:'p3', en:'Priority 3', am:'3ኛ ሥራ', t:'text'}
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
    { en:'1 · Production', am:'1 · ምርት', fields:[
      {id:'waste', en:'What was today\'s waste, as a % of material used?', am:'የዛሬው ብክነት ከዋለው ዕቃ ስንት % ነው?', t:'pct',
        tgt:{op:'lte', v:20, en:'Must not exceed 20%', am:'ከ20% መብለጥ የለበትም'}},
      {id:'waste_why', en:'Waste is over 20%. On which job or machine, why, and what was done?', am:'ብክነቱ ከ20% በላይ ነው። በየትኛው ሥራ ወይም ማሽን? ለምን? ምን እርምጃ ተወሰደ?', t:'area', show:{f:'waste', when:'miss'}},
      {id:'machines', en:'How many machines ran today? (running / all machines)', am:'ዛሬ ስንት ማሽኖች ሠሩ? (የሠሩ / ሁሉም ማሽኖች)', t:'ratio'},
      {id:'machines_why', en:'Which machines did not run, why, and when will each be back?', am:'ያልሠሩት የትኞቹ ማሽኖች ናቸው? ለምን? እያንዳንዳቸው መቼ ይመለሳሉ?', t:'area', show:{f:'machines', when:'short'}},
      {id:'downtime_any', en:'Did any machine stop today?', am:'ዛሬ የቆመ ማሽን አለ?', t:'yesno'},
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
          {id:'cause', en:'Cause', am:'ምክንያት', t:'text'},
          {id:'told', en:'Chairman told at once', am:'ለሊቀመንበሩ ወዲያው ተነግሯል', t:'yesno'},
          {id:'back', en:'Back in service', am:'ወደ ሥራ የሚመለስበት', t:'text'}
        ]},
      {id:'downtime', en:'How many hours of machine downtime were there today?', am:'ዛሬ ማሽኖች በድምሩ ስንት ሰዓት ቆሙ?', t:'num',
        auto:{sum:'downtime_list.hours'}, sumEn:'hours stopped', sumAm:'ሰዓት ቆመዋል'},
      {id:'workers', en:'How many workers came to work today? (present / assigned)', am:'ዛሬ ስንት ሠራተኞች ተገኙ? (የተገኙ / የተመደቡ)', t:'ratio'},
      {id:'workers_why', en:'Who was absent, and was it with permission?', am:'የቀሩት እነማን ናቸው? በፈቃድ ነው?', t:'area', show:{f:'workers', when:'short'}}
    ]},
    { en:'2 · Store & inventory', am:'2 · መጋዘንና ዕቃ', fields:[
      {id:'mat_in', en:'How many material items were received into the store today?', am:'ዛሬ ወደ መጋዘን ስንት ዕቃዎች ገቡ?', t:'num'},
      {id:'mat_out', en:'How many material items were issued from the store today?', am:'ዛሬ ከመጋዘን ስንት ዕቃዎች ወጡ?', t:'num'},
      {id:'mat_out_signed', en:'Did every issue carry your signed approval?', am:'እያንዳንዱ የወጣ ዕቃ በእርስዎ የተፈረመ ፈቃድ ነበረው?', t:'yesno', show:{f:'mat_out', when:'pos'}},
      {id:'mat_out_unsigned', en:'What went out without approval, to whom, and why?', am:'ያለ ፈቃድ የወጣው ምንድን ነው? ለማን? ለምን?', t:'area', show:{f:'mat_out_signed', when:'no'}},
      {id:'shortage', en:'Is any material short in the store today?', am:'ዛሬ በመጋዘን ያጠረ ዕቃ አለ?', t:'yesno'},
      {id:'shortage_what', en:'If yes, which material?', am:'አዎ ከሆነ የትኛው ዕቃ?', t:'text', opt:1},
      {id:'shortage_hit', en:'Which jobs does the shortage hold up, and when will the material arrive?', am:'እጥረቱ የትኞቹን ሥራዎች ያቆማል? ዕቃው መቼ ይደርሳል?', t:'area', show:{f:'shortage', when:'yes'}}
    ]},
    { en:'3 · Delivery out of the factory', am:'3 · ከፋብሪካ መውጣት', fields:[
      /* what is installed at the site, whether it was on time, the
         acceptance signed and the complaints are Elyas's — he is there
         (the Chairman, 8 Oct 2026). Hers is the gate out of the factory:
         nothing leaves without Selam's clearance. */
      {id:'delivered_any', en:'Did any job leave the factory today?', am:'ዛሬ ከፋብሪካ የወጣ ሥራ አለ?', t:'yesno'},
      {id:'delivered_list', en:'Which jobs left the factory today?', am:'ዛሬ ከፋብሪካ የወጡት የትኞቹ ሥራዎች ናቸው?', t:'table', addEn:'Add a job', addAm:'ሥራ ጨምር',
        show:{f:'delivered_any', when:'yes'},
        cols:[
          {id:'code', en:'Job code', am:'የሥራ ኮድ', t:'text'},
          {id:'cust', en:'Customer', am:'ደንበኛ', t:'text'},
          {id:'fin',  en:'Selam cleared', am:'ሰላም አጽድቃለች', t:'yesno'}
        ]},
      {id:'delivered', en:'How many jobs were delivered to customers today?', am:'ዛሬ ስንት ሥራዎች ለደንበኞች ደረሱ?', t:'num',
        auto:{rows:'delivered_list'}, sumEn:'jobs out', sumAm:'ሥራዎች ወጥተዋል'},
      {id:'delivered_cleared', en:'How many of them had Selam\'s clearance?', am:'ከነሱ ስንቱ የሰላም ማጽደቅ ነበረው?', t:'num',
        auto:{rows:'delivered_list', when:{col:'fin', is:'yes'}}, sumEn:'cleared by Selam', sumAm:'በሰላም ተጽድቀዋል'}
    ]},
    /* the three counts were a chain — received, accepted, returned — where
       the third is the first less the second, and the list of what was
       returned says it better than any of them */
    { en:'4 · Job File handoff', am:'4 · የጆብ ፋይል መረካከብ', fields:[
      {id:'jf_recv', en:'How many Job Files did you receive from Ephrata today?', am:'ዛሬ ከኤፍራታ ስንት ጆብ ፋይሎች ደረሱዎት?', t:'num'},
      {id:'jf_rej_any', en:'Did you return any of them to Ephrata as incomplete?', am:'ያልተሟሉ ስለሆኑ ለኤፍራታ የመለሱት አለ?', t:'yesno', show:{f:'jf_recv', when:'pos'}},
      {id:'jf_rej_list', en:'Which files were returned, and what was missing from each?', am:'የተመለሱት የትኞቹ ፋይሎች ናቸው? በእያንዳንዱ ምን ጎደለ?', t:'table', addEn:'Add a file', addAm:'ፋይል ጨምር',
        show:{f:'jf_rej_any', when:'yes'},
        cols:[
          {id:'cust', en:'Customer', am:'ደንበኛ', t:'text'},
          {id:'code', en:'Job code', am:'የሥራ ኮድ', t:'text'},
          {id:'what', en:'What was missing', am:'የጎደለው', t:'text'}
        ]},
      {id:'jf_rej', en:'How many did you return to Ephrata as incomplete?', am:'ስንቱን ያልተሟሉ ስለሆኑ ለኤፍራታ መለሱ?', t:'num',
        auto:{rows:'jf_rej_list'}, sumEn:'returned', sumAm:'ተመልሰዋል'},
      {id:'jf_acc', en:'How many did you accept and sign for in the handover log?', am:'ስንቱን ተቀብለው በመረከቢያ መዝገቡ ፈረሙ?', t:'num',
        auto:{minus:['jf_recv', 'jf_rej']}, sumEn:'accepted and signed for', sumAm:'ተቀብለው ተፈርመዋል'}
    ]},
    { en:'5 · WhatsApp compliance', am:'5 · ዋትስአፕ አጠቃቀም', fields:[
      {id:'wa_ops', en:'How many operations messages were posted on time? (posted on time / due today)', am:'ከሚገባው የኦፕሬሽን መልዕክት ስንቱ በሰዓቱ ተለጠፈ? (በሰዓቱ የተለጠፈ / ዛሬ መላክ የነበረበት)', t:'ratio'},
      {id:'wa_missed', en:'Which groups missed theirs, and why?', am:'ያልተለጠፈባቸው የትኞቹ ግሩፖች ናቸው? ለምን?', t:'area', show:{f:'wa_ops', when:'short'}},
      {id:'wa_assembler', en:'Did the assemblers post their daily progress in every customer group?', am:'ገጣጣሚዎች በሁሉም የደንበኛ ግሩፖች ዕለታዊ ሂደታቸውን ለጠፉ?', t:'yesno'},
      {id:'wa_assembler_why', en:'Which groups were missed, by which assembler, and why?', am:'በየትኞቹ ግሩፖች አልተለጠፈም? የትኛው ገጣጣሚ? ለምን?', t:'area', show:{f:'wa_assembler', when:'no'}},
      {id:'wa_unanswered', en:'How many customer messages waited more than 2 hours for an operations answer?', am:'ስንት የደንበኛ መልዕክቶች ከ2 ሰዓት በላይ የኦፕሬሽን ምላሽ ሳያገኙ ቆዩ?', t:'num'},
      {id:'wa_unanswered_why', en:'Which customers, who should have answered, and have they been answered now?', am:'የየትኞቹ ደንበኞች ናቸው? መመለስ የነበረበት ማን ነበር? አሁን ምላሽ አግኝተዋል?', t:'area', show:{f:'wa_unanswered', when:'pos'}}
    ]},
    { en:'6 · Problems and solutions', am:'6 · ችግሮችና መፍትሔዎች', fields:[
      {id:'problem', en:'What was the biggest problem today — what caused it, and what is being done (who, by when)?', am:'የዛሬው ትልቁ ችግር ምን ነበር? ምክንያቱ ምንድን ነው? ምን እየተደረገ ነው (በማን፣ እስከ መቼ)?', t:'area', opt:1},
      {id:'resist', en:'Did anyone refuse or work around an operations rule today?', am:'ዛሬ የኦፕሬሽን ደንብን የተቃወመ ወይም ያለፈ ሰው ነበር?', t:'yesno'},
      {id:'resist_what', en:'Who, which rule, and what did you do about it?', am:'ማን ነው? የትኛውን ደንብ? ምን እርምጃ ወሰዱ?', t:'area', show:{f:'resist', when:'yes'}},
      {id:'need_help', en:'What do you need from another department, and from whom?', am:'ከሌላ ክፍል ምን ያስፈልግዎታል? ከማን?', t:'area', opt:1},
      {id:'need_chair', en:'Do you need a decision from the Chairman?', am:'የሊቀመንበሩ ውሳኔ ያስፈልግዎታል?', t:'yesno'},
      {id:'need_chair_what', en:'What exactly should he decide, what are the options, and by when?', am:'በትክክል ምን እንዲወስኑ ይፈልጋሉ? አማራጮቹ ምንድን ናቸው? እስከ መቼ?', t:'area', show:{f:'need_chair', when:'yes'}}
    ]},
    { en:"7 · Tomorrow's top 3 priorities", am:'7 · ነገ የሚሠሩ ዋና ሦስት ሥራዎች', fields:[
      {id:'p1', en:'Priority 1', am:'1ኛ ሥራ', t:'text'},
      {id:'p2', en:'Priority 2', am:'2ኛ ሥራ', t:'text'},
      {id:'p3', en:'Priority 3', am:'3ኛ ሥራ', t:'text'}
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
    { en:'1 · Cash', am:'1 · ጥሬ ገንዘብ', fields:[
      {id:'cash_any', en:'Did any cash come in today?', am:'ዛሬ የገባ ጥሬ ገንዘብ አለ?', t:'yesno'},
      {id:'cash_in_list', en:'Where did it come from? One row per receipt', am:'ከየት መጣ? ለእያንዳንዱ ደረሰኝ አንድ መስመር', t:'table', addEn:'Add a receipt', addAm:'ደረሰኝ ጨምር',
        show:{f:'cash_any', when:'yes'},
        cols:[
          {id:'from', en:'From', am:'ከማን', t:'text'},
          {id:'kind', en:'For', am:'የምን', t:'choice', opts:[
            {v:'advance', en:'Advance', am:'ቅድመ ክፍያ'},
            {v:'final', en:'Final payment', am:'የመጨረሻ ክፍያ'},
            {v:'other', en:'Other', am:'ሌላ'}]},
          {id:'amount', en:'Amount', am:'መጠን', t:'money'},
          {id:'receipt', en:'Receipt no.', am:'የደረሰኝ ቁጥር', t:'text'}
        ]},
      {id:'cash_in', en:'How much cash came in today?', am:'ዛሬ ስንት ብር ጥሬ ገንዘብ ገባ?', t:'money',
        auto:{sum:'cash_in_list.amount'}, sumEn:'came in', sumAm:'ገብቷል'},
      {id:'cash_banked', en:'Was all of today\'s cash banked today?', am:'የዛሬው ገንዘብ ሁሉ ዛሬ ባንክ ገብቷል?', t:'yesno'},
      {id:'cash_banked_why', en:'How much was not banked, where is it tonight, who holds it, and when will it be banked?', am:'ምን ያህል ባንክ አልገባም? ዛሬ ማታ የት ነው ያለው? ማን ይዞታል? መቼ ባንክ ይገባል?', t:'area', show:{f:'cash_banked', when:'no'}},
      {id:'cash_hand', en:'How much cash is on hand at close?', am:'በመዝጊያ ሰዓት በእጅ ስንት ብር አለ?', t:'money',
        tgt:{op:'lte', v:5000, en:'Over 5,000 Birr overnight is –300 Birr', am:'ከ5,000 ብር በላይ ካደረ –300 ብር'}},
      {id:'cash_hand_why', en:'Why is more than 5,000 Birr staying overnight, and where is it kept?', am:'ለምን ከ5,000 ብር በላይ ያድራል? የት ነው የሚቀመጠው?', t:'area', show:{f:'cash_hand', when:'miss'}},
      {id:'cashbook', en:'Was every cash movement recorded in the cashbook today?', am:'ዛሬ የገንዘብ እንቅስቃሴ ሁሉ በገንዘብ መዝገቡ ተመዝግቧል?', t:'yesno'},
      {id:'cashbook_why', en:'What is not recorded yet, and when will it be?', am:'ያልተመዘገበው ምንድን ነው? መቼ ይመዘገባል?', t:'area', show:{f:'cashbook', when:'no'}},
      {id:'bank_verified', en:'Was the bank balance checked against the cashbook this morning?', am:'የባንክ ቀሪ ዛሬ ጠዋት ከገንዘብ መዝገቡ ጋር ተረጋግጧል?', t:'yesno'},
      {id:'bank_verified_why', en:'Why not, and when will it be checked?', am:'ለምን አልተመሳከረም? መቼ ይመሳከራል?', t:'area', show:{f:'bank_verified', when:'no'}},
      {id:'discrepancy', en:'Was any cash discrepancy found today?', am:'ዛሬ የገንዘብ ልዩነት ተገኝቷል?', t:'yesno'},
      {id:'discrepancy_what', en:'How much, in which account or till, who handled that money, and what was done?', am:'ምን ያህል? በየትኛው ሂሳብ ወይም ካዝና? ገንዘቡን የያዘው ማን ነበር? ምን እርምጃ ተወሰደ?', t:'area', show:{f:'discrepancy', when:'yes'}},
      {id:'discrepancy_told', en:'Were the Chairman and Kidan told the same day?', am:'በዕለቱ ለሊቀመንበሩና ለኪዳን ተነግሯል?', t:'yesno', show:{f:'discrepancy', when:'yes'}}
    ]},
    { en:'2 · Bank position', am:'2 · የባንክ ሁኔታ', fields:[
      {id:'bank_total', en:'What is the total bank balance tonight?', am:'ዛሬ ማታ ጠቅላላ የባንክ ቀሪ ስንት ነው?', t:'money',
        tgt:{op:'gte', v:6000000, en:'6 Million Birr Cash Reserve Rule', am:'የ6 ሚሊዮን ብር መጠባበቂያ ደንብ'},
        parts:{of:['bank_cbe','bank_awash','bank_aby','bank_zz'], all:1}},
      /* Klever's four banks, each on its own line (Chairman, 7 Oct 2026) */
      {id:'bank_cbe', en:'In Commercial Bank of Ethiopia (CBE)', am:'በኢትዮጵያ ንግድ ባንክ', t:'money', i:1},
      {id:'bank_awash', en:'In Awash Bank', am:'በአዋሽ ባንክ', t:'money', i:1},
      {id:'bank_aby', en:'In Bank of Abyssinia', am:'በአቢሲኒያ ባንክ', t:'money', i:1},
      {id:'bank_zz', en:'In ZamZam Bank', am:'በዘምዘም ባንክ', t:'money', i:1},
      {id:'bank_total_why', en:'The balance is below the 6,000,000 Birr reserve. Why, which payments were still made today, and what is frozen until it recovers?', am:'ቀሪው ከ6,000,000 ብር መጠባበቂያ በታች ነው። ለምን? ዛሬ የትኞቹ ክፍያዎች ተከፈሉ? እስኪመለስ ድረስ ምን ቆመ?', t:'area', show:{f:'bank_total', when:'miss'}},
      {id:'below6_reported', en:'If it is below 6M, was the Chairman told today?', am:'ከ6ሚ በታች ከሆነ ዛሬ ለሊቀመንበሩ ተነግሯል?', t:'yesno', opt:1}
    ]},
    /* Four money totals and two counts stood over these three lists, and
       every one of them was the list added up (the Chairman, 9 Oct 2026). */
    { en:'3 · Collections & payments', am:'3 · ገቢና ክፍያ', fields:[
      {id:'adv_any', en:'Did any advance payment come in today?', am:'ዛሬ የገባ ቅድመ ክፍያ አለ?', t:'yesno'},
      {id:'adv_in_list', en:'Each advance received today', am:'ዛሬ የገባ እያንዳንዱ ቅድመ ክፍያ', t:'table', addEn:'Add an advance', addAm:'ቅድመ ክፍያ ጨምር',
        show:{f:'adv_any', when:'yes'},
        cols:[
          {id:'cust', en:'Customer', am:'ደንበኛ', t:'text'},
          {id:'code', en:'Job code', am:'የሥራ ኮድ', t:'text'},
          {id:'amount', en:'Amount', am:'መጠን', t:'money'},
          {id:'file', en:'Job File opened', am:'ጆብ ፋይል ተከፍቷል', t:'yesno'},
          {id:'group', en:'WhatsApp group created', am:'ዋትስአፕ ግሩፕ ተከፍቷል', t:'yesno'}
        ]},
      {id:'adv_in', en:'How much came in as advance payments today?', am:'ዛሬ ስንት ብር ቅድመ ክፍያ ገባ?', t:'money',
        auto:{sum:'adv_in_list.amount'}, sumEn:'in advances', sumAm:'በቅድመ ክፍያ'},
      {id:'jf_created', en:'How many Job Files were opened today?', am:'ዛሬ ስንት ጆብ ፋይሎች ተከፈቱ?', t:'num',
        auto:{rows:'adv_in_list', when:{col:'file', is:'yes'}}, sumEn:'Job Files opened', sumAm:'ጆብ ፋይሎች ተከፍተዋል'},
      {id:'wa_created', en:'How many customer WhatsApp groups were created today?', am:'ዛሬ ስንት የደንበኛ ዋትስአፕ ግሩፖች ተከፈቱ?', t:'num',
        auto:{rows:'adv_in_list', when:{col:'group', is:'yes'}}, sumEn:'groups created', sumAm:'ግሩፖች ተከፍተዋል'},
      {id:'final_any', en:'Did any final payment come in today?', am:'ዛሬ የገባ የመጨረሻ ክፍያ አለ?', t:'yesno'},
      {id:'final_in_list', en:'Each final payment received today', am:'ዛሬ የገባ እያንዳንዱ የመጨረሻ ክፍያ', t:'table', addEn:'Add a payment', addAm:'ክፍያ ጨምር',
        show:{f:'final_any', when:'yes'},
        cols:[
          {id:'cust', en:'Customer', am:'ደንበኛ', t:'text'},
          {id:'code', en:'Job code', am:'የሥራ ኮድ', t:'text'},
          {id:'amount', en:'Amount', am:'መጠን', t:'money'},
          {id:'prod', en:'Mahelet told production may start', am:'ምርት እንዲጀመር ለማህሌት ተነግሯል', t:'yesno'}
        ]},
      {id:'final_in', en:'How much came in as final payments today?', am:'ዛሬ ስንት ብር የመጨረሻ ክፍያ ገባ?', t:'money',
        auto:{sum:'final_in_list.amount'}, sumEn:'in final payments', sumAm:'በመጨረሻ ክፍያ'},
      {id:'prod_confirmed', en:'How many production go-aheads did you give Mahelet today?', am:'ዛሬ ለማህሌት ስንት የምርት ፈቃድ ሰጡ?', t:'num',
        auto:{rows:'final_in_list', when:{col:'prod', is:'yes'}}, sumEn:'told to Mahelet', sumAm:'ለማህሌት ተነግረዋል'},
      {id:'pay_any', en:'Did you approve any payment today?', am:'ዛሬ ያጸደቁት ክፍያ አለ?', t:'yesno'},
      {id:'pay_list', en:'Each payment approved today', am:'ዛሬ የጸደቀ እያንዳንዱ ክፍያ', t:'table', addEn:'Add a payment', addAm:'ክፍያ ጨምር',
        show:{f:'pay_any', when:'yes'},
        cols:[
          {id:'to', en:'Paid to', am:'ተከፋይ', t:'text'},
          {id:'for', en:'For (job code or purpose)', am:'ለምን (የሥራ ኮድ ወይም ዓላማ)', t:'text'},
          {id:'amount', en:'Amount', am:'መጠን', t:'money'},
          {id:'kidan', en:'Kidan\'s approval (over 50,000)', am:'የኪዳን ፈቃድ (ከ50,000 በላይ)', t:'yesno'}
        ]},
      {id:'pay_approved', en:'How many payments did you approve today?', am:'ዛሬ ስንት ክፍያዎችን አጸደቁ?', t:'num',
        auto:{rows:'pay_list'}, sumEn:'payments', sumAm:'ክፍያዎች'},
      {id:'pay_value', en:'What is the total value of payments approved today?', am:'ዛሬ የጸደቁት ክፍያዎች ጠቅላላ ዋጋ ስንት ነው?', t:'money',
        auto:{sum:'pay_list.amount'}, sumEn:'approved', sumAm:'ተጽድቋል'},
      {id:'pay_kidan', en:'How many payments over 50,000 Birr went to Kidan for approval?', am:'ከ50,000 ብር በላይ የሆኑ ስንት ክፍያዎች ለኪዳን ፈቃድ ተላኩ?', t:'num',
        auto:{rows:'pay_list', when:{col:'kidan', is:'yes'}}, sumEn:'went to Kidan', sumAm:'ለኪዳን ቀርበዋል'},
      {id:'pay_big_unapproved', en:'How many payments over 50,000 Birr went out without Kidan?', am:'ከ50,000 ብር በላይ ያለኪዳን ፈቃድ የወጡ ክፍያዎች ስንት ናቸው?', t:'num',
        auto:{rows:'pay_list', when:[{col:'amount', gte:50001}, {col:'kidan', is:'no'}]},
        tgt:{op:'lte', v:0, en:'Over 50,000 Birr needs Kidan first', am:'ከ50,000 ብር በላይ የኪዳን ፈቃድ ይጠይቃል'}},
      {id:'pay_big_why', en:'Which ones, and why did they go without his approval?', am:'የትኞቹ ናቸው? ያለእሱ ፈቃድ ለምን ወጡ?', t:'area', show:{f:'pay_big_unapproved', when:'pos'}},
      {id:'pay_kidan_state', en:'Which ones, and has each been approved yet?', am:'የትኞቹ ናቸው? እያንዳንዱ በኪዳን ጸድቋል?', t:'area', show:{f:'pay_kidan', when:'pos'}}
    ]},
    { en:'4 · ZamZam Bank', am:'4 · ዘምዘም ባንክ', fields:[
      {id:'zz_any', en:'Was anything transferred to ZamZam Bank today?', am:'ዛሬ ወደ ዘምዘም ባንክ የተላለፈ ገንዘብ አለ?', t:'yesno'},
      {id:'zz_list', en:'Which approved purchase request does each transfer cover?', am:'እያንዳንዱ ዝውውር የትኛውን የጸደቀ የግዥ ጥያቄ ይሸፍናል?', t:'table', addEn:'Add a transfer', addAm:'ዝውውር ጨምር',
        show:{f:'zz_any', when:'yes'},
        cols:[
          {id:'req', en:'Purchase request', am:'የግዥ ጥያቄ', t:'text'},
          {id:'sup', en:'Supplier', am:'አቅራቢ', t:'text'},
          {id:'amount', en:'Amount', am:'መጠን', t:'money'},
          {id:'match', en:'Same as the approved amount', am:'ከጸደቀው መጠን ጋር እኩል ነው', t:'yesno'}
        ]},
      {id:'zz_transfer', en:'How much was transferred to ZamZam Bank today?', am:'ዛሬ ወደ ዘምዘም ባንክ ስንት ብር ተላለፈ?', t:'money',
        auto:{sum:'zz_list.amount'}, sumEn:'transferred', sumAm:'ተላልፏል'},
      {id:'zz_count', en:'How many transfers was that?', am:'ስንት ዝውውሮች ነበሩ?', t:'num',
        auto:{rows:'zz_list'}, sumEn:'transfers', sumAm:'ዝውውሮች'},
      {id:'zz_off', en:'How many transfers were not the approved amount?', am:'ከጸደቀው መጠን የተለዩ ዝውውሮች ስንት ናቸው?', t:'num',
        auto:{rows:'zz_list', when:{col:'match', is:'no'}}, sumEn:'not the approved amount', sumAm:'ከጸደቀው የተለዩ'},
      {id:'zz_confirmed', en:'Was every cheque written today covered by funds confirmed to Getachew first? (Yes if no cheque today)', am:'ዛሬ የተጻፈ እያንዳንዱ ቼክ ገንዘቡ ለጌታቸው ቀድሞ ተረጋግጦለት ነበር? (ዛሬ ቼክ ካልተጻፈ አዎ)', t:'yesno'},
      {id:'zz_confirmed_why', en:'Which cheque went out before the funds were confirmed, for how much, and why?', am:'ገንዘቡ ሳይረጋገጥ የወጣው የትኛው ቼክ ነው? ስንት ብር? ለምን?', t:'area', show:{f:'zz_confirmed', when:'no'}},
      {id:'zz_register', en:'Is every transfer recorded in the ZamZam Payment Register?', am:'እያንዳንዱ ዝውውር በዘምዘም የክፍያ መዝገብ ተመዝግቧል?', t:'yesno'},
      {id:'zz_register_why', en:'What is missing from the register, and when will it be entered?', am:'ከመዝገቡ የጎደለው ምንድን ነው? መቼ ይገባል?', t:'area', show:{f:'zz_register', when:'no'}},
      {id:'zz_disc', en:'How many ZamZam discrepancies were found today?', am:'ዛሬ በዘምዘም ስንት ልዩነቶች ተገኙ?', t:'num',
        tgt:{op:'lte', v:0, en:'Report to Kidan same day', am:'በዕለቱ ለኪዳን ማሳወቅ'}},
      {id:'zz_disc_what', en:'How much is each, what caused it, who handled it, and was Kidan told today?', am:'እያንዳንዱ ስንት ብር ነው? ምን አመጣው? ማን ያዘው? ዛሬ ለኪዳን ተነግሯል?', t:'area', show:{f:'zz_disc', when:'pos'}}
    ]},
    /* The Job Files opened, the groups created and the production go-aheads
       were counted here and ticked again in the payment rows of section 3,
       which is where they actually happen (the Chairman, 9 Oct 2026). They
       are counted from those rows now, and this section keeps what is its
       own: the final payment requests that went out. */
    { en:'5 · Final payment requests', am:'5 · የመጨረሻ ክፍያ ጥያቄዎች', fields:[
      {id:'final_req_any', en:'Did any final payment request go to a customer today?', am:'ዛሬ ለደንበኛ የተላከ የመጨረሻ ክፍያ ጥያቄ አለ?', t:'yesno'},
      {id:'final_req_list', en:'Which customers, and for how much?', am:'ለየትኞቹ ደንበኞች? ስንት ብር?', t:'table', addEn:'Add a request', addAm:'ጥያቄ ጨምር',
        show:{f:'final_req_any', when:'yes'}, cols:[
          {id:'cust', en:'Customer', am:'ደንበኛ', t:'text'},
          {id:'code', en:'Job code', am:'የሥራ ኮድ', t:'text'},
          {id:'amount', en:'Amount asked', am:'የተጠየቀው መጠን', t:'money'}
        ]},
      {id:'final_req', en:'How many final payment requests went to customers today?', am:'ዛሬ ለደንበኞች ስንት የመጨረሻ ክፍያ ጥያቄዎች ተላኩ?', t:'num',
        auto:{rows:'final_req_list'}, sumEn:'requests out', sumAm:'ጥያቄዎች ተልከዋል'},
      {id:'final_req_value', en:'For how much in total?', am:'በጠቅላላው ስንት ብር?', t:'money',
        auto:{sum:'final_req_list.amount'}, sumEn:'asked for', sumAm:'ተጠይቋል'},
      {id:'prod_list', en:'Which job codes went to production today, and was the final payment confirmed in the bank for each?', am:'ዛሬ የትኞቹ የሥራ ኮዶች ወደ ምርት ገቡ? የእያንዳንዳቸው የመጨረሻ ክፍያ ባንክ መግባቱ ተረጋግጧል?', t:'area', show:{f:'prod_confirmed', when:'pos'}}
    ]},
    { en:'6 · Assembler payments', am:'6 · የገጣጣሚዎች ክፍያ', fields:[
      {id:'asm_res_any', en:'Was money reserved for any assembler payment today?', am:'ዛሬ ለገጣጣሚ ክፍያ የተያዘ ገንዘብ አለ?', t:'yesno'},
      {id:'asm_reserved_list', en:'For which jobs?', am:'ለየትኞቹ ሥራዎች?', t:'table', addEn:'Add job', addAm:'ሥራ ጨምር',
        show:{f:'asm_res_any', when:'yes'},
        cols:[
          {id:'code', en:'Job code', am:'የሥራ ኮድ', t:'text'},
          {id:'amount', en:'Reserved', am:'የተያዘ', t:'money'},
          {id:'slip', en:'Slip given to Elyas', am:'ወረቀቱ ለኤልያስ ተሰጥቷል', t:'yesno'}
        ]},
      {id:'asm_reserved', en:'How much was reserved today for assembler payments?', am:'ዛሬ ለተከላ ሠራተኞች ክፍያ ስንት ብር ተያዘ?', t:'money',
        auto:{sum:'asm_reserved_list.amount'}, sumEn:'reserved', sumAm:'ተይዟል'},
      {id:'asm_slips', en:'How many Payment Confirmation Slips were given out?', am:'ስንት የክፍያ ማረጋገጫ ወረቀቶች ተሰጡ?', t:'num',
        auto:{rows:'asm_reserved_list', when:{col:'slip', is:'yes'}}, sumEn:'slips to Elyas', sumAm:'ወረቀቶች ለኤልያስ'},
      {id:'asm_unreserved', en:'Is any job being installed without its assembler payment reserved?', am:'የገጣጣሚዎች ክፍያ ሳይያዝለት እየተተከለ ያለ ሥራ አለ?', t:'yesno'},
      {id:'asm_unreserved_what', en:'Which job, why was it missed, and when will the money be reserved?', am:'የትኛው ሥራ ነው? ለምን ቀረ? ገንዘቡ መቼ ይያዛል?', t:'area', show:{f:'asm_unreserved', when:'yes'}},
      {id:'asm_rel_any', en:'Was any assembler payment released today?', am:'ዛሬ የተለቀቀ የገጣጣሚ ክፍያ አለ?', t:'yesno'},
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
      {id:'asm_disputes', en:'How many payment disputes are open?', am:'ስንት የክፍያ ክርክሮች ክፍት ናቸው?', t:'num',
        tgt:{op:'lte', v:0, en:'Resolve within 48 hours', am:'በ48 ሰዓት ውስጥ መፍታት'}},
      {id:'asm_disputes_what', en:'Who, about what, open since when, and when will each be settled?', am:'የማን? ስለምን? ከመቼ ጀምሮ? እያንዳንዱ መቼ ይፈታል?', t:'area', show:{f:'asm_disputes', when:'pos'}}
    ]},
    { en:'7 · Job Tracking Board', am:'7 · የሥራ መከታተያ ቦርድ', fields:[
      {id:'board_moved', en:'How many job cards were moved today?', am:'ዛሬ ስንት የሥራ ካርዶች ተንቀሳቀሱ?', t:'num'},
      {id:'board_match', en:'Does the board match the physical Job Files tonight?', am:'ዛሬ ማታ ቦርዱ ከጆብ ፋይሎቹ ጋር ይመሳሰላል?', t:'yesno'},
      /* only asked when the board does not match — it was asked every day,
         and on a day it matched the answer was always nought */
      {id:'board_mismatch', en:'How many mismatches were found today?', am:'ዛሬ ስንት አለመጣጣሞች ተገኙ?', t:'num',
        show:{f:'board_match', when:'no'}},
      {id:'board_mismatch_what', en:'Which job cards, what did not match, who moved them, and was the Chairman told today?', am:'የትኞቹ ካርዶች ናቸው? ምኑ አልተመሳሰለም? ማን አንቀሳቀሳቸው? ዛሬ ለሊቀመንበሩ ተነግሯል?', t:'area', show:{f:'board_mismatch', when:'pos'}}
    ]},
    { en:'8 · Documents', am:'8 · ሰነዶች', fields:[
      {id:'doc_inv', en:'How many supplier invoices were collected today?', am:'ዛሬ ስንት የአቅራቢ ደረሰኞች ተሰበሰቡ?', t:'num'},
      {id:'doc_dn', en:'How many delivery notes were collected today?', am:'ዛሬ ስንት የዕቃ መረከቢያ ወረቀቶች ተሰበሰቡ?', t:'num'},
      {id:'doc_any', en:'Is any document still missing?', am:'ገና የጎደለ ሰነድ አለ?', t:'yesno'},
      {id:'doc_missing_list', en:'Which ones?', am:'የትኞቹ?', t:'table', addEn:'Add a document', addAm:'ሰነድ ጨምር',
        show:{f:'doc_any', when:'yes'},
        cols:[
          {id:'doc', en:'Document', am:'ሰነድ', t:'text'},
          {id:'from', en:'From (supplier or staff)', am:'ከማን (አቅራቢ ወይም ሠራተኛ)', t:'text'},
          {id:'since', en:'Missing since', am:'ከመቼ ጀምሮ', t:'text'},
          {id:'chase', en:'Who is chasing it', am:'የሚከታተለው', t:'text'}
        ]},
      {id:'doc_missing', en:'How many documents are still missing?', am:'እስካሁን ስንት ሰነዶች ጎድለዋል?', t:'num',
        auto:{rows:'doc_missing_list'}, sumEn:'still missing', sumAm:'ገና ጎድለዋል'}
    ]},
    { en:'9 · Problems and solutions', am:'9 · ችግሮችና መፍትሔዎች', fields:[
      {id:'problem', en:'What was the biggest problem today — what caused it, and what is being done (who, by when)?', am:'የዛሬው ትልቁ ችግር ምን ነበር? ምክንያቱ ምንድን ነው? ምን እየተደረገ ነው (በማን፣ እስከ መቼ)?', t:'area', opt:1},
      {id:'need_help', en:'What do you need from another department, and from whom?', am:'ከሌላ ክፍል ምን ያስፈልግዎታል? ከማን?', t:'area', opt:1},
      {id:'need_chair', en:'Do you need a decision from the Chairman?', am:'የሊቀመንበሩ ውሳኔ ያስፈልግዎታል?', t:'yesno'},
      {id:'need_chair_what', en:'What exactly should the Chairman decide, what are the options, and by when?', am:'ሊቀመንበሩ በትክክል ምን እንዲወስኑ ይፈልጋሉ? አማራጮቹ ምንድን ናቸው? እስከ መቼ?', t:'area', show:{f:'need_chair', when:'yes'}}
    ]},
    { en:'10 · Tomorrow', am:'10 · ነገ', fields:[
      {id:'tomorrow', en:'What are your top 3 priorities for tomorrow?', am:'ነገ የሚሠሩ ዋና ሦስት ሥራዎች ምንድን ናቸው?', t:'area'}
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
    { en:'1 · Purchase requests', am:'1 · የግዥ ጥያቄዎች', fields:[
      /* Four counts and a two-box question stood around this list —
         prepared, sent to Selam, approved, returned, and how many carried
         three quotes. Every one of them is a column of the row now (the
         Chairman, 9 Oct 2026), and the row says which job and which
         material, which none of the counts could. */
      {id:'pr_any', en:'Did you prepare any purchase request today?', am:'ዛሬ ያዘጋጁት የግዥ ጥያቄ አለ?', t:'yesno'},
      {id:'pr_list', en:'Each request prepared today', am:'ዛሬ የተዘጋጀ እያንዳንዱ ጥያቄ', t:'table', addEn:'Add a request', addAm:'ጥያቄ ጨምር',
        show:{f:'pr_any', when:'yes'},
        cols:[
          {id:'code', en:'Job code', am:'የሥራ ኮድ', t:'text'},
          {id:'item', en:'Materials', am:'ዕቃዎች', t:'choice', opts:MATERIAL_OPTS},
          {id:'amount', en:'Amount', am:'መጠን', t:'money'},
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
      {id:'pr_ret_why', en:'Which ones, what did Selam find wrong, and when will each go back?', am:'የትኞቹ ናቸው? ሰላም ምን ስህተት አገኘች? እያንዳንዱ መቼ ተስተካክሎ ይመለሳል?', t:'area', show:{f:'pr_ret', when:'pos'}},
      {id:'pr_quotes', en:'How many requests carried 3 or more supplier quotes? (with 3 quotes / all requests)', am:'ስንቱ ጥያቄ 3 እና ከዚያ በላይ የአቅራቢ ፕሮፎርማ ነበረው? (3 ፕሮፎርማ ያላቸው / ሁሉም ጥያቄዎች)', t:'ratio',
        auto:{a:{rows:'pr_list', when:{col:'quotes', gte:3}}, b:{rows:'pr_list'}}},
      {id:'pr_quotes_why', en:'Which requests had fewer than 3 quotes, and why could a third not be found?', am:'ከ3 ያነሰ ፕሮፎርማ የነበራቸው የትኞቹ ናቸው? ሦስተኛው ለምን አልተገኘም?', t:'area', show:{f:'pr_quotes', when:'short'}}
    ]},
    { en:'2 · ZamZam Bank cheques', am:'2 · የዘምዘም ባንክ ቼኮች', fields:[
      {id:'chq_any', en:'Did you issue any ZamZam cheque today?', am:'ዛሬ የሰጡት የዘምዘም ቼክ አለ?', t:'yesno'},
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
        auto:{sum:'chq_list.amount'}, sumEn:'in cheques', sumAm:'በቼክ'},
      {id:'chq_confirmed', en:'Did Selam confirm the funds in ZamZam before every cheque?', am:'ከእያንዳንዱ ቼክ በፊት ሰላም ገንዘቡ ዘምዘም መግባቱን አረጋግጣለች?', t:'yesno'},
      {id:'chq_confirmed_why', en:'Which cheque went out without confirmation, for how much, to whom, and why?', am:'ያለማረጋገጫ የተሰጠው የትኛው ቼክ ነው? በስንት ብር? ለማን? ለምን?', t:'area', show:{f:'chq_confirmed', when:'no'}},
      {id:'chq_match', en:'Was every cheque for the approved amount, to the approved supplier?', am:'እያንዳንዱ ቼክ በጸደቀው መጠንና ለጸደቀው አቅራቢ ነበር?', t:'yesno'},
      {id:'chq_match_why', en:'Which cheque differed, how, and who allowed it?', am:'የተለየው የትኛው ቼክ ነው? በምን ተለየ? ማን ፈቀደ?', t:'area', show:{f:'chq_match', when:'no'}},
      {id:'chq_secure', en:'Was the cheque book locked away at close?', am:'የቼክ ደብተሩ በመዝጊያ ሰዓት ተቆልፎበታል?', t:'yesno'},
      {id:'chq_secure_why', en:'Where was it, who could reach it, and is it locked away now?', am:'የት ነበር? ማን ሊደርስበት ይችል ነበር? አሁን ተቆልፎበታል?', t:'area', show:{f:'chq_secure', when:'no'}}
    ]},
    { en:'3 · Orders placed', am:'3 · የተሰጡ ትዕዛዞች', fields:[
      {id:'ord_any', en:'Did you place any order today?', am:'ዛሬ የሰጡት ትዕዛዝ አለ?', t:'yesno'},
      {id:'ord_list', en:'Each order, and the delivery date the supplier promised', am:'እያንዳንዱ ትዕዛዝና አቅራቢው ቃል የገባው የመድረሻ ቀን', t:'table', addEn:'Add an order', addAm:'ትዕዛዝ ጨምር',
        show:{f:'ord_any', when:'yes'},
        cols:[
          {id:'sup', en:'Supplier', am:'አቅራቢ', t:'text'},
          {id:'code', en:'Job code', am:'የሥራ ኮድ', t:'text'},
          {id:'item', en:'Material', am:'ዕቃ', t:'choice', opts:MATERIAL_OPTS},
          {id:'amount', en:'Amount', am:'መጠን', t:'money'},
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
      {id:'ord_suppliers', en:'With which suppliers?', am:'ከየትኞቹ አቅራቢዎች?', t:'text',
        auto:{list:'ord_list.sup'}}
    ]},
    { en:'4 · Supplier credit', am:'4 · የአቅራቢ ዱቤ', fields:[
      {id:'cr_owed', en:'How much does Klever owe suppliers on credit right now, in total?', am:'ክሌቨር አሁን ለአቅራቢዎች በዱቤ በጠቅላላ ስንት ብር አለበት?', t:'money', parts:{of:['cr_overdue']}},
      {id:'cr_paid_any', en:'Did you pay back any earlier credit today?', am:'ዛሬ ቀድሞ የተወሰደ ዱቤ ከፍለዋል?', t:'yesno'},
      {id:'cr_paid_list', en:'Which suppliers were paid, and with which cheque?', am:'የትኞቹ አቅራቢዎች ተከፈላቸው? በየትኛው ቼክ?', t:'table', addEn:'Add a payment', addAm:'ክፍያ ጨምር',
        show:{f:'cr_paid_any', when:'yes'}, cols:[
          {id:'sup', en:'Supplier', am:'አቅራቢ', t:'text'},
          {id:'amount', en:'Amount', am:'መጠን', t:'money'},
          {id:'chq', en:'Cheque no.', am:'የቼክ ቁጥር', t:'text'}
        ]},
      {id:'cr_paid', en:'How much earlier credit did you pay back today, by cheque?', am:'ዛሬ ቀድሞ የተወሰደ ዱቤ ስንት ብር በቼክ ተከፈለ?', t:'money',
        auto:{sum:'cr_paid_list.amount'}, sumEn:'paid back', sumAm:'ተመልሷል'},
      {id:'cr_overdue', en:'How much of what we owe is past the date we promised to pay?', am:'ካለብን ዕዳ ውስጥ ለመክፈል ቃል የገባንበት ቀን ያለፈው ስንት ነው?', t:'money',
        tgt:{op:'lte', v:0, en:'Should be 0 — a supplier owed past the date can stop delivering',
             am:'ዜሮ መሆን አለበት — ቀኑ ያለፈበት አቅራቢ ዕቃ ማቅረብ ሊያቆም ይችላል'}},
      {id:'cr_overdue_list', en:'Which suppliers are owed past the date, how much, and why not paid?', am:'ቀኑ ያለፈባቸው አቅራቢዎች እነማን ናቸው? ስንት ብር? ለምን አልተከፈለም?', t:'table', addEn:'Add a supplier', addAm:'አቅራቢ ጨምር',
        show:{f:'cr_overdue', when:'miss'}, cols:[
          {id:'sup', en:'Supplier', am:'አቅራቢ', t:'text'},
          {id:'amount', en:'Amount', am:'መጠን', t:'money'},
          {id:'due', en:'Was due', am:'የሚከፈልበት ቀን', t:'text'},
          {id:'why', en:'Why not paid', am:'ለምን አልተከፈለም', t:'text'}
        ]}
    ]},
    { en:'5 · Deliveries', am:'5 · የገባ ዕቃ', fields:[
      /* How many deliveries reached the store was asked of the store too, on
         the same day, about the same lorries (the Chairman, 9 Oct 2026). It
         is Yordanos's count — she signs for them. What is Getachew's is the
         chase afterwards: a rejection is his to put right with the supplier. */
      {id:'del_rej_any', en:'Did the store reject anything you ordered today?', am:'ዛሬ ካዘዙት ዕቃ መጋዘኑ ያልተቀበለው አለ?', t:'yesno'},
      {id:'del_rej_list', en:'What was rejected, and what happens next?', am:'ምን ውድቅ ተደረገ? ቀጥሎ ምን ይሆናል?', t:'table', addEn:'Add a rejected item', addAm:'ዕቃ ጨምር',
        show:{f:'del_rej_any', when:'yes'},
        cols:[
          {id:'item', en:'Material', am:'ዕቃ', t:'choice', opts:MATERIAL_OPTS},
          {id:'sup', en:'Supplier', am:'አቅራቢ', t:'text'},
          {id:'code', en:'Job code', am:'የሥራ ኮድ', t:'text'},
          {id:'why', en:'Reason', am:'ምክንያት', t:'text'},
          {id:'asked', en:'Supplier asked for a replacement or refund?', am:'አቅራቢው ምትክ ወይም ተመላሽ ተጠይቋል?', t:'yesno'},
          {id:'fix', en:'Replacement or refund, and when', am:'ምትክ ወይም ተመላሽ፣ መቼ', t:'text'}
        ]},
      {id:'del_rej', en:'How many materials did the store reject?', am:'መጋዘኑ ስንት ዕቃ አልተቀበለም?', t:'num',
        auto:{rows:'del_rej_list'}, sumEn:'rejected', sumAm:'ውድቅ ተደርገዋል'},
      {id:'del_repl', en:'Has the supplier been asked for a replacement or refund?', am:'አቅራቢው ምትክ ወይም ተመላሽ እንዲሰጥ ተጠይቋል?', t:'yesno',
        auto:{all:'del_rej_list.asked'}}
    ]},
    { en:'6 · Documents to Selam', am:'6 · ለሰላም የተላኩ ሰነዶች', fields:[
      {id:'doc_24', en:'How many purchase documents reached Selam within 24 hours? (on time / all due)', am:'ስንት የግዥ ሰነዶች በ24 ሰዓት ውስጥ ለሰላም ደረሱ? (በሰዓቱ / መድረስ የነበረባቸው)', t:'ratio'},
      {id:'doc_any', en:'Is any purchase document still outstanding?', am:'ገና ያልቀረበ የግዥ ሰነድ አለ?', t:'yesno'},
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
      {id:'doc_missing', en:'How many documents are still outstanding?', am:'እስካሁን ያልቀረቡ ሰነዶች ስንት ናቸው?', t:'num',
        auto:{rows:'doc_missing_list'},
        tgt:{op:'lte', v:0, en:'–200 Birr per document', am:'በሰነድ –200 ብር'}}
    ]},
    { en:'7 · Supplier issues', am:'7 · የአቅራቢ ችግሮች', fields:[
      {id:'sup_delay_any', en:'Is any supplier delivery late?', am:'የዘገየ የአቅራቢ ጭነት አለ?', t:'yesno'},
      {id:'sup_delay_list', en:'Which deliveries are late?', am:'የዘገዩት የትኞቹ ርክክቦች ናቸው?', t:'table', addEn:'Add a delay', addAm:'መዘግየት ጨምር',
        show:{f:'sup_delay_any', when:'yes'},
        cols:[
          {id:'sup', en:'Supplier', am:'አቅራቢ', t:'text'},
          {id:'code', en:'Job code', am:'የሥራ ኮድ', t:'text'},
          {id:'item', en:'Material', am:'ዕቃ', t:'choice', opts:MATERIAL_OPTS},
          {id:'was', en:'Promised date', am:'ቃል የተገባው ቀን', t:'text'},
          {id:'now', en:'New date', am:'አዲሱ ቀን', t:'text'},
          {id:'stops', en:'Holds up production?', am:'ምርት ያቆማል?', t:'yesno'}
        ]},
      {id:'sup_delay', en:'How many supplier delays were there today?', am:'ዛሬ ስንት የአቅራቢ መዘግየት ነበር?', t:'num',
        auto:{rows:'sup_delay_list'}, sumEn:'late deliveries', sumAm:'የዘገዩ ርክክቦች'},
      {id:'sup_delay_stop', en:'How many of them hold up production?', am:'ከነሱ ስንቱ ምርት ያቆማል?', t:'num',
        auto:{rows:'sup_delay_list', when:{col:'stops', is:'yes'}}, sumEn:'holding up production', sumAm:'ምርት የሚያቆሙ'},
      /* counted from the price list in section 8, where the old price and the
         new one are written side by side */
      {id:'sup_price', en:'How many suppliers put a price up today?', am:'ዛሬ ስንት አቅራቢዎች ዋጋ ጨመሩ?', t:'num',
        auto:{rows:'p_rows', when:{col:'pchg', pos:1}}, sumEn:'put a price up', sumAm:'ዋጋ ጨምረዋል'},
      {id:'sup_price_what', en:'Which suppliers, on what material, and from what price to what?', am:'የትኞቹ አቅራቢዎች? በየትኛው ዕቃ? ከስንት ወደ ስንት?', t:'area', show:{f:'sup_price', when:'pos'}},
      {id:'sup_quality', en:'How many quality problems came from suppliers today?', am:'ዛሬ ከአቅራቢዎች ስንት የጥራት ችግር መጣ?', t:'num'},
      {id:'sup_quality_what', en:'Which supplier, what was wrong, and what have they agreed to do?', am:'የትኛው አቅራቢ? ምን ችግር ነበር? ምን ለማድረግ ተስማሙ?', t:'area', show:{f:'sup_quality', when:'pos'}},
      {id:'sup_reported', en:'Were Mahelet and Selam told of every issue the same day?', am:'እያንዳንዱ ችግር ለማህሌትና ለሰላም በዚያው ቀን ተነግሯል?', t:'yesno'},
      {id:'sup_reported_why', en:'Which issue was not reported, and why?', am:'ያልተነገረው የትኛው ችግር ነው? ለምን?', t:'area', show:{f:'sup_reported', when:'no'}}
    ]},
    { en:'8 · What we paid, against last time', am:'8 · ካለፈው ጋር ሲነጻጸር የከፈልነው', fields:[
      {id:'p_rows', en:'Each material bought today, with its price against last time', am:'ዛሬ የተገዛ እያንዳንዱ ዕቃ፣ ከቀድሞው ዋጋው ጋር',
       t:'table', addEn:'Add material', addAm:'ዕቃ ጨምር', cols:[
        {id:'pitem', en:'Material', am:'ዕቃ', t:'choice', opts:MATERIAL_OPTS},
        {id:'psup',  en:'Supplier', am:'አቅራቢ', t:'text'},
        {id:'punit', en:'Unit', am:'መለኪያ', t:'text'},
        {id:'pnow',  en:'Price now', am:'የአሁን ዋጋ', t:'money'},
        {id:'plast', en:'Price last time', am:'ያለፈው ዋጋ', t:'money'},
        {id:'pchg',  en:'Change %', am:'ለውጥ %', t:'pct'},
        {id:'pquot', en:'Quotes compared', am:'የተነጻጸሩ ዋጋዎች', t:'num'}
      ]},
      {id:'p_up', en:'How many materials went up more than 10%?', am:'ስንት ዕቃዎች ከ10% በላይ ጨመሩ?', t:'num',
        auto:{rows:'p_rows', when:{col:'pchg', gte:10}}, sumEn:'up more than 10%', sumAm:'ከ10% በላይ ጨምረዋል',
        tgt:{op:'lte', v:0, en:'The margin floor is 6,000 Birr/m² — a 10% rise must reach Ephrata before the next quote',
             am:'የትርፍ ወለሉ 6,000 ብር/ካሬ ሜትር ነው — የ10% ጭማሪ ከቀጣዩ ዋጋ በፊት ኤፍራታ ጋር መድረስ አለበት'}},
      {id:'p_up_what', en:'Which materials, by how much, and which open quotations does it affect?', am:'የትኞቹ ዕቃዎች? በስንት ጨመሩ? የትኞቹን ክፍት ፕሮፎርማዎች ይነካል?', t:'area', show:{f:'p_up', when:'pos'}},
      {id:'p_told', en:'If any, were Ephrata and Selam told today?', am:'ካሉ ለኤፍራታና ለሰላም ዛሬ ተነግሯል?', t:'yesno', opt:1, i:1},
      {id:'p_sub', en:'Was any material swapped for a cheaper one?', am:'ማንኛውም ዕቃ በርካሽ ተተክቷል?', t:'yesno'},
      {id:'p_sub_what', en:'What was swapped for what, on which job, and why?', am:'ምን በምን ተተካ? በየትኛው ሥራ? ለምን?', t:'area', show:{f:'p_sub', when:'yes'}},
      {id:'p_subok', en:'If yes, did Wude approve it before it was bought?', am:'አዎ ከሆነ ውዱ ከመገዛቱ በፊት አጽድቃለች?', t:'yesno', opt:1, i:1}
    ]},
    { en:'9 · Problems and solutions', am:'9 · ችግሮችና መፍትሔዎች', fields:[
      {id:'problem', en:'What was the biggest problem today — what caused it, and what is being done (who, by when)?', am:'የዛሬው ትልቁ ችግር ምን ነበር? ምክንያቱ ምንድን ነው? ምን እየተደረገ ነው (በማን፣ እስከ መቼ)?', t:'area', opt:1},
      {id:'need_help', en:'What do you need from Mahelet, Selam or the store, and by when?', am:'ከማህሌት፣ ከሰላም ወይም ከመጋዘን ምን ያስፈልግዎታል? እስከ መቼ?', t:'area', opt:1},
      {id:'need_chair', en:'Do you need a decision from the Chairman?', am:'የሊቀመንበሩ ውሳኔ ያስፈልግዎታል?', t:'yesno'},
      {id:'need_chair_what', en:'What exactly should he decide, what are the options, and by when?', am:'በትክክል ምን እንዲወስኑ ይፈልጋሉ? አማራጮቹ ምንድን ናቸው? እስከ መቼ?', t:'area', show:{f:'need_chair', when:'yes'}}
    ]},
    { en:'10 · Tomorrow', am:'10 · ነገ', fields:[
      {id:'tomorrow', en:'What must be bought or chased tomorrow, and for which jobs?', am:'ነገ ምን መገዛት ወይም መከታተል አለበት? ለየትኞቹ ሥራዎች?', t:'area'}
    ]}
  ]
},

/* =========================== YORDANOS — DAILY =========================== */
{
  id:'yordanos-daily', person:'yordanos', cadence:'daily', dueTime:'17:30',
  en:'Daily Store Report', am:'ዕለታዊ የመጋዘን ሪፖርት',
  toEn:'Chairman, copied to Mahelet and Selam', toAm:'ሊቀመንበር፣ ግልባጭ ለማህሌትና ለሰላም',
  dueEn:'5:30 PM every working day', dueAm:'በየሥራ ቀኑ ከቀኑ 11፡30 (5:30 PM)',
  penEn:'Reports are mandatory daily', penAm:'ሪፖርት በየቀኑ ግዴታ ነው',
  derived:1,
  sections:[
    /* The list is the answer. Six figures used to stand around it — how many
       came in, how many were checked, how many taken in, how many rejected,
       how many notes signed — and every one of them was in the rows already
       (the Chairman, 9 Oct 2026: the questions repeat themselves). They are
       counted from the rows now, under the table, and the row carries what
       the figures could not: which supplier, which job, what it was. */
    { en:'1 · Receiving', am:'1 · ዕቃ መረከብ', fields:[
      {id:'rec_any', en:'Did any delivery reach the store today?', am:'ዛሬ ወደ መጋዘን የደረሰ ጭነት አለ?', t:'yesno'},
      {id:'rec_list', en:'Each delivery that came in today — one row each',
       am:'ዛሬ የደረሰ እያንዳንዱ ፃነት — በረድፍ አንድ', t:'table', addEn:'Add a delivery', addAm:'ፃነት ጨምር',
        show:{f:'rec_any', when:'yes'},
        cols:[
          {id:'sup', en:'Supplier', am:'አቅራቢ', t:'text'},
          {id:'code', en:'Job code', am:'የሥራ ኮድ', t:'text'},
          {id:'item', en:'Material', am:'ዕቃ', t:'choice', opts:MATERIAL_OPTS},
          {id:'qty', en:'Quantity', am:'ብዛት', t:'num'},
          /* one tap where there used to be two questions and a ratio: whether
             it was checked at all, and whether it matched */
          {id:'ok', en:'Against the Job File / BOM', am:'ከጆብ ፋይል / BOM አንጻር', t:'choice', opts:[
            {v:'yes',  en:'Checked — matches the BOM',      am:'ተረጋግጧል — ከBOM ጋር ይስማማል'},
            {v:'diff', en:'Checked — does not match',       am:'ተረጋግጧል — አይስማማም'},
            {v:'no',   en:'Not checked',                    am:'አልተመሳከረም'}
          ]},
          {id:'take', en:'Taken in, or rejected?', am:'ገባ ወይስ ውድቅ ተደረገ?', t:'choice', opts:[
            {v:'in',   en:'Taken into the store', am:'ወደ መጋዘን ገባ'},
            {v:'part', en:'Part taken in',        am:'በከፊል ገባ'},
            {v:'out',  en:'Rejected',             am:'ውድቅ ተደረገ'}
          ]},
          {id:'why', en:'If rejected or short: why', am:'ውድቅ ከሆነ ወይም ከጎደለ፦ ለምን', t:'text'},
          {id:'grn', en:'Goods received note signed?', am:'የዕቃ መረከቢያ ወረቀት ተፈርሟል?', t:'yesno'}
        ]},
      {id:'rec_deliv', en:'How many deliveries came into the store today?', am:'ዛሬ ስንት ጭነት ወደ መጋዘን ገባ?', t:'num',
        auto:{rows:'rec_list'}, sumEn:'deliveries', sumAm:'ርክክቦች'},
      {id:'rec_accepted', en:'How many of them were accepted into the store?', am:'ከነሱ ስንቱ ርክክቦች ወደ መጋዘን ገቡ?', t:'num',
        auto:{rows:'rec_list', when:{col:'take', not:'out'}}, sumEn:'taken in', sumAm:'ገብተዋል'},
      {id:'rec_rejected', en:'How many of them did you reject?', am:'ከነሱ ስንቱን ርክክቦች ውድቅ አደረጉ?', t:'num',
        auto:{rows:'rec_list', when:{col:'take', is:'out'}}, sumEn:'rejected', sumAm:'ውድቅ ተደርገዋል'},
      {id:'rec_grn', en:'How many goods received notes did you sign?', am:'ስንት የዕቃ መረከቢያ ወረቀት ፈረሙ?', t:'num',
        auto:{rows:'rec_list', when:{col:'grn', is:'yes'}}, sumEn:'notes signed', sumAm:'ወረቀቶች ተፈርመዋል'},
      /* "how many" of what? They are deliveries (the Chairman, 9 Oct 2026) */
      {id:'rec_checked', en:'How many of those deliveries were checked against the Job File / BOM? (checked / delivered)', am:'ከነዚህ ርክክቦች ስንቱ ከጆብ ፋይል / BOM ጋር ተተረጋገጡ? (የተረጋገጡ / የደረሱ)', t:'ratio',
        auto:{a:{rows:'rec_list', when:{col:'ok', not:'no'}}, b:{rows:'rec_list'}},
        sumEn:'checked against the BOM', sumAm:'ከBOM ጋር ተመሳክረዋል'},
      {id:'rec_bom_off', en:'How many did not match the BOM?', am:'ከBOM ጋር ያልተስማሙ ስንት ናቸው?', t:'num',
        auto:{rows:'rec_list', when:{col:'ok', is:'diff'}}, sumEn:'did not match', sumAm:'አልተስማሙም'},
      {id:'rec_checked_why', en:'Which deliveries went in unchecked, and why?', am:'ሳይመሳከሩ የገቡት የትኞቹ ርክክቦች ናቸው? ለምን?', t:'area', show:{f:'rec_checked', when:'short'}}
    ]},
    /* only asked when a row says something was rejected; the what, the
       supplier and the why are in that row already */
    { en:'2 · Anything rejected today', am:'2 · ዛሬ ውድቅ የተደረጉ ዕቃዎች', fields:[
      {id:'rej_photo', en:'Was each rejection photographed?', am:'ውድቅ የተደረገው እያንዳንዱ ዕቃ ፎቶ ተነስቷል?', t:'yesno', show:{f:'rec_rejected', when:'pos'}},
      {id:'rej_reported', en:'Were Getachew and Selam told the same day?', am:'ለጌታቸውና ለሰላም በዚያው ቀን ተነግሯል?', t:'yesno', show:{f:'rec_rejected', when:'pos'}}
    ]},
    /* the four totals that used to stand here added sheets, hinges and
       metres of edge banding into one number (the Chairman, 9 Oct 2026:
       "went out what?"). What goes in and out is counted material by
       material on the shelf grid below, where it can be added up. */
    { en:'3 · The record against the shelf', am:'3 · መዝገቡ ከመደርደሪያው ጋር', fields:[
      {id:'st_any', en:'Did anything on the shelf not match the record today?', am:'ዛሬ በመደርደሪያው ላይ ከመዝገቡ ጋር ያልተስማማ ነገር አለ?', t:'yesno'},
      {id:'st_disc_list', en:'What does not match?', am:'የማይስማማው ምንድን ነው?', t:'table', addEn:'Add an item', addAm:'ዕቃ ጨምር',
        show:{f:'st_any', when:'yes'},
        cols:[
          {id:'item', en:'Material', am:'ዕቃ', t:'choice', opts:MATERIAL_OPTS},
          {id:'book', en:'On record', am:'በመዝገብ', t:'num'},
          {id:'shelf', en:'On the shelf', am:'በመደርደሪያ', t:'num'},
          {id:'why', en:'Likely reason', am:'ሊሆን የሚችል ምክንያት', t:'text'},
          {id:'told', en:'Mahelet and Selam told today?', am:'ለማህሌትና ለሰላም ዛሬ ተነግሯል?', t:'yesno'}
        ]},
      {id:'st_disc', en:'How many differences did you find between the record and the shelf?', am:'በመዝገቡና በመደርደሪያው መካከል ስንት ልዩነት ተገኘ?', t:'num',
        auto:{rows:'st_disc_list'},
        tgt:{op:'lte', v:0, en:'–500 Birr each · report same day', am:'እያንዳንዱ –500 ብር · በዕለቱ ማሳወቅ'}}
    ]},
    /* What went out used to be one number and two yes/nos covering the whole
       day, so "something went out without approval" never said what, to whom
       or for which job. A row an issue answers all three, and the three
       figures below come out of the rows. */
    { en:'4 · Issuing materials', am:'4 · ዕቃ ማውጣት', fields:[
      {id:'iss_any', en:'Did anything go out of the store today?', am:'ዛሬ ከመጋዘን የወጣ ዕቃ አለ?', t:'yesno'},
      {id:'iss_list', en:'Each issue out of the store today — one row each',
       am:'ዛሬ ከመጋዘን የወጣ እያንዳንዱ ዕቃ — በረድፍ አንድ', t:'table', addEn:'Add an issue', addAm:'የወጣ ዕቃ ጨምር',
        show:{f:'iss_any', when:'yes'},
        cols:[
          {id:'item', en:'Material', am:'ዕቃ', t:'choice', opts:MATERIAL_OPTS},
          {id:'qty', en:'Quantity', am:'ብዛት', t:'num'},
          {id:'code', en:'For which job', am:'ለየትኛው ሥራ', t:'text'},
          {id:'who', en:'Taken by', am:'የወሰደው', t:'text'},
          {id:'appr', en:'Mahelet\'s signed approval?', am:'የማህሌት ፊርማ ፈቃድ አለው?', t:'yesno'},
          {id:'right', en:'Went to the job it was meant for?', am:'ለታሰበለት ሥራ ሄዷል?', t:'yesno'}
        ]},
      {id:'iss_count', en:'How many times were materials issued today?', am:'ዛሬ ስንት ጊዜ ዕቃ ከመጋዘን ወጣ?', t:'num',
        auto:{rows:'iss_list'}, sumEn:'issues', sumAm:'የወጡ'},
      {id:'iss_approved', en:'Did every issue carry Mahelet\'s signed approval?', am:'እያንዳንዱ ዕቃ በማህሌት ፊርማ ፈቃድ ወጥቷል?', t:'yesno',
        auto:{all:'iss_list.appr'}},
      {id:'iss_approved_why', en:'What went out without it, to whom, for which job, and who allowed it?', am:'ያለፈቃድ የወጣው ምንድን ነው? ለማን? ለየትኛው ሥራ? ማን ፈቀደ?', t:'area', show:{f:'iss_approved', when:'no'}},
      {id:'iss_correct', en:'Did everything go to the correct job?', am:'ሁሉም ለትክክለኛው ሥራ ወጥቷል?', t:'yesno',
        auto:{all:'iss_list.right'}},
      {id:'iss_correct_why', en:'What went to the wrong job, and has it been put right?', am:'ወደ ተሳሳተ ሥራ የሄደው ምንድን ነው? ተስተካክሏል?', t:'area', show:{f:'iss_correct', when:'no'}},
      {id:'con_today', en:'How many consumable items were issued today?', am:'ዛሬ ስንት የፍጆታ ዕቃ ወጣ?', t:'num',
        auto:{sum:'iss_list.qty', when:{col:'item', is:'Consumables'}}, sumEn:'of them consumables', sumAm:'ከነሱ ፍጆታ ዕቃዎች'}
    ]},
    { en:'5 · Shortages', am:'5 · እጥረቶች', fields:[
      {id:'sh_any', en:'Did you have to flag a shortage today?', am:'ዛሬ እጥረት ማሳወቅ አስፈልጓል?', t:'yesno'},
      {id:'sh_list', en:'Which materials are short?', am:'የትኞቹ ዕቃዎች አጥረዋል?', t:'table', addEn:'Add a shortage', addAm:'እጥረት ጨምር',
        show:{f:'sh_any', when:'yes'},
        cols:[
          {id:'item', en:'Material', am:'ዕቃ', t:'choice', opts:MATERIAL_OPTS},
          {id:'code', en:'Jobs waiting on it', am:'የሚጠብቁት ሥራዎች', t:'text'},
          {id:'told', en:'Told to', am:'የተነገረው ለ', t:'text'},
          {id:'due', en:'Expected in', am:'የሚጠበቅበት ቀን', t:'date'}
        ]},
      {id:'sh_flagged', en:'How many shortages did you flag today?', am:'ዛሬ ስንት እጥረት ጠቆሙ?', t:'num',
        auto:{rows:'sh_list'}, sumEn:'shortages flagged', sumAm:'የታወቁ እጥረቶች'},
      /* named, not counted: the morning agents and the Chairman's line read
         which materials are short and who is waiting on whom, and the rows
         already say both (apps-script/Agents.js WAIT_FIELDS_) */
      {id:'sh_what', en:'Which materials are short?', am:'የትኞቹ ዕቃዎች አጥረዋል?', t:'text',
        auto:{list:'sh_list.item'}},
      {id:'sh_flagged_who', en:'Who was told, and when is each expected in?', am:'ለማን ተነገረ? እያንዳንዱ መቼ ይደርሳል?', t:'text',
        auto:{list:'sh_list.told'}},
      {id:'sh_stopped', en:'Did production stop today because something ran out?', am:'ዛሬ አንድ ዕቃ በማለቁ ምርት ቆሟል?', t:'yesno'},
      {id:'sh_stopped_what', en:'Which job stopped, for how long, and had the shortage been flagged before?', am:'የትኛው ሥራ ቆመ? ለምን ያህል ጊዜ? እጥረቱ ቀድሞ ተነግሮ ነበር?', t:'area', show:{f:'sh_stopped', when:'yes'}}
    ]},
    { en:'6 · Factory consumables', am:'6 · የፋብሪካ ፍጆታ ዕቃዎች', fields:[
      {id:'con_mtd', en:'How much has been spent on consumables this month so far?', am:'በዚህ ወር እስካሁን ለፍጆታ ዕቃ ስንት ብር ወጣ?', t:'money',
        tgt:{op:'lte', v:30000, en:'Budget 30,000 Birr/month', am:'የወር በጀት 30,000 ብር'}},
      {id:'con_mtd_why', en:'The month is over 30,000 Birr. What drove it, and has the Chairman approved the extra?', am:'የወሩ ወጪ ከ30,000 ብር አልፏል። ምን አሳደገው? ተጨማሪውን ሊቀመንበሩ አጽድቀዋል?', t:'area', show:{f:'con_mtd', when:'miss'}}
    ]},
    { en:'7 · Store condition', am:'7 · የመጋዘን ሁኔታ', fields:[
      {id:'sec_locked', en:'Was the store locked and secure at close?', am:'መጋዘኑ በመዝጊያ ሰዓት ተቆልፎ ደህንነቱ ተጠብቆ ነበር?', t:'yesno'},
      {id:'sec_locked_why', en:'Why not, and who holds the key tonight?', am:'ለምን? ዛሬ ማታ ቁልፉ ማን ጋር ነው?', t:'area', show:{f:'sec_locked', when:'no'}},
      {id:'sec_theft', en:'Was anything stolen or taken out without permission?', am:'የተሰረቀ ወይም ያለፈቃድ የወጣ ዕቃ አለ?', t:'yesno'},
      {id:'sec_theft_what', en:'What, how much is it worth, who is involved, and were Mahelet and Selam told?', am:'ምን? ዋጋው ስንት ነው? ማን ተሳትፏል? ለማህሌትና ለሰላም ተነግሯል?', t:'area', show:{f:'sec_theft', when:'yes'}},
      {id:'sec_sep', en:'Are job materials kept apart from consumables?', am:'የሥራ ዕቃዎች ከፍጆታ ዕቃዎች ተለይተው ተቀምጠዋል?', t:'yesno'}
    ]},
    { en:'8 · What is on the shelf, and how long it lasts', am:'8 · በመጋዘን ያለውና ምን ያህል እንደሚቆይ', fields:[
      {id:'k_stock', en:'For each material: how much is on hand at close, how much went out today, and how many days will it last?',
       am:'ለእያንዳንዱ ዕቃ፦ በመዝጊያ ሰዓት ስንት አለ? ዛሬ ስንት ወጣ? ለስንት ቀን ይበቃል?',
       t:'grid', rows:[
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
        {en:'Glue and screws', am:'ሙጫና ብሎኖች'}
      ], cols:[
        {id:'qty',  en:'On hand', am:'በእጅ ያለ', t:'num'},
        {id:'out', en:'Out today', am:'ዛሬ የወጣ', t:'num'},
        {id:'days', en:'Days of cover', am:'የሚበቃበት ቀን', t:'num'}
      ]},
      {id:'k_low', en:'Will anything run out in 5 days or less?', am:'በ5 ቀን ወይም ከዚያ በፊት የሚያልቅ ዕቃ አለ?', t:'yesno',
        tgt:{op:'lte', v:0, en:'Anything this low has to reach Getachew today, not tomorrow',
             am:'ይህን ያህል ያነሰ ዛሬ ለጌታቸው መድረስ አለበት'}},
      {id:'k_which', en:'If yes: which, and was Getachew told today?', am:'አዎ ከሆነ የትኛው? ለጌታቸው ዛሬ ተነግሯል?', t:'area', opt:1, i:1},
      {id:'k_offin', en:'How many m² of offcuts came back from the factory today?', am:'ዛሬ ከፋብሪካ ስንት ካሬ ሜትር ቁራጭ ተመለሰ?', t:'num'},
      {id:'k_offout', en:'How many m² of offcuts went back out for a job?', am:'ስንት ካሬ ሜትር ቁራጭ ለሥራ ተመልሶ ወጣ?', t:'num'}
    ]},
    { en:'9 · Problems and solutions', am:'9 · ችግሮችና መፍትሔዎች', fields:[
      {id:'problem', en:'What was the biggest problem in the store today — what caused it, and what is being done (who, by when)?', am:'በመጋዘኑ የዛሬው ትልቁ ችግር ምን ነበር? ምክንያቱ ምንድን ነው? ምን እየተደረገ ነው (በማን፣ እስከ መቼ)?', t:'area', opt:1},
      {id:'need_help', en:'What do you need from Mahelet, Getachew or Selam, and by when?', am:'ከማህሌት፣ ከጌታቸው ወይም ከሰላም ምን ያስፈልግዎታል? እስከ መቼ?', t:'area', opt:1},
      {id:'need_chair', en:'Do you need a decision from the Chairman?', am:'የሊቀመንበሩ ውሳኔ ያስፈልግዎታል?', t:'yesno'},
      {id:'need_chair_what', en:'What exactly should he decide, what are the options, and by when?', am:'በትክክል ምን እንዲወስኑ ይፈልጋሉ? አማራጮቹ ምንድን ናቸው? እስከ መቼ?', t:'area', show:{f:'need_chair', when:'yes'}}
    ]},
    { en:'10 · Tomorrow', am:'10 · ነገ', fields:[
      {id:'tomorrow', en:'What must be received, counted or chased tomorrow?', am:'ነገ ምን መረከብ፣ መቆጠር ወይም መከታተል አለበት?', t:'area'}
    ]}
  ]
},

/* ========================= EPHRATA — WEEKLY ========================= */
{
  id:'ephrata-weekly', person:'ephrata', cadence:'weekly', dueTime:'16:00', dueDay:6,
  en:'Weekly Commercial Report', am:'ሳምንታዊ የንግድ ሪፖርት',
  toEn:'Chairman', toAm:'ሊቀመንበር',
  dueEn:'Saturday 4:00 PM', dueAm:'ቅዳሜ ከቀኑ 10፡00 (4:00 PM)',
  penEn:'Late or not sent –500 Birr', penAm:'ዘግይቶ ወይም ካልቀረበ –500 ብር',
  sections:[
    { en:'1 · Sales performance', am:'1 · ሽያጭ እንዴት ሄደ', fields:[
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
      {id:'w_external', en:'How much was collected from external customers this week?', am:'በዚህ ሳምንት ከውጭ ደንበኞች ስንት ብር ተሰበሰበ?', t:'money',
        tgt:{op:'gte', v:3000000, en:'Below 3,000,000 Birr is a failed week — no commission',
             am:'ከ3,000,000 ብር በታች ከሆነ ሳምንቱ ወድቋል — ኮሚሽን የለም'}},
      {id:'w_external_why', en:'Why is the week below 3,000,000 Birr? Was the cause beyond your control (holiday, supplier shutdown, customer refusal)?', am:'ሳምንቱ ለምን ከ3,000,000 ብር በታች ሆነ? ምክንያቱ ከቁጥጥርዎ ውጭ ነበር? (በዓል፣ የአቅራቢ መዘጋት፣ የደንበኛ እምቢታ)', t:'area', show:{f:'w_external', when:'miss'}},
      {id:'w_internal', en:'How much came in from internal (sister-company) work this week?', am:'በዚህ ሳምንት ከውስጥ (ከእህት ኩባንያ) ሥራ ስንት ብር ገባ?', t:'money'},
      {id:'w_target_met', en:'Did the week reach the 6,000,000 Birr target?', am:'ሳምንቱ የ6,000,000 ብር ዒላማውን አሳክቷል?', t:'yesno'},
      {id:'w_jobfiles', en:'How many Job Files sent to Mahelet this week were complete? (complete / sent)', am:'በዚህ ሳምንት ወደ ማህሌት ከተላኩ የሥራ ፋይሎች ስንቱ የተሟሉ ነበሩ? (የተሟሉ / የተላኩ)', t:'ratio'},
      {id:'w_jobfiles_why', en:'Which Job Files went incomplete, what was missing, and has it been sent now?', am:'ያልተሟሉት የየትኞቹ ሥራዎች ፋይሎች ናቸው? ምን ጎደለ? አሁን ተልኳል?', t:'area', show:{f:'w_jobfiles', when:'short'}}
    ]},
    { en:'2 · Lead performance', am:'2 · ደንበኛ አያያዝ እንዴት ሄደ', fields:[
      {id:'w_leads', en:'How many new leads came in this week?', am:'በዚህ ሳምንት ስንት አዲስ ደንበኞች መጡ?', t:'num'},
      {id:'w_leads_1hr', en:'New leads this week: how many were called within 24 hours? (called within 24 hours / all new leads this week)', am:'በዚህ ሳምንት አዲስ የመጡ ደንበኞች፦ ስንቱ በ24 ሰዓት ውስጥ ተደወለላቸው? (በ24 ሰዓት ውስጥ የተደወለላቸው / በዚህ ሳምንት የመጡ አዲስ ደንበኞች በሙሉ)', t:'ratio', whole:'w_leads'},
      {id:'w_leads_1hr_why', en:'Which leads were missed, whose leads were they, and why?', am:'ያመለጡት ደንበኞች እነማን ናቸው? የማን ደንበኞች ነበሩ? ለምን?', t:'area', show:{f:'w_leads_1hr', when:'short'}},
      {id:'w_visits', en:'How many pre-measurement visits were done this week?', am:'በዚህ ሳምንት ስንት የቅድመ ልኬት ጉብኝት ተካሄደ?', t:'num', auto:{week:'visits_done'}},
      {id:'w_quotes', en:'How many quotations went out this week?', am:'በዚህ ሳምንት ስንት ፕሮፎርማ ተሰጠ?', t:'num', auto:{week:'quotes_issued'}},
      {id:'w_quotes_48h', en:'How many went out within 48 hours of measuring? (on time / all quotations)', am:'ስንቱ ልኬት በተወሰደ በ48 ሰዓት ውስጥ ተሰጠ? (በሰዓቱ / ሁሉም)', t:'ratio'},
      {id:'w_quotes_48h_why', en:'Which customers waited longer, and what held each one up?', am:'ከዚያ በላይ የጠበቁት የትኞቹ ደንበኞች ናቸው? እያንዳንዱን ምን ያዘው?', t:'area', show:{f:'w_quotes_48h', when:'short'}},
      {id:'w_conv', en:'What share of this week\'s leads became contracts?', am:'በዚህ ሳምንት ከመጡት ደንበኞች ስንት በመቶው ውል ፈረሙ?', t:'pct',
        auto:{pct:['w_contracts', 'w_leads']}}
    ]},
    { en:'3 · Margin performance', am:'3 · ትርፍ እንዴት ሄደ', fields:[
      {id:'w_margin', en:'What was the average margin per m² on this week\'s external contracts?', am:'የዚህ ሳምንት የውጭ ውሎች አማካይ ህዳግ በካሬ ሜትር ስንት ነው?', t:'num',
        auto:{div:[{sum:'w_contracts_list.margin'}, {rows:'w_contracts_list', when:{col:'margin'}}]},
        tgt:{op:'gte', v:6000, en:'Margin floor 6,000 Birr/m²', am:'ዝቅተኛው ህዳግ 6,000 ብር በካሬ'}},
      {id:'w_below_margin', en:'How many contracts were signed below the margin floor?', am:'ከህዳጉ በታች ስንት ውል ተፈረመ?', t:'num',
        auto:{rows:'w_contracts_list', when:{col:'margin', lt:6000}},
        tgt:{op:'lte', v:0, en:'–5,000 Birr each without Chairman approval',
             am:'ያለ ሊቀመንበር ፈቃድ እያንዳንዱ –5,000 ብር'}},
      {id:'w_below_margin_list', en:'Which of them, and who approved it', am:'የትኞቹ ናቸው? ማን አጸደቀው?', t:'table', addEn:'Add a contract', addAm:'ውል ጨምር',
        show:{f:'w_below_margin', when:'pos'},
        cols:[
          {id:'cust', en:'Customer', am:'ደንበኛ', t:'text'},
          {id:'code', en:'Job code', am:'የሥራ ኮድ', t:'text'},
          {id:'margin', en:'Margin per m²', am:'ህዳግ በካሬ ሜትር', t:'money'},
          {id:'ok', en:'Chairman approved', am:'ሊቀመንበሩ አጽድቀዋል', t:'yesno'}
        ]}
    ]},
    { en:'4 · WhatsApp compliance', am:'4 · ዋትስአፕ አጠቃቀም', fields:[
      {id:'w_wa_groups', en:'How many customer groups were active this week?', am:'በዚህ ሳምንት ስንት የደንበኛ ግሩፖች ንቁ ነበሩ?', t:'num'},
      {id:'w_wa_msgs', en:'How many required stage messages were posted? (posted / required)', am:'ከሚገባው የደረጃ መልዕክት ስንቱ ተላከ? (የተላከ / የሚገባው)', t:'ratio', auto:{a:{week:'wa_stage__a'}, b:{week:'wa_stage__b'}}},
      {id:'w_wa_msgs_why', en:'Which groups missed a stage message, whose groups were they, and why?', am:'የደረጃ መልዕክት ያልደረሳቸው የትኞቹ ግሩፖች ናቸው? የማን ግሩፖች ናቸው? ለምን?', t:'area', show:{f:'w_wa_msgs', when:'short'}},
      {id:'w_wa_rate', en:'What was the compliance rate this week?', am:'ከሚገባው መልዕክት ስንት በመቶውን ላኩ?', t:'pct',
        auto:{pct:['w_wa_msgs__a', 'w_wa_msgs__b']},
        tgt:{op:'gte', v:100, en:'100% required for the team bonus', am:'ለቡድን ቦነስ 100% መሆን አለበት'}},
      {id:'w_wa_unans', en:'How many messages waited more than 2 hours for an answer?', am:'ከ2 ሰዓት በላይ ምላሽ ሳያገኙ የቆዩ መልዕክቶች ስንት ናቸው?', t:'num', auto:{week:'wa_unanswered'}},
      {id:'w_wa_unans_why', en:'Which customers, who should have answered, and what was done?', am:'የየትኞቹ ደንበኞች ናቸው? መመለስ የነበረበት ማን ነበር? ምን እርምጃ ተወሰደ?', t:'area', show:{f:'w_wa_unans', when:'pos'}},
      {id:'w_wa_complaints', en:'How many customers complained about WhatsApp handling?', am:'ስንት ደንበኞች በዋትስአፕ አያያዝ ላይ ቅሬታ አቀረቡ?', t:'num', auto:{week:'wa_complaints'}},
      {id:'w_wa_complaints_what', en:'Who complained, about what, and how was it resolved?', am:'ቅሬታ ያቀረበው ማን ነው? ስለምን? እንዴት ተፈታ?', t:'area', show:{f:'w_wa_complaints', when:'pos'}},
      {id:'w_wa_viol', en:'How many WhatsApp violations did the team make this week?', am:'ቡድኑ በዚህ ሳምንት ስንት የዋትስአፕ ጥሰት ፈጸመ?', t:'num'},
      {id:'w_wa_viol_who', en:'Who, what happened, and what penalty was applied?', am:'እነማን ናቸው? ምን ተፈጠረ? ምን ቅጣት ተሰጠ?', t:'area', show:{f:'w_wa_viol', when:'pos'}}
    ]},
    { en:'5 · Marketing performance', am:'5 · ማርኬቲንግ እንዴት ሄደ', fields:[
      {id:'w_posts', en:'How many posts went up this week?', am:'በዚህ ሳምንት ስንት ፖስት ተለጠፈ?', t:'num', auto:{week:'posts'},
        tgt:{op:'gte', v:3, en:'At least 3 per week — –300 Birr per missed post',
             am:'በሳምንት ቢያንስ 3 — ላልተለጠፈ እያንዳንዱ –300 ብር'}},
      {id:'w_posts_why', en:'Why fewer than 3, and on which days will next week\'s posts go up?', am:'ለምን ከ3 ያነሰ ሆነ? የሚቀጥለው ሳምንት ፖስቶች በየትኞቹ ቀናት ይለጠፋሉ?', t:'area', show:{f:'w_posts', when:'miss'}},
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
      {id:'w_mkt_leads_plan', en:'What will change next week to bring in more leads?', am:'ተጨማሪ ደንበኞች እንዲመጡ በሚቀጥለው ሳምንት ምን ይቀየራል?', t:'area', opt:1, show:{f:'w_mkt_leads', when:'miss'}},
      {id:'w_mkt_contracts', en:'How many contracts came from marketing leads?', am:'ከማርኬቲንግ ደንበኞች ስንት ውል ተገኘ?', t:'num'}
    ]},
    { en:'6 · Customer satisfaction', am:'6 · የደንበኛ እርካታ', fields:[
      {id:'w_comp_any', en:'Did any complaint come in this week?', am:'በዚህ ሳምንት የደረሰ ቅሬታ አለ?', t:'yesno'},
      {id:'w_comp_list', en:'List each complaint', am:'እያንዳንዱን ቅሬታ ይዘርዝሩ', t:'table', addEn:'Add a complaint', addAm:'ቅሬታ ጨምር',
        show:{f:'w_comp_any', when:'yes'},
        cols:[
          {id:'cust', en:'Customer', am:'ደንበኛ', t:'text'},
          {id:'lc', en:'Customer code: 4-digit lead no., or KK code once paid', am:'የደንበኛ ኮድ፦ ባለ 4 አሃዝ ቁጥር፣ ከከፈሉ በኋላ KK ኮድ', t:'text'},
          {id:'what', en:'Complaint', am:'ቅሬታው', t:'text'},
          {id:'owner', en:'Being fixed by', am:'የሚያስተካክለው', t:'text'},
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
      {id:'w_comp_open_plan', en:'What is still needed on each open complaint, and by when will it be closed?', am:'ለእያንዳንዱ ያልተፈታ ቅሬታ ምን ይቀራል? እስከ መቼ ይዘጋል?', t:'area', show:{f:'w_comp_open', when:'pos'}},
      {id:'w_sat', en:'What was the average satisfaction score this week, out of 5?', am:'የዚህ ሳምንት አማካይ የእርካታ ነጥብ ከ5 ስንት ነው?', t:'num'}
    ]},
    { en:'7 · Problems and solutions', am:'7 · ችግሮችና መፍትሔዎች', fields:[
      {id:'w_problem', en:'What was the biggest problem this week — what caused it, and what is being done (who, by when)?', am:'የዚህ ሳምንት ትልቁ ችግር ምን ነበር? ምክንያቱ ምንድን ነው? ምን እየተደረገ ነው (በማን፣ እስከ መቼ)?', t:'area', opt:1},
      {id:'w_open', en:'What is still unresolved and carries into next week?', am:'ገና ያልተፈታና ወደ ሚቀጥለው ሳምንት የሚሻገር ምንድን ነው?', t:'area', opt:1},
      {id:'w_need_chair', en:'Do you need a decision from the Chairman?', am:'የሊቀመንበሩ ውሳኔ ያስፈልግዎታል?', t:'yesno'},
      {id:'w_need_chair_what', en:'What exactly should he decide, what are the options, and by when?', am:'በትክክል ምን እንዲወስኑ ይፈልጋሉ? አማራጮቹ ምንድን ናቸው? እስከ መቼ?', t:'area', show:{f:'w_need_chair', when:'yes'}}
    ]},
    { en:"8 · Next week's plan", am:'8 · የሚቀጥለው ሳምንት ዕቅድ', fields:[
      {id:'w_next_contracts', en:'How many contracts do you expect to sign next week?', am:'በሚቀጥለው ሳምንት ስንት ውል ይፈረማል ብለው ይጠብቃሉ?', t:'num'},
      {id:'w_next_value', en:'What value do you expect them to bring?', am:'ምን ያህል ዋጋ ያመጣሉ ብለው ይጠብቃሉ?', t:'money'},
      {id:'w_next_customers', en:'Which key customers are in negotiation, and what is the next step with each?', am:'በድርድር ላይ ያሉ ዋና ደንበኞች እነማን ናቸው? ከእያንዳንዳቸው ጋር ቀጣዩ እርምጃ ምንድን ነው?', t:'area'},
      {id:'w_next_support', en:'What support do you need from the Chairman next week?', am:'በሚቀጥለው ሳምንት ከሊቀመንበሩ ምን ድጋፍ ያስፈልግዎታል?', t:'area', opt:1}
    ]},
    { en:'9 · 4-week rolling total', am:'9 · የ4 ሳምንት ድምር', fields:[
      {id:'r_w1', en:'Collected in week 1 (the oldest)', am:'በሳምንት 1 የተሰበሰበ (የመጀመሪያው)', t:'money'},
      {id:'r_w2', en:'Collected in week 2', am:'በሳምንት 2 የተሰበሰበ', t:'money'},
      {id:'r_w3', en:'Collected in week 3', am:'በሳምንት 3 የተሰበሰበ', t:'money'},
      {id:'r_w4', en:'Collected in week 4 (this week)', am:'በሳምንት 4 የተሰበሰበ (ይህ ሳምንት)', t:'money'},
      {id:'r_total', en:'What is the rolling 4-week total?', am:'የ4 ሳምንቱ ጠቅላላ ድምር ስንት ነው?', t:'money',
        tgt:{op:'gte', v:12000000, en:'Below 12,000,000 Birr is –5,000 Birr',
             am:'ከ12,000,000 ብር በታች ከሆነ –5,000 ብር'}},
      {id:'r_total_why', en:'The 4 weeks are below 12,000,000 Birr. Why, and which customers will lift the next 4 weeks?', am:'የ4 ሳምንቱ ድምር ከ12,000,000 ብር በታች ነው። ለምን? የሚቀጥሉትን 4 ሳምንታት ከፍ የሚያደርጉት የትኞቹ ደንበኞች ናቸው?', t:'area', show:{f:'r_total', when:'miss'}},
      {id:'r_conseq', en:'Which consequence was applied, if any?', am:'ተግባራዊ የተደረገ ቅጣት ወይም እርምጃ ካለ ምንድን ነው?', t:'text', opt:1}
    ]}
  ]
},

/* ========================= MAHELET — WEEKLY ========================= */
{
  id:'liu-weekly', person:'liu', cadence:'weekly', dueTime:'15:00', dueDay:6,
  en:'Weekly Production & Delivery Summary', am:'ሳምንታዊ የምርትና የማድረስ ሪፖርት',
  toEn:'Chairman', toAm:'ሊቀመንበር',
  dueEn:'Saturday 3:00 PM', dueAm:'ቅዳሜ ከቀኑ 9፡00 (3:00 PM)',
  penEn:'Late or not sent –500 Birr', penAm:'ዘግይቶ ወይም ካልቀረበ –500 ብር',
  sections:[
    { en:'1 · Production performance', am:'1 · ምርት እንዴት ሄደ', fields:[
      {id:'p_total', en:'How many m² did the factory produce this week?', am:'ፋብሪካው በዚህ ሳምንት ስንት ካሬ ሜትር አመረተ?', t:'num',
        tgt:{op:'gte', v:240, en:'Weekly target 240 m²', am:'የሳምንቱ ዒላማ 240 ካሬ ሜትር'}},
      {id:'p_total_why', en:'The week is under 240 m². Which days fell short, why, and what changes next week?', am:'ሳምንቱ ከ240 ካሬ ሜትር በታች ነው። የትኞቹ ቀናት ጎደሉ? ለምን? በሚቀጥለው ሳምንት ምን ይቀየራል?', t:'area', show:{f:'p_total', when:'miss'}},
      {id:'p_avg', en:'What was the average production per working day, in m²?', am:'በአንድ የሥራ ቀን አማካይ ምርቱ ስንት ካሬ ሜትር ነበር?', t:'num',
        auto:{div:['p_total', 6]},
        tgt:{op:'gte', v:40, en:'Daily target 40 m²', am:'የቀን ዒላማ 40 ካሬ ሜትር'}},
      {id:'p_waste', en:'What was this week\'s waste, as a % of material used?', am:'የዚህ ሳምንት ብክነት ከዋለው ዕቃ ስንት % ነው?', t:'pct', auto:{week:'waste', how:'avg'},
        tgt:{op:'lte', v:20, en:'Must not exceed 20%', am:'ከ20% መብለጥ የለበትም'}},
      {id:'p_waste_why', en:'Waste is over 20%. Where did it come from, and what is being changed?', am:'ብክነቱ ከ20% በላይ ነው። ከየት መጣ? ምን እየተቀየረ ነው?', t:'area', show:{f:'p_waste', when:'miss'}},
      {id:'p_uptime', en:'What % of working hours did the machines run this week?', am:'በዚህ ሳምንት ማሽኖች ከሥራ ሰዓቱ ስንት % ሠሩ?', t:'pct',
        tgt:{op:'gte', v:95, en:'95%+ earns 400 Birr, below 90% is –300 Birr',
             am:'ከ95% በላይ 400 ብር፣ ከ90% በታች –300 ብር'}},
      {id:'p_uptime_list', en:'Which machines lost the most hours?', am:'ብዙ ሰዓት የቆሙት የትኞቹ ማሽኖች ናቸው?', t:'table', addEn:'Add a machine', addAm:'ማሽን ጨምር',
        show:{f:'p_uptime', when:'miss'},
        cols:[
          {id:'machine', en:'Machine', am:'ማሽን', t:'choice', opts:[
            {v:'Width cutter',  en:'Width cutter',  am:'የወርድ መቁረጫ'},
            {v:'Length cutter', en:'Length cutter', am:'የርዝመት መቁረጫ'},
            {v:'Edge bander',   en:'Edge bander',   am:'ጠርዝ ማሰሪያ'},
            {v:'Hinge driller', en:'Hinge driller', am:'የማጠፊያ መብሻ'},
            {v:'Compressor',    en:'Compressor',    am:'ኮምፕረሰር'},
            {v:'Other',         en:'Other',         am:'ሌላ'}
          ]},
          {id:'hours', en:'Hours lost', am:'የባከነ ሰዓት', t:'num'},
          {id:'cause', en:'Cause', am:'ምክንያት', t:'text'},
          {id:'plan', en:'Maintenance planned', am:'የታቀደ ጥገና', t:'text'}
        ]}
    ]},
    /* Her QC figures stay hers to give: the rulebook pays her on them, and
       the morning "reports that disagree" reader sets them against Wude's
       and Amaha's. What simply follows from them does not stay. */
    { en:'2 · Quality control', am:'2 · የጥራት ቁጥጥር', fields:[
      {id:'q_checked', en:'How many jobs went through QC this week?', am:'በዚህ ሳምንት ስንት ሥራዎች በQC ተመረመሩ?', t:'num'},
      {id:'q_pass', en:'How many passed?', am:'ስንቱ አለፉ?', t:'num'},
      {id:'q_fail', en:'How many failed?', am:'ስንቱ አላለፉም?', t:'num',
        auto:{minus:['q_checked', 'q_pass']}, sumEn:'failed', sumAm:'አላለፉም'},
      {id:'q_fail_any', en:'Did any job fail QC this week?', am:'በዚህ ሳምንት QC ያላለፈ ሥራ አለ?', t:'yesno'},
      {id:'q_fail_list', en:'Which jobs failed, and why?', am:'ያላለፉት የትኞቹ ሥራዎች ናቸው? ለምን?', t:'table', addEn:'Add a job', addAm:'ሥራ ጨምር',
        show:{f:'q_fail_any', when:'yes'},
        cols:[
          {id:'code', en:'Job code', am:'የሥራ ኮድ', t:'text'},
          {id:'why', en:'Why it failed', am:'ያላለፈበት ምክንያት', t:'text'},
          {id:'fixed', en:'Fixed and passed', am:'ተስተካክሎ አልፏል', t:'yesno'}
        ]},
      {id:'q_rate', en:'What was the QC pass rate this week?', am:'በዚህ ሳምንት የQC ማለፊያ መጠን ስንት ነበር?', t:'pct',
        auto:{pct:['q_pass', 'q_checked']},
        tgt:{op:'gte', v:98, en:'Target ≥98% — below is –500 Birr/month',
             am:'ዒላማ ≥98% — በታች ከሆነ በወር –500 ብር'}},
      {id:'q_rate_why', en:'The pass rate is under 98%. What is the main cause, and what will change on the floor?', am:'የማለፊያ መጠኑ ከ98% በታች ነው። ዋናው ምክንያት ምንድን ነው? በምርት ክፍሉ ምን ይቀየራል?', t:'area', show:{f:'q_rate', when:'miss'}}
    ]},
    { en:'3 · Store & inventory', am:'3 · መጋዘንና ዕቃ', fields:[
      {id:'s_accuracy', en:'How accurate was the stock count this week, in %?', am:'በዚህ ሳምንት የዕቃ ቆጠራው ስንት % ትክክል ነበር?', t:'pct',
        tgt:{op:'gte', v:99, en:'Target ≥99%', am:'ዒላማ ≥99%'}},
      {id:'s_disc_any', en:'Did the count find any difference this week?', am:'በዚህ ሳምንት ቆጠራው ልዩነት አገኘ?', t:'yesno'},
      {id:'s_disc_list', en:'Which items did not match?', am:'ያልተረጋገጡት የትኞቹ ዕቃዎች ናቸው?', t:'table', addEn:'Add an item', addAm:'ዕቃ ጨምር',
        show:{f:'s_disc_any', when:'yes'},
        cols:[
          {id:'item', en:'Item', am:'ዕቃ', t:'text'},
          {id:'rec', en:'Recorded', am:'በመዝገብ', t:'num'},
          {id:'cnt', en:'Counted', am:'የተቆጠረ', t:'num'},
          {id:'why', en:'Explanation', am:'ማብራሪያ', t:'text'}
        ]},
      {id:'s_disc', en:'How many stock discrepancies were found?', am:'ስንት የዕቃ ልዩነቶች ተገኙ?', t:'num',
        auto:{rows:'s_disc_list'}, sumEn:'differences', sumAm:'ልዩነቶች'},
      {id:'s_short', en:'How many material shortages were reported this week?', am:'በዚህ ሳምንት ስንት የዕቃ እጥረቶች ተነገሩ?', t:'num'},
      {id:'s_short_what', en:'Which materials ran short, which jobs did it hold up, and for how long?', am:'ያጠሩት የትኞቹ ዕቃዎች ናቸው? የትኞቹን ሥራዎች አቆሙ? ለምን ያህል ጊዜ?', t:'area', show:{f:'s_short', when:'pos'}}
    ]},
    { en:'4 · Purchasing', am:'4 · ግዥ', fields:[
      {id:'pu_total', en:'How many purchase requests were made this week?', am:'በዚህ ሳምንት ስንት የግዥ ጥያቄዎች ቀረቡ?', t:'num'},
      {id:'pu_acc', en:'What % of purchases were right the first time (item, quantity, price)?', am:'ከግዥዎቹ ስንት % በመጀመሪያው ትክክል ነበሩ (ዕቃ፣ መጠን፣ ዋጋ)?', t:'pct',
        tgt:{op:'gte', v:95, en:'Target ≥95%', am:'ዒላማ ≥95%'}},
      {id:'pu_acc_why', en:'Accuracy is under 95%. Which purchases were wrong, what was wrong, and why?', am:'ትክክለኛነቱ ከ95% በታች ነው። የተሳሳቱት የትኞቹ ግዥዎች ናቸው? ምኑ ተሳሳተ? ለምን?', t:'area', show:{f:'pu_acc', when:'miss'}},
      {id:'pu_ontime', en:'How many supplier deliveries arrived on time? (on time / all deliveries)', am:'ስንት የአቅራቢ ርክክቦች በሰዓቱ ደረሱ? (በሰዓቱ / ሁሉም)', t:'ratio'},
      {id:'pu_ontime_why', en:'Which deliveries were late, from which supplier, by how many days, and what did it hold up?', am:'የዘገዩት የትኞቹ ርክክቦች ናቸው? ከየትኛው አቅራቢ? በስንት ቀን? ምን አቆሙ?', t:'area', show:{f:'pu_ontime', when:'short'}}
    ]},
    { en:'5 · Delivery & installation', am:'5 · ማድረስና ተከላ', fields:[
      {id:'d_delivered', en:'How many jobs were delivered this week?', am:'በዚህ ሳምንት ስንት ሥራዎች ደረሱ?', t:'num'},
      {id:'d_installed', en:'How many jobs were installed this week?', am:'በዚህ ሳምንት ስንት ሥራዎች ተተከሉ?', t:'num'},
      {id:'d_ontime', en:'What % of deliveries were on time?', am:'ከርክክቦቹ ስንት % በሰዓቱ ነበሩ?', t:'pct',
        tgt:{op:'gte', v:95, en:'Target ≥95%', am:'ዒላማ ≥95%'}},
      {id:'d_ontime_why', en:'Which deliveries were late, by how long, and why?', am:'የዘገዩት የትኞቹ ርክክቦች ናቸው? በምን ያህል? ለምን?', t:'area', show:{f:'d_ontime', when:'miss'}},
      {id:'d_inst_ontime', en:'What % of installations were on time?', am:'ከተከላዎቹ ስንት % በሰዓቱ ነበሩ?', t:'pct',
        tgt:{op:'gte', v:95, en:'Target ≥95%', am:'ዒላማ ≥95%'}},
      {id:'d_inst_ontime_why', en:'Which installations were late, by how long, and why?', am:'የዘገዩት የትኞቹ ተከላዎች ናቸው? በምን ያህል? ለምን?', t:'area', show:{f:'d_inst_ontime', when:'miss'}},
      {id:'d_comp_any', en:'Did any customer complaint come in this week?', am:'በዚህ ሳምንት የደረሰ የደንበኛ ቅሬታ አለ?', t:'yesno'},
      {id:'d_complaints_list', en:'List each complaint', am:'ቅሬታዎቹን አንድ በአንድ ይዘርዝሩ', t:'table', addEn:'Add a complaint', addAm:'ቅሬታ ጨምር',
        show:{f:'d_comp_any', when:'yes'},
        cols:[
          {id:'cust', en:'Customer', am:'ደንበኛ', t:'text'},
          {id:'lc', en:'Customer code: 4-digit lead no., or KK code once paid', am:'የደንበኛ ኮድ፦ ባለ 4 አሃዝ ቁጥር፣ ከከፈሉ በኋላ KK ኮድ', t:'text'},
          {id:'what', en:'Complaint', am:'ቅሬታው', t:'text'},
          {id:'dept', en:'Caused by (department)', am:'ያስከተለው ክፍል', t:'text'},
          {id:'done', en:'Resolved', am:'ተፈቷል', t:'yesno'}
        ]},
      {id:'d_complaints', en:'How many customer complaints came in this week?', am:'በዚህ ሳምንት ስንት የደንበኛ ቅሬታዎች ደረሱ?', t:'num',
        auto:{rows:'d_complaints_list'}, sumEn:'complaints', sumAm:'ቅሬታዎች'},
      {id:'d_resolved', en:'How many of them are resolved?', am:'ከነዚህ ስንቱ ተፈቱ?', t:'num',
        auto:{rows:'d_complaints_list', when:{col:'done', is:'yes'}}, sumEn:'resolved', sumAm:'ተፈተዋል'}
    ]},
    { en:'6 · Job File handoff', am:'6 · የጆብ ፋይል መረካከብ', fields:[
      {id:'j_recv', en:'How many Job Files did you receive from Ephrata this week?', am:'በዚህ ሳምንት ከኤፍራታ ስንት ጆብ ፋይሎች ደረሱዎት?', t:'num', auto:{week:'jf_recv'}},
      {id:'j_rej', en:'How many did you return as incomplete?', am:'ስንቱን ያልተሟሉ ስለሆኑ መለሱ?', t:'num', auto:{week:'jf_rej'}},
      {id:'j_acc', en:'How many did you accept?', am:'ስንቱን ተቀበሉ?', t:'num',
        auto:{minus:['j_recv', 'j_rej']}, sumEn:'accepted', sumAm:'ተቀብለዋል'},
      {id:'j_reason', en:'What was missing from the returned files, and is the same thing going missing again?', am:'በተመለሱት ፋይሎች ምን ጎደለ? ያው ነገር በተደጋጋሚ እየጎደለ ነው?', t:'area', opt:1}
    ]},
    { en:'7 · WhatsApp compliance', am:'7 · ዋትስአፕ አጠቃቀም', fields:[
      {id:'wa_rate', en:'What % of required operations messages went out on time this week?', am:'በዚህ ሳምንት ከሚገባው የኦፕሬሽን መልዕክት ስንት % በሰዓቱ ተላከ?', t:'pct',
        tgt:{op:'gte', v:100, en:'100% required for the KPI bonus', am:'ለKPI ቦነስ 100% ያስፈልጋል'}},
      {id:'wa_rate_why', en:'Which messages were missed, in which groups, and who was responsible?', am:'ያልተላኩት የትኞቹ መልዕክቶች ናቸው? በየትኞቹ ግሩፖች? ኃላፊው ማን ነበር?', t:'area', show:{f:'wa_rate', when:'miss'}},
      {id:'wa_asm', en:'On how many days did the assemblers post their progress? (days posted / working days)', am:'ገጣጣሚዎች በስንት ቀን ሂደታቸውን ለጠፉ? (የለጠፉበት ቀን / የሥራ ቀናት)', t:'ratio'},
      {id:'wa_asm_why', en:'On which days was it missed, by whom, and why?', am:'በየትኞቹ ቀናት አልተለጠፈም? በማን? ለምን?', t:'area', show:{f:'wa_asm', when:'short'}},
      {id:'wa_comp', en:'How many customers complained about operations communication?',
        am:'ስንት ደንበኞች በኦፕሬሽን ግንኙነት ላይ ቅሬታ አቀረቡ?', t:'num'},
      {id:'wa_comp_what', en:'Who complained, about what, and what was done?', am:'ቅሬታ ያቀረበው ማን ነው? ስለምን? ምን እርምጃ ተወሰደ?', t:'area', show:{f:'wa_comp', when:'pos'}}
    ]},
    { en:'8 · 15-day production plan status', am:'8 · የ15 ቀን የምርት ዕቅድ ሁኔታ', fields:[
      {id:'pl_sent', en:'Did the 15-day plan reach the Chairman by Saturday 3:00 PM?', am:'የ15 ቀን ዕቅዱ እስከ ቅዳሜ 9፡00 ለሊቀመንበሩ ደርሷል?', t:'yesno'},
      {id:'pl_sent_why', en:'Why was it late, and when did it reach him?', am:'ለምን ዘገየ? መቼ ደረሳቸው?', t:'area', show:{f:'pl_sent', when:'no'}},
      {id:'pl_onsched', en:'How many planned jobs were finished on schedule? (on schedule / due this week)', am:'ከታቀዱት ሥራዎች ስንቱ በዕቅዱ ቀን ተጠናቀቁ? (በሰዓቱ / በዚህ ሳምንት የሚደርሱ)', t:'ratio'},
      {id:'pl_delayed_any', en:'Is any job behind the plan?', am:'ከዕቅዱ ወደኋላ የቀረ ሥራ አለ?', t:'yesno'},
      {id:'pl_delayed_list', en:'Which jobs are behind?', am:'ወደኋላ የቀሩት የትኞቹ ሥራዎች ናቸው?', t:'table', addEn:'Add a job', addAm:'ሥራ ጨምር',
        show:{f:'pl_delayed_any', when:'yes'},
        cols:[
          {id:'code', en:'Job code', am:'የሥራ ኮድ', t:'text'},
          {id:'days', en:'Days behind', am:'የዘገየበት ቀን', t:'num'},
          {id:'why', en:'Reason', am:'ምክንያት', t:'text'},
          {id:'new', en:'New date', am:'አዲሱ ቀን', t:'text'}
        ]},
      {id:'pl_delayed', en:'How many jobs are behind the plan?', am:'ስንት ሥራዎች ከዕቅዱ ወደኋላ ቀርተዋል?', t:'num',
        auto:{rows:'pl_delayed_list'}, sumEn:'behind the plan', sumAm:'ከዕቅዱ ወደኋላ'},
      {id:'pl_reason', en:'What is the main reason for the delays?', am:'የመዘግየቱ ዋና ምክንያት ምንድን ነው?', t:'area', opt:1},
      {id:'pl_unpaid', en:"How many jobs went into the plan without Selam's written payment confirmation?",
        am:'ያለ ሰላም የጽሑፍ የክፍያ ማረጋገጫ ስንት ሥራዎች ወደ ዕቅዱ ገቡ?', t:'num',
        tgt:{op:'lte', v:0, en:'–5,000 Birr per job', am:'በሥራ –5,000 ብር'}},
      {id:'pl_unpaid_what', en:'Which jobs, who put them in, and have they been stopped?', am:'የትኞቹ ሥራዎች? ማን አስገባቸው? ቆመዋል?', t:'area', show:{f:'pl_unpaid', when:'pos'}}
    ]},
    { en:'9 · Problems and solutions', am:'9 · ችግሮችና መፍትሔዎች', fields:[
      {id:'w_problem', en:'What was the biggest problem this week, and what caused it?', am:'የዚህ ሳምንት ትልቁ ችግር ምን ነበር? ምክንያቱስ?', t:'area', opt:1},
      {id:'w_action', en:'What was done about it, by whom, and by when will it be fixed?', am:'ምን እርምጃ ተወሰደ? በማን? እስከ መቼ ይስተካከላል?', t:'area', opt:1},
      {id:'w_open', en:'What is still open, who owns it, and by when?', am:'ያላለቀው ምንድን ነው? ኃላፊው ማን ነው? እስከ መቼ?', t:'area', opt:1},
      {id:'w_well', en:'What went well this week that should be repeated?', am:'በዚህ ሳምንት በደንብ የሠራና ሊደገም የሚገባው ምንድን ነው?', t:'area', opt:1},
      {id:'need_chair', en:'Do you need a decision from the Chairman?', am:'የሊቀመንበሩ ውሳኔ ያስፈልግዎታል?', t:'yesno'},
      {id:'need_chair_what', en:'What exactly should he decide, what are the options, and by when?', am:'በትክክል ምን እንዲወስኑ ይፈልጋሉ? አማራጮቹ ምንድን ናቸው? እስከ መቼ?', t:'area', show:{f:'need_chair', when:'yes'}}
    ]},
    { en:"10 · Next week's plan", am:'10 · የሚቀጥለው ሳምንት ዕቅድ', fields:[
      {id:'n_target', en:'What is next week\'s production target, in m²?', am:'የሚቀጥለው ሳምንት የምርት ዒላማ ስንት ካሬ ሜትር ነው?', t:'num'},
      {id:'n_jobs', en:'Which jobs must be finished next week?', am:'በሚቀጥለው ሳምንት መጠናቀቅ ያለባቸው የትኞቹ ሥራዎች ናቸው?', t:'area'},
      {id:'n_support', en:'What do you need from other departments or the Chairman to hit it?', am:'ዒላማውን ለመምታት ከሌሎች ክፍሎች ወይም ከሊቀመንበሩ ምን ያስፈልግዎታል?', t:'area', opt:1}
    ]}
  ]
},

/* ==================== BETELHEM — WEEKLY FINANCE ==================== */
{
  id:'betty-weekly', person:'betty', cadence:'weekly', dueTime:'17:00', dueDay:6,
  en:'Weekly Finance Report', am:'ሳምንታዊ የፋይናንስ ሪፖርት',
  toEn:'Chairman + Kidan', toAm:'ሊቀመንበር + ኪዳን',
  dueEn:'Saturday 5:00 PM', dueAm:'ቅዳሜ ከቀኑ 11፡00 (5:00 PM)',
  penEn:'Late or not sent –500 Birr · Wrong information –500 to –1,000 Birr',
  penAm:'ዘግይቶ ወይም ካልቀረበ –500 ብር · የተሳሳተ መረጃ –500 እስከ –1,000 ብር',
  derived:1,
  sections:[
    { en:'1 · Collections this week', am:'1 · የዚህ ሳምንት ገቢ', fields:[
      {id:'f_adv', en:'How much came in as advance payments this week?', am:'በዚህ ሳምንት ስንት ብር ቅድመ ክፍያ ገባ?', t:'money', auto:{week:'adv_in'}},
      {id:'f_final', en:'How much came in as final payments this week?', am:'በዚህ ሳምንት ስንት ብር የመጨረሻ ክፍያ ገባ?', t:'money', auto:{week:'final_in'}},
      {id:'f_total', en:'How much was collected in total this week?', am:'በዚህ ሳምንት በጠቅላላ ስንት ብር ተሰበሰበ?', t:'money',
        auto:{plus:['f_adv', 'f_final']}},
      {id:'f_banked', en:'Was all cash banked the same day, every day this week?', am:'በዚህ ሳምንት በየዕለቱ ገንዘቡ ሁሉ በዕለቱ ባንክ ገብቷል?', t:'yesno'},
      {id:'f_banked_why', en:'On which days, how much stayed out overnight, and why?', am:'በየትኞቹ ቀናት? ስንት ብር ከባንክ ውጭ አደረ? ለምን?', t:'area', show:{f:'f_banked', when:'no'}}
    ]},
    { en:'2 · Cash position', am:'2 · የገንዘብ ሁኔታ', fields:[
      {id:'f_bank', en:'What is the bank balance at the end of the week?', am:'በሳምንቱ መጨረሻ የባንክ ቀሪ ስንት ነው?', t:'money',
        tgt:{op:'gte', v:6000000, en:'6 Million Birr Cash Reserve Rule', am:'የ6 ሚሊዮን ብር መጠባበቂያ ደንብ'}},
      {id:'f_bank_why', en:'The balance is below the 6,000,000 Birr reserve. Why, what was frozen, and when will it recover?', am:'ቀሪው ከ6,000,000 ብር መጠባበቂያ በታች ነው። ለምን? ምን ቆመ? መቼ ይመለሳል?', t:'area', show:{f:'f_bank', when:'miss'}},
      {id:'f_recon', en:'Was the full bank reconciliation done on Monday?', am:'ሙሉ የባንክ ማስታረቅ ሰኞ ተሠርቷል?', t:'yesno'},
      {id:'f_recon_why', en:'Why not, and when will it be done?', am:'ለምን አልተሠራም? መቼ ይሠራል?', t:'area', show:{f:'f_recon', when:'no'}},
      {id:'f_disc_any', en:'Was any cash discrepancy found this week?', am:'በዚህ ሳምንት የተገኘ የገንዘብ ልዩነት አለ?', t:'yesno'},
      {id:'f_disc_list', en:'List each discrepancy', am:'እያንዳንዱን ልዩነት ይዘርዝሩ', t:'table', addEn:'Add a discrepancy', addAm:'ልዩነት ጨምር',
        show:{f:'f_disc_any', when:'yes'},
        cols:[
          {id:'day', en:'Day', am:'ቀን', t:'text'},
          {id:'amount', en:'Amount', am:'መጠን', t:'money'},
          {id:'where', en:'Where found', am:'የተገኘበት', t:'text'},
          {id:'who', en:'Who handled the money', am:'ገንዘቡን የያዘው', t:'text'},
          {id:'done', en:'What was done', am:'የተወሰደ እርምጃ', t:'text'}
        ]},
      {id:'f_disc', en:'How many cash discrepancies were found this week?', am:'በዚህ ሳምንት ስንት የገንዘብ ልዩነቶች ተገኙ?', t:'num',
        auto:{rows:'f_disc_list'}, sumEn:'discrepancies', sumAm:'ልዩነቶች',
        tgt:{op:'lte', v:0, en:'–500 Birr each', am:'እያንዳንዱ –500 ብር'}},
      {id:'f_disc_value', en:'How much did they come to?', am:'በጠቅላላ ስንት ብር ነበሩ?', t:'money',
        auto:{sum:'f_disc_list.amount'}, sumEn:'in all', sumAm:'በጠቅላላ'},
      {id:'f_shortfall', en:'Was every expected cash shortfall flagged in advance?', am:'የሚጠበቅ የገንዘብ እጥረት ሁሉ ቀድሞ ተነግሯል?', t:'yesno', opt:1},
      {id:'f_shortfall_why', en:'Which shortfall was not flagged in time, and why?', am:'በጊዜ ያልተነገረው የትኛው እጥረት ነው? ለምን?', t:'area', show:{f:'f_shortfall', when:'no'}}
    ]},
    { en:'3 · ZamZam Bank reconciliation', am:'3 · የዘምዘም ባንክ ማስታረቅ', fields:[
      {id:'z_recon', en:'Was ZamZam Bank reconciled this Monday?', am:'የዘምዘም ባንክ በዚህ ሰኞ ታርቋል?', t:'yesno'},
      {id:'z_recon_why', en:'Why not, and when will it be done?', am:'ለምን አልታረቀም? መቼ ይታረቃል?', t:'area', show:{f:'z_recon', when:'no'}},
      {id:'z_transfers', en:'How many transfers were made to ZamZam this week?', am:'በዚህ ሳምንት ወደ ዘምዘም ስንት ዝውውሮች ተደረጉ?', t:'num',
        auto:{week:'zz_count'}},
      {id:'z_value', en:'What was the total transferred?', am:'በጠቅላላ ስንት ብር ተላለፈ?', t:'money',
        auto:{week:'zz_transfer'}},
      {id:'z_matched', en:'How many transfers match an approved purchase request? (matched / all transfers)', am:'ስንቱ ዝውውር ከጸደቀ የግዥ ጥያቄ ጋር ይመሳሰላል? (የተመሳሰለ / ሁሉም ዝውውሮች)', t:'ratio'},
      {id:'z_matched_why', en:'Which transfers have no approved request behind them, for how much, and why?', am:'የጸደቀ ጥያቄ የሌላቸው የትኞቹ ዝውውሮች ናቸው? ስንት ብር? ለምን?', t:'area', show:{f:'z_matched', when:'short'}},
      {id:'z_cheques', en:'How many cheques match a supplier invoice? (matched / all cheques)', am:'ስንቱ ቼክ ከአቅራቢ ደረሰኝ ጋር ይመሳሰላል? (የተመሳሰለ / ሁሉም ቼኮች)', t:'ratio'},
      {id:'z_cheques_why', en:'Which cheques have no invoice yet, from which suppliers, and when will the invoices come?', am:'ደረሰኝ የሌላቸው የትኞቹ ቼኮች ናቸው? የየትኞቹ አቅራቢዎች? ደረሰኙ መቼ ይመጣል?', t:'area', show:{f:'z_cheques', when:'short'}},
      {id:'z_errors', en:'How many reconciliation errors were found?', am:'ስንት የማስታረቅ ስህተቶች ተገኙ?', t:'num',
        tgt:{op:'lte', v:0, en:'Zero errors earns the 1,000 Birr bonus',
             am:'ዜሮ ስህተት 1,000 ብር ቦነስ ያስገኛል'}},
      {id:'z_errors_what', en:'What were they, how much, and was Kidan told the same day?', am:'ምን ምን ነበሩ? ስንት ብር? በዕለቱ ለኪዳን ተነግሯል?', t:'area', show:{f:'z_errors', when:'pos'}}
    ]},
    { en:'4 · Payments approved', am:'4 · የጸደቁ ክፍያዎች', fields:[
      {id:'a_count', en:'How many payments were approved this week?', am:'በዚህ ሳምንት ስንት ክፍያዎች ጸደቁ?', t:'num',
        auto:{week:'pay_approved'}},
      {id:'a_value', en:'What was their total value?', am:'ጠቅላላ ዋጋቸው ስንት ነው?', t:'money',
        auto:{week:'pay_value'}},
      {id:'a_kidan', en:'How many payments over 50,000 Birr went to Kidan?', am:'ከ50,000 ብር በላይ ስንት ክፍያዎች ለኪዳን ተላኩ?', t:'num',
        auto:{week:'pay_kidan'}},
      {id:'a_unauth_any', en:'Did any payment go out without proper approval this week?', am:'በዚህ ሳምንት ያለ ተገቢ ፈቃድ የተከፈለ ክፍያ አለ?', t:'yesno'},
      {id:'a_unauth_list', en:'List each one', am:'እያንዳንዱን ይዘርዝሩ', t:'table', addEn:'Add a payment', addAm:'ክፍያ ጨምር',
        show:{f:'a_unauth_any', when:'yes'},
        cols:[
          {id:'to', en:'Paid to', am:'ተከፋይ', t:'text'},
          {id:'amount', en:'Amount', am:'መጠን', t:'money'},
          {id:'by', en:'Who authorised it', am:'ያዘዘው', t:'text'},
          {id:'why', en:'Why', am:'ለምን', t:'text'}
        ]},
      {id:'a_unauth', en:'How many payments went out without proper approval?', am:'ስንት ክፍያዎች ያለ ተገቢ ፈቃድ ተከፈሉ?', t:'num',
        auto:{rows:'a_unauth_list'}, sumEn:'without approval', sumAm:'ያለ ፈቃድ',
        tgt:{op:'lte', v:0, en:'–5,000 Birr each', am:'እያንዳንዱ –5,000 ብር'}}
    ]},
    { en:'5 · Assembler payments', am:'5 · የገጣጣሚዎች ክፍያ', fields:[
      {id:'as_reserved', en:'How much was reserved for assemblers this week?', am:'በዚህ ሳምንት ለተከላ ሠራተኞች ስንት ብር ተያዘ?', t:'money',
        auto:{week:'asm_reserved'}},
      {id:'as_released', en:'How many assembler payments were released?', am:'ስንት የገጣጣሚዎች ክፍያዎች ተለቀቁ?', t:'num', auto:{week:'asm_released'}},
      {id:'as_rel_value', en:'How much did that come to?', am:'በጠቅላላ ስንት ብር ሆነ?', t:'money',
        auto:{week:'asm_rel_value'}},
      {id:'as_late', en:'How many were released more than 3 working days after customer acceptance?', am:'ስንቱ ደንበኛው ከተቀበለ ከ3 የሥራ ቀናት በኋላ ተለቀቁ?', t:'num',
        auto:{week:'asm_rel_late'},
        tgt:{op:'lte', v:0, en:'–300 Birr per day late', am:'በዘገየ ቀን –300 ብር'}},
      {id:'as_late_any', en:'Was any released later than that?', am:'ከዚያ ዘግይቶ የተለቀቀ አለ?', t:'yesno'},
      {id:'as_late_list', en:'Which ones?', am:'የትኞቹ?', t:'table', addEn:'Add a payment', addAm:'ክፍያ ጨምር',
        show:{f:'as_late_any', when:'yes'},
        cols:[
          {id:'who', en:'Assembler', am:'ገጣጣሚ', t:'text'},
          {id:'code', en:'Job code', am:'የሥራ ኮድ', t:'text'},
          {id:'days', en:'Days late', am:'የዘገየበት ቀን', t:'num'},
          {id:'why', en:'Why', am:'ለምን', t:'text'}
        ]},
      {id:'as_disputes', en:'How many payment disputes are still open?', am:'ስንት የክፍያ ክርክሮች ገና አልተፈቱም?', t:'num'},
      {id:'as_disputes_what', en:'Who, about what, how long has each been open, and when will it be settled?', am:'የማን? ስለምን? እያንዳንዱ ስንት ጊዜ ቆየ? መቼ ይፈታል?', t:'area', show:{f:'as_disputes', when:'pos'}}
    ]},
    { en:'6 · Registers, board and documents', am:'6 · መዝገቦች፣ ቦርድና ሰነዶች', fields:[
      {id:'r_registers', en:'Are all registers up to date — supplier, advance, assembler and ZamZam?', am:'ሁሉም መዝገቦች — የአቅራቢ፣ የቅድመ ክፍያ፣ የገጣጣሚዎችና የዘምዘም — ተሞልተዋል?', t:'yesno'},
      {id:'r_registers_why', en:'Which register is behind, by how much, and when will it be current?', am:'የትኛው መዝገብ ወደኋላ ቀርቷል? በምን ያህል? መቼ ይሟላል?', t:'area', show:{f:'r_registers', when:'no'}},
      {id:'r_board', en:'Did the board match the physical files all week?', am:'ቦርዱ ሳምንቱን ሙሉ ከፋይሎቹ ጋር ተመሳስሏል?', t:'yesno'},
      {id:'r_board_why', en:'Which job cards did not match, and what was fixed?', am:'የትኞቹ ካርዶች አልተመሳሰሉም? ምን ተስተካከለ?', t:'area', show:{f:'r_board', when:'no'}},
      {id:'r_docs_missing', en:'How many documents are still missing?', am:'እስካሁን ስንት ሰነዶች ጎድለዋል?', t:'num', auto:{week:'doc_missing', how:'last'}},
      {id:'r_docs_list', en:'Which documents, from whom, and since when?', am:'የትኞቹ ሰነዶች? ከማን? ከመቼ ጀምሮ?', t:'area', show:{f:'r_docs_missing', when:'pos'}},
      {id:'r_joblist', en:'Did the payment-confirmed job list reach Mahelet by Saturday 1:00 PM?',
        am:'የክፍያ ማረጋገጫ ዝርዝሩ ቅዳሜ ከቀኑ 7፡00 በፊት ለማህሌት ደርሷል?', t:'yesno'},
      {id:'r_joblist_why', en:'Why not, and when did it go?', am:'ለምን አልደረሰም? መቼ ተላከ?', t:'area', show:{f:'r_joblist', when:'no'}},
      {id:'seble_err', en:'Did any work delegated to Seble need correcting this week?', am:'በዚህ ሳምንት ለሰብለ የተሰጠ ሥራ ማስተካከያ አስፈልጎታል?', t:'yesno'},
      {id:'seble_err_what', en:'What was wrong, how often, and what has been done so it does not happen again?', am:'ምን ተሳስቶ ነበር? ስንት ጊዜ? እንዳይደገም ምን ተደረገ?', t:'area', show:{f:'seble_err', when:'yes'}}
    ]},
    { en:'7 · Money spent this week', am:'7 · በዚህ ሳምንት የወጣ ገንዘብ', fields:[
      {id:'sp_sup', en:'How much was paid to suppliers this week — board and materials?', am:'በዚህ ሳምንት ለአቅራቢዎች — ለቦርድና ለዕቃዎች — ስንት ብር ተከፈለ?', t:'money'},
      {id:'sp_sal', en:'How much was paid in salaries and wages this week?', am:'በዚህ ሳምንት ለደመወዝ ስንት ብር ተከፈለ?', t:'money'},
      {id:'sp_asm', en:'How much was paid to assemblers this week?', am:'በዚህ ሳምንት ለገጣጣሚዎች ስንት ብር ተከፈለ?', t:'money'},
      {id:'sp_food', en:'How much was spent on staff food this week?', am:'በዚህ ሳምንት ለሠራተኞች ምግብ ስንት ብር ወጣ?', t:'money'},
      {id:'sp_meals', en:'How many meals did that pay for?', am:'ይህ ገንዘብ ለስንት ምግብ ተከፈለ?', t:'num', show:{f:'sp_food', when:'pos'}},
      {id:'sp_trans', en:'How much was spent on transport and fuel this week?', am:'በዚህ ሳምንት ለትራንስፖርትና ለነዳጅ ስንት ብር ወጣ?', t:'money'},
      {id:'sp_rent', en:'How much rent was paid this week?', am:'በዚህ ሳምንት ስንት ብር ኪራይ ተከፈለ?', t:'money'},
      {id:'sp_util', en:'How much was paid for power and water this week?', am:'በዚህ ሳምንት ለመብራትና ለውሃ ስንት ብር ተከፈለ?', t:'money'},
      {id:'sp_other', en:'How much else went out this week?', am:'በዚህ ሳምንት ሌላ ስንት ብር ወጣ?', t:'money'},
      {id:'sp_other_what', en:'What was it spent on?', am:'ምን ላይ ወጣ?', t:'area', show:{f:'sp_other', when:'pos'}}
    ]},
    { en:'8 · Problems and solutions', am:'8 · ችግሮችና መፍትሔዎች', fields:[
      {id:'w_problem', en:'What was the biggest problem this week, and what caused it?', am:'የዚህ ሳምንት ትልቁ ችግር ምን ነበር? ምክንያቱስ?', t:'area', opt:1},
      {id:'w_action', en:'What was done about it, by whom, and by when will it be fixed?', am:'ምን እርምጃ ተወሰደ? በማን? እስከ መቼ ይስተካከላል?', t:'area', opt:1},
      {id:'w_support', en:'What do you need from the Chairman or another department, and from whom?', am:'ከሊቀመንበሩ ወይም ከሌላ ክፍል ምን ያስፈልግዎታል? ከማን?', t:'area', opt:1},
      {id:'need_chair', en:'Do you need a decision from the Chairman?', am:'የሊቀመንበሩ ውሳኔ ያስፈልግዎታል?', t:'yesno'},
      {id:'need_chair_what', en:'What exactly should the Chairman decide, what are the options, and by when?', am:'ሊቀመንበሩ በትክክል ምን እንዲወስኑ ይፈልጋሉ? አማራጮቹ ምንድን ናቸው? እስከ መቼ?', t:'area', show:{f:'need_chair', when:'yes'}}
    ]},
    { en:'9 · Next week', am:'9 · የሚቀጥለው ሳምንት', fields:[
      {id:'next_week', en:'What are your top 3 priorities next week — including any tax or statutory payment falling due?', am:'በሚቀጥለው ሳምንት ዋና ሦስት ሥራዎች ምንድን ናቸው? — የሚደርስ የግብር ወይም የሕግ ክፍያ ካለ ጨምሮ', t:'area'}
    ]}
  ]
},

/* ============== BETELHEM — WEEKLY CUSTOMER EXPERIENCE ============== */
{
  id:'betty-weekly-cx', person:'betty', cadence:'weekly', dueTime:'11:00', dueDay:1,
  en:'Weekly Customer Experience Summary', am:'ሳምንታዊ የደንበኛ አገልግሎት ሪፖርት',
  toEn:'Chairman + Ephrata + Kidan', toAm:'ሊቀመንበር + ኤፍራታ + ኪዳን',
  dueEn:'Monday 11:00 AM', dueAm:'ሰኞ ከጠዋቱ 5፡00 (11:00 AM)',
  penEn:'Late or not sent –500 Birr', penAm:'ዘግይቶ ወይም ካልቀረበ –500 ብር',
  derived:1,
  sections:[
    { en:'1 · Customer pulse last week', am:'1 · ያለፈው ሳምንት የደንበኛ ስሜት', fields:[
      {id:'cx_groups', en:'How many customer groups were watched last week?', am:'ባለፈው ሳምንት ስንት የደንበኛ ግሩፖች ተከታተሉ?', t:'num'},
      {id:'cx_contacted', en:'How many customers did you speak to directly?', am:'ስንት ደንበኞችን በቀጥታ አነጋገሩ?', t:'num', auto:{week:'pl_called'}},
      {id:'cx_reports', en:'How many daily pulse reports went out on time? (on time / due)', am:'ስንቱ ዕለታዊ የደንበኛ ስሜት ሪፖርት በሰዓቱ ተላከ? (በሰዓቱ / የሚገባው)', t:'ratio',
        tgt:{op:'gte', v:5, en:'All 5 on time earns the 3,000 Birr bonus',
             am:'አምስቱም በሰዓቱ ከተላኩ 3,000 ብር ቦነስ'}},
      {id:'cx_reports_why', en:'Which days were late or missed, and why?', am:'የትኞቹ ቀናት ዘገዩ ወይም ቀሩ? ለምን?', t:'area', show:{f:'cx_reports', when:'short'}}
    ]},
    { en:'2 · Complaints', am:'2 · ቅሬታዎች', fields:[
      {id:'cx_new_any', en:'Did any new complaint come in last week?', am:'ባለፈው ሳምንት የደረሰ አዲስ ቅሬታ አለ?', t:'yesno'},
      {id:'cx_new_list', en:'List each new complaint', am:'እያንዳንዱን አዲስ ቅሬታ ይዘርዝሩ', t:'table', addEn:'Add complaint', addAm:'ቅሬታ ጨምር',
        show:{f:'cx_new_any', when:'yes'},
        cols:[
          {id:'cust', en:'Customer', am:'ደንበኛ', t:'text'},
          {id:'job', en:'Job code', am:'የሥራ ኮድ', t:'text'},
          {id:'issue', en:'About', am:'ስለ ምን', t:'text'},
          {id:'dept', en:'Department at fault', am:'ተጠያቂ ክፍል', t:'text'},
          {id:'state', en:'Status', am:'ሁኔታ', t:'choice', opts:[
            {v:'open',   en:'Open', am:'ክፍት'},
            {v:'working',en:'Being worked on', am:'በሥራ ላይ'},
            {v:'closed', en:'Resolved', am:'ተፈቷል'}]}
        ]},
      {id:'cx_new', en:'How many new complaints came in last week?', am:'ባለፈው ሳምንት ስንት አዲስ ቅሬታዎች መጡ?', t:'num',
        auto:{rows:'cx_new_list'}, sumEn:'complaints', sumAm:'ቅሬታዎች'},
      {id:'cx_resolved', en:'How many were resolved?', am:'ስንቱ ተፈቱ?', t:'num'},
      {id:'cx_open', en:'How many are still open?', am:'ስንቱ ገና አልተፈቱም?', t:'num'},
      {id:'cx_open_why', en:'Which ones, who owns each, what is stopping it, and when will it be closed?', am:'የትኞቹ ናቸው? እያንዳንዱን የያዘው ማን ነው? ምን አቆመው? መቼ ይዘጋል?', t:'area', show:{f:'cx_open', when:'pos'}},
      {id:'cx_sameday', en:'Was every complaint reported the same day?', am:'እያንዳንዱ ቅሬታ በዕለቱ ተነግሯል?', t:'yesno',
        },
      {id:'cx_sameday_why', en:'Which complaint was reported late, and why?', am:'የትኛው ቅሬታ ዘግይቶ ተነገረ? ለምን?', t:'area', show:{f:'cx_sameday', when:'no'}},
      {id:'cx_repeat', en:'How many customers complained more than once?', am:'ስንት ደንበኞች ከአንድ ጊዜ በላይ አማረሩ?', t:'num'},
      {id:'cx_repeat_who', en:'Who, about what each time, and why did the first fix not hold?', am:'እነማን ናቸው? በየጊዜው ስለምን? የመጀመሪያው መፍትሔ ለምን አልጸናም?', t:'area', show:{f:'cx_repeat', when:'pos'}}
    ]},
    { en:'3 · What customers said', am:'3 · ደንበኞች ያሉት', fields:[
      {id:'cx_good', en:'What did customers praise last week?', am:'ባለፈው ሳምንት ደንበኞች ምን አደነቁ?', t:'area', opt:1},
      {id:'cx_bad', en:'What did customers complain about most?', am:'ደንበኞች በብዛት ያማረሩት በምን ላይ ነው?', t:'area', opt:1},
      {id:'cx_pattern', en:'Is there a pattern the Chairman should see — the same problem, stage or team again and again?', am:'ሊቀመንበሩ ሊያዩት የሚገባ ተደጋጋሚ ጉዳይ አለ? — ያው ችግር፣ ደረጃ ወይም ቡድን ደጋግሞ?', t:'area', opt:1}
    ]},
    { en:'4 · Satisfaction', am:'4 · እርካታ', fields:[
      {id:'cx_score', en:'What was the average satisfaction score, out of 5?', am:'አማካይ የእርካታ ነጥብ ከ5 ስንት ነው?', t:'num'},
      {id:'cx_rated', en:'How many customers gave a score?', am:'ስንት ደንበኞች ነጥብ ሰጡ?', t:'num'}
    ]},
    { en:'5 · What happens next', am:'5 · ቀጣዩ እርምጃ', fields:[
      {id:'cx_fix', en:'What one change would stop the most complaints this week, and who must make it?', am:'በዚህ ሳምንት ብዙ ቅሬታዎችን የሚያስቀር አንድ ለውጥ ምንድን ነው? ማን ሊያደርገው ይገባል?', t:'area'},
      {id:'need_chair', en:'Do you need a decision from the Chairman?', am:'የሊቀመንበሩ ውሳኔ ያስፈልግዎታል?', t:'yesno'},
      {id:'need_chair_what', en:'What exactly should the Chairman decide, what are the options, and by when?', am:'ሊቀመንበሩ በትክክል ምን እንዲወስኑ ይፈልጋሉ? አማራጮቹ ምንድን ናቸው? እስከ መቼ?', t:'area', show:{f:'need_chair', when:'yes'}},
      {id:'next_week', en:'Which 3 customers need the most attention this week, and why?', am:'በዚህ ሳምንት በጣም ትኩረት የሚያስፈልጋቸው ሦስት ደንበኞች እነማን ናቸው? ለምን?', t:'area'}
    ]}
  ]
},

/* ==================== GETACHEW — WEEKLY PURCHASING ==================== */
{
  id:'getachew-weekly', person:'getachew', cadence:'weekly', dueTime:'17:00', dueDay:6,
  en:'Weekly Purchasing Summary', am:'ሳምንታዊ የግዥ ሪፖርት',
  toEn:'Chairman, copied to Mahelet and Selam', toAm:'ሊቀመንበር፣ ግልባጭ ለማህሌትና ለሰላም',
  dueEn:'Saturday 5:00 PM', dueAm:'ቅዳሜ ከቀኑ 11፡00 (5:00 PM)',
  penEn:'Late or not sent –500 Birr', penAm:'ዘግይቶ ወይም ካልቀረበ –500 ብር',
  derived:1,
  sections:[
    { en:'1 · Purchase requests', am:'1 · የግዥ ጥያቄዎች', fields:[
      {id:'g_prep', en:'How many purchase requests did you prepare this week?', am:'በዚህ ሳምንት ስንት የግዥ ጥያቄ አዘጋጁ?', t:'num', auto:{week:'pr_prep'}},
      {id:'g_app', en:'How many did Selam approve?', am:'ሰላም ስንቱን አጸደቀች?', t:'num', auto:{week:'pr_app'}},
      {id:'g_ret', en:'How many were returned or rejected?', am:'ስንቱ ተመለሱ ወይም ውድቅ ሆኑ?', t:'num', auto:{week:'pr_ret'}},
      {id:'g_ret_why', en:'What were the reasons, and what will change so it stops happening?', am:'ምክንያቶቹ ምን ነበሩ? እንዳይደገም ምን ይቀየራል?', t:'area', show:{f:'g_ret', when:'pos'}},
      {id:'g_quotes', en:'How many requests carried 3 or more quotes? (with 3 quotes / all requests)', am:'ስንቱ ጥያቄ 3 እና ከዚያ በላይ ፕሮፎርማ ነበረው? (3 ፕሮፎርማ ያላቸው / ሁሉም ጥያቄዎች)', t:'ratio',
        auto:{a:{week:'pr_quotes__a'}, b:{week:'pr_quotes__b'}}},
      {id:'g_quotes_why', en:'Which requests had fewer than 3 quotes, and why?', am:'ከ3 ያነሰ ፕሮፎርማ የነበራቸው የትኞቹ ጥያቄዎች ናቸው? ለምን?', t:'area', show:{f:'g_quotes', when:'short'}},
      {id:'g_acc', en:'What was your purchase accuracy this week?', am:'በዚህ ሳምንት የግዥ ትክክለኛነትዎ ስንት በመቶ ነበር?', t:'pct',
        tgt:{op:'gte', v:95, en:'Target ≥95% — below is –500 Birr/month',
             am:'ዒላማ ≥95% — በታች ከሆነ በወር –500 ብር'}},
      {id:'g_acc_why', en:'Which purchases went wrong, how, and what will you do differently?', am:'የትኞቹ ግዥዎች ተሳሳቱ? እንዴት? ከዚህ በኋላ ምን በተለየ መንገድ ይሠራሉ?', t:'area', show:{f:'g_acc', when:'miss'}}
    ]},
    { en:'2 · ZamZam Bank cheques', am:'2 · የዘምዘም ባንክ ቼኮች', fields:[
      {id:'g_chq', en:'How many cheques did you issue this week?', am:'በዚህ ሳምንት ስንት ቼክ ሰጡ?', t:'num',
        auto:{week:'chq_issued'}},
      {id:'g_chq_val', en:'What is the total value of this week\'s cheques?', am:'የዚህ ሳምንት ቼኮች ጠቅላላ ዋጋ ስንት ነው?', t:'money', auto:{week:'chq_value'}},
      {id:'g_chq_err', en:'How many cheque errors were there?', am:'ስንት የቼክ ስህተት ነበር?', t:'num',
        tgt:{op:'lte', v:0, en:'Zero errors earns the 1,000 Birr bonus',
             am:'ዜሮ ስህተት 1,000 ብር ቦነስ ያስገኛል'}},
      {id:'g_chq_err_what', en:'Which cheques, what was wrong, and how was it corrected?', am:'የትኞቹ ቼኮች? ምን ስህተት ነበር? እንዴት ተስተካከለ?', t:'area', show:{f:'g_chq_err', when:'pos'}},
      {id:'g_chq_secure', en:'Was the cheque book locked away every night?', am:'የቼክ ደብተሩ በየምሽቱ ተቆልፎበታል?', t:'yesno'},
      {id:'g_chq_secure_why', en:'Which nights not, and why?', am:'የትኞቹ ምሽቶች አልተቆለፈበትም? ለምን?', t:'area', show:{f:'g_chq_secure', when:'no'}}
    ]},
    { en:'3 · Suppliers and savings', am:'3 · አቅራቢዎችና ቁጠባ', fields:[
      {id:'g_sup', en:'How many suppliers did you buy from this week?', am:'በዚህ ሳምንት ከስንት አቅራቢዎች ገዙ?', t:'num',
        auto:{week:'ord_placed'}},
      {id:'g_delays_any', en:'Was any supplier delivery late this week?', am:'በዚህ ሳምንት የዘገየ የአቅራቢ ጭነት አለ?', t:'yesno'},
      {id:'g_delays_list', en:'Which suppliers were late, and what did it cost us?', am:'የዘገዩት የትኞቹ አቅራቢዎች ናቸው? ምን አሳጣን?', t:'table', addEn:'Add a supplier', addAm:'አቅራቢ ጨምር',
        show:{f:'g_delays_any', when:'yes'},
        cols:[
          {id:'sup', en:'Supplier', am:'አቅራቢ', t:'text'},
          {id:'times', en:'Times late', am:'የዘገየበት ብዛት', t:'num'},
          {id:'days', en:'Days late', am:'የዘገየበት ቀን', t:'num'},
          {id:'effect', en:'Effect on production', am:'በምርት ላይ ያደረሰው', t:'text'}
        ]},
      {id:'g_delays', en:'How many supplier deliveries were late?', am:'ስንት የአቅራቢ ርክክቦች ዘገዩ?', t:'num',
        auto:{rows:'g_delays_list'}, sumEn:'late deliveries', sumAm:'የዘገዩ ርክክቦች'},
      {id:'g_quality', en:'How many quality problems came from suppliers?', am:'ከአቅራቢዎች ስንት የጥራት ችግር መጣ?', t:'num', auto:{week:'sup_quality'}},
      {id:'g_quality_what', en:'Which suppliers, what went wrong, and should we keep buying from them?', am:'የትኞቹ አቅራቢዎች? ምን ችግር ነበር? ከእነሱ መግዛታችንን መቀጠል አለብን?', t:'area', show:{f:'g_quality', when:'pos'}},
      {id:'g_saving', en:'How much below the last price paid did you buy this week?', am:'በዚህ ሳምንት ከመጨረሻው የተከፈለ ዋጋ በታች በስንት ብር ገዙ?', t:'money', opt:1},
      {id:'g_saving_how', en:'On which purchases, and how was the saving made?', am:'በየትኞቹ ግዥዎች? ቁጠባው እንዴት ተገኘ?', t:'area', show:{f:'g_saving', when:'pos'}},
      {id:'g_best', en:'Which supplier served us best this week, and why?', am:'በዚህ ሳምንት በጣም ጥሩ ያገለገለን የትኛው አቅራቢ ነው? ለምን?', t:'area', opt:1}
    ]},
    { en:'4 · Supplier credit', am:'4 · የአቅራቢ ዱቤ', fields:[
      {id:'g_cr_new', en:'How much did you buy on credit this week — no cheque given yet?', am:'በዚህ ሳምንት በዱቤ — ቼክ ሳይሰጥ — ስንት ብር ገዙ?', t:'money'},
      {id:'g_cr_paid', en:'How much earlier credit did you pay this week, by cheque?', am:'በዚህ ሳምንት ቀድሞ የተወሰደ ዱቤ ስንት ብር በቼክ ተከፈለ?', t:'money',
        auto:{week:'cr_paid'}},
      {id:'g_cr_owed', en:'How much does Klever owe suppliers in total now?', am:'ክሌቨር አሁን ለአቅራቢዎች በጠቅላላ ስንት ብር አለበት?', t:'money',
        auto:{week:'cr_owed', how:'last'}, parts:{of:['g_cr_overdue', 'g_cr_next']}},
      {id:'g_cr_list', en:'Who is owed, how much, and by when?', am:'ለማን ዕዳ አለ? ስንት? እስከ መቼ?', t:'table', addEn:'Add a supplier', addAm:'አቅራቢ ጨምር', opt:1, cols:[
          {id:'sup', en:'Supplier', am:'አቅራቢ', t:'text'},
          {id:'amount', en:'Owed', am:'ዕዳ', t:'money'},
          {id:'due', en:'Pay by', am:'የሚከፈልበት ቀን', t:'date'}
        ]},
      {id:'g_cr_next', en:'How much of it falls due next week?', am:'ከዚህ ውስጥ በሚቀጥለው ሳምንት የሚደርሰው ስንት ነው?', t:'money', opt:1},
      {id:'g_cr_overdue', en:'How much is already past the date we promised?', am:'ቃል የገባንበት ቀን ያለፈው ስንት ነው?', t:'money',
        auto:{week:'cr_overdue', how:'last'},
        tgt:{op:'lte', v:0, en:'Should be 0 — a supplier owed past the date can stop delivering',
             am:'ዜሮ መሆን አለበት — ቀኑ ያለፈበት አቅራቢ ዕቃ ማቅረብ ሊያቆም ይችላል'}},
      {id:'g_cr_overdue_why', en:'Which suppliers, and why are they not paid?', am:'የትኞቹ አቅራቢዎች? ለምን አልተከፈላቸውም?', t:'area', show:{f:'g_cr_overdue', when:'miss'}},
      {id:'g_cr_risk', en:'Is any supplier refusing to deliver until paid, or stopping our credit?', am:'እስኪከፈለው ዕቃ ላለማቅረብ የሚል ወይም ዱቤ ያቆመ አቅራቢ አለ?', t:'area', opt:1}
    ]},
    { en:'5 · Documents to Selam', am:'5 · ለሰላም የተላኩ ሰነዶች', fields:[
      {id:'g_doc24', en:'How many documents reached Selam within 24 hours? (on time / all due)', am:'ስንት ሰነዶች በ24 ሰዓት ውስጥ ለሰላም ደረሱ? (በሰዓቱ / መድረስ የነበረባቸው)', t:'ratio',
        auto:{a:{week:'doc_24__a'}, b:{week:'doc_24__b'}}},
      {id:'g_doc_missing', en:'How many documents are still outstanding?', am:'እስካሁን ያልቀረቡ ሰነዶች ስንት ናቸው?', t:'num', auto:{week:'doc_missing', how:'last'},
        tgt:{op:'lte', v:0, en:'–200 Birr per document', am:'በሰነድ –200 ብር'}},
      {id:'g_doc_missing_list', en:'Which documents, for which jobs, and when will each reach Selam?', am:'የትኞቹ ሰነዶች? ለየትኞቹ ሥራዎች? እያንዳንዱ መቼ ለሰላም ይደርሳል?', t:'table', addEn:'Add a document', addAm:'ሰነድ ጨምር',
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
    /* imports (8 Oct 2026), for the procurement reader */
    { en:'6 · Imports', am:'6 · ከውጭ የሚገቡ ዕቃዎች', fields:[
      {id:'imp_any', en:'Is anything being imported for Klever right now?', am:'አሁን ለክሌቨር ከውጭ የሚገባ ዕቃ አለ?', t:'yesno'},
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
    { en:'7 · Problems and solutions', am:'7 · ችግሮችና መፍትሔዎች', fields:[
      {id:'w_problem', en:'What was the biggest problem this week, and what caused it?', am:'የዚህ ሳምንት ትልቁ ችግር ምን ነበር? ምክንያቱስ?', t:'area', opt:1},
      {id:'w_action', en:'What was done about it, by whom, and by when will it be fixed?', am:'ምን እርምጃ ተወሰደ? በማን? እስከ መቼ ይስተካከላል?', t:'area', opt:1},
      {id:'w_need', en:'What do you need from Mahelet, Selam or the store next week?', am:'በሚቀጥለው ሳምንት ከማህሌት፣ ከሰላም ወይም ከመጋዘን ምን ያስፈልግዎታል?', t:'area', opt:1},
      {id:'w_chair', en:'Do you need a decision from the Chairman?', am:'የሊቀመንበሩ ውሳኔ ያስፈልግዎታል?', t:'yesno'},
      {id:'w_chair_what', en:'What exactly should he decide, what are the options, and by when?', am:'በትክክል ምን እንዲወስኑ ይፈልጋሉ? አማራጮቹ ምንድን ናቸው? እስከ መቼ?', t:'area', show:{f:'w_chair', when:'yes'}},
      {id:'w_next', en:'What must be bought next week, for which jobs, and what is at risk of arriving late?', am:'በሚቀጥለው ሳምንት ምን መገዛት አለበት? ለየትኞቹ ሥራዎች? የመዘግየት ስጋት ያለበት ምንድን ነው?', t:'area', opt:1}
    ]}
  ]
},

/* ===================== YORDANOS — WEEKLY STORE ===================== */
{
  id:'yordanos-weekly', person:'yordanos', cadence:'weekly', dueTime:'17:00', dueDay:6,
  en:'Weekly Store Summary', am:'ሳምንታዊ የመጋዘን ሪፖርት',
  toEn:'Chairman, copied to Mahelet and Selam', toAm:'ሊቀመንበር፣ ግልባጭ ለማህሌትና ለሰላም',
  dueEn:'Saturday 5:00 PM', dueAm:'ቅዳሜ ከቀኑ 11፡00 (5:00 PM)',
  penEn:'Reports are mandatory weekly', penAm:'ሳምንታዊ ሪፖርት ግዴታ ነው',
  derived:1,
  sections:[
    { en:'1 · Saturday stock count', am:'1 · የቅዳሜ ቆጠራ', fields:[
      {id:'y_count', en:'Was the Saturday physical stock count done?', am:'የቅዳሜ የዕቃ ቆጠራ ተከናውኗል?', t:'yesno'},
      {id:'y_count_why', en:'Why not, and when will it be done?', am:'ለምን? መቼ ይከናወናል?', t:'area', show:{f:'y_count', when:'no'}},
      {id:'y_accuracy', en:'What was stock accuracy at the count?', am:'በቆጠራው የዕቃው ቁጥር ስንት በመቶ ትክክል ነበር?', t:'pct',
        tgt:{op:'gte', v:99, en:'Target ≥99% — 2,000 Birr KPI bonus',
             am:'ዒላማ ≥99% — 2,000 ብር ቦነስ'}},
      {id:'y_accuracy_why', en:'Below 99%: what caused the gaps, and what will change in how the store is run?', am:'ከ99% በታች ነው፦ ልዩነቱን ምን አመጣው? የመጋዘኑ አሠራር ምን ይቀየራል?', t:'area', show:{f:'y_accuracy', when:'miss'}},
      {id:'y_disc_any', en:'Did the count find any difference this week?', am:'በዚህ ሳምንት ቆጠራው ልዩነት አገኘ?', t:'yesno'},
      {id:'y_disc_list', en:'List each difference', am:'እያንዳንዱን ልዩነት ይዘርዝሩ', t:'table', addEn:'Add an item', addAm:'ዕቃ ጨምር',
        show:{f:'y_disc_any', when:'yes'},
        cols:[
          {id:'item', en:'Material', am:'ዕቃ', t:'text'},
          {id:'book', en:'On record', am:'በመዝገብ', t:'num'},
          {id:'count', en:'Counted', am:'የተቆጠረ', t:'num'},
          {id:'why', en:'Reason', am:'ምክንያት', t:'text'},
          {id:'told', en:'Reported the same day?', am:'በዚያው ቀን ተነግሯል?', t:'yesno'}
        ]},
      {id:'y_disc', en:'How many differences did the count find?', am:'ቆጠራው ስንት ልዩነት አገኘ?', t:'num',
        auto:{rows:'y_disc_list'}, sumEn:'differences', sumAm:'ልዩነቶች',
        tgt:{op:'lte', v:0, en:'Zero earns the 1,000 Birr accuracy bonus',
             am:'ዜሮ ከሆነ 1,000 ብር ቦነስ'}},
      {id:'y_missing', en:'How many materials are missing?', am:'ስንት ዕቃዎች ጠፍተዋል?', t:'num',
        tgt:{op:'lte', v:0, en:'–1,000 Birr each', am:'እያንዳንዱ –1,000 ብር'}},
      {id:'y_missing_what', en:'What is missing, what is it worth, and who was told?', am:'ምን ጠፋ? ዋጋው ስንት ነው? ለማን ተነገረ?', t:'area', show:{f:'y_missing', when:'pos'}}
    ]},
    { en:'2 · Receiving this week', am:'2 · በዚህ ሳምንት የገባ ዕቃ', fields:[
      {id:'y_deliv', en:'How many deliveries came in this week?', am:'በዚህ ሳምንት ስንት ጭነት ገባ?', t:'num',
        auto:{week:'rec_deliv'}},
      {id:'y_accepted', en:'How many were accepted into the store?', am:'ስንቱ ወደ መጋዘን ገቡ?', t:'num',
        auto:{week:'rec_accepted'}},
      {id:'y_rejected', en:'How many did you reject?', am:'ስንቱን ውድቅ አደረጉ?', t:'num',
        auto:{week:'rec_rejected'}},
      {id:'y_rejected_what', en:'What was rejected, from which suppliers, and has it been replaced?', am:'ምን ውድቅ ተደረገ? ከየትኞቹ አቅራቢዎች? ተተክቷል?', t:'area', show:{f:'y_rejected', when:'pos'}},
      {id:'y_grn', en:'Was everything received against a Job File or BOM?', am:'ሁሉም ከጆብ ፋይል ወይም BOM ጋር ተመሳክሮ ተረክቧል?', t:'yesno'},
      {id:'y_grn_why', en:'What came in without one, and why?', am:'ያለ ጆብ ፋይል ወይም BOM የገባው ምንድን ነው? ለምን?', t:'area', show:{f:'y_grn', when:'no'}}
    ]},
    { en:'3 · Issuing', am:'3 · ዕቃ ማውጣት', fields:[
      {id:'y_issues', en:'How many times were materials issued this week?', am:'በዚህ ሳምንት ስንት ጊዜ ዕቃ ከመጋዘን ወጣ?', t:'num', auto:{week:'iss_count'}},
      {id:'y_approved', en:'Did every issue carry Mahelet\'s signed approval?', am:'እያንዳንዱ ዕቃ በማህሌት ፊርማ ፈቃድ ወጥቷል?', t:'yesno'},
      {id:'y_approved_why', en:'What went out without it, for which job, and who allowed it?', am:'ያለፈቃድ የወጣው ምንድን ነው? ለየትኛው ሥራ? ማን ፈቀደ?', t:'area', show:{f:'y_approved', when:'no'}},
      {id:'y_correct', en:'Did everything go to the correct job?', am:'ሁሉም ለትክክለኛው ሥራ ወጥቷል?', t:'yesno'},
      {id:'y_correct_why', en:'What went to the wrong job, and has it been put right?', am:'ወደ ተሳሳተ ሥራ የሄደው ምንድን ነው? ተስተካክሏል?', t:'area', show:{f:'y_correct', when:'no'}}
    ]},
    { en:'4 · Shortages', am:'4 · እጥረቶች', fields:[
      {id:'y_short', en:'How many shortages did you flag this week?', am:'በዚህ ሳምንት ስንት እጥረት ጠቆሙ?', t:'num', auto:{week:'sh_flagged'}},
      {id:'y_short_what', en:'Which materials, and did each arrive before it was needed?', am:'የትኞቹ ዕቃዎች? እያንዳንዱ ከመፈለጉ በፊት ደረሰ?', t:'area', show:{f:'y_short', when:'pos'}},
      {id:'y_stopped', en:'How many times did production stop because a shortage was not reported?',
        am:'ባልተነገረ እጥረት ምርት ስንት ጊዜ ቆመ?', t:'num',
        tgt:{op:'lte', v:0, en:'Zero earns the 500 Birr bonus', am:'ዜሮ ከሆነ 500 ብር ቦነስ'}},
      {id:'y_stopped_what', en:'Which jobs, for how long, and why was the shortage not reported in time?', am:'የትኞቹ ሥራዎች? ለምን ያህል ጊዜ? እጥረቱ በጊዜ ለምን አልተነገረም?', t:'area', show:{f:'y_stopped', when:'pos'}}
    ]},
    { en:'5 · Factory consumables', am:'5 · የፋብሪካ ፍጆታ ዕቃዎች', fields:[
      {id:'y_con_week', en:'How many consumable items were issued this week?', am:'በዚህ ሳምንት ስንት የፍጆታ ዕቃ ወጣ?', t:'num', auto:{week:'con_today'}},
      {id:'y_con_mtd', en:'How much has been spent on consumables this month so far?', am:'በዚህ ወር እስካሁን ለፍጆታ ዕቃ ስንት ብር ወጣ?', t:'money', auto:{week:'con_mtd', how:'last'},
        tgt:{op:'lte', v:30000, en:'Budget 30,000 Birr/month — above needs Chairman approval',
             am:'የወር በጀት 30,000 ብር — በላይ ከሆነ የሊቀመንበር ፈቃድ'}},
      {id:'y_con_mtd_why', en:'The month is over 30,000 Birr. What drove it, and has the Chairman approved the extra?', am:'የወሩ ወጪ ከ30,000 ብር አልፏል። ምን አሳደገው? ተጨማሪውን ሊቀመንበሩ አጽድቀዋል?', t:'area', show:{f:'y_con_mtd', when:'miss'}}
    ]},
    { en:'6 · Store condition and problems', am:'6 · የመጋዘን ሁኔታና ችግሮች', fields:[
      {id:'y_secure', en:'Was the store locked and secure every night?', am:'መጋዘኑ በየምሽቱ ተቆልፎ ደህንነቱ ተጠብቆ ነበር?', t:'yesno'},
      {id:'y_secure_why', en:'Which nights not, and why?', am:'የትኞቹ ምሽቶች አልተቆለፈም? ለምን?', t:'area', show:{f:'y_secure', when:'no'}},
      {id:'y_theft', en:'Was anything stolen or taken out without permission this week?', am:'በዚህ ሳምንት የተሰረቀ ወይም ያለፈቃድ የወጣ ዕቃ አለ?', t:'yesno'},
      {id:'y_theft_what', en:'What, how much is it worth, who is involved, and were Mahelet and Selam told?', am:'ምን? ዋጋው ስንት ነው? ማን ተሳትፏል? ለማህሌትና ለሰላም ተነግሯል?', t:'area', show:{f:'y_theft', when:'yes'}},
      {id:'y_problem', en:'What was the biggest problem in the store this week, and what caused it?', am:'በመጋዘኑ የዚህ ሳምንት ትልቁ ችግር ምን ነበር? ምክንያቱስ?', t:'area', opt:1},
      {id:'y_action', en:'What was done about it, by whom, and by when will it be fixed?', am:'ምን እርምጃ ተወሰደ? በማን? እስከ መቼ ይስተካከላል?', t:'area', opt:1},
      {id:'y_need', en:'What do you need from Mahelet, Getachew or Selam?', am:'ከማህሌት፣ ከጌታቸው ወይም ከሰላም ምን ያስፈልግዎታል?', t:'area', opt:1},
      {id:'y_chair', en:'Do you need a decision from the Chairman?', am:'የሊቀመንበሩ ውሳኔ ያስፈልግዎታል?', t:'yesno'},
      {id:'y_chair_what', en:'What exactly should he decide, what are the options, and by when?', am:'በትክክል ምን እንዲወስኑ ይፈልጋሉ? አማራጮቹ ምንድን ናቸው? እስከ መቼ?', t:'area', show:{f:'y_chair', when:'yes'}}
    ]},
    { en:'7 · Next week', am:'7 · የሚቀጥለው ሳምንት', fields:[
      {id:'y_next', en:'What is expected in next week, and what is likely to run short?', am:'በሚቀጥለው ሳምንት ምን ይገባል? ምንስ ሊያጥር ይችላል?', t:'area'}
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
    { en:'1 · Expected contracts', am:'1 · የሚጠበቁ ውሎች', fields:[
      {id:'proj_contracts', en:'Which customers do you expect to sign in the next 4 weeks?', am:'በሚቀጥሉት 4 ሳምንታት የትኞቹ ደንበኞች ውል ይፈርማሉ ብለው ይጠብቃሉ?',
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
        {id:'next', en:'Next step', am:'ቀጣይ እርምጃ', t:'text'}
      ]},
      {id:'proj_last', en:'Which customers from last week\'s projection did not sign or pay as expected, and why?', am:'ባለፈው ሳምንት ትንበያ ውስጥ ከነበሩት ደንበኞች እንደተጠበቀው ያልፈረሙ ወይም ያልከፈሉ እነማን ናቸው? ለምን?', t:'area', opt:1}
    ]},
    { en:'2 · Expected collections by week', am:'2 · በሳምንት የሚጠበቅ ገቢ', fields:[
      {id:'proj_weeks', en:'How much do you expect to collect in each of the next 4 weeks?', am:'በሚቀጥሉት 4 ሳምንታት በእያንዳንዱ ሳምንት ስንት ብር ይሰበሰባል ብለው ይጠብቃሉ?', t:'grid',
       rows:[{en:'Week 1', am:'ሳምንት 1'},{en:'Week 2', am:'ሳምንት 2'},
             {en:'Week 3', am:'ሳምንት 3'},{en:'Week 4', am:'ሳምንት 4'}],
       cols:[
        {id:'adv', en:'Expected advance', am:'የሚጠበቅ ቅድመ ክፍያ', t:'money'},
        {id:'fin', en:'Expected final', am:'የሚጠበቅ የመጨረሻ ክፍያ', t:'money'},
        {id:'tot', en:'Total expected', am:'ጠቅላላ የሚጠበቅ', t:'money'}
      ]},
      {id:'proj_total', en:'What is the total expected over the 4 weeks?', am:'የአራቱ ሳምንታት ጠቅላላ የሚጠበቅ ገቢ ስንት ነው?', t:'money',
        tgt:{op:'gte', v:12000000, en:'Below 12,000,000 Birr triggers the rolling penalty',
             am:'ከ12,000,000 ብር በታች ከሆነ ቅጣት ያስከትላል'}},
      {id:'proj_gap', en:'The plan is below 12,000,000 Birr. What would close the gap, and what do you need to make it happen?', am:'ትንበያው ከ12,000,000 ብር በታች ነው። ክፍተቱን ምን ይሞላዋል? ለዚህ ምን ያስፈልግዎታል?', t:'area', show:{f:'proj_total', when:'miss'}}
    ]},
    { en:'3 · Obstacles or support needed', am:'3 · እንቅፋቶች ወይም የሚያስፈልግ ድጋፍ', fields:[
      {id:'proj_obstacles', en:'What could stop these contracts or payments from happening?', am:'እነዚህ ውሎች ወይም ክፍያዎች እንዳይሳኩ ምን ሊያግድ ይችላል?', t:'area'},
      {id:'proj_capacity', en:'Which of these jobs will need production or installation in the next 4 weeks, and roughly how many m²?', am:'ከእነዚህ ሥራዎች በሚቀጥሉት 4 ሳምንታት ምርት ወይም ተከላ የሚያስፈልጋቸው የትኞቹ ናቸው? በግምት ስንት ካሬ ሜትር?', t:'area', opt:1},
      {id:'proj_support', en:'What support do you need from the Chairman?', am:'ከሊቀመንበሩ ምን ድጋፍ ያስፈልግዎታል?', t:'area', opt:1}
    ]},
    { en:'4 · Confidence statement', am:'4 · የእርግጠኝነት መግለጫ', fields:[
      {id:'proj_achievable', en:'Do you believe these projections are achievable?',
       am:'እነዚህ ትንበያዎች ሊሳኩ ይችላሉ ብለው ያምናሉ?', t:'yesno'},
      {id:'proj_why', en:'If not, which part is at risk, and why?', am:'ካልሆነ የትኛው ክፍል አደጋ ላይ ነው? ለምን?', t:'area', opt:1}
    ]}
  ]
},

/* ============== MAHELET — 15-DAY PRODUCTION PLAN ============== */
{
  id:'liu-plan', person:'liu', cadence:'weekly', dueTime:'15:00', dueDay:6,
  en:'15-Day Production Plan', am:'የ15 ቀን የምርት ዕቅድ',
  toEn:'Chairman + Kidan', toAm:'ሊቀመንበር + ኪዳን',
  dueEn:'Saturday 3:00 PM', dueAm:'ቅዳሜ ከቀኑ 9፡00 (3:00 PM)',
  penEn:'Late –5,000 Birr · Incomplete –2,000 Birr · Two weeks without a plan –10,000 Birr',
  penAm:'ዘግይቶ –5,000 ብር · ያልተሟላ –2,000 ብር · ሁለት ሳምንት ካልቀረበ –10,000 ብር',
  sections:[
    { en:'1 · Plan period', am:'1 · የዕቅዱ ጊዜ', fields:[
      {id:'plan_start', en:'On what date does this plan start?', am:'ዕቅዱ በየትኛው ቀን ይጀምራል?', t:'date'},
      {id:'plan_prep', en:'Who prepared this plan?', am:'ዕቅዱን ያዘጋጀው ማን ነው?', t:'text'},
      {id:'plan_changes', en:'What changed from last week\'s plan, and did the Chairman approve each change?', am:'ካለፈው ሳምንት ዕቅድ ምን ተቀየረ? እያንዳንዱ ለውጥ በሊቀመንበሩ ጸድቋል?', t:'area', opt:1}
    ]},
    { en:'2 · Payment-confirmed jobs from Selam', am:'2 · ከሰላም የክፍያ ማረጋገጫ ያላቸው ሥራዎች', fields:[
      {id:'plan_paid', en:'Which jobs has Selam confirmed in writing as fully paid?', am:'ሰላም ሙሉ ክፍያቸውን በጽሑፍ ያረጋገጠችላቸው የትኞቹ ሥራዎች ናቸው?',
       t:'table', addEn:'Add job', addAm:'ሥራ ጨምር', cols:[
        {id:'code', en:'Job code', am:'የሥራ ኮድ', t:'text'},
        {id:'cust', en:'Customer', am:'ደንበኛ', t:'text'},
        {id:'m2',   en:'m²', am:'ካሬ ሜትር', t:'num'},
        {id:'ok',   en:'Final payment confirmed', am:'የመጨረሻ ክፍያ ተረጋግጧል', t:'yesno'},
        {id:'date', en:"Selam's confirmation date", am:'ሰላም ያረጋገጠችበት ቀን', t:'text'}
      ]},
      {id:'plan_list_late', en:'Did Selam\'s list reach you by Saturday 1:00 PM?', am:'የሰላም ዝርዝር እስከ ቅዳሜ 7፡00 ደርሶዎታል?', t:'yesno'},
      {id:'plan_list_late_why', en:'When did it arrive, and what did the delay cost this plan?', am:'መቼ ደረሰ? መዘግየቱ በዚህ ዕቅድ ላይ ምን አስከተለ?', t:'area', show:{f:'plan_list_late', when:'no'}}
    ]},
    { en:'3 · Production queue', am:'3 · የምርት ተራ', fields:[
      {id:'plan_queue', en:'In what order will the jobs be produced?', am:'ሥራዎቹ በምን ቅደም ተከተል ይመረታሉ?',
       t:'table', addEn:'Add job to the queue', addAm:'ወደ ተራው ሥራ ጨምር', cols:[
        {id:'pri',  en:'Priority', am:'ቅድሚያ', t:'num'},
        {id:'code', en:'Job code', am:'የሥራ ኮድ', t:'text'},
        {id:'cust', en:'Customer', am:'ደንበኛ', t:'text'},
        {id:'m2',   en:'m²', am:'ካሬ ሜትር', t:'num'},
        {id:'start',en:'Planned start', am:'የሚጀመርበት', t:'date'},
        {id:'done', en:'Planned completion', am:'የሚጠናቀቅበት', t:'date'},
        {id:'qc',   en:'QC date', am:'የQC ቀን', t:'date'},
        {id:'del',  en:'Delivery date', am:'የማድረሻ ቀን', t:'date'}
      ]},
      {id:'plan_rove', en:'Does the plan include any Rovestone or other internal jobs?', am:'ዕቅዱ የሮቭስቶን ወይም ሌላ የውስጥ ሥራ ይዟል?', t:'yesno'},
      {id:'plan_rove_what', en:'Which ones, how many m², and has the Chairman approved each? (Internal work queues behind fully paid external jobs.)', am:'የትኞቹ? ስንት ካሬ ሜትር? እያንዳንዳቸውን ሊቀመንበሩ አጽድቀዋል? (የውስጥ ሥራ ሙሉ ከተከፈለባቸው የውጭ ሥራዎች በኋላ ነው።)', t:'area', show:{f:'plan_rove', when:'yes'}}
    ]},
    { en:'4 · Daily production target', am:'4 · የዕለት ተዕለት የምርት ዒላማ', fields:[
      {id:'plan_days', en:'How many m² are planned for each day, and on which jobs?', am:'በየቀኑ ስንት ካሬ ሜትር ታቅዷል? በየትኞቹ ሥራዎች?',
       /* 15 working days: Klever works Monday to Saturday (Chairman, 2 Oct 2026) */
       t:'grid', dateFrom:'plan_start', workDays:true,
       rows: Array.from({length:15}, function (_, i) {
         return {en:'Day ' + (i+1), am:'ቀን ' + (i+1)};
       }),
       cols:[
        {id:'m2',    en:'Planned m²', am:'የታቀደ ካሬ ሜትር', t:'num'},
        {id:'jobs',  en:'Jobs', am:'ሥራዎች', t:'text'},
        {id:'notes', en:'Notes', am:'ማስታወሻ', t:'text'}
      ]}
    ]},
    { en:'5 · Materials and bottlenecks', am:'5 · ዕቃዎችና እንቅፋቶች', fields:[
      /* the production date is set before the material is bought (the Chairman,
         8 Oct 2026), so the plan has to say what to buy. One row a material,
         not one a job — you buy the MDF once, and a job needing six materials
         would otherwise write its code six times. The same twelve materials
         the store counts, so the plan, the store and purchasing use one set
         of words. */
      {id:'plan_mat', en:'What does this plan need from the store, and for which jobs?', am:'ይህ ዕቅድ ከመጋዘን ምን ይፈልጋል? ለየትኞቹ ሥራዎች?',
       t:'table', addEn:'Add a material', addAm:'ዕቃ ጨምር', cols:[
          {id:'mat',  en:'Material', am:'ዕቃ', t:'choice', opts:[
            {v:'MDF 18mm',            en:'MDF 18mm',            am:'ኤምዲኤፍ 18ሚሜ'},
            {v:'MDF 16mm',            en:'MDF 16mm',            am:'ኤምዲኤፍ 16ሚሜ'},
            {v:'Melamine 18mm',       en:'Melamine 18mm',       am:'ሜላሚን 18ሚሜ'},
            {v:'Melamine 16mm',       en:'Melamine 16mm',       am:'ሜላሚን 16ሚሜ'},
            {v:'Plywood',             en:'Plywood',             am:'ፕላይውድ'},
            {v:'Back panel 3mm',      en:'Back panel 3mm',      am:'የኋላ ሰሌዳ 3ሚሜ'},
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
      {id:'plan_block', en:'What could stop this plan, and what support is needed, from whom?', am:'ይህን ዕቅድ ምን ሊያቆመው ይችላል? ምን ድጋፍ ያስፈልጋል? ከማን?', t:'area', opt:1}
    ]},
    { en:'6 · Confirmation', am:'6 · ማረጋገጫ', fields:[
      {id:'plan_rule', en:'Does every job in this plan have Selam’s written payment confirmation?',
       am:'በዚህ ዕቅድ ያለው እያንዳንዱ ሥራ የሰላም የጽሑፍ የክፍያ ማረጋገጫ አለው?', t:'yesno'},
      {id:'plan_rule_why', en:'Which job lacks it, and why is it in the plan? (–5,000 Birr per job)', am:'ማረጋገጫ የሌለው የትኛው ሥራ ነው? ለምን በዕቅዱ ገባ? (በሥራ –5,000 ብር)', t:'area', show:{f:'plan_rule', when:'no'}},
      {id:'plan_capacity', en:'Does the plan fit machine capacity and the materials available?',
       am:'ዕቅዱ ከማሽን አቅምና ካለው ዕቃ ጋር ይጣጣማል?', t:'yesno'},
      {id:'plan_capacity_why', en:'Where does it go over, and what will give — which job moves, or what extra is needed?', am:'የት ላይ ይበልጣል? ምን ይለቀቃል — የትኛው ሥራ ይዛወራል ወይስ ምን ተጨማሪ ያስፈልጋል?', t:'area', show:{f:'plan_capacity', when:'no'}}
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
    { en:'1 · Expected money in', am:'1 · የሚጠበቅ ገቢ', fields:[
      {id:'cf_in', en:'How much money do you expect in each of the next 4 weeks?', am:'በሚቀጥሉት 4 ሳምንታት በየሳምንቱ ስንት ብር ይገባል ብለው ይጠብቃሉ?', t:'grid',
       rows:[{en:'Week 1', am:'ሳምንት 1'},{en:'Week 2', am:'ሳምንት 2'},
             {en:'Week 3', am:'ሳምንት 3'},{en:'Week 4', am:'ሳምንት 4'}],
       cols:[
        {id:'adv',   en:'Advances', am:'ቅድመ ክፍያዎች', t:'money'},
        {id:'final', en:'Final payments', am:'የመጨረሻ ክፍያዎች', t:'money'},
        {id:'other', en:'Other', am:'ሌላ', t:'money'}
      ]},
      {id:'cf_in_big', en:'Which customer payments are the big ones behind these figures?', am:'ከእነዚህ አኃዞች ጀርባ ያሉት ትላልቅ የደንበኛ ክፍያዎች የትኞቹ ናቸው?', t:'table', addEn:'Add a payment', addAm:'ክፍያ ጨምር',
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
    { en:'2 · Expected money out', am:'2 · የሚጠበቅ ወጪ', fields:[
      {id:'cf_out', en:'How much money must go out in each of the next 4 weeks?', am:'በሚቀጥሉት 4 ሳምንታት በየሳምንቱ ስንት ብር ይወጣል?', t:'grid',
       rows:[{en:'Week 1', am:'ሳምንት 1'},{en:'Week 2', am:'ሳምንት 2'},
             {en:'Week 3', am:'ሳምንት 3'},{en:'Week 4', am:'ሳምንት 4'}],
       cols:[
        {id:'sup',  en:'Suppliers', am:'አቅራቢዎች', t:'money'},
        {id:'sal',  en:'Salaries', am:'ደመወዝ', t:'money'},
        {id:'asm',  en:'Assemblers', am:'ገጣጣሚዎች', t:'money'},
        {id:'other',en:'Utilities and other', am:'የመብራት/ውሃና ሌላ', t:'money'}
      ]}
    ]},
    { en:'3 · Balance and the reserve rule', am:'3 · ቀሪ ሂሳብና የመጠባበቂያ ደንብ', fields:[
      {id:'cf_open', en:'What is the bank balance today?', am:'ዛሬ የባንክ ቀሪ ስንት ነው?', t:'money'},
      {id:'cf_low', en:'What is the lowest balance expected in the next 4 weeks?', am:'በሚቀጥሉት 4 ሳምንታት ዝቅተኛው የሚጠበቅ ቀሪ ስንት ነው?', t:'money',
        tgt:{op:'gte', v:6000000, en:'6 Million Birr Cash Reserve Rule',
             am:'የ6 ሚሊዮን ብር መጠባበቂያ ደንብ'}},
      {id:'cf_low_why', en:'It drops below the 6,000,000 Birr reserve. Why, and what will be done first — which payments wait, which collections are chased?', am:'ከ6,000,000 ብር መጠባበቂያ በታች ይወርዳል። ለምን? ከወዲህ ምን ይደረጋል — የትኞቹ ክፍያዎች ይቆያሉ? የትኞቹ ገቢዎች ይከታተላሉ?', t:'area', show:{f:'cf_low', when:'miss'}},
      {id:'cf_lowweek', en:'In which week?', am:'በየትኛው ሳምንት?', t:'text'},
      {id:'cf_close', en:'What balance is expected at the end of week 4?', am:'በ4ኛው ሳምንት መጨረሻ ስንት ቀሪ ይጠበቃል?', t:'money'},
      {id:'cf_last', en:'How close was last week\'s projection to what really happened, and what was missed?', am:'ያለፈው ሳምንት ትንበያ ከሆነው ጋር ምን ያህል ተቀራረበ? ምን ሳይታይ ቀረ?', t:'area'}
    ]},
    { en:'4 · Shortfall warning', am:'4 · የእጥረት ማስጠንቀቂያ', fields:[
      {id:'cf_short', en:'Is a shortfall expected in these 4 weeks?',
       am:'በእነዚህ 4 ሳምንታት የገንዘብ እጥረት ይጠበቃል?', t:'yesno'},
      {id:'cf_short_cause', en:'What is causing it — late customer payments, a big supplier bill, payroll?', am:'ምን ያመጣዋል? — የዘገየ የደንበኛ ክፍያ፣ ትልቅ የአቅራቢ ሂሳብ፣ ደመወዝ?', t:'area', show:{f:'cf_short', when:'yes'}},
      {id:'cf_when', en:'When, and how much?', am:'መቼ? ምን ያህል?', t:'area', opt:1},
      {id:'cf_action', en:'What should be done about it, and by whom?', am:'ምን መደረግ አለበት? በማን?', t:'area', opt:1},
      {id:'cf_freeze', en:'Should payments be frozen?', am:'ክፍያዎች መቆም አለባቸው?', t:'yesno'},
      {id:'cf_freeze_what', en:'Which payments, from what date, and until what happens?', am:'የትኞቹ ክፍያዎች? ከየትኛው ቀን ጀምሮ? ምን እስኪሆን ድረስ?', t:'area', show:{f:'cf_freeze', when:'yes'}},
      {id:'need_chair', en:'Do you need a decision from the Chairman?', am:'የሊቀመንበሩ ውሳኔ ያስፈልግዎታል?', t:'yesno'},
      {id:'need_chair_what', en:'What exactly should the Chairman decide, what are the options, and by when?', am:'ሊቀመንበሩ በትክክል ምን እንዲወስኑ ይፈልጋሉ? አማራጮቹ ምንድን ናቸው? እስከ መቼ?', t:'area', show:{f:'need_chair', when:'yes'}}
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
    { en:'1 · Jobs cleared for production', am:'1 · ወደ ምርት የሚገቡ ሥራዎች', fields:[
      {id:'jl_jobs', en:'Which jobs are paid in full and cleared for production?', am:'ሙሉ ክፍያ የተከፈለባቸውና ወደ ምርት የሚገቡ ሥራዎች የትኞቹ ናቸው?',
       t:'table', addEn:'Add job', addAm:'ሥራ ጨምር', cols:[
        {id:'code', en:'Job code', am:'የሥራ ኮድ', t:'text'},
        {id:'cust', en:'Customer', am:'ደንበኛ', t:'text'},
        {id:'m2',   en:'m²', am:'ካሬ ሜትር', t:'num'},
        {id:'amt',  en:'Amount received', am:'የገባው ገንዘብ', t:'money'},
        {id:'full', en:'Paid in full', am:'ሙሉ ክፍያ', t:'yesno'},
        {id:'date', en:'Date confirmed', am:'የተረጋገጠበት ቀን', t:'text'}
      ]}
    ]},
    { en:'2 · Confirmation', am:'2 · ማረጋገጫ', fields:[
      {id:'jl_count', en:'How many jobs are on this list?', am:'በዝርዝሩ ስንት ሥራዎች አሉ?', t:'num'},
      {id:'jl_value', en:'What is the total value confirmed?', am:'ጠቅላላ የተረጋገጠው ዋጋ ስንት ነው?', t:'money'},
      {id:'jl_rule', en:'Is every job on this list paid in full, with none partial?',
       am:'በዝርዝሩ ያለ እያንዳንዱ ሥራ ሙሉ ክፍያ ተፈጽሞበታል? ከፊል የለም?', t:'yesno'},
      {id:'jl_rule_why', en:'Which job is not fully paid, and why is it on the list?', am:'ሙሉ ያልተከፈለው የትኛው ሥራ ነው? ለምን በዝርዝሩ ገባ?', t:'area', show:{f:'jl_rule', when:'no'}},
      {id:'jl_bank', en:'Was every payment on this list checked in the bank, not only on a receipt?', am:'በዝርዝሩ ያለ እያንዳንዱ ክፍያ በደረሰኝ ብቻ ሳይሆን በባንክ ተረጋግጧል?', t:'yesno'},
      {id:'jl_bank_why', en:'Which payments are not yet seen in the bank, and when will they be checked?', am:'ገና በባንክ ያልታዩት የትኞቹ ክፍያዎች ናቸው? መቼ ይረጋገጣሉ?', t:'area', show:{f:'jl_bank', when:'no'}},
      {id:'jl_held_any', en:'Is any job held back because payment is incomplete?', am:'ክፍያው ባልተጠናቀቀ ምክንያት የቆመ ሥራ አለ?', t:'yesno'},
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
        auto:{rows:'jl_held_list'}, sumEn:'held back', sumAm:'ቆመዋል'},
      {id:'jl_note', en:'Anything Mahelet should know — a customer pressing for a date, a job paid late in the week?', am:'ማህሌት ሊያውቁት የሚገባ ነገር አለ? — ቀን የሚጠይቅ ደንበኛ፣ በሳምንቱ መጨረሻ የተከፈለ ሥራ?', t:'area', opt:1}
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
    { en:'1 · Position this morning', am:'1 · የዛሬ ጠዋት ሁኔታ', fields:[
      {id:'cf7_date', en:'What day does this forecast start?', am:'ትንበያው ከየትኛው ቀን ይጀምራል?', t:'date'},
      {id:'cf7_bank', en:'What is the bank balance this morning?', am:'ዛሬ ጠዋት የባንክ ቀሪ ስንት ነው?', t:'money',
        tgt:{op:'gte', v:6000000, en:'6 Million Birr Cash Reserve Rule — below this must be reported',
             am:'የ6 ሚሊዮን ብር መጠባበቂያ ደንብ — ከዚህ በታች ከሆነ ማሳወቅ ግዴታ ነው'}},
      {id:'cf7_bank_why', en:'The balance is below the 6,000,000 Birr reserve. What is frozen today, and what brings it back?', am:'ቀሪው ከ6,000,000 ብር መጠባበቂያ በታች ነው። ዛሬ ምን ይቆማል? ምን ይመልሰዋል?', t:'area', show:{f:'cf7_bank', when:'miss'}},
      {id:'cf7_cash', en:'How much cash is on hand?', am:'በእጅ ስንት ጥሬ ገንዘብ አለ?', t:'money'},
      {id:'cf7_zamzam', en:'What is the ZamZam Bank balance?', am:'የዘምዘም ባንክ ቀሪ ስንት ነው?', t:'money'},
      {id:'cf7_reported', en:'If it is below 6M, has the Chairman already been told?',
       am:'ከ6ሚ በታች ከሆነ ለሊቀመንበሩ ቀድሞ ተነግሯል?', t:'yesno', opt:1}
    ]},
    { en:'2 · The next 7 days', am:'2 · የሚቀጥሉት 7 ቀናት', fields:[
      {id:'cf7_days', en:'For each of the next 7 days: how much comes in, how much goes out, and what is left?', am:'ለሚቀጥሉት 7 ቀናት በየቀኑ፦ ስንት ይገባል? ስንት ይወጣል? ስንት ይቀራል?',
       t:'grid', dateFrom:'cf7_date',
       rows:[{en:'Day 1', am:'ቀን 1'},{en:'Day 2', am:'ቀን 2'},{en:'Day 3', am:'ቀን 3'},
             {en:'Day 4', am:'ቀን 4'},{en:'Day 5', am:'ቀን 5'},{en:'Day 6', am:'ቀን 6'},
             {en:'Day 7', am:'ቀን 7'}],
       cols:[
        {id:'in',    en:'Expected in', am:'የሚጠበቅ ገቢ', t:'money'},
        {id:'out',   en:'Expected out', am:'የሚጠበቅ ወጪ', t:'money'},
        {id:'close', en:'Closing balance', am:'የቀኑ መጨረሻ ቀሪ', t:'money'}
      ]},
      {id:'cf7_change', en:'What changed since yesterday\'s forecast, and why?', am:'ከትናንቱ ትንበያ ምን ተለወጠ? ለምን?', t:'area'}
    ]},
    { en:'3 · The lowest point', am:'3 · ዝቅተኛው ደረጃ', fields:[
      {id:'cf7_low', en:'What is the lowest balance in the next 7 days?', am:'በሚቀጥሉት 7 ቀናት ዝቅተኛው ቀሪ ስንት ነው?', t:'money',
        tgt:{op:'gte', v:6000000, en:'Below the 6 Million Birr reserve',
             am:'ከ6 ሚሊዮን ብር መጠባበቂያ በታች'}},
      {id:'cf7_low_why', en:'Which payments push it below 6,000,000 Birr, and which of them can wait?', am:'ከ6,000,000 ብር በታች የሚያወርዱት የትኞቹ ክፍያዎች ናቸው? ከእነሱ የትኞቹ ሊቆዩ ይችላሉ?', t:'area', show:{f:'cf7_low', when:'miss'}},
      {id:'cf7_lowday', en:'On which day?', am:'በየትኛው ቀን?', t:'text'},
      {id:'cf7_cover', en:'Does the money expected cover everything due?', am:'የሚጠበቀው ገንዘብ የሚከፈለውን ሁሉ ይሸፍናል?', t:'yesno'},
      {id:'cf7_cover_why', en:'What is not covered, how much, and what is the plan?', am:'ያልተሸፈነው ምንድን ነው? ምን ያህል? ዕቅዱ ምንድን ነው?', t:'area', show:{f:'cf7_cover', when:'no'}}
    ]},
    { en:'4 · Shortfall warning', am:'4 · የእጥረት ማስጠንቀቂያ', fields:[
      {id:'cf7_short', en:'Is a shortfall expected in these 7 days?',
       am:'በእነዚህ 7 ቀናት የገንዘብ እጥረት ይጠበቃል?', t:'yesno'},
      {id:'cf7_amount', en:'How much short?', am:'ምን ያህል ይጎድላል?', t:'money', opt:1},
      {id:'cf7_action', en:'What should be done, and by whom?', am:'ምን መደረግ አለበት? በማን?', t:'area', opt:1},
      {id:'cf7_freeze', en:'Should non-essential payments be frozen?',
       am:'አስፈላጊ ያልሆኑ ክፍያዎች መቆም አለባቸው?', t:'yesno'},
      {id:'cf7_freeze_what', en:'Which payments, and until when?', am:'የትኞቹ ክፍያዎች? እስከ መቼ?', t:'area', show:{f:'cf7_freeze', when:'yes'}}
    ]},
    { en:'5 · Due today', am:'5 · ዛሬ የሚከፈሉ', fields:[
      {id:'cf7_due_any', en:'Is any payment due today?', am:'ዛሬ የሚከፈል ክፍያ አለ?', t:'yesno'},
      {id:'cf7_due_list', en:'Which payments are due today?', am:'ዛሬ የሚከፈሉት የትኞቹ ክፍያዎች ናቸው?', t:'table', addEn:'Add a payment', addAm:'ክፍያ ጨምር',
        show:{f:'cf7_due_any', when:'yes'},
        cols:[
          {id:'to', en:'Paid to', am:'ተከፋይ', t:'text'},
          {id:'for', en:'For', am:'ለምን', t:'text'},
          {id:'amount', en:'Amount', am:'መጠን', t:'money'},
          {id:'ready', en:'Funds ready', am:'ገንዘቡ ዝግጁ ነው', t:'yesno'}
        ]},
      {id:'cf7_due', en:'How many payments are due today?', am:'ዛሬ ስንት ክፍያዎች ይከፈላሉ?', t:'num',
        auto:{rows:'cf7_due_list'}, sumEn:'due today', sumAm:'ዛሬ የሚከፈሉ'},
      {id:'cf7_due_val', en:'What is the total due today?', am:'የዛሬው ክፍያ በጠቅላላ ስንት ነው?', t:'money'},
      {id:'cf7_kidan', en:'How many of them need Kidan\'s approval?', am:'ከነዚህ ስንቱ የኪዳን ፈቃድ ያስፈልጋቸዋል?', t:'num'},
      {id:'cf7_kidan_state', en:'Which ones, and has each been approved yet?', am:'የትኞቹ ናቸው? እያንዳንዱ ጸድቋል?', t:'area', show:{f:'cf7_kidan', when:'pos'}}
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
    { en:'1 · Groups watched today', am:'1 · ዛሬ የተከታተሏቸው ግሩፖች', fields:[
      {id:'pl_by', en:'Who prepared today\'s pulse?', am:'የዛሬውን ሪፖርት ያዘጋጀው ማን ነው?', t:'choice', opts:[
        {v:'finance', en:'Selam', am:'ሰላም'},
        {v:'seble', en:'Seble', am:'ሰብለ'}]},
      {id:'pl_by_checked', en:'Did Selam check Seble\'s work before it was sent?', am:'የሰብለ ሥራ ከመላኩ በፊት በሰላም ተረጋግጧል?', t:'yesno', show:{f:'pl_by', when:'is', v:'seble'}},
      {id:'pl_groups', en:'How many customer groups are active?', am:'ስንት የደንበኛ ግሩፖች ንቁ ናቸው?', t:'num'},
      {id:'pl_checked', en:'How many groups were read today? (read / active)', am:'ዛሬ ስንት ግሩፖች ተነበቡ? (የተነበቡ / ንቁ)', t:'ratio'},
      {id:'pl_checked_why', en:'Which groups were not read, and when will they be?', am:'ያልተነበቡት የትኞቹ ግሩፖች ናቸው? መቼ ይነበባሉ?', t:'area', show:{f:'pl_checked', when:'short'}},
      {id:'pl_called', en:'How many customers did you speak to directly today?', am:'ዛሬ ስንት ደንበኞችን በቀጥታ አነጋገሩ?', t:'num'}
    ]},
    { en:'2 · How customers sound', am:'2 · የደንበኞች ስሜት', fields:[
      {id:'pl_happy', en:'How many customers sound satisfied?', am:'ስንት ደንበኞች የረኩ ይመስላሉ?', t:'num'},
      {id:'pl_unhappy_any', en:'Did any of them sound unhappy?', am:'ካልረኩት ውስጥ የሆነ አለ?', t:'yesno'},
      {id:'pl_unhappy_who', en:'Who, and why?', am:'እነማን ናቸው? ለምን?', t:'table', addEn:'Add customer', addAm:'ደንበኛ ጨምር',
        show:{f:'pl_unhappy_any', when:'yes'},
        cols:[
          {id:'cust', en:'Customer', am:'ደንበኛ', t:'text'},
          {id:'job', en:'Job code', am:'የሥራ ኮድ', t:'text'},
          {id:'why', en:'Why', am:'ለምን', t:'text'},
          {id:'next', en:'Next step', am:'ቀጣይ እርምጃ', t:'text'}
        ]},
      {id:'pl_unhappy', en:'How many sound unhappy?', am:'ስንቱ ያልረኩ ይመስላሉ?', t:'num',
        auto:{rows:'pl_unhappy_who'}, sumEn:'sound unhappy', sumAm:'ያልረኩ'},
      {id:'pl_silent', en:'How many customers have gone quiet for 3 days or more?',
       am:'ከ3 ቀናት በላይ ዝም ያሉ ደንበኞች ስንት ናቸው?', t:'num'},
      {id:'pl_silent_who', en:'Who, what stage is each job at, and who will call them tomorrow?', am:'እነማን ናቸው? የእያንዳንዳቸው ሥራ በምን ደረጃ ላይ ነው? ነገ ማን ይደውልላቸዋል?', t:'area', show:{f:'pl_silent', when:'pos'}},
      {id:'pl_risk', en:'Is any customer at risk of cancelling?', am:'ውል ሊያቋርጥ የሚችል ደንበኛ አለ?', t:'yesno'},
      {id:'pl_risk_who', en:'Which customer, why, and how much of the contract is at stake?', am:'የትኛው ደንበኛ? ለምን? ስንት ብር የሚያወጣ ውል አደጋ ላይ ነው?', t:'area', opt:1},
      {id:'pl_risk_save', en:'What is being done to keep them, by whom, and by when?', am:'ደንበኛውን ለማቆየት ምን እየተደረገ ነው? በማን? እስከ መቼ?', t:'area', show:{f:'pl_risk', when:'yes'}}
    ]},
    { en:'3 · Complaints today', am:'3 · የዛሬ ቅሬታዎች', fields:[
      {id:'pl_list', en:'List every complaint raised today', am:'ዛሬ የቀረቡትን ቅሬታዎች በሙሉ ይዘርዝሩ',
       t:'table', addEn:'Add complaint', addAm:'ቅሬታ ጨምር', cols:[
        {id:'cust',  en:'Customer', am:'ደንበኛ', t:'text'},
        {id:'job',   en:'Job code', am:'የሥራ ኮድ', t:'text'},
        {id:'issue', en:'What about', am:'ስለ ምን', t:'text'},
        {id:'to',    en:'Passed to', am:'የተላለፈለት', t:'text'},
        {id:'state', en:'Status', am:'ሁኔታ', t:'choice', opts:[
          {v:'open',   en:'Open', am:'ክፍት'},
          {v:'working',en:'Being worked on', am:'በሥራ ላይ'},
          {v:'closed', en:'Resolved', am:'ተፈቷል'}]}
      ]},
      {id:'pl_sameday', en:'Was every complaint reported the same day?',
       am:'እያንዳንዱ ቅሬታ በዕለቱ ተነግሯል?', t:'yesno'},
      {id:'pl_sameday_why', en:'Which complaint was not reported today, and why?', am:'ዛሬ ያልተነገረው የትኛው ቅሬታ ነው? ለምን?', t:'area', show:{f:'pl_sameday', when:'no'}},
      {id:'pl_open', en:'How many complaints from earlier days are still open?',
       am:'ከቀደሙት ቀናት ስንት ቅሬታዎች ገና አልተፈቱም?', t:'num'},
      {id:'pl_open_why', en:'Which are the oldest, who holds each, and what is it waiting for?', am:'በጣም የቆዩት የትኞቹ ናቸው? እያንዳንዱን የያዘው ማን ነው? ምን እየጠበቀ ነው?', t:'area', show:{f:'pl_open', when:'pos'}}
    ]},
    { en:'4 · What customers said', am:'4 · ደንበኞች ያሉት', fields:[
      {id:'pl_good', en:'What did customers praise today?', am:'ዛሬ ደንበኞች ምን አደነቁ?', t:'area', opt:1},
      {id:'pl_bad', en:'What did customers complain about?', am:'ደንበኞች ምን ላይ አማረሩ?', t:'area', opt:1}
    ]},
    { en:'5 · Escalation', am:'5 · ወደ ላይ የተላለፉ', fields:[
      {id:'pl_to_eph', en:'How many issues were passed to Ephrata today?', am:'ዛሬ ስንት ጉዳዮች ለኤፍራታ ተላለፉ?', t:'num'},
      {id:'pl_to_mah', en:'How many were passed to Mahelet today?', am:'ዛሬ ስንቱ ለማህሌት ተላለፉ?', t:'num'},
      {id:'pl_chair', en:'Do you need a decision from the Chairman?', am:'የሊቀመንበሩ ውሳኔ ያስፈልግዎታል?', t:'yesno'},
      {id:'pl_what', en:'What exactly should the Chairman decide, what are the options, and by when?', am:'ሊቀመንበሩ በትክክል ምን እንዲወስኑ ይፈልጋሉ? አማራጮቹ ምንድን ናቸው? እስከ መቼ?', t:'area', opt:1},
      {id:'pl_tomorrow', en:'Which customer needs the most attention tomorrow, and why?', am:'ነገ በጣም ትኩረት የሚያስፈልገው ደንበኛ ማን ነው? ለምን?', t:'area'}
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
    /* The day's work, job by job, is the whole of this section. The four
       figures that used to stand above it — the day's m², the external
       share, the internal share, the sheets — were all in the rows, typed a
       second time (the Chairman, 9 Oct 2026). They are counted from the rows
       now, and the row says which customer the m² belong to, which is what
       the two share figures were for. */
    { en:'1 · Production output', am:'1 · የዕለቱ ምርት', fields:[
      {id:'p_jobs', en:'Which jobs were worked on today?', am:'ዛሬ የተሠሩት የትኞቹ ሥራዎች ናቸው?',
       t:'table', addEn:'Add job', addAm:'ሥራ ጨምር', cols:[
        {id:'code', en:'Job code', am:'የሥራ ኮድ', t:'text'},
        {id:'tgt',  en:'m² target', am:'የታቀደ ካሬ ሜትር', t:'num'},
        {id:'done', en:'m² produced', am:'የተመረተ ካሬ ሜትር', t:'num'},
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
        auto:{sum:'p_jobs.done'},
        tgt:{op:'gte', v:40, en:'Daily target 40 m² — below is –300 Birr/day from commission',
             am:'የቀኑ ዒላማ 40 ካሬ ሜትር — ከዚህ በታች ከኮሚሽን –300 ብር'}},
      {id:'p_ext', en:'For external customers', am:'ለውጭ ደንበኞች', t:'num', i:1,
        auto:{sum:'p_jobs.done', when:{col:'for', is:'ext'}}, sumEn:'m² for external customers', sumAm:'ካሬ ሜትር ለውጭ ደንበኞች'},
      {id:'p_rove', en:'For Rovestone / internal', am:'ለሮቭስቶን / ለውስጥ', t:'num', i:1,
        auto:{sum:'p_jobs.done', when:{col:'for', is:'rove'}}, sumEn:'m² for Rovestone / internal', sumAm:'ካሬ ሜትር ለሮቭስቶን / ለውስጥ'},
      {id:'p_total_why', en:'Production is under 40 m². What held it back, and how will it be recovered tomorrow?', am:'ምርቱ ከ40 ካሬ ሜትር በታች ነው። ምን አዘገየው? ነገ በምን ይካካሳል?', t:'area', show:{f:'p_total', when:'miss'}},
      {id:'p_rove_ok', en:'Which Rovestone or internal jobs were these, and is each one approved in the plan?', am:'እነዚህ የትኞቹ የሮቭስቶን ወይም የውስጥ ሥራዎች ናቸው? እያንዳንዳቸው በዕቅዱ ጸድቀዋል?', t:'area', show:{f:'p_rove', when:'pos'}}
    ]},
    /* What the day actually ate, material by material: the MDF and the
       melamine, the edge banding by the metre, the hinges, the slides, the
       handles (the Chairman, 9 Oct 2026 — "what happens on production, MDF,
       accessories"). The same twelve names the store issues against, so
       what the factory says it used and what the store says it gave out can
       be put side by side. The sheet count, the edge metres and the yield
       all come out of these rows, so none of them is typed twice. */
    { en:'2 · What went into the work', am:'2 · ለሥራው የዋለው ዕቃ', fields:[
      {id:'p_mat', en:'Which materials and accessories went into today\'s jobs?',
       am:'ለዛሬዎቹ ሥራዎች የዋሉት ዕቃዎችና መለዋወጫዎች የትኞቹ ናቸው?',
       t:'table', addEn:'Add a material', addAm:'ዕቃ ጨምር', cols:[
        {id:'item', en:'Material or accessory', am:'ዕቃ ወይም መለዋወጫ', t:'choice', opts:MATERIAL_OPTS},
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
      {id:'b_yield_why', en:'Which job or cutting plan wasted board, and why?', am:'ሰሌዳውን ያባከነው የትኛው ሥራ ወይም የመቁረጥ ዕቅድ ነው? ለምን?', t:'area', show:{f:'b_yield', when:'miss'}},
      {id:'b_short', en:'Did any cut stop for want of the right board or accessory?', am:'ትክክለኛው ሰሌዳ ወይም መለዋወጫ ባለመኖሩ የቆመ ሥራ አለ?', t:'yesno'},
      /* one tap where it used to be typed; the plant manager and the morning
         brief both name this answer */
      {id:'b_shortw', en:'Which one?', am:'የትኛው?', t:'choice', opts:MATERIAL_OPTS, i:1, show:{f:'b_short', when:'yes'}},
      {id:'b_short_what', en:'Which job was held up, for how long, and when will it arrive?', am:'የቆመው የትኛው ሥራ ነው? ለምን ያህል ጊዜ? መቼ ይደርሳል?', t:'area', show:{f:'b_short', when:'yes'}},
      {id:'b_redo', en:'How many edges had to be re-run because they lifted?', am:'ተነስተው እንደገና የተሠሩ ጠርዞች ስንት ናቸው?', t:'num',
        tgt:{op:'lte', v:0, en:'An edge that lifts is a job that comes back', am:'የሚነሳ ጠርዝ ሥራው እንዲመለስ ያደርጋል'}},
      {id:'b_redo_why', en:'What is making them lift — machine, glue, board or operator — and what was done?', am:'ጠርዞቹ የሚነሱት ለምን ነው — ማሽን፣ ሙጫ፣ ሰሌዳ ወይስ ኦፕሬተር? ምን እርምጃ ተወሰደ?', t:'area', show:{f:'b_redo', when:'miss'}}
    ]},
    { en:'2 · Quality control checkpoints', am:'2 · የጥራት ቁጥጥር ደረጃዎች', fields:[
      {id:'qc', en:'How did each checkpoint go today?', am:'ዛሬ እያንዳንዱ ፍተሻ እንዴት ሄደ?', t:'grid',
       rows:[{en:'After cutting', am:'ከመቁረጥ በኋላ'},
             {en:'After assembly', am:'ከመገጣጠም በኋላ'},
             {en:'Before delivery', am:'ከማድረስ በፊት'}],
       cols:[
        {id:'pass', en:'Passed', am:'ያለፉ', t:'num'},
        {id:'fail', en:'Failed', am:'ያላለፉ', t:'num'},
        {id:'sign', en:'Signed in Job File', am:'በሥራ ፋይል ተፈርሟል', t:'yesno'}
      ]},
      {id:'qc_any', en:'Were any defects found today?', am:'ዛሬ የተገኙ ጉድለቶች አሉ?', t:'yesno'},
      {id:'qc_defects_list', en:'List each defect', am:'ጉድለቶቹን አንድ በአንድ ይዘርዝሩ', t:'table', addEn:'Add a defect', addAm:'ጉድለት ጨምር',
        show:{f:'qc_any', when:'yes'},
        cols:[
          {id:'code', en:'Job code', am:'የሥራ ኮድ', t:'text'},
          {id:'what', en:'Defect', am:'ጉድለቱ', t:'text'},
          {id:'stage', en:'Started at (stage)', am:'የጀመረበት ደረጃ', t:'text'},
          {id:'told', en:'Mahelet told at once', am:'ለማህሌት ወዲያው ተነግሯል', t:'yesno'},
          {id:'rel', en:'Reached finished goods', am:'ወደ ዝግጁ ዕቃ ገብቷል', t:'yesno'}
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
      {id:'qc_action', en:'What was done about today\'s defects and failed checkpoints?', am:'በዛሬዎቹ ጉድለቶችና ያላለፉ ፍተሻዎች ላይ ምን እርምጃ ተወሰደ?', t:'area', opt:1}
    ]},
    { en:'3 · Waste and material variance', am:'3 · ብክነትና የቁሳቁስ ልዩነት', fields:[
      {id:'w_pct', en:'What was today\'s waste, as a % of material used?', am:'የዛሬው ብክነት ከዋለው ቁሳቁስ ስንት % ነው?', t:'pct',
        tgt:{op:'lte', v:20, en:'Must not exceed 20% — all bonuses depend on it',
             am:'ከ20% መብለጥ የለበትም — ሁሉም ጉርሻዎች በዚህ ላይ ይወሰናሉ'}},
      {id:'w_pct_why', en:'Waste is over 20%. On which job or machine, why, and what was done?', am:'ብክነቱ ከ20% በላይ ነው። በየትኛው ሥራ ወይም ማሽን? ለምን? ምን እርምጃ ተወሰደ?', t:'area', show:{f:'w_pct', when:'miss'}},
      {id:'w_var', en:'How far over the BOM was material use today, in %?', am:'ዛሬ የቁሳቁስ አጠቃቀም ከBOM በስንት % በለጠ?', t:'pct',
        tgt:{op:'lte', v:5, en:'Above +5% cancels the bonuses; above +10% is –2,000 Birr',
             am:'ከ+5% በላይ ጉርሻዎችን ይሰርዛል፤ ከ+10% በላይ –2,000 ብር'}},
      {id:'w_var_why', en:'Which job and which material went over, why, and did Mahelet approve the extra?', am:'ከBOM የበለጠው በየትኛው ሥራና በየትኛው ቁሳቁስ ነው? ለምን? ተጨማሪውን ማህሌት አጽድቀዋል?', t:'area', show:{f:'w_var', when:'miss'}}
    ]},
    { en:'4 · Material savings', am:'4 · የቁሳቁስ ቁጠባ', fields:[
      {id:'sav_any', en:'Did any job use less material than the BOM today?', am:'ዛሬ ከBOM ያነሰ ቁሳቁስ የተጠቀመ ሥራ አለ?', t:'yesno'},
      {id:'sav_rows', en:'Where did you use less material than the BOM today?', am:'ዛሬ ከBOM ያነሰ ቁሳቁስ የተጠቀሙት የት ነው?',
       t:'table', addEn:'Add material', addAm:'ቁሳቁስ ጨምር', show:{f:'sav_any', when:'yes'}, cols:[
        {id:'mat',  en:'Material', am:'ቁሳቁስ', t:'choice', opts:MATERIAL_OPTS},
        {id:'code', en:'Job', am:'ሥራ', t:'text'},
        {id:'bom',  en:'BOM qty', am:'የBOM መጠን', t:'num'},
        {id:'used', en:'Actual used', am:'የዋለው መጠን', t:'num'},
        {id:'cost', en:'Unit cost', am:'የአንዱ ዋጋ', t:'money'},
        {id:'sav',  en:'Savings (Birr)', am:'ቁጠባ (ብር)', t:'money'}
      ]},
      {id:'sav_today', en:'How much was saved today, in Birr?', am:'ዛሬ ስንት ብር ተቆጠበ?', t:'money',
        auto:{sum:'sav_rows.sav'}},
      {id:'sav_how', en:'How was it saved, and has quality been checked on those jobs?', am:'እንዴት ተቆጠበ? በነዚያ ሥራዎች ላይ ጥራቱ ተፈትሿል?', t:'area', show:{f:'sav_today', when:'pos'}}
    ]},
    { en:'5 · Waste sorting', am:'5 · የተረፈ ቁሳቁስ አያያዝ', fields:[
      {id:'ws_reuse', en:'Were reusable offcuts stored separately today?', am:'ዛሬ እንደገና የሚያገለግሉ ቁርጥራጮች ተለይተው ተቀመጡ?', t:'yesno'},
      {id:'ws_reuse_why', en:'What was not sorted, and why? (–300 Birr per incident)', am:'ያልተለየው ምንድን ነው? ለምን? (በእያንዳንዱ –300 ብር)', t:'area', show:{f:'ws_reuse', when:'no'}},
      {id:'ws_rec', en:'Was all scrap recorded today?', am:'ዛሬ የተረፈው ቁሳቁስ በሙሉ ተመዘገበ?', t:'yesno'},
      {id:'ws_rec_why', en:'What went unrecorded, how much, and why?', am:'ያልተመዘገበው ምንድን ነው? ምን ያህል? ለምን?', t:'area', show:{f:'ws_rec', when:'no'}},
      {id:'ws_stack', en:'Is the scrap stacked in the scrap area?', am:'የተረፈው ቁሳቁስ በተመደበው ቦታ ተከምሯል?', t:'yesno'},
      {id:'ws_thrown', en:'Was any reusable material thrown away without being recorded?', am:'ሳይመዘገብ የተጣለ እንደገና የሚያገለግል ቁሳቁስ ነበር?', t:'yesno'},
      {id:'ws_thrown_what', en:'What was thrown away, how much, and by whom? (–500 Birr per incident)', am:'ምን ተጣለ? ምን ያህል? በማን? (በእያንዳንዱ –500 ብር)', t:'area', show:{f:'ws_thrown', when:'yes'}}
    ]},
    { en:'6 · Machines', am:'6 · ማሽኖች', fields:[
      {id:'m_inspect', en:'Were all machines inspected before work started?', am:'ሥራ ከመጀመሩ በፊት ሁሉም ማሽኖች ተፈትሸዋል?', t:'yesno'},
      {id:'m_inspect_why', en:'Which were not, and why?', am:'ያልተፈተሹት የትኞቹ ናቸው? ለምን?', t:'area', show:{f:'m_inspect', when:'no'}},
      {id:'m_rows', en:'How did each machine run today?', am:'ዛሬ እያንዳንዱ ማሽን እንዴት ሠራ?',
       t:'table', addEn:'Add machine', addAm:'ማሽን ጨምር', cols:[
        {id:'name', en:'Machine', am:'ማሽን', t:'choice', opts:[
          {v:'Width cutter',  en:'Width cutter',  am:'የወርድ መቁረጫ'},
          {v:'Length cutter', en:'Length cutter', am:'የርዝመት መቁረጫ'},
          {v:'Edge bander',   en:'Edge bander',   am:'ጠርዝ ማሰሪያ'},
          {v:'Hinge driller', en:'Hinge driller', am:'የማጠፊያ መብሻ'},
          {v:'Compressor',    en:'Compressor',    am:'ኮምፕረሰር'},
          {v:'Other',         en:'Other',         am:'ሌላ'}
        ]},
        {id:'run',  en:'Running', am:'እየሠራ ነው', t:'yesno'},
        {id:'down', en:'Downtime (hrs)', am:'የቆመበት ሰዓት', t:'num'},
        {id:'cause',en:'Cause', am:'ምክንያት', t:'text'}
      ]},
      {id:'m_breaks', en:'How many machines stopped today?', am:'ዛሬ ስንት ማሽኖች ቆሙ?', t:'num',
        auto:{rows:'m_rows', when:{col:'down', pos:1}}, sumEn:'machines stopped', sumAm:'ማሽኖች ቆመዋል'},
      {id:'m_downhrs', en:'How many hours were lost to downtime today?', am:'ዛሬ በማሽን መቆም ስንት ሰዓት ጠፋ?', t:'num',
        auto:{sum:'m_rows.down'}, sumEn:'hours down', sumAm:'ሰዓት ቆመዋል'},
      {id:'m_reported', en:'Was every breakdown reported to Mahelet within 30 minutes?', am:'እያንዳንዱ ብልሽት በ30 ደቂቃ ውስጥ ለማህሌት ተነግሯል?', t:'yesno'},
      {id:'m_reported_why', en:'Which breakdown, how late was it reported, and why? (–500 Birr)', am:'የትኛው ብልሽት? በምን ያህል ዘግይቶ ተነገረ? ለምን? (–500 ብር)', t:'area', show:{f:'m_reported', when:'no'}}
    ]},
    /* Four figures stood at the head of this section — assigned, present,
       absent, late — and three of them were in the two lists underneath, or
       were one taken from another. One row a person who was not where they
       should have been, and the arithmetic does itself. */
    { en:'7 · Manpower', am:'7 · የሰው ኃይል', fields:[
      {id:'mp_assigned', en:'How many workers were assigned today?', am:'ዛሬ ስንት ሠራተኞች ተመደቡ?', t:'num'},
      /* the absent and the late stay two lists: the rulebook pays a worker a
         bonus for appearing in neither, and fines on the late list alone
         (js/rules.js), so one list with a column would have to be taught to
         every rule that reads them */
      {id:'mp_any', en:'Was anyone absent today?', am:'ዛሬ የቀረ ሰው አለ?', t:'yesno'},
      {id:'mp_absent_list', en:'Who was absent?', am:'የቀሩት እነማን ናቸው?', t:'table', addEn:'Add a worker', addAm:'ሰው ጨምር',
        show:{f:'mp_any', when:'yes'},
        cols:[
          {id:'name', en:'Worker', am:'ሠራተኛ', t:'text'},
          {id:'why', en:'Reason', am:'ምክንያት', t:'text'},
          {id:'ok', en:'With permission', am:'በፈቃድ', t:'yesno'}
        ]},
      {id:'mp_absent', en:'How many were absent?', am:'ስንቱ ቀሩ?', t:'num',
        auto:{rows:'mp_absent_list'}, sumEn:'absent', sumAm:'ቀርተዋል'},
      {id:'mp_late_any', en:'Did anyone arrive after 8:00 AM?', am:'ከጠዋቱ 2፡00 (8:00 AM) በኋላ የገባ ሰው አለ?', t:'yesno'},
      {id:'mp_late_list', en:'Who was late?', am:'የዘገዩት እነማን ናቸው?', t:'table', addEn:'Add a worker', addAm:'ሰው ጨምር',
        show:{f:'mp_late_any', when:'yes'},
        cols:[
          {id:'name', en:'Worker', am:'ሠራተኛ', t:'text'},
          {id:'at', en:'Arrived at', am:'የገባበት ሰዓት', t:'text'},
          {id:'why', en:'Reason', am:'ምክንያት', t:'text'},
          {id:'valid', en:'Valid reason', am:'ተቀባይነት ያለው ምክንያት', t:'yesno'}
        ]},
      {id:'mp_late', en:'How many arrived after 8:00 AM?', am:'ስንቱ ከጠዋቱ 2፡00 (8:00 AM) በኋላ ገቡ?', t:'num',
        auto:{rows:'mp_late_list'}, sumEn:'late', sumAm:'ዘግይተዋል',
        tgt:{op:'lte', v:0, en:'–100 Birr per worker per incident', am:'በእያንዳንዱ ሠራተኛ –100 ብር'}},
      {id:'mp_present', en:'How many came to work?', am:'ስንቱ ሥራ ገቡ?', t:'num',
        auto:{minus:['mp_assigned', 'mp_absent']}, sumEn:'came to work', sumAm:'ሥራ ገብተዋል'},
      /* overtime (8 Oct 2026), for the workforce reader */
      {id:'ot_any', en:'Did anyone work overtime today?', am:'ዛሬ የትርፍ ሰዓት የሠራ ሰው አለ?', t:'yesno'},
      {id:'ot_list', en:'Who worked overtime, for how long, and was it approved?', am:'የትርፍ ሰዓት የሠራ ማን ነው? ለምን ያህል ሰዓት? ተፈቅዶ ነበር?', t:'table', addEn:'Add a worker', addAm:'ሰው ጨምር',
        show:{f:'ot_any', when:'yes'},
        cols:[
          {id:'name', en:'Worker', am:'ሠራተኛ', t:'text'},
          {id:'hours', en:'Hours', am:'ሰዓት', t:'num'},
          {id:'why', en:'Why', am:'ምክንያት', t:'text'},
          {id:'ok', en:'Approved by Mahelet', am:'ማህሌት ፈቅዳለች', t:'yesno'}
        ]},
      {id:'ot_hours', en:'How many overtime hours were worked today, in total?', am:'ዛሬ በጠቅላላ ስንት የትርፍ ሰዓት ተሠራ?', t:'num',
        auto:{sum:'ot_list.hours'}, sumEn:'overtime hours', sumAm:'የትርፍ ሰዓት'},
      {id:'mp_behave', en:'How many behaviour issues were there today?', am:'ዛሬ ስንት የባህርይ ችግሮች ተከሰቱ?', t:'num',
        tgt:{op:'lte', v:0, en:'Unreported issues carry double the penalty', am:'ያልተነገረ ጉዳይ ቅጣቱ በእጥፍ ነው'}},
      {id:'mp_behave_what', en:'Who was involved, what happened, and was it reported to Mahelet?', am:'የተሳተፉት እነማን ናቸው? ምን ሆነ? ለማህሌት ተነግሯል?', t:'area', show:{f:'mp_behave', when:'pos'}},
      {id:'mp_safety', en:'Was anyone hurt, or anyone working without safety gear, today?', am:'ዛሬ የተጎዳ ሰው ወይም ያለ ደህንነት መጠበቂያ የሠራ ሰው ነበር?', t:'yesno'},
      {id:'mp_safety_what', en:'Who, what happened, how serious is it, and what was done?', am:'ማን ነው? ምን ሆነ? ምን ያህል ከባድ ነው? ምን እርምጃ ተወሰደ?', t:'area', show:{f:'mp_safety', when:'yes'}}
    ]},
    { en:'8 · Factory cleaning', am:'8 · የፋብሪካ ጽዳት', fields:[
      {id:'c_floor', en:'Was the factory floor swept and clean at close?', am:'በመዝጊያ ሰዓት የፋብሪካው ወለል ተጠርጎ ንጹህ ነበር?', t:'yesno'},
      {id:'c_mach', en:'Were the machines cleaned after use?', am:'ማሽኖች ከሥራ በኋላ ጸድተዋል?', t:'yesno'},
      {id:'c_tools', en:'Were all tools returned to their place?', am:'ሁሉም መሣሪያዎች በቦታቸው ተመልሰዋል?', t:'yesno'},
      {id:'c_waste', en:'Were the waste bins emptied?', am:'የቆሻሻ መጣያዎች ተጽድተዋል?', t:'yesno'},
      {id:'c_5s', en:'What was the 5S score? (audit days only)', am:'የ5S ውጤቱ ስንት ነበር? (ኦዲት በሚደረግበት ቀን ብቻ)', t:'pct', opt:1,
        tgt:{op:'gte', v:80, en:'Below 80% is –500 Birr', am:'ከ80% በታች –500 ብር'}},
      {id:'c_5s_why', en:'Which areas failed the audit, and what is being fixed, by when?', am:'በኦዲቱ ያልተሳኩት የትኞቹ ቦታዎች ናቸው? ምን እየተስተካከለ ነው? እስከ መቼ?', t:'area', show:{f:'c_5s', when:'miss'}}
    ]},
    { en:'9 · Unauthorized production or dispatch', am:'9 · ፈቃድ የሌለው ምርት ወይም ማስወጣት', fields:[
      {id:'u_any', en:'Was anything produced or sent out today without all four confirmations?', am:'ዛሬ አራቱም ማረጋገጫዎች ሳይሟሉ የተመረተ ወይም የወጣ ነገር ነበር?', t:'yesno'},
      {id:'u_what', en:'Which job, what was made or sent out, by whom, and what was done?', am:'የትኛው ሥራ? ምን ተመረተ ወይም ወጣ? በማን? ምን እርምጃ ተወሰደ?', t:'area', show:{f:'u_any', when:'yes'}},
      {id:'u_reported', en:'If yes, was it reported to Mahelet within 1 hour?', am:'አዎ ከሆነ በ1 ሰዓት ውስጥ ለማህሌት ተነግሯል?', t:'yesno', opt:1}
    ]},
    /* "10 · Boards and yield" stood here and asked the day's material over
       again: the board rows, the sheet total, the yield, the edge metres.
       Section 2 is that section, with the accessories in it and the figures
       counted rather than typed (the Chairman, 9 Oct 2026). */
    { en:'10 · Work in progress, by stage', am:'10 · በየደረጃው ያለ ሥራ', fields:[
      {id:'w_stage', en:'How many jobs sit at each stage at close?', am:'በመዝጊያ ሰዓት በየደረጃው ስንት ሥራዎች አሉ?',
       t:'grid', rows:[
        {en:'Cutting', am:'ቁረጣ'},
        {en:'Edge banding', am:'ጠርዝ ማሰር'},
        {en:'Drilling', am:'ቀዳዳ መብሳት'},
        {en:'Assembly', am:'መገጣጠም'},
        {en:'Finishing and packing', am:'ማጠናቀቅና ማሸግ'},
        {en:'Waiting for hardware', am:'ሃርድዌር በመጠበቅ ላይ'},
        {en:'Waiting for QC', am:'QC በመጠበቅ ላይ'}
      ], cols:[
        {id:'jobs', en:'Jobs', am:'ሥራዎች', t:'num'},
        {id:'m2', en:'m²', am:'ካሬ ሜትር', t:'num'},
        {id:'held', en:'Longest waiting (days)', am:'ረጅሙ ቆይታ (ቀን)', t:'num'}
      ]},
      {id:'w_block', en:'What held the factory up most today?', am:'ዛሬ ፋብሪካውን በጣም ያዘገየው ምንድን ነው?', t:'choice', opts:[
        {v:'none', en:'Nothing held it up', am:'ምንም አላዘገየም'},
        {v:'cut', en:'Cutting', am:'ቁረጣ'},
        {v:'edge', en:'Edge banding', am:'ጠርዝ ማሰር'},
        {v:'drill', en:'Drilling', am:'ቀዳዳ መብሳት'},
        {v:'asm', en:'Assembly', am:'መገጣጠም'},
        {v:'hw', en:'Hardware missing', am:'ሃርድዌር ጠፍቷል'},
        {v:'board', en:'Board missing', am:'ሰሌዳ ጠፍቷል'},
        {v:'qc', en:'Waiting for QC', am:'QC በመጠበቅ ላይ'},
        {v:'power', en:'Power cut', am:'የመብራት መቋረጥ'}
      ]},
      {id:'w_lost', en:'How many hours were lost to it?', am:'በዚህ ስንት ሰዓት ጠፋ?', t:'num', opt:1, i:1}
    ]},
    { en:'11 · Problems and solutions', am:'11 · ችግሮችና መፍትሔዎች', fields:[
      {id:'problem', en:'What was the biggest problem today — what caused it, and what is being done (who, by when)?', am:'የዛሬው ትልቁ ችግር ምን ነበር? ምክንያቱ ምንድን ነው? ምን እየተደረገ ነው (በማን፣ እስከ መቼ)?', t:'area', opt:1},
      {id:'need_help', en:'What do you need from Mahelet, the store or purchasing, and by when?', am:'ከማህሌት፣ ከመጋዘን ወይም ከግዥ ምን ያስፈልግዎታል? እስከ መቼ?', t:'area', opt:1},
      {id:'need_lead', en:'Do you need a decision from Mahelet?', am:'የማህሌት ውሳኔ ያስፈልግዎታል?', t:'yesno'},
      {id:'need_lead_what', en:'What exactly needs deciding, what are the options, and by when?', am:'በትክክል ምን መወሰን አለበት? አማራጮቹ ምንድን ናቸው? እስከ መቼ?', t:'area', show:{f:'need_lead', when:'yes'}}
    ]},
    { en:"12 · Tomorrow's top 3", am:'12 · የነገ ሦስት ቅድሚያዎች', fields:[
      {id:'p1', en:'Priority 1', am:'1ኛ ሥራ', t:'text'},
      {id:'p2', en:'Priority 2', am:'2ኛ ሥራ', t:'text'},
      {id:'p3', en:'Priority 3', am:'3ኛ ሥራ', t:'text'}
    ]}
  ]
},

/* ======================= AMAHA — WEEKLY PRODUCTION ====================== */
{
  id:'amaha-weekly', person:'amaha', cadence:'weekly', dueTime:'17:00', dueDay:6,
  en:'Weekly Production Summary', am:'ሳምንታዊ የምርት ማጠቃለያ',
  toEn:'Mahelet + Ephrata', toAm:'ማህሌት + ኤፍራታ',
  dueEn:'Saturday 5:00 PM', dueAm:'ቅዳሜ ከቀኑ 11፡00 (5:00 PM)',
  penEn:'Late or not sent –500 Birr', penAm:'ዘግይቶ ወይም ካልቀረበ –500 ብር',
  sections:[
    { en:'1 · Production performance', am:'1 · ምርት እንዴት ሄደ', fields:[
      {id:'w_total', en:'How many m² did the factory produce this week?', am:'ፋብሪካው በዚህ ሳምንት ስንት ካሬ ሜትር አመረተ?', t:'num', auto:{week:'p_total'},
        parts:{of:['w_ext','w_rove']},
        tgt:{op:'gte', v:240, en:'Weekly target 240 m²', am:'የሳምንቱ ዒላማ 240 ካሬ ሜትር'}},
      {id:'w_total_why', en:'The week is under 240 m². Which days fell short, why, and what changes next week?', am:'ሳምንቱ ከ240 ካሬ ሜትር በታች ነው። የትኞቹ ቀናት ጎደሉ? ለምን? በሚቀጥለው ሳምንት ምን ይቀየራል?', t:'area', show:{f:'w_total', when:'miss'}},
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
    { en:'2 · Quality control', am:'2 · የጥራት ቁጥጥር', fields:[
      {id:'q_checked', en:'How many jobs went through QC this week?', am:'በዚህ ሳምንት ስንት ሥራዎች በQC ተመረመሩ?', t:'num',
        auto:{week:'qc_checked'}},
      {id:'q_pass', en:'How many passed?', am:'ስንቱ አለፉ?', t:'num', auto:{week:'qc_pass'}},
      {id:'q_fail', en:'How many failed?', am:'ስንቱ አላለፉም?', t:'num', auto:{week:'qc_fails'}},
      {id:'q_fail_any', en:'Did any job fail QC this week?', am:'በዚህ ሳምንት QC ያላለፈ ሥራ አለ?', t:'yesno'},
      {id:'q_fail_list', en:'Which jobs failed, and why?', am:'ያላለፉት የትኞቹ ሥራዎች ናቸው? ለምን?', t:'table', addEn:'Add a job', addAm:'ሥራ ጨምር',
        show:{f:'q_fail_any', when:'yes'},
        cols:[
          {id:'code', en:'Job code', am:'የሥራ ኮድ', t:'text'},
          {id:'why', en:'Why it failed', am:'ያላለፈበት ምክንያት', t:'text'},
          {id:'fixed', en:'Fixed and passed', am:'ተስተካክሎ አልፏል', t:'yesno'}
        ]},
      {id:'q_rate', en:'What was the QC pass rate this week?', am:'በዚህ ሳምንት የQC ማለፊያ መጠን ስንት ነበር?', t:'pct',
        auto:{pct:['q_pass', 'q_checked']},
        tgt:{op:'gte', v:98, en:'≥98% earns the 5,000 Birr quality bonus', am:'≥98% የ5,000 ብር የጥራት ጉርሻ ያስገኛል'}},
      {id:'q_defects', en:'How many defects were found this week?', am:'በዚህ ሳምንት ስንት ጉድለቶች ተገኙ?', t:'num', auto:{week:'qc_defects'}},
      {id:'q_defects_what', en:'What were they, at which stage did they start, and did any reach finished goods?', am:'ጉድለቶቹ ምን ነበሩ? ከየትኛው ደረጃ ጀመሩ? ወደ ዝግጁ ዕቃ የገባ አለ?', t:'area', show:{f:'q_defects', when:'pos'}}
    ]},
    { en:'3 · Waste control', am:'3 · የብክነት ቁጥጥር', fields:[
      {id:'w_avgpct', en:'What was the average waste this week, in %?', am:'በዚህ ሳምንት አማካይ ብክነቱ ስንት % ነበር?', t:'pct',
        auto:{week:'w_pct', how:'avg'},
        tgt:{op:'lte', v:20, en:'Must not exceed 20%', am:'ከ20% መብለጥ የለበትም'}},
      {id:'w_days', en:'On how many days was waste above 20%?', am:'ብክነቱ ከ20% በላይ የሆነው በስንት ቀናት ነው?', t:'num',
        auto:{week:'w_pct', how:'over', over:20},
        tgt:{op:'lte', v:0, en:'Should be 0', am:'0 መሆን አለበት'}},
      {id:'w_days_why', en:'Which days, on which jobs, and why?', am:'የትኞቹ ቀናት? በየትኞቹ ሥራዎች? ለምን?', t:'area', show:{f:'w_days', when:'pos'}},
      {id:'w_cost', en:'What did the waste cost this week, in Birr?', am:'ብክነቱ በዚህ ሳምንት ስንት ብር አስወጣ?', t:'money'}
    ]},
    { en:'4 · Material savings', am:'4 · የቁሳቁስ ቁጠባ', fields:[
      {id:'s_bom', en:'What was the total BOM quantity for this week\'s jobs?', am:'የዚህ ሳምንት ሥራዎች ጠቅላላ የBOM መጠን ስንት ነበር?', t:'num'},
      {id:'s_used', en:'How much was actually used?', am:'በትክክል የዋለው ስንት ነው?', t:'num'},
      {id:'s_total', en:'How much was saved this week, in Birr?', am:'በዚህ ሳምንት ስንት ብር ተቆጠበ?', t:'money', auto:{week:'sav_today'}},
      {id:'s_how', en:'Where did the savings come from, and has QC confirmed no quality was lost?', am:'ቁጠባው ከየት መጣ? ጥራት እንዳልቀነሰ QC አረጋግጧል?', t:'area', show:{f:'s_total', when:'pos'}},
      {id:'s_pct', en:'What % of the BOM was saved?', am:'ከBOM ስንት % ተቆጠበ?', t:'pct'}
    ]},
    { en:'5 · Waste sorting', am:'5 · የተረፈ ቁሳቁስ አያያዝ', fields:[
      {id:'ws_stored', en:'How many m² of reusable offcuts went to store this week?', am:'በዚህ ሳምንት ስንት ካሬ ሜትር እንደገና የሚያገለግሉ ቁርጥራጮች ወደ መጋዘን ገቡ?', t:'num',
        auto:{week:'p_off'}},
      {id:'ws_scrap', en:'How much scrap was recorded this week?', am:'በዚህ ሳምንት ምን ያህል የተረፈ ቁሳቁስ ተመዘገበ?', t:'num'},
      {id:'ws_viol', en:'How many waste-handling violations were there?', am:'ስንት የቁሳቁስ አያያዝ ጥሰቶች ተከሰቱ?', t:'num',
        tgt:{op:'lte', v:0, en:'–300 to –500 Birr each', am:'እያንዳንዱ ከ–300 እስከ –500 ብር'}},
      {id:'ws_viol_what', en:'What were they, and who was responsible?', am:'ጥሰቶቹ ምን ነበሩ? ኃላፊው ማን ነበር?', t:'area', show:{f:'ws_viol', when:'pos'}}
    ]},
    { en:'6 · Machine performance', am:'6 · ማሽኖች እንዴት ሠሩ', fields:[
      {id:'m_uptime', en:'What % of working hours did the machines run this week?', am:'በዚህ ሳምንት ማሽኖች ከሥራ ሰዓቱ ስንት % ሠሩ?', t:'pct',
        tgt:{op:'gte', v:95, en:'≥95% earns the 2,000 Birr uptime bonus', am:'≥95% የ2,000 ብር ጉርሻ ያስገኛል'}},
      {id:'m_break', en:'How many breakdowns were there this week?', am:'በዚህ ሳምንት ስንት ብልሽቶች ተከሰቱ?', t:'num',
        auto:{week:'m_breaks'}},
      {id:'m_break_any', en:'Did any machine break down this week?', am:'በዚህ ሳምንት የተበላሸ ማሽን አለ?', t:'yesno'},
      {id:'m_break_list', en:'List each breakdown', am:'ብልሽቶቹን አንድ በአንድ ይዘርዝሩ', t:'table', addEn:'Add a breakdown', addAm:'ብልሽት ጨምር',
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
          {id:'cause', en:'Cause', am:'ምክንያት', t:'text'},
          {id:'told', en:'Reported within 30 min', am:'በ30 ደቂቃ ተነግሯል', t:'yesno'}
        ]},
      {id:'m_down', en:'How many hours were lost to downtime in total?', am:'በድምሩ ስንት ሰዓት በብልሽት ጠፋ?', t:'num',
        auto:{week:'m_downhrs'}}
    ]},
    { en:'7 · Manpower', am:'7 · የሰው ኃይል', fields:[
      {id:'a_rate', en:'What was the average attendance this week, in %?', am:'በዚህ ሳምንት አማካይ የተገኝነት መጠን ስንት % ነበር?', t:'pct',
        auto:{pct:[{week:'mp_present'}, {week:'mp_assigned'}]},
        tgt:{op:'gte', v:95, en:'≥95% earns 2,000 + 3,000 Birr in bonuses', am:'≥95% የ2,000 + 3,000 ብር ጉርሻ ያስገኛል'}},
      {id:'a_late', en:'How many workers were late more than once?', am:'ስንት ሠራተኞች ከአንድ ጊዜ በላይ ዘገዩ?', t:'num'},
      {id:'a_late_who', en:'Who, how many times, and what was done?', am:'እነማን ናቸው? ስንት ጊዜ? ምን እርምጃ ተወሰደ?', t:'area', show:{f:'a_late', when:'pos'}},
      {id:'a_absent', en:'How many workers were absent more than once?', am:'ስንት ሠራተኞች ከአንድ ጊዜ በላይ ቀሩ?', t:'num'},
      {id:'a_absent_who', en:'Who, how many days, and was it reported to Mahelet?', am:'እነማን ናቸው? ስንት ቀን? ለማህሌት ተነግሯል?', t:'area', show:{f:'a_absent', when:'pos'}},
      {id:'a_behave', en:'How many behaviour incidents were there this week?', am:'በዚህ ሳምንት ስንት የባህርይ ችግሮች ተከሰቱ?', t:'num',
        tgt:{op:'lte', v:0, en:'Zero is required for the 3,000 Birr bonus', am:'ለ3,000 ብር ጉርሻ 0 መሆን አለበት'}},
      {id:'a_behave_what', en:'Who was involved, what happened, and what was done?', am:'የተሳተፉት እነማን ናቸው? ምን ሆነ? ምን እርምጃ ተወሰደ?', t:'area', show:{f:'a_behave', when:'pos'}},
      {id:'a_safety', en:'Was anyone hurt at work this week?', am:'በዚህ ሳምንት በሥራ ላይ የተጎዳ ሰው ነበር?', t:'yesno'},
      {id:'a_safety_what', en:'Who, what happened, how many working days were lost, and what has changed since?', am:'ማን ነው? ምን ሆነ? ስንት የሥራ ቀን ጠፋ? ከዚያ በኋላ ምን ተቀየረ?', t:'area', show:{f:'a_safety', when:'yes'}}
    ]},
    { en:'8 · Factory cleaning', am:'8 · የፋብሪካ ጽዳት', fields:[
      {id:'c_5s', en:'What was this week\'s 5S audit score?', am:'የዚህ ሳምንት የ5S ኦዲት ውጤት ስንት ነበር?', t:'pct',
        tgt:{op:'gte', v:80, en:'≥80% earns the 2,000 Birr cleaning bonus', am:'≥80% የ2,000 ብር የጽዳት ጉርሻ ያስገኛል'}},
      {id:'c_5s_why', en:'Which areas failed, and what is being fixed, by when?', am:'ያልተሳኩት የትኞቹ ቦታዎች ናቸው? ምን እየተስተካከለ ነው? እስከ መቼ?', t:'area', show:{f:'c_5s', when:'miss'}},
      {id:'c_issues', en:'How many cleaning issues were found this week?', am:'በዚህ ሳምንት ስንት የጽዳት ችግሮች ተገኙ?', t:'num'},
      {id:'c_issues_what', en:'What were they, and where?', am:'ችግሮቹ ምን ነበሩ? የት?', t:'area', show:{f:'c_issues', when:'pos'}}
    ]},
    { en:'9 · Job completion', am:'9 · የተጠናቀቁ ሥራዎች', fields:[
      {id:'j_done_any', en:'Was any job completed this week?', am:'በዚህ ሳምንት የተጠናቀቀ ሥራ አለ?', t:'yesno'},
      {id:'j_done_list', en:'Which jobs were completed?', am:'የተጠናቀቁት የትኞቹ ሥራዎች ናቸው?', t:'table', addEn:'Add a job', addAm:'ሥራ ጨምር',
        show:{f:'j_done_any', when:'yes'},
        cols:[
          {id:'code', en:'Job code', am:'የሥራ ኮድ', t:'text'},
          {id:'m2', en:'m²', am:'ካሬ ሜትር', t:'num'},
          {id:'rework', en:'Any rework', am:'ዳግም ሥራ ነበረው', t:'yesno'},
          {id:'qcfail', en:'Failed QC', am:'QC አላለፈም', t:'yesno'}
        ]},
      {id:'j_done', en:'How many jobs were completed this week?', am:'በዚህ ሳምንት ስንት ሥራዎች ተጠናቀቁ?', t:'num',
        auto:{rows:'j_done_list'}, sumEn:'completed', sumAm:'ተጠናቀዋል'},
      {id:'j_zero', en:'How many of them needed zero rework?', am:'ከነዚህ ስንቱ ምንም ዳግም ሥራ አልጠየቁም?', t:'num'},
      {id:'j_fail', en:'How many of them failed QC at any point?', am:'ከነዚህ ስንቱ በማንኛውም ደረጃ QC አላለፉም?', t:'num',
        tgt:{op:'lte', v:0, en:'Each one cancels that job’s 1,000 Birr bonus', am:'እያንዳንዱ የዚያን ሥራ 1,000 ብር ጉርሻ ይሰርዛል'}},
      {id:'j_bonus', en:'How much job completion bonus was earned this week, in Birr?', am:'በዚህ ሳምንት ስንት ብር የሥራ ማጠናቀቂያ ጉርሻ ተገኘ?', t:'money'}
    ]},
    { en:'10 · Unauthorized production or dispatch', am:'10 · ፈቃድ የሌለው ምርት ወይም ማስወጣት', fields:[
      {id:'u_prod', en:'Was anything produced this week without all four confirmations?', am:'በዚህ ሳምንት አራቱም ማረጋገጫዎች ሳይሟሉ የተመረተ ነገር ነበር?', t:'yesno'},
      {id:'u_disp', en:'Did anything leave the factory this week without all four confirmations?', am:'በዚህ ሳምንት አራቱም ማረጋገጫዎች ሳይሟሉ ከፋብሪካ የወጣ ነገር ነበር?', t:'yesno'},
      {id:'u_det', en:'If yes: which job, what, by whom, and was it reported to Mahelet within 1 hour?', am:'አዎ ከሆነ፦ የትኛው ሥራ? ምን? በማን? በ1 ሰዓት ውስጥ ለማህሌት ተነግሯል?', t:'area', opt:1}
    ]},
    { en:'11 · Problems and solutions', am:'11 · ችግሮችና መፍትሔዎች', fields:[
      {id:'problem', en:'What was the biggest problem this week, and what caused it?', am:'የዚህ ሳምንት ትልቁ ችግር ምን ነበር? ምክንያቱስ?', t:'area', opt:1},
      {id:'outstanding', en:'What is still open, who owns it, and by when?', am:'ያልተፈታው ምንድን ነው? ኃላፊው ማን ነው? እስከ መቼ?', t:'area', opt:1},
      {id:'w_well', en:'What went well this week that should be repeated?', am:'በዚህ ሳምንት በደንብ የሠራና ሊደገም የሚገባው ምንድን ነው?', t:'area', opt:1},
      {id:'need_lead', en:'Do you need a decision from Mahelet?', am:'የማህሌት ውሳኔ ያስፈልግዎታል?', t:'yesno'},
      {id:'need_lead_what', en:'What exactly needs deciding, what are the options, and by when?', am:'በትክክል ምን መወሰን አለበት? አማራጮቹ ምንድን ናቸው? እስከ መቼ?', t:'area', show:{f:'need_lead', when:'yes'}}
    ]},
    { en:"12 · Next week's plan", am:'12 · የሚቀጥለው ሳምንት ዕቅድ', fields:[
      {id:'n_target', en:'What is next week\'s production target, in m²?', am:'የሚቀጥለው ሳምንት የምርት ዒላማ ስንት ካሬ ሜትር ነው?', t:'num'},
      {id:'n_jobs', en:'Which jobs must be finished next week?', am:'በሚቀጥለው ሳምንት መጠናቀቅ ያለባቸው የትኞቹ ሥራዎች ናቸው?', t:'area', opt:1},
      {id:'n_sav', en:'What is next week\'s material savings target, in Birr?', am:'የሚቀጥለው ሳምንት የቁሳቁስ ቁጠባ ዒላማ ስንት ብር ነው?', t:'money', opt:1},
      {id:'n_support', en:'What support do you need from Mahelet to hit it?', am:'ዒላማውን ለመምታት ከማህሌት ምን ድጋፍ ያስፈልግዎታል?', t:'area', opt:1}
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
    { en:'1 · Material usage', am:'1 · የቁሳቁስ አጠቃቀም', fields:[
      {id:'mat', en:'How did each material compare with the BOM this month?', am:'በዚህ ወር እያንዳንዱ ቁሳቁስ ከBOM ጋር ሲነጻጸር እንዴት ነበር?', t:'grid',
       rows:[{en:'MDF', am:'MDF'},{en:'PVC edge', am:'የPVC ጠርዝ'},
             {en:'Hardware', am:'ሃርድዌር'},{en:'Accessories', am:'መለዋወጫዎች'},
             {en:'Other', am:'ሌላ'}],
       cols:[
        {id:'bom',  en:'BOM qty', am:'የBOM መጠን', t:'num'},
        {id:'used', en:'Actual used', am:'የዋለው መጠን', t:'num'},
        {id:'cost', en:'Unit cost', am:'የአንዱ ዋጋ', t:'money'},
        {id:'sav',  en:'Savings (Birr)', am:'ቁጠባ (ብር)', t:'money'}
      ]},
      {id:'m_over', en:'Did any job go more than 5% over its BOM this month?', am:'በዚህ ወር ከBOM በ5% በላይ የበለጠ ሥራ ነበር?', t:'yesno'},
      {id:'m_over_list', en:'Which jobs went over?', am:'የበለጡት የትኞቹ ሥራዎች ናቸው?', t:'table', addEn:'Add a job', addAm:'ሥራ ጨምር',
        show:{f:'m_over', when:'yes'},
        cols:[
          {id:'code', en:'Job code', am:'የሥራ ኮድ', t:'text'},
          {id:'mat', en:'Material', am:'ቁሳቁስ', t:'text'},
          {id:'pct', en:'% over BOM', am:'ከBOM የበለጠው %', t:'num'},
          {id:'why', en:'Why', am:'ምክንያት', t:'text'}
        ]},
      {id:'m_best', en:'Where did the biggest savings come from, and how?', am:'ትልቁ ቁጠባ ከየት መጣ? እንዴት?', t:'area', opt:1}
    ]},
    { en:'2 · Savings calculation', am:'2 · የቁጠባ ስሌት', fields:[
      {id:'tot_sav', en:'What were the total material savings this month, in Birr?', am:'በዚህ ወር ጠቅላላ የቁሳቁስ ቁጠባው ስንት ብር ነበር?', t:'money',
        auto:{week:'sav_today'},
        tgt:{op:'gte', v:50000, en:'Your share starts at 50,000 Birr', am:'ድርሻዎ የሚጀምረው ከ50,000 ብር ነው'}},
      {id:'my_share', en:'What is your share at the tier the savings reach (10% – 25%)?', am:'ቁጠባው በደረሰበት ደረጃ ድርሻዎ ስንት ነው (10% – 25%)?', t:'money'}
    ]},
    { en:'3 · Quality verification', am:'3 · የጥራት ማረጋገጫ', fields:[
      {id:'qc_rate', en:'What was the QC pass rate for the month?', am:'የወሩ የQC ማለፊያ መጠን ስንት ነበር?', t:'pct',
        auto:{pct:[{week:'qc_pass'}, {week:'qc_checked'}]},
        tgt:{op:'gte', v:98, en:'Below 98% and the savings bonus is cancelled', am:'ከ98% በታች ከሆነ የቁጠባ ጉርሻ ይሰረዛል'}},
      {id:'qc_rate_why', en:'The rate is under 98%, which cancels the savings bonus. What caused the failures?', am:'መጠኑ ከ98% በታች ስለሆነ የቁጠባ ጉርሻው ይሰረዛል። ውድቀቶቹን ያስከተለው ምንድን ነው?', t:'area', show:{f:'qc_rate', when:'miss'}},
      {id:'compromise', en:'Did any saving cause a drop in quality?', am:'በቁጠባ ምክንያት የጥራት መቀነስ ተፈጥሯል?', t:'yesno'},
      {id:'compromise_what', en:'Which job, what went wrong, and what was done? (the whole savings bonus is cancelled and –5,000 Birr)', am:'የትኛው ሥራ? ምን ተበላሸ? ምን እርምጃ ተወሰደ? (የቁጠባ ጉርሻው በሙሉ ይሰረዛል፣ –5,000 ብር)', t:'area', show:{f:'compromise', when:'yes'}},
      {id:'wude_ok', en:'Has Wude (QC) confirmed there was no quality compromise?', am:'ውዱ (QC) የጥራት መቀነስ አለመኖሩን አረጋግጠዋል?', t:'yesno'},
      {id:'wude_ok_why', en:'What is QC\'s concern, and on which jobs?', am:'የQC ስጋት ምንድን ነው? በየትኞቹ ሥራዎች?', t:'area', show:{f:'wude_ok', when:'no'}}
    ]},
    { en:'4 · Waste sorting', am:'4 · የተረፈ ቁሳቁስ አያያዝ', fields:[
      {id:'m_offcuts', en:'Were all reusable offcuts stored properly this month?', am:'በዚህ ወር እንደገና የሚያገለግሉ ቁርጥራጮች በሙሉ በአግባቡ ተቀምጠዋል?', t:'yesno'},
      {id:'m_scrap', en:'Was all scrap recorded this month?', am:'በዚህ ወር የተረፈው ቁሳቁስ በሙሉ ተመዝግቧል?', t:'yesno'},
      {id:'m_viol', en:'What waste-sorting violations happened this month, and who was responsible?', am:'በዚህ ወር ምን የቁሳቁስ አያያዝ ጥሰቶች ተከሰቱ? ኃላፊው ማን ነበር?', t:'area', opt:1}
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
    { en:'1 · Jobs inspected today', am:'1 · ዛሬ የተመረመሩ ሥራዎች', fields:[
      /* The four figures that stood above this list were the list: how many
         inspected, how many passed, how many failed, and the rate between
         them (the Chairman, 9 Oct 2026). The list is the answer now. */
      {id:'i_jobs', en:'Each job inspected today', am:'ዛሬ የተመረመረ እያንዳንዱ ሥራ',
       t:'table', addEn:'Add job', addAm:'ሥራ ጨምር', cols:[
        {id:'code', en:'Job code', am:'የሥራ ኮድ', t:'text'},
        {id:'cust', en:'Customer', am:'ደንበኛ', t:'text'},
        {id:'m2',   en:'m²', am:'ካሬ ሜትር', t:'num'},
        {id:'pass', en:'Passed', am:'አልፏል', t:'yesno'},
        {id:'why',  en:'Reason for failure', am:'ያላለፈበት ምክንያት', t:'text'}
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
        tgt:{op:'gte', v:98, en:'≥98% earns the 2,000 Birr KPI bonus', am:'≥98% የ2,000 ብር KPI ጉርሻ ያስገኛል'}},
      {id:'i_all', en:'Did you personally inspect, in full, every job released today?', am:'ዛሬ የተለቀቀውን እያንዳንዱን ሥራ ራስዎ ሙሉ በሙሉ መረመሩ?', t:'yesno'},
      {id:'i_all_why', en:'Which jobs went out without a full inspection, who released them, and why?', am:'ሙሉ ፍተሻ ሳይደረግላቸው የወጡት የትኞቹ ሥራዎች ናቸው? ማን ለቀቃቸው? ለምን?', t:'area', show:{f:'i_all', when:'no'}}
    ]},
    { en:'2 · Defects found', am:'2 · የተገኙ ጉድለቶች', fields:[
      {id:'d_any', en:'Did you find any defect today?', am:'ዛሬ ያገኙት ጉድለት አለ?', t:'yesno'},
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
        {id:'out', en:'Reached finished goods', am:'ወደ ዝግጁ ዕቃ ገብቷል', t:'yesno'},
        {id:'doc', en:'Documented with photo', am:'በፎቶ ተመዝግቧል', t:'yesno'}
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
      {id:'d_released_what', en:'Which jobs, what defect, how did it get past QC, and has it been pulled back?', am:'የትኞቹ ሥራዎች? ምን ጉድለት? ከጥራት ቁጥጥር እንዴት አለፈ? ተመልሷል?', t:'area', show:{f:'d_released', when:'pos'}}
    ]},
    { en:'3 · Rework', am:'3 · ዳግም ሥራ', fields:[
      {id:'r_required', en:'How many jobs needed rework today?', am:'ዛሬ ስንት ሥራዎች ዳግም ሥራ አስፈለጋቸው?', t:'num',
        auto:{rows:'d_rows', when:{col:'act', is:'rework'}}, sumEn:'need rework', sumAm:'ዳግም ሥራ ያስፈልጋቸዋል'},
      {id:'r_done', en:'How many reworks were finished?', am:'ስንት ዳግም ሥራዎች ተጠናቀቁ?', t:'num'},
      {id:'r_reinspected', en:'How many did you re-inspect after rework?', am:'ከዳግም ሥራ በኋላ ስንቱን እንደገና መረመሩ?', t:'num'},
      {id:'r_rate', en:'What is today\'s rework rate?', am:'የዛሬው የዳግም ሥራ መጠን ስንት በመቶ ነው?', t:'pct',
        auto:{pct:['r_required', 'i_total']},
        tgt:{op:'lte', v:2, en:'Below 2% earns 1,000 Birr; above 5% is –500 Birr',
             am:'ከ2% በታች 1,000 ብር፤ ከ5% በላይ –500 ብር'}},
      {id:'r_rate_why', en:'Rework is above 2%. Which jobs drove it, and what would stop it happening again?', am:'ዳግም ሥራው ከ2% በላይ ነው። ያሳደጉት የትኞቹ ሥራዎች ናቸው? እንዳይደገም ምን መደረግ አለበት?', t:'area', show:{f:'r_rate', when:'miss'}},
      {id:'r_register', en:'Is the Rework Register up to date?', am:'የዳግም ሥራ መዝገቡ ተሟልቷል?', t:'yesno'},
      {id:'r_register_why', en:'What is missing from it, and when will it be complete?', am:'ምን ጎድሎታል? መቼ ይሟላል?', t:'area', show:{f:'r_register', when:'no'}},
      /* rework cost (8 Oct 2026), for the quality reader */
      {id:'r_cost', en:'What did today’s rework cost, in Birr (materials and hours)?', am:'የዛሬው ዳግም ሥራ ምን ያህል አስወጣ? በብር (ዕቃና ሰዓት)', t:'money', opt:1}
    ]},
    { en:'4 · Pressure to pass a defect — you are protected when you report it', am:'4 · ጉድለት እንዲያሳልፉ የሚደረግ ጫና — ካሳወቁ ይጠበቃሉ', fields:[
      {id:'pr_any', en:'Did anyone pressure you today to pass a defective product?', am:'ዛሬ ጉድለት ያለበትን ምርት እንዲያሳልፉ ማንም ጫና አድርጎብዎታል?', t:'yesno'},
      {id:'pr_what', en:'What happened: which job, what was wrong with it, what were you told, and what did you do?', am:'ምን ሆነ? የትኛው ሥራ? ምን ጉድለት ነበረበት? ምን ተባሉ? ምን አደረጉ?', t:'area', show:{f:'pr_any', when:'yes'}},
      {id:'pr_who', en:'If yes, who?', am:'አዎ ከሆነ ማን?', t:'text', opt:1},
      {id:'pr_reported', en:'Did you report it to Mahelet?', am:'ለማህሌት አሳውቀዋል?', t:'yesno', opt:1}
    ]},
    { en:'5 · Where the defects came from', am:'5 · ጉድለቶቹ ከየት እንደመጡ', fields:[
      {id:'c_stage', en:'How many defects did each stage cause today, and how many m² did they affect?', am:'ዛሬ እያንዳንዱ ደረጃ ስንት ጉድለት አስከተለ? ስንት ካሬ ሜትር ተጎዳ?',
       t:'grid', rows:[
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
      ]},
      {id:'c_worst', en:'Which stage caused the most today?', am:'ዛሬ በብዛት ጉድለት ያስከተለው የትኛው ደረጃ ነው?', t:'text'},
      {id:'c_repeat', en:'Is it the same stage as yesterday?', am:'ከትናንቱ ጋር ተመሳሳይ ደረጃ ነው?', t:'yesno'},
      {id:'c_repeat_why', en:'Two days running: what is going wrong at that stage, and who needs to fix it?', am:'ሁለት ቀን ተከታታይ ነው፦ በዚያ ደረጃ ምን እየተበላሸ ነው? ማን ማስተካከል አለበት?', t:'area', show:{f:'c_repeat', when:'yes'}},
      {id:'c_told', en:'Was Amaha told, with the cause named?', am:'ለአማሃ ምክንያቱ ተጠቅሶ ተነግሮታል?', t:'yesno'},
      {id:'c_told_why', en:'Why not, and when will he be told?', am:'ለምን? መቼ ይነገረዋል?', t:'area', show:{f:'c_told', when:'no'}},
      {id:'c_sup', en:'How many defects were the supplier\'s fault, not ours?', am:'ስንቱ ጉድለቶች የእኛ ሳይሆኑ የአቅራቢው ጥፋት ናቸው?', t:'num'},
      {id:'c_sup_what', en:'Which material, from which supplier, and what was wrong with it?', am:'የትኛው ዕቃ? ከየትኛው አቅራቢ? ምን ችግር ነበረበት?', t:'area', show:{f:'c_sup', when:'pos'}},
      {id:'c_suptold', en:'If any, were Getachew and Yordanos told the same day?', am:'ካሉ ለጌታቸውና ለዮርዳኖስ በዚያው ቀን ተነግሯል?', t:'yesno', opt:1, i:1}
    ]},
    { en:'6 · Problems and solutions', am:'6 · ችግሮችና መፍትሔዎች', fields:[
      {id:'problem', en:'What was the biggest quality problem today — what caused it, and what is being done (who, by when)?', am:'የዛሬው ትልቁ የጥራት ችግር ምን ነበር? ምክንያቱ ምንድን ነው? ምን እየተደረገ ነው (በማን፣ እስከ መቼ)?', t:'area', opt:1},
      {id:'need_help', en:'What do you need from Amaha, the store or Mahelet?', am:'ከአማሃ፣ ከመጋዘን ወይም ከማህሌት ምን ያስፈልግዎታል?', t:'area', opt:1},
      {id:'need_lead', en:'Do you need a decision from Mahelet?', am:'የማህሌት ውሳኔ ያስፈልግዎታል?', t:'yesno'},
      {id:'need_lead_what', en:'What exactly should she decide, and by when?', am:'በትክክል ምን እንድትወስን ይፈልጋሉ? እስከ መቼ?', t:'area', show:{f:'need_lead', when:'yes'}}
    ]},
    { en:"7 · Tomorrow's top 3 priorities", am:'7 · የነገ ሦስት ቅድሚያዎች', fields:[
      {id:'p1', en:'Priority 1', am:'1ኛ ሥራ', t:'text'},
      {id:'p2', en:'Priority 2', am:'2ኛ ሥራ', t:'text'},
      {id:'p3', en:'Priority 3', am:'3ኛ ሥራ', t:'text'}
    ]}
  ]
},

/* ========================= WUDE — WEEKLY QC =========================== */
{
  id:'wude-weekly', person:'wude', cadence:'weekly', dueTime:'17:00', dueDay:6,
  en:'Weekly QC Summary', am:'ሳምንታዊ የጥራት ቁጥጥር ማጠቃለያ',
  toEn:'Mahelet + Ephrata', toAm:'ማህሌት + ኤፍራታ',
  dueEn:'Saturday 5:00 PM', dueAm:'ቅዳሜ ከቀኑ 11፡00 (5:00 PM)',
  penEn:'Late or not sent –500 Birr', penAm:'ዘግይቶ ወይም ካልቀረበ –500 ብር',
  sections:[
    { en:'1 · Inspection performance', am:'1 · ፍተሻ እንዴት ሄደ', fields:[
      {id:'w_inspected', en:'How many jobs did you inspect this week?', am:'በዚህ ሳምንት ስንት ሥራ መረመሩ?', t:'num', auto:{week:'i_total'}},
      {id:'w_pass', en:'How many passed?', am:'ስንቱ አለፉ?', t:'num', auto:{week:'i_pass'}},
      {id:'w_fail', en:'How many failed?', am:'ስንቱ አላለፉም?', t:'num', auto:{week:'i_fail'}},
      {id:'w_fail_list', en:'Which jobs failed, why, and where do they stand now?', am:'ያላለፉት የትኞቹ ሥራዎች ናቸው? ለምን? አሁን በምን ደረጃ ላይ ናቸው?', t:'table', addEn:'Add a job', addAm:'ሥራ ጨምር',
        show:{f:'w_fail', when:'pos'},
        cols:[
          {id:'code', en:'Job code', am:'የሥራ ኮድ', t:'text'},
          {id:'cust', en:'Customer', am:'ደንበኛ', t:'text'},
          {id:'why', en:'Reason', am:'ምክንያት', t:'text'},
          {id:'now', en:'Now', am:'አሁን', t:'choice', opts:[
            {v:'passed', en:'Reworked and passed', am:'ተሠርቶ አልፏል'},
            {v:'rework', en:'Still in rework', am:'በዳግም ሥራ ላይ'},
            {v:'reject', en:'Rejected', am:'ውድቅ ሆኗል'}]}
        ]},
      {id:'w_rate', en:'What was the pass rate this week?', am:'የዚህ ሳምንት የማለፊያ መጠን ስንት በመቶ ነበር?', t:'pct',
        auto:{pct:['w_pass', 'w_inspected']},
        tgt:{op:'gte', v:98, en:'Below 98% is –500 Birr for the month', am:'ከ98% በታች ለወሩ –500 ብር'}},
      {id:'w_rate_why', en:'Below 98%: what pulled it down, and what must change next week?', am:'ከ98% በታች ነው፦ ምን አወረደው? በሚቀጥለው ሳምንት ምን መቀየር አለበት?', t:'area', show:{f:'w_rate', when:'miss'}}
    ]},
    { en:'2 · Defect analysis', am:'2 · የጉድለት ትንተና', fields:[
      {id:'defects', en:'How many of each defect type, and what share of the total?', am:'ከእያንዳንዱ የጉድለት ዓይነት ስንት? ከጠቅላላው ስንት በመቶ?', t:'grid',
       rows:[{en:'Scratch', am:'ጭረት'},{en:'Stain', am:'እድፍ'},
             {en:'Dimension error', am:'የልኬት ስህተት'},{en:'Edge damage', am:'የጠርዝ ጉዳት'},
             {en:'Hardware issue', am:'የሃርድዌር ችግር'},{en:'Assembly issue', am:'የመገጣጠም ችግር'},
             {en:'Other', am:'ሌላ'}],
       cols:[
        {id:'n', en:'Count', am:'ብዛት', t:'num'},
        {id:'pct', en:'% of total', am:'ከጠቅላላው %', t:'pct'}
      ]},
      {id:'top_defect', en:'Which defect type was most common this week?', am:'በዚህ ሳምንት በብዛት የተከሰተው የትኛው ጉድለት ነው?', t:'text'},
      {id:'top_why', en:'Why does that defect keep happening, and at which stage does it start?', am:'ያ ጉድለት ለምን ይደጋገማል? በየትኛው የሥራ ደረጃ ይጀምራል?', t:'area'}
    ]},
    { en:'3 · Rework performance', am:'3 · ዳግም ሥራ እንዴት ሄደ', fields:[
      {id:'rw_req', en:'How many jobs needed rework this week?', am:'በዚህ ሳምንት ስንት ሥራዎች ዳግም ሥራ አስፈለጋቸው?', t:'num', auto:{week:'r_required'}},
      {id:'rw_done', en:'How many reworks were finished?', am:'ስንት ዳግም ሥራዎች ተጠናቀቁ?', t:'num', auto:{week:'r_done'}},
      {id:'rw_rate', en:'What was the rework rate this week?', am:'የዚህ ሳምንት የዳግም ሥራ መጠን ስንት በመቶ ነበር?', t:'pct',
        auto:{pct:['rw_req', 'w_inspected']},
        tgt:{op:'lte', v:2, en:'Below 2% earns 1,000 Birr; above 5% is –500 Birr',
             am:'ከ2% በታች 1,000 ብር፤ ከ5% በላይ –500 ብር'}},
      {id:'rw_rate_why', en:'Above 2%: which jobs drove it, and what is the plan to bring it down?', am:'ከ2% በላይ ነው፦ ያሳደጉት የትኞቹ ሥራዎች ናቸው? ለመቀነስ ዕቅዱ ምንድን ነው?', t:'area', show:{f:'rw_rate', when:'miss'}},
      {id:'rw_cost', en:'What did rework cost this week?', am:'በዚህ ሳምንት ዳግም ሥራ ስንት ብር አስወጣ?', t:'money'}
    ]},
    { en:'4 · Customer complaints', am:'4 · የደንበኛ ቅሬታዎች', fields:[
      {id:'c_recv_any', en:'Did any customer complaint about quality come in this week?', am:'በዚህ ሳምንት ስለጥራት የደረሰ የደንበኛ ቅሬታ አለ?', t:'yesno'},
      {id:'c_recv_list', en:'List each complaint', am:'እያንዳንዱን ቅሬታ ይዘርዝሩ', t:'table', addEn:'Add a complaint', addAm:'ቅሬታ ጨምር',
        show:{f:'c_recv_any', when:'yes'},
        cols:[
          {id:'cust', en:'Customer', am:'ደንበኛ', t:'text'},
          {id:'code', en:'Job code', am:'የሥራ ኮድ', t:'text'},
          {id:'what', en:'Complaint', am:'ቅሬታ', t:'text'},
          {id:'passed', en:'Passed by QC?', am:'በጥራት ቁጥጥር አልፎ ነበር?', t:'yesno'}
        ]},
      {id:'c_recv', en:'How many customer complaints this week were about quality?', am:'በዚህ ሳምንት ስንት የደንበኛ ቅሬታዎች ከጥራት ጋር የተያያዙ ነበሩ?', t:'num',
        auto:{rows:'c_recv_list'}, sumEn:'complaints', sumAm:'ቅሬታዎች',
        tgt:{op:'lte', v:0, en:'–1,000 Birr each, and the 1,000 Birr bonus is lost',
             am:'እያንዳንዱ –1,000 ብር፣ የ1,000 ብር ጉርሻም ይጠፋል'}},
      {id:'c_res', en:'How many were resolved?', am:'ስንቱ ተፈቱ?', t:'num'},
      {id:'c_out', en:'How many are still open?', am:'ስንቱ ገና አልተፈቱም?', t:'num',
        auto:{minus:['c_recv', 'c_res']}},
      {id:'c_out_what', en:'Which, what is holding each one up, and when will it be closed?', am:'የትኞቹ? እያንዳንዱን ምን ያዘው? መቼ ይዘጋል?', t:'area', show:{f:'c_out', when:'pos'}}
    ]},
    { en:'5 · Pressure to pass a defect — you are protected when you report it', am:'5 · ጉድለት እንዲያሳልፉ የሚደረግ ጫና — ካሳወቁ ይጠበቃሉ', fields:[
      {id:'pr_week', en:'Did anyone pressure you this week to pass a defective product?', am:'በዚህ ሳምንት ጉድለት ያለበትን ምርት እንዲያሳልፉ ማንም ጫና አድርጎብዎታል?', t:'yesno'},
      {id:'pr_det', en:'If yes: who, which job, and what happened?', am:'አዎ ከሆነ፦ ማን? የትኛው ሥራ? ምን ሆነ?', t:'area', opt:1},
      {id:'pr_rep', en:'Was it reported to Mahelet?', am:'ለማህሌት ተነግሯል?', t:'yesno', opt:1},
      {id:'pr_rep_why', en:'Why was it not reported? Reporting it is what protects you under your letter.', am:'ለምን አልተነገረም? ማሳወቅ በደብዳቤዎ መሠረት የሚጠብቅዎት ነው።', t:'area', show:{f:'pr_rep', when:'no'}}
    ]},
    { en:'6 · Problems and solutions', am:'6 · ችግሮችና መፍትሔዎች', fields:[
      {id:'problem', en:'What was the biggest quality problem this week, and what caused it?', am:'የዚህ ሳምንት ትልቁ የጥራት ችግር ምን ነበር? ምክንያቱስ?', t:'area', opt:1},
      {id:'outstanding', en:'What is still unresolved?', am:'እስካሁን ያልተፈታው ምንድን ነው?', t:'area', opt:1},
      {id:'need_lead', en:'Do you need a decision from Mahelet?', am:'የማህሌት ውሳኔ ያስፈልግዎታል?', t:'yesno'},
      {id:'need_lead_what', en:'What exactly should she decide, and by when?', am:'በትክክል ምን እንድትወስን ይፈልጋሉ? እስከ መቼ?', t:'area', show:{f:'need_lead', when:'yes'}}
    ]},
    { en:"7 · Next week's plan", am:'7 · የሚቀጥለው ሳምንት ዕቅድ', fields:[
      {id:'n_exp', en:'How many inspections do you expect next week?', am:'በሚቀጥለው ሳምንት ስንት ፍተሻ ይጠብቃሉ?', t:'num'},
      {id:'n_risk', en:'Which jobs or materials are the biggest quality risk next week?', am:'በሚቀጥለው ሳምንት ትልቁ የጥራት ስጋት ያለባቸው የትኞቹ ሥራዎች ወይም ዕቃዎች ናቸው?', t:'area', opt:1},
      {id:'n_support', en:'What support do you need from Mahelet?', am:'ከማህሌት ምን ድጋፍ ያስፈልግዎታል?', t:'area', opt:1}
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
    { en:'1 · Rework summary', am:'1 · የዳግም ሥራ ማጠቃለያ', fields:[
      {id:'m_inspected', en:'How many jobs did you inspect this month?', am:'በዚህ ወር ስንት ሥራ መረመሩ?', t:'num', auto:{week:'i_total'}},
      {id:'m_rework', en:'How many needed rework?', am:'ስንቱ ዳግም ሥራ አስፈለጋቸው?', t:'num',
        auto:{week:'r_required'}},
      {id:'m_rate', en:'What was the rework rate for the month?', am:'የወሩ የዳግም ሥራ መጠን ስንት በመቶ ነበር?', t:'pct',
        auto:{pct:['m_rework', 'm_inspected']},
        tgt:{op:'lte', v:2, en:'Below 2% earns the 1,000 Birr bonus', am:'ከ2% በታች የ1,000 ብር ጉርሻ ያስገኛል'}},
      {id:'m_rate_why', en:'Above 2%: what drove it, and what is the plan for next month?', am:'ከ2% በላይ ነው፦ ምን አሳደገው? ለሚቀጥለው ወር ዕቅዱ ምንድን ነው?', t:'area', show:{f:'m_rate', when:'miss'}},
      {id:'m_cost', en:'What did rework cost in total this month?', am:'በዚህ ወር ዳግም ሥራ በጠቅላላ ስንት ብር አስወጣ?', t:'money'},
      {id:'m_cost_how', en:'How was the cost worked out — materials, hours of labour, anything else?', am:'ወጪው እንዴት ተሰላ? ዕቃ፣ የሥራ ሰዓት፣ ሌላ?', t:'area', show:{f:'m_cost', when:'pos'}}
    ]},
    { en:'2 · Rework by cause', am:'2 · በምክንያት የተከፋፈለ ዳግም ሥራ', fields:[
      {id:'cause_grid', en:'How many reworks did each cause produce, and what did they cost?', am:'እያንዳንዱ ምክንያት ስንት ዳግም ሥራ አስከተለ? ስንት ብር አስወጣ?', t:'grid',
       rows:[{en:'Cutting error', am:'የመቁረጥ ስህተት'},{en:'Assembly error', am:'የመገጣጠም ስህተት'},
             {en:'Edge banding error', am:'የጠርዝ ስህተት'},{en:'Hardware error', am:'የሃርድዌር ስህተት'},
             {en:'Material defect', am:'የቁሳቁስ ጉድለት'},{en:'Design error', am:'የዲዛይን ስህተት'},
             {en:'Other', am:'ሌላ'}],
       cols:[
        {id:'n', en:'Count', am:'ብዛት', t:'num'},
        {id:'cost', en:'Cost (Birr)', am:'ወጪ (ብር)', t:'money'}
      ]},
      {id:'cause_fix', en:'Which cause will you attack first next month, and how?', am:'በሚቀጥለው ወር በመጀመሪያ የትኛውን ምክንያት ይፈታሉ? እንዴት?', t:'area'}
    ]},
    { en:'3 · Rework by responsible person', am:'3 · በኃላፊው የተከፋፈለ ዳግም ሥራ', fields:[
      {id:'who_rows', en:'Who caused the rework, how many times, and at what cost?', am:'ዳግም ሥራውን ያስከተለው ማን ነው? ስንት ጊዜ? በስንት ብር?',
       t:'table', addEn:'Add person', addAm:'ሰው ጨምር', cols:[
        {id:'who',  en:'Person', am:'ሰው', t:'text'},
        {id:'n',    en:'Rework count', am:'የዳግም ሥራ ብዛት', t:'num'},
        {id:'cost', en:'Total cost', am:'ጠቅላላ ወጪ', t:'money'}
      ]},
      {id:'register_ok', en:'Did Mahelet and Selam check the Rework Register this month?', am:'ማህሌትና ሰላም በዚህ ወር የዳግም ሥራ መዝገቡን አረጋግጠዋል?', t:'yesno'},
      {id:'register_ok_why', en:'Why not, and when will they?', am:'ለምን? መቼ ያረጋግጣሉ?', t:'area', show:{f:'register_ok', when:'no'}}
    ]},
    { en:'4 · Quality verification', am:'4 · የጥራት ማረጋገጫ', fields:[
      {id:'v_rate', en:'What was the QC pass rate for the month?', am:'የወሩ የጥራት ቁጥጥር ማለፊያ መጠን ስንት በመቶ ነበር?', t:'pct',
        tgt:{op:'gte', v:98, en:'Below 98% is –500 Birr', am:'ከ98% በታች –500 ብር'}},
      {id:'v_rate_why', en:'Below 98%: what caused it?', am:'ከ98% በታች ነው፦ ምን አስከተለው?', t:'area', show:{f:'v_rate', when:'miss'}},
      {id:'v_released', en:'How many defects reached finished goods this month?', am:'በዚህ ወር ስንት ጉድለቶች ወደ ዝግጁ ዕቃ ማከማቻ ገቡ?', t:'num',
        auto:{week:'d_released'},
        tgt:{op:'lte', v:0, en:'–500 Birr each', am:'እያንዳንዱ –500 ብር'}},
      {id:'v_released_what', en:'Which jobs, and how did each get past inspection?', am:'የትኞቹ ሥራዎች? እያንዳንዱ ከፍተሻ እንዴት አመለጠ?', t:'area', show:{f:'v_released', when:'pos'}},
      {id:'v_complaints', en:'How many customer complaints were about quality?', am:'ስንት የደንበኛ ቅሬታዎች ከጥራት ጋር የተያያዙ ነበሩ?', t:'num',
        tgt:{op:'lte', v:0, en:'–1,000 Birr each', am:'እያንዳንዱ –1,000 ብር'}},
      {id:'v_complaints_what', en:'Which customers, about what, and is each one closed?', am:'የትኞቹ ደንበኞች? ስለምን? እያንዳንዱ ተዘግቷል?', t:'area', show:{f:'v_complaints', when:'pos'}}
    ]},
    { en:'5 · Next month', am:'5 · የሚቀጥለው ወር', fields:[
      {id:'m_need', en:'What do you need from Mahelet or Selam to bring rework down?', am:'ዳግም ሥራን ለመቀነስ ከማህሌት ወይም ከሰላም ምን ያስፈልግዎታል?', t:'area', opt:1}
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
    { en:'1 · Jobs today', am:'1 · የዛሬ ሥራዎች', fields:[
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
        {id:'start', en:'Start time', am:'የተጀመረበት ሰዓት', t:'text'},
        {id:'fin',   en:'Finish time', am:'የተጠናቀቀበት ሰዓት', t:'text'},
        {id:'ontime',en:'On time', am:'በሰዓቱ', t:'yesno'},
        {id:'slip',  en:'Payment slip in hand before work started', am:'ሥራ ከመጀመሩ በፊት የክፍያ ወረቀት ነበረ', t:'yesno'},
        {id:'called',en:'Customer called 30 min before arrival', am:'ከመድረስ 30 ደቂቃ በፊት ለደንበኛው ተደውሏል', t:'yesno'}
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
      {id:'j_idle_why', en:'Why was there no work on them today?', am:'ዛሬ ለምን አልተሠራባቸውም?', t:'area', show:{f:'j_idle', when:'pos'}},
      {id:'j_wip_left', en:'Which jobs are still open, what is left on each, and on what day will each be finished?', am:'ያላለቁት የትኞቹ ሥራዎች ናቸው? በእያንዳንዱ ምን ቀረ? እያንዳንዱ በየትኛው ቀን ያልቃል?', t:'area', show:{f:'j_wip', when:'pos'}},
      /* a job nobody worked on today had no slip to show, and is not a "no" */
      {id:'j_slips', en:'Did every job have its assembler Payment Confirmation Slip before work started?', am:'ሥራ ከመጀመሩ በፊት ለእያንዳንዱ ሥራ የገጣጣሚ ክፍያ ማረጋገጫ ወረቀት ነበረ?', t:'yesno',
        auto:{all:'j_rows.slip', when:{col:'state', in:['done', 'wip', '']}}},
      {id:'j_slips_why', en:'Which jobs had no slip, and did work start without it?', am:'ማረጋገጫ ወረቀት ያልነበራቸው የትኞቹ ሥራዎች ናቸው? ወረቀቱ ሳይኖር ሥራ ተጀምሯል?', t:'area', show:{f:'j_slips', when:'no'}},
      {id:'mat_missing', en:'On arrival, was anything missing, wrong or damaged in the materials, tools or accessories?', am:'በደረሱበት ጊዜ ከቁሳቁሶች፣ ከመሣሪያዎች ወይም ከአክሰሰሪዎች የጎደለ፣ የተሳሳተ ወይም የተጎዳ ነገር ነበር?', t:'yesno'},
      {id:'mat_missing_what', en:'What, for which job, whose error was it, and how many hours did it cost?', am:'ምንድን ነው? ለየትኛው ሥራ? የማን ስህተት ነበር? ስንት ሰዓት አስጠፋ?', t:'area', show:{f:'mat_missing', when:'yes'}},
      /* Photos from the site (the Chairman, 10 Oct 2026). Each one goes into
         the room this report is delivered to the moment it is added, with
         its job code on it; what is kept here is only the tally, so the
         report says which jobs have photos. */
      {id:'ph_site', en:'Site photos', am:'የቦታ ፎቶዎች', t:'photos', jobsFrom:'j_rows.code', opt:1}
    ]},
    { en:'2 · Assembler performance', am:'2 · ገጣጣሚዎች እንዴት ሠሩ', fields:[
      {id:'a_present', en:'How many assemblers were on site today?', am:'ዛሬ ስንት ገጣጣሚዎች በቦታው ተገኙ?', t:'num'},
      {id:'a_late_any', en:'Did any assembler arrive late?', am:'ዘግይቶ የደረሰ ገጣጣሚ አለ?', t:'yesno'},
      {id:'a_late_who', en:'Who was late?', am:'የዘገዩት እነማን ናቸው?', t:'table', addEn:'Add an assembler', addAm:'ገጣጣሚ ጨምር',
        show:{f:'a_late_any', when:'yes'},
        cols:[
          {id:'name', en:'Assembler', am:'ገጣጣሚ', t:'text'},
          {id:'mins', en:'Minutes late', am:'የዘገዩበት ደቂቃ', t:'num'},
          {id:'act', en:'Action taken', am:'የተወሰደ እርምጃ', t:'text'}
        ]},
      {id:'a_late', en:'How many assemblers arrived late?', am:'ስንት ገጣጣሚዎች ዘግይተው ደረሱ?', t:'num',
        auto:{rows:'a_late_who'}, sumEn:'late', sumAm:'ዘግይተዋል',
        tgt:{op:'lte', v:0, en:'Unreported lateness is –200 Birr', am:'ያልተነገረ መዘግየት –200 ብር'}},
      {id:'a_early', en:'How many assemblers left before the job was done?', am:'ሥራው ሳያልቅ ስንት ገጣጣሚዎች ቀድመው ወጡ?', t:'num',
        tgt:{op:'lte', v:0, en:'Unreported early leave is –200 Birr', am:'ያልተነገረ ቀድሞ መውጣት –200 ብር'}},
      {id:'a_early_who', en:'Who left, at what time, did you approve it, and what was left undone?', am:'ማን ወጣ? በስንት ሰዓት? እርስዎ ፈቅደዋል? ምን ሳይሠራ ቀረ?', t:'area', show:{f:'a_early', when:'pos'}},
      {id:'a_behave', en:'How many times did an assembler break the site rules (smoking, loud phone or music, rudeness, arguing)?', am:'ገጣጣሚዎች ስንት ጊዜ የቦታውን ደንብ ጣሱ? (ማጨስ፣ ጮክ ያለ ስልክ ወይም ሙዚቃ፣ ብልግና፣ ክርክር)', t:'num',
        tgt:{op:'lte', v:0, en:'Unreported bad behaviour is –500 Birr', am:'ያልተነገረ የባህርይ ችግር –500 ብር'}},
      {id:'a_behave_what', en:'Who, what happened, at which customer, and what action or penalty was applied?', am:'ማን ነው? ምን ተፈጠረ? በየትኛው ደንበኛ ቤት? ምን እርምጃ ወይም ቅጣት ተወሰደ?', t:'area', show:{f:'a_behave', when:'pos'}},
      {id:'a_reported', en:'Were all of these reported to Mahelet today?', am:'እነዚህ ሁሉ ዛሬ ለማህሌት ተነግረዋል?', t:'yesno'},
      {id:'a_reported_why', en:'What was not reported, and why?', am:'ያልተነገረው ምንድን ነው? ለምን?', t:'area', show:{f:'a_reported', when:'no'}}
    ]},
    { en:'3 · Customer acceptance', am:'3 · የደንበኛ ተቀባይነት', fields:[
      {id:'ac_any', en:'Did any customer sign the acceptance form today?', am:'ዛሬ የተቀባይነት ፎርም የፈረመ ደንበኛ አለ?', t:'yesno'},
      {id:'ac_list', en:'Which customers?', am:'የትኞቹ ደንበኞች?', t:'table', addEn:'Add a customer', addAm:'ደንበኛ ጨምር',
        show:{f:'ac_any', when:'yes'}, cols:[
          {id:'cust', en:'Customer', am:'ደንበኛ', t:'text'},
          {id:'code', en:'Job code', am:'የሥራ ኮድ', t:'text'}
        ]},
      {id:'ac_signed', en:'How many customers signed the acceptance form today?', am:'ዛሬ ስንት ደንበኞች የተቀባይነት ፎርም ፈረሙ?', t:'num',
        auto:{rows:'ac_list'}, sumEn:'signed', sumAm:'ፈርመዋል'},
      {id:'ac_complaints', en:'How many customer complaints came in today?', am:'ዛሬ ስንት የደንበኛ ቅሬታዎች ቀረቡ?', t:'num',
        tgt:{op:'lte', v:0, en:'A complaint costs the 3,000 + 2,000 Birr bonuses',
             am:'ቅሬታ የ3,000 + 2,000 ብር ጉርሻዎችን ያሳጣል'}},
      {id:'ac_complaints_what', en:'Which customer, what was the complaint, what was done, and is it closed?', am:'የየትኛው ደንበኛ ነው? ቅሬታው ምን ነበር? ምን እርምጃ ተወሰደ? ተዘግቷል?', t:'area', show:{f:'ac_complaints', when:'pos'}},
      {id:'ac_called', en:'How many customers were called 30 minutes before arrival? (called / sites visited)', am:'ከመድረስዎ 30 ደቂቃ በፊት ስንት ደንበኞች ተደወለላቸው? (የተደወለላቸው / የተጎበኙ ቦታዎች)', t:'ratio',
        auto:{a:{rows:'j_rows', when:{col:'called', is:'yes'}}, b:{rows:'j_rows', when:{col:'state', in:['done', 'wip', '']}}}},
      {id:'ac_called_why', en:'Which customers were not called, and why?', am:'ያልተደወለላቸው የትኞቹ ደንበኞች ናቸው? ለምን?', t:'area', show:{f:'ac_called', when:'short'}}
    ]},
    { en:'4 · Quality check at site', am:'4 · በቦታው የተደረገ የጥራት ፍተሻ', fields:[
      {id:'q_walk', en:'Did you walk through the finished work with every customer?', am:'የተጠናቀቀውን ሥራ ከእያንዳንዱ ደንበኛ ጋር ቅኝት አደረጉ?', t:'yesno'},
      {id:'q_walk_why', en:'Which jobs had no walk-through, and why?', am:'ቅኝት ያልተደረገባቸው የትኞቹ ሥራዎች ናቸው? ለምን?', t:'area', show:{f:'q_walk', when:'no'}},
      {id:'q_doors', en:'Were doors, drawers and alignment checked on every job?', am:'በእያንዳንዱ ሥራ በሮች፣ መሳቢያዎችና አሰላለፍ ተፈትሸዋል?', t:'yesno'},
      {id:'q_doors_why', en:'Which jobs were not checked, and why?', am:'ያልተፈተሹት የትኞቹ ሥራዎች ናቸው? ለምን?', t:'area', show:{f:'q_doors', when:'no'}},
      {id:'q_edges', en:'Were edges and handles checked on every job?', am:'በእያንዳንዱ ሥራ ጠርዞችና እጀታዎች ተፈትሸዋል?', t:'yesno'},
      {id:'q_edges_why', en:'Which jobs were not checked, and why?', am:'ያልተፈተሹት የትኞቹ ሥራዎች ናቸው? ለምን?', t:'area', show:{f:'q_edges', when:'no'}},
      {id:'q_rework', en:'Did any job need rework at the site today?', am:'ዛሬ በቦታው ዳግም ሥራ ያስፈለገው ሥራ ነበር?', t:'yesno'},
      {id:'q_rework_what', en:'Which job, what had to be redone, what caused it (factory, design or site), and how many hours did it cost?', am:'የትኛው ሥራ ነው? ምን በድጋሚ ተሠራ? ምክንያቱ ምን ነበር (ፋብሪካ፣ ዲዛይን ወይስ ቦታ)? ስንት ሰዓት አስጠፋ?', t:'area', show:{f:'q_rework', when:'yes'}},
      {id:'q_reported', en:'Was the rework reported to Mahelet the same day?', am:'ዳግም ሥራው በዕለቱ ለማህሌት ተነግሯል?', t:'yesno', opt:1}
    ]},
    { en:'5 · Site cleanliness and property', am:'5 · የቦታ ጽዳትና የደንበኛ ንብረት', fields:[
      {id:'cl_clean', en:'Was every site left clean, with all packaging removed?', am:'እያንዳንዱ ቦታ ማሸጊያው ተነስቶ ንጹህ ሆኖ ቀረ?', t:'yesno'},
      {id:'cl_clean_why', en:'Which site was not left clean, and why?', am:'ንጹህ ያልሆነው የትኛው ቦታ ነው? ለምን?', t:'area', show:{f:'cl_clean', when:'no'}},
      {id:'cl_protect', en:'Were the customer\'s floors, walls and furniture protected on every job?', am:'በእያንዳንዱ ሥራ የደንበኛው ወለል፣ ግድግዳና የቤት ዕቃ ተጠብቋል?', t:'yesno'},
      {id:'cl_protect_why', en:'Where was it not protected, and why?', am:'የት ነው ያልተጠበቀው? ለምን?', t:'area', show:{f:'cl_protect', when:'no'}},
      {id:'cl_damage', en:'Was any customer property damaged today?', am:'ዛሬ የደንበኛ ንብረት ተጎድቷል?', t:'yesno'},
      {id:'cl_damage_what', en:'What was damaged, at which customer, by whom, what will it cost, and was the customer told?', am:'ምን ተጎዳ? በየትኛው ደንበኛ ቤት? በማን? ስንት ያስወጣል? ለደንበኛው ተነግሯል?', t:'area', show:{f:'cl_damage', when:'yes'}},
      {id:'cl_tools', en:'Were all tools and unused materials returned to the store?', am:'ሁሉም መሣሪያዎችና ያልዋሉ ቁሳቁሶች ወደ መጋዘን ተመለሱ?', t:'yesno'},
      {id:'cl_tools_what', en:'What is still out, where is it, and when will it come back?', am:'ያልተመለሰው ምንድን ነው? የት ነው ያለው? መቼ ይመለሳል?', t:'area', show:{f:'cl_tools', when:'no'}}
    ]},
    { en:'6 · WhatsApp compliance', am:'6 · ዋትስአፕ አጠቃቀም', fields:[
      {id:'wa_welcome', en:'Was the Assembler Welcome Message posted in every new group?', am:'በእያንዳንዱ አዲስ ግሩፕ የገጣጣሚ አቀባበል መልዕክት ተልኳል?', t:'yesno'},
      {id:'wa_welcome_why', en:'Which groups, and why?', am:'የትኞቹ ግሩፖች ናቸው? ለምን?', t:'area', show:{f:'wa_welcome', when:'no'}},
      {id:'wa_started', en:'Was the Installation Started message posted for every job?', am:'ለእያንዳንዱ ሥራ "ተከላ ተጀመረ" መልዕክት ተልኳል?', t:'yesno'},
      {id:'wa_started_why', en:'Which jobs, and why?', am:'የትኞቹ ሥራዎች ናቸው? ለምን?', t:'area', show:{f:'wa_started', when:'no'}},
      {id:'wa_progress', en:'Did every assembler post a Daily Progress Update?', am:'ሁሉም ገጣጣሚዎች የዕለት ሪፖርት ልከዋል?', t:'yesno'},
      {id:'wa_progress_who', en:'Which assemblers did not, and what was done?', am:'ያልላኩት የትኞቹ ገጣጣሚዎች ናቸው? ምን እርምጃ ተወሰደ?', t:'area', show:{f:'wa_progress', when:'no'}},
      {id:'wa_accept', en:'Was the Customer Acceptance Request posted after every finished job?', am:'ከእያንዳንዱ የተጠናቀቀ ሥራ በኋላ የደንበኛ ተቀባይነት ጥያቄ ተልኳል?', t:'yesno'},
      {id:'wa_accept_why', en:'Which jobs, and why?', am:'የትኞቹ ሥራዎች ናቸው? ለምን?', t:'area', show:{f:'wa_accept', when:'no'}},
      {id:'wa_viol', en:'How many WhatsApp violations did the site team make today?', am:'ዛሬ የቦታው ቡድን ስንት የዋትስአፕ ጥሰቶች ፈጸመ?', t:'num',
        tgt:{op:'lte', v:0, en:'3 or more in a week cancels the 1,000 Birr bonus',
             am:'በሳምንት 3 እና ከዚያ በላይ የ1,000 ብር ጉርሻን ይሰርዛል'}},
      {id:'wa_viol_what', en:'Who, what was posted or missed, and was it reported to Mahelet?', am:'ማን ነው? ምን ተላከ ወይም ቀረ? ለማህሌት ተነግሯል?', t:'area', show:{f:'wa_viol', when:'pos'}}
    ]},
    { en:'7 · Was the site ready', am:'7 · ቦታው ዝግጁ ነበር', fields:[
      {id:'r_rows', en:'What did you find on arrival at each job?', am:'በደረሱበት ጊዜ በእያንዳንዱ ሥራ ቦታው ምን ይመስል ነበር?',
       t:'table', addEn:'Add job', addAm:'ሥራ ጨምር', cols:[
        {id:'rcode',  en:'Job code', am:'የሥራ ኮድ', t:'text'},
        {id:'rwalls', en:'Walls and floor finished', am:'ግድግዳና ወለል ተጠናቋል', t:'yesno'},
        {id:'rpower', en:'Power available', am:'መብራት አለ', t:'yesno'},
        {id:'rwater', en:'Water and drain ready', am:'ውሃና ፍሳሽ ዝግጁ', t:'yesno'},
        {id:'rlevel', en:'Floor level within tolerance', am:'ወለሉ ልክ ነው', t:'yesno'},
        {id:'rmeas',  en:'Site matched our measurement', am:'ቦታው ከልኬታችን ጋር ተመሳስሏል', t:'yesno'},
        {id:'rappl',  en:'Appliances on site and correct', am:'የኤሌክትሪክ ዕቃዎች ደርሰዋል', t:'yesno'},
        {id:'rlost',  en:'Hours lost', am:'የጠፋ ሰዓት', t:'num'}
      ]},
      {id:'r_notready', en:'On how many jobs was the site not ready?', am:'በስንት ሥራዎች ቦታው ዝግጁ አልነበረም?', t:'num'},
      {id:'r_notready_what', en:'What was not ready on each, whose responsibility was it, and when can work restart?', am:'በእያንዳንዱ ዝግጁ ያልነበረው ምንድን ነው? የማን ኃላፊነት ነበር? ሥራው መቼ እንደገና ይጀመራል?', t:'area', show:{f:'r_notready', when:'pos'}},
      {id:'r_meas', en:'On how many jobs did the site not match our measurement?', am:'በስንት ሥራዎች ቦታው ከልኬታችን ጋር አልተመሳሰለም?', t:'num',
        tgt:{op:'lte', v:0, en:'A measurement that does not match is a design or survey failure — name the job',
             am:'ያልተመሳሰለ ልኬት የዲዛይን ወይም የዳሰሳ ስህተት ነው — ሥራውን ይጥቀሱ'}},
      {id:'r_whose', en:'Whose measurement was it?', am:'የማን ልኬት ነበር?', t:'text', opt:1, i:1},
      {id:'r_meas_what', en:'Which jobs, what was different (which wall, by how many cm), and how will it be fixed?', am:'የትኞቹ ሥራዎች ናቸው? ምን ተለየ (የትኛው ግድግዳ፣ በስንት ሴ.ሜ)? እንዴት ይስተካከላል?', t:'area', show:{f:'r_meas', when:'pos'}},
      {id:'r_lost', en:'How many hours were lost today because a site was not ready?', am:'ቦታው ዝግጁ ባለመሆኑ ዛሬ ስንት ሰዓት ጠፋ?', t:'num'},
      {id:'r_told', en:'Was the customer told the same day why we could not finish?', am:'ለምን መጨረስ እንዳልተቻለ ለደንበኛው በዚያኑ ቀን ተነግሯል?', t:'yesno'},
      {id:'r_told_why', en:'Which customer was not told, and why?', am:'ያልተነገረው የትኛው ደንበኛ ነው? ለምን?', t:'area', show:{f:'r_told', when:'no'}},
      {id:'r_photo', en:'Did you photograph the site before anything was touched?', am:'ምንም ሳይነካ የቦታውን ፎቶ አነሱ?', t:'yesno'},
      {id:'r_photo_why', en:'Which site has no photo, and why?', am:'ፎቶ ያልተነሳው የትኛው ቦታ ነው? ለምን?', t:'area', show:{f:'r_photo', when:'no'}}
    ]},
    { en:'8 · Problems and solutions', am:'8 · ችግሮችና መፍትሔዎች', fields:[
      {id:'problem', en:'What was the biggest problem today — what caused it, and what is being done (who, by when)?', am:'የዛሬው ትልቁ ችግር ምን ነበር? ምክንያቱ ምንድን ነው? ምን እየተደረገ ነው (በማን፣ እስከ መቼ)?', t:'area', opt:1},
      {id:'need_lead', en:'Do you need a decision from Mahelet?', am:'የማህሌት ውሳኔ ያስፈልግዎታል?', t:'yesno'},
      {id:'need_lead_what', en:'What exactly should Mahelet decide, what are the options, and by when?', am:'ማህሌት በትክክል ምን እንዲወስኑ ይፈልጋሉ? አማራጮቹ ምንድን ናቸው? እስከ መቼ?', t:'area', show:{f:'need_lead', when:'yes'}}
    ]},
    { en:"9 · Tomorrow's plan", am:'9 · የነገ ዕቅድ', fields:[
      {id:'t_rows', en:'Which jobs are planned for tomorrow?', am:'ለነገ የታቀዱት ሥራዎች የትኞቹ ናቸው?',
       t:'table', addEn:'Add job', addAm:'ሥራ ጨምር', cols:[
        {id:'code', en:'Job code', am:'የሥራ ኮድ', t:'text'},
        {id:'site', en:'Site and area (e.g. Ayat, near the roundabout)', am:'ቦታና አካባቢ (ለምሳሌ አያት፣ አደባባዩ አጠገብ)', t:'text'},
        {id:'crew', en:'Crew size', am:'የቡድን ብዛት', t:'num'},
        {id:'m2',   en:'Planned m²', am:'የታቀደ ካሬ ሜትር', t:'num'}
      ]},
      {id:'t_ready', en:'Is every site for tomorrow confirmed ready, with the delivery time agreed with Alex and the customer?', am:'ለነገ ያሉት ሁሉም ቦታዎች ዝግጁ መሆናቸው ተረጋግጧል? የማድረሻ ሰዓት ከአሌክስና ከደንበኛው ጋር ተስማምቷል?', t:'yesno'},
      {id:'t_ready_why', en:'Which sites are not confirmed, and what is being done?', am:'ያልተረጋገጡት የትኞቹ ቦታዎች ናቸው? ምን እየተደረገ ነው?', t:'area', show:{f:'t_ready', when:'no'}}
    ]}
  ]
},

/* ======================== ELYAS — WEEKLY SITE ========================= */
{
  id:'elyas-weekly', person:'elyas', cadence:'weekly', dueTime:'17:00', dueDay:6,
  en:'Weekly Site Summary', am:'ሳምንታዊ የተከላ ማጠቃለያ',
  toEn:'Mahelet + Ephrata', toAm:'ማህሌት + ኤፍራታ',
  dueEn:'Saturday 5:00 PM', dueAm:'ቅዳሜ ከቀኑ 11፡00 (5:00 PM)',
  penEn:'Late or not sent –500 Birr', penAm:'ዘግይቶ ወይም ካልቀረበ –500 ብር',
  sections:[
    { en:'1 · Installation performance', am:'1 · ተከላ እንዴት ሄደ', fields:[
      {id:'w_sched', en:'How many jobs were scheduled this week?', am:'በዚህ ሳምንት ስንት ሥራዎች ታቅደው ነበር?', t:'num'},
      {id:'w_done', en:'How many were completed?', am:'ስንቱ ተጠናቀቁ?', t:'num', auto:{week:'j_done'}},
      {id:'w_ontime', en:'How many were completed on time?', am:'ስንቱ በሰዓቱ ተጠናቀቁ?', t:'num', auto:{week:'j_ontime'},
        tgt:{op:'gte', v:3, en:'3 on time pays 400 Birr, 5 pays 600, 7+ pays 800',
             am:'3 በሰዓቱ 400 ብር፣ 5 ደግሞ 600፣ ከ7 በላይ 800 ብር'}},
      {id:'w_m2', en:'How many m² were installed this week?', am:'በዚህ ሳምንት ስንት ካሬ ሜትር ተገጠመ?', t:'num', auto:{week:'j_m2'}},
      {id:'w_rate', en:'What was the on-time rate this week? (%)', am:'የዚህ ሳምንት በሰዓቱ የመጠናቀቅ መጠን ስንት ነው? (%)', t:'pct',
        auto:{pct:['w_ontime', 'w_done']},
        tgt:{op:'gte', v:95, en:'≥95% earns the 3,000 Birr KPI bonus', am:'≥95% የ3,000 ብር KPI ጉርሻ ያስገኛል'}},
      {id:'w_delayed_any', en:'Was any job delayed this week?', am:'በዚህ ሳምንት የዘገየ ሥራ አለ?', t:'yesno'},
      {id:'w_delayed_list', en:'Which jobs were delayed?', am:'የዘገዩት የትኞቹ ሥራዎች ናቸው?', t:'table', addEn:'Add a job', addAm:'ሥራ ጨምር',
        show:{f:'w_delayed_any', when:'yes'},
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
      {id:'w_why', en:'What was the main reason for the delays, and what will stop it next week?', am:'የመዘግየቱ ዋና ምክንያት ምን ነበር? በሚቀጥለው ሳምንት እንዳይደገም ምን ይደረጋል?', t:'area', opt:1}
    ]},
    { en:'2 · Assembler performance', am:'2 · ገጣጣሚዎች እንዴት ሠሩ', fields:[
      {id:'as_total', en:'How many assemblers worked with you this week?', am:'በዚህ ሳምንት ስንት ገጣጣሚዎች አብረውዎት ሠሩ?', t:'num'},
      {id:'as_att', en:'What was their average attendance? (%)', am:'አማካይ የተገኝነት መጠናቸው ስንት ነበር? (%)', t:'pct'},
      {id:'as_late', en:'How many assemblers were late more than once?', am:'ስንት ገጣጣሚዎች ከአንድ ጊዜ በላይ ዘገዩ?', t:'num'},
      {id:'as_late_who', en:'Who, how many times, and what action was taken?', am:'እነማን ናቸው? ስንት ጊዜ? ምን እርምጃ ተወሰደ?', t:'area', show:{f:'as_late', when:'pos'}},
      {id:'as_behave', en:'How many assemblers had behaviour problems?', am:'ስንት ገጣጣሚዎች የባህርይ ችግር ነበረባቸው?', t:'num'},
      {id:'as_behave_what', en:'Who, what happened, and what action or penalty was applied?', am:'እነማን ናቸው? ምን ተፈጠረ? ምን እርምጃ ወይም ቅጣት ተወሰደ?', t:'area', show:{f:'as_behave', when:'pos'}},
      {id:'as_removal', en:'How many assemblers do you recommend removing?', am:'ስንት ገጣጣሚዎች እንዲነሱ ይጠቁማሉ?', t:'num'},
      {id:'as_removal_who', en:'Who, and what is on record for them in the Discipline Log?', am:'እነማን ናቸው? በዲሲፕሊን መዝገቡ ላይ ምን ተመዝግቦባቸዋል?', t:'area', show:{f:'as_removal', when:'pos'}},
      {id:'as_log', en:'Is the Assembler Discipline Log up to date and checked by Mahelet this week?', am:'የገጣጣሚ ዲሲፕሊን መዝገብ ወቅታዊ ነው? በዚህ ሳምንት በማህሌት ተረጋግጧል?', t:'yesno'},
      {id:'as_log_why', en:'What is missing from the log, and when will it be brought up to date?', am:'ከመዝገቡ ምን ጎደለ? መቼ ይሟላል?', t:'area', show:{f:'as_log', when:'no'}}
    ]},
    { en:'3 · Customer acceptance', am:'3 · የደንበኛ ተቀባይነት', fields:[
      {id:'cs_signed', en:'How many customers signed the acceptance form this week?', am:'በዚህ ሳምንት ስንት ደንበኞች የተቀባይነት ፎርም ፈረሙ?', t:'num', auto:{week:'ac_signed'}},
      {id:'cs_comp', en:'How many customers complained this week?', am:'በዚህ ሳምንት ስንት ደንበኞች ቅሬታ አቀረቡ?', t:'num',
        tgt:{op:'lte', v:0, en:'Zero is required for the 2,000 Birr satisfaction bonus',
             am:'ለ2,000 ብር የእርካታ ጉርሻ 0 መሆን አለበት'}},
      {id:'cs_comp_what', en:'Who complained, about what, and where does each complaint stand?', am:'ቅሬታ ያቀረቡት እነማን ናቸው? ስለምን? እያንዳንዱ ቅሬታ አሁን የት ደረሰ?', t:'area', show:{f:'cs_comp', when:'pos'}},
      {id:'cs_res', en:'How many complaints were resolved?', am:'ስንት ቅሬታዎች ተፈቱ?', t:'num'},
      {id:'cs_out', en:'How many complaints are still open?', am:'ስንት ቅሬታዎች ገና አልተፈቱም?', t:'num',
        auto:{minus:['cs_comp', 'cs_res']}, sumEn:'still open', sumAm:'አልተፈቱም'},
      {id:'cs_out_what', en:'Which ones, what is blocking each, and by what day will it close?', am:'የትኞቹ ናቸው? እያንዳንዱን ምን ያዘው? በየትኛው ቀን ይዘጋል?', t:'area', show:{f:'cs_out', when:'pos'}}
    ]},
    { en:'4 · Quality at site', am:'4 · በቦታው ያለ ጥራት', fields:[
      {id:'qs_rework', en:'How many jobs needed rework at the site this week?', am:'በዚህ ሳምንት ስንት ሥራዎች በቦታው ዳግም ሥራ ጠየቁ?', t:'num',
        tgt:{op:'lte', v:0, en:'Zero rework earns the 2,000 Birr site quality bonus',
             am:'ዳግም ሥራ ከሌለ የ2,000 ብር የጥራት ጉርሻ ያስገኛል'}},
      {id:'qs_rework_what', en:'Which jobs, what was redone, and what caused it (factory, design or site)?', am:'የትኞቹ ሥራዎች ናቸው? ምን በድጋሚ ተሠራ? ምክንያቱ ምን ነበር (ፋብሪካ፣ ዲዛይን ወይስ ቦታ)?', t:'area', show:{f:'qs_rework', when:'pos'}},
      {id:'qs_fail', en:'How many installed jobs failed QC?', am:'የተገጠሙ ስንት ሥራዎች በQC አላለፉም?', t:'num'},
      {id:'qs_fail_what', en:'Which jobs, and what was found?', am:'የትኞቹ ሥራዎች ናቸው? ምን ችግር ተገኘ?', t:'area', show:{f:'qs_fail', when:'pos'}},
      {id:'qs_cost', en:'What did rework at the site cost this week? (Birr)', am:'በዚህ ሳምንት በቦታው የተደረገ ዳግም ሥራ ስንት ብር አስወጣ?', t:'money'}
    ]},
    { en:'5 · WhatsApp compliance', am:'5 · ዋትስአፕ አጠቃቀም', fields:[
      {id:'wk_welcome', en:'How many Welcome Messages were posted? (posted / new groups)', am:'ስንት የአቀባበል መልዕክቶች ተላኩ? (የተላኩ / አዲስ ግሩፖች)', t:'ratio'},
      {id:'wk_started', en:'How many Installation Started messages were posted? (posted / jobs started)', am:'ስንት "ተከላ ተጀመረ" መልዕክቶች ተላኩ? (የተላኩ / የተጀመሩ ሥራዎች)', t:'ratio'},
      {id:'wk_progress', en:'How many Daily Progress Updates were posted? (posted / required)', am:'ስንት የዕለት ሪፖርቶች ተላኩ? (የተላኩ / የሚገባው)', t:'ratio'},
      {id:'wk_accept', en:'How many Customer Acceptance Requests were posted? (posted / jobs finished)', am:'ስንት የተቀባይነት ጥያቄዎች ተላኩ? (የተላኩ / የተጠናቀቁ ሥራዎች)', t:'ratio'},
      {id:'wk_rate', en:'What was the WhatsApp compliance rate this week? (%)', am:'ከሚገባው የዋትስአፕ መልዕክት ስንት በመቶውን ላኩ? (%)', t:'pct',
        tgt:{op:'gte', v:100, en:'100% earns the 1,000 Birr WhatsApp bonus', am:'100% የ1,000 ብር ጉርሻ ያስገኛል'}},
      {id:'wk_rate_why', en:'Below 100%. Which messages were missed, on which jobs, and why?', am:'ከ100% በታች ነው። የትኞቹ መልዕክቶች ቀሩ? በየትኞቹ ሥራዎች? ለምን?', t:'area', show:{f:'wk_rate', when:'miss'}}
    ]},
    { en:'6 · Problems and solutions', am:'6 · ችግሮችና መፍትሔዎች', fields:[
      {id:'problem', en:'What was the biggest problem this week, and what caused it?', am:'የዚህ ሳምንት ትልቁ ችግር ምን ነበር? ምክንያቱስ?', t:'area', opt:1},
      {id:'outstanding', en:'What is still unresolved, and who owns it?', am:'ገና ያልተፈታው ምንድን ነው? ኃላፊው ማን ነው?', t:'area', opt:1},
      {id:'need_lead', en:'Do you need a decision from Mahelet?', am:'የማህሌት ውሳኔ ያስፈልግዎታል?', t:'yesno'},
      {id:'need_lead_what', en:'What exactly should Mahelet decide, what are the options, and by when?', am:'ማህሌት በትክክል ምን እንዲወስኑ ይፈልጋሉ? አማራጮቹ ምንድን ናቸው? እስከ መቼ?', t:'area', show:{f:'need_lead', when:'yes'}}
    ]},
    { en:"7 · Next week's plan", am:'7 · የሚቀጥለው ሳምንት ዕቅድ', fields:[
      {id:'n_jobs', en:'How many jobs are scheduled for next week?', am:'ለሚቀጥለው ሳምንት ስንት ሥራዎች ታቅደዋል?', t:'num'},
      {id:'n_m2', en:'How many m² do you expect to install next week?', am:'በሚቀጥለው ሳምንት ስንት ካሬ ሜትር ለመግጠም ይጠበቃል?', t:'num'},
      {id:'n_support', en:'What support do you need from Mahelet next week?', am:'በሚቀጥለው ሳምንት ከማህሌት ምን ድጋፍ ያስፈልግዎታል?', t:'area', opt:1},
      {id:'n_prio', en:'What are your top 3 priorities for next week?', am:'የሚቀጥለው ሳምንት ዋና ሦስት ቅድሚያዎችዎ ምንድን ናቸው?', t:'area'}
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
    { en:'1 · Sites supported today', am:'1 · ዛሬ የተደገፉ ቦታዎች', fields:[
      {id:'s_rows', en:'Each site you supported today', am:'ዛሬ የደገፉት እያንዳንዱ ቦታ',
       t:'table', addEn:'Add site', addAm:'ቦታ ጨምር', cols:[
        {id:'code', en:'Job code', am:'የሥራ ኮድ', t:'text'},
        {id:'cust', en:'Customer', am:'ደንበኛ', t:'text'},
        {id:'site', en:'Site', am:'ቦታ', t:'text'}
      ]},
      {id:'s_count', en:'How many sites did you support today?', am:'ዛሬ ስንት ቦታዎችን ደገፉ?', t:'num',
        auto:{rows:'s_rows'}, sumEn:'sites', sumAm:'ቦታዎች'},
      {id:'s_arrive', en:'What time did you arrive at the first site?', am:'መጀመሪያው ቦታ ስንት ሰዓት ደረሱ?', t:'text'},
      {id:'s_depart', en:'What time did you leave the last site?', am:'ከመጨረሻው ቦታ ስንት ሰዓት ወጡ?', t:'text'},
      {id:'s_late', en:'Were you late to any site today?', am:'ዛሬ ወደ የትኛውም ቦታ ዘግይተው ደረሱ?', t:'yesno'},
      {id:'s_late_why', en:'Which site, how late, and why? Was Elyas told?', am:'የትኛው ቦታ ነው? ምን ያህል ዘገዩ? ለምን? ለኤልያስ ተነግሯል?', t:'area', show:{f:'s_late', when:'yes'}},
      {id:'pre_match', en:'Before leaving, did the load match the delivery note, with everything there and undamaged?', am:'ከመነሳትዎ በፊት ጭነቱ ከማድረሻ ሰነዱ ጋር ተመሳስሏል? ሁሉም ተሟልቶ ያልተጎዳ ነበር?', t:'yesno'},
      {id:'pre_match_what', en:'What was missing, wrong or damaged, for which job, and was Elyas told?', am:'ምን ጎደለ፣ ተሳሳተ ወይም ተጎዳ? ለየትኛው ሥራ? ለኤልያስ ተነግሯል?', t:'area', show:{f:'pre_match', when:'no'}},
      {id:'unsafe', en:'Was any site unsafe to work on today?', am:'ዛሬ ለሥራ አደገኛ የሆነ ቦታ ነበር?', t:'yesno'},
      {id:'unsafe_what', en:'What was unsafe, was work stopped, and was Elyas told?', am:'ምን አደገኛ ነበር? ሥራው ቆሟል? ለኤልያስ ተነግሯል?', t:'area', show:{f:'unsafe', when:'yes'}}
    ]},
    { en:'2 · Support provided', am:'2 · የተሰጠ ድጋፍ', fields:[
      {id:'sup', en:'Which tasks did you do today?', am:'ዛሬ ምን ምን ሥራዎችን ሠሩ?', t:'grid',
       rows:[{en:'Material carrying', am:'ቁሳቁስ ማመላለስ'},
             {en:'Protective covering', am:'መከላከያ ማንጠፍ'},
             {en:'Cleanup', am:'ጽዳት'},
             {en:'Tool collection', am:'መሣሪያ መሰብሰብ'},
             {en:'Photo taking', am:'ፎቶ ማንሳት'}],
       cols:[
        {id:'done', en:'Done', am:'ተሠርቷል', t:'yesno'},
        {id:'note', en:'Notes', am:'ማስታወሻ', t:'text'}
      ]}
    ]},
    { en:'3 · Quality check support', am:'3 · የጥራት ፍተሻ ድጋፍ', fields:[
      {id:'q_any', en:'Did you find any defect on finished work today (scratches, stains, chips)?', am:'ዛሬ በተጠናቀቀ ሥራ ላይ ያገኙት ጉድለት አለ? (ጭረት፣ እድፍ፣ ስብራት)', t:'yesno'},
      {id:'q_found_list', en:'Which defects?', am:'የትኞቹ ጉድለቶች?', t:'table', addEn:'Add a defect', addAm:'ጉድለት ጨምር',
        show:{f:'q_any', when:'yes'},
        cols:[
          {id:'code', en:'Job code', am:'የሥራ ኮድ', t:'text'},
          {id:'what', en:'Defect', am:'ጉድለት', t:'text'},
          {id:'where', en:'Where exactly', am:'በትክክል የት', t:'text'},
          {id:'told', en:'Told to Elyas', am:'ለኤልያስ ተነግሯል', t:'yesno'}
        ]},
      {id:'q_found', en:'How many defects did you find on finished work today?', am:'ዛሬ በተጠናቀቀ ሥራ ላይ ስንት ጉድለቶች አገኙ?', t:'num',
        auto:{rows:'q_found_list'}, sumEn:'defects found', sumAm:'ጉድለቶች ተገኝተዋል'},
      {id:'q_reported', en:'Did you report every defect to Elyas?', am:'ሁሉንም ጉድለቶች ለኤልያስ ነገሩ?', t:'yesno',
        auto:{all:'q_found_list.told'}},
      {id:'q_reported_why', en:'Which were not reported, and why?', am:'ያልተነገሩት የትኞቹ ናቸው? ለምን?', t:'area', show:{f:'q_reported', when:'no'}},
      {id:'q_missed', en:'Was a defect you missed found later by someone else?', am:'ያመለጠዎት ጉድለት በኋላ በሌላ ሰው ተገኘ?', t:'yesno'},
      {id:'q_missed_what', en:'What was missed, on which job, and who found it?', am:'ምን አመለጠ? በየትኛው ሥራ? ማን አገኘው?', t:'area', show:{f:'q_missed', when:'yes'}}
    ]},
    { en:'4 · Site cleanliness', am:'4 · የቦታ ጽዳት', fields:[
      {id:'c_clean', en:'Was every site left clean?', am:'ሁሉም ቦታዎች ንጹህ ሆነው ቀሩ?', t:'yesno'},
      {id:'c_clean_why', en:'Which site was not left clean, and why?', am:'ንጹህ ያልሆነው የትኛው ቦታ ነው? ለምን?', t:'area', show:{f:'c_clean', when:'no'}},
      {id:'c_pack', en:'Was all packaging and rubbish removed?', am:'ሁሉም ማሸጊያዎችና ቆሻሻዎች ተነሱ?', t:'yesno'},
      {id:'c_tools', en:'Were all tools collected and returned to the store?', am:'ሁሉም መሣሪያዎች ተሰብስበው ወደ መጋዘን ተመለሱ?', t:'yesno'},
      {id:'c_tools_what', en:'Which tools are not back, and where are they?', am:'ያልተመለሱት የትኞቹ መሣሪያዎች ናቸው? የት ናቸው?', t:'area', show:{f:'c_tools', when:'no'}},
      {id:'c_property', en:'Was the customer\'s property covered and protected?', am:'የደንበኛው ንብረት ተሸፍኖ ተጠብቋል?', t:'yesno'},
      {id:'c_property_why', en:'Where was it not protected, and was anything damaged?', am:'የት ነው ያልተጠበቀው? የተጎዳ ነገር አለ?', t:'area', show:{f:'c_property', when:'no'}},
      {id:'c_damage', en:'Was any material damaged in handling or transport today?', am:'ዛሬ በአያያዝ ወይም በማጓጓዝ የተጎዳ ቁሳቁስ አለ?', t:'yesno'},
      {id:'c_damage_what', en:'What was damaged, how, for which job, and was Elyas told?', am:'ምን ተጎዳ? እንዴት? ለየትኛው ሥራ? ለኤልያስ ተነግሯል?', t:'area', show:{f:'c_damage', when:'yes'}}
    ]},
    { en:'5 · WhatsApp support', am:'5 · የዋትስአፕ ድጋፍ', fields:[
      {id:'w_helped', en:'Did you help the assemblers post their Daily Progress Update?', am:'ገጣጣሚዎች የዕለት ሪፖርት እንዲልኩ ረዱ?', t:'yesno'},
      {id:'w_missing', en:'Did you tell Elyas about every missing update?', am:'ያልተላኩ ሪፖርቶችን ሁሉ ለኤልያስ ነገሩ?', t:'yesno', opt:1}
    ]},
    { en:'6 · Problems and solutions', am:'6 · ችግሮችና መፍትሔዎች', fields:[
      {id:'problem', en:'What was the biggest problem today — what caused it, and what is being done (who, by when)?', am:'የዛሬው ትልቁ ችግር ምን ነበር? ምክንያቱ ምንድን ነው? ምን እየተደረገ ነው (በማን፣ እስከ መቼ)?', t:'area', opt:1},
      {id:'reported', en:'Did you report it to Elyas?', am:'ለኤልያስ ነገሩ?', t:'yesno'},
      {id:'reported_why', en:'Why not?', am:'ለምን አልተነገረም?', t:'area', show:{f:'reported', when:'no'}},
      {id:'need_elyas', en:'Do you need a decision or help from Elyas?', am:'የኤልያስ ውሳኔ ወይም እገዛ ያስፈልግዎታል?', t:'yesno'},
      {id:'need_elyas_what', en:'What exactly, and by when?', am:'በትክክል ምን? እስከ መቼ?', t:'area', show:{f:'need_elyas', when:'yes'}}
    ]},
    { en:"7 · Tomorrow", am:'7 · ነገ', fields:[
      {id:'n_sites', en:'Which sites are you assigned to tomorrow?', am:'ነገ የተመደቡባቸው ቦታዎች የትኞቹ ናቸው?', t:'text', opt:1},
      {id:'n_support', en:'What do you need for tomorrow, and from whom?', am:'ለነገ ምን ያስፈልግዎታል? ከማን?', t:'text', opt:1}
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
    { en:'1 · Today’s work', am:'1 · የዛሬ ሥራ', fields:[
      {id:'w_done', en:'What did Rovestone get done today?', am:'ሮቭስቶን ዛሬ ምን ሠራ?', t:'area'},
      {id:'w_jobs', en:'Which jobs are open, and where does each stand?', am:'ክፍት የሆኑት ሥራዎች የትኞቹ ናቸው? እያንዳንዱ የት ደርሷል?', t:'table',
        addEn:'Add a job', addAm:'ሥራ ጨምር', opt:1, cols:[
          {id:'job', en:'Job or site', am:'ሥራ ወይም ቦታ', t:'text'},
          {id:'stage', en:'Where it stands', am:'ያለበት ደረጃ', t:'text'},
          {id:'next', en:'Next step', am:'ቀጣይ እርምጃ', t:'text'},
          {id:'due', en:'Due', am:'የሚያልቅበት', t:'text'}
        ]},
      {id:'w_people', en:'How many people worked for Rovestone today?', am:'ዛሬ ለሮቭስቶን ስንት ሰው ሠራ?', t:'num', opt:1}
    ]},
    { en:'2 · Orders with Klever', am:'2 · ከክሌቨር ጋር ያሉ ትዕዛዞች', fields:[
      {id:'k_new', en:'Did Rovestone send Klever a new order request today?', am:'ሮቭስቶን ዛሬ ለክሌቨር አዲስ የትዕዛዝ ጥያቄ ልኳል?', t:'yesno'},
      {id:'k_new_list', en:'Which orders?', am:'የትኞቹ ትዕዛዞች?', t:'table', addEn:'Add an order', addAm:'ትዕዛዝ ጨምር',
        show:{f:'k_new', when:'yes'}, cols:[
          {id:'job', en:'Job', am:'ሥራ', t:'text'},
          {id:'m2', en:'m²', am:'ሜ²', t:'num'},
          {id:'need', en:'Needed by', am:'የሚፈለግበት ቀን', t:'text'},
          {id:'site', en:'Delivery site', am:'የማስረከቢያ ቦታ', t:'text'},
          {id:'drawings', en:'Drawings ready, or a Klever designer needed?', am:'ንድፍ ዝግጁ ነው ወይስ የክሌቨር ዲዛይነር ያስፈልጋል?', t:'text'}
        ]},
      {id:'k_waiting', en:'Is Rovestone waiting on anything from Klever? What, and since when?', am:'ሮቭስቶን ከክሌቨር የሚጠብቀው ነገር አለ? ምን? ከመቼ ጀምሮ?', t:'area', opt:1},
      {id:'k_quality', en:'Was there any problem with work Klever delivered?', am:'ክሌቨር ባስረከበው ሥራ ላይ ችግር ነበር?', t:'yesno'},
      {id:'k_quality_what', en:'Which job, what is wrong, and has Klever been told?', am:'የትኛው ሥራ? ምን ችግር አለ? ለክሌቨር ተነግሯል?', t:'area', show:{f:'k_quality', when:'yes'}}
    ]},
    { en:'3 · Money', am:'3 · ገንዘብ', fields:[
      {id:'m_in', en:'How much money came in to Rovestone today?', am:'ዛሬ ወደ ሮቭስቶን ስንት ብር ገባ?', t:'money'},
      {id:'m_out', en:'How much did Rovestone pay out today?', am:'ሮቭስቶን ዛሬ ስንት ብር ከፈለ?', t:'money'},
      {id:'m_klever', en:'How much of it was paid to Klever?', am:'ከዚህ ውስጥ ለክሌቨር የተከፈለው ስንት ነው?', t:'money', opt:1}
    ]},
    { en:'4 · Problems and decisions', am:'4 · ችግሮችና ውሳኔዎች', fields:[
      {id:'p_problem', en:'What went wrong today, and what is being done about it?', am:'ዛሬ ምን ችግር ተፈጠረ? ምን እየተደረገ ነው?', t:'area', opt:1},
      {id:'p_chair', en:'Do you need a decision from the Chairman?', am:'የሊቀመንበሩ ውሳኔ ያስፈልግዎታል?', t:'yesno'},
      {id:'p_chair_what', en:'What exactly should he decide, and by when?', am:'በትክክል ምን እንዲወስኑ ይፈልጋሉ? እስከ መቼ?', t:'area', show:{f:'p_chair', when:'yes'}}
    ]},
    { en:'5 · Tomorrow', am:'5 · ነገ', fields:[
      {id:'t_plan', en:'What is the plan for tomorrow?', am:'የነገው ዕቅድ ምንድን ነው?', t:'area'}
    ]}
  ]
},
{
  id:'frewoyni-weekly', person:'frewoyni', cadence:'weekly', dueTime:'17:00', dueDay:6, noFine:1,
  en:'Rovestone Weekly Summary', am:'የሮቭስቶን ሳምንታዊ ማጠቃለያ',
  toEn:'Chairman', toAm:'ሊቀመንበር',
  dueEn:'Saturday 5:00 PM', dueAm:'ቅዳሜ ከቀኑ 11፡00 (5:00 PM)',
  penEn:'No fines — reporting only', penAm:'ቅጣት የለም — ሪፖርት ብቻ',
  derived:1,
  sections:[
    { en:'1 · The week’s work', am:'1 · የሳምንቱ ሥራ', fields:[
      {id:'w_summary', en:'What did Rovestone achieve this week?', am:'ሮቭስቶን በዚህ ሳምንት ምን አሳካ?', t:'area'},
      {id:'w_done', en:'How many jobs were finished this week?', am:'በዚህ ሳምንት ስንት ሥራ ተጠናቀቀ?', t:'num'},
      {id:'w_open', en:'How many jobs are still open?', am:'ስንት ሥራ አሁንም ክፍት ነው?', t:'num'},
      {id:'w_behind', en:'How many of them are behind schedule?', am:'ከእነዚህ ስንቱ ከጊዜው ወደኋላ ቀርቷል?', t:'num'},
      {id:'w_behind_why', en:'Which, by how much, and why?', am:'የትኞቹ? በምን ያህል? ለምን?', t:'area', show:{f:'w_behind', when:'pos'}}
    ]},
    { en:'2 · Klever', am:'2 · ክሌቨር', fields:[
      {id:'o_sent', en:'How many order requests did Rovestone send Klever this week?', am:'ሮቭስቶን በዚህ ሳምንት ለክሌቨር ስንት የትዕዛዝ ጥያቄ ላከ?', t:'num'},
      {id:'o_got', en:'How many Klever deliveries did Rovestone receive this week?', am:'ሮቭስቶን በዚህ ሳምንት ከክሌቨር ስንት ጊዜ ዕቃ ተቀበለ?', t:'num'},
      {id:'o_issues', en:'Any delay or quality problem with Klever’s work? Which job, and what?', am:'በክሌቨር ሥራ መዘግየት ወይም የጥራት ችግር ነበር? የትኛው ሥራ? ምን?', t:'area', opt:1},
      {id:'o_owed', en:'How much does Rovestone owe Klever now?', am:'ሮቭስቶን አሁን ለክሌቨር ስንት ብር ዕዳ አለበት?', t:'money', opt:1}
    ]},
    { en:'3 · Money', am:'3 · ገንዘብ', fields:[
      {id:'f_in', en:'How much came in to Rovestone this week?', am:'በዚህ ሳምንት ወደ ሮቭስቶን ስንት ብር ገባ?', t:'money',
        auto:{week:'m_in'}},
      {id:'f_out', en:'How much did Rovestone pay out this week?', am:'ሮቭስቶን በዚህ ሳምንት ስንት ብር ከፈለ?', t:'money', auto:{week:'m_out'}},
      {id:'f_cash', en:'How much cash and bank does Rovestone hold at the end of the week?', am:'በሳምንቱ መጨረሻ ሮቭስቶን በጥሬ ገንዘብና በባንክ ስንት ብር አለው?', t:'money', opt:1}
    ]},
    { en:'4 · Next week', am:'4 · የሚቀጥለው ሳምንት', fields:[
      {id:'n_plan', en:'What is the plan for next week?', am:'የሚቀጥለው ሳምንት ዕቅድ ምንድን ነው?', t:'area'},
      {id:'n_need', en:'What do you need from Klever or the Chairman?', am:'ከክሌቨር ወይም ከሊቀመንበሩ ምን ያስፈልግዎታል?', t:'area', opt:1},
      {id:'n_chair', en:'Do you need a decision from the Chairman?', am:'የሊቀመንበሩ ውሳኔ ያስፈልግዎታል?', t:'yesno'},
      {id:'n_chair_what', en:'What exactly should he decide, and by when?', am:'በትክክል ምን እንዲወስኑ ይፈልጋሉ? እስከ መቼ?', t:'area', show:{f:'n_chair', when:'yes'}}
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
        {id:'w_done', en:'What did ' + co + ' get done today?', am: coAm + ' ዛሬ ምን ሠራ?', t:'area'},
        {id:'w_jobs', en:'Which jobs are open, and where does each stand?', am:'ክፍት የሆኑት ሥራዎች የትኞቹ ናቸው? እያንዳንዱ የት ደርሷል?', t:'table',
          addEn:'Add a job', addAm:'ሥራ ጨምር', opt:1, cols:[
            {id:'job', en:'Job or site', am:'ሥራ ወይም ቦታ', t:'text'},
            {id:'stage', en:'Where it stands', am:'ያለበት ደረጃ', t:'text'},
            {id:'next', en:'Next step', am:'ቀጣይ እርምጃ', t:'text'},
            {id:'due', en:'Due', am:'የሚያልቅበት', t:'text'}
          ]},
        {id:'w_people', en:'How many people worked for ' + co + ' today?', am:'ዛሬ ለ' + coAm + ' ስንት ሰው ሠራ?', t:'num', opt:1}
      ]},
      { en:'2 · With Klever', am:'2 · ከክሌቨር ጋር', fields:[
        {id:'k_new', en:'Did anything pass between ' + co + ' and Klever today — an order, a delivery, materials or a payment?',
         am:'ዛሬ በ' + coAm + ' እና በክሌቨር መካከል ትዕዛዝ፣ ጭነት፣ ዕቃ ወይም ክፍያ ነበር?', t:'yesno'},
        {id:'k_new_list', en:'What passed?', am:'ምን ነበር?', t:'table', addEn:'Add one', addAm:'ጨምር',
          show:{f:'k_new', when:'yes'}, cols:[
            {id:'what', en:'Order, delivery, materials or payment', am:'ትዕዛዝ፣ ጭነት፣ ዕቃ ወይም ክፍያ', t:'text'},
            {id:'job', en:'Job or item', am:'ሥራ ወይም ዕቃ', t:'text'},
            {id:'qty', en:'How much — m², pieces or Birr', am:'መጠን — ሜ²፣ ብዛት ወይም ብር', t:'text'},
            {id:'when', en:'Needed or due by', am:'የሚፈለግበት ቀን', t:'text'}
          ]},
        {id:'k_waiting', en:'Is ' + co + ' waiting on anything from Klever? What, and since when?',
         am: coAm + ' ከክሌቨር የሚጠብቀው ነገር አለ? ምን? ከመቼ ጀምሮ?', t:'area', opt:1},
        {id:'k_quality', en:'Was there any problem between ' + co + ' and Klever today — late, wrong, or poor quality?',
         am:'ዛሬ በ' + coAm + ' እና በክሌቨር መካከል ችግር ነበር — መዘግየት፣ ስሕተት ወይም የጥራት ችግር?', t:'yesno'},
        {id:'k_quality_what', en:'What, on which job, and has the other side been told?', am:'ምን? በየትኛው ሥራ? ለሌላው ወገን ተነግሯል?', t:'area', show:{f:'k_quality', when:'yes'}}
      ]},
      { en:'3 · Money', am:'3 · ገንዘብ', fields:[
        {id:'m_in', en:'How much money came in to ' + co + ' today?', am:'ዛሬ ወደ ' + coAm + ' ስንት ብር ገባ?', t:'money'},
        {id:'m_out', en:'How much did ' + co + ' pay out today?', am: coAm + ' ዛሬ ስንት ብር ከፈለ?', t:'money'},
        {id:'m_klever', en:'How much of it was paid to or received from Klever?', am:'ከዚህ ውስጥ ለክሌቨር የተከፈለው ወይም ከክሌቨር የተቀበለው ስንት ነው?', t:'money', opt:1}
      ]},
      { en:'4 · Problems and decisions', am:'4 · ችግሮችና ውሳኔዎች', fields:[
        {id:'p_problem', en:'What went wrong today, and what is being done about it?', am:'ዛሬ ምን ችግር ተፈጠረ? ምን እየተደረገ ነው?', t:'area', opt:1},
        {id:'p_chair', en:'Do you need a decision from the Chairman?', am:'የሊቀመንበሩ ውሳኔ ያስፈልግዎታል?', t:'yesno'},
        {id:'p_chair_what', en:'What exactly should he decide, and by when?', am:'በትክክል ምን እንዲወስኑ ይፈልጋሉ? እስከ መቼ?', t:'area', show:{f:'p_chair', when:'yes'}}
      ]},
      { en:'5 · Tomorrow', am:'5 · ነገ', fields:[
        {id:'t_plan', en:'What is the plan for tomorrow?', am:'የነገው ዕቅድ ምንድን ነው?', t:'area'}
      ]}
    ]
  }, no);
  var weekly = Object.assign({
    id: pid + '-weekly', person: pid, cadence:'weekly', dueTime:'17:00', dueDay:6,
    en: co + ' Weekly Summary', am: 'የ' + coAm + ' ሳምንታዊ ማጠቃለያ',
    dueEn:'Saturday 5:00 PM', dueAm:'ቅዳሜ ከቀኑ 11፡00 (5:00 PM)',
    sections:[
      { en:'1 · The week’s work', am:'1 · የሳምንቱ ሥራ', fields:[
        {id:'w_summary', en:'What did ' + co + ' achieve this week?', am: coAm + ' በዚህ ሳምንት ምን አሳካ?', t:'area'},
        {id:'w_done', en:'How many jobs were finished this week?', am:'በዚህ ሳምንት ስንት ሥራ ተጠናቀቀ?', t:'num'},
        {id:'w_open', en:'How many jobs are still open?', am:'ስንት ሥራ አሁንም ክፍት ነው?', t:'num'},
        {id:'w_behind', en:'How many of them are behind schedule?', am:'ከእነዚህ ስንቱ ከጊዜው ወደኋላ ቀርቷል?', t:'num'},
        {id:'w_behind_why', en:'Which, by how much, and why?', am:'የትኞቹ? በምን ያህል? ለምን?', t:'area', show:{f:'w_behind', when:'pos'}}
      ]},
      { en:'2 · Klever', am:'2 · ክሌቨር', fields:[
        {id:'o_sent', en:'How many orders or deliveries passed between ' + co + ' and Klever this week?',
         am:'በዚህ ሳምንት በ' + coAm + ' እና በክሌቨር መካከል ስንት ትዕዛዝ ወይም ፃነት ተካሄደ?', t:'num'},
        {id:'o_issues', en:'Any delay or quality problem between ' + co + ' and Klever? Which job, and what?',
         am:'በ' + coAm + ' እና በክሌቨር መካከል መዘግየት ወይም የጥራት ችግር ነበር? የትኛው ሥራ? ምን?', t:'area', opt:1},
        {id:'o_owed', en:'What is owed between ' + co + ' and Klever now — how much, and who owes whom?',
         am:'አሁን በ' + coAm + ' እና በክሌቨር መካከል ያለው ዕዳ ስንት ነው? ማን ለማን?', t:'area', opt:1}
      ]},
      { en:'3 · Money', am:'3 · ገንዘብ', fields:[
        {id:'f_in', en:'How much came in to ' + co + ' this week?', am:'በዚህ ሳምንት ወደ ' + coAm + ' ስንት ብር ገባ?', t:'money'},
        {id:'f_out', en:'How much did ' + co + ' pay out this week?', am: coAm + ' በዚህ ሳምንት ስንት ብር ከፈለ?', t:'money'},
        {id:'f_cash', en:'How much cash and bank does ' + co + ' hold at the end of the week?', am:'በሳምንቱ መጨረሻ ' + coAm + ' በጥሬ ገንዘብና በባንክ ስንት ብር አለው?', t:'money', opt:1}
      ]},
      { en:'4 · Next week', am:'4 · የሚቀጥለው ሳምንት', fields:[
        {id:'n_plan', en:'What is the plan for next week?', am:'የሚቀጥለው ሳምንት ዕቅድ ምንድን ነው?', t:'area'},
        {id:'n_need', en:'What do you need from Klever or the Chairman?', am:'ከክሌቨር ወይም ከሊቀመንበሩ ምን ያስፈልግዎታል?', t:'area', opt:1},
        {id:'n_chair', en:'Do you need a decision from the Chairman?', am:'የሊቀመንበሩ ውሳኔ ያስፈልግዎታል?', t:'yesno'},
        {id:'n_chair_what', en:'What exactly should he decide, and by when?', am:'በትክክል ምን እንዲወስኑ ይፈልጋሉ? እስከ መቼ?', t:'area', show:{f:'n_chair', when:'yes'}}
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
    /* Six numbers stood above this list — the total and the five sources —
       and the list did not say where a lead came from, so the breakdown
       could not be checked against it. The source is a column now, the six
       numbers are counted from the rows, and whether the lead was called
       inside the day is in the row too (the Chairman, 9 Oct 2026). */
    { en:'1 · Leads today', am:'1 · የዛሬ አዲስ ደንበኞች', fields:[
      {id:'l_any', en:'Did any new lead come in today?', am:'ዛሬ አዲስ ደንበኛ መጥቷል?', t:'yesno'},
      {id:'l_list', en:'Each new lead today, as logged in the system', am:'ዛሬ የመጣ እያንዳንዱ አዲስ ደንበኛ፣ በሲስተሙ እንደተመዘገበው', t:'table', addEn:'Add a lead', addAm:'ደንበኛ ጨምር',
        show:{f:'l_any', when:'yes'},
        cols:[
          {id:'cust', en:'Customer', am:'ደንበኛ', t:'text'},
          {id:'lc', en:'Customer code: 4-digit lead no., or KK code once paid', am:'የደንበኛ ኮድ፦ ባለ 4 አሃዝ ቁጥር፣ ከከፈሉ በኋላ KK ኮድ', t:'text'},
          {id:'phone', en:'Phone', am:'ስልክ', t:'text'},
          {id:'src', en:'Where from', am:'ከየት', t:'choice', opts:[
            {v:'social', en:'Social media',             am:'ሶሻል ሚዲያ'},
            {v:'show',   en:'Walked into the showroom', am:'ሾውሩም የመጣ'},
            {v:'ref',    en:'Referred by someone',      am:'በሪፈራል'},
            {v:'agent',  en:'Through an agent',         am:'በኤጀንት'},
            {v:'other',  en:'Anywhere else',            am:'ከሌላ ቦታ'}
          ]},
          {id:'called', en:'Called within 24 hours?', am:'በ24 ሰዓት ውስጥ ተደውሏል?', t:'yesno'},
          {id:'next', en:'Next step', am:'ቀጣይ እርምጃ', t:'text'}
        ]},
      {id:'l_total', en:'How many new leads did you receive today?', am:'ዛሬ ስንት አዲስ ደንበኞች መጡ?', t:'num',
        auto:{rows:'l_list'}, sumEn:'new leads', sumAm:'አዲስ ደንበኞች'},
      {id:'l_social', en:'From social media', am:'ከሶሻል ሚዲያ', t:'num', i:1,
        auto:{rows:'l_list', when:{col:'src', is:'social'}}, sumEn:'from social media', sumAm:'ከሶሻል ሚዲያ'},
      {id:'l_show', en:'Walked into the showroom', am:'ሾውሩም የመጡ', t:'num', i:1,
        auto:{rows:'l_list', when:{col:'src', is:'show'}}, sumEn:'walked in', sumAm:'ሾውሩም የመጡ'},
      {id:'l_ref', en:'Referred by someone', am:'በሪፈራል', t:'num', i:1,
        auto:{rows:'l_list', when:{col:'src', is:'ref'}}, sumEn:'referred', sumAm:'በሪፈራል'},
      {id:'l_agent', en:'Through an agent', am:'በኤጀንት', t:'num', i:1,
        auto:{rows:'l_list', when:{col:'src', is:'agent'}}, sumEn:'through an agent', sumAm:'በኤጀንት'},
      {id:'l_other', en:'Anywhere else', am:'ከሌላ ቦታ', t:'num', i:1,
        auto:{rows:'l_list', when:{col:'src', is:'other'}}, sumEn:'from elsewhere', sumAm:'ከሌላ ቦታ'}
    ]},
    { en:'2 · Lead response', am:'2 · የምላሽ ፍጥነት', fields:[
      {id:'r_1hr', en:'New leads today: how many did you call within 24 hours? (called within 24 hours / all new leads today)', am:'ዛሬ አዲስ የመጡ ደንበኞች፦ ስንቱን በ24 ሰዓት ውስጥ ደወሉላቸው? (በ24 ሰዓት ውስጥ የተደወለላቸው / ዛሬ የመጡ አዲስ ደንበኞች በሙሉ)', t:'ratio', whole:'l_total',
        auto:{a:{rows:'l_list', when:{col:'called', is:'yes'}}, b:{rows:'l_list'}},
        tgt:{op:'gte', v:100, en:'Stage 1 of your commission — –200 Birr per missed lead',
             am:'የኮሚሽንዎ 1ኛ ደረጃ — ላመለጠ እያንዳንዱ –200 ብር'}},
      {id:'r_1hr_why', en:'Which leads were not called within 24 hours, and why?', am:'በ24 ሰዓት ውስጥ ያልተደወለላቸው እነማን ናቸው? ለምን?', t:'area', show:{f:'r_1hr', when:'short'}}
    ]},
    { en:'3 · Quotations', am:'3 · ፕሮፎርማ', fields:[
      {id:'q_any', en:'Did you present any quotation today?', am:'ዛሬ ፕሮፎርማ አቀረቡ?', t:'yesno'},
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
      {id:'q_margin_why', en:'Which quotations went below 6,000 Birr/m², and who approved them?', am:'ከ6,000 ብር በካሬ ሜትር በታች የሆኑት የትኞቹ ፕሮፎርማዎች ናቸው? ማን አጸደቃቸው?', t:'area', show:{f:'q_margin', when:'miss'}},
      /* 15 days, not 7 (the Chairman, 8 Oct 2026); the letters still say 7 */
      {id:'q_expiry', en:'Did every quotation state the 15-day expiry?', am:'ሁሉም ፕሮፎርማዎች የ15 ቀን ገደብ ተጽፎባቸዋል?', t:'yesno'},
      {id:'q_expiry_why', en:'Which ones did not, and have they been corrected?', am:'ያልተጻፈባቸው የትኞቹ ናቸው? ተስተካክለዋል?', t:'area', show:{f:'q_expiry', when:'no'}}
    ]},
    { en:'4 · Contracts', am:'4 · ውሎች', fields:[
      {id:'c_any', en:'Did you sign any contract today?', am:'ዛሬ ውል ተፈርሟል?', t:'yesno'},
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
      {id:'c_told', en:'Was Selam told, so the deposit can be confirmed in the bank?', am:'ሰላም ገንዘቡን በባንክ እንድታረጋግጥ ተነግሯታል?', t:'yesno', show:{f:'c_adv', when:'pos'}},
      {id:'c_banked', en:'Did all of it go to the bank the same day?', am:'ሁሉም በዕለቱ ባንክ ገብቷል?', t:'yesno'},
      {id:'c_banked_why', en:'Why not, where is the money now, and when will it be banked?', am:'ለምን አልገባም? ገንዘቡ አሁን የት ነው? መቼ ባንክ ይገባል?', t:'area', show:{f:'c_banked', when:'no'}}
    ]},
    { en:'5 · Cash collection', am:'5 · የገንዘብ ስብሰባ', fields:[
      {id:'k_any', en:'Did you collect money from any customer today?', am:'ዛሬ ከደንበኛ ገንዘብ ተቀብለዋል?', t:'yesno'},
      {id:'k_list', en:'From whom?', am:'ከማን ከማን?', t:'table', addEn:'Add a payment', addAm:'ክፍያ ጨምር',
        show:{f:'k_any', when:'yes'},
        cols:[
          {id:'cust', en:'Customer', am:'ደንበኛ', t:'text'},
          {id:'lc', en:'Customer code: 4-digit lead no., or KK code once paid', am:'የደንበኛ ኮድ፦ ባለ 4 አሃዝ ቁጥር፣ ከከፈሉ በኋላ KK ኮድ', t:'text'},
          {id:'amount', en:'Amount', am:'መጠን', t:'money'},
          {id:'kind', en:'For', am:'የምን', t:'choice', opts:[
            {v:'advance', en:'Advance', am:'ቅድመ ክፍያ'},
            {v:'final', en:'Final payment', am:'የመጨረሻ ክፍያ'},
            {v:'other', en:'Other', am:'ሌላ'}]}
        ]},
      {id:'k_today', en:'How much did you collect from customers today?', am:'ዛሬ ከደንበኞች ስንት ብር ተሰበሰበ?', t:'money',
        auto:{sum:'k_list.amount'}, sumEn:'collected', sumAm:'ተሰብስቧል'},
      /* this one stays typed on purpose: it is the figure the bank confirms,
         and checking it against the bank is the point of asking */
      {id:'k_week', en:'How much have you collected this week so far, bank-confirmed?', am:'በዚህ ሳምንት እስካሁን በባንክ የተረጋገጠ ስንት ብር ተሰበሰበ?', t:'money',
        tgt:{op:'gte', v:2000000, en:'Your weekly target is 2,000,000 Birr collected',
             am:'የሳምንቱ ዒላማዎ 2,000,000 ብር የተሰበሰበ ገንዘብ ነው'}},
      {id:'k_week_gap', en:'Which customers will close the gap to 2,000,000 Birr before the week ends, and for how much?', am:'ሳምንቱ ከማለቁ በፊት እስከ 2,000,000 ብር ያለውን ክፍተት የሚሞሉት የትኞቹ ደንበኞች ናቸው? በስንት ብር?', t:'area', show:{f:'k_week', when:'miss'}}
    ]},
    { en:'6 · WhatsApp compliance', am:'6 · ዋትስአፕ አጠቃቀም', fields:[
      {id:'w_groups', en:'How many customer groups are you active in?', am:'በስንት የደንበኛ ግሩፖች ውስጥ ንቁ ነዎት?', t:'num'},
      {id:'w_stage', en:'How many required stage messages did you post today? (posted / required)', am:'ዛሬ ከሚገባው የደረጃ መልዕክት ስንቱ ተላከ? (የተላከ / የሚገባው)', t:'ratio',
        tgt:{op:'gte', v:100, en:'A missed stage message loses that stage’s commission',
             am:'ያልተላከ የደረጃ መልዕክት የዚያን ደረጃ ኮሚሽን ያሳጣል'}},
      {id:'w_stage_why', en:'Which customers missed a stage message, which stage, and why?', am:'የደረጃ መልዕክት ያልደረሳቸው የትኞቹ ደንበኞች ናቸው? የትኛው ደረጃ? ለምን?', t:'area', show:{f:'w_stage', when:'short'}},
      {id:'w_unans', en:'How many messages waited more than 2 hours for your answer?', am:'ከ2 ሰዓት በላይ ምላሽ ሳያገኙ የቆዩ መልዕክቶች ስንት ናቸው?', t:'num',
        tgt:{op:'lte', v:0, en:'–200 Birr each', am:'እያንዳንዱ –200 ብር'}},
      {id:'w_unans_why', en:'Which customers, why, and have they been answered now?', am:'የየትኞቹ ደንበኞች ናቸው? ለምን? አሁን ምላሽ አግኝተዋል?', t:'area', show:{f:'w_unans', when:'pos'}},
      {id:'w_comp', en:'How many customers complained about communication?', am:'ስንት ደንበኞች በመግባቢያ ላይ ቅሬታ አቀረቡ?', t:'num',
        tgt:{op:'lte', v:0, en:'–1,000 Birr each', am:'እያንዳንዱ –1,000 ብር'}},
      {id:'w_comp_what', en:'Who complained, about what, and what was done?', am:'ቅሬታ ያቀረበው ማን ነው? ስለምን? ምን እርምጃ ተወሰደ?', t:'area', show:{f:'w_comp', when:'pos'}}
    ]},
    { en:'7 · After-sales', am:'7 · ከሽያጭ በኋላ', fields:[
      {id:'fu_any', en:'Was any follow-up call due today?', am:'ዛሬ መደረግ የነበረበት የክትትል ጥሪ አለ?', t:'yesno'},
      {id:'fu_list', en:'Which customers were called?', am:'የትኞቹ ደንበኞች ተደወለላቸው?', t:'table', addEn:'Add a customer', addAm:'ደንበኛ ጨምር',
        show:{f:'fu_any', when:'yes'}, cols:[
          {id:'cust', en:'Customer', am:'ደንበኛ', t:'text'},
          {id:'code', en:'Job code', am:'የሥራ ኮድ', t:'text'},
          {id:'happy', en:'Happy with the job', am:'በሥራው ረክተዋል', t:'yesno'},
          {id:'score', en:'Score 0–10: how likely are they to recommend us?', am:'ውጤት 0–10፦ እኛን ለሌሎች የመምከር ዕድላቸው?', t:'num'}
        ]},
      /* the rows are the calls made; how many were due is the only box left
         to fill, and the form counts the other from the list */
      {id:'fu_calls', en:'Of customers installed 48 hours ago, how many got their follow-up call? (called / due)', am:'ተከላቸው ከ48 ሰዓት በፊት ከተጠናቀቀ ደንበኞች ስንቱ የክትትል ጥሪ ተደረገላቸው? (የተደወለላቸው / መደወል የነበረባቸው)', t:'ratio',
        show:{f:'fu_any', when:'yes'}, auto:{a:{rows:'fu_list'}}},
      {id:'fu_calls_why', en:'Who was not called, and when will they be?', am:'ያልተደወለላቸው እነማን ናቸው? መቼ ይደወልላቸዋል?', t:'area', show:{f:'fu_calls', when:'short'}},
      {id:'ref_logged', en:'How many referrals did you ask for and log today?', am:'ዛሬ ስንት ሪፈራል ተጠይቆ ተመዘገበ?', t:'num'}
    ]},
    { en:'8 · Problems and solutions', am:'8 · ችግሮችና መፍትሔዎች', fields:[
      {id:'problem', en:'What was the biggest problem today — what caused it, and what is being done (who, by when)?', am:'የዛሬው ትልቁ ችግር ምን ነበር? ምክንያቱ ምንድን ነው? ምን እየተደረገ ነው (በማን፣ እስከ መቼ)?', t:'area', opt:1},
      {id:'need_help', en:'What do you need from design, production or Selam, and from whom?', am:'ከዲዛይን፣ ከምርት ወይም ከሰላም ምን ያስፈልግዎታል? ከማን?', t:'area', opt:1},
      {id:'need_lead', en:'Do you need a decision from Ephrata?', am:'የኤፍራታ ውሳኔ ያስፈልግዎታል?', t:'yesno'},
      {id:'need_lead_what', en:'What exactly should she decide (a discount beyond your window, a price change), and by when?', am:'በትክክል ምን እንዲወስኑ ይፈልጋሉ? (ከፈቃድዎ በላይ ቅናሽ፣ የዋጋ ለውጥ) እስከ መቼ?', t:'area', show:{f:'need_lead', when:'yes'}}
    ]},
    { en:"9 · Tomorrow's top 3", am:'9 · የነገ ሦስት ቅድሚያዎች', fields:[
      {id:'p1', en:'Priority 1', am:'1ኛ ሥራ', t:'text'},
      {id:'p2', en:'Priority 2', am:'2ኛ ሥራ', t:'text'},
      {id:'p3', en:'Priority 3', am:'3ኛ ሥራ', t:'text'}
    ]}
  ]
};

const SALES_WEEKLY = {
  id:'sales-weekly', cadence:'weekly', dueTime:'15:30', dueDay:6,
  en:'Weekly Sales Summary', am:'ሳምንታዊ የሽያጭ ማጠቃለያ',
  toEn:'Ephrata', toAm:'ኤፍራታ',
  dueEn:'Saturday 3:30 PM — Ephrata needs it for her 4:00 PM report',
  dueAm:'ቅዳሜ ከቀኑ 9፡30 (3:30 PM)',
  penEn:'Late or not sent –500 Birr', penAm:'ዘግይቶ ወይም ካልቀረበ –500 ብር',
  sections:[
    /* The week's contracts were typed out here a second time, every one of
       them already a row in the daily report that signed it (the Chairman,
       9 Oct 2026). The list gathers itself from those reports, and the
       figures come off the gathered rows. */
    { en:'1 · Sales performance', am:'1 · ሽያጭ እንዴት ሄደ', fields:[
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
      {id:'s_month', en:'How many external contracts have you signed this month so far?', am:'በዚህ ወር እስካሁን ስንት የውጭ ውል ተፈረመ?', t:'num'},
      {id:'s_coll', en:'How much did you collect from external customers this week, bank-confirmed?', am:'በዚህ ሳምንት ከውጭ ደንበኞች በባንክ የተረጋገጠ ስንት ብር ተሰበሰበ?', t:'money',
        tgt:{op:'gte', v:2000000, en:'Target 2,000,000 Birr — below 1,000,000 is a failed week',
             am:'ዒላማ 2,000,000 ብር — ከ1,000,000 በታች የወደቀ ሳምንት ነው'}},
      {id:'s_coll_why', en:'Why is the week below 2,000,000 Birr? Was the cause outside your control (a holiday, a customer cancellation)?', am:'ሳምንቱ ለምን ከ2,000,000 ብር በታች ሆነ? ምክንያቱ ከቁጥጥርዎ ውጭ ነበር? (በዓል፣ የደንበኛ መሰረዝ)', t:'area', show:{f:'s_coll', when:'miss'}}
    ]},
    { en:'2 · Collections day by day', am:'2 · በየቀኑ የተሰበሰበ ገንዘብ', fields:[
      {id:'days', en:'How much was bank-confirmed on each day?', am:'በየቀኑ በባንክ የተረጋገጠ ስንት ብር ነው?', t:'grid',
       rows:[{en:'Monday', am:'ሰኞ'},{en:'Tuesday', am:'ማክሰኞ'},{en:'Wednesday', am:'ረቡዕ'},
             {en:'Thursday', am:'ሐሙስ'},{en:'Friday', am:'ዓርብ'},{en:'Saturday', am:'ቅዳሜ'}],
       cols:[{id:'amt', en:'Collected', am:'የተሰበሰበ', t:'money'}]}
    ]},
    { en:'3 · Lead performance', am:'3 · ደንበኛ አያያዝ እንዴት ሄደ', fields:[
      {id:'lp_total', en:'How many new leads did you receive this week?', am:'በዚህ ሳምንት ስንት አዲስ ደንበኞች መጡ?', t:'num',
        auto:{week:'l_total'}},
      {id:'lp_1hr', en:'New leads this week: how many were called within 24 hours? (called within 24 hours / all new leads this week)', am:'በዚህ ሳምንት አዲስ የመጡ ደንበኞች፦ ስንቱ በ24 ሰዓት ውስጥ ተደወለላቸው? (በ24 ሰዓት ውስጥ የተደወለላቸው / በዚህ ሳምንት የመጡ አዲስ ደንበኞች በሙሉ)', t:'ratio', whole:'lp_total',
        auto:{a:{week:'r_1hr__a'}, b:{week:'r_1hr__b'}}},
      {id:'lp_1hr_why', en:'Which leads were missed, and why?', am:'ያመለጡት ደንበኞች እነማን ናቸው? ለምን?', t:'area', show:{f:'lp_1hr', when:'short'}},
      {id:'lp_quotes', en:'How many quotations did you present this week?', am:'በዚህ ሳምንት ስንት ፕሮፎርማ ቀረበ?', t:'num',
        auto:{week:'q_issued'}},
      {id:'lp_conv', en:'What share of your leads became contracts?', am:'ከደንበኞችዎ ስንት በመቶው ውል ፈረሙ?', t:'pct',
        auto:{pct:['s_contracts', 'lp_total']}},
      {id:'lp_follow', en:'What share of your leads did you follow up?', am:'ከደንበኞችዎ ስንት በመቶው ክትትል ተደረገላቸው?', t:'pct',
        tgt:{op:'gte', v:50, en:'Below 50% is –300 Birr', am:'ከ50% በታች –300 ብር'}},
      {id:'lp_follow_why', en:'Why is follow-up below 50%, and which leads will be followed up next week?', am:'ክትትሉ ለምን ከ50% በታች ሆነ? በሚቀጥለው ሳምንት የትኞቹ ደንበኞች ክትትል ይደረግላቸዋል?', t:'area', show:{f:'lp_follow', when:'miss'}}
    ]},
    { en:'4 · Margin performance', am:'4 · ትርፍ እንዴት ሄደ', fields:[
      {id:'mg_avg', en:'What was your average margin per m² this week?', am:'በዚህ ሳምንት አማካይ ትርፍዎ በካሬ ሜትር ስንት ነው?', t:'money',
        auto:{div:[{sum:'s_contracts_list.margin'}, {rows:'s_contracts_list', when:{col:'margin'}}]},
        tgt:{op:'gte', v:6000, en:'Margin floor 6,000 Birr/m²', am:'ዝቅተኛው ትርፍ በካሬ ሜትር 6,000 ብር'}},
      {id:'mg_below', en:'How many contracts did you sign below the margin floor?', am:'ከዝቅተኛው ትርፍ በታች ስንት ውል ተፈረመ?', t:'num',
        auto:{rows:'s_contracts_list', when:{col:'margin', lt:6000}},
        tgt:{op:'lte', v:0, en:'–1,000 Birr each without approval', am:'ያለፈቃድ እያንዳንዱ –1,000 ብር'}},
      {id:'mg_below_list', en:'Which of them, and who approved it', am:'የትኞቹ ናቸው? ማን አጸደቀው?', t:'table', addEn:'Add a contract', addAm:'ውል ጨምር',
        show:{f:'mg_below', when:'pos'},
        cols:[
          {id:'cust', en:'Customer', am:'ደንበኛ', t:'text'},
          {id:'lc', en:'Customer code: 4-digit lead no., or KK code once paid', am:'የደንበኛ ኮድ፦ ባለ 4 አሃዝ ቁጥር፣ ከከፈሉ በኋላ KK ኮድ', t:'text'},
          {id:'margin', en:'Margin per m²', am:'ትርፍ በካሬ ሜትር', t:'money'},
          {id:'by', en:'Approved by', am:'ያጸደቀው', t:'text'}
        ]}
    ]},
    { en:'5 · Commission', am:'5 · ኮሚሽን', fields:[
      {id:'cm_earned', en:'How much commission did you earn this week?', am:'በዚህ ሳምንት ስንት ብር ኮሚሽን አገኙ?', t:'money'},
      {id:'cm_missed_any', en:'Did you miss any commission stage this week?', am:'በዚህ ሳምንት ያመለጠዎት የኮሚሽን ደረጃ አለ?', t:'yesno'},
      {id:'cm_missed_list', en:'Which stages, on which jobs, and why?', am:'የትኞቹ ደረጃዎች? በየትኞቹ ሥራዎች? ለምን?', t:'table', addEn:'Add a missed stage', addAm:'ያመለጠ ደረጃ ጨምር',
        show:{f:'cm_missed_any', when:'yes'},
        cols:[
          {id:'cust', en:'Customer', am:'ደንበኛ', t:'text'},
          {id:'lc', en:'Customer code: 4-digit lead no., or KK code once paid', am:'የደንበኛ ኮድ፦ ባለ 4 አሃዝ ቁጥር፣ ከከፈሉ በኋላ KK ኮድ', t:'text'},
          {id:'stage', en:'Stage', am:'ደረጃ', t:'text'},
          {id:'lost', en:'Birr lost', am:'የጠፋ ብር', t:'money'},
          {id:'why', en:'Why', am:'ምክንያት', t:'text'}
        ]},
      {id:'cm_missed', en:'How many commission stages did you miss?', am:'ስንት የኮሚሽን ደረጃዎች አመለጡ?', t:'num',
        auto:{rows:'cm_missed_list'}, sumEn:'stages missed', sumAm:'ያመለጡ ደረጃዎች',
        tgt:{op:'lte', v:0, en:'Each missed stage loses its share of the 2%',
             am:'እያንዳንዱ ያመለጠ ደረጃ ከ2% ድርሻውን ያሳጣል'}},
      {id:'cm_lost', en:'How much commission did that cost you?', am:'ይህ ስንት ብር ኮሚሽን አሳጣዎት?', t:'money',
        auto:{sum:'cm_missed_list.lost'}, sumEn:'lost', sumAm:'ጠፍቷል'}
    ]},
    { en:'6 · WhatsApp compliance', am:'6 · ዋትስአፕ አጠቃቀም', fields:[
      {id:'ww_groups', en:'How many customer groups were you active in this week?', am:'በዚህ ሳምንት በስንት የደንበኛ ግሩፖች ውስጥ ንቁ ነበሩ?', t:'num'},
      {id:'ww_posted', en:'How many required stage messages did you post? (posted / required)', am:'ከሚገባው የደረጃ መልዕክት ስንቱ ተላከ? (የተላከ / የሚገባው)', t:'ratio',
        auto:{a:{week:'w_stage__a'}, b:{week:'w_stage__b'}}},
      {id:'ww_posted_why', en:'Which customers missed a stage message, which stage, and why?', am:'የደረጃ መልዕክት ያልደረሳቸው የትኞቹ ደንበኞች ናቸው? የትኛው ደረጃ? ለምን?', t:'area', show:{f:'ww_posted', when:'short'}},
      {id:'ww_rate', en:'What is your compliance rate this week?', am:'ከሚገባው መልዕክት ስንት በመቶውን ላኩ?', t:'pct',
        auto:{pct:['ww_posted__a', 'ww_posted__b']},
        tgt:{op:'gte', v:100, en:'Every stage message must be posted', am:'እያንዳንዱ የደረጃ መልዕክት መላክ አለበት'}},
      {id:'ww_unans', en:'How many messages waited more than 2 hours for your answer?', am:'ከ2 ሰዓት በላይ ምላሽ ሳያገኙ የቆዩ መልዕክቶች ስንት ናቸው?', t:'num',
        auto:{week:'w_unans'},
        tgt:{op:'lte', v:0, en:'–200 Birr each', am:'እያንዳንዱ –200 ብር'}},
      {id:'ww_unans_why', en:'Which customers, and why?', am:'የየትኞቹ ደንበኞች ናቸው? ለምን?', t:'area', show:{f:'ww_unans', when:'pos'}}
    ]},
    { en:'7 · Customer satisfaction', am:'7 · የደንበኛ እርካታ', fields:[
      {id:'cu_any', en:'Did any customer of yours raise a complaint this week?', am:'በዚህ ሳምንት ቅሬታ ያቀረበ ደንበኛዎ አለ?', t:'yesno'},
      {id:'cu_list', en:'List each complaint', am:'እያንዳንዱን ቅሬታ ይዘርዝሩ', t:'table', addEn:'Add a complaint', addAm:'ቅሬታ ጨምር',
        show:{f:'cu_any', when:'yes'},
        cols:[
          {id:'cust', en:'Customer', am:'ደንበኛ', t:'text'},
          {id:'lc', en:'Customer code: 4-digit lead no., or KK code once paid', am:'የደንበኛ ኮድ፦ ባለ 4 አሃዝ ቁጥር፣ ከከፈሉ በኋላ KK ኮድ', t:'text'},
          {id:'what', en:'Complaint', am:'ቅሬታው', t:'text'},
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
      {id:'cu_out_plan', en:'For each open complaint: what is needed, who is fixing it, and by when?', am:'ለእያንዳንዱ ያልተፈታ ቅሬታ፦ ምን ያስፈልጋል? ማን ያስተካክለዋል? እስከ መቼ?', t:'area', show:{f:'cu_out', when:'pos'}},
      {id:'fu_week', en:'Of customers installed this week, how many got the 48-hour follow-up call? (called / due)', am:'በዚህ ሳምንት ተከላቸው ከተጠናቀቀ ደንበኞች ስንቱ የ48 ሰዓት የክትትል ጥሪ ተደረገላቸው? (የተደወለላቸው / መደወል የነበረባቸው)', t:'ratio',
        auto:{a:{week:'fu_calls__a'}, b:{week:'fu_calls__b'}}},
      {id:'fu_week_why', en:'Who was not called, and why?', am:'ያልተደወለላቸው እነማን ናቸው? ለምን?', t:'area', show:{f:'fu_week', when:'short'}}
    ]},
    { en:'8 · Problems and solutions', am:'8 · ችግሮችና መፍትሔዎች', fields:[
      {id:'problem', en:'What was the biggest problem this week — what caused it, and what is being done (who, by when)?', am:'የዚህ ሳምንት ትልቁ ችግር ምን ነበር? ምክንያቱ ምንድን ነው? ምን እየተደረገ ነው (በማን፣ እስከ መቼ)?', t:'area', opt:1},
      {id:'outstanding', en:'What is still unresolved and carries into next week?', am:'ገና ያልተፈታና ወደ ሚቀጥለው ሳምንት የሚሻገር ምንድን ነው?', t:'area', opt:1},
      {id:'need_lead', en:'Do you need a decision from Ephrata?', am:'የኤፍራታ ውሳኔ ያስፈልግዎታል?', t:'yesno'},
      {id:'need_lead_what', en:'What exactly should she decide, and by when?', am:'በትክክል ምን እንዲወስኑ ይፈልጋሉ? እስከ መቼ?', t:'area', show:{f:'need_lead', when:'yes'}}
    ]},
    { en:"9 · Next week's plan", am:'9 · የሚቀጥለው ሳምንት ዕቅድ', fields:[
      {id:'n_contracts', en:'How many contracts do you expect to sign next week?', am:'በሚቀጥለው ሳምንት ስንት ውል ይፈረማል ብለው ይጠብቃሉ?', t:'num'},
      {id:'n_value', en:'What value do you expect them to bring?', am:'ምን ያህል ዋጋ ያመጣሉ ብለው ይጠብቃሉ?', t:'money'},
      {id:'n_custs', en:'Which customers are in negotiation, and what is the next step with each?', am:'በድርድር ላይ ያሉ ደንበኞች እነማን ናቸው? ከእያንዳንዳቸው ጋር ቀጣዩ እርምጃ ምንድን ነው?', t:'area', opt:1},
      {id:'n_support', en:'What support do you need from Ephrata next week?', am:'በሚቀጥለው ሳምንት ከኤፍራታ ምን ድጋፍ ያስፈልግዎታል?', t:'area', opt:1}
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
    /* One row a measurement, and the row carries what used to be asked about
       it in separate questions: whether it was on time, whether the video was
       recorded, whether it went up. Four counts and five two-box questions
       stood around these two lists; all of them are counted from the rows
       now (the Chairman, 9 Oct 2026). */
    { en:'1 · Measurements today', am:'1 · የዛሬ ልኬቶች', fields:[
      {id:'m_pre_any', en:'Did you do any pre-measurement today?', am:'ዛሬ ቅድመ ልኬት አደረጉ?', t:'yesno'},
      {id:'m_pre_list', en:'Each pre-measurement today — one row each', am:'የዛሬ እያንዳንዱ ቅድመ ልኬት — በረድፍ አንድ', t:'table', addEn:'Add a customer', addAm:'ደንበኛ ጨምር',
        show:{f:'m_pre_any', when:'yes'},
        cols:[
          {id:'cust', en:'Customer', am:'ደንበኛ', t:'text'},
          {id:'lc', en:'Customer code: 4-digit lead no., or KK code once paid', am:'የደንበኛ ኮድ፦ ባለ 4 አሃዝ ቁጥር፣ ከከፈሉ በኋላ KK ኮድ', t:'text'},
          {id:'where', en:'Area', am:'አካባቢ', t:'text'},
          {id:'next', en:'Pre-design due', am:'ቅድመ ዲዛይን የሚደርስበት', t:'text'},
          {id:'ontime', en:'Within 48 hours of the lead?', am:'ደንበኛው ከመጣ በ48 ሰዓት ውስጥ?', t:'yesno'},
          {id:'vid', en:'Video (3–5 min)', am:'ቪዲዮ (3–5 ደቂቃ)', t:'choice', opts:[
            {v:'up',  en:'Recorded and uploaded',      am:'ተቀርጾ ተጭኗል'},
            {v:'rec', en:'Recorded, not uploaded yet', am:'ተቀርጿል፣ ገና አልተጫነም'},
            {v:'no',  en:'No video',                   am:'ቪዲዮ የለም'}
          ]}
        ]},
      {id:'m_pre', en:'How many pre-measurements did you do today?', am:'ዛሬ ስንት ቅድመ ልኬቶችን አደረጉ?', t:'num',
        auto:{rows:'m_pre_list'}, sumEn:'pre-measurements', sumAm:'ቅድመ ልኬቶች'},
      {id:'m_pre_ontime', en:'How many were within 48 hours of the lead? (on time / done)', am:'ስንቱ ደንበኛው ከመጣ በ48 ሰዓት ውስጥ ተደረጉ? (በሰዓቱ / የተደረጉ)', t:'ratio',
        auto:{a:{rows:'m_pre_list', when:{col:'ontime', is:'yes'}}, b:{rows:'m_pre_list'}},
        tgt:{op:'gte', v:100, en:'Late is –300 Birr and loses stage 1', am:'ዘግይቶ –300 ብር እና 1ኛ ደረጃን ያሳጣል'}},
      {id:'m_pre_ontime_why', en:'Which were late, by how long, and why?', am:'የዘገዩት የትኞቹ ናቸው? በምን ያህል? ለምን?', t:'area', show:{f:'m_pre_ontime', when:'short'}},
      {id:'m_fin_any', en:'Did you do any final measurement today?', am:'ዛሬ የመጨረሻ ልኬት አደረጉ?', t:'yesno'},
      {id:'m_fin_list', en:'Each final measurement today — one row each', am:'የዛሬ እያንዳንዱ የመጨረሻ ልኬት — በረድፍ አንድ', t:'table', addEn:'Add a job', addAm:'ሥራ ጨምር',
        show:{f:'m_fin_any', when:'yes'},
        cols:[
          {id:'cust', en:'Customer', am:'ደንበኛ', t:'text'},
          {id:'code', en:'Job code', am:'የሥራ ኮድ', t:'text'},
          {id:'green', en:'Selam’s green light first', am:'ከሰላም ፈቃድ ቀድሞ ነበር', t:'yesno'},
          {id:'ontime', en:'Within 24 hours of the advance?', am:'ከቅድመ ክፍያ በ24 ሰዓት ውስጥ?', t:'yesno'},
          {id:'amend', en:'Did it change the price?', am:'ዋጋውን ቀይሯል?', t:'yesno'},
          {id:'vid', en:'Video (5–8 min)', am:'ቪዲዮ (5–8 ደቂቃ)', t:'choice', opts:[
            {v:'up',  en:'Recorded and uploaded',      am:'ተቀርጾ ተጭኗል'},
            {v:'rec', en:'Recorded, not uploaded yet', am:'ተቀርጿል፣ ገና አልተጫነም'},
            {v:'no',  en:'No video',                   am:'ቪዲዮ የለም'}
          ]}
        ]},
      {id:'m_fin', en:'How many final measurements did you do today?', am:'ዛሬ ስንት የመጨረሻ ልኬቶችን አደረጉ?', t:'num',
        auto:{rows:'m_fin_list'}, sumEn:'final measurements', sumAm:'የመጨረሻ ልኬቶች'},
      {id:'m_fin_ontime', en:'How many were within 24 hours of the advance? (on time / done)', am:'ስንቱ ከቅድመ ክፍያ በ24 ሰዓት ውስጥ ተደረጉ? (በሰዓቱ / የተደረጉ)', t:'ratio',
        auto:{a:{rows:'m_fin_list', when:{col:'ontime', is:'yes'}}, b:{rows:'m_fin_list'}},
        tgt:{op:'gte', v:100, en:'Late is –300 Birr and loses stage 4', am:'ዘግይቶ –300 ብር እና 4ኛ ደረጃን ያሳጣል'}},
      {id:'m_fin_ontime_why', en:'Which were late, and why?', am:'የዘገዩት የትኞቹ ናቸው? ለምን?', t:'area', show:{f:'m_fin_ontime', when:'short'}},
      {id:'m_fin_amend', en:'Did any final measurement change the price?', am:'የመጨረሻ ልኬት ዋጋውን የቀየረበት ሥራ አለ?', t:'yesno',
        auto:{any:'m_fin_list.amend'}},
      {id:'m_fin_amend_what', en:'Which customer, by how much, and have the salesperson and Selam been told?', am:'የየትኛው ደንበኛ ነው? በስንት ብር? ለሻጩና ለሰላም ተነግሯል?', t:'area', show:{f:'m_fin_amend', when:'yes'}}
    ]},
    /* the videos are a column of the measurement rows now; what is left here
       is the consent, the design discussions, and the reasons */
    { en:'2 · Video documentation', am:'2 · የቪዲዮ ማስረጃ', fields:[
      {id:'v_pre_rec', en:'How many pre-measurement videos (3–5 min) were recorded? (recorded / visits)', am:'ስንት የቅድመ ልኬት ቪዲዮዎች (3–5 ደቂቃ) ተቀረጹ? (የተቀረጹ / ጉብኝቶች)', t:'ratio',
        auto:{a:{rows:'m_pre_list', when:{col:'vid', in:['up','rec']}}, b:{rows:'m_pre_list'}},
        tgt:{op:'gte', v:100, en:'A missing video is –500 Birr and loses 0.2%',
             am:'ያልተቀረጸ ቪዲዮ –500 ብር እና 0.2% ያሳጣል'}},
      {id:'v_pre_rec_why', en:'Which visits have no video, and why?', am:'ቪዲዮ ያልተቀረጸባቸው የትኞቹ ጉብኝቶች ናቸው? ለምን?', t:'area', show:{f:'v_pre_rec', when:'short'}},
      {id:'v_fin_rec', en:'How many final measurement videos (5–8 min) were recorded? (recorded / measurements)', am:'ስንት የመጨረሻ ልኬት ቪዲዮዎች (5–8 ደቂቃ) ተቀረጹ? (የተቀረጹ / ልኬቶች)', t:'ratio',
        auto:{a:{rows:'m_fin_list', when:{col:'vid', in:['up','rec']}}, b:{rows:'m_fin_list'}},
        tgt:{op:'gte', v:100, en:'A missing video is –500 Birr and loses 0.3%',
             am:'ያልተቀረጸ ቪዲዮ –500 ብር እና 0.3% ያሳጣል'}},
      {id:'v_fin_rec_why', en:'Which measurements have no video, and why?', am:'ቪዲዮ ያልተቀረጸላቸው የትኞቹ ልኬቶች ናቸው? ለምን?', t:'area', show:{f:'v_fin_rec', when:'short'}},
      {id:'v_uploaded', en:'How many videos were uploaded within 24 hours? (uploaded / recorded)', am:'ስንት ቪዲዮዎች በ24 ሰዓት ውስጥ ተጫኑ? (የተጫኑ / የተቀረጹ)', t:'ratio',
        auto:{a:{plus:[{rows:'m_pre_list', when:{col:'vid', is:'up'}}, {rows:'m_fin_list', when:{col:'vid', is:'up'}}]},
              b:{plus:[{rows:'m_pre_list', when:{col:'vid', in:['up','rec']}}, {rows:'m_fin_list', when:{col:'vid', in:['up','rec']}}]}},
        tgt:{op:'gte', v:100, en:'Late upload is –200 Birr', am:'ዘግይቶ መጫን –200 ብር'}},
      {id:'v_uploaded_why', en:'Which are not uploaded yet, and when will they be?', am:'ያልተጫኑት የትኞቹ ናቸው? መቼ ይጫናሉ?', t:'area', show:{f:'v_uploaded', when:'short'}},
      {id:'v_consent', en:'Did every customer give consent on camera before recording?', am:'ሁሉም ደንበኞች ከመቀረጻቸው በፊት በካሜራ ፈቃድ ሰጥተዋል?', t:'yesno'},
      {id:'v_consent_why', en:'Which recording has no consent, and what will be done about it?', am:'ፈቃድ ያልተቀረጸለት የትኛው ቪዲዮ ነው? ምን ይደረጋል?', t:'area', show:{f:'v_consent', when:'no'}},
      {id:'v_disc', en:'How many design discussions did you record today? (recorded / held)', am:'ዛሬ ስንት የዲዛይን ውይይቶችን ቀረጹ? (የተቀረጹ / የተካሄዱ)', t:'ratio'}
    ]},
    /* one row a design, where there were four counts and a two-box question */
    { en:'3 · Designs delivered', am:'3 · የቀረቡ ዲዛይኖች', fields:[
      {id:'d_any', en:'Did you deliver any design today?', am:'ዛሬ ዲዛይን አቀረቡ?', t:'yesno'},
      {id:'d_list', en:'Each design delivered today — one row each', am:'ዛሬ የቀረበ እያንዳንዱ ዲዛይን — በረድፍ አንድ', t:'table', addEn:'Add a design', addAm:'ዲዛይን ጨምር',
        show:{f:'d_any', when:'yes'},
        cols:[
          {id:'cust', en:'Customer', am:'ደንበኛ', t:'text'},
          {id:'lc', en:'Customer code: 4-digit lead no., or KK code once paid', am:'የደንበኛ ኮድ፦ ባለ 4 አሃዝ ቁጥር፣ ከከፈሉ በኋላ KK ኮድ', t:'text'},
          {id:'kind', en:'Which design', am:'የትኛው ዲዛይን', t:'choice', opts:[
            {v:'pre', en:'Pre-design',      am:'ቅድመ ዲዛይን'},
            {v:'fin', en:'Final 3D design', am:'የመጨረሻ 3D ዲዛይን'}
          ]},
          {id:'ontime', en:'Within 24 hours of the measurement?', am:'ከልኬት በ24 ሰዓት ውስጥ?', t:'yesno'},
          {id:'appr', en:'Written approval received today?', am:'ዛሬ የጽሑፍ ማጽደቅ ደርሷል?', t:'yesno'}
        ]},
      {id:'d_pre', en:'How many pre-designs did you deliver today?', am:'ዛሬ ስንት ቅድመ ዲዛይኖችን አቀረቡ?', t:'num',
        auto:{rows:'d_list', when:{col:'kind', is:'pre'}}, sumEn:'pre-designs', sumAm:'ቅድመ ዲዛይኖች'},
      {id:'d_fin', en:'How many final 3D designs did you deliver today?', am:'ዛሬ ስንት የመጨረሻ 3D ዲዛይኖችን አቀረቡ?', t:'num',
        auto:{rows:'d_list', when:{col:'kind', is:'fin'}}, sumEn:'final 3D designs', sumAm:'የመጨረሻ 3D ዲዛይኖች'},
      {id:'d_approved', en:'How many written customer approvals did you receive today?', am:'ዛሬ ስንት የጽሑፍ የደንበኛ ማጽደቆች ደረሱዎት?', t:'num',
        auto:{rows:'d_list', when:{col:'appr', is:'yes'}}, sumEn:'approvals in writing', sumAm:'የጽሑፍ ማጽደቆች'},
      {id:'d_pre_ontime', en:'How many were within 24 hours of the measurement? (on time / delivered)', am:'ስንቱ ከልኬት በ24 ሰዓት ውስጥ ቀረቡ? (በሰዓቱ / የቀረቡ)', t:'ratio',
        auto:{a:{rows:'d_list', when:[{col:'kind', is:'pre'}, {col:'ontime', is:'yes'}]},
              b:{rows:'d_list', when:{col:'kind', is:'pre'}}},
        tgt:{op:'gte', v:100, en:'Late is –300 Birr', am:'ዘግይቶ –300 ብር'}},
      {id:'d_pre_ontime_why', en:'Which were late, and why?', am:'የዘገዩት የትኞቹ ናቸው? ለምን?', t:'area', show:{f:'d_pre_ontime', when:'short'}},
      {id:'d_rev_any', en:'Did any customer ask for a revision today?', am:'ዛሬ ለውጥ የጠየቀ ደንበኛ አለ?', t:'yesno'},
      {id:'d_rev_list', en:'Which customers, and what changed?', am:'የየትኞቹ ደንበኞች? ምን ተቀየረ?', t:'table', addEn:'Add a revision', addAm:'ለውጥ ጨምር',
        show:{f:'d_rev_any', when:'yes'},
        cols:[
          {id:'cust', en:'Customer', am:'ደንበኛ', t:'text'},
          {id:'lc', en:'Customer code: 4-digit lead no., or KK code once paid', am:'የደንበኛ ኮድ፦ ባለ 4 አሃዝ ቁጥር፣ ከከፈሉ በኋላ KK ኮድ', t:'text'},
          {id:'what', en:'What changed', am:'የተቀየረው', t:'text'},
          {id:'times', en:'Revision no. for this customer', am:'ለዚህ ደንበኛ ስንተኛ ለውጥ', t:'num'}
        ]},
      {id:'d_rev', en:'How many revisions did customers ask for today?', am:'ዛሬ ደንበኞች ስንት ለውጦችን ጠየቁ?', t:'num',
        auto:{rows:'d_rev_list'}, sumEn:'revisions asked for', sumAm:'የተጠየቁ ለውጦች'},
      {id:'d_waiting', en:'How many of your designs are held up by someone else today?', am:'ከዲዛይኖችዎ ስንቱ ዛሬ በሌላ ሰው ምክንያት ቆመዋል?', t:'num'},
      {id:'d_waiting_who', en:'Which customers, waiting on whom (customer, sales, Finance), and since when?', am:'የየትኞቹ ደንበኞች ናቸው? ማንን እየጠበቁ ነው (ደንበኛ፣ ሽያጭ፣ ፋይናንስ)? ከመቼ ጀምሮ?', t:'area', show:{f:'d_waiting', when:'pos'}}
    ]},
    { en:'4 · Material selection', am:'4 · የቁሳቁስ ምርጫ', fields:[
      {id:'ms_any', en:'Was any Material Selection Form signed today?', am:'ዛሬ የተፈረመ የቁሳቁስ ምርጫ ፎርም አለ?', t:'yesno'},
      {id:'ms_list', en:'Which jobs?', am:'የየትኞቹ ሥራዎች?', t:'table', addEn:'Add a job', addAm:'ሥራ ጨምር',
        show:{f:'ms_any', when:'yes'}, cols:[
          {id:'cust', en:'Customer', am:'ደንበኛ', t:'text'},
          {id:'code', en:'Job code', am:'የሥራ ኮድ', t:'text'},
          {id:'opt', en:'Option signed', am:'የተፈረመው አማራጭ', t:'choice', opts:[{v:'A', en:'Option A (stock)', am:'አማራጭ A (በመጋዘን ያለ)'}, {v:'B', en:'Option B (imported)', am:'አማራጭ B (ከውጭ የሚመጣ)'}]},
          {id:'photo', en:'Photo posted in the WhatsApp group?', am:'ፎቶ በዋትስአፕ ግሩፕ ተልኳል?', t:'yesno'},
          {id:'codes', en:'Board and PVC edge codes in the Job File?', am:'የቦርድና የPVC ጠርዝ ኮዶች በሥራ ፋይሉ አሉ?', t:'yesno'}
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
      {id:'ms_photo_why', en:'Whose forms have no photo yet, and why?', am:'ፎቶ ያልተላከው የየትኞቹ ደንበኞች ፎርም ነው? ለምን?', t:'area', show:{f:'ms_photo', when:'short'}},
      {id:'ms_codes', en:'Are the board and PVC edge codes confirmed in every Job File?', am:'የቦርድና የPVC ጠርዝ ኮዶች በእያንዳንዱ የሥራ ፋይል ተረጋግጠዋል?', t:'yesno',
        auto:{all:'ms_list.codes'}},
      {id:'ms_codes_why', en:'Which Job Files are missing codes, and when will they be confirmed?', am:'ኮድ የጎደላቸው የትኞቹ የሥራ ፋይሎች ናቸው? መቼ ይረጋገጣሉ?', t:'area', show:{f:'ms_codes', when:'no'}}
    ]},
    { en:'5 · Designer Profile and drawings', am:'5 · የዲዛይነር ፕሮፋይልና ሥዕሎች', fields:[
      {id:'dp_done', en:'How many Designer Profiles are complete? (complete / needed before approval)', am:'ስንት የዲዛይነር ፕሮፋይሎች ተሞልተዋል? (የተሞሉ / ከማጽደቅ በፊት የሚያስፈልጉ)', t:'ratio',
        tgt:{op:'gte', v:100, en:'Missing is –300 Birr and loses the final design commission',
             am:'ካልተሞላ –300 ብር እና የመጨረሻ ዲዛይን ኮሚሽንን ያሳጣል'}},
      {id:'dp_done_why', en:'Which customers have no complete profile, and by when will it be done?', am:'ፕሮፋይላቸው ያልተሟላ የትኞቹ ደንበኞች ናቸው? እስከ መቼ ይሟላል?', t:'area', show:{f:'dp_done', when:'short'}},
      {id:'pd_sub', en:'How many production drawings did you submit to Mahelet and Amaha today?', am:'ዛሬ ስንት የምርት ሥዕሎችን ለማህሌትና ለአማሃ አቀረቡ?', t:'num'},
      {id:'pd_check', en:'Was the Production Drawing Checklist completed for every drawing?', am:'ለእያንዳንዱ ሥዕል የምርት ሥዕል ማረጋገጫ ዝርዝር ተሞልቷል?', t:'yesno'},
      {id:'pd_check_why', en:'Which drawings went without it, and why?', am:'ያለ ማረጋገጫ ዝርዝር የሄዱት የትኞቹ ሥዕሎች ናቸው? ለምን?', t:'area', show:{f:'pd_check', when:'no'}},
      {id:'pd_err', en:'How many drawings had a material code error?', am:'ስንት ሥዕሎች የቁሳቁስ ኮድ ስህተት ነበራቸው?', t:'num',
        tgt:{op:'lte', v:0, en:'–500 Birr each', am:'እያንዳንዱ –500 ብር'}},
      {id:'pd_err_what', en:'Which jobs, what was wrong, who found it, and has it been corrected?', am:'የትኞቹ ሥራዎች ናቸው? ስህተቱ ምን ነበር? ማን አገኘው? ተስተካክሏል?', t:'area', show:{f:'pd_err', when:'pos'}}
    ]},
    { en:'6 · Complaints assigned to you', am:'6 · ለእርስዎ የተመደቡ ቅሬታዎች', fields:[
      {id:'cp_any', en:'Is any design complaint assigned to you?', am:'ለእርስዎ የተመደበ የዲዛይን ቅሬታ አለ?', t:'yesno'},
      {id:'cp_list', en:'Which complaints?', am:'የትኞቹ ቅሬታዎች?', t:'table', addEn:'Add a complaint', addAm:'ቅሬታ ጨምር',
        show:{f:'cp_any', when:'yes'},
        cols:[
          {id:'cust', en:'Customer', am:'ደንበኛ', t:'text'},
          {id:'code', en:'Job code', am:'የሥራ ኮድ', t:'text'},
          {id:'what', en:'Complaint', am:'ቅሬታው', t:'text'},
          {id:'days', en:'Days open', am:'የቆየበት ቀን', t:'num'}
        ]},
      {id:'cp_assigned', en:'How many design complaints are assigned to you?', am:'ስንት የዲዛይን ቅሬታዎች ለእርስዎ ተመድበዋል?', t:'num',
        auto:{rows:'cp_list'}, sumEn:'complaints', sumAm:'ቅሬታዎች'},
      {id:'cp_24', en:'How many of those customers were contacted within 24 hours? (contacted / assigned)', am:'ከእነዚህ ስንት ደንበኞች በ24 ሰዓት ውስጥ ተደወለላቸው? (የተደወለላቸው / የተመደቡ)', t:'ratio',
        tgt:{op:'gte', v:100, en:'Missing is –300 Birr', am:'ካልተደወለ –300 ብር'}},
      {id:'cp_24_why', en:'Who was not contacted in time, and why?', am:'በሰዓቱ ያልተደወለለት ማን ነው? ለምን?', t:'area', show:{f:'cp_24', when:'short'}},
      {id:'cp_48', en:'How many got a proposed solution within 48 hours? (proposed / assigned)', am:'ስንቱ በ48 ሰዓት ውስጥ መፍትሔ ቀረበላቸው? (የቀረበላቸው / የተመደቡ)', t:'ratio',
        tgt:{op:'gte', v:100, en:'Missing is –500 Birr', am:'ካልቀረበ –500 ብር'}},
      {id:'cp_48_why', en:'Which have no solution yet, and what is holding it up?', am:'መፍትሔ ያልቀረበላቸው የትኞቹ ናቸው? ምን ያዘው?', t:'area', show:{f:'cp_48', when:'short'}},
      {id:'cp_res', en:'How many complaints did you resolve today?', am:'ዛሬ ስንት ቅሬታዎችን ፈቱ?', t:'num'},
      {id:'cp_out', en:'How many are still open?', am:'ስንቱ ገና አልተፈቱም?', t:'num',
        tgt:{op:'lte', v:0, en:'Past 7 days is –1,000 Birr and the rest of that commission',
             am:'ከ7 ቀን በላይ –1,000 ብር እና የቀረው ኮሚሽን'}},
      {id:'cp_out_what', en:'Which ones, what is blocking each, and by what day will it be resolved?', am:'የትኞቹ ናቸው? እያንዳንዱን ምን ያዘው? በየትኛው ቀን ይፈታል?', t:'area', show:{f:'cp_out', when:'pos'}}
    ]},
    { en:'7 · WhatsApp compliance', am:'7 · ዋትስአፕ አጠቃቀም', fields:[
      {id:'wd_stage', en:'How many design stage messages were posted? (posted / due)', am:'ስንት የዲዛይን ደረጃ መልዕክቶች ተላኩ? (የተላኩ / የሚገባው)', t:'ratio',
        tgt:{op:'gte', v:100, en:'A missed message loses that stage’s commission',
             am:'ያልተላከ መልዕክት የዚያን ደረጃ ኮሚሽን ያሳጣል'}},
      {id:'wd_stage_why', en:'Which customers missed a stage message, and at which stage?', am:'የደረጃ መልዕክት የቀረባቸው የትኞቹ ደንበኞች ናቸው? በየትኛው ደረጃ?', t:'area', show:{f:'wd_stage', when:'short'}},
      {id:'wd_sum', en:'How many Design Discussion Summaries did you post?', am:'ስንት የውይይት ማጠቃለያዎችን ላኩ?', t:'num'},
      {id:'wd_unans', en:'How many customer messages waited more than 2 hours for an answer?', am:'ስንት የደንበኛ መልዕክቶች ከ2 ሰዓት በላይ ምላሽ ሳያገኙ ቆዩ?', t:'num',
        tgt:{op:'lte', v:0, en:'–200 Birr each', am:'እያንዳንዱ –200 ብር'}},
      {id:'wd_unans_why', en:'Which customers, why the delay, and have they been answered now?', am:'የየትኞቹ ደንበኞች ናቸው? ለምን ዘገየ? አሁን ምላሽ አግኝተዋል?', t:'area', show:{f:'wd_unans', when:'pos'}},
      {id:'wd_comp', en:'How many customers complained about design communication?', am:'ስንት ደንበኞች በዲዛይን መግባቢያ ላይ ቅሬታ አቀረቡ?', t:'num',
        tgt:{op:'lte', v:0, en:'–1,000 Birr each', am:'እያንዳንዱ –1,000 ብር'}},
      {id:'wd_comp_what', en:'Who complained, about what, and what was done?', am:'ቅሬታ ያቀረበው ማን ነው? ስለምን? ምን እርምጃ ተወሰደ?', t:'area', show:{f:'wd_comp', when:'pos'}}
    ]},
    { en:'8 · Problems and solutions', am:'8 · ችግሮችና መፍትሔዎች', fields:[
      {id:'problem', en:'What was the biggest problem today — what caused it, and what is being done (who, by when)?', am:'የዛሬው ትልቁ ችግር ምን ነበር? ምክንያቱ ምንድን ነው? ምን እየተደረገ ነው (በማን፣ እስከ መቼ)?', t:'area', opt:1},
      {id:'need_help', en:'What do you need from another department, and from whom?', am:'ከሌላ ክፍል ምን ያስፈልግዎታል? ከማን?', t:'area', opt:1},
      {id:'need_lead', en:'Do you need a decision from Ephrata?', am:'የኤፍራታ ውሳኔ ያስፈልግዎታል?', t:'yesno'},
      {id:'need_lead_what', en:'What exactly should Ephrata decide, what are the options, and by when?', am:'ኤፍራታ በትክክል ምን እንዲወስኑ ይፈልጋሉ? አማራጮቹ ምንድን ናቸው? እስከ መቼ?', t:'area', show:{f:'need_lead', when:'yes'}}
    ]},
    { en:"9 · Tomorrow's top 3", am:'9 · የነገ ሦስት ቅድሚያዎች', fields:[
      {id:'p1', en:'Priority 1', am:'1ኛ ሥራ', t:'text'},
      {id:'p2', en:'Priority 2', am:'2ኛ ሥራ', t:'text'},
      {id:'p3', en:'Priority 3', am:'3ኛ ሥራ', t:'text'}
    ]}
  ]
};

const DESIGN_WEEKLY = {
  id:'design-weekly', cadence:'weekly', dueTime:'16:00', dueDay:6,
  en:'Weekly Design Summary', am:'ሳምንታዊ የዲዛይን ማጠቃለያ',
  toEn:'Ephrata', toAm:'ኤፍራታ',
  dueEn:'Saturday 4:00 PM', dueAm:'ቅዳሜ ከቀኑ 10፡00 (4:00 PM)',
  penEn:'Late or not sent –500 Birr', penAm:'ዘግይቶ ወይም ካልቀረበ –500 ብር',
  sections:[
    /* THE WEEK ADDS ITSELF UP. Every figure here was in the six daily
       reports this designer already filed, and asking for it again was
       asking the same question seven times (the Chairman, 9 Oct 2026).
       The form fetches those reports and adds them; what is left to answer
       is the judgement — what went wrong, what is planned, what is needed. */
    { en:'1 · Measurements', am:'1 · ልኬቶች', fields:[
      {id:'wm_pre', en:'How many pre-measurements did you do this week?', am:'በዚህ ሳምንት ስንት ቅድመ ልኬቶችን አደረጉ?', t:'num',
        auto:{week:'m_pre'}},
      {id:'wm_fin', en:'How many final measurements did you do this week?', am:'በዚህ ሳምንት ስንት የመጨረሻ ልኬቶችን አደረጉ?', t:'num',
        auto:{week:'m_fin'}},
      {id:'wm_ontime', en:'How many measurements were on time? (on time / done)', am:'ስንቱ ልኬቶች በሰዓቱ ተደረጉ? (በሰዓቱ / የተደረጉ)', t:'ratio',
        auto:{a:{plus:[{week:'m_pre_ontime__a'}, {week:'m_fin_ontime__a'}]},
              b:{plus:[{week:'m_pre_ontime__b'}, {week:'m_fin_ontime__b'}]}}},
      {id:'wm_ontime_why', en:'Which were late, and why?', am:'የዘገዩት የትኞቹ ናቸው? ለምን?', t:'area', show:{f:'wm_ontime', when:'short'}},
      {id:'wm_lead', en:'On average, how many hours from a new lead to the pre-measurement?', am:'ደንበኛው ከመጣ እስከ ቅድመ ልኬት በአማካይ ስንት ሰዓት ፈጀ?', t:'num',
        tgt:{op:'lte', v:48, en:'Must be within 48 hours', am:'በ48 ሰዓት ውስጥ መሆን አለበት'}},
      {id:'wm_lead_why', en:'Over 48 hours. What is slowing the first visit down?', am:'ከ48 ሰዓት በላይ ነው። የመጀመሪያውን ጉብኝት ምን እያዘገየው ነው?', t:'area', show:{f:'wm_lead', when:'miss'}}
    ]},
    { en:'2 · Designs', am:'2 · ዲዛይኖች', fields:[
      {id:'wd_pre', en:'How many pre-designs did you deliver this week?', am:'በዚህ ሳምንት ስንት ቅድመ ዲዛይኖችን አቀረቡ?', t:'num',
        auto:{week:'d_pre'}},
      {id:'wd_fin', en:'How many final 3D designs did you deliver this week?', am:'በዚህ ሳምንት ስንት የመጨረሻ 3D ዲዛይኖችን አቀረቡ?', t:'num',
        auto:{week:'d_fin'}},
      {id:'wd_ontime', en:'How many designs were on time? (on time / delivered)', am:'ስንቱ ዲዛይኖች በሰዓቱ ቀረቡ? (በሰዓቱ / የቀረቡ)', t:'ratio',
        auto:{a:{week:'d_pre_ontime__a'}, b:{week:'d_pre_ontime__b'}}},
      {id:'wd_ontime_why', en:'Which were late, and why?', am:'የዘገዩት የትኞቹ ናቸው? ለምን?', t:'area', show:{f:'wd_ontime', when:'short'}},
      {id:'wd_rev', en:'How many revisions did customers ask for this week?', am:'በዚህ ሳምንት ደንበኞች ስንት ለውጦችን ጠየቁ?', t:'num',
        auto:{week:'d_rev'}},
      {id:'wd_rev_why', en:'Which customers asked more than once, and why — what was unclear the first time?', am:'ከአንድ ጊዜ በላይ የጠየቁት የትኞቹ ደንበኞች ናቸው? ለምን — በመጀመሪያው ዲዛይን ምን ግልጽ አልነበረም?', t:'area', show:{f:'wd_rev', when:'pos'}}
    ]},
    { en:'3 · Video documentation', am:'3 · የቪዲዮ ማስረጃ', fields:[
      {id:'wv_pre', en:'How many pre-measurement videos were recorded? (recorded / visits)', am:'ስንት የቅድመ ልኬት ቪዲዮዎች ተቀረጹ? (የተቀረጹ / ጉብኝቶች)', t:'ratio',
        auto:{a:{week:'v_pre_rec__a'}, b:{week:'v_pre_rec__b'}}},
      {id:'wv_pre_why', en:'Which visits have no video, and why?', am:'ቪዲዮ ያልተቀረጸባቸው የትኞቹ ጉብኝቶች ናቸው? ለምን?', t:'area', show:{f:'wv_pre', when:'short'}},
      {id:'wv_fin', en:'How many final measurement videos were recorded? (recorded / measurements)', am:'ስንት የመጨረሻ ልኬት ቪዲዮዎች ተቀረጹ? (የተቀረጹ / ልኬቶች)', t:'ratio',
        auto:{a:{week:'v_fin_rec__a'}, b:{week:'v_fin_rec__b'}}},
      {id:'wv_fin_why', en:'Which measurements have no video, and why?', am:'ቪዲዮ ያልተቀረጸላቸው የትኞቹ ልኬቶች ናቸው? ለምን?', t:'area', show:{f:'wv_fin', when:'short'}},
      {id:'wv_up', en:'How many of the week’s videos went up within 24 hours? (uploaded / recorded)', am:'ከሳምንቱ ቪዲዮዎች ስንቱ በ24 ሰዓት ውስጥ ተጫኑ? (የተጫኑ / የተቀረጹ)', t:'ratio',
        auto:{a:{week:'v_uploaded__a'}, b:{week:'v_uploaded__b'}}},
      {id:'wv_disc', en:'How many design discussions were recorded? (recorded / held)', am:'ስንት የዲዛይን ውይይቶች ተቀረጹ? (የተቀረጹ / የተካሄዱ)', t:'ratio',
        auto:{a:{week:'v_disc__a'}, b:{week:'v_disc__b'}}},
      {id:'wv_audit', en:'What Video Quality Audit score do you expect this month? (%)', am:'በዚህ ወር ስንት የቪዲዮ ጥራት ኦዲት ውጤት ይጠብቃሉ? (%)', t:'pct',
        tgt:{op:'gte', v:90, en:'≥90% earns 1,000 Birr; below 60% is –1,500 Birr',
             am:'≥90% 1,000 ብር፤ ከ60% በታች –1,500 ብር'}},
      {id:'wv_audit_why', en:'Below 90%. What will you fix to raise it?', am:'ከ90% በታች ነው። ለማሻሻል ምን ያስተካክላሉ?', t:'area', show:{f:'wv_audit', when:'miss'}}
    ]},
    { en:'4 · Material selection', am:'4 · የቁሳቁስ ምርጫ', fields:[
      {id:'wms_signed', en:'How many Material Selection Forms were signed this week?', am:'በዚህ ሳምንት ስንት የቁሳቁስ ምርጫ ፎርሞች ተፈረሙ?', t:'num',
        auto:{week:'ms_signed'}},
      {id:'wms_a', en:'How many customers chose Option A (stock)?', am:'ስንት ደንበኞች አማራጭ A (በመጋዘን ያለ) መረጡ?', t:'num',
        auto:{week:'ms_a'}},
      {id:'wms_b', en:'How many customers chose Option B (imported)?', am:'ስንት ደንበኞች አማራጭ B (ከውጭ የሚመጣ) መረጡ?', t:'num',
        auto:{week:'ms_b'}},
      {id:'wms_missing', en:'How many forms are still missing a signature?', am:'ስንት ፎርሞች ገና ፊርማ ጎድሏቸዋል?', t:'num',
        tgt:{op:'lte', v:0, en:'–500 Birr each and loses 0.3%', am:'እያንዳንዱ –500 ብር እና 0.3% ያሳጣል'}},
      {id:'wms_missing_who', en:'Which customers, and when will each sign?', am:'የየትኞቹ ደንበኞች ናቸው? እያንዳንዳቸው መቼ ይፈርማሉ?', t:'area', show:{f:'wms_missing', when:'pos'}},
      {id:'wms_photo', en:'How many signed forms have a photo posted? (posted / signed)', am:'ከተፈረሙት ስንቱ ፎቶ ተልኳል? (የተላኩ / የተፈረሙ)', t:'ratio',
        auto:{a:{week:'ms_photo__a'}, b:{week:'ms_photo__b'}}},
      {id:'wms_photo_why', en:'Whose forms have no photo yet, and why?', am:'ፎቶ ያልተላከው የየትኞቹ ደንበኞች ፎርም ነው? ለምን?', t:'area', show:{f:'wms_photo', when:'short'}}
    ]},
    { en:'5 · Job File documentation', am:'5 · የሥራ ፋይል ሰነዶች', fields:[
      /* a standing figure, not a weekly total: the last daily report of the
         week is where it stands now, so adding six days of it would be
         counting the same profiles six times */
      {id:'jf_profiles', en:'How many Designer Profiles are complete? (complete / jobs)', am:'ስንት የዲዛይነር ፕሮፋይሎች ተሞልተዋል? (የተሞሉ / ሥራዎች)', t:'ratio',
        auto:{a:{week:'dp_done__a', how:'last'}, b:{week:'dp_done__b', how:'last'}}},
      {id:'jf_profiles_why', en:'Which customers have no complete profile, and by when will it be done?', am:'ፕሮፋይላቸው ያልተሟላ የትኞቹ ደንበኞች ናቸው? እስከ መቼ ይሟላል?', t:'area', show:{f:'jf_profiles', when:'short'}},
      {id:'jf_any', en:'Is any Job File of yours incomplete?', am:'ያልተሟላ የሥራ ፋይል አለብዎት?', t:'yesno'},
      {id:'jf_incomplete_list', en:'Which Job Files, and what is missing?', am:'የትኞቹ የሥራ ፋይሎች? ምን ጎደለ?', t:'table', addEn:'Add a Job File', addAm:'የሥራ ፋይል ጨምር',
        show:{f:'jf_any', when:'yes'},
        cols:[
          {id:'code', en:'Job code', am:'የሥራ ኮድ', t:'text'},
          {id:'cust', en:'Customer', am:'ደንበኛ', t:'text'},
          {id:'what', en:'Missing', am:'የጎደለው', t:'text'},
          {id:'by', en:'Complete by', am:'የሚሟላበት ቀን', t:'text'}
        ]},
      {id:'jf_incomplete', en:'How many of your Job Files are incomplete?', am:'ስንቱ የሥራ ፋይሎችዎ ያልተሟሉ ናቸው?', t:'num',
        auto:{rows:'jf_incomplete_list'},
        tgt:{op:'lte', v:0, en:'3 in a month cancels the month’s commission',
             am:'በወር 3 ከሆኑ የወሩን ኮሚሽን ይሰርዛል'}},
      {id:'jf_score', en:'What Documentation Quality Score do you expect this month? (%)', am:'በዚህ ወር ስንት የሰነድ ጥራት ውጤት ይጠብቃሉ? (%)', t:'pct',
        tgt:{op:'gte', v:95, en:'≥95% earns 2,000 Birr; below 60% is –3,000 Birr',
             am:'≥95% 2,000 ብር፤ ከ60% በታች –3,000 ብር'}},
      {id:'jf_score_why', en:'Below 95%. What is pulling it down, and what will you fix?', am:'ከ95% በታች ነው። ምን እያወረደው ነው? ምን ያስተካክላሉ?', t:'area', show:{f:'jf_score', when:'miss'}}
    ]},
    { en:'6 · Production drawings', am:'6 · የምርት ሥዕሎች', fields:[
      {id:'wp_sub', en:'How many production drawings did you submit this week?', am:'በዚህ ሳምንት ስንት የምርት ሥዕሎችን አቀረቡ?', t:'num',
        auto:{week:'pd_sub'}},
      {id:'wp_err', en:'How many drawings had errors?', am:'ስንት ሥዕሎች ስህተት ነበራቸው?', t:'num', auto:{week:'pd_err'},
        tgt:{op:'lte', v:0, en:'–500 Birr each, and –500 per production delay caused',
             am:'እያንዳንዱ –500 ብር፣ ለሚያስከትለው መዘግየትም –500 ብር'}},
      {id:'wp_err_what', en:'Which jobs, what was the error, and did it delay production?', am:'የትኞቹ ሥራዎች ናቸው? ስህተቱ ምን ነበር? ምርቱን አዘገየ?', t:'area', show:{f:'wp_err', when:'pos'}},
      {id:'wp_late', en:'How many drawings were submitted late?', am:'ስንት ሥዕሎች ዘግይተው ቀረቡ?', t:'num',
        tgt:{op:'lte', v:0, en:'–300 Birr each', am:'እያንዳንዱ –300 ብር'}},
      {id:'wp_late_why', en:'Which jobs, and why?', am:'የትኞቹ ሥራዎች ናቸው? ለምን?', t:'area', show:{f:'wp_late', when:'pos'}}
    ]},
    { en:'7 · Commission', am:'7 · ኮሚሽን', fields:[
      {id:'wc_earned', en:'How much commission did you earn this week? (Birr)', am:'በዚህ ሳምንት ስንት ብር ኮሚሽን አገኙ?', t:'money'},
      {id:'wc_missed_any', en:'Did you miss any commission stage this week?', am:'በዚህ ሳምንት ያመለጠዎት የኮሚሽን ደረጃ አለ?', t:'yesno'},
      {id:'wc_missed_list', en:'Which stages?', am:'የትኞቹ ደረጃዎች?', t:'table', addEn:'Add a stage', addAm:'ደረጃ ጨምር',
        show:{f:'wc_missed_any', when:'yes'},
        cols:[
          {id:'cust', en:'Customer', am:'ደንበኛ', t:'text'},
          {id:'lc', en:'Customer code: 4-digit lead no., or KK code once paid', am:'የደንበኛ ኮድ፦ ባለ 4 አሃዝ ቁጥር፣ ከከፈሉ በኋላ KK ኮድ', t:'text'},
          {id:'stage', en:'Stage (1–10)', am:'ደረጃ (1–10)', t:'num'},
          {id:'lost', en:'Birr lost', am:'የጠፋ ብር', t:'money'},
          {id:'why', en:'Why', am:'ለምን', t:'text'}
        ]},
      {id:'wc_missed', en:'How many commission stages did you miss?', am:'ስንት የኮሚሽን ደረጃዎች አመለጡዎት?', t:'num',
        auto:{rows:'wc_missed_list'}, sumEn:'stages missed', sumAm:'ያመለጡ ደረጃዎች'},
      {id:'wc_lost', en:'How much commission did that cost? (Birr)', am:'ይህ ስንት ብር ኮሚሽን አሳጣ?', t:'money',
        auto:{sum:'wc_missed_list.lost'}, sumEn:'lost', sumAm:'ጠፍቷል'}
    ]},
    { en:'8 · Complaints', am:'8 · ቅሬታዎች', fields:[
      {id:'wcp_assigned', en:'How many design complaints were assigned to you this week?', am:'በዚህ ሳምንት ስንት የዲዛይን ቅሬታዎች ለእርስዎ ተመደቡ?', t:'num',
        auto:{week:'cp_assigned', how:'max'}},
      {id:'wcp_24', en:'How many were contacted within 24 hours? (contacted / assigned)', am:'ስንቱ በ24 ሰዓት ውስጥ ተደወለላቸው? (የተደወለላቸው / የተመደቡ)', t:'ratio',
        auto:{a:{week:'cp_24__a', how:'last'}, b:{week:'cp_24__b', how:'last'}}},
      {id:'wcp_7', en:'How many were resolved within 7 days? (resolved / assigned)', am:'ስንቱ በ7 ቀን ውስጥ ተፈቱ? (የተፈቱ / የተመደቡ)', t:'ratio'},
      {id:'wcp_7_why', en:'Which were not resolved in 7 days, and why?', am:'በ7 ቀን ውስጥ ያልተፈቱት የትኞቹ ናቸው? ለምን?', t:'area', show:{f:'wcp_7', when:'short'}},
      {id:'wcp_out', en:'How many complaints are still open?', am:'ስንት ቅሬታዎች ገና አልተፈቱም?', t:'num',
        auto:{week:'cp_out', how:'last'},
        tgt:{op:'lte', v:0, en:'Two past 7 days cancels the month’s commission',
             am:'ከ7 ቀን በላይ ሁለት ከሆኑ የወሩን ኮሚሽን ይሰርዛል'}},
      {id:'wcp_out_what', en:'Which ones, how many days open, and what is the plan?', am:'የትኞቹ ናቸው? ስንት ቀን ቆዩ? ዕቅዱ ምንድን ነው?', t:'area', show:{f:'wcp_out', when:'pos'}},
      {id:'wcp_esc', en:'How many complaints went up to Ephrata or the Chairman?', am:'ስንት ቅሬታዎች ወደ ኤፍራታ ወይም ወደ ሊቀመንበሩ ደረሱ?', t:'num',
        tgt:{op:'lte', v:0, en:'–1,500 Birr to Ephrata, –3,000 Birr to the Chairman',
             am:'ወደ ኤፍራታ –1,500 ብር፣ ወደ ሊቀመንበር –3,000 ብር'}},
      {id:'wcp_esc_what', en:'Which ones, to whom, and why?', am:'የትኞቹ ናቸው? ለማን? ለምን?', t:'area', show:{f:'wcp_esc', when:'pos'}}
    ]},
    { en:'9 · WhatsApp compliance', am:'9 · ዋትስአፕ አጠቃቀም', fields:[
      {id:'ws_rate', en:'What was your stage message compliance this week? (%)', am:'ከሚገባው የደረጃ መልዕክት ስንት በመቶውን ላኩ? (%)', t:'pct',
        auto:{pct:[{week:'wd_stage__a'}, {week:'wd_stage__b'}]},
        tgt:{op:'gte', v:100, en:'Every stage message must be posted', am:'እያንዳንዱ የደረጃ መልዕክት መላክ አለበት'}},
      {id:'ws_rate_why', en:'Below 100%. Which customers missed which stage message?', am:'ከ100% በታች ነው። የየትኞቹ ደንበኞች የትኛው የደረጃ መልዕክት ቀረ?', t:'area', show:{f:'ws_rate', when:'miss'}},
      {id:'ws_sum', en:'How many Design Discussion Summaries did you post this week?', am:'በዚህ ሳምንት ስንት የውይይት ማጠቃለያዎችን ላኩ?', t:'num',
        auto:{week:'wd_sum'}},
      {id:'ws_appr', en:'How many written customer approvals did you receive?', am:'ስንት የጽሑፍ የደንበኛ ማጽደቆች ደረሱዎት?', t:'num',
        auto:{week:'d_approved'}},
      {id:'ws_comp', en:'How many design-related complaints came in this week?', am:'በዚህ ሳምንት ከዲዛይን ጋር የተያያዙ ስንት ቅሬታዎች ቀረቡ?', t:'num',
        auto:{week:'wd_comp'},
        tgt:{op:'lte', v:0, en:'Zero earns the 2,000 Birr bonus', am:'0 ከሆነ የ2,000 ብር ጉርሻ ያስገኛል'}},
      {id:'ws_comp_what', en:'Who complained, about what, and what was done?', am:'ቅሬታ ያቀረበው ማን ነው? ስለምን? ምን እርምጃ ተወሰደ?', t:'area', show:{f:'ws_comp', when:'pos'}}
    ]},
    { en:'10 · Problems and solutions', am:'10 · ችግሮችና መፍትሔዎች', fields:[
      {id:'problem', en:'What was the biggest problem this week — what caused it, and what is being done (who, by when)?', am:'የዚህ ሳምንት ትልቁ ችግር ምን ነበር? ምክንያቱ ምንድን ነው? ምን እየተደረገ ነው (በማን፣ እስከ መቼ)?', t:'area', opt:1},
      {id:'need_lead', en:'Do you need a decision from Ephrata?', am:'የኤፍራታ ውሳኔ ያስፈልግዎታል?', t:'yesno'},
      {id:'need_lead_what', en:'What exactly should Ephrata decide, what are the options, and by when?', am:'ኤፍራታ በትክክል ምን እንዲወስኑ ይፈልጋሉ? አማራጮቹ ምንድን ናቸው? እስከ መቼ?', t:'area', show:{f:'need_lead', when:'yes'}}
    ]},
    { en:"11 · Next week's plan", am:'11 · የሚቀጥለው ሳምንት ዕቅድ', fields:[
      {id:'n_meas', en:'How many measurements are scheduled for next week?', am:'ለሚቀጥለው ሳምንት ስንት ልኬቶች ታቅደዋል?', t:'num'},
      {id:'n_designs', en:'How many designs must you deliver next week?', am:'በሚቀጥለው ሳምንት ስንት ዲዛይኖችን ማቅረብ አለብዎት?', t:'num'},
      {id:'n_support', en:'What support do you need from Ephrata?', am:'ከኤፍራታ ምን ድጋፍ ያስፈልግዎታል?', t:'area', opt:1},
      {id:'n_prio', en:'What are your top 3 priorities for next week?', am:'የሚቀጥለው ሳምንት ዋና ሦስት ቅድሚያዎችዎ ምንድን ናቸው?', t:'area'}
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
