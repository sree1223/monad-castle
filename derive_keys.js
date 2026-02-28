require('dotenv').config();
const { Wallet } = require('ethers');
const fs = require('fs');
const path = require('path');

const phrase = process.env.PHRASE;

if (!phrase) {
    console.error("PHRASE not found in .env");
    process.exit(1);
}

const wallet = Wallet.fromPhrase(phrase);

console.log(`Public Key (Address): ${wallet.address}`);
console.log(`Private Key: ${wallet.privateKey}`);

// Update .env file
const envPath = path.join(__dirname, '.env');
let envContent = fs.readFileSync(envPath, 'utf8');

// Update PRIVATE_KEY and PUBLIC_KEY (using address as public key as common in crypto)
// In crypto context, when people say public key they usually mean address, but let me check.
// Ethers also has a public key.
const publicKey = wallet.publicKey;

envContent = envContent.replace(/PRIVATE_KEY=.*/, `PRIVATE_KEY=${wallet.privateKey}`);
envContent = envContent.replace(/PUBLIC_KEY=.*/, `PUBLIC_KEY=${wallet.address}`);

fs.writeFileSync(envPath, envContent);
console.log("Updated .env with keys.");
