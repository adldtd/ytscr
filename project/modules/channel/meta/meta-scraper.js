const {INFO, HEADER, PROG} = require("../../../common/verbosity_vars");


async function scrapeMeta(settings, config, timeout, innerData) {

  let savedMeta = {};
  innerData = innerData.header.c4TabbedHeaderRenderer;
  let ignore = settings.ignore;

  if (!ignore.name)
    savedMeta.name = innerData.title;

  if (!ignore.shortDescription)
    savedMeta.shortDescription = innerData.tagline.channelTaglineRenderer.content;

  if (!ignore.verified) {
    savedMeta.verified = "false";
    if ("badges" in innerData) {
      for (let badge in innerData.badges) {
        badge = innerData.badges[badge].metadataBadgeRenderer;
        if (badge.style === "BADGE_STYLE_TYPE_VERIFIED") {
          savedMeta.verified = true;
          break;
        }
      }
    }
  }

  if (!ignore.subscribers) {
    if ("subscriberCountText" in innerData)
      savedMeta.subscribers = innerData.subscriberCountText.simpleText;
    else
      savedMeta.subscribers = "";
  }

  if (!ignore.videos) {
    if ("videosCountText" in innerData)
      savedMeta.videos = innerData.videosCountText.runs[0].text;
    else
      savedMeta.videos = "0";
  }

  if (!ignore.firstLink) {
    savedMeta.firstLink = "";
    if ("headerLinks" in innerData)
      savedMeta.firstLink = innerData.headerLinks.channelHeaderLinksViewModel.firstLink.content;
  }

  // if (!ignore.headerLinkNames) {
  //   savedMeta.headerLinkNames = [];
  //   if ("headerLinks" in innerData) {
  //     let headerLinks = innerData.headerLinks.channelHeaderLinksRenderer;
  //     for (let header in headerLinks.primaryLinks)
  //       savedMeta.headerLinkNames.push(headerLinks.primaryLinks[header].title.simpleText);
  //     for (let header in headerLinks.secondaryLinks)
  //       savedMeta.headerLinkNames.push(headerLinks.secondaryLinks[header].title.simpleText);
  //   }
  // }

  // if (!ignore.headerLinks) {
  //   savedMeta.headerLinks = [];
  //   if ("headerLinks" in innerData) {
  //     let headerLinks = innerData.headerLinks.channelHeaderLinksRenderer;
  //     for (let header in headerLinks.primaryLinks) {
  //       let link = headerLinks.primaryLinks[header].navigationEndpoint.commandMetadata.webCommandMetadata.url;
  //       savedMeta.headerLinks.push(link);
  //     }
  //     for (let header in headerLinks.secondaryLinks) {
  //       let link = headerLinks.secondaryLinks[header].navigationEndpoint.commandMetadata.webCommandMetadata.url;
  //       savedMeta.headerLinks.push(link);
  //     }
  //   }
  // }

  // if (!ignore.headerLinkIcons) {
  //   savedMeta.headerLinkIcons = [];
  //   if ("headerLinks" in innerData) {
  //     let headerLinks = innerData.headerLinks.channelHeaderLinksRenderer;
  //     for (let header in headerLinks.primaryLinks) {
  //       let icons = headerLinks.primaryLinks[header].icon.thumbnails;
  //       savedMeta.headerLinkIcons.push(icons[icons.length - 1].url);
  //     }
  //     for (let header in headerLinks.secondaryLinks) {
  //       let icons = headerLinks.secondaryLinks[header].icon.thumbnails;
  //       savedMeta.headerLinkIcons.push(icons[icons.length - 1].url);
  //     }
  //   }
  // }

  if (!ignore.profilePicture) {
    let thumbnails = innerData.avatar.thumbnails;
    savedMeta.profilePicture = thumbnails[thumbnails.length - 1].url;
  }

  if (!ignore.banner) {
    if ("tvBanner" in innerData) { //Try to get the largest possible banner
      let thumbnails = innerData.tvBanner.thumbnails;
      savedMeta.banner = thumbnails[thumbnails.length - 1].url;
    } else if ("banner" in innerData) {
      let thumbnails = innerData.banner.thumbnails;
      savedMeta.banner = thumbnails[thumbnails.length - 1].url;
    } else
      savedMeta.banner = "";
  }

  if (!ignore.handle) {
    if ("channelHandleText" in innerData) {
      savedMeta.handle = "/";
      for (let run in innerData.channelHandleText.runs)
        savedMeta.handle += innerData.channelHandleText.runs[run].text;
    } else
      savedMeta.handle = "";
  }

  if (!ignore.channelId)
    savedMeta.channelId = innerData.channelId;

  return savedMeta;

}


async function collectMeta(settings, config, timeout, initialData) {

  global.sendvb(HEADER, "\n");
  let savedMeta = await scrapeMeta(settings, config, timeout, initialData);
  global.sendvb(HEADER, "Complete");

  return savedMeta;
}


module.exports.scrape = collectMeta;