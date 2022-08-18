const fs = require("fs");
const path = require("path");
const makeRequest = require(path.join(__dirname, "..", "helpers")).makeRequest;
const handleSaveJSON = require(path.join(__dirname, "..", "helpers")).handleSaveJSON;
const clearLastLine = require(path.join(__dirname, "..", "helpers")).clearLastLine;


  /**********************************************/
 /* The scraping function for the video module */
/**********************************************/


//*********************************************************************************
//Retrieve the first set of videos, which are buried in an HTML page; reconfigure
//config to make POST requests
//*********************************************************************************
async function scrapeVideosInitialResponse(config, settings) {

  let resp = await makeRequest(config, settings.timeout, 1);
  if (resp === -1) return -1;

  let location = resp.data.indexOf("var ytInitialData = ");
  if (location === -1) {
    console.log("\nAn unexpected error occurred.");
    return -1;
  }

  let initialData = JSON.parse(resp.data.substring(location + 20).split(";</script><script nonce=", 1)[0]); //Complete

  //Modify config
  let inner_api_key = resp.data.split('"INNERTUBE_API_KEY":"', 2)[1].split('"')[0];
  config.url = "https://www.youtube.com/youtubei/v1/search?key=" + inner_api_key + "&prettyPrint=false";
  config.method = "POST";
  config.data = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "config_data.json")));
  config.data.context.client.originalUrl = config.headers.referer;
  config.data.context.client.mainAppWebInfo.graftUrl = config.headers.referer;

  return initialData;

}


//*********************************************************************************
//Collect videos from a search query
//*********************************************************************************
async function scrapeVideos(config, settings) {

  let continuation_id = "";

  let savedVideos = [];
  let hasContinuation = true;
  let firstCall = true;

  let currentState =
  {
    counter: 0,
    matchCounter: 0
  }

  while (hasContinuation) {
    hasContinuation = false;

    let pureData;
    let videos;
    if (!firstCall) {

      let resp = await makeRequest(config, settings.timeout, 1);
      if (resp === -1) return savedVideos;
      pureData = resp.data;
      videos = pureData.onResponseReceivedCommands[0].appendContinuationItemsAction.continuationItems;
      
    } else {

      pureData = await scrapeVideosInitialResponse(config, settings);
      if (pureData === -1) return savedVideos;
      videos = pureData.contents.twoColumnSearchResultsRenderer.primaryContents.sectionListRenderer.contents;
      firstCall = false;
    }

    //Locate videos and the next continuation id
    let ind = -1;
    for (let i = 0; i < videos.length; i++) {

      if ("itemSectionRenderer" in videos[i])
        ind = i;
      else if ("continuationItemRenderer" in videos[i]) {
        continuation_id = videos[i].continuationItemRenderer.continuationEndpoint.continuationCommand.token;
        config.data.continuation = continuation_id;
        hasContinuation = true; //Unlike the other modules, the continuation_id is set before looping through the contents
      }

    }
    if (ind === -1) {
      console.log("\nAn unexpected error occurred.");
      return savedVideos;
    }

    videos = videos[ind].itemSectionRenderer.contents;
    let result = iterateThroughVideos(videos, settings, savedVideos, currentState);
    if (result === -1) return savedVideos; //Either reached a limit or a problem

    clearLastLine();
    console.log("Videos scraped: " + currentState.counter);

  }

  return savedVideos;
}


//*********************************************************************************
//Loop that adds video data to savedVideos
//*********************************************************************************
function iterateThroughVideos(videos, settings, savedVideos, currentState) {

  for (let v = 0; v < videos.length + 1; v++) {

    if (currentState.counter >= settings.lim || currentState.matchCounter >= settings.limfilter) {
      clearLastLine();
      console.log("Videos scraped: " + currentState.counter);
      return -1;
    } else if (v === videos.length)
      break;

    //Collect data
    if ("videoRenderer" in videos[v]) {

      let innerVideo = videos[v].videoRenderer;
      let singleVideo = getVideoData(innerVideo, settings.ignore);

      //Manage matches/saving
      let match = videoMatches(singleVideo, settings.filter);
      if (match || !settings.savefilter) {

        if (match && settings.printfilter)
          printVideo(singleVideo);

        savedVideos.push(singleVideo);
        currentState.matchCounter++;
      }

      currentState.counter++;

    } else if ("shelfRenderer" in videos[v]) { //Contains its own list of videos; recursion is needed

      let subVideos = videos[v].shelfRenderer.content.verticalListRenderer.items;
      let result = iterateThroughVideos(subVideos, settings, savedVideos, currentState)
      if (result === -1) return -1;

    }

  }

  return 0;
}


//*********************************************************************************
//Condense video data to useful, human readable information
//*********************************************************************************
function getVideoData(innerVideo, ignore) {

  let singleVideo = {};

  if (!ignore.author) {
    singleVideo.author = "";
    for (run in innerVideo.ownerText.runs)
      singleVideo.author += innerVideo.ownerText.runs[run].text;
  }

  if (!ignore.name) {
    singleVideo.name = "";
    for (run in innerVideo.title.runs)
      singleVideo.name += innerVideo.title.runs[run].text;
  }

  if (!ignore.snippet) {
    singleVideo.snippet = "";
    if ("detailedMetadataSnippets" in innerVideo) { //Not all videos have a description
      for (run in innerVideo.detailedMetadataSnippets[0].snippetText.runs)
        singleVideo.snippet += innerVideo.detailedMetadataSnippets[0].snippetText.runs[run].text;
    }
  }

  if (!ignore.duration)
    singleVideo.duration = innerVideo.lengthText.simpleText;

  if (!ignore.views)
    singleVideo.views = crunchViewCount(innerVideo.viewCountText.simpleText);

  if (!ignore.published) {
    if ("publishedTimeText" in innerVideo)
      singleVideo.published = innerVideo.publishedTimeText.simpleText;
    else
      singleVideo.published = "UNK"; //Some videos have no upload date listed
  }

  if (!ignore.thumbnail) {
    let thumbnails = innerVideo.thumbnail.thumbnails;
    singleVideo.thumbnail = thumbnails[thumbnails.length - 1].url;
  }

  if (!ignore.id)
    singleVideo.id = innerVideo.videoId;

  if (!ignore.picture) {
    let pictures = innerVideo.channelThumbnailSupportedRenderers.channelThumbnailWithLinkRenderer.thumbnail.thumbnails;
    singleVideo.picture = pictures[pictures.length - 1].url;
  }

  if (!ignore.channel)
    singleVideo.channel = innerVideo.shortBylineText.runs[0].navigationEndpoint.browseEndpoint.browseId;

  return singleVideo;

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
//Check whether a video matches a given filter
//*********************************************************************************
function videoMatches(singleVideo, filter) {

  let returnMatch = true;

  for (f in filter) {

    let condition = filter[f];
    if (condition.check !== "duration" && condition.check !== "views") {

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
      
      let videoCheck;
      if (condition.check === "duration")
        videoCheck = crunchDuration(singleVideo.duration);
      else
        videoCheck = singleVideo[condition.check]; //Views should already be converted into a number

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


//*********************************************************************************
//Converts a time to an amount of seconds
//*********************************************************************************
function crunchDuration(duration) {
  let times = duration.split(":");
  if (times.length === 3)
    return (parseInt(times[0]) * 3600) + (parseInt(times[1]) * 60) + parseInt(times[2]);
  else
    return (parseInt(times[0]) * 60) + parseInt(times[1]);
}


//*********************************************************************************
//Prints video data to the screen
//*********************************************************************************
function printVideo(singleVideo) {

  clearLastLine();
  console.log("-------------------------------------------------------------------");
  for (att in singleVideo) {
    if (att === "channel")
      console.log("channel: " + "https://youtube.com/channel/" + singleVideo[att]);
    else if (att === "id")
      console.log("id: https://youtube.com/watch?v=" + singleVideo[att]);
    else
      console.log(att + ": " + singleVideo[att]);
  }
  console.log("-------------------------------------------------------------------\n\n");
}


//*********************************************************************************
//Main scraper function; called by the CLI
//*********************************************************************************
async function collectVideos(settings) {
  
  //Setup needed configurations
  let config = { //Needs to be configured as a GET request at the start; later changed to be POST
    url: "__________",
    authority: "www.youtube.com",
    method: "GET",
    headers:
    {
      "user-agent": 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.0.0 Safari/537.36',
    },
    validateStatus: () => true
  };

  settings.url = "https://www.youtube.com/results?search_query=" + settings.search;

  config.headers.referer = settings.url;
  config.url = settings.url;

  //Data collection
  console.log("\n");
  let savedVideos = await scrapeVideos(config, settings);
  console.log("Complete");

  if (!settings.save)
    return;

  if (savedVideos.length === 0) {
    console.log("No videos found. No save made.");
    return;
  }
  
  let filename = "videos_'" + settings.search + "'"; //Name of the search query
  let filepath = handleSaveJSON(filename, savedVideos, settings);
  console.log("Saved as " + filepath);
}


module.exports.scrape = collectVideos;