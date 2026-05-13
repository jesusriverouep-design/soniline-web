// 1. ESTADO INICIAL
let carrito = JSON.parse(localStorage.getItem('carrito-soniline')) || [];

function mostrarProductos(datos = productos) {
    const grid = document.getElementById('productos-grid');
    if (!grid) return;
    grid.innerHTML = '';

    let listaAMostrar = Array.isArray(datos) ? datos : 
        (datos === 'todos' ? productos : productos.filter(p => p.categoria.toLowerCase() === datos.toLowerCase()));

    listaAMostrar.forEach(p => {
        let imgFinal = (p.imagenes && p.imagenes.length > 0) ? p.imagenes[0] : (p.imagen || 'img/default.jpg');
        
        // --- 1. BADGES CIRCULARES (POPULAR Y NEW) ---
        let badgeHTML = '';
        if (p.status === 'popular') {
            badgeHTML = `<div class="badge-popular" title="Más vendido">🔥</div>`;
        } else if (p.status === 'nuevo') {
            badgeHTML = `<div class="badge-new-pro">⚡ NEW</div>`;
        }

        // --- 2. LÓGICA DE PRECIO TACHADO (AMAZON STYLE) ---
        let precioHTML = '';
        if (p.precioAnterior) {
            precioHTML = `
                <div style="display: flex; flex-direction: column;">
                    <span style="text-decoration: line-through; color: #888; font-size: 0.85rem;">$${p.precioAnterior}</span>
                    <span class="price">$${p.precio}</span>
                </div>`;
        } else {
            precioHTML = `<span class="price">$${p.precio}</span>`;
        }

        const estaAgotado = p.stock === false; 
        const claseAgotado = estaAgotado ? 'agotado' : '';
        const badgeAgotado = estaAgotado ? '<div class="badge-status badge-agotado-premium">AGOTADO</div>' : '';

        grid.innerHTML += `
            <div class="card ${claseAgotado}">
                ${badgeHTML} 
                ${badgeAgotado}
                <img src="${imgFinal}" loading="lazy" onclick="verDetalles(${p.id})" style="cursor:pointer" onerror="this.src='https://via.placeholder.com/300/1d4db5/ffffff?text=SONILINE'">
                
                <div onclick="verDetalles(${p.id})" style="cursor:pointer; padding: 10px 0;">
                    <h3 style="margin-bottom: 2px;">${p.nombre}</h3>
                    <small style="color: var(--azul-soniline); font-size: 0.7rem; font-weight: bold;">🔍 VER DETALLES</small>
                </div>

                ${precioHTML}
                <button class="btn-add" ${estaAgotado ? 'disabled style="background: #444;"' : `onclick="agregarAlCarrito(${p.id})"`}>
                    ${estaAgotado ? 'SIN STOCK' : 'AGREGAR'}
                </button>
            </div>`;
    });
}
// 3. LÓGICA DEL CARRITO (EL "MOTOR")
function agregarAlCarrito(id) {
    const producto = productos.find(p => p.id === id);
    if (!producto) return;

    const indice = carrito.findIndex(p => p.id === id);

    if (indice !== -1) {
        carrito[indice].cantidad++;
    } else {
        carrito.push({
            id: producto.id,
            nombre: producto.nombre,
            precio: producto.precio,
            cantidad: 1
        });
    }
    guardarYActualizar();
    abrirModalConfirmacion(producto.nombre);
}

function cambiarCantidad(index, cambio) {
    if (carrito[index]) {
        carrito[index].cantidad += cambio;
        if (carrito[index].cantidad <= 0) {
            carrito.splice(index, 1);
        }
        guardarYActualizar();
    }
}

function eliminarDelCarrito(index) {
    carrito.splice(index, 1);
    guardarYActualizar();
}

function guardarYActualizar() {
    localStorage.setItem('carrito-soniline', JSON.stringify(carrito));
    actualizarCarritoUI();
}

// 4. RENDERIZAR EL CARRITO (LA "VISTA")
function actualizarCarritoUI() {
    const lista = document.getElementById('lista-carrito');
    const contadorBurbuja = document.getElementById('cart-count');
    const totalTexto = document.getElementById('precio-total');
    
    if (!lista) return;
    lista.innerHTML = '';
    
    let sumaTotal = 0;
    let unidadesTotales = 0;

    if (carrito.length === 0) {
        lista.innerHTML = `<p style="text-align:center; padding:20px; color:#888;">Tu carrito está vacío</p>`;
    } else {
        carrito.forEach((p, index) => {
            const subtotal = p.precio * p.cantidad;
            sumaTotal += subtotal;
            unidadesTotales += p.cantidad;

            lista.innerHTML += `
                <div class="item-carrito">
                    <div style="flex: 1;">
                        <p style="margin:0; font-weight:bold; color: white; font-size: 0.9rem;">${p.nombre.toUpperCase()}</p>
                        <p style="margin:0; color:var(--azul-soniline); font-size: 0.85rem;">$${p.precio.toFixed(2)} c/u</p>
                    </div>
                    <div class="controles-cantidad">
                        <button class="btn-qty" onclick="cambiarCantidad(${index}, -1)">-</button>
                        <span class="qty-numero">${p.cantidad}</span>
                        <button class="btn-qty" onclick="cambiarCantidad(${index}, 1)">+</button>
                    </div>
                    <button class="btn-eliminar-item" onclick="eliminarDelCarrito(${index})">✕</button>
                </div>`;
        });
    }

    if (totalTexto) totalTexto.innerText = sumaTotal.toFixed(2);
    if (contadorBurbuja) contadorBurbuja.innerText = unidadesTotales;
}

// 5. MODALES Y NAVEGACIÓN
function abrirModalCarrito() {
    actualizarCarritoUI();
    document.getElementById('modal-carrito').style.display = 'block';
}

function cerrarModal(idModal = null) {
    if (idModal) {
        // Si le pasamos un ID, cerramos solo ese modal
        document.getElementById(idModal).style.display = 'none';
    } else {
        // Si no le pasamos nada (botón X), cerramos todos
        document.querySelectorAll('.modal').forEach(m => m.style.display = 'none');
    }
}

function abrirModalConfirmacion(nombre) {
    document.getElementById('detalle-confirmacion').innerText = nombre;
    document.getElementById('modal-confirmacion').style.display = 'block';
    
    // Solo cerramos el modal de confirmación, NO el de carrito
    setTimeout(() => {
        cerrarModal('modal-confirmacion');
    }, 1500); 
}
// 6. WHATSAPP (CON CANTIDADES)
function enviarWhatsApp() {
    if (carrito.length === 0) return;
    let mensaje = "¡Hola *SONILINE*! 👋 Me interesa esta cotización:\n\n";
    let granTotal = 0;
    carrito.forEach((p) => {
        const subtotal = p.precio * p.cantidad;
        granTotal += subtotal;
        mensaje += `🔹 *${p.cantidad}x* ${p.nombre.toUpperCase()} - *$${subtotal.toFixed(2)}*\n`;
    });
    mensaje += "\n━━━━━━━━━━━━━━━━━━━━━\n";
    mensaje += `💰 *TOTAL A PAGAR: $${granTotal.toFixed(2)}*\n`;
    mensaje += "━━━━━━━━━━━━━━━━━━━━━\n";
    mensaje += "_Enviado desde el Catálogo Web_";
    window.open(`https://wa.me/584247681211?text=${encodeURIComponent(mensaje)}`, '_blank');
}

// 7. CATEGORÍAS Y BUSCADOR
function cargarNavCategorias() {
    const nav = document.getElementById('nav-categorias');
    if (!nav || typeof listaCategorias === 'undefined') return;
    nav.innerHTML = '';
    listaCategorias.forEach(cat => {
        const btn = document.createElement('button');
        btn.className = `cat-btn ${cat.id === 'todos' ? 'active' : ''}`;
        btn.innerText = cat.nombre;
        btn.onclick = (e) => {
            document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const titulo = document.getElementById('category-title');
            if (titulo) titulo.innerText = cat.titulo.toUpperCase();
            mostrarProductos(cat.id);
        };
        nav.appendChild(btn);
    });
}

document.getElementById('inputBusqueda').addEventListener('input', (e) => {
    const texto = e.target.value.toLowerCase().trim();
    
    if (texto === "") { 
        mostrarProductos('todos'); 
        return; 
    }

    // BUSCADOR PLUS: Busca en TODO (Nombre, Modelo, Categoría y Descripción)
    const resultados = productos.filter(p => 
        p.nombre.toLowerCase().includes(texto) || 
        (p.modelo && p.modelo.toLowerCase().includes(texto)) ||
        (p.categoria && p.categoria.toLowerCase().includes(texto)) ||
        (p.descripcion && p.descripcion.toLowerCase().includes(texto))
    );

    mostrarProductos(resultados);

    // Mensaje premium si no hay resultados
    const grid = document.getElementById('productos-grid');
    if (resultados.length === 0) {
        grid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 60px; color: var(--texto-secundario);">
                <p style="font-size: 2.5rem; margin-bottom: 10px;">🔊</p>
                <p>No encontramos resultados para "<strong>${texto}</strong>"</p>
                <small>Intenta buscando una marca como 'Pioneer' o 'PowerSuPro'</small>
            </div>`;
    }
});

// 8. TEMA OSCURO
const themeToggle = document.getElementById('theme-toggle');
function switchTheme(theme) {
    if (theme === 'light') {
        document.documentElement.setAttribute('data-theme', 'light');
        document.getElementById('theme-icon').innerText = '☀️';
        localStorage.setItem('theme', 'light');
    } else {
        document.documentElement.removeAttribute('data-theme');
        document.getElementById('theme-icon').innerText = '🌙';
        localStorage.setItem('theme', 'dark');
    }
}
themeToggle.addEventListener('click', () => {
    const isLight = document.documentElement.getAttribute('data-theme') === 'light';
    switchTheme(isLight ? 'dark' : 'light');
});

// 9. ARRANQUE AL CARGAR
window.onload = () => {
    cargarNavCategorias();
    const saved = localStorage.getItem('theme') || 'dark';
    switchTheme(saved);
    mostrarProductos();
    actualizarCarritoUI();
};

window.onscroll = function() {
    const btn = document.getElementById("btnTop");
    if (btn) btn.style.display = (window.scrollY > 400) ? "block" : "none";
};

let indiceSlider = 0;

function verDetalles(id) {
    const p = productos.find(prod => prod.id === id);
    if (!p) return;

    indiceSlider = 0;
    const wrapper = document.getElementById('slider-wrapper');
    const specsCont = document.getElementById('detalles-specs');
    
    // --- 1. Lógica de Badges en el Modal (Fuego, Rayo, Agotado) ---
    let badgesModalHTML = '';
    const estaAgotado = p.stock === false;

    if (estaAgotado) {
        // Cinta de Agotado
        badgesModalHTML = `<div class="badge-status badge-agotado-premium">AGOTADO</div>`;
    } else {
        // Badge Popular (Fuego) - Esquina superior izquierda
        if (p.status === 'popular') {
            badgesModalHTML += `<div class="badge-popular" style="top: 15px; left: 15px;">🔥</div>`;
        }
        // Badge NEW (Rayo) - Debajo del fuego si ambos existen, o arriba si está solo
        if (p.status === 'nuevo') {
            let topPos = p.status === 'popular' ? '65px' : '15px';
            badgesModalHTML += `<div class="badge-new-pro" style="top: ${topPos}; left: 15px;"><span>⚡</span> NEW</div>`;
        }
    }

    // --- 2. Inyectar Badges al Contenedor del Slider ---
    const sliderContainer = wrapper.parentElement;
    // Limpiamos badges previos para que no se dupliquen
    const viejosBadges = sliderContainer.querySelectorAll('.badge-popular, .badge-new-pro, .badge-status');
    viejosBadges.forEach(b => b.remove());
    sliderContainer.insertAdjacentHTML('beforeend', badgesModalHTML);

    // --- 3. Cargar Nombre y Precio (Amazon Style) ---
    document.getElementById('detalles-nombre').innerText = p.nombre;
    document.getElementById('detalles-precio').innerText = `$${p.precio}`;

    const elMarca = document.getElementById('detalles-marca');
    if (p.marca) {
        elMarca.innerText = p.marca;
        elMarca.style.display = 'inline-block';
    } else {
        elMarca.style.display = 'none';
    }

    const elModelo = document.getElementById('detalles-modelo');
    if (p.modelo) {
        elModelo.innerText = p.modelo.toUpperCase();
        elModelo.style.display = 'block';
    } else {
        elModelo.style.display = 'none';
    }
    
    const precioCont = document.getElementById('detalles-precio');
    if (p.precioAnterior) {
        precioCont.innerHTML = `
            <span style="text-decoration: line-through; color: #888; font-size: 1.1rem; margin-right: 10px;">$${p.precioAnterior}</span>
            <span style="color: var(--azul-soniline); font-weight: bold;">$${p.precio}</span>
        `;
    } else {
        precioCont.innerHTML = `<span style="color: var(--azul-soniline); font-weight: bold;">$${p.precio}</span>`;
    }
    
    // --- 4. Cargar Imágenes al Slider ---
    wrapper.innerHTML = '';
    const fotos = p.imagenes && p.imagenes.length > 0 ? p.imagenes : [p.imagen || 'img/default.jpg'];
    fotos.forEach(img => {
        wrapper.innerHTML += `
            <img src="${img}" style="width: 100%; flex-shrink: 0; object-fit: contain; aspect-ratio: 1/1;" 
                 onerror="this.src='https://via.placeholder.com/500/1d4db5/ffffff?text=SONILINE'">`;
    });
    wrapper.style.transform = `translateX(0)`;

    // --- 5. Generar Puntos del Slider ---
    const puntosCont = document.getElementById('puntos-slider');
    puntosCont.innerHTML = '';
    fotos.forEach((_, i) => {
        puntosCont.innerHTML += `<div class="punto ${i === 0 ? 'activo' : ''}" style="width:8px; height:8px; border-radius:50%; background:${i === 0 ? 'white' : 'rgba(255,255,255,0.5)'};"></div>`;
    });

    // --- 6. Cargar Descripción y Especificaciones ---
    let htmlSpecs = `<p style="margin-bottom:15px; color:var(--texto-secundario);">${p.descripcion || ''}</p>`;
    if (p.specs) {
        htmlSpecs += '<ul style="list-style: none; padding: 0; margin: 0;">';
        for (let key in p.specs) {
            htmlSpecs += `
                <li style="border-bottom: 1px solid #333; padding: 10px 0; display: flex; justify-content: space-between; font-size: 0.9rem;">
                    <span style="color: var(--texto-secundario);">${key}:</span>
                    <span style="font-weight: bold; color: white;">${p.specs[key]}</span>
                </li>`;
        }
        htmlSpecs += '</ul>';
    } else {
        htmlSpecs += '<p style="color: #666; font-style: italic;">No hay especificaciones adicionales.</p>';
    }
    specsCont.innerHTML = htmlSpecs;

    // --- 7. Configurar Botón de Acción ---
    const btnAccion = document.getElementById('btn-agregar-detalles');
    if (estaAgotado) {
        btnAccion.innerText = "SIN STOCK";
        btnAccion.style.background = "#444";
        btnAccion.disabled = true;
    } else {
        btnAccion.innerText = "AÑADIR AL CARRITO";
        btnAccion.style.background = "var(--azul-soniline)";
        btnAccion.disabled = false;
        btnAccion.onclick = () => {
            agregarAlCarrito(p.id);
            cerrarModal('modal-detalles');
        };
    }

    // 8. Mostrar modal
    const modal = document.getElementById('modal-detalles');
    modal.style.display = 'block';
    modal.scrollTop = 0; 
    document.body.classList.add('modal-open');
}

// Y en tu función de cerrar modal, añade esto:
function cerrarModal(idModal) {
    const m = document.getElementById(idModal || 'modal-detalles');
    m.style.display = 'none';
    // Devolvemos el scroll al fondo
    document.body.classList.remove('modal-open');
}

function moverSlider(direccion) {
    const wrapper = document.getElementById('slider-wrapper');
    const totalFotos = wrapper.querySelectorAll('img').length;
    
    // Sumamos o restamos al índice
    indiceSlider += direccion;

    // Si llegamos al final, vuelve al principio
    if (indiceSlider >= totalFotos) {
        indiceSlider = 0;
    }
    // Si estamos al principio y damos atrás, va a la última
    if (indiceSlider < 0) {
        indiceSlider = totalFotos - 1;
    }

    // El truco: movemos la "tira" de fotos
    const desplazamiento = indiceSlider * 100;
    wrapper.style.transform = `translateX(-${desplazamiento}%)`;

    // Al final de la función moverSlider:
const puntos = document.querySelectorAll('#puntos-slider .punto');
puntos.forEach((p, i) => {
    p.style.background = i === indiceSlider ? '#1d4db5' : 'rgba(255,255,255,0.5)';
});
}