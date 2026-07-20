import fs from "fs";
import path from "path";

export const OUTPUT = path.join(
    process.cwd(),
    "public",
    "party-logos"
);

await fs.promises.mkdir(OUTPUT, {
    recursive: true
});

export async function download(url, slug) {

    const ext = path.extname(
        new URL(url).pathname
    ) || ".png";

    const file = path.join(
        OUTPUT,
        slug + ext
    );

    if (fs.existsSync(file))
        return file;

    const res = await fetch(url);

    if (!res.ok)
        throw new Error("Download failed");

    const buffer = Buffer.from(
        await res.arrayBuffer()
    );

    await fs.promises.writeFile(
        file,
        buffer
    );

    return file;
}