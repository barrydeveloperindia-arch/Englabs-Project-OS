const fs = require('fs');

const template = {
    "projectId": "",
    "client": "",
    "planning": {
        "value": 0,
        "budget": 0,
        "deliveryTerms": "TBD",
        "poConfirmed": false,
        "startDate": new Date().toISOString().split('T')[0],
        "poNumber": "PENDING"
    },
    "production": {
        "currentStage": "Engineering Design",
        "stages": [
            { "name": "Engineering Design", "status": "In Progress" },
            { "name": "Machine Processing", "status": "Pending" },
            { "name": "Workshop Fabrication", "status": "Pending" },
            { "name": "Sanding", "status": "Pending" },
            { "name": "Painting", "status": "Pending" },
            { "name": "Drying", "status": "Pending" },
            { "name": "Finishing", "status": "Pending" },
            { "name": "Final Packaging", "status": "Pending" }
        ]
    },
    "metrics": {
        "totalComponents": 0,
        "materialConsumption": "Tracking active...",
        "workforce": ["TBD"]
    },
    "financials": {
        "vendorName": "TBD",
        "vendorLocation": "TBD",
        "dispatchBudget": null,
        "totalCost": 0,
        "profitLoss": null,
        "deliveryFeeMode": "To pay basis",
        "poNumber": "PENDING"
    }
};

const projects = [
    { id: 'C5487', client: 'EndureAir' },
    { id: 'C5488', client: 'RND Mechanical' },
    { id: 'C5489', client: 'Aebocode' },
    { id: 'C5490', client: 'Orient Electric 1' },
    { id: 'C5491', client: 'Orient Electric 2' }
];

projects.forEach(p => {
    const data = JSON.parse(JSON.stringify(template));
    data.projectId = p.id;
    data.client = p.client;
    fs.writeFileSync('data/' + p.id + '.json', JSON.stringify(data, null, 4));
});
console.log('Generated 5 JSON project files in data/');
