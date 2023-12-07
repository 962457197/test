import UILevelGuide from "./UILevelGuide";
import UILevelPass from "./UILevelPass";

export class UIManager
{
    private static instance: UIManager | null = null;

    private constructor(){

    }

    static get Instance(): UIManager{
        if (!UIManager.instance)
        {
            UIManager.instance = new UIManager();
            UIManager.instance.m_isOpenLevelPass = false;
        }
        return UIManager.instance;
    }

    UIRoot: cc.Node = null;

    m_isOpenLevelPass = false;
    m_uiLevelPass: UILevelPass = null;
    m_uiLevelGuide: UILevelGuide = null;

    OpenLevelPass()
    {
        if (this.m_isOpenLevelPass)
        {
            return;
        }
        this.m_isOpenLevelPass = true;

        cc.resources.load("prefab/ui/UILevelPass", (err, data: any) =>{
            let levelpass: cc.Node = cc.instantiate(data);
            this.m_uiLevelPass = levelpass.getComponent(UILevelPass);
            levelpass.setParent(this.UIRoot);
            levelpass.setPosition(cc.Vec2.ZERO);
        });
    }

    OpenLevelGuide()
    {
        cc.resources.load("prefab/ui/UILevelGuide", (err, data: any) =>{
            let levelGuide: cc.Node = cc.instantiate(data);
            this.m_uiLevelGuide = levelGuide.getComponent(UILevelGuide);
            levelGuide.setParent(this.UIRoot);
            levelGuide.setPosition(cc.Vec2.ZERO);
        });
    }

    CloseLevelGuide()
    {
        if (this.m_uiLevelGuide != null)
        {
            this.m_uiLevelGuide.Close();
            this.m_uiLevelGuide = null;
        }
    }

    Adpater()
    {
        if (this.m_uiLevelPass != null)
        {
            this.m_uiLevelPass.Adpater();
        }
        if (this.m_uiLevelGuide != null)
        {
            this.m_uiLevelGuide.Adpater();
        }
    }
}