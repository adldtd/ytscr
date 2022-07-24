const fs = require("fs");


var url = "";
var destination = "";
var settings = {selectors: [], include: {}};


const cmd = {

  "i": {redirect: "input"},
  "input":
  {
    aliases: ["i"],
    simpleDescription: "A YouTube video link",
    description: "Specifies the video link from where to scrape comments.",
    examples: ["input=https://www.youtube.com/watch?v=jNQXAC9IVRw", "i=www.youtube.com/watch?v=jNQXAC9IVRw"]
  },

  "-NS": {redirect: "-nosave"},
  "-nosave":
  {
    aliases: ["-NS"],
    simpleDescription: "Disables file saves",
    description: "When present, prevents the scraper from saving the scraped content."
  },

  "-sf": {redirect: "-savefilter"},
  "-savefilter":
  {
    aliases: ["-sf"],
    simpleDescription: "Only saves filter matches",
    description: "A flag that restricts the scraper to saving a comment ONLY IF it matches the user given " +
    "filters. If no filters are specified, then every comment will be saved (as usual)."
  },

  "-pf": {redirect: "-printfilter"},
  "-printfilter":
  {
    aliases: ["-pf"],
    simpleDescription: "Prints out filter matches",
    description: "A flag that causes the scraper to print comments which match given filters."
  },

  "-NR": {redirect: "-noreply"},
  "-noreply":
  {
    aliases: ["-NR"],
    simpleDescription: "Stops the program from considering replies",
    description: "When present, the program will not collect/print any replies to a comment."
  },

  "-nrf":
  {
    simpleDescription: "Enters a special mode where replies are unfiltered",
    description: "As standard, the scraper applies filters to both comments and replies. When this flag is " +
    "present, however, if the program \"matches\" a comment, it will automatically match all of its replies. " +
    "If the comment fails the filter, it will still try to match its replies, one by one. This flag may " +
    "be useful when searching for questions - as well as answers - on a YouTube video."
  },

  "l": {redirect: "lim"},
  "lim":
  {
    aliases: ["l"],
    simpleDescription: "Limits the amount of comments scraped",
    description: "An argument which stops the scraper once a certain threshold is reached. Should be defined " +
    "as a positive integer. If this argument is not present, the scraper will not stop until all comments are " +
    "retrieved. NOTE: The value entered limits the scraper based on how many comments were checked, " +
    "not how many matched the filters (see limfilter).",
    examples: ["lim=100", "l=27"]
  },

  "lf": {redirect: "limfilter"},
  "limfilter":
  {
    aliases: ["lf"],
    simpleDescription: "Limits the amount of \"matching\" comments",
    description: "An argument which stops the scraper once enough match the filters. Should be defined as a " +
    "positive integer. If this is not defined, the scraper will preform matches without a threshold. NOTE: " +
    "If flag -nrf is present, all replies that are automatically matched will NOT be counted as such.",
    examples: ["limfilter=50", "lf=5"]
  },

  "f": {redirect: "filter"},
  "filter":
  {
    aliases: ["f"],
    simpleDescription: "Used to filter comments based on attributes",
    description: "Begins a \"filter object,\" where arguments define the filter's attributes. A filter's first " +
    "argument is always an opening bracket \"{\", and is later ended by a closing bracket. An indefinite amount " +
    "of filter objects can be created, each with different attributes and properties, to narrow down a search.",
    validValues: {"{": ""},
    examples: ["filter={"]
  },

  "check":
  {
    simpleDescription: "Filter arg; defines which attribute to check",
    description: "Used exclusively in a filter object; the value entered is the attribute to inspect and filter. " +
    "Values that are listed as \"num\" are numerical; in that case \"match\" must be defined as an integer.",
    validValues: {"author": "str", "text": "str", "published": "str", "votes": "num"},
    examples: ["check=text", "check=votes"]
  },

  "match":
  {
    simpleDescription: "Filter arg; either a string or number to compare",
    description: "Used exclusively in a filter object; the value entered is what to filter the \"check\" value " +
    "by. If check is of str type, the value entered can be any string, but if check is of num type, the value " +
    "must be a valid integer.",
    examples: ["match=\"Song?\"", "match=75"]
  },

  "compare":
  {
    simpleDescription: "Filter arg; how to compare the \"match\" value",
    description: "Used exclusively in a filter object; the value entered specifies how the actual value will be " +
    "compared with the match one. Str and num \"check\" values have different valid values. NOTE: By default, " +
    "not calling the argument will result in a compare value of \"\", meaning, for a num value, compare must be" +
    "defined.",
    validValues: {"":"", "=":"", "<":"", ">":"", "<=":"", ">=":""},
    examples: ["compare=\"=\"", "compare=", "compare=>="]
  },

  "-cs": {redirect: "-casesensitive"},
  "-casesensitive":
  {
    aliases: ["-cs"],
    simpleDescription: "Filter arg; does not ignore case if present",
    description: "Used exclusively in a filter object; a flag that specifies whether the case in a string is " +
    "taken into account during filtering. NOTE: This will do nothing if \"check\" is a num value."
  },

  "}":
  {

  },

  "ignore":
  {
    simpleDescription: "Specifies a comment attribute to ignore",
    description: "Removes a comment attribute from \"consideration\" while scraping. This means that the " +
    "attribute will not be saved, printed, and cannot be filtered during execution. May be defined an " +
    "indefinite amount of times, each with a different attribute.",
    validValues: {"author":"", "text":"", "id":"", "published":"", "votes":""},
    examples: ["ignore=\"id\"", "ignore=text"]
  },

  "d": {redirect: "dest"},
  "dest":
  {
    aliases: ["d"],
    simpleDescription: "The folder where to save scraped comments",
    description: "Specifies the folder where the saved comments are placed. The directory must exist and must be " +
    "accessible by the scraper. By default, the script will place the file in its residing directory.",
    examples: ["dest=\"C:/Users\"", "d=D:/MyFiles"]
  }

};

/*
* Settings:
*   url: input=, i=
*   save: -nosave, -NS
*   saveOnlyMatch: -savefilter, -sf
*   logMatch: -printfilter, -pf
*   useReplies: -noreply, -NR
*   replyFiltering: -nrf ***Enters a mode where the filter ignores replies ONLY IF the recipient comment matches the filter
*   limit: lim=, l=
*   limitMatch: limfilter=, lf=
*   selectors: filter=, f=
*     : {}
*       check: check=
*       match: match=
*       compare: compare=
*       caseSensitive: -casesensitive, -cs
*   include: ignore=
*   destination: dest=, d=
*/

const filterValidValues = {"{": ""};
const checkValidValues = {"author": "str", "text": "str", "published": "str", "votes": "num"};
const compareValidValues = {"":"", "=":"", "<":"", ">":"", "<=":"", ">=":""};
const includeValidValues = {"author":"", "text":"", "id":"", "published":"", "votes":""};


function cli (args) {

  url = "";
  destination = "";
  settings = {selectors: [], include: {}};

  let currentState = //Used to pass CLI tracking variables to individual CLI functions
  {
    usedFilterCheckValues: {}, //Used to track collisions with ignore
    inFilter: false,
    currentFilter: {},
    err: false //Stops the CLI if made true
  };

  for (let i = 2; i < args.length; i++) {

    let a = ""; let v = "";
    let ind = args[i].indexOf("=");
    
    if (ind !== -1) {
      a = args[i].slice(0, ind);
      v = args[i].slice(ind + 1, args[i].length);
    } else
      a = args[i];


    switch (a) {

      case "input":
      case "i":
        if (!currentState.inFilter) {
          if (url === "") {
            if (v.substring(0, 32) === "https://www.youtube.com/watch?v=" || v.substring(0, 24) === "www.youtube.com/watch?v=") {
              url = v;
            } else
              currentState.err = errorCodes(-2, a, v);
          } else
            currentState.err = errorCodes(-1, a);
        } else
          currentState.err = errorCodes(2, a);
        break;


      case "-nosave":
      case "-NS":
        if (!currentState.inFilter)
          settings.save = false;
        else
          currentState.err = errorCodes(2, a);
        break;


      case "-savefilter":
      case "-sf":
        if (!currentState.inFilter)
          settings.saveOnlyMatch = true;
        else
          currentState.err = errorCodes(2, a);
        break;
      

      case "-printfilter":
      case "-pf":
        if (!currentState.inFilter)
          settings.logMatch = true;
        else
          currentState.err = errorCodes(2, a);
        break;

      
      case "-noreply":
      case "-NR":
        if (!currentState.inFilter)
          settings.useReplies = false;
        else
          currentState.err = errorCodes(2, a);
        break;

      
      case "-nrf":
        if (!currentState.inFilter)
          settings.replyFiltering = false;
        else
          currentState.err = errorCodes(2, a);
        break;

      
      case "lim":
      case "l":
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
        break;


      case "limfilter":
      case "lf":
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
        break;


      case "filter":
      case "f":
        if (!currentState.inFilter) {
          if (v in filterValidValues)
            currentState.inFilter = true;
          else {
            currentState.err = errorCodes(3, a, v);
            outputValidValues(a, filterValidValues);
          }
        } else
          currentState.err = errorCodes(2, a);
        break;


      case "check":
        if (currentState.inFilter) {
          if (v in checkValidValues) {
            if (!("check" in currentState.currentFilter))
              currentState.currentFilter.check = v;
            else
              currentState.err = errorCodes(5, a);
          } else {
            currentState.err = errorCodes(3, a, v);
            outputValidValues(a, checkValidValues);
          }
        } else
          currentState.err = errorCodes(4, a);
        break;


      case "match":
        if (currentState.inFilter) {
          if (!("match" in currentState.currentFilter))
            currentState.currentFilter.match = v;
          else
            currentState.err = errorCodes(5, a);
        } else
          currentState.err = errorCodes(4, a);
        break;


      case "compare":
        if (currentState.inFilter) {
          if (!("compare" in currentState.currentFilter)) //In order to reduce complexity, v is checked as a valid value at the end of the filter scope ("}")
            currentState.currentFilter.compare = v;
          else
            currentState.err = errorCodes(5, a);
        } else
          currentState.err = errorCodes(4, a);
        break;

        
      case "-casesensitive": //The program ignores this prompt if entered alongside a "numerical" match like votes
      case "-cs":
        if (currentState.inFilter)
          currentState.currentFilter.caseSensitive = true;
        else
          currentState.err = errorCodes(4, a);
        break;


      case "}": //Ends a filter scope
        if (!currentState.inFilter) {
          currentState.err = errorCodes(6, a);
          break;
        }
        if (!("check" in currentState.currentFilter) || !("match" in currentState.currentFilter)) {
          currentState.err = errorCodes(7, a);
          break;
        }
        if (checkValidValues[currentState.currentFilter.check] === "num") {

          if (!("compare" in currentState.currentFilter)) {
            currentState.err = errorCodes(8, a, currentState.currentFilter.check);
            break;
          }
          if (!(currentState.currentFilter.compare in compareValidValues) || currentState.currentFilter.compare === "") {
            currentState.err = errorCodes(9, a, currentState.currentFilter.compare);
            outputValidValues("compare", compareValidValues, {"":""});
            break;
          }
          if (isNaN(parseInt(currentState.currentFilter.match))) {
            currentState.err = errorCodes(10, a, currentState.currentFilter.match);
            break;
          }

        } else if (checkValidValues[currentState.currentFilter.check] === "str") {

          if (!("compare" in currentState.currentFilter))
            currentState.currentFilter.compare = ""; //Default value
          else if (!(currentState.currentFilter.compare in compareValidValues) || (currentState.currentFilter.compare !== "=" && currentState.currentFilter.compare !== "")) {
            currentState.err = errorCodes(11, a, currentState.currentFilter.compare);
            outputValidValues("compare", compareValidValues, {"<":"", ">":"", "<=":"", ">=":""});
            break;
          }
          
        }
        if (currentState.currentFilter.check in settings.include && !settings.include[currentState.currentFilter.check]) {
          currentState.err = errorCodes(12, a, currentState.currentFilter.check);
          break;
        }

        currentState.usedFilterCheckValues[currentState.currentFilter.check] = "";
        settings.selectors.push(currentState.currentFilter);
        currentState.currentFilter = {};
        currentState.inFilter = false;
        break;
      
      
      case "ignore":
        if (!currentState.inFilter) {
          if (v in includeValidValues) {
            if (!(v in currentState.usedFilterCheckValues))
              settings.include[v] = false;
            else
              currentState.err = errorCodes(12, a, v);
          } else {
            currentState.err = errorCodes(3, a, v);
            outputValidValues(a, includeValidValues);
          }
        } else
          currentState.err = errorCodes(2, a);
        break;
      
      
      case "dest":
      case "d":
        if (!currentState.inFilter) {
          if (fs.existsSync(v)) {
            if (destination === "")
              destination = v;
            else
              currentState.err = errorCodes(13, a);
          } else
            currentState.err = errorCodes(14, a);
        } else
          currentState.err = errorCodes(2, a);
        break;

      
      default: //Matches no commands
        currentState.err = errorCodes(99, a);

    }


    if (currentState.err)
      return -1;

  }

  if (url === "")
    currentState.err = errorCodes(100, "");
  if (currentState.inFilter)
    currentState.err = errorCodes(101, "");

  if (err)
    return -1;


  if (!("save" in settings)) settings.save = true;
  if (!("saveOnlyMatch" in settings)) settings.saveOnlyMatch = false;
  if (!("useReplies" in settings)) settings.useReplies = true;
  if (!("replyFiltering" in settings)) settings.replyFiltering = true;
  if (!("logMatch" in settings)) settings.logMatch = false;
  if (!("limit" in settings)) settings.limit = Number.POSITIVE_INFINITY;
  if (!("limitMatch" in settings)) settings.limitMatch = Number.POSITIVE_INFINITY;

  if (settings.save === false && settings.saveOnlyMatch === true) {
    settings.saveOnlyMatch = false;
    console.log("WARNING: Argument -savefilter conflicts with -nosave; no information will be saved.");
  }
  if (settings.save === false && destination !== "") {
    destination = "";
    console.log("WARNING: A destination is given but -nosave is present; no information will be saved.");
  }
  if ((settings.limit !== Number.POSITIVE_INFINITY && settings.limitMatch !== Number.POSITIVE_INFINITY) && settings.limit < settings.limitMatch) {
    settings.limitMatch = settings.limit;
    console.log("WARNING: Limit is lower than limitfilter; scraping will end before the filter limit can be reached.");
  }

  if (!settings.logMatch && !settings.save)
    console.log("WARNING: Scraped information will neither be saved nor displayed on-screen.");
  if (settings.logMatch && settings.selectors.length === 0)
    console.log("WARNING: Argument -printfilter is given, but no filters are applied; all comments will be printed on-screen.");
  if (settings.limitMatch !== Number.POSITIVE_INFINITY && settings.selectors.length === 0)
    console.log("WARNING: Argument limfilter is given, but no filters are applied; limitfilter will be treated as the normal filter.");
  if (!settings.useReplies && !settings.replyFiltering)
    console.log("WARNING: Argument -noreply conflicts with -nrf; no replies will be scraped.");
  if (!settings.replyFiltering && settings.selectors.length === 0 && settings.limitMatch !== Number.POSITIVE_INFINITY)
    console.log("WARNING: -nrf mode enabled, but no filters set; thus all replies will not be counted up to limitfilter.");

  return [url, destination, settings];
}


function outputValidValues(arg, values = {}, ignore = {}) { //Gives the end user more information in case of an error
  console.log("The valid values for argument \"" + arg + "\" are:");
  for (valid in values) {
    if (!(valid in ignore)) console.log("\t\"" + valid + "\"");
  }
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

module.exports.cli = cli;