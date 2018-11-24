const puppeteer = require('puppeteer');
const linkedIn = require('./linkedinUtil');
const userPageUtil = require('./userPage');
const Sequelize = require('sequelize');
var _ = require('lodash');

const sequelize = new Sequelize('injurylawyers', 'root', 'admin', {
    host: 'localhost',
    dialect: 'mysql',
    port: 3306,
    pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
    },

    // http://docs.sequelizejs.com/manual/tutorial/querying.html#operators
    operatorsAliases: false
});

// models
const Profile = sequelize.import(__dirname + "/models/profile");
const Websites = sequelize.import(__dirname + "/models/website");
const PhoneNumbers = sequelize.import(__dirname + "/models/phoneNumber");
const Emails = sequelize.import(__dirname + "/models/email");
const Skills = sequelize.import(__dirname + "/models/skill");
const RecommendationsGiven = sequelize.import(__dirname + "/models/recommendationsGiven");
const RecommendationsReceived = sequelize.import(__dirname + "/models/recommendationsReceived");

sequelize.sync();

const CREDS = require('./creds');

const LIST_USERNAME_SELECTOR = '.search-results__list > .search-result:nth-child(INDEX) .actor-name';
const LINK_USERNAME_SELECTOR = '.search-results__list > .search-result:nth-child(INDEX) .search-result__result-link';
const ALL_LINK_USERNAME_SELECTOR = '.search-results__list > .search-result .search-result__result-link';

const LENGTH_SELECTOR_CLASS = 'search-result__occluded-item';

const USER_PAGE_ERROR_ACTION = '.error-action';
const SEARCH_INPUT = '.nav-search-bar input';

// Mortgage Architects
//Dominion 
const keywords = encodeURI('personal injury');
const searchUrl = `https://www.linkedin.com/search/results/index/?keywords=${keywords}&origin=GLOBAL_SEARCH_HEADER`;

const COMPANIES = [
    'ESB Lawyers LLP',
    'Hooper Law',
    'McLeish Orlando LLP',
    'PJKJ Law Professional Corporation',
    'Mann Lawyers LLP',
    'Wellenreiter LLP',
    'Patrick B Higgerty Professional Corporation',
    'Central Law',
    'Pelton Law',
    'Kelly + Singh Lawyers LLP'
];

let badCompanies = [];

async function run() {
    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: {
            width: 1600,
            height: 900
        }
    });
    const page = await browser.newPage();
    await linkedIn.login(page, CREDS[0]);
    await page.waitFor(5 * 1000);
    // await page.waitForNavigation();
    await page.goto(searchUrl);
    await page.waitFor(5 * 1000);

    let numPages = await getNumPages(page);
    console.log('Numpages: ', numPages);

    var links = [];
    for (let h = 1; h <= 60; h++) {

        let pageUrl = searchUrl + '&page=' + h;
        await page.goto(pageUrl);
        await page.waitFor(1000 * 10);

        console.log('Opened Page number: ' + h);

        await linkedIn.autoScroll(page);

        let links_sel = await page.evaluate((sel, _) => {
            let links = document.querySelectorAll(sel);
            let links_sel = [];

            for (var i = 0; i < links.length; i++) {
                links_sel.push(links[i].href.trim())
            }
            return links_sel;
        }, ALL_LINK_USERNAME_SELECTOR, _);

        links = links.concat(links_sel);
    }

    links = _.uniq(links);

    await linkedIn.logout(page);
    
    links = _.chunk(links, 100);

    for (i = 0; i < links.length; i++) {
        await linkedIn.login(page, CREDS[i]);
        await page.waitFor(1000 * 5);
        await collect_user_data(links[i], page, browser);
        await linkedIn.logout(page);
    }

    browser.close();
}

async function getNumPages(page) {
    const NUM_USER_SELECTOR = '.search-results__total';

    let inner = await page.evaluate((sel) => {
        let html = document.querySelector(sel).innerHTML;
        // format is: "69,803 users"
        return html.replace(',', '').replace('Showing', '').replace('results', '').trim();
    }, NUM_USER_SELECTOR);

    let numUsers = parseInt(inner);

    console.log('num of results : ', numUsers);

    let numPages = Math.ceil(numUsers / 10);
    return numPages;
}

async function collect_user_data(links, userPage, browser) {
    // bulk entering to database
    var profile_records = [];
    var website_records = [];
    var phonenumbers_records = [];
    var email_records = [];
    var recommendation_given_records = [];
    var recommendation_received_records = [];
    var skill_records = [];


    for (let i = 0; i <= links.length; i++) { //listLength
        try {
            // change the index to the next child
            // let usernameSelector = LIST_USERNAME_SELECTOR.replace("INDEX", i);
            // let emailSelector = LIST_EMAIL_SELECTOR.replace("INDEX", i);

            // let username = await page.evaluate((sel) => {
            //     if (!document.querySelector(sel)) return '';
            //     return document.querySelector(sel).innerText.trim().replace(/([\uE000-\uF8FF]|\uD83C[\uDF00-\uDFFF]|\uD83D[\uDC00-\uDDFF])/g, '') // replace emoticons which can't be stored in db;
            // }, usernameSelector);

            // if (username === 'LinkedIn Member' || username === '') continue; // skip hidden members

            // console.log('User name: ' + username);

            // let linkSelector = LINK_USERNAME_SELECTOR.replace("INDEX", i);


            let href = links[i];

            console.log('Href:' +  href);


            try {
                await userPage.goto(href);
            } catch (e) {
                console.error('Exception: ' + e, userPage.url());
                try {
                    await userPage.reload({
                        timeout: 20000,
                        waitUntil: 'networkidle2'
                    });
                } catch (e) {
                    console.error('Couldn\'t reload page: ' + userPage.url());
                }
            }

            let username = await userPageUtil.getName(userPage);

            let id = href.split('/')[4];

            await userPage.waitFor(1000 * 10);

            await linkedIn.autoScroll(userPage);

            // Location 
            let location = await userPageUtil.getLocation(userPage);
            console.log(username + ' - got location');

            // Title
            let title = await userPageUtil.getTitle(userPage);
            console.log(username + ' - got title - ' + title);

            // Currenlty Employed At
            let current_emp = await userPageUtil.getCurrentEmployement(userPage);
            console.log(username + ' - got current_emp');

            // Get the number of the connections
            let connections = await userPageUtil.getConnections(userPage);
            console.log(username + ' - got connections');


            // Click on the contact info button
            await userPageUtil.openContactModal(userPage);


            // Get LinkedIn URL
            let linkedInUrl = await userPageUtil.getLinkedinURL(userPage);
            console.log(username + ' - got linkedin URL');

            // Get available websites
            let websites = await userPageUtil.getWebsites(userPage);
            console.log(username + ' - got websites');

            // Get twitter URL
            let twitterURL = await userPageUtil.getTwitterURL(userPage);
            console.log(username + ' - got twitter URL');

            // Get phone
            let phone = await userPageUtil.getPhone(userPage);
            console.log(username + ' - got phone');

            // Get Email
            let email = await userPageUtil.getEmail(userPage);
            console.log(username + ' - got email');

            // close the connection modal
            await userPageUtil.closeContactModal(userPage);
            console.log(username + ' - modal closed');

            let isMoreSkillsVisible = await userPageUtil.isMoreSkillsVisible(userPage);

            if (isMoreSkillsVisible) {
                // Open all the skills
                await userPageUtil.clickShowMoreSkills(userPage);
            }



            let skills = await userPageUtil.getSkills(userPage);
            console.log(username + ' - got skills');

            let recommendations_given = [], recommendations_received = [];
            let isRecommendationVisible = await userPageUtil.isRecommendationSectionVisible(userPage);
            if (isRecommendationVisible) {
                // Click on the recommendations received tab
                await userPageUtil.clickRecommendationReceivedTab(userPage);

                let isMoreRecommendationVisible = await userPageUtil.isMoreRecommendationVisible(userPage);

                if (isMoreRecommendationVisible) {
                    // Open all the skills
                    await userPageUtil.clickShowMoreRecommendations(userPage);
                    console.log(username + ' - show more recommendations');
                }

                recommendations_received = await userPageUtil.getRecommendations(userPage);

                // Click on the recommendations received tab
                await userPageUtil.clickRecommendationGivenTab(userPage);

                isMoreRecommendationVisible = await userPageUtil.isMoreRecommendationVisible(userPage);

                if (isMoreRecommendationVisible) {
                    // Open all the skills
                    await userPageUtil.clickShowMoreRecommendations(userPage);
                    console.log(username + ' - show more recommendations');
                }

                recommendations_given = await userPageUtil.getRecommendations(userPage);
            }

            console.log(username + ' - got recommendations');

            if (!email || !phone) {
                let emailsPhones = await userPageUtil.getEmailPhoneFromWebsites(browser, websites)
                console.log(emailsPhones);
                if (!email) email = emailsPhones.company_emails.concat(emailsPhones.personal_emails);
                if (!phone) phone = emailsPhones.company_phones.concat(emailsPhones.personal_phones);
            }


            console.log('Record number: ' + i);

            profile_records.push({
                profile_id: id,
                name: username,
                title: title,
                location: location,
                current_employement: current_emp,
                linkedin_url: linkedInUrl,
                twitter_url: twitterURL,
                connections: connections
            });


            // insert websites
            for (let a = 0; a < websites.length; a++) {
                website_records.push({
                    profile_id: id,
                    url: websites[a].url,
                    type: websites[a].type
                });
            }

            // Phone numebrs
            if (typeof phone === 'string') {
                phonenumbers_records.push({
                    profile_id: id,
                    phone_number: phone
                });
            } else if (typeof phone === 'object') {
                for (let b = 0; b < phone.length; b++) {
                    phonenumbers_records.push({
                        profile_id: id,
                        phone_number: phone[b]
                    });
                }
            }

            // Emails
            if (typeof email === 'string') {
                email_records.push({
                    profile_id: id,
                    email: email
                });
            } else if (typeof email === 'object') {
                for (let c = 0; c < email.length; c++) {
                    email_records.push({
                        profile_id: id,
                        email: email[c]
                    });
                }
            }

            // skills
            for (let d = 0; d < skills.length; d++) {
                skill_records.push({
                    profile_id: id,
                    skill: skills[d].skill,
                    endorsed: skills[d].endorsed
                });
            }

            // Recommendation given
            for (let e = 0; e < recommendations_given.length; e++) {
                recommendation_given_records.push({
                    profile_id: id,
                    profile_name: recommendations_given[e].profile_name,
                    profile_url: recommendations_given[e].profile_url,
                    text: recommendations_given[e].text
                });
            }

            // Recommendation received
            for (let f = 0; f < recommendations_received.length; f++) {
                recommendation_received_records.push({
                    profile_id: id,
                    profile_name: recommendations_received[f].profile_name,
                    profile_url: recommendations_received[f].profile_url,
                    text: recommendations_received[f].text
                });
            }

            if (profile_records.length % 10 == 0) {
                await Profile.bulkCreate(profile_records, {
                    updateOnDuplicate: [
                        'name',
                        'title',
                        'location',
                        'current_employement',
                        'linkedin_url',
                        'twitter_url',
                        'connections'
                    ]
                });
            
                await Websites.bulkCreate(website_records, {
                    ignoreDuplicates: true
                });
            
                await Emails.bulkCreate(email_records, {
                    ignoreDuplicates: true
                });
            
                await PhoneNumbers.bulkCreate(phonenumbers_records, {
                    ignoreDuplicates: true
                });
            
                await RecommendationsGiven.bulkCreate(recommendation_given_records, {
                    updateOnDuplicate: ['text']
                });
            
                await RecommendationsReceived.bulkCreate(recommendation_received_records, {
                    updateOnDuplicate: ['text']
                });
            
                await Skills.bulkCreate(skill_records, {
                    updateOnDuplicate: ['endorsed']
                });

                profile_records = [];
                website_records = [];
                phonenumbers_records = [];
                email_records = [];
                recommendation_given_records = [];
                recommendation_received_records = [];
                skill_records = [];
            }
        } catch (e) {
            console.error(e);
            if (userPage.url().indexOf('unavailable') > -1) {
                console.error('Profile not availabe')
                i--;
                continue;
            }
            var isErrorActionAvailable = await linkedIn.isElementVisible(userPage, USER_PAGE_ERROR_ACTION);
            if (isErrorActionAvailable) {
                console.error('Error action was available');
                i--;
                continue;
            }
        }

    }
};

run();