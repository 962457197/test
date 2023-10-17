import { Tiled } from "../level/tiledmap/Tiled";
import { TiledMap } from "../level/tiledmap/TiledMap";
import { Utils } from "./Utils";

export class CameraManager
{
    private static instance: CameraManager | null = null;

    private constructor(){

    }

    public static getInstance(): CameraManager{
        if (!CameraManager.instance)
        {
            CameraManager.instance = new CameraManager();
        }
        return CameraManager.instance;
    }

    MainCamera: cc.Camera = null;

    ScreenPosToTiledPos(screenPos: cc.Vec2): { row: number, col: number } {
        // let worldPos = this.MainCamera.node.convertToNodeSpaceAR(screenPos);

        let worldPos: cc.Vec2 = cc.v2();
        this.MainCamera.getScreenToWorldPoint(screenPos, worldPos);

        return Utils.GetTiledRowAndCol(worldPos);
    }
}