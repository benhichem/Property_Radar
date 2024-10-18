import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth"

import { LoginScript, Utility, CheckLogin, ScrapeAllLists, AppDatasource } from "./component";
import { logger } from "./component/logger";
import { DataSource } from "typeorm";
import { List } from "./component/lists.model";
import { ScrapProperty } from "./component/scrape_list_optimized";
import { DataControler } from "./component/datacontroler";
puppeteer.use(StealthPlugin())

async function Main() {
  let database_connection: DataSource = await AppDatasource
    .then((datasource) => {
      logger.info('Database Connection Established ...')
      return datasource
    })
    .catch((error) => {
      logger.error('Failed to connect to local databaase ...')
      throw error
    })

  const browser = await puppeteer.launch({
    headless: false,
    userDataDir: "./profile1"
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

  for (var i = 0; i <= lists.length; i++) {
    const UserRepo = database_connection.getRepository(List)
    const INDB = await UserRepo.findOne({ where: { state: lists[i].state, status: lists[i].status } })
    if (INDB) {
      logger.info('Item Allready Scraped Moving On ...')
      continue;
    } else {
      let Leads = await ScrapProperty(lists[i], page, false)
      console.log(Leads);
      await DataControler(Leads);
      const SaveListToDb = new List();
      SaveListToDb.item_count = lists[i].items_count;
      SaveListToDb.state = lists[i].state;
      SaveListToDb.status = lists[i].status;
      await database_connection.manager.save(SaveListToDb)
    }
  }
  // clean up Process 
  await page.close();
  await browser.close();
}



process.on('uncaughtException', (err) => {
  console.log(err)
})

process.on('unhandledRejection', (err) => {
  console.log(err)
})

Main()
