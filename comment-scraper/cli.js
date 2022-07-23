const fs = require("fs");

/*
* Settings:
*   url: input=, i=
*   save: -nosave, -NS
*   saveOnlyMatch: -savefilter, -sf
*   logMatch: -printfilter, -pf
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
  
  let url = "";
  let destination = "";
  let settings = {selectors: [], include: {}};

  let usedFilterCheckValues = {}; //Used to track collisions with ignore
  
  let inFilter = false;
  let currentFilter = {};
  let err = false;

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
        if (!inFilter) {
          if (url === "") {
            if (v.substring(0, 32) === "https://www.youtube.com/watch?v=" || v.substring(0, 24) === "www.youtube.com/watch?v=") {
              url = v;
            } else
              err = errorCodes(-2, a, v);
          } else
            err = errorCodes(-1, a);
        } else
          err = errorCodes(2, a);
        break;


      case "-nosave":
      case "-NS":
        if (!inFilter)
          settings.save = false;
        else
          err = errorCodes(2, a);
        break;


      case "-savefilter":
      case "-sf":
        if (!inFilter)
          settings.saveOnlyMatch = true;
        else
          err = errorCodes(2, a);
        break;
      

      case "-printfilter":
      case "-pf":
        if (!inFilter)
          settings.logMatch = true;
        else
          err = errorCodes(2, a);
        break;

      
      case "lim":
      case "l":
        if (!inFilter) {
          if (!isNaN(parseInt(v))) {
            v = parseInt(v);
            if (v > 0)
              settings.limit = v;
            else
              err = errorCodes(15, a, v);
          } else
            err = errorCodes(16, a, v);
        } else
          err = errorCodes(2, a);
        break;


      case "limfilter":
      case "lf":
        if (!inFilter) {
          if (!isNaN(parseInt(v))) {
            v = parseInt(v);
            if (v > 0)
              settings.limitMatch = v;
            else
              err = errorCodes(15, a, v);
          } else
            err = errorCodes(16, a, v);
        } else
          err = errorCodes(2, a);
        break;


      case "filter":
      case "f":
        if (!inFilter) {
          if (v in filterValidValues)
            inFilter = true;
          else {
            err = errorCodes(3, a, v);
            outputValidValues(a, filterValidValues);
          }
        } else
          err = errorCodes(2, a);
        break;


      case "check":
        if (inFilter) {
          if (v in checkValidValues) {
            if (!("check" in currentFilter))
              currentFilter.check = v;
            else
              err = errorCodes(5, a);
          } else {
            err = errorCodes(3, a, v);
            outputValidValues(a, checkValidValues);
          }
        } else
          err = errorCodes(4, a);
        break;


      case "match":
        if (inFilter) {
          if (!("match" in currentFilter))
            currentFilter.match = v;
          else
            err = errorCodes(5, a);
        } else
          err = errorCodes(4, a);
        break;


      case "compare":
        if (inFilter) {
          if (!("compare" in currentFilter)) //In order to reduce complexity, v is checked as a valid value at the end of the filter scope ("}")
            currentFilter.compare = v;
          else
            err = errorCodes(5, a);
        } else
          err = errorCodes(4, a);
        break;

        
      case "-casesensitive": //The program ignores this prompt if entered alongside a "numerical" match like votes
      case "-cs":
        if (inFilter)
          currentFilter.caseSensitive = true;
        else
          err = errorCodes(4, a);
        break;


      case "}": //Ends a filter scope
        if (!inFilter) {
          err = errorCodes(6, a);
          break;
        }
        if (!("check" in currentFilter) || !("match" in currentFilter)) {
          err = errorCodes(7, a);
          break;
        }
        if (checkValidValues[currentFilter.check] === "num") {

          if (!("compare" in currentFilter)) {
            err = errorCodes(8, a, currentFilter.check);
            break;
          }
          if (!(currentFilter.compare in compareValidValues) || currentFilter.compare === "") {
            err = errorCodes(9, a, currentFilter.compare);
            outputValidValues("compare", compareValidValues, {"":""});
            break;
          }
          if (isNaN(parseInt(currentFilter.match))) {
            err = errorCodes(10, a, currentFilter.match);
            break;
          }

        } else if (checkValidValues[currentFilter.check] === "str") {

          if (!("compare" in currentFilter))
            currentFilter.compare = ""; //Default value
          else if (!(currentFilter.compare in compareValidValues) || (currentFilter.compare !== "=" && currentFilter.compare !== "")) {
            err = errorCodes(11, a, currentFilter.compare);
            outputValidValues("compare", compareValidValues, {"<":"", ">":"", "<=":"", ">=":""});
            break;
          }
          
        }
        if (currentFilter.check in settings.include && !settings.include[currentFilter.check]) {
          err = errorCodes(12, a, currentFilter.check);
          break;
        }

        usedFilterCheckValues[currentFilter.check] = "";
        settings.selectors.push(currentFilter);
        currentFilter = {compare: ""};
        inFilter = false;
        break;
      
      
      case "ignore":
        if (!inFilter) {
          if (v in includeValidValues) {
            if (!(v in usedFilterCheckValues))
              settings.include[v] = false;
            else
              err = errorCodes(12, a, v);
          } else {
            err = errorCodes(3, a, v);
            outputValidValues(a, includeValidValues);
          }
        } else
          err = errorCodes(2, a);
        break;
      
      
      case "dest":
      case "d":
        if (!inFilter) {
          if (fs.existsSync(v)) {
            if (destination === "")
              destination = v;
            else
              err = errorCodes(13, a);
          } else
            err = errorCodes(14, a);
        } else
          err = errorCodes(2, a);
        break;

      
      default: //Matches no commands
        err = errorCodes(99, a);

    }


    if (err)
      return -1;

  }

  if (url === "")
    err = errorCodes(100, "");
  if (inFilter)
    err = errorCodes(101, "");

  if (err)
    return -1;


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