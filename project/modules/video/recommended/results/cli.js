const path = require("path");
const helpers = require(path.join(__dirname, "..", "..", "..", "..", "common", "helpers"));
const errors = require(path.join(__dirname, "..", "..", "..", "..", "common", "errors"));

const cmd = require(__dirname + "/commands").cmd;

const CALLER1 = "video";
const CALLER2 = "recommended";


//*********************************************************************************
//"Results" module CLI; modifies settings.recommended[module]
//*********************************************************************************
function cli(args, currentState, settings, module) { //Needs a module for cmd to differentiate
  
  //Loop through the CLI
  while (currentState.index < args.length) {

    let parsed = helpers.parseArgs(args, currentState.index, cmd[module], currentState);
    if (currentState.error) return -1;
    currentState.index = parsed.currentIndex;

    if (parsed.command === "#") {

      if (currentState[CALLER2][module].inFilter) {
        currentState.error = errors.errorCodesScope(3, module);
        return -1;
      }
      return 0; //Exit scope safely

    } else if (parsed.command === "--help" || parsed.command === "-h") {
    
      if (parsed.args.length === 0) {
        helpers.outputHelpAll(cmd[module]);
        return 1;
      } else {
        let result = helpers.parseHelp(cmd[module], currentState, parsed);
        return result; //Either 1 (success) or -1 (failure)
      }

    } else //Default; non-meta commands
      parsed.commandBox.call(parsed, currentState, currentState[CALLER2][module], settings[CALLER1], settings[CALLER2][module]);

    if (currentState.error)
      return -1;
  }

  if (currentState[CALLER2][module].inFilter) {
    currentState.error = errors.errorCodesScope(2, "--filter");
    return -1;
  }
  return 0; //No errors and no stopping commands called
}


module.exports.cli = cli;