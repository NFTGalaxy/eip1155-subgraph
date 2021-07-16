import {
    LaunchpadCardAdded,
    LaunchpadCardChanged, LaunchpadOwner,
    LaunchpadSale,
    LaunchpadStore, LaunchpadStoreAdmin
} from "../generated/schema";
import {
    CardAdded,
    CardChanged,
    PurchaseCard,
    RoleAdminChanged,
    RoleGranted,
    RoleRevoked,
    Store
} from "../generated/Store/Store";
import {StoreAdded, OwnershipTransferred} from "../generated/Launchpad/Launchpad";
import {removeEmptyEntity, ZERO, ZERO_ADDRESS} from "./helpers/common";
import {log} from '@graphprotocol/graph-ts'

export function handlePurchaseCard(event: PurchaseCard): void {
    let id = event.address.toHexString()
        .concat('-')
        .concat(event.params._cardId.toString());

    let launchpadSale = new LaunchpadSale(id);

    launchpadSale.amount = event.params._amount;
    launchpadSale.blockNumber = event.block.number;
    launchpadSale.buyer = event.params._buyer.toHexString();
    launchpadSale.seller = event.params._seller.toHexString();

    let storeContract = Store.bind(event.address);

    let cardInfo = storeContract.try_getCardInfo(event.params._cardId);

    if (!cardInfo.reverted) {
        launchpadSale.tokenId = cardInfo.value.value1;
    }

    let collection = storeContract.try_collection();

    if (!collection.reverted) {
        launchpadSale.collection = collection.value.toHexString();
    }

    launchpadSale.save();
}


export function handleStoreAdded(event: StoreAdded): void {
    let launchpadStore = new LaunchpadStore(event.params.store.toHexString())
    //
    launchpadStore.blockNumber = event.block.number;
    launchpadStore.collection = event.params.collection;

    let storeContract = Store.bind(event.address)

    let callResult = storeContract.try_LAUNCHPAD_ADMIN()

    if (!callResult.reverted) {
        launchpadStore.admin = callResult.value;
    }

    let callResultDuration = storeContract.try_saleDuration()

    if (!callResultDuration.reverted) {
        launchpadStore.saleDuration = callResultDuration.value;
    } else {
        launchpadStore.saleDuration = ZERO;
    }

    let callResultSale = storeContract.try_startSale()

    if (!callResultSale.reverted) {
        launchpadStore.saleDuration = callResultSale.value;
    } else {
        launchpadStore.saleDuration = ZERO;
    }

    let paymentToken = storeContract.try_paymentToken()

    if (!paymentToken.reverted) {
        launchpadStore.paymentToken = paymentToken.value;
    }

    let salesPerson = storeContract.try_salesPerson()

    if (!salesPerson.reverted) {
        launchpadStore.salesPerson = salesPerson.value;
    }

    let limitPerWallet = storeContract.try_limitPerWallet()

    if (!limitPerWallet.reverted) {
        launchpadStore.limitPerWallet = limitPerWallet.value;
    } else {
        launchpadStore.limitPerWallet = ZERO;
    }

    let tierSalePeriod = storeContract.try_tierSalePeriod()

    if (!tierSalePeriod.reverted) {
        launchpadStore.tierSalePeriod = tierSalePeriod.value
    } else {
        launchpadStore.tierSalePeriod = ZERO;
    }

    let launchpadFee = storeContract.try_launchpadFee();

    if (!launchpadFee.reverted) {
        launchpadStore.launchpadFee = launchpadFee.value;
    } else {
        launchpadStore.launchpadFee = ZERO;
    }

    launchpadStore.save();
}

export function handleCardAdded(event: CardAdded): void {
    let id = event.address.toHexString()
        .concat('-')
        .concat(event.params._cardId.toString());
    let launchpadCardAdded = new LaunchpadCardAdded(id);

    launchpadCardAdded.amount = event.params._totalAmount;
    launchpadCardAdded.blockNumber = event.block.number;
    launchpadCardAdded.tokenId = event.params._tokenId;
    launchpadCardAdded.from = event.params._from.toHexString();
    launchpadCardAdded.basePrice = event.params._basePrice;

    let storeContract = Store.bind(event.address);
    let collection = storeContract.try_collection();

    if (!collection.reverted) {
        launchpadCardAdded.collection = collection.value.toHexString();
    }
    launchpadCardAdded.save();
}


export function handleCardChanged(event: CardChanged): void {
    let id = event.address.toHexString()
        .concat('-')
        .concat(event.params._cardId.toString());


    let storeContract = Store.bind(event.address);

    let cardInfo = storeContract.try_getCardInfo(event.params._cardId);

    if (!cardInfo.reverted) {
        let launchpadCardChanged = new LaunchpadCardChanged(id);
        launchpadCardChanged.tokenId = cardInfo.value.value1;
        launchpadCardChanged.totalAmount = cardInfo.value.value2;
        launchpadCardChanged.currentAmount = cardInfo.value.value3;
        launchpadCardChanged.basePrice = cardInfo.value.value4;

        let collection = storeContract.try_collection();

        if (!collection.reverted) {
            launchpadCardChanged.collection = collection.value.toHexString();
        }

        launchpadCardChanged.save();
    }
}


export function handleOwnershipTransferred(event: OwnershipTransferred): void {
    let contractId = event.address.toHexString();
    let owner = LaunchpadOwner.load(contractId);

    if (owner == null) {
        owner = new LaunchpadOwner(contractId);
        owner.contract = event.address;
    }

    owner.owner = event.params.newOwner;
    owner.prevOwner = event.params.previousOwner;
    owner.save();
}

export function handleRoleGranted(event: RoleGranted): void {
    let id = event.address.toHexString()
        .concat('-')
        .concat(event.params.account.toHexString())

    let role = LaunchpadStoreAdmin.load(id)

    if (role == null) {
        role = new LaunchpadStoreAdmin(id);
    }

    role.admin = event.params.account;

    let store = LaunchpadStore.load(event.address.toHexString());

    if (store == null) {
        return
    }

    role.store = event.address;
    role.role = event.params.role.toHexString();

    role.save();
}

export function handleRoleRevoked(event: RoleRevoked): void {
    let id = event.address.toHexString()
        .concat('-')
        .concat(event.params.account.toHexString())

    let role = LaunchpadStoreAdmin.load(id)

    if (role == null) {
        return;
    }
    removeEmptyEntity('LaunchpadStoreAdmins', id);
}

export function handleRoleAdminChanged(event: RoleAdminChanged): void {
    // let id = event.address.toHexString()
    //     .concat('-')
    //     .concat(event.params..toHexString())
    //
    // let role = LaunchpadStoreAdmins.load(id)
    //
    // if (role == null) {
    //     return;
    // }

}
