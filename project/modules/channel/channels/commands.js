const path = require("path");
const errors = require(path.join(__dirname, "..", "..", "..", "common", "errors"));

const subscribeFilterable = require(path.join(__dirname, "..", "..", "..", "common", "subscribe-filterable")).subscribeFilterable;
const subscribeMeta = require(path.join(__dirname, "..", "..", "..", "common", "subscribe-meta")).subscribeMeta;


  /****************************************************************************/
 /* Arguments + commands and corresponding functions for the channels module */
/****************************************************************************/

const attributes = {
  name: {
    type: "str",
    simpleDescription: "The channel's name"
  },
  subscribers: {
    type: "num",
    simpleDescription: "Num. subscribers"
  },
  videos: {
    type: "num",
    simpleDescription: "Num. videos uploaded"
  },
  profilePicture: {
    type: "str",
    simpleDescription: "The channel's profile picture"
  },
  verified: {
    type: "str",
    simpleDescription: "Whether the channel is verified"
  },
  handle: {
    type: "str",
    simpleDescription: "The channel's handle"
  },
  channelId: {
    type: "str",
    simpleDescription: "The channel's ID"
  }
};


const cmd = {

  commands: {
    "-com": {redirect: "--combine"},
    "--combine": {
      aliases: ["--combine", "-com"],
      simpleDescription: "Combines section results into a single list",
      description: "An argument which causes the scraper to combine scraped channels into one, continuous list. " +
      "By default, results are saved in different section lists; this flag adds a \"section\" attribute to every " +
      "scraped channel, and replaces the \"channels\" object with a list.",
      call: combineCall,
      numArgs: 0
    },

    "--limsectionall": {
      aliases: ["--limsectionall"],
      simpleDescription: "Limits the amount of channels for ALL sections",
      description: "An argument which stops the scraper in a section once it reaches the specified " +
      "limit. If another limit (i.e. for \"--lim\" or \"--limfilter\") is reached beforehand, scraping stops " +
      "outright. NOTE: This command is different from \"--lim\", as --lim is for total results, while \"--limsectionall\" " +
      "is equivalent to calling \"--limsection\" for every channel section. If a limit is specified for a " +
      "certain section, it overrides this limit.",
      examples: ["--limsectionall 100"],
      call: limsectionallCall,
      numArgs: 1
    },

    "-sec": {redirect: "--section"},
    "--section": {
      aliases: ["--section", "-sec"],
      simpleDescription: "Specifies a section to be modified",
      description: "A command which takes in the name of a channel section. This command by itself does " +
      "nothing; to change the scraper's functionality, it requires following commands, known as \"section " +
      "modifiers.\" Those commands are ONLY valid if they either follow this command, or one another. NOTE: " +
      "the section name \"All channels\" is reserved by YouTube, and cannot be specified/modified.",
      examples: ['--section "Subscriptions"', "-sec Alts"],
      call: sectionCall,
      numArgs: 1
    },

    "--focussection": {
      aliases: ["--focussection"],
      simpleDescription: "Section modifier; focuses a certain section",
      description: "A flag which \"focuses\" the section being modified. By default, all sections are scraped; " +
      "this flag makes it so the specified section(s) will be the only ones that are saved.",
      call: focussectionCall,
      numArgs: 0
    },

    "--excludesection": {
      aliases: ["--excludesection"],
      simpleDescription: "Section modifier; ignores a certain section",
      description: "A flag which makes it so the section specified will be ignored during scraping.",
      call: excludesectionCall,
      numArgs: 0
    },

    "--limsection": {
      aliases: ["--limsection"],
      simpleDescription: "Section modifier; limits the amount of channels scraped in a section",
      description: "An argument which stops the scraper in a certain section once it reaches the specified " +
      "limit. If another limit (i.e. for \"--lim\" or \"--limfilter\") is reached beforehand, scraping stops " +
      "outright. If this argument is not present, the scraper will not stop until it reaches the end of the section.",
      examples: ["--limsection 27"],
      call: limsectionCall,
      numArgs: 1
    }
  },

  attributes: attributes

};

//*************************************************************************** Settings for the CLI

let commands = cmd.commands;


var thisSettings = {
  combine: false,
  limsectionall: Number.POSITIVE_INFINITY,
  section: {},

  focusmode: false //When false, the scraper scrapes all sections (except for ignored ones)
}

var thisCurrentState = {
  currentSection: null,
  lastSectionalIndex: -1,
  sectionModified: false,
  unwarnedSections: {}
}


subscribeFilterable(attributes, commands, thisCurrentState, thisSettings);
subscribeMeta(commands);

//*************************************************************************** CLI call functions

function combineCall(parsed, currentState, innerState, moduleSettings, innerSettings) {

  let c = parsed.command;

  if (!innerState.inFilter)
    innerSettings.combine = true;
  else
    currentState.error = errors.errorCodes(2, c);
}

function limsectionallCall(parsed, currentState, innerState, moduleSettings, innerSettings) {

  let c = parsed.command; let a = parsed.args[0];

  if (!innerState.inFilter) {
    if (!isNaN(parseInt(a))) {
      a = parseInt(a);
      if (a > 0)
        innerSettings.limsectionall = a;
      else
        currentState.error = errors.errorCodes(15, c, a);
    } else
      currentState.error = errors.errorCodes(16, c, a);
  } else
    currentState.error = errors.errorCodes(2, c);
}

function sectionCall(parsed, currentState, innerState, moduleSettings, innerSettings) {

  let c = parsed.command; let a = parsed.args[0];

  if (!innerState.inFilter) {
    if (a !== "All channels") {
      if (!(a in innerSettings.section)) {

        innerSettings.section[a] = {
          focussection: null, //Unspecified
          limsection: Number.POSITIVE_INFINITY
        };
        innerState.unwarnedSections[a] = innerSettings.section[a];

        innerState.currentSection = a;
        innerState.lastSectionalIndex = currentState.index;
        innerState.sectionModified = false;

      } else
        currentState.error = errors.errorCodesSection(0, c, a);
    } else
      currentState.error = errors.errorCodesSection(4, c, a);
  } else
    currentState.error = errors.errorCodes(2, c);
}

function focussectionCall(parsed, currentState, innerState, moduleSettings, innerSettings) {
  innerState.sectionModified = true;

  let c = parsed.command;
  let currentSection = innerSettings.section[innerState.currentSection];

  let distance = currentState.index - innerState.lastSectionalIndex;
  if (distance === parsed.commandBox.numArgs + 1) {
    innerState.lastSectionalIndex = currentState.index;

    if (currentSection.focussection !== false) { //Otherwise, excludesectionCall was called before
      currentSection.focussection = true;
      innerSettings.focusmode = true;
    } else
      currentState.error = errors.errorCodes(2, c, innerState.currentSection);
  } else
    currentState.error = errors.errorCodesSection(1, c);
}

function excludesectionCall(parsed, currentState, innerState, moduleSettings, innerSettings) {

  let c = parsed.command;
  let currentSection = innerSettings.section[innerState.currentSection];

  let distance = currentState.index - innerState.lastSectionalIndex;
  if (distance === parsed.commandBox.numArgs + 1) {
    innerState.lastSectionalIndex = currentState.index;

    if (!innerState.sectionModified) {
      currentSection.focussection = false;
    } else
      currentState.error = errors.errorCodesSection(3, c, innerState.currentSection);
  } else
    currentState.error = errors.errorCodesSection(1, c);
}

function limsectionCall(parsed, currentState, innerState, moduleSettings, innerSettings) {
  innerState.sectionModified = true;

  let c = parsed.command; let a = parsed.args[0];
  let currentSection = innerSettings.section[innerState.currentSection];

  let distance = currentState.index - innerState.lastSectionalIndex;
  if (distance === parsed.commandBox.numArgs + 1) {
    innerState.lastSectionalIndex = currentState.index;

    if (currentSection.focussection !== false) {
      if (!isNaN(parseInt(a))) {
        a = parseInt(a);
        if (a > 0) {
          currentSection.limsection = a;
        } else
          currentState.error = errors.errorCodes(15, c, a);
      } else
        currentState.error = errors.errorCodes(16, c, a);
    } else
      currentState.error = errors.errorCodes(2, c, innerState.currentSection);
  
  } else
    currentState.error = errors.errorCodesSection(1, c);
}


module.exports.cmd = cmd;
module.exports.settings = thisSettings;
module.exports.currentState = thisCurrentState;