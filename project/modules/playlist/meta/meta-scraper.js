const {INFO, HEADER, PROG} = require("../../../common/verbosity_vars");


function scrapeMeta(initialData, ignore) {
  let savedMeta = {};
  let innerData = initialData.header.playlistHeaderRenderer;

  if (!ignore.id)
    savedMeta.id = innerData.playlistId;

  if (!ignore.title)
    savedMeta.title = innerData.title.simpleText;

  if (!ignore.description) {
    if ("descriptionText" in innerData && "simpleText" in innerData.descriptionText)
      savedMeta.description = innerData.descriptionText.simpleText;
    else
      savedMeta.description = "";
  }

  if (!ignore.size)
    savedMeta.size = innerData.numVideosText.runs[0].text;

  if (!ignore.views)
    savedMeta.views = innerData.viewCountText.simpleText;

  if (!ignore.updated) {
    savedMeta.updated = "";
    let renderers = innerData.byline;
    for (let renderer in renderers) {
      renderer = renderers[renderer];
      if (!("playlistBylineRenderer" in renderer)) continue;
      if (!("runs" in renderer.playlistBylineRenderer.text)) continue;

      let runs = renderer.playlistBylineRenderer.text.runs;
      if (runs[0].text.substr(0, 4) === "Last") { //"Last updated on"
        savedMeta.updated = runs[1].text;
        break;
      }
    }
  }

  if (!ignore.uploader) {
    savedMeta.uploader = "";
    for (let run in innerData.ownerText.runs)
      savedMeta.uploader += innerData.ownerText.runs[run].text;
  }

  if (!ignore.handle) {
    savedMeta.handle = "";
    for (let run in innerData.ownerText.runs) {
      run = innerData.ownerText.runs[run];
      if ("navigationEndpoint" in run) {
        let handle = run.navigationEndpoint.browseEndpoint.canonicalBaseUrl;
        if (handle[1] === "@") savedMeta.handle = handle;
        break;
      }
    }
  }

  if (!ignore.channelId) {
    savedMeta.channelId = "";
    for (let run in innerData.ownerText.runs) {
      run = innerData.ownerText.runs[run];
      if ("navigationEndpoint" in run) {
        savedMeta.channelId = run.navigationEndpoint.browseEndpoint.browseId;
        break;
      }
    }
  }

  return savedMeta;
}


async function collectMeta(settings, config, timeout, initialData) {
  
  global.sendvb(HEADER, "\n");
  let savedMeta = scrapeMeta(initialData, settings.ignore);
  global.sendvb(HEADER, "Complete");
  return savedMeta;

}


module.exports.scrape = collectMeta;