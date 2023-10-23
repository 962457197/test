export class UIManager
{
    private static instance: UIManager | null = null;

    private constructor(){

    }

    static get Instance(): UIManager{
        if (!UIManager.instance)
        {
            UIManager.instance = new UIManager();
        }
        return UIManager.instance;
    }

    UIRoot: cc.Node = null;

    OpenLevelPass()
    {
        cc.resources.load("prefab/ui/UILevelPass", (err, data: any) =>{
            let levelpass = cc.instantiate(data);
            levelpass.setParent(this.UIRoot);
            levelpass.setPosition(cc.Vec2.ZERO);
        });
    }

}