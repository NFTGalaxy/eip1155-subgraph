import {Address, ethereum, log} from "@graphprotocol/graph-ts/index";

import {
    BigInt,
} from "@graphprotocol/graph-ts";
import {CollectionCreated} from "../generated/CollectionFactory/Collections";
import {
    Account,
    BurnedToken,
    ContractBlockInfo,
    CreatedCollection, CreatedToken,
    Token,
    TokenRegistry,
    Transaction, TransferToken
} from "../generated/schema";
import {Collection} from "../generated/CollectionFactory/Collection";
import {
    TransferBatch as TransferBatchEvent,
    TransferSingle as TransferSingleEvent
} from "../generated/CollectionFactory/IERC1155"

import {Collection as CollectionTemplate} from '../generated/templates'

import {constants} from "@amxx/graphprotocol-utils/index";


export function handleCollectionCreated(event: CollectionCreated): void {
    log.debug('Collection {}, creator {}', [event.params.collectionAddress.toHexString(), event.params.creator.toHexString()])
    let createdCollection = new CreatedCollection(event.params.collectionAddress.toHexString());

    createdCollection.blockNumber = event.block.number;
    createdCollection.collectionAddress = event.params.collectionAddress.toHexString();

    let creator = new Account(event.params.creator.toHex());
    creator.save();
    createdCollection.creator = creator.id;

    let collection = Collection.bind(event.params.collectionAddress);

    let resultName = collection.try_name();

    if (!resultName.reverted) {
        createdCollection.name = resultName.value;
    } else {
        createdCollection.name = '';
    }

    let resultURI = collection.try_uri(new BigInt(0));

    if (!resultURI.reverted) {
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

    let info = new ContractBlockInfo(event.address.toHexString());
    info.latestBlockNumber = event.block.number;
    info.save();

    CollectionTemplate.create(event.params.collectionAddress);
}

function fetchToken(registry: TokenRegistry, id: BigInt): Token {
    let tokenid = registry.id.concat('-').concat(id.toHex())

    let token = Token.load(tokenid)
    if (token == null) {
        token = new Token(tokenid)
        token.registry = registry.id
        token.identifier = id
        token.totalSupply = constants.BIGINT_ZERO
    }
    return token as Token
}

function registerTransfer(
    event: ethereum.Event,
    suffix: String,
    registry: TokenRegistry,
    operator: Account,
    from: Account,
    to: Account,
    id: BigInt,
    value: BigInt)
    : void {

    let token = fetchToken(registry, id)



    if (to.id == constants.ADDRESS_ZERO) {
        let id = event.transaction.hash.toHexString()
            .concat('-')
            .concat(token.id)
        let burnedToken = new BurnedToken(id);
        burnedToken.blockNumber = event.block.number;
        burnedToken.identifier = token.identifier;
        burnedToken.user = from.id;
        burnedToken.contract = event.address.toHexString();
        burnedToken.value = value;
        burnedToken.save();
        return
    }

    if (from.id == constants.ADDRESS_ZERO) {
        let createdToken = new CreatedToken(token.id);
        createdToken.blockNumber = event.block.number;
        createdToken.identifier = token.identifier;
        createdToken.creator = to.id;
        let collectionContract = Collection.bind(event.address);

        let resultURI = collectionContract.try_uri(token.identifier);

        if (!resultURI.reverted) {
            createdToken.uri = resultURI.value;
        } else {
            createdToken.uri = '';
        }

        createdToken.contract = event.address.toHexString();
        createdToken.value = value;
        createdToken.save();

        return;
    }
    if (from.id != constants.ADDRESS_ZERO && to.id != constants.ADDRESS_ZERO) {
        let tokenId = event.transaction.hash.toHexString()
            .concat('-')
            .concat(token.id)
        let transferToken = new TransferToken(tokenId);
        transferToken.blockNumber = event.block.number;
        transferToken.identifier = token.identifier;
        transferToken.from = from.id;
        transferToken.to = to.id;
        transferToken.contract = event.address.toHexString();
        transferToken.value = value;
        transferToken.save()
    }
}


export function handleTransferSingle(event: TransferSingleEvent): void {
    let registry = new TokenRegistry(event.address.toHex())
    let operator = new Account(event.params.operator.toHex())
    let from = new Account(event.params.from.toHex())
    let to = new Account(event.params.to.toHex())
    registry.save()
    operator.save()
    from.save()
    to.save()

    registerTransfer(
        event,
        "",
        registry,
        operator,
        from,
        to,
        event.params.id,
        event.params.value
    )
}

export function handleTransferBatch(event: TransferBatchEvent): void {
    let collection = CreatedCollection.load(event.address.toHexString());

    if (collection == null) {
        return
    }
    let registry = new TokenRegistry(event.address.toHex())
    let operator = new Account(event.params.operator.toHex())
    let from = new Account(event.params.from.toHex())
    let to = new Account(event.params.to.toHex())
    registry.save()
    operator.save()
    from.save()
    to.save()

    let ids = event.params.ids
    let values = event.params.values
    for (let i = 0; i < ids.length; ++i) {
        registerTransfer(
            event,
            "-".concat(i.toString()),
            registry,
            operator,
            from,
            to,
            ids[i],
            values[i]
        )
    }
}
