import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth"

import { logger } from "./component/logger"
import { CheckLogin, LoginScript, ScrapeAllLists, Utility } from "./component";
import { ScrapProperty } from "./component/scrape_list_optimized";
import { DataControler } from "./component/datacontroler";

puppeteer.use(StealthPlugin())

async function Main() {
    try {
        const browser = await puppeteer.launch({
            headless: false,
            userDataDir: "./profile"
        })
        const page = await browser.newPage()
        await page.setViewport({ height: 900, width: 1600 })

        logger.info('Browser Instance Ready ...')
        const IsLogged = await CheckLogin(page)
        logger.info(`logger is Logged in : ${IsLogged}`)
        if (!IsLogged) {
            logger.info('starting Loggin Script ...')
            await LoginScript(page)
        }
        logger.info('starting Collecting Page Lists')
        let lists = await ScrapeAllLists(page)
        logger.info(`Collected ${lists.length} ...`)


        for (var i = 50; i <= 55; i++) {

            await page.goto('https://app.propertyradar.com/#!/myLists', { timeout: 0, waitUntil: "networkidle2" })
            await new Utility().sleep(5000)
            const NewItemCount = await page.evaluate((index) => {
                let newProperties = (Array.from(document.querySelectorAll('div.list-card'))[index].querySelector('span.newProperties') as HTMLElement)
                let number = newProperties.innerText.split(' ')[0]
                if (eval(number) > 0) {
                    newProperties.click()
                    return eval(number)
                } else {
                    return 0
                }
            }, i)
            console.log(`NewItemCount is :: ${NewItemCount}`)
            if (NewItemCount > 0) {
                await new Utility().sleep(5000);
                lists[i].items_count = NewItemCount
                let updates = await ScrapProperty(lists[i], page, true)
                await DataControler(updates);
            } else {
                continue
            }

        }
        // clean up Process 
        await page.close();
        await browser.close();

    } catch (error) {
        logger.error(error)
    }
}


process.on('uncaughtException', (err) => {
    console.log(err)
})

process.on('unhandledRejection', (err) => {
    console.log(err)
})

Main()
