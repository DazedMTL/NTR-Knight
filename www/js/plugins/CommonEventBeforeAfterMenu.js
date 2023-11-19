//=============================================================================
// CommonEventBeforeAfterMenu.js ver.1.04
//=============================================================================

/*:
 * @plugindesc メニューを開く直前、または閉じた直後に、指定したコモンイベントを実行します。
 * @author 奏ねこま（おとぶきねこま）
 * @url http://makonet.sakura.ne.jp/rpg_tkool
 * @target MZ
 *
 * @param Common Event ID (before Menu)
 * @desc メニューを開く直前に実行するコモンイベントのIDを指定してください。
 * @default 0
 *
 * @param Common Event ID (after Menu)
 * @desc メニューを閉じた直後に実行するコモンイベントのIDを指定してください。
 * @default 0
 *
 * @help
 * *このプラグインには、プラグインコマンドはありません。
 *
 * ----------------------------------------------------------------------------
 *   本プラグインの利用はRPGツクール/RPG Makerの正規ユーザーに限られます。
 *   商用、非商用、有償、無償、一般向け、成人向けを問わず利用可能です。
 *   ご利用の際に連絡や報告は必要ありません。また、製作者名の記載等も不要です。
 *   プラグインを導入した作品に同梱する形以外での再配布、転載はご遠慮ください。
 *   本プラグインにより生じたいかなる問題についても一切の責任を負いかねます。
 * ----------------------------------------------------------------------------
 *   Version 1.04  2022/08/10  イベントコマンドからメニュー画面を開いた場合に
 *                             コモンイベントが正しく実行されない問題を修正
 *   Version 1.03  2017/04/24  ウェイトを含んだコモンイベントを実行すると、
 *                             イベント後にメニューが開かない問題を修正
 *   Version 1.02  2017/02/13  メニュー後コモンイベントが、マップ以外への
 *                             シーン遷移時にも実行予約されていた問題を修正
 *   Version 1.01  2017/01/05  メニュー後コモンイベントIDを0に設定しても
 *                             コモンイベントの予約が実行されていた問題を修正
 *   Version 1.00  2016/07/21  初版
 * ----------------------------------------------------------------------------
 *                                            Copylight (c) 2022 Nekoma Otobuki
 *                                       http://makonet.sakura.ne.jp/rpg_tkool/
 *                                                https://twitter.com/koma_neko
 */

(function () {
  "use strict";

  const _PNAME = "CommonEventBeforeAfterMenu";
  const _PARAMETERS = PluginManager.parameters(_PNAME);

  const _COMMON_EVENT_ID_BM =
    +_PARAMETERS["Common Event ID (before Menu)"] || 0;
  const _COMMON_EVENT_ID_AM = +_PARAMETERS["Common Event ID (after Menu)"] || 0;

  function _(f) {
    return (f[_PNAME] = f[_PNAME] || {});
  }

  //==============================================================================
  // Scene_Map
  //==============================================================================

  var _Scene_Map_isMenuCalled = Scene_Map.prototype.isMenuCalled;
  Scene_Map.prototype.isMenuCalled = function () {
    return _Scene_Map_isMenuCalled.call(this) || _(this).reserveCallMenu;
  };

  var _Scene_Map_callMenu = Scene_Map.prototype.callMenu;
  Scene_Map.prototype.callMenu = function () {
    if (_COMMON_EVENT_ID_BM && !_(this).reserveCallMenu) {
      _(this).reserveCallMenu = true;
      $gameTemp.reserveCommonEvent(_COMMON_EVENT_ID_BM);
    } else {
      _(this).reserveCallMenu = false;
      _Scene_Map_callMenu.call(this);
    }
  };

  //==============================================================================
  // Scene_Menu
  //==============================================================================

  var _Scene_Menu_terminate = Scene_Menu.prototype.terminate;
  Scene_Menu.prototype.terminate = function () {
    if (
      _COMMON_EVENT_ID_AM &&
      !$gameTemp.isCalledMenuFromEvent &&
      SceneManager.isNextScene(Scene_Map)
    ) {
      $gameTemp.reserveCommonEvent(_COMMON_EVENT_ID_AM);
    }
    $gameTemp.isCalledMenuFromEvent = false;
    _Scene_Menu_terminate.call(this);
  };

  //==============================================================================
  // Game_Temp
  //==============================================================================

  ((__initialize) => {
    Game_Temp.prototype.initialize = function () {
      __initialize.apply(this, arguments);
      this.isCalledMenuFromEvent = false;
    };
  })(Game_Temp.prototype.initialize);

  //==============================================================================
  // Game_Interpreter
  //==============================================================================

  ((__setup) => {
    let common1 = { code: 117, indent: 0, parameters: [_COMMON_EVENT_ID_BM] };
    let common2 = { code: 117, indent: 0, parameters: [_COMMON_EVENT_ID_AM] };

    Game_Interpreter.prototype.setup = function (list, eventId) {
      let _list = list;
      if (_COMMON_EVENT_ID_BM || _COMMON_EVENT_ID_AM) {
        let hasCallMenu = list.some((event) => event.code == 351);
        if (hasCallMenu) {
          _list = [];
          for (let i = 0; i < list.length; i++) {
            if (list[i].code == 351) {
              let indent = list[i].indent;
              if (_COMMON_EVENT_ID_BM) {
                common1.indent = indent;
                _list.push({ ...common1 });
              }
              _list.push(list[i]);
              if (_COMMON_EVENT_ID_AM) {
                common2.indent = indent;
                _list.push({ ...common2 });
              }
            } else {
              _list.push(list[i]);
            }
          }
        }
      }
      __setup.call(this, _list, eventId);
    };
  })(Game_Interpreter.prototype.setup);

  ((__command351) => {
    Game_Interpreter.prototype.command351 = function () {
      $gameTemp.isCalledMenuFromEvent = true;
      return __command351.apply(this, arguments);
    };
  })(Game_Interpreter.prototype.command351);
})();
