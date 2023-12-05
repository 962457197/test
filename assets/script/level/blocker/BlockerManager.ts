// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

import { Utils } from "../../tools/Utils";
import { BornEffect, Tiled } from "../tiledmap/Tiled";
import { TiledMap } from "../tiledmap/TiledMap";
import { Blocker , BaseBlocker, LineBlocker, SquareBlocker, AreaBlocker, SameColorBlocker, ObstacleBlocker, ButterCookiesComBlocker, MultiTiledBlocker, ButterCookiesBlocker, DynamicRemoveComBlocker, SawmillBlocker} from "./Blocker";


export enum BlockerID
{
    none                    = -1,
    // coinid                 = 1,
    cookies_a_id            = 2,
    moved_ob_brickid        = 4,
    bottom_c_id             = 5,
    // ingredient1             = 6,
    // ingredient2             = 7,
    baseredid               = 8,
    basegreenid              = 9,
    baseblueid               = 10,
    baseyellowid             = 11,
    basepurpleid             = 12,
    // toplockid               = 14,
    bottom_a_id             = 15,
    bottom_b_id             = 16,
    cookies_b_id            = 17,
    cookies_c_id            = 18,
    squareid                = 19,
    // jelly_02                = 20,
    // jelly_01                = 21,
    // chameleon               = 22,
    horizontal              = 23,
    vertical                = 24,
    area                    = 25,
    samecolor              = 26,
    // monster_jack            = 29,
    cookies_d_id            = 30,
    cookies_e_id            = 31,
    // popcorn_bucket_a_id     = 32,
    // popcorn_bucket_b_id     = 33,
    // popcorn_bucket_c_id     = 34,
    // popcorn_id              = 35,
    // ultimate_energy         = 36,
    // greedyMonster_id        = 37,
    // coco_a_id               = 38,
    // coco_b_id               = 39,
    // bubble_id               = 40,
    // bubble_machine_id       = 41,
    // sodaWaterOne_Up         = 42,
    // sodaWaterOne_Down       = 43,
    // sodaWaterOne_Left       = 44,
    // sodaWaterOne_Right      = 45,
    // sodaWaterOne_Random     = 46,
    // sodaWaterTwo_Up         = 47,
    // sodaWaterTwo_Down       = 48,
    // sodaWaterTwo_Left       = 49,
    // sodaWaterTwo_Right      = 50,
    // sodaWaterTwo_Random     = 51,
    // lucky_box_id            = 52,
    // bag_no_candy_a_id       = 53,
    // bag_no_candy_b_id       = 54,
    // bag_no_candy_c_id       = 55,
    // bag_no_candy_d_id       = 56,
    // bag_no_candy_e_id       = 57,
    // bag_have_candy_a_id     = 58,
    // bag_have_candy_b_id     = 59,
    // bag_have_candy_c_id     = 60,
    // bag_have_candy_d_id     = 61,
    // bag_have_candy_e_id     = 62,
    // candy_id                = 63,
    // ribbons_a_id            = 64,
    // ribbons_b_id            = 65,
    // ribbons_c_id            = 66,
    // ribbons_d_id            = 67,
    // ribbons_e_id            = 68,
    // jam                     = 69,
    // jellymonster_a_id       = 70,
    // jellymonster_b_id       = 71,
    // jellymonster_c_id       = 72,
    // jellymonster_d_id       = 73,
    // jellymonster_e_id       = 74,
    // jellymonster_f_id       = 75,
    // magichat_a_id           = 76,
    // magichat_b_id           = 77,
    // magichat_c_id           = 78,
    // magichat_d_id           = 79,
    // magichat_e_id           = 80,
    // magichat_f_id           = 81,
    // magichat_g_id           = 82,
    // ice_cream_ball          = 83,
    // ice_cream_path          = 84,
    // ice_cream_bucket        = 85,
    // gift_box_a_id           = 86,
    // gift_box_b_id           = 87,
    // gift_box_c_id           = 88,

    // gummy_bear_a_id         = 91,
    // gummy_bear_b_id         = 92,
    // gummy_bear_c_id         = 93,
    // gummy_bear_d_id         = 94,
    // gummy_bear_e_id         = 95,
    // gummy_bear_f_id         = 96,
    // macaronBox              = 123,
    // marcaron_a_id           = 124,
    // marcaron_b_id           = 125,
    // marcaron_c_id           = 126,
    // marcaron_d_id           = 127,
    // marcaron_e_id           = 128,
    // marcaron_f_id           = 129,
    // magician_a_id           = 131,
    // magician_b_id           = 132,
    // magician_c_id           = 133,
    // magician_d_id           = 134,
    // magician_e_id           = 135,
    // mentos_sugar            = 137,
    // mentos_sugar_bag        = 138,
    // cream_machine_a_id      = 139,
    // cream_machine_b_id      = 140,
    // cream_machine_c_id      = 141,
    // cream_id                = 142,

    // tnt_monster_a_id        = 152,
    // tnt_monster_b_id        = 153,
    // tnt_monster_c_id        = 154,
    // tnt_monster_d_id        = 155,
    // tnt_monster_e_id        = 156,
    // tnt_monster_f_id        = 157,
    // tnt_monster_g_id        = 158,
    
    // picnic_basket_a_id      = 159,
    // picnic_basket_b_id      = 160,
    // picnic_basket_c_id      = 161,
    // picnic_basket_d_id      = 162,
    // picnic_basket_e_id      = 163,
    // picnic_basket_f_id      = 164,

    // double_lock             = 166,
    
    // coffee_maker_id         = 167,
    
    // jelly_fish              = 170,

    // candy_jar_a_id          = 172,
    // candy_jar_bear_id       = 173,

    // candy_jar_b_id          = 174,
    // candy_jar_c_id          = 175,
    
    // sugar_bowl_id           = 176,

    // breakfast_close_id      = 177,
    // breakfast_open_id       = 178,

    // walnut_a_id             = 179,
    // walnut_b_id             = 180,
    // walnut_c_id             = 181,
    
    butter_cookies_a_id     = 182,
    butter_cookies_b_id     = 183,
    butter_cookies_c_id     = 184,
    
    // chocolate_id            = 185,
    // chocolate_jar_id        = 186,
    
    // juice_id                = 187,
    
    // catcookies_a_id         = 188,
    // catcookies_b_id         = 189,
    // catcookies_c_id         = 190,
    
    // light_id                = 191,
    // openlight_id            = 197,
    
    // lamp_id                 = 192,
    
    // bread_machine_id        = 193,
    // wrapped_bread_id        = 194,
    // bread_id                = 195,
    // grape_juice_id          = 199,
    
    // blinds_id               = 198,
    // orange_jam_jar_a_id       = 200,
    // left_rope               = 201,
    // top_rope                = 202,
    // left_candy              = 203,
    // top_candy               = 204,
    
    // orange_jam_jar_b_id     = 205,
    // boxing_glove_id       = 206,
    // raw_stone_a             = 207,
    // raw_stone_b             = 208,
    // raw_stone_c             = 209,
    
    // safe_a_id               = 210,
    // safe_b_id               = 211,
    // safe_c_id               = 212,
    // safe_d_id               = 213,
    // safe_e_id               = 214,
    
    sawmill_id              = 215,
    // roman_column_id         = 216,
    
    // ivy_a_id                = 217,
    // ivy_b_id                = 218,
    // ivy_c_id                = 219,
    // ivy_d_id                = 220,
}

export enum BlockerClassType
{
    None,
    Base,
    Area,
    Line,
    Samecolor,
    Square,
    Obstacle,
    DefaultDestroyableCom,
    ButterCookies,
    ButterCookiesCom,

    // Chameleon,
    // Jelly,
    // Jack,
    // EliminableBorder,
    // PopcornBucket,
    // MultiLayer,
    // JackCom,
    // GreedyMonster,
    // BubbleMachine,
    // Bubble,
    // Coco,
    // Ingredient,
    // LuckyBox,
    // SodaWater,
    // CandyBag,
    // Candy,
    // Ribbons,
    // Jam,
    // Lock,
    // JellyMonster,
    // IceCreamBall,
    // IceCreamPath,
    // MagicHat,
    // MacaronCom,
    // MacaronBox,
    // Coin,
    // GiftBox,
    // GummyBear,
    // BoxingGlove,
    // Magician,
    // MentosSugar,
    // MentosSugarBag,
    // CreamMachine,
    // Cream,
    // PicnicBasket,
    // PicnicBasketCom,
    // DefaultCom,
    // GummyBearCom,
    // TntMonster,
    // DefaultNotDestroyableCom,
    // CoffeeMaker,
    // CommonDestroyableCom,
    // Jellyfish,
    // CandyJar,
    // CandyJarCom,
    // CandyJarBear,
    // SugarBowl,
    // BreakfastMachineBlocker,
    // Chocolate,
    // ChocolateJar,
    // Juice,
    // JuiceCom,
    // Light,
    // Lamp,
    // BreadMachine,
    // WrappedBread,
    // Bread,
    // Blinds,
    DynamicRemoveCom,
    // OrangeJamJar,
    // GrapeJuice,
    // Safe,
    Sawmill,
    // RomanColumn,
    // Ivy,
}

export enum BlockType
{
    StaticBlock = 1,
    DyncmicBlock,
    BaseBlock,
    SpecialBlock,
}

export enum BlockSubType
{
    none,
    Monster,
    Special,
    HideMiddle
}

export enum BlockLayer
{
    None,
    Bottom,
    Middle,
    Top,
    LeftBorder,
    TopBorder,
    BelowBottom,
    TopTop,
}

export enum BlockZIndex
{
    Bottom = 1000,
    MiddleB = 1500,
    Middle = 2000,
    Top    = 3000,
    TopTop = 4000,


    //
    Special = 10000,
}

export class BlockerManager {
    private static instance: BlockerManager | null = null;

    private constructor(){

    }

    public static getInstance(): BlockerManager{
        if (!BlockerManager.instance)
        {
            BlockerManager.instance = new BlockerManager();
        }
        return BlockerManager.instance;
    }

    public GenerateNoMatch(row: number, col: number, self: Tiled): Blocker {
        let id: number = BlockerID.baseredid;
        do {
            id =TiledMap.getInstance().FilterRandomID(row, col);
        } while (TiledMap.getInstance().CheckNeighborId(self, id));

        const blk: Blocker = this.CreateFactory(id);
        blk.SelfTiled = self;
        blk.Build();
        return blk;
    }

    public BuildMultiTiledBlocker(id: number, self: Tiled, parentId: number = -1, areaRow = 2, areaCol = 2) : Blocker
    {
        var blk = this.CreateFactory(id, parentId);
        let multiTiledBlocker = blk as MultiTiledBlocker;
        multiTiledBlocker.AreaRow = areaRow;
        multiTiledBlocker.AreaCol = areaCol;
        blk.SelfTiled = self;
        blk.Build();
        return blk;
    }

    public Build(id: number, self: Tiled, parentId: number = -1, specialParent: cc.Node = null, bornEffect = BornEffect.none): Blocker {
        const blk: Blocker = this.CreateFactory(id, parentId);
        blk.SelfTiled = self;
        blk.SpecialParent = specialParent;
        blk.BornEffect = bornEffect;
        blk.Build();
        return blk;
    }

    CreateFactoryCom(classType: BlockerClassType, id: number, parentId: number = -1)
    {
        switch (classType) {
            case BlockerClassType.ButterCookiesCom:
                var baseblocker = this.PopBlocker(BlockerClassType.ButterCookiesCom);
                if (null != baseblocker)
                {
                    baseblocker.Reborn(id, parentId);
                    return baseblocker;
                }
                return new ButterCookiesComBlocker(id);
            case BlockerClassType.DynamicRemoveCom:
                var baseblocker = this.PopBlocker(BlockerClassType.DynamicRemoveCom);
                if (null != baseblocker)
                {
                    baseblocker.Reborn(id, parentId);
                    return baseblocker;
                }
                return new DynamicRemoveComBlocker(id);
            default:
                break;
        }
    }

    CreateFactory(id: number, parentId: number = -1) : Blocker
    {
        let blockerId = id as BlockerID;
        switch (blockerId) {
            case BlockerID.baseredid:
            case BlockerID.basegreenid:
            case BlockerID.baseblueid:
            case BlockerID.baseyellowid:
            case BlockerID.basepurpleid:
                var baseblocker = this.PopBlocker(BlockerClassType.Base);
                if (null != baseblocker)
                {
                    baseblocker.Reborn(id, parentId);
                    return baseblocker;
                }
                return new BaseBlocker(id);
            case BlockerID.horizontal:
            case BlockerID.vertical:
                var baseblocker = this.PopBlocker(BlockerClassType.Line);
                if (null != baseblocker)
                {
                    baseblocker.Reborn(id, parentId);
                    return baseblocker;
                }
                return new LineBlocker(id);
            case BlockerID.squareid:
                var baseblocker = this.PopBlocker(BlockerClassType.Square);
                if (null != baseblocker)
                {
                    baseblocker.Reborn(id, parentId);
                    return baseblocker;
                }
                return new SquareBlocker(id);
            case BlockerID.area:
                var baseblocker = this.PopBlocker(BlockerClassType.Area);
                if (null != baseblocker)
                {
                    baseblocker.Reborn(id, parentId);
                    return baseblocker;
                }
                return new AreaBlocker(id);
            case BlockerID.samecolor:
                var baseblocker = this.PopBlocker(BlockerClassType.Samecolor);
                if (null != baseblocker)
                {
                    baseblocker.Reborn(id, parentId);
                    return baseblocker;
                }
                return new SameColorBlocker(id);
            case BlockerID.bottom_a_id:
            case BlockerID.bottom_b_id:
            case BlockerID.bottom_c_id:
            case BlockerID.cookies_a_id:
            case BlockerID.cookies_b_id:
            case BlockerID.cookies_c_id:
            case BlockerID.cookies_d_id:
            case BlockerID.cookies_e_id:
            case BlockerID.moved_ob_brickid:
                var baseblocker = this.PopBlocker(BlockerClassType.Obstacle);
                if (null != baseblocker)
                {
                    baseblocker.Reborn(id, parentId);
                    return baseblocker;
                }
                return new ObstacleBlocker(id);
            case BlockerID.butter_cookies_a_id:
            case BlockerID.butter_cookies_b_id:
            case BlockerID.butter_cookies_c_id:
                var baseblocker = this.PopBlocker(BlockerClassType.ButterCookies);
                if (null != baseblocker)
                {
                    baseblocker.Reborn(id, parentId);
                    return baseblocker;
                }
                return new ButterCookiesBlocker(id);
            case BlockerID.sawmill_id:
                var baseblocker = this.PopBlocker(BlockerClassType.Sawmill);
                if (null != baseblocker)
                {
                    baseblocker.Reborn(id, parentId);
                    return baseblocker;
                }
                return new SawmillBlocker(id);
            default:
                var baseblocker = this.PopBlocker(BlockerClassType.Base);
                if (null != baseblocker)
                {
                    baseblocker.Reborn(id, parentId);
                    return baseblocker;
                }
                return new BaseBlocker(id);
        }
    }

    private m_poolDic: Map<string, cc.Node[]> = new Map();
    private m_blockersPoolRoot: cc.Node = new cc.Node();
    private m_blockerClassPool: Map<BlockerClassType, Blocker[]> = new Map();
    private RecyclePosition: cc.Vec2 = new cc.Vec2(1000, 10000);

    Pop(name: string): cc.Node {
        const objLst = this.m_poolDic.get(name);
        if (objLst) {
            if (objLst.length > 0) {
                const obj = objLst[objLst.length - 1];
                objLst.pop();
                return obj;
            }
        }

        return null;
    }

    Push(blocker: Blocker | null, name: string, obj: cc.Node): void {
        obj.destroy();
        
        // obj.setParent(this.m_blockersPoolRoot);

        // if (blocker) {
        //     blocker.SetActive(false, true);
        // } else {
        //     obj.setPosition(this.RecyclePosition);
        //     Utils.SetNodeActive(obj, false);
        // }

        // let objLst = this.m_poolDic.get(name);
        // if (!objLst) {
        //     objLst = [];
        //     this.m_poolDic.set(name, objLst);
        // }
        // objLst.push(obj);

        // if (blocker) {
        //     this.PushBlocker(blocker);
        // }
    }

    PopBlocker(clsType: BlockerClassType): Blocker | null {
        const objLst = this.m_blockerClassPool.get(clsType);
        if (objLst) {
            if (objLst.length > 0) {
                const obj = objLst[objLst.length - 1];
                objLst.pop();
                //console.log("PopBlocker:" + clsType.toString());
                return obj;
            }
        }
        return null;
    }

    PushBlocker(blocker: Blocker): void {
        let objLst = this.m_blockerClassPool.get(blocker.ClassType);
        if (!objLst) {
            objLst = [];
            this.m_blockerClassPool.set(blocker.ClassType, objLst);
        }
        objLst.push(blocker);
    }
}
