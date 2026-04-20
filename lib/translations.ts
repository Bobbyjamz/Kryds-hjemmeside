export type Lang = "da" | "en";

export const translations: Record<Lang, Record<string, string>> = {
  da: {
    // NAV
    nav_om_os: "Om os",
    nav_ydelser: "Ydelser",
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

    // SERVICES (7 ydelser matching branches)
    svc_eyebrow: "Vores ydelser",
    svc_h2: "Alt inden for",
    svc_h2_yellow: "byggeprojekter",
    svc_page_subtitle:
      "Vi stiller hold klar til hele spektret — fra renovering og byggeplads til events og havearbejde. Én kontakt, syv brancher.",
    svc_cta: "Book ydelsen",
    svc_1_title: "Renovering",
    svc_1_desc:
      "Erfarne folk til indvendig og udvendig renovering samt byggeprojekter. Vi stiller hold klar til alt fra lettere istandsættelse til større byggeprojekter.",
    svc_1_tags: "Renovering · Byggeri · Istandsættelse · Håndværk",
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
      "Erfarne folk til montering af køkkener, badeværelser, møbler, inventar og stilladser. Vi gør det rigtigt første gang.",
    svc_4_tags: "Køkken · Bad · Inventar · Stillads",
    svc_5_title: "Nedrivning & rydning",
    svc_5_desc:
      "Fysiske folk til nedrivning, rydning og bortskaffelse. Vi leverer hold der kan tage de hårde jobs — og som møder til tiden.",
    svc_5_tags: "Nedrivning · Bortskaffelse · Rydning · Containerfyld",
    svc_6_title: "Flise & anlæg",
    svc_6_desc:
      "Hjælpere og faglærte til flisearbejde, belægning, kantsten og anlægsprojekter. Vi matcher kompetenceniveauet til din opgave.",
    svc_6_tags: "Fliser · Belægning · Kantsten · Anlæg",
    svc_7_title: "Byggepladsbehjælp",
    svc_7_desc:
      "Stærke hænder til byggepladsen — logistik, materialer, oprydning og generel assistance. Holdet der holder pladsen kørende.",
    svc_7_tags: "Byggeplads · Logistik · Oprydning · Assistance",
    svc_8_title: "Kombineret / andet",
    svc_8_desc:
      "Sammensat hold til blandede opgaver — vi kombinerer fag og erfaring, så du får ét hold der løser flere opgaver under samme aftale.",
    svc_8_tags: "Blandede opgaver · Fleksible hold · Kombineret · Skræddersyet",

    // BRANCH CAROUSEL
    branches_eyebrow: "Vores brancher",
    branches_h2: "Find din",
    branches_h2_yellow: "branche",
    branches_subtitle:
      "Vi dækker hele spektret — fra renovering og byggeplads til events og flytning. Ét hold, alle brancher.",

    // BRANCH NAMES
    branch_1_name: "Renovering",
    branch_1_sub: "Renovering & byggeri",
    branch_2_name: "Maling & spartling",
    branch_2_sub: "Maling & spartling",
    branch_3_name: "Havearbejde",
    branch_3_sub: "Have & anlægsgartneri",
    branch_4_name: "Montering",
    branch_4_sub: "Køkken, bad & inventar",
    branch_5_name: "Nedrivning & rydning",
    branch_5_sub: "Nedrivning & oprydning",
    branch_6_name: "Flise & anlæg",
    branch_6_sub: "Fliser & anlægsarbejde",
    branch_7_name: "Byggepladsbehjælp",
    branch_7_sub: "Behjælp & logistik",
    branch_8_name: "Kombineret / andet",
    branch_8_sub: "Sammensat hold til blandede opgaver",

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

    // COMMON
    common_back_home: "Tilbage til forsiden",
    common_back_short: "Forsiden",

    // NAV EXTRA
    nav_menu_open: "Åbn menu",
    nav_menu_close: "Luk menu",
    nav_theme_light: "Lys",
    nav_theme_dark: "Mørk",
    nav_theme_to_light: "Skift til lys tilstand",
    nav_theme_to_dark: "Skift til mørk tilstand",
    nav_medarbejder_login: "Medarbejder login",
    nav_lang_label_en: "English",
    nav_lang_label_da: "Dansk",

    // PRISER PAGE
    priser_eyebrow: "Priser",
    priser_h1_1: "Enkelt og",
    priser_h1_yellow: "gennemsigtigt",
    priser_subtitle:
      "Vi tager et fast gebyr oven på medarbejderens timeløn. Ingen skjulte gebyrer, ingen admin-omkostninger, ingen weekend-tillæg på gebyret.",
    priser_how_eyebrow: "Sådan virker det",
    priser_how_formula_1: "Medarbejderens løn +",
    priser_how_formula_2: "Kryds-gebyr",
    priser_how_formula_3: "= din timepris",
    priser_how_example: "Eksempel: 180 kr løn + 105 kr gebyr =",
    priser_how_example_bold: "285 kr/t total",
    priser_tiers_h2_1: "Timepriser",
    priser_tiers_h2_yellow: "pr. medarbejder",
    priser_tiers_subtitle:
      "Her ser du hvad medarbejderen ca. får i løn, vores gebyr, og hvad du som kunde betaler i alt pr. time.",
    priser_tiers_notice_bold: "OBS:",
    priser_tiers_notice:
      "Handyman-prisen dækker praktiske opgaver, oprydning, montering, maling og lignende. For faguddannede håndværkere (tømrer, murer, elektriker m.fl.) og byggeledere gælder koordinator-prisen eller separat projekttilbud.",
    priser_unit_hour: "kr/t",
    priser_row_worker_pay: "Medarbejderens løn",
    priser_row_fee: "Kryds-gebyr",
    priser_row_total: "Du betaler i alt",

    // Tier 1 — Handyman
    priser_tier1_name: "Handyman",
    priser_tier1_subtitle: "Standardpersonale",
    priser_tier1_desc: "Flittige hænder til praktiske opgaver — klar til at tage fat.",
    priser_tier1_worker_pay: "ca. 170–190",
    priser_tier1_total: "ca. 275–295",
    priser_tier1_feat_1: "Byggehjælpere & handymen",
    priser_tier1_feat_2: "Maling, oprydning, havearbejde",
    priser_tier1_feat_3: "Flytning, montering & nedrivning",
    priser_tier1_feat_4: "Fuldt forsikret personale",
    priser_tier1_feat_5: "Ingen minimumsbooking",
    priser_tier1_cta: "Book handyman",

    // Tier 2 — Koordinator
    priser_tier2_name: "Koordinator / Byggeleder",
    priser_tier2_subtitle: "Kvalificeret personale",
    priser_tier2_desc:
      "Koordinatorer og byggeledere med dokumenteret erfaring eller relevant uddannelse inden for byggefaget.",
    priser_tier2_badge: "Anbefalet",
    priser_tier2_worker_pay: "ca. 220–250",
    priser_tier2_total: "ca. 355–385",
    priser_tier2_feat_1: "Min. 5 års erfaring eller faglig uddannelse",
    priser_tier2_feat_2: "Referencer fra tidligere byggeprojekter",
    priser_tier2_feat_3: "Kan lede og fordele arbejdet på pladsen",
    priser_tier2_feat_4: "Projektledelse, tidsplan & kvalitetssikring",
    priser_tier2_feat_5: "Personlig kontaktperson",
    priser_tier2_feat_6: "Prioriteret mobilisering",
    priser_tier2_cta: "Book koordinator",

    // Tier 3 — Volumen
    priser_tier3_name: "Mængde 3+",
    priser_tier3_subtitle: "Volumenpris — handyman",
    priser_tier3_desc:
      "Ved booking af 3 eller flere handymen samtidig — samme kvalitet, lavere gebyr.",
    priser_tier3_worker_pay: "ca. 170–190",
    priser_tier3_total: "ca. 255–275",
    priser_tier3_feat_1: "3+ handymen pr. booking",
    priser_tier3_feat_2: "Samme kvalitet — lavere gebyr",
    priser_tier3_feat_3: "Ideel til store oprydnings- og byggepladsopgaver",
    priser_tier3_feat_4: "Dedikeret kontaktperson",
    priser_tier3_feat_5: "Fleksibel op-/nedskalering",
    priser_tier3_feat_6: "Samlet faktura pr. periode",
    priser_tier3_cta: "Kontakt os",

    // Projektpris
    priser_proj_eyebrow: "Projektpris",
    priser_proj_h2_1: "Fast pris på",
    priser_proj_h2_yellow: "hele resultatet",
    priser_proj_subtitle:
      "Har du brug for et færdigt resultat i stedet for timebemanding? Vi sender et skræddersyet tilbud baseret på hele opgaven — inkl. materialer, montering og arbejdskraft.",
    priser_proj_how_title: "Sådan fungerer det",
    priser_proj_step_1_title: "Send en forespørgsel",
    priser_proj_step_1_desc: "Beskriv opgaven — hvad skal laves, hvor, og hvornår.",
    priser_proj_step_2_title: "Vi vurderer opgaven",
    priser_proj_step_2_desc:
      "Vi besøger evt. lokationen og vurderer omfang, materialer og tidsestimat.",
    priser_proj_step_3_title: "Modtag tilbud",
    priser_proj_step_3_desc:
      "Du får et samlet tilbud med fast pris — inkl. materialer, arbejdsløn og evt. montering.",
    priser_proj_step_4_title: "Vi udfører arbejdet",
    priser_proj_step_4_desc:
      "Godkend tilbuddet, og vi tager os af resten. Færdigt resultat, ingen overraskelser.",
    priser_proj_inc_title: "Hvad er inkluderet i tilbuddet",
    priser_proj_inc_1: "Arbejdskraft — erfarne folk til opgaven",
    priser_proj_inc_2: "Materialer — vi rådgiver og indkøber",
    priser_proj_inc_3: "Montering & installation",
    priser_proj_inc_4: "Oprydning efter endt arbejde",
    priser_proj_inc_5: "Ansvarsforsikring på hele projektet",
    priser_proj_inc_6: "Ingen ekstra gebyrer udover tilbuddet",
    priser_proj_inc_7: "Gratis besigtigelse ved større opgaver",
    priser_proj_typical_title: "Typiske projektopgaver",
    priser_proj_tag_1: "Renovering",
    priser_proj_tag_2: "Maling",
    priser_proj_tag_3: "Montering",
    priser_proj_tag_4: "Fliser",
    priser_proj_tag_5: "Nedrivning",
    priser_proj_tag_6: "Haveanlæg",
    priser_proj_tag_7: "Sceneopbygning",
    priser_proj_tag_8: "Indretning",
    priser_proj_cta: "Send forespørgsel om tilbud",
    priser_proj_cta_note: "Vi vender tilbage inden for 2 timer med et uforpligtende tilbud.",

    // Enterprise
    priser_ent_eyebrow: "Store projekter",
    priser_ent_h3: "10+ personer? Kontakt os for skræddersyet pris",
    priser_ent_desc:
      "Ved store og langvarige projekter tilbyder vi individuelle aftaler med endnu lavere gebyrer og en dedikeret projektleder.",
    priser_ent_cta: "Kontakt os",

    // FAQ icons
    priser_faq_1_title: "Gennemsigtig pris",
    priser_faq_1_desc: "Medarbejderens løn + Kryds-gebyr. Du ved altid hvad du betaler.",
    priser_faq_2_title: "Samlet faktura",
    priser_faq_2_desc:
      "Ugentlig eller månedlig faktura med specificerede timer. Betaling inden for 14 dage.",
    priser_faq_3_title: "Ingen skjulte gebyrer",
    priser_faq_3_desc: "Ingen opstartsgebyr, ingen admin-fee, ingen weekend-tillæg på vores gebyr.",

    // OM OS PAGE
    omos_eyebrow: "Om Kryds",
    omos_h1_1: "Vi tror på at",
    omos_h1_yellow: "hjælpe hinanden",
    omos_subtitle:
      "Kryds blev skabt fordi vi så et behov: dygtige folk der manglede arbejde, og virksomheder der manglede hænder. Vores mission er at forbinde dem — enkelt, hurtigt og med respekt for begge sider.",
    omos_why_title: "Hvorfor vi startede Kryds",
    omos_why_p1:
      "Der er masser af dygtige folk i byggebranchen, der kæmper for at finde stabilt arbejde. Og der er masser af virksomheder, der ikke kan finde de rigtige hænder hurtigt nok. Det er et problem, vi selv har mærket på kroppen.",
    omos_why_p2:
      "Vi har ventet på det opkald, der aldrig kom. Og vi har stået med en deadline om to dage uden personale til at løse den. Det er ikke sjovt for nogen.",
    omos_why_p3_bold: "Kryds startede ud fra noget meget simpelt:",
    omos_why_p3:
      "ring til den rigtige person, aftal en fair pris, mødt op til tiden. Vi fjernede det unødvendige bureaukrati og holdt fast i det, der virker — ærlighed, hurtighed og folk, der tager stolthed i det, de laver.",
    omos_why_p4: "Det er stadig det, vi tror på.",
    omos_team_h2_1: "Folkene bag",
    omos_team_h2_yellow: "Kryds",
    omos_team_1_name: "Krystian Seweryn Balasz",
    omos_team_1_role: "Stifter",
    omos_team_1_bio:
      "Krystian har været i byggebranchen i over 7 år og kender udfordringerne indefra. Han startede Kryds med en simpel tanke: de rigtige folk skal møde de rigtige projekter — hurtigt, pålideligt og uden unødvendigt bureaukrati. Med erfaring fra renovering til store byggepladser har han bygget et netværk af dygtige, hårdtarbejdende folk, som er klar til at rykke ud med kort varsel.",
    omos_team_2_name: "Karl Kristian Ravn",
    omos_team_2_role: "Partner & Driftsansvarlig",
    omos_team_2_bio:
      "Karl holder styr på det hele bag kulisserne. Som driftsansvarlig har han ansvaret for koordinering, kvalitetssikring og den daglige kundekontakt. Han sørger for, at hvert projekt får de rette folk, at tidsplaner holdes, og at kommunikationen altid er klar — både over for kunden og personalet. Karl er overbevist om, at struktur og menneskelig omsorg sagtens kan gå hånd i hånd.",
    omos_values_h2_1: "Hvad vi",
    omos_values_h2_yellow: "står for",
    omos_val_1_title: "Gennemsigtighed",
    omos_val_1_desc:
      "Ingen skjulte gebyrer. Ingen overraskelser. Du ved hvad du betaler og hvad medarbejderen får.",
    omos_val_2_title: "Respekt for mennesker",
    omos_val_2_desc:
      "Vi behandler vores folk ordentligt — fair løn, gode vilkår og anerkendelse for det arbejde de laver.",
    omos_val_3_title: "Pålidelighed",
    omos_val_3_desc:
      "Når vi siger vi er klar, er vi klar. Vi har bygget vores ry på at holde hvad vi lover — hver gang.",
    omos_cta_h3: "Klar til at sætte et kryds?",
    omos_cta_desc: "Uanset om du har brug for én ekstra hånd eller et helt hold — vi er klar.",
    omos_cta_btn: "Send en forespørgsel",

    // YDELSER PAGE
    svc_cta_h3: "Klar til at booke et hold?",
    svc_cta_desc:
      "Fortæl os om projektet, så matcher vi med de rette folk — hurtigt og uden bøvl.",
    svc_cta_btn: "Send forespørgsel",
    ydelser_why_eyebrow: "Hvorfor Kryds",
    ydelser_why_h2: "Derfor vælger kunderne",
    ydelser_why_h2_yellow: "os",
    ydelser_why_1_title: "Ét kontaktpunkt",
    ydelser_why_1_desc:
      "Du har én person at ringe til — uanset om opgaven er renovering, havearbejde eller sceneopbygning. Vi koordinerer hele holdet.",
    ydelser_why_2_title: "Fleksibelt hold",
    ydelser_why_2_desc:
      "Fra én ekstra hånd til 20+ folk på pladsen. Vi skalerer op og ned efter dit behov — dag for dag eller hele projektet.",
    ydelser_why_3_title: "Hurtig respons",
    ydelser_why_3_desc:
      "Vi svarer på alle forespørgsler inden for 2 timer på hverdage. Akut behov? Vi mobiliserer ofte samme dag.",

    // TILMELD PAGE
    tilmeld_eyebrow: "For håndværkere",
    tilmeld_h1_1: "Tilmeld dig",
    tilmeld_h1_yellow: "Kryds",
    tilmeld_subtitle:
      "Opret din profil og få adgang til bygge- og håndværksopgaver i hovedstadsområdet. Du bliver kun medarbejder hos Kryds, når du selv siger ja til en vagt — og ansættelsen ophører automatisk, når opgaven er afsluttet.",

    // TILMELD WIZARD
    tw_step_1: "Dine oplysninger",
    tw_step_2: "Kompetencer",
    tw_step_3: "CV & referencer",
    tw_step_4: "Kontrakt & indsend",
    tw_success_h3: "Tak for din tilmelding",
    tw_success_p1: "Vi har modtaget dine oplysninger og vender tilbage hurtigst muligt.",
    tw_success_p2_1: "Du kan nu logge ind på",
    tw_success_p2_2:
      "med dit telefonnummer og fødselsdato for at se åbne vagter.",
    tw_s1_h2: "Hvem er du?",
    tw_s1_name_label: "Fulde navn *",
    tw_s1_name_ph: "Fornavn Efternavn",
    tw_s1_phone_label: "Telefon *",
    tw_s1_phone_ph: "+45 00 00 00 00",
    tw_s1_email_label: "Email",
    tw_s1_email_ph: "din@mail.dk",
    tw_s1_birth_label: "Fødselsdato *",
    tw_s1_birth_hint: "Bruges som adgang til dit medarbejder-dashboard.",
    tw_s1_photo_label: "Profilbillede (valgfrit)",
    tw_s1_photo_uploading: "Uploader...",
    tw_s1_photo_change: "Skift billede",
    tw_s1_photo_upload: "Upload billede",
    tw_s1_photo_registered: "Billede registreret",
    tw_s2_h2: "Dine kompetencer",
    tw_s2_trade_label: "Primært fag *",
    tw_s2_trade_hint: "Kan du lidt af det hele? Vælg Handyman — standardkategori.",
    tw_s2_skills_label: "Vælg dine kompetencer",
    tw_s2_custom_ph: "Tilføj egen kompetence...",
    tw_s2_custom_btn: "Tilføj",
    tw_s2_remove_aria: "Fjern",
    tw_s2_exp_label: "Erfaring (år, steder, projekter)",
    tw_s2_exp_ph:
      "F.eks. 5 års erfaring som tømrer hos XYZ, tagarbejde på kontorbyggeri i København...",
    tw_s3_h2: "CV & referencer",
    tw_s3_cv_label: "CV (PDF eller billede)",
    tw_s3_cv_uploading: "Uploader...",
    tw_s3_cv_change: "Skift CV",
    tw_s3_cv_upload: "Upload CV",
    tw_s3_cv_registered: "CV registreret",
    tw_s3_cv_view: "Vis",
    tw_s3_refs_label: "Referencer",
    tw_s3_ref_add: "+ tilføj reference",
    tw_s3_ref_name_ph: "Navn",
    tw_s3_ref_phone_ph: "Telefon",
    tw_s3_ref_company_ph: "Virksomhed",
    tw_s3_ref_relation_ph: "Relation (f.eks. tidligere chef)",
    tw_s3_ref_remove: "Fjern reference",
    tw_s3_notes_label: "Noter til Kryds (valgfrit)",
    tw_s3_notes_ph: "Særlige bemærkninger, tilgængelighed, kørekort, egen bil osv.",
    tw_s4_h2: "Accepter kontrakten",
    tw_s4_intro:
      "Læs kontrakten omhyggeligt. Ved at sætte flueben accepterer du vilkårene for dit ansættelsesforhold med Kryds ApS. Du er ikke bundet til Kryds udover de vagter, du selv accepterer.",
    tw_btn_back: "← Tilbage",
    tw_btn_next: "Næste →",
    tw_btn_submit: "Send tilmelding",
    tw_btn_sending: "Sender...",
    tw_err_upload: "Upload fejlede",
    tw_err_generic: "Noget gik galt",
    tw_err_connection: "Kunne ikke forbinde til serveren",

    // LEGAL PAGES (titles + intros)
    legal_eyebrow: "Juridisk",
    legal_h_handels: "Handelsbetingelser",
    legal_h_privat: "Privatlivspolitik",
    legal_h_cookie: "Cookie-politik",
    legal_h_medarb_eyebrow: "Juridisk — Medarbejdere",
    legal_h_medarb: "Privatlivspolitik for medarbejdere",
    legal_version_line: "Version v1-2026-04 · Gældende fra april 2026 · Kryds ApS, CVR 46369947",
    legal_version_privat: "Version v1-2026-04 · Gældende fra april 2026 · Sidst opdateret april 2026",
  },

  en: {
    // NAV
    nav_om_os: "About",
    nav_ydelser: "Services",
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
    svc_page_subtitle:
      "We assemble teams for the full spectrum — from renovation and construction to events and gardening. One contact, seven branches.",
    svc_cta: "Book this service",
    svc_1_title: "Renovation",
    svc_1_desc:
      "Experienced people for interior and exterior renovation and construction. We assemble teams for everything from light refurbishment to major construction projects.",
    svc_1_tags: "Renovation · Construction · Refurbishment · Craftsmanship",
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
      "Experienced people for mounting kitchens, bathrooms, furniture, fixtures and scaffolding. We get it right the first time.",
    svc_4_tags: "Kitchen · Bathroom · Fixtures · Scaffolding",
    svc_5_title: "Demolition & clearing",
    svc_5_desc:
      "Physical workers for demolition, clearing and disposal. We deliver teams that can handle the tough jobs — and show up on time.",
    svc_5_tags: "Demolition · Disposal · Clearing · Skip filling",
    svc_6_title: "Tile & groundwork",
    svc_6_desc:
      "Assistants and specialists for tile work, paving, kerbing and landscaping projects. We match skill level to your task.",
    svc_6_tags: "Tiles · Paving · Kerbing · Groundwork",
    svc_7_title: "Site assistance",
    svc_7_desc:
      "Strong hands for the construction site — logistics, materials, cleanup and general assistance. The crew that keeps the site running.",
    svc_7_tags: "Site · Logistics · Cleanup · Assistance",
    svc_8_title: "Combined / other",
    svc_8_desc:
      "Mixed team for varied tasks — we combine trades and experience so you get one crew solving several tasks under one agreement.",
    svc_8_tags: "Mixed tasks · Flexible team · Combined · Tailored",

    // BRANCH CAROUSEL
    branches_eyebrow: "Our branches",
    branches_h2: "Find your",
    branches_h2_yellow: "branch",
    branches_subtitle:
      "We cover the full spectrum — from renovation and construction sites to events and moving. One team, all branches.",

    branch_1_name: "Renovation",
    branch_1_sub: "Renovation & construction",
    branch_2_name: "Painting & plastering",
    branch_2_sub: "Painting & plastering",
    branch_3_name: "Garden work",
    branch_3_sub: "Garden & landscaping",
    branch_4_name: "Mounting",
    branch_4_sub: "Kitchen, bath & fixtures",
    branch_5_name: "Demolition & clearing",
    branch_5_sub: "Demolition & clearing",
    branch_6_name: "Tile & groundwork",
    branch_6_sub: "Tiles & groundwork",
    branch_7_name: "Site assistance",
    branch_7_sub: "Assistance & logistics",
    branch_8_name: "Combined / other",
    branch_8_sub: "Mixed team for varied tasks",

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

    // COMMON
    common_back_home: "Back to home",
    common_back_short: "Home",

    // NAV EXTRA
    nav_menu_open: "Open menu",
    nav_menu_close: "Close menu",
    nav_theme_light: "Light",
    nav_theme_dark: "Dark",
    nav_theme_to_light: "Switch to light mode",
    nav_theme_to_dark: "Switch to dark mode",
    nav_medarbejder_login: "Employee login",
    nav_lang_label_en: "English",
    nav_lang_label_da: "Dansk",

    // PRISER PAGE
    priser_eyebrow: "Pricing",
    priser_h1_1: "Simple and",
    priser_h1_yellow: "transparent",
    priser_subtitle:
      "We charge a fixed fee on top of the worker's hourly wage. No hidden charges, no admin fees, no weekend surcharges on our fee.",
    priser_how_eyebrow: "How it works",
    priser_how_formula_1: "Worker's wage +",
    priser_how_formula_2: "Kryds fee",
    priser_how_formula_3: "= your hourly rate",
    priser_how_example: "Example: DKK 180 wage + DKK 105 fee =",
    priser_how_example_bold: "DKK 285/hr total",
    priser_tiers_h2_1: "Hourly rates",
    priser_tiers_h2_yellow: "per worker",
    priser_tiers_subtitle:
      "Here you see approximately what the worker earns, our fee, and what you as the client pay in total per hour.",
    priser_tiers_notice_bold: "Note:",
    priser_tiers_notice:
      "The handyman rate covers practical tasks, cleanup, mounting, painting and similar. Skilled tradespeople (carpenters, masons, electricians and others) and site managers fall under the coordinator rate or a separate project quote.",
    priser_unit_hour: "DKK/hr",
    priser_row_worker_pay: "Worker's wage",
    priser_row_fee: "Kryds fee",
    priser_row_total: "You pay in total",

    // Tier 1 — Handyman
    priser_tier1_name: "Handyman",
    priser_tier1_subtitle: "Standard worker",
    priser_tier1_desc: "Diligent hands for practical tasks — ready to get started.",
    priser_tier1_worker_pay: "approx. 170–190",
    priser_tier1_total: "approx. 275–295",
    priser_tier1_feat_1: "Construction assistants & handymen",
    priser_tier1_feat_2: "Painting, cleanup, garden work",
    priser_tier1_feat_3: "Moving, mounting & demolition",
    priser_tier1_feat_4: "Fully insured staff",
    priser_tier1_feat_5: "No minimum booking",
    priser_tier1_cta: "Book handyman",

    // Tier 2 — Coordinator
    priser_tier2_name: "Coordinator / Site manager",
    priser_tier2_subtitle: "Qualified staff",
    priser_tier2_desc:
      "Coordinators and site managers with documented experience or relevant trade education in construction.",
    priser_tier2_badge: "Recommended",
    priser_tier2_worker_pay: "approx. 220–250",
    priser_tier2_total: "approx. 355–385",
    priser_tier2_feat_1: "Min. 5 years' experience or trade education",
    priser_tier2_feat_2: "References from previous construction projects",
    priser_tier2_feat_3: "Can lead and allocate work on site",
    priser_tier2_feat_4: "Project management, schedule & QA",
    priser_tier2_feat_5: "Personal contact person",
    priser_tier2_feat_6: "Priority mobilisation",
    priser_tier2_cta: "Book coordinator",

    // Tier 3 — Volume
    priser_tier3_name: "Volume 3+",
    priser_tier3_subtitle: "Volume rate — handyman",
    priser_tier3_desc:
      "When booking 3 or more handymen at once — same quality, lower fee.",
    priser_tier3_worker_pay: "approx. 170–190",
    priser_tier3_total: "approx. 255–275",
    priser_tier3_feat_1: "3+ handymen per booking",
    priser_tier3_feat_2: "Same quality — lower fee",
    priser_tier3_feat_3: "Ideal for large cleanup and site tasks",
    priser_tier3_feat_4: "Dedicated contact person",
    priser_tier3_feat_5: "Flexible up-/downscaling",
    priser_tier3_feat_6: "Consolidated invoice per period",
    priser_tier3_cta: "Contact us",

    // Project pricing
    priser_proj_eyebrow: "Project pricing",
    priser_proj_h2_1: "Fixed price on",
    priser_proj_h2_yellow: "the full result",
    priser_proj_subtitle:
      "Need a finished result instead of hourly staffing? We send a tailored quote based on the entire task — including materials, installation and labour.",
    priser_proj_how_title: "How it works",
    priser_proj_step_1_title: "Send a request",
    priser_proj_step_1_desc: "Describe the task — what, where and when.",
    priser_proj_step_2_title: "We assess the task",
    priser_proj_step_2_desc:
      "We may visit the location and assess scope, materials and time estimate.",
    priser_proj_step_3_title: "Receive a quote",
    priser_proj_step_3_desc:
      "You get a single fixed-price quote — including materials, labour and any installation.",
    priser_proj_step_4_title: "We do the work",
    priser_proj_step_4_desc:
      "Approve the quote and we handle the rest. Finished result, no surprises.",
    priser_proj_inc_title: "What is included in the quote",
    priser_proj_inc_1: "Labour — experienced people for the task",
    priser_proj_inc_2: "Materials — we advise and purchase",
    priser_proj_inc_3: "Mounting & installation",
    priser_proj_inc_4: "Cleanup after completion",
    priser_proj_inc_5: "Liability insurance on the whole project",
    priser_proj_inc_6: "No extra fees beyond the quote",
    priser_proj_inc_7: "Free on-site assessment on larger jobs",
    priser_proj_typical_title: "Typical project tasks",
    priser_proj_tag_1: "Renovation",
    priser_proj_tag_2: "Painting",
    priser_proj_tag_3: "Mounting",
    priser_proj_tag_4: "Tiles",
    priser_proj_tag_5: "Demolition",
    priser_proj_tag_6: "Landscaping",
    priser_proj_tag_7: "Stage build",
    priser_proj_tag_8: "Interior fit-out",
    priser_proj_cta: "Request a quote",
    priser_proj_cta_note: "We respond within 2 hours with a no-obligation quote.",

    // Enterprise
    priser_ent_eyebrow: "Large projects",
    priser_ent_h3: "10+ people? Contact us for a tailored rate",
    priser_ent_desc:
      "For large and long-running projects we offer individual agreements with even lower fees and a dedicated project manager.",
    priser_ent_cta: "Contact us",

    // FAQ icons
    priser_faq_1_title: "Transparent pricing",
    priser_faq_1_desc: "Worker's wage + Kryds fee. You always know what you pay.",
    priser_faq_2_title: "Consolidated invoice",
    priser_faq_2_desc:
      "Weekly or monthly invoice with itemised hours. Payment within 14 days.",
    priser_faq_3_title: "No hidden fees",
    priser_faq_3_desc: "No setup fee, no admin fee, no weekend surcharges on our fee.",

    // OM OS PAGE
    omos_eyebrow: "About Kryds",
    omos_h1_1: "We believe in",
    omos_h1_yellow: "helping each other",
    omos_subtitle:
      "Kryds was built because we saw a need: skilled people looking for work, and companies looking for hands. Our mission is to connect them — simply, quickly and with respect on both sides.",
    omos_why_title: "Why we started Kryds",
    omos_why_p1:
      "There are plenty of skilled people in construction struggling to find stable work. And plenty of companies that can't find the right hands fast enough. It's a problem we've felt ourselves.",
    omos_why_p2:
      "We've waited for the call that never came. And we've stood with a deadline two days out and no staff to make it. It's not fun for anyone.",
    omos_why_p3_bold: "Kryds started from something very simple:",
    omos_why_p3:
      "call the right person, agree a fair price, show up on time. We removed the unnecessary bureaucracy and kept what works — honesty, speed and people who take pride in what they do.",
    omos_why_p4: "That's still what we believe in.",
    omos_team_h2_1: "The people behind",
    omos_team_h2_yellow: "Kryds",
    omos_team_1_name: "Krystian Seweryn Balasz",
    omos_team_1_role: "Founder",
    omos_team_1_bio:
      "Krystian has been in the construction industry for over 7 years and knows the challenges from the inside. He started Kryds with a simple idea: the right people should meet the right projects — quickly, reliably and without unnecessary bureaucracy. With experience from renovation to large construction sites, he has built a network of skilled, hard-working people ready to mobilise on short notice.",
    omos_team_2_name: "Karl Kristian Ravn",
    omos_team_2_role: "Partner & Operations lead",
    omos_team_2_bio:
      "Karl keeps everything running behind the scenes. As operations lead, he handles coordination, quality assurance and day-to-day client contact. He makes sure every project gets the right people, schedules are kept, and communication is always clear — both towards the client and the staff. Karl is convinced that structure and human care go hand in hand.",
    omos_values_h2_1: "What we",
    omos_values_h2_yellow: "stand for",
    omos_val_1_title: "Transparency",
    omos_val_1_desc:
      "No hidden fees. No surprises. You know what you pay and what the worker earns.",
    omos_val_2_title: "Respect for people",
    omos_val_2_desc:
      "We treat our people properly — fair pay, good conditions and recognition for the work they do.",
    omos_val_3_title: "Reliability",
    omos_val_3_desc:
      "When we say we're ready, we're ready. We've built our reputation on keeping our word — every time.",
    omos_cta_h3: "Ready to put a X in the calendar?",
    omos_cta_desc:
      "Whether you need one extra pair of hands or a full team — we're ready.",
    omos_cta_btn: "Send a request",

    // YDELSER PAGE
    svc_cta_h3: "Ready to book a team?",
    svc_cta_desc:
      "Tell us about the project and we'll match you with the right people — fast and hassle-free.",
    svc_cta_btn: "Send a request",
    ydelser_why_eyebrow: "Why Kryds",
    ydelser_why_h2: "Why clients choose",
    ydelser_why_h2_yellow: "us",
    ydelser_why_1_title: "One point of contact",
    ydelser_why_1_desc:
      "You have one person to call — whether the task is renovation, garden work or stage build. We coordinate the whole crew.",
    ydelser_why_2_title: "Flexible team",
    ydelser_why_2_desc:
      "From one extra pair of hands to 20+ people on site. We scale up and down as you need — day by day or for the whole project.",
    ydelser_why_3_title: "Fast response",
    ydelser_why_3_desc:
      "We reply to every request within 2 hours on weekdays. Urgent need? We often mobilise the same day.",

    // TILMELD PAGE
    tilmeld_eyebrow: "For tradespeople",
    tilmeld_h1_1: "Join",
    tilmeld_h1_yellow: "Kryds",
    tilmeld_subtitle:
      "Create your profile and get access to construction and trade jobs in the Copenhagen area. You only become a Kryds employee when you say yes to a shift yourself — and the employment ends automatically when the job is done.",

    // TILMELD WIZARD
    tw_step_1: "Your details",
    tw_step_2: "Skills",
    tw_step_3: "CV & references",
    tw_step_4: "Contract & submit",
    tw_success_h3: "Thank you for signing up",
    tw_success_p1:
      "We've received your details and will get back to you as soon as possible.",
    tw_success_p2_1: "You can now log in at",
    tw_success_p2_2:
      "with your phone number and date of birth to see open shifts.",
    tw_s1_h2: "Who are you?",
    tw_s1_name_label: "Full name *",
    tw_s1_name_ph: "First name Last name",
    tw_s1_phone_label: "Phone *",
    tw_s1_phone_ph: "+45 00 00 00 00",
    tw_s1_email_label: "Email",
    tw_s1_email_ph: "you@mail.com",
    tw_s1_birth_label: "Date of birth *",
    tw_s1_birth_hint: "Used as access to your employee dashboard.",
    tw_s1_photo_label: "Profile picture (optional)",
    tw_s1_photo_uploading: "Uploading...",
    tw_s1_photo_change: "Change photo",
    tw_s1_photo_upload: "Upload photo",
    tw_s1_photo_registered: "Photo registered",
    tw_s2_h2: "Your skills",
    tw_s2_trade_label: "Primary trade *",
    tw_s2_trade_hint:
      "A bit of everything? Pick Handyman — our standard category.",
    tw_s2_skills_label: "Select your skills",
    tw_s2_custom_ph: "Add your own skill...",
    tw_s2_custom_btn: "Add",
    tw_s2_remove_aria: "Remove",
    tw_s2_exp_label: "Experience (years, places, projects)",
    tw_s2_exp_ph:
      "E.g. 5 years' experience as carpenter at XYZ, roofing on office buildings in Copenhagen...",
    tw_s3_h2: "CV & references",
    tw_s3_cv_label: "CV (PDF or image)",
    tw_s3_cv_uploading: "Uploading...",
    tw_s3_cv_change: "Change CV",
    tw_s3_cv_upload: "Upload CV",
    tw_s3_cv_registered: "CV registered",
    tw_s3_cv_view: "View",
    tw_s3_refs_label: "References",
    tw_s3_ref_add: "+ add reference",
    tw_s3_ref_name_ph: "Name",
    tw_s3_ref_phone_ph: "Phone",
    tw_s3_ref_company_ph: "Company",
    tw_s3_ref_relation_ph: "Relation (e.g. former manager)",
    tw_s3_ref_remove: "Remove reference",
    tw_s3_notes_label: "Notes for Kryds (optional)",
    tw_s3_notes_ph:
      "Special notes, availability, driving licence, own vehicle, etc.",
    tw_s4_h2: "Accept the contract",
    tw_s4_intro:
      "Read the contract carefully. By ticking the box you accept the terms of your employment with Kryds ApS. You are not bound to Kryds beyond the shifts you accept yourself.",
    tw_btn_back: "← Back",
    tw_btn_next: "Next →",
    tw_btn_submit: "Submit registration",
    tw_btn_sending: "Sending...",
    tw_err_upload: "Upload failed",
    tw_err_generic: "Something went wrong",
    tw_err_connection: "Could not connect to the server",

    // LEGAL PAGES (titles + intros)
    legal_eyebrow: "Legal",
    legal_h_handels: "Terms of trade",
    legal_h_privat: "Privacy policy",
    legal_h_cookie: "Cookie policy",
    legal_h_medarb_eyebrow: "Legal — Employees",
    legal_h_medarb: "Privacy policy for employees",
    legal_version_line: "Version v1-2026-04 · Effective from April 2026 · Kryds ApS, CVR 46369947",
    legal_version_privat: "Version v1-2026-04 · Effective from April 2026 · Last updated April 2026",
  },
};
