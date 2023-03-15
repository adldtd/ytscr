
  /***************************************************************************************/
 /* Set up settings and currentState objects for the outermost cli of the search module */
/***************************************************************************************/


var settings = {};

settings.search = require("./commands").settings;
settings.meta = require("./meta/commands").settings;
settings.videos = require("./results/commands").videosSettings;
settings.shorts = require("./results/commands").shortsSettings;
settings.channels = require("./results/commands").channelsSettings;
settings.playlists = require("./results/commands").playlistsSettings;
settings.mixes = require("./results/commands").mixesSettings;
settings.movies = require("./results/commands").moviesSettings;


var currentState = {
  error: false,
  index: null
};

currentState.search = require("./commands").currentState;
currentState.meta = require("./meta/commands").currentState;
currentState.videos = require("./results/commands").videosCurrentState;
currentState.shorts = require("./results/commands").shortsCurrentState;
currentState.channels = require("./results/commands").channelsCurrentState;
currentState.playlists = require("./results/commands").playlistsCurrentState;
currentState.mixes = require("./results/commands").mixesCurrentState;
currentState.movies = require("./results/commands").moviesCurrentState;


module.exports.settings = settings;
module.exports.currentState = currentState;