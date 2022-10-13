const cmd = require(__dirname + "/commands").cmd;
const path = require("path");
const fs = require("fs");
const helpers = require(path.join(__dirname, "..", "..", "common", "helpers"));


  /*********************************************************************************************/
 /* The handler for the video module and all of its submodules; calls other scraping commands */
/*********************************************************************************************/


function verifyResponse(resp) {

  let initialData = helpers.safeSplit(resp.data, "var ytInitialData = ", 1);
  if (initialData.length < 2) {
    global.sendvb(1, "\nAn unexpected error occurred.\nNo info retrievable.");
    return -1;
  }
  initialData = JSON.parse(helpers.safeSplit(initialData[1], ";</script><script nonce", 1)[0]);
  initialData = initialData.contents.twoColumnWatchNextResults.results.results;
  if (!("contents" in initialData)) {
    global.sendvb(1, "\nThe video entered does not exist.\nNo info retrievable.");
    return -1;
  }
  initialData = initialData.contents;

  let contents = initialData[initialData.length - 1].itemSectionRenderer.contents;
  let requestError = false;
  for (c in contents) {

    if ("backgroundPromoRenderer" in contents[c]) {
      global.sendvb(1, "\nError: " + contents[c].backgroundPromoRenderer.title.runs[0].text);
      requestError = true;
      break;
    } else if ("continuationItemRenderer" in contents[c])
      continue;
  }

  if (requestError) {
    global.sendvb(1, "No info retrievable.");
    return -1;
  }

  return 0;
}


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
  global.sendvb(1, "\nScraping video \"" + settings.video.input + "\"."); //Custom defined printing function

  config.data = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "..", "common", "config_data.json")));
  config.data.context.client.originalUrl = config.headers.referer;
  config.data.context.client.mainAppWebInfo.graftUrl = config.headers.referer;

  //Contains the data needed for the other scrapers
  let videoResp = await helpers.makeRequest(config, settings.video.timeout, 1, 1);
  if (videoResp === -1) {
    global.sendvb(1, "No save made.");
    return -1;
  }

  let result = verifyResponse(videoResp);
  if (result === -1) {
    global.sendvb(1, "No save made.");
    return -1;
  }

  //Scrape each of the modules
  for (md in settings.video.focus) {

    if (settings.video.focus[md]) {
      let scrapeCommand = cmd.modules[md].scrape;
      global.sendvb(2, "\n ------------ Scraping " + md + "... ------------");

      settings[md].save = true;
      let res = await scrapeCommand(settings[md], config, settings.video.timeout, videoResp);
      if (res !== -1) savedData[md] = res;
    }
  }

  let finalDestination = helpers.handleSaveJSON(settings.video.output, savedData, settings.video.prettyprint);
  global.sendvb(1, "\nSaved as " + finalDestination + "\n");

}


module.exports.scrape = scrapeVideoModule;