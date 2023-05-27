//const errors = require("../../../../common/errors");

const subscribeFilterable = require("../../../../common/subscribe-filterable").subscribeFilterable;
const subscribeMeta = require("../../../../common/subscribe-meta").subscribeMeta;


  /*********************************************************************************/
 /* Arguments + commands and corresponding functions for the results module group */
/*********************************************************************************/

const attributesVideos = {
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
  handle: {
    type: "str",
    simpleDescription: "The uploader's channel handle"
  },
  channelId: {
    type: "str",
    simpleDescription: "The uploader's channel ID"
  }
};

const attributesShorts = { //***********CHECK IF SHORTS MADE BY OTHER CHANNELS CAN BE FEATURED ON THE HOMEPAGE
  id: {
    type: "str",
    simpleDescription: "The video ID"
  },
  title: {
    type: "str",
    simpleDescription: "The title of the short"
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

const attributesPlaylists = {
  id: {
    type: "str",
    simpleDescription: "The playlist ID"
  },
  title: {
    type: "str",
    simpleDescription: "The title of the playlist"
  },
  size: {
    type: "num",
    simpleDescription: "Num. videos in the playlist"
  },
  updated: {
    type: "str",
    simpleDescription: "Approximate time of the last change made to the list (distance from current date)"
  },
  thumbnail: {
    type: "str",
    simpleDescription: "Link to the playlist's thumbnail"
  },
  uploader: {
    type: "str",
    simpleDescription: "The name of the creator of the playlist"
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

const attributesChannels = {
  name: {
    type: "str",
    simpleDescription: "The channel's name"
  },
  subscribers: {
    type: "num",
    simpleDescription: "Num. subscribers"
  },
  profilePicture: {
    type: "str",
    simpleDescription: "The channel's profile picture"
  },
  verified: {
    type: "str",
    simpleDescription: "Whether the channel is verified"
  },
  handle: {
    type: "str",
    simpleDescription: "The channel's handle"
  },
  channelId: {
    type: "str",
    simpleDescription: "The channel's ID"
  }
};


const cmd = {

  videos: {
    commands: {},
    attributes: attributesVideos
  },

  shorts: {
    commands: {},
    attributes: attributesShorts
  },

  playlists: {
    commands: {},
    attributes: attributesPlaylists
  },

  channels: {
    commands: {},
    attributes: attributesChannels
  }

};

//*************************************************************************** Settings for the CLI

var thisSettingsVideos = {

}

var thisCurrentStateVideos = {

}


var thisSettingsShorts = {

}

var thisCurrentStateShorts = {
  
}


var thisSettingsPlaylists = {

}

var thisCurrentStatePlaylists = {
  
}


var thisSettingsChannels = {

}

var thisCurrentStateChannels = {
  
}


subscribeFilterable(attributesVideos, cmd.videos.commands, thisCurrentStateVideos, thisSettingsVideos);
subscribeMeta(cmd.videos.commands);
subscribeFilterable(attributesShorts, cmd.shorts.commands, thisCurrentStateShorts, thisSettingsShorts);
subscribeMeta(cmd.shorts.commands);
subscribeFilterable(attributesPlaylists, cmd.playlists.commands, thisCurrentStatePlaylists, thisSettingsPlaylists);
subscribeMeta(cmd.playlists.commands);
subscribeFilterable(attributesChannels, cmd.channels.commands, thisCurrentStateChannels, thisSettingsChannels);
subscribeMeta(cmd.channels.commands);

//*************************************************************************** CLI call functions


module.exports.cmdVideos = cmd.videos;
module.exports.settingsVideos = thisSettingsVideos;
module.exports.currentStateVideos = thisCurrentStateVideos;
module.exports.cmdShorts = cmd.shorts;
module.exports.settingsShorts = thisSettingsShorts;
module.exports.currentStateShorts = thisCurrentStateShorts;
module.exports.cmdPlaylists = cmd.playlists;
module.exports.settingsPlaylists = thisSettingsPlaylists;
module.exports.currentStatePlaylists = thisCurrentStatePlaylists;
module.exports.cmdChannels = cmd.channels;
module.exports.settingsChannels = thisSettingsChannels;
module.exports.currentStateChannels = thisCurrentStateChannels;