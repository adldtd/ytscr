const cmd = require(__dirname + "/commands").cmd;
const path = require("path");
const fs = require("fs");
const helpers = require(path.join(__dirname, "..", "..", "common", "helpers"));


function verifyResponse(config, playlistResp) {

  let innerData = '{"' + helpers.safeSplit(playlistResp.data, 'var ytInitialData = {"', 1)[1];
  innerData = helpers.retrieveJSON(innerData);

  for (let alert in innerData.alerts) {
    alert = innerData.alerts[alert];
    if ("alertWithButtonRenderer" in alert)
      alert = alert.alertWithButtonRenderer;
    else
      alert = alert.alertRenderer;
    
    if (alert.type === "ERROR") { //No data is retrievable
      let errorText = "Error: ";
      for (run in alert.text.runs)
        errorText += alert.text.runs[run].text;
      global.sendvb(1, errorText);
      return -1;
    }
  }

  //Reconfigure config
  let API_KEY = helpers.safeSplit(helpers.safeSplit(playlistResp.data, '"INNERTUBE_API_KEY":"', 1)[1], '"', 1)[0];
  let newUrl = " https://www.youtube.com/youtubei/v1/browse?key=" + API_KEY + "&prettyPrint=false";

  config.url = newUrl;
  config.method = "POST";

  return innerData;
}


async function scrapePlaylistModule(settings) {
  
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

  config.url = settings.playlist.input;
  config.headers.referer = settings.playlist.input;
  global.sendvb(1, "\nScraping playlist \"" + settings.playlist.input + "\".");

  let playlistResp = await helpers.makeRequest(config, settings.playlist.timeout, 1, 1);
  if (playlistResp === -1) {
    global.sendvb(1, "No save made.");
    return -1;
  }

  config.data = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "..", "common", "config_data.json")));
  config.data.context.client.originalUrl = config.headers.referer;
  config.data.context.client.mainAppWebInfo.graftUrl = config.headers.referer;

  let innerData = verifyResponse(config, playlistResp);
  if (innerData === -1) {
    global.sendvb(1, "No save made.");
    return -1;
  }

  //Scrape all modules
  for (let md in settings.playlist.focus) {

    if (settings.playlist.focus[md]) {
      let scrapeCommand = cmd.modules[md].scrape;
      global.sendvb(2, "\n ------------ Scraping " + md + "... ------------");

      settings[md].save = true;

      let res = await scrapeCommand(settings[md], config, settings.playlist.timeout, innerData);
      if (res !== -1) savedData[md] = res;
    }
  }

  if (settings.playlist.save) {
    let finalDestination = helpers.handleSaveJSON(settings.playlist.output, savedData, settings.playlist.prettyprint);
    global.sendvb(1, "\nSaved as " + finalDestination + "\n");
  }

  return savedData;

}


module.exports.scrape = scrapePlaylistModule;