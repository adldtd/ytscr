//const axios = require("axios").default;
const fs = require("fs");
const path = require("path");
const makeRequest = require(path.join(__dirname, "..", "helpers")).makeRequest;
const handleSaveJSON = require(path.join(__dirname, "..", "helpers")).handleSaveJSON;
const clearLastLine = require(path.join(__dirname, "..", "helpers")).clearLastLine;


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
  //fs.writeFileSync("analysis4.json", JSON.stringify(pureData, null, 2));

  //Reconfigure config
  config.url = "https://www.youtube.com/youtubei/v1/live_chat/get_live_chat_replay?key=" + inner_api_key + "&prettyPrint=false";
  config.method = "POST";
  config.data = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "config_data.json")));
  config.data.context.client.originalUrl = settings.url;
  config.data.context.client.mainAppWebInfo.graftUrl = settings.url;

  config.data.currentPlayerState = {playerOffsetMs: "__________"};
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
        console.log(counter);
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

      let singleMessage = getMessageData(innerMessage, {});

      if ("videoOffsetTimeMsec" in messages[m].replayChatItemAction)
        config.data.currentPlayerState.playerOffsetMs = messages[m].replayChatItemAction.videoOffsetTimeMsec;

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

    console.log(savedMessages.length);

  }

  return savedMessages;
}


//*********************************************************************************
//Crunch message data into simpler parts
//*********************************************************************************
function getMessageData(innerMessage, ignore = {}) {
  
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

  if ("timestamp" in ignore ? !ignore.timestamp : true)
    singleMessage.timestamp = innerMessage.timestampText.simpleText;

  if ("picture" in ignore ? !ignore.picture : true) {
    let pictures = innerMessage.authorPhoto.thumbnails;
    singleMessage.picture = pictures[pictures.length - 1].url;
  }

  if ("channel" in ignore ? !ignore.channel : true)
    singleMessage.channel = innerMessage.authorExternalChannelId;

  return singleMessage;
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


(async () => { //Main

})();