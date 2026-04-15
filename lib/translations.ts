export type Lang = "da" | "en";

export const translations: Record<Lang, Record<string, string>> = {
  da: {
    // NAV
    nav_om_os: "Om os",
    nav_priser: "Priser",
    nav_tilmeld: "Tilmeld dig",
    nav_medarbejder: "Medarbejder",
    nav_book: "Book nu",

    // HERO
    hero_eyebrow: "Renovering · Maling · Havearbejde · Montering · Byggeplads · København",
    hero_h1_1: "Stærke",
    hero_h1_2: "hænder",
    hero_h1_3: "til byggeriet",
    hero_catch: "— Sæt et kryds i kalenderen.",
    hero_desc:
      "Vi stiller erfarne og hårdtarbejdende folk til alle former for byggeprojekter i København — renovering, maling, havearbejde, montering og byggepladsbemanding. Klar til at tage fat.",
    hero_btn_book: "Book personale nu",
    hero_btn_services: "Se ydelser",

    // TICKER
    ticker_1: "Renovering",
    ticker_2: "Maling & spartling",
    ticker_3: "Havearbejde",
    ticker_4: "Montering",
    ticker_5: "Byggepladsbehjælp",
    ticker_6: "Flyttearbejde",
    ticker_7: "Flisearbejde",
    ticker_8: "Kryds — Sæt et kryds i kalenderen",

    // STATS
    stats_1: "Aktive byggefolk",
    stats_2: "Gennemsnitlig responstid",
    stats_3: "Forsikret personale",
    stats_4: "I branchen",

    // SERVICES DESKTOP (original 8 cards)
    svc_eyebrow: "Vores ydelser",
    svc_h2: "Alt inden for",
    svc_h2_yellow: "byggeprojekter",
    svc_1_title: "Renovering",
    svc_1_desc:
      "Erfarne folk til indvendig og udvendig renovering. Vi stiller hold klar til alt fra lettere istandsættelse til større renoveringsprojekter.",
    svc_1_tags: "Indvendig · Udvendig · Istandsættelse · Håndværk",
    svc_2_title: "Maling & spartling",
    svc_2_desc:
      "Malere og hjælpere til alle typer malerarbejde — vægge, lofter, facader og trapper. Vi leverer hurtige hænder med sans for detaljen.",
    svc_2_tags: "Indendørs · Facade · Spartling · Grundning",
    svc_3_title: "Havearbejde",
    svc_3_desc:
      "Havefolk til rydning, beskæring, ukrudtsbekæmpelse, anlæg og vedligehold. Klar til sæsonopgaver og løbende pasning af større arealer.",
    svc_3_tags: "Rydning · Beskæring · Anlæg · Vedligehold",
    svc_4_title: "Montering",
    svc_4_desc:
      "Erfarne folk til montering af køkkener, badeværelser, møbler, inventar og stilladser. Vi stiller med folk der ved hvad de laver — og gør det rigtigt første gang.",
    svc_4_tags: "Køkken · Badeværelse · Stillads · Inventar",
    svc_5_title: "Byggepladsbehjælp",
    svc_5_desc:
      "Generelle byggehjælpere til byggepladser — materialehåndtering, rengøring, bortskaffelse og støttefunktioner til håndværkere og entreprenører.",
    svc_5_tags: "Materialer · Rengøring · Transport · Støttefunktion",
    svc_6_title: "Nedrivning & rydning",
    svc_6_desc:
      "Fysiske folk til nedrivning, rydning og bortskaffelse. Vi leverer hold der kan tage de hårde jobs — og som møder til tiden.",
    svc_6_tags: "Nedrivning · Bortskaffelse · Rydning · Containerfyld",
    svc_7_title: "Flise & anlægsarbejde",
    svc_7_desc:
      "Hjælpere og faglærte til flisearbejde, belægning, kantsten og anlægsprojekter. Vi matcher kompetenceniveauet til din opgave.",
    svc_7_tags: "Fliser · Belægning · Kantsten · Anlæg",
    svc_8_title: "Kombinerede opgaver",
    svc_8_desc:
      "Har du et projekt der spænder over flere fagområder? Vi sætter det rette hold sammen — med de rette kompetencer til hver enkelt del af opgaven.",
    svc_8_tags: "Helhedsprojekt · Sammensat hold · Fleksibelt",

    // BRANCH CAROUSEL
    branches_eyebrow: "Vores brancher",
    branches_h2: "Find din",
    branches_h2_yellow: "branche",
    branches_subtitle:
      "Vi dækker hele spektret — fra renovering og byggeplads til events og flytning. Ét hold, alle brancher.",

    // BRANCH NAMES
    branch_1_name: "Byggeprojekter",
    branch_1_sub: "Renovation & construction",
    branch_2_name: "Maling & spartling",
    branch_2_sub: "Painting & plastering",
    branch_3_name: "Flytte & montere",
    branch_3_sub: "Moving & mounting",
    branch_4_name: "Havearbejde",
    branch_4_sub: "Garden & landscaping",
    branch_5_name: "Events & scener",
    branch_5_sub: "Events & stage setup",
    branch_6_name: "Nedrivning & rydning",
    branch_6_sub: "Demolition & clearing",
    branch_7_name: "Flise & anlæg",
    branch_7_sub: "Tiles & groundwork",

    // HOW IT WORKS
    how_eyebrow: "Processen",
    how_h2: "Klar på",
    how_h2_yellow: "4 trin",
    how_1_title: "Send en forespørgsel",
    how_1_desc:
      "Beskriv projektet — opgave, lokation, antal folk og startdato. Vi svarer inden for 2 timer.",
    how_2_title: "Vi matcher dit behov",
    how_2_desc:
      "Vi finder de rette folk fra vores netværk — matchet på faglig baggrund, erfaring og tilgængelighed.",
    how_3_title: "Kontrakt & aftale",
    how_3_desc:
      "Klar aftale med timepriser, vilkår og ansvar — ingen overraskelser på fakturaen bagefter.",
    how_4_title: "Vi møder op & leverer",
    how_4_desc:
      "Personalet er til aftalt tid, udstyret korrekt og klar til at arbejde. Du betaler kun for udført arbejde.",

    // WHY KRYDS
    why_eyebrow: "Hvorfor Kryds",
    why_h2: "Vi er",
    why_h2_yellow: "anderledes",
    why_1_title: "Klar til at tage fat",
    why_1_desc:
      "Vores folk er vant til fysisk arbejde og møder forberedte. Ingen indkøringsperiode — de er produktive fra dag ét.",
    why_2_title: "Forsikret & screenet",
    why_2_desc:
      "Alt personale er ansvarsforsikret, har ren straffeattest og er grundigt onboardet. Du arbejder trygt på pladsen.",
    why_3_title: "Klare kontrakter",
    why_3_desc:
      "Ingen overraskelser. Tydelige kontrakter med faste timepriser, definerede opgaver og klare vilkår fra start.",
    why_4_title: "Skalér efter behov",
    why_4_desc:
      "Enkeltpersoner til hele hold — enkeltdage eller hele projekter. Vi tilpasser størrelse og varighed til dit projekt.",
    why_5_title: "Hurtig mobilisering",
    why_5_desc:
      "Projektet rykkede frem? Vi har netværket og kan mobilisere hurtigt — selv til akutte situationer med kort varsel.",
    why_6_title: "Lokal kendskab",
    why_6_desc:
      "Vi er baseret i København og kender byggebranchen lokalt. Vores folk kender husregler, adgangsforhold og arbejdsmiljøkrav.",

    // FOUNDER / TEAM
    team_eyebrow: "Om os",
    team_h2: "Vi som",
    team_h2_yellow: "team",
    team_bio:
      "Hos Kryds fokuserer vi på kvalitet og aflastning af de tunge opgaver, der kræver ekstra hænder. Vi stiller med pålidelige, erfarne folk — klar til at tage fat fra dag ét. Uanset om det er renovering, events eller byggepladsarbejde, sørger vi for at dit projekt kører glat og effektivt.",
    team_link: "Læs mere →",

    // CONTACT
    contact_eyebrow: "Kom i gang",
    contact_h2_1: "Sæt et",
    contact_h2_yellow: "kryds",
    contact_h2_2: "i kalenderen",
    contact_included_title: "Hvad er inkluderet",
    contact_inc_1: "Personlig kontaktperson fra dag ét",
    contact_inc_2: "Skræddersyet bemandingsplan til projektet",
    contact_inc_3: "Kontrakt med klare vilkår og timepriser",
    contact_inc_4: "Ansvarsforsikret og screenet personale",
    contact_inc_5: "Fleksibel op- og nedskalering undervejs",
    contact_inc_6: "Samlet faktura pr. periode",
    contact_prices_title: "Timepriser (vejledende)",
    contact_price_1: "Byggehjælper / renovering — fra 170 kr/t",
    contact_price_2: "Maling & spartling — fra 175 kr/t",
    contact_price_3: "Havearbejde — fra 160 kr/t",
    contact_price_4: "Montering — fra 180 kr/t",
    contact_price_5: "Nedrivning & rydning — fra 165 kr/t",
    contact_price_6: "Weekend- og aftentillæg gælder",
    contact_direct_title: "Kontakt os direkte",
    contact_legal_title: "Juridisk",
    contact_form_title: "Send en forespørgsel",
    contact_label_company: "Virksomhed / navn",
    contact_placeholder_company: "Firma ApS eller dit navn",
    contact_label_contact: "Kontaktperson",
    contact_placeholder_contact: "Fulde navn",
    contact_label_email: "Email",
    contact_label_phone: "Telefon",
    contact_label_task: "Type af opgave",
    contact_task_placeholder: "Vælg opgavetype...",
    contact_task_1: "Renovering",
    contact_task_2: "Maling & spartling",
    contact_task_3: "Havearbejde",
    contact_task_4: "Montering",
    contact_task_5: "Byggepladsbehjælp",
    contact_task_6: "Flyttearbejde",
    contact_task_7: "Flise & anlægsarbejde",
    contact_task_8: "Events & sceneopbygning",
    contact_task_9: "Kombineret / andet",
    contact_label_antal: "Antal personer",
    contact_label_startdato: "Startdato",
    contact_label_desc: "Beskriv projektet",
    contact_placeholder_desc:
      "Fortæl om opgaven — sted, omfang, varighed og eventuelle krav til erfaring eller udstyr...",
    contact_terms_title: "Kundevilkår — leje af vikar",
    contact_btn: "Sæt et kryds i kalenderen →",
    contact_btn_sending: "Sender...",
    contact_success_title: "Tak for din forespørgsel",
    contact_success_desc: "Vi vender tilbage inden for 2 timer.",
    contact_error_terms: "Du skal acceptere kundevilkårene for at sende forespørgslen.",
    contact_error_general: "Noget gik galt. Prøv igen eller kontakt os direkte.",

    // MOBILE TILE LABELS
    mob_tile_1_label: "Renovering",      mob_tile_1_sub: "Indvendig & udvendig",
    mob_tile_2_label: "Maling",          mob_tile_2_sub: "Spartling & facade",
    mob_tile_3_label: "Havearbejde",     mob_tile_3_sub: "Anlæg & beskæring",
    mob_tile_4_label: "Montering",       mob_tile_4_sub: "Køkken & inventar",
    mob_tile_5_label: "Nedrivning",      mob_tile_5_sub: "Rydning & bortskaf",
    mob_tile_6_label: "Flise & anlæg",   mob_tile_6_sub: "Belægning & kant",
    mob_tile_7_label: "Byggeplads",      mob_tile_7_sub: "Behjælp & logistik",
    mob_tile_8_label: "Kombineret",      mob_tile_8_sub: "Sammensat hold",

    // MOBILE SERVICES (booking form)
    mob_svc_eyebrow: "Find bemanding",
    mob_svc_h2: "Hyr det",
    mob_svc_h2_yellow: "rette hold",
    mob_svc_desc:
      "Vælg din opgavetype og bestil personale — til timepris eller få et tilbud inden for 24 timer.",
    mob_svc_open: "Vælg →",
    mob_svc_close: "Luk ↑",
    mob_svc_type_label: "Type personale (vælg én eller flere)",
    mob_svc_antal_label: "Antal personale",
    mob_svc_startdato_label: "Startdato",
    mob_svc_price_label: "Hvad passer bedst?",
    mob_svc_timepris: "Timepris",
    mob_svc_timepris_desc: "Hurtig haste-løsning",
    mob_svc_tilbud: "Få et tilbud",
    mob_svc_tilbud_desc: "Svar inden for 24 timer",
    mob_svc_company_label: "Virksomhed / navn",
    mob_svc_company_ph_offer: "Firma ApS / dit navn",
    mob_svc_company_ph_time: "Dit fulde navn",
    mob_svc_company_name: "Dit navn",
    mob_svc_phone_label: "Telefon",
    mob_svc_email_label: "Email",
    mob_svc_project_label: "Beskriv projektet",
    mob_svc_project_ph: "Opgavens omfang, lokation, varighed og eventuelle krav...",
    mob_svc_btn_offer: "Anmod om tilbud →",
    mob_svc_btn_time: "Book til timepris →",
    mob_svc_sending: "Sender...",
    mob_svc_close_btn: "Luk",
    mob_svc_success_offer: "Vi sender dig et tilbud",
    mob_svc_success_time: "Tak — vi kontakter dig",
    mob_svc_success_offer_desc: "Forvent svar inden for 24 timer på hverdage.",
    mob_svc_success_time_desc: "Vi ringer tilbage hurtigst muligt.",
    mob_svc_choose_price: "Vælg timepris eller tilbud\nfor at udfylde formularen",
    mob_svc_error_terms: "Du skal acceptere kundevilkårene.",
    mob_svc_error_general: "Noget gik galt. Ring til os direkte: +45 42 77 88 66",

    // FOOTER
    footer_tagline: "Sæt et kryds i kalenderen.",
    footer_services: "Ydelser",
    footer_svc_1: "Bygge projekter",
    footer_svc_2: "Flytte & montere",
    footer_svc_3: "Events & scener",
    footer_svc_4: "Priser",
    footer_svc_5: "Tilmeld som medarbejder",
    footer_company: "Virksomhed",
    footer_comp_1: "Om Kryds",
    footer_comp_2: "Priser",
    footer_comp_3: "Send forespørgsel",
    footer_comp_4: "Medarbejder login",
    footer_legal: "Juridisk",
    footer_leg_1: "Handelsbetingelser",
    footer_leg_2: "Privatlivspolitik",
    footer_leg_3: "Medarbejder privatpolitik",
    footer_leg_4: "Cookie-politik",
    footer_copyright: "© 2026 Kryds ApS — CVR: 46369947",
    footer_location: "København, Danmark",
  },

  en: {
    // NAV
    nav_om_os: "About",
    nav_priser: "Pricing",
    nav_tilmeld: "Join us",
    nav_medarbejder: "Employee",
    nav_book: "Book now",

    // HERO
    hero_eyebrow: "Renovation · Painting · Garden · Mounting · Construction · Copenhagen",
    hero_h1_1: "Strong",
    hero_h1_2: "hands",
    hero_h1_3: "for construction",
    hero_catch: "— Put a X in the calendar.",
    hero_desc:
      "We provide experienced and hardworking people for all types of construction projects in Copenhagen — renovation, painting, garden work, mounting and site staffing. Ready to get started.",
    hero_btn_book: "Book staff now",
    hero_btn_services: "See services",

    // TICKER
    ticker_1: "Renovation",
    ticker_2: "Painting & plastering",
    ticker_3: "Garden work",
    ticker_4: "Mounting",
    ticker_5: "Site assistance",
    ticker_6: "Moving & relocation",
    ticker_7: "Tile work",
    ticker_8: "Kryds — Put a X in the calendar",

    // STATS
    stats_1: "Active construction workers",
    stats_2: "Average response time",
    stats_3: "Insured staff",
    stats_4: "In the industry",

    // SERVICES DESKTOP
    svc_eyebrow: "Our services",
    svc_h2: "Everything within",
    svc_h2_yellow: "construction",
    svc_1_title: "Renovation",
    svc_1_desc:
      "Experienced people for interior and exterior renovation. We assemble teams for everything from light refurbishment to major renovation projects.",
    svc_1_tags: "Interior · Exterior · Refurbishment · Craftsmanship",
    svc_2_title: "Painting & plastering",
    svc_2_desc:
      "Painters and assistants for all types of painting work — walls, ceilings, facades and staircases. Fast hands with an eye for detail.",
    svc_2_tags: "Indoor · Facade · Plastering · Priming",
    svc_3_title: "Garden work",
    svc_3_desc:
      "Garden workers for clearing, pruning, weeding, landscaping and maintenance. Ready for seasonal tasks and ongoing maintenance of larger areas.",
    svc_3_tags: "Clearing · Pruning · Landscaping · Maintenance",
    svc_4_title: "Mounting",
    svc_4_desc:
      "Experienced people for mounting kitchens, bathrooms, furniture, fixtures and scaffolding. We provide people who know their craft.",
    svc_4_tags: "Kitchen · Bathroom · Scaffolding · Fixtures",
    svc_5_title: "Site assistance",
    svc_5_desc:
      "General construction assistants — material handling, cleaning, disposal and support functions for craftspeople and contractors.",
    svc_5_tags: "Materials · Cleaning · Transport · Support",
    svc_6_title: "Demolition & clearing",
    svc_6_desc:
      "Physical workers for demolition, clearing and disposal. We deliver teams that can handle the tough jobs — and show up on time.",
    svc_6_tags: "Demolition · Disposal · Clearing · Skip filling",
    svc_7_title: "Tile & groundwork",
    svc_7_desc:
      "Assistants and specialists for tile work, paving, kerbing and landscaping projects. We match skill level to your task.",
    svc_7_tags: "Tiles · Paving · Kerbing · Groundwork",
    svc_8_title: "Combined tasks",
    svc_8_desc:
      "Have a project spanning multiple trades? We assemble the right team — with the right skills for each part of the job.",
    svc_8_tags: "Full project · Combined team · Flexible",

    // BRANCH CAROUSEL
    branches_eyebrow: "Our branches",
    branches_h2: "Find your",
    branches_h2_yellow: "branch",
    branches_subtitle:
      "We cover the full spectrum — from renovation and construction sites to events and moving. One team, all branches.",

    branch_1_name: "Construction",
    branch_1_sub: "Renovation & construction",
    branch_2_name: "Painting & plastering",
    branch_2_sub: "Painting & plastering",
    branch_3_name: "Moving & mounting",
    branch_3_sub: "Moving & mounting",
    branch_4_name: "Garden work",
    branch_4_sub: "Garden & landscaping",
    branch_5_name: "Events & stages",
    branch_5_sub: "Events & stage setup",
    branch_6_name: "Demolition & clearing",
    branch_6_sub: "Demolition & clearing",
    branch_7_name: "Tile & groundwork",
    branch_7_sub: "Tiles & groundwork",

    // HOW IT WORKS
    how_eyebrow: "The process",
    how_h2: "Ready in",
    how_h2_yellow: "4 steps",
    how_1_title: "Send a request",
    how_1_desc:
      "Describe the project — task, location, number of people and start date. We reply within 2 hours.",
    how_2_title: "We match your needs",
    how_2_desc:
      "We find the right people from our network — matched on professional background, experience and availability.",
    how_3_title: "Contract & agreement",
    how_3_desc:
      "Clear agreement with hourly rates, terms and responsibilities — no surprises on the invoice afterwards.",
    how_4_title: "We show up & deliver",
    how_4_desc:
      "Staff arrive on time, properly equipped and ready to work. You only pay for completed work.",

    // WHY KRYDS
    why_eyebrow: "Why Kryds",
    why_h2: "We are",
    why_h2_yellow: "different",
    why_1_title: "Ready to get started",
    why_1_desc:
      "Our people are used to physical work and arrive prepared. No settling-in period — they are productive from day one.",
    why_2_title: "Insured & screened",
    why_2_desc:
      "All staff are liability insured, have a clean criminal record and are thoroughly onboarded. You work safely on site.",
    why_3_title: "Clear contracts",
    why_3_desc:
      "No surprises. Clear contracts with fixed hourly rates, defined tasks and clear terms from the start.",
    why_4_title: "Scale as needed",
    why_4_desc:
      "Individuals to full teams — single days or entire projects. We adapt size and duration to your project.",
    why_5_title: "Rapid mobilisation",
    why_5_desc:
      "Project moved forward? We have the network and can mobilise quickly — even for urgent situations with short notice.",
    why_6_title: "Local knowledge",
    why_6_desc:
      "We are based in Copenhagen and know the local construction industry. Our people know house rules, access conditions and work environment requirements.",

    // FOUNDER / TEAM
    team_eyebrow: "About us",
    team_h2: "Our",
    team_h2_yellow: "team",
    team_bio:
      "At Kryds, we focus on quality and relieving you of the heavy tasks that require extra hands. We provide reliable, experienced people — ready to get started from day one. Whether it is renovation, events or construction site work, we ensure your project runs smoothly and efficiently.",
    team_link: "Read more →",

    // CONTACT
    contact_eyebrow: "Get started",
    contact_h2_1: "Put a",
    contact_h2_yellow: "X",
    contact_h2_2: "in the calendar",
    contact_included_title: "What is included",
    contact_inc_1: "Personal contact person from day one",
    contact_inc_2: "Tailored staffing plan for the project",
    contact_inc_3: "Contract with clear terms and hourly rates",
    contact_inc_4: "Liability insured and screened staff",
    contact_inc_5: "Flexible up- and downscaling during the project",
    contact_inc_6: "Consolidated invoice per period",
    contact_prices_title: "Hourly rates (indicative)",
    contact_price_1: "Construction assistant / renovation — from DKK 170/h",
    contact_price_2: "Painting & plastering — from DKK 175/h",
    contact_price_3: "Garden work — from DKK 160/h",
    contact_price_4: "Mounting — from DKK 180/h",
    contact_price_5: "Demolition & clearing — from DKK 165/h",
    contact_price_6: "Weekend and evening surcharges apply",
    contact_direct_title: "Contact us directly",
    contact_legal_title: "Legal",
    contact_form_title: "Send a request",
    contact_label_company: "Company / name",
    contact_placeholder_company: "Company Ltd or your name",
    contact_label_contact: "Contact person",
    contact_placeholder_contact: "Full name",
    contact_label_email: "Email",
    contact_label_phone: "Phone",
    contact_label_task: "Type of task",
    contact_task_placeholder: "Select task type...",
    contact_task_1: "Renovation",
    contact_task_2: "Painting & plastering",
    contact_task_3: "Garden work",
    contact_task_4: "Mounting",
    contact_task_5: "Site assistance",
    contact_task_6: "Moving & relocation",
    contact_task_7: "Tile & groundwork",
    contact_task_8: "Events & stage setup",
    contact_task_9: "Combined / other",
    contact_label_antal: "Number of people",
    contact_label_startdato: "Start date",
    contact_label_desc: "Describe the project",
    contact_placeholder_desc:
      "Tell us about the task — location, scope, duration and any requirements for experience or equipment...",
    contact_terms_title: "Customer terms — staff hire",
    contact_btn: "Put a X in the calendar →",
    contact_btn_sending: "Sending...",
    contact_success_title: "Thank you for your request",
    contact_success_desc: "We will get back to you within 2 hours.",
    contact_error_terms: "You must accept the customer terms to submit the request.",
    contact_error_general: "Something went wrong. Please try again or contact us directly.",

    // MOBILE TILE LABELS
    mob_tile_1_label: "Renovation",      mob_tile_1_sub: "Interior & exterior",
    mob_tile_2_label: "Painting",        mob_tile_2_sub: "Plastering & facade",
    mob_tile_3_label: "Garden work",     mob_tile_3_sub: "Landscaping & pruning",
    mob_tile_4_label: "Mounting",        mob_tile_4_sub: "Kitchen & fixtures",
    mob_tile_5_label: "Demolition",      mob_tile_5_sub: "Clearing & disposal",
    mob_tile_6_label: "Tile & groundwork", mob_tile_6_sub: "Paving & kerbing",
    mob_tile_7_label: "Site work",       mob_tile_7_sub: "Assistance & logistics",
    mob_tile_8_label: "Combined",        mob_tile_8_sub: "Mixed team",

    // MOBILE SERVICES
    mob_svc_eyebrow: "Find staffing",
    mob_svc_h2: "Hire the",
    mob_svc_h2_yellow: "right team",
    mob_svc_desc:
      "Choose your task type and order staff — at hourly rate or get a quote within 24 hours.",
    mob_svc_open: "Select →",
    mob_svc_close: "Close ↑",
    mob_svc_type_label: "Staff type (select one or more)",
    mob_svc_antal_label: "Number of staff",
    mob_svc_startdato_label: "Start date",
    mob_svc_price_label: "What suits you best?",
    mob_svc_timepris: "Hourly rate",
    mob_svc_timepris_desc: "Quick urgent solution",
    mob_svc_tilbud: "Get a quote",
    mob_svc_tilbud_desc: "Reply within 24 hours",
    mob_svc_company_label: "Company / name",
    mob_svc_company_ph_offer: "Company Ltd / your name",
    mob_svc_company_ph_time: "Your full name",
    mob_svc_company_name: "Your name",
    mob_svc_phone_label: "Phone",
    mob_svc_email_label: "Email",
    mob_svc_project_label: "Describe the project",
    mob_svc_project_ph: "Scope, location, duration and any requirements...",
    mob_svc_btn_offer: "Request quote →",
    mob_svc_btn_time: "Book hourly rate →",
    mob_svc_sending: "Sending...",
    mob_svc_close_btn: "Close",
    mob_svc_success_offer: "We will send you a quote",
    mob_svc_success_time: "Thank you — we will contact you",
    mob_svc_success_offer_desc: "Expect a reply within 24 hours on weekdays.",
    mob_svc_success_time_desc: "We will call back as soon as possible.",
    mob_svc_choose_price: "Select hourly rate or quote\nto fill in the form",
    mob_svc_error_terms: "You must accept the customer terms.",
    mob_svc_error_general: "Something went wrong. Call us directly: +45 42 77 88 66",

    // FOOTER
    footer_tagline: "Put a X in the calendar.",
    footer_services: "Services",
    footer_svc_1: "Construction projects",
    footer_svc_2: "Moving & mounting",
    footer_svc_3: "Events & stages",
    footer_svc_4: "Pricing",
    footer_svc_5: "Join as employee",
    footer_company: "Company",
    footer_comp_1: "About Kryds",
    footer_comp_2: "Pricing",
    footer_comp_3: "Send request",
    footer_comp_4: "Employee login",
    footer_legal: "Legal",
    footer_leg_1: "Terms of trade",
    footer_leg_2: "Privacy policy",
    footer_leg_3: "Employee privacy policy",
    footer_leg_4: "Cookie policy",
    footer_copyright: "© 2026 Kryds ApS — CVR: 46369947",
    footer_location: "Copenhagen, Denmark",
  },
};
