const helpers = require("../../../common/helpers");
const filterHelpers = require("../../../common/filter_helpers");
const {getTabData} = require("../channel_helpers");
const {INFO, HEADER, PROG} = require("../../../common/verbosity_vars");


async function scrapeCommunity(settings, config, timeout, innerData) {

  let savedCommunity = [];
  let counter = 0;
  let matchCounter = 0;

  let tabs = innerData.contents.twoColumnBrowseResultsRenderer.tabs;
  innerData = null;
  for (let tab in tabs) {
    tab = tabs[tab].tabRenderer;
    if (tab.selected) {
      innerData = tab.content.sectionListRenderer.contents;
      innerData = innerData[0].itemSectionRenderer.contents;
      break;
    }
  }
  if (innerData === null) return savedCommunity;

  let hasContinuation = true;
  while (hasContinuation) {
    hasContinuation = false;
    let contents = innerData;

    for (let item in contents) {
      item = contents[item];

      if ("continuationItemRenderer" in item) {
        config.data.continuation = item.continuationItemRenderer.continuationEndpoint.continuationCommand.token;
        hasContinuation = true;
        continue;
      }

      let innerCommunity = null;
      if ("backstagePostThreadRenderer" in item && "backstagePostRenderer" in item.backstagePostThreadRenderer.post)
        innerCommunity = item.backstagePostThreadRenderer.post.backstagePostRenderer;
      else
        continue;

      let singleCommunity = retrieveCommunity(innerCommunity, settings);
      let match = communityMatches(singleCommunity, settings.filter);
      if (match) ++matchCounter;

      if (!settings.savefilter || match)
        savedCommunity.push(singleCommunity);
      if (settings.printfilter && match)
        printCommunity(singleCommunity);

      ++counter;

      if (counter >= settings.lim || matchCounter >= settings.limfilter) {
        hasContinuation = false;
        break;
      }
    }

    if (global.verbose >= PROG) helpers.clearLastLine();
    global.sendvb(PROG, "Posts scraped: " + counter);

    if (hasContinuation) {
      innerData = await helpers.makeRequest(config, timeout, 1, INFO);
      if (innerData === -1) break;
      innerData = innerData.data;

      contents = null;
      let actions = innerData.onResponseReceivedEndpoints;
      for (let action in actions) {
        action = actions[action];
        if ("appendContinuationItemsAction" in action) {
          contents = action.appendContinuationItemsAction.continuationItems;
          break;
        }
      }
      if (contents === null) return savedCommunity;
      innerData = contents;
    }
  }

  return savedCommunity;

}


function retrieveCommunity(innerCommunity, settings) {
  let singleCommunity = {};
  let ignore = settings.ignore;

  if (!ignore.id)
    singleCommunity.id = innerCommunity.postId;

  if (!ignore.text) {
    singleCommunity.text = "";
    for (let run in innerCommunity.contentText.runs)
      singleCommunity.text += innerCommunity.contentText.runs[run].text;
  }

  if (!ignore.likes)
    singleCommunity.likes = innerCommunity.voteCount.simpleText;

  if (!ignore.comments) {
    singleCommunity.comments = "0";
    let replyAction = innerCommunity.actionButtons.commentActionButtonsRenderer.replyButton.buttonRenderer;
    if ("text" in replyAction)
      singleCommunity.comments = replyAction.text.simpleText;
  }

  if (!ignore.posted) {
    singleCommunity.posted = "";
    for (let run in innerCommunity.publishedTimeText.runs)
      singleCommunity.posted += innerCommunity.publishedTimeText.runs[run].text;
  }

  if (!ignore.attachmentType) singleCommunity.attachmentType = "";
  if (!settings.noattach) singleCommunity.attachment = {};
  if ("backstageAttachment" in innerCommunity) {
    let innerAttachment = innerCommunity.backstageAttachment;

    if ("videoRenderer" in innerAttachment) {
      if (!settings.noattach) singleCommunity.attachment = retrieveVideo(innerAttachment.videoRenderer, settings);
      if (!ignore.attachmentType) singleCommunity.attachmentType = "video";
    } else if ("pollRenderer" in innerAttachment) {
      if (!settings.noattach) singleCommunity.attachment = retrievePoll(innerAttachment.pollRenderer, settings);
      if (!ignore.attachmentType) singleCommunity.attachmentType = "poll";
    } else if ("backstageImageRenderer" in innerAttachment) {
      if (!settings.noattach) singleCommunity.attachment = retrieveImage(innerAttachment.backstageImageRenderer, settings);
      if (!ignore.attachmentType) singleCommunity.attachmentType = "image";
    }
  }

  return singleCommunity;
}

function retrieveVideo(innerVideo, settings) {
  if (!settings.focus.video) return {};
  let singleVideo = {};
  let ignore = settings.video.ignore;

  if (!ignore.id) {
    if ("videoId" in innerVideo)
      singleVideo.id = innerVideo.videoId;
    else
      singleVideo.id = "";
  }

  if (!ignore.title) { //Is present, even if video is unavailable
    singleVideo.title = "";
    if ("simpleText" in innerVideo.title)
      singleVideo.title = innerVideo.title.simpleText;
    else {
      for (let run in innerVideo.title.runs)
        singleVideo.title += innerVideo.title.runs[run].text;
    }
  }

  if (!ignore.shortDescription) {
    singleVideo.shortDescription = "";
    if ("descriptionSnippet" in innerVideo) {
      for (let run in innerVideo.descriptionSnippet.runs)
        singleVideo.shortDescription = innerVideo.descriptionSnippet.runs[run].text;
    }
  }

  if (!ignore.views) {
    if ("viewCountText" in innerVideo)
      singleVideo.views = innerVideo.viewCountText.simpleText;
    else
      singleVideo.views = "";
  }

  if (!ignore.duration) {
    if ("lengthText" in innerVideo)
      singleVideo.duration = innerVideo.lengthText.simpleText;
    else
      singleVideo.duration = "";
  }

  if (!ignore.published) {
    if ("publishedTimeText" in innerVideo)
      singleVideo.published = innerVideo.publishedTimeText.simpleText;
    else
      singleVideo.published = "";
  }

  if (!ignore.thumbnail) { //Is present, even if video is unavailable
    let thumbnails = innerVideo.thumbnail.thumbnails;
    singleVideo.thumbnail = thumbnails[thumbnails.length - 1].url;
  }

  if (!ignore.uploader) {
    singleVideo.uploader = "";
    if ("ownerText" in innerVideo) {
      for (let run in innerVideo.ownerText.runs)
        singleVideo.uploader += innerVideo.ownerText.runs[run].text;
    }
  }

  if (!ignore.verified) {
    singleVideo.verified = "false";
    if ("ownerBadges" in innerVideo) {
      let badges = innerVideo.ownerBadges;
      for (let badge in badges) {
        badge = badges[badge];
        if (badge.metadataBadgeRenderer.style === "BADGE_STYLE_TYPE_VERIFIED") {
          singleVideo.verified = "true";
          break;
        }
      }
    }
  }

  if (!ignore.profilePicture) {
    if ("channelThumbnailSupportedRenderers" in innerVideo && "channelThumbnailWithLinkRenderer" in innerVideo.channelThumbnailSupportedRenderers) {
      let thumbnails = innerVideo.channelThumbnailSupportedRenderers.channelThumbnailWithLinkRenderer.thumbnail.thumbnails;
      singleVideo.profilePicture = thumbnails[thumbnails.length - 1].url;
    } else
      singleVideo.profilePicture = "";
  }

  if (!ignore.handle) {
    singleVideo.handle = "";
    if ("ownerText" in innerVideo) {
      for (run in innerVideo.ownerText.runs) {
        if ("navigationEndpoint" in innerVideo.ownerText.runs[run] && "browseEndpoint" in innerVideo.ownerText.runs[run].navigationEndpoint) {
          let link = innerVideo.ownerText.runs[run].navigationEndpoint.browseEndpoint.canonicalBaseUrl;
          if (link[1] === "@") singleVideo.handle = link;
          break;
        }
      }
    }
  }

  if (!ignore.channelId) {
    singleVideo.channelId = "";
    if ("ownerText" in innerVideo) {
      for (run in innerVideo.ownerText.runs) {
        if ("navigationEndpoint" in innerVideo.ownerText.runs[run] && "browseEndpoint" in innerVideo.ownerText.runs[run].navigationEndpoint) {
          singleVideo.channelId = innerVideo.ownerText.runs[run].navigationEndpoint.browseEndpoint.browseId;
          break;
        }
      }
    }
  }

  return singleVideo;
}

function retrievePoll(innerPoll, settings) {
  if (!settings.focus.poll) return {};
  let singlePoll = {};
  let ignore = settings.poll.ignore;

  if (!ignore.options) {
    singlePoll.options = [];
    for (let choice in innerPoll.choices) {
      let runs = innerPoll.choices[choice].text.runs;
      let option = "";
      for (let run in runs)
        option += runs[run].text;
      singlePoll.options.push(option);
    }
  }

  if (!ignore.votes)
    singlePoll.votes = innerPoll.totalVotes.simpleText;

  return singlePoll;
}

function retrieveImage(innerImage, settings) {
  if (!settings.focus.image) return {};
  let singleImage = {};
  let ignore = settings.image.ignore;

  if (!ignore.url) {
    let thumbnails = innerImage.image.thumbnails;
    singleImage.url = thumbnails[thumbnails.length - 1].url;
  }

  return singleImage;
}


function communityMatches(singleCommunity, filter) {

  let returnMatch = true;

  for (let s in filter) {

    let condition = filter[s];
    if (condition.check !== "likes" && condition.check !== "comments") { //String checker

      let communityCheck = singleCommunity[condition.check];
      let conditionMatch = condition.match;
      if ("casesensitive" in condition ? !condition.casesensitive : true) {
        communityCheck = communityCheck.toLowerCase();
        conditionMatch = conditionMatch.toLowerCase();
      }

      if (condition.compare === "eq") //Exact match needed
        returnMatch = communityCheck === conditionMatch;
      else if (condition.compare === "in")
        returnMatch = communityCheck.includes(conditionMatch);

    } else { //Num checker

      if (singleCommunity[condition.check] === "") continue; //NULL; matches instantly

      let communityCheck = filterHelpers.crunchSimpleViews(singleCommunity[condition.check]);
      switch (condition.compare) {
        case "less":
          returnMatch = communityCheck < parseInt(condition.match);
          break;
        case "greater":
          returnMatch = communityCheck > parseInt(condition.match);
          break;
        case "lesseq":
          returnMatch = communityCheck <= parseInt(condition.match);
          break;
        case "greatereq":
          returnMatch = communityCheck >= parseInt(condition.match);
          break;
        case "eq":
          returnMatch = communityCheck === parseInt(condition.match);
          break;
      }
    }

    if (!returnMatch) break;
  }

  return returnMatch;
}


function printCommunity(singleCommunity) {

  helpers.clearLastLine();
  console.log("-------------------------------------------------------------------");
  for (att in singleCommunity) {
    if (att === "id")
      console.log("link: https://www.youtube.com/post/" + singleCommunity[att]);
    else if (att === "attachment") {

      console.log("attachment: ");
      for (let item in singleCommunity.attachment) {
        if (item === "id")
          console.log("\tlink: https://www.youtube.com/watch?v=" + singleCommunity.attachment[item])
        else if (item === "channelId")
          console.log("\tchannel: https://www.youtube.com/channel/" + singleCommunity.attachment[item])
        else if (item === "options") {
          
          let printStr = "\toptions: ";
          let options = singleCommunity.attachment[item];
          if (options.length > 0) {
            for (let option in options) {
              option = options[option];
              printStr += option + ", ";
            }
            console.log(printStr.substring(0, printStr.length - 2));
          } else
            console.log(printStr);
        } else
          console.log("\t" + item + ": " + singleCommunity.attachment[item]);
      }
    } else
      console.log(att + ": " + singleCommunity[att]);
  }
  console.log("-------------------------------------------------------------------\n\n");
}


async function collectCommunity(settings, config, timeout, initialData) {

  global.sendvb(HEADER, "\n");
  let tabData = await getTabData(config, timeout, initialData, "Community");
  if (tabData === -1) {
    global.sendvb(HEADER, "No posts found.");
    return [];
  }

  let savedCommunity = await scrapeCommunity(settings, config, timeout, tabData);
  global.sendvb(HEADER, "Complete");

  if (savedCommunity.length === 0)
    global.sendvb(HEADER, "No posts found.");
  
  return savedCommunity;
}


module.exports.scrape = collectCommunity;