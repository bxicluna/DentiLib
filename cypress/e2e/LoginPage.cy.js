describe("Page de connexion — DentiLib", () => {
  beforeEach(() => {
    cy.visit("/");
  });

  // --- Affichage ---

  it("affiche les éléments clés de la page login", () => {
    cy.get("#email").should("exist");
    cy.get("#password").should("exist");
    cy.get("#submitButton").should("exist");
    cy.get("#messageSystem").should("exist");
  });

  it("affiche le titre de l'application", () => {
    cy.get("h1").should("contain", "Dentilib");
  });

  // --- Validation frontend ---

  it("affiche une erreur si le formulaire est soumis vide", () => {
    cy.get("#submitButton").click();
    cy.get("#messageSystem").should("contain", "Tous les champs sont requis");
  });

  it("affiche une erreur si l'email est au mauvais format", () => {
    cy.get("#email").type("emailinvalide");
    cy.get("#password").type("MonMotDePasse");
    cy.get("#submitButton").click();
    cy.get("#messageSystem").should("contain", "Le format de l'email est invalide");
  });

  it("affiche une erreur si le mot de passe est trop court (< 6 caractères)", () => {
    cy.get("#email").type("test@mail.com");
    cy.get("#password").type("123");
    cy.get("#submitButton").click();
    cy.get("#messageSystem").should("contain", "Le mot de passe doit contenir au moins 6 caractères");
  });

  // --- Réponses API (mockées) ---

  it("affiche le message d'erreur retourné par l'API si les identifiants sont incorrects", () => {
    cy.intercept("POST", "/api/user/login", {
      statusCode: 401,
      body: { message: "Mot de passe incorrect" },
    }).as("loginFail");

    cy.get("#email").type("user@mail.com");
    cy.get("#password").type("MonMotDePasse");
    cy.get("#submitButton").click();

    cy.wait("@loginFail");
    cy.get("#messageSystem").should("contain", "Mot de passe incorrect");
  });

  it("affiche le message d'erreur si l'utilisateur n'existe pas", () => {
    cy.intercept("POST", "/api/user/login", {
      statusCode: 404,
      body: { message: "L'utilisateur n'existe pas" },
    }).as("loginNotFound");

    cy.get("#email").type("inconnu@mail.com");
    cy.get("#password").type("MonMotDePasse");
    cy.get("#submitButton").click();

    cy.wait("@loginNotFound");
    cy.get("#messageSystem").should("contain", "L'utilisateur n'existe pas");
  });

  // --- Redirections (mockées) ---

  it("redirige vers admin.html après une connexion admin réussie", () => {
    cy.intercept("POST", "/api/user/login", {
      statusCode: 200,
      body: { token: "faketoken.admin.test", role: "admin" },
    }).as("loginAdmin");

    cy.get("#email").type("admin@mail.com");
    cy.get("#password").type("MonMotDePasse");
    cy.get("#submitButton").click();

    cy.wait("@loginAdmin");
    cy.url().should("include", "admin.html");
  });

  it("redirige vers dentiste.html après une connexion dentiste réussie", () => {
    cy.intercept("POST", "/api/user/login", {
      statusCode: 200,
      body: { token: "faketoken.dentiste.test", role: "dentiste" },
    }).as("loginDentiste");

    cy.get("#email").type("dentiste@mail.com");
    cy.get("#password").type("MonMotDePasse");
    cy.get("#submitButton").click();

    cy.wait("@loginDentiste");
    cy.url().should("include", "dentiste.html");
  });

  it("redirige vers prothesiste.html après une connexion prothésiste réussie", () => {
    cy.intercept("POST", "/api/user/login", {
      statusCode: 200,
      body: { token: "faketoken.prothesiste.test", role: "prothesiste" },
    }).as("loginProthesiste");

    cy.get("#email").type("prothesiste@mail.com");
    cy.get("#password").type("MonMotDePasse");
    cy.get("#submitButton").click();

    cy.wait("@loginProthesiste");
    cy.url().should("include", "prothesiste.html");
  });
});
