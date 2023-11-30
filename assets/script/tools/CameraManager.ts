import Game from "../Game";
import { Tiled } from "../level/tiledmap/Tiled";
import { TiledMap } from "../level/tiledmap/TiledMap";
import { UIManager } from "../ui/UIManager";
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

    DefaultCameraOrthographicSize: number = 9.6;

    MainCamera: cc.Camera = null;
    
    MaxRate: number = 0;

    CanvasNode: cc.Node = null;
    BgRoot: cc.Node = null;

    OnStart(bgRoot: cc.Node)
    {
        this.BgRoot = bgRoot;
        this.Adapter();
        cc.view.on('canvas-resize', this.Adapter, this);
    }

    Adapter()
    {
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
            width / cc.Canvas.instance.node.width, 
            height / cc.Canvas.instance.node.height
          );
        let realWidth = cc.Canvas.instance.node.width * scaleForShowAll;
        let realHeight = cc.Canvas.instance.node.height * scaleForShowAll;
        
        this.MaxRate = Math.max(
        width / realWidth, 
        height / realHeight
        );
        this.BgRoot.scale = this.MaxRate;

        UIManager.Instance.Adpater();
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