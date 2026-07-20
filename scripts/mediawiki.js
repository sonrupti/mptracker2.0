const API = "https://en.wikipedia.org/w/api.php";

const HEADERS = {
    "User-Agent": "MPTracker/1.0"
};

async function wikiRequest(params) {
    const url = new URL(API);

    Object.entries(params).forEach(([k, v]) => {
        url.searchParams.set(k, v);
    });

    url.searchParams.set("format", "json");
    url.searchParams.set("origin", "*");

    const res = await fetch(url, {
        headers: HEADERS
    });

    if (!res.ok) {
        throw new Error(`Wikipedia API ${res.status}`);
    }

    return res.json();
}

export async function getWikitext(title) {

    const data = await wikiRequest({
        action: "query",
        redirects: "1",
        prop: "revisions",
        rvprop: "content",
        rvslots: "main",
        titles: title
    });

    const pages = data.query.pages;

    const page = Object.values(pages)[0];

    if (!page.revisions)
        return null;

    return page.revisions[0].slots.main.content;
}

export function extractLogoFilename(text) {

    const fields = [
        "logo",
        "logo_image",
        "logo_file",
        "symbol",
        "symbol_image",
        "emblem",
        "party_logo"
    ];

    const lines = text.split("\n");

    for (const line of lines) {

        for (const field of fields) {

            const regex = new RegExp(
                "^\\s*\\|\\s*" + field + "\\s*=\\s*(.+)$",
                "i"
            );

            const m = line.match(regex);

            if (!m)
                continue;

            let value = m[1];

            value = value.replace(/\[\[/g, "");
            value = value.replace(/\]\]/g, "");

            value = value.split("|")[0];

            value = value.replace(/^File:/i, "");
            value = value.replace(/^Image:/i, "");

            return value.trim();
        }
    }

    return null;
}

export async function getImageURL(filename) {

    const data = await wikiRequest({
        action: "query",
        titles: "File:" + filename,
        prop: "imageinfo",
        iiprop: "url"
    });

    const pages = data.query.pages;

    const page = Object.values(pages)[0];

    if (!page.imageinfo)
        return null;

    return page.imageinfo[0].url;
}

export async function getPageImage(title) {

    const data = await wikiRequest({
        action: "query",
        redirects: "1",
        prop: "pageimages",
        piprop: "original",
        titles: title
    });

    const pages = data.query.pages;

    const page = Object.values(pages)[0];

    return page.original?.source ?? null;
}