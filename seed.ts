import { seedPremiumMemberships } from "./src/db/seeder";
seedPremiumMemberships().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); })
