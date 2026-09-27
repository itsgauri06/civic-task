function buildRoadmap(taskData) {
    return {
        title: taskData.title,
        description: taskData.description,
        sourceUrl: taskData.sourceUrl,

        steps: [
            {
                id: "step-1",
                title: taskData.title,
                description: taskData.description,
                documentsNeeded: taskData.documentsNeeded,
                fee: taskData.fee,
                estimatedTime: taskData.estimatedTime,
                eligibility: taskData.eligibility,
                sourceUrl: taskData.sourceUrl,
                dependsOn: []
            }
        ]
    };
}

module.exports = { buildRoadmap };