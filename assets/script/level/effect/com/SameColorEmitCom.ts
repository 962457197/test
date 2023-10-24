// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

import { TimerData, TimerManager, TimerType } from "../../../tools/TimerManager";
import { Tiled } from "../../tiledmap/Tiled";

const {ccclass, property} = cc._decorator;

@ccclass
export default class SameColorEmitCom extends cc.Component {

    @property(cc.Graphics)
    line: cc.Graphics = null;

    m_targetTiled: Tiled = null;

    MoveTo(targetTiled: Tiled, waitTime, callback: (tiled: Tiled) => void)
    {
        this.m_targetTiled = targetTiled;

        let timeData = new TimerData();
        timeData.objthis = this;
        timeData.type = TimerType.enOnce;
        timeData.interval = waitTime;
        timeData.body = ()=>
        {
            cc.tween(this.node)
            .to(0.2, { position : cc.v3(targetTiled.LocalPosition.x, targetTiled.LocalPosition.y, 0)})
            .call(()=>
            {
                callback(this.m_targetTiled);
            })
            .start();
        };
        TimerManager.Instance.CreateTimer(timeData);

    }
}
