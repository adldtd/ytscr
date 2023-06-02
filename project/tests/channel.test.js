const getData = require("./test-helpers").getData;
const mapVal = require("./test-helpers").mapVal;
const testChannel = require("./test-helpers").testChannel;

const gl = require("../common/globals");


global.TESTING = true;

const INVALID1 = "@awiu8j012e";
const INVALID2 = "UChl_7KekN51he6XLEosLFzD";
const CHANNEL1 = "UChl_7KekN51he6XLEosLFzQ";
const CHANNEL2 = "@DZYcx"; //Many subscriptions
const CHANNEL3 = "@markiplier"; //Many videos; many streams; many playlists; many posts
const CHANNEL4 = "UC1I6IK6fBzeag5HkqIcchDA";
const CHANNEL5 = "@TechCrunch"; //Many videos; many shorts; many streams; many playlists
const CHANNEL6 = "@FlyTechVideos"; //Many videos; many posts

jest.useRealTimers();
jest.setTimeout(100000);


test("Bad link 1", async () => {
  let shellArgs = `channel -i ${INVALID1}`;
  let pack = await getData(shellArgs);

  let savedData = pack[0];
  expect(savedData).toBe(-1);
});

test("Bad link 2", async () => {
  let shellArgs = `channel -i ${INVALID2}`;
  let pack = await getData(shellArgs);

  let savedData = pack[0];
  expect(savedData).toBe(-1);
});

test("Basic scrape 1", async () => {
  let shellArgs = `channel -i ${CHANNEL1}`;
  let pack = await getData(shellArgs);

  let savedData = pack[0];
  let settings = pack[1];

  let ignore = mapVal("channel", settings, false);
  let focus = mapVal("channel", settings, true);
  let limits = mapVal("channel", settings, Number.POSITIVE_INFINITY);

  let additionalData = {
    home: {
      seperate: false,
      nosections: false
    },
    playlists: {
      combine: false
    },
    community: {
      noattach: false
    },
    channels: {
      combine: false
    }
  };

  testChannel(savedData, focus, ignore, limits, additionalData);
  expect(savedData).toBeInstanceOf(Object);
});

test("Basic scrape 2", async () => {
  let shellArgs = `channel -i ${CHANNEL2} channels --lim 50`;
  let pack = await getData(shellArgs);

  let savedData = pack[0];
  let settings = pack[1];

  let ignore = mapVal("channel", settings, false);
  let focus = mapVal("channel", settings, true);
  let limits = mapVal("channel", settings, Number.POSITIVE_INFINITY);
  limits.channels[0] = 50;

  let additionalData = {
    home: {
      seperate: false,
      nosections: false
    },
    playlists: {
      combine: false
    },
    community: {
      noattach: false
    },
    channels: {
      combine: false
    }
  };

  testChannel(savedData, focus, ignore, limits, additionalData);
  expect(savedData).toBeInstanceOf(Object);
});

test("Basic scrape 3", async () => {
  let shellArgs = `channel -i ${CHANNEL3} videos --lim 10 # live --lim 10 # playlists --lim 10 # community --lim 2 #`;
  let pack = await getData(shellArgs);

  let savedData = pack[0];
  let settings = pack[1];

  let ignore = mapVal("channel", settings, false);
  let focus = mapVal("channel", settings, true);
  let limits = mapVal("channel", settings, Number.POSITIVE_INFINITY);
  limits.videos[0] = 10;
  limits.live[0] = 10;
  limits.playlists[0] = 10;
  limits.community[0] = 2;

  let additionalData = {
    home: {
      seperate: false,
      nosections: false
    },
    playlists: {
      combine: false
    },
    community: {
      noattach: false
    },
    channels: {
      combine: false
    }
  };

  testChannel(savedData, focus, ignore, limits, additionalData);
  expect(savedData).toBeInstanceOf(Object);
});

test("Home focus 1", async () => {
  let shellArgs = `channel -i ${CHANNEL6} --focus home home videos --lim 5 # channels --lim 5 # --nosections`;
  let pack = await getData(shellArgs);

  let savedData = pack[0];
  let settings = pack[1];

  let ignore = mapVal("channel", settings, false);
  let focus = mapVal("channel", settings, false);
  focus.home[0] = true;
  focus.home[1].videos[0] = true;
  focus.home[1].shorts[0] = true;
  focus.home[1].playlists[0] = true;
  focus.home[1].channels[0] = true;
  let limits = mapVal("channel", settings, Number.POSITIVE_INFINITY);
  limits.home[1].videos[0] = 5;
  limits.home[1].channels[0] = 5;

  let additionalData = {
    home: {
      seperate: false,
      nosections: true
    },
    playlists: {
      combine: false
    },
    community: {
      noattach: false
    },
    channels: {
      combine: false
    }
  };

  testChannel(savedData, focus, ignore, limits, additionalData);
  expect(savedData).toBeInstanceOf(Object);
});

test("Home focus 2", async () => {
  let shellArgs = `channel -i ${CHANNEL5} --focus home home --focus videos --focus shorts --focus channels --seperate --nosections`;
  let pack = await getData(shellArgs);

  let savedData = pack[0];
  let settings = pack[1];

  let ignore = mapVal("channel", settings, false);
  let focus = mapVal("channel", settings, false);
  focus.home[0] = true;
  focus.home[1].videos[0] = true;
  focus.home[1].shorts[0] = true;
  focus.home[1].channels[0] = true;
  let limits = mapVal("channel", settings, Number.POSITIVE_INFINITY);

  let additionalData = {
    home: {
      seperate: true,
      nosections: true
    },
    playlists: {
      combine: false
    },
    community: {
      noattach: false
    },
    channels: {
      combine: false
    }
  };

  testChannel(savedData, focus, ignore, limits, additionalData);
  expect(savedData).toBeInstanceOf(Object);
});

test("Home focus 3", async () => {
  let shellArgs = `channel -i ${CHANNEL3} --focus home home --lim 36 --seperate --exclude shorts --exclude channels playlists --lim 10 # videos --ignore verified --ignore channelId`;
  let pack = await getData(shellArgs);

  let savedData = pack[0];
  let settings = pack[1];

  let ignore = mapVal("channel", settings, false);
  ignore.home[1].videos[1].verified[0] = true;
  ignore.home[1].videos[1].channelId[0] = true;
  let focus = mapVal("channel", settings, false);
  focus.home[0] = true;
  focus.home[1].videos[0] = true;
  focus.home[1].playlists[0] = true;
  let limits = mapVal("channel", settings, Number.POSITIVE_INFINITY);
  limits.home[0] = 36;
  limits.home[1].playlists[0] = 10;

  let additionalData = {
    home: {
      seperate: true,
      nosections: false
    },
    playlists: {
      combine: false
    },
    community: {
      noattach: false
    },
    channels: {
      combine: false
    }
  };

  testChannel(savedData, focus, ignore, limits, additionalData);
  expect(savedData).toBeInstanceOf(Object);
});

test("Playlists, channels focus 1", async () => {
  let shellArgs = `channel -i ${CHANNEL2} --focus channels channels --lim 30 --combine`;
  let pack = await getData(shellArgs);

  let savedData = pack[0];
  let settings = pack[1];

  let ignore = mapVal("channel", settings, false);
  let focus = mapVal("channel", settings, false);
  focus.channels[0] = true;
  let limits = mapVal("channel", settings, Number.POSITIVE_INFINITY);
  limits.channels[0] = 30;

  let additionalData = {
    home: {
      seperate: false,
      nosections: false
    },
    playlists: {
      combine: false
    },
    community: {
      noattach: false
    },
    channels: {
      combine: true
    }
  };

  testChannel(savedData, focus, ignore, limits, additionalData);
  expect(savedData).toBeInstanceOf(Object);
});

test("Playlists, channels focus 2", async () => {
  let shellArgs = `channel -i ${CHANNEL6} --focus playlists playlists --lim 10 --ignore updated --ignore thumbnail --ignore handle --lastvideoall`;
  let pack = await getData(shellArgs);

  let savedData = pack[0];
  let settings = pack[1];

  let ignore = mapVal("channel", settings, false);
  ignore.playlists[1].updated[0] = true;
  ignore.playlists[1].thumbnail[0] = true;
  ignore.playlists[1].handle[0] = true;
  let focus = mapVal("channel", settings, false);
  focus.playlists[0] = true;
  let limits = mapVal("channel", settings, Number.POSITIVE_INFINITY);
  limits.playlists[0] = 10;

  let additionalData = {
    home: {
      seperate: false,
      nosections: false
    },
    playlists: {
      combine: false
    },
    community: {
      noattach: false
    },
    channels: {
      combine: false
    }
  };

  testChannel(savedData, focus, ignore, limits, additionalData);
  expect(savedData).toBeInstanceOf(Object);
});

test("Playlists, channels focus 3", async () => {
  let shellArgs = `channel -i ${CHANNEL5} --focus channels --focus playlists channels --lim 35 --ignore subscribers --ignore videos # playlists --combine --lim 20 --ignore id --ignore title #`;
  let pack = await getData(shellArgs);

  let savedData = pack[0];
  let settings = pack[1];

  let ignore = mapVal("channel", settings, false);
  ignore.playlists[1].id[0] = true;
  ignore.playlists[1].title[0] = true;
  ignore.channels[1].subscribers[0] = true;
  ignore.channels[1].videos[0] = true;
  let focus = mapVal("channel", settings, false);
  focus.playlists[0] = true;
  focus.channels[0] = true;
  let limits = mapVal("channel", settings, Number.POSITIVE_INFINITY);
  limits.playlists[0] = 20;
  limits.channels[0] = 35;

  let additionalData = {
    home: {
      seperate: false,
      nosections: false
    },
    playlists: {
      combine: true
    },
    community: {
      noattach: false
    },
    channels: {
      combine: false
    }
  };

  testChannel(savedData, focus, ignore, limits, additionalData);
  expect(savedData).toBeInstanceOf(Object);
});

test("Focus community", async () => {
  let shellArgs = `channel -i ${CHANNEL6} --focus community community --lim 10 --ignore text --ignore comments --focus image`;
  let pack = await getData(shellArgs);

  let savedData = pack[0];
  let settings = pack[1];

  let ignore = mapVal("channel", settings, false);
  ignore.community[1].text[0] = true;
  ignore.community[1].comments[0] = true;
  let focus = mapVal("channel", settings, false);
  focus.community[0] = true;
  focus.community[1].image[0] = true;
  let limits = mapVal("channel", settings, Number.POSITIVE_INFINITY);
  limits.community[0] = 10;

  let additionalData = {
    home: {
      seperate: false,
      nosections: false
    },
    playlists: {
      combine: false
    },
    community: {
      noattach: false
    },
    channels: {
      combine: false
    }
  };

  testChannel(savedData, focus, ignore, limits, additionalData);
  expect(savedData).toBeInstanceOf(Object);
});

test("Behemoth 1", async () => {
  let shellArgs = `channel -i ${CHANNEL4} --exclude community --exclude store --exclude channels about --ignore views # home --seperate --nosections --lim 2 videos --ignore profilePicture # # playlists --combine --limsectionall 500 #`;
  let pack = await getData(shellArgs);

  let savedData = pack[0];
  let settings = pack[1];

  let ignore = mapVal("channel", settings, false);
  ignore.about[1].views[0] = true;
  ignore.home[1].videos[1].profilePicture[0] = true;
  let focus = mapVal("channel", settings, true);
  focus.community[0] = false;
  focus.store[0] = false;
  focus.channels[0] = false;
  let limits = mapVal("channel", settings, Number.POSITIVE_INFINITY);
  limits.home[0] = 2;

  let additionalData = {
    home: {
      seperate: true,
      nosections: true
    },
    playlists: {
      combine: true
    },
    community: {
      noattach: false
    },
    channels: {
      combine: false
    }
  };

  testChannel(savedData, focus, ignore, limits, additionalData);
  expect(savedData).toBeInstanceOf(Object);
});

test("Behemoth 2", async () => {
  let shellArgs = `channel -i ${CHANNEL3} videos --lim 45 -pop --ignore views --ignore duration # shorts --lim 1 # live --lim 15 --popular --ignore title --ignore views # playlists --lim 10 --ignore thumbnail # community --lim 6 --noattach # channels --lim 20 #`;
  let pack = await getData(shellArgs);

  let savedData = pack[0];
  let settings = pack[1];

  let ignore = mapVal("channel", settings, false);
  ignore.videos[1].views[0] = true;
  ignore.videos[1].duration[0] = true;
  ignore.live[1].title[0] = true;
  ignore.live[1].views[0] = true;
  ignore.playlists[1].thumbnail[0] = true;
  let focus = mapVal("channel", settings, true);
  let limits = mapVal("channel", settings, Number.POSITIVE_INFINITY);
  limits.videos[0] = 45;
  limits.shorts[0] = 1;
  limits.live[0] = 15;
  limits.playlists[0] = 10;
  limits.community[0] = 6;
  limits.channels[0] = 20;

  let additionalData = {
    home: {
      seperate: false,
      nosections: false
    },
    playlists: {
      combine: false
    },
    community: {
      noattach: true
    },
    channels: {
      combine: false
    }
  };

  testChannel(savedData, focus, ignore, limits, additionalData);
  expect(savedData).toBeInstanceOf(Object);
});