
  /*****************************************************************************************/
 /* Set up settings and currentState objects for the outermost cli of the playlist module */
/*****************************************************************************************/


var settings = {};

settings.channel = require("./commands").settings;
settings.meta = require("./meta/commands").settings;
settings.home = require("./home/commands").settings;
  settings.videosResults = require("./home/results/commands").settingsVideos;
  settings.shortsResults = require("./home/results/commands").settingsShorts;
  settings.playlistsResults = require("./home/results/commands").settingsPlaylists;
  settings.channelsResults = require("./home/results/commands").settingsChannels;
  settings.home.videos = settings.videosResults;
  settings.home.shorts = settings.shortsResults;
  settings.home.playlists = settings.playlistsResults;
  settings.home.channels = settings.channelsResults;
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
settings.about = require("./about/commands").settings;


var currentState = {
  error: false,
  index: null
};

currentState.channel = require("./commands").currentState;
currentState.meta = require("./meta/commands").currentState;
currentState.home = require("./home/commands").currentState;
  currentState.videosResults = require("./home/results/commands").currentStateVideos;
  currentState.shortsResults = require("./home/results/commands").currentStateShorts;
  currentState.playlistsResults = require("./home/results/commands").currentStatePlaylists;
  currentState.channelsResults = require("./home/results/commands").currentStateChannels;
currentState.videos = require("./videos/commands").currentState;
currentState.shorts = require("./shorts/commands").currentState;
currentState.live = require("./live/commands").currentState;
currentState.playlists = require("./playlists/commands").currentState;
currentState.community = require("./community/commands").currentState;
  currentState.videoAttachments = require("./community/attachments/commands").currentStateVideo;
  currentState.pollAttachments = require("./community/attachments/commands").currentStatePoll;
  currentState.imageAttachments = require("./community/attachments/commands").currentStateImage;
currentState.store = require("./store/commands").currentState;
currentState.about = require("./about/commands").currentState;


module.exports.settings = settings;
module.exports.currentState = currentState;