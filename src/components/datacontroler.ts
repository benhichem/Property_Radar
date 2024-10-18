import { FinalProperty } from "../index.types";
import { constants } from "./constants";
import { ExportDocument, ReadingLastID } from "./g_sheet";



function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithRetry<T>(fn: () => Promise<T>, retries = 3): Promise<T> {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            return await fn(); // Try executing the API call or document export
        } catch (error: any) {
            if (error.response?.status === 429) {
                console.log(`429 error detected. Waiting for 1 minute before retrying... (Attempt ${attempt}/${retries})`);
                await sleep(60000); // Wait for 1 minute
            } else {
                console.log(`Error: ${error.message}`);
                throw error; // Rethrow non-429 errors
            }
        }
    }
    throw new Error(`Failed after ${retries} retries.`);
}



async function DataControler(dataScraped: Array<FinalProperty>) {
    let LeadlastID = await ReadingLastID(constants.ownerSheetID, 0)
    for (var i = 0; i < dataScraped.length; i++) {
        const docs: Array<any> = []
        const leads: Array<any> = []
        const element = dataScraped[i];
        // we need to get the LeadID Here
        for (var owner = 0; owner < element.contacts.length; owner++) {
            const PresentOwner = element.contacts[owner]
            const ownerObject = {
                Lead_ID: LeadlastID,
                Owner_ID: owner + 1,
                Owner_Name: PresentOwner.name,
                Property_Address: element.address,
                Property_APN: element.apn,
                Property_County: element.county,
                Property_Type: element.status,
                Owner_Mailing: PresentOwner.address,
                Equity: element.equity,
                documents: PresentOwner.documents.involuntaryliens
            }
            leads.push(ownerObject)


            //Document Number	Document Type	Lien Statu
            for (var document = 0; document < PresentOwner.documents.involuntaryliens.length; document++) {
                let docxy = PresentOwner.documents.involuntaryliens[document]
                const doc = {
                    Lead_ID: LeadlastID,
                    Owner_ID: owner + 1,
                    Grantor: docxy.grantor,
                    Grantee: docxy.grantee,
                    Recording_Date: docxy.recordingDate,
                    Amount: docxy.amount,
                    Lien_Court_Case_Number: docxy.lienCourtCaseNumber,
                    Document_Number: docxy.documentNumber,
                    Document_Type: docxy.documentType,
                    Lien_Status: docxy.personLienStatus
                }
                docs.push(doc)
            }
        }
        LeadlastID = LeadlastID + 1
        await fetchWithRetry(async () => {
            await ExportDocument(leads, ['Lead_ID', "Owner_ID", "Owner_Name", "Owner_Mailing", "Property_Address", "Property_APN", "Property_County", "Property_Type", "Equity"], constants.ownerSheetID, 0)
        })
        //        await ExportDocument(leads, ['Lead_ID', "Owner_ID", "Owner_Name", "Property_Address", "Property_APN", "Property_County", "Property_Type"], constants.ownerSheetID, 0)
        await fetchWithRetry(async () => {
            await ExportDocument(docs, ["Lead_ID", "Owner_ID", "Grantor", "Grantee", "Recording_Date", "Amount", "Lien_Court_Case_Number", "Document_Number", "Document_Type", "Lien_Status"], constants.ownerSheetID, 1)
        })
    }
}


export {
    DataControler
}




/* 
import fs from "node:fs";

(async () => {

    let testSample = JSON.parse(fs.readFileSync('report.json').toString());
    await DataControler(testSample.properties)

})() */