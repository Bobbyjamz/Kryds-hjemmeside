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
