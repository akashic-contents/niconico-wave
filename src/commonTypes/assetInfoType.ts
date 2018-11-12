/** 数字以外の文字のスプライトシートフレーム名の対応情報の型 */
export interface NonnumFrameType {
	/** GlyphMapに追加する文字 */
	char: string;
	/** charに対応するスプライトシートのフレーム名 */
	frame: string;
}
/** 画像アセット関連の静的情報の要素の型 */
export interface AssetInfoType {
	/** サーバかクライアントのどちらかでのみロードする場合に指定するフラグ */
	isServer?: Boolean;
	/** 画像アセット名 */
	img: string;
	/** スプライトシートjsonのアセット名 */
	json?: string;
	/** スプライトシートのフレーム名のマップ */
	frames?: Object;
	/**
	 * スプライトシートの数字のフレーム名配列（0～9の順）
	 * 主にgameUtilのcreateNumFontWithAssetInfoで利用される
	 */
	numFrames?: string[];
	/**
	 * スプライトシートの数字以外の文字とフレーム名の対応情報配列
	 * 主にgameUtilのcreateNumFontWithAssetInfoで利用される
	 */
	nonnumFrames?: NonnumFrameType[];
	/**
	 * BitmapFont生成時のmissingGlyphに指定する文字のフレーム名
	 * 主にgameUtilのcreateNumFontWithAssetInfoで利用される
	 */
	missing?: string;
	/** 主にBitmapFont生成時に使用する文字幅 */
	fontWidth?: number;
	/** 主にBitmapFont生成時に使用する文字高さ */
	fontHeight?: number;
	/** 主にMultiLineLabelのLineGap計算に使うベースライン高さ */
	fontBaseHeight?: number;
}
