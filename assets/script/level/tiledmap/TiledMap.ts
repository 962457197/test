// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

import { Direction, LevelScriptableData, LevelTiledData, TiledType } from "../data/LevelScriptableData";
import { EntryTiled } from "./EntryTiled";
import { NormalTiled } from "./NormalTiled";
import { Tiled } from "./Tiled";
import TiledOverCastCom from "./TiledOverCastCom";
import { Utils } from "../../tools/Utils";
import Game from "../../Game";
import { FirstActionType } from "../../table/BlockTable";
import { ColorManager } from "../blocker/ColorManager";
import { Blocker } from "../blocker/Blocker";

export class TiledMap {
    private static instance: TiledMap | null = null;

    private constructor() {
        // 防止外部实例化
    }
  
    public static getInstance(): TiledMap {
        if (!TiledMap.instance) {
            TiledMap.instance = new TiledMap();
        }
        return TiledMap.instance;
    }

    public static MAX_COL: number = 9;
    public static MAX_ROW: number = 9;
    public static CC_OFFSET = 100;
    public static ENTRY_GUID_OFFSET: number = 1000;

    m_lvlData: LevelScriptableData = null;
    m_tiledMapRoot: cc.Node = null;
    m_blockerRoot: cc.Node = null;
    m_tiledArray: NormalTiled[] = null;
    m_enterTiledArray: EntryTiled[] = null;

    ColorLimitList: number[] = [];

    public OnCreate(levelData: LevelScriptableData, tiledMapRoot: cc.Node, tiledRoot: cc.Node, blockerRoot: cc.Node): void 
    {
        this.InitLevelData(levelData);
        this.m_tiledMapRoot = tiledMapRoot;
        this.m_blockerRoot = blockerRoot;

        let posx = -((this.m_lvlData.maxCols / 2 * Tiled.WIDTH) - Tiled.WIDTH / 2);
        let posy = (this.m_lvlData.maxRows / 2 * Tiled.HEIGHT) - Tiled.HEIGHT / 2;

        if (this.m_lvlData.realRows !== 0 && this.m_lvlData.realCols !== 0) {
            const rem_X: number = (this.m_lvlData.maxCols - this.m_lvlData.realCols) % 2;
            if (rem_X === 1) {
                posx += ((this.m_lvlData.maxCols - this.m_lvlData.realCols) * 0.5 * Tiled.WIDTH);
            }
            const rem_Y: number = (this.m_lvlData.maxRows - this.m_lvlData.realRows) % 2;
            if (rem_Y === 1) {
                posy -= ((this.m_lvlData.maxRows - this.m_lvlData.realRows) * 0.5 * Tiled.HEIGHT);
            }
        }
        tiledMapRoot.setPosition(posx, posy);

        this.m_tiledArray = new Array<NormalTiled>(TiledMap.MAX_COL * TiledMap.MAX_ROW);
        this.m_enterTiledArray = new Array<EntryTiled>(TiledMap.MAX_COL * TiledMap.MAX_ROW);
        
        for (let row = 0; row < this.m_lvlData.maxRows; row++) {
            for (let col = 0; col < this.m_lvlData.maxCols; col++) {
                const index = row * TiledMap.MAX_COL + col;
                const tiledData: LevelTiledData = this.m_lvlData.tiledData[index];
                const idx: number = row * this.m_lvlData.maxCols + col;

                this.m_tiledArray[idx] = new NormalTiled();
                this.m_tiledArray[idx].Create(idx, tiledData, tiledRoot, row, col, "NormalTiled_" + row + "_" + col);
        
                if (tiledData.type !== TiledType.None && tiledData.IsEnterPoint) {

                    const enter: Tiled = new EntryTiled();
                    this.m_enterTiledArray[idx] = enter;
                    this.m_enterTiledArray[idx].Create(idx, tiledData, tiledRoot, row, col, "EntryTiled_" + row + "_" + col);

                    this.m_enterTiledArray[idx].PrevTiledGuid = -1;
                    this.m_enterTiledArray[idx].NextTiledGuid = idx;
                    this.m_tiledArray[idx].EnterPoint = this.m_enterTiledArray[idx];
                }
    
                this.m_tiledArray[idx].GenerateBlocker();
            }
        }
    }

    InitLevelData(levelData: LevelScriptableData) {
        this.m_lvlData = levelData;

        this.ColorLimitList = this.m_lvlData.ColorLimitList;
        let allcolors = ColorManager.GetAllBaseColorIds();
        if (this.ColorLimitList.length == 0)
        {
            let colorLimit = this.m_lvlData.colorLimit;
            for (let i = 0; i < colorLimit; i++)
            {
                this.ColorLimitList.push(allcolors[i]);
            }
        }
        else
        {
            this.ColorLimitList.sort(function(x,y) {
                return x-y
            });
        }
    }

    magicFlag: boolean = false;
    SetTiledData()
    {
        for (let i = 0; i < this.m_tiledArray.length; i++)
        {
            if (!this.m_tiledArray[i].IsValidTiled())
            {
                continue;
            }

            var r = this.m_tiledArray[i].Row;
            var c = this.m_tiledArray[i].Col;

            if (!this.magicFlag && this.GetIsCanMove3X2Square(r, c))
            {
                (this.m_tiledArray[i] as NormalTiled).GenerateCanMoveCheckMatch();
                var baseId = this.m_tiledArray[i].CanMoveBlocker.Color;
                let matches = this.GetMatchNumAround(r, c + 2, baseId, true);
                let matches2 = this.GetMatchNumAround(r + 1, c + 1, baseId, true);
                if (matches <= 1 && matches2 <= 1)
                {
                    this.GetTiled(r, c + 2).GenerateCanMove(baseId);
                    this.GetTiled(r + 1, c + 1).GenerateCanMove(baseId);
                    this.magicFlag = true;
                }
            }
            else
            {
                (this.m_tiledArray[i] as NormalTiled).GenerateCanMoveCheckMatch();
            }

            let next = this.GetTiled(this.m_tiledArray[i].Row + 1, this.m_tiledArray[i].Col);
            if (null != next && next.IsValidTiled())
            {
                if (null == this.m_tiledArray[i].GetNextTiled())
                    this.m_tiledArray[i].NextTiledGuid = next.Guid;
                if (null == next.GetPrevTiled())
                    next.PrevTiledGuid = i;
            }
        }

        for (let i = 0; i < this.m_tiledArray.length; i++)
        {
            // 将tiled出现 NextTiled或PrevTiled循环指向置空
            if (this.m_tiledArray[i].GetPrevTiled() != null && this.m_tiledArray[i].GetPrevTiled().GetPrevTiled() != null
                && this.m_tiledArray[i].GetPrevTiled().PrevTiledGuid == this.m_tiledArray[i].Guid)
            {
                this.m_tiledArray[i].GetPrevTiled().PrevTiledGuid = -1;
                this.m_tiledArray[i].PrevTiledGuid = -1;
            }
            if (this.m_tiledArray[i].GetNextTiled() != null && this.m_tiledArray[i].GetNextTiled().GetNextTiled() != null
                && this.m_tiledArray[i].GetNextTiled().NextTiledGuid == this.m_tiledArray[i].Guid)
            {
                this.m_tiledArray[i].GetNextTiled().NextTiledGuid = -1;
                this.m_tiledArray[i].NextTiledGuid = -1;
            }

            if (this.m_tiledArray[i].GetTiledType() == TiledType.None)
            {
                this.SetInEdge(this.m_tiledArray[i]);
            }
            else
            {
                this.SetOutEdge(this.m_tiledArray[i]);
            }
        }
    }

    SetInEdge(tiled: Tiled): void {
        const top = tiled.GetNeighborTop();
        const bottom = tiled.GetNeighborBottom();
        const left = tiled.GetNeighborLeft();
        const right = tiled.GetNeighborRight();
        const hasTop = top !== null && (top.GetTiledType() === TiledType.Normal || top.GetTiledType() === TiledType.Empty);
        const hasBottom = bottom !== null && (bottom.GetTiledType() === TiledType.Normal || bottom.GetTiledType() === TiledType.Empty);
        const hasLeft = left !== null && (left.GetTiledType() === TiledType.Normal || left.GetTiledType() === TiledType.Empty);
        const hasRight = right !== null && (right.GetTiledType() === TiledType.Normal || right.GetTiledType() === TiledType.Empty);
    
        const nothasTop = top !== null && top.GetTiledType() === TiledType.None;
        const nothasBottom = bottom !== null && bottom.GetTiledType() === TiledType.None;
        const nothasLeft = left !== null && left.GetTiledType() === TiledType.None;
        const nothasRight = right !== null && right.GetTiledType() === TiledType.None;
    
        const lefttop = tiled.GetNeighborLeftTop();
        const leftbottom = tiled.GetNeighborLeftBottom();
        const righttop = tiled.GetNeighborRightTop();
        const rightbottom = tiled.GetNeighborRightBottom();
        const hasLeftTop = lefttop !== null && (lefttop.GetTiledType() === TiledType.Normal || lefttop.GetTiledType() === TiledType.Empty);
        const hasLeftBottom = leftbottom !== null && (leftbottom.GetTiledType() === TiledType.Normal || leftbottom.GetTiledType() === TiledType.Empty);
        const hasRightTop = righttop !== null && (righttop.GetTiledType() === TiledType.Normal || righttop.GetTiledType() === TiledType.Empty);
        const hasRightBottom = rightbottom !== null && (rightbottom.GetTiledType() === TiledType.Normal || rightbottom.GetTiledType() === TiledType.Empty);
    
        if (!((hasTop && hasLeft)
            || (hasTop && hasRight)
            || (hasBottom && hasLeft)
            || (hasBottom && hasRight))) {
            return;
        }
    
        const normal = tiled as NormalTiled;
        const overCast = normal.m_tiled.getComponentInChildren(TiledOverCastCom).TiledOverCasts[1];
    
        //左上
        if (hasTop && hasLeft) {
            Utils.SetNodeActive(overCast.Up_Left, true);
            if (nothasRight && hasRightTop) {
                Utils.SetNodeActive(overCast.Up_Left_HorFill, true);
            }
            if (nothasBottom && hasLeftBottom) {
                Utils.SetNodeActive(overCast.Up_Left_VerFill, true);
            }
        }
        //右上
        if (hasTop && hasRight) {
            Utils.SetNodeActive(overCast.Up_Right, true);
            if (nothasLeft && hasLeftTop) {
                Utils.SetNodeActive(overCast.UpRight_HorFill, true);
            }
            if (nothasBottom && hasRightBottom) {
                Utils.SetNodeActive(overCast.UpRight_VerFill, true);
            }
        }
        //左下
        if (hasBottom && hasLeft) {
            Utils.SetNodeActive(overCast.Down_Left, true);
            if (nothasRight && hasRightBottom) {
                Utils.SetNodeActive(overCast.Down_Left_HorFill, true);
            }
            if (nothasTop && hasLeftTop) {
                Utils.SetNodeActive(overCast.Down_Left_VerFill, true);
            }
        }
        //右下
        if (hasBottom && hasRight) {
            Utils.SetNodeActive(overCast.Down_Right, true);
            if (nothasLeft && hasLeftBottom) {
                Utils.SetNodeActive(overCast.Down_Right_HorFill, true);
            }
            if (nothasTop && hasRightTop) {
                Utils.SetNodeActive(overCast.Down_Right_VerFill, true);
            }
        }
    }

    SetOutEdge(tiled: Tiled): void {
        const top = tiled.GetNeighborTop();
        const bottom = tiled.GetNeighborBottom();
        const left = tiled.GetNeighborLeft();
        const right = tiled.GetNeighborRight();
        const hasTop = top !== null && (top.GetTiledType() === TiledType.Normal || top.GetTiledType() === TiledType.Empty);
        const hasBottom = bottom !== null && (bottom.GetTiledType() === TiledType.Normal || bottom.GetTiledType() === TiledType.Empty);
        const hasLeft = left !== null && (left.GetTiledType() === TiledType.Normal || left.GetTiledType() === TiledType.Empty);
        const hasRight = right !== null && (right.GetTiledType() === TiledType.Normal || right.GetTiledType() === TiledType.Empty);
    
        const lefttop = tiled.GetNeighborLeftTop();
        const leftbottom = tiled.GetNeighborLeftBottom();
        const righttop = tiled.GetNeighborRightTop();
        const rightbottom = tiled.GetNeighborRightBottom();
        const hasLeftTop = lefttop !== null && (lefttop.GetTiledType() === TiledType.Normal || lefttop.GetTiledType() === TiledType.Empty);
        const hasLeftBottom = leftbottom !== null && (leftbottom.GetTiledType() === TiledType.Normal || leftbottom.GetTiledType() === TiledType.Empty);
        const hasRightTop = righttop !== null && (righttop.GetTiledType() === TiledType.Normal || righttop.GetTiledType() === TiledType.Empty);
        const hasRightBottom = rightbottom !== null && (rightbottom.GetTiledType() === TiledType.Normal || rightbottom.GetTiledType() === TiledType.Empty);
    
        if (!((!hasLeft && !hasTop && !hasLeftTop)
            || (!hasLeft && !hasBottom && !hasLeftBottom)
            || (!hasTop && !hasRight && !hasRightTop)
            || (!hasBottom && !hasRight && !hasRightBottom)
            || (hasLeft && hasBottom && hasTop && !hasRight)
            || (hasRight && hasBottom && hasTop && !hasLeft)
            || (hasRight && hasBottom && hasLeft && !hasTop)
            || (hasRight && hasTop && hasLeft && !hasBottom)
            || (hasRight && !hasTop && hasLeft && !hasBottom)
            || (hasTop && !hasRight && hasBottom && !hasLeft))) {
            return;
        }
    
        const normal = tiled as NormalTiled;
        const overCast = normal.m_tiled.getComponentInChildren(TiledOverCastCom).TiledOverCasts[0];
    
        //左上
        if (!hasLeft && !hasTop && !hasLeftTop) {
            Utils.SetNodeActive(overCast.Up_Left, true);
            if (hasRight && !hasRightTop) {
                Utils.SetNodeActive(overCast.Up_Left_HorFill, true);
            }
            if (hasBottom && !hasLeftBottom) {
                Utils.SetNodeActive(overCast.Up_Left_VerFill, true);
            }
        }
        //左下
        if (!hasLeft && !hasBottom && !hasLeftBottom) {
            Utils.SetNodeActive(overCast.Down_Left, true);
            if (hasRight && !hasRightBottom) {
                Utils.SetNodeActive(overCast.Down_Left_HorFill, true);
            }
            if (hasTop && !hasLeftTop) {
                Utils.SetNodeActive(overCast.Down_Left_VerFill, true);
            }
        }
        //右上
        if (!hasTop && !hasRight && !hasRightTop) {
            Utils.SetNodeActive(overCast.Up_Right, true);
            if (hasLeft && !hasLeftTop) {
                Utils.SetNodeActive(overCast.UpRight_HorFill, true);
            }
            if (hasBottom && !hasRightBottom) {
                Utils.SetNodeActive(overCast.UpRight_VerFill, true);
            }
        }
        //右下
        if (!hasBottom && !hasRight && !hasRightBottom) {
            Utils.SetNodeActive(overCast.Down_Right, true);
            if (hasLeft && !hasLeftBottom) {
                Utils.SetNodeActive(overCast.Down_Right_HorFill, true);
            }
            if (hasTop && !hasRightTop) {
                Utils.SetNodeActive(overCast.Down_Right_VerFill, true);
            }
        }
        //填充直线
        //右边
        if (!hasRightBottom && !hasRightTop && !hasRight && hasBottom && hasTop) {
            Utils.SetNodeActive(overCast.LineRight, true);
        }
        //左边
        if (!hasLeftBottom && !hasLeftTop && !hasLeft && hasBottom && hasTop) {
            Utils.SetNodeActive(overCast.LineLeft, true); // Adding the modified line
        }
        //上边
        if (!hasLeftTop && !hasRightTop && !hasTop && hasRight && hasLeft) {
            Utils.SetNodeActive(overCast.LineUp, true);
        }
        //下边
        if (!hasLeftBottom && !hasRightBottom && !hasBottom && hasRight && hasLeft) {
            Utils.SetNodeActive(overCast.LineDown, true);
        }
    }

    public GetTiledByGUID(guid: number)
    {
        return this.m_tiledArray[guid];
    }

    GetTiled(row: number, col: number)
    {
        if (row < 0 || row >= this.m_lvlData.maxRows || col < 0 || col >= this.m_lvlData.maxCols)
        {
            return null;
        }
        return this.m_tiledArray[row * this.m_lvlData.maxCols + col];
    }

    public GetIsCanMove3X2Square(r: number, c: number): boolean {
        return this.IsTiledNeedGen(r, c)
            && this.IsTiledNeedGen(r, c + 2)
            && this.IsTiledNeedGen(r + 1, c + 1)
            && this.isTiledNeedGenAndCanSwitch(r, c + 1)
            && this.isTiledNeedGenAndCanSwitch(r + 1, c + 1);
    }
    
    private IsTiledNeedGen(r: number, c: number): boolean {
        const t = this.GetTiled(r, c);
        return t !== null && t.IsValidTiled() && t.IsNeedGen();
    }
    
    private isTiledNeedGenAndCanSwitch(r: number, c: number): boolean {
        const t = this.GetTiled(r, c);
        return t !== null && t.IsValidTiled() && t.CanGenerateCanSwitchBlocker();
    }

    public GetMatchNumAround(row: number, col: number, id: number, isLevelFirstGenerate: boolean = false): number {
        const curTiled = this.GetTiled(row, col);
        if (curTiled === null) {
            return 0;
        }
    
        if (!isLevelFirstGenerate && (curTiled.CanMoveBlocker === null || !curTiled.CanMoveBlocker.ActiveMatch())) {
            return 0;
        }
        if (id === 0) {
            return 0;
        }
    
        let matches = 0;
        const bottom = curTiled.GetNeighborBottom();
        const top = curTiled.GetNeighborTop();
    
        // Check if the current tiled line direction has enough tiles to match
        if ((bottom?.GetIsMatchAround(id)) ?? false) {
            matches = 1;
            if ((top?.GetIsMatchAround(id)) ?? false) {
                matches++;
                if (matches > 1) {
                    return matches;
                }
    
                const bottomNeighbor = bottom?.GetNeighborBottom();
                if ((bottomNeighbor?.GetIsMatchAround(id)) ?? false) {
                    matches++;
                    if (matches > 1) {
                        return matches;
                    }
                }
            }
    
            matches = 0;
            if ((top?.GetIsMatchAround(id)) ?? false) {
                matches = 1;
                const topNeighbor = top?.GetNeighborTop();
                if ((topNeighbor?.GetIsMatchAround(id)) ?? false) {
                    matches++;
                    return matches;
                }
            }
    
            matches = 0;
    
            // Check if the current tiled horizon direction has enough tiles to match
            const left = curTiled.GetNeighborLeft();
            const right = curTiled.GetNeighborRight();
    
            if ((left?.GetIsMatchAround(id)) ?? false) {
                matches = 1;
                if ((right?.GetIsMatchAround(id)) ?? false) {
                    matches++;
                    if (matches > 1) {
                        return matches;
                    }
    
                    const leftNeighbor = left?.GetNeighborLeft();
                    if ((leftNeighbor?.GetIsMatchAround(id)) ?? false) {
                        matches++;
                        return matches;
                    }
                }
            }
    
            matches = 0;
            if ((right?.GetIsMatchAround(id)) ?? false) {
                matches = 1;
                const rightNeighbor = right?.GetNeighborRight();
                if ((rightNeighbor?.GetIsMatchAround(id)) ?? false) {
                    matches++;
                    return matches;
                }
            }
    
            matches = 0;
    
            const leftBottom = curTiled.GetNeighborLeftBottom();
            const leftTop = curTiled.GetNeighborLeftTop();
            const rightTop = curTiled.GetNeighborRightTop();
            const rightBottom = curTiled.GetNeighborRightBottom();
    
            // Check if it could match to a Rocket
            if (((bottom?.GetIsMatchAround(id)) ?? false) && ((left?.GetIsMatchAround(id)) ?? false) && ((leftBottom?.GetIsMatchAround(id)) ?? false)) {
                matches = 4;
            } else if (((top?.GetIsMatchAround(id)) ?? false) && ((left?.GetIsMatchAround(id)) ?? false) && ((leftTop?.GetIsMatchAround(id)) ?? false)) {
                matches = 4;
            } else if (((top?.GetIsMatchAround(id)) ?? false) && ((right?.GetIsMatchAround(id)) ?? false) && ((rightTop?.GetIsMatchAround(id)) ?? false)) {
                matches = 4;
            } else if (((bottom?.GetIsMatchAround(id)) ?? false) && ((right?.GetIsMatchAround(id)) ?? false) && ((rightBottom?.GetIsMatchAround(id)) ?? false)) {
                matches = 4;
            }
        }
        return matches;
    }

    public FilterRandomID(row: number, col: number): number {
        const exceptColors: number[] = [];
        const count: number = this.ColorLimitList.length;
    
        for (let i = 0; i < count; i++) {
            const matches: number = this.GetMatchNumAround(row, col, this.ColorLimitList[i], true);
    
            if (Game.GetBlockData(this.ColorLimitList[i]).HasAction(FirstActionType.Match) && matches > 1) {
                exceptColors.push(i);
            }
        }
    
        let randColor: number = 0;
    
        do {
            randColor = this.RandomRange(0, count - 1);
        } while (exceptColors.includes(randColor) && exceptColors.length < count);
    
        return this.ColorLimitList[randColor];
    }
    
    public RandomRange(min: number , max: number) {
		var Range = max - min;
		var Rand = Math.random();
		return (min + Math.round(Rand * Range));
	}

    public CheckNeighborId(tiled: Tiled, id: number): boolean {
        const left: NormalTiled = tiled.GetNeighborLeft();
        const right: NormalTiled = tiled.GetNeighborRight();
        const top: NormalTiled = tiled.GetNeighborTop();
        const bottom: NormalTiled = tiled.GetNeighborBottom();
    
        if ((this.IsNeighborTiledSame(left, id) && this.IsNeighborTiledSame(top, id) && this.IsNeighborTiledSame(tiled.GetNeighborLeftTop(), id))
            || (this.IsNeighborTiledSame(left, id) && this.IsNeighborTiledSame(bottom, id) && this.IsNeighborTiledSame(tiled.GetNeighborLeftBottom(), id))
            || (this.IsNeighborTiledSame(right, id) && this.IsNeighborTiledSame(top, id) && this.IsNeighborTiledSame(tiled.GetNeighborRightTop(), id))
            || (this.IsNeighborTiledSame(right, id) && this.IsNeighborTiledSame(bottom, id) && this.IsNeighborTiledSame(tiled.GetNeighborRightBottom(), id))) {
            return true;
        }
    
        return false;
    }
    
    private IsNeighborTiledSame(neighbor: NormalTiled, id: number): boolean {
        if (neighbor != null)
        {
            if (neighbor.CanMoveBlocker != null && neighbor.CanMoveBlocker.ID === id) {
                return true;
            }
        }
    
        return false;
    }
    
    static BlockersIsHasTiled(blockers: Blocker[], guid: number)
    {
        for (let i = 0; i < blockers.length; i++)
        {
            if (blockers[i].SelfTiled.Guid == guid)
            {
                return true;
            }
        }
        return false;
    }

    static TiledsIsHasTiled(tileds: Tiled[], guid: number): boolean {
        for (const tiled of tileds) {
            if (tiled.Guid === guid) {
                return true;
            }
        }
        return false;
    }

    DelayDestroyBlockers(items: Blocker[], destroyMiddle: boolean = true)
    {
        for (var j = 0; j < items.length; j++)
        {
            this.DestroyBlocker(items[j], destroyMiddle);
        }
    }

    DestroyBlocker(blk: Blocker | null, destroyMiddle: boolean = true): void {
        if (blk !== null) {
          const tiled: NormalTiled | null = blk.SelfTiled;
          if (tiled === null) {
            // Console.log("DestroyBlocker id:" + blk.id + " blocker:" + blk.hashCode());
          } else {
            // Console.log("1111 DestroyBlocker id:" + blk.id+" Row:"+tiled.row+" col:"+tiled.col);
            tiled.DestroyBlocker(blk.ID, true, destroyMiddle);
          }
        }
    }
}
