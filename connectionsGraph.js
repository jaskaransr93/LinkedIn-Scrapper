const puppeteer = require('puppeteer');
const linkedIn = require('./linkedinUtil');
const userPageUtil = require('./userPage');
const Sequelize = require('sequelize');
var _ = require('lodash');
var fs = require('fs');
var d3 = require('d3');
var jsdom = require('jsdom');
const { JSDOM } = jsdom;


const sequelize = new Sequelize('injurylawyers_targets', 'root', 'admin', {
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

const CONNECTION_SELECTORS = '.mn-connections ul li a.mn-connection-card__link';
const CONNECTION_NAME_SELECTOR = '.mn-connections ul li a.mn-connection-card__link .mn-connection-card__name'
const MYPROFILEID_SELECTORS = '.profile-rail-card__actor-link';
const SEE_CONNECTION_SELECTOR = '.pv-top-card-v2-section__link--connections'



// TODO: enter the table definition
const ConnectionNodes = sequelize.import(__dirname + "/models/connectionNodes");
const Links = sequelize.import(__dirname + "/models/links");

sequelize.sync();

// const LIST_USERNAME_SELECTOR = '.search-results__list > .search-result .actor-name';
const LINK_USERNAME_SELECTOR = '.search-results__list > .search-result .search-result__info .search-result__result-link';
const LENGTH_SELECTOR_CLASS = 'search-result__occluded-item';


const connectionUrl = 'https://www.linkedin.com/mynetwork/invite-connect/connections/';


async function run() {
    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: {
            width: 1600,
            height: 900
        }
    });
    const page = await browser.newPage();
    await linkedIn.login(page, {
        username: 'costofjustice777@gmail.com',
        password: 'costofjustice@123'
    });
    await page.waitForNavigation();
    await page.waitFor(5 * 1000);
    let myId = await page.evaluate((sel) => {
        return document.querySelector(sel).href;
    }, MYPROFILEID_SELECTORS);
    let myName = await linkedIn.getElementText(page, MYPROFILEID_SELECTORS);
    myId = linkedIn.getId(myId);

    await page.goto(connectionUrl);
    await page.waitFor(1000 * 4);

    await linkedIn.autoScroll(page);
    await linkedIn.autoScroll(page);

    let profile_links = await page.evaluate((sel) => {
        var eles = document.querySelectorAll(sel);
        var links = [];
        for (var i = 0; i < eles.length; i++) {
            links.push({ profile_href: eles[i].href, name: eles[i].querySelector('.mn-connection-card__name').innerText });
        }
        return links;
    }, CONNECTION_SELECTORS);
    // console.log(profile_links);
    var nodes = [{ profile_id: myId, name: myName, group: 1 }];
    var ids = profile_links.map((link) => { 
        return { 
            profile_id: linkedIn.getId(link.profile_href), 
            name: link.name, 
            group: 2 }; 
        }
    );
    nodes = nodes.concat(ids);
    var links = [];
    for (var j = 0; j < ids.length; j++) {
        links.push({ source: myId, target: ids[j].profile_id, value: '1' });
    }
    // Add the first Links and new Nodes
    Links.bulkCreate(links, [
        'source',
        'target',
        'value'
    ]);
    ConnectionNodes.bulkCreate(nodes, [
        'profile_id',
        'name',
        'group'
    ]);

    var progressProfiles = JSON.parse(fs.readFileSync('connectionsProgress.json', 'utf8'));

    for (var i = 0; i < profile_links.length; i++) {
        try {
            let href = profile_links[i].profile_href;
            let id = linkedIn.getId(href);
            const firstConnectionPage = await browser.newPage();
            await firstConnectionPage.goto(href);
            console.log(`Opened First Connection Page - ${href}` );
            await firstConnectionPage.waitFor(1000 * 5);
            let connectionsHref = await firstConnectionPage.evaluate((sel) => {
                return document.querySelector(sel).href;
            }, SEE_CONNECTION_SELECTOR);
            if (connectionsHref) {
        
                await firstConnectionPage.goto(connectionsHref);
                console.log(`Opened Connection Page - ${connectionsHref}` );
                await firstConnectionPage.waitFor(1000 * 5);
                
                let numPages = await getNumPages(firstConnectionPage);
                console.log(`Num of Pages - ${numPages}` );
                
                if (progressProfiles[id] && (progressProfiles[id] == numPages || progressProfiles[id] === 100)) {
                    continue;
                }

                for (var k = 1 ; k <= numPages && k <= 100; k++) {
                    let secondConnectionLinks = [];
                    let secondConnectionNodes = [];

                    let pageUrl = connectionsHref + '&page=' + k;
                    await firstConnectionPage.goto(pageUrl);
                    await firstConnectionPage.waitFor(1000 * 5);
                    console.log(`Opened See connections Page ${k}  -   ${pageUrl}`);

                    await linkedIn.autoScroll(firstConnectionPage);

                    secondConnectionNodes = await firstConnectionPage.evaluate((sel) => {
                        var eles = document.querySelectorAll(sel);
                        var result = [];
                        for (var a = 0; a < eles.length; a++) {
                            result.push({
                                profile_id: eles[a].href.split('/')[4],
                                name: eles[a].querySelector('.actor-name').innerText.trim().replace(/([\uE000-\uF8FF]|\uD83C[\uDF00-\uDFFF]|\uD83D[\uDC00-\uDDFF])/g, ''),
                                group: 3
                            });
                        }
                        return result;
                    }, LINK_USERNAME_SELECTOR);   
                    
                    for (var b = 0; b < secondConnectionNodes.length; b++) {
                        secondConnectionLinks.push({ source: id, target: secondConnectionNodes[b].profile_id, value: '1' });
                    }

                    Links.bulkCreate(secondConnectionLinks, [
                        'source',
                        'target',
                        'value'
                    ]);
                    ConnectionNodes.bulkCreate(secondConnectionNodes, [
                        'profile_id',
                        'name',
                        'group'
                    ]);

                    progressProfiles[id] = k;
                    fs.writeFileSync('connectionsProgress.json', JSON.stringify(progressProfiles));
                }
            } else {
                console.log(`can\'t see connections for ${id}`);
            }
            firstConnectionPage.close();
        } catch (e) {
            console.error(e);
            // if (userPage.url().indexOf('unavailable') > -1) {
            //     console.error('Profile not available')
            //     i--;
            //     continue;
            // }
            // var isErrorActionAvailable = await linkedIn.isElementVisible(userPage, USER_PAGE_ERROR_ACTION);
            // if (isErrorActionAvailable) {
            //     console.error('Error action was available');
            //     i--;
            //     continue;
            // }
        }
    }
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

async function createGraph() {
    var Nodes = await ConnectionNodes.all();
    var AllLinks = await Links.all();

    var nodes = Nodes.map((node) => {
        return { id: node.profile_id, name: node.name , group: node.group };
    });

    var links = AllLinks.map((link) => {
        return { source: link.source, target: link.target, value: link.value };
    });

    // const fakeDom = await new JSDOM(`<!DOCTYPE html><body></body></html>`);
    // let body = d3.select(fakeDom.window.document).select('body');
    // const window = fakeDom.window;
    // // var chartWidth = 900, chartHeight = 500;
    // fakeDom.window.d3 = d3.select(fakeDom.window.document); //get d3 into the dom
    
    // var width = 10000,
    // height = 10000;

    // var svg = body.append('div').attr('class', 'container')
    // .append("svg")
    //   .attr("width", width)
    //   .attr("height", height);
       

    // var color = d3.scaleOrdinal(d3.schemeRdYlBu);

    // var simulation = d3.forceSimulation(nodes)
    //     .force("link", d3.forceLink(links).id(d => d.profile_id))
    //     .force("charge", d3.forceManyBody())
    //     .force("center", d3.forceCenter(width / 2, height / 2));

    // // const svg = d3.select(DOM.svg(500, 500));

    // // var svg = window.d3.select('body')
    // //     .append('div').attr('class', 'container') //make a container div to ease the saving process
    // //     .append('svg')
    // //     .attr({
    // //         xmlns: 'http://www.w3.org/2000/svg',
    // //         width: chartWidth,
    // //         height: chartHeight
    // //     })
    // //     .append('g')
    // //     .attr('transform', 'translate(' + chartWidth / 2 + ',' + chartWidth / 2 + ')');

    // var link = svg.append("g")
    //     .attr("class", "links")
    //     .selectAll("line")
    //     .data(links)
    //     .enter().append("line")
    //     .attr("stroke-width", function (d) { return Math.sqrt(d.value); });

    // var node = svg.append("g")
    //     .attr("class", "nodes")
    //     .selectAll("g")
    //     .data(nodes)
    //     .enter().append("g");

    // var dragstarted = function (d) {
    //     if (!d3.event.active) simulation.alphaTarget(0.3).restart();
    //     d.fx = d.x;
    //     d.fy = d.y;
    // };

    // var dragged = function dragged(d) {
    //     d.fx = d3.event.x;
    //     d.fy = d3.event.y;
    // };

    // var dragended = function (d) {
    //     if (!d3.event.active) simulation.alphaTarget(0);
    //     d.fx = null;
    //     d.fy = null;
    // };

    // var circles = node.append("circle")
    //     .attr("r", 5)
    //     .attr("fill", function (d) { return color(d.group); })
    //     .call(d3.drag()
    //         .on("start", dragstarted)
    //         .on("drag", dragged)
    //         .on("end", dragended));

    // var lables = node.append("text")
    //     .text(function (d) {
    //         return d.profile_id;
    //     })
    //     .attr('x', 6)
    //     .attr('y', 3);

    // node.append("title")
    //     .text(function (d) { return d.profile_id; });

    // simulation
    //     .nodes(nodes)
    //     .on("tick", ticked);

    // simulation.force("link")
    //     .links(links);

    // function ticked() {
    //     link
    //         .attr("x1", function (d) { return d.source.x; })
    //         .attr("y1", function (d) { return d.source.y; })
    //         .attr("x2", function (d) { return d.target.x; })
    //         .attr("y2", function (d) { return d.target.y; });

    //     node
    //         .attr("transform", function (d) {
    //             return "translate(" + d.x + "," + d.y + ")";
    //         });
    // }
    //write out the children of the container div
    fs.writeFileSync('connections.json', JSON.stringify({ nodes: nodes, links: links })); //using sync to keep the code simple

    //     }
    // });
}




// run();
createGraph();