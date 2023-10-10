import { Tiled } from "../level/tiledmap/Tiled";
import { TiledMap } from "../level/tiledmap/TiledMap";

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
        // // 将屏幕坐标转换为世界坐标
        // let worldPos: cc.Vec2 = cc.v2();
        // this.MainCamera.getScreenToWorldPoint(screenPos, worldPos);

        let worldPos = this.MainCamera.node.convertToNodeSpaceAR(screenPos);

        cc.log("screenPos = " + screenPos + " worldPos = " + worldPos);
    
        // 减去地图节点的位置
        worldPos.x -= TiledMap.getInstance().m_tiledMapRoot.position.x;
        worldPos.y -= TiledMap.getInstance().m_tiledMapRoot.position.y;
    
        // 计算瓦片的行和列
        const row = Math.round(Math.abs(worldPos.y / Tiled.HEIGHT));
        const col = Math.round(Math.abs(worldPos.x / Tiled.WIDTH));

        cc.log("ScreenPosToTiledPos row = " + row + " col = " + col);
    
        return { row, col };
    }
}