# Propertyradar

The application is designed to scrape data from PropertyRadar, leveraging pre-configured filters from the My Lists section. The workflow is as follows:

Scrape property listings based on predefined filters.
For each property, extract relevant information, including lien documents and only active bankruptcy filings.
After gathering this data, apply a custom filter to determine whether the property is valid or non-valid based on specific criteria.
Once the scraping process for each list is complete, the results are automatically exported to Google Sheets for easy review and further analysis.

## Table of Contents

- [Propertyradar](#param-githubrepo--replace------titlecase)
  - [Table of Contents](#table-of-contents)
  - [Installation](#installation)
  - [Usage](#usage)
  - [Contributing](#contributing)
  - [License](#license)
  - [Author](#author)

## Installation

Follow the steps detailed [here](./INSTALL.md).

# Installation Guide

To set up and run the application, follow these steps:

1. **Clone the Repository**

   Begin by cloning the repository to your local machine:

   ```bash
   git clone https://github.com/benhichem/propertyradar

   ```

2. **Install Dependencies**

Before running the application, make sure all necessary dependencies are installed.

Node.js
The application is built using Node.js. Follow the official guide to install Node.js and npm on your operating system:
https://radixweb.com/blog/installing-npm-and-nodejs-on-windows-and-mac

**Google Chrome**
Ensure that Google Chrome is installed on your machine. You can install it just like any other standard application by visiting the Google Chrome download page.

3. **Install Application Dependencies**
   Once you've cloned the repository and installed Node.js, navigate to the project directory in your terminal and run:

```bash
npm install

```

This will install all the required Node.js packages for the application to function properly.

## Usage

Find the usage patterns [here](./USAGE.md).

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

## Author

benhichem<<hichemben45@gmail.com>>
