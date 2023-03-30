const path = require("path");
const cli = require(path.join(__dirname, "..", "entry", "cli")).cli;
const parse = require("./test-helpers").parse;


global.TESTING = true;

function baseModuleTests(stage, module) {

  test(stage + "No input", () => {
    let parsed = parse(`${module}`);
    expect(cli(parsed)).toBe(-1);
  });

  test(stage + "Argument expected", () => {
    let parsed = parse(`${module} --input`);
    expect(cli(parsed)).toBe(-1);
  });

  test(stage + "Too many arguments", () => {
    let parsed = parse(`${module} --verbose 1 4`);
    expect(cli(parsed)).toBe(-1);
  });

  test(stage + "Help called 1", () => {
    let parsed = parse(`${module} --help`);
    expect(cli(parsed)).toBe(1);
  });

  test(stage + "Help called 2", () => {
    let parsed = parse(`${module} --help #`);
    expect(cli(parsed)).toBe(1);
  });

  test(stage + "No such command", () => {
    let parsed = parse(`${module} -inp`);
    expect(cli(parsed)).toBe(-1);
  });

  test(stage + "No exiting main module", () => {
    let parsed = parse(`${module} #`);
    expect(cli(parsed)).toBe(-1);
  });

  test(stage + "No such submodule", () => {
    let parsed = parse(`${module} --focus this_submodule_will_never_exist`);
    expect(cli(parsed)).toBe(-1);
  });
}

function baseFilterTests(stage, inp, module, submodule, strattrib, numattrib = "") {

  test(stage + "Filter command outside of filter 1", () => {
    let parsed = parse(`${module} -i ${inp} ${submodule} --check`);
    expect(cli(parsed)).toBe(-1);
  });
  
  test(stage + "Filter command outside of filter 2", () => {
    let parsed = parse(`${module} -i ${inp} ${submodule} --compare 15 #`);
    expect(cli(parsed)).toBe(-1);
  });
  
  test(stage + "Bad filter start", () => {
    let parsed = parse(`${module} -i ${inp} ${submodule} --filter }`);
    expect(cli(parsed)).toBe(-1);
  });
  
  test(stage + "Filter unclosed 1", () => {
    let parsed = parse(`${module} -i ${inp} ${submodule} --filter {`);
    expect(cli(parsed)).toBe(-1);
  });
  
  test(stage + "Filter unclosed 2", () => {
    let parsed = parse(`${module} -i ${inp} ${submodule} -f { #`);
    expect(cli(parsed)).toBe(-1);
  });
  
  test(stage + "Non-filter command inside of filter", () => {
    let parsed = parse(`${module} -i ${inp} ${submodule} --filter { --ignore`);
    expect(cli(parsed)).toBe(-1);
  });

  test(stage + "Not enough filter commands", () => {
    let parsed = parse(`${module} -i ${inp} ${submodule} --filter { } #`);
    expect(cli(parsed)).toBe(-1);
  });


  test(stage + "Bad check value", () => {
    let parsed = parse(`${module} -i ${inp} ${submodule} --filter { --check OOOOOO --match OOOOOO --compare eq }`);
    expect(cli(parsed)).toBe(-1);
  });
  
  test(stage + "Bad compare value", () => {
    let parsed = parse(`${module} -i ${inp} ${submodule} --filter { --check ${strattrib} --match OOOOOO --compare something }`);
    expect(cli(parsed)).toBe(-1);
  });
  
  test(stage + "Invalid compare for string", () => {
    let parsed = parse(`${module} -i ${inp} ${submodule} --filter { --check ${strattrib} --match OOOOOO --compare less }`);
    expect(cli(parsed)).toBe(-1);
  });
  
  if (numattrib !== "") {

    test(stage + "Invalid compare for num", () => {
      let parsed = parse(`${module} -i ${inp} ${submodule} --filter { --check ${numattrib} --match 15 --compare in }`);
      expect(cli(parsed)).toBe(-1);
    });
    
    test(stage + "Invalid match for num", () => {
      let parsed = parse(`${module} --input ${inp} ${submodule} --filter { --check ${numattrib} --match OOOOOO --compare eq }`);
      expect(cli(parsed)).toBe(-1);
    });
  }
  
  test(stage + "Ignoring filtered value", () => {
    let parsed = parse(`${module} -i ${inp} ${submodule} --ignore ${strattrib} --filter { --check ${strattrib} --match 15 --compare eq } #`);
    expect(cli(parsed)).toBe(-1);
  });
  
  if (numattrib !== "") {

    test(stage + "Good filter 1", () => {
      let parsed = parse(`${module} -i ${inp} ${submodule} --filter { --check ${numattrib} --match 15 --compare eq } #`);
      expect(cli(parsed)).toBeInstanceOf(Array);
    });
    
    test(stage + "Good filter 2", () => {
      let parsed = parse(`${module} --input ${inp} ${submodule} --filter { --check ${numattrib} --match 15 --compare less -cs } #`);
      expect(cli(parsed)).toBeInstanceOf(Array);
    });
  }
  
  test(stage + "Good filter 3", () => {
    let parsed = parse(`${module} -i ${inp} ${submodule} --filter { --check ${strattrib} --match Song? }`);
    expect(cli(parsed)).toBeInstanceOf(Array);
  });
}



var stage = "GENERAL: ";

test(stage + "No input", () => {
  let parsed = parse("");
  expect(cli(parsed)).toBe(1); //Returns help message
});

test(stage + "Correct input", () => {
  let parsed = parse("video --input https://www.youtube.com/watch?v=jNQXAC9IVRw");
  expect(cli(parsed)).toBeInstanceOf(Array);
});



stage = "VIDEO: ";

baseModuleTests(stage, "video");

test(stage + "Bad input 1", () => {
  let parsed = parse("video -i lol");
  expect(cli(parsed)).toBe(-1);
});

test(stage + "Bad input 2", () => {
  let parsed = parse("video -i htps://www.youtube.com/watch?v=jNQXAC9IVRw");
  expect(cli(parsed)).toBe(-1);
});

test(stage + "Bad input 3", () => {
  let parsed = parse("video --input jNQXAC9IVRws");
  expect(cli(parsed)).toBe(-1);
});

test(stage + "Good input", () => {
  let parsed = parse("video -i jNQXAC9IVRw");
  expect(cli(parsed)).toBeInstanceOf(Array);
});


stage = "VIDEO/META: ";

test(stage + "No input", () => {
  let parsed = parse("video meta");
  expect(cli(parsed)).toBe(-1);
});

test(stage + "No such command", () => {
  let parsed = parse("video -i jNQXAC9IVRw meta --explode_computer");
  expect(cli(parsed)).toBe(-1);
});

test(stage + "Help called 1", () => {
  let parsed = parse("video -i jNQXAC9IVRw meta -h");
  expect(cli(parsed)).toBe(1);
});

test(stage + "Help called 2", () => {
  let parsed = parse("video -i jNQXAC9IVRw meta -h -h");
  expect(cli(parsed)).toBe(1);
});

test(stage + "Invalid ignore", () => {
  let parsed = parse("video --input jNQXAC9IVRw meta --ignore this_attribute_does_not_exist");
  expect(cli(parsed)).toBe(-1);
});

test(stage + "Successful ignore", () => {
  let parsed = parse("video -i jNQXAC9IVRw meta --ignore id");
  expect(cli(parsed)).toBeInstanceOf(Array);
});

test(stage + "Multiple ignore", () => {
  let parsed = parse("video -i jNQXAC9IVRw meta --ignore id --ignore title --ignore views --ignore views");
  expect(cli(parsed)).toBeInstanceOf(Array);
});

test(stage + "Successful ignore + exit", () => {
  let parsed = parse("video -i jNQXAC9IVRw meta --ignore id #");
  expect(cli(parsed)).toBeInstanceOf(Array);
});


stage = "VIDEO/COMMENTS: ";

test(stage + "No input", () => {
  let parsed = parse("video comments");
  expect(cli(parsed)).toBe(-1);
});

test(stage + "No such command", () => {
  let parsed = parse("video -i jNQXAC9IVRw comments --ooooooooooooooooooooooo");
  expect(cli(parsed)).toBe(-1);
});

test(stage + "Help called 1", () => {
  let parsed = parse("video -i jNQXAC9IVRw comments -h");
  expect(cli(parsed)).toBe(1);
});

test(stage + "Help called 2", () => {
  let parsed = parse("video -i jNQXAC9IVRw comments -h -h");
  expect(cli(parsed)).toBe(1);
});

baseFilterTests(stage, "jNQXAC9IVRw", "video", "comments", "text", "votes");

test(stage + "Print filter", () => {
  let parsed = parse("video -i jNQXAC9IVRw comments --printfilter");
  expect(cli(parsed)).toBeInstanceOf(Array);
});

test(stage + "No reply filtering", () => {
  let parsed = parse("video -i jNQXAC9IVRw comments -nrf");
  expect(cli(parsed)).toBeInstanceOf(Array);
});

test(stage + "Behemoth", () => {
  let parsed = parse("video -i jNQXAC9IVRw comments --ignore author --filter { --check votes --match 15 --compare eq -cs } -sf -nrf --newest # comments --filter { --check text --match Song? } #");
  expect(cli(parsed)).toBeInstanceOf(Array);
});


stage = "VIDEO/CHAT: ";

test(stage + "No input", () => {
  let parsed = parse("video chat");
  expect(cli(parsed)).toBe(-1);
});

test(stage + "No such command", () => {
  let parsed = parse("video -i jNQXAC9IVRw chat --ooooooooooooooooooooooo");
  expect(cli(parsed)).toBe(-1);
});

test(stage + "Help called 1", () => {
  let parsed = parse("video -i jNQXAC9IVRw chat -h");
  expect(cli(parsed)).toBe(1);
});

test(stage + "Help called 2", () => {
  let parsed = parse("video -i jNQXAC9IVRw chat -h -h");
  expect(cli(parsed)).toBe(1);
});

baseFilterTests(stage, "jNQXAC9IVRw", "video", "chat", "text", "timestamp");

test(stage + "Print filter", () => {
  let parsed = parse("video -i jNQXAC9IVRw chat --printfilter");
  expect(cli(parsed)).toBeInstanceOf(Array);
});

test(stage + "Top chat", () => {
  let parsed = parse("video -i jNQXAC9IVRw chat --topchat");
  expect(cli(parsed)).toBeInstanceOf(Array);
});

test(stage + "Behemoth", () => {
  let parsed = parse("video -i jNQXAC9IVRw chat --ignore author --ignore channelId --filter { --check timestamp --match 15 --compare eq -cs } -sf # chat --filter { --check text --match Song? } #");
  expect(cli(parsed)).toBeInstanceOf(Array);
});


stage = "VIDEO/RECOMMENDED: ";

test(stage + "No input", () => {
  let parsed = parse("video recommended");
  expect(cli(parsed)).toBe(-1);
});

test(stage + "No such command", () => {
  let parsed = parse("video -i jNQXAC9IVRw recommended --ooooooooooooooooooooooo");
  expect(cli(parsed)).toBe(-1);
});

test(stage + "Help called 1", () => {
  let parsed = parse("video -i jNQXAC9IVRw recommended -h");
  expect(cli(parsed)).toBe(1);
});

test(stage + "Help called 2", () => {
  let parsed = parse("video -i jNQXAC9IVRw recommended -h -h");
  expect(cli(parsed)).toBe(1);
});

baseFilterTests(stage, "jNQXAC9IVRw", "video", "recommended videos", "channelId", "views");

baseFilterTests(stage, "jNQXAC9IVRw", "video", "recommended playlists", "firstVideoId", "size");

baseFilterTests(stage, "jNQXAC9IVRw", "video", "recommended mixes", "firstVideoId");



stage = "SEARCH: ";

baseModuleTests(stage, "search");

test(stage + "Not enough arguments", () => {
  let parsed = parse("search -i");
  expect(cli(parsed)).toBe(-1);
});

test(stage + "Good input 1", () => {
  let parsed = parse("search -i me");
  expect(cli(parsed)).toBeInstanceOf(Array);
});

test(stage + "Good input 2", () => {
  let parsed = parse("search -i \"me at the zoo\"");
  expect(cli(parsed)).toBeInstanceOf(Array);
});

test(stage + "Bad arguments 1", () => {
  let parsed = parse("search -i zoo -tfr \"Last Hour\"");
  expect(cli(parsed)).toBe(-1);
});

test(stage + "Bad arguments 2", () => {
  let parsed = parse("search -i zoo -tfr \"LastHour\" -ft 360 --features CC");
  expect(cli(parsed)).toBe(-1);
});

test(stage + "Good arguments", () => {
  let parsed = parse("search -i zoo -tfr \"LastHour\" -ft 360 --features CreativeCommons -tp Video");
  expect(cli(parsed)).toBeInstanceOf(Array);
});


stage = "SEARCH/META: ";

test(stage + "No input", () => {
  let parsed = parse("search meta");
  expect(cli(parsed)).toBe(-1);
});

test(stage + "No such command", () => {
  let parsed = parse("search -i zoo meta --explode_computer");
  expect(cli(parsed)).toBe(-1);
});

test(stage + "Help called 1", () => {
  let parsed = parse("search -i zoo meta -h");
  expect(cli(parsed)).toBe(1);
});

test(stage + "Help called 2", () => {
  let parsed = parse("search -i zoo meta -h -h");
  expect(cli(parsed)).toBe(1);
});

test(stage + "Invalid ignore", () => {
  let parsed = parse("search --input zoo meta --ignore this_attribute_does_not_exist");
  expect(cli(parsed)).toBe(-1);
});

test(stage + "Successful ignore", () => {
  let parsed = parse("search -i zoo meta --ignore predictions");
  expect(cli(parsed)).toBeInstanceOf(Array);
});

test(stage + "Multiple ignore", () => {
  let parsed = parse("search -i zoo meta --ignore predictions --ignore estimatedResults");
  expect(cli(parsed)).toBeInstanceOf(Array);
});

test(stage + "Successful ignore + exit", () => {
  let parsed = parse("search -i zoo meta --ignore predictions #");
  expect(cli(parsed)).toBeInstanceOf(Array);
});


stage = "SEARCH/RESULTS: ";

test(stage + "No input", () => {
  let parsed = parse("search videos");
  expect(cli(parsed)).toBe(-1);
});

test(stage + "No such command", () => {
  let parsed = parse("search -i zoo mixes --ooooooooooooooooooooooo");
  expect(cli(parsed)).toBe(-1);
});

test(stage + "Help called 1", () => {
  let parsed = parse("search -i zoo playlists -h");
  expect(cli(parsed)).toBe(1);
});

test(stage + "Help called 2", () => {
  let parsed = parse("search -i zoo movies -h -h");
  expect(cli(parsed)).toBe(1);
});

baseFilterTests(stage, "zoo", "search", "videos", "title", "views");

baseFilterTests(stage, "zoo", "search", "shorts", "thumbnail", "views");

baseFilterTests(stage, "zoo", "search", "channels", "name", "subscribers");

baseFilterTests(stage, "zoo", "search", "playlists", "shortVideos", "size");

baseFilterTests(stage, "zoo", "search", "mixes", "shortVideoIds");

baseFilterTests(stage, "zoo", "search", "movies", "contentHeaders", "year");

test(stage + "Behemoth 1", () => {
  let parsed = parse("search -i zoo videos --filter { --check id --match darn } --ignore badges # videos # mixes --lim 100 -sf -f { --check title --match \"under\" --compare eq }");
  expect(cli(parsed)).toBeInstanceOf(Array);
});

test(stage + "Behemoth 2", () => {
  let parsed = parse("search -i zoo videos --ignore title --filter { --check badges --match darn } --ignore id # playlists # playlists -f { --check verified --match \"true\" --compare eq } # channels --ignore picture --ignore handle --ignore channelId --filter { --check subscribers --match 80000 --compare greatereq } #");
  expect(cli(parsed)).toBeInstanceOf(Array);
});

test(stage + "Behemoth 3", () => {
  let parsed = parse("search -tfr LastHour movies --filter { --check id --match darn } --ignore contentHeaders # shorts --limfilter 1 -f { --check id --match \"dang\" --compare in } # -i zoo");
  expect(cli(parsed)).toBeInstanceOf(Array);
});



stage = "PLAYLIST: ";

baseModuleTests(stage, "playlist");

test(stage + "Not enough arguments", () => {
  let parsed = parse("playlist -i");
  expect(cli(parsed)).toBe(-1);
});

test(stage + "Good input 1", () => {
  let parsed = parse("playlist -i PLFsQleAWXsj_4yDeebiIADdH5FMayBiJo");
  expect(cli(parsed)).toBeInstanceOf(Array);
});

test(stage + "Good input 2", () => {
  let parsed = parse("playlist -i \"youtube.com/playlist?list=PLFsQleAWXsj_4yDeebiIADdH5FMayBiJo\"");
  expect(cli(parsed)).toBeInstanceOf(Array);
});

test(stage + "Bad focus 1", () => {
  let parsed = parse("playlist -i PLFsQleAWXsj_4yDeebiIADdH5FMayBiJo -fc this_submodule_does_not_exist");
  expect(cli(parsed)).toBe(-1);
});

test(stage + "Bad focus 2", () => {
  let parsed = parse("playlist -i PLFsQleAWXsj_4yDeebiIADdH5FMayBiJo --exclude meta --focus meta");
  expect(cli(parsed)).toBe(-1);
});

test(stage + "Good arguments", () => {
  let parsed = parse("playlist -i PLFsQleAWXsj_4yDeebiIADdH5FMayBiJo --focus videos");
  expect(cli(parsed)).toBeInstanceOf(Array);
});


stage = "PLAYLIST/VIDEOS: ";

test(stage + "No input", () => {
  let parsed = parse("playlist videos");
  expect(cli(parsed)).toBe(-1);
});

test(stage + "No such command", () => {
  let parsed = parse("playlist -i PLFsQleAWXsj_4yDeebiIADdH5FMayBiJo videos --ooooooooooooooooooooooo");
  expect(cli(parsed)).toBe(-1);
});

test(stage + "Help called 1", () => {
  let parsed = parse("playlist -i PLFsQleAWXsj_4yDeebiIADdH5FMayBiJo videos -h");
  expect(cli(parsed)).toBe(1);
});

test(stage + "Help called 2", () => {
  let parsed = parse("playlist -i PLFsQleAWXsj_4yDeebiIADdH5FMayBiJo videos -h -h");
  expect(cli(parsed)).toBe(1);
});

baseFilterTests(stage, "PLFsQleAWXsj_4yDeebiIADdH5FMayBiJo", "playlist", "videos", "handle", "duration");

test(stage + "Behemoth", () => {
  let parsed = parse("playlist -i PLFsQleAWXsj_4yDeebiIADdH5FMayBiJo videos # videos # videos # videos -f { --check title --match Red --compare eq } --ignore duration --ignore published # videos --filter { --check views --match 5000 --compare less }");
  expect(cli(parsed)).toBeInstanceOf(Array);
});


stage = "PLAYLIST/META: ";

test(stage + "No input", () => {
  let parsed = parse("playlist meta");
  expect(cli(parsed)).toBe(-1);
});

test(stage + "No such command", () => {
  let parsed = parse("playlist -i PLFsQleAWXsj_4yDeebiIADdH5FMayBiJo meta --cewdawdwd #");
  expect(cli(parsed)).toBe(-1);
});

test(stage + "Help called 1", () => {
  let parsed = parse("playlist -i PLFsQleAWXsj_4yDeebiIADdH5FMayBiJo meta -h");
  expect(cli(parsed)).toBe(1);
});

test(stage + "Help called 2", () => {
  let parsed = parse("playlist -i PLFsQleAWXsj_4yDeebiIADdH5FMayBiJo meta --help -h");
  expect(cli(parsed)).toBe(1);
});

test(stage + "Invalid ignore", () => {
  let parsed = parse("playlist -i PLFsQleAWXsj_4yDeebiIADdH5FMayBiJo meta --ignore DOES_NOT_EXIST");
  expect(cli(parsed)).toBe(-1);
});

test(stage + "Successful ignore", () => {
  let parsed = parse("playlist -i PLFsQleAWXsj_4yDeebiIADdH5FMayBiJo meta --ignore uploader");
  expect(cli(parsed)).toBeInstanceOf(Array);
});

test(stage + "Multiple ignore", () => {
  let parsed = parse("playlist -i PLFsQleAWXsj_4yDeebiIADdH5FMayBiJo meta --ignore channelId --ignore id --ignore handle --ignore views #");
  expect(cli(parsed)).toBeInstanceOf(Array);
});