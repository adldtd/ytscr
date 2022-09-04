const fs = require("fs");
const path = require("path");
const helpers = require(path.join(__dirname, "..", "..", "common", "helpers"));
const errors = require(path.join(__dirname, "..", "..", "common", "errors"));

const comment_cli = require(path.join(__dirname, "comments", "cli")).cli;
const chat_cli = require(path.join(__dirname, "chat", "cli")).cli;

const comment_scraper = require(path.join(__dirname, "comments", "comment-scraper")).scraper;
const chat_scraper = require(path.join(__dirname, "chat", "chat-scraper")).scraper;


  /******************************************/
 /* The video module commands + submodules */
/******************************************/

var validModules = {comments: "", chat: ""}; //Reused by both --exclude and --focus


const cmd = {

  modules: { //Special commands that allow entrance to other subcommands/submodules
  //In this case, these need to be specified at the start
  
    "comments": {
      aliases: ["comments"],
      simpleDescription: "Module for scraping comments from a YouTube video",
      description: "The module for retrieving comment data inside a YouTube video. Will be ignored if 0 " +
      "comments are found.",
      examples: ["comments [argument 1] [argument 2] ... ;"],
      cli: comment_cli,
      scrape: comment_scraper
    },

    "chat": {
      aliases: ["chat"],
      simpleDescription: "Module for scraping live chat replay from a YouTube video",
      description: "The module for retrieving chat data from a past livestream/premiere. Will be ignored " +
      "if the video was not live in the past (and if it is an ongoing livestream.)",
      examples: ["chat [argument 1] [argument 2] ... ;"],
      cli: chat_cli,
      scrape: chat_scraper
    }

  },

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
    "--help": {
      aliases: ["--help", "-h"],
      simpleDescription: "Displays command information",
      description: "A command which takes in a command/module as the next input. By specifiying a valid " +
      "command, the program will print some info as well as the usability of that cmd. All modules have their " +
      "own help commands, which can be accessed by typing \"ytscr [module] [module] --help\".",
      examples: ["--help video"],
      numArgs: 1
    },

    "-i": {redirect: "--input"},
    "--input": {
      aliases: ["--input", "-i"],
      simpleDescription: "The video from which to scrape",
      description: "A command which takes in a video link as input. Required argument for scraping to function. " +
      "Can be either a direct link, a \"youtu.be\" link, a shorts link, or a pure video ID.",
      examples: ["--input video"],
      call: inputCall,
      numArgs: 1
    },

    "-fc": {redirect: "--focus"},
    "--focus": {
      aliases: ["--focus", "-fc"],
      simpleDescription: "A module which to only scrape",
      description: "A command which takes in a module, and \"focuses\" on it primarily during scraping. Useful for " +
      "times where only a certain section of data is needed. By default, the program will scrape all modules; " +
      "calling this command at least once will exclude all other modules. After this, however, specifying " +
      "another module with --focus will not exclude any other \"focused\" modules.",
      validValues: validModules,
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
      validValues: validModules,
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
    }

  }

}


function inputCall(parsed, currentState, settings) {

  let command = parsed.command;
  let argument = parsed.args[0];

  if (settings.video.input === "") {
      
    if (argument.substring(0, 32) === "https://www.youtube.com/watch?v=" || argument.substring(0, 24) === "www.youtube.com/watch?v=" || argument.substring(0, 20) === "youtube.com/watch?v=") {
      settings.video.input = argument;
    } else if (argument.substring(0, 31) === "https://www.youtube.com/shorts/" || argument.substring(0, 23) === "www.youtube.com/shorts/" || argument.substring(0, 19) === "youtube.com/shorts/") {
      settings.video.input = "https://youtube.com/watch?v=" + argument.split("shorts/", 2)[1]; //YouTube shorts are converted to videos this way
    } else if (argument.substring(0, 17) === "https://youtu.be/" || argument.substring(0, 9) === "youtu.be/") {
      settings.video.input = "https://youtube.com/watch?v=" + argument.split(".be/", 2)[1];
    } else if (argument.length === 11) { //Pure video ID
      settings.video.input = "https://youtube.com/watch?v=" + argument;
    } else
      currentState.error = errors.errorCodes(-2, command, argument);
        
  } else
    currentState.error = errors.errorCodes(-1, command, argument);
}

function focusCall(parsed, currentState, settings) {

  let c = parsed.command; let a = parsed.args[0];

  if (a in parsed.commandBox.validValues) {
    if (!(a in currentState.video.excludeList)) {

      if (!currentState.video.firstFocusCalled) {
        currentState.video.firstFocusCalled = true;
        for (md in settings.video.focus) {
          if (md !== a)
            settings.video.focus[md] = false;
        }
      } else
        settings.video.focus[a] = true;
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

        settings.video.focus[a] = false;
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
  settings.video.prettyprint = false;
}

function outputCall(parsed, currentState, settings) {

  let c = parsed.command; let a = parsed.args[0];
  let forwardSlashSplit = true;
  
  if (settings.video.output !== "") {
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
    filepath = path.join(__dirname, "..", "..", "SAVES"); filename = sp[0];
  } else {
    filepath = sp[0]; filename = sp[1];
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

  settings.video.output = filepath + (forwardSlashSplit ? "/" : "\\") + filename;
}


module.exports.cmd = cmd;