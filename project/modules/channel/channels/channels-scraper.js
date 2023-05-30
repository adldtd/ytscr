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


async function scrapeChannels(settings, config, timeout, innerData) {

  let savedChannels = (settings.combine) ? [] : {};
  let counters = {counter: 0, matchCounter: 0};

  let sections = null;
  let tabs = innerData.contents.twoColumnBrowseResultsRenderer.tabs;
  let channelsTab = null;

  for (let tab in tabs) {
    tab = tabs[tab].tabRenderer;
    if (tab.selected) {
      channelsTab = tab;
      sections = tab.content.sectionListRenderer.subMenu.channelSubMenuRenderer.contentTypeSubMenuItems;
      break;
    }
  }
  if (sections === null) return savedChannels;

  let organizedSections = {};
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
    if (section === "All channels") continue;
    if (section in sectionUnion) sectionUnion[section] = 2;
    else sectionUnion[section] = 1;
  }


  for (let section in sectionUnion) {
    let code = sectionUnion[section];

    let sectionSettings = null;
    if (code === 0) {
      sectionSettings = settings.section[section];
      if (!(sectionSettings.focussection === false || (sectionSettings.focussection === null && settings.focusmode))) {
        global.sendvb(INFO, "Error: Channel section \"" + section + "\" could not be found. Continuing scraping.\n\n");
        if (!settings.combine) savedChannels[section] = [];
      }
      continue;
    }
    if (code === 1) {
      if (settings.focusmode) continue; //In "focus mode," any sections not specifically focused are ignored
      sectionSettings = {
        limsection: settings.limsectionall
      };
    } else { //(code === 2)
      sectionSettings = settings.section[section];
      if (sectionSettings.focussection === false || (sectionSettings.focussection === null && settings.focusmode))
        continue; //Section excluded or not focused
    }
    if (!settings.combine) savedChannels[section] = [];

    if (counters.counter >= settings.lim || counters.matchCounter >= settings.limfilter)
      continue;


    //Scrape specific section
    let sectionName = section;
    section = sections[section];

    if (code !== 1) {
      if (sectionSettings.limsection === Number.POSITIVE_INFINITY && settings.limsectionall !== Number.POSITIVE_INFINTY)
        sectionSettings.limsection = settings.limsectionall;
    }

    let sectionData = null;
    if (!section.selected) { //Request required
      sectionData = await getSectionData(config, timeout, section);
      if (sectionData === -1) continue;

      let innerSectionData = null;
      let sectionTabs = sectionData.contents.twoColumnBrowseResultsRenderer.tabs;
      for (let tab in sectionTabs) {
        tab = sectionTabs[tab].tabRenderer;
        if (tab.selected) {
          innerSectionData = tab;
          break;
        }
      }
      if (innerSectionData === null) continue;
      sectionData = innerSectionData;

    } else
      sectionData = channelsTab;

    
    sectionData = sectionData.content.sectionListRenderer.contents;
    sectionData = sectionData[0].itemSectionRenderer.contents;
    sectionData = sectionData[0].gridRenderer.items;

    let sectionSavedChannels = await scrapeSection(settings, config, timeout, sectionData, sectionSettings, counters, (settings.combine) ? sectionName : null);
    if (settings.combine)
      savedChannels = savedChannels.concat(sectionSavedChannels);
    else
      savedChannels[sectionName] = sectionSavedChannels;
  }

  return savedChannels;

}


async function scrapeSection(settings, config, timeout, innerData, sectionSettings, counters, sectionName) {

  let savedSection = [];
  let limsection = sectionSettings.limsection;
  let sectionCounter = 0;

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

      let innerChannel = null;
      if ("gridChannelRenderer" in item)
        innerChannel = item.gridChannelRenderer;
      else
        continue;

      let singleChannel = retrieveChannel(innerChannel, settings.ignore, sectionName);
      let match = channelMatches(singleChannel, settings.filter);
      if (match) ++(counters.matchCounter);

      if (!settings.savefilter || match)
        savedSection.push(singleChannel);
      if (settings.printfilter && match)
        printChannel(singleChannel);

      ++(counters.counter);
      ++sectionCounter;

      if (sectionCounter >= limsection || counters.counter >= settings.lim || counters.matchCounter >= settings.limfilter) {
        hasContinuation = false;
        break;
      }
    }

    if (global.verbose >= PROG) helpers.clearLastLine();
    global.sendvb(PROG, "Channels scraped: " + counters.counter);

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
      if (contents === null) break;
      innerData = contents;
    }
  }

  return savedSection;

}


function retrieveChannel(innerChannel, ignore, sectionName) {
  let singleChannel = {};
  if (sectionName !== null) singleChannel.section = sectionName;

  if (!ignore.name)
    singleChannel.name = innerChannel.title.simpleText;

  if (!ignore.subscribers) {
    if ("subscriberCountText" in innerChannel)
      singleChannel.subscribers = innerChannel.subscriberCountText.simpleText;
    else
      singleChannel.subscribers = "";
  }

  if (!ignore.videos) {
    if ("videoCountText" in innerChannel)
      singleChannel.videos = innerChannel.videoCountText.runs[0].text;
    else
      singleChannel.videos = "0";
  }

  if (!ignore.profilePicture) {
    let thumbnails = innerChannel.thumbnail.thumbnails;
    singleChannel.profilePicture = thumbnails[thumbnails.length - 1].url;
  }

  if (!ignore.verified) {
    singleChannel.verified = "false";
    if ("ownerBadges" in innerChannel) {
      for (let badge in innerChannel.ownerBadges) {
        badge = innerChannel.ownerBadges[badge].metadataBadgeRenderer;
        if (badge.style === "BADGE_STYLE_TYPE_VERIFIED") {
          singleChannel.verified = "true";
          break;
        }
      }
    }
  }

  if (!ignore.handle) {
    let link = innerChannel.navigationEndpoint.browseEndpoint.canonicalBaseUrl;
    if (link[1] === "@")
      singleChannel.handle = link;
    else
      singleChannel.handle = "";
  }

  if (!ignore.channelId)
    singleChannel.channelId = innerChannel.channelId;

  return singleChannel;
}


function channelMatches(singleChannel, filter) {

  let returnMatch = true;

  for (let s in filter) {

    let condition = filter[s];
    if (condition.check !== "subscribers" && condition.check !== "videos") { //String checker

      let channelCheck = singleChannel[condition.check];
      let conditionMatch = condition.match;
      if ("casesensitive" in condition ? !condition.casesensitive : true) {
        channelCheck = channelCheck.toLowerCase();
        conditionMatch = conditionMatch.toLowerCase();
      }

      if (condition.compare === "eq") //Exact match needed
        returnMatch = channelCheck === conditionMatch;
      else if (condition.compare === "in")
        returnMatch = channelCheck.includes(conditionMatch);

    } else { //Num checker

      if (singleStore[condition.check] === "") continue; //NULL; matches instantly
      let channelCheck = null;
      if (condition.check === "subscribers")
        channelCheck = filterHelpers.crunchSimpleViews(singleChannel[condition.check]);
      else //(condition.check === "videos")
        channelCheck = filterHelpers.commaSeperatedToNumerical(singleChannel[condition.check]);

      switch (condition.compare) {
        case "less":
          returnMatch = channelCheck < parseInt(condition.match);
          break;
        case "greater":
          returnMatch = channelCheck > parseInt(condition.match);
          break;
        case "lesseq":
          returnMatch = channelCheck <= parseInt(condition.match);
          break;
        case "greatereq":
          returnMatch = channelCheck >= parseInt(condition.match);
          break;
        case "eq":
          returnMatch = channelCheck === parseInt(condition.match);
          break;
      }
    }

    if (!returnMatch) break;
  }

  return returnMatch;
}


function printChannel(singleChannel) {

  helpers.clearLastLine();
  console.log("-------------------------------------------------------------------");
  for (att in singleChannel) {
    if (att === "channelId")
      console.log("link: https://www.youtube.com/channel/" + singleChannel[att]);
    else
      console.log(att + ": " + singleChannel[att]);
  }
  console.log("-------------------------------------------------------------------\n\n");
}


async function collectChannels(settings, config, timeout, initialData) {
  
  global.sendvb(HEADER, "\n");
  let tabData = await getTabData(config, timeout, initialData, "Channels");
  if (tabData === -1) {
    global.sendvb(HEADER, "No channels found.");
    return (settings.combine) ? [] : {}
  }

  let savedChannels = await scrapeChannels(settings, config, timeout, tabData);
  global.sendvb(HEADER, "Complete");

  let amount = 0;
  if (!settings.combine) {
    for (let section in savedChannels)
      amount += savedChannels[section].length;
  } else
    amount = savedChannels.length;

  if (amount === 0)
    global.sendvb(HEADER, "No channels found.");

  return savedChannels;
}


module.exports.scrape = collectChannels;