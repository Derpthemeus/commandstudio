#!/usr/bin/env node

var fs = require( "fs" );
var path = require( "path" );
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
    "  -o, --out <path>       Write the compiled output to a file instead of stdout",
    "  --funcs-out <path>     Write generated function files as a zip to this path (default: functions.zip)",
    "  --funcs-out-dir <path> Write generated function files directly into this directory instead of a zip",
    "  -h, --help             Show this message"
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
      funcsOut: null,
      funcsOutDir: null
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
      case "--funcs-out-dir":
        args.funcsOutDir = argv[ ++i ];
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

if ( args.funcsOut && args.funcsOutDir ) {
  fail( "Cannot use both --funcs-out and --funcs-out-dir" );
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

async function writeZipToDir( zip, dir ) {
  var entries = Object.keys( zip.files ).map( function( relPath ) {
    return zip.files[ relPath ];
  } );

  for ( var i = 0 ; i < entries.length ; i++ ) {
    var entry = entries[i];
    var target = path.join( dir, entry.name );
    if ( entry.dir ) {
      fs.mkdirSync( target, { recursive: true } );
      continue;
    }
    fs.mkdirSync( path.dirname( target ), { recursive: true } );
    fs.writeFileSync( target, await entry.async( "nodebuffer" ) );
  }
}

if ( result.zip ) {
  if ( args.funcsOutDir ) {
    writeZipToDir( result.zip, args.funcsOutDir ).then( function() {
      console.error( "Wrote functions to " + args.funcsOutDir );
    }, function( err ) {
      fail( "Failed to write functions to " + args.funcsOutDir + ": " + err.message );
    } );
  } else {
    var funcsOut = args.funcsOut || "functions.zip";
    result.zip.generateAsync( { type: "nodebuffer" } ).then( function( buffer ) {
      fs.writeFileSync( funcsOut, buffer );
      console.error( "Wrote " + funcsOut );
    }, function( err ) {
      fail( "Failed to generate " + funcsOut + ": " + err.message );
    } );
  }
}
