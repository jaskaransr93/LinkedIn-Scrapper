const puppeteer = require('puppeteer');
const linkedIn = require('./linkedinUtil');
const concordance = require('./concordance');
const fs = require('fs');

var today = new Date();
var date = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate();
var time = today.getHours() + "-" + today.getMinutes() + "-" + today.getSeconds();
var dateTime = date + '_' + time;

const temp_profile_url = 'https://www.linkedin.com/in/jason-georgopoulos-b543104/detail/recent-activity/';

const RECENT_ACTIVITY_POST_DESC = '.feed-shared-update .feed-shared-update__description';
const RECENT_ACTIVITY_ARTICLES = '.feed-shared-update article a';

async function run() {
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

    await page.goto(temp_profile_url);

    await page.waitFor(2 * 1000);

    await linkedIn.autoScroll(page);

    console.log(concordance);

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
        article_contents += ' ' + await articles_page.evaluate(() => {
            return document.querySelector('html').innerText;
        });
    }
    await articles_page.close();
    var text_search = descs.join(' ') + ' ' + article_contents;
    var html = fs.readFileSync('chart_prototype.html', 'utf8');
    text_search = text_search.replace(/[\\"']/g, '\\$&').replace(/\u0000/g, '\\0').replace(/\n/g, '');
    html = html.replace('<enter data here>', text_search);

    fs.writeFileSync('chart_prototype'+ dateTime + '.html', html);

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