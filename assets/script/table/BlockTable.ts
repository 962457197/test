
import { BinaryHelper } from "../tools/BinaryHelper";
import { IDataBase } from "../tools/IDataBase";

export enum FirstActionType
{
    Match       = 0,
    Drop         ,
    Recycle      ,
    Move         ,
    Block        ,
    ForbidMove   ,
    PassiveMatch ,
    NearMatch,
    Occupy       ,
    ForbidSwitch ,
    ForbidGravity,
    Sticky,   //目前只有果冻用到了该属性
    BoostTipsCheckSelf, // 道具提示规避检查自身消除
    BoostTipsCheckNear,  // 道具提示规避检查碰撞消除
    BossCombatBlock  // Boss可扔出
}

export enum BlockerAttribute
{
    //不被同色消炸走
    noMoveWithTwoSameColor = 0,
    
    //可与同色消交换
    canSwitchWithSameColor = 1,
    
    //不可播放合成特效的障碍（合成时往一起收那一下的效果）
    cantPlayComposeEffect = 2,
    
    //与同色消交换不隐藏 已无用
    noHideWithSameColor = 3,
    
    //交换位置不可产生特效，需要获取其他位置
    needGetOtherBornEffectTiled = 4,
    
    //可移动的障碍，不播放消除提示（与特效提示）
    canMoveObstacle = 5,
    
    //消除不播地格变亮
    noPlayTiledLight = 6,
    
    //计算分数时不算combo和倍数（无用）
    noCalculateComboAndMultiple = 7,
    
    //可田字消被多次选择的多层障碍
    canMulSelectWithSquare = 8,
    
    //全部消失后才可消除底层（用于棋盘稳定才可消除的障碍）
    totalDestroyCanBottom = 9,
    
    // 消除后是否飞目标物
    flyTarget = 10,
}

class BlockTableData{
    public ID: number = 0;
    public PerfabName: string = '';
    public Layer: number = 0;
    public Type: number = 0;
    public SubType: number = 0;
    public MultiTiled: number = 0;
    public Color: number = 0;
    public IconId: number = 0;
    public TargetId: number = 0;
    public CollectIconId: number = 0;
    public TargetShadowId: number = 0;
    public BornTime: number = 0;
    public HP: number = 0;
    public ParentId: number = 0;
    public ChildId: number = 0;
    public EditorCousinsId: number = 0;
    public Match: number = 0;
    public PassiveMatch: number = 0;
    public NearMatch: number = 0;
    public Drop: number = 0;
    public Recycle: number = 0;
    public Move: number = 0;
    public Block: number = 0;
    public Occupy: number = 0;
    public ForbidSwitch: number = 0;
    public ForbidGravity: number = 0;
    public Sticky: number = 0;
    public SoundId: number = 0;
    public EffectPath: string = '';
    public TimeInMill: number = 0;
    public CrushAnima: string = '';
    public CrushTime: number = 0;
    public BestMacthPriority: number = 0;
    public BoostTipsCheckSelf: number = 0;
    public BoostTipsCheckNear: number = 0;
    public BossCombatBlock: number = 0;
    public Attributes: string = '';
    public NormalScore: number = 0;
    public TargetScore: number = 0;
}

export class BlockerData
{
    Data: BlockTableData = null;
    m_attributeState: number = 0;
    m_action: number = 0;

    constructor(data: BlockTableData) { 
        this.Data = data;
        this.Convert();
    }

    public Convert()
    {
        if (this.Data.Attributes != null)
        {
            let attributes = this.Data.Attributes.split('|');
            for (let i = 0; i < attributes.length; i++) {
                const element = attributes[i];
                this.SetAttribute(parseInt(element) as BlockerAttribute, true);
            }
        }
        
        this.SetAction(this.Data.Match == 1, FirstActionType.Match);
        this.SetAction(this.Data.PassiveMatch == 1, FirstActionType.PassiveMatch);
        this.SetAction(this.Data.NearMatch == 1, FirstActionType.NearMatch);
        this.SetAction(this.Data.Drop == 1, FirstActionType.Drop);
        this.SetAction(this.Data.Recycle == 1, FirstActionType.Recycle);
        this.SetAction(this.Data.Move == 1, FirstActionType.Move);
        this.SetAction(this.Data.Block == 1, FirstActionType.Block);
        this.SetAction(this.Data.Occupy == 1, FirstActionType.Occupy);
        this.SetAction(this.Data.ForbidSwitch == 1, FirstActionType.ForbidSwitch);
        this.SetAction(this.Data.ForbidGravity == 1, FirstActionType.ForbidGravity);
        this.SetAction(this.Data.Sticky == 1, FirstActionType.Sticky);
        this.SetAction(this.Data.BoostTipsCheckSelf == 1, FirstActionType.BoostTipsCheckSelf);
        this.SetAction(this.Data.BoostTipsCheckNear == 1, FirstActionType.BoostTipsCheckNear);
        this.SetAction(this.Data.BossCombatBlock == 1, FirstActionType.BossCombatBlock);
    }

    public SetAttribute(attribute: BlockerAttribute, flag: boolean): void {
        const bits: number = attribute;
        if (bits > 31) {
            return;
        }

        if (flag) {
            this.m_attributeState |= 1 << bits;
        } else {
            this.m_attributeState &= ~(1 << bits);
        }
    }

    public IsHasAttribute(attribute: BlockerAttribute): boolean {
        const bits: number = attribute;
        if (bits > 31) {
            return false;
        }

        return ((this.m_attributeState >> bits) & 1) === 1;
    }

    public SetAction(flag: boolean, action: FirstActionType): void {
        const bits: number = action;
        if (bits > 31) {
            return;
        }

        if (flag) {
            this.m_action |= 1 << bits;
        } else {
            this.m_action &= ~(1 << bits);
        }
    }

    public HasAction(action: FirstActionType,): boolean {
        const bits: number = action;
        if (bits > 31) {
            return false;
        }

        return ((this.m_action >> bits) & 1) === 1;
    }
}

export class BlockTable {
    public static NAME: string = 'BlockTable';
    m_list: { [id: number]: BlockTableData } = {};

    public m_dataList: { [id: number]: BlockerData } = {};

    public Lookup(id: number): BlockerData | undefined {
        return this.m_dataList[id];
    }

    public Load(data: BlockTable): void {
        for (const key in data.m_list) {
            if (Object.prototype.hasOwnProperty.call(data.m_list, key)) {
                const element = data.m_list[key];

                let blockerData = new BlockerData(element);
                this.m_dataList[key] = blockerData;
            }
        }
    }
}

