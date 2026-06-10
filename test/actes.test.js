const request = require("supertest");
const serverURL = "http://localhost:3000";
const VALID_PASSWORD = "TestPassword@1";

let tokenAdmin;
let tokenProthesiste;
let prothesisteId;
let userActeId;

beforeAll(async () => {
  // Créer et connecter l'admin
  await request(serverURL).post("/api/user/registerAdmin").send({
    email: "actes_admin@testdentilib.com",
    firstName: "Admin",
    lastName: "Actes",
    password: VALID_PASSWORD,
  });
  const adminRes = await request(serverURL).post("/api/user/login").send({
    email: "actes_admin@testdentilib.com",
    password: VALID_PASSWORD,
  });
  tokenAdmin = adminRes.body.token;

  // Créer un dentiste (nécessaire pour créer un prothésiste)
  const dentisteRes = await request(serverURL)
    .post("/api/admin/createAccount")
    .set("Authorization", `Bearer ${tokenAdmin}`)
    .send({
      firstName: "Jean",
      lastName: "Dentiste",
      email: "actes_dentiste@testdentilib.com",
      password: VALID_PASSWORD,
      role: "dentiste",
      siret: "12345678901234",
    });
  const dentisteId = dentisteRes.body.user?.id;

  // Créer un prothésiste lié au dentiste
  const prothesisteRes = await request(serverURL)
    .post("/api/admin/createAccount")
    .set("Authorization", `Bearer ${tokenAdmin}`)
    .send({
      firstName: "Marie",
      lastName: "Prothesiste",
      email: "actes_prothesiste@testdentilib.com",
      password: VALID_PASSWORD,
      role: "prothesiste",
      siret: "12345678901234",
      dentisteId,
    });
  prothesisteId = prothesisteRes.body.prothesiste?.id;

  // Connecter le prothésiste
  const prothRes = await request(serverURL).post("/api/user/login").send({
    email: "actes_prothesiste@testdentilib.com",
    password: VALID_PASSWORD,
  });
  tokenProthesiste = prothRes.body.token;

  // S'assurer qu'un acte existe dans le catalogue
  await request(serverURL)
    .post("/api/admin/createActe")
    .set("Authorization", `Bearer ${tokenAdmin}`)
    .send({ acteName: "Couronne céramique", acteDescription: "Pose d'une couronne en céramique" });
});

afterAll(async () => {
  await request(serverURL)
    .delete(`/api/user/deleteUser/${prothesisteId}`)
    .set("Authorization", `Bearer ${tokenAdmin}`);

  const dentisteRes = await request(serverURL)
    .get("/api/admin/getAllDentistes")
    .set("Authorization", `Bearer ${tokenAdmin}`);
  const dentiste = dentisteRes.body.find(d => d.email === "actes_dentiste@testdentilib.com");
  if (dentiste) {
    await request(serverURL)
      .delete(`/api/user/deleteUser/${dentiste.id}`)
      .set("Authorization", `Bearer ${tokenAdmin}`);
  }

  await request(serverURL)
    .delete("/api/user/deleteMyAccount")
    .set("Authorization", `Bearer ${tokenAdmin}`);
});

describe("POST /api/acte/addActe", () => {
  it("ajoute un acte au catalogue du prothésiste", async () => {
    const res = await request(serverURL)
      .post("/api/acte/addActe")
      .set("Authorization", `Bearer ${tokenProthesiste}`)
      .send({ acteName: "Couronne céramique", price: 350 });

    userActeId = res.body.userActe?.id;
    expect(res.statusCode).toBe(201);
    expect(res.body.message).toBe("Acte ajouté à votre catalogue");
    expect(res.body.userActe).toBeDefined();
  });

  it("refuse d'ajouter un acte déjà présent", async () => {
    const res = await request(serverURL)
      .post("/api/acte/addActe")
      .set("Authorization", `Bearer ${tokenProthesiste}`)
      .send({ acteName: "Couronne céramique", price: 350 });
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe("Cet acte est déjà dans votre catalogue");
  });

  it("refuse un acte inexistant dans le catalogue global", async () => {
    const res = await request(serverURL)
      .post("/api/acte/addActe")
      .set("Authorization", `Bearer ${tokenProthesiste}`)
      .send({ acteName: "Acte Inexistant XYZ", price: 100 });
    expect(res.statusCode).toBe(404);
    expect(res.body.message).toBe("Acte inexistant dans le catalogue");
  });

  it("refuse un prix manquant", async () => {
    const res = await request(serverURL)
      .post("/api/acte/addActe")
      .set("Authorization", `Bearer ${tokenProthesiste}`)
      .send({ acteName: "Couronne céramique" });
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe("Le prix est requis");
  });

  it("refuse un prix négatif", async () => {
    const res = await request(serverURL)
      .post("/api/acte/addActe")
      .set("Authorization", `Bearer ${tokenProthesiste}`)
      .send({ acteName: "Couronne céramique", price: -50 });
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe("Le prix doit être un nombre positif");
  });

  it("refuse sans token", async () => {
    const res = await request(serverURL)
      .post("/api/acte/addActe")
      .send({ acteName: "Couronne céramique", price: 350 });
    expect(res.statusCode).toBe(403);
  });
});

describe("GET /api/acte/getMyActes", () => {
  it("retourne les actes du prothésiste connecté", async () => {
    const res = await request(serverURL)
      .get("/api/acte/getMyActes")
      .set("Authorization", `Bearer ${tokenProthesiste}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it("refuse sans token", async () => {
    const res = await request(serverURL).get("/api/acte/getMyActes");
    expect(res.statusCode).toBe(403);
  });
});

describe("GET /api/acte/getProthesisteActes/:id", () => {
  it("retourne les actes d'un prothésiste par son ID", async () => {
    const res = await request(serverURL)
      .get(`/api/acte/getProthesisteActes/${prothesisteId}`)
      .set("Authorization", `Bearer ${tokenProthesiste}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.prothesisteName).toBeDefined();
    expect(Array.isArray(res.body.actesList)).toBe(true);
  });

  it("refuse un prothésiste inexistant", async () => {
    const res = await request(serverURL)
      .get("/api/acte/getProthesisteActes/999999")
      .set("Authorization", `Bearer ${tokenProthesiste}`);
    expect(res.statusCode).toBe(404);
    expect(res.body.message).toBe("Prothésiste introuvable");
  });
});

describe("PUT /api/acte/updateActe/:id", () => {
  it("met à jour le prix d'un acte", async () => {
    const res = await request(serverURL)
      .put(`/api/acte/updateActe/${userActeId}`)
      .set("Authorization", `Bearer ${tokenProthesiste}`)
      .send({ price: 400 });
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe("Prix mis à jour");
  });

  it("refuse un prix manquant", async () => {
    const res = await request(serverURL)
      .put(`/api/acte/updateActe/${userActeId}`)
      .set("Authorization", `Bearer ${tokenProthesiste}`)
      .send({});
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe("Le prix est requis");
  });
});

describe("DELETE /api/acte/deleteActe/:id", () => {
  it("supprime un acte du catalogue du prothésiste", async () => {
    const res = await request(serverURL)
      .delete(`/api/acte/deleteActe/${userActeId}`)
      .set("Authorization", `Bearer ${tokenProthesiste}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe("Acte supprimé");
  });

  it("refuse de supprimer un acte inexistant", async () => {
    const res = await request(serverURL)
      .delete("/api/acte/deleteActe/999999")
      .set("Authorization", `Bearer ${tokenProthesiste}`);
    expect(res.statusCode).toBe(404);
    expect(res.body.message).toBe("Acte introuvable dans votre catalogue");
  });
});
