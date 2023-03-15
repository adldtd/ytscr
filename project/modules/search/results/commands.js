const path = require("path");
const { subscribeFilterable } = require("../../../common/subscribe-filterable");
const { subscribeMeta } = require("../../../common/subscribe-meta")
const errors = require(path.join(__dirname, "..", "..", "..", "common", "errors"));
const map = require("../../../common/helpers").map;


  /**********************************************************************************/
 /* Arguments + commands and corresponding functions for the search results module */
/**********************************************************************************/

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
  shortDescription: {
    type: "str",
    simpleDescription: "Snippet of the description"
  },
  badges: {
    type: "str",
    simpleDescription: "A list of items describing the content of the video"
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
    simpleDescription: "An approximate publish date (distance from the current date)"
  },
  thumbnail: {
    type: "str",
    simpleDescription: "Link to the video thumbnail"
  },
  uploader: {
    type: "str",
    simpleDescription: "The name of the video uploader"
  },
  verified: {
    type: "str",
    simpleDescription: "Whether the uploader is verified"
  },
  profilePicture: {
    type: "str",
    simpleDescription: "The uploader's profile picture"
  },
  handle: {
    type: "str",
    simpleDescription: "The uploader's channel handle"
  },
  channelId: {
    type: "str",
    simpleDescription: "The uploader's channel ID"
  }
};

const attributesShorts =
{
  id: {
    type: "str",
    simpleDescription: "The video ID"
  },
  title: {
    type: "str",
    simpleDescription: "The name of the short"
  },
  views: {
    type: "num",
    simpleDescription: "Num. views"
  },
  thumbnail: {
    type: "str",
    simpleDescription: "Link to the short's thumbnail"
  }
};

const attributesChannels =
{
  name: {
    type: "str",
    simpleDescription: "The name of the channel"
  },
  verified: {
    type: "str",
    simpleDescription: "Whether the channel is verified"
  },
  subscribers: {
    type: "num",
    simpleDescription: "Num. subscribers"
  },
  shortDescription: {
    type: "str",
    simpleDescription: "Snippet of the channel's bio"
  },
  picture: {
    type: "str",
    simpleDescription: "Channel's profile picture"
  },
  handle: {
    type: "str",
    simpleDescription: "The channel handle"
  },
  channelId: {
    type: "str",
    simpleDescription: "The channel ID"
  }
};

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
  shortVideos: {
    type: "str",
    simpleDescription: "A short info list of the first videos of the playlist"
  },
  shortVideoIds: {
    type: "str",
    simpleDescription: "The corresponding video IDs for those first videos"
  },
  updated: {
    type: "str",
    simpleDescription: "Approximate time of the last change made to the list (distance from current date)"
  },
  thumbnail: {
    type: "str",
    simpleDescription: "The video thumbnail used for the playlist"
  },
  uploader: {
    type: "str",
    simpleDescription: "The name of the playlist's creator"
  },
  verified: {
    type: "str",
    simpleDescription: "Whether the creator is verified"
  },
  handle: {
    type: "str",
    simpleDescription: "The creator's channel handle"
  },
  channelId: {
    type: "str",
    simpleDescription: "The creator's channel ID"
  }
};

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
  shortVideos: {
    type: "str",
    simpleDescription: "A short info list of the first videos of the mix"
  },
  shortVideoIds: {
    type: "str",
    simpleDescription: "The corresponding video IDs for those first videos"
  },
  thumbnail: {
    type: "str",
    simpleDescription: "The video thumbnail used for the mix"
  },
  uploaders: {
    type: "str",
    simpleDescription: "A snippet of some of the uploaders included in the mix"
  }
};

const attributesMovies =
{
  id: {
    type: "str",
    simpleDescription: "The video ID"
  },
  title: {
    type: "str",
    simpleDescription: "The movie title"
  },
  shortDescription: {
    type: "str",
    simpleDescription: "Snippet of the movie description"
  },
  duration: {
    type: "num",
    simpleDescription: "Length of the movie"
  },
  year: {
    type: "num",
    simpleDescription: "The year the movie was made"
  },
  category: {
    type: "str",
    simpleDescription: "The movie's category (action, horror, etc.)"
  },
  contentHeaders: {
    type: "str",
    simpleDescription: "A list of headers for the movie (\"Free with Ads\", \"PG-13\", etc.)"
  },
  uploader: {
    type: "str",
    simpleDescription: "The name of the video uploader"
  },
  verified: {
    type: "str",
    simpleDescription: "Whether the uploader is verified"
  },
  channelId: {
    type: "str",
    simpleDescription: "The uploader's channel ID"
  }
};


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

  shorts: {
    commands: {
      "-l": {redirect: "--lim"},
      "--lim": {
        aliases: ["--lim", "-l"],
        simpleDescription: "Limits the amount of shorts scraped",
        description: "An argument which stops the scraper once a certain threshold is reached. Should be defined " +
        "as a positive integer. If this argument is not present, the scraper will not stop until all shorts are " +
        "retrieved. NOTE: The value entered limits the scraper based on how many shorts were checked, " +
        "not how many matched the filters (see limfilter).",
        examples: ["--lim 100", "-l=27"],
        call: limCall,
        numArgs: 1
      }
    },

    attributes: attributesShorts

  },

  channels: {
    commands: {
      "-l": {redirect: "--lim"},
      "--lim": {
        aliases: ["--lim", "-l"],
        simpleDescription: "Limits the amount of channels scraped",
        description: "An argument which stops the scraper once a certain threshold is reached. Should be defined " +
        "as a positive integer. If this argument is not present, the scraper will not stop until all channels are " +
        "retrieved. NOTE: The value entered limits the scraper based on how many channels were checked, " +
        "not how many matched the filters (see limfilter).",
        examples: ["--lim 100", "-l=27"],
        call: limCall,
        numArgs: 1
      }
    },

    attributes: attributesChannels

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

  },

  movies: {
    commands: {
      "-l": {redirect: "--lim"},
      "--lim": {
        aliases: ["--lim", "-l"],
        simpleDescription: "Limits the amount of movies scraped",
        description: "An argument which stops the scraper once a certain threshold is reached. Should be defined " +
        "as a positive integer. If this argument is not present, the scraper will not stop until all movies are " +
        "retrieved. NOTE: The value entered limits the scraper based on how many movies were checked, " +
        "not how many matched the filters (see limfilter).",
        examples: ["--lim 100", "-l=27"],
        call: limCall,
        numArgs: 1
      }
    },

    attributes: attributesMovies

  }
}

//*************************************************************************** Settings for the CLI

var videosSettings = {
  lim: Number.POSITIVE_INFINITY
}

var videosCurrentState = {

}


var shortsSettings = {
  lim: Number.POSITIVE_INFINITY
}

var shortsCurrentState = {

}


var channelsSettings = {
  lim: Number.POSITIVE_INFINITY
}

var channelsCurrentState = {

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


var moviesSettings = {
  lim: Number.POSITIVE_INFINITY
}

var moviesCurrentState = {

}


subscribeFilterable(attributesVideos, cmd.videos.commands, videosCurrentState, videosSettings);
subscribeFilterable(attributesShorts, cmd.shorts.commands, shortsCurrentState, shortsSettings);
subscribeFilterable(attributesChannels, cmd.channels.commands, channelsCurrentState, channelsSettings);
subscribeFilterable(attributesPlaylists, cmd.playlists.commands, playlistsCurrentState, playlistsSettings);
subscribeFilterable(attributesMixes, cmd.mixes.commands, mixesCurrentState, mixesSettings);
subscribeFilterable(attributesMovies, cmd.movies.commands, moviesCurrentState, moviesSettings);
subscribeMeta(cmd.videos.commands);
subscribeMeta(cmd.shorts.commands);
subscribeMeta(cmd.channels.commands);
subscribeMeta(cmd.playlists.commands);
subscribeMeta(cmd.mixes.commands);
subscribeMeta(cmd.movies.commands);

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
module.exports.shortsSettings = shortsSettings;
module.exports.shortsCurrentState = shortsCurrentState;
module.exports.channelsSettings = channelsSettings;
module.exports.channelsCurrentState = channelsCurrentState;
module.exports.playlistsSettings = playlistsSettings;
module.exports.playlistsCurrentState = playlistsCurrentState;
module.exports.mixesSettings = mixesSettings;
module.exports.mixesCurrentState = mixesCurrentState;
module.exports.moviesSettings = moviesSettings;
module.exports.moviesCurrentState = moviesCurrentState;