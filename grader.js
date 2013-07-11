#!/usr/bin/env node
/*
Automatically grade files for the presence of specified HTML tags/attributes.
Uses commander.js and cheerio. Teaches command line application development
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
   - https://developer.mozilla.org/en-US/docs/JSON#JSON_in_Firefox_2
*/

var fs = require('fs');
var program = require('commander');
var cheerio = require('cheerio');
var HTMLFILE_DEFAULT = "index.html";
var CHECKSFILE_DEFAULT = "checks.json";
var rest = require('restler');
var util = require('util');

var assertFileExists = function(infile) {
    var instr = infile.toString();
    if(!fs.existsSync(instr)) {
        console.log("%s does not exist. Exiting.", instr);
        process.exit(1); // http://nodejs.org/api/process.html#process_process_exit_code
    }
    return instr;
};

var cheerioHtmlFile = function(htmlfile) {
    return cheerio.load(fs.readFileSync(htmlfile));
};

var loadChecks = function(checksfile) {
    return JSON.parse(fs.readFileSync(checksfile));
};

/* var cheerioURL = function(checksfile) {
    var response2console = function(result, response) {
        if (result instanceof Error) {
            console.error('Error: ' + util.format(response.message));
	    process.exit(1);
        } else {
	    $ = cheerio.load(result.toString());
	    //console.log($('title').text());
	    var checks = loadChecks(checksfile).sort();
	    var out = {};
	    for(var ii in checks) {
		//console.log($(checks[ii]))
		var present = $(checks[ii]).length > 0;
		out[checks[ii]] = present;
		//console.log(out);
	    }
	    //console.log(out);
	    //return out;
	}
	console.log("Printing out");
	console.log(out);
	return out;
    };
    //console.log(out);
    return response2console;
};
*/

var getResult = function(url, callback) {
    var res = rest.get(url).once('complete', function(result) {
	if (result instanceof Error) {
	    console.log('Error: ' + result.message);
	    process.exit(1);
	    } else {
		//console.log("Printing result object");
		//console.log(util.format(result));
		console.log("I'm being printed");
		callback(util.format(result));
		}
	});
    return res;
};


var checkURL = function(url, checksfile) {
    $ = cheerio.load(url);
    var checks = loadChecks(checksfile).sort();
    var out = {};
    for(var ii in checks) {
	var present = $(checks[ii]).length > 0;
	out[checks[ii]] = present;
    }
    return out;
};

var checkHtmlFile = function(htmlfile, checksfile) {
    $ = cheerioHtmlFile(htmlfile);
    var checks = loadChecks(checksfile).sort();
    var out = {};
    for(var ii in checks) {
        var present = $(checks[ii]).length > 0;
        out[checks[ii]] = present;
    }
    return out;
};

var clone = function(fn) {
    // Workaround for commander.js issue.
    // http://stackoverflow.com/a/6772648
    return fn.bind({});
};

if(require.main == module) {
    program
        .option('-c, --checks <check_file>', 'Path to checks.json', clone(assertFileExists), CHECKSFILE_DEFAULT)
        .option('-f, --file <html_file>', 'Path to index.html', clone(assertFileExists), HTMLFILE_DEFAULT)
        .option('-u, --url <url>', 'Provide URL address') 
        .parse(process.argv);
    if(program.url) {
	//var response2console = cheerioURL(program.checks);
	//var checkJson = rest.get(program.url).on('complete', response2console);
	var result = null;
	getResult(program.url, function(callback) {
	    result = callback;
	    console.log("Displaying result object");
	    console.log(result);
	    console.log("checkJSON is being called");
	    var checkJson = checkURL(result, program.checks);
	    console.log("Performing checks");
	    var outJson = JSON.stringify(checkJson, null, 4);
	    console.log(outJson);
	});
	//console.log(result);
	//result = result.request.res.rawEncoded;
	
	//console.log("Printing checkJson");
	//console.log(checkJson);
    } else { 
	var checkJson = checkHtmlFile(program.file, program.checks);
	console.log(checkJson);
	console.log("Performing checks");
	var outJson = JSON.stringify(checkJson, null, 4);
	console.log(outJson);
    }
} else {
    exports.checkHtmlFile = checkHtmlFile;
}
