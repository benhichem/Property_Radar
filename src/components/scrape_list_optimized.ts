import { Page } from "puppeteer";
import { ContactsWithPropertyInfo, FinalProperty, LienDocument, List } from "../index.types";
import { Utility } from "./utils";

import { Contacts, ContactsWithDocs } from "../index.types";
import { CheckValidListing } from "./filter";


import { PrepFilterFunction } from "./prepList";
import { logger } from "./logger";

async function GetContacts(page: Page): Promise<Array<Contacts>> {
  logger.info('Collecting Contacts ...')
  return new Promise(async (resolve) => {

    try {
      let contacts = await page.evaluate(() => {
        let ff: Array<Contacts> = []
        let contact_containers = [...document.querySelectorAll('div.x-container.sub-group.x-box-item.x-container-default')].filter(item => {
          return (item as HTMLElement).innerText.includes('Mailing')
        })

        let x = contact_containers.map((item) => {
          let mailing = ""
          let x = (item as HTMLElement).innerText.split('\n')
          x.map((item, index) => {
            if (item === "Mailing Address") {
              mailing = x[index + 1]
            }
          })
          ff.push({
            name: (item.querySelector('div.name') as HTMLElement)!.innerText!,
            address: mailing,
            containerId: item.id
          })
        })
        return ff
      })


      resolve(contacts)
    } catch (error) {
      console.log(error);
      return []
    }
  })
}


async function GetInvoluntaryPersonLien(page: Page, Contacts: Array<Contacts>): Promise<ContactsWithDocs[]> {
  // Array to store all promises
  logger.info('Collecting Documents ...');
  const promises = Contacts.map(async (person) => {
    try {
      let newObj: ContactsWithDocs = {
        address: person.address,
        containerId: person.containerId,
        name: person.name,
        documents: {
          banckrupcy: [],
          involuntaryliens: []
        }
      };

      const elements = await page.evaluate(async (containerid, person) => {
        const sleep = () => new Promise(r => setTimeout(r, 5000));

        function convertArrayToObject(arr: string[]): Record<string, string> {
          const result: Record<string, string> = {};
          for (let i = 0; i < arr.length; i += 2) {
            if (i + 1 < arr.length) {
              const key = arr[i]
                .toLowerCase()
                .replace(/[^a-zA-Z0-9 ]/g, '')
                .replace(/\s+(.)/g, (match, group1) => group1.toUpperCase())
                .replace(/\s/g, '');
              result[key] = arr[i + 1];
            }
          }
          return result;
        }

        async function ScrapeDocument() {
          try {
            const docLabels = [...document.querySelectorAll('label.x-component')]
              .filter(item => (item as HTMLElement).innerText.includes('Document Type'));

            if (docLabels.length === 0) return null;

            const docs = docLabels[0].id;
            const ds = document.querySelector(`#${docs}`);

            if (ds?.parentElement) {
              const documentToText = ds.parentElement.innerText.split('\n');
              return convertArrayToObject(documentToText);
            }
          } catch (error) {
            console.error('Error in ScrapeDocument:', error);
            return null;
          }
        }

        const documentd = document.querySelector(`#${containerid}`);
        if (!documentd) return person;

        const panels = documentd.querySelectorAll('div.x-panel.labeled-table-control.x-panel-default');

        // Convert forEach to for...of to properly handle async operations
        for (const item of panels) {
          const text = (item as HTMLElement).innerText;

          if (text.includes('Bankruptcy Cases') && !text.includes('No')) {
            const values = item.querySelector('tr')!.innerText.split('\n');
            person.documents.banckrupcy.push({
              caseNumber: values[0],
              recDate: values[2],
              status: values[6]
            });
          }

          if (text.includes('Involuntary Person Liens') && !text.includes('No')) {
            if (text.includes('Open')) {
              const rows = [...item.querySelectorAll('tr')];

              for (const row of rows) {
                const rowText = (row as HTMLElement).innerText;
                if (rowText.includes('Open')) {
                  row.click();
                  await sleep();

                  const docScraped = await ScrapeDocument();
                  if (docScraped) {
                    person.documents.involuntaryliens.push(docScraped as unknown as LienDocument);
                  }

                  const closeButton = document.querySelectorAll('span.x-btn-icon-el.x-btn-icon-el-default-toolbar-small.icon-pr-left')[1];
                  if (closeButton) {
                    (closeButton as HTMLElement).click();
                  }
                  await sleep();
                }
              }
            }
          }
        }

        return person;
      }, person.containerId, newObj);

      return elements;
    } catch (error) {
      console.error(`Error processing person ${person.name}:`, error);
      return null;
    }
  });

  // Wait for all promises to resolve
  const results = await Promise.all(promises);

  // Filter out null results from errors
  return results.filter((result): result is ContactsWithDocs => result !== null);
}



async function GetPropertyInfo(page: Page, Contacts: Array<ContactsWithDocs>) {
  try {
    let MoreInfo = await page.evaluate(() => {
      let equity = (document.querySelector('div:nth-child(3) > div:nth-child(2) > div.text-normal.positive') as HTMLElement) ? (document.querySelector('div:nth-child(3) > div:nth-child(2) > div.text-normal.positive') as HTMLElement).innerText : "N/A"
      let address = (document.querySelector('div > div:nth-child(2) > div.text-normal') as HTMLElement) ? (document.querySelector('div > div:nth-child(2) > div.text-normal') as HTMLElement).innerText : "N/A"
      return {
        address: address,
        equity: equity,
      }
    })
    let ReturnedValue: ContactsWithPropertyInfo = { address: MoreInfo.address, equity: MoreInfo.equity, contacts: Contacts, propertyurl: page.url() }
    return ReturnedValue
  } catch (error) {
    console.log(error)
    return { address: "N/A", equity: "N/A", contacts: Contacts, propertyurl: page.url() }
  }
}

export async function ScrapeCounty(page: Page) {
  try {
    return await page.evaluate(async () => {
      const sleep = () => new Promise(r => setTimeout(r, 5000));
      (document.querySelectorAll('a.x-tab')[1] as HTMLElement).click()
      await sleep()
      let countyId = [...document.querySelectorAll('label.x-component')].filter(item => (item as HTMLElement).innerText === "County")[0].id
      let countyContentID = eval(countyId.split('-')[1]) + 1
      let county = (document.querySelector(`#label-${countyContentID}`) as HTMLElement).innerText

      let ApnId = [...document.querySelectorAll('label.x-component')].filter(item => (item as HTMLElement).innerText === "Assessor Parcel Number")[0].id
      let ApnIdValue = eval(ApnId.split('-')[1]) + 1
      let Apn = (document.querySelector(`#label-${ApnIdValue}`) as HTMLElement).innerText
      return { county, Apn }
    })
  } catch (error) {
    console.log(error)
    return {
      county: "N/A",
      Apn: "N/A"
    }
  }
}

export async function MarkInterest(stars: 1 | 5, page: Page) {
  try {
    await page.evaluate((stars) => {
      (document.querySelector('div.x-panel.panel-property-details.x-column.x-panel-default')?.querySelectorAll('a.x-btn')[stars - 1] as HTMLElement).click()
    }, stars)
    return true
  } catch (error) {
    console.log(error)
    return false
  }
}

export async function CheckEmptyList(page: Page): Promise<boolean> {
  try {
    return await page.evaluate(() => {
      return document.querySelector('div.x-grid-empty') ? true : false
    })
  } catch (error) {
    console.log(error)
    return false
  }
}

export async function ScrapProperty(list: List, page: Page, update: boolean) {
  try {
    let finalReport = []
    if (update === false) {
      logger.info(`Generating Url for ${list.state}::${list.status}`)
      const url = new Utility().generateUrl(list)
      await page.goto(url, { timeout: 0, waitUntil: "networkidle2" })
      await new Utility().sleep(5000)
    }

    if (await CheckEmptyList(page)) return []
    await PrepFilterFunction(page)
    await page.waitForSelector('tr')
    await page.click('tr > td:nth-child(2)', { count: 2 })
    const pageCount: number = list.items_count
    await new Utility().sleep(5000)
    let done = 1

    while (done <= pageCount) {
      try {
        await page.evaluate(() => {
          (document.querySelectorAll('a.x-tab')[0] as HTMLElement).click()
        })
        await new Utility().sleep(5000)
        let contacts = await GetContacts(page)
        let listings = await GetInvoluntaryPersonLien(page, contacts)
        let PropertyInfo = await GetPropertyInfo(page, listings)
        console.log(PropertyInfo)
        let IsValid = await CheckValidListing(PropertyInfo)
        logger.info(`Listing Lead is :: ${IsValid} `)

        if (IsValid === true) {
          let countyAndApn = await ScrapeCounty(page)
          let FinalLook: FinalProperty = { ...PropertyInfo, county: countyAndApn.county, apn: countyAndApn.Apn, status: list.status }
          console.log(FinalLook)
          finalReport.push(FinalLook)
          logger.info('Marking 5 Stars ... ')
          await MarkInterest(5, page)
        } else if (IsValid === false) {
          logger.info('Marking 1 Start ... ')
          await MarkInterest(1, page)
        }
        await page.evaluate(() => {
          (document.querySelectorAll('span.x-btn-icon-el.x-btn-icon-el-default-small.x-btn-glyph')[1] as HTMLDivElement).click()
        })
        await new Utility().sleep(5000)
        done = done + 1
        if (done === list.items_count) {
          break;
        }
      } catch (error) {
        console.log(error)
      }
    }
    return finalReport
  } catch (error) {
    console.log(error)
    return []
  }
}

