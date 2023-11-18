(function () {
    let __isNearTheScreen = Game_Event.prototype.isNearTheScreen;
    Game_Event.prototype.isNearTheScreen = function () {
        return __isNearTheScreen.apply(this, arguments) || this._moveType == 3;
    };
}());