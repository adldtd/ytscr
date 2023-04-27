
  /*****************************************************************************************/
 /* Set up settings and currentState objects for the outermost cli of the playlist module */
/*****************************************************************************************/


var settings = {};

settings.channel = require("./commands").settings;
settings.videos = require("./videos/commands").settings;
settings.shorts = require("./shorts/commands").settings;
settings.live = require("./live/commands").settings;


var currentState = {
  error: false,
  index: null
};

currentState.channel = require("./commands").currentState;
currentState.videos = require("./videos/commands").currentState;
currentState.shorts = require("./shorts/commands").currentState;
currentState.live = require("./live/commands").currentState;


module.exports.settings = settings;
module.exports.currentState = currentState;