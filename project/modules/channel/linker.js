
  /*****************************************************************************************/
 /* Set up settings and currentState objects for the outermost cli of the playlist module */
/*****************************************************************************************/


var settings = {};

settings.channel = require("./commands").settings;
settings.videos = require("./videos/commands").settings;
settings.shorts = require("./shorts/commands").settings;
settings.live = require("./live/commands").settings;
settings.playlists = require("./playlists/commands").settings;
settings.community = require("./community/commands").settings;
  settings.videoAttachments = require("./community/attachments/commands").settingsVideo;
  settings.pollAttachments = require("./community/attachments/commands").settingsPoll;
  settings.imageAttachments = require("./community/attachments/commands").settingsImage;
  settings.community.video = settings.videoAttachments;
  settings.community.poll = settings.pollAttachments;
  settings.community.image = settings.imageAttachments;
settings.store = require("./store/commands").settings;
settings.channels = require("./channels/commands").settings;
settings.about = require("./about/commands").settings;


var currentState = {
  error: false,
  index: null
};

currentState.channel = require("./commands").currentState;
currentState.videos = require("./videos/commands").currentState;
currentState.shorts = require("./shorts/commands").currentState;
currentState.live = require("./live/commands").currentState;
currentState.playlists = require("./playlists/commands").currentState;
currentState.community = require("./community/commands").currentState;
  currentState.videoAttachments = require("./community/attachments/commands").currentStateVideo;
  currentState.pollAttachments = require("./community/attachments/commands").currentStatePoll;
  currentState.imageAttachments = require("./community/attachments/commands").currentStateImage;
currentState.store = require("./store/commands").currentState;
currentState.channels = require("./channels/commands").currentState;
currentState.about = require("./about/commands").currentState;


module.exports.settings = settings;
module.exports.currentState = currentState;