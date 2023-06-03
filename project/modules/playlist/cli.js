const path = require("path");
const helpers = require(path.join(__dirname, "..", "..", "common", "helpers"));
//const errors = require(path.join(__dirname, "..", "..", "common", "errors"));
const basicEntranceCli = require("../../common/cli_funcs").basicEntranceCli;

const cmd = require(__dirname + "/commands").cmd;


function cli(args, index) {

  let settings = require("./linker").settings;
  let currentState = require("./linker").currentState;
  if (global.TESTING) { //If not testing, no need to make copies, as the cli command will only be called once before the program ends
    settings = helpers.deepCopy(settings);
    currentState = helpers.deepCopy(currentState);
  }
  currentState.index = index;
  
  let result = basicEntranceCli(cmd, "playlist", args, currentState, settings);
  if (result === -1 || result === 1) return result;

  if (settings.playlist.output === "") { //Default destination
    let id = settings.playlist.input.split("?list=")[1];
    let filename = "playlist_" + id + ".json";
    settings.playlist.output = path.join(__dirname, "..", "..", "SAVES", filename);
  }

  return result;
}


module.exports.cli = cli;