const axios = require("axios");
const cheerio = require("cheerio");

async function extractPage(url) {
    try {
        const response = await axios.get(url, {
            headers: {
                "User-Agent": "Mozilla/5.0"
            },
            timeout: 30000
        });

        const $ = cheerio.load(response.data);

        // Remove unnecessary parts
        $("script, style, noscript, nav, footer, header").remove();

        const title = $("title").text().trim();

        const sections = [];

        // Keep headings
        $("h1, h2, h3, h4").each((_, element) => {
            const heading = $(element).text().replace(/\s+/g, " ").trim();

            if (heading) {
                sections.push(`HEADING: ${heading}`);
            }
        });

        // Keep paragraphs
        $("p").each((_, element) => {
            const paragraph = $(element).text().replace(/\s+/g, " ").trim();

            if (paragraph) {
                sections.push(paragraph);
            }
        });

        // Keep list items
        $("li").each((_, element) => {
            const item = $(element).text().replace(/\s+/g, " ").trim();

            if (item) {
                sections.push(`- ${item}`);
            }
        });

        const text = sections.join("\n");

        return {
            url,
            title,
            text
        };
    } catch (error) {
        console.error("PAGE EXTRACTION ERROR:", error.message);
        throw new Error("Unable to fetch or extract page");
    }
}

module.exports = { extractPage };