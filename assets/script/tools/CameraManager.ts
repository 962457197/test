import Game from "../Game";
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

    PAD_MIN_RATE: number = 1.3;
    PAD_MAX_RATE: number = 1.6;
    //y = kX + b
    ANDROID_PAD_K: number = 0.2889;
    ANDROID_PAD_B: number = 9.534;

    MaxRate: number = 0;

    Adapter(canvasNode: cc.Canvas, bgRoot: cc.Node)
    {
        let isPad: boolean = false;
        let hWRate: number = 0;
        
        const height: number = cc.view.getFrameSize().height;
        const width: number = cc.view.getFrameSize().width;

        hWRate = height / width;
        let basehWRate = cc.view.getDesignResolutionSize().height / cc.view.getDesignResolutionSize().width;
        
        if (hWRate >= this.PAD_MIN_RATE && hWRate <= this.PAD_MAX_RATE) {
            isPad = true;
        }

        let h: number;

        if (isPad) {
            h = this.ANDROID_PAD_K * hWRate + this.ANDROID_PAD_B;
        } else {

            if (hWRate >= 1) {
                h = 9 * hWRate / 2 + (1.8 / basehWRate * hWRate);
            } else {
                h = 9.6;
            }

            if (isNaN(h)) {
                h = 10;
            }
        }

        this.MainCamera.orthoSize = h * Game.CC_SIZE_MULTI;

        let scale = h / 9.6;
        let heightRate = cc.view.getDesignResolutionSize().height / height;
        let widthRate =  cc.view.getDesignResolutionSize().width / width;
        this.MaxRate = heightRate > widthRate ? heightRate : widthRate;
        this.MaxRate = this.MaxRate > scale ? this.MaxRate : scale;
        if (this.MaxRate > 1)
        {
            bgRoot.setScale(this.MaxRate, this.MaxRate);
        }
    }

    ScreenPosToTiledPos(screenPos: cc.Vec2): { row: number, col: number } {
        // let worldPos = this.MainCamera.node.convertToNodeSpaceAR(screenPos);

        let worldPos: cc.Vec2 = cc.v2();
        this.MainCamera.getScreenToWorldPoint(screenPos, worldPos);

        return Utils.GetTiledRowAndCol(worldPos);
    }
}