const cmd = require(__dirname + "/commands").cmd;
const {INFO, HEADER, PROG} = require("../../common/verbosity_vars");
const path = require("path");
const helpers = require(path.join(__dirname, "..", "..", "common", "helpers"));


function verifyResponse(config, channelResp) {

  let innerData = '{"' + helpers.safeSplit(channelResp.data, 'var ytInitialData = {"', 1)[1];
  innerData = helpers.retrieveJSON(innerData);

  for (let alert in innerData.alerts) {
    alert = innerData.alerts[alert];
    if ("alertWithButtonRenderer" in alert)
      alert = alert.alertWithButtonRenderer;
    else
      alert = alert.alertRenderer;
    
    if (alert.type === "ERROR") { //No data is retrievable
      let errorText = "Error: ";
      if ("runs" in alert.text) {
        for (run in alert.text.runs)
          errorText += alert.text.runs[run].text;
      } else
        errorText += alert.text.simpleText;
      
      global.sendvb(INFO, errorText);
      return -1;
    }
  }

  let API_KEY = helpers.safeSplit(helpers.safeSplit(channelResp.data, '"INNERTUBE_API_KEY":"', 1)[1], '"', 1)[0];
  let newUrl = " https://www.youtube.com/youtubei/v1/browse?key=" + API_KEY + "&prettyPrint=false";

  config.url = newUrl;
  config.method = "POST";

  return innerData;

}


async function scrapeChannelModule(settings) {

  global.sendvb(INFO, "\nScraping channel \"" + settings.channel.input + "\".");
  let savedData = {};

  let config = helpers.retrieveConfig();

  config.url = settings.channel.input;
  config.headers.referer = settings.channel.input;
  config.data.context.client.originalUrl = config.headers.referer;
  config.data.context.client.mainAppWebInfo.graftUrl = config.headers.referer;

  let channelResp = await helpers.makeRequest(config, settings.channel.timeout, 1, 1);
  if (channelResp === -1) {
    global.sendvb(INFO, "No save made.");
    return -1;
  }

  let innerData = verifyResponse(config, channelResp);
  if (innerData === -1) {
    global.sendvb(INFO, "No save made.");
    return -1;
  }

  //Scrape all modules
  for (let md in settings.channel.focus) {

    if (settings.channel.focus[md]) {
      let scrapeCommand = cmd.modules[md].scrape;
      global.sendvb(HEADER, "\n ------------ Scraping " + md + "... ------------");

      settings[md].save = true;

      let res = await scrapeCommand(settings[md], config, settings.channel.timeout, innerData);
      if (res !== -1) savedData[md] = res;
    }
  }

  if (settings.channel.save) {
    let finalDestination = helpers.handleSaveJSON(settings.channel.output, savedData, settings.channel.prettyprint);
    global.sendvb(INFO, "\nSaved as " + finalDestination + "\n");
  }

  return savedData;
  
}


module.exports.scrape = scrapeChannelModule;