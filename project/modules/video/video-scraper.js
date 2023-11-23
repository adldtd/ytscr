const cmd = require(__dirname + "/commands").cmd;
const path = require("path");
const helpers = require(path.join(__dirname, "..", "..", "common", "helpers"));


  /*********************************************************************************************/
 /* The handler for the video module and all of its submodules; calls other scraping commands */
/*********************************************************************************************/


function verifyResponse(resp) {

  let initialData = helpers.safeSplit(resp.data, "\">var ytInitialData = ", 1);
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
  
  let contents = initialData[initialData.length - 1];
  if (!("itemSectionRenderer" in contents && "contents" in contents.itemSectionRenderer)) //Livestream
    return 0; //Break early

  let requestError = false;
  contents = contents.itemSectionRenderer.contents;
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

  global.sendvb(1, "\nScraping video \"" + settings.video.input + "\"."); //Custom defined printing function
  let savedData = {};

  let config = helpers.retrieveConfig();

  config.url = settings.video.input;
  config.headers.referer = settings.video.input;
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

  if (settings.video.save) {
    let finalDestination = helpers.handleSaveJSON(settings.video.output, savedData, settings.video.prettyprint);
    global.sendvb(1, "\nSaved as " + finalDestination + "\n");
  }

  return savedData;

}


module.exports.scrape = scrapeVideoModule;