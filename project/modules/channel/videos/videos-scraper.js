const helpers = require("../../../common/helpers");
const filterHelpers = require("../../../common/filter_helpers");
const {INFO, HEADER, PROG} = require("../../../common/verbosity_vars");


async function getTabData(config, timeout, initialData) {

  let tabs = initialData.contents.twoColumnBrowseResultsRenderer.tabs;
  for (let tab in tabs) {
    tab = tabs[tab].tabRenderer;

    if (tab.title === "Videos") {

      config.data.browseId = tab.endpoint.browseEndpoint.browseId;
      config.data.params = tab.endpoint.browseEndpoint.params;
      delete config.data.continuation;
      let tabData = await helpers.makeRequest(config, timeout, 1, INFO);
      if (tabData == -1) return -1;

      delete config.data.browseId;
      delete config.data.params;
      return tabData.data;

    }
  }

  global.sendvb(HEADER, 'Tab "videos" could not be found.');
  return -1;

}

async function scrapeVideos(settings, config, timeout, innerData) {

  let savedVideos = [];
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
          contents = tab.content.richGridRenderer.contents;
          break;
        }
      }
      if (contents === null) return savedVideos;

    } else {
      let actions = innerData.onResponseReceivedActions;
      for (let action in actions) {
        action = actions[action];
        if ("appendContinuationItemsAction" in action) {
          contents = action.appendContinuationItemsAction.continuationItems;
          break;
        }
      }
      if (contents === null) return savedVideos;
    }

    for (let item in contents) {
      item = contents[item];

      if ("continuationItemRenderer" in item) {
        config.data.continuation = item.continuationItemRenderer.continuationEndpoint.continuationCommand.token;
        hasContinuation = true;
        continue;
      }

      let innerVideo = null;
      if ("richItemRenderer" in item && "videoRenderer" in item.richItemRenderer.content)
        innerVideo = item.richItemRenderer.content.videoRenderer;
      else
        continue;

      let singleVideo = retrieveVideo(innerVideo, settings.ignore);
      let match = videoMatches(singleVideo, settings.filter);
      if (match) ++matchCounter;

      if (!settings.savefilter || match)
        savedVideos.push(singleVideo);
      if (settings.printfilter && match)
        printVideo(singleVideo);

      ++counter;

      if (counter >= settings.lim || matchCounter >= settings.limfilter) {
        hasContinuation = false;
        break;
      }
    }

    if (global.verbose >= PROG) helpers.clearLastLine();
    global.sendvb(PROG, "Videos scraped: " + counter);

    if (hasContinuation) {
      innerData = await helpers.makeRequest(config, timeout, 1, INFO);
      if (innerData === -1) break;
      innerData = innerData.data;
    }
  }

  return savedVideos;

}


function retrieveVideo(innerVideo, ignore) {
  let singleVideo = {};

  if (!ignore.id)
    singleVideo.id = innerVideo.videoId;

  if (!ignore.title) {
    singleVideo.title = "";
    for (let run in innerVideo.title.runs)
      singleVideo.title += innerVideo.title.runs[run].text;
  }

  if (!ignore.views)
    singleVideo.views = innerVideo.viewCountText.simpleText;

  if (!ignore.duration)
    singleVideo.duration = innerVideo.lengthText.simpleText;

  if (!ignore.published)
    singleVideo.published = innerVideo.publishedTimeText.simpleText;

  if (!ignore.thumbnail) {
    let thumbnails = innerVideo.thumbnail.thumbnails;
    singleVideo.thumbnail = thumbnails[thumbnails.length - 1].url;
  }

  return singleVideo;
}


function videoMatches(singleVideo, filter) {

  let returnMatch = true;

  for (s in filter) {

    let condition = filter[s];
    if (condition.check !== "views" && condition.check !== "duration") {

      let videoCheck = singleVideo[condition.check];
      let conditionMatch = condition.match;
      if ("casesensitive" in condition ? !condition.casesensitive : true) {
        videoCheck = videoCheck.toLowerCase();
        conditionMatch = conditionMatch.toLowerCase();
      }

      if (condition.compare === "eq") //Exact match needed
        returnMatch = videoCheck === conditionMatch;
      else if (condition.compare === "in")
        returnMatch = videoCheck.includes(conditionMatch);

    } else {

      let videoCheck = null;
      if (condition.check === "views")
        videoCheck = filterHelpers.crunchViewCount(singleVideo[condition.check]);
      else
        videoCheck = filterHelpers.durationToSec(singleVideo[condition.check]);

      switch (condition.compare) {
        case "less":
          returnMatch = videoCheck < parseInt(condition.match);
          break;
        case "greater":
          returnMatch = videoCheck > parseInt(condition.match);
          break;
        case "lesseq":
          returnMatch = videoCheck <= parseInt(condition.match);
          break;
        case "greatereq":
          returnMatch = videoCheck >= parseInt(condition.match);
          break;
        case "eq":
          returnMatch = videoCheck === parseInt(condition.match);
          break;
      }
    }

    if (!returnMatch) break;
  }

  return returnMatch;
}


function printVideo(singleVideo) {

  helpers.clearLastLine();
  console.log("-------------------------------------------------------------------");
  for (att in singleVideo) {
    if (att === "id")
      console.log("link: https://www.youtube.com/watch?v=" + singleVideo[att]);
    else
      console.log(att + ": " + singleVideo[att]);
  }
  console.log("-------------------------------------------------------------------\n\n");
}


async function collectVideos(settings, config, timeout, initialData) {
  
  global.sendvb(HEADER, "\n");
  let tabData = await getTabData(config, timeout, initialData);
  if (tabData === -1) {
    global.sendvb(HEADER, "No videos found.");
    return [];
  }

  let savedVideos = await scrapeVideos(settings, config, timeout, tabData);
  global.sendvb(HEADER, "Complete");

  if (savedVideos.length === 0)
    global.sendvb(HEADER, "No videos found.");

  return savedVideos;
}


module.exports.scrape = collectVideos;