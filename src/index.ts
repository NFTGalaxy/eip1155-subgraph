import {
    ethereum,
    BigInt
} from '@graphprotocol/graph-ts'

import {
    Account,
    TokenRegistry,
    Token,
    Balance,
    Transfer,
} from '../generated/schema'

import {
    TransferBatch as TransferBatchEvent,
    TransferSingle as TransferSingleEvent,
    URI as URIEvent,
} from '../generated/IERC1155/IERC1155'

import {
    IERC1155MetadataURI
} from '../generated/IERC1155/IERC1155MetadataURI'

import {
    constants,
    events,
    integers,
    transactions,
} from '@amxx/graphprotocol-utils'

function replaceAll(input: string, search: string[], replace: string): string {
    let result = '';
    for (let i = 0; i < input.length; i++) {
        result += search.includes(input.charAt(i)) ? replace : input.charAt(i);
    }
    return result
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

function fetchBalance(token: Token, account: Account): Balance {
    let balanceid = token.id.concat('-').concat(account.id)
    let balance = Balance.load(balanceid)
    if (balance == null) {
        balance = new Balance(balanceid)
        balance.token = token.id
        balance.account = account.id
        balance.value = constants.BIGINT_ZERO
    }
    return balance as Balance
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
    let ev = new Transfer(events.id(event).concat(suffix))
    ev.transaction = transactions.log(event).id
    ev.timestamp = event.block.timestamp
    ev.token = token.id
    ev.operator = operator.id
    ev.from = from.id
    ev.to = to.id
    ev.value = value

    if (from.id == constants.ADDRESS_ZERO) {
        token.totalSupply = integers.increment(token.totalSupply, value)
    } else {
        let balance = fetchBalance(token, from)
        balance.value = integers.decrement(balance.value, value)
        balance.save()
        ev.fromBalance = balance.id
    }

    if (to.id == constants.ADDRESS_ZERO) {
        token.totalSupply = integers.decrement(token.totalSupply, value)
    } else {
        let balance = fetchBalance(token, to)
        balance.value = integers.increment(balance.value, value)
        balance.save()
        ev.toBalance = balance.id
    }

    // if (!token.URI || replaceAll(token.URI, ['&', '"', '\''], "").length === 0) {
    //     let contract = IERC1155MetadataURI.bind(event.address);
    //     let callResult = contract.try_uri(id);

    //     if (!callResult.reverted) {
    //         token.URI = callResult.value;
    //     }
    // }

    token.save()
    ev.save()
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


export function handleURI(event: URIEvent): void {
    let registry = new TokenRegistry(event.address.toHex())
    registry.save()

    let token = fetchToken(registry, event.params.id)
    token.URI = event.params.value
    token.save()
}
