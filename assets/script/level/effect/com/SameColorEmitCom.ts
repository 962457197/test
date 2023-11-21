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

        let convertPos = this.node.parent.convertToNodeSpaceAR(targetTiled.WorldPosition);
        let targetBlockerPos = new cc.Vec3(convertPos.x, convertPos.y, 0);

        let targetVec = targetBlockerPos.subtract(this.node.position);
        this.node.width = 0;

        const dotProduct = cc.Vec3.dot(targetVec, cc.Vec3.RIGHT);
        const magnitude1 = cc.Vec3.len(targetVec);
        const cosTheta = dotProduct / (magnitude1 * 1);
        const theta = Math.acos(cosTheta);
        
        var degree = theta / Math.PI * 180;

        if (targetBlockerPos.y < 0)
        {
            degree = -degree;
        }
        this.node.angle = degree;

        let timeData = new TimerData();
        timeData.objthis = this;
        timeData.type = TimerType.enOnce;
        timeData.interval = waitTime;
        timeData.body = ()=>
        {
            cc.tween(this.node)
            .to(0.2, { width: magnitude1 })
            .call(()=>
            {
                setTimeout(function () {
                    this.node.destroy();
                  }.bind(this), 200);
                
                callback(this.m_targetTiled);
            })
            .start();
        };
        TimerManager.Instance.CreateTimer(timeData);

    }
}
