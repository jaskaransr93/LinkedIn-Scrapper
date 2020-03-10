const puppeteer = require('puppeteer');
const linkedIn = require('./linkedinUtil');
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

$( document ).ready(function() {
    $('#add-more').click(function() {
        $('#url-container').append('<div class="form-group"><input type="text" class="form-control linkedIn-url" placeholder="Enter LinkedIn Profile Url"></div>');
    });
    $('#add-senior-more').click(function() {
        $('#url-senior-container').append('<div class="form-group"><input type="text" class="form-control linkedIn-senior-url" placeholder="Enter LinkedIn Profile Url"></div>');
    });

    $('#run').click(function() {
        var linkedinUrls = $('.linkedIn-senior-url').map(function() {
            return $(this).val();
         });
        run(linkedinUrls);
    });
});

async function run(urls) {
    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: {
            width: 1600,
            height: 900
        }
    });
    const page = await browser.newPage();
    await linkedIn.login(page,  {
        username: $('#linkedInId').val(),
        password: $('#password').val()
    });
    for (var i = 0; i < )
}