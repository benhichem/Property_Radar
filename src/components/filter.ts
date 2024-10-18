import { ContactsWithPropertyInfo } from "../index.types";
import { Utility } from "./utils";
import { logger } from "./logger";

export async function CheckValidListing(propertyInfo: ContactsWithPropertyInfo) {
  const keywords = await new Utility().loadKeyWords();

  let validListing = true;
  // Early return if no contacts
  if (!propertyInfo.contacts.length) return validListing;
  // Get the first contact's documents
  const firstContact = propertyInfo.contacts[0];
  const bankruptcyDates = firstContact.documents.banckrupcy.map(b => b.recDate);
  const liens = firstContact.documents.involuntaryliens;


  console.log("BanckrupcyDates :: ", bankruptcyDates)
  console.log("Liens", liens)

  // Convert liens to the format we need to check
  const papers = liens.map(lien => ({
    Date_Rec: lien.recordingDate,
    GrantedBy: lien.grantor,
    Amount: lien.amount
  }))

  if (bankruptcyDates.length === 0) {
    // Check if any lien grantor contains invalid keywords
    for (const paper of papers) {
      const loanWords = paper.GrantedBy.split(' ');
      if (loanWords.some(word => keywords.includes(word.toLowerCase()))) {
        validListing = false;
        break;
      }
    }
  } else {
    // Convert dates to timestamps for comparison
    const bankruptcyTimestamps = bankruptcyDates.map(date => new Date(date).getTime());
    const paperTimestamps = papers.map(paper => new Date(paper.Date_Rec).getTime());

    // Check if ANY bankruptcy date is after ANY paper date
    const isValid = bankruptcyTimestamps.some(bankruptcyTime =>
      paperTimestamps.some(paperTime => bankruptcyTime > paperTime)
    );

    if (isValid) {
      logger.info('At least one bankruptcy date is after a paper date');
      validListing = false;
    } else {
      console.log('No bankruptcy dates occur after any paper dates');
      validListing = false;
    }
  }
  return validListing;
}
