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

    CanvasNode: cc.Node = null;

    Adapter(canvasNode: cc.Canvas, bgRoot: cc.Node)
    {
        this.CanvasNode = canvasNode.node;

        const height: number = cc.view.getFrameSize().height;
        const width: number = cc.view.getFrameSize().width;

        let screeWHRate = width / height;
        let designWHRate = cc.view.getDesignResolutionSize().width / cc.view.getDesignResolutionSize().height;
        if (screeWHRate <= 1)
        {
            if (screeWHRate <= designWHRate)
            {
                this.SetFitWidth();
            }
            else
            {
                this.SetFitHeight();
            }
        }
        else
        {
            this.SetFitHeight();
        }

        let scaleForShowAll = Math.min(
            width / canvasNode.node.width, 
            height / canvasNode.node.height
          );
          let realWidth = canvasNode.node.width * scaleForShowAll;
          let realHeight = canvasNode.node.height * scaleForShowAll;
          
          this.MaxRate = Math.max(
            width / realWidth, 
            height / realHeight
           );
          bgRoot.scale = this.MaxRate;
    }

    ScreenPosToTiledPos(screenPos: cc.Vec2): { row: number, col: number } {
        let worldPos = this.MainCamera.getScreenToWorldPoint(screenPos);
        return Utils.GetTiledRowAndCol(new cc.Vec2(worldPos.x, worldPos.y));
    }

    SetFitHeight()
    {
        cc.Canvas.instance.fitHeight = true;
        cc.Canvas.instance.fitWidth = false;
    }

    SetFitWidth()
    {
        cc.Canvas.instance.fitHeight = false;
        cc.Canvas.instance.fitWidth = true;
    }
}