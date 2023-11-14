// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

import { TimerData, TimerManager, TimerType } from "../../../tools/TimerManager";

const {ccclass, property} = cc._decorator;

@ccclass
export default class SquareFlyEffectCom extends cc.Component {

    @property(cc.Animation)
    Anim: cc.Animation = null;

    PlayStartFlyAnim()
    {
        this.Anim.play("ele_anim_square_fly_start");
        let timerData = new TimerData();
        timerData.objthis = this;
        timerData.interval = 0.13;
        timerData.type = TimerType.enOnce;
        timerData.body = ()=>
        {
            this.Anim.play("ele_anim_square_fly_idle");
        };
        TimerManager.Instance.CreateTimer(timerData);
    }

    PlayIdleAnim()
    {
        this.Anim.play("ele_anim_square_fly_idle");
    }

    PlayFlyEndAnim()
    {
        this.Anim.play("ele_anim_square_fly_end");
    }
}
