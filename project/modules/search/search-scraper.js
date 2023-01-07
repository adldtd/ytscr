const cmd = require(__dirname + "/commands").cmd;
const path = require("path");
const fs = require("fs");
const helpers = require(path.join(__dirname, "..", "..", "common", "helpers"));


  /**********************************************************************************************/
 /* The handler for the search module and all of its submodules; calls other scraping commands */
/**********************************************************************************************/


function retrieveInitialResp(config, response) {

  let innerData = '{"' + helpers.safeSplit(response.data, '">var ytInitialData = {"', 1)[1];
  innerData = helpers.retrieveJSON(innerData);

  //Reconfigure config
  let API_KEY = helpers.safeSplit(helpers.safeSplit(response.data, '"INNERTUBE_API_KEY":"', 1)[1], '"', 1)[0];
  let newUrl = "https://www.youtube.com/youtubei/v1/search?key=" + API_KEY + "&prettyPrint=false";

  config.url = newUrl;
  config.method = "POST";

  return innerData;
}


async function applySingleFilter(config, timeout, url, graftUrl, modifier, firstFilter) {

  config.data.params = modifier;
  config.data.context.client.originalUrl = url + "&sp=" + modifier; //!!!!!!!!!!!!!!!!!!!!!!!! This may be wrong
  config.data.context.client.mainAppWebInfo.graftUrl = graftUrl + "&sp=" + modifier;

  if (firstFilter)
    global.sendvb(2, "\n ------------ Applying search filters... ------------");

  let innerData = await helpers.makeRequest(config, timeout, 1, 1);
  if (innerData === -1) return -1;
  return innerData.data;
}

async function applyFilters(config, innerData, innerSettings, timeout) {

  let filterToGroup = {tframe: "Upload date",
                       type: "Type",
                       duration: "Duration",
                       features: "Features",
                       sort: "Sort by"};

  let choiceToValue = {"lastHour": "Last hour",
                       "today": "Today",
                       "thisWeek": "This week",
                       "thisMonth": "This month",
                       "thisYear": "This year",
                       "video": "Video",
                       "channel": "Channel",
                       "playlist": "Playlist",
                       "movie": "Movie",
                       "under4": "Under 4 minutes",
                       "4-20": "4 - 20 minutes",
                       "over20": "Over 20 minutes",
                       "Live": "Live",
                       "4K": "4K",
                       "HD": "HD",
                       "Subtitles/CC": "Subtitles/CC",
                       "CreativeCommons": "Creative Commons",
                       "360": "360°",
                       "VR180": "VR180",
                       "3D": "3D",
                       "HDR": "HDR",
                       "Location": "Location",
                       "Purchased": "Purchased",
                       "relevance": "Relevance",
                       "uploadDate": "Upload date",
                       "viewCount": "View count",
                       "rating": "Rating"};

  let url = config.data.context.client.originalUrl;
  let graftUrl = config.data.context.client.mainAppWebInfo.graftUrl;

  let firstFilter = true;
  let filterFound = false;
  let filters = ["tframe", "type", "duration", "features", "sort"]; //Set of all valid filters
  let filtersToItems = {}

  for (let filter in filters) {
    filter = filters[filter];
    let items = {};
    let value = innerSettings[filter];

    if (typeof(value) == "string") {
      if (value !== "")
        items[value] = "";
    } else
      items = value; //For the case of "Features"; the value is already an object

    filtersToItems[filter] = items;
  }

  //console.log(filtersToItems);

  let appliedFilters = {tframe: "", type: "", duration: "", features: "", sort: ""}; //Used for error printing in case of clashing filters
  for (let filter in filtersToItems) {
    filterFound = false;

    //For each filter item in each filtering category (in general, "Features" is the only one with multiple options)
    let items = filtersToItems[filter];
    for (let value in items) {
      filterFound = false;

      //Inner filter groups
      let groups = innerData.contents.twoColumnSearchResultsRenderer.primaryContents.sectionListRenderer.subMenu.searchSubMenuRenderer.groups;
      for (let group in groups) {
        group = groups[group].searchFilterGroupRenderer;
        if (group.title.simpleText !== filterToGroup[filter]) continue;

        //Filter values inside of the groups
        group = group.filters;
        for (let piece in group) {
          piece = group[piece].searchFilterRenderer;
          if (piece.label.simpleText !== choiceToValue[value]) continue;

          if ("navigationEndpoint" in piece) {
            let modifier = piece.navigationEndpoint.searchEndpoint.params;
            innerData = await applySingleFilter(config, timeout, url, graftUrl, modifier, firstFilter);
            if (innerData === -1) return -1;
          } else {
            global.sendvb(0, "\nError: Failed to apply filter \"" + value + "\" in filter group \"" + filter + "\"");
            if (!firstFilter) {
              global.sendvb(0, "(This was after applying the following {filter group}: {filter} values):\n")

              //if (appliedFilters[apf] !== "")
              //  global.sendvb(0, apf + ":\t\t" + appliedFilters[apf].substring(2));
              let maxLength = 0;
              for (let apf in appliedFilters) { //Preprocessing
                if (apf.length > maxLength && appliedFilters[apf] !== "")
                  maxLength = apf.length;
              }

              for (let apf in appliedFilters) { //Preprocessing
                if (appliedFilters[apf] !== "")
                  global.sendvb(0, apf + ":" + " ".repeat(maxLength - apf.length + 1) + appliedFilters[apf].substring(2));
              }
            }
            return -1;
          }

          firstFilter = false;
          filterFound = true;
          appliedFilters[filter] += ", \"" + value + "\"";
          break;
        }

        if (filterFound)
          break;
      }

    }
  }

  return innerData;

}


async function scrapeSearchModule(settings) {

  let savedData = {};
  let innerSettings = settings.search;

  //Data to be passed in the request
  let config = {
    url: "__________",
    authority: "www.youtube.com",
    method: "GET", //Needs to be changed to POST later on
    headers:
    {
      "user-agent": 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.0.0 Safari/537.36',
      referer: "https://www.google.com/"
    },
    validateStatus: () => true
  };

  let timeout = innerSettings.timeout;
  let url = "https://www.youtube.com/results?search_query=" + innerSettings.input;
  config.url = url;
  global.sendvb(1, "\nScraping from search query \"" + innerSettings.input + "\".");

  let response = await helpers.makeRequest(config, timeout, 1, 1);
  if (response == -1) return -1;

  config.data = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "..", "common", "config_data.json")));
  config.data.context.client.originalUrl = url;
  config.data.context.client.mainAppWebInfo.graftUrl = "/results?search_query=" + innerSettings.input;
  config.data.query = innerSettings.input;

  let innerData = retrieveInitialResp(config, response);
  innerData = await applyFilters(config, innerData, innerSettings, timeout);
  if (innerData === -1) return -1;

  console.log(innerData);
}


module.exports.scrape = scrapeSearchModule;