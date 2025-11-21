/* app.js - Shopping Mart simple SPA (vanilla JS)
   Features:
   - Product listing, search
   - Add to cart, remove
   - Cart persists in localStorage
   - Checkout summary (no real payments)
*/

/* -------------------------
   Simple product catalog
   -------------------------*/
const PRODUCTS = [
  { id: "p1", name: "Fresh Apples (1kg)", price: 3.50, image: "https://via.placeholder.com/400x300?text=Apples" , desc: "Crisp and juicy apples."},
  { id: "p2", name: "Bananas (1 bunch)", price: 2.00, image: "https://via.placeholder.com/400x300?text=Bananas" , desc: "Sweet yellow bananas."},
  { id: "p3", name: "Whole Wheat Bread", price: 1.80, image: "https://via.placeholder.com/400x300?text=Bread" , desc: "Freshly baked bread."},
  { id: "p4", name: "Milk 1L", price: 1.20, image: "https://via.placeholder.com/400x300?text=Milk" , desc: "Pasteurized milk."},
  { id: "p5", name: "Eggs (6pcs)", price: 2.30, image: "https://via.placeholder.com/400x300?text=Eggs" , desc: "Farm fresh eggs."},
  { id: "p6", name: "Orange Juice 500ml", price: 2.75, image: "https://via.placeholder.com/400x300?text=Orange+Juice" , desc: "Natural orange juice."},
  { id: "p7", name: "Tomatoes (1kg)", price: 2.10, image: "https://via.placeholder.com/400x300?text=Tomatoes" , desc: "Red and ripe tomatoes."},
  { id: "p8", name: "Cheddar Cheese (200g)", price: 4.25, image: "https://via.placeholder.com/400x300?text=Cheese" , desc: "Aged cheddar."},
];

/* -------------------------
   LocalStorage cart helpers
   -------------------------*/
const CART_KEY = "shopping_mart_cart_v1";
function loadCart() {
  try {
    const raw = localStorage.getItem(CART_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    console.error("Failed to load cart:", e);
    return {};
  }
}
function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}
function cartItemCount(cart) {
  return Object.values(cart).reduce((s, q) => s + q, 0);
}

/* -------------------------
   Basic routing & DOM refs
   -------------------------*/
const app = document.getElementById("app");
const searchInput = document.getElementById("search-input");
const cartCountEl = document.getElementById("cart-count");
const yearEl = document.getElementById("year");
yearEl.textContent = new Date().getFullYear();

let cart = loadCart();

/* Update cart count UI */
function refreshCartCount() {
  cartCountEl.textContent = cartItemCount(cart);
}

/* -------------------------
   Render Views
   -------------------------*/
function renderHome() {
  document.title = "Shopping Mart — Home";
  app.innerHTML = `
    <section class="view hero" aria-labelledby="hero-title">
      <div>
        <h1 id="hero-title">Welcome to Shopping Mart</h1>
        <p>Browse fresh groceries and essentials. Simple, fast, and responsive.</p>
        <p style="margin-top:12px;">
          <button class="btn" id="start-shopping">Start Shopping</button>
        </p>
      </div>
      <div style="min-width:220px; text-align:right;">
        <img src="https://via.placeholder.com/320x180?text=Shopping+Mart" alt="Shopping cart illustration" style="width:100%; border-radius:10px;" />
      </div>
    </section>

    <section class="view" aria-labelledby="featured-title">
      <h2 id="featured-title">Featured Products</h2>
      <div id="products-root" class="products-grid" role="list"></div>
    </section>
  `;
  document.getElementById("start-shopping").addEventListener("click", () => navigateTo("products"));
  renderProductGrid(PRODUCTS);
}

function renderProductGrid(items) {
  const root = document.getElementById("products-root");
  if (!root) return;
  root.innerHTML = items.map(prodCardHtml).join("");
  // Attach listeners
  document.querySelectorAll("[data-add]").forEach(btn => {
    btn.addEventListener("click", e => {
      const id = e.currentTarget.getAttribute("data-add");
      addToCart(id);
    });
  });
}

/* product card HTML */
function prodCardHtml(p) {
  return `
    <article class="card" role="listitem" aria-labelledby="p-${p.id}">
      <img src="${p.image}" alt="${p.name}" />
      <h3 id="p-${p.id}">${escapeHtml(p.name)}</h3>
      <p>${escapeHtml(p.desc)}</p>
      <div class="price">
        <div><strong>$${p.price.toFixed(2)}</strong></div>
        <div>
          <button class="btn" data-add="${p.id}" aria-label="Add ${escapeHtml(p.name)} to cart">Add</button>
        </div>
      </div>
    </article>
  `;
}

/* Products page (searchable) */
function renderProductsView(query = "") {
  document.title = "Shopping Mart — Products";
  const q = (query || "").trim().toLowerCase();
  const filtered = PRODUCTS.filter(p => p.name.toLowerCase().includes(q) || p.desc.toLowerCase().includes(q));
  app.innerHTML = `
    <section class="view" aria-labelledby="products-title">
      <h1 id="products-title">Products</h1>
      <p>${filtered.length} product(s) found.</p>
      <div id="products-root" class="products-grid" role="list"></div>
    </section>
  `;
  renderProductGrid(filtered);
}

/* Cart view */
function renderCartView() {
  document.title = "Shopping Mart — Cart";
  const items = Object.keys(cart).map(id => {
    const product = PRODUCTS.find(p => p.id === id);
    return { ...product, qty: cart[id] };
  });

  if (items.length === 0) {
    app.innerHTML = `
      <section class="view">
        <h1>Your cart is empty</h1>
        <p>Add items from the <button class="btn" id="back-to-products">Products</button> page.</p>
      </section>
    `;
    document.getElementById("back-to-products").addEventListener("click", () => navigateTo("products"));
    return;
  }

  const rows = items.map(it => `
    <tr>
      <td><img src="${it.image}" alt="${escapeHtml(it.name)}" /></td>
      <td>${escapeHtml(it.name)}</td>
      <td>$${it.price.toFixed(2)}</td>
      <td>
        <label class="sr-only" for="qty-${it.id}">Quantity for ${escapeHtml(it.name)}</label>
        <input id="qty-${it.id}" type="number" min="1" value="${it.qty}" style="width:64px;padding:6px;border-radius:6px;border:1px solid #ddd;" data-qty="${it.id}" />
      </td>
      <td>$${(it.price * it.qty).toFixed(2)}</td>
      <td><button class="btn secondary" data-remove="${it.id}">Remove</button></td>
    </tr>
  `).join("");

  const total = items.reduce((s, i) => s + i.price * i.qty, 0);

  app.innerHTML = `
    <section class="view" aria-labelledby="cart-title">
      <h1 id="cart-title">Your Cart</h1>
      <table class="cart-table" aria-describedby="cart-desc">
        <thead>
          <tr><th>Product</th><th>Name</th><th>Price</th><th>Qty</th><th>Subtotal</th><th>Action</th></tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>

      <div class="totals">
        <div class="box">
          <p><strong>Total:</strong> $${total.toFixed(2)}</p>
          <p style="margin-top:10px;">
            <button class="btn" id="proceed-checkout">Proceed to Checkout</button>
            <button class="btn secondary" id="clear-cart">Clear Cart</button>
          </p>
        </div>
      </div>
    </section>
  `;

  // Listeners: remove, qty change, proceed
  document.querySelectorAll("[data-remove]").forEach(btn => {
    btn.addEventListener("click", e => {
      const id = e.currentTarget.getAttribute("data-remove");
      removeFromCart(id);
      renderCartView();
    });
  });
  document.querySelectorAll("[data-qty]").forEach(input => {
    input.addEventListener("change", e => {
      const id = e.currentTarget.getAttribute("data-qty");
      let val = parseInt(e.currentTarget.value, 10);
      if (Number.isNaN(val) || val < 1) val = 1;
      cart[id] = val;
      saveCart(cart);
      refreshCartCount();
      renderCartView();
    });
  });
  document.getElementById("proceed-checkout").addEventListener("click", () => navigateTo("checkout"));
  document.getElementById("clear-cart").addEventListener("click", () => {
    if (confirm("Clear all items from cart?")) {
      cart = {};
      saveCart(cart);
      refreshCartCount();
      renderCartView();
    }
  });
}

/* Checkout view (summary only) */
function renderCheckoutView() {
  document.title = "Shopping Mart — Checkout";
  const items = Object.keys(cart).map(id => {
    const product = PRODUCTS.find(p => p.id === id);
    return { ...product, qty: cart[id] };
  });
  const total = items.reduce((s, i) => s + i.price * i.qty, 0);

  app.innerHTML = `
    <section class="view" aria-labelledby="checkout-title">
      <h1 id="checkout-title">Checkout Summary</h1>

      <div style="display:grid; grid-template-columns: 1fr 320px; gap:16px; margin-top:12px;">
        <div>
          <div class="checkout-form" aria-labelledby="delivery-title">
            <h2 id="delivery-title">Delivery Details (sample)</h2>
            <label for="name">Full name</label><br/>
            <input id="name" type="text" placeholder="Jane Doe" style="width:100%; padding:8px; margin-top:6px; margin-bottom:10px; border-radius:6px; border:1px solid #ddd;" />
            <label for="address">Address</label><br/>
            <input id="address" type="text" placeholder="House no, street, city" style="width:100%; padding:8px; margin-top:6px; margin-bottom:10px; border-radius:6px; border:1px solid #ddd;" />
            <label for="notes">Notes (optional)</label><br/>
            <textarea id="notes" rows="3" placeholder="Leave delivery notes" style="width:100%; padding:8px; margin-top:6px; border-radius:6px; border:1px solid #ddd;"></textarea>

            <p style="margin-top:12px;">
              <button class="btn" id="confirm-order">Confirm Order</button>
              <button class="btn secondary" id="back-to-cart">Back to Cart</button>
            </p>
          </div>
        </div>

        <aside>
          <div class="box">
            <h3>Order Summary</h3>
            <div id="summary-list">
              ${items.map(it => `<div style="display:flex;justify-content:space-between;margin-top:6px;"><div>${escapeHtml(it.name)} x ${it.qty}</div><div>$${(it.price*it.qty).toFixed(2)}</div></div>`).join("")}
            </div>
            <hr style="margin:10px 0;">
            <div style="display:flex;justify-content:space-between;"><strong>Total</strong><strong>$${total.toFixed(2)}</strong></div>
          </div>
        </aside>
      </div>
    </section>
  `;

  document.getElementById("confirm-order").addEventListener("click", () => {
    // Simple confirmation flow (no payment)
    const name = document.getElementById("name").value.trim();
    if (!name) {
      alert("Please enter your full name to proceed.");
      return;
    }
    // "Place order"
    const order = {
      id: "ORD" + Date.now(),
      name,
      address: document.getElementById("address").value.trim(),
      items,
      total,
      createdAt: new Date().toISOString()
    };
    // In a real app you'd send order to server. Here we simply clear cart and show confirmation.
    cart = {};
    saveCart(cart);
    refreshCartCount();
    app.innerHTML = `
      <section class="view">
        <h1>Thank you — Order Placed</h1>
        <p>Your order <strong>${order.id}</strong> has been placed.</p>
        <p><strong>Delivery for:</strong> ${escapeHtml(order.name)}</p>
        <p><strong>Total:</strong> $${order.total.toFixed(2)}</p>
        <p style="margin-top:14px;">
          <button class="btn" id="go-home">Back to Home</button>
          <button class="btn secondary" id="view-products">Continue Shopping</button>
        </p>
      </section>
    `;
    document.getElementById("go-home").addEventListener("click", () => navigateTo("home"));
    document.getElementById("view-products").addEventListener("click", () => navigateTo("products"));
  });

  document.getElementById("back-to-cart").addEventListener("click", () => navigateTo("cart"));
}

/* -------------------------
   Cart operations
   -------------------------*/
function addToCart(productId) {
  if (!cart[productId]) cart[productId] = 0;
  cart[productId] += 1;
  saveCart(cart);
  refreshCartCount();
  // small visual cue
  const btn = document.querySelector(`[data-add="${productId}"]`);
  if (btn) {
    btn.textContent = "Added ✓";
    setTimeout(() => { if (btn) btn.textContent = "Add"; }, 800);
  }
}

function removeFromCart(productId) {
  delete cart[productId];
  saveCart(cart);
  refreshCartCount();
}

/* -------------------------
   Navigation
   -------------------------*/
function navigateTo(view, opts = {}) {
  // update history state (simple)
  window.location.hash = view;
  route();
}

function route() {
  const hash = (window.location.hash || "#home").replace("#", "");
  const q = searchInput.value || "";
  if (hash === "" || hash === "home") {
    renderHome();
  } else if (hash === "products" || hash === "search") {
    renderProductsView(q);
  } else if (hash === "cart") {
    renderCartView();
  } else if (hash === "checkout") {
    renderCheckoutView();
  } else {
    renderHome();
  }
}

/* -------------------------
   Utility & event binding
   -------------------------*/
function escapeHtml(text) {
  return String(text).replace(/[&<>"']/g, function(m){ return ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' })[m]; });
}

/* DOM ready init */
function init() {
  // wire header buttons
  document.getElementById("nav-home").addEventListener("click", (e) => { e.preventDefault(); navigateTo("home"); });
  document.getElementById("nav-products").addEventListener("click", () => navigateTo("products"));
  document.getElementById("nav-cart").addEventListener("click", () => navigateTo("cart"));

  // search
  searchInput.addEventListener("keyup", (e) => {
    const q = e.target.value.trim();
    // if Enter pressed or quick live search:
    if (e.key === "Enter") {
      navigateTo("products");
    } else {
      // live filter on products page
      if ((window.location.hash || "#home") === "#products" || (window.location.hash || "#home") === "#search") {
        renderProductsView(q);
      }
    }
  });

  // initial render
  refreshCartCount();
  // route on load and on hash change
  window.addEventListener("hashchange", route);
  if (!window.location.hash) window.location.hash = "home";
  route();
}

document.addEventListener("DOMContentLoaded", init);
  
