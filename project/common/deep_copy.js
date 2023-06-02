const deepCopyArr = require("./helpers").deepCopyArr;


function applySet(obj, path, value) {
  for (let i = 0; i < path.length; i++) {
    if (i === path.length - 1)
      obj[path[i]] = value;
    else
      obj = obj[path[i]];
  }
}

function deepCopyArrGeneral(arr, func) { //Helper for deep copy with arrays
  let newArr = [];
  for (let item in arr) {
    item = arr[item];
    if (Array.isArray(item)) newArr.push(deepCopyArrGeneral(item, func));
    else if (typeof item === "object") newArr.push(func(item));
    else newArr.push(item);
  }
  return newArr;
}


const channelLinks = {
  videosResults: ["home", "videos"],
  shortsResults: ["home", "shorts"],
  playlistsResults: ["home", "playlists"],
  channelsResults: ["home", "channels"],

  videoAttachments: ["community", "video"],
  pollAttachments: ["community", "poll"],
  imageAttachments: ["community", "image"]
};

function deepCopyChannel(keys) {
  let newObj = {};
  for (let key in keys) {
    if (Array.isArray(keys[key])) newObj[key] = deepCopyArrGeneral(keys[key], deepCopyChannel);
    else if (typeof keys[key] === "object") {
      newObj[key] = deepCopyChannel(keys[key]);
      if (key in channelLinks)
        applySet(newObj, channelLinks[key], newObj[key]); //Assumes the "path" to which channelLinks[key] points to has already been deep copied
    }
    else newObj[key] = keys[key];
  }
  return newObj;
}


module.exports.deepCopyChannel = deepCopyChannel;