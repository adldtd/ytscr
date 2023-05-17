const helpers = require("../../../common/helpers");
const filterHelpers = require("../../../common/filter_helpers");
const {getTabData, getPopularTab} = require("../channel_helpers");
const {INFO, HEADER, PROG} = require("../../../common/verbosity_vars");


async function scrapeShorts(settings, config, timeout, innerData) {

  let savedShorts = [];
  let initialData = true;
  let counter = 0;
  let matchCounter = 0;

  let hasContinuation = true;
  while (hasContinuation) {
    hasContinuation = false;

    let contents = null;
    if (initialData) {
      initialData = false;

      let tabs = innerData.contents.twoColumnBrowseResultsRenderer.tabs;
      for (let tab in tabs) {
        tab = tabs[tab].tabRenderer;
        if (tab.selected) {

          if (settings.popular) {
            contents = await getPopularTab(tab, config, timeout);
            if (contents === -1) {
              global.sendvb(INFO, "Error: \"Popular\" sort button could not be found. Continuing scraping.\n\n");
              contents = tab.content.richGridRenderer.contents;
            }
          } else
            contents = tab.content.richGridRenderer.contents;
          
          break;
        }
      }
      if (contents === null) return savedShorts;

    } else {
      let actions = innerData.onResponseReceivedActions;
      for (let action in actions) {
        action = actions[action];
        if ("appendContinuationItemsAction" in action) {
          contents = action.appendContinuationItemsAction.continuationItems;
          break;
        }
      }
      if (contents === null) return savedShorts;
    }

    for (let item in contents) {
      item = contents[item];

      if ("continuationItemRenderer" in item) {
        config.data.continuation = item.continuationItemRenderer.continuationEndpoint.continuationCommand.token;
        hasContinuation = true;
        continue;
      }

      let innerShort = null;
      if ("richItemRenderer" in item && "reelItemRenderer" in item.richItemRenderer.content)
        innerShort = item.richItemRenderer.content.reelItemRenderer;
      else
        continue;

      let singleShort = retrieveShort(innerShort, settings.ignore);
      let match = shortMatches(singleShort, settings.filter);
      if (match) ++matchCounter;

      if (!settings.savefilter || match)
        savedShorts.push(singleShort);
      if (settings.printfilter && match)
        printShort(singleShort);

      ++counter;

      if (counter >= settings.lim || matchCounter >= settings.limfilter) {
        hasContinuation = false;
        break;
      }
    }

    if (global.verbose >= PROG) helpers.clearLastLine();
    global.sendvb(PROG, "Shorts scraped: " + counter);

    if (hasContinuation) {
      innerData = await helpers.makeRequest(config, timeout, 1, INFO);
      if (innerData === -1) break;
      innerData = innerData.data;
    }
  }

  return savedShorts;

}


function retrieveShort(innerShort, ignore) {
  let singleShort = {};

  if (!ignore.id)
    singleShort.id = innerShort.videoId;

  if (!ignore.title)
    singleShort.title = innerShort.headline.simpleText;

  if (!ignore.views)
    singleShort.views = innerShort.viewCountText.simpleText;

  if (!ignore.thumbnail) {
    let thumbnails = innerShort.thumbnail.thumbnails;
    singleShort.thumbnail = thumbnails[thumbnails.length - 1].url;
  }

  return singleShort;
}


function shortMatches(singleShort, filter) {

  let returnMatch = true;

  for (let s in filter) {

    let condition = filter[s];
    if (condition.check !== "views") { //String checker

      let shortCheck = singleShort[condition.check];
      let conditionMatch = condition.match;
      if ("casesensitive" in condition ? !condition.casesensitive : true) {
        shortCheck = shortCheck.toLowerCase();
        conditionMatch = conditionMatch.toLowerCase();
      }

      if (condition.compare === "eq") //Exact match needed
        returnMatch = shortCheck === conditionMatch;
      else if (condition.compare === "in")
        returnMatch = shortCheck.includes(conditionMatch);

    } else { //Num checker

      let shortCheck = filterHelpers.crunchSimpleViews(singleShort[condition.check]);
      switch (condition.compare) {
        case "less":
          returnMatch = shortCheck < parseInt(condition.match);
          break;
        case "greater":
          returnMatch = shortCheck > parseInt(condition.match);
          break;
        case "lesseq":
          returnMatch = shortCheck <= parseInt(condition.match);
          break;
        case "greatereq":
          returnMatch = shortCheck >= parseInt(condition.match);
          break;
        case "eq":
          returnMatch = shortCheck === parseInt(condition.match);
          break;
      }
    }

    if (!returnMatch) break;
  }

  return returnMatch;
}


function printShort(singleShort) {

  helpers.clearLastLine();
  console.log("-------------------------------------------------------------------");
  for (att in singleShort) {
    if (att === "id")
      console.log("link: https://www.youtube.com/shorts/" + singleShort[att]);
    else
      console.log(att + ": " + singleShort[att]);
  }
  console.log("-------------------------------------------------------------------\n\n");
}


async function collectShorts(settings, config, timeout, initialData) {

  global.sendvb(HEADER, "\n");
  let tabData = await getTabData(config, timeout, initialData, "Shorts");
  if (tabData === -1) {
    global.sendvb(HEADER, "No shorts found.");
    return [];
  }

  let savedShorts = await scrapeShorts(settings, config, timeout, tabData);
  global.sendvb(HEADER, "Complete");

  if (savedShorts.length === 0)
    global.sendvb(HEADER, "No shorts found.");

  return savedShorts;
}


module.exports.scrape = collectShorts;