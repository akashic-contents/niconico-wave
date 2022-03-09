import { MainSceneController } from "./common/mainSceneController";

export = function() {
	g.game.pushScene(MainSceneController.createMainScene(g.game));
};
