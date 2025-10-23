/**
 * DZ Shielding Tactical - Shopping Cart Script
 * Author: Cline
 * Date: 2025-10-23
 * Description: Manages all shopping cart functionality including adding, updating, and removing items,
 *              persisting the cart in localStorage, and generating a WhatsApp order message.
 */
document.addEventListener('DOMContentLoaded', () => {
    // Load cart from local storage or initialize an empty array
    let cart = JSON.parse(localStorage.getItem('cart')) || [];

    /**
     * Saves the current cart state to localStorage and triggers UI updates.
     */
    const saveCart = () => {
        localStorage.setItem('cart', JSON.stringify(cart));
        updateCartCount();
        renderCartItems(); // Re-render cart on any change
    };

    /**
     * Updates the cart item count badge in the navigation bar.
     */
    const updateCartCount = () => {
        const cartCountElements = document.querySelectorAll('#cart-count');
        const totalQuantity = cart.reduce((acc, item) => acc + item.quantity, 0);
        cartCountElements.forEach(el => {
            if (el) {
                el.textContent = totalQuantity;
            }
        });
    };

    /**
     * Adds a product to the cart. If the product already exists, it increments the quantity.
     * @param {object} product - The product object to add.
     */
    const addToCart = (product) => {
        const existingProductIndex = cart.findIndex(item => item.id === product.id);
        if (existingProductIndex > -1) {
            cart[existingProductIndex].quantity++;
        } else {
            cart.push({ ...product, quantity: 1 });
        }
        saveCart();
    };

    /**
     * Updates the quantity of a specific product in the cart.
     * @param {string} productId - The ID of the product to update.
     * @param {number} newQuantity - The new quantity.
     */
    const updateQuantity = (productId, newQuantity) => {
        const productIndex = cart.findIndex(item => item.id === productId);
        if (productIndex > -1) {
            if (newQuantity > 0) {
                cart[productIndex].quantity = newQuantity;
            } else {
                // If quantity is 0 or less, remove the item from the cart
                cart.splice(productIndex, 1);
            }
            saveCart();
        }
    };

    /**
     * Removes a product completely from the cart.
     * @param {string} productId - The ID of the product to remove.
     */
    const removeFromCart = (productId) => {
        cart = cart.filter(item => item.id !== productId);
        saveCart();
    };

    /**
     * Renders the cart items on the cart page.
     */
    const renderCartItems = () => {
        const cartItemsContainer = document.getElementById('cart-items-container');
        const cartTotalEl = document.getElementById('cart-total');

        // Only run this function if we are on the cart page
        if (!cartItemsContainer) return;

        cartItemsContainer.innerHTML = '';
        let total = 0;

        if (cart.length === 0) {
            cartItemsContainer.innerHTML = '<p class="text-center">Tu carrito está vacío.</p>';
        } else {
            const table = document.createElement('table');
            table.classList.add('table', 'table-dark', 'align-middle');
            table.innerHTML = `
                <thead>
                    <tr>
                        <th scope="col" style="width: 50%;">Producto</th>
                        <th scope="col" class="text-center">Cantidad</th>
                        <th scope="col" class="text-end">Subtotal</th>
                        <th scope="col" class="text-end"></th>
                    </tr>
                </thead>
                <tbody></tbody>
            `;
            const tbody = table.querySelector('tbody');
                cart.forEach(item => {
                    const subtotal = item.price * item.quantity;
                    total += subtotal;
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td data-label="Producto">
                            <div class="d-flex align-items-center">
                                <img src="${item.image}" alt="${item.name}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 4px;" class="me-3">
                                <span>${item.name}</span>
                            </div>
                        </td>
                        <td data-label="Cantidad" class="text-center">
                            <div class="input-group justify-content-center" style="width: 120px; margin: auto;">
                                <button class="btn btn-outline-secondary btn-sm quantity-change" data-id="${item.id}" data-change="-1">-</button>
                                <input type="text" class="form-control form-control-sm text-center" value="${item.quantity}" readonly style="background-color: #333; color: white;">
                                <button class="btn btn-outline-secondary btn-sm quantity-change" data-id="${item.id}" data-change="1">+</button>
                            </div>
                        </td>
                        <td data-label="Subtotal" class="text-end">S/ ${subtotal.toFixed(2)}</td>
                        <td class="text-end">
                            <button class="btn btn-danger btn-sm remove-item" data-id="${item.id}" title="Eliminar producto"><i class="fas fa-trash-alt"></i></button>
                        </td>
                    `;
                    tbody.appendChild(tr);
                });
            cartItemsContainer.appendChild(table);
        }

        if (cartTotalEl) {
            cartTotalEl.textContent = total.toFixed(2);
        }

        // Add event listeners for quantity changes and item removal after rendering
        addCartInteractionListeners();
    };

    /**
     * Attaches event listeners to the interactive elements within the cart (quantity buttons, remove buttons).
     */
    const addCartInteractionListeners = () => {
        document.querySelectorAll('.quantity-change').forEach(button => {
            button.addEventListener('click', () => {
                const productId = button.dataset.id;
                const change = parseInt(button.dataset.change);
                const product = cart.find(item => item.id === productId);
                if (product) {
                    updateQuantity(productId, product.quantity + change);
                }
            });
        });

        document.querySelectorAll('.remove-item').forEach(button => {
            button.addEventListener('click', () => {
                const productId = button.dataset.id;
                removeFromCart(productId);
            });
        });
    };

    /**
     * Attaches event listeners to all "Add to Cart" buttons on product pages.
     */
    const addProductPageListeners = () => {
        document.querySelectorAll('.add-to-cart-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const card = e.target.closest('.card-custom');
                const product = {
                    id: card.querySelector('.card-title').textContent.trim(),
                    name: card.querySelector('.card-title').textContent.trim(),
                    price: parseFloat(card.querySelector('.price').textContent.replace('Precio: S/ ', '').replace(',', '')),
                    image: card.querySelector('.card-img-top').src
                };
                addToCart(product);
                
                // Visual feedback for the user
                button.textContent = '¡Añadido!';
                button.disabled = true;
                setTimeout(() => {
                    button.textContent = 'Añadir al Carrito';
                    button.disabled = false;
                }, 1500);
            });
        });
    };

    /**
     * Initializes the checkout process by generating and opening a WhatsApp message.
     */
    const initializeCheckout = () => {
        const checkoutButton = document.getElementById('checkout-button');
        if (checkoutButton) {
            checkoutButton.addEventListener('click', () => {
                if (cart.length === 0) {
                    alert('Tu carrito está vacío. Añade productos antes de finalizar la compra.');
                    return;
                }
                const phoneNumber = '51936270270'; // Business WhatsApp number
                let message = '¡Hola! Quisiera realizar el siguiente pedido:\n\n';
                let total = 0;
                
                cart.forEach(item => {
                    const subtotal = item.price * item.quantity;
                    message += `*Producto:* ${item.name}\n`;
                    message += `*Cantidad:* ${item.quantity}\n`;
                    message += `*Subtotal:* S/ ${subtotal.toFixed(2)}\n\n`;
                    total += subtotal;
                });
                
                message += `*TOTAL DEL PEDIDO: S/ ${total.toFixed(2)}*\n\n`;
                message += `Quedo a la espera de las instrucciones para el pago. ¡Gracias!`;

                const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
                window.open(whatsappUrl, '_blank');
            });
        }
    };

    /**
     * Main function to initialize all parts of the script.
     */
    const init = () => {
        updateCartCount();
        addProductPageListeners();
        renderCartItems();
        initializeCheckout();
    };

    // Run the script
    init();
});
