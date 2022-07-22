#!/usr/bin/env node

const CLI = require(__dirname + "/cli");
const comment_scraper = require(__dirname + "/commentsAxios");

(async () => { //Main

  let pack = CLI.cli(process.argv);
  let url = "";
  let destination = "";
  let settings;

  if (pack !== -1) {
    url = pack[0];
    destination = pack[1];
    settings = pack[2];
    console.log("No issues found");
  } else
    return;

})();