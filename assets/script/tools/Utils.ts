// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

import Game from "../Game";
import { Tiled } from "../level/tiledmap/Tiled";
import { TiledMap } from "../level/tiledmap/TiledMap";

export class Utils {
    static SetNodeActive(node: cc.Node, active: boolean) {
        if (node != null) {
            node.active = active;
        }
    }

    static IsZero(value: number, tolerance: number = 1e-5): boolean {
        return value > -0.01 && value < 0.01;
        // return Math.abs(value) < tolerance;
    }

    static GetTiledRowAndCol(worldPos: cc.Vec2): { row: number, col: number } {
        let localWorldPos = new cc.Vec2(worldPos.x, worldPos.y);

        localWorldPos.x -= TiledMap.getInstance().MapRootPosition.x;
        localWorldPos.y -= TiledMap.getInstance().MapRootPosition.y;

        const row = Math.round(Math.abs(localWorldPos.y / (Tiled.HEIGHT * Game.m_buildConfig.TiledMapScale)));
        const col = Math.round(Math.abs(localWorldPos.x / (Tiled.WIDTH * Game.m_buildConfig.TiledMapScale)));

        //cc.log("ScreenPosToTiledPos row = " + row + " col = " + col);
    
        return { row, col };
    }
}
