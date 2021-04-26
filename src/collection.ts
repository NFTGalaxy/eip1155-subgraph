import {Account, CreatedCollection, Transaction} from "../generated/schema";
import {log} from "@graphprotocol/graph-ts/index";

import {
    BigInt,
} from "@graphprotocol/graph-ts";
import {CollectionCreated, Collections} from "../generated/CollectionFactory/Collections";
import {Collection} from "../generated/CollectionFactory/Collection";


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

    let collection = Collection.bind(event.params.collectionAddress);

    let resultName = collection.try_name();
    log.debug('collection name: {}', [resultName.value])

    if (!resultName.reverted) {
        createdCollection.name = resultName.value;
    } else {
        createdCollection.name = '';
    }

    let resultSymbol = collection.try_symbol();
    log.debug('collection name: {}', [resultSymbol.value])

    if (!resultSymbol.reverted) {
        createdCollection.symbol = resultSymbol.value;
    } else {
        createdCollection.symbol = '';
    }

    let resultURI = collection.try_uri(new BigInt(0));
    log.debug('collection name: {}', [resultURI.value])

    if (!resultSymbol.reverted) {
        createdCollection.uri = resultURI.value;
    } else {
        createdCollection.uri = '';
    }

    createdCollection.contract = event.address.toHexString();

    let transaction = new Transaction(event.transaction.hash.toHex());
    transaction.timestamp = event.block.timestamp;
    transaction.blockNumber = event.block.number;
    transaction.save();
    createdCollection.transaction = transaction.id;
    createdCollection.save();

}
