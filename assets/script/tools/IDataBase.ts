
import { BinaryHelper } from "./BinaryHelper";

export class IDataBase {
    public Load(helper: BinaryHelper): void {
        const propInfo = Object.getOwnPropertyNames(this);
        for (const propertyName of propInfo) {
            const property = (this as any)[propertyName];

            if (typeof property === 'string') {
                (this as any)[propertyName] = helper.ReadString();
            } else if (typeof property === 'boolean') {
                (this as any)[propertyName] = helper.ReadBool();
            } else if (typeof property === 'number') {

                if (propertyName === "TimeInMill" || propertyName === "CrushTime")
                {
                    (this as any)[propertyName] = helper.ReadFloat();
                }
                else
                {
                    (this as any)[propertyName] = helper.ReadInt();
                } 
                
                // if (Number.isInteger(property))
                // {
                //     (this as any)[propertyName] = helper.ReadInt();
                // }
                // else
                // {
                //     
                // }
            } else {
                console.log(`Unsupported type: ${typeof property} ${propertyName}`);
            }
        }
    }
}