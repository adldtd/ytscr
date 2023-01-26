const path = require("path");
const errors = require(path.join(__dirname, "..", "..", "..", "..", "common", "errors"));

const subscribeFilterable = require(path.join(__dirname, "..", "..", "..", "..", "common", "subscribe-filterable")).subscribeFilterable;
const subscribeMeta = require(path.join(__dirname, "..", "..", "..", "..", "common", "subscribe-meta")).subscribeMeta;errors


const attributesVideos = {id: "str",
                          title: "str",
                          views: "num",
                          duration: "num",
                          published: "str",
                          thumbnail: "str",
                          uploader: "str",
                          handle: "str",
                          channelId: "str"};

const attributesPlaylists = {id: "str",
                             title: "str",
                             size: "num",
                             thumbnail: "str",
                             uploader: "str",
                             handle: "str",
                             channelId: "str",
                             firstVideoId: "str"};

const attributesMixes = {id: "str",
                         title: "str",
                         thumbnail: "str",
                         uploaders: "str",
                         firstVideoId: "str"};

const cmd = {

  videos: {
    commands: {
      "-l": {redirect: "--lim"},
      "--lim": {
        aliases: ["--lim", "-l"],
        simpleDescription: "Limits the amount of videos scraped",
        description: "An argument which stops the scraper once a certain threshold is reached. Should be defined " +
        "as a positive integer. If this argument is not present, the scraper will not stop until all videos are " +
        "retrieved. NOTE: The value entered limits the scraper based on how many videos were checked, " +
        "not how many matched the filters (see limfilter).",
        examples: ["--lim 100", "-l=27"],
        call: limCall,
        numArgs: 1
      }
    },

    attributes: {id: "The video ID",
                 title: "The video title",
                 views: "Num. views",
                 duration: "Length of the video",
                 published: "Approximate publish date (distance from today)",
                 thumbnail: "Thumbnail of the video",
                 uploader: "The name of the video uploader",
                 handle: "The uploader's channel handle",
                 channelId: "The uploader's channel ID"}
  },

  playlists: {
    commands: {
      "-l": {redirect: "--lim"},
      "--lim": {
        aliases: ["--lim", "-l"],
        simpleDescription: "Limits the amount of playlists scraped",
        description: "An argument which stops the scraper once a certain threshold is reached. Should be defined " +
        "as a positive integer. If this argument is not present, the scraper will not stop until all playlists are " +
        "retrieved. NOTE: The value entered limits the scraper based on how many playlists were checked, " +
        "not how many matched the filters (see limfilter).",
        examples: ["--lim 100", "-l=27"],
        call: limCall,
        numArgs: 1
      }
    },

    attributes: {id: "The playlist ID",
                 title: "The name of the playlist",
                 size: "Num. videos in the playlist",
                 thumbnail: "The video thumbnail used for the playlist",
                 uploader: "The name of the playlist's creator",
                 handle: "The uploader's channel handle",
                 channelId: "The creator's channel ID",
                 firstVideoId: "The video ID of the starting video in the playlist"}
  },

  mixes: {
    commands: {
      "-l": {redirect: "--lim"},
      "--lim": {
        aliases: ["--lim", "-l"],
        simpleDescription: "Limits the amount of mixes scraped",
        description: "An argument which stops the scraper once a certain threshold is reached. Should be defined " +
        "as a positive integer. If this argument is not present, the scraper will not stop until all mixes are " +
        "retrieved. NOTE: The value entered limits the scraper based on how many mixes were checked, " +
        "not how many matched the filters (see limfilter).",
        examples: ["--lim 100", "-l=27"],
        call: limCall,
        numArgs: 1
      }
    },

    attributes: {id: "The playlist ID",
                 title: "The name of the mix",
                 thumbnail: "The video thumbnail used for the mix",
                 uploaders: "A snippet of some of the uploaders included in the mix",
                 firstVideoId: "The video ID of the starting video in the mix"}
  }

};


subscribeFilterable(attributesVideos, cmd.videos.commands);
subscribeFilterable(attributesPlaylists, cmd.playlists.commands);
subscribeFilterable(attributesMixes, cmd.mixes.commands);
subscribeMeta(cmd.videos.commands);
subscribeMeta(cmd.playlists.commands);
subscribeMeta(cmd.mixes.commands);


function limCall(parsed, currentState, innerState, moduleSettings, innerSettings) {

  let c = parsed.command; let a = parsed.args[0];

  if (!innerState.inFilter) {
    if (!isNaN(parseInt(a))) {
      a = parseInt(a);
      if (a > 0)
        innerSettings.lim = a;
      else
        currentState.error = errors.errorCodes(15, c, a);
    } else
      currentState.error = errors.errorCodes(16, c, a);
  } else
    currentState.error = errors.errorCodes(2, c);
}


module.exports.cmd = cmd;