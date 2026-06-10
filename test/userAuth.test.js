const request = require("supertest");
const serverURL = "http://localhost:3000";
const VALID_PASSWORD = "TestPassword@1";

let tokenAdmin;

describe("POST /api/user/registerAdmin", () => {
  it("crée un admin valide", async () => {
    const res = await request(serverURL).post("/api/user/registerAdmin").send({
      email: "auth_admin@testdentilib.com",
      firstName: "Admin",
      lastName: "Test",
      password: VALID_PASSWORD,
    });
    expect(res.statusCode).toBe(201);
    expect(res.body.admin.email).toBe("auth_admin@testdentilib.com");
  });

  it("refuse un email déjà utilisé", async () => {
    const res = await request(serverURL).post("/api/user/registerAdmin").send({
      email: "auth_admin@testdentilib.com",
      firstName: "Admin",
      lastName: "Test",
      password: VALID_PASSWORD,
    });
    expect(res.statusCode).toBe(409);
    expect(res.body.message).toBe("Email déjà utilisé");
  });

  it("refuse un email invalide", async () => {
    const res = await request(serverURL).post("/api/user/registerAdmin").send({
      email: "email_invalide",
      firstName: "Admin",
      lastName: "Test",
      password: VALID_PASSWORD,
    });
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe("Le format de l'email est invalide");
  });

  it("refuse un mot de passe trop faible", async () => {
    const res = await request(serverURL).post("/api/user/registerAdmin").send({
      email: "auth_admin2@testdentilib.com",
      firstName: "Admin",
      lastName: "Test",
      password: "123",
    });
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe(
      "Le mot de passe doit contenir au moins 12 caractères, une majuscule, un chiffre et un caractère spécial."
    );
  });

  it("refuse un prénom manquant", async () => {
    const res = await request(serverURL).post("/api/user/registerAdmin").send({
      email: "auth_admin2@testdentilib.com",
      lastName: "Test",
      password: VALID_PASSWORD,
    });
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe("Le prénom est requis");
  });

  it("refuse un nom manquant", async () => {
    const res = await request(serverURL).post("/api/user/registerAdmin").send({
      email: "auth_admin2@testdentilib.com",
      firstName: "Admin",
      password: VALID_PASSWORD,
    });
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe("Le nom est requis");
  });
});

describe("POST /api/user/login", () => {
  it("connecte un admin valide et retourne un token", async () => {
    const res = await request(serverURL).post("/api/user/login").send({
      email: "auth_admin@testdentilib.com",
      password: VALID_PASSWORD,
    });
    expect(res.statusCode).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.role).toBe("admin");
    tokenAdmin = res.body.token;
  });

  it("refuse un mot de passe incorrect", async () => {
    const res = await request(serverURL).post("/api/user/login").send({
      email: "auth_admin@testdentilib.com",
      password: "MauvaisMotDePasse@1",
    });
    expect(res.statusCode).toBe(401);
    expect(res.body.message).toBe("Mot de passe incorrect");
  });

  it("refuse un email inexistant", async () => {
    const res = await request(serverURL).post("/api/user/login").send({
      email: "inexistant@testdentilib.com",
      password: VALID_PASSWORD,
    });
    expect(res.statusCode).toBe(404);
    expect(res.body.message).toBe("L'utilisateur n'existe pas");
  });

  it("refuse un email vide", async () => {
    const res = await request(serverURL).post("/api/user/login").send({
      email: "",
      password: VALID_PASSWORD,
    });
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe("Le format de l'email est invalide");
  });

  it("refuse un mot de passe vide", async () => {
    const res = await request(serverURL).post("/api/user/login").send({
      email: "auth_admin@testdentilib.com",
      password: "",
    });
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe("Le mot de passe est requis");
  });
});

describe("DELETE /api/user/deleteMyAccount", () => {
  it("supprime le compte connecté", async () => {
    const res = await request(serverURL)
      .delete("/api/user/deleteMyAccount")
      .set("Authorization", `Bearer ${tokenAdmin}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe("Utilisateur supprimé avec succès");
  });

  it("refuse sans token", async () => {
    const res = await request(serverURL).delete("/api/user/deleteMyAccount");
    expect(res.statusCode).toBe(403);
    expect(res.body.message).toBe("Token manquant ou invalide");
  });

  it("refuse si le compte est déjà supprimé", async () => {
    const res = await request(serverURL)
      .delete("/api/user/deleteMyAccount")
      .set("Authorization", `Bearer ${tokenAdmin}`);
    expect(res.statusCode).toBe(404);
    expect(res.body.message).toBe("Admin inexistant");
  });
});
