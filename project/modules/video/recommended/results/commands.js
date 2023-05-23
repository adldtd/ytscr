const path = require("path");
const errors = require(path.join(__dirname, "..", "..", "..", "..", "common", "errors"));

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
    commands: {},

    attributes: attributesVideos
  },

  playlists: {
    commands: {},

    attributes: attributesPlaylists
  },

  mixes: {
    commands: {},

    attributes: attributesMixes
  }

};

//*************************************************************************** Settings for the CLI

var videosSettings = {

}

var videosCurrentState = {

}


var playlistsSettings = {

}

var playlistsCurrentState = {

}


var mixesSettings = {

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


module.exports.cmd = cmd;
module.exports.videosSettings = videosSettings;
module.exports.videosCurrentState = videosCurrentState;
module.exports.playlistsSettings = playlistsSettings;
module.exports.playlistsCurrentState = playlistsCurrentState;
module.exports.mixesSettings = mixesSettings;
module.exports.mixesCurrentState = mixesCurrentState;