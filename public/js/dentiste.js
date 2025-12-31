const token = localStorage.getItem("token");
const role = localStorage.getItem("role");
const logoutButton = document.getElementById("logout");
const dentisteTableBody = document.getElementById("dentisteTableBody");
const addWorksheetButton = document.getElementById("btnOpenCreate");
const modal = document.getElementById("createModal");
const closeModalBtn = document.getElementById("closeAddWorksheetModal");
const cancelBtn = document.getElementById("cancelAddWorksheet");
const btnOpenCreate = document.getElementById("btnOpenCreate");
const actesContainer = document.getElementById("actesContainer");
const addActeBtn = document.getElementById("addActeBtn");
const totalAmount = document.getElementById("totalAmount");
const createWorksheetForm = document.getElementById("createWorksheetForm");
const prothesisteNameInput = document.getElementById("prothesisteName");
const createWorksheetBtn = document.getElementById("createWorksheetBtn");
const patientFirstNameInput = document.getElementById("patientFirstName");
const patientLastNameInput = document.getElementById("patientLastName");
const patientEmailInput = document.getElementById("patientEmail");
const patientNumSecuInput = document.getElementById("patientNumSecu");
const commentInput = document.getElementById("comment");
const patientFilterInput = document.querySelector(".filters input[type='text']");
const statusFilterSelect = document.querySelector(".filters select");
const dateFilterInput = document.querySelector(".filters input[type='date']");
const dentisteNameDiv = document.getElementById("dentistName");

let prothesiste = null;
let actesCatalogue = [];

if (!token || role !== "dentiste" || isTokenExpired(token)) {
  localStorage.removeItem("token");
  localStorage.removeItem("role");

  alert("Session expirée, veuillez vous reconnecter");
  window.location.href = "/login.html";
} else {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    const prenom = payload.firstName || "Dentiste";
    const nom = payload.lastName || "";
    const role = payload.role || "";
    // Mettre à jour le texte
    dentisteNameDiv.textContent = `👩‍⚕️ Dr. ${prenom} ${nom} (${
      role.charAt(0).toUpperCase() + role.slice(1)
    })`;
  } catch (err) {
    console.error("Erreur récupération nom dentiste depuis le token :", err);
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

patientFilterInput.addEventListener("input", filterWorksheets);
statusFilterSelect.addEventListener("change", filterWorksheets);
dateFilterInput.addEventListener("change", filterWorksheets);

let allWorksheets = []; // on stocke toutes les fiches chargées

async function loadDentistesWorksheet() {
  try {
    const res = await fetch("/api/worksheet/getWorksheetByUser", {
      headers: { Authorization: `Bearer ${token}` },
    });
    allWorksheets = await res.json(); // stocke toutes les fiches

    displayWorksheets(allWorksheets); // affichage initial
  } catch (error) {
    console.error("Erreur lors du chargement des fiches travaux", error);
  }
}

function displayWorksheets(worksheets) {
  dentisteTableBody.innerHTML = "";
console.log(worksheets)
  // Si liste vide
  if (!worksheets || worksheets.length === 0) {
    dentisteTableBody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align:center;color:#9ca3af;">
          Aucune fiche de travaux pour le moment
        </td>
      </tr>
    `;
    return;
  }

  worksheets.forEach(ws => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${ws.numWorkSheet}</td>
      <td>${ws.patientFirstName} ${ws.patientLastName}</td>
      <td>${formatDate(ws.createdAt)}</td>
      <td>${ws.prothesisteId.firstName} ${ws.prothesisteId.lastName}</td>
      <td><span class="status-badge status-${ws.status.toLowerCase().replace(" ", "-")}">${ws.status}</span></td>
      <td>${ws.total}</td>
      <td>
        <button class="btn btn-detail btn-detail-worksheet" data-id="${ws._id}">Détail</button>
      </td>
    `;
    dentisteTableBody.appendChild(tr);
  });
}

function filterWorksheets() {
  const patientFilter = patientFilterInput.value.trim().toLowerCase();
  const statusFilter = statusFilterSelect.value.trim().toLowerCase();
  const dateFilter = dateFilterInput.value; // format "yyyy-mm-dd"

  const filtered = allWorksheets.filter(ws => {
    // Filtre patient (nom ou prénom)
    const matchesPatient =
      ws.patientFirstName.toLowerCase().includes(patientFilter) ||
      ws.patientLastName.toLowerCase().includes(patientFilter);

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

// Fonction Déconnexion
logoutButton.addEventListener("click", () => {
  localStorage.removeItem("token");
  localStorage.removeItem("role");
  window.location.href = "/login.html"; // redirection vers la page login
});

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString("fr-FR");
}

// Ouvrir la popup
addWorksheetButton.addEventListener("click", () => {
  modal.classList.add("active");
  initCreateModal();
});

// Fermer la popup (X)
closeModalBtn.addEventListener("click", () => {
  modal.classList.remove("active");
});

// Fermer la popup (bouton Annuler)
cancelBtn.addEventListener("click", () => {
  modal.classList.remove("active");
});

function calculerTotal() {
  let total = 0;
  actesContainer.querySelectorAll(".acte-row").forEach((row) => {
    const price = parseFloat(row.querySelector(".actePrice").value) || 0;
    const quantity = parseInt(row.querySelector(".acteQuantity").value) || 0;
    total += price * quantity;
  });
  totalAmount.textContent = total.toFixed(2);
}

function addActeRow(actesCatalogue = []) {
  const row = document.createElement("div");
  row.classList.add("acte-row");

  row.innerHTML = `
    <select class="acteName" required>
      <option value="">Sélectionner un acte</option>
      ${actesCatalogue
        .map(
          (a) =>
            `<option value="${a._id}" data-price="${a.price}">${a.acte.acteName}</option>`
        )
        .join("")}
    </select>
    <input type="number" class="actePrice" value="" readonly />
    <input type="number" class="acteQuantity" value="1" min="1" required />
      <button type="button" class="btn-delete-acte">×</button>
    </div>
  `;

  // Gestion changement sélection acte
  const selectActe = row.querySelector(".acteName");
  const priceInput = row.querySelector(".actePrice");
  selectActe.addEventListener("change", () => {
    const selected = selectActe.selectedOptions[0];
    priceInput.value = selected.dataset.price || 0;
    calculerTotal();
  });

  // Gestion quantité
  row.querySelector(".acteQuantity").addEventListener("input", calculerTotal);

  // Bouton supprimer
  row.querySelector(".btn-delete-acte").addEventListener("click", () => {
    row.remove();
    calculerTotal();
  });

  actesContainer.appendChild(row);
  calculerTotal();
}

addActeBtn.addEventListener("click", () => addActeRow(actesCatalogue));

async function initCreateModal() {
  try {
    // Décoder token pour récupérer l'id du dentiste
    const payload = JSON.parse(atob(token.split(".")[1]));
    const dentisteId = payload.id;

    // Récupérer le dentiste avec populate de son prothésiste
    const res = await fetch(`/api/user/getUser/${dentisteId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const dentiste = await res.json();

    if (!dentiste.associatedUser) {
      alert("Aucun prothésiste associé !");
      return;
    }

    prothesiste = dentiste.associatedUser;
    actesCatalogue = prothesiste.actesList; // récupérer catalogue
    prothesisteNameInput.textContent = `${prothesiste.firstName} ${prothesiste.lastName}`;

    // Reset actes
    actesContainer.innerHTML = "";
    addActeRow(actesCatalogue); // au moins une ligne obligatoire
  } catch (err) {
    console.error("Erreur récupération catalogue prothésiste :", err);
  }
}

createWorksheetBtn.addEventListener("click", async () => {
  try {
    const actes = [];
    actesContainer.querySelectorAll(".acte-row").forEach((row) => {
      const select = row.querySelector(".acteName");
      const acteId = select.value;
      const acteName = select.selectedOptions[0].textContent; // ajouter le nom
      const price = parseFloat(row.querySelector(".actePrice").value);
      const quantity = parseInt(row.querySelector(".acteQuantity").value);

      if (acteId) actes.push({ acteId, acteName, price, quantity });
    });

    const body = {
      patientFirstName: patientFirstNameInput.value,
      patientLastName: patientLastNameInput.value,
      patientEmail: patientEmailInput.value,
      patientNumSecu: patientNumSecuInput.value,
      prothesisteId: prothesiste._id,
      actes,
      comment: commentInput.value,
      total: parseFloat(totalAmount.textContent),
    };

    await fetch("/api/worksheet/createWorksheet", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    //alert("Fiche créée avec succès !");
    createModal.classList.remove("active");
  } catch (err) {
    console.error("Erreur création fiche :", err);
  }
});

loadDentistesWorksheet();

dentisteTableBody.addEventListener("click", (e) => {
  const btn = e.target.closest(".btn-detail-worksheet");
  if (!btn) return;

  const worksheetId = btn.dataset.id;

  window.location.href = `worksheetDetail.html?id=${worksheetId}`;
});
