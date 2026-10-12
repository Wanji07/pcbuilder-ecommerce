const CART_STORAGE_KEY = "pcbuilder-cart";
const VAT_RATE = 0.12;
const MAX_QUANTITY = 99;
const pesoFormatter = new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2
});

function showCartFeedback(message) {
    const feedback = document.querySelector("#cart-feedback");
    if (feedback) {
        feedback.textContent = message;
    }
}

function readCart() {
    let savedCart;
    try {
        savedCart = localStorage.getItem(CART_STORAGE_KEY);
    } catch (error) {
        console.error("Unable to read the shopping cart from local storage.", error);
        return null;
    }

    if (savedCart === null) {
        return [];
    }

    try {
        const parsedCart = JSON.parse(savedCart);
        if (!Array.isArray(parsedCart) || !parsedCart.every(isValidCartItem)) {
            throw new TypeError("The saved cart has an invalid format.");
        }
        return parsedCart;
    } catch (error) {
        console.error("Unable to parse the saved shopping cart.", error);
        return null;
    }
}

function isValidCartItem(item) {
    return item !== null
        && typeof item === "object"
        && typeof item.id === "string"
        && typeof item.name === "string"
        && Number.isSafeInteger(item.price)
        && item.price >= 0
        && typeof item.image === "string"
        && item.image.startsWith("/src/assets/")
        && Number.isInteger(item.quantity)
        && item.quantity >= 1
        && item.quantity <= MAX_QUANTITY;
}

function saveCart(cart) {
    try {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
        return true;
    } catch (error) {
        console.error("Unable to save the shopping cart to local storage.", error);
        showCartFeedback("Your cart could not be saved. Check your browser storage settings and try again.");
        return false;
    }
}

function formatPrice(amount) {
    return pesoFormatter.format(amount);
}

function updateCartCount(cart) {
    const count = document.querySelector("#cart-count");
    if (count) {
        const itemCount = cart.reduce((total, item) => total + item.quantity, 0);
        count.textContent = itemCount > 0 ? `(${itemCount})` : "";
    }
}

function updateOrderSummary(cart) {
    const subtotal = cart.reduce((total, item) => total + item.price * item.quantity, 0);
    const vatIncluded = Math.round((subtotal * VAT_RATE / (1 + VAT_RATE)) * 100) / 100;

    document.querySelector("#cart-subtotal").textContent = formatPrice(subtotal);
    document.querySelector("#cart-vat").textContent = formatPrice(vatIncluded);
    document.querySelector("#cart-total").textContent = formatPrice(subtotal);
}

function renderCart(cart) {
    const cartItems = document.querySelector("#cart-items");
    if (!cartItems) {
        return;
    }

    cartItems.replaceChildren();
    updateCartCount(cart);
    updateOrderSummary(cart);

    if (cart.length === 0) {
        const emptyMessage = document.createElement("div");
        emptyMessage.className = "empty-cart";
        const message = document.createElement("p");
        message.textContent = "Your cart is empty.";
        const shopLink = document.createElement("a");
        shopLink.href = "shop.html";
        shopLink.textContent = "Browse components";
        emptyMessage.append(message, shopLink);
        cartItems.append(emptyMessage);
        return;
    }

    cart.forEach((item) => {
        const row = document.createElement("article");
        row.className = "cart-item";
        row.dataset.productId = item.id;

        const image = document.createElement("img");
        image.src = item.image;
        image.alt = "";
        image.className = "cart-item-image";

        const details = document.createElement("div");
        details.className = "cart-item-details";
        const name = document.createElement("h2");
        name.textContent = item.name;
        const unitPrice = document.createElement("p");
        unitPrice.textContent = `${formatPrice(item.price)} each`;
        details.append(name, unitPrice);

        const quantity = document.createElement("div");
        quantity.className = "quantity-control";
        quantity.setAttribute("aria-label", `Quantity for ${item.name}`);
        const decrease = document.createElement("button");
        decrease.type = "button";
        decrease.dataset.action = "decrease";
        decrease.setAttribute("aria-label", `Decrease ${item.name} quantity`);
        decrease.textContent = "−";
        const input = document.createElement("input");
        input.type = "number";
        input.min = "1";
        input.max = String(MAX_QUANTITY);
        input.value = String(item.quantity);
        input.dataset.quantity = "";
        input.setAttribute("aria-label", `Quantity for ${item.name}`);
        const increase = document.createElement("button");
        increase.type = "button";
        increase.dataset.action = "increase";
        increase.setAttribute("aria-label", `Increase ${item.name} quantity`);
        increase.textContent = "+";
        quantity.append(decrease, input, increase);

        const lineTotal = document.createElement("strong");
        lineTotal.className = "cart-item-total";
        lineTotal.textContent = formatPrice(item.price * item.quantity);

        const remove = document.createElement("button");
        remove.type = "button";
        remove.className = "remove-item";
        remove.dataset.action = "remove";
        remove.textContent = "Remove";
        remove.setAttribute("aria-label", `Remove ${item.name} from cart`);

        row.append(image, details, quantity, lineTotal, remove);
        cartItems.append(row);
    });
}

function getProductFromCard(card) {
    const name = card.querySelector(".product-info h3")?.textContent.trim();
    const image = card.querySelector(".product-image img")?.getAttribute("src");
    const displayedPrice = card.querySelector(".product-info strong")?.textContent;
    const price = Number(card.dataset.price ?? displayedPrice?.replace(/\D/g, ""));
    const id = card.dataset.productId ?? name?.toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

    if (!id || !name || !image || !Number.isSafeInteger(price) || price < 0) {
        throw new Error("A product is missing its cart data.");
    }

    return { id, name, image, price, quantity: 1 };
}

const productGrid = document.querySelector(".product-grid");
if (productGrid) {
    const savedCart = readCart();
    if (savedCart === null) {
        showCartFeedback("Your saved cart could not be loaded. Check the browser console for details.");
    } else {
        updateCartCount(savedCart);
    }

    productGrid.addEventListener("click", (event) => {
        const addButton = event.target.closest(".product-actions button");
        if (!addButton) {
            return;
        }

        const card = addButton.closest(".product-card");
        try {
            const product = getProductFromCard(card);
            const cart = readCart();
            if (cart === null) {
                showCartFeedback("Your saved cart could not be loaded. Check the browser console for details.");
                return;
            }

            const existingItem = cart.find((item) => item.id === product.id);
            if (existingItem) {
                existingItem.quantity = Math.min(existingItem.quantity + 1, MAX_QUANTITY);
            } else {
                cart.push(product);
            }

            if (saveCart(cart)) {
                updateCartCount(cart);
                showCartFeedback(`${product.name} added to your cart.`);
            }
        } catch (error) {
            console.error("Unable to add the product to the cart.", error);
            showCartFeedback("This product could not be added to your cart.");
        }
    });
}

const cartItemsElement = document.querySelector("#cart-items");
if (cartItemsElement) {
    let cart = readCart();
    if (cart === null) {
        showCartFeedback("Your saved cart could not be loaded. Check the browser console for details.");
        cart = [];
    }
    renderCart(cart);

    cartItemsElement.addEventListener("click", (event) => {
        const actionButton = event.target.closest("button[data-action]");
        if (!actionButton) {
            return;
        }

        const row = actionButton.closest(".cart-item");
        const item = cart.find((cartItem) => cartItem.id === row.dataset.productId);
        if (!item) {
            return;
        }

        if (actionButton.dataset.action === "remove") {
            cart = cart.filter((cartItem) => cartItem.id !== item.id);
        } else if (actionButton.dataset.action === "increase") {
            item.quantity = Math.min(item.quantity + 1, MAX_QUANTITY);
        } else if (actionButton.dataset.action === "decrease") {
            item.quantity = Math.max(item.quantity - 1, 1);
        }

        if (saveCart(cart)) {
            renderCart(cart);
            showCartFeedback("Your cart has been updated.");
        }
    });

    cartItemsElement.addEventListener("change", (event) => {
        if (!event.target.matches("input[data-quantity]")) {
            return;
        }

        const row = event.target.closest(".cart-item");
        const item = cart.find((cartItem) => cartItem.id === row.dataset.productId);
        if (!item) {
            return;
        }

        const quantity = Number(event.target.value);
        item.quantity = Number.isInteger(quantity)
            ? Math.min(Math.max(quantity, 1), MAX_QUANTITY)
            : 1;

        if (saveCart(cart)) {
            renderCart(cart);
            showCartFeedback("Your cart has been updated.");
        }
    });
}