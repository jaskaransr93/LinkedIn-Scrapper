# LinkedIn-Scrapper
LinkedIn Scrapper provides us an easy way to scrape the profiles based on the keywords that we will provide. Most of the functioning right now is through CLI only.

### Prerequisites
```
mysql 5.6
node v8.9.3
```

### Installing
This project involves just installing the node packages defined in the package.json

```
npm install
```

## Built With
* [puppeteer](https://pptr.dev/) - Headless Chrome Node API
* [sequelize](http://docs.sequelizejs.com/) - ORM used for MySQL

## Developement Guide
* index.js - Script to scrape the profile from linkedin based on the keywords
* creds.js - add your credentials to linkedIn here  
* wordCloud.js - POC for forming a word cloud based on the contents posted and liked by a profile
* linkedinUtil.js - Utility functions help to scrape the data
* userPage.js - Utility functions to scrape the user profiles
* chart_prototype.html - Base script to show the word cloud after we push the data to it
* concordance.js - will be used in textual anaylsis of text

## Acknowledgements
* Bo Pelech
* Goran Matic



