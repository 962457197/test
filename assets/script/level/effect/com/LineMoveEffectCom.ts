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
import { Tiled } from "../../tiledmap/Tiled";
import { TiledMap } from "../../tiledmap/TiledMap";

const {ccclass, property} = cc._decorator;

@ccclass
export default class LineMoveEffectCom extends cc.Component {

    @property(cc.Node)
    end1Node: cc.Node = null;

    @property(cc.Node)
    end2Node: cc.Node = null;

    @property(cc.Sprite)
    end1Icon: cc.Sprite = null;

    @property(cc.Sprite)
    end2Icon: cc.Sprite = null;

    m_isStart: boolean = false;
    m_isReset: boolean = false;

    m_isArrive1: boolean = false;
    m_isArrive2: boolean = false;
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
    m_markTileds: Tiled[] = [];
    endAction:  ()=> void = null;
    checkMatch: (tiled: Tiled, blockers: Blocker[]) => void = null;
    m_speed: number = 1000;

    StartMove(originTiled: Tiled, end1Pos: cc.Vec2, end1TiledPos: cc.Vec2, end2Pos: cc.Vec2, end2TiledPos: cc.Vec2, iconId: number, endAction: ()=> void, checkMatch: (tiled: Tiled, blockers: Blocker[]) => void)
    {
        cc.resources.load("texture/" + Game.GetIconName(iconId), cc.SpriteFrame, (err, data: any) =>
        {
            if (this.end1Icon == null)
            {
                return;
            }

            this.end1Icon.spriteFrame = data;
            this.end2Icon.spriteFrame = data;
        });

        this.m_startPos = originTiled.WorldPosition;
        this.m_end1Pos = end1Pos;
        this.m_end1TiledPos = end1TiledPos;
        this.m_end2Pos = end2Pos;
        this.m_end2TiledPos = end2TiledPos;

        this.m_end1Distance = this.m_startPos.sub(end1Pos).magSqr();
        this.m_end2Distance = this.m_startPos.sub(end2Pos).magSqr();


        this.endAction = endAction;
        this.checkMatch = checkMatch;
        this.m_isStart = true;
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

        if (!this.m_isArrive1)
        {
            let curPos = this.end1Node.convertToWorldSpaceAR(cc.Vec2.ZERO);
            if (!this.m_isArrive1Tiled)
            {
                this.OnCheckMatch(curPos);
            }
            
            let distance = curPos.sub(this.m_startPos).magSqr();
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
                let nextPos = new cc.Vec2(this.end1Node.x + dir.x * this.m_speed * dt, this.end1Node.y + dir.y * this.m_speed * dt);
                this.end1Node.setPosition(nextPos)
            }
        }

        if (!this.m_isArrive2)
        {
            let curPos = this.end2Node.convertToWorldSpaceAR(cc.Vec2.ZERO);
            if (!this.m_isArrive2Tiled)
            {
                this.OnCheckMatch(curPos);
            }
            let distance = curPos.sub(this.m_startPos).magSqr();
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
                let nextPos = new cc.Vec2(this.end2Node.x + dir.x * this.m_speed * dt, this.end2Node.y + dir.y * this.m_speed * dt);
                this.end2Node.setPosition(nextPos)
            }
        }

        if (this.m_isArrive1Tiled && this.m_isArrive2Tiled && !this.m_isReset)
        {
            this.m_isReset = true;
            for (let i = 0; i < this.m_markTileds.length; i++) {
                const element = this.m_markTileds[i];
                if (element != null)
                {
                    element.Marked = false;
                    element.CheckTriggerFall();
                }
            }
            this.m_markTileds.length = 0;
        }

        if (this.m_isArrive1 && this.m_isArrive2)
        {
            this.m_isStart = false;
            this.endAction();
            this.node.destroy();
        }
    }

    OnCheckMatch(curPos: cc.Vec2)
    {
        const { row, col } = Utils.GetTiledRowAndCol(curPos);
        let tiled = TiledMap.getInstance().GetTiled(row, col);
        this.m_matchBlockers.length = 0;
        if (tiled != null)
        {
            if (!this.m_markTileds.includes(tiled))
            {
                this.m_markTileds.push(tiled);

                this.checkMatch(tiled, this.m_matchBlockers);
                if (this.m_matchBlockers.length > 0)
                {
                    TiledMap.getInstance().DelayDestroyBlockers(this.m_matchBlockers);
                }
            }
        }
    }
}
