const USERNAME_SELECTOR = '#login-email';
const PASSWORD_SELECTOR = '#login-password';
const BUTTON_SELECTOR = '#login-submit';
const NAV_DROPDOWN_SELECTOR = '#nav-settings__dropdown-trigger';
const SIGN_OUT_SELECTOR = 'a[data-control-name="nav.settings_signout"]';
const CREDS = require('./creds');

const login = async function(page, credentenials) {
    await page.goto('https://www.linkedin.com/');
    await page.click(USERNAME_SELECTOR);
    await page.keyboard.type(credentenials.username);
    await page.click(PASSWORD_SELECTOR);
    await page.keyboard.type(credentenials.password);
    await page.click(BUTTON_SELECTOR);
};

const logout = async function(page) {
    await page.click(NAV_DROPDOWN_SELECTOR);
    await page.waitFor(2 * 1000);
    await page.click(SIGN_OUT_SELECTOR);
    await page.waitFor(2 * 1000);
};

const getElementText = async function(page, selector) {
    return await page.evaluate((sel) => {
        var ele = document.querySelector(sel);
        if (!ele) return '';
        return ele.innerText.trim();
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

const sanitizeText = (text) => {
    text = text.replace(new RegExp('<br>', 'g'), '');
    return text.replace(/([\uE000-\uF8FF]|\uD83C[\uDF00-\uDFFF]|\uD83D[\uDC00-\uDDFF])/g, ''); // replace emoticons which can't be stored in db
};

module.exports= {
    login: login,
    getElementText: getElementText,
    autoScroll: autoScroll,
    isElementVisible: isElementVisible,
    sanitizeText: sanitizeText,
    logout: logout
};