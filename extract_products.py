import re
import json

with open("cctv-store-ecuador.html", "r") as f:
    html_content = f.read()

# Find the products object in the script tag
match = re.search(r"const products = ({.*?});", html_content, re.DOTALL)
if not match:
    print("Could not find the products object in the HTML file.")
    exit()

products_str = match.group(1)

# Pre-process the JavaScript string to make it valid JSON
# 1. Replace single quotes with double quotes, but be careful with escaped single quotes
products_str = products_str.replace("\\\'", "\'") # Temporarily unescape single quotes
products_str = products_str.replace("\\'", "\'") # Handle another potential escape
products_str = products_str.replace("\"", "\'") # Replace double quotes with single quotes to normalize
products_str = products_str.replace("\n", " ") # Remove newlines for easier regex processing
products_str = re.sub(r"(\'[^\']*\')", lambda m: m.group(1).replace("\"", "\\\""), products_str) # Escape double quotes inside string literals
products_str = products_str.replace("\\'", "\"") # Replace single quotes with double quotes

# 2. Add double quotes around unquoted keys (e.g., id: becomes "id":)
# This regex looks for word characters followed by a colon, not preceded by a double quote
products_str = re.sub(r"([{,])\s*([a-zA-Z_][a-zA-Z0-9_]*):", r"\1"\2":", products_str)

# 3. Remove trailing commas from arrays and objects
# This regex looks for a comma followed by whitespace and a closing brace or bracket
products_str = re.sub(r",\s*([}\]])", r"\1", products_str)

# 4. Ensure all string values are properly quoted (this is tricky with mixed quotes, so we normalize to double quotes)
products_str = re.sub(r"\'(.*?)\'", r"\"\1\"", products_str)


try:
    products_data = json.loads(products_str)
    # Now extract the required information
    extracted_data = {}
    for brand, products in products_data.items():
        extracted_data[brand] = []
        for product in products:
            extracted_data[brand].append({
                'id': product.get('id'),
                'name': product.get('name'),
                'model': product.get('model'),
                'brand': brand,
                'image_placeholder': product.get('image')
            })

    for brand, prods in extracted_data.items():
        print(f"Brand: {brand.upper()}")
        for p in prods:
            print(f"  ID: {p['id']}, Name: {p['name']}, Model: {p['model']}, Image Placeholder: {p['image_placeholder'][:50]}...")

except json.JSONDecodeError as e:
    print(f"Error decoding JSON: {e}")
    print("Problematic string:", products_str) # for debugging

