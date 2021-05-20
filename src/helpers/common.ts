import {BigInt, Address, ethereum} from '@graphprotocol/graph-ts'
import {store} from "@graphprotocol/graph-ts/index";
import {BondlyHolder, BondlyHoldersBlock, LatestBlock} from "../../generated/schema"

export const BONDLY_ADDRESS = Address.fromHexString("0x13089B528D0787fd33fC763f84582F51fdc7E463");

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


export function updateBondlyBlock(block: ethereum.Block): void {
    let bondlyHoldersBlock = BondlyHoldersBlock.load(block.number.toString());

    if (bondlyHoldersBlock == null) {
        bondlyHoldersBlock = new BondlyHoldersBlock(block.number.toString());
    }

    bondlyHoldersBlock.blockNumber = block.number;
    bondlyHoldersBlock.hash = block.hash;
    bondlyHoldersBlock.save();
    bondlyHoldersBlock.holders = [];
    updateLatestBlock(block);
}


export function updateLatestBlock(block: ethereum.Block): void {
    let latestBlock = LatestBlock.load('id_block');

    if (latestBlock == null) {
        latestBlock = new LatestBlock('id_block');
    }

    latestBlock.blockNumber = block.number;
    latestBlock.hash = block.hash;
    latestBlock.save();
}

export function getLatestBondlyBlock(): BondlyHoldersBlock | null {
    let latestBlock = LatestBlock.load('id_block');
    return BondlyHoldersBlock.load(latestBlock.blockNumber.toString());
}
