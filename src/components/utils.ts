import { Page } from "puppeteer";
import { List } from "../index.types";
import cron from "node-cron"
import fs from "node:fs"
import { logger } from "./logger";
import crypto from "node:crypto"
import { ReadingKeyWordList } from "./g_sheet";

interface PaperRecord {
  Date_Rec: string;
  GrantedBy: string;
  Amount: string;
}

interface PaperData {
  Paper: PaperRecord[];
}
interface UtilityClass {
  Cron(p: () => Promise<any>): Promise<void>
  checkList(list: List, old_list: Array<List>): Promise<Array<List>>
  generateUrl(list: List): string
  sleep(ms: number): Promise<void>
  loadKeyWords(): Promise<Array<string>>
}

export class Utility implements UtilityClass {
  async loadKeyWords(): Promise<Array<string>> {
    try {
      let keywordsToString: Array<string> = []
      let keywords = await ReadingKeyWordList()
      keywords.map((item) => {
        keywordsToString.push(item.keyword.toLowerCase().trim())
      })
      return keywordsToString
    } catch (error) {
      throw error
    }
  }
  async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  generateUrl(list: List): string {
    const baseUrl = 'https://app.propertyradar.com/#!/myLists/';
    const formattedString = `${list.state} (${list.status})`;
    const encodedString = encodeURIComponent(formattedString);
    return baseUrl + encodedString;
  }


  async IsValidListing(papers: Array<{ Date_Rec: string; GrantedBy: string; Amount: string }>, bankruptcyDates: Array<string>): Promise<boolean> {
    const keywords = await this.loadKeyWords()
    let validListing = true;
    if (bankruptcyDates.length === 0) {
      // we only check if the the things are valid
      for (var i = 0; i < papers.length; i++) {
        const loan = papers[i].GrantedBy.split(' ')
        for (let index = 0; index < loan.length; index++) {
          const element = loan[index];
          if (keywords.includes(element.toLowerCase())) {
            validListing = false
            break;
          }
        }
      }
    } else if (bankruptcyDates.length !== 0) {
      // Convert paper dates to timestamps
      const bankruptcyTimestamps = bankruptcyDates.map(date => new Date(date).getTime());

      const paperTimestamps = papers.map(paper => new Date(paper.Date_Rec).getTime());
      // Check if ANY bankruptcy date is after ANY paper date
      let isValid = bankruptcyTimestamps.some(bankruptcyTime =>
        paperTimestamps.some(paperTime => bankruptcyTime > paperTime)
      );
      if (isValid) {
        logger.info('At least one bankruptcy date is after a paper date')
        validListing = false
      } else {
        console.log('No bankruptcy dates occur after any paper dates');
        validListing = false
      }
    }
    return validListing
  }



  checkList(list: List, old_list: Array<List>): Promise<Array<List>> {
    throw new Error("Method not implemented.");
  }

  async Cron(p: () => Promise<any>): Promise<void> {
    //TODO: Craete 1 Day Cron
    // Schedule a task to run once a day at 9:00 AM
    cron.schedule('0 9 * * *', async () => {
      console.log('Running the daily task at 9:00 AM');
      // Your daily task logic goes here
      await p()
    });
  }

  /**
   * Generates a small random ID using the current system time and random characters.
   * @param {number} [randomLength=4] - The number of random characters to append (default is 4).
   * @returns {string} A string containing a timestamp and random characters.
   */
  generateTimeBasedId(randomLength = 4) {
    // Get current timestamp
    const timestamp = Date.now();

    // Convert timestamp to base36 (numbers + lowercase letters) for compactness
    const timeString = timestamp.toString(36);

    // Generate random bytes
    const randomBytes = crypto.randomBytes(randomLength);

    // Convert random bytes to hex string and take the required length
    const randomString = randomBytes.toString('hex').slice(0, randomLength);

    // Combine timestamp and random string
    return `${timeString}-${randomString}`;
  }
}


interface IFile {
  Read<T>(path: string): Promise<T>
}

export class File implements IFile {
  Read<T>(path: string): Promise<T> {
    throw new Error("Method not implemented.");
  }
  async write(path: string, data: { name: string; address: string; documentUrl: string }) {
    let x: { properties: Array<any> } = JSON.parse(fs.readFileSync('report.json').toString())
    x.properties.push(data)
    await fs.writeFileSync("report.json", JSON.stringify(data))
  }
}


export async function CheckLogin(page: Page): Promise<boolean> {
  try {
    await page.goto('https://app.propertyradar.com/#!/myLists/', { timeout: 0, waitUntil: "networkidle2" })
    return await page.waitForSelector('div.list-card').then(() => {
      return true
    }).catch(() => {
      return false
    })
  } catch (error) {
    throw error
  }
}