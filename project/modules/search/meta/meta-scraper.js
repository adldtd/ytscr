const helpers = require("../../../common/helpers");
const filterHelpers = require("../../../common/filter_helpers");


async function scrapeMetadata(settings, config, timeout, initialData) {

  let collectedMeta = {};
  let ignore = settings.meta.ignore;

  if (!ignore.estimatedResults) {
    if ("estimatedResults" in initialData)
      collectedMeta.estimatedResults = initialData.estimatedResults;
    else
      collectedMeta.estimatedResults = "";
  }

  if (!ignore.predictions) {
    collectedMeta.predictions = [];

    let newConfig = {
      url: "https://suggestqueries-clients6.youtube.com/complete/search?client=youtube&hl=en&gl=us&gs_rn=64&gs_ri=youtube&ds=yt&cp=11&gs_id=5&q=",
      authority: " suggestqueries-clients6.youtube.com",
      method: "GET",
      headers: {
        "user-agent": 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.0.0 Safari/537.36',
        referer: "https://www.youtube.com/"
      },
      validateStatus: () => true
    };

    newConfig.url += encodeURI(settings.search.input) + "&xhr=t&xssi=t";
    let response = await helpers.makeRequest(newConfig, timeout, 1, 1);
    if (response === -1) return collectedMeta;

    let retrievedData = JSON.parse(response.data.substring(4));
    for (let piece in retrievedData[1]) {
      piece = retrievedData[1][piece][0];
      collectedMeta.predictions.push(piece);
    }
  }

  return collectedMeta;
}


async function collectMeta(settings, config, timeout, initialData) {

  global.sendvb(2, "");
  let savedMeta = await scrapeMetadata(settings, config, timeout, initialData);
  global.sendvb(2, "Complete");
  return savedMeta;
}


module.exports.scrape = collectMeta;