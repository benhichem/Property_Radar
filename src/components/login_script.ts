import { Page } from "puppeteer";
import { logger } from "./logger";
import dotenv from "dotenv"
dotenv.config()


export async function LoginScript(page: Page): Promise<boolean> {
  try {
    await page.goto('https://app.propertyradar.com/', { timeout: 0, waitUntil: "networkidle2" })
    let email = await page.waitForSelector("input[type='email']",
      { timeout: 30000 }).catch((error) => {
        logger.error("Email input did not load ...")
        return null
      })

    if (email === null) {
      throw new Error("Email Selector Did NOT SHOW")
    } else {
      await page.type("input[type='email']", process.env.email!, { delay: 100 })
      await page.type("input[type='password']", process.env.password!, { delay: 110 })

      // check RemeberMe Box 
      await page.click('input[name="rememberLogin"]')

      // click login button. 
      await page.click('#button-1017-btnEl')
      await page.waitForNetworkIdle({ idleTime: 4000 })
      return true
    }
  } catch (error) {
    logger.error(error)
    throw error
  }
}
