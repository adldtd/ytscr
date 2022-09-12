const path = require("path");
const makeRequest = require(path.join(__dirname, "..", "..", "..", "common", "helpers")).makeRequest;
const clearLastLine = require(path.join(__dirname, "..", "..", "..", "common", "helpers")).clearLastLine;
const helpers = require(path.join(__dirname, "..", "..", "..", "common", "helpers"));


function scrapeMetadata(config, settings, resp) {

  let savedMeta = {
    id: config.headers.referer.split("v=", 2)[1],
    type: "",
    title: "",
    description: "",
    tags: [],
    views: "",
    likes: "",
    published: "",
    comments: "",
    uploader: "",
    subscribers: "",
    channelId: "",
    pfp: ""
  };

  let innerData = helpers.safeSplit(resp.data, "var ytInitialData = ", 1);
  if (innerData.length < 2) {
    console.log("\nAn unexpected error occurred.\nNo metadata found.");
    return -1;
  }
  innerData = JSON.parse(helpers.safeSplit(innerData[1], ";</script><script nonce", 1)[0]);
  for (c in innerData.contents.twoColumnWatchNextResults.results.results.contents) {

    let videoData = innerData.contents.twoColumnWatchNextResults.results.results.contents[c]

    //Primary section: title, views, likes, published, tags, type
    if ("videoPrimaryInfoRenderer" in videoData) {
      
      let primaryData = videoData.videoPrimaryInfoRenderer;
      
      if (!settings.ignore["title"]) {
        for (run in primaryData.title.runs)
          savedMeta.title += primaryData.title.runs[run].text;
      }

      if (!settings.ignore["views"])
        savedMeta.views = primaryData.viewCount.videoViewCountRenderer.viewCount.simpleText;

      if (!settings.ignore["published"])
        savedMeta.published = primaryData.dateText.simpleText;

      if (!settings.ignore["type"]) {
        let published = primaryData.dateText.simpleText;
        if (published.includes("Streamed live"))
          savedMeta.type = "livestream (complete)";
        else if (published.includes("Started streaming"))
          savedMeta.type = "livestream (ongoing)";
        else if (published.includes("Premiered"))
          savedMeta.type = "premiere (complete)";
        else if (published.includes("Premieres"))
          savedMeta.type = "premiere (upcoming)";
        else if (published.includes("watching now"))
          savedMeta.type = "premiere (ongoing)";
        else
          savedMeta.type = "video";
      }

      if (!settings.ignore["tags"]) {
        if ("superTitleLink" in primaryData) {

          let tagData = primaryData.superTitleLink.runs;
          for (run in tagData) {
            if (tagData[run].text !== " ")
              savedMeta.tags.push(tagData[run].text);
          }
        }
      }

      if (!settings.ignore["likes"]) {

        let buttonData = primaryData.videoActions.menuRenderer.topLevelButtons;
        for (button in buttonData) {

          if ("toggleButtonRenderer" in buttonData[button] && buttonData[button].toggleButtonRenderer.defaultIcon.iconType === "LIKE") {
            if (!buttonData[button].toggleButtonRenderer.isDisabled)
              savedMeta.likes = buttonData[button].toggleButtonRenderer.defaultText.accessibility.accessibilityData.label;
            else
              savedMeta.likes = "Likes have been disabled for this video.";
            break;
          }
        }
      }

    //Secondary section: uploader, pfp, subscribers, channelId, description
    } else if ("videoSecondaryInfoRenderer" in videoData) {

      let secondaryData = videoData.videoSecondaryInfoRenderer;

      if (!settings.ignore["description"]) {
        for (run in secondaryData.description.runs)
          savedMeta.description += secondaryData.description.runs[run].text;
      }

      if ("owner" in secondaryData) {
        let ownerData = secondaryData.owner.videoOwnerRenderer;

        if (!settings.ignore["uploader"]) {
          let runs = ownerData.title.runs;
          for (run in runs)
            savedMeta.uploader += runs[run].text;
        }
    
        if (!settings.ignore["channelId"])
          savedMeta.channelId = ownerData.navigationEndpoint.browseEndpoint.browseId;
    
        if (!settings.ignore["pfp"]) {
          let pfps = ownerData.thumbnail.thumbnails;
          savedMeta.pfp = pfps[pfps.length - 1].url;
        }

        if (!settings.ignore["subscribers"])
          savedMeta.subscribers = ownerData.subscriberCountText.simpleText;
      }

    //Number of comments
    } else if ("itemSectionRenderer" in videoData && !settings.ignore["comments"]) {

      let contents = videoData.itemSectionRenderer.contents;
      for (c in contents) {
        if ("commentsEntryPointHeaderRenderer" in contents[c])
          savedMeta.comments = contents[c].commentsEntryPointHeaderRenderer.commentCount.simpleText;
      }
    }

  }

  for (key in savedMeta) {
    if (settings.ignore[key])
      delete savedMeta[key];
  }

  return savedMeta;
}

async function collectMeta(settings, config, timeout, videoResponse) {

  console.log("");
  let savedMeta = scrapeMetadata(config, settings, videoResponse);
  console.log("Complete");
  return savedMeta;
}


module.exports.scraper = collectMeta;