#!/usr/bin/env node
/*
Automatically grade files for the presence of specified HTML tags/attributes.
Uses commander.js and cheerio.  Teaches command line application development
and basic DOM parsing.

References:

  + cheerio
  - https://github.com/MatthewMueller/cheerio
  - http://encosia.com/cheerio-faster-windows-friendly-alternative-jsdom/
  - http://maxogden.com/scraping-with-node.html

  + commander.js
  - https://github.com/visionmedia/commander.js
  - http://tjholowaychuk.com/post/9103188408/commander-js-nodejs-command-line-interfaces-made-easy

  + JSON
  - http://en.wikipedia.org/wiki/JSON
  - https://developer.mozilla.org/en-US/docs/JSON
  - https://developer.mozzilla.org/en-US/docs/JSON#JSON_in_Firefox_2
*/

var fs = require('fs');
var sys = require('util');
var program = require('commander');
var cheerio = require('cheerio');
var rest = require('restler');
var HTMLFILE_DEFAULT = "";
var CHECKSFILE_DEFAULT = "checks.json";
var tmpfile ="tmpfile";

var assertFileExists = function(infile) {
  var instr = infile.toString();
  if (!fs.existsSync(instr)) {
    console.log("%s does not exist. Exiting.", instr);
    process.exit(1); // http://nodejs.org/api/process.html#process_process_exit_code
  }
  return instr;
};

// var assertUrlExists = function(infile) {
//   var instr = infile.toString();
//   rest.get(instr).once('complete', function(result) {
//     if (result instanceof Error) {
//       console.log("%s does not exist. Exiting.", instr);
//       process.exit(1); // http://nodejs.org/api/process.html#process_process_exit_code
//     }
//   });
//   return instr;
// };


var cheerioHtmlFile = function(htmlfile) {
  return cheerio.load(fs.readFileSync(htmlfile));
};

var loadChecks = function(checksfile) {
  return JSON.parse(fs.readFileSync(checksfile));
};

var buildfn = function(url, checksfile) {
  var response2get = function(result, response) {
    if (result instanceof Error) {
      console.error('Error: ' + util.format(response.message));
    } else {
      console.error("Wrote %s", tmpfile);
      fs.writeFileSync(tmpfile, result);
      checkHtmlFile(tmpfile, checksfile);
    }
  };
  return response2get;
};

var checkHtmlFile = function(htmlfile, checksfile) {
  $ = cheerioHtmlFile(htmlfile);
  var checks = loadChecks(checksfile).sort();
  var out = {};
  for (var ii in checks) {
    var present = $(checks[ii]).length > 0;
    out[checks[ii]] = present;
  }
  var outJson = JSON.stringify(out, null, 4);
  console.log(outJson);
};

var checkUrl = function(url, checksfile) {
  var response2get = buildfn(url, checksfile);
  rest.get(url).on('complete', response2get);
};

var checkSource = function(htmlfile, checksfile, url) {
  if (htmlfile === "") {
    checkUrl(url, checksfile);
  } else {
    checkHtmlFile(htmlfile, checksfile)
  }
};

var clone = function(fn) {
  // Workaround for commander.js issue
  // http://stackoverflow.com/a/6772648
  return fn.bind({});
};

if (require.main == module) {
  console.error('Invoked at command line.');
  program
    .option('-c --checks <check_file>', 'Path to checks.json', clone(assertFileExists), CHECKSFILE_DEFAULT)
    .option('-f, --file <html_file>', 'Path to index.html', clone(assertFileExists), HTMLFILE_DEFAULT)
    .option('-u, --url <url>', 'Path to URL')
    .parse(process.argv);
  checkSource(program.file, program.checks, program.url);
} else {
  console.error('Invoked via library call');
}
  exports.checkSource = checkSource;
