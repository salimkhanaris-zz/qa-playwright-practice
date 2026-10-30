const { test, expect } = require("@playwright/test");
const {
  EventHubApi,
  makeEventPayload,
  makeTestUser,
} = require("../api/eventHubApi");

async function createAuthenticatedUser(api) {
  const credentials = makeTestUser();
  const response = await api.post("/auth/register", credentials);
  expect(response.status()).toBe(201);

  const body = await response.json();
  expect(body.success).toBe(true);
  expect(body.token).toBeTruthy();

  return { ...credentials, token: body.token };
}

async function createEvent(api, token, payload = makeEventPayload()) {
  const response = await api.post("/events", payload, { token });
  expect(response.status()).toBe(201);
  const body = await response.json();
  expect(body.success).toBe(true);
  return body.data;
}

async function cleanUp(api, token, { bookingIds = [], eventIds = [] } = {}) {
  for (const bookingId of bookingIds) {
    try {
      await api.delete(`/bookings/${bookingId}`, { token });
    } catch {}
  }

  for (const eventId of eventIds) {
    try {
      await api.delete(`/events/${eventId}`, { token });
    } catch {}
  }
}

test.describe("EventHub API", () => {
  test("GET /health reports service and database status", async ({ request }) => {
    const api = new EventHubApi(request);
    const response = await api.get("/health");

    expect(response.status()).toBe(200);
    expect(await response.json()).toMatchObject({
      status: "ok",
      dbStatus: "connected",
    });
  });

  test("GET /config returns public feature flags", async ({ request }) => {
    const api = new EventHubApi(request);
    const response = await api.get("/config");

    expect(response.status()).toBe(200);
    expect(typeof (await response.json()).showExploreLinks).toBe("boolean");
  });

  test("register, login, and retrieve the authenticated user", async ({ request }) => {
    const api = new EventHubApi(request);
    const credentials = makeTestUser();

    const registerResponse = await api.post("/auth/register", credentials);
    expect(registerResponse.status()).toBe(201);
    const registered = await registerResponse.json();
    expect(registered).toMatchObject({
      success: true,
      user: { email: credentials.email },
    });
    expect(registered.token).toBeTruthy();

    const loginResponse = await api.post("/auth/login", credentials);
    expect(loginResponse.status()).toBe(200);
    const login = await loginResponse.json();
    expect(login).toMatchObject({
      success: true,
      user: { email: credentials.email },
    });
    expect(login.token).toBeTruthy();

    const meResponse = await api.get("/auth/me", { token: login.token });
    expect(meResponse.status()).toBe(200);
    expect(await meResponse.json()).toMatchObject({
      success: true,
      user: { email: credentials.email },
    });
  });

  test("auth endpoints reject invalid registration and login data", async ({ request }) => {
    const api = new EventHubApi(request);
    const credentials = makeTestUser();
    const validRegistration = await api.post("/auth/register", credentials);
    expect(validRegistration.status()).toBe(201);

    const invalidRegistrations = [
      { email: "not-an-email", password: "ValidPass!9" },
      { email: `missing.password.${Date.now()}@example.com` },
      { email: 42, password: false },
      credentials,
    ];

    for (const payload of invalidRegistrations) {
      const response = await api.post("/auth/register", payload);
      expect(response.status()).toBe(400);
    }

    const wrongPassword = await api.post("/auth/login", {
      email: credentials.email,
      password: "WrongPassword!9",
    });
    expect(wrongPassword.status()).toBe(400);

    const unknownUser = await api.post("/auth/login", {
      email: `unknown.${Date.now()}@example.com`,
      password: credentials.password,
    });
    expect(unknownUser.status()).toBe(400);
  });

  test("GET /auth/me rejects missing and invalid bearer tokens", async ({ request }) => {
    const api = new EventHubApi(request);
    const missingToken = await api.get("/auth/me");
    expect(missingToken.status()).toBe(401);

    const invalidToken = await api.get("/auth/me", { token: "invalid-token" });
    expect(invalidToken.status()).toBe(401);
  });

  test("events can be created, read, updated, and deleted", async ({ request }) => {
    const api = new EventHubApi(request);
    const { token } = await createAuthenticatedUser(api);
    const eventIds = [];

    try {
      const payload = makeEventPayload();
      const createResponse = await api.post("/events", payload, { token });
      expect(createResponse.status()).toBe(201);
      const createdBody = await createResponse.json();
      const createdEvent = createdBody.data;
      eventIds.push(createdEvent.id);

      expect(createdBody).toMatchObject({
        success: true,
        data: {
          title: payload.title,
          category: payload.category,
          totalSeats: payload.totalSeats,
          availableSeats: payload.totalSeats,
        },
      });

      const getResponse = await api.get(`/events/${createdEvent.id}`, { token });
      expect(getResponse.status()).toBe(200);
      expect((await getResponse.json()).data).toMatchObject({
        id: createdEvent.id,
        title: payload.title,
        city: payload.city,
      });

      const updatedPayload = { ...payload, title: `${payload.title} Updated` };
      const updateResponse = await api.put(
        `/events/${createdEvent.id}`,
        updatedPayload,
        { token }
      );
      expect(updateResponse.status()).toBe(200);
      expect((await updateResponse.json()).data.title).toBe(updatedPayload.title);

      const deleteResponse = await api.delete(`/events/${createdEvent.id}`, { token });
      expect(deleteResponse.status()).toBe(200);
      expect((await deleteResponse.json()).message).toBe("Event deleted successfully");

      const missingEvent = await api.get(`/events/${createdEvent.id}`, { token });
      expect(missingEvent.status()).toBe(404);
    } finally {
      await cleanUp(api, token, { eventIds });
    }
  });

  test("GET /events supports pagination, category, city, and search filters", async ({
    request,
  }) => {
    const api = new EventHubApi(request);
    const { token } = await createAuthenticatedUser(api);
    const eventIds = [];

    try {
      const suffix = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
      const firstPayload = makeEventPayload({
        title: `EventHub Search Needle ${suffix}`,
        category: "Conference",
      });
      const secondPayload = makeEventPayload({
        title: `EventHub Other Event ${suffix}`,
        category: "Concert",
      });
      const firstEvent = await createEvent(api, token, firstPayload);
      eventIds.push(firstEvent.id);
      const secondEvent = await createEvent(api, token, secondPayload);
      eventIds.push(secondEvent.id);

      const firstPageResponse = await api.get("/events", {
        token,
        params: { page: 1, limit: 1 },
      });
      expect(firstPageResponse.status()).toBe(200);
      const firstPage = await firstPageResponse.json();
      expect(firstPage.pagination).toMatchObject({ page: 1, limit: 1 });

      const secondPageResponse = await api.get("/events", {
        token,
        params: { page: 2, limit: 1 },
      });
      expect(secondPageResponse.status()).toBe(200);
      const secondPage = await secondPageResponse.json();
      expect(secondPage.pagination).toMatchObject({ page: 2, limit: 1 });
      expect(firstPage.data[0].id).not.toBe(secondPage.data[0].id);

      const filteredResponse = await api.get("/events", {
        token,
        params: {
          category: "Conference",
          city: firstPayload.city,
          search: `Needle ${suffix}`,
        },
      });
      expect(filteredResponse.status()).toBe(200);
      const filteredEvents = (await filteredResponse.json()).data;
      expect(filteredEvents.map((event) => event.id)).toContain(firstEvent.id);
      expect(filteredEvents.map((event) => event.id)).not.toContain(secondEvent.id);
    } finally {
      await cleanUp(api, token, { eventIds });
    }
  });

  test("event endpoints reject invalid payloads and unknown IDs", async ({ request }) => {
    const api = new EventHubApi(request);
    const { token } = await createAuthenticatedUser(api);
    const validPayload = makeEventPayload();
    const missingFields = await api.post("/events", { title: validPayload.title }, { token });
    expect(missingFields.status()).toBe(400);

    const wrongType = await api.post(
      "/events",
      { ...validPayload, price: "not-a-number" },
      { token }
    );
    expect(wrongType.status()).toBe(400);

    const unknownEventId = 999999999;
    const getResponse = await api.get(`/events/${unknownEventId}`, { token });
    expect(getResponse.status()).toBe(404);

    const updateResponse = await api.put(
      `/events/${unknownEventId}`,
      validPayload,
      { token }
    );
    expect(updateResponse.status()).toBe(404);

    const deleteResponse = await api.delete(`/events/${unknownEventId}`, { token });
    expect(deleteResponse.status()).toBe(404);
  });

  test("bookings support creation, lookup, listing, cancellation, and seat restoration", async ({
    request,
  }) => {
    const api = new EventHubApi(request);
    const { token } = await createAuthenticatedUser(api);
    let eventId;
    const bookingIds = [];
    const bookingReferences = [];

    try {
      const event = await createEvent(
        api,
        token,
        makeEventPayload({ totalSeats: 8 })
      );
      eventId = event.id;
      const initialSeats = event.availableSeats;

      for (const quantity of [2, 1]) {
        const createResponse = await api.post(
          "/bookings",
          {
            eventId,
            customerName: "EventHub API Test",
            customerEmail: `booking.${Date.now()}.${quantity}@example.com`,
            customerPhone: "+1-555-0100",
            quantity,
          },
          { token }
        );
        expect(createResponse.status()).toBe(201);
        const body = await createResponse.json();
        expect(body.success).toBe(true);
        expect(body.data).toMatchObject({
          eventId,
          quantity,
          status: "confirmed",
        });
        expect.soft(Number(body.data.totalPrice)).toBe(event.price * quantity);
        expect.soft(body.data.bookingRef).toMatch(/^E-[A-Z0-9]{6}$/);
        bookingIds.push(body.data.id);
        bookingReferences.push(body.data.bookingRef);
      }

      const filteredBookingsResponse = await api.get("/bookings", {
        token,
        params: { eventId, status: "confirmed", page: 1, limit: 1 },
      });
      expect(filteredBookingsResponse.status()).toBe(200);
      const firstPage = await filteredBookingsResponse.json();
      expect(firstPage.data).toHaveLength(1);
      expect(firstPage.pagination).toMatchObject({ page: 1, limit: 1, total: 2 });

      const secondPageResponse = await api.get("/bookings", {
        token,
        params: { eventId, status: "confirmed", page: 2, limit: 1 },
      });
      expect(secondPageResponse.status()).toBe(200);
      const secondPage = await secondPageResponse.json();
      expect(secondPage.data).toHaveLength(1);
      expect(firstPage.data[0].id).not.toBe(secondPage.data[0].id);

      const byReferenceResponse = await api.get(
        `/bookings/ref/${encodeURIComponent(bookingReferences[0])}`,
        { token }
      );
      expect(byReferenceResponse.status()).toBe(200);
      expect((await byReferenceResponse.json()).data.bookingRef).toBe(
        bookingReferences[0]
      );

      const byIdResponse = await api.get(`/bookings/${bookingIds[0]}`, { token });
      expect(byIdResponse.status()).toBe(200);
      expect((await byIdResponse.json()).data.id).toBe(bookingIds[0]);

      const afterBookingResponse = await api.get(`/events/${eventId}`, { token });
      expect(afterBookingResponse.status()).toBe(200);
      expect((await afterBookingResponse.json()).data.availableSeats).toBe(
        initialSeats - 3
      );

      for (const bookingId of bookingIds) {
        const cancelResponse = await api.delete(`/bookings/${bookingId}`, { token });
        expect(cancelResponse.status()).toBe(200);
        expect((await cancelResponse.json()).message).toBe("Booking cancelled");
      }

      const restoredEventResponse = await api.get(`/events/${eventId}`, { token });
      expect(restoredEventResponse.status()).toBe(200);
      expect((await restoredEventResponse.json()).data.availableSeats).toBe(
        initialSeats
      );

      expect((await api.get(`/bookings/${bookingIds[0]}`, { token })).status()).toBe(404);
      expect(
        (
          await api.get(`/bookings/ref/${encodeURIComponent(bookingReferences[0])}`, {
            token,
          })
        ).status()
      ).toBe(404);
    } finally {
      await cleanUp(api, token, {
        bookingIds,
        eventIds: eventId ? [eventId] : [],
      });
    }
  });

  test("booking endpoint rejects invalid fields, quantities, and event IDs", async ({
    request,
  }) => {
    const api = new EventHubApi(request);
    const { token } = await createAuthenticatedUser(api);
    let eventId;
    const bookingIds = [];

    try {
      const event = await createEvent(
        api,
        token,
        makeEventPayload({ totalSeats: 1 })
      );
      eventId = event.id;

      const validPayload = {
        eventId,
        customerName: "EventHub Invalid Case",
        customerEmail: `invalid.booking.${Date.now()}@example.com`,
        customerPhone: "+1-555-0101",
        quantity: 1,
      };

      const missingField = { ...validPayload };
      delete missingField.customerEmail;
      expect((await api.post("/bookings", missingField, { token })).status()).toBe(400);

      for (const quantity of [0, 11]) {
        const response = await api.post(
          "/bookings",
          { ...validPayload, quantity },
          { token }
        );
        expect(response.status()).toBe(400);
      }

      // The API coerces numeric strings, so quantity "1" is accepted (201).
      const wrongTypeQuantity = await api.post(
        "/bookings",
        { ...validPayload, quantity: "1" },
        { token }
      );
      expect(wrongTypeQuantity.status()).toBe(201);
      bookingIds.push((await wrongTypeQuantity.json()).data.id);

      const insufficientSeats = await api.post(
        "/bookings",
        { ...validPayload, quantity: 2 },
        { token }
      );
      expect(insufficientSeats.status()).toBe(400);

      const missingEvent = await api.post(
        "/bookings",
        { ...validPayload, eventId: 999999999 },
        { token }
      );
      expect(missingEvent.status()).toBe(404);
    } finally {
      await cleanUp(api, token, {
        bookingIds,
        eventIds: eventId ? [eventId] : [],
      });
    }
  });
});