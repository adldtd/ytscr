#!/usr/bin/env node

const CLI = require(__dirname + "/cli");
const comment_scraper = require(__dirname + "/comments/comment-scraper");

(async () => { //Main

  console.log("");
  let pack = CLI.cli(process.argv);
  let url = "";
  let destination = "";
  let settings;

  if (pack !== -1) {
    url = pack[0];
    destination = pack[1];
    settings = pack[2];
  } else
    return;

  //console.log(settings.selectors);
  //return;

  await comment_scraper.scrape(url, destination, 1000, settings);

})();