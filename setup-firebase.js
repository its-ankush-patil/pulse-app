import fs from 'fs';
import readline from 'readline';
import path from 'path';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const ask = (question) => new Promise((resolve) => rl.question(question, resolve));

async function main() {
  console.log('\n🔥 Welcome to the Firebase Setup Script for Tap Counter 🔥\n');
  console.log('To get started, follow these steps:');
  console.log('1. Go to https://console.firebase.google.com');
  console.log('2. Create a new Firebase project.');
  console.log('3. Add a "Web App" to your project (</> icon).');
  console.log('4. Copy the keys from the "firebaseConfig" object they provide.\n');

  console.log('Please paste your configuration keys below:\n');

  const apiKey = await ask('apiKey: ');
  const authDomain = await ask('authDomain: ');
  const projectId = await ask('projectId: ');
  const storageBucket = await ask('storageBucket (optional): ');
  const messagingSenderId = await ask('messagingSenderId (optional): ');
  const appId = await ask('appId: ');

  if (!apiKey || !projectId || !appId) {
    console.log('\n❌ Setup cancelled. Missing required fields (apiKey, projectId, appId are required).');
    rl.close();
    return;
  }

  const envContent = `VITE_FIREBASE_API_KEY=${apiKey}
VITE_FIREBASE_AUTH_DOMAIN=${authDomain}
VITE_FIREBASE_PROJECT_ID=${projectId}
VITE_FIREBASE_STORAGE_BUCKET=${storageBucket}
VITE_FIREBASE_MESSAGING_SENDER_ID=${messagingSenderId}
VITE_FIREBASE_APP_ID=${appId}
`;

  const envPath = path.resolve(process.cwd(), '.env.local');
  fs.writeFileSync(envPath, envContent);

  console.log(`\n✅ Successfully generated .env.local at ${envPath}!`);
  console.log('✅ Firebase is now configured for your app.');
  console.log('\n⚠️  Make sure to restart your Vite development server for changes to take effect. (Stop the current server and run `npm run dev` again)');
  
  rl.close();
}

main();
