const fs = require("fs");
const path = require("path");

const DATA_PATH = path.join(
    __dirname,
    "..",
    "data",
    "officialSources.json"
);

function loadSources() {
    return JSON.parse(
        fs.readFileSync(DATA_PATH, "utf-8")
    );
}

function searchOfficialWeb(task, state, city) {
    const sources = loadSources();

    const searchText = `${task} ${city} ${state}`.toLowerCase();

    const matches = sources.filter((source) => {
        if (
            source.state &&
            source.state.toLowerCase() !== state.toLowerCase()
        ) {
            return false;
        }

        return source.keywords.some((keyword) =>
            searchText.includes(keyword.toLowerCase())
        );
    });

    return matches.map((source) => ({
        id: source.id,
        name: source.source.name,
        url: source.source.url,
        type: source.source.type
    }));
}

module.exports = {
    searchOfficialWeb
};