const request = require("supertest");
const app = require("../backend/server"); // path to your server.js file

describe("POST /upload", () => {
  it("should upload a file successfully", async () => {
    const res = await request(app)
      .post("/upload")
      .attach("file", "path/to/your/file.jpg");

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("File uploaded successfully!");
  });

  it("should return error if no file is provided", async () => {
    const res = await request(app).post("/upload");

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("No file uploaded");
  });
});