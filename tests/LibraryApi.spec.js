const { test, expect } = require("@playwright/test");

const API_BASE_URL = process.env.LIBRARY_API_BASE_URL || "http://216.10.245.166";

test("Library API adds, retrieves, and deletes a book", async ({ request }) => {
  const isbn = Math.random().toString(36).slice(2, 5);
  const aisle = String(Math.floor(Math.random() * 900) + 100);
  const bookName = `Playwright API Book ${isbn}`;
  const author = "Playwright Test";
  let bookId;
  let bookDeleted = false;

  const addResponse = await request.post(`${API_BASE_URL}/Library/Addbook.php`, {
    data: { name: bookName, isbn, aisle, author },
  });
  expect(addResponse.ok()).toBeTruthy();
  const addBody = await addResponse.json();
  bookId = addBody.ID;

  try {
    expect(addBody.Msg).toBe("successfully added");
    expect(bookId).toBe(`${isbn}${aisle}`);

    const getByIdResponse = await request.get(
      `${API_BASE_URL}/Library/GetBook.php?ID=${encodeURIComponent(bookId)}`
    );
    expect(getByIdResponse.ok()).toBeTruthy();
    const booksById = await getByIdResponse.json();
    expect(booksById).toContainEqual(
      expect.objectContaining({
        book_name: bookName,
        isbn,
        aisle,
      })
    );

    const getByAuthorResponse = await request.get(
      `${API_BASE_URL}/Library/GetBook.php?AuthorName=${encodeURIComponent(author)}`
    );
    expect(getByAuthorResponse.ok()).toBeTruthy();
    const booksByAuthor = await getByAuthorResponse.json();
    expect(Array.isArray(booksByAuthor)).toBeTruthy();
    expect(booksByAuthor).toContainEqual(
      expect.objectContaining({
        book_name: bookName,
        isbn,
        aisle,
      })
    );

    const deleteResponse = await request.post(`${API_BASE_URL}/Library/DeleteBook.php`, {
      data: { ID: bookId },
    });
    expect(deleteResponse.ok()).toBeTruthy();
    expect(await deleteResponse.json()).toMatchObject({
      msg: "book is successfully deleted",
    });
    bookDeleted = true;
  } finally {
    if (bookId && !bookDeleted) {
      await request.post(`${API_BASE_URL}/Library/DeleteBook.php`, {
        data: { ID: bookId },
      });
    }
  }
});