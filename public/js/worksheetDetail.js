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
const statusBadge = document.getElementById("statusBadge");
const logoutButton = document.getElementById("logout");
const btnRetour = document.getElementById("btnBack");

let actesCatalogue = []; // catalogue du prothésiste
let worksheet = null; // données complètes de la fiche

if (!token) {
  window.location.href = "/login.html";
}

async function loadWorksheet() {
  try {
    const res = await fetch(`/api/worksheet/getWorksheetById/${worksheetId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Erreur chargement fiche");

    worksheet = await res.json();

    numWorkSheetInput.value = worksheet.numWorkSheet;
    createdAtInput.value = new Date(worksheet.createdAt).toLocaleDateString(
      "fr-FR"
    );
    patientFirstNameInput.value = worksheet.patientFirstName;
    patientLastNameInput.value = worksheet.patientLastName;
    patientEmailInput.value = worksheet.patientEmail;
    patientNumSecuInput.value = worksheet.patientNumSecu;
    prothesisteNameInput.value = `${worksheet.prothesisteId.firstName} ${worksheet.prothesisteId.lastName}`;
    commentInput.value = worksheet.comment;
    statusBadge.className = ""; // reset les classes
    statusBadge.classList.add("badge");
    if (worksheet.status === "En cours") {
      statusBadge.classList.add("status-en-cours");
    } else if (worksheet.status === "Termine") {
      statusBadge.classList.add("status-termine");
    } else {
      statusBadge.classList.add("status-en-attente");
    }
    statusBadge.textContent = worksheet.status;

    actesContainer.innerHTML = "";
    worksheet.actes.forEach((acte) =>
      addActeRow({
        _id: acte.acteId,
        acte: { acteName: acte.acteName },
        price: acte.price,
        quantity: acte.quantity,
      })
    );

    calculerTotal();
  } catch (err) {
    console.error(err);
    alert("Impossible de charger la fiche");
  }
}

if (role == "dentiste") {
  // Rendre les elements éditables
  document.querySelectorAll(".editable").forEach((el) => {
    el.removeAttribute("readonly");
    el.removeAttribute("disabled");
  });

  // --- Ajouter acte vide ---
  addActeBtn.addEventListener("click", () => addActeRow());

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
}

// --- Ajouter/modifier un acte ---
function addActeRow(acte = {}) {
  const row = document.createElement("div");
  row.classList.add("acte-row");
  row.innerHTML = `
    <input type="text" class="acteName editable" value="${
      acte.acte?.acteName || ""
    }" required readonly />
    <input type="number" class="actePrice editable" value="${
      acte.price || 0
    }" min="0" required readonly />
    <input type="number" class="acteQuantity editable" value="${
      acte.quantity || 1
    }" min="1" required readonly />
    <button type="button" class="btn-delete-acte">×</button>`;
  if (role === "dentiste") {
    row.querySelector(".btn-delete-acte").addEventListener("click", () => {
      row.remove();
      calculerTotal();
    });
  }
  if (role === "prothesiste") {
    row.classList.add("no-delete");

    const deleteBtn = row.querySelector(".btn-delete-acte");
    deleteBtn?.remove();
  }

  row.querySelector(".acteQuantity").addEventListener("input", calculerTotal);
  row.querySelector(".actePrice").addEventListener("input", calculerTotal);

  actesContainer.appendChild(row);
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
