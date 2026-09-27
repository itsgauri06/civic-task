function extractTaskData(pageText, url) {
    const result = {
        title: null,
        description: null,
        documentsNeeded: [],
        fee: null,
        estimatedTime: null,
        eligibility: null,
        sourceUrl: url
    };

    const lines = pageText
        .split("\n")
        .map(line => line.trim())
        .filter(Boolean);

    // -------------------------
    // Title
    // -------------------------

    const heading = lines.find(line =>
        line.startsWith("HEADING:")
    );

    if (heading) {
        result.title = heading.replace("HEADING:", "").trim();
    }

    // -------------------------
    // Description
    // -------------------------

    const descriptionLines = lines.filter(line =>
        !line.startsWith("HEADING:") &&
        !line.startsWith("-")
    );

    if (descriptionLines.length > 0) {
        result.description = descriptionLines
            .slice(0, 2)
            .join(" ");
    }

    // -------------------------
    // Documents / information
    // -------------------------

    const documentKeywords = [
        "aadhaar",
        "aadhar",
        "pan card",
        "identity proof",
        "address proof",
        "passport",
        "photograph"
    ];

    for (const line of lines) {
        const lowerLine = line.toLowerCase();

        for (const keyword of documentKeywords) {
            if (
                lowerLine.includes(keyword) &&
                !lowerLine.includes("no documents") &&
                !lowerLine.includes("not required")
            ) {
                if (!result.documentsNeeded.includes(keyword)) {
                    result.documentsNeeded.push(keyword);
                }
            }
        }
    }

    // -------------------------
    // Fee
    // -------------------------

    for (const line of lines) {
        const lowerLine = line.toLowerCase();

        if (
            lowerLine.includes("no fee") ||
            lowerLine.includes("no fees") ||
            lowerLine.includes("no cost") ||
            lowerLine.includes("no costs") ||
            lowerLine.includes("totally free")
        ) {
            result.fee = "No fee";
            break;
        }

        const feeMatch = line.match(/₹\s?[\d,]+/);

        if (feeMatch) {
            result.fee = feeMatch[0];
            break;
        }
    }

    // -------------------------
    // Estimated time
    // -------------------------

    for (const line of lines) {
        if (
            /\b\d+\s*(?:-|–|to)\s*\d+\s*(?:working\s*)?(?:days|hours|weeks)\b/i.test(line) ||
            /\b\d+\s*(?:working\s*)?(?:days|hours|weeks)\b/i.test(line)
        ) {
            result.estimatedTime = line;
            break;
        }
    }

    // -------------------------
    // Eligibility
    // -------------------------

    const eligibilityLines = lines.filter(line => {
        const lowerLine = line.toLowerCase();

        return (
            lowerLine.includes("eligible") ||
            lowerLine.includes("eligibility") ||
            lowerLine.includes("applicable") ||
            lowerLine.includes("enterprise")
        );
    });

    if (eligibilityLines.length > 0) {
        result.eligibility = eligibilityLines
            .slice(0, 5)
            .join(" ");
    }

    return result;
}

module.exports = { extractTaskData };