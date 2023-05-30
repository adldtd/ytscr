const helpers = require("../../../common/helpers");
const filterHelpers = require("../../../common/filter_helpers");
const {getTabData} = require("../channel_helpers");
const {INFO, HEADER, PROG} = require("../../../common/verbosity_vars");


async function getSectionData(config, timeout, section) {

  config.data.browseId = section.endpoint.browseEndpoint.browseId;
  config.data.params = section.endpoint.browseEndpoint.params;
  delete config.data.continuation;
  let sectionData = await helpers.makeRequest(config, timeout, 1, INFO);
  if (sectionData == -1) return -1;
  sectionData = sectionData.data;

  delete config.data.browseId;
  delete config.data.params;

  return sectionData;
}


async function sortSectionData(config, timeout, sortSetting) {

  config.data.browseId = sortSetting.navigationEndpoint.browseEndpoint.browseId;
  config.data.params = sortSetting.navigationEndpoint.browseEndpoint.params;
  delete config.data.continuation;
  let sortData = await helpers.makeRequest(config, timeout, 1, INFO);
  if (sortData == -1) return -1;
  sortData = sortData.data;

  delete config.data.browseId;
  delete config.data.params;

  return sortData;
}


async function scrapePlaylists(settings, config, timeout, innerData) {

  let savedPlaylists = (settings.combine) ? [] : {};
  let counters = {counter: 0, matchCounter: 0};

  //Header information for special cases
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
  channelInfo.handle = "/";
  for (let run in header.channelHandleText.runs)
    channelInfo.handle += header.channelHandleText.runs[run].text;
  channelInfo.channelId = header.channelId;

  settings.__channelInfo = channelInfo;

  //Retrieve desired tab
  let sections = null;
  let tabs = innerData.contents.twoColumnBrowseResultsRenderer.tabs;
  let playlistsTab = null;

  for (let tab in tabs) {
    tab = tabs[tab].tabRenderer;
    if (tab.selected) {
      playlistsTab = tab;
      sections = tab.content.sectionListRenderer.subMenu.channelSubMenuRenderer.contentTypeSubMenuItems;
      break;
    }
  }
  if (sections === null) return savedPlaylists;

  let organizedSections = {}; //Place each element of sections into a dictionary, with its title as its key
  for (let section in sections) {
    section = sections[section];
    organizedSections[section.title] = section;
  }
  sections = organizedSections;

  let sectionUnion = {};
  //0: Section in settings, but no section found
  //1: Section found, but no section in settings
  //2: Section in settings; section found
  for (let section in settings.section)
    sectionUnion[section] = 0;
  for (let section in sections) {
    if (section === "All playlists") continue;
    if (section in sectionUnion) sectionUnion[section] = 2;
    else sectionUnion[section] = 1;
  }


  for (let section in sectionUnion) {
    let code = sectionUnion[section];

    let sectionSettings = null;
    if (code === 0) {
      sectionSettings = settings.section[section];
      if (!(sectionSettings.focussection === false || (sectionSettings.focussection === null && settings.focusmode))) {
        global.sendvb(INFO, "Error: Playlist section \"" + section + "\" could not be found. Continuing scraping.\n\n");
        if (!settings.combine) savedPlaylists[section] = [];
      }
      continue;
    }
    if (code === 1) {
      if (settings.focusmode) continue; //In "focus mode," any sections not specifically focused are ignored
      sectionSettings = {
        limsection: settings.limsectionall,
        lastvideo: settings.lastvideoall
      };
    } else { //(code === 2)
      sectionSettings = settings.section[section];
      if (sectionSettings.focussection === false || (sectionSettings.focussection === null && settings.focusmode))
        continue; //Section excluded or not focused
    }
    if (!settings.combine) savedPlaylists[section] = [];

    if (counters.counter >= settings.lim || counters.matchCounter >= settings.limfilter)
      continue;


    //Scrape specific section
    let sectionName = section;
    section = sections[section];

    //If limsection and lastvideo are not specified, but the "all" versions are, change them
    if (code !== 1) {
      if (sectionSettings.limsection === Number.POSITIVE_INFINITY && settings.limsectionall !== Number.POSITIVE_INFINTY)
        sectionSettings.limsection = settings.limsectionall;
      if (!sectionSettings.lastvideo && settings.lastvideoall)
        sectionSettings.lastvideo = settings.lastvideoall;
    }

    let sectionData = null;
    if (!section.selected) { //Request required
      sectionData = await getSectionData(config, timeout, section);
      if (sectionData === -1) continue;

      let innerSectionData = null;
      let sectionTabs = sectionData.contents.twoColumnBrowseResultsRenderer.tabs;
      for (let tab in sectionTabs) {
        tab = sectionTabs[tab].tabRenderer;
        if (tab.selected) { //Does not work with "All playlists", which should have been filtered
          innerSectionData = tab;
          break;
        }
      }
      if (innerSectionData === null) continue;
      sectionData = innerSectionData;

    } else
      sectionData = playlistsTab;

    
    if (sectionSettings !== null && sectionSettings.lastvideo) { //Sort by last video added
      let sortedSectionData = null;
      let sortSetting = sectionData.content.sectionListRenderer.subMenu.channelSubMenuRenderer;
      if ("sortSetting" in sortSetting) {
        sortSetting = sortSetting.sortSetting.sortFilterSubMenuRenderer.subMenuItems;

        for (let item in sortSetting) {
          item = sortSetting[item];
          if (item.title === "Last video added") {
            sortedSectionData = await sortSectionData(config, timeout, item);
            break;
          }
        }
      }

      if (sortedSectionData === null)
        global.sendvb(INFO, "Error: Section \"" + sectionName + "\" could not be sorted by last video added. Continuing scraping.\n\n");
      else {
        if (sortedSectionData === -1) continue;

        let sortedTab = null;
        let tabs = sortedSectionData.contents.twoColumnBrowseResultsRenderer.tabs;
        for (let tab in tabs) {
          tab = tabs[tab].tabRenderer;
          if (tab.selected) {
            sortedTab = tab;
            break;
          }
        }
        if (sortedTab === null) continue;

        sectionData = sortedTab;
      }
    }


    sectionData = sectionData.content.sectionListRenderer.contents;
    sectionData = sectionData[0].itemSectionRenderer.contents;
    sectionData = sectionData[0].gridRenderer.items;

    let sectionSavedPlaylists = await scrapeSection(settings, config, timeout, sectionData, sectionSettings, counters, sectionName);
    if (settings.combine)
      savedPlaylists = savedPlaylists.concat(sectionSavedPlaylists);
    else
      savedPlaylists[sectionName] = sectionSavedPlaylists;
  }

  return savedPlaylists;

}


async function scrapeSection(settings, config, timeout, innerData, sectionSettings, counters, sectionName) {

  let savedSection = [];
  let limsection = sectionSettings.limsection;
  let sectionCounter = 0;

  let hasContinuation = true;
  do {
    hasContinuation = false;
    let contents = innerData; //The first instance of innerData passed will always be a list of playlists

    for (let item in contents) {
      item = contents[item];

      if ("continuationItemRenderer" in item) {
        config.data.continuation = item.continuationItemRenderer.continuationEndpoint.continuationCommand.token;
        hasContinuation = true;
        continue;
      }

      let innerPlaylist = null;
      if ("gridPlaylistRenderer" in item)
        innerPlaylist = item.gridPlaylistRenderer;
      else
        continue;

      let singlePlaylist = retrievePlaylist(innerPlaylist, settings, (settings.combine) ? sectionName : null);
      let match = playlistMatches(singlePlaylist, settings.filter);
      if (match) ++(counters.matchCounter);

      if (!settings.savefilter || match)
        savedSection.push(singlePlaylist);
      if (settings.printfilter && match)
        printPlaylist(singlePlaylist);

      ++(counters.counter);
      ++sectionCounter;

      if (sectionCounter >= limsection || counters.counter >= settings.lim || counters.matchCounter >= settings.limfilter) {
        hasContinuation = false;
        break;
      }
    }

    if (global.verbose >= PROG) helpers.clearLastLine();
    global.sendvb(PROG, "Playlists scraped: " + counters.counter);

    if (hasContinuation) {
      innerData = await helpers.makeRequest(config, timeout, 1, INFO);
      if (innerData === -1) break;
      innerData = innerData.data;

      contents = null;
      let actions = innerData.onResponseReceivedActions;
      for (let action in actions) {
        action = actions[action];
        if ("appendContinuationItemsAction" in action) {
          contents = action.appendContinuationItemsAction.continuationItems;
          break;
        }
      }
      if (contents === null) return savedSection;
      innerData = contents;
    }

  } while (hasContinuation);

  return savedSection;

}


function retrievePlaylist(innerPlaylist, settings, sectionName) {
  let singlePlaylist = {};
  let ignore = settings.ignore;

  if (sectionName !== null)
    singlePlaylist.section = sectionName;

  if (!ignore.id)
    singlePlaylist.id = innerPlaylist.playlistId;

  if (!ignore.title) {
    singlePlaylist.title = "";
    for (let run in innerPlaylist.title.runs)
      singlePlaylist.title += innerPlaylist.title.runs[run].text;
  }

  if (!ignore.size)
    singlePlaylist.size = innerPlaylist.videoCountShortText.simpleText; //*******CHECK IF THIS TRUNCATES NUMBERS IN THE THOUSANDS
  
  if (!ignore.updated) {
    singlePlaylist.updated = "";
    if ("publishedTimeText" in innerPlaylist)
      singlePlaylist.updated = innerPlaylist.publishedTimeText.simpleText;
  }

  if (!ignore.thumbnail) {
    let thumbnails = innerPlaylist.thumbnail.thumbnails;
    singlePlaylist.thumbnail = thumbnails[thumbnails.length - 1].url;
  }

  if ("longBylineText" in innerPlaylist) {

    if (!ignore.uploader) {
      singlePlaylist.uploader = "";
      for (let run in innerPlaylist.longBylineText.runs) {
        run = innerPlaylist.longBylineText.runs[run];
        if ("navigationEndpoint" in run) {
          singlePlaylist.uploader = run.text;
          break;
        }
      }
    }

    if (!ignore.verified) {
      singlePlaylist.verified = "false";
      if ("ownerBadges" in innerPlaylist) {
        for (let badge in innerPlaylist.ownerBadges) {
          badge = innerPlaylist.ownerBadges[badge].metadataBadgeRenderer;
          if (badge.style === "BADGE_STYLE_TYPE_VERIFIED") {
            singlePlaylist.verified = "true";
            break;
          }
        }
      }
    }

    if (!ignore.handle) {
      singlePlaylist.handle = "";
      for (let run in innerPlaylist.longBylineText.runs) {
        run = innerPlaylist.longBylineText.runs[run];
        if ("navigationEndpoint" in run) {
          let handle = run.navigationEndpoint.browseEndpoint.canonicalBaseUrl;
          if (handle[1] === "@") singlePlaylist.handle = handle;
          break;
        }
      }
    }

    if (!ignore.channelId) {
      singlePlaylist.channelId = "";
      for (let run in innerPlaylist.longBylineText.runs) {
        run = innerPlaylist.longBylineText.runs[run];
        if ("navigationEndpoint" in run) {
          singlePlaylist.channelId = run.navigationEndpoint.browseEndpoint.browseId;
          break;
        }
      }
    }

  } else {
    let channelInfo = settings.__channelInfo;

    if (!ignore.uploader)
      singlePlaylist.uploader = channelInfo.uploader;

    if (!ignore.verified)
      singlePlaylist.verified = channelInfo.verified;
    
    if (!ignore.handle)
      singlePlaylist.handle = channelInfo.handle;

    if (!ignore.channelId)
      singlePlaylist.channelId = channelInfo.channelId;
  }
  
  return singlePlaylist;
}


function playlistMatches(singlePlaylist, filter) {

  let returnMatch = true;

  for (let s in filter) {

    let condition = filter[s];
    if (condition.check !== "size") { //String checker

      let playlistCheck = singlePlaylist[condition.check];
      let conditionMatch = condition.match;
      if ("casesensitive" in condition ? !condition.casesensitive : true) {
        playlistCheck = playlistCheck.toLowerCase();
        conditionMatch = conditionMatch.toLowerCase();
      }

      if (condition.compare === "eq") //Exact match needed
        returnMatch = playlistCheck === conditionMatch;
      else if (condition.compare === "in")
        returnMatch = playlistCheck.includes(conditionMatch);

    } else { //Num checker

      let playlistCheck = filterHelpers.commaSeperatedToNumerical(singlePlaylist[condition.check]);
      switch (condition.compare) {
        case "less":
          returnMatch = playlistCheck < parseInt(condition.match);
          break;
        case "greater":
          returnMatch = playlistCheck > parseInt(condition.match);
          break;
        case "lesseq":
          returnMatch = playlistCheck <= parseInt(condition.match);
          break;
        case "greatereq":
          returnMatch = playlistCheck >= parseInt(condition.match);
          break;
        case "eq":
          returnMatch = playlistCheck === parseInt(condition.match);
          break;
      }
    }

    if (!returnMatch) break;
  }

  return returnMatch;
}


function printPlaylist(singlePlaylist) {

  helpers.clearLastLine();
  console.log("-------------------------------------------------------------------");
  for (att in singlePlaylist) {
    if (att === "id")
      console.log("link: https://www.youtube.com/playlist?list=" + singlePlaylist[att]);
    else if (att === "channelId")
      console.log("channel: https://www.youtube.com/channel/" + singlePlaylist[att]);
    else
      console.log(att + ": " + singlePlaylist[att]);
  }
  console.log("-------------------------------------------------------------------\n\n");
}


async function collectPlaylists(settings, config, timeout, initialData) {
  
  global.sendvb(HEADER, "\n");
  let tabData = await getTabData(config, timeout, initialData, "Playlists");
  if (tabData === -1) {
    global.sendvb(HEADER, "No playlists found.");
    return (settings.combine) ? [] : {}
  }

  let savedPlaylists = await scrapePlaylists(settings, config, timeout, tabData);
  global.sendvb(HEADER, "Complete");

  let amount = 0;
  if (!settings.combine) {
    for (let section in savedPlaylists)
      amount += savedPlaylists[section].length;
  } else
    amount = savedPlaylists.length;

  if (amount === 0)
    global.sendvb(HEADER, "No playlists found.");

  return savedPlaylists;
}


module.exports.scrape = collectPlaylists;