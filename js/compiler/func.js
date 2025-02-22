define( [], function() {

    function Func( path ) {
        this.isFunc = true;
        this.commands = [];
        this.path = path;
        this.currentCommand = "";
    }

    Func.prototype.feed = function( str ) {
        this.currentCommand += str;
    };

    Func.prototype.flush = function() {
        if( this.currentCommand !== "" ) {
            this.push( this.currentCommand );
        }
    };

    Func.prototype.push = function( command ) {
        this.commands.push( command );
        this.next();
    };

    Func.prototype.next = function() {
        this.currentCommand = "";
    };

    return Func;

} );
