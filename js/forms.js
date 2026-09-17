/* Klever report definitions.
   To change a form, edit the data here — nothing else needs touching.

   field keys:  id  en  am  t(type)  i(indent)  tgt(target check)  opt(not required)
   types:       num money pct text area ratio yesno choice
   target:      {op:'gte'|'lte', v:<number>, en:'', am:''}            */

const PEOPLE = [
  { id:'ephrata',  en:'Ephrata Assfa',   am:'ኤፍራታ አስፋ',   roleEn:'Commercial Lead',   roleAm:'የንግድ ኃላፊ', grp:'commercial' },
  { id:'liu',      en:'Mahelet Teshome', am:'ማህሌት ተሾመ',   roleEn:'Operations Lead',   roleAm:'የኦፕሬሽን ኃላፊ', grp:'lead' },
  { id:'betty',    en:'Betelhem Aklog',  am:'ቤተልሔም አክሎግ', roleEn:'Finance Officer',   roleAm:'የፋይናንስ ኃላፊ', grp:'finance' },
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

  /* Betelhem's assistant. She has no terms letter of her own — everything
     about her is written inside Betelhem's. She is here because she does the
     work and needs to be reachable, not because the paperwork caught up. */
  { id:'seble', en:'Seble Mulugeta', am:'ሰብለ ሙሉጌታ', roleEn:'Finance Assistant', roleAm:'የፋይናንስ ረዳት', grp:'finance' },

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
      {id:'leads_total', en:'New leads received', am:'ጠቅላላ ብዛት', t:'num'},
      {id:'leads_social', en:'Social media', am:'ሶሻል ሚዲያ', t:'num', i:1},
      {id:'leads_showroom', en:'Showroom', am:'ሾውሩም', t:'num', i:1},
      {id:'leads_referral', en:'Referral', am:'ሪፈራል', t:'num', i:1},
      {id:'leads_agent', en:'Agent', am:'ኤጀንት', t:'num', i:1},
      {id:'leads_other', en:'Other', am:'ሌላ', t:'num', i:1}
    ]},
    { en:'2 · Lead response compliance', am:'2 · የምላሽ ፍጥነት', fields:[
      {id:'resp_1hr', en:'Leads contacted within 1 hour', am:'በ1 ሰዓት ውስጥ የተደወለላቸው', t:'ratio'},
      {id:'resp_showroom', en:'Showroom visitors engaged same day', am:'በዕለቱ የተስተናገዱ ሾውሩም ጎብኚዎች', t:'ratio'}
    ]},
    { en:'3 · Site visits', am:'3 · የቦታ ጉብኝት', fields:[
      {id:'visits_booked', en:'Site visits booked today', am:'ዛሬ የተያዙ ጉብኝቶች', t:'num'},
      {id:'visits_done', en:'Site visits completed today', am:'ዛሬ የተከናወኑ ጉብኝቶች', t:'num'},
      {id:'visits_late', en:'Visits pending beyond 48 hours', am:'ከ48 ሰዓት በላይ የዘገዩ ጉብኝቶች', t:'num',
        tgt:{op:'lte', v:0, en:'Should be 0', am:'0 መሆን አለበት'}}
    ]},
    { en:'4 · Quotations', am:'4 · ፕሮፎርማ', fields:[
      {id:'quotes_issued', en:'Quotations issued today', am:'ዛሬ የተሰጡ ፕሮፎርማዎች', t:'num'},
      {id:'quotes_late', en:'Quotations pending over 48 hours', am:'ከ48 ሰዓት በላይ የዘገዩ ፕሮፎርማዎች', t:'num',
        tgt:{op:'lte', v:0, en:'Should be 0', am:'0 መሆን አለበት'}}
    ]},
    { en:'5 · Contracts', am:'5 · ውሎች', fields:[
      {id:'contracts', en:'Contracts signed today', am:'ዛሬ የተፈረሙ ውሎች', t:'num'},
      {id:'contract_value', en:'Total value', am:'ጠቅላላ ዋጋ', t:'money'},
      {id:'advance', en:'Advance collected today', am:'ዛሬ የተሰበሰበ ቅድመ ክፍያ', t:'money'},
      {id:'advance_banked', en:'Advance banked same day', am:'ቅድመ ክፍያ በዕለቱ ባንክ ገብቷል', t:'yesno'}
    ]},
    { en:'6 · Cash collection', am:'6 · የገንዘብ ስብሰባ', fields:[
      {id:'collected_today', en:'External collections today', am:'ዛሬ ከደንበኞች የተሰበሰበ ገንዘብ', t:'money'},
      {id:'week_total', en:'Running weekly total', am:'የዚህ ሳምንት ጠቅላላ እስካሁን', t:'money',
        tgt:{op:'gte', v:3000000, en:'Commission starts at 3,000,000 Birr/week', am:'ኮሚሽን የሚጀምረው በሳምንት ከ3,000,000 ብር ነው'}}
    ]},
    { en:'7 · WhatsApp compliance', am:'7 · የዋትስአፕ ተገዢነት', fields:[
      {id:'wa_groups', en:'Active customer groups', am:'ንቁ የደንበኛ ግሩፖች', t:'num'},
      {id:'wa_stage', en:'Required stage messages posted', am:'የተላኩ የደረጃ መልዕክቶች', t:'ratio'},
      {id:'wa_unanswered', en:'Messages unanswered over 2 hours', am:'ከ2 ሰዓት በላይ ምላሽ ያላገኙ', t:'num',
        tgt:{op:'lte', v:0, en:'–200 Birr each', am:'እያንዳንዱ –200 ብር'}},
      {id:'wa_complaints', en:'Customer complaints about WhatsApp', am:'በዋትስአፕ ላይ የደንበኛ ቅሬታ', t:'num',
        tgt:{op:'lte', v:0, en:'–1,000 Birr each', am:'እያንዳንዱ –1,000 ብር'}},
      {id:'wa_violations', en:'Team members with violations', am:'ጥሰት የፈጸሙ የቡድን አባላት', t:'num'}
    ]},
    { en:'8 · Marketing & social media', am:'8 · ማርኬቲንግ እና ሶሻል ሚዲያ', fields:[
      {id:'posts', en:'Posts made today', am:'ዛሬ የተለጠፉ ፖስቶች', t:'num'},
      {id:'platform', en:'Platform', am:'የትኛው ገጽ (FB / IG / TikTok)', t:'text', opt:1},
      {id:'inq', en:'Inquiries received', am:'የደረሱ ጥያቄዎች', t:'num'},
      {id:'inq_1hr', en:'Inquiries answered within 1 hour', am:'በ1 ሰዓት ውስጥ ምላሽ ያገኙ', t:'ratio'},
      {id:'mkt_leads', en:'Leads generated from marketing today', am:'ከማርኬቲንግ የመጡ አዲስ ደንበኞች', t:'num'}
    ]},
    { en:'9 · Problems and solutions', am:'9 · ችግሮችና መፍትሔዎች', fields:[
      {id:'problem', en:'Problem', am:'ችግር', t:'area', opt:1},
      {id:'cause', en:'Root cause', am:'መሠረታዊ ምክንያት', t:'area', opt:1},
      {id:'action', en:'Action taken', am:'የተወሰደ እርምጃ', t:'area', opt:1},
      {id:'need_chair', en:'Need Chairman decision', am:'የሊቀመንበር ውሳኔ ያስፈልጋል', t:'yesno'}
    ]},
    { en:"10 · Tomorrow's top 3 priorities", am:'10 · ነገ የሚሠሩ ዋና ሦስት ሥራዎች', fields:[
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
      {id:'m2', en:'m² produced today', am:'ዛሬ የተመረተ ካሬ ሜትር', t:'num',
        tgt:{op:'gte', v:40, en:'Daily target 40 m²', am:'የቀን ዒላማ 40 ካሬ ሜትር'}},
      {id:'waste', en:'Waste %', am:'የብክነት መጠን %', t:'pct',
        tgt:{op:'lte', v:20, en:'Must not exceed 20%', am:'ከ20% መብለጥ የለበትም'}},
      {id:'machines', en:'Machines running', am:'በሥራ ላይ ያሉ ማሽኖች', t:'ratio'},
      {id:'downtime', en:'Machine downtime (hours)', am:'ማሽን የቆመበት ሰዓት ብዛት', t:'num'},
      {id:'workers', en:'Workers present', am:'የተገኙ ሠራተኞች', t:'ratio'}
    ]},
    { en:'2 · Quality control', am:'2 · የጥራት ቁጥጥር', fields:[
      {id:'qc_pass', en:'Jobs passed QC today', am:'ዛሬ QC ያለፉ ሥራዎች', t:'num'},
      {id:'qc_fail', en:'Jobs failed QC', am:'QC ያላለፉ ሥራዎች', t:'num'},
      {id:'defects', en:'Defects found', am:'የተገኙ ጉድለቶች', t:'num'},
      {id:'qc_action', en:'Action taken', am:'የተወሰደ እርምጃ', t:'area', opt:1}
    ]},
    { en:'3 · Store & inventory', am:'3 · መጋዘንና ክምችት', fields:[
      {id:'mat_in', en:'Materials received today', am:'ዛሬ የገቡ ዕቃዎች', t:'num'},
      {id:'mat_out', en:'Materials issued today', am:'ዛሬ የወጡ ዕቃዎች', t:'num'},
      {id:'shortage', en:'Stock shortages', am:'የክምችት እጥረት', t:'yesno'},
      {id:'shortage_what', en:'If yes, what', am:'አዎ ከሆነ የትኛው ዕቃ', t:'text', opt:1}
    ]},
    { en:'4 · Purchasing', am:'4 · ግዥ', fields:[
      {id:'pr_sub', en:'Purchase requests submitted', am:'የቀረቡ የግዥ ጥያቄዎች', t:'num'},
      {id:'pr_app', en:'Purchase requests approved', am:'የጸደቁ የግዥ ጥያቄዎች', t:'num'},
      {id:'orders', en:'Orders placed', am:'የተሰጡ ትዕዛዞች', t:'num'},
      {id:'deliv_pending', en:'Deliveries pending', am:'በመጠባበቅ ላይ ያሉ ርክክቦች', t:'num'}
    ]},
    { en:'5 · Delivery & installation', am:'5 · ማድረስና ተከላ', fields:[
      {id:'delivered', en:'Jobs delivered today', am:'ዛሬ ለደንበኛ የተላኩ ሥራዎች', t:'num'},
      {id:'installed', en:'Jobs installed today', am:'ዛሬ የተተከሉ ሥራዎች', t:'num'},
      {id:'ontime', en:'On time', am:'በሰዓቱ', t:'ratio'},
      {id:'accept_signed', en:'Customer acceptance signed', am:'የደንበኛ ተቀባይነት ተፈርሟል', t:'num'},
      {id:'complaints', en:'Complaints received', am:'የደረሱ ቅሬታዎች', t:'num',
        tgt:{op:'lte', v:0, en:'KPI bonus needs zero', am:'ለKPI ቦነስ ዜሮ መሆን አለበት'}}
    ]},
    { en:'6 · Job File handoff', am:'6 · የጆብ ፋይል ርክክብ', fields:[
      {id:'jf_recv', en:'Job Files received from Ephrata', am:'ከኤፍራታ የደረሱ ጆብ ፋይሎች', t:'num'},
      {id:'jf_acc', en:'Job Files accepted', am:'የተቀበልኳቸው', t:'num'},
      {id:'jf_rej', en:'Job Files rejected as incomplete', am:'ያልተሟሉ ስለሆኑ የተመለሱ', t:'num'},
      {id:'jf_reason', en:'Reason for rejection', am:'የመመለሻ ምክንያት', t:'area', opt:1}
    ]},
    { en:'7 · WhatsApp compliance', am:'7 · የዋትስአፕ ተገዢነት', fields:[
      {id:'wa_req', en:'Operations messages required', am:'የሚያስፈልጉ የኦፕሬሽን መልዕክቶች', t:'num'},
      {id:'wa_posted', en:'Operations messages posted', am:'የተለጠፉ መልዕክቶች', t:'num'},
      {id:'wa_assembler', en:'Assembler daily progress posted', am:'የተከላ ሠራተኞች ዕለታዊ ሪፖርት ተለጥፏል', t:'yesno'},
      {id:'wa_unanswered', en:'Messages unanswered over 2 hours', am:'ከ2 ሰዓት በላይ ምላሽ ያላገኙ', t:'num'}
    ]},
    { en:'8 · Problems and solutions', am:'8 · ችግሮችና መፍትሔዎች', fields:[
      {id:'problem', en:'Problem', am:'ችግር', t:'area', opt:1},
      {id:'cause', en:'Root cause', am:'መሠረታዊ ምክንያት', t:'area', opt:1},
      {id:'action', en:'Action taken', am:'የተወሰደ እርምጃ', t:'area', opt:1},
      {id:'need_chair', en:'Need Chairman decision', am:'የሊቀመንበር ውሳኔ ያስፈልጋል', t:'yesno'}
    ]},
    { en:"9 · Tomorrow's top 3 priorities", am:'9 · ነገ የሚሠሩ ዋና ሦስት ሥራዎች', fields:[
      {id:'p1', en:'Priority 1', am:'1ኛ ሥራ', t:'text'},
      {id:'p2', en:'Priority 2', am:'2ኛ ሥራ', t:'text'},
      {id:'p3', en:'Priority 3', am:'3ኛ ሥራ', t:'text'}
    ]}
  ]
},

/* ============================= BETTY — DAILY ============================= */
{
  id:'betty-daily', person:'betty', cadence:'daily', dueTime:'17:30', skipDays:[5],
  en:'Daily Finance Report', am:'ዕለታዊ የፋይናንስ ሪፖርት',
  toEn:'Chairman + Kidan', toAm:'ሊቀመንበር + ኪዳን',
  dueEn:'5:30 PM, Monday to Thursday and Saturday', dueAm:'ከሰኞ እስከ ሐሙስ እና ቅዳሜ ከቀኑ 11፡30 (5:30 PM)',
  penEn:'Late –200 Birr · Missing –500 Birr', penAm:'ዘግይቶ –200 ብር · ካልተላከ –500 ብር',
  derived:1,
  sections:[
    { en:'1 · Cash', am:'1 · ጥሬ ገንዘብ', fields:[
      {id:'cash_in', en:'Cash received today', am:'ዛሬ የገባ ጥሬ ገንዘብ', t:'money'},
      {id:'cash_banked', en:'All cash banked same day', am:'ሁሉም ገንዘብ በዕለቱ ባንክ ገብቷል', t:'yesno'},
      {id:'cash_hand', en:'Cash on hand at close', am:'በመዝጊያ ሰዓት በእጅ ያለ ገንዘብ', t:'money',
        tgt:{op:'lte', v:5000, en:'Over 5,000 Birr overnight is –300 Birr', am:'ከ5,000 ብር በላይ ካደረ –300 ብር'}},
      {id:'cashbook', en:'Cashbook updated today', am:'የገንዘብ መዝገብ ተሞልቷል', t:'yesno'},
      {id:'bank_verified', en:'Bank balance verified against cashbook', am:'የባንክ ቀሪ ከመዝገብ ጋር ተመሳክሯል', t:'yesno'},
      {id:'discrepancy', en:'Cash discrepancy found', am:'የገንዘብ ልዩነት ተገኝቷል', t:'yesno'}
    ]},
    { en:'2 · Bank position', am:'2 · የባንክ ሁኔታ', fields:[
      {id:'bank_total', en:'Total bank balance', am:'ጠቅላላ የባንክ ቀሪ', t:'money',
        tgt:{op:'gte', v:6000000, en:'6 Million Birr Cash Reserve Rule', am:'የ6 ሚሊዮን ብር ክምችት ደንብ'}},
      {id:'below6_reported', en:'If below 6M, reported to Chairman', am:'ከ6ሚ በታች ከሆነ ለሊቀመንበር ተነግሯል', t:'yesno', opt:1}
    ]},
    { en:'3 · Collections & payments', am:'3 · ገቢና ክፍያ', fields:[
      {id:'adv_in', en:'Advance payments received', am:'የገቡ ቅድመ ክፍያዎች', t:'money'},
      {id:'final_in', en:'Final payments received', am:'የገቡ የመጨረሻ ክፍያዎች', t:'money'},
      {id:'pay_approved', en:'Payments approved today', am:'ዛሬ የጸደቁ ክፍያዎች', t:'num'},
      {id:'pay_value', en:'Value of payments approved', am:'የጸደቁ ክፍያዎች ዋጋ', t:'money'},
      {id:'pay_kidan', en:'Payments above 50,000 sent to Kidan', am:'ከ50,000 በላይ ለኪዳን የተላኩ', t:'num'}
    ]},
    { en:'4 · ZamZam Bank', am:'4 · ዘምዘም ባንክ', fields:[
      {id:'zz_transfer', en:'Transferred to ZamZam today', am:'ዛሬ ወደ ዘምዘም የተላለፈ', t:'money'},
      {id:'zz_confirmed', en:'Funds confirmed to Getachew before cheque', am:'ከቼክ በፊት ለጌታቸው ተረጋግጧል', t:'yesno'},
      {id:'zz_register', en:'ZamZam Payment Register updated', am:'የዘምዘም መዝገብ ተሞልቷል', t:'yesno'},
      {id:'zz_disc', en:'Discrepancies found', am:'የተገኙ ልዩነቶች', t:'num',
        tgt:{op:'lte', v:0, en:'Report to Kidan same day', am:'በዕለቱ ለኪዳን ማሳወቅ'}}
    ]},
    { en:'5 · Job Files & WhatsApp groups', am:'5 · ጆብ ፋይልና ዋትስአፕ ግሩፕ', fields:[
      {id:'jf_created', en:'Job Files created today', am:'ዛሬ የተከፈቱ ጆብ ፋይሎች', t:'num'},
      {id:'wa_created', en:'WhatsApp groups created today', am:'ዛሬ የተከፈቱ ዋትስአፕ ግሩፖች', t:'num'},
      {id:'final_req', en:'Final payment requests sent', am:'የተላኩ የመጨረሻ ክፍያ ጥያቄዎች', t:'num'},
      {id:'prod_confirmed', en:'Production confirmations given to Mahelet', am:'ለማህሌት የተሰጡ የምርት ማረጋገጫዎች', t:'num'}
    ]},
    { en:'6 · Assembler payments', am:'6 · የተከላ ሠራተኞች ክፍያ', fields:[
      {id:'asm_reserved', en:'Amount reserved today', am:'ዛሬ የተያዘ መጠን', t:'money'},
      {id:'asm_released', en:'Payments released today', am:'ዛሬ የተለቀቁ ክፍያዎች', t:'num'},
      {id:'asm_slips', en:'Payment Confirmation Slips issued', am:'የተሰጡ የክፍያ ማረጋገጫ ወረቀቶች', t:'num'},
      {id:'asm_disputes', en:'Open disputes', am:'ያልተፈቱ ክርክሮች', t:'num',
        tgt:{op:'lte', v:0, en:'Resolve within 48 hours', am:'በ48 ሰዓት ውስጥ መፍታት'}}
    ]},
    { en:'7 · Job Tracking Board', am:'7 · የሥራ መከታተያ ቦርድ', fields:[
      {id:'board_moved', en:'Job cards moved today', am:'ዛሬ የተንቀሳቀሱ ካርዶች', t:'num'},
      {id:'board_match', en:'Board matches physical files', am:'ቦርዱ ከፋይሎቹ ጋር ይመሳሰላል', t:'yesno'},
      {id:'board_mismatch', en:'Mismatches found', am:'የተገኙ አለመጣጣሞች', t:'num'}
    ]},
    { en:'8 · Documents', am:'8 · ሰነዶች', fields:[
      {id:'doc_inv', en:'Supplier invoices collected', am:'የተሰበሰቡ የአቅራቢ ደረሰኞች', t:'num'},
      {id:'doc_dn', en:'Delivery notes collected', am:'የተሰበሰቡ የርክክብ ወረቀቶች', t:'num'},
      {id:'doc_missing', en:'Documents still missing', am:'እስካሁን የጎደሉ ሰነዶች', t:'num'}
    ]},
    { en:'9 · Problems and solutions', am:'9 · ችግሮችና መፍትሔዎች', fields:[
      {id:'problem', en:'Problem', am:'ችግር', t:'area', opt:1},
      {id:'action', en:'Action taken', am:'የተወሰደ እርምጃ', t:'area', opt:1},
      {id:'need_chair', en:'Need Chairman decision', am:'የሊቀመንበር ውሳኔ ያስፈልጋል', t:'yesno'}
    ]}
  ]
},

/* =========================== GETACHEW — DAILY =========================== */
{
  id:'getachew-daily', person:'getachew', cadence:'daily', dueTime:'17:30',
  en:'Daily Purchasing Report', am:'ዕለታዊ የግዥ ሪፖርት',
  toEn:'Chairman, copied to Mahelet and Betty', toAm:'ሊቀመንበር፣ ግልባጭ ለማህሌትና ለቤቲ',
  dueEn:'5:30 PM every working day', dueAm:'በየሥራ ቀኑ ከቀኑ 11፡30 (5:30 PM)',
  penEn:'Late –200 Birr · Missing –500 Birr', penAm:'ዘግይቶ –200 ብር · ካልተላከ –500 ብር',
  derived:1,
  sections:[
    { en:'1 · Purchase requests', am:'1 · የግዥ ጥያቄዎች', fields:[
      {id:'pr_prep', en:'Purchase requests prepared', am:'የተዘጋጁ የግዥ ጥያቄዎች', t:'num'},
      {id:'pr_sub', en:'Submitted to Betty', am:'ለቤቲ የቀረቡ', t:'num'},
      {id:'pr_app', en:'Approved by Betty', am:'በቤቲ የጸደቁ', t:'num'},
      {id:'pr_ret', en:'Returned or rejected', am:'የተመለሱ ወይም ያልጸደቁ', t:'num'},
      {id:'pr_quotes', en:'Requests with 3 or more quotes', am:'3 እና ከዚያ በላይ ፕሮፎርማ ያላቸው ጥያቄዎች', t:'ratio'}
    ]},
    { en:'2 · ZamZam Bank cheques', am:'2 · የዘምዘም ባንክ ቼኮች', fields:[
      {id:'chq_issued', en:'Cheques issued today', am:'ዛሬ የተሰጡ ቼኮች', t:'num'},
      {id:'chq_value', en:'Total cheque value', am:'ጠቅላላ የቼክ ዋጋ', t:'money'},
      {id:'chq_confirmed', en:'Betty confirmed funds before every cheque', am:'ከእያንዳንዱ ቼክ በፊት ቤቲ አረጋግጣለች', t:'yesno'},
      {id:'chq_secure', en:'Cheque book secured at close', am:'የቼክ ደብተር በመዝጊያ ሰዓት ተቆልፏል', t:'yesno'}
    ]},
    { en:'3 · Orders placed', am:'3 · የተሰጡ ትዕዛዞች', fields:[
      {id:'ord_placed', en:'Orders placed today', am:'ዛሬ የተሰጡ ትዕዛዞች', t:'num'},
      {id:'ord_suppliers', en:'Suppliers used', am:'የተጠቀምኳቸው አቅራቢዎች', t:'text', opt:1},
      {id:'ord_dates', en:'Delivery dates confirmed', am:'የተረጋገጡ የርክክብ ቀኖች', t:'num'}
    ]},
    { en:'4 · Deliveries', am:'4 · ርክክብ', fields:[
      {id:'del_recv', en:'Deliveries received at store', am:'መጋዘን የደረሱ ርክክቦች', t:'num'},
      {id:'del_rej', en:'Materials rejected by store', am:'በመጋዘን ያልተቀበሉ ዕቃዎች', t:'num'},
      {id:'del_repl', en:'Replacement or refund requested', am:'ምትክ ወይም ተመላሽ ተጠይቋል', t:'yesno', opt:1}
    ]},
    { en:'5 · Documents to Betty', am:'5 · ለቤቲ የተላኩ ሰነዶች', fields:[
      {id:'doc_24', en:'Documents submitted within 24 hours', am:'በ24 ሰዓት ውስጥ የቀረቡ ሰነዶች', t:'ratio'},
      {id:'doc_missing', en:'Documents still outstanding', am:'እስካሁን ያልቀረቡ ሰነዶች', t:'num',
        tgt:{op:'lte', v:0, en:'–200 Birr per document', am:'በሰነድ –200 ብር'}}
    ]},
    { en:'6 · Supplier issues', am:'6 · የአቅራቢ ችግሮች', fields:[
      {id:'sup_delay', en:'Supplier delays', am:'የአቅራቢ መዘግየቶች', t:'num'},
      {id:'sup_price', en:'Price changes', am:'የዋጋ ለውጦች', t:'num'},
      {id:'sup_quality', en:'Quality issues', am:'የጥራት ችግሮች', t:'num'},
      {id:'sup_reported', en:'Reported to Mahelet and Betty', am:'ለማህሌትና ለቤቲ ተነግሯል', t:'yesno'}
    ]},
    { en:'7 · Problems and solutions', am:'7 · ችግሮችና መፍትሔዎች', fields:[
      {id:'problem', en:'Problem', am:'ችግር', t:'area', opt:1},
      {id:'action', en:'Action taken', am:'የተወሰደ እርምጃ', t:'area', opt:1},
      {id:'need_chair', en:'Need Chairman decision', am:'የሊቀመንበር ውሳኔ ያስፈልጋል', t:'yesno'}
    ]}
  ]
},

/* =========================== YORDANOS — DAILY =========================== */
{
  id:'yordanos-daily', person:'yordanos', cadence:'daily', dueTime:'17:30',
  en:'Daily Store Report', am:'ዕለታዊ የመጋዘን ሪፖርት',
  toEn:'Chairman, copied to Mahelet and Betty', toAm:'ሊቀመንበር፣ ግልባጭ ለማህሌትና ለቤቲ',
  dueEn:'5:30 PM every working day', dueAm:'በየሥራ ቀኑ ከቀኑ 11፡30 (5:30 PM)',
  penEn:'Reports are mandatory daily', penAm:'ሪፖርት በየቀኑ ግዴታ ነው',
  derived:1,
  sections:[
    { en:'1 · Receiving', am:'1 · ዕቃ መረከብ', fields:[
      {id:'rec_deliv', en:'Deliveries received today', am:'ዛሬ የደረሱ ርክክቦች', t:'num'},
      {id:'rec_checked', en:'Checked against Job File / BOM', am:'ከጆብ ፋይል / BOM ጋር የተመሳከሩ', t:'ratio'},
      {id:'rec_accepted', en:'Accepted into store', am:'ወደ መጋዘን የገቡ', t:'num'},
      {id:'rec_rejected', en:'Rejected', am:'ያልተቀበልኳቸው ዕቃዎች', t:'num'},
      {id:'rec_grn', en:'Goods received notes signed', am:'የተፈረሙ የዕቃ መረከቢያ ወረቀቶች', t:'num'}
    ]},
    { en:'2 · Rejections', am:'2 · ያልተቀበልኳቸው ዕቃዎች', fields:[
      {id:'rej_reason', en:'Reason for rejection', am:'ያልተቀበልኩበት ምክንያት', t:'area', opt:1},
      {id:'rej_photo', en:'Documented with photos', am:'በፎቶ ተመዝግቧል', t:'yesno', opt:1},
      {id:'rej_reported', en:'Reported to Getachew and Betty', am:'ለጌታቸውና ለቤቲ ተነግሯል', t:'yesno', opt:1}
    ]},
    { en:'3 · Stock record', am:'3 · የክምችት መዝገብ', fields:[
      {id:'st_open', en:'Opening stock items', am:'የጠዋት (የመክፈቻ) ክምችት', t:'num'},
      {id:'st_in', en:'Materials received', am:'የገቡ ዕቃዎች', t:'num'},
      {id:'st_out', en:'Materials issued', am:'የወጡ ዕቃዎች', t:'num'},
      {id:'st_close', en:'Closing stock items', am:'የማታ (የመዝጊያ) ክምችት', t:'num'},
      {id:'st_disc', en:'Discrepancies found', am:'የተገኙ ልዩነቶች', t:'num',
        tgt:{op:'lte', v:0, en:'–500 Birr each · report same day', am:'እያንዳንዱ –500 ብር · በዕለቱ ማሳወቅ'}}
    ]},
    { en:'4 · Issuing materials', am:'4 · ዕቃ ማውጣት', fields:[
      {id:'iss_count', en:'Issues made today', am:'ዛሬ ከመጋዘን የወጡ ዕቃዎች', t:'num'},
      {id:'iss_approved', en:"All issued with Mahelet's signed approval", am:'ሁሉም በማህሌት ፊርማ ፈቃድ ወጥተዋል', t:'yesno'},
      {id:'iss_correct', en:'All issued to the correct job', am:'ሁሉም ለትክክለኛው ሥራ ወጥተዋል', t:'yesno'}
    ]},
    { en:'5 · Shortages', am:'5 · እጥረቶች', fields:[
      {id:'sh_flagged', en:'Shortages flagged today', am:'ዛሬ የተጠቆሙ እጥረቶች', t:'num'},
      {id:'sh_stopped', en:'Production stopped due to shortage', am:'በእጥረት ምክንያት ምርት ቆሟል', t:'yesno'},
      {id:'sh_what', en:'Which materials', am:'የትኞቹ ዕቃዎች', t:'text', opt:1}
    ]},
    { en:'6 · Factory consumables', am:'6 · የፋብሪካ ፍጆታ ዕቃዎች', fields:[
      {id:'con_today', en:'Consumables issued today', am:'ዛሬ የወጡ ፍጆታ ዕቃዎች', t:'num'},
      {id:'con_mtd', en:'Month-to-date consumable spend', am:'ከወሩ መጀመሪያ ጀምሮ የወጣ', t:'money',
        tgt:{op:'lte', v:30000, en:'Budget 30,000 Birr/month', am:'የወር በጀት 30,000 ብር'}}
    ]},
    { en:'7 · Store condition', am:'7 · የመጋዘን ሁኔታ', fields:[
      {id:'sec_locked', en:'Store secure at close', am:'መጋዘኑ በመዝጊያ ሰዓት ተቆልፏል', t:'yesno'},
      {id:'sec_theft', en:'Theft or unauthorized removal', am:'ስርቆት ወይም ያልተፈቀደ ማውጣት', t:'yesno'},
      {id:'sec_sep', en:'Job materials separated from consumables', am:'የሥራ ዕቃና የፍጆታ ዕቃ ተለያይተዋል', t:'yesno'}
    ]},
    { en:'8 · Problems and solutions', am:'8 · ችግሮችና መፍትሔዎች', fields:[
      {id:'problem', en:'Problem', am:'ችግር', t:'area', opt:1},
      {id:'action', en:'Action taken', am:'የተወሰደ እርምጃ', t:'area', opt:1},
      {id:'need_chair', en:'Need Chairman decision', am:'የሊቀመንበር ውሳኔ ያስፈልጋል', t:'yesno'}
    ]}
  ]
},

/* ========================= EPHRATA — WEEKLY ========================= */
{
  id:'ephrata-weekly', person:'ephrata', cadence:'weekly', dueTime:'16:00', dueDay:5,
  en:'Weekly Commercial Report', am:'ሳምንታዊ የንግድ ሪፖርት',
  toEn:'Chairman', toAm:'ሊቀመንበር',
  dueEn:'Friday 4:00 PM', dueAm:'ዓርብ ከቀኑ 10፡00 (4:00 PM)',
  penEn:'Late –500 Birr', penAm:'ዘግይቶ –500 ብር',
  sections:[
    { en:'1 · Sales performance', am:'1 · የሽያጭ አፈጻጸም', fields:[
      {id:'w_contracts', en:'Contracts signed this week', am:'በዚህ ሳምንት የተፈረሙ ውሎች', t:'num'},
      {id:'w_value', en:'Total contract value', am:'ጠቅላላ የውል ዋጋ', t:'money'},
      {id:'w_external', en:'Total external collections', am:'ከደንበኞች የተሰበሰበ ጠቅላላ ገንዘብ', t:'money',
        tgt:{op:'gte', v:3000000, en:'Below 3,000,000 Birr is a failed week — no commission',
             am:'ከ3,000,000 ብር በታች ከሆነ ሳምንቱ ወድቋል — ኮሚሽን የለም'}},
      {id:'w_internal', en:'Total internal collections', am:'የውስጥ ጠቅላላ ገቢ', t:'money'},
      {id:'w_target_met', en:'Weekly target of 6,000,000 Birr met', am:'የሳምንቱ ዒላማ 6,000,000 ብር ተሳክቷል', t:'yesno'}
    ]},
    { en:'2 · Lead performance', am:'2 · የደንበኛ አፈጻጸም', fields:[
      {id:'w_leads', en:'Total new leads', am:'ጠቅላላ አዲስ ደንበኞች', t:'num'},
      {id:'w_leads_1hr', en:'Leads contacted within 1 hour', am:'በ1 ሰዓት ውስጥ የተደወለላቸው', t:'ratio'},
      {id:'w_visits', en:'Site visits completed', am:'የተከናወኑ የቦታ ጉብኝቶች', t:'num'},
      {id:'w_quotes', en:'Quotations issued', am:'የተሰጡ ፕሮፎርማዎች', t:'num'},
      {id:'w_conv', en:'Conversion rate, leads to contracts', am:'ከደንበኛ ወደ ውል የተቀየረበት መጠን', t:'pct'}
    ]},
    { en:'3 · Margin performance', am:'3 · የትርፍ ህዳግ አፈጻጸም', fields:[
      {id:'w_margin', en:'Average margin per m², external', am:'በካሬ ሜትር አማካይ ህዳግ', t:'num',
        tgt:{op:'gte', v:6000, en:'Margin floor 6,000 Birr/m²', am:'ዝቅተኛው ህዳግ 6,000 ብር በካሬ'}},
      {id:'w_below_margin', en:'Contracts below the margin floor', am:'ከህዳጉ በታች የተፈረሙ ውሎች', t:'num',
        tgt:{op:'lte', v:0, en:'–5,000 Birr each without Chairman approval',
             am:'ያለ ሊቀመንበር ፈቃድ እያንዳንዱ –5,000 ብር'}}
    ]},
    { en:'4 · WhatsApp compliance', am:'4 · የዋትስአፕ ተገዢነት', fields:[
      {id:'w_wa_groups', en:'Customer groups active', am:'ንቁ የደንበኛ ግሩፖች', t:'num'},
      {id:'w_wa_msgs', en:'Stage messages posted', am:'የተላኩ የደረጃ መልዕክቶች', t:'ratio'},
      {id:'w_wa_rate', en:'Compliance rate', am:'የተገዢነት መጠን', t:'pct',
        tgt:{op:'gte', v:100, en:'100% required for the team bonus', am:'ለቡድን ቦነስ 100% መሆን አለበት'}},
      {id:'w_wa_unans', en:'Messages unanswered over 2 hours', am:'ከ2 ሰዓት በላይ ምላሽ ያላገኙ', t:'num'},
      {id:'w_wa_complaints', en:'Customer complaints about WhatsApp', am:'በዋትስአፕ ላይ የደንበኛ ቅሬታ', t:'num'},
      {id:'w_wa_viol', en:'Team violations', am:'የቡድን ጥሰቶች', t:'num'}
    ]},
    { en:'5 · Marketing performance', am:'5 · የማርኬቲንግ አፈጻጸም', fields:[
      {id:'w_posts', en:'Posts made this week', am:'በዚህ ሳምንት የተለጠፉ ፖስቶች', t:'num',
        tgt:{op:'gte', v:3, en:'At least 3 per week — –300 Birr per missed post',
             am:'በሳምንት ቢያንስ 3 — ላልተለጠፈ እያንዳንዱ –300 ብር'}},
      {id:'w_fb', en:'Facebook', am:'ፌስቡክ', t:'num', i:1},
      {id:'w_ig', en:'Instagram', am:'ኢንስታግራም', t:'num', i:1},
      {id:'w_tt', en:'TikTok', am:'ቲክቶክ', t:'num', i:1},
      {id:'w_inq', en:'Inquiries received', am:'የደረሱ ጥያቄዎች', t:'num'},
      {id:'w_inq_1hr', en:'Inquiries answered within 1 hour', am:'በ1 ሰዓት ውስጥ ምላሽ ያገኙ', t:'num'},
      {id:'w_mkt_leads', en:'Leads generated from marketing', am:'ከማርኬቲንግ የመጡ አዲስ ደንበኞች', t:'num',
        tgt:{op:'gte', v:15, en:'15 or more earns 1,000 Birr', am:'15 እና ከዚያ በላይ 1,000 ብር ያስገኛል'}},
      {id:'w_mkt_contracts', en:'Contracts from marketing leads', am:'ከማርኬቲንግ ደንበኞች የተገኙ ውሎች', t:'num'}
    ]},
    { en:'6 · Customer satisfaction', am:'6 · የደንበኛ እርካታ', fields:[
      {id:'w_comp_in', en:'Complaints received this week', am:'በዚህ ሳምንት የደረሱ ቅሬታዎች', t:'num'},
      {id:'w_comp_done', en:'Complaints resolved', am:'የተፈቱ ቅሬታዎች', t:'num'},
      {id:'w_comp_open', en:'Complaints outstanding', am:'ያልተፈቱ ቅሬታዎች', t:'num',
        tgt:{op:'lte', v:0, en:'Zero valid complaints required for the team bonus',
             am:'ለቡድን ቦነስ ዜሮ ቅሬታ ያስፈልጋል'}},
      {id:'w_sat', en:'Average satisfaction score out of 5', am:'አማካይ የእርካታ ነጥብ ከ5', t:'num'}
    ]},
    { en:'7 · Problems and solutions', am:'7 · ችግሮችና መፍትሔዎች', fields:[
      {id:'w_problem', en:'Problem', am:'ችግር', t:'area', opt:1},
      {id:'w_action', en:'Action taken', am:'የተወሰደ እርምጃ', t:'area', opt:1},
      {id:'w_open', en:'Outstanding issues', am:'ያልተጠናቀቁ ጉዳዮች', t:'area', opt:1}
    ]},
    { en:"8 · Next week's plan", am:'8 · የሚቀጥለው ሳምንት ዕቅድ', fields:[
      {id:'w_next_contracts', en:'Contracts expected', am:'የሚጠበቁ ውሎች', t:'num'},
      {id:'w_next_value', en:'Value expected', am:'የሚጠበቅ ዋጋ', t:'money'},
      {id:'w_next_customers', en:'Key customers in negotiation', am:'በድርድር ላይ ያሉ ዋና ደንበኞች', t:'area'},
      {id:'w_next_support', en:'Support needed from Chairman', am:'ከሊቀመንበሩ የሚፈለግ ድጋፍ', t:'area', opt:1}
    ]},
    { en:'9 · 4-week rolling total', am:'9 · የ4 ሳምንት ድምር', fields:[
      {id:'r_w1', en:'Week 1', am:'ሳምንት 1', t:'money'},
      {id:'r_w2', en:'Week 2', am:'ሳምንት 2', t:'money'},
      {id:'r_w3', en:'Week 3', am:'ሳምንት 3', t:'money'},
      {id:'r_w4', en:'Week 4', am:'ሳምንት 4', t:'money'},
      {id:'r_total', en:'Rolling 4-week total', am:'የ4 ሳምንት ጠቅላላ ድምር', t:'money',
        tgt:{op:'gte', v:12000000, en:'Below 12,000,000 Birr is –5,000 Birr',
             am:'ከ12,000,000 ብር በታች ከሆነ –5,000 ብር'}},
      {id:'r_conseq', en:'Consequence applied, if any', am:'የተወሰደ እርምጃ ካለ', t:'text', opt:1}
    ]}
  ]
},

/* ========================= MAHELET — WEEKLY ========================= */
{
  id:'liu-weekly', person:'liu', cadence:'weekly', dueTime:'15:00', dueDay:5,
  en:'Weekly Production & Delivery Summary', am:'ሳምንታዊ የምርትና የማድረስ ሪፖርት',
  toEn:'Chairman', toAm:'ሊቀመንበር',
  dueEn:'Friday 3:00 PM', dueAm:'ዓርብ ከቀኑ 9፡00 (3:00 PM)',
  penEn:'Late –500 Birr', penAm:'ዘግይቶ –500 ብር',
  sections:[
    { en:'1 · Production performance', am:'1 · የምርት አፈጻጸም', fields:[
      {id:'p_total', en:'Total m² produced this week', am:'በዚህ ሳምንት የተመረተ ጠቅላላ ካሬ ሜትር', t:'num',
        tgt:{op:'gte', v:240, en:'Weekly target 240 m²', am:'የሳምንቱ ዒላማ 240 ካሬ ሜትር'}},
      {id:'p_avg', en:'Average daily production', am:'አማካይ የቀን ምርት', t:'num',
        tgt:{op:'gte', v:40, en:'Daily target 40 m²', am:'የቀን ዒላማ 40 ካሬ ሜትር'}},
      {id:'p_waste', en:'Waste %', am:'የብክነት መጠን %', t:'pct',
        tgt:{op:'lte', v:20, en:'Must not exceed 20%', am:'ከ20% መብለጥ የለበትም'}},
      {id:'p_uptime', en:'Machine uptime %', am:'ማሽን የሠራበት መጠን %', t:'pct',
        tgt:{op:'gte', v:95, en:'95%+ earns 400 Birr, below 90% is –300 Birr',
             am:'ከ95% በላይ 400 ብር፣ ከ90% በታች –300 ብር'}}
    ]},
    { en:'2 · Quality control', am:'2 · የጥራት ቁጥጥር', fields:[
      {id:'q_checked', en:'Total jobs QC checked', am:'በQC የተመረመሩ ጠቅላላ ሥራዎች', t:'num'},
      {id:'q_pass', en:'Jobs passed', am:'ያለፉ ሥራዎች', t:'num'},
      {id:'q_fail', en:'Jobs failed', am:'ያላለፉ ሥራዎች', t:'num'},
      {id:'q_rate', en:'QC pass rate', am:'የQC ማለፊያ መጠን', t:'pct',
        tgt:{op:'gte', v:98, en:'Target ≥98% — below is –500 Birr/month',
             am:'ዒላማ ≥98% — በታች ከሆነ በወር –500 ብር'}}
    ]},
    { en:'3 · Store & inventory', am:'3 · መጋዘንና ክምችት', fields:[
      {id:'s_accuracy', en:'Stock accuracy', am:'የክምችት ትክክለኛነት', t:'pct',
        tgt:{op:'gte', v:99, en:'Target ≥99%', am:'ዒላማ ≥99%'}},
      {id:'s_disc', en:'Stock discrepancies', am:'የክምችት ልዩነቶች', t:'num'},
      {id:'s_short', en:'Shortages reported', am:'የተነገሩ እጥረቶች', t:'num'}
    ]},
    { en:'4 · Purchasing', am:'4 · ግዥ', fields:[
      {id:'pu_total', en:'Total purchase requests', am:'ጠቅላላ የግዥ ጥያቄዎች', t:'num'},
      {id:'pu_acc', en:'Purchase accuracy', am:'የግዥ ትክክለኛነት', t:'pct',
        tgt:{op:'gte', v:95, en:'Target ≥95%', am:'ዒላማ ≥95%'}},
      {id:'pu_ontime', en:'Deliveries on time', am:'በሰዓቱ የደረሱ ዕቃዎች', t:'ratio'}
    ]},
    { en:'5 · Delivery & installation', am:'5 · ማድረስና ተከላ', fields:[
      {id:'d_delivered', en:'Total jobs delivered', am:'ጠቅላላ የተላኩ ሥራዎች', t:'num'},
      {id:'d_installed', en:'Total jobs installed', am:'ጠቅላላ የተተከሉ ሥራዎች', t:'num'},
      {id:'d_ontime', en:'On-time delivery rate', am:'በሰዓቱ የመድረስ መጠን', t:'pct',
        tgt:{op:'gte', v:95, en:'Target ≥95%', am:'ዒላማ ≥95%'}},
      {id:'d_inst_ontime', en:'On-time installation rate', am:'በሰዓቱ የመተከል መጠን', t:'pct',
        tgt:{op:'gte', v:95, en:'Target ≥95%', am:'ዒላማ ≥95%'}},
      {id:'d_complaints', en:'Customer complaints', am:'የደንበኛ ቅሬታዎች', t:'num'},
      {id:'d_resolved', en:'Complaints resolved', am:'የተፈቱ ቅሬታዎች', t:'num'}
    ]},
    { en:'6 · Job File handoff', am:'6 · የጆብ ፋይል ርክክብ', fields:[
      {id:'j_recv', en:'Job Files received from Ephrata', am:'ከኤፍራታ የደረሱ ጆብ ፋይሎች', t:'num'},
      {id:'j_acc', en:'Accepted', am:'የተቀበልኳቸው', t:'num'},
      {id:'j_rej', en:'Rejected', am:'የመለስኳቸው', t:'num'},
      {id:'j_reason', en:'Reason for rejections', am:'የመመለሻ ምክንያት', t:'area', opt:1}
    ]},
    { en:'7 · WhatsApp compliance', am:'7 · የዋትስአፕ ተገዢነት', fields:[
      {id:'wa_rate', en:'Operations compliance rate', am:'የኦፕሬሽን ተገዢነት መጠን', t:'pct',
        tgt:{op:'gte', v:100, en:'100% required for the KPI bonus', am:'ለKPI ቦነስ 100% ያስፈልጋል'}},
      {id:'wa_asm', en:'Days assembler progress was posted', am:'የተከላ ሪፖርት የተላከባቸው ቀናት', t:'ratio'},
      {id:'wa_comp', en:'Customer complaints about operations communication',
        am:'በኦፕሬሽን ግንኙነት ላይ የደንበኛ ቅሬታ', t:'num'}
    ]},
    { en:'8 · 15-day production plan status', am:'8 · የ15 ቀን የምርት ዕቅድ ሁኔታ', fields:[
      {id:'pl_sent', en:'Plan submitted on time', am:'ዕቅዱ በሰዓቱ ቀርቧል', t:'yesno'},
      {id:'pl_onsched', en:'Jobs completed on schedule', am:'በዕቅዱ መሠረት የተጠናቀቁ ሥራዎች', t:'ratio'},
      {id:'pl_delayed', en:'Jobs delayed', am:'የዘገዩ ሥራዎች', t:'num'},
      {id:'pl_reason', en:'Reason for delays', am:'የመዘግየት ምክንያት', t:'area', opt:1},
      {id:'pl_unpaid', en:"Jobs included without Betty's payment confirmation",
        am:'ያለ ቤቲ የክፍያ ማረጋገጫ የገቡ ሥራዎች', t:'num',
        tgt:{op:'lte', v:0, en:'–5,000 Birr per job', am:'በሥራ –5,000 ብር'}}
    ]},
    { en:'9 · Problems and solutions', am:'9 · ችግሮችና መፍትሔዎች', fields:[
      {id:'w_problem', en:'Problem', am:'ችግር', t:'area', opt:1},
      {id:'w_action', en:'Action taken', am:'የተወሰደ እርምጃ', t:'area', opt:1},
      {id:'w_open', en:'Outstanding issues', am:'ያልተጠናቀቁ ጉዳዮች', t:'area', opt:1}
    ]},
    { en:"10 · Next week's plan", am:'10 · የሚቀጥለው ሳምንት ዕቅድ', fields:[
      {id:'n_target', en:'Production target in m²', am:'የምርት ዒላማ በካሬ ሜትር', t:'num'},
      {id:'n_jobs', en:'Key jobs to complete', am:'መጠናቀቅ ያለባቸው ዋና ሥራዎች', t:'area'},
      {id:'n_support', en:'Support needed from Chairman', am:'ከሊቀመንበሩ የሚፈለግ ድጋፍ', t:'area', opt:1}
    ]}
  ]
},

/* ==================== BETELHEM — WEEKLY FINANCE ==================== */
{
  id:'betty-weekly', person:'betty', cadence:'weekly', dueTime:'17:00', dueDay:5,
  en:'Weekly Finance Report', am:'ሳምንታዊ የፋይናንስ ሪፖርት',
  toEn:'Chairman + Kidan', toAm:'ሊቀመንበር + ኪዳን',
  dueEn:'Friday 5:00 PM', dueAm:'ዓርብ ከቀኑ 11፡00 (5:00 PM)',
  penEn:'Late –500 Birr · Wrong information –500 to –1,000 Birr',
  penAm:'ዘግይቶ –500 ብር · የተሳሳተ መረጃ –500 እስከ –1,000 ብር',
  derived:1,
  sections:[
    { en:'1 · Collections this week', am:'1 · የዚህ ሳምንት ገቢ', fields:[
      {id:'f_adv', en:'Advance payments received', am:'የገቡ ቅድመ ክፍያዎች', t:'money'},
      {id:'f_final', en:'Final payments received', am:'የገቡ የመጨረሻ ክፍያዎች', t:'money'},
      {id:'f_total', en:'Total collected', am:'ጠቅላላ የተሰበሰበ', t:'money'},
      {id:'f_banked', en:'All cash banked same day, every day', am:'ገንዘቡ ሁሉ በየዕለቱ ባንክ ገብቷል', t:'yesno'}
    ]},
    { en:'2 · Cash position', am:'2 · የገንዘብ ሁኔታ', fields:[
      {id:'f_bank', en:'Bank balance at week end', am:'በሳምንቱ መጨረሻ የባንክ ቀሪ', t:'money',
        tgt:{op:'gte', v:6000000, en:'6 Million Birr Cash Reserve Rule', am:'የ6 ሚሊዮን ብር ክምችት ደንብ'}},
      {id:'f_recon', en:'Monday bank reconciliation completed', am:'የሰኞ የባንክ ማስታረቅ ተጠናቋል', t:'yesno'},
      {id:'f_disc', en:'Cash discrepancies this week', am:'በዚህ ሳምንት የተገኙ የገንዘብ ልዩነቶች', t:'num',
        tgt:{op:'lte', v:0, en:'–500 Birr each', am:'እያንዳንዱ –500 ብር'}},
      {id:'f_shortfall', en:'Cash shortfall flagged in advance', am:'የገንዘብ እጥረት አስቀድሞ ተነግሯል', t:'yesno', opt:1}
    ]},
    { en:'3 · ZamZam Bank reconciliation', am:'3 · የዘምዘም ባንክ ማስታረቅ', fields:[
      {id:'z_recon', en:'ZamZam reconciled this Monday', am:'ዘምዘም በዚህ ሰኞ ታርቋል', t:'yesno'},
      {id:'z_transfers', en:'Transfers made this week', am:'በዚህ ሳምንት የተደረጉ ዝውውሮች', t:'num'},
      {id:'z_value', en:'Total transferred', am:'ጠቅላላ የተላለፈ', t:'money'},
      {id:'z_matched', en:'Transfers matched to approved requests', am:'ከጸደቁ ጥያቄዎች ጋር የተመሳከሩ', t:'ratio'},
      {id:'z_cheques', en:'Cheques matched to supplier invoices', am:'ከአቅራቢ ደረሰኝ ጋር የተመሳከሩ ቼኮች', t:'ratio'},
      {id:'z_errors', en:'Reconciliation errors', am:'የማስታረቅ ስህተቶች', t:'num',
        tgt:{op:'lte', v:0, en:'Zero errors earns the 1,000 Birr bonus',
             am:'ዜሮ ስህተት 1,000 ብር ቦነስ ያስገኛል'}}
    ]},
    { en:'4 · Payments approved', am:'4 · የጸደቁ ክፍያዎች', fields:[
      {id:'a_count', en:'Payments approved this week', am:'በዚህ ሳምንት የጸደቁ ክፍያዎች', t:'num'},
      {id:'a_value', en:'Total value approved', am:'ጠቅላላ የጸደቀ ዋጋ', t:'money'},
      {id:'a_kidan', en:'Payments above 50,000 Birr sent to Kidan', am:'ከ50,000 ብር በላይ ለኪዳን የተላኩ', t:'num'},
      {id:'a_unauth', en:'Payments made without proper approval', am:'ያለ ፈቃድ የተፈጸሙ ክፍያዎች', t:'num',
        tgt:{op:'lte', v:0, en:'–5,000 Birr each', am:'እያንዳንዱ –5,000 ብር'}}
    ]},
    { en:'5 · Assembler payments', am:'5 · የተከላ ሠራተኞች ክፍያ', fields:[
      {id:'as_reserved', en:'Amount reserved this week', am:'በዚህ ሳምንት የተያዘ መጠን', t:'money'},
      {id:'as_released', en:'Payments released', am:'የተለቀቁ ክፍያዎች', t:'num'},
      {id:'as_late', en:'Payments later than 3 working days', am:'ከ3 የሥራ ቀናት በኋላ የተለቀቁ', t:'num',
        tgt:{op:'lte', v:0, en:'–300 Birr per day late', am:'በዘገየ ቀን –300 ብር'}},
      {id:'as_disputes', en:'Disputes still open', am:'ያልተፈቱ ክርክሮች', t:'num'}
    ]},
    { en:'6 · Registers, board and documents', am:'6 · መዝገቦች፣ ቦርድና ሰነዶች', fields:[
      {id:'r_registers', en:'All registers up to date', am:'ሁሉም መዝገቦች ተሞልተዋል', t:'yesno'},
      {id:'r_board', en:'Board matched physical files all week', am:'ቦርዱ ሳምንቱን ሙሉ ከፋይሎቹ ጋር ተመሳስሏል', t:'yesno'},
      {id:'r_docs_missing', en:'Documents still missing', am:'እስካሁን የጎደሉ ሰነዶች', t:'num'},
      {id:'r_joblist', en:'Payment-confirmed job list sent to Mahelet by Friday 1:00 PM',
        am:'የክፍያ ማረጋገጫ ዝርዝር ዓርብ ከቀኑ 7፡00 ለማህሌት ተልኳል', t:'yesno'}
    ]},
    { en:'7 · Problems and solutions', am:'7 · ችግሮችና መፍትሔዎች', fields:[
      {id:'w_problem', en:'Problem', am:'ችግር', t:'area', opt:1},
      {id:'w_action', en:'Action taken', am:'የተወሰደ እርምጃ', t:'area', opt:1},
      {id:'w_support', en:'Support needed from Chairman', am:'ከሊቀመንበሩ የሚፈለግ ድጋፍ', t:'area', opt:1}
    ]}
  ]
},

/* ============== BETELHEM — WEEKLY CUSTOMER EXPERIENCE ============== */
{
  id:'betty-weekly-cx', person:'betty', cadence:'weekly', dueTime:'11:00', dueDay:1,
  en:'Weekly Customer Experience Summary', am:'ሳምንታዊ የደንበኛ አገልግሎት ሪፖርት',
  toEn:'Chairman + Ephrata + Kidan', toAm:'ሊቀመንበር + ኤፍራታ + ኪዳን',
  dueEn:'Monday 11:00 AM', dueAm:'ሰኞ ከጠዋቱ 5፡00 (11:00 AM)',
  penEn:'Late –500 Birr', penAm:'ዘግይቶ –500 ብር',
  derived:1,
  sections:[
    { en:'1 · Customer pulse this week', am:'1 · የዚህ ሳምንት የደንበኛ ስሜት', fields:[
      {id:'cx_groups', en:'Customer groups monitored', am:'የተከታተልኳቸው የደንበኛ ግሩፖች', t:'num'},
      {id:'cx_contacted', en:'Customers contacted directly', am:'በቀጥታ ያነጋገርኳቸው ደንበኞች', t:'num'},
      {id:'cx_reports', en:'Daily pulse reports sent on time', am:'በሰዓቱ የተላኩ ዕለታዊ ሪፖርቶች', t:'ratio',
        tgt:{op:'gte', v:5, en:'All 5 on time earns the 3,000 Birr bonus',
             am:'አምስቱም በሰዓቱ ከተላኩ 3,000 ብር ቦነስ'}}
    ]},
    { en:'2 · Complaints', am:'2 · ቅሬታዎች', fields:[
      {id:'cx_new', en:'New complaints this week', am:'በዚህ ሳምንት አዲስ ቅሬታዎች', t:'num'},
      {id:'cx_resolved', en:'Complaints resolved', am:'የተፈቱ ቅሬታዎች', t:'num'},
      {id:'cx_open', en:'Complaints still open', am:'ያልተፈቱ ቅሬታዎች', t:'num'},
      {id:'cx_sameday', en:'All complaints reported the same day', am:'ሁሉም ቅሬታዎች በዕለቱ ተነግረዋል', t:'yesno',
        },
      {id:'cx_repeat', en:'Customers who complained more than once', am:'ከአንድ ጊዜ በላይ ያማረሩ ደንበኞች', t:'num'}
    ]},
    { en:'3 · What customers said', am:'3 · ደንበኞች ያሉት', fields:[
      {id:'cx_good', en:'What customers praised', am:'ደንበኞች ያደነቁት', t:'area', opt:1},
      {id:'cx_bad', en:'What customers complained about', am:'ደንበኞች ያማረሩበት', t:'area', opt:1},
      {id:'cx_pattern', en:'Any pattern the Chairman should see', am:'ሊቀመንበሩ ሊያውቀው የሚገባ ተደጋጋሚ ጉዳይ', t:'area', opt:1}
    ]},
    { en:'4 · Satisfaction', am:'4 · እርካታ', fields:[
      {id:'cx_score', en:'Average satisfaction score out of 5', am:'አማካይ የእርካታ ነጥብ ከ5', t:'num'},
      {id:'cx_rated', en:'Customers who gave a score', am:'ነጥብ የሰጡ ደንበኞች', t:'num'}
    ]}
  ]
},

/* ==================== GETACHEW — WEEKLY PURCHASING ==================== */
{
  id:'getachew-weekly', person:'getachew', cadence:'weekly', dueTime:'17:00', dueDay:5,
  en:'Weekly Purchasing Summary', am:'ሳምንታዊ የግዥ ሪፖርት',
  toEn:'Chairman, copied to Mahelet and Betty', toAm:'ሊቀመንበር፣ ግልባጭ ለማህሌትና ለቤቲ',
  dueEn:'Friday 5:00 PM', dueAm:'ዓርብ ከቀኑ 11፡00 (5:00 PM)',
  penEn:'Late –500 Birr', penAm:'ዘግይቶ –500 ብር',
  derived:1,
  sections:[
    { en:'1 · Purchase requests', am:'1 · የግዥ ጥያቄዎች', fields:[
      {id:'g_prep', en:'Requests prepared this week', am:'በዚህ ሳምንት የተዘጋጁ ጥያቄዎች', t:'num'},
      {id:'g_app', en:'Approved by Betty', am:'በቤቲ የጸደቁ', t:'num'},
      {id:'g_ret', en:'Returned or rejected', am:'የተመለሱ', t:'num'},
      {id:'g_quotes', en:'Requests with 3 or more quotes', am:'3 እና ከዚያ በላይ ፕሮፎርማ ያላቸው', t:'ratio'},
      {id:'g_acc', en:'Purchase accuracy', am:'የግዥ ትክክለኛነት', t:'pct',
        tgt:{op:'gte', v:95, en:'Target ≥95% — below is –500 Birr/month',
             am:'ዒላማ ≥95% — በታች ከሆነ በወር –500 ብር'}}
    ]},
    { en:'2 · ZamZam Bank cheques', am:'2 · የዘምዘም ባንክ ቼኮች', fields:[
      {id:'g_chq', en:'Cheques issued this week', am:'በዚህ ሳምንት የተሰጡ ቼኮች', t:'num'},
      {id:'g_chq_val', en:'Total cheque value', am:'ጠቅላላ የቼክ ዋጋ', t:'money'},
      {id:'g_chq_err', en:'Cheque errors', am:'የቼክ ስህተቶች', t:'num',
        tgt:{op:'lte', v:0, en:'Zero errors earns the 1,000 Birr bonus',
             am:'ዜሮ ስህተት 1,000 ብር ቦነስ ያስገኛል'}},
      {id:'g_chq_secure', en:'Cheque book secured every night', am:'የቼክ ደብተር በየዕለቱ ተቆልፏል', t:'yesno'}
    ]},
    { en:'3 · Suppliers and savings', am:'3 · አቅራቢዎችና ቁጠባ', fields:[
      {id:'g_sup', en:'Suppliers used', am:'የተጠቀምኳቸው አቅራቢዎች', t:'num'},
      {id:'g_delays', en:'Supplier delays', am:'የአቅራቢ መዘግየቶች', t:'num'},
      {id:'g_quality', en:'Quality issues', am:'የጥራት ችግሮች', t:'num'},
      {id:'g_saving', en:'Purchased below budget by', am:'ከበጀት በታች የተገዛበት መጠን', t:'money', opt:1}
    ]},
    { en:'4 · Documents to Betty', am:'4 · ለቤቲ የተላኩ ሰነዶች', fields:[
      {id:'g_doc24', en:'Documents submitted within 24 hours', am:'በ24 ሰዓት ውስጥ የቀረቡ', t:'ratio'},
      {id:'g_doc_missing', en:'Documents still outstanding', am:'እስካሁን ያልቀረቡ ሰነዶች', t:'num',
        tgt:{op:'lte', v:0, en:'–200 Birr per document', am:'በሰነድ –200 ብር'}}
    ]},
    { en:'5 · Problems and solutions', am:'5 · ችግሮችና መፍትሔዎች', fields:[
      {id:'w_problem', en:'Problem', am:'ችግር', t:'area', opt:1},
      {id:'w_action', en:'Action taken', am:'የተወሰደ እርምጃ', t:'area', opt:1},
      {id:'w_next', en:'Next week', am:'የሚቀጥለው ሳምንት', t:'area', opt:1}
    ]}
  ]
},

/* ===================== YORDANOS — WEEKLY STORE ===================== */
{
  id:'yordanos-weekly', person:'yordanos', cadence:'weekly', dueTime:'17:00', dueDay:5,
  en:'Weekly Store Summary', am:'ሳምንታዊ የመጋዘን ሪፖርት',
  toEn:'Chairman, copied to Mahelet and Betty', toAm:'ሊቀመንበር፣ ግልባጭ ለማህሌትና ለቤቲ',
  dueEn:'Friday 5:00 PM', dueAm:'ዓርብ ከቀኑ 11፡00 (5:00 PM)',
  penEn:'Reports are mandatory weekly', penAm:'ሳምንታዊ ሪፖርት ግዴታ ነው',
  derived:1,
  sections:[
    { en:'1 · Friday stock count', am:'1 · የዓርብ ቆጠራ', fields:[
      {id:'y_count', en:'Physical stock count completed', am:'የዕቃ ቆጠራ ተከናውኗል', t:'yesno',
        },
      {id:'y_accuracy', en:'Stock accuracy', am:'የክምችት ትክክለኛነት', t:'pct',
        tgt:{op:'gte', v:99, en:'Target ≥99% — 2,000 Birr KPI bonus',
             am:'ዒላማ ≥99% — 2,000 ብር ቦነስ'}},
      {id:'y_disc', en:'Discrepancies found', am:'የተገኙ ልዩነቶች', t:'num',
        tgt:{op:'lte', v:0, en:'Zero earns the 1,000 Birr accuracy bonus',
             am:'ዜሮ ከሆነ 1,000 ብር ቦነስ'}},
      {id:'y_missing', en:'Missing materials', am:'የጠፉ ዕቃዎች', t:'num',
        tgt:{op:'lte', v:0, en:'–1,000 Birr each', am:'እያንዳንዱ –1,000 ብር'}}
    ]},
    { en:'2 · Receiving this week', am:'2 · የዚህ ሳምንት ርክክብ', fields:[
      {id:'y_deliv', en:'Deliveries received', am:'የደረሱ ርክክቦች', t:'num'},
      {id:'y_accepted', en:'Accepted into store', am:'ወደ መጋዘን የገቡ', t:'num'},
      {id:'y_rejected', en:'Rejected', am:'ያልተቀበልኳቸው', t:'num'},
      {id:'y_grn', en:'All received against a Job File or BOM', am:'ሁሉም ከጆብ ፋይል ወይም BOM ጋር ተመሳክረዋል', t:'yesno'}
    ]},
    { en:'3 · Issuing', am:'3 · ዕቃ ማውጣት', fields:[
      {id:'y_issues', en:'Issues made this week', am:'በዚህ ሳምንት ከመጋዘን የወጡ', t:'num'},
      {id:'y_approved', en:"All issued with Mahelet's signed approval", am:'ሁሉም በማህሌት ፊርማ ፈቃድ ወጥተዋል', t:'yesno'},
      {id:'y_correct', en:'All issued to the correct job', am:'ሁሉም ለትክክለኛው ሥራ ወጥተዋል', t:'yesno'}
    ]},
    { en:'4 · Shortages', am:'4 · እጥረቶች', fields:[
      {id:'y_short', en:'Shortages flagged this week', am:'በዚህ ሳምንት የተጠቆሙ እጥረቶች', t:'num'},
      {id:'y_stopped', en:'Times production stopped from an unreported shortage',
        am:'ባልተነገረ እጥረት ምርት የቆመበት ጊዜ', t:'num',
        tgt:{op:'lte', v:0, en:'Zero earns the 500 Birr bonus', am:'ዜሮ ከሆነ 500 ብር ቦነስ'}}
    ]},
    { en:'5 · Factory consumables', am:'5 · የፋብሪካ ፍጆታ ዕቃዎች', fields:[
      {id:'y_con_week', en:'Consumables issued this week', am:'በዚህ ሳምንት የወጡ ፍጆታ ዕቃዎች', t:'num'},
      {id:'y_con_mtd', en:'Month-to-date consumable spend', am:'ከወሩ መጀመሪያ ጀምሮ የወጣ', t:'money',
        tgt:{op:'lte', v:30000, en:'Budget 30,000 Birr/month — above needs Chairman approval',
             am:'የወር በጀት 30,000 ብር — በላይ ከሆነ የሊቀመንበር ፈቃድ'}}
    ]},
    { en:'6 · Store condition', am:'6 · የመጋዘን ሁኔታ', fields:[
      {id:'y_secure', en:'Store secure every night', am:'መጋዘኑ በየዕለቱ ተቆልፏል', t:'yesno'},
      {id:'y_theft', en:'Theft or unauthorized removal', am:'ስርቆት ወይም ያልተፈቀደ ማውጣት', t:'yesno'},
      {id:'y_problem', en:'Problem', am:'ችግር', t:'area', opt:1},
      {id:'y_action', en:'Action taken', am:'የተወሰደ እርምጃ', t:'area', opt:1}
    ]}
  ]
},

/* ---- shared row sets for the planning documents ---- */

/* ============= EPHRATA — 4-WEEK ROLLING SALES PROJECTION ============= */
{
  /* Amendment 1, 17 September 2026 moved this back from Monday 10:00 AM. */
  id:'ephrata-projection', person:'ephrata', cadence:'weekly', dueTime:'17:00', dueDay:5,
  en:'4-Week Rolling Sales Projection', am:'የ4 ሳምንት የሽያጭ ትንበያ',
  toEn:'Chairman + Kidan', toAm:'ሊቀመንበር + ኪዳን',
  dueEn:'Friday 5:00 PM', dueAm:'ዓርብ ከቀኑ 11፡00 (5:00 PM)',
  penEn:'First miss –500 Birr · Second in a row –1,000 Birr',
  penAm:'መጀመሪያ ሲቀር –500 ብር · በተከታታይ ሁለተኛ –1,000 ብር',
  sections:[
    { en:'1 · Expected contracts', am:'1 · የሚጠበቁ ውሎች', fields:[
      {id:'proj_contracts', en:'Customers in negotiation', am:'በድርድር ላይ ያሉ ደንበኞች',
       t:'table', addEn:'Add customer', addAm:'ደንበኛ ጨምር', cols:[
        {id:'cust', en:'Customer name', am:'የደንበኛ ስም', t:'text'},
        {id:'val', en:'Contract value', am:'የውል ዋጋ', t:'money'},
        {id:'sign', en:'Expected signing date', am:'የሚፈረምበት ቀን', t:'text'},
        {id:'adv', en:'Advance date', am:'የቅድመ ክፍያ ቀን', t:'text'},
        {id:'fin', en:'Final payment date', am:'የመጨረሻ ክፍያ ቀን', t:'text'},
        {id:'conf', en:'Confidence', am:'እርግጠኝነት', t:'choice', opts:[
          {v:'high', en:'High', am:'ከፍተኛ'},
          {v:'med',  en:'Medium', am:'መካከለኛ'},
          {v:'low',  en:'Low', am:'ዝቅተኛ'}]}
      ]}
    ]},
    { en:'2 · Expected collections by week', am:'2 · በሳምንት የሚጠበቅ ገቢ', fields:[
      {id:'proj_weeks', en:'Expected collections', am:'የሚጠበቅ ገቢ', t:'grid',
       rows:[{en:'Week 1', am:'ሳምንት 1'},{en:'Week 2', am:'ሳምንት 2'},
             {en:'Week 3', am:'ሳምንት 3'},{en:'Week 4', am:'ሳምንት 4'}],
       cols:[
        {id:'adv', en:'Expected advance', am:'የሚጠበቅ ቅድመ ክፍያ', t:'money'},
        {id:'fin', en:'Expected final', am:'የሚጠበቅ የመጨረሻ ክፍያ', t:'money'},
        {id:'tot', en:'Total expected', am:'ጠቅላላ የሚጠበቅ', t:'money'}
      ]},
      {id:'proj_total', en:'Total expected over the 4 weeks', am:'የአራቱ ሳምንታት ጠቅላላ', t:'money',
        tgt:{op:'gte', v:12000000, en:'Below 12,000,000 Birr triggers the rolling penalty',
             am:'ከ12,000,000 ብር በታች ከሆነ ቅጣት ያስከትላል'}}
    ]},
    { en:'3 · Obstacles or support needed', am:'3 · እንቅፋቶች ወይም የሚያስፈልግ ድጋፍ', fields:[
      {id:'proj_obstacles', en:'Obstacles', am:'እንቅፋቶች', t:'area'},
      {id:'proj_support', en:'Support needed from Chairman', am:'ከሊቀመንበሩ የሚፈለግ ድጋፍ', t:'area', opt:1}
    ]},
    { en:'4 · Confidence statement', am:'4 · የእርግጠኝነት መግለጫ', fields:[
      {id:'proj_achievable', en:'I believe these projections are achievable',
       am:'እነዚህ ትንበያዎች ሊሳኩ እንደሚችሉ አምናለሁ', t:'yesno'},
      {id:'proj_why', en:'Reason, if no', am:'አይ ከሆነ ምክንያቱ', t:'area', opt:1}
    ]}
  ]
},

/* ============== MAHELET — 15-DAY PRODUCTION PLAN ============== */
{
  id:'liu-plan', person:'liu', cadence:'weekly', dueTime:'15:00', dueDay:5,
  en:'15-Day Production Plan', am:'የ15 ቀን የምርት ዕቅድ',
  toEn:'Chairman + Kidan', toAm:'ሊቀመንበር + ኪዳን',
  dueEn:'Friday 3:00 PM', dueAm:'ዓርብ ከቀኑ 9፡00 (3:00 PM)',
  penEn:'Late –5,000 Birr · Incomplete –2,000 Birr · Two weeks without a plan –10,000 Birr',
  penAm:'ዘግይቶ –5,000 ብር · ያልተሟላ –2,000 ብር · ሁለት ሳምንት ካልቀረበ –10,000 ብር',
  sections:[
    { en:'1 · Plan period', am:'1 · የዕቅዱ ጊዜ', fields:[
      {id:'plan_start', en:'Plan starts on', am:'ዕቅዱ የሚጀምርበት ቀን', t:'date'},
      {id:'plan_prep', en:'Prepared by', am:'ያዘጋጀው', t:'text'}
    ]},
    { en:'2 · Payment-confirmed jobs from Betty', am:'2 · ከቤቲ የክፍያ ማረጋገጫ ያላቸው ሥራዎች', fields:[
      {id:'plan_paid', en:'Jobs Betty confirmed as fully paid', am:'ቤቲ ሙሉ ክፍያ ያረጋገጠችላቸው ሥራዎች',
       t:'table', addEn:'Add job', addAm:'ሥራ ጨምር', cols:[
        {id:'code', en:'Job code', am:'የሥራ ኮድ', t:'text'},
        {id:'cust', en:'Customer', am:'ደንበኛ', t:'text'},
        {id:'m2',   en:'m²', am:'ካሬ ሜትር', t:'num'},
        {id:'ok',   en:'Final payment confirmed', am:'የመጨረሻ ክፍያ ተረጋግጧል', t:'yesno'},
        {id:'date', en:"Betty's confirmation date", am:'ቤቲ ያረጋገጠችበት ቀን', t:'text'}
      ]}
    ]},
    { en:'3 · Production queue', am:'3 · የምርት ተራ', fields:[
      {id:'plan_queue', en:'Jobs in order of priority', am:'በቅድሚያ ተራ የተደረደሩ ሥራዎች',
       t:'table', addEn:'Add job to the queue', addAm:'ወደ ተራው ሥራ ጨምር', cols:[
        {id:'pri',  en:'Priority', am:'ቅድሚያ', t:'num'},
        {id:'code', en:'Job code', am:'የሥራ ኮድ', t:'text'},
        {id:'cust', en:'Customer', am:'ደንበኛ', t:'text'},
        {id:'m2',   en:'m²', am:'ካሬ ሜትር', t:'num'},
        {id:'start',en:'Planned start', am:'የሚጀመርበት', t:'text'},
        {id:'done', en:'Planned completion', am:'የሚጠናቀቅበት', t:'text'},
        {id:'qc',   en:'QC date', am:'የQC ቀን', t:'text'},
        {id:'del',  en:'Delivery date', am:'የማድረሻ ቀን', t:'text'}
      ]}
    ]},
    { en:'4 · Daily production target', am:'4 · የዕለት ተዕለት የምርት ዒላማ', fields:[
      {id:'plan_days', en:'Planned output, day by day', am:'በየቀኑ የታቀደ ምርት',
       t:'grid', dateFrom:'plan_start',
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
      {id:'plan_materials', en:'Materials required', am:'የሚያስፈልጉ ዕቃዎች', t:'area'},
      {id:'plan_block', en:'Bottlenecks or support needed', am:'እንቅፋቶች ወይም የሚያስፈልግ ድጋፍ', t:'area', opt:1}
    ]},
    { en:'6 · Confirmation', am:'6 · ማረጋገጫ', fields:[
      {id:'plan_rule', en:'No job in this plan lacks Betty’s written payment confirmation',
       am:'በዚህ ዕቅድ ውስጥ ያለ ቤቲ የጽሑፍ ማረጋገጫ የገባ ሥራ የለም', t:'yesno'},
      {id:'plan_capacity', en:'Plan fits machine capacity and material availability',
       am:'ዕቅዱ ከማሽን አቅምና ከዕቃ አቅርቦት ጋር ይጣጣማል', t:'yesno'}
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
      {id:'cf_in', en:'Expected inflows by week', am:'በሳምንት የሚጠበቅ ገቢ', t:'grid',
       rows:[{en:'Week 1', am:'ሳምንት 1'},{en:'Week 2', am:'ሳምንት 2'},
             {en:'Week 3', am:'ሳምንት 3'},{en:'Week 4', am:'ሳምንት 4'}],
       cols:[
        {id:'adv',   en:'Advances', am:'ቅድመ ክፍያዎች', t:'money'},
        {id:'final', en:'Final payments', am:'የመጨረሻ ክፍያዎች', t:'money'},
        {id:'other', en:'Other', am:'ሌላ', t:'money'}
      ]}
    ]},
    { en:'2 · Expected money out', am:'2 · የሚጠበቅ ወጪ', fields:[
      {id:'cf_out', en:'Expected outflows by week', am:'በሳምንት የሚጠበቅ ወጪ', t:'grid',
       rows:[{en:'Week 1', am:'ሳምንት 1'},{en:'Week 2', am:'ሳምንት 2'},
             {en:'Week 3', am:'ሳምንት 3'},{en:'Week 4', am:'ሳምንት 4'}],
       cols:[
        {id:'sup',  en:'Suppliers', am:'አቅራቢዎች', t:'money'},
        {id:'sal',  en:'Salaries', am:'ደመወዝ', t:'money'},
        {id:'asm',  en:'Assemblers', am:'የተከላ ሠራተኞች', t:'money'},
        {id:'other',en:'Utilities and other', am:'የመብራት/ውሃና ሌላ', t:'money'}
      ]}
    ]},
    { en:'3 · Balance and the reserve rule', am:'3 · ቀሪ ሂሳብና የክምችት ደንብ', fields:[
      {id:'cf_open', en:'Bank balance today', am:'የዛሬ የባንክ ቀሪ', t:'money'},
      {id:'cf_low', en:'Lowest balance expected in the 4 weeks', am:'በአራቱ ሳምንታት ዝቅተኛው ቀሪ', t:'money',
        tgt:{op:'gte', v:6000000, en:'6 Million Birr Cash Reserve Rule',
             am:'የ6 ሚሊዮን ብር ክምችት ደንብ'}},
      {id:'cf_lowweek', en:'Week that happens', am:'የሚከሰትበት ሳምንት', t:'text'},
      {id:'cf_close', en:'Balance expected at the end of week 4', am:'በ4ኛው ሳምንት መጨረሻ የሚጠበቅ ቀሪ', t:'money'}
    ]},
    { en:'4 · Shortfall warning', am:'4 · የእጥረት ማስጠንቀቂያ', fields:[
      {id:'cf_short', en:'A shortfall is expected in these 4 weeks',
       am:'በእነዚህ 4 ሳምንታት እጥረት ይጠበቃል', t:'yesno'},
      {id:'cf_when', en:'When and how much', am:'መቼና ምን ያህል', t:'area', opt:1},
      {id:'cf_action', en:'What should be done about it', am:'ምን መደረግ አለበት', t:'area', opt:1},
      {id:'cf_freeze', en:'Payments should be frozen', am:'ክፍያዎች መቆም አለባቸው', t:'yesno'}
    ]}
  ]
},

/* ============ BETELHEM — PAYMENT-CONFIRMED JOB LIST ============ */
{
  id:'betty-joblist', person:'betty', cadence:'weekly', dueTime:'13:00', dueDay:5,
  en:'Payment-Confirmed Job List', am:'ክፍያቸው የተረጋገጠ ሥራዎች ዝርዝር',
  toEn:'Mahelet', toAm:'ማህሌት',
  dueEn:'Friday 1:00 PM', dueAm:'ዓርብ ከቀኑ 7፡00 (1:00 PM)',
  penEn:'Not sent by Friday 1:00 PM –500 Birr',
  penAm:'ዓርብ ከቀኑ 7፡00 ካልተላከ –500 ብር',
  derived:1,
  sections:[
    { en:'1 · Jobs cleared for production', am:'1 · ወደ ምርት የሚገቡ ሥራዎች', fields:[
      {id:'jl_jobs', en:'Fully paid jobs', am:'ሙሉ ክፍያ የተፈጸመባቸው ሥራዎች',
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
      {id:'jl_count', en:'Number of jobs on this list', am:'በዝርዝሩ ያሉ ሥራዎች ብዛት', t:'num'},
      {id:'jl_value', en:'Total value confirmed', am:'ጠቅላላ የተረጋገጠ ዋጋ', t:'money'},
      {id:'jl_rule', en:'Every job on this list is paid in full — none is partial',
       am:'በዝርዝሩ ያለ እያንዳንዱ ሥራ ሙሉ ክፍያ ተፈጽሞበታል — ከፊል የለም', t:'yesno'},
      {id:'jl_held', en:'Jobs held back because payment is incomplete',
       am:'ክፍያቸው ስላልተጠናቀቀ የቀሩ ሥራዎች', t:'num'},
      {id:'jl_note', en:'Anything Mahelet should know', am:'ማህሌት ሊያውቀው የሚገባ', t:'area', opt:1}
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
      {id:'cf7_date', en:'Forecast starts', am:'ትንበያው የሚጀምርበት ቀን', t:'date'},
      {id:'cf7_bank', en:'Bank balance this morning', am:'የዛሬ ጠዋት የባንክ ቀሪ', t:'money',
        tgt:{op:'gte', v:6000000, en:'6 Million Birr Cash Reserve Rule — below this must be reported',
             am:'የ6 ሚሊዮን ብር ክምችት ደንብ — ከዚህ በታች ከሆነ ማሳወቅ ግዴታ ነው'}},
      {id:'cf7_cash', en:'Cash on hand', am:'በእጅ ያለ ጥሬ ገንዘብ', t:'money'},
      {id:'cf7_zamzam', en:'ZamZam Bank balance', am:'የዘምዘም ባንክ ቀሪ', t:'money'},
      {id:'cf7_reported', en:'If below 6M, already reported to Chairman',
       am:'ከ6ሚ በታች ከሆነ ለሊቀመንበሩ ተነግሯል', t:'yesno', opt:1}
    ]},
    { en:'2 · The next 7 days', am:'2 · የሚቀጥሉት 7 ቀናት', fields:[
      {id:'cf7_days', en:'Expected in, out and closing balance', am:'የሚጠበቅ ገቢ፣ ወጪና ቀሪ',
       t:'grid', dateFrom:'cf7_date',
       rows:[{en:'Day 1', am:'ቀን 1'},{en:'Day 2', am:'ቀን 2'},{en:'Day 3', am:'ቀን 3'},
             {en:'Day 4', am:'ቀን 4'},{en:'Day 5', am:'ቀን 5'},{en:'Day 6', am:'ቀን 6'},
             {en:'Day 7', am:'ቀን 7'}],
       cols:[
        {id:'in',    en:'Expected in', am:'የሚጠበቅ ገቢ', t:'money'},
        {id:'out',   en:'Expected out', am:'የሚጠበቅ ወጪ', t:'money'},
        {id:'close', en:'Closing balance', am:'የቀኑ መጨረሻ ቀሪ', t:'money'}
      ]}
    ]},
    { en:'3 · The lowest point', am:'3 · ዝቅተኛው ደረጃ', fields:[
      {id:'cf7_low', en:'Lowest balance in the 7 days', am:'በ7 ቀናት ውስጥ ዝቅተኛው ቀሪ', t:'money',
        tgt:{op:'gte', v:6000000, en:'Below the 6 Million Birr reserve',
             am:'ከ6 ሚሊዮን ብር ክምችት በታች'}},
      {id:'cf7_lowday', en:'Which day', am:'የትኛው ቀን', t:'text'},
      {id:'cf7_cover', en:'Money expected covers everything due', am:'የሚጠበቀው ገንዘብ ወጪውን ይሸፍናል', t:'yesno'}
    ]},
    { en:'4 · Shortfall warning', am:'4 · የእጥረት ማስጠንቀቂያ', fields:[
      {id:'cf7_short', en:'A shortfall is expected in these 7 days',
       am:'በእነዚህ 7 ቀናት እጥረት ይጠበቃል', t:'yesno'},
      {id:'cf7_amount', en:'How much short', am:'ምን ያህል ይጎድላል', t:'money', opt:1},
      {id:'cf7_action', en:'What should be done', am:'ምን መደረግ አለበት', t:'area', opt:1},
      {id:'cf7_freeze', en:'Non-essential payments should be frozen',
       am:'አስፈላጊ ያልሆኑ ክፍያዎች መቆም አለባቸው', t:'yesno'}
    ]},
    { en:'5 · Due today', am:'5 · ዛሬ የሚከፈሉ', fields:[
      {id:'cf7_due', en:'Payments due today', am:'ዛሬ የሚከፈሉ ክፍያዎች', t:'num'},
      {id:'cf7_due_val', en:'Value due today', am:'የዛሬ ክፍያ ዋጋ', t:'money'},
      {id:'cf7_kidan', en:'Of those, needing Kidan’s approval', am:'ከነዚህ የኪዳን ፈቃድ የሚያስፈልጋቸው', t:'num'}
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
    { en:'1 · Groups watched today', am:'1 · ዛሬ የተከታተልኳቸው ግሩፖች', fields:[
      {id:'pl_groups', en:'Active customer groups', am:'ንቁ የደንበኛ ግሩፖች', t:'num'},
      {id:'pl_checked', en:'Groups read today', am:'ዛሬ ያነበብኳቸው ግሩፖች', t:'ratio'},
      {id:'pl_called', en:'Customers contacted directly', am:'በቀጥታ ያነጋገርኳቸው ደንበኞች', t:'num'}
    ]},
    { en:'2 · How customers sound', am:'2 · የደንበኞች ስሜት', fields:[
      {id:'pl_happy', en:'Customers who sound satisfied', am:'የረኩ የሚመስሉ ደንበኞች', t:'num'},
      {id:'pl_unhappy', en:'Customers who sound unhappy', am:'ያልረኩ የሚመስሉ ደንበኞች', t:'num'},
      {id:'pl_silent', en:'Customers gone quiet for 3 days or more',
       am:'ከ3 ቀናት በላይ ዝም ያሉ ደንበኞች', t:'num'},
      {id:'pl_risk', en:'Any customer at risk of cancelling', am:'ውል ሊያቋርጥ የሚችል ደንበኛ አለ', t:'yesno'},
      {id:'pl_risk_who', en:'Which customer and why', am:'የትኛው ደንበኛ እና ለምን', t:'area', opt:1}
    ]},
    { en:'3 · Complaints today', am:'3 · የዛሬ ቅሬታዎች', fields:[
      {id:'pl_list', en:'Complaints raised today', am:'ዛሬ የቀረቡ ቅሬታዎች',
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
      {id:'pl_sameday', en:'Every complaint reported the same day',
       am:'እያንዳንዱ ቅሬታ በዕለቱ ተነግሯል', t:'yesno'},
      {id:'pl_open', en:'Complaints still open from earlier days',
       am:'ከቀደሙት ቀናት ያልተፈቱ ቅሬታዎች', t:'num'}
    ]},
    { en:'4 · What customers said', am:'4 · ደንበኞች ያሉት', fields:[
      {id:'pl_good', en:'What customers praised today', am:'ዛሬ ደንበኞች ያደነቁት', t:'area', opt:1},
      {id:'pl_bad', en:'What customers complained about', am:'ደንበኞች ያማረሩበት', t:'area', opt:1}
    ]},
    { en:'5 · Escalation', am:'5 · ወደ ላይ የተላለፉ', fields:[
      {id:'pl_to_eph', en:'Passed to Ephrata today', am:'ዛሬ ለኤፍራታ የተላለፉ', t:'num'},
      {id:'pl_to_mah', en:'Passed to Mahelet today', am:'ዛሬ ለማህሌት የተላለፉ', t:'num'},
      {id:'pl_chair', en:'Need Chairman decision', am:'የሊቀመንበር ውሳኔ ያስፈልጋል', t:'yesno'},
      {id:'pl_what', en:'What the Chairman should decide', am:'ሊቀመንበሩ ሊወስንበት የሚገባ', t:'area', opt:1}
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
    { en:'1 · Production output', am:'1 · የዕለቱ ምርት', fields:[
      {id:'p_total', en:'Total m² produced today', am:'ዛሬ የተመረተ ጠቅላላ ካሬ ሜትር', t:'num',
        tgt:{op:'gte', v:40, en:'Daily target 40 m² — below is –300 Birr/day from commission',
             am:'የቀኑ ዒላማ 40 ካሬ ሜትር — ከዚህ በታች ከኮሚሽን –300 ብር'}},
      {id:'p_ext', en:'External m²', am:'የውጭ ደንበኛ ካሬ ሜትር', t:'num', i:1},
      {id:'p_rove', en:'Rovestone / internal m²', am:'የሮቭስቶን / የውስጥ ካሬ ሜትር', t:'num', i:1},
      {id:'p_jobs', en:'Jobs worked today', am:'ዛሬ የተሠሩ ሥራዎች',
       t:'table', addEn:'Add job', addAm:'ሥራ ጨምር', cols:[
        {id:'code', en:'Job code', am:'የሥራ ኮድ', t:'text'},
        {id:'tgt',  en:'m² target', am:'የታቀደ ካሬ ሜትር', t:'num'},
        {id:'done', en:'m² produced', am:'የተመረተ ካሬ ሜትር', t:'num'},
        {id:'st',   en:'Status', am:'ሁኔታ', t:'choice', opts:[
          {v:'done', en:'Complete', am:'ተጠናቋል'},
          {v:'wip',  en:'In progress', am:'በሂደት ላይ'}
        ]}
      ]}
    ]},
    { en:'2 · Quality control checkpoints', am:'2 · የጥራት ቁጥጥር ደረጃዎች', fields:[
      {id:'qc', en:'Checkpoints today', am:'የዛሬ ፍተሻዎች', t:'grid',
       rows:[{en:'After cutting', am:'ከመቁረጥ በኋላ'},
             {en:'After assembly', am:'ከመገጣጠም በኋላ'},
             {en:'Before delivery', am:'ከማድረስ በፊት'}],
       cols:[
        {id:'pass', en:'Passed', am:'ያለፉ', t:'num'},
        {id:'fail', en:'Failed', am:'ያላለፉ', t:'num'},
        {id:'sign', en:'Signed in Job File', am:'በሥራ ፋይል ተፈርሟል', t:'yesno'}
      ]},
      {id:'qc_defects', en:'Defects found today', am:'ዛሬ የተገኙ ጉድለቶች', t:'num',
        tgt:{op:'lte', v:0, en:'–500 Birr per defect released to finished goods',
             am:'ወደ ዝግጁ ዕቃ ማከማቻ ለገባ እያንዳንዱ ጉድለት –500 ብር'}},
      {id:'qc_action', en:'Action taken', am:'የተወሰደ እርምጃ', t:'area', opt:1}
    ]},
    { en:'3 · Waste and material variance', am:'3 · ብክነትና የቁሳቁስ ልዩነት', fields:[
      {id:'w_pct', en:'Waste %', am:'የብክነት መጠን %', t:'pct',
        tgt:{op:'lte', v:20, en:'Must not exceed 20% — all bonuses depend on it',
             am:'ከ20% መብለጥ የለበትም — ሁሉም ጉርሻዎች በዚህ ላይ ይወሰናሉ'}},
      {id:'w_var', en:'Material used over BOM %', am:'ከBOM በላይ የዋለ ቁሳቁስ %', t:'pct',
        tgt:{op:'lte', v:5, en:'Above +5% cancels the bonuses; above +10% is –2,000 Birr',
             am:'ከ+5% በላይ ጉርሻዎችን ይሰርዛል፤ ከ+10% በላይ –2,000 ብር'}}
    ]},
    { en:'4 · Material savings', am:'4 · የቁሳቁስ ቁጠባ', fields:[
      {id:'sav_rows', en:'Savings against BOM', am:'ከBOM አንጻር የተቆጠበ',
       t:'table', addEn:'Add material', addAm:'ቁሳቁስ ጨምር', cols:[
        {id:'mat',  en:'Material', am:'ቁሳቁስ', t:'text'},
        {id:'bom',  en:'BOM qty', am:'የBOM መጠን', t:'num'},
        {id:'used', en:'Actual used', am:'የዋለው መጠን', t:'num'},
        {id:'cost', en:'Unit cost', am:'የአንዱ ዋጋ', t:'money'},
        {id:'sav',  en:'Savings (Birr)', am:'ቁጠባ (ብር)', t:'money'}
      ]},
      {id:'sav_today', en:'Total savings today', am:'የዛሬ ጠቅላላ ቁጠባ', t:'money'}
    ]},
    { en:'5 · Waste sorting', am:'5 · የተረፈ ቁሳቁስ አያያዝ', fields:[
      {id:'ws_reuse', en:'Reusable offcuts stored separately', am:'እንደገና የሚያገለግሉ ቁርጥራጮች ተለይተው ተቀምጠዋል', t:'yesno'},
      {id:'ws_rec', en:'Scrap material recorded', am:'የተረፈ ቁሳቁስ ተመዝግቧል', t:'yesno'},
      {id:'ws_stack', en:'Scrap stacked in the scrap area', am:'የተረፈ ቁሳቁስ በተመደበው ቦታ ተከምሯል', t:'yesno'},
      {id:'ws_thrown', en:'Any reusable material thrown away without recording', am:'ሳይመዘገብ የተጣለ እንደገና የሚያገለግል ቁሳቁስ አለ', t:'yesno'}
    ]},
    { en:'6 · Machines', am:'6 · ማሽኖች', fields:[
      {id:'m_rows', en:'Machine status', am:'የማሽኖች ሁኔታ',
       t:'table', addEn:'Add machine', addAm:'ማሽን ጨምር', cols:[
        {id:'name', en:'Machine', am:'ማሽን', t:'text'},
        {id:'run',  en:'Running', am:'እየሠራ ነው', t:'yesno'},
        {id:'down', en:'Downtime (hrs)', am:'የቆመበት ሰዓት', t:'num'},
        {id:'cause',en:'Cause', am:'ምክንያት', t:'text'}
      ]},
      {id:'m_reported', en:'Every breakdown reported to Mahelet within 30 minutes', am:'እያንዳንዱ ብልሽት በ30 ደቂቃ ውስጥ ለማህሌት ተነግሯል', t:'yesno'}
    ]},
    { en:'7 · Manpower', am:'7 · የሰው ኃይል', fields:[
      {id:'mp_assigned', en:'Workers assigned', am:'የተመደቡ ሠራተኞች', t:'num'},
      {id:'mp_present', en:'Workers present', am:'የተገኙ ሠራተኞች', t:'num'},
      {id:'mp_absent', en:'Workers absent', am:'ያልተገኙ ሠራተኞች', t:'num'},
      {id:'mp_late', en:'Workers late', am:'የዘገዩ ሠራተኞች', t:'num',
        tgt:{op:'lte', v:0, en:'–100 Birr per worker per incident', am:'በእያንዳንዱ ሠራተኛ –100 ብር'}},
      {id:'mp_behave', en:'Behaviour issues', am:'የሥነ ምግባር ችግሮች', t:'num',
        tgt:{op:'lte', v:0, en:'Unreported issues carry double the penalty', am:'ያልተነገረ ጉዳይ ቅጣቱ በእጥፍ ነው'}}
    ]},
    { en:'8 · Factory cleaning', am:'8 · የፋብሪካ ጽዳት', fields:[
      {id:'c_floor', en:'Factory floor swept and clean', am:'የፋብሪካው ወለል ተጠርጎ ንጹህ ነው', t:'yesno'},
      {id:'c_mach', en:'Machines cleaned after use', am:'ማሽኖች ከሥራ በኋላ ጸድተዋል', t:'yesno'},
      {id:'c_tools', en:'Tools returned to their place', am:'መሣሪያዎች በቦታቸው ተመልሰዋል', t:'yesno'},
      {id:'c_waste', en:'Waste bins emptied', am:'የቆሻሻ መጣያዎች ተጽድተዋል', t:'yesno'},
      {id:'c_5s', en:'5S score (audit days only)', am:'የ5S ውጤት (ኦዲት በሚደረግበት ቀን ብቻ)', t:'pct', opt:1,
        tgt:{op:'gte', v:80, en:'Below 80% is –500 Birr', am:'ከ80% በታች –500 ብር'}}
    ]},
    { en:'9 · Unauthorized production or dispatch', am:'9 · ፈቃድ የሌለው ምርት ወይም ማስወጣት', fields:[
      {id:'u_any', en:'Any unauthorized production or dispatch today', am:'ዛሬ ፈቃድ የሌለው ምርት ወይም ማስወጣት ተፈጽሟል', t:'yesno'},
      {id:'u_reported', en:'If yes, reported to Mahelet within 1 hour', am:'አዎ ከሆነ በ1 ሰዓት ውስጥ ለማህሌት ተነግሯል', t:'yesno', opt:1}
    ]},
    { en:'10 · Problems and solutions', am:'10 · ችግሮችና መፍትሔዎች', fields:[
      {id:'problem', en:'Problem', am:'ችግር', t:'area', opt:1},
      {id:'cause', en:'Root cause', am:'መሠረታዊ ምክንያት', t:'area', opt:1},
      {id:'action', en:'Action taken', am:'የተወሰደ እርምጃ', t:'area', opt:1},
      {id:'need_lead', en:'Need Mahelet decision', am:'የማህሌት ውሳኔ ያስፈልጋል', t:'yesno'}
    ]},
    { en:"11 · Tomorrow's top 3", am:'11 · የነገ ሦስት ቅድሚያዎች', fields:[
      {id:'p1', en:'1', am:'1', t:'text'},
      {id:'p2', en:'2', am:'2', t:'text'},
      {id:'p3', en:'3', am:'3', t:'text'}
    ]}
  ]
},

/* ======================= AMAHA — WEEKLY PRODUCTION ====================== */
{
  id:'amaha-weekly', person:'amaha', cadence:'weekly', dueTime:'17:00', dueDay:5,
  en:'Weekly Production Summary', am:'ሳምንታዊ የምርት ማጠቃለያ',
  toEn:'Mahelet + Ephrata', toAm:'ማህሌት + ኤፍራታ',
  dueEn:'Friday 5:00 PM', dueAm:'ዓርብ ከቀኑ 11፡00 (5:00 PM)',
  penEn:'Late –500 Birr', penAm:'ዘግይቶ –500 ብር',
  sections:[
    { en:'1 · Production performance', am:'1 · የምርት አፈጻጸም', fields:[
      {id:'w_total', en:'Total m² produced this week', am:'በዚህ ሳምንት የተመረተ ጠቅላላ ካሬ ሜትር', t:'num',
        tgt:{op:'gte', v:240, en:'Weekly target 240 m²', am:'የሳምንቱ ዒላማ 240 ካሬ ሜትር'}},
      {id:'w_ext', en:'External m²', am:'የውጭ ደንበኛ ካሬ ሜትር', t:'num', i:1},
      {id:'w_rove', en:'Rovestone m²', am:'የሮቭስቶን ካሬ ሜትር', t:'num', i:1},
      {id:'w_avg', en:'Average daily production', am:'አማካይ የቀን ምርት', t:'num',
        tgt:{op:'gte', v:40, en:'Daily target 40 m²', am:'የቀን ዒላማ 40 ካሬ ሜትር'}},
      {id:'w_best', en:'Best day (m²)', am:'የተሻለው ቀን (ካሬ ሜትር)', t:'num'},
      {id:'w_worst', en:'Worst day (m²)', am:'ዝቅተኛው ቀን (ካሬ ሜትር)', t:'num'}
    ]},
    { en:'2 · Quality control', am:'2 · የጥራት ቁጥጥር', fields:[
      {id:'q_checked', en:'Jobs QC checked', am:'በQC የተመረመሩ ሥራዎች', t:'num'},
      {id:'q_pass', en:'Jobs passed', am:'ያለፉ ሥራዎች', t:'num'},
      {id:'q_fail', en:'Jobs failed', am:'ያላለፉ ሥራዎች', t:'num'},
      {id:'q_rate', en:'QC pass rate', am:'የQC ማለፊያ መጠን', t:'pct',
        tgt:{op:'gte', v:98, en:'≥98% earns the 5,000 Birr quality bonus', am:'≥98% የ5,000 ብር የጥራት ጉርሻ ያስገኛል'}},
      {id:'q_defects', en:'Defects found', am:'የተገኙ ጉድለቶች', t:'num'}
    ]},
    { en:'3 · Waste control', am:'3 · የብክነት ቁጥጥር', fields:[
      {id:'w_avgpct', en:'Average waste %', am:'አማካይ የብክነት መጠን %', t:'pct',
        tgt:{op:'lte', v:20, en:'Must not exceed 20%', am:'ከ20% መብለጥ የለበትም'}},
      {id:'w_days', en:'Days above 20%', am:'ከ20% በላይ የሆነባቸው ቀናት', t:'num',
        tgt:{op:'lte', v:0, en:'Should be 0', am:'0 መሆን አለበት'}},
      {id:'w_cost', en:'Waste cost', am:'የብክነት ወጪ', t:'money'}
    ]},
    { en:'4 · Material savings', am:'4 · የቁሳቁስ ቁጠባ', fields:[
      {id:'s_bom', en:'Total BOM quantity', am:'ጠቅላላ የBOM መጠን', t:'num'},
      {id:'s_used', en:'Total actual used', am:'ጠቅላላ የዋለው መጠን', t:'num'},
      {id:'s_total', en:'Total savings this week', am:'የዚህ ሳምንት ጠቅላላ ቁጠባ', t:'money'},
      {id:'s_pct', en:'Savings %', am:'የቁጠባ መጠን %', t:'pct'}
    ]},
    { en:'5 · Waste sorting', am:'5 · የተረፈ ቁሳቁስ አያያዝ', fields:[
      {id:'ws_stored', en:'Reusable offcuts stored (m²)', am:'የተቀመጡ እንደገና የሚያገለግሉ ቁርጥራጮች (ካሬ ሜትር)', t:'num'},
      {id:'ws_scrap', en:'Scrap material recorded', am:'የተመዘገበ የተረፈ ቁሳቁስ', t:'num'},
      {id:'ws_viol', en:'Violations', am:'ጥሰቶች', t:'num',
        tgt:{op:'lte', v:0, en:'–300 to –500 Birr each', am:'እያንዳንዱ ከ–300 እስከ –500 ብር'}}
    ]},
    { en:'6 · Machine performance', am:'6 · የማሽን አፈጻጸም', fields:[
      {id:'m_uptime', en:'Machine uptime %', am:'ማሽን የሠራበት መጠን %', t:'pct',
        tgt:{op:'gte', v:95, en:'≥95% earns the 2,000 Birr uptime bonus', am:'≥95% የ2,000 ብር ጉርሻ ያስገኛል'}},
      {id:'m_break', en:'Breakdowns this week', am:'በዚህ ሳምንት የተከሰቱ ብልሽቶች', t:'num'},
      {id:'m_down', en:'Downtime hours', am:'የቆመበት ሰዓት', t:'num'}
    ]},
    { en:'7 · Manpower', am:'7 · የሰው ኃይል', fields:[
      {id:'a_rate', en:'Average attendance', am:'አማካይ የተገኝነት መጠን', t:'pct',
        tgt:{op:'gte', v:95, en:'≥95% earns 2,000 + 3,000 Birr in bonuses', am:'≥95% የ2,000 + 3,000 ብር ጉርሻ ያስገኛል'}},
      {id:'a_late', en:'Workers with repeated lateness', am:'በተደጋጋሚ የዘገዩ ሠራተኞች', t:'num'},
      {id:'a_absent', en:'Workers with repeated absence', am:'በተደጋጋሚ ያልተገኙ ሠራተኞች', t:'num'},
      {id:'a_behave', en:'Behaviour incidents', am:'የሥነ ምግባር ችግሮች', t:'num',
        tgt:{op:'lte', v:0, en:'Zero is required for the 3,000 Birr bonus', am:'ለ3,000 ብር ጉርሻ 0 መሆን አለበት'}}
    ]},
    { en:'8 · Factory cleaning', am:'8 · የፋብሪካ ጽዳት', fields:[
      {id:'c_5s', en:'5S audit score', am:'የ5S ኦዲት ውጤት', t:'pct',
        tgt:{op:'gte', v:80, en:'≥80% earns the 2,000 Birr cleaning bonus', am:'≥80% የ2,000 ብር የጽዳት ጉርሻ ያስገኛል'}},
      {id:'c_issues', en:'Cleaning issues found', am:'የተገኙ የጽዳት ችግሮች', t:'num'}
    ]},
    { en:'9 · Job completion', am:'9 · የተጠናቀቁ ሥራዎች', fields:[
      {id:'j_done', en:'Jobs completed this week', am:'በዚህ ሳምንት የተጠናቀቁ ሥራዎች', t:'num'},
      {id:'j_zero', en:'Jobs with zero rework', am:'ምንም ዳግም ሥራ ያልጠየቁ', t:'num'},
      {id:'j_fail', en:'Jobs with QC failure', am:'በQC ያላለፉ ሥራዎች', t:'num',
        tgt:{op:'lte', v:0, en:'Each one cancels that job’s 1,000 Birr bonus', am:'እያንዳንዱ የዚያን ሥራ 1,000 ብር ጉርሻ ይሰርዛል'}},
      {id:'j_bonus', en:'Job completion bonus earned', am:'የተገኘ የሥራ ማጠናቀቂያ ጉርሻ', t:'money'}
    ]},
    { en:'10 · Unauthorized production or dispatch', am:'10 · ፈቃድ የሌለው ምርት ወይም ማስወጣት', fields:[
      {id:'u_prod', en:'Any unauthorized production this week', am:'በዚህ ሳምንት ፈቃድ የሌለው ምርት ተፈጽሟል', t:'yesno'},
      {id:'u_disp', en:'Any unauthorized dispatch this week', am:'በዚህ ሳምንት ፈቃድ የሌለው ማስወጣት ተፈጽሟል', t:'yesno'},
      {id:'u_det', en:'If yes, details', am:'አዎ ከሆነ ዝርዝሩ', t:'area', opt:1}
    ]},
    { en:'11 · Problems and solutions', am:'11 · ችግሮችና መፍትሔዎች', fields:[
      {id:'problem', en:'Problem', am:'ችግር', t:'area', opt:1},
      {id:'action', en:'Action taken', am:'የተወሰደ እርምጃ', t:'area', opt:1},
      {id:'outstanding', en:'Outstanding issues', am:'ያልተፈቱ ጉዳዮች', t:'area', opt:1}
    ]},
    { en:"12 · Next week's plan", am:'12 · የሚቀጥለው ሳምንት ዕቅድ', fields:[
      {id:'n_target', en:'Production target (m²)', am:'የምርት ዒላማ (ካሬ ሜትር)', t:'num'},
      {id:'n_jobs', en:'Key jobs to complete', am:'መጠናቀቅ ያለባቸው ዋና ሥራዎች', t:'area', opt:1},
      {id:'n_sav', en:'Material savings target', am:'የቁሳቁስ ቁጠባ ዒላማ', t:'money', opt:1},
      {id:'n_support', en:'Support needed from Mahelet', am:'ከማህሌት የሚያስፈልግ ድጋፍ', t:'area', opt:1}
    ]}
  ]
},

/* =================== AMAHA — MONTHLY MATERIAL SAVINGS =================== */
{
  id:'amaha-monthly', person:'amaha', cadence:'monthly', dueTime:'17:00',
  en:'Monthly Material Savings Report', am:'ወርሃዊ የቁሳቁስ ቁጠባ ሪፖርት',
  toEn:'Mahelet + Betty', toAm:'ማህሌት + ቤቲ',
  dueEn:'1st of the following month', dueAm:'በሚቀጥለው ወር 1ኛ ቀን',
  penEn:'Your savings share is 10% – 25% of the total', penAm:'ከጠቅላላው ቁጠባ ድርሻዎ ከ10% – 25% ነው',
  sections:[
    { en:'1 · Material usage', am:'1 · የቁሳቁስ አጠቃቀም', fields:[
      {id:'mat', en:'Usage against BOM', am:'ከBOM አንጻር አጠቃቀም', t:'grid',
       rows:[{en:'MDF', am:'MDF'},{en:'PVC edge', am:'የPVC ጠርዝ'},
             {en:'Hardware', am:'ሃርድዌር'},{en:'Accessories', am:'መለዋወጫዎች'},
             {en:'Other', am:'ሌላ'}],
       cols:[
        {id:'bom',  en:'BOM qty', am:'የBOM መጠን', t:'num'},
        {id:'used', en:'Actual used', am:'የዋለው መጠን', t:'num'},
        {id:'cost', en:'Unit cost', am:'የአንዱ ዋጋ', t:'money'},
        {id:'sav',  en:'Savings (Birr)', am:'ቁጠባ (ብር)', t:'money'}
      ]}
    ]},
    { en:'2 · Savings calculation', am:'2 · የቁጠባ ስሌት', fields:[
      {id:'tot_sav', en:'Total material savings', am:'ጠቅላላ የቁሳቁስ ቁጠባ', t:'money',
        tgt:{op:'gte', v:50000, en:'Your share starts at 50,000 Birr', am:'ድርሻዎ የሚጀምረው ከ50,000 ብር ነው'}},
      {id:'my_share', en:'Your share (10% – 25%)', am:'የእርስዎ ድርሻ (10% – 25%)', t:'money'}
    ]},
    { en:'3 · Quality verification', am:'3 · የጥራት ማረጋገጫ', fields:[
      {id:'qc_rate', en:'QC pass rate for the month', am:'የወሩ የQC ማለፊያ መጠን', t:'pct',
        tgt:{op:'gte', v:98, en:'Below 98% and the savings bonus is cancelled', am:'ከ98% በታች ከሆነ የቁጠባ ጉርሻ ይሰረዛል'}},
      {id:'compromise', en:'Any quality compromise caused by the savings', am:'በቁጠባ ምክንያት የጥራት መቀነስ ተፈጥሯል', t:'yesno'},
      {id:'wude_ok', en:'Wude (QC) confirms no quality compromise', am:'ውዱ (QC) የጥራት መቀነስ አለመኖሩን አረጋግጣለች', t:'yesno'}
    ]},
    { en:'4 · Waste sorting', am:'4 · የተረፈ ቁሳቁስ አያያዝ', fields:[
      {id:'m_offcuts', en:'Reusable offcuts stored properly', am:'እንደገና የሚያገለግሉ ቁርጥራጮች በአግባቡ ተቀምጠዋል', t:'yesno'},
      {id:'m_scrap', en:'Scrap material recorded', am:'የተረፈ ቁሳቁስ ተመዝግቧል', t:'yesno'},
      {id:'m_viol', en:'Violations', am:'ጥሰቶች', t:'area', opt:1}
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
      {id:'i_total', en:'Total inspected', am:'ጠቅላላ የተመረመሩ', t:'num'},
      {id:'i_pass', en:'Passed', am:'ያለፉ', t:'num'},
      {id:'i_fail', en:'Failed', am:'ያላለፉ', t:'num'},
      {id:'i_rate', en:'QC pass rate', am:'የQC ማለፊያ መጠን', t:'pct',
        tgt:{op:'gte', v:98, en:'≥98% earns the 2,000 Birr KPI bonus', am:'≥98% የ2,000 ብር KPI ጉርሻ ያስገኛል'}},
      {id:'i_jobs', en:'Jobs inspected', am:'የተመረመሩ ሥራዎች',
       t:'table', addEn:'Add job', addAm:'ሥራ ጨምር', cols:[
        {id:'code', en:'Job code', am:'የሥራ ኮድ', t:'text'},
        {id:'cust', en:'Customer', am:'ደንበኛ', t:'text'},
        {id:'m2',   en:'m²', am:'ካሬ ሜትር', t:'num'},
        {id:'pass', en:'Passed', am:'አልፏል', t:'yesno'},
        {id:'why',  en:'Reason for failure', am:'ያላለፈበት ምክንያት', t:'text'}
      ]}
    ]},
    { en:'2 · Defects found', am:'2 · የተገኙ ጉድለቶች', fields:[
      {id:'d_total', en:'Defects found today', am:'ዛሬ የተገኙ ጉድለቶች', t:'num'},
      {id:'d_released', en:'Defects released to finished goods', am:'ወደ ዝግጁ ዕቃ ማከማቻ የገቡ ጉድለቶች', t:'num',
        tgt:{op:'lte', v:0, en:'–500 Birr each, and the 1,500 Birr bonus is lost',
             am:'እያንዳንዱ –500 ብር፣ የ1,500 ብር ጉርሻም ይጠፋል'}},
      {id:'d_rows', en:'Defect detail', am:'የጉድለት ዝርዝር',
       t:'table', addEn:'Add defect', addAm:'ጉድለት ጨምር', cols:[
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
        {id:'doc', en:'Documented with photo', am:'በፎቶ ተመዝግቧል', t:'yesno'}
      ]}
    ]},
    { en:'3 · Rework', am:'3 · ዳግም ሥራ', fields:[
      {id:'r_required', en:'Jobs needing rework today', am:'ዛሬ ዳግም ሥራ የጠየቁ', t:'num'},
      {id:'r_done', en:'Rework completed', am:'የተጠናቀቀ ዳግም ሥራ', t:'num'},
      {id:'r_reinspected', en:'Re-inspected after rework', am:'ከዳግም ሥራ በኋላ እንደገና የተመረመሩ', t:'num'},
      {id:'r_rate', en:'Rework rate today', am:'የዛሬ የዳግም ሥራ መጠን', t:'pct',
        tgt:{op:'lte', v:2, en:'Below 2% earns 1,000 Birr; above 5% is –500 Birr',
             am:'ከ2% በታች 1,000 ብር፤ ከ5% በላይ –500 ብር'}},
      {id:'r_register', en:'Rework Register updated', am:'የዳግም ሥራ መዝገብ ተሞልቷል', t:'yesno'}
    ]},
    { en:'4 · Pressure or interference', am:'4 · ጫና ወይም ጣልቃ ገብነት', fields:[
      {id:'pr_any', en:'Did anyone pressure you to pass a defective product today', am:'ጉድለት ያለበትን ምርት እንዲያሳልፉ ዛሬ ማንም ጫና አድርጎብዎታል', t:'yesno'},
      {id:'pr_who', en:'If yes, who', am:'አዎ ከሆነ ማን', t:'text', opt:1},
      {id:'pr_reported', en:'Reported to Mahelet', am:'ለማህሌት ተነግሯል', t:'yesno', opt:1}
    ]},
    { en:'5 · Problems and solutions', am:'5 · ችግሮችና መፍትሔዎች', fields:[
      {id:'problem', en:'Problem', am:'ችግር', t:'area', opt:1},
      {id:'cause', en:'Root cause', am:'መሠረታዊ ምክንያት', t:'area', opt:1},
      {id:'action', en:'Action taken', am:'የተወሰደ እርምጃ', t:'area', opt:1},
      {id:'need_lead', en:'Need Mahelet decision', am:'የማህሌት ውሳኔ ያስፈልጋል', t:'yesno'}
    ]},
    { en:"6 · Tomorrow's top 3", am:'6 · የነገ ሦስት ቅድሚያዎች', fields:[
      {id:'p1', en:'1', am:'1', t:'text'},
      {id:'p2', en:'2', am:'2', t:'text'},
      {id:'p3', en:'3', am:'3', t:'text'}
    ]}
  ]
},

/* ========================= WUDE — WEEKLY QC =========================== */
{
  id:'wude-weekly', person:'wude', cadence:'weekly', dueTime:'17:00', dueDay:5,
  en:'Weekly QC Summary', am:'ሳምንታዊ የጥራት ቁጥጥር ማጠቃለያ',
  toEn:'Mahelet + Ephrata', toAm:'ማህሌት + ኤፍራታ',
  dueEn:'Friday 5:00 PM', dueAm:'ዓርብ ከቀኑ 11፡00 (5:00 PM)',
  penEn:'Late –500 Birr', penAm:'ዘግይቶ –500 ብር',
  sections:[
    { en:'1 · Inspection performance', am:'1 · የፍተሻ አፈጻጸም', fields:[
      {id:'w_inspected', en:'Total jobs inspected', am:'ጠቅላላ የተመረመሩ ሥራዎች', t:'num'},
      {id:'w_pass', en:'Jobs passed', am:'ያለፉ ሥራዎች', t:'num'},
      {id:'w_fail', en:'Jobs failed', am:'ያላለፉ ሥራዎች', t:'num'},
      {id:'w_rate', en:'QC pass rate', am:'የQC ማለፊያ መጠን', t:'pct',
        tgt:{op:'gte', v:98, en:'Below 98% is –500 Birr for the month', am:'ከ98% በታች ለወሩ –500 ብር'}}
    ]},
    { en:'2 · Defect analysis', am:'2 · የጉድለት ትንተና', fields:[
      {id:'defects', en:'Defects by type', am:'በዓይነት የተከፋፈሉ ጉድለቶች', t:'grid',
       rows:[{en:'Scratch', am:'ጭረት'},{en:'Stain', am:'እድፍ'},
             {en:'Dimension error', am:'የልኬት ስህተት'},{en:'Edge damage', am:'የጠርዝ ጉዳት'},
             {en:'Hardware issue', am:'የሃርድዌር ችግር'},{en:'Assembly issue', am:'የመገጣጠም ችግር'},
             {en:'Other', am:'ሌላ'}],
       cols:[
        {id:'n', en:'Count', am:'ብዛት', t:'num'},
        {id:'pct', en:'% of total', am:'ከጠቅላላው %', t:'pct'}
      ]},
      {id:'top_defect', en:'Top defect type this week', am:'በዚህ ሳምንት በብዛት የተከሰተ ጉድለት', t:'text'}
    ]},
    { en:'3 · Rework performance', am:'3 · የዳግም ሥራ አፈጻጸም', fields:[
      {id:'rw_req', en:'Total rework required', am:'ጠቅላላ የተጠየቀ ዳግም ሥራ', t:'num'},
      {id:'rw_done', en:'Rework completed', am:'የተጠናቀቀ ዳግም ሥራ', t:'num'},
      {id:'rw_rate', en:'Rework rate', am:'የዳግም ሥራ መጠን', t:'pct',
        tgt:{op:'lte', v:2, en:'Below 2% earns 1,000 Birr; above 5% is –500 Birr',
             am:'ከ2% በታች 1,000 ብር፤ ከ5% በላይ –500 ብር'}},
      {id:'rw_cost', en:'Rework cost', am:'የዳግም ሥራ ወጪ', t:'money'}
    ]},
    { en:'4 · Customer complaints', am:'4 · የደንበኛ ቅሬታዎች', fields:[
      {id:'c_recv', en:'Complaints related to QC', am:'ከQC ጋር የተያያዙ ቅሬታዎች', t:'num',
        tgt:{op:'lte', v:0, en:'–1,000 Birr each, and the 1,000 Birr bonus is lost',
             am:'እያንዳንዱ –1,000 ብር፣ የ1,000 ብር ጉርሻም ይጠፋል'}},
      {id:'c_res', en:'Complaints resolved', am:'የተፈቱ ቅሬታዎች', t:'num'},
      {id:'c_out', en:'Complaints outstanding', am:'ያልተፈቱ ቅሬታዎች', t:'num'}
    ]},
    { en:'5 · Pressure or interference', am:'5 · ጫና ወይም ጣልቃ ገብነት', fields:[
      {id:'pr_week', en:'Any pressure to pass defective products this week', am:'በዚህ ሳምንት ጉድለት ያለበትን ምርት እንዲያሳልፉ ጫና ተደርጎብዎታል', t:'yesno'},
      {id:'pr_det', en:'If yes, details', am:'አዎ ከሆነ ዝርዝሩ', t:'area', opt:1},
      {id:'pr_rep', en:'Reported to Mahelet', am:'ለማህሌት ተነግሯል', t:'yesno', opt:1}
    ]},
    { en:'6 · Problems and solutions', am:'6 · ችግሮችና መፍትሔዎች', fields:[
      {id:'problem', en:'Problem', am:'ችግር', t:'area', opt:1},
      {id:'action', en:'Action taken', am:'የተወሰደ እርምጃ', t:'area', opt:1},
      {id:'outstanding', en:'Outstanding issues', am:'ያልተፈቱ ጉዳዮች', t:'area', opt:1}
    ]},
    { en:"7 · Next week's plan", am:'7 · የሚቀጥለው ሳምንት ዕቅድ', fields:[
      {id:'n_exp', en:'Expected inspections', am:'የሚጠበቁ ፍተሻዎች', t:'num'},
      {id:'n_risk', en:'Key quality risks', am:'ዋና የጥራት ስጋቶች', t:'area', opt:1},
      {id:'n_support', en:'Support needed from Mahelet', am:'ከማህሌት የሚያስፈልግ ድጋፍ', t:'area', opt:1}
    ]}
  ]
},

/* ====================== WUDE — MONTHLY REWORK ========================= */
{
  id:'wude-monthly', person:'wude', cadence:'monthly', dueTime:'17:00',
  en:'Monthly Rework Report', am:'ወርሃዊ የዳግም ሥራ ሪፖርት',
  toEn:'Mahelet + Betty', toAm:'ማህሌት + ቤቲ',
  dueEn:'1st of the following month', dueAm:'በሚቀጥለው ወር 1ኛ ቀን',
  penEn:'Failure to report rework cost –200 Birr', penAm:'የዳግም ሥራ ወጪ ካልተነገረ –200 ብር',
  sections:[
    { en:'1 · Rework summary', am:'1 · የዳግም ሥራ ማጠቃለያ', fields:[
      {id:'m_inspected', en:'Total jobs inspected', am:'ጠቅላላ የተመረመሩ ሥራዎች', t:'num'},
      {id:'m_rework', en:'Jobs requiring rework', am:'ዳግም ሥራ የጠየቁ ሥራዎች', t:'num'},
      {id:'m_rate', en:'Rework rate', am:'የዳግም ሥራ መጠን', t:'pct',
        tgt:{op:'lte', v:2, en:'Below 2% earns the 1,000 Birr bonus', am:'ከ2% በታች የ1,000 ብር ጉርሻ ያስገኛል'}},
      {id:'m_cost', en:'Total rework cost', am:'ጠቅላላ የዳግም ሥራ ወጪ', t:'money'}
    ]},
    { en:'2 · Rework by cause', am:'2 · በምክንያት የተከፋፈለ ዳግም ሥራ', fields:[
      {id:'cause_grid', en:'Cause breakdown', am:'የምክንያት ክፍፍል', t:'grid',
       rows:[{en:'Cutting error', am:'የመቁረጥ ስህተት'},{en:'Assembly error', am:'የመገጣጠም ስህተት'},
             {en:'Edge banding error', am:'የጠርዝ ስህተት'},{en:'Hardware error', am:'የሃርድዌር ስህተት'},
             {en:'Material defect', am:'የቁሳቁስ ጉድለት'},{en:'Design error', am:'የዲዛይን ስህተት'},
             {en:'Other', am:'ሌላ'}],
       cols:[
        {id:'n', en:'Count', am:'ብዛት', t:'num'},
        {id:'cost', en:'Cost (Birr)', am:'ወጪ (ብር)', t:'money'}
      ]}
    ]},
    { en:'3 · Rework by responsible person', am:'3 · በኃላፊው የተከፋፈለ ዳግም ሥራ', fields:[
      {id:'who_rows', en:'Who caused the rework', am:'ዳግም ሥራውን ያስከተለው ማን ነው',
       t:'table', addEn:'Add person', addAm:'ሰው ጨምር', cols:[
        {id:'who',  en:'Person', am:'ሰው', t:'text'},
        {id:'n',    en:'Rework count', am:'የዳግም ሥራ ብዛት', t:'num'},
        {id:'cost', en:'Total cost', am:'ጠቅላላ ወጪ', t:'money'}
      ]}
    ]},
    { en:'4 · Quality verification', am:'4 · የጥራት ማረጋገጫ', fields:[
      {id:'v_rate', en:'QC pass rate for the month', am:'የወሩ የQC ማለፊያ መጠን', t:'pct',
        tgt:{op:'gte', v:98, en:'Below 98% is –500 Birr', am:'ከ98% በታች –500 ብር'}},
      {id:'v_released', en:'Defects released to finished goods', am:'ወደ ዝግጁ ዕቃ ማከማቻ የገቡ ጉድለቶች', t:'num',
        tgt:{op:'lte', v:0, en:'–500 Birr each', am:'እያንዳንዱ –500 ብር'}},
      {id:'v_complaints', en:'Customer complaints related to QC', am:'ከQC ጋር የተያያዙ የደንበኛ ቅሬታዎች', t:'num',
        tgt:{op:'lte', v:0, en:'–1,000 Birr each', am:'እያንዳንዱ –1,000 ብር'}}
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
      {id:'j_total', en:'Total jobs today', am:'የዛሬ ጠቅላላ ሥራዎች', t:'num'},
      {id:'j_done', en:'Completed', am:'የተጠናቀቁ', t:'num'},
      {id:'j_wip', en:'In progress', am:'በሂደት ላይ', t:'num'},
      {id:'j_m2', en:'Total m² installed today', am:'ዛሬ የተገጠመ ጠቅላላ ካሬ ሜትር', t:'num'},
      {id:'j_rows', en:'Jobs', am:'ሥራዎች',
       t:'table', addEn:'Add job', addAm:'ሥራ ጨምር', cols:[
        {id:'code',  en:'Job code', am:'የሥራ ኮድ', t:'text'},
        {id:'cust',  en:'Customer', am:'ደንበኛ', t:'text'},
        {id:'start', en:'Start time', am:'የተጀመረበት ሰዓት', t:'text'},
        {id:'fin',   en:'Finish time', am:'የተጠናቀቀበት ሰዓት', t:'text'},
        {id:'ontime',en:'On time', am:'በሰዓቱ', t:'yesno'}
      ]}
    ]},
    { en:'2 · Assembler performance', am:'2 · የገጣጣሚዎች አፈጻጸም', fields:[
      {id:'a_present', en:'Assemblers on site', am:'በቦታው የተገኙ ገጣጣሚዎች', t:'num'},
      {id:'a_late', en:'Assemblers late', am:'የዘገዩ ገጣጣሚዎች', t:'num',
        tgt:{op:'lte', v:0, en:'Unreported lateness is –200 Birr', am:'ያልተነገረ መዘግየት –200 ብር'}},
      {id:'a_early', en:'Assemblers who left early', am:'ቀድመው የወጡ ገጣጣሚዎች', t:'num',
        tgt:{op:'lte', v:0, en:'Unreported early leave is –200 Birr', am:'ያልተነገረ ቀድሞ መውጣት –200 ብር'}},
      {id:'a_behave', en:'Behaviour problems', am:'የሥነ ምግባር ችግሮች', t:'num',
        tgt:{op:'lte', v:0, en:'Unreported bad behaviour is –500 Birr', am:'ያልተነገረ የሥነ ምግባር ችግር –500 ብር'}},
      {id:'a_reported', en:'All issues reported to Mahelet', am:'ሁሉም ችግሮች ለማህሌት ተነግረዋል', t:'yesno'}
    ]},
    { en:'3 · Customer acceptance', am:'3 · የደንበኛ ተቀባይነት', fields:[
      {id:'ac_signed', en:'Customers who signed acceptance', am:'የተቀባይነት ፎርም የፈረሙ ደንበኞች', t:'num'},
      {id:'ac_complaints', en:'Customer complaints today', am:'የዛሬ የደንበኛ ቅሬታዎች', t:'num',
        tgt:{op:'lte', v:0, en:'A complaint costs the 3,000 + 2,000 Birr bonuses',
             am:'ቅሬታ የ3,000 + 2,000 ብር ጉርሻዎችን ያሳጣል'}},
      {id:'ac_called', en:'Customers called 30 minutes before arrival', am:'ከመድረስ 30 ደቂቃ በፊት የተደወለላቸው ደንበኞች', t:'ratio'}
    ]},
    { en:'4 · Quality check at site', am:'4 · በቦታው የተደረገ የጥራት ፍተሻ', fields:[
      {id:'q_walk', en:'Walk-through done with the customer', am:'ከደንበኛው ጋር ቅኝት ተደርጓል', t:'yesno'},
      {id:'q_doors', en:'Doors and drawers checked', am:'በሮችና መሳቢያዎች ተፈትሸዋል', t:'yesno'},
      {id:'q_edges', en:'Edges and handles checked', am:'ጠርዞችና እጀታዎች ተፈትሸዋል', t:'yesno'},
      {id:'q_rework', en:'Rework needed at site', am:'በቦታው ዳግም ሥራ ያስፈልጋል', t:'yesno'},
      {id:'q_reported', en:'Rework reported to Mahelet the same day', am:'ዳግም ሥራው በዕለቱ ለማህሌት ተነግሯል', t:'yesno', opt:1}
    ]},
    { en:'5 · Site cleanliness and property', am:'5 · የቦታ ጽዳትና የደንበኛ ንብረት', fields:[
      {id:'cl_clean', en:'Site left clean, all packaging removed', am:'ቦታው ንጹህ ሆኗል፣ ማሸጊያዎች ተነስተዋል', t:'yesno'},
      {id:'cl_protect', en:'Customer property protected', am:'የደንበኛ ንብረት ተጠብቋል', t:'yesno'},
      {id:'cl_damage', en:'Any customer property damaged', am:'የደንበኛ ንብረት ተጎድቷል', t:'yesno'},
      {id:'cl_tools', en:'Tools and unused materials returned to store', am:'መሣሪያዎችና ያልዋሉ ቁሳቁሶች ወደ መጋዘን ተመልሰዋል', t:'yesno'}
    ]},
    { en:'6 · WhatsApp compliance', am:'6 · የዋትስአፕ ተገዢነት', fields:[
      {id:'wa_welcome', en:'Assembler Welcome Message posted', am:'የገጣጣሚ አቀባበል መልዕክት ተልኳል', t:'yesno'},
      {id:'wa_started', en:'Installation Started message posted', am:'ተከላ መጀመሩ ተልኳል', t:'yesno'},
      {id:'wa_progress', en:'Assemblers posted Daily Progress Updates', am:'ገጣጣሚዎች የዕለት ሪፖርት ልከዋል', t:'yesno'},
      {id:'wa_accept', en:'Customer Acceptance Request posted', am:'የደንበኛ ተቀባይነት ጥያቄ ተልኳል', t:'yesno'},
      {id:'wa_viol', en:'WhatsApp violations by the site team', am:'በቡድኑ የተፈጸሙ የዋትስአፕ ጥሰቶች', t:'num',
        tgt:{op:'lte', v:0, en:'3 or more in a week cancels the 1,000 Birr bonus',
             am:'በሳምንት 3 እና ከዚያ በላይ የ1,000 ብር ጉርሻን ይሰርዛል'}}
    ]},
    { en:'7 · Problems and solutions', am:'7 · ችግሮችና መፍትሔዎች', fields:[
      {id:'problem', en:'Problem', am:'ችግር', t:'area', opt:1},
      {id:'cause', en:'Root cause', am:'መሠረታዊ ምክንያት', t:'area', opt:1},
      {id:'action', en:'Action taken', am:'የተወሰደ እርምጃ', t:'area', opt:1},
      {id:'need_lead', en:'Need Mahelet decision', am:'የማህሌት ውሳኔ ያስፈልጋል', t:'yesno'}
    ]},
    { en:"8 · Tomorrow's plan", am:'8 · የነገ ዕቅድ', fields:[
      {id:'t_rows', en:'Jobs planned for tomorrow', am:'ለነገ የታቀዱ ሥራዎች',
       t:'table', addEn:'Add job', addAm:'ሥራ ጨምር', cols:[
        {id:'code', en:'Job code', am:'የሥራ ኮድ', t:'text'},
        {id:'site', en:'Site', am:'ቦታ', t:'text'},
        {id:'crew', en:'Crew size', am:'የቡድን ብዛት', t:'num'},
        {id:'m2',   en:'Planned m²', am:'የታቀደ ካሬ ሜትር', t:'num'}
      ]}
    ]}
  ]
},

/* ======================== ELYAS — WEEKLY SITE ========================= */
{
  id:'elyas-weekly', person:'elyas', cadence:'weekly', dueTime:'17:00', dueDay:5,
  en:'Weekly Site Summary', am:'ሳምንታዊ የተከላ ማጠቃለያ',
  toEn:'Mahelet + Ephrata', toAm:'ማህሌት + ኤፍራታ',
  dueEn:'Friday 5:00 PM', dueAm:'ዓርብ ከቀኑ 11፡00 (5:00 PM)',
  penEn:'Late –500 Birr', penAm:'ዘግይቶ –500 ብር',
  sections:[
    { en:'1 · Installation performance', am:'1 · የተከላ አፈጻጸም', fields:[
      {id:'w_sched', en:'Jobs scheduled', am:'የታቀዱ ሥራዎች', t:'num'},
      {id:'w_done', en:'Jobs completed', am:'የተጠናቀቁ ሥራዎች', t:'num'},
      {id:'w_ontime', en:'Jobs completed on time', am:'በሰዓቱ የተጠናቀቁ ሥራዎች', t:'num',
        tgt:{op:'gte', v:3, en:'3 on time pays 400 Birr, 5 pays 600, 7+ pays 800',
             am:'3 በሰዓቱ 400 ብር፣ 5 ደግሞ 600፣ ከ7 በላይ 800 ብር'}},
      {id:'w_rate', en:'On-time rate', am:'በሰዓቱ የመጠናቀቅ መጠን', t:'pct',
        tgt:{op:'gte', v:95, en:'≥95% earns the 3,000 Birr KPI bonus', am:'≥95% የ3,000 ብር KPI ጉርሻ ያስገኛል'}},
      {id:'w_delayed', en:'Jobs delayed', am:'የዘገዩ ሥራዎች', t:'num'},
      {id:'w_why', en:'Reasons for delay', am:'የመዘግየት ምክንያቶች', t:'area', opt:1}
    ]},
    { en:'2 · Assembler performance', am:'2 · የገጣጣሚዎች አፈጻጸም', fields:[
      {id:'as_total', en:'Total assemblers', am:'ጠቅላላ ገጣጣሚዎች', t:'num'},
      {id:'as_att', en:'Average attendance', am:'አማካይ የተገኝነት መጠን', t:'pct'},
      {id:'as_late', en:'Assemblers with repeated lateness', am:'በተደጋጋሚ የዘገዩ ገጣጣሚዎች', t:'num'},
      {id:'as_behave', en:'Assemblers with behaviour issues', am:'የሥነ ምግባር ችግር ያለባቸው ገጣጣሚዎች', t:'num'},
      {id:'as_removal', en:'Assemblers recommended for removal', am:'እንዲነሱ የተጠቆሙ ገጣጣሚዎች', t:'num'}
    ]},
    { en:'3 · Customer acceptance', am:'3 · የደንበኛ ተቀባይነት', fields:[
      {id:'cs_signed', en:'Customers who signed acceptance', am:'የተቀባይነት ፎርም የፈረሙ ደንበኞች', t:'num'},
      {id:'cs_comp', en:'Customers who complained', am:'ቅሬታ ያቀረቡ ደንበኞች', t:'num',
        tgt:{op:'lte', v:0, en:'Zero is required for the 2,000 Birr satisfaction bonus',
             am:'ለ2,000 ብር የእርካታ ጉርሻ 0 መሆን አለበት'}},
      {id:'cs_res', en:'Complaints resolved', am:'የተፈቱ ቅሬታዎች', t:'num'},
      {id:'cs_out', en:'Complaints outstanding', am:'ያልተፈቱ ቅሬታዎች', t:'num'}
    ]},
    { en:'4 · Quality at site', am:'4 · በቦታው ያለ ጥራት', fields:[
      {id:'qs_rework', en:'Jobs with rework required', am:'ዳግም ሥራ የጠየቁ ሥራዎች', t:'num',
        tgt:{op:'lte', v:0, en:'Zero rework earns the 2,000 Birr site quality bonus',
             am:'ዳግም ሥራ ከሌለ የ2,000 ብር የጥራት ጉርሻ ያስገኛል'}},
      {id:'qs_fail', en:'Jobs with QC failure', am:'በQC ያላለፉ ሥራዎች', t:'num'},
      {id:'qs_cost', en:'Rework cost at site', am:'በቦታው የደረሰ የዳግም ሥራ ወጪ', t:'money'}
    ]},
    { en:'5 · WhatsApp compliance', am:'5 · የዋትስአፕ ተገዢነት', fields:[
      {id:'wk_welcome', en:'Welcome Messages posted', am:'የተላኩ የአቀባበል መልዕክቶች', t:'ratio'},
      {id:'wk_started', en:'Installation Started messages posted', am:'የተላኩ የተከላ መጀመሪያ መልዕክቶች', t:'ratio'},
      {id:'wk_progress', en:'Daily Progress Updates posted', am:'የተላኩ የዕለት ሪፖርቶች', t:'ratio'},
      {id:'wk_accept', en:'Customer Acceptance Requests posted', am:'የተላኩ የተቀባይነት ጥያቄዎች', t:'ratio'},
      {id:'wk_rate', en:'Compliance rate', am:'የተገዢነት መጠን', t:'pct',
        tgt:{op:'gte', v:100, en:'100% earns the 1,000 Birr WhatsApp bonus', am:'100% የ1,000 ብር ጉርሻ ያስገኛል'}}
    ]},
    { en:'6 · Problems and solutions', am:'6 · ችግሮችና መፍትሔዎች', fields:[
      {id:'problem', en:'Problem', am:'ችግር', t:'area', opt:1},
      {id:'action', en:'Action taken', am:'የተወሰደ እርምጃ', t:'area', opt:1},
      {id:'outstanding', en:'Outstanding issues', am:'ያልተፈቱ ጉዳዮች', t:'area', opt:1}
    ]},
    { en:"7 · Next week's plan", am:'7 · የሚቀጥለው ሳምንት ዕቅድ', fields:[
      {id:'n_jobs', en:'Jobs scheduled', am:'የታቀዱ ሥራዎች', t:'num'},
      {id:'n_m2', en:'Expected m²', am:'የሚጠበቅ ካሬ ሜትር', t:'num'},
      {id:'n_support', en:'Support needed from Mahelet', am:'ከማህሌት የሚያስፈልግ ድጋፍ', t:'area', opt:1}
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
    { en:'1 · Sites supported today', am:'1 · ዛሬ የደገፍኳቸው ቦታዎች', fields:[
      {id:'s_count', en:'Sites supported', am:'የተደገፉ ቦታዎች', t:'num'},
      {id:'s_arrive', en:'Arrival time at first site', am:'መጀመሪያ ቦታ የደረስኩበት ሰዓት', t:'text'},
      {id:'s_depart', en:'Departure time from last site', am:'ከመጨረሻው ቦታ የወጣሁበት ሰዓት', t:'text'},
      {id:'s_late', en:'Were you late to any site', am:'ወደ አንዱ ቦታ ዘግይቼ ደርሻለሁ', t:'yesno'},
      {id:'s_rows', en:'Sites', am:'ቦታዎች',
       t:'table', addEn:'Add site', addAm:'ቦታ ጨምር', cols:[
        {id:'code', en:'Job code', am:'የሥራ ኮድ', t:'text'},
        {id:'cust', en:'Customer', am:'ደንበኛ', t:'text'},
        {id:'site', en:'Site', am:'ቦታ', t:'text'}
      ]}
    ]},
    { en:'2 · Support provided', am:'2 · የተሰጠ ድጋፍ', fields:[
      {id:'sup', en:'Tasks supported today', am:'ዛሬ የደገፍኳቸው ሥራዎች', t:'grid',
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
      {id:'q_found', en:'Defects you found', am:'ያገኘኋቸው ጉድለቶች', t:'num'},
      {id:'q_reported', en:'All defects reported to Elyas', am:'ሁሉም ጉድለቶች ለኤልያስ ተነግረዋል', t:'yesno'},
      {id:'q_missed', en:'Any defect you missed that was found later', am:'ቆይቶ የተገኘ ያመለጠኝ ጉድለት አለ', t:'yesno'}
    ]},
    { en:'4 · Site cleanliness', am:'4 · የቦታ ጽዳት', fields:[
      {id:'c_clean', en:'Every site left clean', am:'ሁሉም ቦታዎች ንጹህ ሆነዋል', t:'yesno'},
      {id:'c_pack', en:'All packaging removed', am:'ሁሉም ማሸጊያዎች ተነስተዋል', t:'yesno'},
      {id:'c_tools', en:'All tools collected and returned', am:'ሁሉም መሣሪያዎች ተሰብስበው ተመልሰዋል', t:'yesno'},
      {id:'c_property', en:'Customer property protected', am:'የደንበኛ ንብረት ተጠብቋል', t:'yesno'},
      {id:'c_damage', en:'Any material damaged in handling or transport', am:'በአያያዝ ወይም በማጓጓዝ የተጎዳ ቁሳቁስ አለ', t:'yesno'}
    ]},
    { en:'5 · WhatsApp support', am:'5 · የዋትስአፕ ድጋፍ', fields:[
      {id:'w_helped', en:'Helped assemblers post the Daily Progress Update', am:'ገጣጣሚዎች የዕለት ሪፖርት እንዲልኩ ረድቻለሁ', t:'yesno'},
      {id:'w_missing', en:'Any missing update reported to Elyas', am:'ያልተላከ ሪፖርት ለኤልያስ ተነግሯል', t:'yesno', opt:1}
    ]},
    { en:'6 · Problems and solutions', am:'6 · ችግሮችና መፍትሔዎች', fields:[
      {id:'problem', en:'Problem', am:'ችግር', t:'area', opt:1},
      {id:'action', en:'Action taken', am:'የተወሰደ እርምጃ', t:'area', opt:1},
      {id:'reported', en:'Reported to Elyas', am:'ለኤልያስ ተነግሯል', t:'yesno'}
    ]},
    { en:"7 · Tomorrow", am:'7 · ነገ', fields:[
      {id:'n_sites', en:'Sites assigned', am:'የተመደቡ ቦታዎች', t:'text', opt:1},
      {id:'n_support', en:'Support needed', am:'የሚያስፈልግ ድጋፍ', t:'text', opt:1}
    ]}
  ]
},

];

/* ---------------------------------------------------------------------------
   Two salespeople file the same two forms; five designers file the same two.
   Define each form once here and stamp a copy per person, so a fix to a field
   reaches all seven people instead of seven places.
   --------------------------------------------------------------------------- */

const SALES_DAILY = {
  id:'sales-daily', cadence:'daily', dueTime:'17:30',
  en:'Daily Sales Activity Report', am:'ዕለታዊ የሽያጭ እንቅስቃሴ ሪፖርት',
  toEn:'Ephrata', toAm:'ኤፍራታ',
  dueEn:'5:30 PM every working day', dueAm:'በየሥራ ቀኑ ከቀኑ 11፡30 (5:30 PM)',
  penEn:'Late –200 Birr · Missing –500 Birr', penAm:'ዘግይቶ –200 ብር · ካልተላከ –500 ብር',
  sections:[
    { en:'1 · Leads today', am:'1 · የዛሬ አዲስ ደንበኞች', fields:[
      {id:'l_total', en:'New leads received', am:'ጠቅላላ ብዛት', t:'num'},
      {id:'l_social', en:'Social media', am:'ሶሻል ሚዲያ', t:'num', i:1},
      {id:'l_show', en:'Showroom', am:'ሾውሩም', t:'num', i:1},
      {id:'l_ref', en:'Referral', am:'ሪፈራል', t:'num', i:1},
      {id:'l_agent', en:'Agent', am:'ኤጀንት', t:'num', i:1},
      {id:'l_other', en:'Other', am:'ሌላ', t:'num', i:1}
    ]},
    { en:'2 · Lead response', am:'2 · የምላሽ ፍጥነት', fields:[
      {id:'r_1hr', en:'Leads contacted within 1 hour', am:'በ1 ሰዓት ውስጥ የተደወለላቸው', t:'ratio',
        tgt:{op:'gte', v:100, en:'Stage 1 of your commission — –200 Birr per missed lead',
             am:'የኮሚሽንዎ 1ኛ ደረጃ — ላመለጠ እያንዳንዱ –200 ብር'}},
      {id:'r_show', en:'Showroom visitors engaged same day', am:'በዕለቱ የተስተናገዱ ሾውሩም ጎብኚዎች', t:'ratio'}
    ]},
    { en:'3 · Site visits', am:'3 · የቦታ ጉብኝት', fields:[
      {id:'v_booked', en:'Site visits booked today', am:'ዛሬ የተያዙ ጉብኝቶች', t:'num'},
      {id:'v_done', en:'Site visits completed today', am:'ዛሬ የተከናወኑ ጉብኝቶች', t:'num'},
      {id:'v_late', en:'Visits pending beyond 48 hours', am:'ከ48 ሰዓት በላይ የዘገዩ ጉብኝቶች', t:'num',
        tgt:{op:'lte', v:0, en:'–300 Birr each', am:'እያንዳንዱ –300 ብር'}}
    ]},
    { en:'4 · Quotations', am:'4 · ፕሮፎርማ', fields:[
      {id:'q_issued', en:'Quotations issued today', am:'ዛሬ የተሰጡ ፕሮፎርማዎች', t:'num'},
      {id:'q_margin', en:'Average margin per m²', am:'አማካይ ትርፍ በካሬ ሜትር', t:'money',
        tgt:{op:'gte', v:6000, en:'Margin floor 6,000 Birr/m² — below without approval is –1,000 Birr',
             am:'ዝቅተኛው ትርፍ በካሬ ሜትር 6,000 ብር — ያለፈቃድ ከዚህ በታች –1,000 ብር'}},
      {id:'q_expiry', en:'Every quotation states the 7-day expiry', am:'ሁሉም ፕሮፎርማዎች የ7 ቀን ገደብ ተጽፎባቸዋል', t:'yesno'}
    ]},
    { en:'5 · Contracts', am:'5 · ውሎች', fields:[
      {id:'c_signed', en:'Contracts signed today', am:'ዛሬ የተፈረሙ ውሎች', t:'num'},
      {id:'c_value', en:'Total value', am:'ጠቅላላ ዋጋ', t:'money'},
      {id:'c_adv', en:'Advance collected today', am:'ዛሬ የተሰበሰበ ቅድመ ክፍያ', t:'money'},
      {id:'c_banked', en:'Advance banked the same day', am:'ቅድመ ክፍያ በዕለቱ ባንክ ገብቷል', t:'yesno'}
    ]},
    { en:'6 · Cash collection', am:'6 · የገንዘብ ስብሰባ', fields:[
      {id:'k_today', en:'External collections today', am:'ዛሬ ከደንበኞች የተሰበሰበ ገንዘብ', t:'money'},
      {id:'k_week', en:'Running weekly total', am:'የዚህ ሳምንት ጠቅላላ እስካሁን', t:'money',
        tgt:{op:'gte', v:2000000, en:'Your weekly target is 2,000,000 Birr collected',
             am:'የሳምንቱ ዒላማዎ 2,000,000 ብር የተሰበሰበ ገንዘብ ነው'}}
    ]},
    { en:'7 · WhatsApp compliance', am:'7 · የዋትስአፕ ተገዢነት', fields:[
      {id:'w_groups', en:'Active customer groups', am:'ንቁ የደንበኛ ግሩፖች', t:'num'},
      {id:'w_stage', en:'Required stage messages posted', am:'የተላኩ የደረጃ መልዕክቶች', t:'ratio',
        tgt:{op:'gte', v:100, en:'A missed stage message loses that stage’s commission',
             am:'ያልተላከ የደረጃ መልዕክት የዚያን ደረጃ ኮሚሽን ያሳጣል'}},
      {id:'w_unans', en:'Messages unanswered over 2 hours', am:'ከ2 ሰዓት በላይ ምላሽ ያላገኙ', t:'num',
        tgt:{op:'lte', v:0, en:'–200 Birr each', am:'እያንዳንዱ –200 ብር'}},
      {id:'w_comp', en:'Customer complaints about communication', am:'በመግባቢያ ላይ የደንበኛ ቅሬታ', t:'num',
        tgt:{op:'lte', v:0, en:'–1,000 Birr each', am:'እያንዳንዱ –1,000 ብር'}}
    ]},
    { en:'8 · Problems and solutions', am:'8 · ችግሮችና መፍትሔዎች', fields:[
      {id:'problem', en:'Problem', am:'ችግር', t:'area', opt:1},
      {id:'cause', en:'Root cause', am:'መሠረታዊ ምክንያት', t:'area', opt:1},
      {id:'action', en:'Action taken', am:'የተወሰደ እርምጃ', t:'area', opt:1},
      {id:'need_lead', en:'Need Ephrata decision', am:'የኤፍራታ ውሳኔ ያስፈልጋል', t:'yesno'}
    ]},
    { en:"9 · Tomorrow's top 3", am:'9 · የነገ ሦስት ቅድሚያዎች', fields:[
      {id:'p1', en:'1', am:'1', t:'text'},
      {id:'p2', en:'2', am:'2', t:'text'},
      {id:'p3', en:'3', am:'3', t:'text'}
    ]}
  ]
};

const SALES_WEEKLY = {
  id:'sales-weekly', cadence:'weekly', dueTime:'16:00', dueDay:5,
  en:'Weekly Sales Summary', am:'ሳምንታዊ የሽያጭ ማጠቃለያ',
  toEn:'Ephrata', toAm:'ኤፍራታ',
  dueEn:'Friday 4:00 PM', dueAm:'ዓርብ ከቀኑ 10፡00 (4:00 PM)',
  penEn:'Late –500 Birr', penAm:'ዘግይቶ –500 ብር',
  sections:[
    { en:'1 · Sales performance', am:'1 · የሽያጭ አፈጻጸም', fields:[
      {id:'s_contracts', en:'Contracts signed this week', am:'በዚህ ሳምንት የተፈረሙ ውሎች', t:'num'},
      {id:'s_value', en:'Total contract value', am:'ጠቅላላ የውል ዋጋ', t:'money'},
      {id:'s_coll', en:'External collections (bank confirmed)', am:'ከደንበኞች የተሰበሰበ (በባንክ የተረጋገጠ)', t:'money',
        tgt:{op:'gte', v:2000000, en:'Target 2,000,000 Birr — below 1,000,000 is a failed week',
             am:'ዒላማ 2,000,000 ብር — ከ1,000,000 በታች የወደቀ ሳምንት ነው'}}
    ]},
    { en:'2 · Collections day by day', am:'2 · በየቀኑ የተሰበሰበ ገንዘብ', fields:[
      {id:'days', en:'Bank-confirmed collections', am:'በባንክ የተረጋገጠ ገቢ', t:'grid',
       rows:[{en:'Monday', am:'ሰኞ'},{en:'Tuesday', am:'ማክሰኞ'},{en:'Wednesday', am:'ረቡዕ'},
             {en:'Thursday', am:'ሐሙስ'},{en:'Friday', am:'ዓርብ'},{en:'Saturday', am:'ቅዳሜ'}],
       cols:[{id:'amt', en:'Collected', am:'የተሰበሰበ', t:'money'}]}
    ]},
    { en:'3 · Lead performance', am:'3 · የደንበኛ አያያዝ አፈጻጸም', fields:[
      {id:'lp_total', en:'Total new leads', am:'ጠቅላላ አዲስ ደንበኞች', t:'num'},
      {id:'lp_1hr', en:'Leads contacted within 1 hour', am:'በ1 ሰዓት ውስጥ የተደወለላቸው', t:'ratio'},
      {id:'lp_visits', en:'Site visits completed', am:'የተከናወኑ ጉብኝቶች', t:'num'},
      {id:'lp_quotes', en:'Quotations issued', am:'የተሰጡ ፕሮፎርማዎች', t:'num'},
      {id:'lp_conv', en:'Conversion rate (leads → contracts)', am:'ወደ ውል የተቀየሩ መጠን', t:'pct'},
      {id:'lp_follow', en:'Lead follow-up rate', am:'የክትትል መጠን', t:'pct',
        tgt:{op:'gte', v:50, en:'Below 50% is –300 Birr', am:'ከ50% በታች –300 ብር'}}
    ]},
    { en:'4 · Margin performance', am:'4 · የትርፍ አፈጻጸም', fields:[
      {id:'mg_avg', en:'Average margin per m²', am:'አማካይ ትርፍ በካሬ ሜትር', t:'money',
        tgt:{op:'gte', v:6000, en:'Margin floor 6,000 Birr/m²', am:'ዝቅተኛው ትርፍ በካሬ ሜትር 6,000 ብር'}},
      {id:'mg_below', en:'Contracts below the margin floor', am:'ከዝቅተኛው ትርፍ በታች የተፈረሙ ውሎች', t:'num',
        tgt:{op:'lte', v:0, en:'–1,000 Birr each without approval', am:'ያለፈቃድ እያንዳንዱ –1,000 ብር'}}
    ]},
    { en:'5 · Commission', am:'5 · ኮሚሽን', fields:[
      {id:'cm_earned', en:'Commission earned this week', am:'በዚህ ሳምንት የተገኘ ኮሚሽን', t:'money'},
      {id:'cm_missed', en:'Stages missed', am:'ያመለጡ ደረጃዎች', t:'num',
        tgt:{op:'lte', v:0, en:'Each missed stage loses its share of the 2%',
             am:'እያንዳንዱ ያመለጠ ደረጃ ከ2% ድርሻውን ያሳጣል'}},
      {id:'cm_lost', en:'Commission lost', am:'የጠፋ ኮሚሽን', t:'money'}
    ]},
    { en:'6 · WhatsApp compliance', am:'6 · የዋትስአፕ ተገዢነት', fields:[
      {id:'ww_groups', en:'Active customer groups', am:'ንቁ የደንበኛ ግሩፖች', t:'num'},
      {id:'ww_posted', en:'Stage messages posted', am:'የተላኩ የደረጃ መልዕክቶች', t:'ratio'},
      {id:'ww_rate', en:'Compliance rate', am:'የተገዢነት መጠን', t:'pct',
        tgt:{op:'gte', v:100, en:'Every stage message must be posted', am:'እያንዳንዱ የደረጃ መልዕክት መላክ አለበት'}},
      {id:'ww_unans', en:'Messages unanswered over 2 hours', am:'ከ2 ሰዓት በላይ ምላሽ ያላገኙ', t:'num',
        tgt:{op:'lte', v:0, en:'–200 Birr each', am:'እያንዳንዱ –200 ብር'}}
    ]},
    { en:'7 · Customer satisfaction', am:'7 · የደንበኛ እርካታ', fields:[
      {id:'cu_recv', en:'Complaints received', am:'የደረሱ ቅሬታዎች', t:'num'},
      {id:'cu_res', en:'Complaints resolved', am:'የተፈቱ ቅሬታዎች', t:'num'},
      {id:'cu_out', en:'Complaints outstanding', am:'ያልተፈቱ ቅሬታዎች', t:'num',
        tgt:{op:'lte', v:0, en:'Unresolved past 7 days loses the full commission on that job',
             am:'ከ7 ቀን በላይ ያልተፈታ የዚያን ሥራ ሙሉ ኮሚሽን ያሳጣል'}}
    ]},
    { en:'8 · Problems and solutions', am:'8 · ችግሮችና መፍትሔዎች', fields:[
      {id:'problem', en:'Problem', am:'ችግር', t:'area', opt:1},
      {id:'action', en:'Action taken', am:'የተወሰደ እርምጃ', t:'area', opt:1},
      {id:'outstanding', en:'Outstanding issues', am:'ያልተፈቱ ጉዳዮች', t:'area', opt:1}
    ]},
    { en:"9 · Next week's plan", am:'9 · የሚቀጥለው ሳምንት ዕቅድ', fields:[
      {id:'n_contracts', en:'Contracts expected', am:'የሚጠበቁ ውሎች', t:'num'},
      {id:'n_value', en:'Value expected', am:'የሚጠበቅ ዋጋ', t:'money'},
      {id:'n_custs', en:'Key customers in negotiation', am:'በድርድር ላይ ያሉ ዋና ደንበኞች', t:'area', opt:1},
      {id:'n_support', en:'Support needed from Ephrata', am:'ከኤፍራታ የሚያስፈልግ ድጋፍ', t:'area', opt:1}
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
    { en:'1 · Measurements today', am:'1 · የዛሬ ልኬቶች', fields:[
      {id:'m_pre', en:'Pre-measurements completed', am:'የተጠናቀቁ ቅድመ ልኬቶች', t:'num'},
      {id:'m_pre_ontime', en:'Pre-measurements within 48 hours of the lead', am:'ደንበኛው ከመጣ በ48 ሰዓት ውስጥ የተደረጉ', t:'ratio',
        tgt:{op:'gte', v:100, en:'Late is –300 Birr and loses stage 1', am:'ዘግይቶ –300 ብር እና 1ኛ ደረጃን ያሳጣል'}},
      {id:'m_fin', en:'Final measurements completed', am:'የተጠናቀቁ የመጨረሻ ልኬቶች', t:'num'},
      {id:'m_fin_ontime', en:'Final measurements within 24 hours of the advance', am:'ከቅድመ ክፍያ በ24 ሰዓት ውስጥ የተደረጉ', t:'ratio',
        tgt:{op:'gte', v:100, en:'Late is –300 Birr and loses stage 4', am:'ዘግይቶ –300 ብር እና 4ኛ ደረጃን ያሳጣል'}}
    ]},
    { en:'2 · Video documentation', am:'2 · የቪዲዮ ማስረጃ', fields:[
      {id:'v_pre_rec', en:'Pre-measurement videos recorded (3–5 min)', am:'የተቀረጹ የቅድመ ልኬት ቪዲዮዎች (3–5 ደቂቃ)', t:'ratio',
        tgt:{op:'gte', v:100, en:'A missing video is –500 Birr and loses 0.2%',
             am:'ያልተቀረጸ ቪዲዮ –500 ብር እና 0.2% ያሳጣል'}},
      {id:'v_fin_rec', en:'Final measurement videos recorded (5–8 min)', am:'የተቀረጹ የመጨረሻ ልኬት ቪዲዮዎች (5–8 ደቂቃ)', t:'ratio',
        tgt:{op:'gte', v:100, en:'A missing video is –500 Birr and loses 0.3%',
             am:'ያልተቀረጸ ቪዲዮ –500 ብር እና 0.3% ያሳጣል'}},
      {id:'v_uploaded', en:'Videos uploaded within 24 hours', am:'በ24 ሰዓት ውስጥ የተጫኑ ቪዲዮዎች', t:'ratio',
        tgt:{op:'gte', v:100, en:'Late upload is –200 Birr', am:'ዘግይቶ መጫን –200 ብር'}},
      {id:'v_consent', en:'Customer consent recorded on camera every time', am:'የደንበኛ ፈቃድ በካሜራ ተቀርጿል', t:'yesno'},
      {id:'v_disc', en:'Design discussions recorded', am:'የተቀረጹ የዲዛይን ውይይቶች', t:'num'}
    ]},
    { en:'3 · Designs delivered', am:'3 · የቀረቡ ዲዛይኖች', fields:[
      {id:'d_pre', en:'Pre-designs delivered', am:'የቀረቡ ቅድመ ዲዛይኖች', t:'num'},
      {id:'d_pre_ontime', en:'Pre-designs within 24 hours of measurement', am:'ከልኬት በ24 ሰዓት ውስጥ የቀረቡ', t:'ratio',
        tgt:{op:'gte', v:100, en:'Late is –300 Birr', am:'ዘግይቶ –300 ብር'}},
      {id:'d_fin', en:'Final 3D designs delivered', am:'የቀረቡ የመጨረሻ 3D ዲዛይኖች', t:'num'},
      {id:'d_approved', en:'Written customer approvals received', am:'የተገኙ የጽሑፍ የደንበኛ ማጽደቆች', t:'num'},
      {id:'d_rev', en:'Revisions requested', am:'የተጠየቁ ማሻሻያዎች', t:'num'}
    ]},
    { en:'4 · Material selection', am:'4 · የቁሳቁስ ምርጫ', fields:[
      {id:'ms_signed', en:'Material Selection Forms physically signed', am:'በእጅ የተፈረሙ የቁሳቁስ ምርጫ ፎርሞች', t:'num'},
      {id:'ms_photo', en:'Photos of signed forms posted', am:'የተፈረሙ ፎርሞች ፎቶ ተልኳል', t:'ratio',
        tgt:{op:'gte', v:100, en:'Missing photo is –200 Birr and loses 0.3%',
             am:'ፎቶ ካልተላከ –200 ብር እና 0.3% ያሳጣል'}},
      {id:'ms_a', en:'Option A chosen (stock)', am:'አማራጭ A የተመረጠ (በመጋዘን ያለ)', t:'num'},
      {id:'ms_b', en:'Option B chosen (imported)', am:'አማራጭ B የተመረጠ (ከውጭ የሚመጣ)', t:'num'},
      {id:'ms_codes', en:'Board and PVC edge codes confirmed in the Job File', am:'የቦርድና የPVC ጠርዝ ኮዶች በሥራ ፋይል ተረጋግጠዋል', t:'yesno'}
    ]},
    { en:'5 · Designer Profile and drawings', am:'5 · የዲዛይነር ፕሮፋይልና ሥዕሎች', fields:[
      {id:'dp_done', en:'Designer Profiles completed', am:'የተሞሉ የዲዛይነር ፕሮፋይሎች', t:'ratio',
        tgt:{op:'gte', v:100, en:'Missing is –300 Birr and loses the final design commission',
             am:'ካልተሞላ –300 ብር እና የመጨረሻ ዲዛይን ኮሚሽንን ያሳጣል'}},
      {id:'pd_sub', en:'Production drawings submitted', am:'የቀረቡ የምርት ሥዕሎች', t:'num'},
      {id:'pd_check', en:'Production Drawing Checklist completed', am:'የምርት ሥዕል ማረጋገጫ ዝርዝር ተሞልቷል', t:'yesno'},
      {id:'pd_err', en:'Drawings with a material code error', am:'የቁሳቁስ ኮድ ስህተት ያለባቸው ሥዕሎች', t:'num',
        tgt:{op:'lte', v:0, en:'–500 Birr each', am:'እያንዳንዱ –500 ብር'}}
    ]},
    { en:'6 · Complaints assigned to me', am:'6 · ለእኔ የተመደቡ ቅሬታዎች', fields:[
      {id:'cp_assigned', en:'Complaints assigned', am:'የተመደቡ ቅሬታዎች', t:'num'},
      {id:'cp_24', en:'Customer contacted within 24 hours', am:'በ24 ሰዓት ውስጥ የተደወለላቸው', t:'ratio',
        tgt:{op:'gte', v:100, en:'Missing is –300 Birr', am:'ካልተደወለ –300 ብር'}},
      {id:'cp_48', en:'Solution proposed within 48 hours', am:'በ48 ሰዓት ውስጥ መፍትሔ የቀረበላቸው', t:'ratio',
        tgt:{op:'gte', v:100, en:'Missing is –500 Birr', am:'ካልቀረበ –500 ብር'}},
      {id:'cp_res', en:'Complaints resolved', am:'የተፈቱ ቅሬታዎች', t:'num'},
      {id:'cp_out', en:'Complaints outstanding', am:'ያልተፈቱ ቅሬታዎች', t:'num',
        tgt:{op:'lte', v:0, en:'Past 7 days is –1,000 Birr and the rest of that commission',
             am:'ከ7 ቀን በላይ –1,000 ብር እና የቀረው ኮሚሽን'}}
    ]},
    { en:'7 · WhatsApp compliance', am:'7 · የዋትስአፕ ተገዢነት', fields:[
      {id:'wd_stage', en:'Design stage messages posted', am:'የተላኩ የዲዛይን ደረጃ መልዕክቶች', t:'ratio',
        tgt:{op:'gte', v:100, en:'A missed message loses that stage’s commission',
             am:'ያልተላከ መልዕክት የዚያን ደረጃ ኮሚሽን ያሳጣል'}},
      {id:'wd_sum', en:'Design Discussion Summaries posted', am:'የተላኩ የውይይት ማጠቃለያዎች', t:'num'},
      {id:'wd_unans', en:'Messages unanswered over 2 hours', am:'ከ2 ሰዓት በላይ ምላሽ ያላገኙ', t:'num',
        tgt:{op:'lte', v:0, en:'–200 Birr each', am:'እያንዳንዱ –200 ብር'}},
      {id:'wd_comp', en:'Customer complaints about design communication', am:'በዲዛይን መግባቢያ ላይ የደንበኛ ቅሬታ', t:'num',
        tgt:{op:'lte', v:0, en:'–1,000 Birr each', am:'እያንዳንዱ –1,000 ብር'}}
    ]},
    { en:'8 · Problems and solutions', am:'8 · ችግሮችና መፍትሔዎች', fields:[
      {id:'problem', en:'Problem', am:'ችግር', t:'area', opt:1},
      {id:'cause', en:'Root cause', am:'መሠረታዊ ምክንያት', t:'area', opt:1},
      {id:'action', en:'Action taken', am:'የተወሰደ እርምጃ', t:'area', opt:1},
      {id:'need_lead', en:'Need Ephrata decision', am:'የኤፍራታ ውሳኔ ያስፈልጋል', t:'yesno'}
    ]},
    { en:"9 · Tomorrow's top 3", am:'9 · የነገ ሦስት ቅድሚያዎች', fields:[
      {id:'p1', en:'1', am:'1', t:'text'},
      {id:'p2', en:'2', am:'2', t:'text'},
      {id:'p3', en:'3', am:'3', t:'text'}
    ]}
  ]
};

const DESIGN_WEEKLY = {
  id:'design-weekly', cadence:'weekly', dueTime:'16:00', dueDay:5,
  en:'Weekly Design Summary', am:'ሳምንታዊ የዲዛይን ማጠቃለያ',
  toEn:'Ephrata', toAm:'ኤፍራታ',
  dueEn:'Friday 4:00 PM', dueAm:'ዓርብ ከቀኑ 10፡00 (4:00 PM)',
  penEn:'Late –500 Birr', penAm:'ዘግይቶ –500 ብር',
  sections:[
    { en:'1 · Measurements', am:'1 · ልኬቶች', fields:[
      {id:'wm_pre', en:'Pre-measurements completed', am:'የተጠናቀቁ ቅድመ ልኬቶች', t:'num'},
      {id:'wm_fin', en:'Final measurements completed', am:'የተጠናቀቁ የመጨረሻ ልኬቶች', t:'num'},
      {id:'wm_ontime', en:'Measurements on time', am:'በሰዓቱ የተደረጉ ልኬቶች', t:'ratio'},
      {id:'wm_lead', en:'Average hours from lead to pre-measurement', am:'ከደንበኛ መምጣት እስከ ቅድመ ልኬት አማካይ ሰዓት', t:'num',
        tgt:{op:'lte', v:48, en:'Must be within 48 hours', am:'በ48 ሰዓት ውስጥ መሆን አለበት'}}
    ]},
    { en:'2 · Designs', am:'2 · ዲዛይኖች', fields:[
      {id:'wd_pre', en:'Pre-designs delivered', am:'የቀረቡ ቅድመ ዲዛይኖች', t:'num'},
      {id:'wd_fin', en:'Final 3D designs delivered', am:'የቀረቡ የመጨረሻ 3D ዲዛይኖች', t:'num'},
      {id:'wd_ontime', en:'Designs on time', am:'በሰዓቱ የቀረቡ ዲዛይኖች', t:'ratio'},
      {id:'wd_rev', en:'Design revisions required', am:'የተጠየቁ ማሻሻያዎች', t:'num'}
    ]},
    { en:'3 · Video documentation', am:'3 · የቪዲዮ ማስረጃ', fields:[
      {id:'wv_pre', en:'Pre-measurement videos recorded and uploaded', am:'የተቀረጹና የተጫኑ የቅድመ ልኬት ቪዲዮዎች', t:'ratio'},
      {id:'wv_fin', en:'Final measurement videos recorded and uploaded', am:'የተቀረጹና የተጫኑ የመጨረሻ ልኬት ቪዲዮዎች', t:'ratio'},
      {id:'wv_disc', en:'Design discussions recorded', am:'የተቀረጹ የዲዛይን ውይይቶች', t:'ratio'},
      {id:'wv_audit', en:'Expected Video Quality Audit score', am:'የሚጠበቅ የቪዲዮ ጥራት ኦዲት ውጤት', t:'pct',
        tgt:{op:'gte', v:90, en:'≥90% earns 1,000 Birr; below 60% is –1,500 Birr',
             am:'≥90% 1,000 ብር፤ ከ60% በታች –1,500 ብር'}}
    ]},
    { en:'4 · Material selection', am:'4 · የቁሳቁስ ምርጫ', fields:[
      {id:'wms_signed', en:'Forms signed', am:'የተፈረሙ ፎርሞች', t:'num'},
      {id:'wms_a', en:'Option A chosen', am:'አማራጭ A የተመረጠ', t:'num'},
      {id:'wms_b', en:'Option B chosen', am:'አማራጭ B የተመረጠ', t:'num'},
      {id:'wms_missing', en:'Forms missing a signature', am:'ፊርማ የጎደላቸው ፎርሞች', t:'num',
        tgt:{op:'lte', v:0, en:'–500 Birr each and loses 0.3%', am:'እያንዳንዱ –500 ብር እና 0.3% ያሳጣል'}},
      {id:'wms_photo', en:'Photos posted', am:'የተላኩ ፎቶዎች', t:'ratio'}
    ]},
    { en:'5 · Job File documentation', am:'5 · የሥራ ፋይል ሰነዶች', fields:[
      {id:'jf_profiles', en:'Designer Profiles completed', am:'የተሞሉ የዲዛይነር ፕሮፋይሎች', t:'ratio'},
      {id:'jf_incomplete', en:'Incomplete Job Files', am:'ያልተሟሉ የሥራ ፋይሎች', t:'num',
        tgt:{op:'lte', v:0, en:'3 in a month cancels the month’s commission',
             am:'በወር 3 ከሆኑ የወሩን ኮሚሽን ይሰርዛል'}},
      {id:'jf_score', en:'Expected Documentation Quality Score', am:'የሚጠበቅ የሰነድ ጥራት ውጤት', t:'pct',
        tgt:{op:'gte', v:95, en:'≥95% earns 2,000 Birr; below 60% is –3,000 Birr',
             am:'≥95% 2,000 ብር፤ ከ60% በታች –3,000 ብር'}}
    ]},
    { en:'6 · Production drawings', am:'6 · የምርት ሥዕሎች', fields:[
      {id:'wp_sub', en:'Production drawings submitted', am:'የቀረቡ የምርት ሥዕሎች', t:'num'},
      {id:'wp_err', en:'Drawings with errors', am:'ስህተት ያለባቸው ሥዕሎች', t:'num',
        tgt:{op:'lte', v:0, en:'–500 Birr each, and –500 per production delay caused',
             am:'እያንዳንዱ –500 ብር፣ ለሚያስከትለው መዘግየትም –500 ብር'}},
      {id:'wp_late', en:'Drawings submitted late', am:'ዘግይተው የቀረቡ ሥዕሎች', t:'num',
        tgt:{op:'lte', v:0, en:'–300 Birr each', am:'እያንዳንዱ –300 ብር'}}
    ]},
    { en:'7 · Commission', am:'7 · ኮሚሽን', fields:[
      {id:'wc_earned', en:'Commission earned this week', am:'በዚህ ሳምንት የተገኘ ኮሚሽን', t:'money'},
      {id:'wc_missed', en:'Stages missed', am:'ያመለጡ ደረጃዎች', t:'num'},
      {id:'wc_lost', en:'Commission lost', am:'የጠፋ ኮሚሽን', t:'money'}
    ]},
    { en:'8 · Complaints', am:'8 · ቅሬታዎች', fields:[
      {id:'wcp_assigned', en:'Complaints assigned to me', am:'ለእኔ የተመደቡ ቅሬታዎች', t:'num'},
      {id:'wcp_24', en:'Contacted within 24 hours', am:'በ24 ሰዓት ውስጥ የተደወለላቸው', t:'ratio'},
      {id:'wcp_7', en:'Resolved within 7 days', am:'በ7 ቀን ውስጥ የተፈቱ', t:'ratio'},
      {id:'wcp_out', en:'Complaints outstanding', am:'ያልተፈቱ ቅሬታዎች', t:'num',
        tgt:{op:'lte', v:0, en:'Two past 7 days cancels the month’s commission',
             am:'ከ7 ቀን በላይ ሁለት ከሆኑ የወሩን ኮሚሽን ይሰርዛል'}},
      {id:'wcp_esc', en:'Complaints escalated', am:'ወደ ላይ የተላለፉ ቅሬታዎች', t:'num',
        tgt:{op:'lte', v:0, en:'–1,500 Birr to Ephrata, –3,000 Birr to the Chairman',
             am:'ወደ ኤፍራታ –1,500 ብር፣ ወደ ሊቀመንበር –3,000 ብር'}}
    ]},
    { en:'9 · WhatsApp compliance', am:'9 · የዋትስአፕ ተገዢነት', fields:[
      {id:'ws_rate', en:'Stage message compliance rate', am:'የደረጃ መልዕክት ተገዢነት መጠን', t:'pct',
        tgt:{op:'gte', v:100, en:'Every stage message must be posted', am:'እያንዳንዱ የደረጃ መልዕክት መላክ አለበት'}},
      {id:'ws_sum', en:'Design Discussion Summaries posted', am:'የተላኩ የውይይት ማጠቃለያዎች', t:'num'},
      {id:'ws_appr', en:'Written customer approvals received', am:'የተገኙ የጽሑፍ ማጽደቆች', t:'num'},
      {id:'ws_comp', en:'Design-related customer complaints', am:'ከዲዛይን ጋር የተያያዙ የደንበኛ ቅሬታዎች', t:'num',
        tgt:{op:'lte', v:0, en:'Zero earns the 2,000 Birr bonus', am:'0 ከሆነ የ2,000 ብር ጉርሻ ያስገኛል'}}
    ]},
    { en:"10 · Next week's plan", am:'10 · የሚቀጥለው ሳምንት ዕቅድ', fields:[
      {id:'n_meas', en:'Measurements scheduled', am:'የታቀዱ ልኬቶች', t:'num'},
      {id:'n_designs', en:'Designs to deliver', am:'መቅረብ ያለባቸው ዲዛይኖች', t:'num'},
      {id:'n_support', en:'Support needed from Ephrata', am:'ከኤፍራታ የሚያስፈልግ ድጋፍ', t:'area', opt:1}
    ]}
  ]
};

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
  ['yohannis', 'yonas', 'abrham-g', 'teklweld', 'abrham-w'].forEach(function (p) {
    REPORTS.push(copyFor(DESIGN_DAILY, p), copyFor(DESIGN_WEEKLY, p));
  });
})();
