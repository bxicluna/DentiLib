const VALID_PASSWORD = "TestPassword@1";
const ADMIN_EMAIL = "cy_dent_admin@testdentilib.com";

let adminToken;
let dentisteToken;
let dentisteId;
let prothesisteId;

describe("Page Dentiste — DentiLib", () => {
  before(() => {
    // Admin
    cy.createAdminAndLogin(ADMIN_EMAIL).then(({ token }) => {
      adminToken = token;

      // Dentiste
      cy.request({
        method: "POST",
        url: "/api/admin/createAccount",
        headers: { Authorization: `Bearer ${adminToken}` },
        body: { firstName: "Paul", lastName: "Dentiste", email: "cy_dent_dentiste@testdentilib.com", password: VALID_PASSWORD, role: "dentiste", siret: "12345678901234" },
      }).then((res) => {
        dentisteId = res.body.user?.id;

        // Prothésiste lié
        cy.request({
          method: "POST",
          url: "/api/admin/createAccount",
          headers: { Authorization: `Bearer ${adminToken}` },
          body: { firstName: "Claire", lastName: "Prothesiste", email: "cy_dent_proth@testdentilib.com", password: VALID_PASSWORD, role: "prothesiste", siret: "12345678901234", dentisteId },
        }).then((res2) => {
          prothesisteId = res2.body.prothesiste?.id;

          // Token dentiste
          cy.request("POST", "/api/user/login", { email: "cy_dent_dentiste@testdentilib.com", password: VALID_PASSWORD })
            .then((r) => { dentisteToken = r.body.token; });
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
    cy.visitWithToken("/dentiste.html", dentisteToken, "dentiste");
  });

  // --- Affichage ---

  it("affiche le header avec le bouton de déconnexion", () => {
    cy.get("#logout").should("exist").and("contain", "Déconnexion");
  });

  it("affiche le titre de la section", () => {
    cy.get("h2").should("contain", "Mes fiches de travaux");
  });

  it("affiche le bouton de création de fiche", () => {
    cy.get("#btnOpenCreate").should("contain", "Nouvelle fiche");
  });

  it("affiche le tableau des fiches", () => {
    cy.get("#dentisteTableBody").should("exist");
  });

  // --- Modal création de fiche ---

  it("ouvre la modal de création en cliquant sur le bouton", () => {
    cy.get("#createModal").should("not.have.class", "active");
    cy.get("#btnOpenCreate").click();
    cy.get("#createModal").should("have.class", "active");
  });

  it("ferme la modal en cliquant sur Annuler", () => {
    cy.get("#btnOpenCreate").click();
    cy.get("#createModal").should("have.class", "active");
    cy.get("#cancelAddWorksheet").click();
    cy.get("#createModal").should("not.have.class", "active");
  });

  it("ferme la modal en cliquant sur la croix", () => {
    cy.get("#btnOpenCreate").click();
    cy.get("#closeAddWorksheetModal").click();
    cy.get("#createModal").should("not.have.class", "active");
  });

  it("affiche les champs du formulaire patient", () => {
    cy.get("#btnOpenCreate").click();
    cy.get("#patientFirstName").should("exist");
    cy.get("#patientLastName").should("exist");
    cy.get("#patientEmail").should("exist");
    cy.get("#patientNumSecu").should("exist");
    cy.get("#comment").should("exist");
  });

  it("affiche le nom du prothésiste associé dans la modal", () => {
    cy.get("#btnOpenCreate").click();
    cy.get("#prothesisteName").should("not.be.empty");
  });

  // --- Création d'une fiche ---

  it("crée une fiche et la voit apparaître dans le tableau", () => {
    cy.intercept("POST", "/api/worksheet/createWorksheet").as("createWorksheet");
    cy.intercept("GET", "/api/worksheet/getWorksheetByUser").as("getWorksheets");

    cy.get("#btnOpenCreate").click();
    cy.get("#patientFirstName").type("Sophie");
    cy.get("#patientLastName").type("Dupont");
    cy.get("#patientEmail").type("sophie@mail.com");
    cy.get("#patientNumSecu").type("295067512312345");
    cy.get("#createWorksheetBtn").click();

    cy.wait("@createWorksheet").its("response.statusCode").should("eq", 201);
    cy.wait("@getWorksheets");

    cy.get("#dentisteTableBody").should("contain", "Sophie");
  });

  // --- Déconnexion ---

  it("déconnecte et redirige vers la page login", () => {
    cy.get("#logout").click();
    cy.url().should("include", "login.html");
  });
});
