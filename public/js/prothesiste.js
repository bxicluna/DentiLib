const token = localStorage.getItem("token");
const role = localStorage.getItem("role");
const btnCatalogue = document.getElementById("catalogue");
const ProthesisteNameDiv = document.getElementById("prothesisteName");
const logoutButton = document.getElementById("logout");
const prothesisteTableBody = document.getElementById("prothesisteTableBody");
const patientFilterInput = document.querySelector(
  ".filters input[type='text']"
);
const statusFilterSelect = document.querySelector(".filters select");
const dateFilterInput = document.querySelector(".filters input[type='date']");
const dentisteNameDiv = document.getElementById("dentistName");
const patientFirstNameInput = document.getElementById("patientFirstName");
const patientLastNameInput = document.getElementById("patientLastName");

let allWorksheets = [];

// Token
if (!token || role !== "prothesiste" || isTokenExpired(token)) {
  localStorage.removeItem("token");
  localStorage.removeItem("role");

  alert("Session expirée, veuillez vous reconnecter");
  window.location.href = "/login.html";
} else {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    const prenom = payload.firstName || "Prothesiste";
    const nom = payload.lastName || "";
    const role = payload.role || "";
    // Mettre à jour le texte
    ProthesisteNameDiv.textContent = `🦷 ${prenom} ${nom} (${
      role.charAt(0).toUpperCase() + role.slice(1)
    })`;
  } catch (err) {
    console.error("Erreur récupération nom prothesiste depuis le token :", err);
  }
}

function isTokenExpired(token) {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    const now = Math.floor(Date.now() / 1000);
    return payload.exp < now;
  } catch (e) {
    return true; // token invalide
  }
}

// Bouton Gérer mon catalogue
btnCatalogue.addEventListener("click", () => {
  window.location.href = "/actesProthesistes.html";
});

// Bouton Déconnexion
logoutButton.addEventListener("click", () => {
  localStorage.removeItem("token");
  localStorage.removeItem("role");
  window.location.href = "/login.html"; // redirection vers la page login
});

// Bouton Détail
prothesisteTableBody.addEventListener("click", (e) => {
  const btn = e.target.closest(".btn-detail-worksheet");
  if (!btn) return;

  const worksheetId = btn.dataset.id;

  window.location.href = `worksheetDetail.html?id=${worksheetId}`;
});

// Fonction pour charger les fiches travaux du prothesiste
async function loadProthesisteWorksheet() {
  try {
    const res = await fetch("/api/worksheet/getWorksheetByUser", {
      headers: { Authorization: `Bearer ${token}` },
    });

    allWorksheets = await res.json();

    displayWorksheets(allWorksheets);
  } catch (error) {
    console.error("Erreur lors du chargement des fiches travaux", error);
  }
}

// Fonction pour afficher les fiches travaux du prothesiste
async function displayWorksheets(worksheets) {
  prothesisteTableBody.innerHTML = "";

  worksheets.forEach((ws) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${ws.numWorkSheet}</td>
      <td>${ws.patientFirstName} ${ws.patientLastName}</td>
      <td>${ws.dentisteId.firstName} ${ws.dentisteId.lastName}</td>
      <td>${formatDate(ws.createdAt)}</td>
      <td><span class="status-badge status-${ws.status
        .toLowerCase()
        .replace(" ", "-")}">${ws.status}</span></td>
      <td>${ws.total}</td>
      <td>
        <button class="btn btn-detail btn-detail-worksheet" data-id="${
          ws._id
        }">Détail</button>
      </td>
    `;
    prothesisteTableBody.appendChild(tr);
  });
}

// Fonction pour afficher la date sans les heures
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString("fr-FR");
}

// Listener pour les filtres
patientFilterInput.addEventListener("input", filterWorksheets);
statusFilterSelect.addEventListener("change", filterWorksheets);
dateFilterInput.addEventListener("change", filterWorksheets);

// Fonction pour les filtres
function filterWorksheets() {
  const patientFilter = patientFilterInput.value.trim().toLowerCase();
  const statusFilter = statusFilterSelect.value.trim().toLowerCase();
  const dateFilter = dateFilterInput.value;

  const filtered = allWorksheets.filter((ws) => {
    // Filtre patient (prenom nom)
    const fullName =
      `${ws.patientFirstName} ${ws.patientLastName}`.toLowerCase();

    const matchesPatient = !patientFilter || fullName.includes(patientFilter);

    // Filtre statut
    const statusNormalized = ws.status.toLowerCase();
    const matchesStatus = !statusFilter || statusNormalized === statusFilter;

    // Filtre date
    const wsDate = new Date(ws.createdAt).toISOString().split("T")[0];
    const matchesDate = !dateFilter || wsDate === dateFilter;

    return matchesPatient && matchesStatus && matchesDate;
  });

  displayWorksheets(filtered);
}

loadProthesisteWorksheet();
