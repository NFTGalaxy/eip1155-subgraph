import {
    Account, ContractBlockInfo,
    CreatedCollection, CreatedToken,
    OwnershipTransferred, Token,
    TokenRegistry,
    Transaction,
    Transfer
} from "../generated/schema";
import {ethereum, log} from "@graphprotocol/graph-ts/index";

import {
    BigInt,
} from "@graphprotocol/graph-ts";
import {CollectionCreated, Collections} from "../generated/CollectionFactory/Collections";
import {Collection} from "../generated/CollectionFactory/Collection";
import {constants} from "@amxx/graphprotocol-utils/index";
import {
    TransferBatch as TransferBatchEvent,
    TransferSingle as TransferSingleEvent
} from "../generated/IERC1155/IERC1155";


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

    let resultURI = collection.try_uri(new BigInt(0));
    log.debug('collection name: {}', [resultURI.value])

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
}

function fetchToken(registry: TokenRegistry, id: BigInt): Token {

    let tokenid = registry.id.concat('-').concat(id.toHex())
    log.debug('tokenId {}', [tokenid])

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

    if (from.id != constants.ADDRESS_ZERO) {
        return
    }

    let createdToken = new CreatedToken(token.id);

    createdToken.blockNumber = event.block.number;
    createdToken.identifier = token.identifier;
    createdToken.creator = to.id;
    createdToken.uri = token.URI;
    createdToken.contract = event.address.toHexString();
    createdToken.save();
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
