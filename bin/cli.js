#!/usr/bin/env node

var fs = require( "fs" );
var yaml = require( "js-yaml" );
var Compiler = require( "../js/compiler" );

var COMPILE_OPTIONS = {
  useOldEntityNames: false,
  resetCommandBlock: true,
  outputMcfunction: true,
  mc1_13: true
};

function usage() {
  console.error( [
    "Usage: commandstudio-compile <project.yaml> <entryFile> [options]",
    "",
    "Options:",
    "  -o, --out <path>    Write the compiled output to a file instead of stdout",
    "  --funcs-out <path>  Write generated function files as a zip to this path (default: functions.zip)",
    "  -h, --help          Show this message"
  ].join( "\n" ) );
}

function fail( message ) {
  console.error( "Error: " + message );
  process.exit( 1 );
}

function parseArgs( argv ) {
  var args = {
      projectFile: null,
      entryFile: null,
      out: null,
      funcsOut: null
    },
    positional = [];

  for( var i = 0 ; i < argv.length ; i++ ) {
    var arg = argv[i];
    switch( arg ) {
      case "-h":
      case "--help":
        usage();
        process.exit( 0 );
        break;
      case "-o":
      case "--out":
        args.out = argv[ ++i ];
        break;
      case "--funcs-out":
        args.funcsOut = argv[ ++i ];
        break;
      default:
        positional.push( arg );
    }
  }

  args.projectFile = positional[0];
  args.entryFile = positional[1];

  return args;
}

var args = parseArgs( process.argv.slice( 2 ) );

if ( ! args.projectFile || ! args.entryFile ) {
  usage();
  process.exit( 1 );
}

var projectRaw;
try {
  projectRaw = fs.readFileSync( args.projectFile, "utf8" );
} catch( e ) {
  fail( "Could not read project file \"" + args.projectFile + "\": " + e.message );
}

var project;
try {
  project = yaml.load( projectRaw );
} catch( e ) {
  fail( "Could not parse project file as YAML: " + e.message );
}

if ( project.version !== "0.1" || typeof project.files !== "object" ) {
  fail( "\"" + args.projectFile + "\" is not a valid CommandStudio project (expected version 0.1)" );
}

if ( typeof project.files[ args.entryFile ] === "undefined" ) {
  fail( "Entry file \"" + args.entryFile + "\" not found in project (available: " + Object.keys( project.files ).join( ", " ) + ")" );
}

var compiler = new Compiler();
compiler.setFiles( project.files );

var result;
try {
  result = compiler.compile( args.entryFile, COMPILE_OPTIONS );
} catch( exception ) {
  if ( exception.name === "CSError" ) {
    fail( exception.toString() );
  }
  throw exception;
}

if ( args.out ) {
  fs.writeFileSync( args.out, result.command );
  console.error( "Wrote " + args.out );
} else {
  process.stdout.write( result.command + "\n" );
}

if ( result.zip ) {
  var funcsOut = args.funcsOut || "functions.zip";
  result.zip.generateAsync( { type: "nodebuffer" } ).then( function( buffer ) {
    fs.writeFileSync( funcsOut, buffer );
    console.error( "Wrote " + funcsOut );
  }, function( err ) {
    fail( "Failed to generate " + funcsOut + ": " + err.message );
  } );
}
