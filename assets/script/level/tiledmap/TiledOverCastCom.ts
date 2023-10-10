// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

import { Utils } from "../../tools/Utils";

const {ccclass, property} = cc._decorator;

@ccclass("TiledOverCastCC")
class TiledOverCast {
    @property(cc.Node)
    Up_Left: cc.Node = null;
    @property(cc.Node)
    Up_Left_VerFill: cc.Node = null;
    @property(cc.Node)
    Up_Left_HorFill: cc.Node = null;
    @property(cc.Node)
    Up_Right: cc.Node = null;
    @property(cc.Node)
    UpRight_VerFill: cc.Node = null;
    @property(cc.Node)
    UpRight_HorFill: cc.Node = null;
    @property(cc.Node)
    Down_Right: cc.Node = null;
    @property(cc.Node)
    Down_Right_VerFill: cc.Node = null;
    @property(cc.Node)
    Down_Right_HorFill: cc.Node = null;
    @property(cc.Node)
    Down_Left: cc.Node = null;
    @property(cc.Node)
    Down_Left_VerFill: cc.Node = null;
    @property(cc.Node)
    Down_Left_HorFill: cc.Node = null;
    @property(cc.Node)
    LineUp: cc.Node = null;
    @property(cc.Node)
    LineRight: cc.Node = null;
    @property(cc.Node)
    LineLeft: cc.Node = null;
    @property(cc.Node)
    LineDown: cc.Node = null;

    Reset() {
        Utils.SetNodeActive(this.Up_Left, false);
        Utils.SetNodeActive(this.Up_Left_VerFill, false);
        Utils.SetNodeActive(this.Up_Left_HorFill, false);
        Utils.SetNodeActive(this.Up_Right, false);
        Utils.SetNodeActive(this.UpRight_VerFill, false);
        Utils.SetNodeActive(this.UpRight_HorFill, false);
        Utils.SetNodeActive(this.Down_Right, false);
        Utils.SetNodeActive(this.Down_Right_VerFill, false);
        Utils.SetNodeActive(this.Down_Right_HorFill, false);
        Utils.SetNodeActive(this.Down_Left, false);
        Utils.SetNodeActive(this.Down_Left_VerFill, false);
        Utils.SetNodeActive(this.Down_Left_HorFill, false);
        Utils.SetNodeActive(this.LineUp, false);
        Utils.SetNodeActive(this.LineRight, false);
        Utils.SetNodeActive(this.LineLeft, false);
        Utils.SetNodeActive(this.LineDown, false);
    }
}

@ccclass
export default class TiledOverCastCom extends cc.Component {

    @property({ type: TiledOverCast})
    TiledOverCasts: TiledOverCast[] = [];

    start () {
        for (let i = 0; i < this.TiledOverCasts.length; i++) {
            const element = this.TiledOverCasts[i];
            element.Reset();
        }
        
    }
}
