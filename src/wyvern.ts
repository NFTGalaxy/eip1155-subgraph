import {Account, ContractInfo, Sell, Transaction} from "../generated/schema";
import {log} from "@graphprotocol/graph-ts/index";
import {OrdersMatched} from "../generated/Exchange/Exchange";

import {
    TypedMap,
    Entity,
    Value,
    ValueKind,
    store,
    Address,
    Bytes,
    BigInt,
    BigDecimal
} from "@graphprotocol/graph-ts";

export function handleOrdersMatched(event: OrdersMatched): void {
    let sellId = event.address.toHex()
        .concat('-')
        .concat(event.transaction.hash.toHexString())
        .concat('-')
        .concat(event.params.sellHash.toHexString())
    let sell = new Sell(sellId);

    log.info('log. handle handleOrdersMatched event {}', [event.address.toHexString()])


    sell.blockNumber = event.block.number;
    sell.buyHash = event.params.buyHash.toHexString();
    sell.sellHash = event.params.sellHash.toHexString();

    let maker = new Account(event.params.maker.toHex());
    maker.save();
    let taker = new Account(event.params.taker.toHex());
    taker.save();

    sell.maker = maker.id;
    sell.taker = taker.id;

    sell.price = event.params.price;
    sell.metadata = event.params.metadata.toHexString();

    let transaction = new Transaction(event.transaction.hash.toHex());
    transaction.timestamp = event.block.timestamp;
    transaction.blockNumber = event.block.number;
    transaction.save();

    sell.transaction = transaction.id;

    let contractSaleInfo = new ContractInfo(event.address.toHex());
    contractSaleInfo.latestSaleBlockNumber = event.block.number;

    contractSaleInfo.save();
    sell.save();

}
