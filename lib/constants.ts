export const TRADES = {
  HANDYMAN: "Handyman",
  BYGGEHJAELPER: "Byggehjælper",
  TOMRER: "Tømrer",
  MURER: "Murer",
  MALER: "Maler",
  ELEKTRIKER: "Elektriker",
  VVS: "VVS'er",
  STRUKTOR: "Struktør",
  NEDRIVER: "Nedriver",
  MONTOR: "Montør",
  HAVEMAND: "Have- & anlægsgartner",
  RENGORING: "Rengøring",
  CHAUFFOR: "Chauffør",
} as const;

export type TradeKey = keyof typeof TRADES;

export const EMPLOYEE_TYPES = {
  MEDARBEJDER: "Medarbejder",
  KOORDINATOR: "Koordinator",
} as const;

export const EMPLOYEE_STATUS = {
  LEDIG: "Ledig",
  UDSENDT: "Udsendt",
  INAKTIV: "Inaktiv",
} as const;

export const SHIFT_STATUS = {
  OPEN: "Åben",
  FILLED: "Besat",
  CANCELLED: "Aflyst",
  COMPLETED: "Afsluttet",
} as const;

export const SKILL_SUGGESTIONS = [
  "Gipsloft",
  "Gulvlægning",
  "Fliselægning",
  "Murerarbejde",
  "Betonarbejde",
  "Tagarbejde",
  "Isolering",
  "Vinduesmontering",
  "Dørmontering",
  "Køkkenmontering",
  "Badeværelse",
  "Spartling",
  "Maling indendørs",
  "Maling udendørs",
  "Facaderenovering",
  "Nedrivning",
  "Oprydning byggeplads",
  "Stillads",
  "Haveanlæg",
  "Beskæring",
  "Flisebelægning udendørs",
  "Transport",
  "Truckkørsel",
  "Kørekort B",
];
