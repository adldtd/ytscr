const helpers = require("../../../common/helpers");
const filterHelpers = require("../../../common/filter_helpers");
const {getTabData, getPopularTab} = require("../channel_helpers");
const {INFO, HEADER, PROG} = require("../../../common/verbosity_vars");


async function scrapeLive(settings, config, timeout, innerData) {

  let savedLive = [];
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
      if (contents === null) return savedLive;

    } else {
      let actions = innerData.onResponseReceivedActions;
      for (let action in actions) {
        action = actions[action];
        if ("appendContinuationItemsAction" in action) {
          contents = action.appendContinuationItemsAction.continuationItems;
          break;
        }
      }
      if (contents === null) return savedLive;
    }

    for (let item in contents) {
      item = contents[item];

      if ("continuationItemRenderer" in item) {
        config.data.continuation = item.continuationItemRenderer.continuationEndpoint.continuationCommand.token;
        hasContinuation = true;
        continue;
      }

      let innerLive = null;
      if ("richItemRenderer" in item && "videoRenderer" in item.richItemRenderer.content)
        innerLive = item.richItemRenderer.content.videoRenderer;
      else
        continue;

      let singleLive = retrieveLive(innerLive, settings.ignore);
      let match = liveMatches(singleLive, settings.filter);
      if (match) ++matchCounter;

      if (!settings.savefilter || match)
        savedLive.push(singleLive);
      if (settings.printfilter && match)
        printLive(singleLive);

      ++counter;

      if (counter >= settings.lim || matchCounter >= settings.limfilter) {
        hasContinuation = false;
        break;
      }
    }

    if (global.verbose >= PROG) helpers.clearLastLine();
    global.sendvb(PROG, "Livestreams scraped: " + counter);

    if (hasContinuation) {
      innerData = await helpers.makeRequest(config, timeout, 1, INFO);
      if (innerData === -1) break;
      innerData = innerData.data;
    }
  }

  return savedLive;
}


function retrieveLive(innerLive, ignore) {
  let singleLive = {};

  let isLive = false;
  for (let overlay in innerLive.thumbnailOverlays) {
    overlay = innerLive.thumbnailOverlays[overlay];
    if ("thumbnailOverlayTimeStatusRenderer" in overlay) {
      overlay = overlay.thumbnailOverlayTimeStatusRenderer;
      if ("icon" in overlay && overlay.icon.iconType === "LIVE") {
        isLive = true;
        break;
      }
    }
  }

  if (!ignore.id)
    singleLive.id = innerLive.videoId;

  if (!ignore.title) {
    singleLive.title = "";
    for (let run in innerLive.title.runs)
      singleLive.title += innerLive.title.runs[run].text;
  }

  if (!ignore.views) {
    singleLive.views = "";
    if (!isLive)
      singleLive.views = innerLive.viewCountText.simpleText;
  }

  if (!ignore.watching) {
    singleLive.watching = "";
    if (isLive) {
      for (let run in innerLive.viewCountText.runs)
        singleLive.watching += innerLive.viewCountText.runs[run].text;
    }
  }

  if (!ignore.duration) {
    singleLive.duration = "";
    if (!isLive)
      singleLive.duration = innerLive.lengthText.simpleText;
  }

  if (!ignore.status) {
    if (isLive)
      singleLive.status = "LIVE";
    else
      singleLive.status = innerLive.publishedTimeText.simpleText;
  }

  if (!ignore.thumbnail) {
    let thumbnails = innerLive.thumbnail.thumbnails;
    singleLive.thumbnail = thumbnails[thumbnails.length - 1].url;
  }

  return singleLive;
}


function liveMatches(singleLive, filter) {

  let returnMatch = true;

  for (let s in filter) { //String checker

    let condition = filter[s];
    if (condition.check !== "views" && condition.check !== "watching" && condition.check !== "duration") {

      let liveCheck = singleLive[condition.check];
      let conditionMatch = condition.match;
      if ("casesensitive" in condition ? !condition.casesensitive : true) {
        liveCheck = liveCheck.toLowerCase();
        conditionMatch = conditionMatch.toLowerCase();
      }

      if (condition.compare === "eq") //Exact match needed
        returnMatch = liveCheck === conditionMatch;
      else if (condition.compare === "in")
        returnMatch = liveCheck.includes(conditionMatch);

    } else { //Num checker

      if (singleLive[condition.check] === "") continue; //NULL; matches instantly

      let liveCheck = null;
      if (condition.check === "views" || condition.check === "watching")
        liveCheck = filterHelpers.crunchViewCount(singleLive[condition.check]);
      else if (condition.check === "duration")
        liveCheck = filterHelpers.durationToSec(singleLive["duration"]);

      switch (condition.compare) {
        case "less":
          returnMatch = liveCheck < parseInt(condition.match);
          break;
        case "greater":
          returnMatch = liveCheck > parseInt(condition.match);
          break;
        case "lesseq":
          returnMatch = liveCheck <= parseInt(condition.match);
          break;
        case "greatereq":
          returnMatch = liveCheck >= parseInt(condition.match);
          break;
        case "eq":
          returnMatch = liveCheck === parseInt(condition.match);
          break;
      }
    }

    if (!returnMatch) break;
  }
  
  return returnMatch;
}


function printLive(singleLive) {

  helpers.clearLastLine();
  console.log("-------------------------------------------------------------------");
  for (att in singleLive) {
    if (att === "id")
      console.log("link: https://www.youtube.com/watch?v=" + singleLive[att]);
    else
      console.log(att + ": " + singleLive[att]);
  }
  console.log("-------------------------------------------------------------------\n\n");
}


async function collectLive(settings, config, timeout, initialData) {

  global.sendvb(HEADER, "\n");
  let tabData = await getTabData(config, timeout, initialData, "Live");
  if (tabData === -1) {
    global.sendvb(HEADER, "No livestreams found.");
    return [];
  }

  let savedLive = await scrapeLive(settings, config, timeout, tabData);
  global.sendvb(HEADER, "Complete");

  if (savedLive.length === 0)
    global.sendvb(HEADER, "No livestreams found.");

  return savedLive;
}


module.exports.scrape = collectLive;