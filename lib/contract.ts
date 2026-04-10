export const CONTRACT_VERSION = "v1-2026-04";

export interface ContractPoint {
  title: string;
  body: string;
}

export function getContractPoints(employeeName: string): ContractPoint[] {
  const safeName = employeeName.trim() || "[medarbejderens navn]";
  return [
    {
      title: "1. Parter",
      body: `Denne aftale indgås mellem Kryds ApS, CVR-nr. 46369947, Kontakt@KrydsByg.com (herefter "Kryds") og medarbejderen ${safeName} (herefter "Medarbejderen").`,
    },
    {
      title: "2. Ansættelsesforholdets karakter",
      body: "Medarbejderen er IKKE fastansat hos Kryds. Ansættelsesforholdet opstår først, når Medarbejderen skriftligt eller mundtligt accepterer en konkret opgave via Kryds' vagtsystem, og ophører automatisk, når den konkrete opgave er afsluttet. Mellem opgaver eksisterer der intet ansættelsesforhold, og ingen af parterne har nogen gensidige forpligtelser.",
    },
    {
      title: "3. Vederlag",
      body: "Vederlaget for den enkelte opgave aftales specifikt forud for opgavens start og fremgår af vagtens beskrivelse. Lønnen udbetales månedligt til det kontonummer, som Medarbejderen oplyser. A-skat, AM-bidrag og feriepenge afregnes af Kryds iht. gældende dansk lovgivning.",
    },
    {
      title: "4. Arbejdstid, mødetid og udstyr",
      body: "Arbejdstid, mødested og forventet varighed fremgår af den enkelte vagt. Medarbejderen forpligter sig til at møde rettidigt, i passende arbejdstøj og med eget håndværktøj, medmindre andet udtrykkeligt er aftalt med Kryds' koordinator.",
    },
    {
      title: "5. Afbud og udeblivelse",
      body: "Afbud til en accepteret vagt skal ske senest 24 timer før vagtens start. Gentagne afbud med kort varsel eller udeblivelser uden gyldig grund medfører udelukkelse fra fremtidige opgaver via Kryds.",
    },
    {
      title: "6. Sikkerhed og arbejdsmiljø",
      body: "Medarbejderen skal til enhver tid overholde Arbejdstilsynets regler, bære det påkrævede sikkerhedsudstyr og følge instruktioner fra Kryds' koordinator samt den byggepladsansvarlige på det konkrete projekt. Manglende overholdelse kan medføre øjeblikkelig afbrydelse af opgaven.",
    },
    {
      title: "7. Tavshedspligt",
      body: "Medarbejderen har tavshedspligt om alle forhold vedrørende Kryds' kunder, projekter, priser og interne forretningsforhold, som Medarbejderen får kendskab til i forbindelse med arbejdet. Tavshedspligten gælder også efter ansættelsens ophør.",
    },
    {
      title: "8. Ansvar og forsikring",
      body: "Kryds har tegnet lovpligtig arbejdsskadeforsikring, der dækker Medarbejderen under udførelse af arbejdet. Medarbejderen er selv ansvarlig for skader, der er forvoldt ved forsætlig eller groft uagtsom adfærd, herunder under påvirkning af alkohol eller euforiserende stoffer.",
    },
    {
      title: "9. Skat, feriepenge og pension",
      body: "Medarbejderen aflønnes som lønmodtager. Kryds indberetter og afregner A-skat, AM-bidrag og feriepenge iht. gældende dansk lovgivning. Der optjenes ikke pension via denne aftale, medmindre dette er specifikt aftalt skriftligt.",
    },
    {
      title: "10. Behandling af persondata (GDPR)",
      body: "Kryds behandler Medarbejderens personoplysninger (herunder navn, kontaktinfo, CPR/fødselsdato, CV, billeder og lønoplysninger) iht. databeskyttelsesforordningen (GDPR) og databeskyttelsesloven. Data opbevares i op til 3 år efter sidste udførte opgave og slettes derefter. Medarbejderen har til enhver tid ret til indsigt, berigtigelse og sletning ved henvendelse til Kontakt@KrydsByg.com.",
    },
    {
      title: "11. Misligholdelse",
      body: "Ved væsentlig misligholdelse – herunder brud på tavshedspligten, gentagne udeblivelser, tyveri, vold, chikane, beruselse på arbejdet eller andre alvorlige forhold – kan Kryds ophæve samarbejdet med øjeblikkelig virkning og kræve erstatning efter dansk rets almindelige regler.",
    },
    {
      title: "12. Lovvalg og værneting",
      body: "Aftalen er underlagt dansk ret. Enhver tvist, der måtte opstå i forbindelse med aftalen, skal afgøres ved Københavns Byret som første instans.",
    },
    {
      title: "13. Accept",
      body: "Ved at sætte flueben nedenfor bekræfter Medarbejderen at have læst, forstået og accepteret samtlige 13 punkter i denne aftale.",
    },
  ];
}

export const ACCEPT_LABEL =
  "Jeg har læst og accepterer kontraktens 13 punkter. Jeg forstår, at jeg KUN er medarbejder hos Kryds, mens en konkret opgave løber, og at ansættelsen automatisk ophører, når opgaven slutter.";

/* =====================================================
   KUNDEKONTRAKT — vilkår for leje af vikar
===================================================== */

export const CUSTOMER_CONTRACT_VERSION = "v1-2026-04";

export function getCustomerContractPoints(customerName: string): ContractPoint[] {
  const safeName = customerName.trim() || "[kundens navn/virksomhed]";
  return [
    {
      title: "1. Parter",
      body: `Denne aftale indgås mellem Kryds ApS, CVR-nr. 46369947, Kontakt@KrydsByg.com (herefter "Kryds") og ${safeName} (herefter "Kunden"). Aftalen regulerer Kundens leje af vikar/mandskab fra Kryds til konkrete opgaver.`,
    },
    {
      title: "2. Ydelsens karakter",
      body: "Kryds stiller kvalificeret mandskab til rådighed for Kunden i et aftalt tidsrum til en konkret opgave. Vikarerne forbliver ansat af Kryds, og der opstår intet ansættelsesforhold mellem Kunden og den enkelte vikar. Kunden har instruktionsbeføjelse over det daglige arbejde på pladsen.",
    },
    {
      title: "3. Priser og betaling",
      body: "Timepriser fremgår af det fremsendte tilbud og/eller Kryds' gældende prisliste. Alle priser er ekskl. moms. Faktura udstedes efter endt uge eller opgave med betalingsfrist 8 dage netto. Ved for sen betaling påløber renter iht. renteloven samt et rykkergebyr på kr. 100 pr. rykker.",
    },
    {
      title: "4. Bestilling, ændringer og afbestilling",
      body: "Bestillinger er bindende, når de er skriftligt bekræftet af Kryds. Afbestilling eller reduktion af bestilt mandskab senere end 24 timer før mødetidspunkt faktureres med 50 % af den aftalte pris for den pågældende dag. Afbestilling på selve mødedagen faktureres fuldt ud.",
    },
    {
      title: "5. Arbejdsmiljø og sikkerhed på pladsen",
      body: "Kunden er som den byggepladsansvarlige forpligtet til at sikre, at arbejdsmiljølovens regler overholdes på arbejdsstedet, herunder at stille nødvendigt sikkerhedsudstyr til rådighed, når dette ikke er standardudstyr som vikaren selv medbringer, og at instruere vikaren i pladsens særlige forhold. Kunden hæfter for skader, der skyldes mangelfuld instruktion eller usikre arbejdsforhold på pladsen.",
    },
    {
      title: "6. Værktøj og materialer",
      body: "Kryds' vikarer medbringer alment håndværktøj, medmindre andet er aftalt. Specialværktøj, maskiner, stilladser, lift, materialer og forbrugsstoffer stilles til rådighed af Kunden. Kunden hæfter for tab eller skade på eget udstyr, medmindre skaden er forvoldt ved vikarens forsætlige eller groft uagtsomme adfærd.",
    },
    {
      title: "7. Ansvar og forsikring",
      body: "Kryds har tegnet lovpligtig arbejdsskadeforsikring samt erhvervsansvarsforsikring, der dækker skader forvoldt af vikaren under udførelse af arbejdet. Kryds' ansvar er begrænset til direkte skader og kan maksimalt udgøre det fakturerede beløb for den konkrete opgave. Kryds hæfter ikke for indirekte tab, herunder driftstab, avancetab eller dagbøder.",
    },
    {
      title: "8. Reklamation",
      body: "Reklamation over udført arbejde eller mandskab skal ske skriftligt til Kontakt@KrydsByg.com senest 3 hverdage efter opgavens afslutning. Berettigede reklamationer afhjælpes ved omlevering af mandskab eller forholdsmæssigt afslag i prisen efter Kryds' valg.",
    },
    {
      title: "9. Solohvervningsforbud",
      body: "Kunden må ikke i en periode på 6 måneder efter sidste arbejdsdag ansætte eller indgå aftaler direkte med en vikar, som Kryds har stillet til rådighed, uden for Kryds' system. Overtrædelse udløser en konventionalbod på kr. 50.000 pr. overtrædelse, dog mindst svarende til 3 måneders fakturerede ydelser for den pågældende vikar.",
    },
    {
      title: "10. Tavshedspligt og persondata",
      body: "Begge parter har tavshedspligt om den anden parts forretningsmæssige forhold. Persondata behandles iht. GDPR og databeskyttelsesloven. Kryds videregiver kun nødvendige oplysninger om vikaren til Kunden med henblik på opgavens udførelse.",
    },
    {
      title: "11. Force majeure",
      body: "Ingen af parterne er ansvarlige for manglende opfyldelse som følge af forhold uden for parternes kontrol, herunder strejker, lockout, brand, oversvømmelse, epidemi, krig, myndighedsindgreb eller lignende ekstraordinære omstændigheder.",
    },
    {
      title: "12. Lovvalg og værneting",
      body: "Aftalen er underlagt dansk ret. Enhver tvist, der måtte opstå i forbindelse med aftalen, skal afgøres ved Københavns Byret som første instans.",
    },
    {
      title: "13. Accept",
      body: "Ved at sætte flueben nedenfor bekræfter Kunden at have læst, forstået og accepteret samtlige punkter i denne aftale og ønsker at anmode Kryds om et konkret tilbud på bemanding.",
    },
  ];
}

export const CUSTOMER_ACCEPT_LABEL =
  "Jeg har læst og accepterer Kryds' kundevilkår. Jeg forstår, at vikaren forbliver ansat af Kryds, og at jeg som kunde har instruktionsbeføjelse og sikkerhedsansvar på arbejdsstedet.";
