// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

import Game from "../../../Game";
import { AudioManager } from "../../../tools/AudioManager";
import { TimerData, TimerManager, TimerType } from "../../../tools/TimerManager";
import { Utils } from "../../../tools/Utils";
import BaseBlockerCom from "../../blocker/BaseBlockerCom";
import { BlockSubType } from "../../blocker/BlockerManager";
import { Tiled } from "../../tiledmap/Tiled";
import { TiledMap } from "../../tiledmap/TiledMap";
import { EffectType } from "../EffectController";
import SquareFlyEffectCom from "./SquareFlyEffectCom";

const {ccclass, property} = cc._decorator;

class FlyData {
    start: cc.Vec3;
    targetHandle: cc.Vec3;
    target: cc.Vec3;
    startHandle: cc.Vec3;
    distance: number;
    speed: number;

    constructor() {
        this.start = cc.Vec3.ZERO;
        this.targetHandle = cc.Vec3.ZERO;
        this.target = cc.Vec3.ZERO;
        this.startHandle = cc.Vec3.ZERO;
        this.distance = 0;
        this.speed = 0;
    }

    reset(): void {
        this.start = cc.Vec3.clone(cc.Vec3.ZERO);
        this.targetHandle = cc.Vec3.clone(cc.Vec3.ZERO);
        this.target = cc.Vec3.clone(cc.Vec3.ZERO);
        this.startHandle = cc.Vec3.clone(cc.Vec3.ZERO);
        this.distance = 0;
        this.speed = 0;
    }
}

@ccclass
export default class SquareFlyCom extends cc.Component {

    @property(cc.Node)
    Dynamic_01: cc.Node = null;

    @property(cc.Node)
    Dynamic_02: cc.Node = null;

    @property(cc.Node)
    Dynamic_03: cc.Node = null;

    @property(cc.Animation)
    Anim: cc.Animation = null;

    m_flyData: FlyData = new FlyData();
    m_targetBlockerPos: cc.Vec3;
    m_distCovered: number = 0;
    m_preTimePer: number = 0;
    m_isOrigin: any = false;
    m_IsStartPlayAni: boolean = false;
    m_moveRealTime: number = 0;

    StartHandlePosPer:number = 0;
    StartHandleOffsetPer: number = 0.3;
    TargetHandlePosPer: number = 0.3;
    TargetHandleOffsetPer: number = 0.3;

    ReChooseTargetTimeReducePer: number = 0;
    ReChooseTargetMaxSpeed: number = 0;
    MoveTimeBase: number = 0.95;
    MoveMintime: number = 0.84;
    MoveMaxTime: number = 1.1;
    MoveIntervalTime: number = 0.1;
    m_targetTiled: Tiled = null;
    m_indexNumber: number = 0;
    ArrivedAction: (tiled: Tiled) => void = null;
    m_squareFlyEffectCom : SquareFlyEffectCom = null;
    m_audioId: number = 0;

    CalculateBezierPoint(p0: cc.Vec3, p1: cc.Vec3, p2: cc.Vec3, p3: cc.Vec3, t: number): cc.Vec3 {
        const u = 1 - t;
        const tt = t * t;
        const uu = u * u;
        const uuu = uu * u;
        const ttt = tt * t;

        const point = new cc.Vec3(
            uuu * p0.x + 3 * uu * t * p1.x + 3 * u * tt * p2.x + ttt * p3.x,
            uuu * p0.y + 3 * uu * t * p1.y + 3 * u * tt * p2.y + ttt * p3.y,
            uuu * p0.z + 3 * uu * t * p1.z + 3 * u * tt * p2.z + ttt * p3.z
        );
        return point;
    }

    CalculateTangent(p0: cc.Vec3, p1: cc.Vec3, p2: cc.Vec3, p3: cc.Vec3, t: number): cc.Vec3 {
        const u = 1 - t;
        const tt = t * t;
        const uu = u * u;

        const slope = new cc.Vec3(
            3 * uu * (p1.x - p0.x) + 6 * u * t * (p2.x - p1.x) + 3 * tt * (p3.x - p2.x),
            3 * uu * (p1.y - p0.y) + 6 * u * t * (p2.y - p1.y) + 3 * tt * (p3.y - p2.y),
            3 * uu * (p1.z - p0.z) + 6 * u * t * (p2.z - p1.z) + 3 * tt * (p3.z - p2.z)
        );

        return slope.normalize();
    }

    public InitSquareData(originTiled: Tiled, otherTiled: Tiled, targetTiled: Tiled, effectType: EffectType, indexNumber: number, arrivedAction: (tiled: Tiled) => void, iconId: number): void {

        this.m_IsStartPlayAni = true;
        this.m_squareFlyEffectCom = null;

        if (effectType != EffectType.SquareCrush && effectType != EffectType.SquareAndSquare
            && originTiled.CanMoveBlocker != null && originTiled.CanMoveBlocker.TableData.Data.SubType == BlockSubType.Special 
            && otherTiled.CanMoveBlocker != null && otherTiled.CanMoveBlocker.TableData.Data.SubType == BlockSubType.Special)
        {
            Utils.SetNodeActive(this.Dynamic_01, true);
            Utils.SetNodeActive(this.Dynamic_02, true);

            let iconId1 = originTiled.CanMoveBlocker.TableData.Data.IconId

            if (originTiled.CanMoveBlocker.IsSquareBlocker())
            {
                cc.resources.load("prefab/effect/SquareFlyEffect", (err, data: any) =>
                {
                    var effect: cc.Node = cc.instantiate(data);
                    effect.setParent(this.Dynamic_01);
                    effect.setPosition(cc.Vec2.ZERO);

                    let squareFlyEffectCom: SquareFlyEffectCom = effect.getComponent(SquareFlyEffectCom);
                    squareFlyEffectCom.PlayIdleAnim();
                });

                cc.resources.load("prefab/effect/SquareFlyEffect", (err, data: any) =>
                {
                    var effect: cc.Node = cc.instantiate(data);
                    effect.setParent(this.Dynamic_03);
                    effect.setPosition(cc.Vec2.ZERO);

                    let squareFlyEffectCom: SquareFlyEffectCom = effect.getComponent(SquareFlyEffectCom);
                    squareFlyEffectCom.PlayIdleAnim();
                });
            }
            else
            {
                cc.resources.load("prefab/blocker/"+ originTiled.CanMoveBlocker.m_prefabName, (err, data: any) =>{
                    let blocker: cc.Node = cc.instantiate(data);
                    let blockerCom: BaseBlockerCom = blocker.getComponent(BaseBlockerCom);
                    blockerCom.SetRotate(originTiled.CanMoveBlocker.ID);
                    blocker.setParent(this.Dynamic_01);
                })

                cc.resources.load("prefab/blocker/"+ originTiled.CanMoveBlocker.m_prefabName, (err, data: any) =>{
                    let blocker: cc.Node = cc.instantiate(data);
                    let blockerCom: BaseBlockerCom = blocker.getComponent(BaseBlockerCom);
                    blockerCom.SetRotate(originTiled.CanMoveBlocker.ID);
                    blocker.setParent(this.Dynamic_03);
                })
            }

            if (otherTiled.CanMoveBlocker.IsSquareBlocker())
            {
                cc.resources.load("prefab/effect/SquareFlyEffect", (err, data: any) =>
                {
                    var effect: cc.Node = cc.instantiate(data);
                    effect.setParent(this.Dynamic_02);
                    effect.setPosition(cc.Vec2.ZERO);

                    let squareFlyEffectCom: SquareFlyEffectCom = effect.getComponent(SquareFlyEffectCom);
                    squareFlyEffectCom.PlayIdleAnim();
                });
            }
            else
            {
                cc.resources.load("prefab/blocker/"+ otherTiled.CanMoveBlocker.m_prefabName, (err, data: any) =>{
                    let blocker: cc.Node = cc.instantiate(data);
                    let blockerCom: BaseBlockerCom = blocker.getComponent(BaseBlockerCom);
                    blockerCom.SetRotate(otherTiled.CanMoveBlocker.ID);
                    blocker.setParent(this.Dynamic_02);
                });
            }

            this.Anim.play("ele_anim_squarefly");

            cc.resources.load("audio/Audio_Match_Rocket_FlyRotate", cc.AudioClip, null, (err, clip: any) =>{
                if (!this.m_IsStartPlayAni)
                {
                    return;
                }
                this.m_audioId = cc.audioEngine.playEffect(clip, true);
            });

            // AudioManager.Instance.PlaySourceLoop("Audio_Match_Rocket_FlyRotate");
        }
        else
        {
            Utils.SetNodeActive(this.Dynamic_01, false);
            Utils.SetNodeActive(this.Dynamic_02, false);
            
            cc.resources.load("prefab/effect/SquareFlyEffect", (err, data: any) =>
            {
                var effect: cc.Node = cc.instantiate(data);
                effect.setParent(this.Anim.node);
                effect.setPosition(cc.Vec2.ZERO);

                this.m_squareFlyEffectCom = effect.getComponent(SquareFlyEffectCom);
                this.m_squareFlyEffectCom.PlayStartFlyAnim();
            });

            cc.resources.load("audio/Audio_Match_Rocket_Flying", cc.AudioClip, null, (err, clip: any) =>{
                if (!this.m_IsStartPlayAni)
                {
                    return;
                }
                this.m_audioId = cc.audioEngine.playEffect(clip, true);
            });

            // AudioManager.Instance.PlaySourceLoop("Audio_Match_Rocket_Flying");
        }

        this.m_targetTiled = targetTiled;
        this.m_indexNumber = indexNumber;

        let convertPos = this.node.parent.convertToNodeSpaceAR(targetTiled.WorldPosition);
        this.m_targetBlockerPos = new cc.Vec3(convertPos.x, convertPos.y, 0);
        this.ArrivedAction = arrivedAction;


        this.FlyTo(this.m_indexNumber, false, false, true);
    }


    private FlyTo(index: number = 0, isComputeTangent: boolean = false, posChange: boolean = false, isFirst: boolean = true): void {

        const start: cc.Vec3 = new cc.Vec3(this.node.position.x, this.node.position.y, 0);
        const target: cc.Vec3 = new cc.Vec3(this.m_targetBlockerPos.x, this.m_targetBlockerPos.y, start.z);
    
        const distance: number = start.sub(target).mag();
    
        let tempPreTimePer: number = 0;
        if (Utils.IsZero(this.m_moveRealTime)) {
            tempPreTimePer = this.m_distCovered / this.m_moveRealTime;
            if (tempPreTimePer > this.m_preTimePer) {
                this.m_preTimePer = tempPreTimePer;
            }
        }
    
        let startHandle: cc.Vec3 = cc.Vec3.ZERO;
        let targetHandle: cc.Vec3 = cc.Vec3.ZERO;
    
        if (isComputeTangent && !this.m_isOrigin) {
            const ab: cc.Vec3 = target.sub(start);
            let cross: cc.Vec3 = ab.cross(new cc.Vec3(0, 0, 1)).normalize();
            targetHandle = start.add(ab.mul(this.TargetHandlePosPer)).add(cross.mul(distance * this.TargetHandleOffsetPer));
    
            startHandle = this.CalculateTangent(this.m_flyData.start, this.m_flyData.startHandle, this.m_flyData.targetHandle,
                this.m_flyData.target, tempPreTimePer);
            startHandle = startHandle.mul(distance * this.StartHandleOffsetPer).add(start);
    
            const ac1: cc.Vec3 = startHandle.sub(start);
            const ac2: cc.Vec3 = targetHandle.sub(start);
    
            const cross1: cc.Vec3 = ab.cross(ac1);
            const cross2: cc.Vec3 = ab.cross(ac2);
    
            if (!(cross1.z >= 0 && cross2.z >= 0 || cross1.z < 0 && cross2.z < 0)) {
                cross = ab.cross(new cc.Vec3(0, 0, -1));
                targetHandle = start.add(ab.mul(this.TargetHandlePosPer)).add(cross.mul(distance * this.TargetHandleOffsetPer));
            }
        } else {
            const startHandleTemp: cc.Vec3 = cc.Vec3.ZERO;
            const targetHandleTemp: cc.Vec3 = cc.Vec3.ZERO;
    
            this.GetStartAndTargetHandle(start, target, startHandle, targetHandle);
            this.GetStartAndTargetHandle(start, target, startHandleTemp, targetHandleTemp, true);
    
            const random: number = TiledMap.getInstance().RandomRange(0, 1);
            const realReverse: boolean = this.JudgeFlyPathHandleReverse(startHandle, targetHandle) || random === 0;
    
            if (realReverse) {
                if (!this.JudgeFlyPathHandleReverse(startHandleTemp, targetHandleTemp)) {
                    startHandle = startHandleTemp;
                    targetHandle = targetHandleTemp;
                }
            }
        }
    
        if (!isFirst && !this.m_isOrigin) {
            const tempTime2: number = (distance / this.m_flyData.speed) * this.ReChooseTargetTimeReducePer;
            let tempSpeed: number = distance / tempTime2;
    
            if (tempSpeed > this.ReChooseTargetMaxSpeed) {
                tempSpeed = this.ReChooseTargetMaxSpeed;
            }
            this.m_moveRealTime = distance / tempSpeed;
            this.m_moveRealTime = Math.min(this.m_moveRealTime, this.MoveMaxTime);
        } else {
            this.m_moveRealTime = this.MoveTimeBase * (distance / (Tiled.WIDTH * 4));
            this.m_moveRealTime = Math.min(this.m_moveRealTime, this.MoveMaxTime);
            this.m_moveRealTime = Math.max(this.m_moveRealTime, this.MoveMintime);
            this.m_moveRealTime += index * this.MoveIntervalTime;
        }
    
        this.m_flyData.start = start;
        this.m_flyData.targetHandle = targetHandle;
        this.m_flyData.startHandle = startHandle;
        this.m_flyData.target = target;
        const currentSpeed: number = distance / this.m_moveRealTime;
    
        if (currentSpeed > this.m_flyData.speed) {
            this.m_flyData.speed = currentSpeed;
        }
    
        this.m_distCovered = 0;
        this.m_isOrigin = false;
    }

    private GetStartAndTargetHandle(start: cc.Vec3, target: cc.Vec3, startHandle: cc.Vec3, targetHandle: cc.Vec3, reverse: boolean = false): void {
        const difference: cc.Vec3 = target.sub(start);
        const cross: cc.Vec3 = difference.cross(reverse ? new cc.Vec3(0, 0, 1) : new cc.Vec3(0, 0, -1)).normalize();
    
        const distance: number = start.sub(target).mag();
        startHandle.set(start.add(difference.mul(this.StartHandlePosPer)).add(cross.mul(distance * this.StartHandleOffsetPer)));
        targetHandle.set(start.add(difference.mul(this.TargetHandlePosPer)).add(cross.mul(distance * this.TargetHandleOffsetPer)));
    }
    
    private JudgeFlyPathHandleReverse(startHandle: cc.Vec3, targetHandle: cc.Vec3): boolean {
        const mapEndPosX: number = TiledMap.getInstance().MapRootPosition.x + TiledMap.MAX_COL * Tiled.WIDTH;
        const reverse: boolean = startHandle.x < TiledMap.getInstance().MapRootPosition.x ||
            targetHandle.x <  TiledMap.getInstance().MapRootPosition.x ||
            startHandle.x > mapEndPosX ||
            targetHandle.x > mapEndPosX;
        return reverse;
    }
    
    protected update(dt: number): void {
        if (!this.m_IsStartPlayAni)
        {
            return;
        }

        this.OnCheckFly();
    }
    
    private OnCheckFly(): void {
        
        // if (LevelManager.Instance.GameState === LevelPlayState.enSkipComplete) {
        //     this.ResetData();
        //     if (this.OnTapSkipComplete) {
        //         this.OnTapSkipComplete();
        //     }
        //     return;
        // }
    
        // if (this.IsReCheckChooseTarget()) {
        //     if (this.m_squareCheckChoose && !this.m_isSetTargetMarked) {
        //         if (this.m_moveRealTime - this.m_distCovered <= LastMarkInterval) {
        //             if (this.CheckReChooseTarget()) {
        //                 return;
        //             }
    
        //             this.m_isSetTargetMarked = true;
        //             if (this.m_targetBlocker && this.m_targetBlocker.SelfTiled) {
        //                 this.m_targetBlocker.SelfTiled.Marked = true;
        //                 this.m_markBlockerTiled = this.m_targetBlocker.SelfTiled;
        //             }
        //         } else {
        //             if (this.m_reCheck) {
        //                 this.m_reCheckInterval -= cc.director.getDeltaTime();
        //                 if (this.m_reCheckInterval <= 0) {
        //                     this.m_reCheckInterval = ReCheckTargetInterval;
        //                     if (this.CheckReChooseTarget()) {
        //                         return;
        //                     }
        //                 }
        //             }
        //         }
        //     }
        // }
    
        if (this.m_distCovered <= this.m_moveRealTime) {
            this.m_distCovered += cc.director.getDeltaTime();
    
            const timePer: number = this.m_distCovered / this.m_moveRealTime;
    
            // const scale: number = CurveScale.evaluate(timePer);
            // if (Utils.IsZero(this.m_preTimePer) || timePer > this.m_preTimePer) {
            //     this.node.scale = scale;
            //     if (this.m_squareType === SquareType.Normal) {
            //         this.node.angle = CurveRotation.evaluate(timePer) * 360;
            //     }
            // }
    
            const to: cc.Vec3 = this.CalculateBezierPoint(this.m_flyData.start, this.m_flyData.startHandle, this.m_flyData.targetHandle, this.m_flyData.target, timePer);
            this.node.position = to;

        } else {
            this.m_IsStartPlayAni = false;
            this.OnMoveEnd();
        }
    }
    
    OnMoveEnd()
    {
        cc.audioEngine.stopEffect(this.m_audioId);

        if (this.m_squareFlyEffectCom != null)
        {
            this.m_squareFlyEffectCom.PlayFlyEndAnim();

            setTimeout(function () {
                this.ArrivedAction(this.m_targetTiled);
              }.bind(this), 200);

            setTimeout(function () {
                this.node.destroy();
              }.bind(this), 400);
        }
        else
        {
            this.ArrivedAction(this.m_targetTiled);
            this.node.destroy();
        }
    }
}
