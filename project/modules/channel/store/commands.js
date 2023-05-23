const path = require("path");
const errors = require(path.join(__dirname, "..", "..", "..", "common", "errors"));

const subscribeFilterable = require(path.join(__dirname, "..", "..", "..", "common", "subscribe-filterable")).subscribeFilterable;
const subscribeMeta = require(path.join(__dirname, "..", "..", "..", "common", "subscribe-meta")).subscribeMeta;


  /*************************************************************************/
 /* Arguments + commands and corresponding functions for the store module */
/*************************************************************************/

const attributes = {
  title: {
    type: "str",
    simpleDescription: "The name of the product"
  },
  price: {
    type: "num",
    simpleDescription: "The current price for the product"
  },
  seller: {
    type: "str",
    simpleDescription: "The product seller's name"
  },
  link: {
    type: "str",
    simpleDescription: "A link to the item being sold"
  },
  thumbnail: {
    type: "str",
    simpleDescription: "Link to a product thumbnail"
  }
};


const cmd = {

  commands: {},

  attributes: attributes

};

//*************************************************************************** Settings for the CLI

let commands = cmd.commands;


var thisSettings = {

}

var thisCurrentState = {

}


subscribeFilterable(attributes, commands, thisCurrentState, thisSettings);
subscribeMeta(commands);

//*************************************************************************** CLI call functions


module.exports.cmd = cmd;
module.exports.settings = thisSettings;
module.exports.currentState = thisCurrentState;