import { Page } from "puppeteer";
import { logger } from "./logger";
import { Utility } from "./utils";

export async function PrepFilterFunction(page: Page) {
  try {
    await new Utility().sleep(5000)
    await page.evaluate(() => {
      let FilterThing = Array.from(document.querySelectorAll('span.x-btn-inner.x-btn-inner-default-small')).filter(item => (item as HTMLElement).innerText === "Filter")
      if (FilterThing.length > 0) {
        (FilterThing[0] as HTMLElement).click()
      }
    })
    await new Utility().sleep(5000);
    let interestLevelID = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('a')).filter(item => item.innerText === "Interest Level")[0].id
    })
    logger.info(`Interet Level ID Is : ${interestLevelID}`);
    await page.click(`#${interestLevelID}`, { delay: 100 })
    await new Utility().sleep(5000)
    await page.evaluate(() => {
      const wordd = "ratingStarMenuItem";
      const selector = `[id*="${wordd}"]`;
      const elements = document.querySelectorAll(selector);
      (elements[15] as HTMLElement).click()
    })
    await new Utility().sleep(5100)
    return
  } catch (error) {
    logger.info('Failed To Prep List');
    logger.error(error)
    return
  }
}
