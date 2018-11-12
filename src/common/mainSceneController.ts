import { SceneController } from "../commonNicowariGame/sceneController";
import * as tl from "@akashic-extension/akashic-timeline";
import { CommonAsaInfo } from "./commonAsaInfo";
import { CommonAssetInfo } from "./commonAssetInfo";
import { CommonSoundInfo } from "./commonSoundInfo";
import { commonDefine } from "./commonDefine";
import { AsaInfo } from "../classes/asaInfo";
import { AssetInfo } from "../classes/assetInfo";
import { SoundInfo } from "../classes/soundInfo";
import { MiscAssetInfo } from "../classes/miscAssetInfo";
import { asaEx } from "../util/asaEx";
import { gameUtil } from "../util/gameUtil";
import { spriteUtil } from "../util/spriteUtil";
import { entityUtil } from "../util/entityUtil";
import { audioUtil } from "../util/audioUtil";
import { Subscene } from "../commonNicowariGame/subscene";
import { TitleSubscene } from "./titleSubscene";
import { DescriptionSubscene } from "./descriptionSubscene";
import { GameSubscene } from "./gameSubscene";
import { ResultSubscene } from "./resultSubscene";
import { WipeManager } from "./wipeManager";
import { RireGameParameters } from "../commonNicowariGame/rireGameParameters";
import { CommonParameterReader, LaunchType } from "../commonNicowariGame/commonParameterReader";
import { InformationSubscene } from "./informationSubscene";

/**
 * 起動パラメータのメッセージデータの型
 */
interface COESessionStartMessage<T> {
	type: "start";
	parameters: T;
}

/**
 * 起動パラメータイベントの判定を行うメソッド
 * @param {g.MessageEvent} e MessageEventオブジェクト
 * @return {boolean} 起動パラメータイベントであればtrue
 */
function isCOESessionStartMessage(e: g.MessageEvent): boolean {
	return (<COESessionStartMessage<RireGameParameters>>e.data).type === "start";
}

/**
 * mainScene用のSceneを生成するクラス
 */
export class MainSceneController extends SceneController {
	/** サブシーン表示レイヤー */
	private mainLayer: g.E;
	/** ワイプ演出表示レイヤー */
	private wipeLayer: g.E;

	/** ワイプ演出管理インスタンス */
	private wipeManager: WipeManager;

	/** 表示中のサブシーン */
	private currentSubscene: Subscene;

	/** タイトルサブシーン */
	private titleSubscene: TitleSubscene;
	/** 説明サブシーン */
	private descriptionSubscene: DescriptionSubscene;
	/** ゲームシーン */
	private gameSubscene: GameSubscene;
	/** リザルトシーン */
	private resultSubscene: ResultSubscene;
	/** ゲーム開始情報シーン */
	private informationSubscene: InformationSubscene;

	constructor() {
		super();
	}

	/**
	 * このクラスのインスタンスと、そのインスタンスで処理するSceneを生成する
	 * @param {g.Game} _game Scene生成に使用するGame
	 * @return {g.Scene} 生成したScene
	 */
	static createMainScene(_game: g.Game): g.Scene {
		const controller = new MainSceneController();
		return controller.createScene(g.game);
	}

	/**
	 * このクラスで処理するSceneを生成する
	 * @param {g.Game} _game Scene生成に使用するGame
	 * @return {g.Scene} 生成したScene
	 * @override
	 */
	createScene(_game: g.Game): g.Scene {
		gameUtil.initGameState();
		// レイアウト変更要求
		if (_game.external.send) {
			_game.external.send({
				type: "nx:layout",
				layout: "under-comment",
				background: "hidden"
			});
		}

		const assetIds: string[] = [];
		spriteUtil.addAssetIdsFromAssetInfoMap(CommonAssetInfo, assetIds);
		spriteUtil.addAssetIdsFromAssetInfoMap(AssetInfo, assetIds);
		asaEx.ResourceManager.addAsaAssetIds(
			spriteUtil.getPjNamesFromAsainfoMap(CommonAsaInfo),
			_game.assets, assetIds);
		asaEx.ResourceManager.addAsaAssetIds(
			spriteUtil.getPjNamesFromAsainfoMap(AsaInfo),
			_game.assets, assetIds);
		audioUtil.addAssetIdsFromSoundInfoMap(CommonSoundInfo, assetIds);
		audioUtil.addAssetIdsFromSoundInfoMap(SoundInfo, assetIds);
		gameUtil.addAssetIdsFromMiscAssetInfoMap(MiscAssetInfo, assetIds);

		// console.log("createScene: assetIds:"+assetIds.join(",")+".");
		const scene = new g.Scene({ game: _game, assetIds: assetIds });
		let parameters: RireGameParameters = null;
		scene.loaded.handle((): boolean => {
			// loaded完了後、OperationEventを処理するため1 tick遅延させる
			scene.update.handle((): boolean => {
				// console.log("scene.update: parameters:" + parameters + ".");
				if (parameters) {
					// 起動パラメータの保持
					scene.game.vars.parameters = parameters;
					CommonParameterReader.read(parameters);
				} else {
					scene.game.vars.parameters = {};
					CommonParameterReader.read({});
				}
				this.onLoaded(scene);
				return true;
			});
			return true;
		});
		scene.message.handle((e: g.MessageEvent): boolean => {
			// console.log("scene.message: e:" + JSON.stringify(e) + ".");
			if (isCOESessionStartMessage(e)) {
				parameters = (<COESessionStartMessage<RireGameParameters>>e.data).parameters;
			}
			return true;
		});

		return scene;
	}

	/**
	 * Scene#loadedのハンドラ
	 * onUpdateを呼ぶScene#updateのハンドラをこの中で登録する
	 * @param {g.Scene} _scene 処理対象のScene
	 * @return {boolean} 通常trueを返し、ハンドラ登録を解除する
	 * @override
	 */
	protected onLoaded(_scene: g.Scene): boolean {
		const game = _scene.game;
		game.vars.scenedata = {};

		// このシーンで使いまわすTimelineインスタンス
		game.vars.scenedata.timeline = new tl.Timeline(_scene);

		this.mainLayer = new g.E({ scene: _scene });
		entityUtil.appendEntity(this.mainLayer, _scene);
		this.wipeLayer = new g.E({ scene: _scene });
		entityUtil.appendEntity(this.wipeLayer, _scene);

		this.wipeManager = new WipeManager(_scene);
		entityUtil.appendEntity(this.wipeManager, this.wipeLayer);

		const shade = new g.FilledRect({
			scene: _scene,
			cssColor: "#000000",
			opacity: commonDefine.BG_SHADE_OPACITY,
			width: _scene.game.width,
			height: _scene.game.height
		});
		entityUtil.appendEntity(shade, this.mainLayer);

		const infoSubScene = this.informationSubscene = new InformationSubscene(_scene);
		infoSubScene.init();
		infoSubScene.requestedNextSubscene.handle(this, this.goNextFromInformation);
		entityUtil.appendEntity(infoSubScene, this.mainLayer);

		const title = this.titleSubscene = new TitleSubscene(_scene);
		title.init();
		title.requestedNextSubscene.handle(this, this.goNextFromTitle);
		entityUtil.appendEntity(title, this.mainLayer);

		const desc = this.descriptionSubscene = new DescriptionSubscene(_scene);
		desc.init();
		desc.requestedNextSubscene.handle(this, this.goNextFromDescription);
		entityUtil.appendEntity(desc, this.mainLayer);

		const main = this.gameSubscene = new GameSubscene(_scene);
		main.init();
		main.requestedNextSubscene.handle(this, this.goNextFromGame);
		entityUtil.appendEntity(main, this.mainLayer);

		const result = this.resultSubscene = new ResultSubscene(_scene);
		result.init();
		result.requestedNextSubscene.handle(this, this.goNextFromResult);
		entityUtil.appendEntity(result, this.mainLayer);

		if (CommonParameterReader.muteAudio) {
			audioUtil.setMute(true);
		}

		title.setBgmName(main.getTitleBgmName());

		if (commonDefine.DEBUG_SKIP_PREGAMESUBSCENE) {
			this.changeSubscene(this.gameSubscene);
		} else {
			if (CommonParameterReader.isInitialSceneGame) {
				this.changeSubscene(this.descriptionSubscene);
			} else {
				if (CommonParameterReader.launchType === LaunchType.NOTHING) {
					this.changeSubscene(this.titleSubscene);
				} else {
					this.changeSubscene(this.informationSubscene);
				}
			}
		}

		_scene.update.handle((): boolean => {
			return this.onUpdate(_scene);
		});
		_scene.stateChanged.handle((e: g.SceneState): boolean => {
			if (e === g.SceneState.Destroyed) {
				asaEx.ResourceManager.removeAllLoadedResource();
				delete game.vars.scenedata;
				return true;
			}
			return false;
		});

		return true;
	}

	/**
	 * Scene#updateのハンドラ
	 * @param {g.Scene} _scene 処理対象のScene
	 * @return {boolean} 通常falseを返す
	 * @override
	 */
	protected onUpdate(_scene: g.Scene): boolean {
		this.currentSubscene.onUpdate();
		return false;
	}

	/**
	 * currentSubsceneをワイプなしで変更する
	 * @param {Subscene} _next 変更後のサブシーン
	 */
	private changeSubscene(_next: Subscene): void {
		if (this.currentSubscene) {
			this.currentSubscene.stopContent();
			this.currentSubscene.hideContent();
		}
		this.currentSubscene = _next;
		this.currentSubscene.showContent();
		this.currentSubscene.startContent();
	}

	/**
	 * currentSubsceneをワイプありで変更する
	 * @param {boolean} _isRtoL trueならばRtoL、falseならばLtoRのワイプを使用する
	 * @param {Subscene} _next 変更後のサブシーン
	 */
	private trasitionSubscene(_isRtoL: boolean, _next: Subscene): void {
		if (this.currentSubscene) {
			this.currentSubscene.stopContent();
		}
		this.wipeManager.startWipe(
			_isRtoL,
			(): void => {
				if (this.currentSubscene) {
					this.currentSubscene.hideContent();
				}
				this.currentSubscene = _next;
				this.currentSubscene.showContent();
			},
			(): void => {
				this.currentSubscene.startContent();
			});
	}

	/**
	 * ゲーム開始説明画面からタイトルに遷移する
	 * InformationSubScene#requestedNextSubsceneのハンドラ
	 */
	private goNextFromInformation(): void {
		this.trasitionSubscene(true, this.titleSubscene);
	}

	/**
	 * タイトルから説明に遷移する
	 * TitleSubscene#requestedNextSubsceneのハンドラ
	 */
	private goNextFromTitle(): void {
		this.trasitionSubscene(true, this.descriptionSubscene);
	}

	/**
	 * 説明からゲームに遷移する
	 * DescriptionSubscene#requestedNextSubsceneのハンドラ
	 */
	private goNextFromDescription(): void {
		this.trasitionSubscene(true, this.gameSubscene);
	}

	/**
	 * ゲームからリザルトに遷移する
	 * GameSubscene#requestedNextSubsceneのハンドラ
	 */
	private goNextFromGame(): void {
		this.trasitionSubscene(false, this.resultSubscene);
	}

	/**
	 * リザルトからタイトルに遷移する
	 * ResultSubscene#requestedNextSubsceneのハンドラ
	 */
	private goNextFromResult(): void {
		if (commonDefine.DEBUG_SKIP_PREGAMESUBSCENE) {
			this.changeSubscene(this.gameSubscene);
		} else {
			if (CommonParameterReader.isInitialSceneGame) {
				this.changeSubscene(this.descriptionSubscene);
			} else {
				this.changeSubscene(this.informationSubscene);
			}
		}
	}
}
