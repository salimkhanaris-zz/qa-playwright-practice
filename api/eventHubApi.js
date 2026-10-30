const { randomUUID } = require("node:crypto");

const DEFAULT_API_BASE_URL = "https://api.eventhub.rahulshettyacademy.com/api";
const SHOP_APP_URL = "https://rahulshettyacademy.com/client";

class EventHubApi {
  constructor(request) {
    this.request = request;
    this.baseUrl = (
      process.env.EVENTHUB_API_BASE_URL || DEFAULT_API_BASE_URL
    ).replace(/\/$/, "");
  }

  get(path, { token, params } = {}) {
    return this.request.get(`${this.baseUrl}${path}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      params,
    });
  }

  post(path, data, { token } = {}) {
    return this.request.post(`${this.baseUrl}${path}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      data,
    });
  }

  put(path, data, { token } = {}) {
    return this.request.put(`${this.baseUrl}${path}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      data,
    });
  }

  delete(path, { token } = {}) {
    return this.request.delete(`${this.baseUrl}${path}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  }
}

/**
 * Resolves the login endpoint from whatever base URL the caller passes:
 * - an API base such as "https://rahulshettyacademy.com/api/ecom" is used as is;
 * - an app URL such as "https://rahulshettyacademy.com/client" has its API path derived.
 */
function resolveLoginUrl(baseURL) {
  const base = (baseURL || SHOP_APP_URL).replace(/\/+$/, "");
  if (/\/api(\/|$)/.test(base)) {
    return `${base}/auth/login`;
  }

  try {
    return `${new URL(base).origin}/api/ecom/auth/login`;
  } catch {
    return `${new URL(SHOP_APP_URL).origin}/api/ecom/auth/login`;
  }
}

class APIUtils {
  constructor(request, baseURL = SHOP_APP_URL) {
    if (!request || typeof request.post !== "function") {
      throw new Error(
        "APIUtils requires a Playwright APIRequestContext (use the `request` fixture or `page.request`)"
      );
    }

    this.request = request;
    this.baseURL = baseURL;
    this.loginUrl = resolveLoginUrl(baseURL);
  }

  async getToken(loginPayload) {
    const response = await this.request.post(this.loginUrl, {
      data: loginPayload,
    });

    const body = await response.text();

    if (!response.ok()) {
      throw new Error(
        `Login failed with status ${response.status()} from ${this.loginUrl}: ${body}`
      );
    }

    let payload;
    try {
      payload = JSON.parse(body);
    } catch {
      throw new Error(
        `Login returned a non-JSON response from ${this.loginUrl}: ${body.slice(0, 200)}`
      );
    }

    const token =
      payload.token || payload.accessToken || payload.data?.token || payload.data?.accessToken;

    if (!token) {
      throw new Error(`Login response did not contain a token: ${body}`);
    }

    return token;
  }
}

function makeTestUser() {
  const id = randomUUID();
  return {
    email: `eventhub.${id}@example.com`,
    password: `EventHub!${id.slice(0, 8)}9`,
  };
}

function makeEventPayload(overrides = {}) {
  const suffix = randomUUID().slice(0, 8);
  return {
    title: `EventHub QA Event ${suffix}`,
    description: `Automated API test event ${suffix}`,
    category: "Conference",
    venue: `QA Venue ${suffix}`,
    city: `QA City ${suffix}`,
    eventDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    price: 1500,
    totalSeats: 20,
    imageUrl: `https://example.com/eventhub-${suffix}.jpg`,
    ...overrides,
  };
}

module.exports = { EventHubApi, APIUtils, makeEventPayload, makeTestUser };