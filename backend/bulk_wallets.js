const StellarSdk = require('@stellar/stellar-sdk');
const fs = require('fs');

async function main() {
    console.log("Generating 53 Freighter (Stellar) wallets and making transactions...");
    const server = new StellarSdk.Horizon.Server("https://horizon-testnet.stellar.org");
    const networkPassphrase = StellarSdk.Networks.TESTNET;

    const wallets = [];

    for (let i = 1; i <= 53; i++) {
        try {
            const pair = StellarSdk.Keypair.random();
            const publicKey = pair.publicKey();
            const secretKey = pair.secret();
            
            console.log(`[${i}/53] Generated: ${publicKey}`);
            
            // Fund with Friendbot
            console.log(`  - Funding via Friendbot...`);
            const response = await fetch(`https://friendbot.stellar.org?addr=${encodeURIComponent(publicKey)}`);
            await response.json();
            
            // Wait a moment for Horizon to index the account
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Make a transaction (Payment to self to prove it's active)
            console.log(`  - Submitting transaction...`);
            const account = await server.loadAccount(publicKey);
            
            const fee = await server.fetchBaseFee();
            
            const transaction = new StellarSdk.TransactionBuilder(account, {
                fee: fee,
                networkPassphrase,
            })
            .addOperation(StellarSdk.Operation.payment({
                destination: publicKey,
                asset: StellarSdk.Asset.native(),
                amount: "1.0", // Send 1 XLM to self
            }))
            .addMemo(StellarSdk.Memo.text('Attestra Tx'))
            .setTimeout(30)
            .build();
            
            transaction.sign(pair);
            
            const txResult = await server.submitTransaction(transaction);
            console.log(`  - Transaction successful! Hash: ${txResult.hash}`);
            
            wallets.push(publicKey);
        } catch (error) {
            console.error(`Error processing wallet ${i}:`, error.message);
        }
    }

    console.log("\n=================================");
    console.log("All 53 Wallet Addresses:");
    console.log("=================================");
    wallets.forEach((w, index) => console.log(`${index + 1}. ${w}`));
    
    fs.writeFileSync('53_wallets.txt', wallets.join('\n'));
    console.log("\nAddresses saved to 53_wallets.txt");
}

main().catch(console.error);
