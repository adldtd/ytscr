const path = require("path");
const helpers = require(path.join(__dirname, "..", "..", "..", "common", "helpers"));


//*********************************************************************************
//Main scraping function; extracts data from a video response and HTML data
//*********************************************************************************
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
    durationMs: "",
    comments: "",
    uploader: "",
    subscribers: "",
    handle: "",
    channelId: "",
    pfp: ""
  };

  if (!settings.ignore["durationMs"]) {
    let durationData = helpers.safeSplit(resp.data, '"approxDurationMs":"', 1);
    if (durationData.length >= 2) {
      durationData = helpers.safeSplit(durationData[1], '"', 1)[0];
      savedMeta.durationMs = durationData;
    }
  }

  let innerData = helpers.safeSplit(resp.data, "var ytInitialData = ", 1);
  if (innerData.length < 2) {
    global.sendvb(2, "\nAn unexpected error occurred.\nNo metadata found.");
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

      if (!settings.ignore["views"]) {
        let viewData = primaryData.viewCount.videoViewCountRenderer.viewCount;
        if ("simpleText" in viewData)
          savedMeta.views = viewData.simpleText;
        else if ("runs" in viewData) {
          for (run in viewData.runs)
            savedMeta.views += viewData.runs[run].text;
        }
      }

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

          if ("segmentedLikeDislikeButtonRenderer" in buttonData[button]) {

            likeData = buttonData[button].segmentedLikeDislikeButtonRenderer.likeButton;
            if ("toggleButtonRenderer" in likeData && likeData.toggleButtonRenderer.defaultIcon.iconType === "LIKE") {

              //If the button is not disabled, and there is an actual like count available
              if (!likeData.toggleButtonRenderer.isDisabled && ("accessibility" in likeData.toggleButtonRenderer.defaultText))
                savedMeta.likes = likeData.toggleButtonRenderer.defaultText.accessibility.accessibilityData.label;
              else
                savedMeta.likes = "";
              break;
            }
          }
        }
      }

    //Secondary section: uploader, pfp, subscribers, channelId, description
    } else if ("videoSecondaryInfoRenderer" in videoData) {

      let secondaryData = videoData.videoSecondaryInfoRenderer;

      if (!settings.ignore["description"] && "description" in secondaryData) {
        for (run in secondaryData.description.runs) {
          
          //Manage links; often they are cut off in the returned description, and we don't want that
          let text = secondaryData.description.runs[run].text;
          if ("navigationEndpoint" in secondaryData.description.runs[run]) {
            if ("urlEndpoint" in secondaryData.description.runs[run].navigationEndpoint) {

              let link = secondaryData.description.runs[run].navigationEndpoint.urlEndpoint.url;
              if (link.includes("https://www.youtube.com/redirect?event=video_description&redir_token="))
                link = helpers.safeSplit(link.split("&q=", 2)[1], "&v=", 1, true)[0];
              text = helpers.unencodeURL(link);

            //Manages special YouTube pages (channels, videos)
            } else if ("commandMetadata" in secondaryData.description.runs[run].navigationEndpoint) {

              text = secondaryData.description.runs[run].navigationEndpoint.commandMetadata.webCommandMetadata.url;
              if (text.charAt(0) === "/") //Redirect to a YouTube page
                text = "https://www.youtube.com" + text;
            }
          }

          savedMeta.description += text;
        }
      }

      if ("owner" in secondaryData) {
        let ownerData = secondaryData.owner.videoOwnerRenderer;

        if (!settings.ignore["uploader"]) {
          let runs = ownerData.title.runs;
          for (run in runs)
            savedMeta.uploader += runs[run].text;
        }

        if (!settings.ignore["handle"]) {
          let link = ownerData.navigationEndpoint.browseEndpoint.canonicalBaseUrl;
          if (link[1] === "@")
            savedMeta.handle = ownerData.navigationEndpoint.browseEndpoint.canonicalBaseUrl;
          else
            savedMeta.handle = "";
        }
    
        if (!settings.ignore["channelId"])
          savedMeta.channelId = ownerData.navigationEndpoint.browseEndpoint.browseId;
    
        if (!settings.ignore["pfp"]) {
          let pfps = ownerData.thumbnail.thumbnails;
          savedMeta.pfp = pfps[pfps.length - 1].url;
        }

        if (!settings.ignore["subscribers"]) {
          if ("subscriberCountText" in ownerData)
            savedMeta.subscribers = ownerData.subscriberCountText.simpleText;
          else
            savedMeta.subscribers = "0 subscribers";
        }
      }

    //Number of comments
    } else if ("itemSectionRenderer" in videoData && !settings.ignore["comments"]) {

      let contents = videoData.itemSectionRenderer.contents;
      for (c in contents) {
        if ("commentsEntryPointHeaderRenderer" in contents[c]) {
          if ("commentCount" in contents[c].commentsEntryPointHeaderRenderer)
            savedMeta.comments = contents[c].commentsEntryPointHeaderRenderer.commentCount.simpleText;
          else
            savedMeta.comments = "0";
        }
      }
    }

  }

  for (key in savedMeta) {
    if (settings.ignore[key])
      delete savedMeta[key];
  }

  return savedMeta;
}


//*********************************************************************************
//Scraping entry function; takes in the initial HTML response in textResponse to
//process certain information
//*********************************************************************************
async function collectMeta(settings, config, timeout, videoResponse, textResponse = "") {

  global.sendvb(2, "");
  let savedMeta = scrapeMetadata(config, settings, videoResponse);
  global.sendvb(2, "Complete");
  return savedMeta;
}


module.exports.scraper = collectMeta;