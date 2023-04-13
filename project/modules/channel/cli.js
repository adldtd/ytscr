const path = require("path");
const helpers = require(path.join(__dirname, "..", "..", "common", "helpers"));
const errors = require(path.join(__dirname, "..", "..", "common", "errors"));

const cmd = require(__dirname + "/commands").cmd;

const THIS_MODULE = "channel";


function cli(args, index) {

  let settings = require("./linker").settings;
  let currentState = require("./linker").currentState;
  if (global.TESTING) {
    settings = helpers.deepCopy(settings);
    currentState = helpers.deepCopy(currentState);
  }
  currentState.index = index;


  //Loop through the CLI
  while (currentState.index < args.length) {

    let parsed = helpers.parseArgs(args, currentState.index, cmd, currentState);
    if (currentState.error) return -1;
    currentState.index = parsed.currentIndex;

    if (parsed.isModule) {
    
      currentState[THIS_MODULE].modulesCalled[parsed.command] = "";
      let result = parsed.commandBox.cli(args, currentState, settings);
      if (result === -1 || result === 1) return result;
      
    } else {

      if (parsed.command === "#")
        currentState.error = errors.errorCodesScope(0, THIS_MODULE); //To help avoid user confusion
      else if (parsed.command === "--help" || parsed.command === "-h") {
        
        if (parsed.args.length === 0) {
          helpers.outputHelpAll(cmd);
          return 1;
        } else {
          let result = helpers.parseHelp(cmd, currentState, parsed);
          return result;
        }

      } else //Default; non-meta commands
        parsed.commandBox.call(parsed, currentState, currentState[THIS_MODULE], settings, settings[THIS_MODULE]);
    }

    if (currentState.error)
      return -1;
  }

  //Check for required inputs/errors after the fact
  if (settings[THIS_MODULE].input === "")
    currentState.error = errors.errorCodesNums(4, "--input", 1, 0);
  else {

    for (md in currentState[THIS_MODULE].modulesCalled) { //Catches an error where a module is called but not focused
      if (!settings[THIS_MODULE].focus[md]) {
        console.log("Error: Module \"" + md + "\" is modified, but is either ignored or not focused");
        currentState.error = true;
        break;
      }
    }
  }

  if (currentState.error)
    return -1;

  if (settings[THIS_MODULE].output === "") { //Default destination
    let id = helpers.safeSplit(settings[THIS_MODULE].input, "/", 1, true)[1];
    let filename = THIS_MODULE + "_" + id + ".json";
    settings[THIS_MODULE].output = path.join(__dirname, "..", "..", "SAVES", filename);
  }

  return settings;
  
}


module.exports.cli = cli;