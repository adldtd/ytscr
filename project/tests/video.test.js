const getData = require("./test-helpers").getData;
const mapVal = require("./test-helpers").mapVal;
const testVideo = require("./test-helpers").testVideo;

const gl = require("../common/globals");


global.TESTING = true;

const TERMINATED = "9BfVn7vEVlM";
const REMOVED = "HDeadIvpRTw";
const NORMAL_VIDEO_1 = "BOh5p9i4r8E";
const NORMAL_VIDEO_2 = "jNQXAC9IVRw"; //Popular!
const AGE_RESTRICTED_1 = "7m1xFXnuNqA";
const STREAMED_1 = "1vqkFcZ3xxc";
const STREAMED_2 = "5yXuWYWBEag"; //Popular!
const STREAMED_3 = "2RNkRaNfCp4"; //Popular! Chat disabled
const LIVESTREAM = "jfKfPfyJRdk"; //LIVE! May often change

jest.useRealTimers();
jest.setTimeout(100000);


test("Bad link", async () => {
  let shellArgs = "video -i bbbbbbbbbbb";
  let pack = await getData(shellArgs);

  let savedData = pack[0];
  expect(savedData).toBe(-1);
});

test("Channel terminated", async () => {
  let shellArgs = `video -i ${TERMINATED}`;
  let pack = await getData(shellArgs);

  let savedData = pack[0];
  expect(savedData).toBe(-1);
});

test("Video removed by uploader", async () => {
  let shellArgs = `video -i ${REMOVED}`;
  let pack = await getData(shellArgs);

  let savedData = pack[0];
  expect(savedData).toBe(-1);
});

test("Basic scrape 1", async () => {
  let shellArgs = `video -i ${STREAMED_1}`;
  let pack = await getData(shellArgs);

  let savedData = pack[0];
  let settings = pack[1];

  let ignore = mapVal("video", settings, false);
  let focus = mapVal("video", settings, true);
  let limits = mapVal("video", settings, Number.POSITIVE_INFINITY);
  let norp = false;

  testVideo(savedData, focus, ignore, limits, norp);
  expect(savedData).toBeInstanceOf(Object);
});

test("Basic scrape 2", async () => {
  let shellArgs = `video -i ${STREAMED_3} comments --lim 10 # recommended --lim 10 # chat --lim 10 #`;
  let pack = await getData(shellArgs);

  let savedData = pack[0];
  let settings = pack[1];

  let ignore = mapVal("video", settings, false);
  let focus = mapVal("video", settings, true);
  let limits = mapVal("video", settings, Number.POSITIVE_INFINITY);
  let norp = false;

  limits.comments[0] = 10;
  limits.recommended[0] = 10;
  limits.chat[0] = 10;

  testVideo(savedData, focus, ignore, limits, norp);
  expect(savedData).toBeInstanceOf(Object);
});

test("Ongoing livestream", async () => {
  let shellArgs = `video -i ${LIVESTREAM} recommended --lim 30`;
  let pack = await getData(shellArgs);

  let savedData = pack[0];
  let settings = pack[1];

  let ignore = mapVal("video", settings, false);
  let focus = mapVal("video", settings, true);
  let limits = mapVal("video", settings, Number.POSITIVE_INFINITY);
  let norp = false;

  limits.recommended[0] = 30;

  testVideo(savedData, focus, ignore, limits, norp);
  expect(savedData).toBeInstanceOf(Object);
});


test("Seperate recommended", async () => {
  let shellArgs = `video -i ${NORMAL_VIDEO_1} recommended --seperate`;
  let pack = await getData(shellArgs);

  let savedData = pack[0];
  let settings = pack[1];

  let ignore = mapVal("video", settings, false);
  let focus = mapVal("video", settings, true);
  let limits = mapVal("video", settings, Number.POSITIVE_INFINITY);
  let norp = false;

  testVideo(savedData, focus, ignore, limits, norp);
  expect(savedData).toBeInstanceOf(Object);
});

test("Focus 1", async () => {
  let shellArgs = `video -i ${NORMAL_VIDEO_2} --focus meta`;
  let pack = await getData(shellArgs);

  let savedData = pack[0];
  let settings = pack[1];

  let ignore = mapVal("video", settings, false);
  let focus = mapVal("video", settings, false);
  let limits = mapVal("video", settings, Number.POSITIVE_INFINITY);
  let norp = false;

  focus.meta[0] = true;

  testVideo(savedData, focus, ignore, limits, norp);
  expect(savedData).toBeInstanceOf(Object);
});

test("Focus 2", async () => {
  let shellArgs = `video -i ${AGE_RESTRICTED_1} --exclude meta --exclude chat --exclude recommended`;
  let pack = await getData(shellArgs);

  let savedData = pack[0];
  let settings = pack[1];

  let ignore = mapVal("video", settings, false);
  let focus = mapVal("video", settings, true);
  let limits = mapVal("video", settings, Number.POSITIVE_INFINITY);
  let norp = false;

  focus.meta[0] = false;
  focus.chat[0] = false;
  focus.recommended[0] = false;

  testVideo(savedData, focus, ignore, limits, norp);
  expect(savedData).toBeInstanceOf(Object);
});

test("Focus recommended 1", async () => {
  let shellArgs = `video -i ${STREAMED_2} recommended --focus videos videos --lim 10 # # --focus recommended`;
  let pack = await getData(shellArgs);

  let savedData = pack[0];
  let settings = pack[1];

  let ignore = mapVal("video", settings, false);
  let focus = mapVal("video", settings, false);
  let limits = mapVal("video", settings, Number.POSITIVE_INFINITY);
  let norp = false;

  focus.recommended[0] = true;
  focus.recommended[1].videos[0] = true;
  limits.recommended[1].videos[0] = 10;

  testVideo(savedData, focus, ignore, limits, norp);
  expect(savedData).toBeInstanceOf(Object);
});

test("Focus recommended 2", async () => {
  let shellArgs = `video -i ${STREAMED_3} recommended --lim 4 videos --lim 5 # playlists --lim 1 # --focus videos --focus playlists # --focus recommended`;
  let pack = await getData(shellArgs);

  let savedData = pack[0];
  let settings = pack[1];

  let ignore = mapVal("video", settings, false);
  let focus = mapVal("video", settings, false);
  let limits = mapVal("video", settings, Number.POSITIVE_INFINITY);
  let norp = false;

  focus.recommended[0] = true;
  focus.recommended[1].videos[0] = true;
  focus.recommended[1].playlists[0] = true;
  limits.recommended[0] = 4;
  limits.recommended[1].videos[0] = 5;
  limits.recommended[1].playlists[0] = 1;

  testVideo(savedData, focus, ignore, limits, norp);
  expect(savedData).toBeInstanceOf(Object);
});


test("Ignore 1", async () => {
  let shellArgs = `video -i ${NORMAL_VIDEO_1} comments --ignore author --ignore text --ignore id --noreply # --exclude recommended`;
  let pack = await getData(shellArgs);

  let savedData = pack[0];
  let settings = pack[1];

  let ignore = mapVal("video", settings, false);
  let focus = mapVal("video", settings, true);
  let limits = mapVal("video", settings, Number.POSITIVE_INFINITY);
  let norp = true;

  ignore.comments[1].author[0] = true;
  ignore.comments[1].text[0] = true;
  ignore.comments[1].id[0] = true;
  focus.recommended[0] = false;

  testVideo(savedData, focus, ignore, limits, norp);
  expect(savedData).toBeInstanceOf(Object);
});

test("Ignore 2", async () => {
  let shellArgs = `video -i ${STREAMED_2} comments --lim 25 --ignore picture --ignore text --ignore text --ignore channelId # recommended --lim 25 videos --ignore published # # chat --lim 25 --ignore timestamp #`;
  let pack = await getData(shellArgs);

  let savedData = pack[0];
  let settings = pack[1];

  let ignore = mapVal("video", settings, false);
  let focus = mapVal("video", settings, true);
  let limits = mapVal("video", settings, Number.POSITIVE_INFINITY);
  let norp = false;

  ignore.comments[1].picture[0] = true;
  ignore.comments[1].text[0] = true;
  ignore.comments[1].channelId[0] = true;
  ignore.recommended[1].videos[1].published[0] = true;
  ignore.chat[1].timestamp[0] = true;
  limits.comments[0] = 25;
  limits.recommended[0] = 25;
  limits.chat[0] = 25;

  testVideo(savedData, focus, ignore, limits, norp);
  expect(savedData).toBeInstanceOf(Object);
});


test("Behemoth", async () => {
  let shellArgs = `video -i ${STREAMED_2} meta # meta --ignore comments --ignore uploader --ignore subscribers --ignore handle --ignore channelId # comments --noreply --lim 46 --ignore picture --ignore text --ignore text --ignore channelId # chat --topchat --lim 50 --ignore channelId --ignore text # recommended --lim 51 videos --ignore published # playlists --ignore firstVideoId #`;
  let pack = await getData(shellArgs);

  let savedData = pack[0];
  let settings = pack[1];

  let ignore = mapVal("video", settings, false);
  let focus = mapVal("video", settings, true);
  let limits = mapVal("video", settings, Number.POSITIVE_INFINITY);
  let norp = true;

  ignore.meta[1].comments[0] = true;
  ignore.meta[1].uploader[0] = true;
  ignore.meta[1].subscribers[0] = true;
  ignore.meta[1].handle[0] = true;
  ignore.meta[1].channelId[0] = true;
  ignore.comments[1].picture[0] = true;
  ignore.comments[1].text[0] = true;
  ignore.comments[1].channelId[0] = true;
  ignore.recommended[1].videos[1].published[0] = true;
  ignore.recommended[1].playlists[1].firstVideoId[0] = true;
  ignore.chat[1].channelId[0] = true;
  ignore.chat[1].text[0] = true;
  limits.comments[0] = 46;
  limits.recommended[0] = 51;
  limits.chat[0] = 50;

  testVideo(savedData, focus, ignore, limits, norp);
  expect(savedData).toBeInstanceOf(Object);
});