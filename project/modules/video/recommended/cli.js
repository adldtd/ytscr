const path = require("path");
const helpers = require(path.join(__dirname, "..", "..", "..", "common", "helpers"));
const errors = require(path.join(__dirname, "..", "..", "..", "common", "errors"));

const cmd = require(__dirname + "/commands").cmd;
const THIS_MODULE = "recommended";


//*********************************************************************************
//Recommended module CLI; modifies settings.recommended
//*********************************************************************************
function cli(args, currentState, settings) {
  
  //Loop through the CLI
  while (currentState.index < args.length) {

    let parsed = helpers.parseArgs(args, currentState.index, cmd, currentState);
    if (currentState.error) return -1;
    currentState.index = parsed.currentIndex;

    if (parsed.isModule) {

      currentState.recommended.modulesCalled[parsed.command] = "";
      let result = parsed.commandBox.cli(args, currentState, settings, parsed.command); //Results CLI needs a specific module name
      if (result === -1 || result === 1) return result;

    } else {

      if (parsed.command === "#") {
        return 0; //Exit scope safely

      } else if (parsed.command === "--help" || parsed.command === "-h") {
      
        if (parsed.args.length === 0) {
          helpers.outputHelpAll(cmd);
          return 1;
        } else {
          let result = helpers.parseHelp(cmd, currentState, parsed);
          return result; //Either 1 (success) or -1 (failure)
        }

      } else //Default; non-meta commands
        parsed.commandBox.call(parsed, currentState, currentState[THIS_MODULE], settings, settings[THIS_MODULE]);

    }

    if (currentState.error)
      return -1;
  }

  return 0; //No errors and no stopping commands called
}


module.exports.cli = cli;