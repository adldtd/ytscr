const axios = require("axios").default;
const cmd = require(__dirname + "/commands").cmd;
const path = require("path");
const helpers = require(path.join(__dirname, "..", "..", "common", "helpers"));


async function scrapeVideoModule(settings) {

  let savedData = {};

  //Data to be passed in the request
  let config = {
    url: "__________",
    authority: "www.youtube.com",
    method: "GET", //Needs to be changed to POST later on
    headers:
    {
      "user-agent": 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.0.0 Safari/537.36',
      referer: "__________"
    },
    validateStatus: () => true
  };

  config.url = settings.video.input;
  config.headers.referer = settings.video.input;
  console.log("\nScraping video \"" + settings.video.input + "\".");

  //Contains the data needed for the other scrapers
  let videoResp = await helpers.makeRequest(config, settings.video.timeout, 1);
  if (videoResp === -1) return -1;

  //Scrape each of the modules
  for (md in settings.video.focus) {

    if (settings.video.focus[md]) {
      let scrapeCommand = cmd.modules[md].scrape;
      console.log("\n ------------ Scraping " + md + "... ------------");

      settings[md].save = true;
      let res = await scrapeCommand(settings[md], config, settings.video.timeout, videoResp);
      if (res !== -1) savedData[md] = res;
    }
  }

  let finalDestination = helpers.handleSaveJSON(settings.video.output, savedData, settings.video.prettyprint);
  console.log("\nSaved as " + finalDestination + "\n");

}


module.exports.scrape = scrapeVideoModule;