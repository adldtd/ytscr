const helpers = require("./helpers");
const errors = require("./errors");
const path = require("path");


function basicFilterableCli(cmd, CALLER, THIS_MODULE, args, currentState, settings) {
  
  //Loop through the CLI
  while (currentState.index < args.length) {

    let parsed = helpers.parseArgs(args, currentState.index, cmd, currentState);
    if (currentState.error) return -1;
    currentState.index = parsed.currentIndex;

    if (parsed.isModule) {

      if (!currentState[THIS_MODULE].inFilter) {
        currentState[THIS_MODULE].modulesCalled[parsed.command] = "";
        let result = parsed.commandBox.cli(args, currentState, settings);
        if (result === -1 || result === 1) return result;
      } else {
        currentState.error = errors.errorCodesScope(4, parsed.command);
        return -1;
      }

    } else if (parsed.command === "." || parsed.command === "#") {

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

  if ("modulesCalled" in currentState[THIS_MODULE]) {
    for (md in currentState[THIS_MODULE].modulesCalled) { //Catches an error where a module is called but not focused
      if (!settings[THIS_MODULE].focus[md]) {
        console.log("Error: Module \"" + md + "\" is modified, but is either ignored or not focused");
        currentState.error = true;
        return -1;
      }
    }
  }

  if (currentState[THIS_MODULE].inFilter) {
    currentState.error = errors.errorCodesScope(2, "--filter");
    return -1;
  }
  return 0; //No errors and no stopping commands called
}


function basicUnfilterableCli(cmd, CALLER, THIS_MODULE, args, currentState, settings) {
  
  //Loop through the CLI
  while (currentState.index < args.length) {

    let parsed = helpers.parseArgs(args, currentState.index, cmd, currentState);
    if (currentState.error) return -1;
    currentState.index = parsed.currentIndex;

    if (parsed.isModule) {

      currentState[THIS_MODULE].modulesCalled[parsed.command] = "";
      let result = parsed.commandBox.cli(args, currentState, settings);
      if (result === -1 || result === 1) return result;

    } else if (parsed.command === "." || parsed.command === "#") {
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

  if ("modulesCalled" in currentState[THIS_MODULE]) {
    for (md in currentState[THIS_MODULE].modulesCalled) { //Catches an error where a module is called but not focused
      if (!settings[THIS_MODULE].focus[md]) {
        console.log("Error: Module \"" + md + "\" is modified, but is either ignored or not focused");
        currentState.error = true;
        return -1;
      }
    }
  }

  return 0; //No errors and no stopping commands called
}


//Works with exactly one input (expected to be implemented in settings)
function basicEntranceCli(cmd, THIS_MODULE, args, currentState, settings) {

  while (currentState.index < args.length) {

    let parsed = helpers.parseArgs(args, currentState.index, cmd, currentState);
    if (currentState.error) return -1;
    currentState.index = parsed.currentIndex;

    if (parsed.isModule) {
    
      currentState[THIS_MODULE].modulesCalled[parsed.command] = "";
      let result = parsed.commandBox.cli(args, currentState, settings);
      if (result === -1 || result === 1) return result;
      
    } else {

      if (parsed.command === "." || parsed.command === "#")
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

  return settings;
}


module.exports.basicFilterableCli = basicFilterableCli;
module.exports.basicUnfilterableCli = basicUnfilterableCli;
module.exports.basicEntranceCli = basicEntranceCli;