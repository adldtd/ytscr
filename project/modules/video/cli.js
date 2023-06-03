const path = require("path");
const helpers = require(path.join(__dirname, "..", "..", "common", "helpers"));
//const errors = require(path.join(__dirname, "..", "..", "common", "errors"));
const deepCopyVideo = require("../../common/deep_copy").deepCopyVideo;
const basicEntranceCli = require("../../common/cli_funcs").basicEntranceCli;

const cmd = require(__dirname + "/commands").cmd;


//*********************************************************************************
//Video module CLI; passes currentState onward to other CLIs
//*********************************************************************************
function cli(args, index) {

  let settings = require("./linker").settings;
  let currentState = require("./linker").currentState;
  if (global.TESTING) { //If not testing, no need to make copies, as the cli command will only be called once before the program ends
    settings = deepCopyVideo(settings);
    currentState = helpers.deepCopy(currentState);
  }
  currentState.index = index;

  let result = basicEntranceCli(cmd, "video", args, currentState, settings);
  if (result === -1 || result === 1) return result;

  if (settings.video.output === "") { //Default destination
    let filename = "video_" + settings.video.input.split("?v=", 2)[1] + ".json";
    settings.video.output = path.join(__dirname, "..", "..", "SAVES", filename);
  }

  return result;
}


module.exports.cli = cli;