const VALID_PASSWORD = "TestPassword@1";
const ADMIN_EMAIL = "cy_admin@testdentilib.com";

let adminToken;

describe("Page Admin — DentiLib", () => {
  before(() => {
    cy.createAdminAndLogin(ADMIN_EMAIL).then(({ token }) => {
      adminToken = token;
    });
  });

  after(() => {
    cy.deleteMyAccount(adminToken);
  });

  beforeEach(() => {
    cy.on("window:alert", () => false);
    cy.visitWithToken("/admin.html", adminToken, "admin");
  });

  // --- Affichage ---

  it("affiche le header avec le nom de l'admin et les boutons", () => {
    cy.get("#adminName").should("not.be.empty");
    cy.get("#openActList").should("exist");
    cy.get("#logout").should("exist");
  });

  it("affiche le tableau des utilisateurs", () => {
    cy.get("#mainUserTableBody").should("exist");
  });

  it("affiche le bouton d'ajout d'utilisateur", () => {
    cy.get("#openAddUserModal").should("contain", "Ajouter un utilisateur");
  });

  it("affiche les filtres de recherche", () => {
    cy.get("#type-filter").should("exist");
    cy.get("#recherche-text").should("exist");
  });

  // --- Modal ajout utilisateur ---

  it("ouvre la modal d'ajout en cliquant sur le bouton", () => {
    cy.get("#addUserModal").should("not.have.class", "active");
    cy.get("#openAddUserModal").click();
    cy.get("#addUserModal").should("have.class", "active");
  });

  it("ferme la modal en cliquant sur la croix", () => {
    cy.get("#openAddUserModal").click();
    cy.get("#addUserModal").should("have.class", "active");
    cy.get("#closeAddUserModal").click();
    cy.get("#addUserModal").should("not.have.class", "active");
  });

  it("ferme la modal en cliquant sur Annuler", () => {
    cy.get("#openAddUserModal").click();
    cy.get("#cancelAddUser").click();
    cy.get("#addUserModal").should("not.have.class", "active");
  });

  it("affiche le champ SIRET quand le rôle dentiste est sélectionné", () => {
    cy.get("#openAddUserModal").click();
    cy.get("#siretContainer").should("have.class", "hidden");
    cy.get("#role").select("dentiste");
    cy.get("#siretContainer").should("not.have.class", "hidden");
  });

  it("affiche le tableau des dentistes quand le rôle prothésiste est sélectionné", () => {
    cy.get("#openAddUserModal").click();
    cy.get("#dentisteContainer").should("have.class", "hidden");
    cy.get("#role").select("prothesiste");
    cy.get("#dentisteContainer").should("not.have.class", "hidden");
  });

  // --- Création d'un dentiste via le formulaire ---

  it("crée un dentiste via le formulaire et le voit apparaître dans le tableau", () => {
    cy.intercept("POST", "/api/admin/createAccount").as("createDentiste");
    cy.intercept("GET", "/api/admin/getUserWithoutAdmin").as("getUsers");

    cy.get("#openAddUserModal").click();
    cy.get("#firstName").type("Jean");
    cy.get("#lastName").type("Cypress");
    cy.get("#email").type("cy_dentiste@testdentilib.com");
    cy.get("#password").type(VALID_PASSWORD);
    cy.get("#role").select("dentiste");
    cy.get("#siret").type("12345678901234");
    cy.get("#addUserForm button[type='submit']").click();

    cy.wait("@createDentiste").its("response.statusCode").should("eq", 201);
    cy.wait("@getUsers");

    cy.get("#mainUserTableBody").should("contain", "Jean");

    // Nettoyage du dentiste créé
    cy.request("GET", "/api/admin/getAllDentistes", {}).then(() => {
      cy.request({
        method: "GET",
        url: "/api/admin/getUserWithoutAdmin",
        headers: { Authorization: `Bearer ${adminToken}` },
      }).then((res) => {
        const dentiste = res.body.find((u) => u.email === "cy_dentiste@testdentilib.com");
        if (dentiste) cy.deleteUser(dentiste.id, adminToken);
      });
    });
  });

  // --- Filtres ---

  it("filtre les utilisateurs par rôle", () => {
    cy.get("#type-filter").select("Dentiste");
    cy.get("#mainUserTableBody tr").each(($row) => {
      cy.wrap($row).find("td").eq(2).invoke("text").then((role) => {
        expect(role.toLowerCase()).to.include("dentiste");
      });
    });
  });

  // --- Logout ---

  it("déconnecte et redirige vers la page login", () => {
    cy.get("#logout").click();
    cy.url().should("include", "login.html");
    cy.window().then((win) => {
      expect(win.localStorage.getItem("token")).to.be.null;
    });
  });

  // --- Redirection si non authentifié ---

  it("redirige vers login.html si aucun token n'est présent", () => {
    cy.on("window:alert", () => false);
    cy.visit("/admin.html");
    cy.url().should("include", "login.html");
  });
});
