
  /**************************************************************************************/
 /* Set up settings and currentState objects for the outermost cli of the video module */
/**************************************************************************************/


var settings = {};

settings.video = require("./commands").settings;
settings.meta = require("./meta/commands").settings;
settings.comments = require("./comments/commands").settings;
settings.chat = require("./chat/commands").settings;
settings.recommended = require("./recommended/commands").settings;
  settings.videosRecommended = require("./recommended/results/commands").videosSettings;
  settings.playlistsRecommended = require("./recommended/results/commands").playlistsSettings;
  settings.mixesRecommended = require("./recommended/results/commands").mixesSettings;
  settings.recommended.videos = settings.videosRecommended;
  settings.recommended.playlists = settings.playlistsRecommended;
  settings.recommended.mixes = settings.mixesRecommended;


var currentState = {
  error: false,
  index: null //To be set by a CLI
};

currentState.video = require("./commands").currentState;
currentState.meta = require("./meta/commands").currentState;
currentState.comments = require("./comments/commands").currentState;
currentState.chat = require("./chat/commands").currentState;
currentState.recommended = require("./recommended/commands").currentState;
  currentState.videosRecommended = require("./recommended/results/commands").videosCurrentState;
  currentState.playlistsRecommended = require("./recommended/results/commands").playlistsCurrentState;
  currentState.mixesRecommended = require("./recommended/results/commands").mixesCurrentState;


module.exports.settings = settings;
module.exports.currentState = currentState;