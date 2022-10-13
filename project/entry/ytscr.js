#!/usr/bin/env node

const cli = require(__dirname + "/cli").cli;
const path = require("path");
const gl = require(path.join(__dirname, "..", "common", "globals"));

(async () => { //Main

  console.log("");
  let pack = cli(process.argv);
  let scrape;
  let settings;

  if (pack === -1 || pack === 1)
    return;
  else {
    scrape = pack[0];
    settings = pack[1];
  }

  //console.log(settings.selectors);
  //return;

  await scrape(settings);

})();