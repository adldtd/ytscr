const fs = require("fs");
const path = require("path");
const helpers = require(path.join(__dirname, "..", "..", "..", "common", "helpers"));
const errors = require(path.join(__dirname, "..", "..", "..", "common", "errors"));


  /****************************************************************************/
 /* Arguments + commands and corresponding functions for the comments module */
/****************************************************************************/

var attributes = {"author": "str", //List of data the module will scrape; reused by different commands
                "text": "str",
                "id": "str",
                "published": "str",
                "votes": "num",
                "picture": "str",
                "channel": "str"};


const cmd = {

  commands: {

    ";": {
      aliases: [";"],
      simpleDescription: "META COMMAND: Exits the \"scope\" of a module",
      description: "When typed, exits a module previously specified. This means that the CLI will go back to " +
      "parsing commands and other submodules inside of the video module. In short, it allows the user to " +
      "enter arguments for more than one submodule. NOTE: As only one module may be specified as the first " +
      "argument to the CLI, the video module cannot be exited.",
      examples: ["[module 1] [argument 1] [argument 2] ... ; [module 2] ..."],
      numArgs: 0
    },

    "-h": {redirect: "--help"},
    "--help":
    {
        aliases: ["--help", "-h"],
        simpleDescription: "Displays command information",
        description: "A command which takes in a command/module as the next input. By specifiying a valid " +
        "command, the program will print some info as well as the usability of that cmd. All modules have their " +
        "own help commands, which can be accessed by typing \"ytscr [module] [module] --help\".",
        examples: ["--help --newest"],
        numArgs: 1
    },

    "-new": {redirect: "--newest"},
    "--newest":
    {
        aliases: ["--newest", "-new"],
        simpleDescription: "Searches newest comments first",
        description: "Sets \"SORT BY\" to \"newest first.\" NOTE: Pinned comments will still appear at the top, " +
        "regardless of date.",
        call: newestCall,
        numArgs: 0
    },

    "-sf": {redirect: "--savefilter"},
    "--savefilter":
    {
        aliases: ["--savefilter", "-sf"],
        simpleDescription: "Only saves filter matches",
        description: "A flag that restricts the scraper to saving a comment ONLY IF it matches the user given " +
        "filters. If no filters are specified, then every comment will be saved (as usual).",
        call: savefilterCall,
        numArgs: 0
    },

    "-pf": {redirect: "--printfilter"},
    "--printfilter":
    {
        aliases: ["--printfilter", "-pf"],
        simpleDescription: "Prints out filter matches",
        description: "A flag that causes the scraper to print comments which match given filters.",
        call: printfilterCall,
        numArgs: 0
    },

    "-norp": {redirect: "--noreply"},
    "--noreply":
    {
        aliases: ["--noreply", "-norp"],
        simpleDescription: "Stops the program from considering replies",
        description: "When present, the program will not collect/print any replies to a comment.",
        call: noreplyCall,
        numArgs: 0
    },

    "-nrf":
    {
        aliases: ["-nrf"],
        simpleDescription: "Enters a special mode where replies are unfiltered",
        description: "As standard, the scraper applies filters to both comments and replies. When this flag is " +
        "present, however, if the program \"matches\" a comment, it will automatically match all of its replies. " +
        "If the comment fails the filter, it will still try to match its replies, one by one. This flag may " +
        "be useful when searching for questions - as well as answers - on a YouTube video.",
        call: nrfCall,
        numArgs: 0
    },

    "-l": {redirect: "--lim"},
    "--lim":
    {
        aliases: ["--lim", "-l"],
        simpleDescription: "Limits the amount of comments scraped",
        description: "An argument which stops the scraper once a certain threshold is reached. Should be defined " +
        "as a positive integer. If this argument is not present, the scraper will not stop until all comments are " +
        "retrieved. NOTE: The value entered limits the scraper based on how many comments were checked, " +
        "not how many matched the filters (see limfilter).",
        examples: ["--lim 100", "-l=27"],
        call: limCall,
        numArgs: 1
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
        validValues: attributes,
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
        simpleDescription: "Specifies a comment attribute to ignore",
        description: "Removes a comment attribute from \"consideration\" while scraping. This means that the " +
        "attribute will not be saved, printed, and cannot be filtered during execution. May be defined an " +
        "indefinite amount of times, each with a different attribute.",
        validValues: attributes,
        examples: ["--ignore=\"id\"", "--ignore text"],
        call: ignoreCall,
        numArgs: 1
    }

  }

};
var commands = cmd.commands;


function newestCall(c, a, currentState, innerState, settings) {

  if (!innerState.inFilter)
    settings.comments.newestFirst = true;
  else
    currentState.error = errors.errorCodes(2, c);
}

function savefilterCall(c, a, currentState, innerState, settings) {

  if (!innerState.inFilter)
    settings.comments.saveOnlyMatch = true;
  else
    currentState.error = errors.errorCodes(2, c);
}

function printfilterCall(c, a, currentState, innerState, settings) {

  if (!innerState.inFilter)
    settings.comments.logMatch = true;
  else
    currentState.error = errors.errorCodes(2, c);
}

function noreplyCall(c, a, currentState, innerState, settings) {

  if (!innerState.inFilter)
    settings.comments.useReplies = false;
  else
    currentState.error = errors.errorCodes(2, c);
}

function nrfCall(c, a, currentState, innerState, settings) {

  if (!innerState.inFilter)
    settings.comments.replyFiltering = false;
  else
    currentState.error = errors.errorCodes(2, c);
}

function limCall(c, a, currentState, innerState, settings) {

  if (!innerState.inFilter) {
    if (!isNaN(parseInt(a))) {
      a = parseInt(a);
      if (a > 0)
        settings.comments.limit = a;
      else
        currentState.error = errors.errorCodes(15, c, a);
    } else
      currentState.error = errors.errorCodes(16, c, a);
  } else
    currentState.error = errors.errorCodes(2, c);
}

function limfilterCall(c, a, currentState, innerState, settings) {

  if (!innerState.inFilter) {
    if (!isNaN(parseInt(a))) {
      a = parseInt(a);
      if (a > 0)
        settings.comments.limit = a;
      else
        currentState.error = errors.errorCodes(15, c, a);
    } else
      currentState.error = errors.errorCodes(16, c, a);
  } else
    currentState.error = errors.errorCodes(2, c);
}

function filterCall(c, a, currentState, innerState, settings) {

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

function checkCall(c, a, currentState, innerState, settings) {

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

function matchCall(c, a, currentState, innerState, settings) {

  if (innerState.inFilter) {
    if (!("match" in innerState.currentFilter))
      innerState.currentFilter.match = a;
    else
      currentState.error = errors.errorCodes(5, c);
  } else
    currentState.error = errors.errorCodes(4, c);
}

function compareCall(c, a, currentState, innerState, settings) {

  if (innerState.inFilter) {
    if (!("compare" in innerState.currentFilter)) //In order to reduce complexity, a is checked as a valid value at the end of the filter scope ("}")
      innerState.currentFilter.compare = a;
    else
      currentState.error = errors.errorCodes(5, c);
  } else
    currentState.error = errors.errorCodes(4, c);
}

function casesensitiveCall(c, a, currentState, innerState, settings) {
  if (innerState.inFilter)
    innerState.currentFilter.caseSensitive = true;
  else
    currentState.error = errors.errorCodes(4, c);
}

function closingbracketCall(c, a, currentState, innerState, settings) {

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
  if (!settings.comments.include[innerState.currentFilter.check]) {
    currentState.error = errors.errorCodes(12, c, innerState.currentFilter.check);
    return;
  }

  //No errors
  innerState.usedFilterCheckValues[innerState.currentFilter.check] = "";
  settings.comments.selectors.push(innerState.currentFilter);
  innerState.currentFilter = {};
  innerState.inFilter = false;
}

function ignoreCall(c, a, currentState, innerState, settings) {

  if (!innerState.inFilter) {
    if (a in commands.ignore.validValues) {
      if (!(a in innerState.usedFilterCheckValues))
        settings.comments.include[a] = false;
      else
        currentState.error = errors.errorCodes(12, c, a);
    } else {
      currentState.error = errors.errorCodes(3, c, a);
      helpers.outputValidValues(c, commands.ignore.validValues);
    }
  } else
    currentState.error = errors.errorCodes(2, c);
}


module.exports.cmd = cmd;