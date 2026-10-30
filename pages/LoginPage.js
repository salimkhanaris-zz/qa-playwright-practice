class LoginPage {
  constructor(page) {
    this.page = page;
    this.usernameInput = page.getByRole("textbox", { name: "Username:" });
    this.passwordInput = page.getByRole("textbox", { name: "Password:" });
    this.termsCheckbox = page.getByRole("checkbox", {
      name: "I Agree to the terms and conditions",
    });
    this.signInButton = page.getByRole("button", { name: "Sign In" });
  }

  async open() {
    await this.page.goto("https://rahulshettyacademy.com/loginpagePractise");
  }

  async login(username, password) {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.termsCheckbox.check();

    await Promise.all([
      this.page.waitForURL("**/angularpractice/shop"),
      this.signInButton.click(),
    ]);
  }
}

module.exports = { LoginPage };