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
  id:'ephrata-daily', person:'ephrata', cadence:'daily', dueTime:'17:30',
  en:'Daily Commercial Report', am:'ዕለታዊ የንግድ ሪፖርት',
  toEn:'Chairman', toAm:'ሊቀመንበር',
  dueEn:'5:30 PM every working day', dueAm:'በየሥራ ቀኑ 11:30 ከሰዓት',
  penEn:'Late –500 Birr · Missing –1,000 Birr', penAm:'ዘግይቶ –500 ብር · ካልተላከ –1,000 ብር',
  sections:[
    { en:'1 · Leads today', am:'1 · የዛሬ አዲስ ጥያቄዎች', fields:[
      {id:'leads_total', en:'New leads received', am:'የደረሱ አዲስ ጥያቄዎች', t:'num'},
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
    { en:'4 · Quotations', am:'4 · የዋጋ ማቅረቢያ', fields:[
      {id:'quotes_issued', en:'Quotations issued today', am:'ዛሬ የተሰጡ ዋጋዎች', t:'num'},
      {id:'quotes_late', en:'Quotations pending over 48 hours', am:'ከ48 ሰዓት በላይ የዘገዩ ዋጋዎች', t:'num',
        tgt:{op:'lte', v:0, en:'Should be 0', am:'0 መሆን አለበት'}}
    ]},
    { en:'5 · Contracts', am:'5 · ውሎች', fields:[
      {id:'contracts', en:'Contracts signed today', am:'ዛሬ የተፈረሙ ውሎች', t:'num'},
      {id:'contract_value', en:'Total value', am:'ጠቅላላ ዋጋ', t:'money'},
      {id:'advance', en:'Advance collected today', am:'ዛሬ የተሰበሰበ ቅድመ ክፍያ', t:'money'},
      {id:'advance_banked', en:'Advance banked same day', am:'ቅድመ ክፍያ በዕለቱ ባንክ ገብቷል', t:'yesno'}
    ]},
    { en:'6 · Cash collection', am:'6 · የገንዘብ ስብሰባ', fields:[
      {id:'collected_today', en:'External collections today', am:'ዛሬ የተሰበሰበ የውጭ ገቢ', t:'money'},
      {id:'week_total', en:'Running weekly total', am:'የሳምንቱ ጠቅላላ እስካሁን', t:'money',
        tgt:{op:'gte', v:3000000, en:'Commission starts at 3,000,000 Birr/week', am:'ኮሚሽን የሚጀምረው በሳምንት ከ3,000,000 ብር ነው'}}
    ]},
    { en:'7 · WhatsApp compliance', am:'7 · የዋትስአፕ ተገዢነት', fields:[
      {id:'wa_groups', en:'Active customer groups', am:'ንቁ የደንበኛ ግሩፖች', t:'num'},
      {id:'wa_stage', en:'Required stage messages posted', am:'የተለጠፉ የደረጃ መልዕክቶች', t:'ratio'},
      {id:'wa_unanswered', en:'Messages unanswered over 2 hours', am:'ከ2 ሰዓት በላይ ምላሽ ያላገኙ', t:'num',
        tgt:{op:'lte', v:0, en:'–200 Birr each', am:'እያንዳንዱ –200 ብር'}},
      {id:'wa_complaints', en:'Customer complaints about WhatsApp', am:'በዋትስአፕ ላይ የደንበኛ ቅሬታ', t:'num',
        tgt:{op:'lte', v:0, en:'–1,000 Birr each', am:'እያንዳንዱ –1,000 ብር'}},
      {id:'wa_violations', en:'Team members with violations', am:'ጥሰት የፈጸሙ የቡድን አባላት', t:'num'}
    ]},
    { en:'8 · Marketing & social media', am:'8 · ማርኬቲንግ እና ሶሻል ሚዲያ', fields:[
      {id:'posts', en:'Posts made today', am:'ዛሬ የተለጠፉ ፖስቶች', t:'num'},
      {id:'platform', en:'Platform', am:'መድረክ', t:'text', opt:1},
      {id:'inq', en:'Inquiries received', am:'የደረሱ ጥያቄዎች', t:'num'},
      {id:'inq_1hr', en:'Inquiries answered within 1 hour', am:'በ1 ሰዓት ውስጥ ምላሽ ያገኙ', t:'ratio'},
      {id:'mkt_leads', en:'Leads generated from marketing today', am:'ከማርኬቲንግ የተገኙ አዲስ ጥያቄዎች', t:'num'}
    ]},
    { en:'9 · Problems and solutions', am:'9 · ችግሮችና መፍትሔዎች', fields:[
      {id:'problem', en:'Problem', am:'ችግር', t:'area', opt:1},
      {id:'cause', en:'Root cause', am:'መሠረታዊ ምክንያት', t:'area', opt:1},
      {id:'action', en:'Action taken', am:'የተወሰደ እርምጃ', t:'area', opt:1},
      {id:'need_chair', en:'Need Chairman decision', am:'የሊቀመንበር ውሳኔ ያስፈልጋል', t:'yesno'}
    ]},
    { en:"10 · Tomorrow's top 3 priorities", am:'10 · የነገ ሦስት ቅድሚያዎች', fields:[
      {id:'p1', en:'Priority 1', am:'ቅድሚያ 1', t:'text'},
      {id:'p2', en:'Priority 2', am:'ቅድሚያ 2', t:'text'},
      {id:'p3', en:'Priority 3', am:'ቅድሚያ 3', t:'text'}
    ]}
  ]
},

/* ============================ MAHELET — DAILY ============================ */
{
  id:'liu-daily', person:'liu', cadence:'daily', dueTime:'17:30',
  en:'Daily Operations Report', am:'ዕለታዊ የኦፕሬሽን ሪፖርት',
  toEn:'Chairman', toAm:'ሊቀመንበር',
  dueEn:'5:30 PM every working day', dueAm:'በየሥራ ቀኑ 11:30 ከሰዓት',
  penEn:'Late –200 Birr · Missing –500 Birr', penAm:'ዘግይቶ –200 ብር · ካልተላከ –500 ብር',
  sections:[
    { en:'1 · Production', am:'1 · ምርት', fields:[
      {id:'m2', en:'m² produced today', am:'ዛሬ የተመረተ ካሬ ሜትር', t:'num',
        tgt:{op:'gte', v:40, en:'Daily target 40 m²', am:'የቀን ዒላማ 40 ካሬ ሜትር'}},
      {id:'waste', en:'Waste %', am:'የብክነት መጠን %', t:'pct',
        tgt:{op:'lte', v:20, en:'Must not exceed 20%', am:'ከ20% መብለጥ የለበትም'}},
      {id:'machines', en:'Machines running', am:'በሥራ ላይ ያሉ ማሽኖች', t:'ratio'},
      {id:'downtime', en:'Machine downtime (hours)', am:'ማሽን የቆመበት ሰዓት', t:'num'},
      {id:'workers', en:'Workers present', am:'የተገኙ ሠራተኞች', t:'ratio'}
    ]},
    { en:'2 · Quality control', am:'2 · የጥራት ቁጥጥር', fields:[
      {id:'qc_pass', en:'Jobs passed QC today', am:'ዛሬ QC ያለፉ ሥራዎች', t:'num'},
      {id:'qc_fail', en:'Jobs failed QC', am:'QC ያልደረሱ ሥራዎች', t:'num'},
      {id:'defects', en:'Defects found', am:'የተገኙ ጉድለቶች', t:'num'},
      {id:'qc_action', en:'Action taken', am:'የተወሰደ እርምጃ', t:'area', opt:1}
    ]},
    { en:'3 · Store & inventory', am:'3 · መጋዘንና ክምችት', fields:[
      {id:'mat_in', en:'Materials received today', am:'ዛሬ የገቡ ዕቃዎች', t:'num'},
      {id:'mat_out', en:'Materials issued today', am:'ዛሬ የወጡ ዕቃዎች', t:'num'},
      {id:'shortage', en:'Stock shortages', am:'የክምችት እጥረት', t:'yesno'},
      {id:'shortage_what', en:'If yes, what', am:'አዎ ከሆነ ምን', t:'text', opt:1}
    ]},
    { en:'4 · Purchasing', am:'4 · ግዥ', fields:[
      {id:'pr_sub', en:'Purchase requests submitted', am:'የቀረቡ የግዥ ጥያቄዎች', t:'num'},
      {id:'pr_app', en:'Purchase requests approved', am:'የጸደቁ የግዥ ጥያቄዎች', t:'num'},
      {id:'orders', en:'Orders placed', am:'የተሰጡ ትዕዛዞች', t:'num'},
      {id:'deliv_pending', en:'Deliveries pending', am:'በመጠባበቅ ላይ ያሉ ርክክቦች', t:'num'}
    ]},
    { en:'5 · Delivery & installation', am:'5 · ማድረስና ተከላ', fields:[
      {id:'delivered', en:'Jobs delivered today', am:'ዛሬ የደረሱ ሥራዎች', t:'num'},
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
    { en:"9 · Tomorrow's top 3 priorities", am:'9 · የነገ ሦስት ቅድሚያዎች', fields:[
      {id:'p1', en:'Priority 1', am:'ቅድሚያ 1', t:'text'},
      {id:'p2', en:'Priority 2', am:'ቅድሚያ 2', t:'text'},
      {id:'p3', en:'Priority 3', am:'ቅድሚያ 3', t:'text'}
    ]}
  ]
},

/* ============================= BETTY — DAILY ============================= */
{
  id:'betty-daily', person:'betty', cadence:'daily', dueTime:'17:30',
  en:'Daily Finance Report', am:'ዕለታዊ የፋይናንስ ሪፖርት',
  toEn:'Chairman + Kidan', toAm:'ሊቀመንበር + ኪዳን',
  dueEn:'5:30 PM every working day', dueAm:'በየሥራ ቀኑ 11:30 ከሰዓት',
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
  dueEn:'5:30 PM every working day', dueAm:'በየሥራ ቀኑ 11:30 ከሰዓት',
  penEn:'Late –200 Birr · Missing –500 Birr', penAm:'ዘግይቶ –200 ብር · ካልተላከ –500 ብር',
  derived:1,
  sections:[
    { en:'1 · Purchase requests', am:'1 · የግዥ ጥያቄዎች', fields:[
      {id:'pr_prep', en:'Purchase requests prepared', am:'የተዘጋጁ የግዥ ጥያቄዎች', t:'num'},
      {id:'pr_sub', en:'Submitted to Betty', am:'ለቤቲ የቀረቡ', t:'num'},
      {id:'pr_app', en:'Approved by Betty', am:'በቤቲ የጸደቁ', t:'num'},
      {id:'pr_ret', en:'Returned or rejected', am:'የተመለሱ ወይም ያልጸደቁ', t:'num'},
      {id:'pr_quotes', en:'Requests with 3 or more quotes', am:'3 እና ከዚያ በላይ ዋጋ ያላቸው ጥያቄዎች', t:'ratio'}
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
  dueEn:'5:30 PM every working day', dueAm:'በየሥራ ቀኑ 11:30 ከሰዓት',
  penEn:'Reports are mandatory daily', penAm:'ሪፖርት በየቀኑ ግዴታ ነው',
  derived:1,
  sections:[
    { en:'1 · Receiving', am:'1 · ዕቃ መረከብ', fields:[
      {id:'rec_deliv', en:'Deliveries received today', am:'ዛሬ የደረሱ ርክክቦች', t:'num'},
      {id:'rec_checked', en:'Checked against Job File / BOM', am:'ከጆብ ፋይል / BOM ጋር የተመሳከሩ', t:'ratio'},
      {id:'rec_accepted', en:'Accepted into store', am:'ወደ መጋዘን የገቡ', t:'num'},
      {id:'rec_rejected', en:'Rejected', am:'ያልተቀበልኳቸው', t:'num'},
      {id:'rec_grn', en:'Goods received notes signed', am:'የተፈረሙ የዕቃ መረከቢያ ወረቀቶች', t:'num'}
    ]},
    { en:'2 · Rejections', am:'2 · ያልተቀበልኳቸው', fields:[
      {id:'rej_reason', en:'Reason for rejection', am:'ያልተቀበልኩበት ምክንያት', t:'area', opt:1},
      {id:'rej_photo', en:'Documented with photos', am:'በፎቶ ተመዝግቧል', t:'yesno', opt:1},
      {id:'rej_reported', en:'Reported to Getachew and Betty', am:'ለጌታቸውና ለቤቲ ተነግሯል', t:'yesno', opt:1}
    ]},
    { en:'3 · Stock record', am:'3 · የክምችት መዝገብ', fields:[
      {id:'st_open', en:'Opening stock items', am:'የመክፈቻ ክምችት', t:'num'},
      {id:'st_in', en:'Materials received', am:'የገቡ ዕቃዎች', t:'num'},
      {id:'st_out', en:'Materials issued', am:'የወጡ ዕቃዎች', t:'num'},
      {id:'st_close', en:'Closing stock items', am:'የመዝጊያ ክምችት', t:'num'},
      {id:'st_disc', en:'Discrepancies found', am:'የተገኙ ልዩነቶች', t:'num',
        tgt:{op:'lte', v:0, en:'–500 Birr each · report same day', am:'እያንዳንዱ –500 ብር · በዕለቱ ማሳወቅ'}}
    ]},
    { en:'4 · Issuing materials', am:'4 · ዕቃ ማውጣት', fields:[
      {id:'iss_count', en:'Issues made today', am:'ዛሬ የተደረጉ ማውጣቶች', t:'num'},
      {id:'iss_approved', en:"All issued with Mahelet's signed approval", am:'ሁሉም በማህሌት ፊርማ ፈቃድ ወጥተዋል', t:'yesno'},
      {id:'iss_correct', en:'All issued to the correct job', am:'ሁሉም ለትክክለኛው ሥራ ወጥተዋል', t:'yesno'}
    ]},
    { en:'5 · Shortages', am:'5 · እጥረቶች', fields:[
      {id:'sh_flagged', en:'Shortages flagged today', am:'ዛሬ የተጠቆሙ እጥረቶች', t:'num'},
      {id:'sh_stopped', en:'Production stopped due to shortage', am:'በእጥረት ምክንያት ምርት ቆሟል', t:'yesno'},
      {id:'sh_what', en:'Which materials', am:'የትኞቹ ዕቃዎች', t:'text', opt:1}
    ]},
    { en:'6 · Factory consumables', am:'6 · የፋብሪካ ወጪ ዕቃዎች', fields:[
      {id:'con_today', en:'Consumables issued today', am:'ዛሬ የወጡ ወጪ ዕቃዎች', t:'num'},
      {id:'con_mtd', en:'Month-to-date consumable spend', am:'የወሩ ወጪ እስካሁን', t:'money',
        tgt:{op:'lte', v:30000, en:'Budget 30,000 Birr/month', am:'የወር በጀት 30,000 ብር'}}
    ]},
    { en:'7 · Store condition', am:'7 · የመጋዘን ሁኔታ', fields:[
      {id:'sec_locked', en:'Store secure at close', am:'መጋዘኑ በመዝጊያ ሰዓት ተቆልፏል', t:'yesno'},
      {id:'sec_theft', en:'Theft or unauthorized removal', am:'ስርቆት ወይም ያልተፈቀደ ማውጣት', t:'yesno'},
      {id:'sec_sep', en:'Job materials separated from consumables', am:'የሥራ ዕቃና ወጪ ዕቃ ተለያይተዋል', t:'yesno'}
    ]},
    { en:'8 · Problems and solutions', am:'8 · ችግሮችና መፍትሔዎች', fields:[
      {id:'problem', en:'Problem', am:'ችግር', t:'area', opt:1},
      {id:'action', en:'Action taken', am:'የተወሰደ እርምጃ', t:'area', opt:1},
      {id:'need_chair', en:'Need Chairman decision', am:'የሊቀመንበር ውሳኔ ያስፈልጋል', t:'yesno'}
    ]}
  ]
}

];
