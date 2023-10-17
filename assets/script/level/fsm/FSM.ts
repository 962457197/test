import { Direction } from "../data/LevelScriptableData";
import { Tiled } from "../tiledmap/Tiled";
import { TiledMap } from "../tiledmap/TiledMap";
import { FSBase } from "./FSBase";
import { FSPrepareData } from "./FSData";
import { StateFactory } from "./StateFactory";

export enum FSStateType
{
    enNone = 0,
    enFSM = 1,
    enAdpater = 2,
    enPrepare = 3,
    enSwitch = 4,
    enShuffle = 5,
    enSecondStageBlockers = 6,
    enInitFalling = 7,
    enFalling = 8,
    enExecuteEffect = 9,
    enEndPreMatch = 10,
    enConveryor = 11,
    enConveryorMatch = 12,
    enCheck = 13,
    enBoostCheck = 14,
    enFlippedTiled = 15,
}

export enum FSStartType
{
    enNone,
    enNormal,
    enInit,
    enBoost,
    enDoubleClick,
}

export class FSM
{
    private static instance: FSM | null = null;

    public static getInstance(): FSM{
        if (!FSM.instance)
        {
            FSM.instance = new FSM();
        }
        return FSM.instance;
    }

    MovingCanMatch: boolean = true;

    OnBeginDrag(row: number, col: number, tiled: Tiled, direction: Direction)
    {
        cc.error("OnBeginDrag !!! row = " + row + " col = " + col);
        
        let fsprepare = StateFactory.Instance.Create(FSStateType.enPrepare);

        let data = fsprepare.GetData() as FSPrepareData;
        data.curPos.x = row;
        data.curPos.y = col;
        data.startType = FSStartType.enNormal;
        data.Neighbor = tiled;
        data.Direction = direction;
        fsprepare.Start(null);
    }

    OnDoubleClick(row: number, col: number)
    {
        let fsprepare = StateFactory.Instance.Create(FSStateType.enPrepare);

        let data = fsprepare.GetData() as FSPrepareData;
        data.curPos.x = row;
        data.curPos.y = col;
        data.startType = FSStartType.enDoubleClick;
        data.Neighbor = null;
        data.Direction = Direction.None;
        fsprepare.Start(null);
    }
}