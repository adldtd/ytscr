const path = require("path");
const helpers = require(path.join(__dirname, "..", "helpers"));
const errors = require(path.join(__dirname, "..", "errors"));


  /************************************************************************************************/
 /* Code block consisting of functions related to filtering data; used to reduce some redundancy */
/************************************************************************************************/


const commands = {

  "-sf": {redirect: "--savefilter"},
  "--savefilter":
  {
    aliases: ["--savefilter", "-sf"],
    simpleDescription: "Only saves filter matches",
    description: "A flag that restricts the scraper to saving a data piece ONLY IF the attribute(s) being " +
    "checked match all of the entered filters. ",
    call: savefilterCall,
    numArgs: 0
  },

  "-pf": {redirect: "--printfilter"},
  "--printfilter":
  {
    aliases: ["--printfilter", "-pf"],
    simpleDescription: "Prints out filter matches",
    description: "A flag that causes the scraper to print data segments which match given filters.",
    call: printfilterCall,
    numArgs: 0
  },

  "-lf": {redirect: "--limfilter"},
  "--limfilter":
  {
    aliases: ["--limfilter", "-lf"],
    simpleDescription: "Limits the amount of \"matching\" comments",
    description: "An argument which stops the scraper once enough match the filters. Should be defined as a " +
    "positive integer. If this is not defined, the scraper will preform matches without a threshold. NOTE: " +
    "If flag -nrf is present, all replies that are automatically matched will NOT be counted as such.",
    examples: ["--limfilter 50", "-lf=5"],
    call: limfilterCall,
    numArgs: 1
  },

  "-f": {redirect: "--filter"},
  "--filter":
  {
    aliases: ["--filter", "-f"],
    simpleDescription: "Used to filter comments based on attributes",
    description: "Begins a \"filter object,\" where arguments define the filter's attributes. A filter's first " +
    "argument is always an opening bracket, and is later ended by a closing bracket. An indefinite amount " +
    "of filter objects can be created, each with different attributes and properties, to narrow down a search.",
    validValues: {"{": ""},
    examples: ["--filter {", "-f={"],
    call: filterCall,
    numArgs: 1
  },

  "--check":
  {
    aliases: ["--check"],
    simpleDescription: "Filter arg; defines which attribute to check",
    description: "Used exclusively in a filter object; the value entered is the attribute to inspect and filter. " +
    "Values that are listed as \"num\" are numerical; in that case \"match\" must be defined as an integer.",
    validValues: undefined, //Later defined in the register function
    examples: ["--check text", "--check=votes"],
    call: checkCall,
    numArgs: 1
  },

  "--match":
  {
    aliases: ["--match"],
    simpleDescription: "Filter arg; either a string or number to compare",
    description: "Used exclusively in a filter object; the value entered is what to filter the \"check\" value " +
    "by. If check is of str type, the value entered can be any string, but if check is of num type, the value " +
    "must be a valid integer.",
    examples: ["--match \"Song?\"", "--match=75"],
    call: matchCall,
    numArgs: 1
  },

  "--compare":
  {
    aliases: ["--compare"],
    simpleDescription: "Filter arg; how to compare the \"match\" value",
    description: "Used exclusively in a filter object; the value entered specifies how the actual value will be " +
    "compared with the match one. Str and num \"check\" values have different valid values. NOTE: By default, " +
    "not calling the argument will result in a compare value of \"\", meaning, for a num value, compare must be " +
    "defined.",
    validValues: {"in":"If match is located inside value",
                "eq":"If match and value are equal",
                "less":"If value < match",
                "greater":"If value > match",
                "lesseq":"If value <= match",
                "greatereq":"If value >= match"},
    examples: ["--compare \"in\"", "--compare=eq", "--compare greatereq"],
    call: compareCall,
    numArgs: 1
  },

  "-cs": {redirect: "--casesensitive"},
  "--casesensitive":
  {
    aliases: ["--casesensitive, -cs"],
    simpleDescription: "Filter arg; does not ignore case if present",
    description: "Used exclusively in a filter object; a flag that specifies whether the case in a string is " +
    "taken into account during filtering. NOTE: This will do nothing if \"check\" is a num value.",
    call: casesensitiveCall,
    numArgs: 0
  },

  "}":
  {
    aliases: ["}"],
    simpleDescription: "META COMMAND: Ends a filter object",
    description: "Used to close a filter scope. The filter must be closed before the current module is " +
    "either ended or exited.",
    call: closingbracketCall,
    numArgs: 0
  },

  "--ignore":
  {
    aliases: ["--ignore"],
    simpleDescription: "Specifies an attribute to ignore",
    description: "Removes an attribute from \"consideration\" while scraping. This means that the " +
    "attribute will not be saved, printed, and cannot be filtered during execution. May be defined an " +
    "indefinite amount of times, each with a different attribute.",
    validValues: undefined,
    examples: ["--ignore=\"id\"", "--ignore text"],
    call: ignoreCall,
    numArgs: 1
  }

};

//--------------------------------------------------------------------- CLI state modification functions

function savefilterCall(c, a, currentState, innerState, moduleSettings, innerSettings) {

  if (!innerState.inFilter)
    innerSettings.savefilter = true;
  else
    currentState.error = errors.errorCodes(2, c);
}

function printfilterCall(c, a, currentState, innerState, moduleSettings, innerSettings) {

  if (!innerState.inFilter)
    innerSettings.printfilter = true;
  else
    currentState.error = errors.errorCodes(2, c);
}

function limfilterCall(c, a, currentState, innerState, moduleSettings, innerSettings) {

  if (!innerState.inFilter) {
    if (!isNaN(parseInt(a))) {
      a = parseInt(a);
      if (a > 0)
        innerSettings.limfilter = a;
      else
        currentState.error = errors.errorCodes(15, c, a);
    } else
      currentState.error = errors.errorCodes(16, c, a);
  } else
    currentState.error = errors.errorCodes(2, c);
}

function filterCall(c, a, currentState, innerState, moduleSettings, innerSettings) {

  if (!innerState.inFilter) {
    if (a in commands.filter.validValues)
      innerState.inFilter = true;
    else {
      currentState.error = errors.errorCodes(3, c, a);
      helpers.outputValidValues(c, commands.filter.validValues);
    }
  } else
    currentState.error = errors.errorCodes(2, c);
}

function checkCall(c, a, currentState, innerState, moduleSettings, innerSettings) {

  if (innerState.inFilter) {
    if (a in commands.check.validValues) {
      if (!("check" in innerState.currentFilter))
        innerState.currentFilter.check = a;
      else
        currentState.error = errors.errorCodes(5, c);
    } else {
      currentState.error = errors.errorCodes(3, c, a);
      helpers.outputValidValues(c, commands.check.validValues);
    }
  } else
    currentState.error = errors.errorCodes(4, a);
}

function matchCall(c, a, currentState, innerState, moduleSettings, innerSettings) {

  if (innerState.inFilter) {
    if (!("match" in innerState.currentFilter))
      innerState.currentFilter.match = a;
    else
      currentState.error = errors.errorCodes(5, c);
  } else
    currentState.error = errors.errorCodes(4, c);
}

function compareCall(c, a, currentState, innerState, moduleSettings, innerSettings) {

  if (innerState.inFilter) {
    if (!("compare" in innerState.currentFilter)) //In order to reduce complexity, a is checked as a valid value at the end of the filter scope ("}")
      innerState.currentFilter.compare = a;
    else
      currentState.error = errors.errorCodes(5, c);
  } else
    currentState.error = errors.errorCodes(4, c);
}

function casesensitiveCall(c, a, currentState, innerState, moduleSettings, innerSettings) {
  if (innerState.inFilter)
    innerState.currentFilter.caseSensitive = true;
  else
    currentState.error = errors.errorCodes(4, c);
}

function closingbracketCall(c, a, currentState, innerState, moduleSettings, innerSettings) {

  if (!innerState.inFilter) { //Error: Filter not closed
    currentState.error = errors.errorCodes(6, c);
    return;
  }
  if (!("check" in innerState.currentFilter) || !("match" in innerState.currentFilter)) { //Error: Missing commands
    currentState.error = errors.errorCodes(7, c);
    return;
  }
  if (!(innerState.currentFilter.check in commands.check.validValues)) { //Error: Check invalid value
    currentState.error = errors.errorCodes(3, "check", innerState.currentFilter.check);
    helpers.outputValidValues("--check", commands.check.validValues);
    return;
  }

  //Work with different "check" types: string and numerical
  if (commands.check.validValues[innerState.currentFilter.check] === "num") {

    if (!("compare" in innerState.currentFilter)) { //Compare becomes a required command when check is numerical
      currentState.error = errors.errorCodes(8, c, innerState.currentFilter.check);
      return;
    }
    //See if the compare value is valid, and is ONLY valid for a numerical checker (no "in")
    if (!(innerState.currentFilter.compare in commands.compare.validValues) || innerState.currentFilter.compare === "in") {
      currentState.error = errors.errorCodes(9, c, innerState.currentFilter.compare);
      helpers.outputValidValues("--compare", commands.compare.validValues, {"in":""});
      return;
    }
    if (isNaN(parseInt(innerState.currentFilter.match))) { //Error: Match value entered was NaN
      currentState.error = errors.errorCodes(10, c, innerState.currentFilter.match);
      return;
    }

  } else if (commands.check.validValues[innerState.currentFilter.check] === "str") {

    if (!("compare" in innerState.currentFilter)) {
      innerState.currentFilter.compare = "in"; //Compare is not required for a string checker; defaults to in
    
    //See if the compare value is valid, and is ONLY valid for a string checker (only "in" or "eq")
    } else if (!(innerState.currentFilter.compare in commands.compare.validValues) || (innerState.currentFilter.compare !== "eq" && innerState.currentFilter.compare !== "in")) {
      currentState.error = errors.errorCodes(11, c, innerState.currentFilter.compare);
      helpers.outputValidValues("--compare", commands.compare.validValues, {"less":"", "greater":"", "lesseq":"", "greatereq":""});
      return;
    }
    
  }

  //Error: The value for "check" was marked as ignored
  if (!innerSettings.include[innerState.currentFilter.check]) {
    currentState.error = errors.errorCodes(12, c, innerState.currentFilter.check);
    return;
  }

  //No errors
  innerState.usedFilterCheckValues[innerState.currentFilter.check] = "";
  innerSettings.filter.push(innerState.currentFilter);
  innerState.currentFilter = {};
  innerState.inFilter = false;
}

function ignoreCall(c, a, currentState, innerState, moduleSettings, innerSettings) {

  if (!innerState.inFilter) {
    if (a in commands.ignore.validValues) {
      if (!(a in innerState.usedFilterCheckValues))
        innerSettings.include[a] = false;
      else
        currentState.error = errors.errorCodes(12, c, a);
    } else {
      currentState.error = errors.errorCodes(3, c, a);
      helpers.outputValidValues(c, commands.ignore.validValues);
    }
  } else
    currentState.error = errors.errorCodes(2, c);
}

//--------------------------------------------------------------------- "Registration" functions

/**
 * Makes sure both currentState and settings "comply" with the filterable set of commands; used for debugging
 * @param {Object} innerState Represents a tracker of a certain CLI's "state" while running
 * @param {Object} innerSettings Module specific settings to be passed to a scraping function
 */
function verifyFilterable(innerState, innerSettings) {

  let stateError = false; let settingsError = false;

  if (!("usedFilterCheckValues" in innerState && "inFilter" in innerState && "currentFilter" in innerState))
    stateError = true;

  if (!("savefilter" in innerSettings && "printfilter" in innerSettings && "limfilter" in innerSettings && "filter" in innerSettings && "ignore" in innerSettings))
    settingsError = true;
  
  if (stateError && settingsError)
    throw "Error: currentState and settings are incomplete";
  if (stateError)
    throw "Error: currentState is incomplete";
  if (settingsError)
    throw "Error: settings is incomplete";
}

/**
 * Registers a group of commands into the command section of a cmd object. Made to be used by commands.js files to reduce code bloat.
 * @param {Object} attributes Contains names of scraped data as the "keys" and a string representing their type as the data (int, str)
 * @param {Object} cmdCommands The "command" section of a cmd object
 */
function subscribeFilterable(attributes, cmdCommands) {

  for (c in commands) {

    //Shallow copy; shouldn't matter as later code shouldn't modify any embedded objects or arrays in cmd
    cmdCommands[c] = Object.assign({}, commands[c]);
    if (c === "--check" || c === "--ignore")
      cmdCommands[c].validValues = attributes;

  }
}


module.exports.verifyFilterable = verifyFilterable;
module.exports.subscribeFilterable = subscribeFilterable;