const fs = require("fs");
const path = require("path");
const makeRequest = require(path.join(__dirname, "..", "..", "..", "common", "helpers")).makeRequest;
const clearLastLine = require(path.join(__dirname, "..", "..", "..", "common", "helpers")).clearLastLine;
const helpers = require(path.join(__dirname, "..", "..", "..", "common", "helpers"));


  /*********************************************/
 /* The scraping function for the chat module */
/*********************************************/


//*********************************************************************************
//Sees if the video data given can be scraped
//*********************************************************************************
function verifyResponse(resp) {

  let initialData = helpers.safeSplit(resp.data, "var ytInitialData = ", 1);
  if (initialData.length < 2) {
    console.log("\nAn unexpected error occurred.\nNo messages found.");
    return -1;
  }

  initialData = JSON.parse(helpers.safeSplit(initialData[1], ";</script><script nonce", 1)[0]);
  if ("conversationBar" in initialData.contents.twoColumnWatchNextResults) { //Indicates the chat bar
    
    let bar = initialData.contents.twoColumnWatchNextResults.conversationBar;
    if (!("liveChatRenderer" in bar)) {
      console.log("\n" + bar.conversationBarRenderer.availabilityMessage.messageRenderer.text.runs[0].text);
      console.log("No messages found.");
      return -1;
    }

    let live = ("isReplay" in bar.liveChatRenderer) ? !bar.liveChatRenderer.isReplay : true;
    if (live) {
      console.log("\nLivestream still going; cannot retrieve past chat data.\nNo messages found.")
      return -1;
    }

  } else {
    console.log("\nChat bar not found.\nNo messages found.");
    return -1;
  }

  return 0;
}


//*********************************************************************************
//Retrieves the first bunch of chat messages for processing, and configures config
//for POST requests in the future
//*********************************************************************************
async function scrapeReplayInitialResponse(inner_api_key, continuation_id, config, timeout, settings) {

  if (config.method !== "GET") config.method = "GET";

  let chatUrl = "https://www.youtube.com/live_chat_replay?continuation=" + continuation_id;
  config.url = chatUrl;

  let chatResp = await makeRequest(config, timeout, 1);
  if (chatResp === -1) return -1;

  let location = chatResp.data.indexOf('>window["ytInitialData"] = {"responseContext":{');
  if (location === -1) {
    console.log("\nAn unexpected error occurred.");
    return -1;
  }
  let pureData = chatResp.data.substring(location + 27);

  pureData = helpers.safeSplit(pureData, ";</script><yt-live-chat-app>", 1, true);
  if (pureData.length < 2) {
    console.log("\nAn unexpected error occured.");
    return -1;
  }

  pureData = JSON.parse(pureData[0]);

  //Reconfigure config
  config.url = "https://www.youtube.com/youtubei/v1/live_chat/get_live_chat_replay?key=" + inner_api_key + "&prettyPrint=false";
  config.method = "POST";

  config.data.currentPlayerState = {playerOffsetMs: "0"};
  return pureData;
}


//*********************************************************************************
//Collect message data from the chat replay
//*********************************************************************************
async function scrapeReplayChat(inner_api_key, continuation_id, config, timeout, settings) {

  let savedMessages = [];
  let counter = 0;
  let matchCounter = 0;
  let hasContinuation = true;

  while (hasContinuation) {
    hasContinuation = false;

    let pureData;
    if (counter > 0) {

      let resp = await makeRequest(config, timeout, 1);
      if (resp === -1) return savedMessages;
      pureData = resp.data; //Expects a JSON data response
      
    } else {
      pureData = await scrapeReplayInitialResponse(inner_api_key, continuation_id, config, timeout, settings);
      if (pureData === -1) return savedMessages;

      //Decide whether to make an additional request for either top or live messages
      let selectors = pureData.continuationContents.liveChatContinuation.header.liveChatHeaderRenderer.viewSelector.sortFilterSubMenuRenderer.subMenuItems;
      for (s in selectors) {

        if ((selectors[s].title === "Top chat replay" && settings.topchat && !selectors[s].selected) ||
            (selectors[s].title === "Live chat replay" && !settings.topchat && !selectors[s].selected)) {

          //Either switch to top chat or to live chat (when not already selected)
          config.data.continuation = selectors[s].continuation.reloadContinuationData.continuation;
          resp = await makeRequest(config, timeout, 1);
          if (resp === -1) return savedMessages;
          pureData = resp.data;

        }
      }

    }

    //Navigate through the data retrieved
    let messages = pureData.continuationContents.liveChatContinuation;
    if (!("actions" in messages))
      return savedMessages; //Indicates the end of all chat
    messages = messages.actions;

    for (let m = 0; m < messages.length + 1; m++) {

      //To make sure the counter does not go over a limit, and that no extraneous requests (after limit is reached) are made
      if (counter >= settings.lim || matchCounter >= settings.limfilter) {
        clearLastLine();
        console.log("Messages scraped: " + counter);
        hasContinuation = false;
        return savedMessages;
      } else if (m === messages.length)
        break;

      let innerMessage = messages[m].replayChatItemAction.actions[0].addChatItemAction.item;
      if (!("liveChatTextMessageRenderer" in innerMessage)) //Not a written message
        continue;
      innerMessage = innerMessage.liveChatTextMessageRenderer;
    
      if (!("authorName" in innerMessage)) //Not a written message
        continue;

      let timestamp = "0";
      if ("videoOffsetTimeMsec" in messages[m].replayChatItemAction) {
        //This value is needed both to ask for the next request, and to place in the collected message data
        timestamp = messages[m].replayChatItemAction.videoOffsetTimeMsec;
        config.data.currentPlayerState.playerOffsetMs = messages[m].replayChatItemAction.videoOffsetTimeMsec;
      }

      let singleMessage = getMessageData(innerMessage, timestamp, settings.ignore);
      let match = messageMatches(singleMessage, settings.filter);

      if (match) {
        if (settings.printfilter)
          printMessage(singleMessage);
        matchCounter++;
      }

      if (match || !settings.savefilter) //If it matches or save match only is disabled
        savedMessages.push(singleMessage);
      
      counter++;
    }

    let continuations = pureData.continuationContents.liveChatContinuation.continuations;
    for (c in continuations) {
      if ("liveChatReplayContinuationData" in continuations[c]) {
        config.data.continuation = continuations[c].liveChatReplayContinuationData.continuation;
        hasContinuation = true;
        break;
      }
    }

    clearLastLine();
    console.log("Messages scraped: " + counter);

  }

  return savedMessages;
}


//*********************************************************************************
//Crunch message data into simpler parts
//*********************************************************************************
function getMessageData(innerMessage, timestamp, ignore = {}) {
  
  let singleMessage = {};

  if ("author" in ignore ? !ignore.author : true)
    singleMessage.author = innerMessage.authorName.simpleText;

  if ("text" in ignore ? !ignore.text : true) {
    singleMessage.text = "";
    for (run in innerMessage.message.runs) {
      if ("emoji" in innerMessage.message.runs[run])
        singleMessage.text += innerMessage.message.runs[run].emoji.shortcuts;
      else
        singleMessage.text += innerMessage.message.runs[run].text;
    }
  }

  if ("id" in ignore ? !ignore.id : true) //***************************************SEE IF THIS IS EVEN USEFUL
    singleMessage.id = innerMessage.id;

  if ("timestamp" in ignore ? !ignore.timestamp : true) {
    if (timestamp === "0") //When the timestamp text is negative/zero, the msec numerical timestamp is always 0
      timestamp = timestampTextToMsec(innerMessage.timestampText.simpleText); //Less accurate than standard msec
    singleMessage.timestamp = timestamp;
  }
  //singleMessage.timestamp = innerMessage.timestampText.simpleText;

  if ("picture" in ignore ? !ignore.picture : true) {
    let pictures = innerMessage.authorPhoto.thumbnails;
    singleMessage.picture = pictures[pictures.length - 1].url;
  }

  if ("channel" in ignore ? !ignore.channel : true)
    singleMessage.channel = innerMessage.authorExternalChannelId;

  return singleMessage;
}


//*********************************************************************************
//Helper function to convert timestamp text to a numerical value; used by
//getMessageData when there is a negative timestamp text
//*********************************************************************************
function timestampTextToMsec(timestampText) {
  
  let time = 0;
  let sign = 1;
  let divisions = timestampText.split(":");

  if (divisions[0].substring(0, 1) === "-") //Negative
    sign = -1;
  for (let i = 0; i < divisions.length; i++)
    divisions[i] = parseInt(divisions[i]);

  if (divisions.length === 3) //hh:mm::ss
    time = (divisions[0] * 3600000) + (divisions[1] * 60000 * sign) + (divisions[2] * 1000 * sign);
  else if (divisions.length === 2) //mm:ss
    time = (divisions[0] * 60000) + (divisions[1] * 1000 * sign);
  
  return (time + "");
}


//*********************************************************************************
//Check if a message matches all given filters
//*********************************************************************************
function messageMatches(singleMessage, filter) {

  let returnMatch = true;

  for (f in filter) {

    let condition = filter[f];
    if (condition.check !== "timestamp") {

      let messageCheck = singleMessage[condition.check];
      let conditionMatch = condition.match;
      if ("casesensitive" in condition ? !condition.casesensitive : true) {
        messageCheck = messageCheck.toLowerCase();
        conditionMatch = conditionMatch.toLowerCase();
      }

      if (condition.compare === "eq") //Exact match needed
        returnMatch = messageCheck === conditionMatch;
      else if (condition.compare === "in")
        returnMatch = messageCheck.includes(conditionMatch);
    }
    else {
      
      let messageCheck = parseInt(singleMessage["timestamp"]);
      switch (condition.compare) {
        case "less":
          returnMatch = messageCheck < parseInt(condition.match);
          break;
        case "greater":
          returnMatch = messageCheck > parseInt(condition.match);
          break;
        case "lesseq":
          returnMatch = messageCheck <= parseInt(condition.match);
          break;
        case "greatereq":
          returnMatch = messageCheck >= parseInt(condition.match);
          break;
        case "eq":
          returnMatch = messageCheck === parseInt(condition.match);
          break;
      }
    }

    if (!returnMatch)
      break;
  }

  return returnMatch;
}


//*********************************************************************************
//Prints a single message to the screen
//*********************************************************************************
function printMessage(singleMessage) {

  clearLastLine();
  console.log("-------------------------------------------------------------------");
  for (att in singleMessage) {
    if (att === "channel")
      console.log("channel: " + "https://youtube.com/channel/" + singleMessage[att]);
    else
      console.log(att + ": " + singleMessage[att]);
  }
  console.log("-------------------------------------------------------------------\n\n");
}


//*********************************************************************************
//Function to initialize and start the scraping process; to be called by the CLI
//*********************************************************************************
async function collectChat(settings, config, timeout, videoResponse) {

  let result = verifyResponse(videoResponse);
  if (result === -1) return -1;

  //Activate scraping
  let inner_api_key = helpers.safeSplit(videoResponse.data, '"INNERTUBE_API_KEY":"', 1)[1];
  inner_api_key = helpers.safeSplit(inner_api_key, '"', 1)[0];

  let continuation_id = helpers.safeSplit(videoResponse.data, '"liveChatRenderer":{"continuations":[{"reloadContinuationData":{"continuation":"', 1)[1];
  continuation_id = helpers.safeSplit(continuation_id, '"', 1)[0];

  console.log("\n");
  let savedMessages = await scrapeReplayChat(inner_api_key, continuation_id, config, timeout, settings);
  console.log("Complete");

  if (savedMessages.length === 0)
    console.log("No messages found.");

  return savedMessages;

}


module.exports.scraper = collectChat;