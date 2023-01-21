# ytscr

A multi-modular tool for scraping various YouTube data. No API key required. Scrapes directly from requests made with axios.

## Usage

This tool is meant for both ML researchers/data collectors and more casual users. If you're looking to get every bit of data you want, simply call a module and enter the designated input. Otherwise, you can make use of a module's "submodules" - and either `--focus` or `--exclude` certain ones.

See the "Springboard" section below for more starting off points.

## Contents

Currently, the tool contains two implemented modules: `video` and `search`. Listed below are it and other modules, alongside their inner submodules.

`video`: Retrieves information from a video link

-  `meta`: Gets the video metadata

-  `comments`: Gets video comments

-  `recommended`: Gets recommendations

    -  `videos`: Deals with video/videolike recommendations

    -  `playlists`: Deals with playlist recommendations

    -  `mixes`: Deals with YouTube Mix recommendations

-  `chat`: Gets previous chat messages (if livestream or premiere)

`search`: Retrieves information from a YouTube search

-  `meta`: Gets the search metadata

-  `videos`: Deals with video/videolike results

-  `shorts`: Deals with YouTube shorts

-  `channels`: Deals with channel results

-  `playlists`: Deals with playlist results

-  `movies`: Deals with movie results

`channel`: *Under construction.*

`playlist`: *Under construction.*

## Installation

To clone the project, run `git clone https://github.com/adldtd/ytscr`

Make sure you have NodeJS and npm installed on your computer (recommended: Node 16.16.0, npm 8.1.0). Then, using your terminal, navigate to the cloned folder, then to `./project` and run `npm install` inside. This should install all required dependencies in a folder called node_modules, and it should link the CLI to the terminal. From there, run `ytscr` (or `node ytscr`) to get started.

NOTE: If the CLI command fails to link, alternatively you can navigate to `./project/entry` and run the script directly (substitute `ytscr` for `node ytscr.js`, with your arguments in front).

## Springboard

Here are some examples of input for getting started.

### Navigation

```console
ytscr --help
```
- Prints a help screen. Under the `MODULES` tab are valid modules, and under `COMMANDS/FLAGS` are valid commands. For the following examples, we'll be focusing solely on the video module.

```console
ytscr video --help
```
- Each module has its own help screen.
- Each module also has its own set of modules - known as "submodules". These are grouped into the specific *areas* the scraper will collect. (For example, the comments submodule focuses on comment collection).

```console
ytscr video comments --help
```
- Each submodule also has a help screen.
- The `Scraped Attributes` tab lists the specific info that will be collected during scraping.

### Scraping

```console
ytscr video --input <YOUTUBE LINK>
```
- Scrapes all modules from \<YOUTUBE LINK\>. May take long if comments and/or other sections are large.

```console
ytscr video comments --lim <VALUE> # --input <YOUTUBE LINK>
```
- A remedy for the problem above; the argument `--lim` takes in a positive integer \<VALUE\>, denoting the max number of comments to scrape.
- Notice the `#` in the middle. This is a special meta character, which can exit the "scope" of a called submodule. Here, it is used to exit `comments`.

```console
ytscr video --input <YOUTUBE LINK> --focus meta --focus recommended
```
- The `--focus` command tells the program to only scrape a certain submodule (by default, all submodules are scraped).
- Here, only the meta and recommended sections will be scraped.
```console
ytscr video --input <YOUTUBE LINK> --exclude comments
```
- The `--exclude` command does the opposite; it excludes a certain submodule from being scraped.
- Here, every submodule, except for comments, will be scraped.
```console
ytscr video comments --filter { --check <ATTRIBUTE> --match <VALUE> --compare <COMPARISON> }
--savefilter # --input <YOUTUBE LINK>
```
- This one is a little more complex; let's run through it step by step.
- **ytscr** provides a simple filtering system, where certain submodules support filtering of scraped attributes.
- First, we enter into the comments submodule, and specify the command `--filter`, which takes in an opening bracket as an argument.
- The filter is made up of three components: `--check`, `--match`, and `--compare`: the first specifies which attribute to check, the second the "value" to compare to the attribute, and the third the type of comparison to make.
- The closing bracket is required to exit the "filter scope". The flag `--savefilter` tells the scraper to only save comments which match the given filter(s).
- For more information about filtering, use `--help` on any of the commands/flags listed here.

(PS: If you enter more filters alongside `--savefilter`, the program will only save comments which match *all* of the filters entered.)