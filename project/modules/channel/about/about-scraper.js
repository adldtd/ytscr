const helpers = require("../../../common/helpers");
const filterHelpers = require("../../../common/filter_helpers");
const {getTabData} = require("../channel_helpers");
const {INFO, HEADER, PROG} = require("../../../common/verbosity_vars");


function scrapeAbout(settings, config, timeout, innerData) {

  let savedAbout = {};

  let tabs = innerData.contents.twoColumnBrowseResultsRenderer.tabs;
  innerData = null;
  for (let tab in tabs) {
    tab = tabs[tab].tabRenderer;
    if (tab.selected) {
      innerData = tab.content.sectionListRenderer.contents;
      innerData = innerData[0].itemSectionRenderer.contents;
      innerData = innerData[0].channelAboutFullMetadataRenderer;
      break;
    }
  }
  if (innerData === null) return savedAbout;


  let ignore = settings.ignore;

  if (!ignore.description) {
    if ("description" in innerData)
      savedAbout.description = innerData.description.simpleText;
    else
      savedAbout.description = "";
  }

  if (!ignore.joined) {
    savedAbout.joined = "";
    if ("joinedDateText" in innerData) {
      for (let run in innerData.joinedDateText.runs)
        savedAbout.joined += innerData.joinedDateText.runs[run].text;
    }
  }

  if (!ignore.views) {
    if ("viewCountText" in innerData)
      savedAbout.views = innerData.viewCountText.simpleText;
    else
      savedAbout.views = "";
  }

  if (!ignore.location) {
    if ("country" in innerData)
      savedAbout.location = innerData.country.simpleText;
    else
      savedAbout.location = "";
  }

  if (!ignore.linkNames) {
    savedAbout.linkNames = [];
    if ("primaryLinks" in innerData) {
      for (let link in innerData.primaryLinks)
        savedAbout.linkNames.push(innerData.primaryLinks[link].title.simpleText);
    }
  }

  if (!ignore.links) {
    savedAbout.links = [];
    if ("primaryLinks" in innerData) {
      for (let link in innerData.primaryLinks) {
        let url = innerData.primaryLinks[link].navigationEndpoint.urlEndpoint.url;
        savedAbout.links.push(url);
      }
    }
  }

  return savedAbout;

}


async function collectAbout(settings, config, timeout, initialData) {

  global.sendvb(HEADER, "\n");
  let tabData = await getTabData(config, timeout, initialData, "About");
  if (tabData === -1) {
    global.sendvb(HEADER, "No about section found.");
    return {};
  }

  let savedAbout = scrapeAbout(settings, config, timeout, tabData);
  global.sendvb(HEADER, "Complete");

  return savedAbout;
}


module.exports.scrape = collectAbout;