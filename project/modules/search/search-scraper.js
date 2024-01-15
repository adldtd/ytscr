const path = require("path");
const helpers = require(path.join(__dirname, "..", "..", "common", "helpers"));

const meta_scraper = require("./meta/meta-scraper").scrape;
const results_scraper = require("./results/results-scraper").scrape;


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

  let choiceToValue = {"LastHour": "Last hour",
                       "Today": "Today",
                       "ThisWeek": "This week",
                       "ThisMonth": "This month",
                       "ThisYear": "This year",
                       "Video": "Video",
                       "Channel": "Channel",
                       "Playlist": "Playlist",
                       "Movie": "Movie",
                       "Under4Minutes": "Under 4 minutes",
                       "4-20Minutes": "4 - 20 minutes",
                       "Over20Minutes": "Over 20 minutes",
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
                       "Relevance": "Relevance",
                       "UploadDate": "Upload date",
                       "ViewCount": "View count",
                       "Rating": "Rating"};

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
      let groups = innerData.header.searchHeaderRenderer.searchFilterButton.buttonRenderer.command.openPopupAction.popup.searchFilterOptionsDialogRenderer.groups;
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

  if (!firstFilter)
    global.sendvb(2, "\nComplete");

  return innerData;

}


async function scrapeSearchModule(settings) {

  let savedData = {};
  let innerSettings = settings.search;
  global.sendvb(1, "\nScraping from search query \"" + innerSettings.input + "\".");

  let config = helpers.retrieveConfig();

  let url = "https://www.youtube.com/results?search_query=" + encodeURI(innerSettings.input); //Allows the user to pass Unicode strings
  config.url = url;
  config.headers.referer = "https://www.google.com/";
  config.data.context.client.originalUrl = url;
  config.data.context.client.mainAppWebInfo.graftUrl = "/results?search_query=" + encodeURI(innerSettings.input);

  let timeout = innerSettings.timeout;
  let response = await helpers.makeRequest(config, timeout, 1, 1);
  if (response == -1) return -1;

  let innerData = retrieveInitialResp(config, response);
  innerData = await applyFilters(config, innerData, innerSettings, timeout);
  if (innerData === -1) return -1;

  //************************************************************************The main scraping modules
  let nonResultModules = {meta: ""};
  let focusResults = false;
  for (let result in settings.search.focus) {
    if (result in nonResultModules) continue;
    focusResults = (focusResults || settings.search.focus[result]);
    if (focusResults) break;
  }

  //Meta module
  if (settings.search.focus.meta) {
    global.sendvb(2, "\n ------------ Scraping meta... ------------");
    let savedMeta = await meta_scraper(settings, config, timeout, innerData);
    if (savedMeta !== -1) savedData.meta = savedMeta;
  }

  //Results mega-module
  if (focusResults) {
    global.sendvb(2, "\n ------------ Scraping results... ------------");
    let savedResults = await results_scraper(settings, config, timeout, innerData);

    if (savedResults !== -1) {
      if (settings.search.seperate) {
        for (let key in savedResults)
          savedData[key] = savedResults[key];
      } else
        savedData["results"] = savedResults;
    }
  }
  
  if (settings.search.save) {
    let finalDestination = helpers.handleSaveJSON(settings.search.output, savedData, settings.search.prettyprint);
    global.sendvb(1, "\nSaved as " + finalDestination + "\n");
  }

  return savedData;

}


module.exports.scrape = scrapeSearchModule;