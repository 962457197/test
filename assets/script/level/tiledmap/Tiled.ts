// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

import { Blocker } from "../blocker/Blocker";
import { Direction, TiledType } from "../data/LevelScriptableData";
import { LevelTiledData } from "../data/LevelScriptableData";
import { NormalTiled } from "./NormalTiled";
import { TiledMap } from "./TiledMap";

export class Tiled {
    public static WIDTH: number = 116;
    public static HEIGHT: number = 116;

    m_tiledTableData: LevelTiledData = null;
    Row: number = 0;
    Col: number = 0;
    Guid: number = 0;
    m_tiledRoot: cc.Node = null;
    m_tiled: cc.Node = null;
    PrevTiledGuid: number = 0;
    NextTiledGuid: number = 0;
    CanMoveBlocker: Blocker = null;
    Marked: boolean = false;
    BeTriggerTiled: Tiled = null;

    public GetTiledType(): TiledType {
        return this.m_tiledTableData.type;
    }

    FallingDir() { 
        return this.m_tiledTableData.direction;
    }

    LocalPosition()
    {
        return this.m_tiledRoot.position;
    }

    Create(idx: number, data: LevelTiledData, parent: cc.Node, row: number, col: number, name: string)
    {
        this.CanMoveBlocker = null;
    }

    IsValidTiled()
    {
        if (this.m_tiledTableData.type == TiledType.None || this.m_tiledTableData.type == TiledType.Invalid)
        {
            return false;
        }
        return true;
    }

    GetPrevTiled()
    {
        return TiledMap.getInstance().GetTiledByGUID(this.PrevTiledGuid);
    }

    GetNextTiled()
    {
        return TiledMap.getInstance().GetTiledByGUID(this.NextTiledGuid);
    }

    GetNeighborBottom()
    {
        return TiledMap.getInstance().GetTiled(this.Row + 1, this.Col);
    }
    GetNeighborLeftBottom()
    {
        return TiledMap.getInstance().GetTiled(this.Row + 1, this.Col - 1);
    }
    GetNeighborRightBottom()
    {
        return TiledMap.getInstance().GetTiled(this.Row + 1, this.Col + 1);
    }
    GetNeighborTop()
    {
        return TiledMap.getInstance().GetTiled(this.Row - 1, this.Col);
    }
    GetNeighborLeftTop()
    {
        return TiledMap.getInstance().GetTiled(this.Row - 1, this.Col - 1);
    }
    GetNeighborRightTop()
    {
        return TiledMap.getInstance().GetTiled(this.Row - 1, this.Col + 1);
    }
    GetNeighborRight()
    {
        return TiledMap.getInstance().GetTiled(this.Row, this.Col + 1);
    }
    GetNeighborLeft()
    {
        return TiledMap.getInstance().GetTiled(this.Row, this.Col - 1);
    }

    GetLocalNeighborTop(this: Tiled): Tiled | null {
        switch (this.FallingDir()) {
            case Direction.Down: return this.GetNeighborTop();
            case Direction.Left: return this.GetNeighborRight();
            case Direction.Right: return this.GetNeighborLeft();
            case Direction.Up: return this.GetNeighborBottom();
        }
        return null;
    }
    
    GetLocalNeighborBottom(this: Tiled): Tiled | null {
        switch (this.FallingDir()) {
            case Direction.Down: return this.GetNeighborBottom();
            case Direction.Left: return this.GetNeighborLeft();
            case Direction.Right: return this.GetNeighborRight();
            case Direction.Up: return this.GetNeighborTop();
        }
        return null;
    }
    
    GetLocalNeighborLeft(this: Tiled): Tiled | null {
        switch (this.FallingDir()) {
            case Direction.Down: return this.GetNeighborLeft();
            case Direction.Left: return this.GetNeighborTop();
            case Direction.Right: return this.GetNeighborBottom();
            case Direction.Up: return this.GetNeighborRight();
        }
        return null;
    }
    
    GetLocalNeighborRight(this: Tiled): Tiled | null {
        switch (this.FallingDir()) {
            case Direction.Down: return this.GetNeighborRight();
            case Direction.Left: return this.GetNeighborBottom();
            case Direction.Right: return this.GetNeighborTop();
            case Direction.Up: return this.GetNeighborLeft();
        }
        return null;
    }
    
    GetLocalNeighborLeftBottom(this: Tiled): Tiled | null {
        switch (this.FallingDir()) {
            case Direction.Down: return this.GetNeighborLeftBottom();
            case Direction.Left: return this.GetNeighborLeftTop();
            case Direction.Right: return this.GetNeighborRightBottom();
            case Direction.Up: return this.GetNeighborRightTop();
        }
        return null;
    }
    
    GetLocalNeighborRightBottom(this: Tiled): Tiled | null {
        switch (this.FallingDir()) {
            case Direction.Down: return this.GetNeighborRightBottom();
            case Direction.Left: return this.GetNeighborLeftBottom();
            case Direction.Right: return this.GetNeighborRightTop();
            case Direction.Up: return this.GetNeighborLeftTop();
        }
        return null;
    }
    
    GetLocalNeighborLeftTop(this: Tiled): Tiled | null {
        switch (this.FallingDir()) {
            case Direction.Down: return this.GetNeighborLeftTop();
            case Direction.Left: return this.GetNeighborRightTop();
            case Direction.Right: return this.GetNeighborLeftBottom();
            case Direction.Up: return this.GetNeighborRightBottom();
        }
        return null;
    }
    
    GetLocalNeighborRightTop(this: Tiled): Tiled | null {
        switch (this.FallingDir()) {
            case Direction.Down: return this.GetNeighborRightTop();
            case Direction.Left: return this.GetNeighborRightBottom();
            case Direction.Right: return this.GetNeighborLeftTop();
            case Direction.Up: return this.GetNeighborLeftBottom();
        }
        return null;
    }
    

    public CheckNextArriveTiled(): Tiled | null {
        let nextTiled = this.GetNextTiled();
        if (nextTiled === null) {
            const localNeighborBottom = this.GetLocalNeighborBottom();
            if (localNeighborBottom === null) {
                return null;
            }
            nextTiled = localNeighborBottom as NormalTiled;
        }
        
        if (nextTiled.CanMoveBlocker !== null) {
            return null;
        }
    
        if (!nextTiled.CheckCanArriveFromLineTiled(this)) {
            return null;
        }
    
        const prevTiled = nextTiled.GetPrevTiled();
        if (prevTiled === null) {
            return null;
        } else if (nextTiled.CanMoveBlocker === null && nextTiled.PrevTiledGuid !== this.Guid && !nextTiled.CheckCanArriveFromLineTiled(nextTiled.GetPrevTiled())) {
            return null;
        }
    
        return nextTiled;
    }

    CheckCanArriveFromLineTiled(preTiled: Tiled, checkTiledMarked = true): boolean {

        return true;

        // const toptopBlocker: Blocker | null = this.TopTopBlocker();
        // const middle: Blocker | null = this.MiddleBlocker();
        // const isMagicHat: boolean = middle !== null && middle.IsMagicHat();
    
        // if ((checkTiledMarked && this.Marked) || toptopBlocker !== null || !this.IsValidTiled() || (this.Occupy() && !isMagicHat) || (this.IsLocked() && !isMagicHat) || preTiled === null ||
        //     (checkTiledMarked && preTiled.Marked) || preTiled.IsLocked() || preTiled.InValidOrOccupy()) {
        //     return false;
        // }
    
        // if (this.m_map.IsMoveDirection && this.OnCheckIsSameDirectionGroup(preTiled)) {
        //     return false;
        // }
    
        // if (preTiled.IsTeleportIn()) {
        //     if (this.IsTeleportOut()) {
        //         if (!this.IsTeleportSameGuid(preTiled)) {
        //             return false;
        //         }
        //         if (this.OnCheckTeleportStopFalling(preTiled)) {
        //             return false;
        //         }
        //         return true;
        //     } else {
        //         return false;
        //     }
        // }
    
        // const row: number = this.Row - preTiled.Row;
        // const col: number = this.Col - preTiled.Col;
        // let tiledDirection: Direction = Direction.None;
    
        // if (row > 1 || row < -1 || col > 1 || col < -1) {
        //     return false;
        // }
    
        // if (row === 0) {
        //     tiledDirection = col > 0 ? Direction.Right : Direction.Left;
        // } else if (col === 0) {
        //     tiledDirection = row > 0 ? Direction.Down : Direction.Up;
        // }
    
        // if (this.OnCheckTiledBorderStopFalling(preTiled, tiledDirection)) {
        //     return false;
        // }
    
        // if (preTiled.FallingDir === tiledDirection) {
        //     if (isMagicHat) {
        //         if (preTiled.CanMoveBlocker !== null
        //             && !preTiled.CanMoveBlocker.IsJelly() && !preTiled.CanMoveBlocker.IsBoxingGlove() && !preTiled.CanMoveBlocker.IsMagician()
        //             && preTiled.CanMoveBlocker.Color === middle.TableData.childid && middle.CurHP > 0) {
        //             this.m_tempStopFalling = true;
        //             return true;
        //         }
        //     } else {
        //         return !this.IsTeleportOut();
        //     }
        // }
    
        // return false;
    }
}
