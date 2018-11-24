const puppeteer = require('puppeteer');
const linkedIn = require('./linkedinUtil');
const userPageUtil = require('./userPage');
const Sequelize = require('sequelize');
var _ = require('lodash');

const sequelize = new Sequelize('injurylawyers_official', 'root', 'admin', {
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
const LENGTH_SELECTOR_CLASS = 'search-result__occluded-item';
const PROFILE_COMPANIES_LINKS = '.experience-section .pv-position-entity a[data-control-name="background_details_company"]';
const COMPANY_SHOW_MORE = '.org-about-company-module__show-details-button';
const COMPANY_WEBSITE = '.org-about-company-module__company-page-url a';
const COMPANY_WEBSITE_ABOUT = '.org-grid__core-rail a[href^="http"]';

const USER_PAGE_ERROR_ACTION = '.error-action';
// Mortgage Architects
//Dominion 
const keywords = encodeURI('personal injury');
//const searchUrl = `https://www.linkedin.com/search/results/index/?keywords=${keywords}&origin=GLOBAL_SEARCH_HEADER`;
const searchUrl = 'https://www.linkedin.com/search/results/people/?facetCurrentCompany=%5B%221065805%22%5D';

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
    await page.waitForNavigation();
    await page.goto(searchUrl);
    await page.waitFor(5 * 1000);

    let numPages = await getNumPages(page);
    console.log('Numpages: ', numPages);

    var records = [];
    for (let h = 1; h <= numPages; h++) {
        // bulk entering to database
        var profile_records = [];
        var website_records = [];
        var phonenumbers_records = [];
        var email_records = [];
        var recommendation_given_records = [];
        var recommendation_received_records = [];
        var skill_records = [];

        let pageUrl = searchUrl + '&page=' + h;
        await page.goto(pageUrl);
        await page.waitFor(1000 * 4);

        console.log('Opened Page number: ' + h);

        let listLength = await page.evaluate((sel) => {
            return document.getElementsByClassName(sel).length;
        }, LENGTH_SELECTOR_CLASS);

        await page.waitFor(1000 * 4);

        await linkedIn.autoScroll(page);

        for (let i = 1; i <= listLength; i++) { //listLength
            try {
                // change the index to the next child
                let usernameSelector = LIST_USERNAME_SELECTOR.replace("INDEX", i);
                // let emailSelector = LIST_EMAIL_SELECTOR.replace("INDEX", i);

                let username = await page.evaluate((sel) => {
                    if (!document.querySelector(sel)) return '';
                    return document.querySelector(sel).innerText.trim().replace(/([\uE000-\uF8FF]|\uD83C[\uDF00-\uDFFF]|\uD83D[\uDC00-\uDDFF])/g, '') // replace emoticons which can't be stored in db;
                }, usernameSelector);

                if (username === 'LinkedIn Member' || username === '') continue; // skip hidden members

                console.log('User name: ' + username);

                let linkSelector = LINK_USERNAME_SELECTOR.replace("INDEX", i);


                let href = await page.evaluate((sel) => {
                    return document.querySelector(sel).href.trim();
                }, linkSelector);

                console.log(username + ' - got href');

                const userPage = await browser.newPage();

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


                let id = href.split('/')[4];

                await userPage.waitFor(1000 * 4);

                await linkedIn.autoScroll(userPage);

                // Location 
                let location = await userPageUtil.getLocation(userPage);
                console.log(username + ' - got location');

                // Title
                let title = await userPageUtil.getTitle(userPage);
                console.log(username + ' - got title - ' +  title);

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
                
                let company_website = _.find(websites, { type: 'company' });
                if (!company_website) {
                    
                    let company_page = await userPage.evaluate((sel) => {
                        let ele = document.querySelector(sel);
                        if (!ele) return '';
                        return ele.href;
                    }, PROFILE_COMPANIES_LINKS);

                    if (company_page && company_page.indexOf('company') > -1) {
                        const companyPage = await browser.newPage();
                        await companyPage.goto(company_page, { timeout: 10 * 1000 });
                        await companyPage.waitFor(2 * 1000);
                        if (await companyPage.$(COMPANY_SHOW_MORE) !== null)  {
                            await companyPage.click(COMPANY_SHOW_MORE);
                            await companyPage.waitFor(2 * 1000);
                            company_website = await companyPage.evaluate((sel) => {
                                let ele = document.querySelector(sel);
                                if (!ele) return '';
                                return ele.href;
                            }, COMPANY_WEBSITE);
                        } else {
                            if (companyPage.url().indexOf('about') == -1) {
                                await companyPage.goto(companyPage.url() + 'about', { timeout: 10 * 1000 });
                            }
                            await companyPage.waitFor(2 * 1000);
                            company_website = await companyPage.evaluate((sel) => {
                                let ele = document.querySelector(sel);
                                if (!ele) return '';
                                return ele.href;
                            }, COMPANY_WEBSITE_ABOUT);
                        }

                        websites.push({
                            url: company_website,
                            type: 'company'
                        });
                        companyPage.close();
                    }
                }

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

                await userPage.close();

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
            } catch (e) {
                console.error(e);
                if (userPage.url().indexOf('unavailable') > -1) {
                    console.error('Profile not available')
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
    }
    console.log('Closing browser');
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

run();