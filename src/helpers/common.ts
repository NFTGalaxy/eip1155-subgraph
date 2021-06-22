import {BigInt, Address, ethereum, Bytes} from '@graphprotocol/graph-ts'
import {store} from "@graphprotocol/graph-ts/index";
import {BondlyHolder} from "../../generated/schema"

export const BONDLY_ADDRESS = Address.fromHexString("0x13089B528D0787fd33fC763f84582F51fdc7E463");
export const ZERO_ADDRESS = Address.fromHexString("0x0000000000000000000000000000000000000000");

export const ZERO = BigInt.fromI32(0);

export function removeEmptyEntity(entityName: string, id: string): void {
    store.remove(entityName, id);
}

export function getBondlyHolder(holderAddress: Address): BondlyHolder {
    let holder = BondlyHolder.load(holderAddress.toHexString());

    if (holder == null) {
        holder = new BondlyHolder(holderAddress.toHexString());
        holder.amount = ZERO;
        holder.contractAddress = BONDLY_ADDRESS as Address;
        holder.holderAddress = holderAddress;
        holder.save();
    }

    return holder as BondlyHolder;
}
