import Game from "../Game";
import { BlockerID } from "../level/blocker/BlockerManager";
import { Direction } from "../level/data/LevelScriptableData";
import { FSM } from "../level/fsm/FSM";
import { NormalTiled } from "../level/tiledmap/NormalTiled";
import { Tiled } from "../level/tiledmap/Tiled";
import { TiledMap } from "../level/tiledmap/TiledMap";
import { CameraManager } from "./CameraManager";

export class TiledMapTouchHandler
{
    private static instance: TiledMapTouchHandler | null = null;

    private constructor(){

    }

    public static getInstance(): TiledMapTouchHandler{
        if (!TiledMapTouchHandler.instance)
        {
            TiledMapTouchHandler.instance = new TiledMapTouchHandler();
        }
        return TiledMapTouchHandler.instance;
    }

    Init()
    {
        cc.Canvas.instance.node.on(cc.Node.EventType.TOUCH_START, this.onTouchStart, this);
        cc.Canvas.instance.node.on(cc.Node.EventType.TOUCH_MOVE, this.onTouchMove, this);
        cc.Canvas.instance.node.on(cc.Node.EventType.TOUCH_END, this.onTouchEnd, this);
    }

    // 玩家点击的位置
    private touchStartPos: cc.Vec2 = cc.Vec2.ZERO;
    m_ClickedTiled: NormalTiled = null
    m_ChooseGuid: number = -1;

    // 玩家操作检测
    private onTouchStart(event: cc.Event.EventTouch) {
        if (Game.IsPlayState()) {
            this.touchStartPos = event.getLocation();
            cc.warn("event  = " + event.currentTarget.group + " touchStartPos = " + this.touchStartPos);
            // 玩家触摸开始时的操作

            const { row, col } = CameraManager.getInstance().ScreenPosToTiledPos(this.touchStartPos);
            this.m_ClickedTiled = TiledMap.getInstance().GetTiled(row, col);
            if (this.m_ClickedTiled == null)
            {
                return;
            }

            cc.error("this.m_ClickedTiled != null row = " + row + " col = " + col);

            if (this.m_ChooseGuid == -1 && this.CheckClickTiledCanMove())
            {
                this.OnChooseEffect();
            }
            else if (this.m_ChooseGuid != -1 && this.m_ChooseGuid != this.m_ClickedTiled.Guid)
            {
                let check = this.CheckCanExchange();
                this.EndChooseEffect();
                if (!check && this.CheckClickTiledCanMove())
                {
                    this.OnChooseEffect();
                }
            }
        }
    }

    private onTouchMove(event: cc.Event.EventTouch) {
        if (Game.IsPlayState()) {
            // 玩家触摸移动时的操作

            if (this.m_ChooseGuid !== -1 && this.touchStartPos !== event.getLocation() && this.m_ClickedTiled !== null) {
                let offsetX = event.getLocation().x - this.touchStartPos.x;
                let offsetY = event.getLocation().y - this.touchStartPos.y;

                let moveDirection = Direction.Down;
        
                if (Math.abs(offsetX) > Math.abs(offsetY) && offsetX > 0) {
                    moveDirection = Direction.Right;
                } else if (Math.abs(offsetX) > Math.abs(offsetY) && offsetX < 0) {
                    moveDirection = Direction.Left;
                } else if (Math.abs(offsetX) < Math.abs(offsetY) && offsetY > 0) {
                    moveDirection = Direction.Up;
                } else if (Math.abs(offsetX) < Math.abs(offsetY) && offsetY < 0) {
                    moveDirection = Direction.Down;
                }
        
                if (Math.abs(offsetY) > 30 || Math.abs(offsetX) > 25) {
                    this.EndChooseEffect();

                    FSM.getInstance().OnBeginDrag(this.m_ClickedTiled.Row, this.m_ClickedTiled.Col, null, moveDirection);
                }
            }

            this.checkTiledDrag();
        }
    }

    private onTouchEnd(event: cc.Event.EventTouch) {
        if (Game.IsPlayState()) {
            // 玩家触摸结束时的操作
            this.checkTiledEndDrag();
        }
    }

    private checkTiledDrag() {
        // 在这里处理触摸移动时的操作
    }

    private checkTiledEndDrag() {
        // 在这里处理触摸结束时的操作
    }

    OnChooseEffect() {
        this.m_ChooseGuid = this.m_ClickedTiled.Guid;
    }

    EndChooseEffect() {
        this.m_ChooseGuid = -1;
    }


    private CheckCanExchange(): boolean {
        const clickedTiled = this.m_ClickedTiled;
        const chooseGuid = this.m_ChooseGuid;
    
        const checkAndBeginDrag = (neighborTiled: Tiled, direction: Direction) => {
            if (neighborTiled && neighborTiled.Guid === chooseGuid) {

                // const tiled = LevelManager.Instance.Map.getTiledByGUID(chooseGuid);
                // LevelManager.Instance.onBeginDrag(tiled.Row, tiled.Col, clickedTiled, direction);
                return true;
            }
            return false;
        };
    
        if (checkAndBeginDrag(clickedTiled.GetNeighborTop(), Direction.Down)) {
            return true;
        } else if (checkAndBeginDrag(clickedTiled.GetNeighborBottom(), Direction.Up)) {
            return true;
        } else if (checkAndBeginDrag(clickedTiled.GetNeighborLeft(), Direction.Right)) {
            return true;
        } else if (checkAndBeginDrag(clickedTiled.GetNeighborRight(), Direction.Left)) {
            return true;
        }
    
        return false;
    }

    private CheckClickTiledCanMove(): boolean {
        if (this.m_ClickedTiled.CanMoveBlocker !== null && this.m_ClickedTiled.CanMoveBlocker.IsCanSwitch() && this.m_ClickedTiled.CanMove()) {
            return true;
        }
        return false;
    }

    private IsCheckDoubleClick(blockerId: number): boolean {
        const allowedIds = [
            BlockerID.horizontal,
            BlockerID.vertical,
            BlockerID.squareid,
            BlockerID.package,
            BlockerID.multicolor
        ];
    
        return allowedIds.includes(blockerId);
    }
}

