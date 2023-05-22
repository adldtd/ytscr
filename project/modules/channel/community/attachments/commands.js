const subscribeIgnorable = require("../../../../common/subscribe-filterable").subscribeIgnorable;
const subscribeMeta = require("../../../../common/subscribe-meta").subscribeMeta;


  /*******************************************************************************/
 /* Arguments + commands and corresponding functions for the attachment modules */
/*******************************************************************************/

const attributesVideo = {
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

const attributesPoll = {
  options: {
    type: "str",
    simpleDescription: "The options in the poll"
  },
  votes: {
    type: "num",
    simpleDescription: "The amount of people who voted"
  }
};

const attributesImage = {
  url: {
    type: "str",
    simpleDescription: "The link to the image"
  }
};


const cmd = {

  video: {
    commands: {},
    attributes: attributesVideo
  },

  poll: {
    commands: {},
    attributes: attributesPoll
  },

  image: {
    commands: {},
    attributes: attributesImage
  }

};

//*************************************************************************** Settings for the CLI

var thisSettingsVideo = {

}

var thisCurrentStateVideo = {
  
}


var thisSettingsPoll = {

}

var thisCurrentStatePoll = {

}


var thisSettingsImage = {

}

var thisCurrentStateImage = {

}


subscribeIgnorable(attributesVideo, cmd.video.commands, thisCurrentStateVideo, thisSettingsVideo);
subscribeMeta(cmd.video.commands);
subscribeIgnorable(attributesPoll, cmd.poll.commands, thisCurrentStatePoll, thisSettingsPoll);
subscribeMeta(cmd.poll.commands);
subscribeIgnorable(attributesImage, cmd.image.commands, thisCurrentStateImage, thisSettingsImage);
subscribeMeta(cmd.image.commands);

//*************************************************************************** CLI call functions


module.exports.cmdVideo = cmd.video;
module.exports.settingsVideo = thisSettingsVideo;
module.exports.currentStateVideo = thisCurrentStateVideo;
module.exports.cmdPoll = cmd.poll;
module.exports.settingsPoll = thisSettingsPoll;
module.exports.currentStatePoll = thisCurrentStatePoll;
module.exports.cmdImage = cmd.image;
module.exports.settingsImage = thisSettingsImage;
module.exports.currentStateImage = thisCurrentStateImage;