#!/usr/bin/env node

const CLI = require(__dirname + "/cli");

(async () => { //Main

  console.log("");
  let pack = CLI.cli(process.argv);
  let scrape;
  let settings;

  if (pack === -1)
    return;
  else {
    scrape = pack[0];
    settings = pack[1];
    if (settings === -1)
      return;
  }

  //console.log(settings.selectors);
  //return;

  await scrape(settings);

})();