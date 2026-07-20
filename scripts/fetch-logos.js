import fs from "fs";
import path from "path";

import { PARTIES } from "./parties.js";
import { sleep } from "./utils.js";
import { download, OUTPUT } from "./downloader.js";
import {
  getWikitext,
  extractLogoFilename,
  getImageURL,
  getPageImage
} from "./mediawiki.js";

const mapping = {};

async function processParty(party) {
  console.log(`\n🔍 ${party.title}`);

  try {
    const text = await getWikitext(party.title);

    let imageUrl = null;

    if (text) {
      const filename = extractLogoFilename(text);

      if (filename) {
        console.log(`   Found image: ${filename}`);
        imageUrl = await getImageURL(filename);
      }
    }

    if (!imageUrl) {
      console.log("   Trying page image...");
      imageUrl = await getPageImage(party.title);
    }

    if (!imageUrl) {
      console.log("   ❌ No image found");
      return;
    }

    const saved = await download(imageUrl, party.slug);

    const ext = path.extname(saved);

    mapping[party.title] = `/party-logos/${party.slug}${ext}`;

    console.log(`   ✅ Saved ${party.slug}${ext}`);

    await sleep(1000);

  } catch (err) {
    console.log(`   ❌ ${err.message}`);
  }
}

async function main() {

  console.log("Downloading party logos...\n");

  for (const party of PARTIES) {
    await processParty(party);
  }

  const libDir = path.join(process.cwd(), "lib");

  await fs.promises.mkdir(libDir, { recursive: true });

  const ts = `export const PARTY_LOGOS = ${JSON.stringify(mapping, null, 2)} as const;
`;

  await fs.promises.writeFile(
    path.join(libDir, "partyLogos.ts"),
    ts
  );

  console.log("\n===============================");
  console.log("Finished.");
  console.log(`Downloaded ${Object.keys(mapping).length} logos.`);
  console.log("Generated lib/partyLogos.ts");
}

main();