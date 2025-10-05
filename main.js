let cart = {};
let products = {};

fetch('./products_data.json')
    .then(response => response.json())
    .then(data => {
        products = data;
        renderProducts();
    });

function showMainTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(tc => tc.classList.remove('active'));
    document.querySelectorAll('.main-tab').forEach(t => t.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
    event.target.classList.add('active');
}

function createProductCard(product) {
    return `
        <div class="product-card">
            <img src="${product.image}" alt="${product.name}" class="product-img">
            <div class="product-name">${product.name}</div>
            <div class="product-model">${product.model}</div>
            <div class="product-specs">${product.specs}</div>
            ${product.dori ? `
                <div class="dori-info">
                    <strong>DORI - Distancias de reconocimiento:</strong>
                    <div class="dori-values">
                        <div>🔍 <strong>D</strong>etect: ${product.dori.detect}m</div>
                        <div>👁️ <strong>O</strong>bserve: ${product.dori.observe}m</div>
                        <div>👤 <strong>R</strong>ecognize: ${product.dori.recognize}m</div>
                        <div>🆔 <strong>I</strong>dentify: ${product.dori.identify}m</div>
                    </div>
                </div>
            ` : ''}
            <div class="price">${product.price.toFixed(2)}</div>
            <button class="add-btn" onclick="addToCart('${product.id}', '${product.name}', ${product.price})">
                ➕ Agregar al Carrito
            </button>
        </div>
    `;
}

function renderProducts() {
    document.getElementById('hikvision-cameras').innerHTML = products.hikvision.map(createProductCard).join('');
    document.getElementById('dahua-cameras').innerHTML = products.dahua.map(createProductCard).join('');
    document.getElementById('ezviz-cameras').innerHTML = products.ezviz.map(createProductCard).join('');
    document.getElementById('imou-cameras').innerHTML = products.imou.map(createProductCard).join('');
    document.getElementById('recorders').innerHTML = products.recorders.map(createProductCard).join('');
    document.getElementById('storage-devices').innerHTML = products.storage.map(createProductCard).join('');
}

function addToCart(id, name, price) {
    if (cart[id]) {
        cart[id].qty++;
    } else {
        cart[id] = { name, price, qty: 1 };
    }
    updateCart();
}

function addService(type) {
    const services = {
        labor: { name: 'Instalación Profesional por Cámara', price: 25, inputId: 'labor-qty' },
        cat5e: { name: 'Cable Cat5E Exterior + POE (por metro)', price: 1, inputId: 'cat5e-qty' },
        cat6e: { name: 'Cable Cat6E Exterior + POE (por metro)', price: 1.25, inputId: 'cat6e-qty' },
        repair: { name: 'Reparación Cableado sin Cable', price: 15, inputId: 'repair-qty' }
    };

    const service = services[type];
    const qty = parseInt(document.getElementById(service.inputId).value) || 0;
    
    if (qty > 0) {
        const id = `service-${type}`;
        cart[id] = {
            name: service.name,
            price: service.price,
            qty: qty
        };
        document.getElementById(service.inputId).value = 0;
        updateCart();
    } else {
        alert('Por favor ingrese una cantidad mayor a 0');
    }
}

function removeFromCart(id) {
    delete cart[id];
    updateCart();
}

function changeQty(id, delta) {
    if (cart[id]) {
        cart[id].qty += delta;
        if (cart[id].qty <= 0) {
            delete cart[id];
        }
        updateCart();
    }
}

function updateCart() {
    const cartItems = document.getElementById('cart-items');
    const cartTotal = document.getElementById('cart-total');
    
    if (Object.keys(cart).length === 0) {
        cartItems.innerHTML = '<p style="text-align: center; color: #999; padding: 20px;">El carrito está vacío</p>';
        cartTotal.textContent = 'Total: $0.00';
        return;
    }

    let total = 0;
    let html = '';

    for (const [id, item] of Object.entries(cart)) {
        const subtotal = item.price * item.qty;
        total += subtotal;
        html += `
            <div class="cart-item">
                <div class="cart-item-name">${item.name}<br><small style="color: #999;">${item.price.toFixed(2)} c/u</small></div>
                <div class="cart-item-qty">
                    <button class="qty-btn" onclick="changeQty('${id}', -1)">−</button>
                    <span style="min-width: 35px; text-align: center; font-weight: bold;">${item.qty}</span>
                    <button class="qty-btn" onclick="changeQty('${id}', 1)">+</button>
                </div>
                <div style="font-weight: bold; min-width: 85px; text-align: right; color: #667eea;">${subtotal.toFixed(2)}</div>
                <button class="remove-btn" onclick="removeFromCart('${id}')">✕</button>
            </div>
        `;
    }

    cartItems.innerHTML = html;
    cartTotal.textContent = `Total: ${total.toFixed(2)}`;
}

function printToPDF() {
    if (Object.keys(cart).length === 0) {
        alert('El carrito está vacío. Agregue productos antes de generar el PDF.');
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(22);
    doc.setTextColor(102, 126, 234);
    doc.text('COTIZACIÓN - CCTV STORE ECUADOR', 105, 20, { align: 'center' });
    
    doc.setDrawColor(102, 126, 234);
    doc.setLineWidth(0.5);
    doc.line(20, 25, 190, 25);
    
    // Date and info
    doc.setFontSize(10);
    doc.setTextColor(80, 80, 80);
    const fecha = new Date().toLocaleDateString('es-EC', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
    doc.text(`Fecha: ${fecha}`, 20, 35);
    doc.text('Válida por 15 días', 150, 35);
    
    // Section title
    doc.setFontSize(13);
    doc.setTextColor(0, 0, 0);
    doc.text('DETALLE DE PRODUCTOS Y SERVICIOS', 20, 48);
    
    doc.setLineWidth(0.3);
    doc.line(20, 50, 190, 50);
    
    let y = 58;
    let total = 0;
    
    doc.setFontSize(9);
    
    // Table header
    doc.setFillColor(102, 126, 234);
    doc.rect(20, y - 5, 170, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.text('DESCRIPCIÓN', 22, y);
    doc.text('CANT.', 135, y);
    doc.text('PRECIO UNIT.', 150, y);
    doc.text('SUBTOTAL', 175, y);
    
    y += 10;
    doc.setTextColor(0, 0, 0);
    
    // Items
    for (const [id, item] of Object.entries(cart)) {
        if (y > 260) {
            doc.addPage();
            y = 20;
        }
        
        const subtotal = item.price * item.qty;
        total += subtotal;
        
        // Wrap long text
        const splitText = doc.splitTextToSize(item.name, 110);
        doc.text(splitText, 22, y);
        
        doc.text(item.qty.toString(), 140, y, { align: 'right' });
        doc.text(`${item.price.toFixed(2)}`, 168, y, { align: 'right' });
        doc.text(`${subtotal.toFixed(2)}`, 188, y, { align: 'right' });
        
        y += splitText.length * 5 + 3;
        
        // Line separator
        doc.setDrawColor(220, 220, 220);
        doc.line(20, y, 190, y);
        y += 5;
    }
    
    // Total section
    y += 5;
    doc.setLineWidth(0.8);
    doc.setDrawColor(102, 126, 234);
    doc.line(130, y, 190, y);
    y += 8;
    
    doc.setFontSize(14);
    doc.setTextColor(102, 126, 234);
    doc.text('TOTAL:', 150, y);
    doc.setFontSize(16);
    doc.text(`${total.toFixed(2)}`, 188, y, { align: 'right' });
    
    // Footer
    y += 15;
    if (y > 250) {
        doc.addPage();
        y = 20;
    }
    
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text('• Todos los precios incluyen IVA 15%', 20, y);
    doc.text('• Cotización válida por 15 días calendario', 20, y + 5);
    doc.text('• Garantía: 1 año en equipos, 6 meses en instalación', 20, y + 10);
    
    y += 20;
    doc.setFontSize(10);
    doc.setTextColor(102, 126, 234);
    doc.text('CONTACTO:', 20, y);
    doc.setTextColor(80, 80, 80);
    doc.text('Email: jqk.juarez@gmail.com', 20, y + 5);
    doc.text('WhatsApp: +593 98-709-6197', 20, y + 10);
    doc.text('Dirección: Quito - Ecuador', 20, y + 15);
    
    // Footer line
    doc.setDrawColor(102, 126, 234);
    doc.setLineWidth(0.5);
    doc.line(20, 285, 190, 285);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('CCTV Store Ecuador - Soluciones Profesionales en Videovigilancia', 105, 290, { align: 'center' });
    
    doc.save(`Cotizacion_CCTV_${fecha.replace(/ /g, '_')}.pdf`);
}

// Initialize
updateCart();
