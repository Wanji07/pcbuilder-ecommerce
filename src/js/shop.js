const categoryButtons = document.querySelectorAll(".category-button");
const productCards = document.querySelectorAll(".product-card");
const brandFilter = document.querySelector("#brand-filter");
const availabilityFilter = document.querySelector("#availability-filter");
const productSearch = document.querySelector("#product-search");
const productCount = document.querySelector("#product-count");
const emptyState = document.querySelector("#empty-state");

let selectedCategory = "all";

// Combine the active category, sidebar filters, and search query for each card.
function updateProducts() {
    let visibleCount = 0;
    const searchTerm = productSearch.value.trim().toLowerCase();

    productCards.forEach((card) => {
        const matchesCategory =
            selectedCategory === "all" ||
            card.dataset.category === selectedCategory;
        const matchesBrand =
            brandFilter.value === "all" ||
            card.dataset.brand === brandFilter.value;
        const matchesAvailability =
            availabilityFilter.value === "all" ||
            card.dataset.availability === availabilityFilter.value;
        const matchesSearch =
            card.querySelector(".product-info").textContent
                .toLowerCase()
                .includes(searchTerm);
        const isVisible =
            matchesCategory &&
            matchesBrand &&
            matchesAvailability &&
            matchesSearch;

        card.hidden = !isVisible;
        if (isVisible) visibleCount += 1;
    });

    productCount.textContent = `Showing ${visibleCount} ${
        visibleCount === 1 ? "product" : "products"
    }`;
    emptyState.hidden = visibleCount !== 0;
}

// Keep the selected category visible to assistive technology as well as styling.
categoryButtons.forEach((button) => {
    button.addEventListener("click", () => {
        selectedCategory = button.dataset.category;

        categoryButtons.forEach((categoryButton) => {
            const isSelected =
                categoryButton.dataset.category === selectedCategory;
            categoryButton.classList.toggle("active", isSelected);
            categoryButton.setAttribute(
                "aria-pressed",
                String(isSelected),
            );
        });

        updateProducts();
    });
});

brandFilter.addEventListener("change", updateProducts);
availabilityFilter.addEventListener("change", updateProducts);
productSearch.addEventListener("input", updateProducts);

updateProducts();
