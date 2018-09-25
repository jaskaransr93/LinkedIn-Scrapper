const USERNAME_SELECTOR = '#login-email';
const PASSWORD_SELECTOR = '#login-password';
const BUTTON_SELECTOR = '#login-submit';
const CREDS = require('./creds');

const login = async function(page) {
    await page.goto('https://www.linkedin.com/');
    await page.click(USERNAME_SELECTOR);
    await page.keyboard.type(CREDS.username);
    await page.click(PASSWORD_SELECTOR);
    await page.keyboard.type(CREDS.password);
    await page.click(BUTTON_SELECTOR);
};

const getElementText = async function(page, selector) {
    return await page.evaluate((sel) => {
        var ele = document.querySelector(sel);
        if (!ele) return '';
        return ele.innerHTML.trim();
    }, selector);
};


const autoScroll = async (page) => {
    await page.evaluate(async () => {
        await new Promise((resolve, reject) => {
            let totalHeight = 0;
            let distance = 100;
            let timer = setInterval(() => {
                let scrollHeight = document.body.scrollHeight;
                window.scrollBy(0, distance);
                totalHeight += distance;
                if (totalHeight >= scrollHeight) {
                    clearInterval(timer);
                    resolve();
                }
            }, 100);
        })
    })
}

const isElementVisible = async (page, sel) => {
    return await page.evaluate((selector) => {
        let el = document.querySelector(selector);
        let visible = !!el;
        if (visible) {
            var style = window.getComputedStyle(el);
            if (style.display == 'none') {
                visible = false;
            }
        }
        return visible;
    }, sel);
};

module.exports= {
    login: login,
    getElementText: getElementText,
    autoScroll: autoScroll,
    isElementVisible: isElementVisible
};