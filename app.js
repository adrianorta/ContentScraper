const startScript = require("start-script")();
const fs = require('fs');
const Crawler = require("crawler");
const json2csv = require('json2csv');
const site = 'http://shirts4mike.com/';
const fields = ['title', 'price', 'image', 'url', 'time'];
let scrapedData = [];

//Empty error.log file
fs.writeFile('./scraper-error.log', '', () => {});
//Attempt to make data folder if not already there
try {
  fs.mkdir('./data', ()=>{});
} catch (error) {
  if(error.code === 'EEXIST'){
    console.log(error.code);
    errorLogger(error);
  }
}

//visit http://shirts4mike.com
//and use http://shirts4mike.com/shirts.php as entry
//crawl through each desired page looking for info
let siteCrawler = new Crawler({
    // This will be called for each crawled page
    retries: 0,
    callback : function (error, res, done) {
        //return human friendly error log if there is no connection
        if(error && error.code === 'ENOTFOUND'){
            errorLogger(error);
            console.log('There’s been a 404 error. Cannot connect to http://shirts4mike.com.');
        }else{
            var $ = res.$;
            //crawl through each page
            $('.products li a').each(function () {
              getInfo(site + $(this).attr("href"));
            });
        }
        done();
    }
});
siteCrawler.queue(site + 'shirts.php');

//scrape desired info from page
function getInfo(url){
  let pageCrawler = new Crawler({
      // This will be called for each crawled page
      callback : function (error, res, done) {
          if(error){
              errorLogger(error);
              console.log(error);
          }else{
              var $ = res.$;
              //The droids we're looking for
              let info = {
                price: $('.price').text(),
                title: $('title').text(),
                image: $('img').attr('src'),
                url: url,
                time: new Date().toJSON()
              }
              scrapedData.push(info);

              if(scrapedData.length === 8){
                //Format file name as "Year-Month-Date.csv"
                let path = './data/' + getDate() + '.csv';
                //Convert scraped data from JSON to CSV
                //HEADER: Title, Price, ImageURL, URL, and Time
                let csv = json2csv({ data: scrapedData, fields: fields });
                //Save inside data folder
                //Overwrite data csv each save
                fs.writeFile(path, csv, (err) => {
                  errorLogger(err);
                  errorLogger(new Date().toUTCString());
                  if (err) throw err;
                  console.log('DONE!');
                });
              }
          }
          done();
      }
  });
  pageCrawler.queue(url);
}

function getDate() {
  let now = new Date();
  return now.getFullYear() + '-' + (now.getMonth()+1) + '-' + now.getDate();
}

function errorLogger(error) {
  fs.appendFile('scraper-error.log', error + '\n', function (err) {
    if (err) throw err;
  });
}
