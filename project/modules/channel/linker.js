
  /*****************************************************************************************/
 /* Set up settings and currentState objects for the outermost cli of the playlist module */
/*****************************************************************************************/


var settings = {};

settings.channel = require("./commands").settings;
settings.videos = require("./videos/commands").settings;


var currentState = {
  error: false,
  index: null
};

currentState.channel = require("./commands").currentState;
currentState.videos = require("./videos/commands").currentState;


module.exports.settings = settings;
module.exports.currentState = currentState;