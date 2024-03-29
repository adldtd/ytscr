const path = require("path");
const makeRequest = require(path.join(__dirname, "..", "..", "..", "..", "common", "helpers")).makeRequest;
const clearLastLine = require(path.join(__dirname, "..", "..", "..", "..", "common", "helpers")).clearLastLine;
const helpers = require(path.join(__dirname, "..", "..", "..", "..", "common", "helpers"));
const filterHelpers = require("../../../../common/filter_helpers");


//*********************************************************************************
//Retrieves the first batch of recommendations from the video response; formats
//config for further requests
//*********************************************************************************
function retrieveFirstRecommended(inner_api_key, videoResponse, config) {

  let pureData = helpers.safeSplit(videoResponse.data, "var ytInitialData = ", 1);
  if (pureData.length < 2) {
    global.sendvb(2, "\nAn unexpected error occurred.");
    return -1;
  }
  pureData = JSON.parse(helpers.safeSplit(pureData[1], ";</script><script nonce", 1)[0]);

  config.url = "https://www.youtube.com/youtubei/v1/next?key=" + inner_api_key + "&prettyPrint=false";
  config.method = "POST";

  return pureData;
}

//*********************************************************************************
//Main scraping function; loops while there are still recommendations and/or
//counter has not reached its max
//*********************************************************************************
async function scrapeRecommended(inner_api_key, continuation_id, videoResponse, config, timeout, settings) {

  let initialData = true;
  let savedRecommended = null;
	if (settings.seperate) {
		savedRecommended = {};
		for (module in settings.focus) {
			if (settings.focus[module])
				savedRecommended[module] = [];
		}
	} else
		savedRecommended = [];
  
  let counter = 0;
  let added = 0;
  let typeCounter = {};
  let typeMatchCounter = {};

  let totalCounter = 0;
  let typeCap = Number.POSITIVE_INFINITY;
  let totalMatchCounter = 0;
  let typeMatchCap = Number.POSITIVE_INFINITY;

  for (module in settings.focus) {
    typeCounter[module] = 0;
    typeMatchCounter[module] = 0;

    if (settings[module].lim !== Number.POSITIVE_INFINITY) {
      if (typeCap === Number.POSITIVE_INFINITY)
        typeCap = 0;
      ++typeCap;
    }

    if (settings[module].limfilter !== Number.POSITIVE_INFINITY) {
      if (typeMatchCap === Number.POSITIVE_INFINITY)
        typeMatchCap = 0;
      ++typeMatchCap;
    }
  }

  let finished = false;

  
  let hasContinuation = true;
  while (hasContinuation) {
    hasContinuation = false;

    let recommendations;
    if (initialData) { //First request
      initialData = false;

      let pureData = retrieveFirstRecommended(inner_api_key, videoResponse, config);
      if (pureData === -1) return {savedRecommended: savedRecommended, length: added};
      recommendations = pureData.contents.twoColumnWatchNextResults;
      if (!("secondaryResults" in recommendations)) {
        global.sendvb("Error: Recommendation bar not found.");
        return {savedRecommended: savedRecommended, length: added};
      }
      recommendations = recommendations.secondaryResults.secondaryResults.results;

    } else {
      let pureData = await makeRequest(config, timeout, 1, 2);
      if (pureData === -1) return {savedRecommended: savedRecommended, length: added};

      //try {
      recommendations = pureData.data.onResponseReceivedEndpoints[0].appendContinuationItemsAction.continuationItems;
      //} catch {
      //  console.log(pureData.data);
      //  process.exit(0);
      //}
    }

    //Iterate through videos
    for (r in recommendations) {

      let innerResult = recommendations[r];
      let type = null;

      if ("compactVideoRenderer" in innerResult) {
        type = "videos";
        innerResult = innerResult.compactVideoRenderer;

      } else if ("compactPlaylistRenderer" in innerResult) {
        type = "playlists";
        innerResult = innerResult.compactPlaylistRenderer;

      } else if ("compactRadioRenderer" in innerResult) {
        type = "mixes";
        innerResult = innerResult.compactRadioRenderer;

      } else if ("continuationItemRenderer" in innerResult) {
        innerResult = innerResult.continuationItemRenderer;
        continuation_id = innerResult.continuationEndpoint.continuationCommand.token;
        config.data.continuation = continuation_id;
        hasContinuation = true;
        continue;
      } else
        continue;

      if (!settings.focus[type] || typeCounter[type] >= settings[type].lim || typeMatchCounter >= settings[type].limfilter) continue;
      let singleRecommended = getRecommendedData(innerResult, settings, type);
      let match = recommendedMatches(singleRecommended, settings[type].filter);

      if (match) {
        if (settings[type].printfilter)
          printRecommendation(singleRecommended, type);
        //++matchCounter;
        ++typeMatchCounter[type];
      }

      if (!settings[type].savefilter || match) {
        ++added;
        if (!settings.seperate)
          savedRecommended.push(singleRecommended);
        else
          savedRecommended[type].push(singleRecommended);
      }

      if (typeMatchCounter[type] >= settings[type].limfilter)
        ++totalMatchCounter;

      ++counter;
      ++typeCounter[type];

      if (typeCounter[type] >= settings[type].lim)
        ++totalCounter;

      //If we can stop scraping
      if (counter >= settings.lim || totalCounter >= typeCap || totalMatchCounter >= typeMatchCap) {
        finished = true;
        break;
      }

    }

    if (global.verbose >= 3) clearLastLine();
    global.sendvb(3, "Recommendations scraped: " + counter);
    if (finished) break;

  }

  return {savedRecommended: savedRecommended, length: added};

}


//*********************************************************************************
//Retrieves important information from a recommendation
//*********************************************************************************
function getRecommendedData(innerResult, settings, type) {
  if (type === "videos")
    return getVideoData(innerResult, settings)
  else if (type === "playlists")
    return getPlaylistData(innerResult, settings);
  else
    return getMixData(innerResult, settings);
}

function getVideoData(innerVideo, settings) {

  let singleVideo = {};
  let ignore = settings.videos.ignore;

  if (!settings.seperate)
    singleVideo.type = "videos";

  if (!ignore.id)
    singleVideo.id = innerVideo.videoId;

  if (!ignore.title)
    singleVideo.title = innerVideo.title.simpleText;

  if (!ignore.views) {
    singleVideo.views = "";
    if ("viewCountText" in innerVideo) {
      if ("runs" in innerVideo.viewCountText) {
        for (run in innerVideo.viewCountText.runs)
          singleVideo.views += innerVideo.viewCountText.runs[run].text;
      } else
        singleVideo.views = innerVideo.viewCountText.simpleText;
    }
  }

  if (!ignore.duration) {
    singleVideo.duration = "";
    if ("lengthText" in innerVideo && "simpleText" in innerVideo.lengthText)
      singleVideo.duration = innerVideo.lengthText.simpleText;
  }

  if (!ignore.published) {
    singleVideo.published = "";
    if ("publishedTimeText" in innerVideo)
      singleVideo.published = innerVideo.publishedTimeText.simpleText;
  }

  if (!ignore.thumbnail) {
    let thumbnails = innerVideo.thumbnail.thumbnails;
    singleVideo.thumbnail = thumbnails[thumbnails.length - 1].url;
  }

  if (!ignore.uploader) {
    singleVideo.uploader = "";
    for (run in innerVideo.longBylineText.runs)
      singleVideo.uploader += innerVideo.longBylineText.runs[run].text;
  }

  if (!ignore.handle) {
    singleVideo.handle = "";
    for (run in innerVideo.longBylineText.runs) {
      if ("navigationEndpoint" in innerVideo.longBylineText.runs[run] && "browseEndpoint" in innerVideo.longBylineText.runs[run].navigationEndpoint) {
        let link = innerVideo.longBylineText.runs[run].navigationEndpoint.browseEndpoint.canonicalBaseUrl;
        if (link[1] === "@") singleVideo.handle = link;
        break;
      }
    }
  }

  if (!ignore.channelId) {
    singleVideo.channelId = "";
    for (run in innerVideo.longBylineText.runs) {
      if ("navigationEndpoint" in innerVideo.longBylineText.runs[run] && "browseEndpoint" in innerVideo.longBylineText.runs[run].navigationEndpoint) {
        singleVideo.channelId = innerVideo.longBylineText.runs[run].navigationEndpoint.browseEndpoint.browseId;
        break;
      }
    }
  }

  return singleVideo;
}

function getPlaylistData(innerPlaylist, settings) {

  let singlePlaylist = {};
  let ignore = settings.playlists.ignore;

  if (!settings.seperate)
    singlePlaylist.type = "playlists";

  if (!ignore.id)
    singlePlaylist.id = innerPlaylist.playlistId;

  if (!ignore.title)
    singlePlaylist.title = innerPlaylist.title.simpleText;

  if (!ignore.size) //!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! FIND OUT IF THIS SOLUTION IS SAFE
    singlePlaylist.size = innerPlaylist.videoCountText.runs[0].text;

  if (!ignore.thumbnail) {
    let thumbnails = innerPlaylist.thumbnail.thumbnails;
    singlePlaylist.thumbnail = thumbnails[thumbnails.length - 1].url;
  }

  if (!ignore.uploader) {
    singlePlaylist.uploader = "";
    for (let run in innerPlaylist.longBylineText.runs)
      singlePlaylist.uploader += innerPlaylist.longBylineText.runs[run].text;
  }

  if (!ignore.handle) {
    singlePlaylist.handle = "";
    for (run in innerPlaylist.longBylineText.runs) {
      if ("navigationEndpoint" in innerPlaylist.longBylineText.runs[run] && "browseEndpoint" in innerPlaylist.longBylineText.runs[run].navigationEndpoint) {
        let link = innerPlaylist.longBylineText.runs[run].navigationEndpoint.browseEndpoint.canonicalBaseUrl;
        if (link[1] === "@") singlePlaylist.handle = link;
        break;
      }
    }
  }

  if (!ignore.channelId) {
    singlePlaylist.channelId = "";
    for (run in innerPlaylist.longBylineText.runs) {
      if ("navigationEndpoint" in innerPlaylist.longBylineText.runs[run] && "browseEndpoint" in innerPlaylist.longBylineText.runs[run].navigationEndpoint) {
        singlePlaylist.channelId = innerPlaylist.longBylineText.runs[run].navigationEndpoint.browseEndpoint.browseId;
        break;
      }
    }
  }

  if (!ignore.firstVideoId)
    singlePlaylist.firstVideoId = innerPlaylist.navigationEndpoint.watchEndpoint.videoId;

  return singlePlaylist;
}

function getMixData(innerMix, settings) {

  let singleMix = {};
  let ignore = settings.mixes.ignore;

  if (!settings.seperate)
    singleMix.type = "mixes";

  if (!ignore.id)
    singleMix.id = innerMix.playlistId;

  if (!ignore.title)
    singleMix.title = innerMix.title.simpleText;

  if (!ignore.thumbnail) {
    let thumbnails = innerMix.thumbnail.thumbnails;
    singleMix.thumbnail = thumbnails[thumbnails.length - 1].url;
  }

  if (!ignore.uploaders)
    singleMix.uploaders = innerMix.longBylineText.simpleText;

  if (!ignore.firstVideoId)
    singleMix.firstVideoId = innerMix.navigationEndpoint.watchEndpoint.videoId;

  return singleMix;
}


//*********************************************************************************
//Checks if a recommendation matches a filter
//*********************************************************************************
function recommendedMatches(singleRecommended, filter) {
  
  let returnMatch = true;

  for (f in filter) {

    let condition = filter[f];
    if (condition.check !== "duration" && condition.check !== "views" && condition.check !== "size") {

      let recommendedCheck = singleRecommended[condition.check];
      let conditionMatch = condition.match;
      if ("casesensitive" in condition ? !condition.casesensitive : true) {
        recommendedCheck = recommendedCheck.toLowerCase();
        conditionMatch = conditionMatch.toLowerCase();
      }

      if (condition.compare === "eq") //Exact match needed
        returnMatch = recommendedCheck === conditionMatch;
      else if (condition.compare === "in")
        returnMatch = recommendedCheck.includes(conditionMatch);
    }
    else {
      
      let recommendedCheck;
      if (condition.check === "views")
        recommendedCheck = filterHelpers.crunchViewCount(singleRecommended["views"]);
      else if (condition.check === "duration")
        recommendedCheck = filterHelpers.durationToSec(singleRecommended["duration"]);
      else
        recommendedCheck = filterHelpers.commaSeperatedToNumerical(singleRecommended["size"]);

      switch (condition.compare) {
        case "less":
          returnMatch = recommendedCheck < parseInt(condition.match);
          break;
        case "greater":
          returnMatch = recommendedCheck > parseInt(condition.match);
          break;
        case "lesseq":
          returnMatch = recommendedCheck <= parseInt(condition.match);
          break;
        case "greatereq":
          returnMatch = recommendedCheck >= parseInt(condition.match);
          break;
        case "eq":
          returnMatch = recommendedCheck === parseInt(condition.match);
          break;
      }
    }

    if (!returnMatch)
      break;
  }

  return returnMatch;
}


//*********************************************************************************
//Print the data from a recommended video to the console
//*********************************************************************************
function printRecommendation(singleRecommended, type) {

  clearLastLine();
  console.log("-------------------------------------------------------------------");
  for (att in singleRecommended) {
    if (att === "id") {
      if (type === "videos")
        console.log("link: https://www.youtube.com/watch?v=" + singleRecommended[att]);
      else
        console.log("link: https://www.youtube.com/playlist?list=" + singleRecommended[att]);
    } else if (att === "channelId")
      console.log("channel: " + "https://youtube.com/channel/" + singleRecommended[att]);
    else
      console.log(att + ": " + singleRecommended[att]);
  }
  console.log("-------------------------------------------------------------------\n\n");
}


//*********************************************************************************
//The main scraping function
//*********************************************************************************
async function collectRecommended(settings, config, timeout, videoResponse) {
  
  //Activate scraping
  let inner_api_key = helpers.safeSplit(videoResponse.data, '"INNERTUBE_API_KEY":"', 1)[1];
  inner_api_key = helpers.safeSplit(inner_api_key, '"', 1)[0];

  let continuation_id = ""; //Initialized in the scraping function

  global.sendvb(2, "\n");
  let saved = await scrapeRecommended(inner_api_key, continuation_id, videoResponse, config, timeout, settings);
  global.sendvb(2, "Complete");

  let savedRecommended = saved.savedRecommended;
  let length = saved.length;

  if (length === 0)
    global.sendvb(2, "No recommendations found.");

  return savedRecommended;
}


module.exports.scraper = collectRecommended;