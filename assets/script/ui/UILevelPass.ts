// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

import { AudioManager } from "../tools/AudioManager";
import { CameraManager } from "../tools/CameraManager";

const {ccclass, property} = cc._decorator;

declare var mraid: any;

@ccclass
export default class UILevelPass extends cc.Component {
    @property(cc.Button)
    DownloadBtn: cc.Button = null;

    @property(sp.Skeleton)
    SpineSkeleton: sp.Skeleton = null;

    @property(cc.Node)
    Bg: cc.Node = null;

    start () {
        AudioManager.Instance.PlaySource("Audio_UI_Win");
        this.DownloadBtn.node.on('click', this.callback, this);
        this.Adpater();
    }

    Adpater()
    {
        this.Bg.scale = CameraManager.getInstance().MaxRate;
    }

    callback(button: any) {
        let url = "";
        if (cc.sys.os === cc.sys.OS_IOS) {
            url = "https://apps.apple.com/app/id1597696999";
        } else {
            url = "https://play.google.com/store/apps/details?id=com.dream.free.games.match3";
        }
        
        try {
            mraid.open(url);
        } catch (error) {
            cc.error("mraid.open error ");
        }
    }
}
