/** asaアニメ名のマップの型 */
export type AsaAnimMapType = Object;

/** asapj関連の静的情報の要素の型 */
export interface AsaInfoType {
	/** サーバかクライアントのどちらかでのみロードする場合に指定するフラグ */
	isServer?: Boolean;
	/** asapjのアセット名 */
	pj: string;
	/** asaアニメ名のマップ */
	anim: AsaAnimMapType;
}
