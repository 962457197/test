import Game from "../../Game";
import { TimerManager } from "../../tools/TimerManager";
import { Utils } from "../../tools/Utils";
import { Blocker } from "../blocker/Blocker";
import { Direction } from "../data/LevelScriptableData";
import { FSAdpater } from "../fsm/FSBase";
import { FSStateType } from "../fsm/FSM";
import { StateFactory } from "../fsm/StateFactory";
import { Tiled } from "../tiledmap/Tiled";
import { TiledMap } from "../tiledmap/TiledMap";
import { FallingManager } from "./FallingManager";

export class FallingAnimation {
    private m_end: (ani: FallingAnimation, tiled: Tiled | null, toDir: Direction) => void = null;
    private m_interrupt: (ani: FallingAnimation, tiled: Tiled) => void;
    private m_destTiled: Tiled | null = null;
    private m_startPos: cc.Vec2;
    private m_startTiled: Tiled = null;
    private m_endPos: cc.Vec2;
    private m_startTime: number;
    private m_isStart: boolean;
    private m_isPause: boolean;
    private m_pauseBlocker: Blocker | null;
    private m_speed: number;
    private m_accSpeed: number;
    private m_maxSpeed: number;
    private m_dir: cc.Vec2;
    private m_cloneBlockerDir: cc.Vec2;
    private m_toDirection: Direction;
    private m_checkedTileds: number[] = [];
    m_tempStopTimer: number;

    constructor() {
        this.m_speed = 8;
        this.m_accSpeed = 28;
        this.m_maxSpeed = 120;
        this.m_isStart = false;
    }

    public Init(start: Tiled, dest: Tiled, animEnd: (ani: FallingAnimation, tiled: Tiled | null, toDir: Direction) => void, interrupt: (ani: FallingAnimation, tiled: Tiled) => void): void {
        this.m_isStart = true;
        this.m_isPause = false;
        this.m_pauseBlocker = null;

        if (dest.Row !== start.Row || dest.Col !== start.Col) {
            this.m_destTiled = dest;
            this.m_startTiled = start;
            this.InitFallData();
            this.m_startTime = 0;
            this.m_tempStopTimer = 0;
            this.m_end = animEnd;
            this.m_interrupt = interrupt;
            this.m_destTiled.StartFalling();
        }
    }

    private InitFallData(): void {
        this.m_destTiled.CanMoveBlocker = this.m_startTiled.CanMoveBlocker;
        this.m_destTiled.CanMoveBlocker.SelfTiled = this.m_destTiled;

        // if (this.m_startTiled.IsTeleportIn()) {
        //     this.m_destTiled!.CanMoveBlocker!.ChangeSortLayer(GCSortLayer.TeleportMask);
        //     this.m_destTiled!.CanMoveBlocker!.PlayTeleportAnimation(false);
        // }
        
        this.m_startTiled.CanMoveBlocker = null;
        // this.m_startTiled.ResetWhenStartFalling();
        
        if (this.m_startTiled.IsTeleportIn() && this.m_destTiled.IsTeleportOut()) {
            // switch (this.m_destTiled.FallingDir) {
            //     case Direction.Down:
            //         this.m_dir = cc.Vec3.down;
            //         break;
            //     case Direction.Up:
            //         this.m_dir = cc.Vec3.up;
            //         break;
            //     case Direction.Left:
            //         this.m_dir = cc.Vec3.left;
            //         break;
            //     case Direction.Right:
            //         this.m_dir = cc.Vec3.right;
            //         break;
            // }
            
            // this.m_startPos = this.m_destTiled.WorldPosition.sub(this.m_dir.multiply(1.0));
            
            // switch (this.m_startTiled.FallingDir) {
            //     case Direction.Down:
            //         this.m_cloneBlockerDir = cc.Vec3.down;
            //         break;
            //     case Direction.Up:
            //         this.m_cloneBlockerDir = cc.Vec3.up;
            //         break;
            //     case Direction.Left:
            //         this.m_cloneBlockerDir = cc.Vec3.left;
            //         break;
            //     case Direction.Right:
            //         this.m_cloneBlockerDir = cc.Vec3.right;
            //         break;
            // }
            
            // this.m_endPos = this.m_startTiled.WorldPosition.add(this.m_cloneBlockerDir.multiply(1.0));
            
            // this.m_destTiled.CanMoveBlocker!.CreateCloneObject(true);
            // this.m_destTiled.CanMoveBlocker!.WorldPosition = this.m_startPos;
        } else {
            this.m_startPos = this.m_startTiled.WorldPosition;
            this.m_endPos = cc.Vec2.ZERO;
            this.m_dir = this.m_destTiled.WorldPosition.sub(this.m_startPos).normalize();
            this.m_toDirection = Direction.Down;
            
            if (this.m_dir.x > 0) {
                this.m_toDirection = Direction.Right;
            } else if (this.m_dir.x < 0) {
                this.m_toDirection = Direction.Left;
            }
        }
    }

    public IsFinish(): boolean {
        return !this.m_isStart;
    }

    public OnUpdate(): void {
        // if (this.m_isPause) {
        //     if (LevelManager.Instance.SameColorTriggeringCount <= 0) {
        //         if (this.m_destTiled != null && this.m_destTiled.CanMoveBlocker !== null && this.m_pauseBlocker !== null && this.m_destTiled.CanMoveBlocker.Guid === this.m_pauseBlocker.Guid && !this.m_destTiled.CanMoveBlocker.CrushState) {
        //             this.m_isPause = false;
        //             this.m_destTiled.CanMoveBlocker.Falling = true;
        //         } else {
        //             this.m_isStart = false;
        //             this.m_end(this, null, this.m_toDirection);
        //             return;
        //         }
        //     }
        //     return;
        // }

        if (!this.m_isStart) {
            return;
        }

        if (this.m_destTiled.CanMoveBlocker != null && this.m_destTiled.CanMoveBlocker.m_blocker == null)
        {
            return;
        }

        if (this.m_destTiled == null || this.m_destTiled.CanMoveBlocker == null) {

            this.m_isStart = false;
            if (this.m_end != null)
            {
                this.m_end(this, null, this.m_toDirection);
            }
            else
            {
                cc.error("OnUpdate this.m_end == null");
            }
            return;
        }

        // if (this.m_destTiled.IsTempStopFalling) {
        //     this.m_startTiled.IsTempStopFalling = true;
        //     this.m_tempStopTimer += Time.deltaTime;
            
        //     if (this.m_tempStopTimer >= this.m_tempStopTime) {
        //         this.m_tempStopTimer = 0;
        //         this.m_destTiled.IsTempStopFalling = false;
        //         this.m_startTiled.IsTempStopFalling = false;
        //     }
        //     return;
        // }

        let distance = this.m_destTiled.CanMoveBlocker.WorldPosition.sub(this.m_destTiled.WorldPosition).mag();
        
        if (!Utils.IsZero(distance)) {
            this.m_startTime += TimerManager.Instance.GetDeltaTime();;
            const t = this.m_startTime;

            if (!Utils.IsZero(t)) {
                let curSpeed: number = this.m_speed + this.m_accSpeed * t;
                if (curSpeed > this.m_maxSpeed) {
                    curSpeed = this.m_maxSpeed;
                }
                let s: number = curSpeed * TimerManager.Instance.GetDeltaTime() * Game.CC_SIZE_MULTI;
            
                let curPos = this.m_destTiled.CanMoveBlocker.WorldPosition.add(this.m_dir.mul(s));
                let fdis1: number = 0;
                let fdis2: number = 0;
            
                // if (!this.m_endPos.equals(cc.Vec3.ZERO)) {
                //     if (!this.m_destTiled.CanMoveBlocker.CloneObject) {
                //         cc.log("fallingAnimation CloneObject == null :" + this.m_destTiled.Guid + " canmoveID:" + this.m_destTiled.CanMoveBlocker.ID);
                //         this.m_endPos = cc.Vec3.ZERO;
                //         this.m_destTiled.CanMoveBlocker.DestroyCloneObject();
                //     } else {
                //         let clonePos: cc.Vec2 = this.m_destTiled.CanMoveBlocker.CloneObject.getPosition().add(this.m_cloneBlockerDir.mul(s));
                //         fdis1 = clonePos.sub(this.m_startTiled.getPosition()).magSqr();
                //         fdis2 = this.m_endPos.sub(this.m_startTiled.getPosition()).magSqr();
            
                //         if (fdis1 < fdis2) {
                //             this.m_destTiled.CanMoveBlocker.CloneObject.setPosition(clonePos);
                //         } else {
                //             this.m_endPos = cc.Vec3.ZERO;
                //             this.m_destTiled.CanMoveBlocker.DestroyCloneObject();
                //         }
                //     }
                // }
            
                fdis1 = curPos.sub(this.m_startPos).magSqr();
                fdis2 = this.m_destTiled.WorldPosition.sub(this.m_startPos).magSqr();
            
                if (fdis1 >= fdis2) {
                    curPos = this.m_destTiled.WorldPosition;
                }
            
                let localPos = this.m_destTiled.CanMoveBlocker.m_blocker.parent.convertToNodeSpaceAR(curPos);
                this.m_destTiled.CanMoveBlocker.LocalPosition = localPos;

                distance = this.m_destTiled.CanMoveBlocker.WorldPosition.sub(this.m_destTiled.WorldPosition).mag();
            }
        }

        if (Utils.IsZero(distance)) {

            // if (this.m_endPos !== cc.Vec3.zero) {
            //     this.m_endPos = cc.Vec3.zero;
            //     this.m_destTiled.CanMoveBlocker!.DestroyCloneObject();
            // }

            let localPos = this.m_destTiled.CanMoveBlocker.m_blocker.parent.convertToNodeSpaceAR(this.m_destTiled.WorldPosition);
            this.m_destTiled.CanMoveBlocker.LocalPosition = localPos;

            this.m_destTiled.CanMoveBlocker.ChangeSortLayer();
            
            // if (LevelManager.Instance.SameColorTriggeringCount > 0) {
            //     this.m_isPause = true;
            //     this.m_destTiled.CanMoveBlocker!.Falling = false;
            //     this.m_pauseBlocker = this.m_destTiled.CanMoveBlocker;
            //     return;
            // }
            
            let next = this.m_destTiled.CheckNextArriveTiled();

            if (next !== null) {
                if (next.CanMoveBlocker !== null && next.CanMoveBlocker.Falling) {
                    if (this.m_destTiled.TryArrivingTiled !== null && this.m_destTiled.TryArrivingTiled.Guid === next.Guid) {
                        this.m_checkedTileds = [];

                        if (!this.IsCanArrived(this.m_destTiled.TryArrivingTiled.TryArrivingTiled, this.m_destTiled.TryArrivingTiled)) {
                            this.m_checkedTileds = [];
                            this.m_destTiled.TryArrivingTiled = null;
                            this.OnFinished();
                            return;
                        }
                    }
                    
                    this.m_destTiled.TryArrivingTiled = next;
                    return;
                }
                this.m_destTiled.TryArrivingTiled = null;
                
                if (next.CanMoveBlocker !== null) {
                    next = null;
                }
            }
            
            let checkTiled: Tiled | null = null;

            if (next === null && !TiledMap.getInstance().CheckRecycleBlocker(this.m_destTiled)) {
                next = this.m_destTiled.CheckSlantArriveTiled();

                if (next !== null) {
                    if (next.CanMoveBlocker !== null && next.CanMoveBlocker.Falling) {
                        if (this.m_destTiled.TryArrivingTiled !== null && this.m_destTiled.TryArrivingTiled.Guid === next.Guid) {
                            this.m_checkedTileds = [];

                            if (!this.IsCanArrived(this.m_destTiled.TryArrivingTiled.TryArrivingTiled, this.m_destTiled.TryArrivingTiled)) {
                                this.m_checkedTileds = [];
                                next = this.m_destTiled.CheckSlantArriveTiled(next);
                                
                                if (next === null) {
                                    this.m_destTiled.TryArrivingTiled = null;
                                    this.OnFinished();
                                    return;
                                }
                            }
                        }
                        this.m_destTiled.TryArrivingTiled = next;
                        return;
                    }
                    this.m_destTiled.TryArrivingTiled = null;
                    
                    const pre = next.FindPrevTiled();
                    
                    if (pre !== null) {
                        next = null;
                    } else {
                        if (next.CanMoveBlocker !== null) {
                            next = null;
                        }
                    }
                    
                    if (next !== null && next.CanMoveBlocker === null) {
                        if (this.m_destTiled.FallingDir === Direction.Down) {
                            const bottom = this.m_destTiled.GetLocalNeighborBottom();
                            
                            if (bottom !== null && bottom.CanMoveBlocker !== null && bottom.CanMoveBlocker.ID === this.m_destTiled.CanMoveBlocker!.ID) {
                                checkTiled = bottom;
                            }
                        }
                    }
                }
            }
            
            if (next !== null && next.CanMoveBlocker === null) {
                this.m_startTiled = this.m_destTiled;
                this.m_destTiled = next;
                this.InitFallData();
                distance =  this.m_destTiled.CanMoveBlocker.WorldPosition.sub(this.m_destTiled.WorldPosition).magSqr();
                
                if (checkTiled !== null && checkTiled.CanMoveBlocker != null) {
                    checkTiled.CanMoveBlocker.DelayCheck(0.1);
                }

                FallingManager.Instance.OnTriggerFalling(this.m_startTiled);

            } else {
                this.m_startTiled = this.m_destTiled;
                this.m_startPos = this.m_destTiled.WorldPosition;
                distance = 0;
            }
        }
        
        if (Utils.IsZero(distance)) {
            this.OnFinished();
            return;
        }
    }

    private OnFinished(): void {
        this.m_isStart = false;

        if (this.m_end != null)
        {
            if (this.m_destTiled?.CanMoveBlocker === null) {
                this.m_end(this, null, this.m_toDirection);
            } else {
                this.m_end(this, this.m_destTiled, this.m_toDirection);
            }
        }
        else
        {
            cc.error("OnUpdate this.m_end == null");
        }
    }

    private IsCanArrived(arriving: Tiled | null, start: Tiled, ncount: number = 0): boolean {
        if (arriving === null) {
            return true;
        }
        
        if (arriving.Guid === start.Guid) {
            return false;
        }
        
        if (this.m_checkedTileds.includes(arriving.Guid)) {
            this.m_checkedTileds = [];
            return false;
        } else {
            this.m_checkedTileds.push(arriving.Guid);
        }

        return this.IsCanArrived(arriving.TryArrivingTiled, start, ncount);
    }
}
