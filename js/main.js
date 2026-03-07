require.config( {
  baseUrl: "./js",
  paths: {
    vendor: "../vendor",
    jquery: "../vendor/jquery/jquery-2.2.0.min",
    jszip: "../vendor/jszip/jszip.min",
    filesaver: "../vendor/FileSaver.js/FileSaver-2.0.0.min",
    jsyaml: "../vendor/js-yaml/js-yaml.min"

  },
  packages: [ {
    name: "codemirror",
    location: "../vendor/codemirror",
    main: "lib/codemirror"
  } ]
} );

require( [
  "app",
  "vendor/requirejs/domReady",
  "editor/commander-mode",
  "editor/commander-hint",
  "codemirror/keymap/sublime",
  "codemirror/addon/edit/matchbrackets",
  "codemirror/addon/dialog/dialog",
  "codemirror/addon/search/searchcursor",
  "codemirror/addon/search/search"
], function ( App, domReady ) {
  domReady( function () {
    window.app = new App;
  } );
} );