const path = require("path");
const helpers = require(path.join(__dirname, "..", "..", "common", "helpers"));
const deepCopyChannel = require("../../common/deep_copy").deepCopyChannel;
//const errors = require(path.join(__dirname, "..", "..", "common", "errors"));
const basicEntranceCli = require("../../common/cli_funcs").basicEntranceCli;

const cmd = require(__dirname + "/commands").cmd;


function cli(args, index) {

  let settings = require("./linker").settings;
  let currentState = require("./linker").currentState;
  if (global.TESTING) {
    settings = deepCopyChannel(settings);
    currentState = helpers.deepCopy(currentState);
  }
  currentState.index = index;

  let result = basicEntranceCli(cmd, "channel", args, currentState, settings);
  if (result === -1 || result === 1) return result;

  if (settings.channel.output === "") { //Default destination
    let id = helpers.safeSplit(settings.channel.input, "/", 1, true)[1];
    let filename = "channel_" + id + ".json";
    settings.channel.output = path.join(__dirname, "..", "..", "SAVES", filename);
  }

  return result;
}


module.exports.cli = cli;