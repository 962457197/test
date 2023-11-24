// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

import Game from "../../../Game";
import { CameraManager } from "../../../tools/CameraManager";
import { Utils } from "../../../tools/Utils";
import { Blocker } from "../../blocker/Blocker";
import { BlockerID } from "../../blocker/BlockerManager";
import { Tiled } from "../../tiledmap/Tiled";
import { TiledMap } from "../../tiledmap/TiledMap";

const {ccclass, property} = cc._decorator;

@ccclass
export default class LineMoveEffectCom extends cc.Component {

    @property(cc.Node)
    end1Node: cc.Node = null;

    @property(cc.Node)
    end2Node: cc.Node = null;

    m_isStart: boolean = false;
    m_isReset: boolean = false;

    m_isArrive1: boolean = false;
    m_isArrive2: boolean = false;
    m_currentPos1: cc.Vec2 = cc.Vec2.ZERO;
    m_currentPos2: cc.Vec2 = cc.Vec2.ZERO;
    m_isArrive1Tiled: boolean = false;
    m_isArrive2Tiled: boolean = false;
    m_startPos: cc.Vec2 = cc.Vec2.ZERO;
    m_end1Pos: cc.Vec2 = cc.Vec2.ZERO;
    m_end1TiledPos: cc.Vec2 = cc.Vec2.ZERO;
    m_end2TiledPos: cc.Vec2 = cc.Vec2.ZERO;
    m_end2Pos: cc.Vec2 = cc.Vec2.ZERO;
    m_end1Distance: number = 0;
    m_end2Distance: number = 0;
    m_matchBlockers: Blocker[] = [];
    m_checkMatchTileds: Tiled[] = [];
    endAction:  ()=> void = null;
    checkMatch: (tiled: Tiled, blockers: Blocker[]) => void = null;
    m_speed: number = 2000;
    m_markTiledList: Tiled[] = [];
    m_spType: BlockerID = BlockerID.none;
    m_originTiled: Tiled = null;
    m_currentTimer: number = 0.02;
    m_offsetIndex: number = 0;

    StartMove(originTiled: Tiled, end1Pos: cc.Vec2, end1TiledPos: cc.Vec2, end2Pos: cc.Vec2, end2TiledPos: cc.Vec2, iconId: number, 
        endAction: ()=> void, checkMatch: (tiled: Tiled, blockers: Blocker[]) => void, spType: BlockerID, markTiledList: Tiled[])
    {
        this.m_originTiled = originTiled;
        this.m_spType = spType;
        if (spType == BlockerID.horizontal)
        {
            this.end1Node.angle = 0;
            this.end2Node.angle = 0;
        }
        else
        {
            this.end1Node.angle = -90;
            this.end2Node.angle = -90;
        }

        this.m_currentPos1 = originTiled.WorldPosition;
        this.m_currentPos2 = originTiled.WorldPosition;
        
        // cc.resources.load("texture/" + Game.GetIconName(iconId), cc.SpriteFrame, (err, data: any) =>
        // {
        //     if (this.end1Icon == null)
        //     {
        //         return;
        //     }

        //     this.end1Icon.spriteFrame = data;
        //     this.end2Icon.spriteFrame = data;
        // });

        this.m_startPos = originTiled.WorldPosition;
        this.m_end1Pos = end1Pos;
        this.m_end1TiledPos = end1TiledPos;
        this.m_end2Pos = end2Pos;
        this.m_end2TiledPos = end2TiledPos;

        this.m_end1Distance = this.m_startPos.sub(end1Pos).magSqr();
        this.m_end2Distance = this.m_startPos.sub(end2Pos).magSqr();

        this.endAction = endAction;
        this.checkMatch = checkMatch;
        this.m_markTiledList = markTiledList;
        this.m_isStart = true;
        this.m_currentTimer = 0.02;
        this.m_offsetIndex = 0;
    }

    update (dt) {

        if (this.m_isArrive1 && this.m_isArrive2)
        {
            return;
        }
        if (!this.m_isStart)
        {
            return;
        }

        this.m_currentTimer -= dt;
        if (this.m_currentTimer <= 0)
        {
            this.m_currentTimer = 0.02;
            this.m_offsetIndex++;
            this.OnCheckMatch(this.m_offsetIndex);
            this.OnCheckMatch(-this.m_offsetIndex);
        }

        if (!this.m_isArrive1)
        {    
            let distance = this.m_currentPos1.sub(this.m_startPos).magSqr();
            if (distance >= this.m_end1Distance)
            {
                this.m_isArrive1 = true;
            }
            else
            {
                if (distance >= this.m_end1TiledPos.sub(this.m_startPos).magSqr())
                {
                    this.m_isArrive1Tiled = true;
                }

                let dir = this.m_end1Pos.sub(this.m_startPos).normalize();
                this.m_currentPos1 = new cc.Vec2(this.m_currentPos1.x + dir.x * this.m_speed * dt, this.m_currentPos1.y + dir.y * this.m_speed * dt);

            }
        }

        if (!this.m_isArrive2)
        {
            let distance = this.m_currentPos2.sub(this.m_startPos).magSqr();
            if (distance >= this.m_end2Distance)
            {
                this.m_isArrive2 = true;
            }
            else
            {
                if (distance >= this.m_end2TiledPos.sub(this.m_startPos).magSqr())
                {
                    this.m_isArrive2Tiled = true;
                }

                let dir = this.m_end2Pos.sub(this.m_startPos).normalize();
                this.m_currentPos2 = new cc.Vec2(this.m_currentPos2.x + dir.x * this.m_speed * dt, this.m_currentPos2.y + dir.y * this.m_speed * dt);
            }
        }

        if (this.m_isArrive1Tiled && this.m_isArrive2Tiled)
        {
            this.ResetMark();
        }

        if (this.m_isArrive1 && this.m_isArrive2)
        {
            this.ResetMark();

            this.m_isStart = false;
            this.endAction();
            this.node.destroy();
        }
    }

    ResetMark()
    {
        if (!this.m_isReset)
        {
            this.m_isReset = true;
            for (let i = 0; i < this.m_markTiledList.length; i++) {
                const element = this.m_markTiledList[i];
                if (element != null)
                {
                    element.Marked = false;
                    element.CheckTriggerFall();
                }
            }
            this.m_markTiledList.length = 0;
        }
    }

    OnCheckMatch(offsetIndex: number)
    {
        let tiled:Tiled = null;
        if (this.m_spType == BlockerID.horizontal)
        {
            tiled = TiledMap.getInstance().GetTiled(this.m_originTiled.Row, this.m_originTiled.Col + offsetIndex);
        }
        else
        {
            tiled = TiledMap.getInstance().GetTiled(this.m_originTiled.Row + offsetIndex, this.m_originTiled.Col);
        }
        
        this.m_matchBlockers.length = 0;
        if (tiled != null && tiled.IsValidTiled())
        {
            if (!this.m_checkMatchTileds.includes(tiled))
            {
                this.m_checkMatchTileds.push(tiled);

                this.checkMatch(tiled, this.m_matchBlockers);
                if (this.m_matchBlockers.length > 0)
                {
                    TiledMap.getInstance().DelayDestroyBlockers(this.m_matchBlockers);
                }
            }
        }
    }
}
