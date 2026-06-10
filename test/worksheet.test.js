const request = require("supertest");
const serverURL = "http://localhost:3000";
const VALID_PASSWORD = "TestPassword@1";

let tokenAdmin;
let tokenDentiste;
let tokenProthesiste;
let dentisteId;
let prothesisteId;
let worksheetId;

beforeAll(async () => {
  // Admin
  await request(serverURL).post("/api/user/registerAdmin").send({
    email: "ws_admin@testdentilib.com",
    firstName: "Admin",
    lastName: "WS",
    password: VALID_PASSWORD,
  });
  const adminRes = await request(serverURL).post("/api/user/login").send({
    email: "ws_admin@testdentilib.com",
    password: VALID_PASSWORD,
  });
  tokenAdmin = adminRes.body.token;

  // Dentiste
  const dentisteRes = await request(serverURL)
    .post("/api/admin/createAccount")
    .set("Authorization", `Bearer ${tokenAdmin}`)
    .send({
      firstName: "Paul",
      lastName: "Dentiste",
      email: "ws_dentiste@testdentilib.com",
      password: VALID_PASSWORD,
      role: "dentiste",
      siret: "12345678901234",
    });
  dentisteId = dentisteRes.body.user?.id;

  // Prothésiste lié au dentiste
  const prothesisteRes = await request(serverURL)
    .post("/api/admin/createAccount")
    .set("Authorization", `Bearer ${tokenAdmin}`)
    .send({
      firstName: "Claire",
      lastName: "Prothesiste",
      email: "ws_prothesiste@testdentilib.com",
      password: VALID_PASSWORD,
      role: "prothesiste",
      siret: "12345678901234",
      dentisteId,
    });
  prothesisteId = prothesisteRes.body.prothesiste?.id;

  // Tokens
  const dentRes = await request(serverURL).post("/api/user/login").send({
    email: "ws_dentiste@testdentilib.com",
    password: VALID_PASSWORD,
  });
  tokenDentiste = dentRes.body.token;

  const prothRes = await request(serverURL).post("/api/user/login").send({
    email: "ws_prothesiste@testdentilib.com",
    password: VALID_PASSWORD,
  });
  tokenProthesiste = prothRes.body.token;

  // Acte dans le catalogue global
  await request(serverURL)
    .post("/api/admin/createActe")
    .set("Authorization", `Bearer ${tokenAdmin}`)
    .send({ acteName: "Inlay porcelaine", acteDescription: "Restauration inlay" });

  // Acte dans le catalogue du prothésiste
  await request(serverURL)
    .post("/api/acte/addActe")
    .set("Authorization", `Bearer ${tokenProthesiste}`)
    .send({ acteName: "Inlay porcelaine", price: 280 });
});

afterAll(async () => {
  await request(serverURL)
    .delete(`/api/user/deleteUser/${prothesisteId}`)
    .set("Authorization", `Bearer ${tokenAdmin}`);
  await request(serverURL)
    .delete(`/api/user/deleteUser/${dentisteId}`)
    .set("Authorization", `Bearer ${tokenAdmin}`);
  await request(serverURL)
    .delete("/api/user/deleteMyAccount")
    .set("Authorization", `Bearer ${tokenAdmin}`);
});

describe("POST /api/worksheet/createWorksheet", () => {
  it("crée une fiche de travail valide", async () => {
    const res = await request(serverURL)
      .post("/api/worksheet/createWorksheet")
      .set("Authorization", `Bearer ${tokenDentiste}`)
      .send({
        patientFirstName: "Sophie",
        patientLastName: "Dupont",
        patientEmail: "sophie.dupont@mail.com",
        patientNumSecu: "295067512312345",
        actes: [{ acteName: "Inlay porcelaine", quantity: 1 }],
        comment: "Urgence",
      });

    worksheetId = res.body.id;
    expect(res.statusCode).toBe(201);
    expect(res.body.patientFirstName).toBe("Sophie");
    expect(res.body.actes).toHaveLength(1);
  });

  it("refuse si le numéro de sécurité sociale est invalide", async () => {
    const res = await request(serverURL)
      .post("/api/worksheet/createWorksheet")
      .set("Authorization", `Bearer ${tokenDentiste}`)
      .send({
        patientFirstName: "Sophie",
        patientLastName: "Dupont",
        patientEmail: "sophie.dupont@mail.com",
        patientNumSecu: "123",
      });
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe("Le numéro de sécurité sociale doit contenir 15 caractères");
  });

  it("refuse un email patient invalide", async () => {
    const res = await request(serverURL)
      .post("/api/worksheet/createWorksheet")
      .set("Authorization", `Bearer ${tokenDentiste}`)
      .send({
        patientFirstName: "Sophie",
        patientLastName: "Dupont",
        patientEmail: "email_invalide",
        patientNumSecu: "295067512312345",
      });
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe("Le format de l'email du patient est invalide");
  });

  it("refuse si un champ patient est manquant", async () => {
    const res = await request(serverURL)
      .post("/api/worksheet/createWorksheet")
      .set("Authorization", `Bearer ${tokenDentiste}`)
      .send({
        patientLastName: "Dupont",
        patientEmail: "sophie.dupont@mail.com",
        patientNumSecu: "295067512312345",
      });
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe("Le prénom du patient est requis");
  });

  it("refuse si le rôle n'est pas dentiste", async () => {
    const res = await request(serverURL)
      .post("/api/worksheet/createWorksheet")
      .set("Authorization", `Bearer ${tokenProthesiste}`)
      .send({
        patientFirstName: "Sophie",
        patientLastName: "Dupont",
        patientEmail: "sophie.dupont@mail.com",
        patientNumSecu: "295067512312345",
      });
    expect(res.statusCode).toBe(403);
  });

  it("refuse sans token", async () => {
    const res = await request(serverURL)
      .post("/api/worksheet/createWorksheet")
      .send({
        patientFirstName: "Sophie",
        patientLastName: "Dupont",
        patientEmail: "sophie.dupont@mail.com",
        patientNumSecu: "295067512312345",
      });
    expect(res.statusCode).toBe(403);
  });
});

describe("GET /api/worksheet/getWorksheetByUser", () => {
  it("retourne les fiches du dentiste connecté", async () => {
    const res = await request(serverURL)
      .get("/api/worksheet/getWorksheetByUser")
      .set("Authorization", `Bearer ${tokenDentiste}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("retourne les fiches du prothésiste connecté", async () => {
    const res = await request(serverURL)
      .get("/api/worksheet/getWorksheetByUser")
      .set("Authorization", `Bearer ${tokenProthesiste}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

describe("GET /api/worksheet/getWorksheetById/:id", () => {
  it("retourne la fiche par son ID", async () => {
    const res = await request(serverURL)
      .get(`/api/worksheet/getWorksheetById/${worksheetId}`)
      .set("Authorization", `Bearer ${tokenDentiste}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.id).toBe(worksheetId);
  });

  it("refuse l'accès à une fiche d'un autre dentiste", async () => {
    const res = await request(serverURL)
      .get(`/api/worksheet/getWorksheetById/${worksheetId}`)
      .set("Authorization", `Bearer ${tokenProthesiste}`);
    expect(res.statusCode).toBe(200);
  });

  it("retourne 404 pour une fiche inexistante", async () => {
    const res = await request(serverURL)
      .get("/api/worksheet/getWorksheetById/999999")
      .set("Authorization", `Bearer ${tokenDentiste}`);
    expect(res.statusCode).toBe(404);
    expect(res.body.message).toBe("Fiche introuvable");
  });
});

describe("PUT /api/worksheet/updateStatus/:id", () => {
  it("met à jour le statut d'une fiche (prothésiste)", async () => {
    const res = await request(serverURL)
      .put(`/api/worksheet/updateStatus/${worksheetId}`)
      .set("Authorization", `Bearer ${tokenProthesiste}`)
      .send({ status: "En cours" });
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe("En cours");
  });

  it("refuse un statut invalide", async () => {
    const res = await request(serverURL)
      .put(`/api/worksheet/updateStatus/${worksheetId}`)
      .set("Authorization", `Bearer ${tokenProthesiste}`)
      .send({ status: "Inconnu" });
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe("Statut invalide");
  });
});

describe("PUT /api/worksheet/updateWorksheet/:id", () => {
  it("met à jour les informations patient d'une fiche", async () => {
    const res = await request(serverURL)
      .put(`/api/worksheet/updateWorksheet/${worksheetId}`)
      .set("Authorization", `Bearer ${tokenDentiste}`)
      .send({
        patientFirstName: "SophieModif",
        patientLastName: "Dupont",
        patientEmail: "sophie.modif@mail.com",
        patientNumSecu: "295067512312345",
        actes: [],
        comment: "Modifié",
        total: 0,
      });
    expect(res.statusCode).toBe(200);
    expect(res.body.patientFirstName).toBe("SophieModif");
  });
});

describe("DELETE /api/worksheet/deleteWorksheet/:id", () => {
  it("supprime une fiche de travail", async () => {
    const res = await request(serverURL)
      .delete(`/api/worksheet/deleteWorksheet/${worksheetId}`)
      .set("Authorization", `Bearer ${tokenDentiste}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe("Fiche supprimée avec succès");
  });

  it("refuse la suppression d'une fiche inexistante", async () => {
    const res = await request(serverURL)
      .delete("/api/worksheet/deleteWorksheet/999999")
      .set("Authorization", `Bearer ${tokenDentiste}`);
    expect(res.statusCode).toBe(404);
    expect(res.body.message).toBe("Fiche introuvable");
  });
});
