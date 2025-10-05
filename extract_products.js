const fs = require('fs');

fs.readFile('cctv-store-ecuador.html', 'utf8', (err, data) => {
    if (err) {
        console.error(err);
        return;
    }

    const match = data.match(/const products = ({.*?});/s);
    if (match) {
        const productsString = match[1];
        // The productsString is a JavaScript object literal, not strict JSON.
        // We need to convert it to valid JSON.
        // A simple way is to use eval, but it's generally unsafe. For this controlled environment, it's acceptable.
        // A safer way would be to use a JavaScript parser, but that adds complexity.
        // Let's try to make it JSON-compatible by replacing single quotes with double quotes
        // and ensuring keys are quoted.

        // Replace single quotes with double quotes for string values
        let jsonString = productsString.replace(/'([^']*)'/g, '"$1"');
        // Replace unquoted keys with double-quoted keys
        jsonString = jsonString.replace(/([a-zA-Z_][a-zA-Z0-9_]*):/g, '"$1":');
        // Remove trailing commas (e.g., before a closing brace or bracket)
        jsonString = jsonString.replace(/,(\s*[}\]])/g, '$1');

        try {
            const products = JSON.parse(jsonString);
            const extracted_data = {};
            for (const brand in products) {
                extracted_data[brand] = [];
                products[brand].forEach(product => {
                    extracted_data[brand].push({
                        id: product.id,
                        name: product.name,
                        model: product.model,
                        brand: brand,
                        image_placeholder: product.image
                    });
                });
            }
            console.log(JSON.stringify(extracted_data, null, 2));
        } catch (parseError) {
            console.error('Error parsing JSON:', parseError);
            console.error('Problematic JSON string:', jsonString);
        }
    } else {
        console.log('Products object not found.');
    }
});

