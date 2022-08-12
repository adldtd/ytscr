//const axios = require("axios").default;
const fs = require("fs");
const path = require("path");
const makeRequest = require(path.join(__dirname, "..", "helpers")).makeRequest;
const handleSaveJSON = require(path.join(__dirname, "..", "helpers")).handleSaveJSON;
const clearLastLine = require(path.join(__dirname, "..", "helpers")).clearLastLine;


  /*********************************************/
 /* The scraping function for the chat module */
/*********************************************/


//*********************************************************************************
//Retrieves the first bunch of chat messages for processing, and configures config
//for POST requests in the future
//*********************************************************************************
async function scrapeReplayInitialResponse(inner_api_key, continuation_id, config, timeout, settings) {

  let chatUrl = "https://www.youtube.com/live_chat_replay?continuation=" + continuation_id;
  config.url = chatUrl;

  let chatResp = await makeRequest(config, timeout, 1);
  if (chatResp === -1) return -1;

  //First step of getting the JSON out of the HTML code returned
  let location = chatResp.data.indexOf('>window["ytInitialData"] = {"responseContext":{');
  if (location === -1) {
    console.log("\nAn unexpected error occurred.");
    return -1;
  }

  //Second step
  let pureData = chatResp.data.substring(location + 27);
  location = pureData.lastIndexOf(";</script><yt-live-chat-app>");
  if (location === -1) {
    console.log("\nAn unexpected error occurred.");
    return -1;
  }

  pureData = JSON.parse(pureData.substring(0, location)); //Complete

  //Reconfigure config
  config.url = "https://www.youtube.com/youtubei/v1/live_chat/get_live_chat_replay?key=" + inner_api_key + "&prettyPrint=false";
  config.method = "POST";
  config.data = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "config_data.json")));
  config.data.context.client.originalUrl = settings.url;
  config.data.context.client.mainAppWebInfo.graftUrl = settings.url;

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
      m = parseInt(m);

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
      
      let messageCheck = parseInt(singleComment["timestamp"]);
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
async function collectChat(settings) {

  //Create the needed axios configurations
  let get_video = {
    method: "GET",
    url: "__________",
    authority: "www.youtube.com",
    headers:
    {
      "user-agent": 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.0.0 Safari/537.36'
    },
    validateStatus: () => true
  };
  
  let config = { //Needs to be configured as a GET request at the start; later changed to be POST
    url: "__________",
    authority: "www.youtube.com",
    method: "GET",
    headers:
    {
      "user-agent": 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.0.0 Safari/537.36',
    },
    validateStatus: () => true
  };

  get_video.url = settings.url;
  config.headers.referer = settings.url;


  let resp = await makeRequest(get_video, settings.timeout, 1);
  if (resp === -1) {
    if (settings.save)
      console.log("No messages found. No save made.");
    else
      console.log("No messages found.");
    return;
  }

  let location = resp.data.indexOf("var ytInitialData = ");
  if (location === -1) {
    console.log("\nAn unexpected error occurred.");
    if (settings.save)
      console.log("No messages found. No save made.");
    else
      console.log("No messages found.");
    return;
  }

  let initialData = JSON.parse(resp.data.substring(location + 20, resp.data.length).split(";</script><script nonce", 1)[0]);

  let live = false; //If the video requested is an ongoing stream
  if ("conversationBar" in initialData.contents.twoColumnWatchNextResults) { //Indicates the chat bar
    
    let bar = initialData.contents.twoColumnWatchNextResults.conversationBar;
    if (!("liveChatRenderer" in bar)) {
      console.log("\n" + bar.conversationBarRenderer.availabilityMessage.messageRenderer.text.runs[0].text);
      if (settings.save)
        console.log("No messages found. No save made.");
      else
        console.log("No messages found.");
      return;
    }

    live = ("isReplay" in bar.liveChatRenderer) ? !bar.liveChatRenderer.isReplay : true;

  } else {
    console.log("\nChat bar not found.");
    if (settings.save)
      console.log("No messages found. No save made.");
    else
      console.log("No messages found.");
    return;
  }

  if (live) {
    console.log("\nError: Live chat scraping is not yet supported")
    return;
  }

  //Print some video data
  initialData = initialData.contents.twoColumnWatchNextResults.results.results.contents;

  if ("videoPrimaryInfoRenderer" in initialData[0]) {
    let runs = initialData[0].videoPrimaryInfoRenderer.title.runs;
    let title = "";
    for (run in runs)
      title += runs[run].text;
    console.log("\n\"" + title + "\"");
    console.log(initialData[0].videoPrimaryInfoRenderer.dateText.simpleText);
  }

  //Activate scraping
  let inner_api_key = resp.data.split('"INNERTUBE_API_KEY":"', 2)[1].split('"')[0];
  let continuation_id = resp.data.split('"liveChatRenderer":{"continuations":[{"reloadContinuationData":{"continuation":"', 2)[1].split('"')[0];

  console.log("\n");
  let savedMessages = await scrapeReplayChat(inner_api_key, continuation_id, config, settings.timeout, settings);
  console.log("Complete");

  if (!settings.save)
    return;

  if (savedMessages.length === 0) {
    console.log("No messages found. No save made.");
    return;
  }
  
  let filename = "messages_" + settings.url.split("v=", 2)[1]; //Simply the name of the file; not the whole path
  let filepath = handleSaveJSON(filename, savedMessages, settings);
  console.log("Saved as " + filepath);

}


module.exports.scrape = collectChat;