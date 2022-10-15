const path = require("path");
const makeRequest = require(path.join(__dirname, "..", "..", "..", "common", "helpers")).makeRequest;
const clearLastLine = require(path.join(__dirname, "..", "..", "..", "common", "helpers")).clearLastLine;
const helpers = require(path.join(__dirname, "..", "..", "..", "common", "helpers"));


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

  let savedRecommended = [];
  let counter = 0;
  let matchCounter = 0;
  let hasContinuation = true;

  while (hasContinuation) {
    hasContinuation = false;

    let recommendations;
    if (counter === 0) { //First request

      let pureData = retrieveFirstRecommended(inner_api_key, videoResponse, config);
      if (pureData === -1) return savedRecommended;
      recommendations = pureData.contents.twoColumnWatchNextResults;
      if (!("secondaryResults" in recommendations)) {
        global.sendvb("Error: Recommendation bar not found.");
        return savedRecommended;
      }
      recommendations = recommendations.secondaryResults.secondaryResults.results;

    } else {
      let pureData = await makeRequest(config, timeout, 1, 2);
      if (pureData === -1) return savedRecommended;

      try {
        recommendations = pureData.data.onResponseReceivedEndpoints[0].appendContinuationItemsAction.continuationItems;
      } catch {
        console.log(pureData.data);
        process.exit(0);
      }
    }

    //Iterate through videos
    for (r in recommendations) {

      if (counter >= settings.lim || matchCounter >= settings.limfilter) {
        if (global.verbose >= 3) clearLastLine();
        global.sendvb(3, "Recommendations scraped: " + counter);
        return savedRecommended;
      }

      let innerVideo = recommendations[r];

      if ("compactVideoRenderer" in innerVideo) {

        innerVideo = innerVideo.compactVideoRenderer;
        let singleRecommended = getRecommendedData(innerVideo, settings.ignore);
        let match = recommendedMatches(singleRecommended, settings.filter);

        if (match) {
          if (settings.printfilter)
            printRecommendation(singleRecommended);
          matchCounter++;
        }

        if (!settings.savefilter || match)
          savedRecommended.push(singleRecommended);

        counter++;
      } else if ("continuationItemRenderer" in innerVideo) {

        innerVideo = innerVideo.continuationItemRenderer;
        continuation_id = innerVideo.continuationEndpoint.continuationCommand.token;
        config.data.continuation = continuation_id;
        hasContinuation = true;

      }

    }

    if (global.verbose >= 3) clearLastLine();
    global.sendvb(3, "Recommendations scraped: " + counter);
    if (counter >= settings.lim || matchCounter >= settings.limfilter)
      return savedRecommended;

  }

  return savedRecommended;

}

//*********************************************************************************
//Retrieves important information from a recommendation
//*********************************************************************************
function getRecommendedData(innerVideo, ignore) {

  let singleRecommended = {};

  if (!ignore.id)
    singleRecommended.id = innerVideo.videoId;

  if (!ignore.title)
    singleRecommended.title = innerVideo.title.simpleText;

  if (!ignore.views) {
    singleRecommended.views = "";
    if ("viewCountText" in innerVideo) {
      if ("runs" in innerVideo.viewCountText) {
        for (run in innerVideo.viewCountText.runs)
          singleRecommended.views += innerVideo.viewCountText.runs[run].text;
      } else
        singleRecommended.views = innerVideo.viewCountText.simpleText;
    }
  }

  if (!ignore.duration) {
    singleRecommended.duration = "";
    if ("lengthText" in innerVideo && "simpleText" in innerVideo.lengthText)
      singleRecommended.duration = innerVideo.lengthText.simpleText;
  }

  if (!ignore.published) {
    singleRecommended.published = "";
    if ("publishedTimeText" in innerVideo)
      singleRecommended.published = innerVideo.publishedTimeText.simpleText;
  }

  if (!ignore.thumbnail) {
    let thumbnails = innerVideo.thumbnail.thumbnails;
    singleRecommended.thumbnail = thumbnails[thumbnails.length - 1].url;
  }

  if (!ignore.uploader) {
    singleRecommended.uploader = "";
    for (run in innerVideo.longBylineText.runs)
      singleRecommended.uploader += innerVideo.longBylineText.runs[run].text;
  }

  if (!ignore.channelId) {
    singleRecommended.channelId = "";
    for (run in innerVideo.longBylineText.runs) {
      if ("navigationEndpoint" in innerVideo.longBylineText.runs[run] && "browseEndpoint" in innerVideo.longBylineText.runs[run].navigationEndpoint) {
        singleRecommended.channelId = innerVideo.longBylineText.runs[run].navigationEndpoint.browseEndpoint.browseId;
        break;
      }
    }
  }

  return singleRecommended;
}

//*********************************************************************************
//Checks if a recommendation matches a filter
//*********************************************************************************
function recommendedMatches(singleRecommended, filter) {
  
  let returnMatch = true;

  for (f in filter) {

    let condition = filter[f];
    if (condition.check !== "duration" && condition.check !== "views") {

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
        recommendedCheck = crunchViewCount(singleRecommended["views"]);
      else
        recommendedCheck = durationToSec(singleRecommended["duration"]);

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
//Condense a view count into a pure number
//*********************************************************************************
function crunchViewCount(views) {
  views = views.split(" ", 1)[0];
  if (isNaN(parseInt(views))) //"No views," should work for different languages
    return 0;

  let num = 0;
  let places = views.split(",");
  let modifier = 1;

  for (let i = places.length - 1; i >= 0; i--) {
    num += parseInt(places[i]) * modifier;
    modifier *= Math.pow(10, places[i].length);
  }

  return num;
}

//*********************************************************************************
//Converts video runtime into seconds
//*********************************************************************************
function durationToSec(duration) {
  
  let time = 0;
  let divisions = duration.split(":");

  for (let i = 0; i < divisions.length; i++)
    divisions[i] = parseInt(divisions[i]);

  if (divisions.length === 3) //hh:mm::ss
    time = (divisions[0] * 3600) + (divisions[1] * 60) + divisions[2];
  else if (divisions.length === 2) //mm:ss
    time = (divisions[0] * 60) + divisions[1];
  
  return time;
}

//*********************************************************************************
//Print the data from a recommended video to the console
//*********************************************************************************
function printRecommendation(singleRecommended) {

  clearLastLine();
  console.log("-------------------------------------------------------------------");
  for (att in singleRecommended) {
    if (att === "id")
      console.log("link: https://www.youtube.com/watch?v=" + singleRecommended[att]);
    else if (att === "channelId")
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
  let savedRecommended = await scrapeRecommended(inner_api_key, continuation_id, videoResponse, config, timeout, settings);
  global.sendvb(2, "Complete");

  if (savedRecommended.length === 0)
    global.sendvb(2, "No recommendations found.");

  return savedRecommended;
}


module.exports.scraper = collectRecommended;