/**
 * g.Eとそのサブクラス（g.Spriteを除く）を扱うユーティリティ関数群
 */
export namespace entityUtil {
	/**
	 * Entityのappendとmodifiedを行う
	 * @param _entity addend対象のエンティティ
	 * @param _parent addend先のエンティティ
	 */
	export function appendEntity(_entity: g.E, _parent: g.E | g.Scene): void {
		_parent.append(_entity);
		_entity.modified();
	}

	/**
	 * Entityのhideとmodifiedを行う
	 * @param _entity 処理対象のEntity
	 */
	export function hideEntity(_entity: g.E): void {
		_entity.hide();
		_entity.modified();
	}

	/**
	 * Entityのshowとmodifiedを行う
	 * @param _entity 処理対象のEntity
	 */
	export function showEntity(_entity: g.E): void {
		_entity.show();
		_entity.modified();
	}

	/**
	 * Entityのx/yの設定とmodifiedを行う
	 * @param _entity 処理対象のEntity
	 * @param _x      設定するx座標
	 * @param _y      設定するy座標
	 */
	export function setXY(_entity: g.E, _x: number, _y: number): void {
		_entity.x = _x;
		_entity.y = _y;
		_entity.modified();
	}

	/**
	 * Entityのxの設定とmodifiedを行う
	 * @param _entity 処理対象のEntity
	 * @param _x      設定するx座標
	 */
	export function setX(_entity: g.E, _x: number): void {
		_entity.x = _x;
		_entity.modified();
	}

	/**
	 * Entityのyの設定とmodifiedを行う
	 * @param _entity 処理対象のEntity
	 * @param _y      設定するy座標
	 */
	export function setY(_entity: g.E, _y: number): void {
		_entity.y = _y;
		_entity.modified();
	}

	/**
	 * Entityのopacityの設定とmodifiedを行う
	 * @param _entity 処理対象のEntity
	 * @param _opacity 設定する値
	 */
	export function setOpacity(_entity: g.E, _opacity: number): void {
		_entity.opacity = _opacity;
		_entity.modified();
	}

	/**
	 * EntityのscaleX/scaleYの設定とmodifiedを行う
	 * @param _entity 処理対象のEntity
	 * @param _scale  設定する値
	 */
	export function setScale(_entity: g.E, _scale: number): void {
		_entity.scaleX = _scale;
		_entity.scaleY = _scale;
		_entity.modified();
	}

	/**
	 * Labelの生成とaligning、fontSizeの設定を行う
	 * @param  _scene      Labelの生成に使用するScene
	 * @param  _text       Labelに初期設定する文字列
	 * @param  _bitmapFont 使用するBitmapFont
	 * @param  _maxLength  想定する桁数
	 * @param  _align      設定するTextAlign
	 * @return             生成したLabel
	 */
	export function createLabel(
		_scene: g.Scene, _text: string, _bitmapFont: g.BitmapFont,
		_maxLength: number, _align: g.TextAlign): g.Label {
		const label = new g.Label({
			scene: _scene,
			text: _text,
			bitmapFont: _bitmapFont,
			fontSize: _bitmapFont.defaultGlyphHeight
		});
		label.aligning(_bitmapFont.defaultGlyphWidth * _maxLength, _align);
		label.invalidate();
		return label;
	}

	/**
	 * 数字用のcreateLabelのショートハンド
	 * _textは桁数分の9埋め文字列、_alignはRightに設定する。
	 * @param  _scene      Labelの生成に使用するScene
	 * @param  _bitmapFont 使用するBitmapFont
	 * @param  _digit      想定する桁数
	 * @return             生成したLabel
	 */
	export function createNumLabel(
		_scene: g.Scene, _bitmapFont: g.BitmapFont, _digit: number): g.Label {
		const nums: string[] = [];
		for (let i = 0; i < _digit; ++i) {
			nums[nums.length] = "9";
		}
		const text = nums.join("");
		const label = createLabel(
			_scene, text, _bitmapFont, _digit, g.TextAlign.Right);
		return label;
	}

	/**
	 * 右端の数字の左上を指定してラベルの位置を設定するメソッド
	 * @param  _label 処理対象のLabel
	 * @param  _x     右端の数字の左上のx座標
	 * @param  _y     右端の数字の左上のy座標
	 */
	export function moveNumLabelTo(
		_label: g.Label, _x: number, _y: number): void {
		_label.x = _x + _label.bitmapFont.defaultGlyphWidth - _label.width;
		_label.y = _y;
		_label.modified();
	}

	/**
	 * Label.textの設定とinvalidateを行う
	 * @param _label 処理対象のLabel
	 * @param _text  設定する文字列
	 */
	export function setLabelText(_label: g.Label, _text: string): void {
		_label.text = _text;
		_label.invalidate();
	}

	/**
	 * Entityの子要素を全てdestroyする
	 * @param _e 処理対象のE
	 */
	export function destroyAllChildren(_e: g.E): void {
		if (!_e.children) return; // Childrenが未定義であれば何もしない
		const end: number = _e.children.length - 1;
		for (let i = end; i >= 0; --i) {
			if (!_e.children[i].destroyed()) {
				_e.children[i].destroy();
			}
		}
	}
}
