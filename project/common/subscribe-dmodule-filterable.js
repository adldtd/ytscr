const fs = require("fs");
const path = require("path");
const helpers = require(path.join(__dirname, "helpers"));
const errors = require(path.join(__dirname, "errors"));


  /**********************************************************************************************************/
 /* The same as subscribe-dmodule (simple), except it is compatible with filters; uses innerState.inFilter */
/**********************************************************************************************************/

const commands = {

  "-fc": {redirect: "--focus"},
  "--focus": {
    aliases: ["--focus", "-fc"],
    simpleDescription: "A module which to only scrape",
    description: "A command which takes in a module, and \"focuses\" on it primarily during scraping. Useful for " +
    "times where only a certain section of data is needed. By default, the program will scrape all modules; " +
    "calling this command at least once will exclude all other modules. After this, however, specifying " +
    "another module with --focus will not exclude any other \"focused\" modules.",
    validValues: undefined,
    examples: ["--focus comments", "-fc chat"],
    call: focusCall,
    numArgs: 1
  },

  "-e": {redirect: "--exclude"},
  "--exclude": {
    aliases: ["--exclude", "-e"],
    simpleDescription: "A module which to ignore",
    description: "A command which takes in a module, and ignores it during scraping. As such, no data from " +
    "the module will be saved, and no time will be spent scraping it.",
    validValues: undefined,
    examples: ["--exclude chat", "-e comments"],
    call: excludeCall,
    numArgs: 1
  }
}

//--------------------------------------------------------------------- CLI state modification functions

function focusCall(parsed, currentState, innerState, settings, innerSettings) {

  let c = parsed.command; let a = parsed.args[0];

  if (!innerState.inFilter) {
    if (a in parsed.commandBox.validValues) {
      if (!(a in innerState.excludeList)) {

        if (!innerState.firstFocusCalled) { //The first focus called disables all other modules
          innerState.firstFocusCalled = true;
          for (md in innerSettings.focus) {
            if (md !== a)
              innerSettings.focus[md] = false;
          }
        } else
          innerSettings.focus[a] = true;
        innerState.focusList[a] = ""; //To detect collisions with --exclude

      } else
        currentState.error = errors.errorCodesConflict(1, c, "--exclude", a);
    } else {
      currentState.error = errors.errorCodes(3, c, a);
      helpers.outputValidValues(c, parsed.commandBox.validValues);
    }
  } else
    currentState.error = errors.errorCodes(2, c);
}

function excludeCall(parsed, currentState, innerState, settings, innerSettings) {

  let c = parsed.command; let a = parsed.args[0];

  if (!innerState.inFilter) {
    if (a in parsed.commandBox.validValues) {
      if (!(a in innerState.focusList)) {
        if (!(a in innerState.modulesCalled)) {

          innerSettings.focus[a] = false;
          innerState.excludeList[a] = ""; //To detect collisions with --focus and calling modules

        } else
          currentState.error = errors.errorCodesConflict(2, c, "", a);
      } else
        currentState.error = errors.errorCodesConflict(1, c, "--focus", a);
    } else {
      currentState.error = errors.errorCodes(3, c, a);
      helpers.outputValidValues(c, parsed.commandBox.validValues);
    }
  } else
    currentState.error = errors.errorCodes(2, c);
}

//--------------------------------------------------------------------- "Registration" functions

function subscribeDmoduleFilterable(modules, cmdCommands, innerState = {}, innerSettings = {}) { //Only add focus and exclude commands

  let subCommands = ["-fc", "--focus", "-e", "--exclude"];
  for (c in subCommands) {

    c = subCommands[c];
    cmdCommands[c] = Object.assign({}, commands[c]);
    if (c === "--focus" || c === "--exclude")
      cmdCommands[c].validValues = modules;
    
  }

  //Does not add "inFilter"; assumes it will be added from a call to subscribe-filterable
  innerState.focusList = {};
  innerState.excludeList = {};
  innerState.modulesCalled = {};
  innerState.firstFocusCalled = false;

  innerSettings.focus = helpers.map(modules, true);
}


module.exports.subscribeDmoduleFilterable = subscribeDmoduleFilterable;