// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

//#region enum
enum LIMIT
{
    MOVES,
}

export enum DropDataType {
    Common,
}

export enum LevelDifficulty
{
    Default = 0,
    Hard = 1,
    SuperHard = 2,
}

export enum MainLevelType
{
    // 常规
    Normal,
    // 纯金币关
    CoinLevel,
    // 存在金币障碍关
    CoinBlock,
}

export enum Direction
{
    None,
    Down,
    Up,
    Left,
    Right,
    LeftDown,
    LeftUp,
    RightDown,
    RightUp,

    DownLeft,
    UpLeft,
    DownRight,
    UpRight
}

export enum TiledType {
    Invalid = -1,
    None,
    Empty,
    Normal,
    Entry,
    Conveyor,
}

//#endregion

// class SerializeScriptableData {
//     public serialize(helper: BinaryHelper): void {

//     }
//     public deserialize(helper: BinaryHelper): void {

//     }
// }

export class LevelScriptableData
{
    /// 新加字段要处理序列化，反序列化，判断相等，重置
    /// 版本控制新加字段
    public static readonly VERSION: number = 29;
    public MyVersion: number = 0;
    public customizeItemAction: boolean = false;
    public levelNum: number;
    public limitType: LIMIT;
    public limit: number = 0;
    public colorLimit: number = 0;
    public stars: number[];
    public randomSeed: number;
    public maxCols: number;
    public maxRows: number;
    public realRows: number = 9;
    public realCols: number = 9;
    public boostEffectiveStep: number = 0;
    public checkFalling: boolean = false;
    public targetList: LevelTargetData[] = [];
    public dropDataList: LevelDropData[] = [];
    public tiledData: LevelTiledData[] = [];
    public conveyerList: number[] = [];
    public moveDirectionList: number[] = [];
    public squareTargetList: number[] = [];
    public SplitList: SplitBlockData[] = [];
    public CantAsGreedyTargetList: number[] = [];
    public ColorLimitList: number[] = [];
    public CantAsBubbleTargetList: number[] = [];
    public difficulty: LevelDifficulty = LevelDifficulty.Default;
    public RibbionsKeyList: number[] = [];
    public IsCheckEasy: boolean = false;
    public EasyLevelFailTimes: number = 0;
    public EasyLevelBeginStep: number = 0;
    public ColorWeight: number[] = [];
    public IceCreamPathKeyList: number[] = [];
    public BeginMoveDirectionOrder: number = -1;
    public MagicBatWeight: MagicHatWeightData[] = [];
    public LevelType: MainLevelType = MainLevelType.Normal;
    public GiftBoxPageDataList: GiftBoxPageData[] = [];
    public CantAsGiftBoxTargetList: number[] = [];
    public GiftBoxFirstTargetList: number[] = [];
    public BossId: number = 1;
    public BossHp: number = 0;
    public CombatLoseHp: number = 0;
    public CombatBlockCount: number = 0;
    public GirlNeedBolcker: number = 0;
    public GirlNeedCount: number = 0;
    public GirlAttack: number = 1;
    public CombatBlockFirstLst: number[] = [];
    public BossFirstCombatLst: number[] = [];
    public FlippedTiledGuids: number[] = [];
    public FlippedTiledDatas: LevelTiledData[] = [];
    public MentosList: number[] = [];
    public CreamMachineTileds: number[] = [];
    public PicnicBasketBlockDataList : PicnicBasketTiledBlockData[] = [];
    public CoffeeMakerCantAsTargetList: number[] = [];
    public CoffeeMakerFirstTargetList: number[] = [];
    public JellyfishFirstTargetList: number[] = [];
    public DropColorDataList: LevelDropColorData[] = [];
    public IsDropSameColor: boolean = false;
    public DropSameColorStartStep: number = 0;
    public DropSameColorEndStep: number = 0;
    public DropSameColorProbability: number = 0;
    public JuiceColorLimit: number = 4;
    public JuiceFirstColor: number = 0;
    public ADUse_StepsSCR: number[] = [];
    public PurchaseUse_StepsSCR: number[] = [];
    public LampPathGroupIdx: number = 0;
    public CantAsBreadTargetList: number[] = [];
    public BlindsBlockDataList: BlindBlockData[] = [];
    public SawmillList: SawmillAndRomanBlockData[] = [];
    public RomanColumnList: SawmillAndRomanBlockData[] = [];
    public BoxingGloveBlockerDataList: BoxingGloveBlockData[] = [];
    public IvyPathGroupIdx: number = 0;

    // public Reset(): void {
    //     this.MyVersion = 0;
    //     this.customizeItemAction = false;
    //     this.levelNum = 0;
    //     this.limitType = LIMIT.MOVES;
    //     this.limit = 0;
    //     this.colorLimit = 0;
    //     this.randomSeed = 0;
    //     this.maxCols = TiledMap.MAX_COL;
    //     this.maxRows = TiledMap.MAX_ROW;
    //     this.realRows = 9;
    //     this.realCols = 9;
    //     this.boostEffectiveStep = 0;
    //     this.checkFalling = false;
    //     this.difficulty = LevelDifficulty.Default;
    //     this.IsCheckEasy = false;
    //     this.EasyLevelFailTimes = 0;
    //     this.EasyLevelBeginStep = 0;
    //     this.BeginMoveDirectionOrder = -1;
    //     this.LevelType = MainLevelType.Normal;
    //     this.IsDropSameColor = false;
    //     this.DropSameColorStartStep = 0;
    //     this.DropSameColorEndStep = 0;
    //     this.DropSameColorProbability = 0;
    
    //     // Clear Lists
    //     this.targetList.length = 0;
    //     this.dropDataList.length = 0;
    //     this.conveyerList.length = 0;
    //     this.moveDirectionList.length = 0;
    //     this.squareTargetList.length = 0;
    //     this.SplitList.length = 0;
    //     this.CantAsGreedyTargetList.length = 0;
    //     this.ColorLimitList.length = 0;
    //     this.CantAsBubbleTargetList.length = 0;
    //     this.RibbionsKeyList.length = 0;
    //     this.ColorWeight.length = 0;
    //     this.IceCreamPathKeyList.length = 0;
    //     this.MagicBatWeight.length = 0;
    //     this.GiftBoxPageDataList.length = 0;
    //     this.CantAsGiftBoxTargetList.length = 0;
    //     this.GiftBoxFirstTargetList.length = 0;
    //     this.FlippedTiledGuids.length = 0;
    //     this.FlippedTiledDatas.length = 0;
    //     this.CreamMachineTileds.length = 0;
    //     // boss
    //     this.BossId = 1;
    //     this.BossHp = 0;
    //     this.CombatLoseHp = 0;
    //     this.CombatBlockCount = 0;
    //     this.GirlNeedBolcker = 0;
    //     this.GirlNeedCount = 0;
    //     this.GirlAttack = 1;
    //     this.CombatBlockFirstLst.length = 0;
    //     this.BossFirstCombatLst.length = 0;
    //     this.PicnicBasketBlockDataList.length = 0;
    //     this.MentosList.length = 0;
    //     this.CoffeeMakerCantAsTargetList.length = 0;
    //     this.CoffeeMakerFirstTargetList.length = 0;
    //     this.JellyfishFirstTargetList.length = 0;
    //     this.DropColorDataList.length = 0;
    //     this.JuiceColorLimit = 0;
    //     this.JuiceFirstColor = 0;
    //     this.ADUse_StepsSCR.length = 0;
    //     this.PurchaseUse_StepsSCR.length = 0;
    //     this.CantAsBreadTargetList.length = 0;
    //     this.BlindsBlockDataList.length = 0;
    //     this.IvyPathGroupIdx = 0;
    //     this.SawmillList.length = 0;
    //     this.RomanColumnList.length = 0;
    //     this.BoxingGloveBlockerDataList.length = 0;
    // }

    // public Serialize(helper: BinaryHelper): void {
    //     helper.WriteInt(LevelScriptableData.VERSION);
    //     helper.WriteBool(this.customizeItemAction);
    //     helper.WriteInt(this.levelNum);
    //     helper.WriteInt(this.limitType);
    //     helper.WriteInt(this.limit);
    //     helper.WriteInt(this.colorLimit);
        
    //     if (this.stars === null) {
    //         helper.WriteInt(0);
    //     } else {
    //         helper.WriteInt(this.stars.length);
    //         for (let i = 0; i < this.stars.length; i++) {
    //             helper.WriteInt(this.stars[i]);
    //         }
    //     }
        
    //     helper.WriteInt(this.randomSeed);
    //     helper.WriteInt(this.maxCols);
    //     helper.WriteInt(this.maxRows);
    //     helper.WriteInt(this.realCols);
    //     helper.WriteInt(this.realRows);
    //     helper.WriteInt(this.boostEffectiveStep);
    //     helper.WriteBool(this.checkFalling);
        
    //     if (this.targetList === null) {
    //         helper.WriteInt(0);
    //     } else {
    //         helper.WriteInt(this.targetList.length);
    //         for (let i = 0; i < this.targetList.length; i++) {
    //             this.targetList[i].Serialize(helper);
    //         }
    //     }
        
    //     if (this.dropDataList === null) {
    //         helper.WriteInt(0);
    //     } else {
    //         helper.WriteInt(this.dropDataList.length);
    //         for (let i = 0; i < this.dropDataList.length; i++) {
    //             this.dropDataList[i].Serialize(helper);
    //         }
    //     }
        
    //     if (this.tiledData === null) {
    //         helper.WriteInt(0);
    //     } else {
    //         helper.WriteInt(this.tiledData.length);
    //         for (let i = 0; i < this.tiledData.length; i++) {
    //             this.tiledData[i].Serialize(helper);
    //         }
    //     }
        
    //     if (this.conveyerList === null) {
    //         helper.WriteInt(0);
    //     } else {
    //         helper.WriteInt(this.conveyerList.length);
    //         for (let i = 0; i < this.conveyerList.length; i++) {
    //             helper.WriteInt(this.conveyerList[i]);
    //         }
    //     }
        
    //     if (this.moveDirectionList === null) {
    //         helper.WriteInt(0);
    //     } else {
    //         helper.WriteInt(this.moveDirectionList.length);
    //         for (let i = 0; i < this.moveDirectionList.length; i++) {
    //             helper.WriteInt(this.moveDirectionList[i]);
    //         }
    //     }
        
    //     if (this.squareTargetList === null) {
    //         helper.WriteInt(0);
    //     } else {
    //         helper.WriteInt(this.squareTargetList.length);
    //         for (let i = 0; i < this.squareTargetList.length; i++) {
    //             helper.WriteInt(this.squareTargetList[i]);
    //         }
    //     }
        
    //     if (this.SplitList === null) {
    //         helper.WriteInt(0);
    //     } else {
    //         helper.WriteInt(this.SplitList.length);
    //         for (let i = 0; i < this.SplitList.length; i++) {
    //             this.SplitList[i].Serialize(helper);
    //         }
    //     }
        
    //     if (this.CantAsGreedyTargetList === null) {
    //         helper.WriteInt(0);
    //     } else {
    //         helper.WriteInt(this.CantAsGreedyTargetList.length);
    //         for (let i = 0; i < this.CantAsGreedyTargetList.length; i++) {
    //             helper.WriteInt(this.CantAsGreedyTargetList[i]);
    //         }
    //     }
        
    //     if (this.ColorLimitList === null) {
    //         helper.WriteInt(0);
    //     } else {
    //         helper.WriteInt(this.ColorLimitList.length);
    //         for (let i = 0; i < this.ColorLimitList.length; i++) {
    //             helper.WriteInt(this.ColorLimitList[i]);
    //         }
    //     }
        
    //     if (this.CantAsBubbleTargetList === null) {
    //         helper.WriteInt(0);
    //     } else {
    //         helper.WriteInt(this.CantAsBubbleTargetList.length);
    //         for (let i = 0; i < this.CantAsBubbleTargetList.length; i++) {
    //             helper.WriteInt(this.CantAsBubbleTargetList[i]);
    //         }
    //     }
        
    //     helper.WriteInt(this.difficulty);
        
    //     if (this.RibbionsKeyList === null) {
    //         helper.WriteInt(0);
    //     } else {
    //         helper.WriteInt(this.RibbionsKeyList.length);
    //         for (let i = 0; i < this.RibbionsKeyList.length; i++) {
    //             helper.WriteInt(this.RibbionsKeyList[i]);
    //         }
    //     }
        
    //     helper.WriteBool(this.IsCheckEasy);
    //     helper.WriteInt(this.EasyLevelFailTimes);
    //     helper.WriteInt(this.EasyLevelBeginStep);
        
    //     if (this.ColorWeight === null) {
    //         helper.WriteInt(0);
    //     } else {
    //         helper.WriteInt(this.ColorWeight.length);
    //         for (let i = 0; i < this.ColorWeight.length; i++) {
    //             helper.WriteInt(this.ColorWeight[i]);
    //         }
    //     }
        
    //     if (this.IceCreamPathKeyList === null) {
    //         helper.WriteInt(0);
    //     } else {
    //         helper.WriteInt(this.IceCreamPathKeyList.length);
    //         for (let i = 0; i < this.IceCreamPathKeyList.length; i++) {
    //             helper.WriteInt(this.IceCreamPathKeyList[i]);
    //         }
    //     }
        
    //     helper.WriteInt(this.BeginMoveDirectionOrder);
        
    //     if (this.MagicBatWeight === null) {
    //         helper.WriteInt(0);
    //     } else {
    //         helper.WriteInt(this.MagicBatWeight.length);
    //         for (let i = 0; i < this.MagicBatWeight.length; i++) {
    //             this.MagicBatWeight[i].Serialize(helper);
    //         }
    //     }
        
    //     helper.WriteInt(this.LevelType);
        
    //     if (this.GiftBoxPageDataList === null) {
    //         helper.WriteInt(0);
    //     } else {
    //         helper.WriteInt(this.GiftBoxPageDataList.length);
    //         for (let i = 0; i < this.GiftBoxPageDataList.length; i++) {
    //             this.GiftBoxPageDataList[i].Serialize(helper);
    //         }
    //     }
        
    //     if (this.CantAsGiftBoxTargetList === null) {
    //         helper.WriteInt(0);
    //     } else {
    //         helper.WriteInt(this.CantAsGiftBoxTargetList.length);
    //         for (let i = 0; i < this.CantAsGiftBoxTargetList.length; i++) {
    //             helper.WriteInt(this.CantAsGiftBoxTargetList[i]);
    //         }
    //     }
        
    //     if (this.GiftBoxFirstTargetList === null) {
    //         helper.WriteInt(0);
    //     } else {
    //         helper.WriteInt(this.GiftBoxFirstTargetList.length);
    //         for (let i = 0; i < this.GiftBoxFirstTargetList.length; i++) {
    //             helper.WriteInt(this.GiftBoxFirstTargetList[i]);
    //         }
    //     }
        
    //     helper.WriteInt(this.BossId);
    //     helper.WriteInt(this.BossHp);
    //     helper.WriteInt(this.CombatLoseHp);
    //     helper.WriteInt(this.CombatBlockCount);
    //     helper.WriteInt(this.GirlNeedBolcker);
    //     helper.WriteInt(this.GirlNeedCount);
    //     helper.WriteInt(this.GirlAttack);
        
    //     if (this.CombatBlockFirstLst === null) {
    //         helper.WriteInt(0);
    //     } else {
    //         helper.WriteInt(this.CombatBlockFirstLst.length);
    //         for (let i = 0; i < this.CombatBlockFirstLst.length; i++) {
    //             helper.WriteInt(this.CombatBlockFirstLst[i]);
    //         }
    //     }
        
    //     if (this.BossFirstCombatLst === null) {
    //         helper.WriteInt(0);
    //     } else {
    //         helper.WriteInt(this.BossFirstCombatLst.length);
    //         for (let i = 0; i < this.BossFirstCombatLst.length; i++) {
    //             helper.WriteInt(this.BossFirstCombatLst[i]);
    //         }
    //     }
        
    //     if (this.FlippedTiledGuids === null) {
    //         helper.WriteInt(0);
    //     } else {
    //         helper.WriteInt(this.FlippedTiledGuids.length);
    //         for (let i = 0; i < this.FlippedTiledGuids.length; i++) {
    //             helper.WriteInt(this.FlippedTiledGuids[i]);
    //         }
    //     }
        
    //     if (this.FlippedTiledDatas === null) {
    //         helper.WriteInt(0);
    //     } else {
    //         helper.WriteInt(this.FlippedTiledDatas.length);
    //         for (let i = 0; i < this.FlippedTiledDatas.length; i++) {
    //             this.FlippedTiledDatas[i].Serialize(helper);
    //         }
    //     }
        
    //     if (this.MentosList === null) {
    //         helper.WriteInt(0);
    //     } else {
    //         helper.WriteInt(this.MentosList.length);
    //         for (let i = 0; i < this.MentosList.length; i++) {
    //             helper.WriteInt(this.MentosList[i]);
    //         }
    //     }
        
    //     if (this.CreamMachineTileds === null) {
    //         helper.WriteInt(0);
    //     } else {
    //         helper.WriteInt(this.CreamMachineTileds.length);
    //         for (let i = 0; i < this.CreamMachineTileds.length; i++) {
    //             helper.WriteInt(this.CreamMachineTileds[i]);
    //         }
    //     }
        
    //     if (this.PicnicBasketBlockDataList === null) {
    //         helper.WriteInt(0);
    //     } else {
    //         helper.WriteInt(this.PicnicBasketBlockDataList.length);
    //         for (let i = 0; i < this.PicnicBasketBlockDataList.length; i++) {
    //             this.PicnicBasketBlockDataList[i].Serialize(helper);
    //         }
    //     }
        
    //     if (this.CoffeeMakerCantAsTargetList === null) {
    //         helper.WriteInt(0);
    //     } else {
    //         helper.WriteInt(this.CoffeeMakerCantAsTargetList.length);
    //         for (let i = 0; i < this.CoffeeMakerCantAsTargetList.length; i++) {
    //             helper.WriteInt(this.CoffeeMakerCantAsTargetList[i]);
    //         }
    //     }
        
    //     if (this.CoffeeMakerFirstTargetList === null) {
    //         helper.WriteInt(0);
    //     } else {
    //         helper.WriteInt(this.CoffeeMakerFirstTargetList.length);
    //         for (let i = 0; i < this.CoffeeMakerFirstTargetList.length; i++) {
    //             helper.WriteInt(this.CoffeeMakerFirstTargetList[i]);
    //         }
    //     }
        
    //     if (this.JellyfishFirstTargetList === null) {
    //         helper.WriteInt(0);
    //     } else {
    //         helper.WriteInt(this.JellyfishFirstTargetList.length);
    //         for (let i = 0; i < this.JellyfishFirstTargetList.length; i++) {
    //             helper.WriteInt(this.JellyfishFirstTargetList[i]);
    //         }
    //     }
        
    //     if (this.DropColorDataList === null) {
    //         helper.WriteInt(0);
    //     } else {
    //         helper.WriteInt(this.DropColorDataList.length);
    //         for (let i = 0; i < this.DropColorDataList.length; i++) {
    //             this.DropColorDataList[i].Serialize(helper);
    //         }
    //     }
        
    //     helper.WriteBool(this.IsDropSameColor);
    //     if (this.IsDropSameColor) {
    //         helper.WriteInt(this.DropSameColorStartStep);
    //         helper.WriteInt(this.DropSameColorEndStep);
    //         helper.WriteInt(this.DropSameColorProbability);
    //     }
        
    //     helper.WriteInt(this.JuiceColorLimit);
    //     helper.WriteInt(this.JuiceFirstColor);
        
    //     if (this.ADUse_StepsSCR === null) {
    //         helper.WriteInt(0);
    //     } else {
    //         helper.WriteInt(this.ADUse_StepsSCR.length);
    //         for (let i = 0; i < this.ADUse_StepsSCR.length; i++) {
    //             helper.WriteInt(this.ADUse_StepsSCR[i]);
    //         }
    //     }
        
    //     if (this.PurchaseUse_StepsSCR === null) {
    //         helper.WriteInt(0);
    //     } else {
    //         helper.WriteInt(this.PurchaseUse_StepsSCR.length);
    //         for (let i = 0; i < this.PurchaseUse_StepsSCR.length; i++) {
    //             helper.WriteInt(this.PurchaseUse_StepsSCR[i]);
    //         }
    //     }
        
    //     helper.WriteInt(this.LampPathGroupIdx);
        
    //     if (this.CantAsBreadTargetList === null) {
    //         helper.WriteInt(0);
    //     } else {
    //         helper.WriteInt(this.CantAsBreadTargetList.length);
    //         for (let i = 0; i < this.CantAsBreadTargetList.length; i++) {
    //             helper.WriteInt(this.CantAsBreadTargetList[i]);
    //         }
    //     }
        
    //     if (this.BlindsBlockDataList === null) {
    //         helper.WriteInt(0);
    //     } else {
    //         helper.WriteInt(this.BlindsBlockDataList.length);
    //         for (let i = 0; i < this.BlindsBlockDataList.length; i++) {
    //             this.BlindsBlockDataList[i].Serialize(helper);
    //         }
    //     }
        
    //     if (this.SawmillList === null) {
    //         helper.WriteInt(0);
    //     } else {
    //         helper.WriteInt(this.SawmillList.length);
    //         for (let i = 0; i < this.SawmillList.length; i++) {
    //             this.SawmillList[i].Serialize(helper);
    //         }
    //     }
        
    //     if (this.RomanColumnList === null) {
    //         helper.WriteInt(0);
    //     } else {
    //         helper.WriteInt(this.RomanColumnList.length);
    //         for (let i = 0; i < this.RomanColumnList.length; i++) {
    //             this.RomanColumnList[i].Serialize(helper);
    //         }
    //     }
    
    //     if (this.BoxingGloveBlockerDataList == null)
    //     {
    //         helper.WriteInt(0);
    //     } else {
    //         for (let i = 0; i < this.BoxingGloveBlockerDataList.length; i++) {
    //             this.BoxingGloveBlockerDataList[i].Serialize(helper);
    //         }
    //     }

    //     helper.WriteInt(this.IvyPathGroupIdx);
    // }


  //   public Deserialize(helper: BinaryHelper): void {
  //       this.MyVersion = helper.ReadInt();
  //       this.customizeItemAction = helper.ReadBool();
  //       this.levelNum = helper.ReadInt();
  //       this.limitType = helper.ReadInt() as LIMIT;
  //       this.limit = helper.ReadInt();
  //       this.colorLimit = helper.ReadInt();
        
  //       let len = helper.ReadInt();
  //       this.stars = new Array(len);
  //       for (let i = 0; i < len; i++) {
  //           this.stars[i] = helper.ReadInt();
  //       }
        
  //       this.randomSeed = helper.ReadInt();
  //       this.maxCols = helper.ReadInt();
  //       this.maxRows = helper.ReadInt();
  //       this.realCols = helper.ReadInt();
  //       this.realRows = helper.ReadInt();
  //       this.boostEffectiveStep = helper.ReadInt();
  //       this.checkFalling = helper.ReadBool();
        
  //       len = helper.ReadInt();
  //       for (let i = 0; i < len; i++) {
  //           let data = new LevelTargetData();
  //           data.Deserialize(helper);
  //           this.targetList.push(data);
  //       }
        
  //       len = helper.ReadInt();
  //       for (let i = 0; i < len; i++) {
  //           let data = new LevelDropData();
  //           data.Deserialize(helper, this.MyVersion);
  //           this.dropDataList.push(data);
  //       }
        
  //       len = helper.ReadInt();
  //       this.tiledData = new Array(len);
  //       for (let i = 0; i < len; i++) {
  //           let data = new LevelTiledData();
  //           data.Deserialize(helper, this.MyVersion);
  //           this.tiledData[i] = data;
  //       }
        
  //       len = helper.ReadInt();
  //       for (let i = 0; i < len; i++) {
  //           this.conveyerList.push(helper.ReadInt());
  //       }
        
  //       len = helper.ReadInt();
  //       for (let i = 0; i < len; i++) {
  //           this.moveDirectionList.push(helper.ReadInt());
  //       }
        
  //       len = helper.ReadInt();
  //       for (let i = 0; i < len; i++) {
  //           this.squareTargetList.push(helper.ReadInt());
  //       }
        
  //       len = helper.ReadInt();
  //       for (let i = 0; i < len; i++) {
  //           let data = new SplitBlockData();
  //           data.Deserialize(helper);
  //           this.SplitList.push(data);
  //       }
        
  //       len = helper.ReadInt();
  //       for (let i = 0; i < len; i++) {
  //           this.CantAsGreedyTargetList.push(helper.ReadInt());
  //       }
        
  //       len = helper.ReadInt();
  //       for (let i = 0; i < len; i++) {
  //           this.ColorLimitList.push(helper.ReadInt());
  //       }
        
  //       if (this.MyVersion >= 1) {
  //           len = helper.ReadInt();
  //           for (let i = 0; i < len; i++) {
  //               this.CantAsBubbleTargetList.push(helper.ReadInt());
  //           }
  //       }
        
  //       if (this.MyVersion >= 2) {
  //           this.difficulty = helper.ReadInt() as LevelDifficulty;
  //       }
        
  //       if (this.MyVersion >= 3) {
  //           len = helper.ReadInt();
  //           for (let i = 0; i < len; i++) {
  //               this.RibbionsKeyList.push(helper.ReadInt());
  //           }
  //       }
        
  //       if (this.MyVersion >= 4) {
  //           this.IsCheckEasy = helper.ReadBool();
  //           this.EasyLevelFailTimes = helper.ReadInt();
  //           this.EasyLevelBeginStep = helper.ReadInt();
            
  //           len = helper.ReadInt();
  //           for (let i = 0; i < len; i++) {
  //               this.ColorWeight.push(helper.ReadInt());
  //           }
  //       }
        
  //       if (this.MyVersion >= 5) {
  //           len = helper.ReadInt();
  //           for (let i = 0; i < len; i++) {
  //               this.IceCreamPathKeyList.push(helper.ReadInt());
  //           }
  //       }
        
  //       if (this.MyVersion >= 6) {
  //           this.BeginMoveDirectionOrder = helper.ReadInt();
  //       }
        
  //       if (this.MyVersion >= 7) {
  //           len = helper.ReadInt();
  //           for (let i = 0; i < len; i++) {
  //               let data = new MagicHatWeightData();
  //               data.Deserialize(helper);
  //               this.MagicBatWeight.push(data);
  //           }
  //       }
        
  //       if (this.MyVersion >= 9) {
  //           this.LevelType = helper.ReadInt() as MainLevelType;
  //       }
        
  //       if (this.MyVersion >= 10) {
  //           len = helper.ReadInt();
  //           for (let i = 0; i < len; i++) {
  //               let data = new GiftBoxPageData();
  //               data.Deserialize(helper);
  //               this.GiftBoxPageDataList.push(data);
  //           }
            
  //           len = helper.ReadInt();
  //           for (let i = 0; i < len; i++) {
  //               this.CantAsGiftBoxTargetList.push(helper.ReadInt());
  //           }
            
  //           len = helper.ReadInt();
  //           for (let i = 0; i < len; i++) {
  //               this.GiftBoxFirstTargetList.push(helper.ReadInt());
  //           }
  //       }
        
  //       if (this.MyVersion >= 11) {
  //           this.BossId = helper.ReadInt();
  //           this.BossHp = helper.ReadInt();
  //           this.CombatLoseHp = helper.ReadInt();
  //           this.CombatBlockCount = helper.ReadInt();
  //           this.GirlNeedBolcker = helper.ReadInt();
  //           this.GirlNeedCount = helper.ReadInt();
  //           this.GirlAttack = helper.ReadInt();
            
  //           len = helper.ReadInt();
  //           for (let i = 0; i < len; i++) {
  //               this.CombatBlockFirstLst.push(helper.ReadInt());
  //           }
            
  //           len = helper.ReadInt();
  //           for (let i = 0; i < len; i++) {
  //               this.BossFirstCombatLst.push(helper.ReadInt());
  //           }
  //       }
        
  //       if (this.MyVersion >= 12) {
  //           len = helper.ReadInt();
  //           for (let i = 0; i < len; i++) {
  //               this.FlippedTiledGuids.push(helper.ReadInt());
  //           }
            
  //           len = helper.ReadInt();
  //           for (let i = 0; i < len; i++) {
  //               let data = new LevelTiledData();
  //               data.Deserialize(helper, this.MyVersion);
  //               this.FlippedTiledDatas.push(data);
  //           }
  //       }
        
  //       if (this.MyVersion >= 13) {
  //           len = helper.ReadInt();
  //           for (let i = 0; i < len; i++) {
  //               this.MentosList.push(helper.ReadInt());
  //           }
  //       }
        
  //       if (this.MyVersion >= 14) {
  //           len = helper.ReadInt();
  //           for (let i = 0; i < len; i++) {
  //               this.CreamMachineTileds.push(helper.ReadInt());
  //           }
  //       }
        
  //       if (this.MyVersion >= 15) {
  //           len = helper.ReadInt();
  //           for (let i = 0; i < len; i++) {
  //               let data = new PicnicBasketTiledBlockData();
  //               data.Deserialize(helper, this.MyVersion);
  //               this.PicnicBasketBlockDataList.push(data);
  //           }
  //       }
        
  //       if (this.MyVersion >= 16) {
  //           len = helper.ReadInt();
  //           for (let i = 0; i < len; i++) {
  //               this.CoffeeMakerCantAsTargetList.push(helper.ReadInt());
  //           }
            
  //           len = helper.ReadInt();
  //           for (let i = 0; i < len; i++) {
  //               this.CoffeeMakerFirstTargetList.push(helper.ReadInt());
  //           }
  //       }
        
  //       if (this.MyVersion >= 17) {
  //           len = helper.ReadInt();
  //           for (let i = 0; i < len; i++) {
  //               this.JellyfishFirstTargetList.push(helper.ReadInt());
  //           }
  //       }
        
  //       if (this.MyVersion >= 18) {
  //           len = helper.ReadInt();
  //           for (let i = 0; i < len; i++) {
  //               let data = new LevelDropColorData();
  //               data.Deserialize(helper);
  //               this.DropColorDataList.push(data);
  //           }
  //       }
        
  //       if (this.MyVersion >= 19) {
  //           this.IsDropSameColor = helper.ReadBool();
  //           if (this.IsDropSameColor) {
  //               this.DropSameColorStartStep = helper.ReadInt();
  //               this.DropSameColorEndStep = helper.ReadInt();
  //               this.DropSameColorProbability = helper.ReadFloat();
  //           }
  //       }
        
  //       if (this.MyVersion >= 20) {
  //           this.JuiceColorLimit = helper.ReadInt();
  //           this.JuiceFirstColor = helper.ReadInt();
  //       }
        
  //       if (this.MyVersion >= 21) {
  //           len = helper.ReadInt();
  //           for (let i = 0; i < len; i++) {
  //               this.ADUse_StepsSCR.push(helper.ReadFloat());
  //           }
            
  //           len = helper.ReadInt();
  //           for (let i = 0; i < len; i++) {
  //               this.PurchaseUse_StepsSCR.push(helper.ReadFloat());
  //           }
  //       }
        
  //       if (this.MyVersion >= 23) {
  //           this.LampPathGroupIdx = helper.ReadInt();
  //       }
        
  //       if (this.MyVersion >= 25) {
  //           len = helper.ReadInt();
  //           for (let i = 0; i < len; i++) {
  //               this.CantAsBreadTargetList.push(helper.ReadInt());
  //           }
  //       }
        
  //       if (this.MyVersion >= 26) {
  //           len = helper.ReadInt();
  //           for (let i = 0; i < len; i++) {
  //               let data = new BlindBlockData();
  //               data.Deserialize(helper, this.MyVersion);
  //               this.BlindsBlockDataList.push(data);
  //           }
  //       }
        
  //       if (this.MyVersion >= 27) {
  //           len = helper.ReadInt();
  //           for (let i = 0; i < len; i++) {
  //               let data = new SawmillAndRomanBlockData();
  //               data.Deserialize(helper, this.MyVersion);
  //               this.SawmillList.push(data);
  //           }
  //       }
        
  //       if (this.MyVersion >= 27) {
  //           len = helper.ReadInt();
  //           for (let i = 0; i < len; i++) {
  //               let data = new SawmillAndRomanBlockData();
  //               data.Deserialize(helper, this.MyVersion);
  //               this.RomanColumnList.push(data);
  //           }
  //       }

  //       if (this.MyVersion >= 28) {
  //           len = helper.ReadInt();
  //           for (let i = 0; i < len; i++) {
  //               let data = new BoxingGloveBlockData();
  //               data.Deserialize(helper, this.MyVersion);
  //               this.BoxingGloveBlockerDataList.push(data);
  //           }
  //       }
        
  //       if (this.MyVersion >= 29) {
  //           this.IvyPathGroupIdx = helper.ReadInt();
  //       }
  //   }

  //   static CreateBlockData(id: number): LevelBlockData {
  //     let data: LevelBlockData;
  //     if (Blocker.IsMagician(id)) {
  //         data = new LevelMagicianBlockData();
  //     } else {
  //         data = new LevelBlockData();
  //     }
  //     data.id = id;
  
  //     return data;
  // }
}

abstract class LevelBaseData {

}

class LevelTargetData extends LevelBaseData {
    public type: number;
    public count: number;

    // public Serialize(helper: BinaryHelper): void {
    //     helper.WriteInt(this.type);
    //     helper.WriteInt(this.count);
    // }

    // public Deserialize(helper: BinaryHelper): void {
    //     this.type = helper.ReadInt();
    //     this.count = helper.ReadInt();
    // }

    // public IsEqual(baseData: LevelBaseData): boolean {
    //     const data = baseData as LevelTargetData;
    //     if (data === null) {
    //         return false;
    //     }

    //     return this.type === data.type && this.count === data.count;
    // }
}

export class LevelDropData extends LevelBaseData {
    id: number = 0;
    type: DropDataType = DropDataType.Common;
    genMax: number = 0;
    allowMax: number = 0;
    allowMin: number = 0;
    spawn: number = 0;
    onceCount: number = 0;
    enterlst: number[] = [];
  
    // version = 18;
    limit: number = 0;
    start: number = 0;
    end: number = 0;
  
    // Serialize(helper: BinaryHelper): void {
    //   helper.WriteInt(this.id);
    //   helper.WriteInt(this.type);
    //   helper.WriteInt(this.genMax);
    //   helper.WriteInt(this.allowMax);
    //   helper.WriteInt(this.allowMin);
    //   helper.WriteInt(this.spawn);
    //   helper.WriteInt(this.onceCount);
    //   if (this.enterlst == null) {
    //     helper.WriteInt(0);
    //   } else {
    //     helper.WriteInt(this.enterlst.length);
    //     for (let i = 0; i < this.enterlst.length; i++) {
    //       helper.WriteInt(this.enterlst[i]);
    //     }
    //   }
  
    //   helper.WriteInt(this.limit);
    //   helper.WriteInt(this.start);
    //   helper.WriteInt(this.end);
    // }
  
    // Deserialize(helper: BinaryHelper, version: number): void {
    //   this.id = helper.ReadInt();
    //   this.type = helper.ReadInt() as DropDataType;
    //   this.genMax = helper.ReadInt();
    //   this.allowMax = helper.ReadInt();
    //   this.allowMin = helper.ReadInt();
    //   this.spawn = helper.ReadInt();
    //   this.onceCount = helper.ReadInt();
    //   const len = helper.ReadInt();
    //   for (let i = 0; i < len; i++) {
    //     const data = helper.ReadInt();
    //     this.enterlst.push(data);
    //   }
  
    //   if (version >= 18) {
    //     this.limit = helper.ReadInt();
    //     this.start = helper.ReadInt();
    //     this.end = helper.ReadInt();
    //   }
    // }
}

export class LevelTiledData extends LevelBaseData {
    type: TiledType = TiledType.Normal;
    direction: Direction = Direction.Down;
    blockDataList: LevelBlockData[] = [];
    borderDataList: LevelBlockData[] = [];
    recylceList: number[] = [];
    IsEnterPoint: boolean = false;
    IsTeleportIn: boolean = false;
    teleportOut: number = -1;
    IsTeleportOut: boolean = false;
    teleportIn: number = -1;
    conveyerData: LevelConveyerData | null = null;
    moveDirectionData: LevelMoveDirectionData | null = null;
    ribbonsData: LevelRibbonsData | null = null;
    iceCreamPathData: LevelIceCreamPathData | null = null;
    mentosData: LevelMentosData | null = null;
    CreamIdx: number = -1;
    lampPathData: LevelLampPathData | null = null;
    specialDropList: number[] = [];
    ivyPathData: LevelIvyPathData | null = null;
  
    // Serialize(helper: BinaryHelper): void {
    //   helper.WriteInt(this.type);
    //   helper.WriteInt(this.direction);
  
    //   if (this.blockDataList == null) {
    //     helper.WriteInt(0);
    //   } else {
    //     helper.WriteInt(this.blockDataList.length);
    //     for (let i = 0; i < this.blockDataList.length; i++) {
    //       this.blockDataList[i].Serialize(helper);
    //     }
    //   }
  
    //   if (this.borderDataList == null) {
    //     helper.WriteInt(0);
    //   } else {
    //     helper.WriteInt(this.borderDataList.length);
    //     for (let i = 0; i < this.borderDataList.length; i++) {
    //       this.borderDataList[i].Serialize(helper);
    //     }
    //   }
  
    //   if (this.recylceList == null) {
    //     helper.WriteInt(0);
    //   } else {
    //     helper.WriteInt(this.recylceList.length);
    //     for (let i = 0; i < this.recylceList.length; i++) {
    //       helper.WriteInt(this.recylceList[i]);
    //     }
    //   }
  
    //   helper.WriteBool(this.IsEnterPoint);
    //   helper.WriteBool(this.IsTeleportIn);
    //   helper.WriteInt(this.teleportOut);
    //   helper.WriteBool(this.IsTeleportOut);
    //   helper.WriteInt(this.teleportIn);
  
    //   if (this.conveyerData == null) {
    //     helper.WriteBool(false);
    //   } else {
    //     helper.WriteBool(true);
    //     this.conveyerData.serialize(helper);
    //   }
  
    //   if (this.moveDirectionData == null) {
    //     helper.WriteBool(false);
    //   } else {
    //     helper.WriteBool(true);
    //     this.moveDirectionData.serialize(helper);
    //   }
  
    //   if (this.ribbonsData == null) {
    //     helper.WriteBool(false);
    //   } else {
    //     helper.WriteBool(true);
    //     this.ribbonsData.serialize(helper);
    //   }
  
    //   if (this.iceCreamPathData == null) {
    //     helper.WriteBool(false);
    //   } else {
    //     helper.WriteBool(true);
    //     this.iceCreamPathData.serialize(helper);
    //   }
  
    //   if (this.mentosData == null) {
    //     helper.WriteBool(false);
    //   } else {
    //     helper.WriteBool(true);
    //     this.mentosData.serialize(helper);
    //   }
  
    //   helper.WriteInt(this.CreamIdx);
  
    //   if (this.lampPathData == null) {
    //     helper.WriteBool(false);
    //   } else {
    //     helper.WriteBool(true);
    //     this.lampPathData.serialize(helper);
    //   }
  
    //   if (this.specialDropList == null) {
    //     helper.WriteInt(0);
    //   } else {
    //     helper.WriteInt(this.specialDropList.length);
    //     for (let i = 0; i < this.specialDropList.length; i++) {
    //       helper.WriteInt(this.specialDropList[i]);
    //     }
    //   }
  
    //   if (this.ivyPathData == null) {
    //     helper.WriteBool(false);
    //   } else {
    //     helper.WriteBool(true);
    //     this.ivyPathData.serialize(helper);
    //   }
    // }
  
    // Deserialize(helper: BinaryHelper, myVersion: number): void {
    //   this.type = helper.ReadInt() as TiledType;
    //   this.direction = helper.ReadInt() as Direction;
  
    //   let len = helper.ReadInt();
    //   for (let i = 0; i < len; i++) {
    //     let id = helper.ReadInt();
    //     let data = LevelScriptableData.CreateBlockData(id);
  
    //     data.Deserialize(helper);
    //     this.blockDataList.push(data);
    //   }
  
    //   len = helper.ReadInt();
    //   for (let i = 0; i < len; i++) {
    //     let id = helper.ReadInt();
    //     let data = LevelScriptableData.CreateBlockData(id);
  
    //     data.Deserialize(helper);
    //     this.borderDataList.push(data);
    //   }
  
    //   len = helper.ReadInt();
    //   for (let i = 0; i < len; i++) {
    //     this.recylceList.push(helper.ReadInt());
    //   }
  
    //   this.IsEnterPoint = helper.ReadBool();
    //   this.IsTeleportIn = helper.ReadBool();
    //   this.teleportOut = helper.ReadInt();
    //   this.IsTeleportOut = helper.ReadBool();
    //   this.teleportIn = helper.ReadInt();
  
    //   let ishas = helper.ReadBool();
    //   if (ishas) {
    //     this.conveyerData = new LevelConveyerData();
    //     this.conveyerData.Deserialize(helper);
    //   }
  
    //   ishas = helper.ReadBool();
    //   if (ishas) {
    //     this.moveDirectionData = new LevelMoveDirectionData();
    //     this.moveDirectionData.Deserialize(helper, myVersion);
    //   }
  
    //   if (myVersion >= 3) {
    //     ishas = helper.ReadBool();
    //     if (ishas) {
    //       this.ribbonsData = new LevelRibbonsData();
    //       this.ribbonsData.Deserialize(helper);
    //     }
    //   }
  
    //   if (myVersion >= 5) {
    //     ishas = helper.ReadBool();
    //     if (ishas) {
    //       this.iceCreamPathData = new LevelIceCreamPathData();
    //       this.iceCreamPathData.Deserialize(helper);
    //     }
    //   }
  
    //   if (myVersion >= 13) {
    //     ishas = helper.ReadBool();
    //     if (ishas) {
    //       this.mentosData = new LevelMentosData();
    //       this.mentosData.Deserialize(helper);
    //     }
    //   }
  
    //   if (myVersion >= 14) {
    //     this.CreamIdx = helper.ReadInt();
    //   }
  
    //   if (myVersion >= 23) {
    //     ishas = helper.ReadBool();
    //     if (ishas) {
    //       this.lampPathData = new LevelLampPathData();
    //       this.lampPathData.Deserialize(helper);
    //     }
    //   }
  
    //   if (myVersion >= 24) {
    //     len = helper.ReadInt();
    //     for (let i = 0; i < len; i++) {
    //       this.specialDropList.push(helper.ReadInt());
    //     }
    //   }
  
    //   if (myVersion >= 29) {
    //     ishas = helper.ReadBool();
    //     if (ishas) {
    //       this.ivyPathData = new LevelIvyPathData();
    //       this.ivyPathData.Deserialize(helper);
    //     }
    //   }
    // }
}

class LevelBlockData extends LevelBaseData {
    public id: number = 0;

    // public Serialize(helper: BinaryHelper): void {
    //     helper.WriteInt(this.id);
    // }

    // public Deserialize(helper: BinaryHelper): void {
    //     // Uncomment the following line if you have a corresponding ReadInt method in TypeScript.
    //     // this.Id = helper.ReadInt();
    // }
}

class LevelConveyerData extends LevelBaseData {
    public id: number = 0;
    public nextTiledGUID: number = -1;
    public flowDirection: Direction = Direction.None; // Replace 'Default' with the actual default value
    public isStartNote: boolean = false;
    public isEndNote: boolean = false;
    public isCornerNote: boolean = false;
    public editerDirectionAngle: number = 0;
    public angle: number = 0;
    public doorAngle: number = 0;
    public scale_X: number = 0;
    public scale_Y: number = 0;
    public blockerMoveDirection: number = 0;
    public animationName: string = '';

    // public Deserialize(helper: BinaryHelper): void {
    //     this.id = helper.ReadInt();
    //     this.nextTiledGUID = helper.ReadInt();
    //     this.flowDirection = helper.ReadInt() as Direction;
    //     this.isStartNote = helper.ReadBool();
    //     this.isEndNote = helper.ReadBool();
    //     this.isCornerNote = helper.ReadBool();
    //     this.editerDirectionAngle = helper.ReadShort();
    //     this.angle = helper.ReadShort();
    //     this.doorAngle = helper.ReadShort();
    //     this.scale_X = helper.ReadShort();
    //     this.scale_Y = helper.ReadShort();
    //     this.blockerMoveDirection = helper.ReadShort();
    //     this.animationName = helper.ReadString();
    // }
}

class LevelMoveDirectionData extends LevelBaseData {
    public groupId: number = 0;
    public sortNumber: number = 0;
    public preTiledGuid: number = -1;
    public nextTiledGuid: number = -1;
    public moveOrder: number = -1;

    // public Deserialize(helper: BinaryHelper, myVersion: number): void {
    //     this.groupId = helper.ReadInt();
    //     this.sortNumber = helper.ReadByte();
    //     this.preTiledGuid = helper.ReadInt();
    //     this.nextTiledGuid = helper.ReadInt();

    //     if (myVersion >= 6) {
    //         this.moveOrder = helper.ReadInt();
    //     }
    // }
}

class LevelRibbonsData extends LevelBaseData {
    public id: number = 0;
    public color: number = 0;

    // public Serialize(helper: BinaryHelper): void {
    //     helper.WriteInt(this.id);
    //     helper.WriteInt(this.color);
    // }

    // public Deserialize(helper: BinaryHelper): void {
    //     this.id = helper.ReadInt();
    //     this.color = helper.ReadInt();
    // }

    // public IsEqual(baseData: LevelBaseData): boolean {
    //     const data = baseData as LevelRibbonsData;
    //     if (!data) {
    //         return false;
    //     }

    //     return this.id === data.id && this.color === data.color;
    // }
}

class LevelIceCreamPathData extends LevelBaseData {
    public groupId: number = 0;
    public nextGuid: number = 0;

    // public Deserialize(helper: BinaryHelper): void {
    //     this.groupId = helper.ReadInt();
    //     this.nextGuid = helper.ReadInt();
    // }

    // public IsEqual(baseData: LevelBaseData): boolean {
    //     const data = baseData as LevelIceCreamPathData;
    //     if (!data) {
    //         return false;
    //     }

    //     return this.groupId === data.groupId && this.nextGuid === data.nextGuid;
    // }
}

class LevelMentosData extends LevelBaseData {
    public prevGuid: number = 0;
    public nextGuid: number = 0;

    // public Deserialize(helper: BinaryHelper): void {
    //     this.prevGuid = helper.ReadInt();
    //     this.nextGuid = helper.ReadInt();
    // }

    // public IsEqual(baseData: LevelBaseData): boolean {
    //     const data = baseData as LevelMentosData;
    //     if (!data) {
    //         return false;
    //     }

    //     return this.prevGuid === data.prevGuid && this.nextGuid === data.nextGuid;
    // }
}

class LevelLampPathData extends LevelBaseData {
    public groupId: number = 0;

    // public Deserialize(helper: BinaryHelper): void {
    //     this.groupId = helper.ReadInt();
    // }

    // public IsEqual(baseData: LevelBaseData): boolean {
    //     const data = baseData as LevelLampPathData;
    //     if (!data) {
    //         return false;
    //     }

    //     return this.groupId === data.groupId;
    // }
}

class LevelIvyPathData extends LevelBaseData {
    public groupId: number = 0;
    public preGuid: number = -1;
    public nextGuid: number = -1;

    // public Deserialize(helper: BinaryHelper): void {
    //     this.groupId = helper.ReadInt();
    //     this.preGuid = helper.ReadInt();
    //     this.nextGuid = helper.ReadInt();
    // }

    // public IsEqual(baseData: LevelBaseData): boolean {
    //     const data = baseData as LevelIvyPathData;
    //     if (!data) {
    //         return false;
    //     }

    //     return (
    //         this.groupId === data.groupId &&
    //         this.preGuid === data.preGuid &&
    //         this.nextGuid === data.nextGuid
    //     );
    // }
}

class SplitBlockData extends LevelBaseData {

    BlockId: number;
    SplitNum: number;
    
    // Serialize(helper: BinaryHelper): void {
    //     helper.WriteInt(this.BlockId);
    //     helper.WriteInt(this.SplitNum);
    // }
    
    // Deserialize(helper: BinaryHelper): void {
    //     this.BlockId = helper.ReadInt();
    //     this.SplitNum = helper.ReadInt();
    // }
}

class MagicHatWeightData extends LevelBaseData {
    BlockId: number;
    WeightRightValue: number;
  
    // Serialize(helper: BinaryHelper): void {
    //   helper.WriteInt(this.BlockId);
    //   helper.WriteInt(this.WeightRightValue);
    // }
  
    // Deserialize(helper: BinaryHelper): void {
    //   this.BlockId = helper.ReadInt();
    //   this.WeightRightValue = helper.ReadInt();
    // }
  
    // IsEqual(baseData: LevelBaseData): boolean {
    //   const data = baseData as MagicHatWeightData;
    //   if (data == null) {
    //     return false;
    //   }
  
    //   return this.BlockId === data.BlockId && this.WeightRightValue === data.WeightRightValue;
    // }
}

  class GiftBoxPageData extends LevelBaseData {
    GiftBoxDataList: GiftBoxData[] = [];
  
    // Serialize(helper: BinaryHelper): void {
    //   if (this.GiftBoxDataList == null) {
    //     helper.WriteInt(0);
    //   } else {
    //     helper.WriteInt(this.GiftBoxDataList.length);
    //     for (let i = 0; i < this.GiftBoxDataList.length; i++) {
    //       this.GiftBoxDataList[i].Serialize(helper);
    //     }
    //   }
    // }
  
    // Deserialize(helper: BinaryHelper): void {
    //   const len = helper.ReadInt();
    //   for (let i = 0; i < len; i++) {
    //     const giftBoxData = new GiftBoxData();
    //     giftBoxData.Deserialize(helper);
    //     this.GiftBoxDataList.push(giftBoxData);
    //   }
    // }
}

class GiftBoxData extends LevelBaseData {
    Index: number;
    BlockId: number;
    Count: number;
  
    // Serialize(helper: BinaryHelper): void {
    //   helper.WriteInt(this.Index);
    //   helper.WriteInt(this.BlockId);
    //   helper.WriteInt(this.Count);
    // }
  
    // Deserialize(helper: BinaryHelper): void {
    //   this.Index = helper.ReadInt();
    //   this.BlockId = helper.ReadInt();
    //   this.Count = helper.ReadInt();
    // }
  
    // IsEqual(baseData: LevelBaseData): boolean {
    //   const data = baseData as GiftBoxData;
    //   if (data == null) {
    //     return false;
    //   }
  
    //   return (
    //     this.Index === data.Index &&
    //     this.BlockId === data.BlockId &&
    //     this.Count === data.Count
    //   );
    // }
 }

 class PicnicBasketTiledBlockData extends LevelBaseData {
    BlockId: number;
    Num: number = 3;
    Row: number = 2;
    Col: number = 2;
    TiledGuid: number;
    Index: number;
  
    // Serialize(helper: BinaryHelper): void {
    //   helper.WriteInt(this.BlockId);
    //   helper.WriteInt(this.Num);
    //   helper.WriteInt(this.Row);
    //   helper.WriteInt(this.Col);
    //   helper.WriteInt(this.TiledGuid);
    //   helper.WriteInt(this.Index);
    // }
  
    // Deserialize(helper: BinaryHelper, myVersion: number): void {
    //   this.BlockId = helper.ReadInt();
    //   this.Num = helper.ReadInt();
    //   this.Row = helper.ReadInt();
    //   this.Col = helper.ReadInt();
  
    //   if (myVersion >= 22) {
    //     this.TiledGuid = helper.ReadInt();
    //     this.Index = helper.ReadInt();
    //   }
    // }
  
    // IsEqual(baseData: LevelBaseData): boolean {
    //   const data = baseData as PicnicBasketTiledBlockData;
    //   if (data == null) {
    //     return false;
    //   }
  
    //   return (
    //     this.BlockId === data.BlockId &&
    //     this.TiledGuid === data.TiledGuid &&
    //     this.Index === data.Index &&
    //     this.Num === data.Num &&
    //     this.Row === data.Row &&
    //     this.Col === data.Col
    //   );
    // }
}

export class LevelDropColorData extends LevelBaseData {
    id: number = 0;
    colorlst: number[] = [];
    enterlst: number[] = [];
  
    // Serialize(helper: BinaryHelper): void {
    //   helper.WriteInt(this.id);
  
    //   if (this.colorlst == null) {
    //     helper.WriteInt(0);
    //   } else {
    //     // Remove 0 values as they have no meaning
    //     this.colorlst = this.colorlst.filter(color => color !== 0);
  
    //     helper.WriteInt(this.colorlst.length);
    //     for (let i = 0; i < this.colorlst.length; i++) {
    //       helper.WriteInt(this.colorlst[i]);
    //     }
    //   }
  
    //   if (this.enterlst == null) {
    //     helper.WriteInt(0);
    //   } else {
    //     helper.WriteInt(this.enterlst.length);
    //     for (let i = 0; i < this.enterlst.length; i++) {
    //       helper.WriteInt(this.enterlst[i]);
    //     }
    //   }
    // }
  
    // Deserialize(helper: BinaryHelper): void {
    //   this.id = helper.ReadInt();
    //   const colorLen = helper.ReadInt();
    //   for (let i = 0; i < colorLen; i++) {
    //     const data = helper.ReadInt();
    //     this.colorlst.push(data);
    //   }
  
    //   const enterLen = helper.ReadInt();
    //   for (let i = 0; i < enterLen; i++) {
    //     const data = helper.ReadInt();
    //     this.enterlst.push(data);
    //   }
    // }
}

class BlindBlockData extends LevelBaseData {
    BlockId: number;
    Row: number = 2;
    Col: number = 2;
    TiledGuid: number;
    Direction: number;
    Index: number;
  
    // Serialize(helper: BinaryHelper): void {
    //   helper.WriteInt(this.BlockId);
    //   helper.WriteInt(this.Row);
    //   helper.WriteInt(this.Col);
    //   helper.WriteInt(this.TiledGuid);
    //   helper.WriteInt(this.Direction);
    //   helper.WriteInt(this.Index);
    // }
  
    // Deserialize(helper: BinaryHelper, myVersion: number): void {
    //   if (myVersion >= 26) {
    //     this.BlockId = helper.ReadInt();
    //     this.Row = helper.ReadInt();
    //     this.Col = helper.ReadInt();
    //     this.TiledGuid = helper.ReadInt();
    //     this.Direction = helper.ReadInt();
    //     this.Index = helper.ReadInt();
    //     // DebugView.e("----------------------------------->>> BlindBlockData Deserialize: GUID" + TiledGuid + "    DIR:" + Direction + "     Index:" + Index);
    //   }
    // }
  
    // IsEqual(baseData: LevelBaseData): boolean {
    //   const data = baseData as BlindBlockData;
    //   if (data == null) {
    //     return false;
    //   }
  
    //   return (
    //     this.BlockId === data.BlockId &&
    //     this.TiledGuid === data.TiledGuid &&
    //     this.Index === data.Index &&
    //     this.Row === data.Row &&
    //     this.Col === data.Col &&
    //     this.Direction === data.Direction
    //   );
    // }
  }
  
  class SawmillAndRomanBlockData extends LevelBaseData {
    TotalCount: number;
    Direction: number;
    Index: number;
  
    // Serialize(helper: BinaryHelper): void {
    //   helper.WriteInt(this.TotalCount);
    //   helper.WriteInt(this.Direction);
    //   helper.WriteInt(this.Index);
    // }
  
    // Deserialize(helper: BinaryHelper, myVersion: number): void {
    //   if (myVersion >= 27) {
    //     this.TotalCount = helper.ReadInt();
    //     this.Direction = helper.ReadInt();
    //     this.Index = helper.ReadInt();
    //   }
    // }
  
    // IsEqual(baseData: LevelBaseData): boolean {
    //   const data = baseData as SawmillAndRomanBlockData;
    //   if (data == null) {
    //     return false;
    //   }
  
    //   return (
    //     this.Index === data.Index &&
    //     this.Direction === data.Direction &&
    //     this.TotalCount === data.TotalCount
    //   );
    // }
}

class BoxingGloveBlockData extends LevelBaseData {
    Num: number = 3;
    Direction: number;
    ColorId: number = -1;
    TiledGuid: number;
    Index: number;
  
    // Serialize(helper: BinaryHelper): void {
    //   helper.WriteInt(this.Num);
    //   helper.WriteInt(this.Direction);
    //   helper.WriteInt(this.ColorId);
    //   helper.WriteInt(this.TiledGuid);
    //   helper.WriteInt(this.Index);
    // }
  
    // Deserialize(helper: BinaryHelper, myVersion: number): void {
    //   this.Num = helper.ReadInt();
    //   this.Direction = helper.ReadInt();
    //   this.ColorId = helper.ReadInt();
    //   this.TiledGuid = helper.ReadInt();
    //   this.Index = helper.ReadInt();
    // }
  
    // IsEqual(baseData: LevelBaseData): boolean {
    //   const data = baseData as BoxingGloveBlockData;
    //   if (data == null) {
    //     return false;
    //   }
  
    //   return (
    //     this.Num === data.Num &&
    //     this.Direction === data.Direction &&
    //     this.ColorId === data.ColorId &&
    //     this.TiledGuid === data.TiledGuid &&
    //     this.Index === data.Index
    //   );
    // }
}

class LevelMagicianBlockData extends LevelBlockData {
    color: number = 0;

    // override Serialize(helper: BinaryHelper): void {
    //     super.Serialize(helper);
    //     helper.WriteInt(this.color);
    // }

    // override Deserialize(helper: BinaryHelper): void {
    //     this.color = helper.ReadInt();
    // }
}

  
  