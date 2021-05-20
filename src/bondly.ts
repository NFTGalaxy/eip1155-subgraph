import {
    Transfer
} from "../generated/Bondly/Bondly"
import {BondlyTransferEvent} from "../generated/schema"
import {removeEmptyEntity, ZERO, getBondlyHolder, updateBondlyBlock, getLatestBondlyBlock} from './helpers/common'
import {ethereum} from "@graphprotocol/graph-ts";
import {BigInt} from "@graphprotocol/graph-ts/index";


export function handleTransfer(event: Transfer): void {
    let transferEvent = new BondlyTransferEvent(event.transaction.hash.toHexString());
    transferEvent.from = event.params.from;
    transferEvent.to = event.params.to;
    transferEvent.amount = event.params.value;
    transferEvent.contractAddress = event.address;
    transferEvent.timestamp = event.block.timestamp;
    transferEvent.transactionHash = event.transaction.hash;

    transferEvent.save();

    let fromToken = getBondlyHolder(event.params.from);

    fromToken.amount = fromToken.amount.minus(event.params.value);
    if (fromToken.amount.equals(ZERO)) {
        removeEmptyEntity('BondlyHolder', event.params.from.toHexString());
    } else {
        fromToken.save();
    }

    let toToken = getBondlyHolder(event.params.to);

    toToken.amount = toToken.amount.plus(event.params.value);
    toToken.save();

    let block = getLatestBondlyBlock();

    block.holders.push(toToken.id)
    block.holders.push(fromToken.id)
}

export function handleBlock(event: ethereum.Block): void {
    if (event.number.mod(BigInt.fromI32(100)).equals(BigInt.fromI32(0))) {
        updateBondlyBlock(event);
    }
}
