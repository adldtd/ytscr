const fs = require("fs");
const path = require("path");
const makeRequest = require(path.join(__dirname, "..", "helpers")).makeRequest;
const handleSaveJSON = require(path.join(__dirname, "..", "helpers")).handleSaveJSON;
const clearLastLine = require(path.join(__dirname, "..", "helpers")).clearLastLine;


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


async function scrapeVideos(config, settings) {

  let continuation_id = "";

  let savedVideos = [];
  let hasContinuation = true;

  let currentState =
  {
    counter: 0,
    matchCounter: 0
  }

  while (hasContinuation) {
    hasContinuation = false;

    let pureData;
    let videos;
    if (currentState.counter > 0) {

      let resp = await makeRequest(config, settings.timeout, 1);
      if (resp === -1) return savedVideos;
      pureData = resp.data;
      videos = pureData.onResponseReceivedCommands[0].appendContinuationItemsAction.continuationItems;
      
    } else {

      pureData = await scrapeVideosInitialResponse(config, settings);
      if (pureData === -1) return savedVideos;
      videos = pureData.contents.twoColumnSearchResultsRenderer.primaryContents.sectionListRenderer.contents;
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
      savedVideos.push(singleVideo);
      currentState.counter++;

    } else if ("shelfRenderer" in videos[v]) { //Contains its own list of videos

      let subVideos = videos[v].shelfRenderer.content.verticalListRenderer.items;
      let result = iterateThroughVideos(subVideos, settings, savedVideos, currentState)
      if (result === -1) return -1;

    }

  }

  return 0;
}


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
    if ("detailedMetadataSnippets" in innerVideo) {
      for (run in innerVideo.detailedMetadataSnippets[0].snippetText.runs)
        singleVideo.snippet += innerVideo.detailedMetadataSnippets[0].snippetText.runs[run].text;
    }
  }

  if (!ignore.time)
    singleVideo.time = innerVideo.lengthText.simpleText;

  if (!ignore.views)
    singleVideo.views = innerVideo.viewCountText.simpleText;

  if (!ignore.published) {
    if ("publishedTimeText" in innerVideo)
      singleVideo.published = innerVideo.publishedTimeText.simpleText;
    else
      singleVideo.published = "UNK"; //Strangely, some videos have no upload date
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


async function collectVideosSearch(config, settings) {

  let ogUrl =  config.url;
  let savedVideos = await scrapeVideos(config, settings);
  console.log("Complete");

  if (!settings.save)
    return;

  if (savedVideos.length === 0) {
    console.log("No videos found. No save made.");
    return;
  }
  
  let ind = ogUrl.indexOf("?search_query=");
  let filename = "videos_'" + ogUrl.substring(ind + 14) + "'"; //Name of the search query
  let filepath = handleSaveJSON(filename, savedVideos, settings);
  console.log("Saved as " + filepath);
  
}


module.exports.collectVideosSearch = collectVideosSearch;