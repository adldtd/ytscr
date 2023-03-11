const path = require("path");
const cli = require(path.join(__dirname, "..", "entry", "cli")).cli;


//*********************************************************************************
//Mini shell parser for simpler looking testing; doesn't work with everything
//(including escape characters)
//*********************************************************************************
function parse(shellArgs) {
  shellArgs = shellArgs.trim();

  let parsed = ["PROCESS_EXECPATH", "FILEPATH"]; //Dummy arguments
  if (shellArgs.length === 0) return parsed;
  let pack = null; //Whenever the next non-space character is found, pack is pushed into parsed
  let inQuotes = false;
  let quotesType = "\"";

  let lastIndex = 0; //This index is always at the first found non-space character after a space

  for (let i = 1; i < shellArgs.length; i++) {

    if (inQuotes) { //Special processing mode; ignores spaces

      if (shellArgs[i] === quotesType) {
        inQuotes = false;
        if (pack === null) pack = shellArgs.substring(lastIndex + 1, i);
        else pack += shellArgs.substring(lastIndex + 1, i);

        if (i < shellArgs.length + 1 && shellArgs[i + 1] !== " ")
          lastIndex = i + 1;
      }

    } else if (shellArgs[i] !== " ") { //Normal processing mode
      let justLanded = false; //If we "land" at a quote, then the text behind it is all spaces. Otherwise, we combine the previous text with the embedded quote text

      if (shellArgs[i - 1] === " ") { //Push pack onto stack
        parsed.push(pack);
        pack = null;
        lastIndex = i;
        justLanded = true;
      }

      if (i < shellArgs.length + 1 && shellArgs[i + 1] === " ") //Store in pack whenever a seperator is found
        pack = shellArgs.substring(lastIndex, i + 1);

      if (shellArgs[i] === '"' || shellArgs[i] === "'") {
        if (!justLanded) {
          if (pack === null) pack = shellArgs.substring(lastIndex, i + 1);
          else pack += shellArgs.substring(lastIndex, i + 1);
          lastIndex = i;
        }
        quotesType = shellArgs[i];
        inQuotes = true;
      }
    }
  }

  let i = shellArgs.length - 1;

  if (inQuotes) {
    if (pack === null) pack = shellArgs.substring(lastIndex + 1);
    else pack += shellArgs.substring(lastIndex + 1);
  } else if (shellArgs[i] !== '"' && shellArgs[i] !== "'") {
    if (pack === null) pack = shellArgs.substring(lastIndex);
    else pack += shellArgs.substring(lastIndex);
  }

  if (pack !== null) parsed.push(pack);
  return parsed;
}

//*********************************************************************************
//Mimics the function of the ytscr CLI, retrieving data using shell arguments
//(without saving anything to disk.) Returns both settings and scraped data,
//and expects valid (non --help) shell input
//*********************************************************************************
async function getData(shellArgs, onlySettings = false) {

  let parsed = parse(shellArgs);
  let module = parsed[2];
  let pack = cli(parsed);

  let scrape = pack[0];
  let settings = pack[1];

  settings[module].save = false;
  return [(!onlySettings) ? await scrape(settings) : null, settings];
}


//*********************************************************************************
//Checks if a module adheres with given options; should be called by larger test
//functions
//*********************************************************************************
function diagStd(savedModule, ignore, limit) {

  let stream = [];
  if (Array.isArray(savedModule)) {
    stream = savedModule;
    if (stream.length > limit) //1st test
      throw Error("Expected limit to be <= to " + limit + ", recieved " + stream.length);
  } else //Non-stream like data (like the meta module)
    stream.push(savedModule);

  for (let item in stream) {
    item = stream[item];

    for (key in ignore) { //2nd test
      if (key in item && ignore[key][0])
        throw Error("Ignored attribute \"" + key + "\" found in item:\n" + JSON.stringify(item, null, 2));
      if (!(key in item) && !ignore[key][0])
        throw Error("Unignored attribute \"" + key + "\" could not be found in item:\n" + JSON.stringify(item, null, 2));
    }
  }
}

//*********************************************************************************
//Count all comments, including replies to comments
//*********************************************************************************
function countComments(savedModule) {
  let count = 0;
  for (item in savedModule) {
    item = savedModule[item];
    if ("replies" in item) count += item.replies.length;
    ++count;
  }
  return count;
}

//*********************************************************************************
//Checks if the recommended module adheres with given options; called during video
//testing
//*********************************************************************************
function diagComments(savedModule, ignore, limit, norp) {

  let stream = savedModule;
  if (limit != Number.POSITIVE_INFINITY && countComments(stream) > limit) //1st test
    throw Error("Expected limit to be <= to " + limit + ", recieved " + stream.length);

  for (let item in stream) {
    item = stream[item];

    for (key in ignore) { //2nd test
      if (key in item && ignore[key][0])
        throw Error("Ignored attribute \"" + key + "\" found in item:\n" + JSON.stringify(item, null, 2));
      if (!(key in item) && !ignore[key][0])
        throw Error("Unignored attribute \"" + key + "\" could not be found in item:\n" + JSON.stringify(item, null, 2));
    }

    if ("replies" in item && norp) //3rd test
      throw Error("\"norp\" specified, but key \"replies\" found in item:\n" + JSON.stringify(item, null, 2));
    if (!("replies" in item) && !norp)
      throw Error("\"norp\" not specified, but key \"replies\" could not be found in item:\n" + JSON.stringify(item, null, 2));

    if ("replies" in item)
      diagComments(item.replies, ignore, Number.POSITIVE_INFINITY, true);
  }
}

//*********************************************************************************
//Checks if a module in the form of a data "stream" (i.e. search results,
//recommendations) adheres with given options
//*********************************************************************************
function diagStream(savedModule, focus, ignore, limits, overallLimit) {

  let stream = savedModule;
  let limit = 0;
  for (let lim in limits) {
    if (focus[lim][0])
      limit += limits[lim][0];
  }
  
  if (stream.length > limit) //1st test
    throw Error("Expected limit to be <= to " + limit + ", recieved " + stream.length);
  if (stream.length > overallLimit)
    throw Error("Expected limit to be <= to " + overallLimit + " (for recommended), recieved " + stream.length);

  for (let item in stream) {
    item = stream[item];

    if (!focus[item.type][0]) //2nd test
      throw Error("Item with type \"" + item.type + "\" recieved, yet module ignored:\n" + JSON.stringify(item, null, 2));

    let moduleIgnore = ignore[item.type][1];
    for (key in moduleIgnore) { //3rd test
      if (key in item && moduleIgnore[key][0])
        throw Error("Ignored attribute \"" + key + "\" found in item:\n" + JSON.stringify(item, null, 2));
      if (!(key in item) && !moduleIgnore[key][0])
        throw Error("Unignored attribute \"" + key + "\" could not be found in item:\n" + JSON.stringify(item, null, 2));
    }
  }
}

//*********************************************************************************
//Checks if the submodules of the video module adhere with given options
//*********************************************************************************
function testVideo(savedData, focus, ignore, limits, norp) {

  for (let module in focus) { //1st test
    if (module in savedData && !focus[module][0])
      throw Error("Unfocused submodule \"" + module + "\" found in saved data:\n" + JSON.stringify(savedData, null, 2));
    if (!(module in savedData) && focus[module][0])
      throw Error("Focused submodule \"" + module + "\" could not be found in saved data:\n" + JSON.stringify(savedData, null, 2));

    if (!(module in savedData)) continue;

    if (module === "recommended") { //Special case

      if (Array.isArray(savedData[module])) //Stream of data
        diagStream(savedData[module], focus[module][1], ignore[module][1], limits[module][1]);
      else {

        let innerFocus = focus[module][1];
        let innerData = savedData[module];

        for (let innerModule in innerFocus) {
          if (innerModule in innerData && !innerFocus[innerModule][0])
            throw Error("Unfocused submodule \"" + innerModule + "\" found in saved data:\n" + JSON.stringify(innerData, null, 2));
          if (!(innerModule in innerData) && innerFocus[innerModule][0])
            throw Error("Focused submodule \"" + innerModule + "\" could not be found in saved data:\n" + JSON.stringify(innerData, null, 2));

          if (!(innerModule in innerData)) continue;
          diagStd(innerData[innerModule], ignore[module][1][innerModule][1], limits[module][1][innerModule][0], limits[module][0]);
        }
      }
    
    } else if (module === "comments") {
      diagComments(savedData[module], ignore[module][1], limits[module][0], norp);
    } else
      diagStd(savedData[module], ignore[module][1], limits[module][0]);
  }
}


//*********************************************************************************
//Checks if the submodules of the search module adhere with given options
//*********************************************************************************
function testSearch(savedData, focus, ignore, limits, overallLimit, seperate) { //**************CHECK IF RESULTS MEGA MODULE IS INSIDE

  if ("results" in savedData && seperate) //1st test
    throw Error("Seperate specified, but aggregate module \"" + "results" + "\" found in saved data:\n" + JSON.stringify(savedData, null, 2));
  
  if (seperate) { //2nd test
    for (let module in focus) {
      if (module in savedData && !focus[module][0])
        throw Error("Unfocused submodule \"" + module + "\" found in saved data:\n" + JSON.stringify(savedData, null, 2));
      if (!(module in savedData) && focus[module][0])
        throw Error("Focused submodule \"" + module + "\" could not be found in saved data:\n" + JSON.stringify(savedData, null, 2));
    }
  } else {
    let focusResults = false;
    for (let module in focus) {
      if (module !== "meta")
        focusResults = focusResults || focus[module][0];
    }
    
    if ("results" in savedData && !focusResults)
      throw Error("Unfocused submodule \"" + "results" + "\" found in saved data:\n" + JSON.stringify(savedData, null, 2));
    if (!("results" in savedData) && focusResults)
      throw Error("Focused submodule \"" + "results" + "\" could not be found in saved data:\n" + JSON.stringify(savedData, null, 2));
  }

  for (let module in focus) {
    if (!(module in savedData)) continue;

    if (module === "results") { //Greater results submodule; comprised of multiple submodule data
      let memory = {focus: focus.meta, ignore: ignore.meta, limit: limits.meta};
      delete focus.meta; delete ignore.meta; delete limits.meta;
      diagStream(savedData[module], focus, ignore, limits, overallLimit);
      focus.meta = memory.focus; ignore.meta = memory.ignore; limits.meta = memory.limit;
    } else
      diagStd(savedData[module], ignore[module][1], limits[module][0]);
  }
}


//*********************************************************************************
//Maps a specified value to modules, its submodules, and their attributes; makes
//assumptions on the structure of "settings"
//*********************************************************************************
function mapVal(module, settings, val) {
  let mappedSettings = {};
  if (typeof(settings) !== "object") return mappedSettings; //Base case; "module" is actually an attribute

  if ("focus" in settings) { //Assumes that the key "focus" indicates a module

    for (let sub in settings.focus)
      mappedSettings[sub] = [val, mapVal(sub, settings[sub], val)];
    return mappedSettings;

  } else if ("ignore" in settings) { //Assumes that the key "ignore" (for attributes) indicates a submodule

    for (let att in settings.ignore)
      mappedSettings[att] = [val, mapVal(att, settings.ignore[att], val)];
    return mappedSettings;

  } else if ("focus" in settings[module]) {

    for (let sub in settings[module].focus)
      mappedSettings[sub] = [val, mapVal(sub, settings[sub], val)];
    return mappedSettings;

  }

  throw Error("Unexpected construct in module \"" + module + "\"");
}

//*********************************************************************************
//Meant for printing out the output given by mapVal
//*********************************************************************************
function printMapped(mappedSettings, spaces = 2, adder = 2) {
  if (mappedSettings === {})
    return;

  for (let sub in mappedSettings) {
    let spacing = " ".repeat(spaces);
    console.log(spacing + sub);
    printMapped(mappedSettings[sub][1], spaces + adder);
  }
}


module.exports.parse = parse;
module.exports.getData = getData;
module.exports.diagStd = diagStd;
module.exports.diagStream = diagStream;
module.exports.testVideo = testVideo;
module.exports.testSearch = testSearch;
module.exports.mapVal = mapVal;
module.exports.printMapped = printMapped;