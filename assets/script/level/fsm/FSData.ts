import { Direction } from "../data/LevelScriptableData";
import { Tiled } from "../tiledmap/Tiled";
import { FSStartType } from "./FSBase";

export interface FSDataBase {
    Reset(): void;
}

export class FSPrepareData implements FSDataBase {

    public curPos: cc.Vec2 = cc.Vec2.ZERO;
    public startType: FSStartType = FSStartType.enNormal;
    // public boostData: FSBoostData = new FSBoostData();
    public Neighbor: Tiled | null = null;
    public Direction: Direction = Direction.None;

    public Reset(): void {
        this.curPos = cc.Vec2.ZERO;
        this.startType = FSStartType.enNormal;
        this.Neighbor = null;
        this.Direction = Direction.None;
    }
}

export class FSSwitchData implements FSDataBase {
    public src: Tiled = null;
    public dest: Tiled = null;
    public isCheck: boolean = false;
    public startType: FSStartType = FSStartType.enNormal;

    public Reset(): void {
        this.src = null;
        this.dest = null;
        this.isCheck = false;
        this.startType = FSStartType.enNormal;
    }
}

export class FSCheckData implements FSDataBase {
    public src: Tiled = null; // 必须有数据
    public dest: Tiled = null;
    public isCheck: boolean = false;
    public isMain: boolean = false;
    public isUseItem: boolean = false;
    public isTriggerEffect: boolean = false;
    public startType: FSStartType = FSStartType.enNormal;

    public Reset(): void {
        this.src = null;
        this.dest = null;
        this.isCheck = false;
        this.isMain = false;
        this.isUseItem = false;
        this.isTriggerEffect = false;
        this.startType = FSStartType.enNormal;
    }
}

