import {LaunchpadCardAdded, LaunchpadCardChanged, LaunchpadSale, LaunchpadStore} from "../generated/schema";
import {CardAdded, CardChanged, PurchaseCard, Store} from "../generated/Store/Store";
import {StoreAdded} from "../generated/Launchpad/Launchpad";

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
    let id = event.address.toHexString()
        .concat('-')
        .concat(event.params.collection.toHexString());
    let launchpadStore = new LaunchpadStore(id)

    launchpadStore.blockNumber = event.block.number;
    launchpadStore.collection = event.params.collection.toHexString();

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
