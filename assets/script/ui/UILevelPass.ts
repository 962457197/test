// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

const {ccclass, property} = cc._decorator;
declare var mraid: any;

@ccclass
export default class UILevelPass extends cc.Component {
    @property(cc.Button)
    DownloadBtn: cc.Button = null;

    @property(sp.Skeleton)
    SpineSkeleton: sp.Skeleton = null;

    start () {
        this.DownloadBtn.node.on('click', this.callback, this);
    }

    callback(button: any) {
        let url = 'https://play.google.com/store/apps/details?id=com.dream.free.games.match3';
        mraid.open(url);

        
        if (mraid && mraid.open) {
            
          } else {
            cc.error("mraid.open() is not available.");
          }
    }
}
