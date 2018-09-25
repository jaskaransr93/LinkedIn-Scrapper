const linkedIn = require('./linkedinUtil');

// Selectors
const USER_PAGE_LOCATION_SELECTOR = '.pv-top-card-section__location';
const USER_PAGE_TITLE_SELECTOR = '.pv-top-card-section__headline';
const USER_PAGE_CURRENT_EMP = '.pv-top-card-v2-section__links .pv-top-card-v2-section__link .pv-top-card-v2-section__company-name';
const USER_PAGE_CONNECTIONS = '.pv-top-card-v2-section__links .pv-top-card-v2-section__link .pv-top-card-v2-section__connections';

const USER_PAGE_CONTACT_LINK_SELECTOR = '.pv-top-card-v2-section__link--contact-info';
const USER_PAGE_CONTACT_LINKEDIN_SELECTOR = '.ci-vanity-url .pv-contact-info__contact-link';
const USER_PAGE_CONTACT_WEBSITES_HREF_SELECTOR = '.ci-websites .pv-contact-info__contact-link';
const USER_PAGE_CONTACT_WEBSITES_DESC_SELECTOR = '.ci-websites .pv-contact-info__contact-link + span';
const USER_PAGE_CONTACT_TWITTER_SELECTOR = '.ci-twitter .pv-contact-info__contact-link';
const USER_PAGE_CONTACT_PHONE_SELECTOR = '.ci-phone .pv-contact-info__ci-container:nth-child(1) span:nth-child(1)';
const USER_PAGE_CONTACT_EMAIL_SELECTOR = '.ci-email .pv-contact-info__contact-link';
const USER_PAGE_CONTACT_BTN_CLOSE = 'artdeco-modal .artdeco-dismiss';

const USER_PAGE_TOP_SKILL_TEXT = '.pv-skill-categories-section .pv-skill-category-entity__top-skill .pv-skill-category-entity__name span';
const USER_PAGE_TOP_SKILL_COUNT = '.pv-skill-categories-section .pv-skill-category-entity__top-skill .pv-skill-category-entity__endorsement-count';
const USER_PAGE_BTN_SHOW_MORE = '.pv-skill-categories-section .pv-skills-section__additional-skills';
const USER_PAGE_SECONDARY_SKILLS_TEXT = '.pv-skill-category-entity--secondary .pv-skill-category-entity__name span';
const USER_PAGE_SECONDARY_SKILLS_COUNT = '.pv-skill-category-entity--secondary .pv-skill-category-entity__endorsement-count';

const USER_PAGE_RECOMMENDATIONS_SECTION = '.pv-recommendations-section';
const USER_PAGE_RECOMMENDATIONS_BTN_SHOW_MORE = '.pv-recommendations-section artdeco-tabpanel.active .pv-profile-section__see-more-inline';
const USER_PAGE_RECOMMENDATIONS_PROFILE = '.pv-recommendations-section artdeco-tabpanel.active .pv-recommendation-entity a';
const USER_PAGE_RECOMMENDATIONS_PROFILE_NAME = '.pv-recommendations-section artdeco-tabpanel.active .pv-recommendation-entity .pv-recommendation-entity__detail h3';
const USER_PAGE_RECOMMENDATIONS_PROFILE_TEXT = '.pv-recommendations-section artdeco-tabpanel.active .pv-recommendation-entity .pv-recommendation-entity__text';
const USER_PAGE_RECOMMENDATIONS_RECEIVED_TAB = '.pv-recommendations-section artdeco-tab:nth-child(1)';
const USER_PAGE_RECOMMENDATIONS_GIVEN_TAB = '.pv-recommendations-section artdeco-tab:nth-child(2)';

const getLocation = async (userPage) => {
    return (await linkedIn.getElementText(userPage, USER_PAGE_LOCATION_SELECTOR)).replace('<!---->', '');
};

const getTitle = async (userPage) => {
    return await linkedIn.getElementText(userPage, USER_PAGE_TITLE_SELECTOR);
};

const getCurrentEmployement = async (userPage) => {
    return (await linkedIn.getElementText(userPage, USER_PAGE_CURRENT_EMP)).replace('<!---->', '');
};

const getConnections = async (userPage) => {
    return await userPage.evaluate((sel) => {
        var ele = document.querySelector(sel);
        if (!ele) return '';
        if (ele.innerHTML.indexOf('See connections') > -1) {
            var conn = ele.innerHTML.subString(ele.innerHTML.indexOf('('), ele.innerHTML.indexOf(')'));
            return conn + ' connections';
        }
        return ele.innerHTML.trim();
    }, USER_PAGE_CONNECTIONS);
};

const openContactModal = async (userPage) => {
    // Click on the contact info button
    await userPage.click(USER_PAGE_CONTACT_LINK_SELECTOR);
    await userPage.waitFor(1000 * 5);
};

const getLinkedinURL = async (userPage) => {
    return await userPage.evaluate((sel) => {
        return document.querySelector(sel).href.trim();
    }, USER_PAGE_CONTACT_LINKEDIN_SELECTOR);
};

const getWebsites = async (userPage) => {
    return await userPage.evaluate((hrefSel, descSel) => {
        var result = [];
        var urls = document.querySelectorAll(hrefSel);
        var descs = document.querySelectorAll(descSel);
        var length = urls.length;
        // var companyWebsites = [];
        // var personalWebsites = [];
        // var portfolios = [];
        // var otherWebsites = [];
        var websites = [];
        for (var i = 0; i < length; i++) {
            var description = descs[i].innerHTML.trim().toLowerCase();
            var url = urls[i].href.trim();
            if (description.indexOf('company') > -1) {
                // companyWebsites.push(url);
                websites.push({
                    url: url,
                    type: 'company'
                });
            } else if (description.indexOf('personal') > -1) {
                // personalWebsites.push(url);
                websites.push({
                    url: url,
                    type: 'personal'
                });
            } else if (description.indexOf('portfolio') > -1) {
                // portfolios.push(url);
                websites.push({
                    url: url,
                    type: 'portfolio'
                });
            } else {
                websites.push({
                    url: url,
                    type: description
                });
                // otherWebsites.push(url);
            }
            // result.push(urls[i].href.trim() + descs[i].innerHTML.trim());
        }
        // return {
        //     company_websites: companyWebsites,
        //     personal_websites: personalWebsites,
        //     portfolios: portfolios,
        //     other_websites: otherWebsites
        // };
        return websites;
    }, USER_PAGE_CONTACT_WEBSITES_HREF_SELECTOR, USER_PAGE_CONTACT_WEBSITES_DESC_SELECTOR);
};

const getTwitterURL = async (userPage) => {
    return await linkedIn.getElementText(userPage, USER_PAGE_CONTACT_TWITTER_SELECTOR);
};

const getPhone = async (userPage) => {
    return await linkedIn.getElementText(userPage, USER_PAGE_CONTACT_PHONE_SELECTOR);
};

const getEmail = async (userPage) => {
    return await linkedIn.getElementText(userPage, USER_PAGE_CONTACT_EMAIL_SELECTOR);
};

const closeContactModal = async (userPage) => {
    // close the connection modal
    await userPage.click(USER_PAGE_CONTACT_BTN_CLOSE);
    await userPage.waitFor(1000 * 3);
};

const isMoreSkillsVisible = async (userPage) => {
    return await linkedIn.isElementVisible(userPage, USER_PAGE_BTN_SHOW_MORE);
};

const clickShowMoreSkills = async (userPage) => {
    await userPage.click(USER_PAGE_BTN_SHOW_MORE);
    await userPage.waitFor(1000 * 3);
};

const getSkills = async (userPage) => {
    return await userPage.evaluate((topSkillTextSel, topSkillCountSel, secSkillTextSel, secSkillCountSel) => {

        var topSkillsTextEle = document.querySelectorAll(topSkillTextSel);
        var topSkillsCountEle = document.querySelectorAll(topSkillCountSel);
        var secSkillsTextEle = document.querySelectorAll(secSkillTextSel);
        var secSkillsCountEle = document.querySelectorAll(secSkillCountSel);
        // var skills = '';
        var skills = [];
        //Get the top skills
        for (var i = 0; i < topSkillsTextEle.length; i++) {
            // skills[topSkillsTextEle[i].innerHTML.trim()] = topSkillsCountEle[i].innerHTML.trim()
            // skills += topSkillsTextEle[i].innerHTML.trim() + ' : ' + topSkillsCountEle[i].innerHTML.trim() + '\r\n';
            skills.push({
                skill: topSkillsTextEle[i].innerHTML.trim(),
                endorsed: topSkillsCountEle[i].innerHTML.trim()
            });
        }

        //Get the Secondary skills
        for (var i = 0; i < secSkillsTextEle.length; i++) {
            // skills += secSkillsTextEle[i].innerHTML.trim() + ' : ' + secSkillsCountEle[i].innerHTML.trim() + '\r\n';
            skills.push({
                skill: secSkillsTextEle[i].innerHTML.trim(),
                endorsed: secSkillsCountEle[i].innerHTML.trim()
            });
        }

        return skills;
    }, USER_PAGE_TOP_SKILL_TEXT, USER_PAGE_TOP_SKILL_COUNT, USER_PAGE_SECONDARY_SKILLS_TEXT, USER_PAGE_SECONDARY_SKILLS_COUNT);
};

const isRecommendationSectionVisible = async (userPage) => {
    return await linkedIn.isElementVisible(userPage, USER_PAGE_RECOMMENDATIONS_SECTION);
};

const clickRecommendationReceivedTab = async (userPage) => {
    await userPage.click(USER_PAGE_RECOMMENDATIONS_RECEIVED_TAB);
    await userPage.waitFor(1000 * 3);
};

const clickRecommendationGivenTab = async (userPage) => {
    await userPage.click(USER_PAGE_RECOMMENDATIONS_GIVEN_TAB);
    await userPage.waitFor(1000 * 3);
};

const isMoreRecommendationVisible = async (userPage) => {
    return await userPage.evaluate((sel) => {
        return !!document.querySelector(sel);
    }, USER_PAGE_RECOMMENDATIONS_BTN_SHOW_MORE);
};

const clickShowMoreRecommendations = async (userPage) => {
    await userPage.click(USER_PAGE_RECOMMENDATIONS_BTN_SHOW_MORE);
    await userPage.waitFor(1000 * 3);
};

const getRecommendations = async (userPage) => {
    return await userPage.evaluate((profileURLSel, nameSel, recommendTextSel) => {
        var urlEles = document.querySelectorAll(profileURLSel);
        var nameEles = document.querySelectorAll(nameSel);
        var recommendTextEles = document.querySelectorAll(recommendTextSel);
        // var recommendations = '';
        var recommendations = [];
        for (var i = 0; i < urlEles.length; i++) {
            // recommendations += nameEles[i].innerHTML.trim() + 
            //                 ' (' + urlEles[i].href + ') - ' + 
            //                 recommendTextEles[i].innerHTML.trim() + '\r\n';
            recommendations.push({
                profile_name: nameEles[i].innerHTML.trim().replace(new RegExp('<br>', 'g'), '') || '',
                profile_url: urlEles[i].href,
                text: recommendTextEles[i].innerHTML.trim().replace(new RegExp('<br>', 'g'), '')
            });
        }
        return recommendations;
    }, USER_PAGE_RECOMMENDATIONS_PROFILE, USER_PAGE_RECOMMENDATIONS_PROFILE_NAME, USER_PAGE_RECOMMENDATIONS_PROFILE_TEXT);
};

const findEmailInPage = async (page) => {
    return await page.evaluate(() => {
        let el = document.querySelector('a[href^="mailto:"]');
        let email = '';
        if (el) {
            email = el.href.replace('mailto:', '');
            if (email) return [email];
        }
        if (!document.querySelector('body')) return [];
        let emails = document.querySelector('body').innerText.match(/[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*/gi);

        if (!emails) return [];
        return emails;
    });
};

const findPhoneInPage = async (page) => {
    return await page.evaluate(() => {
        if (!document.querySelector('body')) return [];
        let phones = document.querySelector('body').innerText.match(/\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})/gi);
        if (!phones) return []
        phones = phones.map((phone) => phone.replace(/\(/g, '')
                                            .replace(/\)/g, '')
                                            .replace(/ /g, '')
                                            .replace(/-/g, '')
                                            .replace(/\./g, ''));
        return phones;
    });
};

const getEmailPhoneFromWebsites = async (browser, websites) => {
    const lookupPage = await browser.newPage();
    let company_emails = [];
    let personal_emails = [];
    let company_phones = [];
    let personal_phones = [];
    // company Websites
    for (var i = 0; i < websites.length; i++) {
        let em, ph;
        try {
            await lookupPage.goto(websites[i].url);
        }
        catch (e) {
            console.error(e);
            continue;
        }
        // await lookupPage.waitForNavigation();
        await lookupPage.waitFor(1000 * 5);
        em = await findEmailInPage(lookupPage);
        company_emails =company_emails.concat(em);
        ph = await findPhoneInPage(lookupPage);
        company_phones = company_phones.concat(ph);
    }
    // Personal Websites
    // for (var i = 0; i < websites.personal_websites.length; i++) {
    //     let em, ph;
    //     try {
    //         await lookupPage.goto(websites.personal_websites[i]);
    //     } catch (e) {
    //         console.log(e);
    //         continue;
    //     }
    //     // await lookupPage.waitForNavigation();
    //     await lookupPage.waitFor(1000 * 5);
    //     em = await findEmailInPage(lookupPage);
    //     personal_emails =personal_emails.concat(em);
    //     ph = await findPhoneInPage(lookupPage);
    //     personal_phones = personal_phones.concat(ph);
    // }
    // Portofolios
    // for (var i = 0; i < websites.portfolios.length; i++) {
    //     await lookupPage.goto(websites.portfolios[i]);
    //     // await lookupPage.waitForNavigation();
    //     await lookupPage.waitFor(1000 * 5);
    //     personal_emails = await findEmailInPage(lookupPage);
    //     personal_phones = await findPhoneInPage(lookupPage);
    // }
    await lookupPage.close();
    return {
        company_emails: removeDuplicates(company_emails),
        personal_emails: removeDuplicates(personal_emails),
        personal_phones: removeDuplicates(personal_phones),
        company_phones: removeDuplicates(company_phones)
    }
};

const removeDuplicates = (arr) => {
    return arr.filter(function(item, pos) {
        return arr.indexOf(item) == pos;
    });
};

module.exports = {
    getLocation: getLocation,
    getTitle: getTitle,
    getCurrentEmployement: getCurrentEmployement,
    getConnections: getConnections,
    openContactModal: openContactModal,
    getLinkedinURL: getLinkedinURL,
    getWebsites: getWebsites,
    getTwitterURL: getTwitterURL,
    getPhone: getPhone,
    getEmail: getEmail,
    closeContactModal: closeContactModal,
    isMoreSkillsVisible: isMoreSkillsVisible,
    clickShowMoreSkills: clickShowMoreSkills,
    getSkills: getSkills,
    isMoreRecommendationVisible: isMoreRecommendationVisible,
    clickShowMoreRecommendations: clickShowMoreRecommendations,
    getRecommendations: getRecommendations,
    clickRecommendationReceivedTab: clickRecommendationReceivedTab,
    clickRecommendationGivenTab: clickRecommendationGivenTab,
    isRecommendationSectionVisible: isRecommendationSectionVisible,
    getEmailPhoneFromWebsites: getEmailPhoneFromWebsites
};