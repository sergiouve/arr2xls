#!/usr/bin/env node

var program = require('commander');
var runner = require('child_process');
var ProgressBar = require('progress');
var json2xls = require('json2xls');
var fs = require('fs');

program
	.option('-i, --in-file  <in_file>', 'file to be parsed')
	.option('-o, --out-file <out_file>', 'file.xlsx for writing the output')
	.option('-a, --array <array>', 'Array to parse')
	.parse(process.argv);

if (!process.argv.slice(5).length) {
	program.outputHelp();
	process.exit(1);
}

in_file = program.inFile;
out_file = program.outFile;
native_array = program.array;

var bufferArr = [];
var jsonArr = [];

if (native_array[0] != '$') {
	native_array = [native_array.slice(0, 0), '$', native_array.slice(0)].join('');
}

runner.exec(

	'php -r \'include("' + in_file + '"); print json_encode(' + native_array + ');\'',

	function (err, stdout, stderr) {

		var parsedArr = JSON.parse(stdout);
		getEndNodesJSON(parsedArr, '');

		var barOpts = {
			width		: 40,
			total		: Object.keys(bufferArr).length,
			complete	: '=',
			incomplete	: '-'
		}

		var bar = new ProgressBar('generating [:bar] :percent', barOpts);

		for (var section in bufferArr) {
			bar.tick();
			var tempArray = {
				'KEY' 	: section,
				'VALUE'	: bufferArr[section]
			};
			jsonArr.push(tempArray);
		}
		var xls = json2xls(jsonArr);
		fs.writeFileSync(out_file, xls, 'binary');
		console.log('...done!');
		console.log('Exported to ' + out_file);
	}
);

function getEndNodesJSON(jsonArr, current_section) {
	for (section in jsonArr) {
		if (typeof jsonArr[section] == 'object') {
			previous_section = current_section + section + '.';
			getEndNodesJSON(jsonArr[section], previous_section);
		} else {
			buffer_key = current_section + section;
			buffer_value = jsonArr[section];
			bufferArr[buffer_key] = buffer_value;
		}
	}
}
