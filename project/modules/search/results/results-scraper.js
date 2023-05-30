const helpers = require("../../../common/helpers");
const filterHelpers = require("../../../common/filter_helpers");


async function scrapeResults(settings, config, timeout, searchData) {

	let initialData = true;
	let collectedResults = null;
	if (settings.search.seperate) {
		collectedResults = {};
		for (module in settings.search.focus) {
			if (settings.search.focus[module] && module !== "meta")
				collectedResults[module] = [];
		}
	} else
		collectedResults = [];

	let continuation_id = "";
	let hasContinuation = true;

  let counter = 0;
  let typeCounter = {};
  let typeMatchCounter = {};

  let totalCounter = 0;
  let typeCap = Number.POSITIVE_INFINITY;
  let totalMatchCounter = 0;
  let typeMatchCap = Number.POSITIVE_INFINITY;

  //The following code is for the modules' limiters to "work together" (for example, if videos --lim 50 and
  //playlists --lim 5 is specified, the scraper keeps going until 50 videos and 5 playlists are scraped,
  //instead of stopping when only one goal is reached.)
  for (module in settings.search.focus) {
    if (module === "meta") continue;

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

  let collectedResultsHolder = null;
  let sectionTitle = "";
  let inSection = false;
  let popped = false;

  let finished = false;


	while (hasContinuation) { //Main loop
		hasContinuation = false;

		let contents = null;
		if (!initialData) {
			contents = searchData.onResponseReceivedCommands;
			for (let content in contents) {
				content = contents[content];
				if ("appendContinuationItemsAction" in content) {
					contents = content.appendContinuationItemsAction.continuationItems;
					break;
				}
			}
		} else {
			contents = searchData.contents.twoColumnSearchResultsRenderer.primaryContents.sectionListRenderer.contents;
			initialData = false;
		}

		//Iterate through contents
		for (let item in contents) {
			item = contents[item];

			if ("continuationItemRenderer" in item) {
				continuation_id = item.continuationItemRenderer.continuationEndpoint.continuationCommand.token;
        config.data.continuation = continuation_id;
				hasContinuation = true;
				continue;
			}

			let stack = [{list: item.itemSectionRenderer.contents, index: 0}];
			while (stack.length !== 0) {
        let items = stack[stack.length - 1];
				let result = items.list[items.index++];

        popped = false;
        if (items.index >= items.list.length) {
          stack.pop();
          popped = true;
        }

        let match = true;
        let type = "";
        let cont = false;

        //Categorize response piece
				if ("videoRenderer" in result) {
          type = "videos";
          result = result.videoRenderer;

				} else if ("shelfRenderer" in result) {
          let section = result.shelfRenderer;
          if ("verticalListRenderer" in section.content) { //*************WHAT TYPE OF DATA DOESN'T HAVE THIS?
            if (settings.search.savesections) {

              collectedResultsHolder = collectedResults;
              collectedResults = []; //Store the data in the section
              sectionTitle = section.title.simpleText;
              inSection = true;
            }
            stack.push({list: section.content.verticalListRenderer.items, index: 0}); //We have recieved a new pack of items to go through on the stack
          }
          continue;

        } else if ("reelItemRenderer" in result) {
          type = "shorts";
          result = result.reelItemRenderer;

				} else if ("reelShelfRenderer" in result) {
          let section = result.reelShelfRenderer;
          if (settings.search.savesections) {

            collectedResultsHolder = collectedResults;
            collectedResults = []; //Store the data in the section
            sectionTitle = section.title.simpleText;
            inSection = true;
          }
          stack.push({list: section.items, index: 0});
          continue;

				} else if ("channelRenderer" in result) {
          type = "channels";
          result = result.channelRenderer;

				} else if ("playlistRenderer" in result) {
          type = "playlists";
          result = result.playlistRenderer;

        } else if ("radioRenderer" in result) {
          type = "mixes";
          result = result.radioRenderer;

				} else if ("movieRenderer" in result) {
          type = "movies";
          result = result.movieRenderer;

				} else
          cont = true;

        //Collect data from response (if limit not exceeded or module not focused)
        if (cont || !settings.search.focus[type] || typeCounter[type] >= settings[type].lim || typeMatchCounter[type] >= settings[type].limfilter) {
          if (popped && inSection) {
            let sectionData = {header: sectionTitle, results: collectedResults};
            collectedResults = collectedResultsHolder;
            collectedResultsHolder = null;
            if (sectionData.results.length !== 0)
              collectedResults.push(sectionData);
            inSection = false;
          }
          continue;
        }

        let singleResult = retrieveResult(result, settings, type);
        match = resultMatches(singleResult, settings[type].filter, type);
        
        if (match) {
          if (settings[type].printfilter)
            printResult(singleResult, type);
          //++matchCounter;
          ++typeMatchCounter[type];
        }

        if (!settings[type].savefilter || match) {
          if (settings.search.seperate)
            collectedResults[type].push(singleResult);
          else
            collectedResults.push(singleResult);
        }

        if (popped && inSection) { //Append section data
          let sectionData = {header: sectionTitle, results: collectedResults};
          collectedResults = collectedResultsHolder;
          collectedResultsHolder = null;
          if (sectionData.results.length !== 0)
            collectedResults.push(sectionData);
          inSection = false;
        }

        if (typeMatchCounter[type] >= settings[type].limfilter)
          ++totalMatchCounter;

        ++counter;
        ++typeCounter[type];

        if (typeCounter[type] >= settings[type].lim)
          ++totalCounter;

        //If either counters reach the specified limit, scraping stops
        if (counter >= settings.search.lim) {
          finished = true;
          break;
        }
        if (totalCounter >= typeCap || totalMatchCounter >= typeMatchCap) {
          finished = true;
          break;
        }
        
			}
      if (finished) break;

		}

    if (global.verbose >= 3) helpers.clearLastLine();
    global.sendvb(3, "Search results scraped: " + counter);

    if (finished) {
      if (inSection) { //If this is true, savesections was specified; append the last section before returning collectedResults
        let sectionData = {header: sectionTitle, results: collectedResults};
        collectedResults = collectedResultsHolder;
        if (sectionData.results.length !== 0)
          collectedResults.push(sectionData);
      }
      break;
    }

    if (hasContinuation) {
      searchData = await helpers.makeRequest(config, timeout, 1, 1);
      if (searchData === -1) break;
      searchData = searchData.data;
    }

	}

  return {savedResults: collectedResults, length: counter};

}


//*********************************************************************************
//General function for results of different types
//*********************************************************************************
function retrieveResult(innerData, settings, type) {
  switch (type) {
    case "videos":
      return retrieveVideo(innerData, settings);
    case "shorts":
      return retrieveShort(innerData, settings);
    case "channels":
      return retrieveChannel(innerData, settings);
    case "playlists":
      return retrievePlaylist(innerData, settings);
    case "mixes":
      return retrieveMix(innerData, settings);
    case "movies":
      return retrieveMovie(innerData, settings);
  }
}

function retrieveVideo(innerData, settings) {
	let singleVideo = {};
	if (!settings.search.seperate)
		singleVideo.type = "videos";
	let ignore = settings.videos.ignore;

	if (!ignore.id)
		singleVideo.id = innerData.videoId;

	if (!ignore.title) {
		singleVideo.title = "";
		for (let run in innerData.title.runs)
			singleVideo.title += innerData.title.runs[run].text;
	}

	if (!ignore.shortDescription) { //!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! FIND OUT IF THIS SOLUTION IS SAFE
		singleVideo.shortDescription = "";
    if ("detailedMetadataSnippets" in innerData) {
      let description = innerData.detailedMetadataSnippets;
      if (description.length !== 0) {
        description = description[0].snippetText.runs;
        for (let run in description)
          singleVideo.shortDescription += description[run].text;
      }
    }
	}

  if (!ignore.badges) {
    singleVideo.badges = [];
    if ("badges" in innerData) {
      for (let badge in innerData.badges)
        singleVideo.badges.push(innerData.badges[badge].metadataBadgeRenderer.label);
    }
  }

  if (!ignore.views) {
    singleVideo.views = "";
    if ("viewCountText" in innerData) {
      if ("runs" in innerData.viewCountText) {
        for (let run in innerData.viewCountText.runs)
          singleVideo.views += innerData.viewCountText.runs[run].text;
      } else
        singleVideo.views = innerData.viewCountText.simpleText;
    }
  }

  if (!ignore.duration) {
    singleVideo.duration = "";
    if ("lengthText" in innerData)
      singleVideo.duration = innerData.lengthText.simpleText;
  }

  if (!ignore.published) {
    singleVideo.published = "";
    if ("publishedTimeText" in innerData)
      singleVideo.published = innerData.publishedTimeText.simpleText;
  }

  if (!ignore.thumbnail) {
    let thumbnails = innerData.thumbnail.thumbnails;
    singleVideo.thumbnail = thumbnails[thumbnails.length - 1].url;
  }

  if (!ignore.uploader) {
    singleVideo.uploader = "";
    for (let run in innerData.ownerText.runs)
      singleVideo.uploader += innerData.ownerText.runs[run].text;
  }

  if (!ignore.verified) {
    singleVideo.verified = "false";
    if ("ownerBadges" in innerData) {
      let badges = innerData.ownerBadges;
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
    if ("channelThumbnailSupportedRenderers" in innerData) {
      let thumbnails = innerData.channelThumbnailSupportedRenderers.channelThumbnailWithLinkRenderer.thumbnail.thumbnails;
      singleVideo.profilePicture = thumbnails[thumbnails.length - 1].url;
    }
  }

  if (!ignore.handle) {
    singleVideo.handle = "";
    for (run in innerData.longBylineText.runs) {
      if ("navigationEndpoint" in innerData.longBylineText.runs[run] && "browseEndpoint" in innerData.longBylineText.runs[run].navigationEndpoint) {
        let link = innerData.longBylineText.runs[run].navigationEndpoint.browseEndpoint.canonicalBaseUrl;
        if (link[1] === "@") singleVideo.handle = link;
        break;
      }
    }
  }

  if (!ignore.channelId) {
    singleVideo.channelId = "";
    for (run in innerData.longBylineText.runs) {
      if ("navigationEndpoint" in innerData.longBylineText.runs[run] && "browseEndpoint" in innerData.longBylineText.runs[run].navigationEndpoint) {
        singleVideo.channelId = innerData.longBylineText.runs[run].navigationEndpoint.browseEndpoint.browseId;
        break;
      }
    }
  }

  return singleVideo;
}

function retrieveShort(innerData, settings) {
  let singleShort = {};
  if (!settings.search.seperate)
		singleShort.type = "shorts";
	let ignore = settings.shorts.ignore;

  if (!ignore.id)
    singleShort.id = innerData.videoId;

  if (!ignore.title)
    singleShort.title = innerData.headline.simpleText;

  if (!ignore.views)
    singleShort.views = innerData.viewCountText.simpleText;

  if (!ignore.thumbnail) {
    let thumbnails = innerData.thumbnail.thumbnails;
    singleShort.thumbnail = thumbnails[thumbnails.length - 1].url;
  }

  return singleShort;
}

function retrieveChannel(innerData, settings) {
  let singleChannel = {};
  if (!settings.search.seperate)
		singleChannel.type = "channels";
	let ignore = settings.channels.ignore;

  if (!ignore.name)
    singleChannel.name = innerData.title.simpleText;
  
  if (!ignore.verified) {
    singleChannel.verified = "false";
    if ("ownerBadges" in innerData) {
      let badges = innerData.ownerBadges;
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
    if ("videoCountText" in innerData && "simpleText" in innerData.videoCountText)
      singleChannel.subscribers = innerData.videoCountText.simpleText;
    else
      singleChannel.subscribers = "";
  }

  if (!ignore.shortDescription) {
    singleChannel.shortDescription = "";
    if ("descriptionSnippet" in innerData) {
      for (let run in innerData.descriptionSnippet.runs)
        singleChannel.shortDescription += innerData.descriptionSnippet.runs[run].text;
    }
  }

  if (!ignore.picture) {
    let thumbnails = innerData.thumbnail.thumbnails;
    singleChannel.picture = thumbnails[thumbnails.length - 1].url;
  }

  if (!ignore.handle) {
    let link = innerData.navigationEndpoint.browseEndpoint.canonicalBaseUrl;
    singleChannel.handle = (link[1] === "@") ? link : "";
  }

  if (!ignore.channelId)
    singleChannel.channelId = innerData.channelId;
  
  return singleChannel;
}

function retrievePlaylist(innerData, settings) {
  let singlePlaylist = {};
  if (!settings.search.seperate)
		singlePlaylist.type = "playlists";
	let ignore = settings.playlists.ignore;

  if (!ignore.id)
    singlePlaylist.id = innerData.playlistId;

  if (!ignore.title)
    singlePlaylist.title = innerData.title.simpleText;

  if (!ignore.size)
    singlePlaylist.size = innerData.videoCount;

  if (!ignore.shortVideos) {
    let videos = innerData.videos;
    singlePlaylist.shortVideos = [];
    for (let video in videos) {
      video = videos[video].childVideoRenderer;
      singlePlaylist.shortVideos.push(video.title.simpleText + " • " + video.lengthText.simpleText);
    }
  }

  if (!ignore.shortVideoIds) {
    let videos = innerData.videos;
    singlePlaylist.shortVideoIds = [];
    for (let video in videos) {
      video = videos[video].childVideoRenderer;
      singlePlaylist.shortVideoIds.push(video.videoId);
    }
  }

  if (!ignore.updated) {
    if ("publishedTimeText" in innerData)
      singlePlaylist.updated = innerData.publishedTimeText.simpleText;
    else
      singlePlaylist.updated = "";
  }

  if (!ignore.thumbnail) {
    let thumbnails = innerData.thumbnails[0].thumbnails;
    singlePlaylist.thumbnail = thumbnails[thumbnails.length - 1].url;
  }

  if (!ignore.uploader) {
    let runs = innerData.longBylineText.runs;
    singlePlaylist.uploader = "";
    for (let run in runs)
      singlePlaylist.uploader += runs[run].text;
  }

  if (!ignore.verified) {
    singlePlaylist.verified = "false";
    if ("ownerBadges" in innerData) {
      let badges = innerData.ownerBadges;
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
    for (run in innerData.longBylineText.runs) {
      if ("navigationEndpoint" in innerData.longBylineText.runs[run] && "browseEndpoint" in innerData.longBylineText.runs[run].navigationEndpoint) {
        let link = innerData.longBylineText.runs[run].navigationEndpoint.browseEndpoint.canonicalBaseUrl;
        if (link[1] === "@") singlePlaylist.handle = link;
        break;
      }
    }
  }

  if (!ignore.channelId) {
    singlePlaylist.channelId = "";
    for (run in innerData.longBylineText.runs) {
      if ("navigationEndpoint" in innerData.longBylineText.runs[run] && "browseEndpoint" in innerData.longBylineText.runs[run].navigationEndpoint) {
        singlePlaylist.channelId = innerData.longBylineText.runs[run].navigationEndpoint.browseEndpoint.browseId;
        break;
      }
    }
  }
  
  return singlePlaylist;
}

function retrieveMix(innerData, settings) {
  let singleMix = {};
  if (!settings.search.seperate)
    singleMix.type = "mixes";
  let ignore = settings.mixes.ignore;

  if (!ignore.id)
    singleMix.id = innerData.playlistId;

  if (!ignore.title)
    singleMix.title = innerData.title.simpleText;

  if (!ignore.shortVideos) {
    let videos = innerData.videos;
    singleMix.shortVideos = [];
    for (let video in videos) {
      video = videos[video].childVideoRenderer;
      singleMix.shortVideos.push(video.title.simpleText + " • " + video.lengthText.simpleText);
    }
  }

  if (!ignore.shortVideoIds) {
    let videos = innerData.videos;
    singleMix.shortVideoIds = [];
    for (let video in videos) {
      video = videos[video].childVideoRenderer;
      singleMix.shortVideoIds.push(video.videoId);
    }
  }

  if (!ignore.thumbnail) {
    let thumbnails = innerData.thumbnail.thumbnails;
    singleMix.thumbnail = thumbnails[thumbnails.length - 1].url;
  }

  if (!ignore.uploaders)
    singleMix.uploaders = innerData.longBylineText.simpleText;

  return singleMix;
}

function retrieveMovie(innerData, settings) {
  let singleMovie = {};
  if (!settings.search.seperate)
		singleMovie.type = "movies";
	let ignore = settings.movies.ignore;

  if (!ignore.id)
    singleMovie.id = innerData.videoId;

  if (!ignore.title) {
    singleMovie.title = "";
    for (run in innerData.title.runs)
      singleMovie.title += innerData.title.runs[run].text;
  }

  if (!ignore.shortDescription) {
    singleMovie.shortDescription = "";
    for (let run in innerData.descriptionSnippet.runs)
      singleMovie.shortDescription += innerData.descriptionSnippet.runs[run].text;
    for (let item in innerData.bottomMetadataItems)
      singleMovie.shortDescription += "\n" + innerData.bottomMetadataItems[item].simpleText;
  }

  if (!ignore.duration) {
    if ("lengthText" in innerData)
      singleMovie.duration = innerData.lengthText.simpleText;
    else
      singleMovie.duration = "";
  }

  if (!ignore.year) {
    singleMovie.year = "";
    if ("topMetadataItems" in innerData) {
      let splitInfo = helpers.safeSplit(innerData.topMetadataItems[0].simpleText, "• ", 1);
      if (splitInfo.length !== 1) //Year found
        singleMovie.year = splitInfo[1];
    }
  }
  
  if (!ignore.category) { //!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! FIND OUT IF THIS SOLUTION IS SAFE
    if ("topMetadataItems" in innerData)
      singleMovie.category = helpers.safeSplit(innerData.topMetadataItems[0].simpleText, " •", 1)[0];
    else
      singleMovie.category = "";
  }

  if (!ignore.contentHeaders) {
    singleMovie.contentHeaders = [];
    for (let badge in innerData.badges)
      singleMovie.contentHeaders.push(innerData.badges[badge].metadataBadgeRenderer.label);
  }

  if (!ignore.uploader) {
    let runs = innerData.longBylineText.runs;
    singleMovie.uploader = "";
    for (let run in runs)
      singleMovie.uploader += runs[run].text;
  }

  if (!ignore.verified) {
    singleMovie.verified = "false";
    if ("ownerBadges" in innerData) {
      let badges = innerData.ownerBadges;
      for (let badge in badges) {
        badge = badges[badge];
        if (badge.metadataBadgeRenderer.style === "BADGE_STYLE_TYPE_VERIFIED") {
          singleMovie.verified = "true";
          break;
        }
      }
    }
  }

  /*if (!ignore.handle) {
    singleMovie.handle = "";
    for (run in innerData.longBylineText.runs) {
      if ("navigationEndpoint" in innerData.longBylineText.runs[run] && "browseEndpoint" in innerData.longBylineText.runs[run].navigationEndpoint) {
        if ("canonicalBaseUrl" in innerData.longBylineText.runs[run].navigationEndpoint.browseEndpoint) {
          let link = innerData.longBylineText.runs[run].navigationEndpoint.browseEndpoint.canonicalBaseUrl;
          if (link[1] === "@") singleMovie.handle = link;
        }
        break;
      }
    }
  }*/

  if (!ignore.channelId) {
    singleMovie.channelId = "";
    for (run in innerData.longBylineText.runs) {
      if ("navigationEndpoint" in innerData.longBylineText.runs[run] && "browseEndpoint" in innerData.longBylineText.runs[run].navigationEndpoint) {
        singleMovie.channelId = innerData.longBylineText.runs[run].navigationEndpoint.browseEndpoint.browseId;
        break;
      }
    }
  }

  return singleMovie;
}


const numAttributeFunctions = {views: null,
                               duration: filterHelpers.durationToSec,
                               subscribers: filterHelpers.crunchSimpleViews,
                               size: filterHelpers.commaSeperatedToNumerical,
                               year: parseInt};

function resultMatches(singleResult, filter, type) {

  let returnMatch = true;

  for (f in filter) {

    let condition = filter[f];
    if (!(condition.check in numAttributeFunctions)) { //String check

      let resultCheck = singleResult[condition.check];
      if (typeof(resultCheck) === "string") resultCheck = [resultCheck];
      let conditionMatch = condition.match;

      for (let rC in resultCheck) { //Treat data as a list of items
        rC = resultCheck[rC];

        if ("casesensitive" in condition ? !condition.casesensitive : true) {
          rC = rC.toLowerCase();
          conditionMatch = conditionMatch.toLowerCase();
        }

        if (condition.compare === "eq") //Exact match needed
          returnMatch = rC === conditionMatch;
        else if (condition.compare === "in")
          returnMatch = rC.includes(conditionMatch);

        if (returnMatch) //If just one piece of the list matches, the entire list matches
          break;
      }
    }
    else {
      
      if (singleResult[condition.check] === "") continue;
      let resultCheck = null;
      if (condition.check === "views") //Check if the views were scraped from a video or short
        resultCheck = (type === "videos") ? filterHelpers.crunchViewCount(singleResult["views"]) : filterHelpers.crunchSimpleViews(singleResult["views"]);
      else
        resultCheck = numAttributeFunctions[condition.check](singleResult[condition.check]);

      switch (condition.compare) {
        case "less":
          returnMatch = resultCheck < parseInt(condition.match);
          break;
        case "greater":
          returnMatch = resultCheck > parseInt(condition.match);
          break;
        case "lesseq":
          returnMatch = resultCheck <= parseInt(condition.match);
          break;
        case "greatereq":
          returnMatch = resultCheck >= parseInt(condition.match);
          break;
        case "eq":
          returnMatch = resultCheck === parseInt(condition.match);
          break;
      }
    }

    if (!returnMatch)
      break;
  }

  return returnMatch;
}


function printResult(singleResult, type) {

  helpers.clearLastLine();
  console.log("-------------------------------------------------------------------");
  for (att in singleResult) {
    if (att === "id") {
      if (type === "playlists" || type === "mixes")
        console.log("link: https://www.youtube.com/playlist?list=" + singleResult[att]);
      else //(type === "videos" || type === "shorts" || type === "movies")
        console.log("link: https://www.youtube.com/watch?v=" + singleResult[att]);
    }
    else if (att === "channelId")
      console.log("channel: " + "https://www.youtube.com/channel/" + singleResult[att]);
    else if (att === "badges" || att === "shortVideos" || att === "shortVideoIds" || att === "contentHeaders") {
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


async function collectResults(settings, config, timeout, initialData) {

  global.sendvb(2, "\n");
  let saved = await scrapeResults(settings, config, timeout, initialData);
  global.sendvb(2, "Complete");

  let savedResults = saved.savedResults;
  let length = saved.length;

  if (length === 0)
    global.sendvb(2, "No results found.");

  return savedResults;
}


module.exports.scrape = collectResults;