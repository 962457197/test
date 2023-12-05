// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

import { Direction, LevelScriptableData, LevelTiledData, TiledType } from "../data/LevelScriptableData";
import { EntryTiled, NormalTiled, Tiled } from "./Tiled";
import TiledOverCastCom from "./TiledOverCastCom";
import { Utils } from "../../tools/Utils";
import Game from "../../Game";
import { FirstActionType } from "../../table/BlockTable";
import { ColorManager } from "../blocker/ColorManager";
import { Blocker } from "../blocker/Blocker";
import { DropDataBase, DropDataFactory, TiledMapDropDataSpawner } from "../drop/TiledMapDropDataSpawner";
import { BlockSubType, BlockType, BlockerID } from "../blocker/BlockerManager";

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

    public static MAX_COL: number = 18;
    public static MAX_ROW: number = 18;
    public static CC_OFFSET = 100;
    public static ENTRY_GUID_OFFSET: number = 1000;

    m_lvlData: LevelScriptableData = null;
    m_tiledMapRoot: cc.Node = null;
    m_blockerRoot: cc.Node = null;
    m_effectRoot: cc.Node = null;
    TiledArray: Tiled[] = null;
    m_enterTiledArray: EntryTiled[] = null;

    ColorLimitList: number[] = [];
    DropDataEndInfo: Map<number, boolean> = new Map<number, boolean>();
    DropLimitInfo: Map<number, Map<number, number>> = new Map<number, Map<number, number>>();
    DropSpawner: TiledMapDropDataSpawner = new TiledMapDropDataSpawner();
    CurrentLevelLimit: number;
    get UseStep()
    {
        return this.m_lvlData.limit - this.CurrentLevelLimit;
    }
    m_destoryedTiledList: number[] = [];
    m_destroyedTopBlockers: Blocker[] = [];
    m_squareTargetTileds: number[] = [];

    SameColorTriggeringCount: number = 0;

    get MapRootPosition()
    {
        let worldPos = this.m_tiledMapRoot.convertToWorldSpaceAR(cc.Vec2.ZERO);
        return worldPos;
    }

    get TotalMoves()
    {
        return this.m_lvlData.limit;
    }

    get SawmillBlockDatas()
    {
        return this.m_lvlData.SawmillList;
    }

    get RomanColumnBlockDatas()
    {
        return this.m_lvlData.RomanColumnList;
    }

    public OnCreate(levelData: LevelScriptableData, tiledMapRoot: cc.Node, tiledRoot: cc.Node, blockerRoot: cc.Node): void 
    {
        this.InitLevelData(levelData);
        this.m_tiledMapRoot = tiledMapRoot;
        this.m_blockerRoot = blockerRoot;

        let posx = -((this.m_lvlData.maxCols / 2 * Tiled.WIDTH) - Tiled.WIDTH / 2);
        let posy = (this.m_lvlData.maxRows / 2 * Tiled.HEIGHT) - Tiled.HEIGHT / 2;

        if (this.m_lvlData.realCols % 2 == 1)
        {
            posx += 0.5 * Tiled.WIDTH;
        }
        if (this.m_lvlData.realRows % 2 == 1)
        {
            posy -= 0.5 * Tiled.HEIGHT;
        }

        // if (this.m_lvlData.realRows !== 0 && this.m_lvlData.realCols !== 0) {
        //     const rem_X: number = (this.m_lvlData.maxCols - this.m_lvlData.realCols) % 2;
        //     if (rem_X === 1) {
        //         posx += ((this.m_lvlData.maxCols - this.m_lvlData.realCols) * 0.5 * Tiled.WIDTH);
        //     }
        //     const rem_Y: number = (this.m_lvlData.maxRows - this.m_lvlData.realRows) % 2;
        //     if (rem_Y === 1) {
        //         posy -= ((this.m_lvlData.maxRows - this.m_lvlData.realRows) * 0.5 * Tiled.HEIGHT);
        //     }
        // }

        this.m_tiledMapRoot.setPosition(posx, posy);

        this.TiledArray = new Array<Tiled>(TiledMap.MAX_COL * TiledMap.MAX_ROW);
        this.m_enterTiledArray = new Array<EntryTiled>(TiledMap.MAX_COL * TiledMap.MAX_ROW);
        
        for (let row = 0; row < this.m_lvlData.maxRows; row++) {
            for (let col = 0; col < this.m_lvlData.maxCols; col++) {
                const index = row * TiledMap.MAX_COL + col;
                const tiledData: LevelTiledData = this.m_lvlData.tiledData[index];
                const idx: number = row * this.m_lvlData.maxCols + col;

                this.TiledArray[idx] = new NormalTiled();
                this.TiledArray[idx].Create(idx, tiledData, tiledRoot, row, col, "NormalTiled_" + row + "_" + col);
        
                if (tiledData.type !== TiledType.None && tiledData.IsEnterPoint) {

                    const enter = new EntryTiled();
                    this.m_enterTiledArray[idx] = enter;
                    this.m_enterTiledArray[idx].Create(idx, tiledData, tiledRoot, row, col, "EntryTiled_" + row + "_" + col);

                    this.m_enterTiledArray[idx].PrevTiledGuid = -1;
                    this.m_enterTiledArray[idx].NextTiledGuid = idx;
                    this.TiledArray[idx].EnterPoint = this.m_enterTiledArray[idx];
                }
    
                (this.TiledArray[idx] as NormalTiled).GenerateBlocker();
            }
        }
    }

    InitLevelData(levelData: LevelScriptableData) {
        this.m_lvlData = levelData;
        this.CurrentLevelLimit = this.m_lvlData.limit;

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

        this.BuildDropData();
        this.m_squareTargetTileds.length = 0;
        this.m_squareTargetTileds.push(...this.m_lvlData.squareTargetList);
        this.InitTotalTargetCount();
    }

    GetSquareTargetTiled() : Tiled
    {
        if (this.m_squareTargetTileds.length > 0)
        {
            let idx = this.RandomRange(0, this.m_squareTargetTileds.length - 1);
            let guid = this.m_squareTargetTileds[idx];
            this.m_squareTargetTileds.splice(idx, 1);
            return this.GetTiledByGUID(guid);
        }

        let tempLst = [];
        for (let index = 0; index < this.TiledArray.length; index++) {
            const element = this.TiledArray[index];
            if (element.IsValidTiled())
            {
                tempLst.push(element);
            }
        }

        let idx = this.RandomRange(0, tempLst.length - 1);
        return tempLst[idx];
    }

    BuildDropData(): void {
        this.DropDataEndInfo.clear();
        this.DropLimitInfo.clear();
    
        for (let i = 0; i < this.m_lvlData.dropDataList.length; i++) {
            if (this.m_lvlData.dropDataList[i].id > 0 && this.m_lvlData.dropDataList[i].onceCount > 0 && this.m_lvlData.dropDataList[i].spawn > 0) {
                const data: DropDataBase | null = DropDataFactory.BuildLevelDropData(this.m_lvlData.dropDataList[i]);
                if (data !== null) {
                    this.DropSpawner.Add(data);
                    this.DropDataEndInfo.set(data.id, false);
                    for (let j = 0; j < data.enterlst.length; j++) {
                        if (this.DropLimitInfo.has(data.enterlst[j])) {
                            const info: Map<number, number> | undefined = this.DropLimitInfo.get(data.enterlst[j]);
                            if (info !== undefined) {
                                if (info.has(data.id)) {
                                    info.set(data.id, 0);
                                } else {
                                    info.set(data.id, 0);
                                }
                            } else {
                                const info = new Map<number, number>();
                                info.set(data.id, 0);
                                this.DropLimitInfo.set(data.enterlst[j], info);
                            }
                        }
                    }
                }
            }
        }
    
        for (let i = 0; i < this.m_lvlData.DropColorDataList.length; i++) {
            const data = DropDataFactory.BuildLevelDropColorData(this.m_lvlData.DropColorDataList[i]);
            if (data !== null) {
                this.DropSpawner.Add(data);
            }
        }
    }
    

    magicFlag: boolean = false;
    SetTiledData()
    {
        for (let i = 0; i < this.TiledArray.length; i++)
        {
            if (!this.TiledArray[i].IsValidTiled())
            {
                continue;
            }

            (this.TiledArray[i] as NormalTiled).GenerateMultiTiledBlocker();
        }

        for (let i = 0; i < this.TiledArray.length; i++)
        {
            if (!this.TiledArray[i].IsValidTiled())
            {
                continue;
            }

            var r = this.TiledArray[i].Row;
            var c = this.TiledArray[i].Col;

            if (!this.magicFlag && this.GetIsCanMove3X2Square(r, c))
            {
                (this.TiledArray[i] as NormalTiled).GenerateCanMoveCheckMatch();
                var baseId = this.TiledArray[i].CanMoveBlocker.Color;
                let matches = this.GetMatchNumAround(r, c + 2, baseId, true);
                let matches2 = this.GetMatchNumAround(r + 1, c + 1, baseId, true);
                if (matches <= 1 && matches2 <= 1)
                {
                    (this.GetTiled(r, c + 2) as NormalTiled).GenerateCanMove(baseId);
                    (this.GetTiled(r + 1, c + 1) as NormalTiled).GenerateCanMove(baseId);
                    this.magicFlag = true;
                }
            }
            else
            {
                (this.TiledArray[i] as NormalTiled).GenerateCanMoveCheckMatch();
            }

            let next = this.GetTiled(this.TiledArray[i].Row + 1, this.TiledArray[i].Col);
            if (null != next && next.IsValidTiled())
            {
                if (null == this.TiledArray[i].GetNextTiled())
                    this.TiledArray[i].NextTiledGuid = next.Guid;
                if (null == next.GetPrevTiled())
                    next.PrevTiledGuid = i;
            }
        }

        for (let i = 0; i < this.TiledArray.length; i++)
        {
            // 将tiled出现 NextTiled或PrevTiled循环指向置空
            if (this.TiledArray[i].GetPrevTiled() != null && this.TiledArray[i].GetPrevTiled().GetPrevTiled() != null
                && this.TiledArray[i].GetPrevTiled().PrevTiledGuid == this.TiledArray[i].Guid)
            {
                this.TiledArray[i].GetPrevTiled().PrevTiledGuid = -1;
                this.TiledArray[i].PrevTiledGuid = -1;
            }
            if (this.TiledArray[i].GetNextTiled() != null && this.TiledArray[i].GetNextTiled().GetNextTiled() != null
                && this.TiledArray[i].GetNextTiled().NextTiledGuid == this.TiledArray[i].Guid)
            {
                this.TiledArray[i].GetNextTiled().NextTiledGuid = -1;
                this.TiledArray[i].NextTiledGuid = -1;
            }

            if (this.TiledArray[i].GetTiledType() == TiledType.None)
            {
                this.SetInEdge(this.TiledArray[i]);
            }
            else
            {
                this.SetOutEdge(this.TiledArray[i]);
            }
        }
    }

    SetInEdge(tiled: Tiled): void {
        const top = tiled.GetNeighborTop();
        const bottom = tiled.GetNeighborBottom();
        const left = tiled.GetNeighborLeft();
        const right = tiled.GetNeighborRight();
        const hasTop = top != null && (top.GetTiledType() == TiledType.Normal || top.GetTiledType() == TiledType.Empty);
        const hasBottom = bottom != null && (bottom.GetTiledType() == TiledType.Normal || bottom.GetTiledType() == TiledType.Empty);
        const hasLeft = left != null && (left.GetTiledType() == TiledType.Normal || left.GetTiledType() == TiledType.Empty);
        const hasRight = right != null && (right.GetTiledType() == TiledType.Normal || right.GetTiledType() == TiledType.Empty);
    
        const nothasTop = top != null && top.GetTiledType() == TiledType.None;
        const nothasBottom = bottom != null && bottom.GetTiledType() == TiledType.None;
        const nothasLeft = left != null && left.GetTiledType() == TiledType.None;
        const nothasRight = right != null && right.GetTiledType() == TiledType.None;
    
        const lefttop = tiled.GetNeighborLeftTop();
        const leftbottom = tiled.GetNeighborLeftBottom();
        const righttop = tiled.GetNeighborRightTop();
        const rightbottom = tiled.GetNeighborRightBottom();
        const hasLeftTop = lefttop != null && (lefttop.GetTiledType() == TiledType.Normal || lefttop.GetTiledType() == TiledType.Empty);
        const hasLeftBottom = leftbottom != null && (leftbottom.GetTiledType() == TiledType.Normal || leftbottom.GetTiledType() == TiledType.Empty);
        const hasRightTop = righttop != null && (righttop.GetTiledType() == TiledType.Normal || righttop.GetTiledType() == TiledType.Empty);
        const hasRightBottom = rightbottom != null && (rightbottom.GetTiledType() == TiledType.Normal || rightbottom.GetTiledType() == TiledType.Empty);
    
        if (!((hasTop && hasLeft)
            || (hasTop && hasRight)
            || (hasBottom && hasLeft)
            || (hasBottom && hasRight))) {
            return;
        }
    
        const normal = tiled as NormalTiled;
        const overCast = normal.OverCastCom.TiledOverCasts[1];
        if (overCast == null)
        {
            return;
        }
    
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
        const hasTop = top != null && (top.GetTiledType() == TiledType.Normal || top.GetTiledType() == TiledType.Empty);
        const hasBottom = bottom != null && (bottom.GetTiledType() == TiledType.Normal || bottom.GetTiledType() == TiledType.Empty);
        const hasLeft = left != null && (left.GetTiledType() == TiledType.Normal || left.GetTiledType() == TiledType.Empty);
        const hasRight = right != null && (right.GetTiledType() == TiledType.Normal || right.GetTiledType() == TiledType.Empty);
    
        const lefttop = tiled.GetNeighborLeftTop();
        const leftbottom = tiled.GetNeighborLeftBottom();
        const righttop = tiled.GetNeighborRightTop();
        const rightbottom = tiled.GetNeighborRightBottom();
        const hasLeftTop = lefttop != null && (lefttop.GetTiledType() == TiledType.Normal || lefttop.GetTiledType() == TiledType.Empty);
        const hasLeftBottom = leftbottom != null && (leftbottom.GetTiledType() == TiledType.Normal || leftbottom.GetTiledType() == TiledType.Empty);
        const hasRightTop = righttop != null && (righttop.GetTiledType() == TiledType.Normal || righttop.GetTiledType() == TiledType.Empty);
        const hasRightBottom = rightbottom != null && (rightbottom.GetTiledType() == TiledType.Normal || rightbottom.GetTiledType() == TiledType.Empty);
    
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
        const overCast = normal.OverCastCom.TiledOverCasts[0];
        if (overCast == null)
        {
            return;
        }

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
        if (guid < 0)
        {
            return null;
        }
        return this.TiledArray[guid];
    }

    GetTiled(row: number, col: number)
    {
        if (row < 0 || row >= this.m_lvlData.maxRows || col < 0 || col >= this.m_lvlData.maxCols)
        {
            return null;
        }
        let index = row * this.m_lvlData.maxCols + col;
        if (index >= this.TiledArray.length)
        {
            return null;
        }
        return this.TiledArray[index];
    }

    public GetIsCanMove3X2Square(r: number, c: number): boolean {
        return this.IsTiledNeedGen(r, c)
            && this.IsTiledNeedGen(r, c + 2)
            && this.IsTiledNeedGen(r + 1, c + 1)
            && this.isTiledNeedGenAndCanSwitch(r, c + 1)
            && this.isTiledNeedGenAndCanSwitch(r + 1, c + 1);
    }
    
    private IsTiledNeedGen(r: number, c: number): boolean {
        const t = this.GetTiled(r, c) as NormalTiled;
        return t != null && t.IsValidTiled() && t.IsNeedGen();
    }
    
    private isTiledNeedGenAndCanSwitch(r: number, c: number): boolean {
        const t = this.GetTiled(r, c) as NormalTiled;
        return t != null && t.IsValidTiled() && t.CanGenerateCanSwitchBlocker();
    }

    public GetMatchNumAround(row: number, col: number, id: number, isLevelFirstGenerate: boolean = false, isNeedRecordResult: boolean = false): number {
        const curTiled = this.GetTiled(row, col);
    
        if (curTiled == null) {
            return 0;
        }
    
        if (!isLevelFirstGenerate && (curTiled.CanMoveBlocker === null || !curTiled.CanMoveBlocker.ActiveMatch())) {
            return 0;
        }
    
        if (id === 0) {
            return 0;
        }
    
        let matches = 0;
        const bottom = curTiled.GetNeighborBottom() as NormalTiled;
        const top = curTiled.GetNeighborTop() as NormalTiled;
    
        if ((bottom?.GetIsMatchAround(id) ?? false)) {
            matches = 1;
            if ((top?.GetIsMatchAround(id) ?? false)) {
                matches++;
            }
            if (matches > 1) {
                // if (isNeedRecordResult) {
                //     this.TryAddToDefaultMatchList(bottom, curTiled, top);
                // }
                return matches;
            }
            const bottomNeighbor = bottom?.GetNeighborBottom() as NormalTiled;
            if ((bottomNeighbor?.GetIsMatchAround(id) ?? false)) {
                ++matches;
            }
            
            if (matches > 1) {
                // if (isNeedRecordResult) {
                //     this.TryAddToDefaultMatchList(bottomNeighbor, bottom, curTiled);
                // }
                // DebugView.log("shuffle match find on bottom bottom");
                return matches;
            }
        }

        matches = 0;
        if (top?.GetIsMatchAround(id) ?? false)
        {
            matches = 1;
            let topNeighbor = top?.GetNeighborTop() as NormalTiled;
            if (topNeighbor?.GetIsMatchAround(id) ?? false)
            {
                //DebugView.log("shuffle match find on top top");
                ++matches;
                // if (isNeedRecordResult)
                // {
                //     TryAddToDefaultMatchList(topNeighbor, top, curTiled);
                // }
                return matches;
            }
        }

        matches = 0;
        const left = curTiled.GetNeighborLeft() as NormalTiled;
        const right = curTiled.GetNeighborRight() as NormalTiled;
    
        if ((left?.GetIsMatchAround(id) ?? false)) {
            matches = 1;
            if ((right?.GetIsMatchAround(id) ?? false)) {
                matches++;
            }
            if (matches > 1) {
                // if (isNeedRecordResult) {
                //     this.TryAddToDefaultMatchList(left, curTiled, right);
                // }
                // DebugView.log("shuffle match find on left right");
                return matches;
            }
            const leftNeighbor = left?.GetNeighborLeft() as NormalTiled;
            if ((leftNeighbor?.GetIsMatchAround(id) ?? false)) {
                ++matches;
                // if (isNeedRecordResult) {
                //     this.TryAddToDefaultMatchList(leftNeighbor, left, curTiled);
                // }
                return matches;
            }
        }

        matches = 0;
        if (right?.GetIsMatchAround(id) ?? false)
        {
            matches = 1;
            let rightNeighbor = right?.GetNeighborRight() as NormalTiled;
            if (rightNeighbor?.GetIsMatchAround(id) ?? false)
            {
                ++matches;
                // if (isNeedRecordResult)
                // {
                //     TryAddToDefaultMatchList(rightNeighbor, right, curTiled);
                // }
                return matches;
            }
        }

        matches = 0;
        const rightTop = curTiled.GetNeighborRightTop() as NormalTiled;
        const rightBottom = curTiled.GetNeighborRightBottom() as NormalTiled;
        const leftBottom = curTiled.GetNeighborLeftBottom() as NormalTiled;
        const leftTop = curTiled.GetNeighborLeftTop() as NormalTiled;
    
        if ((bottom?.GetIsMatchAround(id) ?? false) && (left?.GetIsMatchAround(id) ?? false) && (leftBottom?.GetIsMatchAround(id) ?? false)) {
            matches = 4;
            // if (isNeedRecordResult) {
            //     this.TryAddToDefaultMatchList(bottom, left, leftBottom, curTiled);
            // }
        } else if ((top?.GetIsMatchAround(id) ?? false) && (left?.GetIsMatchAround(id) ?? false) && (leftTop?.GetIsMatchAround(id) ?? false)) {
            matches = 4;
            // if (isNeedRecordResult) {
            //     this.TryAddToDefaultMatchList(top, left, leftTop, curTiled);
            // }
        } else if ((top?.GetIsMatchAround(id) ?? false) && (right?.GetIsMatchAround(id) ?? false) && (rightTop?.GetIsMatchAround(id) ?? false)) {
            matches = 4;
            // if (isNeedRecordResult) {
            //     this.TryAddToDefaultMatchList(top, right, rightTop, curTiled);
            // }
        } else if ((bottom?.GetIsMatchAround(id) ?? false) && (right?.GetIsMatchAround(id) ?? false) && (rightBottom?.GetIsMatchAround(id) ?? false)) {
            matches = 4;
            // if (isNeedRecordResult) {
            //     this.TryAddToDefaultMatchList(bottom, right, rightBottom, curTiled);
            // }
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

    RandomID()
    {
        let idx = this.RandomRange(0, this.ColorLimitList.length - 1);
        return this.ColorLimitList[idx];
    }
    
    public RandomRange(min: number , max: number) {
		var Range = max - min;
		var Rand = Math.random();
		return (min + Math.round(Rand * Range));
	}

    public CheckNeighborId(tiled: Tiled, id: number): boolean {
        const left: NormalTiled = tiled.GetNeighborLeft() as NormalTiled;
        const right: NormalTiled = tiled.GetNeighborRight() as NormalTiled;
        const top: NormalTiled = tiled.GetNeighborTop() as NormalTiled;
        const bottom: NormalTiled = tiled.GetNeighborBottom() as NormalTiled;
    
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

    CheckRecycleBlocker(tiled: Tiled)
    {
        return false;
    }

    public ResetDestroyedTiledList(): void {
        this.m_destoryedTiledList.length = 0;
    }
    
    public AddDestroyedTiled(tiled: Tiled): void {
        if (tiled === null || !tiled.IsValidTiled()) {
            return;
        }
        this.m_destoryedTiledList.push(tiled.Guid);
    }

    public FindDestroyedTiled(tiled: Tiled): boolean {
        if (tiled === null || !tiled.IsValidTiled()) {
            return true;
        }
        for (let i = 0; i < this.m_destoryedTiledList.length; i++) {
            if (this.m_destoryedTiledList[i] === tiled.Guid) {
                return true;
            }
        }
        return false;
    }    

    public DestroyTopAndMiddleBlockers(items: Blocker[]): void {
        this.m_destroyedTopBlockers.length = 0;
        for (let j = 0; j < items.length; j++) {
            if (items[j].SelfTiled.DestroyTopAndMiddleBlockers(items[j].ID, true)) {
                this.m_destroyedTopBlockers.push(items[j]);
            }
        }
        for (let i = 0; i < this.m_destroyedTopBlockers.length; i++) {
            items.splice(items.indexOf(this.m_destroyedTopBlockers[i]), 1);
        }
        this.ResetDestroyedTiled();
    }

    public ResetDestroyedTiled(): void {
        this.ResetDestroyedTiledList();
    }

    DelayDestroyBlockers(items: Blocker[], destroyMiddle: boolean = true, triggerEffect = true)
    {
        if (items == null || items.length == 0)
        {
            return;
        }
        for (var j = 0; j < items.length; j++)
        {
            var tempBlocker = items[j];
            if (tempBlocker == null)
            {
                continue;
            }

            this.DestroyBlocker(tempBlocker, destroyMiddle, triggerEffect);
        }

        if (destroyMiddle)
        {
            this.ResetDestroyedTiled();
        }
    }

    DestroyBlocker(blk: Blocker | null, destroyMiddle: boolean = true, triggerEffect = false): void {
        if (blk != null) {
          const tiled = blk.SelfTiled;
          if (tiled != null) {
            if (triggerEffect && blk.TableData.Data.SubType == BlockSubType.Special)
            {
                blk.OnTriggerEffect();
            }
            else
            {
                tiled.DestroyBlocker(blk.ID, true, destroyMiddle);
            }
          }
        }
    }

    GetTiledsByBaseID(baseid: number, lst: Tiled[]): Tiled[] {
        for (let i = 0; i < this.TiledArray.length; i++) {
          const currentTiled = this.TiledArray[i];
          if (
            currentTiled.CanMoveBlocker !== null &&
            !currentTiled.CanMoveBlocker.IsGreedyMonster() &&
            !currentTiled.CanMoveBlocker.IsMagician() &&
            !currentTiled.CanMoveBlocker.Falling &&
            currentTiled.CanMoveBlocker.Color === baseid &&
            !currentTiled.CanMoveBlocker.IsNoColor() &&
            currentTiled.CanMoveBlocker.IsNotTriggerMatched() &&
            !currentTiled.CanMoveBlocker.IsBoxingGlove()
          ) {
            const toptopBlocker = currentTiled.TopTopBlocker();
            if (toptopBlocker !== null) {
              continue;
            }
    
            const topBlocker = currentTiled.TopBlocker();
            if (
              topBlocker !== null &&
              (!topBlocker.IsNotTriggerMatched() || topBlocker.TableData.Data.SubType === BlockSubType.HideMiddle)
            ) {
              continue;
            }
    
            lst.push(currentTiled);
          }
        }
        return lst;
      }
    
      GetBlocksByBaseID(baseid: number = 0): Blocker[] {
        const result: Blocker[] = [];
        for (let i = 0; i < this.TiledArray.length; i++) {
          if (!this.TiledArray[i].IsSquareTarget) {
            this.CheckCanMoveBlockerColor(this.TiledArray[i], baseid, result);
          }
        }
        return result;
      }

      CheckCanMoveBlockerColor(tiled: Tiled, baseid: number, lst: Blocker[] | null = null): boolean {
        if (
          tiled.CanMoveBlocker !== null &&
          !tiled.CanMoveBlocker.Falling &&
          tiled.CanMoveBlocker.Color > 0 &&
          (baseid === 0 || tiled.CanMoveBlocker.Color === baseid) &&
          !tiled.CanMoveBlocker.IsNoColor() &&
          tiled.CanMoveBlocker.IsNotTriggerMatched() &&
          !(tiled.CanMoveBlocker.IsMagician() && tiled.CanMoveBlocker.PassiveMatch())
        ) {
          const blocker = tiled.TopTopBlocker();
          if (blocker !== null) {
            return false;
          }
    
          const matchBlocker = tiled.MatchBlocker;
          if (
            matchBlocker !== null &&
            (!matchBlocker.IsNotTriggerMatched() || matchBlocker.TableData.Data.SubType === BlockSubType.HideMiddle)
          ) {
            return false;
          }
    
          if (lst !== null) {
            lst.push(matchBlocker);
          }
          return true;
        }
    
        return false;
      }

      m_colorCounts: { [key: number]: number } = {};

      GetMostBaseID(): number {
          this.m_colorCounts = {};
  
          for (let i = 0; i < this.TiledArray.length; i++) {
              const tiled: Tiled = this.TiledArray[i];
  
              if (
                  tiled.CanMoveBlocker !== null &&
                  !tiled.CanMoveBlocker.Falling &&
                  !tiled.CanMoveBlocker.MarkMatch &&
                  (tiled.CanMoveBlocker.TableData.Data.Type === BlockType.BaseBlock)
                //     || (tiled.CanMoveBlocker instanceof JellyBlocker &&
                //           ColorManager.IsBaseColor(tiled.CanMoveBlocker.Color))) &&
                //   (!tiled.CanMoveBlocker instanceof ChameleonBlocker ||
                //       !tiled.CanMoveBlocker.IsNeverChanged() ) 
              ) {
                  const blocker: Blocker = this.TiledArray[i].TopTopBlocker();
  
                  if (blocker !== null) {
                      continue;
                  }
  
                  const topBlocker: Blocker = this.TiledArray[i].TopBlocker();
  
                  if (
                      topBlocker !== null &&
                      (!topBlocker.IsNotTriggerMatched() ||
                          topBlocker.TableData.Data.SubType === BlockSubType.HideMiddle)
                  ) {
                      continue;
                  }
  
                  const key: number = tiled.CanMoveBlocker.Color;
  
                  if (this.m_colorCounts[key] !== undefined) {
                      this.m_colorCounts[key]++;
                  } else {
                      this.m_colorCounts[key] = 1;
                  }
              }
          }
  
          let num: number = 0;
          let id: number = 0;
  
          for (const key in this.m_colorCounts) {
              if (this.m_colorCounts.hasOwnProperty(key)) {
                  const value: number = this.m_colorCounts[key];
  
                  if (value > num) {
                      num = value;
                      id = parseInt(key);
                  }
              }
          }
  
          if (id > 0) {
              return id;
          }
  
          return -1;
    }

    static QuickSortTildByGuid(list: Tiled[], low: number, high: number): void {
        if (high <= low) {
            return;
        }

        let i: number = low;
        let j: number = high + 1;
        const key: number = list[low].Guid;

        while (true) {
            while (list[++i].Guid < key) {
                if (i === high) {
                    break;
                }
            }

            while (list[--j].Guid > key) {
                if (j === low) {
                    break;
                }
            }

            if (i >= j) {
                break;
            }

            const vaule: Tiled = list[i];
            list[i] = list[j];
            list[j] = vaule;
        }

        const temp: Tiled = list[low];
        list[low] = list[j];
        list[j] = temp;

        TiledMap.QuickSortTildByGuid(list, low, j - 1);
        TiledMap.QuickSortTildByGuid(list, j + 1, high);
    }

    GetRandomLineBlocker()
    {
        let random = this.RandomRange(0, 1);
        if (random == 0)
        {
            return BlockerID.horizontal;
        }
        return BlockerID.vertical;
    }

    InitTotalTargetCount()
    {
        for (let i = 0; i < this.m_lvlData.targetList.length; i++) {
            const element = this.m_lvlData.targetList[i];
            element.RealCount = element.count;
            this.TotalTargetCount += element.count;
        }
    }

    TotalTargetCount = 0;
    CheckNeedDecrTargetCount(blockerID: BlockerID)
    {
        for (let i = 0; i < this.m_lvlData.targetList.length; i++) {
            const element = this.m_lvlData.targetList[i];
            if (element.type == blockerID && element.RealCount > 0)
            {
                element.RealCount--;
                this.TotalTargetCount--;
                break;
            }
        }
    }
}
