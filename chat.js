"use strict";
// Site assistant: scripted answers from the site's own content (no AI), in English, Hinglish or Hindi,
// plus a lead form that saves to the Leads Sheet.
(() => {
  const WA_NUMBER = "919119687579"; // used only inside WhatsApp links; never shown in the chat
  const LEAD_ENDPOINT = "https://script.google.com/macros/s/AKfycbw-wY5iioNYXIOOCgU5PfAAeR3B85IpfvZmnR2IMTKFH1iXVcnnGehy_m_eeoQDCXGo/exec"; // same as index.html lead-endpoint

  const MAIL = '<a href="mailto:sociocraftco@gmail.com">sociocraftco@gmail.com</a>';
  const link = (href, text) => `<a href="${href}">${text}</a>`;

  // Each topic: words that point to it (English, Hinglish, Hindi), its chip label and answer per language
  // (en, hn = Hinglish, hi = Hindi; trusted HTML written by us) and follow-up chips.
  const TOPICS = [
    { id: "hello", words: ["hi", "hello", "hey", "hii", "namaste", "namaskar", "good morning", "good evening", "नमस्ते", "नमस्कार", "हेलो", "हाय"],
      a: { en: "Hi! Ask me anything about our services, prices, timelines or how we work.",
           hn: "Namaste! Humari services, prices, timeline ya kaam karne ke tareeke ke baare mein kuch bhi poochiye.",
           hi: "नमस्ते! हमारी सेवाओं, कीमतों, समय या काम करने के तरीके के बारे में कुछ भी पूछिए।" },
      next: ["services", "prices", "process"] },
    { id: "services", words: ["service", "what do you", "build", "offer", "do you make", "kya banate", "kya karte", "kya kya", "सेवा", "क्या बनाते", "क्या करते"],
      l: { en: "What do you build?", hn: "Aap kya banate ho?", hi: "आप क्या बनाते हैं?" },
      a: { en: "We build:<ul><li>Business websites</li><li>Online stores with UPI and card payments</li><li>WhatsApp and website AI agents</li><li>Mobile and web apps</li><li>Automation and integrations</li><li>Social media, AI ad creative and Meta ads</li></ul>Everything is built from scratch, with no templates or page builders.",
           hn: "Hum banate hain:<ul><li>Business websites</li><li>UPI aur card payment wale online stores</li><li>WhatsApp aur website AI agents</li><li>Mobile aur web apps</li><li>Automation aur integrations</li><li>Social media, AI ad creative aur Meta ads</li></ul>Sab kuch scratch se banta hai, koi template ya page builder nahi.",
           hi: "हम बनाते हैं:<ul><li>बिज़नेस वेबसाइट</li><li>UPI और कार्ड पेमेंट वाले ऑनलाइन स्टोर</li><li>WhatsApp और वेबसाइट AI एजेंट</li><li>मोबाइल और वेब ऐप</li><li>ऑटोमेशन और इंटीग्रेशन</li><li>सोशल मीडिया, AI विज्ञापन क्रिएटिव और Meta ads</li></ul>सब कुछ शुरुआत से बनाया जाता है, कोई टेम्पलेट या पेज बिल्डर नहीं।" },
      next: ["prices", "website", "social"] },
    { id: "prices", weak: true, words: ["price", "pricing", "cost", "charge", "fee", "rate", "budget", "how much", "kitna", "kitne", "kitni", "kharcha", "kharch", "daam", "paisa", "package", "plan", "quote",
        "कीमत", "दाम", "कितना", "कितने", "कितनी", "खर्च", "चार्ज", "फीस", "पैकेज", "रेट"],
      l: { en: "How much does it cost?", hn: "Kitna kharcha hoga?", hi: "कितना खर्च होगा?" },
      a: { en: `Some starting prices:<ul><li>Websites from ₹14,999 (one-time)</li><li>Social media from ₹9,999 a month</li><li>Social media plus lead ads from ₹16,999 a month</li><li>Clinic booking system ₹19,999 setup plus ₹3,499 a month</li><li>Brand content from ₹24,999 a month</li></ul>Apps, online stores and AI agents get a written, fixed quote after a short discovery call. ${link("packages.html", "See all packages")}`,
           hn: `Kuch starting prices:<ul><li>Websites ₹14,999 se (ek baar)</li><li>Social media ₹9,999 per month se</li><li>Social media + lead ads ₹16,999 per month se</li><li>Clinic booking system ₹19,999 setup + ₹3,499 per month</li><li>Brand content ₹24,999 per month se</li></ul>Apps, online stores aur AI agents ke liye ek chhoti discovery call ke baad likhit, fixed quote milta hai. ${link("packages.html", "Saare packages dekhiye")}`,
           hi: `कुछ शुरुआती कीमतें:<ul><li>वेबसाइट ₹14,999 से (एक बार)</li><li>सोशल मीडिया ₹9,999 प्रति माह से</li><li>सोशल मीडिया + लीड ads ₹16,999 प्रति माह से</li><li>क्लिनिक बुकिंग सिस्टम ₹19,999 सेटअप + ₹3,499 प्रति माह</li><li>ब्रांड कंटेंट ₹24,999 प्रति माह से</li></ul>ऐप, ऑनलाइन स्टोर और AI एजेंट के लिए एक छोटी डिस्कवरी कॉल के बाद लिखित, फिक्स्ड कोटेशन मिलता है। ${link("packages.html", "सभी पैकेज देखें")}` },
      next: ["website", "social", "lead"] },
    { id: "website", words: ["website", "site", "web page", "landing page", "webpage", "domain", "वेबसाइट", "साइट"],
      l: { en: "Website prices", hn: "Website ka price", hi: "वेबसाइट की कीमत" },
      a: { en: "Website prices (one-time):<ul><li>5-page template site: ₹14,999</li><li>8-page custom site: ₹24,999</li><li>Custom site with lead forms, tracking and WhatsApp: ₹39,999</li></ul>You pay 50% in advance and the rest on launch. Sites are mobile-first and fast, with enquiry buttons that go to your WhatsApp.",
           hn: "Website prices (ek baar):<ul><li>5-page template site: ₹14,999</li><li>8-page custom site: ₹24,999</li><li>Lead forms, tracking aur WhatsApp ke saath custom site: ₹39,999</li></ul>50% advance dena hota hai, baaki launch par. Sites mobile-first aur fast hoti hain, aur enquiry buttons seedha aapke WhatsApp par jaate hain.",
           hi: "वेबसाइट की कीमतें (एक बार):<ul><li>5 पेज टेम्पलेट साइट: ₹14,999</li><li>8 पेज कस्टम साइट: ₹24,999</li><li>लीड फॉर्म, ट्रैकिंग और WhatsApp के साथ कस्टम साइट: ₹39,999</li></ul>50% एडवांस देना होता है, बाकी लॉन्च पर। साइट मोबाइल के लिए बनी और तेज़ होती है, और पूछताछ के बटन सीधे आपके WhatsApp पर जाते हैं।" },
      next: ["timeline", "maintenance", "lead"] },
    { id: "social", words: ["social", "instagram", "facebook", "post", "reel", "content", "marketing", "smm", "meta", "ads", "advert", "campaign", "leads", "promotion",
        "सोशल", "इंस्टाग्राम", "फेसबुक", "विज्ञापन", "मार्केटिंग", "पोस्ट", "रील"],
      l: { en: "Social media & ads", hn: "Social media aur ads", hi: "सोशल मीडिया और ads" },
      a: { en: `Monthly social media and ads packages:<ul><li>Local Starter ₹9,999: 12 posts a month and Google Business posts</li><li>Local Leads ₹16,999: adds Meta lead ads that open WhatsApp</li><li>Brand Growth ₹24,999: 16 posts, 2 AI videos, community management</li><li>Performance ₹44,999: content and Meta ads together</li><li>Ads Only ₹11,999, or 12% of spend, whichever is higher</li></ul>You pay ad spend to Meta directly. ${link("packages.html", "Full details")}`,
           hn: `Monthly social media aur ads packages:<ul><li>Local Starter ₹9,999: mahine ke 12 posts aur Google Business posts</li><li>Local Leads ₹16,999: saath mein Meta lead ads jo WhatsApp kholte hain</li><li>Brand Growth ₹24,999: 16 posts, 2 AI videos, community management</li><li>Performance ₹44,999: content aur Meta ads saath mein</li><li>Ads Only ₹11,999, ya spend ka 12%, jo bhi zyada ho</li></ul>Ad spend aap seedha Meta ko dete hain. ${link("packages.html", "Poori details")}`,
           hi: `मासिक सोशल मीडिया और ads पैकेज:<ul><li>Local Starter ₹9,999: महीने के 12 पोस्ट और Google Business पोस्ट</li><li>Local Leads ₹16,999: साथ में Meta लीड ads जो WhatsApp खोलते हैं</li><li>Brand Growth ₹24,999: 16 पोस्ट, 2 AI वीडियो, कम्युनिटी मैनेजमेंट</li><li>Performance ₹44,999: कंटेंट और Meta ads साथ में</li><li>Ads Only ₹11,999, या खर्च का 12%, जो भी ज़्यादा हो</li></ul>विज्ञापन का खर्च आप सीधे Meta को देते हैं। ${link("packages.html", "पूरी जानकारी")}` },
      next: ["billing", "lead"] },
    { id: "clinic", words: ["clinic", "doctor", "hospital", "dentist", "appointment", "patient", "med spa", "medspa", "क्लिनिक", "डॉक्टर", "अस्पताल", "अपॉइंटमेंट", "मरीज"],
      l: { en: "For clinics", hn: "Clinics ke liye", hi: "क्लिनिक के लिए" },
      a: { en: "For doctors, the Clinic Booking System costs ₹19,999 setup plus ₹3,499 a month (6-month minimum). It includes a WhatsApp assistant that books appointments, appointment reminders and Google Business Profile optimisation. WhatsApp message charges are billed at cost.",
           hn: "Doctors ke liye Clinic Booking System ₹19,999 setup + ₹3,499 per month hai (kam se kam 6 mahine). Isme WhatsApp assistant hai jo appointments book karta hai, appointment reminders, aur Google Business Profile optimisation. WhatsApp message charges actual cost par lagte hain.",
           hi: "डॉक्टरों के लिए Clinic Booking System ₹19,999 सेटअप + ₹3,499 प्रति माह है (कम से कम 6 महीने)। इसमें WhatsApp असिस्टेंट है जो अपॉइंटमेंट बुक करता है, अपॉइंटमेंट रिमाइंडर, और Google Business Profile ऑप्टिमाइज़ेशन। WhatsApp मैसेज का चार्ज असल लागत पर लगता है।" },
      next: ["website", "lead"] },
    { id: "agent", words: ["ai agent", "chatbot", "chat bot", "bot", "whatsapp bot", "automation", "automate", "assistant", "ai", "चैटबॉट", "बॉट", "एजेंट", "ऑटोमेशन"],
      l: { en: "AI & WhatsApp agents", hn: "AI aur WhatsApp agents", hi: "AI और WhatsApp एजेंट" },
      a: { en: "Our AI agents are trained on your services, prices and FAQs. They answer questions, take bookings and send you ready-to-call leads on WhatsApp, a Google Sheet or your CRM. They run on the WhatsApp Business Platform or your website. Pricing depends on what it needs to do, so you get a fixed written quote after a short call.",
           hn: "Humare AI agents aapki services, prices aur FAQs par trained hote hain. Ye sawalon ke jawab dete hain, bookings lete hain aur ready leads aapko WhatsApp, Google Sheet ya CRM par bhejte hain. Ye WhatsApp Business Platform ya aapki website par chalte hain. Price kaam par depend karta hai, isliye chhoti call ke baad likhit, fixed quote milta hai.",
           hi: "हमारे AI एजेंट आपकी सेवाओं, कीमतों और FAQs पर ट्रेन किए जाते हैं। ये सवालों के जवाब देते हैं, बुकिंग लेते हैं और तैयार लीड आपको WhatsApp, Google Sheet या CRM पर भेजते हैं। ये WhatsApp Business Platform या आपकी वेबसाइट पर चलते हैं। कीमत काम पर निर्भर करती है, इसलिए छोटी कॉल के बाद लिखित, फिक्स्ड कोटेशन मिलता है।" },
      next: ["process", "lead"] },
    { id: "app", words: ["app", "apps", "android", "iphone", "ios", "mobile", "store", "shop", "ecommerce", "e-commerce", "dashboard", "software", "portal", "dukan", "ऐप", "एप", "स्टोर", "दुकान", "सॉफ्टवेयर"],
      l: { en: "Apps & online stores", hn: "Apps aur online stores", hi: "ऐप और ऑनलाइन स्टोर" },
      a: { en: "We build Android, iPhone and web apps, dashboards, booking systems and online stores with UPI and card payments and an admin panel. Every app is different, so after a short discovery call you get a written, fixed quote with features and a timeline.",
           hn: "Hum Android, iPhone aur web apps, dashboards, booking systems, aur UPI/card payment aur admin panel wale online stores banate hain. Har app alag hota hai, isliye chhoti discovery call ke baad features aur timeline ke saath likhit, fixed quote milta hai.",
           hi: "हम Android, iPhone और वेब ऐप, डैशबोर्ड, बुकिंग सिस्टम, और UPI/कार्ड पेमेंट व एडमिन पैनल वाले ऑनलाइन स्टोर बनाते हैं। हर ऐप अलग होता है, इसलिए छोटी डिस्कवरी कॉल के बाद फीचर्स और समय-सीमा के साथ लिखित, फिक्स्ड कोटेशन मिलता है।" },
      next: ["timeline", "process", "lead"] },
    { id: "international", words: ["usa", "dollar", "international", "abroad", "uk", "australia", "canada", "dubai", "uae", "outside india", "videsh", "विदेश", "डॉलर"],
      l: { en: "Outside India", hn: "India ke bahar", hi: "भारत के बाहर" },
      a: { en: `Yes, we work with med spas in the US and abroad: a Creative Test Sprint for $750, Social + Creative for $1,200 a month, Growth for $1,950 a month, and booking websites from $1,800 to $3,500. International clients are invoiced in their own currency. ${link("packages.html#international", "See international packages")}`,
           hn: `Haan, hum US aur doosre deshon ke med spas ke saath kaam karte hain: Creative Test Sprint $750, Social + Creative $1,200 per month, Growth $1,950 per month, aur booking websites $1,800 se $3,500. International clients ko unki apni currency mein invoice milta hai. ${link("packages.html#international", "International packages dekhiye")}`,
           hi: `हाँ, हम अमेरिका और दूसरे देशों के med spas के साथ काम करते हैं: Creative Test Sprint $750, Social + Creative $1,200 प्रति माह, Growth $1,950 प्रति माह, और बुकिंग वेबसाइट $1,800 से $3,500। विदेशी क्लाइंट को उनकी अपनी मुद्रा में इनवॉइस मिलता है। ${link("packages.html#international", "अंतरराष्ट्रीय पैकेज देखें")}` },
      next: ["lead"] },
    { id: "timeline", words: ["how long", "time", "timeline", "days", "weeks", "deadline", "fast", "deliver", "when", "kitne din", "kitna time", "kab tak", "samay", "समय", "कितने दिन", "कब तक", "कितना टाइम", "टाइम"],
      l: { en: "How long does it take?", hn: "Kitna time lagega?", hi: "कितना समय लगेगा?" },
      a: { en: "Smaller websites usually take a few weeks. Stores, apps and AI agents take longer, depending on features and integrations. Your written scope includes a timeline with clear milestones, and work starts once we have the payment, access and materials we need.",
           hn: "Chhoti websites mein aam taur par kuch hafte lagte hain. Stores, apps aur AI agents mein features aur integrations ke hisaab se zyada time lagta hai. Aapke likhit scope mein milestones ke saath timeline hoti hai, aur kaam payment, access aur zaroori material milne ke baad shuru hota hai.",
           hi: "छोटी वेबसाइट में आम तौर पर कुछ हफ़्ते लगते हैं। स्टोर, ऐप और AI एजेंट में फीचर्स और इंटीग्रेशन के हिसाब से ज़्यादा समय लगता है। आपके लिखित स्कोप में माइलस्टोन के साथ समय-सीमा होती है, और काम पेमेंट, एक्सेस और ज़रूरी सामग्री मिलने के बाद शुरू होता है।" },
      next: ["process", "lead"] },
    { id: "process", words: ["process", "how do you work", "steps", "start", "begin", "procedure", "kaise kaam", "प्रक्रिया", "कैसे काम", "शुरू"],
      l: { en: "How do you work?", hn: "Aap kaise kaam karte ho?", hi: "आप कैसे काम करते हैं?" },
      a: { en: "Four steps:<ol><li><b>Discovery call:</b> we learn your business and the problem to solve.</li><li><b>Scope and quote:</b> features, timeline and price, agreed in writing before work starts.</li><li><b>Design and build:</b> regular demos on a live preview link.</li><li><b>Launch and support:</b> we deploy, hand over and stay on for fixes and updates.</li></ol>",
           hn: "Chaar steps:<ol><li><b>Discovery call:</b> hum aapka business aur problem samajhte hain.</li><li><b>Scope aur quote:</b> features, timeline aur price, kaam shuru hone se pehle likhit mein tay.</li><li><b>Design aur build:</b> live preview link par regular demos.</li><li><b>Launch aur support:</b> hum deploy karte hain, handover karte hain aur fixes aur updates ke liye saath rehte hain.</li></ol>",
           hi: "चार कदम:<ol><li><b>डिस्कवरी कॉल:</b> हम आपका बिज़नेस और समस्या समझते हैं।</li><li><b>स्कोप और कोटेशन:</b> फीचर्स, समय-सीमा और कीमत, काम शुरू होने से पहले लिखित में तय।</li><li><b>डिज़ाइन और निर्माण:</b> लाइव प्रीव्यू लिंक पर नियमित डेमो।</li><li><b>लॉन्च और सपोर्ट:</b> हम लाइव करते हैं, सौंपते हैं और सुधार व अपडेट के लिए साथ रहते हैं।</li></ol>" },
      next: ["prices", "lead"] },
    { id: "billing", words: ["pay", "payment", "billing", "invoice", "advance", "upi", "card", "setup fee", "minimum", "contract", "gst", "tax", "भुगतान", "पेमेंट", "इनवॉइस", "एडवांस", "बिल"],
      l: { en: "Payments & billing", hn: "Payment aur billing", hi: "पेमेंट और बिलिंग" },
      a: { en: `How billing works:<ul><li>Monthly packages have a one-time setup fee, run for at least 3 months, and are billed monthly in advance.</li><li>Websites need 50% in advance and the rest on launch.</li><li>You pay ad spend to Meta directly.</li><li>Prices exclude applicable taxes.</li></ul>Have an invoice? ${link("pay.html", "Pay it online")}`,
           hn: `Billing kaise hoti hai:<ul><li>Monthly packages mein ek baar setup fee hoti hai, kam se kam 3 mahine chalte hain, aur har mahine advance mein bill hote hain.</li><li>Websites mein 50% advance aur baaki launch par.</li><li>Ad spend aap seedha Meta ko dete hain.</li><li>Prices mein taxes shamil nahi hain.</li></ul>Invoice hai? ${link("pay.html", "Online pay kariye")}`,
           hi: `बिलिंग कैसे होती है:<ul><li>मासिक पैकेज में एक बार सेटअप फीस होती है, कम से कम 3 महीने चलते हैं, और हर महीने एडवांस में बिल होते हैं।</li><li>वेबसाइट में 50% एडवांस और बाकी लॉन्च पर।</li><li>विज्ञापन का खर्च आप सीधे Meta को देते हैं।</li><li>कीमतों में लागू टैक्स शामिल नहीं हैं।</li></ul>इनवॉइस है? ${link("pay.html", "ऑनलाइन पेमेंट करें")}` },
      next: ["refund", "lead"] },
    { id: "refund", words: ["refund", "cancel", "money back", "terminate", "notice", "wapas", "paise wapas", "रिफंड", "पैसे वापस", "वापस", "कैंसिल", "रद्द"],
      l: { en: "Refunds & cancelling", hn: "Refund aur cancel", hi: "रिफंड और कैंसिल" },
      a: { en: `After the minimum term you can cancel with 30 days' notice. The setup fee is non-refundable once work starts, and a month's fee is non-refundable once that month has started. For websites cancelled before launch, we refund the advance minus work done. Approved refunds are paid within 14 working days. ${link("refund.html", "Read the full policy")}`,
           hn: `Minimum term ke baad aap 30 din ka notice dekar cancel kar sakte hain. Setup fee kaam shuru hone ke baad refund nahi hoti, aur mahine ki fee us mahine ke shuru hone ke baad refund nahi hoti. Launch se pehle cancel hui website mein, kiye gaye kaam ki value kaatkar advance wapas milta hai. Approved refunds 14 working days mein milte hain. ${link("refund.html", "Poori policy padhiye")}`,
           hi: `न्यूनतम अवधि के बाद आप 30 दिन का नोटिस देकर कैंसिल कर सकते हैं। सेटअप फीस काम शुरू होने के बाद वापस नहीं होती, और महीने की फीस उस महीने के शुरू होने के बाद वापस नहीं होती। लॉन्च से पहले कैंसिल हुई वेबसाइट में, किए गए काम की कीमत काटकर एडवांस वापस मिलता है। मंज़ूर रिफंड 14 कार्य दिवसों में मिलते हैं। ${link("refund.html", "पूरी पॉलिसी पढ़ें")}` },
      next: ["billing", "human"] },
    { id: "maintenance", words: ["maintenance", "support", "after launch", "update", "fix", "hosting", "bug", "मेंटेनेंस", "सपोर्ट", "होस्टिंग"],
      l: { en: "Support after launch", hn: "Launch ke baad support", hi: "लॉन्च के बाद सपोर्ट" },
      a: { en: "After launch we handle hosting, updates, fixes and new features. Annual website maintenance for a site we built costs ₹6,000–10,000 a year.",
           hn: "Launch ke baad hum hosting, updates, fixes aur naye features sambhalte hain. Humari banayi website ka saalana maintenance ₹6,000–10,000 per year hai.",
           hi: "लॉन्च के बाद हम होस्टिंग, अपडेट, सुधार और नए फीचर्स संभालते हैं। हमारी बनाई वेबसाइट का सालाना मेंटेनेंस ₹6,000–10,000 प्रति वर्ष है।" },
      next: ["existing", "lead"] },
    { id: "existing", words: ["existing", "redesign", "already have", "old website", "improve", "speed up", "revamp", "purani", "pehle se", "पुरानी", "पहले से"],
      l: { en: "Fix my existing site", hn: "Purani site theek karni hai", hi: "पुरानी साइट सुधारनी है" },
      a: { en: "Yes. We can redesign, speed up, fix or add features to an existing website or app. We review it first and tell you honestly whether to improve it or rebuild it.",
           hn: "Haan. Hum aapki maujooda website ya app ko redesign, fast, theek ya naye features ke saath behtar kar sakte hain. Pehle hum use dekhte hain aur imaandari se batate hain ki sudhaarna sahi rahega ya naya banana.",
           hi: "हाँ। हम आपकी मौजूदा वेबसाइट या ऐप को नया डिज़ाइन दे सकते हैं, तेज़ कर सकते हैं, सुधार सकते हैं या नए फीचर्स जोड़ सकते हैं। पहले हम उसे देखते हैं और ईमानदारी से बताते हैं कि सुधारना ठीक रहेगा या नया बनाना।" },
      next: ["lead", "human"] },
    { id: "about", words: ["who are you", "about", "company", "studio", "team", "located", "location", "where", "delhi", "office", "address", "portfolio", "work", "examples", "projects",
        "kaun ho", "kaun hai", "kahan", "कौन", "कहाँ", "दिल्ली"],
      l: { en: "About Socio Craftco", hn: "Socio Craftco ke baare mein", hi: "Socio Craftco के बारे में" },
      a: { en: `Socio Craftco is a studio in Delhi, India, building websites, apps, AI agents and content for growing businesses. Our current work includes Veya (a private money tracker app), Focusly (a study timer for iPhone) and The Quiet Mechanism, our own explainer channel. ${link("index.html#work", "See our work")}`,
           hn: `Socio Craftco Delhi ka ek studio hai jo growing businesses ke liye websites, apps, AI agents aur content banata hai. Humare current kaam mein Veya (ek private money tracker app), Focusly (iPhone ke liye study timer) aur The Quiet Mechanism (humara apna explainer channel) hain. ${link("index.html#work", "Humara kaam dekhiye")}`,
           hi: `Socio Craftco दिल्ली का एक स्टूडियो है जो बढ़ते बिज़नेस के लिए वेबसाइट, ऐप, AI एजेंट और कंटेंट बनाता है। हमारे मौजूदा काम में Veya (एक प्राइवेट मनी ट्रैकर ऐप), Focusly (iPhone के लिए स्टडी टाइमर) और The Quiet Mechanism (हमारा अपना एक्सप्लेनर चैनल) शामिल हैं। ${link("index.html#work", "हमारा काम देखें")}` },
      next: ["services", "lead"] },
    { id: "contact", words: ["contact", "email", "mail", "phone", "call", "number", "whatsapp", "reach", "talk", "human", "person", "baat", "संपर्क", "ईमेल", "नंबर", "फ़ोन", "फोन", "बात"],
      l: { en: "Contact details", hn: "Contact kaise karein?", hi: "संपर्क कैसे करें?" },
      a: { en: `Email us at ${MAIL}, or tap <b>Talk to the team</b> to message us on WhatsApp.`,
           hn: `Humein ${MAIL} par email kariye, ya WhatsApp par baat karne ke liye <b>Team se baat karein</b> dabaiye.`,
           hi: `हमें ${MAIL} पर ईमेल करें, या WhatsApp पर बात करने के लिए <b>टीम से बात करें</b> दबाएँ।` },
      next: ["human", "lead"] }
  ];
  const BY_ID = Object.fromEntries(TOPICS.map((t) => [t.id, t]));
  const START = ["services", "prices", "process", "lead"];

  // Everything the assistant says outside the topic answers.
  const UI = {
    quote: { en: "Get a quote", hn: "Quote chahiye", hi: "कोटेशन चाहिए" },
    human: { en: "Talk to the team", hn: "Team se baat karein", hi: "टीम से बात करें" },
    waOpened: { en: "I've opened WhatsApp for you. The team will reply there.", hn: "Aapke liye WhatsApp khol diya hai. Team wahin reply karegi.", hi: "आपके लिए WhatsApp खोल दिया है। टीम वहीं जवाब देगी।" },
    askName: { en: "Happy to help. What's your name?", hn: "Zaroor. Aapka naam kya hai?", hi: "ज़रूर। आपका नाम क्या है?" },
    askContact: { en: "Thanks, {n}. What's your WhatsApp number or email?", hn: "Shukriya, {n}. Aapka WhatsApp number ya email kya hai?", hi: "धन्यवाद, {n}। आपका WhatsApp नंबर या ईमेल क्या है?" },
    badContact: { en: "That doesn't look like a phone number or email. Could you check it?", hn: "Ye phone number ya email jaisa nahi lag raha. Ek baar check karenge?", hi: "यह फ़ोन नंबर या ईमेल जैसा नहीं लग रहा। एक बार जाँच लेंगे?" },
    askNeed: { en: "What would you like help with?", hn: "Aapko kis cheez mein help chahiye?", hi: "आपको किस चीज़ में मदद चाहिए?" },
    needs: { en: ["Website", "Social media & ads", "App or online store", "AI or WhatsApp agent", "Something else"],
             hn: ["Website", "Social media aur ads", "App ya online store", "AI ya WhatsApp agent", "Kuch aur"],
             hi: ["वेबसाइट", "सोशल मीडिया और ads", "ऐप या ऑनलाइन स्टोर", "AI या WhatsApp एजेंट", "कुछ और"] },
    done: { en: "Got it, {n}. Your details are with the team and they'll get in touch. For a faster reply, message us on WhatsApp.",
            hn: "Ho gaya, {n}. Aapki details team tak pahunch gayi hain, woh aapse contact karenge. Jaldi jawab ke liye WhatsApp par message kariye.",
            hi: "हो गया, {n}। आपकी जानकारी टीम तक पहुँच गई है, वे आपसे संपर्क करेंगे। जल्दी जवाब के लिए WhatsApp पर मैसेज करें।" },
    openWa: { en: "Open WhatsApp", hn: "WhatsApp kholiye", hi: "WhatsApp खोलें" },
    askElse: { en: "Ask something else", hn: "Kuch aur poochna hai", hi: "कुछ और पूछना है" },
    askElseReply: { en: "Sure, what would you like to know?", hn: "Zaroor, kya jaanna chahenge?", hi: "ज़रूर, आप क्या जानना चाहेंगे?" },
    fallback: { en: "I don't have an answer for that yet. The team can help directly, or leave your details and they'll get back to you.",
                hn: "Iska jawab abhi mere paas nahi hai. Team seedha madad kar sakti hai, ya apni details chhodiye, woh aapse contact karenge.",
                hi: "इसका जवाब अभी मेरे पास नहीं है। टीम सीधे मदद कर सकती है, या अपनी जानकारी छोड़ें, वे आपसे संपर्क करेंगे।" }
  };

  const norm = (s) => " " + String(s).toLowerCase().replace(/[^a-z0-9₹$ ऀ-ॣ०-ॿ]+/g, " ").replace(/\s+/g, " ") + " ";
  // Best topic for free text: the most keyword hits wins. Keywords match from the start of a word
  // (plurals and Hindi endings still match); words of 3 letters or fewer must match whole.
  const match = (text) => {
    const t = norm(text);
    let best = null, score = 0;
    for (const topic of TOPICS) {
      const hits = topic.words.reduce((n, w) => n + (t.includes(w.length <= 3 ? ` ${w} ` : ` ${w}`) ? (w.length > 6 ? 2 : 1) : 0), 0);
      const s = topic.weak ? hits * .4 : hits; // a product named with a price word ("website kitna") gets that product's prices
      if (s > score) { best = topic.id; score = s; }
    }
    return best;
  };

  // Reply language: Devanagari means Hindi; common Hindi words in Latin script mean Hinglish.
  // Returns null when a message is too short to tell, so the current language stays.
  const HINGLISH = new Set(("hai hain kya kitna kitne kitni kaise kaisa mujhe muje chahiye chaiye karte karna karo aap aapka apka nahi nhi kab kyu kyun " +
    "banwana banana banta bata batao bhai ji mera meri liye krna kr hoga sakte skte wala wali paisa din kaam ka ki ke ko se mein hum humein " +
    "acha accha theek thik haan ha toh bhi kuch koi kaun kahan kidhar").split(" "));
  const detect = (text) => {
    if (/[ऀ-ॿ]/.test(text)) return "hi";
    const words = norm(text).trim().split(" ").filter(Boolean);
    if (words.some((w) => HINGLISH.has(w))) return "hn";
    return words.length >= 3 ? "en" : null;
  };

  if (typeof document === "undefined") { globalThis.socioChat = { match, detect, TOPICS, UI }; return; } // node smoke test

  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const waUrl = (msg) => `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`;
  const escapeHtml = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const asked = []; // visitor questions, sent with a lead so the team has context
  let lead = null;   // { step, name, contact } while the lead form is running
  let lang = "en";
  const t = (key, name) => UI[key][lang].replace("{n}", escapeHtml(name || ""));

  const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };

  const launcher = el("button", "scw-launch",
    '<svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8a2.5 2.5 0 0 1-2.5 2.5H10l-4.2 3.6c-.5.4-1.3.1-1.3-.6V16A2.5 2.5 0 0 1 4 13.5z" fill="currentColor"/></svg>');
  launcher.type = "button";
  launcher.setAttribute("aria-label", "Ask Socio Craftco a question");
  launcher.setAttribute("aria-expanded", "false");
  launcher.setAttribute("aria-controls", "scw-panel");

  const panel = el("section", "scw-panel");
  panel.id = "scw-panel";
  panel.hidden = true;
  panel.setAttribute("role", "dialog");
  panel.setAttribute("aria-label", "Chat with Socio Craftco");
  panel.innerHTML = `
    <header class="scw-head">
      <span class="scw-av" aria-hidden="true">SC</span>
      <div><b>Socio Craftco</b><small>Ask in English, Hindi or Hinglish</small></div>
      <button class="scw-x" type="button" aria-label="Close chat">&times;</button>
    </header>
    <div class="scw-log" aria-live="polite"></div>
    <div class="scw-chips"></div>
    <form class="scw-form" autocomplete="off">
      <input class="scw-input" type="text" maxlength="300" placeholder="Type your question" aria-label="Your message">
      <button class="scw-send" type="submit" aria-label="Send"><svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M4 12l16-8-6 16-2.5-6.5z" fill="currentColor"/></svg></button>
    </form>
    <a class="scw-wa" target="_blank" rel="noopener" href="${waUrl("Hi Socio Craftco, I have a question.")}">Prefer WhatsApp? Chat with the team</a>`;

  const log = panel.querySelector(".scw-log");
  const chips = panel.querySelector(".scw-chips");
  const form = panel.querySelector(".scw-form");
  const input = panel.querySelector(".scw-input");

  const scroll = () => log.scrollTo({ top: log.scrollHeight, behavior: reduced ? "auto" : "smooth" });
  const say = (html) => { log.append(el("div", "scw-msg bot", html)); scroll(); };
  const you = (text) => { const m = el("div", "scw-msg you"); m.textContent = text; log.append(m); scroll(); };

  const chip = (label, run) => { const b = el("button", "scw-chip"); b.type = "button"; b.textContent = label; b.addEventListener("click", () => { you(label); run(); }); chips.append(b); };
  const offer = (ids) => {
    chips.replaceChildren();
    for (const id of ids) {
      if (id === "lead") chip(t("quote"), startLead);
      else if (id === "human") chip(t("human"), toWhatsApp);
      else if (BY_ID[id]) chip(BY_ID[id].l[lang], () => answer(id));
    }
  };

  const reply = (fn) => setTimeout(fn, reduced ? 0 : 350); // a short beat so it reads like a reply
  const answer = (id) => reply(() => { say(BY_ID[id].a[lang]); offer(BY_ID[id].next || START); });

  const toWhatsApp = () => {
    const q = asked.length ? ` I asked about: ${asked.slice(-3).join("; ")}` : "";
    window.open(waUrl(`Hi Socio Craftco, I have a question.${q}`), "_blank", "noopener");
    reply(() => { say(t("waOpened")); offer(START); });
  };

  // Every typed step keeps one chip that leaves the form, so a visitor who changes their mind is never stuck.
  const exitChip = () => chip(t("askElse"), () => { lead = null; reply(() => { say(t("askElseReply")); offer(START); }); });
  const startLead = () => { lead = { step: "name" }; reply(() => { say(t("askName")); chips.replaceChildren(); exitChip(); input.focus(); }); };
  const leadInput = (text) => {
    if (lead.step === "name") {
      lead.name = text.slice(0, 80);
      lead.step = "contact";
      reply(() => { say(t("askContact", lead.name)); chips.replaceChildren(); exitChip(); });
    } else if (lead.step === "contact") {
      if (text.replace(/\D/g, "").length < 8 && !/^\S+@\S+\.\S+$/.test(text)) return reply(() => say(t("badContact"))); // the exit chip from this step stays
      lead.contact = text.slice(0, 120);
      lead.step = "need";
      reply(() => {
        say(t("askNeed"));
        chips.replaceChildren();
        UI.needs[lang].forEach((label, i) => chip(label, () => finishLead(UI.needs.en[i]))); // Sheet gets the English label
        exitChip();
      });
    } else finishLead(text);
  };
  const finishLead = (need) => {
    const { name, contact } = lead;
    lead = null;
    if (LEAD_ENDPOINT) fetch(LEAD_ENDPOINT, { method: "POST", mode: "no-cors", keepalive: true, body: new URLSearchParams({
      source: "chat", name, contact, service: need.slice(0, 120),
      message: [`Page: ${location.pathname}`, `Language: ${lang}`, asked.length ? `Asked: ${asked.join("; ")}` : ""].filter(Boolean).join(" | ").slice(0, 900)
    }) }).catch(() => {});
    reply(() => {
      say(t("done", name));
      chips.replaceChildren();
      const openWa = () => window.open(waUrl(`Hi Socio Craftco, I'm ${name}. I'd like help with: ${need}.`), "_blank", "noopener");
      const b = el("button", "scw-chip"); b.type = "button"; b.textContent = t("openWa"); b.addEventListener("click", openWa); chips.append(b);
      chip(t("askElse"), () => reply(() => { say(t("askElseReply")); offer(START); }));
    });
  };

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;
    input.value = "";
    you(text);
    if (lead) return leadInput(text);
    lang = detect(text) || lang;
    asked.push(text.slice(0, 100));
    const id = match(text);
    if (id) return answer(id);
    reply(() => { say(t("fallback")); offer(["lead", "human", "services"]); });
  });

  let started = false;
  const open = (on) => {
    panel.hidden = !on;
    launcher.setAttribute("aria-expanded", String(on));
    launcher.classList.toggle("is-open", on);
    if (on && !started) {
      started = true;
      say("Hi! I'm the Socio Craftco assistant. Ask me about our services, prices or how we work.<br><span lang=\"hi-Latn\">Hindi ya Hinglish mein bhi pooch sakte hain.</span>");
      offer(START);
    }
    if (on) input.focus(); else launcher.focus();
  };
  launcher.addEventListener("click", () => open(panel.hidden));
  panel.querySelector(".scw-x").addEventListener("click", () => open(false));
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !panel.hidden) open(false); });

  document.body.append(panel, launcher);
})();
