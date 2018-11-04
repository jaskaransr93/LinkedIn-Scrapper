const puppeteer = require('puppeteer');
const linkedIn = require('./linkedinUtil');
const concordance = require('./concordance');
const fs = require('fs');
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

const Profile = sequelize.import(__dirname + "/models/profile");
const textCount = sequelize.import(__dirname + "/models/textCount");

const natural = require('natural');


var today = new Date();
var date = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate();
var time = today.getHours() + "-" + today.getMinutes() + "-" + today.getSeconds();
var dateTime = date + '_' + time;

const temp_profile_url = 'https://www.linkedin.com/in/jason-georgopoulos-b543104/detail/recent-activity/';

const RECENT_ACTIVITY_POST_DESC = '.feed-shared-update-v2 .feed-shared-update-v2__description';
const RECENT_ACTIVITY_ARTICLES = '.feed-shared-update-v2 article a';

const DATABASE_OFFSET = 0;
const DATABASE_LIMIT = 10;

const keywords = [
    'oser pay',
    'english rule',
    'american rule',
    'fixed cost system',
    'no cost notice',
    'plaintiff insurance',
    'legal expense insurance',
    'litigation costs insurance',
    'after event insurance',
    'legal insurance',
    'legal funding',
    'legal expenses'
];

async function run() {
    var profiles = await Profile.findAll({ offset: DATABASE_OFFSET, limit: DATABASE_LIMIT });
    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: {
            width: 1600,
            height: 900
        }
    });

    const page = await browser.newPage();

    await linkedIn.login(page);

    await page.waitForNavigation();

    // _.forEach(profiles, (profile) => {
    //     var url = `https://www.linkedin.com/in/${profile.profile_id}/detail/recent-activity/`;

    //     await page.goto(url);
    //     await page.waitFor(5 * 1000);

    //     await linkedIn.autoScroll(page);
    //     await page.waitFor(2 * 1000);
    //     var descs = await page.evaluate((sel) => {
    //         var descEle = document.querySelectorAll(sel);
    //         var desc = [];
    //         for (var i = 0; i < descEle.length; i++) {
    //             desc.push(descEle[i].innerText);
    //         }
    //         return desc;
    //     }, RECENT_ACTIVITY_POST_DESC);

    //     var articlesHref = await page.evaluate((sel) => {
    //         var hrefEle = document.querySelectorAll(sel);
    //         var href = [];
    //         for (var i = 0; i < hrefEle.length; i++) {
    //             if (href.indexOf(hrefEle[i].href) == -1) {
    //                 href.push(hrefEle[i].href);
    //             }
    //         }
    //         return href;
    //     }, RECENT_ACTIVITY_ARTICLES);

    //     var articles_page = await browser.newPage();
    //     var article_contents = '';
    //     for (var i = 0; i < articlesHref.length; i++) {
    //         await articles_page.goto(articlesHref[i], { waitUntil: 'networkidle2' });
    //         await articles_page.waitFor(3 * 1000);
    //         article_contents += ' ' + await articles_page.evaluate(() => {
    //             return document.querySelector('html').innerText;
    //         });
    //     }
    //     await articles_page.close();
    // });

    await page.goto(temp_profile_url);

    await page.waitFor(2 * 1000);

    await linkedIn.autoScroll(page);

    // console.log(concordance);

    var descs = await page.evaluate((sel) => {
        var descEle = document.querySelectorAll(sel);
        var desc = [];
        for (var i = 0; i < descEle.length; i++) {
            desc.push(descEle[i].innerText);
        }
        return desc;
    }, RECENT_ACTIVITY_POST_DESC);

    var articlesHref = await page.evaluate((sel) => {
        var hrefEle = document.querySelectorAll(sel);
        var href = [];
        for (var i = 0; i < hrefEle.length; i++) {
            if (href.indexOf(hrefEle[i].href) == -1)  {
                href.push(hrefEle[i].href);
            }
        }
        return href;
    }, RECENT_ACTIVITY_ARTICLES);

    var articles_page = await browser.newPage();
    var article_contents = '';
    for (var i = 0; i < articlesHref.length; i++) {
        await articles_page.goto(articlesHref[i], { waitUntil: 'networkidle2' } );
        await articles_page.waitFor(3 * 1000);
        article_contents += '. ' + await articles_page.evaluate(() => {
            return document.querySelector('html').innerText;
        });
    }
    await articles_page.close();
    var text_search = (descs.join(' ') + '. ' + article_contents).replace(/\n/g, '').replace(/[\\"']/g, '\\$&').replace(/\u0000/g, '\\0');
    // var tokenizer = new natural.SentenceTokenizer();
    // var sentences = tokenizer.tokenize(text_search);
    text_search = natural.PorterStemmer.stem(text_search);
    console.log(text_search);
    var results = {};
    for (var i = 0; i < keywords.length; i++) {
        results[keywords[i]] = natural.LevenshteinDistance(keywords[i], text_search, {search: true});
    }
    console.log(results);
    // console.log(natural.LevenshteinDistance(sentences, ));
    // var html = fs.readFileSync('chart_prototype.html', 'utf8');
    // text_search = text_search.replace(/[\\"']/g, '\\$&').replace(/\u0000/g, '\\0').replace(/\n/g, '');
    // html = html.replace('<enter data here>', text_search);

    // fs.writeFileSync('chart_prototype'+ dateTime + '.html', html);

    // for (var i = 0; i < descs.length; i++) {
    //     concordance.process(descs[i]);
    // }

    // var keys = concordance.getKeys();
    // for (var i = 0; i < keys.length; i++) {
    //     console.log(keys[i] + ': ' + concordance.getCount(keys[i]) + '\n');
    // }
    browser.close();

}

run();