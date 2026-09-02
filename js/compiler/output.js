( function( factory ) {
  if ( typeof define === "function" && define.amd ) {
    define( factory );
  } else if ( typeof module === "object" && module.exports ) {
    module.exports = factory();
  }
} )( function() {

  function Output() {
    this.values = [];
    this.currentValue = "";
  }

  Output.prototype.push = function( str ) {
    this.values.push( str );
    this.next();
  };

  Output.prototype.feed = function( str ) {
    this.currentValue += str;
  };

  Output.prototype.flush = function() {
    if( this.currentValue !== "" ) {
      this.values.push( this.currentValue );
      this.next();
    }
  };

  Output.prototype.next = function() {
    this.currentValue = "";
  };

  return Output;

} );
