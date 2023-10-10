import { BinaryHelper } from "../tools/BinaryHelper";
import { IDataBase } from "../tools/IDataBase";

class IconTableData extends IDataBase
{
    ID: number = 0;
    IconName: string = '';
    IconShadowName: string = '';

    public Load(helper: BinaryHelper): void {
        this.ID = helper.ReadInt();
        this.IconName = helper.ReadString();
        this.IconShadowName = helper.ReadString();
    }
}

export class IconTable {
    public static NAME: string = 'IconTable';
    public m_list: { [id: number]: IconTableData } = {};

    public m_dataList: { [id: number]: IconTableData } = {};

    public Lookup(id: number): IconTableData | undefined {
        return this.m_dataList[id];
    }

    public Load(data: IconTable): void {
        for (const key in data.m_list) {
            if (Object.prototype.hasOwnProperty.call(data.m_list, key)) {
                const element = data.m_list[key];
                this.m_dataList[key] = element;
            }
        }
    }
}