const path = require("path");
const errors = require(path.join(__dirname, "..", "..", "..", "..", "common", "errors"));
const map = require("../../../../common/helpers").map;

const subscribeFilterable = require(path.join(__dirname, "..", "..", "..", "..", "common", "subscribe-filterable")).subscribeFilterable;
const subscribeMeta = require(path.join(__dirname, "..", "..", "..", "..", "common", "subscribe-meta")).subscribeMeta;errors


  /************************************************************************************************/
 /* Arguments + commands and corresponding functions for submodules in the recommended submodule */
/************************************************************************************************/

const attributesVideos =
{
  id: {
    type: "str",
    simpleDescription: "The video ID"
  },
  title: {
    type: "str",
    simpleDescription: "The video title"
  },
  views: {
    type: "num",
    simpleDescription: "Num. views"
  },
  duration: {
    type: "num",
    simpleDescription: "Length of the video"
  },
  published: {
    type: "str",
    simpleDescription: "Approximate publish date (distance from today)"
  },
  thumbnail: {
    type: "str",
    simpleDescription: "Thumbnail of the video"
  },
  uploader: {
    type: "str",
    simpleDescription: "The name of the video uploader"
  },
  handle: {
    type: "str",
    simpleDescription: "The uploader's channel handle"
  },
  channelId: {
    type: "str",
    simpleDescription: "The uploader's channel ID"
  }
}

const attributesPlaylists =
{
  id: {
    type: "str",
    simpleDescription: "The playlist ID"
  },
  title: {
    type: "str",
    simpleDescription: "The name of the playlist"
  },
  size: {
    type: "num",
    simpleDescription: "Num. videos in the playlist"
  },
  thumbnail: {
    type: "str",
    simpleDescription: "The video thumbnail used for the playlist"
  },
  uploader: {
    type: "str",
    simpleDescription: "The name of the playlist's creator"
  },
  handle: {
    type: "str",
    simpleDescription: "The uploader's channel handle"
  },
  channelId: {
    type: "str",
    simpleDescription: "The creator's channel ID"
  },
  firstVideoId: {
    type: "str",
    simpleDescription: "The video ID of the starting video in the playlist"
  }
}

const attributesMixes =
{
  id: {
    type: "str",
    simpleDescription: "The playlist ID"
  },
  title: {
    type: "str",
    simpleDescription: "The name of the mix"
  },
  thumbnail: {
    type: "str",
    simpleDescription: "The video thumbnail used for the mix"
  },
  uploaders: {
    type: "str",
    simpleDescription: "A snippet of some of the uploaders included in the mix"
  },
  firstVideoId: {
    type: "str",
    simpleDescription: "The video ID of the starting video in the mix"
  }
}


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

    attributes: attributesVideos

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

    attributes: attributesPlaylists

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

    attributes: attributesMixes

  }

};

//*************************************************************************** Settings for the CLI

var videosSettings = {
  lim: Number.POSITIVE_INFINITY
}

var videosCurrentState = {

}


var playlistsSettings = {
  lim: Number.POSITIVE_INFINITY
}

var playlistsCurrentState = {

}


var mixesSettings = {
  lim: Number.POSITIVE_INFINITY
}

var mixesCurrentState = {

}


subscribeFilterable(attributesVideos, cmd.videos.commands, videosCurrentState, videosSettings);
subscribeFilterable(attributesPlaylists, cmd.playlists.commands, playlistsCurrentState, playlistsSettings);
subscribeFilterable(attributesMixes, cmd.mixes.commands, mixesCurrentState, mixesSettings);
subscribeMeta(cmd.videos.commands);
subscribeMeta(cmd.playlists.commands);
subscribeMeta(cmd.mixes.commands);

//*************************************************************************** CLI call functions

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
module.exports.videosSettings = videosSettings;
module.exports.videosCurrentState = videosCurrentState;
module.exports.playlistsSettings = playlistsSettings;
module.exports.playlistsCurrentState = playlistsCurrentState;
module.exports.mixesSettings = mixesSettings;
module.exports.mixesCurrentState = mixesCurrentState;