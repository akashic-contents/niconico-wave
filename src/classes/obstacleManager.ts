import { define } from "./define";
import { AsaInfo } from "./asaInfo";
import { MiscAssetInfo } from "./miscAssetInfo";
import { SoundInfo } from "./soundInfo";
import { AssetInfo } from "./assetInfo";
import { entityUtil } from "../util/entityUtil";
import { spriteUtil } from "../util/spriteUtil";
import { tiledUtil } from "../util/tiledUtil";
import { audioUtil } from "../util/audioUtil";
import { asaEx } from "../util/asaEx";
import { SpriteFrameMap } from "../util/spriteSheetTypes";
import { GameParameterReader } from "./gameParameterReader";
import { CommonParameterReader } from "../commonNicowariGame/commonParameterReader";

/** 障害物種別 */
export enum ObstacleType {
	/** enemy_01 */
	GULL,
	/** enemy_02 */
	ROCK,
	/** enemy_03 */
	SHARK,
	/** enemy_04 */
	PTERANODON
}

/** 障害物配置情報の型 */
interface ObstaclePlaceInfo {
	/** 障害物種別 */
	type: ObstacleType;
	/** X座標 */
	x: number;
	/** Y座標 */
	y: number;
}

/** 表示中の障害物情報の型 */
interface LiveObstacleInfo {
	/** 対応する障害物配置情報のインデックス */
	placeInfoIndex: number;
	/** 障害物のActor */
	actor: asaEx.Actor;
	/** あたり判定領域配列 */
	collisions: g.CommonArea[];
}

/** 表示中の背景物情報の型 */
interface LiveLandmarkInfo {
	/** 対応する背景物配置情報のインデックス */
	placeInfoIndex: number;
	/** 背景物のSprite */
	sprite: g.Sprite;
}

/**
 * スクロールを管理し、障害物を表示、管理するクラス
 */
export class ObstacleManager extends g.E {
	/** スクロール中フラグ */
	private isScrolling: boolean;
	/** スクロールしたピクセル数（フレーム数を元に換算した値） */
	private scrolledPixelCount: number;
	/** スクロールしたピクセル数の計算に使用する値 */
	private scrolledSubPixel: number;
	/** スクロールしたメートル数（フレーム数を元に換算した値） */
	private scrolledMeterCount: number;
	/** スクロールしたメートル数の計算に使用する値 */
	private scrolledSubMeter: number;

	/** 背景物配置レイヤー */
	private landmarkLayer: g.E;
	/** 障害物配置レイヤー：空中 */
	private swimmerLayer: g.E;
	/** 障害物配置レイヤー：水中 */
	private fryerLayer: g.E;

	/** 障害物配置情報 */
	private obstaclePlaceInfos: ObstaclePlaceInfo[];
	/** 出現判定を行う障害物配置情報のインデックス */
	private placeInfoIndex: number;
	/** 表示中の障害物情報 */
	private liveObstacles: LiveObstacleInfo[];

	/** 出現判定を行う背景物配置情報のインデックス */
	private landmarkInfoIndex: number;
	/** 表示中の背景物情報 */
	private liveLandmarks: LiveLandmarkInfo[];
	/** 背景物のSpriteParameterObject */
	private spoLandmark: g.SpriteParameterObject;
	/** 背景物のSpriteFrameMap */
	private sfmLandmark: SpriteFrameMap;

	/**
	 * コンストラクタ
	 * @param  {g.Scene} _scene Sceneインスタンス
	 */
	constructor(_scene: g.Scene) {
		super({ scene: _scene });
	}

	/**
	 * ObstaclePlaceInfoをx座標昇順でソートするためのコンパレータ関数
	 * @param {ObstaclePlaceInfo} _a 比較するObstaclePlaceInfo
	 * @param {ObstaclePlaceInfo} _b 比較するObstaclePlaceInfo
	 * @return {number} 比較結果
	 */
	static compareObstaclePlaceInfo(
		_a: ObstaclePlaceInfo,
		_b: ObstaclePlaceInfo): number {
		return (_a.x - _b.x);
	}

	/**
	 * このクラスで使用するオブジェクトを生成するメソッド
	 * @param {g.E} _landmarkLayer 背景物用のレイヤー
	 * @param {g.E} _swimmerLayer 水中障害物用のレイヤー
	 * @param {g.E} _fryerLayer 空中障害物用のレイヤー
	 */
	init(_landmarkLayer: g.E, _swimmerLayer: g.E, _fryerLayer: g.E): void {
		this.landmarkLayer = _landmarkLayer;
		this.swimmerLayer = _swimmerLayer;
		this.fryerLayer = _fryerLayer;
		this.obstaclePlaceInfos = this.makeObstaclePlaceInfos();
		this.liveObstacles = [];
		this.liveLandmarks = [];
		this.spoLandmark = spriteUtil.createSpriteParameter(AssetInfo.bgObj);
		this.sfmLandmark = spriteUtil.createSpriteFrameMap(AssetInfo.bgObj);
	}

	/**
	 * 初期表示時の処理を行うメソッド
	 */
	showContent(): void {
		this.isScrolling = false;
		this.scrolledPixelCount = GameParameterReader.startPixel;
		this.scrolledSubPixel = 0;
		this.scrolledMeterCount = 0;
		this.scrolledSubMeter = 0;

		entityUtil.setX(this, this.scene.game.width);
		entityUtil.setX(this.landmarkLayer, this.x);
		entityUtil.setX(this.swimmerLayer, this.x);
		entityUtil.setX(this.fryerLayer, this.x);

		entityUtil.setX(
			this,
			this.scene.game.width - this.scrolledPixelCount);
		entityUtil.setX(
			this.landmarkLayer,
			this.scene.game.width - ((
				this.scrolledPixelCount *
				define.LANDMARK_SCROLL_RATE) | 0));
		entityUtil.setX(this.swimmerLayer, this.x);
		entityUtil.setX(this.fryerLayer, this.x);

		this.landmarkInfoIndex = 0;
		this.checkLandmarkPlaceInfo();  // 背景物の表示開始判定
		this.placeInfoIndex = 0;
		this.checkObstaclePlaceInfo();  // 障害物の表示開始判定
		this.checkObstaclePlaceInfo();  // 障害物の表示開始判定

		// 表示中の障害物のactorのmodified/calcを行う
		this.updateObstacleActor();

	}

	/**
	 * 表示終了時の処理を行うメソッド
	 */
	hideContent(): void {
		this.clearLandmarks();  // 表示中の背景物情報をクリアする
		this.clearObstacles();  // 表示中の障害物情報をクリアする
	}

	/**
	 * スクロールを開始するメソッド
	 */
	startScroll(): void {
		this.isScrolling = true;
	}

	/**
	 * スクロールを停止するメソッド
	 */
	stopScroll(): void {
		this.isScrolling = false;
	}

	/**
	 * スクロールしたメートル数を取得するメソッド
	 * @return {number} スクロールしたメートル数
	 */
	getScrolledMeter(): number {
		return this.scrolledMeterCount;
	}

	/**
	 * フレームごとの処理を行うメソッド
	 * @param {number} _scrollFactor スクロール加速割合（0～1）
	 */
	handleUpdate(_scrollFactor: number): void {
		if (this.isScrolling) {
			this.incrementScrollFrame(_scrollFactor);
			entityUtil.setX(
				this,
				this.scene.game.width - this.scrolledPixelCount);
			entityUtil.setX(
				this.landmarkLayer,
				this.scene.game.width - ((
					this.scrolledPixelCount *
					define.LANDMARK_SCROLL_RATE) | 0));
			entityUtil.setX(this.swimmerLayer, this.x);
			entityUtil.setX(this.fryerLayer, this.x);

			this.checkLandmarkLifeTime();  // 表示中の背景物の表示終了判定
			this.checkLandmarkPlaceInfo();  // 背景物の表示開始判定
			this.checkObstacleLifeTime();  // 表示中の障害物の表示終了判定
			this.checkObstaclePlaceInfo();  // 障害物の表示開始判定

			// 表示中の障害物のactorのmodified/calcを行う
			this.updateObstacleActor();
		}
	}

	/**
	 * PCと障害物の衝突判定を行うメソッド
	 * @param {g.CommonArea} _pcRect PCの衝突判定領域
	 * @return {boolean} 障害物に衝突した場合はtrue
	 */
	checkCollision(_pcRect: g.CommonArea): boolean {
		if (define.DEBUG_COLLISION) {
			return false;
		}

		const lives = this.liveObstacles;
		const iEnd = lives.length;
		for (let i = 0; i < iEnd; ++i) {
			const actor = lives[i].actor;
			const pos = {
				x: actor.x + this.x,
				y: actor.y + this.y
			};
			const info = this.obstaclePlaceInfos[lives[i].placeInfoIndex];
			if (info.type === ObstacleType.PTERANODON) {
				const offset = actor.getBonePosition(define.PTERANODON_PIVOT_NAME);
				pos.x += offset.x;
				pos.y += offset.y;
			}
			if (this.checkCollisionCore(_pcRect, pos, lives[i].collisions)) {
				this.playCollisionSe(info.type);
				return true;
			}
		}
		return false;
	}

	/**
	 * 障害物配置情報を生成するメソッド
	 * @return {ObstaclePlaceInfo[]} 障害物配置情報配列
	 */
	private makeObstaclePlaceInfos(): ObstaclePlaceInfo[] {
		const objectType = MiscAssetInfo.mapData.objectType;
		const typeTable: { [key: string]: ObstacleType } = {};
		typeTable[objectType.gull] = ObstacleType.GULL;
		typeTable[objectType.rock] = ObstacleType.ROCK;
		typeTable[objectType.shark] = ObstacleType.SHARK;
		typeTable[objectType.pteranodon] = ObstacleType.PTERANODON;

		const placeInfos: ObstaclePlaceInfo[] = [];
		const objects = tiledUtil.getObjects(
			MiscAssetInfo.mapData.name, false, true
		);
		const iEnd = objects.length;
		for (let i = 0; i < iEnd; ++i) {
			const object = objects[i];
			if (!typeTable.hasOwnProperty(object.type)) {
				continue;
			}
			placeInfos[placeInfos.length] = {
				type: typeTable[object.type],
				x: object.x,
				y: object.y
			};
		}
		placeInfos.sort(ObstacleManager.compareObstaclePlaceInfo);
		return placeInfos;
	}

	/**
	 * スクロールを1フレーム分進めるメソッド
	 * @param {number} _scrollFactor スクロール加速割合（0～1）
	 */
	private incrementScrollFrame(_scrollFactor: number): void {
		// ニコ割ではない場合かつマップ終端に到達した場合、マップを繰り返す
		if (!CommonParameterReader.nicowari) {
			if (this.scrolledPixelCount > define.MAP_END_PIXEL) {
				this.scrolledPixelCount = define.MAP_REPEATED_START_PIXEL;
				this.scrolledSubPixel = 0;
				this.landmarkInfoIndex = 0;
				this.placeInfoIndex = 0;
				this.clearObstacles();
				this.clearLandmarks();
			}
		}

		const pixelAdder = (define.SCROLL_FACTOR_MAX - 1) * _scrollFactor *
			define.SCROLL_PX_PER_FRAME_NUM;
		// console.log("incrementScrollFrame: pixelAdder:" + pixelAdder + ", _scrollFactor:" + _scrollFactor + ".");
		this.scrolledSubPixel += define.SCROLL_PX_PER_FRAME_NUM + pixelAdder;
		while (this.scrolledSubPixel >= define.SCROLL_PX_PER_FRAME_DENOM) {
			++this.scrolledPixelCount;
			this.scrolledSubPixel -= define.SCROLL_PX_PER_FRAME_DENOM;

			this.scrolledSubMeter += define.SCROLL_METER_PER_PX_NUM;
			while (this.scrolledSubMeter >= define.SCROLL_METER_PER_PX_DENOM) {
				++this.scrolledMeterCount;
				this.scrolledSubMeter -= define.SCROLL_METER_PER_PX_DENOM;
			}
		}
	}

	/**
	 * スクロール位置に対応した背景物表示開始判定を行うメソッド
	 */
	private checkLandmarkPlaceInfo(): void {
		const appearLine = this.scrolledPixelCount *
			define.SCROLL_METER_PER_PX_NUM /
			define.SCROLL_METER_PER_PX_DENOM;
		const infos = define.LANDMARK_PLACEINFO;
		let index = this.landmarkInfoIndex;
		while ((index < infos.length) && (infos[index].x < appearLine)) {
			this.appearLandmark(index);
			++index;
			this.landmarkInfoIndex = index;
		}
	}

	/**
	 * 背景物の表示開始処理を行うメソッド
	 * @param {number} _index 対象の背景物配置情報のインデックス
	 */
	private appearLandmark(_index: number): void {
		const info = define.LANDMARK_PLACEINFO[_index];

		const sprite = spriteUtil.createFrameSprite(
			this.spoLandmark,
			this.sfmLandmark, info.frameName);
		sprite.x = info.x * define.LANDMARK_SCROLL_RATE /
			define.SCROLL_METER_PER_PX_NUM *
			define.SCROLL_METER_PER_PX_DENOM;
		sprite.y = define.LANDMARK_BOTTOM_Y - sprite.height;
		entityUtil.appendEntity(sprite, this.landmarkLayer);

		this.liveLandmarks[this.liveLandmarks.length] = {
			placeInfoIndex: _index,
			sprite: sprite
		};
	}

	/**
	 * 表示中の背景物の表示終了判定と表示終了処理を行うメソッド
	 */
	private checkLandmarkLifeTime(): void {
		const deadLine = 0 - this.landmarkLayer.x;
		const survivals: LiveLandmarkInfo[] = [];
		const lives = this.liveLandmarks;
		const iEnd = lives.length;
		for (let i = 0; i < iEnd; ++i) {
			let survived = true;
			if ((lives[i].sprite.x + lives[i].sprite.width) < deadLine) {
				survived = false;
			}
			if (survived) {
				survivals[survivals.length] = lives[i];
			} else {
				lives[i].sprite.destroy();
				lives[i].sprite = null;
			}
		}
		this.liveLandmarks.length = 0;
		this.liveLandmarks = survivals;
	}

	/**
	 * スクロール位置に対応した障害物表示開始判定を行うメソッド
	 */
	private checkObstaclePlaceInfo(): void {
		const appearLine = define.OBSTACLE_APPEAR_AREA_WIDTH +
			this.scrolledPixelCount;
		const infos = this.obstaclePlaceInfos;
		let index = this.placeInfoIndex;
		while ((index < infos.length) && (infos[index].x < appearLine)) {
			this.appearObstacle(index);
			++index;
			this.placeInfoIndex = index;
		}
	}

	/**
	 * 障害物の表示開始処理を行うメソッド
	 * @param {number} _index 対象の障害物配置情報のインデックス
	 */
	private appearObstacle(_index: number): void {
		const info = this.obstaclePlaceInfos[_index];

		let animName = AsaInfo.obstacle.anim.gull;
		let collisions: g.CommonArea[] = [];
		let parent: g.E = this;
		switch (info.type) {
			case ObstacleType.GULL:
				animName = AsaInfo.obstacle.anim.gull;
				collisions = define.COLLISIONS_GULL;
				parent = this.fryerLayer;
				break;
			case ObstacleType.ROCK:
				animName = AsaInfo.obstacle.anim.rock;
				collisions = define.COLLISIONS_ROCK;
				parent = this.swimmerLayer;
				break;
			case ObstacleType.SHARK:
				animName = AsaInfo.obstacle.anim.shark;
				collisions = define.COLLISIONS_SHARK;
				parent = this.fryerLayer;
				break;
			case ObstacleType.PTERANODON:
				animName = AsaInfo.obstacle.anim.pteranodon;
				collisions = define.COLLISIONS_PTERANODON;
				parent = this.fryerLayer;
				break;
		}
		const actor = new asaEx.Actor(this.scene, AsaInfo.obstacle.pj, animName);
		actor.x = info.x;
		actor.y = info.y;
		entityUtil.appendEntity(actor, parent);
		if (define.DEBUG_SHOW_COLLISION_RECT) {
			for (let i = 0; i < collisions.length; ++i) {
				const rectCollision = new g.FilledRect({
					scene: this.scene,
					cssColor: define.DEBUG_COLLISION_RECT_COLOR,
					width: collisions[i].width,
					height: collisions[i].height
				});
				rectCollision.x = collisions[i].x;
				rectCollision.y = collisions[i].y;
				rectCollision.opacity = define.DEBUG_COLLISION_RECT_OPACITY;
				entityUtil.appendEntity(rectCollision, actor);
			}
		}
		if (info.type === ObstacleType.PTERANODON) {
			actor.modified();
			actor.calc();
			actor.pause = true;
			actor.loop = false;
		}

		this.liveObstacles[this.liveObstacles.length] = {
			placeInfoIndex: _index,
			actor: actor,
			collisions: collisions
		};

		// console.log(this.fryerLayer.children.length);
	}

	/**
	 * 表示中の障害物の表示終了判定と表示終了処理を行うメソッド
	 */
	private checkObstacleLifeTime(): void {
		const deadLine = (0 - this.scene.game.width -
			define.OBSTACLE_WIDTH_TO_VANISH_AREA) +
			this.scrolledPixelCount;
		const survivals: LiveObstacleInfo[] = [];
		const lives = this.liveObstacles;
		const iEnd = lives.length;
		for (let i = 0; i < iEnd; ++i) {
			let survived = true;
			if (lives[i].actor.x > deadLine) {
				if (!this.checkPteranodonLifeCycle(lives[i])) {
					survived = false;
				}
			}
			if (survived) {
				survivals[survivals.length] = lives[i];
			} else {
				lives[i].actor.destroy();
				lives[i].actor = null;
			}
		}
		this.liveObstacles.length = 0;
		this.liveObstacles = survivals;
	}

	/**
	 * プテラノドン固有の状態変化処理を行うメソッド
	 * @param {LiveObstacleInfo} _live 処理対象がのLiveObstacleInfo
	 * @return {boolean} 処理対象がプテラノドンで、表示終了する場合はfalse
	 */
	private checkPteranodonLifeCycle(_live: LiveObstacleInfo): boolean {
		const info = this.obstaclePlaceInfos[_live.placeInfoIndex];
		if (info.type !== ObstacleType.PTERANODON) {
			return true;
		}

		const actor = _live.actor;
		if (actor.pause && (actor.currentFrame < (actor.animation.frameCount - 1))) {
			if ((actor.x + this.x) > define.PTERANODON_WAKE_X) {
				return true;
			}
			// アニメ開始位置まで到達した時の処理
			actor.pause = false;
		} else {
			if (actor.currentFrame === (actor.animation.frameCount - 1)) {
				// 表示終了する場合
				return false;
			}
		}
		actor.x = define.PTERANODON_WAKE_X - this.x;
		// この後modified/calcされるはずなのでここでのmodifiedは省略
		return true;
	}

	/**
	 * 表示中の障害物のactorのmodified/calcを行うメソッド
	 */
	private updateObstacleActor(): void {
		const lives = this.liveObstacles;
		const iEnd = lives.length;
		for (let i = 0; i < iEnd; ++i) {
			const actor = lives[i].actor;
			actor.modified();
			actor.calc();
			if (define.DEBUG_SHOW_COLLISION_RECT) {
				const info = this.obstaclePlaceInfos[lives[i].placeInfoIndex];
				if (info.type === ObstacleType.PTERANODON) {
					const offset = actor.getBonePosition(
						define.PTERANODON_PIVOT_NAME);
					for (let j = 0; j < actor.children.length; ++j) {
						entityUtil.setXY(
							actor.children[j],
							lives[i].collisions[j].x + offset.x,
							lives[i].collisions[j].y + offset.y);
					}
				}
			}
		}
	}

	/**
	 * 表示中の背景物をすべて消去するメソッド
	 */
	private clearLandmarks(): void {
		const lives = this.liveLandmarks;
		const iEnd = lives.length;
		for (let i = 0; i < iEnd; ++i) {
			lives[i].sprite.destroy();
			lives[i].sprite = null;
		}
		this.liveLandmarks.length = 0;
	}

	/**
	 * 表示中の障害物をすべて消去するメソッド
	 */
	private clearObstacles(): void {
		const lives = this.liveObstacles;
		const iEnd = lives.length;
		for (let i = 0; i < iEnd; ++i) {
			lives[i].actor.destroy();
			lives[i].actor = null;
		}
		this.liveObstacles.length = 0;
	}

	/**
	 * 矩形と障害物の衝突判定を行うメソッド
	 * @param  {g.CommonArea} _rect 判定対象1の領域
	 * @param  {g.CommonOffset} _pos 判定対象2の基準位置
	 * @param  {g.CommonArea[]} _collisions _posからの相対領域配列
	 * @return {boolean} 衝突した場合はtrue
	 */
	private checkCollisionCore(
		_rect: g.CommonArea,
		_pos: g.CommonOffset,
		_collisions: g.CommonArea[]): boolean {
		const iEnd = _collisions.length;
		for (let i = 0; i < iEnd; ++i) {
			const collision = {
				x: _pos.x + _collisions[i].x,
				y: _pos.y + _collisions[i].y,
				width: _collisions[i].width,
				height: _collisions[i].height
			};
			if (g.Collision.intersectAreas(_rect, collision)) {
				return true;
			}
		}
		return false;
	}

	/**
	 * 衝突時のSEを再生する
	 * @param {ObstacleType} type 衝突した障害物の種別
	 */
	private playCollisionSe(type: ObstacleType): void {
		let seName: string = "";  // no sound
		switch (type) {
			case ObstacleType.GULL:
				seName = SoundInfo.seSet.gull;
				break;
			case ObstacleType.SHARK:
				seName = SoundInfo.seSet.shark;
				break;
			case ObstacleType.PTERANODON:
				seName = SoundInfo.seSet.pteranodon;
				break;
		}
		audioUtil.play(seName);
	}
}
