const helpers = require("../../../common/helpers");
const filterHelpers = require("../../../common/filter_helpers");


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
      contents = innerData.contents.twoColumnBrowseResultsRenderer.tabs[0].tabRenderer.content.sectionListRenderer.contents[0].itemSectionRenderer.contents[0].playlistVideoListRenderer.contents;
      initialData = false;
    } else {
      contents = innerData.onResponseReceivedActions;
      for (let action in contents) {
        action = contents[action];
        if ("appendContinuationItemsAction" in action) {
          contents = action.appendContinuationItemsAction;
          break;
        }
      }

      if ("continuationItems" in contents)
        contents = contents.continuationItems;
      else
        return savedVideos;
    }


    for (let item in contents) {
      item = contents[item];

      if ("continuationItemRenderer" in item) {
        config.data.continuation = item.continuationItemRenderer.continuationEndpoint.continuationCommand.token;
        hasContinuation = true;
        continue;
      }

      let innerVideo = null;
      if ("playlistVideoRenderer" in item)
        innerVideo = item.playlistVideoRenderer;
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

    if (global.verbose >= 3) helpers.clearLastLine();
    global.sendvb(3, "Videos scraped: " + counter);

    if (hasContinuation) {
      innerData = await helpers.makeRequest(config, timeout, 1, 1);
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
    singleVideo.views = innerVideo.videoInfo.runs[0].text;

  if (!ignore.duration)
    singleVideo.duration = innerVideo.lengthText.simpleText;

  if (!ignore.published)
    singleVideo.published = innerVideo.videoInfo.runs[2].text;

  if (!ignore.thumbnail) {
    let thumbnails = innerVideo.thumbnail.thumbnails;
    singleVideo.thumbnail = thumbnails[thumbnails.length - 1].url;
  }

  if (!ignore.uploader) {
    singleVideo.uploader = "";
    for (let run in innerVideo.shortBylineText.runs)
      singleVideo.uploader += innerVideo.shortBylineText.runs[run].text;
  }

  if (!ignore.handle) {
    singleVideo.handle = "";
    for (run in innerVideo.shortBylineText.runs) {
      if ("navigationEndpoint" in innerVideo.shortBylineText.runs[run] && "browseEndpoint" in innerVideo.shortBylineText.runs[run].navigationEndpoint) {
        let link = innerVideo.shortBylineText.runs[run].navigationEndpoint.browseEndpoint.canonicalBaseUrl;
        if (link[1] === "@") singleVideo.handle = link;
        break;
      }
    }
  }

  if (!ignore.channelId) {
    singleVideo.channelId = "";
    for (run in innerVideo.shortBylineText.runs) {
      if ("navigationEndpoint" in innerVideo.shortBylineText.runs[run] && "browseEndpoint" in innerVideo.shortBylineText.runs[run].navigationEndpoint) {
        singleVideo.channelId = innerVideo.shortBylineText.runs[run].navigationEndpoint.browseEndpoint.browseId;
        break;
      }
    }
  }

  return singleVideo;
}


function videoMatches(singleVideo, filter) {

  let returnMatch = true;

  for (s in filter) {

    let condition = filter[s];
    if (condition.check !== "views" && condition.check !== "duration") { //Special numerical values

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
    }
    else {
      
      let videoCheck = null;
      if (condition.check === "views")
        videoCheck = filterHelpers.crunchSimpleViews(singleVideo[condition.check]);
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

    if (!returnMatch)
      break;
  }

  return returnMatch;
}


function printVideo(singleVideo) {

  clearLastLine();
  console.log("-------------------------------------------------------------------");
  for (att in singleVideo) {
    if (att === "id")
      console.log("link: https://www.youtube.com/watch?v=" + singleVideo[att]);
    else if (att === "channelId")
      console.log("channel: " + "https://youtube.com/channel/" + singleVideo[att]);
    else
      console.log(att + ": " + singleVideo[att]);
  }
  console.log("-------------------------------------------------------------------\n\n");
}


async function collectVideos(settings, config, timeout, initialData) {
  
  global.sendvb(2, "\n");
  let savedVideos = await scrapeVideos(settings, config, timeout, initialData);
  global.sendvb(2, "Complete");

  if (savedVideos.length === 0)
    global.sendvb(2, "No videos found.");

  return savedVideos;
}


module.exports.scrape = collectVideos;