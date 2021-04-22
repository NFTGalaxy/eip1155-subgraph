import {Account, ContractInfo, CreatedCollection, Sell, Transaction} from "../generated/schema";
import {log} from "@graphprotocol/graph-ts/index";

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
import {CollectionCreated, Collections} from "../generated/CollectionFactory/Collections";

export function handleCollectionCreated(event: CollectionCreated): void {
    log.debug('Collection {}, creator {}', [event.params.collectionAddress.toHexString(), event.params.creator.toHexString()])
    let id = event.address.toHexString()
        .concat('-')
        .concat(event.params.collectionAddress.toHexString());
    let createdCollection = new CreatedCollection(id);

    createdCollection.blockNumber = event.block.number;
    createdCollection.collectionAddress = event.params.collectionAddress.toHexString();

    let creator = new Account(event.params.creator.toHex());
    creator.save();
    createdCollection.creator = creator.id;

    // let collection = Collections.bind(event.params.collectionAddress);

    createdCollection.name = 'empty';


    createdCollection.contract = event.address.toHexString();

    let transaction = new Transaction(event.transaction.hash.toHex());
    transaction.timestamp = event.block.timestamp;
    transaction.blockNumber = event.block.number;
    transaction.save();
    createdCollection.transaction = transaction.id;
    createdCollection.save();

}
