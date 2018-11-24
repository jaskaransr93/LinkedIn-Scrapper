const puppeteer = require('puppeteer');
const linkedIn = require('./linkedinUtil');
const concordance = require('./concordance');
const fs = require('fs');
const Sequelize = require('sequelize');
var _ = require('lodash');
const sequelize = new Sequelize('injurylawyers1', 'root', 'admin', {
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

const CREDS = require('./creds');

const temp_profile_url = 'https://www.linkedin.com/in/ana-badour-4588612a/detail/recent-activity/';

const RECENT_ACTIVITY_POST_DESC = '.feed-shared-update-v2 .feed-shared-update-v2__description';
const RECENT_ACTIVITY_ARTICLES = '.feed-shared-update-v2 article a';

const DATABASE_OFFSET = 0;
const DATABASE_LIMIT = 10;

const keywords = [
    'loser pay',
    'english rule',
    'american rule',
    'fixed cost system',
    'no cost notice',
    'plaintiff insurance',
    'legal expense insurance',
    'litigation cost insurance',
    'after event insurance',
    'legal insurance',
    'legal funding',
    'legal expenses'
];

async function run() {
    var profiles = await Profile.findAll();
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
    var text_search = '';
    for (var p = 0; p < profiles.length; p++) {
        await page.goto(profiles[p].linkedin_url + '/detail/recent-activity/');

        await page.waitFor(2 * 1000);

        await linkedIn.autoScroll(page);
        // await page.waitFor(2 * 1000);
        // await linkedIn.autoScroll(page);
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
                if (href.indexOf(hrefEle[i].href) == -1 && hrefEle[i].href.indexOf('https://www.linkedin.com') == -1) {
                    href.push(hrefEle[i].href);
                }
            }
            return href;
        }, RECENT_ACTIVITY_ARTICLES);

        var articles_page = await browser.newPage();
        var article_contents = '';
        for (var i = 0; i < articlesHref.length; i++) {
            try {
                await articles_page.goto(articlesHref[i], { waitUntil: 'networkidle2' });
                await articles_page.waitFor(3 * 1000);
                article_contents += '. ' + await articles_page.evaluate(() => {
                    return document.querySelector('html').innerText;
                });
            }
            catch (e) {
                console.log("catch: " + e);
                continue;
            }
        }
        await articles_page.close();
        text_search += (descs.join(' ') + '. ' + article_contents).replace(/\n/g, '').replace(/[\\"']/g, '\\$&').replace(/\u0000/g, '\\0');
    }

    // var tokenizer = new natural.SentenceTokenizer();
    // var sentences = tokenizer.tokenize(text_search);
    //text_search = natural.PorterStemmer.stem(text_search);
    // var results = {};
    // for (var i = 0; i < keywords.length; i++) {
    //     results[keywords[i]] = natural.LevenshteinDistance(keywords[i], text_search, {search: true});
    // }
    // console.log(results);
    // console.log(natural.LevenshteinDistance(sentences, ));
    var html = fs.readFileSync('chart_prototype.html', 'utf8');
    text_search = text_search.replace(/[\\"']/g, '\\$&').replace(/\u0000/g, '\\0').replace(/\n/g, '');

    // word counting and removing the common words    
    var common = "poop,i,me,my,myself,we,us,our,ours,ourselves,you,your,yours,yourself,yourselves,he,him,his,himself,she,her,hers,herself,it,its,itself,they,them,their,theirs,themselves,what,which,who,whom,whose,this,that,these,those,am,is,are,was,were,be,been,being,have,has,had,having,do,does,did,doing,will,would,should,can,could,ought,i'm,you're,he's,she's,it's,we're,they're,i've,you've,we've,they've,i'd,you'd,he'd,she'd,we'd,they'd,i'll,you'll,he'll,she'll,we'll,they'll,isn't,aren't,wasn't,weren't,hasn't,haven't,hadn't,doesn't,don't,didn't,won't,wouldn't,shan't,shouldn't,can't,cannot,couldn't,mustn't,let's,that's,who's,what's,here's,there's,when's,where's,why's,how's,a,an,the,and,but,if,or,because,as,until,while,of,at,by,for,with,about,against,between,into,through,during,before,after,above,below,to,from,up,upon,down,in,out,on,off,over,under,again,further,then,once,here,there,when,where,why,how,all,any,both,each,few,more,most,other,some,such,no,nor,not,only,own,same,so,than,too,very,say,says,said,shall";
    var word_count = {};
    var words = text_search.split(/[ '\-\(\)\*":;\[\]|{},.!?]+/);
    if (words.length == 1) {
        word_count[words[0]] = 1;
    } else {
        words.forEach(function (word) {
            word = word.toLowerCase();
            if (word != "" && common.indexOf(word) == -1 && word.length > 1) {
                if (word_count[word]) {
                    word_count[word]++;
                } else {
                    word_count[word] = 1;
                }
            }
        })
        /*for (var i = 0; i < words.length; i+=2) {
            var word = word[i].toLowerCase() + word[i+1].toLowerCase();
            if (word != ""  && word.length > 1) { //&& common.indexOf(word) == -1
                if (word_count[word]) {
                    word_count[word]++;
                } else {
                    word_count[word] = 1;
                }
            }
        }*/
    }
    html = html.replace('<enter data here>', JSON.stringify(word_count));

    fs.writeFileSync('chart_prototype' + dateTime + '.html', html);

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