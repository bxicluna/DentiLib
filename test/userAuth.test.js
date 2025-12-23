const request = require("supertest");
let tokenAdmin;

const serverURL = "http://localhost:3000";

describe("POST - Create Admin", () => {
  // Test: création d'un admin valide
  it("Ce teste doit créer un nouvel admin", async () => {
    const res = await request(serverURL).post("/api/user/registerAdmin").send({
      email: "admin_test@gmail.com",
      firstName: "admin1",
      lastName: "adminNom",
      password: "Admin123",
    });

    expect(res.statusCode).toBe(201);
    expect(res.body.admin.email).toBe("admin_test@gmail.com");
  });

  // Test : création d'un admin avec un mail qui existe déjà
  it("Ce test doit retourner un message d'erreur en cas de création d'un admin avec un mail qui existe dejà", async () => {
    const res = await request(serverURL).post("/api/user/registerAdmin").send({
      email: "admin_test@gmail.com",
      firstName: "admin1",
      lastName: "adminNom",
      password: "Admin123",
    });

    expect(res.statusCode).toBe(409);
    expect(res.body.message).toBe("Email déjà utilisé");
  });

  // Test : création d'un admin avec un mail invalide
  it("Ce test doit doit retourner un message d'erreur en cas de création d'un admin avec un mail invalide", async () => {
    const res = await request(serverURL).post("/api/user/registerAdmin").send({
      email: "admin_test",
      firstName: "admin1",
      lastName: "adminNom",
      password: "Admin123",
    });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe("Le format de l'email est invalide");
  });

  // Test : création d'un admin avec un mot de passe < à 6 caractères
  it("Ce test doit retourner un message d'erreur en cas de mot de passe < 6 caractères", async () => {
    const res = await request(serverURL).post("/api/user/registerAdmin").send({
      email: "admin_test1@gmail.com",
      firstName: "admin1",
      lastName: "adminNom",
      password: "123",
    });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe(
      "Le mot de passe doit contenir au moins 6 caractères"
    );
  });
});

describe("POST - Login", () => {
  // Test: Login admin valide
  it("Ce test dois retourner un message de succès avec les infos requisent", async () => {
    const res = await request(serverURL).post("/api/user/login").send({
      email: "admin_test@gmail.com",
      password: "Admin123",
    });

    expect(res.statusCode).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.role).toBe("admin");

    tokenAdmin = res.body.token;
  });

  // Test: Login admin avec mot de passe invalide
  it("Ce test dois retourner un message d'erreur en cas de connexion avec un mauvais mot de passe", async () => {
    const res = await request(serverURL).post("/api/user/login").send({
      email: "admin_test@gmail.com",
      password: "Admin",
    });

    expect(res.statusCode).toBe(401);
    expect(res.body.message).toBe("Mot de passe incorrect");
  });

  // Test: Login admin avec email inexistant
  it("Ce test dois retourner un message d'erreur en cas de connexion avec un email inexistant", async () => {
    const res = await request(serverURL).post("/api/user/login").send({
      email: "admin_test5@gmail.com",
      password: "Admin123",
    });

    expect(res.statusCode).toBe(404);
    expect(res.body.message).toBe("L'utilisateur n'existe pas");
  });

  // Test: Login admin sans email
  it("Ce test dois retourner un message d'erreur en cas de connexion sans email", async () => {
    const res = await request(serverURL).post("/api/user/login").send({
      email: "",
      password: "Admin123",
    });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe("Merci de remplir tous les champs");
  });

  // Test: Login admin sans mot de passe
  it("Ce test dois retourner un message d'erreur en cas de connexion sans mot de passe", async () => {
    const res = await request(serverURL).post("/api/user/login").send({
      email: "admin_test@gmail.com",
      password: "",
    });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe("Merci de remplir tous les champs");
  });
});

describe("DELETE - Delete My account", () => {
  // Test: supprime le compte connecté
  it("Ce test dois retourner un message de succès lors de la suppression du compte connecté", async () => {
    const res = await request(serverURL)
      .delete("/api/user/deleteMyAccount")
      .set("Authorization", `Bearer ${tokenAdmin}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe("Utilisateur supprimé avec succès");
  });

  // Test: supprime le compte connecté sans saisir de token
  it("Ce test dois retourner un message d'erreur lors de la suppression du compte connecté sans saisir de token", async () => {
    const res = await request(serverURL)
      .delete("/api/user/deleteMyAccount")

    expect(res.statusCode).toBe(403);
    expect(res.body.message).toBe("Token manquant ou invalide");
  });

  // Test: supprimer un compte déjà supprimé
  it("Ce test dois retourner un message d'erreur lors de la suppression d'un compte déjà supprimé", async () => {
    const res = await request(serverURL)
      .delete("/api/user/deleteMyAccount")
      .set("Authorization", `Bearer ${tokenAdmin}`);

    expect(res.statusCode).toBe(404);
    expect(res.body.message).toBe("Admin inexistant");
  });
});
