const helpers = require("../../../common/helpers");
const filterHelpers = require("../../../common/filter_helpers");
const {getTabData} = require("../channel_helpers");
const {INFO, HEADER, PROG} = require("../../../common/verbosity_vars");


async function scrapeHome(savedHome, settings, config, timeout, innerData) {

  let counter = 0; //Stops the scraper when settings.lim is reached
  let allCounters = {}; //Counter for each "type" module
  let allMatchCounters = {}; //Match counter for each "type" module

  let typeCounter = 0; //How many "type modules" reached their capacity (settings[<type>].lim)
  let typeCap = Number.POSITIVE_INFINITY; //Defined as the number of modules with defined limits; scraper stops when this is equal to typeCounter
  let typeMatchCounter = 0; //How many "type modules" reached their match capacity (settings[<type>].limfilter)
  let typeMatchCap = Number.POSITIVE_INFINITY; //Defined as the number of modules with defined (filter) limits; scraper stops when this is equal to typeMatchCounter

  //Setup allCounters, allMatchCounters, typeCap, and typeMatchCap
  for (module in settings.focus) {
    if (!settings.focus[module]) continue;

    allCounters[module] = 0;
    allMatchCounters[module] = 0;

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

  //Get channel attributes to use for special cases
  let channelInfo = {};
  let header = innerData.header.c4TabbedHeaderRenderer;

  channelInfo.uploader = header.title;
  channelInfo.verified = "false";
  if ("badges" in header) {
    for (let badge in header.badges) {
      badge = header.badges[badge].metadataBadgeRenderer;
      if (badge.style === "BADGE_STYLE_TYPE_VERIFIED") {
        channelInfo.verified = "true";
        break;
      }
    }
  }
  { let thumbnails = header.avatar.thumbnails;
  channelInfo.profilePicture = thumbnails[thumbnails.length - 1].url; }
  channelInfo.handle = "/";
  for (let run in header.channelHandleText.runs)
    channelInfo.handle += header.channelHandleText.runs[run].text;
  channelInfo.channelId = header.channelId;

  settings.__channelInfo = channelInfo;

  //Get initial stream of data
  let tabs = innerData.contents.twoColumnBrowseResultsRenderer.tabs;
  innerData = null;
  for (let tab in tabs) {
    tab = tabs[tab].tabRenderer;
    if (tab.selected) {
      innerData = tab.content.sectionListRenderer.contents;
      break;
    }
  }
  if (innerData === null) return savedHome;

  //Information for stacking
  let savedHomeHolder = null;
  let sectionData = null;
  let sectionType = null;
  let popped = false;

  let finished = false;

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

      let stack = [{list: item.itemSectionRenderer.contents, index: 0}];
      while (stack.length !== 0) {
        let items = stack[stack.length - 1];
        let result = items.list[items.index++];

        //Remove a list if done
        popped = false;
        if (items.index >= items.list.length) {
          stack.pop();
          popped = true;
        }

        let type = "";
        let typeId = 0;

        //Multi-item data
        if ("shelfRenderer" in result) {
          result = result.shelfRenderer;

          let innerModule = null;
          if ("horizontalListRenderer" in result.content)
            innerModule = "horizontalListRenderer";
          else if ("expandedShelfContentsRenderer" in result.content)
            innerModule = "expandedShelfContentsRenderer";
          else
            continue;

          if (!settings.nosections) {
            savedHomeHolder = savedHome;
            savedHome = [];
            sectionType = ""; //When not equal to null, the scraper is inside of a section (and sections are enabled)
            sectionData = {section: "", subtitle: ""};

            for (let run in result.title.runs)
              sectionData.section += result.title.runs[run].text;

            if ("subtitle" in result)
              sectionData.subtitle = result.subtitle.simpleText;
          }

          let newList = {list: result.content[innerModule].items, index: 0};
          stack.push(newList);
          continue;

        } else if ("reelShelfRenderer" in result) {
          result = result.reelShelfRenderer;

          if (!settings.nosections) {
            savedHomeHolder = savedHome;
            savedHome = [];
            sectionType = "";
            sectionData = {section: "", subtitle: ""};

            for (let run in result.title.runs)
              sectionData.section += result.title.runs[run].text;

            if ("subtitle" in result)
              sectionData.subtitle = result.subtitle.simpleText;
          }

          let newList = {list: result.items, index: 0};
          stack.push(newList);
          continue;
        }

        //Singular data
        if ("gridVideoRenderer" in result) { //Standard video
          type = "videos";
          result = result.gridVideoRenderer;

        } else if ("reelItemRenderer" in result) { //Standard short
          type = "shorts";
          result = result.reelItemRenderer;

        } else if ("gridPlaylistRenderer" in result) { //Standard playlist
          type = "playlists";
          result = result.gridPlaylistRenderer;

        } else if ("gridChannelRenderer" in result) { //Standard channel
          type = "channels";
          result = result.gridChannelRenderer;

        } else if ("channelFeaturedContentRenderer" in result) { //Top listed video (variant 2)
          type = "videos";
          typeId = 1;
          result = result.channelFeaturedContentRenderer.items[0].videoRenderer;

        } else if ("channelVideoPlayerRenderer" in result) { //Top listed video (variant 1)
          type = "videos";
          typeId = 2;
          result = result.channelVideoPlayerRenderer;

        } else if ("videoRenderer" in result) { //Singular video
          type = "videos";
          typeId = 1;
          result = result.videoRenderer;

        } else if ("playlistRenderer" in result) { //Singular playlist
          type = "playlists";
          typeId = 1;
          result = result.playlistRenderer;

        } else if ("channelRenderer" in result) { //Singular channel
          type = "channels";
          typeId = 1;
          result = result.channelRenderer;

        } else
          continue;

        //Check limits and focuses before continuing
        if (!settings.focus[type] || allCounters[type] >= settings[type].lim || allMatchCounters[type] >= settings[type].limfilter)
          continue;

        let singleResult = retrieveResult(result, settings, type, typeId);
        let match = resultMatches(singleResult, settings[type].filter, type);

        if (match) {
          if (settings[type].printfilter)
            printResult(singleResult, type);
          ++allMatchCounters[type];
        }

        if (!settings[type].savefilter || match) {
          if (settings.seperate && sectionType === null) //Not inside of a section
            savedHome[type].push(singleResult);
          else
            savedHome.push(singleResult);
        }

        if (sectionType !== null) sectionType = type;

        //Append section data
        if (popped && sectionType !== null) {
          sectionData.results = savedHome;
          savedHome = savedHomeHolder;
          if (settings.seperate && sectionType !== "")
            savedHome[sectionType].push(sectionData);
          else
            savedHome.push(sectionData);
          sectionType = null;
          savedHomeHolder = null;
        }

        if (allMatchCounters[type] >= settings[type].limfilter)
          ++typeMatchCounter;

        ++counter;
        ++allCounters[type];

        if (allCounters[type] >= settings[type].lim)
          ++typeCounter;

        if (counter >= settings.lim) {
          finished = true;
          break;
        }
        if (typeCounter >= typeCap || typeMatchCounter >= typeMatchCap) {
          finished = true;
          break;
        }
      }
      if (finished) break;

    }

    if (global.verbose >= PROG) helpers.clearLastLine();
    global.sendvb(PROG, "Items scraped: " + counter);

    if (finished) {
      if (sectionType !== null) {
        sectionData.results = savedHome;
        savedHome = savedHomeHolder;
        if (settings.seperate && sectionType !== "")
          savedHome[sectionType].push(sectionData);
        else
          savedHome.push(sectionData);
      }
    }

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
      if (contents === null) break;
      innerData = contents;
    }
  }

  return {savedHome: savedHome, length: counter};

}


function retrieveResult(innerResult, settings, type, typeId) {
  let singleResult = null;

  if (type === "videos") {

    if (typeId === 0)
      singleResult = retrieveVideo(innerResult, settings);
    else if (typeId === 1)
      singleResult = retrieveVideo1(innerResult, settings);
    else //(typeId === 2)
      singleResult = retrieveVideo2(innerResult, settings);

  } else if (type === "shorts") {
    
    singleResult = retrieveShort(innerResult, settings); //typeId === 0

  } else if (type === "playlists") {

    if (typeId === 0)
      singleResult = retrievePlaylist(innerResult, settings);
    else //(typeId === 1)
      singleResult = retrievePlaylist1(innerResult, settings);

  } else { //(type === "channels")

    if (typeId === 0)
      singleResult = retrieveChannel(innerResult, settings);
    else //(typeId === 1)
      singleResult = retrieveChannel1(innerResult, settings);

  }

  return singleResult;
}


function retrieveVideo(innerResult, settings) {
  let singleVideo = {};
  if (!settings.seperate)
    singleVideo.type = "videos";
  let ignore = settings.videos.ignore;

  if (!ignore.id)
    singleVideo.id = innerResult.videoId;

  if (!ignore.title)
    singleVideo.title = innerResult.title.simpleText;

  if (!ignore.shortDescription)
    singleVideo.shortDescription = "";

  if (!ignore.badges) {
    singleVideo.badges = [];
    if ("badges" in innerResult) {
      for (let badge in innerResult.badges)
        singleVideo.badges.push(innerResult.badges[badge].metadataBadgeRenderer.label);
    }
  }

  if (!ignore.views) {
    if ("viewCountText" in innerResult)
      singleVideo.views = innerResult.viewCountText.simpleText;
    else
      singleVideo.views = "";
  }

  if (!ignore.duration) {
    singleVideo.duration = "";
    for (let overlay in innerResult.thumbnailOverlays) {
      overlay = innerResult.thumbnailOverlays[overlay];
      if ("thumbnailOverlayTimeStatusRenderer" in overlay) {
        singleVideo.duration = overlay.thumbnailOverlayTimeStatusRenderer.text.simpleText;
        break;
      }
    }
  }

  if (!ignore.published)
    singleVideo.published = innerResult.publishedTimeText.simpleText;

  if (!ignore.thumbnail) {
    let thumbnails = innerResult.thumbnail.thumbnails;
    singleVideo.thumbnail = thumbnails[thumbnails.length - 1].url;
  }

  if ("shortBylineText" in innerResult) { //If this is not present, the scraped channel is the uploader

    if (!ignore.uploader) {
      singleVideo.uploader = "";
      for (let run in innerResult.shortBylineText.runs)
        singleVideo.uploader += innerResult.shortBylineText.runs[run].text;
    }

    if (!ignore.verified) {
      singleVideo.verified = "false";
      if ("ownerBadges" in innerResult) {
        for (let badge in innerResult.ownerBadges) {
          badge = innerResult.ownerBadges[badge].metadataBadgeRenderer;
          if (badge.style === "BADGE_STYLE_TYPE_VERIFIED") {
            singleVideo.verified = "true";
            break;
          }
        }
      }
    }

    if (!ignore.profilePicture)
      singleVideo.profilePicture = "";

    if (!ignore.handle) {
      singleVideo.handle = "";
      for (let run in innerResult.shortBylineText.runs) {
        run = innerResult.shortBylineText.runs[run];
        if ("navigationEndpoint" in run) {
          let handle = run.navigationEndpoint.browseEndpoint.canonicalBaseUrl;
          if (handle[1] === "@") singleVideo.handle = handle;
          break;
        }
      }
    }

    if (!ignore.channelId) {
      singleVideo.channelId = "";
      for (let run in innerResult.shortBylineText.runs) {
        run = innerResult.shortBylineText.runs[run];
        if ("navigationEndpoint" in run) {
          singleVideo.channelId = run.navigationEndpoint.browseEndpoint.browseId;
          break;
        }
      }
    }

  } else {
    let channelInfo = settings.__channelInfo;

    if (!ignore.uploader)
      singleVideo.uploader = channelInfo.uploader;

    if (!ignore.verified)
      singleVideo.verified = channelInfo.verified;

    if (!ignore.profilePicture)
      singleVideo.profilePicture = channelInfo.profilePicture;

    if (!ignore.handle)
      singleVideo.handle = channelInfo.handle;

    if (!ignore.channelId)
      singleVideo.channelId = channelInfo.channelId;
  }

  return singleVideo;
}

function retrieveVideo1(innerResult, settings) {
  let singleVideo = {};
  if (!settings.seperate)
    singleVideo.type = "videos";
  let ignore = settings.videos.ignore;

  if (!ignore.id)
		singleVideo.id = innerResult.videoId;

	if (!ignore.title)
		singleVideo.title = innerResult.title.simpleText;

	if (!ignore.shortDescription) {
		singleVideo.shortDescription = "";
    if ("descriptionSnippet" in innerResult) {
      for (let run in innerResult.descriptionSnippet.runs)
        singleVideo.shortDescription += innerResult.descriptionSnippet.runs[run].text;
    }
	}

  if (!ignore.badges) { //******************************************************************TEST THIS FUNCTION
    singleVideo.badges = [];
    if ("badges" in innerResult) {
      for (let badge in innerResult.badges)
        singleVideo.badges.push(innerResult.badges[badge].metadataBadgeRenderer.label);
    }
  }

  if (!ignore.views) {
    singleVideo.views = "";
    if ("viewCountText" in innerResult) {
      if ("runs" in innerResult.viewCountText) {
        for (let run in innerResult.viewCountText.runs)
          singleVideo.views += innerResult.viewCountText.runs[run].text;
      } else
        singleVideo.views = innerResult.viewCountText.simpleText;
    }
  }

  if (!ignore.duration) {
    singleVideo.duration = "";
    if ("lengthText" in innerResult)
      singleVideo.duration = innerResult.lengthText.simpleText;
  }

  if (!ignore.published) {
    singleVideo.published = "";
    if ("publishedTimeText" in innerResult)
      singleVideo.published = innerResult.publishedTimeText.simpleText;
  }

  if (!ignore.thumbnail) {
    let thumbnails = innerResult.thumbnail.thumbnails;
    singleVideo.thumbnail = thumbnails[thumbnails.length - 1].url;
  }

  if (!ignore.uploader) {
    singleVideo.uploader = "";
    for (let run in innerResult.ownerText.runs)
      singleVideo.uploader += innerResult.ownerText.runs[run].text;
  }

  if (!ignore.verified) {
    singleVideo.verified = "false";
    if ("ownerBadges" in innerResult) {
      let badges = innerResult.ownerBadges;
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
    singleVideo.profilePicture = "";
    if ("channelThumbnailSupportedRenderers" in innerResult) {
      let thumbnails = innerResult.channelThumbnailSupportedRenderers.channelThumbnailWithLinkRenderer.thumbnail.thumbnails;
      singleVideo.profilePicture = thumbnails[thumbnails.length - 1].url;
    }
  }

  if (!ignore.handle) {
    singleVideo.handle = "";
    for (run in innerResult.longBylineText.runs) {
      if ("navigationEndpoint" in innerResult.longBylineText.runs[run] && "browseEndpoint" in innerResult.longBylineText.runs[run].navigationEndpoint) {
        let link = innerResult.longBylineText.runs[run].navigationEndpoint.browseEndpoint.canonicalBaseUrl;
        if (link[1] === "@") singleVideo.handle = link;
        break;
      }
    }
  }

  if (!ignore.channelId) {
    singleVideo.channelId = "";
    for (run in innerResult.longBylineText.runs) {
      if ("navigationEndpoint" in innerResult.longBylineText.runs[run] && "browseEndpoint" in innerResult.longBylineText.runs[run].navigationEndpoint) {
        singleVideo.channelId = innerResult.longBylineText.runs[run].navigationEndpoint.browseEndpoint.browseId;
        break;
      }
    }
  }

  return singleVideo;
}

function retrieveVideo2(innerResult, settings) {
  let singleVideo = {};
  if (!settings.seperate)
    singleVideo.type = "videos";
  let ignore = settings.videos.ignore;
  let channelInfo = settings.__channelInfo;

  if (!ignore.id)
    singleVideo.id = innerResult.videoId;

  if (!ignore.title) {
    singleVideo.title = "";
    for (let run in innerResult.title.runs)
      singleVideo.title += innerResult.title.runs[run].text;
  }

  if (!ignore.shortDescription) {
    singleVideo.shortDescription = "";
    for (let run in innerResult.description.runs)
      singleVideo.shortDescription += innerResult.description.runs[run].text;
  }

  if (!ignore.badges) //***************************************************************SEE IF BADGES CAN EXIST
    singleVideo.badges = [];

  if (!ignore.views) {
    if ("viewCountText" in innerResult)
      singleVideo.views = innerResult.viewCountText.simpleText;
    else
      singleVideo.views = "";
  }

  if (!ignore.duration)
    singleVideo.duration = ""; //*****************************************************SEE IF THIS CAN BE FOUND

  if (!ignore.published) {
    singleVideo.published = "";
    for (let run in innerResult.publishedTimeText.runs)
      singleVideo.published += innerResult.publishedTimeText.runs[run].text;
  }

  if (!ignore.thumbnail)
    singleVideo.thumbnail = "";

  //Assumes the top video is always by the channel being scraped
  if (!ignore.uploader)
    singleVideo.uploader = channelInfo.uploader;

  if (!ignore.verified)
    singleVideo.verified = channelInfo.verified;

  if (!ignore.profilePicture)
    singleVideo.profilePicture = channelInfo.profilePicture;

  if (!ignore.handle)
    singleVideo.handle = channelInfo.handle;

  if (!ignore.channelId)
    singleVideo.channelId = channelInfo.channelId;

  return singleVideo;
}

function retrieveShort(innerResult, settings) {
  let singleShort = {};
  if (!settings.seperate)
    singleShort.type = "shorts";
  let ignore = settings.shorts.ignore;

  if (!ignore.id)
    singleShort.id = innerResult.videoId;

  if (!ignore.title)
    singleShort.title = innerResult.headline.simpleText;

  if (!ignore.views)
    singleShort.views = innerResult.viewCountText.simpleText;

  if (!ignore.thumbnail) {
    let thumbnails = innerResult.thumbnail.thumbnails;
    singleShort.thumbnail = thumbnails[thumbnails.length - 1].url;
  }

  return singleShort;
}

function retrievePlaylist(innerResult, settings) {
  let singlePlaylist = {};
  if (!settings.seperate)
    singlePlaylist.type = "playlists";
  let ignore = settings.playlists.ignore;

  if (!ignore.id)
    singlePlaylist.id = innerResult.playlistId;

  if (!ignore.title) {
    singlePlaylist.title = "";
    for (let run in innerResult.title.runs)
      singlePlaylist.title += innerResult.title.runs[run].text;
  }

  if (!ignore.size)
    singlePlaylist.size = innerResult.videoCountShortText.simpleText;

  if (!ignore.shortVideos)
    singlePlaylist.shortVideos = [];

  if (!ignore.shortVideoIds)
    singlePlaylist.shortVideoIds = [];

  if (!ignore.updated) {
    if ("publishedTimeText" in innerResult)
      singlePlaylist.updated = innerResult.publishedTimeText.simpleText;
    else
      singlePlaylist.updated = "";
  }

  if (!ignore.thumbnail) {
    let thumbnails = innerResult.thumbnail.thumbnails;
    singlePlaylist.thumbnail = thumbnails[thumbnails.length - 1].url;
  }

  if (!ignore.uploader) {
    singlePlaylist.uploader = "";
    for (let run in innerResult.longBylineText.runs) {
      run = innerResult.longBylineText.runs[run];
      if ("navigationEndpoint" in run) { //Uploader found
        singlePlaylist.uploader = run.text;
        break;
      }
    }
  }

  if (!ignore.verified) {
    singlePlaylist.verified = "false";
    if ("ownerBadges" in innerResult) {
      for (let badge in innerResult.ownerBadges) {
        badge = innerResult.ownerBadges[badge].metadataBadgeRenderer;
        if (badge.style === "BADGE_STYLE_TYPE_VERIFIED") {
          singlePlaylist.verified = "true";
          break;
        }
      }
    }
  }

  if (!ignore.handle) {
    singlePlaylist.handle = "";
    for (let run in innerResult.longBylineText.runs) {
      run = innerResult.longBylineText.runs[run];
      if ("navigationEndpoint" in run) {
        let handle = run.navigationEndpoint.browseEndpoint.canonicalBaseUrl;
        if (handle[1] === "@") singlePlaylist.handle = handle;
        break;
      }
    }
  }

  if (!ignore.channelId) {
    singlePlaylist.channelId = "";
    for (let run in innerResult.longBylineText.runs) {
      run = innerResult.longBylineText.runs[run];
      if ("navigationEndpoint" in run) {
        singlePlaylist.channelId = run.navigationEndpoint.browseEndpoint.browseId;
        break;
      }
    }
  }

  return singlePlaylist;
}

function retrievePlaylist1(innerResult, settings) {
  let singlePlaylist = {};
  if (!settings.seperate)
    singlePlaylist.type = "playlists";
  let ignore = settings.playlists.ignore;

  if (!ignore.id)
    singlePlaylist.id = innerResult.playlistId;

  if (!ignore.title)
    singlePlaylist.title = innerResult.title.simpleText;

  if (!ignore.size)
    singlePlaylist.size = innerResult.videoCount;

  if (!ignore.shortVideos) {
    let videos = innerResult.videos;
    singlePlaylist.shortVideos = [];
    for (let video in videos) {
      video = videos[video].childVideoRenderer;
      singlePlaylist.shortVideos.push(video.title.simpleText + " • " + video.lengthText.simpleText);
    }
  }

  if (!ignore.shortVideoIds) {
    let videos = innerResult.videos;
    singlePlaylist.shortVideoIds = [];
    for (let video in videos) {
      video = videos[video].childVideoRenderer;
      singlePlaylist.shortVideoIds.push(video.videoId);
    }
  }

  if (!ignore.updated) {
    if ("publishedTimeText" in innerResult)
      singlePlaylist.updated = innerResult.publishedTimeText.simpleText;
    else
      singlePlaylist.updated = "";
  }

  if (!ignore.thumbnail) {
    let thumbnails = innerResult.thumbnails[0].thumbnails;
    singlePlaylist.thumbnail = thumbnails[thumbnails.length - 1].url;
  }

  if (!ignore.uploader) {
    let runs = innerResult.longBylineText.runs;
    singlePlaylist.uploader = "";
    for (let run in runs)
      singlePlaylist.uploader += runs[run].text;
  }

  if (!ignore.verified) {
    singlePlaylist.verified = "false";
    if ("ownerBadges" in innerResult) {
      let badges = innerResult.ownerBadges;
      for (let badge in badges) {
        badge = badges[badge];
        if (badge.metadataBadgeRenderer.style === "BADGE_STYLE_TYPE_VERIFIED") {
          singlePlaylist.verified = "true";
          break;
        }
      }
    }
  }

  if (!ignore.handle) {
    singlePlaylist.handle = "";
    for (run in innerResult.longBylineText.runs) {
      if ("navigationEndpoint" in innerResult.longBylineText.runs[run] && "browseEndpoint" in innerResult.longBylineText.runs[run].navigationEndpoint) {
        let link = innerResult.longBylineText.runs[run].navigationEndpoint.browseEndpoint.canonicalBaseUrl;
        if (link[1] === "@") singlePlaylist.handle = link;
        break;
      }
    }
  }

  if (!ignore.channelId) {
    singlePlaylist.channelId = "";
    for (run in innerResult.longBylineText.runs) {
      if ("navigationEndpoint" in innerResult.longBylineText.runs[run] && "browseEndpoint" in innerResult.longBylineText.runs[run].navigationEndpoint) {
        singlePlaylist.channelId = innerResult.longBylineText.runs[run].navigationEndpoint.browseEndpoint.browseId;
        break;
      }
    }
  }

  return singlePlaylist;
}

function retrieveChannel(innerResult, settings) {
  let singleChannel = {};
  if (!settings.seperate)
    singleChannel.type = "channels";
  let ignore = settings.channels.ignore;

  if (!ignore.name)
    singleChannel.name = innerResult.title.simpleText;

  if (!ignore.verified) {
    singleChannel.verified = "false";
    if ("ownerBadges" in innerResult) {
      for (let badge in innerResult.ownerBadges) {
        badge = innerResult.ownerBadges[badge].metadataBadgeRenderer;
        if (badge.style === "BADGE_STYLE_TYPE_VERIFIED") {
          singleChannel.verified = "true";
          break;
        }
      }
    }
  }

  if (!ignore.subscribers)
    singleChannel.subscribers = innerResult.subscriberCountText.simpleText;

  if (!ignore.shortDescription)
    singleChannel.shortDescription = "";

  if (!ignore.profilePicture) {
    let thumbnails = innerResult.thumbnail.thumbnails;
    singleChannel.profilePicture = thumbnails[thumbnails.length - 1].url;
  }

  if (!ignore.handle) {
    let handle = innerResult.navigationEndpoint.browseEndpoint.canonicalBaseUrl;
    if (handle[1] === "@")
      singleChannel.handle = handle;
    else
      singleChannel.handle = "";
  }

  if (!ignore.channelId)
    singleChannel.channelId = innerResult.channelId;

  return singleChannel;
}

function retrieveChannel1(innerResult, settings) {
  let singleChannel = {};
  if (!settings.seperate)
    singleChannel.type = "channels";
  let ignore = settings.channels.ignore;

  if (!ignore.name)
    singleChannel.name = innerResult.title.simpleText;
  
  if (!ignore.verified) {
    singleChannel.verified = "false";
    if ("ownerBadges" in innerResult) {
      let badges = innerResult.ownerBadges;
      for (let badge in badges) {
        badge = badges[badge];
        if (badge.metadataBadgeRenderer.style === "BADGE_STYLE_TYPE_VERIFIED") {
          singleChannel.verified = "true";
          break;
        }
      }
    }
  }

  if (!ignore.subscribers) { //simpleText is not present if subscribers are replaced with an actual video count
    if ("videoCountText" in innerResult && "simpleText" in innerResult.videoCountText)
      singleChannel.subscribers = innerResult.videoCountText.simpleText;
    else if ("subscriberCountText" in innerResult)
      singleChannel.subscribers = innerResult.subscriberCountText.simpleText;
    else
      singleChannel.subscribers = "";
  }

  if (!ignore.shortDescription) {
    singleChannel.shortDescription = "";
    if ("descriptionSnippet" in innerResult) {
      for (let run in innerResult.descriptionSnippet.runs)
        singleChannel.shortDescription += innerResult.descriptionSnippet.runs[run].text;
    }
  }

  if (!ignore.profilePicture) {
    let thumbnails = innerResult.thumbnail.thumbnails;
    singleChannel.profilePicture = thumbnails[thumbnails.length - 1].url;
  }

  if (!ignore.handle) {
    let link = innerResult.navigationEndpoint.browseEndpoint.canonicalBaseUrl;
    singleChannel.handle = (link[1] === "@") ? link : "";
  }

  if (!ignore.channelId)
    singleChannel.channelId = innerResult.channelId;

  return singleChannel;
}


const numAttributeFunctions = {
  views: {
    videos: filterHelpers.crunchViewCount,
    shorts: filterHelpers.crunchSimpleViews
  },
  duration: {
    videos: filterHelpers.durationToSec
  },
  size: {
    playlists: parseInt
  },
  subscribers: {
    channels: filterHelpers.crunchSimpleViews
  }
};

function filterStringCheck(value, target, compare, casesensitive) {
  if (!casesensitive) {
    value = value.toLowerCase();
    target = target.toLowerCase();
  }

  if (compare === "eq")
    return value === target;
  else //(compare === "in")
    return value.includes(target);
}

function filterNumCheck(value, target, compare) {
  target = parseInt(target);
  switch (compare) {
    case "less":
      returnMatch = value < target;
      break;
    case "greater":
      returnMatch = value > target;
      break;
    case "lesseq":
      returnMatch = value <= target;
      break;
    case "greatereq":
      returnMatch = value >= target;
      break;
    default: //case "eq":
      returnMatch = value === target;
      break;
  }
}

function resultMatches(singleResult, filter, type) {

  let returnMatch = true;

  for (let f in filter) {

    let condition = filter[f];
    if (!(condition.check in numAttributeFunctions)) { //String checker

      let resultCheck = singleResult[condition.check];
      let conditionMatch = condition.match;
      let casesensitive = "casesensitive" in condition ? condition.casesensitive : false;

      if (typeof(resultCheck) !== "string") { //Automatically assumed to be an array
        for (let piece in resultCheck) {
          returnMatch = filterStringCheck(resultCheck[piece], conditionMatch, condition.compare, casesensitive);
          if (returnMatch) break; //Only one string in the array needs to match
        }
      } else
        returnMatch = filterStringCheck(resultCheck, conditionMatch, condition.compare, casesensitive);

    } else { //Num checker

      if (singleResult[condition.check] === "") continue; //NULL; always accepted
      let resultCheck = numAttributeFunctions[condition.check][type](singleResult[condition.check]);
      let conditionMatch = condition.match;
      
      returnMatch = filterNumCheck(resultCheck, conditionMatch, condition.compare);
    }

    if (!returnMatch) break;
  }

  return returnMatch;
}


function printResult(singleResult, type) {

  helpers.clearLastLine();
  console.log("-------------------------------------------------------------------");
  for (let att in singleResult) {
    if (att === "id") {
      if (type === "playlists")
        console.log("link: https://www.youtube.com/playlist?list=" + singleResult[att]);
      else //(type === "videos" || type === "shorts")
        console.log("link: https://www.youtube.com/watch?v=" + singleResult[att]);
    } else if (att === "channelId")
      console.log("channel: " + "https://www.youtube.com/channel/" + singleResult[att]);
    else if (att === "badges" || att === "shortVideos" || att === "shortVideoIds") {
      let printStr = att + ": ";
      if (singleResult[att].length > 0) {
        for (let item in singleResult[att]) {
          item = singleResult[att][item];
          printStr += item + ", ";
        }
        console.log(printStr.substring(0, printStr.length - 2));
      } else
        console.log(printStr);
    } else
      console.log(att + ": " + singleResult[att]);
  }
  console.log("-------------------------------------------------------------------\n\n");
}


async function collectHome(settings, config, timeout, initialData) {

  let savedHome = null;
  if (settings.seperate) {
    savedHome = {};
    for (let module in settings.focus) {
      if (settings.focus[module])
        savedHome[module] = [];
    }
  } else
    savedHome = [];

  global.sendvb(HEADER, "\n");
  let tabData = await getTabData(config, timeout, initialData, "Home");
  if (tabData === -1) {
    global.sendvb(HEADER, "No items found.");
    return savedHome;
  }

  let saved = await scrapeHome(savedHome, settings, config, timeout, tabData);
  global.sendvb(HEADER, "Complete");
  
  savedHome = saved.savedHome;
  let length = saved.length;

  if (length === 0)
    global.sendvb(HEADER, "No items found.");

  return savedHome;
}


module.exports.scrape = collectHome;