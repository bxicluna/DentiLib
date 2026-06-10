const BASE_URL = "http://localhost:3000";
const VALID_PASSWORD = "TestPassword@1";

// Crée un admin de test via l'API et retourne { token, email }
Cypress.Commands.add("createAdminAndLogin", (email) => {
  cy.request({ method: "POST", url: `${BASE_URL}/api/user/registerAdmin`, body: { email, firstName: "Test", lastName: "Admin", password: VALID_PASSWORD }, failOnStatusCode: false });
  return cy.request("POST", `${BASE_URL}/api/user/login`, { email, password: VALID_PASSWORD })
    .then((res) => ({ token: res.body.token, role: res.body.role }));
});

// Visite une page en injectant le token dans le localStorage avant que les scripts se chargent
Cypress.Commands.add("visitWithToken", (path, token, role) => {
  cy.visit(path, {
    onBeforeLoad(win) {
      win.localStorage.setItem("token", token);
      win.localStorage.setItem("role", role);
    },
  });
});

// Supprime le compte connecté (cleanup après tests)
Cypress.Commands.add("deleteMyAccount", (token) => {
  cy.request({
    method: "DELETE",
    url: `${BASE_URL}/api/user/deleteMyAccount`,
    headers: { Authorization: `Bearer ${token}` },
    failOnStatusCode: false,
  });
});

// Supprime un utilisateur par son id (cleanup après tests)
Cypress.Commands.add("deleteUser", (userId, token) => {
  cy.request({
    method: "DELETE",
    url: `${BASE_URL}/api/user/deleteUser/${userId}`,
    headers: { Authorization: `Bearer ${token}` },
    failOnStatusCode: false,
  });
});
