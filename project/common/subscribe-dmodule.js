const fs = require("fs");
const path = require("path");
const helpers = require(path.join(__dirname, "helpers"));
const errors = require(path.join(__dirname, "errors"));


  /**************************************************************************************/
 /* Default module command pack; meant to reduce code bloat between first-call modules */
/**************************************************************************************/

innerModule = "";

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
  },

  "-np": {redirect: "--nopretty"},
  "--nopretty":
  {
    aliases: ["--nopretty", "-np"],
    simpleDescription: "Disables pretty printing",
    description: "When present, this stops the scraper from nicely formatting the saved JSON. Tends to save a " +
    "little bit of space.",
    call: noprettyCall,
    numArgs: 0
  },

  "-o": {redirect: "--output"},
  "--output":
  {
    aliases: ["--output", "-o"],
    simpleDescription: "The path to save the file",
    description: "Specifies the path of the saved JSON file. The directory must exist and must be " +
    "accessible by the scraper. By default, the script will place files in the /SAVES folder of the project.",
    examples: ["--output \"C:/Users/admin/scraped.json\"", "-o C:/scrapes/scraped"],
    call: outputCall,
    numArgs: 1
  },

  "--verbose":
  {
    aliases: ["--verbose"],
    simpleDescription: "The amount of information the program will print",
    description: "Takes in an integer value, which specifies what the program will print during execution. " +
    "Range is from 0-3.",
    validValues: {
      "0": "Only prints CLI errors to the terminal, nothing else",
      "1": "Prints the scraping start message, main module errors, and the save output; no headers or progress",
      "2": "Prints submodule headers and submodule errors; no progress",
      "3": "Prints progress - default option"
    },
    examples: ["--verbose 0"],
    call: verboseCall,
    numArgs: 1
  }
}

//--------------------------------------------------------------------- CLI state modification functions

function focusCall(parsed, currentState, settings) {

  let c = parsed.command; let a = parsed.args[0];

  if (a in parsed.commandBox.validValues) {
    if (!(a in currentState.video.excludeList)) {

      if (!currentState.video.firstFocusCalled) { //The first focus called disables all other modules
        currentState.video.firstFocusCalled = true;
        for (md in settings[innerModule].focus) {
          if (md !== a)
            settings[innerModule].focus[md] = false;
        }
      } else
        settings[innerModule].focus[a] = true;
      currentState.video.focusList[a] = ""; //To detect collisions with --exclude

    } else
      currentState.error = errors.errorCodesConflict(1, c, "--exclude", a);
  } else {
    currentState.error = errors.errorCodes(3, c, a);
    helpers.outputValidValues(c, parsed.commandBox.validValues);
  }
}

function excludeCall(parsed, currentState, settings) {

  let c = parsed.command; let a = parsed.args[0];

  if (a in parsed.commandBox.validValues) {
    if (!(a in currentState.video.focusList)) {
      if (!(a in currentState.video.modulesCalled)) {

        settings[innerModule].focus[a] = false;
        currentState.video.excludeList[a] = ""; //To detect collisions with --focus and calling modules

      } else
        currentState.error = errors.errorCodesConflict(2, c, "", a);
    } else
      currentState.error = errors.errorCodesConflict(1, c, "--focus", a);
  } else {
    currentState.error = errors.errorCodes(3, c, a);
    helpers.outputValidValues(c, parsed.commandBox.validValues);
  }
}

function noprettyCall(parsed, currentState, settings) {
  settings[innerModule].prettyprint = false;
}

function outputCall(parsed, currentState, settings) {

  let c = parsed.command; let a = parsed.args[0];
  let forwardSlashSplit = true;
  
  if (settings[innerModule].output !== "") {
    currentState.error = errors.errorCodesNums(2, c, 1, 2);
    return;
  }

  let sp = helpers.safeSplit(a, "/", 1, true);
  if (sp.length === 1) {
    sp = helpers.safeSplit(a, "\\", 1, true); //Another attempt
    forwardSlashSplit = false;
  }


  let filepath = ""; let filename = "";
  if (sp.length === 1) { //Treat the entered string as a filename
    filepath = path.join(__dirname, "..", "SAVES");
    filename = sp[0];
  } else {
    filepath = sp[0];
    filename = sp[1];
  }

  if (sp.length === 1 && !fs.existsSync(filepath)) {
    currentState.error = errors.errorCodesOutput(1, c, filepath);
    return;
  }

  if (!helpers.validFileName(filename)) {
    currentState.error = errors.errorCodesOutput(0, c, filename);
    return;
  }

  if (filename.substring(filename.length - 5) !== ".json")
    filename += ".json"; //Force the filetype

  settings[innerModule].output = filepath + (forwardSlashSplit ? "/" : "\\") + filename;
}

function verboseCall(parsed, currentState, settings) {

  let c = parsed.command; let a = parsed.args[0];

  if (!(toString(settings[innerModule].verbose) in parsed.commandBox.validValues)) { //If this statement is false, --verbose was already specified
    if (a in parsed.commandBox.validValues) {
      settings[innerModule].verbose = parseInt(a);
      global.verbose = settings[innerModule].verbose;
    } else {
      currentState.error = errors.errorCodes(3, c, a);
      helpers.outputValidValues(c, parsed.commandBox.validValues)
    }
  } else
    currentState.error = errors.errorsCodesNums(2, c, 1, 2);
}

//--------------------------------------------------------------------- "Registration" functions

/**
 * Makes sure both currentState and settings "comply" with the dmodule set of commands; used for debugging
 * @param {Object} innerState Represents a tracker of a certain CLI's "state" while running
 * @param {Object} innerSettings Module specific settings to be passed to a scraping function
 */
function verifyDmodule(innerState, innerSettings) {

  let stateError = false; let settingsError = false;

  if (!("focusList" in innerState && "excludeList" in innerState && "modulesCalled" in innerState && "firstFocusCalled" in innerState))
    stateError = true;

  if (!("prettyprint" in innerSettings && "verbose" in innerSettings && "focus" in innerSettings && "output" in innerSettings && "timeout" in innerSettings))
    settingsError = true;

  if (stateError && settingsError)
    throw "Error: currentState and settings are incomplete (dmodule)";
  if (stateError)
    throw "Error: currentState is incomplete (dmodule)";
  if (settingsError)
    throw "Error: settings is incomplete (dmodule)";
}

/**
 * Registers a group of commands into the command section of a cmd object. Made to be used by commands.js files to reduce code bloat.
 * @param {Object} modules Contains the names of modules as keys in an object
 * @param {Object} cmdCommands The "command" section of a cmd object
 */
function subscribeDmodule(modules, cmdCommands, innerMod) {

  innerModule = innerMod;
  for (c in commands) {

    //Shallow copy; shouldn't matter as later code shouldn't modify any embedded objects or arrays in cmd
    cmdCommands[c] = Object.assign({}, commands[c]);
    if (c === "--focus" || c === "--exclude")
      cmdCommands[c].validValues = modules;

  }
}


module.exports.verifyDmodule = verifyDmodule;
module.exports.subscribeDmodule = subscribeDmodule;