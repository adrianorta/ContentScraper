const fs = require('fs');
//Chosen scraping and CSV packages meet the following requirements on npm:
//1,000 downloads
//Updated in the last 6 months
const Crawler = require('crawler');
const json2csv = require('json2csv');
//Program creates onedata folder if that folder doesn’t already exist. If the folder does exist, the program does nothing.
const site = 'http://shirts4mike.com/';
let data = [];
//Column headers are in this order: Title, Price, ImageURL, URL, Time
const fields = ['title', 'price', 'image', 'url', 'time'];

fs.writeFile('./scraper-error.log', '', () => {});

try {
  fs.mkdir('./data', () => {});
} catch (error) {}

crawler(site + 'shirts.php');

function crawler (url) {
  var c = new Crawler({
      retries: 0,
      // This will be called for each crawled page
      callback : function (error, res, done) {
        //The program displays a human-friendly error (not just the original error code) when it cannot connect to http://shirts4mike.com
          if(error && error.code === 'ENOTFOUND') {
            console.log('There’s been a 404 error. Cannot connect to http://shirts4mike.com.');
          }
          else if(error){
            errorLogger(error);
          }else{
              var $ = res.$;
              //The project uses the http://shirts4mike.com/shirts.php URL as an entry point to look through the links on the page to find 8 shirts
              $('.products a').each(function() {
                crawler(site + $(this).attr("href"));
              });
              //Project scrapes the product title, price, image and url, and all information is correct and in the correct place
              //Column headers are in this order: Title, Price, ImageURL, URL, Time
              let info = {
                'title': $('title').text(),
                'price': $('price').text(),
                'image': $('img').attr('src'),
                'url': url,
                'time': new Date().toJSON()
              }
              data.push(info);
              if(data.length === 8) {
                //A CSV is successfully saved to the ‘data’ folder in this format: ‘YYYY-MM-DD.csv’, e.g. ‘2016-12-30.csv’.
                let path = './data/' + getDate() + '.csv';
                let csv = json2csv({data: data, fields: fields});
                //If the script is run twice, the program overwrites the data. The file contains the data from the second call.
                fs.writeFile(path, csv, (error) => {
                  errorLogger(error);
                  //New errors append to the end of the file with a timestamp, e.g. [Tue Feb 16 2016 13:00:55 GMT-0800 (PST)] <error message>
                  errorLogger(new Date().toUTCString());
                });
              }
          }
          done();
      }
  });
  // Queue just one URL, with default callback
  c.queue(url);
}

function getDate() {
  let now = new Date();
  return now.getFullYear() + '-' + (now.getMonth()+1) + '-' + now.getDate();
}

//Program logs errors in a scraper-error.log` file.
function errorLogger(error) {
  fs.appendFile('scraper-error.log', error + '\n', function (err) {
    if (err) throw err;
  });
}
