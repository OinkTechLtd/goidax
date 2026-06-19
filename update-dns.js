const fs = require('fs');

const dnsList = [
  { name: "Cloudflare", primary: "1.1.1.1", secondary: "1.0.0.1" },
  { name: "Google", primary: "8.8.8.8", secondary: "8.8.4.4" },
  { name: "Quad9", primary: "9.9.9.9", secondary: "149.112.112.112" },
  { name: "NextDNS", primary: "45.90.28.0", secondary: "45.90.30.0" }
];

fs.writeFileSync('dns-list.json', JSON.stringify(dnsList, null, 2));
console.log('DNS list updated successfully!');