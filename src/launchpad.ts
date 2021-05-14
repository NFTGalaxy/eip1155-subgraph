import {LaunchpadSale} from "../generated/schema";
import {PurchaseCard} from "../generated/Store/Store";


export function handlePurchaseCard(event: PurchaseCard): void {

    let id = event.address.toHexString()
        .concat('-')
        .concat(event.params._cardId.toString());

    let launchpadSale = new LaunchpadSale(id);

    launchpadSale.amount = event.params._amount;
    launchpadSale.blockNumber = event.block.number;
    launchpadSale.from = event.params._from.toHexString();
    launchpadSale.cardId = event.params._cardId;

    launchpadSale.save();
}
