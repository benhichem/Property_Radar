# Usage

The application consists of two primary scripts:

1. **Lead Scraper**: This script scrapes and validates all historical leads from the lists. It then uploads the data to Google Sheets. You only need to run this script **once**, as it will collect and process all available leads up to the current date.

   To execute the lead scraper:

   ```bash
   npm run start
   ```

2. **Lead Monitor**: This script continuously monitors and captures any new leads that appear on the listings. Unlike the first script, this one should be run **periodically** to keep track of incoming leads.

   To execute the lead monitor:

   ```bash
   npm run start:monitor
   ```

# Testing

To ensure the application is set up correctly, run the following command to perform a basic test:

```bash
npm run start:test
```
