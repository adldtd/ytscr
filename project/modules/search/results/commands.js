const path = require("path");
const { subscribeFilterable } = require("../../../common/subscribe-filterable");
const { subscribeMeta } = require("../../../common/subscribe-meta")
const errors = require(path.join(__dirname, "..", "..", "..", "common", "errors"));


  /**********************************************************************************/
 /* Arguments + commands and corresponding functions for the search results module */
/**********************************************************************************/


const attributesVideos = {id: "str",
                          title: "str",
                          shortDescription: "str",
                          badges: "str",
                          views: "num",
                          duration: "num",
                          published: "str",
                          thumbnail: "str",
                          uploader: "str",
                          verified: "str",
                          profilePicture: "str",
                          handle: "str",
                          channelId: "str"};

const attributesShorts = {id: "str",
                          title: "str",
                          views: "num",
                          thumbnail: "str"};

const attributesChannels = {name: "str",
                            verified: "str",
                            subscribers: "num",
                            shortDescription: "str",
                            picture: "str",
                            handle: "str",
                            channelId: "str"};

const attributesPlaylists = {id: "str",
                             title: "str",
                             size: "num",
                             shortVideos: "str",
                             updated: "str",
                             thumbnail: "str",
                             uploader: "str",
                             verified: "str",
                             handle: "str",
                             channelId: "str"};

const attributesMovies = {id: "str",
                          title: "str",
                          shortDescription: "str",
                          duration: "num",
                          year: "num",
                          category: "str",
                          contentHeaders: "str",
                          uploader: "str",
                          verified: "str",
                          channelId: "str"};


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
                 shortDescription: "Snippet of the description",
                 badges: "A list of items describing the content of the video",
                 views: "Num. views",
                 duration: "Length of the video",
                 published: "An approximate publish date (distance from the current date)",
                 thumbnail: "Link to the video thumbnail",
                 uploader: "The name of the video uploader",
                 verified: "Whether the uploader is verified",
                 profilePicture: "The uploader's profile picture",
                 handle: "The uploader's channel handle",
                 channelId: "The uploader's channel ID"}
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

    attributes: {id: "The short (video) ID",
                 title: "The name of the short",
                 views: "Num. views",
                 thumbnail: "Link to the short's thumbnail"}
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

    attributes: {name: "The name of the channel",
                 verified: "Whether the channel is verified",
                 subscribers: "Num. subscribers",
                 shortDescription: "Snippet of the channel's bio",
                 picture: "Channel's profile picture",
                 handle: "The channel handle",
                 channelId: "The channel ID"}
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
                 shortVideos: "A short info list of the first videos of the playlist",
                 updated: "Approximate time of the last change made to the list (distance from current date)",
                 thumbnail: "The video thumbnail used for the playlist",
                 uploader: "The name of the playlist's creator",
                 verified: "Whether the creator is verified",
                 handle: "The creator's channel handle",
                 channelId: "The creator's channel ID"}
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

    attributes: {id: "The video ID",
                 title: "The movie title",
                 shortDescription: "Snippet of the movie description",
                 duration: "Length of the movie",
                 year: "The year the movie was made",
                 category: "The movie's category (action, horror, etc.)",
                 contentHeaders: "A list of headers for the movie (\"Free with Ads\", \"PG-13\", etc.)",
                 uploader: "The name of the video uploader",
                 verified: "Whether the uploader is verified",
                 channelId: "The uploader's channel ID"}
  }
}


subscribeFilterable(attributesVideos, cmd.videos.commands);
subscribeFilterable(attributesShorts, cmd.shorts.commands);
subscribeFilterable(attributesChannels, cmd.channels.commands);
subscribeFilterable(attributesPlaylists, cmd.playlists.commands);
subscribeFilterable(attributesMovies, cmd.movies.commands);
subscribeMeta(cmd.videos.commands);
subscribeMeta(cmd.shorts.commands);
subscribeMeta(cmd.channels.commands);
subscribeMeta(cmd.playlists.commands);
subscribeMeta(cmd.movies.commands);


function limCall(c, a, currentState, innerState, moduleSettings, innerSettings) {

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