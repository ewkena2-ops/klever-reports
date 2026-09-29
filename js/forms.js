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
      {id:'leads_total', en:'How many new leads came in today?', am:'ዛሬ ስንት አዲስ ደንበኞች መጡ?', t:'num',
        parts:{of:['leads_social','leads_showroom','leads_referral','leads_agent','leads_other'], all:1}},
      {id:'leads_social', en:'From social media', am:'ከሶሻል ሚዲያ', t:'num', i:1},
      {id:'leads_showroom', en:'Walked into the showroom', am:'ሾውሩም የመጡ', t:'num', i:1},
      {id:'leads_referral', en:'Referred by someone', am:'በሪፈራል', t:'num', i:1},
      {id:'leads_agent', en:'Through an agent', am:'በኤጀንት', t:'num', i:1},
      {id:'leads_other', en:'Anywhere else', am:'ከሌላ ቦታ', t:'num', i:1},
      {id:'leads_best', en:'Which of today\'s leads is the most serious, and what is the next step with them?', am:'ከዛሬዎቹ ደንበኞች ውስጥ በጣም ተስፋ ያለው ማን ነው? ቀጣዩ እርምጃስ ምንድን ነው?', t:'area', show:{f:'leads_total', when:'pos'}}
    ]},
    { en:'2 · Lead response compliance', am:'2 · የምላሽ ፍጥነት', fields:[
      {id:'resp_1hr', en:'New leads today: how many did you call within 1 hour? (called within 1 hour / all new leads today)', am:'ዛሬ አዲስ የመጡ ደንበኞች፦ ስንቱን በ1 ሰዓት ውስጥ ደወሉላቸው? (በ1 ሰዓት ውስጥ የተደወለላቸው / ዛሬ የመጡ አዲስ ደንበኞች በሙሉ)', t:'ratio', whole:'leads_total'},
      {id:'resp_1hr_why', en:'Which leads were not called within the hour, why, and have they been called now?', am:'በ1 ሰዓት ውስጥ ያልተደወለላቸው እነማን ናቸው? ለምን? አሁን ተደውሎላቸዋል?', t:'area', show:{f:'resp_1hr', when:'short'}},
      {id:'resp_showroom', en:'How many showroom visitors were served the same day? (served / all visitors)', am:'ሾውሩም ከመጡት ስንቱ በዕለቱ ተስተናገዱ? (የተስተናገዱ / ሁሉም)', t:'ratio'},
      {id:'resp_showroom_why', en:'Who was not served the same day, and why?', am:'በዕለቱ ያልተስተናገደው ማን ነው? ለምን?', t:'area', show:{f:'resp_showroom', when:'short'}}
    ]},
    { en:'3 · Pre-measurement', am:'3 · ቅድመ ልኬት', fields:[
      {id:'visits_booked', en:'How many pre-measurement appointments did you make today?', am:'ዛሬ ስንት የቅድመ ልኬት ቀጠሮ ያዙ?', t:'num'},
      {id:'visits_done', en:'How many pre-measurement visits were done today?', am:'ዛሬ ስንት የቅድመ ልኬት ጉብኝት ተካሄደ?', t:'num'},
      {id:'visits_list', en:'List each pre-measurement visit done today', am:'ዛሬ የተደረጉትን የቅድመ ልኬት ጉብኝቶች አንድ በአንድ ይዘርዝሩ', t:'table', addEn:'Add a visit', addAm:'ጉብኝት ጨምር',
        show:{f:'visits_done', when:'pos'},
        cols:[
          {id:'cust', en:'Customer', am:'ደንበኛ', t:'text'},
          {id:'where', en:'Area', am:'አካባቢ', t:'text'},
          {id:'who', en:'Visited by', am:'የጎበኘው', t:'text'},
          {id:'next', en:'Next step', am:'ቀጣይ እርምጃ', t:'text'}
        ]},
      {id:'visits_late', en:'How many new leads have waited more than 48 hours for a pre-measurement appointment?', am:'ከ48 ሰዓት በላይ የቅድመ ልኬት ቀጠሮ ሳይያዝላቸው የቆዩ አዲስ ደንበኞች ስንት ናቸው?', t:'num',
        tgt:{op:'lte', v:0, en:'Should be 0', am:'0 መሆን አለበት'}},
      {id:'visits_late_why', en:'Which customers are waiting, why, and on what day will each be visited?', am:'የሚጠብቁት ደንበኞች እነማን ናቸው? ለምን ዘገየ? እያንዳንዳቸው በየትኛው ቀን ይጎበኛሉ?', t:'area', show:{f:'visits_late', when:'pos'}}
    ]},
    { en:'4 · Quotations', am:'4 · ፕሮፎርማ', fields:[
      {id:'quotes_issued', en:'How many quotations went out today?', am:'ዛሬ ስንት ፕሮፎርማ ተሰጠ?', t:'num'},
      {id:'quotes_list', en:'List each quotation sent today', am:'ዛሬ የተሰጡትን ፕሮፎርማዎች ይዘርዝሩ', t:'table', addEn:'Add a quotation', addAm:'ፕሮፎርማ ጨምር',
        show:{f:'quotes_issued', when:'pos'},
        cols:[
          {id:'cust', en:'Customer', am:'ደንበኛ', t:'text'},
          {id:'value', en:'Value', am:'ዋጋ', t:'money'},
          {id:'who', en:'Prepared by', am:'ያዘጋጀው', t:'text'}
        ]},
      {id:'quotes_late', en:'How many quotations are waiting more than 48 hours?', am:'ከ48 ሰዓት በላይ የዘገዩ ፕሮፎርማዎች ስንት ናቸው?', t:'num',
        tgt:{op:'lte', v:0, en:'Should be 0', am:'0 መሆን አለበት'}},
      {id:'quotes_late_why', en:'Which customers, what is holding each one up, and when will it go out?', am:'የየትኞቹ ደንበኞች ናቸው? እያንዳንዱን ምን ያዘው? መቼ ይላካል?', t:'area', show:{f:'quotes_late', when:'pos'}}
    ]},
    { en:'5 · Contracts', am:'5 · ውሎች', fields:[
      {id:'contracts', en:'How many contracts were signed today?', am:'ዛሬ ስንት ውል ተፈረመ?', t:'num'},
      {id:'contracts_list', en:'List each contract signed today', am:'ዛሬ የተፈረሙትን ውሎች ይዘርዝሩ', t:'table', addEn:'Add a contract', addAm:'ውል ጨምር',
        show:{f:'contracts', when:'pos'},
        cols:[
          {id:'cust', en:'Customer', am:'ደንበኛ', t:'text'},
          {id:'code', en:'Job code', am:'የሥራ ኮድ', t:'text'},
          {id:'value', en:'Contract value', am:'የውል ዋጋ', t:'money'},
          {id:'adv', en:'Advance paid', am:'የተከፈለ ቅድመ ክፍያ', t:'money'},
          {id:'sp', en:'Salesperson', am:'ሻጭ', t:'text'}
        ]},
      {id:'contract_value', en:'What is the total value of today\'s contracts?', am:'የዛሬዎቹ ውሎች ጠቅላላ ዋጋ ስንት ነው?', t:'money'},
      {id:'advance', en:'How much advance was collected today?', am:'ዛሬ ስንት ቅድመ ክፍያ ተሰበሰበ?', t:'money'},
      {id:'advance_banked', en:'Was all of it banked today?', am:'ሁሉም ዛሬ ባንክ ገብቷል?', t:'yesno'},
      {id:'advance_banked_why', en:'Why not, where is the money now, and when will it be banked?', am:'ለምን አልገባም? ገንዘቡ አሁን የት ነው? መቼ ባንክ ይገባል?', t:'area', show:{f:'advance_banked', when:'no'}}
    ]},
    { en:'6 · Cash collection', am:'6 · የገንዘብ ስብሰባ', fields:[
      {id:'collected_today', en:'How much was collected from customers today?', am:'ዛሬ ከደንበኞች ስንት ብር ተሰበሰበ?', t:'money'},
      {id:'collected_list', en:'From whom?', am:'ከማን ከማን?', t:'table', addEn:'Add a payment', addAm:'ክፍያ ጨምር',
        show:{f:'collected_today', when:'pos'},
        cols:[
          {id:'cust', en:'Customer', am:'ደንበኛ', t:'text'},
          {id:'amount', en:'Amount', am:'መጠን', t:'money'},
          {id:'kind', en:'For', am:'የምን', t:'choice', opts:[
            {v:'advance', en:'Advance', am:'ቅድመ ክፍያ'},
            {v:'final', en:'Final payment', am:'የመጨረሻ ክፍያ'},
            {v:'other', en:'Other', am:'ሌላ'}]}
        ]},
      {id:'week_total', en:'How much has come in this week so far?', am:'በዚህ ሳምንት እስካሁን ስንት ብር ገባ?', t:'money',
        tgt:{op:'gte', v:3000000, en:'Commission starts at 3,000,000 Birr/week', am:'ኮሚሽን የሚጀምረው በሳምንት ከ3,000,000 ብር ነው'}},
      {id:'week_gap', en:'The week is below 3,000,000 Birr. Which customers will close the gap by Friday, and for how much?', am:'ሳምንቱ ከ3,000,000 ብር በታች ነው። እስከ ዓርብ ክፍተቱን የሚሞሉት የትኞቹ ደንበኞች ናቸው? በስንት ብር?', t:'area', show:{f:'week_total', when:'miss'}},
      {id:'expected_list', en:'Expected collections: which clients will pay, what for, how much and when?', am:'የሚጠበቁ ክፍያዎች፦ የትኞቹ ደንበኞች፣ ለምን፣ ስንት እና መቼ ይከፍላሉ?', t:'table',
        addEn:'Add an expected payment', addAm:'የሚጠበቅ ክፍያ ጨምር',
        total:'amount', totalEn:'Total expected', totalAm:'ጠቅላላ የሚጠበቅ',
        cols:[
          {id:'cust', en:'Client', am:'ደንበኛ', t:'text'},
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
    { en:'7 · WhatsApp compliance', am:'7 · የዋትስአፕ ተገዢነት', fields:[
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
    { en:'8 · Marketing & social media', am:'8 · ማርኬቲንግ እና ሶሻል ሚዲያ', fields:[
      {id:'posts', en:'How many posts went up today?', am:'ዛሬ ስንት ፖስት ተለጠፈ?', t:'num'},
      {id:'platform', en:'On which pages?', am:'በየትኛው ገጽ? (FB / IG / TikTok)', t:'text', opt:1},
      {id:'inq', en:'How many inquiries came in?', am:'ስንት ጥያቄዎች ደረሱ?', t:'num'},
      {id:'inq_1hr', en:'How many were answered within 1 hour? (answered / all inquiries)', am:'ስንቱ በ1 ሰዓት ውስጥ ምላሽ አገኙ? (ምላሽ ያገኙ / ሁሉም)', t:'ratio', whole:'inq'},
      {id:'mkt_leads', en:'How many real leads came from marketing today?', am:'ዛሬ ከማርኬቲንግ ስንት እውነተኛ ደንበኞች መጡ?', t:'num'},
      {id:'mkt_best', en:'Which post or channel brought the most, and why do you think it worked?', am:'በጣም ውጤታማ የነበረው የትኛው ፖስት ወይም ገጽ ነው? ለምን የሠራ ይመስልዎታል?', t:'area', opt:1}
    ]},
    { en:'9 · Problems and solutions', am:'9 · ችግሮችና መፍትሔዎች', fields:[
      {id:'problem', en:'What was the biggest problem today?', am:'የዛሬው ትልቁ ችግር ምን ነበር?', t:'area', opt:1},
      {id:'cause', en:'What caused it?', am:'መንስኤው ምንድን ነው?', t:'area', opt:1},
      {id:'action', en:'What was done about it, by whom, and by when will it be fixed?', am:'ምን እርምጃ ተወሰደ? በማን? እስከ መቼ ይስተካከላል?', t:'area', opt:1},
      {id:'need_help', en:'What do you need from another department, and from whom?', am:'ከሌላ ክፍል ምን ያስፈልግዎታል? ከማን?', t:'area', opt:1},
      {id:'need_chair', en:'Do you need a decision from the Chairman?', am:'የሊቀመንበሩ ውሳኔ ያስፈልግዎታል?', t:'yesno'},
      {id:'need_chair_what', en:'What exactly should he decide, what are the options, and by when?', am:'በትክክል ምን እንዲወስኑ ይፈልጋሉ? አማራጮቹ ምንድን ናቸው? እስከ መቼ?', t:'area', show:{f:'need_chair', when:'yes'}}
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
      {id:'m2', en:'How many m² did the factory produce today?', am:'ፋብሪካው ዛሬ ስንት ካሬ ሜትር አመረተ?', t:'num',
        tgt:{op:'gte', v:40, en:'Daily target 40 m²', am:'የቀን ዒላማ 40 ካሬ ሜትር'}},
      {id:'m2_why', en:'Production is under 40 m². What held it back, and how will it be recovered (who, by when)?', am:'ምርቱ ከ40 ካሬ ሜትር በታች ነው። ምን አዘገየው? በምን ይካካሳል? በማን፣ እስከ መቼ?', t:'area', show:{f:'m2', when:'miss'}},
      {id:'waste', en:'What was today\'s waste, as a % of material used?', am:'የዛሬው ብክነት ከዋለው ዕቃ ስንት % ነው?', t:'pct',
        tgt:{op:'lte', v:20, en:'Must not exceed 20%', am:'ከ20% መብለጥ የለበትም'}},
      {id:'waste_why', en:'Waste is over 20%. On which job or machine, why, and what was done?', am:'ብክነቱ ከ20% በላይ ነው። በየትኛው ሥራ ወይም ማሽን? ለምን? ምን እርምጃ ተወሰደ?', t:'area', show:{f:'waste', when:'miss'}},
      {id:'machines', en:'How many machines ran today? (running / all machines)', am:'ዛሬ ስንት ማሽኖች ሠሩ? (የሠሩ / ሁሉም ማሽኖች)', t:'ratio'},
      {id:'machines_why', en:'Which machines did not run, why, and when will each be back?', am:'ያልሠሩት የትኞቹ ማሽኖች ናቸው? ለምን? እያንዳንዳቸው መቼ ይመለሳሉ?', t:'area', show:{f:'machines', when:'short'}},
      {id:'downtime', en:'How many hours of machine downtime were there today?', am:'ዛሬ ማሽኖች በድምሩ ስንት ሰዓት ቆሙ?', t:'num'},
      {id:'downtime_list', en:'Which machines stopped, and why?', am:'የቆሙት የትኞቹ ማሽኖች ናቸው? ለምን?', t:'table', addEn:'Add a machine', addAm:'ማሽን ጨምር',
        show:{f:'downtime', when:'pos'},
        cols:[
          {id:'machine', en:'Machine', am:'ማሽን', t:'text'},
          {id:'hours', en:'Hours stopped', am:'የቆመበት ሰዓት', t:'num'},
          {id:'cause', en:'Cause', am:'ምክንያት', t:'text'},
          {id:'told', en:'Chairman told at once', am:'ለሊቀመንበሩ ወዲያው ተነግሯል', t:'yesno'},
          {id:'back', en:'Back in service', am:'ወደ ሥራ የሚመለስበት', t:'text'}
        ]},
      {id:'workers', en:'How many workers came to work today? (present / assigned)', am:'ዛሬ ስንት ሠራተኞች ተገኙ? (የተገኙ / የተመደቡ)', t:'ratio'},
      {id:'workers_why', en:'Who was absent, and was it with permission?', am:'የቀሩት እነማን ናቸው? በፈቃድ ነው?', t:'area', show:{f:'workers', when:'short'}}
    ]},
    { en:'2 · Quality control', am:'2 · የጥራት ቁጥጥር', fields:[
      {id:'qc_pass', en:'How many jobs passed QC today?', am:'ዛሬ ስንት ሥራዎች QC አለፉ?', t:'num'},
      {id:'qc_fail', en:'How many jobs failed QC today?', am:'ዛሬ ስንት ሥራዎች QC አላለፉም?', t:'num'},
      {id:'qc_fail_list', en:'Which jobs failed, and why?', am:'ያላለፉት የትኞቹ ሥራዎች ናቸው? ለምን?', t:'table', addEn:'Add a job', addAm:'ሥራ ጨምር',
        show:{f:'qc_fail', when:'pos'},
        cols:[
          {id:'code', en:'Job code', am:'የሥራ ኮድ', t:'text'},
          {id:'why', en:'Why it failed', am:'ያላለፈበት ምክንያት', t:'text'},
          {id:'fix', en:'Fixed by (date)', am:'የሚስተካከልበት ቀን', t:'text'}
        ]},
      {id:'defects', en:'How many defects were found today?', am:'ዛሬ ስንት ጉድለቶች ተገኙ?', t:'num'},
      {id:'defects_what', en:'What were they, on which jobs, and at which stage did they start (cutting, assembly, edging, material)?', am:'ጉድለቶቹ ምን ነበሩ? በየትኞቹ ሥራዎች? ከየትኛው ደረጃ ጀመሩ (ቁረጣ፣ መገጣጠም፣ ጠርዝ፣ ዕቃ)?', t:'area', show:{f:'defects', when:'pos'}},
      {id:'qc_action', en:'What was done about today\'s failures and defects?', am:'በዛሬዎቹ ውድቀቶችና ጉድለቶች ላይ ምን እርምጃ ተወሰደ?', t:'area', opt:1}
    ]},
    { en:'3 · Store & inventory', am:'3 · መጋዘንና ክምችት', fields:[
      {id:'mat_in', en:'How many material items were received into the store today?', am:'ዛሬ ወደ መጋዘን ስንት ዕቃዎች ገቡ?', t:'num'},
      {id:'mat_out', en:'How many material items were issued from the store today?', am:'ዛሬ ከመጋዘን ስንት ዕቃዎች ወጡ?', t:'num'},
      {id:'mat_out_signed', en:'Did every issue carry your signed approval?', am:'እያንዳንዱ የወጣ ዕቃ በእርስዎ የተፈረመ ፈቃድ ነበረው?', t:'yesno', show:{f:'mat_out', when:'pos'}},
      {id:'mat_out_unsigned', en:'What went out without approval, to whom, and why?', am:'ያለ ፈቃድ የወጣው ምንድን ነው? ለማን? ለምን?', t:'area', show:{f:'mat_out_signed', when:'no'}},
      {id:'shortage', en:'Is any material short in the store today?', am:'ዛሬ በመጋዘን ያጠረ ዕቃ አለ?', t:'yesno'},
      {id:'shortage_what', en:'If yes, which material?', am:'አዎ ከሆነ የትኛው ዕቃ?', t:'text', opt:1},
      {id:'shortage_hit', en:'Which jobs does the shortage hold up, and when will the material arrive?', am:'እጥረቱ የትኞቹን ሥራዎች ያቆማል? ዕቃው መቼ ይደርሳል?', t:'area', show:{f:'shortage', when:'yes'}}
    ]},
    { en:'4 · Purchasing', am:'4 · ግዥ', fields:[
      {id:'pr_sub', en:'How many purchase requests were submitted today?', am:'ዛሬ ስንት የግዥ ጥያቄዎች ቀረቡ?', t:'num'},
      {id:'pr_app', en:'How many purchase requests were approved today?', am:'ዛሬ ስንት የግዥ ጥያቄዎች ጸደቁ?', t:'num'},
      {id:'orders', en:'How many orders were placed with suppliers today?', am:'ዛሬ ለአቅራቢዎች ስንት ትዕዛዞች ተሰጡ?', t:'num'},
      {id:'orders_docs', en:'Did the documents for every purchase reach Selam within 24 hours?', am:'የእያንዳንዱ ግዥ ሰነድ በ24 ሰዓት ውስጥ ለሰላም ደርሷል?', t:'yesno', show:{f:'orders', when:'pos'}},
      {id:'orders_docs_why', en:'Which purchases are missing documents, and why?', am:'ሰነድ የጎደላቸው የትኞቹ ግዥዎች ናቸው? ለምን?', t:'area', show:{f:'orders_docs', when:'no'}},
      {id:'deliv_pending', en:'How many supplier deliveries are still outstanding?', am:'ስንት የአቅራቢ ርክክቦች ገና አልደረሱም?', t:'num'},
      {id:'deliv_pending_list', en:'Which ones are outstanding?', am:'ያልደረሱት የትኞቹ ናቸው?', t:'table', addEn:'Add a delivery', addAm:'ርክክብ ጨምር',
        show:{f:'deliv_pending', when:'pos'},
        cols:[
          {id:'mat', en:'Material', am:'ዕቃ', t:'text'},
          {id:'sup', en:'Supplier', am:'አቅራቢ', t:'text'},
          {id:'code', en:'For job', am:'ለየትኛው ሥራ', t:'text'},
          {id:'due', en:'Expected', am:'የሚጠበቅበት ቀን', t:'text'}
        ]}
    ]},
    { en:'5 · Delivery & installation', am:'5 · ማድረስና ተከላ', fields:[
      {id:'delivered', en:'How many jobs were delivered to customers today?', am:'ዛሬ ስንት ሥራዎች ለደንበኞች ደረሱ?', t:'num'},
      {id:'delivered_list', en:'Which jobs left the factory today?', am:'ዛሬ ከፋብሪካ የወጡት የትኞቹ ሥራዎች ናቸው?', t:'table', addEn:'Add a job', addAm:'ሥራ ጨምር',
        show:{f:'delivered', when:'pos'},
        cols:[
          {id:'code', en:'Job code', am:'የሥራ ኮድ', t:'text'},
          {id:'cust', en:'Customer', am:'ደንበኛ', t:'text'},
          {id:'fin', en:'Selam cleared', am:'ሰላም አጽድቃለች', t:'yesno'}
        ]},
      {id:'installed', en:'How many jobs were installed today?', am:'ዛሬ ስንት ሥራዎች ተተከሉ?', t:'num'},
      {id:'site_ready', en:'Was every site confirmed ready before the installers went?', am:'ገጣጣሚዎች ከመሄዳቸው በፊት እያንዳንዱ ቦታ ዝግጁ መሆኑ ተረጋግጦ ነበር?', t:'yesno', show:{f:'installed', when:'pos'}},
      {id:'site_ready_why', en:'Which site was not confirmed, and what happened there?', am:'ያልተረጋገጠው የትኛው ቦታ ነው? እዚያ ምን ሆነ?', t:'area', show:{f:'site_ready', when:'no'}},
      {id:'ontime', en:'How many of today\'s deliveries and installations were on time? (on time / all)', am:'ከዛሬዎቹ ርክክቦችና ተከላዎች ስንቱ በሰዓቱ ነበሩ? (በሰዓቱ / ሁሉም)', t:'ratio'},
      {id:'ontime_why', en:'Which jobs were late, by how long, and why?', am:'የዘገዩት የትኞቹ ሥራዎች ናቸው? በምን ያህል? ለምን?', t:'area', show:{f:'ontime', when:'short'}},
      {id:'accept_signed', en:'How many customers signed their acceptance today?', am:'ዛሬ ስንት ደንበኞች የተቀባይነት ቅጽ ፈረሙ?', t:'num'},
      {id:'complaints', en:'How many complaints about operations came in today?', am:'ዛሬ ስለ ኦፕሬሽን ስንት ቅሬታዎች ደረሱ?', t:'num',
        tgt:{op:'lte', v:0, en:'KPI bonus needs zero', am:'ለKPI ቦነስ ዜሮ መሆን አለበት'}},
      {id:'complaints_what', en:'Which customer, what was the complaint, which department caused it, and what was done?', am:'የትኛው ደንበኛ? ቅሬታው ምንድን ነው? ያስከተለው የትኛው ክፍል ነው? ምን እርምጃ ተወሰደ?', t:'area', show:{f:'complaints', when:'pos'}}
    ]},
    { en:'6 · Job File handoff', am:'6 · የጆብ ፋይል ርክክብ', fields:[
      {id:'jf_recv', en:'How many Job Files did you receive from Ephrata today?', am:'ዛሬ ከኤፍራታ ስንት ጆብ ፋይሎች ደረሱዎት?', t:'num'},
      {id:'jf_acc', en:'How many did you accept and sign for in the handover log?', am:'ስንቱን ተቀብለው በርክክብ መዝገቡ ፈረሙ?', t:'num'},
      {id:'jf_rej', en:'How many did you return to Ephrata as incomplete?', am:'ስንቱን ያልተሟሉ ስለሆኑ ለኤፍራታ መለሱ?', t:'num'},
      {id:'jf_reason', en:'Which files were returned, and what was missing from each?', am:'የተመለሱት የትኞቹ ፋይሎች ናቸው? በእያንዳንዱ ምን ጎደለ?', t:'area', opt:1}
    ]},
    { en:'7 · WhatsApp compliance', am:'7 · የዋትስአፕ ተገዢነት', fields:[
      {id:'wa_req', en:'How many operations messages were due in customer groups today?', am:'ዛሬ በደንበኛ ግሩፖች ስንት የኦፕሬሽን መልዕክቶች መላክ ነበረባቸው?', t:'num'},
      {id:'wa_posted', en:'How many of them were posted on time?', am:'ከነዚህ ስንቱ በሰዓቱ ተለጠፉ?', t:'num'},
      {id:'wa_missed', en:'If any were missed: which groups, and why?', am:'ያልተለጠፈ ካለ፦ በየትኞቹ ግሩፖች? ለምን?', t:'area', opt:1},
      {id:'wa_assembler', en:'Did the assemblers post their daily progress in every customer group?', am:'ገጣጣሚዎች በሁሉም የደንበኛ ግሩፖች ዕለታዊ ሂደታቸውን ለጠፉ?', t:'yesno'},
      {id:'wa_assembler_why', en:'Which groups were missed, by which assembler, and why?', am:'በየትኞቹ ግሩፖች አልተለጠፈም? የትኛው ገጣጣሚ? ለምን?', t:'area', show:{f:'wa_assembler', when:'no'}},
      {id:'wa_unanswered', en:'How many customer messages waited more than 2 hours for an operations answer?', am:'ስንት የደንበኛ መልዕክቶች ከ2 ሰዓት በላይ የኦፕሬሽን ምላሽ ሳያገኙ ቆዩ?', t:'num'},
      {id:'wa_unanswered_why', en:'Which customers, who should have answered, and have they been answered now?', am:'የየትኞቹ ደንበኞች ናቸው? መመለስ የነበረበት ማን ነበር? አሁን ምላሽ አግኝተዋል?', t:'area', show:{f:'wa_unanswered', when:'pos'}}
    ]},
    { en:'8 · Problems and solutions', am:'8 · ችግሮችና መፍትሔዎች', fields:[
      {id:'problem', en:'What was the biggest problem today?', am:'የዛሬው ትልቁ ችግር ምን ነበር?', t:'area', opt:1},
      {id:'cause', en:'What caused it?', am:'መንስኤው ምንድን ነው?', t:'area', opt:1},
      {id:'action', en:'What was done about it, by whom, and by when will it be fixed?', am:'ምን እርምጃ ተወሰደ? በማን? እስከ መቼ ይስተካከላል?', t:'area', opt:1},
      {id:'resist', en:'Did anyone refuse or work around an operations rule today?', am:'ዛሬ የኦፕሬሽን ደንብን የተቃወመ ወይም ያለፈ ሰው ነበር?', t:'yesno'},
      {id:'resist_what', en:'Who, which rule, and what did you do about it?', am:'ማን ነው? የትኛውን ደንብ? ምን እርምጃ ወሰዱ?', t:'area', show:{f:'resist', when:'yes'}},
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
      {id:'cash_in', en:'How much cash came in today?', am:'ዛሬ ስንት ብር ጥሬ ገንዘብ ገባ?', t:'money'},
      {id:'cash_in_list', en:'Where did it come from? One row per receipt', am:'ከየት መጣ? ለእያንዳንዱ ደረሰኝ አንድ መስመር', t:'table', addEn:'Add a receipt', addAm:'ደረሰኝ ጨምር',
        show:{f:'cash_in', when:'pos'},
        cols:[
          {id:'from', en:'From', am:'ከማን', t:'text'},
          {id:'kind', en:'For', am:'የምን', t:'choice', opts:[
            {v:'advance', en:'Advance', am:'ቅድመ ክፍያ'},
            {v:'final', en:'Final payment', am:'የመጨረሻ ክፍያ'},
            {v:'other', en:'Other', am:'ሌላ'}]},
          {id:'amount', en:'Amount', am:'መጠን', t:'money'},
          {id:'receipt', en:'Receipt no.', am:'የደረሰኝ ቁጥር', t:'text'}
        ]},
      {id:'cash_banked', en:'Was all of today\'s cash banked today?', am:'የዛሬው ገንዘብ ሁሉ ዛሬ ባንክ ገብቷል?', t:'yesno'},
      {id:'cash_banked_why', en:'How much was not banked, where is it tonight, who holds it, and when will it be banked?', am:'ምን ያህል ባንክ አልገባም? ዛሬ ማታ የት ነው ያለው? ማን ይዞታል? መቼ ባንክ ይገባል?', t:'area', show:{f:'cash_banked', when:'no'}},
      {id:'cash_hand', en:'How much cash is on hand at close?', am:'በመዝጊያ ሰዓት በእጅ ስንት ብር አለ?', t:'money',
        tgt:{op:'lte', v:5000, en:'Over 5,000 Birr overnight is –300 Birr', am:'ከ5,000 ብር በላይ ካደረ –300 ብር'}},
      {id:'cash_hand_why', en:'Why is more than 5,000 Birr staying overnight, and where is it kept?', am:'ለምን ከ5,000 ብር በላይ ያድራል? የት ነው የሚቀመጠው?', t:'area', show:{f:'cash_hand', when:'miss'}},
      {id:'cashbook', en:'Was every cash movement recorded in the cashbook today?', am:'ዛሬ የገንዘብ እንቅስቃሴ ሁሉ በገንዘብ መዝገቡ ተመዝግቧል?', t:'yesno'},
      {id:'cashbook_why', en:'What is not recorded yet, and when will it be?', am:'ያልተመዘገበው ምንድን ነው? መቼ ይመዘገባል?', t:'area', show:{f:'cashbook', when:'no'}},
      {id:'bank_verified', en:'Was the bank balance checked against the cashbook this morning?', am:'የባንክ ቀሪ ዛሬ ጠዋት ከገንዘብ መዝገቡ ጋር ተመሳክሯል?', t:'yesno'},
      {id:'bank_verified_why', en:'Why not, and when will it be checked?', am:'ለምን አልተመሳከረም? መቼ ይመሳከራል?', t:'area', show:{f:'bank_verified', when:'no'}},
      {id:'discrepancy', en:'Was any cash discrepancy found today?', am:'ዛሬ የገንዘብ ልዩነት ተገኝቷል?', t:'yesno'},
      {id:'discrepancy_what', en:'How much, in which account or till, who handled that money, and what was done?', am:'ምን ያህል? በየትኛው ሂሳብ ወይም ካዝና? ገንዘቡን የያዘው ማን ነበር? ምን እርምጃ ተወሰደ?', t:'area', show:{f:'discrepancy', when:'yes'}},
      {id:'discrepancy_told', en:'Were the Chairman and Kidan told the same day?', am:'በዕለቱ ለሊቀመንበሩና ለኪዳን ተነግሯል?', t:'yesno', show:{f:'discrepancy', when:'yes'}}
    ]},
    { en:'2 · Bank position', am:'2 · የባንክ ሁኔታ', fields:[
      {id:'bank_total', en:'What is the total bank balance tonight?', am:'ዛሬ ማታ ጠቅላላ የባንክ ቀሪ ስንት ነው?', t:'money',
        tgt:{op:'gte', v:6000000, en:'6 Million Birr Cash Reserve Rule', am:'የ6 ሚሊዮን ብር ክምችት ደንብ'}},
      {id:'bank_total_why', en:'The balance is below the 6,000,000 Birr reserve. Why, which payments were still made today, and what is frozen until it recovers?', am:'ቀሪው ከ6,000,000 ብር ክምችት በታች ነው። ለምን? ዛሬ የትኞቹ ክፍያዎች ተፈጸሙ? እስኪመለስ ድረስ ምን ቆመ?', t:'area', show:{f:'bank_total', when:'miss'}},
      {id:'below6_reported', en:'If it is below 6M, was the Chairman told today?', am:'ከ6ሚ በታች ከሆነ ዛሬ ለሊቀመንበሩ ተነግሯል?', t:'yesno', opt:1}
    ]},
    { en:'3 · Collections & payments', am:'3 · ገቢና ክፍያ', fields:[
      {id:'adv_in', en:'How much came in as advance payments today?', am:'ዛሬ ስንት ብር ቅድመ ክፍያ ገባ?', t:'money'},
      {id:'adv_in_list', en:'List each advance received today', am:'ዛሬ የገቡትን ቅድመ ክፍያዎች ይዘርዝሩ', t:'table', addEn:'Add an advance', addAm:'ቅድመ ክፍያ ጨምር',
        show:{f:'adv_in', when:'pos'},
        cols:[
          {id:'cust', en:'Customer', am:'ደንበኛ', t:'text'},
          {id:'code', en:'Job code', am:'የሥራ ኮድ', t:'text'},
          {id:'amount', en:'Amount', am:'መጠን', t:'money'},
          {id:'file', en:'Job File opened', am:'ጆብ ፋይል ተከፍቷል', t:'yesno'},
          {id:'group', en:'WhatsApp group created', am:'ዋትስአፕ ግሩፕ ተከፍቷል', t:'yesno'}
        ]},
      {id:'final_in', en:'How much came in as final payments today?', am:'ዛሬ ስንት ብር የመጨረሻ ክፍያ ገባ?', t:'money'},
      {id:'final_in_list', en:'List each final payment received today', am:'ዛሬ የገቡትን የመጨረሻ ክፍያዎች ይዘርዝሩ', t:'table', addEn:'Add a payment', addAm:'ክፍያ ጨምር',
        show:{f:'final_in', when:'pos'},
        cols:[
          {id:'cust', en:'Customer', am:'ደንበኛ', t:'text'},
          {id:'code', en:'Job code', am:'የሥራ ኮድ', t:'text'},
          {id:'amount', en:'Amount', am:'መጠን', t:'money'},
          {id:'prod', en:'Mahelet told production may start', am:'ምርት እንዲጀመር ለማህሌት ተነግሯል', t:'yesno'}
        ]},
      {id:'pay_approved', en:'How many payments did you approve today?', am:'ዛሬ ስንት ክፍያዎችን አጸደቁ?', t:'num'},
      {id:'pay_list', en:'List each payment approved today', am:'ዛሬ የጸደቁትን ክፍያዎች ይዘርዝሩ', t:'table', addEn:'Add a payment', addAm:'ክፍያ ጨምር',
        show:{f:'pay_approved', when:'pos'},
        cols:[
          {id:'to', en:'Paid to', am:'ተከፋይ', t:'text'},
          {id:'for', en:'For (job code or purpose)', am:'ለምን (የሥራ ኮድ ወይም ዓላማ)', t:'text'},
          {id:'amount', en:'Amount', am:'መጠን', t:'money'},
          {id:'kidan', en:'Kidan\'s approval (over 50,000)', am:'የኪዳን ፈቃድ (ከ50,000 በላይ)', t:'yesno'}
        ]},
      {id:'pay_value', en:'What is the total value of payments approved today?', am:'ዛሬ የጸደቁት ክፍያዎች ጠቅላላ ዋጋ ስንት ነው?', t:'money'},
      {id:'pay_kidan', en:'How many payments over 50,000 Birr went to Kidan for approval?', am:'ከ50,000 ብር በላይ የሆኑ ስንት ክፍያዎች ለኪዳን ፈቃድ ተላኩ?', t:'num'},
      {id:'pay_kidan_state', en:'Which ones, and has each been approved yet?', am:'የትኞቹ ናቸው? እያንዳንዱ በኪዳን ጸድቋል?', t:'area', show:{f:'pay_kidan', when:'pos'}}
    ]},
    { en:'4 · ZamZam Bank', am:'4 · ዘምዘም ባንክ', fields:[
      {id:'zz_transfer', en:'How much was transferred to ZamZam Bank today?', am:'ዛሬ ወደ ዘምዘም ባንክ ስንት ብር ተላለፈ?', t:'money'},
      {id:'zz_list', en:'Which approved purchase request does each transfer cover?', am:'እያንዳንዱ ዝውውር የትኛውን የጸደቀ የግዥ ጥያቄ ይሸፍናል?', t:'table', addEn:'Add a transfer', addAm:'ዝውውር ጨምር',
        show:{f:'zz_transfer', when:'pos'},
        cols:[
          {id:'req', en:'Purchase request', am:'የግዥ ጥያቄ', t:'text'},
          {id:'sup', en:'Supplier', am:'አቅራቢ', t:'text'},
          {id:'amount', en:'Amount', am:'መጠን', t:'money'},
          {id:'match', en:'Same as the approved amount', am:'ከጸደቀው መጠን ጋር እኩል ነው', t:'yesno'}
        ]},
      {id:'zz_confirmed', en:'Was every cheque written today covered by funds confirmed to Getachew first? (Yes if no cheque today)', am:'ዛሬ የተጻፈ እያንዳንዱ ቼክ ገንዘቡ ለጌታቸው ቀድሞ ተረጋግጦለት ነበር? (ዛሬ ቼክ ካልተጻፈ አዎ)', t:'yesno'},
      {id:'zz_confirmed_why', en:'Which cheque went out before the funds were confirmed, for how much, and why?', am:'ገንዘቡ ሳይረጋገጥ የወጣው የትኛው ቼክ ነው? ስንት ብር? ለምን?', t:'area', show:{f:'zz_confirmed', when:'no'}},
      {id:'zz_register', en:'Is every transfer recorded in the ZamZam Payment Register?', am:'እያንዳንዱ ዝውውር በዘምዘም የክፍያ መዝገብ ተመዝግቧል?', t:'yesno'},
      {id:'zz_register_why', en:'What is missing from the register, and when will it be entered?', am:'ከመዝገቡ የጎደለው ምንድን ነው? መቼ ይገባል?', t:'area', show:{f:'zz_register', when:'no'}},
      {id:'zz_disc', en:'How many ZamZam discrepancies were found today?', am:'ዛሬ በዘምዘም ስንት ልዩነቶች ተገኙ?', t:'num',
        tgt:{op:'lte', v:0, en:'Report to Kidan same day', am:'በዕለቱ ለኪዳን ማሳወቅ'}},
      {id:'zz_disc_what', en:'How much is each, what caused it, who handled it, and was Kidan told today?', am:'እያንዳንዱ ስንት ብር ነው? ምን አመጣው? ማን ያዘው? ዛሬ ለኪዳን ተነግሯል?', t:'area', show:{f:'zz_disc', when:'pos'}}
    ]},
    { en:'5 · Job Files & WhatsApp groups', am:'5 · ጆብ ፋይልና ዋትስአፕ ግሩፕ', fields:[
      {id:'jf_created', en:'How many Job Files were opened today?', am:'ዛሬ ስንት ጆብ ፋይሎች ተከፈቱ?', t:'num'},
      {id:'wa_created', en:'How many customer WhatsApp groups were created today?', am:'ዛሬ ስንት የደንበኛ ዋትስአፕ ግሩፖች ተከፈቱ?', t:'num'},
      {id:'final_req', en:'How many final payment requests went to customers today?', am:'ዛሬ ለደንበኞች ስንት የመጨረሻ ክፍያ ጥያቄዎች ተላኩ?', t:'num'},
      {id:'prod_confirmed', en:'How many production go-aheads did you give Mahelet today?', am:'ዛሬ ለማህሌት ስንት የምርት ማረጋገጫዎች ሰጡ?', t:'num'},
      {id:'prod_list', en:'Which job codes, and was the final payment confirmed in the bank for each?', am:'የትኞቹ የሥራ ኮዶች ናቸው? የእያንዳንዳቸው የመጨረሻ ክፍያ ባንክ መግባቱ ተረጋግጧል?', t:'area', show:{f:'prod_confirmed', when:'pos'}}
    ]},
    { en:'6 · Assembler payments', am:'6 · የገጣጣሚዎች ክፍያ', fields:[
      {id:'asm_reserved', en:'How much was reserved today for assembler payments?', am:'ዛሬ ለተከላ ሠራተኞች ክፍያ ስንት ብር ተያዘ?', t:'money'},
      {id:'asm_reserved_list', en:'For which jobs?', am:'ለየትኞቹ ሥራዎች?', t:'table', addEn:'Add job', addAm:'ሥራ ጨምር',
        show:{f:'asm_reserved', when:'pos'},
        cols:[
          {id:'code', en:'Job code', am:'የሥራ ኮድ', t:'text'},
          {id:'amount', en:'Reserved', am:'የተያዘ', t:'money'},
          {id:'slip', en:'Slip given to Elyas', am:'ወረቀቱ ለኤልያስ ተሰጥቷል', t:'yesno'}
        ]},
      {id:'asm_unreserved', en:'Is any job being installed without its assembler payment reserved?', am:'የገጣጣሚዎች ክፍያ ሳይያዝለት እየተተከለ ያለ ሥራ አለ?', t:'yesno'},
      {id:'asm_unreserved_what', en:'Which job, why was it missed, and when will the money be reserved?', am:'የትኛው ሥራ ነው? ለምን ቀረ? ገንዘቡ መቼ ይያዛል?', t:'area', show:{f:'asm_unreserved', when:'yes'}},
      {id:'asm_released', en:'How many assembler payments were released today?', am:'ዛሬ ስንት የገጣጣሚዎች ክፍያዎች ተለቀቁ?', t:'num'},
      {id:'asm_released_list', en:'List each payment released today', am:'ዛሬ የተለቀቁትን ክፍያዎች ይዘርዝሩ', t:'table', addEn:'Add a payment', addAm:'ክፍያ ጨምር',
        show:{f:'asm_released', when:'pos'},
        cols:[
          {id:'who', en:'Assembler', am:'ገጣጣሚ', t:'text'},
          {id:'code', en:'Job code', am:'የሥራ ኮድ', t:'text'},
          {id:'amount', en:'Amount', am:'መጠን', t:'money'},
          {id:'days', en:'Working days after acceptance', am:'ደንበኛው ከተቀበለ በኋላ የሥራ ቀናት', t:'num'}
        ]},
      {id:'asm_slips', en:'How many Payment Confirmation Slips were given out?', am:'ስንት የክፍያ ማረጋገጫ ወረቀቶች ተሰጡ?', t:'num'},
      {id:'asm_disputes', en:'How many payment disputes are open?', am:'ስንት የክፍያ ክርክሮች ክፍት ናቸው?', t:'num',
        tgt:{op:'lte', v:0, en:'Resolve within 48 hours', am:'በ48 ሰዓት ውስጥ መፍታት'}},
      {id:'asm_disputes_what', en:'Who, about what, open since when, and when will each be settled?', am:'የማን? ስለምን? ከመቼ ጀምሮ? እያንዳንዱ መቼ ይፈታል?', t:'area', show:{f:'asm_disputes', when:'pos'}}
    ]},
    { en:'7 · Job Tracking Board', am:'7 · የሥራ መከታተያ ቦርድ', fields:[
      {id:'board_moved', en:'How many job cards were moved today?', am:'ዛሬ ስንት የሥራ ካርዶች ተንቀሳቀሱ?', t:'num'},
      {id:'board_match', en:'Does the board match the physical Job Files tonight?', am:'ዛሬ ማታ ቦርዱ ከጆብ ፋይሎቹ ጋር ይመሳሰላል?', t:'yesno'},
      {id:'board_mismatch', en:'How many mismatches were found today?', am:'ዛሬ ስንት አለመጣጣሞች ተገኙ?', t:'num'},
      {id:'board_mismatch_what', en:'Which job cards, what did not match, who moved them, and was the Chairman told today?', am:'የትኞቹ ካርዶች ናቸው? ምኑ አልተመሳሰለም? ማን አንቀሳቀሳቸው? ዛሬ ለሊቀመንበሩ ተነግሯል?', t:'area', show:{f:'board_mismatch', when:'pos'}}
    ]},
    { en:'8 · Documents', am:'8 · ሰነዶች', fields:[
      {id:'doc_inv', en:'How many supplier invoices were collected today?', am:'ዛሬ ስንት የአቅራቢ ደረሰኞች ተሰበሰቡ?', t:'num'},
      {id:'doc_dn', en:'How many delivery notes were collected today?', am:'ዛሬ ስንት የርክክብ ወረቀቶች ተሰበሰቡ?', t:'num'},
      {id:'doc_missing', en:'How many documents are still missing?', am:'እስካሁን ስንት ሰነዶች ጎድለዋል?', t:'num'},
      {id:'doc_missing_list', en:'Which ones?', am:'የትኞቹ?', t:'table', addEn:'Add a document', addAm:'ሰነድ ጨምር',
        show:{f:'doc_missing', when:'pos'},
        cols:[
          {id:'doc', en:'Document', am:'ሰነድ', t:'text'},
          {id:'from', en:'From (supplier or staff)', am:'ከማን (አቅራቢ ወይም ሠራተኛ)', t:'text'},
          {id:'since', en:'Missing since', am:'ከመቼ ጀምሮ', t:'text'},
          {id:'chase', en:'Who is chasing it', am:'የሚከታተለው', t:'text'}
        ]}
    ]},
    { en:'9 · Problems and solutions', am:'9 · ችግሮችና መፍትሔዎች', fields:[
      {id:'problem', en:'What was the biggest problem today, and what caused it?', am:'የዛሬው ትልቁ ችግር ምን ነበር? መንስኤውስ?', t:'area', opt:1},
      {id:'action', en:'What was done about it, by whom, and by when will it be fixed?', am:'ምን እርምጃ ተወሰደ? በማን? እስከ መቼ ይስተካከላል?', t:'area', opt:1},
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
      {id:'pr_prep', en:'How many purchase requests did you prepare today?', am:'ዛሬ ስንት የግዥ ጥያቄ አዘጋጁ?', t:'num'},
      {id:'pr_list', en:'List each request prepared today', am:'ዛሬ የተዘጋጁትን ጥያቄዎች አንድ በአንድ ይዘርዝሩ', t:'table', addEn:'Add a request', addAm:'ጥያቄ ጨምር',
        show:{f:'pr_prep', when:'pos'},
        cols:[
          {id:'code', en:'Job code', am:'የሥራ ኮድ', t:'text'},
          {id:'item', en:'Materials', am:'ዕቃዎች', t:'text'},
          {id:'amount', en:'Amount', am:'መጠን', t:'money'},
          {id:'quotes', en:'Quotes', am:'ፕሮፎርማዎች', t:'num'}
        ]},
      {id:'pr_sub', en:'How many went to Selam for approval?', am:'ስንቱ ለሰላም ለማጽደቅ ቀረቡ?', t:'num'},
      {id:'pr_app', en:'How many did Selam approve?', am:'ሰላም ስንቱን አጸደቀች?', t:'num'},
      {id:'pr_ret', en:'How many were returned or rejected?', am:'ስንቱ ተመለሱ ወይም ውድቅ ሆኑ?', t:'num'},
      {id:'pr_ret_why', en:'Which ones, what did Selam find wrong, and when will each go back?', am:'የትኞቹ ናቸው? ሰላም ምን ስህተት አገኘች? እያንዳንዱ መቼ ተስተካክሎ ይመለሳል?', t:'area', show:{f:'pr_ret', when:'pos'}},
      {id:'pr_quotes', en:'How many requests carried 3 or more supplier quotes? (with 3 quotes / all requests)', am:'ስንቱ ጥያቄ 3 እና ከዚያ በላይ የአቅራቢ ፕሮፎርማ ነበረው? (3 ፕሮፎርማ ያላቸው / ሁሉም ጥያቄዎች)', t:'ratio'},
      {id:'pr_quotes_why', en:'Which requests had fewer than 3 quotes, and why could a third not be found?', am:'ከ3 ያነሰ ፕሮፎርማ የነበራቸው የትኞቹ ናቸው? ሦስተኛው ለምን አልተገኘም?', t:'area', show:{f:'pr_quotes', when:'short'}}
    ]},
    { en:'2 · ZamZam Bank cheques', am:'2 · የዘምዘም ባንክ ቼኮች', fields:[
      {id:'chq_issued', en:'How many ZamZam cheques did you issue today?', am:'ዛሬ ስንት የዘምዘም ቼክ ሰጡ?', t:'num'},
      {id:'chq_list', en:'List each cheque issued today', am:'ዛሬ የተሰጡትን ቼኮች ይዘርዝሩ', t:'table', addEn:'Add a cheque', addAm:'ቼክ ጨምር',
        show:{f:'chq_issued', when:'pos'},
        cols:[
          {id:'no', en:'Cheque no.', am:'የቼክ ቁጥር', t:'text'},
          {id:'sup', en:'Supplier', am:'አቅራቢ', t:'text'},
          {id:'code', en:'Job code', am:'የሥራ ኮድ', t:'text'},
          {id:'amount', en:'Amount', am:'መጠን', t:'money'}
        ]},
      {id:'chq_value', en:'What is the total value of today\'s cheques?', am:'የዛሬዎቹ ቼኮች ጠቅላላ ዋጋ ስንት ነው?', t:'money'},
      {id:'chq_confirmed', en:'Did Selam confirm the funds in ZamZam before every cheque?', am:'ከእያንዳንዱ ቼክ በፊት ሰላም ገንዘቡ ዘምዘም መግባቱን አረጋግጣለች?', t:'yesno'},
      {id:'chq_confirmed_why', en:'Which cheque went out without confirmation, for how much, to whom, and why?', am:'ያለማረጋገጫ የተሰጠው የትኛው ቼክ ነው? በስንት ብር? ለማን? ለምን?', t:'area', show:{f:'chq_confirmed', when:'no'}},
      {id:'chq_match', en:'Was every cheque for the approved amount, to the approved supplier?', am:'እያንዳንዱ ቼክ በጸደቀው መጠንና ለጸደቀው አቅራቢ ነበር?', t:'yesno'},
      {id:'chq_match_why', en:'Which cheque differed, how, and who allowed it?', am:'የተለየው የትኛው ቼክ ነው? በምን ተለየ? ማን ፈቀደ?', t:'area', show:{f:'chq_match', when:'no'}},
      {id:'chq_secure', en:'Was the cheque book locked away at close?', am:'የቼክ ደብተሩ በመዝጊያ ሰዓት ተቆልፎበታል?', t:'yesno'},
      {id:'chq_secure_why', en:'Where was it, who could reach it, and is it locked away now?', am:'የት ነበር? ማን ሊደርስበት ይችል ነበር? አሁን ተቆልፎበታል?', t:'area', show:{f:'chq_secure', when:'no'}}
    ]},
    { en:'3 · Orders placed', am:'3 · የተሰጡ ትዕዛዞች', fields:[
      {id:'ord_placed', en:'How many orders did you place today?', am:'ዛሬ ስንት ትዕዛዝ ሰጡ?', t:'num'},
      {id:'ord_list', en:'List each order and the delivery date the supplier promised', am:'እያንዳንዱን ትዕዛዝና አቅራቢው ቃል የገባውን የርክክብ ቀን ይዘርዝሩ', t:'table', addEn:'Add an order', addAm:'ትዕዛዝ ጨምር',
        show:{f:'ord_placed', when:'pos'},
        cols:[
          {id:'sup', en:'Supplier', am:'አቅራቢ', t:'text'},
          {id:'code', en:'Job code', am:'የሥራ ኮድ', t:'text'},
          {id:'item', en:'Material', am:'ዕቃ', t:'text'},
          {id:'date', en:'Promised delivery', am:'ቃል የተገባው ርክክብ', t:'text'}
        ]},
      {id:'ord_suppliers', en:'With which suppliers?', am:'ከየትኞቹ አቅራቢዎች?', t:'text', opt:1},
      {id:'ord_dates', en:'For how many of today\'s orders is the delivery date confirmed?', am:'ከዛሬዎቹ ትዕዛዞች ስንቱ የርክክብ ቀን ተረጋግጧል?', t:'num'}
    ]},
    { en:'4 · Deliveries', am:'4 · ርክክብ', fields:[
      {id:'del_recv', en:'How many deliveries reached the store today?', am:'ዛሬ ስንት ርክክብ መጋዘን ደረሰ?', t:'num'},
      {id:'del_rej', en:'How many materials did the store reject?', am:'መጋዘኑ ስንት ዕቃ አልተቀበለም?', t:'num'},
      {id:'del_rej_list', en:'What was rejected, and what happens next?', am:'ምን ውድቅ ተደረገ? ቀጥሎ ምን ይሆናል?', t:'table', addEn:'Add a rejected item', addAm:'ዕቃ ጨምር',
        show:{f:'del_rej', when:'pos'},
        cols:[
          {id:'item', en:'Material', am:'ዕቃ', t:'text'},
          {id:'sup', en:'Supplier', am:'አቅራቢ', t:'text'},
          {id:'code', en:'Job code', am:'የሥራ ኮድ', t:'text'},
          {id:'why', en:'Reason', am:'ምክንያት', t:'text'},
          {id:'fix', en:'Replacement or refund, and when', am:'ምትክ ወይም ተመላሽ፣ መቼ', t:'text'}
        ]},
      {id:'del_repl', en:'Has the supplier been asked for a replacement or refund?', am:'አቅራቢው ምትክ ወይም ተመላሽ እንዲሰጥ ተጠይቋል?', t:'yesno', opt:1}
    ]},
    { en:'5 · Documents to Selam', am:'5 · ለሰላም የተላኩ ሰነዶች', fields:[
      {id:'doc_24', en:'How many purchase documents reached Selam within 24 hours? (on time / all due)', am:'ስንት የግዥ ሰነዶች በ24 ሰዓት ውስጥ ለሰላም ደረሱ? (በሰዓቱ / መድረስ የነበረባቸው)', t:'ratio'},
      {id:'doc_missing', en:'How many documents are still outstanding?', am:'እስካሁን ያልቀረቡ ሰነዶች ስንት ናቸው?', t:'num',
        tgt:{op:'lte', v:0, en:'–200 Birr per document', am:'በሰነድ –200 ብር'}},
      {id:'doc_missing_list', en:'Which documents, for which jobs, and when will each reach Selam?', am:'የትኞቹ ሰነዶች? ለየትኞቹ ሥራዎች? እያንዳንዱ መቼ ለሰላም ይደርሳል?', t:'table', addEn:'Add a document', addAm:'ሰነድ ጨምር',
        show:{f:'doc_missing', when:'pos'},
        cols:[
          {id:'code', en:'Job code', am:'የሥራ ኮድ', t:'text'},
          {id:'doc', en:'Document', am:'ሰነድ', t:'choice', opts:[
            {v:'invoice', en:'Supplier invoice', am:'የአቅራቢ ደረሰኝ (ኢንቮይስ)'},
            {v:'dnote', en:'Delivery note', am:'የርክክብ ማስታወሻ'},
            {v:'jobcard', en:'Job card reference', am:'የጆብ ካርድ ማጣቀሻ'},
            {v:'store', en:'Store confirmation', am:'የመጋዘን ማረጋገጫ'},
            {v:'warranty', en:'Warranty', am:'የዋስትና ሰነድ'}]},
          {id:'sup', en:'Supplier', am:'አቅራቢ', t:'text'},
          {id:'when', en:'Expected by', am:'የሚደርስበት ቀን', t:'text'}
        ]}
    ]},
    { en:'6 · Supplier issues', am:'6 · የአቅራቢ ችግሮች', fields:[
      {id:'sup_delay', en:'How many supplier delays were there today?', am:'ዛሬ ስንት የአቅራቢ መዘግየት ነበር?', t:'num'},
      {id:'sup_delay_list', en:'Which deliveries are late?', am:'የዘገዩት የትኞቹ ርክክቦች ናቸው?', t:'table', addEn:'Add a delay', addAm:'መዘግየት ጨምር',
        show:{f:'sup_delay', when:'pos'},
        cols:[
          {id:'sup', en:'Supplier', am:'አቅራቢ', t:'text'},
          {id:'code', en:'Job code', am:'የሥራ ኮድ', t:'text'},
          {id:'item', en:'Material', am:'ዕቃ', t:'text'},
          {id:'was', en:'Promised date', am:'ቃል የተገባው ቀን', t:'text'},
          {id:'now', en:'New date', am:'አዲሱ ቀን', t:'text'},
          {id:'stops', en:'Holds up production?', am:'ምርት ያቆማል?', t:'yesno'}
        ]},
      {id:'sup_price', en:'How many suppliers changed a price today?', am:'ዛሬ ስንት አቅራቢዎች ዋጋ ቀየሩ?', t:'num'},
      {id:'sup_price_what', en:'Which suppliers, on what material, and from what price to what?', am:'የትኞቹ አቅራቢዎች? በየትኛው ዕቃ? ከስንት ወደ ስንት?', t:'area', show:{f:'sup_price', when:'pos'}},
      {id:'sup_quality', en:'How many quality problems came from suppliers today?', am:'ዛሬ ከአቅራቢዎች ስንት የጥራት ችግር መጣ?', t:'num'},
      {id:'sup_quality_what', en:'Which supplier, what was wrong, and what have they agreed to do?', am:'የትኛው አቅራቢ? ምን ችግር ነበር? ምን ለማድረግ ተስማሙ?', t:'area', show:{f:'sup_quality', when:'pos'}},
      {id:'sup_reported', en:'Were Mahelet and Selam told of every issue the same day?', am:'እያንዳንዱ ችግር ለማህሌትና ለሰላም በዚያው ቀን ተነግሯል?', t:'yesno'},
      {id:'sup_reported_why', en:'Which issue was not reported, and why?', am:'ያልተነገረው የትኛው ችግር ነው? ለምን?', t:'area', show:{f:'sup_reported', when:'no'}}
    ]},
    { en:'7 · What we paid, against last time', am:'7 · ካለፈው ጋር ሲነጻጸር የከፈልነው', fields:[
      {id:'p_rows', en:'List each material bought today, with its price against last time', am:'ዛሬ የተገዛውን እያንዳንዱን ዕቃ ከቀድሞው ዋጋው ጋር ይዘርዝሩ',
       t:'table', addEn:'Add material', addAm:'ዕቃ ጨምር', cols:[
        {id:'pitem', en:'Material', am:'ዕቃ', t:'text'},
        {id:'psup',  en:'Supplier', am:'አቅራቢ', t:'text'},
        {id:'punit', en:'Unit', am:'መለኪያ', t:'text'},
        {id:'pnow',  en:'Price now', am:'የአሁን ዋጋ', t:'money'},
        {id:'plast', en:'Price last time', am:'ያለፈው ዋጋ', t:'money'},
        {id:'pchg',  en:'Change %', am:'ለውጥ %', t:'pct'},
        {id:'pquot', en:'Quotes compared', am:'የተነጻጸሩ ዋጋዎች', t:'num'}
      ]},
      {id:'p_up', en:'How many materials went up more than 10%?', am:'ስንት ዕቃዎች ከ10% በላይ ጨመሩ?', t:'num',
        tgt:{op:'lte', v:0, en:'The margin floor is 6,000 Birr/m² — a 10% rise must reach Ephrata before the next quote',
             am:'የትርፍ ወለሉ 6,000 ብር/ካሬ ሜትር ነው — የ10% ጭማሪ ከቀጣዩ ዋጋ በፊት ኤፍራታ ጋር መድረስ አለበት'}},
      {id:'p_up_what', en:'Which materials, by how much, and which open quotations does it affect?', am:'የትኞቹ ዕቃዎች? በስንት ጨመሩ? የትኞቹን ክፍት ፕሮፎርማዎች ይነካል?', t:'area', show:{f:'p_up', when:'pos'}},
      {id:'p_told', en:'If any, were Ephrata and Selam told today?', am:'ካሉ ለኤፍራታና ለሰላም ዛሬ ተነግሯል?', t:'yesno', opt:1, i:1},
      {id:'p_sub', en:'Was any material swapped for a cheaper one?', am:'ማንኛውም ዕቃ በርካሽ ተተክቷል?', t:'yesno'},
      {id:'p_sub_what', en:'What was swapped for what, on which job, and why?', am:'ምን በምን ተተካ? በየትኛው ሥራ? ለምን?', t:'area', show:{f:'p_sub', when:'yes'}},
      {id:'p_subok', en:'If yes, did Wude approve it before it was bought?', am:'አዎ ከሆነ ውዱ ከመገዛቱ በፊት አጽድቃለች?', t:'yesno', opt:1, i:1}
    ]},
    { en:'8 · Problems and solutions', am:'8 · ችግሮችና መፍትሔዎች', fields:[
      {id:'problem', en:'What was the biggest problem today, and what caused it?', am:'የዛሬው ትልቁ ችግር ምን ነበር? መንስኤውስ?', t:'area', opt:1},
      {id:'action', en:'What was done about it, by whom, and by when will it be fixed?', am:'ምን እርምጃ ተወሰደ? በማን? እስከ መቼ ይስተካከላል?', t:'area', opt:1},
      {id:'need_help', en:'What do you need from Mahelet, Selam or the store, and by when?', am:'ከማህሌት፣ ከሰላም ወይም ከመጋዘን ምን ያስፈልግዎታል? እስከ መቼ?', t:'area', opt:1},
      {id:'need_chair', en:'Do you need a decision from the Chairman?', am:'የሊቀመንበሩ ውሳኔ ያስፈልግዎታል?', t:'yesno'},
      {id:'need_chair_what', en:'What exactly should he decide, what are the options, and by when?', am:'በትክክል ምን እንዲወስኑ ይፈልጋሉ? አማራጮቹ ምንድን ናቸው? እስከ መቼ?', t:'area', show:{f:'need_chair', when:'yes'}}
    ]},
    { en:'9 · Tomorrow', am:'9 · ነገ', fields:[
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
    { en:'1 · Receiving', am:'1 · ዕቃ መረከብ', fields:[
      {id:'rec_deliv', en:'How many deliveries came into the store today?', am:'ዛሬ ስንት ርክክብ መጋዘን ገባ?', t:'num'},
      {id:'rec_list', en:'List each delivery received today', am:'ዛሬ የደረሱትን ርክክቦች አንድ በአንድ ይዘርዝሩ', t:'table', addEn:'Add a delivery', addAm:'ርክክብ ጨምር',
        show:{f:'rec_deliv', when:'pos'},
        cols:[
          {id:'sup', en:'Supplier', am:'አቅራቢ', t:'text'},
          {id:'code', en:'Job code', am:'የሥራ ኮድ', t:'text'},
          {id:'item', en:'Material', am:'ዕቃ', t:'text'},
          {id:'qty', en:'Quantity', am:'ብዛት', t:'num'},
          {id:'ok', en:'Matches the BOM?', am:'ከBOM ጋር ይስማማል?', t:'yesno'}
        ]},
      {id:'rec_checked', en:'How many were checked against the Job File / BOM? (checked / delivered)', am:'ስንቱ ከጆብ ፋይል / BOM ጋር ተመሳከሩ? (የተመሳከሩ / የደረሱ)', t:'ratio'},
      {id:'rec_checked_why', en:'Which deliveries went in unchecked, and why?', am:'ሳይመሳከሩ የገቡት የትኞቹ ርክክቦች ናቸው? ለምን?', t:'area', show:{f:'rec_checked', when:'short'}},
      {id:'rec_accepted', en:'How many were accepted into the store?', am:'ስንቱ ወደ መጋዘን ገቡ?', t:'num'},
      {id:'rec_rejected', en:'How many did you reject?', am:'ስንቱን ውድቅ አደረጉ?', t:'num'},
      {id:'rec_grn', en:'How many goods received notes did you sign?', am:'ስንት የዕቃ መረከቢያ ወረቀት ፈረሙ?', t:'num'}
    ]},
    { en:'2 · Anything rejected today', am:'2 · ዛሬ ውድቅ የተደረጉ ዕቃዎች', fields:[
      {id:'rej_reason', en:'What was rejected, from which supplier, and why?', am:'ምን ውድቅ ተደረገ? ከየትኛው አቅራቢ? ለምን?', t:'area', opt:1},
      {id:'rej_photo', en:'Was each rejection photographed?', am:'ውድቅ የተደረገው እያንዳንዱ ዕቃ ፎቶ ተነስቷል?', t:'yesno', opt:1},
      {id:'rej_reported', en:'Were Getachew and Selam told the same day?', am:'ለጌታቸውና ለሰላም በዚያው ቀን ተነግሯል?', t:'yesno', opt:1}
    ]},
    { en:'3 · Stock record', am:'3 · የክምችት መዝገብ', fields:[
      {id:'st_open', en:'How many stock items were on hand at opening?', am:'በመክፈቻ ሰዓት ስንት የክምችት ዕቃዎች ነበሩ?', t:'num'},
      {id:'st_in', en:'How many came in today?', am:'ዛሬ ስንት ገቡ?', t:'num'},
      {id:'st_out', en:'How many went out today?', am:'ዛሬ ስንት ወጡ?', t:'num'},
      {id:'st_close', en:'How many are on hand at close?', am:'በመዝጊያ ሰዓት ስንት አሉ?', t:'num'},
      {id:'st_disc', en:'How many differences did you find between the record and the shelf?', am:'በመዝገቡና በመደርደሪያው መካከል ስንት ልዩነት ተገኘ?', t:'num',
        tgt:{op:'lte', v:0, en:'–500 Birr each · report same day', am:'እያንዳንዱ –500 ብር · በዕለቱ ማሳወቅ'}},
      {id:'st_disc_list', en:'What does not match?', am:'የማይስማማው ምንድን ነው?', t:'table', addEn:'Add an item', addAm:'ዕቃ ጨምር',
        show:{f:'st_disc', when:'pos'},
        cols:[
          {id:'item', en:'Material', am:'ዕቃ', t:'text'},
          {id:'book', en:'On record', am:'በመዝገብ', t:'num'},
          {id:'shelf', en:'On the shelf', am:'በመደርደሪያ', t:'num'},
          {id:'why', en:'Likely reason', am:'ሊሆን የሚችል ምክንያት', t:'text'},
          {id:'told', en:'Mahelet and Selam told today?', am:'ለማህሌትና ለሰላም ዛሬ ተነግሯል?', t:'yesno'}
        ]}
    ]},
    { en:'4 · Issuing materials', am:'4 · ዕቃ ማውጣት', fields:[
      {id:'iss_count', en:'How many times were materials issued today?', am:'ዛሬ ስንት ጊዜ ዕቃ ከመጋዘን ወጣ?', t:'num'},
      {id:'iss_approved', en:'Did every issue carry Mahelet\'s signed approval?', am:'እያንዳንዱ ዕቃ በማህሌት ፊርማ ፈቃድ ወጥቷል?', t:'yesno'},
      {id:'iss_approved_why', en:'What went out without it, to whom, for which job, and who allowed it?', am:'ያለፈቃድ የወጣው ምንድን ነው? ለማን? ለየትኛው ሥራ? ማን ፈቀደ?', t:'area', show:{f:'iss_approved', when:'no'}},
      {id:'iss_correct', en:'Did everything go to the correct job?', am:'ሁሉም ለትክክለኛው ሥራ ወጥቷል?', t:'yesno'},
      {id:'iss_correct_why', en:'What went to the wrong job, and has it been put right?', am:'ወደ ተሳሳተ ሥራ የሄደው ምንድን ነው? ተስተካክሏል?', t:'area', show:{f:'iss_correct', when:'no'}}
    ]},
    { en:'5 · Shortages', am:'5 · እጥረቶች', fields:[
      {id:'sh_flagged', en:'How many shortages did you flag today?', am:'ዛሬ ስንት እጥረት ጠቆሙ?', t:'num'},
      {id:'sh_flagged_who', en:'Who was told, and when is each expected in?', am:'ለማን ተነገረ? እያንዳንዱ መቼ ይደርሳል?', t:'area', show:{f:'sh_flagged', when:'pos'}},
      {id:'sh_stopped', en:'Did production stop today because something ran out?', am:'ዛሬ አንድ ዕቃ በማለቁ ምርት ቆሟል?', t:'yesno'},
      {id:'sh_stopped_what', en:'Which job stopped, for how long, and had the shortage been flagged before?', am:'የትኛው ሥራ ቆመ? ለምን ያህል ጊዜ? እጥረቱ አስቀድሞ ተጠቁሞ ነበር?', t:'area', show:{f:'sh_stopped', when:'yes'}},
      {id:'sh_what', en:'Which materials are short?', am:'የትኞቹ ዕቃዎች አጥረዋል?', t:'text', opt:1}
    ]},
    { en:'6 · Factory consumables', am:'6 · የፋብሪካ ፍጆታ ዕቃዎች', fields:[
      {id:'con_today', en:'How many consumable items were issued today?', am:'ዛሬ ስንት የፍጆታ ዕቃ ወጣ?', t:'num'},
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
      {id:'k_stock', en:'For each material: how much is on hand at close, how much was used this week, and how many days will it last?',
       am:'ለእያንዳንዱ ዕቃ፦ በመዝጊያ ሰዓት ስንት አለ? በዚህ ሳምንት ስንት ዋለ? ለስንት ቀን ይበቃል?',
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
        {id:'used', en:'Used this week', am:'በሳምንቱ የዋለ', t:'num'},
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
      {id:'problem', en:'What was the biggest problem in the store today, and what caused it?', am:'በመጋዘኑ የዛሬው ትልቁ ችግር ምን ነበር? መንስኤውስ?', t:'area', opt:1},
      {id:'action', en:'What was done about it, by whom, and by when will it be fixed?', am:'ምን እርምጃ ተወሰደ? በማን? እስከ መቼ ይስተካከላል?', t:'area', opt:1},
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
  id:'ephrata-weekly', person:'ephrata', cadence:'weekly', dueTime:'16:00', dueDay:5,
  en:'Weekly Commercial Report', am:'ሳምንታዊ የንግድ ሪፖርት',
  toEn:'Chairman', toAm:'ሊቀመንበር',
  dueEn:'Friday 4:00 PM', dueAm:'ዓርብ ከቀኑ 10፡00 (4:00 PM)',
  penEn:'Late –500 Birr', penAm:'ዘግይቶ –500 ብር',
  sections:[
    { en:'1 · Sales performance', am:'1 · የሽያጭ አፈጻጸም', fields:[
      {id:'w_contracts', en:'How many contracts were signed this week?', am:'በዚህ ሳምንት ስንት ውል ተፈረመ?', t:'num'},
      {id:'w_contracts_list', en:'List each contract signed this week', am:'በዚህ ሳምንት የተፈረሙትን ውሎች ይዘርዝሩ', t:'table', addEn:'Add a contract', addAm:'ውል ጨምር',
        show:{f:'w_contracts', when:'pos'},
        cols:[
          {id:'cust', en:'Customer', am:'ደንበኛ', t:'text'},
          {id:'code', en:'Job code', am:'የሥራ ኮድ', t:'text'},
          {id:'value', en:'Contract value', am:'የውል ዋጋ', t:'money'},
          {id:'adv', en:'Advance paid', am:'የተከፈለ ቅድመ ክፍያ', t:'money'},
          {id:'sp', en:'Salesperson', am:'ሻጭ', t:'text'}
        ]},
      {id:'w_value', en:'What is the total value of this week\'s contracts?', am:'የዚህ ሳምንት ውሎች ጠቅላላ ዋጋ ስንት ነው?', t:'money'},
      {id:'w_external', en:'How much was collected from external customers this week?', am:'በዚህ ሳምንት ከውጭ ደንበኞች ስንት ብር ተሰበሰበ?', t:'money',
        tgt:{op:'gte', v:3000000, en:'Below 3,000,000 Birr is a failed week — no commission',
             am:'ከ3,000,000 ብር በታች ከሆነ ሳምንቱ ወድቋል — ኮሚሽን የለም'}},
      {id:'w_external_why', en:'Why is the week below 3,000,000 Birr? Was the cause beyond your control (holiday, supplier shutdown, customer refusal)?', am:'ሳምንቱ ለምን ከ3,000,000 ብር በታች ሆነ? ምክንያቱ ከቁጥጥርዎ ውጭ ነበር? (በዓል፣ የአቅራቢ መዘጋት፣ የደንበኛ እምቢታ)', t:'area', show:{f:'w_external', when:'miss'}},
      {id:'w_internal', en:'How much came in from internal (sister-company) work this week?', am:'በዚህ ሳምንት ከውስጥ (ከእህት ኩባንያ) ሥራ ስንት ብር ገባ?', t:'money'},
      {id:'w_target_met', en:'Did the week reach the 6,000,000 Birr target?', am:'ሳምንቱ የ6,000,000 ብር ዒላማውን አሳክቷል?', t:'yesno'},
      {id:'w_jobfiles', en:'How many Job Files sent to Mahelet this week were complete? (complete / sent)', am:'በዚህ ሳምንት ወደ ማህሌት ከተላኩ የሥራ ፋይሎች ስንቱ የተሟሉ ነበሩ? (የተሟሉ / የተላኩ)', t:'ratio'},
      {id:'w_jobfiles_why', en:'Which Job Files went incomplete, what was missing, and has it been sent now?', am:'ያልተሟሉት የየትኞቹ ሥራዎች ፋይሎች ናቸው? ምን ጎደለ? አሁን ተልኳል?', t:'area', show:{f:'w_jobfiles', when:'short'}}
    ]},
    { en:'2 · Lead performance', am:'2 · የደንበኛ አፈጻጸም', fields:[
      {id:'w_leads', en:'How many new leads came in this week?', am:'በዚህ ሳምንት ስንት አዲስ ደንበኞች መጡ?', t:'num'},
      {id:'w_leads_1hr', en:'New leads this week: how many were called within 1 hour? (called within 1 hour / all new leads this week)', am:'በዚህ ሳምንት አዲስ የመጡ ደንበኞች፦ ስንቱ በ1 ሰዓት ውስጥ ተደወለላቸው? (በ1 ሰዓት ውስጥ የተደወለላቸው / በዚህ ሳምንት የመጡ አዲስ ደንበኞች በሙሉ)', t:'ratio', whole:'w_leads'},
      {id:'w_leads_1hr_why', en:'Which leads were missed, whose leads were they, and why?', am:'ያመለጡት ደንበኞች እነማን ናቸው? የማን ደንበኞች ነበሩ? ለምን?', t:'area', show:{f:'w_leads_1hr', when:'short'}},
      {id:'w_visits', en:'How many pre-measurement visits were done this week?', am:'በዚህ ሳምንት ስንት የቅድመ ልኬት ጉብኝት ተካሄደ?', t:'num'},
      {id:'w_quotes', en:'How many quotations went out this week?', am:'በዚህ ሳምንት ስንት ፕሮፎርማ ተሰጠ?', t:'num'},
      {id:'w_quotes_48h', en:'How many went out within 48 hours of measuring? (on time / all quotations)', am:'ስንቱ ልኬት በተወሰደ በ48 ሰዓት ውስጥ ተሰጠ? (በሰዓቱ / ሁሉም)', t:'ratio'},
      {id:'w_quotes_48h_why', en:'Which customers waited longer, and what held each one up?', am:'ከዚያ በላይ የጠበቁት የትኞቹ ደንበኞች ናቸው? እያንዳንዱን ምን ያዘው?', t:'area', show:{f:'w_quotes_48h', when:'short'}},
      {id:'w_conv', en:'What share of this week\'s leads became contracts?', am:'በዚህ ሳምንት ከመጡት ደንበኞች ስንት በመቶው ውል ፈረሙ?', t:'pct'}
    ]},
    { en:'3 · Margin performance', am:'3 · የትርፍ ህዳግ አፈጻጸም', fields:[
      {id:'w_margin', en:'What was the average margin per m² on this week\'s external contracts?', am:'የዚህ ሳምንት የውጭ ውሎች አማካይ ህዳግ በካሬ ሜትር ስንት ነው?', t:'num',
        tgt:{op:'gte', v:6000, en:'Margin floor 6,000 Birr/m²', am:'ዝቅተኛው ህዳግ 6,000 ብር በካሬ'}},
      {id:'w_below_margin', en:'How many contracts were signed below the margin floor?', am:'ከህዳጉ በታች ስንት ውል ተፈረመ?', t:'num',
        tgt:{op:'lte', v:0, en:'–5,000 Birr each without Chairman approval',
             am:'ያለ ሊቀመንበር ፈቃድ እያንዳንዱ –5,000 ብር'}},
      {id:'w_below_margin_list', en:'List each one, and who approved it', am:'እያንዳንዱን ይዘርዝሩ፤ ማን እንዳጸደቀውም', t:'table', addEn:'Add a contract', addAm:'ውል ጨምር',
        show:{f:'w_below_margin', when:'pos'},
        cols:[
          {id:'cust', en:'Customer', am:'ደንበኛ', t:'text'},
          {id:'code', en:'Job code', am:'የሥራ ኮድ', t:'text'},
          {id:'margin', en:'Margin per m²', am:'ህዳግ በካሬ ሜትር', t:'money'},
          {id:'ok', en:'Chairman approved', am:'ሊቀመንበሩ አጽድቀዋል', t:'yesno'}
        ]}
    ]},
    { en:'4 · WhatsApp compliance', am:'4 · የዋትስአፕ ተገዢነት', fields:[
      {id:'w_wa_groups', en:'How many customer groups were active this week?', am:'በዚህ ሳምንት ስንት የደንበኛ ግሩፖች ንቁ ነበሩ?', t:'num'},
      {id:'w_wa_msgs', en:'How many required stage messages were posted? (posted / required)', am:'ከሚገባው የደረጃ መልዕክት ስንቱ ተላከ? (የተላከ / የሚገባው)', t:'ratio'},
      {id:'w_wa_msgs_why', en:'Which groups missed a stage message, whose groups were they, and why?', am:'የደረጃ መልዕክት ያልደረሳቸው የትኞቹ ግሩፖች ናቸው? የማን ግሩፖች ናቸው? ለምን?', t:'area', show:{f:'w_wa_msgs', when:'short'}},
      {id:'w_wa_rate', en:'What was the compliance rate this week?', am:'የዚህ ሳምንት የተገዢነት መጠን ስንት ነው?', t:'pct',
        tgt:{op:'gte', v:100, en:'100% required for the team bonus', am:'ለቡድን ቦነስ 100% መሆን አለበት'}},
      {id:'w_wa_unans', en:'How many messages waited more than 2 hours for an answer?', am:'ከ2 ሰዓት በላይ ምላሽ ሳያገኙ የቆዩ መልዕክቶች ስንት ናቸው?', t:'num'},
      {id:'w_wa_unans_why', en:'Which customers, who should have answered, and what was done?', am:'የየትኞቹ ደንበኞች ናቸው? መመለስ የነበረበት ማን ነበር? ምን እርምጃ ተወሰደ?', t:'area', show:{f:'w_wa_unans', when:'pos'}},
      {id:'w_wa_complaints', en:'How many customers complained about WhatsApp handling?', am:'ስንት ደንበኞች በዋትስአፕ አያያዝ ላይ ቅሬታ አቀረቡ?', t:'num'},
      {id:'w_wa_complaints_what', en:'Who complained, about what, and how was it resolved?', am:'ቅሬታ ያቀረበው ማን ነው? ስለምን? እንዴት ተፈታ?', t:'area', show:{f:'w_wa_complaints', when:'pos'}},
      {id:'w_wa_viol', en:'How many WhatsApp violations did the team make this week?', am:'ቡድኑ በዚህ ሳምንት ስንት የዋትስአፕ ጥሰት ፈጸመ?', t:'num'},
      {id:'w_wa_viol_who', en:'Who, what happened, and what penalty was applied?', am:'እነማን ናቸው? ምን ተፈጠረ? ምን ቅጣት ተሰጠ?', t:'area', show:{f:'w_wa_viol', when:'pos'}}
    ]},
    { en:'5 · Marketing performance', am:'5 · የማርኬቲንግ አፈጻጸም', fields:[
      {id:'w_posts', en:'How many posts went up this week?', am:'በዚህ ሳምንት ስንት ፖስት ተለጠፈ?', t:'num',
        tgt:{op:'gte', v:3, en:'At least 3 per week — –300 Birr per missed post',
             am:'በሳምንት ቢያንስ 3 — ላልተለጠፈ እያንዳንዱ –300 ብር'}},
      {id:'w_posts_why', en:'Why fewer than 3, and on which days will next week\'s posts go up?', am:'ለምን ከ3 ያነሰ ሆነ? የሚቀጥለው ሳምንት ፖስቶች በየትኞቹ ቀናት ይለጠፋሉ?', t:'area', show:{f:'w_posts', when:'miss'}},
      {id:'w_fb', en:'On Facebook', am:'በፌስቡክ', t:'num', i:1},
      {id:'w_ig', en:'On Instagram', am:'በኢንስታግራም', t:'num', i:1},
      {id:'w_tt', en:'On TikTok', am:'በቲክቶክ', t:'num', i:1},
      {id:'w_inq', en:'How many social media inquiries came in?', am:'ከሶሻል ሚዲያ ስንት ጥያቄዎች ደረሱ?', t:'num'},
      {id:'w_inq_1hr', en:'How many of them were answered within 1 hour?', am:'ከእነርሱ ስንቱ በ1 ሰዓት ውስጥ ምላሽ አገኙ?', t:'num'},
      {id:'w_mkt_leads', en:'How many qualified leads came from marketing this week?', am:'በዚህ ሳምንት ከማርኬቲንግ ስንት ብቁ ደንበኞች መጡ?', t:'num',
        tgt:{op:'gte', v:15, en:'15 or more earns 1,000 Birr', am:'15 እና ከዚያ በላይ 1,000 ብር ያስገኛል'}},
      {id:'w_mkt_leads_plan', en:'What will change next week to bring in more leads?', am:'ተጨማሪ ደንበኞች እንዲመጡ በሚቀጥለው ሳምንት ምን ይቀየራል?', t:'area', opt:1, show:{f:'w_mkt_leads', when:'miss'}},
      {id:'w_mkt_contracts', en:'How many contracts came from marketing leads?', am:'ከማርኬቲንግ ደንበኞች ስንት ውል ተገኘ?', t:'num'}
    ]},
    { en:'6 · Customer satisfaction', am:'6 · የደንበኛ እርካታ', fields:[
      {id:'w_comp_in', en:'How many complaints came in this week?', am:'በዚህ ሳምንት ስንት ቅሬታዎች ደረሱ?', t:'num'},
      {id:'w_comp_list', en:'List each complaint', am:'እያንዳንዱን ቅሬታ ይዘርዝሩ', t:'table', addEn:'Add a complaint', addAm:'ቅሬታ ጨምር',
        show:{f:'w_comp_in', when:'pos'},
        cols:[
          {id:'cust', en:'Customer', am:'ደንበኛ', t:'text'},
          {id:'what', en:'Complaint', am:'ቅሬታው', t:'text'},
          {id:'owner', en:'Being fixed by', am:'የሚያስተካክለው', t:'text'},
          {id:'state', en:'Status', am:'ሁኔታ', t:'choice', opts:[
            {v:'resolved', en:'Resolved', am:'ተፈቷል'},
            {v:'open', en:'Still open', am:'ገና አልተፈታም'}]}
        ]},
      {id:'w_comp_done', en:'How many were resolved?', am:'ስንቱ ተፈቱ?', t:'num'},
      {id:'w_comp_open', en:'How many are still open?', am:'ስንቱ ገና አልተፈቱም?', t:'num',
        tgt:{op:'lte', v:0, en:'Zero valid complaints required for the team bonus',
             am:'ለቡድን ቦነስ ዜሮ ቅሬታ ያስፈልጋል'}},
      {id:'w_comp_open_plan', en:'What is still needed on each open complaint, and by when will it be closed?', am:'ለእያንዳንዱ ያልተፈታ ቅሬታ ምን ይቀራል? እስከ መቼ ይዘጋል?', t:'area', show:{f:'w_comp_open', when:'pos'}},
      {id:'w_sat', en:'What was the average satisfaction score this week, out of 5?', am:'የዚህ ሳምንት አማካይ የእርካታ ነጥብ ከ5 ስንት ነው?', t:'num'}
    ]},
    { en:'7 · Problems and solutions', am:'7 · ችግሮችና መፍትሔዎች', fields:[
      {id:'w_problem', en:'What was the biggest problem this week?', am:'የዚህ ሳምንት ትልቁ ችግር ምን ነበር?', t:'area', opt:1},
      {id:'w_cause', en:'What caused it?', am:'መንስኤው ምንድን ነው?', t:'area', show:{f:'w_problem', when:'any'}},
      {id:'w_action', en:'What was done about it, by whom, and by when will it be fixed?', am:'ምን እርምጃ ተወሰደ? በማን? እስከ መቼ ይስተካከላል?', t:'area', opt:1},
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
  id:'liu-weekly', person:'liu', cadence:'weekly', dueTime:'15:00', dueDay:5,
  en:'Weekly Production & Delivery Summary', am:'ሳምንታዊ የምርትና የማድረስ ሪፖርት',
  toEn:'Chairman', toAm:'ሊቀመንበር',
  dueEn:'Friday 3:00 PM', dueAm:'ዓርብ ከቀኑ 9፡00 (3:00 PM)',
  penEn:'Late –500 Birr', penAm:'ዘግይቶ –500 ብር',
  sections:[
    { en:'1 · Production performance', am:'1 · የምርት አፈጻጸም', fields:[
      {id:'p_total', en:'How many m² did the factory produce this week?', am:'ፋብሪካው በዚህ ሳምንት ስንት ካሬ ሜትር አመረተ?', t:'num',
        tgt:{op:'gte', v:240, en:'Weekly target 240 m²', am:'የሳምንቱ ዒላማ 240 ካሬ ሜትር'}},
      {id:'p_total_why', en:'The week is under 240 m². Which days fell short, why, and what changes next week?', am:'ሳምንቱ ከ240 ካሬ ሜትር በታች ነው። የትኞቹ ቀናት ጎደሉ? ለምን? በሚቀጥለው ሳምንት ምን ይቀየራል?', t:'area', show:{f:'p_total', when:'miss'}},
      {id:'p_avg', en:'What was the average production per working day, in m²?', am:'በአንድ የሥራ ቀን አማካይ ምርቱ ስንት ካሬ ሜትር ነበር?', t:'num',
        tgt:{op:'gte', v:40, en:'Daily target 40 m²', am:'የቀን ዒላማ 40 ካሬ ሜትር'}},
      {id:'p_waste', en:'What was this week\'s waste, as a % of material used?', am:'የዚህ ሳምንት ብክነት ከዋለው ዕቃ ስንት % ነው?', t:'pct',
        tgt:{op:'lte', v:20, en:'Must not exceed 20%', am:'ከ20% መብለጥ የለበትም'}},
      {id:'p_waste_why', en:'Waste is over 20%. Where did it come from, and what is being changed?', am:'ብክነቱ ከ20% በላይ ነው። ከየት መጣ? ምን እየተቀየረ ነው?', t:'area', show:{f:'p_waste', when:'miss'}},
      {id:'p_uptime', en:'What % of working hours did the machines run this week?', am:'በዚህ ሳምንት ማሽኖች ከሥራ ሰዓቱ ስንት % ሠሩ?', t:'pct',
        tgt:{op:'gte', v:95, en:'95%+ earns 400 Birr, below 90% is –300 Birr',
             am:'ከ95% በላይ 400 ብር፣ ከ90% በታች –300 ብር'}},
      {id:'p_uptime_list', en:'Which machines lost the most hours?', am:'ብዙ ሰዓት የቆሙት የትኞቹ ማሽኖች ናቸው?', t:'table', addEn:'Add a machine', addAm:'ማሽን ጨምር',
        show:{f:'p_uptime', when:'miss'},
        cols:[
          {id:'machine', en:'Machine', am:'ማሽን', t:'text'},
          {id:'hours', en:'Hours lost', am:'የባከነ ሰዓት', t:'num'},
          {id:'cause', en:'Cause', am:'ምክንያት', t:'text'},
          {id:'plan', en:'Maintenance planned', am:'የታቀደ ጥገና', t:'text'}
        ]}
    ]},
    { en:'2 · Quality control', am:'2 · የጥራት ቁጥጥር', fields:[
      {id:'q_checked', en:'How many jobs went through QC this week?', am:'በዚህ ሳምንት ስንት ሥራዎች በQC ተመረመሩ?', t:'num'},
      {id:'q_pass', en:'How many passed?', am:'ስንቱ አለፉ?', t:'num'},
      {id:'q_fail', en:'How many failed?', am:'ስንቱ አላለፉም?', t:'num'},
      {id:'q_fail_list', en:'Which jobs failed, and why?', am:'ያላለፉት የትኞቹ ሥራዎች ናቸው? ለምን?', t:'table', addEn:'Add a job', addAm:'ሥራ ጨምር',
        show:{f:'q_fail', when:'pos'},
        cols:[
          {id:'code', en:'Job code', am:'የሥራ ኮድ', t:'text'},
          {id:'why', en:'Why it failed', am:'ያላለፈበት ምክንያት', t:'text'},
          {id:'fixed', en:'Fixed and passed', am:'ተስተካክሎ አልፏል', t:'yesno'}
        ]},
      {id:'q_rate', en:'What was the QC pass rate this week?', am:'በዚህ ሳምንት የQC ማለፊያ መጠን ስንት ነበር?', t:'pct',
        tgt:{op:'gte', v:98, en:'Target ≥98% — below is –500 Birr/month',
             am:'ዒላማ ≥98% — በታች ከሆነ በወር –500 ብር'}},
      {id:'q_rate_why', en:'The pass rate is under 98%. What is the main cause, and what will change on the floor?', am:'የማለፊያ መጠኑ ከ98% በታች ነው። ዋናው መንስኤ ምንድን ነው? በምርት ክፍሉ ምን ይቀየራል?', t:'area', show:{f:'q_rate', when:'miss'}}
    ]},
    { en:'3 · Store & inventory', am:'3 · መጋዘንና ክምችት', fields:[
      {id:'s_accuracy', en:'How accurate was the stock count this week, in %?', am:'በዚህ ሳምንት የክምችት ቆጠራው ስንት % ትክክል ነበር?', t:'pct',
        tgt:{op:'gte', v:99, en:'Target ≥99%', am:'ዒላማ ≥99%'}},
      {id:'s_disc', en:'How many stock discrepancies were found?', am:'ስንት የክምችት ልዩነቶች ተገኙ?', t:'num'},
      {id:'s_disc_list', en:'Which items did not match?', am:'ያልተመሳከሩት የትኞቹ ዕቃዎች ናቸው?', t:'table', addEn:'Add an item', addAm:'ዕቃ ጨምር',
        show:{f:'s_disc', when:'pos'},
        cols:[
          {id:'item', en:'Item', am:'ዕቃ', t:'text'},
          {id:'rec', en:'Recorded', am:'በመዝገብ', t:'num'},
          {id:'cnt', en:'Counted', am:'የተቆጠረ', t:'num'},
          {id:'why', en:'Explanation', am:'ማብራሪያ', t:'text'}
        ]},
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
      {id:'d_complaints', en:'How many customer complaints came in this week?', am:'በዚህ ሳምንት ስንት የደንበኛ ቅሬታዎች ደረሱ?', t:'num'},
      {id:'d_complaints_list', en:'List each complaint', am:'ቅሬታዎቹን አንድ በአንድ ይዘርዝሩ', t:'table', addEn:'Add a complaint', addAm:'ቅሬታ ጨምር',
        show:{f:'d_complaints', when:'pos'},
        cols:[
          {id:'cust', en:'Customer', am:'ደንበኛ', t:'text'},
          {id:'what', en:'Complaint', am:'ቅሬታው', t:'text'},
          {id:'dept', en:'Caused by (department)', am:'ያስከተለው ክፍል', t:'text'},
          {id:'done', en:'Resolved', am:'ተፈቷል', t:'yesno'}
        ]},
      {id:'d_resolved', en:'How many of them are resolved?', am:'ከነዚህ ስንቱ ተፈቱ?', t:'num'}
    ]},
    { en:'6 · Job File handoff', am:'6 · የጆብ ፋይል ርክክብ', fields:[
      {id:'j_recv', en:'How many Job Files did you receive from Ephrata this week?', am:'በዚህ ሳምንት ከኤፍራታ ስንት ጆብ ፋይሎች ደረሱዎት?', t:'num'},
      {id:'j_acc', en:'How many did you accept?', am:'ስንቱን ተቀበሉ?', t:'num'},
      {id:'j_rej', en:'How many did you return as incomplete?', am:'ስንቱን ያልተሟሉ ስለሆኑ መለሱ?', t:'num'},
      {id:'j_reason', en:'What was missing from the returned files, and is the same thing going missing again?', am:'በተመለሱት ፋይሎች ምን ጎደለ? ያው ነገር በተደጋጋሚ እየጎደለ ነው?', t:'area', opt:1}
    ]},
    { en:'7 · WhatsApp compliance', am:'7 · የዋትስአፕ ተገዢነት', fields:[
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
      {id:'pl_sent', en:'Did the 15-day plan reach the Chairman by Friday 3:00 PM?', am:'የ15 ቀን ዕቅዱ እስከ ዓርብ 9፡00 ለሊቀመንበሩ ደርሷል?', t:'yesno'},
      {id:'pl_sent_why', en:'Why was it late, and when did it reach him?', am:'ለምን ዘገየ? መቼ ደረሳቸው?', t:'area', show:{f:'pl_sent', when:'no'}},
      {id:'pl_onsched', en:'How many planned jobs were finished on schedule? (on schedule / due this week)', am:'ከታቀዱት ሥራዎች ስንቱ በዕቅዱ ቀን ተጠናቀቁ? (በሰዓቱ / በዚህ ሳምንት የሚደርሱ)', t:'ratio'},
      {id:'pl_delayed', en:'How many jobs are behind the plan?', am:'ስንት ሥራዎች ከዕቅዱ ወደኋላ ቀርተዋል?', t:'num'},
      {id:'pl_delayed_list', en:'Which jobs are behind?', am:'ወደኋላ የቀሩት የትኞቹ ሥራዎች ናቸው?', t:'table', addEn:'Add a job', addAm:'ሥራ ጨምር',
        show:{f:'pl_delayed', when:'pos'},
        cols:[
          {id:'code', en:'Job code', am:'የሥራ ኮድ', t:'text'},
          {id:'days', en:'Days behind', am:'የዘገየበት ቀን', t:'num'},
          {id:'why', en:'Reason', am:'ምክንያት', t:'text'},
          {id:'new', en:'New date', am:'አዲሱ ቀን', t:'text'}
        ]},
      {id:'pl_reason', en:'What is the main reason for the delays?', am:'የመዘግየቱ ዋና ምክንያት ምንድን ነው?', t:'area', opt:1},
      {id:'pl_unpaid', en:"How many jobs went into the plan without Selam's written payment confirmation?",
        am:'ያለ ሰላም የጽሑፍ የክፍያ ማረጋገጫ ስንት ሥራዎች ወደ ዕቅዱ ገቡ?', t:'num',
        tgt:{op:'lte', v:0, en:'–5,000 Birr per job', am:'በሥራ –5,000 ብር'}},
      {id:'pl_unpaid_what', en:'Which jobs, who put them in, and have they been stopped?', am:'የትኞቹ ሥራዎች? ማን አስገባቸው? ቆመዋል?', t:'area', show:{f:'pl_unpaid', when:'pos'}}
    ]},
    { en:'9 · Problems and solutions', am:'9 · ችግሮችና መፍትሔዎች', fields:[
      {id:'w_problem', en:'What was the biggest problem this week, and what caused it?', am:'የዚህ ሳምንት ትልቁ ችግር ምን ነበር? መንስኤውስ?', t:'area', opt:1},
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
  id:'betty-weekly', person:'betty', cadence:'weekly', dueTime:'17:00', dueDay:5,
  en:'Weekly Finance Report', am:'ሳምንታዊ የፋይናንስ ሪፖርት',
  toEn:'Chairman + Kidan', toAm:'ሊቀመንበር + ኪዳን',
  dueEn:'Friday 5:00 PM', dueAm:'ዓርብ ከቀኑ 11፡00 (5:00 PM)',
  penEn:'Late –500 Birr · Wrong information –500 to –1,000 Birr',
  penAm:'ዘግይቶ –500 ብር · የተሳሳተ መረጃ –500 እስከ –1,000 ብር',
  derived:1,
  sections:[
    { en:'1 · Collections this week', am:'1 · የዚህ ሳምንት ገቢ', fields:[
      {id:'f_adv', en:'How much came in as advance payments this week?', am:'በዚህ ሳምንት ስንት ብር ቅድመ ክፍያ ገባ?', t:'money'},
      {id:'f_final', en:'How much came in as final payments this week?', am:'በዚህ ሳምንት ስንት ብር የመጨረሻ ክፍያ ገባ?', t:'money'},
      {id:'f_total', en:'How much was collected in total this week?', am:'በዚህ ሳምንት በጠቅላላ ስንት ብር ተሰበሰበ?', t:'money'},
      {id:'f_banked', en:'Was all cash banked the same day, every day this week?', am:'በዚህ ሳምንት በየዕለቱ ገንዘቡ ሁሉ በዕለቱ ባንክ ገብቷል?', t:'yesno'},
      {id:'f_banked_why', en:'On which days, how much stayed out overnight, and why?', am:'በየትኞቹ ቀናት? ስንት ብር ከባንክ ውጭ አደረ? ለምን?', t:'area', show:{f:'f_banked', when:'no'}}
    ]},
    { en:'2 · Cash position', am:'2 · የገንዘብ ሁኔታ', fields:[
      {id:'f_bank', en:'What is the bank balance at the end of the week?', am:'በሳምንቱ መጨረሻ የባንክ ቀሪ ስንት ነው?', t:'money',
        tgt:{op:'gte', v:6000000, en:'6 Million Birr Cash Reserve Rule', am:'የ6 ሚሊዮን ብር ክምችት ደንብ'}},
      {id:'f_bank_why', en:'The balance is below the 6,000,000 Birr reserve. Why, what was frozen, and when will it recover?', am:'ቀሪው ከ6,000,000 ብር ክምችት በታች ነው። ለምን? ምን ቆመ? መቼ ይመለሳል?', t:'area', show:{f:'f_bank', when:'miss'}},
      {id:'f_recon', en:'Was the full bank reconciliation done on Monday?', am:'ሙሉ የባንክ ማስታረቅ ሰኞ ተሠርቷል?', t:'yesno'},
      {id:'f_recon_why', en:'Why not, and when will it be done?', am:'ለምን አልተሠራም? መቼ ይሠራል?', t:'area', show:{f:'f_recon', when:'no'}},
      {id:'f_disc', en:'How many cash discrepancies were found this week?', am:'በዚህ ሳምንት ስንት የገንዘብ ልዩነቶች ተገኙ?', t:'num',
        tgt:{op:'lte', v:0, en:'–500 Birr each', am:'እያንዳንዱ –500 ብር'}},
      {id:'f_disc_list', en:'List each discrepancy', am:'እያንዳንዱን ልዩነት ይዘርዝሩ', t:'table', addEn:'Add a discrepancy', addAm:'ልዩነት ጨምር',
        show:{f:'f_disc', when:'pos'},
        cols:[
          {id:'day', en:'Day', am:'ቀን', t:'text'},
          {id:'amount', en:'Amount', am:'መጠን', t:'money'},
          {id:'where', en:'Where found', am:'የተገኘበት', t:'text'},
          {id:'who', en:'Who handled the money', am:'ገንዘቡን የያዘው', t:'text'},
          {id:'done', en:'What was done', am:'የተወሰደ እርምጃ', t:'text'}
        ]},
      {id:'f_shortfall', en:'Was every expected cash shortfall flagged in advance?', am:'የሚጠበቅ የገንዘብ እጥረት ሁሉ አስቀድሞ ተነግሯል?', t:'yesno', opt:1},
      {id:'f_shortfall_why', en:'Which shortfall was not flagged in time, and why?', am:'በጊዜ ያልተነገረው የትኛው እጥረት ነው? ለምን?', t:'area', show:{f:'f_shortfall', when:'no'}}
    ]},
    { en:'3 · ZamZam Bank reconciliation', am:'3 · የዘምዘም ባንክ ማስታረቅ', fields:[
      {id:'z_recon', en:'Was ZamZam Bank reconciled this Monday?', am:'የዘምዘም ባንክ በዚህ ሰኞ ታርቋል?', t:'yesno'},
      {id:'z_recon_why', en:'Why not, and when will it be done?', am:'ለምን አልታረቀም? መቼ ይታረቃል?', t:'area', show:{f:'z_recon', when:'no'}},
      {id:'z_transfers', en:'How many transfers were made to ZamZam this week?', am:'በዚህ ሳምንት ወደ ዘምዘም ስንት ዝውውሮች ተደረጉ?', t:'num'},
      {id:'z_value', en:'What was the total transferred?', am:'በጠቅላላ ስንት ብር ተላለፈ?', t:'money'},
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
      {id:'a_count', en:'How many payments were approved this week?', am:'በዚህ ሳምንት ስንት ክፍያዎች ጸደቁ?', t:'num'},
      {id:'a_value', en:'What was their total value?', am:'ጠቅላላ ዋጋቸው ስንት ነው?', t:'money'},
      {id:'a_kidan', en:'How many payments over 50,000 Birr went to Kidan?', am:'ከ50,000 ብር በላይ ስንት ክፍያዎች ለኪዳን ተላኩ?', t:'num'},
      {id:'a_unauth', en:'How many payments went out without proper approval?', am:'ስንት ክፍያዎች ያለ ተገቢ ፈቃድ ተፈጸሙ?', t:'num',
        tgt:{op:'lte', v:0, en:'–5,000 Birr each', am:'እያንዳንዱ –5,000 ብር'}},
      {id:'a_unauth_list', en:'List each one', am:'እያንዳንዱን ይዘርዝሩ', t:'table', addEn:'Add a payment', addAm:'ክፍያ ጨምር',
        show:{f:'a_unauth', when:'pos'},
        cols:[
          {id:'to', en:'Paid to', am:'ተከፋይ', t:'text'},
          {id:'amount', en:'Amount', am:'መጠን', t:'money'},
          {id:'by', en:'Who authorised it', am:'ያዘዘው', t:'text'},
          {id:'why', en:'Why', am:'ለምን', t:'text'}
        ]}
    ]},
    { en:'5 · Assembler payments', am:'5 · የገጣጣሚዎች ክፍያ', fields:[
      {id:'as_reserved', en:'How much was reserved for assemblers this week?', am:'በዚህ ሳምንት ለተከላ ሠራተኞች ስንት ብር ተያዘ?', t:'money'},
      {id:'as_released', en:'How many assembler payments were released?', am:'ስንት የገጣጣሚዎች ክፍያዎች ተለቀቁ?', t:'num'},
      {id:'as_late', en:'How many were released more than 3 working days after customer acceptance?', am:'ስንቱ ደንበኛው ከተቀበለ ከ3 የሥራ ቀናት በኋላ ተለቀቁ?', t:'num',
        tgt:{op:'lte', v:0, en:'–300 Birr per day late', am:'በዘገየ ቀን –300 ብር'}},
      {id:'as_late_list', en:'Which ones?', am:'የትኞቹ?', t:'table', addEn:'Add a payment', addAm:'ክፍያ ጨምር',
        show:{f:'as_late', when:'pos'},
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
      {id:'r_docs_missing', en:'How many documents are still missing?', am:'እስካሁን ስንት ሰነዶች ጎድለዋል?', t:'num'},
      {id:'r_docs_list', en:'Which documents, from whom, and since when?', am:'የትኞቹ ሰነዶች? ከማን? ከመቼ ጀምሮ?', t:'area', show:{f:'r_docs_missing', when:'pos'}},
      {id:'r_joblist', en:'Did the payment-confirmed job list reach Mahelet by Friday 1:00 PM?',
        am:'የክፍያ ማረጋገጫ ዝርዝሩ ዓርብ ከቀኑ 7፡00 በፊት ለማህሌት ደርሷል?', t:'yesno'},
      {id:'r_joblist_why', en:'Why not, and when did it go?', am:'ለምን አልደረሰም? መቼ ተላከ?', t:'area', show:{f:'r_joblist', when:'no'}},
      {id:'seble_err', en:'Did any work delegated to Seble need correcting this week?', am:'በዚህ ሳምንት ለሰብለ የተሰጠ ሥራ ማስተካከያ አስፈልጎታል?', t:'yesno'},
      {id:'seble_err_what', en:'What was wrong, how often, and what has been done so it does not happen again?', am:'ምን ተሳስቶ ነበር? ስንት ጊዜ? እንዳይደገም ምን ተደረገ?', t:'area', show:{f:'seble_err', when:'yes'}}
    ]},
    { en:'7 · Problems and solutions', am:'7 · ችግሮችና መፍትሔዎች', fields:[
      {id:'w_problem', en:'What was the biggest problem this week, and what caused it?', am:'የዚህ ሳምንት ትልቁ ችግር ምን ነበር? መንስኤውስ?', t:'area', opt:1},
      {id:'w_action', en:'What was done about it, by whom, and by when will it be fixed?', am:'ምን እርምጃ ተወሰደ? በማን? እስከ መቼ ይስተካከላል?', t:'area', opt:1},
      {id:'w_support', en:'What do you need from the Chairman or another department, and from whom?', am:'ከሊቀመንበሩ ወይም ከሌላ ክፍል ምን ያስፈልግዎታል? ከማን?', t:'area', opt:1},
      {id:'need_chair', en:'Do you need a decision from the Chairman?', am:'የሊቀመንበሩ ውሳኔ ያስፈልግዎታል?', t:'yesno'},
      {id:'need_chair_what', en:'What exactly should the Chairman decide, what are the options, and by when?', am:'ሊቀመንበሩ በትክክል ምን እንዲወስኑ ይፈልጋሉ? አማራጮቹ ምንድን ናቸው? እስከ መቼ?', t:'area', show:{f:'need_chair', when:'yes'}}
    ]},
    { en:'8 · Next week', am:'8 · የሚቀጥለው ሳምንት', fields:[
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
  penEn:'Late –500 Birr', penAm:'ዘግይቶ –500 ብር',
  derived:1,
  sections:[
    { en:'1 · Customer pulse last week', am:'1 · ያለፈው ሳምንት የደንበኛ ስሜት', fields:[
      {id:'cx_groups', en:'How many customer groups were watched last week?', am:'ባለፈው ሳምንት ስንት የደንበኛ ግሩፖች ተከታተሉ?', t:'num'},
      {id:'cx_contacted', en:'How many customers did you speak to directly?', am:'ስንት ደንበኞችን በቀጥታ አነጋገሩ?', t:'num'},
      {id:'cx_reports', en:'How many daily pulse reports went out on time? (on time / due)', am:'ስንቱ ዕለታዊ የደንበኛ ስሜት ሪፖርት በሰዓቱ ተላከ? (በሰዓቱ / የሚገባው)', t:'ratio',
        tgt:{op:'gte', v:5, en:'All 5 on time earns the 3,000 Birr bonus',
             am:'አምስቱም በሰዓቱ ከተላኩ 3,000 ብር ቦነስ'}},
      {id:'cx_reports_why', en:'Which days were late or missed, and why?', am:'የትኞቹ ቀናት ዘገዩ ወይም ቀሩ? ለምን?', t:'area', show:{f:'cx_reports', when:'short'}}
    ]},
    { en:'2 · Complaints', am:'2 · ቅሬታዎች', fields:[
      {id:'cx_new', en:'How many new complaints came in last week?', am:'ባለፈው ሳምንት ስንት አዲስ ቅሬታዎች መጡ?', t:'num'},
      {id:'cx_new_list', en:'List each new complaint', am:'እያንዳንዱን አዲስ ቅሬታ ይዘርዝሩ', t:'table', addEn:'Add complaint', addAm:'ቅሬታ ጨምር',
        show:{f:'cx_new', when:'pos'},
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
  id:'getachew-weekly', person:'getachew', cadence:'weekly', dueTime:'17:00', dueDay:5,
  en:'Weekly Purchasing Summary', am:'ሳምንታዊ የግዥ ሪፖርት',
  toEn:'Chairman, copied to Mahelet and Selam', toAm:'ሊቀመንበር፣ ግልባጭ ለማህሌትና ለሰላም',
  dueEn:'Friday 5:00 PM', dueAm:'ዓርብ ከቀኑ 11፡00 (5:00 PM)',
  penEn:'Late –500 Birr', penAm:'ዘግይቶ –500 ብር',
  derived:1,
  sections:[
    { en:'1 · Purchase requests', am:'1 · የግዥ ጥያቄዎች', fields:[
      {id:'g_prep', en:'How many purchase requests did you prepare this week?', am:'በዚህ ሳምንት ስንት የግዥ ጥያቄ አዘጋጁ?', t:'num'},
      {id:'g_app', en:'How many did Selam approve?', am:'ሰላም ስንቱን አጸደቀች?', t:'num'},
      {id:'g_ret', en:'How many were returned or rejected?', am:'ስንቱ ተመለሱ ወይም ውድቅ ሆኑ?', t:'num'},
      {id:'g_ret_why', en:'What were the reasons, and what will change so it stops happening?', am:'ምክንያቶቹ ምን ነበሩ? እንዳይደገም ምን ይቀየራል?', t:'area', show:{f:'g_ret', when:'pos'}},
      {id:'g_quotes', en:'How many requests carried 3 or more quotes? (with 3 quotes / all requests)', am:'ስንቱ ጥያቄ 3 እና ከዚያ በላይ ፕሮፎርማ ነበረው? (3 ፕሮፎርማ ያላቸው / ሁሉም ጥያቄዎች)', t:'ratio'},
      {id:'g_quotes_why', en:'Which requests had fewer than 3 quotes, and why?', am:'ከ3 ያነሰ ፕሮፎርማ የነበራቸው የትኞቹ ጥያቄዎች ናቸው? ለምን?', t:'area', show:{f:'g_quotes', when:'short'}},
      {id:'g_acc', en:'What was your purchase accuracy this week?', am:'በዚህ ሳምንት የግዥ ትክክለኛነትዎ ስንት በመቶ ነበር?', t:'pct',
        tgt:{op:'gte', v:95, en:'Target ≥95% — below is –500 Birr/month',
             am:'ዒላማ ≥95% — በታች ከሆነ በወር –500 ብር'}},
      {id:'g_acc_why', en:'Which purchases went wrong, how, and what will you do differently?', am:'የትኞቹ ግዥዎች ተሳሳቱ? እንዴት? ከዚህ በኋላ ምን በተለየ መንገድ ይሠራሉ?', t:'area', show:{f:'g_acc', when:'miss'}}
    ]},
    { en:'2 · ZamZam Bank cheques', am:'2 · የዘምዘም ባንክ ቼኮች', fields:[
      {id:'g_chq', en:'How many cheques did you issue this week?', am:'በዚህ ሳምንት ስንት ቼክ ሰጡ?', t:'num'},
      {id:'g_chq_val', en:'What is the total value of this week\'s cheques?', am:'የዚህ ሳምንት ቼኮች ጠቅላላ ዋጋ ስንት ነው?', t:'money'},
      {id:'g_chq_err', en:'How many cheque errors were there?', am:'ስንት የቼክ ስህተት ነበር?', t:'num',
        tgt:{op:'lte', v:0, en:'Zero errors earns the 1,000 Birr bonus',
             am:'ዜሮ ስህተት 1,000 ብር ቦነስ ያስገኛል'}},
      {id:'g_chq_err_what', en:'Which cheques, what was wrong, and how was it corrected?', am:'የትኞቹ ቼኮች? ምን ስህተት ነበር? እንዴት ተስተካከለ?', t:'area', show:{f:'g_chq_err', when:'pos'}},
      {id:'g_chq_secure', en:'Was the cheque book locked away every night?', am:'የቼክ ደብተሩ በየምሽቱ ተቆልፎበታል?', t:'yesno'},
      {id:'g_chq_secure_why', en:'Which nights not, and why?', am:'የትኞቹ ምሽቶች አልተቆለፈበትም? ለምን?', t:'area', show:{f:'g_chq_secure', when:'no'}}
    ]},
    { en:'3 · Suppliers and savings', am:'3 · አቅራቢዎችና ቁጠባ', fields:[
      {id:'g_sup', en:'How many suppliers did you buy from this week?', am:'በዚህ ሳምንት ከስንት አቅራቢዎች ገዙ?', t:'num'},
      {id:'g_delays', en:'How many supplier deliveries were late?', am:'ስንት የአቅራቢ ርክክቦች ዘገዩ?', t:'num'},
      {id:'g_delays_list', en:'Which suppliers were late, and what did it cost us?', am:'የዘገዩት የትኞቹ አቅራቢዎች ናቸው? ምን አሳጣን?', t:'table', addEn:'Add a supplier', addAm:'አቅራቢ ጨምር',
        show:{f:'g_delays', when:'pos'},
        cols:[
          {id:'sup', en:'Supplier', am:'አቅራቢ', t:'text'},
          {id:'times', en:'Times late', am:'የዘገየበት ብዛት', t:'num'},
          {id:'days', en:'Days late', am:'የዘገየበት ቀን', t:'num'},
          {id:'effect', en:'Effect on production', am:'በምርት ላይ ያደረሰው', t:'text'}
        ]},
      {id:'g_quality', en:'How many quality problems came from suppliers?', am:'ከአቅራቢዎች ስንት የጥራት ችግር መጣ?', t:'num'},
      {id:'g_quality_what', en:'Which suppliers, what went wrong, and should we keep buying from them?', am:'የትኞቹ አቅራቢዎች? ምን ችግር ነበር? ከእነሱ መግዛታችንን መቀጠል አለብን?', t:'area', show:{f:'g_quality', when:'pos'}},
      {id:'g_saving', en:'How much below the last price paid did you buy this week?', am:'በዚህ ሳምንት ከመጨረሻው የተከፈለ ዋጋ በታች በስንት ብር ገዙ?', t:'money', opt:1},
      {id:'g_saving_how', en:'On which purchases, and how was the saving made?', am:'በየትኞቹ ግዥዎች? ቁጠባው እንዴት ተገኘ?', t:'area', show:{f:'g_saving', when:'pos'}},
      {id:'g_best', en:'Which supplier served us best this week, and why?', am:'በዚህ ሳምንት በጣም ጥሩ ያገለገለን የትኛው አቅራቢ ነው? ለምን?', t:'area', opt:1}
    ]},
    { en:'4 · Documents to Selam', am:'4 · ለሰላም የተላኩ ሰነዶች', fields:[
      {id:'g_doc24', en:'How many documents reached Selam within 24 hours? (on time / all due)', am:'ስንት ሰነዶች በ24 ሰዓት ውስጥ ለሰላም ደረሱ? (በሰዓቱ / መድረስ የነበረባቸው)', t:'ratio'},
      {id:'g_doc_missing', en:'How many documents are still outstanding?', am:'እስካሁን ያልቀረቡ ሰነዶች ስንት ናቸው?', t:'num',
        tgt:{op:'lte', v:0, en:'–200 Birr per document', am:'በሰነድ –200 ብር'}},
      {id:'g_doc_missing_list', en:'Which documents, for which jobs, and when will each reach Selam?', am:'የትኞቹ ሰነዶች? ለየትኞቹ ሥራዎች? እያንዳንዱ መቼ ለሰላም ይደርሳል?', t:'table', addEn:'Add a document', addAm:'ሰነድ ጨምር',
        show:{f:'g_doc_missing', when:'pos'},
        cols:[
          {id:'code', en:'Job code', am:'የሥራ ኮድ', t:'text'},
          {id:'doc', en:'Document', am:'ሰነድ', t:'choice', opts:[
            {v:'invoice', en:'Supplier invoice', am:'የአቅራቢ ደረሰኝ (ኢንቮይስ)'},
            {v:'dnote', en:'Delivery note', am:'የርክክብ ማስታወሻ'},
            {v:'jobcard', en:'Job card reference', am:'የጆብ ካርድ ማጣቀሻ'},
            {v:'store', en:'Store confirmation', am:'የመጋዘን ማረጋገጫ'},
            {v:'warranty', en:'Warranty', am:'የዋስትና ሰነድ'}]},
          {id:'sup', en:'Supplier', am:'አቅራቢ', t:'text'},
          {id:'when', en:'Expected by', am:'የሚደርስበት ቀን', t:'text'}
        ]}
    ]},
    { en:'5 · Problems and solutions', am:'5 · ችግሮችና መፍትሔዎች', fields:[
      {id:'w_problem', en:'What was the biggest problem this week, and what caused it?', am:'የዚህ ሳምንት ትልቁ ችግር ምን ነበር? መንስኤውስ?', t:'area', opt:1},
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
  id:'yordanos-weekly', person:'yordanos', cadence:'weekly', dueTime:'17:00', dueDay:5,
  en:'Weekly Store Summary', am:'ሳምንታዊ የመጋዘን ሪፖርት',
  toEn:'Chairman, copied to Mahelet and Selam', toAm:'ሊቀመንበር፣ ግልባጭ ለማህሌትና ለሰላም',
  dueEn:'Friday 5:00 PM', dueAm:'ዓርብ ከቀኑ 11፡00 (5:00 PM)',
  penEn:'Reports are mandatory weekly', penAm:'ሳምንታዊ ሪፖርት ግዴታ ነው',
  derived:1,
  sections:[
    { en:'1 · Friday stock count', am:'1 · የዓርብ ቆጠራ', fields:[
      {id:'y_count', en:'Was the Friday physical stock count done?', am:'የዓርብ የዕቃ ቆጠራ ተከናውኗል?', t:'yesno'},
      {id:'y_count_why', en:'Why not, and when will it be done?', am:'ለምን? መቼ ይከናወናል?', t:'area', show:{f:'y_count', when:'no'}},
      {id:'y_accuracy', en:'What was stock accuracy at the count?', am:'በቆጠራው የክምችት ትክክለኛነት ስንት በመቶ ነበር?', t:'pct',
        tgt:{op:'gte', v:99, en:'Target ≥99% — 2,000 Birr KPI bonus',
             am:'ዒላማ ≥99% — 2,000 ብር ቦነስ'}},
      {id:'y_accuracy_why', en:'Below 99%: what caused the gaps, and what will change in how the store is run?', am:'ከ99% በታች ነው፦ ልዩነቱን ምን አመጣው? የመጋዘኑ አሠራር ምን ይቀየራል?', t:'area', show:{f:'y_accuracy', when:'miss'}},
      {id:'y_disc', en:'How many differences did the count find?', am:'ቆጠራው ስንት ልዩነት አገኘ?', t:'num',
        tgt:{op:'lte', v:0, en:'Zero earns the 1,000 Birr accuracy bonus',
             am:'ዜሮ ከሆነ 1,000 ብር ቦነስ'}},
      {id:'y_disc_list', en:'List each difference', am:'እያንዳንዱን ልዩነት ይዘርዝሩ', t:'table', addEn:'Add an item', addAm:'ዕቃ ጨምር',
        show:{f:'y_disc', when:'pos'},
        cols:[
          {id:'item', en:'Material', am:'ዕቃ', t:'text'},
          {id:'book', en:'On record', am:'በመዝገብ', t:'num'},
          {id:'count', en:'Counted', am:'የተቆጠረ', t:'num'},
          {id:'why', en:'Reason', am:'ምክንያት', t:'text'},
          {id:'told', en:'Reported the same day?', am:'በዚያው ቀን ተነግሯል?', t:'yesno'}
        ]},
      {id:'y_missing', en:'How many materials are missing?', am:'ስንት ዕቃዎች ጠፍተዋል?', t:'num',
        tgt:{op:'lte', v:0, en:'–1,000 Birr each', am:'እያንዳንዱ –1,000 ብር'}},
      {id:'y_missing_what', en:'What is missing, what is it worth, and who was told?', am:'ምን ጠፋ? ዋጋው ስንት ነው? ለማን ተነገረ?', t:'area', show:{f:'y_missing', when:'pos'}}
    ]},
    { en:'2 · Receiving this week', am:'2 · የዚህ ሳምንት ርክክብ', fields:[
      {id:'y_deliv', en:'How many deliveries came in this week?', am:'በዚህ ሳምንት ስንት ርክክብ ገባ?', t:'num'},
      {id:'y_accepted', en:'How many were accepted into the store?', am:'ስንቱ ወደ መጋዘን ገቡ?', t:'num'},
      {id:'y_rejected', en:'How many did you reject?', am:'ስንቱን ውድቅ አደረጉ?', t:'num'},
      {id:'y_rejected_what', en:'What was rejected, from which suppliers, and has it been replaced?', am:'ምን ውድቅ ተደረገ? ከየትኞቹ አቅራቢዎች? ተተክቷል?', t:'area', show:{f:'y_rejected', when:'pos'}},
      {id:'y_grn', en:'Was everything received against a Job File or BOM?', am:'ሁሉም ከጆብ ፋይል ወይም BOM ጋር ተመሳክሮ ተረክቧል?', t:'yesno'},
      {id:'y_grn_why', en:'What came in without one, and why?', am:'ያለ ጆብ ፋይል ወይም BOM የገባው ምንድን ነው? ለምን?', t:'area', show:{f:'y_grn', when:'no'}}
    ]},
    { en:'3 · Issuing', am:'3 · ዕቃ ማውጣት', fields:[
      {id:'y_issues', en:'How many times were materials issued this week?', am:'በዚህ ሳምንት ስንት ጊዜ ዕቃ ከመጋዘን ወጣ?', t:'num'},
      {id:'y_approved', en:'Did every issue carry Mahelet\'s signed approval?', am:'እያንዳንዱ ዕቃ በማህሌት ፊርማ ፈቃድ ወጥቷል?', t:'yesno'},
      {id:'y_approved_why', en:'What went out without it, for which job, and who allowed it?', am:'ያለፈቃድ የወጣው ምንድን ነው? ለየትኛው ሥራ? ማን ፈቀደ?', t:'area', show:{f:'y_approved', when:'no'}},
      {id:'y_correct', en:'Did everything go to the correct job?', am:'ሁሉም ለትክክለኛው ሥራ ወጥቷል?', t:'yesno'},
      {id:'y_correct_why', en:'What went to the wrong job, and has it been put right?', am:'ወደ ተሳሳተ ሥራ የሄደው ምንድን ነው? ተስተካክሏል?', t:'area', show:{f:'y_correct', when:'no'}}
    ]},
    { en:'4 · Shortages', am:'4 · እጥረቶች', fields:[
      {id:'y_short', en:'How many shortages did you flag this week?', am:'በዚህ ሳምንት ስንት እጥረት ጠቆሙ?', t:'num'},
      {id:'y_short_what', en:'Which materials, and did each arrive before it was needed?', am:'የትኞቹ ዕቃዎች? እያንዳንዱ ከመፈለጉ በፊት ደረሰ?', t:'area', show:{f:'y_short', when:'pos'}},
      {id:'y_stopped', en:'How many times did production stop because a shortage was not reported?',
        am:'ባልተነገረ እጥረት ምርት ስንት ጊዜ ቆመ?', t:'num',
        tgt:{op:'lte', v:0, en:'Zero earns the 500 Birr bonus', am:'ዜሮ ከሆነ 500 ብር ቦነስ'}},
      {id:'y_stopped_what', en:'Which jobs, for how long, and why was the shortage not reported in time?', am:'የትኞቹ ሥራዎች? ለምን ያህል ጊዜ? እጥረቱ በጊዜ ለምን አልተነገረም?', t:'area', show:{f:'y_stopped', when:'pos'}}
    ]},
    { en:'5 · Factory consumables', am:'5 · የፋብሪካ ፍጆታ ዕቃዎች', fields:[
      {id:'y_con_week', en:'How many consumable items were issued this week?', am:'በዚህ ሳምንት ስንት የፍጆታ ዕቃ ወጣ?', t:'num'},
      {id:'y_con_mtd', en:'How much has been spent on consumables this month so far?', am:'በዚህ ወር እስካሁን ለፍጆታ ዕቃ ስንት ብር ወጣ?', t:'money',
        tgt:{op:'lte', v:30000, en:'Budget 30,000 Birr/month — above needs Chairman approval',
             am:'የወር በጀት 30,000 ብር — በላይ ከሆነ የሊቀመንበር ፈቃድ'}},
      {id:'y_con_mtd_why', en:'The month is over 30,000 Birr. What drove it, and has the Chairman approved the extra?', am:'የወሩ ወጪ ከ30,000 ብር አልፏል። ምን አሳደገው? ተጨማሪውን ሊቀመንበሩ አጽድቀዋል?', t:'area', show:{f:'y_con_mtd', when:'miss'}}
    ]},
    { en:'6 · Store condition and problems', am:'6 · የመጋዘን ሁኔታና ችግሮች', fields:[
      {id:'y_secure', en:'Was the store locked and secure every night?', am:'መጋዘኑ በየምሽቱ ተቆልፎ ደህንነቱ ተጠብቆ ነበር?', t:'yesno'},
      {id:'y_secure_why', en:'Which nights not, and why?', am:'የትኞቹ ምሽቶች አልተቆለፈም? ለምን?', t:'area', show:{f:'y_secure', when:'no'}},
      {id:'y_theft', en:'Was anything stolen or taken out without permission this week?', am:'በዚህ ሳምንት የተሰረቀ ወይም ያለፈቃድ የወጣ ዕቃ አለ?', t:'yesno'},
      {id:'y_theft_what', en:'What, how much is it worth, who is involved, and were Mahelet and Selam told?', am:'ምን? ዋጋው ስንት ነው? ማን ተሳትፏል? ለማህሌትና ለሰላም ተነግሯል?', t:'area', show:{f:'y_theft', when:'yes'}},
      {id:'y_problem', en:'What was the biggest problem in the store this week, and what caused it?', am:'በመጋዘኑ የዚህ ሳምንት ትልቁ ችግር ምን ነበር? መንስኤውስ?', t:'area', opt:1},
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
  id:'ephrata-projection', person:'ephrata', cadence:'weekly', dueTime:'17:00', dueDay:5,
  en:'4-Week Rolling Sales Projection', am:'የ4 ሳምንት የሽያጭ ትንበያ',
  toEn:'Chairman + Kidan', toAm:'ሊቀመንበር + ኪዳን',
  dueEn:'Friday 5:00 PM', dueAm:'ዓርብ ከቀኑ 11፡00 (5:00 PM)',
  penEn:'First miss –500 Birr · Second in a row –1,000 Birr',
  penAm:'መጀመሪያ ሲቀር –500 ብር · በተከታታይ ሁለተኛ –1,000 ብር',
  sections:[
    { en:'1 · Expected contracts', am:'1 · የሚጠበቁ ውሎች', fields:[
      {id:'proj_contracts', en:'Which customers do you expect to sign in the next 4 weeks?', am:'በሚቀጥሉት 4 ሳምንታት የትኞቹ ደንበኞች ውል ይፈርማሉ ብለው ይጠብቃሉ?',
       t:'table', addEn:'Add customer', addAm:'ደንበኛ ጨምር', cols:[
        {id:'cust', en:'Customer name', am:'የደንበኛ ስም', t:'text'},
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
  id:'liu-plan', person:'liu', cadence:'weekly', dueTime:'15:00', dueDay:5,
  en:'15-Day Production Plan', am:'የ15 ቀን የምርት ዕቅድ',
  toEn:'Chairman + Kidan', toAm:'ሊቀመንበር + ኪዳን',
  dueEn:'Friday 3:00 PM', dueAm:'ዓርብ ከቀኑ 9፡00 (3:00 PM)',
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
      {id:'plan_list_late', en:'Did Selam\'s list reach you by Friday 1:00 PM?', am:'የሰላም ዝርዝር እስከ ዓርብ 7፡00 ደርሶዎታል?', t:'yesno'},
      {id:'plan_list_late_why', en:'When did it arrive, and what did the delay cost this plan?', am:'መቼ ደረሰ? መዘግየቱ በዚህ ዕቅድ ላይ ምን አስከተለ?', t:'area', show:{f:'plan_list_late', when:'no'}}
    ]},
    { en:'3 · Production queue', am:'3 · የምርት ተራ', fields:[
      {id:'plan_queue', en:'In what order will the jobs be produced?', am:'ሥራዎቹ በምን ቅደም ተከተል ይመረታሉ?',
       t:'table', addEn:'Add job to the queue', addAm:'ወደ ተራው ሥራ ጨምር', cols:[
        {id:'pri',  en:'Priority', am:'ቅድሚያ', t:'num'},
        {id:'code', en:'Job code', am:'የሥራ ኮድ', t:'text'},
        {id:'cust', en:'Customer', am:'ደንበኛ', t:'text'},
        {id:'m2',   en:'m²', am:'ካሬ ሜትር', t:'num'},
        {id:'start',en:'Planned start', am:'የሚጀመርበት', t:'text'},
        {id:'done', en:'Planned completion', am:'የሚጠናቀቅበት', t:'text'},
        {id:'qc',   en:'QC date', am:'የQC ቀን', t:'text'},
        {id:'del',  en:'Delivery date', am:'የማድረሻ ቀን', t:'text'}
      ]},
      {id:'plan_rove', en:'Does the plan include any Rovestone or other internal jobs?', am:'ዕቅዱ የሮቭስቶን ወይም ሌላ የውስጥ ሥራ ይዟል?', t:'yesno'},
      {id:'plan_rove_what', en:'Which ones, how many m², and has the Chairman approved each? (Internal work queues behind fully paid external jobs.)', am:'የትኞቹ? ስንት ካሬ ሜትር? እያንዳንዳቸውን ሊቀመንበሩ አጽድቀዋል? (የውስጥ ሥራ ሙሉ ከተከፈለባቸው የውጭ ሥራዎች በኋላ ነው።)', t:'area', show:{f:'plan_rove', when:'yes'}}
    ]},
    { en:'4 · Daily production target', am:'4 · የዕለት ተዕለት የምርት ዒላማ', fields:[
      {id:'plan_days', en:'How many m² are planned for each day, and on which jobs?', am:'በየቀኑ ስንት ካሬ ሜትር ታቅዷል? በየትኞቹ ሥራዎች?',
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
      {id:'plan_materials', en:'What materials does this plan need, and which are not yet in the store?', am:'ይህ ዕቅድ ምን ዕቃዎች ይፈልጋል? ከነሱ በመጋዘን ገና ያልገቡት የትኞቹ ናቸው?', t:'area'},
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
    { en:'3 · Balance and the reserve rule', am:'3 · ቀሪ ሂሳብና የክምችት ደንብ', fields:[
      {id:'cf_open', en:'What is the bank balance today?', am:'ዛሬ የባንክ ቀሪ ስንት ነው?', t:'money'},
      {id:'cf_low', en:'What is the lowest balance expected in the next 4 weeks?', am:'በሚቀጥሉት 4 ሳምንታት ዝቅተኛው የሚጠበቅ ቀሪ ስንት ነው?', t:'money',
        tgt:{op:'gte', v:6000000, en:'6 Million Birr Cash Reserve Rule',
             am:'የ6 ሚሊዮን ብር ክምችት ደንብ'}},
      {id:'cf_low_why', en:'It drops below the 6,000,000 Birr reserve. Why, and what will be done first — which payments wait, which collections are chased?', am:'ከ6,000,000 ብር ክምችት በታች ይወርዳል። ለምን? አስቀድሞ ምን ይደረጋል — የትኞቹ ክፍያዎች ይቆያሉ? የትኞቹ ገቢዎች ይከታተላሉ?', t:'area', show:{f:'cf_low', when:'miss'}},
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
  id:'betty-joblist', person:'betty', cadence:'weekly', dueTime:'13:00', dueDay:5,
  en:'Payment-Confirmed Job List', am:'ክፍያቸው የተረጋገጠ ሥራዎች ዝርዝር',
  toEn:'Mahelet', toAm:'ማህሌት',
  dueEn:'Friday 1:00 PM', dueAm:'ዓርብ ከቀኑ 7፡00 (1:00 PM)',
  penEn:'Not sent by Friday 1:00 PM –500 Birr',
  penAm:'ዓርብ ከቀኑ 7፡00 ካልተላከ –500 ብር',
  derived:1,
  sections:[
    { en:'1 · Jobs cleared for production', am:'1 · ወደ ምርት የሚገቡ ሥራዎች', fields:[
      {id:'jl_jobs', en:'Which jobs are paid in full and cleared for production?', am:'ሙሉ ክፍያ የተፈጸመባቸውና ወደ ምርት የሚገቡ ሥራዎች የትኞቹ ናቸው?',
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
      {id:'jl_held', en:'How many jobs are held back because payment is incomplete?',
       am:'ክፍያቸው ስላልተጠናቀቀ ስንት ሥራዎች ቀሩ?', t:'num'},
      {id:'jl_held_list', en:'Which jobs are held back?', am:'የቀሩት የትኞቹ ሥራዎች ናቸው?', t:'table', addEn:'Add job', addAm:'ሥራ ጨምር',
        show:{f:'jl_held', when:'pos'},
        cols:[
          {id:'code', en:'Job code', am:'የሥራ ኮድ', t:'text'},
          {id:'cust', en:'Customer', am:'ደንበኛ', t:'text'},
          {id:'owed', en:'Still owed', am:'ቀሪ ዕዳ', t:'money'},
          {id:'asked', en:'Final request sent on', am:'የመጨረሻ ክፍያ ጥያቄ የተላከበት ቀን', t:'text'},
          {id:'expect', en:'Payment expected on', am:'ክፍያው የሚጠበቅበት ቀን', t:'text'}
        ]},
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
             am:'የ6 ሚሊዮን ብር ክምችት ደንብ — ከዚህ በታች ከሆነ ማሳወቅ ግዴታ ነው'}},
      {id:'cf7_bank_why', en:'The balance is below the 6,000,000 Birr reserve. What is frozen today, and what brings it back?', am:'ቀሪው ከ6,000,000 ብር ክምችት በታች ነው። ዛሬ ምን ይቆማል? ምን ይመልሰዋል?', t:'area', show:{f:'cf7_bank', when:'miss'}},
      {id:'cf7_cash', en:'How much cash is on hand?', am:'በእጅ ስንት ጥሬ ገንዘብ አለ?', t:'money'},
      {id:'cf7_zamzam', en:'What is the ZamZam Bank balance?', am:'የዘምዘም ባንክ ቀሪ ስንት ነው?', t:'money'},
      {id:'cf7_reported', en:'If it is below 6M, has the Chairman already been told?',
       am:'ከ6ሚ በታች ከሆነ ለሊቀመንበሩ አስቀድሞ ተነግሯል?', t:'yesno', opt:1}
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
             am:'ከ6 ሚሊዮን ብር ክምችት በታች'}},
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
      {id:'cf7_due', en:'How many payments are due today?', am:'ዛሬ ስንት ክፍያዎች ይከፈላሉ?', t:'num'},
      {id:'cf7_due_list', en:'Which payments are due today?', am:'ዛሬ የሚከፈሉት የትኞቹ ክፍያዎች ናቸው?', t:'table', addEn:'Add a payment', addAm:'ክፍያ ጨምር',
        show:{f:'cf7_due', when:'pos'},
        cols:[
          {id:'to', en:'Paid to', am:'ተከፋይ', t:'text'},
          {id:'for', en:'For', am:'ለምን', t:'text'},
          {id:'amount', en:'Amount', am:'መጠን', t:'money'},
          {id:'ready', en:'Funds ready', am:'ገንዘቡ ዝግጁ ነው', t:'yesno'}
        ]},
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
      {id:'pl_unhappy', en:'How many sound unhappy?', am:'ስንቱ ያልረኩ ይመስላሉ?', t:'num'},
      {id:'pl_unhappy_who', en:'Who, and why?', am:'እነማን ናቸው? ለምን?', t:'table', addEn:'Add customer', addAm:'ደንበኛ ጨምር',
        show:{f:'pl_unhappy', when:'pos'},
        cols:[
          {id:'cust', en:'Customer', am:'ደንበኛ', t:'text'},
          {id:'job', en:'Job code', am:'የሥራ ኮድ', t:'text'},
          {id:'why', en:'Why', am:'ለምን', t:'text'},
          {id:'next', en:'Next step', am:'ቀጣይ እርምጃ', t:'text'}
        ]},
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
    { en:'1 · Production output', am:'1 · የዕለቱ ምርት', fields:[
      {id:'p_total', en:'How many m² did the factory produce today?', am:'ፋብሪካው ዛሬ ስንት ካሬ ሜትር አመረተ?', t:'num',
        parts:{of:['p_ext','p_rove']},
        tgt:{op:'gte', v:40, en:'Daily target 40 m² — below is –300 Birr/day from commission',
             am:'የቀኑ ዒላማ 40 ካሬ ሜትር — ከዚህ በታች ከኮሚሽን –300 ብር'}},
      {id:'p_total_why', en:'Production is under 40 m². What held it back, and how will it be recovered tomorrow?', am:'ምርቱ ከ40 ካሬ ሜትር በታች ነው። ምን አዘገየው? ነገ በምን ይካካሳል?', t:'area', show:{f:'p_total', when:'miss'}},
      {id:'p_ext', en:'For external customers', am:'ለውጭ ደንበኞች', t:'num', i:1},
      {id:'p_rove', en:'For Rovestone / internal', am:'ለሮቭስቶን / ለውስጥ', t:'num', i:1},
      {id:'p_rove_ok', en:'Which Rovestone or internal jobs were these, and is each one approved in the plan?', am:'እነዚህ የትኞቹ የሮቭስቶን ወይም የውስጥ ሥራዎች ናቸው? እያንዳንዳቸው በዕቅዱ ጸድቀዋል?', t:'area', show:{f:'p_rove', when:'pos'}},
      {id:'p_jobs', en:'Which jobs were worked on today?', am:'ዛሬ የተሠሩት የትኞቹ ሥራዎች ናቸው?',
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
      {id:'qc', en:'How did each checkpoint go today?', am:'ዛሬ እያንዳንዱ ፍተሻ እንዴት ሄደ?', t:'grid',
       rows:[{en:'After cutting', am:'ከመቁረጥ በኋላ'},
             {en:'After assembly', am:'ከመገጣጠም በኋላ'},
             {en:'Before delivery', am:'ከማድረስ በፊት'}],
       cols:[
        {id:'pass', en:'Passed', am:'ያለፉ', t:'num'},
        {id:'fail', en:'Failed', am:'ያላለፉ', t:'num'},
        {id:'sign', en:'Signed in Job File', am:'በሥራ ፋይል ተፈርሟል', t:'yesno'}
      ]},
      {id:'qc_defects', en:'How many defects were found today?', am:'ዛሬ ስንት ጉድለቶች ተገኙ?', t:'num',
        tgt:{op:'lte', v:0, en:'–500 Birr per defect released to finished goods',
             am:'ወደ ዝግጁ ዕቃ ማከማቻ ለገባ እያንዳንዱ ጉድለት –500 ብር'}},
      {id:'qc_defects_list', en:'List each defect', am:'ጉድለቶቹን አንድ በአንድ ይዘርዝሩ', t:'table', addEn:'Add a defect', addAm:'ጉድለት ጨምር',
        show:{f:'qc_defects', when:'pos'},
        cols:[
          {id:'code', en:'Job code', am:'የሥራ ኮድ', t:'text'},
          {id:'what', en:'Defect', am:'ጉድለቱ', t:'text'},
          {id:'stage', en:'Started at (stage)', am:'የጀመረበት ደረጃ', t:'text'},
          {id:'told', en:'Mahelet told at once', am:'ለማህሌት ወዲያው ተነግሯል', t:'yesno'},
          {id:'rel', en:'Reached finished goods', am:'ወደ ዝግጁ ዕቃ ገብቷል', t:'yesno'}
        ]},
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
      {id:'sav_rows', en:'Where did you use less material than the BOM today?', am:'ዛሬ ከBOM ያነሰ ቁሳቁስ የተጠቀሙት የት ነው?',
       t:'table', addEn:'Add material', addAm:'ቁሳቁስ ጨምር', cols:[
        {id:'mat',  en:'Material', am:'ቁሳቁስ', t:'text'},
        {id:'bom',  en:'BOM qty', am:'የBOM መጠን', t:'num'},
        {id:'used', en:'Actual used', am:'የዋለው መጠን', t:'num'},
        {id:'cost', en:'Unit cost', am:'የአንዱ ዋጋ', t:'money'},
        {id:'sav',  en:'Savings (Birr)', am:'ቁጠባ (ብር)', t:'money'}
      ]},
      {id:'sav_today', en:'How much was saved today, in Birr?', am:'ዛሬ ስንት ብር ተቆጠበ?', t:'money'},
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
        {id:'name', en:'Machine', am:'ማሽን', t:'text'},
        {id:'run',  en:'Running', am:'እየሠራ ነው', t:'yesno'},
        {id:'down', en:'Downtime (hrs)', am:'የቆመበት ሰዓት', t:'num'},
        {id:'cause',en:'Cause', am:'ምክንያት', t:'text'}
      ]},
      {id:'m_reported', en:'Was every breakdown reported to Mahelet within 30 minutes?', am:'እያንዳንዱ ብልሽት በ30 ደቂቃ ውስጥ ለማህሌት ተነግሯል?', t:'yesno'},
      {id:'m_reported_why', en:'Which breakdown, how late was it reported, and why? (–500 Birr)', am:'የትኛው ብልሽት? በምን ያህል ዘግይቶ ተነገረ? ለምን? (–500 ብር)', t:'area', show:{f:'m_reported', when:'no'}}
    ]},
    { en:'7 · Manpower', am:'7 · የሰው ኃይል', fields:[
      {id:'mp_assigned', en:'How many workers were assigned today?', am:'ዛሬ ስንት ሠራተኞች ተመደቡ?', t:'num'},
      {id:'mp_present', en:'How many came to work?', am:'ስንቱ ሥራ ገቡ?', t:'num'},
      {id:'mp_absent', en:'How many were absent?', am:'ስንቱ ቀሩ?', t:'num'},
      {id:'mp_absent_list', en:'Who was absent?', am:'የቀሩት እነማን ናቸው?', t:'table', addEn:'Add a worker', addAm:'ሰው ጨምር',
        show:{f:'mp_absent', when:'pos'},
        cols:[
          {id:'name', en:'Worker', am:'ሠራተኛ', t:'text'},
          {id:'why', en:'Reason', am:'ምክንያት', t:'text'},
          {id:'ok', en:'With permission', am:'በፈቃድ', t:'yesno'}
        ]},
      {id:'mp_late', en:'How many arrived after 8:00 AM?', am:'ስንቱ ከጠዋቱ 2፡00 (8:00 AM) በኋላ ገቡ?', t:'num',
        tgt:{op:'lte', v:0, en:'–100 Birr per worker per incident', am:'በእያንዳንዱ ሠራተኛ –100 ብር'}},
      {id:'mp_late_list', en:'Who was late?', am:'የዘገዩት እነማን ናቸው?', t:'table', addEn:'Add a worker', addAm:'ሰው ጨምር',
        show:{f:'mp_late', when:'pos'},
        cols:[
          {id:'name', en:'Worker', am:'ሠራተኛ', t:'text'},
          {id:'at', en:'Arrived at', am:'የገባበት ሰዓት', t:'text'},
          {id:'why', en:'Reason', am:'ምክንያት', t:'text'},
          {id:'valid', en:'Valid reason', am:'ተቀባይነት ያለው ምክንያት', t:'yesno'}
        ]},
      {id:'mp_behave', en:'How many behaviour issues were there today?', am:'ዛሬ ስንት የሥነ ምግባር ችግሮች ተከሰቱ?', t:'num',
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
    { en:'10 · Boards and yield', am:'10 · ሰሌዳዎችና ውጤታማነት', fields:[
      {id:'b_rows', en:'Which boards were cut today?', am:'ዛሬ የተቆረጡት የትኞቹ ሰሌዳዎች ናቸው?',
       t:'table', addEn:'Add board type', addAm:'የሰሌዳ ዓይነት ጨምር', cols:[
        {id:'btype', en:'Board', am:'ሰሌዳ', t:'choice', opts:[
          {v:'mdf', en:'MDF', am:'ኤምዲኤፍ'},
          {v:'mel', en:'Melamine', am:'ሜላሚን'},
          {v:'ply', en:'Plywood', am:'ፕላይውድ'},
          {v:'chip', en:'Chipboard', am:'ቺፕቦርድ'},
          {v:'hpl', en:'HPL / laminate', am:'ኤችፒኤል'}
        ]},
        {id:'bmm',    en:'Thickness (mm)', am:'ውፍረት (ሚሜ)', t:'num'},
        {id:'bcol',   en:'Colour / finish', am:'ቀለም', t:'text'},
        {id:'bsheet', en:'Sheets used', am:'የተጠቀሙት ሰሌዳ ብዛት', t:'num'},
        {id:'bpanel', en:'Panels cut', am:'የተቆረጡ ፓነሎች', t:'num'},
        {id:'boff',   en:'Offcut m² to store', am:'ወደ መጋዘን የተመለሰ ቁራጭ (ካሬ ሜትር)', t:'num'}
      ]},
      {id:'b_sheets', en:'How many sheets were used in total today?', am:'ዛሬ በድምሩ ስንት ሰሌዳ ዋለ?', t:'num'},
      {id:'b_yield', en:'How many m² came out of each sheet?', am:'ከአንድ ሰሌዳ ስንት ካሬ ሜትር ወጣ?', t:'num',
        tgt:{op:'gte', v:2.2, en:'Below 2.2 m² a sheet, the cutting plan is wasting board',
             am:'ከ2.2 ካሬ ሜትር በታች ከሆነ የመቁረጫ ዕቅዱ ሰሌዳ እያባከነ ነው'}},
      {id:'b_yield_why', en:'Which job or cutting plan wasted board, and why?', am:'ሰሌዳ ያባከነው የትኛው ሥራ ወይም የመቁረጫ ዕቅድ ነው? ለምን?', t:'area', show:{f:'b_yield', when:'miss'}},
      {id:'b_edge', en:'How many metres of edge banding were used?', am:'ስንት ሜትር ጠርዝ ማሰሪያ ዋለ?', t:'num'},
      {id:'b_redo', en:'How many edges had to be re-run because they lifted?', am:'ስንት ጠርዞች ተላቀው ዳግም ተሠሩ?', t:'num',
        tgt:{op:'lte', v:2, en:'More than 2 a day — check the machine or the glue',
             am:'በቀን ከ2 በላይ ከሆነ ማሽኑን ወይም ሙጫውን ይፈትሹ'}},
      {id:'b_redo_why', en:'What is making them lift — machine, glue, board or operator — and what was done?', am:'እንዲላቀቁ ያደረገው ምንድን ነው — ማሽን፣ ሙጫ፣ ሰሌዳ ወይስ ኦፕሬተር? ምን እርምጃ ተወሰደ?', t:'area', show:{f:'b_redo', when:'miss'}},
      {id:'b_short', en:'Did any cut stop for want of the right board?', am:'ተገቢው ሰሌዳ ጠፍቶ የቆመ ቁረጣ ነበር?', t:'yesno'},
      {id:'b_shortw', en:'If yes, which board?', am:'አዎ ከሆነ የትኛው ሰሌዳ?', t:'text', opt:1, i:1},
      {id:'b_short_what', en:'Which job was held up, for how long, and when will the board arrive?', am:'የትኛው ሥራ ቆመ? ለምን ያህል ጊዜ? ሰሌዳው መቼ ይደርሳል?', t:'area', show:{f:'b_short', when:'yes'}}
    ]},
    { en:'11 · Work in progress, by stage', am:'11 · በየደረጃው ያለ ሥራ', fields:[
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
    { en:'12 · Problems and solutions', am:'12 · ችግሮችና መፍትሔዎች', fields:[
      {id:'problem', en:'What was the biggest problem today?', am:'የዛሬው ትልቁ ችግር ምን ነበር?', t:'area', opt:1},
      {id:'cause', en:'What caused it?', am:'መንስኤው ምንድን ነው?', t:'area', opt:1},
      {id:'action', en:'What was done about it, by whom, and by when will it be fixed?', am:'ምን እርምጃ ተወሰደ? በማን? እስከ መቼ ይስተካከላል?', t:'area', opt:1},
      {id:'need_help', en:'What do you need from Mahelet, the store or purchasing, and by when?', am:'ከማህሌት፣ ከመጋዘን ወይም ከግዥ ምን ያስፈልግዎታል? እስከ መቼ?', t:'area', opt:1},
      {id:'need_lead', en:'Do you need a decision from Mahelet?', am:'የማህሌት ውሳኔ ያስፈልግዎታል?', t:'yesno'},
      {id:'need_lead_what', en:'What exactly needs deciding, what are the options, and by when?', am:'በትክክል ምን መወሰን አለበት? አማራጮቹ ምንድን ናቸው? እስከ መቼ?', t:'area', show:{f:'need_lead', when:'yes'}}
    ]},
    { en:"13 · Tomorrow's top 3", am:'13 · የነገ ሦስት ቅድሚያዎች', fields:[
      {id:'p1', en:'Priority 1', am:'1ኛ ሥራ', t:'text'},
      {id:'p2', en:'Priority 2', am:'2ኛ ሥራ', t:'text'},
      {id:'p3', en:'Priority 3', am:'3ኛ ሥራ', t:'text'}
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
      {id:'w_total', en:'How many m² did the factory produce this week?', am:'ፋብሪካው በዚህ ሳምንት ስንት ካሬ ሜትር አመረተ?', t:'num',
        parts:{of:['w_ext','w_rove']},
        tgt:{op:'gte', v:240, en:'Weekly target 240 m²', am:'የሳምንቱ ዒላማ 240 ካሬ ሜትር'}},
      {id:'w_total_why', en:'The week is under 240 m². Which days fell short, why, and what changes next week?', am:'ሳምንቱ ከ240 ካሬ ሜትር በታች ነው። የትኞቹ ቀናት ጎደሉ? ለምን? በሚቀጥለው ሳምንት ምን ይቀየራል?', t:'area', show:{f:'w_total', when:'miss'}},
      {id:'w_ext', en:'For external customers', am:'ለውጭ ደንበኞች', t:'num', i:1},
      {id:'w_rove', en:'For Rovestone', am:'ለሮቭስቶን', t:'num', i:1},
      {id:'w_avg', en:'What was the average production per working day, in m²?', am:'በአንድ የሥራ ቀን አማካይ ምርቱ ስንት ካሬ ሜትር ነበር?', t:'num',
        tgt:{op:'gte', v:40, en:'Daily target 40 m²', am:'የቀን ዒላማ 40 ካሬ ሜትር'}},
      {id:'w_best', en:'What was the best day\'s output, in m²?', am:'የተሻለው ቀን ምርት ስንት ካሬ ሜትር ነበር?', t:'num'},
      {id:'w_worst', en:'What was the worst day\'s output, in m²?', am:'ዝቅተኛው ቀን ምርት ስንት ካሬ ሜትር ነበር?', t:'num'}
    ]},
    { en:'2 · Quality control', am:'2 · የጥራት ቁጥጥር', fields:[
      {id:'q_checked', en:'How many jobs went through QC this week?', am:'በዚህ ሳምንት ስንት ሥራዎች በQC ተመረመሩ?', t:'num'},
      {id:'q_pass', en:'How many passed?', am:'ስንቱ አለፉ?', t:'num'},
      {id:'q_fail', en:'How many failed?', am:'ስንቱ አላለፉም?', t:'num'},
      {id:'q_fail_list', en:'Which jobs failed, and why?', am:'ያላለፉት የትኞቹ ሥራዎች ናቸው? ለምን?', t:'table', addEn:'Add a job', addAm:'ሥራ ጨምር',
        show:{f:'q_fail', when:'pos'},
        cols:[
          {id:'code', en:'Job code', am:'የሥራ ኮድ', t:'text'},
          {id:'why', en:'Why it failed', am:'ያላለፈበት ምክንያት', t:'text'},
          {id:'fixed', en:'Fixed and passed', am:'ተስተካክሎ አልፏል', t:'yesno'}
        ]},
      {id:'q_rate', en:'What was the QC pass rate this week?', am:'በዚህ ሳምንት የQC ማለፊያ መጠን ስንት ነበር?', t:'pct',
        tgt:{op:'gte', v:98, en:'≥98% earns the 5,000 Birr quality bonus', am:'≥98% የ5,000 ብር የጥራት ጉርሻ ያስገኛል'}},
      {id:'q_defects', en:'How many defects were found this week?', am:'በዚህ ሳምንት ስንት ጉድለቶች ተገኙ?', t:'num'},
      {id:'q_defects_what', en:'What were they, at which stage did they start, and did any reach finished goods?', am:'ጉድለቶቹ ምን ነበሩ? ከየትኛው ደረጃ ጀመሩ? ወደ ዝግጁ ዕቃ የገባ አለ?', t:'area', show:{f:'q_defects', when:'pos'}}
    ]},
    { en:'3 · Waste control', am:'3 · የብክነት ቁጥጥር', fields:[
      {id:'w_avgpct', en:'What was the average waste this week, in %?', am:'በዚህ ሳምንት አማካይ ብክነቱ ስንት % ነበር?', t:'pct',
        tgt:{op:'lte', v:20, en:'Must not exceed 20%', am:'ከ20% መብለጥ የለበትም'}},
      {id:'w_days', en:'On how many days was waste above 20%?', am:'ብክነቱ ከ20% በላይ የሆነው በስንት ቀናት ነው?', t:'num',
        tgt:{op:'lte', v:0, en:'Should be 0', am:'0 መሆን አለበት'}},
      {id:'w_days_why', en:'Which days, on which jobs, and why?', am:'የትኞቹ ቀናት? በየትኞቹ ሥራዎች? ለምን?', t:'area', show:{f:'w_days', when:'pos'}},
      {id:'w_cost', en:'What did the waste cost this week, in Birr?', am:'ብክነቱ በዚህ ሳምንት ስንት ብር አስወጣ?', t:'money'}
    ]},
    { en:'4 · Material savings', am:'4 · የቁሳቁስ ቁጠባ', fields:[
      {id:'s_bom', en:'What was the total BOM quantity for this week\'s jobs?', am:'የዚህ ሳምንት ሥራዎች ጠቅላላ የBOM መጠን ስንት ነበር?', t:'num'},
      {id:'s_used', en:'How much was actually used?', am:'በትክክል የዋለው ስንት ነው?', t:'num'},
      {id:'s_total', en:'How much was saved this week, in Birr?', am:'በዚህ ሳምንት ስንት ብር ተቆጠበ?', t:'money'},
      {id:'s_how', en:'Where did the savings come from, and has QC confirmed no quality was lost?', am:'ቁጠባው ከየት መጣ? ጥራት እንዳልቀነሰ QC አረጋግጧል?', t:'area', show:{f:'s_total', when:'pos'}},
      {id:'s_pct', en:'What % of the BOM was saved?', am:'ከBOM ስንት % ተቆጠበ?', t:'pct'}
    ]},
    { en:'5 · Waste sorting', am:'5 · የተረፈ ቁሳቁስ አያያዝ', fields:[
      {id:'ws_stored', en:'How many m² of reusable offcuts went to store this week?', am:'በዚህ ሳምንት ስንት ካሬ ሜትር እንደገና የሚያገለግሉ ቁርጥራጮች ወደ መጋዘን ገቡ?', t:'num'},
      {id:'ws_scrap', en:'How much scrap was recorded this week?', am:'በዚህ ሳምንት ምን ያህል የተረፈ ቁሳቁስ ተመዘገበ?', t:'num'},
      {id:'ws_viol', en:'How many waste-handling violations were there?', am:'ስንት የቁሳቁስ አያያዝ ጥሰቶች ተፈጸሙ?', t:'num',
        tgt:{op:'lte', v:0, en:'–300 to –500 Birr each', am:'እያንዳንዱ ከ–300 እስከ –500 ብር'}},
      {id:'ws_viol_what', en:'What were they, and who was responsible?', am:'ጥሰቶቹ ምን ነበሩ? ኃላፊው ማን ነበር?', t:'area', show:{f:'ws_viol', when:'pos'}}
    ]},
    { en:'6 · Machine performance', am:'6 · የማሽን አፈጻጸም', fields:[
      {id:'m_uptime', en:'What % of working hours did the machines run this week?', am:'በዚህ ሳምንት ማሽኖች ከሥራ ሰዓቱ ስንት % ሠሩ?', t:'pct',
        tgt:{op:'gte', v:95, en:'≥95% earns the 2,000 Birr uptime bonus', am:'≥95% የ2,000 ብር ጉርሻ ያስገኛል'}},
      {id:'m_break', en:'How many breakdowns were there this week?', am:'በዚህ ሳምንት ስንት ብልሽቶች ተከሰቱ?', t:'num'},
      {id:'m_break_list', en:'List each breakdown', am:'ብልሽቶቹን አንድ በአንድ ይዘርዝሩ', t:'table', addEn:'Add a breakdown', addAm:'ብልሽት ጨምር',
        show:{f:'m_break', when:'pos'},
        cols:[
          {id:'machine', en:'Machine', am:'ማሽን', t:'text'},
          {id:'hours', en:'Hours down', am:'የቆመበት ሰዓት', t:'num'},
          {id:'cause', en:'Cause', am:'ምክንያት', t:'text'},
          {id:'told', en:'Reported within 30 min', am:'በ30 ደቂቃ ተነግሯል', t:'yesno'}
        ]},
      {id:'m_down', en:'How many hours were lost to downtime in total?', am:'በድምሩ ስንት ሰዓት በብልሽት ጠፋ?', t:'num'}
    ]},
    { en:'7 · Manpower', am:'7 · የሰው ኃይል', fields:[
      {id:'a_rate', en:'What was the average attendance this week, in %?', am:'በዚህ ሳምንት አማካይ የተገኝነት መጠን ስንት % ነበር?', t:'pct',
        tgt:{op:'gte', v:95, en:'≥95% earns 2,000 + 3,000 Birr in bonuses', am:'≥95% የ2,000 + 3,000 ብር ጉርሻ ያስገኛል'}},
      {id:'a_late', en:'How many workers were late more than once?', am:'ስንት ሠራተኞች ከአንድ ጊዜ በላይ ዘገዩ?', t:'num'},
      {id:'a_late_who', en:'Who, how many times, and what was done?', am:'እነማን ናቸው? ስንት ጊዜ? ምን እርምጃ ተወሰደ?', t:'area', show:{f:'a_late', when:'pos'}},
      {id:'a_absent', en:'How many workers were absent more than once?', am:'ስንት ሠራተኞች ከአንድ ጊዜ በላይ ቀሩ?', t:'num'},
      {id:'a_absent_who', en:'Who, how many days, and was it reported to Mahelet?', am:'እነማን ናቸው? ስንት ቀን? ለማህሌት ተነግሯል?', t:'area', show:{f:'a_absent', when:'pos'}},
      {id:'a_behave', en:'How many behaviour incidents were there this week?', am:'በዚህ ሳምንት ስንት የሥነ ምግባር ችግሮች ተከሰቱ?', t:'num',
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
      {id:'j_done', en:'How many jobs were completed this week?', am:'በዚህ ሳምንት ስንት ሥራዎች ተጠናቀቁ?', t:'num'},
      {id:'j_done_list', en:'Which jobs were completed?', am:'የተጠናቀቁት የትኞቹ ሥራዎች ናቸው?', t:'table', addEn:'Add a job', addAm:'ሥራ ጨምር',
        show:{f:'j_done', when:'pos'},
        cols:[
          {id:'code', en:'Job code', am:'የሥራ ኮድ', t:'text'},
          {id:'m2', en:'m²', am:'ካሬ ሜትር', t:'num'},
          {id:'rework', en:'Any rework', am:'ዳግም ሥራ ነበረው', t:'yesno'},
          {id:'qcfail', en:'Failed QC', am:'QC አላለፈም', t:'yesno'}
        ]},
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
      {id:'problem', en:'What was the biggest problem this week, and what caused it?', am:'የዚህ ሳምንት ትልቁ ችግር ምን ነበር? መንስኤውስ?', t:'area', opt:1},
      {id:'action', en:'What was done about it, by whom, and by when will it be fixed?', am:'ምን እርምጃ ተወሰደ? በማን? እስከ መቼ ይስተካከላል?', t:'area', opt:1},
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
        tgt:{op:'gte', v:50000, en:'Your share starts at 50,000 Birr', am:'ድርሻዎ የሚጀምረው ከ50,000 ብር ነው'}},
      {id:'my_share', en:'What is your share at the tier the savings reach (10% – 25%)?', am:'ቁጠባው በደረሰበት ደረጃ ድርሻዎ ስንት ነው (10% – 25%)?', t:'money'}
    ]},
    { en:'3 · Quality verification', am:'3 · የጥራት ማረጋገጫ', fields:[
      {id:'qc_rate', en:'What was the QC pass rate for the month?', am:'የወሩ የQC ማለፊያ መጠን ስንት ነበር?', t:'pct',
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
      {id:'m_viol', en:'What waste-sorting violations happened this month, and who was responsible?', am:'በዚህ ወር ምን የቁሳቁስ አያያዝ ጥሰቶች ተፈጸሙ? ኃላፊው ማን ነበር?', t:'area', opt:1}
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
      {id:'i_total', en:'How many jobs did you inspect today?', am:'ዛሬ ስንት ሥራ መረመሩ?', t:'num'},
      {id:'i_pass', en:'How many passed?', am:'ስንቱ አለፉ?', t:'num'},
      {id:'i_fail', en:'How many failed?', am:'ስንቱ አላለፉም?', t:'num'},
      {id:'i_rate', en:'What is today\'s pass rate?', am:'የዛሬው የማለፊያ መጠን ስንት በመቶ ነው?', t:'pct',
        tgt:{op:'gte', v:98, en:'≥98% earns the 2,000 Birr KPI bonus', am:'≥98% የ2,000 ብር KPI ጉርሻ ያስገኛል'}},
      {id:'i_jobs', en:'List each job inspected today', am:'ዛሬ የተመረመሩትን ሥራዎች አንድ በአንድ ይዘርዝሩ',
       t:'table', addEn:'Add job', addAm:'ሥራ ጨምር', cols:[
        {id:'code', en:'Job code', am:'የሥራ ኮድ', t:'text'},
        {id:'cust', en:'Customer', am:'ደንበኛ', t:'text'},
        {id:'m2',   en:'m²', am:'ካሬ ሜትር', t:'num'},
        {id:'pass', en:'Passed', am:'አልፏል', t:'yesno'},
        {id:'why',  en:'Reason for failure', am:'ያላለፈበት ምክንያት', t:'text'}
      ]},
      {id:'i_all', en:'Did you personally inspect, in full, every job released today?', am:'ዛሬ የተለቀቀውን እያንዳንዱን ሥራ ራስዎ ሙሉ በሙሉ መረመሩ?', t:'yesno'},
      {id:'i_all_why', en:'Which jobs went out without a full inspection, who released them, and why?', am:'ሙሉ ፍተሻ ሳይደረግላቸው የወጡት የትኞቹ ሥራዎች ናቸው? ማን ለቀቃቸው? ለምን?', t:'area', show:{f:'i_all', when:'no'}}
    ]},
    { en:'2 · Defects found', am:'2 · የተገኙ ጉድለቶች', fields:[
      {id:'d_total', en:'How many defects did you find today?', am:'ዛሬ ስንት ጉድለት አገኙ?', t:'num'},
      {id:'d_released', en:'How many defective items got into finished goods anyway?', am:'ጉድለት እያለባቸው ወደ ዝግጁ ዕቃ ማከማቻ የገቡ ስንት ናቸው?', t:'num',
        tgt:{op:'lte', v:0, en:'–500 Birr each, and the 1,500 Birr bonus is lost',
             am:'እያንዳንዱ –500 ብር፣ የ1,500 ብር ጉርሻም ይጠፋል'}},
      {id:'d_released_what', en:'Which jobs, what defect, how did it get past QC, and has it been pulled back?', am:'የትኞቹ ሥራዎች? ምን ጉድለት? ከጥራት ቁጥጥር እንዴት አለፈ? ተመልሷል?', t:'area', show:{f:'d_released', when:'pos'}},
      {id:'d_rows', en:'List each defect found today', am:'ዛሬ የተገኙትን ጉድለቶች አንድ በአንድ ይዘርዝሩ',
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
      {id:'r_required', en:'How many jobs needed rework today?', am:'ዛሬ ስንት ሥራዎች ዳግም ሥራ አስፈለጋቸው?', t:'num'},
      {id:'r_done', en:'How many reworks were finished?', am:'ስንት ዳግም ሥራዎች ተጠናቀቁ?', t:'num'},
      {id:'r_reinspected', en:'How many did you re-inspect after rework?', am:'ከዳግም ሥራ በኋላ ስንቱን እንደገና መረመሩ?', t:'num'},
      {id:'r_rate', en:'What is today\'s rework rate?', am:'የዛሬው የዳግም ሥራ መጠን ስንት በመቶ ነው?', t:'pct',
        tgt:{op:'lte', v:2, en:'Below 2% earns 1,000 Birr; above 5% is –500 Birr',
             am:'ከ2% በታች 1,000 ብር፤ ከ5% በላይ –500 ብር'}},
      {id:'r_rate_why', en:'Rework is above 2%. Which jobs drove it, and what would stop it happening again?', am:'ዳግም ሥራው ከ2% በላይ ነው። ያሳደጉት የትኞቹ ሥራዎች ናቸው? እንዳይደገም ምን መደረግ አለበት?', t:'area', show:{f:'r_rate', when:'miss'}},
      {id:'r_register', en:'Is the Rework Register up to date?', am:'የዳግም ሥራ መዝገቡ ተሟልቷል?', t:'yesno'},
      {id:'r_register_why', en:'What is missing from it, and when will it be complete?', am:'ምን ጎድሎታል? መቼ ይሟላል?', t:'area', show:{f:'r_register', when:'no'}}
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
      {id:'problem', en:'What was the biggest quality problem today?', am:'የዛሬው ትልቁ የጥራት ችግር ምን ነበር?', t:'area', opt:1},
      {id:'cause', en:'What caused it?', am:'መንስኤው ምንድን ነው?', t:'area', opt:1},
      {id:'action', en:'What was done about it, by whom, and by when will it be fixed?', am:'ምን እርምጃ ተወሰደ? በማን? እስከ መቼ ይስተካከላል?', t:'area', opt:1},
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
  id:'wude-weekly', person:'wude', cadence:'weekly', dueTime:'17:00', dueDay:5,
  en:'Weekly QC Summary', am:'ሳምንታዊ የጥራት ቁጥጥር ማጠቃለያ',
  toEn:'Mahelet + Ephrata', toAm:'ማህሌት + ኤፍራታ',
  dueEn:'Friday 5:00 PM', dueAm:'ዓርብ ከቀኑ 11፡00 (5:00 PM)',
  penEn:'Late –500 Birr', penAm:'ዘግይቶ –500 ብር',
  sections:[
    { en:'1 · Inspection performance', am:'1 · የፍተሻ አፈጻጸም', fields:[
      {id:'w_inspected', en:'How many jobs did you inspect this week?', am:'በዚህ ሳምንት ስንት ሥራ መረመሩ?', t:'num'},
      {id:'w_pass', en:'How many passed?', am:'ስንቱ አለፉ?', t:'num'},
      {id:'w_fail', en:'How many failed?', am:'ስንቱ አላለፉም?', t:'num'},
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
    { en:'3 · Rework performance', am:'3 · የዳግም ሥራ አፈጻጸም', fields:[
      {id:'rw_req', en:'How many jobs needed rework this week?', am:'በዚህ ሳምንት ስንት ሥራዎች ዳግም ሥራ አስፈለጋቸው?', t:'num'},
      {id:'rw_done', en:'How many reworks were finished?', am:'ስንት ዳግም ሥራዎች ተጠናቀቁ?', t:'num'},
      {id:'rw_rate', en:'What was the rework rate this week?', am:'የዚህ ሳምንት የዳግም ሥራ መጠን ስንት በመቶ ነበር?', t:'pct',
        tgt:{op:'lte', v:2, en:'Below 2% earns 1,000 Birr; above 5% is –500 Birr',
             am:'ከ2% በታች 1,000 ብር፤ ከ5% በላይ –500 ብር'}},
      {id:'rw_rate_why', en:'Above 2%: which jobs drove it, and what is the plan to bring it down?', am:'ከ2% በላይ ነው፦ ያሳደጉት የትኞቹ ሥራዎች ናቸው? ለመቀነስ ዕቅዱ ምንድን ነው?', t:'area', show:{f:'rw_rate', when:'miss'}},
      {id:'rw_cost', en:'What did rework cost this week?', am:'በዚህ ሳምንት ዳግም ሥራ ስንት ብር አስወጣ?', t:'money'}
    ]},
    { en:'4 · Customer complaints', am:'4 · የደንበኛ ቅሬታዎች', fields:[
      {id:'c_recv', en:'How many customer complaints this week were about quality?', am:'በዚህ ሳምንት ስንት የደንበኛ ቅሬታዎች ከጥራት ጋር የተያያዙ ነበሩ?', t:'num',
        tgt:{op:'lte', v:0, en:'–1,000 Birr each, and the 1,000 Birr bonus is lost',
             am:'እያንዳንዱ –1,000 ብር፣ የ1,000 ብር ጉርሻም ይጠፋል'}},
      {id:'c_recv_list', en:'List each complaint', am:'እያንዳንዱን ቅሬታ ይዘርዝሩ', t:'table', addEn:'Add a complaint', addAm:'ቅሬታ ጨምር',
        show:{f:'c_recv', when:'pos'},
        cols:[
          {id:'cust', en:'Customer', am:'ደንበኛ', t:'text'},
          {id:'code', en:'Job code', am:'የሥራ ኮድ', t:'text'},
          {id:'what', en:'Complaint', am:'ቅሬታ', t:'text'},
          {id:'passed', en:'Passed by QC?', am:'በጥራት ቁጥጥር አልፎ ነበር?', t:'yesno'}
        ]},
      {id:'c_res', en:'How many were resolved?', am:'ስንቱ ተፈቱ?', t:'num'},
      {id:'c_out', en:'How many are still open?', am:'ስንቱ ገና አልተፈቱም?', t:'num'},
      {id:'c_out_what', en:'Which, what is holding each one up, and when will it be closed?', am:'የትኞቹ? እያንዳንዱን ምን ያዘው? መቼ ይዘጋል?', t:'area', show:{f:'c_out', when:'pos'}}
    ]},
    { en:'5 · Pressure to pass a defect — you are protected when you report it', am:'5 · ጉድለት እንዲያሳልፉ የሚደረግ ጫና — ካሳወቁ ይጠበቃሉ', fields:[
      {id:'pr_week', en:'Did anyone pressure you this week to pass a defective product?', am:'በዚህ ሳምንት ጉድለት ያለበትን ምርት እንዲያሳልፉ ማንም ጫና አድርጎብዎታል?', t:'yesno'},
      {id:'pr_det', en:'If yes: who, which job, and what happened?', am:'አዎ ከሆነ፦ ማን? የትኛው ሥራ? ምን ሆነ?', t:'area', opt:1},
      {id:'pr_rep', en:'Was it reported to Mahelet?', am:'ለማህሌት ተነግሯል?', t:'yesno', opt:1},
      {id:'pr_rep_why', en:'Why was it not reported? Reporting it is what protects you under your letter.', am:'ለምን አልተነገረም? ማሳወቅ በደብዳቤዎ መሠረት የሚጠብቅዎት ነው።', t:'area', show:{f:'pr_rep', when:'no'}}
    ]},
    { en:'6 · Problems and solutions', am:'6 · ችግሮችና መፍትሔዎች', fields:[
      {id:'problem', en:'What was the biggest quality problem this week, and what caused it?', am:'የዚህ ሳምንት ትልቁ የጥራት ችግር ምን ነበር? መንስኤውስ?', t:'area', opt:1},
      {id:'action', en:'What was done about it, by whom, and by when?', am:'ምን እርምጃ ተወሰደ? በማን? እስከ መቼ?', t:'area', opt:1},
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
      {id:'m_inspected', en:'How many jobs did you inspect this month?', am:'በዚህ ወር ስንት ሥራ መረመሩ?', t:'num'},
      {id:'m_rework', en:'How many needed rework?', am:'ስንቱ ዳግም ሥራ አስፈለጋቸው?', t:'num'},
      {id:'m_rate', en:'What was the rework rate for the month?', am:'የወሩ የዳግም ሥራ መጠን ስንት በመቶ ነበር?', t:'pct',
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
      {id:'j_total', en:'How many jobs did your team work on today?', am:'ዛሬ ቡድንዎ በስንት ሥራዎች ላይ ሠራ?', t:'num'},
      {id:'j_done', en:'How many of them were finished today?', am:'ከእነዚህ ስንቱ ዛሬ ተጠናቀቁ?', t:'num'},
      {id:'j_wip', en:'How many are still in progress?', am:'ስንቱ ገና በሂደት ላይ ናቸው?', t:'num'},
      {id:'j_wip_left', en:'Which jobs are still open, what is left on each, and on what day will each be finished?', am:'ያላለቁት የትኞቹ ሥራዎች ናቸው? በእያንዳንዱ ምን ቀረ? እያንዳንዱ በየትኛው ቀን ያልቃል?', t:'area', show:{f:'j_wip', when:'pos'}},
      {id:'j_m2', en:'How many m² were installed today?', am:'ዛሬ ስንት ካሬ ሜትር ተገጠመ?', t:'num'},
      {id:'j_rows', en:'List each job worked on today', am:'ዛሬ የተሠሩትን ሥራዎች አንድ በአንድ ይዘርዝሩ',
       t:'table', addEn:'Add job', addAm:'ሥራ ጨምር', cols:[
        {id:'code',  en:'Job code', am:'የሥራ ኮድ', t:'text'},
        {id:'cust',  en:'Customer', am:'ደንበኛ', t:'text'},
        {id:'start', en:'Start time', am:'የተጀመረበት ሰዓት', t:'text'},
        {id:'fin',   en:'Finish time', am:'የተጠናቀቀበት ሰዓት', t:'text'},
        {id:'ontime',en:'On time', am:'በሰዓቱ', t:'yesno'}
      ]},
      {id:'j_slips', en:'Did every job have its assembler Payment Confirmation Slip before work started?', am:'ሥራ ከመጀመሩ በፊት ለእያንዳንዱ ሥራ የገጣጣሚ ክፍያ ማረጋገጫ ወረቀት ነበረ?', t:'yesno'},
      {id:'j_slips_why', en:'Which jobs had no slip, and did work start without it?', am:'ማረጋገጫ ወረቀት ያልነበራቸው የትኞቹ ሥራዎች ናቸው? ወረቀቱ ሳይኖር ሥራ ተጀምሯል?', t:'area', show:{f:'j_slips', when:'no'}},
      {id:'mat_missing', en:'On arrival, was anything missing, wrong or damaged in the materials, tools or accessories?', am:'በደረሱበት ጊዜ ከቁሳቁሶች፣ ከመሣሪያዎች ወይም ከአክሰሰሪዎች የጎደለ፣ የተሳሳተ ወይም የተጎዳ ነገር ነበር?', t:'yesno'},
      {id:'mat_missing_what', en:'What, for which job, whose error was it, and how many hours did it cost?', am:'ምንድን ነው? ለየትኛው ሥራ? የማን ስህተት ነበር? ስንት ሰዓት አስጠፋ?', t:'area', show:{f:'mat_missing', when:'yes'}}
    ]},
    { en:'2 · Assembler performance', am:'2 · የገጣጣሚዎች አፈጻጸም', fields:[
      {id:'a_present', en:'How many assemblers were on site today?', am:'ዛሬ ስንት ገጣጣሚዎች በቦታው ተገኙ?', t:'num'},
      {id:'a_late', en:'How many assemblers arrived late?', am:'ስንት ገጣጣሚዎች ዘግይተው ደረሱ?', t:'num',
        tgt:{op:'lte', v:0, en:'Unreported lateness is –200 Birr', am:'ያልተነገረ መዘግየት –200 ብር'}},
      {id:'a_late_who', en:'Who was late?', am:'የዘገዩት እነማን ናቸው?', t:'table', addEn:'Add an assembler', addAm:'ገጣጣሚ ጨምር',
        show:{f:'a_late', when:'pos'},
        cols:[
          {id:'name', en:'Assembler', am:'ገጣጣሚ', t:'text'},
          {id:'mins', en:'Minutes late', am:'የዘገዩበት ደቂቃ', t:'num'},
          {id:'act', en:'Action taken', am:'የተወሰደ እርምጃ', t:'text'}
        ]},
      {id:'a_early', en:'How many assemblers left before the job was done?', am:'ሥራው ሳያልቅ ስንት ገጣጣሚዎች ቀድመው ወጡ?', t:'num',
        tgt:{op:'lte', v:0, en:'Unreported early leave is –200 Birr', am:'ያልተነገረ ቀድሞ መውጣት –200 ብር'}},
      {id:'a_early_who', en:'Who left, at what time, did you approve it, and what was left undone?', am:'ማን ወጣ? በስንት ሰዓት? እርስዎ ፈቅደዋል? ምን ሳይሠራ ቀረ?', t:'area', show:{f:'a_early', when:'pos'}},
      {id:'a_behave', en:'How many times did an assembler break the site rules (smoking, loud phone or music, rudeness, arguing)?', am:'ገጣጣሚዎች ስንት ጊዜ የቦታውን ደንብ ጣሱ? (ማጨስ፣ ጮክ ያለ ስልክ ወይም ሙዚቃ፣ ብልግና፣ ክርክር)', t:'num',
        tgt:{op:'lte', v:0, en:'Unreported bad behaviour is –500 Birr', am:'ያልተነገረ የሥነ ምግባር ችግር –500 ብር'}},
      {id:'a_behave_what', en:'Who, what happened, at which customer, and what action or penalty was applied?', am:'ማን ነው? ምን ተፈጠረ? በየትኛው ደንበኛ ቤት? ምን እርምጃ ወይም ቅጣት ተወሰደ?', t:'area', show:{f:'a_behave', when:'pos'}},
      {id:'a_reported', en:'Were all of these reported to Mahelet today?', am:'እነዚህ ሁሉ ዛሬ ለማህሌት ተነግረዋል?', t:'yesno'},
      {id:'a_reported_why', en:'What was not reported, and why?', am:'ያልተነገረው ምንድን ነው? ለምን?', t:'area', show:{f:'a_reported', when:'no'}}
    ]},
    { en:'3 · Customer acceptance', am:'3 · የደንበኛ ተቀባይነት', fields:[
      {id:'ac_signed', en:'How many customers signed the acceptance form today?', am:'ዛሬ ስንት ደንበኞች የተቀባይነት ፎርም ፈረሙ?', t:'num'},
      {id:'ac_complaints', en:'How many customer complaints came in today?', am:'ዛሬ ስንት የደንበኛ ቅሬታዎች ቀረቡ?', t:'num',
        tgt:{op:'lte', v:0, en:'A complaint costs the 3,000 + 2,000 Birr bonuses',
             am:'ቅሬታ የ3,000 + 2,000 ብር ጉርሻዎችን ያሳጣል'}},
      {id:'ac_complaints_what', en:'Which customer, what was the complaint, what was done, and is it closed?', am:'የየትኛው ደንበኛ ነው? ቅሬታው ምን ነበር? ምን እርምጃ ተወሰደ? ተዘግቷል?', t:'area', show:{f:'ac_complaints', when:'pos'}},
      {id:'ac_called', en:'How many customers were called 30 minutes before arrival? (called / sites visited)', am:'ከመድረስዎ 30 ደቂቃ በፊት ስንት ደንበኞች ተደወለላቸው? (የተደወለላቸው / የተጎበኙ ቦታዎች)', t:'ratio'},
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
      {id:'q_rework_what', en:'Which job, what had to be redone, what caused it (factory, design or site), and how many hours did it cost?', am:'የትኛው ሥራ ነው? ምን በድጋሚ ተሠራ? መንስኤው ምን ነበር (ፋብሪካ፣ ዲዛይን ወይስ ቦታ)? ስንት ሰዓት አስጠፋ?', t:'area', show:{f:'q_rework', when:'yes'}},
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
    { en:'6 · WhatsApp compliance', am:'6 · የዋትስአፕ ተገዢነት', fields:[
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
      {id:'problem', en:'What was the biggest problem today?', am:'የዛሬው ትልቁ ችግር ምን ነበር?', t:'area', opt:1},
      {id:'cause', en:'What caused it?', am:'መንስኤው ምንድን ነው?', t:'area', opt:1},
      {id:'action', en:'What was done about it, by whom, and by when will it be fixed?', am:'ምን እርምጃ ተወሰደ? በማን? እስከ መቼ ይስተካከላል?', t:'area', opt:1},
      {id:'need_lead', en:'Do you need a decision from Mahelet?', am:'የማህሌት ውሳኔ ያስፈልግዎታል?', t:'yesno'},
      {id:'need_lead_what', en:'What exactly should Mahelet decide, what are the options, and by when?', am:'ማህሌት በትክክል ምን እንዲወስኑ ይፈልጋሉ? አማራጮቹ ምንድን ናቸው? እስከ መቼ?', t:'area', show:{f:'need_lead', when:'yes'}}
    ]},
    { en:"9 · Tomorrow's plan", am:'9 · የነገ ዕቅድ', fields:[
      {id:'t_rows', en:'Which jobs are planned for tomorrow?', am:'ለነገ የታቀዱት ሥራዎች የትኞቹ ናቸው?',
       t:'table', addEn:'Add job', addAm:'ሥራ ጨምር', cols:[
        {id:'code', en:'Job code', am:'የሥራ ኮድ', t:'text'},
        {id:'site', en:'Site', am:'ቦታ', t:'text'},
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
  id:'elyas-weekly', person:'elyas', cadence:'weekly', dueTime:'17:00', dueDay:5,
  en:'Weekly Site Summary', am:'ሳምንታዊ የተከላ ማጠቃለያ',
  toEn:'Mahelet + Ephrata', toAm:'ማህሌት + ኤፍራታ',
  dueEn:'Friday 5:00 PM', dueAm:'ዓርብ ከቀኑ 11፡00 (5:00 PM)',
  penEn:'Late –500 Birr', penAm:'ዘግይቶ –500 ብር',
  sections:[
    { en:'1 · Installation performance', am:'1 · የተከላ አፈጻጸም', fields:[
      {id:'w_sched', en:'How many jobs were scheduled this week?', am:'በዚህ ሳምንት ስንት ሥራዎች ታቅደው ነበር?', t:'num'},
      {id:'w_done', en:'How many were completed?', am:'ስንቱ ተጠናቀቁ?', t:'num'},
      {id:'w_ontime', en:'How many were completed on time?', am:'ስንቱ በሰዓቱ ተጠናቀቁ?', t:'num',
        tgt:{op:'gte', v:3, en:'3 on time pays 400 Birr, 5 pays 600, 7+ pays 800',
             am:'3 በሰዓቱ 400 ብር፣ 5 ደግሞ 600፣ ከ7 በላይ 800 ብር'}},
      {id:'w_rate', en:'What was the on-time rate this week? (%)', am:'የዚህ ሳምንት በሰዓቱ የመጠናቀቅ መጠን ስንት ነው? (%)', t:'pct',
        tgt:{op:'gte', v:95, en:'≥95% earns the 3,000 Birr KPI bonus', am:'≥95% የ3,000 ብር KPI ጉርሻ ያስገኛል'}},
      {id:'w_delayed', en:'How many jobs were delayed?', am:'ስንት ሥራዎች ዘገዩ?', t:'num'},
      {id:'w_delayed_list', en:'Which jobs were delayed?', am:'የዘገዩት የትኞቹ ሥራዎች ናቸው?', t:'table', addEn:'Add a job', addAm:'ሥራ ጨምር',
        show:{f:'w_delayed', when:'pos'},
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
      {id:'w_why', en:'What was the main reason for the delays, and what will stop it next week?', am:'የመዘግየቱ ዋና ምክንያት ምን ነበር? በሚቀጥለው ሳምንት እንዳይደገም ምን ይደረጋል?', t:'area', opt:1}
    ]},
    { en:'2 · Assembler performance', am:'2 · የገጣጣሚዎች አፈጻጸም', fields:[
      {id:'as_total', en:'How many assemblers worked with you this week?', am:'በዚህ ሳምንት ስንት ገጣጣሚዎች አብረውዎት ሠሩ?', t:'num'},
      {id:'as_att', en:'What was their average attendance? (%)', am:'አማካይ የተገኝነት መጠናቸው ስንት ነበር? (%)', t:'pct'},
      {id:'as_late', en:'How many assemblers were late more than once?', am:'ስንት ገጣጣሚዎች ከአንድ ጊዜ በላይ ዘገዩ?', t:'num'},
      {id:'as_late_who', en:'Who, how many times, and what action was taken?', am:'እነማን ናቸው? ስንት ጊዜ? ምን እርምጃ ተወሰደ?', t:'area', show:{f:'as_late', when:'pos'}},
      {id:'as_behave', en:'How many assemblers had behaviour problems?', am:'ስንት ገጣጣሚዎች የሥነ ምግባር ችግር ነበረባቸው?', t:'num'},
      {id:'as_behave_what', en:'Who, what happened, and what action or penalty was applied?', am:'እነማን ናቸው? ምን ተፈጠረ? ምን እርምጃ ወይም ቅጣት ተወሰደ?', t:'area', show:{f:'as_behave', when:'pos'}},
      {id:'as_removal', en:'How many assemblers do you recommend removing?', am:'ስንት ገጣጣሚዎች እንዲነሱ ይጠቁማሉ?', t:'num'},
      {id:'as_removal_who', en:'Who, and what is on record for them in the Discipline Log?', am:'እነማን ናቸው? በዲሲፕሊን መዝገቡ ላይ ምን ተመዝግቦባቸዋል?', t:'area', show:{f:'as_removal', when:'pos'}},
      {id:'as_log', en:'Is the Assembler Discipline Log up to date and checked by Mahelet this week?', am:'የገጣጣሚ ዲሲፕሊን መዝገብ ወቅታዊ ነው? በዚህ ሳምንት በማህሌት ተረጋግጧል?', t:'yesno'},
      {id:'as_log_why', en:'What is missing from the log, and when will it be brought up to date?', am:'ከመዝገቡ ምን ጎደለ? መቼ ይሟላል?', t:'area', show:{f:'as_log', when:'no'}}
    ]},
    { en:'3 · Customer acceptance', am:'3 · የደንበኛ ተቀባይነት', fields:[
      {id:'cs_signed', en:'How many customers signed the acceptance form this week?', am:'በዚህ ሳምንት ስንት ደንበኞች የተቀባይነት ፎርም ፈረሙ?', t:'num'},
      {id:'cs_comp', en:'How many customers complained this week?', am:'በዚህ ሳምንት ስንት ደንበኞች ቅሬታ አቀረቡ?', t:'num',
        tgt:{op:'lte', v:0, en:'Zero is required for the 2,000 Birr satisfaction bonus',
             am:'ለ2,000 ብር የእርካታ ጉርሻ 0 መሆን አለበት'}},
      {id:'cs_comp_what', en:'Who complained, about what, and where does each complaint stand?', am:'ቅሬታ ያቀረቡት እነማን ናቸው? ስለምን? እያንዳንዱ ቅሬታ አሁን የት ደረሰ?', t:'area', show:{f:'cs_comp', when:'pos'}},
      {id:'cs_res', en:'How many complaints were resolved?', am:'ስንት ቅሬታዎች ተፈቱ?', t:'num'},
      {id:'cs_out', en:'How many complaints are still open?', am:'ስንት ቅሬታዎች ገና አልተፈቱም?', t:'num'},
      {id:'cs_out_what', en:'Which ones, what is blocking each, and by what day will it close?', am:'የትኞቹ ናቸው? እያንዳንዱን ምን ያዘው? በየትኛው ቀን ይዘጋል?', t:'area', show:{f:'cs_out', when:'pos'}}
    ]},
    { en:'4 · Quality at site', am:'4 · በቦታው ያለ ጥራት', fields:[
      {id:'qs_rework', en:'How many jobs needed rework at the site this week?', am:'በዚህ ሳምንት ስንት ሥራዎች በቦታው ዳግም ሥራ ጠየቁ?', t:'num',
        tgt:{op:'lte', v:0, en:'Zero rework earns the 2,000 Birr site quality bonus',
             am:'ዳግም ሥራ ከሌለ የ2,000 ብር የጥራት ጉርሻ ያስገኛል'}},
      {id:'qs_rework_what', en:'Which jobs, what was redone, and what caused it (factory, design or site)?', am:'የትኞቹ ሥራዎች ናቸው? ምን በድጋሚ ተሠራ? መንስኤው ምን ነበር (ፋብሪካ፣ ዲዛይን ወይስ ቦታ)?', t:'area', show:{f:'qs_rework', when:'pos'}},
      {id:'qs_fail', en:'How many installed jobs failed QC?', am:'የተገጠሙ ስንት ሥራዎች በQC አላለፉም?', t:'num'},
      {id:'qs_fail_what', en:'Which jobs, and what was found?', am:'የትኞቹ ሥራዎች ናቸው? ምን ችግር ተገኘ?', t:'area', show:{f:'qs_fail', when:'pos'}},
      {id:'qs_cost', en:'What did rework at the site cost this week? (Birr)', am:'በዚህ ሳምንት በቦታው የተደረገ ዳግም ሥራ ስንት ብር አስወጣ?', t:'money'}
    ]},
    { en:'5 · WhatsApp compliance', am:'5 · የዋትስአፕ ተገዢነት', fields:[
      {id:'wk_welcome', en:'How many Welcome Messages were posted? (posted / new groups)', am:'ስንት የአቀባበል መልዕክቶች ተላኩ? (የተላኩ / አዲስ ግሩፖች)', t:'ratio'},
      {id:'wk_started', en:'How many Installation Started messages were posted? (posted / jobs started)', am:'ስንት "ተከላ ተጀመረ" መልዕክቶች ተላኩ? (የተላኩ / የተጀመሩ ሥራዎች)', t:'ratio'},
      {id:'wk_progress', en:'How many Daily Progress Updates were posted? (posted / required)', am:'ስንት የዕለት ሪፖርቶች ተላኩ? (የተላኩ / የሚገባው)', t:'ratio'},
      {id:'wk_accept', en:'How many Customer Acceptance Requests were posted? (posted / jobs finished)', am:'ስንት የተቀባይነት ጥያቄዎች ተላኩ? (የተላኩ / የተጠናቀቁ ሥራዎች)', t:'ratio'},
      {id:'wk_rate', en:'What was the WhatsApp compliance rate this week? (%)', am:'የዚህ ሳምንት የዋትስአፕ ተገዢነት መጠን ስንት ነው? (%)', t:'pct',
        tgt:{op:'gte', v:100, en:'100% earns the 1,000 Birr WhatsApp bonus', am:'100% የ1,000 ብር ጉርሻ ያስገኛል'}},
      {id:'wk_rate_why', en:'Below 100%. Which messages were missed, on which jobs, and why?', am:'ከ100% በታች ነው። የትኞቹ መልዕክቶች ቀሩ? በየትኞቹ ሥራዎች? ለምን?', t:'area', show:{f:'wk_rate', when:'miss'}}
    ]},
    { en:'6 · Problems and solutions', am:'6 · ችግሮችና መፍትሔዎች', fields:[
      {id:'problem', en:'What was the biggest problem this week, and what caused it?', am:'የዚህ ሳምንት ትልቁ ችግር ምን ነበር? መንስኤውስ?', t:'area', opt:1},
      {id:'action', en:'What was done about it, by whom, and by when will it be fixed?', am:'ምን እርምጃ ተወሰደ? በማን? እስከ መቼ ይስተካከላል?', t:'area', opt:1},
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
      {id:'s_count', en:'How many sites did you support today?', am:'ዛሬ ስንት ቦታዎችን ደገፉ?', t:'num'},
      {id:'s_arrive', en:'What time did you arrive at the first site?', am:'መጀመሪያው ቦታ ስንት ሰዓት ደረሱ?', t:'text'},
      {id:'s_depart', en:'What time did you leave the last site?', am:'ከመጨረሻው ቦታ ስንት ሰዓት ወጡ?', t:'text'},
      {id:'s_late', en:'Were you late to any site today?', am:'ዛሬ ወደ የትኛውም ቦታ ዘግይተው ደረሱ?', t:'yesno'},
      {id:'s_late_why', en:'Which site, how late, and why? Was Elyas told?', am:'የትኛው ቦታ ነው? ምን ያህል ዘገዩ? ለምን? ለኤልያስ ተነግሯል?', t:'area', show:{f:'s_late', when:'yes'}},
      {id:'s_rows', en:'List each site you supported today', am:'ዛሬ የደገፉትን ቦታዎች ይዘርዝሩ',
       t:'table', addEn:'Add site', addAm:'ቦታ ጨምር', cols:[
        {id:'code', en:'Job code', am:'የሥራ ኮድ', t:'text'},
        {id:'cust', en:'Customer', am:'ደንበኛ', t:'text'},
        {id:'site', en:'Site', am:'ቦታ', t:'text'}
      ]},
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
      {id:'q_found', en:'How many defects did you find on finished work today (scratches, stains, chips)?', am:'ዛሬ በተጠናቀቀ ሥራ ላይ ስንት ጉድለቶች አገኙ? (ጭረት፣ እድፍ፣ ስብራት)', t:'num'},
      {id:'q_found_list', en:'Which defects?', am:'የትኞቹ ጉድለቶች?', t:'table', addEn:'Add a defect', addAm:'ጉድለት ጨምር',
        show:{f:'q_found', when:'pos'},
        cols:[
          {id:'code', en:'Job code', am:'የሥራ ኮድ', t:'text'},
          {id:'what', en:'Defect', am:'ጉድለት', t:'text'},
          {id:'where', en:'Where exactly', am:'በትክክል የት', t:'text'}
        ]},
      {id:'q_reported', en:'Did you report every defect to Elyas?', am:'ሁሉንም ጉድለቶች ለኤልያስ ነገሩ?', t:'yesno'},
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
      {id:'problem', en:'What was the biggest problem today?', am:'የዛሬው ትልቁ ችግር ምን ነበር?', t:'area', opt:1},
      {id:'action', en:'What was done about it, and by whom?', am:'ምን እርምጃ ተወሰደ? በማን?', t:'area', opt:1},
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

];

/* ---------------------------------------------------------------------------
   Two salespeople file the same two forms; five designers file the same two.
   Define each form once here and stamp a copy per person, so a fix to a field
   reaches all seven people instead of seven places.
   --------------------------------------------------------------------------- */

const SALES_DAILY = {
  id:'sales-daily', cadence:'daily', dueTime:'17:00',
  en:'Daily Sales Activity Report', am:'ዕለታዊ የሽያጭ እንቅስቃሴ ሪፖርት',
  toEn:'Ephrata', toAm:'ኤፍራታ',
  dueEn:'5:00 PM every working day — Ephrata needs it for her 5:30 PM report',
  dueAm:'በየሥራ ቀኑ ከቀኑ 11፡00 (5:00 PM)',
  penEn:'Late –200 Birr · Missing –500 Birr', penAm:'ዘግይቶ –200 ብር · ካልተላከ –500 ብር',
  sections:[
    { en:'1 · Leads today', am:'1 · የዛሬ አዲስ ደንበኞች', fields:[
      {id:'l_total', en:'How many new leads did you receive today?', am:'ዛሬ ስንት አዲስ ደንበኞች መጡ?', t:'num',
        parts:{of:['l_social','l_show','l_ref','l_agent','l_other'], all:1}},
      {id:'l_social', en:'From social media', am:'ከሶሻል ሚዲያ', t:'num', i:1},
      {id:'l_show', en:'Walked into the showroom', am:'ሾውሩም የመጡ', t:'num', i:1},
      {id:'l_ref', en:'Referred by someone', am:'በሪፈራል', t:'num', i:1},
      {id:'l_agent', en:'Through an agent', am:'በኤጀንት', t:'num', i:1},
      {id:'l_other', en:'Anywhere else', am:'ከሌላ ቦታ', t:'num', i:1},
      {id:'l_list', en:'List each new lead, as logged in the system', am:'አዲሶቹን ደንበኞች በሲስተሙ እንደተመዘገቡት ይዘርዝሩ', t:'table', addEn:'Add a lead', addAm:'ደንበኛ ጨምር',
        show:{f:'l_total', when:'pos'},
        cols:[
          {id:'cust', en:'Customer', am:'ደንበኛ', t:'text'},
          {id:'phone', en:'Phone', am:'ስልክ', t:'text'},
          {id:'next', en:'Next step', am:'ቀጣይ እርምጃ', t:'text'}
        ]}
    ]},
    { en:'2 · Lead response', am:'2 · የምላሽ ፍጥነት', fields:[
      {id:'r_1hr', en:'New leads today: how many did you call within 1 hour? (called within 1 hour / all new leads today)', am:'ዛሬ አዲስ የመጡ ደንበኞች፦ ስንቱን በ1 ሰዓት ውስጥ ደወሉላቸው? (በ1 ሰዓት ውስጥ የተደወለላቸው / ዛሬ የመጡ አዲስ ደንበኞች በሙሉ)', t:'ratio', whole:'l_total',
        tgt:{op:'gte', v:100, en:'Stage 1 of your commission — –200 Birr per missed lead',
             am:'የኮሚሽንዎ 1ኛ ደረጃ — ላመለጠ እያንዳንዱ –200 ብር'}},
      {id:'r_1hr_why', en:'Which leads were not called within the hour, and why?', am:'በ1 ሰዓት ውስጥ ያልተደወለላቸው እነማን ናቸው? ለምን?', t:'area', show:{f:'r_1hr', when:'short'}},
      {id:'r_show', en:'How many showroom visitors were served the same day? (served / all visitors)', am:'ሾውሩም ከመጡት ስንቱ በዕለቱ ተስተናገዱ? (የተስተናገዱ / ሁሉም)', t:'ratio'},
      {id:'r_show_why', en:'Who was not served the same day, and why?', am:'በዕለቱ ያልተስተናገደው ማን ነው? ለምን?', t:'area', show:{f:'r_show', when:'short'}}
    ]},
    { en:'3 · Pre-measurement', am:'3 · ቅድመ ልኬት', fields:[
      {id:'v_booked', en:'How many pre-measurement appointments did you make today?', am:'ዛሬ ስንት የቅድመ ልኬት ቀጠሮ ያዙ?', t:'num'},
      {id:'v_done', en:'How many pre-measurement visits were done today?', am:'ዛሬ ስንት የቅድመ ልኬት ጉብኝት ተካሄደ?', t:'num'},
      {id:'v_list', en:'List each pre-measurement visit done today', am:'ዛሬ የተደረጉትን የቅድመ ልኬት ጉብኝቶች አንድ በአንድ ይዘርዝሩ', t:'table', addEn:'Add a visit', addAm:'ጉብኝት ጨምር',
        show:{f:'v_done', when:'pos'},
        cols:[
          {id:'cust', en:'Customer', am:'ደንበኛ', t:'text'},
          {id:'designer', en:'Designer', am:'ዲዛይነር', t:'text'},
          {id:'next', en:'Next step', am:'ቀጣይ እርምጃ', t:'text'}
        ]},
      {id:'v_late', en:'How many new leads have waited more than 48 hours for a pre-measurement appointment?', am:'ከ48 ሰዓት በላይ የቅድመ ልኬት ቀጠሮ ሳይያዝላቸው የቆዩ አዲስ ደንበኞች ስንት ናቸው?', t:'num',
        tgt:{op:'lte', v:0, en:'–300 Birr each', am:'እያንዳንዱ –300 ብር'}},
      {id:'v_late_why', en:'Which customers, why the delay, and on what day will each be visited?', am:'የየትኞቹ ደንበኞች ናቸው? ለምን ዘገየ? እያንዳንዳቸው በየትኛው ቀን ይጎበኛሉ?', t:'area', show:{f:'v_late', when:'pos'}}
    ]},
    { en:'4 · Quotations', am:'4 · ፕሮፎርማ', fields:[
      {id:'q_issued', en:'How many quotations did you present today?', am:'ዛሬ ስንት ፕሮፎርማ ቀረበ?', t:'num'},
      {id:'q_list', en:'List each quotation presented today', am:'ዛሬ የቀረቡትን ፕሮፎርማዎች ይዘርዝሩ', t:'table', addEn:'Add a quotation', addAm:'ፕሮፎርማ ጨምር',
        show:{f:'q_issued', when:'pos'},
        cols:[
          {id:'cust', en:'Customer', am:'ደንበኛ', t:'text'},
          {id:'value', en:'Value', am:'ዋጋ', t:'money'},
          {id:'margin', en:'Margin per m²', am:'ትርፍ በካሬ ሜትር', t:'money'},
          {id:'disc', en:'Discount given', am:'የተሰጠ ቅናሽ', t:'text'}
        ]},
      {id:'q_margin', en:'What was the average margin per m² on today\'s quotations?', am:'የዛሬዎቹ ፕሮፎርማዎች አማካይ ትርፍ በካሬ ሜትር ስንት ነው?', t:'money',
        tgt:{op:'gte', v:6000, en:'Margin floor 6,000 Birr/m² — below without approval is –1,000 Birr',
             am:'ዝቅተኛው ትርፍ በካሬ ሜትር 6,000 ብር — ያለፈቃድ ከዚህ በታች –1,000 ብር'}},
      {id:'q_margin_why', en:'Which quotations went below 6,000 Birr/m², and who approved them?', am:'ከ6,000 ብር በካሬ ሜትር በታች የሆኑት የትኞቹ ፕሮፎርማዎች ናቸው? ማን አጸደቃቸው?', t:'area', show:{f:'q_margin', when:'miss'}},
      {id:'q_expiry', en:'Did every quotation state the 7-day expiry?', am:'ሁሉም ፕሮፎርማዎች የ7 ቀን ገደብ ተጽፎባቸዋል?', t:'yesno'},
      {id:'q_expiry_why', en:'Which ones did not, and have they been corrected?', am:'ያልተጻፈባቸው የትኞቹ ናቸው? ተስተካክለዋል?', t:'area', show:{f:'q_expiry', when:'no'}}
    ]},
    { en:'5 · Contracts', am:'5 · ውሎች', fields:[
      {id:'c_signed', en:'How many contracts did you sign today?', am:'ዛሬ ስንት ውል ተፈረመ?', t:'num'},
      {id:'c_list', en:'List each contract signed today', am:'ዛሬ የተፈረሙትን ውሎች ይዘርዝሩ', t:'table', addEn:'Add a contract', addAm:'ውል ጨምር',
        show:{f:'c_signed', when:'pos'},
        cols:[
          {id:'cust', en:'Customer', am:'ደንበኛ', t:'text'},
          {id:'code', en:'Job code', am:'የሥራ ኮድ', t:'text'},
          {id:'value', en:'Contract value', am:'የውል ዋጋ', t:'money'},
          {id:'adv', en:'Advance paid', am:'የተከፈለ ቅድመ ክፍያ', t:'money'}
        ]},
      {id:'c_value', en:'What is the total value of today\'s contracts?', am:'የዛሬዎቹ ውሎች ጠቅላላ ዋጋ ስንት ነው?', t:'money'},
      {id:'c_adv', en:'How much advance did you collect today?', am:'ዛሬ ስንት ቅድመ ክፍያ ተሰበሰበ?', t:'money'},
      {id:'c_told', en:'Was Selam told, so the deposit can be confirmed in the bank?', am:'ሰላም ገንዘቡን በባንክ እንድታረጋግጥ ተነግሯታል?', t:'yesno', show:{f:'c_adv', when:'pos'}},
      {id:'c_banked', en:'Did all of it go to the bank the same day?', am:'ሁሉም በዕለቱ ባንክ ገብቷል?', t:'yesno'},
      {id:'c_banked_why', en:'Why not, where is the money now, and when will it be banked?', am:'ለምን አልገባም? ገንዘቡ አሁን የት ነው? መቼ ባንክ ይገባል?', t:'area', show:{f:'c_banked', when:'no'}}
    ]},
    { en:'6 · Cash collection', am:'6 · የገንዘብ ስብሰባ', fields:[
      {id:'k_today', en:'How much did you collect from customers today?', am:'ዛሬ ከደንበኞች ስንት ብር ተሰበሰበ?', t:'money'},
      {id:'k_list', en:'From whom?', am:'ከማን ከማን?', t:'table', addEn:'Add a payment', addAm:'ክፍያ ጨምር',
        show:{f:'k_today', when:'pos'},
        cols:[
          {id:'cust', en:'Customer', am:'ደንበኛ', t:'text'},
          {id:'amount', en:'Amount', am:'መጠን', t:'money'},
          {id:'kind', en:'For', am:'የምን', t:'choice', opts:[
            {v:'advance', en:'Advance', am:'ቅድመ ክፍያ'},
            {v:'final', en:'Final payment', am:'የመጨረሻ ክፍያ'},
            {v:'other', en:'Other', am:'ሌላ'}]}
        ]},
      {id:'k_week', en:'How much have you collected this week so far, bank-confirmed?', am:'በዚህ ሳምንት እስካሁን በባንክ የተረጋገጠ ስንት ብር ተሰበሰበ?', t:'money',
        tgt:{op:'gte', v:2000000, en:'Your weekly target is 2,000,000 Birr collected',
             am:'የሳምንቱ ዒላማዎ 2,000,000 ብር የተሰበሰበ ገንዘብ ነው'}},
      {id:'k_week_gap', en:'Which customers will close the gap to 2,000,000 Birr before the week ends, and for how much?', am:'ሳምንቱ ከማለቁ በፊት እስከ 2,000,000 ብር ያለውን ክፍተት የሚሞሉት የትኞቹ ደንበኞች ናቸው? በስንት ብር?', t:'area', show:{f:'k_week', when:'miss'}}
    ]},
    { en:'7 · WhatsApp compliance', am:'7 · የዋትስአፕ ተገዢነት', fields:[
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
    { en:'8 · After-sales', am:'8 · ከሽያጭ በኋላ', fields:[
      {id:'fu_calls', en:'Of customers installed 48 hours ago, how many got their follow-up call? (called / due)', am:'ተከላቸው ከ48 ሰዓት በፊት ከተጠናቀቀ ደንበኞች ስንቱ የክትትል ጥሪ ተደረገላቸው? (የተደወለላቸው / መደወል የነበረባቸው)', t:'ratio'},
      {id:'fu_calls_why', en:'Who was not called, and when will they be?', am:'ያልተደወለላቸው እነማን ናቸው? መቼ ይደወልላቸዋል?', t:'area', show:{f:'fu_calls', when:'short'}},
      {id:'ref_logged', en:'How many referrals did you ask for and log today?', am:'ዛሬ ስንት ሪፈራል ተጠይቆ ተመዘገበ?', t:'num'}
    ]},
    { en:'9 · Problems and solutions', am:'9 · ችግሮችና መፍትሔዎች', fields:[
      {id:'problem', en:'What was the biggest problem today?', am:'የዛሬው ትልቁ ችግር ምን ነበር?', t:'area', opt:1},
      {id:'cause', en:'What caused it?', am:'መንስኤው ምንድን ነው?', t:'area', opt:1},
      {id:'action', en:'What was done about it, and by when will it be fixed?', am:'ምን እርምጃ ተወሰደ? እስከ መቼ ይስተካከላል?', t:'area', opt:1},
      {id:'need_help', en:'What do you need from design, production or Selam, and from whom?', am:'ከዲዛይን፣ ከምርት ወይም ከሰላም ምን ያስፈልግዎታል? ከማን?', t:'area', opt:1},
      {id:'need_lead', en:'Do you need a decision from Ephrata?', am:'የኤፍራታ ውሳኔ ያስፈልግዎታል?', t:'yesno'},
      {id:'need_lead_what', en:'What exactly should she decide (a discount beyond your window, a price change), and by when?', am:'በትክክል ምን እንዲወስኑ ይፈልጋሉ? (ከፈቃድዎ በላይ ቅናሽ፣ የዋጋ ለውጥ) እስከ መቼ?', t:'area', show:{f:'need_lead', when:'yes'}}
    ]},
    { en:"10 · Tomorrow's top 3", am:'10 · የነገ ሦስት ቅድሚያዎች', fields:[
      {id:'p1', en:'Priority 1', am:'1ኛ ሥራ', t:'text'},
      {id:'p2', en:'Priority 2', am:'2ኛ ሥራ', t:'text'},
      {id:'p3', en:'Priority 3', am:'3ኛ ሥራ', t:'text'}
    ]}
  ]
};

const SALES_WEEKLY = {
  id:'sales-weekly', cadence:'weekly', dueTime:'15:30', dueDay:5,
  en:'Weekly Sales Summary', am:'ሳምንታዊ የሽያጭ ማጠቃለያ',
  toEn:'Ephrata', toAm:'ኤፍራታ',
  dueEn:'Friday 3:30 PM — Ephrata needs it for her 4:00 PM report',
  dueAm:'ዓርብ ከቀኑ 9፡30 (3:30 PM)',
  penEn:'Late –500 Birr', penAm:'ዘግይቶ –500 ብር',
  sections:[
    { en:'1 · Sales performance', am:'1 · የሽያጭ አፈጻጸም', fields:[
      {id:'s_contracts', en:'How many contracts did you sign this week?', am:'በዚህ ሳምንት ስንት ውል ተፈረመ?', t:'num'},
      {id:'s_contracts_list', en:'List each contract signed this week', am:'በዚህ ሳምንት የተፈረሙትን ውሎች ይዘርዝሩ', t:'table', addEn:'Add a contract', addAm:'ውል ጨምር',
        show:{f:'s_contracts', when:'pos'},
        cols:[
          {id:'cust', en:'Customer', am:'ደንበኛ', t:'text'},
          {id:'code', en:'Job code', am:'የሥራ ኮድ', t:'text'},
          {id:'value', en:'Contract value', am:'የውል ዋጋ', t:'money'},
          {id:'margin', en:'Margin per m²', am:'ትርፍ በካሬ ሜትር', t:'money'}
        ]},
      {id:'s_value', en:'What is the total value of this week\'s contracts?', am:'የዚህ ሳምንት ውሎች ጠቅላላ ዋጋ ስንት ነው?', t:'money'},
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
    { en:'3 · Lead performance', am:'3 · የደንበኛ አያያዝ አፈጻጸም', fields:[
      {id:'lp_total', en:'How many new leads did you receive this week?', am:'በዚህ ሳምንት ስንት አዲስ ደንበኞች መጡ?', t:'num'},
      {id:'lp_1hr', en:'New leads this week: how many were called within 1 hour? (called within 1 hour / all new leads this week)', am:'በዚህ ሳምንት አዲስ የመጡ ደንበኞች፦ ስንቱ በ1 ሰዓት ውስጥ ተደወለላቸው? (በ1 ሰዓት ውስጥ የተደወለላቸው / በዚህ ሳምንት የመጡ አዲስ ደንበኞች በሙሉ)', t:'ratio', whole:'lp_total'},
      {id:'lp_1hr_why', en:'Which leads were missed, and why?', am:'ያመለጡት ደንበኞች እነማን ናቸው? ለምን?', t:'area', show:{f:'lp_1hr', when:'short'}},
      {id:'lp_visits', en:'How many pre-measurement visits were done this week?', am:'በዚህ ሳምንት ስንት የቅድመ ልኬት ጉብኝት ተካሄደ?', t:'num'},
      {id:'lp_quotes', en:'How many quotations did you present this week?', am:'በዚህ ሳምንት ስንት ፕሮፎርማ ቀረበ?', t:'num'},
      {id:'lp_conv', en:'What share of your leads became contracts?', am:'ከደንበኞችዎ ስንት በመቶው ውል ፈረሙ?', t:'pct'},
      {id:'lp_follow', en:'What share of your leads did you follow up?', am:'ከደንበኞችዎ ስንት በመቶው ክትትል ተደረገላቸው?', t:'pct',
        tgt:{op:'gte', v:50, en:'Below 50% is –300 Birr', am:'ከ50% በታች –300 ብር'}},
      {id:'lp_follow_why', en:'Why is follow-up below 50%, and which leads will be followed up next week?', am:'ክትትሉ ለምን ከ50% በታች ሆነ? በሚቀጥለው ሳምንት የትኞቹ ደንበኞች ክትትል ይደረግላቸዋል?', t:'area', show:{f:'lp_follow', when:'miss'}}
    ]},
    { en:'4 · Margin performance', am:'4 · የትርፍ አፈጻጸም', fields:[
      {id:'mg_avg', en:'What was your average margin per m² this week?', am:'በዚህ ሳምንት አማካይ ትርፍዎ በካሬ ሜትር ስንት ነው?', t:'money',
        tgt:{op:'gte', v:6000, en:'Margin floor 6,000 Birr/m²', am:'ዝቅተኛው ትርፍ በካሬ ሜትር 6,000 ብር'}},
      {id:'mg_below', en:'How many contracts did you sign below the margin floor?', am:'ከዝቅተኛው ትርፍ በታች ስንት ውል ተፈረመ?', t:'num',
        tgt:{op:'lte', v:0, en:'–1,000 Birr each without approval', am:'ያለፈቃድ እያንዳንዱ –1,000 ብር'}},
      {id:'mg_below_list', en:'List each one, and who approved it', am:'እያንዳንዱን ይዘርዝሩ፤ ማን እንዳጸደቀውም', t:'table', addEn:'Add a contract', addAm:'ውል ጨምር',
        show:{f:'mg_below', when:'pos'},
        cols:[
          {id:'cust', en:'Customer', am:'ደንበኛ', t:'text'},
          {id:'margin', en:'Margin per m²', am:'ትርፍ በካሬ ሜትር', t:'money'},
          {id:'by', en:'Approved by', am:'ያጸደቀው', t:'text'}
        ]}
    ]},
    { en:'5 · Commission', am:'5 · ኮሚሽን', fields:[
      {id:'cm_earned', en:'How much commission did you earn this week?', am:'በዚህ ሳምንት ስንት ብር ኮሚሽን አገኙ?', t:'money'},
      {id:'cm_missed', en:'How many commission stages did you miss?', am:'ስንት የኮሚሽን ደረጃዎች አመለጡ?', t:'num',
        tgt:{op:'lte', v:0, en:'Each missed stage loses its share of the 2%',
             am:'እያንዳንዱ ያመለጠ ደረጃ ከ2% ድርሻውን ያሳጣል'}},
      {id:'cm_missed_list', en:'Which stages, on which jobs, and why?', am:'የትኞቹ ደረጃዎች? በየትኞቹ ሥራዎች? ለምን?', t:'table', addEn:'Add a missed stage', addAm:'ያመለጠ ደረጃ ጨምር',
        show:{f:'cm_missed', when:'pos'},
        cols:[
          {id:'cust', en:'Customer', am:'ደንበኛ', t:'text'},
          {id:'stage', en:'Stage', am:'ደረጃ', t:'text'},
          {id:'why', en:'Why', am:'ምክንያት', t:'text'}
        ]},
      {id:'cm_lost', en:'How much commission did that cost you?', am:'ይህ ስንት ብር ኮሚሽን አሳጣዎት?', t:'money'}
    ]},
    { en:'6 · WhatsApp compliance', am:'6 · የዋትስአፕ ተገዢነት', fields:[
      {id:'ww_groups', en:'How many customer groups were you active in this week?', am:'በዚህ ሳምንት በስንት የደንበኛ ግሩፖች ውስጥ ንቁ ነበሩ?', t:'num'},
      {id:'ww_posted', en:'How many required stage messages did you post? (posted / required)', am:'ከሚገባው የደረጃ መልዕክት ስንቱ ተላከ? (የተላከ / የሚገባው)', t:'ratio'},
      {id:'ww_posted_why', en:'Which customers missed a stage message, which stage, and why?', am:'የደረጃ መልዕክት ያልደረሳቸው የትኞቹ ደንበኞች ናቸው? የትኛው ደረጃ? ለምን?', t:'area', show:{f:'ww_posted', when:'short'}},
      {id:'ww_rate', en:'What is your compliance rate this week?', am:'የዚህ ሳምንት የተገዢነት መጠንዎ ስንት ነው?', t:'pct',
        tgt:{op:'gte', v:100, en:'Every stage message must be posted', am:'እያንዳንዱ የደረጃ መልዕክት መላክ አለበት'}},
      {id:'ww_unans', en:'How many messages waited more than 2 hours for your answer?', am:'ከ2 ሰዓት በላይ ምላሽ ሳያገኙ የቆዩ መልዕክቶች ስንት ናቸው?', t:'num',
        tgt:{op:'lte', v:0, en:'–200 Birr each', am:'እያንዳንዱ –200 ብር'}},
      {id:'ww_unans_why', en:'Which customers, and why?', am:'የየትኞቹ ደንበኞች ናቸው? ለምን?', t:'area', show:{f:'ww_unans', when:'pos'}}
    ]},
    { en:'7 · Customer satisfaction', am:'7 · የደንበኛ እርካታ', fields:[
      {id:'cu_recv', en:'How many complaints did your customers raise this week?', am:'በዚህ ሳምንት ደንበኞችዎ ስንት ቅሬታ አቀረቡ?', t:'num'},
      {id:'cu_list', en:'List each complaint', am:'እያንዳንዱን ቅሬታ ይዘርዝሩ', t:'table', addEn:'Add a complaint', addAm:'ቅሬታ ጨምር',
        show:{f:'cu_recv', when:'pos'},
        cols:[
          {id:'cust', en:'Customer', am:'ደንበኛ', t:'text'},
          {id:'what', en:'Complaint', am:'ቅሬታው', t:'text'},
          {id:'state', en:'Status', am:'ሁኔታ', t:'choice', opts:[
            {v:'resolved', en:'Resolved', am:'ተፈቷል'},
            {v:'open', en:'Still open', am:'ገና አልተፈታም'}]}
        ]},
      {id:'cu_res', en:'How many were resolved?', am:'ስንቱ ተፈቱ?', t:'num'},
      {id:'cu_out', en:'How many are still open?', am:'ስንቱ ገና አልተፈቱም?', t:'num',
        tgt:{op:'lte', v:0, en:'Unresolved past 7 days loses the full commission on that job',
             am:'ከ7 ቀን በላይ ያልተፈታ የዚያን ሥራ ሙሉ ኮሚሽን ያሳጣል'}},
      {id:'cu_out_plan', en:'For each open complaint: what is needed, who is fixing it, and by when?', am:'ለእያንዳንዱ ያልተፈታ ቅሬታ፦ ምን ያስፈልጋል? ማን ያስተካክለዋል? እስከ መቼ?', t:'area', show:{f:'cu_out', when:'pos'}},
      {id:'fu_week', en:'Of customers installed this week, how many got the 48-hour follow-up call? (called / due)', am:'በዚህ ሳምንት ተከላቸው ከተጠናቀቀ ደንበኞች ስንቱ የ48 ሰዓት የክትትል ጥሪ ተደረገላቸው? (የተደወለላቸው / መደወል የነበረባቸው)', t:'ratio'},
      {id:'fu_week_why', en:'Who was not called, and why?', am:'ያልተደወለላቸው እነማን ናቸው? ለምን?', t:'area', show:{f:'fu_week', when:'short'}}
    ]},
    { en:'8 · Problems and solutions', am:'8 · ችግሮችና መፍትሔዎች', fields:[
      {id:'problem', en:'What was the biggest problem this week?', am:'የዚህ ሳምንት ትልቁ ችግር ምን ነበር?', t:'area', opt:1},
      {id:'cause', en:'What caused it?', am:'መንስኤው ምንድን ነው?', t:'area', show:{f:'problem', when:'any'}},
      {id:'action', en:'What was done about it, and by when will it be fixed?', am:'ምን እርምጃ ተወሰደ? እስከ መቼ ይስተካከላል?', t:'area', opt:1},
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
    { en:'1 · Measurements today', am:'1 · የዛሬ ልኬቶች', fields:[
      {id:'m_pre', en:'How many pre-measurements did you do today?', am:'ዛሬ ስንት ቅድመ ልኬቶችን አደረጉ?', t:'num'},
      {id:'m_pre_list', en:'Which customers?', am:'የየትኞቹ ደንበኞች?', t:'table', addEn:'Add a customer', addAm:'ደንበኛ ጨምር',
        show:{f:'m_pre', when:'pos'},
        cols:[
          {id:'cust', en:'Customer', am:'ደንበኛ', t:'text'},
          {id:'where', en:'Area', am:'አካባቢ', t:'text'},
          {id:'next', en:'Pre-design due', am:'ቅድመ ዲዛይን የሚደርስበት', t:'text'}
        ]},
      {id:'m_pre_ontime', en:'How many were within 48 hours of the lead? (on time / done)', am:'ስንቱ ደንበኛው ከመጣ በ48 ሰዓት ውስጥ ተደረጉ? (በሰዓቱ / የተደረጉ)', t:'ratio',
        tgt:{op:'gte', v:100, en:'Late is –300 Birr and loses stage 1', am:'ዘግይቶ –300 ብር እና 1ኛ ደረጃን ያሳጣል'}},
      {id:'m_pre_ontime_why', en:'Which were late, by how long, and why?', am:'የዘገዩት የትኞቹ ናቸው? በምን ያህል? ለምን?', t:'area', show:{f:'m_pre_ontime', when:'short'}},
      {id:'m_fin', en:'How many final measurements did you do today?', am:'ዛሬ ስንት የመጨረሻ ልኬቶችን አደረጉ?', t:'num'},
      {id:'m_fin_list', en:'Which jobs?', am:'የትኞቹ ሥራዎች?', t:'table', addEn:'Add a job', addAm:'ሥራ ጨምር',
        show:{f:'m_fin', when:'pos'},
        cols:[
          {id:'cust', en:'Customer', am:'ደንበኛ', t:'text'},
          {id:'code', en:'Job code', am:'የሥራ ኮድ', t:'text'},
          {id:'green', en:'Selam’s green light first', am:'ከሰላም ፈቃድ ቀድሞ ነበር', t:'yesno'}
        ]},
      {id:'m_fin_amend', en:'Did any final measurement change the price?', am:'የመጨረሻ ልኬት ዋጋውን የቀየረበት ሥራ አለ?', t:'yesno', show:{f:'m_fin', when:'pos'}},
      {id:'m_fin_amend_what', en:'Which customer, by how much, and have the salesperson and Selam been told?', am:'የየትኛው ደንበኛ ነው? በስንት ብር? ለሻጩና ለሰላም ተነግሯል?', t:'area', show:{f:'m_fin_amend', when:'yes'}},
      {id:'m_fin_ontime', en:'How many were within 24 hours of the advance? (on time / done)', am:'ስንቱ ከቅድመ ክፍያ በ24 ሰዓት ውስጥ ተደረጉ? (በሰዓቱ / የተደረጉ)', t:'ratio',
        tgt:{op:'gte', v:100, en:'Late is –300 Birr and loses stage 4', am:'ዘግይቶ –300 ብር እና 4ኛ ደረጃን ያሳጣል'}},
      {id:'m_fin_ontime_why', en:'Which were late, and why?', am:'የዘገዩት የትኞቹ ናቸው? ለምን?', t:'area', show:{f:'m_fin_ontime', when:'short'}}
    ]},
    { en:'2 · Video documentation', am:'2 · የቪዲዮ ማስረጃ', fields:[
      {id:'v_pre_rec', en:'How many pre-measurement videos (3–5 min) were recorded? (recorded / visits)', am:'ስንት የቅድመ ልኬት ቪዲዮዎች (3–5 ደቂቃ) ተቀረጹ? (የተቀረጹ / ጉብኝቶች)', t:'ratio',
        tgt:{op:'gte', v:100, en:'A missing video is –500 Birr and loses 0.2%',
             am:'ያልተቀረጸ ቪዲዮ –500 ብር እና 0.2% ያሳጣል'}},
      {id:'v_pre_rec_why', en:'Which visits have no video, and why?', am:'ቪዲዮ ያልተቀረጸባቸው የትኞቹ ጉብኝቶች ናቸው? ለምን?', t:'area', show:{f:'v_pre_rec', when:'short'}},
      {id:'v_fin_rec', en:'How many final measurement videos (5–8 min) were recorded? (recorded / measurements)', am:'ስንት የመጨረሻ ልኬት ቪዲዮዎች (5–8 ደቂቃ) ተቀረጹ? (የተቀረጹ / ልኬቶች)', t:'ratio',
        tgt:{op:'gte', v:100, en:'A missing video is –500 Birr and loses 0.3%',
             am:'ያልተቀረጸ ቪዲዮ –500 ብር እና 0.3% ያሳጣል'}},
      {id:'v_fin_rec_why', en:'Which measurements have no video, and why?', am:'ቪዲዮ ያልተቀረጸላቸው የትኞቹ ልኬቶች ናቸው? ለምን?', t:'area', show:{f:'v_fin_rec', when:'short'}},
      {id:'v_uploaded', en:'How many videos were uploaded within 24 hours? (uploaded / recorded)', am:'ስንት ቪዲዮዎች በ24 ሰዓት ውስጥ ተጫኑ? (የተጫኑ / የተቀረጹ)', t:'ratio',
        tgt:{op:'gte', v:100, en:'Late upload is –200 Birr', am:'ዘግይቶ መጫን –200 ብር'}},
      {id:'v_uploaded_why', en:'Which are not uploaded yet, and when will they be?', am:'ያልተጫኑት የትኞቹ ናቸው? መቼ ይጫናሉ?', t:'area', show:{f:'v_uploaded', when:'short'}},
      {id:'v_consent', en:'Did every customer give consent on camera before recording?', am:'ሁሉም ደንበኞች ከመቀረጻቸው በፊት በካሜራ ፈቃድ ሰጥተዋል?', t:'yesno'},
      {id:'v_consent_why', en:'Which recording has no consent, and what will be done about it?', am:'ፈቃድ ያልተቀረጸለት የትኛው ቪዲዮ ነው? ምን ይደረጋል?', t:'area', show:{f:'v_consent', when:'no'}},
      {id:'v_disc', en:'How many design discussions did you record today?', am:'ዛሬ ስንት የዲዛይን ውይይቶችን ቀረጹ?', t:'num'}
    ]},
    { en:'3 · Designs delivered', am:'3 · የቀረቡ ዲዛይኖች', fields:[
      {id:'d_pre', en:'How many pre-designs did you deliver today?', am:'ዛሬ ስንት ቅድመ ዲዛይኖችን አቀረቡ?', t:'num'},
      {id:'d_pre_ontime', en:'How many were within 24 hours of the measurement? (on time / delivered)', am:'ስንቱ ከልኬት በ24 ሰዓት ውስጥ ቀረቡ? (በሰዓቱ / የቀረቡ)', t:'ratio',
        tgt:{op:'gte', v:100, en:'Late is –300 Birr', am:'ዘግይቶ –300 ብር'}},
      {id:'d_pre_ontime_why', en:'Which were late, and why?', am:'የዘገዩት የትኞቹ ናቸው? ለምን?', t:'area', show:{f:'d_pre_ontime', when:'short'}},
      {id:'d_fin', en:'How many final 3D designs did you deliver today?', am:'ዛሬ ስንት የመጨረሻ 3D ዲዛይኖችን አቀረቡ?', t:'num'},
      {id:'d_approved', en:'How many written customer approvals did you receive today?', am:'ዛሬ ስንት የጽሑፍ የደንበኛ ማጽደቆች ደረሱዎት?', t:'num'},
      {id:'d_rev', en:'How many revisions did customers ask for today?', am:'ዛሬ ደንበኞች ስንት ማሻሻያዎችን ጠየቁ?', t:'num'},
      {id:'d_rev_list', en:'Which customers, and what changed?', am:'የየትኞቹ ደንበኞች? ምን ተቀየረ?', t:'table', addEn:'Add a revision', addAm:'ማሻሻያ ጨምር',
        show:{f:'d_rev', when:'pos'},
        cols:[
          {id:'cust', en:'Customer', am:'ደንበኛ', t:'text'},
          {id:'what', en:'What changed', am:'የተቀየረው', t:'text'},
          {id:'times', en:'Revision no. for this customer', am:'ለዚህ ደንበኛ ስንተኛ ማሻሻያ', t:'num'}
        ]},
      {id:'d_waiting', en:'How many of your designs are held up by someone else today?', am:'ከዲዛይኖችዎ ስንቱ ዛሬ በሌላ ሰው ምክንያት ቆመዋል?', t:'num'},
      {id:'d_waiting_who', en:'Which customers, waiting on whom (customer, sales, Finance), and since when?', am:'የየትኞቹ ደንበኞች ናቸው? ማንን እየጠበቁ ነው (ደንበኛ፣ ሽያጭ፣ ፋይናንስ)? ከመቼ ጀምሮ?', t:'area', show:{f:'d_waiting', when:'pos'}}
    ]},
    { en:'4 · Material selection', am:'4 · የቁሳቁስ ምርጫ', fields:[
      {id:'ms_signed', en:'How many Material Selection Forms were physically signed today?', am:'ዛሬ ስንት የቁሳቁስ ምርጫ ፎርሞች በእጅ ተፈረሙ?', t:'num'},
      {id:'ms_photo', en:'How many signed forms have a photo in the WhatsApp group? (posted / signed)', am:'ከተፈረሙት ስንቱ ፎቶ በዋትስአፕ ግሩፕ ተልኳል? (የተላኩ / የተፈረሙ)', t:'ratio',
        tgt:{op:'gte', v:100, en:'Missing photo is –200 Birr and loses 0.3%',
             am:'ፎቶ ካልተላከ –200 ብር እና 0.3% ያሳጣል'}},
      {id:'ms_photo_why', en:'Whose forms have no photo yet, and why?', am:'ፎቶ ያልተላከው የየትኞቹ ደንበኞች ፎርም ነው? ለምን?', t:'area', show:{f:'ms_photo', when:'short'}},
      {id:'ms_a', en:'How many customers chose Option A (stock)?', am:'ስንት ደንበኞች አማራጭ A (በመጋዘን ያለ) መረጡ?', t:'num'},
      {id:'ms_b', en:'How many customers chose Option B (imported)?', am:'ስንት ደንበኞች አማራጭ B (ከውጭ የሚመጣ) መረጡ?', t:'num'},
      {id:'ms_codes', en:'Are the board and PVC edge codes confirmed in every Job File?', am:'የቦርድና የPVC ጠርዝ ኮዶች በእያንዳንዱ የሥራ ፋይል ተረጋግጠዋል?', t:'yesno'},
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
      {id:'cp_assigned', en:'How many design complaints are assigned to you?', am:'ስንት የዲዛይን ቅሬታዎች ለእርስዎ ተመድበዋል?', t:'num'},
      {id:'cp_list', en:'Which complaints?', am:'የትኞቹ ቅሬታዎች?', t:'table', addEn:'Add a complaint', addAm:'ቅሬታ ጨምር',
        show:{f:'cp_assigned', when:'pos'},
        cols:[
          {id:'cust', en:'Customer', am:'ደንበኛ', t:'text'},
          {id:'code', en:'Job code', am:'የሥራ ኮድ', t:'text'},
          {id:'what', en:'Complaint', am:'ቅሬታው', t:'text'},
          {id:'days', en:'Days open', am:'የቆየበት ቀን', t:'num'}
        ]},
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
    { en:'7 · WhatsApp compliance', am:'7 · የዋትስአፕ ተገዢነት', fields:[
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
      {id:'problem', en:'What was the biggest problem today?', am:'የዛሬው ትልቁ ችግር ምን ነበር?', t:'area', opt:1},
      {id:'cause', en:'What caused it?', am:'መንስኤው ምንድን ነው?', t:'area', opt:1},
      {id:'action', en:'What was done about it, by whom, and by when will it be fixed?', am:'ምን እርምጃ ተወሰደ? በማን? እስከ መቼ ይስተካከላል?', t:'area', opt:1},
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
  id:'design-weekly', cadence:'weekly', dueTime:'16:00', dueDay:5,
  en:'Weekly Design Summary', am:'ሳምንታዊ የዲዛይን ማጠቃለያ',
  toEn:'Ephrata', toAm:'ኤፍራታ',
  dueEn:'Friday 4:00 PM', dueAm:'ዓርብ ከቀኑ 10፡00 (4:00 PM)',
  penEn:'Late –500 Birr', penAm:'ዘግይቶ –500 ብር',
  sections:[
    { en:'1 · Measurements', am:'1 · ልኬቶች', fields:[
      {id:'wm_pre', en:'How many pre-measurements did you do this week?', am:'በዚህ ሳምንት ስንት ቅድመ ልኬቶችን አደረጉ?', t:'num'},
      {id:'wm_fin', en:'How many final measurements did you do this week?', am:'በዚህ ሳምንት ስንት የመጨረሻ ልኬቶችን አደረጉ?', t:'num'},
      {id:'wm_ontime', en:'How many measurements were on time? (on time / done)', am:'ስንቱ ልኬቶች በሰዓቱ ተደረጉ? (በሰዓቱ / የተደረጉ)', t:'ratio'},
      {id:'wm_ontime_why', en:'Which were late, and why?', am:'የዘገዩት የትኞቹ ናቸው? ለምን?', t:'area', show:{f:'wm_ontime', when:'short'}},
      {id:'wm_lead', en:'On average, how many hours from a new lead to the pre-measurement?', am:'ደንበኛው ከመጣ እስከ ቅድመ ልኬት በአማካይ ስንት ሰዓት ፈጀ?', t:'num',
        tgt:{op:'lte', v:48, en:'Must be within 48 hours', am:'በ48 ሰዓት ውስጥ መሆን አለበት'}},
      {id:'wm_lead_why', en:'Over 48 hours. What is slowing the first visit down?', am:'ከ48 ሰዓት በላይ ነው። የመጀመሪያውን ጉብኝት ምን እያዘገየው ነው?', t:'area', show:{f:'wm_lead', when:'miss'}}
    ]},
    { en:'2 · Designs', am:'2 · ዲዛይኖች', fields:[
      {id:'wd_pre', en:'How many pre-designs did you deliver this week?', am:'በዚህ ሳምንት ስንት ቅድመ ዲዛይኖችን አቀረቡ?', t:'num'},
      {id:'wd_fin', en:'How many final 3D designs did you deliver this week?', am:'በዚህ ሳምንት ስንት የመጨረሻ 3D ዲዛይኖችን አቀረቡ?', t:'num'},
      {id:'wd_ontime', en:'How many designs were on time? (on time / delivered)', am:'ስንቱ ዲዛይኖች በሰዓቱ ቀረቡ? (በሰዓቱ / የቀረቡ)', t:'ratio'},
      {id:'wd_ontime_why', en:'Which were late, and why?', am:'የዘገዩት የትኞቹ ናቸው? ለምን?', t:'area', show:{f:'wd_ontime', when:'short'}},
      {id:'wd_rev', en:'How many revisions did customers ask for this week?', am:'በዚህ ሳምንት ደንበኞች ስንት ማሻሻያዎችን ጠየቁ?', t:'num'},
      {id:'wd_rev_why', en:'Which customers asked more than once, and why — what was unclear the first time?', am:'ከአንድ ጊዜ በላይ የጠየቁት የትኞቹ ደንበኞች ናቸው? ለምን — በመጀመሪያው ዲዛይን ምን ግልጽ አልነበረም?', t:'area', show:{f:'wd_rev', when:'pos'}}
    ]},
    { en:'3 · Video documentation', am:'3 · የቪዲዮ ማስረጃ', fields:[
      {id:'wv_pre', en:'How many pre-measurement videos were recorded and uploaded? (uploaded / visits)', am:'ስንት የቅድመ ልኬት ቪዲዮዎች ተቀርጸው ተጫኑ? (የተጫኑ / ጉብኝቶች)', t:'ratio'},
      {id:'wv_pre_why', en:'Which visits have no video, and why?', am:'ቪዲዮ ያልተቀረጸባቸው የትኞቹ ጉብኝቶች ናቸው? ለምን?', t:'area', show:{f:'wv_pre', when:'short'}},
      {id:'wv_fin', en:'How many final measurement videos were recorded and uploaded? (uploaded / measurements)', am:'ስንት የመጨረሻ ልኬት ቪዲዮዎች ተቀርጸው ተጫኑ? (የተጫኑ / ልኬቶች)', t:'ratio'},
      {id:'wv_fin_why', en:'Which measurements have no video, and why?', am:'ቪዲዮ ያልተቀረጸላቸው የትኞቹ ልኬቶች ናቸው? ለምን?', t:'area', show:{f:'wv_fin', when:'short'}},
      {id:'wv_disc', en:'How many design discussions were recorded? (recorded / held)', am:'ስንት የዲዛይን ውይይቶች ተቀረጹ? (የተቀረጹ / የተካሄዱ)', t:'ratio'},
      {id:'wv_audit', en:'What Video Quality Audit score do you expect this month? (%)', am:'በዚህ ወር ስንት የቪዲዮ ጥራት ኦዲት ውጤት ይጠብቃሉ? (%)', t:'pct',
        tgt:{op:'gte', v:90, en:'≥90% earns 1,000 Birr; below 60% is –1,500 Birr',
             am:'≥90% 1,000 ብር፤ ከ60% በታች –1,500 ብር'}},
      {id:'wv_audit_why', en:'Below 90%. What will you fix to raise it?', am:'ከ90% በታች ነው። ለማሻሻል ምን ያስተካክላሉ?', t:'area', show:{f:'wv_audit', when:'miss'}}
    ]},
    { en:'4 · Material selection', am:'4 · የቁሳቁስ ምርጫ', fields:[
      {id:'wms_signed', en:'How many Material Selection Forms were signed this week?', am:'በዚህ ሳምንት ስንት የቁሳቁስ ምርጫ ፎርሞች ተፈረሙ?', t:'num'},
      {id:'wms_a', en:'How many customers chose Option A (stock)?', am:'ስንት ደንበኞች አማራጭ A (በመጋዘን ያለ) መረጡ?', t:'num'},
      {id:'wms_b', en:'How many customers chose Option B (imported)?', am:'ስንት ደንበኞች አማራጭ B (ከውጭ የሚመጣ) መረጡ?', t:'num'},
      {id:'wms_missing', en:'How many forms are still missing a signature?', am:'ስንት ፎርሞች ገና ፊርማ ጎድሏቸዋል?', t:'num',
        tgt:{op:'lte', v:0, en:'–500 Birr each and loses 0.3%', am:'እያንዳንዱ –500 ብር እና 0.3% ያሳጣል'}},
      {id:'wms_missing_who', en:'Which customers, and when will each sign?', am:'የየትኞቹ ደንበኞች ናቸው? እያንዳንዳቸው መቼ ይፈርማሉ?', t:'area', show:{f:'wms_missing', when:'pos'}},
      {id:'wms_photo', en:'How many signed forms have a photo posted? (posted / signed)', am:'ከተፈረሙት ስንቱ ፎቶ ተልኳል? (የተላኩ / የተፈረሙ)', t:'ratio'},
      {id:'wms_photo_why', en:'Whose forms have no photo yet, and why?', am:'ፎቶ ያልተላከው የየትኞቹ ደንበኞች ፎርም ነው? ለምን?', t:'area', show:{f:'wms_photo', when:'short'}}
    ]},
    { en:'5 · Job File documentation', am:'5 · የሥራ ፋይል ሰነዶች', fields:[
      {id:'jf_profiles', en:'How many Designer Profiles are complete? (complete / jobs)', am:'ስንት የዲዛይነር ፕሮፋይሎች ተሞልተዋል? (የተሞሉ / ሥራዎች)', t:'ratio'},
      {id:'jf_profiles_why', en:'Which customers have no complete profile, and by when will it be done?', am:'ፕሮፋይላቸው ያልተሟላ የትኞቹ ደንበኞች ናቸው? እስከ መቼ ይሟላል?', t:'area', show:{f:'jf_profiles', when:'short'}},
      {id:'jf_incomplete', en:'How many of your Job Files are incomplete?', am:'ስንቱ የሥራ ፋይሎችዎ ያልተሟሉ ናቸው?', t:'num',
        tgt:{op:'lte', v:0, en:'3 in a month cancels the month’s commission',
             am:'በወር 3 ከሆኑ የወሩን ኮሚሽን ይሰርዛል'}},
      {id:'jf_incomplete_list', en:'Which Job Files, and what is missing?', am:'የትኞቹ የሥራ ፋይሎች? ምን ጎደለ?', t:'table', addEn:'Add a Job File', addAm:'የሥራ ፋይል ጨምር',
        show:{f:'jf_incomplete', when:'pos'},
        cols:[
          {id:'code', en:'Job code', am:'የሥራ ኮድ', t:'text'},
          {id:'cust', en:'Customer', am:'ደንበኛ', t:'text'},
          {id:'what', en:'Missing', am:'የጎደለው', t:'text'},
          {id:'by', en:'Complete by', am:'የሚሟላበት ቀን', t:'text'}
        ]},
      {id:'jf_score', en:'What Documentation Quality Score do you expect this month? (%)', am:'በዚህ ወር ስንት የሰነድ ጥራት ውጤት ይጠብቃሉ? (%)', t:'pct',
        tgt:{op:'gte', v:95, en:'≥95% earns 2,000 Birr; below 60% is –3,000 Birr',
             am:'≥95% 2,000 ብር፤ ከ60% በታች –3,000 ብር'}},
      {id:'jf_score_why', en:'Below 95%. What is pulling it down, and what will you fix?', am:'ከ95% በታች ነው። ምን እያወረደው ነው? ምን ያስተካክላሉ?', t:'area', show:{f:'jf_score', when:'miss'}}
    ]},
    { en:'6 · Production drawings', am:'6 · የምርት ሥዕሎች', fields:[
      {id:'wp_sub', en:'How many production drawings did you submit this week?', am:'በዚህ ሳምንት ስንት የምርት ሥዕሎችን አቀረቡ?', t:'num'},
      {id:'wp_err', en:'How many drawings had errors?', am:'ስንት ሥዕሎች ስህተት ነበራቸው?', t:'num',
        tgt:{op:'lte', v:0, en:'–500 Birr each, and –500 per production delay caused',
             am:'እያንዳንዱ –500 ብር፣ ለሚያስከትለው መዘግየትም –500 ብር'}},
      {id:'wp_err_what', en:'Which jobs, what was the error, and did it delay production?', am:'የትኞቹ ሥራዎች ናቸው? ስህተቱ ምን ነበር? ምርቱን አዘገየ?', t:'area', show:{f:'wp_err', when:'pos'}},
      {id:'wp_late', en:'How many drawings were submitted late?', am:'ስንት ሥዕሎች ዘግይተው ቀረቡ?', t:'num',
        tgt:{op:'lte', v:0, en:'–300 Birr each', am:'እያንዳንዱ –300 ብር'}},
      {id:'wp_late_why', en:'Which jobs, and why?', am:'የትኞቹ ሥራዎች ናቸው? ለምን?', t:'area', show:{f:'wp_late', when:'pos'}}
    ]},
    { en:'7 · Commission', am:'7 · ኮሚሽን', fields:[
      {id:'wc_earned', en:'How much commission did you earn this week? (Birr)', am:'በዚህ ሳምንት ስንት ብር ኮሚሽን አገኙ?', t:'money'},
      {id:'wc_missed', en:'How many commission stages did you miss?', am:'ስንት የኮሚሽን ደረጃዎች አመለጡዎት?', t:'num'},
      {id:'wc_missed_list', en:'Which stages?', am:'የትኞቹ ደረጃዎች?', t:'table', addEn:'Add a stage', addAm:'ደረጃ ጨምር',
        show:{f:'wc_missed', when:'pos'},
        cols:[
          {id:'cust', en:'Customer', am:'ደንበኛ', t:'text'},
          {id:'stage', en:'Stage (1–10)', am:'ደረጃ (1–10)', t:'num'},
          {id:'why', en:'Why', am:'ለምን', t:'text'}
        ]},
      {id:'wc_lost', en:'How much commission did that cost? (Birr)', am:'ይህ ስንት ብር ኮሚሽን አሳጣ?', t:'money'}
    ]},
    { en:'8 · Complaints', am:'8 · ቅሬታዎች', fields:[
      {id:'wcp_assigned', en:'How many design complaints were assigned to you this week?', am:'በዚህ ሳምንት ስንት የዲዛይን ቅሬታዎች ለእርስዎ ተመደቡ?', t:'num'},
      {id:'wcp_24', en:'How many were contacted within 24 hours? (contacted / assigned)', am:'ስንቱ በ24 ሰዓት ውስጥ ተደወለላቸው? (የተደወለላቸው / የተመደቡ)', t:'ratio'},
      {id:'wcp_7', en:'How many were resolved within 7 days? (resolved / assigned)', am:'ስንቱ በ7 ቀን ውስጥ ተፈቱ? (የተፈቱ / የተመደቡ)', t:'ratio'},
      {id:'wcp_7_why', en:'Which were not resolved in 7 days, and why?', am:'በ7 ቀን ውስጥ ያልተፈቱት የትኞቹ ናቸው? ለምን?', t:'area', show:{f:'wcp_7', when:'short'}},
      {id:'wcp_out', en:'How many complaints are still open?', am:'ስንት ቅሬታዎች ገና አልተፈቱም?', t:'num',
        tgt:{op:'lte', v:0, en:'Two past 7 days cancels the month’s commission',
             am:'ከ7 ቀን በላይ ሁለት ከሆኑ የወሩን ኮሚሽን ይሰርዛል'}},
      {id:'wcp_out_what', en:'Which ones, how many days open, and what is the plan?', am:'የትኞቹ ናቸው? ስንት ቀን ቆዩ? ዕቅዱ ምንድን ነው?', t:'area', show:{f:'wcp_out', when:'pos'}},
      {id:'wcp_esc', en:'How many complaints went up to Ephrata or the Chairman?', am:'ስንት ቅሬታዎች ወደ ኤፍራታ ወይም ወደ ሊቀመንበሩ ደረሱ?', t:'num',
        tgt:{op:'lte', v:0, en:'–1,500 Birr to Ephrata, –3,000 Birr to the Chairman',
             am:'ወደ ኤፍራታ –1,500 ብር፣ ወደ ሊቀመንበር –3,000 ብር'}},
      {id:'wcp_esc_what', en:'Which ones, to whom, and why?', am:'የትኞቹ ናቸው? ለማን? ለምን?', t:'area', show:{f:'wcp_esc', when:'pos'}}
    ]},
    { en:'9 · WhatsApp compliance', am:'9 · የዋትስአፕ ተገዢነት', fields:[
      {id:'ws_rate', en:'What was your stage message compliance this week? (%)', am:'በዚህ ሳምንት የደረጃ መልዕክት ተገዢነትዎ ስንት ነበር? (%)', t:'pct',
        tgt:{op:'gte', v:100, en:'Every stage message must be posted', am:'እያንዳንዱ የደረጃ መልዕክት መላክ አለበት'}},
      {id:'ws_rate_why', en:'Below 100%. Which customers missed which stage message?', am:'ከ100% በታች ነው። የየትኞቹ ደንበኞች የትኛው የደረጃ መልዕክት ቀረ?', t:'area', show:{f:'ws_rate', when:'miss'}},
      {id:'ws_sum', en:'How many Design Discussion Summaries did you post this week?', am:'በዚህ ሳምንት ስንት የውይይት ማጠቃለያዎችን ላኩ?', t:'num'},
      {id:'ws_appr', en:'How many written customer approvals did you receive?', am:'ስንት የጽሑፍ የደንበኛ ማጽደቆች ደረሱዎት?', t:'num'},
      {id:'ws_comp', en:'How many design-related complaints came in this week?', am:'በዚህ ሳምንት ከዲዛይን ጋር የተያያዙ ስንት ቅሬታዎች ቀረቡ?', t:'num',
        tgt:{op:'lte', v:0, en:'Zero earns the 2,000 Birr bonus', am:'0 ከሆነ የ2,000 ብር ጉርሻ ያስገኛል'}},
      {id:'ws_comp_what', en:'Who complained, about what, and what was done?', am:'ቅሬታ ያቀረበው ማን ነው? ስለምን? ምን እርምጃ ተወሰደ?', t:'area', show:{f:'ws_comp', when:'pos'}}
    ]},
    { en:'10 · Problems and solutions', am:'10 · ችግሮችና መፍትሔዎች', fields:[
      {id:'problem', en:'What was the biggest problem this week — what caused it, and what is being done (who, by when)?', am:'የዚህ ሳምንት ትልቁ ችግር ምን ነበር? መንስኤው ምንድን ነው? ምን እየተደረገ ነው (በማን፣ እስከ መቼ)?', t:'area', opt:1},
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
  ['yohannis', 'yonas', 'abrham-g', 'teklweld', 'abrham-w'].forEach(function (p) {
    REPORTS.push(copyFor(DESIGN_DAILY, p), copyFor(DESIGN_WEEKLY, p));
  });
})();
