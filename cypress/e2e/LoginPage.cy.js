describe("Login page DentiLib", () => {
  beforeEach(() => {
    cy.visit("http://localhost:3000/");
  });

  // Tester l'affchage des éléments clés
  it("Affichage des elements cles de la page login", () => {
    cy.get("#email").should("exist");
    cy.get("#password").should("exist");
    cy.get("#submitButton").should("exist");
  });

  // Tester le formulaire vide
  it("Affichage d'une erreur lors du submit vide du formulaire", () => {
    cy.get("#submitButton").click();
    cy.get("#messageSystem").should("contain", "Tous les champs sont requis");
  });

  // Tester le formulaire avec un email au mauvais format
  it("Affichage d'une erreur lors de la saisis d'un email au mauvais format", () => {
    cy.get("#email").type("blandine");
    cy.get("#password").type("1234567");
    cy.get("#submitButton").click();
    cy.get("#messageSystem").should(
      "contain",
      "Le format de l'email est invalide"
    );
  });

  // Tester le formulaire avec un mot de passe trop court
  it("Affichage d'une erreur lors de la saisis d'un mot de passe trop court", () => {
    cy.get("#email").type("blandine@gmail.com");
    cy.get("#password").type("123");
    cy.get("#submitButton").click();
    cy.get("#messageSystem").should(
      "contain",
      "Le mot de passe doit contenir au moins 6 caractères"
    );
  });

  // Tester l'envoi d'une requete qui retourne faux
  it("Tester l'envoi d'une requete qui retourne faux", () => {
    cy.intercept("POST", "/api/user/login", {
      statusCode: 404,
      body: {
        message: "Email ou mot de passe incorrect",
      },
    }).as("loginRequest");

    cy.get("#email").type("blandine@gmail.com");
    cy.get("#password").type("123456");
    cy.get("#submitButton").click();

    cy.wait('@loginRequest');
    cy.get("#messageSystem").should(
      "contain",
      "Email ou mot de passe incorrect"
    );
  });

  // Tester la redirection ver la page admin.html lors de la connexion
  it("Tester la redirection après le login", () => {
    
    cy.get("#email").type("blandine@gmail.com");
    cy.get("#password").type("Admin123");
    cy.get("#submitButton").click();

    cy.url().should('include', 'admin.html')
  });
});
