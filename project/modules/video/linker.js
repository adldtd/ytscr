
  /**************************************************************************************/
 /* Set up settings and currentState objects for the outermost cli of the video module */
/**************************************************************************************/


var settings = {};

settings.video = require("./commands").settings;
settings.meta = require("./meta/commands").settings;
settings.comments = require("./comments/commands").settings;
settings.chat = require("./chat/commands").settings;
settings.recommended = require("./recommended/commands").settings;
settings.recommended.videos = require("./recommended/results/commands").videosSettings;
settings.recommended.playlists = require("./recommended/results/commands").playlistsSettings;
settings.recommended.mixes = require("./recommended/results/commands").mixesSettings;


var currentState = {
  error: false,
  index: null //To be set by a CLI
};

currentState.video = require("./commands").currentState;
currentState.meta = require("./meta/commands").currentState;
currentState.comments = require("./comments/commands").currentState;
currentState.chat = require("./chat/commands").currentState;
currentState.recommended = require("./recommended/commands").currentState;
currentState.recommended.videos = require("./recommended/results/commands").videosCurrentState;
currentState.recommended.playlists = require("./recommended/results/commands").playlistsCurrentState;
currentState.recommended.mixes = require("./recommended/results/commands").mixesCurrentState;


module.exports.settings = settings;
module.exports.currentState = currentState;