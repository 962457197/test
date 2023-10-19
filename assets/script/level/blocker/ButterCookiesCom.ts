
import BlockerCom from "./BlockerCom";

const {ccclass, property} = cc._decorator;

@ccclass
export default class ButterCookiesCom extends BlockerCom {
    @property(cc.Sprite)
    SpriteRenderers: cc.Sprite[] = [];
}