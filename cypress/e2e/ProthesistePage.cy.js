const VALID_PASSWORD = "TestPassword@1";
const ADMIN_EMAIL = "cy_proth_admin@testdentilib.com";

let adminToken;
let dentisteId;
let prothesisteId;
let prothesisteToken;

describe("Page Prothésiste — DentiLib", () => {
  before(() => {
    cy.createAdminAndLogin(ADMIN_EMAIL).then(({ token }) => {
      adminToken = token;

      // Dentiste
      cy.request({
        method: "POST",
        url: "/api/admin/createAccount",
        headers: { Authorization: `Bearer ${adminToken}` },
        body: { firstName: "Marc", lastName: "Dentiste", email: "cy_proth_dentiste@testdentilib.com", password: VALID_PASSWORD, role: "dentiste", siret: "12345678901234" },
      }).then((res) => {
        dentisteId = res.body.user?.id;

        // Prothésiste lié
        cy.request({
          method: "POST",
          url: "/api/admin/createAccount",
          headers: { Authorization: `Bearer ${adminToken}` },
          body: { firstName: "Anne", lastName: "Prothesiste", email: "cy_proth_proth@testdentilib.com", password: VALID_PASSWORD, role: "prothesiste", siret: "12345678901234", dentisteId },
        }).then((res2) => {
          prothesisteId = res2.body.prothesiste?.id;

          cy.request("POST", "/api/user/login", { email: "cy_proth_proth@testdentilib.com", password: VALID_PASSWORD })
            .then((r) => { prothesisteToken = r.body.token; });
        });
      });
    });
  });

  after(() => {
    cy.deleteUser(prothesisteId, adminToken);
    cy.deleteUser(dentisteId, adminToken);
    cy.deleteMyAccount(adminToken);
  });

  beforeEach(() => {
    cy.visitWithToken("/prothesiste.html", prothesisteToken, "prothesiste");
  });

  // --- Affichage ---

  it("affiche le header avec les boutons", () => {
    cy.get("#logout").should("exist").and("contain", "Déconnexion");
    cy.get("#catalogue").should("exist").and("contain", "Gérer mon catalogue");
  });

  it("affiche le titre de la section", () => {
    cy.get("h2").should("contain", "Mes fiches de travaux");
  });

  it("affiche le tableau des fiches", () => {
    cy.get("#prothesisteTableBody").should("exist");
  });

  it("affiche les filtres", () => {
    cy.get(".filters").should("exist");
    cy.get(".filters select").should("exist");
    cy.get(".filters input[type='text']").should("exist");
  });

  // --- Navigation catalogue ---

  it("redirige vers la page catalogue en cliquant sur 'Gérer mon catalogue'", () => {
    cy.get("#catalogue").click();
    cy.url().should("include", "actesProthesistes.html");
  });

  // --- Déconnexion ---

  it("déconnecte et redirige vers la page login", () => {
    cy.get("#logout").click();
    cy.url().should("include", "login.html");
  });

  // --- Redirection si non authentifié ---

  it("redirige vers login.html si aucun token n'est présent", () => {
    cy.on("window:alert", () => false);
    cy.visit("/prothesiste.html");
    cy.url().should("include", "login.html");
  });

  // --- Mise à jour du statut d'une fiche (via API mockée) ---

  it("affiche les fiches reçues depuis l'API", () => {
    cy.intercept("GET", "/api/worksheet/getWorksheetByUser", {
      statusCode: 200,
      body: [
        {
          _id: "fake123",
          numWorkSheet: 1,
          patientFirstName: "Test",
          patientLastName: "Patient",
          dentisteId: { firstName: "Marc", lastName: "Dentiste" },
          createdAt: new Date().toISOString(),
          status: "En attente",
          total: 150,
        },
      ],
    }).as("getWorksheets");

    cy.visitWithToken("/prothesiste.html", prothesisteToken, "prothesiste");
    cy.wait("@getWorksheets");
    cy.get("#prothesisteTableBody").should("contain", "Test");
  });
});
