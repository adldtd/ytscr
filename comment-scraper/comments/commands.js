const fs = require("fs");


  /****************************************************************************/
 /* Arguments + commands and corresponding functions for the comments module */
/****************************************************************************/


const cmd = {

  "help":
  {
    aliases: ["help"],
    simpleDescription: "Displays argument information",
    description: "A command which takes in an argument name as the next input. By specifiying a valid argument, " +
    "the program will print info, as well as the usability of that arg.",
    examples: ["help input", "help -nrf"],
    call: helpCall
  },

  "i": {redirect: "input"},
  "input":
  {
    aliases: ["input", "i"],
    simpleDescription: "A YouTube video link",
    description: "Specifies the video link from where to scrape comments. Can either be a normal YouTube link, " +
    "a shorts link, a \"youtu.be\" link, or a video ID.",
    examples: ["input=https://www.youtube.com/watch?v=jNQXAC9IVRw", "i=youtu.be/jNQXAC9IVRw", "i=jNQXAC9IVRw"],
    call: inputCall
  },

  "-new": {redirect: "-newest"},
  "-newest":
  {
    aliases: ["-newest", "-new"],
    simpleDescription: "Searches newest comments first",
    description: "Sets \"SORT BY\" to \"newest first.\" NOTE: Pinned comments will still appear at the top, " +
    "regardless of date.",
    call: newestCall
  },

  "-NS": {redirect: "-nosave"},
  "-nosave":
  {
    aliases: ["-nosave", "-NS"],
    simpleDescription: "Disables file saves",
    description: "When present, prevents the scraper from saving the scraped content.",
    call: nosaveCall
  },

  "-np": {redirect: "-nopretty"},
  "-nopretty":
  {
    aliases: ["-nopretty", "-np"],
    simpleDescription: "Disables pretty printing",
    description: "When present, this stops the scraper from nicely formatting the saved JSON. Tends to save a " +
    "little bit of space.",
    call: noprettyCall
  },

  "-sf": {redirect: "-savefilter"},
  "-savefilter":
  {
    aliases: ["-savefilter", "-sf"],
    simpleDescription: "Only saves filter matches",
    description: "A flag that restricts the scraper to saving a comment ONLY IF it matches the user given " +
    "filters. If no filters are specified, then every comment will be saved (as usual).",
    call: savefilterCall
  },

  "-pf": {redirect: "-printfilter"},
  "-printfilter":
  {
    aliases: ["-printfilter", "-pf"],
    simpleDescription: "Prints out filter matches",
    description: "A flag that causes the scraper to print comments which match given filters.",
    call: printfilterCall
  },

  "-NR": {redirect: "-noreply"},
  "-noreply":
  {
    aliases: ["-noreply", "-NR"],
    simpleDescription: "Stops the program from considering replies",
    description: "When present, the program will not collect/print any replies to a comment.",
    call: noreplyCall
  },

  "-nrf":
  {
    aliases: ["-nrf"],
    simpleDescription: "Enters a special mode where replies are unfiltered",
    description: "As standard, the scraper applies filters to both comments and replies. When this flag is " +
    "present, however, if the program \"matches\" a comment, it will automatically match all of its replies. " +
    "If the comment fails the filter, it will still try to match its replies, one by one. This flag may " +
    "be useful when searching for questions - as well as answers - on a YouTube video.",
    call: nrfCall
  },

  "l": {redirect: "lim"},
  "lim":
  {
    aliases: ["lim", "l"],
    simpleDescription: "Limits the amount of comments scraped",
    description: "An argument which stops the scraper once a certain threshold is reached. Should be defined " +
    "as a positive integer. If this argument is not present, the scraper will not stop until all comments are " +
    "retrieved. NOTE: The value entered limits the scraper based on how many comments were checked, " +
    "not how many matched the filters (see limfilter).",
    examples: ["lim=100", "l=27"],
    call: limCall
  },

  "lf": {redirect: "limfilter"},
  "limfilter":
  {
    aliases: ["limfilter", "lf"],
    simpleDescription: "Limits the amount of \"matching\" comments",
    description: "An argument which stops the scraper once enough match the filters. Should be defined as a " +
    "positive integer. If this is not defined, the scraper will preform matches without a threshold. NOTE: " +
    "If flag -nrf is present, all replies that are automatically matched will NOT be counted as such.",
    examples: ["limfilter=50", "lf=5"],
    call: limfilterCall
  },

  "f": {redirect: "filter"},
  "filter":
  {
    aliases: ["filter", "f"],
    simpleDescription: "Used to filter comments based on attributes",
    description: "Begins a \"filter object,\" where arguments define the filter's attributes. A filter's first " +
    "argument is always an opening bracket, and is later ended by a closing bracket. An indefinite amount " +
    "of filter objects can be created, each with different attributes and properties, to narrow down a search.",
    validValues: {"{": ""},
    examples: ["filter={"],
    call: filterCall
  },

  "check":
  {
    aliases: ["check"],
    simpleDescription: "Filter arg; defines which attribute to check",
    description: "Used exclusively in a filter object; the value entered is the attribute to inspect and filter. " +
    "Values that are listed as \"num\" are numerical; in that case \"match\" must be defined as an integer.",
    validValues: {"author": "str", "text": "str", "id": "str", "published": "str", "votes": "num", "picture": "str", "channel": "str"},
    examples: ["check=text", "check=votes"],
    call: checkCall
  },

  "match":
  {
    aliases: ["match"],
    simpleDescription: "Filter arg; either a string or number to compare",
    description: "Used exclusively in a filter object; the value entered is what to filter the \"check\" value " +
    "by. If check is of str type, the value entered can be any string, but if check is of num type, the value " +
    "must be a valid integer.",
    examples: ["match=\"Song?\"", "match=75"],
    call: matchCall
  },

  "compare":
  {
    aliases: ["compare"],
    simpleDescription: "Filter arg; how to compare the \"match\" value",
    description: "Used exclusively in a filter object; the value entered specifies how the actual value will be " +
    "compared with the match one. Str and num \"check\" values have different valid values. NOTE: By default, " +
    "not calling the argument will result in a compare value of \"\", meaning, for a num value, compare must be " +
    "defined.",
    validValues: {"":"", "=":"", "<":"", ">":"", "<=":"", ">=":""},
    examples: ["compare=\"=\"", "compare=", "compare=>="],
    call: compareCall
  },

  "-cs": {redirect: "-casesensitive"},
  "-casesensitive":
  {
    aliases: ["-casesensitive, -cs"],
    simpleDescription: "Filter arg; does not ignore case if present",
    description: "Used exclusively in a filter object; a flag that specifies whether the case in a string is " +
    "taken into account during filtering. NOTE: This will do nothing if \"check\" is a num value.",
    call: casesensitiveCall
  },

  "}":
  {
    call: closingbracketCall
  },

  "ignore":
  {
    aliases: ["ignore"],
    simpleDescription: "Specifies a comment attribute to ignore",
    description: "Removes a comment attribute from \"consideration\" while scraping. This means that the " +
    "attribute will not be saved, printed, and cannot be filtered during execution. May be defined an " +
    "indefinite amount of times, each with a different attribute.",
    validValues: {"author":"", "text":"", "id":"", "published":"", "votes":"", "picture":"", "channel":""},
    examples: ["ignore=\"id\"", "ignore=text"],
    call: ignoreCall
  },

  "d": {redirect: "dest"},
  "dest":
  {
    aliases: ["dest", "d"],
    simpleDescription: "The folder where to save scraped comments",
    description: "Specifies the folder where the saved comments are placed. The directory must exist and must be " +
    "accessible by the scraper. By default, the script will place the file in its residing directory.",
    examples: ["dest=\"C:/Users\"", "d=D:/MyFiles"],
    call: destCall
  }

};



function helpCall(a, v, settings, currentState, i) {
  if (i === 3) {
    currentState.helpCMD = true;
  } else
    currentState.err = errorCodes(50, a);
}

function inputCall(a, v, settings, currentState) {

  if (!currentState.inFilter) {
    if (settings.url === "") {
      
      if (v.substring(0, 32) === "https://www.youtube.com/watch?v=" || v.substring(0, 24) === "www.youtube.com/watch?v=" || v.substring(0, 20) === "youtube.com/watch?v=") {
        settings.url = v;
      } else if (v.substring(0, 31) === "https://www.youtube.com/shorts/" || v.substring(0, 23) === "www.youtube.com/shorts/" || v.substring(0, 19) === "youtube.com/shorts/") {
        settings.url = "https://youtube.com/watch?v=" + v.split("shorts/", 2)[1]; //YouTube shorts are converted to videos this way
      } else if (v.substring(0, 17) === "https://youtu.be/" || v.substring(0, 9) === "youtu.be/") {
        settings.url = "https://youtube.com/watch?v=" + v.split(".be/", 2)[1];
      } else if (v.length === 11) { //Pure video ID
        settings.url = "https://youtube.com/watch?v=" + v;
      } else
        currentState.err = errorCodes(-2, a, v);
        
    } else
      currentState.err = errorCodes(-1, a);
  } else
    currentState.err = errorCodes(2, a);
}

function newestCall(a, v, settings, currentState) {
  if (!currentState.inFilter)
    settings.newestFirst = true;
  else
    currentState.err = errorCodes(2, a);
}

function nosaveCall(a, v, settings, currentState) {
  if (!currentState.inFilter)
    settings.save = false;
  else
    currentState.err = errorCodes(2, a);
}

function noprettyCall(a, v, settings, currentState) {
  if (!currentState.inFilter)
    settings.prettyPrint = false;
  else
    currentState.err = errorCodes(2, a);
}

function savefilterCall(a, v, settings, currentState) {
  if (!currentState.inFilter)
    settings.saveOnlyMatch = true;
  else
    currentState.err = errorCodes(2, a);
}

function printfilterCall(a, v, settings, currentState) {
  if (!currentState.inFilter)
    settings.logMatch = true;
  else
    currentState.err = errorCodes(2, a);
}

function noreplyCall(a, v, settings, currentState) {
  if (!currentState.inFilter)
    settings.useReplies = false;
  else
    currentState.err = errorCodes(2, a);
}

function nrfCall(a, v, settings, currentState) {
  if (!currentState.inFilter)
    settings.replyFiltering = false;
  else
    currentState.err = errorCodes(2, a);
}

function limCall(a, v, settings, currentState) {

  if (!currentState.inFilter) {
    if (!isNaN(parseInt(v))) {
      v = parseInt(v);
      if (v > 0)
        settings.limit = v;
      else
        currentState.err = errorCodes(15, a, v);
    } else
      currentState.err = errorCodes(16, a, v);
  } else
    currentState.err = errorCodes(2, a);
}

function limfilterCall(a, v, settings, currentState) {

  if (!currentState.inFilter) {
    if (!isNaN(parseInt(v))) {
      v = parseInt(v);
      if (v > 0)
        settings.limitMatch = v;
      else
        currentState.err = errorCodes(15, a, v);
    } else
      currentState.err = errorCodes(16, a, v);
  } else
    currentState.err = errorCodes(2, a);
}

function filterCall(a, v, settings, currentState) {

  if (!currentState.inFilter) {
    if (v in cmd.filter.validValues)
      currentState.inFilter = true;
    else {
      currentState.err = errorCodes(3, a, v);
      outputValidValues(a, cmd.filter.validValues);
    }
  } else
    currentState.err = errorCodes(2, a);
}

function checkCall(a, v, settings, currentState) {

  if (currentState.inFilter) {
    if (v in cmd.check.validValues) {
      if (!("check" in currentState.currentFilter))
        currentState.currentFilter.check = v;
      else
        currentState.err = errorCodes(5, a);
    } else {
      currentState.err = errorCodes(3, a, v);
      outputValidValues(a, cmd.check.validValues);
    }
  } else
    currentState.err = errorCodes(4, a);
}

function matchCall(a, v, settings, currentState) {

  if (currentState.inFilter) {
    if (!("match" in currentState.currentFilter))
      currentState.currentFilter.match = v;
    else
      currentState.err = errorCodes(5, a);
  } else
    currentState.err = errorCodes(4, a);
}

function compareCall(a, v, settings, currentState) {
  if (currentState.inFilter) {
    if (!("compare" in currentState.currentFilter)) //In order to reduce complexity, v is checked as a valid value at the end of the filter scope ("}")
      currentState.currentFilter.compare = v;
    else
      currentState.err = errorCodes(5, a);
  } else
    currentState.err = errorCodes(4, a);
}

function casesensitiveCall(a, v, settings, currentState) {
  if (currentState.inFilter)
    currentState.currentFilter.caseSensitive = true;
  else
    currentState.err = errorCodes(4, a);
}

function closingbracketCall(a, v, settings, currentState) {

  if (!currentState.inFilter) {
    currentState.err = errorCodes(6, a);
    return;
  }
  if (!("check" in currentState.currentFilter) || !("match" in currentState.currentFilter)) {
    currentState.err = errorCodes(7, a);
    return;
  }
  if (!(currentState.currentFilter.check in cmd.check.validValues)) {
    currentState.err = errorCodes(3, "check", currentState.currentFilter.check);
    outputValidValues("check", cmd.check.validValues);
    return;
  }

  if (cmd.check.validValues[currentState.currentFilter.check] === "num") {

    if (!("compare" in currentState.currentFilter)) {
      currentState.err = errorCodes(8, a, currentState.currentFilter.check);
      return;
    }
    if (!(currentState.currentFilter.compare in cmd.compare.validValues) || currentState.currentFilter.compare === "") {
      currentState.err = errorCodes(9, a, currentState.currentFilter.compare);
      outputValidValues("compare", cmd.compare.validValues, {"":""});
      return;
    }
    if (isNaN(parseInt(currentState.currentFilter.match))) {
      currentState.err = errorCodes(10, a, currentState.currentFilter.match);
      return;
    }

  } else if (cmd.check.validValues[currentState.currentFilter.check] === "str") {

    if (!("compare" in currentState.currentFilter))
      currentState.currentFilter.compare = ""; //Default value
    else if (!(currentState.currentFilter.compare in cmd.compare.validValues) || (currentState.currentFilter.compare !== "=" && currentState.currentFilter.compare !== "")) {
      currentState.err = errorCodes(11, a, currentState.currentFilter.compare);
      outputValidValues("compare", cmd.compare.validValues, {"<":"", ">":"", "<=":"", ">=":""});
      return;
    }
    
  }
  if (currentState.currentFilter.check in settings.include && !settings.include[currentState.currentFilter.check]) {
    currentState.err = errorCodes(12, a, currentState.currentFilter.check);
    return;
  }

  currentState.usedFilterCheckValues[currentState.currentFilter.check] = "";
  settings.selectors.push(currentState.currentFilter);
  currentState.currentFilter = {};
  currentState.inFilter = false;
}

function ignoreCall(a, v, settings, currentState) {

  if (!currentState.inFilter) {
    if (v in cmd.ignore.validValues) {
      if (!(v in currentState.usedFilterCheckValues))
        settings.include[v] = false;
      else
        currentState.err = errorCodes(12, a, v);
    } else {
      currentState.err = errorCodes(3, a, v);
      outputValidValues(a, cmd.ignore.validValues);
    }
  } else
    currentState.err = errorCodes(2, a);
}

function destCall(a, v, settings, currentState) {

  if (!currentState.inFilter) {
    if (fs.existsSync(v)) {
      if (settings.destination === "")
        settings.destination = v;
      else
        currentState.err = errorCodes(13, a);
    } else
      currentState.err = errorCodes(14, a);
  } else
    currentState.err = errorCodes(2, a);
}



function errorCodes(code, arg, value = "") {
  
  switch(code) {

    case -2: //Bad link
      console.log("Error: Invalid youtube link \"" + value + "\"");
      break;
    case -1: //Multiple inputs
      console.log("Error: Must specify only one input link");
      break;
    
    case 2: //Non-filter argument
      console.log("Error: Argument \"" + arg + "\" is invalid inside of a filter");
      break;
    case 3: //Invalid value
      console.log("Error: Value \"" + value + "\" is invalid for argument \"" + arg + "\"");
      break;
    case 4: //Filter argument misplaced
      console.log("Error: Argument \"" + arg + "\" is invalid outside of a filter");
      break;
    case 5: //Multiple in filter
      console.log("Error: Multiple occurences of argument \"" + arg + "\" not allowed inside of a filter");
      break;
    case 6: //Misplaced bracket
      console.log("Error: Extraneous filter ending bracket \"}\"");
      break;
    case 7: //Check and match required
      console.log("Error: Arguments \"check\" and \"match\" required in a filter");
      break;
    case 8: //Compare required for numerical
      console.log("Error: Argument \"compare\" required for numerical checker \"" + value + "\"");
      break;
    case 9: //Invalid compare value for numerical
      console.log("Error: Value \"" + value + "\" for compare incompatible with a numerical checker");
      break;
    case 10: //Non-numerical match value
      console.log("Error: Value \"" + value + "\" cannot be evaluated as an integer for a numerical checker");
      break;
    case 11: //Invalid compare value for string
      console.log("Error: Value \"" + value + "\" for compare incompatible with a string checker");
      break;
    case 12: //Filter ignore conflict
      console.log("Error: Check value \"" + value + "\" cannot be used in a filter and also be ignored");
      break;
    case 13: //Multiple output destinations
      console.log("Error: Must specify only one output destination");
      break;
    case 14: //Invalid destination
      console.log("Error: Folder/file destination not found");
      break;
    case 15: //Value has to be non-zero natural
      console.log("Error: Value \"" + value + "\" is required to be positive by argument \"" + arg + "\"");
      break;
    case 16: //Not a number
      console.log("Error: Value \"" + value + "\" cannot be evaluated as an integer for argument \"" + arg + "\"");
      break;

    case 50: //Starting command
      console.log("Error: Command \"" + arg + "\" must be specified at the start of the call");
      break;
    case 51: //Extra args
      console.log("Error: Extraneous arguments for command \"" + arg + "\"");
      break;

    case 99: //Bad arg
      console.log("Error: Invalid argument \"" + arg + "\"");
      break;

    case 100: //No input specified
      console.log("Error: No input link specified");
      break;
    case 101: //Bracket unclosed
      console.log("Error: Filter unclosed; needs an ending bracket \"}\"");
      break;
  }

  return true;
}



module.exports.cmd = cmd;
module.exports.errorCodes = errorCodes;