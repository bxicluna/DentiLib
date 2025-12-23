const request = require("supertest");
let tokenAdmin;
let dentisteId;
let prothesisteId
const serverURL = "http://localhost:3000";
const mongoose = (require('mongoose'))
const randomID = new mongoose.Types.ObjectId

beforeAll(async () => {
  const res = await request(serverURL).post("/api/user/login").send({
    email: "blandine@gmail.com",
    password: "Admin123",
  });

  tokenAdmin = res.body.token;
});

describe("POST - Create account", () => {
  // Test: Creation d'un dentiste valide
  it("Ce test dois retourner un message de succès avec les infos requisent", async () => {
    const res = await request(serverURL)
      .post("/api/admin/createAccount")
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send({
        firstName: "Thomas",
        lastName: "Brocher",
        email: "brocher@gmail.com",
        password: "Admin123",
        role: "dentiste",
        siret: "123456789",
      });

    dentisteId = res.body.user._id;

    expect(res.statusCode).toBe(201);
    expect(res.body.message).toBe("Dentiste créé");
    expect(res.body.user).toBeDefined()
  });

  // Test: Creation d'un dentiste avec un email invalide
  it("Ce test dois retourner un message d'erreur en cas de creation d'un dentiste avec un email invalide", async () => {
    const res = await request(serverURL)
      .post("/api/admin/createAccount")
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send({
        firstName: "Thomas",
        lastName: "Brocher",
        email: "brocher",
        password: "Admin123",
        role: "dentiste",
        siret: "123456789",
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe("Le format de l'email est invalide");
  });

  // Test: Creation d'un dentiste sans email
  it("Ce test dois retourner un message d'erreur en cas de creation d'un dentiste sans email", async () => {
    const res = await request(serverURL)
      .post("/api/admin/createAccount")
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send({
        firstName: "Thomas",
        lastName: "Brocher",
        password: "Admin123",
        role: "dentiste",
        siret: "123456789",
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe("Merci de remplir tous les champs");
  });

  // Test: Creation d'un dentiste sans firstName
  it("Ce test dois retourner un message d'erreur en cas de creation d'un dentiste sans firstName", async () => {
    const res = await request(serverURL)
      .post("/api/admin/createAccount")
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send({
        lastName: "Brocher",
        password: "Admin123",
        email: "brocher@gmail.com",
        role: "dentiste",
        siret: "123456789",
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe("Merci de remplir tous les champs");
  });

  // Test: Creation d'un dentiste sans lastname
  it("Ce test dois retourner un message d'erreur en cas de creation d'un dentiste sans lastname", async () => {
    const res = await request(serverURL)
      .post("/api/admin/createAccount")
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send({
        firstName: "Thomas",
        password: "Admin123",
        email: "brocher@gmail.com",
        role: "dentiste",
        siret: "123456789",
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe("Merci de remplir tous les champs");
  });

  // Test: Creation d'un dentiste sans password
  it("Ce test dois retourner un message d'erreur en cas de creation d'un dentiste sans password", async () => {
    const res = await request(serverURL)
      .post("/api/admin/createAccount")
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send({
        firstName: "Thomas",
        lastName: "Brocher",
        email: "brocher@gmail.com",
        role: "dentiste",
        siret: "123456789",
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe("Merci de remplir tous les champs");
  });

  // Test: Creation d'un dentiste sans role
  it("Ce test dois retourner un message d'erreur en cas de creation d'un dentiste sans role", async () => {
    const res = await request(serverURL)
      .post("/api/admin/createAccount")
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send({
        firstName: "Thomas",
        lastName: "Brocher",
        email: "brocher@gmail.com",
        password: "Admin123",
        siret: "123456789",
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe("Merci de remplir tous les champs");
  });

  // Test: Creation d'un dentiste avec un password < 6 caractères
  it("Ce test dois retourner un message d'erreur en cas de creation d'un dentiste avec un password < 6 caractères", async () => {
    const res = await request(serverURL)
      .post("/api/admin/createAccount")
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send({
        firstName: "Thomas",
        lastName: "Brocher",
        email: "brocher3@gmail.com",
        password: "123",
        role: "dentiste",
        siret: "123456789",
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe("Le mot de passe doit contenir au moins 6 caractères");
  });

  // Test: Creation d'un dentiste avec un email déjà existant
  it("Ce test dois retourner un message d'erreur en cas de creation d'un dentiste avec email déjà existant", async () => {
    const res = await request(serverURL)
      .post("/api/admin/createAccount")
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send({
        firstName: "Thomas",
        lastName: "Brocher",
        email: "brocher@gmail.com",
        password: "Admin123",
        role: "dentiste",
        siret: "123456789",
      });

    expect(res.statusCode).toBe(409);
    expect(res.body.message).toBe("Email déjà utilisé");
  });

  // Test: Creation d'un user avec un role incorrect
  it("Ce test dois retourner un message d'erreur en cas de creation d'un user avec un role incorrect", async () => {
    const res = await request(serverURL)
      .post("/api/admin/createAccount")
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send({
        firstName: "Thomas",
        lastName: "Brocher",
        email: "brocher3@gmail.com",
        password: "Admin123",
        role: "DENTISTE",
        siret: "123456789",
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe("Ce role n'existe pas");
  });

  // Test: Creation d'un prothesiste valide
  it("Ce test dois retourner un message de succès ainsi que les info requisent", async () => {
    const res = await request(serverURL)
      .post("/api/admin/createAccount")
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send({
        firstName: "Martine",
        lastName: "Limon",
        email: "limon@gmail.com",
        password: "Admin123",
        role: "prothesiste",
        siret: "123456789",
        dentisteId: dentisteId
      });

      prothesisteId = res.body.prothesiste._id;

    expect(res.statusCode).toBe(201);
    expect(res.body.message).toBe("Prothesiste créé et lié à un dentiste");
    expect(res.body.prothesiste).toBeDefined()
    expect(res.body.dentiste).toBeDefined()
  });

  // Test: Creation d'un prothesiste sans dentiste
  it("Ce test dois retourner un message d'erreur en cas de création d'un prothesiste sans dentiste", async () => {
    const res = await request(serverURL)
      .post("/api/admin/createAccount")
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send({
        firstName: "Martine",
        lastName: "Limon",
        email: "limon3@gmail.com",
        password: "Admin123",
        role: "prothesiste",
        siret: "123456789",
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe("dentisteId est necessaire pour un prothesiste");
  });

  // Test: Creation d'un prothesiste avec un dentisteId invalide
  it("Ce test dois retourner un message d'erreur en cas de création d'un prothesiste liè à un dentiste inexistant", async () => {
    const res = await request(serverURL)
      .post("/api/admin/createAccount")
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send({
        firstName: "Martine",
        lastName: "Limon",
        email: "limon3@gmail.com",
        password: "Admin123",
        role: "prothesiste",
        siret: "123456789",
        dentisteId: randomID
      });

    //expect(res.statusCode).toBe(404);
    expect(res.body.message).toBe("Dentiste inexistant");
  });
});

describe("DELETE - Delete user account", () => {
  // Test: supprime le compte d'un dentiste
  it("Ce test dois retourner un message de succès lors de la suppression du compte d'un dentiste'", async () => {
    const res = await request(serverURL)
      .delete(`/api/user/deleteUser/${dentisteId}`)
      .set("Authorization", `Bearer ${tokenAdmin}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe("Utilisateur supprimé avec succès");
  });

  // Test: supprime le compte d'un prothesiste
  it("Ce test dois retourner un message de succès lors de la suppression du compte d'un prothesiste'", async () => {
    const res = await request(serverURL)
      .delete(`/api/user/deleteUser/${prothesisteId}`)
      .set("Authorization", `Bearer ${tokenAdmin}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe("Utilisateur supprimé avec succès");
  });
});
