const helpers = require("../../../common/helpers");
const {INFO, HEADER, PROG} = require("../../../common/verbosity_vars");


async function getAboutData(config, timeout, innerData) {

  innerData = innerData.header.c4TabbedHeaderRenderer;
  if (!("tagline" in innerData))
    return -1;

  innerData = innerData.tagline.channelTaglineRenderer.moreEndpoint.showEngagementPanelEndpoint;
  innerData = innerData.engagementPanel.engagementPanelSectionListRenderer.content.sectionListRenderer.contents;

  innerData = innerData.find((item) => "itemSectionRenderer" in item);
  if (innerData === undefined) return -1;

  innerData = innerData.itemSectionRenderer.contents;

  innerData = innerData.find((item) => "continuationItemRenderer" in item);
  if (innerData === undefined) return -1;

  config.data.continuation = innerData.continuationItemRenderer.continuationEndpoint.continuationCommand.token;
  let aboutData = await helpers.makeRequest(config, timeout, 1, INFO);
  if (aboutData === -1) return -1;

  return aboutData.data;
}


function scrapeAbout(settings, config, timeout, innerData) {

  let savedAbout = {};

  innerData = innerData.onResponseReceivedEndpoints;
  innerData = innerData.find((item) => "appendContinuationItemsAction" in item);
  if (innerData === undefined) {
    global.sendvb(INFO, "Error: About section not found.");
    return -1;
  }

  innerData = innerData.appendContinuationItemsAction.continuationItems;
  innerData = innerData.find((item) => "aboutChannelRenderer" in item);
  if (innerData === undefined) {
    global.sendvb(INFO, "Error: About section not found.");
    return -1;
  }

  innerData = innerData.aboutChannelRenderer.metadata.aboutChannelViewModel;


  let ignore = settings.ignore;

  if (!ignore.description) {
    if ("description" in innerData)
      savedAbout.description = innerData.description;
    else
      savedAbout.description = "";
  }

  if (!ignore.joined) {
    if ("joinedDateText" in innerData)
      savedAbout.joined = innerData.joinedDateText.content;
    else
      savedAbout.joined = "";
  }

  if (!ignore.views) {
    if ("viewCountText" in innerData)
      savedAbout.views = innerData.viewCountText;
    else
      savedAbout.views = "";
  }

  if (!ignore.location) {
    if ("country" in innerData)
      savedAbout.location = innerData.country;
    else
      savedAbout.location = "";
  }

  if (!ignore.linkNames) {
    savedAbout.linkNames = [];
    if ("links" in innerData) {
      for (let link of innerData.links)
        savedAbout.linkNames.push(link.channelExternalLinkViewModel.title.content);
    }
  }

  if (!ignore.links) {
    savedAbout.links = [];
    if ("links" in innerData) {
      for (let link of innerData.links)
        savedAbout.links.push(link.channelExternalLinkViewModel.link.content);
    }
  }

  return savedAbout;

}


async function collectAbout(settings, config, timeout, initialData) {

  global.sendvb(HEADER, "\n");
  let aboutData = await getAboutData(config, timeout, initialData);
  if (aboutData === -1) {
    global.sendvb(HEADER, "No about section found.");
    return {};
  }

  let savedAbout = scrapeAbout(settings, config, timeout, aboutData);
  global.sendvb(HEADER, "Complete");

  return savedAbout;
}


module.exports.scrape = collectAbout;