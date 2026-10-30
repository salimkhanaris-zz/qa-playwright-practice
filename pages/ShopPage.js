class ShopPage {
  constructor(page) {
    this.page = page;
  }

  productByName(productName) {
    return this.page.getByRole("link", { name: productName, exact: true });
  }
}

module.exports = { ShopPage };