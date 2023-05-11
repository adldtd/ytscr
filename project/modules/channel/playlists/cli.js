const helpers = require("../../../common/helpers");
const errors = require("../../../common/errors");

const cmd = require("./commands").cmd;

const CALLER = "channel";
const THIS_MODULE = "playlists";


function cli(args, currentState, settings) {
  
  //Loop through the CLI
  while (currentState.index < args.length) {

    let parsed = helpers.parseArgs(args, currentState.index, cmd, currentState);
    if (currentState.error) return -1;
    currentState.index = parsed.currentIndex;

    if (parsed.command === "#") {

      if (currentState[THIS_MODULE].inFilter) {
        currentState.error = errors.errorCodesScope(3, THIS_MODULE);
        return -1;
      }
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
      parsed.commandBox.call(parsed, currentState, currentState[THIS_MODULE], settings[CALLER], settings[THIS_MODULE]);

    if (currentState.error)
      return -1;
  }

  if (settings[THIS_MODULE].focusmode) { //Warns that unfocused or unexcluded sections will be automatically ignored
    for (let section in currentState[THIS_MODULE].unwarnedSections) {
      let sectionData = currentState[THIS_MODULE].unwarnedSections[section];
      if (sectionData.focussection === null)
        console.log("WARNING: Section \"" + section + "\" was not specified to be focused, but another was; the section will be automatically excluded.");
      delete currentState[THIS_MODULE].unwarnedSections[section];
    }
  }

  if (currentState[THIS_MODULE].inFilter) {
    currentState.error = errors.errorCodesScope(2, "--filter");
    return -1;
  }
  return 0; //No errors and no stopping commands called
}


module.exports.cli = cli;