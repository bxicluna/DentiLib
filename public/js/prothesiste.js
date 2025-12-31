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
const loader = document.getElementById("worksheetLoader");
const emptyMessage = document.getElementById("emptyMessage");
const messageSystem = document.getElementById("messageSystem");

let allWorksheets = [];

// Token
function checkAuthAndInit() {
  if (!token || role !== "prothesiste" || isTokenExpired(token)) {
    localStorage.removeItem("token");
    localStorage.removeItem("role");

    showMessage("Session expirée, veuillez vous reconnecter");

    setTimeout(() => {
      window.location.href = "/login.html";
    }, 1500);

    return false;
  }

  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    const prenom = payload.firstName || "Prothesiste";
    const nom = payload.lastName || "";
    const userRole = payload.role || "";

    ProthesisteNameDiv.textContent = `🦷 ${prenom} ${nom} (${
      userRole.charAt(0).toUpperCase() + userRole.slice(1)
    })`;

    return true;
  } catch (err) {
    console.error("Erreur récupération nom prothesiste depuis le token :", err);
    showMessage("Erreur de session, veuillez vous reconnecter");
    return false;
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

// Fonction pour afficher les erreur au bon format
function showMessage(text, type = "error") {
  messageSystem.textContent = text;
  messageSystem.style.display = "block";

  if (type === "error") {
    messageSystem.style.color = "red";
  } else {
    messageSystem.style.color = "green";
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
    prothesisteTableBody.innerHTML = "";
    messageSystem.style.display = "none";

    const res = await fetch("/api/worksheet/getWorksheetByUser", {
      headers: { Authorization: `Bearer ${token}` },
    });

    // 1️⃣ Cas session expirée ou non autorisée
    if (res.status === 401) {
      localStorage.clear();
      showMessage("Session expirée, veuillez vous reconnecter");

      setTimeout(() => {
        window.location.href = "/login.html";
      }, 1500);
      return;
    }

    // 2️⃣ Cas autres erreurs HTTP
    if (!res.ok) {
      let errorMsg = "Erreur lors du chargement des fiches";
      try {
        const errorData = await res.json();
        errorMsg = errorData.message || errorMsg;
      } catch (e) {
        // si pas de JSON valide
        errorMsg = "Erreur serveur, veuillez réessayer plus tard";
      }
      showMessage(errorMsg);
      return;
    }

    // 3️⃣ Cas succès
    const data = await res.json();
    allWorksheets = data;
    displayWorksheets(allWorksheets);
  } catch (error) {
    console.error(error);
    showMessage("Erreur serveur, veuillez réessayer plus tard");
  }
}

// Fonction pour afficher les fiches travaux du prothesiste
async function displayWorksheets(worksheets) {
  prothesisteTableBody.innerHTML = "";

  // Si liste vide
  if (!worksheets || worksheets.length === 0) {
    prothesisteTableBody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align:center;color:#9ca3af;">
          Aucune fiche de travaux pour le moment
        </td>
      </tr>
    `;
    return;
  }

  // Si liste rempli

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

if (checkAuthAndInit()) {
  loadProthesisteWorksheet();
}
