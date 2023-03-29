
  /*****************************************************************************************/
 /* Set up settings and currentState objects for the outermost cli of the playlist module */
/*****************************************************************************************/


var settings = {};

settings.playlist = require("./commands").settings;
settings.meta = require("./meta/commands").settings;
settings.videos = require("./videos/commands").settings;


var currentState = {
  error: false,
  index: null
};

currentState.playlist = require("./commands").currentState;
currentState.meta = require("./meta/commands").currentState;
currentState.videos = require("./videos/commands").currentState;


module.exports.settings = settings;
module.exports.currentState = currentState;