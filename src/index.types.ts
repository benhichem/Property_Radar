import { LevelWithSilentOrString } from "pino";

export type List = {
  state: string;
  status: string;
  items_count: number
}


export type property_info = {
  Address: string;
  Equity: string;
  Interest_level: string;
  Contacts: Array<Contact>
}


export type Contact = {
  Name: string;
  Mailing_Address: string
}

export interface LienDocument {
  documentType: string;
  documentNumber: string;
  recordingDate: string;
  grantor: string;
  grantee: string;
  amount: string;
  lienFilingDate: string;
  propertyLienInterestRate: string;
  personLienStatus: string;
  lienContractDate: string;
  lienCourtCaseNumber: string;
}
export type documents = {
  banckrupcy: Array<banckrupcy>
  involuntaryliens: Array<LienDocument>
}

export interface ContactsWithDocs extends Contacts {
  documents: documents
}


export type banckrupcy = {
  caseNumber: string;
  recDate: string;
  status: string
}

export interface ContactsWithPropertyInfo {
  address: string;
  equity: string;
  contacts: Array<ContactsWithDocs>,
  propertyurl: string
}
export interface FinalProperty extends ContactsWithPropertyInfo {
  county: string;
  apn: string
  status: string
}
export interface Contacts {
  name: string;
  address: string
  containerId: string
}

export interface LeadSheet {
  Property_Address: string;
  Equity: string;
  Property_County: string;
  Property_APN: string;
  Lead_Type: string;
  Owners: Array<string> | string
}
export interface OwnerSheet {
  Id: string
  Owner_Name: string;
  Owner_Mailing: string;
  Documents: Array<string>
}

export interface DocumentSheet extends LienDocument {
  Id: string;
}

export interface KeywordGoogleSheets {
  id: string;
  keyword: string
}