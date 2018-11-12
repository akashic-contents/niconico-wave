/** 画像以外のアセット関連の静的情報の要素の型 */
export interface MiscAssetInfoType {
	/** サーバかクライアントのどちらかでのみロードする場合に指定するフラグ */
	isServer?: Boolean;
	/** アセット名 */
	name: string;
}
