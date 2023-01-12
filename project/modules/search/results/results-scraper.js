const helpers = require("../../../common/helpers");
const filterHelpers = require("../../../common/filter_helpers");


const modules = ["videos", "shorts", "channels", "playlists", "movies"];


async function scrapeResults(settings, config, timeout, searchData) {

	let initialData = true;
	let collectedResults = null;
	if (settings.search.seperate) {
		collectedResults = {};
		for (module in modules) {
      module = modules[module];
			if (settings.search.focus[module])
				collectedResults[module] = [];
		}
	} else
		collectedResults = [];

	let continuation_id = "";
	let hasContinuation = true;

  let counter = 0;
  let typeCounter = {videos: 0, shorts: 0, channels: 0, playlists: 0, movies: 0};
  let matchCounter = 0;
  let typeMatchCounter = {videos: 0, shorts: 0, channels: 0, playlists: 0, movies: 0};
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
        if (items.index >= items.list.length)
          stack.pop();

				let singleResult = null;
        let match = true;
        let type = "";

				if ("videoRenderer" in result) {
          type = "videos";
					singleResult = retrieveVideo(result.videoRenderer, settings);

				} else if ("shelfRenderer" in result) {
          let newItems = result.shelfRenderer.content.verticalListRenderer.items;
          stack.push({list: newItems, index: 0}); //We have recieved a new pack of items to go through on the stack
          continue;

        } else if ("reelItemRenderer" in result) {
          type = "shorts";
          singleResult = retrieveShort(result.reelItemRenderer, settings);

				} else if ("reelShelfRenderer" in result) {
          let newItems = result.reelShelfRenderer.items;
          stack.push({list: newItems, index: 0});
          continue;

				} else if ("channelRenderer" in result) {
          type = "channels";
					singleResult = retrieveChannel(result.channelRenderer, settings);

				} else if ("playlistRenderer" in result) {
          type = "playlists";
					singleResult = retrievePlaylist(result.playlistRenderer, settings);

				} else if ("movieRenderer" in result) {
          type = "movies";
					singleResult = retrieveMovie(result.movieRenderer, settings);

				} else
          continue;

        match = resultMatches(singleResult, settings[type].filter, type);
        
        if (match) {
          if (settings[type].printfilter)
            printResult(singleResult, type);
          matchCounter++;
        }

        if (!settings[type].savefilter || match) {
          if (settings.search.seperate)
            collectedResults[type].push(singleResult);
          else
            collectedResults.push(singleResult);
        }

        if (typeMatchCounter[type] >= settings[type].limfilter) {
          finished = true;
          break;
        }

        counter++;

        if (counter >= settings.search.lim || typeCounter[type] >= settings[type].lim) {
          finished = true;
          break;
        }
        
			}
      if (finished) break;

		}

    if (global.verbose >= 3) helpers.clearLastLine();
    global.sendvb(3, "Search results scraped: " + counter);

    if (finished) break;

    if (hasContinuation) {
      searchData = await helpers.makeRequest(config, timeout, 1, 1);
      if (searchData === -1) break;
      searchData = searchData.data;
    }

	}

  return collectedResults;

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

  if (!ignore.views) {
    singleVideo.views = "";
    if ("viewCountText" in innerData)
      singleVideo.views = innerData.viewCountText.simpleText;
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

  if (!ignore.channelId) //!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! FIND OUT IF THIS SOLUTION IS SAFE
    singleVideo.channelId = innerData.ownerText.runs[0].navigationEndpoint.browseEndpoint.browseId;

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
    let badges = innerData.ownerBadges;
    singleChannel.verified = "false";
    for (let badge in badges) {
      badge = badges[badge];
      if (badge.metadataBadgeRenderer.style === "BADGE_STYLE_TYPE_VERIFIED") {
        singleChannel.verified = "true";
        break;
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
    for (let video in videos)
      singlePlaylist.shortVideos.push(videos[video].childVideoRenderer.title.simpleText);
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

  if (!ignore.channelId) //!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! FIND OUT IF THIS SOLUTION IS SAFE
    singlePlaylist.channelId = innerData.longBylineText.runs[0].navigationEndpoint.browseEndpoint.browseId;
  
  return singlePlaylist;
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

  if (!ignore.duration)
    singleMovie.duration = innerData.lengthText.simpleText;

  if (!ignore.year) {
    let splitInfo = helpers.safeSplit(innerData.topMetadataItems[0].simpleText, "• ", 1);
    singleMovie.year = "";
    if (splitInfo.length !== 1) //Year found
      singleMovie.year = splitInfo[1];
  }
  
  if (!ignore.category) //!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! FIND OUT IF THIS SOLUTION IS SAFE
    singleMovie.category = helpers.safeSplit(innerData.topMetadataItems[0].simpleText, " •", 1)[0];

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

  if (!ignore.channelId) //!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! FIND OUT IF THIS SOLUTION IS SAFE
    singleMovie.channelId = innerData.longBylineText.runs[0].navigationEndpoint.browseEndpoint.browseId;

  return singleMovie;
}


const numAttributeFunctions = {views: null,
                               duration: filterHelpers.durationToSec,
                               subscribers: filterHelpers.crunchSimpleViews,
                               size: parseInt,
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
      
      let resultCheck = null;
      if (condition.check === "views") { //Check if the views were scraped from a video or short
        if (singleResult["views"] !== "")
          resultCheck = (type === "video") ? filterHelpers.crunchViewCount(singleResult["views"]) : filterHelpers.crunchSimpleViews(singleResult["views"]);
        else
          resultCheck = 0;
      } else
        resultCheck = (singleResult[condition.check] !== "") ? numAttributeFunctions[condition.check](singleResult[condition.check]) : 0;
      
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

  clearLastLine();
  console.log("-------------------------------------------------------------------");
  for (att in singleResult) {
    if (att === "id") {
      if (type === "video")
        console.log("link: https://www.youtube.com/watch?v=" + singleResult[att]);
      else //Playlist
        console.log("link: https://www.youtube.com/playlist?list=" + singleResult[att])
    }
    else if (att === "channelId")
      console.log("channel: " + "https://youtube.com/channel/" + singleResult[att]);
    else
      console.log(att + ": " + singleResult[att]);
  }
  console.log("-------------------------------------------------------------------\n\n");
}


async function collectResults(settings, config, timeout, initialData) {

  global.sendvb(2, "\n");
  let savedResults = await scrapeResults(settings, config, timeout, initialData);
  global.sendvb(2, "Complete");

  if (savedResults.length === 0)
    global.sendvb(2, "No results found.");

  return savedResults;
}


module.exports.scrape = collectResults;