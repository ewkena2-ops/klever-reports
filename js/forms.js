/* Klever report definitions.
   To change a form, edit the data here — nothing else needs touching.

   field keys:  id  en  am  t(type)  i(indent)  tgt(target check)  opt(not required)
   types:       num money pct text area ratio yesno choice
   target:      {op:'gte'|'lte', v:<number>, en:'', am:''}            */

const PEOPLE = [
  { id:'ephrata',  en:'Ephrata Assfa',   am:'ኤፍራታ አስፋ',   roleEn:'Commercial Lead',   roleAm:'የንግድ ኃላፊ' },
  { id:'liu',      en:'Mahelet Teshome', am:'ማህሌት ተሾመ',   roleEn:'Operations Lead',   roleAm:'የኦፕሬሽን ኃላፊ' },
  { id:'betty',    en:'Betelhem Aklog',  am:'ቤተልሔም አክሎግ', roleEn:'Finance Officer',   roleAm:'የፋይናንስ ኃላፊ' },
  { id:'getachew', en:'Getachew Negash', am:'ጌታቸው ነጋሽ',   roleEn:'Purchasing Officer', roleAm:'የግዥ ኃላፊ' },
  { id:'yordanos', en:'Yordanos Fikadu', am:'ዮርዳኖስ ፍቃዱ',  roleEn:'Storekeeper',       roleAm:'የመጋዘን ኃላፊ' }
];

const REPORTS = [

/* ============================ EPHRATA — DAILY ============================ */
{
  id:'ephrata-daily', person:'ephrata', cadence:'daily', dueTime:'17:30', skipDays:[5],
  en:'Daily Commercial Report', am:'ዕለታዊ የንግድ ሪፖርት',
  toEn:'Chairman', toAm:'ሊቀመንበር',
  dueEn:'5:30 PM, Monday to Thursday and Saturday', dueAm:'ከሰኞ እስከ ሐሙስ እና ቅዳሜ ከቀኑ 11፡30 (5:30 PM)',
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
  id:'betty-daily', person:'betty', cadence:'daily', dueTime:'17:30',
  en:'Daily Finance Report', am:'ዕለታዊ የፋይናንስ ሪፖርት',
  toEn:'Chairman + Kidan', toAm:'ሊቀመንበር + ኪዳን',
  dueEn:'5:30 PM every working day', dueAm:'በየሥራ ቀኑ ከቀኑ 11፡30 (5:30 PM)',
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
  id:'betty-weekly-cx', person:'betty', cadence:'weekly', dueTime:'17:00', dueDay:5,
  en:'Weekly Customer Experience Summary', am:'ሳምንታዊ የደንበኛ አገልግሎት ሪፖርት',
  toEn:'Chairman + Ephrata + Kidan', toAm:'ሊቀመንበር + ኤፍራታ + ኪዳን',
  dueEn:'Friday 5:00 PM', dueAm:'ዓርብ ከቀኑ 11፡00 (5:00 PM)',
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
  id:'ephrata-projection', person:'ephrata', cadence:'weekly', dueTime:'10:00', dueDay:1,
  en:'4-Week Rolling Sales Projection', am:'የ4 ሳምንት የሽያጭ ትንበያ',
  toEn:'Chairman + Kidan', toAm:'ሊቀመንበር + ኪዳን',
  dueEn:'Monday 10:00 AM', dueAm:'ሰኞ ከጠዋቱ 4፡00 (10:00 AM)',
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
}

];
