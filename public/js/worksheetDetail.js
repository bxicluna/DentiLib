const token = localStorage.getItem("token");
const role = localStorage.getItem("role");
const worksheetId = new URLSearchParams(window.location.search).get("id");

const numWorkSheetInput = document.getElementById("numWorkSheet");
const createdAtInput = document.getElementById("createdAt");
const patientFirstNameInput = document.getElementById("patientFirstName");
const patientLastNameInput = document.getElementById("patientLastName");
const patientEmailInput = document.getElementById("patientEmail");
const patientNumSecuInput = document.getElementById("patientNumSecu");
const prothesisteNameInput = document.getElementById("prothesisteName");
const actesContainer = document.getElementById("actesContainer");
const addActeBtn = document.getElementById("addActeBtn");
const commentInput = document.getElementById("comment");
const totalAmountInput = document.getElementById("totalAmount");
const btnSave = document.getElementById("btnSave");
const btnDelete = document.getElementById("btnDelete");
const statusSelect = document.getElementById("statusSelect");
const logoutButton = document.getElementById("logout");
const btnRetour = document.getElementById("btnBack");

let actesCatalogue = []; // catalogue du prothésiste
let worksheet = null; // données complètes de la fiche

// Token
if (
  !token ||
  (role !== "prothesiste" && role !== "dentiste") ||
  isTokenExpired(token)
) {
  localStorage.removeItem("token");
  localStorage.removeItem("role");

  alert("Session expirée, veuillez vous reconnecter");
  window.location.href = "/login.html";
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

async function loadWorksheet() {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    const userId = payload.id;

    // 1️⃣ Récupérer l'utilisateur connecté
    const resUser = await fetch(`/api/user/getUser/${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!resUser.ok) throw new Error("Erreur chargement utilisateur");
    const user = await resUser.json();

    // 2️⃣ Déterminer le catalogue d'actes
    if (role === "dentiste") {
      if (!user.associatedUser) {
        alert("Aucun prothésiste associé !");
        return;
      }

      actesCatalogue = user.associatedUser.actesList;
      prothesisteNameInput.value = `${user.associatedUser.firstName} ${user.associatedUser.lastName}`;
    }

    if (role === "prothesiste") {
      actesCatalogue = user.actesList;
      prothesisteNameInput.value = `${user.firstName} ${user.lastName}`;
    }

    console.log("CATALOGUE ACTES :", actesCatalogue);

    // 3️⃣ Charger la fiche de travail
    const resWorksheet = await fetch(
      `/api/worksheet/getWorksheetById/${worksheetId}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (!resWorksheet.ok) throw new Error("Erreur chargement fiche");

    worksheet = await resWorksheet.json();

    // 4️⃣ Remplir les champs
    numWorkSheetInput.value = worksheet.numWorkSheet;
    createdAtInput.value = new Date(worksheet.createdAt).toLocaleDateString(
      "fr-FR"
    );
    patientFirstNameInput.value = worksheet.patientFirstName;
    patientLastNameInput.value = worksheet.patientLastName;
    patientEmailInput.value = worksheet.patientEmail;
    patientNumSecuInput.value = worksheet.patientNumSecu;
    commentInput.value = worksheet.comment || "";

    updateStatusBadge(worksheet.status);

    // 5️⃣ Charger les actes existants
    actesContainer.innerHTML = "";

    worksheet.actes.forEach((acte) =>
      addActeRow(
        {
          acteName: acte.acteName, // ID du catalogue
          price: acte.price,
          quantity: acte.quantity,
        },
        true
      )
    );

    calculerTotal();
  } catch (err) {
    console.error(err);
    alert("Impossible de charger la fiche");
  }
}

// --- Ajouter/modifier un acte ---
function addActeRow(acte = {}, isExisting = true) {
  const row = document.createElement("div");
  row.classList.add("acte-row");

  // Si prothésiste, ajouter la classe no-delete
  if (role === "prothesiste") row.classList.add("no-delete");

  // Prix et nom depuis le catalogue
  let priceValue = "";
  let selectedId = "";

  if (isExisting) {
    const acteFromCatalogue = actesCatalogue.find(
      (a) => a._id.toString() === acte.acteName
    );
    if (acteFromCatalogue) {
      priceValue = acteFromCatalogue.price || acte.price || 0;
      selectedId = acteFromCatalogue._id;
    }
  }

  // Générer les options du select
  const optionsHTML = actesCatalogue
    .map((a) => {
      const label =
        typeof a.acte === "object" ? a.acte.acteName : "Acte inconnu";

      return `
      <option value="${a._id}" data-price="${a.price}"
        ${a._id.toString() === selectedId ? "selected" : ""}>
        ${label}
      </option>
    `;
    })
    .join("");
  row.innerHTML = `
    <select class="acteName" required>
      ${
        isExisting
          ? optionsHTML
          : `<option value="">Sélectionner un acte</option>` + optionsHTML
      }
    </select>
    <input type="number" class="actePrice" value="${priceValue}" readonly />
    <input type="number" class="acteQuantity" value="${
      acte.quantity || 1
    }" min="1" required />
    <button type="button" class="btn-delete-acte">×</button>
  `;

  const selectActe = row.querySelector(".acteName");
  const priceInput = row.querySelector(".actePrice");
  const quantityInput = row.querySelector(".acteQuantity");
  const deleteBtn = row.querySelector(".btn-delete-acte");

  if (role === "prothesiste") {
    // Désactiver champs et masquer croix
    selectActe.setAttribute("disabled", true);
    quantityInput.setAttribute("readonly", true);
    deleteBtn.style.display = "none";
  } else {
    // Événements pour dentiste
    selectActe.addEventListener("change", () => {
      const selected = actesCatalogue.find(
        (a) => a._id.toString() === selectActe.value
      );
      priceInput.value = selected?.price || 0;
      calculerTotal();
    });

    quantityInput.addEventListener("input", calculerTotal);

    deleteBtn.addEventListener("click", () => {
      row.remove();
      calculerTotal();
    });
  }

  actesContainer.appendChild(row);
  calculerTotal();
}

if (role == "dentiste") {
  // Rendre les elements éditables
  document.querySelectorAll(".editable").forEach((el) => {
    el.removeAttribute("readonly");
    el.removeAttribute("disabled");
  });

  statusSelect.setAttribute("disabled", true);

  // --- Ajouter acte vide ---
  addActeBtn.addEventListener("click", () => addActeRow({}, false));

  // --- Sauvegarder fiche ---
  btnSave.addEventListener("click", async () => {
    try {
      const actes = [];
      actesContainer.querySelectorAll(".acte-row").forEach((row) => {
        const acteName = row.querySelector(".acteName").value;
        const price = parseFloat(row.querySelector(".actePrice").value);
        const quantity = parseInt(row.querySelector(".acteQuantity").value);
        if (acteName) actes.push({ acteName, price, quantity });
      });

      const total = parseFloat(totalAmountInput.textContent) || 0;

      const body = {
        patientFirstName: patientFirstNameInput.value,
        patientLastName: patientLastNameInput.value,
        patientEmail: patientEmailInput.value,
        patientNumSecu: patientNumSecuInput.value,
        comment: commentInput.value,
        actes,
        total,
      };

      const res = await fetch(`/api/worksheet/updateWorksheet/${worksheetId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error("Erreur sauvegarde fiche");

      alert("Fiche mise à jour avec succès !");
      loadWorksheet();
    } catch (err) {
      console.error(err);
      alert("Impossible de sauvegarder la fiche");
    }
  });

  // --- Supprimer fiche ---
  btnDelete.addEventListener("click", async () => {
    if (!confirm("Voulez-vous vraiment supprimer cette fiche ?")) return;

    try {
      const res = await fetch(`/api/worksheet/deleteWorksheet/${worksheetId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Erreur suppression fiche");

      alert("Fiche supprimée !");
      window.location.href = "/dentiste.html";
    } catch (err) {
      console.error(err);
      alert("Impossible de supprimer la fiche");
    }
  });
}

if (role === "prothesiste") {
  // Empecher la modifications des champs
  document.querySelectorAll(".editable").forEach((el) => {
    el.setAttribute("readonly", true);
    el.setAttribute("disabled", true);
  });

  // On cache les actions
  document.getElementById("btnSave").style.display = "none";
  document.getElementById("btnDelete").style.display = "none";
  document.getElementById("addActeBtn").style.display = "none";

  statusSelect.removeAttribute("disabled");

  // écoute le changement de statut
  statusSelect.addEventListener("change", async (e) => {
    const newStatus = e.target.value;

    try {
      const res = await fetch(`/api/worksheet/updateStatus/${worksheetId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) throw new Error("Erreur mise à jour statut");

      // mettre à jour visuellement
      updateStatusBadge(newStatus);
    } catch (err) {
      console.error(err);
      alert("Impossible de changer le statut");
    }
  });
}

function updateStatusBadge(status) {
  statusSelect.className = "badge"; // reset

  // Ajout des classes selon valeur exacte
  if (status === "En cours") statusSelect.classList.add("status-en-cours");
  else if (status === "Terminé") statusSelect.classList.add("status-termine");
  else if (status === "En attente")
    statusSelect.classList.add("status-en-attente");

  statusSelect.value = status;

  switch (status) {
    case "En cours":
      statusSelect.classList.add("status-en-cours");
      //statusSelect.value = "en-cours";
      break;
    case "Termine":
      statusSelect.classList.add("status-termine");
      //statusSelect.value = "termine";
      break;
    case "En attente":
      statusSelect.classList.add("status-en-attente");
      //statusSelect.value = "en-attente";
      break;
    default:
      statusSelect.value = "en-attente";
      //statusSelect.classList.add("status-en-attente");
      break;
  }
}

// --- Ajouter/modifier un acte ---
function addActeRow(acte = {}, isExisting = true) {
  const row = document.createElement("div");
  row.classList.add("acte-row");

  // Si prothésiste, ajouter la classe no-delete
  if (role === "prothesiste") row.classList.add("no-delete");

  // Prix et nom depuis le catalogue
  let priceValue = "";
  let selectedId = "";

  if (isExisting) {
    const acteFromCatalogue = actesCatalogue.find(
      (a) => a._id.toString() === acte.acteName
    );
    if (acteFromCatalogue) {
      priceValue = acteFromCatalogue.price || acte.price || 0;
      selectedId = acteFromCatalogue._id;
    }
  }

  // Générer les options du select
  const optionsHTML = actesCatalogue
    .map(
      (a) =>
        `<option value="${a._id}" data-price="${a.price}" ${
          a._id.toString() === selectedId ? "selected" : ""
        }>${a.acte.acteName}</option>`
    )
    .join("");

  row.innerHTML = `
    <select class="acteName" required>
      ${
        isExisting
          ? optionsHTML
          : `<option value="">Sélectionner un acte</option>` + optionsHTML
      }
    </select>
    <input type="number" class="actePrice" value="${priceValue}" readonly />
    <input type="number" class="acteQuantity" value="${
      acte.quantity || 1
    }" min="1" required />
    <button type="button" class="btn-delete-acte">×</button>
  `;

  const selectActe = row.querySelector(".acteName");
  const priceInput = row.querySelector(".actePrice");
  const quantityInput = row.querySelector(".acteQuantity");
  const deleteBtn = row.querySelector(".btn-delete-acte");

  if (role === "prothesiste") {
    selectActe.setAttribute("disabled", true);
    quantityInput.setAttribute("readonly", true);
    deleteBtn.style.display = "none";
  } else {
    selectActe.addEventListener("change", () => {
      const selected = actesCatalogue.find(
        (a) => a._id.toString() === selectActe.value
      );
      priceInput.value = selected?.price || 0;
      calculerTotal();
    });

    quantityInput.addEventListener("input", calculerTotal);

    deleteBtn.addEventListener("click", () => {
      row.remove();
      calculerTotal();
    });
  }

  actesContainer.appendChild(row);
  calculerTotal();
}

// --- Calcul total ---
function calculerTotal() {
  let total = 0;
  actesContainer.querySelectorAll(".acte-row").forEach((row) => {
    const price = parseFloat(row.querySelector(".actePrice").value) || 0;
    const quantity = parseInt(row.querySelector(".acteQuantity").value) || 0;
    total += price * quantity;
  });
  totalAmountInput.textContent = total.toFixed(2);
}

// Fonction Déconnexion
logoutButton.addEventListener("click", () => {
  localStorage.removeItem("token");
  localStorage.removeItem("role");
  window.location.href = "/login.html"; // redirection vers la page login
});

// Fonction Retour
btnRetour.addEventListener("click", () => {
  if (role === "dentiste") {
    window.location.href = "/dentiste.html";
  }
  if (role === "prothesiste") {
    window.location.href = "/prothesiste.html";
  }
});

loadWorksheet();
