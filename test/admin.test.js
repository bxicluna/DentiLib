const request = require("supertest");
const serverURL = "http://localhost:3000";
const VALID_PASSWORD = "TestPassword@1";

let tokenAdmin;
let dentisteId;
let prothesisteId;

beforeAll(async () => {
  await request(serverURL).post("/api/user/registerAdmin").send({
    email: "adm_admin@testdentilib.com",
    firstName: "Admin",
    lastName: "Test",
    password: VALID_PASSWORD,
  });

  const res = await request(serverURL).post("/api/user/login").send({
    email: "adm_admin@testdentilib.com",
    password: VALID_PASSWORD,
  });
  tokenAdmin = res.body.token;
});

afterAll(async () => {
  await request(serverURL)
    .delete("/api/user/deleteMyAccount")
    .set("Authorization", `Bearer ${tokenAdmin}`);
});

describe("POST /api/admin/createAccount — dentiste", () => {
  it("crée un dentiste valide", async () => {
    const res = await request(serverURL)
      .post("/api/admin/createAccount")
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send({
        firstName: "Thomas",
        lastName: "Brocher",
        email: "adm_dentiste@testdentilib.com",
        password: VALID_PASSWORD,
        role: "dentiste",
        siret: "12345678901234",
      });

    dentisteId = res.body.user?.id;
    expect(res.statusCode).toBe(201);
    expect(res.body.message).toBe("Dentiste créé");
    expect(res.body.user).toBeDefined();
  });

  it("refuse un email invalide", async () => {
    const res = await request(serverURL)
      .post("/api/admin/createAccount")
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send({
        firstName: "Thomas",
        lastName: "Brocher",
        email: "email_invalide",
        password: VALID_PASSWORD,
        role: "dentiste",
      });
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe("Le format de l'email est invalide");
  });

  it("refuse un prénom manquant", async () => {
    const res = await request(serverURL)
      .post("/api/admin/createAccount")
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send({
        lastName: "Brocher",
        email: "adm_dentiste2@testdentilib.com",
        password: VALID_PASSWORD,
        role: "dentiste",
      });
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe("Le prénom est requis");
  });

  it("refuse un nom manquant", async () => {
    const res = await request(serverURL)
      .post("/api/admin/createAccount")
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send({
        firstName: "Thomas",
        email: "adm_dentiste2@testdentilib.com",
        password: VALID_PASSWORD,
        role: "dentiste",
      });
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe("Le nom est requis");
  });

  it("refuse un mot de passe trop faible", async () => {
    const res = await request(serverURL)
      .post("/api/admin/createAccount")
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send({
        firstName: "Thomas",
        lastName: "Brocher",
        email: "adm_dentiste3@testdentilib.com",
        password: "123",
        role: "dentiste",
      });
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe(
      "Le mot de passe doit contenir au moins 12 caractères, une majuscule, un chiffre et un caractère spécial."
    );
  });

  it("refuse un rôle inexistant", async () => {
    const res = await request(serverURL)
      .post("/api/admin/createAccount")
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send({
        firstName: "Thomas",
        lastName: "Brocher",
        email: "adm_dentiste3@testdentilib.com",
        password: VALID_PASSWORD,
        role: "DENTISTE",
      });
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe("Ce rôle n'existe pas");
  });

  it("refuse un email déjà utilisé", async () => {
    const res = await request(serverURL)
      .post("/api/admin/createAccount")
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send({
        firstName: "Thomas",
        lastName: "Brocher",
        email: "adm_dentiste@testdentilib.com",
        password: VALID_PASSWORD,
        role: "dentiste",
      });
    expect(res.statusCode).toBe(409);
    expect(res.body.message).toBe("Email déjà utilisé");
  });

  it("refuse sans token", async () => {
    const res = await request(serverURL)
      .post("/api/admin/createAccount")
      .send({
        firstName: "Thomas",
        lastName: "Brocher",
        email: "adm_dentiste4@testdentilib.com",
        password: VALID_PASSWORD,
        role: "dentiste",
      });
    expect(res.statusCode).toBe(403);
  });
});

describe("POST /api/admin/createAccount — prothésiste", () => {
  it("crée un prothésiste lié à un dentiste", async () => {
    const res = await request(serverURL)
      .post("/api/admin/createAccount")
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send({
        firstName: "Martine",
        lastName: "Limon",
        email: "adm_prothesiste@testdentilib.com",
        password: VALID_PASSWORD,
        role: "prothesiste",
        siret: "12345678901234",
        dentisteId: dentisteId,
      });

    prothesisteId = res.body.prothesiste?.id;
    expect(res.statusCode).toBe(201);
    expect(res.body.message).toBe("Prothesiste créé et lié à un dentiste");
    expect(res.body.prothesiste).toBeDefined();
    expect(res.body.dentiste).toBeDefined();
  });

  it("refuse un prothésiste sans dentisteId", async () => {
    const res = await request(serverURL)
      .post("/api/admin/createAccount")
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send({
        firstName: "Martine",
        lastName: "Limon",
        email: "adm_prothesiste2@testdentilib.com",
        password: VALID_PASSWORD,
        role: "prothesiste",
      });
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe("dentisteId est necessaire pour un prothesiste");
  });

  it("refuse un prothésiste avec un dentisteId inexistant", async () => {
    const res = await request(serverURL)
      .post("/api/admin/createAccount")
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send({
        firstName: "Martine",
        lastName: "Limon",
        email: "adm_prothesiste3@testdentilib.com",
        password: VALID_PASSWORD,
        role: "prothesiste",
        dentisteId: 999999,
      });
    expect(res.statusCode).toBe(404);
    expect(res.body.message).toBe("Dentiste inexistant");
  });
});

describe("DELETE /api/user/deleteUser/:id", () => {
  it("supprime le compte d'un dentiste", async () => {
    const res = await request(serverURL)
      .delete(`/api/user/deleteUser/${dentisteId}`)
      .set("Authorization", `Bearer ${tokenAdmin}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe("Utilisateur supprimé avec succès");
  });

  it("supprime le compte d'un prothésiste", async () => {
    const res = await request(serverURL)
      .delete(`/api/user/deleteUser/${prothesisteId}`)
      .set("Authorization", `Bearer ${tokenAdmin}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe("Utilisateur supprimé avec succès");
  });

  it("refuse la suppression d'un utilisateur inexistant", async () => {
    const res = await request(serverURL)
      .delete("/api/user/deleteUser/999999")
      .set("Authorization", `Bearer ${tokenAdmin}`);
    expect(res.statusCode).toBe(404);
    expect(res.body.message).toBe("L'utilisateur n'existe pas");
  });
});
