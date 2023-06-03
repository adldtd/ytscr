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

  return basicEntranceCli(cmd, "channel", args, currentState, settings);
}


module.exports.cli = cli;