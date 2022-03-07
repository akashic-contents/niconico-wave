import asa = require("@akashic-extension/akashic-animation");

/**
 * asa.Actor機能拡張を目的としたクラス群
 */
export namespace asaEx {
	/** asapjのアセット名→asa.Resourceのマップの型 */
	export type ResourceMap = { [key: string]: asa.Resource };
	/** アニメ名→ボーン名のマップの型 */
	export type AnimBoneTable = { [key: string]: string };
	/** asapjのアセット名→AnimBoneTableのマップの型 */
	export type AnimBoneTableMap = { [key: string]: AnimBoneTable };

	/** 変換行列の型 */
	export type MatrixType = [number, number, number, number, number, number];

	/** ボーン名とアニメ名の組み合わせ情報の型 */
	export interface CombinationInfo {
		/** ボーン名 */
		boneName: string;
		/** ボーン名に紐づくアニメ名の配列 */
		animationNames: string[];
		/** ボーン名に紐づくスキン名の配列 */
		skinNames: string[];
	}
	/** asapjデータの型 */
	export interface AsaPjData {
		/** asapjのバージョン */
		version: string;
		/** asapjの実データ */
		contents: {
			/** ボーンファイル名の配列 */
			boneSetFileNames: string[],
			/** スキンファイル名の配列 */
			skinFileNames: string[],
			/** アニメファイル名の配列 */
			animationFileNames: string[],
			/** ユーザーデータ */
			userData: {
				/** ボーン名とアニメ名の組み合わせ情報の配列 */
				combinationInfo: CombinationInfo[]
			}
		};
	}

	/**
	 * asa関連データの管理クラス
	 * 以下の機能を提供する
	 * ・シーンロード時のアセット名配列生成
	 * ・asa.Resourceの生成と保持
	 * ・アニメ名に対応するボーン名を取得
	 */
	export class ResourceManager {
		/**
		 * asapjのアセット名配列から必要なファイルのアセット名を追加先配列に追加する
		 * @param _pjNames asapjファイルのアセット名配列
		 * @param _assets アセットのマップ
		 * @param _assetIds アセット名を追加する配列
		 */
		static addAsaAssetIds(_pjNames: string[], _assetIds: string[]): void {
			const ids: string[] = ResourceManager.getAssetIds(_pjNames);
			// console.debug("addAsaAssetIds: before: assetIds.length:"+assetIds.length+", pjNames.length:"+pjNames.length+".");
			_assetIds.push.apply(_assetIds, ids);
			// console.debug("addAsaAssetIds: after: assetIds.length:"+assetIds.length+".");
		}
		/**
		 * asapjのアセット名配列から必要なファイルのアセット名の配列を生成する
		 * @param _pjNames asapjファイルのアセット名配列
		 * @return asapjから参照されるファイルのアセット名配列
		 */
		static getAssetIds(_pjNames: string[]) {
			let res: string[] = [];
			const iEnd: number = _pjNames.length;
			for (let i = 0; i < iEnd; ++i) {
				const pjName = _pjNames[i];
				// console.log("makeAnimBoneTable: pjNames["+i+"]:"+pjName+".");
				if (!g.game.scene().assets[pjName]) {
					console.error("ResourceManager.getAssetIds: not found asapj:" + pjName + " in assets. Not set global option in game.json?");
					return null;
				}
				const pjData = g.game.scene().asset.getJSONContentById(pjName);
				const fileNames = [pjName].concat(
					pjData.contents.boneSetFileNames,
					pjData.contents.skinFileNames,
					pjData.contents.animationFileNames);
				res = res.concat(makeAssetNames_(fileNames));
			}
			return res;
		}

		/**
		 * asapjのアセット名に応じてasa.Resourceのインスタンスを返す
		 * まだg.game.vars.asaResourcesに存在しないasapjの場合は新たなasa.Resourceを生成し、
		 * g.game.vars.asaResourcesに追加する
		 * @param _scene g.Sceneのインスタンス
		 * @param _pjName asapjファイルのアセット名
		 * @return asa.Resourceのインスタンス
		 */
		static getResource(_scene: g.Scene, _pjName: string): asa.Resource {
			if (!g.game.vars.asaResources) {
				g.game.vars.asaResources = {};
			}
			// console.log("getResource: pjName:"+pjName+".");
			const resources: ResourceMap = g.game.vars.asaResources;
			let res: asa.Resource = null;
			if (resources.hasOwnProperty(_pjName)) {
				res = resources[_pjName];
			} else {
				res = new asa.Resource();
				res.loadProject(_pjName, _scene.assets);
				resources[_pjName] = res;
			}
			return res;
		}

		/**
		 * asa.Resourceのインスタンスからスキン名の配列を生成する
		 * @param _resource asa.Resourceのインスタンス
		 * @return スキン名の配列
		 */
		static getSkinNames(_resource: asa.Resource): string[] {
			const res: string[] = [];
			const iEnd: number = _resource.skins.length;
			for (let i = 0; i < iEnd; ++i) {
				res[res.length] = _resource.skins[i].name;
			}
			return res;
		}
		/**
		 * アニメ名からボーン名を取得する
		 * @param _pjName asapjのアセット名
		 * @param _animName アニメ名
		 * @return ボーン名
		 */
		static getBoneName(_pjName: string, _animName: string): string {
			const tableMap: AnimBoneTableMap = g.game.vars.asaAnimBoneTableMap;
			const table: AnimBoneTable = tableMap[_pjName];
			// console.log("getBoneName: table["+anName+"]:"+table[anName]+".");
			return table[_animName];
		}

		/**
		 * 指定したasapjの情報をg.game.vars.asaAnimBoneTableMapと
		 * g.game.vars.asaResourcesから削除する
		 * @param _pjName asapjのアセット名
		 */
		static removeLoadedResource(pjName: string): void {
			if (g.game.vars.asaAnimBoneTableMap) {
				if (g.game.vars.asaAnimBoneTableMap.hasOwnProperty(pjName)) {
					delete g.game.vars.asaAnimBoneTableMap[pjName];
				}
			}
			if (g.game.vars.asaResources) {
				if (g.game.vars.asaResources.hasOwnProperty(pjName)) {
					delete g.game.vars.asaResources[pjName];
				}
			}
		}
		/**
		 * g.game.vars.asaAnimBoneTableMapとg.game.vars.asaResourcesの内容を
		 * すべて削除する
		 */
		static removeAllLoadedResource(): void {
			if (g.game.vars.asaAnimBoneTableMap) {
				delete g.game.vars.asaAnimBoneTableMap;
			}
			if (g.game.vars.asaResources) {
				delete g.game.vars.asaResources;
			}
		}

	}

	/**
	 * asa.Actorを機能拡張したクラス
	 * 以下の機能を提供する
	 * ・インスタンス生成時にasapjのアセット名から自動的に
	 *   asa.ActorParameterObjectを生成する
	 * （asa.Resourceの生成もResourceManagerを利用して自動的に行う）
	 * ・play時にアニメ名に対応したボーンに自動的に切り替える
	 * ・ボーン名を指定してボーンの現在の座標を取得する
	 */
	export class Actor extends asa.Actor {
		/** asapjのアセット名 */
		pjName: string;

		/**
		 * Actorコンストラクタ
		 * @param _scene g.Sceneのインスタンス
		 * @param _pjName asapjのアセット名
		 * @param opt_animName (optional)アニメ名
		 * @param opt_loopFlag
		 * (optional)再生をループするか指定するフラグ。真の時ループ再生。
		 * 省略時はtrue。
		 */
		constructor(
			_scene: g.Scene,
			_pjName: string,
			opt_animName?: string,
			opt_loopFlag: boolean = true) {
			if (!g.game.vars.asaAnimBoneTableMap) {
				g.game.vars.asaAnimBoneTableMap = {};
			}
			if (!g.game.vars.asaAnimBoneTableMap.hasOwnProperty(_pjName)) {
				g.game.vars.asaAnimBoneTableMap[_pjName] =
					loadAnimBoneTable_(_pjName);
			}

			const resource: asa.Resource = ResourceManager.getResource(_scene, _pjName);
			if (!opt_animName) {
				opt_animName = resource.animations[0].name;
			}
			const param: asa.ActorParameterObject = {
				scene: _scene,
				resource: resource,
				animationName: opt_animName,
				skinNames: ResourceManager.getSkinNames(resource),
				boneSetName: ResourceManager.getBoneName(_pjName, opt_animName),
				width: 1,
				height: 1
			};
			super(param);
			this.loop = opt_loopFlag;
			this.pjName = _pjName;
		}

		/**
		 * アニメーションを再生する
		 * @param _animName アニメ名
		 * @param _startFrame 再生開始フレーム
		 * @param _loopFlag 再生をループするか指定するフラグ。真の時ループ再生
		 * @param _playSpeed 再生速度。1.0で通常の再生速度
		 * @param opt_noCalcFlag (optional)super.playのあとに、calcを行うか指定するフラグ。trueの場合はcalcを行わない。
		 * @override
		 */
		play(
			_animName: string, _startFrame: number, _loopFlag: boolean,
			_playSpeed: number, opt_noCalcFlag: boolean = false): void {
			const currBnName: string = this.getBoneName();
			const nextBnName: string = this.getBoneName(_animName);
			// console.log("AsaEx.Actor.play: anName:"+anName+".");
			if (currBnName !== nextBnName) {
				this.changeBone(nextBnName);
			}
			super.play(_animName, _startFrame, _loopFlag, _playSpeed);
			if (!opt_noCalcFlag) {
				this.modified();
				this.calc();
			}
		}

		/**
		 * Actorの位置を原点としたボーンの座標を取得する
		 * @param _boneName ボーン名
		 * @param opt_matrix (optional)ボーンに対する位置や向きを変える変換行列
		 * @return ボーンの座標
		 */
		getBonePosition(
			_boneName: string, opt_matrix?: g.Matrix): g.CommonOffset {
			const inScene: g.CommonOffset =
				this.getBonePositionInScene(_boneName, opt_matrix);
			const rootMatrix: MatrixType = this.getMatrix()._matrix;
			return { x: inScene.x - rootMatrix[4], y: inScene.y - rootMatrix[5] };
		}

		/**
		 * Scene上のボーンの座標を取得する
		 * @param _boneName ボーン名
		 * @param opt_matrix (optional)ボーンに対する位置や向きを変える変換行列
		 * @return ボーンの座標
		 */
		getBonePositionInScene(
			_boneName: string, opt_matrix?: g.Matrix): g.CommonOffset {
			const bones: asa.Bone[] = this.skeleton.bones;
			const iEnd: number = bones.length;
			for (let i = 0; i < iEnd; ++i) {
				// console.log("getBonePosition: bones["+i+"].name:"+bones[i].name+", boneName:"+boneName+".");
				if (bones[i].name === _boneName) {
					let boneMatrix: MatrixType = this.skeleton.
						composedCaches[bones[i].arrayIndex].m._matrix;
					if (opt_matrix) {
						boneMatrix =
							applyMatrix(boneMatrix, opt_matrix._matrix);
					}
					// console.log("getBonePosition: bones["+i+"].name:"+bones[i].name+", x:"+matrix[4]+", y:"+matrix[5]+".");
					return { x: boneMatrix[4], y: boneMatrix[5] };
				}
			}

			return { x: 0, y: 0 };
		}

		/**
		 * アニメ名に対応するボーン名を取得する
		 * @param _animName アニメ名
		 * @return ボーン名
		 */
		getBoneName(_animName?: string): string {
			if (!_animName) {
				_animName = this.animation.name;
			}
			return ResourceManager.getBoneName(this.pjName, _animName);
		}

		/**
		 * ボーンを切り替える
		 * @param _boneName ボーン名
		 */
		changeBone(_boneName: string): void {
			// vvv akashic-animation/lib/Actor.js より引用
			// skeleton
			const boneSet: asa.BoneSet =
				this.resource.getBoneSetByName(_boneName);
			this.skeleton = new asa.Skeleton(boneSet.bones, () => {
				return this.getMatrix();
			});
			// collider
			this.colliders = [];
			setupCollider_(boneSet.bones, this);
			// ^^^ akashic-animation/lib/Actor.js より引用
		}
	}

	/**
	 * 変換行列を掛ける
	 * @param _m1 掛けられる変換行列
	 * @param _m2 掛ける変換行列
	 * @return 掛けた結果
	 */
	export function applyMatrix(_m1: MatrixType, _m2: MatrixType): MatrixType {
		const m0: MatrixType = [1, 0, 0, 1, 0, 0];
		m0[0] = _m1[0] * _m2[0] + _m1[2] * _m2[1];
		m0[1] = _m1[1] * _m2[0] + _m1[3] * _m2[1];
		m0[2] = _m1[0] * _m2[2] + _m1[2] * _m2[3];
		m0[3] = _m1[1] * _m2[2] + _m1[3] * _m2[3];
		m0[4] = _m1[0] * _m2[4] + _m1[2] * _m2[5] + _m1[4];
		m0[5] = _m1[1] * _m2[4] + _m1[3] * _m2[5] + _m1[5];
		return m0;
	}

	// vvv akashic-animation/sample/src/demo.ts より引用
	/**
	 * 変換行列の逆行列を生成する
	 * @param _m 変換行列
	 * @return 逆行列
	 */
	export function invertMatrix(_m: MatrixType): MatrixType {
		const a = _m[0];
		const b = _m[1];
		const c = _m[2];
		const d = _m[3];
		const dt = a * d - b * c;  // det
		if (dt === 0) {
			return undefined;
		}
		const e = _m[4];
		const f = _m[5];

		const mi = <MatrixType>new Array<number>(6);
		mi[0] = d / dt;
		mi[1] = -b / dt;
		mi[2] = -c / dt;
		mi[3] = a / dt;
		mi[4] = (c * f - d * e) / dt;
		mi[5] = -(a * f - b * e) / dt;

		return mi;
	}
	// ^^^ akashic-animation/sample/src/demo.ts より引用

	/**
	 * g.E用アタッチメント
	 * g.Eをasa.Actorのボーンにアタッチするためのasa.Attachmentサブクラス
	 */
	export class EntityAttachment extends asa.Attachment {
		/** アタッチするg.Eのインスタンス */
		entity: g.E;
		/** アタッチ先のボーンに対しての位置や向きを変えるための変換行列 */
		matrix: g.Matrix;
		/** 自身を描画する際にアタッチ先でのスケールと回転を無効化するフラグ */
		cancelParentSR: boolean;

		/**
		 * ActorAttachmentコンストラクタ
		 * @param _actor アタッチするActorのインスタンス
		 * @param opt_matrix (optional)アタッチ先のボーンに対しての位置や向きを変えるための変換行列
		 */
		constructor(_entity: g.E, opt_matrix?: g.Matrix) {
			super();
			this.entity = _entity;
			this.matrix = opt_matrix || new g.PlainMatrix();
			// console.debug("ActorAttachment: matrix._matrix:["+this.matrix._matrix.join()+"].");
			this.cancelParentSR = false;
		}

		/**
		 * Actor#renderPosturesから呼ばれるAttachment#renderの実装
		 * @param _renderer g.Rendererのインスタンス
		 * @override
		 */
		render(_renderer: g.Renderer): void {
			if (this.cancelParentSR) {
				// vvv akashic-animation/lib/Skeleton.js より引用
				const m0: MatrixType = [1, 0, 0, 1, 0, 0];
				const m1: MatrixType = this.posture.m._matrix;
				const m2: MatrixType = this.matrix._matrix;
				// m0 = m1 * m2
				m0[0] = m1[0] * m2[0] + m1[2] * m2[1];
				m0[1] = m1[1] * m2[0] + m1[3] * m2[1];
				m0[2] = m1[0] * m2[2] + m1[2] * m2[3];
				m0[3] = m1[1] * m2[2] + m1[3] * m2[3];
				m0[4] = m1[0] * m2[4] + m1[2] * m2[5] + m1[4];
				m0[5] = m1[1] * m2[4] + m1[3] * m2[5] + m1[5];
				// ^^^ akashic-animation/lib/Skeleton.js より引用
				// console.debug("ActorAttachment.render: m0:["+m0.join()+"].");
				// vvv akashic-animation/sample/src/demo.ts より引用
				const mi = invertMatrix(this.posture.m._matrix);
				if (!mi) {
					return;
				}

				_renderer.save();
				{
					_renderer.transform(mi);  // cancel posture matrix
					_renderer.translate(m0[4], m0[5]);
					this.entity.render(_renderer);
				}
				_renderer.restore();
				// ^^^ akashic-animation/sample/src/demo.ts より引用
			} else {
				_renderer.save();
				{
					_renderer.transform(this.matrix._matrix);
					this.entity.render(_renderer);
				}
				_renderer.restore();
			}
		}
	}

	/**
	 * Actor用アタッチメント
	 * asa.Actorを他のActorのボーンにアタッチするためのasa.Attachmentサブクラス
	 * EntityAttachmentに置き換えられるが、互換性のためEntityAttachmentの
	 * コンストラクタのみをオーバーライドしたクラスとして残している
	 */
	export class ActorAttachment extends EntityAttachment {
		/**
		 * ActorAttachmentコンストラクタ
		 * @param _actor アタッチするActorのインスタンス
		 * @param opt_matrix (optional)アタッチ先のボーンに対しての位置や向きを変えるための変換行列
		 */
		constructor(_actor: asa.Actor, opt_matrix?: g.Matrix) {
			if (opt_matrix) {
				super(_actor, opt_matrix);
			} else {
				super(_actor);
			}
		}
	}

	/**
	 * ファイル名の配列からアセット名の配列を生成する
	 * @param _fileNames ファイル名の配列
	 * @return アセット名の配列
	 * @private
	 */
	function makeAssetNames_(_fileNames: string[]): string[] {
		const res: string[] = [];
		const iEnd: number = _fileNames.length;
		for (let i = 0; i < iEnd; ++i) {
			// アセット名は拡張子を除いたファイル名
			const name = _fileNames[i].split(".")[0];
			res[res.length] = name;
			// console.log("makeAssetNames: res["+(res.length-1)+"]:"+res[res.length-1]+".");
			if (name.indexOf("sk_") === 0) {
				// スキンアセット名からプリフィクスを除いたものを
				// イメージアセット名とする
				res[res.length] = name.substr(3);
			}
		}
		return res;
	}

	/**
	 * アニメ名に対応するボーン名のテーブルを生成する
	 * @param _combinationInfos ボーン名に対するアニメ名の対応情報
	 * @return キーをアニメ名、値をボーン名としたマップ
	 * @private
	 */
	function makeAnimBoneTable_(
		_combinationInfos: CombinationInfo[]): AnimBoneTable {
		const res: AnimBoneTable = {};
		const iEnd: number = _combinationInfos.length;
		for (let i = 0; i < iEnd; ++i) {
			const info = _combinationInfos[i];
			const bnName = info.boneName;
			const anNames = info.animationNames;
			const jEnd = anNames.length;
			for (let j = 0; j < jEnd; ++j) {
				res[anNames[j]] = bnName;
				// console.log("makeAnimBoneTable: anNames["+j+"]:"+anNames[j]+", bnName:"+bnName+".");
			}
		}
		return res;
	}

	/**
	 * asapjファイルからアニメ名に対応するボーン名のテーブルを生成する
	 * @param _pjName asapjファイルのアセット名
	 * @return キーをアニメ名、値をボーン名としたマップ
	 * @private
	 */
	function loadAnimBoneTable_(_pjName: string): AnimBoneTable {
		// console.debug("AsaEx.loadAnimBoneTable: pjName:"+pjName+".");
		if (!g.game.scene().assets[_pjName]) {
			console.error("AsaEx.loadAnimBoneTable: not found asapj:" + _pjName + " in assets.");
			return null;
		}
		let res: AnimBoneTable = null;
		// const pjData: AsaPjData = _scene.asset.getJSONContentById(_pjName);
		const pjData: AsaPjData = g.game.scene().asset.getJSONContentById(_pjName);
		if ((!!pjData.contents.userData) &&
			(!!pjData.contents.userData.combinationInfo)) {
			res = makeAnimBoneTable_(pjData.contents.userData.combinationInfo);
		} else {
			console.error("AsaEx.loadAnimBoneTable: not found combinationInfo in " + _pjName + ". Use -c option with ss2asa.");
		}
		return res;
	}
}

// vvv akashic-animation/lib/Actor.js より引用
function setupColliderForCell_(
	_info: asa.ColliderInfo, _bone: asa.Bone): asa.BoneCellCollider {
	let collider: asa.BoneCellCollider;
	switch (_info.boundType) {
		case "aabb":
		case "box":
			collider = new asa.BoneCellCollider(
				_bone.name, _info.boundType === "aabb");
			break;
		default:
			console.warn("Invalid type combination: " + _info.geometryType + ", " + _info.boundType);
			break;
	}
	return collider;
}
function setupColliderForCircle_(
	_info: asa.ColliderInfo, _bone: asa.Bone): asa.CircleCollider {
	let collider: asa.CircleCollider;
	switch (_info.boundType) {
		case "aabb":
		case "circle":
			collider = new asa.CircleCollider(
				_bone.name, _info.boundType === "aabb", _info.scaleOption);
			break;
		default:
			console.warn("Invalid type combination: " + _info.geometryType + ", " + _info.boundType);
			break;
	}
	return collider;
}
function setupCollider_(_bones: asa.Bone[], _actor: asa.Actor): void {
	_bones.forEach((_bone: asa.Bone): void => {
		if (!_bone.colliderInfos) {
			return;
		}
		_bone.colliderInfos.forEach((_info: asa.ColliderInfo): void => {
			let collider: asa.Collider;
			switch (_info.geometryType) {
				case "cell":
					collider = setupColliderForCell_(_info, _bone);
					break;
				case "circle":
					collider = setupColliderForCircle_(_info, _bone);
					break;
				case "box":
					console.warn("Not implemented geometory type " + _info.geometryType);
					break;
				default:
					console.warn("Unknown geometory type " + _info.geometryType);
					break;
			}
			if (collider) {
				_actor.addCollider(collider);
			}
		});
	});
}
// ^^^ akashic-animation/lib/Actor.js より引用
