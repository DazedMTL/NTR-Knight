//==============================================================================
// MpiGetMapImage.js
//==============================================================================

/*:
 * @plugindesc マップ全体を画像として出力します。
 * @author 奏ねこま（おとぶき ねこま）
 * 
 * @param GetImageTrigger1
 * @desc マップを画像出力するトリガーを指定してください。
 * @default Input.isPressed('control') && Input.isTriggered('pageup')
 * 
 * @param GetImageTrigger2
 * @desc マップを画像出力するトリガーを指定してください。（キャラクター表示OFF）
 * @default Input.isPressed('control') && Input.isTriggered('pagedown')
 * 
 * @param Vertical Split
 * @desc 画像出力時の縦方向の分割数を指定してください。
 * @default 1
 * 
 * @param Horizontal Split
 * @desc 画像出力時の横方向の分割数を指定してください。
 * @default 1
 * 
 * @param OutputFolder
 * @desc 画像を出力するフォルダを指定してください。
 * @default output
 * 
 * @param TestModeOnly
 * @desc テスト時のみ有効にする場合は true を指定してください。
 * @default true
 * 
 * @help
 * [説明]
 * マップ全体をPNG画像として出力します。
 *
 * [使用方法]
 * プラグイン設定のGetImageTrigger1またはGetImageTrigger2で指定した条件が成立し
 * た瞬間のマップ全体の画像を、PNG画像に出力します。
 * GetImageTrigger1とGetImageTrigger2のデフォルト設定は、以下のような意味です。
 * 
 * GetImageTrigger1
 *  Input.isPressed('control') && Input.isTriggered('pageup')
 *  Ctrlキー（またはAltキー）を押しながら、PageUpキーが押された瞬間。
 * 
 * GetImageTrigger2
 *  Input.isPressed('control') && Input.isTriggered('pagedown')
 *  Ctrlキー（またはAltキー）を押しながら、PageDownキーが押された瞬間。
 * 
 * [大きなマップを出力する際の注意]
 * 160×160以上の大きなマップを1枚の画像として出力するとエラーになることがありま
 * す。その場合はプラグイン設定のVertical SplitとHorizontal Splitに2以上の値を設
 * 定して分割出力してください。例えばVertical SplitとHorizontal Splitの値がとも
 * に2の場合、縦横それぞれ2分割され4枚の画像として出力されます。
 * 
 * [利用規約] ..................................................................
 *  - 本プラグインの利用は、RPGツクールMV/RPGMakerMVの正規ユーザーに限られます。
 *  - 商用、非商用、有償、無償、一般向け、成人向けを問わず、利用可能です。
 *  - 利用の際、連絡や報告は必要ありません。また、製作者名の記載等も不要です。
 *  - プラグインを導入した作品に同梱する形以外での再配布、転載はご遠慮ください。
 *  - 本プラグインにより生じたいかなる問題についても、一切の責任を負いかねます。
 * [改訂履歴] ..................................................................
 *   Version 1.02  2019/06/03  分割出力機能を追加。
 *   Version 1.01  2018/03/09  遠景、および一部の近・遠景関連プラグインに暫定対応。
 *                             Foreground.js（公式プラグイン・神無月サスケ様）
 *                             視差ゼロ遠景のぼかし除去プラグイン（トリアコンタン様）
 *   Version 1.00  2018/12/27  初版
 * -+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-
 *  Web Site: http://makonet.sakura.ne.jp/rpg_tkool/
 *  Twitter : https://twitter.com/koma_neko
 *  Copylight (c) 2016-2019 Nekoma Otobuki
 */

var Imported = Imported || {};
var Makonet = Makonet || {};

(function () {
    'use strict';

    const plugin_name = 'MpiGetMapImage';

    Imported[plugin_name] = true;
    Makonet[plugin_name] = {};

    let _plugin = Makonet[plugin_name];
    let _parameters = PluginManager.parameters(plugin_name);

    _plugin.trigger1 = _parameters['GetImageTrigger1'];
    _plugin.trigger2 = _parameters['GetImageTrigger2'];
    _plugin.vertical = Number(_parameters['Vertical Split']) || 1;
    _plugin.horizontal = Number(_parameters['Horizontal Split']) || 1;
    _plugin.folder = _parameters['OutputFolder'];
    _plugin.testOnly = _parameters['TestModeOnly'].toLowerCase() === 'true';

    //==============================================================================
    // Local Function
    //==============================================================================

    function createMapImage() {
        // 現在のマップ表示情報を退避
        let displayX = $gameMap._displayX;
        let displayY = $gameMap._displayY;
        let parallaxOx = $gameMap.parallaxOx();
        let parallaxOy = $gameMap.parallaxOy();
        let foregroundOx, foregroundOy;
        if ($gameMap.foregroundOx) {
            foregroundOx = $gameMap.foregroundOx();
            foregroundOy = $gameMap.foregroundOy();
        }
        // コピー情報作成
        let copyInfo = [];
        let splitWidth = Math.ceil($gameMap.width() / _plugin.horizontal);
        let splitHeight = Math.ceil($gameMap.height() / _plugin.vertical);
        let screenWidth = Math.floor(Graphics.width / $gameMap.tileWidth());
        let screenHeight = Math.floor(Graphics.height / $gameMap.tileHeight());
        for (let i = 0; i < _plugin.vertical; i++) {
            for (let j = 0; j < _plugin.horizontal; j++) {
                let x1 = j * splitHeight;
                let y1 = i * splitWidth;
                let width1 = Math.min(splitWidth, $gameMap.width() - j * splitWidth);
                let height1 = Math.min(splitHeight, $gameMap.height() - i * splitHeight);
                for (let m = 0; m < Math.ceil(height1 / screenHeight); m++) {
                    for (let n = 0; n < Math.ceil(width1 / screenWidth); n++) {
                        let x2 = x1 + n * screenWidth;
                        let y2 = y1 + m * screenHeight;
                        let width2 = Math.min(screenWidth, width1 - n * screenWidth);
                        let height2 = Math.min(screenHeight, height1 - m * screenHeight);
                        copyInfo.push(new Map([
                            ['imageId', i * _plugin.vertical + j],
                            ['imageWidth', width1 * $gameMap.tileWidth()],
                            ['imageHeight', height1 * $gameMap.tileHeight()],
                            ['srcMapX', x2],
                            ['srcMapY', y2],
                            ['copyWidth', width2 * $gameMap.tileWidth()],
                            ['copyHeight', height2 * $gameMap.tileHeight()],
                            ['dstX', (x2 - x1) * $gameMap.tileWidth()],
                            ['dstY', (y2 - y1) * $gameMap.tileHeight()]
                        ]));
                    }
                }
            }
        }
        // Bitmap作成
        let bitmap = [];
        copyInfo.forEach(info => {
            bitmap[info.get('imageId')] = bitmap[info.get('imageId')] || new Bitmap(info.get('imageWidth'), info.get('imageHeight'));
            $gameMap._displayX = info.get('srcMapX');
            $gameMap._displayY = info.get('srcMapY');
            let spriteset = SceneManager._scene._spriteset;
            spriteset.update();
            if (spriteset._parallax.bitmap) {
                spriteset._parallax.origin.x = parallaxOx + ($gameMap._displayX - displayX) * $gameMap.tileWidth();
                spriteset._parallax.origin.y = parallaxOy + ($gameMap._displayY - displayY) * $gameMap.tileHeight();
            }
            if (spriteset._foreground && spriteset._foreground.bitmap) {
                spriteset._foreground.origin.x = foregroundOx + ($gameMap._displayX - displayX) * $gameMap.tileWidth();
                spriteset._foreground.origin.y = foregroundOy + ($gameMap._displayY - displayY) * $gameMap.tileHeight();
            }
            if (spriteset._parallaxNonBlur && spriteset._parallaxNonBlur.bitmap) {
                spriteset._parallaxNonBlur.setFrame(
                    parallaxOx + ($gameMap._displayX - displayX) * $gameMap.tileWidth(),
                    parallaxOy + ($gameMap._displayY - displayY) * $gameMap.tileHeight(),
                    Graphics.width, Graphics.height
                );
            }
            Graphics._renderer.render(SceneManager._scene);
            let snap = Bitmap.snap(SceneManager._scene);
            bitmap[info.get('imageId')].blt(snap, 0, 0, info.get('copyWidth'), info.get('copyHeight'), info.get('dstX'), info.get('dstY'));
        });
        // ファイル出力
        bitmap.forEach((bitmap, index, array) => {
            let fs = require('fs');
            let path = StorageManager.localFileDirectoryPath().replace(/save[\\/]$/, '');
            let folder = path + _plugin.folder;
            if (!fs.existsSync(folder)) {
                fs.mkdirSync(folder);
            }
            let strIndex = (array.length > 1) ? '_' + index.padZero(2) : '';
            let date = (function () {
                let date = new Date();
                let year = date.getFullYear();
                let month = date.getMonth() + 1;
                let day = date.getDate();
                let hours = date.getHours();
                let minutes = date.getMinutes();
                let seconds = date.getSeconds();
                return year + month.padZero(2) + day.padZero(2) + hours.padZero(2) + minutes.padZero(2) + seconds.padZero(2);
            }());
            let file = folder + '\\Map' + $gameMap.mapId().padZero(3) + strIndex + '_' + date + '.png';
            let data = bitmap._canvas.toDataURL('img/png').replace(/^.*,/, '');
            let buffer = new Buffer(data, 'base64');
            fs.writeFileSync(file, buffer);
        });
        // マップ表示位置を復帰
        $gameMap._displayX = displayX;
        $gameMap._displayY = displayY;
        SceneManager._scene._spriteset.update();
        Graphics._renderer.render(SceneManager._scene);
    }

    //==============================================================================
    // Scene_Map
    //==============================================================================

    {
        let __update = Scene_Map.prototype.update;
        Scene_Map.prototype.update = function () {
            if ($gameTemp.isPlaytest() || !_plugin.testOnly) {
                let trigger1 = !!eval(_plugin.trigger1);
                let trigger2 = !!eval(_plugin.trigger2);
                if (trigger2) this._spriteset.hideCharacters();
                if (trigger1 || trigger2) {
                    createMapImage();
                }
                if (trigger2) {
                    this._spriteset._characterSprites.forEach(sprite => {
                        if (!sprite.isTile()) sprite.show();
                    });
                }
            }
            __update.apply(this, arguments);
        };
    }
}());
